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
* Maintley Intelligence interactions

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
* Upload files from property, equipment, task, or completion workflows.
* Let reviewed Property Knowledge suggestions connect files to equipment, systems, tasks, contractors, costs, parts, warranties, or maintenance records.
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

## Equipment Files

Associated with an equipment or system.

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
properties/{accountId}/{filename}
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

| Plan       | File Count Limit | Storage Limit |
| ---------- | ---------------- | ------------- |
| Homeowner  | None             | 1 GB          |
| Homeowner+ | None             | 10 GB         |
| Property   | None             | 15 GB         |
| Portfolio  | None             | 25 GB         |

Storage volume is the enforceable customer-facing resource boundary. The
entitlement package uses a large technical sentinel for `files` to preserve its
versioned numeric contract, but upload authorization does not present or rely
on a practical file-count allowance.

Existing files remain readable and downloadable after a downgrade. New uploads
are blocked only when the current storage usage meets or exceeds the effective
plan's byte quota.

Customer-facing plan definitions should remain in:

MAINTLEY_PLAN_FEATURE_MATRIX.md

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
* Equipment & system files
* Manuals
* Warranty documents
* Maintenance files
* Task completion attachments through the property document upload path

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

Properties are the canonical owner for property documents.

Documents uploaded from property, equipment, or task document contexts should still be stored as property document records.

Context-specific screens should show filtered document views based on document links rather than owning separate document arrays.

Properties may store document records for:

* Manuals
* Warranties
* Property documents
* General supporting records

Typical fields:

* id
* propertyId
* fileName
* fileUrl
* documentType
* size
* type
* uploadedAt
* uploadedBy
* storagePath
* links
* acquisitionStatus
* acquisitionStartedAt
* acquisitionCompletedAt
* acquisitionError
* extractedKnowledgeSuggestionIds

`links` may include:

* assetIds
* taskIds
* maintenanceEventIds, reserved for future maintenance-event migration
* contractorIds, reserved for future contractor document links
* warrantyIds, reserved for future warranty document links
* partIds, reserved for future part document links

Legacy fields such as `name`, `url`, `category`, `assignedDeviceId`, `assignedTaskId`, and `assignedTaskStatus` may remain during migration for backwards compatibility.

These documents support long-term property recordkeeping and Property Knowledge Acquisition.

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

* Equipment photo remains unchanged when warranty PDF is uploaded.

Bad:

* Warranty upload replaces equipment image.

---

# Task Completion Files

Task completion workflows may upload files to:

```text
properties/{accountId}/{filename}
```

Resulting metadata may be attached to:

* Completed tasks
* Maintenance events
* Activity history
* Property documents

Task attachments should preserve historical records of completed work.

Task completion files are stored as property documents first, then the saved
file reference may be reused on the completed task or resulting Maintenance
Event. This prevents task completion uploads from becoming a parallel document
source.

---

# Maintley Intelligence Integration

Maintley Intelligence may use file metadata when generating recommendations.

Examples:

* Missing warranty documentation
* Missing equipment manuals
* Missing service records
* Missing property documentation

Maintley Intelligence should evaluate:

* File presence
* Metadata availability
* Relationships to Maintley records

Maintley Intelligence should not assume file contents are available for analysis unless future extraction systems explicitly support content inspection.

---

# Property Knowledge Acquisition Integration

Documents may create Property Knowledge Acquisition suggestions.

In the current phase, suggestions come from document metadata, lightweight OCR
for uploaded image files, and backend text extraction for supported text-based
PDF invoices or receipts.

PDF uploads should not be blocked while acquisition runs. The Property Document
is saved first, then its acquisition status may move to `processing`,
`pending_review`, or `failed`. The original PDF remains the canonical document.
Rendered page images or extracted text are derived processing artifacts and
should not become user-facing Property Documents.

Maintley does not automatically update property, system, task, maintenance history, part, contractor, or warranty records from uploaded documents.

Upload context should not create permanent ownership by itself. A document
uploaded from an equipment, system, task, or completion workflow is still a
property document. The acquisition and review workflow may later add links to
the records the document supports after the user accepts the suggested changes.

Users must review suggested details before saving them to Property Memory.

After user approval, applied suggestions may update source records such as property details, system details, contractor records, maintenance history, or a system's Parts & Supplies list.

Applied suggestions should preserve provenance back to the source document, including sourceDocumentId, sourceDocumentType, extractionMethod, confidence when available, acceptedByUser, and acceptedAt.

Property Knowledge Acquisition grows Property Memory.

Maintley Intelligence reasons over Property Memory.

The recommendation engine should not parse raw documents directly.

---

# Storage Rules Status

Storage rules are maintained in:

```text
storage.rules
```

`firebase.json` wires the Storage rules file for deployment.

The repository includes:

```bash
yarn test:storage
```

This runs Firebase Emulator-backed allow/deny assertions against Storage rules
and Firestore account/property context. The test covers:

* Property document and image paths.
* User profile images.
* Team member images and files.
* Equipment and system files.
* Maintenance files.
* Support ticket attachments created by server-side feedback workflows.
* Default-deny behavior for unknown paths.

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
* Automatic equipment manual matching
* Warranty extraction
* Receipt parsing
* AI-assisted document classification

These capabilities should enhance existing records rather than replace the underlying storage model.

The source of truth should remain the underlying property, equipment, task, and maintenance records.
