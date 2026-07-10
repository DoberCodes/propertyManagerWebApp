# ADR 0023: Property Documents as First-Class Records

Status: Accepted

Date: 2026-07-06

Related report: `project-docs/reports/2026-07-06-data-model-architecture-risk-audit.md`

## Context

Property documents and Property Knowledge Acquisition suggestions are currently
stored on the property record through embedded arrays such as:

* `documents`
* `knowledgeSuggestions`
* `propertyKnowledgeProvenance`

This worked for the first implementation, but document acquisition now includes
upload, OCR/PDF processing, review, apply, retry, notifications, and future
intelligence/history consumers.

Those workflows can all update the same property document, increasing document
size, contention, and lost-update risk.

## Decision

Property documents and knowledge acquisition records will become first-class
Firestore records.

Target model:

```text
propertyDocuments/{documentId}
propertyKnowledgeSuggestions/{suggestionId}
propertyKnowledgeProvenance/{provenanceId}
```

Each record should include:

* `accountId`
* `propertyId`
* source file metadata
* related entity links
* acquisition status
* created/updated timestamps
* provenance references where applicable

Properties may keep small summary fields only when needed, such as document
count, pending suggestion count, or latest document activity.

## Implementation Direction

The migration should be phased.

Phase 1:

* Keep current embedded arrays for compatibility.
* Add shared adapters so upload surfaces treat property documents as canonical
  property-owned records with context links.
* Avoid creating new task-only or equipment-only document ownership models.

Phase 2:

* Add first-class document and suggestion collections.
* Read through an adapter that can merge embedded legacy records and collection
  records.
* Write new records to collections.

Phase 3:

* Backfill embedded property documents and suggestions.
* Add summary fields to properties where useful.
* Retire direct UI dependence on embedded arrays.

Cloud Functions should eventually own multi-record document workflows that need
atomic state transitions.

## Consequences

Positive:

* Property records stay smaller and less contentious.
* Document processing can update individual records safely.
* Documents can be queried by property, asset, task, contractor, status, or
  upload date.
* Acquisition status and provenance become easier to audit.
* Future reporting, retention, and notification behavior becomes cleaner.

Cost:

* Requires a compatibility adapter and migration.
* Some rules and indexes will need to be added.
* Existing UI surfaces must stop assuming `property.documents` is complete.

## Non-Goals

* Remove embedded document arrays immediately.
* Automatically link documents to every inferred record without review.
* Replace Property Knowledge Acquisition review behavior.
* Create separate task-owned or equipment-owned document collections.

