import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import * as zlib from 'zlib';
import { getMembership, hasAnyRole, resolveAccountIdForUser } from './accountAuthz';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const WRITER_ROLES = ['owner', 'admin', 'manager', 'editor', 'member'];
const MAX_PDF_BYTES = 10 * 1024 * 1024;

type ProcessDocumentRequest = {
	propertyId?: string;
	documentId?: string;
};

type PropertyDocumentRecord = {
	id?: string;
	name?: string;
	fileName?: string;
	type?: string;
	documentType?: string;
	category?: string;
	uploadedBy?: string;
	storagePath?: string;
	acquisitionStatus?: string;
	acquisitionStartedAt?: string;
	acquisitionWorkerStartedAt?: string;
	assignedDeviceId?: string;
	links?: {
		assetIds?: string[];
	};
	extractedKnowledgeSuggestionIds?: string[];
};

type ProcessPdfDocumentAcquisitionInput = {
	propertyId: string;
	documentId: string;
	triggeredBy: 'background' | 'manual';
};

type ProcessPdfDocumentAcquisitionResult = {
	success: boolean;
	suggestionCount?: number;
	suggestionId?: unknown;
	message?: string;
};

type ExtractedField = {
	id: string;
	fieldKey: string;
	label: string;
	value: string;
	confidence: number;
	confidenceLevel: 'high' | 'medium';
	confidenceReason: string;
	targetEntity: string;
	targetField: string;
	sourceText: string;
};

const toString = (value: unknown): string => String(value || '').trim();

const stripUndefinedDeep = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value
			.map((item) => stripUndefinedDeep(item))
			.filter((item) => item !== undefined);
	}

	if (value && typeof value === 'object') {
		const cleaned: Record<string, unknown> = {};
		for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
			const normalized = stripUndefinedDeep(nestedValue);
			if (normalized !== undefined) {
				cleaned[key] = normalized;
			}
		}
		return cleaned;
	}

	return value === undefined ? undefined : value;
};

const assertAuthenticated = (context: functions.https.CallableContext) => {
	const uid = toString(context.auth?.uid);
	if (!uid) {
		throw new functions.https.HttpsError(
			'unauthenticated',
			'You must be signed in to review document details.',
		);
	}
	return uid;
};

const assertCanProcessProperty = async (
	propertyData: Record<string, unknown>,
	uid: string,
) => {
	const accountId =
		toString(propertyData.accountId) ||
		toString(propertyData.userId) ||
		(await resolveAccountIdForUser(uid));
	const ownerId = toString(propertyData.userId);
	const coOwners = Array.isArray(propertyData.coOwners)
		? propertyData.coOwners.map(toString)
		: [];
	const administrators = Array.isArray(propertyData.administrators)
		? propertyData.administrators.map(toString)
		: [];

	if (ownerId === uid || coOwners.includes(uid) || administrators.includes(uid)) {
		return;
	}

	const membership = await getMembership(accountId, uid);
	if (hasAnyRole(membership, WRITER_ROLES)) {
		return;
	}

	throw new functions.https.HttpsError(
		'permission-denied',
		'You do not have permission to review documents for this property.',
	);
};

const isPdfDocument = (document: PropertyDocumentRecord) =>
	toString(document.type).toLowerCase().includes('pdf') ||
	toString(document.fileName || document.name).toLowerCase().endsWith('.pdf');

const updateDocumentInList = (
	documents: PropertyDocumentRecord[],
	documentId: string,
	updates: Record<string, unknown>,
) =>
	documents.map((document) =>
		toString(document.id) === documentId
			? stripUndefinedDeep({ ...document, ...updates })
			: document,
	);

const normalizeText = (text: string) =>
	text
		.replace(/\r/g, '\n')
		.replace(/[ \t]+/g, ' ')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

const decodePdfLiteral = (literal: string) =>
	literal.replace(/\\([nrtbf()\\])/g, (_match, escaped) => {
		if (escaped === 'n') return '\n';
		if (escaped === 'r') return '\r';
		if (escaped === 't') return '\t';
		if (escaped === 'b') return '\b';
		if (escaped === 'f') return '\f';
		return escaped;
	});

