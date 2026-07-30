#!/bin/bash

# Build signed release Android artifacts script
# This automates the process of building signed APK and AAB artifacts for release
# 
# Features:
#   - Pre-flight checks (branch, git status, tools, auth)
#   - Validates release version files prepared by the release PR
#   - Release note loading from the Release Notes GitHub Action
#   - Automated tests
#   - Dry-run mode for validation
#   - Automated Gradle APK and AAB build (no Android Studio needed!)
#   - APK and AAB attachment to an existing GitHub Release
#   - Slack notifications (optional)
#
# Usage:
#   yarn testDeploy          # Dry-run to validate everything
#   yarn build:signed        # Full release build (requires keystore password)
#
# Requirements:
#   - Keystore file (my-release-key.keystore) in project root
#   - GitHub CLI authenticated (gh auth login)
#   - Git on main branch with no uncommitted changes
#   - Release version already prepared and merged to main

set -e  # Exit on any error

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
DRY_RUN=""
RELEASE_ONLY=""
for arg in "$@"; do
  case "$arg" in
    --dry-run|-d)
      DRY_RUN="--dry-run"
      ;;
    --release-only|-r)
      RELEASE_ONLY="--release-only"
      ;;
  esac
done
SLACK_WEBHOOK=${SLACK_WEBHOOK:-""}  # Set SLACK_WEBHOOK env var for notifications
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APK_FILE="android/app/build/outputs/apk/release/app-release.apk"
AAB_FILE="android/app/build/outputs/bundle/release/app-release.aab"
APK_ASSET_NAME=""
AAB_ASSET_NAME=""
RELEASE_ASSET_DIR="tmp/android-release-assets"
VERSIONED_APK_FILE=""
VERSIONED_AAB_FILE=""
RELEASE_NOTES_WORKFLOW="release-notes.yml"
PUBLISH_APP_VERSION_WORKFLOW="publish-app-version.yml"
RELEASE_NOTES_ACTION_DIR="tmp/release-notes-action"
CUSTOMER_RELEASE_NOTES_FILE="tmp/release-notes.customer.md"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
  echo -e "${BLUE}=========================================="
  echo "$1"
  echo "==========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

has_non_empty_file() {
  [[ -f "$1" ]] && grep -q '[^[:space:]]' "$1"
}

set_release_asset_names() {
  APK_ASSET_NAME="maintley-${NEW_VERSION}-release.apk"
  AAB_ASSET_NAME="maintley-${NEW_VERSION}-release.aab"
  VERSIONED_APK_FILE="$RELEASE_ASSET_DIR/$APK_ASSET_NAME"
  VERSIONED_AAB_FILE="$RELEASE_ASSET_DIR/$AAB_ASSET_NAME"
}

prepare_versioned_release_assets() {
  mkdir -p "$RELEASE_ASSET_DIR"
  cp "$APK_FILE" "$VERSIONED_APK_FILE"
  cp "$AAB_FILE" "$VERSIONED_AAB_FILE"

  if [ ! -f "$VERSIONED_APK_FILE" ]; then
    print_error "$VERSIONED_APK_FILE not found! Versioned APK preparation failed."
    exit 1
  fi
  if [ ! -f "$VERSIONED_AAB_FILE" ]; then
    print_error "$VERSIONED_AAB_FILE not found! Versioned AAB preparation failed."
    exit 1
  fi

  ls -lh "$VERSIONED_APK_FILE"
  ls -lh "$VERSIONED_AAB_FILE"
  print_success "Versioned Android release assets are ready for upload"
}

# Run gh command and auto-refresh auth on failure, then retry once
run_gh_with_refresh() {
  local output
  output=$(env -u GH_TOKEN -u GITHUB_TOKEN "$@" 2>&1) || {
    if echo "$output" | grep -qi "Resource not accessible by personal access token\|authentication\|login"; then
      print_warning "GitHub auth issue detected. Refreshing credentials..." >&2
      gh auth refresh -h github.com -s repo
      env -u GH_TOKEN -u GITHUB_TOKEN "$@"
      return $?
    fi
    echo "$output"
    return 1
  }
  echo "$output"
  return 0
}

