import type { HelpfulArticle } from '../types';

export const remindersArticle: HelpfulArticle = {
	slug: 'set-up-maintenance-reminders', title: 'Set up useful maintenance reminders',
	summary: 'Use task due dates, recurring schedules, and notification settings to keep maintenance visible.',
	path: '/settings?category=notifications', actionLabel: 'Open Notification Settings',
	introduction: 'Reminders work best when they are connected to a clear task, a realistic due date, and notification settings you actually use.',
	sections: [
		{ heading: 'Set the reminder', steps: ['Create or edit a task and add the correct property, action, and due date.', 'Enable recurrence when the work repeats and your plan includes recurring tasks.', 'Open Notification Settings and enable the channels you want.', 'Confirm operating-system or browser permission when using push notifications.'], image: { src: '/screenshots/desktop_taskcreate.png', alt: 'Task creation controls used to set a maintenance due date.', caption: 'A reminder needs a clear task and due date before a notification can be useful.' } },
		{ heading: 'What is included', paragraphs: ['Due dates and in-app notifications are available across standard plans. Recurring tasks, task reminder emails, and push notifications require Homeowner+ or a higher plan. Device permission and connection quality can also affect delivery.'] },
		{ heading: 'If reminders do not arrive', tips: ['Confirm the task is still open and has the intended due date.', 'Check Maintley notification settings and device permissions.', 'Complete or reschedule stale tasks so overdue alerts remain trustworthy.', 'After a browser or app update, review notification permission again.'] },
	],
	relatedGuideSlugs: ['how-tasks-become-maintenance-history', 'use-maintley-intelligence-recommendations'],
};