const decodeAscii85 = (input: string): Buffer => {
	const cleaned = input
		.replace(/^<~/, '')
		.replace(/~>$/, '')
		.replace(/\s+/g, '');
	const bytes: number[] = [];
	let group = '';

	const flushGroup = (value: string, isPartial: boolean) => {
		const padded = isPartial ? value.padEnd(5, 'u') : value;
		let tuple = 0;
		for (let index = 0; index < 5; index += 1) {
			tuple = tuple * 85 + (padded.charCodeAt(index) - 33);
		}
		const output = [
			(tuple >>> 24) & 0xff,
			(tuple >>> 16) & 0xff,
			(tuple >>> 8) & 0xff,
			tuple & 0xff,
		];
		bytes.push(...output.slice(0, isPartial ? value.length - 1 : 4));
	};

	for (let index = 0; index < cleaned.length; index += 1) {
		const char = cleaned[index];
		if (char === '~') break;
		if (char === 'z' && group.length === 0) {
			bytes.push(0, 0, 0, 0);
			continue;
		}
		group += char;
		if (group.length === 5) {
			flushGroup(group, false);
			group = '';
		}
	}

	if (group.length > 1) {
		flushGroup(group, true);
	}

	return Buffer.from(bytes);
};

const inflatePdfBytes = (value: Buffer) => {
	try {
		return zlib.inflateSync(value);
	} catch (_error) {
		return zlib.inflateRawSync(value);
	}
};

const decodePdfStream = (streamText: string, dictionaryText: string): string => {
	let streamBytes: Buffer = Buffer.from(
		streamText.replace(/^\r?\n/, '').replace(/\r?\n$/, ''),
		'latin1',
	);
	const hasAscii85 = /ASCII85Decode/i.test(dictionaryText);
	const hasFlate = /FlateDecode/i.test(dictionaryText);

	if (hasAscii85) {
		streamBytes = decodeAscii85(streamBytes.toString('latin1'));
	}
	if (hasFlate) {
		streamBytes = inflatePdfBytes(streamBytes);
	}

	return streamBytes.toString('latin1');
};

const extractTextFromPdfBuffer = (pdfBuffer: Buffer) => {
	const pdfText = pdfBuffer.toString('latin1');
	const streamRegex = /<<([\s\S]*?)>>\s*stream([\s\S]*?)endstream/g;
	const textParts: string[] = [];
	let match: RegExpExecArray | null;

	while ((match = streamRegex.exec(pdfText))) {
		try {
			const decodedStream = decodePdfStream(match[2], match[1]);
			const literalRegex = /\((?:\\.|[^\\()])*\)/g;
			let literalMatch: RegExpExecArray | null;

			while ((literalMatch = literalRegex.exec(decodedStream))) {
				const literal = literalMatch[0].slice(1, -1);
				const decoded = decodePdfLiteral(literal).trim();
				if (decoded) textParts.push(decoded);
			}
		} catch (error) {
			console.warn('Could not decode one PDF content stream:', error);
		}
	}

	return normalizeText(textParts.join('\n'));
};

const linesFromText = (text: string) =>
	normalizeText(text)
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

const findLabeledValue = (lines: string[], labels: string[]) => {
	const normalizedLabels = labels.map((label) => label.toLowerCase());
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const lower = line.toLowerCase();
		for (const label of normalizedLabels) {
			if (lower === label || lower === `${label}:`) {
				return lines[index + 1] || '';
			}
			if (lower.startsWith(`${label}:`)) {
				return line.slice(label.length + 1).trim();
			}
			if (lower.startsWith(label) && lower.length > label.length) {
				const value = line.slice(label.length).replace(/^[:#\s-]+/, '').trim();
				if (value) return value;
			}
		}
	}
	return '';
};

const findDate = (lines: string[], labels: string[]) =>
	findLabeledValue(lines, labels).match(/[A-Za-z]+ \d{1,2}, \d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/)?.[0] ||
	'';

const findMoney = (lines: string[], labels: string[]) => {
	const value = findLabeledValue(lines, labels);
	return value.match(/\$?\s*-?\d[\d,]*\.?\d{0,2}/)?.[0] || '';
};

const findPhone = (text: string) =>
	text.match(/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/)?.[0] || '';

const findWebsite = (text: string) =>
	text.match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?/i)?.[0] || '';

const findContractorName = (lines: string[]) => {
	const explicit = findLabeledValue(lines, ['Contractor', 'Vendor', 'Company']);
	if (explicit) return explicit;
	return (
		lines.find((line) =>
			/\b(LLC|Inc\.?|Co\.?|Company|HVAC|Heating|Cooling|Plumbing|Appliance|Repair)\b/i.test(line),
		) || ''
	);
};

