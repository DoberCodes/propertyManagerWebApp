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
exports.deletePropertyGroupCascade = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const accountAuthz_1 = require("./accountAuthz");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const PROPERTY_GROUP_DELETE_ROLES = ['account_owner', 'admin', 'manager'];
const BATCH_LIMIT = 450;
const toString = (value) => String(value || '').trim();
const chunk = (items, size) => {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
};
const deleteDocs = async (docs, deleted, label) => {
    if (docs.length === 0)
        return;
    for (const docsChunk of chunk(docs, BATCH_LIMIT)) {
        const batch = db.batch();
        docsChunk.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        deleted[label] = (deleted[label] || 0) + docsChunk.length;
    }
};
const updateDocs = async (docs, updated, label) => {
    if (docs.length === 0)
        return;
    for (const docsChunk of chunk(docs, BATCH_LIMIT)) {
        const batch = db.batch();
        docsChunk.forEach((doc) => {
            batch.update(doc.ref, {
                groupId: admin.firestore.FieldValue.delete(),
                updatedAt: new Date().toISOString(),
            });
        });
        await batch.commit();
        updated[label] = (updated[label] || 0) + docsChunk.length;
    }
};
exports.deletePropertyGroupCascade = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    var _a;
    const uid = toString((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid);
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to delete a property group.');
    }
    const groupId = toString(data === null || data === void 0 ? void 0 : data.groupId);
    if (!groupId) {
        throw new functions.https.HttpsError('invalid-argument', 'groupId is required.');
    }
    const groupRef = db.collection('propertyGroups').doc(groupId);
    const groupSnapshot = await groupRef.get();
    if (!groupSnapshot.exists) {
        return {
            success: true,
            groupId,
            accountId: '',
            deleted: {},
            updated: {},
        };
    }
    const groupData = groupSnapshot.data() || {};
    const accountId = toString(groupData.accountId) || toString(groupData.userId);
    if (!accountId) {
        throw new functions.https.HttpsError('failed-precondition', 'Property group is missing account ownership data.');
    }
    await (0, accountAuthz_1.assertAccountRole)(uid, accountId, PROPERTY_GROUP_DELETE_ROLES);
    const deleted = {};
    const updated = {};
    const membershipsSnapshot = await db
        .collection('propertyGroupMemberships')
        .where('groupId', '==', groupId)
        .get();
    await deleteDocs(membershipsSnapshot.docs, deleted, 'propertyGroupMemberships');
    const legacyPropertiesSnapshot = await db
        .collection('properties')
        .where('groupId', '==', groupId)
        .get();
    await updateDocs(legacyPropertiesSnapshot.docs, updated, 'properties');
    await groupRef.delete();
    deleted.propertyGroups = (deleted.propertyGroups || 0) + 1;
    functions.logger.info('Property group cascade delete complete', {
        groupId,
        accountId,
        deleted,
        updated,
    });
    return {
        success: true,
        groupId,
        accountId,
        deleted,
        updated,
    };
});