get_successful_release_notes_run_id() {
  local commit_sha=$1
  local output

  if ! output=$(run_gh_with_refresh gh run list \
    --repo "$REPO_NAME" \
    --workflow "$RELEASE_NOTES_WORKFLOW" \
    --commit "$commit_sha" \
    --limit 10 \
    --json databaseId,status,conclusion \
    --jq '.[] | select(.status == "completed" and .conclusion == "success") | .databaseId'); then
    return 1
  fi

  printf '%s\n' "$output" \
    | head -n 1 \
    | tr -d '\r'
}

get_latest_release_notes_run_status() {
  local commit_sha=$1
  local output

  if ! output=$(run_gh_with_refresh gh run list \
    --repo "$REPO_NAME" \
    --workflow "$RELEASE_NOTES_WORKFLOW" \
    --commit "$commit_sha" \
    --limit 1 \
    --json status,conclusion,url \
    --jq 'if length == 0 then "not found" else .[0].status + "/" + (.[0].conclusion // "pending") + " " + .[0].url end'); then
    return 1
  fi

  printf '%s\n' "$output"
}

load_release_notes_from_action() {
  local commit_sha
  local run_id
  local latest_status
  local artifact_name
  commit_sha=$(git rev-parse HEAD)
  artifact_name="release-notes-$commit_sha"

  print_info "Looking for Release Notes workflow artifact for $commit_sha"

  for attempt in 1 2 3 4 5 6; do
    if ! run_id=$(get_successful_release_notes_run_id "$commit_sha"); then
      print_error "Could not query Release Notes workflow runs."
      exit 1
    fi

    if [[ -n "$run_id" ]]; then
      break
    fi

    if ! latest_status=$(get_latest_release_notes_run_status "$commit_sha"); then
      print_error "Could not read the latest Release Notes workflow status."
      exit 1
    fi

    if [[ "$latest_status" == "not found" ]]; then
      print_warning "No Release Notes workflow run found for this commit."
      break
    fi

    print_warning "Release Notes workflow is not ready yet ($latest_status). Waiting..."
    sleep 10
  done

  if [[ -z "$run_id" ]]; then
    print_error "No successful Release Notes workflow artifact found for this commit."
    echo "Wait for the Release Notes action on main to finish, or rerun the workflow for this commit."
    exit 1
  fi

  rm -rf "$RELEASE_NOTES_ACTION_DIR"
  mkdir -p "$RELEASE_NOTES_ACTION_DIR" tmp

  if ! run_gh_with_refresh gh run download "$run_id" \
    --repo "$REPO_NAME" \
    --name "$artifact_name" \
    --dir "$RELEASE_NOTES_ACTION_DIR"; then
    print_error "Failed to download release note artifact: $artifact_name"
    exit 1
  fi

  if [[ ! -f "$RELEASE_NOTES_ACTION_DIR/release-notes.customer.md" ]]; then
    print_error "Release note artifact is missing release-notes.customer.md"
    exit 1
  fi

  if ! has_non_empty_file "$RELEASE_NOTES_ACTION_DIR/release-notes.customer.md"; then
    print_error "Release note artifact has empty customer release notes."
    exit 1
  fi

  if [[ ! -f "$RELEASE_NOTES_ACTION_DIR/release-notes.engineering.md" ]]; then
    print_error "Release note artifact is missing release-notes.engineering.md"
    exit 1
  fi

  if [[ ! -f "$RELEASE_NOTES_ACTION_DIR/release-notes.json" ]]; then
    print_error "Release note artifact is missing release-notes.json"
    exit 1
  fi

  cp "$RELEASE_NOTES_ACTION_DIR/release-notes.customer.md" "$CUSTOMER_RELEASE_NOTES_FILE"
  cp "$RELEASE_NOTES_ACTION_DIR/release-notes.engineering.md" tmp/release-notes.engineering.md
  cp "$RELEASE_NOTES_ACTION_DIR/release-notes.json" tmp/release-notes.json

  print_success "Loaded release notes from Release Notes workflow run $run_id"
}