const inferAssetType = (text: string) => {
	const lower = text.toLowerCase();
	if (lower.includes('refrigerator') || lower.includes('fridge')) {
		return 'Refrigerator';
	}
	if (lower.includes('water heater') || lower.includes('tankless')) {
		return 'Water Heater';
	}
	if (
		lower.includes('hvac') ||
		lower.includes('heat pump') ||
		lower.includes('furnace') ||
		lower.includes('air conditioner') ||
		lower.includes('condenser') ||
		lower.includes('air handler')
	) {
		return 'HVAC';
	}
	if (lower.includes('dishwasher')) return 'Dishwasher';
	if (lower.includes('washer')) return 'Washer';
	if (lower.includes('dryer')) return 'Dryer';
	if (lower.includes('oven') || lower.includes('stove') || lower.includes('range')) {
		return 'Range / Oven';
	}
	return '';
};

const inferAssetVariant = (assetType: string, text: string) => {
	const lower = text.toLowerCase();
	if (assetType === 'HVAC') {
		if (lower.includes('mini split')) return 'Mini Split';
		if (lower.includes('central ac') || lower.includes('central air')) return 'Central AC';
		if (lower.includes('furnace')) return 'Furnace';
		if (lower.includes('heat pump')) return 'Heat Pump';
		if (lower.includes('air handler')) return 'Air Handler';
	}
	if (assetType === 'Refrigerator') {
		if (lower.includes('french door')) return 'French Door';
		if (lower.includes('side-by-side') || lower.includes('side by side')) return 'Side-by-Side';
		if (lower.includes('bottom freezer')) return 'Bottom Freezer';
		if (lower.includes('top freezer')) return 'Top Freezer';
	}
	return '';
};

const FIELD_META: Record<string, { label: string; targetEntity: string; targetField: string }> = {
	assetType: { label: 'Asset type', targetEntity: 'system', targetField: 'assetType' },
	assetVariant: { label: 'Asset variant', targetEntity: 'system', targetField: 'assetVariant' },
	brand: { label: 'Brand', targetEntity: 'system', targetField: 'brand' },
	model: { label: 'Model', targetEntity: 'system', targetField: 'model' },
	serialNumber: { label: 'Serial number', targetEntity: 'system', targetField: 'serialNumber' },
	installDate: { label: 'Install date', targetEntity: 'system', targetField: 'installationDate' },
	warrantyLength: { label: 'Warranty length', targetEntity: 'warranty', targetField: 'length' },
	contractorName: { label: 'Contractor name', targetEntity: 'contractor', targetField: 'name' },
	contractorPhone: { label: 'Contractor phone', targetEntity: 'contractor', targetField: 'phone' },
	contractorWebsite: { label: 'Contractor website', targetEntity: 'contractor', targetField: 'website' },
	invoiceNumber: { label: 'Invoice number', targetEntity: 'maintenanceHistory', targetField: 'invoiceNumber' },
	invoiceDate: { label: 'Invoice date', targetEntity: 'maintenanceHistory', targetField: 'invoiceDate' },
	maintenanceEventDate: { label: 'Maintenance date', targetEntity: 'maintenanceHistory', targetField: 'date' },
	maintenanceEventDescription: { label: 'Maintenance description', targetEntity: 'maintenanceHistory', targetField: 'description' },
	servicePerformed: { label: 'Service performed', targetEntity: 'maintenanceHistory', targetField: 'servicePerformed' },
	partsReplaced: { label: 'Parts and supplies', targetEntity: 'maintenanceHistory', targetField: 'partsReplaced' },
	totalCost: { label: 'Total cost', targetEntity: 'maintenanceHistory', targetField: 'totalCost' },
	laborCost: { label: 'Labor cost', targetEntity: 'maintenanceHistory', targetField: 'laborCost' },
	partsCost: { label: 'Parts cost', targetEntity: 'maintenanceHistory', targetField: 'partsCost' },
	taxAmount: { label: 'Tax amount', targetEntity: 'maintenanceHistory', targetField: 'taxAmount' },
	currency: { label: 'Currency', targetEntity: 'maintenanceHistory', targetField: 'currency' },
};

