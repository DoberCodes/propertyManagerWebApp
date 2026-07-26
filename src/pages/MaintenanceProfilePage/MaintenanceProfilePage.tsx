import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AppZeroState } from '../../Components/Library/AppZeroState';
import { TaskModal } from '../../Components/Library';
import { TaskAssignModal } from '../../Components/Library/Modal/TaskAssignModal';
import { TaskCompletionModal } from '../../Components/TaskCompletionModal';
import { LoadingState } from '../../Components/LoadingState';
import { useGetAllDevicesQuery } from '../../Redux/API/deviceSlice';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import { useGetTasksQuery } from '../../Redux/API/taskSlice';
import { useGetAllMaintenanceHistoryForUserQuery } from '../../Redux/API/userSlice';
import { RootState } from '../../Redux/store/store';
import { getRoleCapabilities } from '../../utils/permissions';
import { buildDeviceSlug } from '../../utils/deviceSlug';
import { getTaskDisplayStatus } from '../../utils/taskDisplayStatus';
import { getTaskAssigneeDisplayName } from '../../utils/taskUtils';
import { formatCurrency, getFinancialDisplayTotal } from '../../utils/financialUtils';
import { Task } from '../../types/Task.types';
import { mergeMaintenanceHistoryWithDeviceSources } from '../../maintenanceHistory/maintenanceHistoryAdapter';
import {
	DetailLabel,
	DetailList,
	DetailRow,
	DetailValue,
	HeroActions,
	HeroEyebrow,
	HeroStats,
	HeroSubtitle,
	HeroTitle,
	InsightItem,
	InsightList,
	PrimaryAction,
	ProfileGrid,
	ProfileHero,
	ProfileSection,
	RecordCard,
	RecordList,
	RecordMeta,
	RecordTitle,
	RelationshipCard,
	RelationshipGrid,
	RelationshipLabel,
	RelationshipValue,
	SecondaryAction,
	SectionStack,
	SectionText,
	SectionTitle,
	StatCard,
	StatLabel,
	StatValue,
} from './MaintenanceProfilePage.styles';
import {
	AppPage as StandardAppPage,
	AppPageHeader as StandardAppPageHeader,
	AppPageSubtitle as StandardAppPageSubtitle,
	AppPageTitle as StandardAppPageTitle,
	AppPageTitleBlock as StandardAppPageTitleBlock,
} from '../../Components/Library/AppPageLayout/AppPageLayout.styles';

const normalize = (value?: string) =>
	String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const normalizeMaintenanceText = (value?: string): string =>
	normalize(value)
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const singularizeToken = (token: string): string => {
	if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
	if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
	return token;
};

const ACTION_TOKENS = new Set([
	'add',
	'added',
	'change',
	'changed',
	'changing',
	'check',
	'checked',
	'clean',
	'cleaned',
	'inspect',
	'inspected',
	'inspection',
	'maintenance',
	'note',
	'record',
	'recorded',
	'replace',
	'replaced',
	'review',
	'service',
	'serviced',
	'task',
	'test',
	'tested',
]);

const getMaintenanceTokens = (value?: string): string[] =>
	normalizeMaintenanceText(value)
		.split(' ')
		.map(singularizeToken)
		.filter((token) => token.length > 2 && !ACTION_TOKENS.has(token));

const hasAnyToken = (tokens: string[], candidates: string[]) =>
	candidates.some((candidate) => tokens.includes(candidate));

const getMaintenanceTopicKey = (value?: string): string => {
	const tokens = getMaintenanceTokens(value);
	const text = ` ${tokens.join(' ')} `;
	const hasFilter = tokens.includes('filter');
	const hasHvac =
		hasAnyToken(tokens, ['hvac', 'furnace', 'air', 'cooling', 'heating']) ||
		text.includes(' heat pump ') ||
		text.includes(' air conditioner ');
	if (hasFilter && hasHvac) return 'hvac-filter';
	if (hasFilter && hasAnyToken(tokens, ['refrigerator', 'fridge', 'freezer'])) {
		return 'refrigerator-filter';
	}
	if (hasAnyToken(tokens, ['water', 'heater']) && hasAnyToken(tokens, ['flush', 'tank'])) {
		return 'water-heater-service';
	}
	if (hasAnyToken(tokens, ['smoke', 'carbon', 'monoxide', 'detector', 'alarm'])) {
		return 'detector-test';
	}
	if (hasAnyToken(tokens, ['gutter']) && hasAnyToken(tokens, ['clean', 'leaf'])) {
		return 'gutter-cleaning';
	}
	return '';
};

