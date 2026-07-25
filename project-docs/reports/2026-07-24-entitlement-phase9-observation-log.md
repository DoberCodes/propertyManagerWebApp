# Entitlement Phase 9 observation log

Date opened: 2026-07-24

Release implementation branch: `austin/guard-entitlement-package-version`

Release implementation pull request: `#86`

Release deployment pull request: `#88`

Observation remediation branch: `austin/fix-entitlement-hydration`

Production project: `mypropertymanager-cda42`

Rollback owner: Maintley owner

## 9.0 release preflight

### Completed

* Local web tests: 62 suites passed; 444 tests passed; one existing todo.
* Production web build and Functions TypeScript build passed.
* Firestore rules, Storage rules, entitlement-grant, and complimentary
  access-code emulator tests passed.
* Setup activation, recurring-task, manual-occupancy, lifecycle-template,
  admin-grant-policy, SEO, pricing, and deploy-package validation passed.
* Workflow YAML and whitespace validation passed.
* GitHub Actions rollout variables were inventoried. Every disabled rollout
  variable exists; internal grant issuance is the only enabled entitlement
  rollout variable.
* The Stripe customer portal variable points to the approved hosted portal.
* Required GitHub Actions deployment secrets and all eight server-owned Stripe
  price secrets exist, including the canonical
  `PROD_STRIPE_MULTIPLE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID` and
  `PROD_STRIPE_MULTIPLE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID` names.
* Firebase Secret Manager metadata confirms enabled versions of
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, and
  `COMPLIMENTARY_ACCESS_CODE_PEPPER`.
* `COMPLIMENTARY_ACCESS_CODE_PEPPER` version 1 was generated cryptographically
  and piped directly to Firebase without printing or storing the value locally.
* The operator previously identified Firestore export
  `maintley-firestore-backups/2026-07-24T16:51:50_53519`. Its existence and
  restoreability still require independent cloud-console confirmation before
  merge.

### Completed after preflight

* The release deployment reached production from merge commit `34ad0aab`.
* Firebase Functions, Firestore rules, and Storage rules deployed successfully.
* Deployment validation, including callable CORS preflights, passed.
* Internal entitlement-grant issuance remained the only enabled entitlement
  rollout flag.

### Still required for the release record

* Independently confirm the Firestore export exists and is restorable.
* Record the deployed Functions revision, web version, signed Android version,
  and the named human rollback operator.

## Current rollout-variable state

| Variable | Observed value |
| --- | --- |
| `ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE` | `true` |
| `ENABLE_MULTI_HOMEOWNER_PLAN` | `false` |
| `ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL` | `false` |
| `ENABLE_ACCESS_LIFECYCLE_COMMUNICATION` | `false` |
| `ENABLE_TRUSTED_SETUP_PLAN_ACTIVATION` | `false` |
| `ENABLE_TRUSTED_RECURRING_TASK_WRITES` | `false` |
| `ENABLE_COMPLIMENTARY_ACCESS_CODES` | `false` |
| `ENABLE_TRUSTED_STORAGE_QUOTA` | `false` |
| `HOMEOWNER_PLUS_TRIAL_ELIGIBILITY_START_AT` | intentionally absent |

## Observation stop conditions

Stop rollout and use the affected feature's documented rollback whenever any
test produces unauthorized access, data loss, an unconsented charge, duplicate
grant, duplicate task, duplicate lifecycle communication, or hidden retained
property/file. During cohort expansion, also pause when Checkout or callable
failure exceeds five percent, the same critical workflow fails twice
consecutively, or support events cannot be reviewed within one business day.

## 9.1 additive disabled deployment

Status: deployed with cohort expansion paused.

Production observation found that a permanent Portfolio grant initially resolved
correctly, but navigating through a route outside the protected application
layout and returning to the dashboard could replace the resolved grant with the
base Free billing profile. Property terminology persisted and existing retained
properties remained visible, but grant-derived capabilities, plan presentation,
team navigation, storage allowances, recurring-task access, and new-property
access reverted until a full page reload.

Root cause: authentication/profile hydration and the family-account listener
treated an omitted `effectiveEntitlementProjection` as an authoritative empty
projection. That allowed a partial same-account profile refresh to erase the
already-resolved grant in client state.

Remediation on `austin/fix-entitlement-hydration`:

* Preserve an existing resolved projection only when a same-user,
  same-account profile refresh omits the projection.
* Continue treating an explicitly present projection with
  `activeGrants: []` as authoritative revocation or expiration.
* Never preserve grants across a user or account boundary.
* Ignore family-account snapshots that omit the projection instead of
  translating omission into revocation.
