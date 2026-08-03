# Scripts Directory Guide

Last updated: 2026-06-17

This directory contains operational scripts for data maintenance, testing, releases, migrations, diagnostics, and development utilities.

Whenever possible, use package scripts from `package.json` rather than executing files directly.

Run individual script files only when no package alias exists.

Run `npm run validate:seo` after changing public search pages. It checks titles,
descriptions, H1s, canonical URLs, robots directives, social metadata, JSON-LD,
and sitemap coverage for every public `index.html`.

---

# Directory Layout

```text
scripts/
├── archive/
└── active scripts
```

### scripts/

Contains active operational scripts, migration utilities, release tooling, and development helpers.

### scripts/archive/

Contains historical scripts retained for reference.

Most archived scripts were created to support one-time migrations, schema transitions, or operational changes that have already been completed.

Do not run archived scripts without reviewing:

* Current data model
* Current architecture
* Current deployment process

Archived scripts should not be considered supported operational tooling.

---

# Script Status

Scripts generally fall into one of four categories.

### Active

Referenced by package.json or current operational workflows.

These scripts are expected to work with the current codebase.

### Needs Review

Retained because they may still be useful, but usage has not been recently verified.

Review implementation before use.

### Archived

Historical scripts retained for reference.

Not considered active tooling.

### Remove Candidate

Confirmed duplicates or obsolete utilities scheduled for removal.

These should not be relied upon.

---

# Most Common Commands

## Content

```bash
yarn content:idea
yarn content:idea -- --topic "documents belong with the property" --status ready
yarn content:idea -- --pillar property-memory --source adr --dry-run
yarn content:idea -- --count 5 --status ready
```

---

## Release and Versioning

```bash
yarn build:signed
yarn release:notes
yarn release:notes:preview
yarn release:notes --json --output RELEASE_NOTES.txt --engineering-output tmp/release-notes.engineering.md --metadata-output tmp/release-notes.json
yarn adr:trackers:dry-run --json
yarn version:init
yarn version:update -- <version> "<notes>"
yarn version:prepare -- --version 2.8.0
yarn version:prepare -- --metadata tmp/release-notes.json
yarn version:validate
yarn version:publish -- --version 2.8.0 --release-notes-file RELEASE_NOTES.txt --play-store-url https://play.google.com/store/apps/details?id=com.maintleyapp
yarn version:sync
```

---

## Web Deployment Freeze

```bash
yarn deploy
yarn deploy:gh-pages
```

Both commands intentionally fail. They are retained as visible retirement
guards so a familiar deployment command cannot publish to GitHub Pages
accidentally. The `gh-pages` package is no longer installed.

## Firebase Hosting validation

```bash
yarn build
yarn check:clean-web-routes
yarn test:hosting-routes
yarn build:android
```

`yarn build` produces the BrowserRouter web artifact. The Hosting smoke test
starts only the production Hosting emulator, verifies clean direct-route SPA
fallbacks and static-page precedence, and validates the configured cache-policy
ordering. The clean-route check rejects hardcoded `/#/` and relative `#/`
application URLs in web-owned sources. `yarn build:android` uses the explicit
transitional HashRouter profile with relative assets for Capacitor packaging.

---

## E2E and Test Cleanup

```bash
yarn e2e
yarn e2e:smoke:chrome
yarn e2e:workflows:chrome
yarn e2e:full-safe
yarn e2e:full
yarn e2e:ci
yarn cleanup:test-data:dry-run
yarn cleanup:test-data
```

---

## Data Migrations and Cleanup

```bash
yarn migrate:property-memberships
yarn migrate:property-memberships:apply

yarn migrate:task-locations-to-spaces -- --confirm-project=PROJECT_ID
yarn migrate:task-locations-to-spaces:apply -- --confirm-project=PROJECT_ID

yarn migrate:equipment-supplies -- --confirm-project=PROJECT_ID
yarn migrate:equipment-supplies:apply -- --confirm-project=PROJECT_ID

yarn migrate:document-relationships -- --confirm-project=PROJECT_ID
yarn migrate:document-relationships:apply -- --confirm-project=PROJECT_ID

yarn audit:maintenance-history -- --confirm-project=PROJECT_ID

yarn migrate:equipment-terminology
yarn migrate:equipment-terminology:apply

yarn migrate:orphaned-data
yarn migrate:orphaned-data:apply

yarn migrate:prune-inactive-user-data
yarn migrate:prune-inactive-user-data:apply

yarn cleanup:optional-groups:dry-run
yarn cleanup:optional-groups:apply

yarn cleanup:shared-properties:dry-run
yarn cleanup:shared-properties:apply

yarn migrate:tenant-data
yarn migrate:tenant-data:apply
```

The Task-location migration is dry-run first and only creates a relationship
for a unique, exact normalized match to an active Space within the same account
and Property. It preserves the original Task field and skips ambiguous,
unmatched, archived, and cross-boundary candidates. Add
`--account-id=ACCOUNT_ID` to limit review or apply scope.