const createField = (
	fields: ExtractedField[],
	fieldKey: string,
	value: string,
	sourceText: string,
	confidenceLevel: 'high' | 'medium',
	confidenceReason: string,
) => {
	const normalizedValue = toString(value);
	const meta = FIELD_META[fieldKey];
	if (!normalizedValue || !meta) return;
	fields.push({
		id: `${fieldKey}-${fields.length + 1}`,
		fieldKey,
		label: meta.label,
		value: normalizedValue,
		confidence: confidenceLevel === 'high' ? 0.9 : 0.68,
		confidenceLevel,
		confidenceReason,
		targetEntity: meta.targetEntity,
		targetField: meta.targetField,
		sourceText,
	});
};

const extractFieldsFromPdfText = (text: string) => {
	const lines = linesFromText(text);
	const fields: ExtractedField[] = [];
	const assetType = inferAssetType(text);
	const assetVariant = assetType ? inferAssetVariant(assetType, text) : '';

	createField(fields, 'assetType', assetType, 'Detected equipment type', 'medium', 'Inferred from recognized equipment wording.');
	createField(fields, 'assetVariant', assetVariant, 'Detected equipment variant', 'medium', 'Inferred from recognized equipment wording.');
	createField(fields, 'contractorName', findContractorName(lines), 'Contractor header', 'medium', 'Matched from document header.');
	createField(fields, 'contractorPhone', findPhone(text), 'Contractor contact', 'high', 'Document contains a clear phone number.');
	createField(fields, 'contractorWebsite', findWebsite(text), 'Contractor contact', 'high', 'Document contains a clear website.');
	createField(fields, 'invoiceNumber', findLabeledValue(lines, ['Invoice Number', 'Invoice #', 'Invoice No']), 'Invoice details', 'high', 'Document clearly labels this invoice number.');
	createField(fields, 'invoiceDate', findDate(lines, ['Invoice Date']), 'Invoice details', 'high', 'Document clearly labels this invoice date.');
	createField(fields, 'maintenanceEventDate', findDate(lines, ['Service Date', 'Repair Date', 'Work Date']), 'Service details', 'high', 'Document clearly labels this service date.');
	createField(fields, 'brand', findLabeledValue(lines, ['Brand', 'Manufacturer', 'Make']), 'System information', 'high', 'Document clearly labels this system brand.');
	createField(fields, 'model', findLabeledValue(lines, ['Model', 'Model Number', 'Model No']), 'System information', 'high', 'Document clearly labels this system model.');
	createField(fields, 'serialNumber', findLabeledValue(lines, ['Serial Number', 'Serial No', 'Serial']), 'System information', 'high', 'Document clearly labels this serial number.');
	createField(fields, 'installDate', findDate(lines, ['Installation Date', 'Install Date', 'Installed']), 'System information', 'high', 'Document clearly labels this installation date.');
	createField(fields, 'warrantyLength', findLabeledValue(lines, ['Warranty']), 'Warranty information', 'high', 'Document clearly labels this warranty information.');
	createField(fields, 'maintenanceEventDescription', findLabeledValue(lines, ['Description', 'Service Description', 'Equipment Type']) || assetType, 'Service description', 'medium', 'Matched from service description text.');
	createField(fields, 'servicePerformed', findLabeledValue(lines, ['Service Performed', 'Work Performed', 'Notes']), 'Service notes', 'medium', 'Matched from service notes text.');
	createField(fields, 'totalCost', findMoney(lines, ['Total Due', 'Total', 'Amount Due']), 'Invoice total', 'high', 'Document clearly labels this total.');
	createField(fields, 'laborCost', findMoney(lines, ['Labor', 'Labor Cost']), 'Invoice line item', 'high', 'Document clearly labels this labor cost.');
	createField(fields, 'partsCost', findMoney(lines, ['Parts', 'Parts Cost', 'Materials']), 'Invoice line item', 'high', 'Document clearly labels this parts cost.');
	createField(fields, 'taxAmount', findMoney(lines, ['Tax', 'Sales Tax']), 'Invoice tax', 'high', 'Document clearly labels this tax amount.');

	if (fields.some((field) => ['totalCost', 'laborCost', 'partsCost', 'taxAmount'].includes(field.fieldKey))) {
		createField(fields, 'currency', 'USD', 'Invoice currency', 'high', 'Derived from dollar amounts in the document.');
	}

	return fields;
};

