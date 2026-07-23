# ADR 0030: Homeowner+ Trial Experience

Status: Proposed

Date: 2026-07-23

Related ADRs:

* `0005-property-setup-assistant.md`
* `0006-maintley-intelligence-architecture.md`
* `0029-homeowner-multi-property-plan.md`
* `0031-homeowner-plus-trial-lifecycle-and-communication.md`
* `0032-centralized-entitlement-architecture.md`

Related report:

* `project-docs/reports/2026-07-23-homeowner-plans-and-trial-implementation-plan.md`

## Context

The current Free onboarding experience asks homeowners to create and configure
maintenance work before they have experienced the primary automation value of
Homeowner+.

Maintley already contains legacy trial concepts, but they model `trial` as the
status of the entire subscription. When that status expires, current access
resolvers and protected routes can treat the account itself as expired. That is
not compatible with a product trial where the underlying Free account must
continue normally.

Maintley also has a Stripe-backed trial-subscription callable. A Free product
trial must not require a Stripe customer, payment method, or subscription and
must not be represented as an unconfirmed paid purchase.

## Proposed decision

### 1. Give new Free owner accounts a 30-day Homeowner+ trial

A newly created homeowner account that intentionally selects the Free plan
receives one 30-day Homeowner+ product trial. Guest, team-member, resident, and
other invited access accounts are not eligible.

The trial starts from a trusted, auditable account-creation event and is granted
once per owning account. Reinstalling the application, changing an email
address, or recreating a client profile must not restart it.

### 2. Separate the base plan from the trial entitlement

The account remains on the active Free (`homeowner`) base plan throughout the
trial. Homeowner+ is represented as a temporary product entitlement layered on
that base plan.

The trial is not:

* a Stripe subscription
* a pending checkout plan
* a paid-plan ownership claim
* an account-level `expired` status after day 30

Entitlement resolution should answer both:

```text
base plan: Free
temporary grant: Homeowner+ through <timestamp>
```

rather than rewriting the billing plan to Homeowner+.

### 3. Include the complete Homeowner+ experience

During the active trial, the account receives Homeowner+ capabilities,
including:

* suggested maintenance task generation
* recurring maintenance schedules
* Homeowner+ automation and reminders
* expanded Maintley Intelligence
* Home / Property Review
* Homeowner+ document understanding and storage limits
* the premium onboarding experience

The Property Setup Assistant is already a Free capability. The trial should make
its Homeowner+ automation path available rather than misrepresenting the setup
assistant itself as paid-only.

### 4. Require confirmation before creating maintenance schedules

Maintley may generate a proposed recurring-maintenance plan from confirmed
property and equipment information, but it must show that plan for homeowner
review and one explicit confirmation before writing recurring tasks.

This preserves the existing principle that Maintley Intelligence does not
silently modify user data while still removing the need to create each schedule
manually.

### 5. Downgrade capabilities without deleting records

At trial expiration:

* the account continues on Free
* properties remain
* equipment and property records remain
* maintenance history remains
* documents remain accessible
* existing task records remain
* already-created upcoming recurring task occurrences remain actionable

After expiration:

* users cannot create a new recurring schedule
* users cannot convert a task into a recurring schedule
* completing an existing recurring occurrence records the maintenance event but
  does not generate the next occurrence
* Homeowner+ automation, notifications, and other premium entitlements stop

No expiration process may delete records or rewrite historical maintenance
events.

### 6. Explain the boundary at the moment it matters

When a user completes a recurring occurrence after trial expiration, Maintley
should confirm that the maintenance was recorded and explain that automatic
creation of the next occurrence requires Homeowner+.

Upgrade messaging must be contextual and must not block completion or access to
the user's history.

### 7. Enforce trial entitlement beyond the interface

Trial issuance, eligibility, expiration, plan limits, recurring-task creation,
and premium server operations must be enforced by trusted services and security
rules where applicable. Hiding a control in the interface is not sufficient.

Expiration should be derived from an authoritative end timestamp. A scheduled
job may record lifecycle state or send messages, but access must not depend on a
job running at exactly the expiration moment.

## Consequences

### Benefits

* Homeowners experience the product's automation value before purchasing.
* The Free account remains usable after the trial without data loss or a
  paywall loop.
* Upgrade messaging appears after a meaningful maintenance action.
* Product trials remain independent from Stripe billing state.

### Tradeoffs

* Maintley needs a first-class account entitlement model in addition to billing
  plan state.
* Client, Functions, Firestore rules, email delivery, and push delivery must
  resolve the same effective capabilities.
* Recurring-task completion must distinguish recording history from creating
  the next occurrence.
* Existing legacy trial code and terminology require careful migration or
  removal.

## Open decisions before acceptance

1. Confirm whether the trial begins at account creation or after the homeowner
   creates the first property. Account creation is the recommended deterministic
   boundary.
2. Confirm whether accounts that originally selected a paid plan but cancelled
   checkout should receive the Free trial. The current proposal limits automatic
   issuance to an intentional Free selection.
3. Confirm whether any existing Free-user launch cohort receives a one-time
   trial; the default recommendation is new accounts only.
4. Confirm whether upgrading during the product trial charges immediately or
   schedules paid billing for the trial end date.
5. Confirm whether support can grant a replacement trial and what audit reason
   is required.
