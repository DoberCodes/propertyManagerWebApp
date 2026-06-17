# Maintenance Event System Schema

## Overview
The maintenance event system is the operational memory layer for properties. Every action that maintains, inspects, repairs, or documents a property system creates an event. These events feed all timelines, reports, and analytics.

## Event Type Taxonomy

### Core Event Types

#### 1. `task_completed` — Task Execution
**When**: User completes a recurring or one-time maintenance task
**Sources**: Task completion in app
**Timeline**: Property, Appliance/System, Dashboard
**Key Fields**:
- `taskId`: Link to originating task
- `recurringTaskId`: If from recurring task
- `completionDate`: When task was marked done
- `completionNotes`: Work performed
- `completedBy`: User who marked complete
- `completedByName`: Display name of completer
- `maintenanceCategory`: Type (Filter Change, Inspection, Cleaning, etc.)
- `estimatedCost`: If applicable
- `deviceIds`: Which appliances were affected

#### 2. `repair_logged` — Repair Entry
**When**: User logs a repair (was done, needs doing, or planned)
**Sources**: Repair logging modal, contractor notes
**Timeline**: Property, Appliance/System, Dashboard
**Key Fields**:
- `repairDescription`: What was/needs repair
- `repairStatus`: 'completed' | 'in_progress' | 'scheduled' | 'pending'
- `completionDate`: When repair happened (if completed)
- `scheduledDate`: When repair is planned (if scheduled)
- `contractor`: Contractor name/company
- `estimatedCost`: Repair cost estimate
- `actualCost`: Cost if paid
- `invoiceId`: Link to invoice if paid
- `deviceIds`: Which appliances/systems affected
- `priority`: 'urgent' | 'high' | 'medium' | 'low'

#### 3. `inspection_completed` — Property/Appliance Inspection
**When**: User documents an inspection (roof, HVAC, plumbing, etc.)
**Sources**: Inspection logging, contractor reports
**Timeline**: Property, Appliance/System, Dashboard
**Key Fields**:
- `inspectionType`: 'roof' | 'hvac' | 'plumbing' | 'electrical' | 'structural' | 'general' | 'custom'
- `inspectionDate`: When inspection occurred
- `inspector`: Who performed inspection
- `findings`: What was found
- `recommendations`: What should be done
- `priority`: 'urgent' | 'high' | 'medium' | 'low' | 'none'
- `nextInspectionDue`: Estimated date for next inspection
- `documentId`: Link to inspection report if uploaded
- `deviceIds`: Appliances/systems involved

#### 4. `invoice_uploaded` — Financial Record
**When**: Invoice or bill is uploaded/recorded for maintenance work
**Sources**: Invoice upload, contractor bill, payment processing
**Timeline**: Property, Appliance/System, Dashboard
**Key Fields**:
- `invoiceNumber`: Vendor invoice number
- `invoiceDate`: When invoice issued
- `vendor`: Vendor/contractor name
- `amount`: Total amount
- `description`: What was billed
- `category`: 'repair' | 'maintenance' | 'inspection' | 'service' | 'parts' | 'other'
- `relatedEventIds`: Other maintenance events this invoice covers (array of event IDs)
- `documentId`: Link to uploaded invoice document
- `dueDate`: Payment due date
- `paidDate`: When paid (if paid)
- `status`: 'pending' | 'paid' | 'overdue'
- `deviceIds`: Which appliances/systems (if applicable)

#### 5. `document_uploaded` — Attachment/Reference
**When**: User uploads a document, photo, receipt, warranty, etc.
**Sources**: File upload
**Timeline**: Property, Appliance/System, Dashboard
**Key Fields**:
- `documentType`: 'receipt' | 'warranty' | 'photo' | 'report' | 'contract' | 'manual' | 'other'
- `fileName`: Original file name
- `fileSize`: Size in bytes
- `mimeType`: Content type
- `uploadedBy`: User who uploaded
- `uploadedAt`: When uploaded
- `description`: What this document is
- `expiryDate`: If warranty/contract (optional)
- `relatedEventIds`: Other events this relates to
- `deviceIds`: Which appliances/systems

#### 6. `service_note_added` — Operational Note
**When**: User adds a note about service, observations, or follow-ups
**Sources**: Manual note entry
**Timeline**: Property, Appliance/System, Dashboard
**Key Fields**:
- `noteText`: The note content
- `noteAuthor`: Who wrote it
- `noteType`: 'observation' | 'follow_up' | 'warning' | 'reminder' | 'general'
- `priority`: 'urgent' | 'high' | 'normal' | 'low'
- `relatedEventIds`: Other events referenced
- `deviceIds`: Which appliances/systems

