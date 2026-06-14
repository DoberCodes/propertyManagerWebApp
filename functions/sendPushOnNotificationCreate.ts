import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

admin.initializeApp();
const db = admin.firestore();

const PUSH_NOTIFICATION_PLANS = new Set([
	'homeowner_plus',
	'property',
	'portfolio',
]);

const isTrialActive = (subscription?: {
	status?: string;
	trialEndsAt?: number | null;
}): boolean => {
	if (subscription?.status !== 'trial') {
		return false;
	}

	if (!subscription.trialEndsAt) {
		return true;
	}

	return subscription.trialEndsAt > Date.now() / 1000;
};

const canUsePushNotifications = (subscription?: {
	status?: string;
	plan?: string;
	hasScheduledSubscription?: boolean;
	scheduledPlan?: string;
	trialEndsAt?: number | null;
}): boolean => {
	if (!subscription) {
		return false;
	}

	if (subscription.status !== 'active' && !isTrialActive(subscription)) {
		return false;
	}

	const scheduledPlan = String(subscription.scheduledPlan || '').trim().toLowerCase();
	const rawPlan =
		subscription.hasScheduledSubscription && scheduledPlan
			? scheduledPlan
			: String(subscription.plan || '').trim().toLowerCase();
	return PUSH_NOTIFICATION_PLANS.has(rawPlan);
};

/**
 * Clean up invalid push tokens from user documents
 */
async function cleanupInvalidPushToken(userId: string, pushToken: string) {
	try {
		const userRef = db.collection('users').doc(userId);
		const userDoc = await userRef.get();

		if (userDoc.exists) {
			const userData = userDoc.data();
			if (userData?.pushToken === pushToken) {
				// Remove the invalid token
				await userRef.update({
					pushToken: admin.firestore.FieldValue.delete(),
					pushTokenUpdatedAt: admin.firestore.FieldValue.delete(),
				});
				console.log(`Cleaned up invalid push token for user ${userId}`);
			}
		}
	} catch (error) {
		console.error(`Failed to cleanup push token for user ${userId}:`, error);
	}
}

function toMessageData(
	notificationId: string,
	data: unknown,
): Record<string, string> {
	const messageData: Record<string, string> = { notificationId };

	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return messageData;
	}

	for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
		if (value === undefined || value === null) {
			continue;
		}
		messageData[key] =
			typeof value === 'string' ? value : JSON.stringify(value);
	}

	return messageData;
}

export const sendPushOnNotificationCreate = onDocumentCreated(
	'notifications/{notificationId}',
	async (event) => {
		const notification = event.data?.data();
		if (!notification || !notification.userId) {
			console.log('Invalid notification document - missing userId');
			return;
		}

		console.log(
			`Processing notification ${event.params.notificationId} for user ${notification.userId}`,
		);

		// Get the recipient user's push token
		const userDoc = await db.collection('users').doc(notification.userId).get();
		const user = userDoc.exists ? userDoc.data() : null;

		if (!user) {
			console.log(`User ${notification.userId} not found`);
			return;
		}

		const pushToken = user.pushToken;
		if (!pushToken) {
			console.log(`No push token for user ${notification.userId}`);
			return;
		}

		if (!canUsePushNotifications(user.subscription)) {
			console.log(
				`Push skipped for user ${notification.userId}: plan does not include push notifications`,
			);
			return;
		}

		// Check user notification preferences. The app stores preferences on the
		// user doc; keep the old userPreferences doc as a backward-compatible fallback.
		const userPreferencesDoc = await db
			.collection('userPreferences')
			.doc(notification.userId)
			.get();
		const userPreferences = userPreferencesDoc.exists
			? userPreferencesDoc.data()?.notificationPreferences
			: null;
		const notificationPreferences =
			user.notificationPreferences || userPreferences || null;

		if (notificationPreferences?.enabled === false) {
			console.log(`Notifications are disabled for user ${notification.userId}`);
			return;
		}

		const notificationType = notification.type; // Assuming notification.type exists
		if (
			notificationType &&
			notificationPreferences?.types &&
			notificationPreferences.types[notificationType] === false
		) {
			console.log(
				`Notification type '${notificationType}' is disabled for user ${notification.userId}`,
			);
			return;
		}

		const messageData = toMessageData(
			event.params.notificationId,
			notification.data,
		);

		// Send the push notification via FCM
		try {
			const message = {
				token: pushToken,
				notification: {
					title: notification.title || 'New Notification',
					body: notification.message || '',
				},
				data: messageData,
			};

			const response = await admin.messaging().send(message);
			console.log(
				`Push sent successfully to user ${notification.userId}:`,
				response,
			);
		} catch (err) {
			console.error(
				`Error sending push notification to user ${notification.userId}:`,
				err,
			);
			const errorCode = String((err as { code?: unknown })?.code || '');
			if (
				errorCode === 'messaging/registration-token-not-registered' ||
				errorCode === 'messaging/invalid-registration-token'
			) {
				await cleanupInvalidPushToken(notification.userId, pushToken);
			}
		}
	},
);
