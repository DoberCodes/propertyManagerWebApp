# Roadmap Status

Last reviewed: 2026-08-02

## Purpose

This document is the active status source for Maintley's near-term roadmap.

It answers:

> What is current, what is next, what is deferred, and what needs a decision?

Product direction, feature behavior, data models, and architectural decisions
remain documented in their owning documents. This file summarizes status so
roadmap progress does not need to be inferred from ADRs, reports, and scattered
implementation notes.

## Current Direction

Maintley preserves and connects a property's operational knowledge:

```text
Property Memory
    -> Maintenance Events
    -> Maintley Intelligence
    -> User Action
```

Near-term work should strengthen the existing platform through migration
evidence, compatibility retirement, deployment validation, and documentation
accuracy. New workflows should remain deferred until the current release and
data boundaries are stable.

## Now

### Compatibility Boundary Completion

Status: Active cleanup

Sources:

* `project-docs/ADR/0022-account-access-resolver-contract.md`
* `project-docs/ADR/0023-property-documents-as-first-class-records.md`
* `project-docs/ADR/0024-maintenance-event-migration-completion.md`

Completed:

* Shared account access, Property Document, and Maintenance Event adapters own
  active compatibility reads.
* Build-time boundaries prevent new direct consumers from bypassing those
  adapters.
* Remaining property, maintenance, contractor, document, and user consumers
  have been consolidated behind the shared boundaries.

Remaining:

* Decide whether account access should normalize multiple membership roles or
  retain one effective role.
* Inventory production legacy account links, embedded documents, suggestions,
  and maintenance records.
* Retire fallbacks only after migration, parity, rollback, and deduplication
  evidence is approved.

### Firebase Hosting Migration Closure

Status: Production hosting active; final validation remains

Source:

* `project-docs/ADR/0028-firebase-hosting-and-browser-routing-migration.md`
* `project-docs/docs/Operations/DEPLOYMENT.md`

Completed:

* Separate Maintley Beta and production Firebase environments are established.
* Pull-request previews and stable Beta deployments use Firebase Hosting.
* Release-gated production builds deploy to Firebase Hosting.
* `maintleyapp.com` resolves to Firebase Hosting with TLS and clean browser
  routes.
* Function-generated links use canonical clean routes.

Remaining:

* Record production validation for authentication, Stripe returns, email links,
  deep links, PWA behavior, and rollback.
* Validate clean routes in signed Android builds and then remove the temporary
  Android `HashRouter` profile.
* Retire the frozen GitHub Pages guard after the observation period and complete
  the repository privacy decision.

### Entitlement Rollout Closure

Status: Active operational validation

Source:

* `project-docs/ADR/0032-centralized-entitlement-architecture.md`

Completed:

* The shared entitlement catalog and resolver own primary application and
  Function capability checks.
* Trials, complimentary grants, lifecycle communications, downgrade continuity,
  and administrative access management use the centralized model.
* Rule-relevant access is mirrored into trusted fields with emulator coverage.

Remaining:

* Complete deployed-web and signed-Android parity evidence.
* Migrate any approved synthetic Stripe access one account at a time.
* Remove compatibility adapters only after every supported client uses trusted
  entitlement paths.

## Next

### Controlled Data Migration Evidence

Status: Planning required before mutation

Goal:

Close the remaining Property Document and Maintenance Event compatibility
layers without losing historical records or provenance.

Required before implementation:

* production inventory review
* explicit backfill design approval
* dry-run and repeat-run evidence
* rollback and parity reporting
* duplicate and unresolved-record handling

### Maintley Resolution Engine Completion

Status: Accepted initial implementation

Source:

* `project-docs/ADR/0020-maintley-resolution-engine.md`

Current behavior:

The engine produces typed resolution plans and preserves resolution metadata,
while the UI continues using existing recommendation actions.

Remaining:

* Guided completion review
* Additional upload, scan, Knowledge review, contractor, and task-review paths
* Inline completion for simple Equipment details

### Storage Permission Follow-Through

Status: Accepted initial implementation

Source:

* `project-docs/ADR/0021-storage-write-permission-contract.md`

Remaining:

* Decide and implement a narrower maintenance-file upload predicate.
* Add role-level emulator coverage for the approved uploader role.

The current stricter Storage Rules remain authoritative until that work is
approved and deployed.

## Completed Foundations

### Property-first Experience

Status: Implemented

Properties remain the primary organizational level. Dormant Unit and Suite
management has been removed while narrow legacy read compatibility remains
behind documented boundaries.

### Maintenance Events

Status: Implemented foundation; migration compatibility remains

Maintenance Events are the canonical long-term maintenance record. ADR 0024
tracks the evidence required before legacy compatibility queries can be
removed.

### Maintley Intelligence and Property Review

Status: Implemented foundation

The shared Intelligence engine supports Quick Scan, dashboard guidance,
readiness, and the customer-facing Home or Property Review. Future consumers
must reuse the shared engine instead of creating separate recommendation logic.

### Connected Property Knowledge

Status: Implemented

Spaces, Equipment, Supplies, Documents, and Tasks are Property-owned records
connected through relationships. Spaces and Supplies are available through
their current Property experiences, and Documents can connect to multiple
records without changing ownership. Space cards and details now provide a
derived connected snapshot of Equipment, Tasks, Supplies, Documents, and recent
Maintenance History without duplicating those records.

### Homeowner Plans and Access

Status: Implemented

Homeowner+ multi-property access, trials, lifecycle communication, downgrade
continuity, and centralized grants are available through the current plan and
entitlement model.

### Personal Assistant Read API

Status: Implemented owner-only first phase

The read-only API and Maintley-role-gated token management support the private
owner integration described by ADR 0034. Broader third-party or write access is
not part of the current phase.

## Later

### Structured Work Sessions

Status: Proposed

ADR 0037 remains intentionally deferred. Tasks continue to use the existing
completion workflow until guided, resumable execution is separately approved.

### Professional Contribution and Business Stewardship

Status: Proposed

ADRs 0026 and 0027 describe future ownership transfer, professional
contribution, attribution, and Organization concepts. They are architectural
intent, not current production behavior.

### Ongoing Maintley Intelligence and Intelligence Center

Status: Roadmap

Seasonal guidance, cost trends, lifecycle forecasts, warranty timing, and a
dedicated Intelligence destination remain future capabilities. They should not
be presented as current plan entitlements until concrete product surfaces are
implemented.

### Server-side Report Generation

Status: Deferred pending sensitivity and scale needs

Current reporting remains client-side and export-oriented. Server-side
generation should be reconsidered for sensitive, portfolio-wide, or materially
larger reports.

## Open Decisions

1. Should account access normalize multiple membership roles or retain one
   effective role?
2. When should the controlled Property Document and Maintenance Event
   inventories and backfills begin?
3. When has the Firebase Hosting observation period produced enough evidence to
   remove the Android hash-routing profile and frozen Pages guard?
4. Which maintenance-scoped role, if any, should upload maintenance files
   without receiving broader document-management permission?
5. When should the remaining Resolution Engine UX move from typed plans to
   guided completion?

## Maintenance Process

Update this document when:

* a roadmap item moves between Now, Next, Later, Completed, or Deferred
* a customer-facing plan promise changes
* an ADR changes the expected product direction
* a report identifies roadmap drift that becomes active work
* implementation completes a roadmap item

Reports should remain point-in-time analysis. This document should remain the
active status summary.
