# ADR 0020: Maintley Resolution Engine

Status: Accepted

Date: 2026-07-03

## Context

Maintley Intelligence can now produce useful recommendations across Quick Scan,
Property Audit, Knowledge Packs, tasks, and maintenance history. The next
problem is not finding more recommendations. The next problem is helping users
complete them without losing context.

Today, a recommendation such as "Add install date for Water Heater" may send a
user to the system record. The user then has to remember:

* What was missing?
* Why did Maintley recommend this?
* Which field should be updated?
* Should the user enter it manually, upload a document, or create a task?

That creates friction. Maintley should guide users through resolving the
recommendation, not only navigate them to a page.

## Decision

Maintley will introduce a Resolution Engine between recommendations and
completion workflows.

```text
Property Memory
    -> Maintley Intelligence
    -> Recommendation
    -> Resolution Engine
    -> Completion Workflow
    -> Property Memory
```

Recommendations continue to describe what Maintley found and why it matters.
The Resolution Engine decides the best completion workflow.

Examples:

| Recommendation | Resolution |
| --- | --- |
| Missing install date | Edit asset record, upload invoice, upload warranty |
| Missing filter size | Edit asset record, upload manual, scan label |
| Missing recurring care | Create recurring task |
| Missing maintenance history | Create maintenance event |
| Missing warranty | Upload warranty or enter warranty details |
| Missing contractor | Select or create contractor |

The first phase will add typed resolution metadata and a guided "Complete
recommendation" review step. When an existing task, maintenance history,
document, or record dialog can be opened from the property page, it should open
over the current property context instead of forcing the user to navigate away
first. Existing navigation remains available as a fallback for deeper review.

## Principles

1. Recommendations should not own completion logic.

A recommendation explains the opportunity. The Resolution Engine decides how it
can be completed.

2. Completion should preserve context.

When users start resolving a recommendation, Maintley should show the missing
item, the asset, why it matters, and what to do next.

3. Resolution should update source records.

Completion workflows should update property, asset, task, document, contractor,
or maintenance-history records. Recommendations should disappear naturally when
Maintley Intelligence re-runs against updated property memory.

4. Navigation should be workflow-oriented.

Users should not be dropped onto a page without context. When a page is still
the right destination, Maintley should first show the recommended action and
then route users to the correct place.

5. Inline completion should be preferred for simple fields.

If Maintley only needs one or two asset fields, such as install date, make,
model, serial number, or filter size, users should be able to save those fields
without leaving the current property context.

6. Existing work should navigate to review.

Recommendations about overdue tasks should send users to task review instead of
opening a resolution workflow. The work already exists; the user's next step is
to review or complete the task.

## Initial Resolution Types

Maintley will support these resolution types:

* `edit_asset`
* `create_task`
* `create_history`
* `upload_document`
* `scan_barcode`
* `knowledge_review`
* `contractor`
* `review_task`

Each resolution plan may include:

* Recommendation id
* Resolution type
* Asset label
* Section label
* Missing fields
* Why it matters
* What to do next
* Primary action
* Secondary completion options

The initial `create_task` workflow prepares a recurring maintenance task draft
with property and asset context already filled in. Unless Maintley has a
specific recommended task name, the title should remain blank so the user names
the actual recurring work to track. The user still reviews and saves the task
before Maintley updates the property memory.

If Maintley knows multiple possible recurring tasks for an asset, the resolution
workflow should show those as choices. Selecting one prepares the task draft with
that task name and cadence. Users may still choose a custom blank task instead.

Maintenance-history recommendations should prepare a maintenance event draft
with the property and affected asset linked through `deviceIds`. The record
name, date, and description should remain user-entered because Maintley should
not assume what work was actually performed.

## Consequences

* Quick Scan and Property Audit can share resolution behavior.
* Property Audit can stay asset-centered while individual findings become
  actionable.
* Future document upload, barcode scan, contractor, and knowledge review flows
  can be added without rewriting recommendation rules.
* Recommendations remain derived and explainable instead of becoming a second
  source of truth.

## Non-Goals

* Build a full inline editor for every recommendation type in the first phase.
* Store duplicate recommendation completion state outside the source records.
* Replace existing task, document, asset, or maintenance-history screens.
* Add automation that silently changes user records.
