# Analytics Measurement Plan

Last reviewed: 2026-08-03

Related decision: `ADR/0038-product-analytics-and-behavioral-telemetry.md`

## Objective

Maintley analytics answers three product questions:

1. Where do prospective users stop before creating a usable property record?
2. Which intentional action first shows that a user is making Maintley their
   property system?
3. Which workflows create friction or support return use?

Analytics describes product behavior. Firestore remains the source of truth for
customer records and operational state.

## Event Contract

The runtime contract is defined in `src/analytics/analyticsContract.ts`. Only the
parameters allowlisted there may be sent.

| Event | Successful trigger | Primary interpretation |
| --- | --- | --- |
| `signup_started` | A visitor passes the first registration step | Intent to create an account |
| `signup_completed` | Firebase account creation succeeds | Account conversion |
| `property_created` | A property transaction succeeds | First property or additional-property adoption |
| `property_setup_started` | The Setup Assistant opens for an active session | Setup attempt |
| `property_setup_path_selected` | The user chooses essentials, room-by-room, or report upload | Setup intent by preferred input |
| `property_setup_path_completed` | A guided setup path is reviewed and saved | Guided setup value created |
| `property_setup_path_exited` | The user explicitly leaves a selected guided path | Exit location and unsaved-change context |
| `property_setup_stage_viewed` | A setup area becomes active | Setup progression and abandonment location |
| `property_setup_completed` | The accepted setup plan reaches completion | Initial property memory established |
| `equipment_created` | An equipment record is saved | Equipment creation, separated by source |
| `equipment_updated` | An equipment record is updated | Record enrichment without collecting changed values |
| `space_created` | A reviewed manual or generated Space is saved | Property organization, separated by source |
| `supply_created` | A reviewed Property Supply is saved | Reusable property knowledge, separated by entry point |
| `task_created` | A task is saved | Action planning, separated by source |
| `task_completed` | Task completion succeeds | Maintenance execution |
| `maintenance_history_added` | A Maintenance Event is recorded | Preserved service knowledge |
| `document_uploaded` | One upload workflow is saved to the property | Intentional property-memory expansion |
| `property_scan_completed` | Quick Scan or Property Audit persistence succeeds | User-requested property review |
| `report_downloaded` | A report export is generated | Data portability and reporting use |
| `workflow_validation_blocked` | A controlled validation rule prevents progress | Correctable user-facing friction |
| `workflow_error_shown` | A workflow fails and the user receives an error | Operational friction, using controlled codes only |

Legacy Setup Assistant proposal and plan events remain supported for historical
continuity. New reporting should use the start, stage, and completion events for
the primary setup funnel.

## Action Source

Creation and completion events that can occur through several paths use one of:

| Value | Meaning | Counts as self-directed value |
| --- | --- | --- |
| `user` | The user intentionally initiated the action | Yes |
| `setup_assistant` | Setup created the record from accepted onboarding choices | No |
| `ai_suggestion` | The user accepted an extracted or suggested record | Analyze separately |
| `import` | Duplication or import created the record | No |
| `system` | Background application behavior created the result | No |

`ai_suggestion` remains intentional acceptance, but it is kept separate so the
team can compare guided Intelligence value with independently authored records.

## Core Funnels

### Acquisition and setup

```text
landing page view
-> signup_started
-> signup_completed
-> property_created
-> property_setup_started
-> property_setup_completed
```

Setup abandonment is `property_setup_started` without
`property_setup_completed` in the selected reporting window. Break down the last
`property_setup_stage_viewed` event to locate the exit stage. Explicit closes
also emit `property_setup_path_exited` with the controlled `exit_reason` and
whether unsaved choices existed; a browser close or expired session remains a
derived abandonment rather than a misleading synthetic exit.

For the optional property-level assistant, use `property_setup_path_selected`,
`property_setup_path_completed`, and `property_setup_path_exited` to compare the
focused essentials and room-by-room paths. Report upload continues into the
existing `document_uploaded` funnel after its path-selection event. An explicit
exit is useful context, but cohort abandonment should still be derived from a
selected path without a later completion.

### Self-directed activation

After setup, treat the first successful event with `action_source = user` from
this set as the first self-directed value signal:

* `document_uploaded`
* `equipment_updated`
* `task_created`
* `task_completed`
* `maintenance_history_added`
* `property_scan_completed`
* an additional `property_created` where `property_sequence > 1`

Do not use Setup Assistant-created equipment or tasks as proof of activation.

### Activated homeowner

`activated_homeowner` is a derived metric, not a client event. A homeowner is
activated when they create a Property and then complete any two different
intentional value signals within 14 days:

* manual `document_uploaded`;
* user-authored `task_created`;
* user-completed `task_completed` or `maintenance_history_added`;
* user-requested `property_scan_completed`;
* user-authored `equipment_updated`; or
* an accepted reviewed suggestion represented by one of those events with
  `action_source = ai_suggestion`.

Setup-generated records, imports, route views, and system activity do not count.
Report median time from `signup_completed` to the first qualifying signal and
to activation. Preserve the individual signals so the definition can be
re-evaluated without changing collection behavior.

### Retention

Report one-, seven-, and thirty-day return as an authenticated user with a
meaningful product event on or after that interval from `signup_completed`.
Route views alone should be reported separately from meaningful return activity.

## GA4 Configuration Handoff

Create event-scoped custom dimensions for:

* `action_source`
* `registration_mode`
* `starting_audience`
* `property_type`
* `equipment_type`
* `equipment_category`
* `setup_stage`
* `setup_path`
* `scan_type`
* `workflow_name`
* `workflow_stage`
* `reason_code`
* `error_code`

Create user-scoped custom dimensions for `role_family` and `plan_family`.

Mark `signup_completed` and `property_setup_completed` as GA4 key events. Build
closed and open funnel explorations for acquisition/setup, and a path exploration
beginning at `property_setup_completed`. Self-directed activation and seven-day
return should be derived in explorations or exported analysis rather than emitted
as synthetic client events.

Use DebugView in Beta before validating production events. Production and Beta
must use separate Analytics properties or data streams. Local development keeps
analytics disabled unless a developer explicitly enables debug collection.

## Privacy Boundary

Never send:

* names, email addresses, property names, or addresses;
* Firestore document IDs, property IDs, task IDs, or document IDs;
* task titles, notes, descriptions, or maintenance notes;
* equipment brand, model, serial number, or part number;
* filenames, file contents, extracted text, or URLs containing record slugs; or
* raw exception messages.

Firebase Authentication UID may be passed only through the GA4 User-ID API. It
must not appear as an event parameter or custom dimension.

## Change Control

When adding or changing an event:

1. State the product question it answers.
2. Add or update the typed event and event-specific parameter allowlist.
3. Use controlled categories, counts, or booleans.
4. Add privacy-boundary tests.
5. Update this measurement plan.
6. Validate the event in Beta DebugView before relying on production reporting.
