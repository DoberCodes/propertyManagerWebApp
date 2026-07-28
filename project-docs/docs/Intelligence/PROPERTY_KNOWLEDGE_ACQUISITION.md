# Property Knowledge Acquisition

Last reviewed: 2026-06

Property Knowledge Acquisition is the layer that turns uploaded documents and other sources into reviewed structured property knowledge.

It happens before Maintley Intelligence.

Source-specific support status, limitations, and planned property-confirmation
safeguards are tracked in
`PROPERTY_KNOWLEDGE_ACQUISITION_STATUS_MATRIX.md`.

Plan availability:

* Document upload and storage remain available on all plans.
* Suggested details from uploaded documents are available on Homeowner+,
  Property, and Portfolio plans.
* Free users may see a preview or upgrade prompt, but upload workflows should
  save the source document without starting Property Knowledge Acquisition.
* Manuals and warranties are stored and linked as Property Documents, but do
  not enter Property Knowledge Acquisition until purpose-built extraction is
  available for those document types.

```text
Document / source
    ->
Knowledge Acquisition
    ->
User review
    ->
Property Memory
    ->
Maintley Intelligence recommendations
```

---

# Responsibility

Property Knowledge Acquisition is responsible for:

* Classifying source documents.
* Creating suggested structured details.
* Preserving provenance for suggested details.
* Asking the user to review, edit, accept, or reject suggestions.
* Applying accepted details to Property Memory only after user approval.

Property Knowledge Acquisition is not responsible for:

* Generating recommendations.
* Performing financial analysis.
* Diagnosing equipment condition.
* Updating property or system records without user approval.
* Parsing raw document content for Maintley Intelligence.

Part and supply extraction uses the Part Knowledge Catalog. The acquisition layer may match conservative document text against catalog definitions and create reviewable part suggestions. The catalog identifies possible part types; it does not decide that a suggestion is true.

---

# Current Implementation

Property Knowledge Acquisition stores source documents and review suggestions as
property-scoped first-class records:

* `propertyDocuments/{documentId}`
* `propertyKnowledgeSuggestions/{suggestionId}`

The property record may still contain `documents` and `knowledgeSuggestions`
arrays during the migration period. Those embedded arrays are compatibility
mirrors for older surfaces and triggers. New acquisition and review surfaces
should read collection-backed records and merge embedded records only as a
fallback.

Property documents are the canonical source documents for acquisition. Uploads started from equipment, task, or task-completion screens should still create property document records. When a user explicitly uploads from a task or equipment workflow, Maintley may preserve that upload context as a supporting-document link so the file remains visible from that workflow. Upload context may help the UI, but acquisition should not automatically create additional permanent links to an asset, task, contractor, warranty, part, or Maintenance Event.

Additional links should come from reviewed Property Memory changes. If acquisition finds that a document appears to describe an existing asset, task, contractor, part, warranty, cost, or Maintenance Event, the review experience should propose that connection and let the user confirm it.

For eligible document categories, suggested details are generated from document metadata, lightweight image OCR
for uploaded image files, backend layout-aware extraction for supported
text-based PDFs, and backend DOCX text and table extraction for structured
maintenance service reports. Digital PDF and DOCX service reports share the
same deterministic visit interpreter after format-specific extraction. Maintley does not perform AI
extraction, rendered-page OCR for scanned PDFs, or manual-specific parsing in
this phase.

Manual and warranty uploads remain separate from this general acquisition path.
The document card does not offer **Check for suggested details**, **Scan again**,
or processing retry actions for those categories. This restriction is enforced
by both the upload workflow and the backend callable. Existing suggestions are
retained for review history and may still be rejected by the user.

Maintley Owner and Maintley Admin may use a small **Test scan - Maintley only**
action on stored PDF or DOCX manuals and warranties. The action requires a
warning confirmation and sends an explicit restricted-document override. The
backend verifies the caller's server-managed `maintley_role`, normal property
access, and the property's document-processing entitlement before running.
Customer account owners and administrators do not receive this authority. Test
scan results remain pending suggestions and identify the internal actor and role
in document-acquisition event metadata.

