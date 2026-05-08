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

const KEY_ALIASES: Record<string, string> = {
	type: 'type',
	device: 'type',
	brand: 'brand',
	manufacturer: 'brand',
	model: 'model',
	serial: 'serialNumber',
	serialnumber: 'serialNumber',
	sn: 'serialNumber',
	part: 'partNumber',
	partnumber: 'partNumber',
	pn: 'partNumber',
	filtersize: 'filterSize',
	size: 'filterSize',
	notes: 'specNotes',
	spec: 'specNotes',
	specnotes: 'specNotes',
};

const PART_KEY_ALIASES: Record<string, keyof ParsedPartFields> = {
	name: 'name',
	item: 'name',
	category: 'category',
	part: 'partNumber',
	partnumber: 'partNumber',
	pn: 'partNumber',
	size: 'size',
	manufacturer: 'manufacturer',
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
	const pairs = raw.split(/[\n;,]+/g);
	for (const segment of pairs) {
		const [rawKey, ...rest] = segment.split(':');
		if (!rawKey || rest.length === 0) continue;
		const key = rawKey.replace(/\s+/g, '').toLowerCase();
		const value = rest.join(':').trim();
		if (key && value) {
			map[key] = value;
		}
	}
	return map;
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
