import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

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

const TEAM_MEMBER_REPORT_PLANS = new Set(['property', 'portfolio']);

interface UserSubscriptionLike {
	status?: string;
	plan?: string;
	trialEndsAt?: number | null;
	hasScheduledSubscription?: boolean;
	scheduledPlan?: string;
}

interface UserEmailPreferencesLike {
	taskReminders?: boolean;
	propertyInsights?: boolean;
	teamMemberReports?: {
		enabled?: boolean;
	};
}

interface UserLike {
	subscription?: UserSubscriptionLike;
	emailPreferences?: UserEmailPreferencesLike;
}

const normalizePlanId = (planId?: string): string => {
	return String(planId || '').trim().toLowerCase();
};

const hasCurrentEntitlement = (subscription?: UserSubscriptionLike): boolean => {
	if (!subscription?.status) return false;
	if (subscription.status === 'active') return true;
	if (subscription.status !== 'trial') return false;
	if (!subscription.trialEndsAt) return true;
	return subscription.trialEndsAt > Date.now() / 1000;
};

const getEffectivePlanId = (subscription?: UserSubscriptionLike): string => {
	if (!hasCurrentEntitlement(subscription)) {
		return 'homeowner';
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
		const teamMemberReportsEnabled =
			!!afterData.emailPreferences?.teamMemberReports?.enabled;
		if (
			!taskRemindersEnabled &&
			!propertyInsightsEnabled &&
			!teamMemberReportsEnabled
		) {
			return null;
		}

		const effectivePlan = getEffectivePlanId(afterData.subscription);
		const canUseTaskReminderEmails = PAID_TASK_REMINDER_EMAIL_PLANS.has(
			effectivePlan,
		);
		const canUsePropertyInsights = PROPERTY_INSIGHTS_PLANS.has(effectivePlan);
		const canUseTeamMemberReports = TEAM_MEMBER_REPORT_PLANS.has(effectivePlan);

		const updates: Record<string, unknown> = {};
		if (taskRemindersEnabled && !canUseTaskReminderEmails) {
			updates['emailPreferences.taskReminders'] = false;
		}
		if (propertyInsightsEnabled && !canUsePropertyInsights) {
			updates['emailPreferences.propertyInsights'] = false;
		}
		if (teamMemberReportsEnabled && !canUseTeamMemberReports) {
			updates['emailPreferences.teamMemberReports.enabled'] = false;
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
