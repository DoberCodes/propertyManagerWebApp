import { Device, Property } from '../types/Property.types';
import { Task } from '../types/Task.types';
import { SUGGESTED_SYSTEMS, SUGGESTED_TASKS } from './suggestedMaintenance';

export type PropertyScanCategory =
	| 'Missing Information'
	| 'Maintenance Opportunities'
	| 'Overdue Work'
	| 'Documentation Gaps'
	| 'Suggested Next Steps';

export type PropertyScanSeverity = 'low' | 'medium' | 'high';

export type PropertyScanActionType =
	| 'edit_property'
	| 'add_system'
	| 'edit_system'
	| 'open_systems'
	| 'upload_document'
	| 'create_task'
	| 'open_tasks'
	| 'open_maintenance'
	| 'review_setup';

export type PropertyScanRecommendationStatus =
	| 'active'
	| 'resolved'
	| 'dismissed';

export interface PropertyScanRecommendation {
	id: string;
	propertyId: string;
	systemId?: string;
	relatedSystemIds?: string[];
	relatedTaskIds?: string[];
	category: PropertyScanCategory;
	severity: PropertyScanSeverity;
	title: string;
	description: string;
	reason: string;
	suggestedActionLabel: string;
	suggestedActionType: PropertyScanActionType;
	createdAt: string;
	status: PropertyScanRecommendationStatus;
}

export interface PropertyScanInput {
	property: Property;
	systems: Device[];
	tasks: Task[];
	maintenanceHistory: any[];
	dismissedRecommendationIds?: string[];
	createdAt?: string;
}

export interface PropertyScanResult {
	propertyId: string;
	createdAt: string;
	recommendations: PropertyScanRecommendation[];
	activeRecommendations: PropertyScanRecommendation[];
	summary: {
		total: number;
		active: number;
		dismissed: number;
		high: number;
		medium: number;
		low: number;
		overdue: number;
	};
}

export const QUICK_PROPERTY_SCAN_LIMIT = 5;

export const getPropertyScanRecommendationScore = (
	recommendation: Pick<PropertyScanRecommendation, 'severity'>,
): number => {
	switch (recommendation.severity) {
		case 'high':
			return 10;
		case 'medium':
			return 5;
		case 'low':
		default:
			return 1;
	}
};

export const isQuickPropertyScanRecommendation = (
	recommendation: PropertyScanRecommendation,
): boolean =>
	recommendation.status === 'active' &&
	recommendation.severity !== 'low' &&
	recommendation.category !== 'Documentation Gaps' &&
	!recommendation.id.includes(':suggested-task:');

const getRelatedSystemIds = (
	recommendations: PropertyScanRecommendation[],
): string[] =>
	Array.from(
		new Set(
			recommendations
				.map((recommendation) => recommendation.systemId)
				.filter((systemId): systemId is string => Boolean(systemId)),
		),
	);

const getRelatedTaskIds = (
	recommendations: PropertyScanRecommendation[],
): string[] =>
	recommendations
		.map((recommendation) => {
			const match = recommendation.id.match(/:overdue-task:(.+)$/);
			return match?.[1] || '';
		})
		.filter(Boolean);

const makeQuickSummaryRecommendation = ({
	id,
	propertyId,
	createdAt,
	category,
	severity,
	title,
	description,
	reason,
	suggestedActionLabel,
	suggestedActionType,
	relatedSystemIds,
	relatedTaskIds,
}: {
	id: string;
	propertyId: string;
	createdAt: string;
	category: PropertyScanCategory;
	severity: PropertyScanSeverity;
	title: string;
	description: string;
	reason: string;
	suggestedActionLabel: string;
	suggestedActionType: PropertyScanActionType;
	relatedSystemIds?: string[];
	relatedTaskIds?: string[];
}): PropertyScanRecommendation => ({
	id,
	propertyId,
	category,
	severity,
	title,
	description,
	reason,
	suggestedActionLabel,
	suggestedActionType,
	createdAt,
	status: 'active',
	relatedSystemIds,
	relatedTaskIds,
});

const getFirstContextValue = (
	recommendations: PropertyScanRecommendation[],
	key: 'propertyId' | 'createdAt',
): string => recommendations[0]?.[key] || '';

