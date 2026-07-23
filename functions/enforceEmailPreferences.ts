import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { hasSubscriptionCapability } from './subscriptionEntitlements';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

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

		const canUseTaskReminderEmails = hasSubscriptionCapability(
			afterData.subscription,
			'notifications.use',
		);
		const canUsePropertyInsights = hasSubscriptionCapability(
			afterData.subscription,
			'property_intelligence.use',
		);
		const canUseTeamMemberReports = hasSubscriptionCapability(
			afterData.subscription,
			'team.manage',
		);

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
			plan: String(afterData.subscription?.plan || '').trim() || 'homeowner',
			updates: Object.keys(updates),
		});

		return null;
	});
