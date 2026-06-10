import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import {
	getMembership,
	hasAnyRole,
	resolveAccountIdForUser,
} from './accountAuthz';

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

type EventAttachmentInput = {
	id?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	url?: string;
	uploadedAt?: string;
	description?: string;
};

type MaintenanceEventInput = {
	accountId?: string;
	propertyId: string;
	propertyTitle?: string;
	unitId?: string;
	deviceId?: string;
	deviceIds?: string[];
	title: string;
	description?: string;
	timestamp?: string;
	completionDate?: string;
	maintenanceCategory?: string;
	eventType: string;
	eventSource?: string;
	attachments?: EventAttachmentInput[];
	priority?: 'urgent' | 'high' | 'medium' | 'low';
	tags?: string[];
	linkedTaskIds?: string[];
	originalTaskId?: string;
	recurringTaskId?: string;
	maintenanceCycleId?: string;
	relatedEventIds?: string[];
	financials?: {
		estimatedCost?: number;
		actualCost?: number;
		currency?: string;
		notes?: string;
	};
	data?: Record<string, unknown>;
};

type CreateMaintenanceEventRequest = {
	event: MaintenanceEventInput;
};

type CreateMaintenanceEventsBatchRequest = {
	events: MaintenanceEventInput[];
};

const toString = (value: unknown): string => String(value || '').trim();

const stripUndefinedDeep = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value
			.map((item) => stripUndefinedDeep(item))
			.filter((item) => item !== undefined);
	}

	if (value && typeof value === 'object') {
		const cleaned: Record<string, unknown> = {};
		for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
			const normalized = stripUndefinedDeep(nestedValue);
			if (normalized !== undefined) {
				cleaned[key] = normalized;
			}
		}
		return cleaned;
	}

	return value === undefined ? undefined : value;
};

const dedupeStringArray = (value: unknown): string[] => {
	if (!Array.isArray(value)) return [];
	const normalized = value
		.map((entry) => toString(entry))
		.filter(Boolean);
	return Array.from(new Set(normalized));
};

const normalizeAttachments = (value: unknown, nowIso: string) => {
	if (!Array.isArray(value)) return [];

	return value
		.map((attachment) => {
			const next = (attachment || {}) as EventAttachmentInput;
			const url = toString(next.url);
			if (!url) return null;
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

const assertAuthenticated = (context: functions.https.CallableContext): string => {
	const uid = toString(context.auth?.uid);
	if (!uid) {
		throw new functions.https.HttpsError(
			'unauthenticated',
			'You must be signed in to create maintenance events.',
		);
	}
	return uid;
};

const assertEventInput = (event: MaintenanceEventInput): void => {
	const propertyId = toString(event.propertyId);
	const title = toString(event.title);
	const eventType = toString(event.eventType);
	const eventSource = toString(event.eventSource || 'manual_entry');

	if (!propertyId) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'event.propertyId is required.',
		);
	}

	if (!title) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'event.title is required.',
		);
	}

	if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			`event.eventType is invalid: ${eventType}`,
		);
	}

	if (!ALLOWED_EVENT_SOURCES.has(eventSource)) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			`event.eventSource is invalid: ${eventSource}`,
		);
	}
};

const resolveWritableAccountId = async (
	uid: string,
	explicitAccountId?: string,
): Promise<string> => {
	const resolvedAccountId = await resolveAccountIdForUser(uid);
	const providedAccountId = toString(explicitAccountId);

	if (providedAccountId && providedAccountId !== resolvedAccountId) {
		throw new functions.https.HttpsError(
			'permission-denied',
			'accountId does not match your active account.',
		);
	}

	const membership = await getMembership(resolvedAccountId, uid);
	if (!hasAnyRole(membership, WRITER_ROLES)) {
		throw new functions.https.HttpsError(
			'permission-denied',
			'You do not have permission to write maintenance events for this account.',
		);
	}

	return resolvedAccountId;
};

const assertPropertyBelongsToAccount = async (
	propertyId: string,
	accountId: string,
	uid: string,
): Promise<void> => {
	const propertyDoc = await db.collection('properties').doc(propertyId).get();
	if (!propertyDoc.exists) {
		throw new functions.https.HttpsError(
			'not-found',
			'Property not found for maintenance event.',
		);
	}

	const propertyData = (propertyDoc.data() || {}) as Record<string, unknown>;
	const propertyAccountId = toString(propertyData.accountId);
	const propertyUserId = toString(propertyData.userId);

	if (propertyAccountId && propertyAccountId !== accountId) {
		throw new functions.https.HttpsError(
			'permission-denied',
			'Cannot write maintenance event for a property outside your account.',
		);
	}

	if (!propertyAccountId && propertyUserId && propertyUserId !== accountId && propertyUserId !== uid) {
		throw new functions.https.HttpsError(
			'permission-denied',
			'Cannot write maintenance event for this property.',
		);
	}
};

const buildEventDoc = (
	event: MaintenanceEventInput,
	uid: string,
	accountId: string,
	nowIso: string,
) => {
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
				estimatedCost:
					typeof event.financials.estimatedCost === 'number'
						? event.financials.estimatedCost
						: undefined,
				actualCost:
					typeof event.financials.actualCost === 'number'
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

const writeMaintenanceEvent = async (
	event: MaintenanceEventInput,
	uid: string,
): Promise<{ id: string; accountId: string; propertyId: string }> => {
	assertEventInput(event);

	const accountId = await resolveWritableAccountId(uid, event.accountId);
	const propertyId = toString(event.propertyId);
	await assertPropertyBelongsToAccount(propertyId, accountId, uid);

	const nowIso = new Date().toISOString();
	const ref = db.collection('maintenanceEvents').doc();
	const payload = stripUndefinedDeep(
		buildEventDoc(event, uid, accountId, nowIso),
	) as Record<string, unknown>;

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

export const createMaintenanceEvent = functions
	.region('us-central1')
	.https.onCall(async (data: CreateMaintenanceEventRequest, context) => {
		try {
			const uid = assertAuthenticated(context);
			const event = (data?.event || {}) as MaintenanceEventInput;

			const result = await writeMaintenanceEvent(event, uid);

			return {
				success: true,
				...result,
			};
		} catch (err: any) {
			// Re-throw HttpsErrors as-is so the client gets proper error codes
			if (err instanceof functions.https.HttpsError) throw err;
			// Wrap unexpected errors so client sees the message instead of a generic 500
			console.error('createMaintenanceEvent unexpected error:', err);
			throw new functions.https.HttpsError(
				'internal',
				err?.message || 'Unexpected error in createMaintenanceEvent',
			);
		}
	});

export const createMaintenanceEventsBatch = functions
	.region('us-central1')
	.https.onCall(async (data: CreateMaintenanceEventsBatchRequest, context) => {
		const uid = assertAuthenticated(context);
		const events = Array.isArray(data?.events) ? data.events : [];

		if (events.length === 0) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'events must contain at least one event.',
			);
		}

		if (events.length > 50) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'events batch exceeds max size of 50.',
			);
		}

		const results: Array<{ id: string; accountId: string; propertyId: string }> = [];
		for (const event of events) {
			results.push(await writeMaintenanceEvent(event, uid));
		}

		return {
			success: true,
			count: results.length,
			results,
		};
	});
