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
exports.publishMaintleyEvent = exports.publishMaintleyEventRecord = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const accountAuthz_1 = require("./accountAuthz");
const pushDelivery_1 = require("./pushDelivery");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const EVENTS_COLLECTION = 'maintleyEvents';
const NOTIFICATIONS_COLLECTION = 'notifications';
const toString = (value) => String(value || '').trim();
const stripUndefinedDeep = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((item) => stripUndefinedDeep(item))
            .filter((item) => item !== undefined);
    }
    if (value && typeof value === 'object') {
        const cleaned = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            const normalized = stripUndefinedDeep(nestedValue);
            if (normalized !== undefined) {
                cleaned[key] = normalized;
            }
        }
        return cleaned;
    }
    return value === undefined ? undefined : value;
};
const sanitizeDocIdPart = (value) => toString(value)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120) || 'event';
const createEventId = (workflowKey, entityKey) => `${sanitizeDocIdPart(workflowKey)}__${sanitizeDocIdPart(entityKey)}`;
const getRecipients = (event) => Array.from(new Set([
    ...(event.recipientIds || []),
    ...(event.userId ? [event.userId] : []),
].map(toString).filter(Boolean)));
const getNotificationType = (type) => {
    switch (type) {
        case 'document_review_started':
            return 'document_scan_started';
        case 'suggested_details_ready':
        case 'knowledge_imported':
        case 'document_review_failed':
            return 'document_scan_completed';
        case 'quick_scan_completed':
            return 'quick_scan_completed';
        case 'property_audit_completed':
            return 'property_audit_completed';
        case 'access_lifecycle':
            return 'other';
        case 'ticket_received':
        case 'ticket_in_progress':
        case 'ticket_testing_fix':
        case 'ticket_closed':
            return 'maintenance_request';
        default:
            return 'other';
    }
};
const shouldDefaultPush = (type) => {
    switch (type) {
        case 'document_review_started':
        case 'ticket_received':
        case 'property_audit_completed':
            return false;
        default:
            return true;
    }
};
const shouldCreateNotification = async (userId, notificationType) => {
    const [userDoc, preferencesDoc] = await Promise.all([
        db.collection('users').doc(userId).get(),
        db.collection('userPreferences').doc(userId).get(),
    ]);
    const user = userDoc.exists ? userDoc.data() : null;
    const fallbackPreferences = preferencesDoc.exists
        ? preferencesDoc.data()?.notificationPreferences
        : null;
    const preferences = user?.notificationPreferences || fallbackPreferences || null;
    if (preferences?.enabled === false) {
        return false;
    }
    return preferences?.types?.[notificationType] !== false;
};
const upsertMaintleyEvent = async (event, eventId, recipients, nowIso) => {
    const eventRef = db.collection(EVENTS_COLLECTION).doc(eventId);
    const eventHistoryEntry = stripUndefinedDeep({
        type: event.type,
        title: event.title,
        message: event.message,
        status: event.status,
        priority: event.priority || 'normal',
        createdAt: nowIso,
        metadata: event.metadata || {},
    });
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(eventRef);
        const existing = snapshot.exists ? snapshot.data() || {} : {};
        const createdAt = toString(existing.createdAt) || event.createdAt || nowIso;
        transaction.set(eventRef, stripUndefinedDeep({
            id: eventId,
            accountId: event.accountId,
            userId: event.userId,
            recipientIds: recipients,
            propertyId: event.propertyId,
            relatedDocumentId: event.relatedDocumentId,
            relatedTicketId: event.relatedTicketId,
            relatedScanId: event.relatedScanId,
            type: event.type,
            workflowKey: event.workflowKey,
            entityKey: event.entityKey,
            title: event.title,
            message: event.message,
            status: event.status,
            priority: event.priority || 'normal',
            actionLabel: event.actionLabel,
            actionUrl: event.actionUrl,
            createdAt,
            updatedAt: event.updatedAt || nowIso,
            metadata: event.metadata || {},
            eventHistory: admin.firestore.FieldValue.arrayUnion(eventHistoryEntry),
            channels: {
                in_app: event.inApp === false ? 'skipped' : 'pending',
                android_push: (event.push ?? shouldDefaultPush(event.type))
                    ? 'pending'
                    : 'skipped',
                web_push: 'not_implemented',
                email: 'not_implemented',
            },
        }), { merge: true });
    });
};
const upsertInAppNotification = async (event, eventId, recipientId, nowIso) => {
    const notificationType = getNotificationType(event.type);
    if (!(await shouldCreateNotification(recipientId, notificationType))) {
        return null;
    }
    const notificationId = `${eventId}__${sanitizeDocIdPart(recipientId)}`;
    const notificationRef = db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
    let notificationPayload = {};
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(notificationRef);
        const existing = snapshot.exists ? snapshot.data() || {} : {};
        const createdAt = toString(existing.createdAt) || event.createdAt || nowIso;
        const shouldMarkUnread = event.push ?? shouldDefaultPush(event.type);
        const nextStatus = shouldMarkUnread
            ? 'unread'
            : toString(existing.status) || 'unread';
        notificationPayload = stripUndefinedDeep({
            id: notificationId,
            userId: recipientId,
            accountId: event.accountId,
            propertyId: event.propertyId,
            type: notificationType,
            title: event.title,
            message: event.message,
            data: {
                eventId,
                eventType: event.type,
                workflowKey: event.workflowKey,
                entityKey: event.entityKey,
                propertyId: event.propertyId,
                documentId: event.relatedDocumentId,
                ticketId: event.relatedTicketId,
                scanId: event.relatedScanId,
                actionLabel: event.actionLabel,
                ...(event.metadata || {}),
            },
            status: nextStatus,
            actionUrl: event.actionUrl,
            suppressAutoPush: true,
            createdAt,
            updatedAt: event.updatedAt || nowIso,
            maintleyEventId: eventId,
            maintleyEventType: event.type,
        });
        transaction.set(notificationRef, notificationPayload, { merge: true });
    });
    return {
        notificationId,
        notification: notificationPayload,
    };
};
const publishMaintleyEventRecord = async (input) => {
    const recipients = getRecipients(input);
    const accountId = toString(input.accountId);
    const workflowKey = toString(input.workflowKey);
    const entityKey = toString(input.entityKey);
    if (!accountId || !workflowKey || !entityKey || recipients.length === 0) {
        throw new Error('Maintley event requires accountId, workflowKey, entityKey, and recipients.');
    }
    const nowIso = input.updatedAt || new Date().toISOString();
    const event = {
        ...input,
        accountId,
        workflowKey,
        entityKey,
        recipientIds: recipients,
        priority: input.priority || 'normal',
    };
    const eventId = createEventId(workflowKey, entityKey);
    const shouldPush = event.push ?? shouldDefaultPush(event.type);
    await upsertMaintleyEvent(event, eventId, recipients, nowIso);
    const notificationIds = [];
    for (const recipientId of recipients) {
        const inAppResult = event.inApp === false
            ? null
            : await upsertInAppNotification(event, eventId, recipientId, nowIso);
        if (!inAppResult) {
            continue;
        }
        notificationIds.push(inAppResult.notificationId);
        if (shouldPush) {
            await (0, pushDelivery_1.sendPushForNotification)(inAppResult.notificationId, inAppResult.notification, { androidOnly: true });
        }
    }
    return { eventId, notificationIds };
};
exports.publishMaintleyEventRecord = publishMaintleyEventRecord;
const assertCanPublishPropertyEvent = async (uid, accountId, propertyId) => {
    if (propertyId) {
        const propertyDoc = await db.collection('properties').doc(propertyId).get();
        if (!propertyDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Property was not found.');
        }
        const property = propertyDoc.data() || {};
        const propertyAccountId = toString(property.accountId || property.userId);
        if (propertyAccountId && propertyAccountId !== accountId) {
            throw new functions.https.HttpsError('permission-denied', 'This event does not belong to the selected property.');
        }
        if (toString(property.userId) === uid ||
            (Array.isArray(property.coOwners) && property.coOwners.map(toString).includes(uid)) ||
            (Array.isArray(property.administrators) && property.administrators.map(toString).includes(uid))) {
            return;
        }
    }
    const membership = await (0, accountAuthz_1.getMembership)(accountId, uid);
    if (!membership) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have access to publish this event.');
    }
};
exports.publishMaintleyEvent = functions.https.onCall(async (data, context) => {
    const uid = toString(context.auth?.uid);
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to publish this event.');
    }
    const type = data?.type;
    if (type !== 'quick_scan_completed' &&
        type !== 'property_audit_completed' &&
        type !== 'knowledge_imported') {
        throw new functions.https.HttpsError('permission-denied', 'This event type is not available from the client.');
    }
    const accountId = toString(data.accountId);
    if (!accountId) {
        throw new functions.https.HttpsError('invalid-argument', 'accountId is required.');
    }
    await assertCanPublishPropertyEvent(uid, accountId, toString(data.propertyId));
    const event = stripUndefinedDeep({
        ...data,
        accountId,
        userId: uid,
        recipientIds: [uid],
        workflowKey: data.workflowKey || 'maintley-intelligence',
        entityKey: data.entityKey ||
            data.relatedScanId ||
            `${type}:${toString(data.propertyId) || uid}:${Date.now()}`,
        type,
        status: data.status || 'completed',
        priority: data.priority || 'normal',
        inApp: data.inApp !== false,
    });
    return (0, exports.publishMaintleyEventRecord)(event);
});
