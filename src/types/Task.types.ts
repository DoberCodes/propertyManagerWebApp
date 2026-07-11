/**
 * Task-related types for the application
 * Centralized domain-specific type definitions
 */

// Redux Task statuses (as defined in Redux store)
export type ReduxTaskStatus =
	| 'Initiated'
	| 'Pending'
	| 'In Progress'
	| 'Awaiting Approval'
	| 'Completed'
	| 'Rejected'
	| 'Overdue'
	| 'Hold';

// Task recurrence frequency types
export type RecurrenceFrequency =
	| 'daily'
	| 'weekly'
	| 'biweekly'
	| 'monthly'
	| 'quarterly'
	| 'yearly'
	| 'custom';

// Custom recurrence unit types (for 'custom' frequency)
export type RecurrenceCustomUnit = 'days' | 'weeks' | 'months' | 'years';

// Extended task statuses used throughout the app
export type TaskStatus =
	| 'Initiated'
	| 'Pending'
	| 'In Progress'
	| 'Awaiting Approval'
	| 'Completed'
	| 'Rejected'
	| 'Overdue'
	| 'Hold';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

// Task notification types
export type TaskNotificationType = 'reminder' | 'overdue';

export interface TaskNotification {
	id: string;
	type: TaskNotificationType;
	daysBeforeDue?: number; // For reminder notifications (negative for after due date)
	enabled: boolean;
	customMessage?: string;
}

export interface TaskAssigneeSnapshot {
	id: string;
	name: string;
	email?: string;
	type?: 'user' | 'team_member' | 'family_member' | 'contractor' | 'unknown';
}

export interface CostBreakdown {
	contractorCost?: number;
	materialsCost?: number;
	laborCost?: number;
	otherCost?: number;
}

export interface TaskFinancials {
	currency?: string;
	estimatedCost?: number;
	actualCost?: number;
	estimate?: CostBreakdown;
	actual?: CostBreakdown;
	notes?: string;
}

export interface Task {
	id: string;
	userId: string; // Owner of the task
	propertyId: string;
	requiresWorkOrder?: boolean;
	category?: string;
	location?: string;
	enableNotifications?: boolean;
	notifications?: TaskNotification[];
	description?: string;
	suiteId?: string; // Optional: for tasks specific to a suite
	unitId?: string; // Optional: for tasks specific to a unit
	devices?: string[]; // Optional: device IDs related to this task
	title: string;
	dueDate: string;
	status:
		| 'Initiated'
		| 'Pending'
		| 'In Progress'
		| 'Awaiting Approval'
		| 'Completed'
		| 'Rejected'
		| 'Overdue'
		| 'Hold';
	property: string;
	propertyTitle?: string; // Optional: denormalized property title for easier access
	notes?: string;
	priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
	assignee?: string; // Assignee record ID used as an internal reference
	assignedTo?: TaskAssigneeSnapshot | null; // Saved display snapshot retained if access is removed
	assigneeName?: string; // Legacy denormalized display-name compatibility
	assigneeFirstName?: string;
	assigneeLastName?: string;
	assigneeEmail?: string;
	// Recurring task fields
	isRecurring?: boolean;
	recurrenceFrequency?:
		| 'daily'
		| 'weekly'
		| 'biweekly'
		| 'monthly'
		| 'quarterly'
		| 'yearly'
		| 'custom';
	recurrenceInterval?: number;
	recurrenceCustomUnit?: 'days' | 'weeks' | 'months' | 'years';
	parentTaskId?: string;
	lastRecurrenceDate?: string;
	completionDate?: string;
	completionFile?: CompletionFile;
	completedBy?: string; // User ID who completed the task
	approvedBy?: string; // Admin/Lead ID who approved
	approvedAt?: string;
	rejectionReason?: string;
	completionNotes?: string;
	financials?: TaskFinancials;
	maintenanceGroupId?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface CompletionFile {
	name: string;
	size: number;
	type: string;
	url: string;
	uploadedAt: string;
}

export interface TaskFormData {
	title: string;
	dueDate: string;
	status: TaskStatus;
	requiresWorkOrder?: boolean;
	notes: string;
	category?: string;
	location?: string;
	priority?: TaskPriority;
	assignee?: string;
	assignedTo?: string;
	devices?: string[];
	isRecurring?: boolean;
	recurrenceFrequency?: RecurrenceFrequency;
	recurrenceInterval?: number;
	recurrenceCustomUnit?: RecurrenceCustomUnit;
	enableNotifications?: boolean;
	notifications?: TaskNotification[];
	maintenanceGroupId?: string;
	financials?: TaskFinancials;
}

export interface TaskHandlers {
	selectedTasks: string[];
	setSelectedTasks: (tasks: string[]) => void;
	showTaskDialog: boolean;
	setShowTaskDialog: (show: boolean) => void;
	editingTaskId: string | null;
	setEditingTaskId: (id: string | null) => void;
	showTaskAssignDialog: boolean;
	setShowTaskAssignDialog: (show: boolean) => void;
	assigningTaskId: string | null;
	setAssigningTaskId: (id: string | null) => void;
	selectedAssignee: any;
	setSelectedAssignee: (assignee: any) => void;
	showTaskCompletionModal: boolean;
	setShowTaskCompletionModal: (show: boolean) => void;
	completingTaskId: string | null;
	setCompletingTaskId: (id: string | null) => void;
	handleTaskCheckbox: (taskId: string) => void;
	handleCreateTask: () => void;
	handleEditTask: (task: any) => void;
	handleDeleteTask: () => void;
	handleAssignTask: (taskId?: string) => void;
	handleCompleteTask: () => void;
	handleTaskCompletionSuccess: () => void;
	confirmDeleteTask: () => void;
}

export interface TaskData {
	title: string;
	dueDate: string;
	status: ReduxTaskStatus;
	assignee?: string;
	notes: string;
	priority: string;
	devices?: string[];
}
