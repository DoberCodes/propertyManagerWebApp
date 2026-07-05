import { runMaintleyIntelligence } from '../engine';
import {
	MaintleyCapability,
	MaintleyFinding,
	MaintleyIntelligenceInput,
} from '../types';
import { getAssetDisplayName } from '../rules/helpers';
import { getDeviceKnowledgePack } from '../../utils/systemTypes';
import { Device } from '../../types/Property.types';

export type PropertyAuditCategoryId =
	| 'maintenance_coverage'
	| 'equipment_records'
	| 'documentation'
	| 'lifecycle_planning'
	| 'property_completeness';

export interface PropertyAuditCategory {
	id: PropertyAuditCategoryId;
	title: string;
	description: string;
	findings: MaintleyFinding[];
	summary: {
		total: number;
		high: number;
		medium: number;
		low: number;
	};
}

export interface PropertyAuditAssetCategorySummary {
	id: PropertyAuditCategoryId;
	title: string;
	total: number;
	high: number;
	medium: number;
	low: number;
}

export interface PropertyAuditAssetCategoryGroup {
	id: PropertyAuditCategoryId;
	title: string;
	findings: MaintleyFinding[];
	summary: {
		total: number;
		high: number;
		medium: number;
		low: number;
	};
}

export interface PropertyAuditAssetReview {
	assetId: string;
	assetTitle: string;
	knowledgePack?: string;
	findings: MaintleyFinding[];
	summary: {
		total: number;
		high: number;
		medium: number;
		low: number;
	};
	categorySummaries: PropertyAuditAssetCategorySummary[];
	categoryGroups: PropertyAuditAssetCategoryGroup[];
}

export interface PropertyAuditResult {
	propertyId: string;
	generatedAt: string;
	baselineVersion: string;
	systemsReviewed: number;
	tasksReviewed: number;
	summary: {
		total: number;
		high: number;
		medium: number;
		low: number;
	};
	categories: PropertyAuditCategory[];
	assetReviews: PropertyAuditAssetReview[];
	findings: MaintleyFinding[];
}

export interface PropertyAuditOptions {
	planId?: string;
	capabilities?: Partial<Record<MaintleyCapability, boolean>>;
}

const CATEGORY_ORDER: PropertyAuditCategoryId[] = [
	'maintenance_coverage',
	'equipment_records',
	'documentation',
	'lifecycle_planning',
	'property_completeness',
];

const CATEGORY_DETAILS: Record<
	PropertyAuditCategoryId,
	Pick<PropertyAuditCategory, 'title' | 'description'>
> = {
	maintenance_coverage: {
		title: 'Maintenance Coverage',
		description:
			'Recurring care, overdue work, and saved maintenance history across the property.',
	},
	equipment_records: {
		title: 'Equipment Records',
		description:
			'Important system and appliance details that make future maintenance easier to manage.',
	},
	documentation: {
		title: 'Documentation',
		description:
			'Supporting records such as manuals, warranties, receipts, photos, and contractor documents.',
	},
	lifecycle_planning: {
		title: 'Lifecycle Planning',
		description:
			'Age, warranty, and baseline-care context that can support longer-term planning.',
	},
	property_completeness: {
		title: 'Property Completeness',
		description:
			'Property-level record details that help Maintley understand and organize the property.',
	},
};

const ASSET_REVIEW_CATEGORY_TITLES: Record<PropertyAuditCategoryId, string> = {
	maintenance_coverage: 'Maintenance',
	equipment_records: 'Equipment Records',
	documentation: 'Documentation',
	lifecycle_planning: 'Lifecycle',
	property_completeness: 'General Property',
};

const RULE_CATEGORY_MAP: Record<string, PropertyAuditCategoryId> = {
	'overdue-tasks-exist': 'maintenance_coverage',
	'safety-systems-missing-maintenance-history': 'maintenance_coverage',
	'systems-missing-actionable-maintenance-coverage': 'maintenance_coverage',
	'baseline-maintenance-cadence-overdue': 'maintenance_coverage',
	'systems-missing-maintenance-history': 'maintenance_coverage',
	'systems-missing-important-identification': 'equipment_records',
	'knowledge-pack-record-details-missing': 'equipment_records',
	'major-systems-missing-install-dates': 'equipment_records',
};

const getAuditCategoryId = (
	finding: MaintleyFinding,
): PropertyAuditCategoryId => {
	const mappedCategory = RULE_CATEGORY_MAP[finding.ruleId];
	if (mappedCategory) return mappedCategory;

	switch (finding.category) {
		case 'Maintenance Opportunities':
		case 'Overdue Work':
			return 'maintenance_coverage';
		case 'Missing Information':
		default:
			return 'equipment_records';
	}
};

