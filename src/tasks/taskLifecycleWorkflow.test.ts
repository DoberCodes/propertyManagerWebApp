import {
	approveTaskWorkflow,
	mergeCompletionFinancials,
	submitTaskCompletionWorkflow,
	TaskLifecycleDependencies,
} from './taskLifecycleWorkflow';
import { Task } from '../types/Task.types';

const baseTask: Task = {
	id: 'task-1',
	userId: 'user-1',
	propertyId: 'property-1',
	property: 'Avery Brooks',
	propertyTitle: 'Avery Brooks',
	title: 'Test smoke and carbon monoxide detectors',
	dueDate: '2026-07-01',
	status: 'Initiated',
	priority: 'Urgent',
	devices: ['smoke-1'],
	financials: {
		currency: 'USD',
		estimate: {
			contractorCost: 80,
		},
		notes: 'Use property safety checklist.',
	},
};

const createDeps = (task: Task | null = baseTask): TaskLifecycleDependencies => ({
	getTask: jest.fn(async () => task),
	writeMaintenanceEvent: jest.fn(async () => undefined),
	createTask: jest.fn(async () => undefined),
	deleteTask: jest.fn(async () => undefined),
	notifyRecurringTaskGenerationFailure: jest.fn(async () => undefined),
	now: jest.fn(() => '2026-07-05T12:00:00.000Z'),
	warn: jest.fn(),
});

