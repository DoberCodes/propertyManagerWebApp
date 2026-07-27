# Maintley Intelligence

Last reviewed: 2026-07

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

Maintley may also explain how much useful context its records provide through
`Maintley Intelligence readiness`. Readiness describes Maintley's ability to
provide specific kinds of guidance. It does not describe the physical condition
of the property or the quality of the homeowner.

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

# Maintley Intelligence Readiness

Readiness answers:

> What can Maintley help me understand with the records available today?

The initial readiness categories are:

* **Equipment context** - whether Maintley has enough structured equipment
  information for equipment-specific guidance.
* **Maintenance coverage** - whether Maintley can connect expected care,
  recurring tasks, and upcoming work.
* **Service history** - whether completed work is recorded and connected well
  enough to provide historical context.

Customer-facing levels are:

* **Starting** - Maintley has little or no usable context in this category.
* **Building context** - Maintley can provide some guidance and can identify the
  next records that would make it more useful.
* **Ready** - the current records support the defined benefit for that category.

Readiness is not a property score. Do not show:

* an overall percentage;
* a weighted score across categories;
* health signals;
* a property grade;
* language implying the physical property was inspected.

Each category result should include:

1. The categorical level.
2. What Maintley can currently do.
3. The evidence or records supporting the result.
4. One practical next step when additional context would help.

Readiness rules must live in the shared Maintley Intelligence layer. Consumer
surfaces may choose how much detail to show, but they must not calculate their
own readiness thresholds.

Readiness and subscription access are separate. The resolver determines which
product capabilities the account may use. Readiness only describes the context
available to an allowed Intelligence capability.

---

# Responsibilities

Maintley Intelligence is responsible for:

* Recommendation generation
* Recommendation prioritization
* Quick Scan results
* Full Property Review results
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

## Asset Record Expectations

Maintley Intelligence should apply different expectations to different kinds of records.

Equipment and mechanical systems, such as HVAC, water heaters, refrigerators, washers, dryers, and safety detectors, may benefit from make, model, serial number, install date, recurring care, and maintenance-history recommendations.

Structural or inspection-based records, such as roofs, windows, doors, gutters, siding, foundations, decks, fences, driveways, chimneys, and GFCI outlets, should not be evaluated with mechanical-equipment identity expectations. Maintley should not penalize these records for missing make, model, serial number, install date, recurring care, or routine maintenance history.

For structural and inspection-based records, Maintley may recommend documenting inspections or condition reviews. This guidance should be framed as recordkeeping and inspection history, not as a required maintenance schedule.

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

Resolution should preserve that context.

When a user chooses to act on a recommendation, Maintley should show the
recommendation, the affected asset, the audit area, why it matters, and the
recommended completion path before sending the user into a task, document,
asset, contractor, or maintenance-history workflow.

The recommendation explains the opportunity. The Resolution Engine decides how
Maintley should help the user finish it.

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

Supported source types:

* `property_memory` - Derived entirely from user-saved property data.
* `knowledge_pack` - Derived from Maintley knowledge packs.
* `history_inference` - Derived from patterns in the user's own saved history.
* `context` - Derived from external or seasonal context.

The current v1 engine exposes `source` so every recommendation can answer:

> Why did Maintley recommend this?

Plan access is source-based:

* Free: `property_memory`
* Homeowner+ and above: `property_memory`, `knowledge_pack`, `history_inference`, `context`

Customer-facing source language should make the depth clear:

* Free Quick Scan: Maintley Intelligence powered by Home Memory / Property Memory.
* Paid Quick Scan: Maintley Intelligence powered by Home Memory / Property Memory, Maintley Knowledge, Home / Property History, Seasonal Context, and Maintenance Patterns.

Avoid rule-specific subscription exceptions when the recommendation source already determines access.

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

* Suggested equipment
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

One primary suggestion on the dashboard today. Future dashboard surfaces may show the top 3 recommendations when there is enough room and a clear user benefit.

Focus:

* High-value Maintley Intelligence
* Maintenance opportunities that are not already covered by dashboard work queues
* Record improvement opportunities with clear planning or maintenance value

