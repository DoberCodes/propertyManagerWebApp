# Maintley Plan Feature Matrix

Last Reviewed: 2026-08-18

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

`functions/packages/entitlements` defines the shared versioned plan presets, capability
vocabulary, limits, and compatibility resolver used by the web application and
Firebase Functions. During the existing-plan parity migration,
`src/constants/subscriptions.ts` remains the legacy feature-permission map and
must match the shared presets. The resolver parity tests enforce that boundary.

Public plan facts must remain aligned with this matrix; run
`npm run sync:public-pricing` and `npm run validate:seo` after changing either
source.

User-facing capability and limit decisions use current effective access. The
billing plan remains a separate commercial fact. For example, a Free account
with an active temporary Homeowner+ grant receives and displays the
Homeowner+ property and storage limits while billing remains Free. Expired
grants stop contributing access, and a lower grant never replaces a higher
paid plan.

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

Maintain your home.

Answers:

> What have I done, and what maintenance needs attention?

Best for:

* Maintaining one home indefinitely
* Complete property documentation
* Unlimited equipment tracking
* Manual and recurring maintenance
* Ordinary task reminders

---

## Homeowner+

Understand and plan for up to five homes.

Answers:

> What should I understand, prioritize, and plan for next?

Best for:

* Homeowners who want Maintley Intelligence
* Multiple personal or family homes
* AI guidance and Knowledge Packs
* Advanced document processing
* Lifecycle, cost, and replacement planning

---

## Property

Manage properties with business collaboration.

Answers:

> How do I manage maintenance with a team and residents?

Best for:

* Landlords
* Small property operations
* Simple teams and resident requests
* Core maintenance management without premium Intelligence

---

## Portfolio

Understand and coordinate maintenance at scale.

Answers:

> How do I manage maintenance operations at scale?

Best for:

* Property managers
* Growing portfolios
* Teams
* Contractor coordination
* Owner collaboration
* Full Maintley Intelligence and cross-property guidance

---

# Property Management

| Feature                  | Free | Homeowner+ | Property | Portfolio |
| ------------------------ | ---- | ---------- | -------- | --------- |
| Properties               | 1    | 5          | 7        | 15        |
| Property Photos          | ✓    | ✓          | ✓        | ✓         |
| Property Details         | ✓    | ✓          | ✓        | ✓         |
| Property Setup Assistant | ✓    | ✓          | ✓        | ✓         |
| Property Groups          | ✗    | ✓          | ✓        | ✓         |

### Notes

Property taxonomy access follows this plan boundary:

| Capability | Free | Homeowner+ | Property | Portfolio |
| ---------- | ---- | ---------- | -------- | --------- |
| Residential properties and home classifications | Yes | Yes | Yes | Yes |
| Multi-unit and Commercial property types | No | No | Yes | Yes |
| Enable rental management | No | No | Yes | Yes |

* Property Groups are intended for multi-property workflows.
* Free is optimized around one home.
* Homeowner+ supports up to five personal or family homes without enabling
  resident, team, or other business workflows.
* After a downgrade, existing business property and rental records stay visible.
  Their restricted settings become read-only while safe descriptive edits remain
  available.
* Future property limits may evolve based on usage patterns.

---

# Equipment & Assets

| Feature                               | Free      | Homeowner+ | Property  | Portfolio |
| ------------------------------------- | --------- | ---------- | --------- | --------- |
| Equipment / Assets         | Unlimited | Unlimited  | Unlimited | Unlimited |
| Warranty Information                  | ✓         | ✓          | ✓         | ✓         |
| Serial Numbers                        | ✓         | ✓          | ✓         | ✓         |
| Model Numbers                         | ✓         | ✓          | ✓         | ✓         |
| Installation Dates                    | ✓         | ✓          | ✓         | ✓         |
| Suggested Maintenance Visibility      | ✓         | ✓          | ✓         | ✓         |
| Suggested Maintenance Task Generation | ✓         | ✓          | ✓         | ✓         |

### Notes

* Assets may include equipment, systems, vehicles, generators, tools, equipment, trailers, and other maintainable items.
* The core maintenance workflow, including setup-generated maintenance tasks,
  is available across all standard plans.

---

# Tasks & Automation

| Feature                     | Free | Homeowner+ | Property | Portfolio |
| --------------------------- | ---- | ---------- | -------- | --------- |
| Manual Tasks                | ✓    | ✓          | ✓        | ✓         |
| Due Dates                   | ✓    | ✓          | ✓        | ✓         |
| Task History                | ✓    | ✓          | ✓        | ✓         |
| Task Assignment             | ✓    | ✓          | ✓        | ✓         |
| Recurring Tasks             | ✓    | ✓          | ✓        | ✓         |
| Suggested Maintenance Tasks | ✓    | ✓          | ✓        | ✓         |

### Notes

* Recurring tasks are part of the complete core maintenance workflow.
* Task assignment remains available across all plans.

---

# Maintley Intelligence

