import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const ADMIN_USERS_COLLECTION = 'admin_users';
const ADMIN_SESSIONS_COLLECTION = 'admin_sessions';
const FEEDBACK_COLLECTION = 'feedback';
const SESSION_TTL_HOURS = 12;
const MAX_TICKET_RESULTS = 250;
const FEEDBACK_TICKET_PREFIX = 'MNT';

const FEEDBACK_STATUSES = new Set([
	'received',
	'in_progress',
	'resolved',
	'closed',
]);

const FEEDBACK_TYPES = new Set([
	'feedback',
	'feature_request',
	'bug_report',
]);

const normalizeUsername = (value: unknown): string =>
	String(value || '')
		.trim()
		.toLowerCase();

const hashToken = (token: string): string =>
	createHash('sha256').update(token).digest('hex');

const derivePasswordHash = (
	usernameLower: string,
	password: string,
	salt: string,
): string =>
	scryptSync(`${usernameLower}:${password}`, salt, 64).toString('hex');

const safeEqualHex = (leftHex: string, rightHex: string): boolean => {
	if (!leftHex || !rightHex) return false;
	const left = Buffer.from(leftHex, 'hex');
	const right = Buffer.from(rightHex, 'hex');
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
};

const getPublicStatus = (status: string): string => {
	switch (status) {
		case 'received':
			return 'received';
		case 'in_progress':
			return 'planned';
		case 'resolved':
			return 'fixed';
			case 'closed':
				return 'closed';
		default:
			return 'received';
	}
};

const formatFeedbackTicketNumber = (sequence: number): string =>
	`${FEEDBACK_TICKET_PREFIX}-${String(sequence).padStart(6, '0')}`;

const serializeTimestampValue = (value: unknown): unknown => {
	if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
		const tsObj = value as { toDate: () => Date };
		return tsObj.toDate().toISOString();
	}
	return value;
};

const extractStoragePathFromGsUrl = (urlValue: string): string | null => {
	const trimmed = String(urlValue || '').trim();
	if (!trimmed.toLowerCase().startsWith('gs://')) {
		return null;
	}
	const withoutPrefix = trimmed.slice(5);
	const slashIndex = withoutPrefix.indexOf('/');
	if (slashIndex === -1 || slashIndex === withoutPrefix.length - 1) {
		return null;
	}
	return withoutPrefix.slice(slashIndex + 1);
};

const getTicketNumberFromRecord = (
	record: Record<string, unknown>,
	docId: string,
): string => {
	const existing = String(record.ticketNumber || '').trim();
	if (existing) return existing;

	const sequence = Number(record.ticketSequence || 0);
	if (Number.isFinite(sequence) && sequence > 0) {
		return formatFeedbackTicketNumber(sequence);
	}

	return `MNT-LEGACY-${docId.slice(0, 6).toUpperCase()}`;
};

const normalizeStringArray = (value: unknown): string[] =>
	Array.isArray(value)
		? [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))]
		: [];

const isGroupTicketRecord = (record: Record<string, unknown>): boolean =>
	Boolean(record.isGroupTicket);

const normalizeTicketStatus = (value: unknown): string => {
	const normalized = String(value || '').trim().toLowerCase();
	if (normalized === 'reviewed') return 'in_progress';
	return FEEDBACK_STATUSES.has(normalized) ? normalized : 'received';
};

const normalizeTicketType = (value: unknown): string =>
	String(value || '').trim().toLowerCase();

const formatTicketStatusLabel = (status: string): string => {
	switch (normalizeTicketStatus(status)) {
		case 'received':
			return 'Received';
		case 'in_progress':
			return 'In Progress';
		case 'resolved':
			return 'Resolved';
		case 'closed':
			return 'Closed';
		default:
			return 'Received';
	}
};

const pickMergedTicketStatus = (statuses: string[]): string => {
	const order = ['received', 'in_progress', 'resolved', 'closed'];
	const normalizedSet = new Set(statuses.map((status) => normalizeTicketStatus(status)));
	for (let index = order.length - 1; index >= 0; index -= 1) {
		const candidate = order[index];
		if (normalizedSet.has(candidate)) {
			return candidate;
		}
	}
	return 'received';
};

const mergeUniqueAttachments = (
	rawAttachmentsList: unknown[],
): Array<Record<string, unknown>> => {
	const deduped = new Map<string, Record<string, unknown>>();

	for (const rawAttachments of rawAttachmentsList) {
		if (!Array.isArray(rawAttachments)) continue;
		for (const attachment of rawAttachments) {
			const attachmentRecord =
				typeof attachment === 'object' && attachment
					? (attachment as Record<string, unknown>)
					: { value: String(attachment || '') };

			const dedupeKey = JSON.stringify({
				filename: String(attachmentRecord.filename || attachmentRecord.name || '').trim(),
				path: String(attachmentRecord.path || attachmentRecord.storagePath || '').trim(),
				attachmentUrl: String(
					attachmentRecord.attachmentUrl || attachmentRecord.url || attachmentRecord.downloadUrl || '',
				).trim(),
				type: String(attachmentRecord.type || attachmentRecord.contentType || '').trim(),
				sizeBytes: Number(attachmentRecord.sizeBytes || 0),
			});

			if (!deduped.has(dedupeKey)) {
				deduped.set(dedupeKey, attachmentRecord);
			}
		}
	}

	return [...deduped.values()];
};