The dashboard should answer:

> What should I improve next?

Dashboard recommendations should be generated through the dashboard Maintley Intelligence consumer. The dashboard should not own separate recommendation rules.

Dashboard recommendation titles should identify equipment by make and equipment type, such as `Lennox HVAC`, while keeping model and serial numbers in supporting details. When a dashboard recommendation is based on saved maintenance history, the card should include concise proof lines that explain the recommendation in homeowner language. If a matching linked recurring task is already scheduled farther out than the common care timeframe, the recommendation should become a schedule optimization insight: show the recorded service pattern, show the recurring task name, next date, and frequency, then explain that the maintenance history and recurring task currently reflect a longer interval. The copy should point users toward reviewing the next reminder date or recorded maintenance history instead of implying the task does not exist.

The dashboard Maintley Intelligence card should not repeat overdue tasks because
overdue work already has its own dashboard queue. It should also avoid using the
spotlight for basic recurring-task setup when richer paid intelligence is
available; recurring-task coverage belongs more naturally in Quick Scan and
Property Review. On paid plans, the card should act as the showcase for deeper
Maintley Intelligence and prefer sources in this order:

1. Home / Property History trends
2. Seasonal Context
3. Maintley Knowledge

Basic record-memory findings may remain available for free plans or as a
fallback when no expanded intelligence finding is available, but they should not
crowd out deeper paid-plan guidance.

Seasonal Context recommendations should be concrete seasonal maintenance actions,
not vague reminders to review records. For example, summer recommendations may
suggest inspecting the roof, clearing gutters, checking HVAC filters and outdoor
unit airflow, sealing exterior gaps, testing sprinklers, trimming branches, or
reviewing deck and fence condition. The dashboard action should open a clear
one-time seasonal task draft when task creation is the natural next step.

---

## Property Insights

Purpose:

Provide periodic intelligence summaries.

Examples:

* Missing maintenance history
* Missing equipment information
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
2. Full Property Review
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
    ├── quickScan.ts
    ├── portfolioDashboard.ts
    └── propertyAudit.ts
```

The implementation also includes:

```text
src/intelligence/baselineCareLibrary.ts
```

Current engine inputs:

* Property record
* System and equipment records
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
* source
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
* Systems missing knowledge-pack-specific maintenance details, such as filter size
* Systems with no maintenance history
* Systems with no actionable maintenance coverage
* Baseline maintenance cadence appears overdue based on saved maintenance history and current date

Current rule sources:

* `property_memory`: overdue tasks, missing install dates, missing identification details, missing maintenance history.
* `knowledge_pack`: missing knowledge-pack details, recurring maintenance coverage.
* `history_inference`: baseline maintenance cadence inferred from saved maintenance history and current date.
* `context`: seasonal guidance from recognized asset type and current season.

Quick Property Scan consumes the shared engine through the Quick Scan consumer.

The dashboard consumes the same engine through the portfolio dashboard consumer. It evaluates the properties currently visible on the dashboard and returns one specific highest-priority next action. Dashboard recommendations should prefer direct, record-specific wording over grouped summaries.

Property Review, Email Insights, and future intelligence features should consume the same engine rather than creating separate recommendation logic. The internal Property Audit consumer groups shared engine findings into review categories instead of adding separate review recommendation rules.

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
* After equipment creation
* Dashboard review
* Property review

Quick Property Scan is designed to be run regularly.

Quick Scan prioritizes maintenance execution and record usefulness.

Quick Scan should surface a varied shortlist rather than grouping repeated
findings into broad themes.

Quick Scan titles should be specific, direct, and encouraging. Exact affected
counts and full affected system lists belong in Property Review, not the daily
Quick Scan surface.

Quick Scan should be plan-aware.

Quick Scan wording should sound like guidance from an experienced property manager.

Prefer:

```text
Add a recurring reminder for Water Heater.
```

```text
Record first maintenance note for Smoke Detector.
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

Quick Scan should act like a small, varied daily to-do list. It should avoid
showing several copies of the same issue type when other useful categories are
available.

