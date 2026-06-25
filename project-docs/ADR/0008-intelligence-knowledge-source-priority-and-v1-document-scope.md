# ADR 0008: Intelligence Knowledge-Source Priority And V1 Document Scope

Status: Accepted
Accepted: 2026-06-24
Date: 2026-06-24
Decision Source: Manual

## Context

Property Intelligence needs to evolve from a single-source recommendation model to a multi-source model over time.

Manuals and uploaded documents are planned future knowledge sources, but v1 guidance must remain explainable and bounded by currently supported inputs.

## Decision

- The intelligence engine must support knowledge-source priority ordering now, even if some sources are not yet active in v1.
- Findings must include a `source` field so downstream recommendations can identify provenance.
- The supported source labels are:
  - `maintley_baseline`
  - `user_schedule`
  - `manufacturer_manual_guidance`
  - `historical_patterns`
- In v1, the engine must not parse manuals or uploaded documents.
- In v1, the engine must not generate guidance from uploaded document content.
- Until manual parsing is explicitly enabled in a later version, any finding with `source = manufacturer_manual_guidance` is reserved for future use and should not be produced from uploaded files.

## Reasoning

- Source-priority support now avoids a refactor when additional intelligence inputs are introduced.
- Explicit provenance improves explainability, trust, and auditability of recommendations.
- Deferring manual parsing in v1 reduces implementation risk and prevents document-processing behavior from outpacing product readiness.

## Alternatives Considered

- Add manual parsing immediately in v1.
- Delay source-priority architecture until manuals are implemented.
- Emit findings without source provenance.

## Consequences

- Positive: recommendation provenance is explicit and machine-readable from day one.
- Positive: future knowledge sources can be integrated behind a stable source-priority contract.
- Cost: v1 implementation must maintain source metadata even when some sources are inactive.

## Non-Goals

- Implementing OCR or semantic parsing for manuals in v1.
- Creating recommendations directly from uploaded document text in v1.
- Treating document uploads as an immediate intelligence source before source-priority activation rules are defined.

## Related Documentation

- project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md
- project-docs/docs/Intelligence/RECOMMENDATION_ENGINE.md
- project-docs/docs/Architecture/DATA_MODEL.md
