import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from 'Redux/store/store';
import {
	getSubscriptionPlanDetails,
	getEffectiveSubscriptionPlanId,
	isTrialActive,
	getTrialDaysRemaining,
	isTrialExpired,
} from 'utils/subscriptionUtils';
import {
	GenericModal,
	FormGroup,
	FormLabel,
	FormInput,
} from 'Components/Library';
import { FeedbackForm } from 'Components/FeedbackForm';
import { ExpiredTrialBanner } from 'Components/ExpiredTrialBanner/ExpiredTrialBanner';
import { ScheduledSubscriptionBanner } from 'Components/ScheduledSubscriptionBanner/ScheduledSubscriptionBanner';
import { cancelSubscription } from 'services/stripeService';
import {
	updatePassword,
	reauthenticateWithCredential,
	EmailAuthProvider,
	signOut,
} from 'firebase/auth';
import { auth } from 'config/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from 'config/firebase';
import { useAppFeedback } from 'Components/Library/AppFeedback/AppFeedbackProvider';
import { useUpdateUserMutation } from 'Redux/API/userSlice';
import { useGetMyFeedbackTicketsQuery } from 'Redux/API/apiSlice';
import { setCurrentUser } from 'Redux/Slices/userSlice';
import {
	addFamilyMember,
	removeFamilyMember,
	getFamilyMembers,
	resendPasswordReset,
	updateFamilyMember,
} from 'services/authService';
import { NotificationPreferences } from 'Components/NotificationPreferences';

const Container = styled.div`
	width: 100%;
	margin: 40px auto;
	padding: 32px;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
	overflow-x: hidden;

	&, * {
		box-sizing: border-box;
	}

	@media (max-width: 768px) {
		margin: 0;
		padding: 18px;
		border-radius: 0;
		box-shadow: none;
	}

	@media (max-width: 480px) {
		padding: 14px;
	}
`;

const Title = styled.h2`
	font-size: 2rem;
	margin-bottom: 24px;

	@media (max-width: 768px) {
		font-size: 1.6rem;
		margin-bottom: 18px;
	}
`;

const SubscriptionSection = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 24px;
	margin-bottom: 24px;
	background: #f9fafb;
	min-width: 0;
	overflow: hidden;

	@media (max-width: 768px) {
		padding: 16px;
		margin-bottom: 16px;
	}

	@media (max-width: 480px) {
		padding: 14px;
	}
`;

const SubscriptionHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
	margin-bottom: 16px;

	@media (max-width: 640px) {
		align-items: flex-start;
		flex-direction: column;
	}
`;

const PlanName = styled.h3`
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0;
	color: #1f2937;
	min-width: 0;

	@media (max-width: 640px) {
		font-size: 1.25rem;
	}
`;

const PlanStatus = styled.span<{ status: string }>`
	display: inline-flex;
	max-width: 100%;
	padding: 4px 12px;
	border-radius: 20px;
	font-size: 0.875rem;
	font-weight: 500;
	text-transform: uppercase;
	${({ status }) => {
		switch (status) {
			case 'free':
				return `
						background: #d1fae5;
						color: #065f46;
					`;
			case 'trial':
				return `
						background: #fef3c7;
						color: #d97706;
					`;
			case 'active':
				return `
						background: #d1fae5;
						color: #065f46;
					`;
			case 'cancelled':
				return `
						background: #fee2e2;
						color: #dc2626;
					`;
			default:
				return `
						background: #e5e7eb;
						color: #6b7280;
					`;
		}
	}}
`;

const PlanDetails = styled.div`
	margin-bottom: 16px;
`;

const PlanPrice = styled.p`
	font-size: 1.125rem;
	font-weight: 600;
	color: #059669;
	margin: 8px 0;
`;

const PlanFeatures = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
`;

const PlanFeature = styled.li`
	font-size: 0.875rem;
	color: #6b7280;
	margin-bottom: 4px;
	overflow-wrap: anywhere;
	&::before {
		content: '✓';
		color: #059669;
		margin-right: 8px;
	}
`;

const TrialInfo = styled.div`
	background: #fef3c7;
	border: 1px solid #f59e0b;
	border-radius: 6px;
	padding: 12px;
	margin-bottom: 16px;
`;

const TrialText = styled.p`
	margin: 0;
	color: #92400e;
	font-size: 0.875rem;
	overflow-wrap: anywhere;
`;

const FreePlanInfo = styled(TrialInfo)`
	background: #ecfdf5;
	border: 1px solid #34d399;
`;

const FreePlanText = styled(TrialText)`
	color: #065f46;
`;

const LinkButton = styled.button`
	display: inline-block;
	margin: 16px 0;
	padding: 12px 24px;
	background: #6366f1;
	color: #fff;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	transition: background 0.2s;
	border: none;
	cursor: pointer;
	white-space: normal;
	text-align: center;
	&:hover {
		background: #4f46e5;
	}

	@media (max-width: 640px) {
		width: 100%;
		margin: 8px 0 0;
		padding: 12px 14px;
	}
`;

const UpgradeButton = styled(LinkButton)`
	background: #059669;
	&:hover {
		background: #047857;
	}
`;

const ButtonContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
	margin-top: 16px;

	@media (max-width: 640px) {
		align-items: stretch;
		gap: 8px;
	}
`;

const CancelButton = styled(LinkButton)`
	background: transparent;
	color: #b91c1c;
	margin: 0;
	padding: 0;
	text-decoration: underline;
	text-underline-offset: 2px;
	font-size: 0.9rem;
	&:hover {
		background: transparent;
		color: #991b1b;
	}

	@media (max-width: 640px) {
		width: auto;
		padding: 0;
		margin: 0;
		text-align: left;
	}
`;

const AccountSection = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 24px;
	margin-bottom: 24px;
	background: #f9fafb;
	height: fit-content;
	overflow: visible;
	min-width: 0;

	@media (max-width: 768px) {
		padding: 16px;
		margin-bottom: 16px;
	}

	@media (max-width: 480px) {
		padding: 14px;
	}
`;

const SectionTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 16px 0;
	color: #1f2937;
	overflow-wrap: anywhere;

	@media (max-width: 640px) {
		font-size: 1.1rem;
	}
`;

const AccountActions = styled.div`
	display: flex;
	gap: 12px;
	flex-wrap: wrap;

	@media (max-width: 640px) {
		flex-direction: column;
		gap: 8px;
	}
`;

const ResourceButtons = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;

	@media (max-width: 640px) {
		align-items: stretch;
	}
`;

const AccountButton = styled.button<{ disabled?: boolean }>`
	padding: 12px 24px;
	width: fit-content;
	background: #6366f1;
	color: #fff;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	transition: background 0.2s;
	border: none;
	cursor: pointer;
	white-space: normal;
	text-align: center;
	min-width: 0;

	&:hover {
		background: #4f46e5;
	}

	&:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		opacity: 0.6;

		&:hover {
			background: #9ca3af;
		}
	}

	@media (max-width: 640px) {
		width: 100%;
		padding: 12px 14px;
	}
`;

const FamilyMembersList = styled.div`
	margin-bottom: 16px;
`;

const FamilyMembersLabel = styled.h4`
	margin-bottom: 8px;
	font-size: 14px;
	font-weight: 600;
	color: #374151;
