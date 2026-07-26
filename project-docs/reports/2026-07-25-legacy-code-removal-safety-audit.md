# Legacy Code Removal-Safety Audit

Date: 2026-07-25
Status: Report only; no runtime code or production data was removed

## Purpose

This report updates Maintley's earlier legacy-code findings and classifies
candidate cleanup by removal safety. It focuses on code that is clearly
unreachable, compatibility code that still serves existing data, and rollout or
migration gates that must be satisfied before removal.

This is not permission to perform destructive production-data cleanup. Each
implementation wave remains a separately reviewed change set.

## Prior Audits Reviewed

No recent repository-wide dead-code audit was found. The closest predecessors
were:

* `2026-06-29-design-token-and-legacy-ui-audit.md`, which identified dormant
  Unit and Suite screens and recommended retaining legacy read compatibility.
* `roadmap-review-2026-06-30.md`, which repeated the Unit/Suite decision and
  identified Report Builder cleanup.
* `2026-07-05-app-reliability-fragility-audit.md`, which identified scattered
  legacy maintenance, notification, and account paths.
* `2026-07-06-data-model-architecture-risk-audit.md`, which identified the
  active dual maintenance-history model, duplicated access resolution, and
  client-coordinated workflows.
* `2026-07-23-homeowner-plans-and-trial-implementation-plan.md` and
  `2026-07-24-entitlement-rollout-readiness.md`, which deliberately retain
  entitlement, recurrence, setup, and storage fallbacks through rollout
  observation.

The current implementation still broadly matches those findings. The main new
value of this audit is an explicit safe/unsafe classification and a concrete
cleanup sequence.

## Method

The audit used:

* Route, tab, import, hook-export, Firestore-rule, Function, cleanup, and data
  type reference searches.
* A TypeScript unused-symbol diagnostic run with `noUnusedLocals` and
  `noUnusedParameters` enabled for audit purposes.
* The report-only `audit:scripts` command, recorded in
  `script-audit-2026-07.md`.
* Comparison against active ADRs, product direction, architecture documents,
  rollout plans, and previous reports.

Static searches cannot prove that production has no legacy records. Collection
or field removal therefore requires a report-only production inventory even
when the current application has no writer.

## Classification

| Classification | Meaning |
|---|---|
| Safe now | No active consumer was found; removal can be a normal reviewed cleanup change. |
| Safe after verification | No active current consumer was found, but supported-client or operational-use verification is required. |
| Observation-gated | A trusted replacement exists, but rollout observation and rollback gates are incomplete. |
| Migration-gated | Existing records or relationships may still require the compatibility path. |
| Keep | The code is currently active or strategically required. |

## Executive Recommendation

Remove the dormant Unit/Suite **user interface** now in a focused cleanup wave,
but do not kill the Unit/Suite **data compatibility layer** yet.

That means Maintley can remove unreachable pages, tabs, modals, exports,
commented routes, and unused write-hook surfaces without losing the ability to
display a legacy equipment location or historical record. Unit/Suite
collections, identifiers, legacy readers, rules, and cascade deletion should
remain until production inventory and migration prove that they are no longer
needed.

This is consistent with ADR 0001's current decision: Units and Suites are not
part of the core experience, while existing data paths remain safe. Permanently
deleting the data model would exceed that ADR and requires an explicit ADR
amendment or replacement.

## Implementation Update: Wave 1 Completed

The approved Unit/Suite Wave 1 cleanup was implemented on 2026-07-25:

* Removed dormant routes, pages, tabs, modal, handlers, props, exports, and
  commented management UI.
* Removed unused Suite query/mutation endpoints, unused Unit mutations, and the
  Unit-specific equipment query that was only consumed by dormant UI.
* Removed dormant Unit occupant resolution and Unit/Suite branches from the
  shared property-detail data hook.
* Prevented ordinary property edits from clearing hidden legacy Unit/Suite
  metadata now that no active form manages those fields.
* Preserved active Unit readers, `unitId`/`suiteId` fields, reports, exports,
  Firestore rules, Functions, and cascade deletion.

Validation completed with a successful web production build, successful
Functions TypeScript build, and 64 passing web test suites containing 460
passing tests and one existing todo. The unused-symbol audit decreased from 42
to 38 diagnostics; the remaining findings are unrelated mechanical cleanup.

## Findings

### A. Safe Now: Dormant Unit and Suite UI

The following surfaces are not reachable through current routing or property
tabs and have no active import consumer:

* `src/pages/UnitDetailPage/UnitDetailPage.tsx`
* `src/pages/UnitDetailPage/index.tsx`
* `src/pages/SuiteDetailPage/SuiteDetailPage.tsx`
* `src/pages/PropertyDetailPage/TabSystem/UnitsTab.tsx`
* `src/pages/PropertyDetailPage/TabSystem/SuitesTab.tsx`
* `src/Components/Library/Modal/UnitModal.tsx`
* `src/pages/PropertyDetailPage/useUnitHandlers.ts`
* `src/utils/unitOccupants.ts`
* `UnitsTabProps` and `SuitesTabProps` in
  `src/types/PropertyDetailPage.types.ts`

