# Urgent Product Reliability Remediation Plan

Date: 2026-08-18

Status: Implemented locally; Beta activation verification pending

Related evidence:

* `project-docs/reports/2026-08-18-comprehensive-product-audit.md`
* `project-docs/docs/Architecture/PERMISSIONS.md`
* `project-docs/docs/Architecture/FIREBASE_STRUCTURE.md`
* `project-docs/docs/Product/MAINTLEY_PLAN_FEATURE_MATRIX.md`
* `project-docs/docs/Operations/TESTING.md`

## Objective

Restore confidence in Maintley's first-value journey and make the same class of
regression release-blocking.

This plan addresses four confirmed urgent issues:

1. Generated Spaces fail during production property creation.
2. Billing plan and effective granted access are presented inconsistently.
3. Populated accounts briefly render convincing empty states.
4. Current CI and release gates do not exercise the complete first-value
   contract.

The work is corrective. It does not introduce a new product workflow, change
plan entitlements, broaden Firestore permissions, or require an ADR.

## Recommended delivery shape

Use one implementation branch and one pull request targeting `beta`, organized
as four independently reviewable commits:

1. `fix: restore idempotent generated space creation`
2. `fix: present effective account access consistently`
3. `fix: prevent loading states from appearing empty`
4. `test: gate the first-value homeowner journey`

Keeping the fixes and their release gate in one pull request prevents a state
where production behavior is patched but the missing regression protection is
deferred. The commits remain separable for review and rollback.

Do not include broader onboarding redesign, Functions reorganization, new
Intelligence capability, or list-density work in this remediation pull request.

## Governing decisions

### Do not weaken Space read permissions

The generated-Space failure should be fixed in the write sequence. It should
not be solved by allowing authenticated users to read arbitrary missing Space
IDs or by broadening `propertySpaces` rules.

### Current access controls capabilities and limits

All user-facing limits and capability decisions must use effective access,
including active temporary and permanent grants. Billing status remains visible
as a separate fact and must not control the primary Plan & Usage display.

### Empty is a successful data state

An empty state may render only after all required queries have settled
successfully and the resulting collection is actually empty. Loading,
refreshing, stale, and error states are not empty states.

### The journey test owns its data

Release-blocking E2E must never mutate the shared demonstration account. It
must create uniquely named Beta test data and remove that data even after a
failed run.

## Phase 0: Freeze the failing contracts

Before changing implementation, add focused failing tests that reproduce the
observed behavior.

### Space contract

Add a rules/emulator integration case that:

1. Creates an authorized property.
2. Attempts the current deterministic generated-Space sequence when the Space
   document does not exist.
3. Demonstrates the current pre-create read failure.
4. Creates the generated Space using the replacement sequence.
5. Repeats the operation and returns the existing Space.
6. Confirms exactly one document exists for the generation key.
7. Runs for both `property_profile` and `setup_assistant` sources.
8. Confirms an outsider and an unauthorized account member still cannot create
   or discover the Space.

Primary files:

* `scripts/testFirestoreRules.cjs`
* `src/Redux/API/spaceSlice.ts`
* A focused `spaceSlice` or generated-Space workflow test alongside the source.

### Access-presentation contract

Add table-driven tests for:

* Free with no grant.
* Free plus temporary Homeowner+ access.
* Free plus permanent Portfolio access.
* Paid Property without a grant.
* Paid plan plus a higher temporary grant.
* Expired grant.
* Scheduled downgrade while current paid access remains active.
* Existing records over the current creation limit.

Each case must assert billing plan, current access, access source, end date,
property limit, remaining capacity, storage limit, and CTA language.

### Async view-state contract

Add deferred-query tests proving that Tasks, Properties, and Equipment:

* display loading while their first query is unresolved;
* never display an empty CTA while unresolved;
* retain populated data while a refetch is in flight;
* display a retryable error when the first query fails;
* display the empty state only after a successful empty result.

Exit gate: all three defects are represented by tests that fail against the
current behavior for the expected reason.

## Phase 1: Repair generated Space creation

### Current failure

`createPropertySpace` performs a transaction read on the deterministic Space
document before creation. A missing document has no `resource.data.accountId`,
so the existing read rule correctly refuses that read.

