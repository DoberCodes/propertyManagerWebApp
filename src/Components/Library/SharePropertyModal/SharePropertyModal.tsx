import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faTrash,
	faEdit,
	faTimes,
	faUserPlus,
	faSpinner,
	faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import {
	useGetPropertySharesQuery,
	useGetAllPropertyInvitationsQuery,
	useSendInvitationMutation,
	useUpdatePropertyShareMutation,
	useDeletePropertyShareMutation,
	useCancelInvitationMutation,
	PropertyShare,
	UserInvitation,
} from '../../../Redux/API/apiSlice';
import { SHARE_PERMISSIONS } from '../../../constants/roles';
import { getSharePermissionLabel } from '../../../utils/permissions';

interface SharePropertyModalProps {
	open: boolean;
	onClose: () => void;
	propertyId: string;
	propertyTitle: string;
	ownerId: string;
	ownerEmail: string;
}

export const SharePropertyModal: React.FC<SharePropertyModalProps> = ({
	open,
	onClose,
	propertyId,
	propertyTitle,
	ownerId,
	ownerEmail,
}) => {
	const [email, setEmail] = useState('');
	const [permission, setPermission] = useState<'admin' | 'viewer'>('viewer');
	const [editingShareId, setEditingShareId] = useState<string | null>(null);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const { data: shares = [], isLoading } =
		useGetPropertySharesQuery(propertyId);
	const { data: allInvitations = [], isLoading: isLoadingInvitations } =
		useGetAllPropertyInvitationsQuery(propertyId);
	const [sendInvitation, { isLoading: isSending }] =
		useSendInvitationMutation();
	const [updateShare, { isLoading: isUpdating }] =
		useUpdatePropertyShareMutation();
	const [deleteShare, { isLoading: isDeleting }] =
		useDeletePropertyShareMutation();
	const [cancelInvitation, { isLoading: isCanceling }] =
		useCancelInvitationMutation();

	const handleSendInvitation = async () => {
		setError('');
		setSuccess('');

		if (!email || !email.includes('@')) {
			setError('Please enter a valid email address');
			return;
		}

		if (email.toLowerCase() === ownerEmail.toLowerCase()) {
			setError('You cannot share a property with yourself');
			return;
		}

		// Check if already shared with this email
		const existingShare = shares.find(
			(share) => share.sharedWithEmail.toLowerCase() === email.toLowerCase(),
		);
		if (existingShare) {
			setError('This property is already shared with this email');
			return;
		}

		// Check if already invited
		const existingInvitation = allInvitations.find(
			(inv) => inv.toEmail.toLowerCase() === email.toLowerCase(),
		);
		if (existingInvitation) {
			setError('An invitation has already been sent to this email');
			return;
		}

		try {
			await sendInvitation({
				propertyId,
				propertyTitle,
				fromUserId: ownerId,
				fromUserEmail: ownerEmail,
				toEmail: email.toLowerCase(),
				permission,
			}).unwrap();

			setSuccess(`Invitation sent to ${email}`);
			setEmail('');
			setPermission('viewer');
		} catch (err: any) {
			setError(err.message || 'Failed to send invitation');
		}
	};

	const handleUpdateShare = async (
		shareId: string,
		newPermission: 'admin' | 'viewer',
	) => {
		setError('');
		try {
			await updateShare({ id: shareId, permission: newPermission }).unwrap();
			setEditingShareId(null);
			setSuccess('Share permission updated');
		} catch (err: any) {
			setError(err.message || 'Failed to update share');
		}
	};

	const handleDeleteShare = async (shareId: string) => {
		setError('');
		if (
			window.confirm('Are you sure you want to revoke access for this user?')
		) {
			try {
				await deleteShare(shareId).unwrap();
				setSuccess('Access revoked successfully');
			} catch (err: any) {
				setError(err.message || 'Failed to revoke access');
			}
		}
	};

	const handleCancelInvitation = async (invitationId: string) => {
		if (window.confirm('Are you sure you want to cancel this invitation?')) {
			try {
				await cancelInvitation(invitationId).unwrap();
				setSuccess('Invitation canceled successfully');
			} catch (err: any) {
				setError(err.message || 'Failed to cancel invitation');
			}
		}
	};

	if (!open) return null;

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContent onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<h2>Share Property</h2>
					<CloseButton onClick={onClose}>
						<FontAwesomeIcon icon={faTimes} />
					</CloseButton>
				</ModalHeader>

				<PropertyTitle>{propertyTitle}</PropertyTitle>

				{error && (
					<Alert type='error'>
						{error}
						<CloseAlertButton onClick={() => setError('')}>×</CloseAlertButton>
					</Alert>
				)}

				{success && (
					<Alert type='success'>
						{success}
						<CloseAlertButton onClick={() => setSuccess('')}>
							×
						</CloseAlertButton>
					</Alert>
				)}

				{/* Invite New User */}
				<Section>
					<SectionTitle>Invite User</SectionTitle>
					<InviteForm>
						<Input
							type='email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder='user@example.com'
						/>
						<Select
							value={permission}
							onChange={(e) =>
								setPermission(e.target.value as 'admin' | 'viewer')
							}>
							<option value={SHARE_PERMISSIONS.VIEWER}>
								{getSharePermissionLabel(SHARE_PERMISSIONS.VIEWER)}
							</option>
							<option value={SHARE_PERMISSIONS.ADMIN}>
								{getSharePermissionLabel(SHARE_PERMISSIONS.ADMIN)}
							</option>
						</Select>
						<Button
							onClick={handleSendInvitation}
							disabled={isSending || !email}>
							{isSending ? (
								<FontAwesomeIcon icon={faSpinner} spin />
							) : (
								<>
									<FontAwesomeIcon icon={faUserPlus} /> Invite
								</>
							)}
						</Button>
					</InviteForm>
					<HelperText>
						<strong>Admin:</strong> Can view and edit property details
						<br />
						<strong>Viewer:</strong> Can only view property details
					</HelperText>
				</Section>

				{/* Current Shares */}
				<Section>
					<SectionTitle>Shared With ({shares.length})</SectionTitle>
					{isLoading ? (
						<LoadingContainer>
							<FontAwesomeIcon icon={faSpinner} spin size='2x' />
						</LoadingContainer>
					) : shares.length === 0 ? (
						<EmptyState>
							This property hasn't been shared with anyone yet.
						</EmptyState>
					) : (
						<SharesList>
							{shares.map((share: PropertyShare) => (
								<ShareItem key={share.id}>
									<ShareInfo>
										<ShareEmail>{share.sharedWithEmail}</ShareEmail>
										{editingShareId === share.id ? (
											<div style={{ marginTop: '8px' }}>
												<Select
													value={share.permission}
													onChange={(e) =>
														handleUpdateShare(
															share.id,
															e.target.value as 'admin' | 'viewer',
														)
													}
													disabled={isUpdating}>
													<option value={SHARE_PERMISSIONS.VIEWER}>
														{getSharePermissionLabel(SHARE_PERMISSIONS.VIEWER)}
													</option>
													<option value={SHARE_PERMISSIONS.ADMIN}>
														{getSharePermissionLabel(SHARE_PERMISSIONS.ADMIN)}
													</option>
												</Select>
											</div>
										) : (
											<Badge
												color={
													share.permission === 'admin' ? 'primary' : 'default'
												}>
												{getSharePermissionLabel(share.permission)}
											</Badge>
										)}
									</ShareInfo>
									<ShareActions>
										{editingShareId === share.id ? (
											<SecondaryButton
												onClick={() => setEditingShareId(null)}
												disabled={isUpdating}>
												Cancel
											</SecondaryButton>
										) : (
											<>
												<IconButton
													onClick={() => setEditingShareId(share.id)}
													disabled={isDeleting}
													title='Edit permission'>
													<FontAwesomeIcon icon={faEdit} />
												</IconButton>
												<IconButton
													onClick={() => handleDeleteShare(share.id)}
													disabled={isDeleting}
													title='Revoke access'
													color='danger'>
													<FontAwesomeIcon icon={faTrash} />
												</IconButton>
											</>
										)}
									</ShareActions>
								</ShareItem>
							))}
						</SharesList>
					)}
				</Section>

				{/* Invitations Sent */}
				<Section>
					<SectionTitle>Invitations ({allInvitations.length})</SectionTitle>
					{isLoadingInvitations ? (
						<LoadingContainer>
							<FontAwesomeIcon icon={faSpinner} spin size='2x' />
						</LoadingContainer>
					) : allInvitations.length === 0 ? (
						<EmptyState>No invitations sent.</EmptyState>
					) : (
						<SharesList>
							{allInvitations.map((invitation: UserInvitation) => (
								<ShareItem key={invitation.id}>
									<ShareInfo>
										<ShareEmail>{invitation.toEmail}</ShareEmail>
										<Badge
											color={
												invitation.status === 'accepted'
													? 'success'
													: invitation.permission === 'admin'
														? 'primary'
														: 'default'
											}>
											{getSharePermissionLabel(invitation.permission)} •{' '}
											{invitation.status === 'accepted' ? (
												<>
													<FontAwesomeIcon icon={faCheckCircle} /> Accepted
												</>
											) : (
												'Pending'
											)}
										</Badge>
										<PendingText>
											Sent:{' '}
											{new Date(invitation.createdAt).toLocaleDateString()} •
											{invitation.status === 'pending' && (
												<>
													Expires:{' '}
													{new Date(invitation.expiresAt).toLocaleDateString()}
												</>
											)}
										</PendingText>
									</ShareInfo>
									{invitation.status === 'pending' && (
										<ShareActions>
											<IconButton
												color='danger'
												onClick={() => handleCancelInvitation(invitation.id)}
												title='Cancel invitation'
												disabled={isCanceling}>
												<FontAwesomeIcon icon={faTrash} />
											</IconButton>
										</ShareActions>
									)}
								</ShareItem>
							))}
						</SharesList>
					)}
				</Section>

				<ModalFooter>
					<SecondaryButton onClick={onClose}>Close</SecondaryButton>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};

