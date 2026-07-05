import { Task, TaskFinancials, CompletionFile } from '../types/Task.types';
import {
	buildMaintenanceEventFromTask,
	buildNextRecurringTask,
	withDefaultTaskNotificationSchedule,
} from './taskLifecycle';

export type RecurringTaskFailureInput = {
	userId: string;
	task: Task;
	taskId: string;
	error: unknown;
};

export type TaskLifecycleDependencies = {
	getTask: (taskId: string) => Promise<Task | null>;
	writeMaintenanceEvent: (event: Record<string, unknown>) => Promise<void>;
	createTask: (task: Omit<Task, 'id'>) => Promise<void>;
	deleteTask: (taskId: string) => Promise<void>;
	notifyRecurringTaskGenerationFailure: (
		input: RecurringTaskFailureInput,
	) => Promise<void>;
	now?: () => string;
	warn?: (...args: unknown[]) => void;
};

export type SubmitTaskCompletionInput = {
	taskId: string;
	accountId?: string;
	notifyUserId: string;
	completionDate: string;
	completionNotes?: string;
	completionFile?: CompletionFile;
	financials?: TaskFinancials;
	completedBy: string;
	completedByPlan?: string;
};

export type ApproveTaskInput = {
	taskId: string;
	accountId?: string;
	approvedBy: string;
};

export const mergeCompletionFinancials = (
	taskFinancials?: TaskFinancials,
	completionFinancials?: TaskFinancials,
): TaskFinancials | undefined => {
	if (!completionFinancials) {
		return taskFinancials;
	}

	return {
		currency:
			completionFinancials.currency || taskFinancials?.currency || 'USD',
		estimate: completionFinancials.estimate || taskFinancials?.estimate,
		actual: completionFinancials.actual || taskFinancials?.actual,
		notes:
			completionFinancials.notes !== undefined
				? completionFinancials.notes
				: taskFinancials?.notes,
	};
};

export const createNextRecurringTaskForCompletion = async ({
	task,
	taskId,
	accountId,
	completionDate,
	notifyUserId,
	deps,
}: {
	task: Task;
	taskId: string;
	accountId: string;
	completionDate: string;
	notifyUserId: string;
	deps: Pick<
		TaskLifecycleDependencies,
		'createTask' | 'notifyRecurringTaskGenerationFailure' | 'now' | 'warn'
	>;
}): Promise<void> => {
	const nextTask = buildNextRecurringTask({
		task,
		taskId,
		accountId,
		completionDate,
		nowIso: deps.now?.(),
	});
	if (!nextTask) {
		return;
	}

	try {
		await deps.createTask(withDefaultTaskNotificationSchedule(nextTask));
	} catch (error) {
		deps.warn?.('Failed to create next recurring task:', error);
		try {
			await deps.notifyRecurringTaskGenerationFailure({
				userId: notifyUserId,
				task,
				taskId,
				error,
			});
		} catch (notificationError) {
			deps.warn?.(
				'Failed to create recurring generation failure notification:',
				notificationError,
			);
		}
	}
};

const getRequiredTask = async (
	taskId: string,
	deps: Pick<TaskLifecycleDependencies, 'getTask'>,
): Promise<Task> => {
	const task = await deps.getTask(taskId);
	if (!task) {
		throw new Error('Task not found');
	}
	return task;
};

export const submitTaskCompletionWorkflow = async (
	input: SubmitTaskCompletionInput,
	deps: TaskLifecycleDependencies,
): Promise<Partial<Task>> => {
	const task = await getRequiredTask(input.taskId, deps);
	const accountId = String(
		(task as any).accountId || input.accountId || task.userId || '',
	).trim();
	const mergedFinancials = mergeCompletionFinancials(
		task.financials,
		input.financials,
	);
	const eventPayload = buildMaintenanceEventFromTask({
		task: { ...task, status: 'Completed' },
		taskId: input.taskId,
		accountId,
		eventType: 'task_completed',
		eventSource: 'task_completion',
		completionDate: input.completionDate,
		completionNotes: input.completionNotes || task.completionNotes || '',
		completionFile: input.completionFile,
		completedBy: input.completedBy,
		completedByName: undefined,
		financials: mergedFinancials,
		nowIso: deps.now?.(),
	});

	await deps.writeMaintenanceEvent({
		...eventPayload,
		data: {
			completedByPlan: input.completedByPlan,
		},
	});
	await createNextRecurringTaskForCompletion({
		task,
		taskId: input.taskId,
		accountId,
		completionDate: input.completionDate,
		notifyUserId: input.notifyUserId,
		deps,
	});

	try {
		await deps.deleteTask(input.taskId);
	} catch (cleanupError) {
		deps.warn?.(
			'Task completion history was written, but task cleanup failed:',
			cleanupError,
		);
	}

	return {
		id: input.taskId,
		status: 'Completed',
		completionDate: input.completionDate,
		completionFile: input.completionFile,
		completedBy: input.completedBy,
		completionNotes: input.completionNotes,
		financials: mergedFinancials,
	};
};

export const approveTaskWorkflow = async (
	input: ApproveTaskInput,
	deps: TaskLifecycleDependencies,
): Promise<Partial<Task>> => {
	const task = await getRequiredTask(input.taskId, deps);
	const accountId = String(
		(task as any).accountId || input.accountId || task.userId || '',
	).trim();
	const approvedAt = deps.now?.() || new Date().toISOString();
	const updates = {
		status: 'Completed' as const,
		approvedBy: input.approvedBy,
		updatedAt: approvedAt,
	};
	const eventPayload = buildMaintenanceEventFromTask({
		task: { ...task, ...updates },
		taskId: input.taskId,
		accountId,
		eventType: 'task_approved',
		eventSource: 'task_approval',
		completionDate: task.completionDate || approvedAt,
		completionNotes: task.completionNotes,
		completionFile: task.completionFile,
		completedBy: task.completedBy,
		completedByName: undefined,
		financials: task.financials,
		nowIso: approvedAt,
	});

	await deps.writeMaintenanceEvent({
		...eventPayload,
		data: {
			approvedBy: input.approvedBy,
			approvedAt,
		},
	});
	await deps.deleteTask(input.taskId);

	return {
		id: input.taskId,
		...updates,
	};
};
