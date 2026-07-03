const assert = require('assert');
const Module = require('module');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const arrayUnion = (...values) => ({ __op: 'arrayUnion', values });

const clone = (value) => {
	if (value === undefined) return undefined;
	return JSON.parse(JSON.stringify(value));
};

const isPlainObject = (value) =>
	value && typeof value === 'object' && !Array.isArray(value);

const applyFieldValue = (existingValue, nextValue) => {
	if (isPlainObject(nextValue) && nextValue.__op === 'arrayUnion') {
		const current = Array.isArray(existingValue) ? existingValue : [];
		return [...current, ...nextValue.values.map(clone)];
	}

	if (Array.isArray(nextValue)) {
		return nextValue.map(clone);
	}

	if (isPlainObject(nextValue)) {
		return Object.fromEntries(
			Object.entries(nextValue).map(([key, value]) => [
				key,
				applyFieldValue(undefined, value),
			]),
		);
	}

	return clone(nextValue);
};

const mergeData = (existing, next) => {
	const merged = { ...(existing || {}) };
	for (const [key, value] of Object.entries(next || {})) {
		merged[key] = applyFieldValue(merged[key], value);
	}
	return merged;
};

class FakeDocSnapshot {
	constructor(id, data) {
		this.id = id;
		this.exists = data !== undefined;
		this._data = data;
	}

	data() {
		return clone(this._data);
	}
}

class FakeDocRef {
	constructor(db, collectionName, id) {
		this.db = db;
		this.collectionName = collectionName;
		this.id = id;
	}

	async get() {
		return new FakeDocSnapshot(this.id, this.db.getDoc(this.collectionName, this.id));
	}

	async set(data, options = {}) {
		this.db.setDoc(this.collectionName, this.id, data, options);
	}

	async update(data) {
		this.db.updateDoc(this.collectionName, this.id, data);
	}
}

class FakeCollectionRef {
	constructor(db, name) {
		this.db = db;
		this.name = name;
	}

	doc(id) {
		return new FakeDocRef(this.db, this.name, id);
	}
}

class FakeTransaction {
	constructor(db) {
		this.db = db;
	}

	async get(ref) {
		return ref.get();
	}

	set(ref, data, options = {}) {
		this.db.setDoc(ref.collectionName, ref.id, data, options);
	}

	update(ref, data) {
		this.db.updateDoc(ref.collectionName, ref.id, data);
	}
}

class FakeFirestore {
	constructor() {
		this.collections = new Map();
	}

	collection(name) {
		this.ensureCollection(name);
		return new FakeCollectionRef(this, name);
	}

	async runTransaction(callback) {
		return callback(new FakeTransaction(this));
	}

	ensureCollection(name) {
		if (!this.collections.has(name)) {
			this.collections.set(name, new Map());
		}
		return this.collections.get(name);
	}

	getDoc(collectionName, id) {
		return clone(this.ensureCollection(collectionName).get(id));
	}

	setDoc(collectionName, id, data, options = {}) {
		const collection = this.ensureCollection(collectionName);
		const existing = collection.get(id);
		const next = options.merge
			? mergeData(existing, data)
			: applyFieldValue(undefined, data);
		collection.set(id, next);
	}

	updateDoc(collectionName, id, data) {
		const collection = this.ensureCollection(collectionName);
		if (!collection.has(id)) {
			throw new Error(`Document ${collectionName}/${id} does not exist`);
		}
		collection.set(id, mergeData(collection.get(id), data));
	}
}

const clearFunctionModuleCache = () => {
	const functionsRoot = path.join(projectRoot, 'functions', 'lib');
	for (const modulePath of Object.keys(require.cache)) {
		if (modulePath.startsWith(functionsRoot)) {
			delete require.cache[modulePath];
		}
	}
};

const createAdminMock = (db, messagingCalls = []) => {
	const firestore = () => db;
	firestore.FieldValue = { arrayUnion };

	return {
		apps: [],
		initializeApp() {
			this.apps.push({ name: '[DEFAULT]' });
		},
		firestore,
		messaging() {
			return {
				async sendEachForMulticast(message) {
					messagingCalls.push(clone(message));
					return {
						successCount: message.tokens.length,
						failureCount: 0,
						responses: message.tokens.map(() => ({ success: true })),
					};
				},
			};
		},
	};
};

const createFunctionsMock = () => ({
	https: {
		onCall: (handler) => handler,
		HttpsError: class HttpsError extends Error {
			constructor(code, message) {
				super(message);
				this.code = code;
			}
		},
	},
	region: () => ({ https: { onCall: (handler) => handler } }),
});

