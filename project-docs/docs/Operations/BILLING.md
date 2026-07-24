# Billing and Stripe

Last reviewed: 2026-07

This document describes Maintley's billing architecture, subscription lifecycle, Stripe integration, and resource enforcement.

This document is implementation-focused.

For customer-facing plan definitions, feature availability, storage limits, upgrade messaging, and subscription comparisons, see:

MAINTLEY_PLAN_FEATURE_MATRIX.md

---

# Purpose

Billing is responsible for:

* Stripe integration
* Subscription lifecycle management
* Checkout creation
* Subscription synchronization
* Upgrade and downgrade workflows
* Resource enforcement

Billing is not the source of truth for:

* Feature availability
* Plan comparisons
* Upgrade messaging
* Product positioning

Those definitions belong in MAINTLEY_PLAN_FEATURE_MATRIX.md.

---

# Current Plan Model

Source files:

* packages/entitlements
* src/constants/subscriptions.ts
* src/utils/subscriptionUtils.ts
* functions/subscriptionEntitlements.ts
* functions/stripeFunctions.ts
* src/services/stripeService.ts

Current plans:

| Plan           | Purpose                          |
| -------------- | -------------------------------- |
| homeowner      | Free homeowner plan              |
| homeowner_plus | Paid homeowner plan              |
| multi_homeowner | Five-home homeowner plan (launch-gated) |
| property       | Small portfolio plan             |
| portfolio      | Advanced portfolio and team plan |

Special non-subscription access types:

* guest
* tenant

Detailed plan limits and capabilities are defined in:

MAINTLEY_PLAN_FEATURE_MATRIX.md

## Entitlement foundation

The web application and Firebase Functions now share the pure resolver in
`packages/entitlements`. Client and server feature helpers resolve typed
capabilities and limits from that package. Compatibility wrappers preserve
existing subscription records. Internal grant issuance remains independently
launch-gated.

Compatibility mode preserves existing paid-plan records while synthetic Stripe
access is reviewed manually. Strict mode requires Stripe confirmation before a
paid plan supplies paid access. Pending Checkout never supplies paid access.
Unknown entitlement values emit structured default-deny diagnostics from the
Functions boundary. Setting `ENTITLEMENT_COMPARE_MODE=true` emits structured
stored-plan versus resolved-plan comparison events during a controlled rollout;
it does not change the access result.

The package defines temporary and permanent grant, billing-transition,
administrative-audit, and rollout-flag contracts. The Homeowner+ first-property
trial is the first persisted generic grant workflow. It remains disabled unless
both `ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL` and
`ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE` are true and
`HOMEOWNER_PLUS_TRIAL_ELIGIBILITY_START_AT` is a valid launch boundary. Existing
grants continue resolving when issuance is disabled. No internal trial creates
a Stripe customer, subscription, payment method, schedule, or automatic charge.

The web equivalents are `REACT_APP_ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL` and
`REACT_APP_ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE`; these describe rollout
state but do not revoke an already-issued grant.

Clients cannot create a user with a paid base plan or rewrite authoritative
subscription fields after signup. Firestore permits only non-billable initial
plans and narrowly scoped pending-checkout or promo-code changes. Stripe
Functions, webhooks, and approved admin operations remain responsible for paid
plan, billing status, period, customer, and subscription identifiers.

Multi-Homeowner is also disabled by default during its staged rollout. The web
uses `REACT_APP_ENABLE_MULTI_HOMEOWNER_PLAN`; Functions use
`ENABLE_MULTI_HOMEOWNER_PLAN`. When disabled, public pricing, registration,
checkout, and admin selection omit or reject the plan. Its canonical Stripe
prices remain server-owned and map to `multi_homeowner` only when the launch
flag is enabled.

---

# Subscription Shape

Subscription records may exist on user and family account records.

Important fields:

* status
* plan
* currentPeriodStart
* currentPeriodEnd
* trialEndsAt
* canceledAt
* stripeCustomerId
* stripeSubscriptionId
* promoCode
* hasScheduledSubscription
* scheduledPlan

Supported statuses:

* trial
* active
* cancelled
* expired
* past_due

---

# Billing Lifecycle

## Free Plan

Users may use the free homeowner plan without creating a Stripe subscription.

No Stripe customer is required until entering a paid plan flow.

Free registration is complete as soon as Firebase creates the user and Firestore
profile. Maintley should keep that authenticated profile active and open
onboarding directly. It must not clear the new session or add a second
authentication-loading transition before onboarding.

---

## Paid Plans

Paid plans are purchased through Stripe Checkout.

The embedded registration selector and the authenticated Plans page share the
same responsive pricing-card system. Each card keeps the plan name, price,
billing cycle, intended audience, four feature highlights, and selection action
visible. Remaining features use progressive disclosure so users can review the
complete plan without making the initial comparison unnecessarily tall. The
selector also states that checkout is handled by Stripe, card details are not
stored by Maintley, and the final total can be reviewed before payment.

