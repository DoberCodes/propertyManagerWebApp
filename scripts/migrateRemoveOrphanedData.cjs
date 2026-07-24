#!/usr/bin/env node

/**
 * Firestore orphan cleanup.
 *
 * Firebase Auth is authoritative for whether a user exists. The script removes
 * Firestore data that can be proven to belong only to deleted Auth users or to
 * accounts with no remaining Auth-backed owner/member. It also removes empty
 * property and team groups after evaluating both current and legacy links.
 *
 * Safety:
 * - Dry-run by default.
 * - Apply requires the exact Firebase project id and a deletion phrase.
 * - Apply requires an operator-supplied backup/export reference.
 * - Apply aborts if the planned delete count exceeds --max-delete.
 * - Every planned mutation is printed with its reason.
 * - Any read or write failure aborts the run.
 *
 * Usage:
 *   node scripts/migrateRemoveOrphanedData.cjs
 *   node scripts/migrateRemoveOrphanedData.cjs --report=cleanup-report.json
 *   node scripts/migrateRemoveOrphanedData.cjs --apply \
 *     --confirm-project=<firebase-project-id> \
 *     --confirm-delete=DELETE_ORPHANED_DATA \
 *     --backup-reference=<firestore-export-or-backup-id> \
 *     --max-delete=100
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const APPLY_CONFIRMATION = "DELETE_ORPHANED_DATA";
const DEFAULT_MAX_DELETE = 100;

function parseArgs(argv) {
  const values = new Map();
  const flags = new Set();
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const separator = arg.indexOf("=");
    if (separator === -1) {
      flags.add(arg.slice(2));
    } else {
      values.set(arg.slice(2, separator), arg.slice(separator + 1));
    }
  }
  return { flags, values };
}

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.resolve(__dirname, "../serviceAccountKey.json");
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      `Service account not found at ${serviceAccountPath}. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.`,
    );
  }
  return JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
}

function normalizeId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function nestedValue(data, fieldPath) {
  return fieldPath.split(".").reduce((value, key) => value?.[key], data);
}

function validStringArray(value) {
  return Array.isArray(value) ? value.map(normalizeId).filter(Boolean) : [];
}

const { flags, values } = parseArgs(process.argv.slice(2));
const isApply = flags.has("apply");
const reportPath = values.get("report");
const maxDelete = Number(values.get("max-delete") || DEFAULT_MAX_DELETE);

if (flags.has("help")) {
  console.log("Run without --apply for a read-only preview.");
  console.log(
    "Apply requires --apply --confirm-project=<id> --confirm-delete=DELETE_ORPHANED_DATA --backup-reference=<id> [--max-delete=100].",
  );
  process.exit(0);
}

if (!Number.isInteger(maxDelete) || maxDelete < 0) {
  throw new Error("--max-delete must be a non-negative integer.");
}

const serviceAccount = loadServiceAccount();
const projectId = normalizeId(serviceAccount.project_id);
if (!projectId)
  throw new Error("The Firebase service account has no project_id.");

if (isApply) {
  if (values.get("confirm-project") !== projectId) {
    throw new Error(
      `Apply refused. Pass --confirm-project=${projectId} after reviewing a dry-run from that project.`,
    );
  }
  if (values.get("confirm-delete") !== APPLY_CONFIRMATION) {
    throw new Error(
      `Apply refused. Pass --confirm-delete=${APPLY_CONFIRMATION} after reviewing the dry-run.`,
    );
  }
  if (!normalizeId(values.get("backup-reference"))) {
    throw new Error(
      "Apply refused. Create or verify a recoverable Firestore backup/export, then pass its identifier with --backup-reference=<id>.",
    );
  }
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const auth = admin.auth();

// These collections use accountId as the durable ownership boundary. Records
// without accountId are evaluated by the more specific legacy rules below.
const ACCOUNT_SCOPED_COLLECTIONS = [
  "propertyGroups",
  "properties",
  "propertyDocuments",
  "propertyKnowledgeSuggestions",
  "propertyGroupMemberships",
  "propertyShares",
  "userInvitations",
  "tasks",
  "maintenanceHistory",
  "maintenanceEvents",
  "maintenanceEventRevisions",
  "propertyScanLatest",
  "propertyScanSnapshots",
  "teamGroups",
  "teamMembers",
  "devices",
  "suites",
  "units",
  "favorites",
  "notifications",
  "maintleyEvents",
  "contractors",
  "familyInvites",
  "tenantInvitationCodes",
  "tenantProfiles",
  "teamMemberInvitationCodes",
  "activityLogs",
  "recentlyViewed",
  "deviceSubscriptions",
  "taskReminderEmailDeliveries",
  "teamMemberTaskReportDeliveries",
];

const LEGACY_USER_OWNERSHIP = [
  { collection: "propertyGroups", fields: ["userId"] },
  { collection: "teamGroups", fields: ["userId"] },
  { collection: "teamMembers", fields: ["userId"] },
  { collection: "favorites", fields: ["userId"] },
  { collection: "tasks", fields: ["userId"] },
  { collection: "notifications", fields: ["userId"] },
  { collection: "contractors", fields: ["userId"] },
  { collection: "maintenanceHistory", fields: ["userId"] },
  { collection: "tenantProfiles", fields: ["landlordId"] },
  { collection: "familyInvites", fields: ["createdByUserId"] },
  { collection: "tenantInvitationCodes", fields: ["createdByUserId"] },
  { collection: "teamMemberInvitationCodes", fields: ["createdByUserId"] },
  { collection: "tenantPromoCodes", fields: ["userId"] },
  { collection: "teamMemberPromoCodes", fields: ["userId"] },
  { collection: "activityLogs", fields: ["userId"] },
  { collection: "recentlyViewed", fields: ["userId"] },
  { collection: "deviceSubscriptions", fields: ["userId"] },
  { collection: "taskReminderEmailDeliveries", fields: ["recipientUserId"] },
  { collection: "userPreferences", fields: ["userId"] },
];

const PROPERTY_RELATIONS = [
  { collection: "tasks", field: "propertyId" },
  { collection: "suites", field: "propertyId" },
  { collection: "units", field: "propertyId" },
  { collection: "devices", field: "location.propertyId" },
  { collection: "propertyDocuments", field: "propertyId" },
  { collection: "propertyKnowledgeSuggestions", field: "propertyId" },
  { collection: "propertyShares", field: "propertyId" },
  { collection: "userInvitations", field: "propertyId" },
  { collection: "tenantInvitationCodes", field: "propertyId" },
  { collection: "tenantProfiles", field: "propertyId" },
  { collection: "maintenanceHistory", field: "propertyId" },
  { collection: "maintenanceEvents", field: "propertyId" },
  { collection: "maintenanceEventRevisions", field: "propertyId" },
  { collection: "propertyScanSnapshots", field: "propertyId" },
  { collection: "maintenanceRequests", field: "propertyId" },
  { collection: "notifications", field: "data.propertyId" },
  { collection: "contractors", field: "propertyId" },
  { collection: "favorites", field: "propertyId" },
  { collection: "propertyGroupMemberships", field: "propertyId" },
];

async function listAuthUserIds() {
  const ids = new Set();
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) ids.add(user.uid);
    pageToken = page.pageToken;
  } while (pageToken);
  return ids;
}

async function main() {
  console.log(`Firestore orphan cleanup: ${isApply ? "APPLY" : "DRY RUN"}`);
  console.log(`Firebase project: ${projectId}`);
  if (!isApply) console.log("No database changes will be made.");

  const cache = new Map();
  const scan = async (collection) => {
    if (!cache.has(collection)) {
      cache.set(collection, (await db.collection(collection).get()).docs);
    }
    return cache.get(collection);
  };

  const deletes = new Map();
  const updates = new Map();
  const addDelete = (ref, reason, category) => {
    updates.delete(ref.path);
    if (!deletes.has(ref.path))
      deletes.set(ref.path, { ref, reason, category });
  };
  const addUpdate = (ref, data, reason, category) => {
    if (deletes.has(ref.path)) return;
    const existing = updates.get(ref.path);
    updates.set(ref.path, {
      ref,
      data: { ...(existing?.data || {}), ...data },
      reason: existing ? `${existing.reason}; ${reason}` : reason,
      category: existing ? `${existing.category},${category}` : category,
    });
  };

  const activeUserIds = await listAuthUserIds();
  const manualReview = [];
  const [userDocs, familyAccountDocs, membershipDocs] = await Promise.all([
    scan("users"),
    scan("familyAccounts"),
    scan("accountMemberships"),
  ]);

  // An account remains active if any Auth-backed owner/member/user profile or
  // active membership reaches it. UID-as-account-id remains supported.
  const activeAccountIds = new Set(activeUserIds);
  for (const doc of userDocs) {
    if (!activeUserIds.has(doc.id)) continue;
    const accountId = normalizeId(doc.data().accountId);
    if (accountId) activeAccountIds.add(accountId);
  }
  for (const doc of familyAccountDocs) {
    const data = doc.data() || {};
    const linkedUsers = [
      normalizeId(data.ownerId),
      ...validStringArray(data.memberIds),
    ];
    if (linkedUsers.some((uid) => activeUserIds.has(uid)))
      activeAccountIds.add(doc.id);
  }
  for (const doc of membershipDocs) {
    const data = doc.data() || {};
    if (
      activeUserIds.has(normalizeId(data.userId)) &&
      normalizeId(data.status).toLowerCase() !== "disabled"
    ) {
      const accountId = normalizeId(data.accountId);
      if (accountId) activeAccountIds.add(accountId);
    }
  }

  // Auth is authoritative for user profiles and memberships.
  for (const doc of userDocs) {
    if (!activeUserIds.has(doc.id)) {
      addDelete(
        doc.ref,
        "user profile has no Firebase Auth user",
        "orphan-user",
      );
    }
  }
  for (const doc of await scan("userPreferences")) {
    const fieldUserId = normalizeId(doc.data().userId);
    const docIdIsInactiveUser = !activeUserIds.has(doc.id);
    const fieldDoesNotProtect = !fieldUserId || !activeUserIds.has(fieldUserId);
    if (docIdIsInactiveUser && fieldDoesNotProtect) {
      addDelete(
        doc.ref,
        "user preferences have no Firebase Auth user",
        "orphan-user-data",
      );
    }
  }
  for (const doc of membershipDocs) {
    const data = doc.data() || {};
    const userId = normalizeId(data.userId);
    const accountId = normalizeId(data.accountId);
    if (!userId || !activeUserIds.has(userId)) {
      addDelete(
        doc.ref,
        "membership user has no Firebase Auth user",
        "orphan-membership",
      );
    } else if (!accountId || !activeAccountIds.has(accountId)) {
      addDelete(
        doc.ref,
        "membership points to an inactive account",
        "orphan-membership",
      );
    }
  }

  // Inactive account documents and every nested grant/delivery document are
  // included. Firestore does not cascade subcollections automatically.
  const collectDocumentTree = async (docRef, reason) => {
    for (const subcollection of await docRef.listCollections()) {
      for (const child of (await subcollection.get()).docs) {
        await collectDocumentTree(child.ref, reason);
        addDelete(child.ref, reason, "orphan-account-child");
      }
    }
  };
  for (const doc of userDocs) {
    if (!activeUserIds.has(doc.id)) {
      await collectDocumentTree(
        doc.ref,
        "user profile has no Firebase Auth user",
      );
    }
  }
  for (const doc of familyAccountDocs) {
    if (activeAccountIds.has(doc.id)) continue;
    const reason =
      "account has no remaining Firebase Auth-backed owner or member";
    await collectDocumentTree(doc.ref, reason);
    addDelete(doc.ref, reason, "orphan-account");
  }
  for (const doc of familyAccountDocs) {
    if (!activeAccountIds.has(doc.id) || deletes.has(doc.ref.path)) continue;
    const data = doc.data() || {};
    const ownerId = normalizeId(data.ownerId);
    if (ownerId && !activeUserIds.has(ownerId)) {
      manualReview.push({
        path: doc.ref.path,
        reason: `ownerId ${ownerId} is absent from Firebase Auth, but the account still has an active member`,
      });
    }
    if (Array.isArray(data.memberIds)) {
      const memberIds = data.memberIds.filter((uid) =>
        activeUserIds.has(normalizeId(uid)),
      );
      if (memberIds.length !== data.memberIds.length) {
        addUpdate(
          doc.ref,
          { memberIds, updatedAt: new Date().toISOString() },
          "remove family members that no longer exist in Firebase Auth",
          "stale-user-reference",
        );
      }
    }
  }

  for (const collection of ACCOUNT_SCOPED_COLLECTIONS) {
    for (const doc of await scan(collection)) {
      const accountId = normalizeId(doc.data().accountId);
      if (accountId && !activeAccountIds.has(accountId)) {
        addDelete(
          doc.ref,
          `accountId ${accountId} has no active account`,
          "orphan-account-data",
        );
      }
    }
  }

  // Legacy records can be removed by user ownership only when no active
  // accountId protects them.
  for (const config of LEGACY_USER_OWNERSHIP) {
    for (const doc of await scan(config.collection)) {
      const data = doc.data() || {};
      const accountId = normalizeId(data.accountId);
      if (accountId && activeAccountIds.has(accountId)) continue;
      const ownerIds = config.fields
        .map((field) => normalizeId(nestedValue(data, field)))
        .filter(Boolean);
      if (
        ownerIds.length > 0 &&
        ownerIds.every((uid) => !activeUserIds.has(uid))
      ) {
        addDelete(
          doc.ref,
          `${config.fields.join("/")} has no Firebase Auth user`,
          "orphan-user-data",
        );
      }
    }
  }

  const propertyDocs = await scan("properties");
  const survivingPropertyIds = new Set();
  for (const doc of propertyDocs) {
    if (deletes.has(doc.ref.path)) continue;
    const data = doc.data() || {};
    const accountId = normalizeId(data.accountId);
    const directUsers = [normalizeId(data.userId), normalizeId(data.ownerId)];
    const sharedUsers = [
      ...validStringArray(data.coOwners),
      ...validStringArray(data.administrators),
      ...validStringArray(data.viewers),
    ];
    const hasActiveConnection =
      (accountId && activeAccountIds.has(accountId)) ||
      directUsers.some((uid) => activeUserIds.has(uid)) ||
      sharedUsers.some((uid) => activeUserIds.has(uid));
    if (hasActiveConnection) {
      survivingPropertyIds.add(doc.id);
    } else if (
      accountId ||
      directUsers.some(Boolean) ||
      sharedUsers.length > 0
    ) {
      addDelete(
        doc.ref,
        "property has no active user or account connection",
        "orphan-property",
      );
    } else {
      // Ambiguous unowned records are preserved rather than guessed at.
      survivingPropertyIds.add(doc.id);
    }
  }

  for (const relation of PROPERTY_RELATIONS) {
    for (const doc of await scan(relation.collection)) {
      if (deletes.has(doc.ref.path)) continue;
      const propertyId = normalizeId(nestedValue(doc.data(), relation.field));
      if (propertyId && !survivingPropertyIds.has(propertyId)) {
        addDelete(
          doc.ref,
          `${relation.field} ${propertyId} has no surviving property`,
          "orphan-property-data",
        );
      }
    }
  }

  const survivingTaskIds = new Set(
    (await scan("tasks"))
      .filter((doc) => !deletes.has(doc.ref.path))
      .map((doc) => doc.id),
  );
  for (const doc of await scan("taskReminderEmailDeliveries")) {
    if (deletes.has(doc.ref.path)) continue;
    const taskId = normalizeId(doc.data().taskId);
    if (taskId && !survivingTaskIds.has(taskId)) {
      addDelete(
        doc.ref,
        `taskId ${taskId} has no surviving task`,
        "orphan-task-data",
      );
    }
  }

  // Remove stale user references while preserving the shared property itself.
  for (const doc of propertyDocs) {
    if (deletes.has(doc.ref.path)) continue;
    const data = doc.data() || {};
    const patch = {};
    for (const field of ["coOwners", "administrators", "viewers"]) {
      if (!Array.isArray(data[field])) continue;
      const cleaned = data[field].filter((uid) =>
        activeUserIds.has(normalizeId(uid)),
      );
      if (cleaned.length !== data[field].length) patch[field] = cleaned;
    }
    if (Object.keys(patch).length > 0) {
      patch.updatedAt = new Date().toISOString();
      addUpdate(
        doc.ref,
        patch,
        "remove Firebase Auth users that no longer exist",
        "stale-user-reference",
      );
    }
  }

  const propertyGroupDocs = await scan("propertyGroups");
  const survivingPropertyGroupIds = new Set(
    propertyGroupDocs
      .filter((doc) => !deletes.has(doc.ref.path))
      .map((doc) => doc.id),
  );
  for (const property of propertyDocs) {
    if (deletes.has(property.ref.path)) continue;
    const data = property.data() || {};
    const groupId = normalizeId(data.groupId);
    if (
      Object.prototype.hasOwnProperty.call(data, "groupId") &&
      (!groupId || !survivingPropertyGroupIds.has(groupId))
    ) {
      addUpdate(
        property.ref,
        {
          groupId: admin.firestore.FieldValue.delete(),
          updatedAt: new Date().toISOString(),
        },
        "clear missing or invalid legacy property group link",
        "invalid-group-link",
      );
    }
  }
  const occupiedPropertyGroupIds = new Set();
  for (const membership of await scan("propertyGroupMemberships")) {
    if (deletes.has(membership.ref.path)) continue;
    const data = membership.data() || {};
    const groupId = normalizeId(data.groupId);
    const propertyId = normalizeId(data.propertyId);
    if (
      !groupId ||
      !survivingPropertyGroupIds.has(groupId) ||
      !propertyId ||
      !survivingPropertyIds.has(propertyId)
    ) {
      addDelete(
        membership.ref,
        "membership has no surviving property and group pair",
        "invalid-group-link",
      );
    } else {
      occupiedPropertyGroupIds.add(groupId);
    }
  }
  for (const property of propertyDocs) {
    if (deletes.has(property.ref.path)) continue;
    const groupId = normalizeId(property.data().groupId);
    if (groupId && survivingPropertyGroupIds.has(groupId))
      occupiedPropertyGroupIds.add(groupId);
  }
  for (const group of propertyGroupDocs) {
    if (deletes.has(group.ref.path)) continue;
    const embedded = group.data().properties;
    if (Array.isArray(embedded) && embedded.length > 0)
      occupiedPropertyGroupIds.add(group.id);
    if (!occupiedPropertyGroupIds.has(group.id)) {
      addDelete(
        group.ref,
        "property group has no memberships, legacy property links, or embedded properties",
        "empty-property-group",
      );
    }
  }

  const teamGroupDocs = await scan("teamGroups");
  const survivingTeamGroupIds = new Set(
    teamGroupDocs
      .filter((doc) => !deletes.has(doc.ref.path))
      .map((doc) => doc.id),
  );
  const occupiedTeamGroupIds = new Set();
  for (const member of await scan("teamMembers")) {
    if (deletes.has(member.ref.path)) continue;
    const groupId = normalizeId(member.data().groupId);
    if (groupId && survivingTeamGroupIds.has(groupId)) {
      occupiedTeamGroupIds.add(groupId);
    } else if (Object.prototype.hasOwnProperty.call(member.data(), "groupId")) {
      addUpdate(
        member.ref,
        {
          groupId: admin.firestore.FieldValue.delete(),
          updatedAt: new Date().toISOString(),
        },
        "clear missing or invalid team group link",
        "invalid-group-link",
      );
    }
  }
  for (const group of teamGroupDocs) {
    if (deletes.has(group.ref.path)) continue;
    const data = group.data() || {};
    const hasEmbeddedMembers =
      Array.isArray(data.members) && data.members.length > 0;
    const hasValidLinkedProperty = validStringArray(data.linkedProperties).some(
      (id) => survivingPropertyIds.has(id),
    );
    if (hasEmbeddedMembers || hasValidLinkedProperty)
      occupiedTeamGroupIds.add(group.id);
    if (!occupiedTeamGroupIds.has(group.id)) {
      addDelete(
        group.ref,
        "team group has no members, embedded members, or surviving linked properties",
        "empty-team-group",
      );
    }
  }

  const operations = [
    ...Array.from(deletes.values()).map((item) => ({
      type: "delete",
      ...item,
    })),
    ...Array.from(updates.values()).map((item) => ({
      type: "update",
      ...item,
    })),
  ].sort((a, b) => a.ref.path.localeCompare(b.ref.path));

  for (const operation of operations) {
    console.log(
      `${isApply ? operation.type.toUpperCase() : `WOULD ${operation.type.toUpperCase()}`} ${operation.ref.path} [${operation.category}] ${operation.reason}`,
    );
  }

  const summary = {
    mode: isApply ? "apply" : "dry-run",
    projectId,
    backupReference: normalizeId(values.get("backup-reference")) || null,
    activeAuthUsers: activeUserIds.size,
    activeAccounts: activeAccountIds.size,
    deletes: deletes.size,
    updates: updates.size,
    manualReview,
    byCategory: {},
    operations: operations.map((operation) => ({
      type: operation.type,
      path: operation.ref.path,
      category: operation.category,
      reason: operation.reason,
    })),
  };
  for (const operation of operations) {
    summary.byCategory[operation.category] =
      (summary.byCategory[operation.category] || 0) + 1;
  }

  console.log("\nCleanup summary:");
  console.table({
    mode: summary.mode,
    activeAuthUsers: summary.activeAuthUsers,
    activeAccounts: summary.activeAccounts,
    deletes: summary.deletes,
    updates: summary.updates,
  });
  console.table(summary.byCategory);
  if (manualReview.length > 0) {
    console.log("\nManual review required (preserved, not changed):");
    for (const item of manualReview)
      console.log(`REVIEW ${item.path}: ${item.reason}`);
  }

  if (reportPath) {
    const resolvedReportPath = path.resolve(process.cwd(), reportPath);
    fs.writeFileSync(
      resolvedReportPath,
      `${JSON.stringify(summary, null, 2)}\n`,
      "utf8",
    );
    console.log(`Report written to ${resolvedReportPath}`);
  }

  if (!isApply) {
    console.log(
      "\nDry-run complete. Review every planned mutation before applying.",
    );
    return;
  }
  if (deletes.size > maxDelete) {
    throw new Error(
      `Apply refused: ${deletes.size} deletes exceed --max-delete=${maxDelete}. Review the dry-run and set an intentional higher limit if appropriate.`,
    );
  }

  const writeOperations = [...deletes.values(), ...updates.values()];
  for (let offset = 0; offset < writeOperations.length; offset += 400) {
    const batch = db.batch();
    for (const operation of writeOperations.slice(offset, offset + 400)) {
      if (deletes.has(operation.ref.path)) batch.delete(operation.ref);
      else batch.update(operation.ref, operation.data);
    }
    await batch.commit();
  }
  console.log(`\nApplied ${deletes.size} deletes and ${updates.size} updates.`);
}

main().catch((error) => {
  console.error("\nCleanup failed. No later phases were attempted:", error);
  process.exitCode = 1;
});
