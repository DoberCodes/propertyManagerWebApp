# ADR: Maintley Intelligence Foundation
## Goal

Build the foundational architecture for Maintley Intelligence, a unified intelligence engine that analyzes property records and produces actionable findings. The engine should be reusable across multiple features and should not be tightly coupled to a specific UI or workflow.

The philosophy is:

One intelligence engine. Multiple experiences.

The engine should evaluate the property's recorded data and generate structured findings. Different parts of the application consume those findings in different ways.

---

## Architecture
Property Data
    │
    ▼
Maintley Intelligence Engine
    │
    ├── Rules
    ├── Prioritization
    ├── Plan Filtering
    ├── Categorization
    └── Finding Generation
    │
    ▼
Structured Findings
    │
    ├── Quick Property Scan
    ├── Property Audit
    ├── Dashboard Insights
    ├── Email Reports
    ├── Property Page
    └── Future Intelligence Features

The intelligence engine is the single source of truth.

No UI should implement its own recommendation logic.

---

## Maintley Baseline Care Library

Maintley Intelligence includes a versioned Maintley Baseline Care Library.

The baseline library is the reference source for general care expectations used by intelligence rules.

Baseline definitions may include:

* systemType
* importanceLevel
* recommendedFields
* suggestedMaintenanceCadence
* recommendedDocuments
* lifecycleHints
* applicableCapabilities
* disclaimerNotes

Baseline guidance is versioned.

Example:

```text
baselineVersion: "2026.1"
```

Findings should record the baseline version when a baseline definition influences the result.

This keeps historical scan results explainable after Maintley improves its baseline guidance.

V1 baseline guidance must not use external lookups, AI, web data, or manufacturer-specific rules.

---

## Layered Sources of Truth

Maintley Intelligence evaluates property records using layered sources of truth.

Priority order:

1. User-defined maintenance schedule
2. Manufacturer-specific guidance (future)
3. Maintley Baseline Care Library
4. Current property records
5. Historical maintenance events
6. Current date/time

The engine generates findings by comparing the property's current state against the highest-priority available maintenance guidance.

V1 uses Maintley Baseline Care Library, property records, maintenance history, and current date/time.

Future versions may add manufacturer-specific guidance and richer user-defined schedules without replacing the shared engine.

---

## Engine Responsibilities

The engine should:

Evaluate a property's recorded information.
Generate structured findings.
Assign severity.
Assign category.
Assign priority.
Determine affected systems.
Determine required subscription level.
Produce consistent recommendation objects.
Compare property state and maintenance history against baseline care expectations.
Record baseline version when applicable.

The engine should not:

Render UI.
Decide how many recommendations to display.
Send notifications.
Persist scan history.

Those responsibilities belong to consumers.

---

## Finding Model

Each finding should include:

{
  id,
  ruleId,
  category,
  severity,
  priority,
  title,
  description,
  whyItMatters,
  suggestedAction,
  affectedSystems,
  requiredPlan,
  baselineVersion,
  metadata
}

---

## Consumers
Quick Property Scan (Phase 1)

Purpose:

Show the highest-value actions.

Requirements:

Manual scan
Property-level
Top 3–5 findings
High and Medium priority only
Plan-aware
Fast execution

The scan should surface actionable opportunities without overwhelming users.

---

## Property Audit (Future)

Purpose:

Review the completeness of the property's records.

Uses:

Same intelligence engine
All findings
Includes documentation gaps
Includes lower-priority findings
More detailed reporting
Export support

The audit is not a separate engine.

---

## Dashboard Insights (Future)

Purpose:

Surface only:

Critical findings
New findings
Seasonal opportunities

---

## Email Insights (Future)

Purpose:

Generate periodic summaries from intelligence findings.

Examples:

New opportunities
Improvements
Recently resolved findings

---

## Rule Architecture

Rules should be modular.

Example:

rules/
    missingInstallDate.ts
    missingMaintenanceHistory.ts
    missingWarranty.ts
    overdueMaintenance.ts
    duplicateSystems.ts

Each rule evaluates one concern and returns zero or more findings.

---

## Plan Awareness

The engine should generate all findings.

Consumers decide what to expose based on subscription.

Example:

Engine
    ↓
32 findings

Quick Scan (Free)
    ↓
5 actionable findings

Quick Scan (Homeowner+)
    ↓
5 actionable findings
+ recurring maintenance recommendations

Property Audit
    ↓
32 findings

Users should never receive recommendations that cannot reasonably be acted upon within their current plan.

---

## Categories

Initial categories:

Overdue Work
Maintenance Opportunities
Missing Information

Future:

Documentation Gaps
Lifecycle Planning
Safety
Warranty
Cost Optimization
Seasonal Preparation

---

## Persistence

The intelligence engine does not save scans.

Scan history will be implemented separately.

Consumers may persist snapshots if desired.

---

## Design Philosophy

Maintley Intelligence is not an inspection tool.

It does not evaluate the physical condition of a property.

Instead, it evaluates the completeness and usefulness of the property's recorded information and helps users identify practical next steps.
