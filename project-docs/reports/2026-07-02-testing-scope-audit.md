# Testing Scope Audit

Date: 2026-07-02

Branch reviewed: `austin/testing-audit-permissions`

## Purpose

This audit reviews Maintley's current automated testing coverage against the
critical product workflows and platform boundaries that should be protected
before release.

The goal is not complete test volume. The goal is to verify that the highest
risk customer, billing, permission, and property-knowledge workflows have
repeatable coverage.

## Executive Summary

Maintley's coverage is materially stronger than it was before the current
testing pass. The project now has meaningful coverage across:

* Authentication routing and unresolved-auth loading behavior.
* Account switching and stale account data prevention.
* Firestore task, membership, admin, support, and notification boundaries.
* Stripe checkout payload behavior and the paid-plan-without-payment regression.
* Property Knowledge Acquisition parsing, review, targeting, and application.
* Maintley Intelligence engine and dashboard consumer behavior.
* Support Center customer ticket display and Admin Inbox status utilities.
* Core Playwright smoke flows for auth and support.

The remaining risk is concentrated in three areas:

1. Storage rules do not yet have a repeatable emulator-based test.
2. Some Playwright workflow tests are smoke-level and accept broad fallback
   assertions instead of verifying persisted data and final user-visible state.
3. Several critical workflows still depend on manual validation or scripts
   outside the required PR path.

## Current Automated Test Layers

### Unit and Integration

Command:

```bash
yarn test:ci
```

Current coverage includes:

* Auth and protected-route behavior.
* Account context resolution.
* Account-scoped Redux cache clearing.
* Subscription utility behavior.
* Stripe service checkout payloads.
* Family account service behavior.
* Permission selectors and role utilities.
* Team, user, navigation, and maintenance request slices.
* Maintley Intelligence engine and consumers.
* Property Knowledge Acquisition parsing and review behavior.
* Property Knowledge targeting.
* Costs tab aggregation.
* Insights tab presentation and history.
* Support page customer-visible ticket treatment.
* Admin Inbox ticket loading and status utilities.
* Reporting data adapters.
* Core utility coverage for task, CSV, barcode, platform, and filters.

Assessment: Strongest current layer. It protects the highest-risk pure logic and
React behavior well, especially for property knowledge, intelligence, support,
and auth/account state.

### Firestore and Storage Rules

Commands:

```bash
yarn test:rules
yarn test:storage
yarn test:rules:all
```

Current Firestore rules coverage includes:

* Maintenance roles can create and update tasks when active.
* Inactive maintenance membership cannot write tasks through legacy role paths.
* Maintenance leads cannot delete tasks.
* Account owners can delete tasks.
* Account membership records are client read-limited and client write-denied.
* App admin collections are client-denied.
* Support feedback records are function-managed from the client perspective.
* Notification reads, creates, updates, and deletes are limited to the recipient.
* Notification update spoofing is denied.

Assessment: Firestore rules coverage is good and recently improved. The current
Storage script is not equivalent coverage because it uses Admin SDK credentials
and a live bucket instead of a checked-in `storage.rules` file with the Storage
emulator.

### Playwright E2E

Configured suites:

```bash
yarn e2e:smoke:chrome
yarn e2e:workflows:chrome
yarn e2e:full-safe
yarn test:stripe:e2e
```

Current E2E coverage includes:

* Registration navigation without creating a user.
* Demo login/logout.
* Support Center smoke path without submitting a ticket.
* Account switching regression with a secondary demo user when configured.
* Property create/view/update/delete workflows.
* Task create/view/update/complete/delete/filter workflows.
* Broad login > property > task > completion journey.
* RBAC create-flow regression for property and task creation.
* Stripe hosted checkout card scenarios in sandbox mode.
* User cleanup/destructive flows outside normal smoke coverage.

Assessment: Useful but uneven. The PR smoke suite is safe and appropriate, but
workflow coverage should be tightened before relying on it as release-blocking
quality evidence.

### Functions and Operational Scripts

Current coverage includes:

* Functions TypeScript build through deploy workflow.
* Stripe sandbox scripts for checkout, card scenarios, and webhook behavior.
* Release/version validation scripts.
* Asset budget checks.
* Firebase cleanup scripts for E2E data.

Assessment: Operationally useful, but functions build and rules tests should be
part of PR validation for changes that touch functions, rules, billing, support,
or account permissions.

## CI Enforcement Review

### Required on Normal PRs

Current GitHub Actions behavior:

* `Build Check` runs `yarn test:ci`.
* `Build Check` runs `yarn test:rules`.
* `Build Check` runs `yarn build`.
* `Build Check` runs `yarn check:asset-budgets`.
* `Build Check` runs `yarn --cwd functions build`.
* `E2E Tests` runs the Chromium smoke suite for same-repo PRs.
* `Release Notes` previews release notes.

