import {
	buildMaintenanceEventFromTask,
	buildNextRecurringTask,
	removeRecurringFieldsForPlan,
	withDefaultTaskNotificationSchedule,
} from './taskLifecycle';
import { Task } from '../types/Task.types';

const baseTask: Task = {
	id: 'task-1',
	userId: 'user-1',
	propertyId: 'property-1',
	property: 'Avery Brooks',
	propertyTitle: 'Avery Brooks',
	title: 'Replace HVAC filter',
	dueDate: '2026-07-01',
	status: 'Initiated',
	priority: 'High',
	devices: ['hvac-1'],
	financials: {
		currency: 'USD',
		estimate: {
			contractorCost: 125,
		},
		actual: {
			materialsCost: 45,
		},
		notes: 'Use MERV 11 filters.',
	},
};

describe('task lifecycle helpers', () => {
	it('builds a task completion maintenance event without undefined fields', () => {
		const event = buildMaintenanceEventFromTask({
			task: baseTask,
			taskId: baseTask.id,
			accountId: 'account-1',
			eventType: 'task_completed',
			eventSource: 'task_completion',
			completionDate: '2026-07-05',
			completedBy: 'member-1',
			financials: {
				currency: 'USD',
				actual: {
					contractorCost: 200,
				},
			},
			nowIso: '2026-07-05T12:00:00.000Z',
		});

		expect(event).toEqual({
			accountId: 'account-1',
			propertyId: 'property-1',
			propertyTitle: 'Avery Brooks',
			deviceIds: ['hvac-1'],
			title: 'Replace HVAC filter',
			completionDate: '2026-07-05',
			completedBy: 'member-1',
			financials: {
				currency: 'USD',
				actual: {
					contractorCost: 200,
				},
			},
			linkedTaskIds: ['task-1'],
			originalTaskId: 'task-1',
			eventType: 'task_completed',
			eventSource: 'task_completion',
			createdAt: '2026-07-05T12:00:00.000Z',
			updatedAt: '2026-07-05T12:00:00.000Z',
		});
		expect(Object.prototype.hasOwnProperty.call(event, 'unitId')).toBe(false);
		expect(Object.prototype.hasOwnProperty.call(event, 'completionFile')).toBe(false);
	});

	it('links recurring completion events back to the maintenance cycle', () => {
		const event = buildMaintenanceEventFromTask({
			task: {
				...baseTask,
				isRecurring: true,
				parentTaskId: 'cycle-1',
			},
			taskId: baseTask.id,
			accountId: 'account-1',
			eventType: 'task_completed',
			eventSource: 'task_completion',
			completionDate: '2026-07-05',
			nowIso: '2026-07-05T12:00:00.000Z',
		});

		expect(event.recurringTaskId).toBe('cycle-1');
		expect(event.maintenanceCycleId).toBe('cycle-1');
	});

	it('builds the next recurring task from the completed recurring task', () => {
		const nextTask = buildNextRecurringTask({
			task: {
				...baseTask,
				isRecurring: true,
				recurrenceFrequency: 'monthly',
				recurrenceInterval: 1,
				parentTaskId: 'cycle-1',
				assignedTo: {
					id: 'contractor-1',
					name: 'Apex HVAC',
					email: 'service@example.com',
				},
				assignee: 'contractor-1',
			},
			taskId: baseTask.id,
			accountId: 'account-1',
			completionDate: '2026-07-05',
			nowIso: '2026-07-05T12:00:00.000Z',
		});

		expect(nextTask).toMatchObject({
			userId: 'user-1',
			accountId: 'account-1',
			propertyId: 'property-1',
			title: 'Replace HVAC filter',
			status: 'Initiated',
			isRecurring: true,
			recurrenceFrequency: 'monthly',
			recurrenceInterval: 1,
			parentTaskId: 'cycle-1',
			lastRecurrenceDate: '2026-07-05',
			dueDate: '2026-08-05',
			assignee: 'contractor-1',
			assignedTo: {
				id: 'contractor-1',
				name: 'Apex HVAC',
				email: 'service@example.com',
			},
			financials: {
				currency: 'USD',
				estimate: {
					contractorCost: 125,
				},
				notes: 'Use MERV 11 filters.',
			},
			createdAt: '2026-07-05T12:00:00.000Z',
			updatedAt: '2026-07-05T12:00:00.000Z',
		});
		expect((nextTask as any).id).toBeUndefined();
		expect(nextTask?.financials?.actual).toBeUndefined();
	});

	it('does not build a next task when recurrence data is incomplete', () => {
		expect(
			buildNextRecurringTask({
				task: { ...baseTask, isRecurring: false },
				taskId: baseTask.id,
				accountId: 'account-1',
				completionDate: '2026-07-05',
			}),
		).toBeNull();

		expect(
			buildNextRecurringTask({
				task: {
					...baseTask,
					isRecurring: true,
					recurrenceFrequency: 'custom',
				},
				taskId: baseTask.id,
				accountId: 'account-1',
				completionDate: '2026-07-05',
			}),
		).toBeNull();
	});

	it('strips recurring fields when the account plan cannot use recurring tasks', () => {
		const result = removeRecurringFieldsForPlan(
			{
				title: 'Flush water heater',
				isRecurring: true,
				recurrenceFrequency: 'yearly',
				recurrenceInterval: 1,
				recurrenceCustomUnit: 'years',
				parentTaskId: 'cycle-1',
				lastRecurrenceDate: '2026-01-01',
			},
			false,
		);

		expect(result).toEqual({
			title: 'Flush water heater',
			isRecurring: false,
		});
	});

	it('keeps recurring fields when the account plan allows recurring tasks', () => {
		const taskData = {
			title: 'Flush water heater',
			isRecurring: true,
			recurrenceFrequency: 'yearly',
			recurrenceInterval: 1,
		};

		expect(removeRecurringFieldsForPlan(taskData, true)).toBe(taskData);
	});

	it('adds default task notifications unless notifications are disabled', () => {
		const withDefaults = withDefaultTaskNotificationSchedule({
			...baseTask,
		});

		expect(withDefaults.enableNotifications).toBe(true);
		expect(withDefaults.notifications).toHaveLength(4);

		const disabled = withDefaultTaskNotificationSchedule({
			...baseTask,
			enableNotifications: false,
		});

		expect(disabled.enableNotifications).toBe(false);
		expect(disabled.notifications).toBeUndefined();
	});
});
