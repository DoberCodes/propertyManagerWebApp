#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const roots = ['src', 'functions'];
const extensions = new Set(['.ts', '.tsx', '.js']);

// Direct plan checks are permitted only where plan identity is itself the
// subject. Product access decisions belong in @maintley/entitlements.
const allowedDirectPlanChecks = new Map([
	['functions/adminPortal.ts', 'billing and admin presentation'],
	['functions/deleteUserAccount.ts', 'billing cleanup'],
	['functions/grantAwareCheckout.ts', 'cross-track checkout policy'],
	['functions/packages/entitlements/index.js', 'canonical shared resolver'],
	['functions/stripeFunctions.ts', 'server pricing and billing mapping'],
	['functions/subscriptionEntitlements.ts', 'approved resolver boundary'],
	['src/Components/AccountSnapshot/AccountSnapshot.tsx', 'plan presentation'],
	['src/Components/Library/Navbar/SideNav/SideNav.tsx', 'plan presentation'],
	['src/Components/Library/Navbar/TopNav/TopNav.tsx', 'plan presentation'],
	['src/Components/Library/TabController/TabController.tsx', 'homeowner vocabulary and navigation mode'],
	['src/Components/PropertySetupAssistant/PropertySetupAssistant.tsx', 'homeowner vocabulary'],
	['src/Components/PropertyIntelligence/PropertyAuditPanel.tsx', 'upgrade plan presentation'],
	['src/Components/PropertyIntelligence/PropertyScanPanel.tsx', 'upgrade plan presentation'],
	['src/Components/RegistrationCard/RegistrationCard.tsx', 'checkout presentation'],
	['src/Components/ScheduledSubscriptionBanner/ScheduledSubscriptionBanner.tsx', 'billing presentation'],
	['src/pages/DevicesHubPage/DevicesHubPage.tsx', 'homeowner vocabulary'],
	['src/pages/LandingPage/components/HomepageSections.tsx', 'pricing presentation'],
	['src/pages/LandingPage/components/PricingSection.tsx', 'pricing presentation'],
	['src/pages/PaywallPage/PaywallPage.tsx', 'pricing presentation'],
	['src/pages/PaywallPage/index.tsx', 'billing presentation'],
	['src/pages/PropertyDetailPage/TabSystem/DevicesTab.tsx', 'homeowner vocabulary'],
	['src/pages/SettingsPage/AccountManagement.tsx', 'billing presentation'],
	['src/pages/UserProfile/UserProfile.tsx', 'billing presentation'],
	['src/Redux/selectors/permissionSelectors.ts', 'account persona classification'],
	['src/services/authService.ts', 'migration compatibility'],
	['src/services/userProfileService.ts', 'subscription mirror migration compatibility'],
	['src/entitlements/planAvailability.ts', 'disabled launch-flag boundary'],
	['src/utils/subscriptionUtils.ts', 'approved resolver compatibility boundary'],
]);

const toPosix = (value) => value.split(path.sep).join('/');

const listFiles = (directory) => {
	if (!fs.existsSync(directory)) return [];
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			if (['lib', 'node_modules'].includes(entry.name)) return [];
			return listFiles(fullPath);
		}
		return extensions.has(path.extname(entry.name)) ? [fullPath] : [];
	});
};

const directPlanPattern =
	/(?:plan|Plan)[^\n]{0,120}(?:===|!==|\.includes\(|\.has\()[^\n]{0,120}(?:homeowner|property|portfolio|guest|team|tenant)|(?:homeowner|property|portfolio|guest|team|tenant)[^\n]{0,120}(?:===|!==|\.includes\(|\.has\()[^\n]{0,120}(?:plan|Plan)/;
const duplicateFeatureMapPattern =
	/(?:PLAN_CAPABILITIES|PUSH_NOTIFICATION_PLANS|PROPERTY_INSIGHTS_PLANS|PAID_TASK_REMINDER_EMAIL_PLANS|TEAM_MEMBER_REPORT_PLANS|PROPERTY_GROUP_PLANS)/;
const legacyPermissionPattern = /\.permissions\.(?:can|prioritySupport)/;
const subscriptionOnlyServerCapabilityPattern = /hasSubscriptionCapability\s*\(/;

const failures = [];
for (const root of roots) {
	for (const filePath of listFiles(path.join(rootDir, root))) {
		const relativePath = toPosix(path.relative(rootDir, filePath));
		if (relativePath.endsWith('.test.ts') || relativePath.endsWith('.test.tsx')) {
			continue;
		}
		const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
		lines.forEach((line, index) => {
			const isDirectPlanCheck = directPlanPattern.test(line);
			const isDuplicateFeatureMap = duplicateFeatureMapPattern.test(line);
			const isLegacyPermissionRead = legacyPermissionPattern.test(line);
			const isSubscriptionOnlyServerCapability =
				relativePath.startsWith('functions/') &&
				relativePath !== 'functions/subscriptionEntitlements.ts' &&
				subscriptionOnlyServerCapabilityPattern.test(line);
			if (
				(isDirectPlanCheck && !allowedDirectPlanChecks.has(relativePath)) ||
				isDuplicateFeatureMap ||
				isLegacyPermissionRead ||
				isSubscriptionOnlyServerCapability
			) {
				failures.push(`${relativePath}:${index + 1}: ${line.trim()}`);
			}
		});
	}
}

if (failures.length > 0) {
	console.error('Entitlement boundary validation failed. Use a capability/limit helper or classify the direct plan check.');
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

console.log(
	`Entitlement boundaries validated (${allowedDirectPlanChecks.size} classified plan-aware files).`,
);
