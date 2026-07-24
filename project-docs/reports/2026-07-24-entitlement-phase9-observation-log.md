# Entitlement Phase 9 observation log

Date opened: 2026-07-24

Release branch: `austin/guard-entitlement-package-version`

Pull request: `#86`

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

### Pending before 9.1

* Commit and push the Phase 6-8 implementation and Phase 9 documentation to PR
  #86.
* Obtain passing PR checks for the updated head commit.
* Independently confirm the Firestore export exists and is restorable.
* Record the final merge commit, deployed Functions revision, web version,
  signed Android version, and the named human rollback operator.

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

Status: not started. Awaiting updated PR checks, merge, and backup confirmation.
