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

const getLegacyFinancialTotal = (financials?: TaskFinancials): number | undefined => {
	if (!financials) return undefined;
	const legacy = financials as TaskFinancials & {
		totalCost?: unknown;
		cost?: unknown;
		amount?: unknown;
		contractorCost?: unknown;
		materialsCost?: unknown;
		laborCost?: unknown;
		otherCost?: unknown;
	};

	const directTotal =
		toNumberOrUndefined(legacy.totalCost) ??
		toNumberOrUndefined(legacy.cost) ??
		toNumberOrUndefined(legacy.amount);
	if (directTotal !== undefined) return directTotal;

	return calculateCostTotal({
		contractorCost: toNumberOrUndefined(legacy.contractorCost),
		materialsCost: toNumberOrUndefined(legacy.materialsCost),
		laborCost: toNumberOrUndefined(legacy.laborCost),
		otherCost: toNumberOrUndefined(legacy.otherCost),
	});
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
		toNumberOrUndefined(financials.actualCost) ??
		calculateCostTotal(financials.actual) ??
		toNumberOrUndefined(financials.estimatedCost) ??
		calculateCostTotal(financials.estimate) ??
		getLegacyFinancialTotal(financials)
	);
};

export const normalizeFinancialsWithTotals = (
	financials?: TaskFinancials,
): TaskFinancials | undefined => {
	if (!financials) return undefined;

	const estimatedCost =
		toNumberOrUndefined(financials.estimatedCost) ??
		calculateCostTotal(financials.estimate);
	const actualCost =
		toNumberOrUndefined(financials.actualCost) ??
		calculateCostTotal(financials.actual) ??
		getLegacyFinancialTotal(financials);

	return {
		...financials,
		...(estimatedCost !== undefined ? { estimatedCost } : {}),
		...(actualCost !== undefined ? { actualCost } : {}),
	};
};