Expected flow:

1. User selects plan.
2. Maintley creates the Firebase account with the Free plan as its entitlement
   and records the selected paid plan as pending checkout intent.
3. The browser opens the protected `/#/checkout/start` route outside the main
   application layout.
4. That route requests a Stripe Checkout session and redirects the browser to
   the returned Stripe URL.
5. Stripe processes payment and returns the authenticated user to
   `/#/checkout/complete`.
6. Maintley verifies that the Checkout session belongs to the signed-in user.
7. Firestore user and family-account subscription records are synchronized.
8. Maintley reloads the authoritative user profile and then opens the dashboard.

Current clients submit a stable paid plan ID and `month` or `year` billing
cycle. The Function selects the Stripe price from server-owned configuration;
a client-provided price ID is not normal checkout authority. The temporary
price-only compatibility path accepts only prices already present in that
server catalog, emits a structured warning when used, and is scheduled for
removal in release `2.10.0`.

Checkout launch has a 30-second request timeout. A timeout or launch failure
must replace the loading screen with actions to retry secure checkout or
continue using the Free plan. Authenticated users with pending checkout intent
are routed back through `/#/checkout/start`, allowing interrupted registrations
and later logins to recover without entering onboarding or the dashboard first.

Paid registration returns after the authenticated user profile, accepted legal
documents, Free entitlement, and pending checkout intent are durable. It does
not wait on a separate `ensureFamilyAccount` callable. The
`createCheckoutSession` function initializes or synchronizes the family account
and owner membership within the same server invocation before creating the
Stripe session. This avoids an additional callable cold start while preserving
account consistency. Free registration still completes family-account setup
before opening onboarding because it has no checkout step to perform that work.

Checkout completion runs outside the primary application layout. The dashboard
and onboarding flow must not mount until verification and profile refresh finish.
Checkout completion must not use a full-page reload to discover the paid plan.
If verification is temporarily unavailable, the completion page provides retry
and return-to-plans actions while preserving the user's account.

If Stripe checkout is cancelled or checkout creation fails, Maintley clears the
pending checkout intent and leaves the account on the Free plan. The Plans page
shows Free as the current plan; the user does not need to select it again and
may continue on Free or start another upgrade. Cancellation must synchronize
the confirmed Free subscription to both the user and family-account records so
a later profile refresh cannot restore stale pending-checkout intent.

Checkout intent is not paid-plan access. If a user starts Stripe Checkout and
backs out before Stripe confirms the subscription, Maintley may keep billing
context such as `stripeCustomerId`, `promoCode`, `pendingCheckoutPlan`, and
`pendingCheckoutStartedAt`, but the current entitlement remains the free
Homeowner plan until Stripe confirms an active or trialing subscription.

Feature gates, resource limits, push/email delivery gates, and account usage
widgets should use the current entitled plan, not a pending checkout plan or
future scheduled plan.

Paid-plan setup records, such as default property groups or team groups, should
be created only after Stripe confirms an active or trialing subscription. A
pending checkout may store intent metadata, but it must not create paid-plan
operational structure.

---

## Upgrade Flow

Expected behavior:

* Reuse existing Stripe customer.
* Update or replace existing subscription.
* Avoid creating duplicate active subscriptions.

Verify:

* stripeCustomerId reuse
* stripeSubscriptionId handling
* webhook synchronization

---

## Downgrade Flow

Downgrades should:

* Preserve user data whenever possible.
* Restrict creation of new resources beyond plan limits.
* Avoid destructive data removal.

Existing records should remain accessible unless explicitly required otherwise.

---

## Cancellation Flow

Cancellation should:

* Update Stripe subscription status.
* Synchronize Firestore subscription state.
* Preserve historical account data.

## Admin Support Adjustments

The admin portal includes support-only subscription actions for troubleshooting
and account repair:

* Apply billing updates for plan, trial, and coupon changes in one action.
* Mark subscription cancelled as a separate destructive action.

By default, plan and trial updates write Maintley's user subscription record and
write one `admin_audit_logs` entry without contacting Stripe.

Support staff may choose **Update Stripe subscription first** when the user
record already has a Stripe subscription ID. In that mode, the admin action
updates Stripe first and then syncs Maintley's subscription record from the
Stripe result.

Current Stripe-backed support behavior:

* Plan changes require an existing Stripe subscription and a paid plan.
* Trial extensions require an existing Stripe subscription that is still in trial.
* Coupon codes are applied to the existing Stripe subscription when Stripe sync
  is enabled.
* Refresh from Stripe can repair Firebase subscription records by looking up the
  stored Stripe subscription ID, stored Stripe customer ID, or the user's email
  address in Stripe.
* Cancellations set the existing Stripe subscription to cancel at period end.

