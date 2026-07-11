import { getBaselineDefinitionForAsset } from '../baselineCareLibrary';
import { expectsRecurringCareRecord } from '../assetRecordExpectations';
import { MaintleyIntelligenceRule } from '../types';
import {
	getMaintenanceHistoryDate,
	getMaintenanceHistoryText,
	getAssetDisplayName,
	getTaskDate,
	isTaskOpen,
	makeFinding,
	normalizeText,
} from './helpers';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getCalendarDayDelta = (laterDate: Date, earlierDate: Date): number =>
	Math.floor(
		(Date.UTC(
			laterDate.getUTCFullYear(),
			laterDate.getUTCMonth(),
			laterDate.getUTCDate(),
		) -
			Date.UTC(
				earlierDate.getUTCFullYear(),
				earlierDate.getUTCMonth(),
				earlierDate.getUTCDate(),
			)) /
			MS_PER_DAY,
	);

const historyReferencesSystem = (history: any, systemId: string): boolean => {
	const deviceId = String(history?.deviceId || history?.systemId || '');
	const deviceIds = Array.isArray(history?.deviceIds)
		? history.deviceIds.map(String)
		: [];
	const taskDeviceIds = Array.isArray(history?.devices)
		? history.devices.map(String)
		: [];

	return (
		deviceId === systemId ||
		deviceIds.includes(systemId) ||
		taskDeviceIds.includes(systemId)
	);
};

const findLatestMatchingHistory = (
	maintenanceHistory: any[],
	systemId: string,
	matchTerms: string[],
) =>
	maintenanceHistory
		.map((history) => ({
			history,
			date: getMaintenanceHistoryDate(history),
			text: getMaintenanceHistoryText(history),
		}))
		.filter(
			(candidate) =>
				candidate.date &&
				historyReferencesSystem(candidate.history, systemId) &&
				matchTerms.some((term) =>
					candidate.text.includes(normalizeText(term)),
				),
		)
		.sort((left, right) => right.date!.getTime() - left.date!.getTime())[0] ||
	null;

const taskReferencesSystem = (task: any, systemId: string): boolean => {
	const deviceIds = Array.isArray(task?.devices)
		? task.devices.map(String)
		: [];
	const legacyDeviceId = String(task?.deviceId || '').trim();

	return deviceIds.includes(systemId) || legacyDeviceId === systemId;
};

const getTaskText = (task: any): string =>
	normalizeText(
		[
			task?.title,
			task?.description,
			task?.notes,
			task?.category,
		]
			.filter(Boolean)
			.join(' '),
	);

const getCadenceSubjectLabel = (label: string): string =>
	label
		.trim()
		.replace(/^replace or inspect\s+/i, '')
		.replace(/^record\s+/i, '')
		.replace(/^review\s+/i, '') ||
	'maintenance';

const getTaskRecurrenceIntervalDays = (task: any): number | undefined => {
	switch (task?.recurrenceFrequency) {
		case 'daily':
			return 1;
		case 'weekly':
			return 7;
		case 'biweekly':
			return 14;
		case 'monthly':
			return 30;
		case 'quarterly':
			return 90;
		case 'yearly':
			return 365;
		case 'custom': {
			const interval = Number(task?.recurrenceInterval);
			if (!Number.isFinite(interval) || interval <= 0) return undefined;
			switch (task?.recurrenceCustomUnit) {
				case 'days':
					return interval;
				case 'weeks':
					return interval * 7;
				case 'months':
					return interval * 30;
				case 'years':
					return interval * 365;
				default:
					return undefined;
			}
		}
		default:
			return undefined;
	}
};

const findMatchingRecurringTask = (
	tasks: any[],
	systemId: string,
	matchTerms: string[],
) =>
	tasks
		.map((task) => ({
			task,
			dueDate: getTaskDate(task),
			text: getTaskText(task),
		}))
		.filter((candidate) => {
			if (
				!candidate.dueDate ||
				!isTaskOpen(candidate.task) ||
				candidate.task?.isRecurring !== true ||
				!taskReferencesSystem(candidate.task, systemId)
			) {
				return false;
			}

			const matchesCadence = matchTerms.some((term) =>
				candidate.text.includes(normalizeText(term)),
			);

			return matchesCadence;
		})
		.sort((left, right) => left.dueDate!.getTime() - right.dueDate!.getTime())[0] ||
	null;

type ScheduleInsightType =
	| 'frequency_longer_than_common'
	| 'next_date_later_than_expected'
	| 'possibly_missed'
	| '';

const getScheduleInsightType = (
	task: any,
	dueDate: Date,
	currentDate: Date,
	scheduledDaysFromLastMaintenance: number,
	commonIntervalDays: number,
): ScheduleInsightType => {
	const toleranceDays = 7;
	const recurrenceIntervalDays = getTaskRecurrenceIntervalDays(task);

	if (dueDate <= currentDate) {
		return 'possibly_missed';
	}

	if (
		recurrenceIntervalDays &&
		recurrenceIntervalDays > commonIntervalDays + toleranceDays
	) {
		return 'frequency_longer_than_common';
	}

	if (scheduledDaysFromLastMaintenance > commonIntervalDays + toleranceDays) {
		return 'next_date_later_than_expected';
	}

	return '';
};

