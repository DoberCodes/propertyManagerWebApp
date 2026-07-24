# ADR 0032: Centralized Entitlement Architecture

Status: Accepted

Date: 2026-07-23

Related ADRs:

* `0022-account-access-resolver-contract.md`
* `0027-business-licensing-property-stewardship-and-record-attribution.md`
* `0029-homeowner-multi-property-plan.md`
* `0030-homeowner-plus-trial-experience.md`
* `0031-homeowner-plus-trial-lifecycle-and-communication.md`

Related report:

* `project-docs/reports/2026-07-23-homeowner-plans-and-trial-implementation-plan.md`

## Context

Maintley currently provides different subscription plans for homeowners and
businesses. The codebase already has a partial entitlement layer through
`SUBSCRIPTION_PLANS.permissions` and subscription utility functions, but plan
IDs and paid-plan allowlists are still repeated across client components,
Firebase Functions, admin tools, Stripe integration, email delivery, and
Firestore rules.

Upcoming initiatives include:

* the Multi-Homeowner plan
* the Homeowner+ trial experience
* expanded homeowner onboarding
* additional business capabilities
* future enterprise and Organization features
* Firebase architecture improvements

These initiatives reinforce the need to separate billing, product capability,
user authority, and property relationship into distinct concepts.

Without that separation, adding or modifying a plan requires application logic
to repeatedly check plan names. That makes pricing changes risky, makes trials
look like billing subscriptions, and allows client and backend behavior to
drift.

## Decision

Maintley will adopt a centralized entitlement model.

Stripe owns payments, checkout, paid subscription lifecycle, discounts on paid
subscriptions, renewals, and invoices. Maintley owns effective capabilities,
promotional trials, lifetime access, beta access, and audited administrative or
future program grants. Stripe remains the billing provider, not the application
authorization provider.

Subscription plans are centrally defined bundles of entitlements. Trials,
promotions, beta access, lifetime access, and support programs use temporary or
permanent internal grants layered over a base plan. Application behavior
evaluates resolved capabilities and limits rather than subscription plan names.

User roles remain responsible for who may perform an action within an account or
Organization. Property ownership, relationship, and assignment continue to
scope which property records that authority applies to.

The effective authorization rule is:

```text
allowed action
  = product entitlement exists
  AND role permits the action
  AND property ownership or relationship permits the action
  AND assignment or resource scope permits the action when required
```

Entitlements do not replace authentication, authorization, ownership, or
property relationships.

## Architectural principles

### Plans

Plans represent:

* billing
* pricing
* upgrade and downgrade paths
* customer-facing packaging
* marketing positioning

Examples include:

* Free
* Homeowner+
* Multi-Homeowner
* Property
* Portfolio

Plan identity is an input to the centralized resolver. Feature code, delivery
jobs, and authorization services should not directly branch on that identity.

A plan preset must be versionable so grandfathered packaging can be represented
without scattering historical plan names throughout application code.

### Entitlements

Entitlements define product capabilities and quantitative limits. They should
use stable capability identifiers independent of public plan names.

Initial capability families include:

**Property**

* property creation
* property limit
* property groups

**Maintenance**

* recurring schedules
* suggested maintenance generation
* reminder delivery
* advanced maintenance reports

**Intelligence and documents**

* expanded Maintley Intelligence
* Home / Property Review
* document understanding
* file-count and storage limits

**Multi-property**

* global dashboard
* cross-property tasks
* cross-property equipment views

The initial Multi-Homeowner release remains intentionally limited. Exact
first-release views are product configuration, and additional cross-property
capabilities may be added through versioned bundles over time.

**Business**

* teams
* team collaboration
* resident management and maintenance requests
* business workflows

**Administration**

* advanced permissions
* Organization management
* future enterprise capabilities

The exact stable identifiers belong in the implementation contract, but every
capability must have one authoritative meaning and value type.

Plan presets and grant bundles are versioned. Existing accounts may retain a
grandfathered bundle version so plan evolution does not silently remove
historical entitlements. Moving an account to another bundle version requires
an explicit, testable migration policy.

### Roles and property scope

Roles remain independent of subscription plans.

Examples may include:

* Owner
* Administrator
* Manager
* Member
* Viewer
* Technician

Roles determine who may perform an action. Entitlements determine whether the
account has the product capability. Property relationships and assignments
determine where the action is permitted.

Role names and capabilities may differ between homeowner accounts and
Organizations, but neither should acquire product access merely because a role
name exists.

### Central resolver

One account-level resolver will combine:

```text
base plan preset
  + active internal grants
  + grandfathered bundle version when applicable
  = effective entitlements and limits
```

The resolver must:

* accept an explicit clock for deterministic expiration tests
* default-deny unknown plans and capabilities
* ignore pending checkout as a source of paid access
* keep billing state distinct from product-grant state
* return typed booleans, limits, and active-grant metadata
* produce consistent results in the web app, Android package, and Functions

Multiple grants may be active at the same time. Resolution uses these rules:

1. A confirmed paid Stripe subscription supplies the paid base-plan bundle;
   otherwise the account retains the Free base-plan bundle.
2. Scheduled, expired, revoked, and converted grants do not contribute access.
3. Active internal grants are additive by default and do not replace the base
   plan.
4. Boolean capabilities are enabled when any active input grants them.
5. Quantitative limits use the greatest active approved value unless a
   capability defines another versioned merge rule.
6. An unknown bundle, capability, value type, or merge rule defaults to deny and
   creates an observable resolver error.
7. A paid plan does not silently suppress an unrelated partner, beta, lifetime,
   or support grant. A grant may terminate on paid conversion only when its
   program policy explicitly defines that transition.
8. Restrictive overrides remain outside the initial additive model and require
   a separately approved, auditable policy.

Firestore rules cannot import TypeScript. Their minimal entitlement mirror must
be protected by emulator tests proving parity with the shared resolver.

Reporting keeps billing state separate from effective product access. Analytics
must be able to distinguish actual paying customers, discounted billing,
complimentary grants, partner programs, beta access, lifetime access, and other
admin-granted access without treating those dimensions as interchangeable.

## Implementation guidelines

Application code should avoid logic such as:

```typescript
if (plan === 'property') {
  // enable teams
}
```

Instead, behavior should use resolved capabilities:

```typescript
if (entitlements.teams.manage) {
  // enable teams
}
```

Quantitative limits should also come from the resolver:

```typescript
const propertyLimit = entitlements.properties.limit;
```

rather than:

```typescript
const propertyLimit = plan === 'multi_homeowner' ? 5 : 1;
```

Direct plan-name checks remain appropriate only inside the centralized bundle
resolver, billing and Stripe mapping, plan selection, pricing presentation,
analytics that explicitly measure a plan, and migration adapters scheduled for
removal.

Feature visibility is not authorization. Trusted server operations, Firestore
rules, Storage rules, and delivery jobs must enforce the same capability and
scope boundaries when they handle protected behavior.

## Proposed plan presets

### Free

* Property limit: 1
* Property Setup Assistant
* Manual maintenance and property-memory capabilities
* Free reporting and export capabilities defined by the plan matrix

### Homeowner+

Everything in Free, plus:

* Property limit: 1
* recurring maintenance
* suggested maintenance generation
* reminder delivery
* expanded Maintley Intelligence
* Home / Property Review
* Homeowner+ document and storage capabilities

Property Setup Assistant remains available on Free. Homeowner+ expands the
automation offered through that assistant; it does not make the assistant itself
paid-only.

### Multi-Homeowner

Homeowner+ capabilities, plus:

* Property limit: 5
* global and cross-property homeowner views
* property groups for homeowner organization

It does not include:

* teams
* residents or tenant management
* business collaboration
* Organization administration

Property Groups are treated as a generic multi-property capability, not proof
that an account is a business. Business group workflows still require their own
entitlements.

### Property

Homeowner+ maintenance capabilities, plus:

* Property limit: 7
* teams and simple collaboration
* resident management and maintenance requests
* property groups
* business workflows defined by the plan matrix

### Portfolio

Everything in Property, plus:

* advanced permissions
* property assignments
* Organization-ready administration where separately authorized
* expanded operational and cross-property capabilities