const hasStrongMaintenanceTokenOverlap = (left?: string, right?: string): boolean => {
	const leftTokens = new Set(getMaintenanceTokens(left));
	const rightTokens = new Set(getMaintenanceTokens(right));
	const overlap = Array.from(leftTokens).filter((token) => rightTokens.has(token));
	return overlap.length >= 2;
};

const parseDate = (value?: string): Date | null => {
	if (!value) return null;
	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [year, month, day] = value.split('-').map(Number);
		return new Date(year, month - 1, day);
	}
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value?: string): string => {
	const date = parseDate(value);
	if (!date) return 'Not recorded';
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
};

const formatDateValue = (date?: Date | null): string => {
	if (!date) return 'Not recorded';
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
};

const formatRelativeDue = (value?: string): string => {
	const date = parseDate(value);
	if (!date) return 'No due date set';
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	date.setHours(0, 0, 0, 0);
	const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
	if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
	if (diffDays === 0) return 'Due today';
	if (diffDays === 1) return 'Due tomorrow';
	return `Due in ${diffDays} days`;
};

const formatRecurrence = (task: Task): string => {
	if (!task.isRecurring) return 'One-time maintenance';
	const interval = task.recurrenceInterval || 1;
	const frequency = task.recurrenceFrequency || 'custom';
	if (frequency === 'custom') {
		const unit = task.recurrenceCustomUnit || 'days';
		return `Every ${interval} ${unit}`;
	}
	const labels: Record<string, string> = {
		daily: interval === 1 ? 'Every day' : `Every ${interval} days`,
		weekly: interval === 1 ? 'Every week' : `Every ${interval} weeks`,
		biweekly: 'Every 2 weeks',
		monthly: interval === 1 ? 'Every month' : `Every ${interval} months`,
		quarterly: interval === 1 ? 'Every 3 months' : `Every ${interval * 3} months`,
		yearly: interval === 1 ? 'Every year' : `Every ${interval} years`,
	};
	return labels[frequency] || 'Recurring maintenance';
};

const getExpectedIntervalDays = (task: Task): number | null => {
	if (!task.isRecurring || !task.recurrenceFrequency) return null;
	const interval = task.recurrenceInterval || 1;
	if (task.recurrenceFrequency === 'daily') return interval;
	if (task.recurrenceFrequency === 'weekly') return interval * 7;
	if (task.recurrenceFrequency === 'biweekly') return 14;
	if (task.recurrenceFrequency === 'monthly') return interval * 30;
	if (task.recurrenceFrequency === 'quarterly') return interval * 90;
	if (task.recurrenceFrequency === 'yearly') return interval * 365;
	if (task.recurrenceFrequency === 'custom') {
		const unit = task.recurrenceCustomUnit || 'days';
		if (unit === 'days') return interval;
		if (unit === 'weeks') return interval * 7;
		if (unit === 'months') return interval * 30;
		if (unit === 'years') return interval * 365;
	}
	return null;
};

const getMaintenanceWhy = (task: Task, relatedDevices: any[]): { text: string; interval?: string } => {
	const context = `${task.title || ''} ${task.category || ''} ${relatedDevices
		.map((device) => `${device.type || ''} ${device.assetType || ''}`)
		.join(' ')}`.toLowerCase();
	if (context.includes('filter') && (context.includes('hvac') || context.includes('furnace'))) {
		return {
			text: 'A clean HVAC filter helps maintain airflow, reduces strain on the system, and supports indoor air quality.',
			interval: 'A common starting point is about every 90 days, then adjusted to match the home and filter type.',
		};
	}
	if (context.includes('water heater') || context.includes('flush')) {
		return {
			text: 'Water heater maintenance helps keep service history clear and can make future performance or warranty questions easier to answer.',
			interval: 'Many homes review water heater service yearly, then adjust based on the equipment and service guidance.',
		};
	}
	if (context.includes('smoke') || context.includes('carbon monoxide') || context.includes('detector')) {
		return {
			text: 'Safety-device checks create a record that testing happened and make routine home safety easier to keep visible.',
			interval: 'Many homeowners review detector testing on a monthly or seasonal rhythm.',
		};
	}
	return {
		text: 'This maintenance profile keeps the task, schedule, related records, and service history together so future work starts with context.',
		interval: task.isRecurring ? `Maintley is tracking this as ${formatRecurrence(task).toLowerCase()}.` : undefined,
	};
};

