import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import {
	canAccessReportBuilder,
	canExportReports as canExportReportData,
	canPortfolioReporting,
	canUseAdvancedTeamManagement,
	canViewTenantInfo,
} from '../../utils/subscriptionUtils';
import { getRoleCapabilities } from '../../utils/permissions';
import {
	selectCanAccessTeam,
	selectCanManageTenants,
	selectCanViewAllPages,
	selectIsHomeowner,
	selectIsTeamMemberAccount,
} from '../../Redux/selectors/permissionSelectors';
import {
	useGetPropertiesQuery,
	useGetAllUnitsQuery,
} from '../../Redux/API/propertySlice';
import { useGetPublicTenantProfilesQuery } from '../../Redux/API/tenantSlice';
import { useGetContractorsQuery } from '../../Redux/API/contractorSlice';
import { useGetAllDevicesQuery } from '../../Redux/API/deviceSlice';
import {
	useGetAllMaintenanceHistoryForUserQuery,
} from '../../Redux/API/userSlice';
import {
	FormGroup as LibraryFormGroup,
	FormLabel as LibraryLabel,
	FormSelect as LibrarySelect,
} from '../Library';
import {
	AppPage as StandardAppPage,
	AppPageHeader as StandardAppPageHeader,
	AppPageSubtitle as StandardAppPageSubtitle,
	AppPageTitle as StandardAppPageTitle,
	AppPageTitleBlock as StandardAppPageTitleBlock,
} from '../Library/AppPageLayout/AppPageLayout.styles';
import {
	ReportBuilderContainer,
	Section,
	SectionTitle,
	ColumnsGrid,
	CheckboxWrapper,
	Checkbox,
	CheckboxLabel,
	SelectAllWrapper,
	SelectAllLabel,
	PreviewSection,
	EmptyMessage,
	ActionButtons,
	Button,
	InfoMessage,
	FilterContainer,
	FilterRow,
	Input,
	MobileReportCard,
	MobileReportCardTitle,
	MobileReportCardDescription,
	MobileReportCardMeta,
	ReportSetupPanel,
	ReportStepHeader,
	ReportStepKicker,
	ReportStepText,
	ReportOutputPanel,
	ReportCategoryGrid,
	ReportCategoryButton,
	ReportCategoryTitle,
	ReportCategoryDescription,
	ReportTemplateGrid,
	SelectedReportSummary,
	SelectedReportTitle,
	SelectedReportMeta,
	AdvancedColumnsToggle,
	ColumnOptionsStack,
	ColumnOptionWrapper,
	ColumnOptionText,
	ColumnOptionHelp,
} from './ReportBuilder.styles';
import {
	TASK_COLUMN_OPTIONS,
	MAINTENANCE_REQUEST_COLUMN_OPTIONS,
	TEAM_MEMBER_COLUMN_OPTIONS,
	EMPLOYEE_EFFICIENCY_COLUMN_OPTIONS,
	PROPERTY_SUMMARY_COLUMN_OPTIONS,
	CONTRACTOR_COLUMN_OPTIONS,
	SUITE_COLUMN_OPTIONS,
	UNIT_COLUMN_OPTIONS,
	DEVICE_COLUMN_OPTIONS,
	MAINTENANCE_HISTORY_COLUMN_OPTIONS,
	TENANT_PROFILE_COLUMN_OPTIONS,
	generateTaskReport,
	generateMaintenanceRequestReport,
	generateTeamReport,
	generateEmployeeEfficiencyReport,
	generatePropertySummaryReport,
	generateContractorReport,
	generateSuiteReport,
	generateUnitReport,
	generateDeviceReport,
	generateMaintenanceHistoryReport,
	generateTenantProfileReport,
	exportToCSV,
} from '../../utils/csvExport';
import { useGetTasksQuery } from '../../Redux/API/taskSlice';
import { useGetTeamMembersQuery } from '../../Redux/API/teamSlice';
import { useAppFeedback } from '../Library/AppFeedback/AppFeedbackProvider';
import { LockedFeatureCallout } from '../Library/LockedFeatureCallout';
import { ReportPreview } from './ReportPreview';
import { getNonEmptyReportColumns } from './reportPreviewUtils';
import { isNativeApp } from '../../utils/platform';
import {
	FINANCIAL_COLUMN_KEYS,
	ReportType,
	buildApplianceServiceRows,
	buildContractorServiceSpendRows,
	buildDocumentInventoryRows,
	buildEmployeeEfficiencyRows,
	buildMaintenanceRequestRows,
	buildPortfolioOverviewRows,
	buildPropertySummaryRows,
	buildRecurringMaintenanceRows,
	buildResidentRequestLifecycleRows,
	buildSuiteReportRows,
	buildTeamWorkloadRows,
	buildUnitReportRows,
	buildWarrantyExpirationRows,
	canViewTeamReportsForUser,
	filterRecordsForAccountOrProperties,
	filterReportRowsByProperty,
	filterRowsForHomeownerProperties,
	getAccessibleReports,
	getActiveAccountId,
	getAllowedPropertyIdSet,
	getReportDescription,
	isSingleFamilyProperty,
	normalizeContractorReportRows,
	normalizeDeviceReportRows,
	normalizeMaintenanceHistoryReportRows,
	normalizeTaskReportRows,
} from '../../reporting/reportDataAdapters';

// Alias Library components to match local naming convention
const FormGroup = LibraryFormGroup;
const Label = LibraryLabel;
const Select = LibrarySelect;

const OVERDUE_TASK_COLUMN_OPTIONS = {
	...TASK_COLUMN_OPTIONS,
	daysOverdue: 'Days Overdue',
};

const UPCOMING_TASK_COLUMN_OPTIONS = {
	...TASK_COLUMN_OPTIONS,
	daysUntilDue: 'Days Until Due',
};

const MAINTENANCE_COST_COLUMN_OPTIONS = {
	propertyTitle: 'Property',
	date: 'Date',
	description: 'Description',
	estimatedTotal: 'Estimated Total',
	actualTotal: 'Actual Total',
	finalTotal: 'Final Total',
	financialNotes: 'Financial Notes',
};

const PORTFOLIO_OVERVIEW_COLUMN_OPTIONS = {
	propertyCount: 'Properties',
	taskCount: 'Total Tasks',
	completedTaskCount: 'Completed Tasks',
	pendingTaskCount: 'Pending Tasks',
	maintenanceRecordCount: 'Maintenance Records',
	requestCount: 'Maintenance Requests',
	completionRate: 'Completion Rate (%)',
};

const DOCUMENT_INVENTORY_COLUMN_OPTIONS = {
	propertyTitle: 'Property',
	documentName: 'Document',
	documentType: 'Document Type',
	source: 'Source',
	linkedApplianceCount: 'Linked Appliances',
	linkedTaskCount: 'Linked Tasks',
	linkedMaintenanceEventCount: 'Linked Maintenance Records',
	uploadedAt: 'Uploaded',
	uploadedBy: 'Uploaded By',
	acquisitionStatus: 'Review Status',
	fileSize: 'File Size',
	contentType: 'File Type',
	url: 'File URL',
};

