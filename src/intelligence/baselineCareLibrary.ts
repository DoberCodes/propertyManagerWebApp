import { Device } from '../types/Property.types';
import { MaintleyCapability } from './types';
import { normalizeText } from './rules/helpers';
import {
	getDeviceAssetClassificationText,
	getDeviceAssetVariant,
	getDeviceAssetType,
} from '../utils/systemTypes';

export const BASELINE_CARE_LIBRARY_VERSION = '2026.1';

export type BaselineImportanceLevel = 'standard' | 'important' | 'critical';

export interface BaselineMaintenanceCadence {
	id: string;
	label: string;
	intervalDays: number;
	severity: 'low' | 'medium' | 'high';
	priority: 'low' | 'medium' | 'high';
	applicableVariants?: string[];
	excludedVariants?: string[];
	matchTerms: string[];
	whyItMatters: string;
	suggestedActionLabel: string;
}

export interface BaselineLifecycleGuidance {
	typicalLifespanYears?: string;
	notes: string[];
}

export interface BaselineSeasonalGuidance {
	spring?: string[];
	summer?: string[];
	fall?: string[];
	winter?: string[];
}

export interface BaselineCareDefinition {
	assetType: string;
	importanceLevel: BaselineImportanceLevel;
	matchTerms: string[];
	recommendedFields: string[];
	suggestedMaintenanceCadence: BaselineMaintenanceCadence[];
	maintenanceTopics: string[];
	partsAndSupplies: string[];
	recommendedDocuments: string[];
	lifecycle: BaselineLifecycleGuidance;
	lifecycleHints: string[];
	seasonalGuidance: BaselineSeasonalGuidance;
	applicableCapabilities: MaintleyCapability[];
	disclaimerNotes: string[];
}

