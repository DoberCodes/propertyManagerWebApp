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
yarn version:init
yarn version:update -- <version> "<notes>"
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
```

---

# Active Script Inventory

These scripts are actively used, referenced by package aliases, or remain part of current operational workflows.

## Release Helpers

* generateReleaseNotes.cjs
* initAppVersion.cjs
* updateAppVersion.cjs
* syncAppVersion.cjs

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

Maintley's primary release workflow is:

```bash
yarn build:signed
```

The release pipeline performs:

* Release note generation
* Version updates
* APK build and signing
* Git commits
* Git tag creation
* GitHub Release creation/update
* APK upload
* Website deployment

This workflow depends on:

```bash
yarn deploy
```

Do not modify deploy behavior without reviewing the release pipeline.

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

* E2E scripts are intended to be cross-platform.
* Deploy remains the primary deployment command.
* deploy:gh-pages exists as an explicit alias.
* build:signed is the primary release workflow.
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