const getTaskOrigin = (task: Task): string => {
	const text = `${task.notes || ''} ${task.description || ''}`.toLowerCase();
	if (text.includes('property setup assistant') || text.includes('home setup assistant')) {
		return 'Created by Property Setup Assistant';
	}
	if (text.includes('suggested by maintley') || text.includes('maintley suggested')) {
		return 'Suggested by Maintley';
	}
	if (text.includes('maintley')) {
		return 'Created from Maintley guidance';
	}
	return 'Created manually';
};

const getTaskLinkKeys = (task: Task): Set<string> => {
	return new Set(
		[
			task.id,
			task.parentTaskId,
			task.maintenanceGroupId,
			(task as any).recurringTaskId,
		]
			.filter(Boolean)
			.map((value) => String(value)),
	);
};

const getEventSearchText = (event: any): string =>
	[
		event.title,
		event.description,
		event.completionNotes,
		event.notes,
		event.category,
		event.eventType,
	]
		.filter(Boolean)
		.join(' ');

const getTaskSearchText = (task: Task): string =>
	[
		task.title,
		task.description,
		task.notes,
		task.category,
		task.location,
	]
		.filter(Boolean)
		.join(' ');

const isRelatedMaintenanceEvent = (event: any, task: Task): boolean => {
	const taskKeys = getTaskLinkKeys(task);
	const eventTaskKeys = [
		event.originalTaskId,
		event.recurringTaskId,
		event.maintenanceCycleId,
		...(Array.isArray(event.linkedTaskIds) ? event.linkedTaskIds : []),
	]
		.filter(Boolean)
		.map((value) => String(value));
	if (eventTaskKeys.some((key) => taskKeys.has(key))) return true;

	if (String(event.propertyId || '') !== String(task.propertyId || '')) {
		return false;
	}

	const taskSearchText = getTaskSearchText(task);
	const eventSearchText = getEventSearchText(event);

	if (
		normalize(event.title || event.description) === normalize(task.title) ||
		normalize(eventSearchText) === normalize(taskSearchText)
	) {
		return true;
	}

	const taskTopic = getMaintenanceTopicKey(taskSearchText);
	const eventTopic = getMaintenanceTopicKey(eventSearchText);
	if (taskTopic && taskTopic === eventTopic) return true;

	return hasStrongMaintenanceTokenOverlap(taskSearchText, eventSearchText);
};

const getEventDate = (event: any): string =>
	event.completionDate || event.completedDate || event.date || event.createdAt || '';

const getEventDescription = (event: any): string =>
	String(event.completionNotes || event.description || event.notes || '').trim();

const getDocumentCount = (task: Task, events: any[], devices: any[]): number => {
	let count = 0;
	if (task.completionFile) count += 1;
	events.forEach((event) => {
		if (event.completionFile) count += 1;
		if (Array.isArray(event.attachments)) count += event.attachments.length;
		if (event.completionFileData) count += 1;
	});
	devices.forEach((device) => {
		if (Array.isArray(device.files)) count += device.files.length;
	});
	return count;
};

const getAverageIntervalDays = (events: any[]): number | null => {
	const dates = events
		.map((event) => parseDate(getEventDate(event)))
		.filter((date): date is Date => Boolean(date))
		.sort((a, b) => a.getTime() - b.getTime());
	if (dates.length < 2) return null;
	const intervals = dates.slice(1).map((date, index) =>
		Math.round((date.getTime() - dates[index].getTime()) / 86400000),
	);
	return Math.round(
		intervals.reduce((total, value) => total + value, 0) / intervals.length,
	);
};