const buildGroupParentFields = (
	parentId: string,
	childDocs: admin.firestore.DocumentSnapshot[],
	statusFallback: string,
	resolutionNotesFallback: string,
	existingParentRecord?: Record<string, unknown>,
): Record<string, unknown> => {
	const childRecords = childDocs.map((doc) => ({
		id: doc.id,
		record: (doc.data() || {}) as Record<string, unknown>,
	}));

	const childTicketIds = childRecords.map((item) => item.id);
	const childTicketNumbers = childRecords.map((item) =>
		getTicketNumberFromRecord(item.record, item.id),
	);

	const uniqueSubjects = [...new Set(
		childRecords
			.map((item) => String(item.record.subject || '').trim())
			.filter(Boolean),
	)];

	const uniqueMessages = [...new Set(
		childRecords
			.map((item) => String(item.record.message || '').trim())
			.filter(Boolean),
	)];

	const uniqueTypes = [...new Set(
		childRecords
			.map((item) => String(item.record.type || '').trim().toLowerCase())
			.filter(Boolean),
	)];

	const uniqueUserEmails = [...new Set(
		childRecords
			.map((item) => String(item.record.userEmail || '').trim())
			.filter(Boolean),
	)];

	const uniqueUserNames = [...new Set(
		childRecords
			.map((item) => String(item.record.userName || '').trim())
			.filter(Boolean),
	)];

	const statuses = childRecords.map((item) => String(item.record.status || 'received'));
	const mergedStatus = pickMergedTicketStatus([...statuses, statusFallback]);
	const mergedPublicStatus = getPublicStatus(mergedStatus);

	const mergedResolutionNotes =
		String(existingParentRecord?.resolutionNotes || '').trim() ||
		resolutionNotesFallback ||
		String(
			childRecords
				.map((item) => String(item.record.resolutionNotes || '').trim())
				.find(Boolean) || '',
		).trim();

	const mergedMessage = uniqueMessages.length <= 1
		? (uniqueMessages[0] || 'Linked support case')
		: uniqueMessages
			.map((message, index) => `Message ${index + 1}:\n${message}`)
			.join('\n\n---\n\n');

	const mergedSubject = uniqueSubjects.length <= 1
		? (uniqueSubjects[0] || `Linked Case (${childDocs.length} tickets)`)
		: `Linked Case (${childDocs.length} tickets): ${uniqueSubjects.join(' | ')}`;

	const mergedAttachments = mergeUniqueAttachments(
		childRecords.map((item) => item.record.attachments),
	);

	const existingParentTicketNumber = String(existingParentRecord?.ticketNumber || '').trim();
	const existingParentCreatedAt = String(existingParentRecord?.createdAt || '').trim();

	return {
		type: uniqueTypes.length === 1 ? uniqueTypes[0] : 'feedback',
		subject: mergedSubject,
		message: mergedMessage,
		createdAt: existingParentCreatedAt || new Date().toISOString(),
		status: mergedStatus,
		publicStatus: mergedPublicStatus,
		resolutionNotes: mergedResolutionNotes || null,
		linkedPrimaryTicketId: parentId,
		linkedPrimaryTicketNumber:
			existingParentTicketNumber || `MNT-GRP-${parentId.slice(0, 8).toUpperCase()}`,
		isGroupTicket: true,
		isLinkedPrimary: true,
		isLinkedChild: false,
		linkedTicketIds: childTicketIds,
		linkedTicketNumbers: childTicketNumbers,
		groupChildTicketIds: childTicketIds,
		groupChildTicketNumbers: childTicketNumbers,
		childTicketCount: childTicketIds.length,
		ticketNumber:
			existingParentTicketNumber || `MNT-GRP-${parentId.slice(0, 8).toUpperCase()}`,
		userEmail: uniqueUserEmails.join(', ') || null,
		userName: uniqueUserNames.join(', ') || null,
		attachments: mergedAttachments,
		groupMeta: {
			combinedFromTicketIds: childTicketIds,
			combinedFromTicketNumbers: childTicketNumbers,
			combinedAt: new Date().toISOString(),
			deduplicatedSubjectCount: uniqueSubjects.length,
			deduplicatedMessageCount: uniqueMessages.length,
		},
	};
};

const getLinkedPrimaryTicketIdFromRecord = (
	record: Record<string, unknown>,
	docId: string,
): string => {
	const linkedPrimaryTicketId = String(record.linkedPrimaryTicketId || '').trim();
	return linkedPrimaryTicketId || docId;
};

const loadFeedbackDocsByIds = async (
	ids: string[],
): Promise<admin.firestore.DocumentSnapshot[]> => {
	const uniqueIds = [...new Set(ids.map((item) => String(item || '').trim()).filter(Boolean))];
	const docs = await Promise.all(
		uniqueIds.map((id) => db.collection(FEEDBACK_COLLECTION).doc(id).get()),
	);
	return docs.filter((doc) => doc.exists);
};

const getPrimaryFeedbackTicketDoc = async (
	docSnapshot: admin.firestore.DocumentSnapshot,
): Promise<admin.firestore.DocumentSnapshot> => {
	const record = (docSnapshot.data() || {}) as Record<string, unknown>;
	const primaryId = getLinkedPrimaryTicketIdFromRecord(record, docSnapshot.id);
	if (primaryId === docSnapshot.id) {
		return docSnapshot;
	}

	const primaryDoc = await db.collection(FEEDBACK_COLLECTION).doc(primaryId).get();
	return primaryDoc.exists ? primaryDoc : docSnapshot;
};

const getFeedbackTicketGroupDocs = async (
	seedDoc: admin.firestore.DocumentSnapshot,
): Promise<{
	primaryDoc: admin.firestore.DocumentSnapshot;
	docs: admin.firestore.DocumentSnapshot[];
}> => {
	const primaryDoc = await getPrimaryFeedbackTicketDoc(seedDoc);
	const primaryData = (primaryDoc.data() || {}) as Record<string, unknown>;
	const linkedIds = normalizeStringArray(primaryData.linkedTicketIds);
	const docs = await loadFeedbackDocsByIds([primaryDoc.id, seedDoc.id, ...linkedIds]);

	return {
		primaryDoc,
		docs: docs.length > 0 ? docs : [primaryDoc],
	};
};

