export const PROPERTY_SPACE_TYPES = [
	'interior',
	'utility',
	'storage',
	'exterior',
	'grounds',
	'amenity',
	'other',
] as const;

export type PropertySpaceType = (typeof PROPERTY_SPACE_TYPES)[number];

export type PropertySpaceSource =
	| 'manual'
	| 'property_profile'
	| 'setup_assistant'
	| 'document_review'
	| 'intelligence_review'
	| 'migration';

export interface PropertySpace {
	id: string;
	accountId: string;
	propertyId: string;
	name: string;
	type: PropertySpaceType;
	notes?: string;
	sortOrder?: number;
	generationKey?: string;
	isArchived: boolean;
	source: PropertySpaceSource;
	createdBy: string;
	updatedBy: string;
	createdAt: string;
	updatedAt: string;
}

export interface PropertySpaceDraft {
	name: string;
	type: PropertySpaceType;
	notes?: string;
	sortOrder?: number;
}
