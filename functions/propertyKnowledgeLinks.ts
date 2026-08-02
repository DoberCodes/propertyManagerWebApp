import { createHash } from 'crypto';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { assertAccountRole } from './accountAuthz';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const RELATIONSHIP_MANAGER_ROLES = [
	'account_owner',
	'admin',
	'manager',
	'property_manager',
	'assistant_manager',
];
const TASK_MANAGER_ROLES = [
	'account_owner',
	'admin',
	'manager',
	'property_manager',
	'assistant_manager',
	'maintenance_lead',
	'maintenance',
];
const EQUIPMENT_TYPE = 'equipment';
const TASK_TYPE = 'task';
const SPACE_TYPE = 'space';
const SUPPLY_TYPE = 'supply';
const LOCATED_IN = 'located_in';
const OCCURS_IN = 'occurs_in';
const USES = 'uses';

const cleanId = (value: unknown, label: string): string => {
	const normalized = String(value || '').trim();
	if (!normalized || normalized.length > 180) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			`${label} is required.`,
		);
	}
	return normalized;
};

export const normalizeSpaceIds = (value: unknown): string[] => {
	if (!Array.isArray(value)) return [];
	return Array.from(
		new Set(
			value
				.map((candidate) => String(candidate || '').trim())
				.filter((candidate) => candidate.length > 0 && candidate.length <= 180),
		),
	).sort();
};

export const normalizeKnowledgeEndpointIds = normalizeSpaceIds;

export const buildPropertyKnowledgeLinkId = (params: {
	propertyId: string;
	fromType: string;
	fromId: string;
	relationshipType: string;
	toType: string;
	toId: string;
}): string => {
	const canonical = [
		params.propertyId,
		params.fromType,
		params.fromId,
		params.relationshipType,
		params.toType,
		params.toId,
	].join('|');
	return `pkl_${createHash('sha256').update(canonical).digest('hex')}`;
};

const getOwnedProperty = async (propertyId: string) => {
	const snapshot = await db.collection('properties').doc(propertyId).get();
	if (!snapshot.exists) {
		throw new functions.https.HttpsError('not-found', 'Property not found.');
	}
	const accountId = String(snapshot.data()?.accountId || '').trim();
	if (!accountId) {
		throw new functions.https.HttpsError(
			'failed-precondition',
			'This property is missing its account connection.',
		);
	}
	return { accountId };
};

const syncSpaceLinks = async ({
	accountId,
	propertyId,
	fromType,
	fromId,
	relationshipType,
	spaceIds,
	actorUid,
}: {
	accountId: string;
	propertyId: string;
	fromType: typeof EQUIPMENT_TYPE | typeof TASK_TYPE;
	fromId: string;
	relationshipType: typeof LOCATED_IN | typeof OCCURS_IN;
	spaceIds: string[];
	actorUid: string;
}): Promise<number> => {
	const existingSnapshot = await db
		.collection('propertyKnowledgeLinks')
		.where('fromId', '==', fromId)
		.get();
	const existing = existingSnapshot.docs.filter((candidate) => {
		const link = candidate.data();
		return (
			String(link.accountId || '') === accountId &&
			String(link.propertyId || '') === propertyId &&
			link.fromType === fromType &&
			link.relationshipType === relationshipType &&
			link.toType === SPACE_TYPE
		);
	});
	const existingBySpaceId = new Map(
		existing.map((candidate) => [
			String(candidate.data().toId || ''),
			candidate,
		]),
	);
	if (existing.length === 0 && spaceIds.length === 0) return 0;

	const spaceRefs = spaceIds.map((spaceId) =>
		db.collection('propertySpaces').doc(spaceId),
	);
	const spaceSnapshots =
		spaceRefs.length > 0 ? await db.getAll(...spaceRefs) : [];
	for (const snapshot of spaceSnapshots) {
		const space = snapshot.data() || {};
		if (
			!snapshot.exists ||
			String(space.accountId || '') !== accountId ||
			String(space.propertyId || '') !== propertyId ||
			(space.isArchived === true && !existingBySpaceId.has(snapshot.id))
		) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'One or more selected Spaces are no longer available.',
			);
		}
	}

	const desiredSpaceIds = new Set(spaceIds);
	const batch = db.batch();
	const now = new Date().toISOString();

	for (const candidate of existing) {
		if (!desiredSpaceIds.has(String(candidate.data().toId || ''))) {
			batch.delete(candidate.ref);
		}
	}

	for (const spaceId of spaceIds) {
		const current = existingBySpaceId.get(spaceId);
		const linkId = buildPropertyKnowledgeLinkId({
			propertyId,
			fromType,
			fromId,
			relationshipType,
			toType: SPACE_TYPE,
			toId: spaceId,
		});
		batch.set(db.collection('propertyKnowledgeLinks').doc(linkId), {
			accountId,
			propertyId,
			fromType,
			fromId,
			relationshipType,
			toType: SPACE_TYPE,
			toId: spaceId,
			source: 'manual',
			createdAt: current?.data().createdAt || now,
			createdBy: current?.data().createdBy || actorUid,
			updatedAt: now,
			updatedBy: actorUid,
		});
	}

	await batch.commit();
	return spaceIds.length;
};

