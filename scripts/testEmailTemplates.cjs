const assert = require('assert');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const lifecycle = require(path.join(projectRoot, 'functions', 'lib', 'accessLifecycleEmails.js'));
const links = require(path.join(projectRoot, 'functions', 'lib', 'emailLinks.js'));

const DAY_MS = 24 * 60 * 60 * 1000;
const grant = {
	grantId: 'grant:homeowner+trial',
	programId: 'homeowner_plus_first_property_trial_v1',
	startsAtMs: Date.UTC(2026, 6, 1, 16),
	endsAtMs: Date.UTC(2026, 6, 31, 16),
};

assert.deepStrictEqual(lifecycle.getDueLifecycleMilestones(grant, grant.startsAtMs), ['activation']);
assert.deepStrictEqual(
	lifecycle.getDueLifecycleMilestones(grant, grant.startsAtMs + 21 * DAY_MS),
	['activation', 'progress', 'ending'],
);
assert.deepStrictEqual(
	lifecycle.getDueLifecycleMilestones(grant, grant.endsAtMs),
	['activation', 'progress', 'ending', 'expired'],
);
assert.strictEqual(
	lifecycle.getLifecycleDeliveryId(grant.grantId, 'activation'),
	'homeowner_plus_first_property_trial_v1__grant_homeowner_trial__activation__v1',
);

const expectedSubjects = {
	activation: 'Your first property is ready - Homeowner+ is active',
	progress: 'Your Homeowner+ trial progress',
	ending: 'Your Homeowner+ trial ends',
	expired: 'Your Maintley account is now on the Free plan',
};

for (const milestone of Object.keys(expectedSubjects)) {
	const rendered = lifecycle.renderAccessLifecycleEmail({
		milestone,
		name: '<Austin>',
		endsAtMs: grant.endsAtMs,
		timeZone: 'America/New_York',
		progress: { properties: 1, equipment: 2, documents: 3, recurringTasks: 4 },
		dashboardUrl: 'https://maintleyapp.com/#/dashboard',
		upgradeUrl: 'https://maintleyapp.com/#/paywall',
	});
	assert.ok(rendered.subject.startsWith(expectedSubjects[milestone]));
	assert.ok(rendered.html.includes('#047857'), `${milestone} uses primary green`);
	assert.ok(rendered.html.includes('#3FCC7C'), `${milestone} uses accent green`);
	assert.ok(rendered.html.includes('#1F2937'), `${milestone} uses slate text`);
	assert.ok(rendered.html.includes('&lt;Austin&gt;'), `${milestone} escapes names`);
	assert.ok(!rendered.html.includes('<Austin>'), `${milestone} does not inject names`);
}

const activation = lifecycle.renderAccessLifecycleEmail({
	milestone: 'activation',
	name: 'Austin',
	endsAtMs: grant.endsAtMs,
	timeZone: 'America/New_York',
	progress: { properties: 1, equipment: 2, documents: 3, recurringTasks: 4 },
	dashboardUrl: 'https://maintleyapp.com/#/dashboard',
	upgradeUrl: 'https://maintleyapp.com/#/paywall',
});
assert.ok(activation.html.includes('No payment method is connected'));
assert.ok(activation.html.includes('will not be charged automatically'));
assert.ok(activation.html.includes('Congratulations on creating your first property'));
assert.ok(activation.html.includes('Your first property record is ready'));

const promotionalGrant = {
	grantId: 'portfolio-preview',
	programId: 'portfolio_preview_v1',
	bundleId: 'portfolio',
	startsAtMs: Date.UTC(2026, 6, 1, 16),
	endsAtMs: Date.UTC(2026, 6, 31, 16),
	transition: { mode: 'checkout_required', status: 'not_configured' },
};
assert.deepStrictEqual(
	lifecycle.getLifecycleMilestoneDefinitions(promotionalGrant).map((item) => item.id),
	['activation', 'access_ending_7', 'expired'],
);
const promotionalActivation = lifecycle.renderPromotionalAccessLifecycleEmail({
	milestone: 'activation',
	name: 'Austin',
	endsAtMs: promotionalGrant.endsAtMs,
	timeZone: 'America/New_York',
	progress: { properties: 0, equipment: 0, documents: 0, recurringTasks: 0 },
	dashboardUrl: 'https://maintleyapp.com/#/dashboard',
	upgradeUrl: 'https://maintleyapp.com/#/paywall',
	grant: promotionalGrant,
});
assert.ok(promotionalActivation.subject.includes('complimentary Portfolio access'));
assert.ok(promotionalActivation.html.includes('No automatic charge is scheduled'));
assert.ok(promotionalActivation.html.includes('intentional Stripe Checkout'));

