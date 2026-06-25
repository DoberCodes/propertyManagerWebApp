import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useCreateDeviceMutation } from '../../Redux/API/deviceSlice';
import { useUpdatePropertyMutation } from '../../Redux/API/propertySlice';
import { useCreateTaskMutation } from '../../Redux/API/taskSlice';
import { User } from '../../Redux/Slices/userSlice';
import {
	Device,
	Property,
	PropertySetupAssistantItemState,
	PropertySetupAssistantItemStatus,
	PropertySetupAssistantState,
} from '../../types/Property.types';
import { Task } from '../../types/Task.types';
import { useAppFeedback } from '../Library/AppFeedback/AppFeedbackProvider';
import {
	PROPERTY_SETUP_AREAS,
	PropertySetupAreaId,
	getFirstIncompleteSetupAreaId,
	getPropertySetupItem,
	getPropertySetupProgress,
} from '../../utils/propertySetupAssistant';
import {
	SUGGESTED_MAINTENANCE_DISCLAIMER,
	SuggestedSystemId,
	SuggestedTaskTemplate,
	getSuggestedTaskDueDate,
	getSuggestedTaskIdsForSystems,
	getSuggestedTasksForSystems,
} from '../../utils/suggestedMaintenance';
import { getDefaultTaskNotifications } from '../../utils/taskNotificationUtils';
import {
	canUseSuggestedMaintenancePackages,
	canUseUnlimitedSuggestedMaintenancePackages,
	getSuggestedMaintenancePackageLimit,
} from '../../utils/subscriptionUtils';

interface PropertySetupAssistantProps {
	property: Property;
	currentUser?: User | null;
	devices: Device[];
	tasks: Task[];
	canUseAssistant: boolean;
	initiallyOpen?: boolean;
	onInitialOpenHandled?: () => void;
	onAssistantClosed?: () => void;
	onAssistantCompleted?: () => void;
	onAddMoreAppliances?: () => void;
	onUploadDocuments?: () => void;
}

type SetupCompletionSummary = {
	applianceLabels: string[];
	applianceCount: number;
	createdApplianceCount: number;
	taskCount: number;
	createdTaskCount: number;
};

type SuggestedTaskCreateResult = {
	taskIds: string[];
	createdTaskIds: string[];
};

const stripUndefinedValues = (value: any): any => {
	if (Array.isArray(value)) {
		return value.map(stripUndefinedValues);
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([, entryValue]) => entryValue !== undefined)
				.map(([key, entryValue]) => [key, stripUndefinedValues(entryValue)]),
		);
	}
	return value;
};

const normalize = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

const compact = (value: string) => normalize(value).replace(/\s+/g, '');
const SETUP_SAVE_MESSAGE_MIN_MS = 4200;
const PROPERTY_SETUP_ITEM_ORDER = PROPERTY_SETUP_AREAS.flatMap(
	(area) => area.itemIds,
);

const waitForMinimumDuration = (startedAt: number) => {
	const remainingMs = SETUP_SAVE_MESSAGE_MIN_MS - (Date.now() - startedAt);
	if (remainingMs <= 0) {
		return Promise.resolve();
	}
	return new Promise<void>((resolve) => {
		window.setTimeout(resolve, remainingMs);
	});
};

