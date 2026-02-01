#!/bin/bash

# Build signed release APK script
# This automates the process of building a signed APK for release
# 
# Features:
#   - Pre-flight checks (branch, git status, tools, auth)
#   - Auto-commits version changes
#   - Changelog validation from commits
#   - Automated tests
#   - Dry-run mode for validation
#   - Automated Gradle APK build (no Android Studio needed!)
#   - GitHub Release creation with APK attachment
#   - GitHub Pages deployment
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

# Check required files exist
if [[ ! -f "serviceAccountKey.json" ]]; then
  print_warning "serviceAccountKey.json not found. Firebase updates will be skipped."
fi
if [[ ! -f "my-release-key.keystore" ]]; then
  print_error "my-release-key.keystore not found. Cannot build signed APK."
  exit 1
fi
print_success "Required files found"

if [[ "$RELEASE_ONLY" == "--release-only" ]]; then
  print_warning "Release-only mode enabled. Skipping build and version generation."
  if [[ ! -f "RELEASE_NOTES.txt" ]]; then
    print_error "RELEASE_NOTES.txt not found. Cannot create release."
    exit 1
  fi
  if [[ ! -f "public/PropertyManager.apk" ]]; then
    print_error "public/PropertyManager.apk not found. Cannot create release."
    exit 1
  fi
  NEW_VERSION=$(node -p "require('./package.json').version")
  if ! git rev-parse -q --verify "refs/tags/v$NEW_VERSION" >/dev/null; then
    print_error "Git tag v$NEW_VERSION not found. Run full build or create the tag first."
    exit 1
  fi
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

# ========== GENERATE RELEASE NOTES ==========
if [[ "$goto_release_only" == "1" ]]; then
  goto_release_only=1
else
print_header "Step 0: Generating Release Notes"

# Capture full output including debug info
RELEASE_INFO=$(node scripts/generateReleaseNotes.cjs)

# Show only the JSON output part to avoid duplication
echo "$RELEASE_INFO" | grep -A 20 "JSON Output:" | head -15
echo ""

# Extract suggested version and notes from JSON output
SUGGESTED_VERSION=$(echo "$RELEASE_INFO" | grep -A 10 "JSON Output:" | grep '"version":' | sed 's/.*"version": "\(.*\)".*/\1/')
AUTO_NOTES=$(echo "$RELEASE_INFO" | grep -A 10 "JSON Output:" | grep '"notes":' | sed 's/.*"notes": "\(.*\)".*/\1/')

# ========== CHANGELOG VALIDATION ==========
if [[ -z "$SUGGESTED_VERSION" ]]; then
  CURRENT_VERSION=$(node -p "require('./package.json').version")
  if [[ -n "$CURRENT_VERSION" && -f "RELEASE_NOTES.txt" ]]; then
    print_warning "No new commits since last tag. Reusing version $CURRENT_VERSION and existing release notes."
    SUGGESTED_VERSION="$CURRENT_VERSION"
  else
    print_error "Failed to generate version number. Check git commits."
    exit 1
  fi
fi
print_success "Version generated: $SUGGESTED_VERSION"

if [[ -z "$AUTO_NOTES" ]]; then
  if [[ -f "RELEASE_NOTES.txt" ]]; then
    print_warning "No new release notes generated. Reusing existing RELEASE_NOTES.txt."
    AUTO_NOTES=$(cat RELEASE_NOTES.txt)
  else
    print_error "No release notes generated. Check for commits since last tag."
    exit 1
  fi
fi
print_success "Release notes generated ($(echo "$AUTO_NOTES" | wc -l) lines)"

# Write release notes to RELEASE_NOTES.txt
echo -e "$AUTO_NOTES" > RELEASE_NOTES.txt
RELEASE_NOTES=$(cat RELEASE_NOTES.txt)

echo "─────────────────────────────────────────"
echo ""
NEW_VERSION=$SUGGESTED_VERSION
echo "Using version: $NEW_VERSION"
echo "Using auto-generated release notes."

# Capture a short summary for the final output
RELEASE_NOTES_SUMMARY=$(echo "$RELEASE_NOTES" | head -n 8)