const automaticGrant = {
	...promotionalGrant,
	grantId: 'partner-auto',
	programId: 'partner_auto_v1',
	transition: {
		mode: 'automatic',
		targetPlanId: 'portfolio',
		billingCycle: 'monthly',
		currency: 'USD',
		recurringAmountMinor: 1499,
		firstChargeAt: promotionalGrant.endsAtMs,
		paymentMethodStatus: 'usable',
		disclosureVersion: 'disclosure-v1',
		termsVersion: 'terms-v1',
		consentAt: promotionalGrant.startsAtMs,
		consentActorUserId: 'customer-1',
		stripeSubscriptionScheduleId: 'sub_sched_test',
	},
};
assert.deepStrictEqual(
	lifecycle.getLifecycleMilestoneDefinitions(automaticGrant).map((item) => item.id),
	['activation', 'renewal_7', 'renewal_1', 'expired'],
	'activation replaces a same-day 30-day reminder',
);
const renewal = lifecycle.renderPromotionalAccessLifecycleEmail({
	milestone: 'renewal_7',
	name: 'Austin',
	endsAtMs: automaticGrant.endsAtMs,
	timeZone: 'America/New_York',
	progress: { properties: 0, equipment: 0, documents: 0, recurringTasks: 0 },
	dashboardUrl: 'https://maintleyapp.com/#/profile',
	upgradeUrl: 'https://maintleyapp.com/#/paywall',
	grant: automaticGrant,
});
assert.ok(renewal.html.includes('$14.99'));
assert.ok(renewal.html.includes('Review, cancel, or opt out'));

const beforeDst = lifecycle.formatLifecycleDate(Date.UTC(2026, 2, 8, 6, 30), 'America/New_York');
const afterDst = lifecycle.formatLifecycleDate(Date.UTC(2026, 2, 8, 8, 30), 'America/New_York');
assert.ok(beforeDst.includes('EST'));
assert.ok(afterDst.includes('EDT'));

delete process.env.APP_ROUTER_MODE;
assert.strictEqual(
	links.buildAppRouteUrl('/dashboard', 'https://maintleyapp.com/'),
	'https://maintleyapp.com/#/dashboard',
);
process.env.APP_ROUTER_MODE = 'browser';
assert.strictEqual(
	links.buildAppRouteUrl('/dashboard', 'https://maintleyapp.com/'),
	'https://maintleyapp.com/dashboard',
);
delete process.env.APP_ROUTER_MODE;

const emailSourceFiles = [
	'createFamilyInvite.ts',
	'monthlyPropertySummary.ts',
	'propertyInsightEmails.ts',
	'resendFamilyMemberInvite.ts',
	'seasonalGuidanceEmails.ts',
	'submitFeedback.ts',
	'taskReminderEmails.ts',
	'teamMemberTaskReports.ts',
	'welcomeSignupEmail.ts',
	'accessLifecycleEmails.ts',
	'emailBrand.ts',
	'templates/feedback-confirmation.html',
];
const legacyBrandColors = ['#16a34a', '#0f766e', '#2f6f4e', '#6366f1', '#edf7ef', '#f4faf6'];
for (const relativePath of emailSourceFiles) {
	const source = fs.readFileSync(path.join(projectRoot, 'functions', relativePath), 'utf8').toLowerCase();
	for (const color of legacyBrandColors) {
		assert.ok(!source.includes(color), `${relativePath} must not use legacy brand color ${color}`);
	}
}

console.log('Email branding and access lifecycle template tests passed.');
