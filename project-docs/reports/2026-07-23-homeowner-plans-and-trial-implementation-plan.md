# Homeowner Plans and Homeowner+ Trial Implementation Plan

Date: 2026-07-23

Status: Approved implementation plan; Phases 1 and 2 complete; Phases 3 and 4 implemented behind disabled launch flags; Phase 7 trial-lifecycle foundation in progress behind a separate disabled flag

Related accepted ADRs:

* `project-docs/ADR/0030-homeowner-plus-trial-experience.md`
* `project-docs/ADR/0031-homeowner-plus-trial-lifecycle-and-communication.md`
* `project-docs/ADR/0032-centralized-entitlement-architecture.md`
* `project-docs/ADR/0028-firebase-hosting-and-browser-routing-migration.md`
* `project-docs/ADR/0029-homeowner-multi-property-plan.md`

## Purpose

This report inventories the current repository and defines a clean path for:

1. centralizing product capabilities and quantitative limits
2. migrating existing feature gates without changing behavior
3. adding a homeowner-oriented multi-property plan
4. giving eligible new Free accounts a 30-day Homeowner+ product trial
5. preserving records while premium automation stops at expiration
6. communicating trial and promotional-access transitions predictably

This report is an implementation plan, not current-behavior documentation. The
entitlement and lifecycle architecture in ADRs 0031 and 0032 is Accepted. ADRs
0029 and 0030 are Accepted with their commercial and trial-policy configuration
resolved.
Documentation approval does not itself change plan, billing, trial, email,
Firebase, or task behavior.

No additional ADR is required for the accepted entitlement, communication,
administrative-audit, or manual synthetic-subscription migration direction.

## Implementation progress

Phase 1 completed on 2026-07-23. The current foundation includes:

* one workspace-local entitlement package consumed by the web app and Functions
* stable capability and limit IDs with versioned existing-plan presets
* temporary and permanent account-grant contracts and additive resolution
* compatibility and strict Stripe-backed base-plan modes
* complimentary-transition, high-value audit, and default-off flag contracts
* account ownership, explicit-clock expiration, unknown-value diagnostics, and
  deterministic parity fixtures
* explicit Firestore denial of client access to authoritative grant records

Phase 2 routes the primary web and Functions feature gates through the
shared capability and limit helpers. No internal grant issuance,
Homeowner+ product trial, automatic paid transition, or access-lifecycle
delivery is enabled.

Firebase Functions capability consumers now resolve the family account's
authoritative subscription and grant collection together. This includes email
preference enforcement, task reminders, property insights, push delivery, team
reports and invitations, property-group deletion, and property-document
knowledge acquisition. Repository validation prevents new subscription-only
server capability checks outside the approved resolver boundary. Stripe-paid
state checks remain separate where billing state itself is the decision.

Phase 3 implements Multi-Homeowner behind a disabled-by-default launch
flag. The stable plan ID is `multi_homeowner`; approved pricing is $5.99 monthly
and $59.99 annually. The preset composes Homeowner+ with five properties and
Property Groups while retaining Homeowner+'s 250-file and 5 GB limits. Team,
resident, portfolio-reporting, and organization capabilities remain excluded.

The implementation includes server-owned monthly and annual price mappings,
webhook and admin mappings, public facts, registration and plan-selection
surfaces, deployment preflight, a five-property Firestore rule mirror, and
emulator tests. Firestore also rejects client-created paid subscriptions and
client changes to authoritative subscription fields while preserving the
pending-checkout recovery fields. Both modern plan-and-cycle checkout and the measured legacy
price-only path reject the plan while the flag is disabled. A Property or
Portfolio self-downgrade is blocked when the account exceeds five properties or
still has business-only team or resident records; the check does not mutate
those records.

The separate `maintley_role` platform-employment field is server-managed. Its
`owner` value means Maintley's owner and is not a customer property or account
ownership role; it remains authorized for trusted admin operations.

Validation completed with the flag disabled and with targeted plan-surface
tests enabled: 61 web test suites (426 passing tests and one todo), production
web build, Functions TypeScript build, entitlement-boundary validation,
Firestore emulator rules, public SEO/pricing validation, and asset budgets.
Before launch, the remaining operational gate is a Stripe test-mode purchase,
webhook, renewal, cancellation, restoration, and downgrade exercise using the
deployed environment and canonical price secrets. Static public pricing must be
regenerated with `npm run sync:public-pricing` in the same flag-enabled release.

Phase 4 implements the Homeowner+ product trial as the first persisted use of
the generic ADR 0032 grant model. When both issuance flags are enabled, account
bootstrap marks only intentional Free owner accounts created on or after the
configured eligibility boundary. A trusted property-create trigger issues one
deterministic 30-day grant after the first committed property, consumes program
eligibility, writes the derived account access projection, and appends the
immutable audit event in one transaction. Authoritative grant documents remain
client-inaccessible.

The account profile shows the end date, days remaining, no-payment-method and
no-charge behavior, and Free fallback. The admin customer lookup shows the
billing plan separately from effective bundles, grants, trial state, and the
access timeline. Active grants resolve dynamically by timestamp, so disabling
issuance does not revoke existing access and expiration does not depend on a
scheduled state mutation.

Phase 4 excludes Stripe conversion automation, support regrants, existing-user
launch cohorts, and `maintley_role` editing. Paid conversion still requires
Checkout. Before either issuance flag is enabled, the deployed environment must
validate account creation, first-property issuance, retry idempotency, UI
refresh, expiration, security rules, and audit visibility.

The initial Phase 7 trial-lifecycle foundation is implemented behind the
independent disabled `ENABLE_ACCESS_LIFECYCLE_COMMUNICATION` flag. It includes
the Day 0, 7, 21, and 30 Homeowner+ trial messages, persistent notices at key
milestones, program/grant/template/milestone idempotency, bounded catch-up,
retry leases, paid and terminal-state suppression, provider outcomes, shared
route generation, Maintley-branded templates, a staff-only test path that does
not write production delivery state, and minimized admin troubleshooting
visibility. Property-document progress is calculated from the canonical
embedded property records rather than a nonexistent secondary collection.

This does not complete Phase 7. Generic non-trial promotional templates,
automatic-transition 30/7/1-day communications, admin-requested sends and their
high-value audit events, provider alerting, and time-controlled Firestore and
delivery integration tests remain required before broader lifecycle rollout.

### Phase 2 direct-check inventory

The repository validation command `yarn check:entitlement-boundaries` enforces
the following classification. It runs as part of the production web build.

| Classification | Approved locations and purpose |
| --- | --- |
| Resolver boundary | `functions/packages/entitlements`, `src/utils/subscriptionUtils.ts`, `functions/subscriptionEntitlements.ts`, and the Firestore rule mirror define capabilities, limits, compatibility behavior, and default-deny handling. |
| Billing and pricing | Stripe Functions, the admin billing portal, account deletion billing cleanup, registration, Paywall, User Profile, billing banners, and public pricing compare or display plan identity because the plan is the billing or packaging subject. |
| Presentation and persona | Account snapshots, primary navigation, homeowner vocabulary, setup, device, and tab surfaces use the resolved plan only to select labels or layout. These checks do not authorize a feature. |
| Analytics | Plan identity may remain an event and reporting dimension; effective-access reporting remains separate. No analytics event grants access. |
| Migration compatibility | Authentication and user/family subscription reconciliation may compare legacy plan records while those mirrors remain supported. |
| Prohibited feature logic | No unexplained runtime feature allowlist remains. Web, intelligence, email, push, invite, report, reminder, property-group, and task-completion gates use shared capability or limit helpers. |

