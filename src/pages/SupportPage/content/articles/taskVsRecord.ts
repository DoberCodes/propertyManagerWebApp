import type { HelpfulArticle } from '../types';

export const taskVsRecordArticle: HelpfulArticle = {
	slug: 'repair-record-or-maintenance-task', title: 'Choose between a task and a maintenance record',
	summary: 'Choose tasks for future work and Maintenance History for completed work.',
	path: '/tasks', actionLabel: 'Go to Tasks',
	introduction: 'Use a task for work that still needs attention. Use Maintenance History for work that already happened.',
	sections: [
		{ heading: 'Use a task when work is pending', paragraphs: ['Create a task for an inspection, repair, replacement, recurring action, or follow-up that has not happened yet. Tasks can hold due dates, recurrence, reminders, assignments, notes, and property or equipment links.'] },
		{ heading: 'Use Maintenance History when work is complete', paragraphs: ['Add a maintenance record when work already happened and no Maintley task existed. Record the actual service date, work performed, contractor, cost, notes, and supporting files when known.'] },
		{ heading: 'Complete an existing task', paragraphs: ['If the work began as a Maintley task, complete that task with the result instead of creating an unrelated duplicate history entry.'], image: { src: '/screenshots/desktop_taskhistory.png', alt: 'Task completion connected to a Maintenance History record.', caption: 'Completing the task keeps planned work and the historical result connected.' }, tips: ['Future action equals a task.', 'Past verified work equals Maintenance History.', 'Recommended work remains a task until it actually happens.'] },
	],
	relatedGuideSlugs: ['how-tasks-become-maintenance-history', 'what-to-preserve-after-service-work'],
};
