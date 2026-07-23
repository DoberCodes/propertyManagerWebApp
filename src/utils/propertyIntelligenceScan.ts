import { Device, Property } from '../types/Property.types';
import { Task } from '../types/Task.types';
import {
	runMaintleyIntelligence,
} from '../intelligence/engine';
import {
	canAccessMaintleyFinding,
} from '../intelligence/planFilter';
import {
	QUICK_SCAN_FINDING_LIMIT,
	selectQuickScanFindings,
} from '../intelligence/consumers/quickScan';
import {
	MaintleyFinding,
	MaintleyFindingActionType,
	MaintleyFindingCategory,
	MaintleyFindingPriority,
	MaintleyFindingSeverity,
	MaintleyFindingSource,
	MaintleyCapability,
	MaintleyRequiredPlan,
} from '../intelligence/types';
import {
	getRecommendationResolutionPlan,
	RecommendationResolutionPlan,
} from '../intelligence/resolutionEngine';

export type PropertyScanCategory =
	| MaintleyFindingCategory
	| 'Documentation Gaps'
	| 'Suggested Next Steps';

export type PropertyScanSeverity = MaintleyFindingSeverity;

export type PropertyScanPlanId =
	| 'homeowner'
	| 'homeowner_plus'
	| 'multi_homeowner'
	| 'property'
	| 'portfolio'
	| 'guest'
	| 'team'
	| 'tenant';

export type PropertyScanRequiredPlan = MaintleyRequiredPlan;

export type PropertyScanRecommendationType =
	| 'record'
	| 'feature'
	| 'premium_opportunity';

export type PropertyScanActionType = MaintleyFindingActionType;

export type PropertyScanRecommendationStatus =
	| 'active'
	| 'resolved'
	| 'dismissed';

export interface PropertyScanRecommendation {
	id: string;
	ruleId?: string;
	propertyId: string;
	systemId?: string;
	affectedSystemIds?: string[];
	relatedSystemIds?: string[];
	relatedTaskIds?: string[];
	category: PropertyScanCategory;
	severity: PropertyScanSeverity;
	priority?: MaintleyFindingPriority;
	source?: MaintleyFindingSource;
	title: string;
	description: string;
	reason: string;
	suggestedActionLabel: string;
	suggestedActionType: PropertyScanActionType;
	requiredPlan?: PropertyScanRequiredPlan;
	requiredCapabilities?: MaintleyCapability[];
	baselineVersion?: string;
	recommendationType?: PropertyScanRecommendationType;
	resolution?: RecommendationResolutionPlan;
	metadata?: Record<string, unknown>;
	createdAt: string;
	status: PropertyScanRecommendationStatus;
}

export interface PropertyScanPremiumPreview {
	sources: MaintleyFindingSource[];
	examples: string[];
	requiredPlan: 'homeowner_plus';
}

export interface PropertyScanInput {
	property: Property;
	systems: Device[];
	tasks: Task[];
	maintenanceHistory: any[];
	dismissedRecommendationIds?: string[];
	createdAt?: string;
}

export interface PropertyScanResult {
	propertyId: string;
	createdAt: string;
	recommendations: PropertyScanRecommendation[];
	activeRecommendations: PropertyScanRecommendation[];
	summary: {
		total: number;
		active: number;
		dismissed: number;
		high: number;
		medium: number;
		low: number;
		overdue: number;
	};
}

export const QUICK_PROPERTY_SCAN_LIMIT = QUICK_SCAN_FINDING_LIMIT;

const getRecommendationType = (
	finding: Pick<MaintleyFinding, 'ruleId' | 'source'>,
): PropertyScanRecommendationType => {
	if (finding.ruleId === 'premium-recurring-maintenance-opportunity') {
		return 'premium_opportunity';
	}
	return finding.source === 'property_memory' ? 'record' : 'feature';
};

const getRelatedTaskIdsFromFinding = (finding: MaintleyFinding): string[] => {
	const affectedTaskIds = finding.metadata.affectedTaskIds;
	if (Array.isArray(affectedTaskIds)) {
		return affectedTaskIds.map(String).filter(Boolean);
	}
	const taskId = String(finding.metadata.taskId || '');
	return taskId ? [taskId] : [];
};