The Equipment Supply migration is also dry-run first. It promotes embedded
`device.serviceItems` into canonical `propertySupplies`, deduplicates identical
specifications within a Property, and creates deterministic Equipment `uses`
links. It never removes the legacy arrays. Add `--account-id=ACCOUNT_ID` to
limit review or apply scope, and rerun the dry-run after applying to confirm
that no additional Supplies or links remain.

The Property Document relationship migration promotes embedded documents that
do not yet have first-class records and creates deterministic Document
`documents` relationships for valid Equipment, Space, Task, and Supply
references. Missing, cross-property, and legacy part references that do not
resolve to canonical Supplies are reported and preserved rather than guessed or
deleted. Add `--account-id=ACCOUNT_ID` to limit review or apply scope, and rerun
the dry-run after applying to confirm that no additional records or links remain.

`migrate:tenant-data` is dry-run by default and logs counts and retired field
names only. The apply command is intentionally limited to environments where
the operator has confirmed there are no real tenant records. It deletes legacy
`tenantProfiles`, clears legacy unit occupants, and removes non-minimal fields
from embedded property tenant relationships.

---

## Rules and Seeding

```bash
yarn test:rules
yarn test:storage
yarn test:rules:all

yarn init:firestore
yarn seed:firebase
yarn seed:demo-account -- --email demo@example.com --plan portfolio
yarn support:updates
yarn support:updates:dry-run
```

`seed:demo-account` populates an existing Firebase Auth user. Create the demo
login first, then run a dry-run, then add `--apply` when the summary looks
right.

---

# Active Script Inventory

These scripts are actively used, referenced by package aliases, or remain part of current operational workflows.

## Release Helpers

* generateReleaseNotes.cjs
* initAppVersion.cjs
* prepareReleaseVersion.cjs
* publishAppVersion.cjs
* updateAppVersion.cjs
* validateReleaseVersion.cjs
* syncAppVersion.cjs

`generateReleaseNotes.cjs` is the active PR-first release note generator used by
the Release Notes GitHub Action and local preview commands. It uses the latest
merged `Release v...` commit after the latest `v*` tag as its boundary, or the
tag when there is no newer merged release. It enriches merged PRs with GitHub
CLI metadata when available, writes customer-facing release notes, and can write
engineering notes plus structured metadata.

The generator uses Conventional Commit PR-title prefixes as its release-impact
contract. `feat:` creates a minor New Features entry, `fix:` creates a patch Fixes
entry, `perf:` creates a patch Improvements entry, and `feat!:` creates a major
breaking-feature entry. Internal prefixes are omitted from customer notes by
default. `scripts/releaseClassification.cjs` shares this mapping with the
protected PR-summary workflow so title normalization, summaries, notes, and
version selection cannot classify the same PR differently.

Major versions require an explicit breaking marker such as `feat!:`, a breaking
release label, a `BREAKING CHANGE:` footer, or a dedicated breaking-change
heading. PR-template guidance that merely explains those markers is ignored.

When `package.json` is already ahead of the latest `v*` tag, the generator treats
that package version as the prepared release version instead of bumping again.
This allows the automated release-prep PR to own version file changes without
causing a second bump after the PR is merged.

The generator separates release communication into two layers:

* Customer notes explain what improved in Maintley using plain product language.
* Engineering notes preserve PR numbers, direct commits, categories, and
  technical context for maintainers.

When no customer-facing release entries are found, customer notes use a short
behind-the-scenes improvement message instead of producing an empty release body.
Release-prep PRs such as `Release v2.7.23` are ignored by the generator so the
versioning PR itself does not appear as a customer-facing improvement.

`--output` writes customer-facing notes for backwards compatibility. Use
`--engineering-output` when the technical notes should be retained as an
artifact.

`build:signed` does not call this generator directly. It downloads the
successful `release-notes.yml` artifact for the current `main` commit to
validate the prepared version. The matching GitHub Release must already exist;
the helper attaches or replaces Android artifacts without changing its notes.

`prepareReleaseVersion.cjs` updates the repo-controlled release version files:

* `package.json`
* `client/package.json`
* `android/app/build.gradle`

It increments Android `versionCode` when the Android `versionName` changes.
`validateReleaseVersion.cjs` verifies those version surfaces are synchronized
and that the client app version is derived from `package.json`.

`publishAppVersion.cjs` publishes Firestore `appConfig/version` after the
Google Play release is ready for Android users. Update notifications use the
Play Store listing instead of a direct APK download.

The legacy commit/date-based generator is archived at:

```text
scripts/archive/generateReleaseNotes.legacy.cjs
```

## ADR Helpers

* syncAdrImplementationTrackers.cjs

`syncAdrImplementationTrackers.cjs` backs the GitHub Action that creates and
reconciles ADR implementation tracker issues after ADRs are merged to `main`.
An ADR can provide an `## Implementation Tracking` checkbox list as the source
for the issue's generated checklist. The sync updates only the marked generated
section, preserves tracker notes, reconciles state labels, and closes an open
tracker when the ADR reaches `Implemented`. It never reopens a closed issue.

