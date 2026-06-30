ADR: PDF Invoice Acquisition v1
Status

Accepted

Context

Most contractor invoices, receipts, and service records arrive as PDF files.
Maintley's first Property Knowledge Acquisition implementation handled document
metadata and image OCR in the React application, but PDF uploads did not expose
their useful invoice details to the acquisition layer.

Adding PDF parsing, PDF rendering, and OCR libraries to the React bundle would
increase bundle size and make mobile behavior less predictable. PDF processing is
also slower than normal uploads and should not block users from saving the
canonical document.

Decision

PDF invoice acquisition will be handled as a backend processing step.

The original uploaded PDF remains the canonical Property Document. Rendered page
images, OCR text, and intermediate processing output are derived artifacts only
and should not become user-facing documents or independent sources of truth.

Phase 1 targets:

* Single invoice or receipt PDFs.
* First 1-3 pages.
* Review-required suggestions only.
* No automatic Property Memory updates.
* No React PDF parsing, PDF rendering, or browser OCR.

The intended flow is:

```text
PDF uploaded
    ->
PropertyDocument saved
    ->
acquisitionStatus = processing
    ->
backend processes the PDF
    ->
knowledge suggestions created
    ->
acquisitionStatus = pending_review
    ->
user reviews/applies
```

If processing cannot extract usable information, the document should move to a
failed or not-reviewed state with a calm retry path.

Implementation Strategy

The React application should save the document record and set
`acquisitionStatus = processing`. Backend processing is triggered from the
saved property document state so the browser does not need to remain open for
processing to complete.

The existing callable processor may remain available as a manual retry path,
but the primary processing lifecycle should be backend-owned.

The backend should expose a property/document-scoped processing entry point. The
processor should update the existing property document and knowledge suggestion
arrays rather than introducing a parallel document intelligence collection in
this phase.

For the first backend implementation, text-based PDFs may be handled with a
lightweight text extraction path. Production-ready rendered-page OCR should be
implemented as a backend adapter, preferably in a Cloud Run worker or another
runtime that can reliably include PDF rendering and OCR tooling.

Derived page images should be temporary or stored under an internal processing
path with cleanup. They should not count as user-facing Property Documents.

Boundaries

Do not:

* Add PDF parsing or rendering libraries to the React application.
* Run OCR in the browser for PDFs.
* Update Property Memory automatically.
* Block uploads while PDF processing runs.
* Treat rendered page images as user documents.
* Let Maintley Intelligence parse raw documents.

Consequences

Benefits:

* Keeps the frontend bundle smaller.
* Allows PDF processing to evolve independently from the app shell.
* Preserves the Property Knowledge Acquisition review model.
* Makes PDF invoices useful without bypassing user trust.

Tradeoffs:

* Requires backend deployment for full PDF acquisition.
* Rendered-page OCR needs a worker/runtime with reliable native PDF rendering.
* Users may see a short processing state before suggestions are available.

Future Considerations

Future phases may add:

* Rendered-page OCR for scanned PDFs.
* Processing retries.
* Background queues.
* Cleanup of derived processing artifacts.
* Document-type-specific extraction adapters.
* Confidence/evidence display based on OCR source page and bounding text.
