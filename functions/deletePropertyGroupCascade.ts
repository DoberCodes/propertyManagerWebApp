import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { assertAccountRole } from './accountAuthz';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const PROPERTY_GROUP_DELETE_ROLES = ['account_owner', 'admin', 'manager'];
const BATCH_LIMIT = 450;

type DeletePropertyGroupRequest = {
	groupId?: string;
};

type DeletePropertyGroupResult = {
	success: boolean;
	groupId: string;
	accountId: string;
	deleted: Record<string, number>;
	updated: Record<string, number>;
};

const toString = (value: unknown): string => String(value || '').trim();

const chunk = <T>(items: T[], size: number): T[][] => {
	const chunks: T[][] = [];
	for (let index = 0; index < items.length; index += size) {
		chunks.push(items.slice(index, index + size));
	}
	return chunks;
};

const deleteDocs = async (
	docs: FirebaseFirestore.QueryDocumentSnapshot[],
	deleted: Record<string, number>,
	label: string,
) => {
	if (docs.length === 0) return;

	for (const docsChunk of chunk(docs, BATCH_LIMIT)) {
		const batch = db.batch();
		docsChunk.forEach((doc) => batch.delete(doc.ref));
		await batch.commit();
		deleted[label] = (deleted[label] || 0) + docsChunk.length;
	}
};

const updateDocs = async (
	docs: FirebaseFirestore.QueryDocumentSnapshot[],
	updated: Record<string, number>,
	label: string,
) => {
	if (docs.length === 0) return;

	for (const docsChunk of chunk(docs, BATCH_LIMIT)) {
		const batch = db.batch();
		docsChunk.forEach((doc) => {
			batch.update(doc.ref, {
				groupId: admin.firestore.FieldValue.delete(),
				updatedAt: new Date().toISOString(),
			});
		});
		await batch.commit();
		updated[label] = (updated[label] || 0) + docsChunk.length;
	}
};

export const deletePropertyGroupCascade = functions
	.region('us-central1')
	.https.onCall(
		async (
			data: DeletePropertyGroupRequest,
			context,
		): Promise<DeletePropertyGroupResult> => {
			const uid = toString(context.auth?.uid);
			if (!uid) {
				throw new functions.https.HttpsError(
					'unauthenticated',
					'You must be signed in to delete a property group.',
				);
			}

			const groupId = toString(data?.groupId);
			if (!groupId) {
				throw new functions.https.HttpsError(
					'invalid-argument',
					'groupId is required.',
				);
			}

			const groupRef = db.collection('propertyGroups').doc(groupId);
			const groupSnapshot = await groupRef.get();
			if (!groupSnapshot.exists) {
				return {
					success: true,
					groupId,
					accountId: '',
					deleted: {},
					updated: {},
				};
			}

			const groupData = groupSnapshot.data() || {};
			const accountId = toString(groupData.accountId) || toString(groupData.userId);
			if (!accountId) {
				throw new functions.https.HttpsError(
					'failed-precondition',
					'Property group is missing account ownership data.',
				);
			}

			await assertAccountRole(uid, accountId, PROPERTY_GROUP_DELETE_ROLES);

			const deleted: Record<string, number> = {};
			const updated: Record<string, number> = {};

			const membershipsSnapshot = await db
				.collection('propertyGroupMemberships')
				.where('groupId', '==', groupId)
				.get();
			await deleteDocs(
				membershipsSnapshot.docs,
				deleted,
				'propertyGroupMemberships',
			);

			const legacyPropertiesSnapshot = await db
				.collection('properties')
				.where('groupId', '==', groupId)
				.get();
			await updateDocs(legacyPropertiesSnapshot.docs, updated, 'properties');

			await groupRef.delete();
			deleted.propertyGroups = (deleted.propertyGroups || 0) + 1;

			functions.logger.info('Property group cascade delete complete', {
				groupId,
				accountId,
				deleted,
				updated,
			});

			return {
				success: true,
				groupId,
				accountId,
				deleted,
				updated,
			};
		},
	);