const summarizeFindings = (findings: MaintleyFinding[]) => ({
	total: findings.length,
	high: findings.filter((finding) => finding.severity === 'high').length,
	medium: findings.filter((finding) => finding.severity === 'medium').length,
	low: findings.filter((finding) => finding.severity === 'low').length,
});

export const groupFindingsForPropertyAudit = (
	findings: MaintleyFinding[],
): PropertyAuditCategory[] => {
	const groupedFindings = new Map<PropertyAuditCategoryId, MaintleyFinding[]>(
		CATEGORY_ORDER.map((categoryId) => [categoryId, []]),
	);

	findings.forEach((finding) => {
		groupedFindings.get(getAuditCategoryId(finding))?.push(finding);
	});

	return CATEGORY_ORDER.map((categoryId) => {
		const categoryFindings = groupedFindings.get(categoryId) || [];
		return {
			id: categoryId,
			...CATEGORY_DETAILS[categoryId],
			findings: categoryFindings,
			summary: summarizeFindings(categoryFindings),
		};
	});
};

const getPrimaryAffectedSystemId = (finding: MaintleyFinding): string => {
	const metadataSystemId = String(finding.metadata.systemId || '').trim();
	return metadataSystemId || finding.affectedSystemIds?.[0] || '';
};

const getPropertyLevelAssetReview = (): PropertyAuditAssetReview => ({
	assetId: 'property',
	assetTitle: 'General Property',
	findings: [],
	summary: summarizeFindings([]),
	categorySummaries: [],
	categoryGroups: [],
});

export const groupAssetReviewsForPropertyAudit = (
	findings: MaintleyFinding[],
	systems: Device[],
): PropertyAuditAssetReview[] => {
	const systemLookup = new Map(systems.map((system) => [system.id, system]));
	const groupedReviews = new Map<string, PropertyAuditAssetReview>();

	findings.forEach((finding) => {
		const systemId = getPrimaryAffectedSystemId(finding);
		const system = systemId ? systemLookup.get(systemId) : undefined;
		const assetId = system?.id || systemId || 'property';
		const existingReview =
			groupedReviews.get(assetId) ||
			(system
				? {
					assetId,
					assetTitle: getAssetDisplayName(system),
					knowledgePack: getDeviceKnowledgePack(system),
					findings: [],
					summary: summarizeFindings([]),
					categorySummaries: [],
					categoryGroups: [],
				}
				: getPropertyLevelAssetReview());

		existingReview.findings.push(finding);
		groupedReviews.set(assetId, existingReview);
	});

	return Array.from(groupedReviews.values())
		.map((review) => {
			const categoryGroups = CATEGORY_ORDER.map((categoryId) => {
				const categoryFindings = review.findings.filter(
					(finding) => getAuditCategoryId(finding) === categoryId,
				);
				return {
					id: categoryId,
					title: ASSET_REVIEW_CATEGORY_TITLES[categoryId],
					findings: categoryFindings,
					summary: summarizeFindings(categoryFindings),
				};
			}).filter((group) => group.summary.total > 0);
			const categorySummaries = categoryGroups.map((group) => ({
				id: group.id,
				title: group.title,
				...group.summary,
			}));

			return {
				...review,
				summary: summarizeFindings(review.findings),
				categorySummaries,
				categoryGroups,
			};
		})
		.sort(
			(first, second) =>
				second.summary.high - first.summary.high ||
				second.summary.total - first.summary.total ||
				first.assetTitle.localeCompare(second.assetTitle),
		);
};

export const runPropertyAudit = (
	input: MaintleyIntelligenceInput,
	options: PropertyAuditOptions = {},
): PropertyAuditResult => {
	const result = runMaintleyIntelligence({
		...input,
		planId: options.planId ?? input.planId,
		capabilities: options.capabilities ?? input.capabilities,
	});

	return {
		propertyId: result.propertyId,
		generatedAt: result.generatedAt,
		baselineVersion: result.baselineVersion,
		systemsReviewed: result.systemsReviewed,
		tasksReviewed: result.tasksReviewed,
		summary: summarizeFindings(result.findings),
		categories: groupFindingsForPropertyAudit(result.findings),
		assetReviews: groupAssetReviewsForPropertyAudit(result.findings, input.systems),
		findings: result.findings,
	};
};