const createSuggestionId = (documentId: string, createdAt: string) =>
	`knowledge-${documentId}-${new Date(createdAt).getTime()}`.replace(/[^a-zA-Z0-9_-]/g, '-');

const createDocumentScanCompletedNotification = async ({
	propertyId,
	propertyData,
	document,
	suggestionId,
	suggestionCount,
	nowIso,
}: {
	propertyId: string;
	propertyData: Record<string, unknown>;
	document: PropertyDocumentRecord;
	suggestionId: string;
	suggestionCount: number;
	nowIso: string;
}) => {
	const userId =
		toString(document.uploadedBy) ||
		toString(propertyData.userId) ||
		toString(propertyData.accountId);
	if (!userId) return;

	const documentName = toString(document.fileName || document.name) || 'document';
	const propertyTitle =
		toString(propertyData.title) ||
		toString(propertyData.name) ||
		'this property';

	await db.collection('notifications').add(
		stripUndefinedDeep({
			userId,
			type: 'document_scan_completed',
			title: 'Suggested Details Ready',
			message: `Maintley found ${suggestionCount} suggested detail${suggestionCount === 1 ? '' : 's'} in ${documentName}.`,
			data: {
				propertyId,
				propertyTitle,
				documentId: toString(document.id),
				documentName,
				suggestionId,
				suggestionCount,
			},
			status: 'unread',
			actionUrl: `/properties/${propertyId}`,
			createdAt: nowIso,
			updatedAt: nowIso,
		}) as Record<string, unknown>,
	);
};

const classifyDocumentType = (document: PropertyDocumentRecord) => {
	const explicit = toString(document.documentType);
	if (explicit && explicit !== 'unknown' && explicit !== 'other') return explicit;
	const name = toString(document.fileName || document.name).toLowerCase();
	if (name.includes('invoice')) return 'invoice';
	if (name.includes('receipt')) return 'receipt';
	if (name.includes('warranty')) return 'warranty';
	if (name.includes('inspection') || name.includes('report')) return 'inspection_report';
	if (name.includes('manual')) return 'manual';
	return 'unknown';
};

const PROCESSING_LOCK_STALE_MS = 10 * 60 * 1000;

const isRecentProcessingLock = (document: PropertyDocumentRecord) => {
	const startedAt = toString(document.acquisitionWorkerStartedAt);
	if (!startedAt) return false;
	const startedAtMs = new Date(startedAt).getTime();
	if (Number.isNaN(startedAtMs)) return false;
	return Date.now() - startedAtMs < PROCESSING_LOCK_STALE_MS;
};

const shouldBackgroundProcessDocument = (document: PropertyDocumentRecord) =>
	toString(document.id) &&
	isPdfDocument(document) &&
	toString(document.storagePath) &&
	toString(document.acquisitionStatus) === 'processing' &&
	!isRecentProcessingLock(document);

const hasDocumentChangedForProcessing = (
	before?: PropertyDocumentRecord,
	after?: PropertyDocumentRecord,
) => {
	if (!after || !shouldBackgroundProcessDocument(after)) {
		return false;
	}
	if (!before) {
		return true;
	}

	return (
		toString(before.acquisitionStatus) !== toString(after.acquisitionStatus) ||
		toString(before.storagePath) !== toString(after.storagePath) ||
		toString(before.acquisitionStartedAt) !== toString(after.acquisitionStartedAt)
	);
};

const getProcessableDocumentIds = (
	beforeDocuments: PropertyDocumentRecord[],
	afterDocuments: PropertyDocumentRecord[],
) => {
	const beforeById = new Map<string, PropertyDocumentRecord>();
	beforeDocuments.forEach((document) => {
		const id = toString(document.id);
		if (id) beforeById.set(id, document);
	});

	return afterDocuments
		.filter((document) =>
			hasDocumentChangedForProcessing(
				beforeById.get(toString(document.id)),
				document,
			),
		)
		.map((document) => toString(document.id))
		.filter(Boolean);
};

