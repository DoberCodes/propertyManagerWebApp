import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import {
	submitTaskCompletion,
	CompletionFile,
} from '../../Redux/Slices/propertyDataSlice';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { GenericModal, FormGroup } from '../Library';
import { calculateNextDueDate } from '../../utils/recurringTaskUtils';
import { Task } from '../../types/Task.types';
import { Label, Input, ErrorMessage } from './TaskCompletionModal.styles';
import { FileUploader } from '../Library/FileUploader';
import {
	calculateCostTotal,
	formatCurrency,
	hasCostData,
	toNumberOrUndefined,
} from '../../utils/financialUtils';
import {
	useCreateTaskMutation,
	useSubmitTaskCompletionMutation,
} from '../../Redux/API/taskSlice';
import { useCreateNotificationMutation } from '../../Redux/API/notificationSlice';
import { useAppFeedback } from '../Library/AppFeedback/AppFeedbackProvider';

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
	const [financialNotes, setFinancialNotes] = useState(
		task?.financials?.notes || '',
	);
	const [actualCosts, setActualCosts] = useState({
		contractorCost: task?.financials?.actual?.contractorCost,
		materialsCost: task?.financials?.actual?.materialsCost,
		laborCost: task?.financials?.actual?.laborCost,
		otherCost: task?.financials?.actual?.otherCost,
	});
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [errors, setErrors] = useState<{
		date?: string;
		file?: string;
		general?: string;
	}>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [submitCompletion] = useSubmitTaskCompletionMutation();
	const [createTask] = useCreateTaskMutation();
	const [createNotification] = useCreateNotificationMutation();
	const feedback = useAppFeedback();
	const normalizedPlan =
		currentUser?.subscription?.plan?.toString().toLowerCase() || '';
	const canSelfComplete = normalizedPlan === 'home';
	const requiresWorkOrder = Boolean(task?.requiresWorkOrder);

	// currentUser is guaranteed to exist in protected routes

	const validateForm = (): boolean => {
		const newErrors: typeof errors = {};

		if (!completionDate) {
			newErrors.date = 'Completion date is required';
		}

		if (requiresWorkOrder && !selectedFile) {
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
			const actualBreakdown = {
				contractorCost: toNumberOrUndefined(actualCosts.contractorCost),
				materialsCost: toNumberOrUndefined(actualCosts.materialsCost),
				laborCost: toNumberOrUndefined(actualCosts.laborCost),
				otherCost: toNumberOrUndefined(actualCosts.otherCost),
			};
			const hasActualCosts = hasCostData(actualBreakdown);
			const estimateBreakdown = task?.financials?.estimate;
			const financials =
				hasActualCosts || estimateBreakdown || financialNotes
					? {
						currency: task?.financials?.currency || 'USD',
						estimate: estimateBreakdown,
						actual: hasActualCosts ? actualBreakdown : undefined,
						notes: financialNotes || undefined,
					}
					: undefined;

			let completionFileData: CompletionFile | undefined;
			if (selectedFile) {
				// Only upload when a file is provided.
				const fileRef = ref(
					storage,
					`task-completions/${currentUser!.id}/${taskId}/${Date.now()}-${selectedFile.name}`,
				);
				await uploadBytes(fileRef, selectedFile);
				const downloadUrl = await getDownloadURL(fileRef);
				completionFileData = {
					name: selectedFile.name,
					url: downloadUrl,
					size: selectedFile.size,
					type: selectedFile.type,
					uploadedAt: new Date().toISOString(),
				};
			}

			// Step 2: Submit task completion to Redux
			dispatch(
				submitTaskCompletion({
					taskId,
					completionDate,
					completionNotes,
					completionFile: completionFileData,
					financials,
					completedBy: currentUser!.id,
					canSelfComplete,
					completedByPlan: currentUser?.subscription?.plan,
				}),
			);

			// Step 3: Submit to Firebase
			await submitCompletion({
				taskId: taskId.toString(),
				completionDate,
				completionNotes,
				completionFile: completionFileData,
				financials,
				completedBy: currentUser!.id,
				canSelfComplete,
				completedByPlan: currentUser?.subscription?.plan,
			}).unwrap();

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
						status: 'Initiated',
						isRecurring: true,
						recurrenceFrequency: task.recurrenceFrequency,
						recurrenceInterval: task.recurrenceInterval,
						parentTaskId: task.id,
						lastRecurrenceDate:
							completionDate || new Date().toISOString().split('T')[0],
					};

					// Conditionally add optional fields only if they have values
					if (task.notes) recurringTaskData.notes = task.notes;
					if (task.category) recurringTaskData.category = task.category;
					if (task.location) recurringTaskData.location = task.location;
					if (task.priority) recurringTaskData.priority = task.priority;
					if (task.assignee) recurringTaskData.assignee = task.assignee;
					if (task.financials) recurringTaskData.financials = task.financials;
					recurringTaskData.requiresWorkOrder = Boolean(task.requiresWorkOrder);
					if (task.recurrenceCustomUnit)
						recurringTaskData.recurrenceCustomUnit = task.recurrenceCustomUnit;

					await createTask(recurringTaskData).unwrap();

					// Create notification for the automatically generated recurring task
					try {
						const recurrenceText =
							task.recurrenceFrequency === 'custom'
								? `every ${task.recurrenceInterval} ${task.recurrenceCustomUnit}`
								: `every ${task.recurrenceFrequency}`;

						await createNotification({
							userId: currentUser!.id,
							type: 'task_created',
							title: 'Recurring Task Generated',
							message: `New recurring task "${task.title}" has been automatically created (${recurrenceText})`,
							data: {
								taskTitle: task.title,
								propertyId: task.propertyId,
								isRecurring: true,
								recurrenceFrequency: task.recurrenceFrequency,
								recurrenceInterval: task.recurrenceInterval,
								parentTaskId: task.id,
								autoGenerated: true,
							},
							status: 'unread',
							actionUrl: `/properties/${task.propertyId}`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						}).unwrap();
					} catch (notifError) {
						console.warn(
							'Failed to create recurring task notification:',
							notifError,
						);
						// Don't fail the completion if notification fails
					}
				} catch (recurringError: any) {
					console.warn(
						'❌ Failed to create recurring task copy:',
						recurringError,
					);
					console.warn('❌ Recurring error details:', {
						message: recurringError.message,
						stack: recurringError.stack,
						taskData: task,
					});
					// Don't fail the completion if recurring creation fails
				}
			}

			// Success!
			feedback.notify(
				canSelfComplete
					? 'Completed and added to maintenance history.'
					: 'Completion submitted for approval. It will be added to maintenance history once approved.',
			);
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

	return (
		<GenericModal
			isOpen={true}
			onClose={onClose}
			showActions={true}
			title={canSelfComplete ? 'Complete and Log Task' : 'Submit Completion for Approval'}
			primaryButtonLabel={
				isSubmitting
					? canSelfComplete
						? 'Completing...'
						: 'Submitting...'
					: canSelfComplete
					? 'Complete and Add to History'
					: 'Submit for Approval'
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
				<Label>Financials (Optional)</Label>
				{task?.financials?.estimate && (
					<p style={{ margin: '0 0 8px 0', color: '#4b5563', fontSize: '0.9rem' }}>
						Estimated Total:{' '}
						<strong>
							{formatCurrency(
								calculateCostTotal(task.financials.estimate),
								task.financials.currency || 'USD',
							)}
						</strong>
					</p>
				)}
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: '8px',
					}}>
					<Input
						type='number'
						min='0'
						step='0.01'
						placeholder='Contractor cost'
						value={actualCosts.contractorCost ?? ''}
						onChange={(e) =>
							setActualCosts((prev) => ({
								...prev,
								contractorCost: toNumberOrUndefined(e.target.value),
							}))
						}
					/>
					<Input
						type='number'
						min='0'
						step='0.01'
						placeholder='Materials cost'
						value={actualCosts.materialsCost ?? ''}
						onChange={(e) =>
							setActualCosts((prev) => ({
								...prev,
								materialsCost: toNumberOrUndefined(e.target.value),
							}))
						}
					/>
					<Input
						type='number'
						min='0'
						step='0.01'
						placeholder='Labor cost'
						value={actualCosts.laborCost ?? ''}
						onChange={(e) =>
							setActualCosts((prev) => ({
								...prev,
								laborCost: toNumberOrUndefined(e.target.value),
							}))
						}
					/>
					<Input
						type='number'
						min='0'
						step='0.01'
						placeholder='Other cost'
						value={actualCosts.otherCost ?? ''}
						onChange={(e) =>
							setActualCosts((prev) => ({
								...prev,
								otherCost: toNumberOrUndefined(e.target.value),
							}))
						}
					/>
				</div>
				<p style={{ margin: '8px 0', color: '#374151', fontSize: '0.9rem' }}>
					Actual Total:{' '}
					<strong>
						{formatCurrency(
							calculateCostTotal(actualCosts),
							task?.financials?.currency || 'USD',
						)}
					</strong>
				</p>
				<textarea
					id='financialNotes'
					value={financialNotes}
					onChange={(e) => setFinancialNotes(e.target.value)}
					placeholder='Optional financial notes or variance explanation...'
					rows={2}
					style={{
						width: '100%',
						padding: '0.75rem',
						border: '1px solid #ddd',
						borderRadius: '4px',
						fontSize: '0.95rem',
						fontFamily: 'inherit',
						resize: 'vertical',
					}}
				/>
			</FormGroup>

			<FileUploader
				label='Upload Completion Document'
				helperText={
					requiresWorkOrder
						? 'Required: JPG, PNG, GIF, WEBP, PDF (max 25MB)'
						: 'Optional: JPG, PNG, GIF, WEBP, PDF (max 25MB)'
				}
				accept='image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf'
				allowedTypes={[
					'image/jpeg',
					'image/png',
					'image/jpg',
					'image/gif',
					'image/webp',
					'application/pdf',
				]}
				maxSizeBytes={25 * 1024 * 1024}
				required={requiresWorkOrder}
				setFile={(file) => {
					setSelectedFile(file);
					setErrors({ ...errors, file: undefined });
				}}
			/>
			{errors.file && <ErrorMessage>{errors.file}</ErrorMessage>}

			{errors.general && (
				<ErrorMessage style={{ marginBottom: '1rem' }}>
					{errors.general}
				</ErrorMessage>
			)}

			{canSelfComplete ? (
				<p
					style={{
						fontSize: '0.9rem',
						color: '#666',
						marginTop: '1rem',
						padding: '1rem',
						backgroundColor: '#f8f9fa',
						borderRadius: '4px',
					}}>
					<strong>Note:</strong> Completing this task immediately writes an entry to
					the maintenance history timeline.
				</p>
			) : (
				<p
					style={{
						fontSize: '0.9rem',
						color: '#666',
						marginTop: '1rem',
						padding: '1rem',
						backgroundColor: '#f8f9fa',
						borderRadius: '4px',
					}}>
					<strong>Note:</strong> Once approved by an admin or maintenance lead,
					the completed work is logged to maintenance history.
				</p>
			)}
		</GenericModal>
	);
};
