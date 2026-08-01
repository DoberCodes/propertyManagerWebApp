# ADR 0037: Structured Work Sessions

Status: Proposed

Date: 2026-08-01

Related ADRs:

* `0007-maintenance-events-as-historical-source-of-truth.md`
* `0036-connected-property-knowledge-model.md`

## Context

Maintley currently models maintenance as discrete Tasks. A Task is generally
pending until its work is completed.

This model works well for a single activity such as:

* Replace an HVAC filter
* Flush a water heater
* Test a GFCI outlet

Many homeowner maintenance activities, however, involve performing the same
operation across several locations or assets. Examples include:

* Replace smoke-detector batteries
* Test smoke detectors
* Inspect windows
* Change several HVAC filters
* Replace air-freshener cartridges
* Winterize hose bibs
* Inspect exterior lighting
* Check fire extinguishers

Representing the activity as one Task loses target-level progress. Representing
it as many Tasks introduces duplication in scheduling, reminders, recurrence,
and completion history.

ADR 0036 establishes a Connected Property Knowledge Model in which Tasks,
Spaces, Equipment, and future property records remain independent and are
connected through typed relationships. Maintley needs an execution model that
can use those connected records without making Tasks themselves into multi-step
workflow containers.

## Decision

Maintley will introduce a reusable **Work Session** concept.

Tasks continue to describe:

> What work should be performed?

Work Sessions describe:

> How is this execution of the work progressing?

A Work Session is a property-owned operational record for one execution of a
Task. It may track progress across several selected targets while preserving a
single Task and one completion lifecycle.

This ADR defines the target architecture. It does not authorize implementation;
a separate implementation plan and schema review are required.

## Architectural Philosophy

Maintley separates planning, execution, and history.

```text
Task
What should be done?
        ↓
Work Session
How is this execution progressing?
        ↓
Maintenance Event
What work was completed?
```

This separation allows homeowners, contributors, and future assistants to
execute the same maintenance plan through different experiences while
preserving one consistent historical record.

Together, ADR 0036 and this ADR establish a shared foundation for both the
property's connected knowledge and the execution of work performed on it.

## Principles

### Tasks remain simple

Tasks continue to define:

* recurrence
* due dates
* scheduling
* reminders
* completion state
* the connection to completed Maintenance Events

Tasks do not become owners of target-by-target workflow progress.

### Work Sessions model execution

A Work Session represents one attempt to execute a Task. A session may:

* begin
* pause
* resume
* complete

Starting, pausing, or resuming a session does not complete the Task. Finishing a
session must call the established Task-completion lifecycle rather than create a
parallel completion path.

### Maintenance Events remain historical authority

Completing a Work Session marks the Task complete through the existing trusted
completion workflow and produces exactly one Maintenance Event for that
completed work.

The Work Session preserves execution progress and context. It does not replace
the Maintenance Event as the historical source of truth.

### Targets are generalized

A Work Session may operate on one or more Targets. Targets identify the
property records or bounded property locations against which the work is being
performed.

Initial and future examples may include:

* Spaces
* Equipment
* exterior Spaces
* landscape Spaces
* other property-owned record types approved under ADR 0036

The Work Session contract must use constrained target types rather than a
separate field for every supported entity type.

Accepted property relationships may suggest eligible targets, but the targets
selected for a particular session are snapshotted when that session begins.
This keeps resumable progress stable if a Task relationship, Space name, or
Equipment record changes during the session. References retain identity;
bounded display snapshots preserve understandable execution context without
becoming a competing source of current property knowledge.

### Walkthroughs are optional

When completing a Task that supports Work Sessions, users may choose between:

* Mark complete
* Guided walkthrough

The existing direct-completion experience remains available. A user is not
forced into a session merely because a Task has several possible targets.

### Progress is explicit and resumable

Target progress is saved as the user advances. Leaving the experience does not
discard a session, and resuming does not duplicate completed targets.

The user must explicitly finish the session or explicitly choose the existing
direct Task-completion action before the Task is marked complete.

## Conceptual Flow