#### 7. `maintenance_recorded` — Manual Maintenance Entry
**When**: User manually records maintenance that happened (for legacy/external work)
**Sources**: Manual entry, import, contractor report
**Timeline**: Property, Appliance/System, Dashboard
**Key Fields**:
- `maintenanceType`: 'preventive' | 'corrective' | 'inspection' | 'upgrade' | 'other'
- `recordedDate`: When recorded in system
- `workDate`: When work actually happened
- `workDescription`: What was done
- `performer`: Who did the work
- `notes`: Additional context
- `deviceIds`: Which appliances/systems affected

#### 8. `warranty_added` — Warranty Record
**When**: User logs warranty for appliance/system
**Sources**: Manual entry, document upload
**Timeline**: Property, Appliance/System, Dashboard
**Key Fields**:
- `warrantyType`: 'manufacturer' | 'extended' | 'service_plan' | 'other'
- `provider`: Company providing warranty
- `startDate`: Warranty start date
- `expiryDate`: Warranty end date
- `coverageDescription`: What's covered
- `documentId`: Warranty document link
- `deviceIds`: Which appliances/systems covered
- `contactInfo`: How to file claim (phone/email/website)

#### 9. `contractor_visit_logged` — Contractor Service Visit
**When**: Contractor visits property for work
**Sources**: Contractor logging, user entry
**Timeline**: Property, Appliance/System, Dashboard
**Key Fields**:
- `contractorName`: Company/person name
- `visitDate`: When visit occurred
- `visitType`: 'inspection' | 'repair' | 'maintenance' | 'quote' | 'consultation' | 'followup'
- `workPerformed`: What was done
- `findings`: What contractor found
- `recommendations`: What contractor recommends
- `nextVisitNeeded`: If followup required
- `estimatedCost`: For quote visits
- `invoiceGenerated`: Whether invoice was issued
- `contactInfo`: Contractor details
- `documentIds`: Related reports/photos
- `deviceIds`: Systems worked on

#### 10. `recurring_maintenance_completed` — Cyclical Task Completion
**When**: Recurring maintenance task auto-logs completion
**Sources**: System-generated on recurring task completion
**Timeline**: Property, Appliance/System, Dashboard
**Key Fields**:
- `recurringTaskId`: The recurring task definition
- `completionNumber`: Which occurrence (1st, 2nd, etc.)
- `nextDueDate`: When next iteration is due
- `completionNotes`: Work notes
- `completedBy`: User or system
- `deviceIds`: Affected appliances

---

## Base Event Schema (All Events)

Every maintenance event record contains:

```typescript
interface MaintenanceEvent {
  // Identity
  id: string;                          // Unique event ID (auto-generated)
  accountId: string;                   // Account/family owner
  propertyId: string;                  // Property this event belongs to
  propertyTitle?: string;              // Property name (fallback)
  
  // Location Context
  unitId?: string;                     // Unit within property (if applicable)
  deviceIds?: string[];                // Array of affected appliance IDs
  areaOrSystem?: string;               // Semantic location: "Kitchen", "Master Bath", "Roof", "HVAC System", etc.
  
  // Event Type & Source
  eventType: MaintenanceEventType;     // Which type of event (see taxonomy above)
  eventSource: MaintenanceEventSource; // How it was created
  
  // Basic Info
  title: string;                       // Event summary line
  description?: string;                // Full description
  
  // Timeline
  createdAt: string;                   // When event was recorded in system (ISO 8601)
  completionDate?: string;             // When work actually occurred (ISO 8601)
  updatedAt: string;                   // Last modified (ISO 8601)
  
  // People
  createdBy: string;                   // User ID who created event
  createdByName?: string;              // Display name of creator
  completedBy?: string;                // User ID who completed work
  completedByName?: string;            // Display name of completer
  
  // Files & Financials
  attachments?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
    uploadedAt: string;
    description?: string;
  }>;
  financials?: {
    estimatedCost?: number;
    actualCost?: number;
    currency: string;
    notes?: string;
  };
  
  // Relationships
  linkedTaskIds?: string[];            // Related task IDs
  originalTaskId?: string;             // If created from a task
  recurringTaskId?: string;            // If from recurring maintenance
  maintenanceCycleId?: string;         // If part of a cycle
  invoiceIds?: string[];               // Related invoice IDs
  relatedEventIds?: string[];          // Other related events
  
  // Metadata
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  tags?: string[];                     // Searchable tags
  searchIndex?: string;                // Denormalized search field
}
```

---

## Event Sources (Triggers)