export const PropertySetupAssistant: React.FC<PropertySetupAssistantProps> = ({
	property,
	currentUser,
	devices,
	tasks,
	canUseAssistant,
	initiallyOpen = false,
	onInitialOpenHandled,
	onAssistantClosed,
	onAssistantCompleted,
	onAddMoreAppliances,
	onUploadDocuments,
}) => {
	const feedback = useAppFeedback();
	const [updateProperty] = useUpdatePropertyMutation();
	const [createDevice] = useCreateDeviceMutation();
	const [createTask] = useCreateTaskMutation();
	const initialSetupAssistant = property.setupAssistant || {};
	const [localSetupAssistant, setLocalSetupAssistant] =
		useState<PropertySetupAssistantState>(initialSetupAssistant);
	const setupAssistant = localSetupAssistant;
	const [isOpen, setIsOpen] = useState(false);
	const [draftItems, setDraftItems] = useState<
		NonNullable<PropertySetupAssistantState['items']>
	>(setupAssistant.items || {});
	const [hasUserDraftChanges, setHasUserDraftChanges] = useState(false);
	const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
	const [isCompleteSummaryExpanded, setIsCompleteSummaryExpanded] =
		useState(false);
	const [selectedAreaId, setSelectedAreaId] = useState<PropertySetupAreaId>(
		getFirstIncompleteSetupAreaId(setupAssistant),
	);
	const areaPanelRef = useRef<HTMLDivElement | null>(null);
	const [isSavingAssistant, setIsSavingAssistant] = useState(false);
	const [isSaveComplete, setIsSaveComplete] = useState(false);
	const [completionSummary, setCompletionSummary] =
		useState<SetupCompletionSummary | null>(null);
	const suggestedMaintenancePackageLimit = currentUser?.subscription
		? getSuggestedMaintenancePackageLimit(currentUser.subscription)
		: 0;
	const hasPaidSuggestedMaintenancePackages = currentUser?.subscription
		? canUseSuggestedMaintenancePackages(currentUser.subscription)
		: false;
	const hasUnlimitedSuggestedMaintenancePackages = currentUser?.subscription
		? canUseUnlimitedSuggestedMaintenancePackages(currentUser.subscription)
		: false;

	const propertyDevices = useMemo(
		() =>
			devices.filter(
				(device) =>
					String(device.location?.propertyId || '') === String(property.id),
			),
		[devices, property.id],
	);

	useEffect(() => {
		setLocalSetupAssistant(property.setupAssistant || {});
		if (!isOpen) {
			setDraftItems(property.setupAssistant?.items || {});
		}
	}, [property.id, property.setupAssistant, isOpen]);

	useEffect(() => {
		if (!initiallyOpen || !canUseAssistant) {
			return;
		}

		setIsOpen(true);
		onInitialOpenHandled?.();
	}, [initiallyOpen, canUseAssistant, onInitialOpenHandled]);

	useEffect(() => {
		areaPanelRef.current?.scrollTo({
			top: 0,
			left: 0,
			behavior: 'auto',
		});
	}, [selectedAreaId]);

	if (!canUseAssistant || !currentUser) {
		return null;
	}

	const openAssistant = () => {
		const nextDraftItems = buildDraftItems(setupAssistant.items || {});
		setDraftItems(nextDraftItems);
		setHasUserDraftChanges(false);
		setIsCloseConfirmOpen(false);
		setIsSaveComplete(false);
		setCompletionSummary(null);
		setSelectedAreaId(getFirstIncompleteSetupAreaId({ items: nextDraftItems }));
		setIsOpen(true);
	};

	const selectedAreaIndex = Math.max(
		PROPERTY_SETUP_AREAS.findIndex((area) => area.id === selectedAreaId),
		0,
	);
	const selectedArea =
		PROPERTY_SETUP_AREAS[selectedAreaIndex] || PROPERTY_SETUP_AREAS[0];
	const isFirstArea = selectedAreaIndex === 0;
	const isLastArea = selectedAreaIndex === PROPERTY_SETUP_AREAS.length - 1;
	const draftProgress = getPropertySetupProgress({ items: draftItems });

	const getAreaReviewedCount = (areaId: PropertySetupAreaId) => {
		const area = PROPERTY_SETUP_AREAS.find((item) => item.id === areaId);
		if (!area) return 0;
		return area.itemIds.filter((itemId) => {
			const status = draftItems[itemId]?.status;
			return status === 'present' || status === 'not_present';
		}).length;
	};

	const findExistingDevice = (itemId: SuggestedSystemId) => {
		const item = getPropertySetupItem(itemId);
		if (!item) return null;
		const expectedNames = new Set([
			normalize(item.system.label),
			normalize(item.system.deviceType),
		]);
		const expectedCompacts = new Set([
			compact(item.system.label),
			compact(item.system.deviceType),
		]);

		return (
			propertyDevices.find((device: any) => {
				const name = normalize(String(device.name || ''));
				const type = normalize(String(device.type || ''));
				const compactName = compact(String(device.name || ''));
				const compactType = compact(String(device.type || ''));
				return (
					expectedNames.has(name) ||
					expectedNames.has(type) ||
					expectedCompacts.has(compactName) ||
					expectedCompacts.has(compactType)
				);
			}) || null
		);
	};

	const buildDraftItems = (
		baseItems: NonNullable<PropertySetupAssistantState['items']>,
	) => {
		const nextItems = { ...baseItems };
		PROPERTY_SETUP_AREAS.forEach((area) => {
			area.itemIds.forEach((itemId) => {
				const existingDevice = findExistingDevice(itemId);
				if (!existingDevice?.id) return;

				nextItems[itemId] = {
					...(nextItems[itemId] || {}),
					status: 'present',
					deviceId: existingDevice.id,
				};
			});
		});
		return nextItems;
	};

	const detectedSetupItems = buildDraftItems(setupAssistant.items || {});
	const progress = getPropertySetupProgress({
		...setupAssistant,
		items: detectedSetupItems,
	});
	const hasDetectedUnsavedProgress =
		progress.reviewed >
		getPropertySetupProgress(setupAssistant).reviewed;

	const ensureDeviceForItem = async (
		itemId: SuggestedSystemId,
		sourceItems: NonNullable<PropertySetupAssistantState['items']>,
	) => {
		const existingState = sourceItems[itemId];
		const existingStateDevice = propertyDevices.find(
			(device) => device.id === existingState?.deviceId,
		);
		if (existingStateDevice) {
			return existingStateDevice;
		}

		const existingDevice = findExistingDevice(itemId);
		if (existingDevice) {
			return existingDevice;
		}

		const item = getPropertySetupItem(itemId);
		if (!item) {
			return null;
		}

		try {
			return await createDevice(
				stripUndefinedValues({
					userId: currentUser.id,
					type: item.system.deviceType,
					name: item.system.label,
					brand: '',
					model: '',
					serialNumber: '',
					installationDate: '',
					status: 'Active',
					location: {
						propertyId: property.id,
					},
					notes: 'Created from Property Setup Assistant.',
					maintenanceHistory: [],
				}) as any,
			).unwrap();
		} catch (error) {
			console.warn('Property setup assistant could not create appliance:', {
				itemId,
				error,
			});
			feedback.notify(
				'Marked present, but the appliance/system record could not be created.',
			);
			return null;
		}
	};

	const ensureSuggestedTasksForItem = async (
		itemId: SuggestedSystemId,
		deviceId?: string,
		selectedTaskIds = getSuggestedTaskIdsForSystems([itemId]),
	): Promise<SuggestedTaskCreateResult> => {
		const suggestedTasks = getSuggestedTasksForSystems([itemId], selectedTaskIds);
		const taskIds: string[] = [];
		const createdTaskIds: string[] = [];
		const systemOrderIndex = Math.max(
			PROPERTY_SETUP_ITEM_ORDER.indexOf(itemId),
			0,
		);

		for (const [taskIndex, suggestedTask] of suggestedTasks.entries()) {
			const existingTask = tasks.find((task) => {
				const sameProperty =
					String(task.propertyId || '') === String(property.id);
				const sameTitle = normalize(task.title || '') === normalize(suggestedTask.title);
				const linkedToDevice =
					!deviceId ||
					!Array.isArray(task.devices) ||
					task.devices.length === 0 ||
					task.devices.includes(deviceId);
				return sameProperty && sameTitle && linkedToDevice;
			});

			if (existingTask?.id) {
				taskIds.push(existingTask.id);
				continue;
			}

			try {
				const createdTask = await createTask(
					stripUndefinedValues({
						userId: currentUser.id,
						propertyId: property.id,
						property: property.title,
						propertyTitle: property.title,
						title: suggestedTask.title,
						dueDate: getSuggestedTaskDueDate(
							suggestedTask,
							new Date(
								Date.now() +
									((systemOrderIndex * 5 + taskIndex * 9) % 35) *
										24 *
										60 *
										60 *
										1000,
							),
						),
						status: 'Initiated',
						priority: suggestedTask.priority || 'Medium',
						category: 'Suggested Maintenance',
						notes: [
							`${suggestedTask.title} was added from the Property Setup Assistant.`,
							suggestedTask.notes,
							SUGGESTED_MAINTENANCE_DISCLAIMER,
						]
							.filter(Boolean)
							.join(' '),
						...(hasPaidSuggestedMaintenancePackages
							? {
									isRecurring: true,
									recurrenceFrequency: suggestedTask.recurrenceFrequency,
									recurrenceInterval: suggestedTask.recurrenceInterval,
									recurrenceCustomUnit: suggestedTask.recurrenceCustomUnit,
							  }
							: { isRecurring: false }),
						enableNotifications: true,
						notifications: getDefaultTaskNotifications(),
						...(deviceId ? { devices: [deviceId] } : {}),
					}) as any,
				).unwrap();
				if (createdTask?.id) {
					taskIds.push(createdTask.id);
					createdTaskIds.push(createdTask.id);
				}
			} catch (error) {
				console.warn('Property setup assistant could not create task:', {
					itemId,
					suggestedTask,
					error,
				});
			}
		}

		return { taskIds, createdTaskIds };
	};

	const findExistingSuggestedTask = (
		suggestedTask: SuggestedTaskTemplate,
		deviceId?: string,
	) =>
		tasks.find((task) => {
			const sameProperty = String(task.propertyId || '') === String(property.id);
			const sameTitle =
				normalize(task.title || '') === normalize(suggestedTask.title);
			const linkedToDevice =
				!deviceId ||
				!Array.isArray(task.devices) ||
				task.devices.length === 0 ||
				task.devices.includes(deviceId);
			return sameProperty && sameTitle && linkedToDevice;
		}) || null;

	const getLiveCreatedTaskIds = (taskIds?: string[]) =>
		(taskIds || []).filter((taskId) =>
			tasks.some((task) => String(task.id || '') === String(taskId)),
		);

	const getAllowedSuggestedPackageItemIds = (
		sourceItems: NonNullable<PropertySetupAssistantState['items']> = draftItems,
	) => {
		const allowedItemIds = new Set<SuggestedSystemId>();
		if (hasUnlimitedSuggestedMaintenancePackages) {
			PROPERTY_SETUP_ITEM_ORDER.forEach((itemId) => {
				const state = sourceItems[itemId];
				if (
					state?.status === 'present' &&
					getSelectedSuggestedTaskIds(itemId, state).length > 0
				) {
					allowedItemIds.add(itemId);
				}
			});
			return allowedItemIds;
		}

		if (suggestedMaintenancePackageLimit <= 0) {
			return allowedItemIds;
		}

		PROPERTY_SETUP_ITEM_ORDER.forEach((itemId) => {
			const savedState = setupAssistant.items?.[itemId];
			if (
				savedState?.status === 'present' &&
				getLiveCreatedTaskIds(savedState.taskIds).length > 0 &&
				allowedItemIds.size < suggestedMaintenancePackageLimit
			) {
				allowedItemIds.add(itemId);
			}
		});

		PROPERTY_SETUP_ITEM_ORDER.forEach((itemId) => {
			if (allowedItemIds.size >= suggestedMaintenancePackageLimit) {
				return;
			}

			const state = sourceItems[itemId];
			if (
				state?.status === 'present' &&
				getSelectedSuggestedTaskIds(itemId, state).length > 0
			) {
				allowedItemIds.add(itemId);
			}
		});

		return allowedItemIds;
	};

	const canGenerateSuggestedPackageForItem = (
		itemId: SuggestedSystemId,
		sourceItems: NonNullable<PropertySetupAssistantState['items']> = draftItems,
	) => getAllowedSuggestedPackageItemIds(sourceItems).has(itemId);

	const handleSetStatus = (
		itemId: SuggestedSystemId,
		status: PropertySetupAssistantItemStatus,
	) => {
		if (isSavingAssistant) return;
		setHasUserDraftChanges(true);
		setDraftItems((prev) => ({
			...prev,
			[itemId]: {
				...(prev[itemId] || {}),
				status,
				...(status === 'present' &&
				!Array.isArray(prev[itemId]?.selectedSuggestedTaskIds)
					? {
							selectedSuggestedTaskIds: getSuggestedTaskIdsForSystems([
								itemId,
							]),
					  }
					: {}),
			},
		}));
	};

	const getSelectedSuggestedTaskIds = (
		itemId: SuggestedSystemId,
		state = draftItems[itemId],
	) => {
		const defaultTaskIds = getSuggestedTaskIdsForSystems([itemId]);
		if (!Array.isArray(state?.selectedSuggestedTaskIds)) {
			return defaultTaskIds;
		}
		return state.selectedSuggestedTaskIds.filter((taskId) =>
			defaultTaskIds.includes(taskId),
		);
	};

	const handleRemoveSuggestedTask = (
		itemId: SuggestedSystemId,
		taskId: string,
	) => {
		if (isSavingAssistant) return;
		setHasUserDraftChanges(true);
		setDraftItems((prev) => {
			const currentState = prev[itemId] || { status: 'present' as const };
			return {
				...prev,
				[itemId]: {
					...currentState,
					status: 'present',
					selectedSuggestedTaskIds: getSelectedSuggestedTaskIds(
						itemId,
						currentState,
					).filter((selectedTaskId) => selectedTaskId !== taskId),
				},
			};
		});
	};

	const handleRecreateSuggestedTask = (
		itemId: SuggestedSystemId,
		taskId: string,
	) => {
		if (isSavingAssistant) return;
		setHasUserDraftChanges(true);
		setDraftItems((prev) => {
			const currentState = prev[itemId] || { status: 'present' as const };
			const recreateSuggestedTaskIds = new Set(
				currentState.recreateSuggestedTaskIds || [],
			);
			recreateSuggestedTaskIds.add(taskId);
			return {
				...prev,
				[itemId]: {
					...currentState,
					status: 'present',
					recreateSuggestedTaskIds: Array.from(recreateSuggestedTaskIds),
				},
			};
		});
	};

	const handleBack = () => {
		if (isSavingAssistant || isFirstArea) return;
		setSelectedAreaId(PROPERTY_SETUP_AREAS[selectedAreaIndex - 1].id);
	};

	const handleNext = () => {
		if (isSavingAssistant) return;
		if (isLastArea) {
			handleDone();
			return;
		}
		setSelectedAreaId(PROPERTY_SETUP_AREAS[selectedAreaIndex + 1].id);
	};

	const closeAssistant = () => {
		setIsCloseConfirmOpen(false);
		setIsSaveComplete(false);
		setCompletionSummary(null);
		setIsOpen(false);
		setHasUserDraftChanges(false);
		setDraftItems(setupAssistant.items || {});
		onAssistantClosed?.();
	};

	const handleSaveCompleteOk = () => {
		setIsSaveComplete(false);
		setCompletionSummary(null);
		setIsOpen(false);
		onAssistantCompleted?.();
	};

	const handleAddMoreAppliances = () => {
		setIsSaveComplete(false);
		setCompletionSummary(null);
		setIsOpen(false);
		onAddMoreAppliances?.();
	};

	const handleUploadDocuments = () => {
		setIsSaveComplete(false);
		setCompletionSummary(null);
		setIsOpen(false);
		onUploadDocuments?.();
	};

	const requestCloseAssistant = () => {
		if (isSavingAssistant) return;
		if (hasUserDraftChanges) {
			setIsCloseConfirmOpen(true);
			return;
		}
		closeAssistant();
	};

	const handleDone = async () => {
		if (isSavingAssistant) return;
		const saveStartedAt = Date.now();
		setIsSavingAssistant(true);
		const nowIso = new Date().toISOString();
		const nextItems: NonNullable<PropertySetupAssistantState['items']> = {
			...(setupAssistant.items || {}),
			...draftItems,
		};
		const applianceLabelSet = new Set<string>();
		const linkedTaskIdSet = new Set<string>();
		let createdApplianceCount = 0;
		let createdTaskCount = 0;

		try {
			for (const [itemId, itemState] of Object.entries(draftItems) as Array<
				[SuggestedSystemId, PropertySetupAssistantItemState]
			>) {
				if (!itemState?.status) continue;

				if (itemState.status === 'present') {
					const item = getPropertySetupItem(itemId);
					const hadExistingDevice = Boolean(
						(itemState.deviceId &&
							propertyDevices.some((device) => device.id === itemState.deviceId)) ||
							findExistingDevice(itemId),
					);
					const device = await ensureDeviceForItem(itemId, nextItems);
					if (device?.id && !hadExistingDevice) {
						createdApplianceCount += 1;
					}
					applianceLabelSet.add(item?.system.label || device?.type || itemId);
					const canGenerateSuggestedPackage =
						canGenerateSuggestedPackageForItem(itemId, draftItems);
					const selectedSuggestedTaskIds = canGenerateSuggestedPackage
						? getSelectedSuggestedTaskIds(itemId, itemState)
						: [];
					const liveCreatedTaskIds = getLiveCreatedTaskIds(itemState.taskIds);
					const wasAlreadyReviewed = Boolean(itemState.reviewedAt);
					const recreateSuggestedTaskIds = (
						itemState.recreateSuggestedTaskIds || []
					).filter((taskId) => selectedSuggestedTaskIds.includes(taskId));
					let taskIds = liveCreatedTaskIds;

					if (!wasAlreadyReviewed && liveCreatedTaskIds.length === 0) {
						const taskResult = await ensureSuggestedTasksForItem(
							itemId,
							device?.id,
							selectedSuggestedTaskIds,
						);
						taskIds = taskResult.taskIds;
						createdTaskCount += taskResult.createdTaskIds.length;
					} else if (recreateSuggestedTaskIds.length > 0) {
						const recreatedTaskResult = await ensureSuggestedTasksForItem(
							itemId,
							device?.id,
							recreateSuggestedTaskIds,
						);
						taskIds = Array.from(
							new Set([...liveCreatedTaskIds, ...recreatedTaskResult.taskIds]),
						);
						createdTaskCount += recreatedTaskResult.createdTaskIds.length;
					}
					taskIds.forEach((taskId) => linkedTaskIdSet.add(taskId));

					const nextItemState: PropertySetupAssistantItemState = {
						...itemState,
						status: 'present',
						deviceId: device?.id,
						taskIds,
						recreateSuggestedTaskIds: [],
						reviewedAt: itemState.reviewedAt || nowIso,
						updatedAt: nowIso,
					};
					if (canGenerateSuggestedPackage) {
						nextItemState.selectedSuggestedTaskIds = selectedSuggestedTaskIds;
					} else {
						delete nextItemState.selectedSuggestedTaskIds;
					}
					nextItems[itemId] = nextItemState;
					continue;
				}

				nextItems[itemId] = {
					status: itemState.status,
					...(itemState.status === 'not_present'
						? { reviewedAt: itemState.reviewedAt || nowIso }
						: {}),
					updatedAt: nowIso,
				};
			}

			const nextProgress = getPropertySetupProgress({ items: nextItems });
			const nextSetupAssistant: PropertySetupAssistantState = {
				...setupAssistant,
				items: nextItems,
				...(nextProgress.isComplete
					? {
							completedAt:
								setupAssistant.completedAt || new Date().toISOString(),
					  }
					: {}),
				updatedAt: nowIso,
			};

			await updateProperty({
				id: property.id,
				updates: {
					setupAssistant: nextSetupAssistant,
				},
			}).unwrap();
			await waitForMinimumDuration(saveStartedAt);
			setLocalSetupAssistant(nextSetupAssistant);
			setDraftItems(nextItems);
			setHasUserDraftChanges(false);
			setIsCloseConfirmOpen(false);
			setCompletionSummary({
				applianceLabels: Array.from(applianceLabelSet),
				applianceCount: applianceLabelSet.size,
				createdApplianceCount,
				taskCount: linkedTaskIdSet.size,
				createdTaskCount,
			});
			setIsSaveComplete(true);
		} catch (error) {
			await waitForMinimumDuration(saveStartedAt);
			console.error('Failed to save property setup assistant:', error);
			feedback.notify('Could not save setup progress. Please try again.');
		} finally {
			setIsSavingAssistant(false);
		}
	};

	return (
		<>
			<AssistantCard $complete={progress.isComplete} $compact={progress.isComplete && !isCompleteSummaryExpanded}>
				<AssistantContent>
					{progress.isComplete ? (
						<>
							<CompleteSummaryButton
								type='button'
								onClick={() =>
									setIsCompleteSummaryExpanded((isExpanded) => !isExpanded)
								}
								aria-expanded={isCompleteSummaryExpanded}>
								<span>Property setup complete</span>
								<CompleteSummaryIcon>
									{isCompleteSummaryExpanded ? '-' : '+'}
								</CompleteSummaryIcon>
							</CompleteSummaryButton>
							{isCompleteSummaryExpanded && (
								<ExpandedCompleteSummary>
									<AssistantTitle>
										Your property record has a strong starting point.
									</AssistantTitle>
									<AssistantText>
										Maintley can now review this property record and highlight the few things worth your attention.
									</AssistantText>
									<ProgressText>
										Progress: {progress.reviewed} of {progress.total} reviewed
									</ProgressText>
									<ProgressTrack>
										<ProgressFill
											style={{
												width: `${Math.round(
													(progress.reviewed / progress.total) * 100,
												)}%`,
											}}
										/>
									</ProgressTrack>
								</ExpandedCompleteSummary>
							)}
						</>
					) : (
						<>
							<AssistantEyebrow>Property Setup Assistant</AssistantEyebrow>
							<AssistantTitle>
								Build a more complete record of your property.
							</AssistantTitle>
							<AssistantText>
								Discover systems, appliances, and maintenance opportunities you can review over time.
							</AssistantText>
							{hasDetectedUnsavedProgress && (
								<AssistantText>
									We found matching appliances already on this property. Review setup to save them into your setup progress and add any missing suggested tasks.
								</AssistantText>
							)}
							<ProgressText>
								Progress: {progress.reviewed} of {progress.total} reviewed
							</ProgressText>
							<ProgressTrack>
								<ProgressFill
									style={{
										width: `${Math.round(
											(progress.reviewed / progress.total) * 100,
										)}%`,
									}}
								/>
							</ProgressTrack>
						</>
					)}
				</AssistantContent>
				{(!progress.isComplete || isCompleteSummaryExpanded) && (
					<AssistantButton type='button' onClick={openAssistant}>
						{progress.isComplete ? 'Review Setup' : 'Continue Setup'}
					</AssistantButton>
				)}
			</AssistantCard>

			{isOpen && (
				<ModalOverlay role='dialog' aria-modal='true'>
					<ModalPanel>
						<ModalHeader>
							<div>
								<ModalTitle>Property Setup Assistant</ModalTitle>
								<ModalHint>
									Review one area at a time. You can skip and return whenever you want.
								</ModalHint>
							</div>
							<CloseButton
								type='button'
								onClick={requestCloseAssistant}
								disabled={isSavingAssistant}>
								x
							</CloseButton>
						</ModalHeader>

						<ModalBody>
							<AreaPanel ref={areaPanelRef}>
								<WizardProgressHeader>
									<WizardProgressText>
										Step {selectedAreaIndex + 1} of {PROPERTY_SETUP_AREAS.length}
									</WizardProgressText>
									<WizardProgressTrack>
										<WizardProgressFill
											style={{
												width: `${Math.round(
													((selectedAreaIndex + 1) /
														PROPERTY_SETUP_AREAS.length) *
														100,
												)}%`,
											}}
										/>
									</WizardProgressTrack>
									<WizardStepDots aria-label='Property setup areas'>
										{PROPERTY_SETUP_AREAS.map((area, index) => {
											const reviewed = getAreaReviewedCount(area.id);
											return (
												<WizardStepDotButton
													key={area.id}
													type='button'
													$active={selectedArea.id === area.id}
													$complete={reviewed === area.itemIds.length}
													onClick={() => setSelectedAreaId(area.id)}
													aria-label={`Go to ${area.title}`}>
													{index + 1}
												</WizardStepDotButton>
											);
										})}
									</WizardStepDots>
								</WizardProgressHeader>
								<AreaHeader>
									<div>
										<AreaTitle>{selectedArea.title}</AreaTitle>
										<AreaHint>{selectedArea.hint}</AreaHint>
									</div>
									<AreaReviewedPill>
										{getAreaReviewedCount(selectedArea.id)} of{' '}
										{selectedArea.itemIds.length} reviewed
									</AreaReviewedPill>
								</AreaHeader>

								<ItemList>
									{selectedArea.itemIds.map((itemId) => {
										const item = getPropertySetupItem(itemId);
										if (!item) return null;
										const state = draftItems[itemId];
										const status = state?.status || 'unknown';
										const existingDevice = findExistingDevice(itemId);
										const savedState = setupAssistant.items?.[itemId];
										const linkedDeviceId = state?.deviceId || existingDevice?.id;
										const selectedSuggestedTaskIds =
											getSelectedSuggestedTaskIds(itemId, state);
										const selectedSuggestedTasks =
											getSuggestedTasksForSystems(
												[itemId],
												selectedSuggestedTaskIds,
											);
										const allSuggestedTasks = getSuggestedTasksForSystems(
											[itemId],
											getSuggestedTaskIdsForSystems([itemId]),
										);
										const canGenerateSuggestedPackage =
											canGenerateSuggestedPackageForItem(itemId);
										const isSuggestedPackageLocked =
											!canGenerateSuggestedPackage &&
											allSuggestedTasks.length > 0;
										const visibleSuggestedTasks = isSuggestedPackageLocked
											? allSuggestedTasks
											: selectedSuggestedTasks;
										const wasAlreadyReviewed = Boolean(
											state?.reviewedAt && status === 'present',
										);
										const liveCreatedTaskIds = getLiveCreatedTaskIds(
											state?.taskIds,
										);
										const hasCreatedSuggestedTasks =
											wasAlreadyReviewed && liveCreatedTaskIds.length > 0;

										return (
											<ItemCard key={itemId}>
												<ItemTopRow>
													<ItemInfo>
														<ItemTitle>{item.label}</ItemTitle>
														<ItemMeta>
															{existingDevice && status === 'present'
																? 'Already in Appliances'
																: status === 'present'
																	? 'Will add when you click Done'
																	: status === 'not_present'
																		? 'Not present'
																		: 'Unknown / skipped'}
															{savedState?.status &&
																savedState.status !== status &&
																' - Unsaved change'}
														</ItemMeta>
													</ItemInfo>
													<StateButtonGrid>
														<StateButton
															type='button'
															$active={status === 'present'}
															disabled={isSavingAssistant}
															onClick={() => handleSetStatus(itemId, 'present')}>
															Present
														</StateButton>
														<StateButton
															type='button'
															$active={status === 'not_present'}
															disabled={isSavingAssistant}
															onClick={() => handleSetStatus(itemId, 'not_present')}>
															Not Present
														</StateButton>
														<StateButton
															type='button'
															$active={status === 'unknown'}
															disabled={isSavingAssistant}
															onClick={() => handleSetStatus(itemId, 'unknown')}>
															Unknown
														</StateButton>
													</StateButtonGrid>
												</ItemTopRow>
												{status === 'present' && (
													<TaskPreview>
														<TaskPreviewTitle>
															{isSuggestedPackageLocked
																? 'Suggested Maintenance Available'
																: hasCreatedSuggestedTasks
																? 'Recurring tasks already added'
																: wasAlreadyReviewed
																	? 'Recurring task review'
																	: 'Suggested recurring tasks'}
														</TaskPreviewTitle>
														{isSuggestedPackageLocked && (
															<TaskPreviewNotice>
																{hasPaidSuggestedMaintenancePackages
																	? 'Your current package allowance is already used for this property.'
																	: 'Homeowner+ feature. You can still add this appliance now.'}
															</TaskPreviewNotice>
														)}
														<TaskPreviewList>
															{visibleSuggestedTasks.length > 0 ? (
																visibleSuggestedTasks.map((suggestedTask) => {
																	const existingSuggestedTask =
																		findExistingSuggestedTask(
																			suggestedTask,
																			linkedDeviceId,
																		);
																	const isQueuedForRecreate =
																		state?.recreateSuggestedTaskIds?.includes(
																			suggestedTask.id,
																		) || false;
																	const isMissingReviewedTask =
																		wasAlreadyReviewed && !existingSuggestedTask;

																	return (
																		<TaskPreviewItem key={suggestedTask.id}>
																			<TaskPreviewName>
																				{suggestedTask.title}
																			</TaskPreviewName>
																			<TaskPreviewMeta>
																				<TaskInterval>
																					{suggestedTask.intervalLabel}
																				</TaskInterval>
																				{isSuggestedPackageLocked ? (
																					<TaskStatusText>
																						Homeowner+ Feature
																					</TaskStatusText>
																				) : isMissingReviewedTask ? (
																					isQueuedForRecreate ? (
																						<TaskStatusText>
																							Will recreate
																						</TaskStatusText>
																					) : (
																						<RecreateTaskButton
																							type='button'
																							onClick={() =>
																								handleRecreateSuggestedTask(
																									itemId,
																									suggestedTask.id,
																								)
																							}>
																							Recreate
																						</RecreateTaskButton>
																					)
																				) : wasAlreadyReviewed ? (
																					<TaskStatusText>Added</TaskStatusText>
																				) : (
																					<RemoveTaskButton
																						type='button'
																						aria-label={`Remove ${suggestedTask.title}`}
																						onClick={() =>
																							handleRemoveSuggestedTask(
																								itemId,
																								suggestedTask.id,
																							)
																						}>
																						x
																					</RemoveTaskButton>
																				)}
																			</TaskPreviewMeta>
																		</TaskPreviewItem>
																	);
																})
															) : (
																<EmptyTaskPreview>
																	No suggested tasks selected. The appliance can
																	still be added.
																</EmptyTaskPreview>
															)}
														</TaskPreviewList>
													</TaskPreview>
												)}
											</ItemCard>
										);
									})}
								</ItemList>

								<WizardNavigation>
									<FooterProgress>
										{draftProgress.reviewed} of {draftProgress.total} reviewed
									</FooterProgress>
									<NavigationActions>
										<SecondaryAction
											type='button'
											onClick={isFirstArea ? requestCloseAssistant : handleBack}
											disabled={isSavingAssistant}>
											{isFirstArea ? 'Skip for Now' : 'Back'}
										</SecondaryAction>
										<AssistantButton
											type='button'
											onClick={handleNext}
											disabled={isSavingAssistant}>
											{isSavingAssistant
												? 'Saving...'
												: isLastArea
													? 'Done'
													: 'Next'}
										</AssistantButton>
									</NavigationActions>
								</WizardNavigation>
							</AreaPanel>
						</ModalBody>
					</ModalPanel>
					{isCloseConfirmOpen && (
						<ConfirmPanel role='alertdialog' aria-modal='true'>
							<ConfirmTitle>Save setup changes?</ConfirmTitle>
							<ConfirmText>
								You made changes in this setup review. Saving will create or
								link the appliances marked present and add their suggested
								recurring tasks.
							</ConfirmText>
							<ConfirmActions>
								<SecondaryAction
									type='button'
									onClick={closeAssistant}
									disabled={isSavingAssistant}>
									Discard
								</SecondaryAction>
								<AssistantButton
									type='button'
									onClick={handleDone}
									disabled={isSavingAssistant}>
									{isSavingAssistant ? 'Saving...' : 'Save & Create'}
								</AssistantButton>
							</ConfirmActions>
						</ConfirmPanel>
					)}
					{(isSavingAssistant || isSaveComplete) && (
						<SavingOverlay role='status' aria-live='polite'>
							<SavingCard>
								{isSaveComplete ? (
									<>
										<SavingCompleteIcon aria-hidden='true'>OK</SavingCompleteIcon>
										<SavingTitle>Quick setup review</SavingTitle>
										<ReviewText>
											Here is what was saved for {property.title || 'this property'}.
										</ReviewText>
										<ReviewStats>
											<ReviewStat>
												<strong>{completionSummary?.applianceCount || 0}</strong>
												<span>appliance/system records</span>
											</ReviewStat>
											<ReviewStat>
												<strong>{completionSummary?.taskCount || 0}</strong>
												<span>suggested tasks linked</span>
											</ReviewStat>
										</ReviewStats>
										<ReviewMeta>
											{completionSummary?.createdApplianceCount || 0} new appliance
											{(completionSummary?.createdApplianceCount || 0) === 1 ? '' : 's'} and{' '}
											{completionSummary?.createdTaskCount || 0} new task
											{(completionSummary?.createdTaskCount || 0) === 1 ? '' : 's'} created.
										</ReviewMeta>
										{completionSummary?.applianceLabels?.length ? (
											<ReviewList>
												{completionSummary.applianceLabels.slice(0, 5).map((label) => (
													<li key={label}>{label}</li>
												))}
												{completionSummary.applianceLabels.length > 5 && (
													<li>
														+{completionSummary.applianceLabels.length - 5} more
													</li>
												)}
											</ReviewList>
										) : null}
										<ReviewActions>
											<SavingOkButton type='button' onClick={handleAddMoreAppliances}>
												Add more appliances
											</SavingOkButton>
											<ReviewSecondaryButton
												type='button'
												onClick={handleUploadDocuments}>
												Upload manuals or warranties
											</ReviewSecondaryButton>
											<ReviewLinkButton type='button' onClick={handleSaveCompleteOk}>
												Done
											</ReviewLinkButton>
										</ReviewActions>
									</>
								) : (
									<>
										<SavingHome aria-hidden='true'>
											<SavingRoof />
											<SavingHomeBody>
												<SavingBlock $delay='0s' $slot='one' />
												<SavingBlock $delay='0.14s' $slot='two' />
												<SavingBlock $delay='0.28s' $slot='three' />
												<SavingBlock $delay='0.42s' $slot='four' />
											</SavingHomeBody>
										</SavingHome>
										<SavingTitle>Building your home schedule</SavingTitle>
										<SavingList>
											<li>Creating selected appliances</li>
											<li>Adding maintenance tasks</li>
											<li>Setting up starter dates</li>
										</SavingList>
									</>
								)}
							</SavingCard>
						</SavingOverlay>
					)}
				</ModalOverlay>
			)}
		</>
	);
};

