import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Property types for Redux cache
export interface Property {
	id: string;
	groupId: string;
	userId?: string;
	title: string;
	slug: string;
	image?: string;
	owner?: string;
	administrators?: string[];
	viewers?: string[];
	address?: string;
	propertyType?: 'Single Family' | 'Multi-Family' | 'Commercial';
	bedrooms?: number;
	bathrooms?: number;
	units?: Array<{ name: string; occupants?: any[]; deviceIds?: string[] }>;
	hasSuites?: boolean;
	suites?: Array<{ name: string; occupants?: any[]; deviceIds?: string[] }>;
	deviceIds?: string[];
	notes?: string;
	taskHistory?: Array<{ date: string; description: string }>;
	maintenanceHistory?: Array<{ date: string; description: string }>;
	isFavorite?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface PropertyGroup {
	id: string;
	userId?: string;
	name: string;
	isEditingName?: boolean;
	properties?: Property[];
	createdAt?: string;
	updatedAt?: string;
}

export interface Task {
	id: string;
	userId?: string;
	propertyId: string;
	suiteId?: string;
	unitId?: string;
	devices?: string[];
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
	assignedTo?: {
		id: string;
		name: string;
		email?: string;
	};
	completionDate?: string;
	completionFile?: CompletionFile;
	completedBy?: string;
	approvedBy?: string;
	approvedAt?: string;
	rejectionReason?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface CompletionFile {
	name: string;
	url: string;
	size: number;
	type: string;
	uploadedAt: string;
}

interface PropertyDataState {
	groups: PropertyGroup[];
	tasks: Task[];
}

const initialState: PropertyDataState = {
	groups: [],
	tasks: [],
};

const propertyDataSlice = createSlice({
	name: 'propertyData',
	initialState,
	reducers: {
		setPropertyGroups: (state, action: PayloadAction<PropertyGroup[]>) => {
			state.groups = action.payload;
		},
		addPropertyGroup: (state, action: PayloadAction<PropertyGroup>) => {
			state.groups.push(action.payload);
		},
		updatePropertyGroup: (state, action: PayloadAction<PropertyGroup>) => {
			const index = state.groups.findIndex((g) => g.id === action.payload.id);
			if (index !== -1) {
				state.groups[index] = action.payload;
			}
		},
		deletePropertyGroup: (state, action: PayloadAction<string>) => {
			state.groups = state.groups.filter((g) => g.id !== action.payload);
		},
		setTasks: (state, action: PayloadAction<Task[]>) => {
			state.tasks = action.payload;
		},
		addTask: (state, action: PayloadAction<Task>) => {
			state.tasks.push(action.payload);
		},
		updateTask: (state, action: PayloadAction<Task>) => {
			const index = state.tasks.findIndex((t) => t.id === action.payload.id);
			if (index !== -1) {
				state.tasks[index] = action.payload;
			}
		},
		deleteTask: (state, action: PayloadAction<string>) => {
			state.tasks = state.tasks.filter((t) => t.id !== action.payload);
		},
		submitTaskCompletion: (
			state,
			action: PayloadAction<{
				taskId: string;
				completionDate: string;
				completionFile?: CompletionFile;
				completedBy: string;
			}>,
		) => {
			const task = state.tasks.find((t) => t.id === action.payload.taskId);
			if (task) {
				task.status = 'Awaiting Approval';
				task.completionDate = action.payload.completionDate;
				task.completionFile = action.payload.completionFile;
				task.completedBy = action.payload.completedBy;
			}
		},
		approveTaskCompletion: (
			state,
			action: PayloadAction<{ taskId: string; approvedBy: string }>,
		) => {
			const task = state.tasks.find((t) => t.id === action.payload.taskId);
			if (task) {
				task.status = 'Completed';
				task.approvedBy = action.payload.approvedBy;
				task.approvedAt = new Date().toISOString();
			}
		},
		rejectTaskCompletion: (
			state,
			action: PayloadAction<{
				taskId: string;
				rejectionReason: string;
				approvedBy?: string;
			}>,
		) => {
			const task = state.tasks.find((t) => t.id === action.payload.taskId);
			if (task) {
				task.status = 'In Progress';
				task.rejectionReason = action.payload.rejectionReason;
				task.completionDate = undefined;
				task.completionFile = undefined;
			}
		},
	},
});

export const {
	setPropertyGroups,
	addPropertyGroup,
	updatePropertyGroup,
	deletePropertyGroup,
	setTasks,
	addTask,
	updateTask,
	deleteTask,
	submitTaskCompletion,
	approveTaskCompletion,
	rejectTaskCompletion,
} = propertyDataSlice.actions;

export default propertyDataSlice.reducer;
