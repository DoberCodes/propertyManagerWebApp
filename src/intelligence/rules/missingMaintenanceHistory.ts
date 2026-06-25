import { MaintleyIntelligenceRule } from '../types';
import {
	getSystemName,
	hasMaintenanceHistory,
	isSafetyTrackingSystem,
	makeFinding,
} from './helpers';

export const missingMaintenanceHistoryRule: MaintleyIntelligenceRule = {
	id: 'systems-missing-maintenance-history',
	evaluate: (context) =>
		context.systems.flatMap((system) => {
			if (hasMaintenanceHistory(system, context.maintenanceHistory)) return [];

			const systemName = getSystemName(system);
			const isSafetySystem = isSafetyTrackingSystem(system);
			const ruleId = isSafetySystem
				? 'safety-systems-missing-maintenance-history'
				: 'systems-missing-maintenance-history';

			return [
				makeFinding(context, {
					id: `maintley-intelligence:${context.property.id}:${ruleId}:${system.id}`,
					ruleId,
					affectedSystemIds: [system.id],
					category: 'Maintenance Opportunities',
					severity: isSafetySystem ? 'high' : 'medium',
					priority: isSafetySystem ? 'high' : 'medium',
					title: isSafetySystem
						? `Start safety-device maintenance tracking for ${systemName}`
						: `Record first maintenance note for ${systemName}`,
					description: `${systemName} has no maintenance history in Maintley yet.`,
					whyItMatters: isSafetySystem
						? 'Recording safety-device checks, battery changes, or replacements helps keep the property maintenance timeline useful.'
						: 'Recording maintenance history helps build a useful service timeline and future recommendations.',
					suggestedActionLabel: 'Open maintenance history',
					suggestedActionType: 'open_maintenance',
					metadata: {
						systemId: system.id,
						systemName,
						isSafetySystem,
					},
				}),
			];
		}),
};
