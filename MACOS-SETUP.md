# EasyTrip: macOS Developer Setup Guide

A comprehensive step-by-step guide to set up the EasyTrip project for full-stack development on macOS.

**Last Updated:** April 2026  
**Tested On:** macOS Big Sur (11) through Sequoia (15)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Setup (Next.js)](#frontend-setup-nextjs)
3. [Backend Setup (Fastify)](#backend-setup-fastify)
4. [Database Setup (Supabase)](#database-setup-supabase)
5. [Cache Setup (Upstash Redis)](#cache-setup-upstash-redis)
6. [Authentication Setup](#authentication-setup)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)
9. [Deployment](#deployment)

---

## Prerequisites

### 1. macOS Version

- **Minimum:** macOS 11 Big Sur
- **Recommended:** macOS 13 Ventura or later

To check your version:

```bash
sw_vers
```

### 2. Homebrew Installation

If not already installed, install Homebrew (macOS package manager):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Verify installation:

```bash
brew --version
```

### 3. Node.js Installation (18+ Required)

**Option A: Using nvm (Node Version Manager) — Recommended**

Install nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

Add nvm to your shell (automatically added to `~/.zshrc` or `~/.bash_profile`):

```bash
# For zsh (default on Monterey+)
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
source ~/.zshrc

# For bash
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bash_profile
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bash_profile
source ~/.bash_profile
```

Install and use Node.js 20 LTS (or 22):

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

**Option B: Using Homebrew**

```bash
brew install node
```

**Verify installation:**

```bash
node --version  # Should be v20.x or higher
npm --version   # Should be 10.x or higher
```

### 4. Git Setup

#### Clone Repository with SSH

First, ensure Git is installed:

```bash
brew install git
```

#### Set Git Configuration

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### Generate SSH Key (If You Don't Have One)

```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
# Press Enter to accept defaults
# When asked for passphrase, you can skip or set one
```

#### Add SSH Key to GitHub

1. Copy your SSH public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub | pbcopy
   ```

2. Go to GitHub: **Settings > SSH and GPG keys > New SSH key**
3. Paste the key and save

#### Test SSH Connection

```bash
ssh -T git@github.com
# Expected output: "Hi your-username! You've successfully authenticated..."
```

#### Clone the Repository

```bash
cd ~/Development  # or your preferred directory
git clone git@github.com:mathushan0/easytrip.git
cd easytrip
```

---

## Frontend Setup (Next.js)

> **Note:** EasyTrip's mobile app uses **React Native + Expo**, not Next.js. The `/web` directory contains a Next.js web build of the dashboard. Both are included in the setup below.

### Step 1: Install Root Dependencies

From the project root:

```bash
npm install
```

This installs dependencies for the Expo mobile app.

### Step 2: Configure Environment Variables

Create `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and set the following:

```env
# Backend API
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1

# Supabase (get these from your Supabase project dashboard)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...

# Google Maps API (optional for local dev, required for production)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

# Feature flags
EXPO_PUBLIC_DEBUG_UI=true        # Enable debug UI for development
EXPO_PUBLIC_SOCIAL_INTEL_ENABLED=false  # Enable once social intel is ready
EXPO_PUBLIC_ENVIRONMENT=development

# Stripe (test keys, optional for local dev)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Step 3: Install Frontend Dependencies

```bash
# Mobile app (Expo)
npm install

# Web dashboard (if using Next.js version)
# cd web && npm install && cd ..
```

### Step 4: Start Development Server

The mobile app uses **Expo Go** for development:

```bash
npm start
```

This opens the **Expo Dev Tools**:

```
› Press 'a' to open Android Emulator
› Press 'i' to open iOS Simulator
› Press 'w' to open Web
› Press 'r' to reload app
› Press 'm' to toggle menu
```

#### Option A: iOS Simulator

```bash
npm start
# Then press 'i'
```

Or directly:

```bash
npm run ios
```

**Prerequisites:**
- Xcode installed (download from App Store)
- First run: `sudo xcode-select --install`

#### Option B: Android Emulator

```bash
npm start
# Then press 'a'
```

**Prerequisites:**
- Android Studio installed
- Android emulator configured

#### Option C: Expo Go (Physical Device)

1. Install **Expo Go** from App Store or Google Play
2. Run `npm start`
3. Scan the QR code with your phone's camera
4. App opens in Expo Go

---

## Backend Setup (Fastify)

### Step 1: Install Server Dependencies

```bash
cd server
npm install
cd ..
```

### Step 2: Configure Environment Variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with all required credentials:

```env
# Database (local development)
DATABASE_URL=postgresql://postgres:password@localhost:5432/easytrip

# Redis (local development)
REDIS_URL=redis://localhost:6379

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...

# Google APIs (optional for local dev)
GOOGLE_PLACES_API_KEY=AIzaSy...
GOOGLE_MAPS_API_KEY=AIzaSy...
GOOGLE_TRANSLATE_API_KEY=AIzaSy...
GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...
GOOGLE_CLOUD_TTS_API_KEY=AIzaSy...

# Stripe (use test keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_VOYAGER_LIFETIME=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_ANNUAL=price_xxx

# Social Intelligence APIs (optional for local dev)
TWITTER_BEARER_TOKEN=AAAA...
YOUTUBE_API_KEY=AIzaSy...
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret

# Email
RESEND_API_KEY=re_...

# Data Services (optional)
OPEN_EXCHANGE_RATES_APP_ID=your_id
OPENWEATHERMAP_API_KEY=your_key

# Error Tracking (optional)
SENTRY_DSN=https://...

# AWS (optional for local dev)
AWS_REGION=eu-west-1
S3_BUCKET_NAME=easytrip-media-dev
CLOUDFRONT_DOMAIN=media-dev.easytrip.app

# LibreTranslate (local fallback)
LIBRETRANSLATE_URL=http://localhost:5000

# App Config
NODE_ENV=development
PORT=8000
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
PROMPT_VERSION=v1.0
```

### Step 3: Start PostgreSQL & Redis Locally

#### Option A: Using Docker (Recommended)

If you don't have Docker, install Docker Desktop for Mac:

```bash
brew install --cask docker
```

Start services:

```bash
docker compose -f infra/docker-compose.prod.yml --profile local up -d
```

This starts:
- PostgreSQL 16 on `localhost:5432`
- Redis 7 on `localhost:6379`
- LibreTranslate on `localhost:5000`

Check status:

```bash
docker compose -f infra/docker-compose.prod.yml --profile local ps
```

#### Option B: Using Homebrew (PostgreSQL Only)

```bash
# Install PostgreSQL
brew install postgresql

# Start service
brew services start postgresql

# Create database
createdb easytrip

# Verify
psql -U postgres -d easytrip -c "SELECT version();"
```

For Redis, install separately:

```bash
brew install redis
brew services start redis
```

### Step 4: Run Database Migrations

```bash
cd server
npm run db:migrate
cd ..
```

Expected output:

```
✓ Migration: 001_initial_schema.sql
✓ Migration: 002_auth_tables.sql
✓ 2 migrations applied
```

If migrations fail, check:
- Is PostgreSQL running? (`docker compose ps` or `brew services list`)
- Does `.env` have correct `DATABASE_URL`?

### Step 5: Start Development Server

```bash
cd server
npm run dev
```

Expected output:

```
[12:34:56] fastify server listening on 0.0.0.0:8000
[12:34:56] Swagger UI: http://localhost:8000/docs
```

#### Verify Backend is Running

```bash
curl http://localhost:8000/health
# Response: { "status": "ok" }
```

Visit **Swagger API Docs** at: `http://localhost:8000/docs`

---

## Database Setup (Supabase)

### Step 1: Create a Supabase Project

1. Go to **[supabase.com](https://supabase.com)** → **Sign Up** (free tier available)
2. Click **New Project**
3. Fill in:
   - **Project Name:** `easytrip-dev`
   - **Password:** Generate a strong password
   - **Region:** Choose closest to you (e.g., `eu-west-1` for Europe)
4. Click **Create new project** (takes ~2 minutes)

### Step 2: Get Credentials

Once the project is created:

1. Go to **Settings > API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **Anon Key** → `SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

Update `server/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAi...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAi...
```

Also update `.env` for frontend:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAi...
```

### Step 3: Run Migrations

Ensure your local PostgreSQL is running, then:

```bash
cd server
npm run db:migrate
```

This applies all schema migrations to your **local** database.

### Step 4: Verify Database Connection

Test the connection:

```bash
cd server
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
```

You should see a count of tables (e.g., `8` if migrations succeeded).

---

## Cache Setup (Upstash Redis)

### Step 1: Create Upstash Redis Database (Optional for Local Dev)

For **local development**, Redis started via Docker is sufficient. For **staging/production**, use Upstash.

1. Go to **[upstash.com](https://upstash.com)** → **Sign Up** (free tier: 10K commands/day)
2. Click **Create Database**
3. Fill in:
   - **Name:** `easytrip-dev`
   - **Region:** Choose closest region
4. Click **Create**

### Step 2: Get Connection URL

From the Upstash dashboard:

1. Copy **Redis URL** (looks like: `redis://:xxxxx@xxxxx.upstash.io:xxxxx`)
2. Update `server/.env`:

```env
REDIS_URL=redis://:your_auth_token@your_host.upstash.io:your_port
```

### Step 3: Verify Connection

```bash
cd server
npm run dev
# Check server logs for: "Redis connected"
```

---

## Authentication Setup

### Google OAuth

#### Step 1: Create Google Cloud Project

1. Go to **[console.cloud.google.com](https://console.cloud.google.com)**
2. Create a new project: **Google Cloud > My Projects > New Project**
3. Name it `easytrip` and click **Create**

#### Step 2: Enable OAuth API

1. In the left sidebar, go to **APIs & Services > Library**
2. Search for `Google+ API` and **Enable** it
3. Search for `Google Maps API` and **Enable** it

#### Step 3: Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:8000/auth/google/callback`
   - `com.easytrip.app:/oauth` (for mobile)
5. Click **Create**
6. Copy **Client ID** and **Client Secret**

#### Step 4: Update Environment Variables

For **backend** (`server/.env`):

```env
GOOGLE_OAUTH_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

For **frontend** (`.env`):

```env
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

### Apple OAuth (iOS Only)

#### Step 1: Create App ID in Apple Developer

1. Go to **[developer.apple.com](https://developer.apple.com)** → **Certificates, IDs & Profiles**
2. Click **Identifiers** → **App IDs**
3. Create new App ID:
   - **App Type:** App
   - **Bundle ID:** `com.easytrip.app`
   - Enable **Sign In with Apple**
4. Click **Save**

#### Step 2: Create Service ID

1. Go to **Identifiers** → **Services IDs**
2. Create new Service ID:
   - **Identifier:** `com.easytrip.app.service`
   - Enable **Sign In with Apple**
3. In the details, click **Configure** and add:
   - **Primary Domain:** `easytrip.app`
   - **Return URLs:** `http://localhost:8000/auth/apple/callback`

#### Step 3: Create Private Key

1. Go to **Keys**
2. Create new key with **Sign in with Apple** checked
3. Download `.p8` file and save to `server/certs/apple-key.p8`

#### Step 4: Update Environment Variables

```env
APPLE_TEAM_ID=your_team_id
APPLE_KEY_ID=your_key_id
APPLE_BUNDLE_ID=com.easytrip.app
APPLE_SERVICE_ID=com.easytrip.app.service
```

---

## Development Workflow

### Starting Both Frontend and Backend

#### In One Terminal (Recommended)

**Terminal 1: Backend**

```bash
cd server
npm run dev
```

**Terminal 2: Frontend**

```bash
npm start
```

Then press `i` for iOS, `a` for Android, or scan QR code.

### Running Tests

#### Test Everything

```bash
./scripts/run-tests.sh
```

#### Test Server Only

```bash
cd server
npm test
```

#### Test Frontend Only

```bash
npm test
```

#### Watch Mode (Auto-rerun on file changes)

```bash
cd server
npm run dev    # Already in watch mode via tsx

npm run lint   # Check code style
npm run typecheck  # TypeScript validation
```

### Code Quality Checks

#### Lint Code

```bash
npm run lint              # Mobile app
cd server && npm run lint # Backend
```

#### Type Check

```bash
npm run type-check       # Mobile app
cd server && npm run typecheck  # Backend
```

### Git Workflow

#### Create Feature Branch

```bash
git checkout -b feat/your-feature-name
```

#### Conventional Commits

```bash
# Format: type(scope): message
git commit -m "feat(auth): add sign-in with google"
git commit -m "fix(budget): currency rounding error"
git commit -m "docs(setup): update macos guide"
git commit -m "refactor(api): simplify error handling"
```

#### Push and Create Pull Request

```bash
git push origin feat/your-feature-name
```

Then create a PR on GitHub with:
- Clear description of changes
- Link related issues
- Reference any breaking changes

---

## Troubleshooting

### Port Conflicts

#### Port 3000 (Frontend) Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### Port 8000 (Backend) Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or configure different port in server/.env
PORT=8001 npm run dev
```

#### Port 5432 (PostgreSQL) Already in Use

```bash
# Stop existing PostgreSQL
brew services stop postgresql
# or
docker compose -f infra/docker-compose.prod.yml --profile local down

# Then restart
docker compose -f infra/docker-compose.prod.yml --profile local up -d
```

### Module Not Found Errors

#### `Cannot find module '@/...'`

This is a path alias. Check `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**Solution:** Clear cache and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

#### `Command 'npm' not found`

Node.js isn't installed or not in PATH.

**Solution:**

```bash
# Check if nvm is loaded
echo $NVM_DIR

# If empty, reload shell config
source ~/.zshrc  # or ~/.bash_profile

# Verify Node.js
node --version
```

### Database Connection Errors

#### `error: password authentication failed`

PostgreSQL credentials are wrong.

**Solution:**

1. Check `DATABASE_URL` in `server/.env`
2. Verify PostgreSQL is running:
   ```bash
   docker compose -f infra/docker-compose.prod.yml --profile local ps
   ```
3. Try connecting directly:
   ```bash
   psql postgresql://postgres:password@localhost:5432/easytrip
   ```

#### `error: database "easytrip" does not exist`

Database wasn't created.

**Solution:**

```bash
# Using Docker
docker compose -f infra/docker-compose.prod.yml --profile local down
docker compose -f infra/docker-compose.prod.yml --profile local up -d

# Or using Homebrew
createdb easytrip

# Then run migrations
cd server && npm run db:migrate
```

### Redis Connection Errors

#### `Error: ECONNREFUSED 127.0.0.1:6379`

Redis isn't running.

**Solution:**

```bash
# Using Docker
docker compose -f infra/docker-compose.prod.yml --profile local up -d redis

# Or using Homebrew
brew services start redis

# Verify connection
redis-cli ping
# Response: PONG
```

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| `npm ERR! ERESOLVE unable to resolve dependency tree` | Run `npm install --legacy-peer-deps` |
| `Expo: Metro bundler crashed` | Clear cache: `npm start -- --clear` |
| `TypeError: Cannot read property 'query' of undefined` | Ensure `DATABASE_URL` is set in `server/.env` |
| `SSL certificate error` | Use `NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev` (dev only!) |
| `Swagger UI shows 404` | Check server is running at `http://localhost:8000` |
| `Maps not showing in app` | Ensure `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is set |

### Getting Help

If you're stuck:

1. **Check logs:** Run commands with `DEBUG=*` prefix
   ```bash
   DEBUG=* npm run dev
   ```

2. **Clear everything and start fresh:**
   ```bash
   rm -rf node_modules server/node_modules dist .next
   npm install
   cd server && npm install && cd ..
   ```

3. **Check environment files:**
   ```bash
   # Verify files exist
   test -f .env && echo ".env OK" || echo ".env MISSING"
   test -f server/.env && echo "server/.env OK" || echo "server/.env MISSING"
   ```

4. **Review recent commits:** See what changed
   ```bash
   git log --oneline -10
   git diff HEAD~1
   ```

---

## Deployment

### Preparing for Production

#### Step 1: Environment Variables

Ensure all production env vars are set in AWS Secrets Manager (or your chosen secret manager):

```bash
# This is an example checklist
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=postgresql://...rds-proxy.amazonaws.com:5432/easytrip
REDIS_URL=redis://:token@...cache.amazonaws.com:6379
STRIPE_SECRET_KEY=sk_live_...
SUPABASE_SERVICE_ROLE_KEY=...
```

#### Step 2: Build Backend Docker Image

```bash
docker build -t easytrip-api ./server
docker tag easytrip-api:latest your-registry/easytrip-api:latest
docker push your-registry/easytrip-api:latest
```

#### Step 3: Build Mobile App (iOS/Android)

For App Store / Google Play, use **EAS Build**:

```bash
eas login
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios
eas submit --platform android
```

### Push Code to GitHub

1. **Create feature branch:**
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make changes, commit, and push:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feat/my-feature
   ```

3. **Create Pull Request** on GitHub, get reviewed, and merge to `main`

### Deploy to Oracle Cloud (Backend)

#### Prerequisites

- Oracle Cloud account with a container registry (OCIR)
- Kubernetes cluster running
- `kubectl` configured

#### Steps

1. **Build and push image:**
   ```bash
   docker build -t easytrip-api:latest ./server
   docker tag easytrip-api:latest iad.ocir.io/your-namespace/easytrip-api:latest
   docker push iad.ocir.io/your-namespace/easytrip-api:latest
   ```

2. **Update Kubernetes deployment:**
   ```bash
   kubectl set image deployment/easytrip-api \
     easytrip-api=iad.ocir.io/your-namespace/easytrip-api:latest \
     -n production
   ```

3. **Verify deployment:**
   ```bash
   kubectl rollout status deployment/easytrip-api -n production
   ```

4. **Check logs:**
   ```bash
   kubectl logs -f deployment/easytrip-api -n production
   ```

#### Environment Variable Setup for Production

Create a Kubernetes secret:

```bash
kubectl create secret generic easytrip-env \
  --from-literal=DATABASE_URL=postgresql://... \
  --from-literal=REDIS_URL=redis://... \
  --from-literal=ANTHROPIC_API_KEY=sk-ant-... \
  -n production
```

Reference in Kubernetes manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: easytrip-api
spec:
  template:
    spec:
      containers:
      - name: easytrip-api
        image: iad.ocir.io/your-namespace/easytrip-api:latest
        envFrom:
        - secretRef:
            name: easytrip-env
        ports:
        - containerPort: 8000
```

---

## Checklist: Ready for Development?

- [ ] **Node.js 20+** installed (`node --version`)
- [ ] **Git** configured with SSH keys
- [ ] **Repository cloned** to `~/Development/easytrip`
- [ ] **`.env` files** created and filled in (`.env` and `server/.env`)
- [ ] **PostgreSQL** running locally (`docker compose ... up -d` or `brew services start postgresql`)
- [ ] **Redis** running locally (`docker compose ... up -d` or `brew services start redis`)
- [ ] **Database migrations** applied (`cd server && npm run db:migrate`)
- [ ] **Backend starting** without errors (`cd server && npm run dev`)
- [ ] **Frontend starting** (`npm start`)
- [ ] **API accessible** at `http://localhost:8000/docs`
- [ ] **Mobile app** runs in simulator/device

---

## Next Steps

1. **Read the architecture guide:** `docs/02-architecture.md`
2. **Understand the database schema:** `cd server && npm run db:studio`
3. **Review the API docs:** Open `http://localhost:8000/docs` in browser
4. **Explore the codebase:**
   - Mobile: `src/screens/`, `src/components/`
   - Backend: `server/src/routes/`, `server/src/services/`
5. **Create your first feature branch:** `git checkout -b feat/my-feature`

---

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review [GitHub Issues](https://github.com/mathushan0/easytrip/issues)
3. Check the project's [Architecture Guide](docs/02-architecture.md)
4. Read [Contributing Guidelines](CONTRIBUTING.md) (if available)

---

**Happy coding! 🚀**
