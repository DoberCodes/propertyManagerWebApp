# Scripts and Utilities

Last reviewed: 2026-06

# Purpose

This document describes the scripts, migrations, cleanup utilities, release helpers, and operational tooling used throughout Maintley.

It answers:

> What scripts exist, what do they do, and when should they be used?

This document should be updated whenever scripts are added, removed, or significantly changed.

## Maintenance Status

This document lists known scripts from `package.json` and the `scripts/` directory.

For current operational details in the scripts directory, see:

- `scripts/README.md`

A script being listed here does not guarantee it is actively used.

Scripts should be periodically audited and classified as:

- Active
- Needs Review
- Deprecated
- Archive Candidate
- Remove Candidate

Before running any migration, cleanup, pruning, or apply script, verify it against the current codebase and data model.

## Current Script Notes

- `deploy` and `deploy:gh-pages` are GitHub Pages retirement guards and intentionally fail.
- No supported script or installed dependency publishes to GitHub Pages.
- `stripe:webhook:auto` is Unix-only.
- E2E scripts are intended to be cross-platform.
- `adr:author` prepares humanized review drafts in `project-docs/reports/decision-audit-YYYY-MM/approved/`.
- `adr:promote` writes final accepted ADRs into `project-docs/ADR/`.
- `adr:author`, `adr:promote`, and `adr:promote:dry-run` are the canonical ADR workflow commands.
- `validate:functions-package` verifies that local Functions dependencies are contained within the Firebase upload boundary.
- `validate:functions-exports` verifies that `functions/index.ts` matches the reviewed Firebase export inventory before deployment.
- `version:entitlements -- <version>` updates the bundled entitlement package and both Yarn lockfile entries together.
- `sync:entitlement-locks` repairs both lockfile entries from the current bundled entitlement package version.
- `check:entitlement-locks` verifies synchronization without modifying files and runs in GitHub deployment workflows.
- `check:compatibility-boundaries` prevents new client code from bypassing the
  shared account, Property Memory, and Maintenance History adapters or writing
  embedded Equipment Supplies. It is a read-only build gate.
- `inventory:compatibility` reports aggregate legacy Document, Maintenance
  History, account-link, and embedded Supply counts. It permanently rejects
  apply mode and requires explicit Firebase project confirmation.
- `check:equipment-terminology` prevents legacy record terminology from
  returning to active user-facing copy. It is a read-only build gate.

### Entitlement Package Version Workflow

When deployable files under `functions/packages/entitlements/` change, use:

```bash
yarn version:entitlements -- 0.3.0
```

This updates `functions/packages/entitlements/package.json`, `yarn.lock`, and
`functions/yarn.lock` as one operation. Commit all three files with the package
change. CI runs `yarn check:entitlement-locks` and remains non-mutating so a
deployment cannot silently rely on generated changes that were never committed.

### ADR Promotion Queue Workflow

1. Run `yarn audit:decisions` to generate candidate drafts.
2. Run `yarn adr:author` to move polished drafts into `project-docs/reports/decision-audit-YYYY-MM/approved/`.
3. Review approved drafts and optionally edit their `Status` field:
   - Leave as `Status: Proposed` to promote to `project-docs/ADR/`.
   - Change to `Status: Rejected` to reject the decision and move to `rejected/`.
4. **Optional: Add rejection reasoning:**
   - When rejecting, add a `Reason:` field to the draft:
   ```
   Status: Rejected
   Rejected: 2026-06-17
   Reason: Better represented in existing documentation; ADR separation not warranted.
   ```
   - The reason is automatically preserved when the draft is promoted.
5. Run `yarn adr:promote:dry-run` to preview the promotion and rejection targets.
6. Run `yarn adr:promote` to apply the promotion/rejection:
   - Approved drafts move to `project-docs/ADR/` with `Status: Accepted`.
   - Rejected drafts move to `project-docs/reports/decision-audit-YYYY-MM/rejected/` with metadata preserved.

Promotion behavior:

- Routes `Status: Proposed` or `Status: Approved` drafts to `project-docs/ADR/` with `Status: Accepted`.
- Routes `Status: Rejected` or `Status: Denied` drafts to `rejected/` with `Rejected` date and required `Reason` preserved.
- Validates candidates against existing ADR slug/title to prevent duplicate promotion.
- Writes humanized drafts to `approved/` so humans review the polished version, not the raw audit output.
- Rejected decisions are automatically suppressed in future `yarn audit:decisions` runs, preventing duplicate suggestions.
- Runs preflight validation before any writes, so invalid drafts fail the run before partial promotion can occur.
- Reports how many approved candidates were promoted to ADR, how many were rejected, and how many were renumbered.

Rejection metadata:

- `Status: Rejected` - marks the decision as deliberately rejected
- `Rejected: YYYY-MM-DD` - automatically added with the promotion date
- `Reason: [text]` - required field when status is `Rejected` or `Denied`
- Rejected files are permanently archived in `rejected/` folder with full context preserved
- **Automatically renumbers ADRs to ensure sequential numbering** — if a candidate is rejected, remaining ADRs are renumbered to fill the gap. For example, if 0007 is rejected while 0008 is promoted, 0008 becomes 0007. Internal references (headers, slugs) are automatically updated.

ADR Numbering:

- ADRs are numbered sequentially from 0001 onward
- When a candidate is rejected during promotion, the remaining candidates are renumbered to maintain sequence with no gaps
- Internal ADR headers (e.g., `# ADR 0008:`) are automatically updated during renumbering
- This ensures the final published ADRs always have contiguous numbering without gaps

---

# Script Philosophy

Scripts should be:

* Purpose-driven
* Documented
* Safe
* Repeatable

Whenever practical:

* Support dry-run modes
* Log actions
* Validate inputs
* Minimize destructive behavior

Production-impacting scripts should be reviewed before execution.

---

# Risk Levels

Scripts are categorized by risk.

---

## Low Risk

Examples:

* Build scripts
* Testing scripts
* Reporting utilities
* Release note generation

These typically do not modify production data.

---

## Medium Risk

Examples:

* Data migrations
* Backfills
* Synchronization scripts

These modify existing records and should be reviewed before execution.

---

## High Risk

Examples:

* Cleanup operations
* Orphan removal
* Data pruning
* Bulk updates

These may permanently modify or delete data.

Use caution.

---

# Development Scripts

These scripts support local development.

---

## Start Development Server

```bash
yarn start
```

Purpose:

Starts the React development environment.

Risk:

Low

---

## Build Application

```bash
yarn build
```

Purpose:

Creates a production build.

Risk:

Low

---

## Synchronize Android Launcher Icons

```bash
yarn sync:android-icons
```

Purpose:

Regenerates the legacy and adaptive Android launcher icon assets for every
density bucket from `public/icons/icon-512.png`. Run this whenever the
canonical Maintley app icon changes so the web and Android brands stay aligned.

Risk:

Low

---

## Bundle Asset Report

```bash
yarn analyze:bundle
```

Purpose:

Reports production build asset sizes from `build/static`, including raw and gzip
sizes for JavaScript assets. If source maps are present, the report also lists
the largest source-map contributors.

Run after `yarn build`.

Risk:

Low

---

## Media Asset Report

```bash
yarn analyze:media
```

Purpose:

Reports large image and static media assets under `public` and `src`.

Risk:

Low

---

## Asset Budget Check

```bash
yarn check:asset-budgets
```

Purpose:

Validates the production build against Maintley's current asset budgets:

* Main JavaScript gzip size under 300 KB
* Total JavaScript gzip size under 1 MB
* Built media assets under 6 MB total
* Individual built media assets under 750 KB

Run after `yarn build`. The check scans the full `build` directory, including
public assets copied outside `build/static`.

Assets over target but within 15% of target pass with a warning. The warning
means frontend optimization should become a top priority for the next release.
Assets more than 15% over target fail the check and block release.

This check is also enforced by `predeploy` and the signed release pipeline.

Risk:

Low

---

## Validate Build

```bash
yarn validate
```

Purpose:

Runs CI tests followed by a production build.

Equivalent:

```bash
yarn test:ci && yarn build
```

Risk:

Low

---

## Synchronize Public Navigation

```bash
npm run sync:seo-nav
```

Generates navigation for every static public SEO page from
`src/config/publicNavigation.json`. The React landing navigation consumes the
same definition directly.

Run this after changing public navigation labels, destinations, groups, or
enabled state.

Risk:

Low

---

## Synchronize Public Pricing

```bash
npm run sync:public-pricing
```

Generates the static `/pricing/` cards and SoftwareApplication offers from
`src/config/publicPlanFacts.json`. Core subscription constants and homepage
pricing consume the same public facts.

Risk:

Low

---

## Validate Public SEO and Pricing

```bash
npm run validate:seo
```

Checks metadata, canonical URLs, JSON-LD parsing, sitemap coverage, and exact
agreement between the four public pricing cards and shared plan facts.

Risk:

Low

---

# Testing Scripts

Testing strategy is documented in:

* TESTING.md

---

## Unit and Integration Tests

```bash
yarn test
```

```bash
yarn test:ci
```

```bash
yarn test:build
```

Risk:

Low

---

## Playwright End-to-End Testing

```bash
yarn e2e:smoke:chrome
```

Run the non-mutating Chromium smoke suite used by PR checks.

---

```bash
yarn e2e:workflows:chrome
```

Run Chromium workflow coverage that uses the demo account and may create
properties or tasks.

---

```bash
yarn e2e:full-safe
```

Run non-Stripe, non-destructive workflow coverage across configured browser
projects.

---

```bash
yarn e2e
```

Run all E2E tests.

---

```bash
yarn e2e:ui
```

Interactive UI mode.

---

```bash
yarn e2e:debug
```

Debug mode.

---

```bash
yarn e2e:chrome
```

Chromium only.

---

```bash
yarn e2e:firefox
```

Firefox only.

---

```bash
yarn e2e:webkit
```

WebKit only.

---

```bash
yarn e2e:report
```

View Playwright report.

---

```bash
yarn e2e:clean
```

Remove Playwright artifacts.

---

```bash
yarn e2e:full
```

Run full E2E suite and cleanup.

---

```bash
yarn e2e:ci
```

Run CI E2E suite and cleanup Firebase test users.

Risk:

Low

---

# Firebase Rules Testing

```bash
yarn test:rules
```

Validate Firestore security rules.

---

```bash
yarn test:storage
```

Validate Storage security rules.

---

```bash
yarn test:rules:all
```

Runs both rule validation suites.

Risk:

Low

---

# Cleanup Scripts

Cleanup scripts should be reviewed carefully before execution.

---

## Firebase Test Data Cleanup

```bash
yarn cleanup:test-data
```

Remove Firebase test users.

---

```bash
yarn cleanup:test-data:dry-run
```

Preview changes.

---

```bash
yarn cleanup:test-data:full
```

Remove test users and demo artifacts. This script can use
`FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_SERVICE_ACCOUNT_PATH`, or a root
`serviceAccountKey.json`. When `E2E_FIREBASE_PROJECT_ID` is set, cleanup refuses
to run if the service account belongs to a different Firebase project.

Risk:

Medium to High

---

## Optional Group Cleanup

```bash
yarn cleanup:optional-groups:dry-run
```

Preview optional group cleanup.

---

```bash
yarn cleanup:optional-groups:apply
```

Apply optional group cleanup.

Risk:

High

---

## Shared Property Cleanup

```bash
yarn cleanup:shared-properties:dry-run
```

Preview shared-property cleanup.

---

```bash
yarn cleanup:shared-properties:apply
```

Apply shared-property cleanup.

Risk:

High

---

# Migration Scripts

Migration scripts support schema evolution and data normalization.

Migration scripts should be reviewed before execution.

## Property Taxonomy Migration

```bash
yarn migrate:property-taxonomy
```

Runs a production dry-run using `serviceAccountKey.json` and prints aggregate
canonical type counts. Add `--verbose` through
`yarn migrate:property-taxonomy:verbose` only when record-level review is
required.