const AssistantCard = styled.section<{ $complete?: boolean; $compact?: boolean }>`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: ${({ $compact }) => ($compact ? '12px' : '16px')};
	align-items: center;
	margin-bottom: 16px;
	padding: ${({ $compact }) => ($compact ? '12px 14px' : '16px')};
	border: 1px solid ${({ $complete }) => ($complete ? '#bbf7d0' : '#dbeafe')};
	border-radius: 12px;
	background: ${({ $complete }) => ($complete ? '#f0fdf4' : '#eff6ff')};

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		padding: 14px;
		gap: 12px;
	}
`;

const AssistantContent = styled.div`
	min-width: 0;
`;

const CompleteSummaryButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	width: 100%;
	border: none;
	background: transparent;
	color: #047857;
	font-size: 13px;
	font-weight: 900;
	text-align: left;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	padding: 0;
	cursor: pointer;
`;

const CompleteSummaryIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 26px;
	border-radius: 999px;
	background: #dcfce7;
	color: #166534;
	font-size: 18px;
	line-height: 1;
	flex: 0 0 auto;
`;

const ExpandedCompleteSummary = styled.div`
	margin-top: 12px;
`;

const AssistantEyebrow = styled.div`
	font-size: 12px;
	font-weight: 800;
	color: #047857;
	text-transform: uppercase;
	letter-spacing: 0.04em;
`;