Quick Scan should remain part of Maintley Intelligence on every plan. The plan
boundary is depth, not brand access. Free users receive the first layer of
Maintley Intelligence powered by Home Memory / Property Memory. Paid users can
receive recommendations informed by Maintley Knowledge, saved history, seasonal
context, and maintenance patterns.

Selection guidance:

* Show 3-5 high-value recommendations.
* Prefer up to 3 property-memory items such as missing install date, missing make/model, missing history, overdue task, or missing recurring task.
* Prefer up to 2 expanded intelligence items from Maintley Knowledge, property history, or seasonal/context guidance when the user's plan can access them.
* Prefer different rule types before repeating the same rule.
* Prefer different assets before repeating the same asset.
* Allow important safety or overdue work to win priority, but still keep the visible list varied when possible.

Free users should see record-focused recommendations they can act on, such as:

* Add install dates
* Add make or model information
* Upload warranty information
* Record first maintenance history
* Complete property profile information

Free users should not see locked recurring-maintenance recommendations as deficiencies.

When locked Homeowner+ guidance is relevant, Quick Scan may show one clearly labeled preview after the user chooses to reveal more results. It should be framed as available guidance rather than a problem the user failed to fix, and it must not count as a recommendation or immediate action.

Quick Scan may show a short progress dialog while it is running. The dialog should use familiar Maintley loading treatment and close once the latest snapshot is ready.

Detailed affected system or task lists should open in a dialog from the recommendation. This keeps the property-level Insights tab focused while still giving users a clear path into the affected records.

High-priority examples:

* Maintley could not find a recurring maintenance schedule for a system
* Maintley's records show overdue maintenance tasks
* The property contains no systems
* Maintley's records do not show smoke or carbon monoxide detector maintenance history

Medium-priority examples:

* No install date has been recorded for a system
* A major equipment could be easier to identify later in Maintley's records with make or model details
* Maintenance history has not been started for several systems
* Maintley's records do not show a contractor for serviced equipment
* No warranty expiration has been recorded

Varied Quick Scan examples:

* Add install date for Water Heater.
* Record first maintenance note for Smoke Detector.
* Add make or model for Refrigerator.
* Add filter size for Furnace.
* Create recurring reminder for HVAC.

Quick Scan excludes audit-style completeness items such as:

* Missing photos
* Missing manuals
* Missing receipts
* Missing serial numbers
* Missing warranty documents
* Missing notes
* Cosmetic record completeness issues

Those items belong in Full Property Review, where a user has explicitly asked for a broader review.

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
* Systems missing useful knowledge-pack details, such as HVAC or refrigerator filter size
* Systems missing install date
* Systems with no maintenance history
* Systems with no linked recurring task
* Open overdue tasks

The engine may generate more findings than the user sees. Quick Scan filters,
diversifies, and limits them so the visible experience stays focused on the
highest-value next actions without feeling like a full review.

The visible Property Scan message should be:

```text
Maintley reviewed what it knows about your property and found a few things worth your attention.
```

Property Scan should not be marketed or described as:

```text
AI scanned your house.
```

Repeated system-level findings should not be grouped into broad theme cards in
Quick Scan. The Quick Scan consumer should choose a representative, varied set of
individual recommendations. Full Property Review remains the place to see every
related item grouped by asset.

Each visible recommendation should include a short explanation of why the action matters. For example, install dates help track equipment age, warranty coverage, and future replacement planning.

Visible Quick Scan recommendation cards should help users understand:

* What Maintley found
* Why the finding matters
* What future maintenance headache the next step may help avoid
* Which action the user can take next

The property-level Insights tab is a small Maintley Intelligence workspace with:

* Overview
* History

Overview shows separate collapsed Maintley Intelligence cards for Quick Scan and Property Review, current recommendations, future scan entry points, and help for how each review works.

History shows saved scan snapshots for the property.

In v1, the latest visible scan result is saved as a backend-derived snapshot so the property-level Insights tab can show the latest scan whenever the user returns.

Each completed Quick Scan is also saved as a backend history snapshot. The History view displays those saved snapshots as read-only records.

Scan snapshots are derived records. They preserve what Maintley Intelligence showed at scan time, but they do not replace the source records used to generate recommendations. Historical scan details should not update when current property data changes.

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

