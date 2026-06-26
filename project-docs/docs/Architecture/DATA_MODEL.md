# Data Model

Last reviewed: 2026-06

## Purpose

This document describes the Firestore-facing data model used by Maintley.

It serves as the source of truth for:

* Collection structures
* Document relationships
* Persisted field definitions
* Ownership boundaries
* Resource hierarchy

TypeScript interfaces remain the best field-level reference for client-facing object shapes.

---

## Data Model Philosophy

This document describes persisted data structures and collection relationships.

It should answer:

* What collections exist?
* What fields exist?
* How collections relate to one another?
* What data is considered authoritative?

This document should not define:

* Product behavior
* Feature availability
* Recommendation logic
* Navigation structure
* User-facing workflows
* Subscription plan capabilities

Those topics belong in product documentation.

The collections described here represent Maintley's source-of-truth data model.

---

## Conventions

* Most timestamps are ISO strings in client-created records.
* Some records may contain Firestore `Timestamp` values from older or server-created data; `docToData` in `src/Redux/API/apiSlice.ts` sanitizes those to ISO strings for RTK Query responses.
* Newer account-scoped records use `accountId`.
* Older records and some compatibility paths still use `userId`.
* `id` is generally the Firestore document id, even when a document also stores an `id` field.
* Undefined values are stripped in several server-side paths before Firestore writes.

---

## Core Relationships

Maintley is organized around properties.

Primary hierarchy:

Account
└── Properties
├── Appliances & Systems
├── Tasks
├── Maintenance Events
├── Contractors
├── Files & Documentation
├── Tenants
└── Team Assignments

### Relationship Overview

Properties serve as the primary organizational object.

Appliances & Systems belong to properties.

Tasks belong to properties and may optionally reference one or more appliances.

Maintenance Events may reference:

* Properties
* Tasks
* Appliances & Systems
* Contractors

Contractors may be associated with one or more properties.

Team members may be assigned access to one or more properties.

Notifications are generated from changes within these records.

---

### Global vs Property Views

Maintley may expose information through:

* Property-centric views
* Global portfolio views

These are presentation concerns only.

The underlying data model remains property-centered regardless of navigation structure.

---

## Derived Models

Certain platform capabilities are generated from persisted data rather than acting as primary collections.

Examples include:

* Maintley Intelligence
* Recommendations
* Setup Progress
* Maintley Intelligence summaries
* Dashboard Insights
* Attention Center summaries

These concepts should be treated as derived views of existing records.

Source records remain:

* Properties
* Appliances & Systems
* Tasks
* Maintenance Events
* Contractors
* Files & Documentation

Derived features may cache results for performance purposes, but the underlying source of truth should remain the core collections.

### Recommendation Data

Recommendations are expected to be generated from:

* Appliance Profiles
* Existing appliance metadata
* Maintenance history
* Task history
* Documentation availability

Recommendations exist to guide users toward improving records rather than replacing those records.

Recommendation data should not become the authoritative source of property information.

---

## Core Collections

Maintley is built around a small number of authoritative collections.

These collections represent the primary source of truth for platform data.

Core collections include:

* familyAccounts
* accountMemberships
* properties
* devices
* tasks
* maintenanceEvents
* contractors
* tenantProfiles
* teamMembers
* notifications
* favorites

Additional collections may exist for operational, billing, invitation, and compatibility purposes.

---

# Account Model

Maintley uses an account-centric ownership model.

Primary hierarchy:

```text
User
    ↓
Account Membership
    ↓
Account
    ↓
Properties
```

Users may belong to one or more accounts.

Accounts own properties and associated records.

Properties remain the primary organizational object throughout the platform.

---

## familyAccounts

Represents an account.

Examples:

* Homeowner account
* Family account
* Property management account

Typical fields:

* id
* name
* ownerId
* createdAt
* updatedAt
* subscriptionStatus
* subscriptionPlan

Purpose:

Defines ownership boundaries for all account-scoped resources.

---

## accountMemberships

Represents user access to an account.

Typical fields:

* accountId
* userId
* roles
* status
* createdAt

Purpose:

Controls account-level access and permissions.

Preferred ownership model:

```text
Account
    ↓
Membership
    ↓
User
```

This model replaces older userId ownership patterns over time.

---

# Property Model

Properties are the primary organizational record in Maintley.

Properties provide context for:

* Appliances & Systems
* Tasks
* Maintenance Events
* Contractors
* Documentation
* Recommendations

