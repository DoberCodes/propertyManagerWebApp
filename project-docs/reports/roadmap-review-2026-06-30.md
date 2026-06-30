# Roadmap Review

Date: 2026-06-30

## Purpose

Review Maintley's current roadmap direction against implementation, recent ADRs,
and recent audit reports.

This report identifies:

* completed roadmap items
* areas where implementation has diverged from direction
* items that appear to have fallen through the cracks
* recommended next actions

This is a point-in-time report. Active product, architecture, UX, and ADR
documentation remain authoritative.

## Sources Reviewed

Primary documents:

* `project-docs/docs/Product/PRODUCT_DIRECTION.md`
* `project-docs/docs/Product/FEATURES.md`
* `project-docs/docs/Product/MAINTLEY_PLAN_FEATURE_MATRIX.md`
* `project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md`
* `project-docs/docs/Intelligence/RECOMMENDATION_ENGINE.md`
* `project-docs/docs/Architecture/DATA_MODEL.md`
* `project-docs/docs/Architecture/PERMISSIONS.md`
* `project-docs/docs/UX/UX_LANGUAGE_GUIDE.md`
* `project-docs/docs/UX/MOBILE_UX_GUIDE.md`

Decision records and reports:

* `project-docs/ADR/0001-remove-units-from-core-experience.md`
* `project-docs/ADR/0006-maintley-intelligence-architecture.md`
* `project-docs/ADR/0007-maintenance-events-as-historical-source-of-truth.md`
* `project-docs/ADR/0011-property-knowledge-acquisition.md`
* `project-docs/ADR/0013-frontend-asset-budget-and-bundle-optimization.md`
* `project-docs/ADR/0014-property-memory-change-review.md`
* `project-docs/ADR/0015-pdf-invoice-acquisition-v1.md`
* `project-docs/ADR/0017-personal-focus-dashboard.md`
* `project-docs/reports/dashboard-alignment-audit-2026-06-30.md`
* `project-docs/reports/2026-06-30-reporting-system-audit.md`
* `project-docs/reports/2026-06-29-design-token-and-legacy-ui-audit.md`

Implementation areas sampled:

* Dashboard
* Maintley Intelligence consumers
* Property Insights / Quick Scan
* Report Builder
* Property setup
* Unit/suite routing and tabs
* Pricing/landing messaging
* Firestore task permissions

## Executive Summary

Maintley's roadmap is broadly coherent and the recent implementation work has
moved the product closer to the documented direction.

The strongest alignment is around:

* property-first organization
* Maintenance Events as the long-term history model
* Maintley Intelligence as a shared recommendation engine
* Dashboard cleanup and personal dashboard scope
* report builder correctness and template expansion
* Property Knowledge Acquisition as reviewed Property Memory rather than raw
  AI-written data

The main roadmap risks are:

1. There is no single roadmap/status artifact. Direction is spread across
   product docs, ADRs, reports, and implementation notes.
2. Full Property Audit and Ongoing Maintley Intelligence are marketed or listed
   as plan features, but active intelligence docs still describe them as future
   experiences.
3. Unit/suite functionality remains intentionally hidden, but code and some
   report/form surfaces still expose or carry it.
4. Reporting has advanced quickly, but sensitive reporting is still client-side
   and has remaining implementation warnings.
5. Old `Home Health` language still exists in non-dashboard areas.
6. The dashboard roadmap phases are mostly complete, but "Action Center" remains
   a documented label rather than a clearly defined surface.
7. Recent Firestore task-permission changes need deployment and possibly a
   small follow-up audit for team-member write paths.

## Completed Or Mostly Completed

### 1. Dashboard Realignment

Status: Mostly completed.

Completed:

* Removed score/health framing from the Dashboard.
* Removed standalone seasonal dashboard guidance.
* Moved recent maintenance lower.
* Added role-aware Dashboard copy.
* Added user-level Dashboard scope preference:
  * `My Focus`
  * `All Visible`
* Added a dashboard Maintley Intelligence consumer under
  `src/intelligence/consumers/portfolioDashboard.ts`.
* Dashboard recommendation now returns one direct next action and includes
  property context.

Remaining:

* `Action Center` is still named in product/UX docs, but the app currently uses
  focus cards and queues rather than a formal Action Center surface.
* Dashboard recommendation click targets are still broad in some cases. For
  example, create-task guidance opens the task modal but does not always prefill
  property/system context.

Recommendation:

Define whether `Action Center` is just a product-language concept for the
Dashboard focus area or a future named component/route. If it is not a distinct
surface, remove or soften the label in docs.

### 2. Maintley Intelligence Foundation

Status: Strongly aligned.

Completed:

* Shared engine exists under `src/intelligence/`.
* Consumers exist for Quick Scan and Dashboard.
* Findings are structured, explainable, prioritized, plan-aware, and source
  typed.
