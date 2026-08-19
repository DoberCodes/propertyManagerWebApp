import * as admin from 'firebase-admin';
import { getAdminAuditEventId } from '@maintley/entitlements';
import { getComplimentaryAccessCodeHash } from '../complimentaryAccessCodes';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const args = new Map<string, string>();
for (let index = 2; index < process.argv.length; index += 1) {
	const key = process.argv[index];
	if (!key.startsWith('--')) continue;
	const next = process.argv[index + 1];
	args.set(key.slice(2), next && !next.startsWith('--') ? next : 'true');
	if (next && !next.startsWith('--')) index += 1;
}

const required = (name: string): string => {
	const value = String(args.get(name) || '').trim();
	if (!value) throw new Error(`--${name} is required.`);
	return value;
};
const positiveInteger = (name: string, fallback?: number): number => {
	const value = Number(args.get(name) || fallback);
	if (!Number.isInteger(value) || value < 1) throw new Error(`--${name} must be a positive integer.`);
	return value;
};

async function run(): Promise<void> {
	const programId = required('program-id');
	const label = required('label');
	const bundleId = required('bundle');
	if (!['homeowner_plus', 'property', 'portfolio'].includes(bundleId)) {
		throw new Error('--bundle must be homeowner_plus, property, or portfolio.');
	}
	const transitionMode = String(args.get('transition') || 'checkout_required');
	if (!['none', 'checkout_required'].includes(transitionMode)) {
		throw new Error('--transition must be none or checkout_required.');
	}
	const code = String(process.env.COMPLIMENTARY_ACCESS_CODE || '').trim();
	const pepper = String(process.env.COMPLIMENTARY_ACCESS_CODE_PEPPER || '').trim();
	if (!code) throw new Error('COMPLIMENTARY_ACCESS_CODE must be supplied through the local environment.');
	const codeHash = getComplimentaryAccessCodeHash(code, pepper);
	const actorUserId = String(process.env.PROVISIONED_BY_USER_ID || '').trim();
	const reason = String(process.env.PROVISION_REASON || '').trim();
	const requestId = String(process.env.PROVISION_REQUEST_ID || '').trim();
	if (!actorUserId || reason.length < 10 || !/^[a-zA-Z0-9:_-]{8,120}$/.test(requestId)) {
		throw new Error('PROVISIONED_BY_USER_ID, PROVISION_REASON, and a stable PROVISION_REQUEST_ID are required.');
	}
	const expirationText = String(args.get('expires-at') || '').trim();
	const redemptionExpiresAtMs = expirationText ? Date.parse(expirationText) : null;
	if (expirationText && !Number.isFinite(redemptionExpiresAtMs)) {
		throw new Error('--expires-at must be an ISO 8601 timestamp.');
	}
	const limitOverrides: Record<string, number> = {};
	if (args.has('files')) limitOverrides.files = positiveInteger('files');
	if (args.has('storage-gb')) limitOverrides.storage_gb = positiveInteger('storage-gb');
	const apply = args.get('apply') === 'true';
	console.log(`${apply ? 'Applying' : 'Previewing'} complimentary access program ${programId}.`);
	console.log(`Bundle: ${bundleId}; duration: ${positiveInteger('duration-days')} days; automatic billing: no.`);
	console.log('The plaintext code and verifier are intentionally not printed.');
	if (!apply) {
		console.log('No records were written. Re-run with --apply after reviewing the configuration.');
		return;
	}

	const programRef = db.collection('entitlementAccessPrograms').doc(programId);
	const codeRef = db.collection('entitlementAccessCodes').doc(codeHash);
	const auditRef = db.collection('admin_audit_logs').doc(getAdminAuditEventId('program.configured', requestId));
	await db.runTransaction(async (transaction) => {
		const [programSnapshot, codeSnapshot, auditSnapshot] = await Promise.all([
			transaction.get(programRef),
			transaction.get(codeRef),
			transaction.get(auditRef),
		]);
		if (auditSnapshot.exists) return;
		if (codeSnapshot.exists && String(codeSnapshot.data()?.programId || '') !== programId) {
			throw new Error('This verifier is already assigned to another program.');
		}
		const programRedemptions = positiveInteger('program-redemptions');
		const codeRedemptions = positiveInteger('code-redemptions', programRedemptions);
		transaction.set(programRef, {
			programId,
			label,
			status: 'active',
			bundleId,
			bundleVersion: 'v1',
			durationDays: positiveInteger('duration-days'),
			redemptionExpiresAtMs,
			totalRedemptionLimit: programRedemptions,
			redeemedCount: Number(programSnapshot.data()?.redeemedCount || 0),
			perAccountLimit: 1,
			eligibleBasePlans: ['homeowner'],
			limitOverrides,
			transitionMode,
			fallbackPlanId: 'homeowner',
			policyVersion: String(args.get('policy-version') || `${programId}-v1`),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		}, { merge: true });
		transaction.set(codeRef, {
			programId,
			status: 'active',
			expiresAtMs: redemptionExpiresAtMs,
			maxRedemptions: codeRedemptions,
			redeemedCount: Number(codeSnapshot.data()?.redeemedCount || 0),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		}, { merge: true });
		transaction.create(auditRef, {
			eventId: auditRef.id,
			action: 'program.configured',
			category: 'entitlement_program',
			actorUserId,
			targetAccountId: 'maintley-platform',
			programId,
			reason,
			requestId,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			before: programSnapshot.exists ? { configured: true } : { configured: false },
			after: { configured: true, bundleId, transitionMode, automaticBilling: false },
			metadata: { source: 'provision_complimentary_access_code', plaintextStored: false },
		});
	});
	console.log(`Program ${programId} and its secure verifier are configured.`);
}

run().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
});
