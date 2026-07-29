# ADR 0033: Property Type and Classification Taxonomy

Status: Accepted

Date: 2026-07-29

Related ADRs:

* `0001-remove-units-from-core-experience.md`
* `0003-property-first-navigation.md`
* `0029-homeowner-multi-property-plan.md`
* `0032-centralized-entitlement-architecture.md`

Related documentation:

* `project-docs/docs/Product/PRODUCT_DIRECTION.md`
* `project-docs/docs/Product/FEATURES.md`
* `project-docs/docs/Product/MAINTLEY_PLAN_FEATURE_MATRIX.md`
* `project-docs/docs/Architecture/DATA_MODEL.md`
* `project-docs/docs/Architecture/PERMISSIONS.md`

## Context

Maintley currently stores `propertyType` using the display values `Single
Family`, `Multi-Family`, and `Commercial`. These values mix two different
responsibilities:

* deciding which broad property-management behavior applies
* describing the physical form of the property

`Single Family` is too narrow for the homeowner experience because a homeowner
may live in a condominium, townhome, or apartment. At the same time, changing a
home's physical classification must not silently enable tenants, maintenance
requests, unit management, or other business workflows.

Maintley's plan direction also separates homeowner maintenance from business
coordination:

```text
Homeowners: Free and Homeowner+
Businesses: Property and Portfolio
```

The property model therefore needs a stable behavioral category that can be
entitlement-gated and a separate classification that can describe the building
without changing product access.

The legacy `units` and `suites` fields remain compatibility data. This taxonomy
must not reintroduce Units or Suites as competing organizational structures.
Properties remain the primary organizational unit.

## Decision

### 1. Separate property type from property classification

Maintley will use two property fields:

* `propertyType` defines the broad operational category.
* `propertyClassification` describes the property's physical form.

Canonical stored values will be stable machine identifiers. User-facing labels
will be resolved separately so copy can evolve without rewriting Firestore
records.

Canonical property types:

```text
residential
multi_unit
commercial
```

User-facing labels:

```text
Residential
Multi-unit
Commercial
```

### 2. Use type-specific classification options

Residential classifications:

```text
single_family
condo
townhome
apartment
```

User-facing labels:

```text
Single-family home
Condo
Townhome
Apartment
```

Multi-unit classifications:

```text
duplex
triplex
fourplex
apartment_building
other_multi_unit
```

User-facing labels:

```text
Duplex
Triplex
Fourplex
Apartment building
Other multi-unit
```

Commercial classifications:

```text
commercial_suite
standalone_commercial_building
multi_tenant_commercial_building
mixed_use_building
industrial_warehouse
other_commercial
```

User-facing labels:

```text
Commercial suite
Standalone commercial building
Multi-tenant commercial building
Mixed-use building
Industrial or warehouse
Other commercial
```

Classification describes the building. It does not independently enable
tenants, requests, teams, reports, or other plan-aware capabilities.

### 3. Restrict homeowner plans to Residential

Free and Homeowner+ accounts may create Residential properties only. They may
choose any Residential classification, including Apartment, because the record
may represent the user's own residence within a larger building.

The homeowner creation experience defaults to:

```text
propertyType: residential
propertyClassification: single_family
```

Homeowner plans must not offer:

* Multi-unit or Commercial property creation
* changing a Residential property to Multi-unit or Commercial
* enabling rental management
* tenant or resident-management configuration

An Apartment classification on a homeowner plan does not represent an
apartment building and does not activate business workflows.

### 4. Make business property types and rental management plan capabilities

Property and Portfolio accounts may create Residential, Multi-unit, and
Commercial properties. They may also configure rental management where their
permissions allow it.

The centralized entitlement system will expose shared capabilities equivalent
to:

```text
businessPropertyTypes
rentalManagement
```

These capabilities, not workspace presentation alone, determine whether the
restricted controls and mutations are available. The interface should explain
an unavailable option, but the interface is not the authoritative boundary.
Trusted write paths and future external APIs must enforce the same capability
contract.

