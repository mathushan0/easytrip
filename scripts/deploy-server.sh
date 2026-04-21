#!/usr/bin/env bash
# =============================================================================
# EasyTrip — Deploy Server to AWS ECS
# =============================================================================
# Builds the Docker image, pushes to ECR, runs DB migrations, deploys to ECS.
# Can target staging or production.
#
# Usage:
#   ./scripts/deploy-server.sh [--env staging|production] [--skip-build] [--skip-migrate]
#
# Prerequisites:
#   - AWS CLI configured (aws configure or env vars)
#   - Docker running
#   - Correct AWS profile/permissions
#
# Environment variables (or pass via CLI):
#   AWS_REGION         (default: eu-west-1)
#   AWS_ACCOUNT_ID     (required — your 12-digit AWS account ID)
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
step()    { echo -e "\n${BLUE}── $* ──${NC}"; }

# ── Defaults ───────────────────────────────────────────────────────────────────
ENVIRONMENT="${DEPLOY_ENV:-staging}"
AWS_REGION="${AWS_REGION:-eu-west-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
SKIP_BUILD="false"
SKIP_MIGRATE="false"

# ── Parse args ─────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)           ENVIRONMENT="$2"; shift 2 ;;
    --skip-build)    SKIP_BUILD="true"; shift ;;
    --skip-migrate)  SKIP_MIGRATE="true"; shift ;;
    --help|-h)
      echo "Usage: $0 [--env staging|production] [--skip-build] [--skip-migrate]"
      exit 0
      ;;
    *) error "Unknown option: $1" ;;
  esac
done

# ── Validate ───────────────────────────────────────────────────────────────────
case "$ENVIRONMENT" in
  staging|production) ;;
  *) error "Invalid environment: $ENVIRONMENT (staging|production)" ;;
esac

# Production guard
if [[ "$ENVIRONMENT" == "production" ]]; then
  warn "⚠️  DEPLOYING TO PRODUCTION"
  warn "This will update the live API serving all users."
  echo ""
  read -p "Type 'deploy production' to continue: " CONFIRM
  if [[ "$CONFIRM" != "deploy production" ]]; then
    info "Cancelled."
    exit 0
  fi
fi

# ── Check prerequisites ────────────────────────────────────────────────────────
step "Checking prerequisites"

if ! command -v aws &>/dev/null; then
  error "AWS CLI not installed. Install: https://aws.amazon.com/cli/"
fi

if ! command -v docker &>/dev/null || ! docker info &>/dev/null; then
  error "Docker not running. Please start Docker."
fi

if [[ -z "$AWS_ACCOUNT_ID" ]]; then
  info "AWS_ACCOUNT_ID not set, detecting from AWS CLI..."
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null) || \
    error "Cannot detect AWS account. Ensure AWS credentials are configured."
fi

success "AWS Account: $AWS_ACCOUNT_ID"
success "Region: $AWS_REGION"
success "Environment: $ENVIRONMENT"

# ── Variables ──────────────────────────────────────────────────────────────────
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_REPO="easytrip-api"
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "manual")
IMAGE_TAG="${GIT_SHA}"
FULL_IMAGE="${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"
LATEST_TAG="${ECR_REGISTRY}/${ECR_REPO}:${ENVIRONMENT}-latest"

ECS_CLUSTER="easytrip-${ENVIRONMENT}"
ECS_SERVICE="easytrip-api-${ENVIRONMENT}"
MIGRATE_TASK="easytrip-migrate"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

info "Image: $FULL_IMAGE"
info "Cluster: $ECS_CLUSTER / Service: $ECS_SERVICE"
echo ""

# ── Step 1: Build Docker image ─────────────────────────────────────────────────
if [[ "$SKIP_BUILD" == "true" ]]; then
  warn "Skipping Docker build (--skip-build)"
else
  step "1 — Building Docker image"

  aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$ECR_REGISTRY"
  success "ECR login successful"

  docker build \
    --platform linux/amd64 \
    --build-arg BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --build-arg GIT_SHA="$GIT_SHA" \
    -t "$FULL_IMAGE" \
    -t "$LATEST_TAG" \
    -f server/Dockerfile \
    server/

  success "Image built: $FULL_IMAGE"

  step "2 — Pushing to ECR"
  docker push "$FULL_IMAGE"
  docker push "$LATEST_TAG"
  success "Pushed to ECR"
fi