const lockDocumentForProcessing = async ({
	propertyRef,
	documentId,
	triggeredBy,
}: {
	propertyRef: FirebaseFirestore.DocumentReference;
	documentId: string;
	triggeredBy: ProcessPdfDocumentAcquisitionInput['triggeredBy'];
}) => {
	const nowIso = new Date().toISOString();

	return db.runTransaction(async (transaction) => {
		const snapshot = await transaction.get(propertyRef);
		if (!snapshot.exists) {
			throw new functions.https.HttpsError('not-found', 'Property not found.');
		}

		const propertyData = snapshot.data() || {};
		const documents = Array.isArray(propertyData.documents)
			? (propertyData.documents as PropertyDocumentRecord[])
			: [];
		const document = documents.find(
			(candidate) => toString(candidate.id) === documentId,
		);

		if (!document) {
			throw new functions.https.HttpsError('not-found', 'Document not found.');
		}
		if (!isPdfDocument(document)) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Only PDF documents are supported by this processor.',
			);
		}
		if (!toString(document.storagePath)) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'This document does not have a storage path.',
			);
		}
		if (
			triggeredBy === 'background' &&
			toString(document.acquisitionStatus) !== 'processing'
		) {
			return null;
		}
		if (triggeredBy === 'background' && isRecentProcessingLock(document)) {
			return null;
		}

		const nextDocuments = updateDocumentInList(documents, documentId, {
			acquisitionStatus: 'processing',
			acquisitionStartedAt: toString(document.acquisitionStartedAt) || nowIso,
			acquisitionWorkerStartedAt: nowIso,
			acquisitionError: '',
		});

		transaction.update(propertyRef, {
			documents: nextDocuments,
			updatedAt: nowIso,
		});

		return {
			propertyData,
			document: {
				...document,
				acquisitionStatus: 'processing',
				acquisitionStartedAt: toString(document.acquisitionStartedAt) || nowIso,
				acquisitionWorkerStartedAt: nowIso,
				acquisitionError: '',
			} as PropertyDocumentRecord,
			documents,
		};
	});
};

const processPdfDocumentAcquisition = async ({
	propertyId,
	documentId,
	triggeredBy,
}: ProcessPdfDocumentAcquisitionInput): Promise<ProcessPdfDocumentAcquisitionResult> => {
	const propertyRef = db.collection('properties').doc(propertyId);
	const locked = await lockDocumentForProcessing({
		propertyRef,
		documentId,
		triggeredBy,
	});

	if (!locked) {
		return {
			success: false,
			suggestionCount: 0,
			message: 'Document is not ready for processing.',
		};
	}

	const { propertyData, document, documents } = locked;
	const storagePath = toString(document.storagePath);

	try {
		const [pdfBuffer] = await admin.storage().bucket().file(storagePath).download();
		if (pdfBuffer.length > MAX_PDF_BYTES) {
			throw new Error('PDF is larger than the current 10MB processing limit.');
		}

		const extractedText = extractTextFromPdfBuffer(pdfBuffer);
		const extractedFields = extractFieldsFromPdfText(extractedText);
		const completedAt = new Date().toISOString();

		if (!extractedText || extractedFields.length === 0) {
			const latestSnapshot = await propertyRef.get();
			const latestData = latestSnapshot.data() || {};
			const latestDocuments = Array.isArray(latestData.documents)
				? (latestData.documents as PropertyDocumentRecord[])
				: documents;
			await propertyRef.update({
				documents: updateDocumentInList(latestDocuments, documentId, {
					acquisitionStatus: 'failed',
					acquisitionCompletedAt: completedAt,
					acquisitionWorkerCompletedAt: completedAt,
					acquisitionError:
						'Maintley could not read useful text from this PDF yet. Scanned PDFs will need the rendered-page OCR processor.',
				}),
				updatedAt: completedAt,
			});
			return {
				success: false,
				suggestionCount: 0,
				message: 'No readable PDF text found.',
			};
		}

		const suggestion = stripUndefinedDeep({
			id: createSuggestionId(documentId, completedAt),
			sourceDocumentId: documentId,
			propertyId,
			relatedSystemId:
				toString(document.assignedDeviceId) ||
				toString(document.links?.assetIds?.[0]) ||
				undefined,
			documentType: classifyDocumentType(document),
			extractionMethod: 'pdf_text',
			extractedFields,
			confidence:
				extractedFields.reduce((sum, field) => sum + field.confidence, 0) /
				extractedFields.length,
			status: 'pending',
			createdAt: completedAt,
			sourceDocumentName: document.fileName || document.name,
		}) as Record<string, unknown>;

		const latestSnapshot = await propertyRef.get();
		const latestData = latestSnapshot.data() || {};
		const latestDocuments = Array.isArray(latestData.documents)
			? (latestData.documents as PropertyDocumentRecord[])
			: documents;
		const latestSuggestions = Array.isArray(latestData.knowledgeSuggestions)
			? (latestData.knowledgeSuggestions as Record<string, unknown>[])
			: [];
		const nextSuggestions = [
			...latestSuggestions.filter(
				(existing) =>
					toString(existing.sourceDocumentId) !== documentId ||
					toString(existing.status) !== 'pending',
			),
			suggestion,
		];

		await propertyRef.update({
			documents: updateDocumentInList(latestDocuments, documentId, {
				acquisitionStatus: 'pending_review',
				acquisitionCompletedAt: completedAt,
				acquisitionWorkerCompletedAt: completedAt,
				acquisitionError: '',
				extractedKnowledgeSuggestionIds: Array.from(
					new Set([
						...(document.extractedKnowledgeSuggestionIds || []),
						toString(suggestion.id),
					]),
				),
			}),
			knowledgeSuggestions: nextSuggestions,
			updatedAt: completedAt,
		});

		await createDocumentScanCompletedNotification({
			propertyId,
			propertyData: latestData,
			document,
			suggestionId: toString(suggestion.id),
			suggestionCount: extractedFields.length,
			nowIso: completedAt,
		});

		return {
			success: true,
			suggestionCount: extractedFields.length,
			suggestionId: suggestion.id,
		};
	} catch (error: any) {
		const completedAt = new Date().toISOString();
		const latestSnapshot = await propertyRef.get();
		const latestData = latestSnapshot.data() || {};
		const latestDocuments = Array.isArray(latestData.documents)
			? (latestData.documents as PropertyDocumentRecord[])
			: documents;

		await propertyRef.update({
			documents: updateDocumentInList(latestDocuments, documentId, {
				acquisitionStatus: 'failed',
				acquisitionCompletedAt: completedAt,
				acquisitionWorkerCompletedAt: completedAt,
				acquisitionError:
					error?.message ||
					'Maintley could not review this PDF. Please try again later.',
			}),
			updatedAt: completedAt,
		});

		console.error('PDF property knowledge acquisition failed:', error);
		throw error;
	}
};

