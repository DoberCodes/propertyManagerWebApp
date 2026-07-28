import type { TaskScheduleMode } from '../types/Task.types';

export type TaskScheduleInput = {
	dueDate?: string;
	scheduleMode?: TaskScheduleMode;
};

export const getTaskScheduleMode = (task?: TaskScheduleInput | null): TaskScheduleMode => {
	if (task?.scheduleMode === 'scheduled' && task.dueDate) return 'scheduled';
	if (task?.scheduleMode === 'asap') return 'asap';
	if (task?.scheduleMode === 'unscheduled') return 'unscheduled';
	if (task?.dueDate) return 'scheduled';
	// Compatibility: blank dates created before scheduleMode existed meant ASAP.
	return 'asap';
};

export const getTaskTimingLabel = (task?: TaskScheduleInput | null) => {
	const mode = getTaskScheduleMode(task);
	if (mode === 'asap') return 'ASAP';
	if (mode === 'unscheduled') return 'Not scheduled';
	if (!task?.dueDate) return 'Not scheduled';
	const parsed = new Date(task.dueDate);
	return Number.isNaN(parsed.getTime())
		? task.dueDate
		: parsed.toLocaleDateString();
};

export const normalizeTaskSchedule = (task: TaskScheduleInput) => {
	const scheduleMode = getTaskScheduleMode(task);
	return {
		scheduleMode,
		dueDate: scheduleMode === 'scheduled' ? String(task.dueDate || '') : '',
	};
};
