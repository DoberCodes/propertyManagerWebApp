import {
	ADMIN_AUDIT_ACTIONS,
	DEFAULT_ENTITLEMENT_FEATURE_FLAGS,
	EntitlementGrant,
	PlanId,
	PLAN_PRESETS,
	getEntitlementLimit,
	hasCapability,
	isPlanEnabled,
	getAdminAuditEventId,
	getComplimentaryTransitionIssues,
	resolveAccountEntitlements,
	toLegacyPermissions,
} from '@maintley/entitlements';
import { SUBSCRIPTION_PLANS } from '../constants/subscriptions';

const NOW_MS = Date.UTC(2026, 6, 23, 16, 0, 0);

const activeSubscription = (plan: string, stripeSubscriptionId?: string) => ({
	status: 'active',
	plan,
	stripeSubscriptionId,
});

const grant = (
	overrides: Partial<EntitlementGrant> = {},
): EntitlementGrant => ({
	grantId: 'grant-1',
	programId: 'program-1',
	accountId: 'account-1',
	kind: 'temporary',
	state: 'active',
	startsAtMs: NOW_MS - 60_000,
	endsAtMs: NOW_MS + 60_000,
	source: 'promotion',
	...overrides,
});

describe('centralized entitlement resolver', () => {
	it('matches every existing plan limit and legacy permission preset', () => {
		const plans = [
			SUBSCRIPTION_PLANS.HOMEOWNER,
			SUBSCRIPTION_PLANS.HOMEOWNER_PLUS,
			SUBSCRIPTION_PLANS.MULTI_HOMEOWNER,
			SUBSCRIPTION_PLANS.PROPERTY,
			SUBSCRIPTION_PLANS.PORTFOLIO,
			SUBSCRIPTION_PLANS.GUEST,
			SUBSCRIPTION_PLANS.TEAM,
			SUBSCRIPTION_PLANS.TENANT,
		];

		for (const plan of plans) {
			const preset = PLAN_PRESETS[plan.id as PlanId];
			expect(preset.limits).toEqual({
				properties: plan.maxProperties,
				devices: plan.maxDevices,
				files: plan.maxFiles,
				storage_gb: plan.maxStorageGb,
				suggested_maintenance_packages:
					plan.permissions.suggestedMaintenancePackageLimit,
			});
			expect(toLegacyPermissions(preset)).toEqual(plan.permissions);
		}
	});

	it('keeps Multi-Homeowner disabled until its launch flag is enabled', () => {
		const subscription = activeSubscription('multi_homeowner', 'sub-multi');
		const disabled = resolveAccountEntitlements({
			subscription,
			nowMs: NOW_MS,
		});
		const enabled = resolveAccountEntitlements({
			subscription,
			nowMs: NOW_MS,
			featureFlags: { multiHomeownerPlan: true },
		});

		expect(isPlanEnabled('multi_homeowner')).toBe(false);
		expect(isPlanEnabled('unknown-plan')).toBe(false);
		expect(
			isPlanEnabled('multi_homeowner', { multiHomeownerPlan: true }),
		).toBe(true);
		expect(disabled.basePlanId).toBe('homeowner');
		expect(disabled.diagnostics.map(({ code }) => code)).toContain(
			'disabled_plan',
		);
		expect(enabled.basePlanId).toBe('multi_homeowner');
		expect(enabled.limits.properties).toBe(5);
		expect(enabled.limits.files).toBe(250);
		expect(enabled.limits.storage_gb).toBe(5);
		expect(enabled.capabilities['property_groups.manage']).toBe(true);
		expect(enabled.capabilities['team.manage']).toBe(false);
		expect(enabled.capabilities['residents.manage']).toBe(false);
		expect(enabled.capabilities['portfolio.reporting']).toBe(false);
	});

	it('provides typed default-deny capability and limit lookups', () => {
		expect(hasCapability(PLAN_PRESETS.homeowner_plus, 'notifications.use')).toBe(
			true,
		);
		expect(hasCapability(PLAN_PRESETS.homeowner, 'notifications.use')).toBe(false);
		expect(getEntitlementLimit(PLAN_PRESETS.property, 'properties')).toBe(7);
		expect(
			hasCapability(
				PLAN_PRESETS.portfolio,
				'unknown.capability' as Parameters<typeof hasCapability>[1],
			),
		).toBe(false);
		expect(
			getEntitlementLimit(
				PLAN_PRESETS.portfolio,
				'unknown_limit' as Parameters<typeof getEntitlementLimit>[1],
			),
		).toBe(0);
	});

	it('preserves current active, trial, expired, pending, and scheduled behavior', () => {
		expect(
			resolveAccountEntitlements({
				subscription: activeSubscription('homeowner'),
				nowMs: NOW_MS,
			}).basePlanId,
		).toBe('homeowner');
		expect(
			resolveAccountEntitlements({
				subscription: activeSubscription('portfolio', 'sub-1'),
				nowMs: NOW_MS,
			}).basePlanId,
		).toBe('portfolio');
		expect(
			resolveAccountEntitlements({
				subscription: {
					status: 'trial',
					plan: 'property',
					trialEndsAt: NOW_MS / 1000 + 60,
				},
				nowMs: NOW_MS,
			}).basePlanId,
		).toBe('property');
		expect(
			resolveAccountEntitlements({
				subscription: { status: 'expired', plan: 'portfolio' },
				nowMs: NOW_MS,
			}).basePlanId,
		).toBe('homeowner');
		expect(
			resolveAccountEntitlements({
				subscription: {
					...activeSubscription('portfolio'),
					pendingCheckoutPlan: 'portfolio',
				},
				nowMs: NOW_MS,
			}).basePlanId,
		).toBe('homeowner');
		expect(
			resolveAccountEntitlements({
				subscription: {
					...activeSubscription('homeowner'),
					hasScheduledSubscription: true,
					scheduledPlan: 'portfolio',
				},
				nowMs: NOW_MS,
			}).basePlanId,
		).toBe('homeowner');
	});

	it('separates compatibility access from strict Stripe confirmation', () => {
		const subscription = activeSubscription('portfolio');
		const compatibility = resolveAccountEntitlements({
			subscription,
			nowMs: NOW_MS,
			mode: 'compatibility',
		});
		const strict = resolveAccountEntitlements({
			subscription,
			nowMs: NOW_MS,
			mode: 'strict',
		});

		expect(compatibility.basePlanId).toBe('portfolio');
		expect(compatibility.diagnostics.map(({ code }) => code)).toContain(
			'legacy_paid_access',
		);
		expect(strict.basePlanId).toBe('homeowner');
		expect(strict.diagnostics.map(({ code }) => code)).toContain(
			'unconfirmed_paid_subscription',
		);
	});

	it('preserves plan-only frontend records only when explicitly requested', () => {
		const defaultResult = resolveAccountEntitlements({
			subscription: { plan: 'property' },
			nowMs: NOW_MS,
		});
		const legacyFrontendResult = resolveAccountEntitlements({
			subscription: { plan: 'property' },
			nowMs: NOW_MS,
			allowLegacyPlanWithoutStatus: true,
		});

		expect(defaultResult.basePlanId).toBe('homeowner');
		expect(legacyFrontendResult.basePlanId).toBe('property');
		expect(legacyFrontendResult.diagnostics.map(({ code }) => code)).toContain(
			'legacy_missing_subscription_status',
		);
	});

	it('merges simultaneous active grants additively', () => {
		const result = resolveAccountEntitlements({
			accountId: 'account-1',
			subscription: activeSubscription('homeowner'),
			grants: [
				grant({ bundleId: 'homeowner_plus', bundleVersion: 'v1' }),
				grant({
					grantId: 'grant-2',
					programId: 'program-2',
					capabilityOverrides: { 'team.manage': true },
					limitOverrides: { properties: 5, files: 400 },
				}),
			],
			nowMs: NOW_MS,
		});

		expect(result.capabilities['recurring_tasks.use']).toBe(true);
		expect(result.capabilities['team.manage']).toBe(true);
		expect(result.limits.properties).toBe(5);
		expect(result.limits.files).toBe(400);
		expect(result.activeGrantIds).toEqual(['grant-1', 'grant-2']);
	});

	it('supports permanent grants without an artificial end date', () => {
		const result = resolveAccountEntitlements({
			accountId: 'account-1',
			subscription: activeSubscription('homeowner'),
			grants: [
				grant({
					kind: 'permanent',
					endsAtMs: null,
					source: 'lifetime',
					bundleId: 'homeowner_plus',
					bundleVersion: 'v1',
				}),
			],
			nowMs: NOW_MS,
		});

		expect(result.capabilities['property_intelligence.use']).toBe(true);
		expect(result.activeGrantIds).toEqual(['grant-1']);
	});

	it('derives active access from lifecycle state and authoritative timestamps', () => {
		const inactiveGrants: EntitlementGrant[] = [
			grant({ grantId: 'future', startsAtMs: NOW_MS + 1 }),
			grant({ grantId: 'ended', endsAtMs: NOW_MS }),
			grant({ grantId: 'revoked', state: 'revoked' }),
			grant({ grantId: 'converted', state: 'converted' }),
			grant({ grantId: 'scheduled', state: 'scheduled' }),
		];
		const result = resolveAccountEntitlements({
			accountId: 'account-1',
			subscription: activeSubscription('homeowner'),
			grants: inactiveGrants,
			nowMs: NOW_MS,
		});

		expect(result.activeGrantIds).toEqual([]);
		expect(result.capabilities['recurring_tasks.use']).toBe(false);
	});

	it('requires account scope and rejects grants owned by another account', () => {
		const missingScope = resolveAccountEntitlements({
			grants: [grant({ bundleId: 'homeowner_plus', bundleVersion: 'v1' })],
			nowMs: NOW_MS,
		});
		const wrongScope = resolveAccountEntitlements({
			accountId: 'account-2',
			grants: [grant({ bundleId: 'homeowner_plus', bundleVersion: 'v1' })],
			nowMs: NOW_MS,
		});

		expect(missingScope.activeGrantIds).toEqual([]);
		expect(missingScope.diagnostics.map(({ code }) => code)).toContain(
			'missing_account_scope',
		);
		expect(wrongScope.activeGrantIds).toEqual([]);
		expect(wrongScope.diagnostics.map(({ code }) => code)).toContain(
			'grant_account_mismatch',
		);
	});

	it('ignores duplicate, restrictive, unknown, and role-bundle grant input', () => {
		const result = resolveAccountEntitlements({
			accountId: 'account-1',
			subscription: activeSubscription('property', 'sub-1'),
			grants: [
				grant({
					bundleId: 'tenant',
					bundleVersion: 'v1',
					capabilityOverrides: {
						'team.manage': false,
						'unknown.capability': true,
					},
				}),
				grant({
					limitOverrides: { properties: 99 },
				}),
			],
			nowMs: NOW_MS,
		});
		const diagnosticCodes = result.diagnostics.map(({ code }) => code);

		expect(result.capabilities['team.manage']).toBe(true);
		expect(result.limits.properties).toBe(7);
		expect(diagnosticCodes).toEqual(
			expect.arrayContaining([
				'unknown_grant_bundle',
				'restrictive_override_ignored',
				'unknown_capability',
				'duplicate_grant',
			]),
		);
	});

	it('defaults unknown plans and bundle versions to Free with diagnostics', () => {
		const unknownPlan = resolveAccountEntitlements({
			subscription: activeSubscription('future_enterprise'),
			nowMs: NOW_MS,
		});
		const unknownVersion = resolveAccountEntitlements({
			subscription: activeSubscription('portfolio', 'sub-1'),
			baseBundleVersion: 'v999',
			nowMs: NOW_MS,
		});

		expect(unknownPlan.basePlanId).toBe('homeowner');
		expect(unknownPlan.diagnostics.map(({ code }) => code)).toContain(
			'unknown_plan',
		);
		expect(unknownVersion.basePlanId).toBe('homeowner');
		expect(unknownVersion.diagnostics.map(({ code }) => code)).toContain(
			'unknown_bundle_version',
		);
	});

	it('keeps every new access program disabled by default', () => {
		expect(DEFAULT_ENTITLEMENT_FEATURE_FLAGS).toEqual({
			multiHomeownerPlan: false,
			homeownerPlusProductTrial: false,
			internalEntitlementGrantIssuance: false,
			complimentaryPaidTransitions: false,
			accessLifecycleCommunication: false,
		});
		expect(ADMIN_AUDIT_ACTIONS).toEqual(
			expect.arrayContaining([
				'grant.created',
				'billing_transition.opted_out',
				'access_email.sent',
				'stripe_migration.started',
				'stripe_migration.completed',
				'admin_action.failed',
				'admin_action.replayed',
			]),
		);
	});

	it('uses request IDs to make high-value audit writes idempotent', () => {
		expect(getAdminAuditEventId('grant.created', 'request-123')).toBe(
			'grant.created__request-123',
		);
		expect(getAdminAuditEventId('grant.created', 'request-123')).toBe(
			getAdminAuditEventId('grant.created', 'request-123'),
		);
		expect(() => getAdminAuditEventId('grant.created', '')).toThrow();
	});

	it('requires Stripe authority and versioned consent for automatic transitions', () => {
		expect(
			getComplimentaryTransitionIssues({ mode: 'none' }),
		).toEqual([]);
		expect(
			getComplimentaryTransitionIssues({ mode: 'checkout_required' }),
		).toEqual([]);
		expect(
			getComplimentaryTransitionIssues({ mode: 'automatic' }),
		).toEqual(
			expect.arrayContaining([
				'missing_stripe_authority',
				'payment_method_not_usable',
				'missing_versioned_consent',
				'missing_first_charge',
			]),
		);
		expect(
			getComplimentaryTransitionIssues({
				mode: 'automatic',
				targetPlanId: 'homeowner_plus',
				billingCycle: 'annual',
				currency: 'usd',
				recurringAmountMinor: 3999,
				firstChargeAt: '2026-08-22T16:00:00.000Z',
				paymentMethodStatus: 'usable',
				disclosureVersion: 'v1',
				termsVersion: 'v1',
				consentAt: '2026-07-23T16:00:00.000Z',
				consentActorUserId: 'user-1',
				stripeSubscriptionScheduleId: 'sub_sched_1',
			}),
		).toEqual([]);
	});
});
