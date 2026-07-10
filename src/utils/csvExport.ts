/**
 * CSV Export Utilities
 * Provides functions to generate CSV data from various entities
 */

import { calculateCostTotal } from './financialUtils';

export interface CSVExportOptions {
	filename: string;
	data: any[];
	columns: string[];
}

/**
 * Convert data array to CSV string
 */
export const generateCSV = (data: any[], columns: string[]): string => {
	if (data.length === 0) {
		return columns.join(',');
	}

	const headers = columns.join(',');
	const rows = data.map((row) =>
		columns
			.map((col) => {
				const value = getNestedProperty(row, col);
				// Escape quotes and wrap in quotes if contains comma
				const stringValue = String(value || '');
				return stringValue.includes(',')
					? `"${stringValue.replace(/"/g, '""')}"`
					: stringValue;
			})
			.join(','),
	);

	return [headers, ...rows].join('\n');
};

/**
 * Get nested property from object using dot notation
 */
const getNestedProperty = (obj: any, path: string): any => {
	return path.split('.').reduce((current, prop) => current?.[prop], obj);
};

/**
 * Trigger CSV download
 */
export const downloadCSV = (csv: string, filename: string): void => {
	const element = document.createElement('a');
	const file = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	element.href = URL.createObjectURL(file);
	element.download = filename;
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
};

/**
 * Generate and download CSV report
 */
export const exportToCSV = (options: CSVExportOptions): void => {
	const csv = generateCSV(options.data, options.columns);
	downloadCSV(csv, options.filename);
};

// ============= TASK REPORTS =============

export const TASK_COLUMN_OPTIONS = {
	title: 'Task Title',
	dueDate: 'Due Date',
	status: 'Status',
	property: 'Property',
	unit: 'Unit',
	suite: 'Suite',
	assignee: 'Assignee',
	notes: 'Notes',
	completionDate: 'Completion Date',
	completedBy: 'Completed By',
	approvedBy: 'Approved By',
	estimateContractorCost: 'Est. Contractor Cost',
	estimateMaterialsCost: 'Est. Materials Cost',
	estimateLaborCost: 'Est. Labor Cost',
	estimateOtherCost: 'Est. Other Cost',
	estimatedTotal: 'Estimated Total',
	actualContractorCost: 'Actual Contractor Cost',
	actualMaterialsCost: 'Actual Materials Cost',
	actualLaborCost: 'Actual Labor Cost',
	actualOtherCost: 'Actual Other Cost',
	actualTotal: 'Actual Total',
	finalTotal: 'Final Total',
	financialNotes: 'Financial Notes',
};

export const generateTaskReport = (
	tasks: any[],
	selectedColumns: string[],
): void => {
	const normalizedTasks = tasks.map((task) => {
		const estimate = task.financials?.estimate;
		const actual = task.financials?.actual;
		const estimatedTotal = calculateCostTotal(estimate);
		const actualTotal = calculateCostTotal(actual);

		return {
			...task,
			estimateContractorCost: estimate?.contractorCost,
			estimateMaterialsCost: estimate?.materialsCost,
			estimateLaborCost: estimate?.laborCost,
			estimateOtherCost: estimate?.otherCost,
			estimatedTotal,
			actualContractorCost: actual?.contractorCost,
			actualMaterialsCost: actual?.materialsCost,
			actualLaborCost: actual?.laborCost,
			actualOtherCost: actual?.otherCost,
			actualTotal,
			finalTotal: actualTotal ?? estimatedTotal,
			financialNotes: task.financials?.notes || '',
		};
	});

	const filename = `task-report-${new Date().toISOString().split('T')[0]}.csv`;
	exportToCSV({
		filename,
		data: normalizedTasks,
		columns: selectedColumns,
	});
};

// ============= MAINTENANCE HISTORY REPORTS =============

export const MAINTENANCE_COLUMN_OPTIONS = {
	date: 'Date',
	description: 'Description',
	deviceId: 'Equipment ID',
	unit: 'Unit',
	suite: 'Suite',
	property: 'Property',
};

