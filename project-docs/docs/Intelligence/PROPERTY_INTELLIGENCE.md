# Maintley Intelligence

Last reviewed: 2026-06

# Purpose

Maintley Intelligence is Maintley's guidance and recommendation system.

Its purpose is to help users:

* Improve property records
* Reduce forgotten information
* Preserve maintenance knowledge
* Identify maintenance opportunities
* Improve long-term property management decisions

Maintley Intelligence serves as the recommendation layer of Maintley.

It exists to help users understand:

> What would help me next?

The goal is not to score properties, force documentation, or require users to complete every possible field.

The goal is to provide useful, actionable guidance.

---

# Intelligence Philosophy

Maintley Intelligence should act as a guide rather than an auditor.

The system should help users make progress rather than remind them how incomplete their records are.

Good:

```text
Add HVAC Filter Size
```

```text
Add Water Heater Install Date
```

```text
Record Filter Replacement History
```

Poor:

```text
Property Incomplete
```

```text
23 Missing Items
```

```text
Documentation Score: 41%
```

Maintley Intelligence should encourage action rather than create anxiety.

---

# Responsibilities

Maintley Intelligence is responsible for:

* Recommendation generation
* Recommendation prioritization
* Quick Scan results
* Deep Scan results
* Setup Assistant recommendations
* Dashboard recommendations
* Action Center recommendations
* Property Insight generation
* Portfolio Intelligence
* Future AI-assisted recommendations

Maintley Intelligence is not responsible for:

* Email delivery
* Notification delivery
* User permissions
* Subscription enforcement
* Dashboard layout
* Billing decisions

Those concerns belong to their respective systems.

---

# Core Principles

## Recommendations Over Requirements

Maintley should recommend improvements rather than require them.

Users should never be blocked because information is missing.

Missing information should create opportunities for improvement rather than validation failures.

Example:

A user can create an HVAC system without:

* Filter Size
* Install Date
* Warranty Information

Maintley may recommend adding these later.

---

## Prioritize Value

Not all recommendations provide equal value.

Recommendations should prioritize information that improves maintenance outcomes.

High Value

Examples:

* Filter Size
* Install Date
* Maintenance Schedule
* Capacity
* Service History

Medium Value

Examples:

* Warranty Information
* Contractor Information
* Service Provider Information
* Product Specifications

Low Value

Examples:

* Manuals
* Photos
* Receipts

Higher-value recommendations should appear before lower-value recommendations.

---

## Actionable Guidance

Every recommendation should answer:

* What is missing?
* Why does it matter?
* How can it be resolved?

Example:

Add HVAC Filter Size

Knowing the filter size simplifies future filter replacement and improves maintenance tracking.

Recommendations should always provide context.

---

## Improve Records, Not Properties

Maintley Intelligence evaluates Maintley's records.

It does not evaluate actual property condition.

Avoid:

* Your water heater needs replacement.
* Your roof needs repair.
* Your HVAC system is failing.

Prefer:

* No service history has been recorded.
* Install date has not been documented.
* Additional information may improve future maintenance tracking.

Maintley Intelligence should describe records, not diagnose properties.

---

# Recommendation Hierarchy

Recommendations should be prioritized in the following order.

## Tier 1 — Maintenance Opportunities

Highest priority.

Examples:

* Missing recurring maintenance
* No filter replacement history
* No service history
* Missing inspection history

These recommendations directly affect maintenance outcomes.

---

## Tier 2 — Critical Property Information

Examples:

* Missing filter size
* Missing install date
* Missing capacity
* Missing fuel type

These recommendations improve future maintenance decisions.

---

## Tier 3 — Parts & Supplies

Examples:

* Missing HVAC filter information
* Missing refrigerator filter information
* Missing humidifier pad information

These recommendations improve maintenance efficiency.

---

## Tier 4 — Documentation

Examples:

* Missing manual
* Missing warranty
* Missing receipt
* Missing supporting photos

Documentation remains valuable but should not dominate recommendations.

---

# Intelligence Surfaces

Maintley Intelligence may appear through multiple experiences.

All experiences should consume the same underlying recommendation engine.

Presentation may vary.

Recommendation logic should remain centralized.

---

## Setup Assistant

Purpose:

Guide initial property setup.

Examples:

* Suggested appliances
* Suggested systems
* Suggested maintenance tasks

---

## Quick Scan

Purpose:

Provide immediate recommendations.