const getQuickSummaryRecommendations = (
	recommendations: PropertyScanRecommendation[],
): PropertyScanRecommendation[] => {
	const eligibleRecommendations = recommendations.filter(
		isQuickPropertyScanRecommendation,
	);
	const propertyId = getFirstContextValue(eligibleRecommendations, 'propertyId');
	const createdAt =
		getFirstContextValue(eligibleRecommendations, 'createdAt') ||
		new Date().toISOString();
	const summaries: PropertyScanRecommendation[] = [];
	const pushSystemSummary = ({
		match,
		idSuffix,
		category,
		severity,
		getTitle,
		description,
		reason,
		suggestedActionLabel,
		suggestedActionType,
	}: {
		match: string;
		idSuffix: string;
		category: PropertyScanCategory;
		severity: PropertyScanSeverity;
		getTitle: (count: number) => string;
		description: string;
		reason: string;
		suggestedActionLabel: string;
		suggestedActionType: PropertyScanActionType;
	}) => {
		const matchedRecommendations = eligibleRecommendations.filter((item) =>
			item.id.includes(match),
		);
		if (matchedRecommendations.length === 0) return;
		summaries.push(
			makeQuickSummaryRecommendation({
				id: `property-scan:${propertyId}:summary:${idSuffix}`,
				propertyId,
				createdAt,
				category,
				severity,
				title: getTitle(matchedRecommendations.length),
				description,
				reason,
				suggestedActionLabel,
				suggestedActionType,
				relatedSystemIds: getRelatedSystemIds(matchedRecommendations),
			}),
		);
	};

	const noSystemRecommendation = eligibleRecommendations.find((item) =>
		item.id.endsWith(':no-systems'),
	);
	if (noSystemRecommendation) {
		summaries.push(noSystemRecommendation);
	}

	const overdueRecommendations = eligibleRecommendations.filter((item) =>
		item.id.includes(':overdue-task:'),
	);
	if (overdueRecommendations.length > 0) {
		summaries.push(
			makeQuickSummaryRecommendation({
				id: `property-scan:${propertyId}:summary:overdue-tasks`,
				propertyId,
				createdAt,
				category: 'Overdue Work',
				severity: 'high',
				title: 'Overdue maintenance tasks need review.',
				description:
					'Open tasks to update due dates, complete work, or decide the next step.',
				reason:
					'Overdue work directly affects maintenance execution and should be reviewed first.',
				suggestedActionLabel: 'Open Tasks',
				suggestedActionType: 'open_tasks',
				relatedTaskIds: getRelatedTaskIds(overdueRecommendations),
			}),
		);
	}

	pushSystemSummary({
		match: ':system-recurring-task:',
		idSuffix: 'recurring-maintenance',
		category: 'Maintenance Opportunities',
		severity: 'high',
		getTitle: () => 'Recurring maintenance is missing for several systems.',
		description:
			'Recurring tasks help turn important maintenance into a visible schedule.',
		reason:
			'Missing recurring maintenance coverage affects whether routine work is easy to remember and track.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
	});

	pushSystemSummary({
		match: ':system-history:',
		idSuffix: 'maintenance-history',
		category: 'Maintenance Opportunities',
		severity: 'medium',
		getTitle: () => 'Maintenance tracking has not been started for many systems.',
		description:
			'Recording maintenance history helps build a useful service timeline and future recommendations.',
		reason:
			'These systems do not have maintenance history saved in Maintley yet.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
	});

	pushSystemSummary({
		match: ':system-identifiers:',
		idSuffix: 'system-identification',
		category: 'Missing Information',
		severity: 'medium',
		getTitle: () => 'Important identification details are missing for some systems.',
		description:
			'Make and model details make records more useful when finding manuals, parts, or service notes.',
		reason:
			'These systems are missing make or model information in the saved record.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
	});

	pushSystemSummary({
		match: ':system-install-date:',
		idSuffix: 'install-dates',
		category: 'Missing Information',
		severity: 'medium',
		getTitle: () => 'Install dates are missing for many major systems.',
		description:
			'Install dates help with maintenance planning, warranty review, and long-term replacement planning.',
		reason:
			'These systems do not have install dates recorded in Maintley yet.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
	});

	const propertyDetailRecommendation = eligibleRecommendations.find((item) =>
		item.id.endsWith(':missing-core-details'),
	);
	if (propertyDetailRecommendation) {
		summaries.push(propertyDetailRecommendation);
	}

	return summaries;
};