const withModuleMocks = async (mocks, testBody) => {
	const originalLoad = Module._load;
	Module._load = function patchedLoad(request, parent, isMain) {
		if (Object.prototype.hasOwnProperty.call(mocks, request)) {
			return mocks[request];
		}
		return originalLoad.call(this, request, parent, isMain);
	};

	try {
		clearFunctionModuleCache();
		await testBody();
	} finally {
		Module._load = originalLoad;
		clearFunctionModuleCache();
	}
};

const seedPushEnabledUser = (db, userId, overrides = {}) => {
	db.setDoc('users', userId, {
		id: userId,
		subscription: { status: 'active', plan: 'portfolio' },
		pushTokens: [{ token: `${userId}-android-token`, platform: 'android' }],
		...overrides,
	});
};

const loadEventEngine = (adminMock, pushCalls) => {
	const pushMock = {
		async sendPushForNotification(notificationId, notification, options) {
			pushCalls.push({ notificationId, notification: clone(notification), options });
		},
	};

	return require(path.join(projectRoot, 'functions', 'lib', 'maintleyEventEngine.js'));
};

const testEventAggregationAndPushPolicy = async () => {
	const db = new FakeFirestore();
	const pushCalls = [];
	const adminMock = createAdminMock(db);
	seedPushEnabledUser(db, 'owner-1');

	await withModuleMocks(
		{
			'firebase-admin': adminMock,
			'firebase-functions/v1': createFunctionsMock(),
			'./pushDelivery': {
				async sendPushForNotification(notificationId, notification, options) {
					pushCalls.push({ notificationId, notification: clone(notification), options });
				},
			},
			'./accountAuthz': { getMembership: async () => ({ role: 'owner' }) },
		},
		async () => {
			const { publishMaintleyEventRecord } = loadEventEngine(adminMock, pushCalls);

			const started = await publishMaintleyEventRecord({
				accountId: 'account-1',
				userId: 'owner-1',
				propertyId: 'property-1',
				relatedDocumentId: 'doc-1',
				type: 'document_review_started',
				workflowKey: 'property-knowledge-acquisition',
				entityKey: 'document:doc-1',
				title: 'Document review started',
				message: 'Maintley is reviewing this document.',
				status: 'processing',
				createdAt: '2026-07-03T10:00:00.000Z',
				updatedAt: '2026-07-03T10:00:00.000Z',
			});

			assert.deepStrictEqual(started, {
				eventId: 'property-knowledge-acquisition__document-doc-1',
				notificationIds: [
					'property-knowledge-acquisition__document-doc-1__owner-1',
				],
			});
			assert.strictEqual(pushCalls.length, 0, 'review started should not push');

			const eventAfterStart = db.getDoc(
				'maintleyEvents',
				'property-knowledge-acquisition__document-doc-1',
			);
			assert.strictEqual(eventAfterStart.channels.android_push, 'skipped');
			assert.strictEqual(eventAfterStart.channels.in_app, 'pending');
			assert.strictEqual(eventAfterStart.eventHistory.length, 1);

			const notificationAfterStart = db.getDoc(
				'notifications',
				'property-knowledge-acquisition__document-doc-1__owner-1',
			);
			assert.strictEqual(notificationAfterStart.type, 'document_scan_started');
			assert.strictEqual(notificationAfterStart.suppressAutoPush, true);
			assert.strictEqual(notificationAfterStart.createdAt, '2026-07-03T10:00:00.000Z');

			const ready = await publishMaintleyEventRecord({
				accountId: 'account-1',
				userId: 'owner-1',
				propertyId: 'property-1',
				relatedDocumentId: 'doc-1',
				type: 'suggested_details_ready',
				workflowKey: 'property-knowledge-acquisition',
				entityKey: 'document:doc-1',
				title: 'Suggested details ready',
				message: 'Maintley found 18 suggested details in HVAC Invoice.pdf.',
				status: 'ready',
				createdAt: '2026-07-03T10:05:00.000Z',
				updatedAt: '2026-07-03T10:05:00.000Z',
				metadata: { suggestionCount: 18 },
			});

			assert.deepStrictEqual(ready.notificationIds, started.notificationIds);
			assert.strictEqual(pushCalls.length, 1, 'ready event should push once');
			assert.deepStrictEqual(pushCalls[0].options, { androidOnly: true });

			const eventAfterReady = db.getDoc(
				'maintleyEvents',
				'property-knowledge-acquisition__document-doc-1',
			);
			assert.strictEqual(eventAfterReady.title, 'Suggested details ready');
			assert.strictEqual(eventAfterReady.createdAt, '2026-07-03T10:00:00.000Z');
			assert.strictEqual(eventAfterReady.updatedAt, '2026-07-03T10:05:00.000Z');
			assert.strictEqual(eventAfterReady.channels.android_push, 'pending');
			assert.strictEqual(eventAfterReady.eventHistory.length, 2);

			const notificationAfterReady = db.getDoc(
				'notifications',
				'property-knowledge-acquisition__document-doc-1__owner-1',
			);
			assert.strictEqual(notificationAfterReady.title, 'Suggested details ready');
			assert.strictEqual(notificationAfterReady.type, 'document_scan_completed');
			assert.strictEqual(notificationAfterReady.createdAt, '2026-07-03T10:00:00.000Z');
			assert.strictEqual(notificationAfterReady.updatedAt, '2026-07-03T10:05:00.000Z');
			assert.strictEqual(notificationAfterReady.data.suggestionCount, 18);
		},
	);
};

