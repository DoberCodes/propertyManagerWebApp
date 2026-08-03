# ADR 0038: Intent-Driven Product Analytics and Behavioral Telemetry

Status: Accepted - initial implementation

Date: 2026-08-03

## Context

Maintley needs to understand where people discover value, where setup becomes
difficult, and which product behaviors support continued use. Existing analytics
mostly recorded successful outcomes. That created two problems:

* Setup automation could look like intentional customer engagement.
* The team could see that an outcome happened without seeing where users became
  blocked or abandoned a workflow.

Maintley also handles sensitive property information. Property addresses,
equipment identifiers, maintenance notes, uploaded documents, and other
customer-entered content must not become analytics payloads.

## Decision

Google Analytics 4 is the quantitative product-learning system. Maintley records
a small, documented event contract centered on intentional decisions and
successful outcomes rather than arbitrary clicks.

Events that can be produced by more than one workflow include an
`action_source` with one of these controlled values:

* `user`
* `setup_assistant`
* `system`
* `import`
* `ai_suggestion`

Self-directed activation is derived from successful events whose
`action_source` is `user`. It is not stored as duplicate Firestore state during
the initial implementation.

The analytics runtime enforces an event-specific parameter allowlist. Event
parameters may contain controlled categories, counts, and booleans. They must
not contain customer-entered text or direct record identifiers.

Authenticated activity may use Firebase Authentication UID through GA4 User-ID
to connect the same account's activity across sessions. The UID is opaque and
must not be registered as a custom dimension or included as an event parameter.
Role and plan are reduced to broad `role_family` and `plan_family` user
properties.

Validation failures and visible workflow errors use controlled reason and error
codes. Raw exception messages are never sent to analytics.

## Behavioral Session Replay

Microsoft Clarity is approved in principle as a qualitative diagnostic tool,
but activation is deferred until its production configuration meets all of the
following requirements:

* consent behavior is implemented and documented;
* a production-specific project is used;
* authenticated application pages use strict masking;
* document, billing, profile, and administration surfaces are excluded during
  the initial rollout;
* Beta data is disabled or isolated from production; and
* URLs and custom tags do not contain customer record identifiers.

Session replay is supplementary evidence. It does not replace GA4 funnels or
the event contract.

## Measurement Principles

* Measure actions that represent a deliberate customer choice.
* Distinguish assisted creation from self-directed creation.
* Prefer derived funnels and cohorts over duplicated milestone records.
* Record abandonment by comparing workflow starts with completions.
* Use controlled error categories to locate friction without collecting content.
* Add a new event only when it answers a named product question.

## Consequences

### Positive

* Setup completion and abandonment become measurable.
* Automated onboarding no longer inflates engagement.
* Self-directed product value can be compared across acquisition cohorts.
* Event parameters have a testable privacy boundary.
* Path and funnel reports use stable event meanings.

### Negative

* GA4 explorations and custom definitions require manual configuration.
* User-ID changes how authenticated sessions are analyzed and requires ongoing
  privacy review.
* Strict parameter control limits ad hoc investigation.
* Session replay requires a separate consent and masking phase.

## Deferred

This decision does not initially introduce:

* arbitrary click or DOM-event tracking;
* heatmaps or session recording on authenticated pages;
* persistent `first_value_at` fields in Firestore;
* experimentation or feature-flag assignment analytics; or
* customer-entered text in telemetry.

The current event definitions and reporting handoff are maintained in
`docs/Product/ANALYTICS_MEASUREMENT_PLAN.md`.
