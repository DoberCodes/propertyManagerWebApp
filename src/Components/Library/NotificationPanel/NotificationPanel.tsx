import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faCheckCircle,
	faTimesCircle,
	faSpinner,
	faBell,
	faTrash,
} from '@fortawesome/free-solid-svg-icons';
import {
	useGetUserNotificationsQuery,
	useUpdateNotificationMutation,
	useDeleteNotificationMutation,
} from '../../../Redux/API/notificationSlice';
import { useAcceptInvitationMutation } from '../../../Redux/API/userSlice';
import { useUpdateUserMutation } from '../../../Redux/API/userSlice';
import { Notification } from '../../../types/Notification.types';
import { setCurrentUser } from '../../../Redux/Slices/userSlice';
import { GenericModal } from '../Modal/GenericModal';
import DocumentViewer from '../../DocumentViewer';
import {
	LEGAL_AGREEMENT_VERSION,
	createLegalAgreementDocuments,
} from '../../../constants/legal';

interface NotificationPanelProps {
	userId?: string;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = () => {
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [legalError, setLegalError] = useState('');
	const [showLegalModal, setShowLegalModal] = useState(false);
	const [legalNotification, setLegalNotification] =
		useState<Notification | null>(null);
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
	const [acceptedMaintenance, setAcceptedMaintenance] = useState(false);
	const [acceptedSubscriptionTerms, setAcceptedSubscriptionTerms] =
		useState(false);
	const [acceptedEula, setAcceptedEula] = useState(false);
	const [selectedDocument, setSelectedDocument] = useState<{
		name: string;
		title: string;
	} | null>(null);
	const currentUser = useSelector((state: any) => state.user.currentUser);
	const dispatch = useDispatch();
	const notificationUserId = currentUser?.id || currentUser?.uid;

	const {
		data: notifications = [],
		isLoading,
		isError,
		error: queryError,
	} = useGetUserNotificationsQuery(notificationUserId, {
		skip: !notificationUserId,
	});
	const [updateNotification, { isLoading: isUpdating }] =
		useUpdateNotificationMutation();
	const [deleteNotification, { isLoading: isDeleting }] =
		useDeleteNotificationMutation();
	const [acceptInvitation, { isLoading: isAccepting }] =
		useAcceptInvitationMutation();
	const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();

	const handleAcceptInvitation = async (notification: Notification) => {
		setError('');
		setSuccess('');

		const invitationId = notification.data?.invitationId;
		const userId = currentUser?.id;
		if (!invitationId || !userId) {
			setError('Missing invitation data. Please refresh and try again.');
			return;
		}

		try {
			await acceptInvitation({ invitationId, userId }).unwrap();
			await updateNotification({
				id: notification.id,
				updates: { status: 'accepted' },
			}).unwrap();
			setSuccess(
				`You now have access to "${notification.data?.propertyTitle}"`,
			);
		} catch (err: any) {
			setError(err.message || 'Failed to accept invitation');
		}
	};

	const handleRejectInvitation = async (notification: Notification) => {
		setError('');
		setSuccess('');

		if (
			window.confirm(
				`Are you sure you want to decline the invitation to "${notification.data?.propertyTitle}"?`,
			)
		) {
			try {
				await updateNotification({
					id: notification.id,
					updates: { status: 'rejected' },
				}).unwrap();
				setSuccess('Invitation declined');
			} catch (err: any) {
				setError(err.message || 'Failed to decline invitation');
			}
		}
	};

	const handleDismissNotification = async (notificationId: string) => {
		if (!notificationId) {
			console.error('Notification ID is missing:', notificationId);
			return;
		}
		try {
			await deleteNotification(notificationId).unwrap();
		} catch (err: any) {
			setError(err.message || 'Failed to dismiss notification');
		}
	};

	const resetLegalState = () => {
		setLegalError('');
		setAcceptedTerms(false);
		setAcceptedPrivacy(false);
		setAcceptedMaintenance(false);
		setAcceptedSubscriptionTerms(false);
		setAcceptedEula(false);
		setSelectedDocument(null);
	};

	const handleOpenLegalModal = (notification: Notification) => {
		resetLegalState();
		setLegalNotification(notification);
		setShowLegalModal(true);
	};

	const handleCloseLegalModal = () => {
		const confirmed = window.confirm(
			'You must accept the updated legal documents to avoid interruption of service.\n\nCancel anyway?',
		);
		if (!confirmed) {
			return;
		}
		resetLegalState();
		setLegalNotification(null);
		setShowLegalModal(false);
	};

	const handleViewDocument = (filename: string, title: string) => {
		setSelectedDocument({ name: filename, title });
	};

	const handleCloseDocumentViewer = () => {
		setSelectedDocument(null);
	};

	const allLegalDocumentsAccepted =
		acceptedTerms &&
		acceptedPrivacy &&
		acceptedMaintenance &&
		acceptedSubscriptionTerms &&
		acceptedEula;

	const handleToggleSelectAllLegal = (checked: boolean) => {
		setAcceptedTerms(checked);
		setAcceptedPrivacy(checked);
		setAcceptedMaintenance(checked);
		setAcceptedSubscriptionTerms(checked);
		setAcceptedEula(checked);
		setLegalError('');
	};

	const handleAcceptLegal = async () => {
		setLegalError('');
		if (!legalNotification || !currentUser) {
			setLegalError(
				'Missing legal agreement details. Please refresh and try again.',
			);
			return;
		}

		if (
			!acceptedTerms ||
			!acceptedPrivacy ||
			!acceptedMaintenance ||
			!acceptedSubscriptionTerms ||
			!acceptedEula
		) {
			setLegalError('Please accept all legal documents to continue.');
			return;
		}

		const agreedVersion = String(
			legalNotification.data?.legalVersion || LEGAL_AGREEMENT_VERSION,
		);
		const agreedAt = new Date().toISOString();
		const documents = createLegalAgreementDocuments(agreedAt, agreedVersion);

		try {
			await updateUser({
				id: currentUser.id,
				updates: {
					legalAgreement: {
						agreedToTerms: true,
						agreedVersion,
						agreedAt,
						documents,
					},
				},
			}).unwrap();

			dispatch(
				setCurrentUser({
					...currentUser,
					legalAgreement: {
						agreedToTerms: true,
						agreedVersion,
						agreedAt,
						documents,
					},
				}),
			);

			await updateNotification({
				id: legalNotification.id,
				updates: { status: 'accepted' },
			}).unwrap();

			setSuccess('Legal documents accepted. Thank you!');
			resetLegalState();
			setLegalNotification(null);
			setShowLegalModal(false);
		} catch (err: any) {
			setLegalError(err.message || 'Failed to accept legal documents');
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return date.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
			});
		} else if (date.toDateString() === yesterday.toDateString()) {
			return 'Yesterday';
		}

		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const getNotificationIcon = (type: Notification['type']) => {
		switch (type) {
			case 'share_invitation':
				return '👥';
			case 'legal_update':
				return '📝';
			case 'share_invitation_accepted':
				return '✅';
			case 'property_added':
				return '🏠';
			case 'task_assigned':
				return '📋';
			case 'maintenance_request':
				return '🔧';
			default:
				return '📢';
		}
	};

