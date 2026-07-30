# Maintenance Event Schema

Last reviewed: 2026-06

## Purpose

Maintenance Events represent the historical record of work performed within Maintley.

The `maintenanceEvents` collection serves as the canonical maintenance timeline for:

* Properties
* Equipment
* Tasks
* Contractors
* Documentation
* Service activity

Maintenance Events preserve historical context even when related records change over time.

Tasks may be edited, equipment may be replaced, contractors may be removed, and properties may evolve.

Maintenance Events exist to ensure completed work remains part of the permanent maintenance record.

---

# Source of Truth

Implementation references:

* src/types/MaintenanceEvent.types.ts
* functions/maintenanceEvents.ts
* src/Redux/API/maintenanceSlice.tsx
* src/Redux/API/taskSlice.tsx
* src/maintenanceHistory/maintenanceHistoryAdapter.ts

Canonical collection:

```text
maintenanceEvents/{eventId}
```

Immutable correction log:

```text
maintenanceEventRevisions/{revisionId}
```

Legacy compatibility:

```text
maintenanceHistory/{historyId}
```

`maintenanceEvents` is the authoritative source for maintenance history.

`maintenanceHistory` remains available only for compatibility with older records.
New workflows do not write legacy collection or embedded history records.

---

# Relationships

Maintenance Events may be associated with:

* Properties
* Equipment
* Tasks
* Contractors
* Attachments

Common relationship patterns:

```text
Property
  ↓
Task
  ↓
Maintenance Event
```

```text
Property
  ↓
Equipment
  ↓
Maintenance Event
```

```text
Property
  ↓
Contractor
  ↓
Maintenance Event
```

Maintenance Events provide the long-term historical layer connecting these records.

---

# Revision Records

Every canonical event creation, correction, and deletion writes a server-owned
revision record. Revision fields are:

* eventId
* accountId
* propertyId
* action (`created`, `corrected`, or `deleted`)
* actor (authenticated user ID and minimal display snapshot)
* changedFields
* previousValues (allowlisted non-sensitive fields only)
* reason
* createdAt

Revisions always store changed field names. Previous values are retained only
for allowlisted descriptive fields such as title, description, service date,
category, performer, priority, tags, equipment IDs, and unit ID. Financials,
attachments, and free-form data store changed-field metadata only so the audit
trail does not become a second repository of potentially sensitive content.
Deletion requires a correction reason and soft-deletes the event. Revision
records and the underlying historical event survive removal from active views
and cannot be created, changed, or deleted by clients.

---

# Collection

```text
maintenanceEvents/{eventId}
```

Each document represents a historical maintenance-related event.

Events may be created:

* Automatically from task completion
* Through manual maintenance entry
* Through document uploads
* Through contractor activity
* Through future system-generated maintenance workflows

---

# Base Fields

Common fields:

* id
* accountId
* propertyId
* propertyTitle
* unitId
* deviceIds
* title
* description
* completionDate
* serviceDate
* maintenanceCategory
* eventType
* eventSource
* createdBy
* createdByName
* recordedBy
* recordedAt
* performedBy
* correctionCount
* createdAt
* updatedAt

`completionDate` may be stored as a date-only string such as `2026-07-10`.
Date-only maintenance values are calendar dates and should be displayed in the
user's local calendar without shifting through UTC conversion.

`serviceDate` is the canonical date on which the work occurred.
`completionDate` remains a compatibility alias while existing readers migrate.

`recordedBy` and `recordedAt` are server-authoritative. `recordedBy` contains
the authenticated user ID and a minimal display-name snapshot resolved by the
server. Clients cannot supply or override these fields.

`performedBy` is optional and identifies the person or provider reported to
have performed the work. Its supported types are `user`, `contractor`,
`external_provider`, `homeowner`, and `unknown`. This is attribution supplied
with the record; it is not verification or certification by Maintley.

`correctionCount` is maintained by the server for efficient timeline and report
display. The immutable revision collection remains the authoritative source for
correction details.
* priority
* tags
* linkedTaskIds
* originalTaskId
* recurringTaskId
* maintenanceCycleId
* relatedEventIds
* attachments
* financials
* data

Not every field is required for every event type.

Event-specific data may be stored within the `data` object.

---

# Event Types

Allowed server-side event types:

* task_completed
* task_approved
* repair_logged
* inspection_completed
* invoice_uploaded
* document_uploaded
* service_note_added
* maintenance_recorded
* warranty_added
* contractor_visit_logged
* recurring_maintenance_completed

Event types describe what occurred.

Additional event types may be introduced as maintenance workflows expand.

---

# Event Sources

Allowed server-side event sources:

* task_completion
* task_approval
* device_log
* repair_logging
* inspection_form
* invoice_upload
* document_upload
* note_entry
* manual_entry
* system
* contractor_entry

Event sources describe how the event entered the system.

Event type and event source are intentionally separate concepts.

Example:

```text
Event Type:
task_completed

Event Source:
task_completion
```

---

# Attachments

Attachments are normalized by server-side creation functions.

Attachment shape:

```ts
{
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
  description?: string;
}
```

Attachments provide references to supporting files rather than storing file contents directly.

Common attachment examples:

* Invoices
* Service reports
* Photos
* Inspection documents
* Warranty records

