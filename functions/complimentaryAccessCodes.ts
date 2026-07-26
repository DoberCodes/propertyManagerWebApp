import { createHash, createHmac } from 'crypto';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { defineSecret } from 'firebase-functions/params';
import {
	BUNDLE_VERSION,
	EntitlementGrant,
	EntitlementGrantSource,
	getAdminAuditEventId,
} from '@maintley/entitlements';
import { assertAccountRole, resolveAccountIdForUser } from './accountAuthz';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const ACCESS_CODE_PEPPER = defineSecret('COMPLIMENTARY_ACCESS_CODE_PEPPER');
const PROGRAMS_COLLECTION = 'entitlementAccessPrograms';
const CODES_COLLECTION = 'entitlementAccessCodes';
const ATTEMPTS_COLLECTION = 'accessCodeRedemptionAttempts';
const AUDIT_COLLECTION = 'admin_audit_logs';
const MAX_ATTEMPTS_PER_HOUR = 20;
const MAX_CODE_LENGTH = 80;
const DAY_MS = 24 * 60 * 60 * 1000;
const ACCESS_RANK: Record<AccessCodeProgram['bundleId'], number> = {
	homeowner_plus: 1,
	multi_homeowner: 2,
	property: 3,
	portfolio: 4,
};

type AccessCodeProgram = {
	programId: string;
	label: string;
	status: 'active' | 'disabled';
	bundleId: 'homeowner_plus' | 'multi_homeowner' | 'property' | 'portfolio';
	bundleVersion?: string;
	durationDays: number;
	redemptionExpiresAtMs?: number | null;
	totalRedemptionLimit: number;
	redeemedCount?: number;
	perAccountLimit: number;
	eligibleBasePlans?: string[];
	limitOverrides?: Record<string, number>;
	transitionMode: 'none' | 'checkout_required';
	fallbackPlanId: 'homeowner';
	policyVersion: string;
};

type AccessCodeRecord = {
	programId: string;
	status: 'active' | 'disabled';
	expiresAtMs?: number | null;
	maxRedemptions: number;
	redeemedCount?: number;
	recipientEmailLower?: string | null;
};

export type ComplimentaryAccessPreview = {
	programId: string;
	label: string;
	bundleId: AccessCodeProgram['bundleId'];
	durationDays: number;
	transitionMode: AccessCodeProgram['transitionMode'];
	fallbackPlanId: 'homeowner';
	limitOverrides: Record<string, number>;
	automaticBilling: false;
	recipientRestricted: boolean;
};

const text = (value: unknown): string => String(value || '').trim();

const isAccessCodeRolloutEnabled = (): boolean =>
	process.env.ENABLE_COMPLIMENTARY_ACCESS_CODES === 'true';

export const normalizeComplimentaryAccessCode = (value: unknown): string => {
	const normalized = text(value).toUpperCase().replace(/[\s-]+/g, '');
	if (!/^[A-Z0-9]{8,80}$/.test(normalized) || normalized.length > MAX_CODE_LENGTH) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'Enter a valid complimentary access code.',
		);
	}
	return normalized;
};

export const getComplimentaryAccessCodeHash = (
	code: string,
	pepper: string,
): string => {
	const normalizedPepper = text(pepper);
	if (normalizedPepper.length < 32) {
		throw new Error('Complimentary access-code pepper must contain at least 32 characters.');
	}
	return createHmac('sha256', normalizedPepper)
		.update(normalizeComplimentaryAccessCode(code))
		.digest('hex');
};

const getRuntimePepper = (): string =>
	text(ACCESS_CODE_PEPPER.value()) || text(process.env.COMPLIMENTARY_ACCESS_CODE_PEPPER);