Supporting evidence:

* Unit and Suite imports and routes in `src/router.tsx` are commented out.
* `TabSystem.tsx` returns `null` for the dormant Unit and Suite cases.
* The tab files are only re-exported; they are not rendered.
* `UnitModal` is only re-exported; it is not consumed.
* `useUnitHandlers` has no caller.
* The unused-symbol audit found four additional unused declarations inside the
  unreachable Unit detail page.

Safe cleanup also includes removing their barrel exports, commented routes,
dormant tab cases, and comments that describe those deleted screens as active
style consumers.

### B. Safe After Verification: Unused Unit/Suite API Surface

No current caller was found for:

* Suite list, detail, create, update, and delete hooks exported by
  `src/Redux/API/propertySlice.tsx`.
* Unit create, update, and delete hooks exported by the same slice, except for
  the unreachable `useUnitHandlers` module.
* `useGetUnitDevicesQuery`, except from dormant Unit UI.

These are safe to remove from the current source after the UI cleanup and a
supported-client check. Removing them does not by itself prevent an older
deployed client from writing directly to Firestore. A write freeze is a
separate permission decision and should not be bundled into mechanical source
cleanup.

### C. Keep: Active Unit Read Compatibility

Current application behavior still reads Unit data to explain legacy records:

* `DevicesTab.tsx` resolves equipment location labels with `useGetUnitsQuery`.
* `DeviceDetailPage.tsx` resolves a legacy `device.location.unitId`.
* `DevicesHubPage.tsx` resolves Unit-based equipment locations.
* `UnifiedMaintenanceHistory.tsx` renders Unit context for historical records.
* Task, equipment-location, and Maintenance Event types still contain legacy
  `unitId` fields.
* Task lifecycle and backend Maintenance Event/recurrence code preserve those
  fields.
* Data filters and detail-page loaders still use Unit relationships.
* Firestore rules still authorize existing `/units/{unitId}` records.
* Account and property cascade-deletion Functions still delete Unit and Suite
  records to avoid orphaned data.

Removing these paths now could hide location context, break older records, or
leave data behind when an account or property is deleted.

### D. Migration-Gated: Permanent Unit/Suite Removal

Before removing Unit/Suite collections, identifiers, readers, rules, or cascade
cleanup, produce a production report that counts at least:

* Unit and Suite documents by account and property.
* Equipment with `location.unitId` or Suite equivalents.
* Tasks, Maintenance Events, maintenance-history records, residents, and
  reports containing Unit/Suite relationships.
* Records whose parent property or account no longer exists.

If records exist, define an export and migration that preserves a human-readable
location snapshot before deleting relationships. Verify the migrated UI,
reports, account export, and property/account deletion behavior. Only then can
rules and collection cleanup be considered.

### E. Safe Now: Other Clearly Unconsumed Source

Static reference searches found no active consumer for:

* `src/Components/DebugConsole/DebugConsole.tsx`
* `src/Components/FirebaseConnectionTest/FirebaseConnectionTest.tsx` and its
  barrel export

These may be removed unless the team intentionally wants to retain them as
named, development-only tools. They are not currently connected to such a
route.

The Functions notification module is also disconnected:

* `functions/src/taskNotifications.ts` imports a scheduler module that no
  longer exists.
* Its exports are commented out in `functions/index.ts`.
* It is explicitly excluded in `functions/tsconfig.json`.
* Stale compiled output remains under `functions/lib` because the build does
  not clean the output directory first.

Remove the disconnected source, commented exports, exclusion, and stale build
artifact together. This does not mean removing the current Maintley Event or
lifecycle communication systems.

### F. Safe Now: Broken Script Commands

The Functions package currently declares two commands whose targets do not
exist:

* `check-resend` -> `scripts/check-resend.cjs`
* `seed:admin-user` -> `scripts/seed-admin-user.cjs`

The commands are already unusable. Remove the manifest entries and any stale
documentation, or restore intentional replacements under an approved admin
workflow. Do not leave broken operational commands in the package manifest.

### G. Review Before Archiving: Unreferenced Root Scripts

The script audit found 15 active scripts that are not invoked from a package
manifest. This is not proof that they are dead because several are manually run
diagnostics or migrations.

Recommended classification:

| Script group | Decision |
|---|---|
| Hard-coded Firebase query/debug scripts such as `checkDeviceLocations.cjs`, `debugRecurringTasks.cjs`, `testContractorsQuery.cjs`, and `testDevicesQuery.cjs` | Archive after confirming they are not in an operator runbook. They depend on local credentials or historical fixtures. |
| One-time migrations such as `migrateFixDeviceStructure.cjs` | Archive only after production migration state is verified. |
| Push test/trigger scripts | Keep only if they match the current notification architecture and are documented; otherwise archive. |
| `sendPushOnNotificationCreate.js` | Likely superseded sample Function code; verify against deployed exports, then remove rather than treating it as an active Function. |
| Pure local helpers such as `convert-to-root-imports.cjs` and `scan-packages-for-test-code.cjs` | Keep only if documented as supported developer utilities; otherwise archive. |
| Recurrence scratch tests | Compare with the current automated recurrence suites and remove if coverage is duplicated. |

