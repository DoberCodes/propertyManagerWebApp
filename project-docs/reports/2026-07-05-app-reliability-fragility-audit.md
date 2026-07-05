# App Reliability And Fragility Audit

Date: 2026-07-05

Status: Point-in-time report

## Purpose

This report reviews Maintley for implementation areas that are inconsistent,
duplicated, or likely to regress as the app continues to grow.

The goal is not to identify cosmetic cleanup. The goal is to find the places
where a future change could quietly break permissions, assignments,
notifications, task completion, document review, billing access, or Maintley
Intelligence behavior.

This report is not authoritative documentation. Active documentation remains in
`project-docs/docs`.

## Scope Reviewed

Reviewed areas:

- Account and property access resolution
- Task assignment and task lifecycle
- Maintenance Event and legacy maintenance history handling
- Contractor and family/team/person selection
- Property Knowledge Acquisition document workflows
- Maintley Intelligence scan and review flows
- Notification and Maintley Event delivery paths
- Subscription and checkout entitlement handling
- Local storage and cached client state
- Permission and feature gating patterns
- Test coverage around high-risk workflows
- Large mixed-responsibility files

Primary references:

- `project-docs/docs/README.md`
- `project-docs/docs/Architecture/DATA_MODEL.md`
- `project-docs/docs/Architecture/PERMISSIONS.md`
- `project-docs/docs/Architecture/TECHNICAL_ARCHITECTURE.md`
- `project-docs/docs/Development/CODE_ORGANIZATION_GUIDE.md`
- `project-docs/docs/Operations/TESTING.md`

## Executive Summary

Maintley is moving in the right architectural direction: account-scoped access,
property-centered organization, Maintenance Events as history, derived
Maintley Intelligence, and event-driven notifications.

The primary reliability risk is that several newer architecture decisions now
coexist with older compatibility paths. That is expected during migration, but
it becomes fragile when compatibility logic lives inside UI components, RTK
Query endpoints, and workflow modals instead of shared domain helpers.

The most important cleanup theme is:

```text
Move workflow rules out of pages and modals
    ↓
Put them behind small domain services/hooks
    ↓
Add regression tests to those services
    ↓
Delete one-off compatibility logic as each workflow migrates
```

## Priority Findings

### P0 - Paid Plan Entitlement Can Still Be Fragile

Area:

- `src/services/authService.ts`
- `src/pages/PaywallPage/PaywallPage.tsx`
- `functions/stripeFunctions.ts`

Current state:

- Signup now writes paid checkout users with Homeowner entitlement plus
  `pendingCheckoutPlan`, which is the right direction.
- Stripe webhooks and sync paths clear pending checkout fields after confirmed
  subscription state.
- Checkout and entitlement logic still spans frontend signup, paywall checkout,
  Stripe session creation, webhook handling, and sync functions.

Risk:

- This is a high-impact area because entitlement bugs can give access before
  payment or block paid users after payment.
- Any future change to plan naming, promo handling, trial scheduling, or
  checkout metadata could reintroduce the same class of bug.

Recommendation:

- Treat billing entitlement as server-owned.
- Add a dedicated "billing entitlement contract" test set that verifies:
  - paid signup writes Homeowner access until Stripe confirms payment,
  - unpaid canceled checkout never unlocks the requested paid plan,
  - verified Stripe checkout upgrades the plan,
  - webhook updates clear `pendingCheckoutPlan`,
  - frontend plan gates read effective entitlement, not requested checkout plan.
- Keep frontend checkout responsible for starting checkout and showing status,
  not deciding entitlement.

Suggested first cleanup:

- Create a small shared function or documented adapter named something like
  `getEffectiveEntitlementPlan(subscription)` and require UI gates to use it.

### P1 - Task Lifecycle Has Multiple Completion Paths

Area:

- `src/Redux/API/taskSlice.tsx`
- `src/Components/TaskCompletionModal/TaskCompletionModal.tsx`
- `src/Components/TaskApprovalModal/TaskApprovalModal.tsx`
- `src/Components/Library/Modal/TaskModal.tsx`
- `src/pages/PropertyDetailPage/TabSystem/TasksTab.tsx`
- `src/pages/TasksPage/TasksPage.tsx`

Current state:

- `updateTask` can transition a task to `Completed` and create a Maintenance
  Event.
- `submitTaskCompletion` creates a Maintenance Event, creates the next
  recurring task, and deletes the completed task.