Apply mode requires an explicit project confirmation in addition to `--apply`:

```bash
node scripts/migratePropertyTaxonomy.cjs --apply --confirm-project=PROJECT_ID
```

The migration is repeat-safe. Residential legacy values receive the only safe
classification inference (`single_family`); Multi-Family and Commercial
records are canonicalized without guessing a classification.

Risk:

Medium

---

## Legacy Task Location to Space Migration

```bash
yarn migrate:task-locations-to-spaces -- --confirm-project=PROJECT_ID
```

Runs in dry-run mode and reports exact, already-linked, unmatched, ambiguous,
and missing-scope outcomes. A candidate is safe only when the normalized legacy
Task location exactly matches one active Space in the same account and Property.
Partial matches, archived Spaces, and duplicate names are never inferred.

After reviewing the dry run, apply with:

```bash
yarn migrate:task-locations-to-spaces:apply -- --confirm-project=PROJECT_ID
```

Apply mode creates deterministic `Task occurs_in Space` relationship records
with migration provenance. It does not clear legacy Task fields, so the command
is repeat-safe and preserves compatibility until later validation authorizes
field cleanup. Use `--account-id=ACCOUNT_ID` to constrain either mode.

Risk:

Medium

---

---

## Property Membership Migration

```bash
yarn migrate:property-memberships
```

Dry-run property membership migration.

---

```bash
yarn migrate:property-memberships:apply
```

Apply migration.

---

```bash
yarn migrate:property-memberships:cleanup
```

Apply migration and cleanup orphaned records.

Risk:

High

---

## Report Account Integrity Migration

```bash
yarn migrate:report-account-integrity
```

Audit report ownership integrity.

---

```bash
yarn migrate:report-account-integrity:apply
```

Apply integrity fixes.

Risk:

Medium

---

## Maintenance Event Migration

```bash
yarn migrate:maintenance-events
```

Preview maintenance history migration.

---

```bash
yarn migrate:maintenance-events:apply
```

Apply migration.

Purpose:

Migrates legacy maintenance history records into Maintenance Events.

Related documentation:

* DATA_MODEL.md
* MAINTENANCE_EVENT_SCHEMA.md

Risk:

Medium

---

## Orphaned Data Migration

```bash
yarn migrate:orphaned-data
```

Preview orphan cleanup.

---

```bash
yarn migrate:orphaned-data:apply
```

Apply orphan cleanup.

Risk:

High

---

## Inactive User Pruning

```bash
yarn migrate:prune-inactive-user-data
```

Preview inactive user cleanup.

---

```bash
yarn migrate:prune-inactive-user-data:apply
```

Apply inactive user cleanup.

Risk:

High

---

# Seed and Initialization Scripts

Used when preparing environments or test data.

---

## Firestore Initialization

```bash
yarn init:firestore
```

Purpose:

Initialize Firestore structures and required records.

Risk:

Medium

---

## Firebase Seed Data

```bash
yarn seed:firebase
```

Purpose:

Populate Firestore with example data.

Risk:

Medium

Avoid running against production unless intentionally creating sample records.

---

## Demo Account Seed Data

```bash
yarn seed:demo-account -- --email homeowner-demo@example.com --plan homeowner_plus
```

```bash
yarn seed:demo-account -- --email portfolio-demo@example.com --plan portfolio
```

Performance-scale Portfolio fixtures are available in dry-run or apply mode:

```bash
yarn seed:demo-account -- --email perf@example.com --plan portfolio --property-count 100
```

`--property-count` accepts 1 through 100. Values above the active Portfolio plan
limit exist only to exercise test and performance conditions; the script does
not change account entitlements.

Purpose:

Populates an existing Firebase Auth user/account with rich demo records:
properties, equipment, contractors, active tasks, notifications,
Maintley Intelligence scan snapshots, and four years of Maintenance Events.
The first Property is an exemplary connected record containing Spaces,
property-owned Supplies, first-class Documents, and canonical Equipment, Task,
Space, Supply, and Document relationships.

Behavior:

* Dry-run by default.
* Requires `--apply` before writing records.
* Supports `--replace --apply` to remove and recreate prior records tagged by
  the same demo seed.
* Uses account-scoped records and also preserves legacy `userId` compatibility.
* Validates deterministic connected-property coverage before any write.

Fixture-only validation does not require Firebase credentials:

```bash
yarn validate:demo-seed
```

The fixture validator covers Homeowner+ and Portfolio accounts with 1, 5, 15,
and 100 properties. This verifies deterministic data construction and schema
coverage. Render timing and Firestore read counts still require an applied Beta
fixture and an authenticated browser test.

Risk:

Medium

Use only for intentional demo or test accounts.

---

## Support Feature Updates

```bash
yarn support:updates
```

Purpose:

Synchronizes the Support Center's feature and major updates list from:

```text
project-docs/docs/Product/SUPPORT_FEATURE_UPDATES.json
```

into:

```text
src/pages/SupportPage/SupportContent.ts
```

Dry-run:

```bash
yarn support:updates:dry-run
```

Risk:

Low

Use this when changing the curated Support Center update feed.

---

# Android Utilities

Used when preparing Android builds.

---

## Capacitor Sync

```bash
yarn cap:sync
```

Builds the application and synchronizes Capacitor Android resources.

Risk:

Low

---

## Open Android Studio

```bash
yarn cap:open
```

Opens the Android project.

Risk:

Low

---

## Build Android Web Assets

```bash
yarn build:apk
```

Performs:

* App version initialization
* Production build
* Capacitor synchronization

Risk:

Low

---

## Build Signed Android Artifacts

```bash
yarn build:signed
```

Builds signed Android artifacts for internal validation and app-store
maintenance.

`build:signed` remains the local signed Android artifact helper while Android
signing secrets stay local. Release notes, version preparation, and Firestore
app-version publication are handled by GitHub Actions. Public Android
distribution and updates are handled through Google Play, not direct APK
downloads.

Risk:

Medium

Requires signing configuration.

---

## Dry-Run Signed Build

```bash
yarn testDeploy
```

Validates the local signed Android artifact workflow without building or
publishing a release.

Risk:

Low

---

# Deployment Scripts

Deployment procedures are documented in:

* DEPLOYMENT.md

---

## Predeploy

```bash
yarn predeploy
```

Intentionally fails through the GitHub Pages retirement guard so the package
lifecycle cannot continue into the historical Pages deployment path.

---

## Deploy

```bash
yarn deploy
yarn deploy:gh-pages
```

Both commands intentionally fail through
`scripts/assertGitHubPagesFrozen.cjs`. GitHub Pages publishing remains retired
after the Firebase Hosting cutover.

Do not bypass this guard. The `gh-pages` package is not installed.

Risk:

High


---

# Release Utilities

---

## Pull Request Summary

```bash
yarn pr:summary:test
```

`scripts/generatePullRequestSummary.cjs` creates the protected automated summary
block used on pull requests targeting `beta`. Inputs are limited to GitHub file
metadata, commit subjects, and the existing PR body. The generator never reads
the contents of changed files, redacts common provider-secret patterns from
commit subjects, neutralizes marker injection, and changes only the content
between these markers:

```text
<!-- maintley-pr-summary:start -->
<!-- maintley-pr-summary:end -->
```

If an older PR does not contain the markers, the block is appended. Incomplete
or malformed markers fail closed so manual PR content is not overwritten.

Risk:

Low

---

## Release Notes

```bash
yarn release:notes
```

Generates release notes from project history. The latest merged `Release v...`
commit after the latest version tag is treated as the boundary so an unpublished
or delayed tag does not cause changes from earlier prepared releases to repeat.

Release classification follows Conventional Commit prefixes on merged PR
titles: `feat:` maps to a minor release and New Features, `fix:` maps to a patch
release and Fixes, `perf:` maps to a patch release and Improvements, and
`feat!:` maps to a major release. Internal prefixes (`refactor:`, `docs:`,
`chore:`, `ci:`, `build:`, and `test:`) remain available to engineering notes
without appearing in customer notes by default. The protected PR-summary
workflow normalizes a missing PR-title prefix from a `Release type:` body
declaration or Conventional Commit prefixes in the PR's commits. The explicit
body declaration takes priority so authors can correct the automated title.