Target:

Top 3–5 opportunities.

Focus:

* High-value recommendations
* Immediate actions
* Fast feedback

Quick Scan should avoid overwhelming users.

---

## Dashboard Recommendations

Purpose:

Surface the most valuable opportunities.

Target:

Top 3 recommendations.

Focus:

* Immediate action
* Maintenance opportunities
* Record improvement opportunities

The dashboard should answer:

> What should I improve next?

---

## Property Insights

Purpose:

Provide periodic intelligence summaries.

Examples:

* Missing maintenance history
* Missing appliance information
* Suggested maintenance opportunities

Property Insights consume Maintley Intelligence recommendations.

They do not create them.

---

## Future Intelligence Center

Purpose:

Provide a dedicated destination for Maintley Intelligence.

Potential capabilities:

* Recommendation history
* Scan history
* Setup progress
* Property reviews
* Portfolio reviews
* Recommendation completion tracking

The Intelligence Center should centralize intelligence-related workflows.

---

# Scan Types

Maintley Intelligence supports multiple scan depths.

---

## Quick Scan
## Quick Scan

Purpose:

Show the most valuable next actions without overwhelming the user.

Target:

Top 3-5 opportunities.

Typical use cases:

* After Setup Assistant completion
* After appliance creation
* Dashboard review
* Property review

Quick Scan prioritizes maintenance execution and record usefulness.

Quick Scan should surface themes rather than repeating one recommendation per affected system.

Quick Scan summary titles should be encouraging and should avoid leading with large raw counts. Exact affected counts and affected system lists belong in the recommendation detail view.

Quick Scan may show a short progress dialog while it is running. The dialog should use familiar Maintley loading treatment and close once the latest snapshot is ready.

Detailed affected system or task lists should open in a dialog from the recommendation. This keeps the property-level Insights tab focused while still giving users a clear path into the affected records.

High-priority examples:

* A system has no recurring maintenance schedule
* The property has overdue maintenance tasks
* The property contains no systems
* Smoke or carbon monoxide detectors have no maintenance tracking

Medium-priority examples:

* A system is missing an install date
* A major appliance is missing make or model
* Maintenance history has not been started for multiple systems
* Serviced equipment has no contractor recorded
* Warranty expiration is not recorded

Theme examples:

* Maintenance tracking has not been started for 12 systems.
* 8 systems do not have recurring maintenance tasks.
* 6 systems are missing important identification details.
* 3 major systems are missing install dates.

Quick Scan excludes audit-style completeness items such as:

* Missing photos
* Missing manuals
* Missing receipts
* Missing serial numbers
* Missing warranty documents
* Missing notes
* Cosmetic record completeness issues

Those items belong in Full Property Audit, where a user has explicitly asked for a broader review.

---

## Property Scan v1

Purpose:

Review the saved property record for completeness and maintenance opportunities after the Property Setup Assistant.

Property Scan v1 is the current Quick Scan implementation and is powered by Maintley Intelligence.

Maintley Intelligence is the umbrella guidance system. Property Scan is the explicit property-level review action.

Property Scan v1 is:

* A record-completeness scan
* A maintenance-opportunity scan
* Deterministic and rule-based
* Based only on data already saved in Maintley
* Limited to the top 3-5 visible recommendations
* Displayed from the property-level Insights tab
* Rendered on the page after the scan completes
* Supported by dialogs for affected system or task details

Property Scan v1 is not:

* An inspection
* A condition assessment
* A safety certification
* A property grade
* An AI-generated diagnosis

The scan currently checks for:

* Missing core property details
* No systems or appliances recorded
* Systems missing make or model
* Systems missing serial number
* Systems missing install date
* Systems missing warranty information
* Systems with no maintenance history
* Systems with no linked recurring task
* Missing documents or property photos
* Open overdue tasks
* Upcoming due maintenance
* Suggested maintenance opportunities not yet accepted

The engine may generate more recommendations than the user sees. Quick Scan filters and sorts them so the visible experience stays focused on the highest-value next actions.

Repeated system-level findings should be aggregated into a small number of theme-level recommendations in Quick Scan. Individual system findings belong in Full Property Audit or future drill-down views.

Each visible recommendation should include a short explanation of why the action matters. For example, install dates help track equipment age, warranty coverage, and future replacement planning.

The Insights tab should show the last scan date when a scan has been run.