Functions emit structured warnings for unknown values that default safely and
support an opt-in `ENTITLEMENT_COMPARE_MODE=true` metric stream comparing stored
and resolved plan identity without changing the authorization result.

Current clients send stable plan and billing-cycle IDs to Checkout. The server
selects the configured Stripe price. A measured older-client path accepts a
price-only request only when the price matches the server-owned catalog, logs
its use, and is scheduled for removal in release `2.10.0`; arbitrary client
price IDs are never authoritative.

## Executive recommendation

Do not add another plan and trial by extending the current collections of plan
ID checks and legacy `subscription.status === 'trial'` branches.

First introduce one account-level entitlement resolver that separates:

```text
billing plan
    + internal product grants
    + account role and relationship
    = effective capabilities and resource limits
```

Then add Multi-Homeowner as a composed Homeowner+ plan and add the 30-day trial
as a temporary Homeowner+ grant over an active Free base plan.

This foundation is the smallest clean architecture that prevents trial expiry
from expiring the Free account, keeps Stripe state truthful, and gives task,
email, Functions, and security-rule behavior one contract to follow.

## Current repository architecture

### Current plan catalog

The repository has four core subscription plans:

| ID | Public name | Audience | Properties | Monthly price |
| --- | --- | --- | ---: | ---: |
| `homeowner` | Free | Homeowner | 1 | $0 |
| `homeowner_plus` | Homeowner+ | Homeowner | 1 | $3.99 |
| `property` | Property | Business | 7 | $8.99 |
| `portfolio` | Portfolio | Business | 15 | $23.99 |

Primary plan sources and consumers include:

* `src/config/publicPlanFacts.json`
* `src/constants/subscriptions.ts`
* `src/utils/subscriptionUtils.ts`
* `functions/subscriptionEntitlements.ts`
* `functions/stripeFunctions.ts`
* `functions/adminPortal.ts`
* `firestore.rules`
* registration, paywall, settings, and homepage pricing components
* `scripts/syncPublicPricing.cjs`
* `scripts/validatePublicPricing.cjs`

Public plan facts are shared between application pricing and generated static
pricing, but capability allowlists, paid-plan sets, Stripe mappings, and security
rules are still repeated across client and server boundaries.

### Current Free and paid signup behavior

`src/services/authService.ts` creates an active Free subscription for an
intentional Free signup. A paid-plan signup is also initialized with Free as the
current entitlement plus a `pendingCheckoutPlan` until Stripe confirms payment.

That distinction is important: the future trial cannot be issued merely because
the stored plan temporarily says `homeowner`. Eligibility must use the signup
intent and account type.

Invited team and resident accounts use non-billable placeholder plans and must
not receive an owner trial.

### Current trial behavior

The current model includes:

* `TRIAL_DURATION_DAYS = 14`, labelled as legacy
* subscription statuses including `trial` and `expired`
* `trialEndsAt` on subscription records
* client and Functions helpers that treat an active trial as the subscription's
  current plan entitlement
* protected routes that can send an expired subscription to the paywall
* a Stripe `createTrialSubscription` callable whose default is 30 days

The Stripe callable creates or reuses a Stripe customer and creates a Stripe
subscription with `trial_period_days`. It is not appropriate for a no-card Free
product trial.

The current status model also cannot express "active Free plan plus temporary
Homeowner+ access." Allowing its trial status to expire would affect the entire
subscription and conflict with the required permanent Free fallback.

### Current recurring-task behavior

Recurring-task capability is currently checked in several places:

* task creation and update remove recurrence fields when the account is not
  entitled
* task and equipment interfaces hide or lock recurring controls
* task completion writes a maintenance event and calls
  `createNextRecurringTaskForCompletion`
* the recurrence workflow does not receive an explicit entitlement decision
  before attempting to construct the next occurrence

The desired expiration behavior needs a deterministic result:

```text
maintenance event written
next occurrence skipped because Homeowner+ ended
contextual upgrade message returned
```

It must not report task completion as failed, create an accidental non-recurring
replacement, or depend only on a hidden interface control.

### Current communication behavior

`functions/welcomeSignupEmail.ts` sends a general welcome email from a
`users/{userId}` creation trigger. It currently hard-codes a HashRouter dashboard
link.

The repository also has scheduled or testable systems for monthly property
summaries, property insights, seasonal guidance, task reminders, and team
reports. There is no Homeowner+ trial milestone scheduler or trial-specific
idempotency ledger. The existing welcome trigger would duplicate Day 0
communication unless it is deliberately integrated.

There is also no shared complimentary-access activation template, renewal-term
disclosure contract, or 30-day, 7-day, and 1-day reminder sequence for
promotional access that transitions automatically to paid billing.

### Current authorization behavior

Firestore rules calculate property and equipment limits from a duplicated plan
mapping. They recognize active subscriptions and the current legacy trial
status. Business plan allowlists are also repeated for team, resident, and
property-group access.

A fifth plan and a product grant therefore affect more than pricing cards. The
rules must recognize Multi-Homeowner for homeowner resources while continuing
to reject it for business capabilities.

## Confirmed Stripe configuration readiness

The following readiness information was verified on 2026-07-23 without reading
or printing any secret or price-ID values:

| Scope | Observed names | Readiness |
| --- | --- | --- |
| Project `.env` | `REACT_APP_STRIPE_MULTIPLE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID`, `REACT_APP_STRIPE_MULTIPLE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID` | Present locally; no current client mapping consumes them |
| Functions `.env` | `STRIPE_MULTIPLE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID`, `STRIPE_MULTIPLE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID` | Present locally; no current Functions parameter or resolver consumes them |
| GitHub Actions secrets | `PROD_STRIPE_MULTIPLE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID`, `PROD_STRIPE_MULTIPLE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID` | Secret names verified; the deployment workflow does not currently pass or validate them |
| `.env.example` | No Multi-Homeowner keys | Must be documented after canonical names are approved |
| Stripe | Products and prices reported as created by the owner | Price values and product metadata were not independently queried |
| Firebase runtime | Reported as configured by the owner | Deployed parameter values cannot be established from repository files alone |

Configuration exists, but it is not wired into the application. Current client,
Functions, webhook, admin, price-to-plan, plan-to-price, and deployment mappings
recognize only Homeowner+, Property, and Portfolio.

The observed `MULTIPLE_HOMEOWNER_PLUS` name also differs from the proposed
`multi_homeowner` internal plan ID. Because no production code consumes the new
keys yet, the preferred approach is to choose one canonical vocabulary before
implementation instead of adding permanent aliases.

Recommended canonical naming:

```text
plan ID: multi_homeowner
server monthly key: STRIPE_MULTI_HOMEOWNER_MONTHLY_PRICE_ID
server annual key: STRIPE_MULTI_HOMEOWNER_ANNUAL_PRICE_ID
GitHub names: PROD_STRIPE_MULTI_HOMEOWNER_MONTHLY_PRICE_ID
              PROD_STRIPE_MULTI_HOMEOWNER_ANNUAL_PRICE_ID
```

The customer-facing plan name remains a separate approval decision.

