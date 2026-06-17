# Script Audit - 2026-06

Date: 2026-06-17
Scope:
- Root package scripts in package.json
- Functions package scripts in functions/package.json
- All executable scripts in scripts/ (*.cjs, *.js)

## Remediation Actions Applied (2026-06-17)

Completed:
- Removed duplicate script: `scripts/scan-packages-for-test-code.js`
- Kept canonical scanner script: `scripts/scan-packages-for-test-code.cjs`
- Created archive folder: `scripts/archive/`
- Added archive notice: `scripts/archive/README.md`
- Moved one-time legacy migrations/utilities to `scripts/archive/`:
  - addExtensiveMaintenanceHistory.cjs
  - addUnitLevelMaintenanceHistory.cjs
  - migrateAddDevicesToProperties.cjs
  - migrateAddMockDataForPropertyUser.cjs
  - migrateAddRecurringFields.cjs
  - migrateAddSubscriptions.cjs
  - migrateAddUserToMyTeam.cjs
  - migrateDefaultGroups.cjs
  - migrateDeviceUserIds.cjs
  - migrateFixTeamMemberUserIds.cjs
  - migrateRemoveSharedPropertiesGroups.cjs
  - migrateTasksAssignedToObject.cjs
  - migrateTasksMissingFields.cjs
  - migrateTeamInvitationCodes.cjs
  - migrateTenantInvitationCodes.cjs
  - migrateUserRolesBySubscription.cjs
  - updateContractorsPropertyId.cjs
  - updateContractorsStructure.cjs

Not changed intentionally:
- package.json and functions/package.json (proposal-only work)
- active scripts in scripts/ not listed above

Method:
- Static audit only (no data-writing execution performed).
- Verified script references from package.json files.
- Reviewed architecture alignment against project-docs/docs/Architecture/FIREBASE_STRUCTURE.md and project-docs/docs/Development/SCRIPTS_AND_UTILITIES.md.
- Flagged legacy/deprecated model usage by collection/field references.

## Package Script Entry Audit (Referenced by package.json)

### Root package.json

Active and aligned:
- start, build, test, test:ci, test:build, validate
- e2e, e2e:ui, e2e:debug, e2e:chrome, e2e:firefox, e2e:webkit, e2e:report
- cleanup:test-data, cleanup:test-data:dry-run, cleanup:test-data:full
- cleanup:optional-groups:dry-run, cleanup:optional-groups:apply
- cleanup:shared-properties:dry-run, cleanup:shared-properties:apply
- seed:firebase
- migrate:property-memberships, migrate:property-memberships:apply, migrate:property-memberships:cleanup
- migrate:report-account-integrity, migrate:report-account-integrity:apply
- migrate:maintenance-events, migrate:maintenance-events:apply
- migrate:orphaned-data, migrate:orphaned-data:apply
- migrate:prune-inactive-user-data, migrate:prune-inactive-user-data:apply
- init:firestore, test:rules, test:storage, test:rules:all
- cap:sync, cap:open, build:apk, release:notes
- test:stripe:sandbox, test:stripe:cards:sandbox, test:stripe:e2e, test:stripe:webhook:sandbox, test:stripe:all

Needs review:
- e2e:clean, e2e:full, e2e:ci
  - Reason: uses rm and timeout shell commands which are not portable to native Windows cmd/PowerShell.
- deploy (gh-pages -d build)
  - Reason: confirm this matches current deployment strategy (Firebase Hosting is configured in repo).
- eject
  - Reason: high-risk and usually irreversible; should remain effectively disabled operationally.
- build:signed, testDeploy
  - Reason: bash dependency on Windows; works in Git Bash/WSL but not guaranteed in cmd/PowerShell.

### functions/package.json

Active and aligned:
- build, serve, deploy
- test, test:sandbox, test:cards:sandbox, test:webhook:sandbox
- migrate:account-rbac, migrate:account-counters
- check-resend, stripe:webhook

Needs review:
- stripe:webhook:auto
  - Reason: bash dependency (listen-and-update-webhook-secret.sh) on Windows shells.

### client/package.json
- No scripts defined.

## Detailed Scripts Directory Audit

Legend:
- Arch refs: Current | Legacy model | Deprecated model | Removed feature
- Viability: Likely | Conditional | Needs Review