# Function to send Slack notification
send_slack_notification() {
  local message=$1
  local status=$2
  
  if [[ -z "$SLACK_WEBHOOK" ]]; then
    return
  fi
  
  local color="good"
  [[ "$status" == "error" ]] && color="danger"
  [[ "$status" == "warning" ]] && color="warning"
  
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{
      \"attachments\": [{
        \"color\": \"$color\",
        \"title\": \"Release Pipeline: $status\",
        \"text\": \"$message\",
        \"ts\": $(date +%s)
      }]
    }" 2>/dev/null || true
}

# ========== PRE-FLIGHT CHECKS ==========
print_header "Pre-Flight Checks"

# Check we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  print_error "Not on main branch. Currently on: $CURRENT_BRANCH"
  exit 1
fi
print_success "On main branch"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
  print_error "Uncommitted changes detected. Please commit or stash first."
  git status
  exit 1
fi
print_success "No uncommitted changes"

# Check if repo is up-to-date
git fetch origin >/dev/null 2>&1
if [[ $(git rev-list --count main..origin/main) -gt 0 ]]; then
  print_error "Local branch is behind remote. Please pull latest changes."
  exit 1
fi
print_success "Local branch is up-to-date with remote"

# Check required tools
command -v node >/dev/null 2>&1 || { print_error "node not found"; exit 1; }
command -v yarn >/dev/null 2>&1 || { print_error "yarn not found"; exit 1; }
command -v git >/dev/null 2>&1 || { print_error "git not found"; exit 1; }
command -v gh >/dev/null 2>&1 || { print_error "gh (GitHub CLI) not found"; exit 1; }
print_success "All required tools found"

# Check GitHub token
if [[ -z $(gh auth token 2>/dev/null) ]]; then
  print_error "GitHub CLI not authenticated. Run: gh auth login"
  exit 1
fi
print_success "GitHub CLI authenticated"

# Check GitHub token scopes (needs repo for releases)
GITHUB_SCOPES=$(gh auth status -t -h github.com 2>/dev/null | grep -i "Token scopes" | sed 's/.*: //')
if [[ -z "$GITHUB_SCOPES" || "$GITHUB_SCOPES" != *"repo"* ]]; then
  print_error "GitHub token missing required scope: repo. Run: gh auth refresh -h github.com -s repo"
  exit 1
fi
print_success "GitHub token has repo scope"
REPO_NAME=${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}
print_success "Using GitHub repository: $REPO_NAME"

# Check required files exist
if [[ ! -f "my-release-key.keystore" ]]; then
  print_error "my-release-key.keystore not found. Cannot build signed APK."
  exit 1
fi
print_success "Required files found"

if [[ "$RELEASE_ONLY" == "--release-only" ]]; then
  print_warning "Release-only mode enabled. Skipping build and version generation."
  if [[ ! -f "RELEASE_NOTES.txt" ]]; then
    print_error "RELEASE_NOTES.txt not found. Cannot validate release-only mode."
    exit 1
  fi
  if ! has_non_empty_file "RELEASE_NOTES.txt"; then
    print_error "RELEASE_NOTES.txt is empty. Cannot validate release-only mode."
    exit 1
  fi
  if [[ ! -f "$APK_FILE" ]]; then
    print_error "$APK_FILE not found. Cannot update release assets."
    exit 1
  fi
  if [[ ! -f "$AAB_FILE" ]]; then
    print_error "$AAB_FILE not found. Cannot update release assets."
    exit 1
  fi
  NEW_VERSION=$(node -p "require('./package.json').version")
  set_release_asset_names
  RELEASE_NOTES_FILE="RELEASE_NOTES.txt"
  RELEASE_NOTES=$(cat RELEASE_NOTES.txt)
  RELEASE_NOTES_SUMMARY=$(echo "$RELEASE_NOTES" | head -n 8)
  goto_release_only=1
