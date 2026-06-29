import { Task, TaskStatus } from '../types/Task.types';
import { getTaskDisplayStatus } from './taskDisplayStatus';
import { filterDateRange } from './tableFilters';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DUE_SOON_SORT_DAYS = 14;

const parseTaskDueDate = (value?: string): Date | null => {
	if (!value) return null;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;
	return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const getTodayDate = (): Date => {
	const today = new Date();
	return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

type TaskDueSortInput = {
	dueDate?: string;
	status?: string;
};

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
 * Orders actionable tasks by homeowner urgency:
 * overdue, due today, ASAP/no date, due soon, then later work.
 */
export const getTaskDueUrgencyRank = (
	task: TaskDueSortInput,
): number => {
	const displayStatus = getTaskDisplayStatus(task);
	if (displayStatus.isOverdue) return 0;

	const dueDate = parseTaskDueDate(task.dueDate);
	if (!dueDate) return 2;

	const today = getTodayDate();
	const daysUntilDue = Math.ceil(
		(dueDate.getTime() - today.getTime()) / MS_PER_DAY,
	);

	if (daysUntilDue === 0) return 1;
	if (daysUntilDue > 0 && daysUntilDue <= DUE_SOON_SORT_DAYS) return 3;
	return 4;
};

export const compareTasksByDueUrgency = <
	T extends TaskDueSortInput,
>(
	a: T,
	b: T,
): number => {
	const rankCompare = getTaskDueUrgencyRank(a) - getTaskDueUrgencyRank(b);
	if (rankCompare !== 0) return rankCompare;

	const dueA = parseTaskDueDate(a.dueDate);
	const dueB = parseTaskDueDate(b.dueDate);

	if (dueA && dueB) {
		return dueA.getTime() - dueB.getTime();
	}

	return 0;
};

/**
 * Compatibility utility retained for existing callers.
 * Overdue is now derived from the due date for display instead of mutating
 * task status in memory or Firestore.
 */
export const updateOverdueTasks = async (tasks: Task[]): Promise<Task[]> => {
	return tasks;
};

/**
 * Returns a homeowner-facing assignee label without exposing internal record IDs.
 * The assignedTo snapshot is preferred because it remains useful after access is removed.
 */
export const getTaskAssigneeDisplayName = (
	task: Partial<Task> | any,
	fallback = 'Unassigned',
): string => {
	const assignedTo =
		task?.assignedTo && typeof task.assignedTo === 'object'
			? task.assignedTo
			: null;
	const legacyFullName =
		task?.assigneeFirstName || task?.assigneeLastName
			? `${task.assigneeFirstName || ''} ${task.assigneeLastName || ''}`.trim()
			: '';
	const displayName = String(
		assignedTo?.name ||
			task?.assigneeName ||
			legacyFullName ||
			assignedTo?.email ||
			task?.assigneeEmail ||
			'',
	).trim();

	return displayName || fallback;
};
