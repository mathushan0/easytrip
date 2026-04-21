#!/usr/bin/env bash
# =============================================================================
# EasyTrip — Full Dev Environment Setup
# =============================================================================
# Sets up everything needed to run EasyTrip locally:
#   - Node.js (via nvm), npm dependencies
#   - Docker + local services (Postgres, Redis, LibreTranslate)
#   - .env files from examples
#   - DB migrations
#   - EAS CLI for mobile builds
#
# Usage:
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh
#
# Requirements: macOS or Linux, curl, git
# =============================================================================

set -euo pipefail

# Colours
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
step()    { echo -e "\n${BLUE}══════════════════════════════════════${NC}"; echo -e "${BLUE} $*${NC}"; echo -e "${BLUE}══════════════════════════════════════${NC}"; }

# Project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT"

step "EasyTrip Dev Environment Setup"

# ── 1. Check required tools ────────────────────────────────────────────────────
step "1/8 — Checking prerequisites"

check_command() {
  if ! command -v "$1" &>/dev/null; then
    error "$1 is required but not installed. $2"
  fi
  success "$1 found: $(command -v "$1")"
}

check_command "git"      "Install git: https://git-scm.com"
check_command "curl"     "Install curl"
check_command "docker"   "Install Docker Desktop: https://www.docker.com/products/docker-desktop"

# Check Docker is running
if ! docker info &>/dev/null; then
  error "Docker is not running. Please start Docker Desktop."
fi
success "Docker is running"

# ── 2. Node.js via nvm ─────────────────────────────────────────────────────────
step "2/8 — Node.js setup"

REQUIRED_NODE="22"

if command -v nvm &>/dev/null; then
  info "nvm found, installing Node $REQUIRED_NODE..."
  nvm install "$REQUIRED_NODE"
  nvm use "$REQUIRED_NODE"
elif command -v node &>/dev/null; then
  NODE_VERSION=$(node -v | cut -d. -f1 | tr -d 'v')
  if [[ "$NODE_VERSION" -lt "$REQUIRED_NODE" ]]; then
    warn "Node $NODE_VERSION found, but $REQUIRED_NODE+ required."
    info "Install nvm: https://github.com/nvm-sh/nvm#installing-and-updating"
    info "Then run: nvm install $REQUIRED_NODE && nvm use $REQUIRED_NODE"
    error "Please upgrade Node.js to $REQUIRED_NODE+"
  fi
  success "Node $(node -v) found"
else
  error "Node.js not found. Install via nvm: https://github.com/nvm-sh/nvm"
fi

# ── 3. Install dependencies ────────────────────────────────────────────────────
step "3/8 — Installing dependencies"

info "Installing root (mobile) dependencies..."
npm install

info "Installing server dependencies..."
cd server && npm install && cd ..

success "All dependencies installed"

# ── 4. Environment files ───────────────────────────────────────────────────────
step "4/8 — Environment configuration"

if [[ ! -f ".env" ]]; then
  if [[ -f ".env.example" ]]; then
    cp .env.example .env
    success "Created .env from .env.example (mobile)"
    warn "👉 Edit .env and fill in your Expo public keys"
  else
    warn "No .env.example found for mobile — skipping"
  fi
else
  info ".env already exists — skipping"
fi

if [[ ! -f "server/.env" ]]; then
  cp server/.env.example server/.env
  success "Created server/.env from server/.env.example"
  warn "👉 Edit server/.env and fill in all required credentials"
else
  info "server/.env already exists — skipping"
fi

# ── 5. Start local services via Docker ────────────────────────────────────────
step "5/8 — Starting local services (Postgres, Redis, LibreTranslate)"

if docker compose -f infra/docker-compose.prod.yml ps --profile local 2>/dev/null | grep -q "running"; then
  info "Services already running"
else
  info "Starting local services..."
  docker compose -f infra/docker-compose.prod.yml --profile local up -d postgres redis libretranslate
fi

# Wait for Postgres
info "Waiting for PostgreSQL to be ready..."
RETRIES=30
until docker compose -f infra/docker-compose.prod.yml exec -T postgres pg_isready -U postgres &>/dev/null 2>&1 || [[ $RETRIES -eq 0 ]]; do
  RETRIES=$((RETRIES - 1))
  sleep 2
done

if [[ $RETRIES -eq 0 ]]; then
  error "PostgreSQL failed to start. Check: docker compose -f infra/docker-compose.prod.yml logs postgres"
fi
success "PostgreSQL is ready"

# Wait for Redis
info "Waiting for Redis to be ready..."
RETRIES=15
until docker compose -f infra/docker-compose.prod.yml exec -T redis redis-cli ping &>/dev/null 2>&1 || [[ $RETRIES -eq 0 ]]; do
  RETRIES=$((RETRIES - 1))
  sleep 2
done
success "Redis is ready"

# ── 6. Database migrations ─────────────────────────────────────────────────────
step "6/8 — Running database migrations"

cd server
npm run db:migrate
success "Migrations applied"

# Seed dev data if seed script exists
if npm run | grep -q "db:seed"; then
  info "Running seed data..."
  npm run db:seed
  success "Seed data applied"
fi

cd ..

# ── 7. EAS CLI setup ────────────────────────────────────────────────────────────
step "7/8 — EAS CLI (Expo Application Services)"

if ! command -v eas &>/dev/null; then
  info "Installing EAS CLI globally..."
  npm install -g eas-cli
  success "EAS CLI installed"
else
  EAS_VERSION=$(eas --version 2>/dev/null | head -1)
  success "EAS CLI found: $EAS_VERSION"
fi

info "To link this project to your Expo account, run:"
echo "  eas login"
echo "  eas build:configure"

# ── 8. Final checks ────────────────────────────────────────────────────────────
step "8/8 — Verification"

cd server
if npm run build &>/dev/null; then
  success "Server builds successfully"
else
  warn "Server build failed — check TypeScript errors"
fi
cd ..

step "✅ Setup Complete!"
echo ""
echo "  Start server:       cd server && npm run dev"
echo "  Start mobile:       npm start"
echo "  Run all tests:      ./scripts/run-tests.sh"
echo "  Build mobile:       ./scripts/build-mobile.sh"
echo ""
echo "  Local services:"
echo "    PostgreSQL:       localhost:5432 (easytrip / postgres)"
echo "    Redis:            localhost:6379"
echo "    LibreTranslate:   http://localhost:5000"
echo ""
warn "Don't forget to fill in your API keys in server/.env before starting!"
