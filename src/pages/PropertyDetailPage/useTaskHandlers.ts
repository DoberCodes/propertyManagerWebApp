import { useState } from 'react';
import { AppDispatch } from '../../Redux/store';
import { useDispatch } from 'react-redux';
import { deleteTask as deleteTaskAction } from '../../Redux/Slices/propertyDataSlice';
import { TaskHandlers, TaskFormData } from '../../types/Task.types';

interface UseTaskHandlersProps {
	onDeleteClick?: (taskIds: string[]) => void;
	deleteTaskMutation?: any;
}

export const useTaskHandlers = (props?: UseTaskHandlersProps): TaskHandlers => {
	const dispatch = useDispatch<AppDispatch>();
	const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
	const [showTaskDialog, setShowTaskDialog] = useState(false);
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
	const [showTaskAssignDialog, setShowTaskAssignDialog] = useState(false);
	const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
	const [selectedAssignee, setSelectedAssignee] = useState<any>(null);
	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
	const [taskFormData, setTaskFormData] = useState<TaskFormData>({
		title: '',
		dueDate: '',
		status: 'Pending' as const,
		notes: '',
	});

	const handleTaskCheckbox = (taskId: string) => {
		setSelectedTasks((prev) =>
			prev.includes(taskId)
				? prev.filter((id) => id !== taskId)
				: [...prev, taskId],
		);
	};

	const handleCreateTask = () => {
		setEditingTaskId(null);
		setTaskFormData({
			title: '',
			dueDate: '',
			status: 'Pending',
			notes: '',
		});
		setShowTaskDialog(true);
	};

	const handleEditTask = () => {
		if (selectedTasks.length !== 1) return;
		setEditingTaskId(selectedTasks[0]);
		setShowTaskDialog(true);
	};

	const handleDeleteTask = () => {
		if (selectedTasks.length === 0) return;
		if (props?.onDeleteClick) {
			props.onDeleteClick(selectedTasks);
		}
	};

	const handleAssignTask = () => {
		if (selectedTasks.length !== 1) return;
		setAssigningTaskId(selectedTasks[0]);
		setShowTaskAssignDialog(true);
	};

	const handleCompleteTask = () => {
		if (selectedTasks.length === 0) return;
		if (selectedTasks.length === 1) {
			setCompletingTaskId(selectedTasks[0]);
			setShowTaskCompletionModal(true);
		}
	};

	const handleTaskFormChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value, type, checked } = e.target as HTMLInputElement;
		setTaskFormData((prev: any) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
	};

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setCompletingTaskId(null);
		setSelectedTasks([]);
	};

	const confirmDeleteTask = async () => {
		// Delete from Redux
		selectedTasks.forEach((taskId) => {
			dispatch(deleteTaskAction(taskId));
		});

		// Delete from Firebase
		if (props?.deleteTaskMutation) {
			for (const taskId of selectedTasks) {
				try {
					await props.deleteTaskMutation(taskId).unwrap();
				} catch (error) {
					console.error('Failed to delete task from Firebase:', error);
				}
			}
		}

		setSelectedTasks([]);
	};

	return {
		selectedTasks,
		setSelectedTasks,
		showTaskDialog,
		setShowTaskDialog,
		editingTaskId,
		setEditingTaskId,
		showTaskAssignDialog,
		setShowTaskAssignDialog,
		assigningTaskId,
		setAssigningTaskId,
		selectedAssignee,
		setSelectedAssignee,
		showTaskCompletionModal,
		setShowTaskCompletionModal,
		completingTaskId,
		setCompletingTaskId,
		taskFormData,
		setTaskFormData,
		handleTaskCheckbox,
		handleCreateTask,
		handleEditTask,
		handleDeleteTask,
		handleAssignTask,
		handleCompleteTask,
		handleTaskFormChange,
		handleTaskCompletionSuccess,
		confirmDeleteTask,
	};
};
