# Archive

This folder contains historical documentation that has been replaced, consolidated, or superseded by newer documentation.

Archived documents are retained for:

* Historical context
* Decision history
* Migration reference
* Legacy implementation details

Archived documents should **not** be treated as the authoritative source of truth.

When information conflicts between an archived document and an active document, the active document is authoritative.

---

## Common Reasons Documents Are Archived

### Consolidation

Documentation was merged into a larger or more appropriate document.

Examples:

* TASK_OVERDUE_SYSTEM → DATA_MODEL
* FIREBASE_RULES_TESTING → TESTING

### Replacement

A newer document was created with a clearer ownership boundary.

Examples:

* Older billing documentation replaced by BILLING.md
* Older deployment documentation replaced by DEPLOYMENT.md

### Architectural Changes

The underlying implementation changed significantly and the original document is preserved for historical reference.

Examples:

* Units removed from the core experience
* Navigation restructuring
* Account model evolution

---

## Using Archived Documents

Archived documents may still be useful when:

* Understanding historical decisions
* Investigating legacy code
* Reviewing migration history
* Tracing architectural evolution

Archived documents should not be used when:

* Implementing new features
* Making architectural decisions
* Updating current functionality
* Defining current product behavior

---

## Current Documentation

Active documentation is organized by ownership domain:

* Product
* Intelligence
* Architecture
* Operations
* UX
* Development
* Compliance
* Decisions

Refer to the root documentation index (`docs/README.md`) for the current documentation structure.

---

## Archive Policy

Documents should be archived rather than deleted when they provide meaningful historical context.

Whenever practical, archived documents should include a note indicating which active document superseded them.

The goal of this folder is to preserve project history without creating multiple sources of truth.