export const getQuickPropertyScanRecommendations = (
	recommendations: PropertyScanRecommendation[],
	limit = QUICK_PROPERTY_SCAN_LIMIT,
): PropertyScanRecommendation[] =>
	getQuickSummaryRecommendations(recommendations)
		.sort((left, right) => {
			const scoreDelta =
				getPropertyScanRecommendationScore(right) -
				getPropertyScanRecommendationScore(left);
			if (scoreDelta !== 0) return scoreDelta;
			return left.title.localeCompare(right.title);
		})
		.slice(0, limit);

type RuleContext = {
	property: Property;
	systems: Device[];
	tasks: Task[];
	maintenanceHistory: any[];
	createdAt: string;
};

type Rule = (context: RuleContext) => PropertyScanRecommendation[];

const isBlank = (value: unknown): boolean =>
	value === undefined ||
	value === null ||
	String(value).trim().length === 0;

const normalize = (value: unknown): string =>
	String(value || '')
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

const compact = (value: unknown): string => normalize(value).replace(/\s+/g, '');

const getSystemName = (system: Device): string =>
	[system.brand, system.type, system.model].filter(Boolean).join(' ').trim() ||
	system.type ||
	'this system';

const makeRecommendation = (
	context: RuleContext,
	recommendation: Omit<
		PropertyScanRecommendation,
		'propertyId' | 'createdAt' | 'status'
	>,
): PropertyScanRecommendation => ({
	...recommendation,
	propertyId: context.property.id,
	createdAt: context.createdAt,
	status: 'active',
});

