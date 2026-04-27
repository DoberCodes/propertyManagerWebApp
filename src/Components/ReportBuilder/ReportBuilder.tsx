import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import { canAccessReadOnlyFeatures } from '../../utils/subscriptionUtils';
import {
	selectCanAccessTeam,
	selectCanViewAllPages,
	selectIsHomeowner,
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
	Wrapper,
	PageTitle,
	PageDescription,
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
	PreviewTable,
	Table,
	EmptyMessage,
	ActionButtons,
	Button,
	InfoMessage,
	PageHeader,
	FilterContainer,
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
	EmployeeEfficiencyMetrics,
	PropertySummaryMetrics,
} from '../../utils/csvExport';
import { useGetTasksQuery } from '../../Redux/API/taskSlice';
import { useGetTeamMembersQuery } from '../../Redux/API/teamSlice';

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
	| '';

// Helper to determine which reports a user can access
const getAccessibleReports = (
	canAccessTeamReport: boolean,
	scopedProperties: any[],
): Array<{
	value: ReportType;
	label: string;
	description: string;
	requiresTeamAccess: boolean;
	requiresMultiProperty?: boolean;
}> => {
	const allReports = [
		{
			value: 'tasks' as ReportType,
			label: 'Task Report',
			description: 'Overview of all tasks with details on status, assignments, and dates',
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
			label: 'Devices',
			description: 'Property devices with installation dates, status, and maintenance notes',
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
			requiresMultiProperty: true,
		},
		{
			value: 'units' as ReportType,
			label: 'Units',
			description: 'Individual unit details and occupancy information',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'tenant-profiles' as ReportType,
			label: 'Tenant Profiles',
			description: 'Tenant contact information and lease details',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
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
			requiresMultiProperty: false,
		},
	];

	// Filter reports based on user permissions
	return allReports.filter((report) => {
		// Team reports only for users with team access
		if (report.requiresTeamAccess && !canAccessTeamReport) {
			return false;
		}

		// Multi-property reports not applicable for homeowners or single-property users
		if (report.requiresMultiProperty && scopedProperties.length <= 1) {
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
	const canManageTeam = useSelector(selectCanAccessTeam);
	const canViewPages = useSelector(selectCanViewAllPages);
	const isHomeowner = useSelector(selectIsHomeowner);
	const canAccessTeamReport =
		!!currentUser && (canManageTeam || canViewPages || !!currentUser.accountId);

	// Helper: homeowners may only access Single Family properties in reports
	const isSingleFamilyProperty = (ptype?: string) => {
		if (!ptype) return false;
		const normalized = String(ptype).toLowerCase().replace(/[-_]/g, ' ').trim();
		return normalized.includes('single');
	};
	const [reportType, setReportType] = useState<ReportType>('');
	const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
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

	// Get all units and devices across all properties
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

	// Get column options based on report type
	const columnOptions = useMemo(() => {
		const optionsMap: Record<ReportType, Record<string, string>> = {
			tasks: TASK_COLUMN_OPTIONS,
			'maintenance-requests': MAINTENANCE_REQUEST_COLUMN_OPTIONS,
			team: TEAM_MEMBER_COLUMN_OPTIONS,
			'employee-efficiency': EMPLOYEE_EFFICIENCY_COLUMN_OPTIONS,
			'property-summary': PROPERTY_SUMMARY_COLUMN_OPTIONS,
			contractors: CONTRACTOR_COLUMN_OPTIONS,
			suites: SUITE_COLUMN_OPTIONS,
			units: UNIT_COLUMN_OPTIONS,
			devices: DEVICE_COLUMN_OPTIONS,
			'maintenance-history': MAINTENANCE_HISTORY_COLUMN_OPTIONS,
			'tenant-profiles': TENANT_PROFILE_COLUMN_OPTIONS,
			'': {},
		};
		return optionsMap[reportType];
	}, [reportType]);

	// Determine which report types should show property filter
	const shouldShowPropertyFilter = [
		'tasks',
		'maintenance-requests',
		'contractors',
		'suites',
		'units',
		'devices',
		'maintenance-history',
	].includes(reportType);

	// Get preview data based on report type
	const previewData = useMemo<any[]>(() => {
		let data: any[] = [];

		if (reportType === 'tasks') {
			data = scopedTasks;
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
				'maintenance-requests',
				'contractors',
				'suites',
				'units',
				'devices',
				'maintenance-history',
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

	const handleReportTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
			alert('Please select a report type and at least one column');
			return;
		}

		// Check subscription permissions for export - allow expired users to export
		if (
			currentUser?.subscription &&
			!canAccessReadOnlyFeatures(currentUser.subscription)
		) {
			alert(
				'Your current plan does not include data export. Please upgrade to access this feature.',
			);
			return;
		}

		// Permission guard for team-related reports
		if (
			(reportType === 'team' || reportType === 'employee-efficiency') &&
			!canAccessTeamReport
		) {
			alert('You do not have permission to run this report.');
			return;
		}

		switch (reportType) {
			case 'tasks':
				generateTaskReport(previewData, selectedColumns);
				break;
			case 'maintenance-requests':
				// use previewData (already filtered/scoped) instead of raw maintenanceRequests
				generateMaintenanceRequestReport(
					previewData,
					selectedColumns,
					filters.status || filters.priority || filters.propertyId
						? filters
						: undefined,
				);
				break;
			case 'team':
				generateTeamReport(previewData, selectedColumns);
				break;
			case 'contractors':
				generateContractorReport(previewData, selectedColumns);
				break;
			case 'suites':
				generateSuiteReport(previewData, selectedColumns);
				break;
			case 'units':
				generateUnitReport(previewData, selectedColumns);
				break;
			case 'devices':
				generateDeviceReport(previewData, selectedColumns);
				break;
			case 'maintenance-history':
				generateMaintenanceHistoryReport(previewData, selectedColumns);
				break;
			case 'tenant-profiles':
				generateTenantProfileReport(previewData, selectedColumns);
				break;
			case 'employee-efficiency':
				generateEmployeeEfficiencyReport(previewData, selectedColumns);
				break;
			case 'property-summary':
				generatePropertySummaryReport(previewData, selectedColumns);
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
		() => getAccessibleReports(canAccessTeamReport, scopedProperties),
		[canAccessTeamReport, isHomeowner, scopedProperties],
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

	return (
		<Wrapper>
			<PageHeader>
				<div>
					<PageTitle>Reports & Analytics</PageTitle>
					<PageDescription>
						Build custom reports and download CSV data for analysis
					</PageDescription>
				</div>
			</PageHeader>

			{isLoading && <InfoMessage>Loading data...</InfoMessage>}
			<ReportBuilderContainer>
				{/* Report Type Selection */}
				<Section>
					{' '}
					<SectionTitle>Report Type</SectionTitle>
					<FormGroup>
						<Label>Select Report</Label>
						<Select value={reportType} onChange={handleReportTypeChange}>
							<option value=''>-- Choose a report type --</option>
							{accessibleReports.map((report) => (
								<option key={report.value} value={report.value}>
									{report.label}
									{report.requiresTeamAccess ? ' (Team Management)' : ''}
								</option>
							))}
						</Select>
					</FormGroup>
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
					<PreviewTable>
						<Table>
							<thead>
								<tr>
									{selectedColumns.map((col) => (
										<th key={col}>{columnOptions[col]}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{previewData.slice(0, 10).map((row, idx) => (
									<tr key={idx}>
										{selectedColumns.map((col) => (
											<td key={col}>
												{typeof row[col] === 'object'
													? JSON.stringify(row[col])
													: String(row[col] || '-')}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</Table>
					</PreviewTable>
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
								(currentUser?.subscription
									? !canAccessReadOnlyFeatures(currentUser.subscription)
									: false)
							}>
							{currentUser?.subscription &&
							!canAccessReadOnlyFeatures(currentUser.subscription)
								? 'Upgrade to Export'
								: 'Download CSV'}
						</Button>
					</ActionButtons>
				</PreviewSection>
			)}

			{reportType && previewData.length === 0 && (
				<PreviewSection>
					<EmptyMessage>No data available for this report type</EmptyMessage>
				</PreviewSection>
			)}
		</Wrapper>
	);
};