| Script | Defined In | Referenced By package.json | Viability | Key Findings | Architecture References | Classification |
|---|---|---|---|---|---|---|
| addExtensiveMaintenanceHistory.cjs | scripts/ | No | Conditional | Demo seeding utility; assumes specific user/email/property shape | Legacy model (maintenanceHistory, units) | Archive Candidate |
| addUnitLevelMaintenanceHistory.cjs | scripts/ | No | Conditional | Demo utility focused on unit-level records | Legacy model (maintenanceHistory, units) | Archive Candidate |
| auditTasksSchema.cjs | scripts/ | No | Likely | Read/audit utility; no package entry | Current | Needs Review |
| checkDeviceLocations.cjs | scripts/ | No | Likely | Read-only diagnostic script; not wired into workflows | Current | Needs Review |
| cleanupFirebaseTestUsers.cjs | scripts/ | Yes (cleanup:test-data*, e2e:ci) | Likely | Has dry-run; bulk delete/update safety logic; production destructive if mis-scoped | Current + legacy compatibility (maintenanceHistory, units, suites) | Active |
| cleanupOptionalGroupLinks.cjs | scripts/ | Yes (cleanup:optional-groups:*) | Likely | Dry-run by default; apply flag required; deletes/updates invalid links | Current migration path (propertyGroupMemberships), legacy property.groupId cleanup | Active |
| cleanupSharedPropertiesData.cjs | scripts/ | Yes (cleanup:shared-properties:*) | Likely | Dry-run by default; apply flag required; high-impact deletes | Current | Active |
| convert-to-root-imports.cjs | scripts/ | No | Needs Review | Codemod utility; unreferenced and no dry-run backup path | Current frontend code layout assumptions | Needs Review |
| debugRecurringTasks.cjs | scripts/ | No | Likely | Diagnostic-only helper | Current | Needs Review |
| generateReleaseNotes.cjs | scripts/ | Yes (release:notes) | Likely | Active release support utility | Current | Active |
| initAppVersion.cjs | scripts/ | Yes (build:apk) | Likely | Writes appConfig/version document; no dry-run | Current | Active |
| initFirestore.cjs | scripts/ | Yes (init:firestore) | Conditional | Uses placeholder group IDs and bootstrap defaults; verify against account-centric model before prod use | Current + legacy field compatibility (groupId) | Needs Review |
| migrateAddDevicesToProperties.cjs | scripts/ | No | Conditional | Historic migration utility; one-time behavior | Legacy migration | Archive Candidate |
| migrateAddMockDataForPropertyUser.cjs | scripts/ | No | Conditional | Large mock-data migration, old property/group conventions | Legacy model (units, suites, property.groupId) | Archive Candidate |
| migrateAddRecurringFields.cjs | scripts/ | No | Conditional | Backfill migration likely one-time | Current | Archive Candidate |
| migrateAddSubscriptions.cjs | scripts/ | No | Conditional | Historic subscription backfill | Legacy migration | Archive Candidate |
| migrateAddUserToMyTeam.cjs | scripts/ | No | Conditional | Team backfill utility; likely one-time | Legacy-to-current transitional | Archive Candidate |
| migrateDefaultGroups.cjs | scripts/ | No | Conditional | One-time default-group migration | Legacy transitional model | Archive Candidate |
| migrateDeviceUserIds.cjs | scripts/ | No | Conditional | Legacy ownership backfill utility | Legacy ownership model | Archive Candidate |
| migrateFixDeviceStructure.cjs | scripts/ | No | Conditional | Data-fix script with deletes/updates; no dry-run guard | Legacy-to-current structural fix | Needs Review |
| migrateFixReportAccountIntegrity.cjs | scripts/ | Yes (migrate:report-account-integrity*) | Likely | Dry-run/apply split; aligns to account integrity checks | Current account architecture | Active |
| migrateFixTeamMemberUserIds.cjs | scripts/ | No | Conditional | Legacy field correction utility | Legacy team model cleanup | Archive Candidate |
| migrateMaintenanceHistoryToEvents.cjs | scripts/ | Yes (migrate:maintenance-events*) | Likely | Dry-run by default; converts legacy history into maintenanceEvents | Current + legacy bridge (maintenanceHistory -> maintenanceEvents) | Active |
| migratePropertyGroupMemberships.cjs | scripts/ | Yes (migrate:property-memberships*) | Likely | Dry-run by default; apply and optional cleanup; idempotent design signals present | Current + legacy bridge (property.groupId -> propertyGroupMemberships) | Active |
| migratePruneInactiveUserData.cjs | scripts/ | Yes (migrate:prune-inactive-user-data*) | Likely | Dry-run default with apply for permanent deletes; high-risk destructive | Current account architecture | Active |
| migrateRemoveOrphanedData.cjs | scripts/ | Yes (migrate:orphaned-data*) | Needs Review | Dry-run default; references legacy collections tenantPromoCodes/teamMemberPromoCodes | Current + deprecated legacy collections | Needs Review |
| migrateRemoveSharedPropertiesGroups.cjs | scripts/ | No | Conditional | Historic cleanup script around shared-property team groups | Removed/legacy collaboration path | Archive Candidate |
| migrateTasksAssignedToObject.cjs | scripts/ | No | Conditional | Old task-field normalization script | Legacy task shape migration | Archive Candidate |
| migrateTasksMissingFields.cjs | scripts/ | No | Conditional | One-time required-field backfill | Legacy task shape migration | Archive Candidate |
| migrateTeamInvitationCodes.cjs | scripts/ | No | Conditional | Explicitly migrates teamMemberPromoCodes -> teamMemberInvitationCodes | Deprecated model migration | Deprecated |
| migrateTenantInvitationCodes.cjs | scripts/ | No | Conditional | Explicitly migrates tenantPromoCodes -> tenantInvitationCodes | Deprecated model migration | Deprecated |
| migrateUserRolesBySubscription.cjs | scripts/ | No | Conditional | Legacy role/subscription alignment migration | Legacy permissions transition | Archive Candidate |
| scan-packages-for-test-code.cjs | scripts/ | No | Likely | Utility script; duplicate JS variant exists | Current dev utility | Needs Review |
| seedFirestore.cjs | scripts/ | Yes (seed:firebase) | Needs Review | References legacy model in data payload (units/suites/groupId); comments mention removed shared mockData.ts source of truth | Legacy-heavy seed model + current collections | Needs Review |
| seedFirestoreAuth.cjs | scripts/ | No | Conditional | Environment bootstrap utility; not wired in package scripts | Current | Needs Review |
| syncAppVersion.cjs | scripts/ | No | Likely | Version sync utility; unreferenced but useful | Current | Needs Review |
| testContractorsQuery.cjs | scripts/ | No | Likely | Local diagnostic script; not wired to test command | Current | Needs Review |
| testDevicesQuery.cjs | scripts/ | No | Likely | Local diagnostic script; not wired to test command | Current | Needs Review |
| testFirebaseAdmin.cjs | scripts/ | No | Likely | Environment/admin sanity check utility | Current | Needs Review |
| testFirebaseRules.cjs | scripts/ | Yes (test:rules) | Likely | Active rules validation script | Current | Active |
| test-push-notifications.cjs | scripts/ | No | Conditional | Manual push test utility, requires external env setup | Current | Needs Review |
| testRecurrence.cjs | scripts/ | No | Likely | Local recurrence logic test helper | Current | Needs Review |
| testRecurrenceLogic.cjs | scripts/ | No | Likely | Local recurrence logic test helper | Current | Needs Review |
| testStorageRules.cjs | scripts/ | Yes (test:storage) | Likely | Active storage rules validation script | Current | Active |
| trigger-push-notification.cjs | scripts/ | No | Conditional | Manual trigger script; env/permissions dependent | Current | Needs Review |
| updateAppVersion.cjs | scripts/ | No | Likely | Useful release utility but unreferenced by package scripts | Current | Needs Review |
| updateContractorsPropertyId.cjs | scripts/ | No | Conditional | Legacy contractor-field correction utility | Legacy-to-current contractor model transition | Archive Candidate |
| updateContractorsStructure.cjs | scripts/ | No | Conditional | Legacy contractor structure normalization | Legacy contractor model transition | Archive Candidate |
| scan-packages-for-test-code.js | scripts/ | No | Likely | Duplicate implementation of .cjs variant | Current dev utility | Remove Candidate |
| sendPushOnNotificationCreate.js | scripts/ | No | Needs Review | Unreferenced JS helper; similar capability exists in Cloud Functions TS code | Legacy/duplicate implementation risk | Remove Candidate |

