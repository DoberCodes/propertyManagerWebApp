export type TaskDisplayStatus =
	| 'Initiated'
	| 'Upcoming'
	| 'Due Soon'
	| 'Overdue'
	| 'Completed';

interface TaskDisplayStatusInput {
	status?: string;
	dueDate?: string;
}

interface TaskDisplayStatusDetails {
	label: TaskDisplayStatus;
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
			isCompleted: true,
			isOverdue: false,
			isDueSoon: false,
		};
	}

	const dueDate = parseDateOnly(task.dueDate);
	if (!dueDate) {
		return {
			label: 'Initiated',
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
			isCompleted: false,
			isOverdue: true,
			isDueSoon: false,
		};
	}

	if (daysUntilDue <= DUE_SOON_DAYS) {
		return {
			label: 'Due Soon',
			isCompleted: false,
			isOverdue: false,
			isDueSoon: true,
		};
	}

	return {
		label: 'Upcoming',
		isCompleted: false,
		isOverdue: false,
		isDueSoon: false,
	};
};