export const setEquipmentSpaceLinks = functions
	.region('us-central1')
	.https.onCall(
		async (
			data: {
				propertyId?: unknown;
				equipmentId?: unknown;
				spaceIds?: unknown;
			},
			context,
		) => {
			if (!context.auth?.uid) {
				throw new functions.https.HttpsError(
					'unauthenticated',
					'Sign in to update equipment Spaces.',
				);
			}

			const propertyId = cleanId(data?.propertyId, 'Property');
			const equipmentId = cleanId(data?.equipmentId, 'Equipment');
			const spaceIds = normalizeSpaceIds(data?.spaceIds);
			if (spaceIds.length > 100) {
				throw new functions.https.HttpsError(
					'invalid-argument',
					'Equipment can be connected to up to 100 Spaces.',
				);
			}
			const { accountId } = await getOwnedProperty(propertyId);
			await assertAccountRole(
				context.auth.uid,
				accountId,
				RELATIONSHIP_MANAGER_ROLES,
			);

			const equipmentRef = db.collection('devices').doc(equipmentId);
			const equipmentSnapshot = await equipmentRef.get();
			const equipment = equipmentSnapshot.data() || {};
			if (
				!equipmentSnapshot.exists ||
				String(equipment.accountId || '') !== accountId ||
				String(equipment.location?.propertyId || '') !== propertyId
			) {
				throw new functions.https.HttpsError(
					'not-found',
					'Equipment not found for this property.',
				);
			}

			const linkCount = await syncSpaceLinks({
				accountId,
				propertyId,
				fromType: EQUIPMENT_TYPE,
				fromId: equipmentId,
				relationshipType: LOCATED_IN,
				spaceIds,
				actorUid: context.auth.uid,
			});
			return { success: true, linkCount };
		},
	);

export const setTaskSpaceLinks = functions.region('us-central1').https.onCall(
	async (
		data: {
			propertyId?: unknown;
			taskId?: unknown;
			spaceIds?: unknown;
		},
		context,
	) => {
		if (!context.auth?.uid) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'Sign in to update task Spaces.',
			);
		}

		const propertyId = cleanId(data?.propertyId, 'Property');
		const taskId = cleanId(data?.taskId, 'Task');
		const spaceIds = normalizeSpaceIds(data?.spaceIds);
		if (spaceIds.length > 100) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Tasks can be connected to up to 100 Spaces.',
			);
		}
		const { accountId } = await getOwnedProperty(propertyId);
		await assertAccountRole(context.auth.uid, accountId, TASK_MANAGER_ROLES);

		const taskSnapshot = await db.collection('tasks').doc(taskId).get();
		const task = taskSnapshot.data() || {};
		if (
			!taskSnapshot.exists ||
			String(task.accountId || task.userId || '') !== accountId ||
			String(task.propertyId || '') !== propertyId
		) {
			throw new functions.https.HttpsError(
				'not-found',
				'Task not found for this property.',
			);
		}

		const linkCount = await syncSpaceLinks({
			accountId,
			propertyId,
			fromType: TASK_TYPE,
			fromId: taskId,
			relationshipType: OCCURS_IN,
			spaceIds,
			actorUid: context.auth.uid,
		});
		return { success: true, linkCount };
	},
);

