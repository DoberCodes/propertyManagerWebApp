# ADR Implementation Status Audit

Date: 2026-08-02

Scope: ADRs 0019 through 0025 and ADR 0032.

## Purpose

This audit reconciles each ADR's status with the current implementation. It is
an evidence-based implementation check, not a production migration or a change
to permission behavior.

Status meanings used here:

* **Implemented** means the decision's required first implementation is present
  and validated in the repository. Deferred future enhancements may remain.
* **Accepted - initial implementation** means a safe foundation exists, but a
  material part of the initial experience or contract remains incomplete.
* **Accepted - phased implementation** means the architecture is active while
  explicitly planned migration, consolidation, or operational validation work
  remains.

## Summary

| ADR | Audited status | Evidence and remaining boundary |
| --- | --- | --- |
| 0019 Property Audit Asset Review | Implemented | Shared audit derivation, stored asset/category views, top priorities, category browsing, asset reviews, and tests are present. |
| 0020 Resolution Engine | Accepted - initial implementation | Typed plans exist for equipment edits, task creation, and maintenance history. The UI uses action labels but does not yet provide the complete guided resolution review. |
| 0021 Storage Write Contract | Accepted - initial implementation | Read/write predicates, manager-only writes, quota checks, and rule tests are present. Maintenance-scoped uploads remain more restrictive than the intended contract. |
| 0022 Account Access Resolver | Accepted - phased implementation | Shared client and server helpers exist, with task/equipment property scoping and tests. Remaining slices and the `membershipRoles` contract still need consolidation. |
| 0023 First-Class Property Documents | Accepted - phased implementation | Collection-first documents, suggestions, relationships, rules, Functions, and compatibility adapters exist. Backfill and retirement of embedded compatibility data remain. |
| 0024 Maintenance Event Migration | Accepted - phased implementation | The shared adapter and canonical write boundary are active. Production inventory, controlled backfill, parity evidence, and compatibility removal remain. |
| 0025 Equipment Terminology | Implemented | Active visible record terminology is Equipment, technical contracts remain compatible, and a build-time regression guard now protects the boundary. |
| 0032 Centralized Entitlements | Accepted - phased implementation | The shared package, grants, rule mirrors, tests, admin flows, and rollout source work exist. Production observation, synthetic-access migration, and later fallback removal remain. |

## Material discrepancies retained intentionally

### Storage maintenance uploads

ADR 0021 describes a narrower maintenance-management upload capability with
more restrictive deletion. Current rules deny maintenance-file uploads to a
maintenance-scoped team member. The stricter behavior is preserved until the
role predicate and rule tests are separately approved.

### Account access normalization

ADR 0022 includes `membershipRoles` in the target context. The current resolver
exposes one effective `userRole` and capability booleans. High-risk task and
equipment consumers use the resolver, while several other data consumers still
use only the accessible-account helper.

### Resolution experience

ADR 0020's typed Resolution Plan foundation exists, but Quick Scan and Property
Audit do not yet show a complete guided review with missing fields, next steps,
and secondary completion options. Existing navigation behavior remains intact.

## Safety and migration boundary

This audit does not:

* change Firestore or Storage permissions;
* run document, maintenance, billing, or account migrations;
* remove legacy compatibility fields or reads;
* mutate historical snapshots or production records; or
* claim operational rollout work is complete without deployment evidence.

The checklists added to each ADR are the authoritative follow-up boundaries for
future implementation work.
