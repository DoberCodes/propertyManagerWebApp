import {
	getFinancialDisplayTotal,
	normalizeFinancialsWithTotals,
} from './financialUtils';
import type { CostBreakdown } from '../types/Task.types';

describe('financial utilities', () => {
	it.each([
		['contractorCost', 125],
		['materialsCost', 24.5],
		['laborCost', 80],
		['otherCost', 12.75],
	] as Array<[keyof CostBreakdown, number]>)(
		'tracks an actual total when only %s is entered',
		(field, amount) => {
			const financials = normalizeFinancialsWithTotals({
				currency: 'USD',
				actual: {
					[field]: amount,
				},
			});

			expect(financials).toEqual({
				currency: 'USD',
				actual: {
					[field]: amount,
				},
				actualCost: amount,
			});
			expect(getFinancialDisplayTotal(financials)).toBe(amount);
		},
	);

	it('sums all actual cost buckets when multiple fields are entered', () => {
		const financials = normalizeFinancialsWithTotals({
			currency: 'USD',
			actual: {
				contractorCost: 100,
				materialsCost: 24.5,
				laborCost: 80,
				otherCost: 12.75,
			},
		});

		expect(financials?.actualCost).toBe(217.25);
		expect(getFinancialDisplayTotal(financials)).toBe(217.25);
	});
});
