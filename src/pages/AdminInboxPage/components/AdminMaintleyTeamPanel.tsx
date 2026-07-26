import React, { useEffect, useMemo, useState } from 'react';
import {
	Button,
	ButtonRow,
	ErrorText,
	Input,
	Label,
	Select,
	SubTitle,
	SuccessText,
	UserDetailsGrid,
	UserDetailsItem,
	UserDetailsKey,
	UserDetailsPanel,
	UserDetailsValue,
	UserPanelToolbar,
	UserPanelWrap,
	UserRolePill,
} from '../AdminInboxPage.styles';
import {
	adminPortalListMaintleyTeam,
	adminPortalMutateMaintleyTeam,
	type AdminMaintleyTeamMember,
} from '../../../services/adminPortalService';

type MaintleyTeamRole = 'owner' | 'admin' | 'support' | 'operations';

interface AdminMaintleyTeamPanelProps {
	sessionToken: string;
}

const formatLabel = (value: string): string =>
	String(value || '').replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const createRequestId = (): string =>
	`maintley-team:${
		typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: `${Date.now()}:${Math.random().toString(36).slice(2, 12)}`
	}`;

export const AdminMaintleyTeamPanel: React.FC<AdminMaintleyTeamPanelProps> = ({ sessionToken }) => {
	const [members, setMembers] = useState<AdminMaintleyTeamMember[]>([]);
	const [canAssignElevatedRoles, setCanAssignElevatedRoles] = useState(false);
	const [loading, setLoading] = useState(false);
	const [savingUserId, setSavingUserId] = useState('');
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');
	const [email, setEmail] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [inviteRole, setInviteRole] = useState<MaintleyTeamRole>('support');
	const [inviteReason, setInviteReason] = useState('');
	const [inviteConfirmation, setInviteConfirmation] = useState('');
	const [roleDrafts, setRoleDrafts] = useState<Record<string, MaintleyTeamRole>>({});
	const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
	const [confirmationDrafts, setConfirmationDrafts] = useState<Record<string, string>>({});

	const roleOptions = useMemo(
		() => canAssignElevatedRoles
			? ['owner', 'admin', 'support', 'operations'] as MaintleyTeamRole[]
			: ['support', 'operations'] as MaintleyTeamRole[],
		[canAssignElevatedRoles],
	);

	const loadTeam = async () => {
		setLoading(true);
		setError('');
		try {
			const result = await adminPortalListMaintleyTeam({ sessionToken });
			setMembers(result.members);
			setCanAssignElevatedRoles(result.canAssignElevatedRoles);
			setRoleDrafts(Object.fromEntries(result.members.map((member) => [member.id, member.maintleyRole as MaintleyTeamRole])));
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Unable to load the Maintley team.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadTeam();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionToken]);

	const inviteMember = async () => {
		setSavingUserId('invite');
		setError('');
		setMessage('');
		try {
			const result = await adminPortalMutateMaintleyTeam({
				sessionToken,
				action: 'invite',
				email,
				firstName,
				lastName,
				role: inviteRole,
				reason: inviteReason,
				requestId: createRequestId(),
				confirmation: inviteConfirmation,
			});
			setMessage(
				result.invitationEmailOutcome === 'failed'
					? 'Maintley role assigned and audited, but the invitation email failed. Use Email User to follow up.'
					: 'Maintley team invitation sent and role assignment audited.',
			);
			setEmail('');
			setFirstName('');
			setLastName('');
			setInviteReason('');
			setInviteConfirmation('');
			await loadTeam();
		} catch (inviteError) {
			setError(inviteError instanceof Error ? inviteError.message : 'Unable to add the Maintley team member.');
		} finally {
			setSavingUserId('');
		}
	};

	const mutateMember = async (member: AdminMaintleyTeamMember, action: 'update' | 'revoke') => {
		setSavingUserId(member.id);
		setError('');
		setMessage('');
		try {
			await adminPortalMutateMaintleyTeam({
				sessionToken,
				action,
				targetUserId: member.id,
				...(action === 'update' ? { role: roleDrafts[member.id] } : {}),
				reason: reasonDrafts[member.id] || '',
				requestId: createRequestId(),
				confirmation: confirmationDrafts[member.id] || '',
			});
			setMessage(action === 'revoke' ? 'Maintley team access revoked.' : 'Maintley role updated.');
			await loadTeam();
		} catch (mutationError) {
			setError(mutationError instanceof Error ? mutationError.message : 'Unable to update the Maintley team member.');
		} finally {
			setSavingUserId('');
		}
	};

	return (
		<UserPanelWrap>
			<SubTitle>
				Maintley employment roles are separate from homeowner and property-account ownership. Only the Maintley Owner can assign Owner or Admin authority.
			</SubTitle>
			{error ? <ErrorText role='alert'>{error}</ErrorText> : null}
			{message ? <SuccessText>{message}</SuccessText> : null}

			<details style={{ marginBottom: 16 }}>
				<summary style={{ cursor: 'pointer', fontSize: 18, fontWeight: 700, padding: '16px 0' }}>
					Add Maintley Team Member
				</summary>
				<UserDetailsPanel>
					<UserPanelToolbar>
						<div><Label>Email</Label><Input type='email' value={email} onChange={(event) => setEmail(event.target.value)} /></div>
						<div><Label>First name</Label><Input value={firstName} onChange={(event) => setFirstName(event.target.value)} /></div>
						<div><Label>Last name</Label><Input value={lastName} onChange={(event) => setLastName(event.target.value)} /></div>
						<div>
							<Label>Maintley role</Label>
							<Select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as MaintleyTeamRole)}>
								{roleOptions.map((role) => <option key={role} value={role}>{formatLabel(role)}</option>)}
							</Select>
						</div>
					</UserPanelToolbar>
					<div><Label>Required audit reason</Label><Input value={inviteReason} onChange={(event) => setInviteReason(event.target.value)} /></div>
					{inviteRole === 'owner' ? <div><Label>Type CONFIRM MAINTLEY OWNER</Label><Input value={inviteConfirmation} onChange={(event) => setInviteConfirmation(event.target.value)} /></div> : null}
					<Button type='button' disabled={savingUserId === 'invite' || !email.trim() || inviteReason.trim().length < 10} onClick={() => void inviteMember()}>
						{savingUserId === 'invite' ? 'Adding...' : 'Add and Send Invitation'}
					</Button>
				</UserDetailsPanel>
			</details>

			<ButtonRow><Label>Current Maintley Team</Label><Button type='button' disabled={loading} onClick={() => void loadTeam()}>{loading ? 'Loading...' : 'Refresh'}</Button></ButtonRow>
			{members.map((member) => {
				const elevatedMember = member.maintleyRole === 'owner' || member.maintleyRole === 'admin';
				const canEditMember = canAssignElevatedRoles || !elevatedMember;
				const draftRole = roleDrafts[member.id] || member.maintleyRole as MaintleyTeamRole;
				return (
					<UserDetailsPanel key={member.id}>
						<ButtonRow><div><strong>{member.displayName}</strong><div>{member.email || 'No email'}</div></div><UserRolePill>{formatLabel(member.maintleyRole)}</UserRolePill></ButtonRow>
						<UserDetailsGrid>
							<UserDetailsItem><UserDetailsKey>User ID</UserDetailsKey><UserDetailsValue>{member.id}</UserDetailsValue></UserDetailsItem>
							<UserDetailsItem>
								<UserDetailsKey>Role</UserDetailsKey>
								<Select disabled={!canEditMember} value={draftRole} onChange={(event) => setRoleDrafts((current) => ({ ...current, [member.id]: event.target.value as MaintleyTeamRole }))}>
									{(canAssignElevatedRoles ? ['owner', 'admin', 'support', 'operations'] : roleOptions).map((role) => <option key={role} value={role}>{formatLabel(role)}</option>)}
								</Select>
							</UserDetailsItem>
						</UserDetailsGrid>
						<div><Label>Required audit reason</Label><Input disabled={!canEditMember} value={reasonDrafts[member.id] || ''} onChange={(event) => setReasonDrafts((current) => ({ ...current, [member.id]: event.target.value }))} /></div>
						{(member.maintleyRole === 'owner' || draftRole === 'owner') ? <div><Label>Type CONFIRM MAINTLEY OWNER</Label><Input disabled={!canEditMember} value={confirmationDrafts[member.id] || ''} onChange={(event) => setConfirmationDrafts((current) => ({ ...current, [member.id]: event.target.value }))} /></div> : null}
						<ButtonRow>
							<Button type='button' disabled={!canEditMember || savingUserId === member.id || (reasonDrafts[member.id] || '').trim().length < 10} onClick={() => void mutateMember(member, 'update')}>Update Role</Button>
							<Button type='button' disabled={!canEditMember || savingUserId === member.id || (reasonDrafts[member.id] || '').trim().length < 10} onClick={() => void mutateMember(member, 'revoke')}>Revoke Maintley Role</Button>
						</ButtonRow>
					</UserDetailsPanel>
				);
			})}
		</UserPanelWrap>
	);
};