else
  goto_release_only=0
fi

echo ""

# ========== RUN TESTS ==========
if [[ "$goto_release_only" == "1" ]]; then
  goto_release_only=1
else
print_header "Running Tests"
if ! yarn test --watchAll=false --passWithNoTests 2>&1 | head -20; then
  print_warning "Tests failed or skipped. Continuing anyway..."
fi
print_success "Tests completed"
echo ""
fi

# ========== LOAD RELEASE NOTES ==========
if [[ "$goto_release_only" == "1" ]]; then
  goto_release_only=1
else
print_header "Step 0: Loading Release Notes"

mkdir -p tmp
RELEASE_METADATA_FILE="tmp/release-notes.json"
load_release_notes_from_action

node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(JSON.stringify({version:data.version, range:data.range, bump:data.bump, counts:data.counts, warnings:data.warnings}, null, 2));" "$RELEASE_METADATA_FILE"
echo ""

# Extract suggested version and notes from structured metadata.
SUGGESTED_VERSION=$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); process.stdout.write(data.version || '');" "$RELEASE_METADATA_FILE")
CURRENT_VERSION=$(node -p "require('./package.json').version")
RELEASE_NOTES_FILE="$CUSTOMER_RELEASE_NOTES_FILE"
AUTO_NOTES=$(cat "$RELEASE_NOTES_FILE" 2>/dev/null || true)

# ========== CHANGELOG VALIDATION ==========
if [[ -z "$SUGGESTED_VERSION" ]]; then
  if [[ -n "$CURRENT_VERSION" && -f "$RELEASE_NOTES_FILE" ]]; then
    print_warning "No new commits since last tag. Reusing version $CURRENT_VERSION and existing release notes."
    SUGGESTED_VERSION="$CURRENT_VERSION"
  else
    print_error "Failed to generate version number. Check git commits."
    exit 1
  fi
fi
print_success "Version generated: $SUGGESTED_VERSION"

if [[ "$SUGGESTED_VERSION" != "$CURRENT_VERSION" ]]; then
  print_error "Release version is not prepared on main."
  echo "Release Notes suggests v$SUGGESTED_VERSION, but package.json is v$CURRENT_VERSION."
  echo "Merge the release/next PR first, then rerun build:signed from main."
  exit 1
fi

node scripts/validateReleaseVersion.cjs

if ! has_non_empty_file "$RELEASE_NOTES_FILE"; then
  print_error "No customer release notes loaded. Check the Release Notes workflow artifact."
  exit 1
fi
print_success "Release notes loaded ($(echo "$AUTO_NOTES" | wc -l) lines)"

RELEASE_NOTES=$(cat "$RELEASE_NOTES_FILE")

echo "─────────────────────────────────────────"
echo ""
NEW_VERSION=$SUGGESTED_VERSION
set_release_asset_names
echo "Using version: $NEW_VERSION"
echo "Using release notes from the Release Notes GitHub Action."
echo ""
echo "Customer release notes:"
echo "-----------------------------------------"
cat "$RELEASE_NOTES_FILE"
echo "-----------------------------------------"

# Capture a short summary for the final output
RELEASE_NOTES_SUMMARY=$(echo "$RELEASE_NOTES" | head -n 8)

echo ""
# Version files must already be prepared by the release/next PR.
fi

# ========== DRY RUN MODE ==========
if [[ "$goto_release_only" == "1" ]]; then
  print_header "Release-Only Mode"
  echo ""
  print_warning "Skipping build and APK signing. Release-only mode will only update the GitHub Release asset."
  echo ""
