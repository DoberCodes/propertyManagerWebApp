# Recommendation Engine

Last reviewed: 2026-06

# Purpose

The Recommendation Engine is responsible for generating, prioritizing, and resolving recommendations within Maintley.

It serves as the implementation layer behind Maintley Intelligence.

Maintley Intelligence defines:

* Why recommendations exist
* Where recommendations appear
* How recommendations should guide users

The Recommendation Engine defines:

* How recommendations are generated
* How recommendations are prioritized
* How recommendations are resolved
* How recommendation sources interact

For related documentation:

* PROPERTY_INTELLIGENCE.md
* APPLIANCE_PROFILES.md
* MAINTENANCE_EVENT_SCHEMA.md
* EMAIL_NOTIFICATIONS.md

---

# Recommendation Lifecycle

Recommendations follow a common lifecycle.

```text
Data Source
    ↓
Rule Evaluation
    ↓
Recommendation Generated
    ↓
Prioritized
    ↓
Displayed
    ↓
Resolved
    ↓
Archived
```

Recommendations should be generated from existing records.

Recommendations should not become independent sources of truth.

---

# Recommendation Sources

Recommendations may originate from multiple systems.

---

## Appliance Profiles

Appliance Profiles define:

* Expected information
* Suggested maintenance
* Suggested parts
* Suggested documentation

Examples:

HVAC:

* Filter Size
* Install Date
* Filter Replacement Maintenance

Water Heater:

* Install Date
* Capacity
* Flush Maintenance

Appliance Profiles are expected to be the primary recommendation source.

---

## Property Records

Property records may generate recommendations.

Examples:

* Missing property photo
* Missing property details
* Missing utility information

Property-level recommendations should generally remain lower priority than maintenance-related recommendations.

---

## Maintenance Events

Maintenance history may generate recommendations.

Examples:

* No filter replacement history
* No annual service history
* No inspection history

Maintenance-history recommendations are generally high value.

---

## Task Records

Task data may generate recommendations.

Examples:

* Suggested recurring maintenance not yet created
* Maintenance schedule not configured

Task-based recommendations help establish future maintenance workflows.

---

## File Metadata

Documentation records may generate recommendations.

Examples:

* Missing manual
* Missing warranty document
* Missing receipt

Documentation recommendations should remain lower priority than maintenance recommendations.

---

## Setup Assistant

The Setup Assistant may generate recommendations based on user selections.

Examples:

* Suggested appliances
* Suggested maintenance
* Suggested property records

Setup recommendations should help users continue onboarding without requiring completion.

---

# Recommendation Categories

The Recommendation Engine supports four primary recommendation categories.

---

## Maintenance

Recommendations related to maintenance activity.

Examples:

* Replace HVAC Filter
* Flush Water Heater
* Inspect Roof
* Test Smoke Detectors

These recommendations generally provide the highest maintenance value.

---

## Information

Recommendations related to metadata.

Examples:

* Install Date
* Filter Size
* Fuel Type
* Capacity
* Model Information

These recommendations improve future maintenance decisions.

---

## Parts & Supplies

Recommendations related to consumables.

Examples:

* HVAC Filters
* Refrigerator Water Filters
* Humidifier Pads
* Water Softener Salt

These recommendations improve maintenance efficiency.

---

## Documentation

Recommendations related to supporting records.

Examples:

* Manuals
* Warranty Information
* Receipts
* Photos

Documentation recommendations should remain optional.

---

# Recommendation Prioritization

Recommendations should not be treated equally.

The engine should prioritize recommendations based on user value.

---

## Tier 1 — Maintenance Opportunities

Highest priority.

Examples:

* Missing recurring maintenance
* No filter replacement history
* Missing service history

These directly impact maintenance outcomes.

---

## Tier 2 — Critical Information

Examples:

* Missing filter size
* Missing install date
* Missing capacity

These improve future maintenance execution.

---

## Tier 3 — Parts & Supplies

Examples:

* Missing HVAC filter information
* Missing refrigerator filter information

These improve maintenance efficiency.

---

## Tier 4 — Documentation

Examples:

* Missing manuals
* Missing warranties
* Missing receipts

These improve records but generally have lower maintenance impact.

---

# Recommendation Generation Rules

Recommendations should be generated through deterministic rules.

Example:

```text
IF

deviceType = HVAC

AND

filterSize IS EMPTY

THEN

Generate Recommendation:

Add HVAC Filter Size

Category:
Information

Tier:
2
```

Example:

```text
IF

deviceType = Water Heater

AND

installDate IS EMPTY

THEN

Generate Recommendation:

Add Water Heater Install Date

Category:
Information

Tier:
2
```

The engine should remain rule-driven before introducing AI-generated recommendations.

---

# Property Scan v1 Rules

Property Scan v1 is powered by Maintley Intelligence and uses centralized deterministic rules in the frontend recommendation layer.

Inputs:

* Property record
* System/appliance records
* Task records
* Maintenance history records
* Property and system documentation

Outputs:

* Recommendation id
* Property id
* Optional system id
* Category
* Severity
* Title
* Description
* Reason
* Suggested action label
* Suggested action type
* Created timestamp
* Active or dismissed status

The initial v1 rule set checks for record gaps and maintenance opportunities only.

It should not infer physical condition, safety, code compliance, equipment failure, or remaining useful life.

Dismissed recommendations may be stored locally in v1. Saved recommendation resolution and dismissal history belongs to a later phase.

