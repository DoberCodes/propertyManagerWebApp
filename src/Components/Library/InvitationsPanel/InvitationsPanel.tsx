import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faCheckCircle,
	faTimesCircle,
	faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import {
	useGetUserInvitationsQuery,
	useAcceptInvitationMutation,
	useRejectInvitationMutation,
	UserInvitation,
} from '../../../Redux/API/apiSlice';
import { getSharePermissionLabel } from '../../../utils/permissions';

interface InvitationsPanelProps {
	userId: string;
}

export const InvitationsPanel: React.FC<InvitationsPanelProps> = ({
	userId,
}) => {
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const { data: invitations = [], isLoading } = useGetUserInvitationsQuery();
	const [acceptInvitation, { isLoading: isAccepting }] =
		useAcceptInvitationMutation();
	const [rejectInvitation, { isLoading: isRejecting }] =
		useRejectInvitationMutation();

	const handleAccept = async (invitationId: string, propertyTitle: string) => {
		setError('');
		setSuccess('');

		try {
			await acceptInvitation({ invitationId, userId }).unwrap();
			setSuccess(`You now have access to "${propertyTitle}"`);
		} catch (err: any) {
			setError(err.message || 'Failed to accept invitation');
		}
	};

	const handleReject = async (invitationId: string, propertyTitle: string) => {
		setError('');
		setSuccess('');

		if (
			window.confirm(
				`Are you sure you want to decline the invitation to "${propertyTitle}"?`,
			)
		) {
			try {
				await rejectInvitation(invitationId).unwrap();
				setSuccess('Invitation declined');
			} catch (err: any) {
				setError(err.message || 'Failed to decline invitation');
			}
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	if (isLoading) {
		return (
			<LoadingContainer>
				<FontAwesomeIcon icon={faSpinner} spin size='2x' />
			</LoadingContainer>
		);
	}

	if (invitations.length === 0) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<h3>Property Invitations ({invitations.length})</h3>
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

			<InvitationsList>
				{invitations.map((invitation: UserInvitation, index: number) => (
					<React.Fragment key={invitation.id}>
						{index > 0 && <Divider />}
						<InvitationItem>
							<InvitationInfo>
								<InvitationHeader>
									<PropertyName>{invitation.propertyTitle}</PropertyName>
									<Badge
										color={
											invitation.permission === 'admin' ? 'primary' : 'default'
										}>
										{getSharePermissionLabel(invitation.permission)}
									</Badge>
								</InvitationHeader>
								<InvitationDetails>
									<DetailText>From: {invitation.fromUserEmail}</DetailText>
									<DetailText>
										Sent: {formatDate(invitation.createdAt)} • Expires:{' '}
										{formatDate(invitation.expiresAt)}
									</DetailText>
								</InvitationDetails>
							</InvitationInfo>
							<InvitationActions>
								<AcceptButton
									onClick={() =>
										handleAccept(invitation.id, invitation.propertyTitle)
									}
									disabled={isAccepting || isRejecting}>
									<FontAwesomeIcon icon={faCheckCircle} />
									Accept
								</AcceptButton>
								<DeclineButton
									onClick={() =>
										handleReject(invitation.id, invitation.propertyTitle)
									}
									disabled={isAccepting || isRejecting}>
									<FontAwesomeIcon icon={faTimesCircle} />
									Decline
								</DeclineButton>
							</InvitationActions>
						</InvitationItem>
					</React.Fragment>
				))}
			</InvitationsList>
		</Card>
	);
};

// Styled Components
const Card = styled.div`
	background: white;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	margin-bottom: 24px;
	overflow: hidden;
`;

const CardHeader = styled.div`
	padding: 20px 24px;
	border-bottom: 1px solid #e0e0e0;

	h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: #333;
	}
`;

const LoadingContainer = styled.div`
	display: flex;
	justify-content: center;
	padding: 40px;
	color: #2196f3;
`;

const Alert = styled.div<{ type: 'error' | 'success' }>`
	margin: 16px 24px;
	padding: 12px 40px 12px 16px;
	border-radius: 4px;
	position: relative;
	background-color: ${(props) =>
		props.type === 'error' ? '#ffebee' : '#e8f5e9'};
	color: ${(props) => (props.type === 'error' ? '#c62828' : '#2e7d32')};
	border-left: 4px solid
		${(props) => (props.type === 'error' ? '#c62828' : '#2e7d32')};
`;

const CloseButton = styled.button`
	position: absolute;
	top: 8px;
	right: 12px;
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

const InvitationsList = styled.div`
	padding: 0;
`;

const Divider = styled.hr`
	margin: 0;
	border: none;
	border-top: 1px solid #e0e0e0;
`;

const InvitationItem = styled.div`
	padding: 20px 24px;
	display: flex;
	align-items: center;
	gap: 16px;

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: flex-start;
	}
`;

const InvitationInfo = styled.div`
	flex: 1;
	min-width: 0;
`;

const InvitationHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 8px;
	flex-wrap: wrap;
`;

const PropertyName = styled.div`
	font-size: 16px;
	font-weight: 600;
	color: #333;
`;

const Badge = styled.span<{ color: 'primary' | 'default' }>`
	padding: 4px 12px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 500;
	background-color: ${(props) =>
		props.color === 'primary' ? '#2196f3' : '#e0e0e0'};
	color: ${(props) => (props.color === 'primary' ? 'white' : '#666')};
`;

const InvitationDetails = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const DetailText = styled.div`
	font-size: 13px;
	color: #666;
`;

const InvitationActions = styled.div`
	display: flex;
	gap: 8px;

	@media (max-width: 768px) {
		width: 100%;
	}
`;

const AcceptButton = styled.button`
	padding: 8px 16px;
	background-color: #4caf50;
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
	white-space: nowrap;

	&:hover:not(:disabled) {
		background-color: #45a049;
	}

	&:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		flex: 1;
		justify-content: center;
	}
`;

const DeclineButton = styled.button`
	padding: 8px 16px;
	background-color: white;
	color: #d32f2f;
	border: 1px solid #d32f2f;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
	white-space: nowrap;

	&:hover:not(:disabled) {
		background-color: #ffebee;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		flex: 1;
		justify-content: center;
	}
`;
