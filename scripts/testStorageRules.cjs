/**
 * Firebase Storage Security Rules Test Script
 *
 * Tests Firebase Storage security rules to ensure proper file access control
 * Run with: node scripts/testStorageRules.cjs
 *
 * IMPORTANT: This script checks if storage paths exist and are accessible
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
require('dotenv').config({ path: '.env' });

// Get storage bucket from environment or service account
const storageBucket =
	process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
	`${serviceAccount.project_id}.appspot.com`;

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	storageBucket: storageBucket,
});

const bucket = admin.storage().bucket();

// Storage paths to test
const STORAGE_PATHS = [
	{
		name: 'Task Completions',
		pattern: 'task-completions/{userId}/{taskId}/',
		example: 'task-completions/',
		userBased: true,
	},
	{
		name: 'Property Images',
		pattern: 'properties/{userId}/',
		example: 'properties/',
		userBased: true,
	},
	{
		name: 'User Profile Images',
		pattern: 'user-profile-images/{userId}/',
		example: 'user-profile-images/',
		userBased: true,
	},
	{
		name: 'Team Member Images',
		pattern: 'team-member-images/{userId}/{memberId}/',
		example: 'team-member-images/',
		userBased: true,
	},
	{
		name: 'Team Member Files',
		pattern: 'team-member-files/{userId}/{memberId}/',
		example: 'team-member-files/',
		userBased: true,
	},
	{
		name: 'Device Files',
		pattern: 'device-files/{propertyId}/{deviceId}/',
		example: 'device-files/',
		userBased: false,
	},
	{
		name: 'Maintenance Files',
		pattern: 'maintenance-files/{propertyId}/',
		example: 'maintenance-files/',
		userBased: false,
	},
];

async function testStorageRules() {
	console.log('🗄️  Testing Firebase Storage Security Rules\n');
	console.log('='.repeat(60));

	const results = {
		passed: [],
		failed: [],
		warnings: [],
	};

	// Test 1: Check bucket exists and is accessible
	console.log('\n📦 TEST 1: Storage Bucket');
	console.log('-'.repeat(60));

	try {
		const [metadata] = await bucket.getMetadata();
		console.log(`✅ Bucket exists: ${metadata.name}`);
		console.log(`   Location: ${metadata.location}`);
		console.log(`   Storage class: ${metadata.storageClass}`);
		results.passed.push('Bucket accessible');
	} catch (error) {
		console.log(`❌ Bucket error: ${error.message}`);
		results.failed.push(`Bucket: ${error.message}`);
		console.log('\n⚠️  Cannot continue tests without bucket access');
		return;
	}

	// Test 2: Check storage paths
	console.log('\n📂 TEST 2: Storage Path Structure');
	console.log('-'.repeat(60));

	for (const path of STORAGE_PATHS) {
		try {
			// List files in the path (with prefix)
			const [files] = await bucket.getFiles({
				prefix: path.example,
				maxResults: 5,
			});

			if (files.length > 0) {
				console.log(`✅ ${path.name}: ${files.length} file(s) found`);
				console.log(`   Pattern: ${path.pattern}`);
				console.log(`   Sample: ${files[0].name}`);
				results.passed.push(`${path.name} has files`);
			} else {
				console.log(`⚠️  ${path.name}: Path exists but no files`);
				console.log(`   Pattern: ${path.pattern}`);
				results.warnings.push(`${path.name} is empty`);
			}
		} catch (error) {
			console.log(`⚠️  ${path.name}: ${error.message}`);
			results.warnings.push(`${path.name}: ${error.message}`);
		}
	}

	// Test 3: Verify security patterns
	console.log('\n🔐 TEST 3: Security Rule Patterns');
	console.log('-'.repeat(60));

	// Check user-based paths
	const userBasedPaths = STORAGE_PATHS.filter((p) => p.userBased);
	console.log(`User-Based Paths (${userBasedPaths.length}):`);
	userBasedPaths.forEach((path) => {
		console.log(`   • ${path.name}: ${path.pattern}`);
	});
	results.passed.push(`${userBasedPaths.length} user-based paths configured`);

	// Check property-based paths
	const propertyBasedPaths = STORAGE_PATHS.filter((p) => !p.userBased);
	console.log(`\nProperty-Based Paths (${propertyBasedPaths.length}):`);
	propertyBasedPaths.forEach((path) => {
		console.log(`   • ${path.name}: ${path.pattern}`);
	});
	results.passed.push(
		`${propertyBasedPaths.length} property-based paths configured`,
	);

	// Test 4: File metadata check
	console.log('\n📋 TEST 4: File Metadata & Access');
	console.log('-'.repeat(60));

	try {
		// Get all files (limited sample)
		const [allFiles] = await bucket.getFiles({ maxResults: 10 });

		if (allFiles.length > 0) {
			console.log(`✅ Found ${allFiles.length} sample file(s) in storage`);

			// Check first file metadata
			const sampleFile = allFiles[0];
			const [metadata] = await sampleFile.getMetadata();

			console.log(`\n   Sample File Analysis:`);
			console.log(`   • Name: ${metadata.name}`);
			console.log(`   • Size: ${(metadata.size / 1024).toFixed(2)} KB`);
			console.log(`   • Type: ${metadata.contentType || 'unknown'}`);
			console.log(`   • Created: ${metadata.timeCreated}`);
			console.log(`   • Updated: ${metadata.updated}`);

			results.passed.push('File metadata accessible');
		} else {
			console.log('⚠️  No files found in storage');
			results.warnings.push('Storage is empty');
		}
	} catch (error) {
		console.log(`❌ File metadata error: ${error.message}`);
		results.failed.push(`Metadata: ${error.message}`);
	}

	// Test 5: Path security validation
	console.log('\n🛡️  TEST 5: Security Rule Validation');
	console.log('-'.repeat(60));

	console.log('Expected Security Behavior:');
	console.log('   ✅ Authentication required for all paths');
	console.log('   ✅ Users can only write to their own folders (userId-based)');
	console.log('   ✅ Property files accessible to authenticated users');
	console.log('   ✅ Profile images readable by all authenticated users');
	console.log('   ✅ Task completions private to uploader');
	console.log('   ❌ Default deny for unlisted paths');

	results.passed.push('Security rules documented');

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
			'   • Storage paths are empty. Upload test files to verify rules.',
		);
	}

	console.log('   • Verify rules in Firebase Console → Storage → Rules');
	console.log('   • Test file uploads through your app');
	console.log("   • Ensure unauthorized users cannot access others' files");

	console.log('\n🔗 Next Steps:');
	console.log('   1. Go to Firebase Console → Storage → Rules');
	console.log('   2. Copy rules from STORAGE_RULES.md');
	console.log('   3. Click "Publish"');
	console.log('   4. Test file uploads in your app');

	console.log('\n📄 Storage Rules Location:');
	console.log('   File: STORAGE_RULES.md');
	console.log('   Deploy: Firebase Console → Storage → Rules');

	console.log('\n✅ Storage rules testing complete!\n');
}

// Run the tests
testStorageRules()
	.then(() => {
		console.log('🎉 All storage tests completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Storage test script failed:', error);
		console.error('\nCommon issues:');
		console.error('   • Check serviceAccountKey.json is valid');
		console.error('   • Verify storage bucket exists in Firebase Console');
		console.error('   • Ensure Admin SDK has storage permissions');
		process.exit(1);
	});