const WARRANTY_EXPIRATION_COLUMN_OPTIONS = {
	propertyTitle: 'Property',
	applianceSystem: 'Appliance/System',
	manufacturer: 'Manufacturer',
	model: 'Model',
	serialNumber: 'Serial Number',
	installDate: 'Install Date',
	warrantyStartDate: 'Warranty Start',
	warrantyEndDate: 'Warranty End',
	warrantyLength: 'Warranty Length',
	warrantyDocumentAttached: 'Warranty Document Attached',
	documentName: 'Warranty Document',
	status: 'Status',
	notes: 'Notes',
};

const RECURRING_MAINTENANCE_COLUMN_OPTIONS = {
	propertyTitle: 'Property',
	title: 'Task',
	status: 'Status',
	priority: 'Priority',
	recurrenceFrequency: 'Frequency',
	recurrenceInterval: 'Interval',
	recurrenceCustomUnit: 'Custom Unit',
	nextDueDate: 'Next Due',
	lastCompleted: 'Last Completed',
	reminderEnabled: 'Reminder Enabled',
	assignee: 'Assignee',
	applianceCount: 'Linked Appliances',
};

const APPLIANCE_SERVICE_COLUMN_OPTIONS = {
	propertyTitle: 'Property',
	applianceSystem: 'Appliance/System',
	type: 'Type',
	manufacturer: 'Manufacturer',
	model: 'Model',
	serialNumber: 'Serial Number',
	installDate: 'Install Date',
	lastServiceDate: 'Last Service',
	serviceCount: 'Service Records',
	openTasks: 'Open Tasks',
	upcomingTasks: 'Upcoming Tasks',
	warrantyEndDate: 'Warranty End',
	documentsAttached: 'Documents',
	status: 'Status',
};

const CONTRACTOR_SERVICE_SPEND_COLUMN_OPTIONS = {
	contractorName: 'Contractor',
	company: 'Company',
	propertyTitle: 'Property',
	category: 'Category',
	completedJobs: 'Completed Jobs',
	lastServiceDate: 'Last Service',
	estimatedTotal: 'Estimated Total',
	actualTotal: 'Actual Total',
	linkedMaintenanceRecords: 'Maintenance Records',
	linkedTasks: 'Tasks',
};

const RESIDENT_REQUEST_LIFECYCLE_COLUMN_OPTIONS = {
	propertyTitle: 'Property',
	title: 'Request',
	submittedByName: 'Submitted By',
	submittedAt: 'Submitted',
	status: 'Status',
	convertedToTaskId: 'Converted Task',
	timeToConversionDays: 'Days to Conversion',
	priority: 'Priority',
	category: 'Category',
	completedDate: 'Completed',
};

const TEAM_WORKLOAD_COLUMN_OPTIONS = {
	firstName: 'First Name',
	lastName: 'Last Name',
	email: 'Email',
	title: 'Title',
	assignedPropertyCount: 'Assigned Properties',
	openTasks: 'Open Tasks',
	overdueTasks: 'Overdue Tasks',
	dueNext30Days: 'Due Next 30 Days',
	completedTasks: 'Completed Tasks',
};

type ReportCategoryId =
	| 'tasks'
	| 'maintenance'
	| 'systems'
	| 'documents'
	| 'contractors'
	| 'people'
	| 'portfolio';

const REPORT_CATEGORIES: Array<{
	id: ReportCategoryId;
	label: string;
	description: string;
}> = [
	{
		id: 'tasks',
		label: 'Tasks',
		description: 'Open work, due dates, and recurring care',
	},
	{
		id: 'maintenance',
		label: 'Maintenance History',
		description: 'Completed work, service records, and costs',
	},
	{
		id: 'systems',
		label: 'Equipment Records',
		description: 'Equipment, warranties, and service activity',
	},
	{
		id: 'documents',
		label: 'Documents',
		description: 'Uploaded records and linked files',
	},
	{
		id: 'contractors',
		label: 'Contractors',
		description: 'Contacts, service activity, and spend',
	},
	{
		id: 'people',
		label: 'People',
		description: 'Team, residents, and request activity',
	},
	{
		id: 'portfolio',
		label: 'Summary',
		description: 'Home and property summaries',
	},
];

const REPORT_CATEGORY_BY_TYPE: Partial<Record<ReportType, ReportCategoryId>> = {
	tasks: 'tasks',
	'overdue-tasks': 'tasks',
	'upcoming-tasks': 'tasks',
	'recurring-maintenance': 'tasks',
	'maintenance-requests': 'maintenance',
	'resident-request-lifecycle': 'maintenance',
	'maintenance-history': 'maintenance',
	'maintenance-costs': 'maintenance',
	devices: 'systems',
	'warranty-expiration': 'systems',
	'appliance-service': 'systems',
	'document-inventory': 'documents',
	contractors: 'contractors',
	'contractor-service-spend': 'contractors',
	team: 'people',
	'team-workload': 'people',
	'employee-efficiency': 'people',
	'tenant-profiles': 'people',
	'property-summary': 'portfolio',
	'portfolio-overview': 'portfolio',
	suites: 'portfolio',
	units: 'portfolio',
};

const DEFAULT_REPORT_COLUMNS: Partial<Record<ReportType, string[]>> = {
	tasks: ['title', 'property', 'dueDate', 'status', 'priority', 'assignee'],
	'overdue-tasks': ['title', 'property', 'dueDate', 'daysOverdue', 'priority', 'assignee'],
	'upcoming-tasks': ['title', 'property', 'dueDate', 'daysUntilDue', 'priority', 'assignee'],
	'recurring-maintenance': [
		'propertyTitle',
		'title',
		'recurrenceFrequency',
		'nextDueDate',
		'reminderEnabled',
		'assignee',
	],
	'maintenance-requests': [
		'title',
		'propertyTitle',
		'status',
		'priority',
		'submittedByName',
		'submittedAt',
	],
	'resident-request-lifecycle': [
		'propertyTitle',
		'title',
		'status',
		'submittedAt',
		'convertedToTaskId',
		'timeToConversionDays',
	],
	'maintenance-history': ['date', 'description', 'propertyTitle', 'status', 'completedBy'],
	'maintenance-costs': [
		'propertyTitle',
		'date',
		'description',
		'estimatedTotal',
		'actualTotal',
		'finalTotal',
	],
	devices: ['propertyTitle', 'type', 'brand', 'model', 'serialNumber', 'status'],
	'warranty-expiration': [
		'propertyTitle',
		'applianceSystem',
		'manufacturer',
		'model',
		'warrantyEndDate',
		'warrantyDocumentAttached',
	],
	'appliance-service': [
		'propertyTitle',
		'applianceSystem',
		'lastServiceDate',
		'serviceCount',
		'openTasks',
		'documentsAttached',
	],
	'document-inventory': [
		'propertyTitle',
		'documentName',
		'documentType',
		'source',
		'uploadedAt',
		'acquisitionStatus',
	],
	contractors: ['propertyTitle', 'name', 'company', 'category', 'phone', 'email'],
	'contractor-service-spend': [
		'contractorName',
		'propertyTitle',
		'completedJobs',
		'lastServiceDate',
		'actualTotal',
		'linkedMaintenanceRecords',
	],
	team: ['firstName', 'lastName', 'title', 'email', 'role', 'phone'],
	'team-workload': [
		'firstName',
		'lastName',
		'assignedPropertyCount',
		'openTasks',
		'overdueTasks',
		'dueNext30Days',
	],
	'employee-efficiency': [
		'firstName',
		'lastName',
		'totalTasksAssigned',
		'tasksCompleted',
		'completionRate',
	],
	'tenant-profiles': ['firstName', 'lastName', 'email', 'phone', 'profileCompleteness'],
	'property-summary': [
		'propertyTitle',
		'propertyType',
		'totalTasks',
		'completedTasks',
		'maintenanceHistoryCount',
	],
	'portfolio-overview': [
		'propertyCount',
		'taskCount',
		'completedTaskCount',
		'pendingTaskCount',
		'maintenanceRecordCount',
		'completionRate',
	],
	suites: ['propertyTitle', 'name', 'floor', 'area', 'isOccupied'],
	units: ['propertyTitle', 'name', 'floor', 'area', 'isOccupied'],
};