`;

const FamilyMemberCard = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	flex-wrap: wrap;
	gap: 12px;
	padding: 12px;
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 10px;
	margin-bottom: 10px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: stretch;
	}
`;

const FamilyMemberInfo = styled.div`
	flex: 1 1 260px;
	min-width: 0;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	row-gap: 4px;
	column-gap: 8px;

	@media (max-width: 640px) {
		flex: 1 1 auto;
		flex-direction: column;
		align-items: flex-start;
	}
`;

const FamilyMemberName = styled.span`
	font-weight: 600;
	color: #111827;
`;

const FamilyMemberEmail = styled.span`
	color: #6b7280;
	word-break: break-word;
	overflow-wrap: anywhere;
`;

const FamilyMemberRole = styled.span`
	color: #374151;
	font-size: 12px;
	font-weight: 700;
	text-transform: uppercase;
	padding: 2px 8px;
	border-radius: 999px;
	background: #eef2ff;
`;

const FamilyMemberActions = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 6px;
	flex: 1 1 240px;

	@media (max-width: 640px) {
		width: 100%;
		flex: 1 1 auto;
		align-items: stretch;
	}
`;

const FamilyMemberSupportActions = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;

	@media (max-width: 640px) {
		justify-content: center;
		flex-wrap: wrap;
	}
`;

const FamilyMemberActionButton = styled.button<{ variant: 'edit' | 'reset' | 'remove' }>`
	border: none;
	border-radius: 6px;
	padding: ${({ variant }) => (variant === 'edit' ? '8px 14px' : '0')};
	font-size: 12px;
	font-weight: 600;
	line-height: 1.2;
	cursor: pointer;
	white-space: normal;
	color: ${({ variant }) => {
		switch (variant) {
			case 'edit':
				return '#ffffff';
			case 'reset':
				return '#2563eb';
			case 'remove':
				return '#dc2626';
			default:
				return '#2563eb';
		}
	}};
	background: ${({ variant }) => (variant === 'edit' ? '#10b981' : 'transparent')};
	text-decoration: ${({ variant }) => (variant === 'edit' ? 'none' : 'underline')};
	text-underline-offset: ${({ variant }) => (variant === 'edit' ? '0' : '2px')};

	&:hover {
		opacity: 0.9;
	}

	@media (max-width: 640px) {
		width: ${({ variant }) => (variant === 'edit' ? '100%' : 'auto')};
		padding: ${({ variant }) => (variant === 'edit' ? '10px 12px' : '0')};
	}
`;

const DeleteAccountButton = styled(AccountButton)`
	background: #dc2626;
	&:hover:not(:disabled) {
		background: #b91c1c;
	}
	&:disabled {
		background: #9ca3af;
	}
`;

const ErrorMessage = styled.div`
	background-color: #fee2e2;
	color: #dc2626;
	padding: 12px 16px;
	border-radius: 6px;
	margin-bottom: 16px;
	font-size: 14px;
	border-left: 4px solid #dc2626;
	overflow-wrap: anywhere;
`;

const SuccessMessage = styled.div`
	background-color: #d1fae5;
	color: #065f46;
	padding: 12px 16px;
	border-radius: 6px;
	margin-bottom: 16px;
	font-size: 14px;
	border-left: 4px solid #065f46;
	overflow-wrap: anywhere;
`;

const PasswordHelp = styled.div`
	font-size: 12px;
	color: #6b7280;
	margin-top: 8px;
	font-style: italic;
`;

const SettingsLayout = styled.div`
	display: grid;
	grid-template-columns: 240px minmax(0, 1fr);
	gap: 20px;
	min-width: 0;

	@media (max-width: 1024px) {
		display: block;
	}
`;

const CategorySidebar = styled.aside`
	position: sticky;
	top: 16px;
	height: fit-content;
	background: #f8fafc;
	border: 1px solid #e5e7eb;
	border-radius: 10px;
	padding: 10px;

	@media (max-width: 1024px) {
		display: none;
	}
`;

const CategoryNavButton = styled.button<{ active?: boolean }>`
	width: 100%;
	text-align: left;
	border: 0;
	border-radius: 8px;
	padding: 10px 12px;
	margin-bottom: 4px;
	background: ${({ active }) => (active ? '#4f46e5' : 'transparent')};
	color: ${({ active }) => (active ? '#ffffff' : '#374151')};
	font-weight: 600;
	cursor: pointer;

	&:hover {
		background: ${({ active }) => (active ? '#4338ca' : '#e5e7eb')};
	}

	&:last-child {
		margin-bottom: 0;
	}
`;

const MobileCategoryPicker = styled.div`
	display: none;
	margin-bottom: 16px;

	@media (max-width: 1024px) {
		display: block;
	}

	@media (max-width: 640px) {
		margin-bottom: 12px;
	}
`;

const CategorySelect = styled.select`
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 8px;
	background: #ffffff;
	color: #1f2937;
	font-weight: 600;
	min-width: 0;

	@media (max-width: 640px) {
		font-size: 16px;
		min-height: 44px;
	}
`;

const CategoryContent = styled.div`
	min-width: 0;
	width: 100%;
`;

const CategoryPanel = styled.section`
	min-height: 68vh;
	overflow-y: auto;
	overflow-x: hidden;
	padding-right: 6px;

	/* Prevent extra trailing gap from section bottom margins */
	& > *:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 1024px) {
		min-height: 56vh;
		max-height: none;
		overflow-y: visible;
		padding-right: 0;
	}

	@media (max-width: 640px) {
		min-height: 0;
	}
`;

const SupportTicketList = styled.div`
	display: grid;
	gap: 12px;
	margin-top: 14px;
`;

const SupportTicketFilterGroup = styled.div`
	display: inline-flex;
	align-items: center;
	background: #f3f4f6;
	border: 1px solid #e5e7eb;
	border-radius: 999px;
	padding: 2px;
`;

const SupportTicketHeaderBar = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	margin-top: 12px;
`;

const SupportTicketFilterLabel = styled.span`
	font-size: 0.8rem;
	font-weight: 700;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.04em;
`;

const SupportTicketFilterButton = styled.button<{ active?: boolean }>`
	border: 0;
	border-radius: 999px;
	padding: 6px 12px;
	font-size: 0.82rem;
	font-weight: 700;
	cursor: pointer;
	background: ${({ active }) => (active ? '#4f46e5' : 'transparent')};
	color: ${({ active }) => (active ? '#ffffff' : '#4b5563')};

	&:hover {
		background: ${({ active }) => (active ? '#4338ca' : '#e5e7eb')};
	}
`;

const refreshSpin = keyframes`
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
`;

const SupportTicketRefreshButton = styled.button<{ $isRefreshing?: boolean }>`
	border: 0;
	background: transparent;
	color: #6b7280;
	cursor: pointer;
	padding: 4px;
	line-height: 1;
	font-size: 1.05rem;
	${({ $isRefreshing }) => $isRefreshing && css`animation: ${refreshSpin} 1s linear infinite;`}


	&:hover {
		color: #111827;
	}
`;



const SupportTicketCard = styled.div`
	border: 1px solid #e5e7eb;
	border-left: 4px solid #4f46e5;
	border-radius: 12px;
	padding: 14px;
	background: #ffffff;
	box-shadow: 0 1px 2px rgba(17, 24, 39, 0.04);
