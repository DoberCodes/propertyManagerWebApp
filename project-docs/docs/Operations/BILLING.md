# Billing and Stripe

Last reviewed: 2026-06

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

* src/constants/subscriptions.ts
* src/utils/subscriptionUtils.ts
* functions/stripeFunctions.ts
* src/services/stripeService.ts

Current plans:

| Plan           | Purpose                          |
| -------------- | -------------------------------- |
| homeowner      | Free homeowner plan              |
| homeowner_plus | Paid homeowner plan              |
| property       | Small portfolio plan             |
| portfolio      | Advanced portfolio and team plan |

Special non-subscription access types:

* guest
* tenant

Detailed plan limits and capabilities are defined in:

MAINTLEY_PLAN_FEATURE_MATRIX.md

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

---

## Paid Plans

Paid plans are purchased through Stripe Checkout.

Expected flow:

1. User selects plan.
2. Checkout session is created.
3. Stripe processes payment.
4. Webhook updates subscription state.
5. Firestore subscription records are synchronized.

Checkout intent is not paid-plan access. If a user starts Stripe Checkout and
backs out before Stripe confirms the subscription, Maintley may keep billing
context such as `stripeCustomerId`, `promoCode`, `pendingCheckoutPlan`, and
`pendingCheckoutStartedAt`, but the current entitlement remains the free
Homeowner plan until Stripe confirms an active or trialing subscription.

Feature gates, resource limits, push/email delivery gates, and account usage
widgets should use the current entitled plan, not a pending checkout plan or
future scheduled plan.

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

---

## Firestore Rules

Examples:

* maxPropertiesForPlan
* maxDevicesForPlan
* property counter validation
* device counter validation

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
