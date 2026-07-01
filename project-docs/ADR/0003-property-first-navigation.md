# ADR 0003: Property-First Navigation

Status: Implemented
Date: 2026-06-12
Accepted: 2026-06-12
Decision Source: Manual

## Context

The clearest mental model for Maintley is property-first. Users understand properties as the main place where tasks, appliances/systems, tenants, contractors, records, and history belong.

Advanced structures can make the product harder to understand before the core loop is strong.

## Decision

Maintain property-first navigation and information architecture.

Properties should remain the primary organizing object. Related pages should support the property -> appliances/systems -> tasks -> maintenance history loop.

## Consequences

- Avoid introducing navigation that makes units, suites, or abstract operational structures feel primary.
- Dashboards and empty states should guide users back into the core property maintenance loop.
- Detail pages should make related tasks, appliances/systems, and history easy to find.
