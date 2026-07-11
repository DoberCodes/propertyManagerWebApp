import { MaintenanceEvent } from '../types/MaintenanceEvent.types';
import { CompletionFile, Task, TaskFinancials } from '../types/Task.types';
import { calculateNextDueDate } from '../utils/recurringTaskUtils';
import { getDefaultTaskNotifications } from '../utils/taskNotificationUtils';
import { normalizeFinancialsWithTotals } from '../utils/financialUtils';

export const sanitizeTaskLifecycleRecord = (
	record: Record<string, unknown>,
): Record<string, unknown> => {
	const sanitized: Record<string, unknown> = {};
	Object.entries(record).forEach(([key, value]) => {
		if (value !== undefined) {
			sanitized[key] = value;
		}
	});
	return sanitized;
};

const sanitizeMaintenanceEvent = (event: Partial<MaintenanceEvent>) =>
	sanitizeTaskLifecycleRecord(event as Record<string, unknown>);

export const buildMaintenanceEventFromTask = ({
	task,
	taskId,
	accountId,
	eventType,
	eventSource,
	completionDate,
	completionNotes,
	completionFile,
	completedBy,
	completedByName,
	financials,
	nowIso = new Date().toISOString(),
}: {
	task: Task;
	taskId: string;
	accountId: string;
	eventType: MaintenanceEvent['eventType'];
	eventSource: MaintenanceEvent['eventSource'];
	completionDate: string;
	completionNotes?: string;
	completionFile?: CompletionFile;
	completedBy?: string;
	completedByName?: string;
	financials?: TaskFinancials;
	nowIso?: string;
}) =>
	sanitizeMaintenanceEvent({
		accountId,
		propertyId: task.propertyId,
		propertyTitle: task.propertyTitle || task.property,
		unitId: task.unitId,
		deviceIds: Array.isArray(task.devices) && task.devices.length > 0 ? task.devices : undefined,
		title: task.title || 'Maintenance event',
		completionDate,
		completionNotes: completionNotes || task.completionNotes,
		completedBy,
		completedByName,
		completionFile,
		financials: normalizeFinancialsWithTotals(financials || task.financials),
		linkedTaskIds: [taskId],
		originalTaskId: taskId,
		recurringTaskId: task.isRecurring ? task.parentTaskId || taskId : undefined,
		maintenanceCycleId: task.isRecurring ? task.parentTaskId || taskId : undefined,
		eventType,
		eventSource,
		createdAt: nowIso,
		updatedAt: nowIso,
	});

export const withDefaultTaskNotificationSchedule = (
	task: Omit<Task, 'id'>,
): Omit<Task, 'id'> => {
	if (task.enableNotifications === false) {
		return task;
	}

	if (Array.isArray(task.notifications) && task.notifications.length > 0) {
		return {
			...task,
			enableNotifications:
				typeof task.enableNotifications === 'boolean'
					? task.enableNotifications
					: true,
		};
	}

	return {
		...task,
		enableNotifications: true,
		notifications: getDefaultTaskNotifications(),
	};
};

export const removeRecurringFieldsForPlan = <T extends Record<string, any>>(
	taskData: T,
	canUseRecurringTaskFeature: boolean,
): T => {
	if (canUseRecurringTaskFeature) {
		return taskData;
	}

	const nextTaskData: Record<string, any> = { ...taskData };
	nextTaskData.isRecurring = false;
	delete nextTaskData.recurrenceFrequency;
	delete nextTaskData.recurrenceInterval;
	delete nextTaskData.recurrenceCustomUnit;
	delete nextTaskData.parentTaskId;
	delete nextTaskData.lastRecurrenceDate;
	return nextTaskData as T;
};

export const toDateOnly = (value?: string): string => {
	if (!value) return new Date().toISOString().split('T')[0];
	return value.includes('T') ? value.split('T')[0] : value;
};

export const getRecurringInterval = (task: Task): number | null => {
	if (!task.isRecurring || !task.recurrenceFrequency) {
		return null;
	}

	if (task.recurrenceFrequency === 'custom') {
		if (!task.recurrenceInterval || !task.recurrenceCustomUnit) {
			return null;
		}
		return task.recurrenceInterval;
	}

	return task.recurrenceInterval || 1;
};

export const buildNextRecurringTask = ({
	task,
	taskId,
	accountId,
	completionDate,
	nowIso = new Date().toISOString(),
}: {
	task: Task;
	taskId: string;
	accountId: string;
	completionDate: string;
	nowIso?: string;
}): Omit<Task, 'id'> | null => {
	const interval = getRecurringInterval(task);
	if (!interval || !task.recurrenceFrequency) {
		return null;
	}

	const lastRecurrenceDate = toDateOnly(completionDate);
	const nextDueDate = calculateNextDueDate(
		lastRecurrenceDate,
		task.recurrenceFrequency,
		interval,
		task.recurrenceCustomUnit,
	);
	const financials =
		task.financials?.estimate || task.financials?.notes
			? {
					currency: task.financials.currency || 'USD',
					estimate: task.financials.estimate,
					notes: task.financials.notes,
			  }
			: undefined;

	return sanitizeTaskLifecycleRecord({
		userId: task.userId || accountId,
		accountId,
		propertyId: task.propertyId,
		property: task.property,
		propertyTitle: task.propertyTitle,
		unitId: task.unitId,
		suiteId: task.suiteId,
		devices: task.devices,
		title: task.title,
		description: task.description,
		notes: task.notes,
		category: task.category,
		location: task.location,
		priority: task.priority,
		assignee: task.assignee,
		assignedTo: task.assignedTo,
		assigneeName: task.assigneeName,
		assigneeFirstName: task.assigneeFirstName,
		assigneeLastName: task.assigneeLastName,
		assigneeEmail: task.assigneeEmail,
		requiresWorkOrder: task.requiresWorkOrder,
		enableNotifications: task.enableNotifications,
		notifications: task.notifications,
		maintenanceGroupId: task.maintenanceGroupId,
		financials,
		dueDate: nextDueDate,
		status: 'Initiated',
		isRecurring: true,
		recurrenceFrequency: task.recurrenceFrequency,
		recurrenceInterval: interval,
		recurrenceCustomUnit: task.recurrenceCustomUnit,
		parentTaskId: task.parentTaskId || taskId,
		lastRecurrenceDate,
		createdAt: nowIso,
		updatedAt: nowIso,
	}) as Omit<Task, 'id'>;
};
