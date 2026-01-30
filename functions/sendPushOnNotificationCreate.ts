// sendPushOnNotificationCreate.ts
// import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';

// admin.initializeApp();
// const db = admin.firestore();

// export const sendPushOnNotificationCreate = functions.firestore
// 	.document('notifications/{notificationId}')
// 	.onCreate(async (snap, context) => {
// 		const notification = snap.data();
// 		if (!notification || !notification.userId) return;

// 		// Get the recipient user's push token
// 		const userDoc = await db.collection('users').doc(notification.userId).get();
// 		const user = userDoc.exists ? userDoc.data() : null;
// 		const pushToken = user && user.pushToken;
// 		if (!pushToken) {
// 			console.log('No push token for user', notification.userId);
// 			return;
// 		}

// 		// Compose the push notification
// 		const payload = {
// 			notification: {
// 				title: notification.title || 'New Notification',
// 				body: notification.message || '',
// 			},
// 			data: {
// 				notificationId: context.params.notificationId,
// 				...(notification.data && typeof notification.data === 'object'
// 					? notification.data
// 					: {}),
// 			},
// 		};

// 		// Send the push notification via FCM
// 		try {
// 			const response = await admin.messaging().sendToDevice(pushToken, payload);
// 			console.log('Push sent to', pushToken, response);
// 		} catch (err) {
// 			console.error('Error sending push notification:', err);
// 		}
// 	});
