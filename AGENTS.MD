# Maintley Agent Instructions

This document defines how AI agents should approach work within the Maintley codebase.

Before making any implementation changes, review:

```text
project-docs/docs/README.md
```

Then read the documentation relevant to the requested task.

Documentation is organized as:

```text
project-docs/
├── ADR/
├── docs/
└── reports/
```

Documentation hierarchy:

* **docs/** — Current implementation and platform behavior.
* **ADR/** — Architectural decisions and historical context.
* **reports/** — Audits, investigations, migration notes, and technical analysis.

Documentation should be treated as authoritative unless implementation clearly differs.

If documentation and implementation disagree:

* Preserve existing application behavior.
* Report the discrepancy.
* Do not silently rewrite either implementation or documentation.

---

# Engineering Philosophy

Maintley is designed to preserve the operational knowledge of a property.

Every architectural decision should strengthen the following flow:

```text
Properties
    ↓
Maintenance Events
    ↓
Maintenance History
    ↓
Property Intelligence
    ↓
User Action
```

The objective is not simply to add features.

The objective is to create a platform that becomes more understandable, maintainable, and valuable over time.

Every significant change should move the platform closer to that vision.

---

# AI Workflow Expectations

Before implementing any change:

1. Read the relevant documentation.
2. Understand the existing implementation.
3. Reuse established patterns before introducing new ones.
4. Keep changes focused on the requested scope.
5. Avoid unrelated refactoring.
6. Preserve backwards compatibility whenever practical.
7. Ask for clarification rather than making architectural assumptions.

When a request impacts architecture, navigation, data models, permissions, user experience, or long-term maintainability:

* Analyze the request first.
* Explain the impact.
* Recommend an implementation strategy.
* Wait for approval before making code changes.

If a significant architectural decision is required, recommend creating or updating an ADR.

---

# Engineering Priorities

Optimize for:

* Long-term maintainability.
* Simplicity.
* Explainability.
* Consistency.
* Mobile usability.
* Reuse of existing architecture.

Do **not** optimize primarily for:

* Small pull requests.
* Minimal file changes.
* Temporary workarounds.
* Short-term implementation speed.

Minimize technical debt—not code changes.

---

# UX Principles

Always prioritize:

* Plain homeowner-friendly language.
* Mobile-first experiences.
* Simplicity over feature density.
* Discoverability over configuration.
* Progressive disclosure.
* Consistency throughout the application.

Follow:

```text
UX/UX_LANGUAGE_GUIDE.md
```

Avoid introducing terminology that increases cognitive load.

---

# Architectural Principles

Maintain the following principles:

* Properties are the primary organizational unit.
* Maintenance Events record work performed.
* Maintenance History preserves the long-term maintenance record and may be edited when corrections are required.
* Property Intelligence is a derived guidance system.
* Recommendations should always remain explainable.
* Prefer derived views over duplicated data.
* Avoid storing duplicate Firestore data whenever it can be derived.

When introducing new records or relationships, follow:

```text
Architecture/DATA_MODEL.md
```

---

# Project Conventions

Dashboard

* Displays derived information.
* Should not own business logic.

Maintenance History

* Represents the long-term maintenance record.
* May be edited by users.
* Should remain synchronized with related maintenance information.

Property Intelligence

* Explainable.
* Deterministic whenever possible.
* Recommendation-based.
* Never silently modify user data.

Tasks

* Represent actionable work.
* Should remain associated with the correct property and devices.

Properties

* Remain the highest organizational level.
* Avoid parallel organizational structures.

---

# Scope Management

Avoid introducing:

* Unit-level complexity.
* Duplicate ownership models.
* Multiple competing navigation systems.
* Duplicate sources of truth.
* Unnecessary configuration.
* Feature expansion outside property maintenance and documentation.

Favor solutions that move the platform toward its intended architecture.

Prefer addressing root causes instead of temporary fixes, architectural workarounds, or accumulating technical debt.

Do not preserve poor architecture simply to minimize the size of a code change.

When a migration, refactor, or redesign would significantly improve the platform:

1. Explain why it is recommended.
2. Describe the proposed architecture.
3. Outline the implementation strategy.
4. Break the work into logical phases.
5. Identify migration requirements, risks, and trade-offs.
6. Recommend the preferred approach.
7. Wait for approval before beginning implementation.

When multiple implementation approaches exist:

* Present the preferred approach.
* Briefly explain alternative approaches.
* Recommend the solution that best aligns with Maintley's documented architecture.

---

# Common Mistakes to Avoid

Do not:

* Reintroduce Units.
* Create duplicate Firestore data that can be derived.
* Bypass the property as the primary organizational context.
* Introduce terminology inconsistent with UX guidelines.
* Replace documented architecture without justification.
* Create parallel implementations when an established pattern exists.
* Ignore ADRs.
* Increase complexity without measurable user benefit.
* Introduce temporary architectural patches that create future maintenance debt.

---

# Important Documentation

## Product

* Product/PRODUCT_DIRECTION.md
* Product/FEATURES.md

## Architecture

* Architecture/DATA_MODEL.md
* Architecture/TECHNICAL_ARCHITECTURE.md
* Architecture/FIREBASE_STRUCTURE.md
* Architecture/PERMISSIONS.md

## Intelligence

* Intelligence/PROPERTY_INTELLIGENCE.md
* Intelligence/RECOMMENDATION_ENGINE.md
* Intelligence/APPLIANCE_PROFILES.md

## UX

* UX/UX_LANGUAGE_GUIDE.md
* UX/MOBILE_UX_GUIDE.md

## Development

* Development/CODE_ORGANIZATION_GUIDE.md
* Development/DOCUMENTATION_MAINTENANCE.md

## Operations

* Operations/TESTING.md

---

# Implementation Checklist

Before completing work:

* Existing architecture has been respected.
* Existing project patterns have been reused.
* Documentation has been updated if behavior changed.
* ADRs have been created or updated when appropriate.
* Mobile experience has been considered.
* No duplicate state has been introduced.
* No unnecessary Firestore duplication has been introduced.
* Recommendations remain explainable.
* The implementation aligns with Maintley's long-term architecture.
* The project builds successfully.

---

# Documentation Expectations

When implementation changes platform behavior:

1. Update implementation.
2. Update affected documentation.
3. Create or update ADRs when appropriate.
4. Archive superseded documentation.
5. Avoid duplicate sources of truth.

Documentation should evolve alongside the implementation.

The goal is for Maintley's architecture, implementation, and documentation to remain aligned over time.