// Styled Components
const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 20px;
`;

const ModalContent = styled.div`
	background: white;
	border-radius: 8px;
	max-width: 600px;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24px 24px 16px;
	border-bottom: 1px solid #e0e0e0;

	h2 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
		color: #333;
	}
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 24px;
	cursor: pointer;
	color: #666;
	padding: 4px 8px;
	line-height: 1;

	&:hover {
		color: #333;
	}
`;

const PropertyTitle = styled.div`
	padding: 12px 24px;
	font-size: 14px;
	color: #666;
	background-color: #f5f5f5;
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

const CloseAlertButton = styled.button`
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

const Section = styled.div`
	padding: 20px 24px;
	border-bottom: 1px solid #e0e0e0;

	&:last-of-type {
		border-bottom: none;
	}
`;

const SectionTitle = styled.h3`
	margin: 0 0 16px;
	font-size: 18px;
	font-weight: 600;
	color: #333;
`;

const InviteForm = styled.div`
	display: flex;
	gap: 12px;
	margin-bottom: 12px;

	@media (max-width: 600px) {
		flex-direction: column;
	}
`;

const Input = styled.input`
	flex: 1;
	padding: 10px 12px;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;

	&:focus {
		outline: none;
		border-color: #2196f3;
	}
`;

const Select = styled.select`
	padding: 10px 12px;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	background-color: white;
	cursor: pointer;
	min-width: 150px;

	&:focus {
		outline: none;
		border-color: #2196f3;
	}

	&:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
	}
