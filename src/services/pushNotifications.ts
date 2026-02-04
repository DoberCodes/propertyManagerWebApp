import {
	PushNotifications,
	Token,
	PushNotification,
	PushNotificationActionPerformed,
} from '@capacitor/push-notifications';
import { isNativeApp } from '../utils/platform';
import { db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Check if push notifications are supported and enabled
 */
export async function checkPushNotificationStatus(): Promise<{
	supported: boolean;
	enabled: boolean;
	permission: string;
}> {
	if (!isNativeApp()) {
		return { supported: false, enabled: false, permission: 'not-supported' };
	}

	try {
		const result = await PushNotifications.checkPermissions();
		return {
			supported: true,
			enabled: result.receive === 'granted',
			permission: result.receive,
		};
	} catch (error) {
		console.error('Error checking push notification permissions:', error);
		return { supported: true, enabled: false, permission: 'error' };
	}
}

/**
 * Request push notification permissions
 */
export async function requestPushNotificationPermissions(): Promise<boolean> {
	if (!isNativeApp()) return false;

	try {
		const result = await PushNotifications.requestPermissions();
		return result.receive === 'granted';
	} catch (error) {
		console.error('Error requesting push notification permissions:', error);
		return false;
	}
}

/**
 * Initialize push notifications (native app only)
 * - Registers for push notifications
 * - Handles token and notification events
 * - Call this ONCE on app startup (e.g., in App.tsx)
 */
export function initializePushNotifications(
	onToken?: (token: string) => void,
	onNotification?: (notification: PushNotification) => void,
	getCurrentUserId?: () => string | null,
	onAction?: (action: PushNotificationActionPerformed) => void,
) {
	if (!isNativeApp()) return;

	console.log('Initializing push notifications...');

	// Check current permission status
	PushNotifications.checkPermissions().then((result) => {
		console.log('Push notification permissions:', result);
	});

	// Request permission and register
	PushNotifications.requestPermissions().then((result) => {
		console.log('Permission request result:', result);
		if (result.receive === 'granted') {
			console.log('Push notification permissions granted');
			PushNotifications.register();
		} else {
			console.log('Push notification permissions denied');
		}
	});

	// On registration, get device token
	PushNotifications.addListener('registration', async (token: Token) => {
		if (onToken) onToken(token.value);
		if (getCurrentUserId) {
			const userId = getCurrentUserId();
			if (userId) {
				try {
					const userRef = doc(db, 'users', userId);
					await setDoc(
						userRef,
						{
							pushToken: token.value,
							pushTokenUpdatedAt: new Date().toISOString(),
						},
						{ merge: true },
					);
					console.log('Push token saved successfully');
				} catch (err) {
					console.error('Failed to save push token to Firestore:', err);
				}
			}
		}
	});

	// On registration error
	PushNotifications.addListener('registrationError', (error) => {
		console.error('Push registration error:', error);
		// Could implement retry logic here
	});

	// On push received (foreground)
	PushNotifications.addListener(
		'pushNotificationReceived',
		(notification: PushNotification) => {
			console.log('Foreground push notification received:', notification);
			if (onNotification) onNotification(notification);
		},
	);

	// On notification tap (background)
	PushNotifications.addListener(
		'pushNotificationActionPerformed',
		(action: PushNotificationActionPerformed) => {
			console.log('Push notification action performed:', action);
			if (onAction) onAction(action);

			// Handle navigation based on notification data
			const notification = action.notification;
			if (notification?.data?.propertyId) {
				// Navigate to property page
				const propertyUrl = `/properties/${notification.data.propertyId}`;
				window.location.href = propertyUrl;
			}
		},
	);
}

/**
 * Test function to send a test push notification (for debugging)
 */
export async function sendTestPushNotification(userId: string): Promise<void> {
	if (!isNativeApp()) {
		console.log('Push notifications only work on native apps');
		return;
	}

	try {
		// Get current user's push token
		const userRef = doc(db, 'users', userId);
		const userDoc = await getDoc(userRef);
		const userData = userDoc.data();
		const pushToken = userData?.pushToken;

		if (!pushToken) {
			console.log('No push token found for user');
			return;
		}

		// Create a test notification document
		const testNotification = {
			userId,
			type: 'other',
			title: 'Test Notification',
			message: 'This is a test push notification',
			data: {
				test: true,
				timestamp: new Date().toISOString(),
			},
			status: 'unread',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await setDoc(
			doc(db, 'notifications', `test-${Date.now()}`),
			testNotification,
		);
		console.log(
			'Test notification created - push should be sent automatically',
		);
	} catch (error) {
		console.error('Error sending test push notification:', error);
	}
}