Archived scripts are historical artifacts, not active runtime dead code, and
should not be deleted merely because package manifests do not reference them.

### H. Safe Mechanical Cleanup: Unused Imports

The TypeScript audit produced 42 unused-symbol diagnostics. Most are obsolete
default `React` imports left after the automatic JSX transform. Removing these
imports is low risk but low value and should be handled as one mechanical
cleanup with a complete build and test run. It should not be mixed with data
model migration.

### I. Observation-Gated: Entitlement Rollout Compatibility

Do not remove the following during the immediate cleanup wave:

* Legacy trial helpers and direct plan/status compatibility in
  `subscriptionUtils.ts` and the shared entitlement resolvers.
* Client fallbacks for property-setup activation, recurring tasks, and trusted
  storage quota enforcement.
* Compatibility for synthetic Stripe subscriptions or legacy plan records.
* Lifecycle delivery compatibility while the newly deployed scheduler and
  message idempotency are still under production observation.

The Phase 9 gate remains controlling: every supported web and Android version
must use the trusted replacement; observation and rollback must be complete;
repository search and tests must show no consumer.

### J. Migration-Gated: Account, Tenant, and Maintenance Compatibility

Do not remove yet:

* Legacy account-link and manage-role fallbacks in Firestore/Storage rules and
  `functions/accountAuthz.ts`.
* Legacy `maintenanceHistory` reads while Maintenance Events adapters and
  backfill remain active.
* `tenantProfiles` compatibility or tenant cleanup/export paths solely because
  the recent migration found no profiles at that point in time.
* Property document/knowledge arrays as part of a dead-code pass; moving those
  records is separate data-model work under the existing architecture audit.

Each requires a fresh production inventory, parity verification, migration or
retention policy, and rollback evidence.

## Recommended Cleanup Waves

### Wave 1 - Clearly Dead Source

After explicit implementation approval:

1. Remove dormant Unit/Suite pages, tabs, modal, handlers, props, exports,
   commented routes, and dead tab cases.
2. Remove unused Unit/Suite mutation hooks, Suite readers, and Unit-device query
   only after confirming no supported client/source consumer.
3. Remove disconnected debug/test components.
4. Remove the excluded task-notification module and its stale compiled output.
5. Remove or restore the two broken Functions package commands.
6. Perform the unused-import cleanup separately within the same cleanup release
   if desired.

Validation:

* Web typecheck/build and focused property, device, task, report, and
  maintenance-history tests.
* Functions clean build from an empty output directory.
* Repository search shows no import, export, route, or hook consumer.
* Existing legacy Unit equipment/history fixtures still display their location
  labels.

### Wave 2 - Script Hygiene

1. Confirm operational owners and runbooks for the 15 unreferenced scripts.
2. Move completed one-time migrations and obsolete debug scripts to
   `scripts/archive`.
3. Add package commands and documentation for intentionally supported tools.
4. Add dry-run/apply separation to any retained production-mutating script.

### Wave 3 - Unit/Suite Write Freeze

Only after production inventory and supported-client verification:

1. Confirm current clients do not expose Unit/Suite creation.
2. Decide whether rules should reject new Unit/Suite creation and updates while
   retaining reads and controlled deletion.
3. Add rule tests for the chosen compatibility contract.

This is a permissions and backward-compatibility change, not mechanical cleanup.

### Wave 4 - Rollout-Gated Legacy Removal

After the entitlement Phase 9 observation gates are satisfied, remove trusted
write fallbacks and obsolete plan/trial adapters one subsystem at a time. Record
evidence and rollback for every removal.

### Wave 5 - Data Migrations

Handle Maintenance History, account access, tenant compatibility, Unit/Suite
data, and embedded property knowledge as their own inventory-backed migrations.
Do not combine them into a single deletion release.

## Stop Conditions

Stop a cleanup wave if any of the following occurs:

* A supported client still calls the candidate path.
* Production inventory finds records without a preservation/migration plan.
* Existing equipment or history loses location context.
* Authorization results differ between legacy and replacement paths.
* A trusted entitlement, recurrence, setup, storage, or lifecycle workflow has
  not completed its observation gate.
* A deletion or export workflow no longer covers retained legacy data.

## Decision Required for Units

Recommended decision for the next implementation PR:

> Retire the unreachable Unit and Suite management UI and unused current-source
> writers, while preserving legacy read-only data compatibility.

This does not require a new ADR because it completes the existing ADR 0001
direction. A decision to delete Unit/Suite data support permanently does require
an ADR 0001 amendment or a new superseding ADR because current product
documentation explicitly describes the feature as hidden/deferred rather than
permanently removed.