const AssistantTitle = styled.h2`
	margin: 4px 0;
	font-size: 18px;
	line-height: 1.25;
	color: #0f172a;

	@media (max-width: 640px) {
		font-size: 16px;
	}
`;

const AssistantText = styled.p`
	margin: 0;
	font-size: 13px;
	line-height: 1.45;
	color: #475569;
`;

const ProgressText = styled.div`
	margin-top: 10px;
	font-size: 12px;
	font-weight: 700;
	color: #334155;
`;

const ProgressTrack = styled.div`
	margin-top: 6px;
	height: 8px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.1);
	overflow: hidden;
`;

const ProgressFill = styled.div`
	height: 100%;
	border-radius: inherit;
	background: #16a34a;
`;

const AssistantButton = styled.button`
	border: none;
	border-radius: 10px;
	background: #16a34a;
	color: #ffffff;
	font-size: 14px;
	font-weight: 800;
	padding: 11px 16px;
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		background: #15803d;
	}

	&:disabled {
		opacity: 0.65;
		cursor: wait;
	}

	@media (max-width: 640px) {
		width: 100%;
		min-height: 44px;
	}
`;

const ModalOverlay = styled.div`
	position: fixed;
	inset: 0;
	z-index: 10000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16px;
	background: rgba(15, 23, 42, 0.55);

	@media (max-width: 640px) {
		align-items: center;
		padding: max(20px, calc(16px + env(safe-area-inset-top))) 10px
			max(16px, calc(12px + env(safe-area-inset-bottom)));
	}
`;

