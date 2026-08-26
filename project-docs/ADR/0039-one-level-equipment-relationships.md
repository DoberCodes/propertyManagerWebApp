# ADR 0039: One-Level Equipment Relationships

Status: Accepted

Date: 2026-08-26

Related ADRs:

* `0007-maintenance-events-as-historical-source-of-truth.md`
* `0036-connected-property-knowledge-model.md`
* `0037-structured-work-sessions.md`

## Context

Maintley currently treats each Equipment record as one maintainable asset. This
preserves separate identity, location, documentation, and maintenance history,
but it creates an incomplete experience for two common property patterns.

Repeated peer equipment may include:

* smoke detectors;
* carbon-monoxide detectors;
* combination smoke and carbon-monoxide detectors;
* fire extinguishers; and
* similar devices installed throughout a Property.

One Property may contain several models or variants of the same broad Equipment
type. Each physical item may have its own manufacturer, model, serial number,
installation date, status, and Space.

Composed systems may include:

* an HVAC system with an indoor unit, outdoor condenser, and thermostat;
* a pool system with a pump, heater, filter, and controller;
* a well system with a pump, pressure tank, and treatment equipment; or
* a solar system with panels, inverters, batteries, and controls.

Displaying every physical item as an unrelated top-level Equipment card creates
noise and hides the real-world system or collection the homeowner understands.
Combining every item into one embedded record, however, would allow only one set
of identity fields and would make component-specific history, location, tasks,
documents, and supplies ambiguous.

The Property Setup Assistant already permits several physical instances of the
same type and current documentation correctly requires separate canonical
Equipment records for distributed safety devices. The missing concept is a
bounded relationship and derived presentation that keeps those records distinct
without forcing every record to appear independently in the primary Equipment
experience.

## Decision

Maintley will support a single level of relationship between property-owned
Equipment records.

A combined Equipment record may provide the primary Equipment experience for a
real-world system or collection. Physical Equipment records may be attached to
that primary record while retaining their own identity and relationships.

This is a relationship between independent Property-owned records. Attached
Equipment is not embedded inside the primary record and ownership does not move
from the Property.

The main Equipment Hub, cards, categories, and existing user-facing terminology
remain intact. This decision does not introduce `parent`, `child`, `group`,
`member`, or `assembly` as required customer-facing vocabulary. The existing
Equipment detail experience may progressively disclose attached Equipment
without redesigning the primary navigation or renaming existing displays.

## Architectural Philosophy

Maintley models the Property first and uses relationships to describe how its
knowledge is connected.

```text
Property
├── Equipment: Smoke and CO Detectors
│       ├── related Equipment: Hallway Combo Detector
│       ├── related Equipment: Bedroom Smoke Detector
│       └── related Equipment: Basement CO Detector
│
└── Equipment: HVAC
        ├── related Equipment: Indoor Air Handler
        ├── related Equipment: Outdoor Condenser
        └── related Equipment: Thermostat
```

Every record in this example still belongs directly to the Property. The
relationship affects organization and context, not ownership or permissions.

## Record Semantics

Equipment records have one of two internal semantic scopes:

* **physical** - one identifiable maintainable item; or
* **combined** - the primary record through which a system or collection of
  related physical Equipment is presented.

Existing records default to physical behavior when no scope is stored. The
internal scope is not a new required user-facing label.

A physical record stores its own applicable identity and lifecycle information,
including manufacturer, model, serial number, installation date, status, notes,
and classification.

A combined record stores shared system or collection context. It must not be
treated as missing a serial number or model merely because its physical records
hold those values. Maintley Intelligence and completeness reviews must evaluate
identity fields at the appropriate physical-record level and must not double
count a combined record as another physical asset.

## Relationship Contract

The canonical relationship is a typed `part_of` relationship in
`propertyKnowledgeLinks`:

```text
fromType: equipment
fromId: physical Equipment ID
relationshipType: part_of
toType: equipment
toId: combined Equipment ID
```

The relationship must follow the existing ADR 0036 contract:

* both endpoints belong to the same account and Property;
* direct client writes are denied;
* a trusted write validates permissions and both endpoints;
* deterministic relationship identity makes the write repeat-safe; and
* deleting or changing a relationship does not delete either Equipment record.

