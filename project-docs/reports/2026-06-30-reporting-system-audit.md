# Reporting System Audit

Date: 2026-06-30

## Phase 1 Implementation Update

Date: 2026-06-30

Phase 1 was started after this audit and corrected the highest-risk report-page behavior in the existing client-side builder:

- Report access and export checks now use report-specific helpers that allow read-only/export access for expired users while preserving active-subscription checks for other feature gates.
- Report lock and export copy no longer describes standard CSV reporting as a Property/Portfolio upgrade.
- Maintenance Requests no longer infer records from task titles. The report uses actual maintenance request records from property/request state; if no reliable request records exist, the report returns no rows.
- Property Summary now counts maintenance records from scoped maintenance history instead of property-local `taskHistory`.
- Maintenance Costs and financial columns are hidden unless the current user has financial visibility.
- Team report access no longer grants access merely because a user has an `accountId`; it now requires team-management or broad page-view capability.

Remaining Phase 1-adjacent risk:

- Team member report access still depends on the current resolved user subscription being the owning account subscription. A server-side report data service remains the preferred long-term fix for account subscription, role, and property-scope enforcement.

## Phase 2 Implementation Update

Date: 2026-06-30

Phase 2 introduced a shared report data adapter layer for the existing client-side builder:

- Report definitions and availability filtering now live in `src/reporting/reportDataAdapters.ts` instead of being embedded in the report page.
- Account/property scoping for report datasets now uses a shared account-or-property filter.
- Task, appliance/system, contractor, unit, suite, maintenance history, maintenance request, property summary, portfolio overview, and team-efficiency rows are normalized through adapter helpers before preview/export.
- Appliance/system rows now normalize legacy/current field names such as `manufacturer`/`brand`, `installDate`/`installationDate`, and object-based locations.
- Maintenance request aggregation and Property Summary maintenance counts are covered by focused adapter tests.
- Report availability by capability, financial report visibility, and team-report capability behavior are covered by focused adapter tests.

Remaining Phase 2 risk:

- Client-side adapters improve consistency but are not an authoritative security boundary. Sensitive report generation should still move to a server-side report service before expanding financial, team, tenant, and portfolio reporting.

## Phase 3 Implementation Update

Date: 2026-06-30

Phase 3 added the missing high-value report templates that can be derived from data Maintley already loads into the report builder: Document Inventory, Warranty & Expiration, Recurring Maintenance Schedule, Appliance & System Service, Contractor Service & Spend, Resident Request Lifecycle, and Team Workload.

The new reports remain derived views and do not create new Firestore records. Financial spend reporting stays behind the existing financial visibility gate, resident request lifecycle reporting stays behind resident/tenant access, and team workload reporting stays behind team report access.

Remaining Phase 3 risk:

- Warranty dates are only as complete as the current structured warranty fields and warranty documents.
- Document Inventory is assembled from currently scoped property documents and related file fields. A future server-side report service should own this aggregation for stronger permission enforcement and broader attachment coverage.

## Phase 4 Implementation Update

Date: 2026-06-30

Phase 4 redesigned the existing report builder into a progressive reporting workflow:

- Users choose a report category before choosing a report template.
- Report templates now apply recommended columns by default.
- Custom column selection is collapsed behind a Customize columns control.
- Property, status, priority, and date scope controls appear only when relevant.
- Empty states now explain what records make each report useful.
- Desktop now keeps Preview and Export in the output column with the preview directly below it, avoiding the large empty gap caused by placing the preview below the full setup grid.
- The page title now uses "Reports" instead of "Reports & Analytics".

Remaining Phase 4 risk:

- The report builder is still a client-side CSV preview/export tool. Printable summaries and server-side report generation remain future work.

## Purpose

Audit Maintley's current report page for:

- Reports currently available.
- Reports missing based on data Maintley already captures.
- Subscription and role compliance.
- UI and mobile usability.
- Recommended improvement path.

This is a point-in-time report. Active product, architecture, permission, and UX documentation remain authoritative.

## Documents Reviewed

- `project-docs/docs/README.md`
- `project-docs/docs/Product/FEATURES.md`
- `project-docs/docs/Product/MAINTLEY_PLAN_FEATURE_MATRIX.md`
- `project-docs/docs/Architecture/DATA_MODEL.md`
- `project-docs/docs/Architecture/PERMISSIONS.md`
- `project-docs/docs/UX/UX_LANGUAGE_GUIDE.md`
- `project-docs/docs/UX/MOBILE_UX_GUIDE.md`

## Implementation Reviewed

