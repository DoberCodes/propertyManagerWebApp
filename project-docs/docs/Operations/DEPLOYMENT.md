# Deployment

Last reviewed: 2026-07-23

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

The root `package.json` retains `deploy` and `deploy:gh-pages` as guard
commands during the Firebase Hosting migration. Both commands intentionally
exit with an error before publishing anything.

No repository-supported command may update the `gh-pages` branch during the
migration freeze. The last verified GitHub Pages build remains online as the
current site and future rollback target until Firebase cutover is complete.

Firebase Hosting is not yet configured as the production deployment path.

---

# Firebase Hosting

Firebase Hosting is not part of the active deployment path.

Do not run `firebase deploy --only hosting` unless Firebase Hosting is
intentionally reintroduced.

---

# GitHub Pages Migration Freeze

GitHub Pages continues to serve the last verified production build, but
publishing is frozen for the duration of the Firebase Hosting and BrowserRouter
migration.

The former automatic workflow has been removed:

```text
.github/workflows/deploy-web.yml
```

The `deploy` and `deploy:gh-pages` package commands invoke
`scripts/assertGitHubPagesFrozen.cjs` and exit unsuccessfully. Do not bypass the
guard or update the `gh-pages` branch manually. Rollback during the migration
means restoring DNS or hosting to the existing verified Pages build, not
publishing a new Pages build.

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
* `REACT_APP_FIREBASE_MEASUREMENT_ID`, optional for Firebase Analytics / GA4
* `REACT_APP_ENABLE_ANALYTICS`, optional; set to `true` only when production
  analytics collection is intended
* `REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_HOST`, optional for local development
  when routing callable Functions to the emulator, such as `localhost:5001`

Important backend configuration includes:

* Stripe secrets
* Stripe webhook secret
* Email provider credentials
* Firebase Functions params/secrets
* Plan price identifiers

The GitHub `production` environment owns non-sensitive production build and
Functions configuration as environment variables. Important variables include:

* Frontend Firebase config:
  * `PROD_REACT_APP_FIREBASE_API_KEY`
  * `PROD_REACT_APP_FIREBASE_AUTH_DOMAIN`
  * `PROD_REACT_APP_FIREBASE_PROJECT_ID`
  * `PROD_REACT_APP_FIREBASE_STORAGE_BUCKET`
  * `PROD_REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
  * `PROD_REACT_APP_FIREBASE_APP_ID`
  * `PROD_REACT_APP_FIREBASE_MEASUREMENT_ID`, optional for analytics
  * `PROD_REACT_APP_ENABLE_ANALYTICS`, optional; set to `true` to enable
    production analytics
* `PROD_FIREBASE_PROJECT_ID` for Firebase deploy targeting; if omitted, the
  deploy workflow falls back to `PROD_REACT_APP_FIREBASE_PROJECT_ID`
* `PROD_REACT_APP_FIREBASE_WEB_PUSH_VAPID_KEY` for browser push builds
Repository secrets remain limited to credentials such as
`FIREBASE_SERVICE_ACCOUNT_JSON` for Firebase rules and Functions deployment.
* Stripe price IDs for non-interactive Functions deploy:
  * `PROD_STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID`
  * `PROD_STRIPE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID`
  * `PROD_STRIPE_PROPERTY_MONTHLY_PRICE_ID`
  * `PROD_STRIPE_PROPERTY_ANNUAL_PRICE_ID`
  * `PROD_STRIPE_PORTFOLIO_MONTHLY_PRICE_ID`
  * `PROD_STRIPE_PORTFOLIO_ANNUAL_PRICE_ID`

The Firebase deploy workflow reads the six backend price identifiers directly
from the GitHub `production` environment. Browser Firebase configuration and
publishable Stripe configuration also live there as `PROD_REACT_APP_*`
variables. Retired plan identifiers must be removed rather than retained as
fallback configuration.

## GitHub Actions rollout variables

Rollout flags and non-sensitive rollout dates belong in:

```text
GitHub repository
  > Settings
  > Secrets and variables
  > Actions
  > Variables
  > New repository variable
