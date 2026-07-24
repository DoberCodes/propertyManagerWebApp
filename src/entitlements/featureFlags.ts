import { DEFAULT_ENTITLEMENT_FEATURE_FLAGS } from '@maintley/entitlements';

export const ENTITLEMENT_FEATURE_FLAGS = Object.freeze({
	...DEFAULT_ENTITLEMENT_FEATURE_FLAGS,
	multiHomeownerPlan:
		process.env.REACT_APP_ENABLE_MULTI_HOMEOWNER_PLAN === 'true',
	homeownerPlusProductTrial:
		process.env.REACT_APP_ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL === 'true',
	internalEntitlementGrantIssuance:
		process.env.REACT_APP_ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE === 'true',
});
