import { Asset, Device, Property } from '../types/Property.types';
import { Task } from '../types/Task.types';

export type MaintleyFindingCategory =
	| 'Overdue Work'
	| 'Maintenance Opportunities'
	| 'Missing Information';

export type MaintleyFindingSeverity = 'low' | 'medium' | 'high';

export type MaintleyFindingPriority = 'low' | 'medium' | 'high';

export type MaintleyPlanId =
	| 'homeowner'
	| 'homeowner_plus'
	| 'property'
	| 'portfolio'
	| 'guest'
	| 'team'
	| 'tenant';

export type MaintleyRequiredPlan =
	| 'homeowner'
	| 'homeowner_plus'
	| 'property'
	| 'portfolio';

export type MaintleyCapability = 'recurring_tasks';

export type MaintleyFindingActionType =
	| 'edit_property'
	| 'add_asset'
	| 'edit_asset'
	| 'open_assets'
	| 'add_system' // legacy alias
	| 'edit_system' // legacy alias
	| 'open_systems' // legacy alias
	| 'upload_document'
	| 'create_task'
	| 'open_task'
	| 'open_maintenance'
	| 'review_setup'
	| 'view_plan_options';

export interface MaintleyFinding {
	id: string;
	ruleId: string;
	propertyId: string;
	affectedAssetIds?: string[];
	affectedSystemIds: string[];
	category: MaintleyFindingCategory;
	severity: MaintleyFindingSeverity;
	priority: MaintleyFindingPriority;
	title: string;
	description: string;
	whyItMatters: string;
	suggestedActionLabel: string;
	suggestedActionType: MaintleyFindingActionType;
	requiredPlan: MaintleyRequiredPlan;
	requiredCapabilities: MaintleyCapability[];
	baselineVersion?: string;
	metadata: Record<string, unknown>;
	createdAt: string;
}

export interface MaintleyIntelligenceInput {
	property: Property;
	assets?: Asset[];
	systems: Device[];
	tasks: Task[];
	maintenanceHistory: any[];
	documents?: unknown[];
	files?: unknown[];
	planId?: string;
	capabilities?: Partial<Record<MaintleyCapability, boolean>>;
	currentDate?: Date | string;
	createdAt?: string;
}

export interface MaintleyIntelligenceContext {
	property: Property;
	assets?: Asset[];
	systems: Device[];
	tasks: Task[];
	maintenanceHistory: any[];
	documents: unknown[];
	files: unknown[];
	planId?: string;
	capabilities: Partial<Record<MaintleyCapability, boolean>>;
	currentDate: Date;
	baselineVersion: string;
	createdAt: string;
}

export interface MaintleyIntelligenceResult {
	propertyId: string;
	generatedAt: string;
	baselineVersion: string;
	assetsReviewed?: number;
	systemsReviewed: number;
	tasksReviewed: number;
	summary: {
		total: number;
		high: number;
		medium: number;
		low: number;
		byCategory: Record<string, number>;
	};
	findings: MaintleyFinding[];
}

export interface MaintleyIntelligenceRule {
	id: string;
	evaluate: (context: MaintleyIntelligenceContext) => MaintleyFinding[];
}
