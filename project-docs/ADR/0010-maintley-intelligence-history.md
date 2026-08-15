# ADR 0010: Maintley Intelligence History

Status: Implemented

## Context

Maintley Intelligence currently produces recommendations based on a property's recorded information.

As additional scan types are introduced (Quick Scan, Property Audit, Portfolio Scan), users need a way to review previous intelligence results without mixing them with the property's maintenance history.

Maintenance History answers:

What happened to the property?

Intelligence History answers:

What did Maintley understand about the property at this point in time?

These represent different concepts and should remain separate.

## Decision

Maintley Intelligence will include its own history.

The property page will contain an Insights tab.

The Insights workspace will contain two secondary tabs:

Overview | History

Overview displays:

Current scan results
Current recommendations
Future scan entry points

History displays:

Previous scan snapshots
Read-only scan details
Future scan comparison

Each scan is stored as an immutable snapshot representing what Maintley Intelligence understood at the time it was generated.

Historical scans should not change as property data changes.

## Rationale

Separating Intelligence History from Maintenance History allows users to understand both:

What happened to the property.
How Maintley's understanding evolved over time.

This supports future features such as:

Property Audit
Portfolio Scan
Recommendation comparison
Progress tracking
Intelligence reporting
## Consequences

Benefits:

Scalable Intelligence workspace
Room for multiple scan types
Clear separation of maintenance events and intelligence
Supports future comparison and reporting

Tradeoffs:

Requires scan snapshot persistence.
Introduces secondary navigation within Insights.
