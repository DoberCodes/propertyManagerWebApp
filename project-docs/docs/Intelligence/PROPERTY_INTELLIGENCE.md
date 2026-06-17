# Property Intelligence

Last reviewed: 2026-06

# Purpose

Property Intelligence is Maintley's guidance and recommendation system.

Its purpose is to help users:

* Improve property records
* Reduce forgotten information
* Preserve maintenance knowledge
* Identify maintenance opportunities
* Improve long-term property management decisions

Property Intelligence serves as the recommendation layer of Maintley.

It exists to help users understand:

> What would help me next?

The goal is not to score properties, force documentation, or require users to complete every possible field.

The goal is to provide useful, actionable guidance.

---

# Intelligence Philosophy

Property Intelligence should act as a guide rather than an auditor.

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

Property Intelligence should encourage action rather than create anxiety.

---

# Responsibilities

Property Intelligence is responsible for:

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

Property Intelligence is not responsible for:

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

Property Intelligence evaluates Maintley's records.

It does not evaluate actual property condition.

Avoid:

* Your water heater needs replacement.
* Your roof needs repair.
* Your HVAC system is failing.

Prefer:

* No service history has been recorded.
* Install date has not been documented.
* Additional information may improve future maintenance tracking.

Property Intelligence should describe records, not diagnose properties.

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

Property Intelligence may appear through multiple experiences.

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

Property Insights consume Property Intelligence recommendations.

They do not create them.

---

## Future Intelligence Center

Purpose:

Provide a dedicated destination for Property Intelligence.

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

Property Intelligence supports multiple scan depths.

---

## Quick Scan

Purpose:

Immediate recommendations.

Target:

Top 3–5 opportunities.

Typical use cases:

* After Setup Assistant completion
* After appliance creation
* Dashboard review
* Property review

Quick Scan prioritizes speed and clarity.

---

## Deep Scan

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

Property Intelligence may generate recommendations in four categories.

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

Property Insight content is generated by Property Intelligence.

Property Intelligence determines:

* Which observations exist
* Recommendation priority
* Observation wording
* Observation ranking

Delivery systems consume these outputs.

Delivery systems do not determine recommendation behavior.

---

# Relationship to Other Systems

Property Intelligence consumes:

* Property Records
* Appliance Records
* Maintenance Events
* Task Records
* Parts & Supplies Records
* Documentation Records
* Appliance Profiles

Property Intelligence generates:

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

Property Intelligence should become increasingly useful as records improve.

The objective is not to create scores.

The objective is not to generate audits.

The objective is to help users:

* Preserve knowledge
* Improve records
* Complete maintenance
* Reduce forgotten information
* Make better decisions

Over time, Property Intelligence should become the primary guidance layer within Maintley.

It should help users understand not only what information exists, but what actions would provide the greatest value next.
