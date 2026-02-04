/**
 * Contractor Types
 * Represents contractors/vendors used for property maintenance
 */

export type ContractorCategory =
	| 'Landscaper'
	| 'Contractor'
	| 'Pest Control'
	| 'Plumber'
	| 'Electrician'
	| 'HVAC'
	| 'Roofer'
	| 'Painter'
	| 'Cleaning Service'
	| 'Handyman'
	| 'Other';

export interface Contractor {
	id: string;
	propertyId: string;
	name: string; // Contact person name
	company: string; // Company name
	category: ContractorCategory;
	phone: string;
	address?: string;
	email?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
	userId: string; // Property owner
}

export interface CreateContractorInput {
	propertyId: string;
	name: string;
	company: string;
	category: ContractorCategory;
	phone: string;
	address?: string;
	email?: string;
	notes?: string;
}

export interface UpdateContractorInput {
	id: string;
	name?: string;
	company?: string;
	category?: ContractorCategory;
	phone?: string;
	address?: string;
	email?: string;
	notes?: string;
}