Stripe price IDs should become server-owned configuration. Checkout clients
should submit the stable plan ID and billing cycle; a trusted Functions mapping
should select the allowed Stripe price. This removes duplicated client price-ID
configuration and prevents a caller from making an arbitrary price ID the
source of truth. Public display prices continue to come from shared public plan
facts and are validated separately from Stripe configuration.

## Gaps and risks

1. **Plan definitions are only partially centralized.** Public facts are shared,
   but plan identity and capabilities are repeated in the client, Functions,
   admin tools, Stripe mapping, and Firestore rules.
2. **Legacy trial state conflates billing and product access.** Reusing it would
   cause paywall loops, incorrect delivery gates, and ambiguous Stripe sync.
3. **User and family-account records can diverge.** Copying a trial to every
   member would add another source of truth.
4. **Recurrence stopping is not an explicit workflow outcome.** Completion must
   succeed while future automation stops predictably.
5. **Trial issuance must be trusted and one-time.** Client timestamps or flags
   would allow restarts.
6. **Lifecycle delivery needs durable idempotency.** One last-email timestamp is
   not sufficient for four independently auditable milestones.
7. **Automatic setup cannot mean silent writes.** The homeowner must confirm a
   proposed maintenance plan before recurring tasks are created.
8. **Email links would otherwise require two migrations.** New templates must
   not copy the current `/#/` route pattern.
9. **Prepared Stripe keys are not deployment wiring.** The new local and GitHub
   names are not yet declared, passed, validated, or resolved by current code.
10. **Checkout has two price authorities.** The server prefers its configured
    plan mapping but can fall back to a client-supplied price ID. The target flow
    should make the server plan-and-cycle mapping authoritative and reject an
    unknown plan instead of trusting an arbitrary fallback price.
11. **The repository has no generic multi-grant account model.** Trial,
    lifetime, beta, partner, and support access need one canonical account
    collection with deterministic merge and transfer rules.
12. **Complimentary access does not define a billing-transition contract.**
    Internal intent must not be mistaken for Stripe authority to charge.
13. **Email alone cannot provide durable billing transparency.** Customers need
    an authenticated access surface with renewal facts and direct opt-out or
    management controls.
14. **Admin access mutations need high-value governance.** Grant permissions,
    allowlists, previews, elevated confirmation, immutable audit events, and
    separation from operational logs are not present today.
15. **Synthetic Stripe access needs a controlled migration.** Grant parity,
    observation, rollback, and confirmation that no future invoice remains must
    precede completion.

## Recommended target architecture

### Account-level entitlement model

Use the owning family account as the canonical scope for product grants. The
canonical shape is conceptually:

```text
familyAccounts/{accountId}
  subscription
    plan: homeowner
    status: active
    ...Stripe billing fields
  effectiveEntitlementProjection
    resolverVersion
    bundleVersions
    calculatedAt
    nextTransitionAt?

familyAccounts/{accountId}/entitlementGrants/{grantId}
  grantId
  programId
  grantKind: temporary | permanent
  lifecycleState: scheduled | active | expired | revoked | converted
  bundleId / bundleVersion
  capabilityOverrides / limitOverrides
  startsAt
  endsAt?
  source
  issuedAt / issuedBy
  idempotencyKey
  auditReason?
  beneficiaryUserId?
  billingTransition?
  convertedAt? / revokedAt?
```

An account may hold multiple simultaneous grants. Temporary and permanent
grants use the same contract; permanent grants do not receive an artificial end
date. Active access is derived from timestamps and terminal fields. Access must
not require a scheduled job to write `expired` at an exact moment.

Do not copy the complete grant to every account member. Account members should
resolve the owning account entitlement. The effective projection is derived,
server-written, versioned, and not an independent authority. If another
temporary compatibility mirror is unavoidable during migration, it must have a
removal phase and must never become independently writable.

Grants remain with the owning account through ordinary owner or family-member
changes. They are non-transferable by default. Account merges, splits, or
person-specific program changes require an audited regrant or migration policy.

### Shared entitlement contract

Introduce a pure resolver with an explicit clock:

```text
resolveAccountEntitlements(subscription, grants, now)
  -> basePlan
  -> effectivePlan
  -> capabilities
  -> resourceLimits
  -> activeTrial metadata
```

Required rules:

* a confirmed paid plan supplies the paid base bundle
* pending checkout never grants paid access
* multiple active grants are additive according to versioned merge rules
* booleans resolve true when any active input grants them
* limits use the greatest approved active value unless explicitly defined
  otherwise
* active Homeowner+ trial grants Homeowner+ capabilities over Free
* an expired grant falls back to Free without expiring the account
* scheduled, revoked, converted, and unknown grants do not contribute access
* unrelated partner, beta, lifetime, and support grants are not silently
  suppressed by a paid plan
* invited users resolve the owning account where their role permits
* Multi-Homeowner is a paid homeowner base plan with five properties
* business capabilities require Property or Portfolio, never Multi-Homeowner

Client and Functions code should consume the same shared TypeScript contract.
Firestore rules cannot import that contract, so focused emulator tests must
prove that the rule mirror has the same limits and capability boundaries.

### Complimentary-to-paid transition model

Each promotional program uses one transition mode:

```text
none
checkout_required
automatic
```

Internal data may describe the intended target plan, billing cycle, currency,
recurring display amount, first-charge time, payment-method status, disclosure
version, terms version, consent evidence, and relevant Stripe references.

Stripe remains the sole authority for whether a billing relationship exists and
whether a charge can occur. An `automatic` transition is valid only after a
trusted server operation verifies the Stripe subscription or schedule, payment
method state, and customer consent. A grant record, admin form field, or
scheduler must never create a charge on its own.

Promo-code Checkout remains valid when a user intentionally establishes a
Stripe subscription and future billing relationship. Cancelling an automatic
continuation updates Stripe first and then refreshes Maintley's transition view.
Failure, additional-authentication, and missing-payment-method outcomes never
grant paid access until Stripe confirms the paid subscription.

### Customer access and billing surface

Add one authenticated account surface that combines the resolved grant view and
trusted Stripe billing summary. It must show:

* complimentary program and end date
* whether a payment method exists for the transition
* whether access ends, requires Checkout, or continues automatically
* first-charge date
* recurring price, currency, and billing interval
* direct manage, cancel, or opt-out action

The surface must work on desktop, mobile web, and Android. Opt-out confirmation
must state whether complimentary access continues through its original end
date. Email links should lead to this surface through the shared application
link builder.

### Composed Multi-Homeowner plan

Define Multi-Homeowner from Homeowner+ capabilities with explicit overrides:

```text
inherits capabilities: Homeowner+
max properties: 5
audience: homeowner
business teams: false
resident workflows: false
property groups: true
organization capabilities: false
```

Avoid copying the Property plan and removing flags. That would couple a
homeowner product to future business changes.

### Trusted trial issuance

Issue the trial from a trusted, idempotent account-bootstrap operation after the
owner account and intentional Free signup are confirmed.

The operation must verify that this is an owning homeowner account, that Free
was intentionally selected under the approved eligibility rule, that no prior
trial exists, and that timestamps are server-generated. It should create a
unique `grantId` used by lifecycle delivery keys.

### Recurring-task expiration contract

Refactor recurrence generation to return a reasoned outcome:

```text
created
not_recurring
not_entitled
invalid_recurrence
failed
```

On completion after trial expiry, write the maintenance event, evaluate the
current account capability, skip the next occurrence with `not_entitled`, finish
the existing completion lifecycle, and return a non-error result for contextual
upgrade messaging.

