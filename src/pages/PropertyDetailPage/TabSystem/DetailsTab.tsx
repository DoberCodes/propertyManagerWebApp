import React, { useMemo } from 'react';
import { DetailsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	InfoCard,
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { StatusBadge } from './index.styles';
import { isTaskOverdueForDisplay } from '../../../utils/taskUtils';
import { getTaskDisplayStatus } from '../../../utils/taskDisplayStatus';
import { DetailsEditHeader } from '../PropertyDetailPage.styles';
import { PropertyDetailSection } from '../PropertyDetailSection';
import {
	getMaintenanceEventDate,
	getMaintenanceEventTitle,
	isContinuityEvent,
} from '../../../utils/maintenanceEventUtils';
import {
	GlanceGrid,
	GlanceCard,
	GlanceLabel,
	GlanceValue,
	PreviewGrid,
	PreviewCard,
	PreviewHeader,
	PreviewList,
	PreviewItem,
	PreviewItemTitle,
	PreviewItemTrailing,
	PreviewItemMeta,
	PreviewEmptyAction,
	TimelineList,
	TimelineItem,
	TimelineBadge,
	TimelineBody,
	TimelineTitle,
	TimelineMeta,
} from './DetailsTab.styles';

export const DetailsTab: React.FC<DetailsTabProps> = ({
	property,
	teamMembers,
	propertyTasks = [],
	propertyDevices = [],
	maintenanceHistoryRecords = [],
	onCreateTask,
	// onCreateDevice,
	// onCreateRequest,
	permissions,
}) => {
	const openTasksCount = propertyTasks.length;
	const overdueTasksCount = propertyTasks.filter((task) =>
		isTaskOverdueForDisplay(task as any),
	).length;
	const devicesCount =
		Array.isArray(propertyDevices)
			? propertyDevices.length
			: Array.isArray((property as any)?.deviceIds)
			? (property as any).deviceIds.length
			: Array.isArray((property as any)?.devices)
			? (property as any).devices.length
			: 0;
	const recentMaintenanceCount = maintenanceHistoryRecords.filter(isContinuityEvent).length;

	const upcomingTasks = [...propertyTasks]
		.sort((a, b) => {
			const dueA = a?.dueDate ? new Date(a.dueDate).getTime() : Infinity;
			const dueB = b?.dueDate ? new Date(b.dueDate).getTime() : Infinity;
			return dueA - dueB;
		})
		.slice(0, 4);

	const formatPreviewDate = (value?: string) => {
		if (!value) {
			return 'ASAP';
		}

		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return 'ASAP';
		}

		return date.toLocaleDateString(undefined, {
			month: 'numeric',
			day: 'numeric',
			year: '2-digit',
		});
	};

	const formatRelativeTime = (value?: string) => {
		if (!value) return 'date unknown';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'date unknown';

		const diffMs = Date.now() - date.getTime();
		const diffDays = Math.round(Math.abs(diffMs) / 86400000);

		if (diffDays === 0) return diffMs >= 0 ? 'today' : 'later today';
		if (diffDays === 1) return diffMs >= 0 ? 'yesterday' : 'tomorrow';
		if (diffDays < 7) return diffMs >= 0 ? `${diffDays} days ago` : `in ${diffDays} days`;
		if (diffDays < 30) {
			const weeks = Math.round(diffDays / 7);
			return diffMs >= 0 ? `${weeks} weeks ago` : `in ${weeks} weeks`;
		}
		const months = Math.round(diffDays / 30);
		return diffMs >= 0 ? `${months} months ago` : `in ${months} months`;
	};

	const propertyTimeline = useMemo(() => {
		type TimelineEvent = {
			key: string;
			type: 'maintenance';
			title: string;
			meta: string;
			date?: string;
		};

		const timelineEvents: TimelineEvent[] = [];

		maintenanceHistoryRecords
			.filter(isContinuityEvent)
			.forEach((record) => {
				const eventDate = getMaintenanceEventDate(record);
				timelineEvents.push({
					key: `maintenance-${record.id || `${record.title}-${eventDate}`}`,
					type: 'maintenance',
					title: getMaintenanceEventTitle(record) || 'Maintenance completed',
					meta: `Logged ${formatRelativeTime(eventDate)}`,
					date: eventDate,
				});
			});

		return timelineEvents
			.sort((a, b) => {
				const left = a.date ? new Date(a.date).getTime() : 0;
				const right = b.date ? new Date(b.date).getTime() : 0;
				return right - left;
			})
			.slice(0, 8);
	}, [maintenanceHistoryRecords]);

	return (
		<>
			<GlanceGrid>
				<GlanceCard>
					<GlanceLabel>Open Tasks</GlanceLabel>
					<GlanceValue>{openTasksCount}</GlanceValue>
				</GlanceCard>
				<GlanceCard>
					<GlanceLabel>Overdue</GlanceLabel>
					<GlanceValue>{overdueTasksCount}</GlanceValue>
				</GlanceCard>
				<GlanceCard>
					<GlanceLabel>Appliances</GlanceLabel>
					<GlanceValue>{devicesCount}</GlanceValue>
				</GlanceCard>
				<GlanceCard>
					<GlanceLabel>Maintenance Records</GlanceLabel>
					<GlanceValue>{recentMaintenanceCount}</GlanceValue>
				</GlanceCard>
			</GlanceGrid>

			{/* {(permissions?.canCreateTasks ||
				permissions?.canManageAppliances ||
				permissions?.canCreateMaintenanceRequests) && (
				<QuickActionsBar>
					{permissions?.canCreateTasks && onCreateTask && (
						<QuickActionButton onClick={() => onCreateTask()}>
							Add Maintenance Task
						</QuickActionButton>
					)}
					{permissions?.canManageAppliances && onCreateDevice && (
						<QuickActionButton $variant='secondary' onClick={() => onCreateDevice()}>
							Add Appliance
						</QuickActionButton>
					)}
					{property?.isRental &&
						!permissions?.canCreateTasks &&
						permissions?.canCreateMaintenanceRequests &&
						onCreateRequest && (
					<QuickActionButton
						$variant='secondary'
						onClick={() => onCreateRequest()}>
						Start Maintenance Request
					</QuickActionButton>
					)}
				</QuickActionsBar>
			)} */}

			{/* Edit Mode Header */}
			<DetailsEditHeader>
				<SectionHeader>Property Maintenance Profile</SectionHeader>
			</DetailsEditHeader>

			<PropertyDetailSection property={property} teamMembers={teamMembers} />

			{/* Notes */}
			{property.notes && (
				<SectionContainer>
					<SectionHeader>Notes</SectionHeader>
					<InfoCard style={{ padding: '16px' }}>
						<p
							style={{
								margin: 0,
								lineHeight: '1.6',
								color: '#333',
								fontSize: '16px',
							}}>
							{property.notes}
						</p>
					</InfoCard>
				</SectionContainer>
			)}

			<PreviewGrid>
				<PreviewCard>
					<PreviewHeader>Upcoming Maintenance Tasks</PreviewHeader>
					<PreviewList>
						{upcomingTasks.length === 0 ? (
							<PreviewItem>
								<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
									<PreviewItemTitle>No open maintenance tasks</PreviewItemTitle>
									<PreviewItemMeta style={{ textAlign: 'left' }}>
										Future work will appear here once tasks are scheduled.
									</PreviewItemMeta>
									{permissions?.canCreateTasks && onCreateTask && (
										<PreviewEmptyAction type='button' onClick={() => onCreateTask()}>
											Add Task
										</PreviewEmptyAction>
									)}
								</div>
							</PreviewItem>
						) : (
							upcomingTasks.map((task) => {
								const displayStatus = getTaskDisplayStatus(task);
								return (
									<PreviewItem key={task.id}>
										<div style={{ minWidth: 0 }}>
											<PreviewItemTitle>{task.title}</PreviewItemTitle>
										</div>
										<PreviewItemTrailing>
											<StatusBadge
												status={displayStatus.label}
												style={{ padding: '3px 8px', fontSize: 11 }}>
												{displayStatus.label}
											</StatusBadge>
											<PreviewItemMeta>
												{formatPreviewDate(task.dueDate)}
											</PreviewItemMeta>
										</PreviewItemTrailing>
									</PreviewItem>
								);
							})
						)}
					</PreviewList>
				</PreviewCard>

				<PreviewCard>
					<PreviewHeader>Property Timeline</PreviewHeader>
					<TimelineList>
						{propertyTimeline.length === 0 ? (
							<PreviewItem>
								<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
									<PreviewItemTitle>No maintenance activity yet</PreviewItemTitle>
									<PreviewItemMeta style={{ textAlign: 'left' }}>
										Completed tasks and service records build this timeline.
									</PreviewItemMeta>
									<PreviewEmptyAction type='button' onClick={() => onCreateTask?.()}>
										Add Task
									</PreviewEmptyAction>
								</div>
							</PreviewItem>
						) : (
							propertyTimeline.map((event) => (
								<TimelineItem key={event.key}>
									<TimelineBadge $type={event.type}>
										Service
									</TimelineBadge>
									<TimelineBody>
										<TimelineTitle>{event.title}</TimelineTitle>
										<TimelineMeta>{event.meta}</TimelineMeta>
									</TimelineBody>
								</TimelineItem>
							))
						)}
					</TimelineList>
				</PreviewCard>
			</PreviewGrid>
		</>
	);
};
