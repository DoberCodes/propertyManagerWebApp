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
exports.activatePropertySetupMaintenancePlan = exports.buildPropertySetupRecurrence = exports.getPropertySetupTaskId = exports.deviceBelongsToProperty = exports.propertyBelongsToAccount = exports.validatePropertySetupProposals = exports.validatePropertySetupProposal = void 0;
const crypto_1 = require("crypto");
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const accountAuthz_1 = require("./accountAuthz");
const subscriptionEntitlements_1 = require("./subscriptionEntitlements");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const SETUP_ACTIVATION_ROLES = ['account_owner', 'admin', 'manager'];
const MAX_PROPOSALS = 50;
const RECURRENCE_FREQUENCIES = new Set([
    'daily',
    'weekly',
    'biweekly',
    'monthly',
    'quarterly',
    'yearly',
    'custom',
]);
const RECURRENCE_UNITS = new Set(['days', 'weeks', 'months', 'years']);
const PRIORITIES = new Set(['Low', 'Medium', 'High', 'Urgent']);
const text = (value) => String(value || '').trim();
const assertBoundedText = (value, field, maxLength, required = false) => {
    const normalized = text(value);
    if (required && !normalized) {
        throw new functions.https.HttpsError('invalid-argument', `${field} is required.`);
    }
    if (normalized.length > maxLength) {
        throw new functions.https.HttpsError('invalid-argument', `${field} exceeds ${maxLength} characters.`);
    }
    return normalized;
};
const validatePropertySetupProposal = (raw) => {
    const proposalId = assertBoundedText(raw?.proposalId, 'proposalId', 160, true);
    const title = assertBoundedText(raw?.title, 'title', 160, true);
    const dueDate = assertBoundedText(raw?.dueDate, 'dueDate', 32, true);
    const parsedDueDate = new Date(`${dueDate}T12:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
        Number.isNaN(parsedDueDate.getTime()) ||
        parsedDueDate.toISOString().slice(0, 10) !== dueDate) {
        throw new functions.https.HttpsError('invalid-argument', 'dueDate must be a valid YYYY-MM-DD date.');
    }
    const priority = text(raw?.priority) || 'Medium';
    if (!PRIORITIES.has(priority)) {
        throw new functions.https.HttpsError('invalid-argument', 'priority is not supported.');
    }
    const recurrenceFrequency = text(raw?.recurrenceFrequency) || null;
    if (recurrenceFrequency && !RECURRENCE_FREQUENCIES.has(recurrenceFrequency)) {
        throw new functions.https.HttpsError('invalid-argument', 'recurrenceFrequency is not supported.');
    }
    const recurrenceIntervalValue = Number(raw?.recurrenceInterval || 0);
    const recurrenceInterval = recurrenceFrequency
        ? recurrenceIntervalValue || 1
        : null;
    if (recurrenceInterval !== null &&
        (!Number.isInteger(recurrenceInterval) || recurrenceInterval < 1 || recurrenceInterval > 100)) {
        throw new functions.https.HttpsError('invalid-argument', 'recurrenceInterval must be an integer between 1 and 100.');
    }
    const recurrenceCustomUnit = text(raw?.recurrenceCustomUnit) || null;
    if (recurrenceFrequency === 'custom' &&
        (!recurrenceCustomUnit || !RECURRENCE_UNITS.has(recurrenceCustomUnit))) {
        throw new functions.https.HttpsError('invalid-argument', 'Custom recurrence requires a supported recurrenceCustomUnit.');
    }
    return {
        proposalId,
        title,
        dueDate,
        priority,
        notes: assertBoundedText(raw?.notes, 'notes', 4000),
        deviceId: assertBoundedText(raw?.deviceId, 'deviceId', 160) || null,
        recurrenceFrequency,
        recurrenceInterval,
        recurrenceCustomUnit,
    };
};
exports.validatePropertySetupProposal = validatePropertySetupProposal;
const validatePropertySetupProposals = (rawProposals) => {
    const proposals = Array.isArray(rawProposals) ? rawProposals : [];
    if (proposals.length > MAX_PROPOSALS) {
        throw new functions.https.HttpsError('invalid-argument', `No more than ${MAX_PROPOSALS} maintenance proposals may be activated at once.`);
    }
    const validated = proposals.map((proposal) => (0, exports.validatePropertySetupProposal)(proposal));
    if (new Set(validated.map(({ proposalId }) => proposalId)).size !== validated.length) {
        throw new functions.https.HttpsError('invalid-argument', 'Each proposalId must be unique within an activation request.');
    }
    return validated;
};
exports.validatePropertySetupProposals = validatePropertySetupProposals;
const propertyBelongsToAccount = (propertyData, accountId) => (text(propertyData.accountId) ||
    text(propertyData.userId) ||
    text(propertyData.ownerId)) === text(accountId);
exports.propertyBelongsToAccount = propertyBelongsToAccount;
const deviceBelongsToProperty = (deviceData, propertyId) => text(deviceData.location?.propertyId || deviceData.propertyId) === text(propertyId);
exports.deviceBelongsToProperty = deviceBelongsToProperty;
const getPropertySetupTaskId = (accountId, propertyId, proposalId) => `setup_${(0, crypto_1.createHash)('sha256')
    .update(`${accountId}:${propertyId}:${proposalId}`)
    .digest('hex')
    .slice(0, 40)}`;
exports.getPropertySetupTaskId = getPropertySetupTaskId;
const buildPropertySetupRecurrence = (proposal, recurringAccessApplied) => recurringAccessApplied && proposal.recurrenceFrequency
    ? {
        isRecurring: true,
        recurrenceFrequency: proposal.recurrenceFrequency,
        recurrenceInterval: proposal.recurrenceInterval || 1,
        ...(proposal.recurrenceFrequency === 'custom' &&
            proposal.recurrenceCustomUnit
            ? { recurrenceCustomUnit: proposal.recurrenceCustomUnit }
            : {}),
    }
    : { isRecurring: false };
exports.buildPropertySetupRecurrence = buildPropertySetupRecurrence;
const getDefaultNotifications = () => [
    { id: 'reminder-30', type: 'reminder', daysBeforeDue: 30, enabled: true },
    { id: 'reminder-7', type: 'reminder', daysBeforeDue: 7, enabled: true },
    { id: 'reminder-0', type: 'reminder', daysBeforeDue: 0, enabled: true },
    { id: 'overdue-1', type: 'overdue', daysBeforeDue: -7, enabled: true },
];
exports.activatePropertySetupMaintenancePlan = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    const uid = text(context.auth?.uid);
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to activate a maintenance plan.');
    }
    const propertyId = assertBoundedText(data?.propertyId, 'propertyId', 160, true);
    const requestId = assertBoundedText(data?.requestId, 'requestId', 200, true);
    const proposals = (0, exports.validatePropertySetupProposals)(data?.proposals);
    const accountId = await (0, accountAuthz_1.resolveAccountIdForUser)(uid);
    await (0, accountAuthz_1.assertAccountRole)(uid, accountId, SETUP_ACTIVATION_ROLES);
    const [propertySnapshot, accountOwnerSnapshot] = await Promise.all([
        db.collection('properties').doc(propertyId).get(),
        db.collection('users').doc(accountId).get(),
    ]);
    if (!propertySnapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'Property was not found.');
    }
    const propertyData = propertySnapshot.data() || {};
    if (!(0, exports.propertyBelongsToAccount)(propertyData, accountId)) {
        throw new functions.https.HttpsError('permission-denied', 'This property does not belong to the active account.');
    }
    const deviceIds = Array.from(new Set(proposals.map(({ deviceId }) => deviceId).filter(Boolean)));
    const deviceSnapshots = await Promise.all(deviceIds.map((deviceId) => db.collection('devices').doc(deviceId).get()));
    for (const deviceSnapshot of deviceSnapshots) {
        const deviceData = deviceSnapshot.data() || {};
        if (!deviceSnapshot.exists || !(0, exports.deviceBelongsToProperty)(deviceData, propertyId)) {
            throw new functions.https.HttpsError('invalid-argument', 'Every linked device must belong to the selected property.');
        }
    }
    const recurringAccessApplied = await (0, subscriptionEntitlements_1.hasAccountCapability)(accountId, accountOwnerSnapshot.data()?.subscription, 'recurring_tasks.use');
    const taskRefs = proposals.map((proposal) => db
        .collection('tasks')
        .doc((0, exports.getPropertySetupTaskId)(accountId, propertyId, proposal.proposalId)));
    const result = await db.runTransaction(async (transaction) => {
        const existingSnapshots = await Promise.all(taskRefs.map((taskRef) => transaction.get(taskRef)));
        const createdTaskIds = [];
        const replayedTaskIds = [];
        proposals.forEach((proposal, index) => {
            const taskRef = taskRefs[index];
            const existingSnapshot = existingSnapshots[index];
            if (existingSnapshot.exists) {
                const existingData = existingSnapshot.data() || {};
                if (text(existingData.setupProposalId) !== proposal.proposalId) {
                    throw new functions.https.HttpsError('already-exists', 'A maintenance task identifier collision was detected.');
                }
                replayedTaskIds.push(taskRef.id);
                return;
            }
            const recurrence = (0, exports.buildPropertySetupRecurrence)(proposal, recurringAccessApplied);
            transaction.create(taskRef, {
                userId: accountId,
                accountId,
                propertyId,
                property: text(propertyData.title),
                propertyTitle: text(propertyData.title),
                title: proposal.title,
                dueDate: proposal.dueDate,
                status: 'Initiated',
                priority: proposal.priority,
                category: 'Suggested Maintenance',
                notes: proposal.notes,
                ...recurrence,
                enableNotifications: true,
                notifications: getDefaultNotifications(),
                ...(proposal.deviceId ? { devices: [proposal.deviceId] } : {}),
                setupProposalId: proposal.proposalId,
                setupActivationRequestId: requestId,
                source: 'property_setup_assistant',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            createdTaskIds.push(taskRef.id);
        });
        return { createdTaskIds, replayedTaskIds };
    });
    return {
        success: true,
        requestId,
        propertyId,
        accountId,
        createdTaskIds: result.createdTaskIds,
        taskIds: taskRefs.map(({ id }) => id),
        replayedTaskIds: result.replayedTaskIds,
        recurringAccessApplied,
    };
});
