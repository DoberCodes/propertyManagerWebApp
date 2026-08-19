import type {
	Device,
	Property,
	PropertyDocument,
} from '../types/Property.types';
import type { TaskFinancials } from '../types/Task.types';
import type { PropertySupplyDraft } from '../types/Supply.types';
import { getPropertySupplyTypeFromLegacyCategory } from '../utils/propertySupplies';
import type {
	ExtractedKnowledgeField,
	ExtractedPartSuggestion,
	PartKnowledgeCategory,
	PropertyKnowledgeConfidenceLevel,
	PropertyKnowledgeDocumentType,
	PropertyKnowledgeExtractionMethod,
	PropertyKnowledgeFieldKey,
	PropertyKnowledgeProvenance,
	PropertyKnowledgePropertyConfirmation,
	PropertyKnowledgeSuggestion,
	PropertyKnowledgeTargetEntity,
	PropertyKnowledgeTaskSuggestion,
	PropertyKnowledgeEquipmentSuggestion,
} from '../types/PropertyKnowledge.types';
import {
	getAssetDefinition,
	inferAssetVariantFromText,
	normalizeAssetType,
	UNKNOWN_ASSET_TYPE,
} from '../utils/systemTypes';
import { matchPartKnowledgeFromLines } from './partKnowledgeCatalog';
import { findAssetTargetCandidate } from './propertyKnowledgeTargeting';

type CreatePendingKnowledgeSuggestionInput = {
	document: PropertyDocument;
	propertyId: string;
	relatedSystemId?: string;
	property?: Property;
	systems?: Device[];
	createdAt?: string;
};

type CreateKnowledgeSuggestionFromFileInput =
	CreatePendingKnowledgeSuggestionInput & {
		file?: File;
	};

type ReviewKnowledgeSuggestionInput = {
	reviewedAt?: string;
	acceptedByUser?: string;
	fieldValues?: Record<string, string>;
	fieldReviewStatuses?: Record<string, { accepted?: boolean }>;
	partValues?: Record<
		string,
		{ name?: string; category?: string; accepted?: boolean }
	>;
	taskValues?: Record<
		string,
		{ title?: string; description?: string; accepted?: boolean; matchedDeviceId?: string }
	>;
	equipmentValues?: Record<
		string,
		{ accepted?: boolean; matchedDeviceId?: string; skipReason?: string }
	>;
};

type ApplyKnowledgeSuggestionInput = {
	suggestion: PropertyKnowledgeSuggestion;
	property: Property;
	systems: Device[];
	acceptedByUser: string;
	acceptedAt?: string;
};

type ApplyKnowledgeSuggestionResult = {
	propertyUpdates: Partial<Property>;
	systemUpdates: Array<{ id: string; updates: Partial<Device> }>;
	contractorSuggestion?: {
		name: string;
		company: string;
		category: string;
		phone: string;
		website?: string;
		notes?: string;
	};
	maintenanceHistorySuggestion?: {
		title: string;
		completionDate: string;
		completedByName?: string;
		completionNotes?: string;
		deviceIds?: string[];
		financials?: TaskFinancials;
		eventType: 'invoice_uploaded' | 'maintenance_recorded';
		eventSource: 'document_upload';
		tags?: string[];
	};
	supplySuggestions: Array<{
		draft: PropertySupplyDraft;
		equipmentId?: string;
	}>;
	taskSuggestions: PropertyKnowledgeTaskSuggestion[];
	equipmentSuggestions: PropertyKnowledgeEquipmentSuggestion[];
	appliedSuggestion: PropertyKnowledgeSuggestion;
};

type FieldDefinition = {
	label: string;
	targetEntity: PropertyKnowledgeTargetEntity;
	targetField: string;
};

type ConfidenceOptions = {
	confidenceLevel?: PropertyKnowledgeConfidenceLevel;
	confidence?: number;
	confidenceReason?: string;
};

const CONFIDENCE_SCORE_BY_LEVEL: Record<PropertyKnowledgeConfidenceLevel, number> = {
	high: 0.9,
	medium: 0.68,
	low: 0.35,
};

const CONFIDENCE_SORT_WEIGHT: Record<PropertyKnowledgeConfidenceLevel, number> = {
	high: 0,
	medium: 1,
	low: 2,
};

const getConfidenceLevel = (
	item: { confidenceLevel?: PropertyKnowledgeConfidenceLevel; confidence?: number },
): PropertyKnowledgeConfidenceLevel => {
	if (item.confidenceLevel) return item.confidenceLevel;
	if (typeof item.confidence === 'number' && item.confidence >= 0.8) return 'high';
	if (typeof item.confidence === 'number' && item.confidence < 0.5) return 'low';
	return 'medium';
};

const isVisibleConfidence = (
	item: { confidenceLevel?: PropertyKnowledgeConfidenceLevel; confidence?: number },
) => getConfidenceLevel(item) !== 'low';

const sortByConfidence = <
	T extends {
		confidenceLevel?: PropertyKnowledgeConfidenceLevel;
		confidence?: number;
		label?: string;
		fieldKey?: string;
	},
>(
	items: T[],
) =>
	[...items].sort((a, b) => {
		const levelDelta =
			CONFIDENCE_SORT_WEIGHT[getConfidenceLevel(a)] -
			CONFIDENCE_SORT_WEIGHT[getConfidenceLevel(b)];
		if (levelDelta !== 0) return levelDelta;
		return String(a.label || a.fieldKey || '').localeCompare(
			String(b.label || b.fieldKey || ''),
		);
	});

const prepareVisibleFields = (fields: ExtractedKnowledgeField[]) =>
	sortByConfidence(fields.filter(isVisibleConfidence));

