import { createHash } from 'crypto';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { assertAccountRole, resolveAccountIdForUser } from './accountAuthz';
import { hasAccountCapability } from './subscriptionEntitlements';

if (!admin.apps.length) admin.initializeApp();

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

type Operation = 'create' | 'update' | 'generate_next';
type Request = {
	operation?: Operation;
	accountId?: string;
	taskId?: string;
	requestId?: string;
	completionDate?: string;
	task?: Record<string, unknown>;
	updates?: Record<string, unknown>;
};

export type RecurringTaskWriteResult = {
	outcome: 'created' | 'updated' | 'not_recurring' | 'not_entitled' | 'invalid_recurrence';
	taskId?: string;
	replayed?: boolean;
};

const cleanText = (value: unknown, max = 4000): string =>
	String(value || '').trim().slice(0, max);

const cleanRecord = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
	return Object.fromEntries(
		Object.entries(value as Record<string, unknown>)
			.filter(([key, item]) => TASK_FIELDS.has(key) && item !== undefined),
	);
};

export const hasValidRecurringTaskConfiguration = (task: Record<string, unknown>): boolean => {
	if (task.isRecurring !== true) return false;
	const frequency = cleanText(task.recurrenceFrequency, 24);
	const interval = Number(task.recurrenceInterval || 1);
	if (!RECURRENCE_FREQUENCIES.has(frequency)) return false;
	if (!Number.isInteger(interval) || interval < 1 || interval > 100) return false;
	return frequency !== 'custom' || RECURRENCE_UNITS.has(cleanText(task.recurrenceCustomUnit, 16));
};

const assertRequestId = (value: unknown): string => {
	const requestId = cleanText(value, 200);
	if (!requestId) {
		throw new functions.https.HttpsError('invalid-argument', 'requestId is required.');
	}
	return requestId;
};

const assertProperty = async (accountId: string, propertyId: unknown): Promise<void> => {
	const normalizedPropertyId = cleanText(propertyId, 160);
	if (!normalizedPropertyId) {
		throw new functions.https.HttpsError('invalid-argument', 'propertyId is required.');
	}
	const snapshot = await db.collection('properties').doc(normalizedPropertyId).get();
	const data = snapshot.data() || {};
	const propertyAccountId = cleanText(data.accountId || data.userId || data.ownerId, 160);
	if (!snapshot.exists || propertyAccountId !== accountId) {
		throw new functions.https.HttpsError(
			'permission-denied',
			'This property does not belong to the active account.',
		);
	}
};

const assertTaskShape = async (
	accountId: string,
	task: Record<string, unknown>,
): Promise<void> => {
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
		if (
			!snapshot.exists ||
			cleanText(data.accountId || data.userId, 160) !== accountId ||
			cleanText(data.location?.propertyId || data.propertyId, 160) !== propertyId
		) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Every linked device must belong to the selected property.',
			);
		}
	}
};

const canUseRecurrence = async (accountId: string): Promise<boolean> => {
	const owner = await db.collection('users').doc(accountId).get();
	return hasAccountCapability(
		accountId,
		owner.data()?.subscription,
		'recurring_tasks.use',
	);
};

export const recurringTaskIdForRequest = (accountId: string, requestId: string): string =>
	`recurring_${createHash('sha256').update(`${accountId}:${requestId}`).digest('hex').slice(0, 40)}`;

export const calculateTrustedNextDueDate = (
	dateValue: string,
	frequency: string,
	interval: number,
	customUnit?: string,
): string | null => {
	const dateOnly = cleanText(dateValue, 32).split('T')[0];
	const date = new Date(`${dateOnly}T12:00:00.000Z`);
	if (Number.isNaN(date.getTime())) return null;
	const unit = frequency === 'custom' ? customUnit : frequency;
	const amount = frequency === 'biweekly' ? interval * 2 : interval;
	if (unit === 'daily' || unit === 'days') date.setUTCDate(date.getUTCDate() + amount);
	else if (unit === 'weekly' || unit === 'weeks' || frequency === 'biweekly') date.setUTCDate(date.getUTCDate() + amount * 7);
	else if (unit === 'monthly' || unit === 'months') date.setUTCMonth(date.getUTCMonth() + amount);
	else if (frequency === 'quarterly') date.setUTCMonth(date.getUTCMonth() + amount * 3);
	else if (unit === 'yearly' || unit === 'years') date.setUTCFullYear(date.getUTCFullYear() + amount);
	else return null;
	return date.toISOString().slice(0, 10);
};