export const generateMaintenanceReport = (
	maintenanceRecords: any[],
	selectedColumns: string[],
	propertyFilter?: string,
): void => {
	const filtered = propertyFilter
		? maintenanceRecords.filter((m) => m.property === propertyFilter)
		: maintenanceRecords;

	const filename = `maintenance-report-${
		new Date().toISOString().split('T')[0]
	}.csv`;
	exportToCSV({
		filename,
		data: filtered,
		columns: selectedColumns,
	});
};

// ============= MAINTENANCE REQUEST REPORTS =============

export const MAINTENANCE_REQUEST_COLUMN_OPTIONS = {
	title: 'Request Title',
	description: 'Description',
	priority: 'Priority',
	category: 'Category',
	status: 'Status',
	propertyTitle: 'Property',
	unit: 'Unit',
	suite: 'Suite',
	submittedByName: 'Submitted By',
	submittedAt: 'Submitted At',
	reviewedBy: 'Reviewed By',
	reviewedAt: 'Reviewed At',
	notes: 'Notes',
};

export const generateMaintenanceRequestReport = (
	requests: any[],
	selectedColumns: string[],
	filters?: {
		status?: string;
		priority?: string;
		propertyId?: number;
		dateFrom?: string;
		dateTo?: string;
	},
): void => {
	let filtered = [...requests];

	if (filters?.status) {
		filtered = filtered.filter((r) => r.status === filters.status);
	}
	if (filters?.priority) {
		filtered = filtered.filter((r) => r.priority === filters.priority);
	}
	if (filters?.propertyId) {
		filtered = filtered.filter((r) => r.propertyId === filters.propertyId);
	}
	if (filters?.dateFrom) {
		filtered = filtered.filter(
			(r) => new Date(r.submittedAt) >= new Date(filters.dateFrom!),
		);
	}
	if (filters?.dateTo) {
		filtered = filtered.filter(
			(r) => new Date(r.submittedAt) <= new Date(filters.dateTo!),
		);
	}

	const filename = `maintenance-requests-${
		new Date().toISOString().split('T')[0]
	}.csv`;
	exportToCSV({
		filename,
		data: filtered,
		columns: selectedColumns,
	});
};

// ============= TEAM MEMBER REPORTS =============

export const TEAM_MEMBER_COLUMN_OPTIONS = {
	firstName: 'First Name',
	lastName: 'Last Name',
	title: 'Title',
	email: 'Email',
	phone: 'Phone',
	role: 'Role',
	address: 'Address',
	notes: 'Notes',
};

export const generateTeamReport = (
	teamMembers: any[],
	selectedColumns: string[],
): void => {
	const filename = `team-report-${new Date().toISOString().split('T')[0]}.csv`;
	exportToCSV({
		filename,
		data: teamMembers,
		columns: selectedColumns,
	});
};

// ============= CONTRACTOR REPORTS =============

export const CONTRACTOR_COLUMN_OPTIONS = {
	name: 'Name',
	company: 'Company',
	category: 'Category',
	phone: 'Phone',
	email: 'Email',
	address: 'Address',
	notes: 'Notes',
	propertyTitle: 'Property',
};

export const generateContractorReport = (
	contractors: any[],
	selectedColumns: string[],
): void => {
	const filename = `contractor-report-${
		new Date().toISOString().split('T')[0]
	}.csv`;
	exportToCSV({
		filename,
		data: contractors,
		columns: selectedColumns,
	});
};

// ============= SUITE REPORTS =============

export const SUITE_COLUMN_OPTIONS = {
	name: 'Suite Name',
	floor: 'Floor',
	bedrooms: 'Bedrooms',
	bathrooms: 'Bathrooms',
	area: 'Area (sq ft)',
	isOccupied: 'Occupied',
	propertyTitle: 'Property',
};

