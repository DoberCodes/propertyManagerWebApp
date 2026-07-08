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
	producttype: 'type',
	appliancetype: 'type',
	brand: 'brand',
	manufacturer: 'brand',
	manufacturedby: 'brand',
	make: 'brand',
	mfg: 'brand',
	mfgby: 'brand',
	mfr: 'brand',
	model: 'model',
	modelnumber: 'model',
	modelno: 'model',
	modeln0: 'model',
	modelnum: 'model',
	modeln: 'model',
	modelnumberno: 'model',
	m0deln0: 'model',
	m0del: 'model',
	mod: 'model',
	mdl: 'model',
	mn: 'model',
	m1n: 'model',
	min: 'model',
	mln: 'model',
	serial: 'serialNumber',
	serialnumber: 'serialNumber',
	serialno: 'serialNumber',
	serialnum: 'serialNumber',
	serialn: 'serialNumber',
	serno: 'serialNumber',
	ser: 'serialNumber',
	sn: 'serialNumber',
	s1n: 'serialNumber',
	sin: 'serialNumber',
	sln: 'serialNumber',
	part: 'partNumber',
	partnumber: 'partNumber',
	mpn: 'partNumber',
	sku: 'partNumber',
	upc: 'partNumber',
	ean: 'partNumber',
	gtin: 'partNumber',
	pn: 'partNumber',
	p1n: 'partNumber',
	pin: 'partNumber',
	pln: 'partNumber',
	partno: 'partNumber',
	partnum: 'partNumber',
	itemno: 'partNumber',
	itemnumber: 'partNumber',
	productno: 'partNumber',
	productnumber: 'partNumber',
	filtersize: 'filterSize',
	filter: 'filterSize',
	size: 'filterSize',
	tonnage: 'filterSize',
	capacity: 'filterSize',
	notes: 'specNotes',
	servicenotes: 'specNotes',
	spec: 'specNotes',
	specnotes: 'specNotes',
	rating: 'specNotes',
};