export const removePropertySpace = functions
	.region('us-central1')
	.https.onCall(async (data: { spaceId?: unknown }, context) => {
		if (!context.auth?.uid) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'Sign in to remove a Space.',
			);
		}
		const spaceId = cleanId(data?.spaceId, 'Space');
		const spaceRef = db.collection('propertySpaces').doc(spaceId);
		const spaceSnapshot = await spaceRef.get();
		if (!spaceSnapshot.exists) {
			throw new functions.https.HttpsError('not-found', 'Space not found.');
		}
		const space = spaceSnapshot.data() || {};
		const accountId = String(space.accountId || '').trim();
		await assertAccountRole(
			context.auth.uid,
			accountId,
			RELATIONSHIP_MANAGER_ROLES,
		);

		const linksSnapshot = await db
			.collection('propertyKnowledgeLinks')
			.where('toId', '==', spaceId)
			.get();
		const isReferenced = linksSnapshot.docs.some((candidate) => {
			const link = candidate.data();
			return (
				String(link.accountId || '') === accountId &&
				String(link.propertyId || '') === String(space.propertyId || '') &&
				link.toType === SPACE_TYPE
			);
		});

		if (isReferenced) {
			await spaceRef.update({
				isArchived: true,
				updatedAt: new Date().toISOString(),
				updatedBy: context.auth.uid,
			});
			return { success: true, archived: true };
		}

		await spaceRef.delete();
		return { success: true, archived: false };
	});

export const restorePropertySpace = functions
	.region('us-central1')
	.https.onCall(async (data: { spaceId?: unknown }, context) => {
		if (!context.auth?.uid) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'Sign in to restore a Space.',
			);
		}
		const spaceId = cleanId(data?.spaceId, 'Space');
		const spaceRef = db.collection('propertySpaces').doc(spaceId);
		const spaceSnapshot = await spaceRef.get();
		if (!spaceSnapshot.exists) {
			throw new functions.https.HttpsError('not-found', 'Space not found.');
		}
		const space = spaceSnapshot.data() || {};
		const accountId = String(space.accountId || '').trim();
		await assertAccountRole(
			context.auth.uid,
			accountId,
			RELATIONSHIP_MANAGER_ROLES,
		);

		if (space.isArchived !== true) {
			return { success: true, restored: false };
		}

		await spaceRef.update({
			isArchived: false,
			updatedAt: new Date().toISOString(),
			updatedBy: context.auth.uid,
		});
		return { success: true, restored: true };
	});

type SupplyEndpointType =
	| typeof EQUIPMENT_TYPE
	| typeof SPACE_TYPE
	| typeof TASK_TYPE;

const getSupplyEndpointRef = (
	endpointType: SupplyEndpointType,
	endpointId: string,
) => {
	if (endpointType === EQUIPMENT_TYPE) {
		return db.collection('devices').doc(endpointId);
	}
	if (endpointType === SPACE_TYPE) {
		return db.collection('propertySpaces').doc(endpointId);
	}
	return db.collection('tasks').doc(endpointId);
};

const supplyEndpointMatchesProperty = ({
	endpointType,
	endpoint,
	accountId,
	propertyId,
}: {
	endpointType: SupplyEndpointType;
	endpoint: FirebaseFirestore.DocumentData;
	accountId: string;
	propertyId: string;
}) => {
	if (endpointType === EQUIPMENT_TYPE) {
		return (
			String(endpoint.accountId || '') === accountId &&
			String(endpoint.location?.propertyId || '') === propertyId
		);
	}
	return (
		String(endpoint.accountId || endpoint.userId || '') === accountId &&
		String(endpoint.propertyId || '') === propertyId
	);
};

