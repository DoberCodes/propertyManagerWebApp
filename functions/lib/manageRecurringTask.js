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
exports.manageRecurringTask = exports.calculateTrustedNextDueDate = exports.recurringTaskIdForRequest = exports.hasValidRecurringTaskConfiguration = void 0;
const crypto_1 = require("crypto");
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const accountAuthz_1 = require("./accountAuthz");
const subscriptionEntitlements_1 = require("./subscriptionEntitlements");
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
const TASK_MANAGER_ROLES = [
    'account_owner',
    'admin',
    'manager',
    'maintenance_lead',
    'maintenance',
];
const RECURRENCE_FREQUENCIES = new Set([
    'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom',
]);
const RECURRENCE_UNITS = new Set(['days', 'weeks', 'months', 'years']);
const TASK_FIELDS = new Set([
    'propertyId', 'property', 'propertyTitle', 'unitId', 'suiteId', 'devices',
    'title', 'description', 'notes', 'category', 'location', 'priority', 'status',
    'assignee', 'assignedTo', 'assigneeName', 'assigneeFirstName',
    'assigneeLastName', 'assigneeEmail', 'requiresWorkOrder', 'enableNotifications',
    'notifications', 'maintenanceGroupId', 'financials', 'dueDate', 'isRecurring',
    'recurrenceFrequency', 'recurrenceInterval', 'recurrenceCustomUnit',
]);
const cleanText = (value, max = 4000) => String(value || '').trim().slice(0, max);
const cleanRecord = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return {};
    return Object.fromEntries(Object.entries(value)
        .filter(([key, item]) => TASK_FIELDS.has(key) && item !== undefined));
};
const hasValidRecurringTaskConfiguration = (task) => {
    if (task.isRecurring !== true)
        return false;
    const frequency = cleanText(task.recurrenceFrequency, 24);
    const interval = Number(task.recurrenceInterval || 1);
    if (!RECURRENCE_FREQUENCIES.has(frequency))
        return false;
    if (!Number.isInteger(interval) || interval < 1 || interval > 100)
        return false;
    return frequency !== 'custom' || RECURRENCE_UNITS.has(cleanText(task.recurrenceCustomUnit, 16));
};
exports.hasValidRecurringTaskConfiguration = hasValidRecurringTaskConfiguration;
const assertRequestId = (value) => {
    const requestId = cleanText(value, 200);
    if (!requestId) {
        throw new functions.https.HttpsError('invalid-argument', 'requestId is required.');
    }
    return requestId;
};
const assertProperty = async (accountId, propertyId) => {
    const normalizedPropertyId = cleanText(propertyId, 160);
    if (!normalizedPropertyId) {
        throw new functions.https.HttpsError('invalid-argument', 'propertyId is required.');
    }
    const snapshot = await db.collection('properties').doc(normalizedPropertyId).get();
    const data = snapshot.data() || {};
    const propertyAccountId = cleanText(data.accountId || data.userId || data.ownerId, 160);
    if (!snapshot.exists || propertyAccountId !== accountId) {
        throw new functions.https.HttpsError('permission-denied', 'This property does not belong to the active account.');
    }
};
const assertTaskShape = async (accountId, task) => {
    if (!cleanText(task.title, 160)) {
        throw new functions.https.HttpsError('invalid-argument', 'title is required.');
    }
    if (!cleanText(task.dueDate, 32)) {
        throw new functions.https.HttpsError('invalid-argument', 'dueDate is required.');
    }
    await assertProperty(accountId, task.propertyId);
    const propertyId = cleanText(task.propertyId, 160);
    const deviceIds = Array.isArray(task.devices)
        ? Array.from(new Set(task.devices.map((value) => cleanText(value, 160)).filter(Boolean)))
        : [];
    if (deviceIds.length > 50) {
        throw new functions.https.HttpsError('invalid-argument', 'No more than 50 devices may be linked.');
    }
    for (const deviceId of deviceIds) {
        const snapshot = await db.collection('devices').doc(deviceId).get();
        const data = snapshot.data() || {};
        if (!snapshot.exists ||
            cleanText(data.accountId || data.userId, 160) !== accountId ||
            cleanText(data.location?.propertyId || data.propertyId, 160) !== propertyId) {
            throw new functions.https.HttpsError('invalid-argument', 'Every linked device must belong to the selected property.');
        }
    }
};
const canUseRecurrence = async (accountId) => {
    const owner = await db.collection('users').doc(accountId).get();
    return (0, subscriptionEntitlements_1.hasAccountCapability)(accountId, owner.data()?.subscription, 'recurring_tasks.use');
};
const recurringTaskIdForRequest = (accountId, requestId) => `recurring_${(0, crypto_1.createHash)('sha256').update(`${accountId}:${requestId}`).digest('hex').slice(0, 40)}`;
exports.recurringTaskIdForRequest = recurringTaskIdForRequest;
const calculateTrustedNextDueDate = (dateValue, frequency, interval, customUnit) => {
    const dateOnly = cleanText(dateValue, 32).split('T')[0];
    const date = new Date(`${dateOnly}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime()))
        return null;
    const unit = frequency === 'custom' ? customUnit : frequency;
    const amount = frequency === 'biweekly' ? interval * 2 : interval;
    if (unit === 'daily' || unit === 'days')
        date.setUTCDate(date.getUTCDate() + amount);
    else if (unit === 'weekly' || unit === 'weeks' || frequency === 'biweekly')
        date.setUTCDate(date.getUTCDate() + amount * 7);
    else if (unit === 'monthly' || unit === 'months')
        date.setUTCMonth(date.getUTCMonth() + amount);
    else if (frequency === 'quarterly')
        date.setUTCMonth(date.getUTCMonth() + amount * 3);
    else if (unit === 'yearly' || unit === 'years')
        date.setUTCFullYear(date.getUTCFullYear() + amount);
    else
        return null;
    return date.toISOString().slice(0, 10);
};
exports.calculateTrustedNextDueDate = calculateTrustedNextDueDate;
const removeUndefined = (record) => Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
exports.manageRecurringTask = functions.region('us-central1').https.onCall(async (data, context) => {
    const uid = cleanText(context.auth?.uid, 160);
    if (!uid)
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in.');
    const operation = data?.operation;
    if (!operation || !['create', 'update', 'generate_next'].includes(operation)) {
        throw new functions.https.HttpsError('invalid-argument', 'A supported operation is required.');
    }
    const accountId = cleanText(data?.accountId, 160);
    if (!accountId)
        throw new functions.https.HttpsError('invalid-argument', 'accountId is required.');
    if ((await (0, accountAuthz_1.resolveAccountIdForUser)(uid)) !== accountId) {
        throw new functions.https.HttpsError('permission-denied', 'The requested account is not the active account for this user.');
    }
    await (0, accountAuthz_1.assertAccountRole)(uid, accountId, TASK_MANAGER_ROLES);
    const requestId = assertRequestId(data?.requestId);
    const now = new Date().toISOString();
    if (operation === 'create') {
        const task = cleanRecord(data.task);
        if (!(0, exports.hasValidRecurringTaskConfiguration)(task))
            return { outcome: 'invalid_recurrence' };
        if (!(await canUseRecurrence(accountId)))
            return { outcome: 'not_entitled' };
        await assertTaskShape(accountId, task);
        const taskId = (0, exports.recurringTaskIdForRequest)(accountId, requestId);
        const ref = db.collection('tasks').doc(taskId);
        const replayed = await db.runTransaction(async (transaction) => {
            const existing = await transaction.get(ref);
            if (existing.exists)
                return true;
            transaction.create(ref, removeUndefined({
                ...task,
                accountId,
                userId: accountId,
                isRecurring: true,
                createdAt: now,
                updatedAt: now,
            }));
            return false;
        });
        return { outcome: 'created', taskId, replayed };
    }
    const taskId = cleanText(data?.taskId, 160);
    if (!taskId)
        throw new functions.https.HttpsError('invalid-argument', 'taskId is required.');
    const ref = db.collection('tasks').doc(taskId);
    const snapshot = await ref.get();
    if (!snapshot.exists)
        throw new functions.https.HttpsError('not-found', 'Task was not found.');
    const stored = snapshot.data() || {};
    if (cleanText(stored.accountId || stored.userId, 160) !== accountId) {
        throw new functions.https.HttpsError('permission-denied', 'Task is outside the active account.');
    }
    if (operation === 'update') {
        const updates = cleanRecord(data.updates);
        const merged = { ...stored, ...updates };
        if (merged.isRecurring === true) {
            if (!(0, exports.hasValidRecurringTaskConfiguration)(merged))
                return { outcome: 'invalid_recurrence', taskId };
            if (!(await canUseRecurrence(accountId)))
                return { outcome: 'not_entitled', taskId };
        }
        if ('propertyId' in updates || 'devices' in updates) {
            await assertTaskShape(accountId, merged);
        }
        const safeUpdates = { ...updates, accountId, updatedAt: now };
        if (merged.isRecurring !== true) {
            safeUpdates.isRecurring = false;
            for (const key of ['recurrenceFrequency', 'recurrenceInterval', 'recurrenceCustomUnit', 'parentTaskId', 'lastRecurrenceDate']) {
                safeUpdates[key] = admin.firestore.FieldValue.delete();
            }
        }
        await ref.update(safeUpdates);
        return { outcome: 'updated', taskId };
    }
    if (stored.isRecurring !== true)
        return { outcome: 'not_recurring', taskId };
    if (!(0, exports.hasValidRecurringTaskConfiguration)(stored))
        return { outcome: 'invalid_recurrence', taskId };
    if (!(await canUseRecurrence(accountId)))
        return { outcome: 'not_entitled', taskId };
    const completionDate = cleanText(data.completionDate, 32);
    const interval = Number(stored.recurrenceInterval || 1);
    const dueDate = (0, exports.calculateTrustedNextDueDate)(completionDate, cleanText(stored.recurrenceFrequency, 24), interval, cleanText(stored.recurrenceCustomUnit, 16));
    if (!dueDate)
        return { outcome: 'invalid_recurrence', taskId };
    const nextTaskId = (0, exports.recurringTaskIdForRequest)(accountId, `next:${taskId}:${requestId}`);
    const nextRef = db.collection('tasks').doc(nextTaskId);
    const replayed = await db.runTransaction(async (transaction) => {
        const existing = await transaction.get(nextRef);
        if (existing.exists)
            return true;
        const nextTask = cleanRecord(stored);
        transaction.create(nextRef, removeUndefined({
            ...nextTask,
            accountId,
            userId: cleanText(stored.userId, 160) || accountId,
            status: 'Initiated',
            dueDate,
            parentTaskId: cleanText(stored.parentTaskId, 160) || taskId,
            lastRecurrenceDate: completionDate.split('T')[0],
            createdAt: now,
            updatedAt: now,
        }));
        return false;
    });
    return { outcome: 'created', taskId: nextTaskId, replayed };
});
