# ADR 0006: Property Intelligence Architecture

Status: Accepted
Accepted: 2026-06-18
Date: 2026-06-18
Decision Source: ADR Gap Audit

## Context

Property Intelligence is central to guidance and recommendations, but core records remain owned by the primary product data model.

- project-docs/docs/Architecture/DATA_MODEL.md:116 - * Property Intelligence
- project-docs/docs/Architecture/DATA_MODEL.md:119 - * Property Intelligence summaries
- project-docs/docs/Architecture/DATA_MODEL.md:872 - * Property Intelligence observations
- project-docs/docs/Architecture/DATA_MODEL.md:910 - * Property Intelligence
- project-docs/docs/Architecture/DATA_MODEL.md:1060 - # Property Intelligence Model
- project-docs/docs/Architecture/DATA_MODEL.md:1062 - Property Intelligence is a derived system.


## Decision

- Property Intelligence is implemented as a derived guidance layer rather than a canonical data source.
- It may analyze properties, maintenance events, appliances and systems, documents, and tasks to produce recommendations and insights.
- It must not become a competing source of truth for property or maintenance records.


## Reasoning

- Users often have enough data for meaningful guidance but need help identifying gaps and next actions.
- Derived intelligence enables recommendation evolution without rewriting foundational records.
- Separation of ownership keeps recommendations explainable and auditable.


## Alternatives Considered

- Make Property Intelligence a first-class ownership model with independent canonical records.
- Limit guidance to static checklists without derived analysis.
- Delegate all intelligence to ad hoc, opaque outputs without traceable data boundaries.


## Consequences

- Positive: preserves clear ownership boundaries between records and guidance.
- Positive: enables iterative improvement of recommendations over time.
- Cost: requires deliberate synchronization discipline between data model and intelligence logic.


## Non-Goals

- Replacing maintenance history as the historical record.
- Introducing a second canonical property data model.
- Turning Property Intelligence into an unconstrained chatbot-style interface.


## Related Documentation

- project-docs/ADR/0008-intelligence-knowledge-source-priority-and-v1-document-scope.md
- project-docs/docs/Architecture/DATA_MODEL.md:116
- project-docs/docs/Architecture/DATA_MODEL.md:119
- project-docs/docs/Architecture/DATA_MODEL.md:872
- project-docs/docs/Architecture/DATA_MODEL.md:910
- project-docs/docs/Architecture/DATA_MODEL.md:1060
- project-docs/docs/Architecture/DATA_MODEL.md:1062
