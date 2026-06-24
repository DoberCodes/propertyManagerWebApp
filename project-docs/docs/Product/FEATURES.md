# Features

Last reviewed: 2026-06

## Purpose

This document describes the current user-facing capabilities available within Maintley.

It answers:

> What can users do in Maintley?

This document focuses on product capabilities rather than implementation details, subscription limits, or future roadmap decisions.

For related documentation:

* PRODUCT_DIRECTION.md — Product goals and direction
* PROPERTY_INTELLIGENCE.md — Recommendation and intelligence systems
* PLAN_FEATURE_MATRIX.md — Plan availability and limits
* DATA_MODEL.md — Underlying data structures
* TECHNICAL_ARCHITECTURE.md — System implementation

---

# Core Maintenance Loop

Maintley is centered around a simple maintenance record workflow:

1. Add a property.
2. Add appliances and systems.
3. Create maintenance tasks.
4. Complete maintenance tasks.
5. Build maintenance history.
6. Store supporting records and documentation.

The product should help users understand and complete this workflow without requiring extensive training or setup.

---

# Properties

Properties are the primary organizational object within Maintley.

Current capabilities:

* Create properties.
* Edit property details.
* Duplicate properties.
* Delete properties.
* Organize properties into groups.
* Drag and drop property groups into a preferred order.
* Rename and manage each group from its contextual menu.
* Add a short description and choose whether a group starts collapsed.
* Customize group icons and colors.
* Use the same group settings when creating or editing a group.
* Move properties between groups before deleting an empty group.
* Mark properties as favorites.
* Hide properties from dashboard views.
* Track property-level information and notes.
* Associate appliances and systems with properties.
* Associate tasks with properties.
* Associate maintenance history with properties.
* Associate contractors with properties.
* Associate tenants with properties.
* Track property type classifications.

Supported property types:

* Single Family
* Multi-Family
* Commercial

---

# Property Setup Assistant

The Property Setup Assistant helps users create initial property records more efficiently.

Current capabilities:

* Review common rooms and property areas.
* Identify systems and appliances present at a property.
* Create appliance and system records.
* Generate suggested maintenance tasks.
* Support progressive setup over time.
* Provide quick recommendations after setup completion.

The assistant is intended to reduce onboarding effort while keeping setup optional and flexible.

---

# Maintley Intelligence

Maintley Intelligence helps users improve the completeness and usefulness of their property records.

Current capabilities:

* Suggested maintenance tasks.
* Setup recommendations.
* Quick Scan recommendations.
* Dashboard recommendations.
* Property Insight observations.
* Missing-information recommendations.
* Record completeness guidance.

Maintley Intelligence focuses on improving records rather than evaluating actual property condition.

See PROPERTY_INTELLIGENCE.md for detailed behavior.

---

# Appliances & Systems

The platform internally uses the term `devices`, but user-facing language should refer to:

* Appliances
* Systems
* Appliances & Systems

Current capabilities:

* Create appliance and system records.
* Edit appliance and system records.
* Duplicate appliance and system records.
* Delete appliance and system records.
* Track manufacturer information.
* Track model information.
* Track serial information.
* Track install dates.
* Track service items.
* Track parts and supplies.
* Track filter information.
* Track notes.
* Track status.
* Upload files and documentation.
* Associate tasks.
* Associate maintenance history.

Supported statuses:

* Active
* Maintenance
* Broken
* Decommissioned

Users may create minimal records and complete information later.

---

# Tasks

Tasks represent maintenance work that needs to be performed.

Current capabilities:

* Create tasks.
* Edit tasks.
* Delete tasks.
* Complete tasks.
* Assign tasks.
* Link tasks to properties.
* Link tasks to appliances and systems.
* Configure due dates.
* Configure recurring schedules.
* Configure priorities.
* Configure notes.
* Configure work requirements.
* Track task status.
* Identify overdue tasks.

Task completion contributes to maintenance history.

---

# Maintenance History

Maintenance History serves as the long-term record of completed maintenance activity.

Current capabilities:

* Record completed maintenance.
* Store service notes.
* Store repair notes.
* Store inspections.
* Store contractor visits.
* Store invoices.
* Store attachments.
* Store warranty-related records.
* Create manual maintenance entries.
* Display appliance-specific history.
* Display property-specific history.

Current canonical storage:

* maintenanceEvents

