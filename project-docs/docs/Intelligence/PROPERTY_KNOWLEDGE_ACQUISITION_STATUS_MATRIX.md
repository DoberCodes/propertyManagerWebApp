# Property Knowledge Acquisition Status Matrix

Last reviewed: 2026-06

This document defines what Maintley currently supports, partially supports, and
does not yet support when turning uploaded documents or other sources into
reviewed Property Memory.

Property Knowledge Acquisition is a review-first layer. It may find possible
details, but accepted Property Memory remains the source of truth.

```text
Source
    ->
Property Knowledge Acquisition
    ->
User review
    ->
Property Memory
    ->
Maintley Intelligence
```

Maintley Intelligence must not parse raw documents directly.

---

# Status Levels

| Status | Meaning |
| --- | --- |
| Current | Implemented in the active product flow. |
| Partial | Implemented for narrow cases or with important limitations. |
| Planned | Product direction is defined, but implementation is not complete. |
| Deferred | Intentionally out of scope for the current phase. |

---

# Source Support Matrix

| Source type | Status | Supported acquisition today | Review requirement | Accepted Property Memory outputs | Current limitations |
| --- | --- | --- | --- | --- | --- |
| PDF invoices | Partial | Canonical PDF upload, `processing` status, backend text extraction for supported text-based PDFs, invoice-like field suggestions. | Required before any record changes. | Source document provenance, Maintenance History event, contractor details, system details when fields are missing, warranty context, costs, parts and supply context. | First implementation targets single invoice or receipt PDFs and the first 1-3 pages. Scanned PDF OCR, rendered-page OCR, multi-document packets, and AI interpretation are not current support. |
| PDF receipts | Partial | Same backend PDF processing path as PDF invoices when receipt text is extractable. | Required before any record changes. | Maintenance History event, costs, contractor context, source document provenance. | Receipt layouts vary heavily. Unlabeled totals, handwritten receipts, and scanned-only PDFs may fail or require future OCR support. |
| Image invoices and receipts | Current, limited | Browser image OCR may extract labeled invoice, contractor, service, cost, system, warranty, and part details. | Required before any record changes. | Maintenance History event, contractor details, system details when fields are missing, warranty context, costs, parts and supply context. | OCR quality depends on image clarity. Maintley does not perform visual reasoning beyond OCR text in this phase. |
| Manuals | Partial | Document classification, metadata-based suggestions, and OCR-based obvious labeled details when uploaded as an image. | Required before any record changes. | System details when missing, source document provenance, possible parts and supplies when conservatively matched and linked to a system. | Full manual parsing, maintenance schedule extraction, troubleshooting interpretation, model compatibility reasoning, and PDF manual understanding are deferred. |
| Warranties | Partial | Document classification, metadata-based suggestions, OCR-based obvious warranty labels, and warranty-length context from supported document text. | Required before any record changes. | Warranty context, system details when missing, Maintenance History notes when tied to a service or invoice document. | Maintley does not yet parse complete warranty terms, exclusions, claim instructions, or registration deadlines reliably. |
| Property photos | Deferred | Photo files can be stored as property documents. OCR may help only if the image contains readable text and is processed through the image path. | Required if any suggestion is created. | Source document provenance only unless readable text produces reviewable suggestions. | Maintley does not identify equipment, conditions, labels, serial plates, damage, or room context from images through visual analysis yet. |
| General documents | Partial | Document classification, metadata-based suggestions, and OCR-based obvious labeled details for supported image uploads. | Required before any record changes. | Depends on detected details: contractor, Maintenance History, system, warranty, parts, or property context. | Maintley does not summarize arbitrary documents, interpret contracts, or create recommendations from raw document text. |
| Inspection reports | Partial | Classified by document name or type and may produce obvious OCR/metadata suggestions when supported by the upload path. | Required before any record changes. | Maintenance History context, contractor context, document provenance, and possible system details when fields are missing. | Structured inspection issue extraction, severity scoring, room-by-room parsing, and action-plan generation are not current support. |
| Contractor documents | Partial | Classified by document name or type and may produce contractor contact details from OCR text. | Required before any record changes. | Contractor details, source document provenance, and maintenance context when supported fields are present. | Maintley does not yet maintain a separate vendor-document workflow or verify licensing/insurance information. |

