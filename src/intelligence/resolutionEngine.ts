import {
	MaintleyFinding,
	MaintleyFindingActionType,
} from './types';

export type RecommendationResolutionType =
	| 'edit_asset'
	| 'create_task'
	| 'create_history'
	| 'upload_document'
	| 'scan_barcode'
	| 'knowledge_review'
	| 'contractor'
	| 'review_task';

export type RecommendationResolutionFieldTarget =
	| 'installationDate'
	| 'brand'
	| 'model'
	| 'filterSize'
	| 'serialNumber';

export interface RecommendationResolutionOption {
	label: string;
	description?: string;
	actionType: MaintleyFindingActionType;
	metadata?: Record<string, unknown>;
}

export interface RecommendationResolutionPlan {
	recommendationId: string;
	resolutionType: RecommendationResolutionType;
	actionLabel: string;
	assetLabel?: string;
	sectionLabel: string;
	missingFields: string[];
	whyItMatters: string;
	whatToDo: string;
	fieldTargets: RecommendationResolutionFieldTarget[];
	primaryActionLabel: string;
	primaryActionType: MaintleyFindingActionType;
	options: RecommendationResolutionOption[];
}

const FIELD_LABELS: Record<string, string> = {
	brand: 'make',
	make: 'make',
	model: 'model',
	serialNumber: 'serial number',
	'installation date': 'install date',
	installationDate: 'install date',
	'filter size': 'filter size',
	filterSize: 'filter size',
};

const normalizeFieldLabel = (field: unknown): string => {
	const rawValue = String(field || '').trim();
	if (!rawValue) return '';
	return FIELD_LABELS[rawValue] || rawValue;
};

const getStringArray = (value: unknown): string[] =>
	Array.isArray(value)
		? value.map(normalizeFieldLabel).filter(Boolean)
		: [];

const getAssetLabel = (finding: MaintleyFinding): string | undefined => {
	const systemName = String(finding.metadata.systemName || '').trim();
	return systemName || undefined;
};

const getFieldTargetsForIdentificationDetails = (
	missingFields: string[],
): RecommendationResolutionFieldTarget[] =>
	missingFields.reduce<RecommendationResolutionFieldTarget[]>((targets, field) => {
		switch (field) {
			case 'make':
				return [...targets, 'brand'];
			case 'model':
				return [...targets, 'model'];
			default:
				return targets;
		}
	}, []);

const getSuggestedCadenceOptions = (
	finding: MaintleyFinding,
): Array<{ id?: string; label: string; intervalDays?: number }> => {
	const rawCadence = finding.metadata.suggestedMaintenanceCadence;
	if (!Array.isArray(rawCadence)) return [];

	return rawCadence
		.map((cadence) => ({
			id: String((cadence as any)?.id || '').trim() || undefined,
			label: String((cadence as any)?.label || '').trim(),
			intervalDays: Number((cadence as any)?.intervalDays || 0) || undefined,
		}))
		.filter((cadence) => cadence.label);
};

const buildEditAssetResolution = (
	finding: MaintleyFinding,
	options: {
		sectionLabel?: string;
		missingFields: string[];
		fieldTargets: RecommendationResolutionFieldTarget[];
		whatToDo: string;
		options?: RecommendationResolutionOption[];
	},
): RecommendationResolutionPlan => ({
	recommendationId: finding.id,
	resolutionType: 'edit_asset',
	actionLabel: 'Complete recommendation',
	assetLabel: getAssetLabel(finding),
	sectionLabel: options.sectionLabel || 'Equipment Record',
	missingFields: options.missingFields,
	whyItMatters: finding.whyItMatters,
	whatToDo: options.whatToDo,
	fieldTargets: options.fieldTargets,
	primaryActionLabel: 'Open record',
	primaryActionType: 'edit_system',
	options: options.options || [
		{
			label: 'Upload invoice',
			description: 'Let Maintley look for the missing details in an invoice.',
			actionType: 'upload_document',
		},
		{
			label: 'Upload warranty',
			description: 'Use a warranty document to improve this equipment record.',
			actionType: 'upload_document',
		},
	],
});

