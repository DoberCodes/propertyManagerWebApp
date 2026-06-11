/**
 * Task notification scheduler
 * Handles creating notifications for tasks based on their notification settings
 */

import {
	collection,
	query,
	where,
	getDocs,
	addDoc,
	Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, TaskNotification } from '../types/Task.types';
import {
	getDefaultNotificationMessage,
	getNotificationTriggerDate,
	shouldTriggerNotification,
} from './taskNotificationUtils';

/**
 * Check all tasks and create notifications for tasks that need them
 * This should be called periodically (e.g., daily) to check for upcoming/overdue tasks
 */
export const processTaskNotifications = async (): Promise<void> => {
	try {

		// Get all tasks that have notifications enabled
		const tasksQuery = query(
			collection(db, 'tasks'),
			where('enableNotifications', '==', true),
		);

		const tasksSnapshot = await getDocs(tasksQuery);
		const tasks = tasksSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as Task[];


		const currentDate = new Date();
		let notificationsCreated = 0;

		for (const task of tasks) {
			if (!task.notifications || task.notifications.length === 0) continue;

			// Skip completed tasks
			if (task.status === 'Completed') continue;

			for (const notification of task.notifications) {
				if (!notification.enabled) continue;

				// Check if this notification should be triggered
				if (
					shouldTriggerNotification(
						task.dueDate,
						notification.daysBeforeDue || 0,
						currentDate,
					)
				) {
					// Check if we've already sent this notification
					const existingNotification = await checkExistingNotification(
						task.id,
						notification.id,
						currentDate,
					);

					if (!existingNotification) {
						await createTaskNotification(task, notification, currentDate);
						notificationsCreated++;
					}
				}
			}
		}

	} catch (error) {
		console.error('❌ Error processing task notifications:', error);
	}
};

/**
 * Check if a notification for this task/notification type has already been sent today
 */
const checkExistingNotification = async (
	taskId: string,
	notificationId: string,
	currentDate: Date,
): Promise<boolean> => {
	try {
		const today = new Date(currentDate);
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const notificationsQuery = query(
			collection(db, 'notifications'),
			where('type', 'in', ['task_reminder', 'task_due_today', 'task_overdue']),
			where('data.taskId', '==', taskId),
			where('data.notificationId', '==', notificationId),
			where('createdAt', '>=', Timestamp.fromDate(today)),
			where('createdAt', '<', Timestamp.fromDate(tomorrow)),
		);

		const snapshot = await getDocs(notificationsQuery);
		return !snapshot.empty;
	} catch (error) {
		console.error('Error checking existing notification:', error);
		return false;
	}
};

/**
 * Create a notification for a task
 */
const createTaskNotification = async (
	task: Task,
	notification: TaskNotification,
	currentDate: Date,
): Promise<void> => {
	try {
		const isDueTodayReminder =
			notification.type === 'reminder' && (notification.daysBeforeDue || 0) === 0;
		const notificationType = isDueTodayReminder
			? 'task_due_today'
			: notification.type === 'reminder'
				? 'task_reminder'
				: 'task_overdue';
		const message =
			notification.customMessage ||
			getDefaultNotificationMessage(notification, task.title);

		// Determine who should receive the notification
		// Priority: assigned user > task creator > property owner
		let recipientId = task.assignee || task.userId;

		if (!recipientId) {
			// If no assignee, try to find property owner
			const propertyDoc = await getDocs(
				query(collection(db, 'properties'), where('id', '==', task.propertyId)),
			);

			if (!propertyDoc.empty) {
				recipientId = propertyDoc.docs[0].data().owner;
			}
		}

		if (!recipientId) {
			console.warn(
				`⚠️ No recipient found for task notification: ${task.title}`,
			);
			return;
		}

		const notificationData = {
			userId: recipientId,
			type: notificationType,
			title: isDueTodayReminder
				? 'Task Due Today'
				: notification.type === 'reminder'
					? 'Task Reminder'
					: 'Task Overdue',
			message,
			data: {
				taskId: task.id,
				taskTitle: task.title,
				propertyId: task.propertyId,
				dueDate: task.dueDate,
				notificationId: notification.id,
				daysBeforeDue: notification.daysBeforeDue,
			},
			status: 'unread',
			actionUrl: `/properties/${task.propertyId}`,
			createdAt: Timestamp.fromDate(currentDate),
			updatedAt: Timestamp.fromDate(currentDate),
		};

		await addDoc(collection(db, 'notifications'), notificationData);
		console.log(
			`🔔 Created ${notificationType} notification for task: ${task.title}`,
		);
	} catch (error) {
		console.error('Error creating task notification:', error);
	}
};

/**
 * Get tasks that need notifications for a specific user
 * Useful for manual triggering or testing
 */
export const getTasksNeedingNotifications = async (
	userId?: string,
): Promise<Task[]> => {
	try {
		let tasksQuery = query(
			collection(db, 'tasks'),
			where('enableNotifications', '==', true),
		);

		if (userId) {
			tasksQuery = query(
				collection(db, 'tasks'),
				where('enableNotifications', '==', true),
				where('userId', '==', userId),
			);
		}

		const tasksSnapshot = await getDocs(tasksQuery);
		return tasksSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as Task[];
	} catch (error) {
		console.error('Error getting tasks needing notifications:', error);
		return [];
	}
};
