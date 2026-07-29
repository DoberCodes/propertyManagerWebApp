import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { defineSecret } from 'firebase-functions/params';
import {
	createPersonalAssistantToken,
	createTokenVerifier,
	normalizePersonalAssistantScopes,
	normalizePropertyAllowlist,
	PERSONAL_ASSISTANT_SCOPES,
} from './personalAssistantCredentialCore';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const TOKEN_PEPPER = defineSecret('PERSONAL_ASSISTANT_TOKEN_PEPPER');
const COLLECTION = 'personalAssistantCredentials';

const normalizeRole = (value: unknown): string => {
	if (typeof value === 'string') return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
	if (!value || typeof value !== 'object') return '';
	const record = value as Record<string, unknown>;
	return normalizeRole(record.role || record.value || record.maintley_role);
};

const assertMaintleyOwner = async (context: functions.https.CallableContext) => {
	if (!context.auth?.uid) {
		throw new functions.https.HttpsError('unauthenticated', 'Sign in is required.');
	}
	const user = await db.collection('users').doc(context.auth.uid).get();
	if (!user.exists || normalizeRole(user.data()?.maintley_role) !== 'owner') {
		throw new functions.https.HttpsError(
			'permission-denied',
			'Only the Maintley Owner can manage personal assistant access.',
		);
	}
	return context.auth.uid;
};

const validateAccountAndProperties = async (
	ownerUserId: string,
	accountId: string,
	propertyIds: string[],
) => {
	const owner = await db.collection('users').doc(ownerUserId).get();
	const ownerAccountId = String(owner.data()?.accountId || ownerUserId).trim();
	if (!accountId || accountId !== ownerAccountId) {
		throw new functions.https.HttpsError('permission-denied', 'The selected account is not available.');
	}
	if (propertyIds.length === 0) {
		throw new functions.https.HttpsError('invalid-argument', 'Select at least one property.');
	}
	const snapshots = await Promise.all(
		propertyIds.map((propertyId) => db.collection('properties').doc(propertyId).get()),
	);
	if (snapshots.some((snapshot) => !snapshot.exists || String(snapshot.data()?.accountId || '') !== accountId)) {
		throw new functions.https.HttpsError('invalid-argument', 'One or more selected properties are unavailable.');
	}
};

const publicCredential = (snapshot: FirebaseFirestore.DocumentSnapshot) => {
	const data = snapshot.data() || {};
	return {
		credentialId: snapshot.id,
		name: data.name,
		accountId: data.accountId,
		tokenPrefix: data.tokenPrefix,
		scopes: data.scopes || [],
		propertyIds: data.propertyIds || [],
		status: data.status,
		expiresAt: data.expiresAt || null,
		createdAt: data.createdAt || null,
		updatedAt: data.updatedAt || null,
		lastUsedAt: data.lastUsedAt || null,
		revokedAt: data.revokedAt || null,
	};
};

export const managePersonalAssistantCredentials = functions
	.region('us-central1')
	.runWith({ secrets: ['PERSONAL_ASSISTANT_TOKEN_PEPPER'], timeoutSeconds: 60, memory: '256MB' })
	.https.onCall(async (data: Record<string, unknown>, context) => {
		const ownerUserId = await assertMaintleyOwner(context);
		const action = String(data?.action || '').trim();
		if (action === 'list') {
			const snapshot = await db.collection(COLLECTION).where('ownerUserId', '==', ownerUserId).limit(100).get();
			return { credentials: snapshot.docs.map(publicCredential) };
		}

		if (action === 'create') {
			const name = String(data?.name || '').trim();
			const accountId = String(data?.accountId || '').trim();
			const propertyIds = normalizePropertyAllowlist(data?.propertyIds);
			const scopes = normalizePersonalAssistantScopes(data?.scopes);
			if (name.length < 3 || name.length > 80) {
				throw new functions.https.HttpsError('invalid-argument', 'Name must be 3-80 characters.');
			}
			if (scopes.length === 0) {
				throw new functions.https.HttpsError('invalid-argument', 'Select at least one read scope.');
			}
			await validateAccountAndProperties(ownerUserId, accountId, propertyIds);
			const ref = db.collection(COLLECTION).doc();
			const issued = createPersonalAssistantToken(ref.id);
			const expiresAtMs = Number(data?.expiresAtMs || 0);
			await ref.create({
				credentialId: ref.id,
				ownerUserId,
				accountId,
				name,
				tokenPrefix: issued.tokenPrefix,
				tokenVerifier: createTokenVerifier(issued.token, TOKEN_PEPPER.value()),
				scopes,
				propertyIds,
				status: 'active',
				expiresAt: Number.isFinite(expiresAtMs) && expiresAtMs > Date.now() ? expiresAtMs : null,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				lastUsedAt: null,
				revokedAt: null,
			});
			return { credential: publicCredential(await ref.get()), token: issued.token };
		}

		const credentialId = String(data?.credentialId || '').trim();
		const ref = db.collection(COLLECTION).doc(credentialId);
		const existing = await ref.get();
		if (!existing.exists || existing.data()?.ownerUserId !== ownerUserId) {
			throw new functions.https.HttpsError('not-found', 'Credential not found.');
		}
		if (action === 'revoke') {
			await ref.update({
				status: 'revoked',
				revokedAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			return { success: true };
		}
		if (action === 'rotate') {
			const nextRef = db.collection(COLLECTION).doc();
			const issued = createPersonalAssistantToken(nextRef.id);
			const current = existing.data() || {};
			const batch = db.batch();
			batch.create(nextRef, {
				...current,
				credentialId: nextRef.id,
				tokenPrefix: issued.tokenPrefix,
				tokenVerifier: createTokenVerifier(issued.token, TOKEN_PEPPER.value()),
				status: 'active',
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				lastUsedAt: null,
				revokedAt: null,
				rotatedFromCredentialId: credentialId,
			});
			batch.update(ref, {
				status: 'revoked',
				revokedAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			await batch.commit();
			return { credential: publicCredential(await nextRef.get()), token: issued.token };
		}
		throw new functions.https.HttpsError('invalid-argument', 'Unsupported credential action.');
	});

export { PERSONAL_ASSISTANT_SCOPES };
