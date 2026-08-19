import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';
import {
	useCreateDeviceMutation,
	useUpdateDeviceMutation,
} from '../../Redux/API/deviceSlice';
import { useUpdatePropertyMutation } from '../../Redux/API/propertySlice';
import {
	useCreateTaskMutation,
	useUpdateTaskMutation,
} from '../../Redux/API/taskSlice';
import {
	useCreatePropertySpaceMutation,
	useGetPropertySpacesQuery,
} from '../../Redux/API/spaceSlice';
import {
	useGetPropertyKnowledgeLinksQuery,
	useSetEquipmentSpaceLinksMutation,
	useSetTaskSpaceLinksMutation,
} from '../../Redux/API/propertyKnowledgeLinkSlice';
import { apiSlice } from '../../Redux/API/apiSlice';
import type { AppDispatch } from '../../Redux/store/store';
import { User } from '../../Redux/Slices/userSlice';
import {
	Device,
	Property,
	PropertySetupAssistantEquipmentInstance,
	PropertySetupAssistantItemState,
	PropertySetupAssistantItemStatus,
	PropertySetupAssistantState,
} from '../../types/Property.types';
import { Task } from '../../types/Task.types';
import { useAppFeedback } from '../Library/AppFeedback/AppFeedbackProvider';
import {
	PROPERTY_SETUP_AREAS,
	PROPERTY_SETUP_ESSENTIAL_AREAS,
	PropertySetupAreaId,
	PropertySetupPath,
	getFirstIncompleteSetupAreaId,
	getPropertySetupInstanceName,
	getPropertySetupItem,
	getPropertySetupProgress,
	getPropertySetupSubtypeOptions,
	getUnreviewedDetectedSetupItemIds,
	isDistributedPropertySetupItem,
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
	getEffectiveAccessPlanId,
	getSuggestedMaintenancePackageLimit,
} from '../../utils/subscriptionUtils';
import {
	getDeviceAssetVariant,
	normalizeAssetType,
	normalizeAssetVariant,
} from '../../utils/systemTypes';
import { COLORS } from '../../constants/colors';
import { LoadingState } from '../LoadingState';
import {
	getAnalyticsErrorCode,
	trackAnalyticsEvent,
} from '../../analytics/analytics';
import {
	WORKFLOW_SUPPORT_CODES,
	withWorkflowSupportCode,
} from '../../utils/workflowSupportCodes';
import {
	activatePropertySetupMaintenancePlan,
	type PropertySetupTaskProposal,
} from '../../services/propertySetupAssistantService';
import {
	clearPropertySetupDraft,
	readPropertySetupDraft,
	writePropertySetupDraft,
} from './propertySetupDraft';
import {
	buildPropertyProfileSpaceTemplates,
	ensureGeneratedPropertySpaces,
	getSetupAreaSpaceTemplates,
	planGeneratedPropertySpaces,
} from '../../propertyKnowledge/propertySpaceGeneration';
import {
	getEquipmentSpaceIds,
	getTaskSpaceIds,
} from '../../types/PropertyKnowledgeLink.types';
import type { PropertySpace, PropertySpaceType } from '../../types/Space.types';

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
	spaceCount: number;
	createdSpaceCount: number;
};

type SuggestedTaskCreateResult = {
	taskIds: string[];
	createdTaskIds: string[];
};

const getSetupLoadingSteps = (isHomeownerMode: boolean) => [
	isHomeownerMode ? 'Updating your home record...' : 'Updating your property record...',
	'Setting up your maintenance schedule...',
	'Organizing your home information...',
	isHomeownerMode ? 'Reviewing your home...' : 'Reviewing your property...',
	'Building maintenance insights...',
	'Almost ready...',
];

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
const TRUSTED_SETUP_PLAN_ACTIVATION_ENABLED =
	process.env.REACT_APP_ENABLE_TRUSTED_SETUP_PLAN_ACTIVATION === 'true';
const PROPERTY_SETUP_ITEM_ORDER = PROPERTY_SETUP_AREAS.flatMap(
	(area) => area.itemIds,
);

type ActivePropertySetupPath = Exclude<PropertySetupPath, 'existing_report'>;

