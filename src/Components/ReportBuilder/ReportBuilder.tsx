import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import {
	canAccessReadOnlyFeatures,
	canExportData,
	canPortfolioReporting,
	canUseAdvancedTeamManagement,
	canViewTenantInfo,
	canViewReports,
} from '../../utils/subscriptionUtils';
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
	MobileReportGrid,
	MobileReportCard,
	MobileReportCardTitle,
	MobileReportCardDescription,
	MobileReportCardMeta,
	DesktopReportSelect,
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
	EmployeeEfficiencyMetrics,
	PropertySummaryMetrics,
} from '../../utils/csvExport';
import { useGetTasksQuery } from '../../Redux/API/taskSlice';
import { useGetTeamMembersQuery } from '../../Redux/API/teamSlice';
import { useAppFeedback } from '../Library/AppFeedback/AppFeedbackProvider';
import { LockedFeatureCallout } from '../Library/LockedFeatureCallout';
import { ReportPreview } from './ReportPreview';
import { getNonEmptyReportColumns } from './reportPreviewUtils';
import { isNativeApp } from '../../utils/platform';

// Alias Library components to match local naming convention
const FormGroup = LibraryFormGroup;
const Label = LibraryLabel;
const Select = LibrarySelect;

type ReportType =
	| 'tasks'
	| 'maintenance-requests'
	| 'team'
	| 'employee-efficiency'
	| 'property-summary'
	| 'contractors'
	| 'suites'
	| 'units'
	| 'devices'
	| 'maintenance-history'
	| 'tenant-profiles'
	| 'overdue-tasks'
	| 'upcoming-tasks'
	| 'maintenance-costs'
	| 'portfolio-overview'
	| '';

type ReportOption = {
	value: ReportType;
	label: string;
	description: string;
	requiresTeamAccess: boolean;
	requiresMultiProperty?: boolean;
	requiresMultiFamily?: boolean;
	requiresCommercialSuites?: boolean;
	requiresAdvancedTeamAccess?: boolean;
	requiresTenantInfoAccess?: boolean;
	requiresPortfolioReporting?: boolean;
};

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