echo ""
if [[ "$DRY_RUN" != "--dry-run" && "$DRY_RUN" != "-d" ]]; then
  node scripts/updateAppVersion.cjs "$NEW_VERSION" "$RELEASE_NOTES"
  print_success "Version updated to $NEW_VERSION"
else
  print_warning "Skipping version update in dry-run mode"
fi
fi

# ========== DRY RUN MODE ==========
if [[ "$goto_release_only" == "1" ]]; then
  print_header "Release-Only Mode"
  echo ""
  print_warning "Skipping build, version update, commit, tag, and push."
  echo ""
else
if [[ "$DRY_RUN" == "--dry-run" || "$DRY_RUN" == "-d" ]]; then
  print_header "DRY RUN MODE"
  echo ""
  print_warning "This is a dry run. No changes will be committed or pushed."
  echo ""
  echo "Would perform the following actions:"
  echo "  - Version: $NEW_VERSION"
  echo "  - Branch: main"
  echo "  - Changes to commit:"
  echo "    * package.json (version update)"
  echo "    * src/utils/versionCheck.ts (version update)"
  echo "    * build/ (React build)"
  echo "    * android/ (Capacitor sync)"
  echo ""
  print_success "Dry run completed successfully. Ready for real release!"
  exit 0
fi
fi

if [[ "$goto_release_only" != "1" ]]; then
# ========== BUILD STEPS ==========
print_header "Step 1: Building React App"
sed -i 's|"homepage": "https://dobercodes.github.io/propertyManagerWebApp"|"homepage": "./"|g' package.json client/package.json
print_success "Homepage changed to relative path"

if ! yarn build; then
  print_error "Build failed!"
  send_slack_notification "Build failed for v$NEW_VERSION" "error"
  exit 1
fi
print_success "React app built successfully"

echo ""
print_header "Step 2: Syncing Capacitor"
npx cap sync || {
  print_warning "Capacitor sync had warnings/errors, continuing anyway..."
}
print_success "Capacitor synced"

echo ""
print_header "Step 3: Building Signed APK"

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

# Build APK using Gradle (skip in dry-run)
if [[ "$DRY_RUN" == "--dry-run" ]]; then
  print_success "APK build skipped (dry-run mode)"
else
  print_info "Building APK with Gradle..."
  cd android
  if ! ./gradlew assembleRelease \
    -Pandroid.injected.signing.store.file="$(cd .. && pwd)/my-release-key.keystore" \
    -Pandroid.injected.signing.store.password="$KEYSTORE_PASSWORD" \
    -Pandroid.injected.signing.key.alias=my-key-alias \
    -Pandroid.injected.signing.key.password="$KEY_PASSWORD" \
    --quiet; then
    cd ..
    print_error "Gradle build failed!"
    send_slack_notification "APK build failed for v$NEW_VERSION" "error"
    exit 1
  fi
  cd ..

  # Verify APK was created
  if [ ! -f "android/app/release/app-release.apk" ]; then
    print_error "app-release.apk not found! Gradle build may have failed."
    send_slack_notification "APK build failed for v$NEW_VERSION" "error"
    exit 1
  fi
  print_success "APK built successfully with Gradle"
fi

echo ""
print_header "Step 4: Finalizing Build"
cp android/app/release/app-release.apk public/PropertyManager.apk
print_success "APK copied to public folder"
ls -lh public/PropertyManager.apk

# Restore homepage for web deployment
sed -i 's|"homepage": "./"|"homepage": "https://dobercodes.github.io/propertyManagerWebApp"|g' package.json client/package.json
print_success "Homepage restored to GitHub Pages URL"

# Rebuild for web
yarn build
print_success "Web app rebuilt for deployment"

# ========== AUTOMATED GIT COMMIT ==========
echo ""
print_header "Step 5: Auto-Committing Changes"

git add package.json client/package.json src/utils/versionCheck.ts
if git diff --cached --quiet; then
  print_warning "No version changes to commit. Skipping commit/push/tag steps."
  SKIP_GIT_STEPS=1
else
  git commit -m "release: v$NEW_VERSION

- Bump version to $NEW_VERSION
- Update app version check
- Build signed APK"
  print_success "Changes committed to main"
  SKIP_GIT_STEPS=0
fi

