# ADR 0008: Intelligence Knowledge-Source Priority And V1 Document Scope

Status: Accepted
Accepted: 2026-06-24
Date: 2026-06-24
Decision Source: Manual

## Context

Maintley Intelligence needs to evolve from a single-source recommendation model to a multi-source model over time.

Manuals and uploaded documents are planned future knowledge sources, but v1 guidance must remain explainable and bounded by currently supported inputs.

## Decision

- The intelligence engine must support knowledge-source priority ordering now, even if some sources are not yet active in v1.
- Findings must include a `source` field so downstream recommendations can identify provenance and plan entitlement.
- The supported recommendation source labels are:
  - `property_memory`
  - `knowledge_pack`
  - `history_inference`
  - `context`
- Plan access is determined by source:
  - Free/Homeowner plans may access `property_memory`.
  - Homeowner+ and higher paid plans may access `property_memory`, `knowledge_pack`, `history_inference`, and `context`.
- `property_memory` findings are derived entirely from user-saved data.
- `knowledge_pack` findings are derived from Maintley knowledge packs.
- `history_inference` findings are derived from patterns in a user's own maintenance history.
- `context` findings are derived from external or seasonal context.
- In v1, the engine must not parse manuals or uploaded documents.
- In v1, the engine must not generate guidance from uploaded document content.
- Until manual parsing is explicitly enabled in a later version, uploaded document content should not produce findings. Future manual-derived guidance should be introduced through the source entitlement model rather than a separate rule-gating system.

## Reasoning

- Source-priority support now avoids a refactor when additional intelligence inputs are introduced.
- Explicit provenance improves explainability, trust, and auditability of recommendations.
- Source-based entitlement keeps plan filtering simple and prevents one-off rule-specific plan exceptions.
- Deferring manual parsing in v1 reduces implementation risk and prevents document-processing behavior from outpacing product readiness.

## Alternatives Considered

- Add manual parsing immediately in v1.
- Delay source-priority architecture until manuals are implemented.
- Emit findings without source provenance.
- Gate individual recommendation rules by plan instead of gating recommendation sources.

## Consequences

- Positive: recommendation provenance is explicit and machine-readable from day one.
- Positive: future knowledge sources can be integrated behind a stable source-priority contract.
- Positive: paid-plan intelligence can expand by adding sources without multiplying rule-level subscription checks.
- Cost: v1 implementation must maintain source metadata even when some sources are inactive.

## Non-Goals

- Implementing OCR or semantic parsing for manuals in v1.
- Creating recommendations directly from uploaded document text in v1.
- Treating document uploads as an immediate intelligence source before source-priority activation rules are defined.

## Related Documentation

- project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md
- project-docs/docs/Intelligence/RECOMMENDATION_ENGINE.md
- project-docs/docs/Architecture/DATA_MODEL.md
