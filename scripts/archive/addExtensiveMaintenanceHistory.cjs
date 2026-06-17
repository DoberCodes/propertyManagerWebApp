const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://maintley.firebaseio.com',
});

const db = admin.firestore();

async function addExtensiveMaintenanceHistory() {
	try {
		console.log('Adding extensive maintenance history...');

		// Get user ID for property@example.com
		const userQuery = await db
			.collection('users')
			.where('email', '==', 'property@example.com')
			.get();
		if (userQuery.empty) {
			console.log('User not found');
			return;
		}

		const userId = userQuery.docs[0].id;
		console.log('User ID:', userId);

		// Get all properties for this user
		const propertiesQuery = await db
			.collection('properties')
			.where('userId', '==', userId)
			.get();
		const properties = propertiesQuery.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		console.log(`Found ${properties.length} properties`);

		// Get all units for these properties
		const allUnits = [];
		for (const property of properties) {
			if (property.units && property.units.length > 0) {
				for (const unit of property.units) {
					allUnits.push({
						...unit,
						propertyId: property.id,
						propertyTitle: property.title,
					});
				}
			}
		}

		console.log(`Found ${allUnits.length} units`);

		// Maintenance history data
		const maintenanceRecords = [
			// Property-level maintenance
			{
				title: 'Annual HVAC System Inspection',
				description:
					'Complete inspection and maintenance of all HVAC units throughout the property. Cleaned filters, checked refrigerant levels, tested thermostat calibration, and lubricated moving parts.',
				propertyId: properties[0].id,
				propertyTitle: properties[0].title,
				userId: userId,
				ownerId: userId,
				status: 'Completed',
				priority: 'High',
				category: 'HVAC',
				dueDate: '2025-03-15',
				completionDate: '2025-03-10',
				completedBy: 'John Smith',
				completedByUserType: 'contractor',
				completionNotes:
					'All systems operating at peak efficiency. Recommended filter replacement schedule maintained.',
				createdAt: '2025-02-01T08:00:00.000Z',
				updatedAt: '2025-03-10T14:30:00.000Z',
				cost: 450.0,
				contractor: 'GreenThumb Landscaping',
			},
			{
				title: 'Roof Inspection and Repairs',
				description:
					'Comprehensive roof inspection identified minor leaks around vents. Applied sealant and replaced damaged shingles.',
				propertyId: properties[0].id,
				propertyTitle: properties[0].title,
				userId: userId,
				ownerId: userId,
				status: 'Completed',
				priority: 'Medium',
				category: 'Roofing',
				dueDate: '2025-04-01',
				completionDate: '2025-03-25',
				completedBy: 'Mike Davis',
				completedByUserType: 'contractor',
				completionNotes:
					'Roof is in good condition overall. Preventive maintenance completed to extend roof life.',
				createdAt: '2025-03-01T09:00:00.000Z',
				updatedAt: '2025-03-25T16:45:00.000Z',
				cost: 320.0,
				contractor: 'Spark Electric',
			},
			{
				title: 'Parking Lot Resurfacing',
				description:
					'Complete resurfacing of main parking area. Removed old asphalt, repaired base, and applied new asphalt coating.',
				propertyId: properties[0].id,
				propertyTitle: properties[0].title,
				userId: userId,
				ownerId: userId,
				status: 'Completed',
				priority: 'Medium',
				category: 'Exterior',
				dueDate: '2025-05-15',
				completionDate: '2025-05-08',
				completedBy: 'John Smith',
				completedByUserType: 'contractor',
				completionNotes:
					'Parking lot now has smooth surface and proper drainage. Should last 5-7 years.',
				createdAt: '2025-04-01T10:00:00.000Z',
				updatedAt: '2025-05-08T17:20:00.000Z',
				cost: 2850.0,
				contractor: 'GreenThumb Landscaping',
			},
			{
				title: 'Plumbing System Inspection',
				description:
					'Inspected all plumbing fixtures, pipes, and drainage systems. Cleaned drains and replaced worn washers.',
				propertyId: properties[1].id,
				propertyTitle: properties[1].title,
				userId: userId,
				ownerId: userId,
				status: 'Completed',
				priority: 'High',
				category: 'Plumbing',
				dueDate: '2025-02-28',
				completionDate: '2025-02-20',
				completedBy: 'Sarah Johnson',
				completedByUserType: 'contractor',
				completionNotes:
					'All plumbing systems functioning properly. No major issues found.',
				createdAt: '2025-01-15T08:30:00.000Z',
				updatedAt: '2025-02-20T15:10:00.000Z',
				cost: 275.0,
				contractor: 'ColorMasters Painting',
			},
			{
				title: 'Electrical Panel Upgrade',
				description:
					'Upgraded main electrical panel to handle increased load. Installed new breakers and updated wiring.',
				propertyId: properties[1].id,
				propertyTitle: properties[1].title,
				userId: userId,
				ownerId: userId,
				status: 'Completed',
				priority: 'High',
				category: 'Electrical',
				dueDate: '2025-06-01',
				completionDate: '2025-05-28',
				completedBy: 'Mike Davis',
				completedByUserType: 'contractor',
				completionNotes:
					'Electrical system now meets current code requirements and can handle modern appliances.',
				createdAt: '2025-04-15T11:00:00.000Z',
				updatedAt: '2025-05-28T13:45:00.000Z',
				cost: 1200.0,
				contractor: 'Spark Electric',
			},
			{
				title: 'Landscaping and Irrigation',
				description:
					'Spring landscaping maintenance including tree trimming, bush pruning, and irrigation system check.',
				propertyId: properties[2].id,
				propertyTitle: properties[2].title,
				userId: userId,
				ownerId: userId,
				status: 'Completed',
				priority: 'Low',
				category: 'Landscaping',
				dueDate: '2025-04-30',
				completionDate: '2025-04-22',
				completedBy: 'John Smith',
				completedByUserType: 'contractor',
				completionNotes:
					'Property looks beautiful. Irrigation system optimized for water efficiency.',
				createdAt: '2025-03-20T07:00:00.000Z',
				updatedAt: '2025-04-22T12:30:00.000Z',
				cost: 380.0,
				contractor: 'GreenThumb Landscaping',
			},
		];

		// Unit-specific maintenance records
		const unitMaintenanceRecords = [];

		// Add maintenance for each unit
		for (const unit of allUnits.slice(0, 6)) {
			// Limit to first 6 units for variety
			const unitRecords = [
				{
					title: `Unit ${unit.name} - Kitchen Faucet Repair`,
					description: `Repaired leaking kitchen faucet in ${unit.name}. Replaced cartridge and washers.`,
					propertyId: unit.propertyId,
					propertyTitle: unit.propertyTitle,
					unitId: unit.id,
					unitName: unit.name,
					userId: userId,
					ownerId: userId,
					status: 'Completed',
					priority: 'Medium',
					category: 'Plumbing',
					dueDate: '2025-03-01',
					completionDate: '2025-02-25',
					completedBy: 'Mike Davis',
					completedByUserType: 'contractor',
					completionNotes: `Faucet in ${unit.name} now working perfectly. No more leaks.`,
					createdAt: '2025-02-15T09:00:00.000Z',
					updatedAt: '2025-02-25T11:20:00.000Z',
					cost: 85.0,
					contractor: 'Spark Electric',
				},
				{
					title: `Unit ${unit.name} - Smoke Detector Battery Replacement`,
					description: `Replaced batteries in all smoke detectors in ${unit.name} and tested functionality.`,
					propertyId: unit.propertyId,
					propertyTitle: unit.propertyTitle,
					unitId: unit.id,
					unitName: unit.name,
					userId: userId,
					ownerId: userId,
					status: 'Completed',
					priority: 'High',
					category: 'Safety',
					dueDate: '2025-01-31',
					completionDate: '2025-01-28',
					completedBy: 'Property Manager',
					completedByUserType: 'staff',
					completionNotes: `All smoke detectors in ${unit.name} tested and working properly.`,
					createdAt: '2025-01-20T10:00:00.000Z',
					updatedAt: '2025-01-28T14:15:00.000Z',
					cost: 0.0,
					contractor: 'Property Manager',
				},
				{
					title: `Unit ${unit.name} - Carpet Cleaning`,
					description: `Deep cleaned carpets throughout ${unit.name} using professional cleaning equipment.`,
					propertyId: unit.propertyId,
					propertyTitle: unit.propertyTitle,
					unitId: unit.id,
					unitName: unit.name,
					userId: userId,
					ownerId: userId,
					status: 'Completed',
					priority: 'Low',
					category: 'Cleaning',
					dueDate: '2025-04-15',
					completionDate: '2025-04-10',
					completedBy: 'Sarah Johnson',
					completedByUserType: 'contractor',
					completionNotes: `Carpets in ${unit.name} look brand new. Professional cleaning completed.`,
					createdAt: '2025-03-25T08:00:00.000Z',
					updatedAt: '2025-04-10T16:30:00.000Z',
					cost: 125.0,
					contractor: 'ColorMasters Painting',
				},
			];

			unitMaintenanceRecords.push(...unitRecords);
		}

		// Combine all records
		const allRecords = [...maintenanceRecords, ...unitMaintenanceRecords];

		console.log(`Adding ${allRecords.length} maintenance history records...`);

		// Add records to maintenanceHistory collection
		for (const record of allRecords) {
			await db.collection('maintenanceHistory').add({
				...record,
				createdAt: record.createdAt || new Date().toISOString(),
				updatedAt: record.updatedAt || new Date().toISOString(),
			});
		}

		console.log('Extensive maintenance history added successfully!');

		// Summary
		console.log('\nSummary:');
		console.log(`- Property-level records: ${maintenanceRecords.length}`);
		console.log(`- Unit-level records: ${unitMaintenanceRecords.length}`);
		console.log(`- Total records added: ${allRecords.length}`);
	} catch (error) {
		console.error('Error:', error);
	} finally {
		process.exit(0);
	}
}

addExtensiveMaintenanceHistory();
