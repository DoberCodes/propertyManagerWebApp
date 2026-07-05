import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { getMembership } from './accountAuthz';
import { sendPushForNotification } from './pushDelivery';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const EVENTS_COLLECTION = 'maintleyEvents';
const NOTIFICATIONS_COLLECTION = 'notifications';

export type MaintleyEventType =
	| 'document_review_started'
	| 'suggested_details_ready'
	| 'knowledge_imported'
	| 'document_review_failed'
	| 'quick_scan_completed'
	| 'property_audit_completed'
	| 'ticket_received'
	| 'ticket_in_progress'
	| 'ticket_testing_fix'
	| 'ticket_closed';

export type MaintleyEventPriority = 'low' | 'normal' | 'high';
export type MaintleyEventStatus =
	| 'processing'
	| 'ready'
	| 'completed'
	| 'failed'
	| 'received'
	| 'in_progress'
	| 'testing'
	| 'closed';

export type MaintleyEventInput = {
	accountId: string;
	userId?: string;
	recipientIds?: string[];
	propertyId?: string;
	relatedDocumentId?: string;
	relatedTicketId?: string;
	relatedScanId?: string;
	type: MaintleyEventType;
	workflowKey: string;
	entityKey: string;
	title: string;
	message: string;
	status: MaintleyEventStatus;
	priority?: MaintleyEventPriority;
	actionLabel?: string;
	actionUrl?: string;
	metadata?: Record<string, unknown>;
	createdAt?: string;
	updatedAt?: string;
	push?: boolean;
	inApp?: boolean;
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

const sanitizeDocIdPart = (value: string): string =>
	toString(value)
		.replace(/[^a-zA-Z0-9_-]/g, '-')
		.replace(/-+/g, '-')
		.slice(0, 120) || 'event';

const createEventId = (workflowKey: string, entityKey: string): string =>
	`${sanitizeDocIdPart(workflowKey)}__${sanitizeDocIdPart(entityKey)}`;

const getRecipients = (event: MaintleyEventInput): string[] =>
	Array.from(
		new Set([
			...(event.recipientIds || []),
			...(event.userId ? [event.userId] : []),
		].map(toString).filter(Boolean)),
	);

const getNotificationType = (type: MaintleyEventType): string => {
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
		case 'ticket_received':
		case 'ticket_in_progress':
		case 'ticket_testing_fix':
		case 'ticket_closed':
			return 'maintenance_request';
		default:
			return 'other';
	}
};

const shouldDefaultPush = (type: MaintleyEventType): boolean => {
	switch (type) {
		case 'document_review_started':
		case 'ticket_received':
		case 'property_audit_completed':
			return false;
		default:
			return true;
	}
};

const shouldCreateNotification = async (
	userId: string,
	notificationType: string,
): Promise<boolean> => {
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

const upsertMaintleyEvent = async (
	event: MaintleyEventInput,
	eventId: string,
	recipients: string[],
	nowIso: string,
) => {
	const eventRef = db.collection(EVENTS_COLLECTION).doc(eventId);
	const eventHistoryEntry = stripUndefinedDeep({
		type: event.type,
		title: event.title,
		message: event.message,
		status: event.status,
		priority: event.priority || 'normal',
		createdAt: nowIso,
		metadata: event.metadata || {},
	}) as Record<string, unknown>;

	await db.runTransaction(async (transaction) => {
		const snapshot = await transaction.get(eventRef);
		const existing = snapshot.exists ? snapshot.data() || {} : {};
		const createdAt = toString(existing.createdAt) || event.createdAt || nowIso;

		transaction.set(
			eventRef,
			stripUndefinedDeep({
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
			}) as Record<string, unknown>,
			{ merge: true },
		);
	});
};

const upsertInAppNotification = async (
	event: MaintleyEventInput,
	eventId: string,
	recipientId: string,
	nowIso: string,
): Promise<{ notificationId: string; notification: Record<string, unknown> } | null> => {
	const notificationType = getNotificationType(event.type);
	if (!(await shouldCreateNotification(recipientId, notificationType))) {
		return null;
	}

	const notificationId = `${eventId}__${sanitizeDocIdPart(recipientId)}`;
	const notificationRef = db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
	let notificationPayload: Record<string, unknown> = {};

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
		}) as Record<string, unknown>;

		transaction.set(notificationRef, notificationPayload, { merge: true });
	});

	return {
		notificationId,
		notification: notificationPayload,
	};
};