In v1, the latest visible scan result is saved as a backend-derived snapshot so the property-level Insights tab can show the latest scan whenever the user returns.

Each completed Quick Scan is also saved as a backend history snapshot for future scan-history UI. The current UI does not expose that history yet.

Scan snapshots are derived records. They preserve what Maintley Intelligence showed at scan time, but they do not replace the source records used to generate recommendations.

Recommendations are grouped into:

* Missing Information
* Maintenance Opportunities
* Overdue Work
* Documentation Gaps
* Suggested Next Steps

Each recommendation should clearly explain:

* Which property or system it refers to
* What saved record data triggered it
* Why the next step may help the homeowner
* Which action the user can take next

Phase 1 does not send emails, run scheduled scans, call AI APIs, or calculate a property score.

---

## Full Property Audit

Purpose:

Answer how complete and maintainable the saved records are.

Full Property Audit is a future Maintley Intelligence process.

It may generate a larger set of findings across:

* Documentation Gaps
* Record Completeness
* Maintenance Coverage
* Lifecycle Tracking

Examples:

* Missing manuals
* Missing photos
* Missing receipts
* Missing serial numbers
* Missing install dates
* Missing warranty information
* Systems without tasks
* Systems without history
* Systems without contractors
* Aging equipment
* Warranty expirations
* End-of-life planning

Because the user explicitly requests an audit, a larger list of findings is appropriate in this future surface.

---

Purpose:

Comprehensive property analysis.

Target:

Full property review.

Examples:

* Missing maintenance opportunities
* Missing appliance information
* Missing parts information
* Missing documentation

Deep Scan may be restricted by subscription level.

Deep Scan should remain optional.

---

## Portfolio Scan

Purpose:

Review multiple properties.

Examples:

* Properties with no maintenance history
* Properties with no appliances
* Properties with missing critical information
* Properties missing recurring maintenance

Portfolio Scan should aggregate property-level recommendations rather than create independent recommendation systems.

---

# Recommendation Categories

Maintley Intelligence may generate recommendations in four categories.

---

## Maintenance

Suggested maintenance activities.

Examples:

* Replace HVAC Filter
* Flush Water Heater
* Inspect Roof
* Test Smoke Detectors

---

## Information

Suggested appliance metadata.

Examples:

* Install Date
* Filter Size
* Capacity
* Fuel Type
* Model Information

---

## Parts & Supplies

Suggested consumables and replacement items.

Examples:

* HVAC Filters
* Refrigerator Water Filters
* Humidifier Pads
* Water Softener Salt

---

## Documentation

Optional supporting records.

Examples:

* Manuals
* Warranty Information
* Receipts
* Photos

Documentation should remain beneficial but optional.

---

# Portfolio Intelligence

Portfolio users may receive intelligence at multiple levels.

---

## Property-Level Intelligence

Examples:

* Missing filter size
* Missing install date
* Missing maintenance history

---

## Portfolio-Level Intelligence

Examples:

* Properties with no maintenance history
* Properties with no appliances
* Properties missing recurring maintenance
* Properties missing critical records

Portfolio Intelligence should aggregate property-level observations whenever possible.

Avoid creating separate recommendation systems for portfolio users.

---

# Property Insight Content

Property Insight content is generated by Maintley Intelligence.

Maintley Intelligence determines:

* Which observations exist
* Recommendation priority
* Observation wording
* Observation ranking

Delivery systems consume these outputs.

Delivery systems do not determine recommendation behavior.

---

# Relationship to Other Systems

Maintley Intelligence consumes:

* Property Records
* Appliance Records
* Maintenance Events
* Task Records
* Parts & Supplies Records
* Documentation Records
* Appliance Profiles

Maintley Intelligence generates:

* Recommendations
* Observations
* Setup Opportunities
* Scan Results
* Insight Content

Recommendation generation rules are defined in:

RECOMMENDATION_ENGINE.md

Appliance-specific expectations are defined in:

APPLIANCE_PROFILES.md

Delivery behavior is defined in:

EMAIL_NOTIFICATIONS.md

---

# Future Direction

Maintley Intelligence should become increasingly useful as records improve.

The objective is not to create scores.

The objective is not to generate audits.

The objective is to help users:

* Preserve knowledge
* Improve records
* Complete maintenance
* Reduce forgotten information
* Make better decisions

Over time, Maintley Intelligence should become the primary guidance layer within Maintley.

It should help users understand not only what information exists, but what actions would provide the greatest value next.