export const maintleyFindingToPropertyScanRecommendation = (
	finding: MaintleyFinding,
	status: PropertyScanRecommendationStatus = 'active',
): PropertyScanRecommendation => {
	const relatedSystemIds = finding.affectedSystemIds;

	return {
		id: finding.id,
		ruleId: finding.ruleId,
		propertyId: finding.propertyId,
		systemId: relatedSystemIds.length === 1 ? relatedSystemIds[0] : undefined,
		affectedSystemIds: relatedSystemIds,
		relatedSystemIds,
		relatedTaskIds: getRelatedTaskIdsFromFinding(finding),
		category: finding.category,
		severity: finding.severity,
		priority: finding.priority,
		source: finding.source,
		title: finding.title,
		description: finding.whyItMatters,
		reason: finding.description,
		suggestedActionLabel: finding.suggestedActionLabel,
		suggestedActionType: finding.suggestedActionType,
		requiredPlan: finding.requiredPlan,
		requiredCapabilities: finding.requiredCapabilities,
		baselineVersion: finding.baselineVersion,
		recommendationType: getRecommendationType(finding),
		resolution: getRecommendationResolutionPlan(finding),
		metadata: finding.metadata,
		createdAt: finding.createdAt,
		status,
	};
};

const recommendationToFinding = (
	recommendation: PropertyScanRecommendation,
): MaintleyFinding => ({
	id: recommendation.id,
	ruleId: recommendation.ruleId || recommendation.id,
	propertyId: recommendation.propertyId,
	affectedSystemIds:
		recommendation.affectedSystemIds ||
		recommendation.relatedSystemIds ||
		(recommendation.systemId ? [recommendation.systemId] : []),
	category:
		recommendation.category === 'Documentation Gaps' ||
		recommendation.category === 'Suggested Next Steps'
			? 'Missing Information'
			: recommendation.category,
	severity: recommendation.severity,
	priority: recommendation.priority || recommendation.severity,
	source: recommendation.source || 'property_memory',
	title: recommendation.title,
	description: recommendation.reason,
	whyItMatters: recommendation.description,
	suggestedActionLabel: recommendation.suggestedActionLabel,
	suggestedActionType: recommendation.suggestedActionType,
	requiredPlan: recommendation.requiredPlan || 'homeowner',
	requiredCapabilities: recommendation.requiredCapabilities || [],
	baselineVersion: recommendation.baselineVersion,
	metadata: {
		...(recommendation.metadata || {}),
		affectedTaskIds: recommendation.relatedTaskIds || [],
	},
	createdAt: recommendation.createdAt,
});

const getLegacyRequiredPlanForRecommendation = (
	recommendation: Pick<
		PropertyScanRecommendation,
		'id' | 'requiredPlan' | 'ruleId'
	>,
): PropertyScanRequiredPlan =>
	recommendation.requiredPlan ||
	(recommendation.id.includes('recurring-maintenance') ||
	recommendation.id.includes(':system-recurring-task:') ||
	recommendation.ruleId === 'systems-missing-actionable-maintenance-coverage'
		? 'homeowner_plus'
		: 'homeowner');

export const canAccessPropertyScanRecommendation = (
	recommendation: Pick<
		PropertyScanRecommendation,
		'id' | 'requiredPlan' | 'ruleId' | 'source'
	>,
	planId?: string,
): boolean =>
	canAccessMaintleyFinding(
		{
			source: recommendation.source,
			requiredPlan: recommendation.source
				? undefined
				: getLegacyRequiredPlanForRecommendation(recommendation),
		},
		planId,
	);

export const shouldShowPropertyScanRecommendationForPlan = (
	recommendation: Pick<
		PropertyScanRecommendation,
		'id' | 'requiredPlan' | 'recommendationType' | 'ruleId' | 'source'
	>,
	planId?: string,
): boolean => {
	const isAvailable = canAccessPropertyScanRecommendation(recommendation, planId);
	if (recommendation.recommendationType === 'premium_opportunity') {
		return !isAvailable;
	}
	return isAvailable;
};

