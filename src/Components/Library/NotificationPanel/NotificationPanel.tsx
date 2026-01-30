import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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
	useAcceptInvitationMutation,
	Notification,
} from '../../../Redux/API/apiSlice';

interface NotificationPanelProps {
	userId?: string;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = () => {
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const { data: notifications = [], isLoading } =
		useGetUserNotificationsQuery();
	const [updateNotification, { isLoading: isUpdating }] =
		useUpdateNotificationMutation();
	const [deleteNotification, { isLoading: isDeleting }] =
		useDeleteNotificationMutation();
	const [acceptInvitation, { isLoading: isAccepting }] =
		useAcceptInvitationMutation();
	const currentUser = useSelector((state: any) => state.user.currentUser);

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
		try {
			await deleteNotification(notificationId).unwrap();
		} catch (err: any) {
			setError(err.message || 'Failed to dismiss notification');
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
				<CardHeader>
					<h3>Notifications</h3>
				</CardHeader>
				<LoadingContainer>
					<FontAwesomeIcon icon={faSpinner} spin size='2x' />
				</LoadingContainer>
			</Card>
		);
	}

	const unreadCount = notifications.filter((n) => n.status === 'unread').length;

	return (
		<Card>
			<CardHeader>
				<h3>
					Notifications
					{unreadCount > 0 && <Badge count={unreadCount}>{unreadCount}</Badge>}
				</h3>
			</CardHeader>

			{error && (
				<Alert type='error'>
					{error}
					<CloseButton onClick={() => setError('')}>×</CloseButton>
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
						<div key={notification.id}>
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

									{notification.status === 'accepted' && (
										<StatusBadge status='accepted'>✓ Accepted</StatusBadge>
									)}

									{notification.status === 'rejected' && (
										<StatusBadge status='rejected'>✕ Declined</StatusBadge>
									)}
								</NotificationContent>

								<DismissButton
									onClick={() => handleDismissNotification(notification.id)}
									disabled={isDeleting}
									title='Dismiss notification'>
									<FontAwesomeIcon icon={faTrash} />
								</DismissButton>
							</NotificationItem>
						</div>
					))}
				</NotificationsList>
			)}
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
`;

const CardHeader = styled.div`
	padding: 16px 20px;
	border-bottom: 1px solid #e0e0e0;
	background: #f9fafb;

	h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: #1f2937;
		display: flex;
		align-items: center;
		gap: 12px;
	}
`;

const Badge = styled.span<{ count: number }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: #f59e0b;
	color: white;
	border-radius: 50%;
	width: 24px;
	height: 24px;
	font-size: 12px;
	font-weight: 600;
`;

const LoadingContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 40px 20px;
	color: #2196f3;
`;

const EmptyState = styled.div`
	padding: 40px 20px;
	text-align: center;
	color: #999999;

	svg {
		margin-bottom: 12px;
		opacity: 0.5;
	}

	p {
		margin: 0;
		font-size: 14px;
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
`;

const NotificationTime = styled.div`
	font-size: 12px;
	color: #999999;
	white-space: nowrap;
	flex-shrink: 0;
`;

const NotificationMessage = styled.div`
	font-size: 13px;
	color: #666666;
	line-height: 1.4;
	margin-bottom: 8px;
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
