import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
	FormInput,
	FormSelect,
} from 'Components/Library';
import { useCreateDeviceMutation, useUpdateDeviceMutation } from 'Redux/API/deviceSlice';
import { useCreateTaskMutation, useGetTasksQuery } from 'Redux/API/taskSlice';
import { useUpdatePropertyMutation } from 'Redux/API/propertySlice';
import {
	useCreatePropertySupplyMutation,
	useGetPropertySuppliesQuery,
} from 'Redux/API/supplySlice';
import {
	useGetPropertyKnowledgeLinksQuery,
	useSetDocumentLinksMutation,
	useSetSupplyLinksMutation,
} from 'Redux/API/propertyKnowledgeLinkSlice';
import {
	useCreateContractorMutation,
	useUpdateContractorMutation,
} from 'Redux/API/contractorSlice';
import type { RootState } from 'Redux/store/store';
import type { Device, Property, PropertyDocument } from 'types/Property.types';
import type {
	ExtractedKnowledgeField,
	ExtractedPartSuggestion,
	PartKnowledgeCategory,
	PropertyKnowledgeFieldKey,
	PropertyKnowledgeConfidenceLevel,
	PropertyKnowledgeTargetEntity,
	PropertyKnowledgeSuggestion,
	PropertyKnowledgeTaskSuggestion,
	PropertyKnowledgeEquipmentSuggestion,
} from 'types/PropertyKnowledge.types';
import {
	acceptKnowledgeSuggestion,
	applyAcceptedKnowledgeSuggestion,
	mergeKnowledgeSuggestion,
	rejectKnowledgeSuggestion,
} from 'propertyKnowledge/propertyKnowledgeAcquisition';
import {
	updatePropertyDocumentInCollection,
	updatePropertyKnowledgeSuggestionInCollection,
} from 'propertyKnowledge/propertyMemoryRecordService';
import { usePropertyMemoryRecords } from 'propertyKnowledge/usePropertyMemoryRecords';
import {
	getPropertyKnowledgeSuggestionCount,
} from 'propertyKnowledge/propertyKnowledgeSuggestionSummary';
import { getPropertyDocumentConnections } from 'utils/propertyDocumentRelationships';
import {
	findAssetTargetCandidate,
	findContractorTargetCandidate,
	findMaintenanceEventTargetCandidate,
	type KnowledgeTargetCandidate,
} from 'propertyKnowledge/propertyKnowledgeTargeting';
import type { RoleCapabilities } from 'utils/permissions';
import {
	canUsePropertyKnowledgeAcquisition,
	SubscriptionData,
} from 'utils/subscriptionUtils';
import { useAppFeedback } from 'Components/Library/AppFeedback/AppFeedbackProvider';
import {
	getAssetTypeOptions,
	getAssetDefinition,
	getAssetVariantOptions,
	normalizeAssetType,
	normalizeAssetVariant,
	UNKNOWN_ASSET_TYPE,
} from 'utils/systemTypes';
import { COLORS } from '../../../constants/colors';
import { getFinancialDisplayTotal } from 'utils/financialUtils';
import { publishMaintleyEvent } from 'services/maintleyEventService';
import type { TaskScheduleMode } from 'types/Task.types';
import { getSupplyEndpointIds } from 'types/PropertyKnowledgeLink.types';

interface PropertyKnowledgeReviewPanelProps {
	property: Property;
	propertyDevices: Device[];
	maintenanceHistoryRecords?: any[];
	propertyContractors?: any[];
	permissions?: RoleCapabilities;
	subscription?: SubscriptionData | null;
	selectedSuggestionId?: string | null;
	onSelectSuggestion?: (suggestionId: string) => void;
	onAddMaintenanceHistory?: (history: any) => Promise<void> | void;
	onUpdateMaintenanceHistory?: (
		historyId: string,
		updates: Partial<any>,
	) => Promise<void> | void;
}

const PART_CATEGORY_OPTIONS: PartKnowledgeCategory[] = [
	'part',
	'supply',
	'consumable',
	'accessory',
	'material',
];

const EMPTY_TASKS: any[] = [];
const EQUIPMENT_SKIP_REASONS = [
	'Not equipment',
	'Not part of this property',
	'Duplicate suggestion',
	'Incorrect information',
	'Other',
];

const normalizeLookupValue = (value?: string) =>
	String(value || '')
		.trim()
		.toLowerCase();

const appendNote = (current?: string, note?: string) => {
	const trimmedNote = String(note || '').trim();
	if (!trimmedNote) return current || '';
	if (String(current || '').includes(trimmedNote)) return current || '';
	return [current, trimmedNote].filter(Boolean).join('\n');
};

const formatSuggestionDate = (value?: string) => {
	if (!value) return 'Date unknown';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Date unknown';
	return date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
};

const getStatusLabel = (status?: string) => {
	if (status === 'pending') return 'Needs review';
	if (status === 'applied') return 'Saved';
	if (status === 'rejected') return 'Rejected';
	if (status === 'accepted') return 'Accepted';
	return 'Reviewed';
};

type ConfidenceItem = Pick<
	ExtractedKnowledgeField | ExtractedPartSuggestion,
	'confidence' | 'confidenceLevel' | 'confidenceReason'
>;

const getConfidenceLevel = (
	item: ConfidenceItem,
): PropertyKnowledgeConfidenceLevel => {
	if (item.confidenceLevel) return item.confidenceLevel;
	if (typeof item.confidence === 'number' && item.confidence >= 0.8) return 'high';
	if (typeof item.confidence === 'number' && item.confidence < 0.5) return 'low';
	return 'medium';
};

const getConfidenceLabel = (item: ConfidenceItem) => {
	const level = getConfidenceLevel(item);
	if (level === 'high') return 'High confidence';
	if (level === 'medium') return 'Needs review';
	return 'Not shown';
};

const getConfidenceMessage = (item: ConfidenceItem) => {
	const level = getConfidenceLevel(item);
	if (level === 'high') {
		return [
			item.confidenceReason || 'Document clearly states this.',
			"Maintley is showing it because it can add to this property's memory.",
		].join(' ');
	}
	if (item.confidenceReason) return item.confidenceReason;
	return 'Review this detail before saving it to your property.';
};

const isAssetClassificationField = (field: ExtractedKnowledgeField) =>
	field.fieldKey === 'assetType' || field.fieldKey === 'assetVariant';

const getDocumentTypeLabel = (documentType?: string) => {
	if (documentType === 'inspection_report') return 'Inspection report';
	if (documentType === 'contractor_document') return 'Contractor document';
	return String(documentType || 'document')
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
};

const getExtractionSourceLabel = (suggestion: PropertyKnowledgeSuggestion) => {
	const documentType = getDocumentTypeLabel(suggestion.documentType);
	if (suggestion.extractionMethod === 'image_ocr') {
		return `${documentType} OCR`;
	}
	if (suggestion.extractionMethod === 'pdf_text') {
		return `${documentType} PDF text`;
	}
	if (suggestion.extractionMethod === 'pdf_rendered_ocr') {
		return `${documentType} PDF OCR`;
	}
	if (suggestion.extractionMethod === 'docx_text') {
		return `${documentType} Word text`;
	}
	if (suggestion.extractionMethod === 'metadata_placeholder') {
		return `${documentType} details`;
	}
	return documentType;
};

type FieldGroupConfig = {
	key: string;
	title: string;
	description: string;
	entities: PropertyKnowledgeTargetEntity[];
};

const FIELD_GROUPS: FieldGroupConfig[] = [
	{
		key: 'system',
		title: 'System details',
		description: 'Will update the related asset.',
		entities: ['system'],
	},
	{
		key: 'contractor',
		title: 'Contractor',
		description: 'Adds contractor details to Property Memory.',
		entities: ['contractor'],
	},
	{
		key: 'maintenance-history',
		title: 'Maintenance history',
		description: 'Adds context to Maintenance History.',
		entities: ['maintenanceHistory'],
	},
	{
		key: 'warranty',
		title: 'Warranty details',
		description: 'Adds warranty context to Property Memory.',
		entities: ['warranty'],
	},
	{
		key: 'other',
		title: 'Other details',
		description: 'Adds useful context to Property Memory.',
		entities: ['property', 'task', 'part'],
	},
];

const getFieldGroupConfig = (targetEntity: PropertyKnowledgeTargetEntity) =>
	FIELD_GROUPS.find((group) => group.entities.includes(targetEntity)) ||
	FIELD_GROUPS[FIELD_GROUPS.length - 1];

const getUniqueDestinationLabels = (
	suggestion: PropertyKnowledgeSuggestion,
): string[] => {
	const labels = new Set<string>();
	suggestion.extractedFields.forEach((field) => {
		labels.add(getFieldGroupConfig(field.targetEntity).title);
	});
	if ((suggestion.suggestedParts || []).length > 0) {
		labels.add('Parts & Supplies');
	}
	if ((suggestion.suggestedTasks || []).length > 0) labels.add('Tasks');
	if ((suggestion.suggestedEquipment || []).length > 0) labels.add('Equipment');
	return Array.from(labels);
};

type MemoryChangeGroupKey =
	| 'asset'
	| 'property'
	| 'maintenance-event'
	| 'contractor'
	| 'warranty'
	| 'part';

type MemoryChangeMode = 'update' | 'create';
type MemorySectionKey =
	| 'general'
	| 'financial'
	| 'contractor'
	| 'parts'
	| 'warranty'
	| 'maintenance';

interface MemoryChangeGroup {
	key: MemoryChangeGroupKey;
	title: string;
	subtitle: string;
	mode: MemoryChangeMode;
	targetCandidate?: KnowledgeTargetCandidate;
	fields: ExtractedKnowledgeField[];
	parts: ExtractedPartSuggestion[];
}

interface MemoryChangeSection {
	key: MemorySectionKey;
	title: string;
	fields: ExtractedKnowledgeField[];
	parts: ExtractedPartSuggestion[];
}

type ReviewSummaryTone = 'success' | 'warning' | 'required';

interface ReviewSummarySection {
	title: string;
	items: string[];
	tone: ReviewSummaryTone;
}

type TargetChoiceMode = 'update' | 'create';

interface TargetChoices {
	assetId?: string;
	contractorId?: string;
	contractorMode: TargetChoiceMode;
	maintenanceEventId?: string;
	maintenanceEventMode: TargetChoiceMode;
}

const COST_FIELD_KEYS = new Set<PropertyKnowledgeFieldKey>([
	'totalCost',
	'laborCost',
	'partsCost',
	'taxAmount',
	'currency',
]);

const PART_FIELD_KEYS = new Set<PropertyKnowledgeFieldKey>([
	'partName',
	'partNumber',
	'partsReplaced',
	'consumables',
	'lubricantType',
	'fluidType',
]);

const FINANCIAL_FIELD_KEYS = new Set<PropertyKnowledgeFieldKey>([
	'invoiceNumber',
	'invoiceDate',
	'paidDate',
	'totalCost',
	'laborCost',
	'partsCost',
	'taxAmount',
	'currency',
]);

const CONTRACTOR_FIELD_KEYS = new Set<PropertyKnowledgeFieldKey>([
	'installer',
	'contractorName',
	'contractorPhone',
	'contractorWebsite',
]);

const WARRANTY_FIELD_KEYS = new Set<PropertyKnowledgeFieldKey>([
	'warrantyStartDate',
	'warrantyEndDate',
	'warrantyLength',
	'registrationRequired',
]);

const MAINTENANCE_FIELD_KEYS = new Set<PropertyKnowledgeFieldKey>([
	'maintenanceEventDate',
	'maintenanceEventDescription',
	'performedByName',
	'maintenanceType',
	'servicePerformed',
	'recommendedMaintenanceInterval',
	'partsReplaced',
]);

const SECTION_LABELS: Record<MemorySectionKey, string> = {
	general: 'General',
	financial: 'Financial',
	contractor: 'Contractor',
	parts: 'Parts',
	warranty: 'Warranty',
	maintenance: 'Maintenance',
};

const SECTION_ORDER: MemorySectionKey[] = [
	'general',
	'financial',
	'contractor',
	'parts',
	'warranty',
	'maintenance',
];

const getFieldSectionKey = (field: ExtractedKnowledgeField): MemorySectionKey => {
	if (FINANCIAL_FIELD_KEYS.has(field.fieldKey)) return 'financial';
	if (CONTRACTOR_FIELD_KEYS.has(field.fieldKey)) return 'contractor';
	if (WARRANTY_FIELD_KEYS.has(field.fieldKey)) return 'warranty';
	if (PART_FIELD_KEYS.has(field.fieldKey) || field.targetEntity === 'part') {
		return 'parts';
	}
	if (
		MAINTENANCE_FIELD_KEYS.has(field.fieldKey) ||
		field.targetEntity === 'maintenanceHistory' ||
		field.targetEntity === 'task'
	) {
		return 'maintenance';
	}
	return 'general';
};

const getMemoryChangeGroupKey = (
	field: ExtractedKnowledgeField,
): MemoryChangeGroupKey => {
	if (field.targetEntity === 'system') return 'asset';
	if (field.targetEntity === 'property') return 'property';
	if (field.targetEntity === 'contractor') return 'contractor';
	if (field.targetEntity === 'warranty') return 'warranty';
	if (COST_FIELD_KEYS.has(field.fieldKey)) return 'maintenance-event';
	if (field.targetEntity === 'part' || PART_FIELD_KEYS.has(field.fieldKey)) {
		return 'part';
	}
	return 'maintenance-event';
};

const getReviewSummaryLabel = (group: MemoryChangeGroup) => {
	if (group.key === 'asset') return 'System';
	if (group.key === 'property') return 'Property';
	if (group.key === 'maintenance-event') return 'Maintenance Event';
	if (group.key === 'contractor') return 'Contractor';
	if (group.key === 'warranty') return 'Warranty';
	if (group.key === 'part') return 'Parts & Supplies';
	return group.title;
};

const getRecordValue = (record: any, field?: string) => {
	if (!record || !field) return '';
	const value = record[field];
	if (value === null || value === undefined) return '';
	return String(value);
};

const getDisplayValue = (value?: string) => {
	const trimmed = String(value || '').trim();
	return trimmed || '-';
};

const getChangeKind = (currentValue?: string, proposedValue?: string) => {
	const current = String(currentValue || '').trim();
	const proposed = String(proposedValue || '').trim();
	if (!proposed) return 'No value';
	if (!current) return 'Will add';
	if (current === proposed) return 'No change';
	return 'Will replace';
};

const dedupeValues = (values: unknown[] = []) =>
	Array.from(
		new Set(
			values
				.map((value) => String(value || '').trim())
				.filter(Boolean),
		),
	);

const appendDocumentAttachment = (current: any[] = [], sourceDocument?: PropertyDocument) => {
	const document = sourceDocument as any;
	if (!document?.fileUrl && !document?.url) return current;
	const url = document.fileUrl || document.url;
	const name = document.fileName || document.name || 'Document';
	const exists = current.some(
		(attachment: any) =>
			String(attachment?.url || '') === String(url) ||
			String(attachment?.fileName || attachment?.name || '') === String(name),
	);
	if (exists) return current;
	return [
		...current,
		{
			id: `file_${Date.now()}`,
			fileName: name,
			fileSize: document.size || 0,
			mimeType: document.type || 'application/octet-stream',
			url,
			uploadedAt: document.uploadedAt || new Date().toISOString(),
			description: 'Source document',
		},
	];
};

