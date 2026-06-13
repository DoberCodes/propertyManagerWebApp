import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const PLAN_ALIASES: Record<string, string> = {
	home: 'homeowner',
	homeowner: 'homeowner',
	homeowner_plus: 'homeowner_plus',
	homeownerplus: 'homeowner_plus',
	'homeowner+': 'homeowner_plus',
	property: 'property',
	portfolio: 'portfolio',
	free: 'homeowner',
	basic: 'property',
	professional: 'portfolio',
};

const PAID_TASK_REMINDER_EMAIL_PLANS = new Set([
	'homeowner_plus',
	'property',
	'portfolio',
]);

const PROPERTY_INSIGHTS_PLANS = new Set([
	'homeowner_plus',
	'property',
	'portfolio',
]);

interface UserSubscriptionLike {
	plan?: string;
	hasScheduledSubscription?: boolean;
	scheduledPlan?: string;
}

interface UserEmailPreferencesLike {
	taskReminders?: boolean;
	propertyInsights?: boolean;
}

interface UserLike {
	subscription?: UserSubscriptionLike;
	emailPreferences?: UserEmailPreferencesLike;
}

const normalizePlanId = (planId?: string): string => {
	const normalized = String(planId || '').trim().toLowerCase();
	return PLAN_ALIASES[normalized] || normalized;
};

const getEffectivePlanId = (subscription?: UserSubscriptionLike): string => {
	const scheduledPlan = normalizePlanId(subscription?.scheduledPlan);
	if (subscription?.hasScheduledSubscription && scheduledPlan) {
		return scheduledPlan;
	}

	const plan = normalizePlanId(subscription?.plan);
	return plan || 'homeowner';
};

export const enforceEmailPreferences = functions.firestore
	.document('users/{userId}')
	.onWrite(async (change, context) => {
		if (!change.after.exists) {
			return null;
		}

		const afterData = change.after.data() as UserLike;
		const taskRemindersEnabled = !!afterData.emailPreferences?.taskReminders;
		const propertyInsightsEnabled = !!afterData.emailPreferences?.propertyInsights;
		if (!taskRemindersEnabled && !propertyInsightsEnabled) {
			return null;
		}

		const effectivePlan = getEffectivePlanId(afterData.subscription);
		const canUseTaskReminderEmails = PAID_TASK_REMINDER_EMAIL_PLANS.has(
			effectivePlan,
		);
		const canUsePropertyInsights = PROPERTY_INSIGHTS_PLANS.has(effectivePlan);

		const updates: Record<string, unknown> = {};
		if (taskRemindersEnabled && !canUseTaskReminderEmails) {
			updates['emailPreferences.taskReminders'] = false;
		}
		if (propertyInsightsEnabled && !canUsePropertyInsights) {
			updates['emailPreferences.propertyInsights'] = false;
		}

		if (Object.keys(updates).length === 0) {
			return null;
		}

		await db
			.collection('users')
			.doc(context.params.userId)
			.update({
				...updates,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

		functions.logger.info('Disabled paid-only email preferences for ineligible plan', {
			userId: context.params.userId,
			effectivePlan,
			updates: Object.keys(updates),
		});

		return null;
	});
