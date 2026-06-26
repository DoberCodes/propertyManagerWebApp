import {
	getDeviceAssetVariant,
	getDeviceAssetType,
	getAssetVariantOptions,
	normalizeAssetType,
	UNKNOWN_ASSET_TYPE,
} from './systemTypes';

describe('systemTypes', () => {
	it('normalizes known broad system types', () => {
		expect(normalizeAssetType('tankless water heater')).toBe('Water Heater');
		expect(normalizeAssetType('mini split')).toBe('HVAC');
		expect(normalizeAssetType('smoke detector')).toBe('Safety Device');
	});

	it('keeps unknown legacy types instead of forcing a migration', () => {
		expect(normalizeAssetType('Roof')).toBe('Roof');
		expect(normalizeAssetType('')).toBe(UNKNOWN_ASSET_TYPE);
	});

	it('returns subtype options by broad system type', () => {
		expect(getAssetVariantOptions('Water Heater')).toEqual([
			'Tank Gas',
			'Tank Electric',
			'Tankless Gas',
			'Tankless Electric',
			'Heat Pump',
			'Solar',
		]);
	});

	it('prefers saved system type and subtype fields', () => {
		const system = {
			type: 'HVAC',
			assetType: 'HVAC',
			assetVariant: 'Furnace',
		};

		expect(getDeviceAssetType(system)).toBe('HVAC');
		expect(getDeviceAssetVariant(system)).toBe('Furnace');
	});

	it('infers subtype from legacy type text when subtype is not recorded', () => {
		expect(getDeviceAssetType({ type: 'Smoke Detector' })).toBe('Safety Device');
		expect(getDeviceAssetVariant({ type: 'Smoke Detector' })).toBe(
			'Smoke Detector',
		);
		expect(getDeviceAssetVariant({ type: 'Tankless Water Heater' })).toBe(
			'Tankless Gas',
		);
	});
});
