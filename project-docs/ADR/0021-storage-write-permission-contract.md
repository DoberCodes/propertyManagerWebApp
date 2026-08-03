# ADR 0021: Storage Write Permission Contract

Status: Accepted - initial implementation

Date: 2026-07-06

Related report: `project-docs/reports/2026-07-06-data-model-architecture-risk-audit.md`

## Context

Maintley stores supporting files in Firebase Storage while metadata lives in
Firestore. Current storage rules allow some file writes and deletes based on
read-level account or property access.

That creates a permissions mismatch:

```text
Firestore metadata write
  -> requires management permission

Storage object write/delete
  -> may only require read permission
```

This is risky because file operations can succeed even when the matching
Firestore metadata operation would be rejected.

## Decision

Storage read permission and storage write permission will be separate concepts.

Reads may remain broad enough for authorized account/property users to view the
files they need.

Creates, updates, and deletes must require management-level permission aligned
with the Firestore record that owns or references the file.

Initial contract:

* Property documents: account/property managers may upload or delete.
* Device files: users who can manage the property/device may upload or delete.
* Maintenance files: users who can manage tasks or maintenance for the property
  may upload; deletes remain more restrictive.
* Team member images/files: account managers may upload or delete.
* User profile images: the owning user may upload or delete.
* Feedback attachments: remain function-owned.

Storage rules should not rely on UI-only capability checks.

## Implementation Direction

Add explicit helper predicates in `storage.rules`:

```text
canReadAccount
canManageAccount
canReadProperty
canManageProperty
canManagePropertyMaintenance
```

The first hardening pass should tighten Storage write/delete rules without
changing the customer-facing upload flows.

If a workflow needs broader write ability than the rules should grant directly,
move that workflow behind a Cloud Function instead of widening Storage rules.

## Implementation Tracking

* [x] Separate account and property read predicates from management predicates.
* [x] Require management access for property documents and equipment files.
* [x] Restrict team-member files to account managers.
* [x] Restrict profile images to the owning user.
* [x] Keep feedback attachments function-owned.
* [x] Cover owner, read-only member, outsider, feedback, and quota behavior in
  Storage Rules tests.
* [ ] Define and implement the narrower maintenance-file upload predicate while
  keeping deletion more restrictive.
* [ ] Add role-level rule tests for the approved maintenance uploader role.

The current Storage Rules are stricter than the intended maintenance-file
contract: a maintenance-scoped team member cannot upload maintenance files.
That restriction remains in place until the narrower predicate and its tests
are separately approved; this ADR status does not change permissions.

## Consequences

Positive:

* Read-only users can no longer create or delete files by bypassing the UI.
* Storage and Firestore authorization become easier to reason about together.
* Orphaned file risk is reduced.
* Future document workflows have a clearer security boundary.

Cost:

* Some existing client upload paths may surface permission errors if their UI
  capability checks are too permissive.
* Storage rule tests must cover role-level write behavior, not only reads.
* Some future limited-role upload workflows may need callable functions.

## Non-Goals

* Move all uploads to Cloud Functions in this ADR.
* Redesign every document workflow.
* Change who can read files they are already authorized to view.
* Introduce plan-based Storage permissions.

