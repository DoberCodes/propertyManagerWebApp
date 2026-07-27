import type { HelpfulArticle } from '../types';

export const tasksAndHistoryArticle: HelpfulArticle = {
	slug: 'how-tasks-become-maintenance-history',
	title: 'Turn tasks into maintenance history',
	summary: 'Use tasks for planned work and completion details for the permanent maintenance record.',
	path: '/tasks',
	actionLabel: 'Go to Tasks',
	introduction: 'Tasks manage work that still needs attention. When work is finished, completing the task with accurate service details preserves what happened in the property’s Maintenance History.',
	founderNote: ['A completed task should not disappear without context. Future you should be able to see who performed the work, what changed, what it cost, and which records support the result.'],
	sections: [
		{
			heading: 'When to use a task',
			paragraphs: [
				'Create a task for maintenance, repair, inspection, replacement, or follow-up that still needs to happen. A task can hold a due date, priority, assignment, recurrence, notes, and links to the correct property and equipment.',
				'Use a direct action title such as “Schedule furnace inspection” or “Replace refrigerator water filter.” Avoid titles such as “Furnace” that do not tell the assigned person what the next action is. If work has already happened and no task existed, add a Maintenance History record instead of creating a backdated to-do.',
			],
		},
		{
			heading: 'A realistic example',
			paragraphs: [
				'A water heater begins making an unusual sound. You create “Ask plumber to inspect water heater,” link the correct property and water heater, set a due date, and assign it to the family member arranging service. The plumber replaces a failing valve, checks for leaks, and recommends another inspection in one year.',
				'When the visit is complete, you finish the existing task and record the actual service date, plumber, valve replacement, cost, and recommendation. You attach the invoice and create a separate follow-up task for the next inspection. The original concern, completed repair, supporting evidence, and future action now remain distinct but connected.',
			],
			image: {
				src: '/screenshots/desktop_tasks.png',
				alt: 'Tasks page showing maintenance task cards with property context.',
				caption: 'Task cards keep the action, due status, assignment, and property context visible.',
			},
		},
		{
			heading: 'Create and complete the work',
			steps: [
				'Create a task with one clear action and choose the correct property.',
				'Link the relevant equipment when the work concerns a particular system or appliance.',
				'Add a realistic due date, priority, assignment, notes, and recurrence when appropriate.',
				'Use task notes for preparation or updates while the work remains open.',
				'After the work is actually finished, open the same task and choose the completion action.',
				'Enter the actual service date, result, contractor or person, cost, parts, warranty details, and follow-up needs that you can verify.',
				'Attach invoices, receipts, service reports, and useful before-or-after photos.',
				'Create a new task for recommended work that has not happened yet.',
			],
		},
		{
			heading: 'What Maintley saves',
			paragraphs: [
				'Creating the task adds planned work to the active task list. Assigning it identifies who owns the next action; assignment does not change account ownership or property access. A recurring schedule creates future maintenance automation on plans that include recurring tasks.',
				'Completing the task removes it from active work and preserves completion information with the property’s maintenance record. Files and notes added at completion support that historical record. Editing Maintenance History later is appropriate when correcting a date, cost, contractor, or description; it should not be used to make unfinished work look complete.',
			],
		},
		{
			heading: 'Common mistakes',
			tips: [
				'Complete the existing task to preserve the work instead of creating a second maintenance record.',
				'Keep the task open when only the appointment has been scheduled.',
				'Record contractor recommendations as future work until they have actually been completed.',
				'Describe what was inspected, repaired, cleaned, or replaced instead of recording only “done.”',
				'Give unrelated equipment or properties their own recurring tasks.',
			],
		},
		{
			heading: 'Troubleshooting, plans, and permissions',
			paragraphs: [
				'Manual tasks, due dates, task assignment, and Maintenance History are available across standard plans. Recurring tasks, suggested maintenance task generation, reminder email, and push features require a plan that includes those capabilities. If a recurrence control is unavailable, keep the current task as a one-time task or review plan options; do not create many speculative future tasks.',
				'If you cannot edit, complete, or delete a task, confirm your account role and property assignment. Limited team roles may only see or update assigned work. If the task points to the wrong property or equipment, correct that context before completion. If completion appears to fail, keep the page open, check the connection, and avoid submitting repeatedly until you know whether the first action saved.',
			],
		},
	],
	relatedGuideSlugs: ['repair-record-or-maintenance-task', 'what-to-preserve-after-service-work', 'track-appliances-and-home-systems'],
};
