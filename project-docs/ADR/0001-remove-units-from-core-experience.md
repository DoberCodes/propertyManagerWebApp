# ADR 0001: Remove Units From the Core Experience

Status: Accepted
Date: 2026-06-12
Accepted: 2026-06-12
Decision Source: Manual

## Context

Maintley is focusing on the core maintenance loop: properties, appliances/systems, tasks, and maintenance history.

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