const getTaskDate = (task: Task): Date | null => {
	if (!task.dueDate) return null;
	const parsed = new Date(task.dueDate);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isTaskOpen = (task: Task): boolean =>
	!['Completed', 'Rejected'].includes(task.status);

const hasLinkedRecurringTask = (system: Device, tasks: Task[]): boolean =>
	tasks.some(
		(task) =>
			isTaskOpen(task) &&
			task.isRecurring === true &&
			Array.isArray(task.devices) &&
			task.devices.includes(system.id),
	);

const historyMatchesSystem = (history: any, systemId: string): boolean => {
	const deviceId = String(history?.deviceId || history?.systemId || '');
	const deviceIds = Array.isArray(history?.deviceIds)
		? history.deviceIds.map(String)
		: [];
	const taskDeviceIds = Array.isArray(history?.devices)
		? history.devices.map(String)
		: [];

	return (
		deviceId === systemId ||
		deviceIds.includes(systemId) ||
		taskDeviceIds.includes(systemId)
	);
};

const hasMaintenanceHistory = (
	system: Device,
	maintenanceHistory: any[],
): boolean => {
	if (Array.isArray(system.maintenanceHistory) && system.maintenanceHistory.length > 0) {
		return true;
	}

	return maintenanceHistory.some((record) => historyMatchesSystem(record, system.id));
};

const systemHasWarrantyInfo = (property: Property, system: Device): boolean => {
	const propertyWarranty = (property.documents || []).some(
		(document) =>
			document.category === 'warranty' &&
			(!document.assignedDeviceId || document.assignedDeviceId === system.id),
	);
	const systemWarrantyFile = (system.files || []).some((file) =>
		normalize(file.name).includes('warranty'),
	);

	return propertyWarranty || systemWarrantyFile;
};

const getSuggestedSystemIdForDevice = (system: Device): string | null => {
	const deviceText = compact(`${system.type} ${system.brand} ${system.model}`);
	if (!deviceText) return null;

	const match = SUGGESTED_SYSTEMS.find((suggestedSystem) => {
		const typeText = compact(suggestedSystem.deviceType);
		const labelText = compact(suggestedSystem.label);
		return (
			deviceText.includes(typeText) ||
			typeText.includes(deviceText) ||
			deviceText.includes(labelText) ||
			labelText.includes(deviceText)
		);
	});

	return match?.id || null;
};

const taskLooksAccepted = (task: Task, system: Device, suggestedTitle: string): boolean => {
	const taskTitle = compact(task.title);
	const suggestionTitle = compact(suggestedTitle);
	const isLinkedToSystem =
		Array.isArray(task.devices) && task.devices.includes(system.id);
	const mentionsSystem = compact(task.title).includes(compact(system.type));

	return (
		taskTitle === suggestionTitle ||
		taskTitle.includes(suggestionTitle) ||
		(suggestionTitle.includes(taskTitle) && (isLinkedToSystem || mentionsSystem))
	);
};

const missingCorePropertyDetailsRule: Rule = (context) => {
	const missing: string[] = [];
	if (isBlank(context.property.address)) missing.push('address');
	if (isBlank(context.property.propertyType)) missing.push('property type');
	if (context.property.propertyType !== 'Commercial') {
		if (context.property.bedrooms === undefined || context.property.bedrooms === null) {
			missing.push('bedrooms');
		}
		if (context.property.bathrooms === undefined || context.property.bathrooms === null) {
			missing.push('bathrooms');
		}
	}

	if (missing.length === 0) return [];

	return [
		makeRecommendation(context, {
			id: `property-scan:${context.property.id}:missing-core-details`,
			category: 'Missing Information',
			severity: 'medium',
			title: 'Add key property details',
			description: `Add ${missing.join(', ')} so Maintley can organize this property record more clearly.`,
			reason: 'This scan only reviews saved records. These fields are not filled in yet.',
			suggestedActionLabel: 'Edit property details',
			suggestedActionType: 'edit_property',
		}),
	];
};

const noSystemsRule: Rule = (context) => {
	if (context.systems.length > 0) return [];

	return [
		makeRecommendation(context, {
			id: `property-scan:${context.property.id}:no-systems`,
			category: 'Suggested Next Steps',
			severity: 'high',
			title: 'Add the first system or appliance',
			description:
				'Start with one important system, such as HVAC, water heater, refrigerator, or smoke detectors.',
			reason:
				'No systems or appliances are recorded for this property yet, so Maintley has very little to base reminders on.',
			suggestedActionLabel: 'Add a system',
			suggestedActionType: 'add_system',
		}),
	];
};

const systemRecordDetailsRule: Rule = (context) =>
	context.systems.flatMap((system) => {
		const recommendations: PropertyScanRecommendation[] = [];
		const missingIdentity: string[] = [];
		if (isBlank(system.brand)) missingIdentity.push('make');
		if (isBlank(system.model)) missingIdentity.push('model');
		const systemName = getSystemName(system);

		if (missingIdentity.length > 0) {
			recommendations.push(
				makeRecommendation(context, {
					id: `property-scan:${context.property.id}:system-identifiers:${system.id}`,
					systemId: system.id,
					category: 'Missing Information',
					severity: 'medium',
					title: `Add ${missingIdentity.join(', ')} for ${systemName}`,
					description:
						'Record the core details that make this system easier to identify later.',
					reason: `${systemName} is missing ${missingIdentity.join(', ')} in the saved system record.`,
					suggestedActionLabel: 'Open system record',
					suggestedActionType: 'edit_system',
				}),
			);
		}

		if (isBlank(system.serialNumber)) {
			recommendations.push(
				makeRecommendation(context, {
					id: `property-scan:${context.property.id}:system-serial-number:${system.id}`,
					systemId: system.id,
					category: 'Missing Information',
					severity: 'low',
					title: `Add serial number for ${systemName}`,
					description:
						'Serial numbers are useful for documentation, warranty, and parts lookup.',
					reason: `${systemName} does not have a serial number recorded.`,
					suggestedActionLabel: 'Open system record',
					suggestedActionType: 'edit_system',
				}),
			);
		}

		return recommendations;
	});

const systemInstallDateRule: Rule = (context) =>
	context.systems.flatMap((system) => {
		if (!isBlank(system.installationDate)) return [];
		const systemName = getSystemName(system);

		return [
			makeRecommendation(context, {
				id: `property-scan:${context.property.id}:system-install-date:${system.id}`,
				systemId: system.id,
				category: 'Missing Information',
				severity: 'medium',
				title: `Add install date for ${systemName}`,
				description:
					'Even an approximate install date can make replacement planning and warranty review easier.',
				reason: `${systemName} does not have an install date recorded.`,
				suggestedActionLabel: 'Open system record',
				suggestedActionType: 'edit_system',
			}),
		];
	});

const systemWarrantyRule: Rule = (context) =>
	context.systems.flatMap((system) => {
		if (systemHasWarrantyInfo(context.property, system)) return [];
		const systemName = getSystemName(system);

		return [
			makeRecommendation(context, {
				id: `property-scan:${context.property.id}:system-warranty:${system.id}`,
				systemId: system.id,
				category: 'Documentation Gaps',
				severity: 'low',
				title: `Add warranty info for ${systemName}`,
				description:
					'Upload a warranty document or note where the warranty details are stored.',
				reason: `${systemName} does not have a warranty document linked in this property record.`,
				suggestedActionLabel: 'Upload document',
				suggestedActionType: 'upload_document',
			}),
		];
	});

const systemMaintenanceHistoryRule: Rule = (context) =>
	context.systems.flatMap((system) => {
		if (hasMaintenanceHistory(system, context.maintenanceHistory)) return [];
		const systemName = getSystemName(system);

		return [
			makeRecommendation(context, {
				id: `property-scan:${context.property.id}:system-history:${system.id}`,
				systemId: system.id,
				category: 'Maintenance Opportunities',
				severity: 'medium',
				title: `Record first maintenance note for ${systemName}`,
				description:
					'Add a past service, filter change, repair, or simple note so the history starts in one place.',
				reason: `${systemName} has no maintenance history in Maintley yet.`,
				suggestedActionLabel: 'Open maintenance history',
				suggestedActionType: 'open_maintenance',
			}),
		];
	});

const recurringTaskRule: Rule = (context) =>
	context.systems.flatMap((system) => {
		if (hasLinkedRecurringTask(system, context.tasks)) return [];
		const systemName = getSystemName(system);

		return [
			makeRecommendation(context, {
				id: `property-scan:${context.property.id}:system-recurring-task:${system.id}`,
				systemId: system.id,
				category: 'Maintenance Opportunities',
				severity: 'high',
				title: `Add a recurring reminder for ${systemName}`,
				description:
					'Create a recurring task for the routine maintenance you want to remember for this system.',
				reason: `${systemName} does not have a linked recurring task.`,
				suggestedActionLabel: 'Create task',
				suggestedActionType: 'create_task',
			}),
		];
	});

const documentsAndPhotosRule: Rule = (context) => {
	const recommendations: PropertyScanRecommendation[] = [];
	const hasPropertyDocument = (context.property.documents || []).length > 0;
	const hasPropertyPhoto = !isBlank(context.property.image);

	if (!hasPropertyDocument) {
		recommendations.push(
			makeRecommendation(context, {
				id: `property-scan:${context.property.id}:no-property-documents`,
				category: 'Documentation Gaps',
				severity: 'low',
				title: 'Add a document for this property',
				description:
					'Upload a manual, warranty, receipt, photo, or contractor file that helps support the property record.',
				reason: 'No property documents are saved yet.',
				suggestedActionLabel: 'Upload document',
				suggestedActionType: 'upload_document',
			}),
		);
	}

	if (!hasPropertyPhoto) {
		recommendations.push(
			makeRecommendation(context, {
				id: `property-scan:${context.property.id}:no-property-photo`,
				category: 'Documentation Gaps',
				severity: 'low',
				title: 'Add a property photo',
				description:
					'Add a photo so this property is easier to recognize in your records.',
				reason: 'This property does not have a saved photo yet.',
				suggestedActionLabel: 'Edit property details',
				suggestedActionType: 'edit_property',
			}),
		);
	}

	return recommendations;
};

const overdueTasksRule: Rule = (context) => {
	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);

	return context.tasks.flatMap((task) => {
		const dueDate = getTaskDate(task);
		if (!dueDate || !isTaskOpen(task) || dueDate >= startOfToday) return [];

		return [
			makeRecommendation(context, {
				id: `property-scan:${context.property.id}:overdue-task:${task.id}`,
				category: 'Overdue Work',
				severity: 'high',
				title: `Review overdue task: ${task.title}`,
				description:
					'Open tasks to update the due date, complete the work, or decide the next step.',
				reason: `${task.title} was due on ${dueDate.toLocaleDateString()}.`,
				suggestedActionLabel: 'Open tasks',
				suggestedActionType: 'open_tasks',
			}),
		];
	});
};