`;

const Button = styled.button`
	padding: 10px 20px;
	background-color: #2196f3;
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	white-space: nowrap;
	display: flex;
	align-items: center;
	gap: 8px;

	&:hover:not(:disabled) {
		background-color: #1976d2;
	}

	&:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}
`;

const SecondaryButton = styled.button`
	padding: 8px 16px;
	background-color: white;
	color: #666;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	cursor: pointer;

	&:hover:not(:disabled) {
		background-color: #f5f5f5;
		border-color: #999;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const HelperText = styled.div`
	font-size: 12px;
	color: #666;
	line-height: 1.6;
`;

const LoadingContainer = styled.div`
	display: flex;
	justify-content: center;
	padding: 32px;
	color: #2196f3;
`;

const EmptyState = styled.div`
	padding: 32px 16px;
	text-align: center;
	color: #999;
	font-size: 14px;
`;

const SharesList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const ShareItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	gap: 12px;

	@media (max-width: 600px) {
		flex-direction: column;
		align-items: flex-start;
	}
`;

const ShareInfo = styled.div`
	flex: 1;
`;

const ShareEmail = styled.div`
	font-size: 14px;
	font-weight: 500;
	color: #333;
	margin-bottom: 8px;
`;

const Badge = styled.span<{ color: 'primary' | 'default' | 'success' }>`
	display: inline-block;
	padding: 4px 12px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 500;
	background-color: ${(props) =>
		props.color === 'primary'
			? '#2196f3'
			: props.color === 'success'
				? '#4caf50'
				: '#e0e0e0'};
	color: ${(props) => (props.color === 'default' ? '#666' : 'white')};
`;

const PendingText = styled.div`
	font-size: 12px;
	color: #666;
	margin-top: 4px;
`;

const ShareActions = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;

	@media (max-width: 600px) {
		width: 100%;
		justify-content: flex-end;
	}
`;

const IconButton = styled.button<{ color?: 'danger' }>`
	padding: 8px;
	background: none;
	border: none;
	cursor: pointer;
	color: ${(props) => (props.color === 'danger' ? '#d32f2f' : '#666')};
	font-size: 16px;

	&:hover:not(:disabled) {
		color: ${(props) => (props.color === 'danger' ? '#b71c1c' : '#333')};
	}

	&:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
`;

const ModalFooter = styled.div`
	padding: 16px 24px;
	display: flex;
	justify-content: flex-end;
	border-top: 1px solid #e0e0e0;
`;
