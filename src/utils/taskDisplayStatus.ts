export type TaskDisplayStatus =
	| 'Initiated'
	| 'Upcoming'
	| 'Due Soon'
	| 'Overdue'
	| 'Completed';

export interface TaskDisplayStatusInput {
	status?: string;
	dueDate?: string;
}

export interface TaskDisplayStatusDetails {
	label: TaskDisplayStatus;
	color: string;
	background: string;
	border: string;
	isCompleted: boolean;
	isOverdue: boolean;
	isDueSoon: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 14;

const parseDateOnly = (value?: string): Date | null => {
	if (!value) return null;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;
	return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const getToday = (): Date => {
	const today = new Date();
	return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

export const getTaskDisplayStatus = (
	task: TaskDisplayStatusInput,
): TaskDisplayStatusDetails => {
	const storedStatus = String(task.status || '').trim();
	if (storedStatus === 'Completed') {
		return {
			label: 'Completed',
			color: '#166534',
			background: '#dcfce7',
			border: '#86efac',
			isCompleted: true,
			isOverdue: false,
			isDueSoon: false,
		};
	}

	const dueDate = parseDateOnly(task.dueDate);
	if (!dueDate) {
		return {
			label: 'Initiated',
			color: '#475569',
			background: '#f8fafc',
			border: '#cbd5e1',
			isCompleted: false,
			isOverdue: false,
			isDueSoon: false,
		};
	}

	const today = getToday();
	const daysUntilDue = Math.ceil(
		(dueDate.getTime() - today.getTime()) / MS_PER_DAY,
	);
	const isOverdue = storedStatus === 'Overdue' || daysUntilDue < 0;

	if (isOverdue) {
		return {
			label: 'Overdue',
			color: '#991b1b',
			background: '#fee2e2',
			border: '#fca5a5',
			isCompleted: false,
			isOverdue: true,
			isDueSoon: false,
		};
	}

	if (daysUntilDue <= DUE_SOON_DAYS) {
		return {
			label: 'Due Soon',
			color: '#92400e',
			background: '#fffbeb',
			border: '#fcd34d',
			isCompleted: false,
			isOverdue: false,
			isDueSoon: true,
		};
	}

	return {
		label: 'Upcoming',
		color: '#065f46',
		background: '#ecfdf5',
		border: '#6ee7b7',
		isCompleted: false,
		isOverdue: false,
		isDueSoon: false,
	};
};

export const isTaskDueWithinDays = (
	task: TaskDisplayStatusInput,
	days: number,
): boolean => {
	const displayStatus = getTaskDisplayStatus(task);
	if (displayStatus.isCompleted || displayStatus.isOverdue) return false;

	const dueDate = parseDateOnly(task.dueDate);
	if (!dueDate) return false;

	const today = getToday();
	const daysUntilDue = Math.ceil(
		(dueDate.getTime() - today.getTime()) / MS_PER_DAY,
	);

	return daysUntilDue >= 0 && daysUntilDue <= days;
};
