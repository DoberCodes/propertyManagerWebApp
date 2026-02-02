// auditTasksSchema.cjs
// Audit Firestore tasks for missing fields compared to app Task schema
// Usage: node scripts/auditTasksSchema.cjs

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const REQUIRED_FIELDS = [
	'id',
	'title',
	'dueDate',
	'status',
	'notes',
	'priority',
	'propertyId',
	'createdAt',
	'updatedAt',
	'isRecurring',
	'recurrenceFrequency',
	'recurrenceInterval',
	'recurrenceCustomUnit',
	'parentTaskId',
	'lastRecurrenceDate',
];

const OPTIONAL_FIELDS = [
	'assignee',
	'assignedTo',
	'completedBy',
	'completionDate',
	'completionFile',
	'isComplete',
	'attachments',
	'category',
	'createdBy',
	'updatedBy',
	'teamId',
	'propertyName',
];

async function auditTasks() {
	const tasksRef = db.collectionGroup('tasks');
	const snapshot = await tasksRef.get();

	const missingCounts = new Map();
	const missingByDoc = [];

	snapshot.docs.forEach((doc) => {
		const data = doc.data();
		const missing = [];

		REQUIRED_FIELDS.forEach((field) => {
			if (typeof data[field] === 'undefined') {
				missing.push(field);
				missingCounts.set(field, (missingCounts.get(field) || 0) + 1);
			}
		});

		if (missing.length > 0) {
			missingByDoc.push({ path: doc.ref.path, missing });
		}
	});

	console.log(`Audited ${snapshot.size} tasks.`);

	if (missingByDoc.length === 0) {
		console.log('No missing required fields found.');
		return;
	}

	console.log('\nMissing required field counts:');
	[...missingCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.forEach(([field, count]) => {
			console.log(`- ${field}: ${count}`);
		});

	console.log('\nSample missing field details (first 20):');
	missingByDoc.slice(0, 20).forEach((item) => {
		console.log(`- ${item.path}: ${item.missing.join(', ')}`);
	});
}

auditTasks().catch((err) => {
	console.error('Audit failed:', err);
	process.exit(1);
});
