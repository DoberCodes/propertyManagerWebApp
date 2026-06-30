ADR: Maintley Event Engine
Status

Proposed

Context

Maintley now contains multiple long-running workflows that produce meaningful milestones.

Examples include:

Property Knowledge Acquisition
Quick Scans
Property Audits
Support Tickets
Future PDF Processing
Future Weather Processing
Future Background Jobs

These workflows currently generate notifications, intelligence history, and status updates independently.

Maintley requires a consistent event model that allows one workflow to inform multiple user experiences without duplicating logic.

Decision

Maintley will introduce a centralized Event Engine.

The Event Engine records meaningful application events and allows multiple consumers to react to them.

Workflow

↓

Maintley Event

↓

Consumers

Consumers may include:

In-App Notifications
Push Notifications
Email Notifications
Intelligence History
Activity Feeds
Dashboard Updates
Future Automation
Principles
Events represent milestones.

Events should describe meaningful changes in application state.

Examples:

Document Review Started
Suggested Details Ready
Knowledge Imported
Quick Scan Completed
Property Audit Completed
Ticket Closed

Events should not represent every internal processing step.

Events are platform-independent.

An event exists independently of how users are notified.

The Event Engine should never know whether an event becomes:

push notification
email
in-app notification
history entry

Those decisions belong to consumers.

One event, many consumers.

Example:

Knowledge Imported

↓

Push Notification

↓

Intelligence History

↓

Dashboard Activity

↓

Email Digest

Each consumer determines whether the event is relevant.

Consumers decide delivery.

Each consumer applies its own rules.

Examples:

Push

only actionable events

Email

digest or high-value events

History

permanent milestones

Dashboard

recent activity
Events have lifecycle.

Long-running workflows may update a single logical event rather than creating many unrelated ones.

Example:

Document Review

Processing

↓

Suggestions Ready

↓

Knowledge Imported

Platforms that support updating notifications may do so.

Platforms that do not may receive only the latest actionable milestone.

Initial Event Types

Knowledge

Document Review Started
Suggested Details Ready
Knowledge Imported

Intelligence

Quick Scan Completed
Property Audit Completed

Support

Ticket Received
Ticket Updated
Ticket Testing
Ticket Closed

Future

Seasonal Guidance Available
Weather Advisory
Warranty Expiring
Maintenance Reminder
Consequences

Benefits

Single source of truth for user-facing events.
Eliminates duplicated notification logic.
Enables future channels without changing workflows.
Supports notification aggregation.
Supports intelligence history.
Supports future activity feeds.

Tradeoffs

Introduces centralized event model.
Consumers must subscribe to events instead of generating notifications directly.
Future Considerations

Future consumers may include:

Web Push
Android Push
iOS Push
Email Digests
Property Activity Timeline
Team Activity Feed
Automation Rules
Calendar Integrations

Events should remain platform-independent regardless of future delivery mechanisms.