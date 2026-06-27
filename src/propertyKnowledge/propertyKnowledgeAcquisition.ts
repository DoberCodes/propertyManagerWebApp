import type {
	Device,
	Property,
	PropertyDocument,
} from '../types/Property.types';
import type { TaskFinancials } from '../types/Task.types';
import type {
	ExtractedKnowledgeField,
	ExtractedPartSuggestion,
	PartKnowledgeCategory,
	PropertyKnowledgeDocumentType,
	PropertyKnowledgeExtractionMethod,
	PropertyKnowledgeFieldKey,
	PropertyKnowledgeProvenance,
	PropertyKnowledgeSuggestion,
	PropertyKnowledgeTargetEntity,
} from '../types/PropertyKnowledge.types';
import { matchPartKnowledgeFromLines } from './partKnowledgeCatalog';

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
	partValues?: Record<
		string,
		{ name?: string; category?: string; accepted?: boolean }
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
	partSystemUpdate?: {
		systemId: string;
		items: Device['serviceItems'];
	};
	appliedSuggestion: PropertyKnowledgeSuggestion;
};

type FieldDefinition = {
	label: string;
	targetEntity: PropertyKnowledgeTargetEntity;
	targetField: string;
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
		targetEntity: 'system',
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

const findLabeledTextValue = (text: string, labels: string[]) => {
	const escapedLabels = labels.map((label) =>
		label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'),
	);
	const match = text.match(
		new RegExp(
			`(?:${escapedLabels.join('|')})\\s*:?\\s*([^\\n\\r]+)`,
			'i',
		),
	);
	return normalizeExtractedValue(match?.[1]);
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

const findLikelyContractorName = (text: string) => {
	const lines = normalizeOcrText(text)
		.split('\n')
		.map((line) => normalizeExtractedValue(line))
		.filter(Boolean);
	const businessLine = lines.find(
		(line) =>
			/(llc|inc\.?|company|contractor|hvac|heating|cooling|plumbing|electric|roofing|landscap|pest)/i.test(
				line,
			) &&
			!/invoice|bill to|job address|technician|license|www\.|@|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/i.test(
				line,
			),
	);
	return businessLine || '';
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
	const normalized = normalizeSearchText(text);
	if (normalized.includes('tankless water heater')) {
		return { assetType: 'water_heater', assetVariant: 'tankless' };
	}
	if (normalized.includes('split system heat pump')) {
		return { assetType: 'heat_pump', assetVariant: 'split_system' };
	}
	if (normalized.includes('water heater')) {
		return { assetType: 'water_heater' };
	}
	if (normalized.includes('heat pump')) {
		return { assetType: 'heat_pump' };
	}
	if (normalized.includes('furnace')) {
		return { assetType: 'furnace' };
	}
	if (normalized.includes('central ac') || normalized.includes('air conditioner')) {
		return { assetType: 'central_ac' };
	}
	if (normalized.includes('mini split')) {
		return { assetType: 'mini_split' };
	}
	if (normalized.includes('gas dryer')) {
		return { assetType: 'dryer', assetVariant: 'gas' };
	}
	if (normalized.includes('electric dryer')) {
		return { assetType: 'dryer', assetVariant: 'electric' };
	}
	if (normalized.includes('induction')) {
		return { assetType: 'stove_oven', assetVariant: 'induction' };
	}
	if (normalized.includes('gas stove') || normalized.includes('gas oven')) {
		return { assetType: 'stove_oven', assetVariant: 'gas' };
	}
	if (normalized.includes('electric stove') || normalized.includes('electric oven')) {
		return { assetType: 'stove_oven', assetVariant: 'electric' };
	}
	if (normalized.includes('smoke') && normalized.includes('carbon monoxide')) {
		return { assetType: 'safety_device', assetVariant: 'combo_detector' };
	}
	if (normalized.includes('smoke detector')) {
		return { assetType: 'safety_device', assetVariant: 'smoke_detector' };
	}
	if (normalized.includes('carbon monoxide')) {
		return {
			assetType: 'safety_device',
			assetVariant: 'carbon_monoxide_detector',
		};
	}
	if (normalized.includes('refrigerator filter')) {
		return { assetType: 'filter_system', assetVariant: 'refrigerator_filter' };
	}
	if (normalized.includes('whole home filter')) {
		return { assetType: 'filter_system', assetVariant: 'whole_home_filter' };
	}
	if (normalized.includes('hvac filter')) {
		return { assetType: 'filter_system', assetVariant: 'hvac_filter' };
	}
	return {};
};

const createField = (
	fieldKey: PropertyKnowledgeFieldKey,
	value: string,
	index: number,
	relatedSystemId?: string,
	sourceText?: string,
): ExtractedKnowledgeField | null => {
	const normalizedValue = normalizeExtractedValue(value);
	if (!normalizedValue) return null;
	const definition = FIELD_DEFINITIONS[fieldKey];
	const targetEntity =
		relatedSystemId && SYSTEM_FIELD_KEYS.has(fieldKey)
			? 'system'
			: definition.targetEntity;

	return {
		id: `${fieldKey}-${index}`,
		fieldKey,
		label: definition.label,
		value: normalizedValue,
		confidence: 0.55,
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
	) => {
		const field = createField(
			fieldKey,
			value,
			fields.length + 1,
			relatedSystemId,
			sourceText,
		);
		if (field) fields.push(field);
	};

	const assetKnowledge = inferAssetKnowledge(text);
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

	return fields;
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
	) => {
		const field = createField(
			fieldKey,
			value,
			fields.length + 1,
			relatedSystemId,
			sourceText,
		);
		if (field) {
			fields.push({
				...field,
				confidence: 0.7,
			});
		}
	};

	const assetKnowledge = inferAssetKnowledge(text);
	if (assetKnowledge.assetType) {
		pushField('assetType', assetKnowledge.assetType, 'Detected equipment type');
	}
	if (assetKnowledge.assetVariant) {
		pushField(
			'assetVariant',
			assetKnowledge.assetVariant,
			'Detected equipment variant',
		);
	}

	const contractorName =
		findLikelyContractorName(text) ||
		findTextBetween(text, 'Carolina Comfort HVAC, LLC', [
			'4512',
			'BILL TO',
			'INVOICE',
		]) || (text.match(/Carolina Comfort HVAC,\s*LLC/i)?.[0] || '');
	pushField('contractorName', contractorName, 'Contractor header');
	pushField('contractorPhone', findPhoneNumber(text), 'Contractor contact');
	pushField('contractorWebsite', findWebsite(text), 'Contractor contact');
	pushField('invoiceNumber', findLabeledTextValue(text, ['Invoice Number']), 'Invoice details');
	pushField('invoiceDate', findInvoiceDate(text, 'Invoice Date'), 'Invoice details');
	pushField('maintenanceEventDate', findInvoiceDate(text, 'Service Date'), 'Service details');
	pushField('brand', findLabeledTextValue(text, ['Brand']), 'System information');
	pushField('model', findLabeledTextValue(text, ['Model']), 'System information');

	const outdoorSerial = findLabeledTextValue(text, ['Serial Number (Outdoor)', 'Serial Number Outdoor']);
	const indoorSerial = findLabeledTextValue(text, ['Serial Number (Indoor)', 'Serial Number Indoor']);
	const serialValue = [outdoorSerial && `Outdoor: ${outdoorSerial}`, indoorSerial && `Indoor: ${indoorSerial}`]
		.filter(Boolean)
		.join('; ');
	pushField(
		'serialNumber',
		serialValue || findLabeledTextValue(text, ['Serial Number']),
		'System information',
	);
	pushField('installDate', findInvoiceDate(text, 'Installation Date'), 'System information');
	pushField('warrantyLength', findLabeledTextValue(text, ['Warranty']), 'System information');
	pushField(
		'maintenanceEventDescription',
		findLabeledTextValue(text, ['Equipment Type']) ||
			findLabeledTextValue(text, ['Description']),
		'Service description',
	);
	pushField(
		'servicePerformed',
		findTextBetween(text, 'NOTES', ['PAYMENT OPTIONS', 'WARRANTY INFORMATION']) ||
			findTextBetween(text, 'DESCRIPTION', ['NOTES', 'Subtotal']),
		'Service notes',
	);
	const lineItemKnowledge = extractLineItemKnowledge(text);
	const partNames = lineItemKnowledge.partNames.join('; ');
	const modelNumbers = lineItemKnowledge.modelNumbers.join('; ');
	const refrigerants = lineItemKnowledge.refrigerants.join('; ');
	pushField(
		'partName',
		partNames || findLabeledTextValue(text, ['Description']),
		'Line items',
	);
	pushField('partNumber', modelNumbers, 'Line item model numbers');
	pushField('fluidType', refrigerants, 'System refrigerant');
	pushField('consumables', refrigerants, 'Line item supplies');
	pushField(
		'partsReplaced',
		[partNames, modelNumbers && `Models: ${modelNumbers}`, refrigerants && `Refrigerant: ${refrigerants}`]
			.filter(Boolean)
			.join('; '),
		'Line items',
	);
	pushField(
		'recommendedMaintenanceInterval',
		text.match(/maintenance performed annually/i)?.[0] || '',
		'Warranty information',
	);
	pushField(
		'manufacturerSupportUrl',
		text.match(/(?:www\.)?trane\.com\/warranty/i)?.[0] || '',
		'Warranty information',
	);
	pushField('totalCost', findMoneyAfterTextLabel(text, ['TOTAL DUE', 'Total']), 'Invoice total');
	pushField('laborCost', findMoneyAfterTextLabel(text, ['Labor']), 'Invoice line item');
	pushField('taxAmount', findMoneyAfterTextLabel(text, ['Tax']), 'Invoice tax');
	if (fields.some((field) => ['totalCost', 'laborCost', 'taxAmount'].includes(field.fieldKey))) {
		pushField('currency', 'USD', 'Invoice currency');
	}

	return fields;
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
	return matchPartKnowledgeFromLines([...lineItemKnowledge.lines, ...rawLines]);
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

const createServiceItemId = (suggestionId: string, partId: string) =>
	`pka-${suggestionId}-${partId}`.replace(/[^a-zA-Z0-9_-]/g, '-');

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
	const notes = website ? `Website: ${website}` : undefined;

	return {
		name,
		company: name,
		category: inferContractorCategory(`${name} ${website}`),
		phone: phone || 'Not provided',
		...(notes ? { notes } : {}),
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

const buildServiceItemsFromAcceptedParts = ({
	suggestion,
	system,
	acceptedByUser,
	acceptedAt,
}: {
	suggestion: PropertyKnowledgeSuggestion;
	system: Device;
	acceptedByUser: string;
	acceptedAt: string;
}) => {
	const existingItems = Array.isArray(system.serviceItems)
		? system.serviceItems
		: [];
	const seenNames = new Set(
		existingItems.map((item) => normalizePartLookupValue(item.name)),
	);
	const nextItems = [...existingItems];

	(suggestion.suggestedParts || []).forEach((part) => {
		if (part.reviewStatus === 'rejected') return;
		const name = normalizeExtractedValue(part.userEditableName || part.name);
		if (!name) return;
		const lookupName = normalizePartLookupValue(name);
		if (seenNames.has(lookupName)) return;
		seenNames.add(lookupName);

		const manufacturer = inferManufacturerFromPartName(name);
		const notes = [
			`Suggested from ${suggestion.sourceDocumentName || 'source document'}.`,
			part.sourceText ? `Source text: ${part.sourceText}` : '',
			`Accepted by ${acceptedByUser} on ${acceptedAt.slice(0, 10)}.`,
		].filter(Boolean).join('\n');

		nextItems.push({
			id: createServiceItemId(suggestion.id, part.id),
			category: part.userEditableCategory || part.category,
			name,
			details: `Matched as ${part.label}`,
			...(manufacturer ? { manufacturer } : {}),
			notes,
		});
	});

	return nextItems.length === existingItems.length ? undefined : nextItems;
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
	const resolvedRelatedSystemId = relatedSystemId || document.assignedDeviceId;
	const extractedFields = filterFieldsToMissingPropertyMemory({
		fields: extractPlaceholderFieldsFromDocument(
			document,
			resolvedRelatedSystemId,
		),
		property,
		systems,
		relatedSystemId: resolvedRelatedSystemId,
	});

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
		...(extractedFields.length > 0 ? { confidence: 0.55 } : {}),
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
	const resolvedRelatedSystemId = relatedSystemId || document.assignedDeviceId;
	const metadataFields = extractPlaceholderFieldsFromDocument(
		document,
		resolvedRelatedSystemId,
	);
	let extractionMethod: PropertyKnowledgeExtractionMethod = 'metadata_placeholder';
	let extractedFields = metadataFields;
	let suggestedParts: ExtractedPartSuggestion[] = [];

	if (file && String(file.type || '').startsWith('image/')) {
		try {
			const extractedText = await extractTextFromImageFile(file);
			const ocrFields = extractFieldsFromDocumentText(
				extractedText,
				resolvedRelatedSystemId,
			);
			suggestedParts = resolvedRelatedSystemId
				? extractPartSuggestionsFromDocumentText(extractedText)
				: [];
			if (ocrFields.length > 0 || suggestedParts.length > 0) {
				extractionMethod = 'image_ocr';
				if (ocrFields.length > 0) {
					extractedFields = dedupeFields([...ocrFields, ...metadataFields]);
				}
			}
		} catch (error) {
			console.warn('Property Knowledge OCR extraction failed:', error);
		}
	}

	extractedFields = filterFieldsToMissingPropertyMemory({
		fields: extractedFields,
		property,
		systems,
		relatedSystemId: resolvedRelatedSystemId,
	});

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
		...(extractedFields.length > 0 || suggestedParts.length > 0
			? { confidence: extractionMethod === 'image_ocr' ? 0.7 : 0.55 }
			: {}),
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
		partValues = {},
	}: ReviewKnowledgeSuggestionInput,
): PropertyKnowledgeSuggestion => ({
	...suggestion,
	status: 'accepted',
	reviewedAt,
	acceptedByUser,
	extractedFields: suggestion.extractedFields.map((field) => ({
		...field,
		userEditableValue: fieldValues[field.id] ?? field.userEditableValue ?? field.value,
		provenance: {
			sourceDocumentId: suggestion.sourceDocumentId,
			sourceDocumentType: suggestion.documentType,
			extractionMethod: suggestion.extractionMethod,
			...(field.confidence ?? suggestion.confidence
				? { confidence: field.confidence ?? suggestion.confidence }
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
			acceptedByUser,
			acceptedAt: reviewedAt,
			suggestionId: suggestion.id,
			sourceText: part.sourceText,
		},
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

	acceptedSuggestion.extractedFields.forEach((field) => {
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

	if (acceptedSuggestion.relatedSystemId && acceptedSuggestion.suggestedParts?.length) {
		const system = systems.find(
			(candidate) => String(candidate.id) === String(acceptedSuggestion.relatedSystemId),
		);
		if (system) {
			const nextServiceItems = buildServiceItemsFromAcceptedParts({
				suggestion: acceptedSuggestion,
				system,
				acceptedByUser,
				acceptedAt,
			});
			if (nextServiceItems) {
				const currentUpdates =
					systemUpdateMap.get(acceptedSuggestion.relatedSystemId) || {};
				currentUpdates.serviceItems = nextServiceItems;
				systemUpdateMap.set(acceptedSuggestion.relatedSystemId, currentUpdates);
			}
		}
	}

	return {
		propertyUpdates,
		systemUpdates: Array.from(systemUpdateMap.entries()).map(([id, updates]) => ({
			id,
			updates,
		})),
		contractorSuggestion: buildContractorSuggestion(
			acceptedSuggestion.extractedFields,
		),
		maintenanceHistorySuggestion: buildMaintenanceHistorySuggestion({
			fields: acceptedSuggestion.extractedFields,
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