---

# Supported Field Families

Maintley currently supports conservative suggestions in these field families:

| Field family | Example fields | Target Property Memory |
| --- | --- | --- |
| System identity | manufacturer, brand, model, serial number, asset type, asset variant, install date, filter size | Appliance/System |
| Contractor | contractor name, installer, phone, website | Contractor |
| Warranty | warranty start date, warranty end date, warranty length, registration required | Warranty context |
| Invoice and service | invoice number, invoice date, maintenance date, maintenance description, service performed | Maintenance History |
| Cost | total cost, labor cost, parts cost, tax amount, currency | Maintenance History financials |
| Parts and supplies | part name, part number, parts replaced, consumables, lubricant type, fluid type | Maintenance History notes or system Parts & Supplies |
| Manual metadata | manual version, publication date, manufacturer support URL | Appliance/System |

Low-confidence extracted details should not be shown as active review
suggestions in the current phase.

---

# Review Rules

All acquisition paths must follow these rules:

* Do not update Property Memory automatically.
* Show proposed Property Memory changes, not raw extracted fields.
* Prefer updating an existing matching record before creating a duplicate.
* Explain why a record match was suggested.
* Let the reviewer mark a suggested match as not the same record.
* Preserve provenance for accepted changes.
* Keep rejected suggestions for review history when practical.
* Keep raw documents as the canonical source documents.
* Treat OCR text, rendered pages, and processing artifacts as derived data only.

---

# Property Confirmation

Status: Current, limited

Property confirmation protects users from applying a document to the wrong
property.

When Property Knowledge Acquisition detects a service address, job address,
installation address, billing property address, or similar property-location
text, Maintley should compare it with the selected property's saved address.

If the detected address appears different from the selected property address:

* The suggestion should remain reviewable.
* Maintley should draw attention to the mismatch before the user applies the
  suggestion.
* The review should use plain language, such as:

> This document may be for a different property.

* The reviewer should be able to continue only after confirming the document
  belongs to the selected property or choosing a different property workflow
  when that workflow exists.
* Maintley should not silently apply suggested Maintenance History, contractor,
  system, warranty, cost, or part changes while the mismatch is unresolved.

Property confirmation should be treated as an acquisition review safeguard, not
as a Maintley Intelligence recommendation.

## Initial Matching Strategy

The first implementation is conservative:

* Extract only clearly labeled address blocks such as `Service Address`, `Job
  Address`, `Installation Address`, `Property Address`, or `Service Location`.
* Normalize street number, street name, unit or suite text when available, city,
  state, and ZIP code.
* Compare against the selected property's saved address.
* Flag likely mismatches only when the document address and property address
  have meaningful conflicting address components.
* Avoid blocking review when the document address is missing, partial, or too
  ambiguous to compare.

## Non-Goals

Property confirmation should not:

* Geocode addresses in the browser.
* Rewrite the saved property address automatically.
* Create duplicate property records automatically.
* Block upload storage.
* Treat a contractor mailing address as a property mismatch.

---

# Implementation Status

Completed first phase:

* Added property-confirmation metadata to knowledge suggestions.
* Added deterministic address normalization and comparison utilities.
* Updated image OCR and backend PDF text acquisition to detect labeled service
  or job address blocks.
* Added a review warning when a document address conflicts with the selected
  property address.
* Required reviewer confirmation before applying suggested Property Memory
  changes when a mismatch is unresolved.
* Added tests for exact match, partial match, clear mismatch, contractor address
  ignored, and missing address cases.

Deferred work:

* Scanned PDF rendered-page OCR.
* Full manual understanding.
* Photo-based appliance identification.
* General document summarization.
* AI-based document interpretation.
* Multi-property document reassignment flow.