Creation and editing of recurring schedules must use the same capability check.
Firestore rules or a trusted write boundary must prevent recurrence metadata
from bypassing the client gate.

### Lifecycle delivery model

Use one idempotency record per access grant, program, template version, and
milestone, for example:

```text
accessLifecycleDeliveries/{grantId_activation}
accessLifecycleDeliveries/{grantId_progress_day7}
accessLifecycleDeliveries/{grantId_ending_day21}
accessLifecycleDeliveries/{grantId_expired_day30}
accessLifecycleDeliveries/{grantId_first_charge_day7}
accessLifecycleDeliveries/{grantId_first_charge_day1}
```

Each record should capture the program and template versions, milestone,
eligibility result, attempt state, sent timestamp, provider message ID when
available, and terminal skip reason. Do not store email content snapshots
containing unnecessary personal data.

Day 0 should be integrated with the existing welcome trigger so an eligible
account receives one combined welcome/trial message.

For a 30-day complimentary program, activation also satisfies the 30-day
first-charge notice. The dispatcher must not send a duplicate 30-day reminder
on activation day. Eligibility instants use UTC; customer content renders an
unambiguous date in the configured account time zone. Tests cover daylight-
saving and time-zone boundaries.

Admin-triggered email requests create high-value admin audit entries. Provider
attempts, retries, delivery responses, and bounce details remain operational
events linked by request and delivery IDs.

## Data migration and backwards compatibility

The entitlement foundation should not require a destructive subscription
rewrite.

* Existing accounts continue to derive their base preset from the current
  subscription plan and status during the parity migration.
* Absence of entitlement-grant records means no internal grants; it must not
  mean no base-plan access.
* The family account becomes canonical for grants and effective account access.
  Existing user/family subscription divergence must be audited and reconciled
  before removing compatibility reads.
* Existing plans receive an explicit default bundle version in the resolver.
  Persisted version backfill is optional unless grandfathering requires it.
* New grant records and delivery records are additive, server-authored, and
  idempotent. Indexes deploy before any query depends on them.
* Multi-Homeowner does not automatically reclassify Property subscribers.
  Movement between those plans follows explicit upgrade/downgrade rules.
* Existing owner or family-member changes do not transfer a grant to another
  account. Account merges, splits, and person-specific program changes require
  an audited regrant or migration decision.
* The Homeowner+ product trial is not retroactively granted unless the launch
  cohort decision explicitly authorizes an existing-Free backfill.
* Migration audits run in report-only mode first and record counts and record IDs
  needed for repair without printing billing secrets or unnecessary user data.
* Current web and supported Android clients must continue to function while the
  backend is additive. Compatibility adapters require an owner and removal gate.

No migration may delete properties, tasks, documents, equipment, maintenance
history, subscription records, or audit history.

Synthetic Stripe access is migrated manually, one account at a time. No bulk
mutation is required for the current account population. Migration priority is:

1. internal founder and development accounts
2. existing lifetime complimentary accounts
3. remaining synthetic subscriptions as needed

Each account uses this sequence:

1. Inventory in report-only mode.
2. Classify genuine discounted billing separately from synthetic promotional or
   lifetime subscriptions.
3. Require review for ambiguous records.
4. Create an idempotent equivalent internal grant.
5. Verify effective capability and limit parity.
6. Observe the account without changing Stripe.
7. End the synthetic Stripe subscription only after parity is confirmed.
8. Confirm that no future invoice, renewal, or subscription schedule remains.
9. Retain repair and rollback tooling linked to immutable migration audit events.

## Phased implementation plan

Centralization comes first, but it should be a parity-driven migration rather
than a long-lived rewrite branch. The implementation dependency is:

```text
Phase 0: decisions and canonical configuration
  -> Phase 1: entitlement types, presets, grants, and resolver
  -> Phase 2: migrate existing gates and prove parity
       -> Phase 3: Multi-Homeowner plan
       -> Phase 4: Homeowner+ trial grant
            -> Phase 5: premium onboarding
            -> Phase 6: expiration and conversion
            -> Phase 7: lifecycle communication
            -> Phase 8: access codes and downgrade-safe property access
  -> Phase 9: staged release, observation, and cleanup
```

Phases 3 and 4 may be developed independently after Phase 2 passes, but they
must keep separate launch flags and validation. Plan names remain valid in
billing, pricing, marketing, and plan analytics; centralization targets feature
behavior, quantitative limits, delivery gates, and authorization.

### Phase 0 - Finalize product configuration

* Finalize the commercial and trial-policy configuration still required by
  proposed ADRs 0029 and 0030. Treat accepted ADRs 0031 and 0032 as the
  architectural foundation.
* Confirm the public plan name and stable internal plan ID.
* Confirm monthly and annual display prices, storage limits, and included
  cross-property views.
* Confirm the Stripe products and prices have the intended currency, recurring
  interval, tax behavior, and active state.
* Choose canonical environment and GitHub secret names before code consumes the
  prepared `MULTIPLE_HOMEOWNER_PLUS` keys; prefer renaming now over permanent
  aliases.
* Confirm trial eligibility, start boundary, paid conversion timing, support
  regrant policy, and launch cohort.
* Classify each existing 100% Stripe subscription as genuine discounted billing
  or synthetic promotional access before migrating that account.
* Configure reporting dimensions that keep billing state separate from paying,
  complimentary, lifetime, partner, beta, and support-granted effective access.
* Configure each program for no billing transition, required Checkout, or
  Stripe-backed automatic continuation. Automatic continuation is available
  only after the customer intentionally establishes billing, supplies required
  payment information, and gives versioned renewal consent.
* Confirm grant ownership and non-transferability policy for account owner
  changes, merges, splits, and person-specific programs.
* Confirm the canonical account time zone and customer-facing date policy.
* Complete legal and policy review for renewal disclosure, consent evidence,
  cancellation and opt-out presentation, promotional terms, communication
  classification, reminder timing, jurisdictional requirements, and retention.
* Define independent launch flags and rollback owners.
* Configure complimentary access-code programs, including bundle, duration,
  redemption expiration, eligibility, total and per-account limits, transition
  mode, and post-expiration fallback.

**Gate:** decisions are recorded, the canonical names are present in every
required environment, and no secret or price value is committed to Git.

### Phase 1 - Define the centralized entitlement foundation

* Define stable typed capability IDs, quantitative limits, plan preset versions,
  generic temporary and permanent grants, and the effective-entitlement result.
* Establish the owning family account as the canonical entitlement scope.
* Implement the account grant subcollection with stable grant and program IDs,
  lifecycle states, bundle and capability overrides, timestamps, source,
  idempotency, beneficiary, and audit metadata.
* Define grant ownership, multiple-grant merge precedence, paid-base behavior,
  default-deny behavior, and an explicit clock for expiration.
* Define the `none`, `checkout_required`, and `automatic` billing-transition
  contract while keeping Stripe authoritative for charge eligibility.
* Create one pure resolver contract usable by the web application and Functions.
* Model existing Free, Homeowner+, Property, and Portfolio bundles without
  enabling Multi-Homeowner or product trials.
* Keep roles, property relationships, and assignments outside the product
  entitlement bundle and combine them only at authorization boundaries.
* Define immutable high-value admin audit events, searchable indexes,
  before/after state, and request-ID idempotency separately from system logs.
* Add feature flags defaulted off and deterministic resolver fixtures.