const normalizePersistedAttachments = async (
	rawAttachments: unknown,
): Promise<Array<Record<string, unknown>>> => {
	if (!Array.isArray(rawAttachments) || rawAttachments.length === 0) {
		return [];
	}

	const bucket = admin.storage().bucket();

	return Promise.all(
		rawAttachments.map(async (rawAttachment, index) => {
			const fallbackName = `attachment-${index + 1}`;
			if (typeof rawAttachment === 'string') {
				const value = rawAttachment.trim();
				if (!value) {
					return { filename: fallbackName, type: 'image/unknown', sizeBytes: 0 };
				}

				if (/^https?:\/\//i.test(value)) {
					return {
						filename: fallbackName,
						type: 'image/unknown',
						sizeBytes: 0,
						attachmentUrl: value,
					};
				}

				const parsedPath = extractStoragePathFromGsUrl(value) || value;
				try {
					const [metadata] = await bucket.file(parsedPath).getMetadata();
					const token = metadata?.metadata?.firebaseStorageDownloadTokens;
					const attachmentUrl = token
						? `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(parsedPath)}?alt=media&token=${token}`
						: undefined;
					return {
						filename: fallbackName,
						type: 'image/unknown',
						sizeBytes: 0,
						path: parsedPath,
						...(attachmentUrl ? { attachmentUrl } : {}),
					};
				} catch {
					return {
						filename: fallbackName,
						type: 'image/unknown',
						sizeBytes: 0,
						path: parsedPath,
					};
				}
			}

			const attachment =
				typeof rawAttachment === 'object' && rawAttachment
					? (rawAttachment as Record<string, unknown>)
					: {};

			const filename = String(attachment.filename || fallbackName).trim() || fallbackName;
			const type = String(attachment.type || attachment.contentType || 'image/unknown');
			const sizeBytes = Number(attachment.sizeBytes || 0);

			const rawUrl = String(
				attachment.attachmentUrl || attachment.url || attachment.downloadUrl || '',
			).trim();
			const rawPath = String(attachment.path || attachment.storagePath || '').trim();

			let attachmentUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : '';
			let path = rawPath;

			if (!path && rawUrl.toLowerCase().startsWith('gs://')) {
				path = extractStoragePathFromGsUrl(rawUrl) || '';
			}

			if (!attachmentUrl && path) {
				try {
					const [metadata] = await bucket.file(path).getMetadata();
					const token = metadata?.metadata?.firebaseStorageDownloadTokens;
					if (token) {
						attachmentUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
					}
				} catch {
					// keep metadata when URL generation fails
				}
			}

			return {
				filename,
				type,
				sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : 0,
				...(path ? { path } : {}),
				...(attachmentUrl ? { attachmentUrl } : {}),
			};
		}),
	);
};

const resolveFeedbackTicketByIdOrNumber = async (
	identifier: string,
): Promise<admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot> => {
	const trimmedIdentifier = String(identifier || '').trim();
	if (!trimmedIdentifier) {
		throw new functions.https.HttpsError('invalid-argument', 'Ticket reference is required.');
	}

	const byIdDoc = await db.collection(FEEDBACK_COLLECTION).doc(trimmedIdentifier).get();
	if (byIdDoc.exists) {
		return byIdDoc;
	}

	const byNumberSnapshot = await db
		.collection(FEEDBACK_COLLECTION)
		.where('ticketNumber', '==', trimmedIdentifier.toUpperCase())
		.limit(1)
		.get();

	if (!byNumberSnapshot.empty) {
		return byNumberSnapshot.docs[0];
	}

	throw new functions.https.HttpsError('not-found', 'Referenced ticket was not found.');
};

type AdminSession = {
	sessionId: string;
	adminUserId: string;
	usernameLower: string;
	username: string;
	displayName: string;
	email: string | null;
	roles: string[];
};

const requireAdminSession = async (sessionToken: string): Promise<AdminSession> => {
	const normalizedToken = String(sessionToken || '').trim();
	if (!normalizedToken) {
		throw new functions.https.HttpsError(
			'unauthenticated',
			'Admin session is required.',
		);
	}

	const tokenHash = hashToken(normalizedToken);
	const snapshot = await db
		.collection(ADMIN_SESSIONS_COLLECTION)
		.where('tokenHash', '==', tokenHash)
		.where('isActive', '==', true)
		.limit(1)
		.get();

	if (snapshot.empty) {
		throw new functions.https.HttpsError(
			'unauthenticated',
			'Admin session is invalid.',
		);
	}

	const sessionDoc = snapshot.docs[0];
	const sessionData = sessionDoc.data() as {
		adminUserId?: string;
		expiresAtMillis?: number;
	};

	const expiresAtMillis = Number(sessionData.expiresAtMillis || 0);
	if (!Number.isFinite(expiresAtMillis) || Date.now() >= expiresAtMillis) {
		await sessionDoc.ref.set(
			{
				isActive: false,
				revokedAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		);
		throw new functions.https.HttpsError(
			'unauthenticated',
			'Admin session has expired. Please sign in again.',
		);
	}

	const adminUserId = String(sessionData.adminUserId || '').trim();
	if (!adminUserId) {
		throw new functions.https.HttpsError(
			'unauthenticated',
			'Admin session is invalid.',
		);
	}

	const adminUserDoc = await db.collection(ADMIN_USERS_COLLECTION).doc(adminUserId).get();
	if (!adminUserDoc.exists) {
		throw new functions.https.HttpsError(
			'unauthenticated',
			'Admin user not found.',
		);
	}

	const adminUserData = adminUserDoc.data() as {
		username?: string;
		usernameLower?: string;
		displayName?: string;
		email?: string;
		roles?: string[];
		isActive?: boolean;
	};

	if (adminUserData.isActive === false) {
		throw new functions.https.HttpsError(
			'unauthenticated',
			'Admin user is inactive.',
		);
	}

	await sessionDoc.ref.set(
		{
			lastValidatedAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{ merge: true },
	);

	return {
		sessionId: sessionDoc.id,
		adminUserId: adminUserDoc.id,
		usernameLower: String(adminUserData.usernameLower || '').trim(),
		username: String(adminUserData.username || adminUserData.usernameLower || '').trim(),
		displayName: String(
			adminUserData.displayName || adminUserData.username || adminUserData.usernameLower || 'Admin',
		),
		email: adminUserData.email ? String(adminUserData.email).trim() : null,
		roles: Array.isArray(adminUserData.roles)
			? adminUserData.roles.map((role) => String(role))
			: [],
	};
};

export const adminPortalLogin = functions.https.onCall(
	async (
		data: { username?: string; password?: string },
	): Promise<{
		sessionToken: string;
		expiresAtMillis: number;
		adminUser: {
			id: string;
			username: string;
			displayName: string;
			email: string | null;
			roles: string[];
		};
	}> => {
		const usernameLower = normalizeUsername(data?.username);
		const password = String(data?.password || '');

		if (!usernameLower || !password.trim()) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Username and password are required.',
			);
		}

		const userSnapshot = await db
			.collection(ADMIN_USERS_COLLECTION)
			.where('usernameLower', '==', usernameLower)
			.where('isActive', '==', true)
			.limit(1)
			.get();

		if (userSnapshot.empty) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Invalid admin credentials.',
			);
		}

		const userDoc = userSnapshot.docs[0];
		const userData = userDoc.data() as {
			username?: string;
			displayName?: string;
			email?: string;
			roles?: string[];
			passwordSalt?: string;
			passwordHash?: string;
		};

		const passwordSalt = String(userData.passwordSalt || '').trim();
		const passwordHash = String(userData.passwordHash || '').trim();
		if (!passwordSalt || !passwordHash) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'Admin user record is missing password hash fields.',
			);
		}

		const computedHash = derivePasswordHash(usernameLower, password, passwordSalt);
		if (!safeEqualHex(computedHash, passwordHash)) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Invalid admin credentials.',
			);
		}

		const sessionToken = randomBytes(48).toString('hex');
		const expiresAtMillis = Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000;
		const tokenHash = hashToken(sessionToken);

		await db.collection(ADMIN_SESSIONS_COLLECTION).add({
			adminUserId: userDoc.id,
			tokenHash,
			isActive: true,
			expiresAtMillis,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			lastValidatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		return {
			sessionToken,
			expiresAtMillis,
			adminUser: {
				id: userDoc.id,
				username: String(userData.username || usernameLower),
				displayName: String(userData.displayName || userData.username || usernameLower),
				email: userData.email ? String(userData.email) : null,
				roles: Array.isArray(userData.roles)
					? userData.roles.map((role) => String(role))
					: [],
			},
		};
	},
);