export const generateSuiteReport = (
	suites: any[],
	selectedColumns: string[],
): void => {
	const filename = `suite-report-${new Date().toISOString().split('T')[0]}.csv`;
	exportToCSV({
		filename,
		data: suites,
		columns: selectedColumns,
	});
};

// ============= UNIT REPORTS =============

export const UNIT_COLUMN_OPTIONS = {
	name: 'Unit Name',
	floor: 'Floor',
	area: 'Area (sq ft)',
	isOccupied: 'Occupied',
	propertyTitle: 'Property',
};

export const generateUnitReport = (
	units: any[],
	selectedColumns: string[],
): void => {
	const filename = `unit-report-${new Date().toISOString().split('T')[0]}.csv`;
	exportToCSV({
		filename,
		data: units,
		columns: selectedColumns,
	});
};

// ============= DEVICE REPORTS =============

export const DEVICE_COLUMN_OPTIONS = {
	type: 'Type',
	brand: 'Brand',
	model: 'Model',
	serialNumber: 'Serial Number',
	installationDate: 'Installation Date',
	status: 'Status',
	location: 'Location',
	notes: 'Notes',
	propertyTitle: 'Property',
};

export const generateDeviceReport = (
	devices: any[],
	selectedColumns: string[],
): void => {
	const filename = `device-report-${
		new Date().toISOString().split('T')[0]
	}.csv`;
	exportToCSV({
		filename,
		data: devices,
		columns: selectedColumns,
	});
};

// ============= MAINTENANCE HISTORY REPORTS =============

export const MAINTENANCE_HISTORY_COLUMN_OPTIONS = {
	date: 'Date',
	description: 'Description',
	status: 'Status',
	propertyTitle: 'Property',
	unit: 'Unit',
	suite: 'Suite',
	completedBy: 'Completed By',
	approvedBy: 'Approved By',
	completionDate: 'Completion Date',
	estimateContractorCost: 'Est. Contractor Cost',
	estimateMaterialsCost: 'Est. Materials Cost',
	estimateLaborCost: 'Est. Labor Cost',
	estimateOtherCost: 'Est. Other Cost',
	estimatedTotal: 'Estimated Total',
	actualContractorCost: 'Actual Contractor Cost',
	actualMaterialsCost: 'Actual Materials Cost',
	actualLaborCost: 'Actual Labor Cost',
	actualOtherCost: 'Actual Other Cost',
	actualTotal: 'Actual Total',
	finalTotal: 'Final Total',
	financialNotes: 'Financial Notes',
};

export const generateMaintenanceHistoryReport = (
	maintenanceRecords: any[],
	selectedColumns: string[],
): void => {
	const normalizedRecords = maintenanceRecords.map((record) => {
		const estimate = record.financials?.estimate;
		const actual = record.financials?.actual;
		const estimatedTotal = calculateCostTotal(estimate);
		const actualTotal = calculateCostTotal(actual);

		return {
			...record,
			estimateContractorCost: estimate?.contractorCost,
			estimateMaterialsCost: estimate?.materialsCost,
			estimateLaborCost: estimate?.laborCost,
			estimateOtherCost: estimate?.otherCost,
			estimatedTotal,
			actualContractorCost: actual?.contractorCost,
			actualMaterialsCost: actual?.materialsCost,
			actualLaborCost: actual?.laborCost,
			actualOtherCost: actual?.otherCost,
			actualTotal,
			finalTotal: actualTotal ?? estimatedTotal,
			financialNotes: record.financials?.notes || '',
		};
	});

	const filename = `maintenance-history-${
		new Date().toISOString().split('T')[0]
	}.csv`;
	exportToCSV({
		filename,
		data: normalizedRecords,
		columns: selectedColumns,
	});
};

// ============= TENANT PROFILE REPORTS =============