```

Do not add these values under **Secrets**. The workflows read them through the
GitHub Actions `vars` context and apply safe disabled defaults when a variable
is absent.

| Repository variable | Value format | Workflow destination | Purpose |
| --- | --- | --- | --- |
| `ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL` | `true` or `false` | Web: `REACT_APP_ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL`; Functions: `ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL` | Enables the Homeowner+ internal trial surfaces and issuance path. |
| `ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE` | `true` or `false` | Web: `REACT_APP_ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE`; Functions: `ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE` | Enables internal entitlement-grant administration and server issuance. |
| `ENABLE_COMPLIMENTARY_PAID_TRANSITIONS` | `true` or `false` | Functions: same name | Enables grant-aware Checkout timing and audited conversion. Keep false until deployed Checkout, webhook, cancellation, and first-charge validation passes. |
| `ENABLE_ACCESS_LIFECYCLE_COMMUNICATION` | `true` or `false` | Functions: `ENABLE_ACCESS_LIFECYCLE_COMMUNICATION` | Enables lifecycle delivery processing. |
| `HOMEOWNER_PLUS_TRIAL_ELIGIBILITY_START_AT` | ISO 8601 timestamp, for example `2026-08-01T00:00:00-04:00` | Functions: same name | Sets the first-property trial eligibility boundary. Leave empty until a launch boundary is approved. |
| `ENABLE_TRUSTED_SETUP_PLAN_ACTIVATION` | `true` or `false` | Web: `REACT_APP_ENABLE_TRUSTED_SETUP_PLAN_ACTIVATION` | Routes setup-plan activation through the trusted callable after its backend deployment is verified. |
| `ENABLE_TRUSTED_RECURRING_TASK_WRITES` | `true` or `false` | Web: `REACT_APP_ENABLE_TRUSTED_RECURRING_TASK_WRITES` | Routes recurring-task creation, schedule edits, and next-occurrence generation through `manageRecurringTask` after the callable is deployed and verified. |
| `ENABLE_COMPLIMENTARY_ACCESS_CODES` | `true` or `false` | Web: `REACT_APP_ENABLE_COMPLIMENTARY_ACCESS_CODES`; Functions: `ENABLE_COMPLIMENTARY_ACCESS_CODES` | Enables customer preview and redemption of pre-provisioned internal access-code programs. It never enables Stripe billing. |
| `ENABLE_TRUSTED_STORAGE_QUOTA` | `true` or `false` | Web: `REACT_APP_ENABLE_TRUSTED_STORAGE_QUOTA`; Functions: `ENABLE_TRUSTED_STORAGE_QUOTA` | Routes uploads and usage displays through server quota reservations. Storage-rule enforcement is activated separately after compatible clients deploy. |
| `STRIPE_CUSTOMER_PORTAL_URL` | Public Stripe-hosted portal URL | Web: `REACT_APP_STRIPE_CUSTOMER_PORTAL_URL` | Sends customers to Stripe's hosted billing-management login. This is a repository variable, not a secret. |

`ENABLE_TRUSTED_SETUP_PLAN_ACTIVATION` must remain `false` or absent until
`activatePropertySetupMaintenancePlan` is deployed and authorization has been
validated. Enable it by setting the repository variable to `true`, then run a
new web build. Roll back by setting it to `false` and rebuilding the web app.

`ENABLE_TRUSTED_RECURRING_TASK_WRITES` must remain `false` or absent until
`manageRecurringTask` is deployed and authorization has been validated. After a
successful observation period, remove the direct client recurrence fallback,
make the trusted writer mandatory, tighten rules to reject every direct client
recurrence write, and remove the rollout flag. Client entitlement checks may
remain only for contextual interface messaging.

Production rollout state approved on 2026-07-30 enables the Homeowner+ product
trial, internal entitlement-grant issuance, grant-aware paid transitions,
access-lifecycle communication, trusted setup-plan activation, trusted recurring
task writes, and trusted storage quota. The first-property trial eligibility
boundary is `2026-07-25T16:19:46-04:00`; accounts created before that instant are
not automatically enrolled. Customer-entered complimentary access-code
redemption remains disabled because Maintley uses the admin grant flow.
`ENTITLEMENT_COMPARE_MODE` also remains disabled because it is diagnostic only.

These enabled flags are migration controls, not permanent configuration. After
the Firebase migration is stable, remove each completed rollout flag and its
obsolete fallback so the validated trusted path becomes standard behavior.

`.env.example` is the committed environment contract. Each entry includes
`@maintley-env` metadata defining its scope, delivery system, applicable
environments, required status, optional source, and safe environment defaults.
Real values never belong in that file.

Section headings and declaration order in `.env.example` also control the
organization of generated browser, operations, and Functions dotenv files.
Generated templates retain empty declared entries so missing configuration is
visible and can be completed without manually discovering variable names.

Run `yarn env:contract:validate` whenever the application, Functions, scripts,
or workflows introduce environment configuration. The validation fails when a
Maintley-owned runtime variable is referenced without a contract declaration.
The ignored root `.env` is the single local control file for actual non-secret
values. It is organized into `LOCAL_`, `BETA_`, and `PROD_` sections. Run
`yarn env:organize --apply` to preserve those values while regenerating the
standard target files for both the application and Functions:

```text
.env.local
.env.beta
.env.prod
functions/.env.beta
functions/.env.prod
functions/.env.local
```

Local application and Functions configuration inherits the complete Beta/test
baseline. The `LOCAL_` section contains only values that differ from Beta or
exist solely for local tooling, such as emulator hosts. Backend values with a declared browser `source` are entered once
in the control file and derived into the matching Functions target. The generic
`functions/.env`, `.env.production`, and `.env.development.local` names are
legacy migration inputs only and must not be used by new workflows. Every real
`.env*` file is ignored and must not be committed.

The control file includes commented inventories for secrets without storing
their values. Beta and Production Firebase secrets belong in the matching
Firebase Secret Manager project. E2E secrets belong in the GitHub development
environment. Android keystore passwords remain in `.env.operations.local`
because signing is local. Service-account and sandbox credentials are optional
local tooling inputs needed only when running their related administrative
scripts.

`COMPLIMENTARY_ACCESS_CODE_PEPPER` is a Firebase Functions secret, not a GitHub
Actions variable and not a normal dotenv value in production. Create it with
`firebase functions:secrets:set COMPLIMENTARY_ACCESS_CODE_PEPPER` using at least
32 random characters before deploying the access-code callables. `RESEND_API_KEY`
remains the Firebase Functions secret used by lifecycle delivery. Do not copy
either value into repository Variables.

`FUNCTIONS_CONFIG_EXPORT` is a required JSON secret retained only as a
compatibility fallback for legacy `functions.config()` Stripe values. New
environments using the dedicated Stripe secrets and price parameters must set it
to an empty JSON object (`{}`); do not duplicate current Stripe credentials into
the compatibility payload.

Trusted storage quota rollout has three deliberate steps: deploy the callable,
triggers, and compatible clients while both rollout controls are disabled; set
`ENABLE_TRUSTED_STORAGE_QUOTA=true` and validate reservations internally; then
set `appConfig/entitlementRollout.trustedStorageQuotaRequired=true` only after
all supported clients use reservations. The Firestore setting is server-managed
operational configuration, not a GitHub Actions variable. Reverting it to
`false` immediately restores the compatibility rule without deleting usage
state or files.

Account quota covers property documents and photos, equipment and maintenance
files, and account team files. Authentication profile avatars are identity UI
assets and are intentionally outside the property-record quota.

Frontend builds run `scripts/validateFrontendEnv.cjs` before `react-scripts
build`. Missing values or placeholder values such as `YOUR_STORAGE_BUCKET`
block the build so production cannot publish a bundle pointed at a placeholder
Firebase project or Storage bucket.

During production CI, the contract-managed Functions values are written into a
temporary `functions/.env.prod` file before `firebase deploy --project prod`
runs. Firebase loads the project-alias-specific file during non-interactive
deployment. Beta Functions deployments use `functions/.env.beta`; emulator
overrides use `functions/.env.local`. Local application builds use the matching
root `.env.prod`, `.env.beta`, or `.env.local` file through Maintley's build and
runtime helpers rather than relying on framework-specific naming differences.

`yarn github-env:sync --environment <development|production>` performs a
values-hidden dry run against the corresponding GitHub environment. Add
`--apply` to upsert declared non-secret values. Pruning additionally requires
`--prune --confirm-prune <environment>`. The tool derives its managed variable
set from `.env.example`, validates Firebase project and Stripe mode boundaries,
and retries GitHub verification while environment-variable writes propagate.

`yarn env:bootstrap --environment all --strict --check-secrets` provides the
full readiness gate. It checks required non-secret values and verifies required
secret names in each Firebase project without displaying secret contents.

The shared `@maintley/entitlements` package is stored at
`functions/packages/entitlements`. Firebase uploads only the configured
Functions source directory, so local file dependencies used by Functions must
remain inside that boundary. Run `yarn validate:functions-package` before a
Functions deployment. The Firebase predeploy hook and GitHub Actions workflow
also run this validation automatically.

Review environment setup before deploying billing, email, or notification changes.

## GitHub Actions Firebase Deploy Authentication

Stable Firebase Hosting, rules, and Functions deploy through:

```text
.github/workflows/firebase-deploy-environments.yml
```

Merges into `beta` use keyless Workload Identity Federation and the GitHub
`development` environment. The existing production path on `main` continues to
authenticate with `google-github-actions/auth` using the
`FIREBASE_SERVICE_ACCOUNT_JSON` repository secret until the production
identity migration is completed.

Every merge into `beta` builds and deploys the stable `hosting:beta` target.
Backend selection remains source-based: `functions/` changes deploy Functions,
`firestore.rules` changes deploy Firestore rules, and `storage.rules` changes
deploy Storage rules. The stable build artifact must complete before the deploy
job can authenticate. Deployments are serialized so two merges cannot update
the shared development environment concurrently.

The production path retains its existing source-based backend behavior and
does not deploy Hosting during this migration phase. A Hosting-only
`firebase.json` change does not redeploy the backend. Changes to Firebase
backend configuration inside `firebase.json` require an explicit reviewed
manual deploy until a configuration-aware target detector is introduced.

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

### Development deployment identity

The Firebase Hosting migration uses keyless Workload Identity Federation for
the development environment. GitHub environment variables identify the
development project, provider, and service account:

```text
DEV_FIREBASE_PROJECT_ID
DEV_GOOGLE_WORKLOAD_IDENTITY_PROVIDER
DEV_GOOGLE_SERVICE_ACCOUNT
```

The public Firebase browser configuration is stored in the same environment as
`DEV_REACT_APP_FIREBASE_*` variables. These values identify the development
Firebase app and are embedded in browser builds; they are not service-account
credentials. A separate Stripe test publishable key is still required before a
functional development frontend can be built and deployed. Never substitute
the production Stripe publishable key in a development build.

The Workload Identity provider admits tokens only from
`DoberFamilyVentures/propertyManagerWebApp` jobs that declare the GitHub
`development` environment. The dedicated service account is scoped to the
`maintleybeta` project. Its baseline permissions are Firebase Hosting Admin,
API Keys Viewer, Secret Manager Viewer, and Service Usage Viewer. The read-only
Secret Manager and Service Usage roles allow readiness checks to confirm
required secret metadata and API availability without printing secret values.

Stable backend deployment extends that same identity only within
`maintleybeta`. Grant Firebase Rules Admin and Cloud Storage for Firebase Admin
before the workflow must publish those rule targets. Functions deployment also
requires the applicable Cloud Functions deployment permissions, Service Account
User on the runtime service account, and the targeted supporting roles described
below for Scheduler, Extensions, billing inspection, and secret access. These
roles do not grant access to the production project.

Do not create or store a JSON key for this development identity. Add further
roles only when a changed Beta target requires them. The current production
workflow continues using its existing credential path until the production
identity migration is performed.

Keyless authentication is checked by:

```text
.github/workflows/verify-development-deployment-identity.yml
```

The workflow performs no deployment. On relevant pushes to `beta`, or
when manually dispatched after it exists on the default branch, it verifies
that GitHub can impersonate the development service account and that the
expected Maintley Beta Hosting site is visible. It intentionally avoids loading
application code or printing access tokens.

Pull requests targeting `beta` use:

```text
.github/workflows/firebase-hosting-preview.yml
```

The preview workflow builds against only `DEV_REACT_APP_*` configuration,
requires the Stripe publishable key to start with `pk_test_`, disables staged
server-owned feature flags, and deploys only the `beta` Hosting target to a
seven-day preview channel. The workflow also verifies required non-secret
Functions configuration from the GitHub `development` environment and required
secret names in the Maintley Beta project before deploying the preview. Values
and secret contents are never printed. Pull requests from forks are not
deployed. The build job has no Google identity token; the deploy job downloads
the static artifact, uses the trusted Hosting configuration from the PR base
commit, and authenticates only immediately before the Firebase CLI deployment.
It never deploys Functions, Firestore Rules, or Storage Rules.

After a pull request merges, `firebase-deploy-environments.yml` rebuilds the
approved `beta` commit and promotes that artifact to the stable Maintley Beta
Hosting site. The job refuses to continue unless both Firebase project IDs are
exactly `maintleybeta` and the Stripe browser key is a test key. Functions use a
generated `functions/.env.beta` file from contract-managed GitHub development
variables; required Firebase secret names are checked without exposing their
contents. Ordinary `beta` merges cannot select the `prod` Firebase alias.

The E2E workflow runs for pull requests targeting either `beta` or `main`.
Require its `e2e` status on both protected branches only after the workflow has
reported successfully at least once for that target branch.

The workflow updates one bot comment on the pull request with the preview URL.
The development customer-portal URL remains pointed at a safe Maintley Beta
support route until Stripe test Customer Portal behavior is configured.

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

### Personal Assistant API secret

Before deploying `managePersonalAssistantCredentials` or `personalAssistantApi`, set a high-entropy HMAC pepper:

```text
firebase functions:secrets:set PERSONAL_ASSISTANT_TOKEN_PEPPER
```

Use at least 32 random bytes and do not reuse or commit the value. Deploy both Functions together. Changing this secret invalidates every existing personal-assistant token, so normal credential rotation should use Settings instead.

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

Maintley's pull request template includes a `Customer Release Note` section so
user-visible changes can be captured before merge.

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
Pull request previews read the live pull request body from the GitHub Actions
event payload so the `Customer Release Note` section can be previewed before the
PR is merged. Engineering previews also include bullets from the PR body's
`Engineering Summary` section under the related PR entry.
Release-prep PRs such as `Release v2.7.23` are excluded from generated release
notes so they do not appear as customer-facing improvements.

Release version changes are prepared by:

```text
.github/workflows/release-prep.yml
```

The stable development deployment calls Release Prep only after a merged
`beta` commit has built and deployed successfully. Release Prep computes the
highest required bump across the unreleased range and opens or updates the
single `release/next` PR targeting `main`. The release branch is rebuilt from
the exact deployed Beta commit before these version files are updated:

* `package.json`
* `client/package.json`
* `android/app/build.gradle` `versionName`
* `android/app/build.gradle` `versionCode`

The workflow uses `scripts/prepareReleaseVersion.cjs` and
`scripts/validateReleaseVersion.cjs`. If PR `release/next` already exists, its
branch, title, body, version, and release-note preview are updated. Otherwise
the workflow creates it. A later successfully deployed Beta feature or breaking
change updates that same PR with the higher required bump; it does not create a
second release PR or reset the release boundary merely because a new Beta merge
arrived.

Firebase deployment jobs install both the root validation dependencies and the
Functions deployment dependencies. Firestore and Storage emulator gates use
the root rules-testing package, while Functions builds and callable emulator
tests use `functions/node_modules`; neither dependency set may be omitted from
the deployment job merely because the earlier build-check job installed it in a
separate runner. Root dependencies are installed under Node 24 to satisfy the
current web and Capacitor tooling engines; the job then switches to Node 22 for
the Functions package. `firebase.json` declares `nodejs22` as the authoritative
deployed Functions runtime, while the Functions package accepts Node 22 or newer
so root workspace tooling can continue to run under Node 24.

If `package.json` is already ahead of the latest `v*` tag because a release was
prepared but not tagged locally yet, the latest merged `Release v...` commit is
used as the release-note boundary. New releaseable changes are then bumped from
that prepared package version. For example, a new patch change after prepared
version `2.7.30` produces `2.7.31` rather than reusing `2.7.30` or repeating the
changes already assigned to `2.7.30`.

When the current `main` commit is the matching release-preparation merge, the
release-note generator keeps that prepared package version. It only bumps from
the prepared version after another product change lands. This allows
`build:signed` to consume the release-notes artifact from the release merge
without requesting an additional, empty version-preparation cycle.

`release/next` promotes the complete approved Beta state, so it is not treated
as a version-only administrative PR. It runs the production-configured build,
unit and rules tests, Functions validation, E2E smoke test, release-note
preview, entitlement-package policy, and `yarn version:validate`. A failed
stable Beta deployment cannot update the release branch.

Release Prep explicitly dispatches those validation workflows after pushing
`release/next`. GitHub intentionally prevents a branch push made by the default
Actions token from recursively triggering other workflows, so relying on the
pull-request synchronization event would leave the updated release commit with
no checks. The dispatches run against the exact `release/next` head and retain
the normal check names used by branch protection.

### Main and Beta branch synchronization

Synchronization from `main` back into `beta` must preserve Git ancestry. Open a
pull request from `main` to `beta` and complete it with **Create a merge
commit**. Do not squash or rebase that synchronization PR: those methods can
copy identical files into Beta without recording `main` as an ancestor, which
causes the later `release/next` promotion back to `main` to conflict.

Feature pull requests targeting `beta` may continue using the normal squash
policy. The merge-commit requirement applies specifically to synchronization
between the two protected long-lived branches. Never force-push either branch
to repair ancestry.

Feature pull requests targeting `beta` run the same required Build Check jobs
as ordinary pull requests targeting `main`: entitlement-package policy, unit
and rules tests, production build validation, and the Functions build. Release
note previews also run for both targets and derive their comparison boundary
from the pull request's actual base branch, so a feature PR reports only its
changes against `beta` while a release PR is evaluated against `main`.

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

Android updates are distributed through Google Play. The Publish App Version
workflow writes `appConfig/version` with the current release version, release
notes, and Maintley's Google Play listing URL. Native Android update prompts use
that Play Store URL rather than a direct APK download.

If the dispatch step fails, run it manually after confirming the Google Play
release is ready for users:

```bash
gh workflow run publish-app-version.yml --repo DoberFamilyVentures/propertyManagerWebApp --ref main -f version=2.9.16
```

GitHub Pages publishing is frozen during the migration. The removed Deploy Web
workflow and guarded local deploy commands must not be restored as a temporary
release path.

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

Android build artifacts may still be created for internal validation and app
store maintenance:

```text
maintley-{version}-release.apk
maintley-{version}-release.aab
```

The APK is no longer the public Android distribution path. Public Android users
should install and update Maintley through Google Play:

```text
https://play.google.com/store/apps/details?id=com.maintleyapp
```

Example release asset names for v2.9.16:

```text
maintley-2.9.16-release.apk
maintley-2.9.16-release.aab
```

The Android App Bundle is used for app-store bundle maintenance:

```text
https://github.com/DoberFamilyVentures/propertyManagerWebApp/releases/download/v{version}/maintley-{version}-release.aab
```

The signed release helper derives its repository from `GITHUB_REPOSITORY` when set, or from the authenticated GitHub repository. It should not contain hardcoded organization or download URLs.

The signed Android helper does not create version tags or GitHub Releases. It
requires the matching GitHub Release to exist, then attaches or replaces the APK
and AAB assets without changing the customer release notes. Automatic tag and
GitHub Release creation belongs after a successful production website deploy.
When Firebase Hosting replaces GitHub Pages, that responsibility moves to the
production Firebase Hosting workflow; pull requests use separate preview
channels and must not create version tags or releases.

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
* Equipment load.
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


## Approved Future Environment Strategy

Maintley currently deploys directly to the production Firebase project.

ADR 0028 now governs an approved but not-yet-implemented migration to:

* A dedicated development Firebase project
* Feature integration through a protected `beta` branch
* Expiring development Firebase Hosting previews for feature pull requests
* Stable development deployment after merge to `beta`
* Release promotion from `beta` into the production `main` branch
* Production deployment, tag creation, and GitHub Release publication only after
  the release merge passes its production gates
* Separate development Analytics, Stripe test configuration, secrets, and
  synthetic data

Until that migration is implemented and validated, the active production-only
deployment behavior elsewhere in this document remains authoritative.