Coverage this enforces:

* Unit/integration regression coverage.
* Firestore security rules coverage.
* Frontend build health.
* Bundle budget regression detection.
* Functions TypeScript build health.
* Non-mutating auth/support smoke paths.
* Release note generation.

### Not Currently Enforced on Normal PRs

The following critical checks are available but not required on normal PRs:

* `yarn test:storage`
* `yarn e2e:workflows:chrome`
* Stripe sandbox tests

Storage remains excluded because the current script requires live Firebase
credentials and does not exercise checked-in Storage rules through the emulator.
The remaining pipeline gap is workflow-level and billing sandbox coverage.

## Critical Workflow Coverage Matrix

| Area | Current Coverage | Status | Notes |
| --- | --- | --- | --- |
| Authentication | Protected route unit tests and auth E2E smoke | Good | Direct navigation flash is covered by unresolved-auth loading behavior. |
| Account switching | Unit cache clear test and E2E two-account regression | Good | Requires secondary demo credentials to run the strongest E2E path. |
| Account permissions | Firestore rules and account context tests | Good | Needs CI enforcement. |
| Team member task writes | Firestore emulator regression | Good | Covers maintenance and maintenance lead task writes. |
| Billing checkout | Stripe service unit tests, checkout E2E, entitlement regression | Moderate | Promo/checkout-abandonment regression has frontend/service coverage; webhook integration should be enforced separately. |
| Stripe webhooks | Sandbox scripts | Moderate | Useful, but not part of PR CI and not isolated unit tests. |
| Properties | Playwright CRUD coverage | Moderate | Assertions are broad in places; property groups, favorites, hidden properties, and setup assistant need deeper coverage. |
| Property Setup Assistant | Limited component coverage through UI changes | Weak | Needs direct tests for collapse state, generated records, and suggested task creation. |
| Tasks | Playwright CRUD, rules tests, task utilities | Moderate | Completion should assert maintenance history creation and linked property context. |
| Task assignment | Permission incident drove rules coverage | Weak | Needs targeted UI/component or service tests for assignment modal and assigned-property context. |
| Maintenance History | Property Knowledge application and Costs tab tests | Moderate | Manual maintenance entry create/edit/delete and task-completion-to-history need stronger coverage. |
| Appliances and Systems | Utility and intelligence tests | Weak | Needs CRUD, document upload, linked task/history, and recurrence coverage. |
| Contractors | Product behavior updated, but limited tests | Weak | Needs URL/portal fields, minimal required company-name validation, and property association tests. |
| Documents and uploads | Property Knowledge parsing tests | Moderate | Upload status, duplicate upload controls, storage rules, and review readiness need integration coverage. |
| Property Knowledge Acquisition | Strong unit coverage | Good | Function/storage/OCR end-to-end remains limited. |
| Maintley Intelligence | Engine, consumers, Insights tab tests | Good | Dashboard personalized scope needs direct coverage. Notification event refactor is intentionally deferred. |
| Notifications | Firestore ownership rules | Weak | Notification center aggregation, preferences, push, and lifecycle are deferred pending event engine refactor. |
| Support Center | Component tests and E2E smoke | Moderate | Customer-visible status language is covered; ticket submission and attachment upload are not. |
| Admin Inbox | Hook and utility tests | Moderate | Needs mobile dialog visual/interaction coverage and function authorization tests. |
| Reporting | Data adapter tests | Moderate | Report Builder UI, exports, and role visibility need E2E/component coverage. |
| Tenants and requests | Slice and reporting adapter tests | Weak | Needs tenant invite, tenant request submission, and request conversion coverage. |
| Family/team invitations | Auth service and account context tests | Moderate | Invite acceptance/revocation should be covered at function/rules level. |
| Android/native | Build scripts and package metadata checks | Weak | Needs at least release artifact validation and manual device smoke checklist. |
| Release pipeline | Version/release scripts and workflows | Moderate | Needs script unit tests or dry-run workflow validation for release prep and deploy gating. |

## Highest-Value Gaps

### 1. Add Emulator-Based Storage Rules Coverage

Risk:

Storage access can regress without a repeatable PR-safe test because the current
storage script depends on live Admin SDK credentials.

Recommended change:

Add a checked-in `storage.rules` file and replace the live-bucket storage script
with Storage emulator assertions.

The test should cover authenticated access, owner-scoped paths, property-scoped
paths, attachment paths, and default-deny behavior.

### 2. Tighten Task Completion Coverage

Risk:

Tasks are central to Maintley's action workflow, but the current E2E completion
path mostly verifies that the UI remains usable. It does not strongly verify
that completed work becomes durable Maintenance History.

