# ADR 0006: Maintley Intelligence Architecture

Status: Accepted - initial implementation
Accepted: 2026-06-18
Date: 2026-06-18
Amended: 2026-07-26
Decision Source: ADR Gap Audit

## Context

Maintley Intelligence is central to guidance and recommendations, but core records remain owned by the primary product data model.

The original gap audit referenced the derived intelligence model in:

- project-docs/docs/Architecture/DATA_MODEL.md:116
- project-docs/docs/Architecture/DATA_MODEL.md:119
- project-docs/docs/Architecture/DATA_MODEL.md:872
- project-docs/docs/Architecture/DATA_MODEL.md:910
- project-docs/docs/Architecture/DATA_MODEL.md:1060
- project-docs/docs/Architecture/DATA_MODEL.md:1062

This ADR has been amended to use the branded product and architecture name: `Maintley Intelligence`.

Maintley Intelligence also needs a reusable implementation foundation. The same engine should support Quick Property Scan, future Property Audit, dashboard guidance, email summaries, property page insights, and later intelligence features without each surface creating its own recommendation logic.

The product philosophy is:

```text
One intelligence engine. Multiple experiences.
```

## Decision

- Maintley Intelligence is implemented as a derived guidance layer rather than a canonical data source.
- It may analyze properties, maintenance events, equipment, documents, and tasks to produce recommendations and insights.
- It must not become a competing source of truth for property or maintenance records.
- Maintley Intelligence uses one shared engine that evaluates recorded property data and produces structured findings.
- UI surfaces, dashboards, scans, audits, email reports, and future intelligence experiences consume findings from the shared engine rather than implementing separate recommendation logic.
- Consumers decide how many findings to show, how to group them, whether to persist snapshots, and how to present actions.
- The engine is responsible for rule evaluation, prioritization, categorization, plan-aware filtering when plan context is supplied, finding generation, and baseline-version metadata.
- The engine is not responsible for rendering UI, sending notifications, deciding dashboard layout, or persisting scan history.
- Maintley Intelligence includes a versioned Maintley Baseline Care Library for general care expectations used by intelligence rules.
- Findings influenced by baseline guidance should record the baseline version so historical scan results remain explainable as Maintley improves its guidance.
- V1 baseline guidance must not use external lookups, AI, web data, or manufacturer-specific rules.
- Maintley Intelligence evaluates property records using layered sources of truth:
  1. User-defined maintenance schedule
  2. Manufacturer-specific guidance, future
  3. Maintley Baseline Care Library
  4. Current property records
  5. Historical maintenance events
  6. Current date/time
- V1 uses Maintley Baseline Care Library, property records, maintenance history, and current date/time.
- Rules should be modular. Each rule evaluates one concern and returns zero or more findings.
- Finding records should be structured and explainable, including identifiers, rule ID, category, severity, priority, title, description, why it matters, suggested action metadata, affected records, required plan/capability metadata where applicable, baseline version, and supporting metadata.
- Scan persistence is a consumer responsibility. The intelligence engine itself does not save scans.
- Maintley Intelligence may expose a shared, derived readiness assessment that
  explains which kinds of guidance the currently saved records can support.
- Readiness evaluates Maintley's available context. It does not evaluate the
  physical condition of a property, grade the customer, certify record
  completeness, or determine subscription access.
- Readiness uses explainable categories tied to supported Intelligence benefits.
  The initial categories are equipment context, maintenance coverage, and
  service history.
- Customer-facing readiness uses categorical levels such as `Starting`,
  `Building context`, and `Ready`. It does not expose an overall percentage,
  weighted property score, or health-signal count.
- Every readiness category must explain what Maintley can currently do with the
  available records and identify a practical next step when more context would
  enable better guidance.
- Readiness evaluation belongs to the shared Intelligence layer. Dashboard,
  property, email, and future consumers must not create their own readiness
  calculations.