const buildMaintenanceHistoryUpdates = ({
	existingRecord,
	suggestion,
	completedBy,
	completedByName,
	sourceDocument,
}: {
	existingRecord: any;
	suggestion: NonNullable<ReturnType<typeof applyAcceptedKnowledgeSuggestion>['maintenanceHistorySuggestion']>;
	completedBy?: string;
	completedByName?: string;
	sourceDocument?: PropertyDocument;
}) => {
	const updates: Record<string, unknown> = {};

	if (!existingRecord.title && suggestion.title) updates.title = suggestion.title;
	if (!existingRecord.completionDate && suggestion.completionDate) {
		updates.completionDate = suggestion.completionDate;
	}
	if (!existingRecord.completedBy && completedBy) updates.completedBy = completedBy;
	if (!existingRecord.completedByName && (completedByName || suggestion.completedByName)) {
		updates.completedByName = completedByName || suggestion.completedByName;
	}

	const nextNotes = appendNote(existingRecord.completionNotes, suggestion.completionNotes);
	if (nextNotes !== (existingRecord.completionNotes || '')) {
		updates.completionNotes = nextNotes;
	}

	const nextDeviceIds = dedupeValues([
		...(Array.isArray(existingRecord.deviceIds) ? existingRecord.deviceIds : []),
		...(suggestion.deviceIds || []),
	]);
	if (nextDeviceIds.length > (existingRecord.deviceIds || []).length) {
		updates.deviceIds = nextDeviceIds;
	}

	const nextTags = dedupeValues([
		...(Array.isArray(existingRecord.tags) ? existingRecord.tags : []),
		...(suggestion.tags || []),
	]);
	if (nextTags.length > (existingRecord.tags || []).length) {
		updates.tags = nextTags;
	}

	const nextSourceDocumentIds = dedupeValues([
		...(Array.isArray(existingRecord.sourceDocumentIds)
			? existingRecord.sourceDocumentIds
			: []),
		sourceDocument?.id,
	]);
	if (
		nextSourceDocumentIds.length >
		(existingRecord.sourceDocumentIds || []).length
	) {
		updates.sourceDocumentIds = nextSourceDocumentIds;
	}

	if (
		suggestion.financials &&
		getFinancialDisplayTotal(existingRecord.financials) === undefined
	) {
		updates.financials = suggestion.financials;
	}

	const nextAttachments = appendDocumentAttachment(
		Array.isArray(existingRecord.attachments) ? existingRecord.attachments : [],
		sourceDocument,
	);
	if (nextAttachments.length > (existingRecord.attachments || []).length) {
		updates.attachments = nextAttachments;
	}

	return updates;
};

export const PropertyKnowledgeReviewPanel: React.FC<
	PropertyKnowledgeReviewPanelProps