Properties should remain the central organizing object throughout the platform.

---

## properties

Represents a property record.

Examples:

* Primary Residence
* Rental Property
* Vacation Home

Typical fields:

* id
* accountId
* name
* address
* propertyType
* photoUrl
* notes
* createdAt
* updatedAt

Optional fields may include:

* squareFootage
* yearBuilt
* lotSize
* utility information
* occupancy information

Properties should store descriptive information rather than operational history.

Operational history belongs in Maintenance Events.

## Property Groups

Property groups organize existing property records for portfolio navigation.
They do not own or duplicate property data.

Optional presentation fields include:

* description
* sortOrder
* defaultCollapsed
* groupIconKey
* groupIconColor
* groupIconBgColor

These fields control organization and display only. Properties remain the
authoritative records, and group membership continues to reference them.

---

# Appliance & System Model

Appliances and systems represent maintainable assets associated with a property.

Examples:

* HVAC Systems
* Water Heaters
* Roofs
* Refrigerators
* Generators
* Water Softeners
* Well Systems
* Pool Equipment

Maintley uses the term:

```text
Appliances & Systems
```

for user-facing communication.

The underlying collection currently remains:

```text
devices
```

for compatibility reasons.

---

## devices

Represents a maintainable asset.

Typical fields:

* id
* accountId
* propertyId
* name
* type
* assetType
* assetVariant
* manufacturer
* model
* serialNumber
* installDate
* warrantyExpiration
* notes
* createdAt
* updatedAt

Optional fields may include:

* filterSize
* capacity
* fuelType
* voltage
* location
* photoUrl

Device records should contain descriptive information about the asset itself.

`type` remains the homeowner-facing display label stored on the device record.

`assetType` stores the canonical asset classification Maintley Intelligence should reason over, such as:

* HVAC
* Water Heater
* Dryer
* Stove/Oven
* Refrigerator
* Safety Device

`assetVariant` stores the more specific pattern when known, such as:

* Furnace
* Tankless Gas
* Tank Electric
* Smoke Detector

Older records may only contain `type`. Those records remain valid and may be backfilled to `assetType` and `assetVariant` when safe inference is available.

Maintenance activity belongs in:

```text
maintenanceEvents
```

---

## Device Relationships

Devices may be associated with:

* Properties
* Tasks
* Maintenance Events
* Files & Documentation
* Recommendations

Relationship example:

```text
Property
    ↓
HVAC System
    ↓
Maintenance Events
```

Devices are expected to accumulate useful information over time.

---

# Task Model

Tasks represent work that should be completed.

Examples:

* Replace HVAC Filter
* Flush Water Heater
* Inspect Roof
* Replace Refrigerator Filter
* Repair Faucet

Tasks focus on future or pending work.

Completed work should ultimately be represented through Maintenance Events.

---

## tasks

Represents a maintenance activity.

Typical fields:

* id
* accountId
* propertyId
* title
* description
* dueDate
* priority
* status
* recurrence
* assignee
* assignedTo
* createdAt
* updatedAt

Optional fields may include:

* linkedDeviceIds
* contractorId
* notes
* attachments
* estimatedCost
* actualCost

Tasks may exist independently or be associated with one or more devices.

Task assignment stores both:

* An `assignee` record ID used only as an internal reference.
* An `assignedTo` display snapshot containing the assignee name and optional email.

The display snapshot should be preserved when a team member, family member, or
contractor loses access so historical and active tasks never expose a raw record
ID in the interface.

---

# Task Status Model

Task status is intentionally simplified.

Maintley should minimize persisted status values and derive presentation states whenever possible.

---

## Stored Status Values

Preferred stored statuses:

```text
Initiated
Completed
```

These represent actual task state.

---

## Legacy Status Values

Older records may contain:

```text
pending
in_progress
awaiting_approval
rejected
hold
overdue
```

These remain supported for compatibility purposes.

New development should favor simplified status handling.

---

## Derived Display Status

User-facing status may be calculated from:

* stored status
* dueDate
* completion date

Examples:

```text
Initiated
    ↓
Upcoming
```

```text
Initiated
    ↓
Due Soon
```

```text
Initiated + Past Due Date
    ↓
Overdue
```

```text
Completed
    ↓
Completed
```

Overdue should be treated as a derived state rather than a persisted state whenever possible.

---

## Overdue Handling