export const validateAdminPortalSession = functions.https.onCall(
	async (
		data: { sessionToken?: string },
	): Promise<{
		valid: true;
		adminUser: {
			id: string;
			username: string;
			displayName: string;
			email: string | null;
			roles: string[];
		};
	}> => {
		const session = await requireAdminSession(String(data?.sessionToken || ''));
		return {
			valid: true,
			adminUser: {
				id: session.adminUserId,
				username: session.username,
				displayName: session.displayName,
				email: session.email,
				roles: session.roles,
			},
		};
	},
);

export const adminPortalLogout = functions.https.onCall(
	async (data: { sessionToken?: string }): Promise<{ success: true }> => {
		const token = String(data?.sessionToken || '').trim();
		if (!token) {
			return { success: true };
		}

		const tokenHash = hashToken(token);
		const snapshot = await db
			.collection(ADMIN_SESSIONS_COLLECTION)
			.where('tokenHash', '==', tokenHash)
			.where('isActive', '==', true)
			.limit(1)
			.get();

		if (!snapshot.empty) {
			await snapshot.docs[0].ref.set(
				{
					isActive: false,
					revokedAt: admin.firestore.FieldValue.serverTimestamp(),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			);
		}

		return { success: true };
	},
);

export const adminPortalResetPassword = functions.https.onCall(
	async (
		data: {
			sessionToken?: string;
			currentPassword?: string;
			newPassword?: string;
		},
	): Promise<{ success: true; message: string }> => {
		const session = await requireAdminSession(String(data?.sessionToken || ''));
		const currentPassword = String(data?.currentPassword || '');
		const newPassword = String(data?.newPassword || '');

		if (!currentPassword.trim() || !newPassword.trim()) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Current and new passwords are required.',
			);
		}

		if (newPassword.length < 10) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'New password must be at least 10 characters long.',
			);
		}

		const adminUserRef = db.collection(ADMIN_USERS_COLLECTION).doc(session.adminUserId);
		const adminUserDoc = await adminUserRef.get();
		if (!adminUserDoc.exists) {
			throw new functions.https.HttpsError('not-found', 'Admin user not found.');
		}

		const adminUserData = adminUserDoc.data() as {
			passwordSalt?: string;
			passwordHash?: string;
			usernameLower?: string;
		};

		const existingSalt = String(adminUserData.passwordSalt || '').trim();
		const existingHash = String(adminUserData.passwordHash || '').trim();
		const usernameLower = String(
			adminUserData.usernameLower || session.usernameLower || '',
		)
			.trim()
			.toLowerCase();

		if (!existingSalt || !existingHash || !usernameLower) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'Admin user record is missing password fields.',
			);
		}

		const currentHash = derivePasswordHash(usernameLower, currentPassword, existingSalt);
		if (!safeEqualHex(currentHash, existingHash)) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Current password is incorrect.',
			);
		}

		const nextSalt = randomBytes(16).toString('hex');
		const nextHash = derivePasswordHash(usernameLower, newPassword, nextSalt);

		await adminUserRef.set(
			{
				passwordSalt: nextSalt,
				passwordHash: nextHash,
				passwordUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		);

		const activeSessions = await db
			.collection(ADMIN_SESSIONS_COLLECTION)
			.where('adminUserId', '==', session.adminUserId)
			.where('isActive', '==', true)
			.get();

		if (!activeSessions.empty) {
			const batch = db.batch();
			for (const doc of activeSessions.docs) {
				batch.set(
					doc.ref,
					{
						isActive: false,
						revokedAt: admin.firestore.FieldValue.serverTimestamp(),
						revokedReason: 'password_reset',
						updatedAt: admin.firestore.FieldValue.serverTimestamp(),
					},
					{ merge: true },
				);
			}
			await batch.commit();
		}

		return {
			success: true,
			message: 'Password updated. Please sign in again.',
		};
	},
);