export const TENANT_PROFILE_COLUMN_OPTIONS = {
	firstName: 'First Name',
	lastName: 'Last Name',
	email: 'Email',
	phone: 'Phone',
	emergencyContact: 'Emergency Contact',
	preferences: 'Preferences',
	profileCompleteness: 'Profile Completeness (%)',
	isPublic: 'Public Profile',
};

export const generateTenantProfileReport = (
	tenantProfiles: any[],
	selectedColumns: string[],
): void => {
	const filename = `tenant-profile-report-${
		new Date().toISOString().split('T')[0]
	}.csv`;
	exportToCSV({
		filename,
		data: tenantProfiles,
		columns: selectedColumns,
	});
};

// ============= PROPERTY SHARE REPORTS =============

export const PROPERTY_SHARE_COLUMN_OPTIONS = {
	propertyTitle: 'Property',
	sharedWithFirstName: 'Shared With (First Name)',
	sharedWithLastName: 'Shared With (Last Name)',
	sharedWithEmail: 'Shared With (Email)',
	permission: 'Permission',
	createdAt: 'Shared Date',
};

export const generatePropertyShareReport = (
	propertyShares: any[],
	selectedColumns: string[],
): void => {
	const filename = `property-share-report-${
		new Date().toISOString().split('T')[0]
	}.csv`;
	exportToCSV({
		filename,
		data: propertyShares,
		columns: selectedColumns,
	});
};

// ============= EMPLOYEE EFFICIENCY REPORTS =============

export interface EmployeeEfficiencyMetrics {
	employeeId: number;
	firstName: string;
	lastName: string;
	email: string;
	title: string;
	totalTasksAssigned: number;
	tasksCompleted: number;
	tasksInProgress: number;
	tasksPending: number;
	completionRate: number;
	averageCompletionDays: number;
	lastTaskCompletionDate: string;
}

export const EMPLOYEE_EFFICIENCY_COLUMN_OPTIONS = {
	firstName: 'First Name',
	lastName: 'Last Name',
	email: 'Email',
	title: 'Title',
	totalTasksAssigned: 'Total Tasks',
	tasksCompleted: 'Completed',
	tasksInProgress: 'In Progress',
	tasksPending: 'Pending',
	completionRate: 'Completion Rate (%)',
	averageCompletionDays: 'Avg Days to Complete',
	lastTaskCompletionDate: 'Last Completion Date',
};

export const generateEmployeeEfficiencyReport = (
	metrics: EmployeeEfficiencyMetrics[],
	selectedColumns: string[],
): void => {
	const filename = `employee-efficiency-${
		new Date().toISOString().split('T')[0]
	}.csv`;
	exportToCSV({
		filename,
		data: metrics,
		columns: selectedColumns,
	});
};

// ============= PROPERTY SUMMARY REPORTS =============

export interface PropertySummaryMetrics {
	propertyId: number;
	propertyTitle: string;
	address: string;
	totalUnits: number;
	occupiedUnits: number;
	totalTenants: number;
	totalTasks: number;
	completedTasks: number;
	maintenanceHistoryCount: number;
	pendingMaintenanceRequests: number;
	approvedMaintenanceRequests: number;
}

export const PROPERTY_SUMMARY_COLUMN_OPTIONS = {
	propertyTitle: 'Property Name',
	address: 'Address',
	// Units are temporarily hidden from the app flow.
	// totalUnits: 'Total Units',
	// occupiedUnits: 'Occupied Units',
	totalTenants: 'Total Tenants',
	totalTasks: 'Total Tasks',
	completedTasks: 'Completed Tasks',
	maintenanceHistoryCount: 'Maintenance Records',
	pendingMaintenanceRequests: 'Pending Requests',
	approvedMaintenanceRequests: 'Approved Requests',
};

export const generatePropertySummaryReport = (
	metrics: PropertySummaryMetrics[],
	selectedColumns: string[],
): void => {
	const filename = `property-summary-${
		new Date().toISOString().split('T')[0]
	}.csv`;
	exportToCSV({
		filename,
		data: metrics,
		columns: selectedColumns,
	});
};
