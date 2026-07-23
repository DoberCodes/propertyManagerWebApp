# Maintley Plan Feature Matrix

Last Reviewed: 2026-07

## Purpose

This document serves as the source of truth for:

* Subscription tiers
* Feature availability
* Resource limits
* Upgrade messaging
* Plan positioning

This document answers:

> Which plans include which capabilities?

Machine-readable public plan names, prices, limits, positioning, and pricing-card
highlights are maintained in:

```text
src/config/publicPlanFacts.json
```

`packages/entitlements` defines the shared versioned plan presets, capability
vocabulary, limits, and compatibility resolver used by the web application and
Firebase Functions. During the existing-plan parity migration,
`src/constants/subscriptions.ts` remains the legacy feature-permission map and
must match the shared presets. The resolver parity tests enforce that boundary.

Public plan facts must remain aligned with this matrix; run
`npm run sync:public-pricing` and `npm run validate:seo` after changing either
source.

This document does not define:

* Recommendation logic
* Maintley Intelligence behavior
* Billing implementation
* Reporting implementation
* Email delivery behavior

See:

* PROPERTY_INTELLIGENCE.md
* BILLING.md
* FEATURES.md
* EMAIL_NOTIFICATIONS.md

---

# Plan Philosophy

## Free

Document and organize your property.

Answers:

> What do I own?

Best for:

* Homeowners getting started
* Property documentation
* Equipment tracking
* Manual maintenance tracking

---

## Homeowner+

Automate maintenance and receive personalized guidance.

Answers:

> What should I be paying attention to?

Best for:

* Active homeowners
* Recurring maintenance
* Maintley Intelligence
* Maintenance automation

---

## Multi-Homeowner (launch-gated)

Maintain several personal or family homes without adopting business workflows.

Answers:

> How do I preserve and organize maintenance across the homes I care for?

Best for:

* Vacation and second homes
* Family or inherited properties
* Homeowners responsible for up to five homes

Multi-Homeowner is disabled by default during staged implementation. When
enabled, it includes every Homeowner+ capability, raises the property limit to
five, and adds Property Groups. It retains Homeowner+'s limits of 250 files and
5 GB of storage. It does not include resident profiles or requests, business
teams, advanced permissions, portfolio reporting, organizations, or
professional-contribution workflows.

Approved pricing is $5.99 monthly or $59.99 annually. Public pricing,
registration, checkout, and admin plan selection must remain hidden or rejected
until the launch flag is enabled.

---

## Property

Manage a small portfolio of properties.

Answers:

> How do I efficiently manage multiple properties?

Best for:

* Landlords
* Small property owners
* Small maintenance operations
* Simple collaboration

---

## Portfolio

Coordinate maintenance across properties, teams, and stakeholders.

Answers:

> How do I manage maintenance operations at scale?

Best for:

* Property managers
* Growing portfolios
* Teams
* Contractor coordination
* Owner collaboration

---

# Property Management

| Feature                  | Free | Homeowner+ | Property | Portfolio |
| ------------------------ | ---- | ---------- | -------- | --------- |
| Properties               | 1    | 1          | 7        | 15        |
| Property Photos          | ✓    | ✓          | ✓        | ✓         |
| Property Details         | ✓    | ✓          | ✓        | ✓         |
| Property Setup Assistant | ✓    | ✓          | ✓        | ✓         |
| Property Groups          | ✗    | ✗          | ✓        | ✓         |

### Notes

* Property Groups are intended for multi-property workflows.
* Free and Homeowner+ are optimized around a single-property experience.
* Multi-Homeowner adds homeowner-oriented grouping for up to five properties
  without enabling resident, team, or other business workflows.
* Future property limits may evolve based on usage patterns.

---

# Equipment & Assets

| Feature                               | Free      | Homeowner+ | Property  | Portfolio |
| ------------------------------------- | --------- | ---------- | --------- | --------- |
| Equipment / Assets         | 15        | Unlimited  | Unlimited | Unlimited |
| Warranty Information                  | ✓         | ✓          | ✓         | ✓         |
| Serial Numbers                        | ✓         | ✓          | ✓         | ✓         |
| Model Numbers                         | ✓         | ✓          | ✓         | ✓         |
| Installation Dates                    | ✓         | ✓          | ✓         | ✓         |
| Suggested Maintenance Visibility      | View Only | ✓          | ✓         | ✓         |
| Suggested Maintenance Task Generation | ✗         | ✓          | ✓         | ✓         |

### Notes

* Assets may include equipment, systems, vehicles, generators, tools, equipment, trailers, and other maintainable items.
* Free users may view recommendations.
* Paid plans may generate maintenance tasks from recommendations.

