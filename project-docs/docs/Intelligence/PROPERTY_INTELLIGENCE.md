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
* Full Property Audit results
* Ongoing Property Intelligence observations
* Setup Assistant recommendations
* Dashboard recommendations
* Action Center recommendations
* Property Insight generation
* Portfolio Intelligence
* Future AI-assisted recommendations

Maintley Intelligence should prefer structured asset classification when available.

Device records may provide:

* `assetType` - broad asset type, such as HVAC or Water Heater.
* `assetVariant` - more specific pattern, such as Furnace or Tankless Gas.

Knowledge packs should use these fields before falling back to the legacy `type` field. Legacy records without structured classification should remain supported as generic or unknown.

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

Recommendation wording should always attribute findings to Maintley's saved records.

Maintley Intelligence should say:

```text
Maintley's records do not show HVAC service in the past 180 days.
```

Avoid:

```text
Your HVAC has not been serviced in 180 days.
```

The distinction matters because Maintley has memory, not omniscience. It reports on recorded property knowledge and suggests next steps from that record.

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

# Recommendation Safety Ladder

Maintley Intelligence recommendations should stay within safe, explainable levels.

## Level 1: Stored Data

Safest.

Reports facts from Maintley's database.

Examples:

* No warranty has been uploaded.
* No recurring task exists in Maintley's records.
* No install date has been recorded.
* Last recorded maintenance was 180 days ago.

## Level 2: Organization Improvements

Still safe.

Suggests ways to make the property record more useful.

Examples:

* Recording the filter size makes future replacements easier.
* Adding a manual may help future repairs.
* Consider creating recurring maintenance.

## Level 3: Attributed Guidance

Usually acceptable when clearly attributed.

Uses Maintley baseline guidance, user-defined schedules, or future manufacturer/common guidance while making the source clear.

Example:

```text
Many HVAC filters are commonly replaced every 90 days. Maintley's records show the last recorded replacement was 112 days ago.
```

## Level 4: Avoid

Do not diagnose, predict failure, make safety judgments, assess code compliance, or provide structural advice.

Avoid:

* Your water heater is failing.
* Your roof needs repair.
* Your wiring is unsafe.
* This system is not code compliant.

---

# Recommendation Source Types

Future recommendation records should formally identify why the recommendation exists.

Recommended source types:

* Recorded Fact - Derived directly from Maintley's saved data.
* Documentation Opportunity - Based on absent or incomplete property records.
* Maintenance Reminder - Based on recorded dates and user-configured or Maintley-defined intervals.
* General Best Practice - Based on commonly accepted maintenance guidance, with clear attribution.
* User Preference - Based on how the owner chooses to manage the property.

The current v1 engine already exposes `ruleId`, `description`, `whyItMatters`, metadata, and required plan/capability fields. A future schema change may add an explicit source-type field so every recommendation can answer:

> Why did Maintley recommend this?

That schema change should be handled deliberately because it affects the recommendation contract and saved scan snapshots.

---

# Recommendation Explanation Model

Every recommendation should internally answer four questions.

* Observation - What did Maintley observe in the property's records?
* Why it matters - Why is the observation useful to the homeowner?
* Future benefit - What becomes easier, clearer, or more reliable later?
* Action - What should the user do next?

Every recommendation should also retain an internal reasoning statement.

This is the hidden because behind the recommendation. It may not appear on the recommendation card, but it should be available for future email summaries, recommendation explanations, audit trails, and generated guidance.

Example:

```text
Observation:
No install date has been recorded for your Water Heater.

Why it matters:
Install dates help estimate warranty coverage and replacement planning.

Future benefit:
Recording the install date makes warranty tracking, service planning, and future replacements much easier.

Action:
Record the install date if known.

Internal reasoning:
Maintley recommends recording install dates because they support warranty tracking, replacement planning, and lifecycle estimates.
```

Not every screen needs to show all four pieces, but the engine should be able to explain them.

Evidence should still be available through rule metadata, affected record IDs, source types, and recorded property data so Maintley can answer:

> How do I know this?

Quick Scan cards should keep evidence behind progressive disclosure.

The default card should show:

* Observation
* Why it matters
* Affected count, when affected records are known
* Recommended action

An inline disclosure labeled `Why this recommendation?` may expand to show:

* The record-based evidence sentence
* A short affected system or task list

This keeps recommendations scannable while giving curious users a clear answer to:

> Why am I seeing this?

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

Review what Maintley knows about a property and highlight the few things most worth the user's attention.

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

# Maintley Intelligence Roadmap

Maintley Intelligence should grow through three distinct levels.

Each level should answer a different customer question.

The levels are not simply larger versions of the same scan.

They represent different product experiences:

1. Quick Property Scan
2. Full Property Audit
3. Ongoing Property Intelligence

---