### 5. Keep rental state independent from type and classification

`isRental` remains the explicit rental-management setting. Selecting
Multi-unit, Commercial, Apartment, or any other classification must not
silently change `isRental`.

Tenant and maintenance-request visibility continues to depend on rental state,
the effective plan capabilities, and the current user's permissions. Property
classification alone is descriptive.

### 6. Preserve records across plan downgrades

Plan downgrades remain non-destructive.

If an account moves from Property or Portfolio to Free or Homeowner+:

* existing Multi-unit and Commercial properties remain visible
* existing rental state, tenants, requests, tasks, equipment, documents, and
  Maintenance History remain visible
* ordinary record maintenance remains available where the base plan allows it
* the user cannot create another restricted property
* a Residential property cannot be changed to Multi-unit or Commercial
* rental management cannot be newly enabled
* controls for restricted type or rental configuration become read-only with a
  plain explanation

Users may still correct non-gated property details such as name, address,
photo, notes, and a classification valid for the already-saved type. Returning
to Property or Portfolio restores configuration access.

### 7. Migrate legacy values conservatively

Compatibility readers will accept both legacy display values and canonical
machine values during rollout.

Safe conversions:

```text
Single Family -> residential + single_family
Multi-Family  -> multi_unit + classification unset
Commercial    -> commercial + classification unset
```

Maintley must not guess whether an existing Multi-Family property is a duplex,
triplex, fourplex, or apartment building. It must not guess a Commercial
classification either. Those records remain usable and may later prompt the
user to add a classification.

The migration will be repeat-safe and will support a dry run with counts before
applying changes. Compatibility normalization remains in place until all
active readers, writers, reports, filters, analytics, and tests use the
canonical contract.

### 8. Do not restore Units or Suites

Multi-unit and Commercial classifications do not create nested Unit or Suite
records. Equipment, tasks, documents, contractors, tenants, and Maintenance
Events remain property-scoped under the current architecture.

Legacy unit and suite readers may remain only where existing compatibility
requires them. Any future need for location detail should use the established
property and equipment-location models rather than creating another ownership
hierarchy without a separate architectural decision.

## Consequences

### Benefits

* Homeowners can accurately describe condos, townhomes, and apartments without
  receiving business workflows.
* Plan entitlements and physical building descriptions become independent and
  explainable.
* Stable machine identifiers improve reporting, analytics, migrations, and
  future external API contracts.
* Business accounts retain appropriate Multi-unit, Commercial, and rental
  options.
* Downgrades preserve customer records and historical visibility.

### Tradeoffs

* Existing property-type comparisons across creation, editing, duplication,
  details, filtering, reporting, analytics, and maintenance views must move to
  shared normalization helpers.
* A compatibility period is required while legacy and canonical values coexist.
* Some existing Multi-Family and Commercial properties will have an unspecified
  classification until the user provides one.
* Entitlement enforcement must cover all property write paths rather than only
  hiding interface options.

## Initial implementation boundaries

The first implementation will include:

* shared type and classification definitions
* display-label and compatibility-normalization helpers
* conditional creation and editing controls
* homeowner defaults
* centralized entitlement capability checks
* non-destructive downgrade behavior
* updates to duplication, details, filters, reports, and analytics
* a dry-run and repeat-safe migration
* focused compatibility and entitlement tests
* active documentation updates

The first implementation will not include:

* nested Unit or Suite management
* automatic classification inference
* address-based property classification
* new tenant or resident workflows
* external assistant API endpoints

## Follow-up: personal assistant integration

The next architectural phase will define a read-only API for the owner's
personal assistant application. That work will receive a separate security and
authorization decision covering scoped credentials, versioned endpoints,
property-level access, rate limits, revocation, auditing, and response data
boundaries. A future public integration platform or two-way write API is not
authorized by this ADR.
