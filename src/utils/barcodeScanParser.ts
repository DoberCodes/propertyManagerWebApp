import { DeviceServiceItem } from '../types/Property.types';

type ParsedDeviceFields = {
	type?: string;
	brand?: string;
	model?: string;
	serialNumber?: string;
	partNumber?: string;
	filterSize?: string;
	specNotes?: string;
};

type ParsedPartFields = Partial<Omit<DeviceServiceItem, 'id'>>;

export type BarcodeAiSegment = {
	ai: string;
	value: string;
	label?: string;
};

export type BarcodePayloadAnalysis = {
	raw: string;
	keyValuePairs: Record<string, string>;
	gs1: {
		gtin?: string;
		serial?: string;
		segments: BarcodeAiSegment[];
	};
	normalized: {
		device: ParsedDeviceFields;
		part: ParsedPartFields;
	};
	formatHints: {
		hasPairs: boolean;
		hasGs1Markers: boolean;
		looksLikePlainCode: boolean;
	};
};

const KEY_ALIASES: Record<string, string> = {
	type: 'type',
	device: 'type',
	devicetype: 'type',
	equipmenttype: 'type',
	brand: 'brand',
	manufacturer: 'brand',
	make: 'brand',
	mfg: 'brand',
	mfr: 'brand',
	model: 'model',
	modelnumber: 'model',
	modelno: 'model',
	serial: 'serialNumber',
	serialnumber: 'serialNumber',
	serialno: 'serialNumber',
	sn: 'serialNumber',
	part: 'partNumber',
	partnumber: 'partNumber',
	mpn: 'partNumber',
	sku: 'partNumber',
	upc: 'partNumber',
	ean: 'partNumber',
	gtin: 'partNumber',
	pn: 'partNumber',
	filtersize: 'filterSize',
	size: 'filterSize',
	tonnage: 'filterSize',
	notes: 'specNotes',
	spec: 'specNotes',
	specnotes: 'specNotes',
};

const PART_KEY_ALIASES: Record<string, keyof ParsedPartFields> = {
	name: 'name',
	item: 'name',
	product: 'name',
	category: 'category',
	part: 'partNumber',
	partnumber: 'partNumber',
	mpn: 'partNumber',
	sku: 'partNumber',
	upc: 'partNumber',
	ean: 'partNumber',
	gtin: 'partNumber',
	pn: 'partNumber',
	size: 'size',
	manufacturer: 'manufacturer',
	brand: 'manufacturer',
	make: 'manufacturer',
	material: 'material',
	voltage: 'voltage',
	merv: 'mervRating',
	compatibility: 'compatibility',
	interval: 'replacementInterval',
	replacementinterval: 'replacementInterval',
	notes: 'notes',
	details: 'details',
};

const normalizeCategory = (value?: string): string | undefined => {
	if (!value) return undefined;
	const normalized = value.trim().toLowerCase();
	const allowed = new Set([
		'part',
		'filter',
		'belt',
		'hose',
		'seal',
		'valve',
		'motor',
		'pump',
		'fluid',
		'other',
	]);
	return allowed.has(normalized) ? normalized : 'other';
};

const parsePairs = (raw: string): Record<string, string> => {
	const map: Record<string, string> = {};
	const pairs = raw.split(/[\n;,|]+/g);

	const trySetPair = (rawKey: string, rawValue: string) => {
		const key = rawKey.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
		const value = rawValue.trim();
		if (key && value) {
			map[key] = value;
		}
	};

	if (raw.trim().startsWith('{') && raw.trim().endsWith('}')) {
		try {
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed === 'object') {
				Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
					if (typeof value === 'string' || typeof value === 'number') {
						trySetPair(key, String(value));
					}
				});
			}
		} catch {
			// Ignore invalid JSON payloads and continue with delimiter parsing.
		}
	}

	if (raw.includes('?') && raw.includes('=')) {
		const queryString = raw.split('?')[1] || '';
		const queryPart = queryString.split('#')[0];
		const params = new URLSearchParams(queryPart);
		params.forEach((value, key) => {
			trySetPair(key, value);
		});
	}

	for (const segment of pairs) {
		const candidate = segment.trim();
		if (!candidate) continue;
		const delimiterIndex = (() => {
			const colonIndex = candidate.indexOf(':');
			const equalsIndex = candidate.indexOf('=');
			if (colonIndex === -1) return equalsIndex;
			if (equalsIndex === -1) return colonIndex;
			return Math.min(colonIndex, equalsIndex);
		})();
		if (delimiterIndex <= 0) continue;
		const rawKey = candidate.slice(0, delimiterIndex);
		const rawValue = candidate.slice(delimiterIndex + 1);
		trySetPair(rawKey, rawValue);
	}
	return map;
};

