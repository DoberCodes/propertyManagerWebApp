import { EntitlementGrant } from '@maintley/entitlements';
import { getAccountAccessPresentation } from './accountAccessPresentation';
import {
	canAddDevice,
	canAddProperty,
	getRemainingPropertySlots,
	SubscriptionData,
} from './subscriptionUtils';

const nowMs = Date.UTC(2026, 7, 18);

const grant = (
	bundleId: 'homeowner_plus' | 'portfolio',
	kind: 'temporary' | 'permanent',
	overrides: Partial<EntitlementGrant> = {},
): EntitlementGrant => ({
	grantId: `${bundleId}-grant`,
	programId: `${bundleId}-program`,
	accountId: 'account-1',
	bundleId,
	bundleVersion: 'v1',
	kind,
	state: 'active',
	source: 'support',
	startsAtMs: nowMs - 1_000,
	...(kind === 'temporary'
		? { endsAtMs: nowMs + 86_400_000 }
		: { endsAtMs: null }),
	...overrides,
});

describe('getAccountAccessPresentation', () => {
	it('presents a Free account without a grant as billing access', () => {
		const result = getAccountAccessPresentation(
			{ plan: 'homeowner', status: 'active' },
			nowMs,
		);

		expect(result).toMatchObject({
			billingPlanId: 'homeowner',
			accessPlanId: 'homeowner',
			billingPlanName: 'Free',
			accessPlanName: 'Free',
			maxProperties: 1,
			source: 'billing',
			grantedAccess: null,
		});
	});

	it('uses temporary Homeowner+ access and limits while preserving Free billing', () => {
		const result = getAccountAccessPresentation(
			{
				plan: 'homeowner',
				status: 'active',
				entitlementAccountId: 'account-1',
				entitlementGrants: [grant('homeowner_plus', 'temporary')],
			},
			nowMs,
		);

		expect(result).toMatchObject({
			billingPlanId: 'homeowner',
			accessPlanId: 'homeowner_plus',
			billingPlanName: 'Free',
			accessPlanName: 'Homeowner+',
			maxProperties: 5,
			maxStorageGb: 10,
			source: 'complimentary_temporary',
			accessEndsAtMs: nowMs + 86_400_000,
		});
	});

	it('uses permanent Portfolio access and limits while preserving Free billing', () => {
		const result = getAccountAccessPresentation(
			{
				plan: 'homeowner',
				status: 'active',
				entitlementAccountId: 'account-1',
				entitlementGrants: [grant('portfolio', 'permanent')],
			},
			nowMs,
		);

		expect(result).toMatchObject({
			billingPlanId: 'homeowner',
			accessPlanId: 'portfolio',
			maxProperties: 15,
			maxStorageGb: 25,
			source: 'complimentary_permanent',
			accessEndsAtMs: null,
		});
	});

	it('ignores expired grants', () => {
		const result = getAccountAccessPresentation(
			{
				plan: 'homeowner',
				status: 'active',
				entitlementAccountId: 'account-1',
				entitlementGrants: [
					grant('homeowner_plus', 'temporary', { endsAtMs: nowMs - 1 }),
				],
			},
			nowMs,
		);

		expect(result.accessPlanId).toBe('homeowner');
		expect(result.source).toBe('billing');
	});

	it('does not let a lower grant replace a paid Portfolio presentation', () => {
		const result = getAccountAccessPresentation(
			{
				plan: 'portfolio',
				status: 'active',
				stripeSubscriptionId: 'sub_123',
				entitlementAccountId: 'account-1',
				entitlementGrants: [grant('homeowner_plus', 'temporary')],
			},
			nowMs,
		);

		expect(result).toMatchObject({
			billingPlanId: 'portfolio',
			accessPlanId: 'portfolio',
			source: 'billing',
			grantedAccess: null,
		});
	});

	it('applies granted limits to creation capacity even when billing is expired', () => {
		const subscription = {
			plan: 'homeowner',
			status: 'expired',
			currentPeriodStart: 0,
			currentPeriodEnd: 0,
			entitlementAccountId: 'account-1',
			entitlementGrants: [grant('portfolio', 'permanent')],
		} as SubscriptionData;

		expect(canAddProperty(subscription, 9)).toBe(true);
		expect(getRemainingPropertySlots(subscription, 9)).toBe(6);
		expect(canAddDevice(subscription, 100)).toBe(true);
	});
});
