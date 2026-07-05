# Roadmap Status

Last reviewed: 2026-06-30

## Purpose

This document is the active status source for Maintley's near-term roadmap.

It answers:

> What is current, what is next, what is deferred, and what needs a decision?

Product direction, feature behavior, data models, and architectural decisions
remain documented in their owning documents. This file summarizes status so
roadmap progress does not need to be inferred from ADRs, reports, and scattered
implementation notes.

## Current Direction

Maintley is moving toward:

```text
Properties
    -> Maintenance Events
    -> Maintley Intelligence
    -> User Action
```

Near-term work should strengthen:

* property-first organization
* Maintenance Events as the long-term history model
* Maintley Intelligence as explainable, derived guidance
* personal and role-aware dashboard focus
* clear customer-facing plan promises
* mobile-first usability

## Now

### Product Promise Alignment

Status: Active

Source:

* `project-docs/reports/roadmap-review-2026-06-30.md`
* `project-docs/docs/Product/MAINTLEY_PLAN_FEATURE_MATRIX.md`

Goal:

Align public pricing, plan matrix, and runtime language with what Maintley
currently supports.

Current decisions:

* Full Property Audit is in active implementation. Public entitlement language
  should remain conservative until the shipped experience is verified.
* Ongoing Maintley Intelligence is a roadmap item, not a current plan
  entitlement.
* Current Maintley Intelligence value includes Quick Property Scan, Dashboard
  Recommendations, Setup Recommendations, and Property Insight observations.
* Avoid `Home Health` and score-based framing in runtime UI.

### Dashboard Maintley Intelligence

Status: Active

Source:

* `project-docs/ADR/0017-personal-focus-dashboard.md`
* `project-docs/reports/dashboard-alignment-audit-2026-06-30.md`

Goal:

Make the dashboard personal-first, role-aware, and action-oriented.

Completed:

* Dashboard score/health framing removed.
* Recent maintenance moved lower.
* Standalone seasonal guidance removed from the dashboard.
* Dashboard scope preference added.
* Dashboard Maintley Intelligence consumer added.
* Dashboard create-task recommendations prefill property and linked system
  context where available.

Remaining:

* Decide whether `Action Center` is a named surface or just dashboard language.

### Task Permission Follow-Through

Status: Active

Source:

* `firestore.rules`
* `src/Redux/API/taskSlice.tsx`

Goal:

Ensure maintenance leads and assigned team members can manage tasks within their
allowed property scope.

Remaining:

* Deploy Firestore rules.
* Deploy matching client build if older task records require account context
  backfill.
* Re-test task assignment as a Maintenance Lead assigned to multiple
  properties.

## Next

### Report Builder Hardening

Status: Completed cleanup, with future architecture decision remaining

Source:

* `project-docs/reports/2026-06-30-reporting-system-audit.md`

Goal:

Finish report builder cleanup before expanding reporting.

Completed:

* Confirmed targeted Report Builder lint check is clean.
* Confirmed report adapter tests pass.
* Kept the category/template workflow as the active report selection path.
* Centralized repeated report export routing for generic CSV reports.

Remaining:

* Decide when server-side report generation becomes required for sensitive or
  portfolio-wide reporting.

### Unit And Suite Containment

Status: In progress

Source:

* `project-docs/ADR/0001-remove-units-from-core-experience.md`
* `project-docs/docs/Product/PRODUCT_DIRECTION.md`

Goal:

Keep the primary experience property-first while avoiding accidental unit/suite
surface area.

Decision:

Keep unit/suite support as hidden legacy compatibility while Maintley remains
focused on property-first maintenance workflows.

Completed:

* Unit and suite routes remain hidden from the active app flow.
* Unit and suite property tabs remain hidden from property detail navigation.
* Unit and suite creation fields remain hidden from active property, task,
  device, tenant, and request flows where currently implemented.
* Unit and suite report templates are hidden from active Report Builder
  availability while legacy adapters remain available for existing data paths.

Remaining:

* Keep legacy `unitId` and `suiteId` read compatibility where existing records
  need location context.
* Do not relaunch unit/suite management without a new product decision and ADR
  update.

### Property Knowledge Acquisition Status Matrix

Status: Completed

Source:

* `project-docs/ADR/0011-property-knowledge-acquisition.md`
* `project-docs/ADR/0015-pdf-invoice-acquisition-v1.md`
* `project-docs/docs/Intelligence/PROPERTY_KNOWLEDGE_ACQUISITION_STATUS_MATRIX.md`

Goal:

Create a clear support matrix for document and information extraction.

The matrix should track:

* PDFs and invoices
* manuals
* warranties
* receipts
* photos
* general documents

Each input type should list supported fields, review requirements, accepted
Property Memory outputs, and limitations.