export const BASELINE_CARE_DEFINITIONS: BaselineCareDefinition[] = [
	{
		assetType: 'HVAC',
		importanceLevel: 'important',
		matchTerms: [
			'hvac',
			'furnace',
			'air conditioner',
			'air conditioning',
			'central ac',
			'heat pump',
			'ac unit',
			'mini split',
			'air handler',
		],
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
			{
				id: 'hvac-professional-service',
				label: 'Record HVAC professional service',
				intervalDays: 365,
				severity: 'medium',
				priority: 'medium',
				matchTerms: [
					'service',
					'tune up',
					'tune-up',
					'inspection',
					'professional service',
					'seasonal service',
				],
				whyItMatters:
					'Recording professional service creates a clearer service timeline for future troubleshooting, warranty review, and planning.',
				suggestedActionLabel: 'Open maintenance history',
			},
		],
		maintenanceTopics: ['Filter', 'Professional Service'],
		partsAndSupplies: ['Capacitor', 'Contactor', 'Filter'],
		recommendedDocuments: ['manual', 'warranty'],
		lifecycle: {
			typicalLifespanYears: '15-20',
			notes: [
				'Track install date for long-term replacement planning.',
				'Use lifecycle guidance for planning context, not equipment diagnosis.',
			],
		},
		lifecycleHints: [
			'Typical lifespan: 15-20 years for many HVAC systems.',
			'Track install date for future replacement planning.',
		],
		seasonalGuidance: {
			spring: ['Record cooling-season service or filter checks.'],
			summer: ['Review cooling-season filter checks or service history.'],
			fall: ['Record heating-season service or filter checks.'],
		},
		applicableCapabilities: [],
		disclaimerNotes: [
			'Maintley baseline guidance is general recordkeeping guidance, not manufacturer-specific service advice.',
		],
	},
	{
		assetType: 'Water Heater',
		importanceLevel: 'important',
		matchTerms: [
			'water heater',
			'hot water heater',
			'tankless',
			'tank water heater',
		],
		recommendedFields: ['make', 'model', 'install date', 'serial'],
		suggestedMaintenanceCadence: [
			{
				id: 'water-heater-flush',
				label: 'Flush water heater',
				intervalDays: 365,
				severity: 'medium',
				priority: 'medium',
				applicableVariants: ['Tank Gas', 'Tank Electric', 'Heat Pump'],
				matchTerms: ['flush', 'flushed', 'drain', 'sediment'],
				whyItMatters:
					'Recording flushes helps preserve a useful service timeline for sediment-related maintenance.',
				suggestedActionLabel: 'Open maintenance history',
			},
			{
				id: 'water-heater-anode-rod-check',
				label: 'Inspect water heater anode rod',
				intervalDays: 1095,
				severity: 'medium',
				priority: 'medium',
				applicableVariants: ['Tank Gas', 'Tank Electric', 'Heat Pump'],
				matchTerms: ['anode', 'anode rod'],
				whyItMatters:
					'Recording anode rod checks helps make longer-term water heater service history easier to understand.',
				suggestedActionLabel: 'Open maintenance history',
			},
			{
				id: 'tankless-water-heater-descaling-review',
				label: 'Review tankless water heater descaling',
				intervalDays: 365,
				severity: 'medium',
				priority: 'medium',
				applicableVariants: ['Tankless Gas', 'Tankless Electric'],
				matchTerms: ['descale', 'descaling', 'scale', 'mineral'],
				whyItMatters:
					'Recording descaling or manufacturer-recommended tankless service helps keep water-heater maintenance history specific to the equipment type.',
				suggestedActionLabel: 'Open maintenance history',
			},
		],
		maintenanceTopics: ['Flush Tank', 'Inspect Anode Rod', 'Tankless Descaling Review'],
		partsAndSupplies: ['Anode Rod', 'Temperature and Pressure Relief Valve'],
		recommendedDocuments: ['manual', 'warranty'],
		lifecycle: {
			typicalLifespanYears: '8-12',
			notes: [
				'Track install date for long-term replacement planning.',
				'Use manufacturer and plumber guidance when it differs from Maintley baseline guidance.',
			],
		},
		lifecycleHints: [
			'Typical lifespan: 8-12 years for many tank water heaters.',
			'Track install date for long-term replacement planning.',
		],
		seasonalGuidance: {
			summer: ['Review water heater service history before heavier household use.'],
			fall: ['Record a flush or service review before heavier winter use.'],
		},
		applicableCapabilities: [],
		disclaimerNotes: [
			'Maintley baseline guidance should be adjusted if your manufacturer or plumber recommends a different interval.',
		],
	},
	{
		assetType: 'Refrigerator',
		importanceLevel: 'standard',
		matchTerms: ['refrigerator', 'fridge'],
		recommendedFields: ['make', 'model', 'serial', 'install date', 'filter size'],
		suggestedMaintenanceCadence: [
			{
				id: 'refrigerator-water-filter',
				label: 'Replace refrigerator water filter',
				intervalDays: 180,
				severity: 'medium',
				priority: 'medium',
				matchTerms: ['water filter', 'filter replacement', 'replace filter'],
				whyItMatters:
					'Recording filter changes makes it easier to remember the filter model and see when it was last replaced.',
				suggestedActionLabel: 'Open maintenance history',
			},
			{
				id: 'refrigerator-coil-cleaning',
				label: 'Clean refrigerator coils',
				intervalDays: 365,
				severity: 'low',
				priority: 'low',
				matchTerms: ['coil', 'coils', 'clean coils', 'condenser coil'],
				whyItMatters:
					'Recording coil cleaning keeps routine equipment care visible in the property history.',
				suggestedActionLabel: 'Open maintenance history',
			},
		],
		maintenanceTopics: ['Water Filter', 'Clean Coils'],
		partsAndSupplies: ['Water Filter', 'Air Filter'],
		recommendedDocuments: ['manual', 'warranty'],
		lifecycle: {
			typicalLifespanYears: '10-15',
			notes: [
				'Track install date for warranty review and replacement planning.',
			],
		},
		lifecycleHints: [
			'Typical lifespan: 10-15 years for many refrigerators.',
			'Track water filter model for easier replacements.',
		],
		seasonalGuidance: {
			spring: ['Record coil cleaning if it is part of your routine care.'],
			summer: ['Review refrigerator filter or coil-cleaning history during heavier seasonal use.'],
			fall: ['Review filter history before holiday or heavy kitchen use.'],
		},
		applicableCapabilities: [],
		disclaimerNotes: [
			'Maintley baseline guidance is general recordkeeping guidance, not manufacturer-specific service advice.',
		],
	},
	{
		assetType: 'Washer',
		importanceLevel: 'standard',
		matchTerms: ['washer', 'washing machine'],
		recommendedFields: ['make', 'model', 'serial', 'install date'],
		suggestedMaintenanceCadence: [
			{
				id: 'washer-cleaning-cycle',
				label: 'Run washer cleaning cycle',
				intervalDays: 90,
				severity: 'low',
				priority: 'low',
				matchTerms: ['clean washer', 'cleaning cycle', 'tub clean', 'washer cleaner'],
				whyItMatters:
					'Recording cleaning cycles helps keep routine equipment care visible without relying on memory.',
				suggestedActionLabel: 'Open maintenance history',
			},
			{
				id: 'washer-hose-check',
				label: 'Inspect washer hoses',
				intervalDays: 365,
				severity: 'medium',
				priority: 'medium',
				matchTerms: ['hose', 'hoses', 'supply line', 'inlet hose'],
				whyItMatters:
					'Recording hose checks helps future you see when water-supply connections were last reviewed.',
				suggestedActionLabel: 'Open maintenance history',
			},
		],
		maintenanceTopics: ['Cleaning Cycle', 'Hose Check'],
		partsAndSupplies: ['Hoses', 'Inlet Screens'],
		recommendedDocuments: ['manual', 'warranty'],
		lifecycle: {
			typicalLifespanYears: '10-13',
			notes: ['Track install date for replacement planning and warranty review.'],
		},
		lifecycleHints: ['Typical lifespan: 10-13 years for many washers.'],
		seasonalGuidance: {
			spring: ['Record a hose check if laundry connections are accessible.'],
			summer: ['Review washer cleaning-cycle history during heavier laundry seasons.'],
			fall: ['Review cleaning-cycle history before heavier seasonal use.'],
		},
		applicableCapabilities: [],
		disclaimerNotes: [
			'Maintley baseline guidance is general recordkeeping guidance, not manufacturer-specific service advice.',
		],
	},
	{
		assetType: 'Dryer',
		importanceLevel: 'important',
		matchTerms: ['dryer', 'clothes dryer'],
		recommendedFields: ['make', 'model', 'serial', 'install date'],
		suggestedMaintenanceCadence: [
			{
				id: 'dryer-vent-cleaning',
				label: 'Clean dryer vent',
				intervalDays: 365,
				severity: 'high',
				priority: 'high',
				matchTerms: ['vent', 'dryer vent', 'lint duct', 'duct cleaning'],
				whyItMatters:
					'Recording dryer vent cleaning keeps an important maintenance item visible in the property timeline.',
				suggestedActionLabel: 'Open maintenance history',
			},
			{
				id: 'dryer-lint-filter-care',
				label: 'Record dryer lint filter care',
				intervalDays: 90,
				severity: 'medium',
				priority: 'medium',
				matchTerms: ['lint filter', 'lint screen', 'lint trap'],
				whyItMatters:
					'Recording lint filter care helps make recurring dryer maintenance easier to track over time.',
				suggestedActionLabel: 'Open maintenance history',
			},
		],
		maintenanceTopics: ['Lint Filter', 'Vent Cleaning'],
		partsAndSupplies: ['Vent Duct', 'Lint Screen', 'Belt'],
		recommendedDocuments: ['manual', 'warranty'],
		lifecycle: {
			typicalLifespanYears: '10-13',
			notes: ['Track install date for replacement planning and warranty review.'],
		},
		lifecycleHints: ['Typical lifespan: 10-13 years for many dryers.'],
		seasonalGuidance: {
			spring: ['Record dryer vent cleaning if it is part of spring maintenance.'],
			summer: ['Review lint and vent-cleaning history during heavier laundry seasons.'],
			fall: ['Review vent cleaning history before heavier winter laundry use.'],
		},
		applicableCapabilities: [],
		disclaimerNotes: [
			'Maintley baseline guidance is general recordkeeping guidance, not a safety inspection or code assessment.',
		],
	},
	{
		assetType: 'Roof',
		importanceLevel: 'important',
		matchTerms: ['roof', 'roofing', 'shingle', 'shingles'],
		recommendedFields: ['install date', 'material', 'warranty'],
		suggestedMaintenanceCadence: [
			{
				id: 'roof-inspection',
				label: 'Record roof inspection',
				intervalDays: 365,
				severity: 'medium',
				priority: 'medium',
				matchTerms: ['roof inspection', 'inspect roof', 'roof check', 'roofer'],
				whyItMatters:
					'Recording inspections gives future roof reviews and repair decisions a clearer history.',
				suggestedActionLabel: 'Open maintenance history',
			},
			{
				id: 'roof-gutter-review',
				label: 'Record roof or gutter review',
				intervalDays: 180,
				severity: 'medium',
				priority: 'medium',
				matchTerms: ['gutter', 'gutters', 'downspout', 'debris', 'roof debris'],
				whyItMatters:
					'Recording roof and gutter reviews helps exterior maintenance stay visible across seasons.',
				suggestedActionLabel: 'Open maintenance history',
			},
		],
		maintenanceTopics: ['Inspection', 'Gutter or Debris Review'],
		partsAndSupplies: ['Shingles', 'Flashing', 'Roof Sealant'],
		recommendedDocuments: ['warranty', 'inspection report', 'photos'],
		lifecycle: {
			typicalLifespanYears: '20-30',
			notes: [
				'Track install date and material for long-term planning.',
				'Roof lifecycle varies significantly by material, climate, installation, and maintenance history.',
			],
		},
		lifecycleHints: [
			'Typical lifespan: 20-30 years for many asphalt shingle roofs.',
			'Track material and install date for long-term planning.',
		],
		seasonalGuidance: {
			spring: ['Record a roof and gutter review after winter weather.'],
			summer: ['Record a roof or gutter review after heavy storms.'],
			fall: ['Record a roof and gutter review before winter weather.'],
		},
		applicableCapabilities: [],
		disclaimerNotes: [
			'Maintley does not inspect roof condition or evaluate structural safety.',
		],
	},
	{
		assetType: 'Smoke/CO Detector',
		importanceLevel: 'critical',
		matchTerms: [
			'smoke detector',
			'smoke alarm',
			'carbon monoxide',
			'co detector',
			'fire alarm',
		],
		recommendedFields: ['model', 'serial', 'install date', 'location'],
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
			{
				id: 'safety-device-battery-replacement',
				label: 'Record detector battery replacement',
				intervalDays: 365,
				severity: 'medium',
				priority: 'medium',
				matchTerms: ['battery', 'replace battery', 'battery replacement'],
				whyItMatters:
					'Recording battery changes makes safety-device maintenance easier to review later.',
				suggestedActionLabel: 'Open maintenance history',
			},
		],
		maintenanceTopics: ['Test', 'Battery Replacement'],
		partsAndSupplies: ['Battery', 'Replacement Detector'],
		recommendedDocuments: ['manual'],
		lifecycle: {
			typicalLifespanYears: '7-10',
			notes: [
				'Track install and replacement dates for each detector.',
				'Follow the device label and manufacturer instructions for replacement timing.',
			],
		},
		lifecycleHints: [
			'Typical replacement window: 7-10 years for many detectors.',
			'Track replacement dates for each detector.',
		],
		seasonalGuidance: {
			spring: ['Record a test or battery check.'],
			summer: ['Review detector test history and battery notes.'],
			fall: ['Record a test or battery check.'],
		},
		applicableCapabilities: [],
		disclaimerNotes: [
			'Maintley does not certify safety devices or evaluate whether they meet code requirements.',
		],
	},
];

