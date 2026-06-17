# Recommendation Engine

Last reviewed: 2026-06

# Purpose

The Recommendation Engine is responsible for generating, prioritizing, and resolving recommendations within Maintley.

It serves as the implementation layer behind Property Intelligence.

Property Intelligence defines:

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

Property Intelligence determines where they appear.

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

# Property Intelligence Integration

Property Intelligence consumes Recommendation Engine outputs.

Relationship:

```text
Recommendation Engine
    ↓
Recommendations

Property Intelligence
    ↓
Guidance

Dashboard
    ↓
User Action
```

Property Intelligence should not independently generate recommendation logic.

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
