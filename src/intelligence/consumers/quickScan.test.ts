import { Device, Property } from '../../types/Property.types';
import { runQuickPropertyScan } from './quickScan';

const property: Property = {
	id: 'property-1',
	userId: 'user-1',
	title: 'Test Home',
	slug: 'test-home',
};

const hvac: Device = {
	id: 'hvac-1',
	userId: 'user-1',
	type: 'HVAC',
	assetType: 'HVAC',
	brand: 'Maintley',
	model: 'Model A',
	serialNumber: 'SN-1',
	installationDate: '2020-01-01',
	filterSize: '',
	location: {
		propertyId: property.id,
	},
	status: 'Active',
};

describe('Quick Property Scan plan separation', () => {
	it('keeps knowledge-pack filter guidance on Homeowner+ while preserving the free scan boundary', () => {
		const input = {
			property,
			systems: [hvac],
			tasks: [],
			maintenanceHistory: [{ id: 'history-1', deviceId: hvac.id }],
			createdAt: '2026-06-26T12:00:00.000Z',
		};

		const homeownerFindings = runQuickPropertyScan(input, {
			planId: 'homeowner',
		});
		const homeownerPlusFindings = runQuickPropertyScan(input, {
			planId: 'homeowner_plus',
		});

		expect(
			homeownerFindings.some(
				(finding) =>
					finding.ruleId === 'knowledge-pack-record-details-missing',
			),
		).toBe(false);
		expect(
			homeownerPlusFindings.some(
				(finding) =>
					finding.ruleId === 'knowledge-pack-record-details-missing',
			),
		).toBe(true);
	});
});
