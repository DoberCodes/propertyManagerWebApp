// HISTORICAL DIAGNOSTIC ONLY.
// Archived on 2026-07-25. Do not run against production without confirming the
// current recurrence schema, Firebase project target, and credential source.

const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function debugRecurringTasks() {
	console.log('🔍 Debugging recurring task issues...\n');

	const tasksRef = db.collection('tasks');
	const tasksSnapshot = await tasksRef.get();

	const recurringTasks = [];
	for (const doc of tasksSnapshot.docs) {
		const data = doc.data();
		if (data.isRecurring) {
			recurringTasks.push({
				id: doc.id,
				title: data.title,
				isRecurring: data.isRecurring,
				recurrenceFrequency: data.recurrenceFrequency,
				recurrenceInterval: data.recurrenceInterval,
				recurrenceCustomUnit: data.recurrenceCustomUnit,
				status: data.status,
				dueDate: data.dueDate,
				createdAt: data.createdAt,
				updatedAt: data.updatedAt,
			});
		}
	}

	console.log('📋 ALL RECURRING TASKS:');
	recurringTasks.forEach((task) => {
		console.log(`\n🔄 TASK: "${task.title}" (ID: ${task.id})`);
		console.log(`   Status: ${task.status}`);
		console.log(`   Due Date: ${task.dueDate}`);
		console.log(`   Created: ${task.createdAt}`);
		console.log(`   Updated: ${task.updatedAt}`);
		console.log(`   Recurrence Config:`);
		console.log(`     - Frequency: ${task.recurrenceFrequency || 'MISSING'}`);
		console.log(`     - Interval: ${task.recurrenceInterval || 'MISSING'}`);
		console.log(`     - Custom Unit: ${task.recurrenceCustomUnit || 'N/A'}`);

		const hasRequiredFields =
			task.recurrenceFrequency && task.recurrenceInterval !== undefined;
		console.log(
			`     - Has Required Fields: ${hasRequiredFields ? '✅' : '❌'}`,
		);

		if (!hasRequiredFields) {
			console.log(
				`     ⚠️  MISSING REQUIRED FIELDS - This task cannot create recurring copies!`,
			);
		}
	});

	const completedTasks = recurringTasks.filter(
		(task) => task.status === 'Completed',
	);
	console.log(`\n📊 COMPLETED RECURRING TASKS: ${completedTasks.length}`);

	completedTasks.forEach((task) => {
		const hasRequiredFields =
			task.recurrenceFrequency && task.recurrenceInterval !== undefined;
		if (!hasRequiredFields) {
			console.log(
				`❌ "${task.title}" cannot create recurring copies due to missing fields`,
			);
		} else {
			console.log(`✅ "${task.title}" should have created a recurring copy`);
		}
	});
}

debugRecurringTasks()
	.then(() => process.exit(0))
	.catch(console.error);
