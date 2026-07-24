#!/usr/bin/env node

/**
 * Compatibility entrypoint.
 *
 * Inactive-user pruning is now part of the account-aware orphan cleanup. Keep
 * this filename so existing operator commands use the same guarded workflow.
 */

require("./migrateRemoveOrphanedData.cjs");