// Helper to determine which reports a user can access
const getAccessibleReports = (
	canAccessTeamReport: boolean,
	canAccessAdvancedTeamReport: boolean,
	canAccessTenantReports: boolean,
	canAccessPortfolioReports: boolean,
	options: {
		scopedProperties: any[];
		isHomeowner: boolean;
		hasMultiFamilyProperties: boolean;
		hasCommercialSuites: boolean;
	},
): ReportOption[] => {
	const {
		scopedProperties,
		isHomeowner,
		hasMultiFamilyProperties,
		hasCommercialSuites,
	} = options;

	const allReports: ReportOption[] = [
		{
			value: 'tasks' as ReportType,
			label: 'Task Report',
			description: 'Overview of all tasks with details on status, assignments, and dates',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'overdue-tasks' as ReportType,
			label: 'Overdue Tasks',
			description: 'Past-due tasks that still need attention',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'upcoming-tasks' as ReportType,
			label: 'Upcoming Tasks',
			description: 'Tasks due in the next 30 days for proactive planning',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'maintenance-requests' as ReportType,
			label: 'Maintenance Requests',
			description: 'Submitted maintenance requests with status and priority',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'contractors' as ReportType,
			label: 'Contractors',
			description: 'List of contractors and their service history',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'devices' as ReportType,
			label: 'Appliances',
			description: 'Property appliances with installation dates, status, and maintenance notes',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'maintenance-history' as ReportType,
			label: 'Maintenance History',
			description: 'Historical record of all completed maintenance work',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'property-summary' as ReportType,
			label: 'Property Summary',
			description: 'Overview metrics for each property including occupancy and tasks',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'suites' as ReportType,
			label: 'Suites',
			description: 'Detailed suite information across properties',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
			requiresCommercialSuites: true,
		},
		// Units are temporarily hidden from the app flow while the core loop is simplified.
		// {
		// 	value: 'units' as ReportType,
		// 	label: 'Units',
		// 	description: 'Individual unit details and occupancy information',
		// 	requiresTeamAccess: false,
		// 	requiresMultiProperty: false,
		// 	requiresMultiFamily: true,
		// },
		{
			value: 'tenant-profiles' as ReportType,
			label: 'Tenant Profiles',
			description: 'Tenant contact information and lease details',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
			requiresTenantInfoAccess: true,
		},
		{
			value: 'maintenance-costs' as ReportType,
			label: 'Maintenance Costs',
			description: 'Estimated versus actual maintenance spend by record',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'portfolio-overview' as ReportType,
			label: 'Portfolio Overview',
			description: 'Portfolio-wide KPI snapshot for operational reporting',
			requiresTeamAccess: false,
			requiresMultiProperty: true,
			requiresPortfolioReporting: true,
		},
		{
			value: 'team' as ReportType,
			label: 'Team Members',
			description: 'Team member information and contact details (Team Management)',
			requiresTeamAccess: true,
			requiresMultiProperty: false,
		},
		{
			value: 'employee-efficiency' as ReportType,
			label: 'Employee Efficiency',
			description: 'Performance metrics for team members (Team Management)',
			requiresTeamAccess: true,
			requiresAdvancedTeamAccess: true,
			requiresMultiProperty: false,
		},
	];

	// Filter reports based on user permissions
	return allReports.filter((report) => {
		if (isHomeowner) {
			// Homeowner plans are restricted to single-family report options.
			if (
				report.value === 'maintenance-requests' ||
				report.value === 'suites' ||
				report.value === 'units' ||
				report.value === 'tenant-profiles' ||
				report.value === 'team' ||
				report.value === 'employee-efficiency'
			) {
				return false;
			}
		}

		// Team reports only for users with team access
		if (report.requiresTeamAccess && !canAccessTeamReport) {
			return false;
		}
		if (report.requiresAdvancedTeamAccess && !canAccessAdvancedTeamReport) {
			return false;
		}

		if (report.requiresTenantInfoAccess && !canAccessTenantReports) {
			return false;
		}

		if (report.requiresPortfolioReporting && !canAccessPortfolioReports) {
			return false;
		}

		// Multi-property reports not applicable for homeowners or single-property users
		if (report.requiresMultiProperty && scopedProperties.length <= 1) {
			return false;
		}

		if (report.requiresMultiFamily && !hasMultiFamilyProperties) {
			return false;
		}

		if (report.requiresCommercialSuites && !hasCommercialSuites) {
			return false;
		}

		return true;
	});
};

// Helper to get description for a report type
const getReportDescription = (
	reportType: ReportType,
	accessibleReports: ReturnType<typeof getAccessibleReports>,
): string => {
	const report = accessibleReports.find((r) => r.value === reportType);
	return report?.description || '';
};