* Recommendation logic is not embedded directly in the Dashboard.
* Quick Scan and Dashboard reuse the shared engine.

Remaining:

* Full Property Audit is still future.
* Ongoing Maintley Intelligence is still future.
* Portfolio Scan is not implemented beyond the lightweight dashboard consumer.
* Email Insights / Intelligence Center remain future concepts.

Recommendation:

Keep future intelligence work on the shared-engine path. Do not create a
separate audit engine or dashboard-only recommendation system.

### 3. Maintenance Events As Historical Source Of Truth

Status: Directionally aligned.

Completed:

* Active docs identify `maintenanceEvents` as canonical.
* Task completion creates Maintenance Events.
* Maintenance History screens use compatibility reads where needed.
* Reports increasingly count canonical maintenance records.

Remaining:

* Legacy `maintenanceHistory` compatibility still exists.
* Some UI and report logic still carries compatibility assumptions.

Recommendation:

Keep compatibility reads, but continue moving new behavior to
`maintenanceEvents`. Avoid adding new source-of-truth behavior to legacy
history fields.

### 4. Reporting Phases 1-4

Status: Partially completed, with residual risk.

Completed:

* Access messaging was corrected away from Property/Portfolio-only export copy.
* Maintenance request reporting moved away from task-title inference.
* Property Summary counts maintenance records from scoped history.
* Financial columns are gated.
* Shared report adapter layer exists.
* High-value report templates were added.
* Report builder UI moved toward category/template workflow.

Remaining:

* Build warnings remain in `ReportBuilder.tsx` around unused category/report
  state and hook dependencies.
* Reports are still client-side derived exports.
* Server-side report generation remains future.
* Sensitive team, tenant, financial, and portfolio reports still depend on
  client-side data assembly.

Recommendation:

Before expanding reports further, clean up the Report Builder warnings and then
decide whether server-side reporting is a near-term requirement or a later
hardening step.

### 5. Property Setup Assistant

Status: Implemented and directionally aligned.

Completed:

* Property Setup Assistant exists.
* It supports progressive setup.
* It creates system records and suggested maintenance.
* It appears within the property experience instead of acting only as onboarding.

Remaining:

* ADR 0005 still references future `Home Health` integration, which conflicts
  with the newer Maintley Intelligence language direction.

Recommendation:

Update ADR 0005 or add a note that `Home Health` has been superseded by
Maintley Intelligence / Property Records language.

## Divergence Or Drift

### 1. Full Property Audit Is Presented As A Plan Feature Before It Exists

Evidence:

* Product direction and intelligence docs describe Full Property Audit as
  future.
* The plan matrix lists Full Property Audit as included on paid plans.
* The landing pricing comparison lists Full Property Audit.
* Landing content mentions Property Audit as part of guidance examples.

Risk:

Users may expect a feature that is not implemented as a distinct experience.

Recommendation:

Either:

1. Mark Full Property Audit as `Planned` / `Coming later` in customer-facing
   surfaces until implemented.
2. Or prioritize a minimal paid Full Property Audit v1.

Preferred near-term path:

Update public/pricing copy so it does not imply the audit exists today.

### 2. Ongoing Maintley Intelligence Is Also Ahead Of Implementation

Evidence:

* Plan matrix lists Ongoing Property/ Maintley Intelligence as included on paid
  plans.
* Intelligence docs describe it as future scheduled/contextual guidance.

Risk:

Plan promises can outpace the actual product.

Recommendation:

Use "Maintley Intelligence recommendations" for current paid value. Reserve
`Ongoing Maintley Intelligence` for the scheduled/contextual product once it
exists.

### 3. Unit/Suite Direction Is Still Not Fully Contained

Evidence:

* ADR 0001 and product direction deprioritize units/suites.
* Unit and suite routes are commented out.
* Unit tab is commented out.
* Unit/suite pages, tabs, API paths, report logic, modal fields, and property
  forms still exist.
* Report Builder has unit/suite report definitions.

Risk:

Users and developers can still encounter unit/suite concepts even though the
roadmap says they are not core. This increases cognitive load and future
maintenance cost.

Recommendation:

Create a focused follow-up decision:

* Option A: keep unit/suite as legacy read-only support and hide all creation,
  reports, and navigation.
* Option B: intentionally relaunch unit/suite management as a property-manager
  feature.

Preferred near-term path:

Keep legacy fields/read support, but remove or hide active unit/suite report and
creation surfaces until the product decision is made.

### 4. `Home Health` Language Has Not Been Fully Removed

Evidence:

* Dashboard removed the score.
* UX guide replaces Home Health with Maintley Intelligence.
* `DataFetchContext.tsx` still says `Calculating your Home Health Score...`.
* ADR 0005 still references Home Health as future setup-assistant integration.