Maintley treats overdue status as a derived state rather than a primary persisted status.

Preferred model:

Stored Status
    ↓
initiated

Due Date
    ↓
Past Due

Display Status
    ↓
overdue

The due date remains the authoritative source for overdue calculations.

New development should avoid persisting:

- overdue

as a primary task status whenever possible.

Instead, overdue presentation should be derived from:

- stored task status
- due date
- completion date

This approach reduces status synchronization issues and simplifies task lifecycle management.

---

## Task Lifecycle

Typical flow:

```text
Task Created
    ↓
Initiated
    ↓
Completed
    ↓
Maintenance Event Created
```

Tasks track planned work.

Maintenance Events preserve historical work.

---

# Maintenance Event Model

Maintenance Events are the historical source of truth for completed maintenance activity.

This is one of the most important collections in Maintley.

Maintenance Events preserve:

* Repairs
* Inspections
* Replacements
* Service Calls
* Completed Tasks
* Historical Documentation

Maintenance Events should remain useful regardless of future changes to tasks, appliances, or recommendations.

---

## maintenanceEvents

Represents completed maintenance activity.

Typical fields:

* id
* accountId
* propertyId
* title
* description
* completedDate
* maintenanceType
* contractorId
* createdAt
* updatedAt

Optional fields may include:

* linkedTaskId
* linkedDeviceIds
* cost
* attachments
* notes

Maintenance Events should be treated as historical records rather than active workflows.

---

## Historical Source of Truth

Maintley follows this model:

```text
Task
    ↓
Maintenance Event
```

Tasks represent intended work.

Maintenance Events represent completed work.

Historical reporting should favor Maintenance Events whenever possible.

---

## Legacy Maintenance History

Some portions of the platform still reference:

```text
maintenanceHistory
```

This collection exists for compatibility.

Future development should favor:

```text
maintenanceEvents
```

as the canonical maintenance history collection.

---

# Contractor Model

Contractors represent service providers associated with one or more properties.

Examples:

* HVAC Companies
* Electricians
* Plumbers
* Roofers
* Landscapers
* Pest Control Providers

Contractors serve as reference records and historical relationships.

They are not system users.

---

## contractors

Represents a service provider.

Typical fields:

* id
* accountId
* name
* companyName
* email
* phone
* website
* notes
* createdAt
* updatedAt

Optional fields may include:

* serviceCategories
* preferredVendor
* emergencyContact
* address

Contractors may be associated with:

* Properties
* Tasks
* Maintenance Events

---

## Contractor Relationships

Example:

```text id="8c3o8z"
Property
    ↓
Contractor
    ↓
Maintenance Event
```

Contractor records help preserve service history and contact information over time.

---

# Team Model

Team members represent users who assist with property operations.

Examples:

* Property Managers
* Maintenance Staff
* Administrative Staff
* External Assistants

Team members are authenticated users with account-level access.

---

## teamMembers

Represents a team relationship.

Typical fields:

* id
* accountId
* userId
* role
* status
* createdAt
* updatedAt

Optional fields may include:

* assignedPropertyIds
* teamGroupIds
* notes

Team Members should be linked through:

```text id="y17m4u"
accountMemberships
```

whenever possible.

The teamMembers collection primarily supports operational workflows and compatibility needs.

---

## Team Relationships

Example:

```text id="um7g2m"
Account
    ↓
Team Member
    ↓
Assigned Properties
```

Property assignments may further restrict visibility and workflow access.

---

# Tenant Model

Tenants represent occupants associated with a property.

Tenants are intentionally limited in scope.

Maintley is not intended to be a lease management platform.

Tenant functionality primarily supports maintenance communication.

---

## tenantProfiles

Represents a tenant relationship.

Typical fields:

* id
* accountId
* propertyId
* name
* email
* phone
* status
* createdAt
* updatedAt

Optional fields may include:

* moveInDate
* moveOutDate
* emergencyContact
* notes

Tenant records should remain maintenance-focused.

---

## Tenant Relationships

Example:

```text id="1c73lq"
Property
    ↓
Tenant
    ↓
Maintenance Requests
```

Tenant records should not become the source of lease, payment, or accounting information.

---

# Notification Model

Notifications represent user-facing events generated by platform activity.

Notifications are derived from changes within the system.

Examples:

* Task reminders
* Maintenance completion alerts
* Team activity
* Tenant requests
* Maintley Intelligence observations

---

