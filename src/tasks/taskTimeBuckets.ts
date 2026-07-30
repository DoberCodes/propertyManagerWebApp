import { Task } from '../types/Task.types';
import { isTaskOverdueForDisplay } from '../utils/taskUtils';
import { getTaskScheduleMode } from './taskSchedule';

export type TaskTimeBucketId =
	| 'overdue'
	| 'today'
	| 'this-week'
	| 'upcoming'
	| 'asap'
	| 'unscheduled';

export type TaskTimeBucket = {
	id: TaskTimeBucketId;
	label: string;
	description: string;
	tasks: Task[];
};

const startOfDay = (value: Date): Date => {
	const date = new Date(value);
	date.setHours(0, 0, 0, 0);
	return date;
};

const parseTaskDueDate = (task: Pick<Task, 'dueDate'>): Date | null => {
	if (!task.dueDate) return null;
	const date = new Date(task.dueDate);
	if (Number.isNaN(date.getTime())) return null;
	return startOfDay(date);
};

export const getTaskTimeBucketId = (
	task: Task,
	now: Date = new Date(),
): TaskTimeBucketId => {
	const dueDate = parseTaskDueDate(task);
	if (!dueDate) {
		return getTaskScheduleMode(task) === 'unscheduled' ? 'unscheduled' : 'asap';
	}

	const today = startOfDay(now);
	if (isTaskOverdueForDisplay(task) || dueDate < today) return 'overdue';

	const diffDays = Math.round(
		(dueDate.getTime() - today.getTime()) / 86400000,
	);
	if (diffDays === 0) return 'today';
	if (diffDays <= 7) return 'this-week';
	return 'upcoming';
};

export const buildTaskTimeBuckets = (
	tasks: Task[],
	now: Date = new Date(),
): TaskTimeBucket[] => {
	const buckets: Record<TaskTimeBucketId, Task[]> = {
		overdue: [],
		today: [],
		'this-week': [],
		upcoming: [],
		asap: [],
		unscheduled: [],
	};

	tasks.forEach((task) => {
		buckets[getTaskTimeBucketId(task, now)].push(task);
	});

	return [
		{
			id: 'overdue',
			label: 'Overdue',
			description: 'Work that needs catching up.',
			tasks: buckets.overdue,
		},
		{
			id: 'today',
			label: 'Today',
			description: 'Planned maintenance for today.',
			tasks: buckets.today,
		},
		{
			id: 'this-week',
			label: 'This Week',
			description: 'Maintenance coming up in the next 7 days.',
			tasks: buckets['this-week'],
		},
		{
			id: 'upcoming',
			label: 'Upcoming',
			description: 'Active work beyond this week.',
			tasks: buckets.upcoming,
		},
		{
			id: 'asap',
			label: 'ASAP',
			description: 'Work to address as soon as capacity allows.',
			tasks: buckets.asap,
		},
		{
			id: 'unscheduled',
			label: 'Not Scheduled',
			description: 'Work whose timing has not been decided.',
			tasks: buckets.unscheduled,
		},
	];
};
