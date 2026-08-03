# ADR 0035: Homeowner+ Multi-Property Consolidation

Status: Implemented

Date: 2026-07-30

Supersedes: `0029-homeowner-multi-property-plan.md`

Related ADRs:

* `0030-homeowner-plus-trial-experience.md`
* `0032-centralized-entitlement-architecture.md`
* `0033-property-type-and-classification-taxonomy.md`

## Context

ADR 0029 introduced a separate Multi-Homeowner plan between Homeowner+ and the
business plans. Subsequent product review found that a fifth plan added more
pricing, billing, entitlement, support, and downgrade complexity than customer
value. Multiple personal properties add value, but not enough differentiated
value to justify another homeowner subscription tier.

Maintley's clearer product distinction is:

```text
Free: maintain one home
Homeowner+: understand and plan for up to five homes
Property: manage small property operations
Portfolio: understand and coordinate larger property operations
```

## Decision

Maintley will not launch Multi-Homeowner. Homeowner+ retains its existing price
and supports up to five personal or family properties, Property Groups, and the
full non-business premium homeowner capability set.

Free remains limited to one Residential property and the full maintenance
workflow. Homeowner plans do not gain business property types, rental
management, resident workflows, or business team capabilities merely because
Homeowner+ supports multiple properties.

Property and Portfolio retain their business positioning and property limits.
Portfolio remains the premium business understanding and coordination tier.
Any future per-door expansion will require a separate pricing and entitlement
decision; it is not authorized by this ADR.

Downgrades remain non-destructive. Existing properties and saved records stay
visible when an account exceeds its new-property limit, while creation of
additional properties is blocked until the account returns within its limit or
upgrades.

The retired `multi_homeowner` identifier must not be offered through pricing,
registration, checkout, admin plan selection, or entitlement resolution. Since
no production accounts used the plan at retirement, no customer migration is
required.

## Implementation Tracking

- [x] Consolidate homeowner premium access into one Homeowner+ plan.
- [x] Preserve the approved Homeowner+ price and multi-Property limit.
- [x] Remove the unused multiple-homeowner plan from active configuration.
- [x] Preserve record visibility and safe downgrade behavior.
- [x] Align billing, entitlements, Support content, and tests.

## Consequences

* Homeowner pricing remains easier to understand.
* Homeowner+ serves both premium single-home and multi-home customers without a
  price change.
* Business capabilities remain isolated to Property and Portfolio.
* ADR 0029 remains as historical context but no longer governs implementation.
