# Property Knowledge Acquisition

Last reviewed: 2026-08

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

Property documents are the canonical source documents for acquisition. Uploads started from equipment, task, or task-completion screens should still create property document records. When a user explicitly uploads from a Task or Equipment workflow, Maintley preserves that explicit context as a canonical supporting-document relationship so the file remains visible from that workflow. The relationship does not change Property ownership. Acquisition must not silently create additional inferred links to Equipment, Tasks, Spaces, Supplies, contractors, warranties, or Maintenance Events.

Additional links should come from reviewed Property Memory changes. If acquisition finds that a document appears to describe an existing asset, task, contractor, part, warranty, cost, or Maintenance Event, the review experience should propose that connection and let the user confirm it.

For eligible document categories, suggested details are generated from document metadata, lightweight image OCR
for uploaded image files, backend layout-aware extraction for supported
text-based PDFs, and backend DOCX text and table extraction for structured
maintenance service reports. Digital PDF and DOCX service reports share the
same deterministic visit interpreter after format-specific extraction.
Recognized text-based general home-inspection PDFs and DOCX files use a separate staged interpreter that
first preserves report sections, observations, specifications, and explicit
recommendations before mapping them to reviewable Equipment and Task candidates.
The `inspection-v2` interpreter recognizes both simple headings such as
**Electrical** and compound headings such as **Electrical and Life Safety** or
**Heating, Cooling, and Plumbing**. A compound section may participate in more
than one system category so controlled equipment and recommendations are not
lost merely because a report groups related systems on one page.
Maintley does not perform AI
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

Recognized general inspection reports do not automatically become completed
Maintenance Events. The staged inspection interpreter creates a source-neutral
understanding of the report, then proposes only controlled maintainable assets
and explicit homeowner actions. Reported specifications such as HVAC filter
size or water-heater capacity remain attached to their equipment candidate.
Reported observations remain visible as expandable review context. If the
report does not clearly provide a visit date and performed work, Maintley does
not infer that maintenance occurred.

Inspection recommendations without a stated due date are created as **Not
scheduled** when accepted. Repeated recommendations in system sections and a
maintenance summary are deduplicated before review.

Inspection recommendation classification remains evidence-scoped. Refrigerator
filter wording is resolved before general HVAC-filter wording, tankless
descaling does not create a tank-flushing task, and negative instructions such
as "do not create a task" are not converted into homeowner actions.

PDF acquisition runs after the canonical Property Document is saved. Maintley
first uses the PDF's embedded text layer and page coordinates to preserve lines
and recognized tables. Service-report layouts are routed through the shared
visit interpreter; other readable PDFs continue through document-specific field
extraction. The legacy byte-stream decoder remains a compatibility fallback when
the layout extractor cannot open a file. Image-only PDFs still require the
future rendered-page OCR fallback.

Acquisition suggestions store privacy-safe processing diagnostics such as the
interpreter version, page count, extracted character count, table count, and
recognized section/candidate counts. Raw extracted document text is not stored
in diagnostics. These checkpoints make it possible to distinguish source-text
loss from classification or review-mapping failures.

PDF uploads may move through `processing`, `pending_review`, or `failed`
acquisition states. The PDF remains the source document; any extracted text or
future rendered page images are derived processing artifacts only.

While a supported document is in `processing`, its document card shows a
persistent **Checking** badge and an indeterminate status message. The message
explains that the user may leave the page and will be notified when suggested
details are ready. Processing takes precedence over older pending suggestions
so the active scan never appears idle. The status badge then moves to **Needs
review**, **Checked**, or **Needs attention** as appropriate. Completed scans
show either the reviewable suggestion count or an explicit
no-suggested-details result. A completed empty result may be scanned again.

PDF and DOCX processing are backend-triggered from the saved property document
state. The frontend marks the supported document as `processing`; the backend
worker detects that state and performs extraction in the background. This
prevents the browser from
owning the processing lifecycle after upload.

Manual retry uses the callable processor directly instead of first writing a new
`processing` state. The backend writes only the final acquisition outcome for
that retry, which keeps the property document from receiving unnecessary status
updates during repeated review attempts.

After a PDF or DOCX review is applied or rejected, document managers with
document-review access may choose **Scan again** from the document card. A
rescan creates a new pending review while preserving earlier applied or rejected
suggestions for provenance. Maintley does not offer a rescan while another
review for that document is pending, and rescanning never changes Property
Memory without a new approval.

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

Equipment reconciliation should follow the same low-friction default. When one
clear existing equipment record matches, the review should preselect that
record. When no clear match exists, the suggested new equipment record should
default to approved. Skipping equipment is an intentional exception and should
retain a short reviewer-selected reason with the reviewed suggestion. Tasks in
the same review may select approved equipment that will be created during the
save; the apply flow creates equipment first and resolves that selection to the
new equipment ID before creating or linking the task.

If Maintley finds a likely matching record, the review should explain why the
match was suggested and allow the reviewer to update the existing record or mark
it as not the same. This prevents duplicate work records when the same invoice is
uploaded more than once and keeps supporting documents connected to the right
Property Memory record.

Suggested details may be accepted, edited, rejected, or applied. Individual
proposed changes and part suggestions may also be skipped during review. Skipped
items should be retained with the suggestion when practical, but they should not
update Property Memory.

When an accepted suggestion creates or selects Equipment, Tasks, or Supplies,
the source Document receives the corresponding canonical `documents`
relationships. Existing accepted connections are preserved. This synchronization
happens only after review; proposed relationships do not become authoritative.

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

When accepted part suggestions are linked to specific Equipment, the apply step
creates or reuses a Property-owned Supply and adds the canonical Equipment
`uses` relationship. It does not write an embedded Equipment parts list.
Accepted Supplies retain source-document context and are never created without
user review.

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