# ── Step 3: Run DB migrations ──────────────────────────────────────────────────
if [[ "$SKIP_MIGRATE" == "true" ]]; then
  warn "Skipping DB migrations (--skip-migrate)"
else
  step "3 — Running DB migrations"

  # Get network config from existing service
  NETWORK_CONFIG=$(aws ecs describe-services \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE" \
    --query 'services[0].networkConfiguration' \
    --output json 2>/dev/null)

  if [[ -z "$NETWORK_CONFIG" || "$NETWORK_CONFIG" == "null" ]]; then
    warn "Could not get network config from service. Skipping migration task."
    warn "Run migrations manually: cd server && npm run db:migrate"
  else
    TASK_ARN=$(aws ecs run-task \
      --cluster "$ECS_CLUSTER" \
      --task-definition "$MIGRATE_TASK" \
      --launch-type FARGATE \
      --network-configuration "$NETWORK_CONFIG" \
      --overrides "{\"containerOverrides\":[{\"name\":\"migrate\",\"command\":[\"npm\",\"run\",\"db:migrate\"]}]}" \
      --query 'tasks[0].taskArn' \
      --output text 2>/dev/null) || warn "Could not run migration task — check manually"

    if [[ -n "${TASK_ARN:-}" && "$TASK_ARN" != "None" ]]; then
      info "Migration task: $TASK_ARN"
      info "Waiting for migration to complete..."

      aws ecs wait tasks-stopped \
        --cluster "$ECS_CLUSTER" \
        --tasks "$TASK_ARN" \
        --region "$AWS_REGION"

      EXIT_CODE=$(aws ecs describe-tasks \
        --cluster "$ECS_CLUSTER" \
        --tasks "$TASK_ARN" \
        --query 'tasks[0].containers[0].exitCode' \
        --output text)

      if [[ "$EXIT_CODE" != "0" ]]; then
        error "Migration task failed with exit code $EXIT_CODE. Deploy aborted."
      fi

      success "Migrations completed successfully"
    fi
  fi
fi

# ── Step 4: Deploy to ECS ──────────────────────────────────────────────────────
step "4 — Deploying to ECS"

aws ecs update-service \
  --cluster "$ECS_CLUSTER" \
  --service "$ECS_SERVICE" \
  --force-new-deployment \
  --deployment-configuration \
    "deploymentCircuitBreaker={enable=true,rollback=true},maximumPercent=200,minimumHealthyPercent=100" \
  --region "$AWS_REGION" \
  --output json > /dev/null

success "Deployment initiated"

step "5 — Waiting for service to stabilise (up to 10 min)"
info "You can Ctrl+C here — the deployment will continue on AWS."

aws ecs wait services-stable \
  --cluster "$ECS_CLUSTER" \
  --services "$ECS_SERVICE" \
  --region "$AWS_REGION" &

WAIT_PID=$!
DOTS=0
while kill -0 $WAIT_PID 2>/dev/null; do
  echo -n "."
  DOTS=$((DOTS + 1))
  sleep 5
  if [[ $DOTS -gt 120 ]]; then
    echo ""
    warn "Timeout waiting for stabilisation — check AWS console"
    break
  fi
done
echo ""

# ── Step 5: Health check ───────────────────────────────────────────────────────
step "6 — Health check"

if [[ "$ENVIRONMENT" == "production" ]]; then
  HEALTH_URL="https://api.easytrip.app/health"
else
  HEALTH_URL="https://api-staging.easytrip.app/health"
fi

info "Checking $HEALTH_URL ..."
for i in {1..10}; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  if [[ "$HTTP_STATUS" == "200" ]]; then
    success "Health check passed (HTTP 200)"
    break
  fi
  warn "Attempt $i: HTTP $HTTP_STATUS — retrying in 10s..."
  sleep 10
done

if [[ "$HTTP_STATUS" != "200" ]]; then
  warn "Health check did not return 200 — investigate in AWS console"
fi

step "✅ Deploy Complete"
echo ""
echo "  Commit:      $GIT_SHA"
echo "  Environment: $ENVIRONMENT"
echo "  Image:       $FULL_IMAGE"
echo ""
echo "  Monitor:  https://console.aws.amazon.com/ecs/home?region=$AWS_REGION#/clusters/$ECS_CLUSTER/services/$ECS_SERVICE"
echo "  Logs:     aws logs tail /easytrip/$ENVIRONMENT/api --follow"
