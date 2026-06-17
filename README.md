# Maintley

> Property maintenance and recordkeeping platform for homeowners, landlords, and small property managers.

**Maintley** helps users organize property information, track maintenance, preserve service history, manage documentation, and receive actionable recommendations for their properties over time.

---

## Proprietary Notice

This codebase is the exclusive property of Dober Family Ventures, LLC.

Unauthorized copying, modification, distribution, or use is prohibited except as expressly permitted by the repository owner.

See the LICENSE file for additional details.

---

# What Is Maintley?

Maintley is designed to serve as the operational memory of a property.

The platform helps users:

* Track appliances and systems
* Manage maintenance tasks
* Preserve service history
* Store property documentation
* Coordinate with contractors and team members
* Receive maintenance recommendations
* Identify missing property information

Maintley is not intended to be a lease management, accounting, or enterprise property management platform.

Its primary focus is helping users maintain and understand their properties.

---

# Core Concepts

Maintley is built around three primary concepts:

```text
Properties
    ↓
Maintenance Events
    ↓
Property Intelligence
```

---

## Properties

Properties provide organizational context.

Properties contain:

* Appliances & Systems
* Tasks
* Contractors
* Documentation
* Tenants
* Historical Records

Properties are the primary organizational unit throughout the platform.

---

## Maintenance Events

Maintenance Events are the historical source of truth.

They preserve:

* Repairs
* Inspections
* Replacements
* Service visits
* Completed maintenance activity

Tasks represent planned work.

Maintenance Events represent completed work.

Historical reporting should favor Maintenance Events whenever practical.

---

## Property Intelligence

Property Intelligence is a derived system.

It analyzes existing records and generates:

* Recommendations
* Property Insights
* Setup guidance
* Quick Scan results
* Portfolio observations

Property Intelligence provides guidance without becoming a competing source of truth.

---

# Product Focus

Maintley is focused on helping users maintain and understand their properties.

The platform emphasizes:

* Property organization
* Maintenance history
* Documentation
* Recommendations and guidance

Maintley intentionally avoids expanding into:

* Accounting
* Lease management
* Rent collection
* Enterprise property management workflows

These concerns remain outside Maintley's core product direction.

---

# Key Features

## Property Management

* Multiple properties
* Property photos
* Property details
* Property grouping
* Favorites

---

## Appliances & Systems

Track:

* HVAC systems
* Water heaters
* Roofs
* Refrigerators
* Generators
* Water treatment systems
* Pool equipment
* Other maintainable assets

Store:

* Install dates
* Warranty information
* Documentation
* Photos
* Maintenance history

---

## Maintenance Tracking

* One-time tasks
* Recurring tasks
* Due date tracking
* Assignments
* Priorities
* Maintenance history generation

---

## Documentation

Store:

* Manuals
* Warranties
* Receipts
* Photos
* Inspection reports
* Service documentation

---

## Teams & Collaboration

* Team members
* Property assignments
* Tenant access
* Contractor tracking

---

## Property Intelligence

* Recommended maintenance
* Documentation suggestions
* Missing information detection
* Setup guidance
* Property Insights

---

# Technology Stack

Frontend:

* React
* TypeScript
* Redux Toolkit
* RTK Query
* styled-components

Backend:

* Firebase Authentication
* Cloud Firestore
* Firebase Storage
* Cloud Functions

Mobile:

* Capacitor Android

Integrations:

* Stripe
* Firebase Cloud Messaging

---

# Getting Started

## Prerequisites

* Node.js
* Yarn
* Firebase Project
* Firebase Authentication
* Cloud Firestore

For Android development:

* Android Studio
* Capacitor

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
```

Install dependencies:

```bash
yarn install
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Configure Firebase and application settings.

---

## Development

Start the development server:

```bash
yarn start
```

Build the application:

```bash
yarn build
```

Run tests:

```bash
yarn test
```

---

# Documentation

Maintley uses a structured project knowledge system.

Start here:

```text
project-docs/README.md
```

Project knowledge is organized into three areas:

```text
project-docs/
├── ADR/
├── docs/
└── reports/
```

---

## Documentation

Location:

```text
project-docs/docs/
```

Documentation represents the current source of truth.

Documentation answers:

> How does Maintley work today?

---

## Architecture Decision Records

Location:

```text
project-docs/ADR/
```

Decision records preserve historical reasoning.

Decision records answer:

> Why was this decision made?

---

## Reports

Location:

```text
project-docs/reports/
```

Reports contain audits, investigations, and point-in-time analysis.

Reports answer:

> What was true when this report was created?

Reports are not authoritative documentation.

---

## Recommended Reading Order

New contributors should review:

1. project-docs/docs/Product/PRODUCT_DIRECTION.md
2. project-docs/docs/Product/FEATURES.md
3. project-docs/docs/Architecture/DATA_MODEL.md
4. project-docs/docs/Architecture/TECHNICAL_ARCHITECTURE.md
5. project-docs/docs/Architecture/PERMISSIONS.md

These documents provide the fastest path to understanding the platform.

---

# Repository Structure

```text
src/
    Application source code

functions/
    Firebase Cloud Functions

project-docs/
    Documentation, ADRs, and reports

scripts/
    Utilities, migrations, and maintenance scripts

public/
    Static assets

e2e/
    End-to-end testing
```

---

# Development Principles

Maintley development follows several core principles.

---

## Property-Centric

Properties are the primary organizational unit.

---

## Maintenance Event-Centric

Maintenance Events preserve historical knowledge.

---

## Property Intelligence-Driven

Recommendations should be derived from source records.

---

## Mobile-First

Mobile experiences should be treated as first-class experiences.

---

## Single Source of Truth

Avoid duplicate ownership of data.

Source records should remain authoritative.

Derived records should be replaceable.

---

# Documentation Expectations

When making changes:

1. Update implementation.
2. Update source-of-truth documentation.
3. Create or update ADRs when architectural or product decisions change.
4. Store audits and investigations in reports/.
5. Archive superseded documentation.
6. Avoid duplicate sources of truth.

Documentation should evolve alongside the application.

---

# Security

* Never commit secrets.
* Never commit service account credentials.
* Never commit production keys.
* Use environment variables for configuration.
* Follow Firebase security rules and permission boundaries.

---

# License

This repository contains proprietary software owned by Dober Family Ventures, LLC.

All rights reserved.
