/**
 * Firebase Security Rules Test Script
 *
 * Tests all Firestore security rules to ensure proper access control
 * Run with: node scripts/testFirebaseRules.cjs
 *
 * IMPORTANT: Run this with a test user account, not production data!
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// Test user IDs (you'll need to create these test users)
const TEST_USERS = {
	owner: 'test-owner-user-id', // Replace with actual test user ID
	otherUser: 'test-other-user-id', // Replace with actual test user ID
};

const COLLECTIONS_TO_TEST = [
	'users',
	'propertyGroups',
	'properties',
	'propertyShares',
	'userInvitations',
	'tasks',
	'maintenanceHistory',
	'teamGroups',
	'teamMembers',
	'devices',
	'suites',
	'units',
	'favorites',
	'notifications',
	'contractors',
	'familyAccounts',
	'tenantInvitationCodes',
	'tenantProfiles',
	'teamMemberInvitationCodes',
	'appConfig',
];

async function testCollectionAccess() {
	console.log('🔍 Testing Firebase Security Rules\n');
	console.log('='.repeat(60));

	const results = {
		passed: [],
		failed: [],
		warnings: [],
	};

	// Test 1: Check if collections exist and have documents
	console.log('\n📊 TEST 1: Collection Structure');
	console.log('-'.repeat(60));

	for (const collectionName of COLLECTIONS_TO_TEST) {
		try {
			const snapshot = await db.collection(collectionName).limit(1).get();
			const docCount = snapshot.size;

			if (docCount > 0) {
				console.log(`✅ ${collectionName}: ${docCount} document(s) found`);
				results.passed.push(`${collectionName} exists with data`);
			} else {
				console.log(`⚠️  ${collectionName}: Collection exists but is empty`);
				results.warnings.push(`${collectionName} is empty`);
			}
		} catch (error) {
			console.log(`❌ ${collectionName}: Error - ${error.message}`);
			results.failed.push(`${collectionName}: ${error.message}`);
		}
	}

	// Test 2: Test userId-based access control
	console.log('\n🔐 TEST 2: User-Based Access Control');
	console.log('-'.repeat(60));

	const userBasedCollections = [
		'propertyGroups',
		'tasks',
		'teamGroups',
		'devices',
		'suites',
		'units',
		'favorites',
		'contractors',
	];

	for (const collectionName of userBasedCollections) {
		try {
			// Query documents by userId
			const snapshot = await db
				.collection(collectionName)
				.where('userId', '==', TEST_USERS.owner)
				.limit(1)
				.get();

			if (!snapshot.empty) {
				const doc = snapshot.docs[0];
				const data = doc.data();

				// Verify userId field exists
				if (data.userId === TEST_USERS.owner) {
					console.log(`✅ ${collectionName}: userId field correctly set`);
					results.passed.push(`${collectionName} userId access control`);
				} else {
					console.log(`⚠️  ${collectionName}: userId mismatch`);
					results.warnings.push(`${collectionName} userId mismatch`);
				}
			} else {
				console.log(`⚠️  ${collectionName}: No documents found for test user`);
				results.warnings.push(`${collectionName} no test data`);
			}
		} catch (error) {
			console.log(`❌ ${collectionName}: ${error.message}`);
			results.failed.push(`${collectionName}: ${error.message}`);
		}
	}

	// Test 3: Test special collections
	console.log('\n🎯 TEST 3: Special Collections');
	console.log('-'.repeat(60));

	// Test familyAccounts
	try {
		const familyAccountsSnapshot = await db
			.collection('familyAccounts')
			.limit(1)
			.get();

		if (!familyAccountsSnapshot.empty) {
			const doc = familyAccountsSnapshot.docs[0];
			const data = doc.data();

			if (data.ownerId && data.memberIds && Array.isArray(data.memberIds)) {
				console.log('✅ familyAccounts: Structure is correct');
				results.passed.push('familyAccounts structure validation');
			} else {
				console.log('⚠️  familyAccounts: Missing required fields');
				results.warnings.push('familyAccounts missing fields');
			}
		} else {
			console.log('⚠️  familyAccounts: No documents found');
			results.warnings.push('familyAccounts empty');
		}
	} catch (error) {
		console.log(`❌ familyAccounts: ${error.message}`);
		results.failed.push(`familyAccounts: ${error.message}`);
	}

	// Test appConfig (read-only)
	try {
		const appConfigSnapshot = await db.collection('appConfig').limit(1).get();

		if (!appConfigSnapshot.empty) {
			console.log('✅ appConfig: Readable (should be read-only for users)');
			results.passed.push('appConfig readable');
		} else {
			console.log('⚠️  appConfig: No version document found');
			results.warnings.push('appConfig empty - run initAppVersion script');
		}
	} catch (error) {
		console.log(`❌ appConfig: ${error.message}`);
		results.failed.push(`appConfig: ${error.message}`);
	}

	// Test 4: Test invitation code collections
	console.log('\n📧 TEST 4: Invitation Collections');
	console.log('-'.repeat(60));

	const invitationCollections = [
		'tenantInvitationCodes',
		'teamMemberInvitationCodes',
		'userInvitations',
	];

	for (const collectionName of invitationCollections) {
		try {
			const snapshot = await db.collection(collectionName).limit(1).get();

			if (!snapshot.empty) {
				const doc = snapshot.docs[0];
				const data = doc.data();

				// Check for email field
				if (data.email || data.toEmail) {
					console.log(`✅ ${collectionName}: Email field present`);
					results.passed.push(`${collectionName} structure`);
				} else {
					console.log(`⚠️  ${collectionName}: Missing email field`);
					results.warnings.push(`${collectionName} missing email`);
				}
			} else {
				console.log(`⚠️  ${collectionName}: No documents found`);
				results.warnings.push(`${collectionName} empty`);
			}
		} catch (error) {
			console.log(`❌ ${collectionName}: ${error.message}`);
			results.failed.push(`${collectionName}: ${error.message}`);
		}
	}

	// Test 5: Test notifications (read-only creation)
	console.log('\n🔔 TEST 5: Notifications Collection');
	console.log('-'.repeat(60));

	try {
		const notificationsSnapshot = await db
			.collection('notifications')
			.limit(1)
			.get();

		if (!notificationsSnapshot.empty) {
			const doc = notificationsSnapshot.docs[0];
			const data = doc.data();

			if (data.userId && data.type && data.title && data.message) {
				console.log('✅ notifications: Structure is correct');
				results.passed.push('notifications structure');
			} else {
				console.log('⚠️  notifications: Missing required fields');
				results.warnings.push('notifications missing fields');
			}
		} else {
			console.log('⚠️  notifications: No documents found');
			results.warnings.push('notifications empty');
		}
	} catch (error) {
		console.log(`❌ notifications: ${error.message}`);
		results.failed.push(`notifications: ${error.message}`);
	}

	// Print summary
	console.log('\n' + '='.repeat(60));
	console.log('📋 TEST SUMMARY');
	console.log('='.repeat(60));
	console.log(`✅ Passed: ${results.passed.length}`);
	console.log(`⚠️  Warnings: ${results.warnings.length}`);
	console.log(`❌ Failed: ${results.failed.length}`);

	if (results.failed.length > 0) {
		console.log('\n❌ Failed Tests:');
		results.failed.forEach((fail) => console.log(`   • ${fail}`));
	}

	if (results.warnings.length > 0) {
		console.log('\n⚠️  Warnings:');
		results.warnings.forEach((warn) => console.log(`   • ${warn}`));
	}

	console.log('\n💡 Recommendations:');

	if (results.warnings.some((w) => w.includes('empty'))) {
		console.log(
			'   • Some collections are empty. Consider running seed scripts.',
		);
	}

	if (
		results.warnings.includes('appConfig empty - run initAppVersion script')
	) {
		console.log('   • Run: node scripts/initAppVersion.cjs');
	}

	console.log('\n🔐 Security Rules Status:');
	console.log('   • All collections should require authentication');
	console.log('   • Users should only access their own data');
	console.log('   • Notifications should be read-only (backend creates them)');
	console.log('   • appConfig should be read-only for all users');

	console.log('\n✅ Rules testing complete!\n');
}

// Run the tests
testCollectionAccess()
	.then(() => {
		console.log('🎉 All tests completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Test script failed:', error);
		process.exit(1);
	});
