# Deployment

Last reviewed: 2026-06

This document describes Maintley's current build, deployment, environment, and release validation process.

Maintley includes:

* React web app in the repository root.
* Firebase Functions in `functions/`.
* Firestore rules in `firestore.rules`.
* Capacitor Android project in `android/`.

---

# Deployment Philosophy

Deployments should be small, intentional, and easy to validate.

Avoid broad deployments when a targeted deployment is safer.

Preferred order:

1. Build and test locally.
2. Deploy backend/rules first when frontend depends on them.
3. Deploy frontend after backend support exists.
4. Validate owner, team member, tenant, and billing-sensitive flows after deployment.

---

# Project Pieces

## React Web App

Location:

```text
/
```

Build output:

```text
build/
```

## Firebase Functions

Location:

```text
functions/
```

Compiled output:

```text
functions/lib/
```

## Firestore Rules

Rules source:

```text
firestore.rules
```

## Android

Capacitor Android project:

```text
android/
```

---

# Web Build

Build the React production app:

```bash
npm run build
```

The production build is written to:

```text
build/
```

The root `package.json` also includes:

```bash
npm run deploy
```

This uses:

```bash
gh-pages -d build
```

`npm run deploy:gh-pages` is also available as an explicit alias to the same command.

Confirm the intended hosting target before using this command.

Firebase Hosting is not configured in `firebase.json`.

---

# Firebase Hosting

Firebase Hosting is not part of the active deployment path.

Do not run `firebase deploy --only hosting` unless Firebase Hosting is
intentionally reintroduced.

---

# GitHub Pages PWA Assets

The active web deployment publishes the React `build/` output through GitHub
Pages on Maintley's custom domain.

GitHub Pages deployment is handled by:

```text
.github/workflows/deploy-web.yml
```

The workflow runs after release version files are pushed to `main`, which
normally happens when the `release/next` PR is merged. It builds the web app,
runs asset budget checks, and publishes the existing `build/` folder with
`gh-pages` using the workflow `GITHUB_TOKEN`.

PWA files live in `public/` and are copied to the root of `build/` during
`npm run build`:

* `manifest.json`
* `service-worker.js`
* `offline.html`
* `favicon.ico`
* `favicon.svg`
* `apple-touch-icon.png`
* `mstile-150x150.png`
* `icons/*`

The service worker intentionally caches only the app shell, static build
assets, icons, and the offline fallback page. It should not cache Firebase,
Firestore, Storage, document, invoice, or private property-data responses.

---

# Firebase Functions Build

Build Functions:

```bash
yarn --cwd functions build
```

Compiled output is written to:

```text
functions/lib/
```

---

# Firebase Functions Deploy

Deploy all functions:

```bash
firebase deploy --only functions
```

or:

```bash
npm --prefix functions run deploy
```

Prefer deploying specific functions when possible:

```bash
firebase deploy --only functions:sendPushOnNotificationCreate
```

Targeted function deploys reduce risk when changing isolated backend behavior.

---

# Firestore Rules Deploy

Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

Rules source:

```text
firestore.rules
```

Run rule tests before deploying broad rules changes.

---

# Firebase Project Configuration

`firebase.json` currently configures:

* `functions.source`: `functions`
* `firestore.rules`: `firestore.rules`

There is currently no Storage rules file wired in `firebase.json`.

Before relying on local Storage rule tests, verify whether Firebase Storage rules are managed locally or only through the Firebase Console.

---

# Environment Files

Common local files:

* `.env`
* `.env.local`
* `.env.example`

Do not commit secrets.

The repository should ignore:

* `.env*`
* service account keys
* Android release artifact outputs
* keystores
* private signing files

Important frontend variables include:

* Firebase public config
* Stripe public config
* Stripe price identifiers where needed by frontend flows
* `REACT_APP_FIREBASE_WEB_PUSH_VAPID_KEY`, required for browser push
  notification registration
* `REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_HOST`, optional for local development
  when routing callable Functions to the emulator, such as `localhost:5001`

Important backend configuration includes:

* Stripe secrets
* Stripe webhook secret
* Email provider credentials
* Firebase Functions params/secrets
* Plan price identifiers

Important GitHub Actions secrets include:

* Frontend Firebase config:
  * `PROD_REACT_APP_FIREBASE_API_KEY`
  * `PROD_REACT_APP_FIREBASE_AUTH_DOMAIN`
  * `PROD_REACT_APP_FIREBASE_PROJECT_ID`
  * `PROD_REACT_APP_FIREBASE_STORAGE_BUCKET`
  * `PROD_REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
  * `PROD_REACT_APP_FIREBASE_APP_ID`
* `PROD_FIREBASE_PROJECT_ID` for Firebase deploy targeting; if omitted, the
  deploy workflow falls back to `PROD_REACT_APP_FIREBASE_PROJECT_ID`
* `PROD_REACT_APP_FIREBASE_WEB_PUSH_VAPID_KEY` for browser push builds
* `FIREBASE_SERVICE_ACCOUNT_JSON` for Firebase rules and Functions deployment
* Stripe price IDs for non-interactive Functions deploy:
  * `PROD_STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID`
  * `PROD_STRIPE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID`
  * `PROD_STRIPE_PROPERTY_MONTHLY_PRICE_ID`
  * `PROD_STRIPE_PROPERTY_ANNUAL_PRICE_ID`
  * `PROD_STRIPE_PORTFOLIO_MONTHLY_PRICE_ID`
  * `PROD_STRIPE_PORTFOLIO_ANNUAL_PRICE_ID`

The Firebase deploy workflow falls back to matching frontend secret names with
the `PROD_REACT_APP_` prefix for Stripe price IDs when the backend-specific
secret names are not present.

Frontend builds run `scripts/validateFrontendEnv.cjs` before `react-scripts
build`. Missing values or placeholder values such as `YOUR_STORAGE_BUCKET`
block the build so production cannot publish a bundle pointed at a placeholder
Firebase project or Storage bucket.

During CI, these Stripe price IDs are written into a temporary
`functions/.env` file before `firebase deploy` runs. This is required because
Firebase Functions params are resolved from dotenv files during non-interactive
deploys. The file is ignored by git and should not be committed.

Review environment setup before deploying billing, email, or notification changes.

## GitHub Actions Firebase Deploy Authentication

Firebase rules and Functions deploy through:

```text
.github/workflows/firebase-deploy-environments.yml
```

The workflow authenticates with `google-github-actions/auth` using the
`FIREBASE_SERVICE_ACCOUNT_JSON` repository secret.

Recommended setup:

1. Create a dedicated Google Cloud service account for GitHub deploys.
2. Grant only the roles needed to deploy Firestore rules and Cloud Functions.
3. Create a JSON key for that service account.
4. Add the minified JSON value as the GitHub Actions repository secret:

```text
FIREBASE_SERVICE_ACCOUNT_JSON
```

Treat this JSON like a password. Do not commit it to the repository.

`FIREBASE_TOKEN` is no longer used by the active Firebase deploy workflow.

The GitHub deploy service account must also be allowed to act as the Cloud
Functions runtime service account. If deploy fails with:

```text
Missing permissions required for functions deploy. You must have permission iam.serviceAccounts.ActAs
```

grant the GitHub deploy service account the IAM role:

```text
Service Account User
```

on the runtime service account shown in the error, commonly:

```text
PROJECT_ID@appspot.gserviceaccount.com
```

This permission should be granted to the GitHub deploy service account, not to
the runtime service account itself.

Firestore rules deployment also requires permission to test and release rules
through the Firebase Rules API. If deploy fails with:

```text
Request to https://firebaserules.googleapis.com/...:test had HTTP Error: 403
```

grant the GitHub deploy service account a role that includes Firebase Rules
permissions. The practical project-level role is:

```text
Firebase Rules Admin
```

This lets the deploy workflow validate and publish `firestore.rules`.

Cloud Storage rules deployment also requires the deploy service account to read
the Firebase Storage default bucket. If deploy fails with:

```text
Permission 'firebasestorage.defaultBucket.get' denied
```

grant the GitHub deploy service account:

```text
Cloud Storage for Firebase Viewer
```

If CI should deploy `storage.rules`, grant:

```text
Cloud Storage for Firebase Admin
```

The deploy workflow only includes the `storage` target on push when
`storage.rules` or `firebase.json` changes. Manual workflow runs can include it
by setting deploy targets to:

```text
functions,firestore:rules,storage
```

Firebase Functions deploy may also ask the Firebase Extensions API about
installed extension instances while analyzing the project. If deploy fails with:

```text
Request to https://firebaseextensions.googleapis.com/.../instances had HTTP Error: 403
```

grant the GitHub deploy service account:

```text
Firebase Extensions Viewer
```

If the project later manages extensions through CI, use:

```text
Firebase Extensions Admin
```

For the current Maintley deploy workflow, viewer access is enough because the
workflow only needs Firebase CLI analysis to list extension instances.

Cloud Functions deploy may also check project billing state through the Cloud
Billing API. If deploy fails with:

```text
cloudbilling.googleapis.com/.../billingInfo had HTTP Error: 403
Cloud Billing API has not been used ... or it is disabled
```

enable the Cloud Billing API for the Firebase/GCP project. If the API is
enabled and deploy still fails, grant the GitHub deploy service account a
read-only billing role that can inspect project billing state, such as:

```text
Billing Account Viewer
```

The deploy workflow does not need to manage billing accounts.

Scheduled Cloud Functions require Cloud Scheduler job permissions during
deploy. If deploy fails with:

```text
lacks IAM permission "cloudscheduler.jobs.update"
```

grant the GitHub deploy service account:

```text
Cloud Scheduler Admin
```

This is required for Firebase CLI to create or update scheduler jobs for
scheduled Functions such as task reminders, monthly summaries, seasonal
guidance, and cleanup jobs.

Functions that use Firebase/Google Secret Manager params require the deploy
service account to read secret metadata and versions during deploy analysis. If
deploy fails with:

```text
Permission 'secretmanager.secrets.get' denied
```

grant the GitHub deploy service account:

```text
Secret Manager Secret Accessor
```

For least privilege, grant this on the specific secrets used by deployed
Functions, such as `STRIPE_WEBHOOK_SECRET`. A project-level grant is simpler
but broader.

---

# Deployment Order

## Frontend-Only Changes

Examples:

* UI layout
* copy changes
* dashboard display changes
* client-side filters

Recommended flow:

```bash
npm run build
```

Publish the generated build through the active web hosting channel.

---

## Functions-Only Changes

Examples:

* email workers
* Stripe functions
* notification functions
* scheduled jobs

Recommended flow:

```bash
yarn --cwd functions build
firebase deploy --only functions
```

Prefer targeted deployment when practical.

---

## Firestore Rules Changes

Examples:

* permission changes
* account access changes
* resource limit changes
* collection write rules

Recommended flow:

```bash
npm run test:rules
firebase deploy --only firestore:rules
```

After deploying rules, manually verify:

* account owner access
* team member access
* tenant access
* free plan limits
* paid plan limits

---

## Backend + Frontend Changes

When frontend code depends on new functions, rules, or backend behavior:

1. Deploy Functions and/or Rules.
2. Confirm backend deployment succeeded.
3. Deploy the frontend through the active web hosting channel.

Example:

```bash
yarn --cwd functions build
firebase deploy --only functions
npm run build
```

---

# Android Build

Capacitor commands:

```bash
npm run build:apk
npm run cap:sync
npm run cap:open
```

Manual flow:

```bash
npm run build
npx cap sync android
npx cap open android
```

Signed build helper:

```bash
npm run build:signed
```

The repository contains:

```text
build-signed-apk.sh
```

`build:signed` remains the local signed Android artifact helper while Android
signing secrets stay local. Release notes, version preparation, and app-version
publication are moving into GitHub Actions so source changes remain
PR-reviewable.

Release notes are generated by the `Release Notes` GitHub Action. The action
uses `scripts/generateReleaseNotes.cjs`, reads the git range from the latest
`v*` tag to `HEAD`, and uploads customer-facing notes, engineering notes, and
structured metadata as workflow artifacts. When GitHub metadata is available,
merged PR titles, labels, and files are preferred over raw commit messages.
Direct commits are still included but reported as warnings so releases can move
toward a PR-based pattern.

The generator produces two release note layers:

* Customer-facing notes for the public GitHub Release body.
* Engineering notes for technical review, traceability, and release artifacts.

PR authors may add a customer-ready note to the PR body using one of these
headings or inline labels:

```text
Release note: Clearer dashboard focus controls help each user reduce noise.

