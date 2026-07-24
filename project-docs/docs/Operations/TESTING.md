# Testing

Last reviewed: 2026-06

# Purpose

This document defines how Maintley changes should be validated before deployment.

It answers:

> How do we know a change is safe to ship?

This document covers:

* Testing philosophy
* Validation strategy
* Test layers
* Risk-based testing
* Verification commands
* Release readiness

The goal is confidence, not test count.

Testing should focus on reducing risk and protecting critical workflows.

---

# Testing Philosophy

Maintley uses multiple layers of validation.

No single test type is sufficient.

Preferred testing flow:

```text id="z1o9kr"
Code Change
    ↓
Build Verification
    ↓
Targeted Tests
    ↓
Manual Validation
    ↓
Deployment
```

The level of testing should match the risk of the change.

Small UI changes should not require the same validation as billing or permission changes.

---

# Testing Pyramid

Maintley follows a layered testing approach.

```text id="3k1j1x"
Unit Tests
    ↓
Integration Tests
    ↓
End-to-End Tests
    ↓
Manual Validation
```

Each layer provides different confidence.

---

## Unit Tests

Purpose:

Validate isolated functionality.

Examples:

* Utility functions
* Validation helpers
* Data transformations
* Recommendation logic

Unit tests should be fast and focused.

Entitlement administration policy is validated with:

```bash
npm run test:admin-grant-policy
```

The policy test distinguishes Maintley owner from customer ownership, verifies
the explicit grant-management permission, denies non-owner grants to the
actor's own user or account, and preserves the Maintley-owner self-grant
exception.

---

## Integration Tests

Purpose:

Validate interactions between systems.

Examples:

* Redux state flows
* RTK Query behavior
* Firebase integration logic
* Component interactions

Integration tests verify systems working together.

---

## End-to-End Tests

Purpose:

Validate real user workflows.

Examples:

* Authentication
* Property creation
* Task completion
* Subscription workflows

End-to-end tests provide the highest workflow confidence.

---

## Manual Validation

Purpose:

Verify actual user experience.

Examples:

* Mobile layout
* Navigation
* Recommendation visibility
* Workflow clarity

Manual validation remains important even with automated testing.

---

# Validation Levels

Different changes require different validation effort.

---

## Documentation Changes

Examples:

* Documentation updates
* Comments
* README changes

Recommended validation:

```bash id="13u0d3"
No build required
```

Optional:

```bash id="d5g1f5"
npm run build
```

when documentation references generated examples.

---

## UI Changes

Examples:

* Layout changes
* Styling changes
* Navigation changes
* Dashboard changes

Recommended validation:

```bash id="m1bwzz"
npm run build
```

Plus:

* Visual review
* Mobile review
* Relevant Playwright validation

---

## Feature Changes

Examples:

* Task workflows
* Equipment workflows
* Property workflows
* Maintley Intelligence updates

Recommended validation:

```bash id="r5v9m5"
npm run build
npm run test:ci
```

Plus:

* Manual workflow validation

---

## Architecture Changes

Examples:

* Data model changes
* Firebase integration changes
* Redux architecture changes
* API layer changes

Recommended validation:

```bash id="4xk7pt"
yarn build
yarn test:ci
yarn e2e
```

Plus:

* Manual validation

---

# Critical Systems

Changes affecting critical systems require additional validation.

Critical systems include:

* Billing
* Permissions
* Account Memberships
* Maintley Intelligence
* Maintenance Events
* Notifications

These systems have broader platform impact and should receive additional review.

---

# Billing Validation

Changes affecting billing should verify:

* Subscription creation
* Subscription upgrades
* Subscription cancellation
* Stripe webhooks
* Resource limits

Recommended validation:

```bash id="zcfcff"
npm --prefix functions run build
yarn test:stripe:sandbox
```

Additional validation:

* Stripe Dashboard review
* Webhook verification

Billing changes should never rely solely on frontend validation.

---

# Permission Validation

Changes affecting permissions should verify:

* Firestore Rules
* Team Member access
* Tenant access
* Property visibility
* Account visibility

Recommended validation:

```bash id="1c73oq"
yarn test:rules
```

Additional validation:

* Owner account
* Team member account
* Tenant account

Permission changes should be treated as high-risk.

---

# Maintley Intelligence Validation

Changes affecting Maintley Intelligence should verify:

* Recommendation generation
* Recommendation prioritization
* Dashboard recommendations
* Quick Scan results
* Property Insights

Recommended validation:

```bash id="pmwh97"
npm run build
npm run test:ci
```

Additional validation:

* Manual recommendation review

Recommendations should remain explainable and deterministic.

---

# Maintenance Event Validation

Changes affecting maintenance workflows should verify:

* Task completion
* Maintenance Event creation
* Maintenance history visibility
* Notification creation

Recommended validation:

```bash id="65rhqf"
npm run build
npm run test:ci
```

Additional validation:

* Manual completion workflow

Maintenance Events are a core platform system.

---

# Notification Validation

Changes affecting notifications should verify:

* Notification creation
* Push delivery
* Email generation
* Preference enforcement

Recommended validation:

```bash id="ly53y6"
npm --prefix functions run build
```

Maintley Event Engine validation:

```bash
yarn test:notifications
```

Email brand and access-lifecycle template validation:

```bash
yarn test:email-templates
```

This verifies milestone boundaries, deterministic delivery identity, current
route generation, recipient escaping, no-surprise billing copy, and removal of
legacy brand colors from Maintley email sources. Time-controlled integration
tests are still required before enabling a production cohort to validate
Firestore retries, suppression, catch-up windows, and provider behavior.

