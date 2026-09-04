import {
	ActiveGrantedPlanAccess,
	getActiveGrantedPlanAccess,
	getEffectiveAccessPlanId,
	getEffectiveSubscriptionPlanId,
	getSubscriptionPlanDetails,
	SubscriptionData,
} from './subscriptionUtils';

export type AccountAccessSource =
	| 'billing'
	| 'complimentary_temporary'
	| 'complimentary_permanent';

export interface AccountAccessPresentation {
	billingPlanId: string;
	accessPlanId: string;
	billingPlanName: string;
	accessPlanName: string;
	maxProperties: number;
	maxDevices: number;
	maxStorageGb: number;
	source: AccountAccessSource;
	grantedAccess: ActiveGrantedPlanAccess | null;
	accessEndsAtMs: number | null;
}

export const getAccountAccessPresentation = (
	subscription?: Partial<SubscriptionData> | null,
	nowMs = Date.now(),
): AccountAccessPresentation => {
	const billingPlanId = getEffectiveSubscriptionPlanId(
		subscription as SubscriptionData | null,
		'homeowner',
	);
	const accessPlanId = getEffectiveAccessPlanId(
		subscription as SubscriptionData | null,
		nowMs,
	);
	const billingPlan = getSubscriptionPlanDetails(billingPlanId);
	const accessPlan = getSubscriptionPlanDetails(accessPlanId);
	const activeGrant = getActiveGrantedPlanAccess(subscription, nowMs);
	const grantedAccess =
		activeGrant?.planId === accessPlanId && accessPlanId !== billingPlanId
			? activeGrant
			: null;

	return {
		billingPlanId,
		accessPlanId,
		billingPlanName: billingPlan?.name || 'Free',
		accessPlanName: accessPlan?.name || billingPlan?.name || 'Free',
		maxProperties: accessPlan?.maxProperties ?? 1,
		maxDevices: accessPlan?.maxDevices ?? 0,
		maxStorageGb: accessPlan?.maxStorageGb ?? 0,
		source: grantedAccess
			? grantedAccess.kind === 'permanent'
				? 'complimentary_permanent'
				: 'complimentary_temporary'
			: 'billing',
		grantedAccess,
		accessEndsAtMs: grantedAccess?.endsAtMs ?? null,
	};
};
