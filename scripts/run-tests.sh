#!/usr/bin/env bash
# =============================================================================
# EasyTrip — Run All Tests
# =============================================================================
# Runs tests for both mobile (Jest) and server (Jest/Vitest).
#
# Usage:
#   ./scripts/run-tests.sh [--coverage] [--watch] [--server-only] [--mobile-only]
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
error()   { echo -e "${RED}[ERROR]${NC} $*"; }
step()    { echo -e "\n${BLUE}── $* ──${NC}"; }

COVERAGE="false"
WATCH="false"
SERVER_ONLY="false"
MOBILE_ONLY="false"
FAIL_FAST="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --coverage)     COVERAGE="true";     shift ;;
    --watch)        WATCH="true";        shift ;;
    --server-only)  SERVER_ONLY="true";  shift ;;
    --mobile-only)  MOBILE_ONLY="true";  shift ;;
    --fail-fast)    FAIL_FAST="true";    shift ;;
    --help|-h)
      echo "Usage: $0 [--coverage] [--watch] [--server-only] [--mobile-only] [--fail-fast]"
      exit 0
      ;;
    *) error "Unknown option: $1"; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

MOBILE_RESULT=0
SERVER_RESULT=0
START_TIME=$(date +%s)

# ── Mobile Tests ───────────────────────────────────────────────────────────────
run_mobile_tests() {
  step "Mobile Tests (React Native / Jest)"

  JEST_FLAGS="--watchAll=false --passWithNoTests"

  if [[ "$COVERAGE" == "true" ]]; then
    JEST_FLAGS="$JEST_FLAGS --coverage"
  fi

  if [[ "$WATCH" == "true" ]]; then
    JEST_FLAGS="--watch"
  fi

  if [[ "$FAIL_FAST" == "true" ]]; then
    JEST_FLAGS="$JEST_FLAGS --bail"
  fi

  if npm test -- $JEST_FLAGS 2>&1; then
    success "Mobile tests passed"
    MOBILE_RESULT=0
  else
    error "Mobile tests FAILED"
    MOBILE_RESULT=1
  fi
}

# ── Server Tests ───────────────────────────────────────────────────────────────
run_server_tests() {
  step "Server Tests (Node.js / Jest)"

  # Start test database if not running
  if ! docker compose -f infra/docker-compose.prod.yml ps postgres 2>/dev/null | grep -q "running"; then
    info "Starting test database..."
    docker compose -f infra/docker-compose.prod.yml --profile local up -d postgres redis

    info "Waiting for PostgreSQL..."
    RETRIES=20
    until docker compose -f infra/docker-compose.prod.yml exec -T postgres \
      pg_isready -U postgres &>/dev/null 2>&1 || [[ $RETRIES -eq 0 ]]; do
      RETRIES=$((RETRIES - 1))
      sleep 2
    done
  fi

  cd server

  # Run migrations for test DB
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/easytrip_test" \
    npm run db:migrate 2>/dev/null || warn "Migration failed — tests may fail"

  JEST_FLAGS="--passWithNoTests --forceExit"

  if [[ "$COVERAGE" == "true" ]]; then
    JEST_FLAGS="$JEST_FLAGS --coverage"
  fi

  if [[ "$WATCH" == "true" ]]; then
    JEST_FLAGS="--watch"
  fi

  if [[ "$FAIL_FAST" == "true" ]]; then
    JEST_FLAGS="$JEST_FLAGS --bail"
  fi

  if NODE_ENV=test \
     DATABASE_URL="postgresql://postgres:postgres@localhost:5432/easytrip_test" \
     REDIS_URL="redis://localhost:6379" \
     SUPABASE_URL="https://placeholder.supabase.co" \
     SUPABASE_ANON_KEY="placeholder" \
     SUPABASE_SERVICE_ROLE_KEY="placeholder" \
     npm test -- $JEST_FLAGS 2>&1; then
    success "Server tests passed"
    SERVER_RESULT=0
  else
    error "Server tests FAILED"
    SERVER_RESULT=1
  fi

  cd ..
}

# ── Typecheck ──────────────────────────────────────────────────────────────────
run_typecheck() {
  step "TypeScript Checks"

  info "Mobile typecheck..."
  if npx tsc --noEmit 2>&1; then
    success "Mobile TypeScript: OK"
  else
    error "Mobile TypeScript: FAILED"
    SERVER_RESULT=1
  fi

  info "Server typecheck..."
  if (cd server && npx tsc --noEmit 2>&1); then
    success "Server TypeScript: OK"
  else
    error "Server TypeScript: FAILED"
    SERVER_RESULT=1
  fi
}

# ── Lint ───────────────────────────────────────────────────────────────────────
run_lint() {
  step "Linting"

  info "Mobile lint..."
  if npm run lint 2>&1; then
    success "Mobile lint: OK"
  else
    error "Mobile lint: FAILED"
    MOBILE_RESULT=1
  fi

  info "Server lint..."
  if (cd server && npm run lint 2>&1); then
    success "Server lint: OK"
  else
    error "Server lint: FAILED"
    SERVER_RESULT=1
  fi
}

# ── Run ────────────────────────────────────────────────────────────────────────
if [[ "$MOBILE_ONLY" != "true" && "$SERVER_ONLY" != "true" ]]; then
  run_typecheck
  run_lint
  run_mobile_tests
  run_server_tests
elif [[ "$MOBILE_ONLY" == "true" ]]; then
  run_mobile_tests
elif [[ "$SERVER_ONLY" == "true" ]]; then
  run_server_tests
fi

# ── Summary ────────────────────────────────────────────────────────────────────
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "═══════════════════════════════"
echo "  Test Summary  (${DURATION}s)"
echo "═══════════════════════════════"

if [[ "$MOBILE_ONLY" != "true" ]] || [[ "$SERVER_ONLY" != "true" ]]; then
  [[ $MOBILE_RESULT -eq 0 ]] && echo -e "  Mobile:  ${GREEN}PASS${NC}" || echo -e "  Mobile:  ${RED}FAIL${NC}"
  [[ $SERVER_RESULT -eq 0 ]] && echo -e "  Server:  ${GREEN}PASS${NC}" || echo -e "  Server:  ${RED}FAIL${NC}"
fi

echo ""

OVERALL=$((MOBILE_RESULT + SERVER_RESULT))

if [[ $OVERALL -eq 0 ]]; then
  success "All tests passed! ✅"
  exit 0
else
  error "Some tests failed ❌"
  exit 1
fi