const calculateSuggestionConfidence = (
	fields: ExtractedKnowledgeField[],
	parts: ExtractedPartSuggestion[] = [],
) => {
	const scores = [...fields, ...parts]
		.filter(isVisibleConfidence)
		.map((item) => item.confidence)
		.filter((confidence): confidence is number => typeof confidence === 'number');
	if (scores.length === 0) return undefined;
	return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

const FIELD_DEFINITIONS: Record<PropertyKnowledgeFieldKey, FieldDefinition> = {
	manufacturer: {
		label: 'Manufacturer',
		targetEntity: 'system',
		targetField: 'brand',
	},
	brand: { label: 'Brand', targetEntity: 'system', targetField: 'brand' },
	model: { label: 'Model', targetEntity: 'system', targetField: 'model' },
	serialNumber: {
		label: 'Serial number',
		targetEntity: 'system',
		targetField: 'serialNumber',
	},
	assetType: {
		label: 'Asset type',
		targetEntity: 'system',
		targetField: 'assetType',
	},
	assetVariant: {
		label: 'Asset variant',
		targetEntity: 'system',
		targetField: 'assetVariant',
	},
	installDate: {
		label: 'Install date',
		targetEntity: 'system',
		targetField: 'installationDate',
	},
	installer: {
		label: 'Installer',
		targetEntity: 'contractor',
		targetField: 'name',
	},
	contractorName: {
		label: 'Contractor name',
		targetEntity: 'contractor',
		targetField: 'name',
	},
	contractorPhone: {
		label: 'Contractor phone',
		targetEntity: 'contractor',
		targetField: 'phone',
	},
	contractorWebsite: {
		label: 'Contractor website',
		targetEntity: 'contractor',
		targetField: 'website',
	},
	warrantyStartDate: {
		label: 'Warranty start date',
		targetEntity: 'warranty',
		targetField: 'startDate',
	},
	warrantyEndDate: {
		label: 'Warranty end date',
		targetEntity: 'warranty',
		targetField: 'endDate',
	},
	warrantyLength: {
		label: 'Warranty length',
		targetEntity: 'warranty',
		targetField: 'length',
	},
	registrationRequired: {
		label: 'Registration required',
		targetEntity: 'warranty',
		targetField: 'registrationRequired',
	},
	invoiceNumber: {
		label: 'Invoice number',
		targetEntity: 'maintenanceHistory',
		targetField: 'invoiceNumber',
	},
	invoiceDate: {
		label: 'Invoice date',
		targetEntity: 'maintenanceHistory',
		targetField: 'invoiceDate',
	},
	paidDate: {
		label: 'Paid date',
		targetEntity: 'maintenanceHistory',
		targetField: 'paidDate',
	},
	totalCost: {
		label: 'Total cost',
		targetEntity: 'maintenanceHistory',
		targetField: 'totalCost',
	},
	laborCost: {
		label: 'Labor cost',
		targetEntity: 'maintenanceHistory',
		targetField: 'laborCost',
	},
	partsCost: {
		label: 'Parts cost',
		targetEntity: 'maintenanceHistory',
		targetField: 'partsCost',
	},
	taxAmount: {
		label: 'Tax amount',
		targetEntity: 'maintenanceHistory',
		targetField: 'taxAmount',
	},
	currency: {
		label: 'Currency',
		targetEntity: 'maintenanceHistory',
		targetField: 'currency',
	},
	maintenanceEventDate: {
		label: 'Maintenance date',
		targetEntity: 'maintenanceHistory',
		targetField: 'date',
	},
	maintenanceEventDescription: {
		label: 'Maintenance description',
		targetEntity: 'maintenanceHistory',
		targetField: 'description',
	},
	performedByName: {
		label: 'Performed by',
		targetEntity: 'maintenanceHistory',
		targetField: 'performedByName',
	},
	maintenanceType: {
		label: 'Maintenance type',
		targetEntity: 'maintenanceHistory',
		targetField: 'type',
	},
	servicePerformed: {
		label: 'Service performed',
		targetEntity: 'maintenanceHistory',
		targetField: 'servicePerformed',
	},
	recommendedMaintenanceInterval: {
		label: 'Recommended maintenance interval',
		targetEntity: 'task',
		targetField: 'recurrenceInterval',
	},
	partsReplaced: {
		label: 'Parts replaced',
		targetEntity: 'maintenanceHistory',
		targetField: 'partsReplaced',
	},
	partName: { label: 'Part name', targetEntity: 'part', targetField: 'name' },
	partNumber: {
		label: 'Part number',
		targetEntity: 'maintenanceHistory',
		targetField: 'partNumber',
	},
	filterSize: {
		label: 'Filter size',
		targetEntity: 'system',
		targetField: 'filterSize',
	},
	consumables: {
		label: 'Consumables',
		targetEntity: 'part',
		targetField: 'consumables',
	},
	lubricantType: {
		label: 'Lubricant type',
		targetEntity: 'part',
		targetField: 'lubricantType',
	},
	fluidType: {
		label: 'Fluid type',
		targetEntity: 'part',
		targetField: 'fluidType',
	},
	manualVersion: {
		label: 'Manual version',
		targetEntity: 'system',
		targetField: 'manualVersion',
	},
	publicationDate: {
		label: 'Publication date',
		targetEntity: 'system',
		targetField: 'publicationDate',
	},
	manufacturerSupportUrl: {
		label: 'Manufacturer support URL',
		targetEntity: 'system',
		targetField: 'manufacturerSupportUrl',
	},
};

const SYSTEM_FIELD_KEYS = new Set<PropertyKnowledgeFieldKey>([
	'manufacturer',
	'brand',
	'model',
	'serialNumber',
	'assetType',
	'assetVariant',
	'installDate',
	'filterSize',
	'manualVersion',
	'publicationDate',
	'manufacturerSupportUrl',
]);

const createSuggestionId = (documentId: string, createdAt: string) =>
	`pka-${documentId}-${createdAt.replace(/[^a-zA-Z0-9]/g, '')}-${Math.random()
		.toString(36)
		.slice(2, 8)}`;

const stripExtension = (name: string) => name.replace(/\.[^.]+$/, '');

const normalizeSearchText = (value?: string) =>
	String(value || '')
		.toLowerCase()
		.replace(/[_-]+/g, ' ')
		.trim();

const normalizeExtractedValue = (value?: string) =>
	String(value || '')
		.trim()
		.replace(/^[#: -]+/, '')
		.replace(/[),;]+$/, '');

const findValueAfterLabel = (text: string, labels: string[]) => {
	const labelPattern = labels.map((label) => label.replace(/\s+/g, '\\s+')).join('|');
	const match = text.match(
		new RegExp(`(?:${labelPattern})\\s*(?:#|number|no\\.?|:|-)?\\s*([a-z0-9][a-z0-9._/-]{1,32})`, 'i'),
	);
	return normalizeExtractedValue(match?.[1]);
};

const findDateAfterLabel = (text: string, labels: string[]) => {
	const labelPattern = labels.map((label) => label.replace(/\s+/g, '\\s+')).join('|');
	const match = text.match(
		new RegExp(`(?:${labelPattern})\\s*(?:date|:|-)?\\s*((?:\\d{4}-\\d{1,2}-\\d{1,2})|(?:\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}))`, 'i'),
	);
	return normalizeExtractedValue(match?.[1]);
};

const findCost = (text: string) => {
	const match = text.match(/\$\s*([0-9][0-9,]*(?:\.[0-9]{2})?)/);
	if (!match?.[1]) return '';
	return `$${match[1].replace(/,/g, '')}`;
};

const normalizeOcrText = (text: string) =>
	String(text || '')
		.replace(/\r/g, '\n')
		.replace(/[ \t]+/g, ' ')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

const OCR_VALUE_BOUNDARY_LABELS = [
	'Invoice Number',
	'Report / Invoice #',
	'Report / Invoice',
	'Invoice Date',
	'Due Date',
	'Payment Terms',
	'Service Date',
	'Bill To',
	'Service Address',
	'Service Location',
	'Job Address',
	'Work Address',
	'Installation Address',
	'Property',
	'Property Address',
	'Billing Property Address',
	'Technician',
	'System Information',
	'Equipment Type',
	'System Capacity',
	'Brand',
	'Model',
	'Serial Number (Outdoor)',
	'Serial Number (Indoor)',
	'Serial Number Outdoor',
	'Serial Number Indoor',
	'Serial Number',
	'Refrigerant',
	'Installation Date',
	'Warranty',
	'Description',
	'QTY',
	'Unit Price',
	'Amount',
	'Notes',
	'Payment Options',
	'Subtotal',
	'Tax',
	'Total Due',
	'Warranty Information',
	'Authorized By',
];

const normalizeLabelForComparison = (label: string) =>
	label.toLowerCase().replace(/[^a-z0-9]+/g, '');

const escapeLabelPattern = (label: string) =>
	label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');

const trimValueAtNextKnownLabel = (
	value: string | undefined,
	currentLabels: string[],
) => {
	const normalizedCurrentLabels = new Set(
		currentLabels.map(normalizeLabelForComparison),
	);
	const boundaryLabels = OCR_VALUE_BOUNDARY_LABELS.filter(
		(label) => !normalizedCurrentLabels.has(normalizeLabelForComparison(label)),
	);
	const boundaryPattern = boundaryLabels.map(escapeLabelPattern).join('|');
	const match = String(value || '').match(
		new RegExp(`\\s+(?:${boundaryPattern})(?:\\s*:|\\b)`, 'i'),
	);
	const trimmed = match?.index !== undefined
		? String(value || '').slice(0, match.index)
		: String(value || '');
	return normalizeExtractedValue(trimmed);
};

const findLabeledTextValue = (text: string, labels: string[]) => {
	const escapedLabels = labels.map((label) =>
		escapeLabelPattern(label),
	);
	const match = text.match(
		new RegExp(
			`(?:${escapedLabels.join('|')})\\s*:?\\s*([^\\n\\r]+)`,
			'i',
		),
	);
	return trimValueAtNextKnownLabel(match?.[1], labels);
};

const findTextBetween = (text: string, startLabel: string, endLabels: string[]) => {
	const escapedStart = startLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const escapedEnds = endLabels.map((label) =>
		label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
	);
	const match = text.match(
		new RegExp(
			`${escapedStart}\\s*:?\\s*([\\s\\S]*?)(?:${escapedEnds.join('|')})`,
			'i',
		),
	);
	return normalizeExtractedValue(match?.[1]?.replace(/\s+/g, ' '));
};

const findMoneyAfterTextLabel = (text: string, labels: string[]) => {
	const escapedLabels = labels.map((label) =>
		label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'),
	);
	const match = text.match(
		new RegExp(
			`(?:${escapedLabels.join('|')})[^\\n\\r$]*\\$\\s*([0-9][0-9,]*(?:\\.[0-9]{2})?)`,
			'i',
		),
	);
	if (!match?.[1]) return '';
	return `$${match[1].replace(/,/g, '')}`;
};

const findPhoneNumber = (text: string) => {
	const match = text.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
	return normalizeExtractedValue(match?.[0]);
};

const findWebsite = (text: string) => {
	const match = text.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?/i);
	return normalizeExtractedValue(match?.[0]);
};

const PROPERTY_LOCATION_ADDRESS_LABELS = [
	'Service Address',
	'Service Location',
	'Job Address',
	'Work Address',
	'Installation Address',
	'Property',
	'Property Address',
	'Billing Property Address',
];

type NormalizedAddress = {
	streetNumber?: string;
	streetName?: string;
	unit?: string;
	state?: string;
	postalCode?: string;
};

const normalizeAddressTokenText = (value?: string) =>
	String(value || '')
		.toLowerCase()
		.replace(/\b(street)\b/g, 'st')
		.replace(/\b(road)\b/g, 'rd')
		.replace(/\b(avenue)\b/g, 'ave')
		.replace(/\b(drive)\b/g, 'dr')
		.replace(/\b(lane)\b/g, 'ln')
		.replace(/\b(boulevard)\b/g, 'blvd')
		.replace(/\b(court)\b/g, 'ct')
		.replace(/\b(circle)\b/g, 'cir')
		.replace(/\b(place)\b/g, 'pl')
		.replace(/\b(north)\b/g, 'n')
		.replace(/\b(south)\b/g, 's')
		.replace(/\b(east)\b/g, 'e')
		.replace(/\b(west)\b/g, 'w')
		.replace(/[^a-z0-9#\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const normalizeAddressForComparison = (value?: string): NormalizedAddress => {
	const normalized = normalizeAddressTokenText(value);
	const streetNumber = normalized.match(/\b\d{1,8}\b/)?.[0];
	const statePostalMatch = normalized.match(/\b([a-z]{2})\s+(\d{5})(?:\s*\d{4})?\b/);
	const state = statePostalMatch?.[1]?.toUpperCase();
	const postalCode = statePostalMatch?.[2];
	const unit = normalized.match(
		/\b(?:apt|apartment|unit|suite|ste|#)\s*([a-z0-9-]+)\b/i,
	)?.[1];
	let streetName = '';

	if (streetNumber) {
		const numberIndex = normalized.indexOf(streetNumber);
		const afterNumber = normalized.slice(numberIndex + streetNumber.length);
		streetName = afterNumber
			.replace(/\b(?:apt|apartment|unit|suite|ste|#)\b.*$/i, '')
			.replace(/\b[a-z]{2}\s+\d{5}.*$/i, '')
			.replace(/\b\d{5}(?:\s*\d{4})?\b.*$/i, '')
			.trim();
	}

	return {
		...(streetNumber ? { streetNumber } : {}),
		...(streetName ? { streetName } : {}),
		...(unit ? { unit } : {}),
		...(state ? { state } : {}),
		...(postalCode ? { postalCode } : {}),
	};
};

const getStreetCoreTokens = (streetName?: string) =>
	normalizeAddressTokenText(streetName)
		.split(/\s+/)
		.filter(Boolean)
		.filter(
			(token) =>
				![
					'st',
					'rd',
					'ave',
					'dr',
					'ln',
					'blvd',
					'ct',
					'cir',
					'pl',
					'n',
					's',
					'e',
					'w',
				].includes(token),
		);

const doStreetNamesMatch = (left?: string, right?: string) => {
	const leftTokens = getStreetCoreTokens(left);
	const rightTokens = getStreetCoreTokens(right);
	if (leftTokens.length === 0 || rightTokens.length === 0) return true;
	return leftTokens[0] === rightTokens[0];
};

const isKnownAddressBoundaryLine = (line: string) => {
	const normalizedLine = normalizeLabelForComparison(line.replace(/:.+$/, ''));
	return OCR_VALUE_BOUNDARY_LABELS.some(
		(label) => normalizeLabelForComparison(label) === normalizedLine,
	);
};

const extractLabeledPropertyAddress = (rawText: string) => {
	const text = normalizeOcrText(rawText);
	const lines = text
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		for (const label of PROPERTY_LOCATION_ADDRESS_LABELS) {
			const labelPattern = new RegExp(`^${escapeLabelPattern(label)}\\s*:?\\s*(.*)$`, 'i');
			const match = line.match(labelPattern);
			if (!match) continue;

			const parts = [trimValueAtNextKnownLabel(match[1], [label])].filter(Boolean);
			for (
				let nextIndex = index + 1;
				nextIndex < lines.length && parts.length < 3;
				nextIndex += 1
			) {
				const nextLine = lines[nextIndex];
				if (
					isKnownAddressBoundaryLine(nextLine) ||
					/^(invoice|description|payment|technician)\b/i.test(nextLine)
				) {
					break;
				}
				parts.push(nextLine);
				if (/\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/.test(nextLine)) {
					break;
				}
			}

			const value = normalizeExtractedValue(parts.join(', '));
			if (value) {
				return { label, value };
			}
		}
	}

	for (const label of PROPERTY_LOCATION_ADDRESS_LABELS) {
		const value = findLabeledTextValue(text, [label]);
		if (value) return { label, value };
	}

	return undefined;
};

export const buildPropertyConfirmationFromDocumentText = (
	rawText: string,
	propertyAddress?: string,
): PropertyKnowledgePropertyConfirmation | undefined => {
	const selectedPropertyAddress = normalizeExtractedValue(propertyAddress);
	if (!selectedPropertyAddress) return undefined;

	const candidate = extractLabeledPropertyAddress(rawText);
	if (!candidate?.value) return undefined;

	const documentAddress = normalizeAddressForComparison(candidate.value);
	const savedAddress = normalizeAddressForComparison(selectedPropertyAddress);
	const hasComparableStreet =
		Boolean(documentAddress.streetNumber && savedAddress.streetNumber) &&
		Boolean(documentAddress.streetName && savedAddress.streetName);
	if (!hasComparableStreet) return undefined;

	const conflicts: string[] = [];
	if (
		documentAddress.streetNumber &&
		savedAddress.streetNumber &&
		documentAddress.streetNumber !== savedAddress.streetNumber
	) {
		conflicts.push('street number');
	}
	if (
		documentAddress.streetName &&
		savedAddress.streetName &&
		!doStreetNamesMatch(documentAddress.streetName, savedAddress.streetName)
	) {
		conflicts.push('street name');
	}
	if (
		documentAddress.state &&
		savedAddress.state &&
		documentAddress.state !== savedAddress.state
	) {
		conflicts.push('state');
	}
	if (
		documentAddress.postalCode &&
		savedAddress.postalCode &&
		documentAddress.postalCode !== savedAddress.postalCode
	) {
		conflicts.push('ZIP code');
	}
	if (
		documentAddress.unit &&
		savedAddress.unit &&
		documentAddress.unit !== savedAddress.unit
	) {
		conflicts.push('apartment/unit');
	}

	if (conflicts.length === 0) return undefined;

	return {
		status: 'needs_confirmation',
		documentAddress: candidate.value,
		propertyAddress: selectedPropertyAddress,
		sourceLabel: candidate.label,
		reason: `Detected ${candidate.label.toLowerCase()} conflicts with the selected property's ${conflicts.join(', ')}.`,
	};
};

const CONTRACTOR_NAME_EXCLUDE_PATTERN =
	/invoice|bill to|job address|technician|license|payment|pay online|payment options|routing|account|check by mail|authorized|warranty information|thank you|subtotal|total due|due date|service date|@|www\.|https?:|\.com|\.net|\.org|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/i;

const CONTRACTOR_NAME_INCLUDE_PATTERN =
	/(llc|inc\.?|company|contractor|hvac|heating|cooling|plumbing|electric|roofing|landscap|pest|appliance|repair)/i;

const CONTRACTOR_ENTITY_PATTERN =
	/\b(llc|inc\.?|ltd\.?|co\.?|company|contractor)\b/i;

const CONTRACTOR_TRADE_PATTERN =
	/\b(hvac|heating|cooling|plumbing|electric(?:al)?|roofing|landscap(?:e|ing)?|pest|appliance|repair)\b/i;

const CONTRACTOR_GUIDANCE_PATTERN =
	/\b(schedule|clear|after|before|each|fall|spring|summer|winter|warranty|workmanship|sealant|gutters?|storms?|coverage|maintain|maintenance|recommended?|should|must|please|within)\b/i;

const CONTRACTOR_SECTION_END_PATTERN =
	/\b(INVOICE|BILL TO|JOB ADDRESS|TECHNICIAN|SYSTEM INFORMATION|DESCRIPTION|PAYMENT OPTIONS|AUTHORIZED BY|WARRANTY INFORMATION)\b/i;

const isLikelyAddressLine = (line: string) =>
	/^\d+\s+\S+/.test(line) ||
	/\b(street|st\.?|road|rd\.?|avenue|ave\.?|drive|dr\.?|suite|ste\.?|lane|ln\.?|boulevard|blvd\.?)\b/i.test(line) ||
	/\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/.test(line);

const getWordCount = (line: string) => line.split(/\s+/).filter(Boolean).length;

const isLikelyGuidanceOrWarrantyLine = (line: string) => {
	const wordCount = getWordCount(line);
	return (
		CONTRACTOR_GUIDANCE_PATTERN.test(line) ||
		(/[.!?]$/.test(line) && wordCount > 5) ||
		(/:\s*/.test(line) && !CONTRACTOR_ENTITY_PATTERN.test(line))
	);
};

const getContractorCandidateScore = (line: string) => {
	let score = 0;
	const hasEntitySignal = CONTRACTOR_ENTITY_PATTERN.test(line);
	const hasTradeSignal = CONTRACTOR_TRADE_PATTERN.test(line);
	if (hasEntitySignal) score += 5;
	if (hasTradeSignal) score += 3;
	if (/,/.test(line)) score += 1;
	const wordCount = getWordCount(line);
	if (wordCount >= 2 && wordCount <= 8) score += 1;
	if (wordCount > 10) score -= 4;
	if (line.length > 80) score -= 3;
	if (isLikelyGuidanceOrWarrantyLine(line) && !hasEntitySignal) score -= 6;
	return score;
};

const findLikelyContractorName = (text: string) => {
	const lines = normalizeOcrText(text)
		.split('\n')
		.map((line) => normalizeExtractedValue(line))
		.filter(Boolean);
	const headerEndIndex = lines.findIndex((line) =>
		CONTRACTOR_SECTION_END_PATTERN.test(line),
	);
	const headerLines = headerEndIndex > 0 ? lines.slice(0, headerEndIndex) : lines;
	const candidates = headerLines
		.filter((line) => CONTRACTOR_NAME_INCLUDE_PATTERN.test(line))
		.filter((line) => !CONTRACTOR_NAME_EXCLUDE_PATTERN.test(line))
		.filter((line) => !isLikelyAddressLine(line))
		.map((line) => ({
			line,
			score: getContractorCandidateScore(line),
		}))
		.filter((candidate) => candidate.score >= 3)
		.sort((left, right) => right.score - left.score);

	return candidates[0]?.line || '';
};

const findInvoiceDate = (text: string, label: string) => {
	const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const match = text.match(
		new RegExp(
			`${escapedLabel}\\s*:?\\s*([A-Z][a-z]+\\s+\\d{1,2},\\s+\\d{4}|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}|\\d{4}-\\d{1,2}-\\d{1,2})`,
			'i',
		),
	);
	return normalizeExtractedValue(match?.[1]);
};

const findLineValueAfterLabel = (text: string, labels: string[]) => {
	const lines = normalizeOcrText(text)
		.split('\n')
		.map((line) => normalizeExtractedValue(line))
		.filter(Boolean);

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		for (const label of labels) {
			const labelPattern = new RegExp(`^${escapeLabelPattern(label)}\\s*:?\\s*(.*)$`, 'i');
			const match = line.match(labelPattern);
			if (!match) continue;

			const sameLineValue = trimValueAtNextKnownLabel(match[1], [label]);
			if (sameLineValue) return sameLineValue;

			const nextLine = lines[index + 1];
			if (
				nextLine &&
				!isKnownAddressBoundaryLine(nextLine) &&
				!/^(description|finding|action|cost|tax|paid|recommended follow-up)\b/i.test(nextLine)
			) {
				return nextLine;
			}
		}
	}

	return '';
};

const WARRANTY_UNAVAILABLE_PATTERN =
	/\b(not provided|not included|unavailable|none|n\/a|no warranty paperwork|paperwork not provided)\b/i;

const normalizeWarrantyValue = (value?: string) =>
	normalizeExtractedValue(value)
		.replace(/^warranty\s*:?/i, '')
		.replace(/\.$/, '')
		.trim();

const findWarrantyInformation = (text: string) => {
	const lines = normalizeOcrText(text)
		.split('\n')
		.map((line) => normalizeExtractedValue(line))
		.filter(Boolean);
	const workmanshipWarrantyLine = lines.find(
		(line) =>
			/warranty/i.test(line) &&
			!WARRANTY_UNAVAILABLE_PATTERN.test(line) &&
			/\b(workmanship|repair|labor)\b/i.test(line),
	);
	if (workmanshipWarrantyLine) {
		return normalizeWarrantyValue(workmanshipWarrantyLine);
	}

	const labeledWarranty = findLabeledTextValue(text, ['Warranty']);
	if (
		labeledWarranty &&
		!WARRANTY_UNAVAILABLE_PATTERN.test(labeledWarranty)
	) {
		return normalizeWarrantyValue(labeledWarranty);
	}

	const warrantyLine = lines.find(
		(line) =>
			/warranty/i.test(line) &&
			!WARRANTY_UNAVAILABLE_PATTERN.test(line) &&
			/\b(workmanship|labor|parts?|compressor|repair|coverage|year|month)\b/i.test(line),
	);
	if (warrantyLine) return normalizeWarrantyValue(warrantyLine);

	return '';
};

const extractDescriptionLines = (text: string) => {
	const rawDescription = findTextBetween(text, 'DESCRIPTION', [
		'NOTES',
		'Subtotal',
		'TOTAL DUE',
	]);
	if (!rawDescription) return [];

	return rawDescription
		.split(/\n|(?=\b(?:Trane|Honeywell|Disconnect|Drain|R-\d|Labor|Permit|Equipment Pad)\b)/i)
		.map((line) =>
			line
				.replace(/\s+\d+\s+\$[0-9,.]+\s+\$[0-9,.]+.*$/, '')
				.replace(/\s+\$[0-9,.]+.*$/, '')
				.trim(),
		)
		.filter(Boolean)
		.filter((line) => !/^qty\b|^unit price\b|^amount\b/i.test(line));
};

const extractLineItemKnowledge = (text: string) => {
	const lines = extractDescriptionLines(text);
	const source = lines.join('\n');
	const modelMatches = Array.from(
		source.matchAll(/\bModel\s*:?\s*([A-Z0-9-]{5,})/gi),
	).map((match) => normalizeExtractedValue(match[1]));
	const refrigerantMatches = Array.from(
		text.matchAll(/\bR-\d{3,4}A?\b/gi),
	).map((match) => normalizeExtractedValue(match[0]).toUpperCase());

	const partLines = lines
		.map((line) => line.replace(/\bModel\s*:?\s*[A-Z0-9-]{5,}/gi, '').trim())
		.filter(Boolean)
		.filter((line) => !/^labor\b|^permit fee\b/i.test(line));

	return {
		lines,
		partNames: partLines,
		modelNumbers: Array.from(new Set(modelMatches)),
		refrigerants: Array.from(new Set(refrigerantMatches)),
	};
};

const inferAssetKnowledge = (text: string) => {
	const assetType = normalizeAssetType(text);
	const definition = getAssetDefinition(assetType);
	if (!definition || assetType === UNKNOWN_ASSET_TYPE) return {};

	return {
		assetType,
		assetVariant: inferAssetVariantFromText(assetType, text),
	};
};

const createField = (
	fieldKey: PropertyKnowledgeFieldKey,
	value: string,
	index: number,
	relatedSystemId?: string,
	sourceText?: string,
	confidenceOptions: ConfidenceOptions = {},
): ExtractedKnowledgeField | null => {
	const normalizedValue = normalizeExtractedValue(value);
	if (!normalizedValue) return null;
	const definition = FIELD_DEFINITIONS[fieldKey];
	const targetEntity =
		relatedSystemId && SYSTEM_FIELD_KEYS.has(fieldKey)
			? 'system'
			: definition.targetEntity;
	const confidenceLevel = confidenceOptions.confidenceLevel || 'medium';
	const confidence =
		confidenceOptions.confidence ?? CONFIDENCE_SCORE_BY_LEVEL[confidenceLevel];

	return {
		id: `${fieldKey}-${index}`,
		fieldKey,
		label: definition.label,
		value: normalizedValue,
		confidence,
		confidenceLevel,
		...(confidenceOptions.confidenceReason
			? { confidenceReason: confidenceOptions.confidenceReason }
			: {}),
		targetEntity,
		targetField: definition.targetField,
		...(sourceText ? { sourceText } : {}),
	};
};

export const classifyKnowledgeDocument = (
	document: Pick<PropertyDocument, 'category' | 'name' | 'type'>,
): PropertyKnowledgeDocumentType => {
	const documentType = (document as PropertyDocument).documentType;
	if (
		documentType &&
		documentType !== 'other' &&
		documentType !== 'unknown'
	) {
		return documentType;
	}
	if (document.category === 'manual') return 'manual';
	if (document.category === 'warranty') return 'warranty';

	const text = normalizeSearchText(
		`${(document as PropertyDocument).fileName || document.name} ${
			document.type || ''
		}`,
	);
	if (text.includes('inspection') || text.includes('report')) {
		return 'inspection_report';
	}
	if (text.includes('invoice') || /\binv\b/.test(text)) return 'invoice';
	if (text.includes('receipt')) return 'receipt';
	if (text.includes('warranty')) return 'warranty';
	if (text.includes('manual') || text.includes('guide')) return 'manual';
	if (
		text.includes('contractor') ||
		text.includes('installer') ||
		text.includes('service')
	) {
		return 'contractor_document';
	}
	return 'unknown';
};

export const extractPlaceholderFieldsFromDocument = (
	document: PropertyDocument,
	relatedSystemId?: string,
) => {
	const text = stripExtension(document.fileName || document.name || '');
	const fields: ExtractedKnowledgeField[] = [];
	const pushField = (
		fieldKey: PropertyKnowledgeFieldKey,
		value: string,
		sourceText?: string,
		confidenceOptions: ConfidenceOptions = {
			confidenceLevel: 'medium',
			confidenceReason: 'Found in document metadata.',
		},
	) => {
		const field = createField(
			fieldKey,
			value,
			fields.length + 1,
			relatedSystemId,
			sourceText,
			confidenceOptions,
		);
		if (field) fields.push(field);
	};

	const assetKnowledge = inferAssetKnowledge(
		findLabeledTextValue(text, ['Equipment Type']) || text,
	);
	if (assetKnowledge.assetType) {
		pushField('assetType', assetKnowledge.assetType, document.fileName || document.name);
	}
	if (assetKnowledge.assetVariant) {
		pushField(
			'assetVariant',
			assetKnowledge.assetVariant,
			document.fileName || document.name,
		);
	}

	pushField('model', findValueAfterLabel(text, ['model', 'mdl']), document.fileName || document.name);
	pushField(
		'serialNumber',
		findValueAfterLabel(text, ['serial', 'serial number', 'sn']),
		document.fileName || document.name,
	);
	pushField(
		'partNumber',
		findValueAfterLabel(text, ['part', 'part number', 'pn']),
		document.fileName || document.name,
	);
	pushField(
		'invoiceNumber',
		findValueAfterLabel(text, ['invoice', 'invoice number', 'inv']),
		document.fileName || document.name,
	);
	pushField(
		'installDate',
		findDateAfterLabel(text, ['install', 'installed']),
		document.fileName || document.name,
	);
	pushField(
		'warrantyEndDate',
		findDateAfterLabel(text, ['warranty end', 'warranty expires', 'expires']),
		document.fileName || document.name,
	);

	const filterSize = text.match(/\b\d{1,2}\s*x\s*\d{1,2}\s*x\s*\d{1,2}\b/i)?.[0];
	pushField('filterSize', filterSize || '', document.fileName || document.name);

	const cost = findCost(text);
	if (cost) {
		pushField('totalCost', cost, document.fileName || document.name);
		pushField('currency', 'USD', document.fileName || document.name);
	}

	return prepareVisibleFields(fields);
};

export const extractFieldsFromDocumentText = (
	rawText: string,
	relatedSystemId?: string,
) => {
	const text = normalizeOcrText(rawText);
	const fields: ExtractedKnowledgeField[] = [];
	const pushField = (
		fieldKey: PropertyKnowledgeFieldKey,
		value: string,
		sourceText?: string,
		confidenceOptions: ConfidenceOptions = {
			confidenceLevel: 'medium',
			confidenceReason: 'Matched from document text and needs review.',
		},
	) => {
		const field = createField(
			fieldKey,
			value,
			fields.length + 1,
			relatedSystemId,
			sourceText,
			confidenceOptions,
		);
		if (field) fields.push(field);
	};

	const assetKnowledge = inferAssetKnowledge(
		findLabeledTextValue(text, ['Equipment Type']) || text,
	);
	if (assetKnowledge.assetType) {
		pushField('assetType', assetKnowledge.assetType, 'Detected equipment type', {
			confidenceLevel: 'medium',
			confidenceReason: 'Inferred from recognized equipment wording.',
		});
	}
	if (assetKnowledge.assetVariant) {
		pushField(
			'assetVariant',
			assetKnowledge.assetVariant,
			'Detected equipment variant',
			{
				confidenceLevel: 'medium',
				confidenceReason: 'Inferred from recognized equipment wording.',
			},
		);
	}

	const contractorName =
		findLikelyContractorName(text) ||
		findTextBetween(text, 'Carolina Comfort HVAC, LLC', [
			'4512',
			'BILL TO',
			'INVOICE',
		]) || (text.match(/Carolina Comfort HVAC,\s*LLC/i)?.[0] || '');
	pushField('contractorName', contractorName, 'Contractor header', {
		confidenceLevel: 'medium',
		confidenceReason: 'Matched from the document header.',
	});
	pushField('contractorPhone', findPhoneNumber(text), 'Contractor contact', {
		confidenceLevel: 'high',
		confidenceReason: 'Document contains a clear phone number.',
	});
	pushField('contractorWebsite', findWebsite(text), 'Contractor contact', {
		confidenceLevel: 'high',
		confidenceReason: 'Document contains a clear website.',
	});
	pushField(
		'invoiceNumber',
		findLabeledTextValue(text, ['Invoice Number']) ||
			findLineValueAfterLabel(text, [
				'Report / Invoice #',
				'Report / Invoice',
				'Invoice #',
			]),
		'Invoice details',
		{
		confidenceLevel: 'high',
		confidenceReason: 'Document clearly labels this invoice number.',
		},
	);
	pushField(
		'invoiceDate',
		findInvoiceDate(text, 'Invoice Date') ||
			findLineValueAfterLabel(text, ['Date']),
		'Invoice details',
		{
		confidenceLevel: 'high',
		confidenceReason: 'Document clearly labels this invoice date.',
		},
	);
	pushField('maintenanceEventDate', findInvoiceDate(text, 'Service Date'), 'Service details', {
		confidenceLevel: 'high',
		confidenceReason: 'Document clearly labels this service date.',
	});
	pushField('brand', findLabeledTextValue(text, ['Brand']), 'System information', {
		confidenceLevel: 'high',
		confidenceReason: 'Document clearly labels this system brand.',
	});
	pushField('model', findLabeledTextValue(text, ['Model']), 'System information', {
		confidenceLevel: 'high',
		confidenceReason: 'Document clearly labels this system model.',
	});

	const outdoorSerial = findLabeledTextValue(text, ['Serial Number (Outdoor)', 'Serial Number Outdoor']);
	const indoorSerial = findLabeledTextValue(text, ['Serial Number (Indoor)', 'Serial Number Indoor']);
	const serialValue = [outdoorSerial && `Outdoor: ${outdoorSerial}`, indoorSerial && `Indoor: ${indoorSerial}`]
		.filter(Boolean)
		.join('; ');
	pushField(
		'serialNumber',
		serialValue || findLabeledTextValue(text, ['Serial Number']),
		'System information',
		{
			confidenceLevel: 'high',
			confidenceReason: 'Document clearly labels this serial number.',
		},
	);
	pushField('installDate', findInvoiceDate(text, 'Installation Date'), 'System information', {
		confidenceLevel: 'high',
		confidenceReason: 'Document clearly labels this installation date.',
	});
	pushField('warrantyLength', findWarrantyInformation(text), 'System information', {
		confidenceLevel: 'high',
		confidenceReason: 'Document clearly labels this warranty information.',
	});
	pushField(
		'maintenanceEventDescription',
		findLabeledTextValue(text, ['Equipment Type']) ||
			findLabeledTextValue(text, ['Description']),
		'Service description',
		{
			confidenceLevel: 'medium',
			confidenceReason: 'Matched from service description text.',
		},
	);
	pushField(
		'servicePerformed',
		findTextBetween(text, 'NOTES', ['PAYMENT OPTIONS', 'WARRANTY INFORMATION']) ||
			findTextBetween(text, 'DESCRIPTION', ['NOTES', 'Subtotal']),
		'Service notes',
		{
			confidenceLevel: 'medium',
			confidenceReason: 'Matched from notes or description text.',
		},
	);
	const lineItemKnowledge = extractLineItemKnowledge(text);
	const partNames = lineItemKnowledge.partNames.join('; ');
	const modelNumbers = lineItemKnowledge.modelNumbers.join('; ');
	const refrigerants = lineItemKnowledge.refrigerants.join('; ');
	pushField('fluidType', refrigerants, 'System refrigerant', {
		confidenceLevel: 'medium',
		confidenceReason: 'Matched from refrigerant wording in the document.',
	});
	pushField(
		'partsReplaced',
		[partNames, modelNumbers && `Models: ${modelNumbers}`, refrigerants && `Refrigerant: ${refrigerants}`]
			.filter(Boolean)
			.join('; '),
		'Line items',
		{
			confidenceLevel: 'medium',
			confidenceReason: 'Matched from invoice line items and needs review.',
		},
	);
	pushField(
		'recommendedMaintenanceInterval',
		text.match(/maintenance performed annually/i)?.[0] || '',
		'Warranty information',
		{
			confidenceLevel: 'low',
			confidenceReason: 'Mentioned in paragraph text, so Maintley is not suggesting it yet.',
		},
	);
	pushField(
		'manufacturerSupportUrl',
		text.match(/(?:www\.)?trane\.com\/warranty/i)?.[0] || '',
		'Warranty information',
		{
			confidenceLevel: 'low',
			confidenceReason: 'Found in paragraph text, so Maintley is not suggesting it yet.',
		},
	);
	pushField('totalCost', findMoneyAfterTextLabel(text, ['Invoice Total', 'TOTAL DUE', 'Total']), 'Invoice total', {
		confidenceLevel: 'high',
		confidenceReason: 'Document clearly labels this total.',
	});
	pushField('laborCost', findMoneyAfterTextLabel(text, ['Labor']), 'Invoice line item', {
		confidenceLevel: 'high',
		confidenceReason: 'Document clearly labels this labor cost.',
	});
	pushField('taxAmount', findMoneyAfterTextLabel(text, ['Tax']), 'Invoice tax', {
		confidenceLevel: 'high',
		confidenceReason: 'Document clearly labels this tax amount.',
	});
	if (fields.some((field) => ['totalCost', 'laborCost', 'taxAmount'].includes(field.fieldKey))) {
		pushField('currency', 'USD', 'Invoice currency', {
			confidenceLevel: 'high',
			confidenceReason: 'Derived from dollar amounts in the document.',
		});
	}

	return prepareVisibleFields(fields);
};

export const extractPartSuggestionsFromDocumentText = (
	rawText: string,
): ExtractedPartSuggestion[] => {
	const text = normalizeOcrText(rawText);
	const lineItemKnowledge = extractLineItemKnowledge(text);
	const rawLines = text
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
	return sortByConfidence(
		matchPartKnowledgeFromLines([...lineItemKnowledge.lines, ...rawLines]).filter(
			isVisibleConfidence,
		),
	);
};

const dedupeFields = (fields: ExtractedKnowledgeField[]) => {
	const seen = new Set<string>();
	return fields.filter((field) => {
		const key = `${field.fieldKey}:${field.targetEntity}:${field.targetField}:${field.value}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

const hasMeaningfulValue = (value: unknown) => {
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === 'string') return value.trim().length > 0;
	if (typeof value === 'number') return Number.isFinite(value);
	return value !== null && value !== undefined && value !== false;
};

const getRecordValue = (record: unknown, field: string) =>
	(record as Record<string, unknown> | undefined)?.[field];

const parseMoneyValue = (value?: string) => {
	const cleaned = normalizeExtractedValue(value).replace(/[^0-9.-]/g, '');
	const parsed = Number(cleaned);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeDateValue = (value?: string, fallback = new Date().toISOString()) => {
	const normalized = normalizeExtractedValue(value);
	if (normalized) {
		const parsed = new Date(normalized);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed.toISOString().slice(0, 10);
		}
	}
	return fallback.slice(0, 10);
};

const normalizePartLookupValue = (value?: string) =>
	normalizeSearchText(value).replace(/\s+/g, ' ');

const inferManufacturerFromPartName = (name: string) => {
	const knownManufacturers = ['Honeywell', 'Trane', 'Ecobee', 'Nest', 'Carrier', 'Lennox'];
	return knownManufacturers.find((manufacturer) =>
		normalizePartLookupValue(name).startsWith(normalizePartLookupValue(manufacturer)),
	);
};

const getAcceptedFieldValue = (
	fields: ExtractedKnowledgeField[],
	fieldKey: PropertyKnowledgeFieldKey,
) =>
	fields.find((field) => field.fieldKey === fieldKey)?.userEditableValue ||
	fields.find((field) => field.fieldKey === fieldKey)?.value ||
	'';

const hasAcceptedFieldForTargets = (
	fields: ExtractedKnowledgeField[],
	targetEntities: PropertyKnowledgeTargetEntity[],
) => fields.some((field) => targetEntities.includes(field.targetEntity));

const getAcceptedKnowledgeFields = (fields: ExtractedKnowledgeField[]) =>
	fields.filter((field) => field.reviewStatus !== 'rejected');

const inferContractorCategory = (value: string) => {
	const normalized = normalizeSearchText(value);
	if (normalized.includes('hvac') || normalized.includes('heating') || normalized.includes('cooling')) {
		return 'HVAC';
	}
	if (normalized.includes('plumb')) return 'Plumber';
	if (normalized.includes('electric')) return 'Electrician';
	if (normalized.includes('roof')) return 'Roofer';
	if (normalized.includes('paint')) return 'Painter';
	if (normalized.includes('landscap')) return 'Landscaper';
	if (normalized.includes('pest')) return 'Pest Control';
	return 'Contractor';
};

const buildContractorSuggestion = (
	fields: ExtractedKnowledgeField[],
): ApplyKnowledgeSuggestionResult['contractorSuggestion'] => {
	const name =
		normalizeExtractedValue(getAcceptedFieldValue(fields, 'contractorName')) ||
		normalizeExtractedValue(getAcceptedFieldValue(fields, 'installer'));
	if (!name) return undefined;

	const phone = normalizeExtractedValue(getAcceptedFieldValue(fields, 'contractorPhone'));
	const website = normalizeExtractedValue(getAcceptedFieldValue(fields, 'contractorWebsite'));

	return {
		name,
		company: name,
		category: inferContractorCategory(`${name} ${website}`),
		phone,
		...(website ? { website } : {}),
	};
};

const buildMaintenanceHistorySuggestion = ({
	fields,
	relatedSystemId,
	acceptedAt,
	sourceDocumentName,
}: {
	fields: ExtractedKnowledgeField[];
	relatedSystemId?: string;
	acceptedAt: string;
	sourceDocumentName?: string;
}): ApplyKnowledgeSuggestionResult['maintenanceHistorySuggestion'] => {
	const hasMaintenanceMemory = hasAcceptedFieldForTargets(fields, [
		'maintenanceHistory',
		'part',
		'task',
		'warranty',
	]);
	if (!hasMaintenanceMemory) return undefined;

	const invoiceNumber = normalizeExtractedValue(getAcceptedFieldValue(fields, 'invoiceNumber'));
	const invoiceDate = normalizeExtractedValue(getAcceptedFieldValue(fields, 'invoiceDate'));
	const maintenanceDate = normalizeExtractedValue(
		getAcceptedFieldValue(fields, 'maintenanceEventDate'),
	);
	const description = normalizeExtractedValue(
		getAcceptedFieldValue(fields, 'maintenanceEventDescription'),
	);
	const servicePerformed = normalizeExtractedValue(
		getAcceptedFieldValue(fields, 'servicePerformed'),
	);
	const performedByName = normalizeExtractedValue(
		getAcceptedFieldValue(fields, 'performedByName'),
	);
	const partName = normalizeExtractedValue(getAcceptedFieldValue(fields, 'partName'));
	const partNumber = normalizeExtractedValue(getAcceptedFieldValue(fields, 'partNumber'));
	const partsReplaced = normalizeExtractedValue(getAcceptedFieldValue(fields, 'partsReplaced'));
	const fluidType = normalizeExtractedValue(getAcceptedFieldValue(fields, 'fluidType'));
	const consumables = normalizeExtractedValue(getAcceptedFieldValue(fields, 'consumables'));
	const warrantyLength = normalizeExtractedValue(getAcceptedFieldValue(fields, 'warrantyLength'));
	const recommendedInterval = normalizeExtractedValue(
		getAcceptedFieldValue(fields, 'recommendedMaintenanceInterval'),
	);
	const totalCost = parseMoneyValue(getAcceptedFieldValue(fields, 'totalCost'));
	const laborCost = parseMoneyValue(getAcceptedFieldValue(fields, 'laborCost'));
	const partsCost = parseMoneyValue(getAcceptedFieldValue(fields, 'partsCost'));
	const taxAmount = parseMoneyValue(getAcceptedFieldValue(fields, 'taxAmount'));
	const currency =
		normalizeExtractedValue(getAcceptedFieldValue(fields, 'currency')) || 'USD';

	const breakdownNotes = [
		totalCost !== undefined ? `Total: ${currency} ${totalCost.toFixed(2)}` : '',
		laborCost !== undefined ? `Labor: ${currency} ${laborCost.toFixed(2)}` : '',
		partsCost !== undefined ? `Parts: ${currency} ${partsCost.toFixed(2)}` : '',
		taxAmount !== undefined ? `Tax: ${currency} ${taxAmount.toFixed(2)}` : '',
	].filter(Boolean);

	const actual =
		totalCost !== undefined
			? { contractorCost: totalCost }
			: {
					...(laborCost !== undefined ? { laborCost } : {}),
					...(partsCost !== undefined ? { materialsCost: partsCost } : {}),
					...(taxAmount !== undefined ? { otherCost: taxAmount } : {}),
			  };
	const hasFinancials =
		totalCost !== undefined ||
		laborCost !== undefined ||
		partsCost !== undefined ||
		taxAmount !== undefined;

	const title =
		description ||
		(invoiceNumber ? `Invoice ${invoiceNumber}` : '') ||
		(sourceDocumentName ? `Document reviewed: ${sourceDocumentName}` : '') ||
		'Document details reviewed';
	const completionNotes = [
		sourceDocumentName ? `Source document: ${sourceDocumentName}` : '',
		invoiceNumber ? `Invoice number: ${invoiceNumber}` : '',
		invoiceDate ? `Invoice date: ${invoiceDate}` : '',
		servicePerformed ? `Service performed: ${servicePerformed}` : '',
		partName ? `Parts and supplies mentioned: ${partName}` : '',
		partNumber ? `Part/model numbers mentioned: ${partNumber}` : '',
		partsReplaced ? `Parts replaced: ${partsReplaced}` : '',
		fluidType ? `Fluid type: ${fluidType}` : '',
		consumables ? `Consumables: ${consumables}` : '',
		warrantyLength ? `Warranty information: ${warrantyLength}` : '',
		recommendedInterval
			? `Recommended maintenance interval: ${recommendedInterval}`
			: '',
		breakdownNotes.length ? `Financial details: ${breakdownNotes.join('; ')}` : '',
	].filter(Boolean).join('\n');

	return {
		title,
		completionDate: normalizeDateValue(maintenanceDate || invoiceDate, acceptedAt),
		...(performedByName ? { completedByName: performedByName } : {}),
		...(completionNotes ? { completionNotes } : {}),
		...(relatedSystemId ? { deviceIds: [relatedSystemId] } : {}),
		...(hasFinancials
			? {
					financials: {
						currency,
						actual,
						...(breakdownNotes.length ? { notes: breakdownNotes.join('; ') } : {}),
					},
			  }
			: {}),
		eventType: invoiceNumber || hasFinancials ? 'invoice_uploaded' : 'maintenance_recorded',
		eventSource: 'document_upload',
		tags: ['document-reviewed'],
	};
};

const buildSupplySuggestionsFromAcceptedParts = ({
	suggestion,
	acceptedByUser,
	acceptedAt,
}: {
	suggestion: PropertyKnowledgeSuggestion;
	acceptedByUser: string;
	acceptedAt: string;
}) => {
	return (suggestion.suggestedParts || [])
		.filter((part) => part.reviewStatus !== 'rejected')
		.map((part) => {
			const name = normalizeExtractedValue(part.userEditableName || part.name);
			const category = part.userEditableCategory || part.category;
			const manufacturer = inferManufacturerFromPartName(name);
			return {
				draft: {
					name,
					type: getPropertySupplyTypeFromLegacyCategory(category),
					...(manufacturer ? { manufacturer } : {}),
					details: `Matched as ${part.label}`,
					notes: [
						`Suggested from ${suggestion.sourceDocumentName || 'source document'}.`,
						part.sourceText ? `Source text: ${part.sourceText}` : '',
						`Accepted by ${acceptedByUser} on ${acceptedAt.slice(0, 10)}.`,
					].filter(Boolean).join('\n'),
				},
				...(suggestion.relatedSystemId
					? { equipmentId: suggestion.relatedSystemId }
					: {}),
			};
		})
		.filter((item) => Boolean(item.draft.name));
};

const filterFieldsToMissingPropertyMemory = ({
	fields,
	property,
	systems = [],
	relatedSystemId,
}: {
	fields: ExtractedKnowledgeField[];
	property?: Property;
	systems?: Device[];
	relatedSystemId?: string;
}) =>
	fields.filter((field) => {
		if (field.targetEntity === 'property' && property) {
			return !hasMeaningfulValue(getRecordValue(property, field.targetField));
		}

		if (field.targetEntity === 'system' && relatedSystemId) {
			const system = systems.find(
				(candidate) => String(candidate.id) === String(relatedSystemId),
			);
			if (system) {
				return !hasMeaningfulValue(getRecordValue(system, field.targetField));
			}
		}

		return true;
	});

export const extractTextFromImageFile = async (file: File) => {
	if (!String(file.type || '').startsWith('image/')) return '';
	const tesseractModule = await import('tesseract.js');
	const worker = await (tesseractModule as any).createWorker('eng');
	try {
		const result = await worker.recognize(file);
		return normalizeOcrText(result?.data?.text || '');
	} finally {
		await worker.terminate();
	}
};

export const createPendingKnowledgeSuggestion = ({
	document,
	propertyId,
	relatedSystemId,
	property,
	systems,
	createdAt = new Date().toISOString(),
}: CreatePendingKnowledgeSuggestionInput): PropertyKnowledgeSuggestion => {
	const documentType = classifyKnowledgeDocument(document);
	const extractionMethod: PropertyKnowledgeExtractionMethod = 'metadata_placeholder';
	let resolvedRelatedSystemId =
		relatedSystemId || document.assignedDeviceId || document.links?.assetIds?.[0];
	const extractedFields = filterFieldsToMissingPropertyMemory({
		fields: extractPlaceholderFieldsFromDocument(
			document,
			resolvedRelatedSystemId,
		),
		property,
		systems,
		relatedSystemId: resolvedRelatedSystemId,
	});
	const visibleFields = prepareVisibleFields(extractedFields);
	const confidence = calculateSuggestionConfidence(visibleFields);

	return {
		id: createSuggestionId(document.id, createdAt),
		sourceDocumentId: document.id,
		propertyId,
		...(resolvedRelatedSystemId
			? { relatedSystemId: resolvedRelatedSystemId }
			: {}),
		documentType,
		extractionMethod,
		extractedFields: visibleFields,
		...(confidence !== undefined ? { confidence } : {}),
		status: 'pending',
		createdAt,
		sourceDocumentName: document.fileName || document.name,
	};
};

export const createPendingKnowledgeSuggestionFromFile = async ({
	file,
	document,
	propertyId,
	relatedSystemId,
	property,
	systems,
	createdAt = new Date().toISOString(),
}: CreateKnowledgeSuggestionFromFileInput): Promise<PropertyKnowledgeSuggestion> => {
	const documentType = classifyKnowledgeDocument(document);
	let resolvedRelatedSystemId =
		relatedSystemId || document.assignedDeviceId || document.links?.assetIds?.[0];
	const metadataFields = extractPlaceholderFieldsFromDocument(
		document,
		resolvedRelatedSystemId,
	);
	let extractionMethod: PropertyKnowledgeExtractionMethod = 'metadata_placeholder';
	let extractedFields = metadataFields;
	let suggestedParts: ExtractedPartSuggestion[] = [];
	let propertyConfirmation: PropertyKnowledgePropertyConfirmation | undefined;

	if (file && String(file.type || '').startsWith('image/')) {
		try {
			const extractedText = await extractTextFromImageFile(file);
			propertyConfirmation = buildPropertyConfirmationFromDocumentText(
				extractedText,
				property?.address,
			);
			const ocrFields = extractFieldsFromDocumentText(
				extractedText,
				resolvedRelatedSystemId,
			);
			if (!resolvedRelatedSystemId && systems?.length) {
				const assetCandidate = findAssetTargetCandidate({
					suggestion: {
						id: createSuggestionId(document.id, createdAt),
						sourceDocumentId: document.id,
						propertyId,
						documentType,
						extractionMethod,
						extractedFields: ocrFields,
						status: 'pending',
						createdAt,
						sourceDocumentName: document.fileName || document.name,
					},
					fields: ocrFields,
					systems,
				});
				if (assetCandidate?.recordId) {
					resolvedRelatedSystemId = assetCandidate.recordId;
				}
			}
			suggestedParts = resolvedRelatedSystemId
				? extractPartSuggestionsFromDocumentText(extractedText)
				: [];
			if (ocrFields.length > 0 || suggestedParts.length > 0) {
				extractionMethod = 'image_ocr';
				if (ocrFields.length > 0) {
					extractedFields = prepareVisibleFields(
						dedupeFields([...ocrFields, ...metadataFields]),
					);
				}
			}
		} catch (error) {
			console.warn('Property Knowledge OCR extraction failed:', error);
		}
	}

	extractedFields = prepareVisibleFields(filterFieldsToMissingPropertyMemory({
		fields: extractedFields,
		property,
		systems,
		relatedSystemId: resolvedRelatedSystemId,
	}));
	suggestedParts = sortByConfidence(suggestedParts.filter(isVisibleConfidence));
	const confidence = calculateSuggestionConfidence(extractedFields, suggestedParts);

	return {
		id: createSuggestionId(document.id, createdAt),
		sourceDocumentId: document.id,
		propertyId,
		...(resolvedRelatedSystemId
			? { relatedSystemId: resolvedRelatedSystemId }
			: {}),
		documentType,
		extractionMethod,
		extractedFields,
		...(suggestedParts.length > 0 ? { suggestedParts } : {}),
		...(confidence !== undefined ? { confidence } : {}),
		...(propertyConfirmation ? { propertyConfirmation } : {}),
		status: 'pending',
		createdAt,
		sourceDocumentName: document.fileName || document.name,
	};
};

export const markDocumentWithKnowledgeSuggestion = (
	document: PropertyDocument,
	suggestion: PropertyKnowledgeSuggestion,
): PropertyDocument => ({
	...document,
	acquisitionStatus: 'pending_review',
	extractedKnowledgeSuggestionIds: [
		...(document.extractedKnowledgeSuggestionIds || []),
		suggestion.id,
	].filter((value, index, values) => values.indexOf(value) === index),
});

export const acceptKnowledgeSuggestion = (
	suggestion: PropertyKnowledgeSuggestion,
	{
		reviewedAt = new Date().toISOString(),
		acceptedByUser = 'unknown',
		fieldValues = {},
		fieldReviewStatuses = {},
		partValues = {},
		taskValues = {},
		equipmentValues = {},
	}: ReviewKnowledgeSuggestionInput,
): PropertyKnowledgeSuggestion => ({
	...suggestion,
	status: 'accepted',
	reviewedAt,
	acceptedByUser,
	extractedFields: suggestion.extractedFields.map((field) => ({
		...field,
		userEditableValue: fieldValues[field.id] ?? field.userEditableValue ?? field.value,
		reviewStatus:
			fieldReviewStatuses[field.id]?.accepted === false
				? 'rejected'
				: 'accepted',
		provenance: {
			sourceDocumentId: suggestion.sourceDocumentId,
			sourceDocumentType: suggestion.documentType,
			extractionMethod: suggestion.extractionMethod,
			...(field.confidence ?? suggestion.confidence
				? { confidence: field.confidence ?? suggestion.confidence }
				: {}),
			...(field.confidenceLevel ? { confidenceLevel: field.confidenceLevel } : {}),
			...(field.confidenceReason
				? { confidenceReason: field.confidenceReason }
				: {}),
			acceptedByUser,
			acceptedAt: reviewedAt,
			suggestionId: suggestion.id,
			fieldKey: field.fieldKey,
			...(field.sourceText ? { sourceText: field.sourceText } : {}),
		},
	})),
	suggestedParts: suggestion.suggestedParts?.map((part) => ({
		...part,
		userEditableName: partValues[part.id]?.name ?? part.userEditableName ?? part.name,
		userEditableCategory:
			(partValues[part.id]?.category as PartKnowledgeCategory | undefined) ??
			part.userEditableCategory ??
			part.category,
		reviewStatus:
			partValues[part.id]?.accepted === false ? 'rejected' : 'accepted',
		provenance: {
			sourceDocumentId: suggestion.sourceDocumentId,
			sourceDocumentType: suggestion.documentType,
			extractionMethod: suggestion.extractionMethod,
			...(part.confidence ?? suggestion.confidence
				? { confidence: part.confidence ?? suggestion.confidence }
				: {}),
			...(part.confidenceLevel ? { confidenceLevel: part.confidenceLevel } : {}),
			...(part.confidenceReason
				? { confidenceReason: part.confidenceReason }
				: {}),
			acceptedByUser,
			acceptedAt: reviewedAt,
			suggestionId: suggestion.id,
			sourceText: part.sourceText,
		},
	})),
	suggestedTasks: suggestion.suggestedTasks?.map((task) => ({
		...task,
		userEditableTitle: taskValues[task.id]?.title ?? task.userEditableTitle ?? task.title,
		userEditableDescription:
			taskValues[task.id]?.description ?? task.userEditableDescription ?? task.description,
		...(taskValues[task.id]?.matchedDeviceId
			? { matchedDeviceId: taskValues[task.id]?.matchedDeviceId }
			: {}),
		reviewStatus:
			taskValues[task.id]?.accepted === false ? 'rejected' : 'accepted',
	})),
	suggestedEquipment: suggestion.suggestedEquipment?.map((equipment) => ({
		...equipment,
		...(equipmentValues[equipment.id]?.matchedDeviceId
			? { matchedDeviceId: equipmentValues[equipment.id]?.matchedDeviceId }
			: {}),
		...(equipmentValues[equipment.id]?.accepted === false && equipmentValues[equipment.id]?.skipReason
			? { skipReason: equipmentValues[equipment.id]?.skipReason }
			: {}),
		reviewStatus:
			equipmentValues[equipment.id]?.accepted === false ? 'rejected' : 'accepted',
	})),
});

export const rejectKnowledgeSuggestion = (
	suggestion: PropertyKnowledgeSuggestion,
	{ reviewedAt = new Date().toISOString() }: ReviewKnowledgeSuggestionInput = {},
): PropertyKnowledgeSuggestion => ({
	...suggestion,
	status: 'rejected',
	reviewedAt,
	rejectedAt: reviewedAt,
});

const appendProvenance = (
	current: Record<string, PropertyKnowledgeProvenance[]> | undefined,
	targetField: string,
	provenance: PropertyKnowledgeProvenance,
) => ({
	...(current || {}),
	[targetField]: [...(current?.[targetField] || []), provenance],
});

export const applyAcceptedKnowledgeSuggestion = ({
	suggestion,
	property,
	systems,
	acceptedByUser,
	acceptedAt = new Date().toISOString(),
}: ApplyKnowledgeSuggestionInput): ApplyKnowledgeSuggestionResult => {
	if (suggestion.status === 'rejected') {
		return {
			propertyUpdates: {},
			systemUpdates: [],
			supplySuggestions: [],
			taskSuggestions: [],
			equipmentSuggestions: [],
			appliedSuggestion: suggestion,
		};
	}

	const acceptedSuggestion =
		suggestion.status === 'accepted'
			? suggestion
			: acceptKnowledgeSuggestion(suggestion, {
					reviewedAt: acceptedAt,
					acceptedByUser,
			  });

	const propertyUpdates: Partial<Property> = {};
	const systemUpdateMap = new Map<string, Partial<Device>>();
	const acceptedFields = getAcceptedKnowledgeFields(
		acceptedSuggestion.extractedFields,
	);

	acceptedFields.forEach((field) => {
		const value = normalizeExtractedValue(field.userEditableValue ?? field.value);
		if (!value) return;

		const provenance: PropertyKnowledgeProvenance =
			field.provenance || {
				sourceDocumentId: acceptedSuggestion.sourceDocumentId,
				sourceDocumentType: acceptedSuggestion.documentType,
				extractionMethod: acceptedSuggestion.extractionMethod,
				...(field.confidence ?? acceptedSuggestion.confidence
					? { confidence: field.confidence ?? acceptedSuggestion.confidence }
					: {}),
				...(field.confidenceLevel
					? { confidenceLevel: field.confidenceLevel }
					: {}),
				...(field.confidenceReason
					? { confidenceReason: field.confidenceReason }
					: {}),
				acceptedByUser,
				acceptedAt,
				suggestionId: acceptedSuggestion.id,
				fieldKey: field.fieldKey,
				...(field.sourceText ? { sourceText: field.sourceText } : {}),
			};

		if (field.targetEntity === 'property') {
			(propertyUpdates as Record<string, unknown>)[field.targetField] = value;
			propertyUpdates.propertyKnowledgeProvenance = appendProvenance(
				propertyUpdates.propertyKnowledgeProvenance ||
					property.propertyKnowledgeProvenance,
				field.targetField,
				provenance,
			);
			return;
		}

		if (field.targetEntity !== 'system' || !acceptedSuggestion.relatedSystemId) {
			return;
		}

		const system = systems.find(
			(candidate) => String(candidate.id) === String(acceptedSuggestion.relatedSystemId),
		);
		if (!system) return;

		const currentUpdates =
			systemUpdateMap.get(acceptedSuggestion.relatedSystemId) || {};
		(currentUpdates as Record<string, unknown>)[field.targetField] = value;
		currentUpdates.propertyKnowledgeProvenance = appendProvenance(
			currentUpdates.propertyKnowledgeProvenance ||
				system.propertyKnowledgeProvenance,
			field.targetField,
			provenance,
		);
		systemUpdateMap.set(acceptedSuggestion.relatedSystemId, currentUpdates);
	});

	(acceptedSuggestion.suggestedEquipment || [])
		.filter(
			(equipment) =>
				equipment.reviewStatus !== 'rejected' && equipment.matchedDeviceId,
		)
		.forEach((equipment) => {
			const system = systems.find(
				(candidate) => String(candidate.id) === String(equipment.matchedDeviceId),
			);
			if (!system || !equipment.details) return;

			const currentUpdates = systemUpdateMap.get(String(system.id)) || {};
			let provenance =
				currentUpdates.propertyKnowledgeProvenance ||
				system.propertyKnowledgeProvenance;
			const sourceProvenance: PropertyKnowledgeProvenance = {
				sourceDocumentId: acceptedSuggestion.sourceDocumentId,
				sourceDocumentType: acceptedSuggestion.documentType,
				extractionMethod: acceptedSuggestion.extractionMethod,
				acceptedByUser,
				acceptedAt,
				suggestionId: acceptedSuggestion.id,
				sourceText: equipment.sourceText,
			};

			if (equipment.details.filterSize && !system.filterSize) {
				currentUpdates.filterSize = equipment.details.filterSize;
				provenance = appendProvenance(provenance, 'filterSize', {
					...sourceProvenance,
					fieldKey: 'filterSize',
				});
			}
			if (equipment.details.specNotes && !system.specNotes) {
				currentUpdates.specNotes = equipment.details.specNotes;
				provenance = appendProvenance(provenance, 'specNotes', {
					...sourceProvenance,
				});
			}
			if (currentUpdates.filterSize || currentUpdates.specNotes) {
				currentUpdates.propertyKnowledgeProvenance = provenance;
				systemUpdateMap.set(String(system.id), currentUpdates);
			}
		});

	const supplySuggestions = buildSupplySuggestionsFromAcceptedParts({
		suggestion: acceptedSuggestion,
		acceptedByUser,
		acceptedAt,
	});

	return {
		propertyUpdates,
		systemUpdates: Array.from(systemUpdateMap.entries()).map(([id, updates]) => ({
			id,
			updates,
		})),
		supplySuggestions,
		taskSuggestions: (acceptedSuggestion.suggestedTasks || []).filter(
			(task) => task.reviewStatus !== 'rejected',
		),
		equipmentSuggestions: (acceptedSuggestion.suggestedEquipment || []).filter(
			(equipment) => equipment.reviewStatus !== 'rejected',
		),
		contractorSuggestion: buildContractorSuggestion(acceptedFields),
		maintenanceHistorySuggestion: buildMaintenanceHistorySuggestion({
			fields: acceptedFields,
			relatedSystemId: acceptedSuggestion.relatedSystemId,
			acceptedAt,
			sourceDocumentName: acceptedSuggestion.sourceDocumentName,
		}),
		appliedSuggestion: {
			...acceptedSuggestion,
			status: 'applied',
			reviewedAt: acceptedSuggestion.reviewedAt || acceptedAt,
			appliedAt: acceptedAt,
			acceptedByUser,
		},
	};
};

export const mergeKnowledgeSuggestion = (
	suggestions: PropertyKnowledgeSuggestion[] = [],
	suggestion: PropertyKnowledgeSuggestion,
) => {
	const next = [...suggestions];
	const index = next.findIndex((item) => item.id === suggestion.id);
	if (index >= 0) {
		next[index] = suggestion;
		return next;
	}
	return [...next, suggestion];
};
