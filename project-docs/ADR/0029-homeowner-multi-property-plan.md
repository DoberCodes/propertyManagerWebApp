# ADR 0029: Homeowner Multi-Property Plan

Status: Accepted

Date: 2026-07-23

Related ADRs:

* `0027-business-licensing-property-stewardship-and-record-attribution.md`
* `0030-homeowner-plus-trial-experience.md`
* `0032-centralized-entitlement-architecture.md`

Related report:

* `project-docs/reports/2026-07-23-homeowner-plans-and-trial-implementation-plan.md`

## Context

Maintley's current Homeowner+ plan supports one property. The next plan with
multi-property capacity is Property, which supports seven properties and is
presented under the Business audience with team, resident, grouping, and
operational capabilities.

Homeowners with a vacation home, second home, family property, or inherited
property do not necessarily identify as landlords, property managers, or
businesses. Asking them to select a business plan creates positioning friction
and also grants capabilities that are unrelated to their needs.

ADR 0027 separately preserves Property and Portfolio as business subscription
plans. A homeowner-oriented multi-property option must not rename, remove, or
silently redefine either business plan.

## Decision

### 1. Add a distinct homeowner plan

Introduce a dedicated **Multi-Homeowner** plan within the Homeowner audience.
Its stable internal identifier is `multi_homeowner`.

The plan is intended for:

* vacation homes
* second homes
* family properties
* inherited homes

It supports up to **five properties**.

### 2. Build on Homeowner+, not Property

Multi-Homeowner includes all Homeowner+ capabilities, increases the property
limit to five, and enables Property Groups for simple homeowner organization.
Its capability model should be composed from Homeowner+ with explicit
multi-property entitlements instead of copying the Property plan and subtracting
business features.

The initial plan does not include:

* teams or business membership
* resident profiles or resident maintenance requests
* business collaboration
* role-based operational workflows
* organization or professional-contribution capabilities

Family collaboration remains a homeowner capability and is not treated as a
business team feature.

### 3. Preserve the business plans

Property remains a Business plan for small property operations. Portfolio
remains a Business plan for larger portfolios, teams, and advanced permissions.
Neither plan is removed or replaced.

The plan answers which homeowner capabilities and limits are available. It does
not create an Organization, tenant relationship, professional relationship, or
business authority.

### 4. Preserve data across plan changes

Downgrading below the number of properties already saved must not delete or hide
property memory. Maintley should prevent creation of additional properties until
the account is within its active limit and provide a clear path to upgrade or
archive an unneeded property.

### 5. Keep pricing configuration explicit and launch-gated

The approved public prices are **$5.99 monthly** and **$59.99 annually**. The
plan inherits Homeowner+'s 250-file and 5 GB storage limits. Separate canonical
monthly and annual Stripe configuration names are required.

The plan must remain unavailable by default behind one explicit launch flag.
The flag controls public presentation, registration, checkout, and admin plan
selection. Stripe remains authoritative for an actual paid subscription.

### 6. Restrict business-to-homeowner self-downgrades

An existing Property or Portfolio subscriber may self-downgrade to
Multi-Homeowner only when the account is within the five-property limit and no
active business-only team, resident, or organization relationships remain.
Maintley must explain the blocking records and require the customer to resolve
them or contact support. A downgrade must never delete or hide those records.

## Required implementation behavior

Implementation must:

1. Treat Multi-Homeowner as a homeowner plan, not a copied business plan.
2. Compose its capabilities from Homeowner+ wherever practical.
3. Enable the existing Property Groups capability for homeowner organization
   without enabling team or business group workflows.
4. Enforce the five-property limit in the client, trusted server operations,
   Firestore rules, and tests.
5. Exclude team, resident, organization, and business workflow capabilities.
6. Add the plan consistently to registration, authenticated plan selection,
   public pricing, Stripe configuration, admin support, and entitlement logic.
7. Preserve user data during upgrades, downgrades, cancellation, and failed
   payment states.
8. Keep Property and Portfolio available and positioned under Business.

## Consequences

### Benefits

* Better alignment with how multi-home owners identify themselves.
* A clear homeowner upgrade path between Homeowner+ and business plans.
* Less accidental exposure to irrelevant team and resident functionality.
* More understandable pricing and onboarding.

### Tradeoffs

* A fifth core subscription tier must remain synchronized across product,
  billing, security rules, public pricing, and support tools.
* Separate Stripe monthly and annual prices are required.
* Resource limits and downgrade behavior require explicit validation.
* Additional pricing choices can increase comparison complexity if the public
  presentation is not kept audience-focused.

## Resolved configuration

* Customer-facing name: **Multi-Homeowner**
* Stable plan ID: `multi_homeowner`
* Monthly price: **$5.99**
* Annual price: **$59.99**
* Property limit: **5**
* File limit: **250**
* Storage limit: **5 GB**
* Equipment limit: unlimited
* Self-downgrade: permitted only after the business-only relationship and
  resource checks in this ADR pass
