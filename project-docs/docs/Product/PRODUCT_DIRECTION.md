# Maintley Product Direction

Last reviewed: 2026-06

# Vision

Maintley helps people preserve, understand, and act on property knowledge over time.

Properties accumulate information across years and decades:

* Maintenance history
* Equipment information
* Service records
* Documentation
* Repairs
* Contractor knowledge
* Owner knowledge

Much of that information is lost when records are scattered across notebooks, emails, folders, spreadsheets, and memory.

Maintley exists to help homeowners, landlords, and property managers build a reliable record of their properties and use that information to make better maintenance decisions.

---

# Current Stage

Maintley has:

* A live production platform
* A paying customer
* Real user feedback
* Android support
* Active product iteration

The current challenge is not feature availability.

The current challenge is discoverability, usability, and clarity.

Users should be able to understand the core value of Maintley without training or extensive onboarding.

---

# Core Problem

Property information is fragmented.

People often know:

* What work was done
* Who performed it
* When it happened
* What equipment exists

until enough time passes.

Then knowledge is lost.

Maintley exists to preserve that information and make it useful.

The goal is not simply task management.

The goal is long-term property knowledge.

---

# Target Users

## Homeowners

Need:

* Maintenance tracking
* Appliance records
* Documentation storage
* Maintenance reminders

Usually focused on a single property.

---

## Property Owners

Need:

* Multi-property organization
* Maintenance visibility
* Contractor coordination
* Historical records

Usually responsible for multiple properties.

---

## Property Managers

Need:

* Team coordination
* Property assignments
* Maintenance operations
* Tenant communication

Usually responsible for portfolios.

---

# Product Principles

## Preserve Knowledge

Information should become more valuable over time.

Every completed task, uploaded document, maintenance event, and appliance record should improve the usefulness of the property record.

---

## Reduce Reliance on Memory

Users should not need to remember:

* Filter sizes
* Install dates
* Contractor names
* Warranty information
* Maintenance schedules

Maintley should preserve that information.

---

## Recommend, Don't Require

Users should never be blocked by missing information.

Maintley should recommend improvements rather than require them.

Examples:

* Add Filter Size
* Add Install Date
* Add Warranty Information

These should remain opportunities rather than requirements.

---

## Focus on Action

Users should be able to quickly answer:

* What needs attention?
* What was done?
* What equipment exists?
* What information is missing?

The product should support decisions and actions rather than data collection for its own sake.

---

## Keep Complexity Optional

Advanced workflows should remain available.

They should not dominate the experience for new users.

Most users should succeed without learning advanced concepts.

---

# Core Workflows

Maintley supports two primary workflows.

---

## Property Workflow

Answers:

> What is the story of this property?

Typical journey:

```text
Property
  ↓
Appliances & Systems
  ↓
Maintenance History
  ↓
Documentation
```

Property workflows focus on understanding and preserving information.

---

## Action Workflow

Answers:

> What needs my attention?

Typical journey:

```text
Dashboard
  ↓
Tasks
  ↓
Recommendations
  ↓
Completion
```

Action workflows focus on maintenance execution.

Both workflows are equally important.

---

# Product Architecture

Maintley is organized around three conceptual layers.

---

## Properties

The Organizational Layer

Properties are the primary organizing object within Maintley.

Properties own:

* Appliances & Systems
* Tasks
* Maintenance History
* Documentation
* Contractors
* Tenants

Properties provide context.

---

## Maintenance History

The Historical Layer

Maintenance History preserves:

* Completed work
* Repairs
* Inspections
* Service records
* Documentation

Maintenance Events are the long-term record of activity.

History should remain useful regardless of how the rest of the property evolves.

---

## Maintley Intelligence

The Recommendation Layer

Maintley Intelligence helps users improve records and identify opportunities.

Examples:

* Missing information
* Suggested maintenance
* Quick Scan observations
* Dashboard recommendations
* Property Insights

Maintley Intelligence should derive from records.

It should not become an independent source of truth.

---

# Current Priority

The immediate priority is strengthening the core experience.

Focus areas:

* Discoverability
* Navigation clarity
* Mobile usability
* Workflow simplicity
* Feature visibility

Users should be able to understand Maintley without tutorials.

---

# Dashboard Direction

The dashboard should answer:

> What needs my attention right now?

The dashboard should prioritize:

* Action Center
* Overdue tasks
* Upcoming work
* Maintley Intelligence recommendations
* Property selection

Avoid turning the dashboard into a reporting screen.

Reports belong elsewhere.

---

# Maintley Intelligence Direction

Maintley Intelligence is becoming a core Maintley capability.

Its purpose is to help users improve records and identify maintenance opportunities.

Current and future examples:

* Setup recommendations
* Suggested maintenance
* Quick Scan
* Dashboard recommendations
* Property Insights
* Portfolio scans

Maintley Intelligence should prioritize actionable opportunities rather than exhaustive audits.

Preferred:

```text
Top 3 Opportunities
```

Avoid:

```text
27 Missing Items
```

The goal is progress, not completeness.

---

# Property Setup Assistant Direction

The Property Setup Assistant should help users create useful records without overwhelming them.

The setup experience should remain lightweight.

Recommended flow:

1. Basics
2. Property Profile
3. Appliances & Systems
4. Suggested Maintenance
5. Access & Sharing
6. Review

The Setup Assistant should not become a required onboarding checklist.

---

## Ongoing Setup

Property setup should continue after onboarding.

The assistant should live within the property experience and support gradual improvement over time.

Examples:

* Kitchen
* Bathrooms
* Laundry
* Garage
* Exterior
* Utility Systems
* Safety
* Attic
* Basement

Supported responses:

* Present
* Not Present
* Unknown

Users should never be penalized for systems they do not have.

---

# Product Simplification

Maintley should prioritize clarity over feature breadth.

When forced to choose:

Prefer:

* Simpler workflows
* Better discoverability
* Better defaults
* Better navigation

Over:

* Additional complexity
* Advanced configuration
* Rare edge cases

---

# Current Strategic Decision

Units are temporarily deprioritized.

Units are not removed permanently.

However, they should not be part of the primary Maintley experience until the core property workflow is stronger.

Current recommendation:

```text
123 Main St - Apartment A
123 Main St - Apartment B
```

as separate properties.

This keeps the experience simpler while supporting real-world use cases.

---

# Feature Evaluation Framework

Future features should answer at least one of the following questions:

Does this help users:

* Understand a property?
* Maintain a property?
* Preserve knowledge?
* Improve decision making?
* Reduce reliance on memory?
* Complete maintenance more effectively?

Features that do not support these goals should be carefully evaluated before implementation.

---

# Long-Term Direction

Maintley should become the operational memory system for properties.

Over time the platform should help users:

* Understand their properties
* Preserve maintenance history
* Improve maintenance habits
* Reduce forgotten information
* Coordinate maintenance activities
* Make better property decisions

Tasks, documentation, maintenance history, recommendations, and Maintley Intelligence all exist to support this goal.

The long-term objective is not to create more data.

The objective is to make property knowledge useful over time.

---

# Success Criteria

The product is improving if users can:

* Understand the main workflow quickly.
* Find important features without help.
* Add information with minimal effort.
* Complete maintenance tasks easily.
* Understand how tasks become history.
* Understand why records matter.
* Improve their property records over time.
* Feel confident using Maintley without tutorials.

If users can do those things, Maintley is moving in the right direction.