### Preferred implementation

Replace the missing-document transaction read with an authorized,
property-scoped idempotency sequence:

1. When `generationKey` is present, query Spaces by `accountId` and
   `propertyId` using the already authorized collection boundary.
2. Reuse an existing record with the same `generationKey`.
3. If none exists, write the deterministic document ID with the existing
   validated create payload.
4. If a concurrent creator wins and the write is rejected as an update, repeat
   the scoped query.
5. Return the matching existing Space if found; otherwise preserve the original
   error.
6. Manual Space creation without `generationKey` remains unchanged.

Where the caller already has the complete property Space collection, allow it
to supply that collection to the planner so the implementation does not add an
unnecessary read per generated Space.

### Required invariants

* Generated document IDs remain stable.
* `createdBy`, `createdAt`, `source`, and `generationKey` remain immutable.
* Archived conflicts are not silently reactivated.
* Retrying property creation or Setup Assistant does not create duplicates.
* Partial failure remains visible and retryable.
* Firestore rules are not broadened.

### Validation

* Root unit tests.
* Firestore rules/emulator tests.
* Property profile with 2 bedrooms and 1.5 bathrooms creates exactly:
  `Bedroom 1`, `Bedroom 2`, `Bathroom 1`, and `Half Bathroom 1`.
* Reopen and save the property again; count remains four.
* Setup Assistant adds an area Space only once.
* Existing generated Spaces are reused and linked.

### Repair behavior for affected properties

No bulk migration is required. Preserve the existing recovery message and use
the corrected idempotent retry when the user reopens Setup or saves the property
profile. A one-time admin inventory query may count affected properties, but it
must not mutate production during this pull request.

## Phase 2: Establish one account access presentation

### Add a derived presentation model

Create a pure helper, preferably in `src/utils/accountAccessPresentation.ts`,
that derives an `AccountAccessPresentation` from the existing subscription and
grants without persisting new data.

Suggested shape:

```ts
interface AccountAccessPresentation {
  billingPlanId: string;
  accessPlanId: string;
  accessSource: 'billing' | 'trial' | 'grant' | 'free';
  accessKind: 'temporary' | 'permanent';
  accessEndsAtMs: number | null;
  propertyLimit: number;
  storageLimitGb: number;
  displayName: string;
}
```

The exact type can follow repository conventions, but it must remain derived
from the canonical entitlement resolver.

### Migrate every user-facing consumer

Inventory and update surfaces that render plan names, property capacity,
storage, or upgrade actions, including:

* `src/Components/AccountSnapshot/AccountSnapshot.tsx`
* `src/pages/UserProfile/UserProfile.tsx`
* `src/pages/SettingsPage/AccountManagement.tsx`
* Property creation capacity in `src/Components/PropertiesTab/PropertiesTab.tsx`
* Equipment, Intelligence, Paywall, and navigation capability checks that still
  use base-plan resolution where effective access is intended.

Do not mechanically replace every use of `getEffectiveSubscriptionPlanId`.
Billing-specific screens still need the base billing plan. Classify each call as
`billing`, `access`, or `compatibility` and test it accordingly.

### User-facing behavior

For a Free account with temporary Homeowner+ access:

* Primary label: `Current access: Homeowner+`.
* Capacity: `1 of 5 homes` and `4 home slots available`.
* Storage: `0 MB of 10 GB`.
* Supporting text: `Complimentary access through September 17, 2026`.
* Billing detail: `Billing plan: Free · No payment method connected`.

For a permanent Portfolio grant:

* Primary label and limits use Portfolio.
* Supporting text says the access is granted permanently.
* Billing remains visible only within Billing/Subscription details.
* A raw `Upgrade Plan` CTA must not imply the granted access is invalid. Use
  `Manage billing` or explain paid continuation when relevant.

### Downgrade invariant

Existing records remain visible after access falls. New writes are blocked only
when they exceed the current effective limit or require a capability no longer
available. This remediation does not delete or hide existing records.

## Phase 3: Replace false empty states with explicit async states

### Introduce one reusable view-state model

