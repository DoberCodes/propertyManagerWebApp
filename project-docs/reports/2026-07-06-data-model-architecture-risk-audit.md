# Data Model and Architecture Risk Audit

Date: 2026-07-06

## Purpose

This report reviews Maintley's current data model and architecture for functional
risk, scalability concerns, source-of-truth conflicts, permission gaps, and
areas likely to create regressions as the product expands.

This is not a documentation-compliance review. The active documentation was used
as context, but the findings below are based on implementation risk.

## Executive Summary

Maintley's core direction is sound:

```text
Properties
  -> Maintenance Events
  -> Maintley Intelligence
  -> User Action
```

The main architectural risks are transitional systems that are still active:

* Embedded growing arrays on property records.
* Multiple account and access-resolution paths.
* Legacy and canonical maintenance records both participating in production UI.
* Important workflows still coordinated by the client.
* Storage permissions that are broader than the corresponding Firestore writes.
* Derived intelligence snapshots that can become too authoritative.

These are manageable, but they should be addressed before Maintley adds much
more document acquisition, portfolio scale, role complexity, or automated
intelligence workflows.

## Highest-Risk Findings

## 1. Property Documents and Knowledge Suggestions Are Embedded on Properties

Current implementation stores document and acquisition records inside the
property document through fields such as:

* `documents`
* `knowledgeSuggestions`
* `propertyKnowledgeProvenance`

Relevant implementation:

* `src/types/Property.types.ts`
* `src/propertyKnowledge/propertyDocumentUploads.ts`
* `functions/propertyKnowledgeAcquisition.ts`
* `src/pages/PropertyDetailPage/TabSystem/DocumentsTab.tsx`

### Risk

This is likely the most important data-model concern.

As document uploads and scan reviews grow, the property document becomes a
hotspot. Uploading a document, processing a PDF, reviewing suggestions, editing
document metadata, and applying Property Memory changes can all update the same
property record.

Potential issues:

* Firestore document-size limit risk.
* Write contention during upload and backend processing.
* Lost-update risk from array replacement patterns.
* Large property reads even when a screen only needs basic property details.
* Harder future querying, filtering, retention, and audit trails.

### Recommendation

Move toward collection-backed records:

```text
propertyDocuments/{documentId}
propertyKnowledgeSuggestions/{suggestionId}
propertyKnowledgeProvenance/{provenanceId}
```

Each record should carry:

* `accountId`
* `propertyId`
* related entity links
* acquisition status
* created/updated timestamps

Keep only small summary fields on the property if needed, such as:

* document count
* pending suggestion count
* last document upload timestamp

## 2. Storage Rules Allow Write/Delete with Read-Level Access

Current storage rules allow property, device, team, and maintenance files to be
created or deleted by users who can read the account or property.

Relevant implementation:

* `storage.rules`

Examples:

* `properties/{accountId}/{fileName}`
* `device-files/{propertyId}/{deviceId}/{fileName}`
* `maintenance-files/{propertyId}/{fileName}`

### Risk

Firestore may correctly block a user from creating or editing metadata while
Storage still allows the file operation.

Potential issues:

* Read-only users may upload files.
* Read-only users may delete supporting files.
* Orphaned files can be created without matching Firestore metadata.
* File permissions may diverge from UI permissions.

### Recommendation

Use separate read and write predicates:

```text
canReadAccount / canReadProperty
canManageAccount / canManageProperty
```

Storage reads can remain broad. Storage create/update/delete should require the
same role level that can write the corresponding Firestore metadata.

## 3. Account and Team Access Resolution Is Duplicated

Access resolution appears in multiple client and server paths.

Relevant implementation:

* `src/Redux/API/accountContext.ts`
* `src/Redux/API/propertySlice.tsx`
* `src/Redux/API/taskSlice.tsx`
* `src/Redux/API/deviceSlice.ts`
* `functions/accountAuthz.ts`
* `firestore.rules`

### Risk

This is a regression-prone area. Similar role and property-assignment logic is
implemented in several places, but not always identically.

Potential issues:

* A team member can see properties in one tab but not another.
* Eligible assignees differ across task surfaces.
* One permission fix lands in one resolver but not the others.
* Client-side filtering may hide or show records differently than rules allow.

### Recommendation

Create one shared client access adapter and one server authorization contract.

The client adapter should return a normalized shape:

```ts
{
  accountIds: string[];
  activeAccountId: string;
  userRole: string;
  isScopedTeamMember: boolean;
  allowedPropertyIds: string[];
  canManageTasks: boolean;
  canManageProperties: boolean;
  canManageDocuments: boolean;
}
```

Slices should consume that adapter instead of rebuilding access logic.

## 4. Maintenance Events and Legacy Maintenance History Both Remain Active

The app reads from both:

* `maintenanceEvents`
* `maintenanceHistory`

It also still has embedded historical fields on property and device types.

Relevant implementation:

* `src/Redux/API/maintenanceSlice.tsx`
* `functions/maintenanceEvents.ts`
* `src/types/Property.types.ts`
* `src/types/MaintenanceEvent.types.ts`

### Risk

The platform says Maintenance Events are canonical, but legacy paths still shape
UI behavior.

Potential issues:

* Duplicate maintenance rows.
* Inconsistent cost reporting.
* Some screens may miss records created by newer workflows.
* Historical reporting has to dedupe and normalize repeatedly.

### Recommendation

Complete the migration to `maintenanceEvents`.

Short term:

* Keep one adapter that reads legacy records.
* Make all UI consume the adapter.
* Stop adding new UI-specific fallback queries.

Long term:

* Backfill legacy `maintenanceHistory`.
* Mark migrated legacy records.
* Remove direct UI awareness of `maintenanceHistory`.

## 5. Important Workflow Writes Are Still Client-Coordinated

Several multi-record workflows are coordinated on the client. Examples include:

* Uploading property documents and then updating `properties.documents`.
* Saving scan snapshots and publishing Maintley Events.
* Creating tasks with related documents.
* Completing tasks and producing Maintenance Events.

Relevant implementation:

* `src/Redux/API/propertyIntelligenceSlice.ts`
* `src/Components/TaskCompletionModal/TaskCompletionModal.tsx`
* `src/Components/TaskDocumentsPanel/TaskDocumentsPanel.tsx`
* `src/Components/ApplianceDocumentsPanel/ApplianceDocumentsPanel.tsx`
* `src/Components/Library/Modal/TaskModal.tsx`

### Risk

Client-owned orchestration is fragile when workflows touch multiple records or
side effects.

Potential issues:

* Partial success if upload succeeds but metadata write fails.
* Event published after snapshot write failure or vice versa.
* Duplicate writes from retry.
* Security rules become harder because the client needs broad write access.

### Recommendation

Move high-value workflows behind callable functions over time:

* `createPropertyDocument`
* `processDocumentAcquisition`
* `savePropertyScanSnapshot`
* `completeTask`
* `createTaskWithDocuments`

The client should initiate workflows. The server should own authoritative
multi-record state transitions.

## 6. Derived Intelligence Snapshots Can Become Too Authoritative

Property scan snapshots are stored in:

* `propertyScanLatest`
* `propertyScanSnapshots`

Relevant implementation:

* `src/Redux/API/propertyIntelligenceSlice.ts`
* `src/utils/propertyIntelligenceScan.ts`
* `src/intelligence/engine.ts`

### Risk

Persisting derived intelligence is useful, but snapshots can become mistaken for
source records.

Potential issues:

* Resolved recommendations may remain visible in historical snapshots.
* Audit snapshots may grow large.
* Client-written snapshots may be treated as trusted by future email/activity
  systems.
* Recommendation state can drift from source records.

### Recommendation

Keep snapshots explicitly derived and replaceable.

Suggested guardrails:

* Persist scans server-side.
* Store snapshot metadata and summaries separately from large recommendation
  payloads when needed.
* Track recommendation resolution as source-record changes, not as independent
  authoritative recommendation state.
* Consider TTL or retention rules for older quick-scan snapshots.

## 7. Notification Architecture Is in Transition

