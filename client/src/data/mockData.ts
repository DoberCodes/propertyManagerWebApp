/**
 * Shared Mock Data
 *
 * Single source of truth for mock data used in:
 * - Redux slices (propertyDataSlice, teamSlice)
 * - Firebase seeding script (scripts/seedFirestore.js)
 *
 * Update this file to modify mock data across the entire app.
 */

export interface MockOccupant {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	leaseStart?: string;
	leaseEnd?: string;
	unit?: string; // Legacy field for backward compatibility
}

export interface MockUnit {
	id?: string;
	name: string;
	occupants: MockOccupant[];
	deviceIds?: string[];
}

export interface MockSuite {
	id?: string;
	name: string;
	occupants: MockOccupant[];
	deviceIds?: string[];
}

export interface MockMaintenanceRecord {
	date: string;
	description: string;
	deviceId?: number;
	unit?: string;
	suite?: string;
}

export interface MockProperty {
	id: number | string;
	title: string;
	slug: string;
	image: string;
	isFavorite: boolean;
	propertyType?: 'Single Family' | 'Multi-Family' | 'Commercial';
	owner: string;
	address: string;
	units?: MockUnit[];
	hasSuites?: boolean;
	suites?: MockSuite[];
	bedrooms?: number;
	bathrooms?: number;
	maintenanceHistory?: MockMaintenanceRecord[];
}

export interface MockPropertyGroup {
	id: number | string;
	name: string;
	properties: MockProperty[];
}

export interface MockTask {
	id: number | string;
	title: string;
	dueDate: string;
	status:
		| 'Pending'
		| 'In Progress'
		| 'Awaiting Approval'
		| 'Completed'
		| 'Rejected';
	property: string;
}

export interface MockTeamMember {
	id: number | string;
	firstName: string;
	lastName: string;
	title: string;
	email: string;
	phone: string;
	role: string;
	address: string;
	image?: string;
	notes: string;
	linkedProperties: (number | string)[];
	taskHistory: Array<{ date: string; task: string }>;
	files: Array<{ name: string; id: string }>;
}

export interface MockTeamGroup {
	id: number | string;
	name: string;
	isEditingName?: boolean;
	linkedProperties: (number | string)[];
	members: MockTeamMember[];
}

export interface MockDevice {
	id: string;
	type: string;
	brand: string;
	model: string;
	serialNumber: string;
	installationDate: string;
	location: {
		propertyId: string;
		unitId?: string;
		suiteId?: string;
	};
	status: 'Active' | 'Inactive' | 'Maintenance';
	maintenanceHistory: Array<{
		date: string;
		description: string;
	}>;
	notes: string;
}

// Mock Property Groups
export const mockPropertyGroups: MockPropertyGroup[] = [
	{
		id: 1,
		name: 'Downtown Properties',
		properties: [
			{
				id: 1,
				title: 'Downtown Apartments',
				slug: 'downtown-apartments',
				image: 'https://via.placeholder.com/300x200?text=Downtown+Apartments',
				isFavorite: false,
				propertyType: 'Multi-Family',
				owner: 'John Smith',
				address: '123 Main Street, Downtown District',
				units: [
					{
						name: 'Apt 5B',
						occupants: [
							{
								id: '7',
								firstName: 'Emily',
								lastName: 'Brown',
								email: 'emily@test.com',
								phone: '(555) 678-9012',
								unit: 'Apt 5B',
								leaseStart: '2025-06-01',
								leaseEnd: '2026-05-31',
							},
						],
					},
					{ name: 'Apt 3A', occupants: [] },
					{ name: 'Apt 4C', occupants: [] },
				],
				maintenanceHistory: [
					{
						date: '2026-01-15',
						description: 'HVAC filter replacement',
						deviceId: 1,
						unit: 'Apt 5B',
					},
					{
						date: '2025-12-20',
						description: 'Plumbing inspection',
						deviceId: 2,
						unit: 'Apt 3A',
					},
				],
			},
			{
				id: 2,
				title: 'Business Park',
				slug: 'business-park',
				image: 'https://via.placeholder.com/300x200?text=Business+Park',
				isFavorite: false,
				propertyType: 'Commercial',
				owner: 'Corporate Solutions Inc',
				address: '456 Commerce Avenue, Business District',
				hasSuites: true,
				suites: [
					{ name: 'Suite 100', occupants: [] },
					{ name: 'Suite 200', occupants: [] },
					{ name: 'Suite 300', occupants: [] },
				],
				maintenanceHistory: [
					{
						date: '2026-01-10',
						description: 'Roof maintenance',
						deviceId: 3,
					},
					{ date: '2025-11-05', description: 'HVAC service', deviceId: 3 },
				],
			},
		],
	},
	{
		id: 2,
		name: 'Residential Homes',
		properties: [
			{
				id: 3,
				title: 'Sunset Heights',
				slug: 'sunset-heights',
				image: 'https://via.placeholder.com/300x200?text=Sunset+Heights',
				isFavorite: false,
				propertyType: 'Single Family',
				owner: 'Sarah Johnson',
				address: '789 Hill Road, Residential Area',
				maintenanceHistory: [
					{ date: '2026-01-20', description: 'Gutter cleaning' },
					{ date: '2025-12-15', description: 'Exterior paint touch-up' },
					{ date: '2025-11-10', description: 'Roof repair' },
				],
			},
			{
				id: 4,
				title: 'Oak Street Complex',
				slug: 'oak-street-complex',
				image: 'https://via.placeholder.com/300x200?text=Oak+Street',
				isFavorite: false,
				propertyType: 'Multi-Family',
				owner: 'Property Group LLC',
				address: '321 Oak Street, Mixed Use Zone',
				units: [
					{ name: 'Unit A', occupants: [] },
					{ name: 'Unit B', occupants: [] },
					{ name: 'Unit C', occupants: [] },
					{ name: 'Unit D', occupants: [] },
				],
				maintenanceHistory: [
					{
						date: '2026-01-08',
						description: 'Foundation inspection',
						unit: 'Unit A',
					},
					{
						date: '2025-12-01',
						description: 'Electrical system upgrade',
						unit: 'Unit B',
					},
				],
			},
		],
	},
];