Use existing `LoadingState` and `AppZeroState` components, but standardize the
decision logic with a small hook/helper rather than duplicating boolean
conditions across pages.

Required states:

* `initial-loading`
* `populated`
* `refreshing-populated`
* `empty-success`
* `error-no-data`
* `error-with-stale-data`

The helper should accept the query's `data/currentData`, `isLoading`,
`isFetching`, `isSuccess`, and `error`. It should not own business data.

### Correct critical routes first

1. Tasks
   * Wait for both properties and tasks.
   * A successful zero-task result may show the task empty state.
   * Filters with no matches show a filtered-results state, not first-run setup.

2. Properties
   * Wait for property/group ownership queries and role filtering.
   * Shared/team accounts use assigned-property language only after success.

3. Equipment
   * Wait for properties, equipment, and the minimum relationship data required
     to build rows.
   * Preserve existing rows during maintenance/history refetch.

Then apply the same helper to Team and Reports if their current conditions show
the same defect. This is allowed only as direct reuse of the completed fix, not
as a redesign of those pages.

### Error behavior

* First-load failure shows a plain explanation, retry action, and Support path.
* Refetch failure leaves known records visible and shows a non-blocking warning.
* Empty states never suggest adding replacement data when a request failed.

## Phase 4: Gate the first-value journey

### Add a dedicated activation E2E suite

Create `e2e/first-value.spec.ts` and an `e2e:activation:chrome` command. The
suite should use a uniquely generated Beta account, not the shared demo user.

Required journey:

1. Register a Free homeowner account.
2. Assert temporary Homeowner+ access if the Beta rollout enables it.
3. Assert billing plan and current access are presented separately.
4. Create a residential home with 2 bedrooms and 1.5 bathrooms.
5. Assert the four expected Spaces exist.
6. Reopen/save or retry and assert no duplicate Spaces.
7. Open Setup Assistant, intentionally mark one system Present and one Not
   Present, and verify no item was reviewed before the action.
8. Confirm one equipment record, its generated Space, suggested task, and
   relationship links.
9. Complete the task and assert Maintenance History is created.
10. Delete the account and verify Auth and owned test data are removed.

### Deterministic cleanup

* Prefix every test account and record with the GitHub run ID and attempt.
* Record created IDs during the run.
* Run cleanup in an `if: always()` step.
* Require the Beta service-account cleanup secret for same-repository activation
  runs.
* Fail the workflow if cleanup cannot prove the account was removed.
* Dependabot remains credential-free and validates workflow policy only.

### Workflow policy

Change pull-request E2E behavior deliberately:

* PRs into `beta`: run existing smoke checks plus the activation journey in
  Chromium when first-value source, rules, entitlements, or E2E files change.
* `release/next`: always run the activation journey before release approval.
* Scheduled run: keep cross-browser smoke coverage and add activation on mobile
  Chrome after the Chromium version is stable.
* Production: do not add unattended destructive account automation in this
  phase. Perform one explicit post-release acceptance run with controlled
  cleanup and monitor logs.

Prefer keeping the existing required `e2e` check context rather than adding a
new branch-protection context that can remain pending. The workflow can select
the stronger suite internally.

### Strengthen unit and emulator coverage

The E2E journey supplements rather than replaces:

* generated-Space rule tests;
* entitlement presentation table tests;
* async state component/page tests;
* existing property, task, and account tests.

## Phase 5: Documentation and support alignment

Update only behavior affected by the remediation:

* `project-docs/docs/Architecture/PERMISSIONS.md`
  * Document the authorized idempotent generated-record sequence.
* `project-docs/docs/Product/MAINTLEY_PLAN_FEATURE_MATRIX.md`
  * Clarify billing plan versus current effective access presentation.
* `project-docs/docs/Operations/TESTING.md`
  * Document the activation suite, cleanup contract, and release requirement.
* `project-docs/docs/Operations/DEPLOYMENT.md`
  * Add the Beta and post-production acceptance checklist.
* Support feature updates
  * Describe the corrected behavior only after Beta verification.

No ADR is required because the remediation restores existing documented
decisions. If implementation instead moves property creation and generated
relationships into a new server-side command architecture, that larger change
should receive its own ADR and separate rollout.