Structured PDF or DOCX service reports may propose a dated Maintenance Event,
recommended tasks, and equipment reconciliation. Positive and negative status
checks remain attributed visit observations within the Maintenance Event.
Inspection areas such as rooms or general structural checks must not be turned
into equipment records. Only controlled maintainable asset types may be offered
for matching or creation, and every proposed task or equipment record requires
review.

PDF acquisition runs after the canonical Property Document is saved. Maintley
first uses the PDF's embedded text layer and page coordinates to preserve lines
and recognized tables. Service-report layouts are routed through the shared
visit interpreter; other readable PDFs continue through document-specific field
extraction. The legacy byte-stream decoder remains a compatibility fallback when
the layout extractor cannot open a file. Image-only PDFs still require the
future rendered-page OCR fallback.

PDF uploads may move through `processing`, `pending_review`, or `failed`
acquisition states. The PDF remains the source document; any extracted text or
future rendered page images are derived processing artifacts only.

PDF and DOCX processing are backend-triggered from the saved property document
state. The frontend marks the supported document as `processing`; the backend
worker detects that state and performs extraction in the background. This
prevents the browser from
owning the processing lifecycle after upload.

Manual retry uses the callable processor directly instead of first writing a new
`processing` state. The backend writes only the final acquisition outcome for
that retry, which keeps the property document from receiving unnecessary status
updates during repeated review attempts.

The active property detail view listens to collection-backed property document
and suggestion records, then merges any embedded compatibility records. Document
acquisition status changes written by the backend, such as `pending_review` or
`failed`, should appear in the frontend without requiring a manual page refresh.

Document acquisition publishes Maintley Events for the review lifecycle:

* `document_review_started`
* `suggested_details_ready`
* `knowledge_imported`
* `document_review_failed`

These events drive in-app notifications and Android push delivery. Upload
screens should not directly create separate persistent notifications for each
document review state.

The callable processor remains available for explicit retry. If document processing
cannot be started or completed, the backend should move the document out of
`processing` with a homeowner-friendly retry message when needed.

Before suggesting a new record, Property Knowledge Acquisition should check existing Property Memory for likely targets. If an uploaded invoice, warranty, manual, receipt, or inspection report appears to describe an existing asset, contractor, Maintenance Event, part, warranty, or other record, the review experience should propose updating the existing record first. Users must be able to mark the match as not the same record and create a new record where creation is supported.

Target matching should be conservative and explainable. Safe matching signals include source document identity, invoice number, service date, contractor, total cost, related asset, serial number, model number, and existing document attachments. Similar text alone should not silently merge records.

When acquisition detects a clearly labeled service, job, installation, or
property address that conflicts with the selected property's saved address, the
review experience should warn that the document may be for a different property.
Maintley should require reviewer confirmation before applying suggested Property
Memory changes from that document.

Asset type and subtype suggestions must use Maintley's controlled asset taxonomy. The acquisition layer may infer `assetType` and `assetVariant` from document text, but review fields should use preset options rather than free text. If the source cannot be mapped to a known preset, Maintley should avoid suggesting a custom classification and leave the existing record unchanged.

When a suggestion maps to an existing property or system field, Maintley should only suggest the detail when that field is currently missing from Property Memory. Document details that represent new memory records, such as invoice totals, service notes, parts, or consumables, may still be suggested for review because they do not overwrite an existing property or system field.

Invoice line items, part model numbers, supplies, and consumables should be treated as maintenance-history or parts-and-supplies context. They should not overwrite system identity fields such as the system model or serial number unless the suggestion is clearly about the system itself.

Users review suggestions through the document workflow using the language:

> Maintley found possible details in this document.

The review experience should present proposed Property Memory changes, not raw
extracted fields. Users should see which Maintley records will be created or
updated, such as an asset, maintenance event, contractor, warranty, part, or
property detail. Financial details from invoices should be reviewed as part of
the Maintenance Event they describe, not as a separate financial source of
truth. For existing records, the review should show current values and proposed
values. For new records, the review should show a preview of the record that
will be created.

The review hierarchy should be object-first:

1. Property Memory object, such as Maintenance Event, Asset, Contractor, Warranty, or Parts.
2. Sections within the object, such as General, Financial, Contractor, Parts, Warranty, or Maintenance.
3. Individual fields only after the reviewer expands a section.

