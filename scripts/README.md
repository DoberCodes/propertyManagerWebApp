# Scripts Directory Guide

Last updated: 2026-06-17

This directory contains operational scripts for data maintenance, testing, releases, migrations, diagnostics, and development utilities.

Whenever possible, use package scripts from `package.json` rather than executing files directly.

Run individual script files only when no package alias exists.

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
yarn version:publish -- --version 2.8.0 --release-notes-file RELEASE_NOTES.txt --apk-url <url>
yarn version:sync
```

---

## Deploy Web

```bash
yarn deploy
yarn deploy:gh-pages
```

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

yarn migrate:maintenance-events
yarn migrate:maintenance-events:apply

yarn migrate:orphaned-data
yarn migrate:orphaned-data:apply

yarn migrate:prune-inactive-user-data
yarn migrate:prune-inactive-user-data:apply

yarn cleanup:optional-groups:dry-run
yarn cleanup:optional-groups:apply

yarn cleanup:shared-properties:dry-run
yarn cleanup:shared-properties:apply
```

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
the Release Notes GitHub Action and local preview commands. It uses the local
git range from the latest `v*` tag to `HEAD`, enriches merged PRs with GitHub
CLI metadata when available, writes customer-facing release notes, and can write
engineering notes plus structured metadata.

When `package.json` is already ahead of the latest `v*` tag, the generator treats
that package version as the prepared release version instead of bumping again.
This allows the automated release-prep PR to own version file changes without
causing a second bump after the PR is merged.

The generator separates release communication into two layers:

* Customer notes explain what improved in Maintley using plain product language.
* Engineering notes preserve PR numbers, direct commits, categories, and
  technical context for maintainers.

`--output` writes customer-facing notes for backwards compatibility. Use
`--engineering-output` when the technical notes should be retained as an
artifact.

`build:signed` does not call this generator directly. It downloads the
successful `release-notes.yml` artifact for the current `main` commit and uses
those customer notes as the GitHub Release body.

`prepareReleaseVersion.cjs` updates the repo-controlled release version files:

* `package.json`
* `client/package.json`
* `android/app/build.gradle`

It increments Android `versionCode` when the Android `versionName` changes.
`validateReleaseVersion.cjs` verifies those version surfaces are synchronized
and that the client app version is derived from `package.json`.

`publishAppVersion.cjs` publishes Firestore `appConfig/version` after a release
APK is available. The GitHub Action uses this to avoid showing app update
notifications before the downloadable APK exists.

The legacy commit/date-based generator is archived at:

```text
scripts/archive/generateReleaseNotes.legacy.cjs
```

## ADR Helpers

* syncAdrImplementationTrackers.cjs

`syncAdrImplementationTrackers.cjs` backs the GitHub Action that creates ADR
implementation tracker issues after accepted ADRs are merged to `main`. It uses
hidden issue markers to avoid duplicates and does not overwrite existing issue
bodies after creation.

Local audit:

```bash
yarn adr:trackers:dry-run --json
```

Non-dry-run syncs require `GITHUB_REPOSITORY` or `--repo`, plus `GITHUB_TOKEN`
or `GH_TOKEN`. Missing write context is treated as an error so a real sync cannot
silently fall back to a preview.

---

## Cleanup and Migrations

* cleanupFirebaseTestUsers.cjs
* cleanupOptionalGroupLinks.cjs
* cleanupSharedPropertiesData.cjs
* migrateFixReportAccountIntegrity.cjs
* migrateMaintenanceHistoryToEvents.cjs
* migratePropertyGroupMemberships.cjs
* migratePruneInactiveUserData.cjs
* migrateRemoveOrphanedData.cjs
* migrateFixDeviceStructure.cjs

---

## Validation and Diagnostics

* testFirebaseRules.cjs
* testStorageRules.cjs
* debugRecurringTasks.cjs
* testRecurrence.cjs
* testRecurrenceLogic.cjs
* auditTasksSchema.cjs
* checkDeviceLocations.cjs

---

## Utilities

* convert-to-root-imports.cjs
* scan-packages-for-test-code.cjs
* seedFirestore.cjs
* seedFirestoreAuth.cjs
* seedDemoAccount.cjs
* updateSupportUpdates.cjs

---

# Needs Review

These scripts remain in the repository but are not currently part of documented operational workflows.

Review before use.

* testFirebaseAdmin.cjs
* testContractorsQuery.cjs
* testDevicesQuery.cjs
* test-push-notifications.cjs
* trigger-push-notification.cjs

Potential future action:

* Keep
* Archive
* Remove

depending on actual usage.

---

# Remove Candidates

The following scripts have been identified as likely obsolete or duplicated.

Do not rely on them for current workflows.

* sendPushOnNotificationCreate.js

Potential action:

* Remove after final verification.

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

---

# Release Pipeline

Maintley's local signed APK command is:

```bash
yarn build:signed
```

The release workflow uses split ownership:

* Release Notes Action generates customer and engineering notes.
* Release Prep Action opens or updates the `release/next` PR with the correct
  version bump.
* Deploy Web Action publishes the web app to GitHub Pages after `Build Check`
  succeeds on `main`.
* `build:signed` remains the local Android signing helper while signing secrets
  stay local. It validates that version files were already prepared, builds the
  signed APK, creates or updates the GitHub Release, and uploads
  `app-release.apk`. It does not commit, push to `main`, deploy GitHub Pages, or
  publish Firestore app-version state.
* Publish App Version Action writes Firestore `appConfig/version` only after the
  GitHub Release APK is reachable.

Do not modify release behavior without reviewing the release workflows and
signed APK helper together.

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
* Deploy remains the primary deployment command.
* deploy:gh-pages exists as an explicit alias.
* build:signed is the local signed APK helper.
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
