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
	groups: [],
	tasks: [],
};

export const propertyDataSlice = createSlice({
	name: 'propertyData',
	initialState,
	reducers: {
		// Cache actions - called when API data is fetched
		setPropertyGroups: (state, action: PayloadAction<PropertyGroup[]>) => {
			state.groups = action.payload;
		},
		setTasks: (state, action: PayloadAction<Task[]>) => {
			state.tasks = action.payload;
		},

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
	setPropertyGroups,
	setTasks,
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
