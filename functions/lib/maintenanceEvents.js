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
exports.correctMaintenanceHistoryRecord = exports.deleteMaintenanceEvent = exports.updateMaintenanceEvent = exports.createMaintenanceEventsBatch = exports.createMaintenanceEvent = exports.notifyTaskCompletion = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const accountAuthz_1 = require("./accountAuthz");
const legacyMaintenancePromotion_1 = require("./legacyMaintenancePromotion");
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
const MUTABLE_EVENT_FIELDS = new Set([
    'title',
    'description',
    'serviceDate',
    'completionDate',
    'maintenanceCategory',
    'performedBy',
    'attachments',
    'priority',
    'tags',
    'deviceIds',
    'unitId',
    'financials',
    'data',
]);
// Financials, attachments, and free-form data are intentionally excluded so
// revision documents do not become a second store of potentially sensitive data.
const REVISION_VALUE_FIELDS = new Set([
    'title',
    'description',
    'serviceDate',
    'completionDate',
    'maintenanceCategory',
    'performedBy',
    'priority',
    'tags',
    'deviceIds',
    'unitId',
]);
const toString = (value) => String(value || '').trim();
const toNumberOrUndefined = (value) => {
    if (value === null || value === undefined || value === '')
        return undefined;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};
const normalizeCostBreakdown = (value) => {
    if (!value)
        return undefined;
    const normalized = {
        contractorCost: toNumberOrUndefined(value.contractorCost),
        materialsCost: toNumberOrUndefined(value.materialsCost),
        laborCost: toNumberOrUndefined(value.laborCost),
        otherCost: toNumberOrUndefined(value.otherCost),
    };
    const cleaned = stripUndefinedDeep(normalized);
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
};
const calculateCostTotal = (value) => {
    const costs = normalizeCostBreakdown(value);
    if (!costs)
        return undefined;
    return Object.values(costs).reduce((sum, cost) => sum + cost, 0);
};
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
const normalizePerformer = (value) => {
    if (!value)
        return undefined;
    const allowedTypes = new Set([
        'user',
        'contractor',
        'external_provider',
        'homeowner',
        'unknown',
    ]);
    const type = toString(value.type) || 'unknown';
    if (!allowedTypes.has(type)) {
        throw new functions.https.HttpsError('invalid-argument', 'event.performedBy.type is invalid.');
    }
    const id = toString(value.id);
    const displayName = toString(value.displayName);
    if (!id && !displayName && type !== 'unknown')
        return undefined;
    return stripUndefinedDeep({ type, id: id || undefined, displayName: displayName || undefined });
};
const getRecorderSnapshot = async (uid) => {
    const userDoc = await db.collection('users').doc(uid).get();
    const data = userDoc.data() || {};
    const displayName = toString(data.displayName) ||
        [toString(data.firstName), toString(data.lastName)].filter(Boolean).join(' ');
    return stripUndefinedDeep({ userId: uid, displayName: displayName || undefined });
};
const buildRevision = ({ eventId, accountId, propertyId, action, actor, changedFields, previousValues, reason, nowIso, }) => stripUndefinedDeep({
    eventId,
    accountId,
    propertyId,
    action,
    actor,
    changedFields: Array.from(new Set(changedFields)).sort(),
    previousValues,
    reason: toString(reason) || undefined,
    createdAt: nowIso,
});
const normalizeEventUpdates = (updates) => {
    const normalized = {};
    for (const [field, value] of Object.entries(updates || {})) {
        if (MUTABLE_EVENT_FIELDS.has(field) && value !== undefined)
            normalized[field] = value;
    }
    if ('serviceDate' in normalized || 'completionDate' in normalized) {
        const serviceDate = toString(normalized.serviceDate || normalized.completionDate);
        normalized.serviceDate = serviceDate;
        normalized.completionDate = serviceDate;
    }
    if ('performedBy' in normalized) {
        normalized.performedBy = normalizePerformer(normalized.performedBy);
    }
    return stripUndefinedDeep(normalized);
};
const getRevisionPreviousValues = (existing, changedFields) => stripUndefinedDeep(Object.fromEntries(changedFields
    .filter((field) => REVISION_VALUE_FIELDS.has(field))
    .map((field) => [field, existing[field]])));
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
    const uid = toString(context.auth?.uid);
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
const buildEventDoc = (event, uid, accountId, nowIso, recordedBy) => {
    const deviceIds = dedupeStringArray([...(event.deviceIds || []), event.deviceId]);
    const tags = dedupeStringArray(event.tags);
    const linkedTaskIds = dedupeStringArray(event.linkedTaskIds);
    const relatedEventIds = dedupeStringArray(event.relatedEventIds);
    const attachments = normalizeAttachments(event.attachments, nowIso);
    const eventType = toString(event.eventType);
    const eventSource = toString(event.eventSource || 'manual_entry');
    const serviceDate = toString(event.serviceDate || event.completionDate || event.timestamp || nowIso);
    const performedBy = normalizePerformer(event.performedBy);
    const estimateBreakdown = normalizeCostBreakdown(event.financials?.estimate);
    const actualBreakdown = normalizeCostBreakdown(event.financials?.actual);
    const estimatedCost = toNumberOrUndefined(event.financials?.estimatedCost) ??
        calculateCostTotal(event.financials?.estimate);
    const actualCost = toNumberOrUndefined(event.financials?.actualCost) ??
        calculateCostTotal(event.financials?.actual);
    const payload = {
        accountId,
        propertyId: toString(event.propertyId),
        propertyTitle: toString(event.propertyTitle) || undefined,
        unitId: toString(event.unitId) || undefined,
        deviceIds: deviceIds.length > 0 ? deviceIds : undefined,
        title: toString(event.title),
        description: toString(event.description) || undefined,
        serviceDate,
        // Compatibility alias while readers migrate to serviceDate.
        completionDate: serviceDate,
        maintenanceCategory: toString(event.maintenanceCategory) || undefined,
        eventType,
        eventSource,
        createdBy: uid,
        recordedBy,
        recordedAt: nowIso,
        performedBy,
        correctionCount: 0,
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
                estimatedCost,
                actualCost,
                estimate: estimateBreakdown,
                actual: actualBreakdown,
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
    const recordedBy = await getRecorderSnapshot(uid);
    const ref = db.collection('maintenanceEvents').doc();
    const payload = stripUndefinedDeep(buildEventDoc(event, uid, accountId, nowIso, recordedBy));
    const eventDoc = {
        id: ref.id,
        ...payload,
    };
    const revisionRef = db.collection('maintenanceEventRevisions').doc();
    const batch = db.batch();
    batch.set(ref, eventDoc);
    batch.set(revisionRef, buildRevision({
        eventId: ref.id,
        accountId,
        propertyId,
        action: 'created',
        actor: recordedBy,
        changedFields: Object.keys(payload),
        nowIso,
    }));
    await batch.commit();
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
        const event = (data?.event || {});
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
        throw new functions.https.HttpsError('internal', err?.message || 'Unexpected error in createMaintenanceEvent');
    }
});
exports.createMaintenanceEventsBatch = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    const uid = assertAuthenticated(context);
    const events = Array.isArray(data?.events) ? data.events : [];
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
exports.updateMaintenanceEvent = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    const uid = assertAuthenticated(context);
    const eventId = toString(data?.eventId);
    if (!eventId) {
        throw new functions.https.HttpsError('invalid-argument', 'eventId is required.');
    }
    const updates = normalizeEventUpdates(data?.updates || {});
    const changedFields = Object.keys(updates);
    if (changedFields.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'No supported updates were provided.');
    }
    const eventRef = db.collection('maintenanceEvents').doc(eventId);
    const snapshot = await eventRef.get();
    if (!snapshot.exists)
        throw new functions.https.HttpsError('not-found', 'Maintenance event not found.');
    const existing = snapshot.data() || {};
    if (existing.deletedAt) {
        throw new functions.https.HttpsError('failed-precondition', 'Deleted maintenance events cannot be edited.');
    }
    const accountId = await resolveWritableAccountId(uid, toString(existing.accountId));
    const propertyId = toString(existing.propertyId);
    await assertPropertyBelongsToAccount(propertyId, accountId, uid);
    const actor = await getRecorderSnapshot(uid);
    const nowIso = new Date().toISOString();
    const revisionRef = db.collection('maintenanceEventRevisions').doc();
    const batch = db.batch();
    batch.update(eventRef, {
        ...updates,
        updatedAt: nowIso,
        updatedBy: actor,
        correctionCount: admin.firestore.FieldValue.increment(1),
    });
    batch.set(revisionRef, buildRevision({
        eventId,
        accountId,
        propertyId,
        action: 'corrected',
        actor,
        changedFields,
        previousValues: getRevisionPreviousValues(existing, changedFields),
        reason: data?.correctionReason,
        nowIso,
    }));
    await batch.commit();
    return { success: true, id: eventId };
});
exports.deleteMaintenanceEvent = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    const uid = assertAuthenticated(context);
    const eventId = toString(data?.eventId);
    const reason = toString(data?.correctionReason);
    if (!eventId || !reason) {
        throw new functions.https.HttpsError('invalid-argument', 'eventId and correctionReason are required.');
    }
    const eventRef = db.collection('maintenanceEvents').doc(eventId);
    const snapshot = await eventRef.get();
    if (!snapshot.exists)
        throw new functions.https.HttpsError('not-found', 'Maintenance event not found.');
    const existing = snapshot.data() || {};
    const accountId = await resolveWritableAccountId(uid, toString(existing.accountId));
    const propertyId = toString(existing.propertyId);
    await assertPropertyBelongsToAccount(propertyId, accountId, uid);
    const actor = await getRecorderSnapshot(uid);
    const nowIso = new Date().toISOString();
    const revisionRef = db.collection('maintenanceEventRevisions').doc();
    const batch = db.batch();
    batch.set(revisionRef, buildRevision({
        eventId,
        accountId,
        propertyId,
        action: 'deleted',
        actor,
        changedFields: ['deletedAt', 'deletedBy', 'deletionReason', 'status'],
        reason,
        nowIso,
    }));
    batch.update(eventRef, {
        status: 'deleted',
        deletedAt: nowIso,
        deletedBy: actor,
        deletionReason: reason,
        updatedAt: nowIso,
        updatedBy: actor,
    });
    await batch.commit();
    return { success: true, id: eventId };
});
/**
 * Governs corrections from the transitional dual-read Maintenance History UI.
 * Canonical events are corrected directly. A legacy-only collection record is
 * first promoted to the same deterministic ID with migration provenance and a
 * creation revision, then corrected or soft-deleted. The legacy source remains
 * unchanged for migration parity and rollback investigation.
 */
