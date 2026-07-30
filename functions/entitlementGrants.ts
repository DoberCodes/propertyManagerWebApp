import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import {
	BUNDLE_VERSION,
	EntitlementGrant,
	getAdminAuditEventId,
	isFirstPropertyTrialEligible,
} from '@maintley/entitlements';
import { ENTITLEMENT_FEATURE_FLAGS } from './subscriptionEntitlements';
import { assertAccountRole, resolveAccountIdForUser } from './accountAuthz';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

export const HOMEOWNER_PLUS_TRIAL_PROGRAM_ID =
	'homeowner_plus_first_property_trial_v1';
export const HOMEOWNER_PLUS_TRIAL_GRANT_ID =
	'homeowner_plus_first_property_trial';
export const HOMEOWNER_PLUS_TRIAL_POLICY_VERSION = 'v1';
export const HOMEOWNER_PLUS_TRIAL_DURATION_DAYS = 30;

const ADMIN_AUDIT_LOGS_COLLECTION = 'admin_audit_logs';
const SYSTEM_ACTOR_ID = 'system:first-property-trial';

const isTrialIssuanceEnabled = (): boolean =>
	ENTITLEMENT_FEATURE_FLAGS.homeownerPlusProductTrial === true &&
	ENTITLEMENT_FEATURE_FLAGS.internalEntitlementGrantIssuance === true;

const asRecord = (value: unknown): Record<string, unknown> =>
	typeof value === 'object' && value ? (value as Record<string, unknown>) : {};

export const isIntentionalFreeOwnerSubscription = (value: unknown): boolean => {
	return isFirstPropertyTrialEligible({
		homeownerPlusProductTrial: true,
		internalEntitlementGrantIssuance: true,
		accountCreatedAtMs: 1,
		eligibilityStartMs: 1,
		subscription: asRecord(value),
	});
};

const serializeCallableValue = (value: unknown): unknown => {
	if (value instanceof admin.firestore.Timestamp) {
		return value.toDate().toISOString();
	}
	if (Array.isArray(value)) {
		return value.map(serializeCallableValue);
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
				key,
				serializeCallableValue(entry),
			]),
		);
	}
	return value;
};

export const getInitialTrialEligibility = (
	subscription: unknown,
	accountCreatedAt: unknown,
): Record<string, unknown> | null => {
	const eligibilityStartMs = Date.parse(
		String(process.env.HOMEOWNER_PLUS_TRIAL_ELIGIBILITY_START_AT || ''),
	);
	const createdAtMs =
		accountCreatedAt &&
		typeof (accountCreatedAt as { toMillis?: unknown }).toMillis === 'function'
			? (accountCreatedAt as { toMillis: () => number }).toMillis()
			: Date.parse(String(accountCreatedAt || ''));
	if (!isFirstPropertyTrialEligible({
		homeownerPlusProductTrial:
			ENTITLEMENT_FEATURE_FLAGS.homeownerPlusProductTrial,
		internalEntitlementGrantIssuance:
			ENTITLEMENT_FEATURE_FLAGS.internalEntitlementGrantIssuance,
		accountCreatedAtMs: createdAtMs,
		eligibilityStartMs,
		subscription: asRecord(subscription),
	})) {
		return null;
	}

	return {
		programId: HOMEOWNER_PLUS_TRIAL_PROGRAM_ID,
		policyVersion: HOMEOWNER_PLUS_TRIAL_POLICY_VERSION,
		status: 'eligible',
		eligibleAt: admin.firestore.FieldValue.serverTimestamp(),
	};
};

