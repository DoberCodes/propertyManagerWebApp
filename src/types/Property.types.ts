/**
 * Property-related types for the application
 * Centralized domain-specific type definitions
 */

import { SharePermission } from '../constants/roles';
import { SuggestedSystemId } from '../utils/suggestedMaintenance';
import type {
	PropertyKnowledgeProvenance,
	PropertyKnowledgeSuggestion,
} from './PropertyKnowledge.types';

export type PropertySetupAssistantItemStatus =
	| 'present'
	| 'not_present'
	| 'unknown';

export interface PropertySetupAssistantItemState {
	status: PropertySetupAssistantItemStatus;
	deviceId?: string;
	taskIds?: string[];
	selectedSuggestedTaskIds?: string[];
	recreateSuggestedTaskIds?: string[];
	reviewedAt?: string;
	updatedAt?: string;
}

export interface PropertySetupAssistantState {
	items?: Partial<
		Record<SuggestedSystemId, PropertySetupAssistantItemState>
	>;
	dismissedAt?: string;
	completedAt?: string;
	updatedAt?: string;
}

export type PropertyDocumentCategory = 'manual' | 'warranty' | 'other';
export type PropertyDocumentType =
	| 'manual'
	| 'invoice'
	| 'warranty'
	| 'receipt'
	| 'inspection_report'
	| 'contractor_document'
	| 'unknown'
	| 'other';

export type PropertyDocumentAcquisitionStatus =
	| 'not_reviewed'
	| 'pending_review'
	| 'reviewed'
	| 'applied';

export interface PropertyDocumentLinks {
	assetIds?: string[];
	taskIds?: string[];
	maintenanceEventIds?: string[];
	contractorIds?: string[];
	warrantyIds?: string[];
	partIds?: string[];
}

export interface PropertyDocument {
	id: string;
	propertyId?: string;
	name: string;
	url: string;
	fileName?: string;
	fileUrl?: string;
	size: number;
	type: string;
	category: PropertyDocumentCategory;
	documentType?: PropertyDocumentType;
	uploadedBy?: string;
	links?: PropertyDocumentLinks;
	assignedDeviceId?: string;
	assignedTaskId?: string;
	assignedTaskStatus?: string;
	acquisitionStatus?: PropertyDocumentAcquisitionStatus;
	extractedKnowledgeSuggestionIds?: string[];
	uploadedAt: string;
	storagePath?: string;
}

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
	setupAssistant?: PropertySetupAssistantState;
	documents?: PropertyDocument[];
	knowledgeSuggestions?: PropertyKnowledgeSuggestion[];
	propertyKnowledgeProvenance?: Record<string, PropertyKnowledgeProvenance[]>;
	createdAt?: string;
	updatedAt?: string;
}

export interface PropertyGroup {
	id: string;
	userId: string;
	accountId?: string;
	name: string;
	description?: string;
	sortOrder?: number;
	defaultCollapsed?: boolean;
	groupIconKey?: PropertyGroupIconKey;
	groupIconColor?: string;
	groupIconBgColor?: string;
	isEditingName?: boolean;
	properties?: Property[];
	createdAt?: string;
	updatedAt?: string;
}

export type PropertyGroupIconKey =
	| 'house'
	| 'building'
	| 'city'
	| 'warehouse'
	| 'store'
	| 'hotel'
	| 'industry';

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
export interface DeviceServiceItem {
	id: string;
	category: string;
	name: string;
	details?: string;
	partNumber?: string;
	size?: string;
	manufacturer?: string;
	material?: string;
	voltage?: string;
	mervRating?: string;
	compatibility?: string;
	replacementInterval?: string;
	notes?: string;
}

export type AssetCategory =
	| 'hvac'
	| 'plumbing'
	| 'kitchen'
	| 'safety'
	| 'structural'
	| 'exterior'
	| 'transport'
	| 'outdoor_equipment'
	| 'utility'
	| 'water_management'
	| 'pool_spa'
	| 'energy'
	| 'other';

export interface Device {
	id: string;
	userId: string; // Owner of the device
	type: string; // Homeowner-facing display type retained on the record
	assetType?: string; // Canonical internal type for maintainable assets (e.g. refrigerator, heat_pump)
	assetVariant?: string; // Optional variant used to select more specific knowledge packs
	assetCategory?: AssetCategory | string; // Portfolio grouping for rule orchestration and analytics
	knowledgePack?: string; // Intelligence rule package key used by recommendation engine
	brand?: string;
	model?: string;
	serialNumber?: string;
	partNumber?: string;
	filterSize?: string;
	specNotes?: string;
	serviceItems?: DeviceServiceItem[];
	installationDate?: string;
	decommissionDate?: string;
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
	propertyKnowledgeProvenance?: Record<string, PropertyKnowledgeProvenance[]>;
	notes?: string;
	createdAt?: string;
	updatedAt?: string;
}

// Backward-compatible alias while the codebase transitions from Device to Asset terminology.
export type Asset = Device;

export type PropertyType = 'Single Family' | 'Multi-Family' | 'Commercial';
