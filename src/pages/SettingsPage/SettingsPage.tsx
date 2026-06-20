import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from 'Redux/store/store';
import {
	GenericModal,
	FormGroup,
	FormLabel,
	FormInput,
	SectionTitle,
} from 'Components/Library';
import { FeedbackForm } from 'Components/FeedbackForm';
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
	updateFamilyMember,
	resendPasswordReset,
} from 'services/authService';
import { NotificationPreferences } from 'pages/SettingsPage/NotificationPreferences';
import { hasMaintleyAdminAccess } from 'utils/maintleyRole';
import { Container } from 'Components/SeasonalMaintenance.styles';
import { Title, SettingsLayout, CategorySidebar, CategoryNavButton, CategoryContent, MobileCategoryPicker, CategorySelect, CategoryPanel, Section, AccountButton, ErrorMessage, ButtonContainer, SuccessMessage, SupportTicketHeaderBar, SupportTicketFilterLabel, SupportTicketFilterGroup, SupportTicketFilterButton, SupportTicketRefreshButton, SupportTicketList, SupportTicketCard, SupportTicketHeader, SupportTicketSubject, SupportTicketStatus, SupportTicketMetaGrid, SupportTicketMetaBlock, SupportTicketMetaLabel, SupportTicketMetaValue, SupportTicketSection, SupportTicketSectionLabel, SupportTicketMeta, SupportTicketMessage, SupportAttachmentList, ResourceButtons, PasswordHelp } from './SettingPage.styles';
import { AccountManagement } from './AccountManagement';
import { FamilyManagement } from './FamilyManagement';

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

	// User and permissions
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const canAccessMaintleyAdmin = hasMaintleyAdminAccess(currentUser?.maintley_role ?? null);
	const isTenant = currentUser?.role === 'tenant';
	const canManageFamilyRoles =
		currentUser?.isAccountOwner ||
		currentUser?.accountId === currentUser?.id ||
		currentUser?.role === 'admin';


	// API mutations and queries
	const [updateUser] = useUpdateUserMutation();
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

	// UI states
	const [familyMembers, setFamilyMembers] = useState<any[]>([]);
	const [familyToResetPassword, setFamilyToResetPassword] = useState<any>(null);
	const [familyMemberToRemove, setFamilyMemberToRemove] = useState<any>(null);
	const [activeCategory, setActiveCategory] = useState<SettingsCategoryKey>('account');
	const [supportTicketFilter, setSupportTicketFilter] = useState<'active' | 'closed'>('active');
	const [searchParams, setSearchParams] = useSearchParams();
	const [isRestartingOnboarding, setIsRestartingOnboarding] = useState(false);


	// loading States
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [isDeletingAccount, setIsDeletingAccount] = useState(false);
	const [isRemovingFamilyMember, setIsRemovingFamilyMember] = useState(false);
	const [isLoadingFamilyMembers, setIsLoadingFamilyMembers] = useState(false);
	const [familyMemberSuccess, setFamilyMemberSuccess] = useState('');
	const [isAddingFamilyMember, setIsAddingFamilyMember] = useState(false);
	const [isSavingFamilyMemberEdit, setIsSavingFamilyMemberEdit] = useState(false);
	const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
	const [isResendingFamilyPasswordSetup, setIsResendingFamilyPasswordSetup] = useState(false);

	// Success/Error states
	const [passwordError, setPasswordError] = useState('');
	const [passwordSuccess, setPasswordSuccess] = useState('');
	const [deleteAccountError, setDeleteAccountError] = useState('');
	const [addFamilyMemberError, setAddFamilyMemberError] = useState('');
	const [cancelSubscriptionError, setCancelSubscriptionError] = useState('');
	const [subscriptionError, setSubscriptionError] = useState(false);

	// Modal states
	const [showAddFamilyMemberModal, setShowAddFamilyMemberModal] = useState(false);
	const [showEditFamilyMemberModal, setShowEditFamilyMemberModal] = useState(false);
	const [showRemoveFamilyMemberModal, setShowRemoveFamilyMemberModal] = useState(false);
	const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] = useState(false);
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [showFeedbackModal, setShowFeedbackModal] = useState(false);
	const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
	const [showFamilyResetPasswordModal, setShowFamilyResetPasswordModal] = useState(false);

	// Form states
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
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

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

	const categoryOptions = useMemo(
		() => [
			{
				key: 'getting-started' as SettingsCategoryKey,
				label: 'Getting Started',
				visible: !isTenant,
			},
			{
				key: 'account' as SettingsCategoryKey,
				label: 'Account',
				visible: true,
			},
			{
				key: 'family' as SettingsCategoryKey,
				label: 'Family Members',
				visible: !isTenant && canManageFamilyRoles,
			},

			{
				key: 'notifications' as SettingsCategoryKey,
				label: 'Notifications',
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
		[canManageFamilyRoles, isTenant],
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

	const handleRemoveFamilyMember = async (memberId: string) => {
		if (!currentUser?.accountId || !canManageFamilyRoles) {
			return;
		}
		setIsRemovingFamilyMember(true);
		// Find the member being removed to get their name
		try {
			await removeFamilyMember(currentUser.accountId, memberId, currentUser.id);

			const members = await getFamilyMembers(currentUser.accountId);
			setFamilyMembers(members);
		} catch (error: any) {
			console.error('Failed to remove family member:', error);
			feedback.notify('Failed to remove family member. Please try again.');
		} finally {
			setIsRemovingFamilyMember(false);
			setShowRemoveFamilyMemberModal(false);
		}
	};

	const handleResendFamilyPasswordSetup = async (memberId: string) => {
		if (!currentUser?.accountId || !canManageFamilyRoles) {
			return;
		}
		setIsResendingFamilyPasswordSetup(true);
		try {
			await resendPasswordReset(currentUser.accountId, memberId);
			feedback.notify('Password setup email sent successfully!');
		} catch (error: any) {
			console.error('Failed to resend password setup email:', error);
			feedback.notify(
				error.message ||
				'Failed to resend password setup email. Please try again.',
			);
		} finally {
			setIsResendingFamilyPasswordSetup(false);
			setShowFamilyResetPasswordModal(false);
		}
	};


	const handleOpenAddFamilyMember = () => {
		setAddFamilyMemberError('');
		setFamilyMemberForm({
			firstName: '',
			lastName: '',
			email: '',
			role: 'member',
		});
		setShowAddFamilyMemberModal(true);
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

	const handleOpenRemoveFamilyMember = (memberId: string) => {
		const member = familyMembers.find((m) => m.id === memberId);
		setFamilyMemberToRemove(member);
		console.info(member, 'member to remove');
		if (!member) {
			feedback.notify('Family member not found');
			return;
		}
		setShowRemoveFamilyMemberModal(true);
	};

	const handleOpenResendFamilyPasswordSetup = (memberId: string) => {
		const member = familyMembers.find((m) => m.id === memberId);
		if (!member) {
			feedback.notify('Family member not found');
			return;
		}
		setFamilyToResetPassword(member);
		setShowFamilyResetPasswordModal(true);
	}

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

						{activeCategory === 'getting-started' && !isTenant && (
							<Section>
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
							</Section>
						)}


						{activeCategory === 'account' && (
							<AccountManagement setShowPasswordModal={setShowPasswordModal} setShowDeleteAccountModal={setShowDeleteAccountModal} setShowCancelSubscriptionModal={setShowCancelSubscriptionModal} subscriptionError={subscriptionError} setSubscriptionError={setSubscriptionError} />
						)}


						{activeCategory === 'family' && !isTenant && canManageFamilyRoles && (
							<FamilyManagement handleResendFamilyPasswordSetup={handleOpenResendFamilyPasswordSetup} handleRemoveFamilyMember={handleOpenRemoveFamilyMember} handleEditFamilyMember={handleOpenEditFamilyMember} handleAddFamilyMember={handleOpenAddFamilyMember} canManageFamilyRoles={canManageFamilyRoles} familyMembers={familyMembers} familyMemberSuccess={familyMemberSuccess} isLoadingFamilyMembers={isLoadingFamilyMembers} />
						)}


						{activeCategory === 'notifications' && !isTenant && (
							<NotificationPreferences
								currentUser={currentUser}
								defaultCollapsed={false}
							/>
						)}



						{activeCategory === 'support' && (
							<>
								<Section>
									<SectionTitle>Feedback & Support</SectionTitle>
									<p style={{ marginBottom: '16px', color: '#6b7280' }}>
										Help us improve Maintley by sharing your feedback, reporting bugs,
										or requesting new features.
									</p>
									<ButtonContainer>
										<AccountButton onClick={() => setShowFeedbackModal(true)}>
											Submit Feedback
										</AccountButton>
										{canAccessMaintleyAdmin ? (
											<AccountButton onClick={() => navigate('/admin')}>
												Open Admin Inbox
											</AccountButton>
										) : null}
									</ButtonContainer>

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

												console.info('Rendering support ticket:', ticket);
												const displayTicketNumber =
													ticket.ticketNumber || `Ticket ${ticket.id.slice(-6).toUpperCase()}`;
												const latestAdminNote = Array.isArray(ticket.adminNotes)
													? [...ticket.adminNotes]
														.filter((note) => String(note?.visibility || '').toLowerCase() === 'customer')
														.sort((a, b) => {
															const aDate = new Date(a.createdAt || a.date || 0).getTime();
															const bDate = new Date(b.createdAt || b.date || 0).getTime();
															return bDate - aDate;
														})[0]
													: null;

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
														{latestAdminNote ? (
															<SupportTicketSection resolutionNotes={latestAdminNote.note}>
																<SupportTicketSectionLabel>Latest Maintley Update - {formatSupportDate(latestAdminNote.createdAt || latestAdminNote.date)}</SupportTicketSectionLabel>
																<SupportTicketMeta>{renderLinkedText(latestAdminNote.note)}</SupportTicketMeta>
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
								</Section>

								<Section>
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
								</Section>
							</>
						)}

						{activeCategory === 'legal' && (
							<Section>
								<SectionTitle>Legal</SectionTitle>
								<p style={{ marginBottom: '16px', color: '#6b7280' }}>
									Review our legal documents and terms of service.
								</p>
								<AccountButton onClick={() => navigate('/legal')}>
									View Legal Documents
								</AccountButton>
							</Section>
						)}
					</CategoryPanel>
				</CategoryContent>
			</SettingsLayout>



			{/* Feedback Modal */}
			<GenericModal
				isOpen={showFeedbackModal}
				title='Submit Feedback'
				showActions={false}
				onClose={() => setShowFeedbackModal(false)}>
				<FeedbackForm onClose={() => setShowFeedbackModal(false)} />
			</GenericModal>

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



			{/* Add Family Member Modal */}
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

			{/* Edit Family Member Modal */}
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

			{/* Delete Family Member Modal */}
			{canManageFamilyRoles && (
				<GenericModal
					isOpen={showRemoveFamilyMemberModal}
					title='Remove Family Member'
					onClose={() => {
						setShowRemoveFamilyMemberModal(false);
						setFamilyMemberToRemove(null);
					}}
					primaryButtonLabel='Remove'
					secondaryButtonLabel='Cancel'
					isLoading={isRemovingFamilyMember}
					showActions={true}
					onSubmit={() => {
						if (familyMemberToRemove) {
							handleRemoveFamilyMember(familyMemberToRemove.id);
						}
					}}>
					<p style={{ marginBottom: '16px' }}>
						{`⚠️ WARNING: You are about to remove ${familyMemberToRemove?.firstName} from the
						family account. This will:`}
					</p>
					<ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
						<li>Delete their account</li>
						<li>Remove their access to the shared subscription</li>
					</ul>
					<p style={{ marginTop: '16px' }}>
						Their name will be preserved on all past activity and properties for audit purposes, but they will no longer have access to the account or any shared properties.
					</p>
					<p style={{ marginTop: '16px' }}>
						Are you sure you want to proceed?
					</p>
				</GenericModal >
			)
			}

			{/* Resend Family Password Setup Modal */}
			{canManageFamilyRoles && (
				<GenericModal
					isOpen={showFamilyResetPasswordModal}
					title='Resend Password Setup Email'
					onClose={() => {
						setShowFamilyResetPasswordModal(false);
					}}
					primaryButtonLabel='Resend Email'
					secondaryButtonLabel='Cancel'
					isLoading={isResendingFamilyPasswordSetup}
					showActions={true}
					onSubmit={() => {
						if (familyToResetPassword) {
							handleResendFamilyPasswordSetup(familyToResetPassword.id);
						}
					}}>
					<p style={{ marginBottom: '16px' }}>
						{`You are about to send a password reset email to ${familyToResetPassword?.firstName}.`}
					</p>
					<p style={{ marginBottom: '16px' }}>
						We currently have the following email address on file for this family member:
					</p>
					<p style={{ marginBottom: '16px', fontWeight: 'bold', color: '#2563eb' }}>
						{`${familyToResetPassword?.email}`}
					</p>
					<p style={{ marginBottom: '16px' }}>
						Are you sure you want to proceed?
					</p>
				</GenericModal>
			)
			}

		</Container >
	);
};
