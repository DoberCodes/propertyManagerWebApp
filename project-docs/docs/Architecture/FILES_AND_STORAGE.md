# Files and Storage

Last reviewed: 2026-06

## Purpose

This document describes how Maintley stores, organizes, references, and manages files.

It answers:

> How are files handled within Maintley?

This document covers:

* File categories
* Storage architecture
* Upload paths
* Metadata structures
* Storage limits
* Quota enforcement
* Property Intelligence interactions

For related documentation:

* DATA_MODEL.md
* PROPERTY_INTELLIGENCE.md
* APPLIANCE_PROFILES.md
* FIREBASE_STRUCTURE.md

---

# File Philosophy

Files exist to support maintenance records and property documentation.

Files should improve record quality and long-term maintainability, but should never be required to use Maintley.

Users should be able to:

* Track maintenance without uploading files.
* Store files without creating maintenance events.
* Associate files with properties, appliances, systems, tasks, or maintenance records.
* Build documentation gradually over time.

Documentation should enhance records rather than become a prerequisite for maintaining them.

---

# File Categories

Maintley supports several file categories.

## Property Files

Associated with a property.

Examples:

* Property photos
* Surveys
* Utility information
* Property documents
* Property reference materials

---

## Appliance & System Files

Associated with an appliance or system.

Examples:

* Manuals
* Warranty documents
* Specification sheets
* Service documentation
* Product reference materials

---

## Maintenance Files

Associated with maintenance history.

Examples:

* Invoices
* Contractor reports
* Service records
* Inspection documents
* Repair documentation

---

## Task Attachments

Associated with maintenance tasks.

Examples:

* Before photos
* After photos
* Completion documentation
* Supporting work evidence

---

## User & Team Files

Associated with users and team members.

Examples:

* Profile images
* Team member attachments
* Team-related files

---

# Storage Service

Maintley currently uses Firebase Storage.

Firebase Storage is initialized in:

```ts
export const storage = getStorage(app);
```

Uploads are performed through Firebase Storage SDK utilities including:

* ref
* uploadBytes
* getDownloadURL

Files are stored in Firebase Storage while Firestore stores metadata and references.

---

# Storage Architecture

Maintley follows a metadata-plus-reference model.

Firestore stores:

* File metadata
* Storage paths
* Download URLs
* Relationships to Maintley records

Firebase Storage stores:

* Actual file content

Maintley should avoid storing raw file contents inside Firestore documents.

---

# Known Upload Paths

Observed paths include:

```text
task-completions/{userId}/{taskId}/{timestamp}-{filename}
```

```text
properties/{userId}/{filename}
```

```text
user-profile-images/{userId}/{filename}
```

```text
team-member-images/{userId}/{memberId}/{filename}
```

```text
team-member-files/{userId}/{memberId}/{filename}
```

```text
device-files/{propertyId}/{deviceId}/{filename}
```

```text
maintenance-files/{propertyId}/{filename}
```

When introducing new file categories, upload paths should remain documented.

---

# Upload Helpers

Examples include:

* src/utils/propertyImageUpload.ts
* src/utils/propertyDocumentUpload.ts
* src/utils/userProfileImageUpload.ts
* src/utils/teamMemberFileUpload.ts
* src/utils/deviceFileUpload.ts
* src/utils/maintenanceFileUpload.ts
* src/utils/maintenanceRequestUpload.ts
* src/Components/TaskCompletionModal/TaskCompletionModal.tsx
* src/Components/Library/FileUploader

These helpers are responsible for upload handling, metadata creation, and quota validation.

---

# Storage Limits

Plan storage limits are defined through:

```text
src/constants/subscriptions.ts
```

and resolved through:

```text
src/utils/subscriptionUtils.ts
```

Current limits:

| Plan       | File Limit | Storage Limit |
| ---------- | ---------- | ------------- |
| Homeowner  | 10         | 1 GB          |
| Homeowner+ | 250        | 5 GB          |
| Property   | 1000       | 10 GB         |
| Portfolio  | 5000       | 25 GB         |

Customer-facing plan definitions should remain in:

PLAN_FEATURE_MATRIX.md

---

# Storage Quota Enforcement

New uploads should call:

```ts
assertStorageQuotaForFiles()
```

from:

```text
src/utils/storageQuota.ts
```

Current upload helpers enforce quota validation for:

* Property images
* User profile images
* Team member files
* Appliance & system files
* Manuals
* Warranty documents
* Maintenance files
* Task completion attachments

Storage usage is surfaced through:

```text
useStorageUsage
```

and displayed within navigation and account views.

---

# File Metadata

Maintley stores metadata rather than raw file content.

Common fields include:

* name
* fileName
* url
* size
* fileSize
* type
* mimeType
* uploadedAt
* description

Metadata should remain lightweight and focused on retrieval, display, and relationship management.

---

# Maintenance Event Attachments

Maintenance events use attachment metadata records.

Typical fields:

* id
* fileName
* fileSize
* mimeType
* url
* uploadedAt
* description

Maintenance events should reference files rather than duplicate file data.

---

# Property Documents

Properties may store document records for:

* Manuals
* Warranties
* Property documents
* General supporting records

Typical fields:

* id
* name
* url
* size
* type
* category
* assignedDeviceId
* assignedTaskId
* assignedTaskStatus
* uploadedAt
* storagePath

These documents support long-term property recordkeeping.

---

# Photos vs Documents

Photos and documents may share storage infrastructure but represent different user concepts.

Expected behavior:

Uploading a document:

* Creates or updates document metadata.
* Does not replace photos.

Uploading a photo:

* Updates the intended image field.
* Does not replace supporting documentation.

Examples:

Good:

* Appliance photo remains unchanged when warranty PDF is uploaded.

Bad:

* Warranty upload replaces appliance image.

---

# Task Completion Files

Task completion workflows may upload files to:

```text
task-completions/{userId}/{taskId}/{timestamp}-{filename}
```

Resulting metadata may be attached to:

* Completed tasks
* Maintenance events
* Activity history

Task attachments should preserve historical records of completed work.

---

# Property Intelligence Integration

Property Intelligence may use file metadata when generating recommendations.

Examples:

* Missing warranty documentation
* Missing appliance manuals
* Missing service records
* Missing property documentation

Property Intelligence should evaluate:

* File presence
* Metadata availability
* Relationships to Maintley records

Property Intelligence should not assume file contents are available for analysis unless future extraction systems explicitly support content inspection.

---

# Storage Rules Status

Important:

`firebase.json` does not currently wire a Storage rules file.

The repository includes:

```bash
npm run test:storage
```

Before relying on Storage rule behavior, verify:

* Whether Storage rules exist in Firebase Console.
* Whether a local Storage rules file should be added.
* Whether firebase.json should manage Storage rules.
* Whether test scripts match deployed behavior.

Storage security should not be assumed without verification.

---

# Maintenance Guidance

When adding new file functionality:

* Keep upload paths documented.
* Keep metadata structures aligned with DATA_MODEL.md.
* Avoid storing base64 content in Firestore.
* Use metadata and storage references whenever possible.
* Keep file ownership and access tied to Maintley permissions.
* Treat Storage URLs as references, not permissions.

Firebase Storage rules and application authorization should work together to protect access.

---

# Future Considerations

Potential future enhancements include:

* OCR extraction
* Barcode-assisted file association
* Automatic appliance manual matching
* Warranty extraction
* Receipt parsing
* AI-assisted document classification

These capabilities should enhance existing records rather than replace the underlying storage model.

The source of truth should remain the underlying property, appliance, task, and maintenance records.
