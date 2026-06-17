# Documentation Maintenance Guide

Last reviewed: 2026-06

# Purpose

This document defines how project knowledge should be maintained within the Maintley repository.

It establishes the rules for:

* Documentation
* Architecture Decision Records (ADR)
* Reports
* Archives

The goal is to ensure Maintley remains understandable to:

* Current contributors
* Future contributors
* AI development tools
* Future maintainers

Documentation should reduce confusion, not create it.

---

# Project Knowledge Philosophy

Maintley maintains project knowledge in three distinct layers:

```text
project-docs/
├── ADR/
├── docs/
└── reports/
```

Each layer serves a different purpose.

---

# Documentation

Documentation represents the current source of truth.

Documentation answers:

> How does Maintley work today?

Documentation should describe:

* Product behavior
* Architecture
* Systems
* Operations
* UX standards
* Development expectations

Documentation is authoritative.

---

# Architecture Decision Records (ADR)

Decision records preserve historical reasoning.

Decision records answer:

> Why was this decision made?

Examples:

* Removing Units from the core experience
* Property-first navigation
* Property Setup Assistant introduction
* Property Intelligence direction

Decision records should remain historical.

Do not rewrite old decision records to reflect new decisions.

Instead:

Create a new ADR documenting the updated direction.

---

# Reports

Reports contain investigations, audits, and point-in-time analysis.

Reports answer:

> What was true when this report was generated?

Examples:

* Script audits
* Documentation reviews
* Permission audits
* Dependency reviews
* Architecture assessments

Reports are not authoritative.

When a report produces accepted conclusions, update the appropriate documentation.

---

# Documentation Philosophy

Documentation exists to help humans and AI systems understand:

* What Maintley is
* Why Maintley exists
* How Maintley works
* How Maintley should evolve

Documentation should become simpler over time, not more complicated.

When in doubt:

Prefer fewer high-quality documents over many partially maintained documents.

---

# Documentation Principles

## Document Systems, Not Screens

Documentation should explain:

* Systems
* Business rules
* Architecture
* Product concepts
* Ownership boundaries

Good examples:

* Property Intelligence
* Billing
* Permissions
* Data Model
* Recommendation Engine

Poor examples:

* Add Task Screen
* Edit Property Modal
* Dashboard Widget Layout

Document systems rather than individual UI implementations.

---

## Prefer Long-Term Knowledge

Maintain documentation that remains useful over time.

Examples:

* Product Direction
* Data Models
* Architecture
* Deployment
* Permissions
* Billing
* Property Intelligence

Avoid creating long-lived documentation for:

* Temporary fixes
* One-time migrations
* Investigation summaries
* Completed cleanup efforts

These belong in reports or archives.

---

## Establish Clear Ownership

Every document should answer one primary question.

Examples:

PRODUCT_DIRECTION.md

Question:

"What is Maintley trying to become?"

DATA_MODEL.md

Question:

"What data exists and who owns it?"

PROPERTY_INTELLIGENCE.md

Question:

"Why does Property Intelligence exist?"

RECOMMENDATION_ENGINE.md

Question:

"How are recommendations generated?"

Avoid documents that answer multiple unrelated questions.

---

# Choosing the Right Location

Before creating a new file, ask:

---

## Does this describe current platform behavior?

Location:

```text
project-docs/docs/
```

Examples:

* Data models
* Features
* Billing
* Permissions
* Testing

---

## Does this explain why a decision was made?

Location:

```text
project-docs/ADR/
```

Examples:

* Navigation changes
* Feature removals
* Architectural shifts
* Product direction changes

---

## Is this an audit, review, or investigation?

Location:

```text
project-docs/reports/
```

Examples:

* Script audits
* Dependency reviews
* Documentation reviews
* Security reviews

---

## Is this no longer current but still useful?

Location:

```text
project-docs/docs/Archive/
```

Examples:

* Replaced documentation
* Legacy architecture notes
* Historical implementation guides

---

# Documentation Categories

## Product Documentation

Describes:

* Product vision
* User experience
* Terminology
* Features
* Product direction

Examples:

* PRODUCT_DIRECTION.md
* FEATURES.md
* UX_LANGUAGE_GUIDE.md
* MAINTLEY_PLAN_FEATURE_MATRIX.md

---

## Intelligence Documentation

Describes:

* Property Intelligence
* Recommendations
* Appliance Profiles
* Guidance systems

