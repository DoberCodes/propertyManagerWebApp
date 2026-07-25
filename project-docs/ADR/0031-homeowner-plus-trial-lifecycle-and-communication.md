# ADR 0031: Homeowner+ Trial Lifecycle and Communication

Status: Accepted

Date: 2026-07-23

Related ADRs:

* `0030-homeowner-plus-trial-experience.md`
* `0032-centralized-entitlement-architecture.md`

Related report:

* `project-docs/reports/2026-07-23-homeowner-plans-and-trial-implementation-plan.md`

## Context

A Homeowner+ trial should educate a homeowner, demonstrate what Maintley has
helped organize, and explain the Free-plan boundary before automation stops. A
trial that simply expires creates surprise and does not reinforce the value of
the property memory created during onboarding.

Maintley currently sends a general welcome email when a user document is
created and runs separate scheduled email systems for summaries, insights, task
reminders, and team reports. It does not currently have an idempotent
Homeowner+ trial lifecycle sequence.

## Decision

### 1. Add a four-message lifecycle

Eligible Homeowner+ product trials receive this sequence:

**Day 0 - Welcome and activation**

* Explain that the account is on Free with a 30-day Homeowner+ trial.
* Encourage completing property setup.
* Link to the next useful onboarding action.

**Day 7 - Progress summary**

* Summarize factual progress such as properties, systems, documents, and
  recurring schedules created.
* Highlight the maintenance automation already established.
* Avoid recommendations or claims that are not supported by saved records.

**Day 21 - Trial ending reminder**

* State the trial end date clearly.
* Explain what remains available on Free.
* Explain which Homeowner+ automation requires an upgrade.

**Day 30 - Expiration notification**

* Confirm that the Free account and saved property memory remain available.
* Explain that automatic recurrence generation and other Homeowner+
  capabilities have stopped.
* Provide a direct upgrade path.

Future Maintley Intelligence summaries may improve these messages, but they are
not required for the initial lifecycle.

### 2. Send one welcome message, not two

The Day 0 trial message should replace or extend the existing general welcome
email for eligible Free-trial accounts. Maintley must not send a generic welcome
email and a separate trial welcome email for the same signup.

Non-trial and invited accounts continue to receive the appropriate existing
welcome or invitation behavior.

### 3. Make access lifecycle delivery idempotent and account-aware

Trial and promotional communication use one access lifecycle delivery model.
Every message requires a durable delivery key tied to the account, grant,
program, template version, and lifecycle milestone. Retries, scheduler overlap,
profile mirrors, or repeated admin requests must not send duplicates.

The delivery system must:

* calculate milestones from authoritative grant and billing-transition
  timestamps
* record sent, skipped, and terminal outcomes
* stop trial reminders after conversion to a paid plan
* skip deleted or ineligible accounts
* tolerate scheduler delays without sending milestones out of order
* provide a test-only path that cannot mark production delivery state
* treat the activation message as the 30-day notice when a 30-day
  complimentary period would otherwise send both messages together
* prevent a template retry or manual resend from bypassing the delivery
  idempotency key

Eligibility and first-charge instants are calculated in UTC. Customer-facing
messages display the account's configured time zone and an unambiguous date.
Time-controlled tests must cover time-zone boundaries and daylight-saving
changes.

### 4. Use shared URL generation

Email links must use the application's configured canonical origin and a shared
route-link builder. Templates must not independently hard-code HashRouter or
BrowserRouter URL formats.

This allows the lifecycle work to precede ADR 0028 without creating a second URL
migration inside email templates.

### 5. Keep communication factual and homeowner-friendly

Progress messages should describe what the homeowner saved or what Maintley
created after confirmation. They must not imply that Maintley inspected the
physical home, verified maintenance, or certified a record.

The Day 30 email must not say that data, access to the Free account, or existing
maintenance history has expired.

### 6. Apply transparent communication to promotional access

Promotional access that is expected to transition into a paid subscription must
provide a transparent user experience.

Communication for a complimentary period must:

* state whether payment information is collected
* state whether paid billing begins automatically when complimentary access ends
* identify the renewal or first-charge date when automatic billing applies
* provide reminder communications before the complimentary period ends
* provide a clear path to review or change the billing choice

Billing transitions must never intentionally surprise the customer. Maintley
favors transparency over retention tactics. This principle does not prohibit
automatic renewal; it requires customers to understand what will happen and
have a reasonable opportunity to make an informed decision.

Internally granted access that does not transition to billing must not imply
that a payment method is required or that a charge will occur.

Messages that communicate account state, complimentary-access state, billing
transitions, payment status, or renewal behavior are operational
communications. Product education and marketing remain separate categories
with their own preference, consent, and content rules.

Automatic paid transitions are reserved for programs where the customer
intentionally establishes a Stripe billing relationship, provides the required
payment information, and gives versioned consent to automatic renewal. Other
complimentary programs end or require an intentional Checkout action.