## notifications

Represents a notification record.

Typical fields:

* id
* userId
* accountId
* type
* title
* message
* createdAt
* readAt

Optional fields may include:

* propertyId
* taskId
* maintenanceEventId
* actionUrl

Notifications should remain lightweight and user-focused.

---

## Notification Relationships

Notifications may originate from:

* Tasks
* Maintenance Events
* Team Activity
* Tenant Requests
* Maintley Intelligence

Example:

```text id="5ydn2x"
Task Due
    ↓
Notification
```

Notifications are delivery records rather than sources of truth.

The originating record should remain authoritative.

---

# Favorites Model

Favorites allow users to quickly access frequently used records.

Favorites are user-specific convenience records.

---

## favorites

Represents a user bookmark.

Typical fields:

* id
* userId
* resourceType
* resourceId
* createdAt

Supported resources may include:

* Properties
* Appliances & Systems
* Tasks
* Contractors

Favorites should never own business data.

They simply reference existing records.

---

# File & Documentation Model

Files provide supporting documentation for properties and maintenance records.

Examples:

* Manuals
* Warranties
* Receipts
* Photos
* Inspection Reports
* Service Documentation

Files should support records rather than replace them.

---

## File Ownership

Files may be associated with:

* Properties
* Appliances & Systems
* Tasks
* Maintenance Events

Example:

```text id="c2kjwq"
Property
    ↓
Water Heater
    ↓
Warranty PDF
```

---

## File Metadata

Typical metadata may include:

* fileName
* contentType
* fileSize
* uploadedBy
* uploadedAt
* storagePath

Actual file content resides in:

```text id="0uwu1w"
Firebase Storage
```

Metadata should remain lightweight and reference-based.

---

# Reporting Model

Reports are generated from existing records.

Reports are derived data rather than authoritative records.

Primary reporting sources:

* Properties
* Appliances & Systems
* Tasks
* Maintenance Events
* Contractors

Reports should not introduce new sources of truth.

The underlying records remain authoritative.

---

## Reporting Relationships

Example:

```text id="m2n5f4"
Maintenance Events
    ↓
Report
```

Example:

```text id="udw8h4"
Tasks
    ↓
Report
```

Reports are views of existing data rather than independent datasets.

---

# Maintley Intelligence Model

Maintley Intelligence is a derived system.

Maintley Intelligence does not own source data.

Instead, it analyzes existing records and generates guidance.

Maintley Intelligence consumes:

* Properties
* Appliances & Systems
* Tasks
* Maintenance Events
* Documentation Records

Maintley Intelligence generates:

* Recommendations
* Property Insights
* Dashboard Guidance
* Quick Scan Results
* Portfolio Intelligence

Maintley Intelligence should always remain downstream from source records.

## Property Scan Snapshots

Quick Property Scan results are persisted as derived snapshots.

Collections:

* propertyScanLatest
* propertyScanSnapshots

`propertyScanLatest/{propertyId}` stores the latest Quick Scan snapshot for a property so the Insights tab can show the latest recommendations whenever the user returns.

`propertyScanSnapshots/{snapshotId}` stores append-only scan history snapshots for future history views.

Typical fields:

* accountId
* propertyId
* scanType
* schemaVersion
* planId
* createdAt
* updatedAt
* createdBy
* systemsReviewed
* summary
* recommendations
* premiumPreview (optional)

Saved recommendations include source provenance. `source` determines plan entitlement for newly generated recommendations:

* `property_memory`
* `knowledge_pack`
* `history_inference`
* `context`

`premiumPreview` is an optional derived explanation of additional Homeowner+ guidance that was available when the scan ran. It is stored separately from `recommendations` so upgrade education never changes recommendation counts, priorities, or the Quick Scan result limit.

Property scan snapshots are derived records. They preserve what Maintley Intelligence showed at scan time, but they do not replace properties, systems, tasks, maintenance events, or documentation records as the source of truth.

---

## Maintley Intelligence Relationships

Example:

```text id="vzq2yw"
Property
    ↓
HVAC System
    ↓
Missing Filter Size
    ↓
Recommendation
```

Example:

```text id="1zl2lc"
Maintenance History
    ↓
No Recorded Filter Changes
    ↓
Recommendation
```

Maintley Intelligence should improve records rather than replace them.

---

# Recommendation Model

Recommendations are derived records.

Recommendations identify opportunities to improve records or maintenance outcomes.

