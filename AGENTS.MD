# Maintley Agent Instructions

Before making changes, review:

```text
project-docs/docs/README.md
```

and then read the relevant documentation it references.

Documentation is organized as:

```text
project-docs/
├── ADR/
├── docs/
└── reports/
```

Use:

* docs/ for current platform behavior
* ADR/ for historical decision context
* reports/ for audits and investigations

Documentation should be treated as authoritative unless implementation clearly differs.

---

# Core Product Priorities

Maintain and strengthen:

```text
Properties
    ↓
Maintenance Events
    ↓
Property Intelligence
    ↓
User Action
```

Primary goals:

* Improve property organization
* Preserve maintenance history
* Improve recommendations and guidance
* Reduce complexity
* Strengthen mobile usability

Avoid introducing competing sources of truth.

---

# UX Priorities

* Use plain homeowner-friendly language.
* Follow UX_LANGUAGE_GUIDE.md.
* Treat mobile as a first-class experience.
* Prioritize clarity over feature expansion.
* Prefer discoverability over configuration.

Avoid introducing unnecessary terminology.

---

# Architectural Priorities

* Properties are the primary organizational unit.
* Maintenance Events are the historical source of truth.
* Property Intelligence is a derived guidance system.
* Recommendations should remain explainable.
* Prefer derived views over duplicated data.

Follow DATA_MODEL.md when introducing new records.

---

# Scope Management

Avoid:

* Reintroducing unit-level complexity.
* Creating duplicate ownership models.
* Adding unnecessary configuration.
* Expanding workflows beyond property maintenance and recordkeeping.

Prefer incremental improvements to existing systems.

---

# Important Documentation

Read as needed:

Product:

* Product/PRODUCT_DIRECTION.md
* Product/FEATURES.md

Architecture:

* Architecture/DATA_MODEL.md
* Architecture/TECHNICAL_ARCHITECTURE.md
* Architecture/FIREBASE_STRUCTURE.md
* Architecture/PERMISSIONS.md

Intelligence:

* Intelligence/PROPERTY_INTELLIGENCE.md
* Intelligence/RECOMMENDATION_ENGINE.md
* Intelligence/APPLIANCE_PROFILES.md

UX:

* UX/UX_LANGUAGE_GUIDE.md
* UX/MOBILE_UX_GUIDE.md

Development:

* Development/CODE_ORGANIZATION_GUIDE.md
* Development/DOCUMENTATION_MAINTENANCE.md

Operations:

* Operations/TESTING.md

---

# Documentation Expectations

When making significant changes:

1. Update implementation.
2. Update affected documentation.
3. Create or update ADRs when appropriate.
4. Archive superseded documentation.
5. Avoid duplicate sources of truth.

Documentation should evolve alongside implementation.