---

# Financials

Financial information is normalized during event creation.

Current shape:

```ts
{
  estimatedCost?: number;
  actualCost?: number;
  currency: string;
  notes?: string;
}
```

Some task workflows support more detailed cost structures.

When linking task financials to maintenance events, detailed estimate and actual
cost breakdowns should be preserved. Summary totals such as `estimatedCost` and
`actualCost` should be derived during event creation when they are not already
present so cost views and reports can read a consistent total.

When a completed task creates a Maintenance Event, the Maintenance Event becomes the owner of the recorded cost for that completed work. The original task may remain linked through `originalTaskId` or `linkedTaskIds`, but derived cost views should use the event cost and avoid counting the same completed task financials twice.

When Property Knowledge Acquisition reviews an uploaded invoice or service document, it should attempt to match the document to an existing Maintenance Event using explainable signals such as source document identity, invoice number, service date, contractor, related asset, and total cost. If the reviewer accepts the match, the existing Maintenance Event should be updated with missing context rather than creating a duplicate event.

---

# Task Completion Events

Task completion is one of the most common Maintenance Event creation paths.

Task completion generates:

```text
eventType = task_completed
```

Typical relationships include:

* linkedTaskIds
* originalTaskId
* deviceIds
* propertyId
* accountId
* completionDate
* data.completedBy

Task completion events provide the permanent historical record of completed maintenance work.

---

# Notifications Integration

The Cloud Function:

```text
notifyTaskCompletion
```

creates notifications when qualifying task completion events are created.

Current behavior:

* Watches maintenanceEvents creation.
* Evaluates event type.
* Creates task completion notifications when appropriate.

Notifications consume Maintenance Events but do not replace them.

Maintenance Events remain the source of truth.

---

# Maintley Intelligence Integration

Maintley Intelligence may evaluate Maintenance Events when generating recommendations and observations.

Examples:

* No maintenance history recorded.
* No filter replacement history recorded.
* No inspection history recorded.
* No service activity recorded.

Maintley Intelligence should derive observations from Maintenance Events.

Maintenance Events remain the authoritative historical record.

Recommendation systems should not create parallel maintenance-history structures.

---

# Reading Strategy

The application currently supports dual-read behavior through one shared,
source-aware adapter.

Sources:

* maintenanceEvents
* maintenanceHistory

Purpose:

* Support older data.
* Support migration efforts.
* Preserve compatibility during transition periods.

The adapter normalizes dates, titles, descriptions, property relationships,
equipment relationships, source identity, and canonical status into one
UI-facing shape. It removes duplicate query results by source identity, prefers
a canonical event when the legacy collection uses the same ID, and honors
explicit migration provenance.

Property `taskHistory` and `maintenanceHistory` arrays are treated as aliases
and deduplicated against each other. Similar independent records are not
automatically merged; content similarity alone is not sufficient evidence that
two records describe the same work.

Property- and account-scoped RTK query paths both use the adapter. Property
detail consumers do not independently merge embedded property history.
Equipment-embedded compatibility records enter through the adapter's shared
device-source boundary. Equipment timelines, reports, account/profile metrics,
dashboard health, Maintenance Profiles, and Maintley Intelligence consume that
adapted result rather than reading `devices.maintenanceHistory` directly.
Embedded compatibility records remain visible but read-only until an approved
controlled backfill creates their canonical Maintenance Events.

New maintenance records should be written to:

```text
maintenanceEvents
```

The transitional history UI sends corrections and removals to
`correctMaintenanceHistoryRecord`. Canonical events are corrected normally. A
legacy-only record is promoted to the same deterministic event ID first, with
`data.migration` provenance and a server-authored creation revision, and is then
corrected or soft-deleted. Ambiguous legacy records are refused for manual
migration review rather than being changed directly.

---

# Query Patterns

Common query patterns:

By account:

* accountId

By property:

* propertyId

By equipment:

* deviceIds (array membership)

Compatibility and fallback:

* title
* propertyTitle

Common future index patterns may include:

* accountId + createdAt
* propertyId + createdAt
* deviceIds array-contains + createdAt
* eventType + createdAt

Review Firestore index requirements when introducing new reporting or dashboard queries.

---

# Migration

Report-only migration inventory:

```bash
npm run audit:maintenance-history -- --confirm-project=<project-id>
```

Implementation:

```text
scripts/inventoryMaintenanceHistory.cjs
```

The inventory has no apply mode. Do not run the older
`migrateMaintenanceHistoryToEvents.cjs --apply` path; it predates current
provenance, revision, parity, backup, and rollback requirements. A replacement
controlled backfill requires separate approval after inventory review.

---

# Design Principles

Maintenance Events should:

* Preserve historical context.
* Remain append-oriented whenever possible.
* Support auditing and reporting.
* Support maintenance history views.
* Support equipment history views.
* Support property history views.
* Support Maintley Intelligence recommendations.

Maintenance Events should not:

* Replace task records.
* Replace equipment records.
* Replace contractor records.
* Become a duplicate source of property information.

Maintenance Events exist to answer a single question:

> What maintenance-related activity has occurred over time?

All maintenance history, service history, and long-term property records should ultimately derive from this collection.