const ModalPanel = styled.div`
	width: min(920px, 100%);
	max-height: min(860px, 92vh);
	height: min(860px, 92vh);
	display: flex;
	flex-direction: column;
	border-radius: 14px;
	background: #ffffff;
	box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
	overflow: hidden;

	@media (max-width: 640px) {
		width: 100%;
		height: auto;
		max-height: calc(
			100vh - max(20px, calc(16px + env(safe-area-inset-top))) -
				max(16px, calc(12px + env(safe-area-inset-bottom)))
		);
		border-radius: 14px;

		@supports (height: 100dvh) {
			max-height: calc(
				100dvh - max(20px, calc(16px + env(safe-area-inset-top))) -
					max(16px, calc(12px + env(safe-area-inset-bottom)))
			);
		}
	}
`;

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12px;
	padding: 18px;
	border-bottom: 1px solid #e2e8f0;
	flex-shrink: 0;

	@media (max-width: 640px) {
		padding: 14px;
	}
`;

const ModalTitle = styled.h2`
	margin: 0;
	font-size: 20px;
	color: #0f172a;
`;

const ModalHint = styled.p`
	margin: 4px 0 0;
	font-size: 13px;
	line-height: 1.45;
	color: #64748b;
`;

const CloseButton = styled.button`
	flex: 0 0 auto;
	width: 36px;
	height: 36px;
	border: none;
	border-radius: 999px;
	background: #f1f5f9;
	color: #334155;
	font-size: 24px;
	line-height: 1;
	cursor: pointer;

	&:disabled {
		opacity: 0.5;
		cursor: wait;
	}
