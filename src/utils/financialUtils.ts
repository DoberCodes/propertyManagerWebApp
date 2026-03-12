import type { CostBreakdown, TaskFinancials } from '../types/Task.types';

export const toNumberOrUndefined = (value: unknown): number | undefined => {
	if (value === null || value === undefined || value === '') return undefined;
	const parsed = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

export const hasCostData = (costs?: CostBreakdown): boolean => {
	if (!costs) return false;
	return (
		costs.contractorCost !== undefined ||
		costs.materialsCost !== undefined ||
		costs.laborCost !== undefined ||
		costs.otherCost !== undefined
	);
};

export const calculateCostTotal = (costs?: CostBreakdown): number | undefined => {
	if (!costs) return undefined;
	const parts = [
		costs.contractorCost,
		costs.materialsCost,
		costs.laborCost,
		costs.otherCost,
	]
		.map((value) => toNumberOrUndefined(value))
		.filter((value): value is number => value !== undefined);

	if (parts.length === 0) return undefined;
	return parts.reduce((sum, value) => sum + value, 0);
};

export const formatCurrency = (
	value?: number,
	currency: string = 'USD',
): string => {
	if (value === undefined || value === null || Number.isNaN(value)) return '-';
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
		maximumFractionDigits: 2,
	}).format(value);
};

export const getFinancialDisplayTotal = (
	financials?: TaskFinancials,
): number | undefined => {
	if (!financials) return undefined;
	return (
		calculateCostTotal(financials.actual) ??
		calculateCostTotal(financials.estimate)
	);
};