- `approveTask` creates a Maintenance Event and deletes the task.
- UI components still pass completion fields in different shapes.

Risk:

- Duplicate Maintenance Events.
- Missed next recurring task creation.
- Completed tasks remaining active in one flow but disappearing in another.
- Costs landing on task financials instead of the Maintenance Event.
- Permission behavior drifting between direct task edit, completion dialog, and
  approval dialog.

Recommendation:

- Introduce one task lifecycle domain module that owns:
  - submit completion,
  - approve completion,
  - reject completion,
  - create Maintenance Event payload,
  - create next recurring task,
  - delete or archive the completed task.
- Keep RTK Query as data access/orchestration, not as the owner of lifecycle
  rules.

Suggested tests:

- Completing a normal task writes exactly one Maintenance Event.
- Completing a recurring task writes exactly one Maintenance Event and one next
  task.
- Approving a submitted completion does not duplicate a Maintenance Event.
- Completing with document attachments links the document once.
- Maintenance lead can complete/assign where rules allow; restricted roles
  cannot.

### P1 - Maintenance Events And Legacy Maintenance History Are Still Intermixed

Area:

- `src/Redux/API/maintenanceSlice.tsx`
- `src/Redux/API/taskSlice.tsx`
- `src/pages/PropertyDetailPage/TabSystem/MaintenanceTab.tsx`
- `src/reporting/reportDataAdapters.ts`
- `functions/adminPortal.ts`
- `functions/deletePropertyCascade.ts`
- `functions/deleteUserAccount.ts`

Current state:

- Active docs say `maintenanceEvents` is canonical.
- `maintenanceSlice` still dual-reads `maintenanceEvents` and
  `maintenanceHistory`.
- Some views still use the label `maintenanceHistoryRecords`.
- Delete and admin utilities still explicitly handle both collections.

Risk:

- New features may accidentally write to the legacy collection.
- Reports may double count if records are represented in both places.
- UI copy and API names reinforce the older mental model.
- Migration risk stays high because legacy compatibility is spread across many
  files.

Recommendation:

- Create a `maintenanceEventRepository` or `maintenanceEventAdapter` that owns
  all dual-read compatibility.
- Rename app-facing variables over time from `maintenanceHistoryRecords` to
  `maintenanceEvents` where they now contain canonical events.
- Keep legacy reads, but hide them behind one adapter.
- Add duplicate suppression based on source task, source document, invoice
  number, or original legacy id.

Suggested tests:

- One canonical event is returned when the same logical record exists in both
  collections.
- Property title fallback still finds old records.
- Costs tab does not duplicate completed task cost and event cost.

### P1 - Assignment Logic Is Improved But Still Needs Full Consolidation

Area:

- `src/tasks/taskAssignment.ts`
- `src/tasks/useTaskAssigneeOptions.ts`
- `src/Components/Library/Modal/TaskModal.tsx`
- `src/Components/Library/Modal/TaskAssignModal.tsx`
- `src/Components/Library/Modal/AddMaintenanceHistoryModal.tsx`
- `src/pages/MaintenanceHistoryGroup/MaintenanceHistoryGroupPage.tsx`
- `src/pages/PropertyDetailPage/TabSystem/MaintenanceTab.tsx`
- `src/utils/dataFilters.ts`

Current state:

- Task assignment now has a shared resolver and tests. That directly addresses
  the recent regression where eligible assignees disappeared.
- Other person-selection workflows still rebuild family/team/contractor option
  lists locally.
- `dataFilters.ts` still primarily reads `linkedProperties`, while active docs
  describe `assignedPropertyIds` as the preferred team assignment field.

Risk:

- Contractors, family members, or team members can appear in one task surface
  but not another.
- Maintenance History "Completed By" can diverge from task assignee behavior.
- Team member property assignment can break if one path writes
  `assignedPropertyIds` and another only reads `linkedProperties`.

Recommendation:

- Expand the new assignment resolver into a broader "people and service
  provider option resolver" used by:
  - task assignee fields,
  - task assignment modal,
  - maintenance record completed-by fields,
  - contractor selection in Property Knowledge review.
- Add one helper for team member property assignments that accepts
  `assignedPropertyIds`, `linkedProperties`, and `propertyIds`.
- Update docs or implementation so the preferred team assignment field is not
  ambiguous.

Suggested tests:

- Same property-scoped options are available in Dashboard, Tasks page, property
  task tab, mobile task edit, and maintenance record dialog.
