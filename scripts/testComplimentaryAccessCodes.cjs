const assert = require('node:assert/strict');
// This emulator test runs in both root-installed and Functions-only CI jobs.
// Resolve the Admin SDK from the deployable Functions package in either case.
const admin = require('../functions/node_modules/firebase-admin');

process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'maintley-access-code-test';
if (!process.env.FIRESTORE_EMULATOR_HOST) {
	throw new Error('FIRESTORE_EMULATOR_HOST must be provided by emulators:exec.');
}
if (!admin.apps.length) admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT });

const db = admin.firestore();
const {
	getComplimentaryAccessCodeHash,
	redeemComplimentaryAccessCodeForAccount,
} = require('../functions/lib/complimentaryAccessCodes.js');

const pepper = 'maintley-test-pepper-that-is-longer-than-thirty-two-characters';

async function run() {
	const accountId = 'access-code-account';
	const nowMs = Date.UTC(2026, 6, 24, 16, 0, 0);
	const codeHash = getComplimentaryAccessCodeHash('PORTFOLIO-TEST-2026', pepper);
	await db.doc(`users/${accountId}`).set({
		id: accountId,
		accountId,
		isAccountOwner: true,
		subscription: { status: 'active', plan: 'homeowner' },
	});
	await db.doc(`familyAccounts/${accountId}`).set({
		id: accountId,
		ownerId: accountId,
		memberIds: [accountId],
		subscription: { status: 'active', plan: 'homeowner' },
	});
	await db.doc('entitlementAccessPrograms/portfolio_preview_v1').set({
		programId: 'portfolio_preview_v1',
		label: 'Portfolio Preview',
		status: 'active',
		bundleId: 'portfolio',
		bundleVersion: 'v1',
		durationDays: 30,
		totalRedemptionLimit: 3,
		redeemedCount: 0,
		perAccountLimit: 1,
		eligibleBasePlans: ['homeowner'],
		limitOverrides: { files: 100, storage_gb: 2 },
		transitionMode: 'checkout_required',
		fallbackPlanId: 'homeowner',
		policyVersion: 'portfolio-preview-v1',
	});
	await db.doc(`entitlementAccessCodes/${codeHash}`).set({
		programId: 'portfolio_preview_v1',
		status: 'active',
		maxRedemptions: 3,
		redeemedCount: 0,
	});

	const results = await Promise.all([
		redeemComplimentaryAccessCodeForAccount({
			accountId,
			beneficiaryUserId: accountId,
			codeHash,
			requestId: 'redeem-request-0001',
			nowMs,
		}),
		redeemComplimentaryAccessCodeForAccount({
			accountId,
			beneficiaryUserId: accountId,
			codeHash,
			requestId: 'redeem-request-0002',
			nowMs,
		}),
	]);
	assert.equal(results.filter((result) => result.replayed === false).length, 1);
	assert.equal(results.filter((result) => result.replayed === true).length, 1);

	const grants = await db.collection(`familyAccounts/${accountId}/entitlementGrants`).get();
	assert.equal(grants.size, 1);
	const grant = grants.docs[0].data();
	assert.equal(grant.bundleId, 'portfolio');
	assert.deepEqual(grant.bundleLimitOverrides, { files: 100, storage_gb: 2 });
	assert.equal(grant.transition.mode, 'checkout_required');
	assert.equal(grant.stripeCustomerId, undefined);
	assert.equal(grant.stripeSubscriptionId, undefined);

	const [codeSnapshot, programSnapshot, accountSnapshot] = await Promise.all([
		db.doc(`entitlementAccessCodes/${codeHash}`).get(),
		db.doc('entitlementAccessPrograms/portfolio_preview_v1').get(),
		db.doc(`familyAccounts/${accountId}`).get(),
	]);
	assert.equal(codeSnapshot.data().redeemedCount, 1);
	assert.equal(programSnapshot.data().redeemedCount, 1);
	assert.deepEqual(
		accountSnapshot.data().effectiveEntitlementProjection.activeBundleIds,
		['portfolio'],
	);
	const audits = await db
		.collection('admin_audit_logs')
		.where('programId', '==', 'portfolio_preview_v1')
		.get();
	assert.equal(audits.size, 1);
	assert.equal(audits.docs[0].data().action, 'program.applied');

	console.log('Complimentary access-code emulator tests passed.');
}

run()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Complimentary access-code emulator tests failed.');
		console.error(error);
		process.exit(1);
	});
