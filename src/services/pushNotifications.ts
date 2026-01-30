// src/services/pushNotifications.ts
// import {
// 	PushNotifications,
// 	Token,
// 	PushNotification,
// 	PushNotificationActionPerformed,
// } from '@capacitor/push-notifications';
// import { isNativeApp } from '../utils/platform';
// import { db } from '../config/firebase';
// import { doc, updateDoc } from 'firebase/firestore';

// /**
//  * Initialize push notifications (native app only)
//  * - Registers for push notifications
//  * - Handles token and notification events
//  * - Call this ONCE on app startup (e.g., in App.tsx or index.tsx)
//  */
// export function initializePushNotifications(
// 	onToken?: (token: string) => void,
// 	onNotification?: (notification: PushNotification) => void,
// 	getCurrentUserId?: () => string | null,
// ) {
// 	if (!isNativeApp()) return;

// 	// Request permission and register
// 	PushNotifications.requestPermissions().then((result) => {
// 		if (result.receive === 'granted') {
// 			PushNotifications.register();
// 		}
// 	});

// 	// On registration, get device token
// 	PushNotifications.addListener('registration', async (token: Token) => {
// 		if (onToken) onToken(token.value);
// 		// Store token in Firestore under current user
// 		if (getCurrentUserId) {
// 			const userId = getCurrentUserId();
// 			if (userId) {
// 				try {
// 					const userRef = doc(db, 'users', userId);
// 					await updateDoc(userRef, { pushToken: token.value });
// 				} catch (err) {
// 					console.error('Failed to save push token to Firestore:', err);
// 				}
// 			}
// 		}
// 	});

// 	// On registration error
// 	PushNotifications.addListener('registrationError', (error) => {
// 		console.error('Push registration error:', error);
// 	});

// 	// On push received (foreground)
// 	PushNotifications.addListener(
// 		'pushNotificationReceived',
// 		(notification: PushNotification) => {
// 			if (onNotification) onNotification(notification);
// 			// Optionally show in-app notification UI
// 		},
// 	);

// 	// On notification tap (background)
// 	// PushNotifications.addListener(
// 	// 	'pushNotificationActionPerformed',
// 	// 	(action: PushNotificationActionPerformed) => {
// 	// 		// Route user or handle action
// 	// 	},
// 	// );
// }
