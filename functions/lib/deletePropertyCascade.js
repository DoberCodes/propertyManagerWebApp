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
exports.deletePropertyCascade = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const accountAuthz_1 = require("./accountAuthz");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const PROPERTY_DELETE_ROLES = ['account_owner', 'admin', 'manager'];
const DELETE_BATCH_LIMIT = 450;
const toString = (value) => String(value || '').trim();
const chunk = (items, size) => {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
};
const queryByPropertyId = async (collectionName, propertyId, accountId) => {
    const base = db.collection(collectionName).where('propertyId', '==', propertyId);
    const scoped = accountId ? base.where('accountId', '==', accountId) : base;
    const snapshot = await scoped.get();
    return snapshot.docs;
};
const queryByNestedPropertyId = async (collectionName, propertyId, accountId) => {
    const base = db
        .collection(collectionName)
        .where('location.propertyId', '==', propertyId);
    const scoped = accountId ? base.where('accountId', '==', accountId) : base;
    const snapshot = await scoped.get();
    return snapshot.docs;
};
const queryByNestedDataPropertyId = async (collectionName, propertyId) => {
    const snapshot = await db
        .collection(collectionName)
        .where('data.propertyId', '==', propertyId)
        .get();
    return snapshot.docs;
};
const queryByPropertyTitle = async (collectionName, propertyTitle, accountId) => {
    if (!propertyTitle)
        return [];
    const snapshot = await db
        .collection(collectionName)
        .where('accountId', '==', accountId)
        .where('propertyTitle', '==', propertyTitle)
        .get();
    return snapshot.docs;
};
const deleteDocs = async (docs, deleted, label) => {
    if (docs.length === 0)
        return;
    for (const docsChunk of chunk(docs, DELETE_BATCH_LIMIT)) {
        const batch = db.batch();
        docsChunk.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        deleted[label] = (deleted[label] || 0) + docsChunk.length;
    }
};
const updateDocs = async (updates, updated, label) => {
    if (updates.length === 0)
        return;
    for (const updatesChunk of chunk(updates, DELETE_BATCH_LIMIT)) {
        const batch = db.batch();
        updatesChunk.forEach((update) => batch.update(update.ref, update.data));
        await batch.commit();
        updated[label] = (updated[label] || 0) + updatesChunk.length;
    }
};
const deletePropertyScopedCollections = async (propertyId, accountId, propertyTitle, deleted) => {
    const propertyScopedCollections = [
        'tasks',
        'suites',
        'units',
        'contractors',
        'maintenanceEvents',
        'maintenanceHistory',
        'propertyShares',
        'userInvitations',
        'tenantInvitationCodes',
        'tenantProfiles',
        'favorites',
        'maintenanceRequests',
        'propertySpaces',
        'propertySupplies',
        'propertyKnowledgeLinks',
    ];
    for (const collectionName of propertyScopedCollections) {
        const docs = await queryByPropertyId(collectionName, propertyId);
        if (collectionName === 'tasks') {
            await deleteTaskReminderDeliveriesForTasks(docs.map((doc) => doc.id), deleted);
        }
        await deleteDocs(docs, deleted, collectionName);
    }
    await deleteDocs(await queryByNestedDataPropertyId('notifications', propertyId), deleted, 'notifications');
    for (const collectionName of ['maintenanceEvents', 'maintenanceHistory']) {
        await deleteDocs(await queryByPropertyTitle(collectionName, propertyTitle, accountId), deleted, `${collectionName}ByTitle`);
    }
};
const deleteTaskReminderDeliveriesForTasks = async (taskIds, deleted) => {
    for (const taskIdChunk of chunk(taskIds, 10)) {
        if (taskIdChunk.length === 0)
            continue;
        const snapshot = await db
            .collection('taskReminderEmailDeliveries')
            .where('taskId', 'in', taskIdChunk)
            .get();
        await deleteDocs(snapshot.docs, deleted, 'taskReminderEmailDeliveries');
    }
};
const deleteDeviceScopedCollections = async (propertyId, _accountId, deleted) => {
    const devices = await queryByNestedPropertyId('devices', propertyId);
    await deleteDocs(devices, deleted, 'devices');
};
const deleteGroupMemberships = async (propertyId, accountId, deleted) => {
    const docs = await queryByPropertyId('propertyGroupMemberships', propertyId, accountId);
    await deleteDocs(docs, deleted, 'propertyGroupMemberships');
};
const removePropertyFromTeamMembers = async (propertyId, accountId, updated) => {
    const teamMembersSnapshot = await db
        .collection('teamMembers')
        .where('accountId', '==', accountId)
        .where('linkedProperties', 'array-contains', propertyId)
        .get();
    const updates = teamMembersSnapshot.docs.map((doc) => {
        const data = doc.data();
        const linkedProperties = Array.isArray(data.linkedProperties)
            ? data.linkedProperties.filter((id) => id !== propertyId)
            : [];
        return {
            ref: doc.ref,
            data: {
                linkedProperties,
                updatedAt: new Date().toISOString(),
            },
        };
    });
    await updateDocs(updates, updated, 'teamMembers');
};
const removePropertyFromTeamMemberInvites = async (propertyId, accountId, updated) => {
    const inviteSnapshot = await db
        .collection('teamMemberInvitationCodes')
        .where('accountId', '==', accountId)
        .where('linkedProperties', 'array-contains', propertyId)
        .get();
    const updates = inviteSnapshot.docs.map((doc) => {
        const data = doc.data();
        const linkedProperties = Array.isArray(data.linkedProperties)
            ? data.linkedProperties.filter((id) => id !== propertyId)
            : [];
        return {
            ref: doc.ref,
            data: {
                linkedProperties,
                updatedAt: new Date().toISOString(),
            },
        };
    });
    await updateDocs(updates, updated, 'teamMemberInvitationCodes');
};
const updateAccountCounters = async (accountId, deletedDeviceCount) => {
    const accountRef = db.collection('familyAccounts').doc(accountId);
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(accountRef);
        if (!snapshot.exists)
            return;
        const data = snapshot.data() || {};
        const propertyCount = Number(data.propertyCount || 0);
        const deviceCount = Number(data.deviceCount || 0);
        transaction.update(accountRef, {
            propertyCount: Math.max(0, propertyCount - 1),
            deviceCount: Math.max(0, deviceCount - deletedDeviceCount),
            updatedAt: new Date().toISOString(),
        });
    });
};
exports.deletePropertyCascade = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    const uid = toString(context.auth?.uid);
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to delete a property.');
    }
    const propertyId = toString(data?.propertyId);
    if (!propertyId) {
        throw new functions.https.HttpsError('invalid-argument', 'propertyId is required.');
    }
    const propertyRef = db.collection('properties').doc(propertyId);
    const propertySnapshot = await propertyRef.get();
    if (!propertySnapshot.exists) {
        return {
            success: true,
            propertyId,
            accountId: '',
            deleted: {},
            updated: {},
        };
    }
    const propertyData = propertySnapshot.data() || {};
    const accountId = toString(propertyData.accountId) || toString(propertyData.userId);
    const propertyTitle = toString(propertyData.title);
    if (!accountId) {
        throw new functions.https.HttpsError('failed-precondition', 'Property is missing account ownership data.');
    }
    await (0, accountAuthz_1.assertAccountRole)(uid, accountId, PROPERTY_DELETE_ROLES);
    const deleted = {};
    const updated = {};
    await deletePropertyScopedCollections(propertyId, accountId, propertyTitle, deleted);
    await deleteDeviceScopedCollections(propertyId, accountId, deleted);
    await deleteGroupMemberships(propertyId, accountId, deleted);
    await removePropertyFromTeamMembers(propertyId, accountId, updated);
    await removePropertyFromTeamMemberInvites(propertyId, accountId, updated);
    await propertyRef.delete();
    deleted.properties = (deleted.properties || 0) + 1;
    await updateAccountCounters(accountId, deleted.devices || 0);
    functions.logger.info('Property cascade delete complete', {
        propertyId,
        accountId,
        deleted,
        updated,
    });
    return {
        success: true,
        propertyId,
        accountId,
        deleted,
        updated,
    };
});