const getDraftProposalCount = (
	items: NonNullable<PropertySetupAssistantState['items']>,
) =>
	Object.entries(items).reduce((count, [itemId, itemState]) => {
		if (itemState?.status !== 'present') return count;
		const defaultTaskIds = getSuggestedTaskIdsForSystems([
			itemId as SuggestedSystemId,
		]);
		const selectedTaskIds = Array.isArray(itemState.selectedSuggestedTaskIds)
			? itemState.selectedSuggestedTaskIds.filter((taskId) =>
					defaultTaskIds.includes(taskId),
				)
			: defaultTaskIds;
		return count + selectedTaskIds.length;
	}, 0);

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
	const dispatch = useDispatch<AppDispatch>();
	const effectivePlanId = getEffectiveAccessPlanId(currentUser?.subscription);
	const isHomeownerMode = currentUser?.workspaceMode
		? currentUser.workspaceMode === 'homeowner'
		: effectivePlanId === 'homeowner' ||
			effectivePlanId === 'homeowner_plus';
	const setupLanguage = {
		eyebrow: isHomeownerMode ? 'Home Setup Assistant' : 'Property Setup Assistant',
		completeLabel: isHomeownerMode ? 'Home setup complete' : 'Property setup complete',
		recordNoun: isHomeownerMode ? 'home record' : 'property record',
		mainTitle: isHomeownerMode
			? 'Build a more complete record of your home.'
			: 'Build a more complete record of your property.',
		intro: isHomeownerMode
			? 'Discover equipment, documents, and maintenance opportunities you can review over time.'
			: 'Discover equipment, documents, and maintenance opportunities you can review over time.',
		detectedText: isHomeownerMode
			? 'We found matching equipment already in this home record. Review setup to save it into your setup progress and add any missing suggested tasks.'
			: 'We found matching equipment already in this property record. Review setup to save it into your setup progress and add any missing suggested tasks.',
	};
	const [updateProperty] = useUpdatePropertyMutation();
	const [createDevice] = useCreateDeviceMutation();
	const [updateDevice] = useUpdateDeviceMutation();
	const [createTask] = useCreateTaskMutation();
	const [updateTask] = useUpdateTaskMutation();
	const [createPropertySpace] = useCreatePropertySpaceMutation();
	const [setEquipmentSpaceLinks] = useSetEquipmentSpaceLinksMutation();
	const [setTaskSpaceLinks] = useSetTaskSpaceLinksMutation();
	const accountId = String(property.accountId || property.userId || currentUser?.id || '').trim();
	const { data: propertySpaces = [] } = useGetPropertySpacesQuery(
		{ accountId, propertyId: property.id, includeArchived: true },
		{ skip: !accountId || !property.id },
	);
	const { data: propertyKnowledgeLinks = [] } =
		useGetPropertyKnowledgeLinksQuery(
			{ accountId, propertyId: property.id },
			{ skip: !accountId || !property.id },
		);
	const initialSetupAssistant = property.setupAssistant || {};
	const [localSetupAssistant, setLocalSetupAssistant] =
		useState<PropertySetupAssistantState>(initialSetupAssistant);
	const setupAssistant = localSetupAssistant;
	const savedSetupProgress = useMemo(
		() => getPropertySetupProgress(setupAssistant),
		[setupAssistant],
	);
	const [isOpen, setIsOpen] = useState(false);
	const [setupPath, setSetupPath] =
		useState<ActivePropertySetupPath | null>(null);
	const [draftItems, setDraftItems] = useState<
		NonNullable<PropertySetupAssistantState['items']>
	>(setupAssistant.items || {});
	const [hasUserDraftChanges, setHasUserDraftChanges] = useState(false);
	const [wasDraftRestored, setWasDraftRestored] = useState(false);
	const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
	const [isSaveReviewOpen, setIsSaveReviewOpen] = useState(false);
	const [isAssistantCardCollapsed, setIsAssistantCardCollapsed] =
		useState(savedSetupProgress.isComplete);
	const [selectedAreaId, setSelectedAreaId] = useState<PropertySetupAreaId>(
		getFirstIncompleteSetupAreaId(setupAssistant),
	);
	const [expandedItemId, setExpandedItemId] =
		useState<SuggestedSystemId | null>(null);
	const [quickAddSpaceTarget, setQuickAddSpaceTarget] = useState<{
		itemId: SuggestedSystemId;
		instanceId: string;
	} | null>(null);
	const [quickAddSpaceName, setQuickAddSpaceName] = useState('');
	const [quickAddSpaceType, setQuickAddSpaceType] =
		useState<PropertySpaceType>('interior');
	const [isAddingQuickSpace, setIsAddingQuickSpace] = useState(false);
	const [quickAddedSpaces, setQuickAddedSpaces] = useState<PropertySpace[]>([]);
	const instanceSequenceRef = useRef(0);
	const areaPanelRef = useRef<HTMLDivElement | null>(null);
	const hasTrackedProposalViewRef = useRef(false);
	const hasTrackedSetupStartRef = useRef(false);
	const [isSavingAssistant, setIsSavingAssistant] = useState(false);
	const [isSaveComplete, setIsSaveComplete] = useState(false);
	const [completionSummary, setCompletionSummary] =
		useState<SetupCompletionSummary | null>(null);
	const activeSetupAreas =
		setupPath === 'essentials'
			? PROPERTY_SETUP_ESSENTIAL_AREAS
			: PROPERTY_SETUP_AREAS;
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
	const availablePropertySpaces = useMemo(
		() =>
			Array.from(
				new Map(
					[...propertySpaces, ...quickAddedSpaces].map((space) => [space.id, space]),
				).values(),
			),
		[propertySpaces, quickAddedSpaces],
	);
	const reviewedSetupSpaceTemplates = useMemo(() => {
		const templates = [
			...buildPropertyProfileSpaceTemplates(property),
			...PROPERTY_SETUP_AREAS.flatMap((area) => {
				const needsSuggestedAreaSpace = area.itemIds.some((itemId) => {
					const itemState = draftItems[itemId];
					if (itemState?.status !== 'present') return false;
					return (
						!Array.isArray(itemState.instances) ||
						itemState.instances.length === 0 ||
						itemState.instances.some((instance) => instance.spaceIds === undefined)
					);
				},
				);
				return needsSuggestedAreaSpace
					? getSetupAreaSpaceTemplates(area.id, property)
					: [];
			}),
		];
		return Array.from(
			new Map(templates.map((template) => [template.generationKey, template])).values(),
		);
	}, [draftItems, property]);
	const reviewedSetupSpacePlan = useMemo(
		() =>
			planGeneratedPropertySpaces(
				reviewedSetupSpaceTemplates,
				availablePropertySpaces,
			),
		[availablePropertySpaces, reviewedSetupSpaceTemplates],
	);
	const hasArchivedSpaceConflict = reviewedSetupSpacePlan.some(
		(entry) => entry.status === 'archived_conflict',
	);

	useEffect(() => {
		setLocalSetupAssistant(property.setupAssistant || {});
		if (!isOpen) {
			setDraftItems(property.setupAssistant?.items || {});
		}
	}, [property.id, property.setupAssistant, isOpen]);

	useEffect(() => {
		hasTrackedProposalViewRef.current = false;
		hasTrackedSetupStartRef.current = false;
		setWasDraftRestored(false);
		setQuickAddedSpaces([]);
	}, [property.id]);

	useEffect(() => {
		setIsAssistantCardCollapsed(savedSetupProgress.isComplete);
	}, [property.id, savedSetupProgress.isComplete]);

	useEffect(() => {
		if (!initiallyOpen || !canUseAssistant) {
			return;
		}

		setIsOpen(true);
		if (!hasTrackedSetupStartRef.current) {
			hasTrackedSetupStartRef.current = true;
			void trackAnalyticsEvent('property_setup_started', {
				entry_point: 'property_creation',
				reviewed_count: savedSetupProgress.reviewed,
				total_count: savedSetupProgress.total,
			});
		}
		onInitialOpenHandled?.();
	}, [
		canUseAssistant,
		initiallyOpen,
		onInitialOpenHandled,
		savedSetupProgress.reviewed,
		savedSetupProgress.total,
	]);

	useEffect(() => {
		if (!isOpen || !currentUser?.id || typeof window === 'undefined') return;
		const restoredDraft = readPropertySetupDraft(window.localStorage, {
			userId: currentUser.id,
			propertyId: property.id,
			serverUpdatedAt: setupAssistant.updatedAt,
		});
		if (!restoredDraft) return;

		setDraftItems(restoredDraft.items);
		setSelectedAreaId(restoredDraft.selectedAreaId);
		setHasUserDraftChanges(true);
		setWasDraftRestored(true);
	}, [currentUser?.id, isOpen, property.id, setupAssistant.updatedAt]);

	useEffect(() => {
		if (
			!isOpen ||
			!hasUserDraftChanges ||
			!currentUser?.id ||
			typeof window === 'undefined'
		) {
			return;
		}

		writePropertySetupDraft(window.localStorage, {
			userId: currentUser.id,
			propertyId: property.id,
			baseUpdatedAt: setupAssistant.updatedAt,
			selectedAreaId,
			items: draftItems,
		});
	}, [
		currentUser?.id,
		draftItems,
		hasUserDraftChanges,
		isOpen,
		property.id,
		selectedAreaId,
		setupAssistant.updatedAt,
	]);

	useEffect(() => {
		if (!isOpen || hasTrackedProposalViewRef.current) return;
		const proposalCount = getDraftProposalCount(draftItems);
		if (proposalCount <= 0) return;

		hasTrackedProposalViewRef.current = true;
		void trackAnalyticsEvent('property_setup_proposal_viewed', {
			proposal_count: proposalCount,
			restored_draft: wasDraftRestored,
		});
	}, [draftItems, isOpen, wasDraftRestored]);

	useEffect(() => {
		areaPanelRef.current?.scrollTo({
			top: 0,
			left: 0,
			behavior: 'auto',
		});
		if (isOpen && setupPath) {
			const stageIndex = activeSetupAreas.findIndex(
				(area) => area.id === selectedAreaId,
			);
			void trackAnalyticsEvent('property_setup_stage_viewed', {
				setup_stage: selectedAreaId,
				stage_index: stageIndex >= 0 ? stageIndex + 1 : 0,
				stage_count: activeSetupAreas.length,
				setup_path: setupPath,
			});
		}
	}, [activeSetupAreas, isOpen, selectedAreaId, setupPath]);

	if (!canUseAssistant || !currentUser) {
		return null;
	}

	const openAssistant = () => {
		const nextDraftItems = { ...(setupAssistant.items || {}) };
		setDraftItems(nextDraftItems);
		setSetupPath(null);
		setHasUserDraftChanges(false);
		setWasDraftRestored(false);
		hasTrackedProposalViewRef.current = false;
		setIsCloseConfirmOpen(false);
		setIsSaveReviewOpen(false);
		setIsSaveComplete(false);
		setCompletionSummary(null);
		setExpandedItemId(null);
		setQuickAddSpaceTarget(null);
		setQuickAddSpaceName('');
		setSelectedAreaId(getFirstIncompleteSetupAreaId({ items: nextDraftItems }));
		setIsOpen(true);
		hasTrackedSetupStartRef.current = true;
		void trackAnalyticsEvent('property_setup_started', {
			entry_point: savedSetupProgress.reviewed > 0 ? 'resume' : 'property_detail',
			reviewed_count: savedSetupProgress.reviewed,
			total_count: savedSetupProgress.total,
		});
	};

	const handleSelectSetupPath = (path: PropertySetupPath) => {
		void trackAnalyticsEvent('property_setup_path_selected', {
			setup_path: path,
			reviewed_count: savedSetupProgress.reviewed,
			total_count: savedSetupProgress.total,
		});

		if (path === 'existing_report') {
			setIsOpen(false);
			onUploadDocuments?.();
			return;
		}

		const nextAreas =
			path === 'essentials'
				? PROPERTY_SETUP_ESSENTIAL_AREAS
				: PROPERTY_SETUP_AREAS;
		setSetupPath(path);
		setSelectedAreaId(
			getFirstIncompleteSetupAreaId({ items: draftItems }, nextAreas),
		);
	};

	const selectedAreaIndex = Math.max(
		activeSetupAreas.findIndex((area) => area.id === selectedAreaId),
		0,
	);
	const selectedArea =
		activeSetupAreas[selectedAreaIndex] || activeSetupAreas[0];
	const isFirstArea = selectedAreaIndex === 0;
	const isLastArea = selectedAreaIndex === activeSetupAreas.length - 1;
	const draftProgress = getPropertySetupProgress(
		{ items: draftItems },
		activeSetupAreas,
	);

	const getAreaReviewedCount = (areaId: PropertySetupAreaId) => {
		const area = activeSetupAreas.find((item) => item.id === areaId);
		if (!area) return 0;
		return area.itemIds.filter((itemId) => {
			const status = draftItems[itemId]?.status;
			return status === 'present' || status === 'not_present';
		}).length;
	};

	const getAreaValueSummary = (areaId: PropertySetupAreaId) => {
		const area = activeSetupAreas.find((item) => item.id === areaId);
		if (!area) return null;
		const presentItemIds = area.itemIds.filter(
			(itemId) => draftItems[itemId]?.status === 'present',
		);
		const taskCount = presentItemIds.reduce(
			(count, itemId) =>
				count +
				getSelectedSuggestedTaskIds(itemId, draftItems[itemId]).length,
			0,
		);
		const equipmentCount = presentItemIds.reduce((count, itemId) => {
			const itemState = draftItems[itemId];
			return (
				count +
				(Array.isArray(itemState?.instances) && itemState.instances.length > 0
					? itemState.instances.length
					: 1)
			);
		}, 0);
		return {
			isReviewed: getAreaReviewedCount(areaId) === area.itemIds.length,
			equipmentCount,
			taskCount,
		};
	};

	const findExistingDevices = (itemId: SuggestedSystemId) => {
		const item = getPropertySetupItem(itemId);
		if (!item) return [];
		const expectedNames = new Set([
			normalize(item.system.label),
			normalize(item.system.deviceType),
		]);
		const expectedCompacts = new Set([
			compact(item.system.label),
			compact(item.system.deviceType),
		]);
		const expectedAssetType = normalizeAssetType(item.system.deviceType);
		const allowedVariants = getPropertySetupSubtypeOptions(itemId);

		return propertyDevices.filter((device: any) => {
			const name = normalize(String(device.name || ''));
			const type = normalize(String(device.type || ''));
			const assetType = normalize(String(device.assetType || ''));
			const compactName = compact(String(device.name || ''));
			const compactType = compact(String(device.type || ''));
			const compactAssetType = compact(String(device.assetType || ''));
			const canonicalTypeMatches =
				normalizeAssetType(device.assetType || device.type) === expectedAssetType;
			const deviceVariant = getDeviceAssetVariant(device);
			const variantMatches =
				!isDistributedPropertySetupItem(itemId) ||
				!deviceVariant ||
				allowedVariants.includes(deviceVariant);
			return (
				expectedNames.has(name) ||
				expectedNames.has(type) ||
				expectedNames.has(assetType) ||
				expectedCompacts.has(compactName) ||
				expectedCompacts.has(compactType) ||
				expectedCompacts.has(compactAssetType) ||
				(canonicalTypeMatches && variantMatches)
			);
		});
	};

	const findExistingDevice = (itemId: SuggestedSystemId) =>
		findExistingDevices(itemId)[0] || null;

	const createSetupInstanceId = (itemId: SuggestedSystemId) => {
		instanceSequenceRef.current += 1;
		return `${itemId}:${Date.now()}:${instanceSequenceRef.current}`;
	};

	const getInitialInstances = (
		itemId: SuggestedSystemId,
		state?: PropertySetupAssistantItemState,
	): PropertySetupAssistantEquipmentInstance[] => {
		if (Array.isArray(state?.instances) && state.instances.length > 0) {
			return state.instances;
		}

		const legacyDevice = state?.deviceId
			? propertyDevices.find((device) => device.id === state.deviceId)
			: null;
		const matchingDevices = legacyDevice
			? [legacyDevice]
			: findExistingDevices(itemId);
		if (matchingDevices.length > 0) {
			return matchingDevices.map((device, index) => ({
				id: `existing:${device.id}`,
				deviceId: String(device.id),
				name:
					String(device.name || '').trim() ||
					getPropertySetupInstanceName(itemId, index),
				assetVariant: getDeviceAssetVariant(device),
				spaceIds: getEquipmentSpaceIds(
					propertyKnowledgeLinks,
					String(device.id),
				),
			}));
		}

		return [
			{
				id: `draft:${itemId}:1`,
				name: getPropertySetupInstanceName(itemId, 0),
				...(isDistributedPropertySetupItem(itemId)
					? { assetVariant: getPropertySetupSubtypeOptions(itemId)[0] }
					: {}),
			},
		];
	};

	const progress = savedSetupProgress;
	const detectedUnreviewedItemCount = getUnreviewedDetectedSetupItemIds(
		setupAssistant.items || {},
		PROPERTY_SETUP_ITEM_ORDER.filter((itemId) =>
			Boolean(findExistingDevice(itemId)?.id),
		),
	).length;
	const hasDetectedUnsavedProgress = detectedUnreviewedItemCount > 0;

	const ensureDeviceForInstance = async (
		itemId: SuggestedSystemId,
		instance: PropertySetupAssistantEquipmentInstance,
	) => {
		const requestedVariant =
			instance.assetVariant ||
			(isDistributedPropertySetupItem(itemId)
				? getPropertySetupSubtypeOptions(itemId)[0]
				: '');
		const existingDevice = propertyDevices.find(
			(device) => device.id === instance.deviceId,
		);
		if (existingDevice) {
			const nextName = instance.name.trim() || existingDevice.name;
			const nextVariant = normalizeAssetVariant(
				existingDevice.assetType || existingDevice.type,
				requestedVariant,
			);
			if (
				nextName !== existingDevice.name ||
				nextVariant !== getDeviceAssetVariant(existingDevice)
			) {
				return updateDevice({
					id: String(existingDevice.id),
					analyticsSource: 'setup_assistant',
					updates: {
						name: nextName,
						assetVariant: nextVariant,
					},
				}).unwrap();
			}
			return existingDevice;
		}

		const item = getPropertySetupItem(itemId);
		if (!item) {
			return null;
		}

		try {
			const assetType = normalizeAssetType(item.system.deviceType);
			return await createDevice(
				stripUndefinedValues({
					analyticsSource: 'setup_assistant',
					userId: currentUser.id,
					type: assetType,
					assetType,
					assetVariant: normalizeAssetVariant(
						assetType,
						requestedVariant,
					),
					name: instance.name.trim() || item.system.label,
					brand: '',
					model: '',
					serialNumber: '',
					installationDate: '',
					status: 'Active',
					location: {
						propertyId: property.id,
					},
					notes: 'Created from Property Setup Assistant.',
				}) as any,
			).unwrap();
		} catch (error) {
			console.warn('Property setup assistant could not create equipment record:', {
				itemId,
				error,
			});
			feedback.notify(
				'Marked present, but the equipment record could not be created.',
			);
			return null;
		}
	};

	const ensureSuggestedTasksForItem = async (
		itemId: SuggestedSystemId,
		deviceIds: string[] = [],
		selectedTaskIds = getSuggestedTaskIdsForSystems([itemId]),
	): Promise<SuggestedTaskCreateResult> => {
		const suggestedTasks = getSuggestedTasksForSystems([itemId], selectedTaskIds);
		const existingTaskIds: string[] = [];
		const proposals: PropertySetupTaskProposal[] = [];
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
					deviceIds.length === 0 ||
					!Array.isArray(task.devices) ||
					task.devices.length === 0 ||
					deviceIds.some((deviceId) => task.devices?.includes(deviceId));
				return sameProperty && sameTitle && linkedToDevice;
			});

			if (existingTask?.id) {
				existingTaskIds.push(existingTask.id);
				continue;
			}

			proposals.push(
				stripUndefinedValues({
					proposalId: `${itemId}:${suggestedTask.id}`,
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
					priority: suggestedTask.priority || 'Medium',
					notes: [
						`${suggestedTask.title} was added from the Property Setup Assistant.`,
						suggestedTask.notes,
						SUGGESTED_MAINTENANCE_DISCLAIMER,
					]
						.filter(Boolean)
						.join(' '),
					...(deviceIds.length > 0 ? { deviceIds } : {}),
					recurrenceFrequency: suggestedTask.recurrenceFrequency,
					recurrenceInterval: suggestedTask.recurrenceInterval,
					recurrenceCustomUnit: suggestedTask.recurrenceCustomUnit,
				}) as PropertySetupTaskProposal,
			);
		}

		if (proposals.length === 0) {
			return { taskIds: existingTaskIds, createdTaskIds: [] };
		}

		if (!TRUSTED_SETUP_PLAN_ACTIVATION_ENABLED) {
			const createdTaskIds: string[] = [];
			for (const proposal of proposals) {
				try {
					const createdTask = await createTask(
						stripUndefinedValues({
							analyticsSource: 'setup_assistant',
							userId: currentUser.id,
							propertyId: property.id,
							property: property.title,
							propertyTitle: property.title,
							title: proposal.title,
							dueDate: proposal.dueDate,
							status: 'Initiated',
							priority: proposal.priority || 'Medium',
							category: 'Suggested Maintenance',
							notes: proposal.notes,
							...(hasPaidSuggestedMaintenancePackages
								? {
									isRecurring: true,
									recurrenceFrequency: proposal.recurrenceFrequency,
									recurrenceInterval: proposal.recurrenceInterval,
									recurrenceCustomUnit: proposal.recurrenceCustomUnit,
								  }
								: { isRecurring: false }),
							enableNotifications: true,
							notifications: getDefaultTaskNotifications(),
							...(proposal.deviceIds?.length
								? { devices: proposal.deviceIds }
								: {}),
						}) as any,
					).unwrap();
					if (createdTask?.id) {
						createdTaskIds.push(createdTask.id);
					}
				} catch (error) {
					console.warn('Property setup assistant could not create task:', {
						itemId,
						proposal,
						error,
					});
				}
			}

			return {
				taskIds: [...existingTaskIds, ...createdTaskIds],
				createdTaskIds,
			};
		}

		try {
			const result = await activatePropertySetupMaintenancePlan({
				propertyId: property.id,
				requestId: `setup-plan:${property.id}:${itemId}:${selectedTaskIds
					.slice()
					.sort()
					.join(',')}`,
				proposals,
			});
			dispatch(apiSlice.util.invalidateTags(['Tasks']));
			void trackAnalyticsEvent('property_setup_plan_activated', {
				proposal_count: proposals.length,
				created_task_count: result.createdTaskIds.length,
				replayed_task_count: result.replayedTaskIds.length,
				recurring_access_applied: result.recurringAccessApplied,
			});
			return {
				taskIds: Array.from(new Set([...existingTaskIds, ...result.taskIds])),
				createdTaskIds: result.createdTaskIds,
			};
		} catch (error) {
			console.warn('Property setup assistant could not activate tasks:', {
				itemId,
				error,
			});
			throw error;
		}
	};

	const findExistingSuggestedTask = (
		suggestedTask: SuggestedTaskTemplate,
		deviceIds: string[] = [],
	) =>
		tasks.find((task) => {
			const sameProperty = String(task.propertyId || '') === String(property.id);
			const sameTitle =
				normalize(task.title || '') === normalize(suggestedTask.title);
			const linkedToDevice =
				deviceIds.length === 0 ||
				!Array.isArray(task.devices) ||
				task.devices.length === 0 ||
				deviceIds.some((deviceId) => task.devices?.includes(deviceId));
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

	const updateSetupInstance = (
		itemId: SuggestedSystemId,
		instanceId: string,
		updates: Partial<PropertySetupAssistantEquipmentInstance>,
	) => {
		if (isSavingAssistant) return;
		setHasUserDraftChanges(true);
		setDraftItems((previous) => {
			const currentState = previous[itemId] || { status: 'present' as const };
			const instances = getInitialInstances(itemId, currentState).map(
				(instance) =>
					instance.id === instanceId ? { ...instance, ...updates } : instance,
			);
			return {
				...previous,
				[itemId]: { ...currentState, status: 'present', instances },
			};
		});
	};

	const handleAddSetupInstance = (itemId: SuggestedSystemId) => {
		if (isSavingAssistant) return;
		setHasUserDraftChanges(true);
		setExpandedItemId(itemId);
		setDraftItems((previous) => {
			const currentState = previous[itemId] || { status: 'present' as const };
			const instances = getInitialInstances(itemId, currentState);
			return {
				...previous,
				[itemId]: {
					...currentState,
					status: 'present',
					instances: [
						...instances,
						{
							id: createSetupInstanceId(itemId),
							name: getPropertySetupInstanceName(itemId, instances.length),
							...(isDistributedPropertySetupItem(itemId)
								? { assetVariant: getPropertySetupSubtypeOptions(itemId)[0] }
								: {}),
						},
					],
				},
			};
		});
	};

	const handleRemoveSetupInstance = (
		itemId: SuggestedSystemId,
		instanceId: string,
	) => {
		if (isSavingAssistant) return;
		setHasUserDraftChanges(true);
		setDraftItems((previous) => {
			const currentState = previous[itemId] || { status: 'present' as const };
			const instances = getInitialInstances(itemId, currentState).filter(
				(instance) => instance.id !== instanceId,
			);
			return {
				...previous,
				[itemId]: {
					...currentState,
					status: instances.length > 0 ? 'present' : 'unknown',
					instances,
				},
			};
		});
	};

	const handleToggleInstanceSpace = (
		itemId: SuggestedSystemId,
		instance: PropertySetupAssistantEquipmentInstance,
		spaceId: string,
	) => {
		const currentSpaceIds = instance.spaceIds || [];
		updateSetupInstance(itemId, instance.id, {
			spaceIds: currentSpaceIds.includes(spaceId)
				? currentSpaceIds.filter((id) => id !== spaceId)
				: [...currentSpaceIds, spaceId],
		});
	};

	const openQuickAddSpace = (
		itemId: SuggestedSystemId,
		instanceId: string,
	) => {
		setQuickAddSpaceTarget({ itemId, instanceId });
		setQuickAddSpaceName('');
		const itemArea = PROPERTY_SETUP_AREAS.find((area) =>
			area.itemIds.includes(itemId),
		);
		const suggestedType = itemArea
			? getSetupAreaSpaceTemplates(itemArea.id, property)[0]?.type
			: undefined;
		setQuickAddSpaceType(suggestedType || 'interior');
	};

	const handleQuickAddSpace = async () => {
		if (!quickAddSpaceTarget || isAddingQuickSpace) return;
		const name = quickAddSpaceName.trim();
		if (!name) {
			feedback.notify('Enter a name for this Space.');
			return;
		}
		const matchingSpace = availablePropertySpaces.find(
			(space) => normalize(space.name) === normalize(name),
		);
		if (matchingSpace?.isArchived) {
			feedback.notify(
				'A Space with this name is archived. Restore it in Property Details before connecting it.',
			);
			return;
		}

		setIsAddingQuickSpace(true);
		try {
			const space =
				matchingSpace ||
				(await createPropertySpace({
					accountId,
					propertyId: property.id,
					name,
					type: quickAddSpaceType,
					notes: '',
					source: 'manual',
				}).unwrap());
			if (!matchingSpace) {
				setQuickAddedSpaces((current) => [...current, space]);
			}
			const itemState = draftItems[quickAddSpaceTarget.itemId];
			const instance = getInitialInstances(
				quickAddSpaceTarget.itemId,
				itemState,
			).find(({ id }) => id === quickAddSpaceTarget.instanceId);
			if (instance && !instance.spaceIds?.includes(space.id)) {
				updateSetupInstance(
					quickAddSpaceTarget.itemId,
					quickAddSpaceTarget.instanceId,
					{ spaceIds: [...(instance.spaceIds || []), space.id] },
				);
			}
			setQuickAddSpaceTarget(null);
			setQuickAddSpaceName('');
			feedback.notify(
				matchingSpace ? `${space.name} connected.` : `${space.name} added and connected.`,
			);
		} catch (error) {
			console.warn('Property setup assistant could not add Space:', error);
			feedback.notify('Could not add this Space. Please try again.');
		} finally {
			setIsAddingQuickSpace(false);
		}
	};

	const handleSetStatus = (
		itemId: SuggestedSystemId,
		status: PropertySetupAssistantItemStatus,
	) => {
		if (isSavingAssistant) return;
		setHasUserDraftChanges(true);
		if (status === 'present') {
			setExpandedItemId(itemId);
		}
		setDraftItems((prev) => ({
			...prev,
			[itemId]: {
				...(prev[itemId] || {}),
				status,
				...(status === 'present'
					? { instances: getInitialInstances(itemId, prev[itemId]) }
					: {}),
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
		const remainingProposalCount = Math.max(
			getDraftProposalCount(draftItems) - 1,
			0,
		);
		void trackAnalyticsEvent('property_setup_proposal_dismissed', {
			remaining_proposal_count: remainingProposalCount,
		});
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
		setSelectedAreaId(activeSetupAreas[selectedAreaIndex - 1].id);
	};

	const handleNext = () => {
		if (isSavingAssistant) return;
		if (isLastArea) {
			setIsSaveReviewOpen(true);
			return;
		}
		setSelectedAreaId(activeSetupAreas[selectedAreaIndex + 1].id);
	};

	const closeAssistant = () => {
		if (setupPath) {
			void trackAnalyticsEvent('property_setup_path_exited', {
				setup_path: setupPath,
				reviewed_count: draftProgress.reviewed,
				total_count: draftProgress.total,
				has_unsaved_changes: hasUserDraftChanges,
				exit_reason: 'user_closed',
			});
		}
		if (currentUser?.id && typeof window !== 'undefined') {
			clearPropertySetupDraft(window.localStorage, {
				userId: currentUser.id,
				propertyId: property.id,
			});
		}
		setIsCloseConfirmOpen(false);
		setIsSaveReviewOpen(false);
		setIsSaveComplete(false);
		setCompletionSummary(null);
		setIsOpen(false);
		setSetupPath(null);
		setHasUserDraftChanges(false);
		setWasDraftRestored(false);
		hasTrackedProposalViewRef.current = false;
		setDraftItems(setupAssistant.items || {});
		onAssistantClosed?.();
	};

	const handleSaveCompleteOk = () => {
		setIsSaveComplete(false);
		setCompletionSummary(null);
		setIsOpen(false);
		setSetupPath(null);
		onAssistantCompleted?.();
	};

	const handleAddMoreAppliances = () => {
		setIsSaveComplete(false);
		setCompletionSummary(null);
		setIsOpen(false);
		setSetupPath(null);
		onAddMoreAppliances?.();
	};

	const handleUploadDocuments = () => {
		setIsSaveComplete(false);
		setCompletionSummary(null);
		setIsOpen(false);
		setSetupPath(null);
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
		const savedEquipmentIdSet = new Set<string>();
		const linkedTaskIdSet = new Set<string>();
		let createdApplianceCount = 0;
		let createdTaskCount = 0;

		try {
			if (!accountId) {
				throw new Error('This property is missing its account connection.');
			}
			if (hasArchivedSpaceConflict) {
				throw new Error(
					'One or more matching Spaces are archived. Restore or rename those Spaces before saving setup.',
				);
			}
			const ensuredSpaces = await ensureGeneratedPropertySpaces({
				accountId,
				propertyId: property.id,
				templates: reviewedSetupSpaceTemplates,
				existingSpaces: availablePropertySpaces,
				source: 'setup_assistant',
				createSpace: (input) => createPropertySpace(input).unwrap(),
			});
			if (ensuredSpaces.archivedConflicts.length > 0) {
				throw new Error(
					'A matching Space was archived while setup was open. Review the Property Spaces before trying again.',
				);
			}
			const spaceIdsByArea = new Map<PropertySetupAreaId, string[]>();
			PROPERTY_SETUP_AREAS.forEach((area) => {
				const ids = getSetupAreaSpaceTemplates(area.id, property)
					.map((template) =>
						ensuredSpaces.spacesByGenerationKey.get(template.generationKey)?.id,
					)
					.filter((id): id is string => Boolean(id));
				spaceIdsByArea.set(area.id, ids);
			});

			for (const [itemId, itemState] of Object.entries(draftItems) as Array<
				[SuggestedSystemId, PropertySetupAssistantItemState]
			>) {
				if (!itemState?.status) continue;

				if (itemState.status === 'present') {
					const item = getPropertySetupItem(itemId);
					const itemArea = PROPERTY_SETUP_AREAS.find((area) =>
						area.itemIds.includes(itemId),
					);
					const fallbackSpaceIds = itemArea
						? spaceIdsByArea.get(itemArea.id) || []
						: [];
					const instances = getInitialInstances(itemId, itemState);
					const savedInstances: PropertySetupAssistantEquipmentInstance[] = [];
					const deviceIds: string[] = [];
					const taskSpaceIds = new Set<string>();

					for (const instance of instances) {
						const hadExistingDevice = Boolean(
							instance.deviceId &&
								propertyDevices.some((device) => device.id === instance.deviceId),
						);
						const device = await ensureDeviceForInstance(itemId, instance);
						if (!device?.id) continue;
						const deviceId = String(device.id);
						deviceIds.push(deviceId);
						savedEquipmentIdSet.add(deviceId);
						if (!hadExistingDevice) createdApplianceCount += 1;
						applianceLabelSet.add(instance.name || item?.system.label || itemId);

						const desiredSpaceIds = Array.from(
							new Set(
								instance.spaceIds === undefined
									? fallbackSpaceIds
									: instance.spaceIds,
							),
						);
						desiredSpaceIds.forEach((spaceId) => taskSpaceIds.add(spaceId));
						await setEquipmentSpaceLinks({
							propertyId: property.id,
							equipmentId: deviceId,
							spaceIds: desiredSpaceIds,
						}).unwrap();
						savedInstances.push({
							...instance,
							deviceId,
							name: instance.name.trim() || item?.system.label || 'Equipment',
							assetVariant: getDeviceAssetVariant(device),
							spaceIds: desiredSpaceIds,
						});
					}

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
							deviceIds,
							selectedSuggestedTaskIds,
						);
						taskIds = taskResult.taskIds;
						createdTaskCount += taskResult.createdTaskIds.length;
					} else if (recreateSuggestedTaskIds.length > 0) {
						const recreatedTaskResult = await ensureSuggestedTasksForItem(
							itemId,
							deviceIds,
							recreateSuggestedTaskIds,
						);
						taskIds = Array.from(
							new Set([...liveCreatedTaskIds, ...recreatedTaskResult.taskIds]),
						);
						createdTaskCount += recreatedTaskResult.createdTaskIds.length;
					}
					taskIds.forEach((taskId) => linkedTaskIdSet.add(taskId));
					await Promise.all(
						taskIds.map(async (taskId) => {
							const existingTask = tasks.find((task) => task.id === taskId);
							if (!existingTask || deviceIds.length === 0) return;
							const nextDeviceIds = Array.from(
								new Set([...(existingTask.devices || []), ...deviceIds]),
							);
							if (nextDeviceIds.length === (existingTask.devices || []).length) {
								return;
							}
							await updateTask({
								id: taskId,
								updates: { devices: nextDeviceIds },
							}).unwrap();
						}),
					);
					await Promise.all(
						taskIds.map((taskId) =>
							setTaskSpaceLinks({
								propertyId: property.id,
								taskId,
								spaceIds: Array.from(
									new Set([
										...getTaskSpaceIds(propertyKnowledgeLinks, taskId),
										...taskSpaceIds,
									]),
								),
							}).unwrap(),
						),
					);

					const nextItemState: PropertySetupAssistantItemState = {
						...itemState,
						status: 'present',
						instances: savedInstances,
						deviceId: savedInstances[0]?.deviceId,
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
			if (currentUser?.id && typeof window !== 'undefined') {
				clearPropertySetupDraft(window.localStorage, {
					userId: currentUser.id,
					propertyId: property.id,
				});
			}
			void trackAnalyticsEvent('property_setup_plan_confirmed', {
				created_equipment_count: createdApplianceCount,
				created_task_count: createdTaskCount,
				linked_task_count: linkedTaskIdSet.size,
				trusted_activation_enabled: TRUSTED_SETUP_PLAN_ACTIVATION_ENABLED,
			});
			if (setupPath) {
				const nextPathProgress = getPropertySetupProgress(
					{ items: nextItems },
					activeSetupAreas,
				);
				void trackAnalyticsEvent('property_setup_path_completed', {
					setup_path: setupPath,
					reviewed_count: nextPathProgress.reviewed,
					total_count: nextPathProgress.total,
					created_equipment_count: createdApplianceCount,
					created_task_count: createdTaskCount,
					linked_task_count: linkedTaskIdSet.size,
				});
			}
			if (nextProgress.isComplete && !savedSetupProgress.isComplete) {
				void trackAnalyticsEvent('property_setup_completed', {
					created_equipment_count: createdApplianceCount,
					created_task_count: createdTaskCount,
					linked_task_count: linkedTaskIdSet.size,
					restored_draft: wasDraftRestored,
				});
			}
			await waitForMinimumDuration(saveStartedAt);
			setLocalSetupAssistant(nextSetupAssistant);
			setDraftItems(nextItems);
			setHasUserDraftChanges(false);
			setWasDraftRestored(false);
			setIsCloseConfirmOpen(false);
			setIsSaveReviewOpen(false);
			setCompletionSummary({
				applianceLabels: Array.from(applianceLabelSet),
				applianceCount: savedEquipmentIdSet.size,
				createdApplianceCount,
				taskCount: linkedTaskIdSet.size,
				createdTaskCount,
				spaceCount: ensuredSpaces.created.length + ensuredSpaces.reused.length,
				createdSpaceCount: ensuredSpaces.created.length,
			});
			setIsSaveComplete(true);
		} catch (error) {
			await waitForMinimumDuration(saveStartedAt);
			console.error('Failed to save property setup assistant:', error);
			void trackAnalyticsEvent('workflow_error_shown', {
				workflow_name: 'property_setup',
				workflow_stage: 'save_progress',
				error_code: getAnalyticsErrorCode(error),
			});
			feedback.notify(
				withWorkflowSupportCode(
					'Could not save setup progress. Please try again.',
					WORKFLOW_SUPPORT_CODES.propertySetupSave,
				),
			);
		} finally {
			setIsSavingAssistant(false);
		}
	};

	const selectedAreaValueSummary = getAreaValueSummary(selectedArea.id);
	const setupEquipmentReview = (
		Object.entries(draftItems) as Array<
			[SuggestedSystemId, PropertySetupAssistantItemState]
		>
	).flatMap(([itemId, itemState]) => {
		if (itemState?.status !== 'present') return [];
		const itemArea = PROPERTY_SETUP_AREAS.find((area) =>
			area.itemIds.includes(itemId),
		);
		const suggestedSpaceNames = itemArea
			? getSetupAreaSpaceTemplates(itemArea.id, property).map(
					(template) => template.name,
				)
			: [];
		return getInitialInstances(itemId, itemState).map((instance) => {
			const selectedNames = (instance.spaceIds || [])
				.map(
					(spaceId) =>
						availablePropertySpaces.find((space) => space.id === spaceId)?.name,
				)
				.filter((name): name is string => Boolean(name));
			return {
				key: `${itemId}:${instance.id}`,
				name: instance.name,
				assetVariant: instance.assetVariant,
				spaceNames:
					instance.spaceIds === undefined
						? suggestedSpaceNames
						: selectedNames,
				isExisting: Boolean(instance.deviceId),
			};
		});
	});

	return (
		<>
			<AssistantCard
				$complete={progress.isComplete}
				$compact={isAssistantCardCollapsed}>
				<AssistantContent>
					<AssistantHeader>
						<AssistantEyebrow>{setupLanguage.eyebrow}</AssistantEyebrow>
						<AssistantCollapseButton
							type='button'
							onClick={() =>
								setIsAssistantCardCollapsed((isCollapsed) => !isCollapsed)
							}
							aria-label={
								isAssistantCardCollapsed
									? `Expand ${setupLanguage.eyebrow}`
									: `Collapse ${setupLanguage.eyebrow}`
							}
							aria-expanded={!isAssistantCardCollapsed}
							title={
								isAssistantCardCollapsed
									? `Expand ${setupLanguage.eyebrow}`
									: `Collapse ${setupLanguage.eyebrow}`
							}>
							<FontAwesomeIcon
								icon={isAssistantCardCollapsed ? faChevronDown : faChevronUp}
								aria-hidden='true'
							/>
						</AssistantCollapseButton>
					</AssistantHeader>
					{!isAssistantCardCollapsed && (
						<AssistantBody>
							{progress.isComplete ? (
								<CompleteSummary>
									<CompleteSummaryLabel>{setupLanguage.completeLabel}</CompleteSummaryLabel>
									<AssistantTitle>
										Your {setupLanguage.recordNoun} has a strong starting point.
									</AssistantTitle>
									<AssistantText>
										Maintley can now review this {setupLanguage.recordNoun} and highlight the few things worth your attention.
									</AssistantText>
									<ProgressText>
										Progress: {progress.reviewed} of {progress.total}{' '}
										reviewed
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
								</CompleteSummary>
							) : (
								<>
									<AssistantTitle>
										{setupLanguage.mainTitle}
									</AssistantTitle>
									<AssistantText>
										{setupLanguage.intro}
									</AssistantText>
									{hasDetectedUnsavedProgress && (
										<AssistantText>
											{setupLanguage.detectedText}
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
						</AssistantBody>
					)}
				</AssistantContent>
				{!isAssistantCardCollapsed && (
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
								<ModalTitle>{setupLanguage.eyebrow}</ModalTitle>
								<ModalHint>
									{setupPath
										? 'Review one area at a time. Items marked Skip for now stay open so you can return later.'
										: 'Choose the quickest useful starting point for this property.'}
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
							{!setupPath ? (
								<SetupPathPanel>
									<SetupPathIntro>
										<AreaTitle>How would you like to begin?</AreaTitle>
										<AreaHint>
											You can stop at any time. Saved records remain available,
											and you can return to the other options later.
										</AreaHint>
										{hasDetectedUnsavedProgress && (
											<DetectedRecordNotice role='status'>
												We found {detectedUnreviewedItemCount} matching equipment{' '}
												{detectedUnreviewedItemCount === 1 ? 'record' : 'records'}.
												They will not count as reviewed until you confirm them.
											</DetectedRecordNotice>
										)}
									</SetupPathIntro>
									<SetupPathGrid>
										<SetupPathButton
											type='button'
											onClick={() => handleSelectSetupPath('essentials')}>
											<strong>10-minute essentials</strong>
											<span>
												Review nine common safety, utility, laundry, and exterior
												items for a useful starting record.
											</span>
											<SetupPathAction>Start essentials</SetupPathAction>
										</SetupPathButton>
										<SetupPathButton
											type='button'
											onClick={() => handleSelectSetupPath('room_by_room')}>
											<strong>Continue room by room</strong>
											<span>
												Review all seven areas at your own pace and resume whenever
												you are ready.
											</span>
											<SetupPathAction>Review all areas</SetupPathAction>
										</SetupPathButton>
										<SetupPathButton
											type='button'
											onClick={() => handleSelectSetupPath('existing_report')}>
											<strong>Upload an existing report</strong>
											<span>
												Upload an inspection or service report for Maintley to turn
												into details you can review.
											</span>
											<SetupPathAction>Choose a report</SetupPathAction>
										</SetupPathButton>
									</SetupPathGrid>
								</SetupPathPanel>
							) : (
							<AreaPanel>
								<AreaScrollContent
									ref={areaPanelRef}
									data-testid='setup-scroll-content'>
								{wasDraftRestored && (
									<RestoredDraftNotice role='status'>
										Your unfinished setup changes were restored on this device.
									</RestoredDraftNotice>
								)}
								<WizardProgressHeader>
									<WizardProgressText>
										Step {selectedAreaIndex + 1} of {activeSetupAreas.length}
									</WizardProgressText>
									<WizardProgressTrack>
										<WizardProgressFill
											style={{
												width: `${Math.round(
													((selectedAreaIndex + 1) /
														activeSetupAreas.length) *
													100,
												)}%`,
											}}
										/>
									</WizardProgressTrack>
									<WizardStepDots aria-label='Property setup areas'>
										{activeSetupAreas.map((area, index) => {
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
								{selectedAreaValueSummary?.isReviewed && (
									<AreaValueSummary role='status'>
										<strong>{selectedArea.title} is ready to save.</strong>
										{selectedAreaValueSummary.equipmentCount > 0 ? (
											<span>
												This area prepares {selectedAreaValueSummary.equipmentCount}{' '}
												equipment{' '}
												{selectedAreaValueSummary.equipmentCount === 1
													? 'record'
													: 'records'}{' '}
												and {selectedAreaValueSummary.taskCount} recurring task{' '}
												{selectedAreaValueSummary.taskCount === 1 ? 'suggestion' : 'suggestions'}.
												Applicable Spaces will be connected when you save, giving Maintley
												more context for future guidance.
											</span>
										) : (
											<span>
												Your answers are recorded. Items marked Not Present will not create
												equipment or tasks.
											</span>
										)}
									</AreaValueSummary>
								)}

								<ItemList>
									{selectedArea.itemIds.map((itemId) => {
										const item = getPropertySetupItem(itemId);
										if (!item) return null;
										const state = draftItems[itemId];
										const status = state?.status || 'unknown';
										const existingDevice = findExistingDevice(itemId);
										const savedState = setupAssistant.items?.[itemId];
										const instances =
											status === 'present'
												? getInitialInstances(itemId, state)
												: [];
										const linkedDeviceIds = instances
											.map((instance) => instance.deviceId)
											.filter((id): id is string => Boolean(id));
										const subtypeOptions = getPropertySetupSubtypeOptions(itemId);
										const isExpanded = expandedItemId === itemId;
										const selectedSpaceNames = Array.from(
											new Set(
												instances.flatMap((instance) =>
													(instance.spaceIds || [])
														.map(
															(spaceId) =>
																availablePropertySpaces.find((space) => space.id === spaceId)
																	?.name,
														)
														.filter((name): name is string => Boolean(name)),
												),
											),
										);
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
													<ItemExpandButton
														type='button'
														onClick={() =>
															setExpandedItemId(isExpanded ? null : itemId)
														}
														aria-expanded={isExpanded}
														aria-controls={`setup-item-details-${itemId}`}>
														<ItemInfo>
															<ItemTitle>{item.label}</ItemTitle>
															<ItemMeta>
																{status === 'present'
																	? `${instances.length} equipment ${instances.length === 1 ? 'record' : 'records'}${selectedSpaceNames.length > 0 ? ` - ${selectedSpaceNames.join(', ')}` : ''}`
																	: existingDevice && status === 'unknown'
																		? 'Already in Equipment - confirm Present to review'
																		: status === 'not_present'
																			? 'Not present'
																			: 'Skipped for now'}
																{savedState?.status &&
																	savedState.status !== status &&
																	' - Unsaved change'}
															</ItemMeta>
														</ItemInfo>
														<ItemChevron aria-hidden='true'>
															<FontAwesomeIcon
																icon={isExpanded ? faChevronUp : faChevronDown}
															/>
														</ItemChevron>
													</ItemExpandButton>
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
															Skip for now
														</StateButton>
													</StateButtonGrid>
												</ItemTopRow>
												{status === 'present' && isExpanded && (
													<ItemDetails id={`setup-item-details-${itemId}`}>
														<EquipmentCustomization>
															<CustomizationHeader>
																<div>
																	<strong>Equipment details</strong>
																	<span>
																		{isDistributedPropertySetupItem(itemId)
																			? 'Add each physical device separately so its Space and history stay accurate.'
																			: 'Add another when this property has more than one.'}
																	</span>
																</div>
																<AddInstanceButton
																	type='button'
																	onClick={() => handleAddSetupInstance(itemId)}>
																	+ Add another
																</AddInstanceButton>
															</CustomizationHeader>
															{instances.map((instance, instanceIndex) => (
																<InstanceCard key={instance.id}>
																	<InstanceHeader>
																		<InstanceNumber>
																			{instance.deviceId
																				? 'Existing equipment'
																				: `New equipment ${instanceIndex + 1}`}
																		</InstanceNumber>
																		{instances.length > 1 && (
																			<RemoveInstanceButton
																				type='button'
																				onClick={() =>
																					handleRemoveSetupInstance(
																						itemId,
																						instance.id,
																					)
																				}>
																				Remove
																			</RemoveInstanceButton>
																		)}
																	</InstanceHeader>
																	<InstanceFieldGrid>
																		<InstanceField>
																			<span>Name</span>
																			<input
																				value={instance.name}
																				onChange={(event) =>
																					updateSetupInstance(itemId, instance.id, {
																						name: event.target.value,
																					})
																				}
																			/>
																		</InstanceField>
																		{subtypeOptions.length > 0 && (
																			<InstanceField>
																				<span>Subtype (optional)</span>
																				<select
																					value={instance.assetVariant || ''}
																					onChange={(event) =>
																						updateSetupInstance(itemId, instance.id, {
																							assetVariant: event.target.value,
																						})
																					}>
																					<option value=''>Choose later</option>
																					{subtypeOptions.map((option) => (
																						<option key={option} value={option}>
																							{option}
																						</option>
																					))}
																				</select>
																			</InstanceField>
																		)}
																	</InstanceFieldGrid>
																	<SpaceFieldLabel>Spaces (optional)</SpaceFieldLabel>
																	<SpaceFieldHint>
																		Choose every place connected to this equipment. Suggested area Spaces are used when no custom choice is made.
																	</SpaceFieldHint>
															{availablePropertySpaces.some((space) => !space.isArchived) && (
																		<InstanceSpaceGrid>
																	{availablePropertySpaces
																				.filter((space) => !space.isArchived)
																				.map((space) => {
																					const selected = (instance.spaceIds || []).includes(
																						space.id,
																					);
																					return (
																						<InstanceSpaceOption
																							key={space.id}
																							$selected={selected}>
																							<input
																								type='checkbox'
																								checked={selected}
																								onChange={() =>
																									handleToggleInstanceSpace(
																										itemId,
																										instance,
																										space.id,
																									)
																								}
																							/>
																							<span>{space.name}</span>
																						</InstanceSpaceOption>
																					);
																				})}
																		</InstanceSpaceGrid>
																	)}
																	<QuickAddSpaceButton
																		type='button'
																		onClick={() => openQuickAddSpace(itemId, instance.id)}>
																		+ Quick add Space
																	</QuickAddSpaceButton>
																	{quickAddSpaceTarget?.itemId === itemId &&
																		quickAddSpaceTarget.instanceId === instance.id && (
																			<QuickAddSpaceForm>
																				<input
																					aria-label='Space name'
																					placeholder='Space name'
																					value={quickAddSpaceName}
																					onChange={(event) => setQuickAddSpaceName(event.target.value)}
																				/>
																				<select
																					aria-label='Space type'
																					value={quickAddSpaceType}
																					onChange={(event) =>
																						setQuickAddSpaceType(
																							event.target.value as PropertySpaceType,
																						)
																					}>
																					<option value='interior'>Interior</option>
																					<option value='utility'>Utility</option>
																					<option value='storage'>Storage</option>
																					<option value='exterior'>Exterior</option>
																					<option value='grounds'>Grounds</option>
																					<option value='amenity'>Amenity</option>
																					<option value='other'>Other</option>
																				</select>
																				<QuickAddSpaceActions>
																					<button
																						type='button'
																						onClick={() => setQuickAddSpaceTarget(null)}>
																						Cancel
																					</button>
																					<button
																						type='button'
																						onClick={handleQuickAddSpace}
																						disabled={isAddingQuickSpace}>
																						{isAddingQuickSpace ? 'Adding...' : 'Add Space'}
																					</button>
																				</QuickAddSpaceActions>
																			</QuickAddSpaceForm>
																		)}
																</InstanceCard>
															))}
														</EquipmentCustomization>
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
																	: 'Homeowner+ feature. You can still add this equipment now.'}
															</TaskPreviewNotice>
														)}
														<TaskPreviewList>
															{visibleSuggestedTasks.length > 0 ? (
																visibleSuggestedTasks.map((suggestedTask) => {
																	const existingSuggestedTask =
																						findExistingSuggestedTask(
																							suggestedTask,
																							linkedDeviceIds,
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
																	No suggested tasks selected. The equipment can
																	still be added.
																</EmptyTaskPreview>
															)}
																</TaskPreviewList>
															</TaskPreview>
														</ItemDetails>
													)}
											</ItemCard>
										);
									})}
								</ItemList>

								</AreaScrollContent>
								<WizardNavigation data-testid='setup-navigation'>
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
													? 'Review'
													: 'Next'}
										</AssistantButton>
									</NavigationActions>
								</WizardNavigation>
							</AreaPanel>
							)}
						</ModalBody>
					</ModalPanel>
					{isCloseConfirmOpen && (
						<ConfirmPanel role='alertdialog' aria-modal='true'>
							<ConfirmTitle>Save setup changes?</ConfirmTitle>
							<ConfirmText>
								You made changes in this setup review. Saving will create or
								link the equipment marked present and add their suggested
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
									onClick={() => {
										setIsCloseConfirmOpen(false);
										setIsSaveReviewOpen(true);
									}}
									disabled={isSavingAssistant}>
									Review Changes
								</AssistantButton>
							</ConfirmActions>
						</ConfirmPanel>
					)}
					{isSaveReviewOpen && (
						<ConfirmPanel role='alertdialog' aria-modal='true'>
							<ConfirmTitle>Review setup changes</ConfirmTitle>
							<ConfirmText>
								Confirm the equipment and Space connections Maintley will save.
							</ConfirmText>
							{setupEquipmentReview.length > 0 && (
								<>
									<ReviewSectionTitle>Equipment records</ReviewSectionTitle>
									<ReviewList>
										{setupEquipmentReview.map((entry) => (
											<li key={entry.key}>
												<strong>{entry.name}</strong>
												{entry.assetVariant ? ` - ${entry.assetVariant}` : ''}
												{' - '}
												{entry.isExisting ? 'Reuse existing record' : 'Create new record'}
												{entry.spaceNames.length > 0
													? ` - ${entry.spaceNames.join(', ')}`
													: ' - No Space selected'}
											</li>
										))}
									</ReviewList>
								</>
							)}
							{reviewedSetupSpacePlan.length > 0 && (
								<>
									<ReviewSectionTitle>Suggested Spaces</ReviewSectionTitle>
									<ReviewList>
										{reviewedSetupSpacePlan.map((entry) => (
											<li key={entry.template.generationKey}>
												<strong>{entry.space?.name || entry.template.name}</strong>
												{' - '}
												{entry.status === 'create'
													? 'Create new Space'
													: entry.status === 'reuse'
														? 'Reuse existing Space'
														: 'Archived match requires review'}
											</li>
										))}
									</ReviewList>
								</>
							)}
							<ConfirmText>
								Suggested tasks will use the combined Spaces selected for their equipment.
							</ConfirmText>
							<ConfirmActions>
								<SecondaryAction
									type='button'
									onClick={() => setIsSaveReviewOpen(false)}
									disabled={isSavingAssistant}>
									Back
								</SecondaryAction>
								<AssistantButton
									type='button'
									onClick={handleDone}
									disabled={isSavingAssistant || hasArchivedSpaceConflict}>
									{hasArchivedSpaceConflict
										? 'Review Archived Spaces'
										: isSavingAssistant
											? 'Saving...'
											: 'Save & Create'}
								</AssistantButton>
							</ConfirmActions>
						</ConfirmPanel>
					)}
					{isSavingAssistant && (
						<LoadingState
							loadingKey='property-setup-assistant'
							title='Finishing setup'
							message={`Organizing your ${isHomeownerMode ? 'home' : 'property'} setup.`}
							steps={getSetupLoadingSteps(isHomeownerMode)}
						/>
					)}
					{isSaveComplete && (
						<SavingOverlay role='status' aria-live='polite'>
							<SavingCard>
								<SavingCompleteIcon aria-hidden='true'>OK</SavingCompleteIcon>
								<SavingTitle>Quick setup review</SavingTitle>
								<ReviewText>
									Here is what was saved for {property.title || 'this property'}.
								</ReviewText>
								<ReviewStats>
									<ReviewStat>
										<strong>{completionSummary?.applianceCount || 0}</strong>
										<span>equipment records</span>
									</ReviewStat>
									<ReviewStat>
										<strong>{completionSummary?.taskCount || 0}</strong>
										<span>suggested tasks linked</span>
									</ReviewStat>
									<ReviewStat>
										<strong>{completionSummary?.spaceCount || 0}</strong>
										<span>Spaces organized</span>
									</ReviewStat>
								</ReviewStats>
								<ReviewMeta>
									{completionSummary?.createdApplianceCount || 0} new equipment record
									{(completionSummary?.createdApplianceCount || 0) === 1 ? '' : 's'} and{' '}
									{completionSummary?.createdTaskCount || 0} new task
									{(completionSummary?.createdTaskCount || 0) === 1 ? '' : 's'}, plus{' '}
									{completionSummary?.createdSpaceCount || 0} new Space
									{(completionSummary?.createdSpaceCount || 0) === 1 ? '' : 's'} created.
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
										Add more equipment
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
	border: 1px solid ${({ $complete }) => ($complete ? COLORS.successLight : COLORS.infoLight)};
	border-radius: 12px;
	background: ${({ $complete }) => ($complete ? COLORS.successLight : COLORS.infoLight)};

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		padding: 14px;
		gap: 12px;
	}
`;

const AssistantContent = styled.div`
	grid-column: 1 / -1;
	min-width: 0;
`;

const AssistantHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	min-width: 0;
`;

const AssistantBody = styled.div`
	margin-top: 4px;
`;

const AssistantCollapseButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	border: 1px solid rgba(11, 91, 72, 0.18);
	border-radius: 999px;
	background: ${COLORS.white};
	color: ${COLORS.primary};
	cursor: pointer;
	flex: 0 0 auto;

	&:hover {
		background: rgba(11, 91, 72, 0.08);
	}

	&:focus-visible {
		outline: 3px solid rgba(11, 91, 72, 0.22);
		outline-offset: 2px;
	}
`;

const CompleteSummary = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

const CompleteSummaryLabel = styled.div`
	color: ${COLORS.primary};
	font-size: 13px;
	font-weight: 900;
	text-transform: uppercase;
	letter-spacing: 0.04em;
`;

const AssistantEyebrow = styled.div`
	font-size: 12px;
	font-weight: 800;
	color: ${COLORS.primary};
	text-transform: uppercase;
	letter-spacing: 0.04em;
`;

const AssistantTitle = styled.h2`
	margin: 4px 0;
	font-size: 18px;
	line-height: 1.25;
	color: ${COLORS.textPrimary};

	@media (max-width: 640px) {
		font-size: 16px;
	}
`;

const AssistantText = styled.p`
	margin: 0;
	font-size: 13px;
	line-height: 1.45;
	color: ${COLORS.gray600};
`;

const ProgressText = styled.div`
	margin-top: 10px;
	font-size: 12px;
	font-weight: 700;
	color: ${COLORS.gray700};
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
	background: ${COLORS.primary};
`;

const AssistantButton = styled.button`
	grid-column: 2;
	justify-self: end;
	border: none;
	border-radius: 10px;
	background: ${COLORS.primary};
	color: ${COLORS.white};
	font-size: 14px;
	font-weight: 800;
	padding: 11px 16px;
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		background: ${COLORS.primaryHover};
	}

	&:disabled {
		opacity: 0.65;
		cursor: wait;
	}

	@media (max-width: 640px) {
		grid-column: 1;
		justify-self: stretch;
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
	background: ${COLORS.white};
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
	border-bottom: 1px solid ${COLORS.border};
	flex-shrink: 0;

	@media (max-width: 640px) {
		padding: 14px;
	}
`;

const ModalTitle = styled.h2`
	margin: 0;
	font-size: 20px;
	color: ${COLORS.textPrimary};
`;

const ModalHint = styled.p`
	margin: 4px 0 0;
	font-size: 13px;
	line-height: 1.45;
	color: ${COLORS.textSecondary};
`;

const CloseButton = styled.button`
	flex: 0 0 auto;
	width: 36px;
	height: 36px;
	border: none;
	border-radius: 999px;
	background: ${COLORS.borderLight};
	color: ${COLORS.gray700};
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
	background: ${COLORS.bgLight};

	@media (max-width: 760px) {
		overflow: hidden;
	}
`;

const SetupPathPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding: 22px;
	overflow-y: auto;

	@media (max-width: 640px) {
		padding: 16px 14px max(24px, calc(18px + env(safe-area-inset-bottom)));
		gap: 14px;
	}
`;

const SetupPathIntro = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const DetectedRecordNotice = styled.div`
	margin-top: 6px;
	padding: 11px 12px;
	border: 1px solid ${COLORS.primary};
	border-radius: 10px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	font-size: 13px;
	font-weight: 700;
	line-height: 1.45;
`;

const SetupPathGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12px;

	@media (max-width: 760px) {
		grid-template-columns: 1fr;
	}
`;

const SetupPathButton = styled.button`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 9px;
	min-height: 180px;
	padding: 16px;
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	background: ${COLORS.white};
	color: ${COLORS.textPrimary};
	text-align: left;
	cursor: pointer;

	strong {
		font-size: 16px;
		line-height: 1.3;
	}

	span {
		font-size: 13px;
		line-height: 1.5;
		color: ${COLORS.textSecondary};
	}

	&:hover {
		border-color: ${COLORS.primary};
		box-shadow: 0 8px 24px rgba(4, 120, 87, 0.12);
	}

	&:focus-visible {
		outline: 3px solid rgba(4, 120, 87, 0.22);
		outline-offset: 2px;
	}

	@media (max-width: 760px) {
		min-height: 0;
	}
`;

const SetupPathAction = styled.span`
	margin-top: auto;
	font-weight: 800;
	color: ${COLORS.primary} !important;
`;

const AreaPanel = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	overflow: hidden;
`;

const AreaScrollContent = styled.div`
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 16px;
	padding: 18px;
	min-height: 0;
	overflow-y: auto;
	overscroll-behavior: contain;

	@media (max-width: 640px) {
		padding: 14px;
		gap: 12px;
	}
`;

const RestoredDraftNotice = styled.div`
	padding: 12px 14px;
	border: 1px solid ${COLORS.primary};
	border-radius: 10px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	font-size: 13px;
	font-weight: 700;
	line-height: 1.45;
`;

const WizardProgressHeader = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 14px;
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	background: ${COLORS.white};
`;

const WizardProgressText = styled.div`
	font-size: 12px;
	font-weight: 800;
	color: ${COLORS.gray600};
	text-transform: uppercase;
	letter-spacing: 0.04em;
`;

const WizardProgressTrack = styled.div`
	height: 8px;
	border-radius: 999px;
	background: ${COLORS.border};
	overflow: hidden;
`;

const WizardProgressFill = styled.div`
	height: 100%;
	border-radius: inherit;
	background: ${COLORS.primary};
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
		$active || $complete ? COLORS.primary : COLORS.gray300};
	background: ${({ $active, $complete }) =>
		$active ? COLORS.primary : $complete ? COLORS.successLight : COLORS.white};
	color: ${({ $active, $complete }) =>
		$active ? COLORS.white : $complete ? COLORS.successDark : COLORS.gray600};
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
	color: ${COLORS.textPrimary};
`;

const AreaHint = styled.p`
	margin: 4px 0 0;
	font-size: 13px;
	color: ${COLORS.textSecondary};
`;

const AreaReviewedPill = styled.div`
	flex: 0 0 auto;
	border-radius: 999px;
	background: ${COLORS.successLight};
	color: ${COLORS.primary};
	font-size: 12px;
	font-weight: 800;
	padding: 7px 10px;
`;

const AreaValueSummary = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 11px 12px;
	border: 1px solid ${COLORS.successLight};
	border-radius: 10px;
	background: ${COLORS.successLight};
	color: ${COLORS.successDark};
	font-size: 12px;
	line-height: 1.5;
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
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	background: ${COLORS.white};

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

const ItemExpandButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	min-width: 0;
	min-height: 44px;
	padding: 0;
	border: 0;
	background: transparent;
	text-align: left;
	cursor: pointer;

	&:focus-visible {
		outline: 3px solid rgba(4, 120, 87, 0.2);
		outline-offset: 4px;
		border-radius: 8px;
	}
`;

const ItemChevron = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	flex: 0 0 auto;
	border-radius: 999px;
	color: ${COLORS.primary};
	background: ${COLORS.gray100};
`;

const ItemTitle = styled.div`
	font-size: 14px;
	font-weight: 800;
	color: ${COLORS.textPrimary};
`;

const ItemMeta = styled.div`
	margin-top: 3px;
	font-size: 12px;
	font-weight: 700;
	color: ${COLORS.textSecondary};
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
	border: 1px solid ${({ $active }) => ($active ? COLORS.primary : COLORS.gray300)};
	border-radius: 9px;
	background: ${({ $active }) => ($active ? COLORS.successLight : COLORS.white)};
	color: ${({ $active }) => ($active ? COLORS.successDark : COLORS.gray700)};
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

const ItemDetails = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding-top: 2px;
`;

const EquipmentCustomization = styled.section`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 10px;
	border: 1px solid ${COLORS.border};
	border-radius: 10px;
	background: ${COLORS.gray50};
`;

const CustomizationHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	font-size: 12px;
	color: ${COLORS.textPrimary};

	div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	span {
		color: ${COLORS.textSecondary};
		line-height: 1.4;
	}

	@media (max-width: 520px) {
		flex-direction: column;
	}
`;

const AddInstanceButton = styled.button`
	min-height: 36px;
	padding: 7px 10px;
	border: 1px solid ${COLORS.primary};
	border-radius: 8px;
	background: ${COLORS.white};
	color: ${COLORS.primary};
	font-size: 12px;
	font-weight: 800;
	cursor: pointer;
	white-space: nowrap;
`;

const InstanceCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 9px;
	padding: 10px;
	border: 1px solid ${COLORS.gray300};
	border-radius: 9px;
	background: ${COLORS.white};
`;

const InstanceHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
`;

const InstanceNumber = styled.span`
	font-size: 11px;
	font-weight: 900;
	color: ${COLORS.primary};
	text-transform: uppercase;
	letter-spacing: 0.03em;
`;

const RemoveInstanceButton = styled.button`
	min-height: 32px;
	padding: 5px 8px;
	border: 1px solid ${COLORS.gray300};
	border-radius: 7px;
	background: ${COLORS.white};
	color: ${COLORS.errorDark};
	font-size: 11px;
	font-weight: 800;
	cursor: pointer;
`;

const InstanceFieldGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 9px;

	@media (max-width: 520px) {
		grid-template-columns: 1fr;
	}
`;

const InstanceField = styled.label`
	display: flex;
	flex-direction: column;
	gap: 5px;
	font-size: 11px;
	font-weight: 800;
	color: ${COLORS.textSecondary};

	input,
	select {
		width: 100%;
		min-height: 40px;
		box-sizing: border-box;
		padding: 8px 10px;
		border: 1px solid ${COLORS.gray300};
		border-radius: 8px;
		background: ${COLORS.white};
		color: ${COLORS.textPrimary};
		font: inherit;
		font-size: 13px;
	}
`;

const SpaceFieldLabel = styled.div`
	font-size: 12px;
	font-weight: 900;
	color: ${COLORS.textPrimary};
`;

const SpaceFieldHint = styled.div`
	margin-top: -5px;
	font-size: 11px;
	line-height: 1.4;
	color: ${COLORS.textSecondary};
`;

const InstanceSpaceGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 6px;

	@media (max-width: 520px) {
		grid-template-columns: 1fr;
	}
`;

const InstanceSpaceOption = styled.label<{ $selected: boolean }>`
	display: flex;
	align-items: center;
	gap: 8px;
	min-height: 40px;
	padding: 7px 9px;
	box-sizing: border-box;
	border: 1px solid
		${({ $selected }) => ($selected ? COLORS.primary : COLORS.gray300)};
	border-radius: 8px;
	background: ${({ $selected }) =>
		$selected ? COLORS.successLight : COLORS.white};
	font-size: 12px;
	font-weight: 700;
	color: ${COLORS.textPrimary};
	cursor: pointer;

	input {
		width: 20px;
		height: 20px;
		margin: 0;
	}
`;

const QuickAddSpaceButton = styled.button`
	align-self: flex-start;
	min-height: 36px;
	padding: 6px 0;
	border: 0;
	background: transparent;
	color: ${COLORS.primary};
	font-size: 12px;
	font-weight: 900;
	cursor: pointer;
`;

const QuickAddSpaceForm = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(120px, 0.6fr) auto;
	gap: 8px;
	padding: 9px;
	border-radius: 8px;
	background: ${COLORS.infoLight};

	input,
	select {
		min-height: 40px;
		box-sizing: border-box;
		padding: 8px 9px;
		border: 1px solid ${COLORS.gray300};
		border-radius: 7px;
		background: ${COLORS.white};
		color: ${COLORS.textPrimary};
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const QuickAddSpaceActions = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;

	button {
		min-height: 40px;
		padding: 7px 9px;
		border: 1px solid ${COLORS.gray300};
		border-radius: 7px;
		background: ${COLORS.white};
		color: ${COLORS.textPrimary};
		font-size: 12px;
		font-weight: 800;
		cursor: pointer;
	}

	button:last-child {
		border-color: ${COLORS.primary};
		background: ${COLORS.primary};
		color: ${COLORS.white};
	}
`;

const TaskPreview = styled.div`
	border-radius: 10px;
	border: 1px solid ${COLORS.infoLight};
	background: ${COLORS.infoLight};
	padding: 10px;
`;

const TaskPreviewTitle = styled.div`
	margin-bottom: 8px;
	font-size: 12px;
	font-weight: 900;
	color: ${COLORS.infoDark};
`;

const TaskPreviewNotice = styled.div`
	margin-bottom: 8px;
	padding: 8px 10px;
	border-radius: 8px;
	background: ${COLORS.warningLight};
	border: 1px solid ${COLORS.warningLight};
	color: ${COLORS.warningDark};
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
	color: ${COLORS.textPrimary};

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
	color: ${COLORS.secondaryHover};
`;

const RemoveTaskButton = styled.button`
	width: 24px;
	height: 24px;
	border: 1px solid ${COLORS.infoLight};
	border-radius: 999px;
	background: ${COLORS.white};
	color: ${COLORS.gray600};
	font-size: 14px;
	font-weight: 900;
	line-height: 1;
	cursor: pointer;

	&:hover {
		border-color: ${COLORS.error};
		color: ${COLORS.errorDark};
	}
`;

const RecreateTaskButton = styled.button`
	border: 1px solid ${COLORS.infoLight};
	border-radius: 999px;
	background: ${COLORS.white};
	color: ${COLORS.secondaryDark};
	font-size: 12px;
	font-weight: 900;
	padding: 5px 9px;
	cursor: pointer;

	&:hover {
		border-color: ${COLORS.secondaryHover};
		background: ${COLORS.infoLight};
	}
`;

const TaskStatusText = styled.span`
	border-radius: 999px;
	background: ${COLORS.white};
	color: ${COLORS.textSecondary};
	font-size: 11px;
	font-weight: 900;
	padding: 5px 8px;
`;

const EmptyTaskPreview = styled.div`
	font-size: 12px;
	font-weight: 700;
	color: ${COLORS.textSecondary};
`;

const WizardNavigation = styled.div`
	display: flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
	padding: 14px 18px;
	border-top: 1px solid ${COLORS.border};
	background: ${COLORS.white};
	box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.06);
	z-index: 1;

	@media (max-width: 640px) {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		padding: 10px 14px max(10px, env(safe-area-inset-bottom));
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
	color: ${COLORS.textSecondary};

	@media (max-width: 420px) {
		grid-column: 1 / -1;
	}
`;

const SecondaryAction = styled.button`
	border: none;
	background: transparent;
	color: ${COLORS.gray600};
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
	background: ${COLORS.white};
	box-shadow: 0 24px 80px rgba(15, 23, 42, 0.36);
	padding: 18px;
`;

const ConfirmTitle = styled.h3`
	margin: 0;
	font-size: 18px;
	color: ${COLORS.textPrimary};
`;

const ConfirmText = styled.p`
	margin: 8px 0 0;
	font-size: 13px;
	line-height: 1.5;
	color: ${COLORS.gray600};
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
	background: ${COLORS.white};
	box-shadow: 0 24px 80px rgba(15, 23, 42, 0.34);
	padding: 28px;
`;

const SavingTitle = styled.div`
	font-size: 20px;
	font-weight: 900;
	line-height: 1.3;
	color: ${COLORS.textPrimary};
	text-align: center;
`;

const SavingCompleteIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 54px;
	height: 54px;
	margin: 0 auto 18px;
	border-radius: 999px;
	background: ${COLORS.successLight};
	color: ${COLORS.primaryDark};
	font-size: 28px;
	font-weight: 900;
`;

const SavingOkButton = styled.button`
	width: 100%;
	margin-top: 18px;
	border: none;
	border-radius: 10px;
	background: ${COLORS.primary};
	color: ${COLORS.white};
	font-size: 15px;
	font-weight: 900;
	padding: 12px 16px;
	cursor: pointer;

	&:hover {
		background: ${COLORS.primaryHover};
	}
`;

const ReviewText = styled.p`
	margin: 8px 0 0;
	color: ${COLORS.gray600};
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
	border: 1px solid ${COLORS.successLight};
	border-radius: 12px;
	background: ${COLORS.successLight};
	text-align: center;

	strong {
		display: block;
		color: ${COLORS.textPrimary};
		font-size: 22px;
		line-height: 1;
	}

	span {
		display: block;
		margin-top: 6px;
		color: ${COLORS.gray600};
		font-size: 12px;
		font-weight: 800;
		line-height: 1.3;
	}
`;

const ReviewMeta = styled.div`
	margin-top: 12px;
	color: ${COLORS.textSecondary};
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
		border: 1px solid ${COLORS.border};
		border-radius: 999px;
		background: ${COLORS.bgLight};
		color: ${COLORS.gray700};
		font-size: 12px;
		font-weight: 800;
		line-height: 1.2;
		padding: 6px 10px;
	}
`;

const ReviewSectionTitle = styled.div`
	margin-top: 10px;
	font-size: 12px;
	font-weight: 900;
	color: ${COLORS.textPrimary};
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
	border: 1px solid ${COLORS.primaryLight};
	background: ${COLORS.successLight};
	color: ${COLORS.primary};

	&:hover {
		background: ${COLORS.primaryLight};
	}
`;

const ReviewLinkButton = styled.button`
	border: none;
	background: transparent;
	color: ${COLORS.gray600};
	font-size: 14px;
	font-weight: 800;
	padding: 8px 12px;
	cursor: pointer;
	text-decoration: underline;
	text-underline-offset: 3px;
`;