export const getRecommendationResolutionPlan = (
	finding: MaintleyFinding,
): RecommendationResolutionPlan | undefined => {
	switch (finding.ruleId) {
		case 'major-systems-missing-install-dates':
			return buildEditAssetResolution(finding, {
				sectionLabel: 'Documentation',
				missingFields: ['install date'],
				fieldTargets: ['installationDate'],
				whatToDo:
					'Enter the approximate installation date or upload a document that shows when this equipment was installed.',
			});
		case 'systems-missing-important-identification': {
			const missingFields = getStringArray(finding.metadata.missingFields);
			return buildEditAssetResolution(finding, {
				sectionLabel: 'Equipment Record',
				missingFields: missingFields.length ? missingFields : ['make', 'model'],
				fieldTargets: getFieldTargetsForIdentificationDetails(
					missingFields.length ? missingFields : ['make', 'model'],
				),
				whatToDo:
					'Add the missing make or model details so the record is easier to use for manuals, parts, and service notes.',
				options: [
					{
						label: 'Scan model label',
						description: 'Use a photo of the equipment label when available.',
						actionType: 'upload_document',
					},
					{
						label: 'Upload manual',
						description: 'Use a manual or product document to improve this record.',
						actionType: 'upload_document',
					},
				],
			});
		}
		case 'knowledge-pack-record-details-missing': {
			const missingFields = getStringArray(finding.metadata.missingFields);
			return buildEditAssetResolution(finding, {
				sectionLabel: 'Parts & Supplies',
				missingFields: missingFields.length ? missingFields : ['equipment detail'],
				fieldTargets: missingFields.includes('filter size') ? ['filterSize'] : [],
				whatToDo:
					'Add the missing equipment detail so future maintenance and supplies are easier to plan.',
				options: [
					{
						label: 'Upload manual',
						description: 'Use a manual or equipment document to fill in the detail.',
						actionType: 'upload_document',
					},
					{
						label: 'Scan label',
						description: 'Use a photo of the equipment label if the detail is printed there.',
						actionType: 'upload_document',
					},
				],
			});
		}
		case 'systems-missing-actionable-maintenance-coverage':
		case 'premium-recurring-maintenance-opportunity': {
			const cadenceOptions = getSuggestedCadenceOptions(finding);
			const hasMultipleCadenceOptions = cadenceOptions.length > 1;
			return {
				recommendationId: finding.id,
				resolutionType: 'create_task',
				actionLabel: hasMultipleCadenceOptions
					? 'Choose reminder'
					: 'Create reminder',
				assetLabel: getAssetLabel(finding),
				sectionLabel: 'Maintenance',
				missingFields: ['recurring maintenance'],
				whyItMatters: finding.whyItMatters,
				whatToDo:
					hasMultipleCadenceOptions
						? 'Choose the recurring work to track, or create a custom recurring task for this system.'
						: 'Create a recurring maintenance task so this care stays visible on the property schedule.',
				fieldTargets: [],
				primaryActionLabel: hasMultipleCadenceOptions
					? 'Create custom task'
					: 'Create recurring task',
				primaryActionType: 'create_task',
				options: [
					...(
						hasMultipleCadenceOptions
							? cadenceOptions.map((cadence) => ({
								label: `Add ${cadence.label}`,
								description: cadence.intervalDays
									? `Suggested cadence: every ${cadence.intervalDays} days.`
									: 'Use this suggested recurring maintenance item.',
								actionType: 'create_task' as MaintleyFindingActionType,
								metadata: {
									selectedMaintenanceCadence: cadence,
								},
							}))
							: []
					),
					{
						label: 'Review maintenance history',
						description: 'Check the saved maintenance timeline before creating a reminder.',
						actionType: 'open_maintenance',
					},
				],
			};
		}
		case 'systems-missing-maintenance-history':
		case 'safety-systems-missing-maintenance-history':
		case 'baseline-maintenance-cadence-overdue':
			return {
				recommendationId: finding.id,
				resolutionType: 'create_history',
				actionLabel: 'Add history',
				assetLabel: getAssetLabel(finding),
				sectionLabel: 'Maintenance',
				missingFields: ['maintenance history'],
				whyItMatters: finding.whyItMatters,
				whatToDo:
					'Add a maintenance event or review the history so Maintley has a clearer timeline for this equipment.',
				fieldTargets: [],
				primaryActionLabel: 'Open maintenance history',
				primaryActionType: 'open_maintenance',
				options: [
					{
						label: 'Upload invoice',
						description: 'Use an invoice or inspection report to create a clearer record.',
						actionType: 'upload_document',
					},
				],
			};
		default:
			return undefined;
	}
};
