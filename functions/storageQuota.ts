import { randomUUID } from 'crypto';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { getEntitlementLimit } from '@maintley/entitlements';
import { assertAccountRole, resolveAccountIdForUser } from './accountAuthz';
import { resolveEntitlementsForAccount } from './subscriptionEntitlements';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const RESERVATIONS = 'storageUploadReservations';
const USAGE_COLLECTION = 'storageQuotaState';
const RESERVATION_TTL_MS = 15 * 60 * 1000;
const BYTES_PER_GB = 1024 * 1024 * 1024;

const enabled = (): boolean => process.env.ENABLE_TRUSTED_STORAGE_QUOTA === 'true';
const text = (value: unknown): string => String(value || '').trim();

const assertStoragePathForAccount = async (
	storagePath: string,
	accountId: string,
	uid: string,
): Promise<void> => {
	if (
		storagePath.startsWith(`properties/${accountId}/`) ||
		storagePath.startsWith(`team-member-images/${accountId}/`) ||
		storagePath.startsWith(`team-member-files/${accountId}/`)
	) return;
	if (storagePath.startsWith(`user-profile-images/${uid}/`) && accountId === uid) return;
	const parts = storagePath.split('/');
	if (['device-files', 'maintenance-files'].includes(parts[0]) && parts[1]) {
		const property = await db.collection('properties').doc(parts[1]).get();
		if (property.exists && text(property.data()?.accountId) === accountId) return;
	}
	throw new functions.https.HttpsError('permission-denied', 'The upload path is outside this account.');
};

const resolveAccountIdForStorageObject = async (
	name: string,
	metadata?: Record<string, string> | null,
): Promise<string> => {
	const metadataAccountId = text(metadata?.accountId);
	if (metadataAccountId) return metadataAccountId;
	const parts = name.split('/');
	if (['properties', 'team-member-images', 'team-member-files'].includes(parts[0])) {
		return text(parts[1]);
	}
	if (parts[0] === 'user-profile-images' && parts[1]) {
		return resolveAccountIdForUser(parts[1]);
	}
	if (['device-files', 'maintenance-files'].includes(parts[0]) && parts[1]) {
		const property = await db.collection('properties').doc(parts[1]).get();
		return text(property.data()?.accountId);
	}
	return '';
};

const measureAccountStorage = async (accountId: string) => {
	const properties = await db.collection('properties').where('accountId', '==', accountId).get();
	const prefixes = [
		`properties/${accountId}/`,
		`team-member-images/${accountId}/`,
		`team-member-files/${accountId}/`,
		...properties.docs.flatMap((property) => [
			`device-files/${property.id}/`,
			`maintenance-files/${property.id}/`,
		]),
	];
	const bucket = admin.storage().bucket();
	const files = (await Promise.all(prefixes.map((prefix) => bucket.getFiles({ prefix })))).flatMap(
		([items]) => items,
	);
	const unique = new Map(files.map((file) => [file.name, file]));
	let usedBytes = 0;
	for (const file of unique.values()) {
		const [metadata] = await file.getMetadata();
		usedBytes += Number(metadata.size || 0);
	}
	return { usedBytes, fileCount: unique.size };
};

