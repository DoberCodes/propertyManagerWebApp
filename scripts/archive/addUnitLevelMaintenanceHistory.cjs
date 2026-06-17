const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function addUnitLevelMaintenanceHistory() {
	console.log('Adding unit-level maintenance history...');

	// Get the user ID for property@example.com
	const userId = 'pQKZHowbmkd8G1ITfzYqlthmwUG3';

	// Get all units for this user
	const unitsSnapshot = await db
		.collection('units')
		.where('userId', '==', userId)
		.get();
	const units = [];
	unitsSnapshot.forEach((doc) => {
		units.push({ id: doc.id, ...doc.data() });
	});

	console.log(`Found ${units.length} units`);

	if (units.length === 0) {
		console.log('No units found for user');
		return;
	}

	// Unit-level maintenance history records
	const unitMaintenanceRecords = [
		{
			title: 'Kitchen Faucet Replacement',
			description:
				'Replaced leaking kitchen faucet with new chrome finish model',
			category: 'Plumbing',
			status: 'completed',
			priority: 'medium',
			cost: 125.5,
			completedDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-15')),
			assignedTo: 'contractor-plumber-1',
			notes: 'Customer reported drip, replaced washer and cartridge',
		},
		{
			title: 'Bathroom Tile Repair',
			description: 'Fixed cracked tile in bathroom shower area',
			category: 'Flooring',
			status: 'completed',
			priority: 'low',
			cost: 85.0,
			completedDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-22')),
			assignedTo: 'contractor-general-1',
			notes: 'Replaced single cracked tile, matched existing grout',
		},
		{
			title: 'HVAC Filter Replacement',
			description: 'Replaced dirty HVAC filters in all units',
			category: 'HVAC',
			status: 'completed',
			priority: 'low',
			cost: 45.0,
			completedDate: admin.firestore.Timestamp.fromDate(new Date('2024-02-01')),
			assignedTo: 'contractor-hvac-1',
			notes: 'Quarterly maintenance - filters were heavily soiled',
		},
		{
			title: 'Smoke Detector Battery Replacement',
			description: 'Replaced batteries in all smoke and CO detectors',
			category: 'Safety',
			status: 'completed',
			priority: 'high',
			cost: 25.0,
			completedDate: admin.firestore.Timestamp.fromDate(new Date('2024-02-10')),
			assignedTo: 'contractor-general-1',
			notes: 'Semi-annual safety inspection completed',
		},
		{
			title: 'Garbage Disposal Repair',
			description: 'Repaired jammed garbage disposal unit',
			category: 'Appliances',
			status: 'completed',
			priority: 'medium',
			cost: 75.0,
			completedDate: admin.firestore.Timestamp.fromDate(new Date('2024-02-18')),
			assignedTo: 'contractor-plumber-1',
			notes: 'Removed foreign object causing jam, tested functionality',
		},
		{
			title: 'Window Screen Replacement',
			description: 'Replaced torn window screens in living room',
			category: 'Windows',
			status: 'completed',
			priority: 'low',
			cost: 35.0,
			completedDate: admin.firestore.Timestamp.fromDate(new Date('2024-03-05')),
			assignedTo: 'contractor-general-1',
			notes: 'Screens were damaged by pet, replaced with heavy-duty mesh',
		},
		{
			title: 'Door Lock Rekey',
			description: 'Rekeyed front door lock after tenant turnover',
			category: 'Security',
			status: 'completed',
			priority: 'high',
			cost: 65.0,
			completedDate: admin.firestore.Timestamp.fromDate(new Date('2024-03-12')),
			assignedTo: 'contractor-locksmith-1',
			notes: 'Standard turnover procedure, provided 2 new keys',
		},
		{
			title: 'Ceiling Fan Installation',
			description: 'Installed new ceiling fan in bedroom',
			category: 'Electrical',
			status: 'completed',
			priority: 'medium',
			cost: 150.0,
			completedDate: admin.firestore.Timestamp.fromDate(new Date('2024-03-20')),
			assignedTo: 'contractor-electrician-1',
			notes: 'Tenant requested upgrade, installed energy-efficient model',
		},
	];

	let totalRecordsAdded = 0;

	// Add maintenance records for each unit
	for (const unit of units) {
		// Add 2-3 random maintenance records per unit
		const numRecords = Math.floor(Math.random() * 2) + 2; // 2-3 records
		const shuffledRecords = [...unitMaintenanceRecords].sort(
			() => 0.5 - Math.random(),
		);
		const selectedRecords = shuffledRecords.slice(0, numRecords);

		for (const record of selectedRecords) {
			const maintenanceData = {
				...record,
				userId,
				propertyId: unit.propertyId,
				unitId: unit.id,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			};

			await db.collection('maintenanceHistory').add(maintenanceData);
			totalRecordsAdded++;
		}
	}

	console.log(`Unit-level maintenance history added successfully!`);
	console.log(`Total records added: ${totalRecordsAdded}`);
}

addUnitLevelMaintenanceHistory()
	.then(() => {
		console.log('Script completed successfully');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Error:', error);
		process.exit(1);
	});