exports.correctMaintenanceHistoryRecord = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    const uid = assertAuthenticated(context);
    const recordId = toString(data?.recordId);
    const action = toString(data?.action);
    const reason = toString(data?.correctionReason);
    if (!recordId || !reason || (action !== 'update' && action !== 'delete')) {
        throw new functions.https.HttpsError('invalid-argument', 'recordId, a supported action, and correctionReason are required.');
    }
    const updates = action === 'update' ? normalizeEventUpdates(data?.updates || {}) : {};
    const changedFields = action === 'update'
        ? Object.keys(updates)
        : ['deletedAt', 'deletedBy', 'deletionReason', 'status'];
    if (action === 'update' && changedFields.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'No supported updates were provided.');
    }
    const eventRef = db.collection('maintenanceEvents').doc(recordId);
    const legacyRef = db.collection('maintenanceHistory').doc(recordId);
    const initialEvent = await eventRef.get();
    const initialLegacy = initialEvent.exists ? null : await legacyRef.get();
    if (!initialEvent.exists && !initialLegacy?.exists) {
        throw new functions.https.HttpsError('not-found', 'Maintenance record not found.');
    }
    const source = (initialEvent.exists ? initialEvent.data() : initialLegacy?.data()) || {};
    const propertyId = toString(source.propertyId);
    if (!propertyId) {
        throw new functions.https.HttpsError('failed-precondition', 'This legacy record needs migration review before it can be corrected.');
    }
    const propertySnapshot = await db.collection('properties').doc(propertyId).get();
    if (!propertySnapshot.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'This record is not linked to a current property.');
    }
    const property = propertySnapshot.data() || {};
    const sourceAccountId = toString(source.accountId) ||
        toString(property.accountId || property.userId || property.ownerId);
    const accountId = await resolveWritableAccountId(uid, sourceAccountId);
    await assertPropertyBelongsToAccount(propertyId, accountId, uid);
    const actor = await getRecorderSnapshot(uid);
    const nowIso = new Date().toISOString();
    const createdRevisionRef = db.collection('maintenanceEventRevisions').doc();
    const correctionRevisionRef = db.collection('maintenanceEventRevisions').doc();
    let promotedLegacy = false;
    await db.runTransaction(async (transaction) => {
        const eventSnapshot = await transaction.get(eventRef);
        const legacySnapshot = await transaction.get(legacyRef);
        let existing = (eventSnapshot.data() || {});
        if (!eventSnapshot.exists) {
            if (!legacySnapshot.exists) {
                throw new functions.https.HttpsError('not-found', 'Maintenance record not found.');
            }
            const legacy = legacySnapshot.data() || {};
            const currentLegacyPropertyId = toString(legacy.propertyId);
            const currentLegacyAccountId = toString(legacy.accountId);
            if (currentLegacyPropertyId !== propertyId ||
                (currentLegacyAccountId && currentLegacyAccountId !== accountId)) {
                throw new functions.https.HttpsError('permission-denied', 'Legacy maintenance record ownership changed before the correction completed.');
            }
            try {
                existing = (0, legacyMaintenancePromotion_1.buildPromotedLegacyMaintenanceEvent)({
                    legacyId: recordId,
                    legacy,
                    accountId,
                    propertyId,
                    propertyTitle: toString(property.title),
                    nowIso,
                });
            }
            catch {
                throw new functions.https.HttpsError('failed-precondition', 'This legacy record needs migration review before it can be corrected.');
            }
            promotedLegacy = true;
            transaction.set(createdRevisionRef, buildRevision({
                eventId: recordId,
                accountId,
                propertyId,
                action: 'created',
                actor,
                changedFields: Object.keys(existing),
                reason: 'Promoted before a user-requested correction.',
                nowIso,
            }));
        }
        else {
            if (toString(existing.accountId) !== accountId || toString(existing.propertyId) !== propertyId) {
                throw new functions.https.HttpsError('permission-denied', 'Maintenance record ownership changed before the correction completed.');
            }
        }
        if (existing.deletedAt) {
            throw new functions.https.HttpsError('failed-precondition', 'Deleted maintenance events cannot be changed again.');
        }
        const protectedUpdates = action === 'update' && updates.data && typeof updates.data === 'object'
            ? {
                ...updates,
                data: {
                    ...(existing.data || {}),
                    ...updates.data,
                    ...(existing.data?.migration
                        ? {
                            migration: existing.data.migration,
                        }
                        : {}),
                },
            }
            : updates;
        const correctionFields = action === 'update'
            ? {
                ...protectedUpdates,
                updatedAt: nowIso,
                updatedBy: actor,
                correctionCount: Number(existing.correctionCount || 0) + 1,
            }
            : {
                status: 'deleted',
                deletedAt: nowIso,
                deletedBy: actor,
                deletionReason: reason,
                updatedAt: nowIso,
                updatedBy: actor,
            };
        if (eventSnapshot.exists) {
            transaction.update(eventRef, correctionFields);
        }
        else {
            transaction.create(eventRef, { ...existing, ...correctionFields });
        }
        transaction.set(correctionRevisionRef, buildRevision({
            eventId: recordId,
            accountId,
            propertyId,
            action: action === 'update' ? 'corrected' : 'deleted',
            actor,
            changedFields,
            previousValues: action === 'update'
                ? getRevisionPreviousValues(existing, changedFields)
                : undefined,
            reason,
            nowIso,
        }));
    });
    return { success: true, id: recordId, promotedLegacy };
});