Objects and sections should default to accepted. Field-level keep/skip controls
belong inside expanded details so the default review feels like approving a
Property Memory merge, not answering a long list of database-field questions.

If Maintley finds a likely matching record, the review should explain why the
match was suggested and allow the reviewer to update the existing record or mark
it as not the same. This prevents duplicate work records when the same invoice is
uploaded more than once and keeps supporting documents connected to the right
Property Memory record.

Suggested details may be accepted, edited, rejected, or applied. Individual
proposed changes and part suggestions may also be skipped during review. Skipped
items should be retained with the suggestion when practical, but they should not
update Property Memory.

Rejected suggestions are retained as rejected records.

Applied suggestions are traceable to the source document.

If a PDF cannot be read by the current text extraction path, Maintley should
communicate that the document could not be reviewed yet and preserve the
document for a future retry. This should not block the upload or remove the
document from Property Memory.

The Suggested Details review surface should show active pending suggestions only.
After a suggestion is applied or rejected, it remains stored for provenance and
history, but it should no longer appear as an active review item.

Property documents may show a compact reviewed status, such as the number of
details added to Property Memory from the document.

Applied suggestions may appear in the property Insights History as read-only
“Knowledge added” events. These events summarize what was accepted from a
document without becoming Maintenance History. Maintenance History still answers
what happened to the property; Knowledge added events answer what structured
property knowledge Maintley saved from a source document.

Suggested details use a conservative confidence rubric:

* High confidence means the document clearly labels the detail and the target record does not currently have that value saved.
* Medium confidence means Maintley found useful context, such as a catalog match or invoice line item, that should be reviewed before saving.
* Low confidence means the detail was inferred from paragraph text or broad context. Low confidence details should not be shown as review suggestions in this phase.

When accepted document details include contractor contact information, the apply step may create a new property contractor or fill blank details on an existing matching contractor.

When accepted document details include invoice, service, financial, parts, or supply information, the apply step may create a Maintenance History record sourced from the document. Incomplete part or supply mentions may still be retained in the maintenance notes because they can help preserve useful property memory even when Maintley does not know the full part model.

When an accepted invoice or service document matches an existing Maintenance
Event, the apply step should update that existing event with missing source
document, note, device, contractor, or financial context instead of creating a
duplicate event. If the reviewer marks the match as not the same record, the
apply step may create a new Maintenance Event.

Task completion is the exception to plain upload behavior because completing a
task creates or updates Maintenance History. A completion attachment should
still be stored as a property document first, then reused on the completed task
or resulting Maintenance Event so the file remains part of Property Memory.

When accepted part suggestions are linked to a specific equipment or system, the apply step may add them to that system's Parts & Supplies list. These records should retain source context and should not be created without user review.

---

# Provenance

Every accepted field should preserve provenance.

Accepted field provenance includes:

* sourceDocumentId
* sourceDocumentType
* extractionMethod
* confidence, when available
* acceptedByUser
* acceptedAt

Property Memory should always be traceable back to its original source.

This supports future explanations such as:

> Source: Installation Invoice.pdf
> User accepted this detail on March 15, 2026.

---

# Financial Property Memory

Financial information is Property Memory.

The acquisition layer may extract factual financial information such as invoice totals, labor, parts, taxes, contractor names, invoice dates, and payment dates.

The acquisition layer should not perform financial analysis.

Cost trends, replacement recommendations, repair economics, lifecycle cost analysis, and budgeting belong to Maintley Intelligence as future recommendation rules that consume Property Memory.

Accepted invoice costs should be stored on the Maintenance Event or task they describe. The property Costs tab can centralize those costs as a derived view, but it should not become a separate owner of financial facts.

---

# Relationship to Maintley Intelligence

Property Knowledge Acquisition grows Property Memory.

Maintley Intelligence reasons over Property Memory.

These layers should remain separate.

Maintley Intelligence should not parse raw documents. It should consume accepted structured records and their provenance.

Part Knowledge Catalog definitions support acquisition only. Future Maintley Intelligence rules may reason over accepted parts and supplies, but Intelligence should not re-parse the source documents.
