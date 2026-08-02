# ADR 0036: Connected Property Knowledge Model

Status: Accepted - phased implementation

Date: 2026-07-31

Related ADRs:

* `0001-remove-units-from-core-experience.md`
* `0007-maintenance-events-as-historical-source-of-truth.md`
* `0011-property-knowledge-acquisition.md`
* `0012-parts-knowledge-catalog.md`
* `0014-property-memory-change-review.md`
* `0023-property-documents-as-first-class-records.md`
* `0033-property-type-and-classification-taxonomy.md`

## Context

Maintley has evolved from a maintenance tracker into a system that preserves a
property's operational memory.

Early features could be understood through a simple hierarchy:

```text
Property
└── Equipment
    └── Documents
```

That hierarchy no longer represents how property knowledge is actually related.

Examples include:

* A paint color or finish may be used in several spaces.
* One filter specification may be used by multiple HVAC units.
* A document may explain an equipment item, a space, a task, a Maintenance
  Event, a supply, or the property as a whole.
* Fertilizer relates to a lawn or exterior space rather than to equipment.
* A task may use supplies and act on one or more equipment records.
* Equipment exists within a physical location.

Modeling these relationships through nested ownership would duplicate records,
make updates inconsistent, and force new property knowledge into whichever
feature happened to introduce it.

The current implementation is partially aligned with this direction. Equipment
and tasks are property-scoped, Property Documents are moving toward first-class
records under ADR 0023, and first-class property Spaces now provide descriptive
location records. First-class Supplies now preserve product specifications and
connect to Equipment, Spaces, and Tasks. Several compatibility paths still use
embedded arrays or unstructured location fields, and the complete relationship
contract remains phased.

## Decision

The Property is the root of long-lived homeowner knowledge.

The initial connected knowledge domain includes independent property-owned
records for:

* Spaces
* Equipment
* Supplies
* Documents
* Tasks

Existing property-scoped operational records remain independent as well,
especially Maintenance Events. This decision does not demote Maintenance
Events as the historical source of truth for completed work. Account-scoped
directories such as Contractors remain outside this property-knowledge
ownership model and continue using their existing association contracts.

Maintley Intelligence consumes these records and their relationships as a
derived, explainable system. Intelligence may persist bounded derived evidence
or caches, but it does not become an authoritative owner of property knowledge.

Logical ownership and physical Firestore nesting are separate concerns. A
property-owned record must carry the property's identity and access boundary;
it does not need to be stored in a Firestore subcollection beneath the property.

## Architectural Philosophy

Maintley models a property as a connected collection of knowledge rather than
as isolated feature modules. New long-lived homeowner information should
generally become a property-level record linked to other entities through
relationships instead of being nested beneath an individual feature.

In short:

```text
Everything belongs to the Property.
Relationships describe how the knowledge is connected.
```

Within the property-knowledge domain, this principle governs future ownership
decisions. Manuals do not belong to equipment, paint does not belong to rooms,
and supplies do not belong to a single equipment item. Each is property
knowledge that may relate to one or many other records.

## Conceptual Architecture

```text
Property
├── Spaces
├── Equipment
├── Supplies
├── Documents
├── Tasks
└── Maintenance Events
        │
        └── typed relationships
                ↓
        Maintley Intelligence
        derived guidance and explanations
```

Collections are independent. Relationships express location, use, support,
work, and documentation without changing ownership.

Example relationships include:

```text
Equipment
├── located in → Space
├── uses → Supply
├── documented by → Document
└── acted on by → Task

Supply
├── used by → Equipment
├── used in → Space
└── consumed by → Task

Document
├── documents → Property
├── documents → Equipment
├── documents → Space
├── documents → Task
├── documents → Maintenance Event
└── documents → Supply

Task
├── acts on → Equipment
├── occurs in → Space
├── uses → Supply
└── results in → Maintenance Event
```

The labels shown to users may differ from these internal relationship names.
Relationship meaning must remain plain, deterministic, and explainable.

## Relationship Contract

Relationships are references, not ownership transfers.