const GS1_AI_LABELS: Record<string, string> = {
	'01': 'GTIN',
	'10': 'Batch/Lot',
	'11': 'Production Date',
	'15': 'Best Before Date',
	'17': 'Expiration Date',
	'21': 'Serial Number',
};

const parseGs1Segments = (raw: string): BarcodeAiSegment[] => {
	const segments: BarcodeAiSegment[] = [];
	const regex = /\((\d{2,4})\)([^()]+)/g;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(raw)) !== null) {
		const ai = match[1];
		const value = match[2].trim();
		if (!value) continue;
		segments.push({
			ai,
			value,
			label: GS1_AI_LABELS[ai],
		});
	}

	return segments;
};

const parseGs1 = (raw: string): { gtin?: string; serial?: string } => {
	const compact = raw.replace(/\s+/g, '');
	// Basic GS1 AI parse support: (01)GTIN(21)SERIAL
	const match = compact.match(/\(01\)(\d{8,14}).*\(21\)([A-Za-z0-9\-_.]+)/);
	if (match) {
		return {
			gtin: match[1],
			serial: match[2],
		};
	}
	return {};
};

export const parseDeviceBarcodePayload = (raw: string): ParsedDeviceFields => {
	const text = raw.trim();
	if (!text) return {};

	const pairs = parsePairs(text);
	const parsed: ParsedDeviceFields = {};

	Object.entries(pairs).forEach(([key, value]) => {
		const mapped = KEY_ALIASES[key];
		if (!mapped) return;
		(parsed as any)[mapped] = value;
	});

	const gs1 = parseGs1(text);
	if (!parsed.partNumber && gs1.gtin) parsed.partNumber = gs1.gtin;
	if (!parsed.serialNumber && gs1.serial) parsed.serialNumber = gs1.serial;

	// Fallback: plain barcode likely product/serial code
	if (
		!parsed.serialNumber &&
		!parsed.partNumber &&
		/^[A-Za-z0-9\-_.]{6,}$/.test(text)
	) {
		parsed.serialNumber = text;
	}

	if (!parsed.specNotes) {
		parsed.specNotes = `Scanned code: ${text}`;
	}

	return parsed;
};

export const parsePartBarcodePayload = (raw: string): ParsedPartFields => {
	const text = raw.trim();
	if (!text) return {};

	const pairs = parsePairs(text);
	const parsed: ParsedPartFields = {};

	Object.entries(pairs).forEach(([key, value]) => {
		const mapped = PART_KEY_ALIASES[key];
		if (!mapped) return;
		(parsed as any)[mapped] = value;
	});

	const gs1 = parseGs1(text);
	if (!parsed.partNumber && gs1.gtin) parsed.partNumber = gs1.gtin;

	if (parsed.category) {
		parsed.category = normalizeCategory(parsed.category) || 'other';
	}

	if (!parsed.name && parsed.partNumber) {
		parsed.name = `Scanned Part ${parsed.partNumber}`;
	}

	if (!parsed.details) {
		parsed.details = `Scanned code: ${text}`;
	}

	if (!parsed.notes) {
		parsed.notes = `Captured from barcode scan`;
	}

	return parsed;
};

export const analyzeBarcodePayload = (raw: string): BarcodePayloadAnalysis => {
	const text = raw.trim();
	const pairs = parsePairs(text);
	const gs1 = parseGs1(text);
	const segments = parseGs1Segments(text);

	return {
		raw: text,
		keyValuePairs: pairs,
		gs1: {
			gtin: gs1.gtin,
			serial: gs1.serial,
			segments,
		},
		normalized: {
			device: parseDeviceBarcodePayload(text),
			part: parsePartBarcodePayload(text),
		},
		formatHints: {
			hasPairs: Object.keys(pairs).length > 0,
			hasGs1Markers: /\(\d{2,4}\)/.test(text),
			looksLikePlainCode: /^[A-Za-z0-9\-_.]{6,}$/.test(text),
		},
	};
};
