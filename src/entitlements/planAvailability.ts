import { ENTITLEMENT_FEATURE_FLAGS } from './featureFlags';

export const isMultiHomeownerPlanEnabled = (): boolean =>
	ENTITLEMENT_FEATURE_FLAGS.multiHomeownerPlan;

export const isPlanAvailable = (planId: string): boolean =>
	planId !== 'multi_homeowner' || isMultiHomeownerPlanEnabled();