`;

const ModalBody = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	overflow: hidden;
	background: #f8fafc;

	@media (max-width: 760px) {
		overflow: hidden;
	}
`;

const AreaPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 18px;
	overflow-y: auto;
	min-height: 0;

	@media (max-width: 640px) {
		padding: 14px;
		gap: 12px;
	}
`;

const WizardProgressHeader = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 14px;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	background: #ffffff;
`;

const WizardProgressText = styled.div`
	font-size: 12px;
	font-weight: 800;
	color: #475569;
	text-transform: uppercase;
	letter-spacing: 0.04em;
`;

const WizardProgressTrack = styled.div`
	height: 8px;
	border-radius: 999px;
	background: #e2e8f0;
	overflow: hidden;
`;

const WizardProgressFill = styled.div`
	height: 100%;
	border-radius: inherit;
	background: #16a34a;
	transition: width 0.2s ease;
`;

const WizardStepDots = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
`;

const WizardStepDotButton = styled.button<{
	$active?: boolean;
	$complete?: boolean;
}>`
	width: 34px;
	height: 34px;
	border-radius: 999px;
	border: 1px solid
		${({ $active, $complete }) =>
			$active || $complete ? '#16a34a' : '#cbd5e1'};
	background: ${({ $active, $complete }) =>
		$active ? '#16a34a' : $complete ? '#dcfce7' : '#ffffff'};
	color: ${({ $active, $complete }) =>
		$active ? '#ffffff' : $complete ? '#166534' : '#475569'};
	font-size: 12px;
	font-weight: 900;
	cursor: pointer;
