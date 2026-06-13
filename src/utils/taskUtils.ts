import { Task, TaskStatus } from '../types/Task.types';
import { getTaskDisplayStatus } from './taskDisplayStatus';
import { filterDateRange } from './tableFilters';

/**
 * Checks if a task is overdue based on its due date and current status
 */
export const isTaskOverdue = (task: Task): boolean => {
	if (!task.dueDate) return false;

	// Don't mark as overdue if already in a final state
	const finalStatuses: TaskStatus[] = ['Completed', 'Rejected', 'Overdue'];
	if (finalStatuses.includes(task.status)) return false;

	const dueDate = new Date(task.dueDate);
	const today = new Date();
	today.setHours(0, 0, 0, 0); // Start of today

	return dueDate < today;
};

/**
 * Determines whether a task should be treated as overdue for UI display and sorting.
 * Includes tasks already marked as Overdue by server-side jobs.
 */
export const isTaskOverdueForDisplay = (task: Task): boolean => {
	return getTaskDisplayStatus(task).isOverdue;
};

/**
 * Overdue tasks are always included, while other tasks must match the provided date range.
 */
export const matchesDateRangeOrIsOverdue = (
	task: Task,
	startDate?: string,
	endDate?: string,
): boolean => {
	if (isTaskOverdueForDisplay(task)) {
		return true;
	}

	if (!task.dueDate) {
		return !startDate && !endDate;
	}

	return filterDateRange(task.dueDate, startDate || '', endDate || '');
};

/**
 * Compatibility utility retained for existing callers.
 * Overdue is now derived from the due date for display instead of mutating
 * task status in memory or Firestore.
 */
export const updateOverdueTasks = async (tasks: Task[]): Promise<Task[]> => {
	return tasks;
};