const asProgram = (id: string, value: unknown): AccessCodeProgram => {
	const data = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
	const program: AccessCodeProgram = {
		programId: text(data.programId) || id,
		label: text(data.label),
		status: text(data.status) as AccessCodeProgram['status'],
		bundleId: text(data.bundleId) as AccessCodeProgram['bundleId'],
		bundleVersion: text(data.bundleVersion) || BUNDLE_VERSION,
		durationDays: Number(data.durationDays),
		redemptionExpiresAtMs: Number(data.redemptionExpiresAtMs || 0) || null,
		totalRedemptionLimit: Number(data.totalRedemptionLimit),
		redeemedCount: Number(data.redeemedCount || 0),
		perAccountLimit: Number(data.perAccountLimit),
		eligibleBasePlans: Array.isArray(data.eligibleBasePlans)
			? data.eligibleBasePlans.map(String)
			: ['homeowner'],
		limitOverrides:
			typeof data.limitOverrides === 'object' && data.limitOverrides
				? (data.limitOverrides as Record<string, number>)
				: {},
		transitionMode: text(data.transitionMode) as AccessCodeProgram['transitionMode'],
		fallbackPlanId: 'homeowner',
		policyVersion: text(data.policyVersion),
	};
	if (
		program.status !== 'active' ||
		!['homeowner_plus', 'multi_homeowner', 'property', 'portfolio'].includes(
			program.bundleId,
		) ||
		!Number.isInteger(program.durationDays) ||
		program.durationDays < 1 ||
		program.durationDays > 730 ||
		!Number.isInteger(program.totalRedemptionLimit) ||
		program.totalRedemptionLimit < 1 ||
		!Number.isInteger(program.perAccountLimit) ||
		program.perAccountLimit !== 1 ||
		!['none', 'checkout_required'].includes(program.transitionMode) ||
		!program.label ||
		!program.policyVersion
	) {
		throw new functions.https.HttpsError(
			'failed-precondition',
			'This complimentary access program is not configured correctly.',
		);
	}
	return program;
};

const asCodeRecord = (value: unknown): AccessCodeRecord => {
	const data = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
	return {
		programId: text(data.programId),
		status: text(data.status) as AccessCodeRecord['status'],
		expiresAtMs: Number(data.expiresAtMs || 0) || null,
		maxRedemptions: Number(data.maxRedemptions || 0),
		redeemedCount: Number(data.redeemedCount || 0),
		recipientEmailLower: text(data.recipientEmailLower).toLowerCase() || null,
	};
};

const getAttemptWindowId = (accountId: string, nowMs: number): string =>
	`${accountId}_${Math.floor(nowMs / (60 * 60 * 1000))}`;

