import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Tenant {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	unit?: string;
	leaseStart?: string;
	leaseEnd?: string;
}

export interface Unit {
	name: string;
	tenants?: Tenant[];
	devices?: any[];
	notes?: string;
}

export interface Suite {
	name: string;
	tenants?: Tenant[];
	devices?: any[];
	notes?: string;
}

interface MaintenanceRecord {
	date: string;
	description: string;
	deviceId?: number;
	unit?: string;
	suite?: string;
}

export interface Property {
	id: number;
	title: string;
	slug: string;
	image?: string;
	owner?: string;
	administrators?: string[];
	viewers?: string[];
	address?: string;
	propertyType?: 'Single Family' | 'Multi-Family' | 'Commercial';
	units?: Unit[]; // For multi-family properties - now an array of Unit objects
	hasSuites?: boolean; // For commercial properties - indicates if building has multiple suites
	suites?: Suite[]; // For commercial properties with multiple suites
	bedrooms?: number;
	bathrooms?: number;
	devices?: any[];
	notes?: string;
	maintenanceHistory?: MaintenanceRecord[];
	isFavorite?: boolean;
	tenants?: Tenant[]; // For Single Family and Commercial properties (single suite/single business)
}

export interface PropertyGroup {
	id: number;
	name: string;
	isEditingName?: boolean;
	properties: Property[];
}

export interface CompletionFile {
	name: string;
	url: string;
	size: number;
	type: string;
	uploadedAt: string;
}

export interface Task {
	id: number;
	title: string;
	dueDate: string;
	status:
		| 'Pending'
		| 'In Progress'
		| 'Awaiting Approval'
		| 'Completed'
		| 'Rejected';
	property: string;
	unit?: string;
	suite?: string;
	notes?: string;
	assignee?: string; // User ID or name of assigned team member
	completionDate?: string;
	completionFile?: CompletionFile;
	completedBy?: string; // User ID who completed the task
	approvedBy?: string; // Admin/Lead ID who approved
	approvedAt?: string;
	rejectionReason?: string;
}

export interface PropertyDataState {
	groups: PropertyGroup[];
	tasks: Task[];
}

const initialState: PropertyDataState = {
	groups: [
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
							tenants: [
								{
									id: 7,
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
						{ name: 'Apt 3A', tenants: [] },
						{ name: 'Apt 4C', tenants: [] },
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
						{ name: 'Suite 100', tenants: [] },
						{ name: 'Suite 200', tenants: [] },
						{ name: 'Suite 300', tenants: [] },
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
						{ name: 'Unit A', tenants: [] },
						{ name: 'Unit B', tenants: [] },
						{ name: 'Unit C', tenants: [] },
						{ name: 'Unit D', tenants: [] },
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
	],
	tasks: [
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
	],
};

export const propertyDataSlice = createSlice({
	name: 'propertyData',
	initialState,
	reducers: {
		// Group actions
		addGroup: (state, action: PayloadAction<PropertyGroup>) => {
			state.groups.push(action.payload);
		},
		deleteGroup: (state, action: PayloadAction<number>) => {
			state.groups = state.groups.filter((g) => g.id !== action.payload);
		},
		updateGroupName: (
			state,
			action: PayloadAction<{ groupId: number; name: string }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				group.name = action.payload.name;
				group.isEditingName = false;
			}
		},
		toggleGroupEditName: (state, action: PayloadAction<number>) => {
			const group = state.groups.find((g) => g.id === action.payload);
			if (group) {
				group.isEditingName = !group.isEditingName;
			}
		},

		// Property actions
		addPropertyToGroup: (
			state,
			action: PayloadAction<{ groupId: number; property: Property }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				group.properties.push(action.payload.property);
			}
		},
		updateProperty: (
			state,
			action: PayloadAction<{ groupId: number; property: Property }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				const propIndex = group.properties.findIndex(
					(p) => p.id === action.payload.property.id,
				);
				if (propIndex >= 0) {
					group.properties[propIndex] = action.payload.property;
				}
			}
		},
		deleteProperty: (
			state,
			action: PayloadAction<{ groupId: number; propertyId: number }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				group.properties = group.properties.filter(
					(p) => p.id !== action.payload.propertyId,
				);
			}
		},

		// Task actions
		addTask: (state, action: PayloadAction<Task>) => {
			state.tasks.push(action.payload);
		},
		updateTask: (state, action: PayloadAction<Task>) => {
			const taskIndex = state.tasks.findIndex(
				(t) => t.id === action.payload.id,
			);
			if (taskIndex >= 0) {
				state.tasks[taskIndex] = action.payload;
			}
		},
		deleteTask: (state, action: PayloadAction<number>) => {
			state.tasks = state.tasks.filter((t) => t.id !== action.payload);
		},
		deleteTasks: (state, action: PayloadAction<number[]>) => {
			state.tasks = state.tasks.filter((t) => !action.payload.includes(t.id));
		},

		// Task completion workflow
		submitTaskCompletion: (
			state,
			action: PayloadAction<{
				taskId: number;
				completionDate: string;
				completionFile: CompletionFile;
				completedBy: string;
			}>,
		) => {
			const task = state.tasks.find((t) => t.id === action.payload.taskId);
			if (task) {
				task.status = 'Awaiting Approval';
				task.completionDate = action.payload.completionDate;
				task.completionFile = action.payload.completionFile;
				task.completedBy = action.payload.completedBy;
				task.rejectionReason = undefined; // Clear any previous rejection
			}
		},
		approveTaskCompletion: (
			state,
			action: PayloadAction<{
				taskId: number;
				approvedBy: string;
				approvedAt: string;
			}>,
		) => {
			const task = state.tasks.find((t) => t.id === action.payload.taskId);
			if (task) {
				task.status = 'Completed';
				task.approvedBy = action.payload.approvedBy;
				task.approvedAt = action.payload.approvedAt;
			}
		},
		rejectTaskCompletion: (
			state,
			action: PayloadAction<{
				taskId: number;
				rejectionReason: string;
			}>,
		) => {
			const task = state.tasks.find((t) => t.id === action.payload.taskId);
			if (task) {
				task.status = 'Rejected';
				task.rejectionReason = action.payload.rejectionReason;
				// Keep completion data for reference
			}
		},
	},
});

export const {
	addGroup,
	deleteGroup,
	updateGroupName,
	toggleGroupEditName,
	addPropertyToGroup,
	updateProperty,
	deleteProperty,
	addTask,
	updateTask,
	deleteTask,
	deleteTasks,
	submitTaskCompletion,
	approveTaskCompletion,
	rejectTaskCompletion,
} = propertyDataSlice.actions;

export default propertyDataSlice.reducer;