export const baselineMaintenanceCadenceRule: MaintleyIntelligenceRule = {
	id: 'baseline-maintenance-cadence-overdue',
	evaluate: (context) =>
		context.systems.flatMap((system) => {
			if (!expectsRecurringCareRecord(system)) return [];

			const baseline = getBaselineDefinitionForAsset(system);
			if (!baseline) return [];

			return baseline.suggestedMaintenanceCadence.flatMap((cadence) => {
				const latestHistory = findLatestMatchingHistory(
					context.maintenanceHistory,
					system.id,
					cadence.matchTerms,
				);
				if (!latestHistory?.date) return [];

				const elapsedDays = Math.floor(
					(context.currentDate.getTime() - latestHistory.date.getTime()) /
						MS_PER_DAY,
				);
				if (elapsedDays <= cadence.intervalDays) return [];

				const systemName = getAssetDisplayName(system);
				const matchingRecurringTask = findMatchingRecurringTask(
					context.tasks,
					system.id,
					cadence.matchTerms,
				);
				const scheduledDaysFromLastMaintenance = matchingRecurringTask?.dueDate
					? getCalendarDayDelta(matchingRecurringTask.dueDate, latestHistory.date)
					: undefined;
				const scheduledTaskRecurrenceIntervalDays =
					matchingRecurringTask?.task
						? getTaskRecurrenceIntervalDays(matchingRecurringTask.task)
						: undefined;
				const scheduleInsightType =
					matchingRecurringTask?.task &&
					matchingRecurringTask?.dueDate &&
					scheduledDaysFromLastMaintenance !== undefined
						? getScheduleInsightType(
							matchingRecurringTask.task,
							matchingRecurringTask.dueDate,
							context.currentDate,
							scheduledDaysFromLastMaintenance,
							cadence.intervalDays,
						)
						: '';
				if (matchingRecurringTask && !scheduleInsightType) return [];

				const hasScheduleInsight = Boolean(
					matchingRecurringTask?.task?.id &&
					matchingRecurringTask?.dueDate &&
					scheduleInsightType,
				);
				const cadenceSubject = getCadenceSubjectLabel(cadence.label);

				return [
					makeFinding(context, {
						id: `maintley-intelligence:${context.property.id}:baseline-cadence:${system.id}:${cadence.id}`,
						ruleId: 'baseline-maintenance-cadence-overdue',
						affectedSystemIds: [system.id],
						category: hasScheduleInsight
							? 'Schedule Optimization'
							: 'Maintenance Opportunities',
						severity: cadence.severity,
						priority: cadence.priority,
						source: 'history_inference',
						title: hasScheduleInsight
							? `Your ${cadenceSubject} schedule may need an update`
							: `${cadence.label} may be due`,
						description: hasScheduleInsight
							? `Maintley compared the saved maintenance history for ${systemName} with its linked recurring task and found the reminder is scheduled farther out than the common ${cadence.intervalDays}-day timeframe.`
							: `${systemName} last had "${cadence.label}" recorded approximately ${elapsedDays} days ago. The common timeframe is every ${cadence.intervalDays} days.`,
						whyItMatters: hasScheduleInsight
							? 'A filter schedule that matches the actual maintenance routine helps keep future reminders useful.'
							: cadence.whyItMatters,
						suggestedActionLabel: hasScheduleInsight
							? 'Review scheduled task'
							: cadence.suggestedActionLabel,
						suggestedActionType: hasScheduleInsight
							? 'open_task'
							: 'open_maintenance',
						metadata: {
							systemId: system.id,
							systemName,
							baselineAssetType: baseline.assetType,
							baselineImportanceLevel: baseline.importanceLevel,
							baselineCadenceId: cadence.id,
							baselineCadenceLabel: cadence.label,
							baselineIntervalDays: cadence.intervalDays,
							elapsedDays,
							lastMaintenanceDate: latestHistory.date.toISOString(),
							...(hasScheduleInsight
								? {
									taskId: matchingRecurringTask!.task.id,
									scheduledTaskId: matchingRecurringTask!.task.id,
									scheduledTaskTitle: matchingRecurringTask!.task.title,
									scheduledTaskDueDate:
										matchingRecurringTask!.dueDate!.toISOString(),
									scheduledTaskDaysFromLastMaintenance:
										scheduledDaysFromLastMaintenance,
									scheduledTaskRecurrenceIntervalDays,
									scheduleInsightType,
									insightType: 'schedule_optimization',
								}
								: {}),
							baselineVersion: context.baselineVersion,
							disclaimerNotes: baseline.disclaimerNotes,
						},
					}),
				];
			});
		}),
};