	const getNotificationColor = (type: Notification['type']) => {
		switch (type) {
			case 'share_invitation':
				return '#2196f3';
			case 'legal_update':
				return '#0ea5e9';
			case 'share_invitation_accepted':
				return '#4caf50';
			case 'property_added':
				return '#4caf50';
			case 'task_assigned':
				return '#ff9800';
			case 'maintenance_request':
				return '#f44336';
			default:
				return '#9c27b0';
		}
	};

	if (isLoading) {
		return (
			<Card>
				<LoadingContainer>
					<FontAwesomeIcon icon={faSpinner} spin size='2x' />
				</LoadingContainer>
			</Card>
		);
	}

	const queryErrorMessage = isError
		? String((queryError as any)?.message || queryError || '')
		: '';
	const errorMessage = error || queryErrorMessage;

	return (
		<Card>
			{errorMessage && (
				<Alert type='error'>
					{errorMessage || 'Failed to load notifications'}
					{error && <CloseButton onClick={() => setError('')}>×</CloseButton>}
				</Alert>
			)}

			{success && (
				<Alert type='success'>
					{success}
					<CloseButton onClick={() => setSuccess('')}>×</CloseButton>
				</Alert>
			)}

			{notifications.length === 0 ? (
				<EmptyState>
					<FontAwesomeIcon icon={faBell} size='2x' />
					<p>No notifications yet</p>
				</EmptyState>
			) : (
				<NotificationsList>
					{notifications.map((notification, index) => (
						<div key={notification.id || `notification-${index}`}>
							{index > 0 && <Divider />}
							<NotificationItem
								status={notification.status}
								type={notification.type}>
								<NotificationIcon
									color={getNotificationColor(notification.type)}>
									{getNotificationIcon(notification.type)}
								</NotificationIcon>

								<NotificationContent>
									<NotificationHeader>
										<NotificationTitle>{notification.title}</NotificationTitle>
										<NotificationTime>
											{formatDate(notification.createdAt)}
										</NotificationTime>
									</NotificationHeader>
									<NotificationMessage>
										{notification.message}
									</NotificationMessage>

									{notification.type === 'share_invitation' &&
										(notification.status === 'unread' ||
											notification.status === 'read') && (
											<ActionButtons>
												<ActionButton
													variant='accept'
													onClick={() => handleAcceptInvitation(notification)}
													disabled={isUpdating || isAccepting}
													title='Accept invitation'>
													<FontAwesomeIcon icon={faCheckCircle} />
													Accept
												</ActionButton>
												<ActionButton
													variant='reject'
													onClick={() => handleRejectInvitation(notification)}
													disabled={isUpdating}
													title='Decline invitation'>
													<FontAwesomeIcon icon={faTimesCircle} />
													Decline
												</ActionButton>
											</ActionButtons>
										)}

									{notification.type === 'legal_update' &&
										(notification.status === 'unread' ||
											notification.status === 'read') && (
											<ActionButtons>
												<ActionButton
													variant='accept'
													onClick={() => handleOpenLegalModal(notification)}
													disabled={isUpdating || isUpdatingUser}
													title='Review and accept legal documents'>
													<FontAwesomeIcon icon={faCheckCircle} />
													Review & Accept
												</ActionButton>
											</ActionButtons>
										)}

									{notification.status === 'accepted' && (
										<StatusBadge status='accepted'>✓ Accepted</StatusBadge>
									)}

									{notification.status === 'rejected' && (
										<StatusBadge status='rejected'>✕ Declined</StatusBadge>
									)}
								</NotificationContent>

								<DismissButton
									onClick={(event) => {
										console.info(
											'Dismiss button clicked for notification:',
											notification,
										);
										console.info(event);
										const notificationId = notification.id;
										if (!notificationId) {
											console.error(
												'Notification ID is missing:',
												notificationId,
											);
											return;
										}
										handleDismissNotification(notificationId);
									}}
									disabled={isDeleting}
									title='Dismiss notification'>
									<FontAwesomeIcon icon={faTrash} />
								</DismissButton>
							</NotificationItem>
						</div>
					))}
				</NotificationsList>
			)}

			<GenericModal
				isOpen={showLegalModal}
				onClose={handleCloseLegalModal}
				title='Review Updated Legal Documents'
				primaryButtonLabel='Accept'
				secondaryButtonLabel='Cancel'
				primaryButtonAction={handleAcceptLegal}
				secondaryButtonAction={handleCloseLegalModal}
				primaryButtonDisabled={!allLegalDocumentsAccepted}
				isLoading={isUpdatingUser || isUpdating}
				showActions>
				<LegalNotice>
					Please review and accept the updated legal documents to avoid any
					interruption of service.
				</LegalNotice>
				{legalError && <LegalError>{legalError}</LegalError>}
				<LegalSelectAllRow>
					<LegalCheckbox
						type='checkbox'
						id='legal-select-all'
						checked={allLegalDocumentsAccepted}
						onChange={(event) =>
							handleToggleSelectAllLegal(event.target.checked)
						}
					/>
					<LegalSelectAllLabel htmlFor='legal-select-all'>
						Select all legal documents
					</LegalSelectAllLabel>
				</LegalSelectAllRow>
				<LegalSection>
					<LegalCheckbox
						type='checkbox'
						checked={acceptedTerms}
						onChange={(event) => {
							setAcceptedTerms(event.target.checked);
							setLegalError('');
						}}
					/>
					<LegalContent>
						<LegalTitle>Terms of Service</LegalTitle>
						<LegalDescription>
							I agree to the terms of service that govern the use of Maintley.
						</LegalDescription>
						<LegalLink
							onClick={() =>
								handleViewDocument('terms-of-service', 'Terms of Service')
							}>
							View Terms of Service
						</LegalLink>
					</LegalContent>
				</LegalSection>
				<LegalSection>
					<LegalCheckbox
						type='checkbox'
						checked={acceptedPrivacy}
						onChange={(event) => {
							setAcceptedPrivacy(event.target.checked);
							setLegalError('');
						}}
					/>
					<LegalContent>
						<LegalTitle>Privacy Policy</LegalTitle>
						<LegalDescription>
							I acknowledge the privacy policy regarding how my data is handled.
						</LegalDescription>
						<LegalLink
							onClick={() =>
								handleViewDocument('privacy-policy', 'Privacy Policy')
							}>
							View Privacy Policy
						</LegalLink>
					</LegalContent>
				</LegalSection>
				<LegalSection>
					<LegalCheckbox
						type='checkbox'
						checked={acceptedMaintenance}
						onChange={(event) => {
							setAcceptedMaintenance(event.target.checked);
							setLegalError('');
						}}
					/>
					<LegalContent>
						<LegalTitle>Maintenance Disclaimer</LegalTitle>
						<LegalDescription>
							I understand Maintley is a tracking tool and not a maintenance
							service provider.
						</LegalDescription>
						<LegalLink
							onClick={() =>
								handleViewDocument(
									'maintenance-disclaimer',
									'Maintenance Disclaimer',
								)
							}>
							View Maintenance Disclaimer
						</LegalLink>
					</LegalContent>
				</LegalSection>
				<LegalSection>
					<LegalCheckbox
						type='checkbox'
						checked={acceptedSubscriptionTerms}
						onChange={(event) => {
							setAcceptedSubscriptionTerms(event.target.checked);
							setLegalError('');
						}}
					/>
					<LegalContent>
						<LegalTitle>Subscription Terms</LegalTitle>
						<LegalDescription>
							I acknowledge and agree to the subscription terms, including
							billing, renewals, and cancellation provisions.
						</LegalDescription>
						<LegalLink
							onClick={() =>
								handleViewDocument('subscription-terms', 'Subscription Terms')
							}>
							View Subscription Terms
						</LegalLink>
					</LegalContent>
				</LegalSection>
				<LegalSection>
					<LegalCheckbox
						type='checkbox'
						checked={acceptedEula}
						onChange={(event) => {
							setAcceptedEula(event.target.checked);
							setLegalError('');
						}}
					/>
					<LegalContent>
						<LegalTitle>End User License Agreement (EULA)</LegalTitle>
						<LegalDescription>
							I acknowledge and agree to the end user license agreement for use
							of the Maintley software.
						</LegalDescription>
						<LegalLink
							onClick={() =>
								handleViewDocument('eula', 'End User License Agreement (EULA)')
							}>
							View EULA
						</LegalLink>
					</LegalContent>
				</LegalSection>
			</GenericModal>

			<DocumentViewer
				documentName={selectedDocument?.name || ''}
				title={selectedDocument?.title || ''}
				isOpen={!!selectedDocument}
				onClose={handleCloseDocumentViewer}
			/>
		</Card>
	);
};

