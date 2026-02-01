import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/Store/store';
import {
	useGetTasksQuery,
	useGetPropertiesQuery,
	useGetPropertyGroupsQuery,
	useGetTeamMembersQuery,
} from '../../Redux/API/apiSlice';
import {
	FormGroup as LibraryFormGroup,
	FormLabel as LibraryLabel,
	FormSelect as LibrarySelect,
} from '../Library/Forms/FormStyles';
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
	generateTaskReport,
	generateMaintenanceRequestReport,
	generateTeamReport,
	generateEmployeeEfficiencyReport,
	generatePropertySummaryReport,
	EmployeeEfficiencyMetrics,
	PropertySummaryMetrics,
} from '../../utils/csvExport';

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
	| '';

export const ReportBuilder: React.FC = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
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

	const { data: propertyGroups = [], isLoading: groupsLoading } =
		useGetPropertyGroupsQuery();

	const { data: firebaseTeamMembers = [], isLoading: teamLoading } =
		useGetTeamMembersQuery();

	// Filter tasks to get maintenance requests (tasks with specific properties)
	const maintenanceRequests = tasks.filter(
		(t: any) =>
			t.type === 'maintenance' ||
			t.title?.toLowerCase().includes('maintenance'),
	);

	// Build properties list for filters
	const propertiesList = useMemo(() => {
		return properties.map((prop) => ({
			id: prop.id,
			title: prop.title,
		}));
	}, [properties]);

	// Get column options based on report type
	const columnOptions = useMemo(() => {
		const optionsMap: Record<ReportType, Record<string, string>> = {
			tasks: TASK_COLUMN_OPTIONS,
			'maintenance-requests': MAINTENANCE_REQUEST_COLUMN_OPTIONS,
			team: TEAM_MEMBER_COLUMN_OPTIONS,
			'employee-efficiency': EMPLOYEE_EFFICIENCY_COLUMN_OPTIONS,
			'property-summary': PROPERTY_SUMMARY_COLUMN_OPTIONS,
			'': {},
		};
		return optionsMap[reportType];
	}, [reportType]);

	// Get preview data based on report type
	const previewData = useMemo(() => {
		let data: any[] = [];

		if (reportType === 'tasks') {
			data = tasks;
		} else if (reportType === 'maintenance-requests') {
			data = maintenanceRequests;
		} else if (reportType === 'team') {
			data = firebaseTeamMembers;
		} else if (reportType === 'employee-efficiency') {
			// Calculate employee efficiency metrics
			data = firebaseTeamMembers.map((member: any) => {
				const memberTasks = tasks.filter(
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
		} else if (reportType === 'property-summary') {
			// Calculate property summary metrics
			data = properties.map((prop: any) => {
				const propTasks = tasks.filter((t: any) => t.propertyId === prop.id);
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

		// Apply filters if applicable
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
		}

		return data;
	}, [
		reportType,
		tasks,
		maintenanceRequests,
		firebaseTeamMembers,
		properties,
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

		switch (reportType) {
			case 'tasks':
				generateTaskReport(previewData, selectedColumns);
				break;
			case 'maintenance-requests':
				generateMaintenanceRequestReport(
					maintenanceRequests,
					selectedColumns,
					filters.status || filters.priority || filters.propertyId
						? filters
						: undefined,
				);
				break;
			case 'team':
				generateTeamReport(previewData, selectedColumns);
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
		tasksLoading || propertiesLoading || groupsLoading || teamLoading;

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
							<option value='tasks'>Task Report</option>
							<option value='maintenance-requests'>Maintenance Requests</option>
							<option value='team'>Team Members</option>
							<option value='employee-efficiency'>Employee Efficiency</option>
							<option value='property-summary'>Property Summary</option>
						</Select>
					</FormGroup>
					{reportType === 'maintenance-requests' && (
						<FilterContainer>
							<Label style={{ marginTop: '12px' }}>Filters</Label>
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

							<FormGroup>
								<Label>Property</Label>
								<Select
									value={filters.propertyId}
									onChange={(e) =>
										setFilters({ ...filters, propertyId: e.target.value })
									}>
									<option value=''>All Properties</option>
									{properties.map((prop) => (
										<option key={prop.id} value={prop.id}>
											{prop.title}
										</option>
									))}
								</Select>
							</FormGroup>
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
							disabled={selectedColumns.length === 0}>
							Download CSV
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