`;

const AreaHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12px;

	@media (max-width: 520px) {
		flex-direction: column;
	}
`;

const AreaTitle = styled.h3`
	margin: 0;
	font-size: 18px;
	color: #0f172a;
`;

const AreaHint = styled.p`
	margin: 4px 0 0;
	font-size: 13px;
	color: #64748b;
`;

const AreaReviewedPill = styled.div`
	flex: 0 0 auto;
	border-radius: 999px;
	background: #ecfdf5;
	color: #047857;
	font-size: 12px;
	font-weight: 800;
	padding: 7px 10px;
`;

const ItemList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const ItemCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 12px;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	background: #ffffff;

	@media (max-width: 640px) {
		gap: 10px;
		padding: 11px;
	}
`;

const ItemTopRow = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 12px;
	align-items: center;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const ItemInfo = styled.div`
	min-width: 0;
`;

const ItemTitle = styled.div`
	font-size: 14px;
	font-weight: 800;
	color: #0f172a;
`;

const ItemMeta = styled.div`
	margin-top: 3px;
	font-size: 12px;
	font-weight: 700;
	color: #64748b;
`;

const StateButtonGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, auto);
	gap: 8px;

	@media (max-width: 640px) {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	@media (max-width: 380px) {
		grid-template-columns: 1fr;
	}
`;

const StateButton = styled.button<{ $active?: boolean }>`
	border: 1px solid ${({ $active }) => ($active ? '#16a34a' : '#cbd5e1')};
	border-radius: 9px;
	background: ${({ $active }) => ($active ? '#dcfce7' : '#ffffff')};
	color: ${({ $active }) => ($active ? '#166534' : '#334155')};
	font-size: 12px;
	font-weight: 800;
	padding: 9px 10px;
	cursor: pointer;
	white-space: nowrap;

	&:disabled {
		opacity: 0.6;
		cursor: wait;
	}
`;

const TaskPreview = styled.div`
	border-radius: 10px;
	border: 1px solid #dbeafe;
	background: #eff6ff;
	padding: 10px;
`;

const TaskPreviewTitle = styled.div`
	margin-bottom: 8px;
	font-size: 12px;
	font-weight: 900;
	color: #1e3a8a;
`;

const TaskPreviewNotice = styled.div`
	margin-bottom: 8px;
	padding: 8px 10px;
	border-radius: 8px;
	background: #fffbeb;
	border: 1px solid #fde68a;
	color: #92400e;
	font-size: 12px;
	font-weight: 700;
	line-height: 1.4;
`;

const TaskPreviewList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

const TaskPreviewItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
	font-size: 12px;
	font-weight: 700;
	color: #1e293b;

	@media (max-width: 420px) {
		flex-direction: column;
		gap: 2px;
	}
`;

const TaskPreviewName = styled.span`
	min-width: 0;
`;

const TaskPreviewMeta = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex: 0 0 auto;
`;

const TaskInterval = styled.span`
	flex: 0 0 auto;
	color: #2563eb;
`;

const RemoveTaskButton = styled.button`
	width: 24px;
	height: 24px;
	border: 1px solid #bfdbfe;
	border-radius: 999px;
	background: #ffffff;
	color: #475569;
	font-size: 14px;
	font-weight: 900;
	line-height: 1;
	cursor: pointer;

	&:hover {
		border-color: #ef4444;
		color: #b91c1c;
	}
`;

const RecreateTaskButton = styled.button`
	border: 1px solid #bfdbfe;
	border-radius: 999px;
	background: #ffffff;
	color: #1d4ed8;
	font-size: 12px;
	font-weight: 900;
	padding: 5px 9px;
	cursor: pointer;

	&:hover {
		border-color: #2563eb;
		background: #dbeafe;
	}
`;

const TaskStatusText = styled.span`
	border-radius: 999px;
	background: #ffffff;
	color: #64748b;
	font-size: 11px;
	font-weight: 900;
	padding: 5px 8px;
`;

const EmptyTaskPreview = styled.div`
	font-size: 12px;
	font-weight: 700;
	color: #64748b;
`;

const WizardNavigation = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
	padding-top: 14px;
	margin-top: 4px;
	border-top: 1px solid #e2e8f0;

	@media (max-width: 640px) {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		padding: 12px 14px max(12px, env(safe-area-inset-bottom));
		gap: 8px;
	}

	@media (max-width: 420px) {
		grid-template-columns: 1fr 1fr;
	}