// Styled Components
const Card = styled.div`
	background: white;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	display: flex;
	flex-direction: column;
	min-height: 260px;
`;

const LoadingContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 40px 20px;
	color: #2196f3;
`;

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	gap: 12px;
	flex: 1;
	padding: 24px 16px;

	svg {
		font-size: 48px;
		opacity: 0.3;
		margin-bottom: 8px;
	}

	p {
		margin: 0;
		font-size: 14px;
		color: #999999;
		font-weight: 500;
	}
`;

const NotificationsList = styled.div`
	display: flex;
	flex-direction: column;
`;

const Divider = styled.hr`
	margin: 0;
	border: none;
	border-top: 1px solid #f0f0f0;
`;

const NotificationItem = styled.div<{
	status: string;
	type: string;
}>`
	padding: 16px 20px;
	display: flex;
	align-items: flex-start;
	gap: 12px;
	background: ${(props) =>
		props.status === 'unread' || props.status === 'read'
			? '#f8f9ff'
			: '#ffffff'};
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #f5f7ff;
	}

	@media (max-width: 480px) {
		padding: 16px;
		min-height: 60px;
		align-items: flex-start;
	}
`;

const NotificationIcon = styled.div<{ color: string }>`
	font-size: 24px;
	flex-shrink: 0;
`;

