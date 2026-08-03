export type AnalyticsIdentity = {
	userId: string | null;
	roleFamily: string;
	planFamily: string;
};

export const getAnalyticsRoleFamily = (role: unknown): string => {
	const normalized = String(role || '').trim().toLowerCase();
	if (['admin', 'account_owner', 'homeowner'].includes(normalized)) return 'owner';
	if (
		['manager', 'property_manager', 'assistant_manager'].includes(normalized)
	) {
		return 'manager';
	}
	if (['maintenance', 'maintenance_lead', 'contractor'].includes(normalized)) {
		return 'contributor';
	}
	if (normalized === 'tenant') return 'tenant';
	return normalized ? 'other' : 'anonymous';
};

export const getAnalyticsPlanFamily = (plan: unknown): string => {
	const normalized = String(plan || '').trim().toLowerCase();
	if (['homeowner_plus', 'homeowner+'].includes(normalized)) {
		return 'homeowner_plus';
	}
	if (['property', 'portfolio'].includes(normalized)) return 'business';
	if (['team', 'tenant'].includes(normalized)) return 'contributor';
	if (['homeowner', 'free'].includes(normalized)) return 'free';
	return 'unknown';
};
