import {
	buildApplianceServiceRows,
	buildContractorServiceSpendRows,
	buildDocumentInventoryRows,
	buildMaintenanceRequestRows,
	buildPropertySummaryRows,
	buildRecurringMaintenanceRows,
	buildResidentRequestLifecycleRows,
	buildTeamWorkloadRows,
	canViewTeamReportsForUser,
	getAccessibleReports,
	getAllowedPropertyIdSet,
	normalizeDeviceReportRows,
	normalizeTaskReportRows,
} from './reportDataAdapters';

describe('reportDataAdapters', () => {
	it('filters report availability by role-style capabilities', () => {
		const scopedProperties = [
			{ id: 'property-1', propertyType: 'commercial', hasSuites: true, suites: [{}] },
			{ id: 'property-2', propertyType: 'commercial' },
		];

		const labels = getAccessibleReports(false, false, false, true, false, {
			scopedProperties,
			isHomeowner: false,
			hasMultiFamilyProperties: false,
			hasCommercialSuites: true,
		}).map((report) => report.value);

		expect(labels).toContain('tasks');
		expect(labels).toContain('portfolio-overview');
		expect(labels).not.toContain('team');
		expect(labels).not.toContain('employee-efficiency');
		expect(labels).not.toContain('tenant-profiles');
		expect(labels).not.toContain('maintenance-costs');
	});

	it('keeps unit and suite reports out of active report availability', () => {
		const scopedProperties = [
			{ id: 'property-1', propertyType: 'Commercial', hasSuites: true, suites: [{}] },
			{ id: 'property-2', propertyType: 'Multi-Family', units: [{}] },
		];

		const reportTypes = getAccessibleReports(true, true, true, true, true, {
			scopedProperties,
			isHomeowner: false,
			hasMultiFamilyProperties: true,
			hasCommercialSuites: true,
		}).map((report) => report.value);

		expect(reportTypes).not.toContain('suites');
		expect(reportTypes).not.toContain('units');
	});

	it('allows team reports only for explicit team/page capabilities', () => {
		expect(
			canViewTeamReportsForUser({
				isHomeowner: false,
				canManageTeam: false,
				canViewPages: false,
			}),
		).toBe(false);

		expect(
			canViewTeamReportsForUser({
				isHomeowner: false,
				canManageTeam: true,
				canViewPages: false,
			}),
		).toBe(true);
	});

	it('builds maintenance request rows from real request records only', () => {
		const properties = [
			{
				id: 'property-1',
				title: 'Oak House',
				maintenanceRequests: [
					{
						id: 'request-1',
						title: 'Leaking sink',
						requestedDate: '2026-06-01',
						requestedByEmail: 'resident@example.com',
					},
				],
			},
		];
		const allowedPropertyIdSet = getAllowedPropertyIdSet(properties);

		const rows = buildMaintenanceRequestRows({
			properties,
			allowedPropertyIdSet,
			reduxMaintenanceRequests: [
				{
					id: 'request-2',
					propertyId: 'property-1',
					title: 'Garage door',
					submittedAt: '2026-06-02',
					submittedByName: 'Alex Resident',
				},
				{
					id: 'outside-request',
					propertyId: 'property-2',
					title: 'Out of scope',
				},
			],
		});

		expect(rows).toHaveLength(2);
		expect(rows[0]).toMatchObject({
			id: 'request-1',
			propertyId: 'property-1',
			propertyTitle: 'Oak House',
			submittedAt: '2026-06-01',
			submittedByName: 'resident@example.com',
		});
		expect(rows.map((row) => row.id)).not.toContain('outside-request');
	});

	it('normalizes appliance fields from current and legacy device shapes', () => {
		const rows = normalizeDeviceReportRows(
			[
				{
					id: 'device-1',
					type: 'Water Heater',
					manufacturer: 'Acme',
					installDate: '2025-01-15',
					location: { propertyId: 'property-1', room: 'Basement' },
				},
			],
			[{ id: 'property-1', title: 'Oak House' }],
		);

		expect(rows[0]).toMatchObject({
			propertyId: 'property-1',
			propertyTitle: 'Oak House',
			brand: 'Acme',
			installationDate: '2025-01-15',
			location: 'Basement',
		});
	});

	it('cleans task report rows for homeowner-safe report output', () => {
		const rows = normalizeTaskReportRows(
			[
				{
					id: 'task-1',
					propertyId: 'property-1',
					title: 'Replace filter',
					status: 'Initiated',
					dueDate: '',
					assignedTo: 'eHR80EIAaih2xhwVSYS9oWu7hOL2',
				},
				{
					id: 'task-2',
					propertyId: 'property-1',
					title: 'Inspect roof',
					status: 'Completed',
					dueDate: 'not-a-date',
					assignedTo: { id: 'member-1' },
				},
			],
			[{ id: 'property-1', title: 'Oak House' }],
			[{ id: 'member-1', firstName: 'Alex', lastName: 'Smith' }],
		);

		expect(rows[0]).toMatchObject({
			property: 'Oak House',
			propertyTitle: 'Oak House',
			status: 'Open',
			dueDate: '',
			assignee: '',
		});
		expect(rows[1]).toMatchObject({
			status: 'Completed',
			dueDate: '',
			assignee: 'Alex Smith',
		});
	});

	it('counts property maintenance records from scoped maintenance history', () => {
		const rows = buildPropertySummaryRows({
			properties: [{ id: 'property-1', title: 'Oak House', units: [] }],
			tasks: [{ id: 'task-1', propertyId: 'property-1', status: 'Completed' }],
			maintenanceRequests: [
				{ id: 'request-1', propertyId: 'property-1', status: 'Pending' },
			],
			maintenanceHistory: [
				{ id: 'event-1', propertyId: 'property-1' },
				{ id: 'event-2', propertyTitle: 'Oak House' },
			],
		});

		expect(rows[0]).toMatchObject({
			totalTasks: 1,
			completedTasks: 1,
			maintenanceHistoryCount: 2,
			pendingMaintenanceRequests: 1,
		});
	});

	it('builds document inventory rows from property and related files', () => {
		const rows = buildDocumentInventoryRows({
			properties: [
				{
					id: 'property-1',
					title: 'Oak House',
					documents: [
						{
							id: 'doc-1',
							name: 'Water heater manual',
							documentType: 'manual',
							uploadedAt: '2026-01-01',
							size: 123,
							type: 'application/pdf',
							links: { assetIds: ['device-1'] },
						},
					],
				},
			],
			devices: [],
			tasks: [],
			maintenanceHistory: [],
			maintenanceRequests: [],
		});

		expect(rows[0]).toMatchObject({
			propertyTitle: 'Oak House',
			documentName: 'Water heater manual',
			documentType: 'manual',
			source: 'Property',
			linkedApplianceCount: 1,
		});
	});

	it('builds recurring maintenance rows from recurring tasks', () => {
		const rows = buildRecurringMaintenanceRows([
			{
				id: 'task-1',
				propertyId: 'property-1',
				propertyTitle: 'Oak House',
				title: 'Replace filter',
				isRecurring: true,
				recurrenceFrequency: 'monthly',
				dueDate: '2099-01-01',
				enableNotifications: true,
				devices: ['device-1'],
			},
			{ id: 'task-2', title: 'One-time task' },
		]);

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			title: 'Replace filter',
			recurrenceFrequency: 'monthly',
			nextDueDate: '2099-01-01',
			reminderEnabled: 'Yes',
			applianceCount: 1,
		});
	});

	it('builds appliance service rows from linked tasks and maintenance records', () => {
		const rows = buildApplianceServiceRows({
			properties: [{ id: 'property-1', title: 'Oak House' }],
			devices: [
				{
					id: 'device-1',
					type: 'Water Heater',
					location: { propertyId: 'property-1' },
					maintenanceHistory: [{ date: '2026-02-01', description: 'Flush' }],
					files: [{ name: 'manual.pdf' }],
				},
			],
			tasks: [
				{
					id: 'task-1',
					propertyId: 'property-1',
					devices: ['device-1'],
					status: 'Pending',
					dueDate: '2099-01-01',
				},
			],
			maintenanceHistory: [
				{
					id: 'event-1',
					propertyId: 'property-1',
					deviceIds: ['device-1'],
					completionDate: '2026-03-01',
				},
			],
		});

		expect(rows[0]).toMatchObject({
			propertyTitle: 'Oak House',
			applianceSystem: 'Water Heater',
			serviceCount: 2,
			openTasks: 1,
			documentsAttached: 1,
			lastServiceDate: '2026-03-01',
		});
	});

	it('builds contractor service and spend rows from matched work', () => {
		const rows = buildContractorServiceSpendRows({
			contractors: [{ id: 'contractor-1', name: 'Acme Service' }],
			tasks: [
				{
					id: 'task-1',
					assignedTo: 'Acme Service',
					status: 'Completed',
					completionDate: '2026-04-01',
					estimatedTotal: 100,
					actualTotal: 125,
				},
			],
			maintenanceHistory: [
				{
					id: 'event-1',
					completedByName: 'Acme Service',
					completionDate: '2026-05-01',
					estimatedTotal: 50,
					actualTotal: 60,
				},
			],
		});

		expect(rows[0]).toMatchObject({
			contractorName: 'Acme Service',
			completedJobs: 2,
			lastServiceDate: '2026-05-01',
			estimatedTotal: 150,
			actualTotal: 185,
			linkedMaintenanceRecords: 1,
			linkedTasks: 1,
		});
	});

	it('builds resident request lifecycle rows with conversion timing', () => {
		const rows = buildResidentRequestLifecycleRows(
			[
				{
					id: 'request-1',
					propertyId: 'property-1',
					propertyTitle: 'Oak House',
					title: 'Leaking sink',
					submittedAt: '2026-06-01',
					convertedToTaskId: 'task-1',
					status: 'Converted to Task',
				},
			],
			[{ id: 'task-1', createdAt: '2026-06-03', completionDate: '2026-06-05' }],
		);

		expect(rows[0]).toMatchObject({
			title: 'Leaking sink',
			convertedToTaskId: 'task-1',
			timeToConversionDays: 2,
			completedDate: '2026-06-05',
		});
	});

	it('builds team workload rows from flexible task assignment shapes', () => {
		const rows = buildTeamWorkloadRows(
			[{ id: 'member-1', firstName: 'Alex', lastName: 'Smith', email: 'alex@example.com' }],
			[
				{
					id: 'task-1',
					propertyId: 'property-1',
					assignedTo: { id: 'member-1', name: 'Alex Smith' },
					status: 'Pending',
					dueDate: '2099-01-01',
				},
				{
					id: 'task-2',
					propertyId: 'property-1',
					assignedToEmail: 'alex@example.com',
					status: 'Completed',
					dueDate: '2026-01-01',
				},
			],
		);

		expect(rows[0]).toMatchObject({
			firstName: 'Alex',
			assignedPropertyCount: 1,
			openTasks: 1,
			completedTasks: 1,
		});
	});
});
