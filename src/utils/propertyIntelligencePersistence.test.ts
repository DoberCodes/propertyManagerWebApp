import {
	getPropertyScanLatestSnapshotId,
	getPropertyScanPersistenceTargets,
} from './propertyIntelligencePersistence';

describe('property intelligence persistence', () => {
	it('keeps the legacy latest key for Quick Scan snapshots', () => {
		expect(
			getPropertyScanLatestSnapshotId(
				'property-1',
				'quick_property_scan_v1',
			),
		).toBe('property-1');
		expect(
			getPropertyScanPersistenceTargets(
				'property-1',
				'quick_property_scan_v1',
			),
		).toEqual({
			latestSnapshotId: 'property-1',
			writeHistorySnapshot: true,
		});
	});

	it('stores Property Audit under a separate latest key without history', () => {
		expect(
			getPropertyScanLatestSnapshotId(
				'property-1',
				'property_audit_v1',
			),
		).toBe('property-1__property_audit_v1');
		expect(
			getPropertyScanPersistenceTargets(
				'property-1',
				'property_audit_v1',
			),
		).toEqual({
			latestSnapshotId: 'property-1__property_audit_v1',
			writeHistorySnapshot: false,
		});
	});
});