Local audit:

```bash
yarn adr:trackers:dry-run --json
```

Non-dry-run syncs require `GITHUB_REPOSITORY` or `--repo`, plus `GITHUB_TOKEN`
or `GH_TOKEN`. Missing write context is treated as an error so a real sync cannot
silently fall back to a preview.

Connected dry runs use the same repository and token inputs to compare ADRs
against existing issues without writing changes. The local no-token audit only
reports which ADRs would be eligible for tracker creation.

---

## Cleanup and Migrations

* cleanupFirebaseTestUsers.cjs
* cleanupOptionalGroupLinks.cjs
* cleanupSharedPropertiesData.cjs
* migrateFixReportAccountIntegrity.cjs
* migrateMaintenanceHistoryToEvents.cjs
* migrateEquipmentTerminology.cjs
* migratePropertyGroupMemberships.cjs
* migratePruneInactiveUserData.cjs
* migrateRemoveOrphanedData.cjs

---

## Validation and Diagnostics

* testFirebaseRules.cjs
* testStorageRules.cjs
* inventoryMaintenanceHistory.cjs

### Maintenance History migration inventory

`inventoryMaintenanceHistory.cjs` is the report-only discovery gate for ADR
0024. It scans canonical Maintenance Events, the legacy `maintenanceHistory`
collection, and embedded property/equipment history. It classifies records but
does not create, update, or delete Firestore data.

The command permanently rejects `--apply`, requires explicit confirmation of
the Firebase project encoded by the service account, and only writes JSON
reports beneath the gitignored `tmp/` directory.

```bash
yarn audit:maintenance-history --confirm-project=mypropertymanager-cda42
```

Optional account-scoped report:

```bash
yarn audit:maintenance-history \
  --confirm-project=mypropertymanager-cda42 \
  --account-id=<account-id> \
  --report=tmp/maintenance-history-inventory.json
```

Run deterministic classifier fixtures with:

```bash
yarn test:maintenance-history-inventory
```

Do not run `migrateMaintenanceHistoryToEvents.cjs --apply`. Its earlier
backfill behavior predates the inventory, provenance, revision, parity, and
rollback requirements now established for the migration.

---

## Utilities

* generateMaintleyContentIdea.cjs
* seedFirestore.cjs
* seedDemoAccount.cjs
* updateSupportUpdates.cjs

---

# Archived Scripts

Historical migration and utility scripts have been moved to:

```text
scripts/archive/
```

See:

```text
scripts/archive/README.md
```

for execution guidance and archive policies.

The archive includes historical task-schema, device-location, recurring-task,
and device-structure migration artifacts retained as evidence. They are not
supported operational commands.

---

# Release Pipeline

Maintley's local signed Android artifact command is:

```bash
yarn build:signed
```

The release workflow uses split ownership:

* Release Notes Action generates customer and engineering notes.
* Release Prep Action opens or updates the `release/next` PR with the correct
  version bump.
* GitHub Pages publishing is frozen. The automatic Deploy Web workflow has been
  removed and the local deploy aliases fail through the migration guard.
* `build:signed` remains the local Android signing helper while signing secrets
  stay local. It validates that version files were already prepared, builds the
  signed Android artifacts needed for validation and app-store maintenance, and
  attaches them to an existing GitHub Release without changing its notes. Public
  Android distribution and updates are handled through Google Play.
* Automatic version tag and GitHub Release creation will follow a successful
  production website deploy as part of the Firebase Hosting migration. Firebase
  preview channels for pull requests will not create releases or tags.
* After release artifacts are prepared, Publish App Version writes Firestore
  `appConfig/version` with release metadata and the Google Play listing URL.

Do not modify release behavior without reviewing the release workflows and
signed Android artifact helper together.

---

# Safety Checklist Before Running Any Data Script

Before running migrations, cleanup scripts, or destructive operations:

1. Confirm the target environment.
2. Prefer dry-run commands when available.
3. Review references to legacy collections and fields.
4. Verify backups or rollback procedures exist.
5. Record what was executed and when.
6. Review the current data model if the script has not been recently used.

---

# Notes

* `e2e:smoke:chrome` is the non-mutating PR smoke suite.
* `e2e:workflows:chrome` and `e2e:full-safe` use the demo account and are intended for manual workflow validation.
* GitHub Actions runs `cleanup:test-data:full` after manual E2E workflow suites and requires `E2E_FIREBASE_SERVICE_ACCOUNT_JSON`.
* E2E scripts are intended to be cross-platform.
* `deploy` and `deploy:gh-pages` intentionally fail as retirement guards.
* No supported repository command publishes to GitHub Pages.
* build:signed is the local signed Android artifact helper.
* stripe:webhook:auto in functions/package.json is currently Unix-only.
* Archived scripts should be treated as historical reference, not supported tooling.

---

# Guiding Principle

Active scripts should remain:

* Documented
* Discoverable
* Safe
* Maintainable

When a script is no longer part of normal operations, prefer moving it to archive rather than allowing uncertainty to accumulate in the active scripts directory.
