import { createHash } from 'crypto';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { assertAccountRole, resolveAccountIdForUser } from './accountAuthz';
import { hasAccountCapability } from './subscriptionEntitlements';
import {
	isIntentionalFreeOwnerSubscription,
	issueFirstPropertyTrial,
} from './entitlementGrants';

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

type SetupTaskProposal = {
	proposalId?: string;
	title?: string;
	dueDate?: string;
	priority?: string;
	notes?: string;
	deviceId?: string;
	recurrenceFrequency?: string;
	recurrenceInterval?: number;
	recurrenceCustomUnit?: string;
};

type ActivateSetupPlanRequest = {
	propertyId?: string;
	requestId?: string;
	proposals?: SetupTaskProposal[];
};

type ActivateSetupPlanResult = {
	success: true;
	requestId: string;
	propertyId: string;
	accountId: string;
	createdTaskIds: string[];
	taskIds: string[];
	replayedTaskIds: string[];
	recurringAccessApplied: boolean;
};

type ValidatedProposal = {
	proposalId: string;
	title: string;
	dueDate: string;
	priority: string;
	notes: string;
	deviceId: string | null;
	recurrenceFrequency: string | null;
	recurrenceInterval: number | null;
	recurrenceCustomUnit: string | null;
};

const text = (value: unknown): string => String(value || '').trim();

const assertBoundedText = (
	value: unknown,
	field: string,
	maxLength: number,
	required = false,
): string => {
	const normalized = text(value);
	if (required && !normalized) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			`${field} is required.`,
		);
	}
	if (normalized.length > maxLength) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			`${field} exceeds ${maxLength} characters.`,
		);
	}
	return normalized;
};

export const validatePropertySetupProposal = (raw: SetupTaskProposal): ValidatedProposal => {
	const proposalId = assertBoundedText(raw?.proposalId, 'proposalId', 160, true);
	const title = assertBoundedText(raw?.title, 'title', 160, true);
	const dueDate = assertBoundedText(raw?.dueDate, 'dueDate', 32, true);
	const parsedDueDate = new Date(`${dueDate}T12:00:00.000Z`);
	if (
		!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
		Number.isNaN(parsedDueDate.getTime()) ||
		parsedDueDate.toISOString().slice(0, 10) !== dueDate
	) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'dueDate must be a valid YYYY-MM-DD date.',
		);
	}

	const priority = text(raw?.priority) || 'Medium';
	if (!PRIORITIES.has(priority)) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'priority is not supported.',
		);
	}

	const recurrenceFrequency = text(raw?.recurrenceFrequency) || null;
	if (recurrenceFrequency && !RECURRENCE_FREQUENCIES.has(recurrenceFrequency)) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'recurrenceFrequency is not supported.',
		);
	}

	const recurrenceIntervalValue = Number(raw?.recurrenceInterval || 0);
	const recurrenceInterval = recurrenceFrequency
		? recurrenceIntervalValue || 1
		: null;
	if (
		recurrenceInterval !== null &&
		(!Number.isInteger(recurrenceInterval) || recurrenceInterval < 1 || recurrenceInterval > 100)
	) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'recurrenceInterval must be an integer between 1 and 100.',
		);
	}

	const recurrenceCustomUnit = text(raw?.recurrenceCustomUnit) || null;
	if (
		recurrenceFrequency === 'custom' &&
		(!recurrenceCustomUnit || !RECURRENCE_UNITS.has(recurrenceCustomUnit))
	) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'Custom recurrence requires a supported recurrenceCustomUnit.',
		);
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

export const validatePropertySetupProposals = (
	rawProposals: unknown,
): ValidatedProposal[] => {
	const proposals = Array.isArray(rawProposals) ? rawProposals : [];
	if (proposals.length > MAX_PROPOSALS) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			`No more than ${MAX_PROPOSALS} maintenance proposals may be activated at once.`,
		);
	}
	const validated = proposals.map((proposal) =>
		validatePropertySetupProposal(proposal as SetupTaskProposal),
	);
	if (new Set(validated.map(({ proposalId }) => proposalId)).size !== validated.length) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'Each proposalId must be unique within an activation request.',
		);
	}
	return validated;
};

export const propertyBelongsToAccount = (
	propertyData: Record<string, unknown>,
	accountId: string,
): boolean =>
	(text(propertyData.accountId) ||
		text(propertyData.userId) ||
		text(propertyData.ownerId)) === text(accountId);

export const deviceBelongsToProperty = (
	deviceData: Record<string, any>,
	propertyId: string,
): boolean =>
	text(deviceData.location?.propertyId || deviceData.propertyId) === text(propertyId);

export const getPropertySetupTaskId = (
	accountId: string,
	propertyId: string,
	proposalId: string,
): string =>
	`setup_${createHash('sha256')
		.update(`${accountId}:${propertyId}:${proposalId}`)
		.digest('hex')
		.slice(0, 40)}`;

