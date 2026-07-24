# Entitlement rollout readiness

Date: 2026-07-24

Status: Phases 1 through 8 are source-complete. Phase 9 deployment,
production-like validation, observation, manual synthetic-subscription
migration, and eventual legacy-path removal remain operational work.

## GitHub Actions repository variables

Add these under **Settings > Secrets and variables > Actions > Variables**.
All feature flags should remain `false` until the corresponding internal test
step begins.

| Variable | Initial value | Used by |
| --- | --- | --- |
| `ENABLE_MULTI_HOMEOWNER_PLAN` | `false` | Web and Functions |
| `ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL` | `false` | Web and Functions |
| `ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE` | `false` | Web and Functions |
| `ENABLE_ACCESS_LIFECYCLE_COMMUNICATION` | `false` | Functions |
| `HOMEOWNER_PLUS_TRIAL_ELIGIBILITY_START_AT` | empty until approved; then an ISO 8601 timestamp | Functions |
| `ENABLE_TRUSTED_SETUP_PLAN_ACTIVATION` | `false` | Web |
| `ENABLE_TRUSTED_RECURRING_TASK_WRITES` | `false` | Web |
| `ENABLE_COMPLIMENTARY_ACCESS_CODES` | `false` | Web and Functions |
| `ENABLE_TRUSTED_STORAGE_QUOTA` | `false` | Web and Functions |
| `STRIPE_CUSTOMER_PORTAL_URL` | `https://billing.stripe.com/p/login/00wbJ27029Gxama5Cg5gc00` | Web |

## GitHub Actions repository secrets

The changes require the following Stripe price identifiers for non-interactive
Functions deployment:

* `PROD_STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID`
* `PROD_STRIPE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID`
* `PROD_STRIPE_MULTIPLE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID`
* `PROD_STRIPE_MULTIPLE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID`
* `PROD_STRIPE_PROPERTY_MONTHLY_PRICE_ID`
* `PROD_STRIPE_PROPERTY_ANNUAL_PRICE_ID`
* `PROD_STRIPE_PORTFOLIO_MONTHLY_PRICE_ID`
* `PROD_STRIPE_PORTFOLIO_ANNUAL_PRICE_ID`

The deploy workflow also continues to require its existing infrastructure
secrets:

* `FIREBASE_SERVICE_ACCOUNT_JSON`
* `PROD_FIREBASE_PROJECT_ID` or `PROD_REACT_APP_FIREBASE_PROJECT_ID`
* `PROD_REACT_APP_FIREBASE_API_KEY`
* `PROD_REACT_APP_FIREBASE_AUTH_DOMAIN`
* `PROD_REACT_APP_FIREBASE_PROJECT_ID`
* `PROD_REACT_APP_FIREBASE_STORAGE_BUCKET`
* `PROD_REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
* `PROD_REACT_APP_FIREBASE_APP_ID`
* `PROD_REACT_APP_FIREBASE_WEB_PUSH_VAPID_KEY`
* `PROD_REACT_APP_STRIPE_PUBLIC_KEY`
* `PROD_REACT_APP_FIREBASE_MEASUREMENT_ID`, when analytics is used
* `PROD_REACT_APP_ENABLE_ANALYTICS`, when analytics is used

## Firebase Functions secrets

These are Firebase/Google Secret Manager values, not GitHub Actions variables:

* `COMPLIMENTARY_ACCESS_CODE_PEPPER` - new; at least 32 random characters.
* `RESEND_API_KEY` - existing; required for lifecycle email delivery.
* `STRIPE_SECRET_KEY` - existing; required for paid checkout and admin billing.
* `STRIPE_WEBHOOK_SECRET` - existing; required for Stripe webhook authority.

Create the new access-code secret before deploying its callables:

```text
firebase functions:secrets:set COMPLIMENTARY_ACCESS_CODE_PEPPER
```

## Non-GitHub operational configuration

Storage-rule enforcement is controlled by the server-written Firestore document
`appConfig/entitlementRollout` and boolean field
`trustedStorageQuotaRequired`. It must remain `false` or absent for the first
compatible deployment. Set it to `true` only after the trusted-storage client
and Functions paths have been deployed and internally validated.

Complimentary access codes must be provisioned with the repository's local
`provision:access-code` command. Plaintext codes and the pepper must never be
stored in GitHub configuration, Firestore, logs, analytics, or audit metadata.

## Internal rollout readiness

| Capability | Source status | Next release action |
| --- | --- | --- |
| Central entitlement resolver and internal grants | Ready | Deploy disabled, then re-test temporary, permanent, expiration, and Maintley-owner self-grant behavior. |
| Multi-Homeowner paid plan | Ready for internal testing | Configure both Stripe price IDs, enable its flag, and test monthly/annual Checkout, webhook, cancellation, and downgrade. |
| Homeowner+ first-property trial | Ready for internal testing | Set an approved eligibility timestamp, enable trial and grant issuance, then test successful first-property commit, retry idempotency, expiration, and Free fallback. |
| Trusted setup maintenance-plan activation | Ready for internal testing | Deploy the callable, enable the web flag, and test confirmation, retry, and non-entitled recurrence removal. |
| Trusted recurring-task writes | Ready for internal testing | Deploy the callable, enable the web flag, and test creation, schedule edits, expiration, and completion without generating a next occurrence. |
| Access lifecycle email and in-app notices | Ready for internal testing | Confirm `RESEND_API_KEY`, enable the Functions flag, and test activation, progress, ending, expiration, time zones, suppression, and manual admin sends. |
| Manual occupancy and tenant continuity | Ready for deployed validation | Test paid creation/invitation, downgraded manual-only records, and retained minimal access for an already activated tenant. |
| Property, team, and file downgrade continuity | Ready for deployed validation | Test an over-limit downgraded account: retain read/use/delete, block expansion, preserve every property and active team relationship. |
| Complimentary Portfolio or other plan access codes | Ready for internal testing only | Configure the pepper, provision one limited program, enable the access-code flag, and test preview, redemption, concurrency, expiration, lower quotas, and intentional Checkout continuation. |
| Trusted storage reservations and usage | Ready for staged internal testing | Deploy with both controls off, enable the GitHub flag, validate every upload family and reconciliation, then enable the Firestore enforcement field. |
| Plan and usage disclosure plus Stripe customer portal | Ready | Deploy and verify paid, Free, temporary-grant, permanent-grant, missing-payment-method, and expired-grant displays. |

## Not ready for broad activation

* Automatic complimentary-to-paid conversion has no approved live program and
  must not be enabled until Stripe-backed consent, billing-state, opt-out,
  payment-failure, and authentication-required behavior pass deployed tests.
* Synthetic 100-percent Stripe subscriptions still require the approved staged
  manual migration and per-account parity/no-future-invoice checks.
* Trusted recurrence client fallbacks and other legacy paths remain until the
  observation period succeeds; they are Phase 9 cleanup, not part of the first
  enablement.
* No public access-code cohort should launch before the deployed downgrade and
  storage gates pass.