export const setSupplyLinks = functions.region('us-central1').https.onCall(
	async (
		data: {
			propertyId?: unknown;
			supplyId?: unknown;
			equipmentIds?: unknown;
			spaceIds?: unknown;
			taskIds?: unknown;
		},
		context,
	) => {
		if (!context.auth?.uid) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'Sign in to update Supply connections.',
			);
		}

		const propertyId = cleanId(data?.propertyId, 'Property');
		const supplyId = cleanId(data?.supplyId, 'Supply');
		const endpointGroups: Array<{
			type: SupplyEndpointType;
			ids: string[];
		}> = [
			{
				type: EQUIPMENT_TYPE,
				ids: normalizeKnowledgeEndpointIds(data?.equipmentIds),
			},
			{ type: SPACE_TYPE, ids: normalizeKnowledgeEndpointIds(data?.spaceIds) },
			{ type: TASK_TYPE, ids: normalizeKnowledgeEndpointIds(data?.taskIds) },
		];
		if (endpointGroups.some((group) => group.ids.length > 100)) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'A Supply can connect to up to 100 records of each type.',
			);
		}

		const { accountId } = await getOwnedProperty(propertyId);
		await assertAccountRole(
			context.auth.uid,
			accountId,
			RELATIONSHIP_MANAGER_ROLES,
		);

		const supplyRef = db.collection('propertySupplies').doc(supplyId);
		const supplySnapshot = await supplyRef.get();
		const supply = supplySnapshot.data() || {};
		if (
			!supplySnapshot.exists ||
			String(supply.accountId || '') !== accountId ||
			String(supply.propertyId || '') !== propertyId ||
			supply.isArchived === true
		) {
			throw new functions.https.HttpsError(
				'not-found',
				'Supply not found for this property.',
			);
		}

		const desiredEndpoints = endpointGroups.flatMap((group) =>
			group.ids.map((id) => ({ type: group.type, id })),
		);
		if (desiredEndpoints.length > 200) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'A Supply can connect to up to 200 records total.',
			);
		}
		const existingSnapshot = await db
			.collection('propertyKnowledgeLinks')
			.where('toId', '==', supplyId)
			.get();
		const existing = existingSnapshot.docs.filter((candidate) => {
			const link = candidate.data();
			return (
				String(link.accountId || '') === accountId &&
				String(link.propertyId || '') === propertyId &&
				link.relationshipType === USES &&
				link.toType === SUPPLY_TYPE &&
				[EQUIPMENT_TYPE, SPACE_TYPE, TASK_TYPE].includes(link.fromType)
			);
		});
		const existingByEndpoint = new Map(
			existing.map((candidate) => [
				`${candidate.data().fromType}|${candidate.data().fromId}`,
				candidate,
			]),
		);
		const endpointRefs = desiredEndpoints.map((endpoint) =>
			getSupplyEndpointRef(endpoint.type, endpoint.id),
		);
		const endpointSnapshots =
			endpointRefs.length > 0 ? await db.getAll(...endpointRefs) : [];
		for (let index = 0; index < endpointSnapshots.length; index += 1) {
			const snapshot = endpointSnapshots[index];
			const desired = desiredEndpoints[index];
			const endpoint = snapshot.data() || {};
			if (
				!snapshot.exists ||
				!supplyEndpointMatchesProperty({
					endpointType: desired.type,
					endpoint,
					accountId,
					propertyId,
				}) ||
				(desired.type === SPACE_TYPE &&
					endpoint.isArchived === true &&
					!existingByEndpoint.has(`${desired.type}|${desired.id}`))
			) {
				throw new functions.https.HttpsError(
					'invalid-argument',
					'One or more selected records are no longer available.',
				);
			}
		}

		if (existing.length === 0 && desiredEndpoints.length === 0) {
			return { success: true, linkCount: 0 };
		}

		const desiredKeys = new Set(
			desiredEndpoints.map((endpoint) => `${endpoint.type}|${endpoint.id}`),
		);
		const batch = db.batch();
		const now = new Date().toISOString();

		for (const candidate of existing) {
			const key = `${candidate.data().fromType}|${candidate.data().fromId}`;
			if (!desiredKeys.has(key)) batch.delete(candidate.ref);
		}

		for (const endpoint of desiredEndpoints) {
			const key = `${endpoint.type}|${endpoint.id}`;
			const current = existingByEndpoint.get(key);
			const linkId = buildPropertyKnowledgeLinkId({
				propertyId,
				fromType: endpoint.type,
				fromId: endpoint.id,
				relationshipType: USES,
				toType: SUPPLY_TYPE,
				toId: supplyId,
			});
			batch.set(db.collection('propertyKnowledgeLinks').doc(linkId), {
				accountId,
				propertyId,
				fromType: endpoint.type,
				fromId: endpoint.id,
				relationshipType: USES,
				toType: SUPPLY_TYPE,
				toId: supplyId,
				source: 'manual',
				createdAt: current?.data().createdAt || now,
				createdBy: current?.data().createdBy || context.auth.uid,
				updatedAt: now,
				updatedBy: context.auth.uid,
			});
		}

		await batch.commit();
		return { success: true, linkCount: desiredEndpoints.length };
	},
);

