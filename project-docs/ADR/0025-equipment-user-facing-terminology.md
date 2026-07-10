# ADR 0025: Standardize User-Facing Equipment Terminology

Status: Accepted
Date: 2026-07-10
Accepted: 2026-07-10
Decision Source: Manual

## Context

Maintley previously moved away from the user-facing term "Devices" and adopted
"Appliances," "Systems," and "Appliances & Systems" in many app surfaces.

As Maintley's tracked records expanded to include HVAC, water heaters, roofs,
generators, safety devices, pumps, exterior features, and other maintainable
items, "Appliances" became too narrow. Mixed wording also made the product feel
inconsistent and risked confusing future customers.

The persisted implementation still uses the `devices` collection and related
fields such as `linkedDeviceIds` for compatibility.

## Decision

Use **Equipment** as the standard user-facing term for maintainable property
records.

Examples:

* Add Equipment
* Equipment Profile
* Equipment Details
* Related Equipment
* Equipment Documents
* Equipment Service

Keep the existing `devices` collection, route structure, storage paths,
permission keys, and compatibility fields unless a later ADR approves a
technical migration.

Code may continue to use legacy identifiers where they are part of existing
contracts, including:

* Firestore collection names
* persisted field names
* route parameters and action values
* storage usage values
* report type IDs
* compatibility parser synonyms

New user-facing copy should not introduce "Appliance" or "Appliances" unless
referring to a real-world appliance category inside a broader example.

## Data Migration Guidance

Do not rename the `devices` collection to `equipment` as part of this wording
change.

Any persisted text cleanup must be:

* dry-run by default
* idempotent
* limited to exact Maintley-generated legacy strings
* careful not to rewrite user-authored notes, descriptions, or historical facts

Historical snapshots and maintenance records may preserve old wording when that
wording represents what Maintley displayed at the time. Prefer normalizing
display text at render time over mutating immutable historical records.

## Consequences

* Customers see one consistent term: Equipment.
* Existing customer data remains compatible.
* Maintley avoids duplicate Firestore sources of truth.
* Future technical migration from `devices` to another collection name remains
  possible, but requires a separate migration plan and ADR.
