/**
 * CSV Export Utilities
 * Provides functions to generate CSV data from various entities
 */

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
};

export const generateTaskReport = (
	tasks: any[],
	selectedColumns: string[],
): void => {
	const filename = `task-report-${new Date().toISOString().split('T')[0]}.csv`;
	exportToCSV({
		filename,
		data: tasks,
		columns: selectedColumns,
	});
};

// ============= MAINTENANCE HISTORY REPORTS =============

export const MAINTENANCE_COLUMN_OPTIONS = {
	date: 'Date',
	description: 'Description',
	deviceId: 'Device ID',
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

	const filename = `maintenance-report-${new Date().toISOString().split('T')[0]}.csv`;
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

	const filename = `maintenance-requests-${new Date().toISOString().split('T')[0]}.csv`;
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

// ============= TENANT REPORTS =============

export const TENANT_COLUMN_OPTIONS = {
	firstName: 'First Name',
	lastName: 'Last Name',
	email: 'Email',
	phone: 'Phone',
	unit: 'Unit',
	leaseStart: 'Lease Start',
	leaseEnd: 'Lease End',
};

export const generateTenantReport = (
	tenants: any[],
	selectedColumns: string[],
	propertyFilter?: string,
): void => {
	const filtered = propertyFilter
		? tenants.filter((t) => t.propertyTitle === propertyFilter)
		: tenants;

	const filename = `tenant-report-${new Date().toISOString().split('T')[0]}.csv`;
	exportToCSV({
		filename,
		data: filtered,
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
	const filename = `employee-efficiency-${new Date().toISOString().split('T')[0]}.csv`;
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
	totalUnits: 'Total Units',
	occupiedUnits: 'Occupied Units',
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
	const filename = `property-summary-${new Date().toISOString().split('T')[0]}.csv`;
	exportToCSV({
		filename,
		data: metrics,
		columns: selectedColumns,
	});
};