`;

const SupportTicketHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
`;

const SupportTicketSubject = styled.h4`
	margin: 0;
	font-size: 0.98rem;
	color: #111827;
`;

const SupportTicketStatus = styled.span`
	padding: 4px 10px;
	border-radius: 999px;
	background: #ede9fe;
	border: 1px solid #ddd6fe;
	color: #4f46e5;
	font-size: 0.72rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.02em;
`;

const SupportTicketMeta = styled.p`
	margin: 8px 0 0;
	font-size: 0.84rem;
	color: #6b7280;
`;

const SupportTicketMetaGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 8px;
	margin-top: 10px;

	@media (max-width: 860px) {
		grid-template-columns: 1fr;
	}
`;

const SupportTicketMetaBlock = styled.div`
	padding: 8px 10px;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	background: #f9fafb;
`;

const SupportTicketMetaLabel = styled.span`
	display: block;
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	color: #6b7280;
`;

const SupportTicketMetaValue = styled.span`
	display: block;
	margin-top: 3px;
	font-size: 0.86rem;
	color: #1f2937;
`;

const SupportTicketSection = styled.div`
	margin-top: 10px;
`;

const SupportTicketSectionLabel = styled.h5`
	margin: 0 0 4px;
	font-size: 0.78rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	color: #6b7280;
`;

const SupportTicketMessage = styled.p`
	margin: 8px 0 0;
	font-size: 0.9rem;
	line-height: 1.5;
	color: #374151;
	white-space: pre-wrap;
	word-break: break-word;
`;

const SupportAttachmentList = styled.ul`
	margin: 0;
	padding-left: 16px;
	font-size: 0.85rem;
	color: #4b5563;
