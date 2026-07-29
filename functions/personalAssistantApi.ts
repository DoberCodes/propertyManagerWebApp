import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { defineSecret } from 'firebase-functions/params';
import {
	parsePersonalAssistantToken,
	tokenVerifierMatches,
	type PersonalAssistantScope,
} from './personalAssistantCredentialCore';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const TOKEN_PEPPER = defineSecret('PERSONAL_ASSISTANT_TOKEN_PEPPER');
const CREDENTIALS = 'personalAssistantCredentials';
const AUDITS = 'personalAssistantAccessAudits';
const RATE_LIMITS = 'personalAssistantRateLimits';
const MAX_PAGE_SIZE = 100;
const MAX_RATE_PER_MINUTE = 120;

type Credential = {
	credentialId: string;
	ownerUserId: string;
	accountId: string;
	scopes: string[];
	propertyIds: string[];
	status: string;
	expiresAt?: number | null;
	tokenVerifier: string;
	lastUsedAt?: FirebaseFirestore.Timestamp | null;
};

class ApiError extends Error {
	constructor(
		readonly status: number,
		readonly code: string,
		message: string,
	) {
		super(message);
	}
}

const timestampValue = (value: unknown): string | null => {
	if (!value) return null;
	if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString();
	if (value instanceof Date) return value.toISOString();
	if (typeof value === 'number') return new Date(value > 10_000_000_000 ? value : value * 1000).toISOString();
	const parsed = new Date(String(value));
	return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const numberParam = (value: unknown, fallback: number) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const pageSize = (value: unknown) => Math.max(1, Math.min(MAX_PAGE_SIZE, numberParam(value, 50)));

const encodeCursor = (id: string) => Buffer.from(JSON.stringify({ id }), 'utf8').toString('base64url');
const decodeCursor = (value: unknown): string | null => {
	if (!value) return null;
	try {
		const parsed = JSON.parse(Buffer.from(String(value), 'base64url').toString('utf8'));
		return typeof parsed.id === 'string' && parsed.id ? parsed.id : null;
	} catch {
		throw new ApiError(400, 'invalid_filter', 'The pagination cursor is invalid.');
	}
};

const authenticate = async (req: functions.https.Request): Promise<Credential> => {
	if ('token' in req.query || 'access_token' in req.query) {
		throw new ApiError(401, 'invalid_token', 'Authentication failed.');
	}
	const header = String(req.headers.authorization || '');
	const match = header.match(/^Bearer\s+(.+)$/i);
	const parsed = parsePersonalAssistantToken(match?.[1] || '');
	if (!parsed) throw new ApiError(401, 'invalid_token', 'Authentication failed.');
	const snapshot = await db.collection(CREDENTIALS).doc(parsed.credentialId).get();
	const data = snapshot.data() as Credential | undefined;
	if (
		!snapshot.exists ||
		!data ||
		data.status !== 'active' ||
		!tokenVerifierMatches(match![1], TOKEN_PEPPER.value(), data.tokenVerifier)
	) {
		throw new ApiError(401, 'invalid_token', 'Authentication failed.');
	}
	if (data.expiresAt && Number(data.expiresAt) <= Date.now()) {
		throw new ApiError(401, 'expired_token', 'Authentication failed.');
	}
	return { ...data, credentialId: snapshot.id };
};

const requireScope = (credential: Credential, scope: PersonalAssistantScope) => {
	if (!credential.scopes.includes(scope)) {
		throw new ApiError(403, 'insufficient_scope', 'The credential does not allow this read operation.');
	}
};

const requireProperty = (credential: Credential, propertyId: string) => {
	if (!credential.propertyIds.includes(propertyId)) {
		throw new ApiError(404, 'property_not_allowed', 'The property is unavailable.');
	}
};

const enforceRateLimit = async (credentialId: string) => {
	const minute = Math.floor(Date.now() / 60_000);
	const ref = db.collection(RATE_LIMITS).doc(`${credentialId}_${minute}`);
	await db.runTransaction(async (transaction) => {
		const snapshot = await transaction.get(ref);
		const count = Number(snapshot.data()?.count || 0);
		if (count >= MAX_RATE_PER_MINUTE) {
			throw new ApiError(429, 'rate_limited', 'Too many requests. Try again shortly.');
		}
		transaction.set(ref, {
			credentialId,
			minute,
			count: count + 1,
			expiresAt: admin.firestore.Timestamp.fromMillis((minute + 2) * 60_000),
		}, { merge: true });
	});
};

const mapProperty = (snapshot: FirebaseFirestore.DocumentSnapshot) => {
	const data = snapshot.data() || {};
	return {
		id: snapshot.id,
		title: String(data.title || data.name || ''),
		address: String(data.address || ''),
		propertyType: data.propertyType || 'residential',
		propertyClassification: data.propertyClassification || null,
		isRental: data.isRental === true,
		bedrooms: Number.isFinite(Number(data.bedrooms)) ? Number(data.bedrooms) : null,
		bathrooms: Number.isFinite(Number(data.bathrooms)) ? Number(data.bathrooms) : null,
		timezone: String(data.timezone || 'America/New_York'),
		createdAt: timestampValue(data.createdAt),
		updatedAt: timestampValue(data.updatedAt),
	};
};

const mapEquipment = (snapshot: FirebaseFirestore.DocumentSnapshot) => {
	const data = snapshot.data() || {};
	return {
		id: snapshot.id,
		propertyId: String(data.propertyId || data.location?.propertyId || ''),
		name: String(data.name || data.title || ''),
		category: data.category || data.type || null,
		manufacturer: data.manufacturer || data.brand || null,
		model: data.model || data.modelNumber || null,
		serialNumber: data.serialNumber || null,
		status: data.status || null,
		installedAt: timestampValue(data.installationDate || data.installedAt),
		warrantyExpiresAt: timestampValue(data.warrantyExpiration || data.warrantyExpiresAt),
		createdAt: timestampValue(data.createdAt),
		updatedAt: timestampValue(data.updatedAt),
	};
};

const mapTask = (snapshot: FirebaseFirestore.DocumentSnapshot) => {
	const data = snapshot.data() || {};
	return {
		id: snapshot.id,
		propertyId: String(data.propertyId || ''),
		title: String(data.title || data.name || ''),
		status: String(data.status || ''),
		priority: data.priority || null,
		dueAt: timestampValue(data.dueDate || data.dueAt),
		equipmentIds: Array.isArray(data.deviceIds) ? data.deviceIds.map(String) : data.deviceId ? [String(data.deviceId)] : [],
		isRecurring: data.isRecurring === true,
		createdAt: timestampValue(data.createdAt),
		updatedAt: timestampValue(data.updatedAt),
	};
};

const mapMaintenanceEvent = (snapshot: FirebaseFirestore.DocumentSnapshot) => {
	const data = snapshot.data() || {};
	return {
		id: snapshot.id,
		propertyId: String(data.propertyId || ''),
		title: String(data.title || data.description || 'Maintenance event'),
		status: data.status || 'completed',
		performedAt: timestampValue(data.performedAt || data.completedAt || data.date),
		taskId: data.taskId || null,
		equipmentIds: Array.isArray(data.deviceIds) ? data.deviceIds.map(String) : data.deviceId ? [String(data.deviceId)] : [],
		source: data.source || 'maintenance_event',
		createdAt: timestampValue(data.createdAt),
		updatedAt: timestampValue(data.updatedAt),
	};
};

const mapDocument = (snapshot: FirebaseFirestore.DocumentSnapshot) => {
	const data = snapshot.data() || {};
	return {
		id: snapshot.id,
		propertyId: String(data.propertyId || ''),
		name: String(data.name || data.fileName || ''),
		category: data.category || null,
		documentType: data.documentType || null,
		uploadedAt: timestampValue(data.uploadedAt || data.createdAt),
		links: {
			equipmentIds: data.links?.assetIds || [],
			taskIds: data.links?.taskIds || [],
			maintenanceEventIds: data.links?.maintenanceEventIds || [],
		},
		acquisitionStatus: data.acquisitionStatus || null,
	};
};

const collectionPage = async (
	collection: string,
	propertyId: string,
	cursor: string | null,
	limit: number,
) => {
	let query: FirebaseFirestore.Query = db.collection(collection)
		.where('propertyId', '==', propertyId)
		.orderBy(admin.firestore.FieldPath.documentId())
		.limit(limit + 1);
	if (cursor) query = query.startAfter(cursor);
	const snapshot = await query.get();
	const docs = snapshot.docs.slice(0, limit);
	return {
		docs,
		nextCursor: snapshot.docs.length > limit && docs.length ? encodeCursor(docs[docs.length - 1].id) : null,
	};
};

const maintenancePage = async (propertyId: string, cursor: string | null, limit: number) => {
	const [canonical, legacy] = await Promise.all([
		collectionPage('maintenanceEvents', propertyId, cursor, limit),
		collectionPage('maintenanceHistory', propertyId, cursor, limit),
	]);
	const records = new Map<string, FirebaseFirestore.DocumentSnapshot>();
	legacy.docs.forEach((document) => records.set(document.id, document));
	canonical.docs.forEach((document) => records.set(document.id, document));
	const docs = [...records.values()].sort((a, b) => a.id.localeCompare(b.id)).slice(0, limit);
	const hasMore = canonical.nextCursor !== null || legacy.nextCursor !== null || records.size > limit;
	return {
		docs,
		nextCursor: hasMore && docs.length ? encodeCursor(docs[docs.length - 1].id) : null,
	};
};

const filterByDatesAndStatus = (items: any[], query: Record<string, unknown>) => {
	const status = String(query.status || '').trim().toLowerCase();
	const from = timestampValue(query.from);
	const to = timestampValue(query.to || query.dueBefore);
	const updatedAfter = timestampValue(query.updatedAfter);
	return items.filter((item) => {
		if (status && String(item.status || '').toLowerCase() !== status) return false;
		const eventDate = item.dueAt || item.performedAt || item.createdAt;
		if (from && eventDate && eventDate < from) return false;
		if (to && eventDate && eventDate > to) return false;
		if (updatedAfter && item.updatedAt && item.updatedAt <= updatedAfter) return false;
		return true;
	});
};

const latestInsights = async (propertyId: string) => {
	const snapshot = await db.collection('propertyScanSnapshots')
		.where('propertyId', '==', propertyId)
		.orderBy('createdAt', 'desc')
		.limit(1)
		.get();
	if (snapshot.empty) return [];
	const data = snapshot.docs[0].data() || {};
	return (Array.isArray(data.recommendations) ? data.recommendations : []).slice(0, 100).map((item: any) => ({
		id: String(item.id || ''),
		propertyId,
		title: String(item.title || item.label || ''),
		finding: String(item.finding || item.description || ''),
		recommendation: String(item.recommendation || item.action || ''),
		severity: item.severity || item.priority || null,
		evidence: Array.isArray(item.evidence) ? item.evidence : [],
		sourceRecordIds: Array.isArray(item.sourceRecordIds) ? item.sourceRecordIds.map(String) : [],
	}));
};

const routeRequest = async (req: functions.https.Request, credential: Credential) => {
	const path = req.path.replace(/\/+$/, '') || '/';
	const segments = path.split('/').filter(Boolean);
	if (segments[0] !== 'v1') throw new ApiError(404, 'resource_not_found', 'Route not found.');
	const limit = pageSize(req.query.limit);
	const cursor = decodeCursor(req.query.cursor);

	if (segments.length === 2 && segments[1] === 'properties') {
		requireScope(credential, 'properties:read');
		const sortedIds = [...credential.propertyIds].sort();
		const start = cursor ? sortedIds.findIndex((id) => id > cursor) : 0;
		const offset = start < 0 ? sortedIds.length : start;
		const selectedIds = sortedIds.slice(offset, offset + limit);
		const snapshots = await Promise.all(selectedIds.map((id) => db.collection('properties').doc(id).get()));
		const hasMore = offset + selectedIds.length < sortedIds.length;
		return { route: '/v1/properties', scope: 'properties:read', body: { data: snapshots.filter((item) => item.exists).map(mapProperty), nextCursor: hasMore && selectedIds.length ? encodeCursor(selectedIds[selectedIds.length - 1]) : null } };
	}

	if (segments.length >= 3 && segments[1] === 'properties') {
		const propertyId = segments[2];
		requireProperty(credential, propertyId);
		if (segments.length === 3) {
			requireScope(credential, 'properties:read');
			const snapshot = await db.collection('properties').doc(propertyId).get();
			if (!snapshot.exists) throw new ApiError(404, 'resource_not_found', 'Resource not found.');
			return { route: '/v1/properties/{propertyId}', scope: 'properties:read', body: { data: mapProperty(snapshot) } };
		}
		const resource = segments[3];
		const config: Record<string, { collection: string; scope: PersonalAssistantScope; map: (doc: FirebaseFirestore.DocumentSnapshot) => any }> = {
			equipment: { collection: 'devices', scope: 'equipment:read', map: mapEquipment },
			tasks: { collection: 'tasks', scope: 'tasks:read', map: mapTask },
			'maintenance-events': { collection: 'maintenanceEvents', scope: 'maintenance:read', map: mapMaintenanceEvent },
			documents: { collection: 'propertyDocuments', scope: 'documents:metadata:read', map: mapDocument },
		};
		if (resource === 'insights') {
			requireScope(credential, 'intelligence:read');
			return { route: '/v1/properties/{propertyId}/insights', scope: 'intelligence:read', body: { data: await latestInsights(propertyId), nextCursor: null } };
		}
		const selected = config[resource];
		if (!selected) throw new ApiError(404, 'resource_not_found', 'Route not found.');
		requireScope(credential, selected.scope);
		const page = resource === 'maintenance-events'
			? await maintenancePage(propertyId, cursor, limit)
			: await collectionPage(selected.collection, propertyId, cursor, limit);
		return {
			route: `/v1/properties/{propertyId}/${resource}`,
			scope: selected.scope,
			body: { data: filterByDatesAndStatus(page.docs.map(selected.map), req.query), nextCursor: page.nextCursor },
		};
	}

	if (segments.length === 2 && segments[1] === 'upcoming') {
		requireScope(credential, 'tasks:read');
		const now = new Date();
		const dueBefore = timestampValue(req.query.dueBefore) || new Date(now.getTime() + 30 * 86400000).toISOString();
		const groups = await Promise.all(credential.propertyIds.map((propertyId) => collectionPage('tasks', propertyId, null, MAX_PAGE_SIZE)));
		const tasks = groups.flatMap((group) => group.docs.map(mapTask)).filter((task) => task.dueAt && task.dueAt <= dueBefore && !['completed', 'cancelled'].includes(task.status.toLowerCase())).sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt))).slice(0, limit);
		return { route: '/v1/upcoming', scope: 'tasks:read', body: { data: tasks, window: { from: now.toISOString(), dueBefore }, nextCursor: null } };
	}
	throw new ApiError(404, 'resource_not_found', 'Route not found.');
};