- Maintenance lead assigned to four properties sees only eligible assignees for
  the current property.
- Contractor assigned to a property appears as an eligible task assignee.

### P1 - Document Upload And Knowledge Acquisition Are Repeated In Many Surfaces

Area:

- `src/propertyKnowledge/propertyDocumentUploads.ts`
- `functions/propertyKnowledgeAcquisition.ts`
- `src/Components/TaskDocumentsPanel/TaskDocumentsPanel.tsx`
- `src/Components/TaskCompletionModal/TaskCompletionModal.tsx`
- `src/Components/ApplianceDocumentsPanel/ApplianceDocumentsPanel.tsx`
- `src/Components/Library/Modal/TaskModal.tsx`
- `src/pages/DeviceDetailPage/DeviceDetailPage.tsx`
- `src/pages/DevicesHubPage/DevicesHubPage.tsx`
- `src/pages/PropertyDetailPage/TabSystem/DocumentsTab.tsx`
- `src/pages/PropertyDetailPage/TabSystem/DevicesTab.tsx`

Current state:

- The upload preparation helper exists, which is good.
- Each caller still merges `documents` and `knowledgeSuggestions` back into the
  property locally.
- `startPdfDocumentKnowledgeProcessing` is currently a no-op on the client,
  while backend triggers process documents marked `processing`.
- Status display and retry logic are local to document surfaces.

Risk:

- Duplicate upload sections can reappear.
- A document can be uploaded under one context but not linked or refreshed in
  another.
- The frontend may show stale `processing`, `pending_review`, or `failed`
  status after backend processing.
- Different upload flows may merge suggestions in a different order or lose a
  status update.

Recommendation:

- Create one document upload workflow adapter that:
  - uploads documents,
  - applies context metadata,
  - merges property document records,
  - merges knowledge suggestions,
  - exposes backend status refresh hooks,
  - emits Maintley Events only through backend-owned lifecycle events.
- Keep upload panels as UI shells over that adapter.

Suggested tests:

- Uploading a PDF from task, appliance, document tab, or completion dialog
  produces the same property document shape.
- Backend status change to `pending_review` updates UI after refetch.
- Failed acquisition displays the same retry affordance in all document
  surfaces.

### P1 - Notification Architecture Is Split Between Event Engine And Direct Writers

Area:

- `functions/maintleyEventEngine.ts`
- `src/services/maintleyEventService.ts`
- `src/Redux/API/notificationSlice.tsx`
- `src/Redux/API/taskSlice.tsx`
- `src/Redux/middleware/notificationMiddleware.ts`
- `src/pages/PropertyDetailPage/PropertyDetailPage.tsx`
- `src/Components/PropertiesTab/PropertiesTab.tsx`
- `functions/maintenanceEvents.ts`
- `functions/adminPortal.ts`

Current state:

- Maintley Event Engine exists and is aligned with the ADR direction.
- Event-backed notifications aggregate by workflow/entity key.
- Direct `createNotification` and direct Firestore notification writes still
  exist in older workflows.
- Legacy notification-create push delivery still exists for direct
  notification records.

Risk:

- Duplicate notifications.
- Push sent for non-actionable internal steps.
- Notification preferences enforced differently by client and backend.
- Ticket/document/scan workflows feel consistent while task/property workflows
  remain noisy.

Recommendation:

- Keep direct notification creation only for truly simple legacy cases.
- Migrate workflow notifications to event publishing in phases:
  1. task completion and approval,
  2. recurring task generation failure,
  3. property/team sharing,
  4. maintenance history changes.
- Add an eslint-style code review rule or documentation note: new workflows
  should publish Maintley Events, not directly create notifications.

Suggested tests:

- Publishing the same event key updates one notification.
- `document_review_started` does not send push.
- `suggested_details_ready`, `knowledge_imported`, `quick_scan_completed`, and
  support ticket status changes send expected in-app/push behavior.

### P1 - Account Scope And Client Cache Are Still High-Risk

Area:

- `src/Redux/API/accountContext.ts`
- `src/Redux/utils/clearAccountScopedClientState.ts`
- `src/utils/localStorageCleanup.ts`
- `src/App.tsx`
- `src/ProtectedRoutes.tsx`
- `src/Hooks/UserData.tsx`
- `src/Hooks/useFavorites.ts`
- `src/Hooks/useRecentlyViewed.ts`
- `src/Hooks/useRecentlyViewedTasks.ts`