The generator recognizes a matching release-preparation merge at `HEAD` and
keeps its prepared package version. Subsequent product commits continue to bump
from that prepared version. The policy is covered by:

```bash
yarn test:release-version
```

Risk:

Low

---

## Release Version Preparation

```bash
yarn version:prepare -- --metadata tmp/release-notes.json
```

Prepares repo-controlled release version files from release metadata:

* `package.json`
* `client/package.json`
* `android/app/build.gradle`

The Release Prep GitHub Action runs this automatically and opens or updates the
`release/next` PR. It uses the highest required bump across the full unreleased
range, so a feature or breaking change landing after a patch fix updates the
same release PR instead of leaving an older patch version in place.

Risk:

Low

---

## Release Version Validation

```bash
yarn version:validate
```

Verifies package, client, Android `versionName`, Android `versionCode`, and the
client app-version source are synchronized.

Risk:

Low

---

## Publish App Version

```bash
yarn version:publish -- --version 2.8.0 --release-notes-file RELEASE_NOTES.txt --play-store-url https://play.google.com/store/apps/details?id=com.maintleyapp
```

Publishes Firestore `appConfig/version`. The Publish App Version GitHub Action
uses this after the Google Play release is ready, so Android update prompts send
users to the Play Store listing.

The client-side update prompt is temporarily not mounted. Version publishing
and metadata remain available for a future prompt that verifies Google Play
availability before notifying users.

Risk:

Medium

---

# Public Site Synchronization

## Public Navigation

```bash
npm run sync:seo-nav
```

Regenerates navigation across all static public SEO pages from:

```text
src/config/publicNavigation.json
```

The React homepage imports the same definition directly. Disabled destinations
remain absent from generated navigation.

Risk:

Low

---

## Public Pricing

```bash
npm run sync:public-pricing
```

Regenerates the four-plan pricing section and SoftwareApplication offers in
`public/pricing/index.html` from:

```text
src/config/publicPlanFacts.json
```

Risk:

Low

---

## Public SEO Validation

```bash
npm run validate:seo
```

Validates public metadata and sitemap coverage, shared static navigation, and
public pricing consistency. Run it after changing public pages, navigation, plan
facts, or generated pricing.

Risk:

Low

---

# Content Utilities

---

## Maintley Content Idea Generator

```bash
yarn content:idea
```

Generate a ready-to-edit marketing content markdown file in:

```text
marketing/maintley/content/
```

Common options:

```bash
yarn content:idea -- --topic "documents belong with the property" --status ready
yarn content:idea -- --pillar property-memory --source adr --status drafting
yarn content:idea -- --count 5 --status ready
yarn content:idea -- --dry-run
```

Purpose:

Creates sequentially numbered Maintley content drafts based on maintained product,
UX, Intelligence, and ADR documentation. The script supports batch generation
with `--count` and scans existing backlog content to skip matching or highly
similar topics. The script is deterministic, local, and does not publish content,
call social platforms, or use external AI services.

Risk:

Low

---

# Stripe Testing Utilities

Billing behavior is documented in:

* BILLING.md

---

## Stripe Sandbox

```bash
yarn test:stripe:sandbox
```

---

## Stripe Test Cards

```bash
yarn test:stripe:cards:sandbox
```

---

## Stripe Webhook Validation

```bash
yarn test:stripe:webhook:sandbox
```

---

## Stripe E2E Validation

```bash
yarn test:stripe:e2e
```

---

## Full Stripe Validation

```bash
yarn test:stripe:all
```

Runs all Stripe validation workflows.

Risk:

Low

Use only against test environments.

---

# Deprecated or Special Scripts

## eject

```bash
yarn eject
```

Purpose:

Ejects the project from Create React App.

Risk:

Very High

This operation is effectively irreversible.