- `src/pages/ReportPage/ReportPage.tsx`
- `src/Components/ReportBuilder/ReportBuilder.tsx`
- `src/Components/ReportBuilder/ReportPreview.tsx`
- `src/Components/ReportBuilder/reportPreviewUtils.ts`
- `src/Components/ReportBuilder/ReportBuilder.styles.tsx`
- `src/utils/csvExport.ts`
- `src/utils/subscriptionUtils.ts`
- `src/constants/subscriptions.ts`
- `src/Redux/selectors/permissionSelectors.ts`
- `src/Redux/API/taskSlice.tsx`
- `src/Redux/API/propertySlice.tsx`
- `src/Redux/API/deviceSlice.ts`
- `src/Redux/API/contractorSlice.tsx`
- `src/Redux/API/teamSlice.tsx`
- `src/Redux/API/tenantSlice.tsx`
- `src/Redux/API/userSlice.tsx`
- `firestore.rules`

## Executive Summary

Maintley's reporting system is a client-side export builder. It derives reports from existing Firestore-backed records and CSV utilities. That aligns with the documented data model because reports do not create a competing source of truth.

The current implementation offers broad export coverage for tasks, appliances, contractors, maintenance history, costs, properties, team members, tenant profiles, and portfolio summary metrics. It also includes basic mobile preview support.

The main gaps are:

1. Report access messaging is inconsistent with the plan matrix. The UI says reports require Property or Portfolio, but the documented matrix and subscription constants allow Data Export Builder and CSV export on all core plans, including Free/Homeowner.
2. Some report data sources are not using the best source of truth. Maintenance Requests are inferred from tasks, and Property Summary counts `prop.taskHistory` instead of canonical `maintenanceEvents`.
3. Role and property-scope compliance is uneven. Tasks and devices apply team member property scoping in their API queries, but contractors, units, team members, tenant profiles, and maintenance history rely on broader account reads plus local filtering or no team scope.
4. The UI exposes too much report configuration at once, especially on mobile. It works, but the workflow feels like a generic CSV tool rather than a homeowner-friendly report experience.
5. Maintley captures data that is not yet reportable: documents/files, warranties, recurring schedules, parts and supplies, property knowledge suggestions, scan snapshots, resident request lifecycle, and storage usage.

## Current Reports Available

The report builder currently defines these report types:

| Report | Current Source | Notes |
| --- | --- | --- |
| Task Report | `tasks` | Broad task export with status, assignment, due dates, notes, and financial fields. |
| Overdue Tasks | Derived from `tasks.dueDate` and non-completed status | Useful operational report, but should share task display-status logic to avoid status drift. |
| Upcoming Tasks | Derived from `tasks.dueDate` within 30 days | Useful, but fixed 30-day horizon is not configurable. |
| Maintenance Requests | Inferred from tasks where `type === 'maintenance'` or title contains "maintenance" | Weak source. Actual request data exists elsewhere in Redux/property flows. |
| Contractors | `contractors` | Directory-style export. Does not yet join contractor service/cost history. |
| Appliances | `devices` | Exports appliance/system metadata. Uses "Appliances" label in UI, which aligns with UX guidance better than "Devices". |
| Maintenance History | `maintenanceEvents` plus legacy `maintenanceHistory` through `useGetAllMaintenanceHistoryForUserQuery` | Good dual-read approach, but summary counts do not consistently use this data. |
| Property Summary | Derived from `properties`, `tasks`, inferred requests, and property-local history fields | Useful, but partially stale because it uses `prop.taskHistory`. |
| Suites | Embedded `property.suites` | Available only for commercial properties with suites. Suites are still exposed despite broader guidance to avoid unit-level complexity unless justified. |
| Units | Type and export function exist, but report option is commented out | Should remain hidden unless unit workflows are intentionally restored. |
| Tenant Profiles | `tenantProfiles` public profile query, then local filtering | Should use account/property-scoped tenant reads instead of public-profile query semantics. |
| Maintenance Costs | Derived from maintenance history financials | Good direction because Costs should derive from maintenance/task source records. Currently ignores active task estimates unless they become maintenance history. |
| Portfolio Overview | Derived KPI row from properties, tasks, maintenance history, and inferred requests | Portfolio-only. Very high level; request count inherits maintenance request source issue. |
| Team Members | `teamMembers` | Plan-gated to team access. Query returns account team records. |
| Employee Efficiency | Derived from team members and assigned tasks | Portfolio-gated. Assignment matching appears too narrow and may miss `assignedTo` object snapshots or email/name assignment patterns. |