export const listFeedbackAdminTickets = functions.https.onCall(
	async (
		data: {
			sessionToken?: string;
			status?: string;
			type?: string;
			limit?: number;
		},
	): Promise<{
		tickets: Array<Record<string, unknown>>;
	}> => {
		await requireAdminSession(String(data?.sessionToken || ''));

		const requestedStatus = String(data?.status || '').trim().toLowerCase();
		const requestedType = String(data?.type || '').trim().toLowerCase();
		const requestedLimit = Number(data?.limit || 100);
		const limit = Number.isFinite(requestedLimit)
			? Math.min(Math.max(requestedLimit, 1), MAX_TICKET_RESULTS)
			: 100;

		const snapshot = await db
			.collection(FEEDBACK_COLLECTION)
			.orderBy('createdAt', 'desc')
			.limit(limit)
			.get();

		let tickets: Array<Record<string, unknown> & { id: string }> = await Promise.all(
			snapshot.docs.map(async (doc) => {
				const raw = doc.data() as Record<string, unknown>;
				return {
					id: doc.id,
					...raw,
					ticketNumber: getTicketNumberFromRecord(raw, doc.id),
					createdAt: serializeTimestampValue(raw.createdAt),
					updatedAt: serializeTimestampValue(raw.updatedAt),
					attachments: await normalizePersistedAttachments(raw.attachments),
				};
			}),
		);

		if (requestedStatus) {
			tickets = tickets.filter(
				(ticket) =>
					String((ticket as Record<string, unknown>)['status'] || '')
						.trim()
						.toLowerCase() === requestedStatus,
			);
		}

		if (requestedType) {
			tickets = tickets.filter(
				(ticket) =>
					String((ticket as Record<string, unknown>)['type'] || '')
						.trim()
						.toLowerCase() === requestedType,
			);
		}

		return { tickets };
	},
);

export const linkFeedbackAdminTickets = functions.https.onCall(
	async (
		data: {
			sessionToken?: string;
			sourceTicketId?: string;
			targetTicketRef?: string;
		},
	): Promise<{ success: true; linkedTicketIds: string[] }> => {
		try {
			console.log('[linkFeedbackAdminTickets] Starting link operation');
			
			const session = await requireAdminSession(String(data?.sessionToken || ''));
			console.log('[linkFeedbackAdminTickets] Session validated for user:', session.username);
			
			const sourceTicketId = String(data?.sourceTicketId || '').trim();
			const targetTicketRef = String(data?.targetTicketRef || '').trim();
			console.log('[linkFeedbackAdminTickets] Linking:', sourceTicketId, '->', targetTicketRef);

			if (!sourceTicketId || !targetTicketRef) {
				throw new functions.https.HttpsError(
					'invalid-argument',
					'Source and target ticket references are required.',
				);
			}

			const sourceDoc = await db.collection(FEEDBACK_COLLECTION).doc(sourceTicketId).get();
			if (!sourceDoc.exists) {
				throw new functions.https.HttpsError('not-found', 'Source ticket was not found.');
			}
			console.log('[linkFeedbackAdminTickets] Source ticket found:', sourceTicketId);

			const targetDoc = await resolveFeedbackTicketByIdOrNumber(targetTicketRef);
			if (!targetDoc.exists) {
				throw new functions.https.HttpsError('not-found', 'Target ticket was not found.');
			}
			console.log('[linkFeedbackAdminTickets] Target ticket found:', targetDoc.id);

			if (targetDoc.id === sourceDoc.id) {
				throw new functions.https.HttpsError(
					'invalid-argument',
					'A ticket cannot be linked to itself.',
				);
			}

			const sourceGroup = await getFeedbackTicketGroupDocs(sourceDoc);
			const targetGroup = await getFeedbackTicketGroupDocs(targetDoc);

			const sourcePrimaryRecord =
				(sourceGroup.primaryDoc.data() || {}) as Record<string, unknown>;
			const targetPrimaryRecord =
				(targetGroup.primaryDoc.data() || {}) as Record<string, unknown>;

			const sourceHasGroupParent = isGroupTicketRecord(sourcePrimaryRecord);
			const targetHasGroupParent = isGroupTicketRecord(targetPrimaryRecord);

			if (sourceHasGroupParent && targetHasGroupParent && sourceGroup.primaryDoc.id === targetGroup.primaryDoc.id) {
				const existingLinkedIds = normalizeStringArray(sourcePrimaryRecord.linkedTicketIds);
				return { success: true, linkedTicketIds: existingLinkedIds };
			}

			const resolvedParentRef = targetHasGroupParent
				? targetGroup.primaryDoc.ref
				: sourceHasGroupParent
					? sourceGroup.primaryDoc.ref
					: db.collection(FEEDBACK_COLLECTION).doc();

			const resolvedParentSnapshot = await resolvedParentRef.get();
			const existingParentRecord = resolvedParentSnapshot.exists
				? ((resolvedParentSnapshot.data() || {}) as Record<string, unknown>)
				: undefined;

			const statusSeed = normalizeTicketStatus(
				targetPrimaryRecord.status || sourcePrimaryRecord.status || 'received',
			);
			const resolutionNotesSeed =
				String(targetPrimaryRecord.resolutionNotes || '').trim() ||
				String(sourcePrimaryRecord.resolutionNotes || '').trim();

			const groupedDocsById = new Map<string, admin.firestore.DocumentSnapshot>();
			for (const doc of [...targetGroup.docs, ...sourceGroup.docs]) {
				groupedDocsById.set(doc.id, doc);
			}

			const allGroupDocs = [...groupedDocsById.values()];
			const childDocs = allGroupDocs.filter((doc) => {
				if (doc.id === resolvedParentRef.id) return false;
				const record = (doc.data() || {}) as Record<string, unknown>;
				return !isGroupTicketRecord(record);
			});

			if (childDocs.length === 0) {
				throw new functions.https.HttpsError(
					'failed-precondition',
					'No child tickets were available to link into a parent case.',
				);
			}

			const parentFields = buildGroupParentFields(
				resolvedParentRef.id,
				childDocs,
				statusSeed,
				resolutionNotesSeed,
				existingParentRecord,
			);

			const parentTicketNumber = String(parentFields.ticketNumber || '').trim();
			const linkedTicketIds = childDocs.map((doc) => doc.id);
			const linkedTicketNumbers = childDocs.map((doc) => getTicketNumberFromRecord((doc.data() || {}) as Record<string, unknown>, doc.id));

			console.log('[linkFeedbackAdminTickets] Group parent ticket:', parentTicketNumber);

			const timestamp = admin.firestore.FieldValue.serverTimestamp();
			const nowIso = new Date().toISOString();
			const noteEntry = {
				note: `Linked into group case ${parentTicketNumber}`,
				createdAt: nowIso,
				adminUserId: session.adminUserId,
				adminUsername: session.username,
			};
			const batch = db.batch();

			batch.set(
				resolvedParentRef,
				{
					...parentFields,
					updatedAt: timestamp,
					updatedByAdminUserId: session.adminUserId,
					updatedByAdminUsername: session.username,
					adminNotes: admin.firestore.FieldValue.arrayUnion(noteEntry),
				},
				{ merge: true },
			);

			const parentStatus = normalizeTicketStatus(parentFields.status);
			const parentPublicStatus = getPublicStatus(parentStatus);
			const parentResolutionNotes = String(parentFields.resolutionNotes || '').trim();

			for (const doc of childDocs) {
				const docData = (doc.data() || {}) as Record<string, unknown>;
				const docTicketNumber = getTicketNumberFromRecord(docData, doc.id);
				const updates: Record<string, unknown> = {
					ticketNumber: docTicketNumber,
					linkedPrimaryTicketId: resolvedParentRef.id,
					linkedPrimaryTicketNumber: parentTicketNumber,
					linkedTicketIds,
					linkedTicketNumbers,
					isLinkedPrimary: false,
					isLinkedChild: true,
					isGroupTicket: false,
					groupParentTicketId: resolvedParentRef.id,
					groupParentTicketNumber: parentTicketNumber,
					updatedAt: timestamp,
					updatedByAdminUserId: session.adminUserId,
					updatedByAdminUsername: session.username,
					status: parentStatus,
					publicStatus: parentPublicStatus,
					adminNotes: admin.firestore.FieldValue.arrayUnion(noteEntry),
				};

				if (parentResolutionNotes) {
					updates.resolutionNotes = parentResolutionNotes;
				}

				batch.set(doc.ref, updates, { merge: true });
			}

			for (const doc of allGroupDocs) {
				if (doc.id === resolvedParentRef.id) continue;
				if (childDocs.some((childDoc) => childDoc.id === doc.id)) continue;
				const docData = (doc.data() || {}) as Record<string, unknown>;
				if (!isGroupTicketRecord(docData)) continue;

				batch.set(
					doc.ref,
					{
						isGroupTicket: false,
						isLinkedPrimary: false,
						isLinkedChild: true,
						linkedPrimaryTicketId: resolvedParentRef.id,
						linkedPrimaryTicketNumber: parentTicketNumber,
						linkedTicketIds,
						linkedTicketNumbers,
						updatedAt: timestamp,
						updatedByAdminUserId: session.adminUserId,
						updatedByAdminUsername: session.username,
					},
					{ merge: true },
				);
			}

			console.log('[linkFeedbackAdminTickets] Committing batch write...');
			await batch.commit();
			console.log('[linkFeedbackAdminTickets] Batch commit successful');

			const refreshedPrimary = await resolvedParentRef.get();
			const refreshedLinkedTicketIds = Array.isArray(refreshedPrimary.data()?.linkedTicketIds)
				? (refreshedPrimary.data()?.linkedTicketIds as unknown[]).map((item) => String(item))
				: [];

			console.log('[linkFeedbackAdminTickets] Link completed successfully');
			return { success: true, linkedTicketIds: refreshedLinkedTicketIds };
		} catch (error: any) {
			console.error('[linkFeedbackAdminTickets] Error:', error);
			
			// If it's already an HttpsError, re-throw it
			if (error instanceof functions.https.HttpsError) {
				throw error;
			}
			
			// Otherwise wrap it as internal error with details
			const message = error?.message || String(error) || 'Unknown error';
			throw new functions.https.HttpsError('internal', `Link operation failed: ${message}`);
		}
	},
);

