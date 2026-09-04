import {
	PROPERTY_SETUP_AREAS,
	PROPERTY_SETUP_ESSENTIAL_AREAS,
	getFirstIncompleteSetupAreaId,
	getPropertySetupInstanceName,
	getPropertySetupProgress,
	getPropertySetupSubtypeOptions,
	getUnreviewedDetectedSetupItemIds,
	isDistributedPropertySetupItem,
} from './propertySetupAssistant';

describe('property setup assistant paths', () => {
	it('keeps the essentials path finite and focused', () => {
		const itemIds = PROPERTY_SETUP_ESSENTIAL_AREAS.flatMap(
			(area) => area.itemIds,
		);

		expect(itemIds).toHaveLength(9);
		expect(itemIds).toEqual(
			expect.arrayContaining([
				'hvac',
				'water-heater',
				'smoke-detectors',
				'carbon-monoxide-detectors',
			]),
		);
		expect(PROPERTY_SETUP_ESSENTIAL_AREAS.length).toBeLessThan(
			PROPERTY_SETUP_AREAS.length,
		);
	});

	it('does not count untouched or skipped items as reviewed', () => {
		const progress = getPropertySetupProgress({
			items: {
				refrigerator: { status: 'unknown' },
			},
		});

		expect(progress.reviewed).toBe(0);
		expect(progress.isComplete).toBe(false);
	});

	it('reports matching equipment separately without converting it into progress', () => {
		const items = {
			refrigerator: { status: 'unknown' as const },
			dishwasher: { status: 'not_present' as const },
		};

		expect(
			getUnreviewedDetectedSetupItemIds(items, [
				'refrigerator',
				'dishwasher',
				'hvac',
			]),
		).toEqual(['refrigerator', 'hvac']);
		expect(getPropertySetupProgress({ items }).reviewed).toBe(1);
		expect(items.refrigerator.status).toBe('unknown');
	});

	it('calculates path-specific progress without changing full setup progress', () => {
		const essentialItems = Object.fromEntries(
			PROPERTY_SETUP_ESSENTIAL_AREAS.flatMap((area) => area.itemIds).map(
				(itemId) => [itemId, { status: 'not_present' as const }],
			),
		);
		const setupAssistant = { items: essentialItems };

		expect(
			getPropertySetupProgress(
				setupAssistant,
				PROPERTY_SETUP_ESSENTIAL_AREAS,
			),
		).toMatchObject({ reviewed: 9, total: 9, isComplete: true });
		expect(getPropertySetupProgress(setupAssistant).isComplete).toBe(false);
	});

	it('finds the first incomplete area within the selected path', () => {
		expect(
			getFirstIncompleteSetupAreaId(
				{
					items: {
						'gfci-outlets': { status: 'not_present' },
					},
				},
				PROPERTY_SETUP_ESSENTIAL_AREAS,
			),
		).toBe('laundry');
	});

	it('offers guidance-relevant subtypes without mixing safety-device types', () => {
		expect(getPropertySetupSubtypeOptions('water-heater')).toEqual(
			expect.arrayContaining(['Tank Gas', 'Tankless Electric', 'Heat Pump']),
		);
		expect(getPropertySetupSubtypeOptions('smoke-detectors')).toEqual([
			'Smoke Detector',
			'Combo Detector',
		]);
		expect(
			getPropertySetupSubtypeOptions('smoke-detectors'),
		).not.toContain('Carbon Monoxide Detector');
	});

	it('provides stable homeowner-readable names for repeated equipment', () => {
		expect(getPropertySetupInstanceName('refrigerator', 0)).toBe('Refrigerator');
		expect(getPropertySetupInstanceName('refrigerator', 1)).toBe(
			'Refrigerator 2',
		);
		expect(isDistributedPropertySetupItem('smoke-detectors')).toBe(true);
		expect(isDistributedPropertySetupItem('refrigerator')).toBe(false);
	});
});
