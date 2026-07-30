# Archived Scripts

These scripts are retained for historical reference only.

Do not run archived scripts without:

1. Reviewing the current architecture and data model.
2. Confirming the script still applies to current collections and fields.
3. Running in a safe environment first.
4. Taking backups for any production-impacting operations.

Many archived scripts are one-time legacy migrations and may reference deprecated fields or collections.

The following artifacts were archived during the July 2026 removal-safety
cleanup because they may still help explain or verify historical data:

* `auditTasksSchema.cjs` - historical task-schema inventory.
* `checkDeviceLocations.cjs` - historical device Unit/Suite location query.
* `debugRecurringTasks.cjs` - historical recurring-task diagnostic.
* `migrateFixDeviceStructure.cjs` - mutating device-structure migration with
  hard-coded historical fixtures and no dry-run guard.

These four files must not be treated as current runbooks or executed against
production without a new technical and data-safety review.
