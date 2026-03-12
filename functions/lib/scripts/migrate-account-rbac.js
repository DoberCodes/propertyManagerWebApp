"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const ACCOUNT_SCOPED_COLLECTIONS = [
    { name: 'propertyGroups', ownerField: 'userId' },
    { name: 'properties', ownerField: 'userId' },
    { name: 'tasks', ownerField: 'userId' },
    { name: 'teamGroups', ownerField: 'userId' },
    { name: 'teamMembers', ownerField: 'userId' },
    { name: 'units', ownerField: 'userId' },
    { name: 'devices', ownerField: 'userId' },
    { name: 'suites', ownerField: 'userId' },
    { name: 'contractors', ownerField: 'userId' },
    { name: 'maintenanceHistory', ownerField: 'userId' },
    { name: 'tenantInvitationCodes', ownerField: 'landlordId' },
    { name: 'tenantProfiles', ownerField: 'landlordId' },
];
const roleToPermissionRoles = (role) => {
    if (!role)
        return ['member'];
    if (role === 'admin')
        return ['admin'];
    if (role === 'property_manager' ||
        role === 'assistant_manager' ||
        role === 'maintenance_lead') {
        return ['manager'];
    }
    if (role === 'tenant')
        return ['tenant'];
    return ['member'];
};
const membershipDocId = (accountId, userId) => `${accountId}_${userId}`;
const upsertMembership = async (accountId, userId, roles, source) => {
    const ref = db
        .collection('accountMemberships')
        .doc(membershipDocId(accountId, userId));
    await ref.set({
        accountId,
        userId,
        status: 'active',
        roles: admin.firestore.FieldValue.arrayUnion(...roles),
        source,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
};
const migrateUsersAndMemberships = async () => {
    const userMap = new Map();
    const usersSnapshot = await db.collection('users').get();
    for (const userDoc of usersSnapshot.docs) {
        const uid = userDoc.id;
        const data = (userDoc.data() || {});
        const accountId = String(data.accountId || uid).trim() || uid;
        const isAccountOwner = accountId === uid || data.isAccountOwner === true;
        userMap.set(uid, { accountId, role: data.role });
        await userDoc.ref.set({
            accountId,
            isAccountOwner,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        await upsertMembership(accountId, uid, [
            ...(isAccountOwner ? ['account_owner', 'admin'] : []),
            ...roleToPermissionRoles(data.role),
        ], 'user-migration');
    }
    return userMap;
};
const migrateFamilyMemberships = async (userMap) => {
    var _a;
    const familySnapshot = await db.collection('familyAccounts').get();
    for (const familyDoc of familySnapshot.docs) {
        const accountId = familyDoc.id;
        const familyData = familyDoc.data() || {};
        const ownerId = String(familyData.ownerId || '').trim();
        const memberIds = Array.isArray(familyData.memberIds)
            ? familyData.memberIds
            : [];
        if (ownerId) {
            await upsertMembership(accountId, ownerId, ['family_owner', 'account_owner', 'admin'], 'family-migration');
        }
        for (const memberId of memberIds) {
            if (!memberId)
                continue;
            if (memberId === ownerId)
                continue;
            const userRole = (_a = userMap.get(memberId)) === null || _a === void 0 ? void 0 : _a.role;
            const familyRole = userRole === 'admin' ? 'family_admin' : 'family_member';
            await upsertMembership(accountId, memberId, [familyRole, ...(userRole === 'admin' ? ['admin'] : ['member'])], 'family-migration');
            const userRef = db.collection('users').doc(memberId);
            await userRef.set({
                accountId,
                isAccountOwner: false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
    }
};
const migrateCollectionAccountIds = async (userMap) => {
    var _a;
    for (const migration of ACCOUNT_SCOPED_COLLECTIONS) {
        const snapshot = await db.collection(migration.name).get();
        const writer = db.bulkWriter();
        let updatedCount = 0;
        for (const document of snapshot.docs) {
            const data = document.data();
            const ownerUserId = String(data[migration.ownerField] || '').trim();
            if (!ownerUserId)
                continue;
            const accountId = ((_a = userMap.get(ownerUserId)) === null || _a === void 0 ? void 0 : _a.accountId) || ownerUserId;
            const currentAccountId = String(data.accountId || '').trim();
            if (currentAccountId === accountId)
                continue;
            writer.set(document.ref, {
                accountId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            updatedCount += 1;
        }
        await writer.close();
        console.log(`Migrated ${updatedCount} docs in ${migration.name}`);
    }
};
const migrateTenantsToMemberships = async () => {
    const tenantProfiles = await db.collection('tenantProfiles').get();
    for (const tenantDoc of tenantProfiles.docs) {
        const data = tenantDoc.data();
        const accountId = String(data.accountId || '').trim();
        const tenantId = String(data.tenantId || '').trim();
        if (!accountId || !tenantId)
            continue;
        await upsertMembership(accountId, tenantId, ['tenant'], 'tenant-migration');
    }
};
const run = async () => {
    console.log('Starting account RBAC migration...');
    const userMap = await migrateUsersAndMemberships();
    console.log(`Processed ${userMap.size} users`);
    await migrateFamilyMemberships(userMap);
    console.log('Family memberships migrated');
    await migrateCollectionAccountIds(userMap);
    console.log('Account-scoped collections migrated');
    await migrateTenantsToMemberships();
    console.log('Tenant memberships migrated');
    console.log('Account RBAC migration completed successfully');
};
run()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