```text
Replace smoke-detector batteries
        ↓
Choose completion experience
        ├── Mark complete
        │       ↓
        │   Existing Task completion lifecycle
        │
        └── Guided walkthrough
                ↓
            Kitchen       Complete
            Hallway       Pending
            Garage        Pending
            Office        Pending
                ↓
            Pause or resume
                ↓
            Finish session
                ↓
            Existing Task completion lifecycle
                ↓
            One Maintenance Event
```

## Ownership and Boundaries

Work Sessions belong to the same Property and account boundary as their source
Task. They do not introduce Unit-like ownership or a new access hierarchy.

A future schema must preserve at least:

* account and Property identity
* source Task identity
* session status
* selected target references and bounded display snapshots
* target-level progress
* created, updated, started, paused, and completed provenance as applicable
* the resulting Maintenance Event reference after completion

Trusted writes must verify that the Task, Work Session, and referenced Targets
belong to the same authorized Property. Direct and guided completion must share
the same permission and historical guarantees.

The implementation plan must decide how abandoned sessions, concurrent
sessions, removed targets, recurrence, and completion retries are handled
before a schema is accepted.

## Future Integrations

This decision intentionally enables later experiences involving:

### Spaces

Room-by-room and area-by-area maintenance.

### Equipment

One maintenance activity performed across several equipment records.

### Supplies

Recording supply use during execution without making supplies children of the
Task or Work Session.

### Maintley Intelligence

Progress-aware, explainable recommendations based on accepted records and
completed history.

### Contributors

Professional service providers completing guided maintenance workflows within
an explicitly approved permission model.

### Arvena and personal assistants

Voice-guided sessions such as:

> Kitchen complete. The next location is the hallway.

Assistant access requires a separate authorization and mutation decision. This
ADR does not expand the current read-only personal-assistant API.

## Rationale

This approach keeps recurrence and reminders attached to one Task while giving
execution its own resumable state. It avoids creating one Task per target,
preserves the current low-friction completion option, and provides a reusable
model for guided homeowner work.

It also aligns with the Connected Property Knowledge Model: Work Sessions use
property-owned records and accepted relationships as context without changing
who owns that knowledge.

## Consequences

### Positive

* Eliminates duplicate Tasks for one repeated activity.
* Supports resumable target-by-target maintenance.
* Creates a reusable execution model.
* Preserves the existing direct-completion experience.
* Supports future contributor and voice-guided workflows.
* Produces richer, explainable execution context for Maintley Intelligence.
* Keeps Maintenance Events as the durable record of completed work.

### Costs and risks

* Introduces an additional domain concept and lifecycle.
* Requires target-level progress and resume behavior.
* Requires careful idempotency between session and Task completion.
* Requires explicit handling of targets that change or are archived.
* Adds permission and query complexity.
* Can add unnecessary friction if walkthroughs are presented for simple Tasks.

## Deferred

This ADR does not introduce:

* contributor workflows or contributor permissions
* supply consumption or inventory updates
* photo requirements
* inspection scoring
* mandatory walkthroughs
* automatic Work Session creation
* automatic target derivation or selection
* voice or assistant write access
* a final Firestore schema, index contract, or retention policy
* a concurrent-session policy

These require separate product, data, permission, and implementation decisions.

## Implementation Direction

Before implementation, Maintley should define and approve:

1. The Work Session and target-progress schema.
2. Session status transitions and idempotent completion behavior.
3. How Task-to-Space and future relationships propose default targets.
4. Snapshot and archival behavior for changed Targets.
5. Recurring Task behavior and the identity of each execution.
6. Permission rules and trusted write boundaries.
7. Mobile-first walkthrough, pause, resume, and direct-completion UX.
8. Maintenance Event linkage and duplicate-completion prevention.
9. Emulator, lifecycle, and interrupted-session test coverage.

## Success Criteria

The decision is implemented when:

* A user can optionally start a guided Work Session from an eligible Task.
* Target progress can be saved, left, and resumed without duplication.
* Starting or pausing a session does not complete the Task.
* Finishing a session uses the existing Task-completion lifecycle.
* One completed execution produces one Maintenance Event.
* Direct Task completion remains available and unchanged for simple work.
* Targets remain within the authorized Property boundary.
* Changes to connected property records do not corrupt an active session.
* Current architecture, permission, and data-model documentation describe the
  shipped behavior once implementation begins.