const EMPTY_REPORT_MESSAGES: Partial<Record<ReportType, string>> = {
	tasks: 'Add a task to include it in this report.',
	'overdue-tasks': 'No open tasks are past due for this scope.',
	'upcoming-tasks': 'No open tasks are due in the next 30 days for this scope.',
	'recurring-maintenance': 'Add a recurring task to see scheduled maintenance here.',
	'maintenance-requests': 'Submitted maintenance requests will appear here.',
	'resident-request-lifecycle': 'Resident requests will appear here once submitted or converted to tasks.',
	'maintenance-history': 'Completed maintenance records will appear here.',
	'maintenance-costs': 'Maintenance records with cost details will appear here.',
	devices: 'Add an appliance or system to include it in this report.',
	'warranty-expiration': 'Add warranty details or upload warranty documents to see them here.',
	'appliance-service': 'Add appliances, tasks, or service records to build this report.',
	'document-inventory': 'Upload property documents or attach files to tasks and maintenance records.',
	contractors: 'Add a contractor to include them in this report.',
	'contractor-service-spend': 'Contractor work with cost details will appear here.',
	team: 'Add team members to include them in this report.',
	'team-workload': 'Assigned team tasks will appear here.',
	'employee-efficiency': 'Assigned and completed team tasks will appear here.',
	'tenant-profiles': 'Resident profiles will appear here when available.',
	'property-summary': 'Add property records to build this summary.',
	'portfolio-overview': 'Add multiple properties to build a portfolio overview.',
	suites: 'Commercial suites will appear here when added to a property.',
	units: 'Units will appear here when added to a property.',
};

const DATE_FILTER_REPORTS = new Set<ReportType>([
	'tasks',
	'overdue-tasks',
	'upcoming-tasks',
	'recurring-maintenance',
	'maintenance-requests',
	'resident-request-lifecycle',
	'maintenance-history',
	'maintenance-costs',
	'warranty-expiration',
	'appliance-service',
	'document-inventory',
	'contractor-service-spend',
]);

const getReportRowDateValue = (reportType: ReportType, row: any): string => {
	if (reportType === 'document-inventory') return row.uploadedAt || '';
	if (reportType === 'warranty-expiration') return row.warrantyEndDate || '';
	if (reportType === 'appliance-service') return row.lastServiceDate || '';
	if (reportType === 'contractor-service-spend') return row.lastServiceDate || '';
	if (reportType === 'resident-request-lifecycle') return row.submittedAt || '';
	if (reportType === 'recurring-maintenance') return row.nextDueDate || '';
	if (reportType === 'maintenance-requests') return row.submittedAt || row.requestedDate || '';
	if (reportType === 'maintenance-history' || reportType === 'maintenance-costs') {
		return row.completionDate || row.date || '';
	}
	return row.dueDate || row.date || row.completedDate || '';
};

const getDefaultColumnsForReport = (
	nextReportType: ReportType,
	nextColumnOptions: Record<string, string>,
): string[] => {
	const availableColumnKeys = Object.keys(nextColumnOptions);
	const preferredColumns = DEFAULT_REPORT_COLUMNS[nextReportType] || availableColumnKeys;
	const defaults = preferredColumns.filter((column) =>
		availableColumnKeys.includes(column),
	);
	return defaults.length > 0 ? defaults : availableColumnKeys.slice(0, 6);
};

const canViewFinancialReportsForUser = (user: any): boolean => {
	if (!user) return false;
	if (user.isAccountOwner === true) return true;
	return getRoleCapabilities(user.role).canManageFinancials;
};

const TEAM_REPORT_TYPES = new Set<ReportType>([
	'team',
	'employee-efficiency',
	'team-workload',
]);

const TENANT_REPORT_TYPES = new Set<ReportType>([
	'tenant-profiles',
	'resident-request-lifecycle',
]);

const FINANCIAL_REPORT_TYPES = new Set<ReportType>([
	'maintenance-costs',
	'contractor-service-spend',
]);

const SIMPLE_CSV_EXPORT_FILENAMES: Partial<Record<ReportType, string>> = {
	'maintenance-costs': 'maintenance-costs',
	'portfolio-overview': 'portfolio-overview',
	'document-inventory': 'document-inventory',
	'warranty-expiration': 'warranty-expiration',
	'recurring-maintenance': 'recurring-maintenance',
	'appliance-service': 'appliance-service',
	'contractor-service-spend': 'contractor-service-spend',
	'resident-request-lifecycle': 'resident-request-lifecycle',
	'team-workload': 'team-workload',
};

const exportSimpleCsvReport = (
	reportType: ReportType,
	data: any[],
	columns: string[],
): boolean => {
	const filenameBase = SIMPLE_CSV_EXPORT_FILENAMES[reportType];
	if (!filenameBase) {
		return false;
	}

	exportToCSV({
		filename: `${filenameBase}-${new Date().toISOString().split('T')[0]}.csv`,
		data,
		columns,
	});
	return true;
};

