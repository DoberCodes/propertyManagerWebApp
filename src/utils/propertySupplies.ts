import {
	PROPERTY_SUPPLY_TYPES,
	PropertySupply,
	PropertySupplyDraft,
	PropertySupplyType,
} from '../types/Supply.types';
import { DeviceServiceItem } from '../types/Property.types';
import { parsePartBarcodePayload } from './barcodeScanParser';

const SUPPLY_TYPE_LABELS: Record<PropertySupplyType, string> = {
	filter: 'Filter',
	paint_and_finish: 'Paint & finish',
	lawn_and_garden: 'Lawn & garden',
	pool_and_spa: 'Pool & spa',
	electrical: 'Electrical',
	plumbing: 'Plumbing',
	hardware: 'Hardware',
	cleaning: 'Cleaning',
	other: 'Other',
};

export const PROPERTY_SUPPLY_TYPE_OPTIONS = PROPERTY_SUPPLY_TYPES.map(
	(value) => ({
		value,
		label: SUPPLY_TYPE_LABELS[value],
	}),
);

export const getPropertySupplyTypeLabel = (type: PropertySupplyType): string =>
	SUPPLY_TYPE_LABELS[type] || 'Other';

export const sortPropertySupplies = (
	supplies: PropertySupply[],
): PropertySupply[] =>
	[...supplies].sort((left, right) =>
		left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
	);

const LEGACY_TYPE_MAP: Record<string, PropertySupplyType> = {
	filter: 'filter',
	paint: 'paint_and_finish',
	finish: 'paint_and_finish',
	fertilizer: 'lawn_and_garden',
	lawn: 'lawn_and_garden',
	pool: 'pool_and_spa',
	bulb: 'electrical',
	battery: 'electrical',
	electrical: 'electrical',
	hose: 'plumbing',
	plumbing: 'plumbing',
	belt: 'hardware',
	hardware: 'hardware',
	cleaning: 'cleaning',
	cleaner: 'cleaning',
};

export const getPropertySupplyTypeFromLegacyCategory = (
	category?: string,
): PropertySupplyType => LEGACY_TYPE_MAP[String(category || '').trim().toLowerCase()] || 'other';

export const buildPropertySupplyDraftFromServiceItem = (
	item: Omit<DeviceServiceItem, 'id'>,
): PropertySupplyDraft => ({
	name: String(item.name || '').trim(),
	type: getPropertySupplyTypeFromLegacyCategory(item.category),
	manufacturer: item.manufacturer,
	partNumber: item.partNumber,
	size: item.size,
	details: item.details,
	material: item.material,
	voltage: item.voltage,
	mervRating: item.mervRating,
	compatibility: item.compatibility,
	replacementInterval: item.replacementInterval,
	notes: item.notes,
});

export const buildPropertySupplyDraftFromBarcode = (
	rawValue: string,
): PropertySupplyDraft => {
	const parsed = parsePartBarcodePayload(rawValue);
	return {
		...buildPropertySupplyDraftFromServiceItem({
			category: parsed.category || 'other',
			name: parsed.name || 'Scanned Supply',
			details: parsed.details,
			partNumber:
				parsed.partNumber ||
				(/^[A-Za-z0-9\-_.]{6,}$/.test(rawValue.trim())
					? rawValue.trim()
					: undefined),
			size: parsed.size,
			manufacturer: parsed.manufacturer,
			material: parsed.material,
			voltage: parsed.voltage,
			mervRating: parsed.mervRating,
			compatibility: parsed.compatibility,
			replacementInterval: parsed.replacementInterval,
			notes: parsed.notes,
		}),
		barcodeValue: rawValue.trim(),
	};
};

export const findPropertySupplyByBarcode = (
	supplies: PropertySupply[],
	barcodeValue: string,
): PropertySupply | undefined => {
	const normalized = barcodeValue.trim().toLowerCase();
	if (!normalized) return undefined;
	return supplies.find((supply) =>
		[supply.barcodeValue, supply.partNumber, supply.modelOrSku]
			.map((value) => String(value || '').trim().toLowerCase())
			.includes(normalized),
	);
};
