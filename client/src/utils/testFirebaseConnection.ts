import {
	collection,
	getDocs,
	addDoc,
	deleteDoc,
	doc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Test Firebase connection for properties, tasks, and team collections
 */
export const testFirebaseConnection = async () => {
	const results = {
		properties: { connected: false, error: null as string | null },
		tasks: { connected: false, error: null as string | null },
		propertyGroups: { connected: false, error: null as string | null },
		teamGroups: { connected: false, error: null as string | null },
		teamMembers: { connected: false, error: null as string | null },
	};

	console.log('🔍 Starting Firebase connection tests...\n');

	// Test 1: Properties Collection
	try {
		console.log('Testing properties collection...');
		const propertiesRef = collection(db, 'properties');
		const snapshot = await getDocs(propertiesRef);
		results.properties.connected = true;
		console.log(`✅ Properties: Connected (${snapshot.size} documents found)`);
	} catch (error: any) {
		results.properties.error = error.message;
		console.error('❌ Properties: Failed -', error.message);
	}

	// Test 2: Tasks Collection
	try {
		console.log('Testing tasks collection...');
		const tasksRef = collection(db, 'tasks');
		const snapshot = await getDocs(tasksRef);
		results.tasks.connected = true;
		console.log(`✅ Tasks: Connected (${snapshot.size} documents found)`);
	} catch (error: any) {
		results.tasks.error = error.message;
		console.error('❌ Tasks: Failed -', error.message);
	}

	// Test 3: Property Groups Collection
	try {
		console.log('Testing propertyGroups collection...');
		const groupsRef = collection(db, 'propertyGroups');
		const snapshot = await getDocs(groupsRef);
		results.propertyGroups.connected = true;
		console.log(
			`✅ Property Groups: Connected (${snapshot.size} documents found)`,
		);
	} catch (error: any) {
		results.propertyGroups.error = error.message;
		console.error('❌ Property Groups: Failed -', error.message);
	}

	// Test 4: Team Groups Collection
	try {
		console.log('Testing teamGroups collection...');
		const teamGroupsRef = collection(db, 'teamGroups');
		const snapshot = await getDocs(teamGroupsRef);
		results.teamGroups.connected = true;
		console.log(`✅ Team Groups: Connected (${snapshot.size} documents found)`);
	} catch (error: any) {
		results.teamGroups.error = error.message;
		console.error('❌ Team Groups: Failed -', error.message);
	}

	// Test 5: Team Members Collection
	try {
		console.log('Testing teamMembers collection...');
		const teamMembersRef = collection(db, 'teamMembers');
		const snapshot = await getDocs(teamMembersRef);
		results.teamMembers.connected = true;
		console.log(
			`✅ Team Members: Connected (${snapshot.size} documents found)`,
		);
	} catch (error: any) {
		results.teamMembers.error = error.message;
		console.error('❌ Team Members: Failed -', error.message);
	}

	// Test 6: Write/Delete Test (optional - creates and deletes a test document)
	try {
		console.log('\nTesting write permissions...');
		const testRef = collection(db, 'properties');
		const docRef = await addDoc(testRef, {
			title: 'TEST_CONNECTION',
			groupId: 'test',
			slug: 'test-connection',
			createdAt: new Date().toISOString(),
		});
		console.log('✅ Write test: Success');

		// Clean up test document
		await deleteDoc(doc(db, 'properties', docRef.id));
		console.log('✅ Delete test: Success');
	} catch (error: any) {
		console.error('❌ Write/Delete test: Failed -', error.message);
	}

	console.log('\n📊 Test Results Summary:');
	console.log('========================');
	Object.entries(results).forEach(([collection, result]) => {
		const status = result.connected ? '✅ Connected' : '❌ Failed';
		const error = result.error ? ` - ${result.error}` : '';
		console.log(`${collection}: ${status}${error}`);
	});

	return results;
};

// Helper function to test a specific collection
export const testCollection = async (collectionName: string) => {
	try {
		const collectionRef = collection(db, collectionName);
		const snapshot = await getDocs(collectionRef);
		console.log(
			`✅ ${collectionName}: Connected (${snapshot.size} documents found)`,
		);
		return { connected: true, count: snapshot.size, error: null };
	} catch (error: any) {
		console.error(`❌ ${collectionName}: Failed -`, error.message);
		return { connected: false, count: 0, error: error.message };
	}
};