export const reserveStorageUpload = functions.region('us-central1').https.onCall(
	async (data: { storagePath?: string; sizeBytes?: number; contentType?: string }, context) => {
		if (!context.auth?.uid) throw new functions.https.HttpsError('unauthenticated', 'Sign in to upload files.');
		if (!enabled()) throw new functions.https.HttpsError('failed-precondition', 'Trusted storage quota is disabled.');
		const storagePath = text(data?.storagePath);
		const sizeBytes = Number(data?.sizeBytes);
		const contentType = text(data?.contentType);
		if (!storagePath || !Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > 10 * 1024 * 1024) {
			throw new functions.https.HttpsError('invalid-argument', 'A valid upload path and file size are required.');
		}
		const accountId = await resolveAccountIdForUser(context.auth.uid);
		await assertAccountRole(context.auth.uid, accountId, ['account_owner', 'admin', 'manager']);
		await assertStoragePathForAccount(storagePath, accountId, context.auth.uid);
		const entitlements = await resolveEntitlementsForAccount(accountId);
		const maxFiles = getEntitlementLimit(entitlements, 'files');
		const maxBytes = getEntitlementLimit(entitlements, 'storage_gb') * BYTES_PER_GB;
		if (maxFiles < 1 || maxBytes < 1) {
			throw new functions.https.HttpsError('resource-exhausted', 'File storage is not included with this access.');
		}
		const accountRef = db.collection('familyAccounts').doc(accountId);
		const usageRef = accountRef.collection(USAGE_COLLECTION).doc('current');
		const existingUsage = await usageRef.get();
		const baseline = existingUsage.exists
			? null
			: await measureAccountStorage(accountId);
		const reservationId = randomUUID();
		const reservationRef = db.collection(RESERVATIONS).doc(reservationId);
		const nowMs = Date.now();
		const expiresAtMs = nowMs + RESERVATION_TTL_MS;
		await db.runTransaction(async (transaction) => {
			const [usageSnapshot, pendingSnapshot] = await Promise.all([
				transaction.get(usageRef),
				transaction.get(db.collection(RESERVATIONS).where('accountId', '==', accountId)),
			]);
			const usage = usageSnapshot.data() || baseline || { usedBytes: 0, fileCount: 0 };
			const pending = pendingSnapshot.docs
				.map((doc) => doc.data())
				.filter((item) => item.status === 'reserved' && Number(item.expiresAtMs || 0) > nowMs);
			const reservedBytes = pending.reduce((sum, item) => sum + Number(item.sizeBytes || 0), 0);
			if (Number(usage.fileCount || 0) + pending.length + 1 > maxFiles) {
				throw new functions.https.HttpsError('resource-exhausted', `Storage file limit reached. This access allows ${maxFiles} files.`);
			}
			if (Number(usage.usedBytes || 0) + reservedBytes + sizeBytes > maxBytes) {
				throw new functions.https.HttpsError('resource-exhausted', 'Storage byte limit reached. Delete files or upgrade before uploading.');
			}
			if (!usageSnapshot.exists) {
				transaction.set(usageRef, {
					accountId,
					usedBytes: Number(usage.usedBytes || 0),
					fileCount: Number(usage.fileCount || 0),
					reconciledAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			}
			transaction.create(reservationRef, {
				reservationId,
				accountId,
				userId: context.auth!.uid,
				storagePath,
				sizeBytes,
				contentType,
				status: 'reserved',
				expiresAtMs,
				expiresAt: admin.firestore.Timestamp.fromMillis(expiresAtMs),
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
			});
		});
		return { success: true, reservationId, accountId, expiresAtMs };
	},
);

export const getStorageQuotaStatus = functions.region('us-central1').https.onCall(
	async (_data, context) => {
		if (!context.auth?.uid) throw new functions.https.HttpsError('unauthenticated', 'Sign in to view storage usage.');
		if (!enabled()) throw new functions.https.HttpsError('failed-precondition', 'Trusted storage quota is disabled.');
		const accountId = await resolveAccountIdForUser(context.auth.uid);
		await assertAccountRole(context.auth.uid, accountId, ['account_owner', 'admin', 'manager']);
		const usageRef = db.collection('familyAccounts').doc(accountId).collection(USAGE_COLLECTION).doc('current');
		let usageSnapshot = await usageRef.get();
		if (!usageSnapshot.exists) {
			const measured = await measureAccountStorage(accountId);
			await usageRef.set({
				accountId,
				...measured,
				reconciledAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			usageSnapshot = await usageRef.get();
		}
		const entitlements = await resolveEntitlementsForAccount(accountId);
		const appliedBundle = entitlements.appliedBundleIds[entitlements.appliedBundleIds.length - 1];
		return {
			success: true,
			accountId,
			planId: appliedBundle ? String(appliedBundle).split('@')[0] : entitlements.basePlanId,
			usedBytes: Number(usageSnapshot.data()?.usedBytes || 0),
			fileCount: Number(usageSnapshot.data()?.fileCount || 0),
			maxFiles: getEntitlementLimit(entitlements, 'files'),
			maxBytes: getEntitlementLimit(entitlements, 'storage_gb') * BYTES_PER_GB,
		};
	},
);

export const finalizeStorageQuotaUsage = functions.storage.object().onFinalize(async (object) => {
	const reservationId = text(object.metadata?.quotaReservationId);
	if (!reservationId) return null;
	const reservationRef = db.collection(RESERVATIONS).doc(reservationId);
	await db.runTransaction(async (transaction) => {
		const reservation = await transaction.get(reservationRef);
		if (
			!reservation.exists ||
			reservation.data()?.status !== 'reserved' ||
			text(reservation.data()?.storagePath) !== text(object.name) ||
			Number(reservation.data()?.sizeBytes || 0) !== Number(object.size || 0)
		) return;
		const data = reservation.data()!;
		const usageRef = db.collection('familyAccounts').doc(text(data.accountId)).collection(USAGE_COLLECTION).doc('current');
		const usage = await transaction.get(usageRef);
		transaction.set(usageRef, {
			accountId: text(data.accountId),
			usedBytes: Number(usage.data()?.usedBytes || 0) + Number(object.size || data.sizeBytes || 0),
			fileCount: Number(usage.data()?.fileCount || 0) + 1,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		}, { merge: true });
		transaction.update(reservationRef, {
			status: 'consumed',
			consumedAt: admin.firestore.FieldValue.serverTimestamp(),
			objectGeneration: object.generation || null,
		});
	});
	return null;
});

export const releaseStorageQuotaUsage = functions.storage.object().onDelete(async (object) => {
	const accountId = await resolveAccountIdForStorageObject(text(object.name), object.metadata || null);
	if (!accountId) return null;
	const usageRef = db.collection('familyAccounts').doc(accountId).collection(USAGE_COLLECTION).doc('current');
	await db.runTransaction(async (transaction) => {
		const usage = await transaction.get(usageRef);
		if (!usage.exists) return;
		transaction.update(usageRef, {
			usedBytes: Math.max(0, Number(usage.data()?.usedBytes || 0) - Number(object.size || 0)),
			fileCount: Math.max(0, Number(usage.data()?.fileCount || 0) - 1),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});
	});
	return null;
});
