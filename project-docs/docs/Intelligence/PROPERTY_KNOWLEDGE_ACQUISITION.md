# Property Knowledge Acquisition

Last reviewed: 2026-06

Property Knowledge Acquisition is the layer that turns uploaded documents and other sources into reviewed structured property knowledge.

It happens before Maintley Intelligence.

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

The first implementation stores pending knowledge suggestions on the property record.

Property documents are the canonical source documents for acquisition. Uploads started from appliance/system or task screens should still create property document records, then link those records to the related asset or task.

Suggested details are generated from document metadata and lightweight image OCR for uploaded image files. Maintley does not perform AI extraction, PDF text extraction, or manual-specific parsing in this phase.

When a suggestion maps to an existing property or system field, Maintley should only suggest the detail when that field is currently missing from Property Memory. Document details that represent new memory records, such as invoice totals, service notes, parts, or consumables, may still be suggested for review because they do not overwrite an existing property or system field.

Users review suggestions through the document workflow using the language:

> Maintley found possible details in this document.

Suggested details may be accepted, edited, rejected, or applied.

Rejected suggestions are retained as rejected records.

Applied suggestions are traceable to the source document.

When accepted document details include contractor contact information, the apply step may create a new property contractor or fill blank details on an existing matching contractor.

When accepted document details include invoice, service, financial, parts, or supply information, the apply step may create a Maintenance History record sourced from the document. Incomplete part or supply mentions may still be retained in the maintenance notes because they can help preserve useful property memory even when Maintley does not know the full part model.

When accepted part suggestions are linked to a specific appliance or system, the apply step may add them to that system's Parts & Supplies list. These records should retain source context and should not be created without user review.

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

---

# Relationship to Maintley Intelligence

Property Knowledge Acquisition grows Property Memory.

Maintley Intelligence reasons over Property Memory.

These layers should remain separate.

Maintley Intelligence should not parse raw documents. It should consume accepted structured records and their provenance.

Part Knowledge Catalog definitions support acquisition only. Future Maintley Intelligence rules may reason over accepted parts and supplies, but Intelligence should not re-parse the source documents.
