import { Task } from 'types/Task.types';

/*export interface Task {
    id: string;
    userId: string; // Owner of the task
    propertyId: string;
    enableNotifications?: boolean;
    notifications?: TaskNotification[];
    suiteId?: string; // Optional: for tasks specific to a suite
    unitId?: string; // Optional: for tasks specific to a unit
    devices?: string[]; // Optional: device IDs related to this task
    title: string;
    dueDate: string;
    status:
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
    assignee?: string;
    assignedTo?: {
        id: string;
        name: string;
        email?: string;
    }; // Assignee object
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
    maintenanceGroupId?: string;
    createdAt?: string;
    updatedAt?: string;
} */

export const baselineTasks: Task[] = [
	{
		title: 'Smoke and CO Detectors',
		description:
			'Test each detector and replace batteries if needed. Consider checking placement according to manufacturer recommendations.',
		dueDate: '',
		priority: 'High',
		status: 'Pending',
		notes:
			'Suggested frequency: monthly. Seasonal context: fall/winter. Always follow manufacturer instructions.',
		id: '',
		userId: '',
		propertyId: '',
		property: '',
	},
	{
		title: 'HVAC Filters',
		description:
			'Check and replace filters according to manufacturer recommendations.',
		dueDate: '',
		priority: 'Medium',
		status: 'Pending',
		notes:
			'Suggested frequency: every 3 months. Seasonal context: spring/fall. Follow manufacturer guidance.',
		id: '',
		userId: '',
		propertyId: '',
		property: '',
	},
	{
		title: 'Plumbing Inspection',
		description: 'Look under sinks and around toilets for leaks or drips.',
		dueDate: '',
		priority: 'Medium',
		status: 'Pending',
		notes:
			'Suggested frequency: quarterly. Check before and after seasonal temperature changes.',
		id: '',
		userId: '',
		propertyId: '',
		property: '',
	},
	{
		title: 'Roof & Gutters',
		description:
			'Inspect for debris, damage, or leaks; clean gutters if needed.',
		dueDate: '',
		priority: 'Medium',
		status: 'Pending',
		notes:
			'Suggested frequency: twice per year. Seasonal context: spring/fall.',
		id: '',
		userId: '',
		propertyId: '',
		property: '',
	},
	{
		title: 'Water Heater',
		description: 'Check for leaks, corrosion, and proper temperature settings.',
		dueDate: '',
		priority: 'Medium',
		status: 'Pending',
		notes:
			'Suggested frequency: yearly. Follow manufacturer instructions for maintenance.',
		id: '',
		userId: '',
		propertyId: '',
		property: '',
	},
	{
		title: 'Electrical Safety',
		description: 'Test GFCI outlets and inspect for frayed wires.',
		dueDate: '',
		priority: 'Medium',
		status: 'Pending',
		notes:
			'Suggested frequency: yearly. Seasonal context: winter safety check.',
		id: '',
		userId: '',
		propertyId: '',
		property: '',
	},
	{
		title: 'Insulation & Weatherproofing',
		description:
			'Check seals around doors/windows; inspect attic or crawlspace insulation.',
		dueDate: '',
		priority: 'Medium',
		status: 'Pending',
		notes:
			'Suggested frequency: yearly. Seasonal context: winter and summer energy efficiency check.',
		id: '',
		userId: '',
		propertyId: '',
		property: '',
	},
	{
		title: 'Equipment Maintenance',
		description:
			'Check that key equipment, such as stove, fridge, washer/dryer, and home systems, is operating correctly.',
		dueDate: '',
		priority: 'Low',
		status: 'Pending',
		notes: 'Suggested frequency: yearly. Inspect before high-use seasons.',
		id: '',
		userId: '',
		propertyId: '',
		property: '',
	},
	{
		title: 'Fire Extinguishers',
		description:
			'Ensure they’re charged, accessible, and in working condition.',
		dueDate: '',
		priority: 'Medium',
		status: 'Pending',
		notes:
			'Suggested frequency: yearly. Check accessibility and charge before winter season.',
		id: '',
		userId: '',
		propertyId: '',
		property: '',
	},
	{
		title: 'Exterior Safety',
		description:
			'Inspect deck, stairs, and handrails; trim overhanging tree branches near the home.',
		dueDate: '',
		priority: 'Low',
		status: 'Pending',
		notes:
			'Suggested frequency: twice per year. Seasonal context: spring/fall exterior safety check.',
		id: '',
		userId: '',
		propertyId: '',
		property: '',
	},
];
