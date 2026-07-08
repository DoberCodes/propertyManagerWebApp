import { Device } from '../types/Property.types';
import {
	getDeviceAssetClassificationText,
	getDeviceAssetType,
} from '../utils/systemTypes';

const normalizeText = (value: unknown): string =>
	String(value || '')
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

const INSPECTION_RECORD_ASSET_TYPES = new Set([
	'Roof',
	'Windows',
	'Doors',
	'Gutter System',
	'Siding',
	'Foundation',
	'Deck',
	'Patio',
	'Porch',
	'Fence',
	'Driveway',
	'Retaining Wall',
	'Chimney',
]);

const INSPECTION_RECORD_TEXT_PATTERNS = [
	/\bgfci\b/,
	/\boutlets?\b/,
	/\bwindow screens?\b/,
];

export const isInspectionRecordAsset = (asset: Partial<Device>): boolean => {
	const assetType = getDeviceAssetType(asset);
	if (INSPECTION_RECORD_ASSET_TYPES.has(assetType)) return true;

	const assetText = normalizeText(getDeviceAssetClassificationText(asset));
	return INSPECTION_RECORD_TEXT_PATTERNS.some((pattern) => pattern.test(assetText));
};

export const expectsEquipmentIdentityDetails = (
	asset: Partial<Device>,
): boolean => !isInspectionRecordAsset(asset);

export const expectsInstallDateRecord = (asset: Partial<Device>): boolean =>
	!isInspectionRecordAsset(asset);

export const expectsRecurringCareRecord = (asset: Partial<Device>): boolean =>
	!isInspectionRecordAsset(asset);

export const expectsMaintenanceHistoryRecord = (
	asset: Partial<Device>,
): boolean => !isInspectionRecordAsset(asset);

export const shouldSuggestInspectionDocumentation = (
	asset: Partial<Device>,
): boolean => isInspectionRecordAsset(asset);
