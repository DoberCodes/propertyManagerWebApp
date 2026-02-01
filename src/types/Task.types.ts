/**
 * Task-related types for the application
 * Centralized domain-specific type definitions
 */

// Redux Task statuses (as defined in Redux store)
export type ReduxTaskStatus =
	| 'Pending'
	| 'In Progress'
	| 'Awaiting Approval'
	| 'Completed'
	| 'Rejected';

// Extended task statuses used throughout the app
export type TaskStatus =
	| 'Pending'
	| 'In Progress'
	| 'Awaiting Approval'
	| 'Completed'
	| 'Overdue'
	| 'Hold';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
	id: string;
	userId?: string;
	propertyId: string;
	suiteId?: string;
	unitId?: string;
	devices?: string[];
	title: string;
	dueDate: string;
	status: ReduxTaskStatus;
	priority?: TaskPriority;
	assignee?: string;
	assigneeEmail?: string;
	assigneeFirstName?: string;
	assigneeLastName?: string;
	submittedBy?: string;
	submittedByEmail?: string;
	notes?: string;
	createdAt?: string;
	updatedAt?: string;
	completionFiles?: CompletionFile[];
	completionNotes?: string;
	completionDate?: string;
	property?: string;
	completionFile?: CompletionFile;
	completedBy?: string;
	approvedBy?: string;
	approvedAt?: string;
	rejectionReason?: string;
}

export interface CompletionFile {
	name: string;
	size: number;
	type: string;
	url: string;
	base64Data?: string;
	uploadedAt: string;
}

export interface TaskFormData {
	title: string;
	dueDate: string;
	status: TaskStatus;
	notes: string;
	priority?: TaskPriority;
	assignee?: string;
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
	taskFormData: TaskFormData;
	setTaskFormData: (data: TaskFormData) => void;
	handleTaskCheckbox: (taskId: string) => void;
	handleCreateTask: () => void;
	handleEditTask: () => void;
	handleDeleteTask: () => void;
	handleAssignTask: () => void;
	handleCompleteTask: () => void;
	handleTaskFormChange: (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => void;
	handleTaskCompletionSuccess: () => void;
}

export interface TaskData {
	title: string;
	dueDate: string;
	status: ReduxTaskStatus;
	assignee?: string;
	notes: string;
	priority: string;
}
