import { DeviceServiceItem } from '../types/Property.types';

export type DeviceServiceItemDynamicField = {
	key: keyof DeviceServiceItem;
	label: string;
	placeholder: string;
	type?: 'text' | 'number';
};

export const DEVICE_SERVICE_ITEM_CATEGORY_OPTIONS = [
	{ value: 'part', label: 'Part' },
	{ value: 'filter', label: 'Filter' },
	{ value: 'belt', label: 'Belt' },
	{ value: 'hose', label: 'Hose' },
	{ value: 'seal', label: 'Seal' },
	{ value: 'valve', label: 'Valve' },
	{ value: 'motor', label: 'Motor' },
	{ value: 'pump', label: 'Pump' },
	{ value: 'fluid', label: 'Fluid' },
	{ value: 'other', label: 'Other' },
];

export const DEVICE_SERVICE_ITEM_FIELDS_BY_CATEGORY: Record<
	string,
	DeviceServiceItemDynamicField[]
> = {
	part: [
		{ key: 'partNumber', label: 'Part Number', placeholder: 'e.g., XH-44920' },
		{ key: 'size', label: 'Size', placeholder: 'e.g., 10x20x1' },
		{ key: 'manufacturer', label: 'Manufacturer', placeholder: 'e.g., Lennox' },
	],
	filter: [
		{ key: 'partNumber', label: 'Filter Part #', placeholder: 'e.g., FPR-100' },
		{ key: 'size', label: 'Filter Size', placeholder: 'e.g., 20x25x5' },
		{ key: 'mervRating', label: 'MERV Rating', placeholder: 'e.g., 11' },
		{ key: 'replacementInterval', label: 'Replace Every', placeholder: 'e.g., 90 days' },
	],
	belt: [
		{ key: 'partNumber', label: 'Belt Part #', placeholder: 'e.g., BLT-3891' },
		{ key: 'size', label: 'Belt Size', placeholder: 'e.g., 4L350' },
		{ key: 'material', label: 'Material', placeholder: 'e.g., Neoprene' },
	],
	hose: [
		{ key: 'partNumber', label: 'Hose Part #', placeholder: 'e.g., HS-22A' },
		{ key: 'size', label: 'Hose Size', placeholder: 'e.g., 3/4 in' },
		{ key: 'material', label: 'Material', placeholder: 'e.g., Braided steel' },
	],
	seal: [
		{ key: 'partNumber', label: 'Seal Part #', placeholder: 'e.g., SL-77B' },
		{ key: 'size', label: 'Seal Size', placeholder: 'e.g., 2 in' },
		{ key: 'material', label: 'Material', placeholder: 'e.g., Rubber' },
	],
	valve: [
		{ key: 'partNumber', label: 'Valve Part #', placeholder: 'e.g., VV-1031' },
		{ key: 'size', label: 'Valve Size', placeholder: 'e.g., 1/2 in' },
		{ key: 'compatibility', label: 'Compatibility', placeholder: 'e.g., Works with model CHX35' },
	],
	motor: [
		{ key: 'partNumber', label: 'Motor Part #', placeholder: 'e.g., MTR-9AX' },
		{ key: 'voltage', label: 'Voltage', placeholder: 'e.g., 120V' },
		{ key: 'compatibility', label: 'Compatibility', placeholder: 'e.g., Indoor blower unit' },
	],
	pump: [
		{ key: 'partNumber', label: 'Pump Part #', placeholder: 'e.g., PMP-200' },
		{ key: 'size', label: 'Capacity/Size', placeholder: 'e.g., 1/6 HP' },
		{ key: 'compatibility', label: 'Compatibility', placeholder: 'e.g., Condensate line setup' },
	],
	fluid: [
		{ key: 'partNumber', label: 'Fluid Type/Code', placeholder: 'e.g., R-410A' },
		{ key: 'size', label: 'Quantity/Size', placeholder: 'e.g., 5 lb' },
		{ key: 'manufacturer', label: 'Brand', placeholder: 'e.g., Chemours' },
	],
	other: [
		{ key: 'partNumber', label: 'Reference #', placeholder: 'e.g., Vendor SKU or internal code' },
		{ key: 'size', label: 'Size/Spec', placeholder: 'e.g., Any relevant sizing information' },
	],
};

export const buildDeviceServiceItemDetails = (
	item: Partial<DeviceServiceItem>,
): string => {
	const segments = [
		item.partNumber ? `Part #: ${item.partNumber}` : '',
		item.size ? `Size: ${item.size}` : '',
		item.mervRating ? `MERV: ${item.mervRating}` : '',
		item.replacementInterval ? `Interval: ${item.replacementInterval}` : '',
		item.voltage ? `Voltage: ${item.voltage}` : '',
		item.material ? `Material: ${item.material}` : '',
		item.compatibility ? `Compatibility: ${item.compatibility}` : '',
		item.manufacturer ? `Mfg: ${item.manufacturer}` : '',
		item.notes ? `Notes: ${item.notes}` : '',
	].filter(Boolean);

	if (item.details?.trim()) {
		segments.unshift(item.details.trim());
	}

	return segments.join(' | ');
};