const testPreferencesAndInAppOptOut = async () => {
	const db = new FakeFirestore();
	const pushCalls = [];
	const adminMock = createAdminMock(db);
	seedPushEnabledUser(db, 'quiet-user');
	seedPushEnabledUser(db, 'in-app-off');
	db.setDoc('userPreferences', 'quiet-user', {
		notificationPreferences: {
			enabled: true,
			types: { quick_scan_completed: false },
		},
	});

	await withModuleMocks(
		{
			'firebase-admin': adminMock,
			'firebase-functions/v1': createFunctionsMock(),
			'./pushDelivery': {
				async sendPushForNotification(notificationId, notification, options) {
					pushCalls.push({ notificationId, notification: clone(notification), options });
				},
			},
			'./accountAuthz': { getMembership: async () => ({ role: 'owner' }) },
		},
		async () => {
			const { publishMaintleyEventRecord } = loadEventEngine(adminMock, pushCalls);

			const quietResult = await publishMaintleyEventRecord({
				accountId: 'account-1',
				userId: 'quiet-user',
				type: 'quick_scan_completed',
				workflowKey: 'maintley-intelligence',
				entityKey: 'scan:scan-1',
				title: 'Quick Scan complete',
				message: 'Maintley found 3 items to review.',
				status: 'completed',
			});

			assert.deepStrictEqual(quietResult.notificationIds, []);
			assert.strictEqual(pushCalls.length, 0);
			assert.strictEqual(
				db.getDoc(
					'notifications',
					'maintley-intelligence__scan-scan-1__quiet-user',
				),
				undefined,
			);
			assert.ok(
				db.getDoc('maintleyEvents', 'maintley-intelligence__scan-scan-1'),
				'event record should still exist for lifecycle history',
			);

			const inAppOffResult = await publishMaintleyEventRecord({
				accountId: 'account-1',
				userId: 'in-app-off',
				type: 'knowledge_imported',
				workflowKey: 'property-knowledge-acquisition',
				entityKey: 'document:doc-2',
				title: 'Knowledge imported',
				message: 'Maintley updated this property history.',
				status: 'completed',
				push: true,
				inApp: false,
			});

			assert.deepStrictEqual(inAppOffResult.notificationIds, []);
			assert.strictEqual(pushCalls.length, 0);
			const event = db.getDoc(
				'maintleyEvents',
				'property-knowledge-acquisition__document-doc-2',
			);
			assert.strictEqual(event.channels.in_app, 'skipped');
			assert.strictEqual(event.channels.android_push, 'pending');
		},
	);
};

const testPushDeliveryAndroidFiltering = async () => {
	const db = new FakeFirestore();
	const messagingCalls = [];
	const adminMock = createAdminMock(db, messagingCalls);
	seedPushEnabledUser(db, 'push-user', {
		pushToken: 'legacy-token',
		pushTokens: [
			{ token: 'android-token', platform: 'android' },
			{ token: 'web-token', platform: 'web' },
			{ token: 'disabled-token', platform: 'android', disabled: true },
		],
	});

	await withModuleMocks(
		{ 'firebase-admin': adminMock },
		async () => {
			const { sendPushForNotification } = require(path.join(
				projectRoot,
				'functions',
				'lib',
				'pushDelivery.js',
			));

			await sendPushForNotification(
				'notification-1',
				{
					userId: 'push-user',
					type: 'quick_scan_completed',
					title: 'Quick Scan complete',
					message: 'Maintley found 3 items to review.',
					actionUrl: '/properties/property-1',
					data: { scanId: 'scan-1', count: 3 },
				},
				{ androidOnly: true },
			);
		},
	);

	assert.strictEqual(messagingCalls.length, 1);
	assert.deepStrictEqual(messagingCalls[0].tokens.sort(), [
		'android-token',
		'legacy-token',
	]);
	assert.strictEqual(messagingCalls[0].data.actionUrl, '/properties/property-1');
	assert.strictEqual(messagingCalls[0].data.count, '3');
};

const run = async () => {
	await testEventAggregationAndPushPolicy();
	await testPreferencesAndInAppOptOut();
	await testPushDeliveryAndroidFiltering();
	console.log('Maintley event engine tests passed.');
};

run().catch((error) => {
	console.error('Maintley event engine tests failed.');
	console.error(error);
	process.exit(1);
});
