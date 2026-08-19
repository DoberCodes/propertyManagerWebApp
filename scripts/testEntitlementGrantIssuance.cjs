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
const {
	hasAccountCapability,
} = require('../functions/lib/subscriptionEntitlements.js');

const db = admin.firestore();
const DAY_MS = 24 * 60 * 60 * 1_000;
const startsAtMs = Date.parse('2026-07-23T16:00:00.000Z');
const freeSubscription = { status: 'active', plan: 'homeowner' };

const seedAccount = async (
	accountId,
	subscription = freeSubscription,
	{ includeEligibility = true } = {},
) => {
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
		createdAt: admin.firestore.Timestamp.fromDate(
			new Date('2026-07-20T00:00:00.000Z'),
		),
		...(includeEligibility
			? {
					entitlementPrograms: {
						[HOMEOWNER_PLUS_TRIAL_PROGRAM_ID]: {
							programId: HOMEOWNER_PLUS_TRIAL_PROGRAM_ID,
							policyVersion: 'v1',
							status: 'eligible',
						},
					},
			  }
			: {}),
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

	const recoveredEligibilityAccountId = 'recovered-trial-eligibility-owner';
	await seedAccount(recoveredEligibilityAccountId, freeSubscription, {
		includeEligibility: false,
	});
	assert.equal(
		await issueFirstPropertyTrial(
			recoveredEligibilityAccountId,
			'property-recovered',
			startsAtMs,
		),
		'created',
		'An otherwise eligible account must recover when its rollout marker was not written.',
	);
	const recoveredAccount = (
		await db.collection('familyAccounts').doc(recoveredEligibilityAccountId).get()
	).data();
	assert.ok(
		recoveredAccount.entitlementPrograms[HOMEOWNER_PLUS_TRIAL_PROGRAM_ID]
			.recoveredEligibilityAt,
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
	assert.equal(
		await hasAccountCapability(
			eligibleAccountId,
			freeSubscription,
			'notifications.use',
			startsAtMs + 1,
		),
		true,
		'Active account grants must enable server-side capabilities.',
	);
	assert.equal(
		await hasAccountCapability(
			eligibleAccountId,
			freeSubscription,
			'property_intelligence.use',
			startsAtMs + 1,
		),
		true,
	);
	assert.equal(
		await hasAccountCapability(
			eligibleAccountId,
			freeSubscription,
			'team.manage',
			startsAtMs + 1,
		),
		false,
		'Grants must not supply capabilities outside their approved bundle.',
	);
	assert.equal(
		await hasAccountCapability(
			eligibleAccountId,
			freeSubscription,
			'notifications.use',
			grant.endsAtMs + 1,
		),
		true,
		'Core notifications must remain available after a premium grant expires.',
	);
	assert.equal(
		await hasAccountCapability(
			eligibleAccountId,
			freeSubscription,
			'property_intelligence.use',
			grant.endsAtMs + 1,
		),
		false,
		'Expired grants must stop contributing premium server-side capabilities.',
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

	const replacementAccountId = 'deleted-and-replaced-first-property-owner';
	await seedAccount(replacementAccountId);
	assert.equal(
		await issueFirstPropertyTrial(
			replacementAccountId,
			'property-original',
			startsAtMs,
		),
		'created',
	);
	await db.collection('familyAccounts').doc(replacementAccountId).update({
		propertyCount: 0,
	});
	await db.collection('familyAccounts').doc(replacementAccountId).update({
		propertyCount: 1,
	});
	assert.equal(
		await issueFirstPropertyTrial(
			replacementAccountId,
			'property-replacement',
			startsAtMs + 10 * DAY_MS,
		),
		'already_exists',
		'Deleting the first property and creating another must not restart the trial.',
	);
	const replacementGrant = (
		await db
			.collection('familyAccounts')
			.doc(replacementAccountId)
			.collection('entitlementGrants')
			.doc(HOMEOWNER_PLUS_TRIAL_GRANT_ID)
			.get()
	).data();
	assert.equal(replacementGrant.triggerPropertyId, 'property-original');
	assert.equal(replacementGrant.startsAtMs, startsAtMs);

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
	const paidSubscription = {
		status: 'active',
		plan: 'property',
		stripeCustomerId: 'cus_test',
		stripeSubscriptionId: 'sub_test',
	};
	await seedAccount(paidAccountId, paidSubscription);
	assert.equal(
		await issueFirstPropertyTrial(paidAccountId, 'property-paid', startsAtMs),
		'ineligible',
	);
	assert.equal(
		await hasAccountCapability(
			paidAccountId,
			freeSubscription,
			'team.manage',
			startsAtMs + 1,
		),
		true,
		'The family-account subscription must override a stale caller fallback.',
	);

	await grantSnapshot.ref.update({ state: 'revoked' });
	assert.equal(
		await hasAccountCapability(
			eligibleAccountId,
			freeSubscription,
			'property_intelligence.use',
			startsAtMs + 2,
		),
		false,
		'Revoked grants must not contribute premium server-side capabilities.',
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
