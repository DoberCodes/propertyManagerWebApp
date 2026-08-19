import {
	getSuggestedTaskApplicableRecords,
	getSuggestedTaskIdsForSystemVariants,
	getSuggestedTasksForSystems,
} from './suggestedMaintenance';

describe('suggested maintenance variant applicability', () => {
	it('keeps the tank flush by default until the water-heater subtype is known', () => {
		const taskIds = getSuggestedTaskIdsForSystemVariants(
			['water-heater'],
			[undefined],
		);
		expect(taskIds).toContain('water-heater-flush');
		expect(taskIds).not.toContain(
			'tankless-water-heater-descaling-review',
		);
	});

	it('replaces tank flushing with tankless descaling guidance', () => {
		const taskIds = getSuggestedTaskIdsForSystemVariants(
			['water-heater'],
			['Tankless Electric'],
		);
		expect(taskIds).not.toContain('water-heater-flush');
		expect(taskIds).toContain('tankless-water-heater-descaling-review');
		expect(
			getSuggestedTasksForSystems(['water-heater'], taskIds).map(
				(task) => task.title,
			),
		).toContain('Review Tankless Water Heater Descaling');
	});

	it('retains both applicable task groups for mixed tank and tankless records', () => {
		const taskIds = getSuggestedTaskIdsForSystemVariants(
			['water-heater'],
			['Tank Gas', 'Tankless Gas'],
		);
		expect(taskIds).toEqual(
			expect.arrayContaining([
				'water-heater-flush',
				'tankless-water-heater-descaling-review',
			]),
		);

		const tasks = getSuggestedTasksForSystems(['water-heater'], taskIds);
		const records = [
			{ id: 'tank', assetVariant: 'Tank Gas' },
			{ id: 'tankless', assetVariant: 'Tankless Gas' },
		];
		expect(
			getSuggestedTaskApplicableRecords(
				tasks.find((task) => task.id === 'water-heater-flush')!,
				records,
			).map((record) => record.id),
		).toEqual(['tank']);
		expect(
			getSuggestedTaskApplicableRecords(
				tasks.find(
					(task) => task.id === 'tankless-water-heater-descaling-review',
				)!,
				records,
			).map((record) => record.id),
		).toEqual(['tankless']);
	});
});
