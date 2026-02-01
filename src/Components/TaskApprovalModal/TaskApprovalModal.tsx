import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../Redux/Store/store';
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
import { ButtonGroup } from '../Library';
import {
	ModalOverlay,
	ModalContainer,
	ModalHeader,
	ModalTitle,
	CloseButton,
	ModalBody,
	InfoSection,
	InfoRow,
	InfoLabel,
	InfoValue,
	FilePreview,
	FileLink,
	RejectionSection,
	TextArea,
	ErrorMessage,
	RejectButton,
	ApproveButton,
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
			<ModalOverlay onClick={onClose}>
				<ModalContainer>
					<ModalHeader>
						<ModalTitle>Access Denied</ModalTitle>
						<CloseButton onClick={onClose}>&times;</CloseButton>
					</ModalHeader>
					<ModalBody>
						<ErrorMessage>
							You do not have permission to approve task completions. Only
							administrators, property managers, and maintenance leads can
							approve tasks.
						</ErrorMessage>
					</ModalBody>
				</ModalContainer>
			</ModalOverlay>
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
		<ModalOverlay onClick={handleOverlayClick}>
			<ModalContainer>
				<ModalHeader>
					<ModalTitle>Review Task Completion</ModalTitle>
					<CloseButton onClick={onClose}>&times;</CloseButton>
				</ModalHeader>

				<ModalBody>
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

					{!showRejectForm ? (
						<>
							{error && <ErrorMessage>{error}</ErrorMessage>}

							<ButtonGroup gap='1rem' marginTop='1.5rem'>
								<RejectButton
									onClick={() => setShowRejectForm(true)}
									disabled={isSubmitting}>
									Reject
								</RejectButton>
								<ApproveButton onClick={handleApprove} disabled={isSubmitting}>
									{isSubmitting ? 'Approving...' : 'Approve Task'}
								</ApproveButton>
							</ButtonGroup>
						</>
					) : (
						<RejectionSection>
							<h3 style={{ marginTop: 0, color: '#e74c3c' }}>
								Reject Task Completion
							</h3>
							<p style={{ color: '#666', fontSize: '0.95rem' }}>
								Please provide a detailed reason for rejection. This will be
								sent to the user who submitted the task.
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
							{error && <ErrorMessage>{error}</ErrorMessage>}

							<ButtonGroup gap='1rem'>
								<RejectButton
									onClick={() => {
										setShowRejectForm(false);
										setRejectionReason('');
										setError('');
									}}
									disabled={isSubmitting}
									style={{ backgroundColor: '#95a5a6' }}>
									Cancel
								</RejectButton>
								<RejectButton onClick={handleReject} disabled={isSubmitting}>
									{isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
								</RejectButton>
							</ButtonGroup>
						</RejectionSection>
					)}
				</ModalBody>
			</ModalContainer>
		</ModalOverlay>
	);
};
