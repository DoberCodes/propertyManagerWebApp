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
	MaintleyCapability,
	MaintleyRequiredPlan,
} from '../intelligence/types';

export type PropertyScanCategory =
	| MaintleyFindingCategory
	| 'Documentation Gaps'
	| 'Suggested Next Steps';

export type PropertyScanSeverity = MaintleyFindingSeverity;

export type PropertyScanPlanId =
	| 'homeowner'
	| 'homeowner_plus'
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
	title: string;
	description: string;
	reason: string;
	suggestedActionLabel: string;
	suggestedActionType: PropertyScanActionType;
	requiredPlan?: PropertyScanRequiredPlan;
	requiredCapabilities?: MaintleyCapability[];
	baselineVersion?: string;
	recommendationType?: PropertyScanRecommendationType;
	metadata?: Record<string, unknown>;
	createdAt: string;
	status: PropertyScanRecommendationStatus;
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
	finding: Pick<MaintleyFinding, 'ruleId' | 'requiredPlan'>,
): PropertyScanRecommendationType => {
	if (finding.ruleId === 'premium-recurring-maintenance-opportunity') {
		return 'premium_opportunity';
	}
	return finding.requiredPlan === 'homeowner' ? 'record' : 'feature';
};

const getRelatedTaskIdsFromFinding = (finding: MaintleyFinding): string[] => {
	const affectedTaskIds = finding.metadata.affectedTaskIds;
	if (Array.isArray(affectedTaskIds)) {
		return affectedTaskIds.map(String).filter(Boolean);
	}
	const taskId = String(finding.metadata.taskId || '');
	return taskId ? [taskId] : [];
};

const findingToRecommendation = (
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
		title: finding.title,
		description: finding.whyItMatters,
		reason: finding.description,
		suggestedActionLabel: finding.suggestedActionLabel,
		suggestedActionType: finding.suggestedActionType,
		requiredPlan: finding.requiredPlan,
		requiredCapabilities: finding.requiredCapabilities,
		baselineVersion: finding.baselineVersion,
		recommendationType: getRecommendationType(finding),
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

export const canAccessPropertyScanRecommendation = (
	recommendation: Pick<
		PropertyScanRecommendation,
		'id' | 'requiredPlan' | 'ruleId'
	>,
	planId?: string,
): boolean =>
	canAccessMaintleyFinding(
		{
			requiredPlan:
				recommendation.requiredPlan ||
				(recommendation.id.includes('recurring-maintenance') ||
				recommendation.id.includes(':system-recurring-task:') ||
				recommendation.ruleId ===
					'systems-missing-actionable-maintenance-coverage'
					? 'homeowner_plus'
					: 'homeowner'),
		},
		planId,
	);

export const shouldShowPropertyScanRecommendationForPlan = (
	recommendation: Pick<
		PropertyScanRecommendation,
		'id' | 'requiredPlan' | 'recommendationType' | 'ruleId'
	>,
	planId?: string,
): boolean => {
	const isAvailable = canAccessPropertyScanRecommendation(recommendation, planId);
	if (recommendation.recommendationType === 'premium_opportunity') {
		return !isAvailable;
	}
	return isAvailable;
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
	options: { planId?: string; includePremiumOpportunity?: boolean } = {},
): PropertyScanRecommendation[] =>
	selectQuickScanFindings(
		recommendations
			.filter((recommendation) => recommendation.status === 'active')
			.map(recommendationToFinding),
		{
			planId: options.planId,
			limit,
			includePremiumOpportunity: options.includePremiumOpportunity,
		},
	).map((finding) => findingToRecommendation(finding));

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
		findingToRecommendation(
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