Recommended tests:

* Create task for a specific property.
* Complete task with notes/cost/contractor context.
* Assert the task status changes.
* Assert a linked maintenance event/history record appears on the property.
* Assert cost appears in the Costs tab without duplicate counting.

### 3. Add Property Setup Assistant Tests

Risk:

The assistant is a key onboarding and record-building workflow. Recent UI
changes made it collapsible, but coverage should protect generated output, not
only layout.

Recommended tests:

* Collapse/expand state does not interfere with the Continue setup button.
* Selecting present systems creates expected appliance/system records.
* Suggested tasks include correct property context.
* Assistant remains optional and does not block property usage.

### 4. Add Document Upload and Review Readiness Coverage

Risk:

Property Knowledge Acquisition has strong parsing tests, but upload status and
review readiness were recently identified as user-facing issues.

Recommended tests:

* Upload status transitions from uploading/processing to ready.
* Review panel refreshes when backend processing completes.
* Suggested details show property mismatch warning when appropriate.
* Accepted invoice details create maintenance history with invoice total,
  contractor, warranty context, and correct property targeting.

### 5. Add Support/Admin Function Boundary Tests

Risk:

Firestore denies direct client access, but support/admin workflows are function
managed. Function authorization should be tested separately.

Recommended tests:

* Standard user cannot call admin ticket functions.
* Admin session is required for admin ticket updates.
* Ticket status updates write the correct customer-visible Maintley Update.
* Resolved/internal testing remains open to the customer as "Testing fix."
* Ticket attachments are visible but details remain collapsed by default.

### 6. Add Contractor Field Regression Tests

Risk:

Contractor requirements were intentionally relaxed and URL/portal fields were
added. These are small changes but high-friction if they regress.

Recommended tests:

* Contractor can be created with company name only.
* Website and portal URLs are normalized safely.
* Contractor remains associated with the selected property.
* Contractor can be used in task/maintenance history context.

### 7. Improve Notification Coverage After Event Refactor

Risk:

Notification behavior is currently fragmented and intentionally scheduled for
refactor. Writing broad lifecycle tests now may create churn.

Recommended approach:

Do not expand notification workflow tests until the Maintley Event Engine work
starts. Keep current rules ownership tests. Add event lifecycle tests as part of
the refactor.

## Recommended Next Test Work

### Phase 1: Make Existing Critical Checks Required

1. Keep `yarn test:ci`, `yarn test:rules`, `yarn build`,
   `yarn check:asset-budgets`, and `yarn --cwd functions build` in the required
   Build Check workflow.
2. Ensure required branch checks include the expanded Build Check jobs.
3. Add Storage emulator coverage before making `yarn test:storage` required.

Expected impact:

Prevents security and deploy regressions from merging silently.

### Phase 2: Strengthen Core Workflow E2E Assertions

1. Replace broad task/property E2E fallbacks with persisted-state assertions.
2. Add task completion to maintenance history verification.
3. Add property setup assistant output verification.
4. Keep destructive tests manual or cleanup-backed.

Expected impact:

Makes workflow tests useful as release evidence rather than smoke-only checks.

### Phase 3: Add Function Authorization Tests

1. Support/admin callable authorization.
2. Stripe webhook entitlement transitions.
3. Invite acceptance/revocation.
4. Document review status publication.

Expected impact:

Protects the server-side authority layer that Firestore rules cannot test.

### Phase 4: Fill Feature-Specific Regression Gaps

1. Contractor minimal creation and URL fields.
2. Appliance/system CRUD and document association.
3. Tenant request submission and conversion.
4. Report Builder UI/export flow.
5. Android release artifact validation.

Expected impact:

Improves coverage around user-visible features that are currently under-tested.

## Recommended Release Gate

For normal feature PRs:

```bash
yarn test:ci
yarn build
yarn test:rules
yarn --cwd functions build
yarn check:asset-budgets
yarn e2e:smoke:chrome
```

For release candidates or high-risk changes:

```bash
yarn e2e:workflows:chrome
yarn e2e:full-safe
yarn test:stripe:sandbox
yarn test:stripe:webhook:sandbox
```

For billing changes:

Require Stripe sandbox validation and manual Stripe Dashboard verification.

For permission changes:

Require Firestore rules tests and at least one manual owner/team-member/tenant
account validation pass when the affected role exists. Add Storage emulator
tests before treating Storage as an automated required check.

## Current Bottom Line

Maintley now has a credible regression foundation for auth, account state,
permissions, billing entitlement, Property Knowledge Acquisition, Maintley
Intelligence, support display, and reporting adapters.

The next priority should not be adding many unrelated tests. The next priority
should be adding Storage emulator coverage and making the core
property/task/history workflow tests assert durable saved outcomes.
