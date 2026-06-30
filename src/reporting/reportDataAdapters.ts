import { calculateCostTotal } from '../utils/financialUtils';

export type ReportType =
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
	| 'document-inventory'
	| 'warranty-expiration'
	| 'recurring-maintenance'
	| 'appliance-service'
	| 'contractor-service-spend'
	| 'resident-request-lifecycle'
	| 'team-workload'
	| '';

export type ReportOption = {
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
	requiresFinancialAccess?: boolean;
};

export const FINANCIAL_COLUMN_KEYS = new Set([
	'estimateContractorCost',
	'estimateMaterialsCost',
	'estimateLaborCost',
	'estimateOtherCost',
	'estimatedTotal',
	'actualContractorCost',
	'actualMaterialsCost',
	'actualLaborCost',
	'actualOtherCost',
	'actualTotal',
	'finalTotal',
	'financialNotes',
]);

export const isSingleFamilyProperty = (propertyType?: string): boolean => {
	if (!propertyType) return false;
	const normalized = String(propertyType).toLowerCase().replace(/[-_]/g, ' ').trim();
	return normalized.includes('single');
};

export const getActiveAccountId = (user: any): string =>
	String(user?.accountId || user?.id || '').trim();

export const getAllowedPropertyIdSet = (properties: any[]): Set<string> =>
	new Set(
		properties
			.map((property: any) => String(property.id || '').trim())
			.filter(Boolean),
	);

export const createPropertyLookup = (properties: any[]): Map<string, any> =>
	properties.reduce((lookup: Map<string, any>, property: any) => {
		const propertyId = String(property.id || '').trim();
		if (propertyId) {
			lookup.set(propertyId, property);
		}
		return lookup;
	}, new Map<string, any>());

const getRecordPropertyId = (record: any): string =>
	String(
		record?.propertyId ||
			record?.location?.propertyId ||
			record?.property?.id ||
			'',
	).trim();

const getPropertyTitle = (
	propertyId: string,
	propertyLookup: Map<string, any>,
	fallback?: string,
): string =>
	String(fallback || propertyLookup.get(propertyId)?.title || 'Unknown Property').trim();

export const filterRecordsForAccountOrProperties = (
	records: any[],
	activeAccountId: string,
	allowedPropertyIdSet: Set<string>,
	getPropertyId: (record: any) => string = getRecordPropertyId,
): any[] =>
	records.filter((record: any) => {
		const recordAccountId = String(record?.accountId || '').trim();
		const propertyId = getPropertyId(record);
		return (
			(recordAccountId && recordAccountId === activeAccountId) ||
			(propertyId && allowedPropertyIdSet.has(propertyId))
		);
	});

export const buildSuiteReportRows = (properties: any[]): any[] =>
	properties.flatMap((property: any) => {
		if (!property.hasSuites || !Array.isArray(property.suites)) {
			return [];
		}

		return property.suites.map((suite: any) => ({
			...suite,
			propertyTitle: property.title,
			propertyId: String(property.id || '').trim(),
		}));
	});

export const buildUnitReportRows = (
	units: any[],
	properties: any[],
): any[] => {
	const propertyLookup = createPropertyLookup(properties);
	return units.map((unit: any) => {
		const propertyId = String(unit.propertyId || '').trim();
		return {
			...unit,
			propertyId,
			propertyTitle: getPropertyTitle(propertyId, propertyLookup, unit.propertyTitle),
		};
	});
};

export const normalizeContractorReportRows = (
	contractors: any[],
	properties: any[],
): any[] => {
	const propertyLookup = createPropertyLookup(properties);
	return contractors.map((contractor: any) => {
		const propertyId = String(contractor.propertyId || '').trim();
		return {
			...contractor,
			propertyId,
			propertyTitle: getPropertyTitle(
				propertyId,
				propertyLookup,
				contractor.propertyTitle,
			),
		};
	});
};

const formatDeviceLocation = (device: any): string => {
	const location = device?.location;
	if (!location) return '';
	if (typeof location === 'string') return location;

	return [
		location.name,
		location.room,
		location.area,
		location.suite,
		location.unit,
	]
		.filter(Boolean)
		.join(' - ');
};

export const normalizeDeviceReportRows = (
	devices: any[],
	properties: any[],
): any[] => {
	const propertyLookup = createPropertyLookup(properties);
	return devices.map((device: any) => {
		const propertyId = getRecordPropertyId(device);
		return {
			...device,
			propertyId,
			propertyTitle: getPropertyTitle(propertyId, propertyLookup, device.propertyTitle),
			brand: device.brand || device.manufacturer || '',
			installationDate: device.installationDate || device.installDate || '',
			location: formatDeviceLocation(device),
		};
	});
};