`;

const NavigationActions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 10px;

	@media (max-width: 420px) {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: 1fr 1fr;
	}
`;

const FooterProgress = styled.div`
	margin-right: auto;
	font-size: 12px;
	font-weight: 800;
	color: #64748b;

	@media (max-width: 420px) {
		grid-column: 1 / -1;
	}
`;

const SecondaryAction = styled.button`
	border: none;
	background: transparent;
	color: #475569;
	font-size: 14px;
	font-weight: 800;
	padding: 11px 14px;
	cursor: pointer;

	&:disabled {
		opacity: 0.55;
		cursor: wait;
	}

	@media (max-width: 420px) {
		padding-inline: 8px;
	}
`;

const ConfirmPanel = styled.div`
	position: fixed;
	left: 50%;
	top: 50%;
	z-index: 10001;
	width: min(420px, calc(100vw - 32px));
	transform: translate(-50%, -50%);
	border-radius: 14px;
	background: #ffffff;
	box-shadow: 0 24px 80px rgba(15, 23, 42, 0.36);
	padding: 18px;
`;

const ConfirmTitle = styled.h3`
	margin: 0;
	font-size: 18px;
	color: #0f172a;
`;

const ConfirmText = styled.p`
	margin: 8px 0 0;
	font-size: 13px;
	line-height: 1.5;
	color: #475569;
`;

const ConfirmActions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 16px;

	@media (max-width: 420px) {
		display: grid;
		grid-template-columns: 1fr;
	}
`;

const SavingOverlay = styled.div`
	position: fixed;
	inset: 0;
	z-index: 10002;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	background: rgba(15, 23, 42, 0.58);
`;

const SavingCard = styled.div`
	width: min(420px, 100%);
	border-radius: 18px;
	background: #ffffff;
	box-shadow: 0 24px 80px rgba(15, 23, 42, 0.34);
	padding: 28px;
`;

const SavingHome = styled.div`
	position: relative;
	width: 72px;
	height: 62px;
	margin: 0 auto 18px;
`;

const SavingRoof = styled.div`
	position: absolute;
	left: 12px;
	top: 1px;
	width: 48px;
	height: 48px;
	background: #16a34a;
	transform: rotate(45deg);
	border-radius: 6px 6px 2px 6px;
	animation: property-setup-build-roof 1.8s ease-in-out infinite;

	@keyframes property-setup-build-roof {
		0%,
		34% {
			opacity: 0;
			transform: translateY(-16px) rotate(45deg) scale(0.88);
		}

		58%,
		86% {
			opacity: 1;
			transform: translateY(0) rotate(45deg) scale(1);
		}

		100% {
			opacity: 0.55;
			transform: translateY(0) rotate(45deg) scale(1);
		}
	}
`;

const SavingHomeBody = styled.div`
	position: absolute;
	left: 10px;
	bottom: 0;
	width: 52px;
	height: 38px;
	border-radius: 8px;
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	overflow: hidden;
`;

const SavingBlock = styled.div<{ $delay: string; $slot: 'one' | 'two' | 'three' | 'four' }>`
	position: absolute;
	width: 19px;
	height: 13px;
	border-radius: 4px;
	background: #16a34a;
	left: ${({ $slot }) =>
		$slot === 'one' || $slot === 'three' ? '6px' : '27px'};
	top: ${({ $slot }) =>
		$slot === 'one' || $slot === 'two' ? '6px' : '21px'};
	animation: property-setup-build-block 1.8s ease-in-out infinite;
	animation-delay: ${({ $delay }) => $delay};
	transform-origin: center;

	@keyframes property-setup-build-block {
		0% {
			opacity: 0;
			transform: translateY(24px) scale(0.88);
		}

		28%,
		78% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}

		100% {
			opacity: 0.45;
			transform: translateY(0) scale(1);
		}
	}
`;

const SavingTitle = styled.div`
	font-size: 20px;
	font-weight: 900;
	line-height: 1.3;
	color: #0f172a;
	text-align: center;
`;

const SavingList = styled.ul`
	display: grid;
	gap: 8px;
	margin: 16px 0 0;
	padding: 0;
	list-style: none;
	font-size: 14px;
	line-height: 1.4;
	color: #475569;

	li {
		position: relative;
		padding-left: 18px;
	}

	li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55em;
		width: 7px;
		height: 7px;
		border-radius: 999px;
		background: #16a34a;
	}
`;

const SavingCompleteIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 54px;
	height: 54px;
	margin: 0 auto 18px;
	border-radius: 999px;
	background: #dcfce7;
	color: #15803d;
	font-size: 28px;
	font-weight: 900;
`;

const SavingOkButton = styled.button`
	width: 100%;
	margin-top: 18px;
	border: none;
	border-radius: 10px;
	background: #16a34a;
	color: #ffffff;
	font-size: 15px;
	font-weight: 900;
	padding: 12px 16px;
	cursor: pointer;

	&:hover {
		background: #15803d;
	}
`;

const ReviewText = styled.p`
	margin: 8px 0 0;
	color: #475569;
	font-size: 14px;
	line-height: 1.5;
	text-align: center;
`;

const ReviewStats = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
	margin-top: 16px;

	@media (max-width: 420px) {
		grid-template-columns: 1fr;
	}
`;

const ReviewStat = styled.div`
	padding: 12px;
	border: 1px solid #dcfce7;
	border-radius: 12px;
	background: #f0fdf4;
	text-align: center;

	strong {
		display: block;
		color: #0f172a;
		font-size: 22px;
		line-height: 1;
	}

	span {
		display: block;
		margin-top: 6px;
		color: #475569;
		font-size: 12px;
		font-weight: 800;
		line-height: 1.3;
	}
`;

const ReviewMeta = styled.div`
	margin-top: 12px;
	color: #64748b;
	font-size: 12px;
	font-weight: 700;
	line-height: 1.4;
	text-align: center;
`;

const ReviewList = styled.ul`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 8px;
	margin: 14px 0 0;
	padding: 0;
	list-style: none;

	li {
		border: 1px solid #e2e8f0;
		border-radius: 999px;
		background: #f8fafc;
		color: #334155;
		font-size: 12px;
		font-weight: 800;
		line-height: 1.2;
		padding: 6px 10px;
	}
`;

const ReviewActions = styled.div`
	display: grid;
	gap: 10px;
	margin-top: 18px;

	${SavingOkButton} {
		margin-top: 0;
	}
`;

const ReviewSecondaryButton = styled(SavingOkButton)`
	margin-top: 0;
	border: 1px solid #bbf7d0;
	background: #ecfdf5;
	color: #047857;

	&:hover {
		background: #d1fae5;
	}
`;

const ReviewLinkButton = styled.button`
	border: none;
	background: transparent;
	color: #475569;
	font-size: 14px;
	font-weight: 800;
	padding: 8px 12px;
	cursor: pointer;
	text-decoration: underline;
	text-underline-offset: 3px;
`;
