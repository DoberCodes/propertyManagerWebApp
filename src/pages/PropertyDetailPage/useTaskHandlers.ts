import { useState } from 'react';
import { AppDispatch } from '../../Redux/Store/store';
import { useDispatch } from 'react-redux';
import { deleteTask as deleteTaskAction } from '../../Redux/Slices/propertyDataSlice';
import { TaskHandlers, TaskFormData } from '../../types/Task.types';

export const useTaskHandlers = (): TaskHandlers => {
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
		// eslint-disable-next-line no-restricted-globals
		if (confirm('Are you sure you want to delete the selected task(s)?')) {
			selectedTasks.forEach((taskId) => {
				dispatch(deleteTaskAction(taskId));
			});
			setSelectedTasks([]);
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
		const { name, value } = e.target;
		setTaskFormData((prev: any) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setCompletingTaskId(null);
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
	};
};
