import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import * as zlib from 'zlib';
import { getMembership, hasAnyRole, resolveAccountIdForUser } from './accountAuthz';
import {
	MaintleyEventType,
	publishMaintleyEventRecord,
} from './maintleyEventEngine';
import {
	SubscriptionEntitlementLike,
	hasAccountCapability,
} from './subscriptionEntitlements';
import { extractDocxServiceReport } from './docxServiceReport';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const WRITER_ROLES = ['owner', 'admin', 'manager', 'editor', 'member'];
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const PROPERTY_DOCUMENTS_COLLECTION = 'propertyDocuments';
const PROPERTY_KNOWLEDGE_SUGGESTIONS_COLLECTION = 'propertyKnowledgeSuggestions';

type ProcessDocumentRequest = {
	propertyId?: string;
	documentId?: string;
};

type PropertyDocumentRecord = {
	id?: string;
	accountId?: string;
	propertyId?: string;
	name?: string;
	fileName?: string;
	type?: string;
	documentType?: string;
	category?: string;
	uploadedBy?: string;
	storagePath?: string;
	acquisitionStatus?: string;
	acquisitionStartedAt?: string;
	acquisitionCompletedAt?: string;
	acquisitionError?: string;
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

type PropertyConfirmation = {
	status: 'needs_confirmation';
	documentAddress: string;
	propertyAddress: string;
	sourceLabel: string;
	reason: string;
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

const isDocxDocument = (document: PropertyDocumentRecord) =>
	toString(document.type).toLowerCase().includes('wordprocessingml') ||
	toString(document.fileName || document.name).toLowerCase().endsWith('.docx');

const isProcessableDocument = (document: PropertyDocumentRecord) =>
	isPdfDocument(document) || isDocxDocument(document);

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

const getPropertyAccountId = (propertyData: Record<string, unknown>) =>
	toString(propertyData.accountId) || toString(propertyData.userId);

const getSubscriptionFromRecord = (
	data?: FirebaseFirestore.DocumentData,
): SubscriptionEntitlementLike | null => {
	const subscription = data?.subscription;
	return subscription && typeof subscription === 'object'
		? (subscription as SubscriptionEntitlementLike)
		: null;
};

const loadAccountSubscription = async (
	accountId: string,
	fallbackUserId?: string,
): Promise<SubscriptionEntitlementLike | null> => {
	const accountDocumentIds = [
		accountId,
		fallbackUserId && fallbackUserId !== accountId ? fallbackUserId : '',
	].filter(Boolean);

	for (const documentId of accountDocumentIds) {
		const familyAccountSnapshot = await db
			.collection('familyAccounts')
			.doc(documentId)
			.get();
		const familyAccountSubscription = getSubscriptionFromRecord(
			familyAccountSnapshot.data(),
		);
		if (familyAccountSubscription) {
			return familyAccountSubscription;
		}
	}

	for (const documentId of accountDocumentIds) {
		const userSnapshot = await db.collection('users').doc(documentId).get();
		const userSubscription = getSubscriptionFromRecord(userSnapshot.data());
		if (userSubscription) {
			return userSubscription;
		}
	}

	return null;
};

const assertCanUsePropertyKnowledgeAcquisitionForProperty = async (
	propertyData: Record<string, unknown>,
) => {
	const accountId = getPropertyAccountId(propertyData);
	const ownerId = toString(propertyData.userId);
	const subscription = await loadAccountSubscription(accountId, ownerId);
	if (
		await hasAccountCapability(
			accountId || ownerId,
			subscription,
			'property_knowledge.acquire',
		)
	) {
		return;
	}

	throw new functions.https.HttpsError(
		'permission-denied',
		'Suggested details from documents are available with Homeowner+.',
	);
};

const buildDocumentCollectionRecord = ({
	propertyId,
	propertyData,
	document,
	updates = {},
	nowIso = new Date().toISOString(),
}: {
	propertyId: string;
	propertyData: Record<string, unknown>;
	document: PropertyDocumentRecord;
	updates?: Record<string, unknown>;
	nowIso?: string;
}): Record<string, unknown> =>
	stripUndefinedDeep({
		...document,
		...updates,
		id: toString(document.id),
		accountId: toString(document.accountId) || getPropertyAccountId(propertyData),
		propertyId,
		updatedAt: nowIso,
	}) as Record<string, unknown>;

const buildSuggestionCollectionRecord = ({
	propertyData,
	suggestion,
	nowIso = new Date().toISOString(),
}: {
	propertyData: Record<string, unknown>;
	suggestion: Record<string, unknown>;
	nowIso?: string;
}): Record<string, unknown> =>
	stripUndefinedDeep({
		...suggestion,
		accountId: toString(suggestion.accountId) || getPropertyAccountId(propertyData),
		updatedAt: nowIso,
	}) as Record<string, unknown>;

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

const WARRANTY_UNAVAILABLE_PATTERN =
	/\b(not provided|not included|unavailable|none|n\/a|no warranty paperwork|paperwork not provided)\b/i;

const normalizeWarrantyValue = (value?: string) =>
	toString(value)
		.replace(/^warranty\s*:?/i, '')
		.trim();

const extractWarrantySentence = (value?: string) => {
	const text = normalizeWarrantyValue(value);
	if (!text) return '';

	const warrantySentence = text
		.split(/(?<=[.!?])\s+/)
		.find((sentence) => /warranty/i.test(sentence));

	return toString(warrantySentence || text);
};

const findWarrantyInformation = (lines: string[]) => {
	const workmanshipWarrantyLine = lines.find(
		(line) =>
			/warranty/i.test(line) &&
			/\b(workmanship|repair|labor)\b/i.test(line) &&
			!WARRANTY_UNAVAILABLE_PATTERN.test(line),
	);
	if (workmanshipWarrantyLine) {
		return extractWarrantySentence(workmanshipWarrantyLine);
	}

	const labeledWarranty = findLabeledValue(lines, ['Warranty']);
	if (
		labeledWarranty &&
		!WARRANTY_UNAVAILABLE_PATTERN.test(labeledWarranty)
	) {
		return extractWarrantySentence(labeledWarranty);
	}

	const warrantyLine = lines.find(
		(line) =>
			/warranty/i.test(line) &&
			!/\bwarranty\s+paperwork\b/i.test(line) &&
			!WARRANTY_UNAVAILABLE_PATTERN.test(line),
	);

	return extractWarrantySentence(warrantyLine);
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
	toString(value)
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
	const unit =
		normalized.match(/\b(?:apt|apartment|unit|suite|ste|#)\s*([a-z0-9-]+)\b/)?.[1] ||
		'';
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

const extractLabeledPropertyAddress = (lines: string[]) => {
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		for (const label of PROPERTY_LOCATION_ADDRESS_LABELS) {
			const lower = line.toLowerCase();
			const normalizedLabel = label.toLowerCase();
			if (
				lower !== normalizedLabel &&
				lower !== `${normalizedLabel}:` &&
				!lower.startsWith(`${normalizedLabel}:`) &&
				!lower.startsWith(`${normalizedLabel} `)
			) {
				continue;
			}

			const inlineValue = line
				.slice(label.length)
				.replace(/^[:#\s-]+/, '')
				.trim();
			const parts = inlineValue ? [inlineValue] : [];
			for (
				let nextIndex = index + 1;
				nextIndex < lines.length && parts.length < 3;
				nextIndex += 1
			) {
				const nextLine = lines[nextIndex];
				if (/^(invoice|description|payment|technician|system information)\b/i.test(nextLine)) {
					break;
				}
				if (
					PROPERTY_LOCATION_ADDRESS_LABELS.some((candidateLabel) =>
						nextLine.toLowerCase().startsWith(candidateLabel.toLowerCase()),
					)
				) {
					break;
				}
				parts.push(nextLine);
				if (/\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/.test(nextLine)) {
					break;
				}
			}

			const value = parts.join(', ').trim();
			if (value) return { label, value };
		}
	}
	return undefined;
};

const buildPropertyConfirmationFromPdfText = (
	text: string,
	propertyAddress?: unknown,
): PropertyConfirmation | undefined => {
	const selectedPropertyAddress = toString(propertyAddress);
	if (!selectedPropertyAddress) return undefined;

	const candidate = extractLabeledPropertyAddress(linesFromText(text));
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
		documentAddress.unit &&
		savedAddress.unit &&
		documentAddress.unit !== savedAddress.unit
	) {
		conflicts.push('apartment/unit');
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

	if (conflicts.length === 0) return undefined;

	return {
		status: 'needs_confirmation',
		documentAddress: candidate.value,
		propertyAddress: selectedPropertyAddress,
		sourceLabel: candidate.label,
		reason: `Detected ${candidate.label.toLowerCase()} conflicts with the selected property's ${conflicts.join(', ')}.`,
	};
};

const CONTRACTOR_ENTITY_PATTERN =
	/\b(LLC|Inc\.?|Ltd\.?|Co\.?|Company|Contractor)\b/i;

const CONTRACTOR_TRADE_PATTERN =
	/\b(HVAC|Heating|Cooling|Plumbing|Electric(?:al)?|Roofing|Landscap(?:e|ing)?|Pest|Appliance|Repair)\b/i;

const CONTRACTOR_EXCLUDE_PATTERN =
	/invoice|bill to|job address|technician|license|payment|pay online|payment options|routing|account|check by mail|authorized|warranty information|thank you|subtotal|total due|due date|service date|@|www\.|https?:|\.com|\.net|\.org|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/i;

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

const findContractorName = (lines: string[]) => {
	const explicit = findLabeledValue(lines, ['Contractor', 'Vendor', 'Company']);
	if (
		explicit &&
		!CONTRACTOR_EXCLUDE_PATTERN.test(explicit) &&
		!isLikelyAddressLine(explicit) &&
		getContractorCandidateScore(explicit) >= 3
	) {
		return explicit;
	}
	const headerEndIndex = lines.findIndex((line) =>
		CONTRACTOR_SECTION_END_PATTERN.test(line),
	);
	const headerLines = headerEndIndex > 0 ? lines.slice(0, headerEndIndex) : lines;
	const candidates = headerLines
		.filter((line) => CONTRACTOR_TRADE_PATTERN.test(line) || CONTRACTOR_ENTITY_PATTERN.test(line))
		.filter((line) => !CONTRACTOR_EXCLUDE_PATTERN.test(line))
		.filter((line) => !isLikelyAddressLine(line))
		.map((line) => ({
			line,
			score: getContractorCandidateScore(line),
		}))
		.filter((candidate) => candidate.score >= 3)
		.sort((left, right) => right.score - left.score);
	return candidates[0]?.line || '';
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
	performedByName: { label: 'Performed by', targetEntity: 'maintenanceHistory', targetField: 'performedByName' },
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
	createField(fields, 'invoiceNumber', findLabeledValue(lines, ['Invoice Number', 'Report / Invoice #', 'Report / Invoice', 'Invoice #', 'Invoice No']), 'Invoice details', 'high', 'Document clearly labels this invoice number.');
	createField(fields, 'invoiceDate', findDate(lines, ['Invoice Date', 'Date']), 'Invoice details', 'high', 'Document clearly labels this invoice date.');
	createField(fields, 'maintenanceEventDate', findDate(lines, ['Service Date', 'Repair Date', 'Work Date']), 'Service details', 'high', 'Document clearly labels this service date.');
	createField(fields, 'brand', findLabeledValue(lines, ['Brand', 'Manufacturer', 'Make']), 'System information', 'high', 'Document clearly labels this system brand.');
	createField(fields, 'model', findLabeledValue(lines, ['Model', 'Model Number', 'Model No']), 'System information', 'high', 'Document clearly labels this system model.');
	createField(fields, 'serialNumber', findLabeledValue(lines, ['Serial Number', 'Serial No', 'Serial']), 'System information', 'high', 'Document clearly labels this serial number.');
	createField(fields, 'installDate', findDate(lines, ['Installation Date', 'Install Date', 'Installed']), 'System information', 'high', 'Document clearly labels this installation date.');
	createField(fields, 'warrantyLength', findWarrantyInformation(lines), 'Warranty information', 'high', 'Document clearly labels this warranty information.');
	createField(fields, 'maintenanceEventDescription', findLabeledValue(lines, ['Description', 'Service Description', 'Equipment Type']) || assetType, 'Service description', 'medium', 'Matched from service description text.');
	createField(fields, 'servicePerformed', findLabeledValue(lines, ['Service Performed', 'Work Performed', 'Notes']), 'Service notes', 'medium', 'Matched from service notes text.');
	createField(fields, 'totalCost', findMoney(lines, ['Invoice Total', 'Total Due', 'Total', 'Amount Due']), 'Invoice total', 'high', 'Document clearly labels this total.');
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

const publishDocumentAcquisitionEvent = async ({
	propertyId,
	propertyData,
	document,
	suggestionId,
	suggestionCount,
	nowIso,
	type,
	status,
	title,
	message,
	push,
	errorMessage,
}: {
	propertyId: string;
	propertyData: Record<string, unknown>;
	document: PropertyDocumentRecord;
	suggestionId?: string;
	suggestionCount?: number;
	nowIso: string;
	type: MaintleyEventType;
	status: 'processing' | 'ready' | 'failed';
	title: string;
	message: string;
	push?: boolean;
	errorMessage?: string;
}) => {
	const userId =
		toString(document.uploadedBy) ||
		toString(propertyData.userId) ||
		toString(propertyData.accountId);
	if (!userId) return;

	const accountId =
		toString(propertyData.accountId) ||
		toString(propertyData.userId) ||
		userId;
	const documentName = toString(document.fileName || document.name) || 'document';
	const propertyTitle =
		toString(propertyData.title) ||
		toString(propertyData.name) ||
		'this property';

	await publishMaintleyEventRecord({
		accountId,
		userId,
		recipientIds: [userId],
		propertyId,
		relatedDocumentId: toString(document.id),
		relatedScanId: suggestionId,
		type,
		workflowKey: 'property-knowledge-acquisition',
		entityKey: `document:${toString(document.id)}`,
		title,
		message,
		status,
		priority: type === 'document_review_failed' ? 'high' : 'normal',
		actionLabel:
			type === 'document_review_started' ? undefined : 'Review details',
		actionUrl: `/properties/${propertyId}`,
		createdAt: nowIso,
		updatedAt: nowIso,
		push,
		metadata: {
			propertyTitle,
			documentName,
			suggestionId,
			suggestionCount,
			errorMessage,
		},
	});
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

const getPendingSuggestionForDocument = (
	suggestions: Record<string, unknown>[],
	documentId: string,
) =>
	suggestions.find(
		(suggestion) =>
			toString(suggestion.sourceDocumentId) === documentId &&
			toString(suggestion.status) === 'pending',
	);

const getSuggestionFieldCount = (suggestion?: Record<string, unknown>) => {
	const fields = suggestion?.extractedFields;
	const tasks = suggestion?.suggestedTasks;
	const equipment = suggestion?.suggestedEquipment;
	return (
		(Array.isArray(fields) ? fields.length : 0) +
		(Array.isArray(tasks) ? tasks.length : 0) +
		(Array.isArray(equipment) ? equipment.length : 0)
	);
};

const shouldBackgroundProcessDocument = (document: PropertyDocumentRecord) =>
	toString(document.id) &&
	isProcessableDocument(document) &&
	toString(document.storagePath) &&
	toString(document.acquisitionStatus) === 'processing';

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

const loadDocumentForProcessing = async ({
	propertyRef,
	documentId,
	triggeredBy,
}: {
	propertyRef: FirebaseFirestore.DocumentReference;
	documentId: string;
	triggeredBy: ProcessPdfDocumentAcquisitionInput['triggeredBy'];
}) => {
	const snapshot = await propertyRef.get();
	if (!snapshot.exists) {
		throw new functions.https.HttpsError('not-found', 'Property not found.');
	}

	const propertyData = snapshot.data() || {};
	const documents = Array.isArray(propertyData.documents)
		? (propertyData.documents as PropertyDocumentRecord[])
		: [];
	let document = documents.find(
		(candidate) => toString(candidate.id) === documentId,
	);

	if (!document) {
		const documentSnapshot = await db
			.collection(PROPERTY_DOCUMENTS_COLLECTION)
			.doc(documentId)
			.get();
		const documentData = documentSnapshot.data() as
			| PropertyDocumentRecord
			| undefined;
		if (documentSnapshot.exists && toString(documentData?.propertyId) === snapshot.id) {
			document = {
				id: documentSnapshot.id,
				...documentData,
			};
		}
	}

	if (!document) {
		throw new functions.https.HttpsError('not-found', 'Document not found.');
	}
	if (!isProcessableDocument(document)) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'Only PDF and DOCX documents are supported by this processor.',
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

	return {
		propertyData,
		document,
		documents: documents.some(
			(candidate) => toString(candidate.id) === documentId,
		)
			? documents
			: [...documents, document],
	};
};

const processPdfDocumentAcquisition = async ({
	propertyId,
	documentId,
	triggeredBy,
}: ProcessPdfDocumentAcquisitionInput): Promise<ProcessPdfDocumentAcquisitionResult> => {
	const propertyRef = db.collection('properties').doc(propertyId);
	const loaded = await loadDocumentForProcessing({
		propertyRef,
		documentId,
		triggeredBy,
	});

	if (!loaded) {
		return {
			success: false,
			suggestionCount: 0,
			message: 'Document is not ready for processing.',
		};
	}

	const { propertyData, document, documents } = loaded;
	await assertCanUsePropertyKnowledgeAcquisitionForProperty(propertyData);

	const storagePath = toString(document.storagePath);
	const startedAt = new Date().toISOString();
	await publishDocumentAcquisitionEvent({
		propertyId,
		propertyData,
		document,
		nowIso: startedAt,
		type: 'document_review_started',
		status: 'processing',
		title: 'Document review started',
		message: 'Maintley is reviewing this document.',
		push: false,
	});

	try {
		const [documentBuffer] = await admin.storage().bucket().file(storagePath).download();
		if (documentBuffer.length > MAX_PDF_BYTES) {
			throw new Error('Document is larger than the current 10MB processing limit.');
		}

		const docxReport = isDocxDocument(document)
			? await extractDocxServiceReport(documentBuffer)
			: undefined;
		const extractedText = docxReport?.rawText || extractTextFromPdfBuffer(documentBuffer);
		const extractedFields = docxReport
			? (() => {
					const fields: ExtractedField[] = [];
					createField(fields, 'maintenanceEventDate', docxReport.visitDate || '', 'Visit details', 'high', 'The report clearly labels the visit date.');
					createField(fields, 'maintenanceEventDescription', docxReport.title || 'Property maintenance visit', 'Report title', 'high', 'The report clearly identifies the maintenance visit.');
					createField(fields, 'performedByName', docxReport.technicianName || '', 'Visit details', 'high', 'The report clearly labels the technician who performed the visit.');
					const completedWork = docxReport.completedWork.length
						? `Completed work:\n${docxReport.completedWork.map((item) => `- ${item}`).join('\n')}`
						: '';
					const observations = docxReport.observations.length
						? `Inspection observations:\n${docxReport.observations.map((item) => `- ${item.area}: ${item.status}${item.notes ? ` - ${item.notes}` : ''}`).join('\n')}`
						: '';
					createField(fields, 'servicePerformed', [completedWork, observations].filter(Boolean).join('\n\n'), 'Maintenance tasks and status checks', 'high', 'The report records completed work and dated inspection observations.');
					return fields;
			  })()
			: extractFieldsFromPdfText(extractedText);
		const propertyConfirmation = buildPropertyConfirmationFromPdfText(
			extractedText,
			propertyData.address,
		);
		const completedAt = new Date().toISOString();

		if (!extractedText || extractedFields.length === 0) {
			const failureResult = await db.runTransaction(async (transaction) => {
				const latestSnapshot = await transaction.get(propertyRef);
				const latestData = latestSnapshot.data() || {};
				const latestDocuments = Array.isArray(latestData.documents)
					? (latestData.documents as PropertyDocumentRecord[])
					: documents;
				const latestDocument = latestDocuments.find(
					(candidate) => toString(candidate.id) === documentId,
				);
				const latestSuggestions = Array.isArray(latestData.knowledgeSuggestions)
					? (latestData.knowledgeSuggestions as Record<string, unknown>[])
					: [];
				const existingPending = getPendingSuggestionForDocument(
					latestSuggestions,
					documentId,
				);

				if (
					toString(latestDocument?.acquisitionStatus) === 'pending_review' &&
					existingPending
				) {
					return {
						success: true,
						suggestionCount: getSuggestionFieldCount(existingPending),
						suggestionId: existingPending.id,
					};
				}

				const documentUpdates = {
					acquisitionStatus: 'failed',
					acquisitionCompletedAt: completedAt,
					acquisitionWorkerCompletedAt: completedAt,
					acquisitionError: isDocxDocument(document)
						? 'Maintley could not find useful structured text in this Word document.'
						: 'Maintley could not read useful text from this PDF yet. Scanned PDFs will need the rendered-page OCR processor.',
				};
				transaction.update(propertyRef, {
					documents: updateDocumentInList(
						latestDocuments,
						documentId,
						documentUpdates,
					),
					updatedAt: completedAt,
				});
				transaction.set(
					db.collection(PROPERTY_DOCUMENTS_COLLECTION).doc(documentId),
					buildDocumentCollectionRecord({
						propertyId,
						propertyData: latestData,
						document: latestDocument || document,
						updates: documentUpdates,
						nowIso: completedAt,
					}),
					{ merge: true },
				);

				return {
					success: false,
					suggestionCount: 0,
					message: 'No readable document text found.',
				};
			});
			if (!failureResult.success) {
				await publishDocumentAcquisitionEvent({
					propertyId,
					propertyData,
					document,
					nowIso: completedAt,
					type: 'document_review_failed',
					status: 'failed',
					title: 'Document review failed',
					message: 'Maintley could not review this document yet.',
					push: true,
					errorMessage: failureResult.message,
				});
			}
			return failureResult;
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
			extractionMethod: docxReport ? 'docx_text' : 'pdf_text',
			extractedFields,
			...(docxReport?.suggestedTasks.length
				? { suggestedTasks: docxReport.suggestedTasks }
				: {}),
			...(docxReport?.suggestedEquipment.length
				? { suggestedEquipment: docxReport.suggestedEquipment }
				: {}),
			...(docxReport?.observations.length
				? { visitObservations: docxReport.observations }
				: {}),
			confidence:
				extractedFields.reduce((sum, field) => sum + field.confidence, 0) /
				extractedFields.length,
			propertyConfirmation,
			status: 'pending',
			createdAt: completedAt,
			sourceDocumentName: document.fileName || document.name,
		}) as Record<string, unknown>;

		const finalizeResult = await db.runTransaction(async (transaction) => {
			const latestSnapshot = await transaction.get(propertyRef);
			const latestData = latestSnapshot.data() || {};
			const latestDocuments = Array.isArray(latestData.documents)
				? (latestData.documents as PropertyDocumentRecord[])
				: documents;
			const latestDocument =
				latestDocuments.find(
					(candidate) => toString(candidate.id) === documentId,
				) || document;
			const latestSuggestions = Array.isArray(latestData.knowledgeSuggestions)
				? (latestData.knowledgeSuggestions as Record<string, unknown>[])
				: [];
			const existingPending = getPendingSuggestionForDocument(
				latestSuggestions,
				documentId,
			);

			if (
				toString(latestDocument.acquisitionStatus) === 'pending_review' &&
				existingPending
			) {
				return {
					didWrite: false,
					propertyData: latestData,
					document: latestDocument,
					suggestionCount:
						getSuggestionFieldCount(existingPending) || extractedFields.length,
					suggestionId: toString(existingPending.id),
				};
			}

			const nextSuggestions = [
				...latestSuggestions.filter(
					(existing) =>
						toString(existing.sourceDocumentId) !== documentId ||
						toString(existing.status) !== 'pending',
				),
				suggestion,
			];

			const documentUpdates = {
				acquisitionStatus: 'pending_review',
				acquisitionCompletedAt: completedAt,
				acquisitionWorkerCompletedAt: completedAt,
				acquisitionError: '',
				extractedKnowledgeSuggestionIds: Array.from(
					new Set([
						...(latestDocument.extractedKnowledgeSuggestionIds || []),
						toString(suggestion.id),
					]),
				),
			};
			transaction.update(propertyRef, {
				documents: updateDocumentInList(
					latestDocuments,
					documentId,
					documentUpdates,
				),
				knowledgeSuggestions: nextSuggestions,
				updatedAt: completedAt,
			});
			transaction.set(
				db.collection(PROPERTY_DOCUMENTS_COLLECTION).doc(documentId),
				buildDocumentCollectionRecord({
					propertyId,
					propertyData: latestData,
					document: latestDocument,
					updates: documentUpdates,
					nowIso: completedAt,
				}),
				{ merge: true },
			);
			transaction.set(
				db.collection(PROPERTY_KNOWLEDGE_SUGGESTIONS_COLLECTION).doc(
					toString(suggestion.id),
				),
				buildSuggestionCollectionRecord({
					propertyData: latestData,
					suggestion,
					nowIso: completedAt,
				}),
				{ merge: true },
			);

			return {
				didWrite: true,
				propertyData: latestData,
				document: latestDocument,
				suggestionCount:
					extractedFields.length +
					(docxReport?.suggestedTasks.length || 0) +
					(docxReport?.suggestedEquipment.length || 0),
				suggestionId: toString(suggestion.id),
			};
		});

		if (finalizeResult.didWrite) {
			await publishDocumentAcquisitionEvent({
				propertyId,
				propertyData: finalizeResult.propertyData,
				document: finalizeResult.document,
				suggestionId: finalizeResult.suggestionId,
				suggestionCount: finalizeResult.suggestionCount,
				nowIso: completedAt,
				type: 'suggested_details_ready',
				status: 'ready',
				title: 'Suggested details ready',
				message: `Maintley found ${finalizeResult.suggestionCount} suggested detail${finalizeResult.suggestionCount === 1 ? '' : 's'} in ${toString(finalizeResult.document.fileName || finalizeResult.document.name) || 'this document'}.`,
				push: true,
			});
		}

		return {
			success: true,
			suggestionCount: finalizeResult.suggestionCount,
			suggestionId: finalizeResult.suggestionId,
		};
	} catch (error: any) {
		const completedAt = new Date().toISOString();
		await db.runTransaction(async (transaction) => {
			const latestSnapshot = await transaction.get(propertyRef);
			const latestData = latestSnapshot.data() || {};
			const latestDocuments = Array.isArray(latestData.documents)
				? (latestData.documents as PropertyDocumentRecord[])
				: documents;
			const latestDocument = latestDocuments.find(
				(candidate) => toString(candidate.id) === documentId,
			);
			const latestSuggestions = Array.isArray(latestData.knowledgeSuggestions)
				? (latestData.knowledgeSuggestions as Record<string, unknown>[])
				: [];
			const existingPending = getPendingSuggestionForDocument(
				latestSuggestions,
				documentId,
			);

			if (
				toString(latestDocument?.acquisitionStatus) === 'pending_review' &&
				existingPending
			) {
				return;
			}

			const documentUpdates = {
				acquisitionStatus: 'failed',
				acquisitionCompletedAt: completedAt,
				acquisitionWorkerCompletedAt: completedAt,
				acquisitionError:
					error?.message ||
					'Maintley could not review this document. Please try again later.',
			};
			transaction.update(propertyRef, {
				documents: updateDocumentInList(
					latestDocuments,
					documentId,
					documentUpdates,
				),
				updatedAt: completedAt,
			});
			transaction.set(
				db.collection(PROPERTY_DOCUMENTS_COLLECTION).doc(documentId),
				buildDocumentCollectionRecord({
					propertyId,
					propertyData: latestData,
					document: latestDocument || document,
					updates: documentUpdates,
					nowIso: completedAt,
				}),
				{ merge: true },
			);
		});

		await publishDocumentAcquisitionEvent({
			propertyId,
			propertyData,
			document,
			nowIso: completedAt,
			type: 'document_review_failed',
			status: 'failed',
			title: 'Document review failed',
			message: 'Maintley could not review this document yet.',
			push: true,
			errorMessage:
				error?.message ||
				'Maintley could not review this document. Please try again later.',
		});

		console.error('Property knowledge acquisition failed:', error);
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
				error?.message || 'Could not review this document.',
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
					`Background document acquisition failed for property ${context.params.propertyId}, document ${documentId}:`,
					error,
				);
			}
		}
	});

export const __test = {
	buildPropertyConfirmationFromPdfText,
	extractFieldsFromPdfText,
};