Additional export utilities exist for `Property Share Report` and a generic older `Maintenance Report`, but they are not wired into the report UI.

## Missing Reports Based on Captured Data

These are high-value reports Maintley can generate from data already captured or documented.

### 1. Document Inventory Report

Source data:

- Property documents stored on property records.
- Appliance/system document links.
- Task completion files.
- Maintenance event attachments.

Why it matters:

Maintley positions documents as a core part of property records. Users should be able to export a list of manuals, warranties, receipts, invoices, inspection reports, and photos by property/system.

Recommended columns:

- Property
- Document name
- Document type
- Linked appliance/system
- Linked task
- Linked maintenance event
- Uploaded date
- Uploaded by
- Review/acquisition status

### 2. Warranty and Expiration Report

Source data:

- Device warranty fields.
- Warranty documents.
- Property Knowledge warranty suggestions.
- Maintenance event types such as `warranty_added`.

Why it matters:

Maintley captures warranty-related records but has no report focused on warranty timing. This is one of the most practical homeowner/business outputs.

Recommended columns:

- Property
- Appliance/System
- Warranty expiration
- Warranty document attached
- Install date
- Manufacturer
- Model
- Serial number
- Notes

### 3. Recurring Maintenance Schedule Report

Source data:

- Task recurrence fields.
- Due dates.
- Task reminder settings.
- Completed maintenance events linked to recurring tasks.

Why it matters:

Recurring maintenance is a paid automation feature. Users need to see what recurring care is active, next due, overdue, and recently completed.

Recommended columns:

- Property
- Task
- Appliance/System
- Recurrence
- Next due date
- Last completed
- Reminder status
- Assignee

### 4. Appliance/System Service Report

Source data:

- `devices`
- `maintenanceEvents`
- linked task/device IDs
- service items and parts/supplies

Why it matters:

The current Appliances report is mostly inventory. Maintley should also support a service-history view by appliance/system.

Recommended columns:

- Property
- Appliance/System
- Type
- Install date
- Last service date
- Service count
- Open tasks
- Upcoming tasks
- Warranty expiration
- Documents attached

### 5. Contractor Service and Spend Report

Source data:

- `contractors`
- tasks assigned to contractors
- maintenance events with contractor references
- financials

Why it matters:

The current Contractors report is a contact export. A more useful report would show who performed work, what they worked on, and spend over time.

Recommended columns:

- Contractor
- Property
- Service category
- Completed jobs
- Last service date
- Estimated cost
- Actual cost
- Linked maintenance records

### 6. Resident Request Lifecycle Report

Source data:

- Maintenance request records from property/request flows.
- Tenant profiles.
- Converted task IDs.

Why it matters:

The current Maintenance Requests report does not use the actual request source. Property and Portfolio plans include resident request workflows, so lifecycle reporting should be grounded in request data.

Recommended columns:

- Property
- Request title
- Submitted by
- Submitted date
- Status
- Converted task
- Time to conversion
- Priority
- Category

### 7. Property Record Completeness Export

Source data:

- Properties
- Devices
- Documents
- Maintenance events
- Property scan latest/snapshots
- Knowledge suggestions

Why it matters:

Maintley Intelligence should remain guidance, but users may need a factual export of what records exist and where obvious data is blank.

Recommended columns:

- Property
- Appliances/systems count
- Maintenance records count
- Documents count
- Open tasks
- Appliances missing install date
- Appliances missing model/serial
- Latest scan date

This should be framed as "Property Records" or "Record Summary", not a score.

### 8. Team Workload Report

Source data:

- Team members
- Tasks
- Maintenance events
- Property assignments

Why it matters:

Employee Efficiency is potentially sensitive and performance-coded. A calmer, more useful first report is workload: assigned open work, overdue work, completed work, and property scope.

Recommended columns:

- Team member
- Assigned properties
- Open tasks
- Overdue tasks
- Due next 30 days
- Completed this period

## Plan and Access Compliance Audit

### What Is Aligned

- Reports are derived from existing records and exported as CSV, which aligns with the plan matrix statement that data export is not a premium feature.
- Portfolio Overview is restricted with `canPortfolioReporting`.
- Team Members requires team access.
- Employee Efficiency requires advanced team access, which maps to Portfolio.
- Tenant Profiles requires tenant information access.
- Firestore rules protect most report source collections by `canReadAccount(accountId)`.

### Issues

#### 1. Upgrade copy conflicts with the plan matrix

The plan matrix says Data Export Builder, property filtering, date filtering, custom columns, and CSV export are available on Free, Homeowner+, Property, and Portfolio.

