import { getBaselineDefinitionForAsset } from '../baselineCareLibrary';
import { expectsRecurringCareRecord } from '../assetRecordExpectations';
import { MaintleyIntelligenceRule } from '../types';
import {
	getMaintenanceHistoryDate,
	getMaintenanceHistoryText,
	getAssetDisplayName,
	makeFinding,
	normalizeText,
} from './helpers';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

				return [
					makeFinding(context, {
						id: `maintley-intelligence:${context.property.id}:baseline-cadence:${system.id}:${cadence.id}`,
						ruleId: 'baseline-maintenance-cadence-overdue',
						affectedSystemIds: [system.id],
						category: 'Maintenance Opportunities',
						severity: cadence.severity,
						priority: cadence.priority,
						source: 'history_inference',
						title: `${cadence.label} may be due for ${systemName}.`,
						description: `${systemName} last had "${cadence.label}" recorded approximately ${elapsedDays} days ago. Maintley's baseline interval is every ${cadence.intervalDays} days.`,
						whyItMatters: cadence.whyItMatters,
						suggestedActionLabel: cadence.suggestedActionLabel,
						suggestedActionType: 'open_maintenance',
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
							baselineVersion: context.baselineVersion,
							disclaimerNotes: baseline.disclaimerNotes,
						},
					}),
				];
			});
		}),
};
