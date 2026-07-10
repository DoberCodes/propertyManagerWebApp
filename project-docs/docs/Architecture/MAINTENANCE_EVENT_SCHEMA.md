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

Canonical collection:

```text
maintenanceEvents/{eventId}
```

Legacy compatibility:

```text
maintenanceHistory/{historyId}
```

`maintenanceEvents` is the authoritative source for maintenance history.

`maintenanceHistory` remains available only for compatibility with older records.

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
* maintenanceCategory
* eventType
* eventSource
* createdBy
* createdByName
* createdAt
* updatedAt
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

When linking task financials to maintenance events, verify conversion and normalization behavior.

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

The application currently supports dual-read behavior.

Sources:

* maintenanceEvents
* maintenanceHistory

Purpose:

* Support older data.
* Support migration efforts.
* Preserve compatibility during transition periods.

New maintenance records should be written to:

```text
maintenanceEvents
```

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

Migration helpers:

```bash
npm run migrate:maintenance-events
npm run migrate:maintenance-events:apply
```

Implementation:

```text
scripts/migrateMaintenanceHistoryToEvents.cjs
```

Review migration logic carefully before applying to production environments.

Migration utilities exist to support legacy maintenanceHistory records.

They should not be required for normal application operation.

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
