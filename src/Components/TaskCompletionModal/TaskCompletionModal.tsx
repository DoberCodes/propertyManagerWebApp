import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import {
	submitTaskCompletion,
	CompletionFile,
} from '../../Redux/Slices/propertyDataSlice';
import {
	useSubmitTaskCompletionMutation,
	useCreateTaskMutation,
} from '../../Redux/API/apiSlice';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
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
	const [completionNotes, setCompletionNotes] = useState('');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [errors, setErrors] = useState<{
		date?: string;
		file?: string;
		general?: string;
	}>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [submitCompletion] = useSubmitTaskCompletionMutation();
	const [createTask] = useCreateTaskMutation();

	// currentUser is guaranteed to exist in protected routes

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file size (max 25MB for Firebase Storage)
			if (file.size > 25 * 1024 * 1024) {
				setErrors({ ...errors, file: 'File size must be less than 25MB' });
				return;
			}

			// Validate file type (images and PDFs for Firebase Storage)
			const allowedTypes = [
				'image/jpeg',
				'image/png',
				'image/jpg',
				'image/gif',
				'image/webp',
				'application/pdf',
			];
			if (!allowedTypes.includes(file.type)) {
				setErrors({
					...errors,
					file: 'Invalid file type. Please upload an image or PDF file',
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
			const fileRef = ref(
				storage,
				`task-completions/${currentUser!.id}/${taskId}/${Date.now()}-${selectedFile!.name}`,
			);
			await uploadBytes(fileRef, selectedFile!);
			const downloadUrl = await getDownloadURL(fileRef);
			const completionFileData: CompletionFile = {
				name: selectedFile!.name,
				url: downloadUrl,
				size: selectedFile!.size,
				type: selectedFile!.type,
				uploadedAt: new Date().toISOString(),
			};

			// Step 2: Submit task completion to Redux
			dispatch(
				submitTaskCompletion({
					taskId,
					completionDate,
					completionNotes,
					completionFile: completionFileData,
					completedBy: currentUser!.id,
					userType: currentUser!.userType,
				}),
			);

			// Step 3: Submit to Firebase
			await submitCompletion({
				taskId: taskId.toString(),
				completionDate,
				completionNotes,
				completionFile: completionFileData,
				completedBy: currentUser!.id,
				userType: currentUser!.userType,
			}).unwrap();

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
						task.recurrenceCustomUnit,
					);

					// Build recurring task object, conditionally adding optional fields
					const recurringTaskData: any = {
						propertyId: task.propertyId,
						title: task.title,
						dueDate: nextDueDate,
						status: 'Pending',
						isRecurring: true,
						recurrenceFrequency: task.recurrenceFrequency,
						recurrenceInterval: task.recurrenceInterval,
						parentTaskId: task.id,
						lastRecurrenceDate:
							completionDate || new Date().toISOString().split('T')[0],
					};

					// Conditionally add optional fields only if they have values
					if (task.notes) recurringTaskData.notes = task.notes;
					if (task.priority) recurringTaskData.priority = task.priority;
					if (task.assignee) recurringTaskData.assignee = task.assignee;
					if (task.recurrenceCustomUnit)
						recurringTaskData.recurrenceCustomUnit = task.recurrenceCustomUnit;

					await createTask(recurringTaskData).unwrap();

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
				{' '}
				<Label htmlFor='completionNotes'>Completion Notes</Label>
				<textarea
					id='completionNotes'
					value={completionNotes}
					onChange={(e) => setCompletionNotes(e.target.value)}
					placeholder='Add any notes about the work completed, materials used, or issues encountered...'
					rows={4}
					style={{
						width: '100%',
						padding: '0.75rem',
						border: '1px solid #ddd',
						borderRadius: '4px',
						fontSize: '1rem',
						fontFamily: 'inherit',
						resize: 'vertical',
					}}
				/>
			</FormGroup>

			<FormGroup>
				{' '}
				<Label htmlFor='completionFile'>
					Upload Completion Document <span style={{ color: '#e74c3c' }}>*</span>
				</Label>
				<FileUploadArea>
					<FileInput
						type='file'
						id='completionFile'
						onChange={handleFileChange}
						accept='image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf'
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
									JPG, PNG, GIF, WEBP, PDF (max 25MB)
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