`;


export const SettingsPage: React.FC = () => {
	type SettingsCategoryKey =
		| 'billing'
		| 'family'
		| 'account'
		| 'notifications'
		| 'getting-started'
		| 'support'
		| 'legal';

	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const feedback = useAppFeedback();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isTenant = currentUser?.role === 'tenant';
	const isTeamMemberAccount = currentUser?.isTeamMemberAccount === true;
	const isPrimaryAccountHolder =
		!!currentUser &&
		(currentUser.isAccountOwner || currentUser.accountId === currentUser.id);
	const canViewPlanSection = !isTenant && isPrimaryAccountHolder;
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [showFeedbackModal, setShowFeedbackModal] = useState(false);
	const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
	const [isRestartingOnboarding, setIsRestartingOnboarding] = useState(false);
	const [updateUser] = useUpdateUserMutation();
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [passwordError, setPasswordError] = useState('');
	const [passwordSuccess, setPasswordSuccess] = useState('');
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [isDeletingAccount, setIsDeletingAccount] = useState(false);
	const [deleteAccountError, setDeleteAccountError] = useState('');
	const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] =
		useState(false);
	const [isCancellingSubscription, setIsCancellingSubscription] =
		useState(false);
	const [cancelSubscriptionError, setCancelSubscriptionError] = useState('');
	const [subscriptionError, setSubscriptionError] = useState(false);
	const [familyMembers, setFamilyMembers] = useState<any[]>([]);
	const [showAddFamilyMemberModal, setShowAddFamilyMemberModal] =
		useState(false);
	const [showEditFamilyMemberModal, setShowEditFamilyMemberModal] =
		useState(false);
	const [isLoadingFamilyMembers, setIsLoadingFamilyMembers] = useState(false);
	const [familyMemberForm, setFamilyMemberForm] = useState({
		firstName: '',
		lastName: '',
		email: '',
		role: 'member' as 'owner' | 'admin' | 'member',
	});
	const [editFamilyMemberForm, setEditFamilyMemberForm] = useState({
		id: '',
		firstName: '',
		lastName: '',
		email: '',
		role: 'member' as 'admin' | 'member',
	});
	const [isAddingFamilyMember, setIsAddingFamilyMember] = useState(false);
	const [isSavingFamilyMemberEdit, setIsSavingFamilyMemberEdit] =
		useState(false);
	const [addFamilyMemberError, setAddFamilyMemberError] = useState('');
	const [familyMemberSuccess, setFamilyMemberSuccess] = useState('');
	const [activeCategory, setActiveCategory] =
		useState<SettingsCategoryKey>('account');
	const [supportTicketFilter, setSupportTicketFilter] = useState<
		'active' | 'closed'
	>('active');
	const [searchParams, setSearchParams] = useSearchParams();

	const {
		data: mySupportTickets = [],
		isLoading: loadingMySupportTickets,
		isFetching: fetchingMySupportTickets,
		error: mySupportTicketsError,
		refetch: refetchMySupportTickets,
	} = useGetMyFeedbackTicketsQuery(
		{ limit: 20 },
		{ skip: !currentUser },
	);

	const formatSupportStatus = (status: string): string =>
		String(status || 'received')
			.replaceAll('_', ' ')
			.replace(/\b\w/g, (m) => m.toUpperCase());

	const getEffectiveSupportStatus = (ticket: {
		status?: string;
		publicStatus?: string;
		closedAt?: string | { seconds?: number; nanoseconds?: number } | null;
	}): string => {
		const rawStatus = String(ticket.status || '')
			.toLowerCase()
			.replaceAll(' ', '_')
			.trim();
		const rawPublicStatus = String(ticket.publicStatus || '')
			.toLowerCase()
			.replaceAll(' ', '_')
			.trim();
		const hasClosedTimestamp = Boolean(ticket.closedAt);

		// Customer-facing ticket bucket treats resolved/closed as closed work.
		if (
			rawStatus === 'closed' ||
			rawStatus === 'resolved' ||
			rawPublicStatus === 'closed' ||
			rawPublicStatus === 'fixed' ||
			hasClosedTimestamp
		) {
			return 'closed';
		}

		return String(ticket.publicStatus || ticket.status || 'received');
	};

	const formatSupportDate = (value?: string): string => {
		if (!value) return 'Unknown date';
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) return value;
		return parsed.toLocaleString();
	};

	const ensureAbsoluteUrl = (value?: string): string | null => {
		const raw = String(value || '').trim();
		if (!raw) return null;
		if (/^https?:\/\//i.test(raw)) return raw;
		if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) return `https://${raw}`;
		return null;
	};

	const renderLinkedText = (value?: string): React.ReactNode => {
		const text = String(value || '');
		if (!text) return null;

		const urlRegex = /(https?:\/\/[^\s)]+|(?:[\w-]+\.)+[\w-]{2,}(?:\/[^\s)]*)?)/gi;
		const parts: React.ReactNode[] = [];
		let lastIndex = 0;
		let match: RegExpExecArray | null;
		let keyIndex = 0;

		while ((match = urlRegex.exec(text)) !== null) {
			const [matched] = match;
			const start = match.index;
			if (start > lastIndex) {
				parts.push(text.slice(lastIndex, start));
			}
			const href = ensureAbsoluteUrl(matched);
			if (href) {
				parts.push(
					<a
						key={`support-link-${keyIndex++}`}
						href={href}
						target='_blank'
						rel='noopener noreferrer'>
						{matched}
					</a>,
				);
			} else {
				parts.push(matched);
			}
			lastIndex = start + matched.length;
		}

		if (lastIndex < text.length) {
			parts.push(text.slice(lastIndex));
		}

		return parts.length > 0 ? parts : text;
	};

	const isClosedSupportStatus = (value?: string): boolean => {
		const normalized = String(value || '')
			.toLowerCase()
			.replaceAll(' ', '_');
		return normalized === 'closed' || normalized === 'resolved';
	};

	const filteredSupportTickets = useMemo(() => {
		if (supportTicketFilter === 'closed') {
			return mySupportTickets.filter((ticket) =>
				isClosedSupportStatus(getEffectiveSupportStatus(ticket)),
			);
		}

		return mySupportTickets.filter(
			(ticket) => !isClosedSupportStatus(getEffectiveSupportStatus(ticket)),
		);
	}, [mySupportTickets, supportTicketFilter]);

	// Load family members
	useEffect(() => {
		const loadFamilyData = async () => {
			if (currentUser?.accountId) {
				setIsLoadingFamilyMembers(true);
				try {
					const members = await getFamilyMembers(currentUser.accountId);
					setFamilyMembers(members);
				} catch (error) {
					console.error('Failed to load family account data:', error);
				} finally {
					setIsLoadingFamilyMembers(false);
				}
			}
		};

		loadFamilyData();
	}, [currentUser?.accountId]);

	const subscription = currentUser?.subscription;
	const nonOwnerFamilyMembers = familyMembers.filter(
		(member) => member.id !== currentUser?.id,
	);
	const occupiedFamilySeats = nonOwnerFamilyMembers.length;
	const canAddMoreFamilyMembers = occupiedFamilySeats < 2;
	const canManageFamilyRoles =
		currentUser?.isAccountOwner ||
		currentUser?.accountId === currentUser?.id ||
		currentUser?.role === 'admin';

	const categoryOptions = useMemo(
		() => [
			{
				key: 'billing' as SettingsCategoryKey,
				label: 'Billing & Plan',
				visible: canViewPlanSection,
			},
			{
				key: 'family' as SettingsCategoryKey,
				label: 'Family Members',
				visible: !isTenant && canManageFamilyRoles,
			},
			{
				key: 'account' as SettingsCategoryKey,
				label: 'Account',
				visible: true,
			},
			{
				key: 'notifications' as SettingsCategoryKey,
				label: 'Notifications',
				visible: !isTenant,
			},
			{
				key: 'getting-started' as SettingsCategoryKey,
				label: 'Getting Started',
				visible: !isTenant,
			},
			{
				key: 'support' as SettingsCategoryKey,
				label: 'Support',
				visible: true,
			},
			{
				key: 'legal' as SettingsCategoryKey,
				label: 'Legal',
				visible: true,
			},
		],
		[canViewPlanSection, canManageFamilyRoles, isTenant],
	);

	const visibleCategories = useMemo(
		() => categoryOptions.filter((category) => category.visible),
		[categoryOptions],
	);

	useEffect(() => {
		const category = searchParams.get('category');
		if (!category) {
			return;
		}

		const isValidCategory = categoryOptions.some(
			(option) => option.key === category,
		);
		if (!isValidCategory) {
			return;
		}

		setActiveCategory(category as SettingsCategoryKey);
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.delete('category');
			return next;
		}, { replace: true });
	}, [categoryOptions, searchParams, setSearchParams]);

	useEffect(() => {
		if (!visibleCategories.some((category) => category.key === activeCategory)) {
			setActiveCategory(visibleCategories[0]?.key || 'account');
		}
	}, [activeCategory, visibleCategories]);

	if (!subscription) {
		return (
			<Container>
				<Title>Settings</Title>
				<p>Loading subscription information...</p>
			</Container>
		);
	}

	const effectivePlanId = getEffectiveSubscriptionPlanId(subscription, 'homeowner');
	const planDetails = getSubscriptionPlanDetails(effectivePlanId);
	const isFreePlan = effectivePlanId === 'homeowner';
	const isOnTrial = isTrialActive(subscription);
	const shouldShowTrialInfo = isOnTrial && !isFreePlan;
	const trialDaysRemaining = getTrialDaysRemaining(subscription);
	const planStatusDisplay =
		isFreePlan && subscription.status === 'trial'
			? 'free'
			: subscription.status;

	const handleAddFamilyMember = async () => {
		if (!currentUser?.accountId || !canManageFamilyRoles) {
			setAddFamilyMemberError(
				'Only account owners or admins can add family members',
			);
			return;
		}

		if (
			!familyMemberForm.firstName.trim() ||
			!familyMemberForm.lastName.trim() ||
			!familyMemberForm.email.trim()
		) {
			setAddFamilyMemberError('Please fill in all fields');
			return;
		}

		setIsAddingFamilyMember(true);
		setAddFamilyMemberError('');
		setFamilyMemberSuccess('');

		try {
			const requestedRole = canManageFamilyRoles
				? familyMemberForm.role
				: 'member';

			const memberResult = await addFamilyMember(
				currentUser.accountId,
				familyMemberForm.email.trim(),
				familyMemberForm.firstName.trim(),
				familyMemberForm.lastName.trim(),
				requestedRole,
			);

			const members = await getFamilyMembers(currentUser.accountId);
			setFamilyMembers(members);

			// Reset form and close modal
			setFamilyMemberForm({
				firstName: '',
				lastName: '',
				email: '',
				role: 'member',
			});
			setShowAddFamilyMemberModal(false);
			setFamilyMemberSuccess(
				memberResult.message || 'Family member added successfully.',
			);
		} catch (error: any) {
			setAddFamilyMemberError(error.message || 'Failed to add family member');
		} finally {
			setIsAddingFamilyMember(false);
		}
	};

	const handleRemoveFamilyMember = async (memberId: string) => {
		if (!currentUser?.accountId || !canManageFamilyRoles) {
			return;
		}

		// Find the member being removed to get their name
		const memberToRemove = familyMembers.find((m) => m.id === memberId);
		const memberName =
			memberToRemove?.displayName || memberToRemove?.email || 'Family Member';

		if (
			!window.confirm(
				`⚠️ WARNING: You are about to remove "${memberName}" from the family account.\n\nThis will:\n• Delete their account\n• Remove their access to the shared subscription\n\nTheir name will be preserved on all tasks and history.\n\nAre you sure you want to proceed?`,
			)
		) {
			return;
		}

		try {
			await removeFamilyMember(currentUser.accountId, memberId, currentUser.id);

			const members = await getFamilyMembers(currentUser.accountId);
			setFamilyMembers(members);
		} catch (error: any) {
			console.error('Failed to remove family member:', error);
			feedback.notify('Failed to remove family member. Please try again.');
		}
	};

	const handleResendPasswordSetup = async (memberId: string) => {
		if (!currentUser?.accountId || !canManageFamilyRoles) {
			return;
		}

		try {
			await resendPasswordReset(currentUser.accountId, memberId);
			feedback.notify('Password setup email sent successfully!');
		} catch (error: any) {
			console.error('Failed to resend password setup email:', error);
			feedback.notify(
				error.message ||
					'Failed to resend password setup email. Please try again.',
			);
		}
	};

	const handleOpenEditFamilyMember = (member: any) => {
		setAddFamilyMemberError('');
		setFamilyMemberSuccess('');
		setEditFamilyMemberForm({
			id: String(member.id || ''),
			firstName: String(member.firstName || ''),
			lastName: String(member.lastName || ''),
			email: String(member.email || ''),
			role: member.role === 'admin' ? 'admin' : 'member',
		});
		setShowEditFamilyMemberModal(true);
	};

	const handleSaveFamilyMemberEdit = async () => {
		if (!currentUser?.accountId || !canManageFamilyRoles) {
			return;
		}
		if (
			!editFamilyMemberForm.id ||
			!editFamilyMemberForm.firstName.trim() ||
			!editFamilyMemberForm.lastName.trim()
		) {
			setAddFamilyMemberError('Please fill in first and last name');
			return;
		}

		setAddFamilyMemberError('');
		setFamilyMemberSuccess('');
		setIsSavingFamilyMemberEdit(true);

		try {
			await updateFamilyMember(
				currentUser.accountId,
				editFamilyMemberForm.id,
				editFamilyMemberForm.firstName.trim(),
				editFamilyMemberForm.lastName.trim(),
				editFamilyMemberForm.role,
			);
			const members = await getFamilyMembers(currentUser.accountId);
			setFamilyMembers(members);
			setShowEditFamilyMemberModal(false);
			setFamilyMemberSuccess('Family member updated successfully.');
		} catch (error: any) {
			setAddFamilyMemberError(error.message || 'Failed to update family member');
		} finally {
			setIsSavingFamilyMemberEdit(false);
		}
	};

	const handleRestartOnboarding = async () => {
		if (!currentUser) return;

		setIsRestartingOnboarding(true);
		try {
			// Reset onboarding completion flag in Firestore
			await updateUser({
				id: currentUser.id,
				updates: { onboardingCompleted: false },
			}).unwrap();

			// Update local Redux state immediately
			dispatch(
				setCurrentUser({
					...currentUser,
					onboardingCompleted: false,
				}),
			);

			// Navigate back to dashboard so the onboarding modal shows
			navigate('/dashboard');
		} catch (error) {
			console.error('Failed to restart onboarding:', error);
		} finally {
			setIsRestartingOnboarding(false);
		}
	};

	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault();
		setPasswordError('');
		setPasswordSuccess('');

		// Validation
		if (!passwordForm.currentPassword) {
			setPasswordError('Current password is required');
			return;
		}
		if (!passwordForm.newPassword) {
			setPasswordError('New password is required');
			return;
		}
		if (passwordForm.newPassword.length < 6) {
			setPasswordError('New password must be at least 6 characters');
			return;
		}
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			setPasswordError('New passwords do not match');
			return;
		}

		setIsChangingPassword(true);

		try {
			const user = auth.currentUser;
			if (!user || !user.email) {
				setPasswordError('User not authenticated');
				return;
			}

			// Reauthenticate user with current password
			const credential = EmailAuthProvider.credential(
				user.email,
				passwordForm.currentPassword,
			);
			await reauthenticateWithCredential(user, credential);

			// Update password
			await updatePassword(user, passwordForm.newPassword);

			setPasswordSuccess('Password updated successfully!');
			setPasswordForm({
				currentPassword: '',
				newPassword: '',
				confirmPassword: '',
			});
			setTimeout(() => {
				setShowPasswordModal(false);
				setPasswordSuccess('');
			}, 2000);
		} catch (error: any) {
			console.error('Password change error:', error);
			if (error.code === 'auth/wrong-password') {
				setPasswordError('Current password is incorrect');
			} else if (error.code === 'auth/weak-password') {
				setPasswordError('New password is too weak');
			} else if (error.code === 'auth/requires-recent-login') {
				setPasswordError(
					'Please log out and log back in before changing your password',
				);
			} else {
				setPasswordError('Failed to update password. Please try again.');
			}
		} finally {
			setIsChangingPassword(false);
		}
	};

	const handleCancelSubscription = async () => {
		if (!currentUser?.subscription?.stripeSubscriptionId) return;
		if (subscriptionError) {
			setSubscriptionError(false);
		}

		setIsCancellingSubscription(true);
		setCancelSubscriptionError('');

		try {
			await cancelSubscription(currentUser.subscription.stripeSubscriptionId);
			setShowCancelSubscriptionModal(false);
			// The webhook will update the user's subscription status
			window.location.reload(); // Refresh to show updated status
		} catch (error: any) {
			console.error('Cancel subscription error:', error);
			setCancelSubscriptionError(
				'Failed to cancel subscription. Please try again.',
			);
		} finally {
			setIsCancellingSubscription(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (!currentUser) return;

		setDeleteAccountError('');
		setIsDeletingAccount(true);

		try {
			const deleteUserAccount = httpsCallable(functions, 'deleteUserAccount');
			await deleteUserAccount({ userId: currentUser.id });

			// Sign out the user
			await signOut(auth);

			// Redirect to login page
			navigate('/login');
		} catch (error: any) {
			console.error('Delete account error:', error);
			if (error.code === 'functions/permission-denied') {
				setDeleteAccountError('You can only delete your own account.');
			} else if (error.code === 'functions/failed-precondition') {
				setDeleteAccountError(
					'You cannot delete your account while you have an active subscription. Please cancel your subscription first.',
				);
			} else if (error.code === 'functions/internal') {
				setDeleteAccountError(
					'Failed to delete account. Please contact support.',
				);
			} else {
				setDeleteAccountError('An error occurred while deleting your account.');
			}
		} finally {
			setIsDeletingAccount(false);
		}
	};

	return (
		<Container>
			<Title>Settings</Title>
			<SettingsLayout>
				<CategorySidebar>
					{visibleCategories.map((category) => (
						<CategoryNavButton
							key={category.key}
							type='button'
							active={activeCategory === category.key}
							onClick={() => setActiveCategory(category.key)}>
							{category.label}
						</CategoryNavButton>
					))}
				</CategorySidebar>

				<CategoryContent>
					<MobileCategoryPicker>
						<CategorySelect
							value={activeCategory}
							onChange={(e) =>
								setActiveCategory(e.target.value as SettingsCategoryKey)
							}>
							{visibleCategories.map((category) => (
								<option key={category.key} value={category.key}>
									{category.label}
								</option>
							))}
						</CategorySelect>
					</MobileCategoryPicker>

					<CategoryPanel>

					{activeCategory === 'billing' && canViewPlanSection && (
						<>
							{subscription?.hasScheduledSubscription &&
								subscription?.scheduledPlan &&
								subscription?.trialEndsAt && (
									<ScheduledSubscriptionBanner
										scheduledPlan={subscription.scheduledPlan}
										trialEndsAt={subscription.trialEndsAt}
										onManageClick={() => navigate('/paywall')}
									/>
								)}
							{isTrialExpired(subscription) && (
								<ExpiredTrialBanner onUpgradeClick={() => navigate('/paywall')} />
							)}
							<SubscriptionSection>
								<SubscriptionHeader>
									<PlanName>{planDetails?.name || 'Unknown Plan'}</PlanName>
									<PlanStatus status={planStatusDisplay}>
										{planStatusDisplay}
									</PlanStatus>
								</SubscriptionHeader>

								{shouldShowTrialInfo && (
									<TrialInfo>
										<TrialText>
											{trialDaysRemaining === -1
												? '🎉 You have unlimited access with your promo code'
												: `You have ${trialDaysRemaining} days left in your current access period`}
										</TrialText>
									</TrialInfo>
								)}

								{isFreePlan && (
									<FreePlanInfo>
										<FreePlanText>
											Your free plan remains available for as long as your account stays on the free tier.
										</FreePlanText>
									</FreePlanInfo>
								)}

								<PlanDetails>
									<PlanPrice>${planDetails?.priceMonthly || 0}/month</PlanPrice>
									<PlanFeatures>
										{planDetails?.features.map((feature, index) => (
											<PlanFeature key={index}>{feature}</PlanFeature>
										))}
									</PlanFeatures>
								</PlanDetails>

								<ButtonContainer>
									<UpgradeButton onClick={() => navigate('/paywall')}>
										{isFreePlan
											? 'Upgrade Plan'
											: 'Change Plan'}
									</UpgradeButton>
									{subscription.status === 'active' &&
										subscription.stripeSubscriptionId && (
											<CancelButton
												onClick={() => setShowCancelSubscriptionModal(true)}>
												Cancel Subscription
											</CancelButton>
										)}
								</ButtonContainer>
							</SubscriptionSection>
						</>
					)}

					{activeCategory === 'family' && !isTenant && canManageFamilyRoles && (
						<AccountSection>
						<SectionTitle>Family Members</SectionTitle>
						<p style={{ marginBottom: '16px', color: '#6b7280' }}>
							Add family members to share your subscription. They get full
							account access based on the role you assign.
						</p>
						{familyMemberSuccess && (
							<SuccessMessage>{familyMemberSuccess}</SuccessMessage>
						)}

						{nonOwnerFamilyMembers.length > 0 && (
							<FamilyMembersList>
								<FamilyMembersLabel>Current Family Members:</FamilyMembersLabel>
								{nonOwnerFamilyMembers.map((member) => (
									<FamilyMemberCard key={member.id}>
										<FamilyMemberInfo>
											<FamilyMemberName>
												{member.firstName} {member.lastName}
											</FamilyMemberName>
											<FamilyMemberEmail>{member.email}</FamilyMemberEmail>
											<FamilyMemberRole>
												{String(member.role || 'member')}
											</FamilyMemberRole>
										</FamilyMemberInfo>
										<FamilyMemberActions>
											{member.id !== currentUser?.accountId && (
												<FamilyMemberActionButton
													type='button'
													variant='edit'
													onClick={() => handleOpenEditFamilyMember(member)}>
													Edit
												</FamilyMemberActionButton>
											)}
											<FamilyMemberSupportActions>
												<FamilyMemberActionButton
													type='button'
													variant='reset'
													onClick={() => handleResendPasswordSetup(member.id)}>
													Resend Password Setup
												</FamilyMemberActionButton>
												<FamilyMemberActionButton
													type='button'
													variant='remove'
													onClick={() => handleRemoveFamilyMember(member.id)}>
													Remove
												</FamilyMemberActionButton>
											</FamilyMemberSupportActions>
										</FamilyMemberActions>
									</FamilyMemberCard>
								))}
							</FamilyMembersList>
						)}

						{canAddMoreFamilyMembers && (
							<AccountButton onClick={() => setShowAddFamilyMemberModal(true)}>
								Add Family Member
							</AccountButton>
						)}

						{!canAddMoreFamilyMembers && (
							<p
								style={{
									color: '#6b7280',
									fontSize: '14px',
									marginTop: '8px',
								}}>
								Family accounts are limited to 2 family members (plus the
								account owner).
							</p>
						)}

						{isLoadingFamilyMembers && (
							<p
								style={{
									color: '#6b7280',
									fontSize: '14px',
									marginTop: '8px',
								}}>
								Loading family account details...
							</p>
						)}
					</AccountSection>
			)}

					{activeCategory === 'account' && (
						<AccountSection>
							<SectionTitle>Account Settings</SectionTitle>
							{subscriptionError && (
								<ErrorMessage style={{ marginBottom: '16px' }}>
									You must cancel your active subscription before deleting your
									account.
								</ErrorMessage>
							)}
							<AccountActions>
								<AccountButton onClick={() => navigate('/profile')}>
									{isTeamMemberAccount ? 'View Profile' : 'Edit Profile'}
								</AccountButton>
								<AccountButton onClick={() => setShowPasswordModal(true)}>
									Change Password
								</AccountButton>
								<DeleteAccountButton
									disabled={
										subscription.status === 'active' ||
										subscription.status === 'past_due'
									}
									onClick={() => {
										if (
											subscription.status === 'active' ||
											subscription.status === 'past_due'
										) {
											setSubscriptionError(true);
										} else if (
											subscription.status === 'trial' ||
											subscription.status === 'expired'
										) {
											setShowDeleteAccountModal(true);
										} else {
											setShowDeleteAccountModal(true);
										}
									}}>
									Delete Account
								</DeleteAccountButton>
							</AccountActions>
						</AccountSection>
					)}

					{activeCategory === 'notifications' && !isTenant && (
						<NotificationPreferences
							currentUser={currentUser}
							defaultCollapsed={false}
						/>
					)}

					{activeCategory === 'getting-started' && !isTenant && (
						<AccountSection>
					<SectionTitle>Getting Started</SectionTitle>
					<p style={{ marginBottom: '16px', color: '#6b7280' }}>
						Need a refresher on Maintley? Restart the guided tour to learn about
						key features and get the most out of the app.
					</p>
					<AccountButton
						disabled={isRestartingOnboarding}
						onClick={handleRestartOnboarding}>
						{isRestartingOnboarding ? 'Starting Tour...' : 'Start Guided Tour'}
					</AccountButton>
				</AccountSection>
					)}

					{activeCategory === 'support' && (
						<>
							<AccountSection>
								<SectionTitle>Feedback & Support</SectionTitle>
								<p style={{ marginBottom: '16px', color: '#6b7280' }}>
									Help us improve Maintley by sharing your feedback, reporting bugs,
									or requesting new features.
								</p>
								<AccountButton onClick={() => setShowFeedbackModal(true)}>
									Submit Feedback
								</AccountButton>

								{loadingMySupportTickets ? (
									<p style={{ marginTop: '14px', color: '#6b7280' }}>
										Loading your support requests...
									</p>
								) : null}

								{mySupportTicketsError ? (
									<ErrorMessage style={{ marginTop: '14px' }}>
										Unable to load your support requests right now. Please refresh and try again.
									</ErrorMessage>
								) : null}

								<SupportTicketHeaderBar>
									<SupportTicketFilterLabel>My Tickets</SupportTicketFilterLabel>
									<div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
										<SupportTicketFilterGroup>
											<SupportTicketFilterButton
												type='button'
												active={supportTicketFilter === 'active'}
												onClick={() => setSupportTicketFilter('active')}>
												Open
											</SupportTicketFilterButton>
											<SupportTicketFilterButton
												type='button'
												active={supportTicketFilter === 'closed'}
												onClick={() => setSupportTicketFilter('closed')}>
												Closed
											</SupportTicketFilterButton>
										</SupportTicketFilterGroup>
										<SupportTicketRefreshButton
											$isRefreshing={Boolean(loadingMySupportTickets || fetchingMySupportTickets)}
											type='button'
											onClick={() => refetchMySupportTickets()}
											title='Refresh tickets'
											aria-label='Refresh tickets'>
											↻
										</SupportTicketRefreshButton>
									</div>
								</SupportTicketHeaderBar>

								{filteredSupportTickets && filteredSupportTickets.length > 0 ? (
									<SupportTicketList>
										{filteredSupportTickets.map((ticket) => {
											const displayTicketNumber =
												ticket.ticketNumber || `Ticket ${ticket.id.slice(-6).toUpperCase()}`;

											return (
											<SupportTicketCard key={ticket.id}>
												<SupportTicketHeader>
													<div>
														<SupportTicketSubject>
															Ticket Number: {displayTicketNumber}
														</SupportTicketSubject>
													</div>
													<SupportTicketStatus>
														{formatSupportStatus(getEffectiveSupportStatus(ticket))}
													</SupportTicketStatus>
												</SupportTicketHeader>
												<SupportTicketMetaGrid>
													<SupportTicketMetaBlock>
														<SupportTicketMetaLabel>Type</SupportTicketMetaLabel>
														<SupportTicketMetaValue>
															{formatSupportStatus(String(ticket.type || 'feedback'))}
														</SupportTicketMetaValue>
													</SupportTicketMetaBlock>
													<SupportTicketMetaBlock>
														<SupportTicketMetaLabel>Submitted</SupportTicketMetaLabel>
														<SupportTicketMetaValue>{formatSupportDate(ticket.createdAt)}</SupportTicketMetaValue>
													</SupportTicketMetaBlock>
													<SupportTicketMetaBlock>
														<SupportTicketMetaLabel>Last Updated</SupportTicketMetaLabel>
														<SupportTicketMetaValue>
															{formatSupportDate(ticket.updatedAt || ticket.createdAt)}
														</SupportTicketMetaValue>
													</SupportTicketMetaBlock>
												</SupportTicketMetaGrid>
												<SupportTicketSection>
													<SupportTicketSectionLabel>Subject</SupportTicketSectionLabel>
													<SupportTicketMeta>{renderLinkedText(ticket.subject || '(No subject)')}</SupportTicketMeta>
												</SupportTicketSection>
												<SupportTicketSection>
													<SupportTicketSectionLabel>Message</SupportTicketSectionLabel>
													<SupportTicketMessage>{renderLinkedText(ticket.message)}</SupportTicketMessage>
												</SupportTicketSection>
												{ticket.resolutionNotes ? (
													<SupportTicketSection>
														<SupportTicketSectionLabel>Maintley Update</SupportTicketSectionLabel>
														<SupportTicketMeta>{renderLinkedText(ticket.resolutionNotes)}</SupportTicketMeta>
													</SupportTicketSection>
												) : null}
												{Array.isArray(ticket.attachments) &&
												ticket.attachments.length > 0 ? (
													<SupportTicketSection>
														<SupportTicketSectionLabel>Attachments</SupportTicketSectionLabel>
														<SupportAttachmentList>
															{ticket.attachments.map((attachment, index) => {
																const href = ensureAbsoluteUrl(attachment?.attachmentUrl);
																const label =
																	attachment?.filename ||
																	`Attachment ${index + 1}`;
																return (
																	<li key={`${ticket.id}-attachment-${index}`}>
																		{href ? (
																			<a href={href} target='_blank' rel='noopener noreferrer'>
																				{label}
																			</a>
																		) : (
																			label
																		)}
																	</li>
																);
															})}
														</SupportAttachmentList>
													</SupportTicketSection>
												) : null}
											</SupportTicketCard>
											);
										})}
									</SupportTicketList>
								) : (
									<p style={{ marginTop: '14px', color: '#6b7280' }}>
										You have no {supportTicketFilter === 'active' ? 'open' : 'closed'} support requests.
									</p>
								)}
							</AccountSection>

							<AccountSection>
								<SectionTitle>Help & Resources</SectionTitle>
								<p style={{ marginBottom: '16px', color: '#6b7280' }}>
									Learn about all the features available in Maintley and get help
									when you need it.
								</p>
								<ResourceButtons>
									<AccountButton onClick={() => navigate('/help')}>
										Open Help Center
									</AccountButton>
								</ResourceButtons>
							</AccountSection>
						</>
					)}

					{activeCategory === 'legal' && (
						<AccountSection>
							<SectionTitle>Legal</SectionTitle>
							<p style={{ marginBottom: '16px', color: '#6b7280' }}>
								Review our legal documents and terms of service.
							</p>
							<AccountButton onClick={() => navigate('/legal')}>
								View Legal Documents
							</AccountButton>
						</AccountSection>
					)}
					</CategoryPanel>
				</CategoryContent>
			</SettingsLayout>

			{/* Password Change Modal */}
			<GenericModal
				isOpen={showPasswordModal}
				title='Change Password'
				onClose={() => {
					setShowPasswordModal(false);
					setPasswordError('');
					setPasswordSuccess('');
					setPasswordForm({
						currentPassword: '',
						newPassword: '',
						confirmPassword: '',
					});
				}}
				primaryButtonLabel='Update Password'
				secondaryButtonLabel='Cancel'
				isLoading={isChangingPassword}
				onSubmit={handlePasswordChange}>
				{passwordError && <ErrorMessage>{passwordError}</ErrorMessage>}
				{passwordSuccess && <SuccessMessage>{passwordSuccess}</SuccessMessage>}

				<FormGroup>
					<FormLabel>Current Password</FormLabel>
					<FormInput
						type='password'
						value={passwordForm.currentPassword}
						onChange={(e) =>
							setPasswordForm({
								...passwordForm,
								currentPassword: e.target.value,
							})
						}
						placeholder='Enter your current password'
						required
					/>
				</FormGroup>

				<FormGroup>
					<FormLabel>New Password</FormLabel>
					<FormInput
						type='password'
						value={passwordForm.newPassword}
						onChange={(e) =>
							setPasswordForm({
								...passwordForm,
								newPassword: e.target.value,
							})
						}
						placeholder='Enter your new password'
						required
					/>
				</FormGroup>

				<FormGroup>
					<FormLabel>Confirm New Password</FormLabel>
					<FormInput
						type='password'
						value={passwordForm.confirmPassword}
						onChange={(e) =>
							setPasswordForm({
								...passwordForm,
								confirmPassword: e.target.value,
							})
						}
						placeholder='Confirm your new password'
						required
					/>
				</FormGroup>

				<PasswordHelp>
					Password must be at least 6 characters long.
				</PasswordHelp>
			</GenericModal>

			<GenericModal
				isOpen={showFeedbackModal}
				title='Submit Feedback'
				showActions={false}
				onClose={() => setShowFeedbackModal(false)}>
				<FeedbackForm onClose={() => setShowFeedbackModal(false)} />
			</GenericModal>

			{/* Delete Account Modal */}

			<GenericModal
				isOpen={showDeleteAccountModal}
				title='Delete Account'
				onClose={() => {
					setShowDeleteAccountModal(false);
					setDeleteAccountError('');
				}}
				primaryButtonLabel={
					deleteAccountError?.includes('active subscription')
						? 'Close'
						: 'Delete Account'
				}
				secondaryButtonLabel={
					deleteAccountError?.includes('active subscription')
						? undefined
						: 'Cancel'
				}
				isLoading={isDeletingAccount}
				showActions={true}
				onSubmit={
					deleteAccountError?.includes('active subscription')
						? () => setShowDeleteAccountModal(false)
						: handleDeleteAccount
				}>
				{deleteAccountError && (
					<ErrorMessage>{deleteAccountError}</ErrorMessage>
				)}

				{deleteAccountError?.includes('active subscription') ? (
					<div>
						<p style={{ marginBottom: '16px', color: '#6b7280' }}>
							To delete your account, you must first cancel your active
							subscription. This ensures proper billing closure and prevents any
							unexpected charges.
						</p>
						<p style={{ marginBottom: '16px', color: '#6b7280' }}>
							You can cancel your subscription in the{' '}
							<strong>Subscription Management</strong> section above.
						</p>
					</div>
				) : (
					<div>
						<p style={{ marginBottom: '16px', color: '#6b7280' }}>
							<strong>Warning:</strong> This action cannot be undone. If you are
							the original owner of any properties, all your properties and
							associated data will be permanently deleted. If you are a co-owner
							or shared user, you will lose access to shared properties but the
							properties themselves will remain.
						</p>
						<p style={{ marginBottom: '16px', color: '#6b7280' }}>
							Are you sure you want to delete your account?
						</p>
					</div>
				)}
			</GenericModal>

			{/* Cancel Subscription Modal */}
			<GenericModal
				isOpen={showCancelSubscriptionModal}
				title='Cancel Subscription'
				onClose={() => {
					setShowCancelSubscriptionModal(false);
					setCancelSubscriptionError('');
				}}
				primaryButtonLabel='Cancel Subscription'
				secondaryButtonLabel='Keep Subscription'
				isLoading={isCancellingSubscription}
				showActions={true}
				onSubmit={handleCancelSubscription}>
				{cancelSubscriptionError && (
					<ErrorMessage>{cancelSubscriptionError}</ErrorMessage>
				)}

				<p style={{ marginBottom: '16px', color: '#6b7280' }}>
					<strong>Important:</strong> Your subscription will remain active until
					the end of your current billing period. You will continue to have
					access to all features until then.
				</p>

				<p style={{ marginBottom: '16px', color: '#6b7280' }}>
					After cancellation, you can reactivate your subscription at any time
					from the paywall page.
				</p>

				<p style={{ marginBottom: '16px', color: '#dc2626' }}>
					Are you sure you want to cancel your subscription?
				</p>
			</GenericModal>

			{canManageFamilyRoles && (
				<GenericModal
					isOpen={showEditFamilyMemberModal}
					onClose={() => {
						setShowEditFamilyMemberModal(false);
						setAddFamilyMemberError('');
					}}
					title='Edit Family Member'
					primaryButtonLabel={isSavingFamilyMemberEdit ? 'Saving...' : 'Save'}
					primaryButtonAction={handleSaveFamilyMemberEdit}
					secondaryButtonLabel='Cancel'
					showActions={true}
					primaryButtonDisabled={isSavingFamilyMemberEdit}>
					<FormGroup>
						<FormLabel>First Name</FormLabel>
						<FormInput
							type='text'
							value={editFamilyMemberForm.firstName}
							onChange={(e) =>
								setEditFamilyMemberForm((prev) => ({
									...prev,
									firstName: e.target.value,
								}))
							}
							placeholder='Enter first name'
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Last Name</FormLabel>
						<FormInput
							type='text'
							value={editFamilyMemberForm.lastName}
							onChange={(e) =>
								setEditFamilyMemberForm((prev) => ({
									...prev,
									lastName: e.target.value,
								}))
							}
							placeholder='Enter last name'
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Email Address</FormLabel>
						<FormInput
							type='email'
							value={editFamilyMemberForm.email}
							readOnly
							disabled
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Role</FormLabel>
						<select
							value={editFamilyMemberForm.role}
							onChange={(e) =>
								setEditFamilyMemberForm((prev) => ({
									...prev,
									role: e.target.value as 'admin' | 'member',
								}))
							}
							style={{
								width: '100%',
								padding: '12px',
								border: '1px solid #d1d5db',
								borderRadius: '8px',
								fontSize: '14px',
								background: '#fff',
							}}>
							<option value='admin'>Admin</option>
							<option value='member'>Member</option>
						</select>
					</FormGroup>

					{addFamilyMemberError && (
						<ErrorMessage style={{ marginTop: '16px' }}>
							{addFamilyMemberError}
						</ErrorMessage>
					)}
				</GenericModal>
			)}

			{canManageFamilyRoles && (
				<GenericModal
					isOpen={showAddFamilyMemberModal}
					onClose={() => {
						setShowAddFamilyMemberModal(false);
						setFamilyMemberForm({
							firstName: '',
							lastName: '',
							email: '',
							role: 'member',
						});
						setAddFamilyMemberError('');
					}}
					title='Add Family Member'
					primaryButtonLabel={isAddingFamilyMember ? 'Adding...' : 'Add Member'}
					primaryButtonAction={handleAddFamilyMember}
					secondaryButtonLabel='Cancel'
					showActions={true}
					primaryButtonDisabled={isAddingFamilyMember}>
					<FormGroup>
						<FormLabel>First Name</FormLabel>
						<FormInput
							type='text'
							value={familyMemberForm.firstName}
							onChange={(e) =>
								setFamilyMemberForm((prev) => ({
									...prev,
									firstName: e.target.value,
								}))
							}
							placeholder='Enter first name'
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Last Name</FormLabel>
						<FormInput
							type='text'
							value={familyMemberForm.lastName}
							onChange={(e) =>
								setFamilyMemberForm((prev) => ({
									...prev,
									lastName: e.target.value,
								}))
							}
							placeholder='Enter last name'
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Email Address</FormLabel>
						<FormInput
							type='email'
							value={familyMemberForm.email}
							onChange={(e) =>
								setFamilyMemberForm((prev) => ({
									...prev,
									email: e.target.value,
								}))
							}
							placeholder='Enter email address'
						/>
					</FormGroup>

					{canManageFamilyRoles ? (
						<FormGroup>
							<FormLabel>Role</FormLabel>
							<select
								value={familyMemberForm.role}
								onChange={(e) =>
									setFamilyMemberForm((prev) => ({
										...prev,
										role: e.target.value as 'owner' | 'admin' | 'member',
									}))
								}
								style={{
									width: '100%',
									padding: '12px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									fontSize: '14px',
									background: '#fff',
								}}>
								<option value='owner'>Owner</option>
								<option value='admin'>Admin</option>
								<option value='member'>Member</option>
							</select>
						</FormGroup>
					) : null}

					{addFamilyMemberError && (
						<ErrorMessage style={{ marginTop: '16px' }}>
							{addFamilyMemberError}
						</ErrorMessage>
					)}

					<p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
						The family member account is created immediately and they receive a
						password setup email to activate access.
					</p>
				</GenericModal>
			)}
		</Container>
	);
};
