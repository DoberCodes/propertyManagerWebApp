# ADR 0004: Suggested Maintenance in Property Creation

Status: Implemented
Date: 2026-06-12
Accepted: 2026-06-12
Decision Source: Manual

## Context

New users can add a property and end up with no appliances/systems, no tasks, and no history. That makes the core Maintley loop harder to understand and forces users to remember common property care tasks manually.

The product direction is to teach the property -> appliances/systems -> tasks -> maintenance history loop through use, without adding a separate tutorial or a detached "starter tasks" feature.

## Decision

New property creation includes optional "Suggested Maintenance Tasks" setup steps.

Users can:

- Select common appliances and systems that exist in the property.
- Expand an optional additional systems list for less-universal items.
- Keep or remove suggested recurring maintenance tasks for those selections.
- Create selected starter appliance/system records even when task suggestions are skipped.
- Skip suggested maintenance entirely.

When saved, Maintley creates appliance/system records and recurring task records linked to the new property. These tasks use the `Suggested Maintenance` category and are intended as editable starting points.

User-facing language should avoid implying certified, required, or professionally prescribed maintenance. The experience uses "Suggested Maintenance Tasks" and includes a disclaimer that maintenance needs vary by property, equipment, manufacturer guidance, age, usage, climate, and local conditions.

## Consequences

- New properties can start with useful structure instead of empty states.
- Suggested tasks should remain editable and optional.
- The default list should stay compact; additional systems should remain discoverable without overwhelming the creation flow.
- Suggested task groups should stay collapsed by default so setup remains scannable as the template library grows.
- Architecture/data docs should treat this as implemented behavior, not just product direction.
- Future template expansion should keep the disclaimer and avoid authoritative labels such as "required maintenance" or "certified schedule."