Completed:

* Added a source support matrix for PDFs, invoices, receipts, manuals,
  warranties, photos, general documents, inspection reports, and contractor
  documents.
* Documented supported field families, review rules, current limitations, and
  deferred capabilities.

### Property Confirmation During Acquisition

Status: Completed, first phase

Source:

* `project-docs/docs/Intelligence/PROPERTY_KNOWLEDGE_ACQUISITION_STATUS_MATRIX.md`
* `project-docs/docs/Intelligence/PROPERTY_KNOWLEDGE_ACQUISITION.md`

Goal:

Detect clearly labeled service, job, installation, or property addresses in
uploaded documents and warn the reviewer when the detected address appears to
belong to a different property than the selected upload target.

Constraint:

Property confirmation should be a review safeguard. It should not automatically
rewrite property records, create new properties, block document storage, or let
Maintley Intelligence parse raw documents.

Completed:

* Add address candidate extraction to invoice and receipt text acquisition.
* Add deterministic address normalization and comparison utilities.
* Surface a clear review warning before applying suggested Property Memory
  changes when the document address conflicts with the selected property
  address.
* Add tests for exact match, partial match, clear mismatch, contractor address
  ignored, and missing address cases.

Remaining:

* Keep multi-property reassignment deferred until Maintley has an intentional
  document reassignment workflow.

## Later

### Full Property Audit

Status: Active implementation

Source:

* `project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md`
* `project-docs/docs/Intelligence/RECOMMENDATION_ENGINE.md`
* `project-docs/ADR/0006-maintley-intelligence-architecture.md`

Goal:

Provide a comprehensive, user-requested review of property record completeness,
maintenance coverage, documentation, lifecycle planning, and property
maintainability.

Constraint:

Full Property Audit should use the shared Maintley Intelligence engine. It
should not become a separate recommendation system.

Current direction:

Property Audit should be asset-centered rather than a long flat recommendation
list. It should show summary counts, top priority assets, category browsing,
and asset reviews powered by Knowledge Pack-derived findings.

### Ongoing Maintley Intelligence

Status: Roadmap

Source:

* `project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md`
* `project-docs/docs/Intelligence/RECOMMENDATION_ENGINE.md`

Goal:

Surface scheduled or contextual guidance as Maintley records improve.

Examples:

* seasonal reminders
* cost trends
* lifecycle forecasts
* warranty timing
* personalized observations

Constraint:

This should not be promised as a current paid feature until a concrete product
surface exists.

### Intelligence Center

Status: Roadmap

Goal:

Decide whether Maintley needs a dedicated destination for intelligence history,
audit results, saved recommendations, or portfolio scans.

## Completed

### Maintenance Events Direction

Status: Completed, with legacy compatibility

Source:

* `project-docs/ADR/0007-maintenance-events-as-historical-source-of-truth.md`
* `project-docs/docs/Architecture/MAINTENANCE_EVENT_SCHEMA.md`

Summary:

Maintenance Events are the canonical long-term maintenance record. Legacy
maintenance history compatibility remains where needed.

### Property Setup Assistant

Status: Completed and evolving

Source:

* `project-docs/ADR/0005-property-setup-assistant.md`

Summary:

The assistant supports progressive setup, system creation, and suggested
maintenance generation. Future work should use Maintley Intelligence language
instead of older `Home Health` framing.

### Maintley Intelligence Foundation

Status: Completed foundation

Source:

* `project-docs/ADR/0006-maintley-intelligence-architecture.md`
* `project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md`

Summary:

The shared engine supports Quick Property Scan and Dashboard Recommendations.
Future consumers should continue using the shared engine.

## Deferred

### Units And Suites As Primary Navigation

Status: Deferred

Reason:

The product is currently prioritizing simple, property-first workflows.

Current guidance:

Represent separate rentable areas as separate properties when practical.

### Server-Side Report Generation

Status: Deferred pending sensitivity and scale needs

Reason:

Current reporting is client-side and export-oriented. Server-side generation is
likely needed later for sensitive financial, tenant, team, and portfolio-wide
reporting.

## Open Decisions

1. Is `Action Center` a named dashboard component or only product language?
2. Should unit/suite functionality remain hidden compatibility or become an
   intentional property-management feature?
3. What is the smallest useful Full Property Audit v1?
4. What concrete surface will represent Ongoing Maintley Intelligence?
5. When does reporting require server-side generation?

## Maintenance Process

Update this document when:

* a roadmap item moves between Now, Next, Later, Completed, or Deferred
* a customer-facing plan promise changes
* an ADR changes the expected product direction
* a report identifies roadmap drift that becomes active work
* implementation completes a roadmap item

Reports should remain point-in-time analysis. This document should remain the
active status summary.