const recordAttempt = async (
	accountId: string,
	requestId: string,
	outcome: string,
	programId?: string,
): Promise<void> => {
	await db.collection(ATTEMPTS_COLLECTION).doc(`${accountId}_${requestId}`).set(
		{
			accountId,
			requestId,
			outcome,
			programId: programId || null,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{ merge: false },
	);
};

const assertRateLimit = async (accountId: string, nowMs: number): Promise<void> => {
	const ref = db.collection(ATTEMPTS_COLLECTION).doc(`rate_${getAttemptWindowId(accountId, nowMs)}`);
	await db.runTransaction(async (transaction) => {
		const snapshot = await transaction.get(ref);
		const count = Number(snapshot.data()?.count || 0);
		if (count >= MAX_ATTEMPTS_PER_HOUR) {
			throw new functions.https.HttpsError(
				'resource-exhausted',
				'Too many access-code attempts. Try again later.',
			);
		}
		transaction.set(
			ref,
			{
				accountId,
				windowStartsAtMs: Math.floor(nowMs / (60 * 60 * 1000)) * 60 * 60 * 1000,
				count: count + 1,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		);
	});
};

const writeRedemptionOutcomeAudit = async (params: {
	accountId: string;
	actorUserId: string;
	requestId: string;
	action: 'program.redemption_failed' | 'program.redemption_replayed';
	stage: 'preview' | 'redeem';
	outcome: string;
	programId?: string;
}): Promise<void> => {
	const effectiveRequestId = `${params.stage}:${params.requestId}`;
	const eventId = getAdminAuditEventId(params.action, effectiveRequestId);
	try {
		await db.collection(AUDIT_COLLECTION).doc(eventId).create({
			eventId,
			action: params.action,
			category: 'entitlement_program',
			actorUserId: params.actorUserId,
			targetAccountId: params.accountId,
			targetUserId: params.actorUserId,
			programId: params.programId || null,
			reason: params.outcome,
			requestId: effectiveRequestId,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			before: { redeemed: false },
			after: { redeemed: false, outcome: params.outcome },
			metadata: { source: 'customer_access_code', stage: params.stage, plaintextStored: false },
		});
	} catch (error: any) {
		if (Number(error?.code) !== 6 && String(error?.code || '') !== 'already-exists') throw error;
	}
};

const outcomeForError = (error: unknown): string => {
	if (error instanceof functions.https.HttpsError) return String(error.code || 'failed');
	return 'internal';
};

const loadProgramAndCode = async (
	codeHash: string,
	nowMs: number,
): Promise<{
	program: AccessCodeProgram;
	programRef: admin.firestore.DocumentReference;
	code: AccessCodeRecord;
	codeRef: admin.firestore.DocumentReference;
}> => {
	const codeRef = db.collection(CODES_COLLECTION).doc(codeHash);
	const codeSnapshot = await codeRef.get();
	if (!codeSnapshot.exists) {
		throw new functions.https.HttpsError('not-found', 'That access code is not available.');
	}
	const code = asCodeRecord(codeSnapshot.data());
	if (
		code.status !== 'active' ||
		!code.programId ||
		(code.expiresAtMs && code.expiresAtMs <= nowMs) ||
		code.maxRedemptions < 1 ||
		Number(code.redeemedCount || 0) >= code.maxRedemptions
	) {
		throw new functions.https.HttpsError('failed-precondition', 'That access code is no longer available.');
	}
	const programRef = db.collection(PROGRAMS_COLLECTION).doc(code.programId);
	const programSnapshot = await programRef.get();
	if (!programSnapshot.exists) {
		throw new functions.https.HttpsError('failed-precondition', 'The access program is unavailable.');
	}
	const program = asProgram(programSnapshot.id, programSnapshot.data());
	if (
		(program.redemptionExpiresAtMs && program.redemptionExpiresAtMs <= nowMs) ||
		Number(program.redeemedCount || 0) >= program.totalRedemptionLimit
	) {
		throw new functions.https.HttpsError('failed-precondition', 'This access program has ended.');
	}
	return { program, programRef, code, codeRef };
};

const previewForProgram = (program: AccessCodeProgram): ComplimentaryAccessPreview => ({
	programId: program.programId,
	label: program.label,
	bundleId: program.bundleId,
	durationDays: program.durationDays,
	transitionMode: program.transitionMode,
	fallbackPlanId: program.fallbackPlanId,
	limitOverrides: program.limitOverrides || {},
	automaticBilling: false,
	recipientRestricted: false,
});

export const assertRecipientEligibility = (
	code: AccessCodeRecord,
	email: unknown,
	emailVerified: boolean,
): void => {
	const restrictedEmail = text(code.recipientEmailLower).toLowerCase();
	if (!restrictedEmail) return;
	if (text(email).toLowerCase() !== restrictedEmail) {
		throw new functions.https.HttpsError(
			'permission-denied',
			'This access code was issued for a different email address.',
		);
	}
	if (!emailVerified) {
		throw new functions.https.HttpsError(
			'failed-precondition',
			'Verify your email address before activating this access code.',
		);
	}
};

const requestIdForCodeAction = (accountId: string, value: unknown): string => {
	const provided = text(value);
	if (/^[a-zA-Z0-9:_-]{8,120}$/.test(provided)) return provided;
	return `access-code:${accountId}:${createHash('sha256')
		.update(`${Date.now()}:${Math.random()}`)
		.digest('hex')
		.slice(0, 24)}`;
};

export const previewComplimentaryAccessCode = functions
	.region('us-central1')
	.runWith({ secrets: ['COMPLIMENTARY_ACCESS_CODE_PEPPER'] })
	.https.onCall(async (data: { code?: string; requestId?: string }, context) => {
		if (!context.auth?.uid) {
			throw new functions.https.HttpsError('unauthenticated', 'Sign in to preview access.');
		}
		if (!isAccessCodeRolloutEnabled()) {
			throw new functions.https.HttpsError('failed-precondition', 'Complimentary access codes are disabled.');
		}
		const accountId = await resolveAccountIdForUser(context.auth.uid);
		await assertAccountRole(context.auth.uid, accountId, ['account_owner']);
		const nowMs = Date.now();
		const requestId = requestIdForCodeAction(accountId, data?.requestId);
		await assertRateLimit(accountId, nowMs);
		try {
			const codeHash = getComplimentaryAccessCodeHash(
				normalizeComplimentaryAccessCode(data?.code),
				getRuntimePepper(),
			);
			const { program, code } = await loadProgramAndCode(codeHash, nowMs);
			assertRecipientEligibility(
				code,
				context.auth.token.email,
				context.auth.token.email_verified === true,
			);
			await recordAttempt(accountId, requestId, 'previewed', program.programId);
			return {
				success: true,
				preview: {
					...previewForProgram(program),
					recipientRestricted: Boolean(text(code.recipientEmailLower)),
				},
			};
		} catch (error) {
			await recordAttempt(accountId, requestId, 'preview_failed');
			await writeRedemptionOutcomeAudit({
				accountId,
				actorUserId: context.auth.uid,
				requestId,
				action: 'program.redemption_failed',
				stage: 'preview',
				outcome: outcomeForError(error),
			});
			throw error;
		}
	});

export const redeemComplimentaryAccessCodeForAccount = async (params: {
	accountId: string;
	beneficiaryUserId: string;
	codeHash: string;
	requestId: string;
	nowMs: number;
	beneficiaryEmail?: string;
	beneficiaryEmailVerified?: boolean;
}): Promise<{ grantId: string; replayed: boolean; preview: ComplimentaryAccessPreview }> => {
	const { accountId, beneficiaryUserId, codeHash, requestId, nowMs } = params;
	const loaded = await loadProgramAndCode(codeHash, nowMs);
	const { program, programRef, code, codeRef } = loaded;
	const grantId = `access_${createHash('sha256')
		.update(`${program.programId}:${accountId}`)
		.digest('hex')
		.slice(0, 32)}`;
	const accountRef = db.collection('familyAccounts').doc(accountId);
	const userRef = db.collection('users').doc(beneficiaryUserId);
	const grantRef = accountRef.collection('entitlementGrants').doc(grantId);
	const auditEventId = getAdminAuditEventId('program.applied', requestId);
	const auditRef = db.collection(AUDIT_COLLECTION).doc(auditEventId);

	const replayed = await db.runTransaction(async (transaction) => {
		const [accountSnapshot, userSnapshot, codeSnapshot, programSnapshot, grantSnapshot, auditSnapshot] =
			await Promise.all([
				transaction.get(accountRef),
				transaction.get(userRef),
				transaction.get(codeRef),
				transaction.get(programRef),
				transaction.get(grantRef),
				transaction.get(auditRef),
			]);
		if (auditSnapshot.exists || grantSnapshot.exists) return true;
		if (!accountSnapshot.exists || !userSnapshot.exists) {
			throw new functions.https.HttpsError('failed-precondition', 'The account is unavailable.');
		}
		const account = accountSnapshot.data() || {};
		const user = userSnapshot.data() || {};
		if (text(account.ownerId) !== beneficiaryUserId || user.isAccountOwner === false) {
			throw new functions.https.HttpsError('permission-denied', 'Only the account owner can redeem access.');
		}
		const liveCode = asCodeRecord(codeSnapshot.data());
		const liveProgram = asProgram(programSnapshot.id, programSnapshot.data());
		assertRecipientEligibility(
			liveCode,
			params.beneficiaryEmail,
			params.beneficiaryEmailVerified === true,
		);
		const basePlan = text((account.subscription as any)?.plan || (user.subscription as any)?.plan || 'homeowner');
		if (!liveProgram.eligibleBasePlans?.includes(basePlan)) {
			throw new functions.https.HttpsError('failed-precondition', 'This account is not eligible for the access program.');
		}
		const currentProjection = (account.effectiveEntitlementProjection || {}) as Record<string, any>;
		const hasEquivalentPermanentAccess = Array.isArray(currentProjection.activeGrants) &&
			currentProjection.activeGrants.some((grant: any) =>
				grant?.kind === 'permanent' &&
				grant?.state === 'active' &&
				Number(ACCESS_RANK[grant?.bundleId as AccessCodeProgram['bundleId']] || 0) >=
					ACCESS_RANK[liveProgram.bundleId],
			);
		if (hasEquivalentPermanentAccess) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'This account already has equal or greater permanent access.',
			);
		}
		if (
			liveCode.status !== 'active' ||
			(liveCode.expiresAtMs && liveCode.expiresAtMs <= nowMs) ||
			Number(liveCode.redeemedCount || 0) >= liveCode.maxRedemptions ||
			(liveProgram.redemptionExpiresAtMs && liveProgram.redemptionExpiresAtMs <= nowMs) ||
			Number(liveProgram.redeemedCount || 0) >= liveProgram.totalRedemptionLimit
		) {
			throw new functions.https.HttpsError('failed-precondition', 'That access code is no longer available.');
		}

		const startsAtMs = nowMs;
		const endsAtMs = startsAtMs + liveProgram.durationDays * DAY_MS;
		const grant: EntitlementGrant & Record<string, unknown> = {
			grantId,
			programId: liveProgram.programId,
			accountId,
			kind: 'temporary',
			state: 'active',
			bundleId: liveProgram.bundleId,
			bundleVersion: liveProgram.bundleVersion || BUNDLE_VERSION,
			bundleLimitOverrides: liveProgram.limitOverrides || {},
			startsAtMs,
			endsAtMs,
			source: 'promotion' as EntitlementGrantSource,
			beneficiaryUserId,
			idempotencyKey: `${liveProgram.programId}:${accountId}`,
			issuedByUserId: beneficiaryUserId,
			issuedAtMs: startsAtMs,
			auditReason: 'Customer redeemed an approved complimentary access program.',
			policyVersion: liveProgram.policyVersion,
			transition: {
				mode: liveProgram.transitionMode,
				status: 'not_configured',
			},
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		};
		const projectedGrant = {
			grantId,
			programId: liveProgram.programId,
			accountId,
			kind: 'temporary',
			state: 'active',
			bundleId: liveProgram.bundleId,
			bundleVersion: liveProgram.bundleVersion || BUNDLE_VERSION,
			bundleLimitOverrides: liveProgram.limitOverrides || {},
			startsAtMs,
			endsAtMs,
			source: 'promotion',
			policyVersion: liveProgram.policyVersion,
			transition: {
				mode: liveProgram.transitionMode,
				status: 'not_configured',
			},
		};
		const projection = (account.effectiveEntitlementProjection || {}) as Record<string, any>;
		const existingGrants = Array.isArray(projection.activeGrants)
			? projection.activeGrants.filter((item: any) => text(item?.grantId) !== grantId)
			: [];
		const existingExpirations =
			typeof projection.bundleExpirationsMs === 'object' && projection.bundleExpirationsMs
				? projection.bundleExpirationsMs
				: {};
		transaction.create(grantRef, grant);
		transaction.update(codeRef, {
			redeemedCount: Number(liveCode.redeemedCount || 0) + 1,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});
		transaction.update(programRef, {
			redeemedCount: Number(liveProgram.redeemedCount || 0) + 1,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});
		transaction.set(
			accountRef,
			{
				effectiveEntitlementProjection: {
					...projection,
					resolverVersion: 'v1',
					activeBundleIds: Array.from(
						new Set([...(Array.isArray(projection.activeBundleIds) ? projection.activeBundleIds : []), liveProgram.bundleId]),
					),
					bundleVersions: Array.from(
						new Set([...(Array.isArray(projection.bundleVersions) ? projection.bundleVersions : []), `${liveProgram.bundleId}@${liveProgram.bundleVersion || BUNDLE_VERSION}`]),
					),
					bundleExpirationsMs: {
						...existingExpirations,
						[liveProgram.bundleId]: Math.max(Number(existingExpirations[liveProgram.bundleId] || 0), endsAtMs),
					},
					activeGrants: [...existingGrants, projectedGrant],
					nextTransitionAtMs:
						Number(projection.nextTransitionAtMs || 0) > nowMs
							? Math.min(Number(projection.nextTransitionAtMs), endsAtMs)
							: endsAtMs,
					calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		);
		transaction.create(auditRef, {
			eventId: auditEventId,
			action: 'program.applied',
			category: 'entitlement_grant',
			actorUserId: beneficiaryUserId,
			targetAccountId: accountId,
			targetUserId: beneficiaryUserId,
			grantId,
			programId: liveProgram.programId,
			reason: 'Customer redeemed an approved complimentary access program.',
			requestId,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			before: { basePlan },
			after: { bundleId: liveProgram.bundleId, startsAtMs, endsAtMs },
			metadata: {
				policyVersion: liveProgram.policyVersion,
				transitionMode: liveProgram.transitionMode,
				source: 'customer_access_code',
			},
		});
		return false;
	});

	return {
		grantId,
		replayed,
		preview: {
			...previewForProgram(program),
			recipientRestricted: Boolean(text(code.recipientEmailLower)),
		},
	};
};

export const redeemComplimentaryAccessCode = functions
	.region('us-central1')
	.runWith({ secrets: ['COMPLIMENTARY_ACCESS_CODE_PEPPER'] })
	.https.onCall(async (data: { code?: string; requestId?: string }, context) => {
		if (!context.auth?.uid) {
			throw new functions.https.HttpsError('unauthenticated', 'Sign in to redeem access.');
		}
		if (!isAccessCodeRolloutEnabled()) {
			throw new functions.https.HttpsError('failed-precondition', 'Complimentary access codes are disabled.');
		}
		const accountId = await resolveAccountIdForUser(context.auth.uid);
		await assertAccountRole(context.auth.uid, accountId, ['account_owner']);
		const nowMs = Date.now();
		const requestId = requestIdForCodeAction(accountId, data?.requestId);
		await assertRateLimit(accountId, nowMs);
		try {
			const codeHash = getComplimentaryAccessCodeHash(
				normalizeComplimentaryAccessCode(data?.code),
				getRuntimePepper(),
			);
			const result = await redeemComplimentaryAccessCodeForAccount({
				accountId,
				beneficiaryUserId: context.auth.uid,
				codeHash,
				requestId,
				nowMs,
				beneficiaryEmail: context.auth.token.email,
				beneficiaryEmailVerified: context.auth.token.email_verified === true,
			});
			await recordAttempt(
				accountId,
				`${requestId}_result`,
				result.replayed ? 'replayed' : 'redeemed',
				result.preview.programId,
			);
			if (result.replayed) {
				await writeRedemptionOutcomeAudit({
					accountId,
					actorUserId: context.auth.uid,
					requestId,
					action: 'program.redemption_replayed',
					stage: 'redeem',
					outcome: 'replayed',
					programId: result.preview.programId,
				});
			}
			return { success: true, ...result };
		} catch (error) {
			await recordAttempt(accountId, `${requestId}_result`, 'redemption_failed');
			await writeRedemptionOutcomeAudit({
				accountId,
				actorUserId: context.auth.uid,
				requestId,
				action: 'program.redemption_failed',
				stage: 'redeem',
				outcome: outcomeForError(error),
			});
			throw error;
		}
	});
