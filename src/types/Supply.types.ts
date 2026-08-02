export const PROPERTY_SUPPLY_TYPES = [
	'filter',
	'paint_and_finish',
	'lawn_and_garden',
	'pool_and_spa',
	'electrical',
	'plumbing',
	'hardware',
	'cleaning',
	'other',
] as const;

export type PropertySupplyType = (typeof PROPERTY_SUPPLY_TYPES)[number];

export type PropertySupplySource =
	| 'manual'
	| 'document_review'
	| 'intelligence_review'
	| 'migration';

export interface PropertySupply {
	id: string;
	accountId: string;
	propertyId: string;
	name: string;
	type: PropertySupplyType;
	manufacturer?: string;
	modelOrSku?: string;
	notes?: string;
	isArchived: boolean;
	source: PropertySupplySource;
	createdBy: string;
	updatedBy: string;
	createdAt: string;
	updatedAt: string;
}

export interface PropertySupplyDraft {
	name: string;
	type: PropertySupplyType;
	manufacturer?: string;
	modelOrSku?: string;
	notes?: string;
}
