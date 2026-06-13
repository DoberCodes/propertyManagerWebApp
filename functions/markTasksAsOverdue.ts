import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

/**
 * Scheduled compatibility check for overdue tasks.
 * Overdue is now derived from dueDate at render/notification time, so this
 * function does not mutate task status.
 */
export const markTasksAsOverdue = functions.pubsub
	.schedule('0 9 * * *') // Daily at 9 AM
	.timeZone('America/New_York')
	.onRun(async (context) => {
		const functionsLogger = functions.logger;

		try {
			functionsLogger.info('Starting derived overdue task check...');

			// Get current date (start of today)
			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

			const tasksRef = db.collection('tasks');
			const overdueTasksQuery = tasksRef
				.where('dueDate', '<', today.toISOString().split('T')[0]) // Compare date part only
				.where('status', 'in', ['Initiated', 'Pending', 'In Progress', 'Awaiting Approval']);

			const snapshot = await overdueTasksQuery.get();

			if (snapshot.empty) {
				functionsLogger.info(
					'No active tasks currently display as overdue.',
				);
				return null;
			}

			let derivedOverdueCount = 0;

			snapshot.forEach((doc) => {
				const taskData = doc.data();
				const dueDate = new Date(taskData.dueDate);
				const todayStart = new Date(today);

				// Double-check the date comparison in case of timezone issues
				if (dueDate < todayStart) {
					functionsLogger.info(
						`Task ${doc.id} displays as overdue. Due date: ${taskData.dueDate}, stored status: ${taskData.status}`,
					);
					derivedOverdueCount++;
				}
			});

			functionsLogger.info(
				`${derivedOverdueCount} active tasks currently display as overdue. No task statuses were updated.`,
			);

			return null;
		} catch (error) {
			functionsLogger.error('Error checking derived overdue tasks:', error);
			throw error;
		}
	});
