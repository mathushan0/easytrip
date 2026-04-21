# EasyTrip — Deployment Guide v1.0

**Produced by:** DevOps Engineer  
**Date:** 2026-04-21  
**Status:** Ready for use

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Local Development Setup](#3-local-development-setup)
4. [AWS Infrastructure (First-Time Setup)](#4-aws-infrastructure-first-time-setup)
5. [Server Deployment (ECS/Fargate)](#5-server-deployment-ecsFargate)
6. [iOS Deployment](#6-ios-deployment)
7. [Android Deployment](#7-android-deployment)
8. [CI/CD Pipelines](#8-cicd-pipelines)
9. [Environment Variables & Secrets](#9-environment-variables--secrets)
10. [Database Migrations](#10-database-migrations)
11. [Monitoring & Alerting](#11-monitoring--alerting)
12. [Rollback Procedures](#12-rollback-procedures)
13. [Cost Management](#13-cost-management)
14. [Runbooks](#14-runbooks)

---

## 1. Overview

EasyTrip runs on:

| Component | Platform | Notes |
|---|---|---|
| API Server | AWS ECS Fargate (eu-west-1) | 2 tasks min, auto-scales to 20 |
| Social Agent | AWS ECS Fargate (eu-west-1) | 1–5 tasks, scales on queue depth |
| Database | AWS RDS PostgreSQL 16 (Multi-AZ) | Via RDS Proxy for connection pooling |
| Cache / Queue | AWS ElastiCache Redis 7 | 2-node, auto-failover |
| File Storage | AWS S3 + CloudFront | media.easytrip.app |
| iOS App | Apple App Store + TestFlight | EAS Build + Submit |
| Android App | Google Play Store | EAS Build + Submit |
| Mobile CI/CD | Expo EAS | Builds, OTA updates, submissions |
| Server CI/CD | GitHub Actions → ECR → ECS | Blue/green deployment |

**Environments:**

| Environment | API URL | Branch |
|---|---|---|
| Local dev | http://localhost:3000 | any |
| Staging | https://api-staging.easytrip.app | develop / PRs |
| Production | https://api.easytrip.app | main (after approval) |

---

## 2. Prerequisites

### Developer machine

```bash
# Required tools
node >= 22 (via nvm recommended)
npm >= 10
docker + docker compose
git
aws-cli v2
terraform >= 1.7 (for infra changes)

# Mobile specific
Xcode >= 16 (macOS only, for iOS simulator + code signing)
Android Studio (for Android emulator)
eas-cli (npm install -g eas-cli)

# Verify
node --version    # v22.x.x
aws --version     # aws-cli/2.x.x
terraform version # Terraform v1.7.x
eas --version     # eas-cli/x.x.x
```

### Accounts required

| Service | URL | Purpose |
|---|---|---|
| AWS | https://console.aws.amazon.com | All server infra |
| Expo (EAS) | https://expo.dev | Mobile builds & OTA |
| Apple Developer | https://developer.apple.com | iOS distribution |
| Google Play Console | https://play.google.com/console | Android distribution |
| Supabase | https://supabase.com | Auth |
| Sentry | https://sentry.io | Error tracking |

---

## 3. Local Development Setup

The fastest way to get running:

```bash
# 1. Clone the repository
git clone https://github.com/your-org/easytrip.git
cd easytrip

# 2. Run the setup script (does everything)
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Fill in your credentials
#    Required at minimum: SUPABASE_*, ANTHROPIC_API_KEY, GOOGLE_*
nano server/.env

# 4. Start the server
cd server && npm run dev

# 5. Start the mobile app (new terminal)
npm start
# Press 'i' for iOS simulator, 'a' for Android emulator
```

### What setup.sh does

1. Checks Node 22+, Docker running
2. Installs all npm dependencies (root + server)
3. Creates `.env` and `server/.env` from examples
4. Starts PostgreSQL, Redis, LibreTranslate via Docker Compose
5. Runs Drizzle migrations
6. Installs EAS CLI globally
7. Verifies the server TypeScript builds

### Manual setup (if the script fails)

```bash
# Dependencies
npm install
cd server && npm install && cd ..

# Environment files
cp .env.example .env
cp server/.env.example server/.env
# Fill in credentials in server/.env

# Start services
docker compose -f infra/docker-compose.prod.yml --profile local up -d postgres redis libretranslate

# Migrations
cd server && npm run db:migrate && cd ..

# Start server
cd server && npm run dev
# Start mobile (separate terminal)
npm start
```

---

## 4. AWS Infrastructure (First-Time Setup)

This section is run **once per environment** by the person setting up AWS.  
After this, deployments are automated via GitHub Actions.

### 4.1 Bootstrap: Terraform state bucket

Before running Terraform, create the S3 state bucket manually:

```bash
# Set your AWS account details
export AWS_REGION=eu-west-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create state bucket
aws s3 mb s3://easytrip-terraform-state --region $AWS_REGION

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket easytrip-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket easytrip-terraform-state \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name easytrip-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $AWS_REGION
```

### 4.2 ACM Certificate

The ALB needs an SSL certificate. Request it before running Terraform:

```bash
# Request certificate for your domain
aws acm request-certificate \
  --domain-name "api.easytrip.app" \
  --subject-alternative-names "api-staging.easytrip.app" "*.easytrip.app" \
  --validation-method DNS \
  --region eu-west-1

# Note the CertificateArn from output
# Complete DNS validation in your DNS provider (Route 53 or external)
# Wait for status = ISSUED before continuing
aws acm describe-certificate --certificate-arn arn:aws:acm:... --region eu-west-1
```

### 4.3 Deploy staging infrastructure

```bash
cd infra/terraform

# Create staging tfvars (never commit this file!)
cat > staging.tfvars <<EOF
environment     = "staging"
certificate_arn = "arn:aws:acm:eu-west-1:ACCOUNT_ID:certificate/YOUR_CERT_ID"
db_password     = "$(openssl rand -base64 32)"
api_image       = "placeholder/easytrip-api:latest"
EOF

# Initialise
terraform init

# Preview
terraform plan -var-file="staging.tfvars"

# Apply (takes ~15 minutes)
terraform apply -var-file="staging.tfvars"

# Save outputs — you'll need these for GitHub secrets
terraform output
```

### 4.4 Deploy production infrastructure

```bash
cat > production.tfvars <<EOF
environment       = "production"
certificate_arn   = "arn:aws:acm:eu-west-1:ACCOUNT_ID:certificate/YOUR_CERT_ID"
db_password       = "$(openssl rand -base64 32)"  # Save this securely!
db_instance_class = "db.t4g.medium"
api_desired_count = 2
EOF

terraform workspace new production
terraform plan -var-file="production.tfvars"
terraform apply -var-file="production.tfvars"
```

### 4.5 DNS configuration

After Terraform creates the ALB, add DNS records:

```
# In your DNS provider (e.g. Route 53, Cloudflare):

api.easytrip.app         CNAME  → [ALB DNS name from terraform output alb_dns_name]
api-staging.easytrip.app CNAME  → [ALB DNS name from terraform output alb_dns_name]
```

### 4.6 Populate secrets in AWS Secrets Manager

```bash
# Set all API keys — these are injected into ECS tasks at runtime
# Replace "staging" with "production" for prod environment

ENV="staging"  # or "production"

aws secretsmanager create-secret \
  --name "easytrip-${ENV}/supabase/service-role-key" \
  --secret-string "eyJ..."

aws secretsmanager create-secret \
  --name "easytrip-${ENV}/anthropic/api-key" \
  --secret-string "sk-ant-..."

aws secretsmanager create-secret \
  --name "easytrip-${ENV}/openai/api-key" \
  --secret-string "sk-proj-..."

aws secretsmanager create-secret \
  --name "easytrip-${ENV}/stripe/secret-key" \
  --secret-string "sk_live_..."

aws secretsmanager create-secret \
  --name "easytrip-${ENV}/stripe/webhook-secret" \
  --secret-string "whsec_..."

# ... repeat for all secrets in server/.env.example
```

### 4.7 Required GitHub Secrets

Set these in GitHub repo → Settings → Secrets and variables → Actions:

```
# AWS (staging)
AWS_ACCESS_KEY_ID            — IAM user with ECS deploy permissions
AWS_SECRET_ACCESS_KEY

# AWS (production)
AWS_ACCESS_KEY_ID_PROD
AWS_SECRET_ACCESS_KEY_PROD

# Network config (from terraform output)
STAGING_SUBNET_IDS           — e.g., "subnet-xxx,subnet-yyy"
STAGING_SG_ID                — ECS security group ID
PROD_SUBNET_IDS
PROD_SG_ID

# Expo
EXPO_TOKEN                   — From expo.dev → Account Settings → Access Tokens

# Apple (for TestFlight submission)
APPLE_APP_SPECIFIC_PASSWORD  — From appleid.apple.com → App-Specific Passwords

# Google (for Play Store submission)
GOOGLE_SERVICE_ACCOUNT_KEY   — JSON content of service account key file
```

---

## 5. Server Deployment (ECS/Fargate)

### 5.1 Automated deployment (recommended)

Every push to `main` automatically:
1. Runs CI (tests, lint, typecheck)
2. Builds Docker image and pushes to ECR
3. Deploys to **staging** automatically
4. Runs smoke tests
5. Waits for **manual approval** in GitHub
6. Deploys to **production**

No manual steps needed for regular deployments.

### 5.2 Manual deployment

For emergency hotfixes or when CI is unavailable:

```bash
# Set environment
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=eu-west-1

# Deploy to staging
./scripts/deploy-server.sh --env staging

# Deploy to production (requires confirmation)
./scripts/deploy-server.sh --env production
```

### 5.3 Deployment pipeline explained

```
Push to main
    │
    ▼
GitHub Actions: ci.yml
  ├── Server lint + typecheck
  ├── Server tests (with Postgres + Redis)
  ├── Mobile lint + typecheck
  └── Mobile tests
    │
    ▼ (on success)
deploy-server.yml
  1. Build Docker image (multi-stage, linux/amd64)
  2. Push to ECR: {sha} + staging-latest tags
  3. Run migration ECS task (one-off Fargate task)
  4. aws ecs update-service --force-new-deployment
     → ECS performs rolling update:
       - Starts new tasks
       - Waits for health check (/health → 200)
       - Drains old tasks (30s deregistration delay)
       - Circuit breaker: auto-rollback if health fails
  5. Smoke test: curl https://api-staging.easytrip.app/health
    │
    ▼ (staging healthy)
Manual approval gate (GitHub Environments: production)
    │
    ▼ (approved)
  1. Re-tag image as prod-latest
  2. Run migrations on production RDS
  3. Deploy to production ECS
  4. Verify /health returns 200
```

### 5.4 Blue/green details

ECS rolling update with circuit breaker:
- Starts new tasks before stopping old ones (`maximumPercent=200`)
- Never goes below 100% capacity (`minimumHealthyPercent=100`)
- If new tasks fail health checks → automatic rollback to previous task definition
- Zero downtime deployments for stateless services

### 5.5 ECS task sizes

| Service | CPU | Memory | Min tasks | Max tasks |
|---|---|---|---|---|
| API | 0.5 vCPU | 1 GB | 2 | 20 |
| Worker | 0.5 vCPU | 1 GB | 2 | 10 |
| Social Agent | 1 vCPU | 2 GB | 1 | 5 |

Autoscaling triggers at 70% CPU utilisation.

---

## 6. iOS Deployment

### 6.1 First-time setup

```bash
# 1. Log in to EAS
eas login

# 2. Configure the project (run once)
eas build:configure

# 3. Register devices for ad-hoc distribution (development/preview)
eas device:create

# 4. Set up credentials (EAS manages certificates and provisioning profiles)
eas credentials
# Select iOS → select profile → let EAS manage automatically
```

### 6.2 Development build (internal testing)

```bash
# Build development client (required for Expo Dev Client workflow)
eas build --platform ios --profile development

# Install on device via URL (EAS provides QR code after build)
# Or: eas build:run --platform ios (installs in simulator)
```

### 6.3 Preview build → TestFlight

```bash
# Option A: Manual trigger
./scripts/build-mobile.sh --platform ios --profile preview --wait --submit

# Option B: Automatic
# Push to main → deploy-preview.yml workflow runs automatically

# After submission, wait 10–30 minutes for TestFlight processing
# Then: TestFlight → EasyTrip → Add Internal Testers
```

### 6.4 Production build → App Store

```bash
# Build production IPA
./scripts/build-mobile.sh --platform ios --profile production --wait

# Submit to App Store Connect
eas submit --platform ios --profile production --latest

# In App Store Connect:
# 1. Review submission auto-created from EAS
# 2. Add release notes
# 3. Select TestFlight build
# 4. Submit for review (typically 24–48h for first submission, faster after)
```

### 6.5 OTA updates (JS-only changes)

For non-native changes (UI fixes, API updates, bug fixes), use Expo Updates:

```bash
# Push JS bundle update to all users on preview channel
eas update --branch preview --message "Fix: budget screen crash"

# Push to production users
eas update --branch production --message "v1.0.1: improve itinerary loading"

# Users receive update silently on next app launch (or background)
# No App Store review required
```

**What counts as a JS-only change:**
- UI components, styles, layouts
- API calls, state management
- Business logic, screen navigation
- Bug fixes not touching native modules

**What requires a full build (native change):**
- Adding new Expo plugins (Camera, Notifications, etc.)
- Updating native dependencies in package.json
- Changes to app.json permissions/capabilities
- New native modules

### 6.6 Apple compliance notes

⚠️ **Critical for App Store approval:**

- The iOS app must ONLY show Apple IAP payment sheets for in-app purchases
- No mention of Stripe, "website", or alternative payment methods in iOS UI
- The Stripe web checkout flow is web-only and must not be linked from iOS
- Do not display external subscription prices that differ from Apple's prices

---

## 7. Android Deployment

### 7.1 First-time setup

```bash
# EAS handles Android signing — no manual keystore management needed

# Set up Android credentials
eas credentials
# Select Android → Generate new keystore (let EAS manage)
# IMPORTANT: Download and back up the keystore — losing it means losing your app!

# Create app in Google Play Console:
# 1. Go to play.google.com/console
# 2. Create app → "EasyTrip" → App, Free, UK
# 3. Note your package name: com.easytrip.app
```

### 7.2 Development build

```bash
eas build --platform android --profile development
# Installs as APK directly on device/emulator
```

### 7.3 Preview build → Internal Test Track

```bash
# Build APK for internal testers
./scripts/build-mobile.sh --platform android --profile preview --wait --submit

# In Play Console: Internal testing → Add testers
# Testers receive email invite with download link
```

### 7.4 Production build → Play Store

```bash
# Build AAB (Android App Bundle — required for Play Store)
./scripts/build-mobile.sh --platform android --profile production --wait

# Submit to Play Store
eas submit --platform android --profile production --latest

# In Play Console:
# 1. Production → Create new release
# 2. Add release notes (en-GB primary, translate via Play)
# 3. Review rollout percentage (start at 20% for first release)
# 4. Submit for review (typically 2–7 days for first release)
```

### 7.5 Google Play review track strategy

```
Internal Testing → Closed Testing → Open Testing → Production

For EasyTrip:
1. Build preview → Internal Testing (for the team)
2. Verified good → Closed Testing (beta testers)
3. No critical issues → Production (20% rollout → 100%)
```

---

## 8. CI/CD Pipelines

### 8.1 ci.yml — Runs on every PR

Validates both mobile and server before code merges:
- Server: TypeScript typecheck, ESLint, Jest tests (with real Postgres + Redis)
- Mobile: TypeScript typecheck, ESLint, Jest unit tests
- Drizzle schema check (no uncommitted migrations)
- Docker build validation (no push)

Fails the PR if any check fails. Required to pass before merge.

### 8.2 deploy-server.yml — Runs on push to main

Full deploy pipeline as described in section 5.3.

**Required GitHub Environments config:**
- `staging` — auto-approve (deploys automatically)
- `production` — requires manual approval (designated reviewers only)

### 8.3 deploy-preview.yml — Runs on push to main

Builds and submits mobile preview builds to TestFlight (iOS) and Internal Test Track (Android). Runs in parallel with the server deploy.

**Triggers:** Only runs when mobile-relevant files change (src/, app.json, eas.json, package.json).

### 8.4 build-mobile.yml — Manual trigger only

For building specific platform + profile combinations on demand. Use for:
- One-off production builds
- Specific profile testing
- When you need to control timing of a build

### 8.5 Workflow dependencies

```
PR opened
    └── ci.yml (must pass for merge)

Push to main
    ├── deploy-server.yml
    │     staging → [auto] → smoke test → [manual approval] → production
    └── deploy-preview.yml
          iOS preview → TestFlight
          Android preview → Internal Track

Manual trigger
    └── build-mobile.yml (any platform, any profile)
```

---

## 9. Environment Variables & Secrets

### 9.1 Secret hierarchy

```
Local dev:         server/.env file (gitignored)
CI/CD:             GitHub Secrets (encrypted, injected as env vars)
ECS (staging):     AWS Secrets Manager → injected at task start
ECS (production):  AWS Secrets Manager → injected at task start
Mobile:            EAS environment variables (per profile in eas.json)
```

### 9.2 Mobile env vars

Mobile uses `EXPO_PUBLIC_*` variables — these are safe to include in the JS bundle. **No secrets in mobile env vars.**

Configured per profile in `eas.json`:
```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://api.easytrip.app/v1",
  "EXPO_PUBLIC_ENVIRONMENT": "production"
}
```

### 9.3 Adding a new secret

**Server:**

```bash
# 1. Add to server/.env.example (with placeholder value)
# 2. Add to AWS Secrets Manager for staging + production
aws secretsmanager create-secret \
  --name "easytrip-production/my-service/api-key" \
  --secret-string "actual-value"

# 3. Reference in ECS task definition (in Terraform or AWS console):
#    secrets: [{ name: "MY_SERVICE_API_KEY", valueFrom: "arn:aws:..." }]

# 4. Add to server/.env for local dev
```

**Mobile:**
```bash
# 1. Add to .env.example
# 2. Add to eas.json under relevant profiles
# 3. Add to .env locally
```

### 9.4 Rotating secrets

```bash
# Rotate in AWS Secrets Manager
aws secretsmanager rotate-secret --secret-id "easytrip-production/stripe/secret-key"

# Then force a new ECS deployment to pick up the new value
aws ecs update-service \
  --cluster easytrip-production \
  --service easytrip-api-production \
  --force-new-deployment
```

---

## 10. Database Migrations

### 10.1 Creating a migration

```bash
cd server

# After editing src/db/schema.ts:
npm run db:generate  # Generates migration SQL in drizzle/migrations/

# Review the generated SQL before applying:
cat drizzle/migrations/XXXX_*.sql

# Apply locally
npm run db:migrate
```

### 10.2 Migration guidelines

**Always write safe migrations:**

```sql
-- ✅ SAFE: Adding a nullable column
ALTER TABLE users ADD COLUMN new_field TEXT;

-- ✅ SAFE: Adding a column with a default
ALTER TABLE users ADD COLUMN new_field TEXT DEFAULT 'value';

-- ✅ SAFE: Adding an index (use CONCURRENTLY)
CREATE INDEX CONCURRENTLY idx_users_new ON users(new_field);

-- ⚠️ CAREFUL: Adding a NOT NULL column (must have DEFAULT or backfill first)
-- Step 1: Add as nullable
-- Step 2: Backfill data
-- Step 3: Add NOT NULL constraint

-- ❌ DANGEROUS: Dropping a column used by running code
-- First: deploy code that doesn't read the column
-- Then: drop the column in the next deploy
```

### 10.3 Running migrations in production

Migrations run automatically during deployment (ECS one-off task before service update).

For emergency manual migration:

```bash
# Connect via bastion or ECS exec
aws ecs execute-command \
  --cluster easytrip-production \
  --task TASK_ARN \
  --container easytrip-api \
  --interactive \
  --command "/bin/sh"

# Inside the container:
npm run db:migrate
```

### 10.4 Rollback a migration

Drizzle doesn't auto-rollback. Write a rollback migration manually:

```bash
# Create a new migration that reverses the change
npm run db:generate --name=revert_xyz

# Edit the generated file to write the reverse SQL
# Then deploy normally
```

---

## 11. Monitoring & Alerting

### 11.1 CloudWatch dashboards

Key metrics to watch:

```
API Service:
  - ECS CPU utilisation (alarm at >80%)
  - ECS Memory utilisation (alarm at >80%)
  - ALB Request count + 5xx rate
  - ALB Target response time (P99)

Database:
  - RDS CPU (alarm at >80%)
  - RDS FreeStorageSpace (alarm at <10GB)
  - RDS DatabaseConnections (alarm at >80% max)
  - RDS Replication lag (Multi-AZ)

Redis:
  - ElastiCache CPU
  - ElastiCache Memory (alarm at >80%)
  - ElastiCache cache hit rate

Application:
  - Sentry error rate (critical: error spike)
  - BullMQ queue depth (itinerary generation backlog)
```

### 11.2 Sentry

Sentry is configured for both mobile and server.

```typescript
// server/src/index.ts — already in Sentry setup
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% in production
});
```

Critical alerts to configure in Sentry:
- Error rate spike >10 errors/min → alert immediately
- New error types (never seen before) → alert
- P99 response time >2s → alert

### 11.3 Log querying

```bash
# Tail live logs from production API
aws logs tail /easytrip/production/api --follow --format json

# Search for errors in last hour
aws logs filter-log-events \
  --log-group-name /easytrip/production/api \
  --filter-pattern '"level":"error"' \
  --start-time $(date -d '1 hour ago' +%s000)

# Get specific request by ID
aws logs filter-log-events \
  --log-group-name /easytrip/production/api \
  --filter-pattern '"requestId":"YOUR_REQUEST_ID"'
```

### 11.4 Health endpoints

```
GET /health
→ {"status":"ok","uptime":12345,"timestamp":"2026-04-21T18:00:00Z"}

GET /health/detailed (server monitoring only — not exposed via ALB)
→ {"status":"ok","db":"ok","redis":"ok","queues":{"pending":0,"active":2}}
```

---

## 12. Rollback Procedures

### 12.1 Server rollback

**Automatic:** ECS deployment circuit breaker auto-rolls back if health checks fail during deployment.

**Manual rollback to previous task definition:**

```bash
# 1. Find the previous task definition revision
aws ecs describe-services \
  --cluster easytrip-production \
  --services easytrip-api-production \
  --query 'services[0].deployments'

# Note the previous task definition ARN

# 2. Update service to use previous revision
aws ecs update-service \
  --cluster easytrip-production \
  --service easytrip-api-production \
  --task-definition easytrip-production-api:PREVIOUS_REVISION

# 3. Wait for stabilisation
aws ecs wait services-stable \
  --cluster easytrip-production \
  --services easytrip-api-production
```

**Emergency: rollback via redeploy previous commit:**

```bash
git checkout PREVIOUS_COMMIT_SHA
./scripts/deploy-server.sh --env production --skip-migrate
```

### 12.2 Database rollback

There is no automatic database rollback. Always write forward-only migrations.

**If a migration caused data issues:**

```bash
# 1. Write a corrective migration
# 2. Deploy it immediately via emergency deploy
./scripts/deploy-server.sh --env production

# For critical data corruption:
# Restore from RDS automated backup (available every 5 min with PITR)
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier easytrip-production-postgres \
  --target-db-instance-identifier easytrip-production-postgres-restored \
  --restore-time 2026-04-21T17:00:00Z
```

### 12.3 Mobile rollback

**iOS:** Cannot force-rollback a released App Store version.
- Submit a new version as a hotfix
- For critical issues: request expedited review from Apple

**Android:** Can halt a staged rollout in Play Console.
- Production → Release → Halt rollout
- All new installs revert to previous version
- Existing users with new version keep it

**OTA rollback (Expo Updates):**

```bash
# Point the branch back to a previous update
eas update --branch production --message "Rollback: revert to stable" 
# Point to a specific commit/update ID

# Or simply deploy the fixed code as a new OTA update
eas update --branch production --message "Hotfix: revert crash"
```

---

## 13. Cost Management

### 13.1 Current monthly cost (at launch, ~1k MAU)

| Category | Monthly cost |
|---|---|
| AWS Infrastructure | ~$370 |
| API services (Claude, Google, etc.) | ~$550 |
| Twitter/X API | $100 |
| Sentry | $26 |
| **Total** | **~$1,050 (~£830/mo)** |

Break-even: ~280 active Pro subscribers at £2.99/mo or 35 Voyager lifetime purchases at £19.99.

### 13.2 Cost control levers

**Reduce AI costs (biggest lever):**
- Itinerary cache hit rate target: >50% (same destination + profile = serve cached)
- Use Claude Haiku for assistant (already planned)
- GPT-4o mini for social extraction (batch processing)

**Reduce Google Places costs:**
- 6-hour Redis cache for all venue lookups (already implemented)
- Field masks on all Places API calls
- Never call Places Detail if venue already in DB

**Reduce ECS costs:**
- Scale social agent to 0 tasks outside business hours (9am–11pm)
- Use FARGATE_SPOT for worker tasks (70% cheaper, acceptable for batch work)

**If costs spike:**
```bash
# Check which API is responsible
aws ce get-cost-and-usage \
  --time-period Start=2026-04-01,End=2026-04-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

### 13.3 Free tier checks

| Service | Free tier | What we use |
|---|---|---|
| PostHog | 1M events/mo free | Self-host if exceeded |
| Resend | 3k emails/mo free | Upgrade at ~£15/mo when needed |
| YouTube API | 10k units/day | Monitor in Google Cloud Console |
| Reddit API | 100 requests/min | Monitor — free |
| OpenWeatherMap | 60 calls/min free | Cache aggressively |
| EAS Build | Limited free builds | Upgrade to EAS Production plan when building frequently |

---

## 14. Runbooks

### RB-01: API is returning 5xx errors

```
1. Check Sentry: https://sentry.io/organizations/easytrip
2. Check ECS service health:
   aws ecs describe-services --cluster easytrip-production --services easytrip-api-production
3. Check recent logs:
   aws logs tail /easytrip/production/api --follow
4. Check RDS connectivity:
   aws rds describe-db-instances --db-instance-identifier easytrip-production-postgres
5. Check Redis:
   aws elasticache describe-replication-groups --replication-group-id easytrip-production-redis
6. If recent deploy → rollback (see 12.1)
7. If DB issue → check connections (RDS Proxy dashboard), restart tasks if stuck
```

### RB-02: Itinerary generation is stuck / timing out

```
1. Check BullMQ dashboard (if Bull Board is installed):
   GET https://api.easytrip.app/bull-dashboard (internal only)
2. Check AI provider status:
   https://status.anthropic.com
   https://status.openai.com
3. Check worker ECS tasks are running:
   aws ecs list-tasks --cluster easytrip-production --family easytrip-production-api
4. Check Redis queue depth:
   aws logs filter-log-events --log-group-name /easytrip/production/api \
     --filter-pattern '"queue"' --start-time $(date -d '5 min ago' +%s000)
5. If AI provider down → jobs will auto-retry with fallback model
6. If worker crashed → restart: aws ecs update-service --force-new-deployment
```

### RB-03: Mobile app crashes on launch (iOS)

```
1. Check Sentry mobile project for crash reports
2. Check if it's an OTA update issue:
   eas update:list --branch production
3. If recent OTA update caused crash:
   Roll back OTA (see 12.3)
4. If native crash:
   Submit hotfix build via App Store expedited review
5. Communicate to users via App Store "What's New" notes
```

### RB-04: Database storage running low (<10GB)

```
1. Alert threshold: CloudWatch alarm fires at <10GB
2. Check table sizes:
   SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename))
   FROM pg_tables ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC LIMIT 20;
3. Likely culprits: social_posts (purge posts >90 days), ai_messages
4. Enable RDS storage autoscaling (already configured in Terraform, max 500GB)
5. If autoscale hasn't triggered: manual resize via AWS console
```

### RB-05: Deploy failed mid-migration

```
1. ECS circuit breaker should have rolled back the service automatically
2. Verify service is running previous version:
   aws ecs describe-services --cluster easytrip-production --services easytrip-api-production
3. Check if migration partially applied:
   SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5;
4. If partial: write a corrective migration and apply manually via ECS exec
5. Fix the migration in code, re-test locally, then re-deploy
```

---

*Deployment guide complete. Questions or issues: open a GitHub issue or ping DevOps.*
