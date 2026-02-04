#!/usr/bin/env node

/**
 * Manual push notification trigger for testing
 * Run with: node scripts/trigger-push-notification.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function triggerPushNotification() {
	console.log('📲 Manual Push Notification Trigger\n');

	try {
		// Get command line arguments
		const args = process.argv.slice(2);
		const userEmail = args[0] || 'austin.dober@gmail.com';
		const title = args[1] || 'Test Push Notification';
		const message =
			args[2] || 'This is a test push notification from the server';

		console.log(`📧 Target user: ${userEmail}`);
		console.log(`📝 Title: ${title}`);
		console.log(`💬 Message: ${message}\n`);

		// Find user by email
		const usersRef = db.collection('users');
		const userQuery = await usersRef.where('email', '==', userEmail).get();

		if (userQuery.empty) {
			console.log(`❌ User with email ${userEmail} not found`);
			return;
		}

		const userDoc = userQuery.docs[0];
		const userData = userDoc.data();
		const userId = userDoc.id;

		console.log(`📧 Found user: ${userEmail} (${userId})`);

		// Check if user has push token
		if (!userData.pushToken) {
			console.log(`❌ User ${userEmail} has no push token registered`);
			console.log(
				'💡 Make sure the user has logged into the mobile app and granted notification permissions',
			);
			return;
		}

		console.log(
			`✅ User has push token: ${userData.pushToken.substring(0, 20)}...`,
		);

		// Create notification document
		const notificationData = {
			userId: userId,
			type: 'manual_test',
			title: title,
			message: message,
			status: 'unread',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		console.log('📝 Creating notification document...');
		const notificationRef = await db
			.collection('notifications')
			.add(notificationData);
		console.log(`✅ Notification created with ID: ${notificationRef.id}`);

		// Wait for Firebase function to trigger (if deployed)
		console.log('⏳ Waiting 5 seconds for push notification function...');
		await new Promise((resolve) => setTimeout(resolve, 5000));

		// Manual push notification as fallback
		console.log('🔧 Sending manual push notification...');

		const fcmMessage = {
			token: userData.pushToken,
			notification: {
				title: title,
				body: message,
			},
			data: {
				notificationId: notificationRef.id,
				type: 'manual_test',
			},
		};

		try {
			const response = await admin.messaging().send(fcmMessage);
			console.log(`✅ Push notification sent! Message ID: ${response}`);
		} catch (error) {
			console.log(`❌ Failed to send push notification: ${error.message}`);
		}

		console.log('\n📋 Summary:');
		console.log(`   User: ${userEmail}`);
		console.log(`   Notification ID: ${notificationRef.id}`);
		console.log(`   Push token exists: ✅`);
		console.log(
			`   Firebase functions deployed: ${process.env.FIREBASE_FUNCTIONS_DEPLOYED || 'Unknown'}`,
		);
	} catch (error) {
		console.error('❌ Test failed:', error);
	}
}

// Run the trigger
triggerPushNotification()
	.then(() => {
		console.log('\n✨ Manual trigger completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Manual trigger failed:', error);
		process.exit(1);
	});
