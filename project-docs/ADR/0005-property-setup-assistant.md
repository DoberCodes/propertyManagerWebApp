# ADR 0005: Property Setup Assistant

Status: Implemented
Date: 2026-06-12
Accepted: 2026-06-12
Amended: 2026-08-19
Decision Source: Manual

## Context

The property creation wizard now helps users get to useful value quickly by collecting basics, selecting equipment, and optionally creating suggested maintenance tasks.

That wizard should stay lightweight. It is not the right place for a full property audit because users need to reach the core app quickly.

Maintley still needs a way to help users discover systems, equipment, records, and maintenance opportunities they may not know to track. This is especially important for existing properties and for users who want to improve a property record over time.

## Decision

Create a future property-level assistant called "Property Setup Assistant."

This assistant should:

- Live on the property detail page as a banner/card near the top of the page.
- Be discoverable without adding another primary tab.
- Be optional and dismissible.
- Work for existing and future properties.
- Allow users to continue over time.
- Avoid acting like onboarding or a required checklist.

Example banner copy:

```text
Property Setup Assistant

Build a more complete record of your property and discover maintenance opportunities.

Progress: 5 of 18 reviewed

[Continue Setup]
```

## Structure

The assistant should be room/area based.

Example areas:

- Kitchen
- Bathrooms
- Laundry
- Garage
- Exterior
- Utility Systems
- Safety
- Attic
- Basement

Each item should support three states:

- `Present`: create or connect the relevant equipment record and offer suggested maintenance.
- `Not Present`: no future suggestions and no negative impact.
- `Unknown / Skip`: user can revisit later.

Example:

```text
Laundry

[ ] Washer
[ ] Dryer
[ ] Utility Sink
```

If the user marks `Dryer` as present, Maintley can suggest tasks such as:

- Clean Dryer Vent
- Inspect Vent Termination
- Inspect Flexible Vent Hose

If the user marks `Water Heater` as present, Maintley can suggest tasks such as:

- Flush Water Heater
- Test Relief Valve
- Inspect Connections

## Relationship to Home Health

This section records the original implementation direction. ADR 0017 later
removed Home Health and score-based framing from the Dashboard. ADR 0006 now
defines category-based Maintley Intelligence readiness as the replacement.

Do not create a separate completion score.

The assistant may contribute reviewed property and equipment context to the
shared Maintley Intelligence readiness calculation. It must not create a
separate completion score.

Items marked `Not Present` must not reduce readiness. Readiness should consider
only applicable records and should explain the benefit supported by the saved
context.

## UX Rules

- The assistant is not required.
- Users can skip for now at any time.
- Users can complete one area at a time.
- Progress should communicate reviewed items, not moral success or failure.
- Once complete, the banner can collapse to a completed state and remain available for review.

## Consequences

- The property creation wizard remains fast.
- Existing properties get a path to richer records.
- The assistant becomes the bridge between property records, equipment, suggested maintenance, tasks, and maintenance history.
- Future implementation should follow `project-docs/docs/UX/MOBILE_UX_GUIDE.md`, especially progressive disclosure and one decision per screen.

## MVP Implementation Notes

The first implementation adds:

- A property detail page banner/card.
- A mobile-friendly modal organized by area.
- `Present`, `Not Present`, and `Unknown` item states.
- Stored progress on `properties/{propertyId}.setupAssistant`.
- Equipment/system creation or reuse for items marked present.
- Suggested recurring task creation for present items, using the existing suggested maintenance templates.

Future iterations can add richer Maintley Intelligence readiness integration,
completed-state dismissal behavior, and more detailed room/property-record
fields.

## 2026-08 focused-entry amendment

The property-level assistant begins with three optional paths:

- `10-minute essentials`: a short review of common safety, utility, laundry,
  and exterior items.
- `Continue room by room`: the complete area-based review.
- `Upload an existing report`: a handoff to the existing Property Knowledge
  Acquisition document workflow.

All paths preserve the same property-owned Equipment, Task, Space, Document,
and relationship models. They do not create parallel setup records.

The two guided review paths are the primary choices. Each shows its own derived
review count and progress bar from the shared saved setup responses: nine
essential items for the short path and all 28 items for the full room-by-room
path. Completing an essential item therefore also advances the full review.
Existing-report upload remains available as a secondary text action below the
guided choices rather than competing as a third setup card.

Existing Equipment may be detected and explained to the user, but detection
does not change the saved setup response or count as reviewed. `Present` and
`Not Present` remain explicit user decisions. A completed area previews the
records, recurring tasks, and Space relationships that will be created or
reused before the user saves.

## 2026-08 equipment-detail amendment

Selecting `Present` progressively expands the item in place. It does not open
a second modal. The expanded row may describe one or more physical Equipment
records, an optional guidance-relevant subtype, and the accepted Spaces for
each record. Existing Equipment is reused when identified; users may add
another instance when a property has several of the same type.

Distributed safety devices remain separate physical Equipment records. For
example, smoke detectors in five Spaces are five records rather than one
record linked to five Spaces. A single system may still connect to several
Spaces when that accurately describes the physical asset. The Setup Assistant
stores instance preparation within setup progress, while Equipment and
canonical `propertyKnowledgeLinks` remain authoritative after saving.

Users may create a missing Space from the expanded item. This is an explicit
Space creation action, checks existing active and archived names first, and
connects the accepted Space to the current Equipment instance. The final
review names every Equipment record, subtype, Space connection, and generated
Space before creation. Missing subtype or Space details remain optional and do
not block setup.

The pre-save review uses a bounded dialog with a fixed header and actions. It
leads with compact Equipment, Space, and recurring-task counts; complete record
details remain available in collapsed sections with their New or Existing
status. Only conflicts that prevent saving, such as an archived matching Space,
are shown by default. The post-save Quick Setup Review remains the record of
what was actually saved.

When a setup area resolves to exactly one active matching Space, newly marked
Present Equipment in that area begins with the Space selected. This includes a
Space explicitly added earlier in the same setup step. The selection remains
editable. Multiple active matches are treated as ambiguous and remain
unselected so Setup does not guess between Spaces.

Setup task suggestions respond to guidance-relevant Equipment subtypes. A
tank-style water heater may suggest tank flushing, while a tankless water
heater replaces that suggestion with a descaling or manufacturer-service
review. When several Equipment records share one setup item, each generated
Task connects only to the Equipment and Spaces for which that suggestion is
applicable. Changing setup details never silently deletes an already saved
Task.

## 2026-07 homeowner maintenance access update

Recurring maintenance and setup-generated recurring tasks are part of the core
homeowner workflow. The Setup Assistant must allow Free users to review and
create suggested recurring tasks. Maintley Intelligence may provide deeper
premium interpretation, but the task creation required to maintain one home is
not a premium capability.