const NotificationContent = styled.div`
	flex: 1;
	min-width: 0;
`;

const NotificationHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 8px;
	margin-bottom: 4px;
`;

const NotificationTitle = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: #1f2937;

	@media (max-width: 480px) {
		font-size: 15px;
	}
`;

const NotificationTime = styled.div`
	font-size: 12px;
	color: #999999;
	white-space: nowrap;
	flex-shrink: 0;

	@media (max-width: 480px) {
		font-size: 13px;
	}
`;

const NotificationMessage = styled.div`
	font-size: 13px;
	color: #666666;
	line-height: 1.4;
	margin-bottom: 8px;

	@media (max-width: 480px) {
		font-size: 14px;
		line-height: 1.5;
	}
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 8px;
	margin-top: 12px;
`;

const ActionButton = styled.button<{ variant: 'accept' | 'reject' }>`
	padding: 6px 12px;
	border: none;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: all 0.2s ease;
	background-color: ${(props) =>
		props.variant === 'accept' ? '#4caf50' : '#f44336'};
	color: white;

	&:hover:not(:disabled) {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		padding: 10px 16px;
		font-size: 14px;
		min-height: 44px;
		flex: 1;
		justify-content: center;
	}
`;

const LegalNotice = styled.p`
	margin: 0 0 16px 0;
	font-size: 14px;
	color: #475569;
	line-height: 1.5;
`;