describe('task lifecycle workflows', () => {
	it('merges completion financials without losing task estimates', () => {
		expect(
			mergeCompletionFinancials(baseTask.financials, {
				actualCost: 45,
				actual: {
					materialsCost: 45,
				},
			}),
		).toEqual({
			currency: 'USD',
			estimate: {
				contractorCost: 80,
			},
			actual: {
				materialsCost: 45,
			},
			actualCost: 45,
			notes: 'Use property safety checklist.',
		});
	});

	it('submits completion by writing one maintenance event, creating next recurrence, and deleting the task', async () => {
		const deps = createDeps({
			...baseTask,
			isRecurring: true,
			recurrenceFrequency: 'monthly',
			recurrenceInterval: 1,
			parentTaskId: 'cycle-1',
		});

		const result = await submitTaskCompletionWorkflow(
			{
				taskId: 'task-1',
				accountId: 'account-1',
				notifyUserId: 'user-1',
				completionDate: '2026-07-05',
				completionNotes: 'Completed and verified.',
				completedBy: 'member-1',
				completedByPlan: 'portfolio',
				financials: {
					actualCost: 95,
					actual: {
						contractorCost: 95,
					},
				},
			},
			deps,
		);

		expect(deps.writeMaintenanceEvent).toHaveBeenCalledTimes(1);
		expect(deps.writeMaintenanceEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				accountId: 'account-1',
				propertyId: 'property-1',
				eventType: 'task_completed',
				eventSource: 'task_completion',
				completionDate: '2026-07-05',
				completedBy: 'member-1',
				linkedTaskIds: ['task-1'],
				originalTaskId: 'task-1',
				recurringTaskId: 'cycle-1',
				maintenanceCycleId: 'cycle-1',
				data: {
					completedByPlan: 'portfolio',
				},
				financials: expect.objectContaining({
					actual: {
						contractorCost: 95,
					},
					actualCost: 95,
				}),
			}),
		);
		expect(deps.createTask).toHaveBeenCalledTimes(1);
		expect(deps.createTask).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Test smoke and carbon monoxide detectors',
				status: 'Initiated',
				isRecurring: true,
				parentTaskId: 'cycle-1',
				dueDate: '2026-08-05',
				enableNotifications: true,
				notifications: expect.any(Array),
			}),
		);
		expect(deps.deleteTask).toHaveBeenCalledWith('task-1');
		expect(result).toEqual(
			expect.objectContaining({
				id: 'task-1',
				status: 'Completed',
				completionDate: '2026-07-05',
				completedBy: 'member-1',
				completionNotes: 'Completed and verified.',
			}),
		);
	});

	it('submits completion without creating a next task for non-recurring work', async () => {
		const deps = createDeps();

		await submitTaskCompletionWorkflow(
			{
				taskId: 'task-1',
				accountId: 'account-1',
				notifyUserId: 'user-1',
				completionDate: '2026-07-05',
				completedBy: 'member-1',
			},
			deps,
		);

		expect(deps.writeMaintenanceEvent).toHaveBeenCalledTimes(1);
		expect(deps.createTask).not.toHaveBeenCalled();
		expect(deps.deleteTask).toHaveBeenCalledWith('task-1');
	});

	it('keeps completion successful when task cleanup fails after the event is written', async () => {
		const deps = createDeps();
		(deps.deleteTask as jest.Mock).mockRejectedValueOnce(new Error('delete failed'));

		const result = await submitTaskCompletionWorkflow(
			{
				taskId: 'task-1',
				accountId: 'account-1',
				notifyUserId: 'user-1',
				completionDate: '2026-07-05',
				completedBy: 'member-1',
			},
			deps,
		);

		expect(deps.writeMaintenanceEvent).toHaveBeenCalledTimes(1);
		expect(deps.warn).toHaveBeenCalledWith(
			'Task completion history was written, but task cleanup failed:',
			expect.any(Error),
		);
		expect(result.status).toBe('Completed');
	});

	it('notifies when next recurring task creation fails but does not fail completion', async () => {
		const deps = createDeps({
			...baseTask,
			isRecurring: true,
			recurrenceFrequency: 'weekly',
			recurrenceInterval: 1,
		});
		(deps.createTask as jest.Mock).mockRejectedValueOnce(new Error('write failed'));

		await submitTaskCompletionWorkflow(
			{
				taskId: 'task-1',
				accountId: 'account-1',
				notifyUserId: 'user-1',
				completionDate: '2026-07-05',
				completedBy: 'member-1',
			},
			deps,
		);

		expect(deps.notifyRecurringTaskGenerationFailure).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'user-1',
				taskId: 'task-1',
				error: expect.any(Error),
			}),
		);
		expect(deps.deleteTask).toHaveBeenCalledWith('task-1');
	});

	it('approves a task by writing one approval event and deleting the active task', async () => {
		const deps = createDeps({
			...baseTask,
			completionDate: '2026-07-03',
			completionNotes: 'Submitted by technician.',
			completedBy: 'member-1',
		});

		const result = await approveTaskWorkflow(
			{
				taskId: 'task-1',
				accountId: 'account-1',
				approvedBy: 'manager-1',
			},
			deps,
		);

		expect(deps.writeMaintenanceEvent).toHaveBeenCalledTimes(1);
		expect(deps.writeMaintenanceEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				accountId: 'account-1',
				eventType: 'task_approved',
				eventSource: 'task_approval',
				completionDate: '2026-07-03',
				completedBy: 'member-1',
				data: {
					approvedBy: 'manager-1',
					approvedAt: '2026-07-05T12:00:00.000Z',
				},
			}),
		);
		expect(deps.deleteTask).toHaveBeenCalledWith('task-1');
		expect(result).toEqual({
			id: 'task-1',
			status: 'Completed',
			approvedBy: 'manager-1',
			updatedAt: '2026-07-05T12:00:00.000Z',
		});
	});

	it('throws when the task cannot be found', async () => {
		const deps = createDeps(null);

		await expect(
			submitTaskCompletionWorkflow(
				{
					taskId: 'missing-task',
					accountId: 'account-1',
					notifyUserId: 'user-1',
					completionDate: '2026-07-05',
					completedBy: 'member-1',
				},
				deps,
			),
		).rejects.toThrow('Task not found');
		expect(deps.writeMaintenanceEvent).not.toHaveBeenCalled();
	});
});