const getPremiumPreviewExample = (
	recommendation: PropertyScanRecommendation,
): string => {
	switch (recommendation.ruleId) {
		case 'knowledge-pack-record-details-missing':
			return 'Equipment details such as filter sizes';
		case 'systems-missing-actionable-maintenance-coverage':
			return 'Recommended recurring maintenance';
		case 'baseline-maintenance-cadence-overdue':
			return 'Equipment-specific maintenance guidance';
		default:
			switch (recommendation.source) {
				case 'history_inference':
					return 'Patterns in your maintenance history';
				case 'context':
					return 'Seasonal and property-context guidance';
				case 'knowledge_pack':
					return 'Equipment-specific maintenance guidance';
				default:
					return 'Additional Maintley Intelligence guidance';
			}
	}
};

export const getQuickPropertyScanPremiumPreview = (
	recommendations: PropertyScanRecommendation[],
	planId?: string,
): PropertyScanPremiumPreview | null => {
	const lockedRecommendations = recommendations.filter(
		(recommendation) =>
			recommendation.status === 'active' &&
			recommendation.source !== 'property_memory' &&
			!canAccessPropertyScanRecommendation(recommendation, planId),
	);

	if (lockedRecommendations.length === 0) return null;

	return {
		sources: Array.from(
			new Set(
				lockedRecommendations
					.map((recommendation) => recommendation.source)
					.filter((source): source is MaintleyFindingSource => Boolean(source)),
			),
		),
		examples: Array.from(
			new Set(lockedRecommendations.map(getPremiumPreviewExample)),
		).slice(0, 3),
		requiredPlan: 'homeowner_plus',
	};
};

export const getPropertyScanRecommendationScore = (
	recommendation: Pick<PropertyScanRecommendation, 'severity'>,
): number => {
	switch (recommendation.severity) {
		case 'high':
			return 10;
		case 'medium':
			return 5;
		case 'low':
		default:
			return 1;
	}
};

export const isQuickPropertyScanRecommendation = (
	recommendation: PropertyScanRecommendation,
): boolean =>
	recommendation.status === 'active' &&
	(recommendation.priority || recommendation.severity) !== 'low';

export const getQuickPropertyScanRecommendations = (
	recommendations: PropertyScanRecommendation[],
	limit = QUICK_PROPERTY_SCAN_LIMIT,
	options: { planId?: string } = {},
): PropertyScanRecommendation[] =>
	selectQuickScanFindings(
		recommendations
			.filter((recommendation) => recommendation.status === 'active')
			.map(recommendationToFinding),
		{
			planId: options.planId,
			limit,
		},
	).map((finding) => maintleyFindingToPropertyScanRecommendation(finding));

export const runPropertyScanV1 = ({
	property,
	systems,
	tasks,
	maintenanceHistory,
	dismissedRecommendationIds = [],
	createdAt = new Date().toISOString(),
}: PropertyScanInput): PropertyScanResult => {
	const dismissedIds = new Set(dismissedRecommendationIds);
	const result = runMaintleyIntelligence({
		property,
		systems,
		tasks,
		maintenanceHistory,
		createdAt,
	});
	const recommendations = result.findings.map((finding) =>
		maintleyFindingToPropertyScanRecommendation(
			finding,
			dismissedIds.has(finding.id) ? 'dismissed' : 'active',
		),
	);
	const activeRecommendations = recommendations.filter(
		(recommendation) => recommendation.status === 'active',
	);

	return {
		propertyId: property.id,
		createdAt: result.generatedAt,
		recommendations,
		activeRecommendations,
		summary: {
			total: recommendations.length,
			active: activeRecommendations.length,
			dismissed: recommendations.length - activeRecommendations.length,
			high: activeRecommendations.filter((item) => item.severity === 'high').length,
			medium: activeRecommendations.filter((item) => item.severity === 'medium').length,
			low: activeRecommendations.filter((item) => item.severity === 'low').length,
			overdue: activeRecommendations.filter((item) => item.category === 'Overdue Work')
				.length,
		},
	};
};