Additional constraints are required:

* Equipment may be attached to at most one combined Equipment record;
* a combined record may have several attached physical records;
* a combined record may not itself be attached to another Equipment record;
* a physical record with attached Equipment may not be attached elsewhere;
* self-reference is forbidden;
* recursive nesting is forbidden; and
* cross-Property and cross-account relationships are forbidden.

These rules intentionally produce one level rather than a generic Equipment
tree. Relationship readers derive the primary and attached views from the
canonical link; Equipment records do not maintain mirrored ID arrays.

## Tasks and Maintenance History

Tasks and Maintenance Events retain their existing Property ownership and
Equipment relationships.

A Task may apply to:

* the combined Equipment record when the work concerns the complete system or
  collection; or
* one or more physical Equipment records when the work concerns specific items.

Examples include:

* `Test smoke and CO detectors` connected to the combined record;
* `Replace hallway detector` connected to the hallway physical record;
* `Annual HVAC service` connected to the combined record; and
* `Clean outdoor condenser` connected to the condenser physical record.

Completing work continues through the established Task lifecycle and produces
Maintenance Events under ADR 0007. A combined Equipment history may derive
system-wide events plus events explicitly connected to attached Equipment. A
physical Equipment history must not silently include sibling history.

Future Work Sessions may use attached physical Equipment as execution targets,
but this ADR does not implement or require Work Sessions.

## Spaces, Documents, and Supplies

Physical Equipment may connect independently to its actual Spaces, Documents,
and Supplies through the existing canonical relationships.

A combined record may also connect to shared Spaces, Documents, or Supplies when
the information applies to the complete system or collection. Derived displays
must preserve whether a relationship is shared or specific rather than copying
relationships onto every attached record.

Examples include:

* a detector connected to the Hallway Space;
* an HVAC condenser connected to the Exterior Space;
* one HVAC-system service agreement connected to the combined record; and
* one model-specific manual connected only to the physical record it documents.

## User Experience Constraint

This decision adds capability without replacing the existing Equipment
experience.

The implementation must preserve:

* the current Equipment Hub navigation;
* existing Equipment cards and category organization;
* existing Equipment terminology and type labels;
* standalone Equipment behavior; and
* current task, document, supply, and maintenance terminology.

Attached Equipment is hidden from the ordinary top-level Equipment card list by
default and remains reachable from its primary Equipment detail experience.
Search, direct links, reports, exports, and historical references must still be
able to resolve an attached record.

The Equipment detail experience may add a compact, progressively disclosed
section for viewing, adding, editing, removing, or opening attached Equipment.
It should reuse existing create and edit patterns. New role-specific display
language such as `unit` or `component` may not replace existing Equipment labels
without a later approved UX decision.

## Existing Equipment and Conversion

Existing Equipment remains physical and standalone unless the user explicitly
reviews a combine action.

Maintley must not automatically infer or create Equipment relationships from a
matching type, name, Space, task, document, or inspection result.

Converting an existing physical record into a combined record requires a
reviewed plan for its identity fields and existing relationships. If existing
manufacturer, model, serial, installation, or physical-location details need to
move to a new physical Equipment record, the user must see and approve that
result before any authoritative write. The implementation may initially defer
conversion and support only newly created combined records if safe conversion
cannot be completed in the same phase.

Removing an Equipment relationship returns the physical record to ordinary
standalone presentation. It does not delete the record or its history.

## Permissions and Deletion

Relationship management uses the same account-manager boundary as current
Equipment management.

Deleting or decommissioning Equipment must preserve historical continuity:

* removing a relationship does not delete either endpoint;
* deleting a combined record requires its active relationships to be removed or
  reviewed first;
* deleting a physical record removes its relationship through the trusted
  Equipment-deletion boundary; and
* Maintenance Events and other historical records must retain understandable
  references according to their existing deletion and snapshot contracts.

Exact deletion, restoration, and decommissioning behavior must be verified in
the implementation plan before writes are enabled.

## Rationale

This approach preserves accurate identity and history for each physical item
while allowing the product to present the real-world Equipment record the user
expects. It supports both repeated peer devices and composed systems without
creating two separate ownership models.