| Feature                        | Free | Homeowner+ | Property | Portfolio |
| ------------------------------ | ---- | ---------- | -------- | --------- |
| Dashboard Recommendations      | Record check | Yes | Record check | Yes |
| Quick Property Scan            | Lightweight | Yes | Lightweight | Yes |
| Setup Recommendations          | Yes  | Yes        | Yes      | Yes       |
| Home / Property Review         | Preview | Yes     | Preview  | Yes       |
| Property Insights              | No   | Yes        | No       | Yes       |

### Notes

Maintley Intelligence reviews what Maintley knows about a property and highlights the few things most worth the user's attention.

Recommendations are explainable guidance based on saved records. They should not be described as AI scans of the home.

Capabilities may include:

* Setup recommendations
* Dashboard recommendations
* Quick Property Scan observations
* Property Insight observations

Free and Property retain a lightweight record check. Full Maintley Intelligence
is available on Homeowner+ and Portfolio.

Premium intelligence should expand what Maintley can review and explain, not turn free recommendations into unsolvable warnings.

Free Quick Scan is the first layer of Maintley Intelligence. It is powered by Home Memory / Property Memory and focuses on information the user has saved, such as missing details, setup gaps, maintenance history, overdue tasks, and documents.

Homeowner+ and Portfolio expand Maintley Intelligence with Maintley Knowledge,
Home / Property History, Seasonal Context, Maintenance Patterns, AI guidance,
Knowledge Packs, and advanced document processing as implemented.

Home / Property Review is the deeper completeness-oriented layer. Free and
Property users may see a paid preview, but the full review is available on
Homeowner+ and Portfolio.

See PROPERTY_INTELLIGENCE.md for recommendation behavior and prioritization rules.

Ongoing Maintley Intelligence remains a roadmap item, not a current plan entitlement. It should not be listed as an available plan feature until implemented.

---

# Notifications & Guidance

| Feature                  | Free | Homeowner+ | Property | Portfolio |
| ------------------------ | ---- | ---------- | -------- | --------- |
| In-App Notifications     | ✓    | ✓          | ✓        | ✓         |
| Monthly Property Summary | ✓    | ✓          | ✓        | ✓         |
| Seasonal Guidance        | ✓    | ✓          | ✓        | ✓         |
| Task Reminder Emails     | ✓    | ✓          | ✓        | ✓         |
| Push Notifications       | ✓    | ✓          | ✓        | ✓         |

### Notes

* Monthly Property Summary is available to all users.
* Standalone seasonal dashboard guidance has been removed. Future seasonal guidance should appear through Maintley Intelligence rather than a separate dashboard module.
* Ordinary task reminders and push functionality are part of the core
  maintenance workflow. Premium Intelligence summaries remain limited to plans
  that include full Maintley Intelligence.

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
| File Count Limit      | None | None       | None     | None      |
| Storage Limit         | 1 GB | 10 GB      | 15 GB    | 25 GB     |

### Notes

* Users should always retain access to existing files.
* Storage limits may evolve based on real-world usage. Storage volume, rather
  than file count, is the customer-facing resource boundary.
* File management remains available on all plans.
* Free and Property users can upload and organize documents and may see a
  limited advanced-processing preview. Homeowner+ and Portfolio unlock
  Maintley's advanced suggested-detail review from uploaded documents.

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
* Property includes the complete core maintenance workflow and lightweight
  record checks. Full Maintley Intelligence is reserved for Portfolio on the
  business track.

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
* Includes full Maintley Intelligence, advanced document processing, and
  cross-property guidance.

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

* Up to five homes
* Property Groups
* Full Maintley Intelligence
* Home Review and Property Insights
* AI guidance and Knowledge Packs
* Advanced document processing
* 10 GB storage

---

## Homeowner+ or Free → Property

Unlock:

* Resident Maintenance Requests
* Team Collaboration
* Business Workflows

Property is a separate business track, not a higher homeowner Intelligence
tier. It includes lightweight record checks rather than full Maintley
Intelligence.

---

## Property → Portfolio

Unlock:

* Custom Roles
* Property Assignments
* Advanced Permissions
* Owner-Specific Access
* Advanced Operational Management
* Full Maintley Intelligence
* Cross-Property Guidance
* Advanced Document Processing

---

# Guiding Principles

## Non-Destructive Downgrades

Downgrades change future capability without hiding or deleting existing
customer records.

* Existing properties, equipment, tasks, Maintenance History, and files remain
  visible.
* Existing files remain downloadable when an account exceeds the lower storage
  quota.
* New creation is restricted while usage meets or exceeds the lower limit.
* Previously accepted premium suggestions remain ordinary customer records.
* Persisted point-in-time premium results remain visible, while new premium
  processing stops.
* Business permission changes must never widen access automatically.
* Cancellation does not delete the account.

---

Maintley plans should remain easy to understand.

Feature differentiation should be based on customer value rather than technical implementation.

Plan progression should follow a natural growth path:

```text
Homeowners: Free (Maintain) → Homeowner+ (Understand)

Businesses: Property (Manage) → Portfolio (Understand and Coordinate)
```

Plans should remain focused on helping users maintain properties, preserve records, and improve long-term maintenance outcomes.
