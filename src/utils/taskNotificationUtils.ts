/**
 * Task notification utilities
 * Handles default notification schedules and notification management
 */

import { TaskNotification } from '../types/Task.types';

/**
 * Generate default notification schedule for tasks
 * Returns an array of default notifications:
 * - 30 days before due date
 * - 7 days before due date
 * - 1 day before due date
 * - Due date day (today)
 * - Every week for 4 weeks after due date (overdue)
 */
export const getDefaultTaskNotifications = (): TaskNotification[] => {
	const notifications: TaskNotification[] = [];

	// Reminder notifications (before due date)
	const reminderDays = [30, 7, 1, 0];
	reminderDays.forEach((days) => {
		notifications.push({
			id: `reminder-${days}`,
			type: 'reminder',
			daysBeforeDue: days,
			enabled: true,
		});
	});

	// Overdue notifications (after due date, weekly for 4 weeks)
	for (let week = 1; week <= 4; week++) {
		notifications.push({
			id: `overdue-${week}`,
			type: 'overdue',
			daysBeforeDue: -week * 7, // Negative for after due date
			enabled: true,
		});
	}

	return notifications;
};

/**
 * Get default notification message based on notification type and timing
 */
export const getDefaultNotificationMessage = (
	notification: TaskNotification,
	taskTitle: string,
): string => {
	const { type, daysBeforeDue = 0 } = notification;

	if (type === 'reminder') {
		if (daysBeforeDue === 30) {
			return `Reminder: "${taskTitle}" is due in 30 days`;
		} else if (daysBeforeDue === 7) {
			return `Reminder: "${taskTitle}" is due in 7 days`;
		} else if (daysBeforeDue === 1) {
			return `Reminder: "${taskTitle}" is due tomorrow`;
		} else if (daysBeforeDue === 0) {
			return `Due today: "${taskTitle}" is due today`;
		} else {
			return `Reminder: "${taskTitle}" is due in ${daysBeforeDue} days`;
		}
	} else if (type === 'overdue') {
		const weeksOverdue = Math.abs(daysBeforeDue) / 7;
		if (weeksOverdue === 1) {
			return `Overdue: "${taskTitle}" is 1 week past due`;
		} else {
			return `Overdue: "${taskTitle}" is ${weeksOverdue} weeks past due`;
		}
	}

	return `Notification for "${taskTitle}"`;
};

/**
 * Calculate notification trigger date based on task due date
 */
export const getNotificationTriggerDate = (
	dueDate: string,
	daysBeforeDue: number,
): Date => {
	const dueDateObj = new Date(dueDate);
	const triggerDate = new Date(dueDateObj);
	triggerDate.setDate(dueDateObj.getDate() - daysBeforeDue);
	return triggerDate;
};

/**
 * Check if a notification should be triggered based on current date
 */
export const shouldTriggerNotification = (
	dueDate: string,
	daysBeforeDue: number,
	currentDate: Date = new Date(),
): boolean => {
	const triggerDate = getNotificationTriggerDate(dueDate, daysBeforeDue);
	const currentDateOnly = new Date(
		currentDate.getFullYear(),
		currentDate.getMonth(),
		currentDate.getDate(),
	);
	const triggerDateOnly = new Date(
		triggerDate.getFullYear(),
		triggerDate.getMonth(),
		triggerDate.getDate(),
	);

	return currentDateOnly >= triggerDateOnly;
};
