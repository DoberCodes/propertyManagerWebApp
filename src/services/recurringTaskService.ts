import { callFirebaseFunction } from '../config/firebaseFunctions';
import { Task } from '../types/Task.types';

export type TrustedRecurringTaskOutcome =
	| 'created'
	| 'updated'
	| 'not_recurring'
	| 'not_entitled'
	| 'invalid_recurrence';

export type TrustedRecurringTaskResult = {
	outcome: TrustedRecurringTaskOutcome;
	taskId?: string;
	replayed?: boolean;
};

const callRecurringTaskWriter = async (params: Record<string, unknown>) => {
	const result = await callFirebaseFunction<
		Record<string, unknown>,
		TrustedRecurringTaskResult
	>('manageRecurringTask', params);
	return result.data;
};

export const createTrustedRecurringTask = (params: {
	accountId: string;
	requestId: string;
	task: Omit<Task, 'id'>;
}) => callRecurringTaskWriter({ operation: 'create', ...params });

export const updateTrustedRecurringTask = (params: {
	accountId: string;
	taskId: string;
	requestId: string;
	updates: Partial<Task>;
}) => callRecurringTaskWriter({ operation: 'update', ...params });

export const generateNextTrustedRecurringTask = (params: {
	accountId: string;
	taskId: string;
	requestId: string;
	completionDate: string;
}) => callRecurringTaskWriter({ operation: 'generate_next', ...params });
