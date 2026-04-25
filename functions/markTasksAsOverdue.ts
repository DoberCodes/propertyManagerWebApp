import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

/**
 * Scheduled function to automatically mark tasks as overdue
 * Runs daily at 9 AM EST
 */
export const markTasksAsOverdue = functions.pubsub
	.schedule('0 9 * * *') // Daily at 9 AM
	.timeZone('America/New_York')
	.onRun(async (context) => {
		const functionsLogger = functions.logger;

		try {
			functionsLogger.info('Starting task overdue check...');

			// Get current date (start of today)
			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

			// Query for tasks that:
			// 1. Have a dueDate before today
			// 2. Are not already completed, rejected, or overdue
			// 3. Are not on hold
			const tasksRef = db.collection('tasks');
			const overdueTasksQuery = tasksRef
				.where('dueDate', '<', today.toISOString().split('T')[0]) // Compare date part only
				.where('status', 'in', ['Initiated', 'Pending', 'In Progress', 'Awaiting Approval']);

			const snapshot = await overdueTasksQuery.get();

			if (snapshot.empty) {
				functionsLogger.info(
					'No tasks found that need to be marked as overdue.',
				);
				return null;
			}

			const batch = db.batch();
			let updateCount = 0;

			snapshot.forEach((doc) => {
				const taskData = doc.data();
				const dueDate = new Date(taskData.dueDate);
				const todayStart = new Date(today);

				// Double-check the date comparison in case of timezone issues
				if (dueDate < todayStart) {
					functionsLogger.info(
						`Marking task ${doc.id} as overdue. Due date: ${taskData.dueDate}, Status: ${taskData.status}`,
					);

					batch.update(doc.ref, {
						status: 'Overdue',
						updatedAt: admin.firestore.FieldValue.serverTimestamp(),
					});

					updateCount++;
				}
			});

			if (updateCount > 0) {
				await batch.commit();
				functionsLogger.info(
					`Successfully marked ${updateCount} tasks as overdue.`,
				);
			} else {
				functionsLogger.info('No tasks were updated (all were filtered out).');
			}

			return null;
		} catch (error) {
			functionsLogger.error('Error marking tasks as overdue:', error);
			throw error;
		}
	});