## Customer Release Note
Maintley now shows clearer dashboard focus controls for each user.
```

`build:signed` does not regenerate release notes. It downloads the successful
`release-notes.yml` artifact for the current `main` commit and reads release
metadata from:

```text
tmp/release-notes.json
```

and uses the customer release note artifact as the GitHub Release body:

```text
tmp/release-notes.customer.md
```

The customer release note artifact is customer-facing. Engineering notes are written to:

```text
tmp/release-notes.engineering.md
```

The action also generates release note previews for pull requests into `main`
and release note artifacts after merges to `main`. When a release has no
customer-facing entries, the customer notes use a short behind-the-scenes
improvement message instead of publishing a blank GitHub Release body.
Release-prep PRs such as `Release v2.7.23` are excluded from generated release
notes so they do not appear as customer-facing improvements.

Release version changes are prepared by:

```text
.github/workflows/release-prep.yml
```

The Release Prep workflow runs after pushes to `main`, computes the highest
required bump across the unreleased range, and opens or updates the `release/next`
PR. That PR updates:

* `package.json`
* `client/package.json`
* `android/app/build.gradle` `versionName`
* `android/app/build.gradle` `versionCode`

The workflow uses `scripts/prepareReleaseVersion.cjs` and
`scripts/validateReleaseVersion.cjs`. If a patch-only release PR is open and a
feature or breaking change later lands on `main`, the same `release/next` PR is
updated with the higher required bump.

`release/next` is treated as a version-only administrative PR. Release note
previews and E2E tests are skipped for that PR, while Build Check runs only
`yarn version:validate`. After the release PR merges to `main`, Release Prep
does not open another release PR from the `release: prepare v...` commit.

The current app version used by update notifications is derived from
`package.json` through:

```text
src/config/appVersion.ts
```

This prevents the landing page, feedback metadata, and in-app update checks from
drifting away from the package version.

Firestore app-version publication is handled by:

```text
.github/workflows/publish-app-version.yml
```

`build:signed` dispatches the Publish App Version workflow after the signed APK
and AAB are uploaded to the GitHub Release. The workflow waits until the
versioned APK release asset is reachable, then writes `appConfig/version`. This
prevents users from seeing an update notification before the APK exists.

If the dispatch step fails, run it manually after confirming the release asset
exists:

```bash
gh workflow run publish-app-version.yml --repo DoberFamilyVentures/propertyManagerWebApp --ref main -f version=2.9.16
```

Web deployment is handled separately by the Deploy Web workflow when release
version files land on `main`. `build:signed` does not deploy GitHub Pages.

The release-notes action is not a test workflow. `build:signed` still performs
its local test, build, and asset-budget validation before publishing a release.

The signed Android artifact helper runs `yarn check:asset-budgets` after the
mobile web build. Asset budget target misses up to 15% over target pass with a
warning and make frontend optimization a top priority for the next release.
Asset budget misses more than 15% over target block the release before
Capacitor sync or Android artifact upload proceeds.

Review local signing configuration before running release builds.

Do not commit keystores or signing secrets.

### Android Release Assets

Android releases are published to the active GitHub repository as:

```text
maintley-{version}-release.apk
maintley-{version}-release.aab
```

`build:signed` copies the Gradle outputs into these versioned filenames before
uploading them. Do not rely on GitHub Release asset labels for the download URL;
GitHub download paths are based on the uploaded file name.

Example release asset names for v2.9.16:

```text
maintley-2.9.16-release.apk
maintley-2.9.16-release.aab
```

The current public APK download endpoint for a release is:

```text
https://github.com/DoberFamilyVentures/propertyManagerWebApp/releases/download/v{version}/maintley-{version}-release.apk
```

The Android App Bundle is also attached to each GitHub Release for app-store
bundle maintenance:

```text
https://github.com/DoberFamilyVentures/propertyManagerWebApp/releases/download/v{version}/maintley-{version}-release.aab
```

The signed release helper derives its repository from `GITHUB_REPOSITORY` when set, or from the authenticated GitHub repository. It should not contain hardcoded organization or download URLs.

---

# Pre-Deploy Checks

Recommended checks before most deployments:

```bash
npm run build
npm run check:asset-budgets
yarn --cwd functions build
npm run test:rules
```

For Stripe changes:

```bash
npm run test:stripe:sandbox
npm run test:stripe:cards:sandbox
npm run test:stripe:webhook:sandbox
```

For broad UI confidence:

```bash
npm run e2e
```

For Storage-related changes:

```bash
npm run test:storage
```

Only rely on Storage tests after confirming local Storage rules match deployed Storage rule behavior.

---

# Release Validation Checklist

After deployment, validate the areas affected by the change.

## Core App

* Login works.
* Dashboard loads.
* Properties load.
* Tasks load.
* Appliances & Systems load.
* Property detail pages load.
* Mobile navigation works.

## Maintenance Flow

* Create task.
* Complete task.
* Confirm maintenance event is created.
* Confirm completed task appears in history.

## Billing-Sensitive Areas

Validate after billing, plan, rules, or subscription changes:

* Free account limits.
* Homeowner+ access.
* Property plan access.
* Portfolio plan access.
* Upgrade prompts.
* Team member accounts do not see billing ownership UI.
* Tenant accounts do not see billing ownership UI.

## Permission-Sensitive Areas

Validate after rules or role changes:

* Owner access.
* Admin/team member access.
* Limited role access.
* Assigned-property filtering.
* Tenant access.
* Contractor/guest restrictions where applicable.

## Notification Areas

Validate after notification changes:

* In-app notification creation.
* Push token registration.
* Push delivery where supported.
* Notification preferences respected.
* Browser notification permission denial handled calmly.
* Invalid browser push tokens are removed from user records after failed
  delivery.

## Email Areas

Validate after email changes:

* Monthly Property Summary.
* Property Insights.
* Task reminders.
* Team member task reports.
* Seasonal guidance.

---

# Release Notes

Release helper:

```bash
npm run release:notes
npm run release:notes:preview
```

Useful release note options:

```bash
npm run release:notes -- --dry-run
npm run release:notes -- --output RELEASE_NOTES.txt --engineering-output tmp/release-notes.engineering.md --metadata-output tmp/release-notes.json
npm run release:notes -- --bump patch
npm run release:notes -- --version 2.8.0
```

The generator is designed for the PR merge flow: merge feature branches into
`main`, let Release Prep open or update `release/next`, merge the release PR,
then run the signed release from a clean and up-to-date `main` after the Release
Notes artifact for that commit is available. The signed release consumes those
artifacts instead of regenerating notes locally.

`release:notes:preview` writes:

```text
tmp/release-notes.customer.md
tmp/release-notes.engineering.md
tmp/release-notes.json
```

Version helpers exist in:

```text
scripts/initAppVersion.cjs
scripts/prepareReleaseVersion.cjs
scripts/publishAppVersion.cjs
scripts/syncAppVersion.cjs
scripts/updateAppVersion.cjs
scripts/validateReleaseVersion.cjs
```

Use customer release notes to summarize meaningful user-facing changes. Keep
implementation details, dependency updates, and internal release context in the
engineering notes unless they directly affect customers.

---

# Deployment Cautions

* Deploy backend/rules before frontend when frontend depends on new function or rule behavior.
* Deploy frontend after backend changes when UI routes call newly deployed functions.
* Avoid deploying broad rules changes without running rule tests.
* Avoid deploying all functions when a targeted function deploy is sufficient.
* Team member accounts should not be treated as billing owners during deployment validation.
* Tenant accounts should not be treated as billing owners during deployment validation.
* Do not commit secrets, keystores, service account files, or production environment files.
* Verify Firebase project target before deploying.

---

# CI Deployment Gate

The Firebase deployment workflow (`firebase-deploy-environments.yml`) runs a
`build-check` job before deployment. The job installs root dependencies, runs
`yarn test:ci`, and builds the frontend with production Firebase and Stripe
environment variables.

The deploy job requires `build-check` to pass. A failed test or frontend build
therefore prevents the Firebase deployment in that workflow.

## ADR Implementation Tracker Workflow

The ADR tracker workflow lives in:

```text
.github/workflows/adr-implementation-trackers.yml
```

It runs after pushes to `main` that change files in:

```text
project-docs/ADR/
```

The workflow creates or reuses GitHub issues for accepted ADRs that need
implementation tracking. Manual workflow runs default to dry-run mode so the
historical ADR backlog can be audited without creating issues accidentally.

---

# Future Deployment Improvements

Potential improvements:

* Separate staging and production Firebase projects.
* Document environment-specific deploy commands.
* Add deployment checklist automation.
* Wire Storage rules into `firebase.json` if local Storage rules become authoritative.
* Add smoke tests for critical post-deploy flows.


## Future Environment Strategy

Maintley currently deploys directly to the production Firebase project.

A separate beta environment was previously evaluated but is not currently active.

Future growth may justify:

- Dedicated beta Firebase project
- Beta branch deployments
- Separate Stripe test environment
- Staged release process

Until then, deployment remains production-only.