Recommendations may originate from:

* Appliance Profiles
* Property Records
* Maintenance Events
* Task Records
* Documentation Records
* Setup Assistant Responses

Recommendations should never become authoritative records.

The underlying source record remains the source of truth.

---

## Recommendation Categories

Recommendations may belong to:

### Maintenance

Examples:

* Replace HVAC Filter
* Flush Water Heater
* Inspect Roof

---

### Information

Examples:

* Add Install Date
* Add Filter Size
* Add Capacity

---

### Parts & Supplies

Examples:

* Add HVAC Filter Information
* Add Refrigerator Water Filter Information

---

### Documentation

Examples:

* Upload Manual
* Upload Warranty
* Upload Receipt

---

## Recommendation Relationships

Example:

```text id="u8l7o2"
Device
    ↓
Recommendation
```

Example:

```text id="5sqbvu"
Maintenance Event History
    ↓
Recommendation
```

Recommendations should be regenerated from source records whenever possible rather than maintained independently.

---

# Setup Progress Model

Setup Progress is a derived concept.

It should not become an independent source of truth.

Setup Progress may evaluate:

* Property Information
* Appliance Records
* Maintenance Records
* Documentation Records

Example:

```text id="ztw7zb"
Property
    ↓
Recommended Systems
    ↓
Setup Progress
```

The purpose of Setup Progress is guidance.

It should not be treated as validation.

---

# Dashboard Model

Dashboard content is primarily derived.

The dashboard should aggregate:

* Tasks
* Maintenance Events
* Recommendations
* Maintley Intelligence

Dashboard records should not become long-term storage.

The dashboard exists to surface information from authoritative records.

---

## Dashboard Relationships

Example:

```text id="s1z9m4"
Tasks
    ↓
Dashboard
```

Example:

```text id="d4mxp6"
Recommendations
    ↓
Dashboard
```

Dashboard content should be regenerated from source records whenever possible.

---

# Source of Truth Model

Maintley uses layered ownership.

```text id="u3xnnf"
Properties
    ↓
Organizational Layer

Maintenance Events
    ↓
Historical Layer

Maintley Intelligence
    ↓
Recommendation Layer
```

Each layer has a distinct responsibility.

---

## Organizational Layer

Primary records:

* Properties
* Appliances & Systems
* Contractors
* Tenants

Purpose:

Provide context.

---

## Historical Layer

Primary records:

* Maintenance Events

Purpose:

Preserve completed work and historical activity.

---

## Recommendation Layer

Primary records:

* Recommendations
* Property Insights
* Setup Progress
* Dashboard Guidance

Purpose:

Help users decide what to do next.

Recommendation records should remain derived from authoritative records.

---

# Derived Data Philosophy

Maintley intentionally separates source records from derived records.

Source records should be authoritative.

Derived records should be replaceable.

Examples of source records:

* Properties
* Devices
* Tasks
* Maintenance Events
* Contractors

Examples of derived records:

* Recommendations
* Property Insights
* Dashboard Summaries
* Setup Progress
* Portfolio Intelligence

If a derived record becomes inaccurate, it should be possible to regenerate it from source records.

---

# Data Ownership Rules

When designing new features, ask:

1. What is the source record?
2. Is this information already stored elsewhere?
3. Should this be persisted or derived?
4. Can this be regenerated?

Prefer:

```text id="w2wqv6"
Source Record
    ↓
Derived View
```

Avoid:

```text id="yl4m8j"
Source Record
    ↓
Derived Record
    ↓
Secondary Source Of Truth
```

Maintley should minimize competing sources of truth.

---

# Future Direction

The Maintley data model should continue moving toward:

* Account-centric ownership
* Property-centric organization
* Maintenance Event-centric history
* Maintley Intelligence-driven guidance

Future development should favor:

```text id="fw7d7w"
Properties
    ↓
Maintenance Events
    ↓
Maintley Intelligence
    ↓
User Action
```

over creating additional ownership models or duplicate records.

The long-term objective is to keep the data model understandable, maintainable, and capable of supporting increasingly sophisticated Maintley Intelligence features without introducing competing sources of truth.

---

# Guiding Principles

Maintley data should remain:

* Account-centric
* Property-centric
* Event-driven
* Explainable
* Regenerable

Properties provide context.

Maintenance Events preserve history.

Maintley Intelligence provides guidance.

These responsibilities should remain distinct as the platform evolves.
