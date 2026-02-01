/**
 * Property-related types for the application
 * Centralized domain-specific type definitions
 */

export interface Property {
	id: string;
	groupId: string;
	userId?: string;
	title: string;
	slug: string;
	image?: string;
	owner?: string;
	administrators?: string[];
	viewers?: string[];
	address?: string;
	propertyType?: 'Single Family' | 'Multi-Family' | 'Commercial';
	bedrooms?: number;
	bathrooms?: number;
	units?: Array<{ name: string; occupants?: any[]; deviceIds?: string[] }>;
	hasSuites?: boolean;
	suites?: Array<{ name: string; occupants?: any[]; deviceIds?: string[] }>;
	deviceIds?: string[];
	notes?: string;
	taskHistory?: Array<{ date: string; description: string }>;
	maintenanceHistory?: Array<{ date: string; description: string }>;
	isFavorite?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface PropertyGroup {
	id: string;
	userId?: string;
	name: string;
	isEditingName?: boolean;
	properties?: Property[];
	createdAt?: string;
	updatedAt?: string;
}

export interface Device {
	type: string;
	brand: string;
	model: string;
	installationDate: string;
}

export type PropertyType = 'Single Family' | 'Multi-Family' | 'Commercial';
