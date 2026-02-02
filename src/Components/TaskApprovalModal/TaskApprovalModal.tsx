import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import {
	approveTaskCompletion,
	rejectTaskCompletion,
	CompletionFile,
} from '../../Redux/Slices/propertyDataSlice';
import {
	useApproveTaskMutation,
	useRejectTaskMutation,
} from '../../Redux/API/apiSlice';
import { canApproveTaskCompletions } from '../../utils/permissions';
import { UserRole } from '../../constants/roles';
import { GenericModal, FormGroup } from '../Library';
import {
	InfoSection,
	InfoRow,
	InfoLabel,
	InfoValue,
	FilePreview,
	FileLink,
	RejectionSection,
	TextArea,
	ErrorMessage,
} from './TaskApprovalModal.styles';

interface TaskApprovalModalProps {
	taskId: string;
	taskTitle: string;
	taskProperty: string;
	completionDate: string;
	completionFile: CompletionFile;
	completedBy: string;
	onClose: () => void;
	onSuccess?: () => void;
}

export const TaskApprovalModal: React.FC<TaskApprovalModalProps> = ({
	taskId,
	taskTitle,
	taskProperty,
	completionDate,
	completionFile,
	completedBy,
	onClose,
	onSuccess,
}) => {
	const dispatch = useDispatch();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [showRejectForm, setShowRejectForm] = useState(false);
	const [rejectionReason, setRejectionReason] = useState('');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [approveTask] = useApproveTaskMutation();
	const [rejectTask] = useRejectTaskMutation();

	// Check if current user has permission to approve tasks
	// currentUser is guaranteed to exist in protected routes
	const hasApprovalPermission = canApproveTaskCompletions(
		currentUser!.role as UserRole,
	);

	if (!hasApprovalPermission) {
		return (
			<GenericModal
				isOpen={true}
				onClose={onClose}
				title='Access Denied'
				secondaryButtonLabel='Close'
				secondaryButtonAction={onClose}>
				<ErrorMessage>
					You do not have permission to approve task completions. Only
					administrators, property managers, and maintenance leads can approve
					tasks.
				</ErrorMessage>
			</GenericModal>
		);
	}

	const handleApprove = async () => {
		setIsSubmitting(true);
		setError('');

		try {
			// Update Redux state
			dispatch(
				approveTaskCompletion({
					taskId,
					approvedBy: currentUser!.id,
				}),
			);

			// Update Firebase (optional)
			try {
				await approveTask({
					taskId: taskId.toString(),
					approvedBy: currentUser!.id,
				}).unwrap();
			} catch (firebaseError) {
				console.warn(
					'Firebase approval failed, but Redux state updated:',
					firebaseError,
				);
			}

			// Success!
			onSuccess?.();
			onClose();
		} catch (error: any) {
			setError(error.message || 'Failed to approve task. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleReject = async () => {
		if (!rejectionReason.trim()) {
			setError('Please provide a reason for rejection');
			return;
		}

		setIsSubmitting(true);
		setError('');

		try {
			// Update Redux state
			dispatch(
				rejectTaskCompletion({
					taskId,
					rejectionReason,
				}),
			);

			// Update Firebase (optional)
			try {
				await rejectTask({
					taskId: taskId.toString(),
					rejectionReason,
				}).unwrap();
			} catch (firebaseError) {
				console.warn(
					'Firebase rejection failed, but Redux state updated:',
					firebaseError,
				);
			}

			// Success!
			onSuccess?.();
			onClose();
		} catch (error: any) {
			setError(error.message || 'Failed to reject task. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	return (
		<GenericModal
			isOpen={true}
			onClose={onClose}
			title='Review Task Completion'
			primaryButtonLabel={
				showRejectForm
					? isSubmitting
						? 'Rejecting...'
						: 'Confirm Rejection'
					: isSubmitting
						? 'Approving...'
						: 'Approve Task'
			}
			primaryButtonAction={showRejectForm ? handleReject : handleApprove}
			primaryButtonDisabled={isSubmitting}
			secondaryButtonLabel={showRejectForm ? 'Cancel Rejection' : 'Reject'}
			secondaryButtonAction={
				showRejectForm
					? () => {
							setShowRejectForm(false);
							setRejectionReason('');
							setError('');
						}
					: () => setShowRejectForm(true)
			}>
			<InfoSection>
				<InfoRow>
					<InfoLabel>Task:</InfoLabel>
					<InfoValue>{taskTitle}</InfoValue>
				</InfoRow>
				<InfoRow>
					<InfoLabel>Property:</InfoLabel>
					<InfoValue>{taskProperty}</InfoValue>
				</InfoRow>
				<InfoRow>
					<InfoLabel>Completed By:</InfoLabel>
					<InfoValue>{completedBy}</InfoValue>
				</InfoRow>
				<InfoRow>
					<InfoLabel>Completion Date:</InfoLabel>
					<InfoValue>{formatDate(completionDate)}</InfoValue>
				</InfoRow>
				<InfoRow>
					<InfoLabel>Uploaded File:</InfoLabel>
					<InfoValue>
						<FilePreview>
							<FileLink
								href={completionFile.url || '#'}
								target='_blank'
								rel='noopener noreferrer'>
								📎 {completionFile.name}
							</FileLink>
							<div
								style={{
									fontSize: '0.85rem',
									color: '#666',
									marginTop: '0.25rem',
								}}>
								{(completionFile.size / 1024).toFixed(1)} KB • Uploaded{' '}
								{formatDate(
									completionFile.uploadedAt || new Date().toISOString(),
								)}
							</div>
						</FilePreview>
					</InfoValue>
				</InfoRow>
			</InfoSection>

			{error && <ErrorMessage>{error}</ErrorMessage>}

			{showRejectForm && (
				<RejectionSection>
					<h3 style={{ marginTop: 0, color: '#e74c3c' }}>
						Reject Task Completion
					</h3>
					<p style={{ color: '#666', fontSize: '0.95rem' }}>
						Please provide a detailed reason for rejection. This will be sent to
						the user who submitted the task.
					</p>
					<TextArea
						value={rejectionReason}
						onChange={(e) => {
							setRejectionReason(e.target.value);
							setError('');
						}}
						placeholder='Enter reason for rejection...'
						rows={4}
					/>
				</RejectionSection>
			)}
		</GenericModal>
	);
};