const createTrialGrant = (
	accountId: string,
	ownerId: string,
	propertyId: string,
	startsAtMs: number,
): EntitlementGrant & Record<string, unknown> => ({
	grantId: HOMEOWNER_PLUS_TRIAL_GRANT_ID,
	programId: HOMEOWNER_PLUS_TRIAL_PROGRAM_ID,
	accountId,
	kind: 'temporary',
	state: 'active',
	bundleId: 'homeowner_plus',
	bundleVersion: BUNDLE_VERSION,
	startsAtMs,
	endsAtMs:
		startsAtMs + HOMEOWNER_PLUS_TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
	source: 'trial',
	beneficiaryUserId: ownerId,
	idempotencyKey: `${HOMEOWNER_PLUS_TRIAL_PROGRAM_ID}:${accountId}`,
	issuedByUserId: SYSTEM_ACTOR_ID,
	issuedAtMs: startsAtMs,
	auditReason: 'Eligible homeowner created the first property.',
	policyVersion: HOMEOWNER_PLUS_TRIAL_POLICY_VERSION,
	transition: {
		mode: 'checkout_required',
		targetPlanId: 'homeowner_plus',
		status: 'not_configured',
	},
	triggerPropertyId: propertyId,
	createdAt: admin.firestore.FieldValue.serverTimestamp(),
	updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

export const issueFirstPropertyTrial = async (
	accountId: string,
	propertyId: string,
	startsAtMs: number,
): Promise<'created' | 'already_exists' | 'ineligible' | 'disabled'> => {
	if (!isTrialIssuanceEnabled()) return 'disabled';

	const normalizedAccountId = String(accountId || '').trim();
	const normalizedPropertyId = String(propertyId || '').trim();
	if (!normalizedAccountId || !normalizedPropertyId) return 'ineligible';

	const accountRef = db.collection('familyAccounts').doc(normalizedAccountId);
	const ownerRef = db.collection('users').doc(normalizedAccountId);
	const grantRef = accountRef
		.collection('entitlementGrants')
		.doc(HOMEOWNER_PLUS_TRIAL_GRANT_ID);
	const requestId = `${HOMEOWNER_PLUS_TRIAL_PROGRAM_ID}:${normalizedAccountId}`;
	const auditEventId = getAdminAuditEventId('grant.created', requestId);
	const auditRef = db.collection(ADMIN_AUDIT_LOGS_COLLECTION).doc(auditEventId);

	return db.runTransaction(async (transaction) => {
		const [accountSnapshot, ownerSnapshot, grantSnapshot] = await Promise.all([
			transaction.get(accountRef),
			transaction.get(ownerRef),
			transaction.get(grantRef),
		]);

		if (grantSnapshot.exists) return 'already_exists';
		if (!accountSnapshot.exists || !ownerSnapshot.exists) return 'ineligible';

		const account = accountSnapshot.data() || {};
		const owner = ownerSnapshot.data() || {};
		const programState = asRecord(
			asRecord(account.entitlementPrograms)[HOMEOWNER_PLUS_TRIAL_PROGRAM_ID],
		);
		const accountOwnerId = String(account.ownerId || '').trim();
		const propertyCount = Number(account.propertyCount || 0);
		const ownerIsEligible =
			accountOwnerId === normalizedAccountId &&
			owner.isAccountOwner !== false &&
			owner.isTeamMemberAccount !== true;
		const accountSubscription = account.subscription;
		const ownerSubscription = owner.subscription;

		if (
			programState.status !== 'eligible' ||
			programState.consumedAt ||
			propertyCount < 1 ||
			!ownerIsEligible ||
			!isIntentionalFreeOwnerSubscription(accountSubscription) ||
			!isIntentionalFreeOwnerSubscription(ownerSubscription)
		) {
			return 'ineligible';
		}

		const safeStartsAtMs = Number.isFinite(startsAtMs) ? startsAtMs : Date.now();
		const grant = createTrialGrant(
			normalizedAccountId,
			accountOwnerId,
			normalizedPropertyId,
			safeStartsAtMs,
		);
		const endsAtMs = Number(grant.endsAtMs);
		const existingProjection = asRecord(account.effectiveEntitlementProjection);
		const existingProjectedGrants = Array.isArray(existingProjection.activeGrants)
			? existingProjection.activeGrants.filter(
					(candidate) =>
						String(asRecord(candidate).grantId || '') !== grant.grantId,
			  )
			: [];
		const activeGrants = [
			...existingProjectedGrants,
			{
				grantId: grant.grantId,
				programId: grant.programId,
				accountId: grant.accountId,
				kind: grant.kind,
				state: grant.state,
				bundleId: grant.bundleId,
				bundleVersion: grant.bundleVersion,
				startsAtMs: grant.startsAtMs,
				endsAtMs: grant.endsAtMs,
				source: grant.source,
				policyVersion: grant.policyVersion,
				transition: grant.transition,
			},
		];
		const activeBundleIds = Array.from(
			new Set([
				...(Array.isArray(existingProjection.activeBundleIds)
					? existingProjection.activeBundleIds.map(String)
					: []),
				'homeowner_plus',
			]),
		);
		const bundleVersions = Array.from(
			new Set([
				...(Array.isArray(existingProjection.bundleVersions)
					? existingProjection.bundleVersions.map(String)
					: []),
				`homeowner_plus@${BUNDLE_VERSION}`,
			]),
		);
		const existingBundleExpirations = asRecord(
			existingProjection.bundleExpirationsMs,
		);
		const existingHomeownerPlusEndsAtMs = Number(
			existingBundleExpirations.homeowner_plus,
		);
		const bundleExpirationsMs = {
			...existingBundleExpirations,
			homeowner_plus:
				Number.isFinite(existingHomeownerPlusEndsAtMs)
					? Math.max(existingHomeownerPlusEndsAtMs, endsAtMs)
					: endsAtMs,
		};
		const existingTransitionAtMs = Number(existingProjection.nextTransitionAtMs);
		const nextTransitionAtMs =
			Number.isFinite(existingTransitionAtMs) && existingTransitionAtMs > safeStartsAtMs
				? Math.min(existingTransitionAtMs, endsAtMs)
				: endsAtMs;

		transaction.create(grantRef, grant);
		transaction.set(
			accountRef,
			{
				entitlementPrograms: {
					...asRecord(account.entitlementPrograms),
					[HOMEOWNER_PLUS_TRIAL_PROGRAM_ID]: {
						...programState,
						status: 'issued',
						grantId: HOMEOWNER_PLUS_TRIAL_GRANT_ID,
						consumedAt: admin.firestore.FieldValue.serverTimestamp(),
						triggerPropertyId: normalizedPropertyId,
					},
				},
				effectiveEntitlementProjection: {
					resolverVersion: 'v1',
					bundleVersions,
					activeBundleIds,
					bundleExpirationsMs,
					activeGrants,
					calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
					nextTransitionAtMs,
				},
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		);

		transaction.create(auditRef, {
			eventId: auditEventId,
			action: 'grant.created',
			category: 'entitlement_grant',
			targetType: 'account',
			targetId: normalizedAccountId,
			targetAccountId: normalizedAccountId,
			targetUserId: accountOwnerId,
			actorUserId: SYSTEM_ACTOR_ID,
			performedBy: {
				uid: SYSTEM_ACTOR_ID,
				displayName: 'Maintley automated trial program',
			},
			grantId: HOMEOWNER_PLUS_TRIAL_GRANT_ID,
			programId: HOMEOWNER_PLUS_TRIAL_PROGRAM_ID,
			reason: 'Eligible homeowner created the first property.',
			requestId,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			before: { effectivePlan: 'homeowner', activeGrantIds: [] },
			after: {
				effectivePlan: 'homeowner_plus',
				activeGrantIds: [HOMEOWNER_PLUS_TRIAL_GRANT_ID],
				endsAtMs,
			},
			metadata: {
				policyVersion: HOMEOWNER_PLUS_TRIAL_POLICY_VERSION,
				triggerPropertyId: normalizedPropertyId,
				source: 'firestore.property.created',
			},
		});

		return 'created';
	});
};

export const issueHomeownerPlusTrialOnFirstProperty = functions.firestore
	.document('properties/{propertyId}')
	.onCreate(async (snapshot, context) => {
		const property = snapshot.data() || {};
		const accountId = String(property.accountId || property.userId || '').trim();
		const eventTimeMs = Date.parse(String(context.timestamp || ''));
		const result = await issueFirstPropertyTrial(
			accountId,
			context.params.propertyId,
			Number.isFinite(eventTimeMs) ? eventTimeMs : Date.now(),
		);

		functions.logger.info('First-property trial issuance evaluated', {
			accountId,
			propertyId: context.params.propertyId,
			result,
		});
	});

export const finalizeFirstPropertyTrial = functions
	.region('us-central1')
	.https.onCall(async (data, context) => {
		const uid = String(context.auth?.uid || '').trim();
		if (!uid) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'You must be signed in to finish first-property setup.',
			);
		}

		const propertyId = String(data?.propertyId || '').trim();
		if (!propertyId || propertyId.length > 160) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'A valid property is required.',
			);
		}

		const accountId = await resolveAccountIdForUser(uid);
		await assertAccountRole(uid, accountId, ['account_owner']);

		const propertySnapshot = await db.collection('properties').doc(propertyId).get();
		if (!propertySnapshot.exists) {
			throw new functions.https.HttpsError('not-found', 'Property was not found.');
		}
		const property = propertySnapshot.data() || {};
		const propertyAccountId = String(
			property.accountId || property.userId || '',
		).trim();
		if (propertyAccountId !== accountId) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'This property does not belong to the active account.',
			);
		}

		const createdAtMs = Date.parse(String(property.createdAt || ''));
		const result = await issueFirstPropertyTrial(
			accountId,
			propertyId,
			Number.isFinite(createdAtMs) ? createdAtMs : Date.now(),
		);
		const accountSnapshot = await db.collection('familyAccounts').doc(accountId).get();

		return {
			result,
			accountId,
			effectiveEntitlementProjection: serializeCallableValue(
				accountSnapshot.data()?.effectiveEntitlementProjection || null,
			),
		};
	});