const LegalError = styled.div`
	margin-bottom: 12px;
	padding: 10px 12px;
	border-radius: 6px;
	background: #fee2e2;
	color: #b91c1c;
	font-size: 13px;
`;

const LegalSection = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 12px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #f8fafc;
	margin-bottom: 12px;
`;

const LegalSelectAllRow = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 12px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #ffffff;
	margin-bottom: 12px;
`;

const LegalSelectAllLabel = styled.label`
	font-size: 14px;
	font-weight: 600;
	color: #0f172a;
	cursor: pointer;
`;

const LegalCheckbox = styled.input`
	margin-top: 2px;
	flex-shrink: 0;
`;

const LegalContent = styled.div`
	flex: 1;
`;

const LegalTitle = styled.h4`
	margin: 0 0 6px 0;
	font-size: 15px;
	font-weight: 600;
	color: #0f172a;
`;

const LegalDescription = styled.p`
	margin: 0 0 8px 0;
	font-size: 13px;
	color: #64748b;
	line-height: 1.5;
`;

const LegalLink = styled.button`
	background: none;
	border: none;
	color: #0ea5e9;
	text-decoration: underline;
	cursor: pointer;
	font-size: 13px;
	padding: 0;

	&:hover {
		color: #0284c7;
	}
`;

const StatusBadge = styled.div<{ status: string }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 600;
	background-color: ${(props) =>
		props.status === 'accepted'
			? 'rgba(76, 175, 80, 0.1)'
			: 'rgba(244, 67, 54, 0.1)'};
	color: ${(props) => (props.status === 'accepted' ? '#4caf50' : '#f44336')};
`;

const DismissButton = styled.button`
	background: none;
	border: none;
	color: #ccc;
	cursor: pointer;
	padding: 8px;
	font-size: 14px;
	transition: color 0.2s ease;
	flex-shrink: 0;

	&:hover:not(:disabled) {
		color: #999;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		padding: 12px;
		min-width: 44px;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
`;

const Alert = styled.div<{ type: 'error' | 'success' }>`
	margin: 12px 20px 0;
	padding: 12px 16px 12px 12px;
	border-radius: 4px;
	position: relative;
	background-color: ${(props) =>
		props.type === 'error' ? '#ffebee' : '#e8f5e9'};
	color: ${(props) => (props.type === 'error' ? '#c62828' : '#2e7d32')};
	border-left: 4px solid
		${(props) => (props.type === 'error' ? '#c62828' : '#2e7d32')};
	font-size: 13px;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 20px;
	cursor: pointer;
	color: inherit;
	padding: 0;
	line-height: 1;

	&:hover {
		opacity: 0.7;
	}
`;