export const normalizeTaskReportRows = (tasks: any[]): any[] =>
	tasks.map((task: any) => {
		const estimate = task.financials?.estimate;
		const actual = task.financials?.actual;
		const estimatedTotal = calculateCostTotal(estimate);
		const actualTotal = calculateCostTotal(actual);
		return {
			...task,
			propertyId: String(task.propertyId || '').trim(),
			property: task.property || task.propertyTitle || '',
			assignee:
				task.assignee ||
				task.assignedToName ||
				task.assignedTo?.displayName ||
				task.assignedTo?.name ||
				task.assignedTo ||
				'',
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

export const normalizeMaintenanceHistoryReportRows = (
	records: any[],
	properties: any[] = [],
): any[] => {
	const propertyLookup = createPropertyLookup(properties);
	return records.map((record: any) => {
		const propertyId = String(record.propertyId || '').trim();
		const estimate = record.financials?.estimate;
		const actual = record.financials?.actual;
		const estimatedTotal = calculateCostTotal(estimate);
		const actualTotal = calculateCostTotal(actual);
		return {
			...record,
			propertyId,
			propertyTitle: getPropertyTitle(
				propertyId,
				propertyLookup,
				record.propertyTitle || record.property,
			),
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
};

export const buildMaintenanceRequestRows = ({
	properties,
	reduxMaintenanceRequests,
	allowedPropertyIdSet,
}: {
	properties: any[];
	reduxMaintenanceRequests: any[];
	allowedPropertyIdSet: Set<string>;
}): any[] => {
	const requestsById = new Map<string, any>();

	const addRequest = (request: any, property?: any) => {
		const propertyId = String(request?.propertyId || property?.id || '').trim();
		if (!propertyId || !allowedPropertyIdSet.has(propertyId)) {
			return;
		}

		const propertyTitle =
			String(request?.propertyTitle || property?.title || '').trim() ||
			'Unknown Property';
		const requestId =
			String(request?.id || '').trim() ||
			`${propertyId}-${request?.requestedDate || request?.submittedAt || request?.title || requestsById.size}`;

		requestsById.set(requestId, {
			...request,
			id: requestId,
			propertyId,
			propertyTitle,
			submittedAt:
				request?.submittedAt || request?.requestedDate || request?.createdAt || '',
			submittedByName:
				request?.submittedByName ||
				request?.requestedByName ||
				request?.requestedByEmail ||
				request?.requestedBy ||
				'',
			reviewedBy: request?.reviewedBy || '',
			reviewedAt: request?.reviewedAt || '',
			notes: request?.notes || '',
		});
	};

	properties.forEach((property: any) => {
		if (Array.isArray(property.maintenanceRequests)) {
			property.maintenanceRequests.forEach((request: any) =>
				addRequest(request, property),
			);
		}
	});

	reduxMaintenanceRequests.forEach((request: any) => addRequest(request));

	return Array.from(requestsById.values());
};

const taskMatchesTeamMember = (task: any, member: any): boolean => {
	const memberValues = [
		member?.id,
		member?.userId,
		member?.email,
		member?.firstName && member?.lastName
			? `${member.firstName} ${member.lastName}`
			: '',
		member?.displayName,
	]
		.map((value) => String(value || '').trim().toLowerCase())
		.filter(Boolean);

	const assignedTo = task?.assignedTo;
	const taskValues = [
		assignedTo,
		assignedTo?.id,
		assignedTo?.userId,
		assignedTo?.email,
		assignedTo?.name,
		assignedTo?.displayName,
		task?.assignedToId,
		task?.assignedToEmail,
		task?.assignedToName,
		task?.assignee,
	]
		.map((value) => String(value || '').trim().toLowerCase())
		.filter(Boolean);

	return taskValues.some((taskValue) => memberValues.includes(taskValue));
};

export const buildEmployeeEfficiencyRows = (
	teamMembers: any[],
	tasks: any[],
): any[] =>
	teamMembers.map((member: any) => {
		const memberTasks = tasks.filter((task: any) =>
			taskMatchesTeamMember(task, member),
		);
		const completed = memberTasks.filter(
			(task: any) => String(task.status || '').toLowerCase() === 'completed',
		);

		const tasksWithCompletionDates = memberTasks.filter(
			(task: any) => task.completionDate && task.dueDate,
		);
		const avgDays =
			tasksWithCompletionDates.length > 0
				? tasksWithCompletionDates.reduce((acc: number, task: any) => {
					const due = new Date(task.dueDate).getTime();
					const comp = new Date(task.completionDate).getTime();
					return acc + (comp - due) / (1000 * 60 * 60 * 24);
				}, 0) / tasksWithCompletionDates.length
				: 0;

		return {
			employeeId: member.id,
			firstName: member.firstName,
			lastName: member.lastName,
			email: member.email,
			title: member.title,
			totalTasksAssigned: memberTasks.length,
			tasksCompleted: completed.length,
			tasksInProgress: memberTasks.filter(
				(task: any) => String(task.status || '').toLowerCase() === 'in progress',
			).length,
			tasksPending: memberTasks.filter(
				(task: any) => String(task.status || '').toLowerCase() === 'pending',
			).length,
			completionRate:
				memberTasks.length > 0
					? Math.round((completed.length / memberTasks.length) * 100)
					: 0,
			averageCompletionDays: Math.round(avgDays),
			lastTaskCompletionDate:
				completed.length > 0
					? new Date(
						completed[completed.length - 1].completionDate,
					).toLocaleDateString()
					: 'N/A',
		};
	});

export const buildRecurringMaintenanceRows = (
	tasks: any[],
): any[] =>
	tasks
		.filter((task: any) => task.isRecurring || task.recurrenceFrequency)
		.map((task: any) => ({
			id: task.id,
			propertyId: String(task.propertyId || '').trim(),
			propertyTitle: task.propertyTitle || task.property || 'Unknown Property',
			title: task.title,
			status: task.status,
			priority: task.priority || '',
			recurrenceFrequency: task.recurrenceFrequency || '',
			recurrenceInterval: task.recurrenceInterval || '',
			recurrenceCustomUnit: task.recurrenceCustomUnit || '',
			nextDueDate: task.dueDate || '',
			lastCompleted: task.completionDate || task.lastRecurrenceDate || '',
			reminderEnabled:
				task.enableNotifications ||
				(task.notifications || []).some((notification: any) => notification.enabled)
					? 'Yes'
					: 'No',
			assignee: task.assignee,
			applianceCount: (task.devices || []).length,
		}));

export const buildTeamWorkloadRows = (
	teamMembers: any[],
	tasks: any[],
): any[] => {
	const now = Date.now();
	const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;
	return teamMembers.map((member: any) => {
		const memberTasks = tasks.filter((task: any) =>
			taskMatchesTeamMember(task, member),
		);
		const openTasks = memberTasks.filter(
			(task: any) => String(task.status || '').toLowerCase() !== 'completed',
		);
		const overdueTasks = openTasks.filter((task: any) => {
			const dueMillis = toDateMillis(task.dueDate);
			return dueMillis !== null && dueMillis < now;
		});
		const dueNext30Days = openTasks.filter((task: any) => {
			const dueMillis = toDateMillis(task.dueDate);
			return dueMillis !== null && dueMillis >= now && dueMillis <= thirtyDaysFromNow;
		});
		const completedTasks = memberTasks.filter(
			(task: any) => String(task.status || '').toLowerCase() === 'completed',
		);
		const assignedProperties = new Set(
			memberTasks
				.map((task: any) => String(task.propertyId || '').trim())
				.filter(Boolean),
		);

		return {
			employeeId: member.id,
			firstName: member.firstName,
			lastName: member.lastName,
			email: member.email,
			title: member.title,
			assignedPropertyCount: assignedProperties.size,
			openTasks: openTasks.length,
			overdueTasks: overdueTasks.length,
			dueNext30Days: dueNext30Days.length,
			completedTasks: completedTasks.length,
		};
	});
};

export const buildPropertySummaryRows = ({
	properties,
	tasks,
	maintenanceRequests,
	maintenanceHistory,
}: {
	properties: any[];
	tasks: any[];
	maintenanceRequests: any[];
	maintenanceHistory: any[];
}): any[] =>
	properties.map((property: any) => {
		const propertyId = String(property.id || '').trim();
		const propertyTitle = String(property.title || '').trim();
		const propertyTasks = tasks.filter(
			(task: any) => String(task.propertyId || '').trim() === propertyId,
		);
		const propertyRequests = maintenanceRequests.filter(
			(request: any) => String(request.propertyId || '').trim() === propertyId,
		);
		const propertyMaintenanceRecords = maintenanceHistory.filter((record: any) => {
			const recordPropertyId = String(record.propertyId || '').trim();
			const recordPropertyTitle = String(
				record.propertyTitle || record.property || '',
			).trim();
			return (
				recordPropertyId === propertyId ||
				(!recordPropertyId && recordPropertyTitle === propertyTitle)
			);
		});

		let totalUnits = 0;
		let occupiedUnits = 0;
		let totalOccupants = 0;

		if (Array.isArray(property.units)) {
			totalUnits = property.units.length;
			occupiedUnits = property.units.filter(
				(unit: any) => (unit.occupants || []).length > 0,
			).length;
			totalOccupants = property.units.reduce(
				(sum: number, unit: any) => sum + (unit.occupants || []).length,
				0,
			);
		}

		return {
			propertyId,
			propertyTitle: property.title,
			address: property.address || 'N/A',
			owner: property.owner || 'N/A',
			propertyType: property.propertyType || 'Unknown',
			totalUnits,
			occupiedUnits,
			totalTenants: totalOccupants,
			totalTasks: propertyTasks.length,
			completedTasks: propertyTasks.filter(
				(task: any) => String(task.status || '').toLowerCase() === 'completed',
			).length,
			maintenanceHistoryCount: propertyMaintenanceRecords.length,
			pendingMaintenanceRequests: propertyRequests.filter(
				(request: any) =>
					String(request.status || '').toLowerCase() === 'pending',
			).length,
			approvedMaintenanceRequests: propertyRequests.filter(
				(request: any) =>
					String(request.status || '').toLowerCase() === 'approved',
			).length,
		};
	});

export const buildPortfolioOverviewRows = ({
	properties,
	tasks,
	maintenanceHistory,
	maintenanceRequests,
}: {
	properties: any[];
	tasks: any[];
	maintenanceHistory: any[];
	maintenanceRequests: any[];
}): any[] => {
	const totalTasks = tasks.length;
	const completedTaskCount = tasks.filter(
		(task: any) => String(task.status || '').toLowerCase() === 'completed',
	).length;
	const pendingTaskCount = tasks.filter(
		(task: any) => String(task.status || '').toLowerCase() !== 'completed',
	).length;

	return [
		{
			propertyCount: properties.length,
			taskCount: totalTasks,
			completedTaskCount,
			pendingTaskCount,
			maintenanceRecordCount: maintenanceHistory.length,
			requestCount: maintenanceRequests.length,
			completionRate:
				totalTasks > 0 ? Math.round((completedTaskCount / totalTasks) * 100) : 0,
		},
	];
};

const toDateMillis = (value?: string): number | null => {
	if (!value) return null;
	const millis = new Date(value).getTime();
	return Number.isFinite(millis) ? millis : null;
};

const dayDiff = (from?: string, to?: string): number | '' => {
	const fromMillis = toDateMillis(from);
	const toMillis = toDateMillis(to);
	if (fromMillis === null || toMillis === null) return '';
	return Math.max(0, Math.round((toMillis - fromMillis) / (1000 * 60 * 60 * 24)));
};

const getWarrantyEndDate = (record: any): string =>
	String(
		record?.warrantyEndDate ||
			record?.warrantyExpirationDate ||
			record?.warrantyExpiresAt ||
			record?.warranty?.endDate ||
			record?.warranty?.expirationDate ||
			'',
	).trim();

const getWarrantyStartDate = (record: any): string =>
	String(record?.warrantyStartDate || record?.warranty?.startDate || '').trim();

const getWarrantyLength = (record: any): string =>
	String(record?.warrantyLength || record?.warranty?.length || '').trim();

const isWarrantyDocument = (document: any): boolean =>
	String(document?.documentType || document?.category || '')
		.toLowerCase()
		.includes('warranty');

export const buildDocumentInventoryRows = ({
	properties,
	devices,
	tasks,
	maintenanceHistory,
	maintenanceRequests,
}: {
	properties: any[];
	devices: any[];
	tasks: any[];
	maintenanceHistory: any[];
	maintenanceRequests: any[];
}): any[] => {
	const propertyLookup = createPropertyLookup(properties);
	const rows: any[] = [];

	properties.forEach((property: any) => {
		(property.documents || []).forEach((document: any) => {
			rows.push({
				id: document.id,
				propertyId: String(document.propertyId || property.id || '').trim(),
				propertyTitle: property.title || 'Unknown Property',
				documentName: document.name || document.fileName || 'Untitled document',
				documentType: document.documentType || document.category || 'unknown',
				source: 'Property',
				linkedApplianceCount:
					(document.links?.assetIds || []).length +
					(document.assignedDeviceId ? 1 : 0),
				linkedTaskCount:
					(document.links?.taskIds || []).length +
					(document.assignedTaskId ? 1 : 0),
				linkedMaintenanceEventCount:
					(document.links?.maintenanceEventIds || []).length,
				uploadedAt: document.uploadedAt || '',
				uploadedBy: document.uploadedBy || '',
				acquisitionStatus: document.acquisitionStatus || '',
				fileSize: document.size || document.fileSize || '',
				contentType: document.type || document.contentType || '',
				url: document.url || document.fileUrl || '',
			});
		});
	});

	devices.forEach((device: any) => {
		(device.files || []).forEach((file: any) => {
			const propertyId = String(device.propertyId || device.location?.propertyId || '').trim();
			rows.push({
				id: file.id || `${device.id}-${file.name}`,
				propertyId,
				propertyTitle: getPropertyTitle(propertyId, propertyLookup, device.propertyTitle),
				documentName: file.name || 'Appliance file',
				documentType: file.documentType || file.category || 'other',
				source: 'Appliance',
				linkedApplianceCount: 1,
				linkedTaskCount: 0,
				linkedMaintenanceEventCount: 0,
				uploadedAt: file.uploadedAt || '',
				uploadedBy: file.uploadedBy || '',
				acquisitionStatus: file.acquisitionStatus || '',
				fileSize: file.size || '',
				contentType: file.type || '',
				url: file.url || '',
			});
		});
	});

	tasks.forEach((task: any) => {
		if (!task.completionFile) return;
		const file = task.completionFile;
		rows.push({
			id: file.id || `${task.id}-completion-file`,
			propertyId: String(task.propertyId || '').trim(),
			propertyTitle: task.propertyTitle || task.property || 'Unknown Property',
			documentName: file.name || 'Task completion file',
			documentType: 'task_completion',
			source: 'Task',
			linkedApplianceCount: (task.devices || []).length,
			linkedTaskCount: 1,
			linkedMaintenanceEventCount: 0,
			uploadedAt: file.uploadedAt || task.completionDate || '',
			uploadedBy: task.completedBy || '',
			acquisitionStatus: '',
			fileSize: file.size || '',
			contentType: file.type || '',
			url: file.url || '',
		});
	});

	maintenanceHistory.forEach((record: any) => {
		if (!record.completionFile) return;
		const file = record.completionFile;
		rows.push({
			id: file.id || `${record.id}-completion-file`,
			propertyId: String(record.propertyId || '').trim(),
			propertyTitle: record.propertyTitle || 'Unknown Property',
			documentName: file.name || 'Maintenance file',
			documentType: record.eventType === 'invoice_uploaded' ? 'invoice' : 'maintenance',
			source: 'Maintenance History',
			linkedApplianceCount: (record.deviceIds || []).length,
			linkedTaskCount: (record.linkedTaskIds || []).length + (record.originalTaskId ? 1 : 0),
			linkedMaintenanceEventCount: 1,
			uploadedAt: file.uploadedAt || record.completionDate || '',
			uploadedBy: record.completedByName || record.completedBy || '',
			acquisitionStatus: '',
			fileSize: file.size || '',
			contentType: file.type || '',
			url: file.url || '',
		});
	});

	maintenanceRequests.forEach((request: any) => {
		(request.files || []).forEach((file: any) => {
			rows.push({
				id: file.id || `${request.id}-${file.name}`,
				propertyId: String(request.propertyId || '').trim(),
				propertyTitle: request.propertyTitle || 'Unknown Property',
				documentName: file.name || 'Request file',
				documentType: 'maintenance_request',
				source: 'Maintenance Request',
				linkedApplianceCount: 0,
				linkedTaskCount: request.convertedToTaskId ? 1 : 0,
				linkedMaintenanceEventCount: 0,
				uploadedAt: file.uploadedAt || request.submittedAt || request.requestedDate || '',
				uploadedBy: request.submittedByName || request.requestedByEmail || '',
				acquisitionStatus: '',
				fileSize: file.size || '',
				contentType: file.type || '',
				url: file.url || '',
			});
		});
	});

	return rows;
};

export const buildWarrantyExpirationRows = ({
	properties,
	devices,
}: {
	properties: any[];
	devices: any[];
}): any[] => {
	const propertyLookup = createPropertyLookup(properties);
	const rows: any[] = [];

	devices.forEach((device: any) => {
		const propertyId = String(device.propertyId || device.location?.propertyId || '').trim();
		const warrantyDocuments = (device.files || []).filter(isWarrantyDocument);
		rows.push({
			propertyId,
			propertyTitle: getPropertyTitle(propertyId, propertyLookup, device.propertyTitle),
			applianceSystem: device.type || device.assetType || 'Appliance/System',
			manufacturer: device.manufacturer || device.brand || '',
			model: device.model || '',
			serialNumber: device.serialNumber || '',
			installDate: device.installDate || device.installationDate || '',
			warrantyStartDate: getWarrantyStartDate(device),
			warrantyEndDate: getWarrantyEndDate(device),
			warrantyLength: getWarrantyLength(device),
			warrantyDocumentAttached: warrantyDocuments.length > 0 ? 'Yes' : 'No',
			documentName: warrantyDocuments.map((document: any) => document.name).filter(Boolean).join('; '),
			status: device.status || '',
			notes: device.notes || '',
		});
	});

	properties.forEach((property: any) => {
		(property.documents || [])
			.filter(isWarrantyDocument)
			.forEach((document: any) => {
				rows.push({
					propertyId: String(property.id || '').trim(),
					propertyTitle: property.title || 'Unknown Property',
					applianceSystem: '',
					manufacturer: '',
					model: '',
					serialNumber: '',
					installDate: '',
					warrantyStartDate: getWarrantyStartDate(document),
					warrantyEndDate: getWarrantyEndDate(document),
					warrantyLength: getWarrantyLength(document),
					warrantyDocumentAttached: 'Yes',
					documentName: document.name || document.fileName || 'Warranty document',
					status: '',
					notes: '',
				});
			});
	});

	return rows;
};

export const buildApplianceServiceRows = ({
	devices,
	tasks,
	maintenanceHistory,
	properties,
}: {
	devices: any[];
	tasks: any[];
	maintenanceHistory: any[];
	properties: any[];
}): any[] => {
	const propertyLookup = createPropertyLookup(properties);
	const now = Date.now();
	const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

	return devices.map((device: any) => {
		const propertyId = String(device.propertyId || device.location?.propertyId || '').trim();
		const deviceId = String(device.id || '').trim();
		const deviceTasks = tasks.filter((task: any) =>
			(task.devices || []).map((id: any) => String(id)).includes(deviceId),
		);
		const deviceMaintenanceRecords = maintenanceHistory.filter((record: any) =>
			(record.deviceIds || []).map((id: any) => String(id)).includes(deviceId),
		);
		const localMaintenanceRecords = (device.maintenanceHistory || []).map(
			(record: any) => ({
				...record,
				completionDate: record.date,
			}),
		);
		const allServiceRecords = [
			...deviceMaintenanceRecords,
			...localMaintenanceRecords,
		];
		const serviceDates = allServiceRecords
			.map((record: any) => record.completionDate || record.date)
			.filter(Boolean)
			.sort();
		const openTasks = deviceTasks.filter(
			(task: any) => String(task.status || '').toLowerCase() !== 'completed',
		);
		const upcomingTasks = openTasks.filter((task: any) => {
			const dueMillis = toDateMillis(task.dueDate);
			return dueMillis !== null && dueMillis >= now && dueMillis <= thirtyDaysFromNow;
		});

		return {
			propertyId,
			propertyTitle: getPropertyTitle(propertyId, propertyLookup, device.propertyTitle),
			applianceSystem: device.type || device.assetType || 'Appliance/System',
			type: device.type || '',
			manufacturer: device.manufacturer || device.brand || '',
			model: device.model || '',
			serialNumber: device.serialNumber || '',
			installDate: device.installDate || device.installationDate || '',
			lastServiceDate: serviceDates[serviceDates.length - 1] || '',
			serviceCount: allServiceRecords.length,
			openTasks: openTasks.length,
			upcomingTasks: upcomingTasks.length,
			warrantyEndDate: getWarrantyEndDate(device),
			documentsAttached: (device.files || []).length,
			status: device.status || '',
		};
	});
};

const recordMatchesContractor = (record: any, contractor: any): boolean => {
	const contractorValues = [
		contractor.id,
		contractor.name,
		contractor.company,
		contractor.email,
	]
		.map((value) => String(value || '').trim().toLowerCase())
		.filter(Boolean);
	const recordValues = [
		record.contractorId,
		record.contractorName,
		record.completedBy,
		record.completedByName,
		record.assignee,
		record.assignedTo,
		record.assignedTo?.id,
		record.assignedTo?.name,
		record.assignedTo?.email,
	]
		.map((value) => String(value || '').trim().toLowerCase())
		.filter(Boolean);
	return recordValues.some((value) => contractorValues.includes(value));
};

export const buildContractorServiceSpendRows = ({
	contractors,
	tasks,
	maintenanceHistory,
}: {
	contractors: any[];
	tasks: any[];
	maintenanceHistory: any[];
}): any[] =>
	contractors.map((contractor: any) => {
		const contractorTasks = tasks.filter((task: any) =>
			recordMatchesContractor(task, contractor),
		);
		const contractorMaintenance = maintenanceHistory.filter((record: any) =>
			recordMatchesContractor(record, contractor),
		);
		const completedJobs =
			contractorMaintenance.length +
			contractorTasks.filter(
				(task: any) => String(task.status || '').toLowerCase() === 'completed',
			).length;
		const serviceDates = [
			...contractorMaintenance.map((record: any) => record.completionDate || record.date),
			...contractorTasks.map((task: any) => task.completionDate),
		]
			.filter(Boolean)
			.sort();
		const estimatedTotal = [...contractorTasks, ...contractorMaintenance].reduce(
			(sum: number, record: any) => sum + (record.estimatedTotal || 0),
			0,
		);
		const actualTotal = [...contractorTasks, ...contractorMaintenance].reduce(
			(sum: number, record: any) => sum + (record.actualTotal || 0),
			0,
		);

		return {
			contractorId: contractor.id,
			contractorName: contractor.name || contractor.company || 'Contractor',
			company: contractor.company || '',
			propertyId: contractor.propertyId || '',
			propertyTitle: contractor.propertyTitle || '',
			category: contractor.category || '',
			completedJobs,
			lastServiceDate: serviceDates[serviceDates.length - 1] || '',
			estimatedTotal,
			actualTotal,
			linkedMaintenanceRecords: contractorMaintenance.length,
			linkedTasks: contractorTasks.length,
		};
	});

export const buildResidentRequestLifecycleRows = (
	maintenanceRequests: any[],
	tasks: any[],
): any[] => {
	const taskById = new Map(tasks.map((task: any) => [String(task.id || ''), task]));
	return maintenanceRequests.map((request: any) => {
		const convertedTaskId = request.convertedToTaskId || request.convertedTaskId || '';
		const convertedTask = taskById.get(String(convertedTaskId));
		const submittedAt = request.submittedAt || request.requestedDate || request.createdAt || '';
		const convertedAt = convertedTask?.createdAt || convertedTask?.updatedAt || '';
		return {
			id: request.id,
			propertyId: request.propertyId,
			propertyTitle: request.propertyTitle,
			title: request.title,
			submittedByName:
				request.submittedByName || request.requestedByName || request.requestedByEmail || '',
			submittedAt,
			status: request.status,
			convertedToTaskId: convertedTaskId,
			timeToConversionDays: convertedTaskId ? dayDiff(submittedAt, convertedAt) : '',
			priority: request.priority || '',
			category: request.category || '',
			completedDate: request.completedDate || convertedTask?.completionDate || '',
		};
	});
};

export const filterReportRowsByProperty = (
	rows: any[],
	propertyId: string,
): any[] => {
	const normalizedPropertyId = String(propertyId || '').trim();
	if (!normalizedPropertyId) return rows;
	return rows.filter(
		(row: any) => getRecordPropertyId(row) === normalizedPropertyId,
	);
};

export const filterRowsForHomeownerProperties = ({
	reportType,
	rows,
	properties,
}: {
	reportType: ReportType;
	rows: any[];
	properties: any[];
}): any[] => {
	const propertyLookup = createPropertyLookup(properties);
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
		'document-inventory',
		'warranty-expiration',
		'recurring-maintenance',
		'appliance-service',
		'contractor-service-spend',
		'resident-request-lifecycle',
	];

	if (!propertyRelatedReports.includes(reportType)) {
		return rows;
	}

	return rows.filter((row: any) => {
		if (reportType === 'property-summary' && row.propertyType) {
			return isSingleFamilyProperty(row.propertyType);
		}

		if (row.propertyType) {
			return isSingleFamilyProperty(row.propertyType);
		}

		const propertyId = getRecordPropertyId(row);
		const property = propertyLookup.get(propertyId);
		return property ? isSingleFamilyProperty(property.propertyType) : false;
	});
};

export const canViewTeamReportsForUser = ({
	isHomeowner,
	canManageTeam,
	canViewPages,
}: {
	isHomeowner: boolean;
	canManageTeam: boolean;
	canViewPages: boolean;
}): boolean => !isHomeowner && (canManageTeam || canViewPages);

export const getAccessibleReports = (
	canAccessTeamReport: boolean,
	canAccessAdvancedTeamReport: boolean,
	canAccessTenantReports: boolean,
	canAccessPortfolioReports: boolean,
	canAccessFinancialReports: boolean,
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

	// Unit and suite report adapters remain for legacy data compatibility, but
	// the active report picker should stay property-first while those workflows
	// are contained.
	const containedLegacyReports = new Set<ReportType>(['suites', 'units']);

	const allReports: ReportOption[] = [
		{
			value: 'tasks',
			label: 'Task Report',
			description: 'Overview of all tasks with details on status, assignments, and dates',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'overdue-tasks',
			label: 'Overdue Tasks',
			description: 'Past-due tasks that still need attention',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'upcoming-tasks',
			label: 'Upcoming Tasks',
			description: 'Tasks due in the next 30 days for proactive planning',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'maintenance-requests',
			label: 'Maintenance Requests',
			description: 'Submitted maintenance requests with status and priority',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'contractors',
			label: 'Contractors',
			description: 'List of contractors and their service history',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'devices',
			label: 'Appliances',
			description: 'Property appliances with installation dates, status, and maintenance notes',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'maintenance-history',
			label: 'Maintenance History',
			description: 'Historical record of all completed maintenance work',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'property-summary',
			label: 'Property Summary',
			description: 'Overview metrics for each property including occupancy and tasks',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'tenant-profiles',
			label: 'Tenant Profiles',
			description: 'Tenant contact information and lease details',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
			requiresTenantInfoAccess: true,
		},
		{
			value: 'maintenance-costs',
			label: 'Maintenance Costs',
			description: 'Estimated versus actual maintenance spend by record',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
			requiresFinancialAccess: true,
		},
		{
			value: 'portfolio-overview',
			label: 'Portfolio Overview',
			description: 'Portfolio-wide KPI snapshot for operational reporting',
			requiresTeamAccess: false,
			requiresMultiProperty: true,
			requiresPortfolioReporting: true,
		},
		{
			value: 'document-inventory',
			label: 'Document Inventory',
			description: 'Inventory of property, appliance, task, request, and maintenance files',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'warranty-expiration',
			label: 'Warranty & Expiration',
			description: 'Warranty details and attached warranty documents by appliance or property',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'recurring-maintenance',
			label: 'Recurring Maintenance Schedule',
			description: 'Recurring tasks, next due dates, reminders, and linked appliances',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'appliance-service',
			label: 'Appliance & System Service',
			description: 'Service history, open work, and documents by appliance or system',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
		},
		{
			value: 'contractor-service-spend',
			label: 'Contractor Service & Spend',
			description: 'Contractor service activity and spend derived from tasks and maintenance history',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
			requiresFinancialAccess: true,
		},
		{
			value: 'resident-request-lifecycle',
			label: 'Resident Request Lifecycle',
			description: 'Maintenance request status, conversion, and completion timing',
			requiresTeamAccess: false,
			requiresMultiProperty: false,
			requiresTenantInfoAccess: true,
		},
		{
			value: 'team',
			label: 'Team Members',
			description: 'Team member information and contact details (Team Management)',
			requiresTeamAccess: true,
			requiresMultiProperty: false,
		},
		{
			value: 'team-workload',
			label: 'Team Workload',
			description: 'Assigned open, overdue, upcoming, and completed work by team member',
			requiresTeamAccess: true,
			requiresMultiProperty: false,
		},
		{
			value: 'employee-efficiency',
			label: 'Employee Efficiency',
			description: 'Performance metrics for team members (Team Management)',
			requiresTeamAccess: true,
			requiresAdvancedTeamAccess: true,
			requiresMultiProperty: false,
		},
	];

	return allReports.filter((report) => {
		if (containedLegacyReports.has(report.value)) {
			return false;
		}

		if (isHomeowner) {
			if (
				report.value === 'maintenance-requests' ||
				report.value === 'suites' ||
				report.value === 'units' ||
				report.value === 'tenant-profiles' ||
				report.value === 'team' ||
				report.value === 'team-workload' ||
				report.value === 'resident-request-lifecycle' ||
				report.value === 'employee-efficiency'
			) {
				return false;
			}
		}

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
		if (report.requiresFinancialAccess && !canAccessFinancialReports) {
			return false;
		}
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

export const getReportDescription = (
	reportType: ReportType,
	accessibleReports: ReportOption[],
): string => {
	const report = accessibleReports.find((item) => item.value === reportType);
	return report?.description || '';
};