## Migration and Cleanup Script Safety Review

| Script | Dry-run Support | Production Safety Concerns | Idempotent Signals | Retain? | Notes |
|---|---|---|---|---|---|
| cleanupFirebaseTestUsers.cjs | Yes (--dry-run) | High (bulk delete/update if scope too broad) | Yes (re-runs trend to no-op) | Yes | Keep for E2E cleanup; already wired to CI.
| cleanupOptionalGroupLinks.cjs | Yes (default dry, --apply writes) | High (deletes/field removals) | Yes (normalization behavior) | Yes | Active cleanup utility.
| cleanupSharedPropertiesData.cjs | Yes (default dry, --apply writes) | High (bulk deletions) | Mostly yes | Yes | Keep; enforce explicit environment checks before apply.
| migrateFixReportAccountIntegrity.cjs | Yes (--apply to write) | Medium | Likely yes | Yes | Active integrity migration.
| migrateMaintenanceHistoryToEvents.cjs | Yes (default dry) | Medium-High (event creation migration) | Needs review (duplicate-creation guard should be verified) | Yes | Keep active bridge migration until legacy history sunset is complete.
| migratePropertyGroupMemberships.cjs | Yes (default dry, --apply) | High | Yes (matching/upsert logic present) | Yes | Core migration for current architecture.
| migratePruneInactiveUserData.cjs | Yes (default dry, --apply) | Very High (destructive deletes) | Yes | Yes | Keep with strict runbook + approvals.
| migrateRemoveOrphanedData.cjs | Yes (default dry, --apply) | High | Yes for deletions | Conditional | Keep only after removing deprecated collection checks.
| migrateTeamInvitationCodes.cjs | No explicit dry-run | Medium-High | One-time migration | No (archive) | Migration target appears already transitioned.
| migrateTenantInvitationCodes.cjs | No explicit dry-run | Medium-High | One-time migration | No (archive) | Migration target appears already transitioned.

