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
npm --prefix functions run build
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
* APK outputs
* keystores
* private signing files

Important frontend variables include:

* Firebase public config
* Stripe public config
* Stripe price identifiers where needed by frontend flows
* `REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_HOST`, optional for local development
  when routing callable Functions to the emulator, such as `localhost:5001`

Important backend configuration includes:

* Stripe secrets
* Stripe webhook secret
* Email provider credentials
* Firebase Functions params/secrets
* Plan price identifiers

Review environment setup before deploying billing, email, or notification changes.

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
npm --prefix functions run build
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
npm --prefix functions run build
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

`build:signed` is the primary release pipeline. It builds the signed APK,
creates or updates the GitHub release, tags the repository, and deploys the
web app through `yarn deploy`.

The signed release pipeline runs `yarn check:asset-budgets` after the mobile web
build and after the final web deployment build. Asset budget failures block the
release before Capacitor sync or deployment proceeds.

Review local signing configuration before running release builds.

Do not commit keystores or signing secrets.

### APK Release Asset

Android releases are published to the active GitHub repository as:

```text
app-release.apk
```

The current public download endpoint is:

```text
https://github.com/DoberFamilyVentures/propertyManagerWebApp/releases/latest/download/app-release.apk
```

The signed release helper derives its repository from `GITHUB_REPOSITORY` when set, or from the authenticated GitHub repository. It should not contain hardcoded organization or download URLs.

---

# Pre-Deploy Checks

Recommended checks before most deployments:

```bash
npm run build
npm run check:asset-budgets
npm --prefix functions run build
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
```

Version helpers exist in:

```text
scripts/initAppVersion.cjs
scripts/syncAppVersion.cjs
scripts/updateAppVersion.cjs
```

Use release notes to summarize meaningful user-facing changes.

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
