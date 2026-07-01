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

	const rawPlan = String(subscription.plan || '').trim().toLowerCase();
	return PUSH_NOTIFICATION_PLANS.has(rawPlan);
};

type PushTokenRecord = {
	token?: unknown;
	disabled?: unknown;
};

const getUserPushTokens = (
	user: FirebaseFirestore.DocumentData,
): string[] => {
	const tokens = new Set<string>();
	const legacyToken = String(user.pushToken || '').trim();
	if (legacyToken) {
		tokens.add(legacyToken);
	}

	if (Array.isArray(user.pushTokens)) {
		for (const record of user.pushTokens as PushTokenRecord[]) {
			const token = String(record?.token || '').trim();
			if (!token || record?.disabled === true) {
				continue;
			}
			tokens.add(token);
		}
	}

	return Array.from(tokens);
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
			const updates: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {};
			if (userData?.pushToken === pushToken) {
				updates.pushToken = admin.firestore.FieldValue.delete();
				updates.pushTokenUpdatedAt = admin.firestore.FieldValue.delete();
			}

			if (Array.isArray(userData?.pushTokens)) {
				const nextPushTokens = (userData.pushTokens as PushTokenRecord[]).filter(
					(record) => String(record?.token || '').trim() !== pushToken,
				);
				if (nextPushTokens.length !== userData.pushTokens.length) {
					updates.pushTokens = nextPushTokens;
				}
			}

			if (Object.keys(updates).length > 0) {
				await userRef.update(updates);
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
	actionUrl?: unknown,
): Record<string, string> {
	const messageData: Record<string, string> = { notificationId };
	if (actionUrl) {
		messageData.actionUrl = String(actionUrl);
	}

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

		// Get the recipient user's push tokens
		const userDoc = await db.collection('users').doc(notification.userId).get();
		const user = userDoc.exists ? userDoc.data() : null;

		if (!user) {
			console.log(`User ${notification.userId} not found`);
			return;
		}

		const pushTokens = getUserPushTokens(user);
		if (pushTokens.length === 0) {
			console.log(`No push tokens for user ${notification.userId}`);
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
			notification.actionUrl,
		);

		// Send the push notification via FCM
		try {
			const message: admin.messaging.MulticastMessage = {
				tokens: pushTokens,
				notification: {
					title: notification.title || 'New Notification',
					body: notification.message || '',
				},
				data: messageData,
				webpush: {
					notification: {
						icon: '/icons/icon-192.png',
						badge: '/icons/icon-192.png',
					},
				},
			};

			const response = await admin.messaging().sendEachForMulticast(message);
			console.log(
				`Push delivery for user ${notification.userId}: ${response.successCount} succeeded, ${response.failureCount} failed`,
			);

			const cleanupPromises = response.responses
				.map((sendResponse, index) => ({ sendResponse, token: pushTokens[index] }))
				.filter(({ sendResponse }) => {
					const errorCode = String(sendResponse.error?.code || '');
					return (
						errorCode === 'messaging/registration-token-not-registered' ||
						errorCode === 'messaging/invalid-registration-token'
					);
				})
				.map(({ token }) => cleanupInvalidPushToken(notification.userId, token));

			await Promise.all(cleanupPromises);
		} catch (err) {
			console.error(
				`Error sending push notification to user ${notification.userId}:`,
				err,
			);
		}
	},
);
