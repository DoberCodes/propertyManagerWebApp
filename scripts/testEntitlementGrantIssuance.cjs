const assert = require('node:assert/strict');

process.env.GCLOUD_PROJECT =
	process.env.GCLOUD_PROJECT || 'maintley-entitlement-grant-test';
process.env.ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL = 'true';
process.env.ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE = 'true';
process.env.HOMEOWNER_PLUS_TRIAL_ELIGIBILITY_START_AT =
	'2026-07-01T00:00:00.000Z';

const admin = require('../functions/node_modules/firebase-admin');
const {
	HOMEOWNER_PLUS_TRIAL_DURATION_DAYS,
	HOMEOWNER_PLUS_TRIAL_GRANT_ID,
	HOMEOWNER_PLUS_TRIAL_PROGRAM_ID,
	issueFirstPropertyTrial,
} = require('../functions/lib/entitlementGrants.js');

const db = admin.firestore();
const startsAtMs = Date.parse('2026-07-23T16:00:00.000Z');
const freeSubscription = { status: 'active', plan: 'homeowner' };

const seedAccount = async (accountId, subscription = freeSubscription) => {
	await db.collection('users').doc(accountId).set({
		id: accountId,
		accountId,
		isAccountOwner: true,
		subscription,
	});
	await db.collection('familyAccounts').doc(accountId).set({
		ownerId: accountId,
		propertyCount: 1,
		subscription,
		entitlementPrograms: {
			[HOMEOWNER_PLUS_TRIAL_PROGRAM_ID]: {
				programId: HOMEOWNER_PLUS_TRIAL_PROGRAM_ID,
				policyVersion: 'v1',
				status: 'eligible',
			},
		},
	});
};

async function run() {
	assert.ok(
		process.env.FIRESTORE_EMULATOR_HOST,
		'FIRESTORE_EMULATOR_HOST must be provided by emulators:exec.',
	);

	const eligibleAccountId = 'eligible-first-property-owner';
	await seedAccount(eligibleAccountId);
	assert.equal(
		await issueFirstPropertyTrial(eligibleAccountId, 'property-first', startsAtMs),
		'created',
	);
	assert.equal(
		await issueFirstPropertyTrial(
			eligibleAccountId,
			'property-retry',
			startsAtMs + 1_000,
		),
		'already_exists',
	);

	const account = (
		await db.collection('familyAccounts').doc(eligibleAccountId).get()
	).data();
	const grantSnapshot = await db
		.collection('familyAccounts')
		.doc(eligibleAccountId)
		.collection('entitlementGrants')
		.doc(HOMEOWNER_PLUS_TRIAL_GRANT_ID)
		.get();
	const grant = grantSnapshot.data();
	assert.equal(grantSnapshot.exists, true);
	assert.equal(grant.programId, HOMEOWNER_PLUS_TRIAL_PROGRAM_ID);
	assert.equal(grant.bundleId, 'homeowner_plus');
	assert.equal(grant.state, 'active');
	assert.equal(grant.startsAtMs, startsAtMs);
	assert.equal(
		grant.endsAtMs - grant.startsAtMs,
		HOMEOWNER_PLUS_TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1_000,
	);
	assert.equal(grant.stripeCustomerId, undefined);
	assert.equal(grant.stripeSubscriptionId, undefined);
	assert.equal(
		account.entitlementPrograms[HOMEOWNER_PLUS_TRIAL_PROGRAM_ID].status,
		'issued',
	);
	assert.equal(
		account.effectiveEntitlementProjection.activeBundleIds.includes(
			'homeowner_plus',
		),
		true,
	);
	assert.equal(
		account.effectiveEntitlementProjection.nextTransitionAtMs,
		grant.endsAtMs,
	);

	const auditSnapshot = await db
		.collection('admin_audit_logs')
		.where('targetAccountId', '==', eligibleAccountId)
		.get();
	assert.equal(auditSnapshot.size, 1);
	assert.equal(auditSnapshot.docs[0].data().action, 'grant.created');
	assert.equal(
		auditSnapshot.docs[0].data().grantId,
		HOMEOWNER_PLUS_TRIAL_GRANT_ID,
	);

	const checkoutAccountId = 'pending-checkout-owner';
	await seedAccount(checkoutAccountId, {
		...freeSubscription,
		pendingCheckoutPlan: 'homeowner_plus',
	});
	assert.equal(
		await issueFirstPropertyTrial(checkoutAccountId, 'property-checkout', startsAtMs),
		'ineligible',
	);
	assert.equal(
		(
			await db
				.collection('familyAccounts')
				.doc(checkoutAccountId)
				.collection('entitlementGrants')
				.get()
		).empty,
		true,
	);

	const paidAccountId = 'paid-owner';
	await seedAccount(paidAccountId, {
		status: 'active',
		plan: 'homeowner_plus',
		stripeCustomerId: 'cus_test',
		stripeSubscriptionId: 'sub_test',
	});
	assert.equal(
		await issueFirstPropertyTrial(paidAccountId, 'property-paid', startsAtMs),
		'ineligible',
	);

	console.log('Entitlement grant issuance emulator tests passed.');
}

run()
	.then(() => Promise.all(admin.apps.map((app) => app.delete())))
	.catch(async (error) => {
		console.error(error);
		await Promise.all(admin.apps.map((app) => app.delete()));
		process.exitCode = 1;
	});
