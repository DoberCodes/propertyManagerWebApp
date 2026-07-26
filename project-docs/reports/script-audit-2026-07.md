# Script Audit - 2026-07

Generated: 2026-07-26T03:40:58.404Z
Mode: report-only (no cleanup or migration actions performed)

## Summary

- Package manifests scanned: 3
- Active scripts scanned (scripts/): 65
- Archived scripts scanned (scripts/archive/): 19
- Alias scripts detected: 1
- Missing script targets: 0
- Unreferenced active scripts: 15
- Duplicate filenames: 0
- Risky scripts detected: 29
- Risky scripts without dry-run signal: 18

## Package Script Aliases

| Package | Script | Alias Target | Target Exists |
|---|---|---|---|
| package.json | test:build | validate | yes |

## Missing Script Targets

- None found.

## Unreferenced Active Scripts (scripts/)

- scripts/auditTasksSchema.cjs
- scripts/checkDeviceLocations.cjs
- scripts/convert-to-root-imports.cjs
- scripts/debugRecurringTasks.cjs
- scripts/migrateFixDeviceStructure.cjs
- scripts/scan-packages-for-test-code.cjs
- scripts/seedFirestoreAuth.cjs
- scripts/sendPushOnNotificationCreate.js
- scripts/test-push-notifications.cjs
- scripts/testContractorsQuery.cjs
- scripts/testDevicesQuery.cjs
- scripts/testFirebaseAdmin.cjs
- scripts/testRecurrence.cjs
- scripts/testRecurrenceLogic.cjs
- scripts/trigger-push-notification.cjs

## Unreferenced Archived Scripts (scripts/archive/)

- scripts/archive/addExtensiveMaintenanceHistory.cjs
- scripts/archive/addUnitLevelMaintenanceHistory.cjs
- scripts/archive/generateReleaseNotes.legacy.cjs
- scripts/archive/migrateAddDevicesToProperties.cjs
- scripts/archive/migrateAddMockDataForPropertyUser.cjs
- scripts/archive/migrateAddRecurringFields.cjs
- scripts/archive/migrateAddSubscriptions.cjs
- scripts/archive/migrateAddUserToMyTeam.cjs
- scripts/archive/migrateDefaultGroups.cjs
- scripts/archive/migrateDeviceUserIds.cjs
- scripts/archive/migrateFixTeamMemberUserIds.cjs
- scripts/archive/migrateRemoveSharedPropertiesGroups.cjs
- scripts/archive/migrateTasksAssignedToObject.cjs
- scripts/archive/migrateTasksMissingFields.cjs
- scripts/archive/migrateTeamInvitationCodes.cjs
- scripts/archive/migrateTenantInvitationCodes.cjs
- scripts/archive/migrateUserRolesBySubscription.cjs
- scripts/archive/updateContractorsPropertyId.cjs
- scripts/archive/updateContractorsStructure.cjs

## Duplicate Filenames Across scripts/ and scripts/archive/

- None found.

## Risky Script Signals

| Script | Risky Terms | Dry-Run Signal |
|---|---|---|
| scripts/archive/addExtensiveMaintenanceHistory.cjs | remove | no |
| scripts/archive/addUnitLevelMaintenanceHistory.cjs | remove | no |
| scripts/archive/migrateRemoveSharedPropertiesGroups.cjs | delete, remove | no |
| scripts/archive/migrateTeamInvitationCodes.cjs | delete | no |
| scripts/archive/migrateTenantInvitationCodes.cjs | delete, remove | no |
| scripts/auditDecisions.cjs | remove | no |
| scripts/auditScripts.cjs | apply, delete, prune, remove | yes |
| scripts/checkEntitlementBoundaries.cjs | delete | no |
| scripts/cleanupFirebaseTestUsers.cjs | apply, delete, remove | yes |
| scripts/cleanupOptionalGroupLinks.cjs | apply, delete, remove | yes |
| scripts/cleanupSharedPropertiesData.cjs | apply, delete, remove | yes |
| scripts/generateMaintleyContentIdea.cjs | remove | yes |
| scripts/initFirestore.cjs | delete | no |
| scripts/migrateEquipmentTerminology.cjs | apply | yes |
| scripts/migrateFeedbackTicketNumbers.cjs | apply | no |
| scripts/migrateFixDeviceStructure.cjs | delete, remove | no |
| scripts/migrateFixReportAccountIntegrity.cjs | apply | no |
| scripts/migrateMaintenanceHistoryToEvents.cjs | apply, delete | yes |
| scripts/migratePropertyGroupMemberships.cjs | apply, delete, remove | yes |
| scripts/migratePruneInactiveUserData.cjs | prune, remove | no |
| scripts/migrateRemoveOrphanedData.cjs | apply, delete, remove | yes |
| scripts/migrateTenantDataReduction.cjs | apply, delete | no |
| scripts/promoteAdrCandidates.cjs | apply | yes |
| scripts/seedDemoAccount.cjs | apply, delete, remove | yes |
| scripts/testEmailTemplates.cjs | delete | no |
| scripts/testEntitlementGrantIssuance.cjs | delete | no |
| scripts/testFirestoreRules.cjs | delete | no |
| scripts/testMaintleyEventEngine.cjs | apply, delete | no |
| scripts/testStorageRules.cjs | delete | no |

## Scripts With Risky Terms But No Dry-Run Signal

- scripts/archive/addExtensiveMaintenanceHistory.cjs
- scripts/archive/addUnitLevelMaintenanceHistory.cjs
- scripts/archive/migrateRemoveSharedPropertiesGroups.cjs
- scripts/archive/migrateTeamInvitationCodes.cjs
- scripts/archive/migrateTenantInvitationCodes.cjs
- scripts/auditDecisions.cjs
- scripts/checkEntitlementBoundaries.cjs
- scripts/initFirestore.cjs
- scripts/migrateFeedbackTicketNumbers.cjs
- scripts/migrateFixDeviceStructure.cjs
- scripts/migrateFixReportAccountIntegrity.cjs
- scripts/migratePruneInactiveUserData.cjs
- scripts/migrateTenantDataReduction.cjs
- scripts/testEmailTemplates.cjs
- scripts/testEntitlementGrantIssuance.cjs
- scripts/testFirestoreRules.cjs
- scripts/testMaintleyEventEngine.cjs
- scripts/testStorageRules.cjs

## Notes

- This report does not move, delete, or modify scripts.
- Use report findings as input to manual cleanup planning.