Legacy compatibility remains available where needed.

---

# Documents, Photos, and Files

Maintley supports storing maintenance-related records and supporting documentation.

Current capabilities:

* Property photos.
* Appliance photos.
* Maintenance attachments.
* Task attachments.
* Warranty documents.
* Service records.
* Invoices.
* General supporting files.

Photos and documents are treated as distinct user concepts even when stored using the same backend storage services.

---

# Contractors

Contractors provide service-provider tracking and assignment functionality.

Current capabilities:

* Create contractors.
* Edit contractors.
* Delete contractors.
* Associate contractors with properties.
* Assign contractors to tasks.
* Reference contractors in maintenance workflows.
* Track contractor contact information.

---

# Team Members

Team functionality supports collaborative property management.

Current capabilities:

* Create team member records.
* Invite team members.
* Generate invitation codes.
* Link accepted users to team records.
* Assign properties.
* Restrict access by role.
* Revoke access.
* Manage team profiles.

Team members:

* Operate within assigned-property scope.
* Do not own subscriptions.
* Do not manage billing.

---

# Tenants & Maintenance Requests

Tenant functionality supports resident communication and maintenance requests.

Current capabilities:

* Add tenants.
* Invite tenants.
* Associate tenants with properties.
* Submit maintenance requests.
* Review maintenance requests.
* Track request activity.

The tenant experience remains intentionally simpler than the owner maintenance workflow.

---

# Notifications

Maintley supports multiple notification channels.

Current capabilities:

* In-app notifications.
* Mobile push notifications.
* Task reminders.
* Overdue reminders.
* Maintenance activity notifications.
* Notification preferences.

Notification behavior may vary by platform and subscription level.

---

# Reports

Maintley includes reporting functionality built from recorded maintenance data.

Current capabilities:

* Property reporting.
* Task reporting.
* Maintenance reporting.
* Activity summaries.
* Exportable reporting workflows where supported.

Reports are generated from existing Maintley records and do not act as separate sources of truth.

---

# Customer Support

Authenticated users have a dedicated Support Center at:

```text
/support
```

The Support Center brings together:

* New support, feedback, bug, and feature requests.
* Open and closed request tracking.
* Customer-visible updates from the Maintley team.
* Request attachments.
* Frequently asked questions.
* Troubleshooting and bug-report guidance.
* A curated feed limited to significant features and major user-facing updates.
* In-depth homeowner-friendly articles covering core Maintley functions.
* Founder notes that explain the practical thinking behind each guide.

Articles use stable, shareable routes:

```text
/support/articles
/support/articles/:articleSlug
```

Current article topics include:

* Building a useful property record.
* Turning completed tasks into maintenance history.
* Tracking appliances and systems.
* Organizing property documents.
* Configuring maintenance reminders.
* Organizing properties with groups.
* Getting started without documenting everything.
* Using Maintley Intelligence recommendations.
* Working with family and team members.
* Preparing property records for a contractor.
* Choosing between a task and a maintenance record.
* Preserving useful information after service work.

The Support Center shows a featured selection. The full article library is
available through **View all articles**.

Support is a separate navigation destination rather than a Settings category.
Desktop users can open it from the sidebar or profile menu. Tablet and mobile
users can open it from the navigation drawer.

The public Help Center remains available at `/help` for general guidance and
people who cannot access their account.

---

# Billing & Subscription Support

Maintley supports subscription-aware experiences.

Current capabilities:

* Free and paid plans.
* Subscription upgrades.
* Subscription management.
* Resource-limit enforcement.
* Feature availability controls.

Plan definitions and limits are maintained separately.

See:

* PLAN_FEATURE_MATRIX.md
* BILLING.md

---

# Native Android Application

Maintley supports a Capacitor-based Android application.

Current capabilities:

* Native Android packaging.
* Push notification registration.
* Mobile-optimized navigation.
* APK distribution workflows.
* Native update support.

The Android application shares the same core functionality and data model as the web application.

---

# Guiding Principles

Maintley should remain approachable for homeowners while supporting larger property portfolios.

User-facing language should prioritize clarity over industry terminology.

Preferred terminology:

* Property
* Appliance
* System
* Task
* Maintenance History
* Property Records

Avoid exposing unnecessary complexity when simpler concepts communicate the same idea.

The primary goal is to help users maintain properties, preserve maintenance history, and improve the quality of their records over time.