## Summary Table

| Script | Category | Risk | Status | Recommendation |
|---|---|---|---|---|
| cleanupFirebaseTestUsers.cjs | Cleanup | High | Active | Keep and retain in CI cleanup flow |
| cleanupOptionalGroupLinks.cjs | Cleanup | High | Active | Keep; enforce apply-only in controlled env |
| cleanupSharedPropertiesData.cjs | Cleanup | High | Active | Keep; add runbook safeguards |
| migrateFixReportAccountIntegrity.cjs | Migration | Medium | Active | Keep |
| migrateMaintenanceHistoryToEvents.cjs | Migration | Medium-High | Active | Keep until maintenanceHistory retirement is complete |
| migratePropertyGroupMemberships.cjs | Migration | High | Active | Keep |
| migratePruneInactiveUserData.cjs | Migration/Cleanup | Very High | Active | Keep with approvals and backups |
| migrateRemoveOrphanedData.cjs | Migration/Cleanup | High | Needs Review | Update legacy collection references before regular use |
| seedFirestore.cjs | Seeding | Medium | Needs Review | Modernize seed model to account-centric current architecture |
| initFirestore.cjs | Init | Medium | Needs Review | Validate placeholders and account-centric defaults |
| testFirebaseRules.cjs | Test | Low | Active | Keep |
| testStorageRules.cjs | Test | Low | Active | Keep |
| generateReleaseNotes.cjs | Release Utility | Low | Active | Keep |
| initAppVersion.cjs | Release/Config | Medium | Active | Keep |
| convert-to-root-imports.cjs | Codemod Utility | Medium | Needs Review | Keep only if still used; otherwise archive |
| scan-packages-for-test-code.cjs | Utility | Low | Needs Review | Keep single canonical version |
| scan-packages-for-test-code.js | Utility | Low | Remove Candidate | Remove duplicate after confirming .cjs is canonical |
| sendPushOnNotificationCreate.js | Utility/Legacy | Medium | Remove Candidate | Remove if replaced by functions/sendPushOnNotificationCreate.ts flow |
| migrateTeamInvitationCodes.cjs | Migration (legacy) | Medium | Deprecated | Archive |
| migrateTenantInvitationCodes.cjs | Migration (legacy) | Medium | Deprecated | Archive |

## Scripts To Keep

- cleanupFirebaseTestUsers.cjs
- cleanupOptionalGroupLinks.cjs
- cleanupSharedPropertiesData.cjs
- migrateFixReportAccountIntegrity.cjs
- migrateMaintenanceHistoryToEvents.cjs
- migratePropertyGroupMemberships.cjs
- migratePruneInactiveUserData.cjs
- testFirebaseRules.cjs
- testStorageRules.cjs
- generateReleaseNotes.cjs
- initAppVersion.cjs

## Scripts Needing Review