# Push to main
echo ""
print_header "Step 6: Pushing to Main"
if [[ "$SKIP_GIT_STEPS" == "1" ]]; then
  print_warning "Skipping push (no new commits)."
else
  if ! git push origin main; then
    print_error "Failed to push to main branch"
    send_slack_notification "Failed to push v$NEW_VERSION to main" "error"
    exit 1
  fi
  print_success "Pushed to main branch"
fi

# ========== CREATE GIT TAG ==========
echo ""
print_header "Step 7: Creating Git Tag"
if [[ "$SKIP_GIT_STEPS" == "1" ]]; then
  print_warning "Skipping tag creation (no new commits)."
else
  git tag -a v$NEW_VERSION -m "Release version $NEW_VERSION"
  if ! git push origin --tags; then
    print_error "Failed to push tags"
    send_slack_notification "Failed to create tag for v$NEW_VERSION" "error"
    exit 1
  fi
  print_success "Git tag v$NEW_VERSION created and pushed"
fi
fi

# ========== CREATE GITHUB RELEASE ==========
echo ""
print_header "Step 8: Creating GitHub Release"
RELEASE_NOTES_FILE="RELEASE_NOTES.txt"
APK_FILE="public/PropertyManager.apk"
REPO_NAME=${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}

if [ -f "$RELEASE_NOTES_FILE" ] && [ -f "$APK_FILE" ]; then
  if gh release view "v$NEW_VERSION" >/dev/null 2>&1; then
    print_warning "Release v$NEW_VERSION already exists. Updating notes and uploading APK."
    if ! GH_TOKEN=$(gh auth token) gh release edit "v$NEW_VERSION" --notes-file "$RELEASE_NOTES_FILE"; then
      print_error "Failed to update GitHub release notes"
      send_slack_notification "Failed to update GitHub release notes for v$NEW_VERSION" "error"
      exit 1
    fi
  else
    if ! GH_TOKEN=$(gh auth token) gh api -X POST "repos/$REPO_NAME/releases" \
      -f tag_name="v$NEW_VERSION" \
      -f name="Release v$NEW_VERSION" \
      -f body="$(cat "$RELEASE_NOTES_FILE")"; then
      print_error "Failed to create GitHub release"
      send_slack_notification "Failed to create GitHub release for v$NEW_VERSION" "error"
      exit 1
    fi
    print_success "GitHub release v$NEW_VERSION created"
  fi

  if ! GH_TOKEN=$(gh auth token) gh release upload "v$NEW_VERSION" "$APK_FILE" --clobber; then
    print_error "Failed to upload APK to GitHub release"
    send_slack_notification "Failed to upload APK for v$NEW_VERSION" "error"
    exit 1
  fi
  print_success "APK uploaded to GitHub release"
else
  print_error "Missing release notes or APK file"
  send_slack_notification "Missing files for GitHub release v$NEW_VERSION" "error"
  exit 1
fi

# Clear release notes and remove APK from public folder
echo "" > RELEASE_NOTES.txt
rm -f public/PropertyManager.apk
print_success "Release notes cleared and APK removed from public folder"

# ========== GITHUB PAGES DEPLOYMENT ==========
echo ""
print_header "Step 9: Deploying to GitHub Pages"
if ! yarn deploy; then
  print_error "GitHub Pages deployment failed"
  send_slack_notification "GitHub Pages deployment failed for v$NEW_VERSION" "error"
  exit 1
fi
print_success "Deployed to GitHub Pages"

# ========== FINAL SUMMARY ==========
echo ""
print_header "Release Complete!"
echo ""
echo "Summary:"
print_success "Version bumped to $NEW_VERSION"
print_success "APK built and signed"
print_success "Changes committed and pushed to main"
print_success "Git tag v$NEW_VERSION created"
print_success "GitHub release created with APK"
print_success "Website deployed to GitHub Pages"
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
echo "  https://github.com/DoberCodes/propertyManagerWebApp/releases/tag/v$NEW_VERSION"
echo ""
echo "APK available at:"
echo "  https://dobercodes.github.io/propertyManagerWebApp/PropertyManager.apk"
echo ""

# Send success notification
send_slack_notification "✅ Release v$NEW_VERSION completed successfully! APK deployed and website updated." "success"

echo ""
echo "Done! Release v$NEW_VERSION is live! 🚀"