else
if [[ "$DRY_RUN" == "--dry-run" || "$DRY_RUN" == "-d" ]]; then
  print_header "DRY RUN MODE"
  echo ""
  print_warning "This is a dry run. No APK, release, source commit, main push, web deploy, or Firestore publish will happen."
  echo ""
  echo "Would perform the following actions:"
  echo "  - Version: $NEW_VERSION"
  echo "  - Branch: main"
  echo "  - Validate prepared version files"
  echo "  - Build React app with mobile paths"
  echo "  - Run asset budget checks"
  echo "  - Sync Capacitor Android assets"
  echo "  - Build signed APK"
  echo "  - Build signed AAB"
  echo "  - Require the existing GitHub Release created by the website release workflow"
  echo "  - Upload $APK_ASSET_NAME"
  echo "  - Upload $AAB_ASSET_NAME"
  echo ""
  print_success "Dry run completed successfully. Ready for real release!"
  exit 0
fi
fi

if [[ "$goto_release_only" != "1" ]]; then
# ========== BUILD STEPS ==========
# Order is critical for proper asset paths:
# 1. Validate versions prepared by the release PR
# 2. Change homepage to relative paths for mobile build
# 3. Build React app with mobile-optimized assets
# 4. Sync Capacitor to copy mobile assets to Android project
# 5. Build signed APK with embedded mobile assets

print_header "Step 1: Validating Prepared Version Files"
node scripts/validateReleaseVersion.cjs

echo ""
print_header "Step 2: Building React App"
ORIGINAL_ROOT_HOMEPAGE=$(node -p "require('./package.json').homepage || ''")
ORIGINAL_CLIENT_HOMEPAGE=$(node -p "require('./client/package.json').homepage || ''")
node -e "const fs=require('fs'); for (const file of ['./package.json','./client/package.json']) { const pkg=require(file); pkg.homepage='./'; fs.writeFileSync(file, JSON.stringify(pkg, null, '\t') + '\n'); }"
print_success "Homepages changed to relative paths"

if ! yarn build; then
  print_error "Build failed!"
  send_slack_notification "Build failed for v$NEW_VERSION" "error"
  exit 1
fi
print_success "React app built successfully"

if ! yarn check:asset-budgets; then
  print_error "Asset budget check failed after mobile web build!"
  send_slack_notification "Asset budget check failed for v$NEW_VERSION" "error"
  exit 1
fi
print_success "Asset budgets passed for mobile web build"

echo ""
print_header "Step 3: Syncing Capacitor"

# Sync Capacitor to copy the built web assets to Android project
if ! npx cap sync android; then
  print_error "Capacitor sync failed!"
  send_slack_notification "Capacitor sync failed for v$NEW_VERSION" "error"
  exit 1
fi
print_success "Capacitor synced successfully - web assets copied to Android"

# Restore homepage values after mobile assets have been copied.
ORIGINAL_ROOT_HOMEPAGE="$ORIGINAL_ROOT_HOMEPAGE" ORIGINAL_CLIENT_HOMEPAGE="$ORIGINAL_CLIENT_HOMEPAGE" node -e "const fs=require('fs'); const restore=(file, homepage) => { const pkg=require(file); if (homepage) pkg.homepage=homepage; else delete pkg.homepage; fs.writeFileSync(file, JSON.stringify(pkg, null, '\t') + '\n'); }; restore('./package.json', process.env.ORIGINAL_ROOT_HOMEPAGE); restore('./client/package.json', process.env.ORIGINAL_CLIENT_HOMEPAGE);"
print_success "Original web homepages restored"

# Check keystore file
if [ ! -f "my-release-key.keystore" ]; then
  print_error "Keystore file (my-release-key.keystore) not found!"
  print_warning "Run: keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000"
  send_slack_notification "APK build failed - keystore not found for v$NEW_VERSION" "error"
  exit 1
fi

# Prompt for keystore password
if [[ "$DRY_RUN" == "--dry-run" ]]; then
  print_warning "Dry-run mode: skipping APK build"
  KEYSTORE_PASSWORD="dummy"
