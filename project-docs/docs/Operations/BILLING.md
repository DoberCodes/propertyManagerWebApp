# Billing and Stripe

Last reviewed: 2026-06

This document describes Maintley's billing architecture, subscription lifecycle, Stripe integration, and resource enforcement.

This document is implementation-focused.

For customer-facing plan definitions, feature availability, storage limits, upgrade messaging, and subscription comparisons, see:

PLAN_FEATURE_MATRIX.md

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

Those definitions belong in PLAN_FEATURE_MATRIX.md.

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

PLAN_FEATURE_MATRIX.md

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

## PLAN_FEATURE_MATRIX.md

Defines:

* Plan positioning
* Feature availability
* Property limits
* Storage limits
* Upgrade messaging
* Customer-facing plan comparisons

If documentation conflicts occur, PLAN_FEATURE_MATRIX.md should be treated as the product source of truth and billing implementation should be updated accordingly.

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