**Gate:** resolver fixtures reproduce every existing plan capability and limit,
including pending checkout, Stripe trial, cancellation, expired legacy access,
team, resident, and family-member cases, without changing production behavior;
multi-grant merge, ownership, permanent-grant, transition-mode, unknown-value,
audit-idempotency, and audit-versus-system-log fixtures pass before callers
migrate.

### Phase 2 - Migrate existing behavior to the resolver

* Inventory every direct plan-name check and classify it as billing,
  presentation, analytics, migration compatibility, or prohibited feature logic.
* Move client feature gates and numeric limits to capability-based helpers.
* Move Functions, email, push, admin, and support feature gates to the shared
  resolver contract.
* Make the server plan-and-billing-cycle catalog authoritative for Stripe price
  selection and stop treating a client price ID as the normal authority.
* Preserve only a measured, time-bounded checkout compatibility path for older
  supported Android clients, with an explicit removal release.
* Update Firestore and Storage rule mirrors and add emulator parity tests for
  existing plans, roles, relationships, and limits.
* Add regression fixtures comparing old and new results for real subscription
  states before switching callers.
* Add a repository validation rule that rejects new feature-level plan checks
  outside the approved resolver, billing, pricing, analytics, and migration
  boundaries.
* Remove superseded duplicate helpers only after all callers migrate.

**Gate:** all existing customer behavior remains unchanged, client and server
resolve the same capabilities, rules match the resolver, and the direct-check
inventory has no unexplained feature gates.

### Phase 3 - Add Multi-Homeowner behind a disabled flag

* Add a versioned Multi-Homeowner preset composed from Homeowner+ plus a
  five-property limit, Property Groups, and approved cross-property views.
* Prove that team, resident, business collaboration, advanced permission, and
  Organization entitlements remain absent.
* Add shared public facts, display prices, upgrade copy, and plan comparisons.
* Add the approved canonical monthly and annual server parameter names to
  Functions, admin tooling, deployment environment generation, preflight
  validation, and `.env.example`.
* Add server-owned plan-to-price and price-to-plan mappings for checkout,
  webhooks, subscription repair, coupons, and admin support.
* Make checkout submit the plan ID and billing cycle without requiring a client
  price ID for the new flow.
* Add the plan to registration, paywall, settings, homepage, and static pricing.
* Update pricing generation and SEO validation for five plans.
* Update Firestore property limits and keep team, resident, and Organization
  capability allowlists restricted to Property and Portfolio.
* Add upgrade, downgrade, cancellation, over-limit, and failed-payment behavior
  without deleting or hiding property memory.
* Update current product and billing documentation only when behavior ships.

**Gate:** configuration preflight passes without printing values; Stripe test
checkout and webhooks map both billing cycles to `multi_homeowner`; the plan can
purchase, renew, cancel, restore, group, and enforce exactly five properties
without receiving team, resident, or Organization access.

### Phase 4 - Issue the Homeowner+ product trial grant

* Apply the canonical account grant schema, security rules, indexes, and typed
  serialization contract to the Homeowner+ trial program.
* Issue the grant from a trusted, idempotent owner-account bootstrap operation
  using server timestamps and one stable grant ID.
* Apply the approved policy to intentional Free signup, cancelled paid checkout,
  existing Free cohorts, invited accounts, and support regrants.
* Keep the base subscription active on Free and keep the grant outside Stripe
  subscription state and pending checkout state.
* Make the centralized resolver apply Homeowner+ capabilities and limits only
  while the grant is active.
* Expose trial name, start/end date, days remaining, Free fallback, and paid
  conversion state through one account-level view model.
* Add admin visibility and grant actions protected by a grant-specific Maintley
  permission; general admin access alone is insufficient. Maintley's
  server-managed `maintley_role: owner` is unrestricted and is the only actor
  permitted to grant access to the actor's own user or account. This never
  refers to a customer property owner.
* Restrict grant programs, bundles, limits, and durations to server-owned
  allowlists and prevent non-owner administrators from granting their own
  identities or accounts, including another user within the same account.
* Add a preview of resulting effective access and elevated confirmation for
  permanent, unusually broad, or extended grants.
* Require reason and request ID; make create, extend, revoke, convert, lifetime,
  program, billing-transition, email, migration, failure, and replay audit
  events immutable and append-only.
* Implement the canonical `AdminAuditEvent` contract from ADR 0032, including
  stable event and request IDs, actor and target identities, optional grant,
  program, and Stripe references, reason, timestamp, before/after state, and
  minimized metadata.
* Add a searchable human-readable admin timeline backed by the audit events,
  while keeping resolver and job execution details in operational logs.
* Add an admin entitlement-grant interface with explicit program, duration,
  access bundle, audit reason, and descriptive renewal-transition fields that
  cannot independently create Stripe billing.
* Prevent concurrent bootstrap retries from creating duplicate grants.

**Gate:** every eligible account receives exactly one correctly dated grant;
paid-intent, invited, and ineligible accounts follow the approved policy; no
Stripe customer or subscription is created solely for the product trial; admin
authorization, self-grant denial, allowlists, previews, elevated confirmations,
idempotency, immutable auditing, and timeline search pass security tests.

### Phase 5 - Deliver premium onboarding and maintenance-plan activation

* Keep Property Setup Assistant available to Free accounts and expose the
  Homeowner+ automation path through the active trial entitlement.
* Generate a proposed maintenance plan only from confirmed property, equipment,
  and homeowner inputs.
* Show proposed schedules, due dates, and recurrence clearly; allow selection,
  editing, or dismissal before saving.
* Require one explicit homeowner confirmation before creating recurring tasks.
* Create accepted schedules through the trusted entitlement boundary with an
  idempotency key so retries cannot duplicate tasks.
* Preserve onboarding progress across refresh, mobile navigation, checkout, and
  interrupted sessions without restarting the trial.
* Add homeowner-friendly trial context and upgrade education without blocking
  the core Free setup path.
* Instrument proposal viewed, confirmed, dismissed, and task-creation outcomes
  without collecting unnecessary property details.

**Gate:** Free setup still works without a trial; trial users can review and
confirm a useful plan once; retries and navigation do not duplicate tasks; and
Maintley never writes suggested schedules without confirmation.

### Phase 6 - Enforce expiration, preservation, and conversion

* Derive active access from the grant end timestamp and current clock; do not
  depend on an expiration job updating state on time.
* Add an explicit recurrence-generation outcome including `not_entitled`.
* Allow an existing recurring occurrence to complete and write its maintenance
  event while suppressing only the next occurrence after expiration.
* Prevent new recurring schedules, recurrence edits, premium delivery, and other
  premium server operations through the resolver and security boundary.
* Keep properties, equipment, documents, maintenance history, and already-created
  tasks visible and usable within Free behavior.
* For counts or storage above Free limits, preserve read/download/delete access
  and prevent only additional over-limit creation until the account upgrades or
  returns within the limit.
* Keep every owned property visible in the property list and selector after a
  multi-property grant or subscription ends.
* Let the customer choose one active Free property and represent additional
  properties as preserved and restricted rather than absent or deleted.
* Define a deterministic server-owned fallback when no active Free property was
  selected before expiration, without changing property ownership.
* Preserve essential export, transfer, deletion, and active-property-selection
  actions for restricted properties.
* Refresh entitlements during active sessions and before premium writes so an
  old browser or Android client cannot retain stale trial access.
* Apply the approved paid-conversion timing, suppress the temporary grant without
  losing data, and unlock the confirmed paid bundle immediately when applicable.