* Cover preservation, explicit clearing, and account-isolation behavior with
  reducer and application-listener regression tests.

Advance gate: keep all additional rollout variables disabled until the fix is
deployed and the grant remains stable after dashboard navigation, View All
Features navigation, Settings/Profile navigation, and returning from an
unauthorized admin route without requiring a page reload.

### Hydration-remediation validation

Status: local validation passed; deployed validation pending.

Pull request `#89` is open with all required Build Check, Functions build,
unit-test, E2E, entitlement-package-version, and release-note checks passing.
It has not yet been merged or deployed.

The permanent Portfolio demo fixture passed the original reproduction path on
localhost:

* Settings continued to show `Billing plan: Free` separately from granted,
  permanent Portfolio access.
* Navigating to View All Features and returning preserved Portfolio access and
  Team navigation without requiring a page reload.
* Dashboard navigation preserved access to all nine existing properties and
  the Portfolio navigation surface.
* Profile showed effective Portfolio access, six remaining property slots,
  18 of 5,000 files, 2.9 MB of 25 GB, and the existing team.
* The same Profile and Usage entitlement presentation remained present at
  desktop, 768-by-1,024 tablet, and 390-by-844 mobile viewport sizes.
* The operator independently confirmed that the originally observed navigation
  fallback appeared resolved in local testing.

Do not treat this as completion of the 9.1 production advance gate. Merge and
deploy `#89`, then repeat the navigation sequence on the deployed web origin.

## 9.2 baseline entitlement and client parity

Status: deployed permanent-grant and paid Stripe fixtures passed entitlement
parity; billing-disclosure remediation is in progress before cohort expansion.

Completed locally:

* Permanent Portfolio grant resolves independently from the Free billing plan.
* Granted capabilities, limits, storage presentation, property visibility, and
  Team navigation remain aligned across desktop, tablet, and mobile web.
* Plan and Usage accurately states that no payment method is connected and no
  automatic billing follows permanent complimentary access.

Completed on the deployed web origin:

* Permanent Portfolio access remained stable through dashboard, Features,
  Settings, and Profile navigation at desktop, tablet, and mobile sizes.
* A paid Stripe Portfolio account retained paid access through navigation and
  reload, showed the expected Team and property-limit surfaces, and exposed the
  Stripe customer-portal action.
* Cancellation was exercised for Portfolio and Homeowner fixtures without an
  entitlement mismatch.

Production observation found one billing-presentation mismatch on the paid
Portfolio fixture: Settings showed the active Stripe plan while Profile showed
the internal-grant-only statement that no automatic billing would occur. The
subscription uses a real Stripe billing relationship with a 100% discount, so
the statement was not an authoritative description of its renewal state.

Remediation in progress:

* Persist a sanitized Stripe billing disclosure on both user and family-account
  subscription records, including list price, discount duration, next invoice,
  renewal date, and scheduled cancellation state.
* Keep Stripe webhooks as the primary synchronization path and perform a
  non-blocking, ownership-verified synchronization during authenticated app
  initialization as a stale-state recovery check.
* Update active Redux state immediately from that recovery response so account
  surfaces do not wait for a later profile snapshot.
* Evaluate all subscriptions on the Stripe customer during recovery so a newly
  assigned, current configured Maintley plan supersedes an older cancelled
  stored subscription ID.
* Treat multiple simultaneous current Stripe subscriptions as an explicit
  billing conflict, preserve the last resolved plan instead of guessing, and
  expose the conflict in account settings for operational review.
* Restrict subscription detail and cancellation callables to the authenticated
  owner of the stored Stripe subscription.
* Show internal complimentary-transition language only for internal grants;
  paid and discounted Stripe subscriptions use Stripe-derived disclosure.

This remediation requires deployed verification before the 9.2 advance gate
can close. It does not authorize a charge or create a billing relationship.

Remaining before the 9.2 advance gate:

* Repeat the permanent-grant checks on the deployed web origin and a signed
  Android build.
* Validate Free, paid, temporary-grant, expired-grant, and cancelled fixtures.
* Compare billing plan, effective access, capability limits, admin display, and
  Plan and Usage for every fixture.
* Re-test Maintley-role authorization, including the Maintley owner exception,
  and confirm that an ordinary customer property owner receives no exception.
* Verify Stripe customer-portal access for a paid fixture and its absence or
  appropriate alternative presentation for non-Stripe fixtures.

Advance gate remains zero unexplained entitlement mismatches or unauthorized
actions across web, signed Android, Functions, rules, and the admin display.