Risk:

Old language can reintroduce score/health framing through loading states or
future implementation work.

Recommendation:

Replace remaining runtime copy with Maintley Intelligence or property-record
language. Add an ADR 0005 update note rather than rewriting historical context.

### 5. Reporting UX Implementation And Build Warnings Are Out Of Sync

Evidence:

Recent builds compile but warn about unused Report Builder state such as:

* `setSelectedCategory`
* `showAdvancedColumns`
* `visibleCategoryReports`
* `selectedReport`
* `selectedReportCategory`
* `selectReport`
* a missing `useEffect` dependency

Risk:

This suggests recent UI refactoring has partially overlapping paths. It may be
working now, but the component is carrying unused or unstable state.

Recommendation:

Treat this as cleanup debt before adding more report features.

## Items That May Have Fallen Through The Cracks

### 1. Deployment Follow-Through For Task Permission Changes

Issue:

Maintenance Lead task assignment required Firestore rule changes and a client
update that backfills `accountId` onto older tasks.

Risk:

If rules and app code are not deployed together, Maintenance Leads may continue
to see permission failures.

Recommendation:

Deploy:

```text
firebase deploy --only firestore:rules
```

Also deploy the client build if older task records require the client-side
`accountId` backfill.

### 2. Dashboard Suggestion Action Context

Issue:

Dashboard Maintley Intelligence now names the property in a subline, but actions
such as `Create task` may still open a generic task modal.

Risk:

The user understands the suggestion but still has to manually choose the
property/system again.

Recommendation:

Prefill task creation from dashboard suggestions with:

* propertyId
* related system/device IDs
* title/category when safe

### 3. Full Property Audit Entitlement Copy

Issue:

Paid plan surfaces imply Full Property Audit exists.

Risk:

This is both a product-trust issue and roadmap prioritization issue.

Recommendation:

Either implement an audit v1 or update plan/pricing copy immediately.

### 4. Property Knowledge Acquisition Completion State

Issue:

Property Knowledge Acquisition and PDF Invoice Acquisition have ADRs and
implementation surfaces, but the roadmap does not currently summarize which
document types are fully supported, partially supported, or future.

Risk:

The product can drift into "document intelligence" promises without a clear
support matrix.

Recommendation:

Create a short document acquisition status matrix covering:

* PDFs/invoices
* manuals
* warranties
* receipts
* photos
* general documents

Columns should include: supported input, extracted fields, review required,
accepted Property Memory outputs, and current limitations.

### 5. Visual Standardization Roadmap Has Not Been Converted Into Work Items

Issue:

The design token audit identifies staged UI cleanup, but no active roadmap
artifact tracks completion.

Risk:

Visual cleanup will happen opportunistically and inconsistently.

Recommendation:

Promote the audit's staged plan into a tracked implementation checklist, starting
with:

1. Property Knowledge Review
2. Documents tab
3. Devices hub
4. Device detail
5. Property setup assistant

## Recommended Next Actions

### P0 - Product Promise Alignment

1. Update public/pricing/plan copy for Full Property Audit and Ongoing Maintley
   Intelligence so current plans do not overpromise future surfaces.
2. Remove remaining runtime `Home Health` wording.
3. Deploy task permission rule changes and matching client build.

### P1 - Close Active Implementation Gaps

1. Prefill Dashboard Maintley Intelligence actions with property/system context.
2. Clean up Report Builder warnings and unused state.
3. Decide unit/suite handling: hide fully as legacy support or relaunch
   intentionally.

### P2 - Roadmap Hygiene

1. Create a single active roadmap/status document.
2. Add a document acquisition support matrix.
3. Convert the design-token audit stages into an implementation checklist.

### P3 - Future Product Work

1. Define Full Property Audit v1 scope.
2. Define Ongoing Maintley Intelligence v1 scope.
3. Define whether an Intelligence Center is a near-term destination or future
   concept only.
4. Decide when reporting needs server-side generation.

## Suggested Active Roadmap Structure

Create:

```text
project-docs/docs/Product/ROADMAP_STATUS.md
```

Suggested sections:

* Now
* Next
* Later
* Completed
* Deferred
* Risks / Open Decisions

Each item should include:

* owner area
* status
* source ADR/report
* implementation link
* docs updated yes/no
* deploy/migration required yes/no

This would reduce the current need to infer roadmap status from several
separate documents.

## Bottom Line

Maintley has not lost the main thread. The platform is still moving toward:

```text
Properties
    -> Maintenance Events
    -> Maintley Intelligence
    -> User Action
```

The highest-risk drift is not architectural direction. It is roadmap hygiene and
customer-facing promise alignment. Full Property Audit, Ongoing Maintley
Intelligence, unit/suite handling, and report hardening need explicit status so
the product does not accidentally promise more than the implementation currently
supports.