Every relationship must stay within one property unless a later ADR explicitly
defines a safe cross-property relationship. The server and Firestore rules must
validate that both endpoints belong to the same authorized property and
account. References to account-scoped supporting records, such as Contractors,
remain outside this generic relationship contract unless a later implementation
decision defines their endpoint and authorization rules.

A stable single-valued relationship may be represented directly on a record.
For example, equipment may reference its primary `spaceId`.

Many-to-many relationships use one canonical typed relationship record rather
than independently maintained arrays on both endpoints. The planned shape is:

```text
propertyKnowledgeLinks/{linkId}
```

with fields such as:

```text
accountId
propertyId
fromType
fromId
relationshipType
toType
toId
createdAt
createdBy
source
```

The first implemented relationships are Equipment `located_in` Space and Task
`occurs_in` Space. They use the canonical fields above plus `updatedAt` and
`updatedBy`. Their endpoint types
are constrained to `equipment` or `task` and `space`, and their source is
`manual`. The trusted
write builds a deterministic SHA-256 document ID from the property, both
endpoints, and relationship type. Direct client writes are denied. Account
readers may resolve links. Account managers connect Equipment, while users with
task-management permission connect Tasks. Callable functions validate the
Property, source record, Space, account boundary, and archived state.
The implementation queries one indexed endpoint at a time and filters the
constrained relationship type server-side, so this first phase does not require
a composite index.

Document relationships are also implemented through the canonical
`documents` relationship. A Document is always the `from` endpoint and may
document Equipment, a Space, a Task, or a Supply within the same Property.
Account managers replace these accepted connections through a trusted callable;
direct client writes to relationship records remain denied. The callable
validates every endpoint and mirrors the accepted IDs into the first-class and
embedded Document records for compatibility. Equipment, Task, Space, and Supply
views derive their Document lists from canonical relationships while continuing
to recognize legacy link arrays during migration.

One Task may occur in several Spaces. Task creation and editing expose an
optional multi-select. The singular free-text `location` field is deprecated
and no longer appears in the current Task experience or receives new manual
writes. Existing values remain stored during a safe migration period. New
recurring Task instances inherit the accepted Space links from the Task that
generated them. Deleting a Task removes its relationship records without
deleting the Space.

Derived inverse views such as “contains equipment” are calculated from the
canonical relationship and do not become a second source of truth.

Relationships proposed by document processing or Maintley Intelligence remain
suggestions until accepted through the established Property Memory review
boundary. Maintley must never silently connect or modify authoritative records
based only on inference.

## Spaces

Spaces are generalized physical locations within a property, not strictly
interior rooms.

Examples include:

* Living Room
* Kitchen
* Garage
* Mechanical Room
* Attic
* Roof
* Exterior
* Lawn
* Pool

Spaces are descriptive location records. They do not reintroduce the legacy
Unit model and do not create ownership, tenancy, billing, door-count, access,
or separate-property boundaries. A business property may describe a physical
area as a Space without turning that Space into an independently managed Unit.

The first implemented Space contract uses the top-level `propertySpaces`
collection. Each record contains:

```text
accountId
propertyId
name
type
notes (optional)
sortOrder (optional)
isArchived
source
createdBy
updatedBy
createdAt
updatedAt
```

Supported `type` values are `interior`, `utility`, `storage`, `exterior`,
`grounds`, `amenity`, and `other`. The record name remains flexible so a user
can describe a Living Room, Mechanical Room, Roof, Lawn, Pool, or another place
without forcing every real-world location into a large taxonomy.

Maintley uses **Space** and **Spaces** consistently in implementation,
documentation, and user-facing language. It does not use "Room" as the name
of this entity because many valid Spaces are not rooms.

`sortOrder` supports deliberate future ordering without requiring drag and drop
in the first experience. `isArchived` is present from the first schema version
so referenced Spaces can later be retained instead of deleted. Iconography may
be added as presentation metadata in a future phase, but this implementation
does not prematurely define an icon contract.

Existing task location text and equipment `unitId` or `suiteId` location fields
are temporary compatibility fields. Task location text is hidden from current
Task forms, cards, search, and filters while its stored value remains available
to legacy history and migration readers. A dry-run-first migration may create a
Task-to-Space link only when the normalized legacy value exactly matches one
active Space in the same account and Property. Unmatched and ambiguous values
remain untouched for review. Users may explicitly connect Equipment or Tasks
to one or more Spaces, and the Space detail experience derives its equipment
and task lists from accepted relationship records.
Referenced Spaces are archived rather than deleted so historical location
context remains resolvable. Property Details includes an archived-Space view and
an account-manager restore action.

