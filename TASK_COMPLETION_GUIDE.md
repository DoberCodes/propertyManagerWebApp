# Task Completion Feature Documentation

## Overview

This feature enables users to mark tasks as complete by uploading a file (work order, maintenance form, etc.) and specifying a completion date. The completed task is then sent to an admin or maintenance lead for final approval.

## Architecture

### Task Status Flow

```
Pending → In Progress → Awaiting Approval → Completed
                              ↓
                          Rejected → [User can resubmit]
```

### Data Structure

#### Task Interface (Updated)

```typescript
export interface CompletionFile {
	name: string;
	url: string;
	size: number;
	type: string;
	uploadedAt: string;
}

export interface Task {
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
	notes?: string;
	completionDate?: string;
	completionFile?: CompletionFile;
	completedBy?: string; // User ID who completed the task
	approvedBy?: string; // Admin/Lead ID who approved
	approvedAt?: string;
	rejectionReason?: string;
}
```

## Components

### 1. TaskCompletionModal

**Purpose**: Allows users to submit task completion with required file upload and date.

**Location**: `client/src/Components/Library/TaskCompletionModal/`

**Props**:

```typescript
interface TaskCompletionModalProps {
	taskId: number;
	taskTitle: string;
	onClose: () => void;
	onSuccess?: () => void;
	userId: string; // Current user's ID
}
```

**Usage Example**:

```tsx
import { TaskCompletionModal } from '../Components/Library/TaskCompletionModal';

function TaskList() {
	const [showCompletionModal, setShowCompletionModal] = useState(false);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const userId = 'current-user-id'; // Get from auth context

	const handleMarkComplete = (task: Task) => {
		setSelectedTask(task);
		setShowCompletionModal(true);
	};

	return (
		<>
			{/* Task list UI */}
			<button onClick={() => handleMarkComplete(task)}>Mark as Complete</button>

			{showCompletionModal && selectedTask && (
				<TaskCompletionModal
					taskId={selectedTask.id}
					taskTitle={selectedTask.title}
					userId={userId}
					onClose={() => setShowCompletionModal(false)}
					onSuccess={() => {
						console.log('Task completion submitted!');
						// Optionally refresh task list
					}}
				/>
			)}
		</>
	);
}
```

**Features**:

- ✅ Required completion date (cannot be in the future)
- ✅ Required file upload (PDF, images, Word documents)
- ✅ File validation (max 10MB, specific file types)
- ✅ Upload to Firebase Storage
- ✅ Submit to Redux and optionally Firebase
- ✅ Error handling and validation messages

### 2. TaskApprovalModal

**Purpose**: Allows admins/maintenance leads to review and approve/reject task completions.

**Location**: `client/src/Components/Library/TaskApprovalModal/`

**Props**:

```typescript
interface TaskApprovalModalProps {
	taskId: number;
	taskTitle: string;
	taskProperty: string;
	completionDate: string;
	completionFile: CompletionFile;
	completedBy: string;
	onClose: () => void;
	onSuccess?: () => void;
	adminId: string; // Current admin's ID
}
```

**Usage Example**:

```tsx
import { TaskApprovalModal } from '../Components/Library/TaskApprovalModal';

function AdminTaskReview() {
	const [showApprovalModal, setShowApprovalModal] = useState(false);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const adminId = 'current-admin-id'; // Get from auth context

	// Get tasks awaiting approval
	const tasksToReview = tasks.filter((t) => t.status === 'Awaiting Approval');

	const handleReviewTask = (task: Task) => {
		setSelectedTask(task);
		setShowApprovalModal(true);
	};

	return (
		<>
			{tasksToReview.map((task) => (
				<div key={task.id}>
					<h3>{task.title}</h3>
					<button onClick={() => handleReviewTask(task)}>
						Review Completion
					</button>
				</div>
			))}

			{showApprovalModal && selectedTask && (
				<TaskApprovalModal
					taskId={selectedTask.id}
					taskTitle={selectedTask.title}
					taskProperty={selectedTask.property}
					completionDate={selectedTask.completionDate!}
					completionFile={selectedTask.completionFile!}
					completedBy={selectedTask.completedBy!}
					adminId={adminId}
					onClose={() => setShowApprovalModal(false)}
					onSuccess={() => {
						console.log('Task reviewed!');
						// Refresh task list
					}}
				/>
			)}
		</>
	);
}
```

**Features**:

- ✅ View task completion details
- ✅ View and download uploaded file
- ✅ Approve task (marks as Completed)
- ✅ Reject task with required reason
- ✅ Updates Redux and optionally Firebase
- ✅ Sends notifications (TODO: implement)

## Redux Actions

### propertyDataSlice Actions

```typescript
// Submit task completion (user action)
dispatch(
	submitTaskCompletion({
		taskId: 123,
		completionDate: '2026-01-25',
		completionFile: {
			name: 'work-order.pdf',
			url: 'https://firebase-storage-url.com/...',
			size: 245678,
			type: 'application/pdf',
			uploadedAt: '2026-01-25T10:30:00Z',
		},
		completedBy: 'user-123',
	}),
);

// Approve task (admin action)
dispatch(
	approveTaskCompletion({
		taskId: 123,
		approvedBy: 'admin-456',
		approvedAt: '2026-01-25T14:30:00Z',
	}),
);

// Reject task (admin action)
dispatch(
	rejectTaskCompletion({
		taskId: 123,
		rejectionReason:
			'Work order is incomplete. Please include maintenance details.',
	}),
);
```

## Firebase API Endpoints

### 1. Upload Task Completion File

```typescript
import { useUploadTaskCompletionFileMutation } from '../Redux/API/apiSlice';

const [uploadFile, { isLoading, error }] =
	useUploadTaskCompletionFileMutation();

const result = await uploadFile({
	taskId: '123',
	file: fileObject, // File object from input
}).unwrap();

// Returns: CompletionFile object with download URL
```

### 2. Submit Task Completion

```typescript
import { useSubmitTaskCompletionMutation } from '../Redux/API/apiSlice';

const [submitCompletion] = useSubmitTaskCompletionMutation();

await submitCompletion({
	taskId: '123',
	completionDate: '2026-01-25',
	completionFile: completionFileData,
	completedBy: 'user-123',
}).unwrap();
```

### 3. Approve Task

```typescript
import { useApproveTaskMutation } from '../Redux/API/apiSlice';

const [approveTask] = useApproveTaskMutation();

await approveTask({
	taskId: '123',
	approvedBy: 'admin-456',
}).unwrap();
```

### 4. Reject Task

```typescript
import { useRejectTaskMutation } from '../Redux/API/apiSlice';

const [rejectTask] = useRejectTaskMutation();

await rejectTask({
	taskId: '123',
	rejectionReason: 'Please provide more detail',
}).unwrap();
```

## Firebase Storage Structure

Files are stored in Firebase Storage with the following structure:

```
task-completions/
  └── {taskId}/
      └── {timestamp}_{originalFileName}
```

Example:

```
task-completions/
  └── 123/
      ├── 1737804000000_work-order.pdf
      └── 1737890400000_maintenance-report.pdf
```

## Validation Rules

### File Upload

- **Allowed Types**: PDF, JPG, JPEG, PNG, DOC, DOCX
- **Max Size**: 10MB
- **Required**: Yes (cannot submit without file)

### Completion Date

- **Format**: YYYY-MM-DD
- **Required**: Yes
- **Validation**: Cannot be in the future
- **Max Date**: Today

### Rejection Reason

- **Required**: Yes (when rejecting)
- **Min Length**: 1 character (after trim)
- **Display**: Shown to user who submitted

## Integration with Existing Components

### PropertyDetailPage

Add task completion functionality to the task list:

```tsx
// In PropertyDetailPage.tsx
import { TaskCompletionModal } from '../../Components/Library/TaskCompletionModal';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/Store/store';

// ... in component

const tasks = useSelector((state: RootState) => state.propertyData.tasks);
const [showCompletionModal, setShowCompletionModal] = useState(false);
const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

const selectedTask = tasks.find((t) => t.id === selectedTaskId);

// In task list render:
{
	task.status !== 'Completed' && task.status !== 'Awaiting Approval' && (
		<button
			onClick={() => {
				setSelectedTaskId(task.id);
				setShowCompletionModal(true);
			}}>
			Mark Complete
		</button>
	);
}

// At end of component:
{
	showCompletionModal && selectedTask && (
		<TaskCompletionModal
			taskId={selectedTask.id}
			taskTitle={selectedTask.title}
			userId={currentUserId}
			onClose={() => setShowCompletionModal(false)}
		/>
	);
}
```

### Admin Dashboard

Create an admin view for task approvals:

```tsx
// In AdminDashboard.tsx or similar
import { TaskApprovalModal } from '../../Components/Library/TaskApprovalModal';

const awaitingApproval = tasks.filter((t) => t.status === 'Awaiting Approval');

return (
	<div>
		<h2>Tasks Awaiting Approval ({awaitingApproval.length})</h2>
		{awaitingApproval.map((task) => (
			<TaskCard key={task.id}>
				<h3>{task.title}</h3>
				<p>Property: {task.property}</p>
				<p>Submitted by: {task.completedBy}</p>
				<button onClick={() => openApprovalModal(task)}>Review</button>
			</TaskCard>
		))}
	</div>
);
```

## Firestore Collection Schema

### tasks Collection

```typescript
{
  id: string,
  propertyId: string,
  title: string,
  dueDate: string,
  status: 'Pending' | 'In Progress' | 'Awaiting Approval' | 'Completed' | 'Rejected',
  property: string,
  notes?: string,
  completionDate?: string,
  completionFile?: {
    name: string,
    url: string,
    size: number,
    type: string,
    uploadedAt: string
  },
  completedBy?: string,
  approvedBy?: string,
  approvedAt?: string,
  rejectionReason?: string,
  createdAt: string,
  updatedAt: string
}
```

## Security Rules

Add to Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      // Users can read their own tasks
      allow read: if request.auth != null;

      // Users can create tasks
      allow create: if request.auth != null;

      // Users can submit completion for their tasks
      allow update: if request.auth != null &&
        (request.resource.data.status == 'Awaiting Approval' &&
         request.resource.data.completedBy == request.auth.uid);

      // Admins can approve/reject tasks
      allow update: if request.auth != null &&
        request.auth.token.admin == true &&
        (request.resource.data.status in ['Completed', 'Rejected']);
    }
  }
}
```

Add to Firebase Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /task-completions/{taskId}/{fileName} {
      // Allow authenticated users to upload files
      allow create: if request.auth != null &&
        request.resource.size < 10 * 1024 * 1024 && // Max 10MB
        request.resource.contentType.matches('(application/pdf|image/.*|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document)');

      // Allow authenticated users to read files
      allow read: if request.auth != null;
    }
  }
}
```

## TODO: Future Enhancements

- [ ] **Notifications**: Send email/push notifications to admins when task is submitted
- [ ] **Notifications**: Send notifications to users when task is approved/rejected
- [ ] **File Preview**: Add in-modal PDF preview functionality
- [ ] **Multiple Files**: Allow uploading multiple files per completion
- [ ] **Comments**: Add ability for admins to leave comments on approvals
- [ ] **History**: Track all completion attempts and approvals in task history
- [ ] **Analytics**: Dashboard showing completion rates, average approval time
- [ ] **Bulk Operations**: Allow admins to approve/reject multiple tasks at once
- [ ] **Reminders**: Automated reminders for tasks awaiting approval

## Testing Checklist

### User Flow

- [ ] User can click "Mark Complete" on a task
- [ ] Modal opens with empty form
- [ ] Cannot submit without selecting completion date
- [ ] Cannot submit without uploading file
- [ ] File size validation works (>10MB shows error)
- [ ] File type validation works (invalid types show error)
- [ ] File upload succeeds to Firebase Storage
- [ ] Task status changes to "Awaiting Approval"
- [ ] Task shows completion date and file
- [ ] Modal closes on successful submission

### Admin Flow

- [ ] Admin can see list of tasks with "Awaiting Approval" status
- [ ] Admin can open approval modal
- [ ] Modal shows all task completion details
- [ ] File download link works
- [ ] Cannot approve without reviewing file
- [ ] Approve button works and updates status to "Completed"
- [ ] Reject button shows rejection form
- [ ] Cannot reject without entering reason
- [ ] Reject updates status to "Rejected" with reason
- [ ] Modal closes on successful action

### Edge Cases

- [ ] What happens if Firebase Storage upload fails?
- [ ] What happens if user closes modal during upload?
- [ ] Can rejected tasks be resubmitted?
- [ ] Can completed tasks be modified?
- [ ] What if file is deleted from Storage after upload?

## Support

For issues or questions, please refer to:

- Redux Slices: `client/src/Redux/Slices/propertyDataSlice.tsx`
- API Endpoints: `client/src/Redux/API/apiSlice.ts`
- Components: `client/src/Components/Library/TaskCompletionModal/` and `TaskApprovalModal/`
