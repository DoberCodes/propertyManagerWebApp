#!/usr/bin/env node

/**
 * Audits and retires legacy tenant-profile and unit-occupant data.
 *
 * Dry-run is the default. No field values, emails, names, document IDs, or
 * property IDs are logged. Apply mode requires both --apply and the explicit
 * --confirm-no-real-tenants acknowledgement.
 */

const path = require('path');
const admin = require('firebase-admin');

const args = new Set(process.argv.slice(2));
const isApply = args.has('--apply');
const confirmedEmpty = args.has('--confirm-no-real-tenants');

if (isApply && !confirmedEmpty) {
	throw new Error(
		'Apply mode requires --confirm-no-real-tenants. Run the dry-run and review its totals first.',
	);
}

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
	admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

const RETIRED_FIELDS = new Set([
	'dateOfBirth',
	'ssn',
	'socialSecurityNumber',
	'driverLicense',
	'driverLicenseNumber',
	'creditScore',
	'income',
	'bankruptcy',
	'bankruptcies',
	'eviction',
	'evictions',
	'employmentHistory',
	'rentalHistory',
	'references',
	'emergencyContacts',
	'pets',
	'vehicles',
	'smokingStatus',
	'serviceAnimals',
	'screeningStatus',
	'documents',
	'identificationDocuments',
	'payStubs',
	'bankStatements',
	'isPublic',
	'profileCompleteness',
]);

const ALLOWED_TENANT_FIELDS = new Set([
	'id',
	'userId',
	'firstName',
	'lastName',
	'email',
	'phone',
	'leaseEnd',
	'status',
	'tenantInvitationCodeId',
	'createdAt',
	'updatedAt',
]);

function normalizedEmail(value) {
	return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function incrementFieldCounts(target, data) {
	for (const field of RETIRED_FIELDS) {
		if (Object.prototype.hasOwnProperty.call(data, field)) {
			target[field] = (target[field] || 0) + 1;
		}
	}
}

function sanitizeTenant(tenant) {
	return Object.fromEntries(
		Object.entries(tenant || {}).filter(([field]) => ALLOWED_TENANT_FIELDS.has(field)),
	);
}

async function commitOperations(operations) {
	for (let i = 0; i < operations.length; i += 400) {
		const batch = db.batch();
		for (const operation of operations.slice(i, i + 400)) operation(batch);
		await batch.commit();
	}
}

async function run() {
	const [profileSnapshot, propertySnapshot, unitSnapshot] = await Promise.all([
		db.collection('tenantProfiles').get(),
		db.collection('properties').get(),
		db.collection('units').get(),
	]);

	const retiredFieldCounts = {};
	const relationshipKeys = new Map();
	const operations = [];
	let embeddedTenantCount = 0;
	let propertiesNeedingSanitization = 0;
	let unitOccupantCount = 0;
	let unitsWithOccupants = 0;

	for (const profileDoc of profileSnapshot.docs) {
		const data = profileDoc.data() || {};
		incrementFieldCounts(retiredFieldCounts, data);
		const key = `${String(data.propertyId || '')}|${normalizedEmail(data.email)}`;
		if (key !== '|') relationshipKeys.set(key, (relationshipKeys.get(key) || 0) + 1);
		if (isApply) operations.push((batch) => batch.delete(profileDoc.ref));
	}

	for (const propertyDoc of propertySnapshot.docs) {
		const data = propertyDoc.data() || {};
		const tenants = Array.isArray(data.tenants) ? data.tenants : [];
		embeddedTenantCount += tenants.length;
		let needsSanitization = false;
		const sanitized = tenants.map((tenant) => {
			incrementFieldCounts(retiredFieldCounts, tenant || {});
			const key = `${propertyDoc.id}|${normalizedEmail(tenant?.email)}`;
			if (key !== `${propertyDoc.id}|`) {
				relationshipKeys.set(key, (relationshipKeys.get(key) || 0) + 1);
			}
			const next = sanitizeTenant(tenant);
			if (Object.keys(next).length !== Object.keys(tenant || {}).length) needsSanitization = true;
			return next;
		});
		if (needsSanitization) {
			propertiesNeedingSanitization += 1;
			if (isApply) operations.push((batch) => batch.update(propertyDoc.ref, { tenants: sanitized }));
		}
	}

	for (const unitDoc of unitSnapshot.docs) {
		const occupants = Array.isArray(unitDoc.data()?.occupants)
			? unitDoc.data().occupants
			: [];
		if (occupants.length === 0) continue;
		unitsWithOccupants += 1;
		unitOccupantCount += occupants.length;
		if (isApply) operations.push((batch) => batch.update(unitDoc.ref, { occupants: [] }));
	}

	const duplicateRelationshipGroups = [...relationshipKeys.values()].filter(
		(count) => count > 1,
	).length;

	const summary = {
		mode: isApply ? 'apply' : 'dry-run',
		legacyTenantProfiles: profileSnapshot.size,
		embeddedPropertyTenants: embeddedTenantCount,
		propertiesNeedingSanitization,
		unitOccupants: unitOccupantCount,
		unitsWithOccupants,
		duplicateRelationshipGroups,
		retiredFieldOccurrences: Object.values(retiredFieldCounts).reduce(
			(total, count) => total + count,
			0,
		),
	};

	console.log('Tenant-data reduction summary (counts only; no tenant values logged):');
	console.table(summary);
	console.log('Retired field occurrence counts:');
	console.table(retiredFieldCounts);

	if (!isApply) {
		console.log(
			'Dry-run complete. Apply only after review with --apply --confirm-no-real-tenants.',
		);
		return;
	}

	await commitOperations(operations);
	console.log(`Apply complete. ${operations.length} document operations committed.`);
}

run().catch((error) => {
	console.error('Tenant-data reduction failed:', error.message || error);
	process.exit(1);
});
