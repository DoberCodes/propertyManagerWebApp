# ADR 0024: Maintenance Event Migration Completion

Status: Accepted

Date: 2026-07-06

Related report: `project-docs/reports/2026-07-06-data-model-architecture-risk-audit.md`

## Context

Maintley has already decided that Maintenance Events are the canonical
historical record. Legacy maintenance history records still appear in several UI
and compatibility paths.

This creates a transitional state where both models influence production
behavior:

```text
maintenanceEvents
maintenanceHistory
embedded property/device history
```

The longer both remain active UI concerns, the more likely Maintley is to show
duplicate rows, miss newer records, or calculate costs inconsistently.

## Decision

Maintley will complete the migration to `maintenanceEvents` as the only active
UI-facing maintenance history model.

Legacy maintenance history may remain as migration input and compatibility data,
but UI surfaces should consume a shared maintenance history adapter rather than
querying or merging legacy data independently.

New workflows should write Maintenance Events, not legacy maintenance history.

## Implementation Direction

Phase 1:

* Add or strengthen a shared adapter that normalizes Maintenance Events and
  legacy records into one UI shape.
* Update high-traffic UI surfaces to consume the adapter.
* Stop adding new screen-specific legacy fallbacks.

Phase 2:

* Backfill legacy records into `maintenanceEvents`.
* Mark migrated legacy records where needed.
* Add tests for deduping task completion, invoice acquisition, and manual
  maintenance entry flows.

Phase 3:

* Remove direct UI dependence on legacy maintenance history.
* Reduce or remove legacy Firestore query paths after migration confidence is
  high.

## Consequences

Positive:

* Maintenance History becomes easier to explain and maintain.
* Costs and document references have one historical destination.
* Task completion, invoice acquisition, reporting, and property timelines can
  share the same source.
* Future intelligence rules can reason over a cleaner history model.

Cost:

* Requires careful migration and dedupe testing.
* Legacy records may need provenance or migration markers.
* Some reports and older screens may need adapter updates before direct legacy
  reads can be removed.

## Non-Goals

* Delete legacy data immediately.
* Change the user-facing meaning of Maintenance History.
* Move future/pending task work into Maintenance Events.
* Treat Maintley Intelligence recommendations as historical records.