If the user record does not have a Stripe subscription ID, plan and trial support
actions remain Maintley-only. Coupon codes create a Stripe Checkout link for a
paid plan instead of manually discounting the user in Firestore.

Refresh from Stripe is the preferred support repair when Stripe already has an
active subscription but Firebase does not show the customer as subscribed. The
repair updates the user subscription and family account subscription from the
selected Stripe subscription and writes an admin audit log entry.

## Admin Billing Tools

The admin portal includes a focused Billing Tools area for customer acquisition
and support offers.

Supported admin tools:

* Create Stripe coupons and promotion codes.
* View recent active, expired, and inactive promotion codes.
* Copy coupon codes for support or sales follow-up.
* Create a Stripe Checkout link for a selected user with a selected coupon.
* Open the user's Stripe customer record from the support view when a Stripe
  customer ID exists.

Coupon creation supports:

* Percent off or dollar off.
* Duration: once, repeating, or forever.
* Max redemptions.
* Expiration date.
* Optional plan scoping through the Stripe product attached to the selected
  Maintley plan price.
* Internal support note stored in Stripe metadata and admin audit logs.

Maintley should not manually discount users only in Firestore. Coupons,
promotion codes, redemptions, expiration, and Checkout discounts must remain in
Stripe. Firestore may store Stripe customer identifiers and admin audit records
needed for support traceability.

---

# Stripe Integration

## Functions

Exported functions:

* createCheckoutSession
* validatePromotionCode
* verifyCheckoutSession
* cancelSubscription
* getSubscriptionDetails
* syncSubscriptionFromStripe
* stripeWebhook
* createTrialSubscription
* adminPortalRefreshUserSubscriptionFromStripe
* adminPortalApplyUserBillingActions
* adminPortalCreateBillingCoupon
* adminPortalListBillingCoupons
* adminPortalCreateCheckoutLinkWithCoupon

Stripe webhook processing lives in:

functions/stripeFunctions.ts

---

## Expected Responsibilities

Stripe integration should:

* Create or reuse customers.
* Create checkout sessions.
* Process subscription updates.
* Synchronize Firestore state.
* Handle cancellations.
* Support future scheduled subscription changes.

---

# Resource Enforcement

Subscription limits are enforced through:

## Client Utilities

Examples:

* canAddProperty
* canAddDevice
* getRemainingPropertySlots
* getRemainingDeviceSlots
* getEffectiveSubscriptionPlanId

`getEffectiveSubscriptionPlanId` delegates to the shared resolver in
compatibility mode. Feature decisions use typed capability helpers and numeric
limits use the shared plan presets.

---

## Firestore Rules

Examples:

* planLimit mirror
* planHasCapability mirror
* property counter validation
* device counter validation

Firestore Rules cannot import the runtime package, so their narrow mirror is
kept centralized in these two functions and covered by emulator parity tests.

---

## Family Account Counters

Counters currently stored on:

familyAccounts/{accountId}

Examples:

* propertyCount
* deviceCount

Counters should remain synchronized with subscription enforcement logic.

---

# Team Member Billing Rules

Team members do not own subscriptions.

Expected behavior:

* No billing management access.
* No upgrade prompts.
* No subscription ownership.
* No Stripe customer ownership.

Billing remains associated with the account owner.

---

# Tenant Billing Rules

Tenants do not participate in subscription billing.

Expected behavior:

* No billing management access.
* No upgrade prompts.
* No Stripe customer ownership.

---

# Environment Configuration

Frontend requires Stripe public configuration and plan pricing identifiers.

Functions require:

* STRIPE_SECRET_KEY
* STRIPE_WEBHOOK_SECRET

Plan-specific price identifiers are configured through environment variables.

Review deployment configuration before changing billing behavior.

---

# Testing

Useful commands:

npm run test:stripe:sandbox

npm run test:stripe:cards:sandbox

npm run test:stripe:webhook:sandbox

npm run test:stripe:e2e

npm run test:stripe:all

Use Stripe test mode for validation.

---

# Documentation Boundaries

## BILLING.md

Defines:

* Stripe integration
* Subscription lifecycle
* Checkout behavior
* Synchronization logic
* Resource enforcement

---

## MAINTLEY_PLAN_FEATURE_MATRIX.md

Defines:

* Plan positioning
* Feature availability
* Property limits
* Storage limits
* Upgrade messaging
* Customer-facing plan comparisons

If documentation conflicts occur, MAINTLEY_PLAN_FEATURE_MATRIX.md should be treated as the product source of truth and billing implementation should be updated accordingly.

---

# Billing Philosophy

Maintley billing should remain simple and predictable.

Plans should be easy to understand and easy to explain.

Feature gating should follow customer value rather than technical implementation.

Prefer:

* Clear plan differentiation
* Straightforward upgrade paths
* Predictable resource limits

Avoid:

* Excessive feature fragmentation
* Complex add-on packages
* Technical limitations presented as customer-facing value