Maintley Events are the right direction, but direct notification writes and
legacy notification triggers still exist.

Relevant implementation:

* `functions/maintleyEventEngine.ts`
* `functions/maintenanceEvents.ts`
* `src/Redux/API/notificationSlice.tsx`
* `functions/sendPushOnNotificationCreate.ts`

### Risk

Multiple notification creation paths increase noise and duplicate risk.

Potential issues:

* Duplicate in-app notifications.
* Push behavior differs by workflow.
* Preferences may be applied inconsistently.
* Event lifecycle history and notification delivery records can diverge.

### Recommendation

Continue moving workflow notifications through Maintley Events.

Direct notification writes should become legacy-only or UI-only for simple
user-owned actions. Workflow milestones should publish events, and consumers
should decide in-app, Android push, future web push, and future email delivery.

## 8. Query Patterns May Become Expensive at Portfolio Scale

Several slices fetch broad account collections, perform fallback queries, and
dedupe in memory.

Relevant implementation:

* `src/Redux/API/propertySlice.tsx`
* `src/Redux/API/taskSlice.tsx`
* `src/Redux/API/deviceSlice.ts`
* `src/Redux/API/maintenanceSlice.tsx`

### Risk

This is acceptable at small account sizes but will become noticeable with larger
portfolios, long maintenance histories, and heavy document usage.

Potential issues:

* Slow dashboard loads.
* Excess Firestore reads.
* Mobile performance issues.
* More index requirements as query combinations expand.

### Recommendation

Add scoped query patterns before portfolio data grows:

* Recent tasks by account/property.
* Recent maintenance events by account/property.
* Active tasks only.
* Documents by property.
* Documents by linked asset/task.
* Paginated history views.

Also add and maintain `firestore.indexes.json`. It was not present during this
review.

## 9. Counters Are Client-Transaction Dependent

Property and device limits rely on account counters updated through client
transactions.

Relevant implementation:

* `src/Redux/API/propertySlice.tsx`
* `src/Redux/API/deviceSlice.ts`
* `firestore.rules`

### Risk

The current approach is better than no enforcement, but it makes the client part
of the authoritative billing/resource-limit workflow.

Potential issues:

* Counter drift from old scripts, admin actions, failed migrations, or direct
  function writes.
* Rules become complex because they validate both resource write and counter
  update.
* Future plan changes may require counter repair.

### Recommendation

Long term, move resource creation/deletion to callable functions. Counters
should be server-owned and periodically audited by a repair script.

## Recommended Priority Order

1. Tighten Storage write/delete permissions.
2. Centralize account/team/property access resolution.
3. Extract property documents and knowledge suggestions from embedded property
   arrays.
4. Finish the `maintenanceEvents` migration.
5. Move persisted intelligence scan writes server-side.
6. Add `firestore.indexes.json` and reduce broad account reads.
7. Continue event-engine migration and retire direct workflow notification
   creation.
8. Move resource counters fully server-side.

## Suggested Next ADRs or Workstreams

### Storage Write Permission Contract

Decision needed:

Should Storage write/delete permissions be separated from read permissions and
aligned with Firestore metadata write permissions?

Recommended answer:

Yes.

### Property Documents as First-Class Records

Decision needed:

Should property documents and acquisition suggestions move out of the property
document into account/property-scoped collections?

Recommended answer:

Yes.

### Account Access Resolver Contract

Decision needed:

Should every client slice and server function consume a common access contract?

Recommended answer:

Yes.

### Maintenance Event Migration Completion

Decision needed:

When should `maintenanceHistory` stop being an active UI concern?

Recommended answer:

After a dedicated backfill and compatibility adapter phase.

## Overall Assessment

Maintley's architecture is directionally strong. The product has a coherent
center of gravity around properties, maintenance events, and intelligence.

The main concern is not that the architecture is wrong. The concern is that
several compatibility structures are still active enough to become permanent if
they are not intentionally retired.

The most important next structural move is to stop using the property document
as a container for growing operational arrays. First-class document and
knowledge-suggestion collections would make document acquisition, review,
intelligence, reporting, and permissions more reliable as Maintley scales.