## Supplies

Supplies represent durable property knowledge about materials, parts,
consumables, and product specifications.

Examples include:

* HVAC filter specifications
* Refrigerator water filters
* Paint colors and finishes
* Lawn fertilizer
* Pool treatment products
* Replacement belts, bulbs, and batteries

The first implementation models what the property uses, not how many items are
currently in stock. Purchase records, quantities, shopping behavior, and vendor
catalog data remain deferred.

The first implemented Supply contract uses the top-level `propertySupplies`
collection. Each record contains:

```text
accountId
propertyId
name
type
manufacturer (optional)
modelOrSku (optional)
barcodeValue (optional)
partNumber (optional)
size (optional)
details (optional)
material (optional)
voltage (optional)
mervRating (optional)
compatibility (optional)
replacementInterval (optional)
notes (optional)
isArchived
source
createdBy
updatedBy
createdAt
updatedAt
```

Supported types are `filter`, `paint_and_finish`, `lawn_and_garden`,
`pool_and_spa`, `electrical`, `plumbing`, `hardware`, `cleaning`, and `other`.
The flexible name, identifiers, product specifications, and replacement details
preserve what a homeowner is likely to need again without turning the record
into inventory. Barcode capture is a reviewed input path: Maintley searches the
Property for an existing identifier before prefilling a new Supply, and never
saves a scanned result automatically.

Equipment, Spaces, and Tasks connect to a Supply through canonical `uses`
relationships. One Supply may be used by several records, and the inverse view
is derived rather than copied onto the Supply. Account managers manage Supply
records and connections from the first-class Property Supplies page. Supplies
and barcode capture are available on every active plan; role permissions
continue to control changes. Equipment pages derive and display their connected
Supplies without owning or copying them. Referenced Supplies are archived
instead of deleted and may later be restored. New relationships cannot be made
to an archived Supply or archived Space.

## Documents

Documents remain first-class property records under ADR 0023. They link outward
to the records they explain and are not owned by equipment, tasks, spaces, or
supplies.

One document may relate to several records. For example, a service report may
document the property visit, two equipment items, a completed Maintenance Event,
and a recommended task without being duplicated into four separate owners.

The first implemented Document relationship endpoints are Equipment, Space,
Task, and Supply. Maintenance Event relationships remain reserved until the
completion-history migration defines their authoritative endpoint. Existing
maintenance-event, contractor, warranty, and legacy part references are
preserved but are not promoted automatically by this phase.

Document editing uses progressive multi-select controls for the supported
endpoints. Contextual upload and accepted Property Memory changes may create an
explicit canonical connection. Inferred connections still require review and
are never accepted silently.

## Principles

### Property owns knowledge

All long-lived homeowner knowledge belongs to a property and remains within its
account and permission boundary.

### Collections are independent

Equipment does not own documents or supplies. Spaces do not own paint. Tasks do
not own the materials they use.

### Relationships are many-to-many when reality requires it

A supply, document, task, or space may relate to several records. The model must
not force a false single parent merely to simplify one screen.

### Provenance remains visible

Created and inferred relationships must retain enough source information to
explain why they exist and how they may be corrected.

### Derived experiences do not duplicate authority

Dashboard, Equipment Hub, inventory, Property Memory, and Intelligence views
resolve the connected records. They must not create feature-specific copies of
the same property knowledge.

## Rationale

This model:

* eliminates duplicated property information
* supports shared supplies and product specifications
* supports paint and materials used across several spaces
* gives documents one property-owned record with several contexts
* supports future barcode and identifier workflows
* provides a foundation for future inventory capabilities
* allows new property knowledge types without creating new ownership trees
* gives Maintley Intelligence richer, explainable context
* strengthens Property Memory as a coherent model of the home

“Connected Property Knowledge Model” is preferred over “Property Knowledge
Graph” in product and architectural communication. The model has graph-like
relationships, but the selected name describes the homeowner value without
introducing unnecessary AI or enterprise terminology.