Do not use unless intentionally abandoning the CRA-managed configuration.

---

# Script Development Guidelines

## Environment contract automation

```bash
yarn env:contract:validate
yarn env:organize --apply
yarn env:bootstrap --environment all --apply
yarn env:validate
yarn env:functions:sanitize
yarn github-env:sync --environment development
yarn github-env:sync --environment production
yarn github-env:sync --environment release-validation
```

`.env.example` is the only committed variable manifest. The ignored root `.env`
is the single local control file for actual non-secret Beta and Production
values plus explicit Local overrides. Local inherits Beta unless a value is
different or local-only. Commented inventories identify Firebase, GitHub,
Android-signing, and optional tooling secrets without storing their values. The contract validator checks source coverage. Manifest
section headings and declaration order organize the standardized `.env.local`,
`.env.beta`, and `.env.prod` outputs in both the repository root and `functions/`,
including empty placeholders for unconfigured declared values. The
bootstrapper also audits project-specific non-secret Functions configuration. The
GitHub sync command uploads only declared non-secret variables and is dry-run by
default. Firebase secret values remain in the target project's Secret Manager
and are never copied into GitHub variables or generated dotenv files.

`release-validation` reads `.env.prod` but uploads only declared browser
variables. It intentionally excludes Functions configuration and secrets so a
release pull request can validate the production frontend without crossing the
production deployment boundary.

`yarn env:functions:sanitize` removes declared Firebase Secret Manager
assignments from ignored `functions/.env*` files without displaying their
contents. The deploy-package validator independently rejects those assignments,
so an ambiguous legacy dotenv file cannot silently inject Production secrets
into Beta.

Firebase deployment safety is covered by:

```bash
yarn test:firebase-deployment-safety
yarn validate:callable-preflight -- --project maintleybeta --origin https://maintleybeta.web.app --functions recordUserActivity,getFamilyMembers
```

The Beta workflow also verifies the Firebase Stripe secret is test-mode and
repairs infrastructure invoker bindings for HTTPS/callable Functions before
running the preflight check. Secret contents are never logged.

When adding configuration, declare it in `.env.example` first. Include its
scope, delivery method, environments, required status, and any safe defaults or
source mapping. CI rejects undeclared Maintley-owned runtime variables.

---

New scripts should:

* Have descriptive names
* Log important actions
* Validate inputs
* Clearly communicate risk
* Support dry-run modes when practical

GitHub Actions and test coverage policy is validated with:

```bash
yarn test:scripts:ci
yarn --cwd functions test:ci
yarn validate:workflows
```

`scripts/testManifest.cjs` is authoritative for top-level Node test coverage.
`scripts/workflowChangeClassification.cjs` provides deterministic changed-file
classification, and `scripts/validateWorkflowPolicy.cjs` rejects missing
permissions, broad top-level writes, mutable external Action references,
missing Action release comments, missing GitHub Actions Dependabot coverage,
timeouts, invalid workflow YAML, and suppressed CI warnings.

Production Hosting route validation is available through:

```bash
yarn validate:deployed-web --base-url https://PROJECT_ID.web.app
```

`scripts/validateDeployedWebRoutes.cjs` performs a read-only HTTPS check of the
public Maintley BrowserRouter routes and confirms that each returns the app
shell. The production deployment runs it before release finalization.

Preferred naming:

```text
migrateSomething.cjs
cleanupSomething.cjs
seedSomething.cjs
syncSomething.cjs
generateSomething.cjs
```

Avoid ambiguous names.

Examples:

```text
run.cjs
fixData.cjs
script.cjs
```

---

# Before Running Any Script

Ask:

1. What data does this affect?
2. Is the target environment correct?
3. Is a dry-run available?
4. Is a backup needed?
5. Is the script documented?
6. Is the operation reversible?

If uncertain, review the implementation before execution.

---

# Guiding Principles

Scripts exist to automate operational tasks safely and consistently.

They should remain:

* Predictable
* Documented
* Repeatable
* Maintainable

The goal is to reduce operational effort without introducing unnecessary risk to Maintley's data, infrastructure, or users.
