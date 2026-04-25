import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

/**
 * HTTP-callable debug function.
 * Runs the same query as markTasksAsOverdue but does NOT write anything.
 * Invoke from Firebase Console > Functions > debugOverdueTasks > "Test function",
 * or via: curl -X POST https://<region>-<project>.cloudfunctions.net/debugOverdueTasks
 *
 * Returns a summary of what the scheduler would mark as overdue.
 */
export const debugOverdueTasks = functions.https.onRequest(async (req, res) => {
	try {
		const now = new Date();
		const todayDateString = now.toISOString().split('T')[0]; // e.g. "2026-03-28"
		const todayStart = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
		);

		functions.logger.info(`[debugOverdueTasks] Running dry-run. today=${todayDateString}`);

		// Replicate exact query from markTasksAsOverdue
		const snapshot = await db
			.collection('tasks')
			.where('dueDate', '<', todayDateString)
			.where('status', 'in', ['Initiated', 'Pending', 'In Progress', 'Awaiting Approval'])
			.get();

		const found: Array<{
			id: string;
			title: string;
			dueDate: string;
			dueDateType: string;
			status: string;
			wouldBeMarkedOverdue: boolean;
		}> = [];

		snapshot.forEach((doc) => {
			const data = doc.data();
			const dueDate = new Date(data.dueDate);
			const wouldMark = dueDate < todayStart;
			found.push({
				id: doc.id,
				title: data.title,
				dueDate: data.dueDate,
				dueDateType: typeof data.dueDate,
				status: data.status,
				wouldBeMarkedOverdue: wouldMark,
			});
		});

		// Also run a broader query to check for tasks with no dueDate or wrong types
		const allTasksSnap = await db.collection('tasks').limit(5).get();
		const sampleFields: Record<string, unknown>[] = [];
		allTasksSnap.forEach((doc) => {
			const data = doc.data();
			sampleFields.push({
				id: doc.id,
				dueDateValue: data.dueDate,
				dueDateType: typeof data.dueDate,
				status: data.status,
			});
		});

		const result = {
			runAt: now.toISOString(),
			todayDateString,
			queryMatchCount: snapshot.size,
			wouldUpdateCount: found.filter((t) => t.wouldBeMarkedOverdue).length,
			tasks: found,
			sampleTaskFields: sampleFields,
		};

		functions.logger.info('[debugOverdueTasks] Result:', result);
		res.status(200).json(result);
	} catch (error: any) {
		functions.logger.error('[debugOverdueTasks] Error:', error);
		res.status(500).json({ error: error.message });
	}
});