# Maintley Intelligence Foundation

Maintley Intelligence is implemented as one shared engine with multiple consumers.

The engine evaluates saved property data and produces structured findings.

Consumers decide how those findings are displayed, limited, grouped, persisted, or delivered.

The engine should not render UI, send email, schedule scans, or save scan history.

Maintley Intelligence uses layered sources of truth:

1. User-defined maintenance schedule
2. Manufacturer-specific guidance (future)
3. Maintley Baseline Care Library
4. Current property records
5. Historical maintenance events
6. Current date/time

V1 uses Maintley Baseline Care Library, property records, maintenance history, and current date/time.

The Maintley Baseline Care Library is versioned.

Current baseline version:

```text
2026.1
```

Baseline guidance is Maintley-defined and generic. V1 does not use external lookups, AI, web data, or manufacturer-specific rules.

Current implementation structure:

```text
src/intelligence/
├── types.ts
├── engine.ts
├── aggregation.ts
├── capabilities.ts
├── prioritization.ts
├── planFilter.ts
├── rules/
└── consumers/
    └── quickScan.ts
```

The implementation also includes:

```text
src/intelligence/baselineCareLibrary.ts
```

Current engine inputs:

* Property record
* System and appliance records
* Task records
* Maintenance history records
* Documents and files
* Plan and capability context
* Current date

Current engine output:

Structured findings with:

* id
* ruleId
* propertyId
* affectedSystemIds
* category
* severity
* priority
* title
* description
* whyItMatters
* suggestedActionLabel
* suggestedActionType
* requiredPlan
* requiredCapabilities
* baselineVersion
* metadata

The engine result also includes:

* findings
* summary counts
* systems reviewed
* tasks reviewed
* generatedAt

Current rules:

* Overdue tasks exist
* Major systems missing install dates
* Systems missing important identification details
* Systems with no maintenance history
* Systems with no actionable maintenance coverage
* Baseline maintenance cadence appears overdue based on saved maintenance history and current date

Quick Property Scan consumes the shared engine through the Quick Scan consumer.

Property Audit, Dashboard Insights, Email Insights, and future intelligence features should consume the same engine rather than creating separate recommendation logic.

---

## Level 1: Quick Property Scan

Customer question:

> What did Maintley find that is worth my attention?

Purpose:

Show the most valuable next actions from the saved property record without overwhelming the user.

Availability:

Free and paid plans.

Target:

Top 3-5 opportunities.

Expected time:

5-10 seconds.

Typical use cases:

* After Setup Assistant completion
* After appliance creation
* Dashboard review
* Property review

Quick Property Scan is designed to be run regularly.

Quick Scan prioritizes maintenance execution and record usefulness.

Quick Scan should surface themes rather than repeating one recommendation per affected system.

Quick Scan summary titles should be encouraging and should avoid leading with large raw counts. Exact affected counts and affected system lists belong in the recommendation detail view.

Quick Scan should be plan-aware.

Quick Scan summary wording should sound like guidance from an experienced property manager.

Prefer:

```text
Maintley does not currently have recurring maintenance recorded for several systems.
```

```text
Maintley's records do not show safety-device maintenance history yet.
```

Avoid leading with:

```text
Recurring maintenance is missing.
```

```text
Tracking has not been started.
```

Quick Scan should reinforce the property-memory story by framing many findings as opportunities to build history, improve future decisions, or reduce forgotten maintenance.

Maintley Intelligence may generate more findings than a user can act on, but the visible Quick Scan should pass through a capability filter before recommendations are shown.

Free users should see record-focused recommendations they can act on, such as:

* Add install dates
* Add make or model information
* Upload warranty information
* Record first maintenance history
* Complete property profile information

Free users should not see locked recurring-maintenance recommendations as deficiencies.

When a premium capability is relevant, Quick Scan may show one clearly labeled premium opportunity at most. It should be framed as an available Homeowner+ capability rather than a problem the user failed to fix.

Quick Scan may show a short progress dialog while it is running. The dialog should use familiar Maintley loading treatment and close once the latest snapshot is ready.

Detailed affected system or task lists should open in a dialog from the recommendation. This keeps the property-level Insights tab focused while still giving users a clear path into the affected records.

High-priority examples:

* Maintley could not find a recurring maintenance schedule for a system
* Maintley's records show overdue maintenance tasks
* The property contains no systems
* Maintley's records do not show smoke or carbon monoxide detector maintenance history

Medium-priority examples:

* No install date has been recorded for a system
* A major appliance could be easier to identify later in Maintley's records with make or model details
* Maintenance history has not been started for several systems
* Maintley's records do not show a contractor for serviced equipment
* No warranty expiration has been recorded

Theme examples:

* Maintenance history has not been started for several systems.
* Maintley does not currently have recurring maintenance recorded for several systems.
* Some systems could be easier to identify in Maintley's records.
* No install date has been recorded for several major systems.

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