export const publishMaintleyEventRecord = async (
	input: MaintleyEventInput,
): Promise<{ eventId: string; notificationIds: string[] }> => {
	const recipients = getRecipients(input);
	const accountId = toString(input.accountId);
	const workflowKey = toString(input.workflowKey);
	const entityKey = toString(input.entityKey);
	if (!accountId || !workflowKey || !entityKey || recipients.length === 0) {
		throw new Error('Maintley event requires accountId, workflowKey, entityKey, and recipients.');
	}

	const nowIso = input.updatedAt || new Date().toISOString();
	const event: MaintleyEventInput = {
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

	const notificationIds: string[] = [];
	for (const recipientId of recipients) {
		const inAppResult =
			event.inApp === false
				? null
				: await upsertInAppNotification(event, eventId, recipientId, nowIso);
		if (!inAppResult) {
			continue;
		}
		notificationIds.push(inAppResult.notificationId);

		if (shouldPush) {
			await sendPushForNotification(
				inAppResult.notificationId,
				inAppResult.notification,
				{ androidOnly: true },
			);
		}
	}

	return { eventId, notificationIds };
};

const assertCanPublishPropertyEvent = async (
	uid: string,
	accountId: string,
	propertyId?: string,
) => {
	if (propertyId) {
		const propertyDoc = await db.collection('properties').doc(propertyId).get();
		if (!propertyDoc.exists) {
			throw new functions.https.HttpsError('not-found', 'Property was not found.');
		}
		const property = propertyDoc.data() || {};
		const propertyAccountId = toString(property.accountId || property.userId);
		if (propertyAccountId && propertyAccountId !== accountId) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'This event does not belong to the selected property.',
			);
		}
		if (
			toString(property.userId) === uid ||
			(Array.isArray(property.coOwners) && property.coOwners.map(toString).includes(uid)) ||
			(Array.isArray(property.administrators) && property.administrators.map(toString).includes(uid))
		) {
			return;
		}
	}

	const membership = await getMembership(accountId, uid);
	if (!membership) {
		throw new functions.https.HttpsError(
			'permission-denied',
			'You do not have access to publish this event.',
		);
	}
};

export const publishMaintleyEvent = functions.https.onCall(
	async (data: Partial<MaintleyEventInput>, context) => {
		const uid = toString(context.auth?.uid);
		if (!uid) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'You must be signed in to publish this event.',
			);
		}

		const type = data?.type;
		if (
			type !== 'quick_scan_completed' &&
			type !== 'property_audit_completed' &&
			type !== 'knowledge_imported'
		) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'This event type is not available from the client.',
			);
		}

		const accountId = toString(data.accountId);
		if (!accountId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'accountId is required.',
			);
		}

		await assertCanPublishPropertyEvent(uid, accountId, toString(data.propertyId));

		const event = stripUndefinedDeep({
			...data,
			accountId,
			userId: uid,
			recipientIds: [uid],
			workflowKey: data.workflowKey || 'maintley-intelligence',
			entityKey:
				data.entityKey ||
				data.relatedScanId ||
				`${type}:${toString(data.propertyId) || uid}:${Date.now()}`,
			type,
			status: data.status || 'completed',
			priority: data.priority || 'normal',
			inApp: data.inApp !== false,
		}) as MaintleyEventInput;

		return publishMaintleyEventRecord(event);
	},
);