### Where Each Event Type is Created

| Event Type | Primary Source | Secondary Sources |
|---|---|---|
| `task_completed` | Task completion in UI | Mobile app task marking |
| `repair_logged` | Repair logging modal | Dashboard quick entry, Appliance page |
| `inspection_completed` | Inspection form | Contractor report upload, manual entry |
| `invoice_uploaded` | Invoice upload modal | Payment processing integration, manual entry |
| `document_uploaded` | File upload anywhere | Appliance detail upload, Property detail upload |
| `service_note_added` | Note modal on property/appliance | Quick note from appliance page |
| `maintenance_recorded` | Manual maintenance form | Legacy data import, contractor entry |
| `warranty_added` | Warranty registration form | Document upload with warranty, manual entry |
| `contractor_visit_logged` | Contractor form | Appliance visit logging, manual notes |
| `recurring_maintenance_completed` | System auto-trigger | On recurring task completion |

---

## Timeline Feed Strategy

### Property Timeline
Displays all events for a property, ordered by date (newest first).
- Includes all event types
- Shows connected appliances inline
- Grouped by month/year

### Appliance Timeline
Displays events affecting a specific appliance.
- Events with this appliance in `deviceIds`
- Events for the appliance's entire lifecycle
- Linked to property timeline context

### Dashboard Activity Feed
Curated recent events across all properties.
- Recent completions
- Recent repairs
- Overdue items
- Upcoming inspections

### System Timeline (Future)
Master timeline for entire facility/portfolio.
- All events across all properties
- Filterable by type, property, appliance
- Analytics dashboard shows trends

---

## Implementation Priority

### Phase 1a — Foundation (Current Sprint)
- [x] Extend `MaintenanceEvent` type with all 10 event types
- [ ] Ensure all event fields are in Firestore schema
- [ ] Create Firestore rules for all event types
- [ ] Add event creation functions in backend

### Phase 1b — Event Sourcing (Next Sprint)
- [ ] Task completion → creates `task_completed` event
- [ ] Repair logging → creates `repair_logged` event
- [ ] Inspection form → creates `inspection_completed` event
- [ ] Invoice upload → creates `invoice_uploaded` event
- [ ] Document upload → creates `document_uploaded` event
- [ ] Note entry → creates `service_note_added` event

### Phase 1c — Timeline Retrofit (Following Sprint)
- [ ] Property timeline reads from maintenanceEvents
- [ ] Appliance timeline reads from maintenanceEvents
- [ ] Dashboard feed reads from maintenanceEvents
- [ ] All UI displays relative time (e.g., "2 days ago")

### Phase 1d — Polish (Sprint After)
- [ ] Event icons for visual scanning
- [ ] Rich event cards with context
- [ ] Filtering by event type
- [ ] Search across events

---

## Database Considerations

### Collection Structure
```
maintenanceEvents/
  {eventId}/
    (all MaintenanceEvent fields)
```

### Indexes Needed
- `propertyId + createdAt DESC` (timeline queries)
- `deviceIds array contains + createdAt DESC` (appliance timelines)
- `accountId + propertyId + createdAt DESC` (account-scoped views)
- `eventType + createdAt DESC` (type filtering)
- `tags array contains + createdAt DESC` (tag filtering)

### Query Patterns
```javascript
// Property timeline
where('propertyId', '==', propertyId)
orderBy('createdAt', 'desc')

// Appliance timeline
where('deviceIds', 'array-contains', deviceId)
orderBy('createdAt', 'desc')

// Event type filtering
where('eventType', '==', 'inspection_completed')
orderBy('createdAt', 'desc')

// Multi-property dashboard
where('accountId', '==', accountId)
orderBy('createdAt', 'desc')
limit(50)
```

---

## Success Criteria for Phase 1

✅ All 10 event types properly captured in Firestore
✅ Every new maintenance action creates appropriate event
✅ Property timeline shows all events chronologically
✅ Appliance timeline shows only appliance-relevant events
✅ Dashboard shows recent significant events
✅ No data loss from previous system
✅ Backward compatible with existing maintenanceHistory records
✅ Events appear instantly in UI after creation
✅ Relative time display on all events ("2 days ago")

---

## Long-term Benefits

Once Phase 1 is complete, you unlock:
- **Property History**: Complete operational story for home sales, insurance, audits
- **Predictive Maintenance**: Analytics to predict system failures
- **Reports**: Export maintenance history by appliance/system
- **Contractor Intelligence**: Track repair frequency, costs, contractor performance
- **System Health**: Dashboard showing which systems need attention
- **Compliance**: Audit trail for warranty claims, insurance