A Portfolio entitlement does not create an Organization relationship or grant
access to a homeowner property. ADR 0027's relationship requirements still
apply.

## Temporary and exceptional access

Trials, promotions, beta features, support grants, grandfathered bundles, and
future enterprise customization use the same resolver rather than synthetic plan
names.

Internal entitlement grants are authoritative and do not require a
corresponding Stripe customer or subscription. Stripe remains the billing
system for paid access only.

### Canonical multi-grant account model

The canonical grant location is:

```text
familyAccounts/{accountId}/entitlementGrants/{grantId}
```

An account may have multiple simultaneous grants. Grants are not copied to each
account member. A trusted, derived account entitlement projection may support
rules and efficient reads, but it is not an independently writable source of
truth and must identify its resolver and bundle versions.

Every grant must include:

* stable `grantId` and `programId`
* owning `accountId`
* grant kind: temporary or permanent
* lifecycle state: scheduled, active, expired, revoked, or converted
* bundle ID and version, capability overrides, or quantitative-limit overrides
* authoritative start timestamp
* end timestamp when time-bounded; permanent grants have no artificial end date
* source such as trial, promotion, lifetime, beta, partner, support, or migration
* server-issued timestamp and trusted issuer identity
* idempotency key
* audit reason and policy version when manually issued
* revocation, conversion, or terminal metadata when applicable

Active access is derived from the authoritative timestamps and terminal fields;
the stored lifecycle label alone does not extend access. Only trusted services
may create or mutate grants. Grant audit events are append-only.

### Grant ownership and transfer

Grants belong to the owning account, not to an individual property or copied
user profile. Ordinary account-owner or family-membership changes do not move a
grant to another account.

Programs associated with a specific person may record a beneficiary identity,
but their transfer policy must still be explicit. Account merges, splits,
ownership transfers, or movement to another family account require an audited
regrant or migration decision. Grants are non-transferable by default. Account
deletion terminates access according to the approved retention and deletion
policy without erasing required audit evidence prematurely.

The Homeowner+ trial in ADR 0030 is the first planned use of this grant model.
Its expiration removes the temporary Homeowner+ capabilities while leaving the
active Free base plan intact.

### Customer-redeemed complimentary access programs

A customer-redeemed complimentary access code is a trusted issuance path into
the canonical grant model. It is not a Stripe coupon, billing discount, plan,
or independently resolved entitlement. A successful redemption creates the
approved temporary grant for the code's stable program and bundle.

Every access-code program must define server-owned policy for:

* stable program and bundle identifiers
* grant duration and redemption expiration
* total and per-account redemption limits
* eligible account and relationship types
* transition mode after complimentary access
* revocation, support, reporting, and audit treatment

Redemption must be transactional, idempotent, rate-limited, and server
validated. Redeemable secrets must not be stored or logged in plaintext.
Repeated, expired, exhausted, or ineligible redemption attempts must fail
without partially issuing or extending a grant. Audit records identify the
program and outcome without retaining the redeemable secret.

### Entitlement loss and property visibility

Property ownership, existing-property access, and existing relationship scope
are not revoked because a paid entitlement ends. Losing a multi-property or
business entitlement must never delete, transfer, conceal, or lock an owned
property, its property memory, or an already active team relationship.

A newly created Free account remains limited to one property and receives no
team, resident-management, business-collaboration, or Organization capability.
The continuity policy applies only when an account legitimately created or
received resources while a qualifying paid or complimentary entitlement was
active and later loses that entitlement.

When a downgraded account is above its resulting property or team limits:

* every existing owned property remains visible and usable at the resulting
  plan's capability level
* existing equipment, documents, maintenance history, tasks, relationships,
  and audit records remain available subject to role and relationship rules
* existing active team members retain their current property scope and may use
  capabilities still provided by the account's resulting plan
* the account owner may remove members, reduce permissions, export, transfer,
  download, or delete existing data and relationships
* property creation, claiming, duplication, import, transfer-in, new team
  invitations, reactivation, and other count-increasing actions are blocked
  while the applicable limit is exceeded
* pending invitations cannot activate when doing so would exceed the resulting
  limit