export const buildPropertySetupRecurrence = (
	proposal: Pick<
		ValidatedProposal,
		'recurrenceFrequency' | 'recurrenceInterval' | 'recurrenceCustomUnit'
	>,
	recurringAccessApplied: boolean,
): Record<string, unknown> =>
	recurringAccessApplied && proposal.recurrenceFrequency
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

const getDefaultNotifications = () => [
	{ id: 'reminder-30', type: 'reminder', daysBeforeDue: 30, enabled: true },
	{ id: 'reminder-7', type: 'reminder', daysBeforeDue: 7, enabled: true },
	{ id: 'reminder-0', type: 'reminder', daysBeforeDue: 0, enabled: true },
	{ id: 'overdue-1', type: 'overdue', daysBeforeDue: -7, enabled: true },
];

export const activatePropertySetupMaintenancePlan = functions
	.region('us-central1')
	.https.onCall(
		async (
			data: ActivateSetupPlanRequest,
			context,
		): Promise<ActivateSetupPlanResult> => {
			const uid = text(context.auth?.uid);
			if (!uid) {
				throw new functions.https.HttpsError(
					'unauthenticated',
					'You must be signed in to activate a maintenance plan.',
				);
			}

			const propertyId = assertBoundedText(data?.propertyId, 'propertyId', 160, true);
			const requestId = assertBoundedText(data?.requestId, 'requestId', 200, true);
			const proposals = validatePropertySetupProposals(data?.proposals);

			const accountId = await resolveAccountIdForUser(uid);
			await assertAccountRole(uid, accountId, SETUP_ACTIVATION_ROLES);

			const [propertySnapshot, accountOwnerSnapshot] = await Promise.all([
				db.collection('properties').doc(propertyId).get(),
				db.collection('users').doc(accountId).get(),
			]);
			if (!propertySnapshot.exists) {
				throw new functions.https.HttpsError('not-found', 'Property was not found.');
			}
			const propertyData = propertySnapshot.data() || {};
			if (!propertyBelongsToAccount(propertyData, accountId)) {
				throw new functions.https.HttpsError(
					'permission-denied',
					'This property does not belong to the active account.',
				);
			}

			// The first-property grant normally finishes before the setup assistant
			// opens. This idempotent server-side guard closes the remaining race if a
			// client reaches task confirmation before its entitlement refresh arrives.
			if (
				isIntentionalFreeOwnerSubscription(
					accountOwnerSnapshot.data()?.subscription,
				)
			) {
				const propertyCreatedAtMs = Date.parse(String(propertyData.createdAt || ''));
				await issueFirstPropertyTrial(
					accountId,
					propertyId,
					Number.isFinite(propertyCreatedAtMs)
						? propertyCreatedAtMs
						: Date.now(),
				);
			}

			const deviceIds = Array.from(
				new Set(proposals.map(({ deviceId }) => deviceId).filter(Boolean) as string[]),
			);
			const deviceSnapshots = await Promise.all(
				deviceIds.map((deviceId) => db.collection('devices').doc(deviceId).get()),
			);
			for (const deviceSnapshot of deviceSnapshots) {
				const deviceData = deviceSnapshot.data() || {};
				if (!deviceSnapshot.exists || !deviceBelongsToProperty(deviceData, propertyId)) {
					throw new functions.https.HttpsError(
						'invalid-argument',
						'Every linked device must belong to the selected property.',
					);
				}
			}

			const recurringAccessApplied = await hasAccountCapability(
				accountId,
				accountOwnerSnapshot.data()?.subscription,
				'recurring_tasks.use',
			);
			const taskRefs = proposals.map((proposal) =>
				db
					.collection('tasks')
					.doc(
						getPropertySetupTaskId(accountId, propertyId, proposal.proposalId),
					),
			);

			const result = await db.runTransaction(async (transaction) => {
				const existingSnapshots = await Promise.all(
					taskRefs.map((taskRef) => transaction.get(taskRef)),
				);
				const createdTaskIds: string[] = [];
				const replayedTaskIds: string[] = [];

				proposals.forEach((proposal, index) => {
					const taskRef = taskRefs[index];
					const existingSnapshot = existingSnapshots[index];
					if (existingSnapshot.exists) {
						const existingData = existingSnapshot.data() || {};
						if (text(existingData.setupProposalId) !== proposal.proposalId) {
							throw new functions.https.HttpsError(
								'already-exists',
								'A maintenance task identifier collision was detected.',
							);
						}
						replayedTaskIds.push(taskRef.id);
						return;
					}

					const recurrence = buildPropertySetupRecurrence(
						proposal,
						recurringAccessApplied,
					);
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
		},
	);