When a user voluntarily selects a paid plan equivalent to an active temporary
grant bundle, the upgrade flow remains available but must present the grant end
as the earliest first-charge date. This comparison uses effective granted
access, not the Free billing base. After Stripe confirms the scheduled billing
relationship, generic expiration messages are replaced by accurate
first-charge and renewal reminders. Cancelling before the first charge leaves
the original complimentary end date intact.

Key lifecycle email communications should have complementary in-app notices
where appropriate. Conversion to a confirmed paid subscription immediately
suppresses obsolete complimentary-access messages.

### 7. Provide persistent account visibility and control

Transparency cannot depend on email delivery alone. The authenticated account
and billing experience must show:

* the complimentary-access program and end date
* whether Stripe reports a payment method for the intended transition
* whether access ends, requires Checkout, or continues automatically as paid
* the intended first-charge date
* recurring price, currency, and billing interval
* a direct manage, cancel, or opt-out action when future billing exists

Payment-method status is descriptive and must not expose payment credentials.
Billing and transition facts come from the trusted Stripe-backed view defined by
ADR 0032. Internal grant metadata may explain the intended experience but cannot
authorize a charge.

Opting out must provide a confirmation and leave the already granted
complimentary period intact unless the disclosed program terms explicitly say
otherwise. The surface must remain usable on mobile web and in the packaged
Android experience.

### 8. Communicate failed billing transitions accurately

If an intended first charge fails, requires customer authentication, or does
not result in a Stripe-confirmed paid subscription, Maintley must not say that
paid access is active. Communication should explain the billing issue, the
current access state, the Free fallback when applicable, and the safe recovery
path without implying that saved property memory was lost.

### 9. Require expanded legal and policy review

Before enabling an automatically paid transition, review must cover:

* renewal and first-charge disclosure
* evidence and versioning of customer consent
* cancellation and opt-out presentation
* promotional-program terms
* transactional, educational, and marketing message classification
* reminder timing and applicable jurisdictional requirements
* retention and minimization of grant, consent, delivery, and audit records

The implementation plan may define technical controls, but it does not replace
appropriate legal review.

### 10. Apply the lifecycle contract to complimentary access codes

Maintley may allow a customer to redeem a complimentary access code that
issues a temporary internal entitlement grant. These codes are access-program
credentials, not Stripe coupons or promotion codes. Redemption must not create
a Stripe customer, subscription, invoice, payment method, renewal, or charge.

Each access-code program must clearly identify:

* the included access bundle and complimentary end date
* whether access simply ends or requires an intentional Checkout action to
  continue
* the account access that remains after expiration
* any properties or capabilities that will become restricted
* the direct path to continue with paid access when offered

Non-renewing access-code programs use transition mode `none` or
`checkout_required`; they never imply automatic continuation. If a customer
chooses to continue, paid conversion requires intentional Stripe Checkout and
Stripe confirmation under ADR 0032.

Before a multi-property grant expires, key email and in-app notices must explain
that Maintley preserves access to every existing owned property and its records
at the resulting plan's capability level. The notices must explain that the
customer cannot add properties or team members while over the resulting limits,
that paid automation and business capabilities stop, and that existing active
team relationships continue with their current property scope and the resulting
account capabilities. The notices must also disclose the resulting file-count
and storage limits, current usage, and whether new uploads will pause.

Where tenant or resident records already exist, messaging must distinguish
manual occupancy records from authenticated tenant access. Downgraded accounts
may continue data-minimized manual occupancy administration for existing
properties, but a newly recorded tenant does not receive an invitation, login,
portal, or direct maintenance-request access. Maintley must not describe
existing properties, files, records, active team relationships, or continuing
minimal tenant relationships as deleted, lost, or transferred.

## Consequences

### Benefits

* Homeowners understand the trial and its value throughout onboarding.
* Expiration is predictable rather than surprising.
* Progress summaries reinforce useful property-memory creation.
* Idempotent delivery reduces duplicate-email and support risk.

### Tradeoffs

* Trial templates, promotional-access templates, and generalized lifecycle
  delivery tracking are required.
* Scheduled queries and retry behavior require operational monitoring.
* Communication consent and preference treatment must be defined before launch.
* Message content must remain synchronized with actual entitlements.
* Promotional programs must provide accurate renewal terms to communication
  templates and lifecycle scheduling.
* Account surfaces must remain synchronized with Stripe-backed billing facts.
* Multi-property complimentary programs require downgrade-aware messaging that
  distinguishes retained existing access from blocked expansion and ended paid
  capabilities.
* Storage and tenant-continuity messaging must remain synchronized with actual
  quotas, relationships, and invitation behavior.

## Implementation configuration

Acceptance does not require every program or message to use identical delivery
settings. Implementation must configure and validate:

1. the exact in-app placements for each key lifecycle milestone
2. the grace window for a delayed scheduled run to send a missed milestone
3. whether conversion also sends a separate paid-plan confirmation
4. the approved program catalog and transition mode for each program
5. the reminder schedule required by program terms and applicable law
6. access-code eligibility, redemption limits, expiration, and post-grant
   fallback behavior
7. promotional file-count and storage overrides and the resulting upload state

For a 30-day complimentary period, activation satisfies the 30-day reminder
requirement and a second activation-day reminder must not be sent.