- initFirestore.cjs
- seedFirestore.cjs
- migrateRemoveOrphanedData.cjs (legacy collection references)
- convert-to-root-imports.cjs
- syncAppVersion.cjs
- updateAppVersion.cjs
- seedFirestoreAuth.cjs
- debugRecurringTasks.cjs
- testContractorsQuery.cjs
- testDevicesQuery.cjs
- testFirebaseAdmin.cjs
- test-push-notifications.cjs
- trigger-push-notification.cjs
- e2e:clean/e2e:full/e2e:ci package scripts (Windows shell portability)
- deploy package script (verify target remains gh-pages)

## Scripts Safe To Archive

- addExtensiveMaintenanceHistory.cjs
- addUnitLevelMaintenanceHistory.cjs
- migrateAddDevicesToProperties.cjs
- migrateAddMockDataForPropertyUser.cjs
- migrateAddRecurringFields.cjs
- migrateAddSubscriptions.cjs
- migrateAddUserToMyTeam.cjs
- migrateDefaultGroups.cjs
- migrateDeviceUserIds.cjs
- migrateFixTeamMemberUserIds.cjs
- migrateRemoveSharedPropertiesGroups.cjs
- migrateTasksAssignedToObject.cjs
- migrateTasksMissingFields.cjs
- migrateUserRolesBySubscription.cjs
- updateContractorsPropertyId.cjs
- updateContractorsStructure.cjs
- migrateTeamInvitationCodes.cjs
- migrateTenantInvitationCodes.cjs

## Scripts Recommended For Removal

- scan-packages-for-test-code.js (duplicate of .cjs utility)
- sendPushOnNotificationCreate.js (unreferenced legacy helper; overlaps with Cloud Functions implementation path)

## Documentation Updates Recommended

1. Update scripts/README.md to reflect current .cjs files and remove references to scripts/seedFirestore.js and src/data/mockData.ts as active source-of-truth.
2. Add explicit deprecation/archive status for legacy migration scripts in project-docs/docs/Development/SCRIPTS_AND_UTILITIES.md.
3. Document Windows shell caveats for package scripts that depend on rm, timeout, and bash.
4. Add a migration runbook section for high-risk apply scripts:
   - required backup step
   - dry-run verification checklist
   - approval requirements
5. Clarify maintenanceHistory sunset plan and the expected retention window for bridge migrations.

## Notable Findings

- Legacy collection names are still referenced in active cleanup flow:
  - migrateRemoveOrphanedData.cjs references tenantPromoCodes and teamMemberPromoCodes.
- Seeding docs and implementation messaging are out of sync:
  - scripts/README.md still describes mockData.ts-driven seeding as active, while script uses hardcoded data.
- Multiple scripts remain one-time historical migrations and are not referenced by package scripts; they are strong archive candidates.
- High-risk scripts generally have good dry-run support among active cleanup/migration tools, with notable exceptions in older legacy migrations.

## Package.json-Only Cleanup Proposal (No Script File Changes)

Scope requested:
- validate vs test:build
- gh-pages deploy
- e2e shell portability
- version script aliases

### 1) validate vs test:build

Current state:
- `test:build` and `validate` run the same command chain.

Proposal:
- Keep one canonical script (`validate`) and make `test:build` an alias to it, or remove `test:build`.
- Prefer explicit `validate` as the CI-facing entrypoint.

### 2) gh-pages deploy

Current state:
- `deploy` uses `gh-pages -d build` while Firebase Hosting is configured in repository.

Proposal:
- Decide one primary deploy path.
- If Firebase is primary, deprecate or rename `deploy` to `deploy:gh-pages` to avoid accidental wrong-target deploys.
- Keep `predeploy` aligned to the chosen path.

### 3) e2e shell portability

Current state:
- `e2e:clean`, `e2e:full`, and `e2e:ci` use Unix shell utilities (`rm`, `timeout`).

Proposal:
- Replace shell-dependent segments with Node-based utilities or cross-platform packages.
- Keep `e2e`, `e2e:ui`, `e2e:debug`, and browser-specific scripts unchanged.

### 4) version script aliases

Current state:
- `initAppVersion.cjs` is wired through `build:apk`.
- `updateAppVersion.cjs` and `syncAppVersion.cjs` are useful but unreferenced.

Proposal:
- Add explicit package aliases without touching script internals, for example:
  - `version:init` -> `node scripts/initAppVersion.cjs`
  - `version:update` -> `node scripts/updateAppVersion.cjs <version> [notes]`
  - `version:sync` -> `node scripts/syncAppVersion.cjs`
- Do not consolidate script logic yet.
