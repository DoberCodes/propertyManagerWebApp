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
import { cancelSubscription } from 'services/stripeService';
import { useAppFeedback } from 'Components/Library/AppFeedback/AppFeedbackProvider';
import { useUpdateUserMutation } from 'Redux/API/userSlice';
import { setCurrentUser, WorkspaceMode } from 'Redux/Slices/userSlice';
import { selectIsHomeowner } from 'Redux/selectors/permissionSelectors';
import {
	addFamilyMember,
	removeFamilyMember,
	getFamilyMembers,
	updateFamilyMember,
	resendPasswordReset,
} from 'services/authService';
import { NotificationPreferences } from 'pages/SettingsPage/NotificationPreferences';
import { Container } from 'Components/SeasonalMaintenance.styles';
import { Title, SettingsLayout, CategorySidebar, CategoryNavButton, CategoryContent, MobileCategoryPicker, CategorySelect, CategoryPanel, Section, AccountButton, ErrorMessage } from './SettingPage.styles';
import { AccountManagement } from './AccountManagement';
import { FamilyManagement } from './FamilyManagement';
import { shouldBypassOnboarding } from 'utils/userAccount';
import { isMaintleyOwner } from 'utils/maintleyRole';
import { PersonalAssistantSettings } from './PersonalAssistantSettings';

export const SettingsPage: React.FC = () => {
	type SettingsCategoryKey =
		| 'billing'
		| 'family'
		| 'account'
		| 'notifications'
		| 'getting-started'
		| 'experience'
		| 'personal-assistant'
		| 'legal';

	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const feedback = useAppFeedback();

	// User and permissions
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isHomeownerExperience = useSelector(selectIsHomeowner);
	const isTenant = currentUser?.role === 'tenant';
	const canUseOnboarding = !isTenant && !shouldBypassOnboarding(currentUser);
	const canManageFamilyRoles =
		currentUser?.isAccountOwner ||
		currentUser?.accountId === currentUser?.id ||
		currentUser?.role === 'admin';
	const canManageWorkspaceMode =
		!!currentUser &&
		!isTenant &&
		(currentUser.isAccountOwner === true ||
			!currentUser.accountId ||
			currentUser.accountId === currentUser.id);
	const canManagePersonalAssistant = isMaintleyOwner(currentUser?.maintley_role);


	// API mutations
	const [updateUser] = useUpdateUserMutation();

	// UI states
	const [familyMembers, setFamilyMembers] = useState<any[]>([]);
	const [familyToResetPassword, setFamilyToResetPassword] = useState<any>(null);
	const [familyMemberToRemove, setFamilyMemberToRemove] = useState<any>(null);
	const [activeCategory, setActiveCategory] = useState<SettingsCategoryKey>('account');
	const [searchParams, setSearchParams] = useSearchParams();
	const [isRestartingOnboarding, setIsRestartingOnboarding] = useState(false);
	const [isSavingWorkspaceMode, setIsSavingWorkspaceMode] = useState(false);
	const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('homeowner');


	// loading States
	const [isRemovingFamilyMember, setIsRemovingFamilyMember] = useState(false);
	const [isLoadingFamilyMembers, setIsLoadingFamilyMembers] = useState(false);
	const [familyMemberSuccess, setFamilyMemberSuccess] = useState('');
	const [isAddingFamilyMember, setIsAddingFamilyMember] = useState(false);
	const [isSavingFamilyMemberEdit, setIsSavingFamilyMemberEdit] = useState(false);
	const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
	const [isResendingFamilyPasswordSetup, setIsResendingFamilyPasswordSetup] = useState(false);

	// Success/Error states
	const [addFamilyMemberError, setAddFamilyMemberError] = useState('');
	const [cancelSubscriptionError, setCancelSubscriptionError] = useState('');

	useEffect(() => {
		setWorkspaceMode(
			currentUser?.workspaceMode ||
				(isHomeownerExperience ? 'homeowner' : 'property_operator'),
		);
	}, [currentUser?.workspaceMode, isHomeownerExperience]);

	// Modal states
	const [showAddFamilyMemberModal, setShowAddFamilyMemberModal] = useState(false);
	const [showEditFamilyMemberModal, setShowEditFamilyMemberModal] = useState(false);
	const [showRemoveFamilyMemberModal, setShowRemoveFamilyMemberModal] = useState(false);
	const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] = useState(false);
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
				visible: canUseOnboarding,
			},
			{
				key: 'account' as SettingsCategoryKey,
				label: 'Billing',
				visible: true,
			},
			{
				key: 'experience' as SettingsCategoryKey,
				label: 'App Experience',
				visible: canManageWorkspaceMode,
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
				key: 'personal-assistant' as SettingsCategoryKey,
				label: 'Personal Assistant',
				visible: canManagePersonalAssistant,
			},
			{
				key: 'legal' as SettingsCategoryKey,
				label: 'Legal',
				visible: true,
			},
		],
		[canManageFamilyRoles, canManagePersonalAssistant, canManageWorkspaceMode, canUseOnboarding, isTenant],
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

		if (category === 'support') {
			navigate('/support', { replace: true });
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
	}, [categoryOptions, navigate, searchParams, setSearchParams]);

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
		if (!currentUser || !canUseOnboarding) return;

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

	const handleSaveWorkspaceMode = async () => {
		if (!currentUser || !canManageWorkspaceMode) return;

		setIsSavingWorkspaceMode(true);
		try {
			await updateUser({
				id: currentUser.id,
				updates: { workspaceMode },
			}).unwrap();
			dispatch(setCurrentUser({ ...currentUser, workspaceMode }));
			feedback.notify('App terminology updated.');
		} catch (error) {
			console.error('Failed to update app experience:', error);
			feedback.notify('Could not update app terminology. Please try again.');
		} finally {
			setIsSavingWorkspaceMode(false);
		}
	};


	const handleCancelSubscription = async () => {
		if (!currentUser?.subscription?.stripeSubscriptionId) return;

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

						{activeCategory === 'getting-started' && canUseOnboarding && (
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
							<AccountManagement setShowCancelSubscriptionModal={setShowCancelSubscriptionModal} />
						)}

						{activeCategory === 'experience' && canManageWorkspaceMode && (
							<Section>
								<SectionTitle>App Experience</SectionTitle>
								<p style={{ marginBottom: '16px', color: '#6b7280' }}>
									Maintley normally chooses home or property terminology from your
									effective plan. You can override that language here without changing
									your plan, billing, or feature access.
								</p>
								<FormGroup>
									<FormLabel>I primarily use Maintley for</FormLabel>
									<FormInput
										as='select'
										value={workspaceMode}
										onChange={(event) =>
											setWorkspaceMode(event.target.value as WorkspaceMode)
										}>
										<option value='homeowner'>My home or homes</option>
										<option value='property_operator'>Rental or managed properties</option>
									</FormInput>
								</FormGroup>
								<AccountButton
									disabled={isSavingWorkspaceMode}
									onClick={handleSaveWorkspaceMode}>
									{isSavingWorkspaceMode ? 'Saving...' : 'Save App Experience'}
								</AccountButton>
							</Section>
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

						{activeCategory === 'personal-assistant' && canManagePersonalAssistant && (
							<PersonalAssistantSettings />
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
