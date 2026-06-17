# Scripts and Utilities

Last reviewed: 2026-06

# Purpose

This document describes the scripts, migrations, cleanup utilities, release helpers, and operational tooling used throughout Maintley.

It answers:

> What scripts exist, what do they do, and when should they be used?

This document should be updated whenever scripts are added, removed, or significantly changed.

## Maintenance Status

This document lists known scripts from `package.json` and the `scripts/` directory.

A script being listed here does not guarantee it is actively used.

Scripts should be periodically audited and classified as:

- Active
- Needs Review
- Deprecated
- Archive Candidate
- Remove Candidate

Before running any migration, cleanup, pruning, or apply script, verify it against the current codebase and data model.

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

Remove test users and demo artifacts.

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

## Build APK

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

## Build Signed APK

```bash
yarn build:signed
```

Builds a signed Android APK.

Risk:

Medium

Requires signing configuration.

---

## Dry-Run Signed Build

```bash
yarn testDeploy
```

Validates Android signing workflow without full deployment.

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

Runs the application build before deployment.

---

## Deploy

```bash
yarn deploy
```

Deploys the application using the configured deployment target.

Current implementation:

```text
gh-pages -d build
```

Verify deployment strategy before use.

Risk:

Medium

---

# Release Utilities

---

## Release Notes

```bash
yarn release:notes
```

Generates release notes from project history.

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

New scripts should:

* Have descriptive names
* Log important actions
* Validate inputs
* Clearly communicate risk
* Support dry-run modes when practical

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
