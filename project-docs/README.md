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

# ADR Audit Process

The ADR audit looks for important decisions that are documented or implemented but do not yet have an Architecture Decision Record.

Run commands from the repository root.

## 1. Generate the audit and candidate drafts

```bash
yarn audit:decisions
```

This runs:

```text
scripts/auditDecisions.cjs
```

Output is written to:

```text
project-docs/reports/decision-audit-YYYY-MM/
├── audit.md
├── SUMMARY.md
└── candidates/
```

This step creates report artifacts only. It does not add files to `project-docs/ADR/`.

## 2. Prepare drafts for human review

```bash
yarn adr:author
```

This runs `scripts/promoteAdrCandidates.cjs --author` and prepares polished drafts in:

```text
project-docs/reports/decision-audit-YYYY-MM/approved/
```

Review and edit each draft in `approved/`. To reject a candidate, change its status to `Rejected` and add a clear `Reason:` field.

## 3. Preview the final result

```bash
yarn adr:promote:dry-run
```

The dry run validates the drafts and shows which records will be accepted or rejected without changing files.

## 4. Promote reviewed decisions

```bash
yarn adr:promote
```

Accepted drafts are written to `project-docs/ADR/`. Rejected drafts are retained in:

```text
project-docs/reports/decision-audit-YYYY-MM/rejected/
```

## Targeting a specific audit

By default, the authoring and promotion commands use the newest audit directory. Pass a month or directory directly to the underlying script when working with an older audit:

```bash
node scripts/promoteAdrCandidates.cjs --author --month 2026-06
node scripts/promoteAdrCandidates.cjs --promote --dry-run --month 2026-06
node scripts/promoteAdrCandidates.cjs --promote --dir project-docs/reports/decision-audit-2026-06
```

For detailed behavior and rejection metadata, see:

```text
project-docs/docs/Development/SCRIPTS_AND_UTILITIES.md
```

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

1. project-docs/docs/README.md
2. project-docs/docs/Product/PRODUCT_DIRECTION.md
3. project-docs/docs/Product/FEATURES.md
4. project-docs/docs/Architecture/DATA_MODEL.md
5. project-docs/docs/Architecture/TECHNICAL_ARCHITECTURE.md

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