export const ReportBuilder: React.FC = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const reduxMaintenanceRequests = useSelector(
		(state: RootState) => state.maintenanceRequests.requests,
	);
	const canAccessReports =
		!!currentUser?.subscription &&
		canAccessReportBuilder(currentUser.subscription as any);
	const canExportReports =
		!!currentUser?.subscription &&
		canExportReportData(currentUser.subscription as any);
	const canManageTeam = useSelector(selectCanAccessTeam);
	const canManageTenantsPermission = useSelector(selectCanManageTenants);
	const canViewPages = useSelector(selectCanViewAllPages);
	const isHomeowner = useSelector(selectIsHomeowner);
	const isTeamMemberAccount = useSelector(selectIsTeamMemberAccount);
	const canAccessTeamReport = canViewTeamReportsForUser({
		isHomeowner,
		canManageTeam,
		canViewPages,
	});
	const canAccessAdvancedTeamReport =
		!!currentUser?.subscription &&
		canUseAdvancedTeamManagement(currentUser.subscription as any);
	const canAccessTenantReports =
		!!currentUser?.subscription &&
		canViewTenantInfo(currentUser.subscription as any) &&
		(canManageTenantsPermission || canViewPages);
	const canAccessPortfolioReports =
		!!currentUser?.subscription &&
		canPortfolioReporting(currentUser.subscription as any);
	const canViewFinancialReports = canViewFinancialReportsForUser(currentUser);
	const feedback = useAppFeedback();
	const nativeApp = isNativeApp();

	const [reportType, setReportType] = useState<ReportType>('');
	const [selectedCategory, setSelectedCategory] = useState<ReportCategoryId>('tasks');
	const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
	const [showAdvancedColumns, setShowAdvancedColumns] = useState(false);
	const [hideEmptyColumns, setHideEmptyColumns] = useState(false);
	const [filters, setFilters] = useState<any>({
		status: '',
		priority: '',
		propertyId: '',
		dateFrom: '',
		dateTo: '',
	});

	// Fetch Firebase data
	const { data: tasks = [], isLoading: tasksLoading } = useGetTasksQuery();

	const { data: properties = [], isLoading: propertiesLoading } =
		useGetPropertiesQuery();

	const { data: firebaseTeamMembers = [], isLoading: teamLoading } =
		useGetTeamMembersQuery();

	// New data queries for expanded reporting
	const {
		data: allMaintenanceHistory = [],
		isLoading: maintenanceHistoryLoading,
	} = useGetAllMaintenanceHistoryForUserQuery();

	const { data: publicTenantProfiles = [], isLoading: tenantProfilesLoading } =
		useGetPublicTenantProfilesQuery();

	const { data: contractors = [], isLoading: contractorsLoading } =
		useGetContractorsQuery();

	// Get all units and appliances across all properties
	const { data: allUnits = [] } = useGetAllUnitsQuery();

	const { data: allDevices = [] } = useGetAllDevicesQuery();

	const activeAccountId = getActiveAccountId(currentUser);

	const scopedProperties = useMemo(() => {
		if (!activeAccountId) {
			return [] as any[];
		}
		return properties.filter((property: any) => {
			const propertyAccountId = String(property.accountId || '').trim();
			const propertyUserId = String(property.userId || '').trim();
			return (
				(propertyAccountId && propertyAccountId === activeAccountId) ||
				(!propertyAccountId && propertyUserId === activeAccountId)
			);
		});
	}, [properties, activeAccountId]);

	const allowedPropertyIdSet = useMemo(
		() => getAllowedPropertyIdSet(scopedProperties),
		[scopedProperties],
	);

	const scopedTasks = useMemo(() => {
		return filterRecordsForAccountOrProperties(
			tasks,
			activeAccountId,
			allowedPropertyIdSet,
		);
	}, [tasks, activeAccountId, allowedPropertyIdSet]);

	const scopedTeamMembers = useMemo(() => {
		return firebaseTeamMembers.filter((member: any) => {
			const memberAccountId = String(member.accountId || '').trim();
			const memberUserId = String(member.userId || '').trim();
			return (
				(memberAccountId && memberAccountId === activeAccountId) ||
				(!memberAccountId && memberUserId === activeAccountId)
			);
		});
	}, [firebaseTeamMembers, activeAccountId]);

	const scopedMaintenanceHistory = useMemo(() => {
		return filterRecordsForAccountOrProperties(
			allMaintenanceHistory,
			activeAccountId,
			allowedPropertyIdSet,
		);
	}, [allMaintenanceHistory, activeAccountId, allowedPropertyIdSet]);

	const scopedTenantProfiles = useMemo(() => {
		return filterRecordsForAccountOrProperties(
			publicTenantProfiles,
			activeAccountId,
			allowedPropertyIdSet,
		);
	}, [publicTenantProfiles, activeAccountId, allowedPropertyIdSet]);

	const scopedContractors = useMemo(() => {
		return filterRecordsForAccountOrProperties(
			contractors,
			activeAccountId,
			allowedPropertyIdSet,
		);
	}, [contractors, activeAccountId, allowedPropertyIdSet]);

	const scopedUnits = useMemo(() => {
		return filterRecordsForAccountOrProperties(
			allUnits,
			activeAccountId,
			allowedPropertyIdSet,
		);
	}, [allUnits, activeAccountId, allowedPropertyIdSet]);

	const scopedDevices = useMemo(() => {
		return filterRecordsForAccountOrProperties(
			allDevices,
			activeAccountId,
			allowedPropertyIdSet,
		);
	}, [allDevices, activeAccountId, allowedPropertyIdSet]);

	const suitesData = useMemo(
		() => buildSuiteReportRows(scopedProperties),
		[scopedProperties],
	);

	const hasMultiFamilyProperties = useMemo(() => {
		if (isHomeowner) return false;
		return scopedProperties.some((property: any) => {
			const ptype = String(property.propertyType || '').toLowerCase();
			return ptype.includes('multi');
		});
	}, [scopedProperties, isHomeowner]);

	const hasCommercialSuites = useMemo(() => {
		if (isHomeowner) return false;
		return scopedProperties.some((property: any) => {
			const ptype = String(property.propertyType || '').toLowerCase();
			const hasSuitesFlag = !!property.hasSuites;
			const hasSuitesArray =
				Array.isArray(property.suites) && property.suites.length > 0;
			return ptype.includes('commercial') && (hasSuitesFlag || hasSuitesArray);
		});
	}, [scopedProperties, isHomeowner]);

	const unitsData = useMemo(
		() => buildUnitReportRows(scopedUnits, scopedProperties),
		[scopedUnits, scopedProperties],
	);

	const devicesData = useMemo(
		() => normalizeDeviceReportRows(scopedDevices, scopedProperties),
		[scopedDevices, scopedProperties],
	);

	const contractorsData = useMemo(
		() => normalizeContractorReportRows(scopedContractors, scopedProperties),
		[scopedContractors, scopedProperties],
	);

	const taskReportRows = useMemo(
		() =>
			normalizeTaskReportRows(
				scopedTasks,
				scopedProperties,
				scopedTeamMembers,
				contractorsData,
			),
		[scopedTasks, scopedProperties, scopedTeamMembers, contractorsData],
	);

	const maintenanceHistoryData = useMemo(
		() =>
			normalizeMaintenanceHistoryReportRows(
				scopedMaintenanceHistory,
				scopedProperties,
			),
		[scopedMaintenanceHistory, scopedProperties],
	);

	const maintenanceRequests = useMemo(
		() =>
			buildMaintenanceRequestRows({
				properties: scopedProperties,
				reduxMaintenanceRequests,
				allowedPropertyIdSet,
			}),
		[allowedPropertyIdSet, reduxMaintenanceRequests, scopedProperties],
	);

	const overdueTasks = useMemo(() => {
		const now = new Date();
		return taskReportRows
			.filter((task: any) => {
				if (!task.dueDate) return false;
				const isCompleted = String(task.status || '').toLowerCase() === 'completed';
				if (isCompleted) return false;
				return new Date(task.dueDate) < now;
			})
			.map((task: any) => {
				const diffMs = now.getTime() - new Date(task.dueDate).getTime();
				const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
				return {
					...task,
					daysOverdue,
				};
			});
	}, [taskReportRows]);

	const upcomingTasks = useMemo(() => {
		const now = new Date();
		const horizon = new Date();
		horizon.setDate(now.getDate() + 30);

		return taskReportRows
			.filter((task: any) => {
				if (!task.dueDate) return false;
				const isCompleted = String(task.status || '').toLowerCase() === 'completed';
				if (isCompleted) return false;
				const dueDate = new Date(task.dueDate);
				return dueDate >= now && dueDate <= horizon;
			})
			.map((task: any) => {
				const diffMs = new Date(task.dueDate).getTime() - now.getTime();
				const daysUntilDue = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
				return {
					...task,
					daysUntilDue,
				};
			});
	}, [taskReportRows]);

	const portfolioOverviewData = useMemo(
		() =>
			buildPortfolioOverviewRows({
				properties: scopedProperties,
				tasks: taskReportRows,
				maintenanceHistory: maintenanceHistoryData,
				maintenanceRequests,
			}),
		[scopedProperties, taskReportRows, maintenanceHistoryData, maintenanceRequests],
	);

	const warrantyExpirationData = useMemo(
		() =>
			buildWarrantyExpirationRows({
				properties: scopedProperties,
				devices: devicesData,
			}),
		[scopedProperties, devicesData],
	);

	const documentInventoryData = useMemo(
		() =>
			buildDocumentInventoryRows({
				properties: scopedProperties,
				devices: devicesData,
				tasks: taskReportRows,
				maintenanceHistory: maintenanceHistoryData,
				maintenanceRequests,
			}),
		[
			scopedProperties,
			devicesData,
			taskReportRows,
			maintenanceHistoryData,
			maintenanceRequests,
		],
	);

	const recurringMaintenanceData = useMemo(
		() => buildRecurringMaintenanceRows(taskReportRows),
		[taskReportRows],
	);

	const applianceServiceData = useMemo(
		() =>
			buildApplianceServiceRows({
				devices: devicesData,
				tasks: taskReportRows,
				maintenanceHistory: maintenanceHistoryData,
				properties: scopedProperties,
			}),
		[devicesData, taskReportRows, maintenanceHistoryData, scopedProperties],
	);

	const contractorServiceSpendData = useMemo(
		() =>
			buildContractorServiceSpendRows({
				contractors: contractorsData,
				tasks: taskReportRows,
				maintenanceHistory: maintenanceHistoryData,
			}),
		[contractorsData, taskReportRows, maintenanceHistoryData],
	);

	const residentRequestLifecycleData = useMemo(
		() => buildResidentRequestLifecycleRows(maintenanceRequests, taskReportRows),
		[maintenanceRequests, taskReportRows],
	);

	const teamWorkloadData = useMemo(
		() => buildTeamWorkloadRows(scopedTeamMembers, taskReportRows),
		[scopedTeamMembers, taskReportRows],
	);

	// Get column options based on report type
	const columnOptions = useMemo(() => {
		const optionsMap: Partial<Record<ReportType, Record<string, string>>> = {
			tasks: TASK_COLUMN_OPTIONS,
			'overdue-tasks': OVERDUE_TASK_COLUMN_OPTIONS,
			'upcoming-tasks': UPCOMING_TASK_COLUMN_OPTIONS,
			'maintenance-requests': MAINTENANCE_REQUEST_COLUMN_OPTIONS,
			team: TEAM_MEMBER_COLUMN_OPTIONS,
			'employee-efficiency': EMPLOYEE_EFFICIENCY_COLUMN_OPTIONS,
			'property-summary': PROPERTY_SUMMARY_COLUMN_OPTIONS,
			'maintenance-costs': MAINTENANCE_COST_COLUMN_OPTIONS,
			'portfolio-overview': PORTFOLIO_OVERVIEW_COLUMN_OPTIONS,
			'document-inventory': DOCUMENT_INVENTORY_COLUMN_OPTIONS,
			'warranty-expiration': WARRANTY_EXPIRATION_COLUMN_OPTIONS,
			'recurring-maintenance': RECURRING_MAINTENANCE_COLUMN_OPTIONS,
			'appliance-service': APPLIANCE_SERVICE_COLUMN_OPTIONS,
			'contractor-service-spend': CONTRACTOR_SERVICE_SPEND_COLUMN_OPTIONS,
			'resident-request-lifecycle': RESIDENT_REQUEST_LIFECYCLE_COLUMN_OPTIONS,
			'team-workload': TEAM_WORKLOAD_COLUMN_OPTIONS,
			contractors: CONTRACTOR_COLUMN_OPTIONS,
			suites: SUITE_COLUMN_OPTIONS,
			units: UNIT_COLUMN_OPTIONS,
			devices: DEVICE_COLUMN_OPTIONS,
			'maintenance-history': MAINTENANCE_HISTORY_COLUMN_OPTIONS,
			'tenant-profiles': TENANT_PROFILE_COLUMN_OPTIONS,
			'': {},
		};

		const availableOptions = { ...(optionsMap[reportType] || {}) };

		if (!hasMultiFamilyProperties) {
			delete availableOptions.unit;
		}

		if (!hasCommercialSuites) {
			delete availableOptions.suite;
		}

		if (isHomeowner && reportType === 'property-summary') {
			delete availableOptions.totalUnits;
			delete availableOptions.occupiedUnits;
			delete availableOptions.totalTenants;
		}

		if (!canViewFinancialReports) {
			FINANCIAL_COLUMN_KEYS.forEach((columnKey) => {
				delete availableOptions[columnKey];
			});
		}

		return availableOptions;
	}, [
		reportType,
		hasMultiFamilyProperties,
		hasCommercialSuites,
		isHomeowner,
		canViewFinancialReports,
	]);

	// Determine which report types should show property filter
	const shouldShowPropertyFilter = [
		'tasks',
		'overdue-tasks',
		'upcoming-tasks',
		'maintenance-requests',
		'contractors',
		'suites',
		'units',
		'devices',
		'maintenance-history',
		'maintenance-costs',
		'document-inventory',
		'warranty-expiration',
		'recurring-maintenance',
		'appliance-service',
		'contractor-service-spend',
		'resident-request-lifecycle',
	].includes(reportType);
	const shouldShowDateFilter = DATE_FILTER_REPORTS.has(reportType);

	// Get preview data based on report type
	const previewData = useMemo<any[]>(() => {
		let data: any[] = [];

		if (reportType === 'tasks') {
			data = taskReportRows;
		} else if (reportType === 'overdue-tasks') {
			data = overdueTasks;
		} else if (reportType === 'upcoming-tasks') {
			data = upcomingTasks;
		} else if (reportType === 'maintenance-requests') {
			data = maintenanceRequests;
		} else if (reportType === 'team') {
			data = canAccessTeamReport ? scopedTeamMembers : [];
		} else if (reportType === 'contractors') {
			data = contractorsData;
		} else if (reportType === 'suites') {
			data = suitesData;
		} else if (reportType === 'units') {
			data = unitsData;
		} else if (reportType === 'devices') {
			data = devicesData;
		} else if (reportType === 'maintenance-history') {
			data = maintenanceHistoryData;
		} else if (reportType === 'maintenance-costs') {
			data = canViewFinancialReports ? maintenanceHistoryData : [];
		} else if (reportType === 'tenant-profiles') {
			data = scopedTenantProfiles;
		} else if (reportType === 'employee-efficiency') {
			data = canAccessTeamReport
				? buildEmployeeEfficiencyRows(scopedTeamMembers, taskReportRows)
				: [];
		} else if (reportType === 'team-workload') {
			data = canAccessTeamReport ? teamWorkloadData : [];
		} else if (reportType === 'property-summary') {
			data = buildPropertySummaryRows({
				properties: scopedProperties,
				tasks: taskReportRows,
				maintenanceRequests,
				maintenanceHistory: maintenanceHistoryData,
			});
		} else if (reportType === 'portfolio-overview') {
			data = canAccessPortfolioReports ? portfolioOverviewData : [];
		} else if (reportType === 'document-inventory') {
			data = documentInventoryData;
		} else if (reportType === 'warranty-expiration') {
			data = warrantyExpirationData;
		} else if (reportType === 'recurring-maintenance') {
			data = recurringMaintenanceData;
		} else if (reportType === 'appliance-service') {
			data = applianceServiceData;
		} else if (reportType === 'contractor-service-spend') {
			data = canViewFinancialReports ? contractorServiceSpendData : [];
		} else if (reportType === 'resident-request-lifecycle') {
			data = canAccessTenantReports ? residentRequestLifecycleData : [];
		}

		// Apply filters
		if (reportType === 'maintenance-requests') {
			if (filters.status) {
				data = data.filter((r: any) => r.status === filters.status);
			}
			if (filters.priority) {
				data = data.filter((r: any) => r.priority === filters.priority);
			}
			if (filters.propertyId) {
				data = data.filter((r: any) => r.propertyId === filters.propertyId);
			}
		} else if (shouldShowPropertyFilter && filters.propertyId) {
			data = filterReportRowsByProperty(data, filters.propertyId);
		}

		if (shouldShowDateFilter && (filters.dateFrom || filters.dateTo)) {
			data = data.filter((row: any) => {
				const rowDateValue = getReportRowDateValue(reportType, row);
				if (!rowDateValue) return false;
				const rowDate = new Date(rowDateValue).getTime();
				if (!Number.isFinite(rowDate)) return false;
				if (filters.dateFrom && rowDate < new Date(filters.dateFrom).getTime()) {
					return false;
				}
				if (filters.dateTo && rowDate > new Date(filters.dateTo).getTime()) {
					return false;
				}
				return true;
			});
		}

		if (isHomeowner) {
			data = filterRowsForHomeownerProperties({
				reportType,
				rows: data,
				properties: scopedProperties,
			});
		}

		return data;
	}, [
		reportType,
		shouldShowPropertyFilter,
		shouldShowDateFilter,
		canAccessTeamReport,
		canViewFinancialReports,
		overdueTasks,
		upcomingTasks,
		portfolioOverviewData,
		canAccessTenantReports,
		documentInventoryData,
		warrantyExpirationData,
		recurringMaintenanceData,
		applianceServiceData,
		contractorServiceSpendData,
		residentRequestLifecycleData,
		teamWorkloadData,
		canAccessPortfolioReports,
		isHomeowner,
		taskReportRows,
		maintenanceRequests,
		scopedTeamMembers,
		scopedProperties,
		contractorsData,
		suitesData,
		unitsData,
		devicesData,
		maintenanceHistoryData,
		scopedTenantProfiles,
		filters,
	]);

	const visibleSelectedColumns = useMemo(() => {
		if (!hideEmptyColumns) {
			return selectedColumns;
		}

		return getNonEmptyReportColumns(previewData, selectedColumns);
	}, [hideEmptyColumns, previewData, selectedColumns]);

	const hiddenEmptyColumnCount = selectedColumns.length - visibleSelectedColumns.length;

	// Determine which report types should show maintenance-specific filters
	const shouldShowMaintenanceFilters = reportType === 'maintenance-requests';

	const handleColumnToggle = (column: string) => {
		setSelectedColumns((prev) =>
			prev.includes(column)
				? prev.filter((c) => c !== column)
				: [...prev, column],
		);
	};

	const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.checked) {
			setSelectedColumns(Object.keys(columnOptions));
		} else {
			setSelectedColumns([]);
		}
	};

	const handleDownload = () => {
		if (!reportType || selectedColumns.length === 0) {
			feedback.notify('Please select a report type and at least one column');
			return;
		}

		if (visibleSelectedColumns.length === 0) {
			feedback.notify(
				hideEmptyColumns
					? 'All selected columns are empty for this report. Turn off hide empty columns or select different columns.'
					: 'Please select at least one column with report data.',
			);
			return;
		}

		if (!canAccessReports) {
			feedback.notify(
				isTeamMemberAccount
					? 'Report access is controlled by your assigned role.'
					: nativeApp
						? 'Report access is unavailable here. Manage billing or account access in the web account center.'
						: 'Report access is unavailable for your account right now.',
			);
			return;
		}

		if (!canExportReports) {
			feedback.notify(
				isTeamMemberAccount
					? 'Data export is controlled by your assigned role.'
					: nativeApp
						? 'Data export is unavailable here. Manage billing or account access in the web account center.'
						: 'Data export is unavailable for your account right now.',
			);
			return;
		}

		// Permission guard for team-related reports
		if (TEAM_REPORT_TYPES.has(reportType) && !canAccessTeamReport) {
			feedback.notify('You do not have permission to run this report.');
			return;
		}
		if (reportType === 'employee-efficiency' && !canAccessAdvancedTeamReport) {
			feedback.notify('Employee efficiency reports require advanced team reporting.');
			return;
		}

		if (TENANT_REPORT_TYPES.has(reportType) && !canAccessTenantReports) {
			feedback.notify('This report requires resident access permissions.');
			return;
		}

		if (reportType === 'portfolio-overview' && !canAccessPortfolioReports) {
			feedback.notify('This report requires multi-property reporting.');
			return;
		}

		if (FINANCIAL_REPORT_TYPES.has(reportType) && !canViewFinancialReports) {
			feedback.notify('You do not have permission to run financial reports.');
			return;
		}

		if (!accessibleReports.some((report) => report.value === reportType)) {
			feedback.notify('This report type is not available for your account.');
			return;
		}

		if (exportSimpleCsvReport(reportType, previewData, visibleSelectedColumns)) {
			return;
		}

		switch (reportType) {
			case 'tasks':
				generateTaskReport(previewData, visibleSelectedColumns);
				break;
			case 'overdue-tasks':
				generateTaskReport(previewData, visibleSelectedColumns);
				break;
			case 'upcoming-tasks':
				generateTaskReport(previewData, visibleSelectedColumns);
				break;
			case 'maintenance-requests':
				// use previewData (already filtered/scoped) instead of raw maintenanceRequests
				generateMaintenanceRequestReport(
					previewData,
					visibleSelectedColumns,
					filters.status || filters.priority || filters.propertyId
						? filters
						: undefined,
				);
				break;
			case 'team':
				generateTeamReport(previewData, visibleSelectedColumns);
				break;
			case 'contractors':
				generateContractorReport(previewData, visibleSelectedColumns);
				break;
			case 'suites':
				generateSuiteReport(previewData, visibleSelectedColumns);
				break;
			case 'units':
				generateUnitReport(previewData, visibleSelectedColumns);
				break;
			case 'devices':
				generateDeviceReport(previewData, visibleSelectedColumns);
				break;
			case 'maintenance-history':
				generateMaintenanceHistoryReport(previewData, visibleSelectedColumns);
				break;
			case 'tenant-profiles':
				generateTenantProfileReport(previewData, visibleSelectedColumns);
				break;
			case 'employee-efficiency':
				generateEmployeeEfficiencyReport(previewData, visibleSelectedColumns);
				break;
			case 'property-summary':
				generatePropertySummaryReport(previewData, visibleSelectedColumns);
				break;
		}
	};

	// Check if any queries are loading
	const isLoading =
		tasksLoading ||
		propertiesLoading ||
		teamLoading ||
		maintenanceHistoryLoading ||
		tenantProfilesLoading ||
		contractorsLoading;

	// Get accessible reports for this user
	const accessibleReports = useMemo(
		() =>
			getAccessibleReports(
				canAccessTeamReport,
				canAccessAdvancedTeamReport,
				canAccessTenantReports,
				canAccessPortfolioReports,
				canViewFinancialReports,
				{
					scopedProperties,
					isHomeowner,
					hasMultiFamilyProperties,
					hasCommercialSuites,
				},
			),
		[
			canAccessTeamReport,
			canAccessAdvancedTeamReport,
			canAccessTenantReports,
			canAccessPortfolioReports,
			canViewFinancialReports,
			scopedProperties,
			isHomeowner,
			hasMultiFamilyProperties,
			hasCommercialSuites,
		],
	);

	const discoverableReports = useMemo(
		() =>
			getAccessibleReports(true, true, true, true, true, {
				scopedProperties,
				isHomeowner,
				hasMultiFamilyProperties,
				hasCommercialSuites,
			}),
		[
			scopedProperties,
			isHomeowner,
			hasMultiFamilyProperties,
			hasCommercialSuites,
		],
	);

	// Validate that current report type is still accessible
	const isCurrentReportAccessible = useMemo(
		() =>
			!reportType ||
			accessibleReports.some((r) => r.value === reportType),
		[reportType, accessibleReports],
	);

	const currentReportDescription = useMemo(
		() => getReportDescription(reportType, accessibleReports),
		[reportType, accessibleReports],
	);

	const reportsByCategory = useMemo(() => {
		const grouped = new Map<ReportCategoryId, typeof discoverableReports>();
		REPORT_CATEGORIES.forEach((category) => grouped.set(category.id, []));
		discoverableReports.forEach((report) => {
			const categoryId = REPORT_CATEGORY_BY_TYPE[report.value] || 'tasks';
			grouped.set(categoryId, [...(grouped.get(categoryId) || []), report]);
		});
		return grouped;
	}, [discoverableReports]);

	const visibleCategoryReports = reportsByCategory.get(selectedCategory) || [];
	const selectedReport = accessibleReports.find((report) => report.value === reportType);
	const selectedReportCategory =
		(reportType && REPORT_CATEGORY_BY_TYPE[reportType]) || selectedCategory;

	const selectReport = (nextReportType: ReportType) => {
		setReportType(nextReportType);
		setSelectedColumns([]);
		setFilters({
			status: '',
			priority: '',
			propertyId: '',
			dateFrom: '',
			dateTo: '',
		});
		setHideEmptyColumns(false);
		setShowAdvancedColumns(false);
	};

	useEffect(() => {
		// Keep selected columns in sync when available columns change.
		const availableColumnKeys = new Set(Object.keys(columnOptions));
		setSelectedColumns((prev) => {
			const nextColumns = prev.filter((column) => availableColumnKeys.has(column));
			if (nextColumns.length > 0) {
				return nextColumns;
			}
			return getDefaultColumnsForReport(reportType, columnOptions);
		});
	}, [columnOptions, reportType]);

	return (
		<StandardAppPage>
			<StandardAppPageHeader>
				<StandardAppPageTitleBlock>
					<StandardAppPageTitle>Reports</StandardAppPageTitle>
					<StandardAppPageSubtitle>
						Preview property records and download CSV reports
					</StandardAppPageSubtitle>
				</StandardAppPageTitleBlock>
			</StandardAppPageHeader>

			{isLoading && <InfoMessage>Loading data...</InfoMessage>}
			<ReportBuilderContainer>
				{!canAccessReports && (
					<LockedFeatureCallout
						title={
							isTeamMemberAccount
								? 'Reports are limited by your assigned role'
								: 'Reports are unavailable for your account'
						}
						description={
							isTeamMemberAccount
								? 'Ask the account holder to adjust your role if you need report access.'
								: nativeApp
									? 'You can preview available report types below. Manage billing or account access in the web account center.'
									: 'You can preview available report types below. Check your account access or billing status to generate reports.'
						}
						upgradeLabel='Manage Account'
						showUpgradeAction={!isTeamMemberAccount && !nativeApp}
						compact
					/>
				)}
				<Section>
					<ReportSetupPanel>
						<ReportStepHeader>
							<ReportStepKicker>Step 1</ReportStepKicker>
							<SectionTitle>Choose a Report Category</SectionTitle>
							<ReportStepText>
								Start with the area of the property record you want to review.
							</ReportStepText>
						</ReportStepHeader>
						<ReportCategoryGrid>
							{REPORT_CATEGORIES.map((category) => {
								const categoryReports = reportsByCategory.get(category.id) || [];
								const availableCount = categoryReports.filter((report) =>
									accessibleReports.some((item) => item.value === report.value),
								).length;
								return (
									<ReportCategoryButton
										key={category.id}
										type='button'
										$active={selectedCategory === category.id}
										onClick={() => setSelectedCategory(category.id)}>
										<ReportCategoryTitle>{category.label}</ReportCategoryTitle>
										<ReportCategoryDescription>
											{category.description}
										</ReportCategoryDescription>
										<MobileReportCardMeta>
											{availableCount} available
										</MobileReportCardMeta>
									</ReportCategoryButton>
								);
							})}
						</ReportCategoryGrid>

						<ReportStepHeader>
							<ReportStepKicker>Step 2</ReportStepKicker>
							<SectionTitle>Choose a Report</SectionTitle>
							<ReportStepText>
								Recommended columns are selected automatically.
							</ReportStepText>
						</ReportStepHeader>
						<ReportTemplateGrid>
							{visibleCategoryReports.map((report) => {
								const isAccessible =
									canAccessReports &&
									accessibleReports.some((item) => item.value === report.value);
								const metaLabel = isAccessible
									? report.requiresPortfolioReporting
										? 'Multi-property'
										: report.requiresAdvancedTeamAccess
											? 'Advanced'
											: report.requiresFinancialAccess
												? 'Financial'
												: report.requiresTeamAccess
													? 'Team'
													: 'Available'
									: isTeamMemberAccount
										? 'Role Restricted'
										: nativeApp
											? 'Web Management'
											: 'Unavailable';

								return (
									<MobileReportCard
										key={report.value}
										type='button'
										$active={reportType === report.value}
										$locked={!isAccessible}
										onClick={() => {
											if (!isAccessible) {
												feedback.notify(
													isTeamMemberAccount
														? 'This report is restricted by your role.'
														: 'This report is not available for your account or role.',
												);
												return;
											}
											selectReport(report.value);
										}}>
										<MobileReportCardTitle>{report.label}</MobileReportCardTitle>
										<MobileReportCardDescription>
											{report.description}
										</MobileReportCardDescription>
										<MobileReportCardMeta>{metaLabel}</MobileReportCardMeta>
									</MobileReportCard>
								);
							})}
						</ReportTemplateGrid>
						{visibleCategoryReports.length === 0 && (
							<InfoMessage>
								No reports are available in this category for the current property scope.
							</InfoMessage>
						)}

						{reportType && selectedReport && (
							<SelectedReportSummary>
								<div>
									<SelectedReportTitle>{selectedReport.label}</SelectedReportTitle>
									{currentReportDescription && (
										<SelectedReportMeta>
											{currentReportDescription}
										</SelectedReportMeta>
									)}
									<SelectedReportMeta>
										{REPORT_CATEGORIES.find(
											(category) => category.id === selectedReportCategory,
										)?.label || 'Report'}{' '}
										- {previewData.length} record
										{previewData.length === 1 ? '' : 's'}
									</SelectedReportMeta>
								</div>
								<Button
									type='button'
									variant='secondary'
									onClick={() => {
										setReportType('');
										setSelectedColumns([]);
									}}>
									Change Report
								</Button>
							</SelectedReportSummary>
						)}

						{!isCurrentReportAccessible && reportType && (
							<InfoMessage style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
								This report type is not available for your account.
							</InfoMessage>
						)}

						{reportType && (shouldShowMaintenanceFilters || shouldShowPropertyFilter) && (
							<FilterContainer>
								<ReportStepHeader>
									<ReportStepKicker>Step 3</ReportStepKicker>
									<SectionTitle>Set Scope</SectionTitle>
									<ReportStepText>
										Choose the records to include before previewing.
									</ReportStepText>
								</ReportStepHeader>
								{shouldShowMaintenanceFilters && (
									<>
										<FormGroup>
											<Label>Status</Label>
											<Select
												value={filters.status}
												onChange={(e) =>
													setFilters({ ...filters, status: e.target.value })
												}>
												<option value=''>All Statuses</option>
												<option value='Pending'>Pending</option>
												<option value='Under Review'>Under Review</option>
												<option value='Approved'>Approved</option>
												<option value='Rejected'>Rejected</option>
											</Select>
										</FormGroup>

										<FormGroup>
											<Label>Priority</Label>
											<Select
												value={filters.priority}
												onChange={(e) =>
													setFilters({ ...filters, priority: e.target.value })
												}>
												<option value=''>All Priorities</option>
												<option value='Low'>Low</option>
												<option value='Medium'>Medium</option>
												<option value='High'>High</option>
												<option value='Urgent'>Urgent</option>
											</Select>
										</FormGroup>
									</>
								)}

								{shouldShowPropertyFilter && (
									<FormGroup>
										<Label>Property</Label>
										<Select
											value={filters.propertyId}
											onChange={(e) =>
												setFilters({ ...filters, propertyId: e.target.value })
											}>
											<option value=''>All Properties</option>
											{scopedProperties
												.filter(
													(prop) =>
														!isHomeowner ||
														isSingleFamilyProperty(prop.propertyType),
												)
												.map((prop) => (
													<option key={prop.id} value={prop.id}>
														{prop.title}
													</option>
												))}
										</Select>
									</FormGroup>
								)}
								{shouldShowDateFilter && (
									<FilterRow>
										<FormGroup>
											<Label>From</Label>
											<Input
												type='date'
												value={filters.dateFrom}
												onChange={(e) =>
													setFilters({ ...filters, dateFrom: e.target.value })
												}
											/>
										</FormGroup>
										<FormGroup>
											<Label>To</Label>
											<Input
												type='date'
												value={filters.dateTo}
												onChange={(e) =>
													setFilters({ ...filters, dateTo: e.target.value })
												}
											/>
										</FormGroup>
									</FilterRow>
								)}
							</FilterContainer>
						)}
					</ReportSetupPanel>
				</Section>

				{reportType && (
					<ReportOutputPanel>
						<Section>
							<ReportStepHeader>
								<ReportStepKicker>Step 4</ReportStepKicker>
								<SectionTitle>Preview and Export</SectionTitle>
								<ReportStepText>
									Using {selectedColumns.length} recommended column
									{selectedColumns.length === 1 ? '' : 's'}.
								</ReportStepText>
							</ReportStepHeader>
							<AdvancedColumnsToggle
								type='button'
								onClick={() => setShowAdvancedColumns((value) => !value)}>
								{showAdvancedColumns ? 'Hide custom columns' : 'Customize columns'}
							</AdvancedColumnsToggle>
							{showAdvancedColumns && (
								<>
									<ColumnOptionsStack>
										<SelectAllWrapper>
											<Checkbox
												type='checkbox'
												id='select-all'
												checked={
													selectedColumns.length ===
													Object.keys(columnOptions).length &&
													Object.keys(columnOptions).length > 0
												}
												onChange={handleSelectAll}
											/>
											<SelectAllLabel htmlFor='select-all'>Select All</SelectAllLabel>
										</SelectAllWrapper>
										<ColumnOptionWrapper htmlFor='hide-empty-columns'>
											<Checkbox
												type='checkbox'
												id='hide-empty-columns'
												checked={hideEmptyColumns}
												onChange={(event) =>
													setHideEmptyColumns(event.target.checked)
												}
											/>
											<ColumnOptionText>
												<SelectAllLabel as='span'>
													Hide empty columns
												</SelectAllLabel>
												<ColumnOptionHelp>
													Preview and download only selected columns that have
													values in this report.
													{hideEmptyColumns && hiddenEmptyColumnCount > 0
														? ` Hiding ${hiddenEmptyColumnCount === 1 ? '1 empty column' : `${hiddenEmptyColumnCount} empty columns`}.`
														: ''}
												</ColumnOptionHelp>
											</ColumnOptionText>
										</ColumnOptionWrapper>
									</ColumnOptionsStack>
									<ColumnsGrid>
										{Object.entries(columnOptions).map(([key, label]) => (
											<CheckboxWrapper
												key={key}
												onClick={() => handleColumnToggle(key)}>
												<Checkbox
													type='checkbox'
													id={`col-${key}`}
													checked={selectedColumns.includes(key)}
													onChange={() => handleColumnToggle(key)}
												/>
												<CheckboxLabel htmlFor={`col-${key}`}>
													{label}
												</CheckboxLabel>
											</CheckboxWrapper>
										))}
									</ColumnsGrid>
								</>
							)}
						</Section>

						{previewData.length > 0 && (
							<PreviewSection>
								<SectionTitle>Preview ({previewData.length} records)</SectionTitle>
								<ReportPreview
									data={previewData}
									selectedColumns={visibleSelectedColumns}
									columnOptions={columnOptions}
									emptyColumnsMessage={
										hideEmptyColumns && selectedColumns.length > 0
											? 'All selected columns are empty for this report. Turn off hide empty columns or choose different columns.'
											: 'Select at least one column to preview report details.'
									}
								/>
								{previewData.length > 10 && (
									<InfoMessage>
										Showing first 10 of {previewData.length} records. Download to see
										all data.
									</InfoMessage>
								)}

								<ActionButtons>
									<Button variant='secondary' onClick={() => setReportType('')}>
										Clear
									</Button>
									<Button
										onClick={handleDownload}
										disabled={
											selectedColumns.length === 0 ||
											!canExportReports
										}>
										{!canExportReports
											? isTeamMemberAccount
												? 'Export Restricted'
												: nativeApp
													? 'Manage Account'
													: 'Export Unavailable'
											: 'Download CSV'}
									</Button>
								</ActionButtons>
							</PreviewSection>
						)}

						{previewData.length === 0 && (
							<PreviewSection>
								<EmptyMessage>
									<div>{EMPTY_REPORT_MESSAGES[reportType] || 'No records match this report yet.'}</div>
									<Button variant='secondary' onClick={() => setReportType('')}>
										Choose Another Report
									</Button>
								</EmptyMessage>
							</PreviewSection>
						)}
					</ReportOutputPanel>
				)}
			</ReportBuilderContainer>
		</StandardAppPage>
	);
};