const upcomingMaintenanceRule: Rule = (context) => {
	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);
	const upcomingWindow = new Date(startOfToday);
	upcomingWindow.setDate(upcomingWindow.getDate() + 30);

	return context.tasks.flatMap((task) => {
		const dueDate = getTaskDate(task);
		if (
			!dueDate ||
			!isTaskOpen(task) ||
			dueDate < startOfToday ||
			dueDate > upcomingWindow
		) {
			return [];
		}

		return [
			makeRecommendation(context, {
				id: `property-scan:${context.property.id}:upcoming-task:${task.id}`,
				category: 'Maintenance Opportunities',
				severity: 'low',
				title: `Upcoming maintenance: ${task.title}`,
				description:
					'This task is coming due soon. Review it now if you want to plan ahead.',
				reason: `${task.title} is due on ${dueDate.toLocaleDateString()}.`,
				suggestedActionLabel: 'Open tasks',
				suggestedActionType: 'open_tasks',
			}),
		];
	});
};

const suggestedMaintenanceRule: Rule = (context) =>
	context.systems.flatMap((system) => {
		const suggestedSystemId = getSuggestedSystemIdForDevice(system);
		if (!suggestedSystemId) return [];

		const systemName = getSystemName(system);
		return SUGGESTED_TASKS.filter(
			(suggestedTask) => suggestedTask.systemId === suggestedSystemId,
		)
			.filter(
				(suggestedTask) =>
					!context.tasks.some((task) =>
						taskLooksAccepted(task, system, suggestedTask.title),
					),
			)
			.slice(0, 2)
			.map((suggestedTask) =>
				makeRecommendation(context, {
					id: `property-scan:${context.property.id}:suggested-task:${system.id}:${suggestedTask.id}`,
					systemId: system.id,
					category: 'Suggested Next Steps',
					severity: suggestedTask.priority === 'High' ? 'medium' : 'low',
					title: `${suggestedTask.title} for ${systemName}`,
					description:
						suggestedTask.notes ||
						`Consider adding this as a ${suggestedTask.intervalLabel.toLowerCase()} reminder if it applies to this system.`,
					reason: `${systemName} matches a Maintley starter suggestion, and this task is not in the saved task list yet.`,
					suggestedActionLabel: 'Create task',
					suggestedActionType: 'create_task',
				}),
			);
	});