export const unlinkFeedbackAdminTicket = functions.https.onCall(
	async (
		data: {
			sessionToken?: string;
			ticketId?: string;
		},
	): Promise<{ success: true; parentTicketId?: string }> => {
		const session = await requireAdminSession(String(data?.sessionToken || ''));
		const ticketId = String(data?.ticketId || '').trim();

		if (!ticketId) {
			throw new functions.https.HttpsError('invalid-argument', 'Ticket ID is required.');
		}

		const childRef = db.collection(FEEDBACK_COLLECTION).doc(ticketId);
		const childDoc = await childRef.get();
		if (!childDoc.exists) {
			throw new functions.https.HttpsError('not-found', 'Ticket not found.');
		}

		const childRecord = (childDoc.data() || {}) as Record<string, unknown>;
		const parentTicketId = String(childRecord.linkedPrimaryTicketId || '').trim();
		const isLinkedChild = Boolean(childRecord.isLinkedChild);

		if (!isLinkedChild || !parentTicketId || parentTicketId === ticketId) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'Only linked child tickets can be unlinked.',
			);
		}

		const parentRef = db.collection(FEEDBACK_COLLECTION).doc(parentTicketId);
		const parentDoc = await parentRef.get();
		if (!parentDoc.exists) {
			throw new functions.https.HttpsError('not-found', 'Parent ticket not found.');
		}

		const parentRecord = (parentDoc.data() || {}) as Record<string, unknown>;
		const previousLinkedIds = normalizeStringArray(parentRecord.linkedTicketIds);
		const remainingLinkedIds = previousLinkedIds.filter((id) => id !== ticketId);

		const timestamp = admin.firestore.FieldValue.serverTimestamp();
		const nowIso = new Date().toISOString();
		const noteEntry = {
			note: `Unlinked ticket ${getTicketNumberFromRecord(childRecord, ticketId)} from group case ${String(parentRecord.ticketNumber || parentTicketId)}`,
			createdAt: nowIso,
			adminUserId: session.adminUserId,
			adminUsername: session.username,
		};

		const batch = db.batch();

		batch.set(
			childRef,
			{
				linkedPrimaryTicketId: admin.firestore.FieldValue.delete(),
				linkedPrimaryTicketNumber: admin.firestore.FieldValue.delete(),
				linkedTicketIds: admin.firestore.FieldValue.delete(),
				linkedTicketNumbers: admin.firestore.FieldValue.delete(),
				groupParentTicketId: admin.firestore.FieldValue.delete(),
				groupParentTicketNumber: admin.firestore.FieldValue.delete(),
				isLinkedPrimary: false,
				isLinkedChild: false,
				isGroupTicket: false,
				updatedAt: timestamp,
				updatedByAdminUserId: session.adminUserId,
				updatedByAdminUsername: session.username,
				adminNotes: admin.firestore.FieldValue.arrayUnion(noteEntry),
			},
			{ merge: true },
		);

		if (remainingLinkedIds.length > 0) {
			const remainingDocs = await loadFeedbackDocsByIds(remainingLinkedIds);
			const statusFallback = normalizeTicketStatus(parentRecord.status || 'received');
			const resolutionFallback = String(parentRecord.resolutionNotes || '').trim();
			const rebuiltParentFields = buildGroupParentFields(
				parentTicketId,
				remainingDocs,
				statusFallback,
				resolutionFallback,
				parentRecord,
			);

			batch.set(
				parentRef,
				{
					...rebuiltParentFields,
					updatedAt: timestamp,
					updatedByAdminUserId: session.adminUserId,
					updatedByAdminUsername: session.username,
					adminNotes: admin.firestore.FieldValue.arrayUnion(noteEntry),
				},
				{ merge: true },
			);

			const nextLinkedTicketIds = remainingDocs.map((doc) => doc.id);
			const nextLinkedTicketNumbers = remainingDocs.map((doc) =>
				getTicketNumberFromRecord((doc.data() || {}) as Record<string, unknown>, doc.id),
			);

			for (const remainingDoc of remainingDocs) {
				const remainingData = (remainingDoc.data() || {}) as Record<string, unknown>;
				batch.set(
					remainingDoc.ref,
					{
						ticketNumber: getTicketNumberFromRecord(remainingData, remainingDoc.id),
						linkedPrimaryTicketId: parentTicketId,
						linkedPrimaryTicketNumber: String(rebuiltParentFields.ticketNumber || parentRecord.ticketNumber || ''),
						linkedTicketIds: nextLinkedTicketIds,
						linkedTicketNumbers: nextLinkedTicketNumbers,
						isLinkedPrimary: false,
						isLinkedChild: true,
						isGroupTicket: false,
						groupParentTicketId: parentTicketId,
						groupParentTicketNumber: String(rebuiltParentFields.ticketNumber || parentRecord.ticketNumber || ''),
						updatedAt: timestamp,
						updatedByAdminUserId: session.adminUserId,
						updatedByAdminUsername: session.username,
					},
					{ merge: true },
				);
			}
		} else {
			batch.set(
				parentRef,
				{
					linkedTicketIds: [],
					linkedTicketNumbers: [],
					groupChildTicketIds: [],
					groupChildTicketNumbers: [],
					childTicketCount: 0,
					isGroupTicket: true,
					isLinkedPrimary: true,
					isLinkedChild: false,
					updatedAt: timestamp,
					updatedByAdminUserId: session.adminUserId,
					updatedByAdminUsername: session.username,
					adminNotes: admin.firestore.FieldValue.arrayUnion(noteEntry),
				},
				{ merge: true },
			);
		}

		await batch.commit();
		return { success: true, parentTicketId };
	},
);