export const ReportBuilder: React.FC = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const canAccessReports =
		!!currentUser?.subscription && canViewReports(currentUser.subscription as any);
	const canExportReports =
		!!currentUser?.subscription &&
		canAccessReadOnlyFeatures(currentUser.subscription as any) &&
		canExportData(currentUser.subscription as any);
	const canManageTeam = useSelector(selectCanAccessTeam);
	const canManageTenantsPermission = useSelector(selectCanManageTenants);
	const canViewPages = useSelector(selectCanViewAllPages);
	const isHomeowner = useSelector(selectIsHomeowner);
	const isTeamMemberAccount = useSelector(selectIsTeamMemberAccount);
	const canAccessTeamReport =
		!!currentUser &&
		!isHomeowner &&
		(canManageTeam || canViewPages || !!currentUser.accountId);
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
	const feedback = useAppFeedback();
	const nativeApp = isNativeApp();

	// Helper: homeowners may only access Single Family properties in reports
	const isSingleFamilyProperty = (ptype?: string) => {
		if (!ptype) return false;
		const normalized = String(ptype).toLowerCase().replace(/[-_]/g, ' ').trim();
		return normalized.includes('single');
	};
	const [reportType, setReportType] = useState<ReportType>('');
	const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
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

	const activeAccountId = String(currentUser?.accountId || currentUser?.id || '').trim();

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
		() => new Set(scopedProperties.map((property: any) => property.id)),
		[scopedProperties],
	);

	const scopedTasks = useMemo(() => {
		return tasks.filter((task: any) => {
			const taskAccountId = String(task.accountId || '').trim();
			return (
				(taskAccountId && taskAccountId === activeAccountId) ||
				allowedPropertyIdSet.has(task.propertyId)
			);
		});
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
		return allMaintenanceHistory.filter((record: any) => {
			const recordAccountId = String(record.accountId || '').trim();
			return (
				(recordAccountId && recordAccountId === activeAccountId) ||
				allowedPropertyIdSet.has(record.propertyId)
			);
		});
	}, [allMaintenanceHistory, activeAccountId, allowedPropertyIdSet]);

	const scopedTenantProfiles = useMemo(() => {
		return publicTenantProfiles.filter((profile: any) => {
			const profileAccountId = String(profile.accountId || '').trim();
			return (
				(profileAccountId && profileAccountId === activeAccountId) ||
				allowedPropertyIdSet.has(profile.propertyId)
			);
		});
	}, [publicTenantProfiles, activeAccountId, allowedPropertyIdSet]);

	const scopedContractors = useMemo(() => {
		return contractors.filter((contractor: any) => {
			const contractorAccountId = String(contractor.accountId || '').trim();
			return (
				(contractorAccountId && contractorAccountId === activeAccountId) ||
				allowedPropertyIdSet.has(contractor.propertyId)
			);
		});
	}, [contractors, activeAccountId, allowedPropertyIdSet]);

	const scopedUnits = useMemo(() => {
		return allUnits.filter((unit: any) => {
			const unitAccountId = String(unit.accountId || '').trim();
			return (
				(unitAccountId && unitAccountId === activeAccountId) ||
				allowedPropertyIdSet.has(unit.propertyId)
			);
		});
	}, [allUnits, activeAccountId, allowedPropertyIdSet]);

	const scopedDevices = useMemo(() => {
		return allDevices.filter((device: any) => {
			const deviceAccountId = String(device.accountId || '').trim();
			const propertyId = device.location?.propertyId;
			return (
				(deviceAccountId && deviceAccountId === activeAccountId) ||
				allowedPropertyIdSet.has(propertyId)
			);
		});
	}, [allDevices, activeAccountId, allowedPropertyIdSet]);

	const suitesData = useMemo(() => {
		const allSuites: any[] = [];
		scopedProperties.forEach((property: any) => {
			if (property.hasSuites && property.suites) {
				property.suites.forEach((suite: any) => {
					allSuites.push({
						...suite,
						propertyTitle: property.title,
						propertyId: property.id,
					});
				});
			}
		});
		return allSuites;
	}, [scopedProperties]);

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

	const unitsData = useMemo(() => {
		return scopedUnits.map((unit: any) => {
			const property = scopedProperties.find((p: any) => p.id === unit.propertyId);
			return {
				...unit,
				propertyTitle: property?.title || 'Unknown Property',
				propertyId: unit.propertyId,
			};
		});
	}, [scopedUnits, scopedProperties]);

	const devicesData = useMemo(() => {
		return scopedDevices.map((device: any) => {
			const property = scopedProperties.find(
				(p: any) => p.id === device.location?.propertyId,
			);
			return {
				...device,
				propertyTitle: property?.title || 'Unknown Property',
				propertyId: device.location?.propertyId,
			};
		});
	}, [scopedDevices, scopedProperties]);

	const contractorsData = useMemo(() => {
		return scopedContractors.map((contractor: any) => {
			const property = scopedProperties.find(
				(p: any) => p.id === contractor.propertyId,
			);
			return {
				...contractor,
				propertyTitle: property?.title || 'Unknown Property',
			};
		});
	}, [scopedContractors, scopedProperties]);

	// Filter tasks to get maintenance requests (tasks with specific properties)
	const maintenanceRequests = scopedTasks.filter(
		(t: any) =>
			t.type === 'maintenance' ||
			t.title?.toLowerCase().includes('maintenance'),
	);

	const overdueTasks = useMemo(() => {
		const now = new Date();
		return scopedTasks
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
	}, [scopedTasks]);

	const upcomingTasks = useMemo(() => {
		const now = new Date();
		const horizon = new Date();
		horizon.setDate(now.getDate() + 30);

		return scopedTasks
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
	}, [scopedTasks]);

	const maintenanceCostsData = useMemo(() => {
		return scopedMaintenanceHistory.map((record: any) => {
			const estimate = record.financials?.estimate;
			const actual = record.financials?.actual;
			const estimatedTotal =
				(estimate?.contractorCost || 0) +
				(estimate?.materialsCost || 0) +
				(estimate?.laborCost || 0) +
				(estimate?.otherCost || 0);
			const actualTotal =
				(actual?.contractorCost || 0) +
				(actual?.materialsCost || 0) +
				(actual?.laborCost || 0) +
				(actual?.otherCost || 0);

			return {
				...record,
				estimatedTotal,
				actualTotal,
				finalTotal: actualTotal || estimatedTotal,
				financialNotes: record.financials?.notes || '',
			};
		});
	}, [scopedMaintenanceHistory]);

	const portfolioOverviewData = useMemo(() => {
		const totalTasks = scopedTasks.length;
		const completedTaskCount = scopedTasks.filter(
			(task: any) => String(task.status || '').toLowerCase() === 'completed',
		).length;
		const pendingTaskCount = scopedTasks.filter(
			(task: any) => String(task.status || '').toLowerCase() !== 'completed',
		).length;
		const completionRate =
			totalTasks > 0 ? Math.round((completedTaskCount / totalTasks) * 100) : 0;

		return [
			{
				propertyCount: scopedProperties.length,
				taskCount: totalTasks,
				completedTaskCount,
				pendingTaskCount,
				maintenanceRecordCount: scopedMaintenanceHistory.length,
				requestCount: maintenanceRequests.length,
				completionRate,
			},
		];
	}, [scopedProperties, scopedTasks, scopedMaintenanceHistory, maintenanceRequests]);

	// Get column options based on report type
	const columnOptions = useMemo(() => {
		const optionsMap: Record<ReportType, Record<string, string>> = {
			tasks: TASK_COLUMN_OPTIONS,
			'overdue-tasks': OVERDUE_TASK_COLUMN_OPTIONS,
			'upcoming-tasks': UPCOMING_TASK_COLUMN_OPTIONS,
			'maintenance-requests': MAINTENANCE_REQUEST_COLUMN_OPTIONS,
			team: TEAM_MEMBER_COLUMN_OPTIONS,
			'employee-efficiency': EMPLOYEE_EFFICIENCY_COLUMN_OPTIONS,
			'property-summary': PROPERTY_SUMMARY_COLUMN_OPTIONS,
			'maintenance-costs': MAINTENANCE_COST_COLUMN_OPTIONS,
			'portfolio-overview': PORTFOLIO_OVERVIEW_COLUMN_OPTIONS,
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

		return availableOptions;
	}, [
		reportType,
		hasMultiFamilyProperties,
		hasCommercialSuites,
		isHomeowner,
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
	].includes(reportType);

	// Get preview data based on report type
	const previewData = useMemo<any[]>(() => {
		let data: any[] = [];

		if (reportType === 'tasks') {
			data = scopedTasks;
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
			data = scopedMaintenanceHistory;
		} else if (reportType === 'maintenance-costs') {
			data = maintenanceCostsData;
		} else if (reportType === 'tenant-profiles') {
			data = scopedTenantProfiles;
		} else if (reportType === 'employee-efficiency') {
			// Calculate employee efficiency metrics (restricted to users who can access team)
			if (!canAccessTeamReport) {
				data = [];
			} else {
				data = scopedTeamMembers.map((member: any) => {
					const memberTasks = scopedTasks.filter(
						(t: any) => t.assignedTo === member.id,
					);
					const completed = memberTasks.filter(
						(t: any) => t.status === 'Completed',
					);

					const avgDays =
						memberTasks.length > 0
							? memberTasks
								.filter((t: any) => t.completionDate && t.dueDate)
								.reduce((acc: number, t: any) => {
									const due = new Date(t.dueDate).getTime();
									const comp = new Date(t.completionDate!).getTime();
									return acc + (comp - due) / (1000 * 60 * 60 * 24);
								}, 0) / memberTasks.length
							: 0;

					return {
						employeeId: member.id as any,
						firstName: member.firstName,
						lastName: member.lastName,
						email: member.email,
						title: member.title,
						totalTasksAssigned: memberTasks.length,
						tasksCompleted: completed.length,
						tasksInProgress: memberTasks.filter(
							(t: any) => t.status === 'In Progress',
						).length,
						tasksPending: memberTasks.filter((t: any) => t.status === 'Pending')
							.length,
						completionRate:
							memberTasks.length > 0
								? Math.round((completed.length / memberTasks.length) * 100)
								: 0,
						averageCompletionDays: Math.round(avgDays),
						lastTaskCompletionDate:
							completed.length > 0
								? new Date(
									completed[completed.length - 1].completionDate!,
								).toLocaleDateString()
								: 'N/A',
					} as EmployeeEfficiencyMetrics;
				});
			}
		} else if (reportType === 'property-summary') {
			// Calculate property summary metrics
			data = scopedProperties.map((prop: any) => {
				const propTasks = scopedTasks.filter((t: any) => t.propertyId === prop.id);
				const propRequests = maintenanceRequests.filter(
					(r: any) => r.propertyId === prop.id,
				);

				let totalUnits = 0;
				let occupiedUnits = 0;
				let totalOccupants = 0;

				if (prop.units) {
					totalUnits = prop.units.length;
					occupiedUnits = prop.units.filter(
						(u: any) => (u.occupants || []).length > 0,
					).length;
					totalOccupants = prop.units.reduce(
						(sum: number, u: any) => sum + (u.occupants || []).length,
						0,
					);
				}

				return {
					propertyId: prop.id as any,
					propertyTitle: prop.title,
					address: prop.address || 'N/A',
					owner: prop.owner || 'N/A',
					propertyType: prop.propertyType || 'Unknown',
					totalUnits,
					occupiedUnits,
					totalTenants: totalOccupants,
					totalTasks: propTasks.length,
					completedTasks: propTasks.filter((t: any) => t.status === 'Completed')
						.length,
					maintenanceHistoryCount: (prop.taskHistory || []).length,
					pendingMaintenanceRequests: propRequests.filter(
						(r: any) => r.status === 'Pending',
					).length,
					approvedMaintenanceRequests: propRequests.filter(
						(r: any) => r.status === 'Approved',
					).length,
				} as PropertySummaryMetrics;
			});
		} else if (reportType === 'portfolio-overview') {
			data = canAccessPortfolioReports ? portfolioOverviewData : [];
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
			// Apply property filter to other report types that have property data
			data = data.filter((item: any) => item.propertyId === filters.propertyId);
		}

		// Enforce homeowner restriction: homeowners may only see Single Family property data
		if (isHomeowner) {
			const propertyRelatedReports: ReportType[] = [
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
				'property-summary',
			];

			if (propertyRelatedReports.includes(reportType)) {
				data = data.filter((item: any) => {
					// property-summary items are property objects with propertyType
					if (reportType === 'property-summary' && item.propertyType) {
						return isSingleFamilyProperty(item.propertyType);
					}

					// Items that directly include a propertyType
					if (item.propertyType)
						return isSingleFamilyProperty(item.propertyType);

					// Try common property id locations
					const propId =
						item.propertyId ||
						item.location?.propertyId ||
						item.property?.id ||
						item.propertyId;
					if (!propId) return false; // exclude items not tied to a property

					const prop = scopedProperties.find((p: any) => p.id === propId);
					if (!prop) return false;
					return isSingleFamilyProperty(prop.propertyType);
				});
			}
		}

		return data;
	}, [
		reportType,
		shouldShowPropertyFilter,
		canAccessTeamReport,
		overdueTasks,
		upcomingTasks,
		maintenanceCostsData,
		portfolioOverviewData,
		canAccessPortfolioReports,
		isHomeowner,
		scopedTasks,
		maintenanceRequests,
		scopedTeamMembers,
		scopedProperties,
		contractorsData,
		suitesData,
		unitsData,
		devicesData,
		scopedMaintenanceHistory,
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

	const handleReportTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		if (!canAccessReports) {
			feedback.notify(
				isTeamMemberAccount
					? 'Report access is controlled by your assigned role.'
					: 'Report access is locked on your current plan.',
			);
			return;
		}
		setReportType(e.target.value as ReportType);
		setSelectedColumns([]);
		setFilters({
			status: '',
			priority: '',
			propertyId: '',
			dateFrom: '',
			dateTo: '',
		});
	};

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
						? 'Your current plan does not include report access here. Manage this in the web account center.'
						: 'Your current plan does not include report access. Please upgrade to continue.',
			);
			return;
		}

		// Check subscription permissions for export - allow expired users to export
		if (!canExportReports) {
			feedback.notify(
				isTeamMemberAccount
					? 'Data export is controlled by your assigned role.'
					: nativeApp
						? 'Your current plan does not include data export here. Manage this in the web account center.'
						: 'Your current plan does not include data export. Please upgrade to access this feature.',
			);
			return;
		}

		// Permission guard for team-related reports
		if (
			(reportType === 'team' || reportType === 'employee-efficiency') &&
			!canAccessTeamReport
		) {
			feedback.notify('You do not have permission to run this report.');
			return;
		}
		if (reportType === 'employee-efficiency' && !canAccessAdvancedTeamReport) {
			feedback.notify('Employee efficiency reports require Portfolio.');
			return;
		}

		if (reportType === 'tenant-profiles' && !canAccessTenantReports) {
			feedback.notify('Tenant profile reports require tenant access permissions.');
			return;
		}

		if (reportType === 'portfolio-overview' && !canAccessPortfolioReports) {
			feedback.notify('Portfolio overview reports require the Portfolio plan.');
			return;
		}

		if (!accessibleReports.some((report) => report.value === reportType)) {
			feedback.notify('This report type is not available for your account.');
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
			case 'maintenance-costs':
				exportToCSV({
					filename: `maintenance-costs-${new Date().toISOString().split('T')[0]}.csv`,
					data: previewData,
					columns: visibleSelectedColumns,
				});
				break;
			case 'tenant-profiles':
				generateTenantProfileReport(previewData, visibleSelectedColumns);
				break;
			case 'portfolio-overview':
				exportToCSV({
					filename: `portfolio-overview-${new Date().toISOString().split('T')[0]}.csv`,
					data: previewData,
					columns: visibleSelectedColumns,
				});
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
			scopedProperties,
			isHomeowner,
			hasMultiFamilyProperties,
			hasCommercialSuites,
		],
	);

	const discoverableReports = useMemo(
		() =>
			getAccessibleReports(true, true, true, true, {
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

	useEffect(() => {
		// Keep selected columns in sync when available columns change.
		const availableColumnKeys = new Set(Object.keys(columnOptions));
		setSelectedColumns((prev) =>
			prev.filter((column) => availableColumnKeys.has(column)),
		);
	}, [columnOptions]);

	return (
		<StandardAppPage>
			<StandardAppPageHeader>
				<StandardAppPageTitleBlock>
					<StandardAppPageTitle>Reports & Analytics</StandardAppPageTitle>
					<StandardAppPageSubtitle>
						Build custom reports and download CSV data for analysis
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
								: 'Reports are locked on your current plan'
						}
						description={
							isTeamMemberAccount
								? 'Ask the account holder to adjust your role if you need report access.'
								: nativeApp
									? 'You can preview available report types below. Manage report access in the web account center.'
									: 'You can preview available report types below. Upgrade to Property or Portfolio to generate and review reports.'
						}
						upgradeLabel='Upgrade for Reports'
						showUpgradeAction={!isTeamMemberAccount}
						compact
					/>
				)}
				{/* Report Type Selection */}
				<Section>
					{' '}
					<SectionTitle>Report Type</SectionTitle>
					<MobileReportGrid>
						{discoverableReports.map((report) => {
							const isAccessible =
								canAccessReports &&
								accessibleReports.some((item) => item.value === report.value);
							const metaLabel = isAccessible
								? report.requiresPortfolioReporting
									? 'Portfolio'
									: report.requiresAdvancedTeamAccess
										? 'Advanced'
										: report.requiresTeamAccess
											? 'Team'
											: 'Available'
								: isTeamMemberAccount
									? 'Role Restricted'
									: nativeApp
										? 'Web Management'
										: 'Upgrade Required';

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
													: 'This report requires a higher plan or permission.',
											);
											return;
										}

										setReportType(report.value);
										setSelectedColumns([]);
										setFilters({
											status: '',
											priority: '',
											propertyId: '',
											dateFrom: '',
											dateTo: '',
										});
									}}>
									<MobileReportCardTitle>{report.label}</MobileReportCardTitle>
									<MobileReportCardDescription>
										{report.description}
									</MobileReportCardDescription>
									<MobileReportCardMeta>{metaLabel}</MobileReportCardMeta>
								</MobileReportCard>
							);
						})}
					</MobileReportGrid>
					<DesktopReportSelect>
						<FormGroup>
							<Label>Select Report</Label>
							<Select value={reportType} onChange={handleReportTypeChange} disabled={!canAccessReports}>
								<option value=''>-- Choose a report type --</option>
								{discoverableReports.map((report) => {
									const isAccessible =
										canAccessReports &&
										accessibleReports.some((item) => item.value === report.value);
									return (
										<option key={report.value} value={report.value} disabled={!isAccessible}>
											{report.label}
											{report.requiresTeamAccess ? ' (Team Management)' : ''}
											{!isAccessible
												? isTeamMemberAccount
													? ' - Role restricted'
													: nativeApp
														? ' - Web management'
														: ' - Upgrade required'
												: ''}
										</option>
									);
								})}
							</Select>
						</FormGroup>
					</DesktopReportSelect>
					{reportType && currentReportDescription && (
						<div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
							{currentReportDescription}
						</div>
					)}
					{!isCurrentReportAccessible && reportType && (
						<InfoMessage style={{ backgroundColor: '#fef3c7', color: '#92400e', marginTop: '12px' }}>
							This report type is not available for your account.
						</InfoMessage>
					)}
					{(shouldShowMaintenanceFilters || shouldShowPropertyFilter) && (
						<FilterContainer>
							<Label style={{ marginTop: '12px' }}>Filters</Label>
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
						</FilterContainer>
					)}
					{reportType && (
						<InfoMessage>
							Found {previewData.length} record(s) for this report type
						</InfoMessage>
					)}
				</Section>

				{/* Column Selection */}
				{reportType && (
					<Section>
						<SectionTitle>Select Columns</SectionTitle>
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
										Preview and download only selected columns that have values
										in this report.
										{hideEmptyColumns && hiddenEmptyColumnCount > 0
											? ` Hiding ${hiddenEmptyColumnCount} empty column${hiddenEmptyColumnCount === 1 ? '' : 's'}.`
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
									<CheckboxLabel htmlFor={`col-${key}`}>{label}</CheckboxLabel>
								</CheckboxWrapper>
							))}
						</ColumnsGrid>
					</Section>
				)}
			</ReportBuilderContainer>

			{/* Preview Section */}
			{reportType && previewData.length > 0 && (
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
										? 'Manage in Browser'
										: 'Upgrade to Export'
								: 'Download CSV'}
						</Button>
					</ActionButtons>
				</PreviewSection>
			)}

			{reportType && previewData.length === 0 && (
				<PreviewSection>
					<EmptyMessage>
						<div>No data available for this report type yet.</div>
						<Button variant='secondary' onClick={() => setReportType('')}>
							Choose Another Report
						</Button>
					</EmptyMessage>
				</PreviewSection>
			)}
		</StandardAppPage>
	);
};
