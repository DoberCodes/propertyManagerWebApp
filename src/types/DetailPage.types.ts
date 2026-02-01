/**
 * Shared types for detail pages (Property, Unit, Suite)
 * Generic types for reusable components and hooks
 */

import { Property } from './Property.types';
import { Task } from './Task.types';
import { MaintenanceRequestItem } from './MaintenanceRequest.types';

// Generic entity that can be displayed in a detail page
export interface DetailPageEntity {
	id: string;
	name: string;
	notes?: string;
	[key: string]: any; // Allow additional properties
}

// Common tab identifiers
export type CommonTabType =
	| 'info'
	| 'occupants'
	| 'devices'
	| 'tasks'
	| 'history'
	| 'requests';

// Tab configuration for detail pages
export interface TabConfig {
	id: CommonTabType;
	label: string;
	count?: number;
}

// Breadcrumb item for navigation
export interface BreadcrumbItem {
	label: string;
	path?: string;
}

// Props for DetailPageLayout component
export interface DetailPageLayoutProps {
	title: string;
	subtitle?: string;
	breadcrumbs: BreadcrumbItem[];
	badge?: string;
	onBack: () => void;
	tabs: TabConfig[];
	activeTab: CommonTabType;
	onTabChange: (tab: CommonTabType) => void;
	children: React.ReactNode;
}

// Filtered data returned by useDetailPageData hook
export interface DetailPageData {
	entity: DetailPageEntity | null;
	property: Property | null;
	tasks: Task[];
	maintenanceHistory: any[];
	maintenanceRequests: MaintenanceRequestItem[];
}

// Parameters for useDetailPageData hook
export interface UseDetailPageDataParams {
	propertySlug: string;
	entityName?: string;
	entityType: 'property' | 'unit' | 'suite';
	propertyType?: 'Multi-Family' | 'Commercial' | 'Single-Family';
}

// Info card data for rendering entity details
export interface InfoCardData {
	label: string;
	value: string | number | React.ReactNode;
}