export const deleteFeedbackAdminParentTicket = functions.https.onCall(
	async (
		data: {
			sessionToken?: string;
			ticketId?: string;
		},
	): Promise<{ success: true }> => {
		await requireAdminSession(String(data?.sessionToken || ''));
		const ticketId = String(data?.ticketId || '').trim();

		if (!ticketId) {
			throw new functions.https.HttpsError('invalid-argument', 'Ticket ID is required.');
		}

		const ticketRef = db.collection(FEEDBACK_COLLECTION).doc(ticketId);
		const ticketDoc = await ticketRef.get();
		if (!ticketDoc.exists) {
			throw new functions.https.HttpsError('not-found', 'Parent ticket not found.');
		}

		const record = (ticketDoc.data() || {}) as Record<string, unknown>;
		const isParentLike = Boolean(record.isGroupTicket) || Boolean(record.isLinkedPrimary);
		if (!isParentLike) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'Only primary parent tickets can be deleted with this action.',
			);
		}

		const linkedIds = normalizeStringArray(record.linkedTicketIds);
		if (linkedIds.length > 0) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'Cannot delete parent ticket while child tickets are still linked.',
			);
		}

		await ticketRef.delete();
		return { success: true };
	},
);

export const updateFeedbackAdminTicketStatus = functions.https.onCall(
	async (
		data: {
			sessionToken?: string;
			ticketId?: string;
			status?: string;
			internalNote?: string;
			resolutionNotes?: string;
			type?: string;
		},
	): Promise<{ success: true }> => {
		const session = await requireAdminSession(String(data?.sessionToken || ''));
		const ticketId = String(data?.ticketId || '').trim();
		const nextStatus = normalizeTicketStatus(data?.status);
		const internalNote = String(data?.internalNote || '').trim();
		const resolutionNotes = String(data?.resolutionNotes || '').trim();
		const requestedType = String(data?.type || '').trim();
		const nextType = requestedType ? normalizeTicketType(requestedType) : '';

		if (!ticketId) {
			throw new functions.https.HttpsError('invalid-argument', 'Ticket ID is required.');
		}

		if (!FEEDBACK_STATUSES.has(nextStatus)) {
			throw new functions.https.HttpsError('invalid-argument', 'Invalid status value.');
		}

		if (nextType && !FEEDBACK_TYPES.has(nextType)) {
			throw new functions.https.HttpsError('invalid-argument', 'Invalid type value.');
		}

		if ((nextStatus === 'resolved' || nextStatus === 'closed') && !resolutionNotes) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Maintly update is required when setting status to resolved or closed.',
			);
		}

		const docRef = db.collection(FEEDBACK_COLLECTION).doc(ticketId);
		const docSnapshot = await docRef.get();
		if (!docSnapshot.exists) {
			throw new functions.https.HttpsError('not-found', 'Feedback ticket not found.');
		}

		const currentRecord = (docSnapshot.data() || {}) as Record<string, unknown>;
		const currentStatus = normalizeTicketStatus(currentRecord.status);
		const existingResolutionNotes = String(currentRecord.resolutionNotes || '').trim();
		const hasAnyResolutionNotes = Boolean(resolutionNotes || existingResolutionNotes);
		const isTransitioningIntoClosedLikeStatus =
			nextStatus !== currentStatus && (nextStatus === 'resolved' || nextStatus === 'closed');

		if (isTransitioningIntoClosedLikeStatus && !hasAnyResolutionNotes) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Maintly update is required when setting status to resolved or closed.',
			);
		}

		const { docs: groupedDocs } = await getFeedbackTicketGroupDocs(docSnapshot);

		const nowIso = new Date().toISOString();
		const didStatusChange = nextStatus !== currentStatus;
		const hasMaintleyUpdate = Boolean(resolutionNotes);
		const noteEntries = [
			internalNote
				? {
					note: internalNote,
					createdAt: nowIso,
					adminUserId: session.adminUserId,
					adminUsername: session.username,
					noteType: 'internal',
					visibility: 'internal',
				}
				: null,
			resolutionNotes
				? {
					note: resolutionNotes,
					createdAt: nowIso,
					adminUserId: session.adminUserId,
					adminUsername: session.username,
					noteType: 'maintley_update',
					visibility: 'customer',
				}
				: null,
		].filter(Boolean);

		const notificationRecipients = new Map<
			string,
			{ ticketId: string; ticketNumber: string }
		>();

		for (const groupedDoc of groupedDocs) {
			const groupedRecord = (groupedDoc.data() || {}) as Record<string, unknown>;
			const recipientUserId = String(groupedRecord.userId || '').trim();
			if (!recipientUserId || notificationRecipients.has(recipientUserId)) continue;

			notificationRecipients.set(recipientUserId, {
				ticketId: groupedDoc.id,
				ticketNumber: getTicketNumberFromRecord(groupedRecord, groupedDoc.id),
			});
		}

		const statusLabel = formatTicketStatusLabel(nextStatus);
		const notificationsToCreate: Record<string, unknown>[] = [];
		if (didStatusChange || hasMaintleyUpdate) {
			for (const [recipientUserId, recipientTicket] of notificationRecipients.entries()) {
				const ticketLabel = String(recipientTicket.ticketNumber || '').trim() || recipientTicket.ticketId;

				if (didStatusChange && hasMaintleyUpdate) {
					notificationsToCreate.push({
						userId: recipientUserId,
						type: 'maintenance_request',
						title: 'Service Ticket Updated',
						message: `Ticket ${ticketLabel} moved to ${statusLabel} and includes a new Maintley update.`,
						data: {
							ticketId: recipientTicket.ticketId,
							ticketNumber: ticketLabel,
							status: nextStatus,
							hasMaintleyUpdate: true,
							source: 'service_ticket',
						},
						status: 'unread',
						actionUrl: '/settings?category=notifications',
						createdAt: nowIso,
						updatedAt: nowIso,
					});
					continue;
				}

				if (didStatusChange) {
					notificationsToCreate.push({
						userId: recipientUserId,
						type: 'maintenance_request',
						title: 'Service Ticket Status Updated',
						message: `Ticket ${ticketLabel} is now ${statusLabel}.`,
						data: {
							ticketId: recipientTicket.ticketId,
							ticketNumber: ticketLabel,
							status: nextStatus,
							source: 'service_ticket',
						},
						status: 'unread',
						actionUrl: '/settings?category=notifications',
						createdAt: nowIso,
						updatedAt: nowIso,
					});
				}

				if (hasMaintleyUpdate) {
					notificationsToCreate.push({
						userId: recipientUserId,
						type: 'maintenance_request',
						title: 'New Maintley Update',
						message: `Ticket ${ticketLabel} has a new Maintley update from support.`,
						data: {
							ticketId: recipientTicket.ticketId,
							ticketNumber: ticketLabel,
							hasMaintleyUpdate: true,
							source: 'service_ticket',
						},
						status: 'unread',
						actionUrl: '/settings?category=notifications',
						createdAt: nowIso,
						updatedAt: nowIso,
					});
				}
			}
		}

		const updates: Record<string, unknown> = {
			status: nextStatus,
			publicStatus: getPublicStatus(nextStatus),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedByAdminUserId: session.adminUserId,
			updatedByAdminUsername: session.username,
			lastCustomerUpdateAt: admin.firestore.FieldValue.serverTimestamp(),
		};

		if (nextStatus === 'resolved') {
			updates.resolvedAt = admin.firestore.FieldValue.serverTimestamp();
		}
		if (nextStatus === 'closed') {
			updates.closedAt = admin.firestore.FieldValue.serverTimestamp();
		}
		if (resolutionNotes) {
			updates.resolutionNotes = resolutionNotes;
		}
		if (noteEntries.length > 0) {
			updates.adminNotes = admin.firestore.FieldValue.arrayUnion(...noteEntries);
		}
		if (nextType) {
			updates.type = nextType;
		}

		const batch = db.batch();
		for (const groupedDoc of groupedDocs) {
			batch.set(groupedDoc.ref, updates, { merge: true });
		}
		for (const notification of notificationsToCreate) {
			const notificationRef = db.collection('notifications').doc();
			batch.set(notificationRef, notification);
		}

		await batch.commit();
		return { success: true };
	},
);

