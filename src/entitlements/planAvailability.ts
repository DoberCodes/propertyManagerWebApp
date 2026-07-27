import { ENTITLEMENT_FEATURE_FLAGS } from './featureFlags';

export const isHomeownerPlusTrialEnabled = (): boolean =>
	ENTITLEMENT_FEATURE_FLAGS.homeownerPlusProductTrial &&
	ENTITLEMENT_FEATURE_FLAGS.internalEntitlementGrantIssuance;
