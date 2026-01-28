import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Occupant {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
}

export interface Unit {
	name: string;
	occupants?: Occupant[];
	deviceIds?: string[]; // Firebase device IDs
	notes?: string;
}

export interface Suite {
	name: string;
	occupants?: Occupant[];
	deviceIds?: string[]; // Firebase device IDs
	notes?: string;
}

interface MaintenanceRecord {
	date: string;
	description: string;
	taskId?: string;
}

export interface Property {
	id: string; // Changed to string (Firebase)
	groupId?: string; // Added (Firebase)
	title: string;
	slug: string;
	image?: string;
	owner?: string;
	administrators?: string[];
	viewers?: string[];
	address?: string;
	propertyType?: 'Single Family' | 'Multi-Family' | 'Commercial';
	units?: Unit[]; // For multi-family properties
	hasSuites?: boolean; // For commercial properties
	suites?: Suite[]; // For commercial properties with multiple suites
	bedrooms?: number;
	bathrooms?: number;
	deviceIds?: string[]; // Changed to IDs instead of objects
	notes?: string;
	maintenanceHistory?: MaintenanceRecord[];
	taskHistory?: MaintenanceRecord[]; // Added (Firebase alias)
	isFavorite?: boolean;
	createdAt?: string; // Added (Firebase)
	updatedAt?: string; // Added (Firebase)
}

export interface PropertyGroup {
	id: string; // Changed to string (Firebase)
	userId?: string; // Added (Firebase)
	name: string;
	isEditingName?: boolean;
	properties: Property[];
	createdAt?: string; // Added (Firebase)
	updatedAt?: string; // Added (Firebase)
}

export interface CompletionFile {
	name: string;
	url: string;
	size: number;
	type: string;
	uploadedAt: string;
}

export interface Task {
	id: string; // Changed to string (Firebase)
	propertyId: string; // Added (Firebase)
	suiteId?: string; // Changed from suite string
	unitId?: string; // Changed from unit string
	devices?: string[]; // Changed to device IDs
	title: string;
	dueDate: string;
	status:
		| 'Pending'
		| 'In Progress'
		| 'Awaiting Approval'
		| 'Completed'
		| 'Rejected';
	property: string;
	notes?: string;
	assignee?: string; // Optional assignee user ID
	completionDate?: string;
	completionFile?: CompletionFile;
	completedBy?: string; // User ID who completed the task
	approvedBy?: string; // Admin/Lead ID who approved
	approvedAt?: string;
	rejectionReason?: string;
	createdAt?: string; // Added (Firebase)
	updatedAt?: string; // Added (Firebase)
}

export interface PropertyDataState {
	groups: PropertyGroup[];
	tasks: Task[];
}

const initialState: PropertyDataState = {
	groups: [
		{
			id: 'group-1',
			name: 'Downtown Properties',
			properties: [
				{
					id: 'prop-1',
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
									firstName: 'Emily',
									lastName: 'Brown',
									email: 'emily@test.com',
									phone: '(555) 678-9012',
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
						},
						{
							date: '2025-12-20',
							description: 'Plumbing inspection',
						},
					],
				},
				{
					id: 'prop-2',
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
						},
						{ date: '2025-11-05', description: 'HVAC service' },
					],
				},
			],
		},
		{
			id: 'group-2',
			name: 'Residential Homes',
			properties: [
				{
					id: 'prop-3',
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
					id: 'prop-4',
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
						},
						{
							date: '2025-12-01',
							description: 'Electrical system upgrade',
						},
					],
				},
			],
		},
	],
	tasks: [],
};

export const propertyDataSlice = createSlice({
	name: 'propertyData',
	initialState,
	reducers: {
		// Group actions
		addGroup: (state, action: PayloadAction<PropertyGroup>) => {
			state.groups.push(action.payload);
		},
		deleteGroup: (state, action: PayloadAction<string>) => {
			state.groups = state.groups.filter((g) => g.id !== action.payload);
		},
		updateGroupName: (
			state,
			action: PayloadAction<{ groupId: string; name: string }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				group.name = action.payload.name;
				group.isEditingName = false;
			}
		},
		toggleGroupEditName: (state, action: PayloadAction<string>) => {
			const group = state.groups.find((g) => g.id === action.payload);
			if (group) {
				group.isEditingName = !group.isEditingName;
			}
		},

		// Property actions
		addPropertyToGroup: (
			state,
			action: PayloadAction<{ groupId: string; property: Property }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				group.properties.push(action.payload.property);
			}
		},
		updateProperty: (
			state,
			action: PayloadAction<{ groupId: string; property: Property }>,
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
			action: PayloadAction<{ groupId: string; propertyId: string }>,
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
		deleteTask: (state, action: PayloadAction<string>) => {
			state.tasks = state.tasks.filter((t) => t.id !== action.payload);
		},
		deleteTasks: (state, action: PayloadAction<string[]>) => {
			state.tasks = state.tasks.filter((t) => !action.payload.includes(t.id));
		},

		// Task completion workflow
		submitTaskCompletion: (
			state,
			action: PayloadAction<{
				taskId: string;
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
				taskId: string;
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
				taskId: string;
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