* recurring automation, portfolio reporting, advanced collaboration, premium
  delivery, and other capabilities absent from the resulting plan stop even
  though their underlying records remain
* removing a property or team member does not create a replacement slot until
  the account is below the resulting limit
* restored eligible access immediately restores expansion and paid capabilities
  according to the resolved bundle and current relationship permissions

This over-limit continuity state is not a Free-plan feature bundle and does not
allow a new Free account to create multiple properties or establish a team.
Quantitative limits govern net-new expansion; capabilities govern what existing
resources can do; ownership and active relationships govern who may see them.

## Complimentary-to-paid transition contract

An internal grant may describe an intended transition to paid access, but grant
data must never independently create a charge, subscription, invoice, or paid
entitlement. Stripe is the sole authority for whether a billing relationship
exists and whether a charge can occur.

Each complimentary program uses one transition mode:

* `none` - access ends or falls back without a billing transition
* `checkout_required` - the user must intentionally complete Stripe Checkout
* `automatic` - a trusted Stripe subscription or subscription schedule already
  represents the approved future billing relationship

The Maintley transition descriptor may include:

* transition mode and target plan
* billing cycle, currency, and recurring display amount
* intended first-charge timestamp
* whether Stripe reports a usable payment method
* disclosure and terms versions
* consent timestamp, actor, and source
* trusted references to the relevant Stripe customer, subscription, schedule,
  or Checkout session
* cancellation, conversion, and failure status for presentation and support

`automatic` is valid only after a trusted server operation confirms the Stripe
billing object, required payment method state, and recorded consent. A client or
admin-entered grant field cannot satisfy those conditions. Promo-code Checkout
remains valid when the user is intentionally establishing a Stripe subscription
and future billing relationship.

Cancelling or opting out of an automatic transition must update or cancel the
authoritative Stripe schedule or subscription first. Maintley then refreshes the
transition view. Cancelling future billing does not shorten the already granted
complimentary period unless the program terms explicitly require that behavior.

If the first charge fails, requires additional authentication, or Stripe does
not confirm an active paid subscription, Maintley does not grant paid access.
The internal grant follows its approved end policy, the account falls back to
its otherwise entitled plan without data loss, and the user receives accurate
billing-recovery guidance. Stripe retry and dunning behavior remains part of the
billing system.

## Administrative grant controls

Admin grant operations require a specific Maintley permission in addition to
general admin access. Trusted operations must:

* prevent an administrator from granting access to their own account
* restrict programs, bundles, capabilities, limits, and durations to allowlists
* require an audit reason and idempotency key
* preview the resulting effective access before confirmation
* require elevated confirmation for permanent, unusually broad, or extended
  grants
* write append-only issuance, extension, conversion, and revocation audit events
* prevent a client from directly writing grant or audit records

The initial admin experience selects approved program presets. It is not a
general-purpose capability editor.

### High-value administrative audit trail

Anything that changes effective access, a billing relationship, or lifecycle
communication is a high-value audited action. At minimum, the audit trail
records:

* grant creation, extension, revocation, conversion, and lifetime issuance
* complimentary access linked to a paid transition
* manual application of a promotion or program
* renewal behavior changes and user opt-out from automatic continuation
* admin-triggered access email requests and their accepted high-level outcome
* synthetic Stripe migration start and completion
* failed or idempotently repeated admin requests

The server-written audit event contract includes:

```typescript
type AdminAuditEvent = {
  eventId: string;
  action:
    | 'grant.created'
    | 'grant.extended'
    | 'grant.revoked'
    | 'grant.converted'
    | 'grant.lifetime_created'
    | 'program.applied'
    | 'billing_transition.linked'
    | 'billing_transition.updated'
    | 'billing_transition.opted_out'
    | 'access_email.sent'
    | 'stripe_migration.started'
    | 'stripe_migration.completed'
    | 'admin_action.failed'
    | 'admin_action.replayed';
  actorUserId: string;
  targetAccountId: string;
  targetUserId?: string;
  grantId?: string;
  programId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  reason: string;
  requestId: string;
  createdAt: Timestamp;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};
```

