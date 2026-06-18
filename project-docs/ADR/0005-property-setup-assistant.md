# ADR 0005: Property Setup Assistant

Status: Accepted
Date: 2026-06-12
Accepted: 2026-06-12
Decision Source: Manual

## Context

The property creation wizard now helps users get to useful value quickly by collecting basics, selecting appliances/systems, and optionally creating suggested maintenance tasks.

That wizard should stay lightweight. It is not the right place for a full property audit because users need to reach the core app quickly.

Maintley still needs a way to help users discover systems, appliances, records, and maintenance opportunities they may not know to track. This is especially important for existing properties and for users who want to improve a property record over time.

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

- `Present`: create or connect the relevant appliance/system record and offer suggested maintenance.
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

Do not create a separate completion score.

The assistant should eventually feed reviewed results into Home Health, especially a `Property Records` or similar category.

Users should not be penalized for items marked `Not Present`. Home Health should only consider reviewed/present items where appropriate.

## UX Rules

- The assistant is not required.
- Users can skip for now at any time.
- Users can complete one area at a time.
- Progress should communicate reviewed items, not moral success or failure.
- Once complete, the banner can collapse to a completed state and remain available for review.

## Consequences

- The property creation wizard remains fast.
- Existing properties get a path to richer records.
- The assistant becomes the bridge between property records, appliances/systems, suggested maintenance, tasks, and maintenance history.
- Future implementation should follow `project-docs/docs/UX/MOBILE_UX_GUIDE.md`, especially progressive disclosure and one decision per screen.

## MVP Implementation Notes

The first implementation adds:

- A property detail page banner/card.
- A mobile-friendly modal organized by area.
- `Present`, `Not Present`, and `Unknown` item states.
- Stored progress on `properties/{propertyId}.setupAssistant`.
- Appliance/system creation or reuse for items marked present.
- Suggested recurring task creation for present items, using the existing suggested maintenance templates.

Future iterations can add richer Home Health integration, completed-state dismissal behavior, and more detailed room/property-record fields.
