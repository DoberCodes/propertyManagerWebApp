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
exports.createMaintenanceEventsBatch = exports.createMaintenanceEvent = exports.notifyTaskCompletion = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const accountAuthz_1 = require("./accountAuthz");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const ALLOWED_EVENT_TYPES = new Set([
    'task_completed',
    'task_approved',
    'repair_logged',
    'inspection_completed',
    'invoice_uploaded',
    'document_uploaded',
    'service_note_added',
    'maintenance_recorded',
    'warranty_added',
    'contractor_visit_logged',
    'recurring_maintenance_completed',
]);
const ALLOWED_EVENT_SOURCES = new Set([
    'task_completion',
    'task_approval',
    'device_log',
    'repair_logging',
    'inspection_form',
    'invoice_upload',
    'document_upload',
    'note_entry',
    'manual_entry',
    'system',
    'contractor_entry',
]);
const WRITER_ROLES = ['owner', 'admin', 'manager', 'editor', 'member'];
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
const dedupeStringArray = (value) => {
    if (!Array.isArray(value))
        return [];
    const normalized = value
        .map((entry) => toString(entry))
        .filter(Boolean);
    return Array.from(new Set(normalized));
};
const normalizeAttachments = (value, nowIso) => {
    if (!Array.isArray(value))
        return [];
    return value
        .map((attachment) => {
        const next = (attachment || {});
        const url = toString(next.url);
        if (!url)
            return null;
        return {
            id: toString(next.id) || db.collection('_').doc().id,
            fileName: toString(next.fileName) || 'attachment',
            fileSize: Number(next.fileSize || 0),
            mimeType: toString(next.mimeType) || 'application/octet-stream',
            url,
            uploadedAt: toString(next.uploadedAt) || nowIso,
            description: toString(next.description) || undefined,
        };
    })
        .filter(Boolean);
};
const assertAuthenticated = (context) => {
    var _a;
    const uid = toString((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid);
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to create maintenance events.');
    }
    return uid;
};
const assertEventInput = (event) => {
    const propertyId = toString(event.propertyId);
    const title = toString(event.title);
    const eventType = toString(event.eventType);
    const eventSource = toString(event.eventSource || 'manual_entry');
    if (!propertyId) {
        throw new functions.https.HttpsError('invalid-argument', 'event.propertyId is required.');
    }
    if (!title) {
        throw new functions.https.HttpsError('invalid-argument', 'event.title is required.');
    }
    if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
        throw new functions.https.HttpsError('invalid-argument', `event.eventType is invalid: ${eventType}`);
    }
    if (!ALLOWED_EVENT_SOURCES.has(eventSource)) {
        throw new functions.https.HttpsError('invalid-argument', `event.eventSource is invalid: ${eventSource}`);
    }
};
const resolveWritableAccountId = async (uid, explicitAccountId) => {
    const resolvedAccountId = await (0, accountAuthz_1.resolveAccountIdForUser)(uid);
    const providedAccountId = toString(explicitAccountId);
    if (providedAccountId && providedAccountId !== resolvedAccountId) {
        throw new functions.https.HttpsError('permission-denied', 'accountId does not match your active account.');
    }
    const membership = await (0, accountAuthz_1.getMembership)(resolvedAccountId, uid);
    if (!(0, accountAuthz_1.hasAnyRole)(membership, WRITER_ROLES)) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to write maintenance events for this account.');
    }
    return resolvedAccountId;
};
const assertPropertyBelongsToAccount = async (propertyId, accountId, uid) => {
    const propertyDoc = await db.collection('properties').doc(propertyId).get();
    if (!propertyDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Property not found for maintenance event.');
    }
    const propertyData = (propertyDoc.data() || {});
    const propertyAccountId = toString(propertyData.accountId);
    const propertyUserId = toString(propertyData.userId);
    if (propertyAccountId && propertyAccountId !== accountId) {
        throw new functions.https.HttpsError('permission-denied', 'Cannot write maintenance event for a property outside your account.');
    }
    if (!propertyAccountId && propertyUserId && propertyUserId !== accountId && propertyUserId !== uid) {
        throw new functions.https.HttpsError('permission-denied', 'Cannot write maintenance event for this property.');
    }
};
const buildEventDoc = (event, uid, accountId, nowIso) => {
    const deviceIds = dedupeStringArray([...(event.deviceIds || []), event.deviceId]);
    const tags = dedupeStringArray(event.tags);
    const linkedTaskIds = dedupeStringArray(event.linkedTaskIds);
    const relatedEventIds = dedupeStringArray(event.relatedEventIds);
    const attachments = normalizeAttachments(event.attachments, nowIso);
    const eventType = toString(event.eventType);
    const eventSource = toString(event.eventSource || 'manual_entry');
    const completionDate = toString(event.completionDate || event.timestamp || nowIso);
    const payload = {
        accountId,
        propertyId: toString(event.propertyId),
        propertyTitle: toString(event.propertyTitle) || undefined,
        unitId: toString(event.unitId) || undefined,
        deviceIds: deviceIds.length > 0 ? deviceIds : undefined,
        title: toString(event.title),
        description: toString(event.description) || undefined,
        completionDate,
        maintenanceCategory: toString(event.maintenanceCategory) || undefined,
        eventType,
        eventSource,
        createdBy: uid,
        createdByName: toString((event.data || {}).createdByName) || undefined,
        updatedAt: nowIso,
        createdAt: nowIso,
        priority: toString(event.priority) || undefined,
        tags: tags.length > 0 ? tags : undefined,
        linkedTaskIds: linkedTaskIds.length > 0 ? linkedTaskIds : undefined,
        originalTaskId: toString(event.originalTaskId) || undefined,
        recurringTaskId: toString(event.recurringTaskId) || undefined,
        maintenanceCycleId: toString(event.maintenanceCycleId) || undefined,
        relatedEventIds: relatedEventIds.length > 0 ? relatedEventIds : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        financials: event.financials
            ? {
                estimatedCost: typeof event.financials.estimatedCost === 'number'
                    ? event.financials.estimatedCost
                    : undefined,
                actualCost: typeof event.financials.actualCost === 'number'
                    ? event.financials.actualCost
                    : undefined,
                currency: toString(event.financials.currency) || 'USD',
                notes: toString(event.financials.notes) || undefined,
            }
            : undefined,
        data: event.data || {},
    };
    return payload;
};
exports.notifyTaskCompletion = functions
    .region('us-central1')
    .firestore.document('maintenanceEvents/{eventId}')
    .onCreate(async (snapshot, context) => {
    const event = (snapshot.data() || {});
    const eventType = toString(event.eventType);
    if (eventType !== 'task_completed') {
        return;
    }
    const accountId = toString(event.accountId);
    if (!accountId) {
        console.warn('Task completion event missing accountId', {
            eventId: context.params.eventId,
        });
        return;
    }
    const title = toString(event.title) || 'Maintenance task';
    const propertyId = toString(event.propertyId);
    const propertyTitle = toString(event.propertyTitle);
    const completionDate = toString(event.completionDate || event.createdAt);
    const eventData = (event.data || {});
    const linkedTaskIds = Array.isArray(event.linkedTaskIds)
        ? event.linkedTaskIds.map((id) => toString(id)).filter(Boolean)
        : [];
    const nowIso = new Date().toISOString();
    const notification = stripUndefinedDeep({
        userId: accountId,
        type: 'task_completed',
        title: 'Task Completed',
        message: propertyTitle
            ? `${title} was completed at ${propertyTitle}.`
            : `${title} was completed.`,
        data: {
            eventId: context.params.eventId,
            propertyId: propertyId || undefined,
            propertyTitle: propertyTitle || undefined,
            taskTitle: title,
            completionDate: completionDate || undefined,
            completedBy: toString(eventData.completedBy) ||
                toString(event.createdBy) ||
                undefined,
            originalTaskId: toString(event.originalTaskId) || linkedTaskIds[0] || undefined,
        },
        status: 'unread',
        actionUrl: propertyId ? `/properties/${propertyId}` : undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
    });
    await db.collection('notifications').add(notification);
});
const writeMaintenanceEvent = async (event, uid) => {
    assertEventInput(event);
    const accountId = await resolveWritableAccountId(uid, event.accountId);
    const propertyId = toString(event.propertyId);
    await assertPropertyBelongsToAccount(propertyId, accountId, uid);
    const nowIso = new Date().toISOString();
    const ref = db.collection('maintenanceEvents').doc();
    const payload = stripUndefinedDeep(buildEventDoc(event, uid, accountId, nowIso));
    await ref.set({
        id: ref.id,
        ...payload,
    });
    return {
        id: ref.id,
        accountId,
        propertyId,
    };
};
exports.createMaintenanceEvent = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    try {
        const uid = assertAuthenticated(context);
        const event = ((data === null || data === void 0 ? void 0 : data.event) || {});
        const result = await writeMaintenanceEvent(event, uid);
        return {
            success: true,
            ...result,
        };
    }
    catch (err) {
        // Re-throw HttpsErrors as-is so the client gets proper error codes
        if (err instanceof functions.https.HttpsError)
            throw err;
        // Wrap unexpected errors so client sees the message instead of a generic 500
        console.error('createMaintenanceEvent unexpected error:', err);
        throw new functions.https.HttpsError('internal', (err === null || err === void 0 ? void 0 : err.message) || 'Unexpected error in createMaintenanceEvent');
    }
});
exports.createMaintenanceEventsBatch = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    const uid = assertAuthenticated(context);
    const events = Array.isArray(data === null || data === void 0 ? void 0 : data.events) ? data.events : [];
    if (events.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'events must contain at least one event.');
    }
    if (events.length > 50) {
        throw new functions.https.HttpsError('invalid-argument', 'events batch exceeds max size of 50.');
    }
    const results = [];
    for (const event of events) {
        results.push(await writeMaintenanceEvent(event, uid));
    }
    return {
        success: true,
        count: results.length,
        results,
    };
});
