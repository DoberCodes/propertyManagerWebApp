# ADR 0011: Property Knowledge Acquisition

Status: Accepted - initial implementation

---

## Context

Maintley Intelligence depends on the quality and completeness of a property's recorded information.

Historically, property knowledge has been created primarily through manual user entry. While effective, manually entering every detail creates friction and limits the growth of the property's long-term memory.

Maintley requires a consistent approach for expanding Property Memory from multiple information sources while keeping users in control of what is ultimately recorded.

---

## Decision

Maintley will introduce a **Property Knowledge Acquisition** layer.

This layer is responsible for identifying useful property information from trusted sources and converting that information into structured Property Memory.

Property Knowledge Acquisition is not part of Maintley Intelligence.

Instead, it exists before the intelligence engine.

```text
Property Sources
        ↓
Property Knowledge Acquisition
        ↓
Property Memory
        ↓
Maintley Intelligence
        ↓
Recommendations
```

Maintley Intelligence should never parse documents directly.

Instead, it consumes structured Property Memory produced by the acquisition layer.

---

## Guiding Principles

### Property Memory is the source of truth.

All extracted information should ultimately become structured Property Memory.

Recommendations should never rely on raw document parsing.

---

### Documents are knowledge sources.

Documents are not simply files.

They are potential sources of useful property knowledge.

Examples include:

* Manuals
* Installation invoices
* Warranties
* Receipts
* Inspection reports
* Contractor documentation

---

### Extraction is separate from acceptance.

Maintley may identify information within a document, but users remain responsible for accepting changes to their property records.

Suggested changes should be reviewable before becoming Property Memory.

---

### High-confidence extraction first.

Initial implementations should focus on extracting obvious structured information, including:

* Manufacturer
* Model
* Serial Number
* Install Date
* Warranty Period
* Contractor
* Parts
* Maintenance Events

More advanced interpretation may be added later.

---

### Every source contributes to Property Memory.

Future knowledge sources may include:

* Document understanding
* OCR
* Barcode scanning
* QR code scanning
* Property Setup Assistant
* User corrections
* Historical maintenance patterns
* Future integrations

All sources ultimately produce Property Memory.

---

## Consequences

This architecture separates:

* acquiring knowledge
* storing knowledge
* reasoning over knowledge

It allows Maintley Intelligence to become smarter without requiring changes to the recommendation engine whenever new acquisition methods are introduced.

New knowledge sources simply expand Property Memory, which automatically improves every consumer of Maintley Intelligence.

---

## Future Considerations

Future implementations may include:

* Manual understanding
* Invoice understanding
* Warranty extraction
* Receipt parsing
* Inspection report extraction
* Photo analysis
* Manufacturer lookup
* Barcode recognition
* QR recognition

These are considered Property Knowledge Acquisition features rather than standalone intelligence features.
