import { Device } from '../../types/Property.types';
import { shouldSuggestInspectionDocumentation } from '../assetRecordExpectations';
import { MaintleyIntelligenceRule } from '../types';
import {
	getAssetDisplayName,
	getMaintenanceHistoryText,
	makeFinding,
	normalizeText,
} from './helpers';

const INSPECTION_TERMS = [
	'inspection',
	'inspect',
	'review',
	'check',
	'assessment',
	'walkthrough',
];

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

const hasDocumentedInspection = (
	system: Device,
	maintenanceHistory: any[],
): boolean =>
	maintenanceHistory.some((history) => {
		if (!historyReferencesSystem(history, system.id)) return false;
		const historyText = getMaintenanceHistoryText(history);
		return INSPECTION_TERMS.some((term) =>
			historyText.includes(normalizeText(term)),
		);
	});

export const missingInspectionDocumentationRule: MaintleyIntelligenceRule = {
	id: 'inspection-assets-missing-documented-inspection',
	evaluate: (context) =>
		context.systems.flatMap((system) => {
			if (!shouldSuggestInspectionDocumentation(system)) return [];
			if (hasDocumentedInspection(system, context.maintenanceHistory)) return [];

			const systemName = getAssetDisplayName(system);

			return [
				makeFinding(context, {
					id: `maintley-intelligence:${context.property.id}:missing-inspection-documentation:${system.id}`,
					ruleId: 'inspection-assets-missing-documented-inspection',
					affectedSystemIds: [system.id],
					category: 'Missing Information',
					severity: 'low',
					priority: 'low',
					title: `Document an inspection for ${systemName}`,
					description: `Maintley's records do not show a documented inspection or condition review for ${systemName}.`,
					whyItMatters:
						'Structural and inspection-based items usually do not need make, model, or serial details. A documented inspection gives Maintley useful history without treating the item like equipment.',
					suggestedActionLabel: 'Open maintenance history',
					suggestedActionType: 'open_maintenance',
					metadata: {
						systemId: system.id,
						systemName,
						recordExpectation: 'inspection_documentation',
					},
				}),
			];
		}),
};