* Add the authenticated access and billing surface showing grant end date,
  Stripe-backed payment-method status, transition mode, first-charge date,
  recurring price and interval, and direct manage, cancel, or opt-out controls.
* Make opt-out change the authoritative Stripe subscription or schedule first,
  refresh Maintley's view, preserve the disclosed complimentary period, and
  write the customer-directed high-value audit event.
* Treat failed payment, missing payment method, or required authentication as a
  billing-recovery state; do not grant paid access until Stripe confirms it.
* Fall back to the otherwise entitled plan without data loss when conversion
  does not complete.
* Add contextual upgrade messaging after affected actions without presenting
  maintenance completion as failed.

**Gate:** an expired trial remains a usable Free account, preserves all existing
property memory, records maintenance completion exactly once, and cannot create
new premium automation through direct writes, stale clients, or background
jobs; automatic, Checkout-required, opt-out, failed-payment, and
authentication-required transition tests agree with Stripe and never grant
unconfirmed paid access.

### Phase 7 - Add lifecycle communication

* Add one shared application-link builder before adding templates; it emits the
  current HashRouter format and later changes centrally under ADR 0028.
* Merge Day 0 trial explanation into the existing welcome path after trusted
  grant issuance so eligible accounts receive one accurate message.
* Add factual Day 7 progress, Day 21 ending, and Day 30 expiration templates.
* Add complimentary in-app notices alongside key lifecycle emails where the
  configured milestone benefits from persistent account visibility.
* Add a Complimentary Access Activated template for non-trial promotional
  grants, including whether payment information was collected and whether paid
  billing follows the complimentary period.
* Add “Auto-renews after complimentary period” language to partner or program
  invitations only when the configured billing transition actually renews.
* Add 30-day, 7-day, and 1-day reminders before an automatic paid transition.
* Treat activation as the 30-day reminder for a 30-day complimentary program so
  the customer does not receive two messages on activation day.
* Add an admin-selectable email template for manually granted access that states
  the grant duration, included access, and whether any billing transition exists.
* Apply the approved operational, educational, or marketing classification and
  preference rules independently for each milestone.
* Add a generic access lifecycle dispatcher with bounded catch-up windows,
  retries, and one durable idempotency record per grant, program, template
  version, and milestone.
* Calculate eligibility in UTC, render dates in the configured account time
  zone, and test daylight-saving and time-zone boundaries.
* Suppress remaining trial messages after paid conversion, deletion, revocation,
  or terminal ineligibility.
* For expiring multi-property access, show the active Free property, affected
  preserved properties, the selection action, and the intentional Checkout path
  without implying that records will be deleted.
* Write a high-value admin audit event for an admin-triggered email request and
  keep provider attempts, retries, bounces, and delivery results in linked
  operational logs.
* Add preview/test functions that cannot write production delivery markers or
  send to unintended recipients.
* Record provider IDs, terminal skip reasons, and aggregate operational metrics
  without storing unnecessary email content or property details.
* Add alerting for scheduler failure, elevated send failure, or duplicate-key
  violations.

**Gate:** time-controlled tests prove every milestone sends at most once,
respects the approved preference rules, reports accurate plan and payment
boundaries, discloses automatic billing before it occurs, suppresses correctly,
does not duplicate activation and 30-day notices, handles time-zone boundaries,
separates audit decisions from delivery logs, and links to the correct current
route format.

### Phase 8 - Add complimentary access codes and downgrade-safe property access

* Model a complimentary access code as a server-validated credential for one
  approved grant program; do not model it as a Stripe coupon, subscription, or
  plan.
* Store only a secure verifier for redeemable codes and prevent plaintext codes
  from appearing in Firestore records, logs, analytics, or audit metadata.
* Add trusted transactional redemption with stable request IDs, per-account
  idempotency, total redemption limits, program expiration, account eligibility,
  abuse throttling, and explicit terminal outcomes.
* Issue the same canonical account grant used by administrative programs and
  resolve it through the shared entitlement resolver.
* Add a customer-facing redemption surface that previews the included bundle,
  duration, expiration behavior, and absence of automatic billing before
  confirmation.
* Add a downgrade-safe property selector that remains usable on Free, lists all
  owned properties, distinguishes the active Free property from preserved
  restricted properties, and provides the approved data-control actions.
* Add a pre-expiration active-property selection flow and deterministic fallback
  when the customer makes no selection.
* Route voluntary continuation through intentional Stripe Checkout. Suppress
  obsolete access-code lifecycle messages only after Stripe confirms paid
  access.
* Audit successful, failed, expired, exhausted, repeated, and ineligible
  redemption outcomes without recording the redeemable secret.
* Keep access-code redemption behind an independent server-controlled flag.

**Gate:** a Portfolio complimentary-access code cannot launch until a Free
account can discover every owned property, choose its active Free property, use
essential data-control actions on preserved restricted properties, and restore
eligible access without data loss; concurrent redemption tests issue at most one
grant and no path creates a Stripe billing relationship without Checkout.

### Phase 9 - Release, observe, and remove legacy paths

* Deploy additive Functions, indexes, and rules that remain compatible with the
  currently hosted client before deploying code that depends on them.
* Deploy the entitlement migration with all new-plan, trial, onboarding, and
  lifecycle flags disabled.
* Validate existing plans in production-like test accounts, including an Android
  build, before enabling any new product behavior.
* Enable Multi-Homeowner for internal accounts and complete monthly/annual test
  checkout, webhook, admin repair, cancellation, and downgrade exercises.
* Enable trial issuance, onboarding automation, expiration, and lifecycle email
  independently for internal accounts before any broader cohort.
* Enable complimentary access-code redemption only for internal programs after
  the Phase 8 downgrade and redemption gates pass; expand through staged code
  cohorts independently from trial issuance.
* Run the synthetic Stripe migration inventory in report-only mode, then migrate
  accounts manually in the approved order: internal founder and development
  accounts, lifetime complimentary accounts, and remaining synthetic accounts
  as needed.
* For each account, review ambiguity, create the equivalent grant idempotently,
  verify effective-access parity, and observe the grant before ending that
  account's synthetic Stripe subscription.
* After cutover, confirm Stripe has no future invoice, renewal, or schedule and
  retain audited repair and rollback tooling.
* Use staged cohort rollout with written stop thresholds for checkout failures,
  permission denials, duplicate tasks, duplicate messages, and support volume.
* Monitor signup completion, maintenance-plan confirmation, conversion,
  recurrence stops, delivery failures, entitlement mismatches, and rule denials.
* Keep kill switches independent so billing, trial issuance, onboarding, and
  email delivery can be paused without revoking existing access or deleting data.
* Remove client price-ID authority, duplicate plan helpers, and legacy trial
  adapters only after supported web and Android clients no longer require them.
* Update current documentation, archive superseded descriptions, and record the
  final configuration and operational ownership.

**Gate:** rollback flags and data-preserving downgrade behavior are proven,
monitoring is live, no unexplained entitlement parity failures remain, and every
legacy compatibility path has an evidence-based removal decision; every
manually completed synthetic migration has start and completion audit events,
verified access parity, an observation result, rollback status, and confirmation
that no future Stripe invoice remains scheduled.

## Expected implementation surface by subsystem

This is a routing inventory, not permission to change every listed file.
Implementation should confirm each path and reuse existing patterns.

### Entitlement core