The report page locked-callout copy says users should "Upgrade to Property or Portfolio to generate and review reports." That is inconsistent with the documented plan model and subscription constants, where `homeowner` and `homeowner_plus` both have `canViewReports: true` and `canExportData: true`.

Impact:

- Confusing upgrade messaging.
- Risk of accidentally treating a core user-data export as premium.

Recommendation:

- Change locked copy to describe account/role/subscription-state restrictions only.
- Do not position standard CSV export as Property/Portfolio-only.

#### 2. Expired-user route access and in-page access disagree

The route allows expired users into `/report`, but `canViewReports` and `canExportData` require active subscription status. The page computes `canAccessReports` from `canViewReports`, so expired users can reach the route but see reports locked.

Impact:

- The route comment says expired users are allowed, but the page does not actually provide usable read-only/export behavior.

Recommendation:

- Decide policy: either expired users can export their data, or they cannot.
- If they can, align `canAccessReports` with `canAccessReadOnlyFeatures && canViewReports`.
- If they cannot, remove `allowExpiredUsers` from the route and update comments/tests.

#### 3. Team member report access uses the team member's own subscription

Team member special plans have `canViewReports: false`, but `ProtectedRoutes` allows team member accounts into `/report`. The report page then locks access because `canAccessReports` checks the team member profile subscription.

Impact:

- Team members may see the report page but cannot use reports even when their assigned account/role should allow reporting.

Recommendation:

- Resolve reporting capability from the owning account subscription plus team role, not the team member's special subscription placeholder.
- Add a report-specific role capability rather than relying on broad `canViewAllPages`.

#### 4. Role access is too broad for sensitive reports

`canAccessTeamReport` returns true for non-homeowner users when `canManageTeam || canViewPages || !!currentUser.accountId`. Because most account users have an `accountId`, this may grant Team Members report access more broadly than intended once `canAccessReports` is fixed.

Impact:

- Potential overexposure of team member contact details and performance metrics.

Recommendation:

- Replace this with explicit capability checks:
  - `canViewReports`
  - `canViewTeamReports`
  - `canViewFinancialReports`
  - `canViewTenantReports`
  - `canViewPortfolioReports`

#### 5. Property assignment scoping is inconsistent across datasets

Tasks and devices apply team member property scoping in their API query layer. Properties are scoped in `propertySlice`. Contractors and units do not apply the same team member property-scope filtering in their query functions. Tenant profiles are read through public-profile semantics and locally filtered.

Impact:

- Firestore account-level reads may permit data access that assigned-property users should not see.
- UI filtering is not an authoritative security boundary.

Recommendation:

- Move report data reads behind a server-side report query/export function or shared report data service that applies:
  - account membership,
  - assigned property IDs,
  - role capabilities,
  - plan feature availability,
  - report-specific field-level restrictions.

#### 6. Financial visibility is not role-gated

Task, Maintenance History, and Maintenance Costs reports expose financial columns. Accounting roles should see financials, but maintenance/contractor/tenant-style users should not necessarily see cost data.

Impact:

- Potential leakage of spend, estimates, labor costs, or contractor pricing.

Recommendation:

- Add financial report gating based on `canManageFinancials` or a new `canViewFinancialReports` capability.
- Hide financial columns and Maintenance Costs report when the user lacks financial visibility.

## Data Quality and Source-of-Truth Issues

### Maintenance Requests

The report currently infers maintenance requests from tasks:

```text
task.type === 'maintenance' OR task.title contains "maintenance"
```

This is not reliable and does not align with the resident request workflow. Request records exist in Redux/property flows and include fields such as requested by, submitted date, files, and conversion state.

Recommendation:

- Replace the inferred report with real request data.
- If requests are not persisted in a queryable account-scoped collection yet, do that first before promoting request reporting.

### Property Summary

Property Summary uses `prop.taskHistory` for maintenance history count. The canonical source should be `maintenanceEvents`, with legacy `maintenanceHistory` only as compatibility.

Recommendation:

- Count records from `scopedMaintenanceHistory` by property ID.

### Employee Efficiency

Employee Efficiency matches tasks with:

```text
task.assignedTo === member.id
```

Task assignment can also be an object snapshot or use `assignee`, email, or name fields.

Recommendation:

- Reuse a shared task-assignment matching helper.
- Prefer "Team Workload" before performance language.

### Appliance Report

The report uses column names from older fields like `brand` and `installationDate`. Current device model uses fields such as manufacturer/installDate in some paths.

Recommendation:

- Normalize appliance report rows before preview/export so legacy and current field names both work.