---

# Tasks & Automation

| Feature                     | Free | Homeowner+ | Property | Portfolio |
| --------------------------- | ---- | ---------- | -------- | --------- |
| Manual Tasks                | ✓    | ✓          | ✓        | ✓         |
| Due Dates                   | ✓    | ✓          | ✓        | ✓         |
| Task History                | ✓    | ✓          | ✓        | ✓         |
| Task Assignment             | ✓    | ✓          | ✓        | ✓         |
| Recurring Tasks             | ✗    | ✓          | ✓        | ✓         |
| Suggested Maintenance Tasks | ✗    | ✓          | ✓        | ✓         |

### Notes

* Recurring tasks are considered automation functionality.
* Task assignment remains available across all plans.

---

# Maintley Intelligence

| Feature                        | Free | Homeowner+ | Property | Portfolio |
| ------------------------------ | ---- | ---------- | -------- | --------- |
| Dashboard Recommendations      | Yes  | Yes        | Yes      | Yes       |
| Quick Property Scan            | Yes  | Yes        | Yes      | Yes       |
| Setup Recommendations          | Yes  | Yes        | Yes      | Yes       |
| Home / Property Review         | Preview | Yes     | Yes      | Yes       |
| Property Insights              | No   | Yes        | Yes      | Yes       |

### Notes

Maintley Intelligence reviews what Maintley knows about a property and highlights the few things most worth the user's attention.

Recommendations are explainable guidance based on saved records. They should not be described as AI scans of the home.

Capabilities may include:

* Setup recommendations
* Dashboard recommendations
* Quick Property Scan observations
* Property Insight observations

Quick Property Scan should remain available on free and paid plans.

Premium intelligence should expand what Maintley can review and explain, not turn free recommendations into unsolvable warnings.

Free Quick Scan is the first layer of Maintley Intelligence. It is powered by Home Memory / Property Memory and focuses on information the user has saved, such as missing details, setup gaps, maintenance history, overdue tasks, and documents.

Homeowner+ and higher plans expand Maintley Intelligence with Maintley Knowledge, Home / Property History, Seasonal Context, and Maintenance Patterns.

Home / Property Review is the deeper completeness-oriented layer. Free users may see a paid preview, but the full review is available on Homeowner+ and higher plans.

See PROPERTY_INTELLIGENCE.md for recommendation behavior and prioritization rules.

Ongoing Maintley Intelligence remains a roadmap item, not a current plan entitlement. It should not be listed as an available plan feature until implemented.

---

# Notifications & Guidance

| Feature                  | Free | Homeowner+ | Property | Portfolio |
| ------------------------ | ---- | ---------- | -------- | --------- |
| In-App Notifications     | ✓    | ✓          | ✓        | ✓         |
| Monthly Property Summary | ✓    | ✓          | ✓        | ✓         |
| Seasonal Guidance        | ✓    | ✓          | ✓        | ✓         |
| Task Reminder Emails     | ✗    | ✓          | ✓        | ✓         |
| Push Notifications       | ✗    | ✓          | ✓        | ✓         |

### Notes

* Monthly Property Summary is available to all users.
* Standalone seasonal dashboard guidance has been removed. Future seasonal guidance should appear through Maintley Intelligence rather than a separate dashboard module.
* Reminder and push functionality require paid plans.

See EMAIL_NOTIFICATIONS.md for delivery behavior.

---

# Files & Storage

| Feature               | Free | Homeowner+ | Property | Portfolio |
| --------------------- | ---- | ---------- | -------- | --------- |
| File Uploads          | ✓    | ✓          | ✓        | ✓         |
| File Downloads        | ✓    | ✓          | ✓        | ✓         |
| File Deletion         | ✓    | ✓          | ✓        | ✓         |
| Storage Usage Display | ✓    | ✓          | ✓        | ✓         |
| Suggested Details from Documents | Preview | Yes | Yes | Yes |
| File Limit            | 10   | 250        | 1500     | 5000      |
| Storage Limit         | 1 GB | 5 GB       | 15 GB    | 25 GB     |

### Notes

* Users should always retain access to existing files.
* Storage limits may evolve based on real-world usage.
* File management remains available on all plans.
* Free users can upload and organize documents. Homeowner+ and higher plans unlock Maintley's suggested detail review from uploaded documents.

---

# Family Collaboration

Family collaboration is considered a core Maintley capability.

Examples:

* Spouse
* Partner
* Parent
* Adult Child
* Caregiver
* Roommate

