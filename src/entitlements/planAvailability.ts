import { ENTITLEMENT_FEATURE_FLAGS } from './featureFlags';

export const isMultiHomeownerPlanEnabled = (): boolean =>
	ENTITLEMENT_FEATURE_FLAGS.multiHomeownerPlan;

export const isHomeownerPlusTrialEnabled = (): boolean =>
	ENTITLEMENT_FEATURE_FLAGS.homeownerPlusProductTrial &&
	ENTITLEMENT_FEATURE_FLAGS.internalEntitlementGrantIssuance;

export const isPlanAvailable = (planId: string): boolean =>
	planId !== 'multi_homeowner' || isMultiHomeownerPlanEnabled();