const isCadenceApplicableToAsset = (
	cadence: BaselineMaintenanceCadence,
	assetVariant: string,
): boolean => {
	const applicableVariants = cadence.applicableVariants || [];
	const excludedVariants = cadence.excludedVariants || [];
	if (!assetVariant) return true;
	if (excludedVariants.includes(assetVariant)) return false;
	if (applicableVariants.length > 0) {
		return applicableVariants.includes(assetVariant);
	}
	return true;
};

const applyAssetVariantToDefinition = (
	definition: BaselineCareDefinition,
	asset: Device,
): BaselineCareDefinition => {
	const assetVariant = getDeviceAssetVariant(asset);
	if (!assetVariant) return definition;

	return {
		...definition,
		suggestedMaintenanceCadence:
			definition.suggestedMaintenanceCadence.filter((cadence) =>
				isCadenceApplicableToAsset(cadence, assetVariant),
			),
	};
};

export const getBaselineDefinitionForAsset = (
	asset: Device,
): BaselineCareDefinition | null => {
	const exactAssetType = getDeviceAssetType(asset);
	const exactMatch = BASELINE_CARE_DEFINITIONS.find(
		(definition) => definition.assetType === exactAssetType,
	);
	if (exactMatch) return applyAssetVariantToDefinition(exactMatch, asset);

	const assetText = normalizeText(getDeviceAssetClassificationText(asset));
	const textMatch =
		BASELINE_CARE_DEFINITIONS.find((definition) =>
			definition.matchTerms.some((term) =>
				assetText.includes(normalizeText(term)),
			),
		) || null;

	return textMatch ? applyAssetVariantToDefinition(textMatch, asset) : null;
};
