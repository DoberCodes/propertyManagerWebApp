import React from 'react';
import { DetailsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	InfoCard,
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { StatusBadge } from './index.styles';
import {
	compareTasksByDueUrgency,
	isTaskOverdueForDisplay,
} from '../../../utils/taskUtils';
import { getTaskDisplayStatus } from '../../../utils/taskDisplayStatus';
import { DetailsEditHeader } from '../PropertyDetailPage.styles';
import { PropertyDetailSection } from '../PropertyDetailSection';
import { isContinuityEvent } from '../../../utils/maintenanceEventUtils';
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
} from './DetailsTab.styles';

export const DetailsTab: React.FC<DetailsTabProps> = ({
	property,
	teamMembers,
	familyMembers = [],
	homeownerMode = false,
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
		.sort(compareTasksByDueUrgency)
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
					<GlanceLabel>Equipment</GlanceLabel>
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
							Add Equipment
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
				<SectionHeader>Maintenance Profile</SectionHeader>
			</DetailsEditHeader>

			<PropertyDetailSection
				property={property}
				teamMembers={teamMembers}
				familyMembers={familyMembers}
				homeownerMode={homeownerMode}
			/>

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
			</PreviewGrid>
		</>
	);
};
