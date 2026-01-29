/**
 * Firestore Seeding Script
 *
 * Populates Firestore with mock data from shared data file (src/data/mockData.ts)
 * Run with: npm run seed:firebase
 *
 * Data Source: This script imports mock data from src/data/mockData.ts
 * to ensure consistency between Redux state and Firebase.
 * When you update mockData.ts, those changes will automatically
 * be reflected when you re-run this seed script.
 */

const { initializeApp } = require('firebase/app');
const {
	getFirestore,
	collection,
	doc,
	setDoc,
	writeBatch,
	Timestamp,
} = require('firebase/firestore');
require('dotenv').config({ path: '.env' });

// NOTE: Currently using hardcoded data below due to CommonJS/TypeScript compatibility.
// To sync with Redux mockData.ts, manually update the data arrays below or
// install ts-node and convert this script to use: require('ts-node/register')

// Import shared mock data (DISABLED - TypeScript import not compatible with CommonJS)
// const {
// 	mockPropertyGroups,
// 	mockTasks,
// 	mockTeamGroups,
// 	mockDevices,
// } = require('../src/data/mockData.ts');

// Firebase configuration from environment variables
const firebaseConfig = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
	authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
	storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Hardcoded mock data for seeding
// Using userId 'user-admin-1' to match the Admin test user from userSlice.tsx
const mockPropertyGroups = [
	{
		id: 'group-1',
		userId: 'user-admin-1',
		name: 'Downtown Properties',
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'group-2',
		userId: 'user-admin-1',
		name: 'Residential Homes',
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
];

const mockProperties = [
	{
		id: 'prop-1',
		groupId: 'group-1',
		title: 'Downtown Apartments',
		slug: 'downtown-apartments',
		image: 'https://via.placeholder.com/300x200?text=Downtown+Apartments',
		isFavorite: false,
		propertyType: 'Multi-Family',
		owner: 'John Smith',
		address: '123 Main Street, Downtown District',
		deviceIds: [],
		administrators: ['user-admin-1'],
		viewers: [],
		notes: '',
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'prop-2',
		groupId: 'group-1',
		title: 'Business Park',
		slug: 'business-park',
		image: 'https://via.placeholder.com/300x200?text=Business+Park',
		isFavorite: false,
		propertyType: 'Commercial',
		owner: 'Corporate Solutions Inc',
		address: '456 Commerce Avenue, Business District',
		hasSuites: true,
		deviceIds: [],
		administrators: ['user-admin-1'],
		viewers: [],
		notes: '',
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'prop-3',
		groupId: 'group-2',
		title: 'Sunset Heights',
		slug: 'sunset-heights',
		image: 'https://via.placeholder.com/300x200?text=Sunset+Heights',
		isFavorite: false,
		propertyType: 'Single Family',
		owner: 'Sarah Johnson',
		address: '789 Hill Road, Residential Area',
		bedrooms: 4,
		bathrooms: 3,
		deviceIds: [],
		administrators: ['user-admin-1'],
		viewers: [],
		notes: '',
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'prop-4',
		groupId: 'group-2',
		title: 'Oak Street Complex',
		slug: 'oak-street-complex',
		image: 'https://via.placeholder.com/300x200?text=Oak+Street',
		isFavorite: false,
		propertyType: 'Multi-Family',
		owner: 'Property Group LLC',
		address: '321 Oak Street, Mixed Use Zone',
		deviceIds: [],
		administrators: ['user-admin-1'],
		viewers: [],
		notes: '',
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
];

const mockUnits = [
	{
		id: 'unit-1',
		propertyId: 'prop-1',
		name: 'Apt 5B',
		floor: 5,
		bedrooms: 2,
		bathrooms: 1,
		area: 850,
		isOccupied: true,
		deviceIds: [],
		occupants: [
			{
				firstName: 'Emily',
				lastName: 'Brown',
				email: 'emily@test.com',
				phone: '(555) 678-9012',
			},
		],
		taskHistory: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'unit-2',
		propertyId: 'prop-1',
		name: 'Apt 3A',
		floor: 3,
		bedrooms: 1,
		bathrooms: 1,
		area: 750,
		isOccupied: false,
		deviceIds: [],
		occupants: [],
		taskHistory: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'unit-3',
		propertyId: 'prop-1',
		name: 'Apt 4C',
		floor: 4,
		bedrooms: 3,
		bathrooms: 2,
		area: 900,
		isOccupied: false,
		deviceIds: [],
		occupants: [],
		taskHistory: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'unit-4',
		propertyId: 'prop-4',
		name: 'Unit A',
		floor: 1,
		bedrooms: 4,
		bathrooms: 2,
		area: 1200,
		isOccupied: false,
		deviceIds: [],
		occupants: [],
		taskHistory: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'unit-5',
		propertyId: 'prop-4',
		name: 'Unit B',
		floor: 1,
		bedrooms: 3,
		bathrooms: 2,
		area: 1150,
		isOccupied: false,
		deviceIds: [],
		occupants: [],
		taskHistory: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'unit-6',
		propertyId: 'prop-4',
		name: 'Unit C',
		floor: 2,
		bedrooms: 2,
		bathrooms: 1,
		area: 1100,
		isOccupied: false,
		deviceIds: [],
		occupants: [],
		taskHistory: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'unit-7',
		propertyId: 'prop-4',
		name: 'Unit D',
		floor: 2,
		bedrooms: 4,
		bathrooms: 3,
		area: 1250,
		isOccupied: false,
		deviceIds: [],
		occupants: [],
		taskHistory: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
];

const mockSuites = [
	{
		id: 'suite-1',
		propertyId: 'prop-2',
		name: 'Suite 100',
		floor: 1,
		area: 2500,
		isOccupied: false,
		deviceIds: [],
		occupants: [],
		taskHistory: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'suite-2',
		propertyId: 'prop-2',
		name: 'Suite 200',
		floor: 2,
		area: 3000,
		isOccupied: false,
		deviceIds: [],
		occupants: [],
		taskHistory: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'suite-3',
		propertyId: 'prop-2',
		name: 'Suite 300',
		floor: 3,
		area: 2800,
		isOccupied: false,
		deviceIds: [],
		occupants: [],
		taskHistory: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
];

const mockTasks = [
	{
		id: 'task-1',
		propertyId: 'prop-1',
		title: 'Replace air filters',
		dueDate: '2026-02-01',
		status: 'In Progress',
		property: 'Downtown Apartments',
		notes: 'Check all HVAC units',
		assignedTo: 'member-1',
		devices: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'task-2',
		propertyId: 'prop-1',
		title: 'Quarterly maintenance inspection',
		dueDate: '2026-02-15',
		status: 'Pending',
		property: 'Downtown Apartments',
		notes: '',
		assignedTo: 'member-2',
		devices: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'task-3',
		propertyId: 'prop-2',
		title: 'Parking lot sweeping',
		dueDate: '2026-01-28',
		status: 'Completed',
		property: 'Business Park',
		completionDate: '2026-01-27',
		completedBy: 'user-admin-1',
		notes: '',
		assignedTo: 'member-1',
		devices: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'task-4',
		propertyId: 'prop-3',
		title: 'Gutter cleaning',
		dueDate: '2026-02-10',
		status: 'Pending',
		property: 'Sunset Heights',
		notes: 'Schedule before rainy season',
		assignedTo: 'member-2',
		devices: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
];

const mockTeamGroups = [
	{
		id: 'team-group-1',
		userId: 'user-admin-1',
		name: 'Maintenance Team',
		linkedProperties: ['prop-1', 'prop-2', 'prop-3', 'prop-4'],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
];

const mockTeamMembers = [
	{
		id: 'member-1',
		groupId: 'team-group-1',
		firstName: 'John',
		lastName: 'Doe',
		title: 'Maintenance Lead',
		email: 'john.doe@example.com',
		phone: '(555) 123-4567',
		role: 'Lead',
		address: '123 Worker St',
		image: '',
		notes: 'Experienced with HVAC systems',
		linkedProperties: ['prop-1', 'prop-2'],
		taskHistory: [],
		files: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'member-2',
		groupId: 'team-group-1',
		firstName: 'Jane',
		lastName: 'Smith',
		title: 'Plumber',
		email: 'jane.smith@example.com',
		phone: '(555) 987-6543',
		role: 'Technician',
		address: '456 Service Ave',
		image: '',
		notes: 'Licensed plumber',
		linkedProperties: ['prop-1', 'prop-3'],
		taskHistory: [],
		files: [],
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
];

const mockDevices = [
	{
		id: 'device-1',
		type: 'HVAC',
		brand: 'Carrier',
		model: 'Infinity 21',
		serialNumber: 'SN123456',
		installationDate: '2024-06-15',
		location: {
			propertyId: 'prop-1',
			unitId: 'unit-1',
		},
		status: 'Active',
		maintenanceHistory: [
			{
				date: '2026-01-15',
				description: 'Filter replacement',
			},
		],
		notes: 'Annual maintenance required',
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'device-2',
		type: 'Plumbing',
		brand: 'Kohler',
		model: 'Water Heater Pro',
		serialNumber: 'SN789012',
		installationDate: '2023-03-20',
		location: {
			propertyId: 'prop-1',
			unitId: 'unit-2',
		},
		status: 'Active',
		maintenanceHistory: [
			{
				date: '2025-12-20',
				description: 'Inspection',
			},
		],
		notes: 'Check pressure valve quarterly',
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
	{
		id: 'device-3',
		type: 'HVAC',
		brand: 'Trane',
		model: 'XR17',
		serialNumber: 'SN345678',
		installationDate: '2024-01-10',
		location: {
			propertyId: 'prop-2',
			suiteId: 'suite-1',
		},
		status: 'Active',
		maintenanceHistory: [],
		notes: 'Commercial grade unit',
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	},
];

/**
 * ============================================================================
 * END OF LEGACY DATA
 * ============================================================================
 */

/**
 * Seed a collection with data
 */
async function seedCollection(collectionName, data) {
	console.log(`\n📝 Seeding ${collectionName}...`);

	const batch = writeBatch(db);
	let count = 0;

	for (const item of data) {
		const docRef = doc(db, collectionName, item.id);
		batch.set(docRef, item);
		count++;

		// Firestore batches can only contain 500 operations
		if (count % 500 === 0) {
			await batch.commit();
			console.log(`   ✓ Committed ${count} documents`);
		}
	}

	// Commit any remaining documents
	if (count % 500 !== 0) {
		await batch.commit();
	}

	console.log(
		`   ✅ Successfully seeded ${count} documents to ${collectionName}`,
	);
}

/**
 * Main seeding function
 */
async function seedFirestore() {
	console.log('🚀 Starting Firestore seeding...\n');
	console.log('📊 Firebase Project:', firebaseConfig.projectId);
	console.log('📁 Data Source: Hardcoded data in seed script\n');

	try {
		// Validate Firebase config
		if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
			throw new Error(
				'Missing Firebase configuration. Check your .env.local file.',
			);
		}

		// Seed all collections with hardcoded data
		await seedCollection('propertyGroups', mockPropertyGroups);
		await seedCollection('properties', mockProperties);
		await seedCollection('units', mockUnits);
		await seedCollection('suites', mockSuites);
		await seedCollection('tasks', mockTasks);
		await seedCollection('teamGroups', mockTeamGroups);
		await seedCollection('teamMembers', mockTeamMembers);
		await seedCollection('devices', mockDevices);

		console.log('\n✨ Firestore seeding completed successfully!');
		console.log('\n📋 Summary:');
		console.log(`   • ${mockPropertyGroups.length} Property Groups`);
		console.log(`   • ${mockProperties.length} Properties`);
		console.log(`   • ${mockUnits.length} Units`);
		console.log(`   • ${mockSuites.length} Suites`);
		console.log(`   • ${mockTasks.length} Tasks`);
		console.log(`   • ${mockTeamGroups.length} Team Groups`);
		console.log(`   • ${mockTeamMembers.length} Team Members`);
		console.log(`   • ${mockDevices.length} Devices`);
		console.log('\n🎉 Your Firestore database is ready to use!');
	} catch (error) {
		console.error('\n❌ Error seeding Firestore:', error.message);
		console.error(error);
		process.exit(1);
	}
}

// Run the seeding script
seedFirestore();