- Data readiness and paid capability access remain separate. A readiness result
  cannot grant an entitlement, and presentation must not imply that adding data
  unlocks a capability excluded by the account's effective access.
- Readiness is derived rather than canonical Firestore state. If a consumer
  persists a point-in-time snapshot, it must retain the readiness contract and
  baseline versions needed to explain the historical result.


## Reasoning

- Users often have enough data for meaningful guidance but need help identifying gaps and next actions.
- Derived intelligence enables recommendation evolution without rewriting foundational records.
- Separation of ownership keeps recommendations explainable and auditable.
- A shared engine prevents duplicate recommendation logic across dashboard, scan, audit, email, and future intelligence surfaces.
- Consumer boundaries allow Quick Scan, dashboard recommendations, and future audits to present the same underlying findings differently without forking the recommendation system.
- Versioned baseline guidance keeps historical findings understandable after Maintley's care guidance changes.
- Modular rules make the intelligence system easier to test, explain, and extend.


## Alternatives Considered

- Make Maintley Intelligence a first-class ownership model with independent canonical records.
- Limit guidance to static checklists without derived analysis.
- Delegate all intelligence to ad hoc, opaque outputs without traceable data boundaries.
- Build separate recommendation logic for each surface.
- Persist every intelligence run directly from the engine.
- Defer the shared engine until after individual intelligence surfaces ship.


## Consequences

- Positive: preserves clear ownership boundaries between records and guidance.
- Positive: enables iterative improvement of recommendations over time.
- Positive: keeps recommendation behavior centralized and easier to validate.
- Positive: allows consumers to tune presentation without changing rule logic.
- Positive: keeps scan history and displayed recommendations explainable through structured metadata and baseline versions.
- Positive: lets Maintley explain when saved records support more specific
  guidance without judging the home or presenting false precision.
- Cost: requires deliberate synchronization discipline between data model and intelligence logic.
- Cost: consumers must respect the engine contract instead of adding local recommendation shortcuts.
- Cost: readiness benefits and prerequisites must remain synchronized with
  capabilities Maintley actually implements.


## Non-Goals

- Replacing maintenance history as the historical record.
- Introducing a second canonical property data model.
- Turning Maintley Intelligence into an unconstrained chatbot-style interface.
- Implementing a full Property Audit in this ADR.
- Implementing scheduled scans, email delivery, or notification delivery.
- Implementing AI, web lookup, OCR, or manufacturer-specific intelligence in V1.
- Defining the source-priority and document-ingestion entitlement model. That narrower decision is covered by ADR 0008.


## Related Documentation

- project-docs/ADR/0008-intelligence-knowledge-source-priority-and-v1-document-scope.md
- project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md
- project-docs/docs/Intelligence/RECOMMENDATION_ENGINE.md
- project-docs/docs/Architecture/DATA_MODEL.md:116
- project-docs/docs/Architecture/DATA_MODEL.md:119
- project-docs/docs/Architecture/DATA_MODEL.md:872
- project-docs/docs/Architecture/DATA_MODEL.md:910
- project-docs/docs/Architecture/DATA_MODEL.md:1060
- project-docs/docs/Architecture/DATA_MODEL.md:1062
## 2026-07 plan-boundary update

Maintley Intelligence is the primary premium value for homeowners and for
Portfolio customers. Free and Property retain a lightweight record check so
the core product can explain saved information and obvious record gaps.

Homeowner+ and Portfolio add full property reviews, cross-record inference,
Knowledge Packs, advanced document processing, AI guidance, lifecycle and cost
planning, and future predictive capabilities as each becomes implemented.
Property does not inherit the Homeowner+ Intelligence bundle merely because it
is a higher-priced business plan; it adds business collaboration to the core
maintenance bundle. Portfolio combines both Intelligence and advanced business
coordination.

This distinction does not change the derived-data decision. Intelligence must
remain explainable and must not become a competing canonical source of truth.
