const FLAG_NAMES = [
	'REACT_APP_ENABLE_MULTI_HOMEOWNER_PLAN',
	'REACT_APP_ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL',
	'REACT_APP_ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE',
] as const;

const originalFlags = Object.fromEntries(
	FLAG_NAMES.map((name) => [name, process.env[name]]),
);

const loadAvailability = (flags: Partial<Record<(typeof FLAG_NAMES)[number], string>>) => {
	jest.resetModules();
	FLAG_NAMES.forEach((name) => {
		process.env[name] = flags[name] || 'false';
	});
	return require('./planAvailability') as typeof import('./planAvailability');
};

afterEach(() => {
	FLAG_NAMES.forEach((name) => {
		const original = originalFlags[name];
		if (original === undefined) {
			delete process.env[name];
		} else {
			process.env[name] = original;
		}
	});
	jest.resetModules();
});

describe('plan availability rollout flags', () => {
	it('exposes Multi-Homeowner only when its client flag is explicitly true', () => {
		expect(loadAvailability({}).isPlanAvailable('multi_homeowner')).toBe(false);
		expect(
			loadAvailability({
				REACT_APP_ENABLE_MULTI_HOMEOWNER_PLAN: 'true',
			}).isPlanAvailable('multi_homeowner'),
		).toBe(true);
		expect(loadAvailability({}).isPlanAvailable('homeowner_plus')).toBe(true);
	});

	it('enables the first-property trial client flow only when both grant flags are true', () => {
		expect(
			loadAvailability({
				REACT_APP_ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL: 'true',
			}).isHomeownerPlusTrialEnabled(),
		).toBe(false);
		expect(
			loadAvailability({
				REACT_APP_ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE: 'true',
			}).isHomeownerPlusTrialEnabled(),
		).toBe(false);
		expect(
			loadAvailability({
				REACT_APP_ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL: 'true',
				REACT_APP_ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE: 'true',
			}).isHomeownerPlusTrialEnabled(),
		).toBe(true);
	});
});