## Automated validation matrix

| Gate | Required evidence |
|---|---|
| Focused unit tests | Space idempotency, account presentation, async states |
| Firestore emulator | Missing generated ID, create, repeat, unauthorized actors |
| Root unit/script suite | No regression across existing contracts |
| Lint | No new lint errors |
| Production build | Frontend compiles with production configuration |
| Beta build | Frontend compiles with Beta configuration |
| Functions package/build | Must remain unchanged or pass if touched indirectly |
| Workflow validation | E2E routing and cleanup policy parse and pass tests |
| Activation E2E | New account completes first-value journey and is deleted |
| Repeatability | Activation journey succeeds twice without leaked data |

## Manual Beta acceptance

Use a fresh temporary Beta account and record exact evidence:

1. Register on mobile-width Chrome.
2. Confirm Current access, Billing plan, end date, five-home capacity, and 10 GB
   agree across sidebar and Settings.
3. Create a 2-bedroom, 1.5-bathroom home.
4. Confirm four Spaces and no permission errors.
5. Reopen the profile and save again; confirm no duplicates.
6. Complete two Setup Assistant decisions and close/reopen the assistant.
7. Confirm reviewed counts and draft restoration.
8. Navigate directly to Tasks, Properties, and Equipment on a throttled
   connection; confirm no false empty state.
9. Trigger a refetch while data is visible; confirm records remain visible.
10. Delete the account and verify redirect to the public landing page.

## Production rollout

1. Merge the approved PR into `beta`.
2. Wait for Beta hosting/deployment and all required checks.
3. Complete the automated activation run and manual Beta acceptance.
4. Confirm no `propertySpaces` permission-denied errors in Beta logs.
5. Allow the changes to enter the existing `release/next` branch.
6. Require the release activation gate, build, unit tests, rules tests, and
   release validation.
7. Merge the release into `main` through the normal production path.
8. Perform the controlled production acceptance once.
9. Monitor for 24 hours:
   * Space create/retry failures.
   * Permission-denied errors.
   * Onboarding workflow errors.
   * Access/limit support reports.
   * Activation completion and abandonment.

## Rollback

This plan requires no schema migration or destructive data change.

If Beta fails:

* Do not advance `release/next`.
* Revert the failing commit while keeping the new failing test if it accurately
  captures the contract.
* Remove any leaked Beta account through the cleanup tool.

If production fails:

* Revert the frontend release.
* Generated Spaces already created by the corrected path remain valid records.
* Do not delete or hide successfully created Spaces.
* Re-run the affected-account inventory before attempting another repair.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Concurrent deterministic Space creation | Deterministic ID, scoped retry, and repeat test |
| Rules are loosened to make the test pass | Explicit prohibition and unauthorized-actor tests |
| Expiring grant changes during render | Derive from one timestamped presentation helper and test boundaries |
| Billing terminology confuses users | Separate Current access from Billing plan consistently |
| Async helper hides real errors | Explicit error-with-data and error-without-data states |
| Activation E2E leaks accounts | Unique run IDs, mandatory `always()` cleanup, cleanup verification |
| Shared Beta backend is occupied by another preview | Use existing backend-preview ownership/readiness policy |
| CI becomes permanently pending | Reuse the existing `e2e` check context and test workflow routing |

## Completion criteria

The urgent remediation is complete only when:

* A new production-like home creates all reviewed Spaces without a permission
  error.
* Repeating the operation creates no duplicate records.
* Trial/granted accounts show effective limits consistently everywhere.
* Downgraded accounts preserve existing record visibility.
* Populated routes never show an empty CTA during initial load or refetch.
* The first-value Beta journey is release-blocking and cleans up its own data.
* Automated and manual Beta acceptance pass.
* Controlled production acceptance passes.
* Active documentation reflects the corrected behavior.

## Recommended first action

Begin with Phase 0 and Phase 1 on a fresh branch from current `beta`. The Space
failure is the only issue currently breaking a promised record-creation outcome.
Do not begin the entitlement or async-state edits until the failing Space test
exists and the replacement write sequence passes it.
