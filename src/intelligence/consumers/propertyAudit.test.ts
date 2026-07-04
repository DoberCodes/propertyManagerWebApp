import { Device, Property } from '../../types/Property.types';
import { runQuickPropertyScan } from './quickScan';
import { runPropertyAudit } from './propertyAudit';

const property: Property = {
	id: 'property-1',
	userId: 'user-1',
	title: 'Audit Home',
	slug: 'audit-home',
};

const makeSystem = (
	id: string,
	overrides: Partial<Device> = {},
): Device => ({
	id,
	userId: 'user-1',
	type: 'HVAC',
	assetType: 'HVAC',
	brand: 'Maintley',
	model: `Model ${id}`,
	serialNumber: 'SN-1',
	installationDate: '2020-01-01',
	location: {
		propertyId: property.id,
	},
	status: 'Active',
	...overrides,
});

describe('Property Audit consumer', () => {
	it('groups shared engine findings into audit categories', () => {
		const audit = runPropertyAudit({
			property,
			systems: [
				makeSystem('hvac-1', {
					filterSize: '',
				}),
			],
			tasks: [],
			maintenanceHistory: [],
			createdAt: '2026-06-30T12:00:00.000Z',
		}, {
			planId: 'homeowner_plus',
		});

		const maintenanceCoverage = audit.categories.find(
			(category) => category.id === 'maintenance_coverage',
		);
		const equipmentRecords = audit.categories.find(
			(category) => category.id === 'equipment_records',
		);

		expect(maintenanceCoverage?.findings.map((finding) => finding.ruleId))
			.toEqual(expect.arrayContaining([
				'systems-missing-actionable-maintenance-coverage',
				'systems-missing-maintenance-history',
			]));
		expect(equipmentRecords?.findings.map((finding) => finding.ruleId))
			.toEqual(expect.arrayContaining([
				'knowledge-pack-record-details-missing',
			]));
	});

	it('keeps audit findings detailed instead of applying Quick Scan summary aggregation', () => {
		const systems = ['hvac-1', 'hvac-2', 'hvac-3'].map((id) =>
			makeSystem(id, {
				installationDate: '',
			}),
		);
		const input = {
			property,
			systems,
			tasks: [],
			maintenanceHistory: [],
			createdAt: '2026-06-30T12:00:00.000Z',
		};

		const audit = runPropertyAudit(input, {
			planId: 'homeowner',
		});
		const quickScan = runQuickPropertyScan(input, {
			planId: 'homeowner',
		});

		expect(
			audit.findings.filter(
				(finding) =>
					finding.ruleId === 'major-systems-missing-install-dates',
			),
		).toHaveLength(3);
		expect(
			quickScan.filter(
				(finding) =>
					finding.ruleId === 'major-systems-missing-install-dates',
			),
		).toHaveLength(1);
		expect(quickScan[0].id).not.toContain('quick-scan-summary');
		expect(quickScan[0].affectedSystemIds).toHaveLength(1);
	});

	it('returns all audit categories even when future categories do not have findings yet', () => {
		const audit = runPropertyAudit({
			property,
			systems: [],
			tasks: [],
			maintenanceHistory: [],
			createdAt: '2026-06-30T12:00:00.000Z',
		}, {
			planId: 'homeowner_plus',
		});

		expect(audit.categories.map((category) => category.id)).toEqual([
			'maintenance_coverage',
			'equipment_records',
			'documentation',
			'lifecycle_planning',
			'property_completeness',
		]);
		expect(
			audit.categories.find((category) => category.id === 'documentation')
				?.summary.total,
		).toBe(0);
	});

	it('groups audit findings into asset reviews while preserving category summaries', () => {
		const audit = runPropertyAudit({
			property,
			systems: [
				makeSystem('water-heater-1', {
					type: 'Water Heater',
					assetType: 'Water Heater',
					brand: '',
					model: '',
					serialNumber: '',
					installationDate: '',
				}),
			],
			tasks: [],
			maintenanceHistory: [],
			createdAt: '2026-06-30T12:00:00.000Z',
		}, {
			planId: 'homeowner_plus',
		});

		expect(audit.assetReviews).toHaveLength(1);
		expect(audit.assetReviews[0]).toEqual(
			expect.objectContaining({
				assetId: 'water-heater-1',
				assetTitle: 'Water Heater',
				knowledgePack: 'water_heater.generic',
				summary: expect.objectContaining({
					total: audit.assetReviews[0].findings.length,
				}),
			}),
		);
		expect(audit.assetReviews[0].categorySummaries.map((summary) => summary.id))
			.toEqual(expect.arrayContaining([
				'maintenance_coverage',
				'equipment_records',
			]));
		expect(audit.assetReviews[0].categoryGroups).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: 'maintenance_coverage',
					title: 'Maintenance',
					findings: expect.arrayContaining([
						expect.objectContaining({
							ruleId: 'systems-missing-actionable-maintenance-coverage',
						}),
					]),
				}),
				expect.objectContaining({
					id: 'equipment_records',
					title: 'Equipment Records',
					findings: expect.arrayContaining([
						expect.objectContaining({
							ruleId: 'major-systems-missing-install-dates',
						}),
					]),
				}),
			]),
		);
		expect(audit.assetReviews[0].findings.map((finding) => finding.ruleId))
			.toEqual(expect.arrayContaining([
				'systems-missing-actionable-maintenance-coverage',
				'systems-missing-maintenance-history',
				'major-systems-missing-install-dates',
			]));
	});
});