* `src/constants/subscriptions.ts`
* `src/utils/subscriptionUtils.ts`
* `functions/subscriptionEntitlements.ts`
* a shared pure entitlement catalog/resolver boundary consumable by both builds
* parity tests and a direct-plan-check validation script

The current client and Functions helpers should converge on the shared contract,
not remain parallel implementations.

### Account data and authorization

* family-account initialization and loading services
* `familyAccounts/{accountId}/entitlementGrants/{grantId}`
* derived effective-entitlement projection and indexes
* `src/services/authService.ts`
* `src/services/userProfileService.ts`
* `functions/ensureFamilyAccount.ts`
* `firestore.rules`, `storage.rules`, indexes, and emulator tests
* role, relationship, and assignment resolvers from ADRs 0022 and 0027

### Billing and configuration

* `src/config/publicPlanFacts.json`
* `src/constants/stripe.ts` and `src/services/stripeService.ts`
* `functions/stripeFunctions.ts` and `functions/adminPortal.ts`
* transition-mode, consent, payment-method summary, first-charge, opt-out, and
  failed-conversion services
* secure access-code program configuration, verifier storage, redemption
  transaction, rate limiting, and outcome audit services
* checkout, webhook, price-to-plan, plan-to-price, coupon, schedule, and repair
  tests
* `.env.example` and Firebase/GitHub deployment environment generation
* public-pricing generation and validation scripts

Client display prices and server Stripe price IDs remain separate concerns. The
server owns Stripe price selection.

### Product experience

* registration and paid-checkout recovery
* authenticated paywall, settings, and admin support views
* authenticated complimentary-access, access-code redemption, and billing
  control surfaces
* downgrade-safe property selector and preserved restricted-property state
* homepage and static pricing
* Property Setup Assistant and trial status messaging
* account and dashboard trial surfaces
* desktop, tablet, mobile web, and Capacitor behavior

### Maintenance lifecycle

* `src/Redux/API/taskSlice.tsx`
* `src/tasks/taskLifecycle.ts`
* `src/tasks/taskLifecycleWorkflow.ts`
* task creation/edit controls and equipment-linked recurrence controls
* maintenance-event and recurrence outcome tests

### Communication and observability

* `functions/welcomeSignupEmail.ts`
* a generic access lifecycle dispatcher, templates, and idempotency records
* email preference enforcement and the shared route-link builder
* `functions/index.ts`, provider integration, logs, alerts, and admin visibility
* analytics events that avoid property-specific personal information

### Admin governance and audit

* grant-specific Maintley permissions and server-owned program allowlists
* grant preview, elevated confirmation, self-grant denial, and request
  idempotency
* immutable append-only admin audit events and searchable indexes
* human-readable user/account access timeline
* separate linked operational logs for resolver, webhook, migration, and
  delivery execution

### Documentation and operations

* plan matrix, billing, email, data model, Firebase structure, permissions,
  testing, deployment, and script documentation
* support runbooks for entitlement repair, trial review, failed delivery, and
  rollback
* archived legacy trial documentation after removal

## Validation matrix

### Entitlement foundation parity

* Existing Free, Homeowner+, Property, and Portfolio capabilities and limits are
  identical before and after resolver migration.
* Unknown plans and unknown capabilities default deny without changing Free
  fallback rules for recognized expired states.
* Pending checkout, Stripe trials, temporary and permanent grants,
  cancellations, grandfathered bundle versions, and support grants resolve
  deterministically.
* Multiple simultaneous grants follow the approved boolean, quantitative,
  terminal-state, conversion, and default-deny merge rules.
* Scheduled, expired, revoked, converted, unknown, and non-transferable grants
  do not accidentally contribute or move access.
* Roles, property relationships, and assignments restrict an entitled feature
  without becoming entitlements themselves.
* Client, Functions, email/push delivery, admin tools, Firestore rules, and
  Storage rules agree for the same account fixture and explicit clock.
* Repository validation finds no unexplained feature-level plan-name checks.

### Configuration and price authority

* Canonical Multi-Homeowner keys exist in approved local, Firebase, and GitHub
  scopes, and deprecated pre-implementation names are removed or documented as
  temporary aliases with a removal release.
* Deployment preflight fails on a missing required key without printing values.
* `.env.example` documents names and purpose without containing real IDs.
* Server mappings resolve monthly and annual prices in both directions.
* Checkout accepts the stable plan ID and billing cycle and rejects an unknown
  plan or mismatched arbitrary price ID.
* Stripe test checkout, webhook, coupon scope, admin repair, and cancellation all
  preserve the same internal plan ID.

### Plan and billing

* All five core plans resolve correctly.
* Monthly and annual Multi-Homeowner checkout use the correct Stripe prices.
* Pending checkout never grants paid access.
* Webhooks and admin repair preserve the new plan ID.
* Public and authenticated pricing display identical plan facts.

### Complimentary-to-paid transition and customer control

* `none`, `checkout_required`, and `automatic` resolve distinctly.
* Grant or admin metadata alone cannot create a Stripe charge or paid access.
* Automatic continuation requires trusted Stripe objects, payment-method state,
  and versioned consent evidence.
* Promo-code Checkout remains supported for intentional future billing.
* The account surface shows the correct end date, payment-method status,
  transition, first charge, recurring price, and interval on web and Android.
* Manage, cancel, and opt-out update Stripe first, preserve disclosed
  complimentary access, refresh the view, and create the correct audit event.
* Failed payment, required authentication, and missing payment method never
  produce unconfirmed paid access or data loss.

### Complimentary access-code redemption and downgrade preservation

* Access codes issue only the approved program's canonical temporary grant and
  never create Stripe billing objects.
* Plaintext codes do not appear in stored records, logs, analytics, or audit
  entries.
* Concurrent, repeated, expired, exhausted, rate-limited, and ineligible
  attempts cannot partially issue, duplicate, or extend access.
* Program-wide and per-account redemption limits remain correct under
  concurrent requests.
* A Portfolio grant exposes the approved capabilities and limits only for its
  authoritative active period.
* Expiration leaves every owned property visible, preserves its records, and
  leaves exactly one customer-selected or deterministically selected active
  Free property.
* Preserved restricted properties retain export, download, transfer, deletion,
  and active-property-selection controls without permitting paid-only writes.
* Renewed paid or complimentary eligibility restores preserved properties
  without migration, duplication, or ownership changes.
* The Portfolio access-code launch flag cannot enable while the downgrade-safe
  property-selection gate is incomplete.

### Admin grant governance and auditing

* General admin access without the grant permission cannot mutate grants.
* Self-grants, unapproved programs, excessive durations, and arbitrary
  capability editing are rejected server-side.
* Preview and elevated confirmation are required for the configured high-risk
  actions.
* Create, extend, revoke, convert, lifetime, program, transition, opt-out,
  access-email, migration, failure, and replay events are immutable,
  append-only, server-written, and idempotent by request ID.
* Audit search by user, account, grant, program, and administrator returns a
  human-readable before/after timeline.
* Resolver calls and delivery attempts remain in linked system logs rather than
  flooding the admin audit trail.

### Resource and permission enforcement

* Multi-Homeowner permits properties one through five and rejects property six.
* It receives Homeowner+ equipment capability and the approved storage limits.
* It can organize Property Groups but cannot create teams, resident
  relationships, business collaboration, or Organization authority.
* Downgrades preserve records and prevent only new over-limit creation.
* Firestore emulator tests match client and Functions entitlements.