| Feature                    | Free | Homeowner+ | Property | Portfolio |
| -------------------------- | ---- | ---------- | -------- | --------- |
| Family Members             | 3    | 3          | 3        | 3         |
| Shared Property Access     | ✓    | ✓          | ✓        | ✓         |
| Shared Maintenance History | ✓    | ✓          | ✓        | ✓         |
| Shared Documents           | ✓    | ✓          | ✓        | ✓         |
| Task Assignment            | ✓    | ✓          | ✓        | ✓         |

### Notes

* Family members are not team members.
* Family members are not role-based users.
* Family members join an existing account and do not run owner onboarding.
* Family collaboration remains a core platform feature.

---

# Contractors

| Feature                        | Free | Homeowner+ | Property | Portfolio |
| ------------------------------ | ---- | ---------- | -------- | --------- |
| Contractor Directory           | ✓    | ✓          | ✓        | ✓         |
| Contractor Contact Information | ✓    | ✓          | ✓        | ✓         |
| Contractor History References  | ✓    | ✓          | ✓        | ✓         |
| Link Contractors to Tasks      | ✓    | ✓          | ✓        | ✓         |

### Notes

* Contractors do not consume family slots.
* Contractors do not consume team slots.
* Contractors improve maintenance documentation and historical records.

---

# Residents & Maintenance Requests

| Feature                       | Free | Homeowner+ | Property | Portfolio |
| ----------------------------- | ---- | ---------- | -------- | --------- |
| Resident Profiles             | ✗    | ✗          | ✓        | ✓         |
| Resident Property Access      | ✗    | ✗          | ✓        | ✓         |
| Maintenance Request Portal    | ✗    | ✗          | ✓        | ✓         |
| Resident Maintenance Requests | ✗    | ✗          | ✓        | ✓         |

### Notes

* Residents are not team members.
* Residents do not consume team member slots.
* Resident access is limited to maintenance-related workflows.

Maintley does not currently provide:

* Lease Management
* Rent Collection
* Tenant Screening
* Accounting
* Rental Payments
* Lease Document Management
* Property Accounting

---

# Teams & Business Collaboration

## Property Plan

| Feature                  | Property |
| ------------------------ | -------- |
| Team Members             | ✓        |
| Admin Role               | ✓        |
| Access to All Properties | ✓        |
| Team Task Assignment     | ✓        |

### Notes

* Intended for simple collaboration.
* Team members operate as administrators.
* Property-level restrictions are not currently included.

---

## Portfolio Plan

| Feature                        | Portfolio |
| ------------------------------ | --------- |
| Team Members                   | ✓         |
| Custom Roles                   | ✓         |
| Property Assignments           | ✓         |
| Role-Based Permissions         | ✓         |
| Maintenance Staff Roles        | ✓         |
| Assistant Roles                | ✓         |
| External User Roles            | ✓         |
| Owner-Specific Property Access | ✓         |

### Notes

* Supports advanced operational workflows.
* Supports property-level access control.
* Supports owner-specific visibility.

---

# Reporting & Data Export

| Feature             | Free | Homeowner+ | Property | Portfolio |
| ------------------- | ---- | ---------- | -------- | --------- |
| Data Export Builder | ✓    | ✓          | ✓        | ✓         |
| Property Filtering  | ✓    | ✓          | ✓        | ✓         |
| Date Filtering      | ✓    | ✓          | ✓        | ✓         |
| Custom Columns      | ✓    | ✓          | ✓        | ✓         |
| CSV Export          | ✓    | ✓          | ✓        | ✓         |

### Notes

* Exporting user data is not considered a premium feature.
* Users should always retain ownership of their information.
* Maintley Intelligence observations are separate from data exports.

---

# Upgrade Messaging

## Free → Homeowner+

Unlock:

* Unlimited Systems & Assets
* Suggested Maintenance Task Generation
* Recurring Tasks
* Task Reminder Emails
* Push Notifications
* Expanded Maintley Intelligence
* Home Review
* Expanded Storage

---

## Homeowner+ → Property

Unlock:

* Up to 7 Properties
* Property Groups
* Resident Maintenance Requests
* Team Collaboration
* Multi-Property Management

---

## Property → Portfolio

Unlock:

* Custom Roles
* Property Assignments
* Advanced Permissions
* Owner-Specific Access
* Advanced Operational Management

---

# Guiding Principles

Maintley plans should remain easy to understand.

Feature differentiation should be based on customer value rather than technical implementation.

Plan progression should follow a natural growth path:

```text
Free
  ↓
Organize

Homeowner+
  ↓
Maintain

Property
  ↓
Manage Multiple Properties

Portfolio
  ↓
Coordinate Operations
```

Plans should remain focused on helping users maintain properties, preserve records, and improve long-term maintenance outcomes.
