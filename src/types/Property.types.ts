/**
 * Property-related types for the application
 * Centralized domain-specific type definitions
 */

import { SharePermission } from '../constants/roles';

export interface Property {
	id: string;
	groupId?: string;
	userId: string; // Owner of the property
	title: string;
	slug: string;
	image?: string;
	owner?: string;
	coOwners?: string[]; // Additional owners with full ownership rights
	administrators?: string[]; // Property managers/helpers
	viewers?: string[]; // Read-only access
	address?: string;
	propertyType?: 'Single Family' | 'Multi-Family' | 'Commercial';
	bedrooms?: number;
	bathrooms?: number;
	units?: Array<{ name: string; occupants?: any[]; deviceIds?: string[] }>; // For multi-family properties
	hasSuites?: boolean; // For commercial properties
	suites?: Array<{ name: string; occupants?: any[]; deviceIds?: string[] }>; // For commercial properties
	deviceIds?: string[]; // Device IDs for property-level devices
	notes?: string;
	taskHistory?: Array<{ date: string; description: string }>;
	maintenanceHistory?: Array<{ date: string; description: string }>; // Alias for taskHistory
	isRental?: boolean;
	isFavorite?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface PropertyGroup {
	id: string;
	userId: string;
	accountId?: string;
	name: string;
	isEditingName?: boolean;
	properties?: Property[];
	createdAt?: string;
	updatedAt?: string;
}

export interface PropertyGroupMembership {
	id: string;
	accountId: string;
	groupId: string;
	propertyId: string;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface PropertyShare {
	id: string;
	propertyId: string;
	ownerId: string; // User who owns the property
	sharedWithUserId: string; // User who has access
	sharedWithEmail: string; // Email of user who has access
	sharedWithFirstName?: string; // First name of user who has access
	sharedWithLastName?: string; // Last name of user who has access
	permission: SharePermission; // 'co-owner', 'admin' or 'viewer'
	createdAt: string;
	updatedAt: string;
}

export interface Unit {
	id: string;
	userId: string; // Owner of the unit
	propertyId: string; // Changed from suiteId - units belong to properties (multifamily homes)
	name: string;
	floor: number;
	area: number;
	isOccupied: boolean;
	deviceIds?: string[]; // Device IDs for devices in this unit
	occupants?: Array<{
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		leaseStart?: string;
		leaseEnd?: string;
	}>; // Renamed from occupantName to occupants
	taskHistory?: Array<{
		taskId: string;
		date: string;
		title: string;
		status: string;
	}>; // Maintenance/task history for this unit
	createdAt?: string;
	updatedAt?: string;
}

export interface Suite {
	id: string;
	userId: string; // Owner of the suite
	propertyId: string;
	name: string;
	floor: number;
	bedrooms: number;
	bathrooms: number;
	area: number;
	isOccupied: boolean;
	deviceIds?: string[]; // Device IDs for devices in this suite
	occupants?: Array<{
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
	}>; // Renamed from occupantName to occupants
	taskHistory?: Array<{
		taskId: string;
		date: string;
		title: string;
		status: string;
	}>; // Maintenance/task history for this suite
	createdAt?: string;
	updatedAt?: string;
}
export interface Device {
	id: string;
	userId: string; // Owner of the device
	type: string; // 'HVAC', 'Plumbing', 'Electrical', 'Appliance', 'Security', 'Other'
	brand?: string;
	model?: string;
	serialNumber?: string;
	installationDate?: string;
	location: {
		propertyId: string;
		unitId?: string; // Optional: for device in a specific unit
		suiteId?: string; // Optional: for device in a specific suite
	};
	status?: 'Active' | 'Maintenance' | 'Broken' | 'Decommissioned'; // Device status
	maintenanceHistory?: Array<{
		date: string;
		description: string;
		taskId?: string;
	}>;
	files?: Array<{
		name: string;
		url: string;
		size: number;
		type: string;
	}>;
	notes?: string;
	createdAt?: string;
	updatedAt?: string;
}

export type PropertyType = 'Single Family' | 'Multi-Family' | 'Commercial';
