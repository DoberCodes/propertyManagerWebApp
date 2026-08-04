# Compatibility Boundary Cleanup

Date: 2026-08-02

## Scope

This cleanup consolidates existing access and compatibility behavior. It does
not add product workflows, change permissions, migrate production records, or
remove persisted compatibility fields.

## Completed cleanup

### Account and property access

The remaining property, property-group, Unit, Contractor, property-history, and
account-history data consumers now resolve account and property scope through
`resolveAccountAccessContext`.

The duplicate team-member resolver and role-scoping implementation were removed
from `propertySlice`. Existing tenant invitation handling, assigned-property
groups, owner behavior, family-account behavior, and team-member restrictions
remain intact.

Inert shared-property lookup blocks were removed from the property and
contractor slices. Those helpers always returned empty results because the
shared-properties workflow was already retired. This does not delete historical
records or remove the remaining compatibility types used by older invitation
and export paths.

### Property Memory

Active direct reads of embedded property documents and knowledge suggestions
now cross the shared property-memory adapter. Property Intelligence History uses
the collection-first property-memory hook, so accepted collection records and
embedded compatibility records share one merge boundary.

Aggregate screens that still depend on embedded compatibility mirrors preserve
their existing counts and timelines through the adapter. They are not claimed
as collection-complete until the approved backfill and summary strategy exists.

### Maintenance History

The existing shared maintenance-history adapter remains the only UI-facing
normalization path. The cleanup adds a guard preventing new direct reads of the
legacy `maintenanceHistory` collection outside the property- and account-history
query adapters.

### Embedded Equipment Supplies

Current Equipment create and edit forms no longer carry embedded
`serviceItems`, and the unreachable legacy Parts editor and barcode mutation
paths have been removed. Existing embedded records remain available to
read-only compatibility consumers, including Equipment detail, task context,
record-strength evaluation, and migration tooling.

The compatibility build gate rejects new `serviceItems` object writes or form
targets. Canonical Property Supplies and `uses` relationships remain the only
supported write path.

### Account deletion

Self-service account deletion now builds an explicit deletion manifest, commits
Firestore writes in bounded batches, deletes the documented user-, account-,
and Property-scoped Storage prefixes, and verifies both stores before deleting
the Firebase Auth user. Verification failure keeps the Auth record in place and
returns a support-facing failure instead of reporting a completed deletion.

The cleanup preserves the existing owner-versus-access-only behavior. It does
not introduce ownership transfer or delete historical attribution retained on
records owned by another account.

### Inventory evidence

`inventoryCompatibilityBoundaries.cjs` is a report-only inventory covering
embedded Documents, legacy Maintenance History, legacy account links, and
embedded Equipment Supplies. It requires an explicitly confirmed Firebase
project, rejects apply mode, writes only aggregate JSON beneath `tmp/`, and does
not expose record contents.

### Regression boundaries

The frontend build now rejects:

* direct use of the lower-level accessible-account helper outside
  `accountContext`;
* duplicate client team-member resolution;
* direct embedded property-document or knowledge-suggestion reads outside the
  property-memory adapter; and
* new direct legacy maintenance collection reads outside the approved adapters;
  and
* new embedded Equipment `serviceItems` writes or form targets.

Parity tests cover account owners, ordinary family members, assigned maintenance
team members, unassigned scoped team members, and unchanged unscoped filtering.

## Compatibility intentionally retained

The following remain because removing them would require migration or separate
behavioral approval:

* legacy user/account-link discovery and profile backfill;
* `membershipRoles` contract follow-up;
* embedded property document, suggestion, and provenance mirrors;
* legacy maintenance collection and embedded history reads inside the shared
  adapter;
* legacy property-share types and isolated invitation/export compatibility;
* entitlement fallback adapters; and
* all persisted collection names, route values, and relationship fields; and
* read-only embedded Equipment `serviceItems` until inventory and migration
  evidence prove canonical Supply parity.

## Validation boundary

No migration or deletion command is introduced or executed by this cleanup.
The new compatibility inventory is permanently report-only. Firestore and
Storage Rules remain unchanged and authoritative.
