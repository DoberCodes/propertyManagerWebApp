# ADR 0001: Remove Units From the Core Experience

Status: Implemented
Date: 2026-06-12
Accepted: 2026-06-12
Decision Source: Manual

## Context

Maintley is focusing on the core maintenance loop: properties, equipment, tasks, and maintenance history.

Units and suites add complexity before the core loop is fully clear to users. The codebase still contains unit and suite support, but the current product direction is to keep those concepts out of the primary user experience.

## Decision

Units and suites are not part of the core active experience for now.

Users with apartment-style or multi-unit situations should represent each rental space as its own property when that is simpler.

Examples:

- `123 Main St - Apartment A`
- `123 Main St - Apartment B`

## Consequences

- Do not reintroduce unit/suite navigation or primary workflows unless explicitly requested.
- Keep existing unit/suite data and code paths safe where they still exist.
- Documentation should describe unit/suite support as hidden or deferred, not removed forever.

## Implementation Update: 2026-07-25

The dormant Unit/Suite management UI and its unused current-source write hooks
were retired after a removal-safety audit confirmed that they had no active
route or consumer. Legacy read compatibility remains for equipment locations,
maintenance history, reporting, permissions, export, and cascade deletion.

This cleanup does not permanently remove the Unit/Suite data model. Collection,
field, rule, or production-data removal still requires an inventory-backed
migration and an explicit amendment or superseding architectural decision.
