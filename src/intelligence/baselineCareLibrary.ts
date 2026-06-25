import { Device } from '../types/Property.types';
import { MaintleyCapability } from './types';
import { normalizeText } from './rules/helpers';

export const BASELINE_CARE_LIBRARY_VERSION = '2026.1';

export type BaselineImportanceLevel = 'standard' | 'important' | 'critical';

export interface BaselineMaintenanceCadence {
	id: string;
	label: string;
	intervalDays: number;
	severity: 'low' | 'medium' | 'high';
	priority: 'low' | 'medium' | 'high';
	matchTerms: string[];
	whyItMatters: string;
	suggestedActionLabel: string;
}

export interface BaselineCareDefinition {
	systemType: string;
	importanceLevel: BaselineImportanceLevel;
	matchTerms: string[];
	recommendedFields: string[];
	suggestedMaintenanceCadence: BaselineMaintenanceCadence[];
	recommendedDocuments: string[];
	lifecycleHints: string[];
	applicableCapabilities: MaintleyCapability[];
	disclaimerNotes: string[];
}

export const BASELINE_CARE_DEFINITIONS: BaselineCareDefinition[] = [
	{
		systemType: 'HVAC',
		importanceLevel: 'important',
		matchTerms: ['hvac', 'furnace', 'air conditioner', 'heat pump', 'ac unit'],
		recommendedFields: ['make', 'model', 'install date', 'filter size'],
		suggestedMaintenanceCadence: [
			{
				id: 'hvac-filter-replacement',
				label: 'Replace or inspect HVAC filter',
				intervalDays: 90,
				severity: 'medium',
				priority: 'medium',
				matchTerms: ['filter', 'air filter', 'replace filter', 'hvac filter'],
				whyItMatters:
					'Regular filter checks help keep airflow visible in your maintenance records and make routine HVAC care easier to track.',
				suggestedActionLabel: 'Open maintenance history',
			},
		],
		recommendedDocuments: ['manual', 'warranty'],
		lifecycleHints: ['Track install date for future replacement planning.'],
		applicableCapabilities: [],
		disclaimerNotes: [
			'Maintley baseline guidance is general recordkeeping guidance, not manufacturer-specific service advice.',
		],
	},
	{
		systemType: 'Water Heater',
		importanceLevel: 'important',
		matchTerms: ['water heater', 'hot water heater'],
		recommendedFields: ['make', 'model', 'install date'],
		suggestedMaintenanceCadence: [
			{
				id: 'water-heater-flush',
				label: 'Flush water heater',
				intervalDays: 365,
				severity: 'medium',
				priority: 'medium',
				matchTerms: ['flush', 'flushed', 'drain', 'sediment'],
				whyItMatters:
					'Recording flushes helps preserve a useful service timeline for sediment-related maintenance.',
				suggestedActionLabel: 'Open maintenance history',
			},
		],
		recommendedDocuments: ['manual', 'warranty'],
		lifecycleHints: ['Track install date for long-term replacement planning.'],
		applicableCapabilities: [],
		disclaimerNotes: [
			'Maintley baseline guidance should be adjusted if your manufacturer or plumber recommends a different interval.',
		],
	},
	{
		systemType: 'Smoke/CO Detector',
		importanceLevel: 'critical',
		matchTerms: [
			'smoke detector',
			'smoke alarm',
			'carbon monoxide',
			'co detector',
			'fire alarm',
		],
		recommendedFields: ['install date', 'location'],
		suggestedMaintenanceCadence: [
			{
				id: 'safety-device-check',
				label: 'Check smoke or carbon monoxide detector',
				intervalDays: 180,
				severity: 'high',
				priority: 'high',
				matchTerms: ['check', 'test', 'battery', 'replace battery'],
				whyItMatters:
					'Recording checks or battery changes keeps safety-device maintenance visible in the property timeline.',
				suggestedActionLabel: 'Open maintenance history',
			},
		],
		recommendedDocuments: ['manual'],
		lifecycleHints: ['Track replacement dates for each detector.'],
		applicableCapabilities: [],
		disclaimerNotes: [
			'Maintley does not certify safety devices or evaluate whether they meet code requirements.',
		],
	},
];

export const getBaselineDefinitionForSystem = (
	system: Device,
): BaselineCareDefinition | null => {
	const systemText = normalizeText(`${system.type} ${system.brand} ${system.model}`);
	return (
		BASELINE_CARE_DEFINITIONS.find((definition) =>
			definition.matchTerms.some((term) =>
				systemText.includes(normalizeText(term)),
			),
		) || null
	);
};