// Mock Tasks
export const mockTasks: MockTask[] = [
	{
		id: 1,
		title: 'Replace air filters',
		dueDate: '2026-02-01',
		status: 'In Progress',
		property: 'Downtown Apartments',
	},
	{
		id: 2,
		title: 'Quarterly maintenance inspection',
		dueDate: '2026-02-15',
		status: 'Pending',
		property: 'Downtown Apartments',
	},
	{
		id: 3,
		title: 'Parking lot sweeping',
		dueDate: '2026-01-28',
		status: 'Completed',
		property: 'Business Park',
	},
	{
		id: 4,
		title: 'Gutter cleaning',
		dueDate: '2026-02-10',
		status: 'Pending',
		property: 'Sunset Heights',
	},
];

// Mock Team Groups
export const mockTeamGroups: MockTeamGroup[] = [
	{
		id: 1,
		name: 'Maintenance Team',
		linkedProperties: [1, 2, 3, 4],
		members: [
			{
				id: 1,
				firstName: 'John',
				lastName: 'Doe',
				title: 'Maintenance Lead',
				email: 'john.doe@example.com',
				phone: '(555) 123-4567',
				role: 'Lead',
				address: '123 Worker St',
				image: '',
				notes: 'Experienced with HVAC systems',
				linkedProperties: [1, 2],
				taskHistory: [],
				files: [],
			},
			{
				id: 2,
				firstName: 'Jane',
				lastName: 'Smith',
				title: 'Plumber',
				email: 'jane.smith@example.com',
				phone: '(555) 987-6543',
				role: 'Technician',
				address: '456 Service Ave',
				image: '',
				notes: 'Licensed plumber',
				linkedProperties: [1, 3],
				taskHistory: [],
				files: [],
			},
			{
				id: 3,
				firstName: 'Mike',
				lastName: 'Johnson',
				title: 'Electrician',
				email: 'mike.j@example.com',
				phone: '(555) 456-7890',
				role: 'Technician',
				address: '789 Tech Blvd',
				image: '',
				notes: 'Certified electrician',
				linkedProperties: [2, 4],
				taskHistory: [],
				files: [],
			},
		],
	},
];

// Mock Devices
export const mockDevices: MockDevice[] = [
	{
		id: 'device-1',
		type: 'HVAC',
		brand: 'Carrier',
		model: 'Infinity 21',
		serialNumber: 'SN123456',
		installationDate: '2024-06-15',
		location: {
			propertyId: '1',
			unitId: '1',
		},
		status: 'Active',
		maintenanceHistory: [
			{
				date: '2026-01-15',
				description: 'Filter replacement',
			},
		],
		notes: 'Annual maintenance required',
	},
	{
		id: 'device-2',
		type: 'Plumbing',
		brand: 'Kohler',
		model: 'Water Heater Pro',
		serialNumber: 'SN789012',
		installationDate: '2023-03-20',
		location: {
			propertyId: '1',
			unitId: '2',
		},
		status: 'Active',
		maintenanceHistory: [
			{
				date: '2025-12-20',
				description: 'Inspection',
			},
		],
		notes: 'Check pressure valve quarterly',
	},
	{
		id: 'device-3',
		type: 'HVAC',
		brand: 'Trane',
		model: 'XR17',
		serialNumber: 'SN345678',
		installationDate: '2024-01-10',
		location: {
			propertyId: '2',
			suiteId: '1',
		},
		status: 'Active',
		maintenanceHistory: [],
		notes: 'Commercial grade unit',
	},
];
