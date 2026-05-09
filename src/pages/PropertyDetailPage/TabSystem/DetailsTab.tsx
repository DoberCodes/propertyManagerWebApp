import React from 'react';
import { DetailsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	InfoCard,
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { StatusBadge } from './index.styles';
import { isTaskOverdueForDisplay } from '../../../utils/taskUtils';
import { DetailsEditHeader } from '../PropertyDetailPage.styles';
import { PropertyDetailSection } from '../PropertyDetailSection';
import {
	GlanceGrid,
	GlanceCard,
	GlanceLabel,
	GlanceValue,
	QuickActionsBar,
	QuickActionButton,
	PreviewGrid,
	PreviewCard,
	PreviewHeader,
	PreviewList,
	PreviewItem,
	PreviewItemTitle,
	PreviewItemTrailing,
	PreviewItemMeta,
} from './DetailsTab.styles';

export const DetailsTab: React.FC<DetailsTabProps> = ({
	property,
	teamMembers,
	propertyTasks = [],
	maintenanceHistoryRecords = [],
	onCreateTask,
	onCreateDevice,
	onCreateRequest,
}) => {
	const openTasksCount = propertyTasks.length;
	const overdueTasksCount = propertyTasks.filter((task) =>
		isTaskOverdueForDisplay(task as any),
	).length;
	const devicesCount =
		Array.isArray((property as any)?.deviceIds)
			? (property as any).deviceIds.length
			: Array.isArray((property as any)?.devices)
			? (property as any).devices.length
			: 0;
	const recentMaintenanceCount = maintenanceHistoryRecords.length;

	const upcomingTasks = [...propertyTasks]
		.sort((a, b) => {
			const dueA = a?.dueDate ? new Date(a.dueDate).getTime() : Infinity;
			const dueB = b?.dueDate ? new Date(b.dueDate).getTime() : Infinity;
			return dueA - dueB;
		})
		.slice(0, 4);

	const recentMaintenance = [...maintenanceHistoryRecords]
		.sort((a, b) => {
			const timeA = a?.completionDate
				? new Date(a.completionDate).getTime()
				: 0;
			const timeB = b?.completionDate
				? new Date(b.completionDate).getTime()
				: 0;
			return timeB - timeA;
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
					<GlanceLabel>Devices</GlanceLabel>
					<GlanceValue>{devicesCount}</GlanceValue>
				</GlanceCard>
				<GlanceCard>
					<GlanceLabel>History Records</GlanceLabel>
					<GlanceValue>{recentMaintenanceCount}</GlanceValue>
				</GlanceCard>
			</GlanceGrid>

			<QuickActionsBar>
				<QuickActionButton onClick={() => onCreateTask?.()}>
					+ Add Task
				</QuickActionButton>
				<QuickActionButton $variant='secondary' onClick={() => onCreateDevice?.()}>
					+ Add Device
				</QuickActionButton>
				{property?.isRental && (
					<QuickActionButton
						$variant='secondary'
						onClick={() => onCreateRequest?.()}>
						+ Request Maintenance
					</QuickActionButton>
				)}
			</QuickActionsBar>

			{/* Edit Mode Header */}
			<DetailsEditHeader>
				<SectionHeader>Property Information</SectionHeader>
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
					<PreviewHeader>Upcoming Tasks</PreviewHeader>
					<PreviewList>
						{upcomingTasks.length === 0 ? (
							<PreviewItem>
								<PreviewItemTitle>No open tasks</PreviewItemTitle>
								<PreviewItemMeta>All clear</PreviewItemMeta>
							</PreviewItem>
						) : (
							upcomingTasks.map((task) => (
								<PreviewItem key={task.id}>
									<div style={{ minWidth: 0 }}>
										<PreviewItemTitle>{task.title}</PreviewItemTitle>
									</div>
									<PreviewItemTrailing>
										<StatusBadge
											status={task.status}
											style={{ padding: '3px 8px', fontSize: 11 }}>
											{task.status}
										</StatusBadge>
										<PreviewItemMeta>
											{formatPreviewDate(task.dueDate)}
										</PreviewItemMeta>
									</PreviewItemTrailing>
								</PreviewItem>
							))
						)}
					</PreviewList>
				</PreviewCard>

				<PreviewCard>
					<PreviewHeader>Recent Activity</PreviewHeader>
					<PreviewList>
						{recentMaintenance.length === 0 ? (
							<PreviewItem>
								<PreviewItemTitle>No maintenance history yet</PreviewItemTitle>
								<PreviewItemMeta>Start tracking activity</PreviewItemMeta>
							</PreviewItem>
						) : (
							recentMaintenance.map((record) => (
								<PreviewItem key={record.id || `${record.title}-${record.completionDate}`}>
									<PreviewItemTitle>{record.title || 'Maintenance item'}</PreviewItemTitle>
									<PreviewItemMeta>
										{record.completionDate
											? formatPreviewDate(record.completionDate)
											: 'Date unknown'}
									</PreviewItemMeta>
								</PreviewItem>
							))
						)}
					</PreviewList>
				</PreviewCard>
			</PreviewGrid>
		</>
	);
};
