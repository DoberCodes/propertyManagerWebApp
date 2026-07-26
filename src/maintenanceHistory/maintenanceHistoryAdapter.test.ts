import {
	adaptMaintenanceHistoryRecord,
	deviceEmbeddedHistorySources,
	mergeMaintenanceHistorySources,
	propertyEmbeddedHistorySources,
} from './maintenanceHistoryAdapter';

describe('maintenanceHistoryAdapter', () => {
	it('normalizes legacy date, text, property, and equipment fields', () => {
		const record = adaptMaintenanceHistoryRecord({
			source: 'maintenanceHistory',
			sourceId: 'legacy-1',
			record: {
				date: '2026-02-03',
				description: 'Water heater flushed',
				assignedDeviceId: 'water-heater-1',
			},
			propertyId: 'property-1',
		});

		expect(record).toMatchObject({
			id: 'maintenanceHistory:legacy-1',
			propertyId: 'property-1',
			serviceDate: '2026-02-03',
			completionDate: '2026-02-03',
			title: 'Water heater flushed',
			deviceIds: ['water-heater-1'],
			historySource: 'maintenanceHistory',
			isCanonicalMaintenanceEvent: false,
		});
	});

	it('normalizes legacy costs, attachments, task links, and performer attribution', () => {
		const record = adaptMaintenanceHistoryRecord({
			source: 'maintenanceHistory',
			sourceId: 'legacy-details',
			record: {
				date: '2026-02-03',
				description: 'Furnace repaired',
				totalCost: 320,
				laborCost: 200,
				partsCost: 120,
				originalTaskId: 'task-1',
				completedByName: 'ABC Home Services',
				completionFile: {
					url: 'https://example.test/invoice.pdf',
					name: 'Invoice',
					type: 'application/pdf',
				},
			},
		});

		expect(record.financials).toEqual({
			actualCost: 320,
			actual: { materialsCost: 120, laborCost: 200 },
			currency: 'USD',
		});
		expect(record.linkedTaskIds).toEqual(['task-1']);
		expect(record.performedBy).toEqual({
			type: 'external_provider',
			displayName: 'ABC Home Services',
		});
		expect(record.attachments).toEqual([
			expect.objectContaining({
				url: 'https://example.test/invoice.pdf',
				fileName: 'Invoice',
			}),
		]);
	});

	it('retains the canonical record when a legacy document has the same id', () => {
		const records = mergeMaintenanceHistorySources([
			{
				source: 'maintenanceHistory',
				sourceId: 'shared-1',
				record: { id: 'shared-1', date: '2026-01-01', description: 'Legacy' },
			},
			{
				source: 'maintenanceEvents',
				sourceId: 'shared-1',
				record: { id: 'shared-1', serviceDate: '2026-01-01', title: 'Canonical' },
			},
		]);

		expect(records).toHaveLength(1);
		expect(records[0].title).toBe('Canonical');
		expect(records[0].isCanonicalMaintenanceEvent).toBe(true);
	});

	it('uses explicit migration provenance when canonical and legacy ids differ', () => {
		const records = mergeMaintenanceHistorySources([
			{
				source: 'maintenanceHistory',
				sourceId: 'legacy-1',
				record: { id: 'legacy-1', date: '2026-01-01', description: 'Legacy' },
			},
			{
				source: 'maintenanceEvents',
				sourceId: 'event-1',
				record: {
					id: 'event-1',
					serviceDate: '2026-01-01',
					title: 'Canonical',
					data: {
						migration: {
							sourceCollection: 'maintenanceHistory',
							sourceId: 'legacy-1',
						},
					},
				},
			},
		]);

		expect(records.map((record) => record.id)).toEqual(['event-1']);
	});

	it('dedupes property alias arrays but retains similar independent events', () => {
		const property = {
			id: 'property-1',
			taskHistory: [{ date: '2026-01-01', description: 'Filter replaced' }],
			maintenanceHistory: [{ date: '2026-01-01', description: 'Filter replaced' }],
		};
		const records = mergeMaintenanceHistorySources([
			...propertyEmbeddedHistorySources(property),
			{
				source: 'maintenanceEvents',
				sourceId: 'event-1',
				record: {
					id: 'event-1',
					propertyId: 'property-1',
					serviceDate: '2026-01-01',
					title: 'Filter replaced',
				},
			},
		]);

		expect(records).toHaveLength(2);
		expect(records.filter((record) => record.historySource.startsWith('property.'))).toHaveLength(1);
	});

	it('normalizes equipment embedded history with stable source metadata', () => {
		const sources = deviceEmbeddedHistorySources({
			id: 'device-1',
			location: { propertyId: 'property-1' },
			maintenanceHistory: [{ date: '2026-03-01', description: 'Inspected' }],
		});
		const [record] = mergeMaintenanceHistorySources(sources);

		expect(record).toMatchObject({
			propertyId: 'property-1',
			deviceIds: ['device-1'],
			historySource: 'device.maintenanceHistory',
		});
	});

	it('filters soft-deleted events and sorts the retained records newest first', () => {
		const records = mergeMaintenanceHistorySources([
			{
				source: 'maintenanceEvents',
				sourceId: 'old',
				record: { id: 'old', serviceDate: '2026-01-01', title: 'Old' },
			},
			{
				source: 'maintenanceEvents',
				sourceId: 'new',
				record: { id: 'new', serviceDate: '2026-03-01', title: 'New' },
			},
			{
				source: 'maintenanceEvents',
				sourceId: 'deleted',
				record: { id: 'deleted', serviceDate: '2026-04-01', title: 'Deleted', status: 'deleted' },
			},
		]);

		expect(records.map((record) => record.id)).toEqual(['new', 'old']);
	});
});