> = ({
	property,
	propertyDevices,
	maintenanceHistoryRecords = [],
	propertyContractors = [],
	permissions,
	subscription,
	selectedSuggestionId,
	onSelectSuggestion,
	onAddMaintenanceHistory,
	onUpdateMaintenanceHistory,
}) => {
	const feedback = useAppFeedback();
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [updateProperty] = useUpdatePropertyMutation();
	const [updateDevice] = useUpdateDeviceMutation();
	const [createDevice] = useCreateDeviceMutation();
	const [createTask] = useCreateTaskMutation();
	const accountId = String(property.accountId || property.userId || '').trim();
	const { data: propertySupplies = [] } = useGetPropertySuppliesQuery(
		{ accountId, propertyId: property.id, includeArchived: true },
		{ skip: !accountId || !property.id },
	);
	const { data: propertyKnowledgeLinks = [] } =
		useGetPropertyKnowledgeLinksQuery(
			{ accountId, propertyId: property.id },
			{ skip: !accountId || !property.id },
		);
	const [createSupply] = useCreatePropertySupplyMutation();
	const [setSupplyLinks] = useSetSupplyLinksMutation();
	const [setDocumentLinks] = useSetDocumentLinksMutation();
	const { data: queriedTasks } = useGetTasksQuery();
	const allTasks = queriedTasks || EMPTY_TASKS;
	const [createContractor] = useCreateContractorMutation();
	const [updateContractor] = useUpdateContractorMutation();
	const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(
		selectedSuggestionId || null,
	);
	const [knowledgeFieldValues, setKnowledgeFieldValues] = useState<
		Record<string, string>
	>({});
	const [knowledgeFieldReviewStatuses, setKnowledgeFieldReviewStatuses] =
		useState<Record<string, { accepted: boolean }>>({});
	const [knowledgePartValues, setKnowledgePartValues] = useState<
		Record<string, { name: string; category: string; accepted: boolean }>
	>({});
	const [knowledgeTaskValues, setKnowledgeTaskValues] = useState<
		Record<string, { title: string; description: string; accepted: boolean; matchedDeviceId?: string; pendingEquipmentSuggestionId?: string; matchedTaskId?: string; scheduleMode: TaskScheduleMode; dueDate: string }>
	>({});
	const [knowledgeEquipmentValues, setKnowledgeEquipmentValues] = useState<
		Record<string, { accepted: boolean; matchedDeviceId?: string; skipReason?: string }>
	>({});
	const [targetChoices, setTargetChoices] = useState<TargetChoices>({
		contractorMode: 'create',
		maintenanceEventMode: 'create',
	});
	const initializedSuggestionKeyRef = useRef('');
	const [expandedSectionKeys, setExpandedSectionKeys] = useState<Record<string, boolean>>({});
	const [isSaving, setIsSaving] = useState(false);
	const [propertyAddressConfirmed, setPropertyAddressConfirmed] = useState(false);
	const canUseDocumentReview = canUsePropertyKnowledgeAcquisition(
		subscription || currentUser?.subscription,
	);

	const {
		documents: propertyDocuments,
		knowledgeSuggestions: mergedKnowledgeSuggestions,
	} = usePropertyMemoryRecords(property);

	const allKnowledgeSuggestions = useMemo<PropertyKnowledgeSuggestion[]>(
		() =>
			mergedKnowledgeSuggestions.length > 0
				? [...mergedKnowledgeSuggestions].sort((a, b) => {
						const statusWeight = (status: string) =>
							status === 'pending' ? 0 : status === 'accepted' ? 1 : 2;
						const weightDelta = statusWeight(a.status) - statusWeight(b.status);
						if (weightDelta !== 0) return weightDelta;
						return (
							(new Date(b.createdAt).getTime() || 0) -
							(new Date(a.createdAt).getTime() || 0)
						);
				  })
				: [],
		[mergedKnowledgeSuggestions],
	);

	const knowledgeSuggestions = useMemo<PropertyKnowledgeSuggestion[]>(
		() =>
			allKnowledgeSuggestions.filter(
				(suggestion) => suggestion.status === 'pending',
			),
		[allKnowledgeSuggestions],
	);

	const selectedSuggestion = useMemo(
		() =>
			knowledgeSuggestions.find(
				(suggestion) => suggestion.id === activeSuggestionId,
			) || null,
		[knowledgeSuggestions, activeSuggestionId],
	);
	const getReviewedFieldValue = useCallback(
		(field: ExtractedKnowledgeField) =>
			knowledgeFieldValues[field.id] ?? field.userEditableValue ?? field.value,
		[knowledgeFieldValues],
	);

	const reviewedFieldsForTargeting = useMemo(
		() =>
			selectedSuggestion?.extractedFields.map((field) => ({
				...field,
				userEditableValue:
					knowledgeFieldValues[field.id] ?? field.userEditableValue ?? field.value,
			})) || [],
		[knowledgeFieldValues, selectedSuggestion],
	);

	const targetCandidates = useMemo(() => {
		if (!selectedSuggestion) {
			return {
				asset: undefined,
				contractor: undefined,
				maintenanceEvent: undefined,
			};
		}
		return {
			asset: findAssetTargetCandidate({
				suggestion: selectedSuggestion,
				fields: reviewedFieldsForTargeting,
				systems: propertyDevices,
			}),
			contractor: findContractorTargetCandidate({
				fields: reviewedFieldsForTargeting,
				contractors: propertyContractors,
			}),
			maintenanceEvent: findMaintenanceEventTargetCandidate({
				suggestion: selectedSuggestion,
				fields: reviewedFieldsForTargeting,
				maintenanceHistoryRecords,
			}),
		};
	}, [
		maintenanceHistoryRecords,
		propertyContractors,
		propertyDevices,
		reviewedFieldsForTargeting,
		selectedSuggestion,
	]);

	const resolvedAssetTargetId =
		targetChoices.assetId ||
		selectedSuggestion?.relatedSystemId ||
		targetCandidates.asset?.recordId;

	const selectedSystem = useMemo(() => {
		if (!resolvedAssetTargetId) return 'the related system';
		return propertyDevices.find(
			(device) => String(device.id) === String(resolvedAssetTargetId),
		);
	}, [propertyDevices, resolvedAssetTargetId]);
	const selectedSystemName = useMemo(() => {
		const system =
			typeof selectedSystem === 'string' ? null : selectedSystem;
		return system?.type || system?.assetType || (system as any)?.name || 'the related system';
	}, [selectedSystem]);

	const selectedContractor = useMemo(() => {
		if (!selectedSuggestion) return null;
		if (
			targetChoices.contractorMode === 'update' &&
			targetChoices.contractorId
		) {
			return (
				propertyContractors.find(
					(contractor: any) =>
						String(contractor?.id) === String(targetChoices.contractorId),
				) || null
			);
		}
		const contractorNameField = selectedSuggestion.extractedFields.find(
			(field) => field.fieldKey === 'contractorName',
		);
		const contractorLookup = normalizeLookupValue(
			contractorNameField ? getReviewedFieldValue(contractorNameField) : '',
		);
		if (!contractorLookup) return null;
		return (
			propertyContractors.find((contractor: any) => {
				const name = normalizeLookupValue(contractor?.name);
				const company = normalizeLookupValue(contractor?.company);
				return name === contractorLookup || company === contractorLookup;
			}) || null
		);
	}, [
		getReviewedFieldValue,
		propertyContractors,
		selectedSuggestion,
		targetChoices.contractorId,
		targetChoices.contractorMode,
	]);

	const selectedMaintenanceEvent = useMemo(() => {
		if (
			targetChoices.maintenanceEventMode !== 'update' ||
			!targetChoices.maintenanceEventId
		) {
			return null;
		}
		return (
			maintenanceHistoryRecords.find(
				(record: any) =>
					String(record?.id) === String(targetChoices.maintenanceEventId),
			) || null
		);
	}, [
		maintenanceHistoryRecords,
		targetChoices.maintenanceEventId,
		targetChoices.maintenanceEventMode,
	]);

	const selectedMemoryChangeGroups = useMemo<MemoryChangeGroup[]>(() => {
		if (!selectedSuggestion) return [];

		const groupMap = new Map<MemoryChangeGroupKey, MemoryChangeGroup>();
		const ensureGroup = (
			key: MemoryChangeGroupKey,
			config: Omit<MemoryChangeGroup, 'key' | 'fields' | 'parts'>,
		) => {
			const existing = groupMap.get(key);
			if (existing) return existing;
			const group: MemoryChangeGroup = {
				key,
				fields: [],
				parts: [],
				...config,
			};
			groupMap.set(key, group);
			return group;
		};

		const getConfigForKey = (
			key: MemoryChangeGroupKey,
		): Omit<MemoryChangeGroup, 'key' | 'fields' | 'parts'> => {
			if (key === 'asset') {
				return {
					title: selectedSystemName,
					subtitle: targetCandidates.asset
						? 'Matched Asset'
						: 'Update Asset',
					mode: 'update',
					targetCandidate: targetCandidates.asset,
				};
			}
			if (key === 'property') {
				return {
					title: property.title || 'Property',
					subtitle: 'Update Property',
					mode: 'update',
				};
			}
			if (key === 'contractor') {
				const nameField = selectedSuggestion.extractedFields.find(
					(field) => field.fieldKey === 'contractorName',
				);
				return {
					title:
						getDisplayValue(
							nameField ? getReviewedFieldValue(nameField) : selectedContractor?.name,
						) || 'Contractor',
					subtitle:
						targetChoices.contractorMode === 'update' && selectedContractor
							? 'Matched Contractor'
							: 'New Contractor',
					mode:
						targetChoices.contractorMode === 'update' && selectedContractor
							? 'update'
							: 'create',
					targetCandidate: targetCandidates.contractor,
				};
			}
			if (key === 'warranty') {
				return {
					title: 'Warranty details',
					subtitle: 'Add Warranty Information',
					mode: 'create',
				};
			}
			if (key === 'part') {
				return {
					title: 'Parts & Supplies',
					subtitle: selectedSuggestion.relatedSystemId
						? `Add to ${selectedSystemName}`
						: 'Add Parts & Supplies',
					mode: 'create',
				};
			}
			const descriptionField = selectedSuggestion.extractedFields.find(
				(field) => field.fieldKey === 'maintenanceEventDescription',
			);
			const invoiceField = selectedSuggestion.extractedFields.find(
				(field) => field.fieldKey === 'invoiceNumber',
			);
			const title =
				(descriptionField && getReviewedFieldValue(descriptionField)) ||
				(invoiceField && `Invoice ${getReviewedFieldValue(invoiceField)}`) ||
				'Maintenance Event';
			return {
				title: selectedMaintenanceEvent?.title || title,
				subtitle:
					targetChoices.maintenanceEventMode === 'update' &&
					selectedMaintenanceEvent
						? 'Matched Maintenance Event'
						: 'New Maintenance Event',
				mode:
					targetChoices.maintenanceEventMode === 'update' &&
					selectedMaintenanceEvent
						? 'update'
						: 'create',
				targetCandidate: targetCandidates.maintenanceEvent,
			};
		};

		selectedSuggestion.extractedFields.forEach((field) => {
			const key = getMemoryChangeGroupKey(field);
			ensureGroup(key, getConfigForKey(key)).fields.push(field);
		});

		if ((selectedSuggestion.suggestedParts || []).length > 0) {
			ensureGroup('part', getConfigForKey('part')).parts.push(
				...(selectedSuggestion.suggestedParts || []),
			);
		}

		const order: MemoryChangeGroupKey[] = [
			'asset',
			'property',
			'maintenance-event',
			'contractor',
			'warranty',
			'part',
		];

		return order
			.map((key) => groupMap.get(key))
			.filter((group): group is MemoryChangeGroup => Boolean(group));
	}, [
		property.title,
		selectedContractor,
		selectedMaintenanceEvent,
		selectedSuggestion,
		selectedSystemName,
		targetCandidates,
		targetChoices.contractorMode,
		targetChoices.maintenanceEventMode,
		getReviewedFieldValue,
	]);

	const getCurrentPropertyMemoryValue = (field: ExtractedKnowledgeField) => {
		if (field.targetEntity === 'system' && typeof selectedSystem !== 'string') {
			return getRecordValue(selectedSystem, field.targetField);
		}
		if (field.targetEntity === 'property') {
			return getRecordValue(property, field.targetField);
		}
		if (field.targetEntity === 'contractor') {
			return getRecordValue(selectedContractor, field.targetField);
		}
		if (
			field.targetEntity === 'maintenanceHistory' &&
			selectedMaintenanceEvent
		) {
			return getRecordValue(selectedMaintenanceEvent, field.targetField);
		}
		return '';
	};

	const getAssetTypeValueForField = (field?: ExtractedKnowledgeField) => {
		if (!selectedSuggestion) return UNKNOWN_ASSET_TYPE;
		const assetTypeField =
			field?.fieldKey === 'assetType'
				? field
				: selectedSuggestion.extractedFields.find(
						(candidate) => candidate.fieldKey === 'assetType',
				  );
		const reviewedValue = assetTypeField
			? knowledgeFieldValues[assetTypeField.id] ?? assetTypeField.value
			: '';
		return normalizeAssetType(
			reviewedValue ||
				(typeof selectedSystem === 'string'
					? ''
					: selectedSystem?.assetType || selectedSystem?.type),
		);
	};

	const renderKnowledgeFieldInput = (
		field: ExtractedKnowledgeField,
		disabled = false,
	) => {
		if (field.fieldKey === 'assetType') {
			const value = normalizeAssetType(
				knowledgeFieldValues[field.id] ?? field.value,
			);
			const options = getAssetTypeOptions();
			return (
				<FormSelect
					id={`knowledge-field-${field.id}`}
					value={value}
					disabled={disabled}
					onChange={(event) => {
						const nextAssetType = normalizeAssetType(event.target.value);
						setKnowledgeFieldValues((current) => {
							const next = {
								...current,
								[field.id]: nextAssetType,
							};
							const variantField = selectedSuggestion?.extractedFields.find(
								(candidate) => candidate.fieldKey === 'assetVariant',
							);
							if (variantField) {
								const variantOptions = getAssetVariantOptions(nextAssetType);
								const currentVariant =
									next[variantField.id] ?? variantField.value;
								next[variantField.id] = variantOptions.includes(currentVariant)
									? currentVariant
									: '';
							}
							return next;
						});
					}}>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</FormSelect>
			);
		}

		if (field.fieldKey === 'assetVariant') {
			const assetType = getAssetTypeValueForField(field);
			const variantOptions = getAssetVariantOptions(assetType);
			const value = normalizeAssetVariant(
				assetType,
				knowledgeFieldValues[field.id] ?? field.value,
			);
			return (
				<FormSelect
					id={`knowledge-field-${field.id}`}
					value={value}
					disabled={disabled || variantOptions.length === 0}
					onChange={(event) =>
						setKnowledgeFieldValues((current) => ({
							...current,
							[field.id]: normalizeAssetVariant(assetType, event.target.value),
						}))
					}>
					<option value=''>
						{variantOptions.length > 0 ? 'No subtype selected' : 'No subtype options'}
					</option>
					{variantOptions.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</FormSelect>
			);
		}

		return (
			<FormInput
				id={`knowledge-field-${field.id}`}
				disabled={disabled}
				value={knowledgeFieldValues[field.id] ?? ''}
				onChange={(event) =>
					setKnowledgeFieldValues((current) => ({
						...current,
						[field.id]: event.target.value,
					}))
				}
			/>
		);
	};

	const targetAssetRecordId = targetCandidates.asset?.recordId;
	const targetContractorRecordId = targetCandidates.contractor?.recordId;
	const targetMaintenanceEventRecordId =
		targetCandidates.maintenanceEvent?.recordId;

	useEffect(() => {
		if (!selectedSuggestionId) return;
		if (
			knowledgeSuggestions.some(
				(suggestion) => suggestion.id === selectedSuggestionId,
			)
		) {
			setActiveSuggestionId(selectedSuggestionId);
			return;
		}
		setActiveSuggestionId(null);
	}, [knowledgeSuggestions, selectedSuggestionId]);

	useEffect(() => {
		if (knowledgeSuggestions.length === 0) {
			if (activeSuggestionId) setActiveSuggestionId(null);
			return;
		}
		if (
			activeSuggestionId &&
			knowledgeSuggestions.some(
				(suggestion) => suggestion.id === activeSuggestionId,
			)
		) {
			return;
		}
		setActiveSuggestionId(knowledgeSuggestions[0].id);
	}, [activeSuggestionId, knowledgeSuggestions]);

	useEffect(() => {
		if (!selectedSuggestion) {
			initializedSuggestionKeyRef.current = '';
			setKnowledgeFieldValues({});
			setKnowledgeFieldReviewStatuses({});
			setKnowledgePartValues({});
			setKnowledgeTaskValues({});
			setKnowledgeEquipmentValues({});
			setPropertyAddressConfirmed(false);
			setTargetChoices({
				contractorMode: 'create',
				maintenanceEventMode: 'create',
			});
			return;
		}

		const initializationKey = [
			selectedSuggestion.id,
			selectedSuggestion.updatedAt || '',
			selectedSuggestion.status || '',
			targetAssetRecordId || '',
			targetContractorRecordId || '',
			targetMaintenanceEventRecordId || '',
		].join('|');

		if (initializedSuggestionKeyRef.current === initializationKey) {
			return;
		}

		initializedSuggestionKeyRef.current = initializationKey;
		setKnowledgeFieldValues(
			Object.fromEntries(
				selectedSuggestion.extractedFields.map((field) => [
					field.id,
					field.userEditableValue ?? field.value,
				]),
			),
		);
		setKnowledgeFieldReviewStatuses(
			Object.fromEntries(
				selectedSuggestion.extractedFields.map((field) => [
					field.id,
					{ accepted: field.reviewStatus !== 'rejected' },
				]),
			),
		);
		setKnowledgePartValues(
			Object.fromEntries(
				(selectedSuggestion.suggestedParts || []).map((part) => [
					part.id,
					{
						name: part.userEditableName ?? part.name,
						category: part.userEditableCategory ?? part.category,
						accepted: part.reviewStatus !== 'rejected',
					},
				]),
			),
		);
		const nextEquipmentValues = Object.fromEntries(
				(selectedSuggestion.suggestedEquipment || []).map((equipment) => {
					const matchingDevice =
						propertyDevices.find(
							(device) =>
								normalizeAssetType(device.assetType || device.type) ===
								normalizeAssetType(equipment.assetType),
						) || null;
					return [
						equipment.id,
						{
							accepted: equipment.reviewStatus !== 'rejected',
							matchedDeviceId: equipment.matchedDeviceId || matchingDevice?.id,
							skipReason: equipment.skipReason,
						},
					];
				}),
			);
		setKnowledgeEquipmentValues(nextEquipmentValues);
		setKnowledgeTaskValues(
			Object.fromEntries(
				(selectedSuggestion.suggestedTasks || []).map((task) => {
					const matchingDevice = propertyDevices.find(
						(device) =>
							normalizeAssetType(device.assetType || device.type) ===
							normalizeAssetType(task.relatedAssetType),
					);
					const matchingOpenTask = allTasks.find((candidate: any) => {
						const sameProperty = String(candidate.propertyId || candidate.property) === String(property.id);
						const active = !['Completed', 'Rejected'].includes(String(candidate.status));
						return sameProperty && active && normalizeLookupValue(candidate.title) === normalizeLookupValue(task.userEditableTitle || task.title);
					});
					const pendingEquipment = (selectedSuggestion.suggestedEquipment || []).find(
						(equipment) => normalizeAssetType(equipment.assetType) === normalizeAssetType(task.relatedAssetType),
					);
					return [
						task.id,
						{
							title: task.userEditableTitle || task.title,
							description: task.userEditableDescription || task.description,
							accepted: task.reviewStatus !== 'rejected',
							matchedDeviceId: task.matchedDeviceId || matchingDevice?.id,
							pendingEquipmentSuggestionId:
								!matchingDevice && pendingEquipment && nextEquipmentValues[pendingEquipment.id]?.accepted !== false
									? pendingEquipment.id
									: undefined,
							matchedTaskId: matchingOpenTask?.id,
							scheduleMode: task.scheduleMode || (task.dueDate ? 'scheduled' : 'unscheduled'),
							dueDate: task.dueDate || '',
						},
					];
				}),
			),
		);
		setPropertyAddressConfirmed(
			selectedSuggestion.propertyConfirmation?.status === 'confirmed',
		);
		setTargetChoices({
			assetId:
				selectedSuggestion.relatedSystemId ||
				targetAssetRecordId,
			contractorId: targetContractorRecordId,
			contractorMode: targetContractorRecordId ? 'update' : 'create',
			maintenanceEventId: targetMaintenanceEventRecordId,
			maintenanceEventMode: targetMaintenanceEventRecordId ? 'update' : 'create',
		});
	}, [
		allTasks,
		propertyDevices,
		property.id,
		selectedSuggestion,
		targetAssetRecordId,
		targetContractorRecordId,
		targetMaintenanceEventRecordId,
	]);

	const handleSelectSuggestion = (suggestionId: string) => {
		setActiveSuggestionId(suggestionId);
		onSelectSuggestion?.(suggestionId);
	};

	const activeReviewItemCount = useMemo(() => {
		if (!selectedSuggestion) return 0;
		const acceptedFieldCount = selectedSuggestion.extractedFields.filter(
			(field) => knowledgeFieldReviewStatuses[field.id]?.accepted !== false,
		).length;
		const acceptedPartCount = (selectedSuggestion.suggestedParts || []).filter(
			(part) => knowledgePartValues[part.id]?.accepted !== false,
		).length;
		const acceptedTaskCount = (selectedSuggestion.suggestedTasks || []).filter(
			(task) => knowledgeTaskValues[task.id]?.accepted !== false,
		).length;
		const acceptedEquipmentCount = (selectedSuggestion.suggestedEquipment || []).filter(
			(equipment) => knowledgeEquipmentValues[equipment.id]?.accepted !== false,
		).length;
		return acceptedFieldCount + acceptedPartCount + acceptedTaskCount + acceptedEquipmentCount;
	}, [
		knowledgeEquipmentValues,
		knowledgeFieldReviewStatuses,
		knowledgePartValues,
		knowledgeTaskValues,
		selectedSuggestion,
	]);

	const requiresPropertyAddressConfirmation =
		selectedSuggestion?.propertyConfirmation?.status === 'needs_confirmation';

	const reviewSummarySections = useMemo<ReviewSummarySection[]>(() => {
		const uniqueItems = (items: string[]) => Array.from(new Set(items));
		const newRecords = uniqueItems(
			[
				...selectedMemoryChangeGroups
				.filter((group) => group.mode === 'create' && group.key !== 'warranty')
				.map(getReviewSummaryLabel),
				...(selectedSuggestion?.suggestedTasks?.length ? ['Recommended tasks'] : []),
				...(selectedSuggestion?.suggestedEquipment?.some(
					(equipment) => !knowledgeEquipmentValues[equipment.id]?.matchedDeviceId,
				) ? ['Missing equipment'] : []),
			],
		);
		const updates = uniqueItems(
			selectedMemoryChangeGroups
				.filter((group) => group.mode === 'update' || group.key === 'warranty')
				.map(getReviewSummaryLabel),
		);
		const warnings = requiresPropertyAddressConfirmation
			? ['Property mismatch']
			: [];
		const reviewRequired =
			requiresPropertyAddressConfirmation && !propertyAddressConfirmed
				? ['Property confirmation']
				: [];

		return [
			{ title: 'New Records', items: newRecords, tone: 'success' as const },
			{ title: 'Updates', items: updates, tone: 'success' as const },
			{ title: 'Warnings', items: warnings, tone: 'warning' as const },
			{ title: 'Review Required', items: reviewRequired, tone: 'required' as const },
		].filter((section) => section.items.length > 0);
	}, [
		propertyAddressConfirmed,
		requiresPropertyAddressConfirmation,
		selectedMemoryChangeGroups,
		selectedSuggestion,
		knowledgeEquipmentValues,
	]);

	const renderTargetChoice = (group: MemoryChangeGroup) => {
		if (!group.targetCandidate) return null;

		if (group.key === 'maintenance-event') {
			const updating =
				targetChoices.maintenanceEventMode === 'update' &&
				Boolean(targetChoices.maintenanceEventId);
			return (
				<TargetChoicePanel>
					<TargetChoiceText>
						Maintley found an existing Maintenance Event that may match this document.
						<span>
							{group.targetCandidate.label} · {group.targetCandidate.reason}
						</span>
					</TargetChoiceText>
					<TargetChoiceActions>
						<button
							type='button'
							aria-pressed={updating}
							onClick={() =>
								setTargetChoices((current) => ({
									...current,
									maintenanceEventMode: 'update',
									maintenanceEventId: group.targetCandidate?.recordId,
								}))
							}>
							Update existing
						</button>
						<button
							type='button'
							aria-pressed={!updating}
							onClick={() =>
								setTargetChoices((current) => ({
									...current,
									maintenanceEventMode: 'create',
									maintenanceEventId: undefined,
								}))
							}>
							Not the same
						</button>
					</TargetChoiceActions>
				</TargetChoicePanel>
			);
		}

		if (group.key === 'contractor') {
			const updating =
				targetChoices.contractorMode === 'update' &&
				Boolean(targetChoices.contractorId);
			return (
				<TargetChoicePanel>
					<TargetChoiceText>
						Maintley found a contractor that may match this document.
						<span>
							{group.targetCandidate.label} · {group.targetCandidate.reason}
						</span>
					</TargetChoiceText>
					<TargetChoiceActions>
						<button
							type='button'
							aria-pressed={updating}
							onClick={() =>
								setTargetChoices((current) => ({
									...current,
									contractorMode: 'update',
									contractorId: group.targetCandidate?.recordId,
								}))
							}>
							Update existing
						</button>
						<button
							type='button'
							aria-pressed={!updating}
							onClick={() =>
								setTargetChoices((current) => ({
									...current,
									contractorMode: 'create',
									contractorId: undefined,
								}))
							}>
							Not the same
						</button>
					</TargetChoiceActions>
				</TargetChoicePanel>
			);
		}

		if (group.key === 'asset') {
			return (
				<TargetChoicePanel>
					<TargetChoiceText>
						Maintley will apply these details to the matched asset.
						<span>
							{group.targetCandidate.label} · {group.targetCandidate.reason}
						</span>
					</TargetChoiceText>
				</TargetChoicePanel>
			);
		}

		return null;
	};

	const getGroupSections = (group: MemoryChangeGroup): MemoryChangeSection[] => {
		const sectionMap = new Map<MemorySectionKey, MemoryChangeSection>();
		const ensureSection = (key: MemorySectionKey) => {
			const existing = sectionMap.get(key);
			if (existing) return existing;
			const section: MemoryChangeSection = {
				key,
				title: SECTION_LABELS[key],
				fields: [],
				parts: [],
			};
			sectionMap.set(key, section);
			return section;
		};

		group.fields.forEach((field) => {
			ensureSection(getFieldSectionKey(field)).fields.push(field);
		});
		if (group.parts.length > 0) {
			ensureSection('parts').parts.push(...group.parts);
		}

		return SECTION_ORDER.map((key) => sectionMap.get(key)).filter(
			(section): section is MemoryChangeSection => Boolean(section),
		);
	};

	const getSectionKey = (group: MemoryChangeGroup, section: MemoryChangeSection) =>
		`${selectedSuggestion?.id || 'suggestion'}:${group.key}:${section.key}`;

	const getSectionAcceptedCount = (section: MemoryChangeSection) => {
		const acceptedFields = section.fields.filter(
			(field) => knowledgeFieldReviewStatuses[field.id]?.accepted !== false,
		).length;
		const acceptedParts = section.parts.filter(
			(part) => knowledgePartValues[part.id]?.accepted !== false,
		).length;
		return acceptedFields + acceptedParts;
	};

	const getSectionItemCount = (section: MemoryChangeSection) =>
		section.fields.length + section.parts.length;

	const getGroupAcceptedCount = (group: MemoryChangeGroup) =>
		getGroupSections(group).reduce(
			(sum, section) => sum + getSectionAcceptedCount(section),
			0,
		);

	const getGroupItemCount = (group: MemoryChangeGroup) =>
		group.fields.length + group.parts.length;

	const getGroupSummaryItems = (group: MemoryChangeGroup) => {
		const acceptedCount = getGroupAcceptedCount(group);
		const itemCount = getGroupItemCount(group);
		const sectionNames = getGroupSections(group)
			.map((section) => section.title)
			.join(', ');
		return [
			`${acceptedCount} of ${itemCount} accepted`,
			sectionNames,
		].filter(Boolean);
	};

	const getFieldSummaryText = (field: ExtractedKnowledgeField) => {
		const currentValue = getCurrentPropertyMemoryValue(field);
		const proposedValue = getReviewedFieldValue(field);
		const changeKind = getChangeKind(currentValue, proposedValue);
		return `${field.label}: ${changeKind}`;
	};

	const renderObjectSummary = (group: MemoryChangeGroup) => {
		const summaryItems = getGroupSummaryItems(group);
		return (
			<ObjectSummaryRow>
				{summaryItems.map((item) => (
					<ObjectSummaryPill key={item}>{item}</ObjectSummaryPill>
				))}
			</ObjectSummaryRow>
		);
	};

	const renderMemoryChangeField = (field: ExtractedKnowledgeField) => {
		const fieldAccepted =
			knowledgeFieldReviewStatuses[field.id]?.accepted !== false;
		const currentValue = getCurrentPropertyMemoryValue(field);
		const proposedValue = getReviewedFieldValue(field);
		const changeKind = getChangeKind(currentValue, proposedValue);

		return (
			<MemoryChangeRow key={field.id} $accepted={fieldAccepted}>
				<MemoryChangeRowHeader>
					<MemoryFieldName>{field.label}</MemoryFieldName>
					<FieldDecisionGroup>
						<button
							type='button'
							aria-pressed={fieldAccepted}
							onClick={() =>
								setKnowledgeFieldReviewStatuses((current) => ({
									...current,
									[field.id]: { accepted: true },
								}))
							}>
							Keep
						</button>
						<button
							type='button'
							aria-pressed={!fieldAccepted}
							onClick={() =>
								setKnowledgeFieldReviewStatuses((current) => ({
									...current,
									[field.id]: { accepted: false },
								}))
							}>
							Skip
						</button>
					</FieldDecisionGroup>
				</MemoryChangeRowHeader>
				<MemoryComparisonGrid>
					<MemoryValueBlock>
						<span>Current</span>
						<strong>{getDisplayValue(currentValue)}</strong>
					</MemoryValueBlock>
					<MemoryArrow aria-hidden='true'>-&gt;</MemoryArrow>
					<MemoryValueBlock $proposed>
						<span>Proposed</span>
						{renderKnowledgeFieldInput(field, !fieldAccepted)}
					</MemoryValueBlock>
				</MemoryComparisonGrid>
				<MemoryChangeMeta>
					<ChangeKindBadge $accepted={fieldAccepted}>{changeKind}</ChangeKindBadge>
					<KnowledgeConfidence $level={getConfidenceLevel(field)}>
						{getConfidenceLabel(field)}
					</KnowledgeConfidence>
					<span>{getExtractionSourceLabel(selectedSuggestion!)}</span>
				</MemoryChangeMeta>
				{isAssetClassificationField(field) && (
					<FieldDestinationText>
						Classification uses Maintley's preset asset options so future guidance can stay consistent.
					</FieldDestinationText>
				)}
			</MemoryChangeRow>
		);
	};

	const renderPartSuggestion = (part: ExtractedPartSuggestion) => (
		<KnowledgePartCard
			key={part.id}
			$accepted={knowledgePartValues[part.id]?.accepted !== false}>
			<KnowledgePartTopRow>
				<KnowledgePartTitleBlock>
					<KnowledgePartTitle>{part.label}</KnowledgePartTitle>
					<KnowledgeDestinationText>
						Adds to {selectedSystemName}
					</KnowledgeDestinationText>
					<KnowledgeConfidenceRow>
						<KnowledgeConfidence $level={getConfidenceLevel(part)}>
							{getConfidenceLabel(part)}
						</KnowledgeConfidence>
						<KnowledgeConfidenceMessage>
							{getConfidenceMessage(part)}
						</KnowledgeConfidenceMessage>
					</KnowledgeConfidenceRow>
				</KnowledgePartTitleBlock>
				<KnowledgeDecisionGroup>
					<button
						type='button'
						aria-pressed={knowledgePartValues[part.id]?.accepted !== false}
						onClick={() =>
							setKnowledgePartValues((current) => ({
								...current,
								[part.id]: {
									name: current[part.id]?.name || part.name,
									category: current[part.id]?.category || part.category,
									accepted: true,
								},
							}))
						}>
						Add
					</button>
					<button
						type='button'
						aria-pressed={knowledgePartValues[part.id]?.accepted === false}
						onClick={() =>
							setKnowledgePartValues((current) => ({
								...current,
								[part.id]: {
									name: current[part.id]?.name || part.name,
									category: current[part.id]?.category || part.category,
									accepted: false,
								},
							}))
						}>
						Skip
					</button>
				</KnowledgeDecisionGroup>
			</KnowledgePartTopRow>
			<KnowledgePartEditGrid>
				<FormInput
					id={`knowledge-part-${part.id}`}
					aria-label={`${part.label} name`}
					disabled={knowledgePartValues[part.id]?.accepted === false}
					value={knowledgePartValues[part.id]?.name ?? ''}
					onChange={(event) =>
						setKnowledgePartValues((current) => ({
							...current,
							[part.id]: {
								name: event.target.value,
								category: current[part.id]?.category || part.category,
								accepted: current[part.id]?.accepted !== false,
							},
						}))
					}
				/>
				<FormSelect
					aria-label={`${part.label} category`}
					disabled={knowledgePartValues[part.id]?.accepted === false}
					value={knowledgePartValues[part.id]?.category || part.category}
					onChange={(event) =>
						setKnowledgePartValues((current) => ({
							...current,
							[part.id]: {
								name: current[part.id]?.name || part.name,
								category: event.target.value,
								accepted: current[part.id]?.accepted !== false,
							},
						}))
					}>
					{PART_CATEGORY_OPTIONS.map((category) => (
						<option key={category} value={category}>
							{category}
						</option>
					))}
				</FormSelect>
			</KnowledgePartEditGrid>
			{part.sourceText && (
				<KnowledgeSourceText>Source text: {part.sourceText}</KnowledgeSourceText>
			)}
		</KnowledgePartCard>
	);

	const renderEquipmentSuggestion = (
		equipment: PropertyKnowledgeEquipmentSuggestion,
	) => {
		const values = knowledgeEquipmentValues[equipment.id];
		const accepted = values?.accepted !== false;
		const matchingDevices = propertyDevices.filter(
			(device) =>
				normalizeAssetType(device.assetType || device.type) ===
				normalizeAssetType(equipment.assetType),
		);
		return (
			<ReviewCandidateCard key={equipment.id} $accepted={accepted}>
				<MemoryChangeRowHeader>
					<div>
						<KnowledgePartTitle>{equipment.label}</KnowledgePartTitle>
						<KnowledgeDestinationText>
							{!accepted
								? `Skipped${values?.skipReason ? `: ${values.skipReason}` : ''}`
								: values?.matchedDeviceId
									? 'Match existing equipment'
									: 'Add new equipment'}
						</KnowledgeDestinationText>
					</div>
					<FieldDecisionGroup>
						<button type='button' aria-pressed={accepted} onClick={() =>
							setKnowledgeEquipmentValues((current) => ({
								...current,
								[equipment.id]: { ...current[equipment.id], accepted: true, skipReason: undefined },
							}))}>{values?.matchedDeviceId ? 'Use match' : 'Add new'}</button>
						<button type='button' aria-pressed={!accepted} onClick={() =>
							setKnowledgeEquipmentValues((current) => ({
								...current,
								[equipment.id]: { ...current[equipment.id], accepted: false, skipReason: current[equipment.id]?.skipReason || '' },
							}))}>Skip</button>
					</FieldDecisionGroup>
				</MemoryChangeRowHeader>
				<FormSelect
					aria-label={`${equipment.label} equipment match`}
					disabled={!accepted}
					value={values?.matchedDeviceId || ''}
					onChange={(event) =>
						setKnowledgeEquipmentValues((current) => ({
							...current,
							[equipment.id]: {
								accepted: true,
								matchedDeviceId: event.target.value || undefined,
								skipReason: undefined,
							},
						}))
					}>
					<option value=''>Add as new {equipment.label}</option>
					{matchingDevices.map((device) => (
						<option key={device.id} value={device.id}>
							{device.type || device.assetType} {device.location?.unitId ? `- ${device.location.unitId}` : ''}
						</option>
					))}
				</FormSelect>
				{!accepted && (
					<FormSelect
						aria-label={`${equipment.label} skip reason`}
						value={values?.skipReason || ''}
						onChange={(event) => setKnowledgeEquipmentValues((current) => ({
							...current,
							[equipment.id]: { ...current[equipment.id], accepted: false, skipReason: event.target.value },
						}))}>
						<option value=''>Select why this was skipped</option>
						{EQUIPMENT_SKIP_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
					</FormSelect>
				)}
				<KnowledgeConfidenceRow>
					<KnowledgeConfidence $level={getConfidenceLevel(equipment)}>
						{getConfidenceLabel(equipment)}
					</KnowledgeConfidence>
					<KnowledgeConfidenceMessage>{equipment.confidenceReason}</KnowledgeConfidenceMessage>
				</KnowledgeConfidenceRow>
				{(equipment.details?.filterSize || equipment.details?.specNotes) && (
					<KnowledgeSourceText>
						Extracted details:{' '}
						{[
							equipment.details.filterSize
								? `Filter size ${equipment.details.filterSize}`
								: '',
							equipment.details.specNotes || '',
						].filter(Boolean).join(' · ')}
					</KnowledgeSourceText>
				)}
				<KnowledgeSourceText>Report evidence: {equipment.sourceText}</KnowledgeSourceText>
			</ReviewCandidateCard>
		);
	};

	const renderTaskSuggestion = (task: PropertyKnowledgeTaskSuggestion) => {
		const values = knowledgeTaskValues[task.id];
		const accepted = values?.accepted !== false;
		const matchingOpenTasks = allTasks.filter((candidate: any) =>
			String(candidate.propertyId || candidate.property) === String(property.id) &&
			!['Completed', 'Rejected'].includes(String(candidate.status)),
		);
		const pendingEquipmentOptions = (selectedSuggestion?.suggestedEquipment || []).filter(
			(equipment) =>
				knowledgeEquipmentValues[equipment.id]?.accepted !== false &&
				!knowledgeEquipmentValues[equipment.id]?.matchedDeviceId,
		);
		return (
			<ReviewCandidateCard key={task.id} $accepted={accepted}>
				<MemoryChangeRowHeader>
					<div>
						<KnowledgePartTitle>Recommended task</KnowledgePartTitle>
						<KnowledgeDestinationText>{task.priority} priority</KnowledgeDestinationText>
					</div>
					<FieldDecisionGroup>
						<button type='button' aria-pressed={accepted} onClick={() =>
							setKnowledgeTaskValues((current) => ({
								...current,
								[task.id]: { ...current[task.id], accepted: true },
							}))}>{values?.matchedTaskId ? 'Link' : 'Create'}</button>
						<button type='button' aria-pressed={!accepted} onClick={() =>
							setKnowledgeTaskValues((current) => ({
								...current,
								[task.id]: { ...current[task.id], accepted: false },
							}))}>Skip</button>
					</FieldDecisionGroup>
				</MemoryChangeRowHeader>
				<FormInput
					aria-label='Recommended task title'
					disabled={!accepted}
					value={values?.title || task.title}
					onChange={(event) => setKnowledgeTaskValues((current) => ({
						...current,
						[task.id]: { ...current[task.id], title: event.target.value },
					}))}
				/>
				<ReviewCandidateTextarea
					aria-label='Recommended task description'
					disabled={!accepted}
					value={values?.description || task.description}
					onChange={(event) => setKnowledgeTaskValues((current) => ({
						...current,
						[task.id]: { ...current[task.id], description: event.target.value },
					}))}
				/>
				<FormSelect
					aria-label='Existing task match'
					disabled={!accepted}
					value={values?.matchedTaskId || ''}
					onChange={(event) => setKnowledgeTaskValues((current) => ({
						...current,
						[task.id]: { ...current[task.id], matchedTaskId: event.target.value || undefined },
					}))}>
					<option value=''>Create a new task</option>
					{matchingOpenTasks.map((candidate: any) => (
						<option key={candidate.id} value={candidate.id}>{candidate.title}</option>
					))}
				</FormSelect>
				<FormSelect
					aria-label='Related equipment'
					disabled={!accepted}
					value={values?.pendingEquipmentSuggestionId ? `pending:${values.pendingEquipmentSuggestionId}` : values?.matchedDeviceId || ''}
					onChange={(event) => setKnowledgeTaskValues((current) => ({
						...current,
						[task.id]: {
							...current[task.id],
							matchedDeviceId: event.target.value && !event.target.value.startsWith('pending:') ? event.target.value : undefined,
							pendingEquipmentSuggestionId: event.target.value.startsWith('pending:') ? event.target.value.slice('pending:'.length) : undefined,
						},
					}))}>
					<option value=''>No equipment selected</option>
					{propertyDevices.map((device) => (
						<option key={device.id} value={device.id}>{device.type || device.assetType}</option>
					))}
					{pendingEquipmentOptions.map((equipment) => (
						<option key={`pending-${equipment.id}`} value={`pending:${equipment.id}`}>
							{equipment.label} — will be added
						</option>
					))}
				</FormSelect>
				<FormSelect
					aria-label='Recommended task timing'
					disabled={!accepted}
					value={values?.scheduleMode || 'unscheduled'}
					onChange={(event) => {
						const scheduleMode = event.target.value as TaskScheduleMode;
						setKnowledgeTaskValues((current) => ({
							...current,
							[task.id]: {
								...current[task.id],
								scheduleMode,
								dueDate: scheduleMode === 'scheduled' ? current[task.id]?.dueDate || new Date().toISOString().split('T')[0] : '',
							},
						}));
					}}>
					<option value='scheduled'>Due date</option>
					<option value='asap'>ASAP</option>
					<option value='unscheduled'>Not scheduled</option>
				</FormSelect>
				{values?.scheduleMode === 'scheduled' && (
					<FormInput
						type='date'
						aria-label='Recommended task due date'
						disabled={!accepted}
						value={values.dueDate}
						onChange={(event) => setKnowledgeTaskValues((current) => ({
							...current,
							[task.id]: { ...current[task.id], dueDate: event.target.value, scheduleMode: event.target.value ? 'scheduled' : 'unscheduled' },
						}))}
					/>
				)}
				<KnowledgeSourceText>Report evidence: {task.sourceText}</KnowledgeSourceText>
			</ReviewCandidateCard>
		);
	};

	const renderMemorySection = (
		group: MemoryChangeGroup,
		section: MemoryChangeSection,
	) => {
		const sectionKey = getSectionKey(group, section);
		const isExpanded = expandedSectionKeys[sectionKey] || false;
		const itemCount = getSectionItemCount(section);
		const acceptedCount = getSectionAcceptedCount(section);
		const previewItems = [
			...section.fields.map(getFieldSummaryText),
			...section.parts.map((part) => part.label),
		].slice(0, 3);

		return (
			<MemorySectionRow key={section.key}>
				<MemorySectionButton
					type='button'
					aria-expanded={isExpanded}
					onClick={() =>
						setExpandedSectionKeys((current) => ({
							...current,
							[sectionKey]: !isExpanded,
						}))
					}>
					<MemorySectionMain>
						<MemorySectionTitle>{section.title}</MemorySectionTitle>
						<MemorySectionPreview>
							{previewItems.join(' · ') || 'Review suggested changes'}
						</MemorySectionPreview>
					</MemorySectionMain>
					<MemorySectionMeta>
						<span>
							{acceptedCount} of {itemCount}
						</span>
						<strong>{isExpanded ? 'Hide details' : 'Expand details'}</strong>
					</MemorySectionMeta>
				</MemorySectionButton>

				{isExpanded && (
					<MemorySectionDetail>
						{section.fields.length > 0 && (
							<MemoryChangeRows>
								{section.fields.map((field) => renderMemoryChangeField(field))}
							</MemoryChangeRows>
						)}

						{section.parts.length > 0 && (
							<MemoryPartPreviewSection>
								<KnowledgeSectionHeader>
									<div>
										<KnowledgeSectionTitle>
											Parts & supplies to add
										</KnowledgeSectionTitle>
										<KnowledgeSectionText>
											Accepted items will be added to {selectedSystemName}'s Parts & Supplies list.
										</KnowledgeSectionText>
									</div>
									<KnowledgeBulkActions>
										<button
											type='button'
											onClick={() =>
												setKnowledgePartValues((current) => {
													const next = { ...current };
													section.parts.forEach((part) => {
														next[part.id] = {
															name: next[part.id]?.name || part.name,
															category:
																next[part.id]?.category || part.category,
															accepted: true,
														};
													});
													return next;
												})
											}>
											Add all
										</button>
										<button
											type='button'
											onClick={() =>
												setKnowledgePartValues((current) => {
													const next = { ...current };
													section.parts.forEach((part) => {
														next[part.id] = {
															name: next[part.id]?.name || part.name,
															category:
																next[part.id]?.category || part.category,
															accepted: false,
														};
													});
													return next;
												})
											}>
											Skip all
										</button>
									</KnowledgeBulkActions>
								</KnowledgeSectionHeader>
								<KnowledgePartList>
									{section.parts.map((part) => renderPartSuggestion(part))}
								</KnowledgePartList>
							</MemoryPartPreviewSection>
						)}
					</MemorySectionDetail>
				)}
			</MemorySectionRow>
		);
	};

	const getAcceptedByUserId = () =>
		String((currentUser as any)?.id || property?.userId || 'unknown');

	const handleRejectSuggestion = async () => {
		if (!property?.id || !selectedSuggestion || isSaving) return;
		const rejectedSuggestion = rejectKnowledgeSuggestion(selectedSuggestion);

		setIsSaving(true);
		try {
			await Promise.all([
				updatePropertyDocumentInCollection(
					property,
					rejectedSuggestion.sourceDocumentId,
					{
						acquisitionStatus: 'reviewed',
					},
				),
				updatePropertyKnowledgeSuggestionInCollection(
					property,
					rejectedSuggestion,
				),
			]);
			await updateProperty({
				id: property.id,
				updates: {
					documents: propertyDocuments.map((document) =>
						document.id === rejectedSuggestion.sourceDocumentId
							? {
									...document,
									acquisitionStatus: 'reviewed',
							  }
							: document,
					),
					knowledgeSuggestions: mergeKnowledgeSuggestion(
						allKnowledgeSuggestions,
						rejectedSuggestion,
					),
				},
			}).unwrap();
			feedback.notify('Suggested details rejected.');
		} catch (error) {
			console.error('Error rejecting knowledge suggestion:', error);
			feedback.notify('Could not reject suggested details. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleApplySuggestion = async () => {
		if (!property?.id || !selectedSuggestion || isSaving) return;
		if (requiresPropertyAddressConfirmation && !propertyAddressConfirmed) {
			feedback.notify('Confirm this document belongs to this property before saving.');
			return;
		}
		const skippedEquipmentWithoutReason = (selectedSuggestion.suggestedEquipment || []).find(
			(equipment) =>
				knowledgeEquipmentValues[equipment.id]?.accepted === false &&
				!knowledgeEquipmentValues[equipment.id]?.skipReason,
		);
		if (skippedEquipmentWithoutReason) {
			feedback.notify(`Select why ${skippedEquipmentWithoutReason.label} is being skipped.`);
			return;
		}
		const acceptedAt = new Date().toISOString();
		const acceptedByUser = getAcceptedByUserId();
		const suggestionReadyForReview: PropertyKnowledgeSuggestion =
			requiresPropertyAddressConfirmation &&
			selectedSuggestion.propertyConfirmation
				? {
						...selectedSuggestion,
						propertyConfirmation: {
							...selectedSuggestion.propertyConfirmation,
							status: 'confirmed',
							confirmedAt: acceptedAt,
							confirmedByUser: acceptedByUser,
						},
				  }
				: selectedSuggestion;
		const acceptedSuggestion = acceptKnowledgeSuggestion(suggestionReadyForReview, {
			reviewedAt: acceptedAt,
			acceptedByUser,
			fieldValues: knowledgeFieldValues,
			fieldReviewStatuses: knowledgeFieldReviewStatuses,
			partValues: knowledgePartValues,
			taskValues: knowledgeTaskValues,
			equipmentValues: knowledgeEquipmentValues,
		});
		const suggestionForApply: PropertyKnowledgeSuggestion = {
			...acceptedSuggestion,
			...(resolvedAssetTargetId ? { relatedSystemId: resolvedAssetTargetId } : {}),
			...(targetChoices.contractorMode === 'update' && targetChoices.contractorId
				? { targetContractorId: targetChoices.contractorId }
				: {}),
			...(targetChoices.maintenanceEventMode === 'update' &&
			targetChoices.maintenanceEventId
				? { targetMaintenanceEventId: targetChoices.maintenanceEventId }
				: {}),
		};
		const result = applyAcceptedKnowledgeSuggestion({
			suggestion: suggestionForApply,
			property,
			systems: propertyDevices,
			acceptedByUser,
			acceptedAt,
		});

		setIsSaving(true);
		try {
			const linkedEquipmentIds = new Set<string>();
			const linkedTaskIds = new Set<string>();
			const linkedSupplyIds = new Set<string>();
			await Promise.all(
				result.systemUpdates.map((systemUpdate) =>
					updateDevice({
						...systemUpdate,
						analyticsSource: 'ai_suggestion',
					}).unwrap(),
				),
			);

			const suppliesByName = new Map(
				propertySupplies
					.filter((supply) => !supply.isArchived)
					.map((supply) => [normalizeLookupValue(supply.name), supply]),
			);
			for (const supplySuggestion of result.supplySuggestions) {
				const lookupName = normalizeLookupValue(supplySuggestion.draft.name);
				let supply = suppliesByName.get(lookupName);
				if (!supply) {
					supply = await createSupply({
						...supplySuggestion.draft,
						accountId,
						propertyId: property.id,
						source: 'document_review',
					}).unwrap();
					suppliesByName.set(lookupName, supply);
				}
				linkedSupplyIds.add(supply.id);
				const currentEquipmentIds = getSupplyEndpointIds(
					propertyKnowledgeLinks,
					supply.id,
					'equipment',
				);
				const currentSpaceIds = getSupplyEndpointIds(
					propertyKnowledgeLinks,
					supply.id,
					'space',
				);
				const currentTaskIds = getSupplyEndpointIds(
					propertyKnowledgeLinks,
					supply.id,
					'task',
				);
				await setSupplyLinks({
					propertyId: property.id,
					supplyId: supply.id,
					equipmentIds: Array.from(
						new Set([
							...currentEquipmentIds,
							...(supplySuggestion.equipmentId
								? [supplySuggestion.equipmentId]
								: []),
						]),
					),
					spaceIds: currentSpaceIds,
					taskIds: currentTaskIds,
				}).unwrap();
			}

			const equipmentIdsByType = new Map<string, string>();
			const equipmentIdsBySuggestion = new Map<string, string>();
			propertyDevices.forEach((device) => {
				equipmentIdsByType.set(
					normalizeAssetType(device.assetType || device.type),
					String(device.id),
				);
			});
			if (permissions?.canManageAppliances ?? true) {
				for (const equipment of result.equipmentSuggestions) {
					const selectedMatch = knowledgeEquipmentValues[equipment.id]?.matchedDeviceId;
					const previouslyCreatedMatch = propertyDevices.find((device: any) =>
						Object.values(device.propertyKnowledgeProvenance || {}).flat().some((entry: any) =>
							entry?.sourceDocumentId === result.appliedSuggestion.sourceDocumentId &&
							entry?.suggestionId === result.appliedSuggestion.id &&
							entry?.sourceText === equipment.sourceText,
						),
					);
					const equipmentMatchId = selectedMatch || previouslyCreatedMatch?.id;
					if (equipmentMatchId) {
						linkedEquipmentIds.add(String(equipmentMatchId));
						equipmentIdsByType.set(normalizeAssetType(equipment.assetType), String(equipmentMatchId));
						equipmentIdsBySuggestion.set(equipment.id, String(equipmentMatchId));
						continue;
					}
					const definition = getAssetDefinition(equipment.assetType);
					const created = await createDevice({
						analyticsSource: 'ai_suggestion',
						userId: String((currentUser as any)?.id || property.userId),
						type: normalizeAssetType(equipment.assetType),
						assetType: normalizeAssetType(equipment.assetType),
						assetVariant: normalizeAssetVariant(
							equipment.assetType,
							equipment.assetVariant,
						),
						assetCategory: definition?.category || 'other',
						knowledgePack: definition?.knowledgePack || 'generic',
						brand: '',
						model: '',
						serialNumber: '',
						filterSize: equipment.details?.filterSize || '',
						specNotes: equipment.details?.specNotes || '',
						location: { propertyId: property.id },
						status: 'Active',
						notes: `Added from ${result.appliedSuggestion.sourceDocumentName || 'a reviewed service report'}.`,
						propertyKnowledgeProvenance: {
							assetType: [{
								sourceDocumentId: result.appliedSuggestion.sourceDocumentId,
								sourceDocumentType: result.appliedSuggestion.documentType,
								extractionMethod: result.appliedSuggestion.extractionMethod,
								acceptedByUser,
								acceptedAt,
								suggestionId: result.appliedSuggestion.id,
								fieldKey: 'assetType',
								sourceText: equipment.sourceText,
							}],
							...(equipment.details?.filterSize
								? {
									filterSize: [{
										sourceDocumentId: result.appliedSuggestion.sourceDocumentId,
										sourceDocumentType: result.appliedSuggestion.documentType,
										extractionMethod: result.appliedSuggestion.extractionMethod,
										acceptedByUser,
										acceptedAt,
										suggestionId: result.appliedSuggestion.id,
										fieldKey: 'filterSize' as const,
										sourceText: equipment.sourceText,
									}],
								}
								: {}),
							...(equipment.details?.specNotes
								? {
									specNotes: [{
										sourceDocumentId: result.appliedSuggestion.sourceDocumentId,
										sourceDocumentType: result.appliedSuggestion.documentType,
										extractionMethod: result.appliedSuggestion.extractionMethod,
										acceptedByUser,
										acceptedAt,
										suggestionId: result.appliedSuggestion.id,
										sourceText: equipment.sourceText,
									}],
								}
								: {}),
						},
					}).unwrap();
					if (created?.id) {
						linkedEquipmentIds.add(String(created.id));
						equipmentIdsByType.set(
							normalizeAssetType(equipment.assetType),
							String(created.id),
						);
						equipmentIdsBySuggestion.set(equipment.id, String(created.id));
					}
				}
			}

			if (permissions?.canManageTasks ?? true) {
				for (const task of result.taskSuggestions) {
					const taskValues = knowledgeTaskValues[task.id];
					const previouslyCreatedTask = allTasks.find((candidate: any) =>
						candidate.sourceDocumentId === result.appliedSuggestion.sourceDocumentId &&
						candidate.sourceKnowledgeSuggestionId === result.appliedSuggestion.id &&
						normalizeLookupValue(candidate.title) === normalizeLookupValue(task.userEditableTitle || task.title),
					);
					const existingTaskId = taskValues?.matchedTaskId || previouslyCreatedTask?.id;
					if (existingTaskId) {
						linkedTaskIds.add(String(existingTaskId));
						continue;
					}
					const matchedDeviceId =
						taskValues?.matchedDeviceId ||
						(taskValues?.pendingEquipmentSuggestionId
							? equipmentIdsBySuggestion.get(taskValues.pendingEquipmentSuggestionId)
							: undefined) ||
						(task.relatedAssetType
							? equipmentIdsByType.get(normalizeAssetType(task.relatedAssetType))
							: undefined);
					const createdTask = await createTask({
						analyticsSource: 'ai_suggestion',
						userId: String((currentUser as any)?.id || property.userId),
						propertyId: property.id,
						property: property.id,
						propertyTitle: property.title,
						title: task.userEditableTitle || task.title,
						description: task.userEditableDescription || task.description,
						notes: [
							`Suggested from ${result.appliedSuggestion.sourceDocumentName || 'a reviewed service report'}.`,
							task.sourceText ? `Report evidence: ${task.sourceText}` : '',
						].filter(Boolean).join('\n'),
						dueDate: taskValues?.scheduleMode === 'scheduled' ? taskValues.dueDate : '',
						scheduleMode: taskValues?.scheduleMode || 'unscheduled',
						status: 'Initiated',
						priority: task.priority,
						category: 'Maintenance',
						sourceDocumentId: result.appliedSuggestion.sourceDocumentId,
						sourceKnowledgeSuggestionId: result.appliedSuggestion.id,
						...(matchedDeviceId ? { devices: [matchedDeviceId] } : {}),
					}).unwrap();
					if (createdTask?.id) linkedTaskIds.add(String(createdTask.id));
					if (matchedDeviceId) linkedEquipmentIds.add(String(matchedDeviceId));
				}
			}

			let completedBy: string | undefined;
			let completedByName: string | undefined;

			if (result.contractorSuggestion && (permissions?.canManageContractors ?? true)) {
				const contractorSuggestion = result.contractorSuggestion;
				const contractorLookup = normalizeLookupValue(contractorSuggestion.name);
				const matchingContractor =
					targetChoices.contractorMode === 'update' && targetChoices.contractorId
						? propertyContractors.find(
								(contractor: any) =>
									String(contractor?.id) === String(targetChoices.contractorId),
						  )
						: undefined;
				const fallbackMatchingContractor =
					matchingContractor ||
					(targetChoices.contractorMode === 'update'
						? propertyContractors.find((contractor: any) => {
								const name = normalizeLookupValue(contractor?.name);
								const company = normalizeLookupValue(contractor?.company);
								return (
									(contractorLookup && name === contractorLookup) ||
									(contractorLookup && company === contractorLookup)
								);
						  })
						: undefined);

				if (fallbackMatchingContractor?.id) {
					const contractorUpdates: Record<string, string> = {};
					if (!fallbackMatchingContractor.phone && contractorSuggestion.phone) {
						contractorUpdates.phone = contractorSuggestion.phone;
					}
					if (!fallbackMatchingContractor.company && contractorSuggestion.company) {
						contractorUpdates.company = contractorSuggestion.company;
					}
					if (!fallbackMatchingContractor.category && contractorSuggestion.category) {
						contractorUpdates.category = contractorSuggestion.category;
					}
					if (!fallbackMatchingContractor.website && contractorSuggestion.website) {
						contractorUpdates.website = contractorSuggestion.website;
					}
					const nextNotes = appendNote(
						fallbackMatchingContractor.notes,
						contractorSuggestion.notes,
					);
					if (nextNotes !== (fallbackMatchingContractor.notes || '')) {
						contractorUpdates.notes = nextNotes;
					}
					if (Object.keys(contractorUpdates).length > 0) {
						await updateContractor({
							contractorId: fallbackMatchingContractor.id,
							...contractorUpdates,
						}).unwrap();
					}
					completedBy = fallbackMatchingContractor.id;
					completedByName =
						fallbackMatchingContractor.name || contractorSuggestion.name;
				} else {
					const createdContractor = await createContractor({
						propertyId: property.id,
						name: contractorSuggestion.name,
						company: contractorSuggestion.company,
						category: contractorSuggestion.category,
						phone: contractorSuggestion.phone,
						website: contractorSuggestion.website,
						notes: contractorSuggestion.notes,
					}).unwrap();
					completedBy = createdContractor?.id;
					completedByName = createdContractor?.name || contractorSuggestion.name;
				}
			}

			if (
				result.maintenanceHistorySuggestion &&
				(permissions?.canManageMaintenanceHistory ?? true)
			) {
				const sourceDocument = propertyDocuments.find(
					(document) =>
						document.id === result.appliedSuggestion.sourceDocumentId,
				);
				if (
					targetChoices.maintenanceEventMode === 'update' &&
					targetChoices.maintenanceEventId &&
					onUpdateMaintenanceHistory
				) {
					const existingRecord = maintenanceHistoryRecords.find(
						(record: any) =>
							String(record?.id) === String(targetChoices.maintenanceEventId),
					);
					if (existingRecord) {
						const updates = buildMaintenanceHistoryUpdates({
							existingRecord,
							suggestion: result.maintenanceHistorySuggestion,
							completedBy,
							completedByName:
								completedByName ||
								result.maintenanceHistorySuggestion.completedByName,
							sourceDocument,
						});
						if (Object.keys(updates).length > 0) {
							await onUpdateMaintenanceHistory(
								targetChoices.maintenanceEventId,
								updates,
							);
						}
					}
				} else if (onAddMaintenanceHistory) {
					await onAddMaintenanceHistory({
						...result.maintenanceHistorySuggestion,
						...(completedBy ? { completedBy } : {}),
						completedByName:
							completedByName ||
							result.maintenanceHistorySuggestion.completedByName,
						...(sourceDocument?.fileUrl || sourceDocument?.url
							? {
									completionFileData: {
										url: sourceDocument.fileUrl || sourceDocument.url,
										name: sourceDocument.fileName || sourceDocument.name,
										size: sourceDocument.size || 0,
										type: sourceDocument.type || 'application/octet-stream',
										usage: 'document',
										uploadedAt: sourceDocument.uploadedAt,
									},
							  }
							: {}),
					});
				}
			}

			const appliedSourceDocument = propertyDocuments.find(
				(document) =>
					document.id === result.appliedSuggestion.sourceDocumentId,
			);
			const currentDocumentConnections = appliedSourceDocument
				? getPropertyDocumentConnections(
						appliedSourceDocument,
						propertyKnowledgeLinks,
				  )
				: {
						equipmentIds: [],
						spaceIds: [],
						taskIds: [],
						supplyIds: [],
				  };

			await Promise.all([
				updatePropertyDocumentInCollection(
					property,
					result.appliedSuggestion.sourceDocumentId,
					{
						acquisitionStatus: 'applied',
						links: {
							...(propertyDocuments.find(
								(document) => document.id === result.appliedSuggestion.sourceDocumentId,
							)?.links || {}),
							assetIds: Array.from(new Set([
								...(propertyDocuments.find(
									(document) => document.id === result.appliedSuggestion.sourceDocumentId,
								)?.links?.assetIds || []),
								...linkedEquipmentIds,
							])),
							taskIds: Array.from(new Set([
								...(propertyDocuments.find(
									(document) => document.id === result.appliedSuggestion.sourceDocumentId,
								)?.links?.taskIds || []),
								...linkedTaskIds,
							])),
							supplyIds: Array.from(new Set([
								...(propertyDocuments.find(
									(document) => document.id === result.appliedSuggestion.sourceDocumentId,
								)?.links?.supplyIds || []),
								...linkedSupplyIds,
							])),
						},
					},
				),
				updatePropertyKnowledgeSuggestionInCollection(
					property,
					result.appliedSuggestion,
				),
			]);
			await updateProperty({
				id: property.id,
				updates: {
					...result.propertyUpdates,
					documents: propertyDocuments.map((document) =>
						document.id === result.appliedSuggestion.sourceDocumentId
							? {
									...document,
									acquisitionStatus: 'applied',
									links: {
										...(document.links || {}),
										assetIds: Array.from(new Set([
											...(document.links?.assetIds || []),
											...linkedEquipmentIds,
										])),
									taskIds: Array.from(new Set([
											...(document.links?.taskIds || []),
										...linkedTaskIds,
									])),
									supplyIds: Array.from(new Set([
										...(document.links?.supplyIds || []),
										...linkedSupplyIds,
									])),
									},
							  }
							: document,
					),
					knowledgeSuggestions: mergeKnowledgeSuggestion(
						allKnowledgeSuggestions,
						result.appliedSuggestion,
					),
				},
			}).unwrap();
			await setDocumentLinks({
				propertyId: property.id,
				documentId: result.appliedSuggestion.sourceDocumentId,
				equipmentIds: Array.from(
					new Set([
						...currentDocumentConnections.equipmentIds,
						...linkedEquipmentIds,
					]),
				),
				spaceIds: currentDocumentConnections.spaceIds,
				taskIds: Array.from(
					new Set([
						...currentDocumentConnections.taskIds,
						...linkedTaskIds,
					]),
				),
				supplyIds: Array.from(
					new Set([
						...currentDocumentConnections.supplyIds,
						...linkedSupplyIds,
					]),
				),
			}).unwrap();
			try {
				const sourceDocument = propertyDocuments.find(
					(document) =>
						document.id === result.appliedSuggestion.sourceDocumentId,
				);
				const accountId =
					String((property as any).accountId || '').trim() ||
					String(property.userId || '').trim() ||
					String((currentUser as any)?.accountId || '').trim() ||
					String((currentUser as any)?.id || '').trim();
				if (accountId) {
					const importedCount = getPropertyKnowledgeSuggestionCount(
						result.appliedSuggestion,
					);
					await publishMaintleyEvent({
						accountId,
						propertyId: property.id,
						relatedDocumentId: result.appliedSuggestion.sourceDocumentId,
						type: 'knowledge_imported',
						workflowKey: 'property-knowledge-acquisition',
						entityKey: `document:${result.appliedSuggestion.sourceDocumentId}`,
						title: 'Knowledge imported',
						message: `Maintley saved ${importedCount} reviewed detail${importedCount === 1 ? '' : 's'} from ${sourceDocument?.fileName || sourceDocument?.name || 'this document'}.`,
						status: 'completed',
						priority: 'normal',
						actionLabel: 'View property',
						actionUrl: `/properties/${property.id}`,
						push: true,
						metadata: {
							documentName: sourceDocument?.fileName || sourceDocument?.name,
							suggestionId: result.appliedSuggestion.id,
							importedCount,
						},
					});
				}
			} catch (eventError) {
				console.warn('Could not publish knowledge imported event:', eventError);
			}
			feedback.notify('Suggested details saved to the property record.');
		} catch (error) {
			console.error('Error applying knowledge suggestion:', error);
			feedback.notify('Could not save suggested details. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	if (!canUseDocumentReview) {
		return (
			<PanelShell>
				<PanelHeader>
					<div>
						<PanelTitle>Suggested Details</PanelTitle>
						<PanelText>
							Upload documents on any plan. Homeowner+ can review those documents
							for details you can approve into Property Memory.
						</PanelText>
					</div>
				</PanelHeader>
				<DocumentReviewUpgradeState>
					<UpgradeEyebrow>Available with Homeowner+</UpgradeEyebrow>
					<h3>Turn documents into reviewed property memory.</h3>
					<p>
						Maintley can review invoices, warranties, manuals, and inspection
						reports for details such as model numbers, install dates, warranty
						terms, contractors, maintenance history, parts, and costs.
					</p>
					<UpgradeExampleGrid>
						<span>Invoice totals</span>
						<span>Warranty details</span>
						<span>Contractors</span>
						<span>Maintenance history</span>
						<span>Parts & supplies</span>
						<span>Equipment details</span>
					</UpgradeExampleGrid>
					<UpgradeButton type='button' onClick={() => navigate('/paywall')}>
						Explore Homeowner+
					</UpgradeButton>
				</DocumentReviewUpgradeState>
			</PanelShell>
		);
	}

	if (knowledgeSuggestions.length === 0) {
		return (
			<PanelShell>
				<PanelHeader>
					<div>
						<PanelTitle>Suggested Details</PanelTitle>
						<PanelText>
							Maintley reviews uploaded documents for information that can strengthen your property's memory and improve future recommendations.
						</PanelText>
					</div>
				</PanelHeader>
				<EmptyState>
					<h3>Turn property documents into useful records.</h3>
					<p>
						Upload manuals, invoices, warranties, or inspection reports. Maintley can identify equipment details, completed service, and recommended next steps.
					</p>
					<p>
						You review every suggestion before anything is added to your property record.
					</p>
					<EmptyExamples>
						<span>Maintley can identify:</span>
						<ul>
							<li>Manufacturer</li>
							<li>Model</li>
							<li>Install date</li>
							<li>Warranty</li>
							<li>Contractor</li>
							<li>Maintenance history</li>
							<li>Parts & supplies</li>
							<li>Costs</li>
						</ul>
					</EmptyExamples>
				</EmptyState>
			</PanelShell>
		);
	}

	return (
		<PanelShell>
			<PanelHeader>
				<div>
					<PanelTitle>Suggested Details</PanelTitle>
					<PanelText>
						Maintley found possible details in your documents. Review suggestions before saving them to Property Memory.
					</PanelText>
				</div>
			</PanelHeader>

			<ReviewLayout>
				<SuggestionList aria-label='Suggested details'>
					{knowledgeSuggestions.map((suggestion) => {
						const count = getPropertyKnowledgeSuggestionCount(suggestion);
						const isActive = suggestion.id === selectedSuggestion?.id;
						const destinations = getUniqueDestinationLabels(suggestion);
						return (
							<SuggestionListItem
								key={suggestion.id}
								type='button'
								$active={isActive}
								onClick={() => handleSelectSuggestion(suggestion.id)}>
								<SuggestionItemTopRow>
									<SuggestionName>
										{suggestion.sourceDocumentName || 'Document suggestion'}
									</SuggestionName>
									<StatusBadge $status={suggestion.status}>
										{getStatusLabel(suggestion.status)}
									</StatusBadge>
								</SuggestionItemTopRow>
								<SuggestionMeta>
									{count} suggested detail{count === 1 ? '' : 's'} · {formatSuggestionDate(suggestion.createdAt)}
								</SuggestionMeta>
								{destinations.length > 0 && (
									<SuggestionDestinationList>
										{destinations.slice(0, 3).map((destination) => (
											<DestinationChip key={destination}>
												{destination}
											</DestinationChip>
										))}
										{destinations.length > 3 && (
											<DestinationChip>
												+{destinations.length - 3}
											</DestinationChip>
										)}
									</SuggestionDestinationList>
								)}
							</SuggestionListItem>
						);
					})}
				</SuggestionList>

				<ReviewDetail>
					{selectedSuggestion ? (
						<>
							<DetailHeader>
								<div>
									<DetailTitle>
										{selectedSuggestion.sourceDocumentName || 'Review suggested details'}
									</DetailTitle>
									<DetailText>
										Review suggestions before saving. Maintley may not identify every detail correctly.
									</DetailText>
								</div>
								<StatusBadge $status={selectedSuggestion.status}>
									{getStatusLabel(selectedSuggestion.status)}
								</StatusBadge>
							</DetailHeader>

							{getPropertyKnowledgeSuggestionCount(selectedSuggestion) ===
							0 ? (
								<KnowledgeEmptyState>
									Maintley did not find structured details in this document yet. You can keep the document attached and review it again later.
								</KnowledgeEmptyState>
							) : (
								<>
									{reviewSummarySections.length > 0 && (
										<ReviewSummaryPanel aria-label='Review summary'>
											<ReviewSummaryTitle>Review Summary</ReviewSummaryTitle>
											<ReviewSummaryGrid>
												{reviewSummarySections.map((section) => (
													<ReviewSummaryGroup key={section.title}>
														<ReviewSummaryGroupTitle>
															{section.title}
														</ReviewSummaryGroupTitle>
														<ReviewSummaryList>
															{section.items.map((item) => (
																<ReviewSummaryItem
																	key={item}
																	$tone={section.tone}>
																	<ReviewSummaryIcon
																		aria-hidden='true'
																		$tone={section.tone}>
																		{section.tone === 'success' ? '✓' : '!'}
																	</ReviewSummaryIcon>
																	<span>{item}</span>
																</ReviewSummaryItem>
															))}
														</ReviewSummaryList>
													</ReviewSummaryGroup>
												))}
											</ReviewSummaryGrid>
										</ReviewSummaryPanel>
									)}
									<MemoryReviewIntro>
										Review what will change in this property's records if you save these suggestions.
									</MemoryReviewIntro>
									{selectedSuggestion.propertyConfirmation?.status === 'needs_confirmation' && (
										<PropertyConfirmationWarning>
											<PropertyConfirmationTitle>
												Maintley found information that may belong to another property.
											</PropertyConfirmationTitle>
											<PropertyConfirmationGrid>
												<div>
													<span>Document address</span>
													<strong>
														{selectedSuggestion.propertyConfirmation.documentAddress}
													</strong>
												</div>
												<div>
													<span>Selected property</span>
													<strong>
														{selectedSuggestion.propertyConfirmation.propertyAddress}
													</strong>
												</div>
											</PropertyConfirmationGrid>
											<PropertyConfirmationText>
												{selectedSuggestion.propertyConfirmation.reason}
											</PropertyConfirmationText>
											<PropertyConfirmationCheck>
												<input
													id={`property-confirmation-${selectedSuggestion.id}`}
													type='checkbox'
													checked={propertyAddressConfirmed}
													onChange={(event) =>
														setPropertyAddressConfirmed(event.target.checked)
													}
												/>
												<label htmlFor={`property-confirmation-${selectedSuggestion.id}`}>
													Use this document for the selected property.
												</label>
											</PropertyConfirmationCheck>
										</PropertyConfirmationWarning>
									)}
									<MemoryChangeList>
										{selectedMemoryChangeGroups.map((group) => (
											<MemoryChangeCard key={group.key}>
												<MemoryChangeCardHeader>
													<div>
														<MemoryChangeEyebrow>
															{group.subtitle}
														</MemoryChangeEyebrow>
														<MemoryChangeTitle>{group.title}</MemoryChangeTitle>
													</div>
													<MemoryModeBadge $mode={group.mode}>
														{group.mode === 'create' ? 'New record' : 'Update record'}
													</MemoryModeBadge>
												</MemoryChangeCardHeader>
												{renderObjectSummary(group)}

												{renderTargetChoice(group)}

												<MemorySectionList>
													{getGroupSections(group).map((section) =>
														renderMemorySection(group, section),
													)}
												</MemorySectionList>
											</MemoryChangeCard>
										))}
									</MemoryChangeList>
									{(selectedSuggestion.visitObservations || []).length > 0 && (
										<ObservationDetails>
											<summary>
												Report observations ({selectedSuggestion.visitObservations?.length})
											</summary>
											<ObservationList>
												{(selectedSuggestion.visitObservations || []).map((observation) => (
													<li key={observation.id}>
														<strong>{observation.area}</strong>
														<span>{observation.notes || observation.status}</span>
													</li>
												))}
											</ObservationList>
										</ObservationDetails>
									)}
									{(selectedSuggestion.suggestedEquipment || []).length > 0 && (
										<ReviewCandidateSection>
											<KnowledgeSectionHeader>
												<div>
													<KnowledgeSectionTitle>Equipment mentioned</KnowledgeSectionTitle>
													<KnowledgeSectionText>
														Match equipment already in this property or approve adding a missing record.
													</KnowledgeSectionText>
												</div>
											</KnowledgeSectionHeader>
											<ReviewCandidateList>
												{(selectedSuggestion.suggestedEquipment || []).map(renderEquipmentSuggestion)}
											</ReviewCandidateList>
										</ReviewCandidateSection>
									)}
									{(selectedSuggestion.suggestedTasks || []).length > 0 && (
										<ReviewCandidateSection>
											<KnowledgeSectionHeader>
												<div>
													<KnowledgeSectionTitle>Recommended next steps</KnowledgeSectionTitle>
													<KnowledgeSectionText>
												Only approved recommendations become tasks. When the report gives no timing, the task starts as Not scheduled; choose ASAP only when it genuinely needs prompt attention.
													</KnowledgeSectionText>
												</div>
											</KnowledgeSectionHeader>
											<ReviewCandidateList>
												{(selectedSuggestion.suggestedTasks || []).map(renderTaskSuggestion)}
											</ReviewCandidateList>
										</ReviewCandidateSection>
									)}
								</>
							)}

							<DetailActions>
								<KnowledgeSectionText>
									Saving will apply {activeReviewItemCount} approved detail{activeReviewItemCount === 1 ? '' : 's'}, including{' '}
									{(selectedSuggestion.suggestedTasks || []).filter((task) => knowledgeTaskValues[task.id]?.accepted !== false).length} task recommendation{(selectedSuggestion.suggestedTasks || []).filter((task) => knowledgeTaskValues[task.id]?.accepted !== false).length === 1 ? '' : 's'} and{' '}
									{(selectedSuggestion.suggestedEquipment || []).filter((equipment) => knowledgeEquipmentValues[equipment.id]?.accepted !== false).length} equipment match or addition{(selectedSuggestion.suggestedEquipment || []).filter((equipment) => knowledgeEquipmentValues[equipment.id]?.accepted !== false).length === 1 ? '' : 's'}.
								</KnowledgeSectionText>
								<SaveButton
									type='button'
									onClick={handleApplySuggestion}
									disabled={
										selectedSuggestion.status === 'applied' ||
										selectedSuggestion.status === 'rejected' ||
										getPropertyKnowledgeSuggestionCount(selectedSuggestion) ===
											0 ||
										activeReviewItemCount === 0 ||
										(requiresPropertyAddressConfirmation &&
											!propertyAddressConfirmed) ||
										isSaving
									}>
									{isSaving ? 'Saving...' : 'Save review'}
								</SaveButton>
								<RejectButton
									type='button'
									onClick={handleRejectSuggestion}
									disabled={
										selectedSuggestion.status === 'applied' ||
										selectedSuggestion.status === 'rejected' ||
										isSaving
									}>
									Reject suggestions
								</RejectButton>
							</DetailActions>
						</>
					) : (
						<KnowledgeEmptyState>
							Select a document suggestion to review.
						</KnowledgeEmptyState>
					)}
				</ReviewDetail>
			</ReviewLayout>
		</PanelShell>
	);
};

const PanelShell = styled.section`
	display: grid;
	gap: 14px;
`;

const ReviewCandidateSection = styled.section`
	display: grid;
	gap: 12px;
	margin-top: 14px;
	border: 1px solid ${COLORS.border};
	border-radius: 10px;
	background: ${COLORS.white};
	padding: 14px;
`;

const ObservationDetails = styled.details`
	margin-top: 14px;
	border: 1px solid ${COLORS.border};
	border-radius: 10px;
	background: ${COLORS.white};
	padding: 12px 14px;

	summary {
		cursor: pointer;
		font-weight: 700;
		color: ${COLORS.textPrimary};
	}
`;

const ObservationList = styled.ul`
	display: grid;
	gap: 8px;
	margin: 12px 0 0;
	padding: 0;
	list-style: none;

	li {
		display: grid;
		gap: 2px;
		padding-top: 8px;
		border-top: 1px solid ${COLORS.border};
	}

	strong {
		font-size: 0.85rem;
	}

	span {
		color: ${COLORS.textSecondary};
		font-size: 0.85rem;
		line-height: 1.4;
	}
`;

const ReviewCandidateList = styled.div`
	display: grid;
	gap: 10px;
`;

const ReviewCandidateCard = styled.div<{ $accepted: boolean }>`
	display: grid;
	gap: 10px;
	border: 1px solid ${({ $accepted }) => ($accepted ? COLORS.primaryLight : COLORS.border)};
	border-radius: 8px;
	background: ${({ $accepted }) => ($accepted ? COLORS.bgLight : COLORS.white)};
	padding: 12px;
	opacity: ${({ $accepted }) => ($accepted ? 1 : 0.72)};
`;

const ReviewCandidateTextarea = styled.textarea`
	width: 100%;
	min-height: 92px;
	box-sizing: border-box;
	resize: vertical;
	border: 1px solid ${COLORS.border};
	border-radius: 6px;
	background: ${COLORS.white};
	color: ${COLORS.textPrimary};
	font: inherit;
	font-size: 14px;
	line-height: 1.45;
	padding: 9px 10px;

	&:disabled {
		background: ${COLORS.bgLight};
		color: ${COLORS.textSecondary};
	}
`;

const PanelHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 14px;
`;

const PanelTitle = styled.h2`
	margin: 0;
	color: ${COLORS.textPrimary};
	font-size: 20px;
	line-height: 1.2;
`;

const PanelText = styled.p`
	margin: 6px 0 0;
	color: ${COLORS.textSecondary};
	font-size: 14px;
	line-height: 1.5;
	max-width: 760px;
`;

const EmptyState = styled.div`
	border: 1px solid ${COLORS.border};
	border-radius: 8px;
	background: ${COLORS.white};
	padding: 18px;
	display: grid;
	gap: 12px;

	h3 {
		margin: 0;
		color: ${COLORS.textPrimary};
		font-size: 16px;
	}

	p {
		margin: 0;
		color: ${COLORS.textSecondary};
		font-size: 14px;
		line-height: 1.5;
	}
`;

const EmptyExamples = styled.div`
	display: grid;
	gap: 8px;
	border: 1px solid ${COLORS.border};
	border-radius: 8px;
	background: ${COLORS.bgLight};
	padding: 12px;

	span {
		color: ${COLORS.gray700};
		font-size: 13px;
		font-weight: 900;
	}

	ul {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px 12px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		color: ${COLORS.gray600};
		font-size: 13px;
		font-weight: 700;
		line-height: 1.35;
	}

	li::before {
		content: '✓';
		color: ${COLORS.primaryDark};
		font-weight: 900;
		margin-right: 6px;
	}

	@media (max-width: 520px) {
		ul {
			grid-template-columns: 1fr;
		}
	}
`;

const ReviewLayout = styled.div`
	display: grid;
	grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
	gap: 14px;
	align-items: start;

	@media (max-width: 820px) {
		grid-template-columns: 1fr;
	}
`;

const DocumentReviewUpgradeState = styled.div`
	border: 1px solid #bfdbfe;
	border-radius: 10px;
	background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
	padding: 18px;
	display: grid;
	gap: 12px;

	h3 {
		margin: 0;
		color: ${COLORS.textPrimary};
		font-size: 17px;
		line-height: 1.35;
	}

	p {
		margin: 0;
		color: ${COLORS.textSecondary};
		font-size: 14px;
		line-height: 1.5;
	}
`;

const UpgradeEyebrow = styled.div`
	color: #1d4ed8;
	font-size: 12px;
	font-weight: 900;
	letter-spacing: 0;
	text-transform: uppercase;
`;

const UpgradeExampleGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 8px;

	span {
		border: 1px solid #dbeafe;
		border-radius: 999px;
		background: #ffffff;
		color: #334155;
		font-size: 12px;
		font-weight: 800;
		padding: 7px 9px;
		text-align: center;
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const UpgradeButton = styled.button`
	justify-self: start;
	border: 1px solid ${COLORS.primary};
	border-radius: 8px;
	background: ${COLORS.primary};
	color: ${COLORS.white};
	font-size: 13px;
	font-weight: 800;
	padding: 9px 12px;
	cursor: pointer;

	&:hover {
		background: ${COLORS.primaryHover};
	}

	&:focus-visible {
		outline: 2px solid ${COLORS.primary};
		outline-offset: 2px;
	}
`;

const SuggestionList = styled.div`
	display: grid;
	gap: 8px;

	@media (max-width: 820px) {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(230px, 82vw);
		overflow-x: auto;
		padding-bottom: 4px;
		scroll-snap-type: x proximity;
	}
`;

const SuggestionListItem = styled.button<{ $active: boolean }>`
	display: grid;
	gap: 5px;
	width: 100%;
	text-align: left;
	border: 1px solid ${({ $active }) => ($active ? COLORS.primaryLight : COLORS.border)};
	border-radius: 8px;
	background: ${({ $active }) => ($active ? COLORS.primaryLight : COLORS.white)};
	cursor: pointer;
	padding: 11px;

	&:hover {
		border-color: ${COLORS.primaryLight};
		background: ${COLORS.bgLight};
	}

	@media (max-width: 820px) {
		scroll-snap-align: start;
	}
`;

const SuggestionItemTopRow = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 8px;
`;

const SuggestionName = styled.div`
	color: ${COLORS.textPrimary};
	font-size: 13px;
	font-weight: 900;
	line-height: 1.35;
	overflow-wrap: anywhere;
`;

const SuggestionMeta = styled.div`
	color: ${COLORS.textSecondary};
	font-size: 12px;
	font-weight: 700;
	line-height: 1.35;
`;

const SuggestionDestinationList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 5px;
`;

const DestinationChip = styled.span`
	width: fit-content;
	border: 1px solid ${COLORS.gray300};
	border-radius: 999px;
	background: ${COLORS.white};
	color: ${COLORS.gray600};
	font-size: 11px;
	font-weight: 900;
	line-height: 1.2;
	padding: 4px 7px;
	white-space: nowrap;
`;

const StatusBadge = styled.span<{ $status?: string }>`
	width: fit-content;
	border: 1px solid
		${({ $status }) =>
			$status === 'applied'
				? COLORS.successLight
				: $status === 'rejected'
					? COLORS.errorLight
					: COLORS.infoLight};
	border-radius: 999px;
	background: ${({ $status }) =>
		$status === 'applied'
			? COLORS.successLight
			: $status === 'rejected'
				? COLORS.errorLight
				: COLORS.infoLight};
	color: ${({ $status }) =>
		$status === 'applied'
			? COLORS.successDark
			: $status === 'rejected'
				? COLORS.errorDark
				: COLORS.infoDark};
	font-size: 11px;
	font-weight: 900;
	line-height: 1.2;
	padding: 4px 7px;
	white-space: nowrap;
`;

const ReviewDetail = styled.div`
	display: grid;
	gap: 14px;
	border: 1px solid ${COLORS.border};
	border-radius: 8px;
	background: ${COLORS.white};
	padding: 14px;
	min-width: 0;
`;

const DetailHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;

	@media (max-width: 520px) {
		display: grid;
		grid-template-columns: 1fr;
	}
`;

const DetailTitle = styled.h3`
	margin: 0;
	color: ${COLORS.textPrimary};
	font-size: 16px;
	line-height: 1.3;
	overflow-wrap: anywhere;
`;

const DetailText = styled.p`
	margin: 5px 0 0;
	color: ${COLORS.textSecondary};
	font-size: 13px;
	line-height: 1.45;
`;

const KnowledgeEmptyState = styled.div`
	border: 1px solid ${COLORS.border};
	border-radius: 8px;
	background: ${COLORS.bgLight};
	color: ${COLORS.gray600};
	font-size: 13px;
	line-height: 1.45;
	padding: 12px;
`;

const ReviewSummaryPanel = styled.section`
	display: grid;
	gap: 10px;
	border: 1px solid ${COLORS.border};
	border-radius: 8px;
	background: ${COLORS.bgLight};
	padding: 12px;
`;

const ReviewSummaryTitle = styled.h4`
	margin: 0;
	color: ${COLORS.textPrimary};
	font-size: 14px;
	font-weight: 900;
	line-height: 1.3;
`;

const ReviewSummaryGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px 14px;

	@media (max-width: 620px) {
		grid-template-columns: 1fr;
	}
`;

const ReviewSummaryGroup = styled.div`
	display: grid;
	gap: 6px;
`;

const ReviewSummaryGroupTitle = styled.div`
	color: ${COLORS.textSecondary};
	font-size: 11px;
	font-weight: 900;
	letter-spacing: 0;
	text-transform: uppercase;
`;

const ReviewSummaryList = styled.ul`
	display: grid;
	gap: 5px;
	margin: 0;
	padding: 0;
	list-style: none;
`;

const ReviewSummaryItem = styled.li<{ $tone: ReviewSummaryTone }>`
	display: grid;
	grid-template-columns: 18px minmax(0, 1fr);
	align-items: start;
	gap: 6px;
	color: ${({ $tone }) =>
		$tone === 'warning' || $tone === 'required'
			? COLORS.warningDark
			: COLORS.textPrimary};
	font-size: 13px;
	font-weight: 800;
	line-height: 1.35;

	span:last-child {
		overflow-wrap: anywhere;
	}
`;

const ReviewSummaryIcon = styled.span<{ $tone: ReviewSummaryTone }>`
	display: inline-grid;
	place-items: center;
	width: 18px;
	height: 18px;
	border-radius: 999px;
	background: ${COLORS.white};
	color: ${({ $tone }) =>
		$tone === 'warning' || $tone === 'required'
			? COLORS.warningDark
			: COLORS.primaryDark};
	font-size: 12px;
	font-weight: 900;
	line-height: 1;
`;

const MemoryReviewIntro = styled.p`
	margin: 0;
	color: ${COLORS.gray600};
	font-size: 13px;
	line-height: 1.5;
`;

const PropertyConfirmationWarning = styled.div`
	display: grid;
	gap: 10px;
	border: 1px solid ${COLORS.warning};
	border-radius: 8px;
	background: ${COLORS.warningLight};
	padding: 12px;
`;

const PropertyConfirmationTitle = styled.div`
	color: ${COLORS.gray800};
	font-size: 14px;
	font-weight: 900;
	line-height: 1.35;
`;

const PropertyConfirmationGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;

	div {
		display: grid;
		gap: 4px;
		border: 1px solid rgba(217, 119, 6, 0.28);
		border-radius: 8px;
		background: ${COLORS.white};
		padding: 8px;
	}

	span {
		color: ${COLORS.textSecondary};
		font-size: 11px;
		font-weight: 900;
		text-transform: uppercase;
	}

	strong {
		color: ${COLORS.gray800};
		font-size: 13px;
		line-height: 1.35;
		overflow-wrap: anywhere;
	}

	@media (max-width: 560px) {
		grid-template-columns: 1fr;
	}
`;

const PropertyConfirmationText = styled.p`
	margin: 0;
	color: ${COLORS.gray700};
	font-size: 13px;
	line-height: 1.45;
`;

const PropertyConfirmationCheck = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 8px;
	color: ${COLORS.gray800};
	font-size: 13px;
	font-weight: 900;
	line-height: 1.35;

	input {
		margin-top: 2px;
	}

	label {
		cursor: pointer;
	}
`;

const MemoryChangeList = styled.div`
	display: grid;
	gap: 12px;
`;

const MemoryChangeCard = styled.section`
	display: grid;
	gap: 12px;
	border: 1px solid ${COLORS.border};
	border-radius: 8px;
	background: ${COLORS.white};
	padding: 12px;
`;

const MemoryChangeCardHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;

	@media (max-width: 560px) {
		display: grid;
		grid-template-columns: 1fr;
	}
`;

const MemoryChangeEyebrow = styled.div`
	color: ${COLORS.primaryDark};
	font-size: 11px;
	font-weight: 900;
	letter-spacing: 0;
	text-transform: uppercase;
`;

const MemoryChangeTitle = styled.h4`
	margin: 3px 0 0;
	color: ${COLORS.textPrimary};
	font-size: 16px;
	line-height: 1.3;
	overflow-wrap: anywhere;
`;

const MemoryModeBadge = styled.span<{ $mode: MemoryChangeMode }>`
	width: fit-content;
	border: 1px solid
		${({ $mode }) =>
			$mode === 'create' ? COLORS.primary : COLORS.primaryLight};
	border-radius: 999px;
	background: ${({ $mode }) => ($mode === 'create' ? COLORS.primaryLight : COLORS.successLight)};
	color: ${({ $mode }) => ($mode === 'create' ? COLORS.primaryDark : COLORS.successDark)};
	font-size: 11px;
	font-weight: 900;
	line-height: 1.2;
	padding: 4px 7px;
	white-space: nowrap;
`;

const ObjectSummaryRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
`;

const ObjectSummaryPill = styled.span`
	width: fit-content;
	border: 1px solid ${COLORS.border};
	border-radius: 999px;
	background: ${COLORS.bgLight};
	color: ${COLORS.gray600};
	font-size: 12px;
	font-weight: 800;
	line-height: 1.25;
	padding: 5px 8px;
`;

const TargetChoicePanel = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	border: 1px solid ${COLORS.primaryLight};
	border-radius: 8px;
	background: ${COLORS.primaryLight};
	padding: 10px;

	@media (max-width: 640px) {
		display: grid;
		grid-template-columns: 1fr;
	}
`;

const TargetChoiceText = styled.div`
	display: grid;
	gap: 4px;
	color: ${COLORS.primaryDark};
	font-size: 13px;
	font-weight: 800;
	line-height: 1.4;

	span {
		color: ${COLORS.gray600};
		font-size: 12px;
		font-weight: 700;
	}
`;

const TargetChoiceActions = styled.div`
	display: inline-flex;
	width: fit-content;
	border: 1px solid ${COLORS.primaryLight};
	border-radius: 999px;
	background: ${COLORS.white};
	padding: 2px;

	button {
		border: none;
		border-radius: 999px;
		background: transparent;
		color: ${COLORS.textSecondary};
		cursor: pointer;
		font-size: 12px;
		font-weight: 900;
		padding: 5px 10px;
		white-space: nowrap;
	}

	button[aria-pressed='true'] {
		background: ${COLORS.primaryDark};
		color: ${COLORS.white};
	}

	@media (max-width: 520px) {
		width: 100%;

		button {
			flex: 1;
		}
	}
`;

const MemorySectionList = styled.div`
	display: grid;
	gap: 8px;
`;

const MemorySectionRow = styled.div`
	border: 1px solid ${COLORS.border};
	border-radius: 8px;
	background: ${COLORS.white};
	overflow: hidden;
`;

const MemorySectionButton = styled.button`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 12px;
	align-items: center;
	width: 100%;
	border: none;
	background: ${COLORS.bgLight};
	cursor: pointer;
	padding: 10px 12px;
	text-align: left;

	&:hover {
		background: ${COLORS.borderLight};
	}

	@media (max-width: 560px) {
		grid-template-columns: 1fr;
	}
`;

const MemorySectionMain = styled.div`
	display: grid;
	gap: 3px;
	min-width: 0;
`;

const MemorySectionTitle = styled.div`
	color: ${COLORS.textPrimary};
	font-size: 13px;
	font-weight: 900;
	line-height: 1.35;
`;

const MemorySectionPreview = styled.div`
	color: ${COLORS.textSecondary};
	font-size: 12px;
	font-weight: 700;
	line-height: 1.35;
	overflow-wrap: anywhere;
`;

const MemorySectionMeta = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	justify-content: flex-end;
	color: ${COLORS.textSecondary};
	font-size: 12px;
	font-weight: 800;
	white-space: nowrap;

	strong {
		color: ${COLORS.primaryDark};
		font-size: 12px;
	}

	@media (max-width: 560px) {
		justify-content: space-between;
	}
`;

const MemorySectionDetail = styled.div`
	display: grid;
	gap: 10px;
	border-top: 1px solid ${COLORS.border};
	padding: 10px;
`;

const MemoryChangeRows = styled.div`
	display: grid;
	gap: 8px;
`;

const MemoryChangeRow = styled.div<{ $accepted: boolean }>`
	display: grid;
	gap: 8px;
	border: 1px solid ${COLORS.border};
	border-radius: 8px;
	background: ${COLORS.bgLight};
	opacity: ${({ $accepted }) => ($accepted ? 1 : 0.68)};
	padding: 10px;
`;

const MemoryChangeRowHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;

	@media (max-width: 560px) {
		align-items: flex-start;
		flex-direction: column;
	}
`;

const MemoryFieldName = styled.div`
	color: ${COLORS.textPrimary};
	font-size: 13px;
	font-weight: 900;
	line-height: 1.35;
`;

const MemoryComparisonGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) 28px minmax(0, 1fr);
	gap: 8px;
	align-items: center;

	@media (max-width: 560px) {
		grid-template-columns: 1fr;
	}
`;

const MemoryValueBlock = styled.div<{ $proposed?: boolean }>`
	display: grid;
	gap: 4px;
	min-width: 0;
	border: 1px solid ${({ $proposed }) => ($proposed ? COLORS.primaryLight : COLORS.border)};
	border-radius: 8px;
	background: ${({ $proposed }) => ($proposed ? COLORS.primaryLight : COLORS.white)};
	padding: 8px;

	span {
		color: ${COLORS.textSecondary};
		font-size: 11px;
		font-weight: 900;
		text-transform: uppercase;
	}

	strong {
		color: ${COLORS.gray700};
		font-size: 13px;
		line-height: 1.35;
		overflow-wrap: anywhere;
	}

	input,
	select {
		width: 100%;
		min-width: 0;
	}
`;

const MemoryArrow = styled.div`
	color: ${COLORS.primaryDark};
	font-size: 18px;
	font-weight: 900;
	text-align: center;

	@media (max-width: 560px) {
		display: none;
	}
`;

const MemoryChangeMeta = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
	color: ${COLORS.textSecondary};
	font-size: 11px;
	font-weight: 800;
`;

const ChangeKindBadge = styled.span<{ $accepted: boolean }>`
	width: fit-content;
	border: 1px solid ${({ $accepted }) => ($accepted ? COLORS.primaryLight : COLORS.border)};
	border-radius: 999px;
	background: ${({ $accepted }) => ($accepted ? COLORS.successLight : COLORS.white)};
	color: ${({ $accepted }) => ($accepted ? COLORS.successDark : COLORS.textSecondary)};
	font-size: 11px;
	font-weight: 900;
	line-height: 1.2;
	padding: 4px 7px;
	white-space: nowrap;
`;

const MemoryPartPreviewSection = styled.div`
	display: grid;
	gap: 10px;
	border-top: 1px solid ${COLORS.border};
	padding-top: 10px;
`;

const KnowledgeSectionHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;

	@media (max-width: 520px) {
		display: grid;
		grid-template-columns: 1fr;
	}
`;

const KnowledgeSectionTitle = styled.div`
	color: ${COLORS.textPrimary};
	font-size: 13px;
	font-weight: 900;
`;

const KnowledgeSectionText = styled.p`
	margin: 0;
	color: ${COLORS.gray600};
	font-size: 13px;
	line-height: 1.45;
`;

const KnowledgeBulkActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;

	button {
		border: 1px solid ${COLORS.infoLight};
		border-radius: 999px;
		background: ${COLORS.white};
		color: ${COLORS.infoDark};
		cursor: pointer;
		font-size: 12px;
		font-weight: 900;
		padding: 5px 9px;
	}
`;

const KnowledgePartList = styled.div`
	display: grid;
	gap: 10px;
`;

const KnowledgePartCard = styled.div<{ $accepted: boolean }>`
	display: grid;
	gap: 8px;
	border: 1px solid ${({ $accepted }) => ($accepted ? COLORS.infoLight : COLORS.border)};
	border-radius: 8px;
	background: ${({ $accepted }) => ($accepted ? COLORS.white : COLORS.bgLight)};
	opacity: ${({ $accepted }) => ($accepted ? 1 : 0.74)};
	padding: 10px;
`;

const KnowledgePartTopRow = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 10px;

	@media (max-width: 520px) {
		display: grid;
		grid-template-columns: 1fr;
	}
`;

const KnowledgePartTitleBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
`;

const KnowledgePartTitle = styled.div`
	color: ${COLORS.textPrimary};
	font-size: 13px;
	font-weight: 900;
	overflow-wrap: anywhere;
`;

const KnowledgeDestinationText = styled.div`
	color: ${COLORS.gray600};
	font-size: 12px;
	font-weight: 700;
	line-height: 1.35;
	overflow-wrap: anywhere;
`;

const KnowledgeDecisionGroup = styled.div`
	display: inline-flex;
	width: fit-content;
	border: 1px solid ${COLORS.gray300};
	border-radius: 999px;
	background: ${COLORS.white};
	padding: 2px;

	button {
		border: none;
		border-radius: 999px;
		background: transparent;
		color: ${COLORS.textSecondary};
		cursor: pointer;
		font-size: 12px;
		font-weight: 900;
		padding: 5px 10px;
	}

	button[aria-pressed='true'] {
		background: ${COLORS.primaryDark};
		color: ${COLORS.white};
	}

	@media (max-width: 520px) {
		width: 100%;

		button {
			flex: 1;
		}
	}
`;

const KnowledgePartEditGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) 150px;
	gap: 8px;

	@media (max-width: 520px) {
		grid-template-columns: 1fr;
	}
`;

const FieldDestinationText = styled.div`
	color: ${COLORS.textSecondary};
	font-size: 12px;
	font-weight: 700;
	line-height: 1.35;
`;

const FieldDecisionGroup = styled.div`
	display: inline-flex;
	width: fit-content;
	border: 1px solid ${COLORS.gray300};
	border-radius: 999px;
	background: ${COLORS.white};
	padding: 2px;

	button {
		border: none;
		border-radius: 999px;
		background: transparent;
		color: ${COLORS.textSecondary};
		cursor: pointer;
		font-size: 12px;
		font-weight: 900;
		padding: 5px 10px;
	}

	button[aria-pressed='true'] {
		background: ${COLORS.primaryDark};
		color: ${COLORS.white};
	}

	@media (max-width: 520px) {
		width: 100%;

		button {
			flex: 1;
		}
	}
`;

const KnowledgeConfidenceRow = styled.div`
	display: grid;
	gap: 3px;
`;

const KnowledgeConfidence = styled.span<{ $level?: PropertyKnowledgeConfidenceLevel }>`
	width: fit-content;
	border: 1px solid
		${({ $level }) => ($level === 'high' ? COLORS.primaryLight : COLORS.warningLight)};
	border-radius: 999px;
	background: ${({ $level }) => ($level === 'high' ? COLORS.successLight : COLORS.warningLight)};
	color: ${({ $level }) => ($level === 'high' ? COLORS.successDark : COLORS.warningDark)};
	font-size: 11px;
	font-weight: 900;
	line-height: 1.2;
	padding: 4px 7px;
	white-space: nowrap;
`;

const KnowledgeConfidenceMessage = styled.div`
	color: ${COLORS.textSecondary};
	font-size: 12px;
	font-weight: 700;
	line-height: 1.35;
	overflow-wrap: anywhere;
`;

const KnowledgeSourceText = styled.div`
	color: ${COLORS.textSecondary};
	font-size: 12px;
	line-height: 1.4;
	overflow-wrap: anywhere;
`;

const DetailActions = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
	padding-top: 4px;

	@media (max-width: 520px) {
		display: grid;
		grid-template-columns: 1fr;
	}
`;

const SaveButton = styled.button`
	border: none;
	border-radius: 8px;
	background: ${COLORS.primaryDark};
	color: ${COLORS.white};
	cursor: pointer;
	font-size: 13px;
	font-weight: 900;
	padding: 9px 12px;

	@media (max-width: 520px) {
		width: 100%;
	}

	&:disabled {
		background: ${COLORS.textMuted};
		cursor: not-allowed;
	}
`;

const RejectButton = styled.button`
	border: none;
	background: transparent;
	color: ${COLORS.errorDark};
	cursor: pointer;
	font-size: 13px;
	font-weight: 800;
	padding: 4px 0;
	text-decoration: underline;
	text-underline-offset: 3px;

	@media (max-width: 520px) {
		width: 100%;
		text-align: center;
	}

	&:disabled {
		color: ${COLORS.textMuted};
		cursor: not-allowed;
	}
`;
