import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendPushForNotification } from './pushDelivery';

admin.initializeApp();

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

		if (notification.suppressAutoPush === true) {
			console.log(
				`Push skipped for notification ${event.params.notificationId}: handled by event channel`,
			);
			return;
		}

		await sendPushForNotification(event.params.notificationId, notification);
	},
);