Additional validation:

* Test notification delivery
* Verify user preferences

Notification behavior should remain predictable.

---

# Build Verification

Frontend build:

```bash id="9z3jv2"
npm run build
```

Functions build:

```bash id="kdc57s"
npm --prefix functions run build
```

Combined validation:

```bash id="97oh0v"
npm run validate
```

Build failures should block deployment.

---

# Unit & Integration Tests

Continuous Integration:

```bash id="twr6kk"
npm run test:ci
```

Interactive mode:

```bash id="h5qg1w"
npm test
```

Use focused testing when appropriate, but ensure impacted workflows are validated.

---

# Firebase Rules Tests

Firestore rules:

```bash id="6m8p34"
yarn test:rules
```

This runs Firestore Emulator-backed allow/deny assertions. It should be used for
permission behavior such as account roles, task writes, account memberships,
support/admin boundaries, notification ownership, and denied access.

Firestore structure smoke check:

```bash id="8f7n2a"
yarn test:rules:structure
```

Storage checks:

```bash id="6oqljv"
yarn test:storage
```

Combined:

```bash id="2n4a0r"
yarn test:rules:all
```

Important:

* Firestore rules are authoritative.
* Verify Storage testing behavior before assuming deployed Storage security coverage.

---

# Playwright E2E

PR smoke suite:

```bash
yarn e2e:smoke:chrome
```

The PR smoke suite is intentionally non-mutating. It verifies registration
navigation without submitting a new account, verifies demo login/logout, and
checks the Support Center without submitting a ticket. It must not create
Firebase accounts, Stripe customers, properties, tasks, support tickets, or
checkout sessions.

Workflow coverage:

```bash
yarn e2e:workflows:chrome
```

This suite is manual-only in GitHub Actions because it uses the demo account and
creates workflow records such as properties or tasks.

Safe cross-browser coverage:

```bash
yarn e2e:full-safe
```

This manual suite runs non-Stripe, non-destructive workflow coverage across the
configured browser projects.

All tests:

```bash id="d22v3v"
yarn e2e
```

UI mode:

```bash id="sjyjxt"
yarn e2e:ui
```

Debug:

```bash id="6td9wv"
yarn e2e:debug
```

Single browser:

```bash id="9a3g7k"
yarn e2e:chrome
yarn e2e:firefox
yarn e2e:webkit
```

Reports:

```bash id="kpn0n6"
yarn e2e:report
```

Playwright provides workflow-level confidence.

GitHub Actions:

* Build Check runs `yarn test:ci`, `yarn test:rules`, `yarn test:storage`, `yarn build`,
  `yarn check:asset-budgets`, and `yarn --cwd functions build` for normal PRs.
* PRs run `E2E Tests / smoke` against Chromium only.
* The `release/next` PR skips E2E and runs version validation instead of the
  full Build Check test/build jobs because it only updates release version
  files.
* Manual workflow dispatch can run `smoke`, `workflows`, or `full-safe`.
* E2E requires dedicated `E2E_REACT_APP_FIREBASE_*` secrets and
  `E2E_DEMO_EMAIL` / `E2E_DEMO_PASSWORD`.
* Manual `workflows` and `full-safe` runs require
  `E2E_FIREBASE_SERVICE_ACCOUNT_JSON` so the workflow can clean up test data
  after the run.
* Cleanup uses the E2E Firebase project id as a guard and refuses to run if the
  service account project does not match `E2E_FIREBASE_PROJECT_ID`. The GitHub
  workflow maps this value from the `E2E_REACT_APP_FIREBASE_PROJECT_ID` secret.
* E2E intentionally does not fall back to production Firebase config.
* Stripe checkout tests are not part of the automatic PR smoke flow.
* Storage rules are tested with Firebase emulators and Firestore-backed account
  context.

---

# Stripe Testing

Sandbox tests:

```bash id="5pr8jo"
yarn test:stripe:sandbox
yarn test:stripe:cards:sandbox
yarn test:stripe:webhook:sandbox
yarn test:stripe:e2e
yarn test:stripe:all
```

Use:

* Stripe test keys
* Stripe test products
* Stripe test prices

Never validate billing changes against production resources.

---

# Cleanup Helpers

Firebase cleanup scripts:

```bash id="g1j0lw"
yarn cleanup:test-data
yarn cleanup:test-data:dry-run
yarn cleanup:test-data:full
```

Review cleanup scripts before executing destructive operations.

---

# Release Validation Checklist

Minimum deployment readiness:

* Frontend builds successfully.
* Functions build successfully.
* No critical console errors.
* Impacted workflows tested.

Recommended deployment readiness:

* Relevant automated tests pass.
* Relevant manual validation completed.
* Permission changes validated.
* Billing changes validated.
* Mobile experience reviewed.

---

# Failure Philosophy

Testing exists to find problems before users do.

When tests fail:

* Understand the failure.
* Fix the root cause.
* Update tests when behavior intentionally changes.
* Update documentation when architecture changes.

Avoid:

* Ignoring failures
* Disabling tests unnecessarily
* Bypassing validation

A failed test is usually providing useful information.

---

# Guiding Principles

Maintley testing should be:

* Risk-based
* Practical
* Repeatable
* Understandable

The objective is not to maximize test volume.

The objective is to provide confidence that changes behave correctly, preserve critical workflows, and do not introduce regressions into the platform.

Every change should receive enough validation to match the risk it introduces.