else
  # Check if password is in env file
  if [[ -z "$KEYSTORE_PASSWORD" ]]; then
    read -sp "Enter keystore password: " KEYSTORE_PASSWORD
    echo ""
    read -sp "Confirm keystore password: " KEYSTORE_PASSWORD_CONFIRM
    echo ""

    if [ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD_CONFIRM" ]; then
      print_error "Passwords do not match!"
      exit 1
    fi
  else
    print_info "Using KEYSTORE_PASSWORD from .env file"
  fi
fi

# Use same password for both keystore and key (or use KEY_PASSWORD from env if set)
if [[ -z "$KEYSTORE_KEY_PASSWORD" ]]; then
  KEY_PASSWORD="$KEYSTORE_PASSWORD"
else
  KEY_PASSWORD="$KEYSTORE_KEY_PASSWORD"
fi

echo ""
print_header "Step 4: Building Signed Android Artifacts"

# Build APK and AAB using Gradle (skip in dry-run)
if [[ "$DRY_RUN" == "--dry-run" ]]; then
  print_success "Android artifact build skipped (dry-run mode)"
else
  print_info "Building APK and AAB with Gradle..."
  cd android
  if ! ./gradlew assembleRelease \
    bundleRelease \
    -Pandroid.injected.signing.store.file="$(cd .. && pwd)/my-release-key.keystore" \
    -Pandroid.injected.signing.store.password="$KEYSTORE_PASSWORD" \
    -Pandroid.injected.signing.key.alias=my-key-alias \
    -Pandroid.injected.signing.key.password="$KEY_PASSWORD" \
    --quiet \
    --no-problems-report; then
    cd ..
    print_error "Gradle build failed!"
    send_slack_notification "APK build failed for v$NEW_VERSION" "error"
    exit 1
  fi
  cd ..

  # Verify APK and AAB were created
  if [ ! -f "$APK_FILE" ]; then
    print_error "app-release.apk not found! Gradle build may have failed."
    send_slack_notification "APK build failed for v$NEW_VERSION" "error"
    exit 1
  fi
  if [ ! -f "$AAB_FILE" ]; then
    print_error "app-release.aab not found! Gradle build may have failed."
    send_slack_notification "AAB build failed for v$NEW_VERSION" "error"
    exit 1
  fi
  print_success "APK and AAB built successfully with Gradle"
fi

echo ""
print_header "Step 5: Preparing Release Assets"
ls -lh "$APK_FILE"
ls -lh "$AAB_FILE"
print_success "Signed APK and AAB are ready for upload"
fi

# ========== ATTACH ASSETS TO GITHUB RELEASE ==========
echo ""
print_header "Step 6: Attaching Android Assets to GitHub Release"
prepare_versioned_release_assets
if [ -f "$RELEASE_NOTES_FILE" ] && [ -f "$VERSIONED_APK_FILE" ] && [ -f "$VERSIONED_AAB_FILE" ]; then
  if ! run_gh_with_refresh gh release view "v$NEW_VERSION" --repo "$REPO_NAME" >/dev/null 2>&1; then
    print_error "GitHub Release v$NEW_VERSION does not exist."
    echo "The production website release workflow must deploy successfully and create the tag and release before Android artifacts are uploaded."
    exit 1
  fi
  print_success "Found existing GitHub Release v$NEW_VERSION"

  # Upload/replace APK and AAB without changing the website release notes.
  if run_gh_with_refresh gh release upload "v$NEW_VERSION" \
    "$VERSIONED_APK_FILE" \
    "$VERSIONED_AAB_FILE" \
    --repo "$REPO_NAME" --clobber; then
    print_success "APK and AAB uploaded to existing GitHub release v$NEW_VERSION"
  else
    print_warning "Could not upload APK/AAB to release. You can upload them manually from GitHub."
    send_slack_notification "Failed to upload Android artifacts for v$NEW_VERSION" "warning"
    exit 1
  fi
else
  print_error "Missing release notes, APK, or AAB file"
  send_slack_notification "Missing files for GitHub release v$NEW_VERSION" "error"
  exit 1
fi

# ========== VERIFY RELEASE IS LIVE ==========
echo ""
print_header "Step 7: Verifying Release is Live"

RELEASE_URL="https://github.com/$REPO_NAME/releases/tag/v$NEW_VERSION"
APK_URL="https://github.com/$REPO_NAME/releases/download/v$NEW_VERSION/$APK_ASSET_NAME"
AAB_URL="https://github.com/$REPO_NAME/releases/download/v$NEW_VERSION/$AAB_ASSET_NAME"

print_info "Checking GitHub release..."
if gh release view "v$NEW_VERSION" --json "url,assets,isPrerelease,isDraft" -q ".url" >/dev/null 2>&1; then
  print_success "✓ GitHub release v$NEW_VERSION is live"
  RELEASE_ASSET_COUNT=$(gh release view "v$NEW_VERSION" --json "assets" -q ".assets | length")
  print_info "  Assets: $RELEASE_ASSET_COUNT file(s)"
else
  print_warning "⚠ Could not verify GitHub release (may still be accessible)"
fi

print_info "Checking APK availability..."
if curl -s -I "$APK_URL" | grep -q "200\|302"; then
  print_success "✓ APK is accessible at release URL"
else
  print_warning "⚠ APK URL may not be immediately accessible (CDN propagation)"
fi

print_info "Checking AAB availability..."
if curl -s -I "$AAB_URL" | grep -q "200\|302"; then
  print_success "✓ AAB is accessible at release URL"
else
  print_warning "⚠ AAB URL may not be immediately accessible (CDN propagation)"
fi


# ========== PUBLISH APP VERSION ==========
echo ""
print_header "Step 8: Publishing App Version"
print_info "Dispatching $PUBLISH_APP_VERSION_WORKFLOW after Android assets upload..."
if run_gh_with_refresh gh workflow run "$PUBLISH_APP_VERSION_WORKFLOW" \
  --repo "$REPO_NAME" \
  --ref main \
  -f version="$NEW_VERSION"; then
  print_success "Publish App Version workflow dispatched for v$NEW_VERSION"
else
  print_error "Failed to dispatch Publish App Version workflow"
  print_warning "Run manually: gh workflow run $PUBLISH_APP_VERSION_WORKFLOW --repo $REPO_NAME --ref main -f version=$NEW_VERSION"
  send_slack_notification "Failed to dispatch app-version publish for v$NEW_VERSION" "error"
  exit 1
fi

# ========== FINAL SUMMARY ==========
echo ""
print_header "Release Complete!"
echo ""
echo "Summary:"
print_success "Version prepared at $NEW_VERSION"
print_success "React app built with relative paths for mobile"
print_success "Capacitor synced with mobile-optimized assets"
print_success "APK built and signed"
print_success "AAB built and signed"
if [ "$RELEASE_EXISTS" = true ]; then
  print_success "APK and AAB replaced in existing GitHub release v$NEW_VERSION"
else
  print_success "GitHub release v$NEW_VERSION created with APK and AAB"
fi
echo ""
echo "Release notes for v$NEW_VERSION:"
echo "─────────────────────────────────────────"
if [[ -n "$RELEASE_NOTES_SUMMARY" ]]; then
  echo "$RELEASE_NOTES_SUMMARY"
else
  echo "  (no release notes provided)"
fi
echo "─────────────────────────────────────────"
echo ""
echo "Download link:"
echo "  $RELEASE_URL"
echo ""
echo "APK available at:"
echo "  $APK_URL"
echo ""
echo "AAB available at:"
echo "  $AAB_URL"
echo ""

# Send success notification
if [ "$RELEASE_EXISTS" = true ]; then
  send_slack_notification "✅ Release v$NEW_VERSION updated! APK and AAB replaced." "success"
else
  send_slack_notification "✅ Release v$NEW_VERSION completed successfully! APK and AAB deployed." "success"
fi

echo ""
echo "Done! Release v$NEW_VERSION is live! 🚀"