## Consequences

### Positive

* Cleaner ownership boundaries
* Better representation of real property relationships
* Reduced duplication and synchronization risk
* More reusable documents, supplies, and location context
* Easier expansion of Property Memory
* Stronger inputs for explainable Maintley Intelligence

### Costs and risks

* Relationship creation and correction require additional UI.
* Relationship queries require deliberate indexes and bounded query patterns.
* Rules and trusted writes must validate both relationship endpoints.
* Existing embedded documents and unstructured locations require compatibility
  adapters and phased migration.
* Generic relationships can become difficult to understand unless endpoint and
  relationship types remain constrained.

## Implementation Direction

Implementation will be phased and requires a separate approved implementation
plan before schema or UI changes begin.

1. Define canonical Space, Supply, and relationship contracts, including
   provenance, endpoint types, IDs, indexes, and permission validation.
2. Introduce read adapters that preserve current Equipment, Task, Document, and
   location behavior.
3. Add first-class Spaces without reintroducing Units or changing access scope.
4. Add Supplies as product and specification knowledge without inventory counts.
5. Add canonical many-to-many relationship records and trusted write paths.
6. Migrate Property Documents and existing links through ADR 0023 compatibility
   boundaries.
7. Add progressive linking and correction UI.
8. Allow Maintley Intelligence to consume accepted relationships with visible
   evidence and explanations.
9. Update the current Data Model documentation only as each phase becomes real.

No migration may delete or hide existing homeowner records. Compatibility reads
must remain until backfill and validation prove that the new records are complete.

## Implementation Tracking

- [x] Accept the Connected Property Knowledge Model as Maintley's target ownership philosophy.
- [x] Approve the Space record and type contract.
- [x] Approve the Supply record and identifier contract.
- [x] Approve the first canonical Equipment-to-Space relationship contract and allowed endpoint types.
- [x] Implement permission rules and trusted Equipment-to-Space relationship writes.
- [x] Approve and implement the canonical Task-to-Space relationship contract.
- [x] Preserve Task-to-Space relationships across recurring Task generation and deletion.
- [x] Add compatibility adapters and migration validation for existing locations and document links.
- [x] Add the first progressive Space management experience to Property Details.
- [x] Add the first progressive Equipment-to-Space linking and correction experience.
- [x] Add progressive Task-to-Space linking and Space task context.
- [x] Replace current Task Location UI, search, and filters with accepted Space links.
- [x] Add archived-Space recovery and a trusted restore action.
- [x] Add a dry-run-first exact-match legacy Task location migration utility.
- [x] Add the first Supply management and Equipment, Space, and Task relationship experience.
- [x] Promote Supplies to a first-class Property page and move barcode capture to the canonical Supply workflow.
- [x] Replace Equipment-owned Supply writes with derived connected-Supply views.
- [x] Add a dry-run-first, repeat-safe migration for embedded Equipment service items.
- [x] Add canonical Document-to-Equipment, Space, Task, and Supply relationships.
- [x] Add progressive Document connection editing and derived contextual views.
- [x] Add a dry-run-first, repeat-safe Document relationship migration with unresolved-reference reporting.
- [ ] Connect accepted relationships to explainable Maintley Intelligence consumers.
- [x] Update current data-model documentation for the first Space phase.

## Deferred

This ADR does not introduce:

* Purchase history
* Supply inventory counts
* Shopping lists
* Automatic supply recommendations
* Vendor catalogs
* Cross-property relationship graphs
* Automatic relationship acceptance
* A generic user-facing graph editor
* Unit-level ownership, tenancy, access, or billing

These capabilities require later product and architectural decisions.

## Success Criteria

The decision is implemented when:

* Spaces, Equipment, Supplies, Documents, and Tasks are independent
  property-owned records.
* Many-to-many relationships have one canonical, validated source of truth.
* Existing document and location information remains available through the
  migration.
* Spaces do not create Unit-like ownership or permission boundaries.
* Documents and supplies can relate to several records without duplication.
* Maintley Intelligence can explain which accepted records and relationships
  support its guidance.
* Current architecture and data-model documentation reflects the shipped
  contracts.
