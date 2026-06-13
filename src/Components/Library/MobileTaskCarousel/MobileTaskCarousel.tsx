import React, { useState, useRef } from 'react';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	CarouselContainer,
	CarouselViewport,
	CarouselTrack,
	TaskCard,
	CardContent,
	CardHeader,
	CardTitle,
	CardProperty,
	CardMeta,
	MetaItem,
	MetaLabel,
	MetaValue,
	CardActions,
	ActionButton,
	IndicatorDots,
	Dot,
	NoTasks,
} from './MobileTaskCarousel.styles';

import { Task, TaskHandlers } from '../../../types/Task.types';
import { getTaskDisplayStatus } from '../../../utils/taskDisplayStatus';
import { TaskModal } from '../Modal';

interface MobileTaskCarouselProps {
	tasks: Task[];
	onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
	onTaskComplete?: (taskId: string) => void;
	onTaskAssign?: (taskId: string) => void;
	// Optional shared task handlers (from useTaskHandlers)
	taskHandlers?: TaskHandlers;
}

export const MobileTaskCarousel: React.FC<MobileTaskCarouselProps> = ({
	tasks,
	onTaskUpdate,
	onTaskComplete,
	onTaskAssign,
	taskHandlers,
}) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState(0);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);

	// EditTaskModal visibility (modal owns its own form state)
	const [showEditModal, setShowEditModal] = useState(false);
	const trackRef = useRef<HTMLDivElement>(null);

	if (tasks.length === 0) {
		return (
			<NoTasks>
				<div>📋 No tasks yet</div>
				<div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
					Start by creating a task
				</div>
			</NoTasks>
		);
	}

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsDragging(true);
		setDragStart(e.clientX);
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		setIsDragging(true);
		setDragStart(e.touches[0].clientX);
	};

	const handleMouseUp = (e: React.MouseEvent) => {
		handleDragEnd(e.clientX);
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		handleDragEnd(e.changedTouches[0].clientX);
	};

	const handleDragEnd = (endPos: number) => {
		if (!isDragging) return;
		setIsDragging(false);

		const diff = dragStart - endPos;
		const threshold = 50; // Minimum distance to trigger slide

		if (Math.abs(diff) > threshold) {
			if (diff > 0 && currentIndex < tasks.length - 1) {
				// Swiped left, go to next card
				setCurrentIndex(currentIndex + 1);
			} else if (diff < 0 && currentIndex > 0) {
				// Swiped right, go to previous card
				setCurrentIndex(currentIndex - 1);
			}
		}
	};

	const currentTask = tasks[currentIndex];

	const getPriorityColor = (priority?: string) => {
		switch (priority?.toLowerCase()) {
			case 'high':
				return '#dc2626';
			case 'medium':
				return '#f59e0b';
			case 'low':
				return '#10b981';
			default:
				return '#6b7280';
		}
	};

	const handleCardClick = () => {
		setSelectedTask(currentTask);
	};

	const handleEditClick = () => {
		setSelectedTask(currentTask);

		// If shared task handlers are passed in, use them to show the app-wide modal
		if (taskHandlers) {
			const th = taskHandlers;
			th.setEditingTaskId(currentTask.id);
			th.setShowTaskDialog(true);
			return;
		}

		// Fallback: open local modal (modal will initialize its own form state)
		setShowEditModal(true);
	};

	const handleAssignClick = () => {
		// If shared task handlers are passed in, use them
		if (taskHandlers && taskHandlers.handleAssignTask) {
			taskHandlers.handleAssignTask(currentTask.id);
			return;
		}

		// Fallback: use the onTaskAssign prop
		onTaskAssign?.(currentTask.id);
	};

	const handleDetailModalClose = () => {
		setSelectedTask(null);
		setShowEditModal(false);
	};

	return (
		<>
			<CarouselContainer>
				<CarouselViewport>
					<CarouselTrack
						ref={trackRef}
						onMouseDown={handleMouseDown}
						onMouseUp={handleMouseUp}
						onTouchStart={handleTouchStart}
						onTouchEnd={handleTouchEnd}
						style={{
							transform: `translateX(calc(-${currentIndex} * (100% + 16px)))`,
							cursor: isDragging ? 'grabbing' : 'grab',
						}}>
						{tasks.map((task) => {
							const displayStatus = getTaskDisplayStatus(task);
							return (
						<TaskCard key={task.id} $overdue={displayStatus.isOverdue} onClick={handleCardClick}>
								<CardHeader>
									<CardTitle>{task.title}</CardTitle>
									<div
										style={{
											fontSize: '12px',
											color: getPriorityColor(task.priority),
											fontWeight: 600,
											textTransform: 'uppercase',
											letterSpacing: '0.5px',
										}}>
										{task.priority || 'Normal'}
									</div>
								</CardHeader>

								<CardContent>
									<CardProperty>
										{task.property || 'Unknown Property'}
									</CardProperty>

									<CardMeta>
										<MetaItem>
											<MetaLabel>Status</MetaLabel>
											<MetaValue
												style={{
													color: displayStatus.color,
													fontWeight: displayStatus.isOverdue ? 700 : undefined,
												}}>
												{displayStatus.label}
											</MetaValue>
										</MetaItem>

										{task.dueDate && (
											<MetaItem>
												<MetaLabel>Due</MetaLabel>
												<MetaValue
													style={{
														color: displayStatus.isOverdue ? '#dc2626' : undefined,
														fontWeight: displayStatus.isOverdue ? 700 : undefined,
													}}>
													{new Date(task.dueDate).toLocaleDateString('en-US', {
														month: 'short',
														day: 'numeric',
													})}
												</MetaValue>
											</MetaItem>
										)}

										{task.assignedTo && (
											<MetaItem>
												<MetaLabel>Assigned</MetaLabel>
												<MetaValue>
													{typeof task.assignedTo === 'object'
														? task.assignedTo.name
														: task.assignedTo || 'Unassigned'}
												</MetaValue>
											</MetaItem>
										)}
									</CardMeta>

									{task.notes && (
										<div
											style={{
												marginTop: '12px',
												fontSize: '14px',
												color: '#4b5563',
												lineHeight: '1.4',
											}}>
											{task.notes}
										</div>
									)}
								</CardContent>

								<CardActions>
									{task.status !== 'Completed' && (
										<ActionButton
											onClick={(e) => {
												e.stopPropagation();
												onTaskComplete?.(task.id);
											}}
											style={{ backgroundColor: '#10b981', color: 'white' }}>
											✓ Complete
										</ActionButton>
									)}
									<ActionButton
										onClick={(e) => {
											e.stopPropagation();
											handleEditClick();
										}}
										style={{ backgroundColor: '#3b82f6', color: 'white' }}>
										Edit
									</ActionButton>
									<ActionButton
										onClick={(e) => {
											e.stopPropagation();
											handleAssignClick();
										}}
										style={{ backgroundColor: '#8b5cf6', color: 'white' }}>
										<FontAwesomeIcon
											icon={faUserPlus}
											style={{ marginRight: '4px' }}
										/>
										Assign
									</ActionButton>
								</CardActions>
							</TaskCard>
							);
						})}
					</CarouselTrack>
				</CarouselViewport>

				{tasks.length > 1 && (
					<IndicatorDots>
						{tasks.map((_, index) => (
							<Dot
								key={index}
								$active={index === currentIndex}
								onClick={() => setCurrentIndex(index)}
							/>
						))}
					</IndicatorDots>
				)}
			</CarouselContainer>

			{selectedTask && (
				<TaskModal
					isOpen={showEditModal}
					isEditing={true}
					initialTask={
						{
							...selectedTask,
							assignedTo:
								typeof selectedTask.assignedTo === 'string'
									? selectedTask.assignedTo
									: selectedTask.assignedTo?.id,
						} as any
					}
					onClose={handleDetailModalClose}
					onSaved={(updated) => {
						handleDetailModalClose();
						if (updated && onTaskUpdate) onTaskUpdate(updated.id, updated);
					}}
					statusOptions={['Initiated', 'Completed']}
				/>
			)}
		</>
	);
};

export default MobileTaskCarousel;
