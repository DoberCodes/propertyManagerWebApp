#!/usr/bin/env node

/**
 * Migration script to add comprehensive mock data for property@example.com user
 * Creates properties, units, tasks, team members, and other related data
 * Run with: node scripts/migrateAddMockDataForPropertyUser.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// Target user email
const TARGET_EMAIL = 'property@example.com';

// Mock data for the property user
const mockData = {
	user: {
		email: TARGET_EMAIL,
		firstName: 'Property',
		lastName: 'Manager',
		title: 'Property Manager',
		phone: '(555) 123-4567',
		role: 'admin',
		userType: 'landlord',
		subscription: {
			status: 'trial',
			plan: 'premium',
			currentPeriodStart: Math.floor(Date.now() / 1000),
			currentPeriodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
			trialEndsAt: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60, // 14 days
		},
	},

	propertyGroups: [
		{
			id: 'prop-group-1',
			name: 'Residential Properties',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'prop-group-2',
			name: 'Commercial Properties',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
	],

	properties: [
		{
			id: 'prop-residential-1',
			title: 'Sunset Gardens Apartments',
			slug: 'sunset-gardens-apartments',
			image:
				'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
			isFavorite: true,
			propertyType: 'Multi-Family',
			owner: 'Property Manager',
			address: '123 Sunset Boulevard, Los Angeles, CA 90210',
			bedrooms: null,
			bathrooms: null,
			hasSuites: false,
			deviceIds: [],
			administrators: [],
			viewers: [],
			notes:
				'Beautiful apartment complex with ocean views. Recently renovated with modern amenities.',
			groupId: 'prop-group-1',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'prop-residential-2',
			title: 'Maple Ridge Townhomes',
			slug: 'maple-ridge-townhomes',
			image:
				'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
			isFavorite: false,
			propertyType: 'Multi-Family',
			owner: 'Property Manager',
			address: '456 Maple Street, Portland, OR 97201',
			bedrooms: null,
			bathrooms: null,
			hasSuites: false,
			deviceIds: [],
			administrators: [],
			viewers: [],
			notes:
				'Quiet townhome community in suburban area. Family-friendly with parks nearby.',
			groupId: 'prop-group-1',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'prop-commercial-1',
			title: 'Downtown Business Center',
			slug: 'downtown-business-center',
			image:
				'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
			isFavorite: true,
			propertyType: 'Commercial',
			owner: 'Property Manager',
			address: '789 Commerce Drive, Seattle, WA 98101',
			bedrooms: null,
			bathrooms: null,
			hasSuites: true,
			deviceIds: [],
			administrators: [],
			viewers: [],
			notes:
				'Prime downtown location with excellent foot traffic. Mixed-use commercial space.',
			groupId: 'prop-group-2',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'prop-single-1',
			title: 'Oakwood Estate',
			slug: 'oakwood-estate',
			image:
				'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
			isFavorite: false,
			propertyType: 'Single Family',
			owner: 'Property Manager',
			address: '321 Oak Avenue, Austin, TX 78701',
			bedrooms: 4,
			bathrooms: 3,
			hasSuites: false,
			deviceIds: [],
			administrators: [],
			viewers: [],
			notes:
				'Luxury single-family home with large backyard. Perfect for families.',
			groupId: 'prop-group-1',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
	],

	units: [
		// Sunset Gardens Apartments units
		{
			id: 'unit-sunset-1a',
			name: '1A',
			floor: 1,
			bedrooms: 1,
			bathrooms: 1,
			area: 650,
			isOccupied: true,
			deviceIds: [],
			occupants: [
				{
					firstName: 'Sarah',
					lastName: 'Johnson',
					email: 'sarah.johnson@email.com',
					phone: '(555) 111-2222',
				},
			],
			taskHistory: [
				{
					taskId: 'task-plumbing-repair-1',
					date: '2026-01-15',
					title: 'Fixed leaky kitchen faucet',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-hvac-1a-2025',
					date: '2025-12-10',
					title: 'HVAC filter replacement',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-plumbing-1a-2025',
					date: '2025-11-22',
					title: 'Cleared clogged bathroom drain',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-electrical-1a-2025',
					date: '2025-10-18',
					title: 'Replaced light switch in living room',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-painting-1a-2025',
					date: '2025-09-30',
					title: 'Touched up paint on bedroom wall',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-general-1a-2025',
					date: '2025-08-15',
					title: 'Replaced smoke detector battery',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-cleaning-1a-2025',
					date: '2025-07-20',
					title: 'Deep cleaned carpets',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-hvac-1a-2025-2',
					date: '2025-06-12',
					title: 'Cleaned and serviced air conditioning unit',
					status: 'Completed',
				},
			],
			propertyId: 'prop-residential-1',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'unit-sunset-1b',
			name: '1B',
			floor: 1,
			bedrooms: 2,
			bathrooms: 1,
			area: 850,
			isOccupied: true,
			deviceIds: [],
			occupants: [
				{
					firstName: 'Michael',
					lastName: 'Chen',
					email: 'michael.chen@email.com',
					phone: '(555) 222-3333',
				},
				{
					firstName: 'Lisa',
					lastName: 'Chen',
					email: 'lisa.chen@email.com',
					phone: '(555) 222-3334',
				},
			],
			taskHistory: [
				{
					taskId: 'task-hvac-repair-1',
					date: '2026-01-08',
					title: 'Repaired faulty thermostat',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-plumbing-1b-2025',
					date: '2025-12-05',
					title: 'Fixed running toilet',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-electrical-1b-2025',
					date: '2025-11-15',
					title: 'Replaced outlet in kitchen',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-appliance-1b-2025',
					date: '2025-10-28',
					title: 'Repaired dishwasher door latch',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-painting-1b-2025',
					date: '2025-09-14',
					title: 'Repainted kitchen cabinets',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-general-1b-2025',
					date: '2025-08-22',
					title: 'Replaced window screen',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-hvac-1b-2025',
					date: '2025-07-10',
					title: 'HVAC maintenance and filter change',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-plumbing-1b-2025-2',
					date: '2025-06-18',
					title: 'Cleared kitchen sink disposal',
					status: 'Completed',
				},
			],
			propertyId: 'prop-residential-1',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'unit-sunset-2a',
			name: '2A',
			floor: 2,
			bedrooms: 2,
			bathrooms: 2,
			area: 950,
			isOccupied: false,
			deviceIds: [],
			occupants: [],
			taskHistory: [
				{
					taskId: 'task-painting-1',
					date: '2026-01-20',
					title: 'Fresh paint throughout unit',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-flooring-2a-2025',
					date: '2025-12-18',
					title: 'Replaced damaged laminate flooring',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-plumbing-2a-2025',
					date: '2025-11-08',
					title: 'Fixed leaky shower head',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-electrical-2a-2025',
					date: '2025-10-05',
					title: 'Replaced bathroom light fixture',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-general-2a-2025',
					date: '2025-09-12',
					title: 'Replaced door lock',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-hvac-2a-2025',
					date: '2025-08-28',
					title: 'Cleaned air vents and ducts',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-appliance-2a-2025',
					date: '2025-07-15',
					title: 'Repaired refrigerator ice maker',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-painting-2a-2025',
					date: '2025-06-22',
					title: 'Touched up ceiling paint',
					status: 'Completed',
				},
			],
			propertyId: 'prop-residential-1',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'unit-sunset-2b',
			name: '2B',
			floor: 2,
			bedrooms: 3,
			bathrooms: 2,
			area: 1100,
			isOccupied: true,
			deviceIds: [],
			occupants: [
				{
					firstName: 'David',
					lastName: 'Rodriguez',
					email: 'david.rodriguez@email.com',
					phone: '(555) 333-4444',
				},
				{
					firstName: 'Maria',
					lastName: 'Rodriguez',
					email: 'maria.rodriguez@email.com',
					phone: '(555) 333-4445',
				},
				{
					firstName: 'Carlos',
					lastName: 'Rodriguez',
					email: 'carlos.rodriguez@email.com',
					phone: '(555) 333-4446',
				},
			],
			taskHistory: [
				{
					taskId: 'task-appliance-repair-1',
					date: '2026-01-12',
					title: 'Repaired oven heating element',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-plumbing-2b-2025',
					date: '2025-12-22',
					title: 'Fixed bathtub drain clog',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-electrical-2b-2025',
					date: '2025-11-30',
					title: 'Replaced ceiling fan in master bedroom',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-hvac-2b-2025',
					date: '2025-10-15',
					title: 'Replaced air filter and cleaned unit',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-flooring-2b-2025',
					date: '2025-09-08',
					title: 'Repaired loose tile in kitchen',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-general-2b-2025',
					date: '2025-08-25',
					title: 'Replaced window blinds',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-painting-2b-2025',
					date: '2025-07-18',
					title: 'Repainted living room walls',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-appliance-2b-2025',
					date: '2025-06-30',
					title: 'Serviced washing machine',
					status: 'Completed',
				},
			],
			propertyId: 'prop-residential-1',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		// Maple Ridge Townhomes units
		{
			id: 'unit-maple-101',
			name: '101',
			floor: 1,
			bedrooms: 3,
			bathrooms: 2,
			area: 1400,
			isOccupied: true,
			deviceIds: [],
			occupants: [
				{
					firstName: 'Jennifer',
					lastName: 'Williams',
					email: 'jennifer.williams@email.com',
					phone: '(555) 444-5555',
				},
				{
					firstName: 'Robert',
					lastName: 'Williams',
					email: 'robert.williams@email.com',
					phone: '(555) 444-5556',
				},
			],
			taskHistory: [
				{
					taskId: 'task-roofing-1',
					date: '2026-01-05',
					title: 'Repaired roof leak in master bedroom',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-plumbing-101-2025',
					date: '2025-12-14',
					title: 'Fixed kitchen sink leak',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-hvac-101-2025',
					date: '2025-11-20',
					title: 'Replaced furnace filter',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-electrical-101-2025',
					date: '2025-10-25',
					title: 'Installed new garage door opener',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-landscaping-101-2025',
					date: '2025-09-18',
					title: 'Trimmed trees and bushes',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-general-101-2025',
					date: '2025-08-12',
					title: 'Repaired deck railing',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-painting-101-2025',
					date: '2025-07-08',
					title: 'Exterior house painting',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-plumbing-101-2025-2',
					date: '2025-06-15',
					title: 'Serviced water heater',
					status: 'Completed',
				},
			],
			propertyId: 'prop-residential-2',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'unit-maple-102',
			name: '102',
			floor: 1,
			bedrooms: 2,
			bathrooms: 2,
			area: 1200,
			isOccupied: false,
			deviceIds: [],
			occupants: [],
			taskHistory: [
				{
					taskId: 'task-flooring-1',
					date: '2026-01-18',
					title: 'Replaced hardwood flooring in living room',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-electrical-102-2025',
					date: '2025-12-08',
					title: 'Replaced kitchen light fixture',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-plumbing-102-2025',
					date: '2025-11-12',
					title: 'Fixed toilet running constantly',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-hvac-102-2025',
					date: '2025-10-22',
					title: 'Cleaned and serviced HVAC system',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-general-102-2025',
					date: '2025-09-05',
					title: 'Repaired fence gate',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-painting-102-2025',
					date: '2025-08-20',
					title: 'Interior painting touch-ups',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-landscaping-102-2025',
					date: '2025-07-25',
					title: 'Mowed lawn and maintained landscaping',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-appliance-102-2025',
					date: '2025-06-28',
					title: 'Repaired dishwasher',
					status: 'Completed',
				},
			],
			propertyId: 'prop-residential-2',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		// Oakwood Estate (single family - no units, just the house itself)
		{
			id: 'unit-oakwood-main',
			name: 'Main House',
			floor: 1,
			bedrooms: 4,
			bathrooms: 3,
			area: 2800,
			isOccupied: true,
			deviceIds: [],
			occupants: [
				{
					firstName: 'Dr. James',
					lastName: 'Thompson',
					email: 'dr.thompson@email.com',
					phone: '(555) 666-7777',
				},
				{
					firstName: 'Dr. Emily',
					lastName: 'Thompson',
					email: 'emily.thompson@email.com',
					phone: '(555) 666-7778',
				},
				{
					firstName: 'Alex',
					lastName: 'Thompson',
					email: 'alex.thompson@email.com',
					phone: '(555) 666-7779',
				},
			],
			taskHistory: [
				{
					taskId: 'task-pool-maintenance-1',
					date: '2026-01-10',
					title: 'Serviced swimming pool equipment',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-roofing-oakwood-2025',
					date: '2025-12-20',
					title: 'Inspected and repaired roof shingles',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-hvac-oakwood-2025',
					date: '2025-11-15',
					title: 'Replaced central air filters',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-landscaping-oakwood-2025',
					date: '2025-10-30',
					title: 'Fall landscaping cleanup',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-electrical-oakwood-2025',
					date: '2025-09-22',
					title: 'Upgraded electrical panel',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-plumbing-oakwood-2025',
					date: '2025-08-18',
					title: 'Serviced water softener system',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-general-oakwood-2025',
					date: '2025-07-12',
					title: 'Repaired driveway cracks',
					status: 'Completed',
				},
				{
					taskId: 'maintenance-painting-oakwood-2025',
					date: '2025-06-25',
					title: 'Exterior house painting',
					status: 'Completed',
				},
			],
			propertyId: 'prop-single-1',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
	],

	suites: [
		// Downtown Business Center suites
		{
			id: 'suite-downtown-100',
			name: 'Suite 100',
			floor: 1,
			area: 1200,
			isOccupied: true,
			deviceIds: [],
			occupants: [
				{
					firstName: 'TechCorp',
					lastName: 'Solutions',
					email: 'info@techcorp.com',
					phone: '(555) 777-8888',
				},
			],
			taskHistory: [],
			propertyId: 'prop-commercial-1',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'suite-downtown-200',
			name: 'Suite 200',
			floor: 2,
			area: 1500,
			isOccupied: true,
			deviceIds: [],
			occupants: [
				{
					firstName: 'Design Studio',
					lastName: 'Pro',
					email: 'hello@designstudio.com',
					phone: '(555) 888-9999',
				},
			],
			taskHistory: [],
			propertyId: 'prop-commercial-1',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'suite-downtown-300',
			name: 'Suite 300',
			floor: 3,
			area: 800,
			isOccupied: false,
			deviceIds: [],
			occupants: [],
			taskHistory: [],
			propertyId: 'prop-commercial-1',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
	],

	teamGroups: [
		{
			id: 'team-group-maintenance',
			name: 'Maintenance Team',
			linkedProperties: [
				'prop-residential-1',
				'prop-residential-2',
				'prop-single-1',
				'prop-commercial-1',
			],
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'team-group-cleaning',
			name: 'Cleaning Services',
			linkedProperties: [
				'prop-residential-1',
				'prop-residential-2',
				'prop-commercial-1',
			],
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
	],

	teamMembers: [
		{
			id: 'team-member-1',
			firstName: 'John',
			lastName: 'Smith',
			title: 'Maintenance Lead',
			email: 'john.smith@maintenance.com',
			phone: '(555) 111-0001',
			role: 'Lead',
			address: '123 Maintenance St, Service City, SC 12345',
			groupId: 'team-group-maintenance',
		},
		{
			id: 'team-member-2',
			firstName: 'Maria',
			lastName: 'Garcia',
			title: 'HVAC Technician',
			email: 'maria.garcia@maintenance.com',
			phone: '(555) 111-0002',
			role: 'Technician',
			address: '456 Service Ave, Repair Town, RT 67890',
			groupId: 'team-group-maintenance',
		},
		{
			id: 'team-member-3',
			firstName: 'Carlos',
			lastName: 'Rodriguez',
			title: 'Plumber',
			email: 'carlos.rodriguez@maintenance.com',
			phone: '(555) 111-0003',
			role: 'Technician',
			address: '789 Fix-it Blvd, Tool City, TC 13579',
			groupId: 'team-group-maintenance',
		},
		{
			id: 'team-member-4',
			firstName: 'Anna',
			lastName: 'Johnson',
			title: 'Cleaning Supervisor',
			email: 'anna.johnson@cleaning.com',
			phone: '(555) 222-0001',
			role: 'Supervisor',
			address: '321 Clean St, Spotless City, SC 24680',
			groupId: 'team-group-cleaning',
		},
		{
			id: 'team-member-5',
			firstName: 'David',
			lastName: 'Lee',
			title: 'Cleaner',
			email: 'david.lee@cleaning.com',
			phone: '(555) 222-0002',
			role: 'Staff',
			address: '654 Shine Ave, Polish Town, PT 97531',
			groupId: 'team-group-cleaning',
		},
	],

	contractors: [
		{
			id: 'contractor-landscaping',
			name: 'John Smith', // Contact person name
			company: 'GreenThumb Landscaping', // Company name
			category: 'Landscaping',
			email: 'contact@greenthumb.com',
			phone: '(555) 333-0001',
			address: '987 Garden Way, Plant City, PC 86420',
			license: 'LAND-12345',
			insurance: 'INS-67890',
			notes: 'Specializes in commercial and residential landscaping',
			propertyId: 'prop-residential-1', // Associated with Sunset Gardens
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'contractor-painting',
			name: 'Sarah Johnson', // Contact person name
			company: 'ColorMasters Painting', // Company name
			category: 'Painting',
			email: 'info@colormasters.com',
			phone: '(555) 333-0002',
			address: '147 Paint Street, Brush City, BC 75319',
			license: 'PAINT-54321',
			insurance: 'INS-09876',
			notes: 'Interior and exterior painting services',
			propertyId: 'prop-residential-2', // Associated with Maple Ridge
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'contractor-electrical',
			name: 'Mike Davis', // Contact person name
			company: 'Spark Electric', // Company name
			category: 'Electrical',
			email: 'service@sparkelectric.com',
			phone: '(555) 333-0003',
			address: '258 Current Rd, Power Town, PT 36985',
			license: 'ELEC-13579',
			insurance: 'INS-24680',
			notes: 'Licensed electrical contractors for residential and commercial',
			propertyId: 'prop-commercial-1', // Associated with Downtown Business Center
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
	],

	tasks: [
		// Maintenance tasks
		{
			id: 'task-hvac-filter-1',
			title: 'Replace HVAC filters in Sunset Gardens',
			dueDate: '2026-02-15',
			status: 'Pending',
			property: 'Sunset Gardens Apartments',
			propertyId: 'prop-residential-1',
			notes:
				'Replace filters in all units. Schedule for early morning to minimize disruption.',
			assignedTo: 'team-member-2', // Maria Garcia - HVAC Technician
			devices: [],
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'task-plumbing-repair-1',
			title: 'Fix leaky faucet in 1A',
			dueDate: '2026-02-10',
			status: 'In Progress',
			property: 'Sunset Gardens Apartments',
			propertyId: 'prop-residential-1',
			unitId: 'unit-sunset-1a',
			notes:
				'Tenant reported drip in kitchen sink. Parts ordered and scheduled for tomorrow.',
			assignedTo: 'team-member-3', // Carlos Rodriguez - Plumber
			devices: [],
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'task-landscaping-1',
			title: 'Spring lawn maintenance',
			dueDate: '2026-03-01',
			status: 'Pending',
			property: 'Maple Ridge Townhomes',
			propertyId: 'prop-residential-2',
			notes: 'Aerate, fertilize, and reseed common areas. Weather dependent.',
			assignedTo: 'contractor-landscaping', // GreenThumb Landscaping
			devices: [],
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'task-painting-1',
			title: 'Touch up paint in hallway',
			dueDate: '2026-02-20',
			status: 'Completed',
			property: 'Oakwood Estate',
			propertyId: 'prop-single-1',
			completionDate: '2026-02-18',
			completedBy: 'contractor-painting',
			notes:
				'Minor scuffs and marks touched up. Used matching paint from previous job.',
			assignedTo: 'contractor-painting', // ColorMasters Painting
			devices: [],
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'task-cleaning-1',
			title: 'Deep clean vacant unit 2A',
			dueDate: '2026-02-12',
			status: 'Pending',
			property: 'Sunset Gardens Apartments',
			propertyId: 'prop-residential-1',
			unitId: 'unit-sunset-2a',
			notes:
				'Unit needs cleaning before new tenant move-in. Focus on kitchen and bathrooms.',
			assignedTo: 'team-member-4', // Anna Johnson - Cleaning Supervisor
			devices: [],
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'task-electrical-1',
			title: 'Install new lighting in lobby',
			dueDate: '2026-02-25',
			status: 'Pending',
			property: 'Downtown Business Center',
			propertyId: 'prop-commercial-1',
			notes:
				'Replace outdated fluorescent fixtures with LED lighting. Requires after-hours work.',
			assignedTo: 'contractor-electrical', // Spark Electric
			devices: [],
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'task-inspection-1',
			title: 'Quarterly fire safety inspection',
			dueDate: '2026-03-15',
			status: 'Pending',
			property: 'Sunset Gardens Apartments',
			propertyId: 'prop-residential-1',
			notes:
				'Annual fire safety inspection required by local ordinance. Check all extinguishers and alarms.',
			assignedTo: 'team-member-1', // John Smith - Maintenance Lead
			devices: [],
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'task-roof-repair-1',
			title: 'Repair roof leak in Suite 200',
			dueDate: '2026-02-08',
			status: 'In Progress',
			property: 'Downtown Business Center',
			propertyId: 'prop-commercial-1',
			suiteId: 'suite-downtown-200',
			notes:
				'Tenant reported water damage from recent rain. Need to patch and reseal.',
			assignedTo: 'team-member-1', // John Smith - Maintenance Lead
			devices: [],
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'task-garden-maintenance-1',
			title: 'Trim hedges and bushes',
			dueDate: '2026-02-22',
			status: 'Pending',
			property: 'Oakwood Estate',
			propertyId: 'prop-single-1',
			notes:
				'Spring trimming of landscaping. Focus on front yard visibility and curb appeal.',
			assignedTo: 'contractor-landscaping', // GreenThumb Landscaping
			devices: [],
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'task-cleaning-2',
			title: 'Regular office cleaning',
			dueDate: '2026-02-14',
			status: 'Pending',
			property: 'Downtown Business Center',
			propertyId: 'prop-commercial-1',
			notes: 'Weekly cleaning service for common areas and vacant suites.',
			assignedTo: 'team-member-5', // David Lee - Cleaner
			devices: [],
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
	],

	devices: [
		{
			id: 'device-hvac-sunset-1',
			name: 'HVAC Unit - Building A',
			type: 'HVAC',
			brand: 'Carrier',
			model: 'Infinity 24ANB6',
			location: 'Roof - Building A',
			propertyId: 'prop-residential-1',
			installDate: '2023-06-15',
			lastServiceDate: '2025-11-20',
			nextServiceDate: '2026-05-20',
			warrantyExpiration: '2028-06-15',
			notes: 'Central air conditioning and heating unit. 5-ton capacity.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-water-heater-maple',
			name: 'Water Heater - Building 1',
			type: 'Water Heater',
			brand: 'Rheem',
			model: 'PRO+G50-40N RH67',
			location: 'Basement - Building 1',
			propertyId: 'prop-residential-2',
			installDate: '2024-01-10',
			lastServiceDate: '2025-08-15',
			nextServiceDate: '2026-08-15',
			warrantyExpiration: '2029-01-10',
			notes: 'Tankless water heater serving all units in building 1.',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{
			id: 'device-security-oakwood',
			name: 'Security System',
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
	],
};

async function createMockDataForUser(userId) {
	console.log(`Creating comprehensive mock data for user ${userId}...`);

	const batch = db.batch();

	try {
		// Add property groups
		console.log('Adding property groups...');
		for (const group of mockData.propertyGroups) {
			const groupRef = db.collection('propertyGroups').doc(group.id);
			batch.set(groupRef, { ...group, userId });
		}

		// Add properties
		console.log('Adding properties...');
		for (const property of mockData.properties) {
			const propertyRef = db.collection('properties').doc(property.id);
			batch.set(propertyRef, { ...property, userId });
		}

		// Add units
		console.log('Adding units...');
		for (const unit of mockData.units) {
			const unitRef = db.collection('units').doc(unit.id);
			batch.set(unitRef, { ...unit, userId });
		}

		// Add suites
		console.log('Adding suites...');
		for (const suite of mockData.suites) {
			const suiteRef = db.collection('suites').doc(suite.id);
			batch.set(suiteRef, { ...suite, userId });
		}

		// Add team groups
		console.log('Adding team groups...');
		for (const teamGroup of mockData.teamGroups) {
			const teamGroupRef = db.collection('teamGroups').doc(teamGroup.id);
			batch.set(teamGroupRef, { ...teamGroup, userId });
		}

		// Add team members
		console.log('Adding team members...');
		for (const member of mockData.teamMembers) {
			const memberRef = db.collection('teamMembers').doc(member.id);
			batch.set(memberRef, { ...member, userId });
		}

		// Add contractors
		console.log('Adding contractors...');
		for (const contractor of mockData.contractors) {
			const contractorRef = db.collection('contractors').doc(contractor.id);
			batch.set(contractorRef, { ...contractor, userId });
		}

		// Add tasks
		console.log('Adding tasks...');
		for (const task of mockData.tasks) {
			const taskRef = db.collection('tasks').doc(task.id);
			batch.set(taskRef, { ...task, userId });
		}

		// Add devices
		console.log('Adding devices...');
		for (const device of mockData.devices) {
			const deviceRef = db.collection('devices').doc(device.id);
			batch.set(deviceRef, { ...device, userId });
		}

		// Commit all changes
		await batch.commit();
		console.log('✅ All mock data added successfully!');
	} catch (error) {
		console.error('❌ Error adding mock data:', error);
		throw error;
	}
}

async function findOrCreateUser() {
	console.log(`Looking for user with email: ${TARGET_EMAIL}`);

	try {
		// First, try to find existing user in Firestore
		const usersRef = db.collection('users');
		const userQuery = await usersRef.where('email', '==', TARGET_EMAIL).get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			console.log(`✅ Found existing user: ${userDoc.id}`);
			return userDoc.id;
		}

		// If not found in Firestore, check Firebase Auth
		console.log('User not found in Firestore, checking Firebase Auth...');
		try {
			const userRecord = await auth.getUserByEmail(TARGET_EMAIL);
			console.log(`✅ Found user in Firebase Auth: ${userRecord.uid}`);

			// Create user document in Firestore
			const userData = {
				...mockData.user,
				id: userRecord.uid,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			};

			await db.collection('users').doc(userRecord.uid).set(userData);
			console.log('✅ Created user document in Firestore');

			return userRecord.uid;
		} catch (authError) {
			// User doesn't exist in Auth either, create them
			console.log('User not found in Firebase Auth, creating new user...');

			const userRecord = await auth.createUser({
				email: TARGET_EMAIL,
				password: 'password123', // Default password
				displayName: `${mockData.user.firstName} ${mockData.user.lastName}`,
			});

			console.log(`✅ Created user in Firebase Auth: ${userRecord.uid}`);

			// Create user document in Firestore
			const userData = {
				...mockData.user,
				id: userRecord.uid,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			};

			await db.collection('users').doc(userRecord.uid).set(userData);
			console.log('✅ Created user document in Firestore');

			return userRecord.uid;
		}
	} catch (error) {
		console.error('❌ Error finding/creating user:', error);
		throw error;
	}
}

async function migratePropertyUser() {
	console.log(
		'🚀 Starting migration: Add comprehensive mock data for property@example.com',
	);

	try {
		// Find or create the user
		const userId = await findOrCreateUser();

		// Create all the mock data
		await createMockDataForUser(userId);

		console.log('\n🎉 Migration completed successfully!');
		console.log(`User: ${TARGET_EMAIL} (ID: ${userId})`);
		console.log('Created:');
		console.log(`  - ${mockData.propertyGroups.length} property groups`);
		console.log(`  - ${mockData.properties.length} properties`);
		console.log(`  - ${mockData.units.length} units`);
		console.log(`  - ${mockData.suites.length} suites`);
		console.log(`  - ${mockData.teamGroups.length} team groups`);
		console.log(`  - ${mockData.teamMembers.length} team members`);
		console.log(`  - ${mockData.contractors.length} contractors`);
		console.log(`  - ${mockData.tasks.length} tasks`);
		console.log(`  - ${mockData.devices.length} devices`);
	} catch (error) {
		console.error('❌ Migration failed:', error);
		process.exit(1);
	}
}

// Run migration
migratePropertyUser()
	.then(() => {
		console.log('\n✅ Migration script finished successfully');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n❌ Migration script failed:', error);
		process.exit(1);
	});
