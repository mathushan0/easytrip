#!/usr/bin/env bash
# =============================================================================
# EasyTrip — EAS Build Trigger
# =============================================================================
# Triggers an EAS Build for iOS and/or Android.
#
# Usage:
#   ./scripts/build-mobile.sh [--platform ios|android|all] [--profile development|preview|production]
#
# Examples:
#   ./scripts/build-mobile.sh                           # defaults: all / preview
#   ./scripts/build-mobile.sh --platform ios            # iOS only
#   ./scripts/build-mobile.sh --profile production      # production build
#   ./scripts/build-mobile.sh --platform android --profile development
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

# Defaults
PLATFORM="all"
PROFILE="preview"
WAIT="false"
SUBMIT="false"

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform)   PLATFORM="$2"; shift 2 ;;
    --profile)    PROFILE="$2";  shift 2 ;;
    --wait)       WAIT="true";   shift ;;
    --submit)     SUBMIT="true"; shift ;;
    --help|-h)
      echo "Usage: $0 [--platform ios|android|all] [--profile development|preview|production] [--wait] [--submit]"
      exit 0
      ;;
    *) error "Unknown option: $1" ;;
  esac
done

# Validate
case "$PLATFORM" in
  ios|android|all) ;;
  *) error "Invalid platform: $PLATFORM (ios|android|all)" ;;
esac

case "$PROFILE" in
  development|preview|production) ;;
  *) error "Invalid profile: $PROFILE (development|preview|production)" ;;
esac

# Check prerequisites
if ! command -v eas &>/dev/null; then
  error "EAS CLI not installed. Run: npm install -g eas-cli"
fi

if ! eas whoami &>/dev/null; then
  error "Not logged in to Expo. Run: eas login"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

info "EasyTrip Mobile Build"
info "Platform: $PLATFORM | Profile: $PROFILE | Wait: $WAIT | Submit: $SUBMIT"

# Confirmation for production builds
if [[ "$PROFILE" == "production" ]]; then
  warn "⚠️  This will build a PRODUCTION app for store submission!"
  read -p "Continue? (y/N): " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    info "Cancelled."
    exit 0
  fi
fi

WAIT_FLAG=""
if [[ "$WAIT" == "true" ]]; then
  WAIT_FLAG=""
else
  WAIT_FLAG="--no-wait"
fi

BUILD_IOS_ID=""
BUILD_ANDROID_ID=""

# iOS build
if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
  info "Starting iOS build ($PROFILE)..."
  BUILD_OUTPUT=$(eas build \
    --platform ios \
    --profile "$PROFILE" \
    --non-interactive \
    --json \
    $WAIT_FLAG 2>&1)

  if echo "$BUILD_OUTPUT" | grep -q '"id"'; then
    BUILD_IOS_ID=$(echo "$BUILD_OUTPUT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    success "iOS build submitted: $BUILD_IOS_ID"
    echo "  View: https://expo.dev/accounts/easytrip/projects/easytrip/builds/$BUILD_IOS_ID"
  else
    error "iOS build failed:\n$BUILD_OUTPUT"
  fi
fi

# Android build
if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
  info "Starting Android build ($PROFILE)..."
  BUILD_OUTPUT=$(eas build \
    --platform android \
    --profile "$PROFILE" \
    --non-interactive \
    --json \
    $WAIT_FLAG 2>&1)

  if echo "$BUILD_OUTPUT" | grep -q '"id"'; then
    BUILD_ANDROID_ID=$(echo "$BUILD_OUTPUT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    success "Android build submitted: $BUILD_ANDROID_ID"
    echo "  View: https://expo.dev/accounts/easytrip/projects/easytrip/builds/$BUILD_ANDROID_ID"
  else
    error "Android build failed:\n$BUILD_OUTPUT"
  fi
fi

# Submit after build (only if --submit and --wait)
if [[ "$SUBMIT" == "true" && "$WAIT" == "true" ]]; then
  if [[ -n "$BUILD_IOS_ID" ]]; then
    info "Submitting iOS build to TestFlight..."
    eas submit --platform ios --profile "$PROFILE" --non-interactive --id "$BUILD_IOS_ID"
    success "iOS submitted to TestFlight"
  fi

  if [[ -n "$BUILD_ANDROID_ID" ]]; then
    info "Submitting Android build to Play Store (internal track)..."
    eas submit --platform android --profile "$PROFILE" --non-interactive --id "$BUILD_ANDROID_ID"
    success "Android submitted to Play Store"
  fi
fi

success "Build process initiated."
if [[ "$WAIT" != "true" ]]; then
  info "Builds are running in the background. Monitor at: https://expo.dev"
fi
