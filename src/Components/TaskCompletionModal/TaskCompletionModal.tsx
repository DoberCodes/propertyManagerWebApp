import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import {
	submitTaskCompletion,
	CompletionFile,
} from '../../Redux/Slices/propertyDataSlice';
import { apiSlice } from '../../Redux/API/apiSlice';
import { GenericModal, FormGroup } from '../Library';
import { Task } from '../../types/Task.types';
import { Label, Input, ErrorMessage } from './TaskCompletionModal.styles';
import { FileUploader } from '../Library/FileUploader';
import {
	calculateCostTotal,
	formatCurrency,
	hasCostData,
	toNumberOrUndefined,
} from '../../utils/financialUtils';
import { useSubmitTaskCompletionMutation } from '../../Redux/API/taskSlice';
import {
	useGetPropertiesQuery,
	useUpdatePropertyMutation,
} from '../../Redux/API/propertySlice';
import { useCreateNotificationMutation } from '../../Redux/API/notificationSlice';
import { useAppFeedback } from '../Library/AppFeedback/AppFeedbackProvider';
import { getEffectiveSubscriptionPlanId } from '../../utils/subscriptionUtils';
import { canApproveTaskCompletions } from '../../utils/permissions';
import { TaskDocumentsPanel } from '../TaskDocumentsPanel/TaskDocumentsPanel';
import {
	preparePropertyMemoryDocumentUploads,
	startPdfDocumentKnowledgeProcessing,
} from '../../propertyKnowledge/propertyDocumentUploads';

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
	const [updateProperty] = useUpdatePropertyMutation();
	const [createNotification] = useCreateNotificationMutation();
	const { data: allProperties = [] } = useGetPropertiesQuery();
	const feedback = useAppFeedback();
	const effectivePlan = getEffectiveSubscriptionPlanId(
		currentUser?.subscription,
		'homeowner',
	);
	const isHomeownerPlan =
		effectivePlan === 'homeowner' ||
		effectivePlan === 'homeowner_plus' ||
		effectivePlan === 'property';
	const hasApprovalRole = canApproveTaskCompletions(
		(currentUser?.role ?? '') as Parameters<typeof canApproveTaskCompletions>[0],
	);
	const canSelfComplete = isHomeownerPlan || hasApprovalRole;
	const requiresWorkOrder = Boolean(task?.requiresWorkOrder);
	const taskProperty = allProperties.find(
		(property: any) => String(property.id || '') === String(task?.propertyId || ''),
	);

	const getReadableErrorMessage = (error: any): string => {
		if (!error) return 'Failed to submit task completion. Please try again.';
		if (typeof error === 'string') return error;
		if (typeof error.message === 'string' && error.message.trim()) {
			return error.message;
		}
		if (typeof error.error === 'string' && error.error.trim()) {
			return error.error;
		}
		if (error.error && typeof error.error === 'object') {
			const nested =
				error.error.message || error.error.details || error.error.code;
			if (typeof nested === 'string' && nested.trim()) {
				return nested;
			}
		}
		try {
			return JSON.stringify(error);
		} catch {
			return 'Failed to submit task completion. Please try again.';
		}
	};

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
				if (!task?.propertyId || !taskProperty) {
					throw new Error('Property details are required before uploading a completion document.');
				}
				const propertyDocuments = Array.isArray(taskProperty.documents)
					? taskProperty.documents
					: [];
				const propertyKnowledgeSuggestions = Array.isArray(
					taskProperty.knowledgeSuggestions,
				)
					? taskProperty.knowledgeSuggestions
					: [];
				const {
					documents: savedDocuments,
					knowledgeSuggestions,
					pdfDocuments,
				} = await preparePropertyMemoryDocumentUploads({
					files: [selectedFile],
					propertyId: task.propertyId,
					category: 'other',
					property: taskProperty,
				});
				await updateProperty({
					id: task.propertyId,
					updates: {
						documents: [...propertyDocuments, ...savedDocuments],
						knowledgeSuggestions: [
							...propertyKnowledgeSuggestions,
							...knowledgeSuggestions,
						],
					},
				}).unwrap();
				startPdfDocumentKnowledgeProcessing({
					propertyId: task.propertyId,
					documents: pdfDocuments,
					notifyScanStarted: (document) =>
						createNotification({
							userId: currentUser!.id,
							type: 'document_scan_started',
							title: 'Document Review Started',
							message: `Maintley is reviewing ${document.fileName || document.name} for suggested details.`,
							data: {
								propertyId: task.propertyId,
								propertyTitle: taskProperty.title,
								documentId: document.id,
								documentName: document.fileName || document.name,
							},
							status: 'unread',
							actionUrl: `/properties/${task.propertyId}`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						}).unwrap(),
					onProcessed: () => {
						dispatch(apiSlice.util.invalidateTags(['Properties']));
					},
					onError: () => {
						dispatch(apiSlice.util.invalidateTags(['Properties']));
					},
				});
				const savedDocument = savedDocuments[0];
				completionFileData = {
					name: savedDocument?.fileName || savedDocument?.name || selectedFile.name,
					url: savedDocument?.fileUrl || savedDocument?.url || '',
					size: savedDocument?.size || selectedFile.size,
					type: savedDocument?.type || selectedFile.type,
					uploadedAt: savedDocument?.uploadedAt || new Date().toISOString(),
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

			if (!canSelfComplete) {
				try {
					const approvalRecipientId =
						currentUser?.accountId && currentUser.accountId !== currentUser.id
							? currentUser.accountId
							: currentUser!.id;

					await createNotification({
						userId: approvalRecipientId,
						type: 'task_approval_required',
						title: 'Task Approval Needed',
						message: `"${taskTitle}" was submitted and needs approval before it is finalized.`,
						data: {
							taskId,
							taskTitle,
							propertyId: task?.propertyId,
							submittedBy: currentUser!.id,
						},
						status: 'unread',
						actionUrl: task?.propertyId ? `/properties/${task.propertyId}` : undefined,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				} catch (notifError) {
					console.warn('Failed to create approval-required notification:', notifError);
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
				general: getReadableErrorMessage(error),
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
						? 'Required: JPG, PNG, GIF, WEBP, PDF (max 10MB)'
						: 'Optional: JPG, PNG, GIF, WEBP, PDF (max 10MB)'
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
				maxSizeBytes={10 * 1024 * 1024}
				required={requiresWorkOrder}
				setFile={(file) => {
					setSelectedFile(file);
					setErrors({ ...errors, file: undefined });
				}}
			/>
			{errors.file && <ErrorMessage>{errors.file}</ErrorMessage>}

			{task?.propertyId && (
				<FormGroup>
					<TaskDocumentsPanel
						property={taskProperty}
						propertyId={task.propertyId}
						taskId={taskId}
						taskStatus={task.status}
						canUpload
					/>
				</FormGroup>
			)}

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
