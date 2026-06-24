# Maintley Plan Feature Matrix

Last Reviewed: 2026-06

## Purpose

This document serves as the source of truth for:

* Subscription tiers
* Feature availability
* Resource limits
* Upgrade messaging
* Plan positioning

This document answers:

> Which plans include which capabilities?

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
* Appliance tracking
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
* Homeowner plans are optimized around a single-property experience.
* Future property limits may evolve based on usage patterns.

---

# Appliances, Systems & Assets

| Feature                               | Free      | Homeowner+ | Property  | Portfolio |
| ------------------------------------- | --------- | ---------- | --------- | --------- |
| Systems / Appliances / Assets         | 15        | Unlimited  | Unlimited | Unlimited |
| Warranty Information                  | ✓         | ✓          | ✓         | ✓         |
| Serial Numbers                        | ✓         | ✓          | ✓         | ✓         |
| Model Numbers                         | ✓         | ✓          | ✓         | ✓         |
| Installation Dates                    | ✓         | ✓          | ✓         | ✓         |
| Suggested Maintenance Visibility      | View Only | ✓          | ✓         | ✓         |
| Suggested Maintenance Task Generation | ✗         | ✓          | ✓         | ✓         |

### Notes

* Assets may include appliances, systems, vehicles, generators, tools, equipment, trailers, and other maintainable items.
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

| Feature                   | Free      | Homeowner+ | Property | Portfolio |
| ------------------------- | --------- | ---------- | -------- | --------- |
| Dashboard Recommendations | View Only | ✓          | ✓        | ✓         |
| Quick Scan                | View Only | ✓          | ✓        | ✓         |
| Setup Recommendations     | View Only | ✓          | ✓        | ✓         |
| Property Insights         | ✗         | ✓          | ✓        | ✓         |

### Notes

Maintley Intelligence helps users improve the completeness and usefulness of their records.

Capabilities may include:

* Setup recommendations
* Dashboard recommendations
* Quick Scan observations
* Property Insight observations

See PROPERTY_INTELLIGENCE.md for recommendation behavior and prioritization rules.

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
* Seasonal Guidance is available to all users.
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
| File Limit            | 10   | 250        | 1500     | 5000      |
| Storage Limit         | 1 GB | 5 GB       | 15 GB    | 25 GB     |

### Notes

* Users should always retain access to existing files.
* Storage limits may evolve based on real-world usage.
* File management remains available on all plans.

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
* Maintley Intelligence
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