export const personalAssistantApi = functions
	.region('us-central1')
	.runWith({ secrets: ['PERSONAL_ASSISTANT_TOKEN_PEPPER'], timeoutSeconds: 60, memory: '256MB' })
	.https.onRequest(async (req, res) => {
		const startedAt = Date.now();
		const requestId = String(req.headers['x-request-id'] || cryptoRandomId()).slice(0, 120);
		let credential: Credential | null = null;
		let route = 'unmatched';
		let scope = 'none';
		let status = 500;
		let resultCount = 0;
		try {
			if (req.method !== 'GET') throw new ApiError(405, 'read_only_api', 'Only GET requests are supported.');
			credential = await authenticate(req);
			await enforceRateLimit(credential.credentialId);
			const result = await routeRequest(req, credential);
			route = result.route;
			scope = result.scope;
			status = 200;
			resultCount = Array.isArray((result.body as any).data) ? (result.body as any).data.length : 1;
			res.set('Cache-Control', 'private, no-store');
			res.status(200).json({ ...result.body, requestId });
		} catch (error) {
			const apiError = error instanceof ApiError ? error : new ApiError(500, 'internal_error', 'The request could not be completed.');
			status = apiError.status;
			if (!(error instanceof ApiError)) functions.logger.error('Personal assistant API failure', { requestId, error });
			res.status(status).json({ error: { code: apiError.code, message: apiError.message, requestId } });
		} finally {
			if (credential) {
				const now = admin.firestore.Timestamp.now();
				const writes: Promise<unknown>[] = [db.collection(AUDITS).add({
					requestId,
					credentialId: credential.credentialId,
					ownerUserId: credential.ownerUserId,
					accountId: credential.accountId,
					route,
					requiredScope: scope,
					propertyIds: credential.propertyIds,
					responseStatus: status,
					resultCount,
					latencyMs: Date.now() - startedAt,
					createdAt: now,
				})];
				const lastUsedMs = credential.lastUsedAt?.toMillis?.() || 0;
				if (Date.now() - lastUsedMs > 15 * 60_000) {
					writes.push(db.collection(CREDENTIALS).doc(credential.credentialId).update({ lastUsedAt: now }));
				}
				await Promise.allSettled(writes);
			}
		}
	});

const cryptoRandomId = () => require('crypto').randomBytes(16).toString('hex');