const addDays = (date: Date, days: number): Date => {
	const nextDate = new Date(date);
	nextDate.setDate(nextDate.getDate() + days);
	return nextDate;
};

const getDayDifference = (left: Date, right: Date): number =>
	Math.round((left.getTime() - right.getTime()) / 86400000);

export const MaintenanceProfilePage: React.FC = () => {
	const { taskId } = useParams<{ taskId: string }>();
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const roleCapabilities = useMemo(
		() => getRoleCapabilities(currentUser?.role),
		[currentUser?.role],
	);
	const canManageTasks = roleCapabilities.canManageTasks;
	const { data: tasks = [], isLoading: areTasksLoading } = useGetTasksQuery();
	const { data: properties = [], isLoading: arePropertiesLoading } =
		useGetPropertiesQuery();
	const { data: devices = [], isLoading: areDevicesLoading } = useGetAllDevicesQuery();
	const { data: sourceMaintenanceHistory = [], isLoading: isHistoryLoading } =
		useGetAllMaintenanceHistoryForUserQuery();
	const maintenanceHistory = useMemo(
		() =>
			mergeMaintenanceHistoryWithDeviceSources(
				sourceMaintenanceHistory,
				devices,
			),
		[sourceMaintenanceHistory, devices],
	);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showCompleteModal, setShowCompleteModal] = useState(false);
	const [showAssignModal, setShowAssignModal] = useState(false);

	const task = useMemo(
		() => tasks.find((candidate) => String(candidate.id) === String(taskId)),
		[tasks, taskId],
	);

	const property = useMemo(
		() =>
			properties.find(
				(candidate: any) => String(candidate.id) === String(task?.propertyId || ''),
			),
		[properties, task?.propertyId],
	);

	const relatedDevices = useMemo(() => {
		const linkedIds = new Set((task?.devices || []).map((id) => String(id)));
		maintenanceHistory
			.filter((event: any) => (task ? isRelatedMaintenanceEvent(event, task) : false))
			.forEach((event: any) => {
				(Array.isArray(event.deviceIds) ? event.deviceIds : []).forEach((id: any) =>
					linkedIds.add(String(id)),
				);
			});
		return devices.filter((device: any) => linkedIds.has(String(device.id)));
	}, [devices, maintenanceHistory, task]);

	const relatedEvents = useMemo(() => {
		if (!task) return [];
		return maintenanceHistory
			.filter((event: any) => isRelatedMaintenanceEvent(event, task))
			.sort((a: any, b: any) => {
				const left = parseDate(getEventDate(a))?.getTime() || 0;
				const right = parseDate(getEventDate(b))?.getTime() || 0;
				return right - left;
			});
	}, [maintenanceHistory, task]);

	const status = task ? getTaskDisplayStatus(task) : null;
	const serviceRecordCount = relatedEvents.length;
	const documentCount = task ? getDocumentCount(task, relatedEvents, relatedDevices) : 0;
	const why = task ? getMaintenanceWhy(task, relatedDevices) : null;
	const expectedIntervalDays = task ? getExpectedIntervalDays(task) : null;
	const averageIntervalDays = getAverageIntervalDays(relatedEvents);
	const latestRelatedEvent = relatedEvents[0];
	const latestRelatedEventDate = latestRelatedEvent
		? parseDate(getEventDate(latestRelatedEvent))
		: null;
	const expectedNextServiceDate =
		latestRelatedEventDate && expectedIntervalDays
			? addDays(latestRelatedEventDate, expectedIntervalDays)
			: null;
	const scheduledNextServiceDate = task ? parseDate(task.dueDate) : null;
	const scheduleDateDriftDays =
		expectedNextServiceDate && scheduledNextServiceDate
			? getDayDifference(scheduledNextServiceDate, expectedNextServiceDate)
			: 0;

	const relationshipPropertyHref = property?.slug ? `/property/${property.slug}` : '';
	const firstRelatedDevice = relatedDevices[0];
	const firstRelatedDeviceHref =
		property?.slug && firstRelatedDevice
			? `/property/${property.slug}/device/${buildDeviceSlug(firstRelatedDevice)}?from=tasks`
			: '';

	const costValues = relatedEvents
		.map((event: any) => getFinancialDisplayTotal(event.financials))
		.filter((value): value is number => value !== undefined);
	const lifetimeCost = costValues.reduce((total, value) => total + value, 0);
	const averageCost =
		costValues.length > 0 ? lifetimeCost / costValues.length : undefined;

	const intelligence = useMemo(() => {
		if (!task) return [];
		const insights: string[] = [];
		const scheduleDriftThreshold = expectedIntervalDays
			? Math.max(7, Math.round(expectedIntervalDays * 0.1))
			: 7;
		if (
			latestRelatedEventDate &&
			expectedNextServiceDate &&
			scheduledNextServiceDate &&
			Math.abs(scheduleDateDriftDays) > scheduleDriftThreshold
		) {
			const direction =
				scheduleDateDriftDays > 0 ? 'later than' : 'earlier than';
			const relatedEventTitle =
				latestRelatedEvent?.title || latestRelatedEvent?.description || 'a completed service record';
			const currentReminderTitle = task.title || 'this reminder';
			insights.push(
				`Maintley's records connect this profile to "${relatedEventTitle}", completed ${formatDate(
					getEventDate(latestRelatedEvent),
				)}. Based on the ${formatRecurrence(
					task,
				).toLowerCase()} schedule, the next reminder should be around ${formatDateValue(
					expectedNextServiceDate,
				)}. The current reminder, "${currentReminderTitle}", is scheduled for ${formatDate(
					task.dueDate,
				)}. That is about ${Math.abs(
					scheduleDateDriftDays,
				)} days ${direction} expected, so reviewing the reminder date or service record can help keep this plan aligned.`,
			);
		}
		if (
			averageIntervalDays &&
			expectedIntervalDays &&
			averageIntervalDays > expectedIntervalDays * 1.15
		) {
			insights.push(
				`Average completion has drifted from about ${expectedIntervalDays} days to about ${averageIntervalDays} days.`,
			);
		}
		const lastTwoEvents = relatedEvents.slice(0, 2);
		if (
			lastTwoEvents.length >= 2 &&
			lastTwoEvents.every((event: any) => getFinancialDisplayTotal(event.financials) === undefined)
		) {
			insights.push('No cost has been recorded for the last two service records.');
		}
		if (documentCount === 0 && serviceRecordCount > 0) {
			insights.push('Service history exists, but no related documents are connected yet.');
		}
		if (insights.length === 0) {
			insights.push('Nothing unusual stands out yet. Maintley will have more to compare as this maintenance history grows.');
		}
		return insights;
	}, [
		averageIntervalDays,
		documentCount,
		expectedIntervalDays,
		expectedNextServiceDate,
		latestRelatedEvent,
		latestRelatedEventDate,
		relatedEvents,
		scheduleDateDriftDays,
		scheduledNextServiceDate,
		serviceRecordCount,
		task,
	]);

	if (areTasksLoading || arePropertiesLoading || areDevicesLoading || isHistoryLoading) {
		return (
			<LoadingState
				loadingKey='maintenance-profile'
				title='Opening maintenance profile'
				message='Gathering the task, related records, and maintenance history.'
				steps={[
					'Loading task details...',
					'Connecting property context...',
					'Finding related equipment...',
					'Finding related service records...',
				]}
			/>
		);
	}

	if (!task) {
		return (
			<AppZeroState
				kind='noTaskMatches'
				actions={[{ label: 'Back to Tasks', onClick: () => navigate('/tasks') }]}
				fullPage
			/>
		);
	}

	const assignee = getTaskAssigneeDisplayName(task, 'Unassigned');
	const title = task.title || 'Maintenance Profile';

	return (
		<StandardAppPage>
			<StandardAppPageHeader>
				<StandardAppPageTitleBlock>
					<StandardAppPageTitle>Maintenance Profile</StandardAppPageTitle>
					<StandardAppPageSubtitle>
						Everything Maintley knows about this maintenance program.
					</StandardAppPageSubtitle>
				</StandardAppPageTitleBlock>
			</StandardAppPageHeader>

			<ProfileHero>
				<div>
					<HeroEyebrow>Maintenance Profile</HeroEyebrow>
					<HeroTitle>{title}</HeroTitle>
					<HeroSubtitle>
						This profile connects the maintenance plan, related records, service history, documents, and anything unusual Maintley can see from saved records.
					</HeroSubtitle>
					<HeroActions>
						{canManageTasks && task.status !== 'Completed' && (
							<PrimaryAction type='button' onClick={() => setShowCompleteModal(true)}>
								Complete
							</PrimaryAction>
						)}
						{canManageTasks && (
							<>
								<SecondaryAction type='button' onClick={() => setShowEditModal(true)}>
									Edit
								</SecondaryAction>
								<SecondaryAction type='button' onClick={() => setShowAssignModal(true)}>
									Assign
								</SecondaryAction>
							</>
						)}
						<SecondaryAction type='button' onClick={() => navigate('/tasks')}>
							Back to Tasks
						</SecondaryAction>
					</HeroActions>
				</div>
				<HeroStats>
					<StatCard>
						<StatLabel>Status</StatLabel>
						<StatValue
							$tone={
								status?.isOverdue ? 'danger' : status?.isDueSoon ? 'warning' : 'success'
							}>
							{status?.label || 'Open'} - {formatRelativeDue(task.dueDate)}
						</StatValue>
					</StatCard>
					<StatCard>
						<StatLabel>Maintenance Plan</StatLabel>
						<StatValue>{formatRecurrence(task)}</StatValue>
					</StatCard>
					<StatCard>
						<StatLabel>Service Records</StatLabel>
						<StatValue>{serviceRecordCount}</StatValue>
					</StatCard>
				</HeroStats>
			</ProfileHero>

			<ProfileGrid>
				<SectionStack>
					<ProfileSection>
						<SectionTitle>Created</SectionTitle>
						<DetailList>
							<DetailRow>
								<DetailLabel>Origin</DetailLabel>
								<DetailValue>{getTaskOrigin(task)}</DetailValue>
							</DetailRow>
							<DetailRow>
								<DetailLabel>Created date</DetailLabel>
								<DetailValue>{formatDate(task.createdAt)}</DetailValue>
							</DetailRow>
							<DetailRow>
								<DetailLabel>Assigned to</DetailLabel>
								<DetailValue>{assignee}</DetailValue>
							</DetailRow>
						</DetailList>
					</ProfileSection>

					<ProfileSection>
						<SectionTitle>Related Records</SectionTitle>
						<RelationshipGrid>
							<RelationshipCard
								type='button'
								disabled={!relationshipPropertyHref}
								onClick={() => relationshipPropertyHref && navigate(relationshipPropertyHref)}>
								<RelationshipLabel>Related Property</RelationshipLabel>
								<RelationshipValue>{property?.title || task.propertyTitle || task.property || 'Property not recorded'}</RelationshipValue>
							</RelationshipCard>
							<RelationshipCard
								type='button'
								disabled={!firstRelatedDeviceHref}
								onClick={() => firstRelatedDeviceHref && navigate(firstRelatedDeviceHref)}>
								<RelationshipLabel>Related Equipment</RelationshipLabel>
								<RelationshipValue>
									{relatedDevices.length > 0
										? relatedDevices.map((device: any) => [device.brand, device.type].filter(Boolean).join(' ') || device.type || 'Equipment').join(', ')
										: 'No equipment linked'}
								</RelationshipValue>
							</RelationshipCard>
							<RelationshipCard type='button' disabled>
								<RelationshipLabel>Related Documents</RelationshipLabel>
								<RelationshipValue>{documentCount}</RelationshipValue>
							</RelationshipCard>
							<RelationshipCard type='button' disabled>
								<RelationshipLabel>Related Service Records</RelationshipLabel>
								<RelationshipValue>{serviceRecordCount}</RelationshipValue>
							</RelationshipCard>
						</RelationshipGrid>
					</ProfileSection>

					<ProfileSection>
						<SectionTitle>Why this maintenance matters</SectionTitle>
						<SectionText>{why?.text}</SectionText>
						{why?.interval && (
							<SectionText style={{ marginTop: 10 }}>
								<strong>Typical interval:</strong> {why.interval}
							</SectionText>
						)}
					</ProfileSection>

					<ProfileSection>
						<SectionTitle>Service Records</SectionTitle>
						{relatedEvents.length === 0 ? (
							<SectionText>Completed maintenance will appear here once this program has service history.</SectionText>
						) : (
							<RecordList>
								{relatedEvents.slice(0, 8).map((event: any) => (
									<RecordCard key={event.id || `${event.title}-${getEventDate(event)}`}>
										<RecordTitle>{event.title || title}</RecordTitle>
										<RecordMeta>
											{formatDate(getEventDate(event))}
											{event.completedByName ? ` - Completed by ${event.completedByName}` : ''}
										</RecordMeta>
										{getEventDescription(event) && (
											<RecordMeta>{getEventDescription(event)}</RecordMeta>
										)}
									</RecordCard>
								))}
							</RecordList>
						)}
					</ProfileSection>
				</SectionStack>

				<SectionStack>
					<ProfileSection>
						<SectionTitle>Maintenance Plan</SectionTitle>
						<DetailList>
							<DetailRow>
								<DetailLabel>Schedule</DetailLabel>
								<DetailValue>{formatRecurrence(task)}</DetailValue>
							</DetailRow>
							<DetailRow>
								<DetailLabel>Next due</DetailLabel>
								<DetailValue>{formatDate(task.dueDate)}</DetailValue>
							</DetailRow>
							<DetailRow>
								<DetailLabel>Priority</DetailLabel>
								<DetailValue>{task.priority || 'Low'}</DetailValue>
							</DetailRow>
						</DetailList>
					</ProfileSection>

					<ProfileSection>
						<SectionTitle>Costs</SectionTitle>
						<DetailList>
							<DetailRow>
								<DetailLabel>Lifetime cost</DetailLabel>
								<DetailValue>{costValues.length ? formatCurrency(lifetimeCost) : '-'}</DetailValue>
							</DetailRow>
							<DetailRow>
								<DetailLabel>Average cost</DetailLabel>
								<DetailValue>{averageCost !== undefined ? formatCurrency(averageCost) : '-'}</DetailValue>
							</DetailRow>
							<DetailRow>
								<DetailLabel>Highest cost</DetailLabel>
								<DetailValue>{costValues.length ? formatCurrency(Math.max(...costValues)) : '-'}</DetailValue>
							</DetailRow>
						</DetailList>
					</ProfileSection>

					<ProfileSection>
						<SectionTitle>Related Documents</SectionTitle>
						<SectionText>
							{documentCount > 0
								? `${documentCount} document${documentCount === 1 ? '' : 's'} connected through this task, related service records, or linked equipment.`
								: 'No related documents are connected yet.'}
						</SectionText>
					</ProfileSection>

					<ProfileSection>
						<SectionTitle>Notes</SectionTitle>
						<SectionText>{task.notes || task.description || 'No notes recorded yet.'}</SectionText>
					</ProfileSection>

					<ProfileSection>
						<SectionTitle>Maintley Intelligence</SectionTitle>
						<InsightList>
							{intelligence.map((item) => (
								<InsightItem key={item}>{item}</InsightItem>
							))}
						</InsightList>
					</ProfileSection>
				</SectionStack>
			</ProfileGrid>

			{showEditModal && (
				<TaskModal
					isOpen={showEditModal}
					onClose={() => setShowEditModal(false)}
					editingTaskId={task.id}
					editingTask={task}
					isEditing
					propertyOptions={properties.map((item: any) => ({
						value: item.id,
						label: item.title || 'Untitled Property',
					}))}
					currentUser={currentUser}
				/>
			)}

			{showAssignModal && (
				<TaskAssignModal
					isOpen={showAssignModal}
					onClose={() => setShowAssignModal(false)}
					task={task}
					propertyId={task.propertyId || ''}
					selectedAssignee={null}
				/>
			)}

			{showCompleteModal && (
				<TaskCompletionModal
					taskId={task.id}
					taskTitle={task.title || ''}
					task={task}
					onClose={() => setShowCompleteModal(false)}
					onSuccess={() => setShowCompleteModal(false)}
				/>
			)}
		</StandardAppPage>
	);
};
