export type PropertyIntelligenceScanType =
	| 'quick_property_scan_v1'
	| 'property_audit_v1';

export interface PropertyScanPersistenceTargets {
	latestSnapshotId: string;
	writeHistorySnapshot: boolean;
}

export const getPropertyScanLatestSnapshotId = (
	propertyId: string,
	scanType: PropertyIntelligenceScanType = 'quick_property_scan_v1',
): string =>
	scanType === 'quick_property_scan_v1'
		? propertyId
		: `${propertyId}__${scanType}`;

export const getPropertyScanPersistenceTargets = (
	propertyId: string,
	scanType: PropertyIntelligenceScanType = 'quick_property_scan_v1',
): PropertyScanPersistenceTargets => ({
	latestSnapshotId: getPropertyScanLatestSnapshotId(propertyId, scanType),
	writeHistorySnapshot: scanType === 'quick_property_scan_v1',
});