Audit entries are immutable, append-only, server-written, and idempotent by
request ID. They must be searchable by user, account, grant, program, and
administrator and support a human-readable timeline on the admin user page.
Sensitive metadata must be minimized and must not include payment credentials,
secret values, or unnecessary property content.

The audit trail records the administrative decision or customer-directed
request and its resulting high-level state. Operational logs separately record
resolver recalculation, webhook handling, reminder cancellation, provider
delivery attempts, delivery-status changes, and other system execution details.
An `access_email.sent` audit event therefore records the accepted admin action,
not every downstream provider callback. Routine resolver calls do not belong in
the admin audit trail.

## Migration requirements

Implementation should proceed in phases:

1. Inventory direct plan-name checks and duplicated limit tables.
2. Define typed entitlement identifiers and plan presets.
3. Add the resolver in compatibility mode and prove current-plan parity.
4. Move client and Functions feature checks to the resolver.
5. Update Firestore and Storage rule mirrors with emulator parity tests.
6. Add Multi-Homeowner and temporary Homeowner+ grants only after parity passes.
7. Remove obsolete direct plan checks and legacy trial adapters.
8. Add validation that prevents new feature-level plan checks outside approved
   billing, presentation, analytics, and resolver boundaries.
9. Inventory 100% discounted Stripe subscriptions and distinguish genuine
   discounted billing from synthetic lifetime or promotional access.
10. Migrate approved synthetic-access accounts to equivalent audited Maintley
    grants only after resolver parity is proven.

Migration adapters may preserve behavior temporarily, but they must be named,
tracked, and removed. They must not become a second entitlement system.

Synthetic Stripe access is migrated manually, one account at a time, rather
than through a bulk mutation. Accounts are handled in this priority order:

1. internal founder and development accounts
2. existing lifetime complimentary accounts
3. remaining synthetic subscriptions as needed

Each individual migration uses this sequence:

1. Run a report-only inventory and separate genuine discounted billing from
   synthetic promotional or lifetime access.
2. Require manual review for ambiguous accounts.
3. Create an idempotent internal grant equivalent to the intended access.
4. Compare old and new effective capabilities and limits.
5. Observe the grant while leaving the Stripe relationship unchanged.
6. End the synthetic Stripe subscription only after parity is confirmed.
7. Verify that Stripe has no future invoice, renewal, or schedule remaining.
8. Retain a repair and rollback path that restores access without deleting data
   or rewriting billing history.

## Consequences

### Benefits

* Plans become easier to evolve.
* Pricing changes require fewer behavioral code changes.
* Feature gating and quantitative limits become centralized.
* Trials and promotions remain distinct from Stripe billing.
* Temporary, permanent, beta, lifetime, and grandfathered access become
  representable.
* Homeowner and business interfaces can remain shared.
* Backend authorization can enforce the same capability vocabulary.
* New plans can reuse capabilities without duplicating product implementations.

### Tradeoffs

* Existing direct subscription checks require an audited migration.
* Firestore and Storage rules still require a tested mirror of relevant
  entitlements.
* Bundle versioning and grant precedence add initial architectural work.
* Support and analytics tools must distinguish billing plan from effective
  product access.
* Incorrect resolver behavior could affect multiple features, requiring strong
  parity and regression tests.
* Downgrades require an explicit over-limit continuity state instead of treating
  a quantitative limit as a property-list or relationship-access filter.

## Future considerations

This architecture supports:

* promotional feature unlocks
* time-limited trials
* beta features
* enterprise customization
* grandfathered plan bundles
* Organization-specific feature flags
* additional homeowner and business plan variations
* customer-redeemed complimentary access programs

The objective is to keep Maintley as one application with shared interfaces,
while assembling product experiences through entitlement bundles rather than
copied implementations.

## Implementation configuration

The following values are finalized during implementation without reopening the
architecture:

1. stable entitlement identifiers, value types, and versioned merge rules
2. the exact initial Multi-Homeowner global and cross-property views
3. the account-by-account classification of existing 100% Stripe subscriptions
4. the detailed analytics taxonomy within the approved separate billing-state
   and effective-access dimensions

Internal grants remain additive. Restrictive administrative action is outside
the grant merge model and requires a separate permissioned and audited policy.
