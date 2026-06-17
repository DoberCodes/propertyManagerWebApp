# Code Organization Guide

Last reviewed: 2026-06

# Purpose

This document defines how Maintley code should be organized, structured, and maintained as the platform grows.

It answers:

> How should Maintley code evolve over time?

The goal is maintainability, readability, and safe iteration.

Refactoring should improve:

* Clarity
* Ownership
* Testability
* Maintainability

Refactoring should not occur solely to reduce file size.

---

# Refactoring Philosophy

Refactoring should make the codebase easier to understand.

Prefer:

* Clear ownership
* Clear responsibilities
* Explicit behavior
* Simple architecture

Avoid:

* Clever abstractions
* Excessive indirection
* Premature optimization
* Refactoring solely for line count

Maintley should remain understandable to future contributors and AI-assisted development tools.

---

# Organization Philosophy

Organize code by responsibility.

Preferred structure:

```text
Feature
  ↓
Components
  ↓
Hooks
  ↓
Utilities
  ↓
API Layer
```

Avoid combining multiple unrelated responsibilities into a single file.

Examples of mixed responsibilities:

* UI rendering
* Form validation
* API calls
* Data mapping
* Permission checks
* Business logic

When possible, separate these concerns.

---

# Responsibility Boundaries

Maintley should follow predictable ownership boundaries.

---

## Components

Responsible for:

* Rendering
* Layout
* User interaction
* Display logic

Should avoid:

* Complex data transformation
* Direct Firebase access
* Business-rule ownership

Components should focus on presentation.

---

## Hooks

Responsible for:

* State management
* Workflow orchestration
* Derived state
* Page-specific logic

Examples:

```text
usePropertyDetailState()
useTaskFilters()
useDeviceTimeline()
```

Hooks should contain behavior.

Components should contain presentation.

---

## Utilities

Responsible for:

* Data transformation
* Formatting
* Mapping
* Validation helpers

Examples:

```text
taskMappers.ts
taskValidation.ts
deviceStatusUtils.ts
```

Utilities should remain stateless whenever possible.

---

## Redux / RTK Query

Responsible for:

* Data access
* Caching
* Server communication

Should not become the primary location for business logic.

Business rules should remain understandable outside Redux implementations.

---

## Firebase

Responsible for:

* Persistence
* Authorization enforcement
* Backend workflows

Firebase should not become a dumping ground for application logic.

---

# File Size Guidelines

File size alone should not trigger refactoring.

However, large files are often indicators of mixed responsibilities.

General guidelines:

| Size          | Guidance                                                   |
| ------------- | ---------------------------------------------------------- |
| 0–200 lines   | Ideal for simple components, hooks, utilities, and helpers |
| 200–400 lines | Acceptable for most feature files                          |
| 400–800 lines | Review when actively modifying                             |
| 800+ lines    | Strong refactor candidate                                  |

The question is not:

> How large is this file?

The question is:

> How many responsibilities does this file contain?

---

# When To Refactor

Refactoring is encouraged when:

* A file becomes difficult to understand.
* A file contains multiple responsibilities.
* A file is frequently modified.
* Logic is duplicated.
* Testing becomes difficult.
* Navigation becomes difficult.

Refactoring is not required simply because a file exceeds a target line count.

---

# Preferred Extractions

Good extractions include:

---

## Hooks

Examples:

```text
usePropertyDetailState()
useTaskFilters()
useSystemStatus()
useRecommendationEngine()
```

Extract hooks when state and orchestration become complex.

---

## Components

Examples:

```text
PropertyHeader.tsx
PropertyTabs.tsx
TaskFormSection.tsx
PropertyRecommendationCard.tsx
```

Extract components when UI sections have clear ownership.

---

## Utilities

Examples:

```text
taskMappers.ts
taskValidation.ts
recommendationUtils.ts
propertyScoringUtils.ts
```

Extract utilities when logic becomes reusable.

---

## Modal Sections

Examples:

```text
DeviceSelectionSection.tsx
PropertyAccessSection.tsx
ReviewStepSection.tsx
```

Modal workflows should remain readable.

---

## Form Sections

Examples:

```text
PropertyBasicsSection.tsx
ApplianceDetailsSection.tsx
MaintenanceScheduleSection.tsx
```

Forms should be divided by user intent.

---

# Refactor Order

When simplifying large files:

Preferred order:

```text
Extract Hooks
    ↓
Extract Components
    ↓
Extract Utilities
    ↓
Extract Shared Systems
```

Avoid creating shared abstractions too early.

Prefer concrete implementations first.

---

# Shared Code Philosophy

Shared code should emerge from repetition.

Avoid:

```text
GenericPropertyThingManager
```

created after one use case.

Prefer:

```text
PropertyRecommendationCard
```

until multiple use cases clearly exist.

Shared abstractions should solve demonstrated problems rather than anticipated problems.

---

# Technical Debt Philosophy

Not all technical debt requires immediate action.

Prioritize:

* Frequently modified files
* High-risk files
* Confusing files
* Mixed-responsibility files

Deprioritize:

* Stable files
* Low-risk files
* Rarely modified files

Technical debt should be evaluated based on impact rather than aesthetics.

---

# High-Risk Refactors

Certain areas require additional caution.

Examples:

* Firestore Rules
* Billing Logic
* Subscription Enforcement
* Permission Checks
* Stripe Integrations
* Account Membership Logic
* Cloud Function Authorization

These systems should not be refactored casually.

Prefer:

* Tests
* Incremental changes
* Explicit review

before modifying critical workflows.

---

# Documentation Requirements

Refactoring should include documentation updates when changes affect:

* Architecture
* Permissions
* Data Models
* Billing
* Property Intelligence
* Recommendation behavior
* Deployment workflows

Documentation should remain aligned with implementation.

Avoid undocumented architectural changes.

---

# AI-Assisted Development Guidance

Maintley actively uses AI-assisted development.

When refactoring with AI tools:

Prefer:

* Explicit code
* Clear ownership
* Predictable patterns
* Consistent naming

Avoid:

* Over-engineered abstractions
* Novel architectural patterns
* Unnecessary framework complexity

Code should remain understandable without requiring AI context.

---

# Code Review Questions

Before completing a refactor, ask:

1. Does this improve clarity?
2. Does ownership become clearer?
3. Does testing become easier?
4. Does future maintenance become easier?
5. Was a real problem solved?
6. Is documentation still accurate?
7. Did complexity decrease?

If the answer is no, the refactor may not be necessary.

---

# Maintley Refactoring Principles

Maintley should favor:

* Explicit code over clever code.
* Components over abstractions.
* Hooks over large components.
* Readability over brevity.
* Consistency over novelty.
* Stability over architectural experimentation.

The goal of refactoring is not to create smaller files.

The goal is to create a codebase that remains understandable, maintainable, and adaptable as Maintley continues to grow.