const PART_KEY_ALIASES: Record<string, keyof ParsedPartFields> = {
	name: 'name',
	item: 'name',
	product: 'name',
	description: 'name',
	category: 'category',
	part: 'partNumber',
	partnumber: 'partNumber',
	mpn: 'partNumber',
	sku: 'partNumber',
	upc: 'partNumber',
	ean: 'partNumber',
	gtin: 'partNumber',
	pn: 'partNumber',
	p1n: 'partNumber',
	pin: 'partNumber',
	pln: 'partNumber',
	partno: 'partNumber',
	itemno: 'partNumber',
	itemnumber: 'partNumber',
	productno: 'partNumber',
	productnumber: 'partNumber',
	size: 'size',
	filtersize: 'size',
	manufacturer: 'manufacturer',
	brand: 'manufacturer',
	mfg: 'manufacturer',
	mfr: 'manufacturer',
	make: 'manufacturer',
	material: 'material',
	voltage: 'voltage',
	volt: 'voltage',
	merv: 'mervRating',
	mervrating: 'mervRating',
	compatibility: 'compatibility',
	fits: 'compatibility',
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

const normalizeOcrText = (raw: string): string =>
	raw
		.replace(/\r/g, '\n')
		.replace(/[\u2010-\u2015\u2212]/g, '-')
		.replace(/[\u201c\u201d]/g, '"')
		.replace(/\u2019/g, "'")
		.replace(/\u00a0/g, ' ');

const normalizeKey = (rawKey: string): string =>
	rawKey.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

const cleanCapturedValue = (value: string): string => {
	const knownLabel =
		/(?:m(?:odel|0del)(?:\s*(?:number|n[o0]\.?|num|#))?|m\s*[/\\.\-il1]?\s*n|mdl|serial(?:\s*(?:number|n[o0]\.?|num|#))?|ser(?:ial|[i1l]al)?\s*(?:n[o0]\.?|#)?|s\s*[/\\.\-il1]?\s*n|brand|manufacturer|manufactured\s*by|mfg(?:\s*by)?|mfr|make|part(?:\s*(?:number|n[o0]\.?|num|#))?|p\s*[/\\.\-il1]?\s*n|item(?:\s*(?:number|n[o0]\.?|#))?|product(?:\s*(?:number|n[o0]\.?|#))?|filter\s*size|filter|size|type|equipment\s*type|device\s*type|appliance\s*type|voltage|merv(?:\s*rating)?|material|compatibility|replacement\s*interval|details|notes)\b/i;
	const stopped = value.split(knownLabel)[0] || value;
	return stopped
		.replace(/^[\s:;=#.-]+/, '')
		.replace(/\s+/g, ' ')
		.replace(/[|;,]+$/, '')
		.trim();
};

const normalizeIdentifierValue = (value?: string): string | undefined => {
	if (!value) return undefined;
	const normalized = normalizeOcrText(value)
		.replace(/\s*-\s*/g, '-')
		.replace(/\s*\/\s*/g, '/')
		.replace(/\s*\.\s*/g, '.')
		.replace(/\s+/g, ' ')
		.trim()
		.toUpperCase();
	return normalized || undefined;
};

const normalizeDeviceFields = (parsed: ParsedDeviceFields): ParsedDeviceFields => ({
	...parsed,
	model: normalizeIdentifierValue(parsed.model),
	serialNumber: normalizeIdentifierValue(parsed.serialNumber),
	partNumber: normalizeIdentifierValue(parsed.partNumber),
});

const isPlaceholderLabelValue = (value: string): boolean =>
	/^(number|no\.?|num|#|serial|model|part|item|product)$/i.test(value.trim());

const labelDefinitions: Array<{
	key: string;
	pattern: RegExp;
	labelOnly: RegExp;
}> = [
	{
		key: 'serialnumber',
		pattern: /(?:serial\s*(?:number|n[o0]\.?|num|#)|serial|ser(?:ial|[i1l]al)?\s*(?:n[o0]\.?|#)?|s\s*[/\\.\-il1]?\s*n)\s*(?:[:=#.-]|\s)\s*([A-Z0-9][A-Z0-9\-_./ ]{1,})/i,
		labelOnly: /^(?:serial\s*(?:number|n[o0]\.?|num|#)|serial|ser(?:ial|[i1l]al)?\s*(?:n[o0]\.?|#)?|s\s*[/\\.\-il1]?\s*n)\s*[:=#.-]?\s*$/i,
	},
	{
		key: 'model',
		pattern: /(?:m(?:odel|0del)\s*(?:number|n[o0]\.?|num|#)?|m\s*[/\\.\-il1]?\s*n|mdl)\s*(?:[:=#.-]|\s)\s*([A-Z0-9][A-Z0-9\-_./ ]{1,})/i,
		labelOnly: /^(?:m(?:odel|0del)\s*(?:number|n[o0]\.?|num|#)?|m\s*[/\\.\-il1]?\s*n|mdl)\s*[:=#.-]?\s*$/i,
	},
	{
		key: 'partnumber',
		pattern: /(?:part\s*(?:number|n[o0]\.?|num|#)|part|p\s*[/\\.\-il1]?\s*n|item\s*(?:number|n[o0]\.?|#)|item|product\s*(?:number|n[o0]\.?|#)|product)\s*(?:[:=#.-]|\s)\s*([A-Z0-9][A-Z0-9\-_./ ]{1,})/i,
		labelOnly: /^(?:part\s*(?:number|n[o0]\.?|num|#)|part|p\s*[/\\.\-il1]?\s*n|item\s*(?:number|n[o0]\.?|#)|item|product\s*(?:number|n[o0]\.?|#)|product)\s*[:=#.-]?\s*$/i,
	},
	{
		key: 'brand',
		pattern: /(?:brand|manufacturer|manufactured\s*by|mfg(?:\s*by)?|mfr|make)\s*(?:[:=#.-]|\s)\s*([A-Z][A-Z0-9&.'\- ]{1,})/i,
		labelOnly: /^(?:brand|manufacturer|manufactured\s*by|mfg(?:\s*by)?|mfr|make)\s*[:=#.-]?\s*$/i,
	},
	{
		key: 'type',
		pattern: /(?:equipment\s*type|device\s*type|appliance\s*type|product\s*type|type)\s*(?:[:=#.-]|\s)\s*([A-Z0-9][A-Z0-9&.'\- ]{1,})/i,
		labelOnly: /^(?:type|equipment\s*type|device\s*type|appliance\s*type|product\s*type)\s*[:=#.-]?\s*$/i,
	},
	{
		key: 'filtersize',
		pattern: /(?:filter\s*size|filter|size|tonnage|capacity)\s*(?:[:=#.-]|\s)\s*([A-Z0-9][A-Z0-9\-_./ xX"]{1,})/i,
		labelOnly: /^(?:filter\s*size|filter|size|tonnage|capacity)\s*[:=#.-]?\s*$/i,
	},
	{
		key: 'voltage',
		pattern: /(?:voltage|volt(?:s)?|v)\s*(?:[:=#.-]|\s)\s*([0-9][0-9./ xX-]*\s*(?:v|volt|volts)?)/i,
		labelOnly: /^(?:voltage|volt(?:s)?|v)\s*[:=#.-]?\s*$/i,
	},
	{
		key: 'merv',
		pattern: /(?:merv(?:\s*rating)?)\s*(?:[:=#.-]|\s)\s*([0-9]{1,2})/i,
		labelOnly: /^(?:merv(?:\s*rating)?)\s*[:=#.-]?\s*$/i,
	},
];

const looksLikeLabelOnly = (line: string): boolean =>
	labelDefinitions.some((definition) => definition.labelOnly.test(line.trim()));

const extractKnownLabelPairs = (raw: string): Record<string, string> => {
	const map: Record<string, string> = {};
	const lines = raw
		.split(/\n+/)
		.map((line) => line.trim())
		.filter(Boolean);

	const assign = (key: string, value: string): boolean => {
		const cleaned = cleanCapturedValue(value);
		if (key && cleaned && !isPlaceholderLabelValue(cleaned) && !map[key]) {
			map[key] = cleaned;
			return true;
		}
		return false;
	};

	lines.forEach((line, index) => {
		labelDefinitions.forEach(({ key, pattern, labelOnly }) => {
			if (map[key]) return;

			const match = line.match(pattern);
			if (match?.[1]) {
				if (assign(key, match[1])) return;
			}

			if (labelOnly.test(line)) {
				const nextValueLine = lines
					.slice(index + 1)
					.find((candidate) => !looksLikeLabelOnly(candidate));
				if (nextValueLine) {
					assign(key, nextValueLine);
				}
			}
		});
	});

	const joined = `\n${lines.join('\n')}\n`;
	labelDefinitions.forEach(({ key, pattern }) => {
		if (map[key]) return;
		const match = joined.match(pattern);
		if (match?.[1]) {
			assign(key, match[1]);
		}
	});

	return map;
};

const parsePairs = (raw: string): Record<string, string> => {
	const map: Record<string, string> = {};
	const normalizedRaw = normalizeOcrText(raw);
	const pairs = normalizedRaw.split(/[\n;,|]+/g);

	const trySetPair = (rawKey: string, rawValue: string) => {
		const key = normalizeKey(rawKey);
		const value = cleanCapturedValue(rawValue);
		if (key && value) {
			map[key] = value;
		}
	};

	if (normalizedRaw.trim().startsWith('{') && normalizedRaw.trim().endsWith('}')) {
		try {
			const parsed = JSON.parse(normalizedRaw);
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

	if (normalizedRaw.includes('?') && normalizedRaw.includes('=')) {
		const queryString = normalizedRaw.split('?')[1] || '';
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

	Object.entries(extractKnownLabelPairs(normalizedRaw)).forEach(([key, value]) => {
		if (!map[key]) map[key] = value;
	});

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

const inferBrand = (raw: string): string | undefined => {
	const brands: Array<{ label: string; pattern: RegExp }> = [
		{ label: 'Whirlpool', pattern: /\bWHIRLPOOL\b/i },
		{ label: 'GE', pattern: /\b(?:GE|GENERAL\s+ELECTRIC)\b/i },
		{ label: 'Samsung', pattern: /\bSAMSUNG\b/i },
		{ label: 'LG', pattern: /\bLG\b/i },
		{ label: 'Frigidaire', pattern: /\bFRIGIDAIRE\b/i },
		{ label: 'Bosch', pattern: /\bBOSCH\b/i },
		{ label: 'Maytag', pattern: /\bMAYTAG\b/i },
		{ label: 'KitchenAid', pattern: /\bKITCHENAID\b/i },
		{ label: 'Kenmore', pattern: /\bKENMORE\b/i },
		{ label: 'Trane', pattern: /\bTRANE\b/i },
		{ label: 'Carrier', pattern: /\bCARRIER\b/i },
		{ label: 'Lennox', pattern: /\bLENNOX\b/i },
		{ label: 'Goodman', pattern: /\bGOODMAN\b/i },
		{ label: 'Rheem', pattern: /\bRHEEM\b/i },
		{ label: 'Ruud', pattern: /\bRUUD\b/i },
		{ label: 'York', pattern: /\bYORK\b/i },
		{ label: 'Bryant', pattern: /\bBRYANT\b/i },
		{ label: 'American Standard', pattern: /\bAMERICAN\s+STANDARD\b/i },
		{ label: 'A. O. Smith', pattern: /\bA\.?\s*O\.?\s*SMITH\b/i },
		{ label: 'Bradford White', pattern: /\bBRADFORD\s+WHITE\b/i },
		{ label: 'Navien', pattern: /\bNAVIEN\b/i },
		{ label: 'Rinnai', pattern: /\bRINNAI\b/i },
	];

	return brands.find((brand) => brand.pattern.test(raw))?.label;
};

const inferDeviceType = (raw: string): string | undefined => {
	const types: Array<{ label: string; pattern: RegExp }> = [
		{ label: 'Water Heater', pattern: /\bWATER\s+HEATER\b/i },
		{ label: 'Furnace', pattern: /\bFURNACE\b/i },
		{ label: 'Heat Pump', pattern: /\bHEAT\s+PUMP\b/i },
		{ label: 'Air Conditioner', pattern: /\b(?:AIR\s+CONDITIONER|CONDENSER|A\/C)\b/i },
		{ label: 'Washer', pattern: /\b(?:WASHER|WASHING\s+MACHINE)\b/i },
		{ label: 'Dryer', pattern: /\bDRYER\b/i },
		{ label: 'Dishwasher', pattern: /\bDISHWASHER\b/i },
		{ label: 'Refrigerator', pattern: /\bREFRIGERATOR\b/i },
		{ label: 'Freezer', pattern: /\bFREEZER\b/i },
		{ label: 'Range', pattern: /\bRANGE\b/i },
		{ label: 'Oven', pattern: /\bOVEN\b/i },
		{ label: 'Microwave', pattern: /\bMICROWAVE\b/i },
		{ label: 'Garbage Disposal', pattern: /\bDISPOSAL\b/i },
		{ label: 'Humidifier', pattern: /\bHUMIDIFIER\b/i },
		{ label: 'Dehumidifier', pattern: /\bDEHUMIDIFIER\b/i },
	];

	return types.find((type) => type.pattern.test(raw))?.label;
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
	if (!parsed.brand) parsed.brand = inferBrand(text);
	if (!parsed.type) parsed.type = inferDeviceType(text);

	// Fallback: plain barcode likely product/serial code
	if (
		!parsed.serialNumber &&
		!parsed.partNumber &&
		/^[A-Za-z0-9\-_.]{6,}$/.test(text)
	) {
		parsed.serialNumber = text;
	}

	return normalizeDeviceFields(parsed);
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
	if (!parsed.manufacturer) parsed.manufacturer = inferBrand(text);
	if (!parsed.category && /\bFILTER\b/i.test(text)) parsed.category = 'filter';

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