Review what Maintley knows about the property and highlight the few record updates or maintenance steps most worth the user's attention after the Property Setup Assistant.

Property Scan v1 is the current Quick Scan implementation and is powered by the shared Maintley Intelligence engine.

Maintley Intelligence is the umbrella guidance system. Property Scan is the explicit property-level review action.

Property Scan v1 is:

* An explainable review of saved property records
* A maintenance-opportunity review
* Deterministic and rule-based
* Based only on data already saved in Maintley
* A consumer of shared Maintley Intelligence findings
* Limited to the top 3-5 visible recommendations
* Filtered by the account's plan capabilities
* Displayed from the property-level Insights tab
* Rendered on the page after the scan completes
* Supported by dialogs for affected system or task details

Property Scan v1 is not:

* An inspection
* A condition assessment
* A safety certification
* A property grade
* An AI-generated diagnosis

The shared engine currently checks for:

* Systems missing make or model
* Systems missing install date
* Systems with no maintenance history
* Systems with no linked recurring task
* Open overdue tasks

The engine may generate more findings than the user sees. Quick Scan filters, groups, and limits them so the visible experience stays focused on the highest-value next actions.

The visible Property Scan message should be:

```text
Maintley reviewed what it knows about your property and found a few things worth your attention.
```

Property Scan should not be marketed or described as:

```text
AI scanned your house.
```

Repeated system-level findings should be aggregated into a small number of theme-level recommendations by the Quick Scan consumer. Individual system findings belong in Full Property Audit or future drill-down views.

Each visible recommendation should include a short explanation of why the action matters. For example, install dates help track equipment age, warranty coverage, and future replacement planning.

Visible Quick Scan recommendation cards should help users understand:

* What Maintley found
* Why the finding matters
* What future maintenance headache the next step may help avoid
* Which action the user can take next

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

## Level 2: Full Property Audit

Customer question:

> How complete and maintainable are my property records?

Purpose:

Provide a comprehensive review of property record completeness, maintenance coverage, documentation, and lifecycle readiness.

Availability:

Premium plans.

Expected time:

30-60 seconds.

Full Property Audit is a future Maintley Intelligence process.

It is not a larger Quick Scan.

It should evaluate the property across categories and present completeness-oriented results.

It may generate a larger set of findings across:

* Documentation
* Equipment Records
* Maintenance Coverage
* Lifecycle Planning
* Property Completeness

Example audit categories:

Documentation:

* Manuals uploaded
* Warranty documents uploaded
* Receipts uploaded
* Photos attached

Equipment Records:

* Make and model recorded
* Serial numbers recorded
* Install dates recorded
* Warranty dates recorded

Maintenance Coverage:

* Maintainable systems have recurring care
* Completed tasks create maintenance history
* Filters have replacement schedules
* Safety devices are being checked

Lifecycle Planning:

* Aging equipment
* HVAC nearing expected lifespan
* Water heater age review
* Roof approaching an inspection window
* Warranty expirations
* End-of-life planning

A future Full Property Audit may present category completeness instead of only listing findings.

Example:

```text
Property Documentation

72% complete

Equipment Records     4/5
Maintenance Coverage  3/5
Documentation         2/5
History               5/5
```

Because the user explicitly requests an audit, a larger list of findings is appropriate in this future surface. The audit should still group findings clearly so users can move from summary to detail without feeling buried.

---

## Level 3: Ongoing Property Intelligence

Customer question:

> What should I think about next?

Purpose:

Continuously derive useful observations from property records, maintenance history, dates, costs, and seasonal context.

Availability:

Premium plans.

Expected behavior:

Runs continuously or on a scheduled cadence once supported.

Ongoing Property Intelligence is where the broader Maintley Intelligence brand should become most visible.

This layer should help users notice patterns or upcoming decisions they may not have thought to ask about.

Examples:

* Based on HVAC age, begin budgeting for replacement
* Roof inspection is due before hurricane season
* Maintenance costs have increased year over year
* Two warranties expire this fall
* Seasonal maintenance reminders
* Lifecycle forecasts
* Risk indicators
* Personalized recommendations

This future layer should be predictive and contextual.

It should still remain explainable and derived from Maintley records.

---

## Product Hierarchy

Maintley Intelligence should support a natural product progression:

Free:

> Here is what to do next.

Paid Audit:

> Here is everything that is missing or incomplete.

Premium Intelligence:

> Here is what your data means.

This progression should prevent Full Property Audit from feeling like "Quick Scan with 50 more recommendations."

Quick Scan should stay fast and action-oriented.

Full Property Audit should feel like a comprehensive review.

Ongoing Property Intelligence should feel like guidance that becomes smarter as Maintley records improve.

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
