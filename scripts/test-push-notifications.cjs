#!/usr/bin/env node

/**
 * Test script to verify push notification setup
 * Run with: node scripts/test-push-notifications.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function testPushNotifications() {
	console.log('🔍 Testing Push Notification Setup...\n');

	try {
		// Get all users and check for push tokens
		console.log('📱 Checking user push tokens...');
		const usersRef = db.collection('users');
		const usersSnapshot = await usersRef.get();

		let usersWithTokens = 0;
		let totalUsers = 0;

		for (const userDoc of usersSnapshot.docs) {
			totalUsers++;
			const userData = userDoc.data();
			const userId = userDoc.id;
			const email = userData.email || 'No email';

			if (userData.pushToken) {
				usersWithTokens++;
				console.log(`✅ User ${email} (${userId}): Has push token`);
			} else {
				console.log(`❌ User ${email} (${userId}): No push token`);
			}
		}

		console.log(`\n📊 Push Token Summary:`);
		console.log(`   Total users: ${totalUsers}`);
		console.log(`   Users with tokens: ${usersWithTokens}`);
		console.log(`   Users without tokens: ${totalUsers - usersWithTokens}`);

		// Check recent notifications
		console.log('\n🔔 Checking recent notifications...');
		const notificationsRef = db
			.collection('notifications')
			.orderBy('createdAt', 'desc')
			.limit(5);

		const notificationsSnapshot = await notificationsRef.get();

		if (notificationsSnapshot.empty) {
			console.log('❌ No notifications found in database');
		} else {
			console.log('✅ Recent notifications:');
			notificationsSnapshot.forEach((doc) => {
				const notification = doc.data();
				const createdAt = new Date(notification.createdAt).toLocaleString();
				console.log(
					`   ${createdAt}: ${notification.title} -> ${notification.userId}`,
				);
			});
		}

		// Test creating a sample notification
		console.log('\n🧪 Testing notification creation...');
		const testNotification = {
			userId: usersSnapshot.docs[0]?.id || 'test-user-id',
			type: 'test_push',
			title: 'Test Push Notification',
			message: 'This is a test push notification from the test script',
			status: 'unread',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		const testDocRef = await db
			.collection('notifications')
			.add(testNotification);
		console.log(`✅ Test notification created with ID: ${testDocRef.id}`);

		// Wait a moment for the function to potentially trigger
		console.log(
			'⏳ Waiting 3 seconds for push notification function to trigger...',
		);
		await new Promise((resolve) => setTimeout(resolve, 3000));

		console.log('\n📋 Troubleshooting Steps:');
		console.log(
			'1. Deploy Firebase Functions: firebase deploy --only functions',
		);
		console.log('2. Check Firebase Functions logs: firebase functions:log');
		console.log('3. Verify push tokens are registered in mobile app');
		console.log('4. Test with Firebase Console -> Functions -> Logs');
	} catch (error) {
		console.error('❌ Test failed:', error);
	}
}

// Run the test
testPushNotifications()
	.then(() => {
		console.log('\n✨ Test completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Test script failed:', error);
		process.exit(1);
	});
