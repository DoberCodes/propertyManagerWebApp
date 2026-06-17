# Maintley Project Documentation

Last reviewed: 2026-06

This directory contains Maintley's documentation, decision records, and project analysis reports.

The documentation system is organized around three distinct concepts:

```text
Documentation
    ↓
Current Truth

Decision Records
    ↓
Why Decisions Were Made

Reports
    ↓
Point-In-Time Analysis
```

Each area serves a different purpose and should be maintained accordingly.

---

# Directory Structure

```text
project-docs/
├── ADR/
├── docs/
└── reports/
```

---

# Documentation

Location:

```text
project-docs/docs/
```

Documentation represents the current source of truth for the platform.

Documentation should answer:

> How does Maintley work today?

Documentation includes:

* Product direction
* Features
* Data models
* Architecture
* Permissions
* Operations
* UX standards
* Development guidance

Documentation should be updated whenever implementation changes.

Documentation is authoritative.

---

# Architecture Decision Records (ADR)

Location:

```text
project-docs/ADR/
```

Decision records preserve the reasoning behind significant architectural and product decisions.

Decision records answer:

> Why was this decision made?

Examples:

* Removing Units from the core experience
* Property-first navigation
* Property Setup Assistant introduction
* Device to System terminology changes

Decision records are historical.

They should not be rewritten when future decisions change.

Instead, create a new decision record documenting the updated direction.

---

# Reports

Location:

```text
project-docs/reports/
```

Reports contain audits, investigations, analyses, and point-in-time observations.

Reports answer:

> What was true when this report was created?

Examples:

* Script audits
* Documentation reviews
* Dependency audits
* Permission audits
* Architecture reviews

Reports are not authoritative documentation.

When report findings become accepted direction, the appropriate documentation should be updated.

---

# Documentation Ownership Model

Maintley documentation follows:

```text
Implementation
    ↓
Documentation

Documentation
    ↓
Decision Records

Documentation + Decisions
    ↓
Reports and Analysis
```

Each layer has a different responsibility.

---

# For New Contributors

Recommended reading order:

1. docs/README.md
2. docs/Product/PRODUCT_DIRECTION.md
3. docs/Product/FEATURES.md
4. docs/Architecture/DATA_MODEL.md
5. docs/Architecture/TECHNICAL_ARCHITECTURE.md

These documents provide the quickest path to understanding Maintley.

---

# Guiding Principles

Documentation should remain:

* Current
* Accurate
* Maintainable
* Easy to navigate

Documentation describes the platform.

Decision records preserve reasoning.

Reports preserve analysis.

These responsibilities should remain distinct as Maintley evolves.