Using `propertyKnowledgeLinks` follows ADR 0036, avoids embedded arrays and
mirrored relationship state, and gives Tasks, Documents, Supplies, Spaces,
Maintenance Events, Intelligence, and future Work Sessions a consistent record
boundary.

The one-level constraint keeps querying, permissions, deletion, and UI behavior
explainable. Maintley gains useful composition without becoming a general asset
hierarchy system.

## Consequences

### Positive

* Several physical devices can share one primary Equipment experience.
* Every physical record retains its own model, serial number, Space, and status.
* HVAC and similar systems can represent independently serviceable components.
* Shared and component-specific work remain distinguishable.
* The Equipment Hub avoids unnecessary top-level duplication.
* Existing Property ownership and relationship architecture are preserved.
* Future Work Sessions can target the physical records without changing the
  Equipment model again.

### Costs and risks

* Equipment queries must distinguish top-level and attached records.
* Intelligence must distinguish combined completeness from physical identity
  completeness.
* History views need explicit shared-versus-specific aggregation rules.
* Conversion of existing Equipment can be confusing if identity fields move.
* Trusted relationship writes require cycle, scope, and cardinality validation.
* Hiding attached Equipment from the main list must not make it inaccessible to
  search, exports, reports, or direct links.

## Deferred

This ADR does not introduce:

* recursive or unlimited Equipment nesting;
* cross-Property Equipment relationships;
* automatic grouping based on inferred similarity;
* automatic conversion of existing records;
* a redesign or renaming of the Equipment Hub;
* required `system`, `group`, `member`, `parent`, or `child` customer language;
* Work Session implementation;
* supply inventory or consumption;
* topology, wiring, duct, plumbing, or dependency diagrams; or
* generic bill-of-materials or enterprise asset-management behavior.

## Implementation Direction

Implementation should proceed in bounded phases:

1. Extend the Equipment type contract with an optional internal semantic scope.
2. Extend `propertyKnowledgeLinks` with the constrained Equipment `part_of`
   endpoint contract.
3. Add trusted relationship writes with same-Property, cardinality, and
   one-level validation.
4. Add derived readers for primary and attached Equipment without mirrored IDs.
5. Preserve standalone Equipment and current Hub behavior.
6. Add progressive attached-Equipment management inside Equipment details by
   reusing current create and edit patterns.
7. Define and test shared-versus-specific Task and Maintenance Event views.
8. Update Intelligence so combined records do not receive physical identity
   completeness findings or double-count assets.
9. Add deletion, decommissioning, direct-link, search, report, and export tests.
10. Update current Data Model, Features, Permissions, Intelligence, and testing
    documentation as each implementation phase becomes real.

## Implementation Tracking

- [x] Accept the one-level Equipment relationship architecture.
- [x] Preserve current Equipment navigation, cards, categories, and terminology.
- [x] Approve the exact Equipment scope field and compatibility default.
- [x] Approve the canonical Equipment `part_of` endpoint and cardinality rules.
- [x] Implement and test trusted relationship writes.
- [x] Implement derived primary and attached Equipment readers.
- [x] Add progressive management within Equipment details.
- [x] Define and test Task and Maintenance Event aggregation behavior.
- [x] Update Intelligence completeness and counting behavior.
- [ ] Complete manual deletion, decommissioning, search, export, report, and direct-link
  continuity.
- [x] Update current implementation documentation when behavior ships.

## Success Criteria

The decision is implemented when:

* one primary Equipment record can present several related physical Equipment
  records without embedding them;
* each physical Equipment retains independent identity, Space, status,
  relationships, and history;
* combined and physical records remain owned directly by the same Property;
* recursive, cross-Property, and multi-primary relationships are rejected;
* standalone Equipment and current Equipment displays remain unchanged;
* attached Equipment does not clutter the ordinary top-level Equipment list but
  remains addressable everywhere records must resolve;
* Tasks and Maintenance Events distinguish shared from physical-record work;
* Intelligence does not double count combined records or require physical
  identity fields on them; and
* no existing Equipment or history is hidden, deleted, or automatically grouped.
