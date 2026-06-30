import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import {
	FormInput,
	FormSelect,
} from 'Components/Library';
import { useUpdateDeviceMutation } from 'Redux/API/deviceSlice';
import { useUpdatePropertyMutation } from 'Redux/API/propertySlice';
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
} from 'types/PropertyKnowledge.types';
import {
	acceptKnowledgeSuggestion,
	applyAcceptedKnowledgeSuggestion,
	mergeKnowledgeSuggestion,
	rejectKnowledgeSuggestion,
} from 'propertyKnowledge/propertyKnowledgeAcquisition';
import {
	findAssetTargetCandidate,
	findContractorTargetCandidate,
	findMaintenanceEventTargetCandidate,
	type KnowledgeTargetCandidate,
} from 'propertyKnowledge/propertyKnowledgeTargeting';
import type { RoleCapabilities } from 'utils/permissions';
import { useAppFeedback } from 'Components/Library/AppFeedback/AppFeedbackProvider';
import {
	getAssetTypeOptions,
	getAssetVariantOptions,
	normalizeAssetType,
	normalizeAssetVariant,
	UNKNOWN_ASSET_TYPE,
} from 'utils/systemTypes';
import { COLORS } from '../../../constants/colors';
import { getFinancialDisplayTotal } from 'utils/financialUtils';

interface PropertyKnowledgeReviewPanelProps {
	property: Property;
	propertyDevices: Device[];
	maintenanceHistoryRecords?: any[];
	propertyContractors?: any[];
	permissions?: RoleCapabilities;
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

const getKnowledgeSuggestionCount = (suggestion?: PropertyKnowledgeSuggestion) =>
	(suggestion?.extractedFields.length || 0) +
	(suggestion?.suggestedParts?.length || 0);

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
	selectedSuggestionId,
	onSelectSuggestion,
	onAddMaintenanceHistory,
	onUpdateMaintenanceHistory,
}) => {
	const feedback = useAppFeedback();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [updateProperty] = useUpdatePropertyMutation();
	const [updateDevice] = useUpdateDeviceMutation();
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
	const [targetChoices, setTargetChoices] = useState<TargetChoices>({
		contractorMode: 'create',
		maintenanceEventMode: 'create',
	});
	const [expandedSectionKeys, setExpandedSectionKeys] = useState<Record<string, boolean>>({});
	const [isSaving, setIsSaving] = useState(false);
	const [propertyAddressConfirmed, setPropertyAddressConfirmed] = useState(false);

	const propertyDocuments = useMemo<PropertyDocument[]>(
		() => (Array.isArray((property as any)?.documents) ? (property as any).documents : []),
		[property],
	);

	const allKnowledgeSuggestions = useMemo<PropertyKnowledgeSuggestion[]>(
		() =>
			Array.isArray((property as any)?.knowledgeSuggestions)
				? [...(property as any).knowledgeSuggestions].sort((a, b) => {
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
		[property],
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
			setKnowledgeFieldValues({});
			setKnowledgeFieldReviewStatuses({});
			setKnowledgePartValues({});
			setPropertyAddressConfirmed(false);
			setTargetChoices({
				contractorMode: 'create',
				maintenanceEventMode: 'create',
			});
			return;
		}

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
		return acceptedFieldCount + acceptedPartCount;
	}, [knowledgeFieldReviewStatuses, knowledgePartValues, selectedSuggestion]);

	const requiresPropertyAddressConfirmation =
		selectedSuggestion?.propertyConfirmation?.status === 'needs_confirmation';

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
			await Promise.all(
				result.systemUpdates.map((systemUpdate) =>
					updateDevice(systemUpdate).unwrap(),
				),
			);

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

			await updateProperty({
				id: property.id,
				updates: {
					...result.propertyUpdates,
					documents: propertyDocuments.map((document) =>
						document.id === result.appliedSuggestion.sourceDocumentId
							? {
									...document,
									acquisitionStatus: 'applied',
							  }
							: document,
					),
					knowledgeSuggestions: mergeKnowledgeSuggestion(
						allKnowledgeSuggestions,
						result.appliedSuggestion,
					),
				},
			}).unwrap();
			feedback.notify('Suggested details saved to the property record.');
		} catch (error) {
			console.error('Error applying knowledge suggestion:', error);
			feedback.notify('Could not save suggested details. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

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
					<h3>Your property's memory is ready to grow.</h3>
					<p>
						Upload manuals, invoices, warranties, or inspection reports to help your property remember more over time.
					</p>
					<p>
						Maintley will identify information you can review before adding it to your property's memory. Accepted details become part of your property record and are recorded in Intelligence History.
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
						const count = getKnowledgeSuggestionCount(suggestion);
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

							{getKnowledgeSuggestionCount(selectedSuggestion) === 0 ? (
								<KnowledgeEmptyState>
									Maintley did not find structured details in this document yet. You can keep the document attached and review it again later.
								</KnowledgeEmptyState>
							) : (
								<>
									<MemoryReviewIntro>
										Review what will change in this property's records if you save these suggestions.
									</MemoryReviewIntro>
									{selectedSuggestion.propertyConfirmation?.status === 'needs_confirmation' && (
										<PropertyConfirmationWarning>
											<PropertyConfirmationTitle>
												This document may be for a different property.
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
													This document belongs to this property.
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
								</>
							)}

							<DetailActions>
								<SaveButton
									type='button'
									onClick={handleApplySuggestion}
									disabled={
										selectedSuggestion.status === 'applied' ||
										selectedSuggestion.status === 'rejected' ||
										getKnowledgeSuggestionCount(selectedSuggestion) === 0 ||
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