Examples:

* PROPERTY_INTELLIGENCE.md
* RECOMMENDATION_ENGINE.md
* APPLIANCE_PROFILES.md

---

## Architecture Documentation

Describes:

* Data ownership
* Infrastructure
* Security
* Integrations
* Platform architecture

Examples:

* DATA_MODEL.md
* TECHNICAL_ARCHITECTURE.md
* FIREBASE_STRUCTURE.md
* PERMISSIONS.md
* FILES_AND_STORAGE.md

---

## Operations Documentation

Describes:

* Deployment
* Billing
* Notifications
* Testing

Examples:

* BILLING.md
* DEPLOYMENT.md
* EMAIL_NOTIFICATIONS.md
* TESTING.md

---

## Development Documentation

Describes:

* Code organization
* Documentation standards
* Scripts and utilities

Examples:

* CODE_ORGANIZATION_GUIDE.md
* DOCUMENTATION_MAINTENANCE.md
* SCRIPTS_AND_UTILITIES.md

---

# Documentation Priority

## Tier 1: Core Documentation

These documents should always be maintained.

Examples:

* PRODUCT_DIRECTION.md
* FEATURES.md
* DATA_MODEL.md
* TECHNICAL_ARCHITECTURE.md
* FIREBASE_STRUCTURE.md
* PERMISSIONS.md
* TESTING.md
* DOCUMENTATION_MAINTENANCE.md

These define the platform.

---

## Tier 2: System Documentation

These documents should be updated whenever related systems change.

Examples:

* PROPERTY_INTELLIGENCE.md
* RECOMMENDATION_ENGINE.md
* APPLIANCE_PROFILES.md
* BILLING.md
* EMAIL_NOTIFICATIONS.md
* MAINTENANCE_EVENT_SCHEMA.md

These explain major platform systems.

---

## Tier 3: Historical Documentation

Historical context retained for future reference.

Stored in:

```text
project-docs/docs/Archive/
```

Examples:

* Refactoring summaries
* Legacy architecture documents
* Migration summaries
* Deprecated implementation guides

Archive rather than delete when historical context remains valuable.

---

# Single Source of Truth

Every concept should have a primary owner.

Examples:

Property Intelligence

Source:

PROPERTY_INTELLIGENCE.md

Recommendation Generation

Source:

RECOMMENDATION_ENGINE.md

Plan Features

Source:

MAINTLEY_PLAN_FEATURE_MATRIX.md

Data Ownership

Source:

DATA_MODEL.md

Avoid maintaining the same information in multiple documents.

When conflicts occur, update the source document.

---

# Documentation Update Triggers

Documentation should be reviewed when:

* Features change
* Data models change
* Permissions change
* Recommendation logic changes
* Subscription plans change
* Deployment processes change
* Terminology changes
* Major architectural decisions are made

Documentation updates should accompany implementation whenever practical.

---

# Documentation Update Process

When making changes:

1. Update implementation.
2. Update source-of-truth documentation.
3. Create or update ADRs when decisions change.
4. Archive superseded documentation.
5. Store audits and investigations in reports/.
6. Avoid duplicate sources of truth.

Documentation should evolve alongside the platform.

---

# AI Documentation Rules

When generating documentation:

Prefer:

* Documenting existing behavior
* Verifying against the codebase
* Identifying outdated information
* Improving clarity
* Strengthening ownership boundaries
* Reducing duplication

Avoid:

* Inventing architecture
* Guessing data models
* Treating planned features as implemented
* Creating unnecessary documents
* Duplicating existing sources of truth

When uncertain:

Document the uncertainty rather than making assumptions.

---

# Documentation Review Process

Periodically review project knowledge and classify files as:

## Keep

Current and actively maintained.

---

## Archive

Historical but potentially useful.

---

## Report

Investigation or analysis that should be preserved.

---

## Remove

Outdated, duplicated, or no longer useful.

The goal is a small set of trusted documents that clearly explain Maintley to both humans and AI systems.

---

# Guiding Principle

Project knowledge should remain clearly separated:

```text
Current Behavior
    ↓
Documentation

Historical Reasoning
    ↓
ADR

Analysis & Investigation
    ↓
Reports
```

Documentation explains how Maintley works today.

Decision records explain why decisions were made.

Reports preserve observations and analysis.

These responsibilities should remain distinct as Maintley evolves.
