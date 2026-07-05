# ADR 0019: Property Audit Asset Review Experience

Status: Accepted

Date: 2026-07-03

## Context

Maintley Intelligence now produces enough useful findings that a flat list of
recommendations can overwhelm users during a full Property Audit.

Quick Scan and Property Audit answer different questions:

* Quick Scan answers: What needs attention?
* Property Audit answers: How complete and maintainable is this property record?

The shared engine can generate detailed findings across maintenance coverage,
equipment records, documentation, lifecycle planning, and property completeness.
Those findings are valuable, but showing dozens of individual recommendations as
the primary audit experience creates cognitive switching. A user may see Water
Heater in one category, Smoke Detector in another, Refrigerator in another, and
then have to mentally reconstruct the property by asset.

Maintley's Knowledge Packs already define the natural audit structure. They
describe what useful records, documents, maintenance topics, parts, and lifecycle
context belong with each asset type.

## Decision

Property Audit will be presented as an asset-centered completeness review.

The audit will still preserve categories and individual findings, but the primary
review experience should be organized around assets:

```text
Property Audit
  Summary
  Top Priorities
  Browse Categories
  Asset Reviews
    HVAC
      Equipment Records
      Maintenance Coverage
      Documentation
    Water Heater
      Equipment Records
      Maintenance Coverage
      Lifecycle
```

When an asset is expanded, findings should be grouped by audit area inside that
asset:

```text
Water Heater

Maintenance
- Missing recurring maintenance
- Missing maintenance history

Equipment Records
- Missing install date
- Missing model
```

Quick Scan remains priority-oriented and recommendation-oriented. Property Audit
becomes completeness-oriented and asset-oriented.

## Principles

1. Quick Scan is for priority.

Quick Scan should remain fast, filtered, and action-oriented. It may aggregate
repeated findings into a small number of high-value recommendations.

2. Property Audit is for completeness.

Property Audit may expose more detail because the user explicitly asked for a
broader review. The audit should help users understand how complete each asset
record is, not force them to read a long flat recommendation list.

3. Assets are the primary audit units.

Users think in terms of water heaters, refrigerators, HVAC systems, roofs, smoke
detectors, and similar property assets. The audit should support that mental
model.

4. Categories remain browse and progress layers.

Maintenance Coverage, Equipment Records, Documentation, Safety, Lifecycle, and
future categories should remain available for scanning and filtering, but they
should not be the main detailed review list.

5. Knowledge Packs define expected completeness.

Knowledge Packs should increasingly define the expected audit areas for each
asset. The UI should be able to show open opportunities now and later show true
completed/remaining progress as Knowledge Pack checklists become more explicit.

6. Actions remain attached to findings.

Asset reviews should keep Maintley actions close to the underlying finding:
Open System Record, Create Task, Review Task, Upload Document, or similar.

## Implementation Direction

Property Audit snapshots may store derived audit views in addition to raw
recommendations:

* `recommendations` - flat recommendation records for backwards compatibility.
* `auditCategories` - category summaries and category-level findings.
* `auditAssetReviews` - primary asset-centered review groups.

These are derived views. They do not replace properties, systems, tasks,
maintenance events, documents, or Knowledge Packs as the source of truth.

The first implementation should:

* Preserve the shared Maintley Intelligence engine.
* Preserve detailed findings for audit surfaces.
* Group findings by affected asset/system.
* Show top priority assets before the detailed asset review list.
* Show category counts as a browse layer.
* Group expanded asset findings by audit area.
* Use `General Property` for findings that are not tied to a specific asset.
* Avoid fake completion percentages until the underlying checklist model is
  explicit enough to support them.

## Consequences

Property Audit will feel different from Quick Scan by design.

This improves usability as findings scale from a handful to dozens or hundreds.
It also aligns the audit experience with the Property Memory model: users review
the property itself, not an abstract list of recommendation rows.

Future work can add:

* True completed/remaining progress by asset.
* Category completion percentages.
* Filters for category, priority, and asset type.
* Knowledge Pack checklist coverage.
* Audit exports or reports.

## Non-Goals

This ADR does not introduce:

* A property score or property grade.
* A new source of truth for property data.
* AI-generated inspection claims.
* Automatic modification of user records.
* Property Audit history storage beyond the current latest snapshot behavior.
