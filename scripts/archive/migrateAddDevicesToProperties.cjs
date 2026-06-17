#!/usr/bin/env node

/**
 * Migration script to add comprehensive device data to existing properties and units
 * Run with: node scripts/migrateAddDevicesToProperties.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Device data to add to existing properties and units
const deviceData = {
	// Building-level devices (shared across properties)
	buildingDevices: [
		// Sunset Gardens Apartments
		{
			id: 'device-hvac-sunset-main',
			name: 'Main HVAC System - Building A',
			type: 'HVAC',
			brand: 'Carrier',
			model: 'Infinity 24ANB6',
			location: 'Roof - Building A',
			propertyId: 'prop-residential-1',
			installDate: '2023-06-15',
			lastServiceDate: '2025-11-20',
			nextServiceDate: '2026-05-20',
			warrantyExpiration: '2028-06-15',
			notes:
				'Central air conditioning and heating unit. 5-ton capacity. Serves all units in Building A.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-water-heater-sunset',
			name: 'Water Heater - Building A',
			type: 'Water Heater',
			brand: 'Rheem',
			model: 'PRO+G50-40N RH67',
			location: 'Basement Mechanical Room',
			propertyId: 'prop-residential-1',
			installDate: '2023-06-15',
			lastServiceDate: '2025-10-15',
			nextServiceDate: '2026-04-15',
			warrantyExpiration: '2028-06-15',
			notes: 'Tankless water heater serving all units in Building A.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-boiler-sunset',
			name: 'Boiler System',
			type: 'Boiler',
			brand: 'Weil-McLain',
			model: 'Ultra 155',
			location: 'Basement Mechanical Room',
			propertyId: 'prop-residential-1',
			installDate: '2023-06-15',
			lastServiceDate: '2025-09-30',
			nextServiceDate: '2026-03-30',
			warrantyExpiration: '2028-06-15',
			notes: 'Hot water boiler for radiant heating system.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-security-sunset',
			name: 'Building Security System',
			type: 'Security',
			brand: 'ADT',
			model: 'SafeWatch Pro',
			location: 'Main Entrance',
			propertyId: 'prop-residential-1',
			installDate: '2023-07-01',
			lastServiceDate: '2025-12-01',
			nextServiceDate: '2026-06-01',
			warrantyExpiration: '2028-07-01',
			notes:
				'Complete building security system with cameras, sensors, and monitoring.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-fire-sunset',
			name: 'Fire Suppression System',
			type: 'Fire Safety',
			brand: 'Kidde',
			model: 'FireGuard Pro',
			location: 'Throughout Building',
			propertyId: 'prop-residential-1',
			installDate: '2023-06-20',
			lastServiceDate: '2025-12-15',
			nextServiceDate: '2026-06-15',
			warrantyExpiration: '2028-06-20',
			notes: 'Automatic fire suppression system with sprinklers and alarms.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},

		// Maple Ridge Townhomes
		{
			id: 'device-hvac-maple-1',
			name: 'HVAC Unit - Building 1',
			type: 'HVAC',
			brand: 'Trane',
			model: 'XR15',
			location: 'Attic Space',
			propertyId: 'prop-residential-2',
			installDate: '2024-01-10',
			lastServiceDate: '2025-08-15',
			nextServiceDate: '2026-02-15',
			warrantyExpiration: '2029-01-10',
			notes: 'Central air conditioning and heating unit for Building 1.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-water-heater-maple-1',
			name: 'Water Heater - Building 1',
			type: 'Water Heater',
			brand: 'Rheem',
			model: 'PRO+G50-40N RH67',
			location: 'Garage Mechanical Closet',
			propertyId: 'prop-residential-2',
			installDate: '2024-01-10',
			lastServiceDate: '2025-08-15',
			nextServiceDate: '2026-02-15',
			warrantyExpiration: '2029-01-10',
			notes: 'Tankless water heater serving all units in Building 1.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-security-maple',
			name: 'Community Security System',
			type: 'Security',
			brand: 'Ring',
			model: 'Alarm Pro',
			location: 'Main Entrance',
			propertyId: 'prop-residential-2',
			installDate: '2024-02-01',
			lastServiceDate: '2025-11-01',
			nextServiceDate: '2026-05-01',
			warrantyExpiration: '2029-02-01',
			notes: 'Smart security system with cameras and motion sensors.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},

		// Downtown Business Center
		{
			id: 'device-hvac-downtown-main',
			name: 'Main HVAC System',
			type: 'HVAC',
			brand: 'York',
			model: 'YVAA',
			location: 'Roof Top Unit',
			propertyId: 'prop-commercial-1',
			installDate: '2022-09-30',
			lastServiceDate: '2025-09-30',
			nextServiceDate: '2026-03-30',
			warrantyExpiration: '2027-09-30',
			notes: 'Commercial rooftop HVAC unit serving entire building.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-elevator-downtown',
			name: 'Passenger Elevator',
			type: 'Elevator',
			brand: 'Otis',
			model: 'Gen2 Core',
			location: 'Main Lobby',
			propertyId: 'prop-commercial-1',
			installDate: '2022-09-30',
			lastServiceDate: '2026-01-15',
			nextServiceDate: '2026-04-15',
			warrantyExpiration: '2027-09-30',
			notes: '3-stop passenger elevator serving floors 1-3.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-generator-downtown',
			name: 'Emergency Generator',
			type: 'Generator',
			brand: 'Cummins',
			model: 'C50D6',
			location: 'Rear Parking Lot',
			propertyId: 'prop-commercial-1',
			installDate: '2022-10-15',
			lastServiceDate: '2025-10-15',
			nextServiceDate: '2026-04-15',
			warrantyExpiration: '2027-10-15',
			notes: '50kW diesel generator for emergency power backup.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-security-downtown',
			name: 'Commercial Security System',
			type: 'Security',
			brand: 'Johnson Controls',
			model: 'Tyco IS',
			location: 'Security Office',
			propertyId: 'prop-commercial-1',
			installDate: '2022-10-01',
			lastServiceDate: '2025-12-01',
			nextServiceDate: '2026-06-01',
			warrantyExpiration: '2027-10-01',
			notes:
				'Commercial-grade security system with access control and surveillance.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},

		// Oakwood Estate
		{
			id: 'device-hvac-oakwood',
			name: 'Home HVAC System',
			type: 'HVAC',
			brand: 'Lennox',
			model: 'XC25',
			location: 'Attic',
			propertyId: 'prop-single-1',
			installDate: '2024-03-22',
			lastServiceDate: '2025-09-22',
			nextServiceDate: '2026-03-22',
			warrantyExpiration: '2029-03-22',
			notes: 'High-efficiency central air conditioning and heating system.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-water-heater-oakwood',
			name: 'Tank Water Heater',
			type: 'Water Heater',
			brand: 'A.O. Smith',
			model: 'Signature 100',
			location: 'Garage',
			propertyId: 'prop-single-1',
			installDate: '2024-03-22',
			lastServiceDate: '2025-09-22',
			nextServiceDate: '2026-03-22',
			warrantyExpiration: '2029-03-22',
			notes: '100-gallon tank water heater with energy-efficient design.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-security-oakwood',
			name: 'Home Security System',
			type: 'Security',
			brand: 'ADT',
			model: 'SafeWatch Pro',
			location: 'Main Panel - Foyer',
			propertyId: 'prop-single-1',
			installDate: '2024-03-22',
			lastServiceDate: '2025-12-01',
			nextServiceDate: '2026-06-01',
			warrantyExpiration: '2027-03-22',
			notes:
				'Complete home security system with cameras, sensors, and monitoring.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-pool-oakwood',
			name: 'Swimming Pool Equipment',
			type: 'Pool',
			brand: 'Pentair',
			model: 'IntelliFlo VS',
			location: 'Pool House',
			propertyId: 'prop-single-1',
			installDate: '2024-04-01',
			lastServiceDate: '2025-10-01',
			nextServiceDate: '2026-04-01',
			warrantyExpiration: '2029-04-01',
			notes: 'Variable speed pool pump with automated controls.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
	],

	// Unit-specific devices
	unitDevices: [
		// Sunset Gardens Apartments - Unit 1A
		{
			id: 'device-stove-1a',
			name: 'Range/Stove',
			type: 'Appliance',
			brand: 'Whirlpool',
			model: 'WFG505M0BS',
			location: 'Kitchen',
			propertyId: 'prop-residential-1',
			unitId: 'unit-sunset-1a',
			installDate: '2023-06-20',
			lastServiceDate: '2025-06-20',
			nextServiceDate: '2026-06-20',
			warrantyExpiration: '2028-06-20',
			notes: 'Gas range with 5 burners and electric oven.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-refrigerator-1a',
			name: 'Refrigerator',
			type: 'Appliance',
			brand: 'Samsung',
			model: 'RF28R7351SG',
			location: 'Kitchen',
			propertyId: 'prop-residential-1',
			unitId: 'unit-sunset-1a',
			installDate: '2023-06-20',
			lastServiceDate: '2025-06-20',
			nextServiceDate: '2026-06-20',
			warrantyExpiration: '2028-06-20',
			notes: '28 cu ft French door refrigerator with ice maker.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-dishwasher-1a',
			name: 'Dishwasher',
			type: 'Appliance',
			brand: 'KitchenAid',
			model: 'KDTM704KPS',
			location: 'Kitchen',
			propertyId: 'prop-residential-1',
			unitId: 'unit-sunset-1a',
			installDate: '2023-06-20',
			lastServiceDate: '2025-06-20',
			nextServiceDate: '2026-06-20',
			warrantyExpiration: '2028-06-20',
			notes: 'Built-in dishwasher with third rack.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-washer-1a',
			name: 'Washer',
			type: 'Appliance',
			brand: 'LG',
			model: 'WM4000HWA',
			location: 'Laundry Closet',
			propertyId: 'prop-residential-1',
			unitId: 'unit-sunset-1a',
			installDate: '2023-06-20',
			lastServiceDate: '2025-06-20',
			nextServiceDate: '2026-06-20',
			warrantyExpiration: '2028-06-20',
			notes: '4.5 cu ft front load washer.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-dryer-1a',
			name: 'Dryer',
			type: 'Appliance',
			brand: 'LG',
			model: 'DLE4000W',
			location: 'Laundry Closet',
			propertyId: 'prop-residential-1',
			unitId: 'unit-sunset-1a',
			installDate: '2023-06-20',
			lastServiceDate: '2025-06-20',
			nextServiceDate: '2026-06-20',
			warrantyExpiration: '2028-06-20',
			notes: '7.4 cu ft electric dryer.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},

		// Sunset Gardens Apartments - Unit 1B
		{
			id: 'device-stove-1b',
			name: 'Range/Stove',
			type: 'Appliance',
			brand: 'GE',
			model: 'JGB735SPSS',
			location: 'Kitchen',
			propertyId: 'prop-residential-1',
			unitId: 'unit-sunset-1b',
			installDate: '2023-06-20',
			lastServiceDate: '2025-06-20',
			nextServiceDate: '2026-06-20',
			warrantyExpiration: '2028-06-20',
			notes: 'Gas range with 5 burners and convection oven.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-refrigerator-1b',
			name: 'Refrigerator',
			type: 'Appliance',
			brand: 'Samsung',
			model: 'RF28R7351SG',
			location: 'Kitchen',
			propertyId: 'prop-residential-1',
			unitId: 'unit-sunset-1b',
			installDate: '2023-06-20',
			lastServiceDate: '2025-06-20',
			nextServiceDate: '2026-06-20',
			warrantyExpiration: '2028-06-20',
			notes: '28 cu ft French door refrigerator with ice maker.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-dishwasher-1b',
			name: 'Dishwasher',
			type: 'Appliance',
			brand: 'Bosch',
			model: 'SHPM98W75N',
			location: 'Kitchen',
			propertyId: 'prop-residential-1',
			unitId: 'unit-sunset-1b',
			installDate: '2023-06-20',
			lastServiceDate: '2025-06-20',
			nextServiceDate: '2026-06-20',
			warrantyExpiration: '2028-06-20',
			notes: 'Quiet dishwasher with third rack.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},

		// Maple Ridge Townhomes - Unit 101
		{
			id: 'device-stove-101',
			name: 'Range/Stove',
			type: 'Appliance',
			brand: 'Maytag',
			model: 'MGR8650DS',
			location: 'Kitchen',
			propertyId: 'prop-residential-2',
			unitId: 'unit-maple-101',
			installDate: '2024-01-15',
			lastServiceDate: '2025-07-15',
			nextServiceDate: '2026-01-15',
			warrantyExpiration: '2029-01-15',
			notes: 'Gas range with 5 burners and double oven.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-refrigerator-101',
			name: 'Refrigerator',
			type: 'Appliance',
			brand: 'LG',
			model: 'LFXS28968S',
			location: 'Kitchen',
			propertyId: 'prop-residential-2',
			unitId: 'unit-maple-101',
			installDate: '2024-01-15',
			lastServiceDate: '2025-07-15',
			nextServiceDate: '2026-01-15',
			warrantyExpiration: '2029-01-15',
			notes: '28 cu ft French door refrigerator with ice maker.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-dishwasher-101',
			name: 'Dishwasher',
			type: 'Appliance',
			brand: 'KitchenAid',
			model: 'KDTM704KPS',
			location: 'Kitchen',
			propertyId: 'prop-residential-2',
			unitId: 'unit-maple-101',
			installDate: '2024-01-15',
			lastServiceDate: '2025-07-15',
			nextServiceDate: '2026-01-15',
			warrantyExpiration: '2029-01-15',
			notes: 'Built-in dishwasher with third rack.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-washer-101',
			name: 'Washer',
			type: 'Appliance',
			brand: 'Samsung',
			model: 'WF45T6000AW',
			location: 'Laundry Room',
			propertyId: 'prop-residential-2',
			unitId: 'unit-maple-101',
			installDate: '2024-01-15',
			lastServiceDate: '2025-07-15',
			nextServiceDate: '2026-01-15',
			warrantyExpiration: '2029-01-15',
			notes: '5.0 cu ft front load washer.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-dryer-101',
			name: 'Dryer',
			type: 'Appliance',
			brand: 'Samsung',
			model: 'DVE45T6000W',
			location: 'Laundry Room',
			propertyId: 'prop-residential-2',
			unitId: 'unit-maple-101',
			installDate: '2024-01-15',
			lastServiceDate: '2025-07-15',
			nextServiceDate: '2026-01-15',
			warrantyExpiration: '2029-01-15',
			notes: '7.5 cu ft electric dryer.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-garage-door-101',
			name: 'Garage Door Opener',
			type: 'Garage Door',
			brand: 'Chamberlain',
			model: 'B970',
			location: 'Garage',
			propertyId: 'prop-residential-2',
			unitId: 'unit-maple-101',
			installDate: '2024-01-15',
			lastServiceDate: '2025-07-15',
			nextServiceDate: '2026-01-15',
			warrantyExpiration: '2029-01-15',
			notes: 'Smart garage door opener with battery backup.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},

		// Oakwood Estate - Main House
		{
			id: 'device-stove-oakwood',
			name: 'Professional Range',
			type: 'Appliance',
			brand: 'Wolf',
			model: 'CG365P/S',
			location: 'Kitchen',
			propertyId: 'prop-single-1',
			unitId: 'unit-oakwood-main',
			installDate: '2024-03-25',
			lastServiceDate: '2025-09-25',
			nextServiceDate: '2026-03-25',
			warrantyExpiration: '2029-03-25',
			notes: '36" gas range with 6 burners and griddle.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-refrigerator-oakwood',
			name: 'Side-by-Side Refrigerator',
			type: 'Appliance',
			brand: 'Sub-Zero',
			model: 'BI36S',
			location: 'Kitchen',
			propertyId: 'prop-single-1',
			unitId: 'unit-oakwood-main',
			installDate: '2024-03-25',
			lastServiceDate: '2025-09-25',
			nextServiceDate: '2026-03-25',
			warrantyExpiration: '2029-03-25',
			notes: '36" built-in refrigerator with ice maker.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-dishwasher-oakwood',
			name: 'Dishwasher',
			type: 'Appliance',
			brand: 'Miele',
			model: 'G7360SCVI',
			location: 'Kitchen',
			propertyId: 'prop-single-1',
			unitId: 'unit-oakwood-main',
			installDate: '2024-03-25',
			lastServiceDate: '2025-09-25',
			nextServiceDate: '2026-03-25',
			warrantyExpiration: '2029-03-25',
			notes: 'Quiet built-in dishwasher with AutoDos detergent system.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-washer-oakwood',
			name: 'Front Load Washer',
			type: 'Appliance',
			brand: 'Miele',
			model: 'WXD160',
			location: 'Laundry Room',
			propertyId: 'prop-single-1',
			unitId: 'unit-oakwood-main',
			installDate: '2024-03-25',
			lastServiceDate: '2025-09-25',
			nextServiceDate: '2026-03-25',
			warrantyExpiration: '2029-03-25',
			notes: '8 kg front load washer with CapDosing.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-dryer-oakwood',
			name: 'Heat Pump Dryer',
			type: 'Appliance',
			brand: 'Miele',
			model: 'TXD160',
			location: 'Laundry Room',
			propertyId: 'prop-single-1',
			unitId: 'unit-oakwood-main',
			installDate: '2024-03-25',
			lastServiceDate: '2025-09-25',
			nextServiceDate: '2026-03-25',
			warrantyExpiration: '2029-03-25',
			notes: '8 kg heat pump dryer with PerfectDry.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-garage-door-oakwood',
			name: 'Triple Garage Door Opener',
			type: 'Garage Door',
			brand: 'LiftMaster',
			model: '889MAX',
			location: 'Garage',
			propertyId: 'prop-single-1',
			unitId: 'unit-oakwood-main',
			installDate: '2024-03-25',
			lastServiceDate: '2025-09-25',
			nextServiceDate: '2026-03-25',
			warrantyExpiration: '2029-03-25',
			notes: 'Smart garage door opener for 3-car garage with battery backup.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-intercom-oakwood',
			name: 'Whole Home Intercom',
			type: 'Intercom',
			brand: 'Control4',
			model: 'Intercom',
			location: 'Throughout House',
			propertyId: 'prop-single-1',
			unitId: 'unit-oakwood-main',
			installDate: '2024-03-25',
			lastServiceDate: '2025-09-25',
			nextServiceDate: '2026-03-25',
			warrantyExpiration: '2029-03-25',
			notes: 'Smart home intercom system with video doorbells.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
	],

	// Suite-specific devices
	suiteDevices: [
		// Downtown Business Center - Suite 100
		{
			id: 'device-hvac-suite-100',
			name: 'Suite HVAC Unit',
			type: 'HVAC',
			brand: 'York',
			model: 'YCJD',
			location: 'Ceiling Plenum',
			propertyId: 'prop-commercial-1',
			suiteId: 'suite-downtown-100',
			installDate: '2022-10-01',
			lastServiceDate: '2025-10-01',
			nextServiceDate: '2026-04-01',
			warrantyExpiration: '2027-10-01',
			notes: 'Dedicated HVAC unit for Suite 100.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-security-suite-100',
			name: 'Suite Security System',
			type: 'Security',
			brand: 'Honeywell',
			model: 'Vista 21iP',
			location: 'Suite Entrance',
			propertyId: 'prop-commercial-1',
			suiteId: 'suite-downtown-100',
			installDate: '2022-10-01',
			lastServiceDate: '2025-10-01',
			nextServiceDate: '2026-04-01',
			warrantyExpiration: '2027-10-01',
			notes: 'Suite-specific security system with access control.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},

		// Downtown Business Center - Suite 200
		{
			id: 'device-hvac-suite-200',
			name: 'Suite HVAC Unit',
			type: 'HVAC',
			brand: 'York',
			model: 'YCJD',
			location: 'Ceiling Plenum',
			propertyId: 'prop-commercial-1',
			suiteId: 'suite-downtown-200',
			installDate: '2022-10-01',
			lastServiceDate: '2025-10-01',
			nextServiceDate: '2026-04-01',
			warrantyExpiration: '2027-10-01',
			notes: 'Dedicated HVAC unit for Suite 200.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-security-suite-200',
			name: 'Suite Security System',
			type: 'Security',
			brand: 'Honeywell',
			model: 'Vista 21iP',
			location: 'Suite Entrance',
			propertyId: 'prop-commercial-1',
			suiteId: 'suite-downtown-200',
			installDate: '2022-10-01',
			lastServiceDate: '2025-10-01',
			nextServiceDate: '2026-04-01',
			warrantyExpiration: '2027-10-01',
			notes: 'Suite-specific security system with access control.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
	],
};

async function addDevicesToProperties(userId) {
	console.log(`Adding comprehensive device data for user ${userId}...`);

	const batch = db.batch();

	try {
		// Add building-level devices
		console.log('Adding building-level devices...');
		for (const device of deviceData.buildingDevices) {
			const deviceRef = db.collection('devices').doc(device.id);
			batch.set(deviceRef, { ...device, userId });
		}

		// Add unit-specific devices
		console.log('Adding unit-specific devices...');
		for (const device of deviceData.unitDevices) {
			const deviceRef = db.collection('devices').doc(device.id);
			batch.set(deviceRef, { ...device, userId });
		}

		// Add suite-specific devices
		console.log('Adding suite-specific devices...');
		for (const device of deviceData.suiteDevices) {
			const deviceRef = db.collection('devices').doc(device.id);
			batch.set(deviceRef, { ...device, userId });
		}

		// Commit all changes
		await batch.commit();
		console.log('✅ All device data added successfully!');
	} catch (error) {
		console.error('❌ Error adding device data:', error);
		throw error;
	}
}

async function findPropertyUser() {
	console.log(`Looking for user with email: property@example.com`);

	try {
		// Find user in Firestore
		const usersRef = db.collection('users');
		const userQuery = await usersRef
			.where('email', '==', 'property@example.com')
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			console.log(`✅ Found user: ${userDoc.id}`);
			return userDoc.id;
		} else {
			throw new Error(
				'User property@example.com not found. Please run the initial mock data migration first.',
			);
		}
	} catch (error) {
		console.error('❌ Error finding user:', error);
		throw error;
	}
}

async function migrateAddDevices() {
	console.log(
		'🚀 Starting migration: Add comprehensive device data to properties',
	);

	try {
		// Find the property user
		const userId = await findPropertyUser();

		// Add all device data
		await addDevicesToProperties(userId);

		console.log('\n🎉 Device migration completed successfully!');
		console.log(`User: property@example.com (ID: ${userId})`);
		console.log('Added devices:');
		console.log(
			`  - ${deviceData.buildingDevices.length} building-level devices`,
		);
		console.log(`  - ${deviceData.unitDevices.length} unit-specific devices`);
		console.log(`  - ${deviceData.suiteDevices.length} suite-specific devices`);
		console.log(
			`  - Total: ${
				deviceData.buildingDevices.length +
				deviceData.unitDevices.length +
				deviceData.suiteDevices.length
			} devices`,
		);
	} catch (error) {
		console.error('❌ Migration failed:', error);
		process.exit(1);
	}
}

// Run migration
migrateAddDevices()
	.then(() => {
		console.log('\n✅ Device migration script finished successfully');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n❌ Device migration script failed:', error);
		process.exit(1);
	});