## UI and Mobile UX Audit

### Strengths

- The page provides a single place for report selection, filtering, column selection, preview, and CSV export.
- Mobile users get card-based report selection and card-based preview rows instead of a wide table.
- "Hide empty columns" is a useful practical feature.
- Locked reports are discoverable, which helps users understand what exists.

### Issues

1. The page feels like a generic CSV builder rather than Maintley-specific reporting.
2. The first decision is "Report Type", followed by a large set of choices. On mobile this becomes a long card list.
3. Column selection is too dense. Users must understand database-like fields before they see value.
4. Date filters exist in state but are not exposed for most reports.
5. The title "Reports & Analytics" overpromises. Most outputs are exports, not analytics.
6. Report labels mix concepts: "Appliances" but not "Appliances & Systems"; "Employee Efficiency" is performance-coded; "Maintenance Costs" may imply accounting depth.
7. Empty states do not guide the user toward the record type that would make the report useful.
8. CSV is the only output. There is no printable summary or homeowner-friendly on-screen report.
9. The report picker and column picker are separate but simultaneous. Mobile users must scroll through setup before previewing.

### Recommended UI Direction

Use a progressive report workflow:

1. Choose report category:
   - Tasks
   - Maintenance History
   - Appliances & Systems
   - Documents
   - Contractors
   - People
   - Portfolio
2. Choose a specific report template.
3. Choose property/date scope.
4. Preview with recommended columns selected by default.
5. Let advanced users customize columns.
6. Export CSV.

Default each report to a practical column set. Make custom columns an advanced section.

Rename:

- "Reports & Analytics" -> "Reports"
- "Appliances" -> "Appliances & Systems"
- "Employee Efficiency" -> "Team Workload" unless true performance reporting is intentional.
- "Maintenance Costs" -> "Maintenance Costs" only for roles with financial visibility.

## Recommended Implementation Phases

### Phase 1: Correctness and Compliance

- Align report access messaging with the plan matrix.
- Resolve expired-user route/page behavior.
- Replace maintenance request inference with real request data or hide the report until source data is reliable.
- Fix Property Summary to count canonical maintenance records.
- Add financial column/report visibility checks.
- Add explicit report capability helpers.

### Phase 2: Data Source Consolidation

- Create a shared report data adapter layer.
- Normalize field names for tasks, appliances/systems, contractors, maintenance events, and properties.
- Apply property assignment scoping consistently.
- Add tests for report availability by plan and role.

### Phase 3: Missing High-Value Reports

- Document Inventory.
- Warranty and Expiration.
- Recurring Maintenance Schedule.
- Appliance/System Service.
- Contractor Service and Spend.
- Resident Request Lifecycle.
- Team Workload.

### Phase 4: UI Redesign

- Move to report categories/templates.
- Add recommended columns by default.
- Collapse advanced column controls.
- Add date range filters where appropriate.
- Improve mobile flow with one decision per step.
- Add report-specific empty states.

## Preferred Architecture

Short term:

- Keep reports as derived views.
- Keep CSV export client-side for simple reports.
- Fix source and gating issues in the existing builder.

Medium term:

- Introduce a report data service or report adapter module that owns report definitions, row normalization, default columns, plan gates, role gates, and filter support.

Long term:

- For sensitive or complex reports, use Cloud Functions to generate scoped report data server-side. This is especially important for financial, team, tenant, and portfolio reports because UI filtering is not an authoritative permission boundary.

Reports should remain derived from:

- Properties
- Tasks
- Appliances & Systems
- Maintenance Events
- Contractors
- Documents
- Tenant/Team records

Reports should not become a separate source of truth.

## Priority Findings

1. High: Maintenance Requests report uses task-title inference instead of request records.
2. High: Financial report columns are not role-gated.
3. High: Team member/report access needs account-owner subscription plus explicit role capability, not the team member placeholder subscription.
4. Medium: Expired-user route access and page access disagree.
5. Medium: Property Summary uses non-canonical history count.
6. Medium: Data source scoping is inconsistent across report datasets.
7. Medium: Missing document, warranty, recurrence, and appliance service reports despite captured data.
8. Low: UI copy and layout make reporting feel more technical than necessary.

## Conclusion

Maintley's reporting foundation is useful and directionally aligned with the data model: reports are derived exports, not duplicated data. The next work should focus on trust before expansion: source-of-truth fixes, consistent plan/role gates, property-scope enforcement, and clearer report templates. Once those are corrected, Maintley has enough captured data to support several high-value reports without introducing a new reporting data model.
