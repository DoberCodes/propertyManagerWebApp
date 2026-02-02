import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import {
	submitTaskCompletion,
	CompletionFile,
} from '../../Redux/Slices/propertyDataSlice';
import {
	useUploadTaskCompletionFileMutation,
	useSubmitTaskCompletionMutation,
	useCreateTaskMutation,
} from '../../Redux/API/apiSlice';
import { GenericModal, FormGroup } from '../Library';
import { calculateNextDueDate } from '../../utils/recurringTaskUtils';
import { Task } from '../../types/Task.types';
import {
	Label,
	Input,
	FileUploadArea,
	FileInput,
	FileUploadLabel,
	FileInfo,
	ErrorMessage,
} from './TaskCompletionModal.styles';

interface TaskCompletionModalProps {
	taskId: string;
	taskTitle: string;
	onClose: () => void;
	onSuccess?: () => void;
	task?: Task;
}

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
	taskId,
	taskTitle,
	onClose,
	onSuccess,
	task,
}) => {
	const dispatch = useDispatch();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [completionDate, setCompletionDate] = useState('');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [errors, setErrors] = useState<{
		date?: string;
		file?: string;
		general?: string;
	}>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [uploadFile] = useUploadTaskCompletionFileMutation();
	const [submitCompletion] = useSubmitTaskCompletionMutation();
	const [createTask] = useCreateTaskMutation();

	// currentUser is guaranteed to exist in protected routes

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file size (max 10MB)
			if (file.size > 10 * 1024 * 1024) {
				setErrors({ ...errors, file: 'File size must be less than 10MB' });
				return;
			}

			// Validate file type (PDFs, images, documents)
			const allowedTypes = [
				'application/pdf',
				'image/jpeg',
				'image/png',
				'image/jpg',
				'application/msword',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			];
			if (!allowedTypes.includes(file.type)) {
				setErrors({
					...errors,
					file: 'Please upload a PDF, image, or Word document',
				});
				return;
			}

			setSelectedFile(file);
			setErrors({ ...errors, file: undefined });
		}
	};

	const validateForm = (): boolean => {
		const newErrors: typeof errors = {};

		if (!completionDate) {
			newErrors.date = 'Completion date is required';
		}

		if (!selectedFile) {
			newErrors.file = 'Please upload a completion form or work order';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);
		setErrors({});

		try {
			// Step 1: Upload file to Firebase Storage
			const uploadResult = await uploadFile({
				taskId: taskId.toString(),
				file: selectedFile!,
			}).unwrap();

			const completionFileData: CompletionFile = uploadResult;

			// Step 2: Submit task completion to Redux
			dispatch(
				submitTaskCompletion({
					taskId,
					completionDate,
					completionFile: completionFileData,
					completedBy: currentUser!.id,
				}),
			);

			// Step 3: Submit to Firebase
			try {
				await submitCompletion({
					taskId: taskId.toString(),
					completionDate,
					completionFile: completionFileData,
					completedBy: currentUser!.id,
				}).unwrap();
			} catch (firebaseError) {
				console.warn(
					'Firebase submission failed, but Redux state updated:',
					firebaseError,
				);
			}

			// Step 4: Create new recurring task if applicable
			if (
				task?.isRecurring &&
				task?.recurrenceFrequency &&
				task?.recurrenceInterval
			) {
				try {
					const nextDueDate = calculateNextDueDate(
						completionDate || new Date().toISOString().split('T')[0],
						task.recurrenceFrequency,
						task.recurrenceInterval,
					);

					await createTask({
						propertyId: task.propertyId,
						title: task.title,
						dueDate: nextDueDate,
						status: 'Pending',
						notes: task.notes,
						priority: task.priority,
						assignee: task.assignee,
						isRecurring: true,
						recurrenceFrequency: task.recurrenceFrequency,
						recurrenceInterval: task.recurrenceInterval,
						parentTaskId: task.id, // Link to original recurring task
						lastRecurrenceDate:
							completionDate || new Date().toISOString().split('T')[0],
					} as any).unwrap();

					console.info(
						`📅 New recurring task created: "${task.title}" due on ${nextDueDate}`,
					);
				} catch (recurringError: any) {
					console.warn('Failed to create recurring task copy:', recurringError);
					// Don't fail the completion if recurring creation fails
				}
			}

			// Success!
			onSuccess?.();
			onClose();
		} catch (error: any) {
			setErrors({
				general:
					error.message ||
					'Failed to submit task completion. Please try again.',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<GenericModal
			isOpen={true}
			onClose={onClose}
			title='Mark Task as Complete'
			primaryButtonLabel={
				isSubmitting ? 'Submitting...' : 'Submit for Approval'
			}
			primaryButtonAction={handleSubmit}
			primaryButtonDisabled={isSubmitting}
			secondaryButtonLabel='Cancel'
			secondaryButtonAction={onClose}>
			<p style={{ marginBottom: '1.5rem', color: '#666' }}>
				Task: <strong>{taskTitle}</strong>
			</p>

			<FormGroup>
				<Label htmlFor='completionDate'>
					Completion Date <span style={{ color: '#e74c3c' }}>*</span>
				</Label>
				<Input
					type='date'
					id='completionDate'
					value={completionDate}
					onChange={(e) => {
						setCompletionDate(e.target.value);
						setErrors({ ...errors, date: undefined });
					}}
					max={new Date().toISOString().split('T')[0]}
				/>
				{errors.date && <ErrorMessage>{errors.date}</ErrorMessage>}
			</FormGroup>

			<FormGroup>
				<Label htmlFor='completionFile'>
					Upload Completion Form / Work Order{' '}
					<span style={{ color: '#e74c3c' }}>*</span>
				</Label>
				<FileUploadArea>
					<FileInput
						type='file'
						id='completionFile'
						onChange={handleFileChange}
						accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
					/>
					<FileUploadLabel htmlFor='completionFile'>
						{selectedFile ? (
							<FileInfo>
								<strong>Selected File:</strong>
								<br />
								{selectedFile.name}
								<br />
								<span style={{ fontSize: '0.85rem', color: '#666' }}>
									({(selectedFile.size / 1024).toFixed(1)} KB)
								</span>
							</FileInfo>
						) : (
							<>
								<span style={{ fontSize: '2rem' }}>📎</span>
								<br />
								Click to upload or drag and drop
								<br />
								<span style={{ fontSize: '0.85rem', color: '#666' }}>
									PDF, JPG, PNG, DOC (max 10MB)
								</span>
							</>
						)}
					</FileUploadLabel>
				</FileUploadArea>
				{errors.file && <ErrorMessage>{errors.file}</ErrorMessage>}
			</FormGroup>

			{errors.general && (
				<ErrorMessage style={{ marginBottom: '1rem' }}>
					{errors.general}
				</ErrorMessage>
			)}

			<p
				style={{
					fontSize: '0.9rem',
					color: '#666',
					marginTop: '1rem',
					padding: '1rem',
					backgroundColor: '#f8f9fa',
					borderRadius: '4px',
				}}>
				<strong>Note:</strong> Once submitted, this task will be sent to an
				admin or maintenance lead for final approval.
			</p>
		</GenericModal>
	);
};
