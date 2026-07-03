# ADR 0007: Maintenance Events As Historical Source Of Truth

Status: Accepted - initial implementation
Accepted: 2026-06-18
Date: 2026-06-18
Decision Source: ADR Gap Audit

## Context

The data model evolved to preserve long-term maintenance history in event records, with downstream guidance derived from those events.

- project-docs/docs/Architecture/DATA_MODEL.md:68 - ├── Maintenance Events
- project-docs/docs/Architecture/DATA_MODEL.md:82 - Maintenance Events may reference:
- project-docs/docs/Architecture/DATA_MODEL.md:130 - * Maintenance Events
- project-docs/docs/Architecture/DATA_MODEL.md:264 - * Maintenance Events
- project-docs/docs/Architecture/DATA_MODEL.md:305 - Operational history belongs in Maintenance Events.
- project-docs/docs/Architecture/DATA_MODEL.md:387 - * Maintenance Events


## Decision

- Maintenance Events are the historical source of truth for maintenance operations and timelines.
- Operational history must be recorded in events, not fragmented across derived summaries or transient UI fields.
- Any derived views must reference or aggregate events without taking ownership of the historical record.


## Reasoning

- A stable event timeline supports auditability, troubleshooting, and recommendation quality.
- Centralized historical records reduce drift and contradictory interpretations.
- Derived systems can evolve safely when historical ownership boundaries are explicit.


## Alternatives Considered

- Keep maintenance history distributed across multiple collections and read models.
- Store only the latest maintenance state without event-level history.
- Let intelligence summaries become the practical history store.


## Consequences

- Positive: stronger traceability and consistency for maintenance records.
- Positive: clearer input data for recommendations and overdue logic.
- Cost: migrations and backfills are required when consolidating legacy history.


## Non-Goals

- Replacing event history with snapshot-only records.
- Storing conflicting historical narratives in parallel collections.
- Treating derived recommendation data as canonical history.


## Related Documentation

- project-docs/docs/Architecture/DATA_MODEL.md:68
- project-docs/docs/Architecture/DATA_MODEL.md:82
- project-docs/docs/Architecture/DATA_MODEL.md:130
- project-docs/docs/Architecture/DATA_MODEL.md:264
- project-docs/docs/Architecture/DATA_MODEL.md:305
- project-docs/docs/Architecture/DATA_MODEL.md:387