The latest visible Quick Scan result is saved as a backend-derived snapshot for the property-level Insights tab so users can see the latest scan date and recommendations when they return.

Each completed Quick Scan also creates a backend history snapshot. The current UI does not expose scan history, but the data model supports adding it later without changing the scan engine.

Property Scan v1 may generate more recommendations than it displays. The Quick Scan surface should show the highest-value subset only.

The engine may generate detail recommendations for each affected system. Quick Scan should aggregate repeated detail recommendations into summary themes before display.

Summary rules are shown in Quick Scan.

Examples:

* Maintenance tracking has not been started for many systems.
* Recurring maintenance is missing for several systems.
* Important identification details are missing for some systems.
* Install dates are missing for many major systems.

Exact counts and affected record lists should be available inside the detail view, not in the primary summary title.

Detail rules are reserved for Full Property Audit and future drill-down views.

Examples:

* Dishwasher missing serial number
* Dryer missing serial number
* HVAC missing serial number
* Dishwasher has no maintenance history

Quick Scan display rules:

* Show 3-5 recommendations maximum
* Exclude low-severity documentation completeness items
* Exclude documentation gaps from the Quick Scan surface
* Aggregate repeated system-level findings into themes
* Keep titles encouraging and put precise counts in details
* Include a short explanation of why each recommendation matters
* Show affected record lists in a dialog rather than expanding long lists inline
* Show only the top recommendations by default, with an option to reveal the remaining Quick Scan recommendations
* Sort by internal recommendation score

Internal scoring:

* High = 10 points
* Medium = 5 points
* Low = 1 point

Severity framework:

High:

Things that directly impact maintenance execution.

Examples:

* No recurring maintenance
* Overdue tasks
* Critical systems not tracked

Medium:

Things that reduce future usefulness.

Examples:

* Missing install date
* Missing make or model
* Missing maintenance history
* Missing contractor
* Missing warranty expiration

Low:

Documentation completeness.

Examples:

* Missing photos
* Missing manuals
* Missing receipts
* Missing serial numbers

---

# Recommendation Resolution

Recommendations should automatically resolve when their underlying condition is satisfied.

Example:

```text
Recommendation

Add HVAC Filter Size

    ↓

User Adds Filter Size

    ↓

Recommendation Resolved
```

Example:

```text
Recommendation

Add Water Heater Install Date

    ↓

User Adds Install Date

    ↓

Recommendation Resolved
```

Resolved recommendations should not continue to appear in active recommendation lists.

---

# Recommendation States

Recommendations may exist in multiple states.

---

## Active

The recommendation condition currently exists.

The recommendation may be displayed.

---

## Resolved

The recommendation condition no longer exists.

The recommendation should be removed from active displays.

---

## Dismissed

The user intentionally dismisses the recommendation.

Future recommendation behavior should respect dismissal rules.

---

## Archived

Historical recommendation record.

Used for future recommendation history and analytics.

---

# Recommendation Surfaces

The Recommendation Engine generates recommendations.

Maintley Intelligence determines where they appear.

Potential surfaces:

* Setup Assistant
* Quick Scan
* Dashboard Recommendations
* Property Insights
* Intelligence Center
* Portfolio Intelligence
* Email Reports

Recommendation logic should remain centralized regardless of presentation.

---

# Appliance Profile Integration

Appliance Profiles should define expected information.

Example:

```text
HVAC

Critical Information

- Filter Size
- Install Date

Suggested Information

- Capacity
- Fuel Type

Documentation

- Manual
- Warranty
```

The Recommendation Engine should consume Appliance Profiles rather than hard-code appliance-specific requirements throughout the application.

---

# Maintenance Event Integration

Maintenance Events are an important recommendation source.

Examples:

```text
No Filter Replacement History
```

```text
No Water Heater Service History
```

```text
No Inspection History
```

The Recommendation Engine should derive maintenance-related recommendations from recorded history rather than assumptions.

Maintenance Events remain the source of truth.

---

# Maintley Intelligence Integration

Maintley Intelligence consumes Recommendation Engine outputs.

Relationship:

```text
Recommendation Engine
    ↓
Recommendations

Maintley Intelligence
    ↓
Guidance

Dashboard
    ↓
User Action
```

Maintley Intelligence should not independently generate recommendation logic.

Recommendation generation should remain centralized.

---

# Portfolio Recommendation Aggregation

Portfolio-level intelligence should aggregate property-level recommendations.

Examples:

* Properties missing maintenance history
* Properties missing recurring maintenance
* Properties missing appliance information

Portfolio Intelligence should reuse recommendation logic rather than introducing separate rule systems.

---

# Future AI Recommendations

Future AI capabilities may assist recommendation generation.

Potential examples:

* Recommendation ranking
* Recommendation grouping
* Recommendation wording
* Recommendation summarization

AI should enhance recommendation presentation.

AI should not become the primary source of recommendation logic.

Rule-based recommendation generation should remain authoritative.

---

# Design Principles

The Recommendation Engine should:

* Be deterministic.
* Be explainable.
* Be actionable.
* Be transparent.
* Be easy to validate.

Users should be able to understand:

* Why a recommendation exists.
* What information is missing.
* How to resolve it.

The engine should prioritize helping users improve records and complete maintenance activities rather than maximizing recommendation volume.

The goal is not to generate more recommendations.

The goal is to generate the most useful recommendations.