export const processPropertyDocumentAcquisition = functions
	.region('us-central1')
	.runWith({ timeoutSeconds: 120, memory: '512MB' })
	.https.onCall(async (data: ProcessDocumentRequest, context) => {
		const uid = assertAuthenticated(context);
		const propertyId = toString(data?.propertyId);
		const documentId = toString(data?.documentId);
		if (!propertyId || !documentId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'propertyId and documentId are required.',
			);
		}

		const propertyRef = db.collection('properties').doc(propertyId);
		const propertySnapshot = await propertyRef.get();
		if (!propertySnapshot.exists) {
			throw new functions.https.HttpsError('not-found', 'Property not found.');
		}

		const propertyData = propertySnapshot.data() || {};
		await assertCanProcessProperty(propertyData, uid);

		try {
			return await processPdfDocumentAcquisition({
				propertyId,
				documentId,
				triggeredBy: 'manual',
			});
		} catch (error: any) {
			if (error instanceof functions.https.HttpsError) {
				throw error;
			}
			throw new functions.https.HttpsError(
				'internal',
				error?.message || 'Could not review this PDF.',
			);
		}
	});

export const processPropertyDocumentAcquisitionRequests = functions
	.region('us-central1')
	.runWith({ timeoutSeconds: 120, memory: '512MB' })
	.firestore.document('properties/{propertyId}')
	.onUpdate(async (change, context) => {
		const beforeData = change.before.data() || {};
		const afterData = change.after.data() || {};
		const beforeDocuments = Array.isArray(beforeData.documents)
			? (beforeData.documents as PropertyDocumentRecord[])
			: [];
		const afterDocuments = Array.isArray(afterData.documents)
			? (afterData.documents as PropertyDocumentRecord[])
			: [];
		const documentIds = getProcessableDocumentIds(beforeDocuments, afterDocuments);

		for (const documentId of documentIds) {
			try {
				await processPdfDocumentAcquisition({
					propertyId: context.params.propertyId,
					documentId,
					triggeredBy: 'background',
				});
			} catch (error) {
				console.error(
					`Background PDF acquisition failed for property ${context.params.propertyId}, document ${documentId}:`,
					error,
				);
			}
		}
	});