Current state:

- There is a cleanup helper for account-scoped Redux state.
- Local storage cleanup clears common global keys and user-prefixed keys on
  sign-out.
- Some persisted values remain global, while others are user-prefixed.
- RTK Query endpoints still resolve account/user context independently.

Risk:

- Stale data can briefly appear when switching between users.
- Demo users may momentarily see the previous user's cached dashboard data.
- New local storage features may forget user scoping.

Recommendation:

- Standardize local storage through one `userScopedStorage` utility.
- Make global local storage keys opt-in and documented.
- Clear API cache on auth user change, not only sign-out.
- Add tests around user A to user B switching.

Suggested tests:

- Switching authenticated users clears RTK Query cached property/task data.
- Favorites/recently viewed are user-scoped.
- Dashboard does not render previous account data during auth hydration.

### P1 - Permission And Subscription Gates Are Scattered

Area:

- `src/utils/permissions.ts`
- `src/Redux/selectors/permissionSelectors.ts`
- `src/utils/subscriptionUtils.ts`
- `src/Redux/API/inviteCapabilities.ts`
- `src/pages/PropertyDetailPage/PropertyDetailPage.tsx`
- `src/pages/PropertyDetailPage/TabSystem/*.tsx`
- `src/Components/Library/Modal/TaskModal.tsx`
- `src/pages/TeamPage/TeamPage.tsx`

Current state:

- Permission docs clearly separate authentication, authorization, and
  subscription.
- Some UI surfaces compute role capabilities directly.
- Some API slices check plan capabilities again.
- Some tabs default permissions to true when props are missing.

Risk:

- UI shows an action that Firestore rules reject.
- A role gains a capability in one page but not another.
- Plan capability checks block or allow a feature inconsistently.

Recommendation:

- Create a small capability matrix facade for current user + account + property.
- Use it to feed page/tab permissions.
- Keep Firestore Rules and Cloud Functions authoritative.
- Avoid `permissions?.canX ?? true` defaults in write-capable surfaces.

Suggested tests:

- Maintenance lead can create and assign tasks on assigned properties.
- Maintenance can create tasks only where intended.
- Tenant/request roles cannot access owner workflows.
- Expired/past-due subscription behavior matches the documented read/write
  model.

### P2 - Contractor Field Names Are Not Fully Normalized

Area:

- `src/Redux/API/contractorSlice.tsx`
- `src/types/Contractor.types.ts`
- `src/Components/Library/Modal/AddMaintenanceHistoryModal.tsx`
- `src/pages/PropertyDetailPage/TabSystem/PropertyKnowledgeReviewPanel.tsx`
- `project-docs/docs/Architecture/DATA_MODEL.md`

Current state:

- Active docs list both `name` and `companyName`.
- Contractor slice creates and updates `company`.
- UI often renders `companyName || company || name`.
- Knowledge review can fill contractor website/portal-style fields.

Risk:

- Contractor labels can disappear in one UI but not another.
- Accepted document suggestions may update a field the contractor form does not
  display.
- Search/dedupe by contractor name may miss records.

Recommendation:

- Pick a canonical display helper: `getContractorDisplayName(contractor)`.
- Pick a canonical persisted company field and support legacy aliases in an
  adapter.
- Update docs to match the implementation or migrate implementation to the docs.

Suggested tests:

- Contractor created with only company name displays everywhere.
- Contractor imported from Property Knowledge Review displays in task assignee
  and maintenance completed-by fields.

### P2 - Maintley Intelligence Is Well Tested, But Resolution Workflows Need Contract Tests

Area:

- `src/intelligence/`
- `src/Components/PropertyIntelligence/PropertyScanPanel.tsx`
- `src/Components/PropertyIntelligence/PropertyAuditPanel.tsx`
- `src/intelligence/resolutionEngine.ts`
- `src/pages/PropertyDetailPage/TabSystem/InsightsTab.tsx`

Current state:

- Intelligence engine, Quick Scan, Property Audit, portfolio dashboard, and
  resolution engine have unit tests.
- UI resolution workflows now open more contextual flows, but the boundary
  between recommendation, resolution type, and dialog launch is newer.

Risk:

- A recommendation can resolve data but remain visible after refresh.
- A Quick Scan can keep suggesting the same issue after the source record was
  updated.