const rules: Rule[] = [
	missingCorePropertyDetailsRule,
	noSystemsRule,
	systemRecordDetailsRule,
	systemInstallDateRule,
	systemWarrantyRule,
	systemMaintenanceHistoryRule,
	recurringTaskRule,
	documentsAndPhotosRule,
	overdueTasksRule,
	upcomingMaintenanceRule,
	suggestedMaintenanceRule,
];

const severityRank: Record<PropertyScanSeverity, number> = {
	high: 0,
	medium: 1,
	low: 2,
};

export const runPropertyScanV1 = ({
	property,
	systems,
	tasks,
	maintenanceHistory,
	dismissedRecommendationIds = [],
	createdAt = new Date().toISOString(),
}: PropertyScanInput): PropertyScanResult => {
	const context: RuleContext = {
		property,
		systems,
		tasks,
		maintenanceHistory,
		createdAt,
	};
	const dismissedIds = new Set(dismissedRecommendationIds);
	const recommendations = rules
		.flatMap((rule) => rule(context))
		.map((recommendation) => ({
			...recommendation,
			status: dismissedIds.has(recommendation.id)
				? ('dismissed' as const)
				: recommendation.status,
		}))
		.sort((left, right) => {
			const severityDelta = severityRank[left.severity] - severityRank[right.severity];
			if (severityDelta !== 0) return severityDelta;
			return left.title.localeCompare(right.title);
		});
	const activeRecommendations = recommendations.filter(
		(recommendation) => recommendation.status === 'active',
	);

	return {
		propertyId: property.id,
		createdAt,
		recommendations,
		activeRecommendations,
		summary: {
			total: recommendations.length,
			active: activeRecommendations.length,
			dismissed: recommendations.length - activeRecommendations.length,
			high: activeRecommendations.filter((item) => item.severity === 'high').length,
			medium: activeRecommendations.filter((item) => item.severity === 'medium').length,
			low: activeRecommendations.filter((item) => item.severity === 'low').length,
			overdue: activeRecommendations.filter((item) => item.category === 'Overdue Work')
				.length,
		},
	};
};
