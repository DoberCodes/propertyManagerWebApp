import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

admin.initializeApp();
const db = admin.firestore();

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

		// Compose the push notification
		const payload: admin.messaging.MessagingPayload = {
			notification: {
				title: notification.title || 'New Notification',
				body: notification.message || '',
			},
			data: {
				notificationId: event.params.notificationId,
				...(notification.data && typeof notification.data === 'object'
					? notification.data
					: {}),
			},
		};

		// Send the push notification via FCM
		try {
			const response = await admin.messaging().sendToDevice(pushToken, payload);
			console.log(`Push sent successfully to user ${notification.userId}:`, {
				successCount: response.successCount,
				failureCount: response.failureCount,
				results: response.results?.map((r) => ({
					success: r.messageId ? true : false,
					error: r.error?.message,
				})),
			});

			// Check for failures and handle them
			if (response.failureCount > 0) {
				console.error(
					`Push notification failures for user ${notification.userId}:`,
					response.results,
				);

				// Check if token is invalid/expired and cleanup
				const hasInvalidToken = response.results?.some(
					(result) =>
						result.error?.code ===
							'messaging/registration-token-not-registered' ||
						result.error?.code === 'messaging/invalid-registration-token',
				);

				if (hasInvalidToken) {
					await cleanupInvalidPushToken(notification.userId, pushToken);
				}
			}
		} catch (err) {
			console.error(
				`Error sending push notification to user ${notification.userId}:`,
				err,
			);
		}
	},
);