- A resolution action can open a page/dialog without enough context, forcing the
  user to remember what they were fixing.

Recommendation:

- Add tests for the closed loop:

```text
recommendation shown
    -> user resolves it
    -> source record updated
    -> recommendation disappears or next equivalent recommendation appears
```

- Make every recommendation expose a stable `resolutionType`, `sourceRecordId`,
  and completion predicate.

Suggested tests:

- Creating a recurring task from a dashboard recommendation removes that
  recommendation on next scan.
- Adding install date through resolution removes missing install date finding.
- Property Review asset cards group findings by asset and category.

### P2 - Data Fetching Is Direct And Repeated Across RTK Query Slices

Area:

- `src/Redux/API/propertySlice.tsx`
- `src/Redux/API/taskSlice.tsx`
- `src/Redux/API/contractorSlice.tsx`
- `src/Redux/API/deviceSlice.ts`
- `src/Redux/API/userSlice.tsx`
- `src/Redux/API/maintenanceSlice.tsx`

Current state:

- RTK Query endpoints directly call Firestore.
- Account/property access resolution is repeated in several slices.
- Some legacy shared-property helper blocks remain commented out after feature
  retirement.

Risk:

- Query behavior diverges by collection.
- Rules/performance bugs repeat across slices.
- Retired features remain mentally active because commented code stays in core
  endpoints.

Recommendation:

- Extract small repositories for account-scoped collection reads.
- Remove large commented legacy blocks once no longer needed.
- Use shared batching helpers for Firestore `in` queries.

Suggested tests:

- Each account-scoped endpoint returns only accessible account records.
- Team member property scoping behaves consistently for properties, tasks,
  contractors, devices, and maintenance events.

### P2 - Large Mixed-Responsibility Files Increase Regression Cost

Large files are not automatically bad, but several high-change files contain
UI, data mapping, permission checks, workflow orchestration, and side effects.

Largest candidates observed:

- `src/Components/PropertiesTab/PropertiesTab.tsx` - about 4,000 lines
- `src/pages/DeviceDetailPage/DeviceDetailPage.tsx` - about 3,100 lines
- `src/pages/PropertyDetailPage/TabSystem/PropertyKnowledgeReviewPanel.tsx` - about 3,100 lines
- `src/Components/Library/Modal/TaskModal.tsx` - about 2,600 lines
- `src/pages/TeamPage/TeamPage.tsx` - about 2,200 lines
- `src/Components/PropertySetupAssistant/PropertySetupAssistant.tsx` - about 2,000 lines
- `src/propertyKnowledge/propertyKnowledgeAcquisition.ts` - about 2,000 lines
- `src/Components/PropertyIntelligence/PropertyScanPanel.tsx` - about 1,900 lines
- `src/pages/DashboardTab/DashboardTab.tsx` - about 1,900 lines
- `src/Redux/API/propertySlice.tsx` - about 1,600 lines
- `src/pages/TasksPage/TasksPage.tsx` - about 1,500 lines
- `src/pages/PropertyDetailPage/TabSystem/MaintenanceTab.tsx` - about 1,500 lines

Risk:

- Small changes require editing files with many unrelated responsibilities.
- AI-assisted edits are more likely to miss nearby state interactions.
- Reviewers cannot easily see which behavior is being changed.

Recommendation:

- Do not split for line count alone.
- Extract when actively touching these files:
  - workflow hooks,
  - section components,
  - data mappers,
  - validation helpers,
  - permission/capability adapters.

Best first candidates:

- `TaskModal`: extract form state, validation, document upload, recurrence,
  notifications, and financials into hooks/sections.
- `PropertyKnowledgeReviewPanel`: extract grouping, contractor matching,
  maintenance event suggestion handling, and document status display.
- `PropertyScanPanel`: extract scan state persistence and notification/event
  publishing.

### P2 - Route Action Handling Is Spread Across Property Detail Flows

Area:

- `src/pages/PropertyDetailPage/PropertyDetailPage.tsx`
- `src/pages/PropertyDetailPage/TabSystem/TabSystem.tsx`
- `src/pages/PropertyDetailPage/TabSystem/InsightsTab.tsx`
- `src/intelligence/resolutionEngine.ts`

Current state:

- Resolution workflows and deep links are becoming more important.
- Some actions open tabs/pages, while newer flows need to open dialogs with
  context.

Risk:

- A recommendation sends the user to the correct page but loses the reason they
  came there.