const removeUndefined = (record: Record<string, unknown>): Record<string, unknown> =>
	Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));

export const manageRecurringTask = functions.region('us-central1').https.onCall(
	async (data: Request, context): Promise<RecurringTaskWriteResult> => {
		const uid = cleanText(context.auth?.uid, 160);
		if (!uid) throw new functions.https.HttpsError('unauthenticated', 'You must be signed in.');
		const operation = data?.operation;
		if (!operation || !['create', 'update', 'generate_next'].includes(operation)) {
			throw new functions.https.HttpsError('invalid-argument', 'A supported operation is required.');
		}
		const accountId = cleanText(data?.accountId, 160);
		if (!accountId) throw new functions.https.HttpsError('invalid-argument', 'accountId is required.');
		if ((await resolveAccountIdForUser(uid)) !== accountId) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'The requested account is not the active account for this user.',
			);
		}
		await assertAccountRole(uid, accountId, TASK_MANAGER_ROLES);
		const requestId = assertRequestId(data?.requestId);
		const now = new Date().toISOString();

		if (operation === 'create') {
			const task = cleanRecord(data.task);
			if (!hasValidRecurringTaskConfiguration(task)) return { outcome: 'invalid_recurrence' };
			if (!(await canUseRecurrence(accountId))) return { outcome: 'not_entitled' };
			await assertTaskShape(accountId, task);
			const taskId = recurringTaskIdForRequest(accountId, requestId);
			const ref = db.collection('tasks').doc(taskId);
			const replayed = await db.runTransaction(async (transaction) => {
				const existing = await transaction.get(ref);
				if (existing.exists) return true;
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
		if (!taskId) throw new functions.https.HttpsError('invalid-argument', 'taskId is required.');
		const ref = db.collection('tasks').doc(taskId);
		const snapshot = await ref.get();
		if (!snapshot.exists) throw new functions.https.HttpsError('not-found', 'Task was not found.');
		const stored = snapshot.data() || {};
		if (cleanText(stored.accountId || stored.userId, 160) !== accountId) {
			throw new functions.https.HttpsError('permission-denied', 'Task is outside the active account.');
		}

		if (operation === 'update') {
			const updates = cleanRecord(data.updates);
			const merged = { ...stored, ...updates };
			if (merged.isRecurring === true) {
				if (!hasValidRecurringTaskConfiguration(merged)) return { outcome: 'invalid_recurrence', taskId };
				if (!(await canUseRecurrence(accountId))) return { outcome: 'not_entitled', taskId };
			}
			if ('propertyId' in updates || 'devices' in updates) {
				await assertTaskShape(accountId, merged);
			}
			const safeUpdates: Record<string, unknown> = { ...updates, accountId, updatedAt: now };
			if (merged.isRecurring !== true) {
				safeUpdates.isRecurring = false;
				for (const key of ['recurrenceFrequency', 'recurrenceInterval', 'recurrenceCustomUnit', 'parentTaskId', 'lastRecurrenceDate']) {
					safeUpdates[key] = admin.firestore.FieldValue.delete();
				}
			}
			await ref.update(safeUpdates);
			return { outcome: 'updated', taskId };
		}

		if (stored.isRecurring !== true) return { outcome: 'not_recurring', taskId };
		if (!hasValidRecurringTaskConfiguration(stored)) return { outcome: 'invalid_recurrence', taskId };
		if (!(await canUseRecurrence(accountId))) return { outcome: 'not_entitled', taskId };
		const completionDate = cleanText(data.completionDate, 32);
		const interval = Number(stored.recurrenceInterval || 1);
		const dueDate = calculateTrustedNextDueDate(
			completionDate,
			cleanText(stored.recurrenceFrequency, 24),
			interval,
			cleanText(stored.recurrenceCustomUnit, 16),
		);
		if (!dueDate) return { outcome: 'invalid_recurrence', taskId };
		const nextTaskId = recurringTaskIdForRequest(accountId, `next:${taskId}:${requestId}`);
		const nextRef = db.collection('tasks').doc(nextTaskId);
		const replayed = await db.runTransaction(async (transaction) => {
			const existing = await transaction.get(nextRef);
			if (existing.exists) return true;
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
	},
);