export const removePropertySupply = functions
	.region('us-central1')
	.https.onCall(async (data: { supplyId?: unknown }, context) => {
		if (!context.auth?.uid) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'Sign in to remove a Supply.',
			);
		}
		const supplyId = cleanId(data?.supplyId, 'Supply');
		const supplyRef = db.collection('propertySupplies').doc(supplyId);
		const supplySnapshot = await supplyRef.get();
		if (!supplySnapshot.exists) {
			throw new functions.https.HttpsError('not-found', 'Supply not found.');
		}
		const supply = supplySnapshot.data() || {};
		const accountId = String(supply.accountId || '').trim();
		await assertAccountRole(
			context.auth.uid,
			accountId,
			RELATIONSHIP_MANAGER_ROLES,
		);

		const linksSnapshot = await db
			.collection('propertyKnowledgeLinks')
			.where('toId', '==', supplyId)
			.get();
		const isReferenced = linksSnapshot.docs.some((candidate) => {
			const link = candidate.data();
			return (
				String(link.accountId || '') === accountId &&
				String(link.propertyId || '') === String(supply.propertyId || '') &&
				link.toType === SUPPLY_TYPE
			);
		});

		if (isReferenced) {
			await supplyRef.update({
				isArchived: true,
				updatedAt: new Date().toISOString(),
				updatedBy: context.auth.uid,
			});
			return { success: true, archived: true };
		}

		await supplyRef.delete();
		return { success: true, archived: false };
	});

export const restorePropertySupply = functions
	.region('us-central1')
	.https.onCall(async (data: { supplyId?: unknown }, context) => {
		if (!context.auth?.uid) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'Sign in to restore a Supply.',
			);
		}
		const supplyId = cleanId(data?.supplyId, 'Supply');
		const supplyRef = db.collection('propertySupplies').doc(supplyId);
		const supplySnapshot = await supplyRef.get();
		if (!supplySnapshot.exists) {
			throw new functions.https.HttpsError('not-found', 'Supply not found.');
		}
		const supply = supplySnapshot.data() || {};
		const accountId = String(supply.accountId || '').trim();
		await assertAccountRole(
			context.auth.uid,
			accountId,
			RELATIONSHIP_MANAGER_ROLES,
		);
		if (supply.isArchived !== true) {
			return { success: true, restored: false };
		}
		await supplyRef.update({
			isArchived: false,
			updatedAt: new Date().toISOString(),
			updatedBy: context.auth.uid,
		});
		return { success: true, restored: true };
	});

export const cleanupEquipmentSpaceLinks = functions
	.region('us-central1')
	.firestore.document('devices/{equipmentId}')
	.onDelete(async (_snapshot, context) => {
		const linksSnapshot = await db
			.collection('propertyKnowledgeLinks')
			.where('fromId', '==', context.params.equipmentId)
			.get();
		const matchingLinks = linksSnapshot.docs.filter((candidate) => {
			const link = candidate.data();
			return link.fromType === EQUIPMENT_TYPE;
		});
		if (matchingLinks.length === 0) return null;
		const batch = db.batch();
		matchingLinks.forEach((candidate) => batch.delete(candidate.ref));
		await batch.commit();
		return null;
	});

export const cleanupTaskSpaceLinks = functions
	.region('us-central1')
	.firestore.document('tasks/{taskId}')
	.onDelete(async (_snapshot, context) => {
		const linksSnapshot = await db
			.collection('propertyKnowledgeLinks')
			.where('fromId', '==', context.params.taskId)
			.get();
		const matchingLinks = linksSnapshot.docs.filter((candidate) => {
			const link = candidate.data();
			return link.fromType === TASK_TYPE;
		});
		if (matchingLinks.length === 0) return null;
		const batch = db.batch();
		matchingLinks.forEach((candidate) => batch.delete(candidate.ref));
		await batch.commit();
		return null;
	});