### Trial eligibility and state

* Intentional new Free owner receives one 30-day grant.
* Repeated initialization returns the same grant rather than extending it.
* Team, resident, guest, and family-member accounts do not receive grants.
* Paid signup and cancelled checkout follow the approved policy.
* Paid conversion suppresses the temporary grant without losing records.
* Expiration falls back to active Free instead of an expired account.

### Maintenance behavior

* Trial users can review and confirm suggested recurring schedules.
* Confirmation retries do not duplicate tasks.
* An existing occurrence can be completed after expiry.
* Completion writes one maintenance event and no next task after expiry.
* The UI explains `not_entitled` without presenting completion as an error.
* Direct recurrence writes cannot bypass the account entitlement.

### Lifecycle communication

* Day 0 replaces, rather than duplicates, the existing welcome message.
* Day 7 metrics are factual and account-scoped.
* Day 21 and Day 30 state the correct end date and Free fallback.
* Complimentary-access activation states whether payment information exists and
  whether an automatic paid transition is configured.
* Auto-renewing complimentary programs send accurate 30-day, 7-day, and 1-day
  reminders before the first paid charge.
* Programs without an automatic paid transition never imply that a charge will
  occur.
* Manual-grant emails match the authoritative grant duration and access bundle.
* A 30-day program uses activation as its 30-day notice and does not send a
  duplicate message.
* Every milestone is idempotent under retries and overlapping scheduler runs.
* UTC eligibility and account-time-zone rendering remain correct across
  daylight-saving boundaries.
* Conversion, deletion, and ineligibility produce terminal skip outcomes.
* Links work under current HashRouter hosting and can migrate centrally under
  ADR 0028.

### Synthetic Stripe migration

* Report-only inventory separates genuine discounted billing from synthetic
  access and sends ambiguous records to review.
* Migrations run one account at a time in the approved founder/development,
  lifetime, then remaining-as-needed priority order; no bulk mutation is used.
* Equivalent grants are idempotent and match effective capabilities and limits
  before Stripe changes.
* Observation completes before synthetic subscriptions end.
* Completed migrations have immutable start/completion audit events, rollback
  status, and confirmation that no future Stripe invoice, renewal, or schedule
  remains.

### Regression

* Existing checkout recovery and onboarding tests continue to pass.
* Existing plan, rules, Functions, task lifecycle, email, and public pricing
  tests pass.
* Web and Functions builds pass.
* Android receives the same entitlement results through the packaged web app.

## Firebase and ADR 0028 interaction

This work can take priority over the hosting migration without requiring the
production host to move first.

It may require Firebase backend changes to Functions, Firestore records,
indexes, and security rules. Those changes should be backwards-compatible with
the currently hosted GitHub Pages client before any new web client depends on
them.

The safe release order for each backend-dependent slice is:

1. deploy additive backend/rule support that preserves old-client behavior
2. validate with emulator and test accounts
3. deploy the new client behavior
4. enable the feature flag for the intended cohort

No DNS or Firebase Hosting change is required for these product decisions.

The shared email-link builder is the intentional bridge to ADR 0028. It should
emit current HashRouter URLs now and switch in one place when BrowserRouter is
introduced. Lifecycle templates must not own routing syntax.

The release-foundation PR for ADR 0028 should remain separate. It freezes future
GitHub Pages publishing after merge and documents the later hosting cutover; it
does not need to absorb these product decisions.

## Rollback and operational controls

Use independent server-controlled flags for:

* centralized resolver compare/read mode during existing-plan migration
* Multi-Homeowner checkout and server price catalog activation
* Multi-Homeowner plan visibility and new purchases
* Homeowner+ trial issuance
* premium onboarding automation
* lifecycle email dispatch
* complimentary access-code redemption

Disabling a flag must stop new enrollment or delivery without deleting grants,
subscriptions, properties, tasks, documents, or history.

The resolver migration should support a pre-release comparison mode that records
only normalized mismatch categories and account IDs needed for investigation,
not subscription secrets or property content. A temporary return to legacy
resolution is permitted only before new plans or grants depend on capabilities
that the legacy resolver cannot represent. Once Multi-Homeowner or product
trials are enabled, rollback means disabling new enrollment while continuing to
resolve already-created subscriptions and grants correctly.

Rollback must not rewrite a paid Multi-Homeowner subscriber to another plan. If
new purchases are paused, existing subscribers continue through the entitlement
resolver while support handles transitions deliberately.

## Documentation changes when implementation ships

Update, rather than pre-emptively changing, current documentation:

* `project-docs/docs/Product/MAINTLEY_PLAN_FEATURE_MATRIX.md`
* `project-docs/docs/Operations/BILLING.md`
* `project-docs/docs/Operations/EMAIL_NOTIFICATIONS.md`
* `project-docs/docs/Architecture/DATA_MODEL.md`
* `project-docs/docs/Architecture/FIREBASE_STRUCTURE.md`
* `project-docs/docs/Architecture/PERMISSIONS.md`
* relevant development script and deployment documentation

## Remaining implementation configuration

These values do not reopen the accepted architecture in ADRs 0031 and 0032.
They must be recorded and validated before enabling the affected plan, trial,
program, or migration:

Multi-Homeowner naming, price, limits, and configuration vocabulary are resolved
in Phase 3. ADR 0030 resolves the initial trial policy: the trial begins after
the first committed property; abandoned paid checkout is ineligible; existing
Free users require a separate audited program; support regrants are deferred;
and conversion requires Checkout rather than an automatic charge.

The following later-phase configuration remains:

1. Per-message preference and consent handling within the approved operational,
   product-education, and marketing classifications.
2. Which key milestones receive in-app notices in the first release.
3. The rollout sequence for server-owned Stripe price selection and retirement
    of normal client price-ID authority.
4. The account-by-account classification of existing 100% Stripe subscriptions
    for the approved manual migration.
5. Detailed labels within the separate billing-state and effective-access
    reporting dimensions.
6. The transition mode and legally reviewed reminder schedule configured for
    each promotional program.


## Recommended configuration and implementation order

The entitlement and lifecycle architecture is approved. Phases 1 through 4
establish the entitlement vocabulary, existing-plan parity, Multi-Homeowner
bundle, and first-property Homeowner+ trial. Later phases finalize lifecycle
communications, program transition modes, billing-state reporting, and
per-message consent treatment. ADRs 0029 and 0030 are accepted; their guarded
behavior remains disabled until the applicable launch configuration and
deployed-environment validation gates are complete.

All four ADRs and this approved companion report belong together in the current
planning PR. For implementation, the preferred review boundaries are:

1. entitlement foundation and existing-plan parity
2. Multi-Homeowner billing and product bundle
3. trial grant, onboarding, expiration, and lifecycle communication

If implementation remains one PR, preserve these as independently testable
review boundaries.

## Branch and merge sequencing

This planning branch may remain independent from the release-foundation PR.
However, PR #74 has not yet changed `main`, so the GitHub Pages freeze is not
currently active there. Under the existing workflow, merging another branch to
`main` may still publish a new GitHub Pages build even when that branch contains
only documentation or unrelated product work.

If the Pages freeze remains a release constraint, use one of these safe orders:

1. review this planning work without merging it, then merge PR #74 before any
   later product implementation; or
2. merge PR #74 first, then merge approved ADR and implementation branches.

Do not begin or merge the product implementation under the assumption that an
open PR has already frozen deployment.
