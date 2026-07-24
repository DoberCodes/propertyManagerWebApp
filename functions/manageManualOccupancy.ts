import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { hasCapability } from '@maintley/entitlements';
import { assertAccountRole, resolveAccountIdForUser } from './accountAuthz';
import { resolveEntitlementsForAccount } from './subscriptionEntitlements';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const CONTINUITY_BUNDLES = new Set(['property', 'portfolio']);

type OccupancyAction = 'create' | 'update' | 'remove';
type OccupantInput = {
	firstName?: unknown;
	lastName?: unknown;
	email?: unknown;
	phone?: unknown;
	leaseEnd?: unknown;
	tenantInvitationCodeId?: unknown;
};

const cleanText = (value: unknown, maxLength: number): string =>
	String(value || '').trim().slice(0, maxLength);

const sanitizeOccupant = (value: OccupantInput) => {
	const firstName = cleanText(value.firstName, 80);
	const lastName = cleanText(value.lastName, 80);
	const email = cleanText(value.email, 254).toLowerCase();
	const phone = cleanText(value.phone, 40);
	const leaseEnd = cleanText(value.leaseEnd, 40);
	const tenantInvitationCodeId = cleanText(value.tenantInvitationCodeId, 160);
	if (!firstName || !lastName || !email || !email.includes('@')) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'First name, last name, and a valid email are required.',
		);
	}
	return {
		firstName,
		lastName,
		email,
		phone,
		leaseEnd,
		...(tenantInvitationCodeId ? { tenantInvitationCodeId } : {}),
	};
};

export const hasHistoricalResidentContinuity = (params: {
	account?: Record<string, any>;
	propertyTenants?: unknown[];
	grantBundles?: string[];
}): boolean => {
	const account = params.account || {};
	const continuity = account.resourceContinuity || {};
	const historicalPlan = String(account.subscription?.plan || '').trim().toLowerCase();
	return (
		continuity.residentManagementPreviouslyEntitled === true ||
		CONTINUITY_BUNDLES.has(historicalPlan) ||
		(params.propertyTenants || []).length > 0 ||
		(params.grantBundles || []).some((bundleId) => CONTINUITY_BUNDLES.has(bundleId))
	);
};

export const manageManualOccupancy = functions
	.region('us-central1')
	.https.onCall(async (data: {
		action?: OccupancyAction;
		propertyId?: string;
		tenantId?: string;
		occupant?: OccupantInput;
	}, context) => {
		if (!context.auth?.uid) {
			throw new functions.https.HttpsError('unauthenticated', 'Sign in to manage occupancy records.');
		}
		const action = String(data?.action || '') as OccupancyAction;
		const propertyId = cleanText(data?.propertyId, 180);
		const tenantId = cleanText(data?.tenantId, 180);
		if (!['create', 'update', 'remove'].includes(action) || !propertyId) {
			throw new functions.https.HttpsError('invalid-argument', 'A valid occupancy action and property are required.');
		}
		if (action !== 'create' && !tenantId) {
			throw new functions.https.HttpsError('invalid-argument', 'A resident record is required.');
		}

		const accountId = await resolveAccountIdForUser(context.auth.uid);
		await assertAccountRole(context.auth.uid, accountId, ['account_owner', 'admin', 'manager']);
		const propertyRef = db.collection('properties').doc(propertyId);
		const accountRef = db.collection('familyAccounts').doc(accountId);
		const [propertySnapshot, accountSnapshot, grantsSnapshot] = await Promise.all([
			propertyRef.get(),
			accountRef.get(),
			accountRef.collection('entitlementGrants').get(),
		]);
		if (!propertySnapshot.exists || String(propertySnapshot.data()?.accountId || '') !== accountId) {
			throw new functions.https.HttpsError('not-found', 'Property not found for this account.');
		}
		const propertyTenants = Array.isArray(propertySnapshot.data()?.tenants)
			? propertySnapshot.data()!.tenants
			: [];
		const entitlements = await resolveEntitlementsForAccount(accountId);
		const canInviteTenantAccess = hasCapability(entitlements, 'residents.manage');
		const historicalContinuity = hasHistoricalResidentContinuity({
			account: accountSnapshot.data() || {},
			propertyTenants,
			grantBundles: grantsSnapshot.docs.map((doc) => String(doc.data().bundleId || '')),
		});
		if (action === 'create' && !canInviteTenantAccess && !historicalContinuity) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Adding resident records is available after eligible rental access has been established.',
			);
		}

		const occupantInput = data?.occupant || {};
		const occupant = action === 'create' ? sanitizeOccupant(occupantInput) : null;
		const result = await db.runTransaction(async (transaction) => {
			const current = await transaction.get(propertyRef);
			if (!current.exists || String(current.data()?.accountId || '') !== accountId) {
				throw new functions.https.HttpsError('not-found', 'Property not found for this account.');
			}
			const tenants = Array.isArray(current.data()?.tenants) ? [...current.data()!.tenants] : [];
			const index = tenantId
				? tenants.findIndex((candidate: any) => String(candidate?.id || '') === tenantId)
				: -1;
			let effectiveTenantId = tenantId;
			if (action === 'create') {
				effectiveTenantId = `tenant_${propertyId}_${Date.now()}_${context.auth!.uid.slice(0, 8)}`;
				tenants.push({
					id: effectiveTenantId,
					...occupant,
					accessStatus: 'manual_only',
					createdAt: new Date().toISOString(),
				});
			} else if (index < 0) {
				throw new functions.https.HttpsError('not-found', 'Resident record not found.');
			} else if (action === 'update') {
				const sanitizedUpdate = sanitizeOccupant({
					...tenants[index],
					...occupantInput,
				});
				tenants[index] = {
					...tenants[index],
					...sanitizedUpdate,
					updatedAt: new Date().toISOString(),
				};
			} else {
				tenants.splice(index, 1);
			}
			transaction.update(propertyRef, {
				tenants,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			if (canInviteTenantAccess) {
				transaction.set(accountRef, {
					resourceContinuity: {
						residentManagementPreviouslyEntitled: true,
						updatedAt: admin.firestore.FieldValue.serverTimestamp(),
					},
				}, { merge: true });
			}
			return effectiveTenantId;
		});

		return {
			success: true,
			tenantId: result,
			canInviteTenantAccess,
			manualOnly: !canInviteTenantAccess,
		};
	});