- Direct links can break when tab names or modal trigger props change.

Recommendation:

- Introduce a property-level action router:

```text
property action URL/state
    -> tab selection
    -> modal/workflow launch
    -> context payload
```

- Use it for recommendation resolution, setup assistant, Quick Scan, Property
  Review, and document review actions.

Suggested tests:

- `completeRecommendation=missing_install_date` opens the right workflow with
  the target asset preloaded.
- Refreshing the property URL preserves the action context until completed or
  dismissed.

## Testing Gaps

Existing useful coverage:

- Account context tests
- Data filter tests
- Permission selector tests
- Task assignment resolver tests
- Maintley Intelligence engine tests
- Quick Scan and Property Audit consumer tests
- Resolution engine tests
- Property Knowledge Acquisition tests
- Reporting adapter tests
- Stripe service/auth tests
- Notification-related function tests are referenced in docs

High-value missing or incomplete coverage:

- TaskModal create/edit integration around assignment, recurrence, and document
  upload.
- TaskCompletionModal integration around file upload, linked documents, event
  creation, and recurring next task.
- TaskApprovalModal approval/rejection event behavior.
- AddMaintenanceHistoryModal completed-by option consistency.
- PropertyKnowledgeReviewPanel acceptance flow for contractor, warranty,
  invoice total, maintenance event, and property mismatch.
- Document upload status refresh after backend processing.
- Maintley Event migration coverage for old direct notification workflows.
- User switch/cache isolation.
- Permission matrix tests that compare UI capability and Firestore rule
  expectations.

Recommended regression suite additions:

1. Task assignment matrix
2. Task lifecycle matrix
3. Document acquisition lifecycle matrix
4. Notification event aggregation matrix
5. Account switching cache isolation
6. Billing checkout entitlement matrix

## Recommended Cleanup Roadmap

### Phase 1 - Stabilize Critical Workflow Contracts

Focus:

- Billing entitlement tests
- Task lifecycle service
- Assignment resolver expansion
- User switch/cache isolation tests

Why first:

- These areas have the highest user impact and have already produced real
  regressions.

### Phase 2 - Consolidate Document And Notification Workflows

Focus:

- One document upload workflow adapter
- Event-backed notification migration for task/property workflows
- Document acquisition status refetch consistency

Why second:

- Property Knowledge Acquisition and Maintley Event Engine are core platform
  systems now. They should not be locally reimplemented by every upload surface.

### Phase 3 - Hide Legacy Models Behind Adapters

Focus:

- Maintenance Event adapter for dual-read compatibility
- Contractor field normalization
- Team member property assignment field normalization
- Account-scoped Firestore query helpers

Why third:

- These reduce long-term drift without requiring a risky hard migration.

### Phase 4 - Refactor High-Change UI Files Opportunistically

Focus:

- `TaskModal`
- `PropertyKnowledgeReviewPanel`
- `PropertyScanPanel`
- `DashboardTab`
- `PropertyDetailPage`

Why fourth:

- These should be refactored near active product work so behavior remains easy
  to validate.

## Suggested Engineering Standards To Add

Add these as lightweight development rules:

- New workflow notifications should publish Maintley Events unless explicitly
  documented otherwise.
- New task assignment UI must use the shared assignment resolver.
- New property document upload UI must use the shared document workflow adapter.
- New role/plan checks must use the capability facade once created.
- New local storage keys must be either user-scoped or explicitly documented as
  global.
- New Maintenance History code should write Maintenance Events and only read
  legacy data through the adapter.

## Biggest Reliability Wins

The highest-leverage fixes are:

1. Make task completion/approval a single domain workflow.
2. Expand the assignment resolver to all person/contractor selection surfaces.
3. Make billing entitlement server-owned with contract tests.
4. Move document upload/status handling behind one workflow adapter.
5. Migrate old notification writers into Maintley Event producers.
6. Hide `maintenanceHistory` compatibility behind one adapter.
7. User-scope all local cached data and clear API state on auth user changes.

## Final Assessment

Maintley does not need a broad rewrite. The core architecture is coherent, but
the codebase is in a transitional phase where newer source-of-truth decisions
coexist with older field names, collections, and UI-owned workflow logic.

The next reliability push should focus on a small number of shared workflow
contracts. Once task lifecycle, assignment, document acquisition,
notifications, entitlement, and account scoping each have one canonical owner,
the same kinds of regressions should become much harder to reintroduce.