## Level 2: Full Property Review

Customer question:

> How complete and maintainable are my property records?

Purpose:

Provide a comprehensive review of property record completeness, maintenance coverage, documentation, and lifecycle readiness.

Availability:

Preview on Free. Full review on Homeowner+ and higher plans.

Expected time:

30-60 seconds.

Full Property Review is the customer-facing Maintley Intelligence experience backed by the shared engine and the internal Property Audit consumer.

It is not a larger Quick Scan.

It should evaluate the property across categories and present completeness-oriented results by asset.

Quick Scan is priority-oriented:

> What should I pay attention to?

Property Review is completeness-oriented:

> How complete and useful is this property record?

The primary Property Review experience should be organized around assets rather than a flat recommendation list. Categories remain available for browsing and summary counts, but the detailed review should help users inspect each system or equipment in one place.

Expanded asset reviews should group findings by audit area so users can improve one kind of memory at a time.

It appears as a separate collapsed card below Quick Scan in the property Insights Overview. It may persist the latest review snapshot separately from Quick Scan so users can return to a larger review without rerunning it. The latest Property Review may be overwritten by the next Property Review for the same property. Review history is not stored in the current phase.

It may generate a larger set of findings across:

* Documentation
* Equipment Records
* Maintenance Coverage
* Lifecycle Planning
* Property Completeness

Example review categories:

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

Example asset review:

```text
Water Heater

Maintenance Coverage
- Missing recurring maintenance
- Missing maintenance history

Equipment Records
- Missing install date
- Missing serial number

Documentation
- Missing warranty
```

Property Review may present category completeness and asset progress instead of only listing findings.

Progress percentages should not be shown until Knowledge Pack checklist scoring provides a trustworthy denominator. Until then, Property Review should show open opportunity counts by asset and category.

Example:

```text
Water Heater

7 of 10 review items complete

Equipment Records     4/5
Maintenance Coverage  1/3
Documentation         1/2
Lifecycle             1/1
```

Because the user explicitly requests a review, a larger set of findings is appropriate in this surface. The review should still group findings clearly so users can move from summary to asset detail without feeling buried.

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

Maintenance Profile intelligence may compare related Maintenance Events with the
active maintenance schedule. If saved history suggests the next reminder date no
longer aligns with the schedule, Maintley should explain the related service
record, expected reminder date, current reminder date, and drift without
silently changing user data.

---

## Product Hierarchy

Maintley Intelligence should support a natural product progression:

Free:

> Here is what to do next from my Home Memory / Property Memory.

Paid Review:

> Here is everything that is missing or incomplete.

Premium Intelligence:

> Here is what your data means.

This progression should prevent Full Property Review from feeling like "Quick Scan with 50 more recommendations."

Quick Scan should stay fast and action-oriented.

Full Property Review should feel like a comprehensive asset review.

Ongoing Property Intelligence should feel like guidance that becomes smarter as Maintley records improve.

---

## Portfolio Scan

Purpose:

Review multiple properties.

Examples:

* Properties with no maintenance history
* Properties with no equipment
* Properties with missing critical information
* Properties missing recurring maintenance

Portfolio Scan should aggregate property-level recommendations rather than create independent recommendation systems.

The dashboard's current Maintley Intelligence suggestion is a lightweight portfolio-style consumer, not a full Portfolio Scan. It chooses one visible property finding for quick action while leaving grouped portfolio review to future intelligence surfaces.

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

Suggested equipment metadata.

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
* Properties with no equipment
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
* Equipment Records
* Maintenance Events
* Task Records
* Parts & Supplies Records
* Documentation Records
* Equipment Profiles

Property Knowledge Acquisition may turn reviewed document suggestions into structured Property Memory. Maintley Intelligence consumes that accepted Property Memory; it should not parse raw uploaded documents directly.

Maintley Intelligence generates:

* Recommendations
* Observations
* Setup Opportunities
* Scan Results
* Insight Content

Recommendation generation rules are defined in:

RECOMMENDATION_ENGINE.md

Equipment-specific expectations are defined in:

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
