import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
	Input,
	Wrapper,
	Submit,
	Title,
	BackButton,
	RegisterWrapper,
	ErrorMessage,
	LoadingSpinner,
	PasswordInputWrapper,
	PasswordToggleButton,
	SectionLabel,
	QuestionLabel,
	RadioGrid,
	RadioOption,
	ButtonGroup,
	PasswordMatchText,
	TenantPlanCard,
	TenantPlanTitle,
	TenantPlanPrice,
	TenantPlanNote,
	EmailStatusText,
	TrialNotice,
	InviteModePanel,
	InviteModeTitle,
	InviteModeDescription,
	InviteModeActionButton,
} from './RegistrationCard.styles';
import { faArrowCircleLeft } from '@fortawesome/free-solid-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	signUpWithEmail,
	checkEmailExists,
	validateTenantInviteForRegistration,
	validateTeamInviteForRegistration,
} from '../../services/authService';
import { redirectToCheckout } from '../../services/stripeService';
import { USER_ROLES } from '../../constants/roles';
import { useLocation, useNavigate } from 'react-router-dom';
import { setCurrentUser } from '../../Redux/Slices/userSlice';
import { PaywallPage } from '../../pages/PaywallPage/PaywallPage';
import DocumentViewer from '../DocumentViewer';
import { TRIAL_DURATION_DAYS } from '../../constants/subscriptions';
import {
	LEGAL_AGREEMENT_VERSION,
	createLegalAgreementDocuments,
} from '../../constants/legal';

// Map selected account type to appropriate role
const getRoleFromAccountType = (accountType: string): string => {
	const roleMapping: { [key: string]: string } = {
		homeowner: USER_ROLES.ADMIN, // Homeowners are admins of their properties
		propertyManager: USER_ROLES.PROPERTY_MANAGER,
		tenant: USER_ROLES.TENANT, // Tenants are self-registered tenants
		tenantInvite: USER_ROLES.TENANT,
	};
	return roleMapping[accountType] || USER_ROLES.ADMIN; // Default to admin
};

export const RegistrationCard = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	const [step, setStep] = useState<number>(1);
	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [emailChecking, setEmailChecking] = useState<boolean>(false);
	const [emailExists, setEmailExists] = useState<boolean>(false);
	const [password, setPassword] = useState<string>('');
	const [passwordConfirm, setPasswordConfirm] = useState<string>('');
	const [phoneNumber, setPhoneNumber] = useState<string>('');
	const [address, setAddress] = useState<string>('');
	const [confirmed, setConfirmed] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [showPasswordConfirm, setShowPasswordConfirm] =
		useState<boolean>(false);
	const [accountType, setAccountType] = useState<string>('');
	const [selectedPlan, setSelectedPlan] = useState<string>('');
	const [promoCode, setPromoCode] = useState<string>('');
	const [inviteCodeInput, setInviteCodeInput] = useState<string>('');
	const [inviteMode, setInviteMode] = useState<boolean>(false);
	const [inviteType, setInviteType] = useState<'tenant' | 'team'>('tenant');
	const [inviteRole, setInviteRole] = useState<string | null>(null);
	const [inviteEmailLocked, setInviteEmailLocked] = useState<boolean>(false);
	const [inviteValidationState, setInviteValidationState] = useState<
		'idle' | 'checking' | 'valid' | 'invalid'
	>('idle');
	const [inviteValidationMessage, setInviteValidationMessage] =
		useState<string>('');
	const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
	const [selectedDocument, setSelectedDocument] = useState<{
		name: string;
		title: string;
	} | null>(null);

	const handleViewDocument = (filename: string, title: string) => {
		setSelectedDocument({ name: filename, title });
	};

	const handleCloseDocumentViewer = () => {
		setSelectedDocument(null);
	};

	// Tenants skip plan selection, invite mode skips plan selection
	const isTenantSignup = accountType === 'tenant';
	const skipsPlanSelection = inviteMode || isTenantSignup;
	const totalSteps = skipsPlanSelection ? 3 : 4;
	const displayStep = skipsPlanSelection && step === 4 ? 3 : step;

	const enableInviteMode = () => {
		setInviteMode(true);
		setAccountType('tenantInvite');
		setSelectedPlan('free');
		setInviteType('tenant');
		setInviteRole(null);
		setInviteEmailLocked(false);
		setInviteValidationState('idle');
		setInviteValidationMessage('');
		setError('');
	};

	const disableInviteMode = () => {
		setInviteMode(false);
		setInviteCodeInput('');
		setInviteType('tenant');
		setInviteRole(null);
		setInviteValidationState('idle');
		setInviteValidationMessage('');
		setInviteEmailLocked(false);
		setAccountType('');
		setSelectedPlan('');
		setPromoCode('');
		setError('');
	};

	const validateInvite = async (
		codeOverride?: string,
		emailOverride?: string,
	) => {
		const codeToCheck = (codeOverride ?? inviteCodeInput).trim();
		const emailToCheck = (emailOverride ?? email).trim().toLowerCase();

		if (!inviteMode || !codeToCheck || !emailToCheck) {
			setInviteValidationState('idle');
			setInviteValidationMessage('');
			return false;
		}

		setInviteValidationState('checking');
		setInviteValidationMessage('Validating invitation code...');

		const isTenantValid = await validateTenantInviteForRegistration(
			codeToCheck,
			emailToCheck,
		);

		if (isTenantValid) {
			setInviteType('tenant');
			setInviteRole(USER_ROLES.TENANT);
			setSelectedPlan('tenant');
			setInviteValidationState('valid');
			setInviteValidationMessage('Invite code validated successfully.');
			return true;
		}

		const teamInvite = await validateTeamInviteForRegistration(
			codeToCheck,
			emailToCheck,
		);

		if (teamInvite.valid) {
			setInviteType('team');
			setInviteRole(teamInvite.role || null);
			setSelectedPlan('free');
			setInviteValidationState('valid');
			setInviteValidationMessage('Invite code validated successfully.');
			return true;
		}

		setInviteValidationState('invalid');
		setInviteValidationMessage(
			'Invitation code is invalid, expired, or does not match this email.',
		);
		return false;
	};

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const inviteCodeParam = (params.get('invite') || params.get('code') || '')
			.trim()
			.toUpperCase();
		const inviteTypeParam = (params.get('inviteType') || '')
			.trim()
			.toLowerCase();
		const inviteEmailParam = (
			params.get('email') ||
			params.get('tenantEmail') ||
			params.get('teamMemberEmail') ||
			''
		)
			.trim()
			.toLowerCase();

		if (!inviteCodeParam) {
			return;
		}

		setInviteMode(true);
		setAccountType('tenantInvite');
		setInviteType(inviteTypeParam === 'team' ? 'team' : 'tenant');
		setSelectedPlan(inviteTypeParam === 'team' ? 'free' : 'tenant');
		setInviteCodeInput(inviteCodeParam);

		if (inviteEmailParam) {
			setEmail(inviteEmailParam);
			setInviteEmailLocked(true);
		}
	}, [location.search]);

	const handleEmailBlur = async () => {
		if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return;
		}
		setEmailChecking(true);
		setEmailExists(false);
		try {
			const exists = await checkEmailExists(email.trim());
			setEmailExists(exists);
		} catch (error) {
			console.error('Error checking email existence:', error);
		} finally {
			setEmailChecking(false);
		}

		if (inviteMode && inviteCodeInput.trim()) {
			await validateInvite(inviteCodeInput, email);
		}
	};

	const validateStep1 = () => {
		if (!firstName.trim()) {
			setError('Please enter your first name');
			return false;
		}
		if (!lastName.trim()) {
			setError('Please enter your last name');
			return false;
		}
		if (inviteMode) {
			return true;
		}
		if (!accountType) {
			setError(
				'Please select your role as a homeowner, property manager, or tenant',
			);
			return false;
		}
		if (!['homeowner', 'propertyManager', 'tenant'].includes(accountType)) {
			setError('Invalid account type selected');
			return false;
		}
		return true;
	};

	const validateStep2 = async () => {
		if (!email.trim()) {
			setError('Please enter your email address');
			return false;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError('Please enter a valid email address');
			return false;
		}
		if (emailExists) {
			setError(
				'This email is already registered. Please use a different email or sign in instead.',
			);
			return false;
		}
		if (password.length < 8) {
			setError('Password must be at least 8 characters long');
			return false;
		}
		if (!confirmed) {
			setError('Passwords do not match');
			return false;
		}
		if (!agreedToTerms) {
			setError(
				'You must agree to the Terms of Service, Privacy Policy, Maintenance Disclaimer, Subscription Terms, and EULA to continue',
			);
			return false;
		}

		if (inviteMode) {
			if (!inviteCodeInput.trim()) {
				setError('Invitation code is required for invite registration');
				return false;
			}

			const inviteValid = await validateInvite();
			if (!inviteValid) {
				setError(
					'This invitation is invalid or expired. Please verify the code and email.',
				);
				return false;
			}
		}

		return true;
	};

	const validateStep3 = () => {
		if (inviteMode) {
			return true;
		}
		console.log(
			`[VAL-STEP3] accountType="${accountType}", selectedPlan="${selectedPlan}", promoCode="${promoCode}"`,
		);
		// Plan selection is handled by the embedded paywall
		// User must select a plan to proceed
		if (!selectedPlan) {
			console.log('[VAL-STEP3] No plan selected, setting error');
			setError('Please select a subscription plan');
			return false;
		}
		console.log('[VAL-STEP3] Validation passed');
		return true;
	};

	const handleNext = async () => {
		setError('');
		console.log(
			`[RegistrationCard] handleNext called, step=${step}, selectedPlan="${selectedPlan}"`,
		);
		if (step === 1 && validateStep1()) {
			console.log('[RegistrationCard] Step 1 validated, moving to step 2');
			setStep(2);
		} else if (step === 2 && (await validateStep2())) {
			console.log('[RegistrationCard] Step 2 validated, moving to next step');
			if (inviteMode || isTenantSignup) {
				setSelectedPlan(inviteMode && inviteType === 'tenant' ? 'tenant' : isTenantSignup ? 'tenant' : 'free');
				setStep(4);
			} else {
				setStep(3);
			}
		} else if (step === 3 && validateStep3()) {
			console.log('[RegistrationCard] Step 3 validated, moving to step 4');
			setStep(4);
		} else {
			console.log(
				`[RegistrationCard] Validation failed or wrong step. step=${step}`,
			);
		}
	};

	const handleBack = () => {
		setError('');
		if ((inviteMode || isTenantSignup) && step === 4) {
			setStep(2);
			return;
		}
		if (step > 1) {
			setStep(step - 1);
		}
	};

	const signup = async () => {
		setError('');
		setLoading(true);

		try {
			// Map selected account type to appropriate role
			const effectiveAccountType = inviteMode ? 'tenantInvite' : accountType;
			const userRole = inviteMode
				? inviteRole ||
				  (inviteType === 'team'
						? USER_ROLES.MAINTENANCE
						: getRoleFromAccountType(effectiveAccountType))
				: getRoleFromAccountType(effectiveAccountType);
			const agreedAt = new Date().toISOString();
			const signupPlan = inviteMode
				? inviteType === 'tenant'
					? 'tenant'
					: 'free'
				: isTenantSignup ? 'tenant' : selectedPlan;
			const effectivePromoCode = inviteMode
				? inviteCodeInput.trim()
				: isTenantSignup ? '' : promoCode.trim();

			// Register with Firebase - use mapped role, trim values
			const { user, checkoutUrl } = await signUpWithEmail(
				email.trim(),
				password.trim(),
				firstName.trim(),
				lastName.trim(),
				userRole,
				signupPlan,
				effectivePromoCode || undefined,
				{
					agreedToTerms: true,
					agreedVersion: LEGAL_AGREEMENT_VERSION,
					documents: createLegalAgreementDocuments(
						agreedAt,
						LEGAL_AGREEMENT_VERSION,
					),
				},
				inviteMode ? inviteType : undefined,
			);

			// Store session in localStorage
			localStorage.setItem(
				'loggedUser',
				JSON.stringify({
					token: `firebase-token-${user.id}`,
					user,
				}),
			);

			// Update Redux store to mark user as logged in
			dispatch(setCurrentUser(user));

			if (checkoutUrl) {
				setLoading(false);
				redirectToCheckout(checkoutUrl);
				return;
			}

			setLoading(false);
			navigate(
				user.role === USER_ROLES.TENANT ? '/tenant-profile' : '/dashboard',
			);
		} catch (error: any) {
			console.error('RegistrationCard: Registration error', error);
			setError(error.message || 'Registration failed. Please try again.');
			setLoading(false);
		}
	};

	useEffect(() => {
		if (password === passwordConfirm) {
			setConfirmed(true);
		} else {
			setConfirmed(false);
		}
	}, [password, passwordConfirm]);

	return (
		<Wrapper
			$wide={step === 3}
			onSubmit={(e) => e.preventDefault()}>
			<BackButton href='#/login'>
				<FontAwesomeIcon icon={faArrowCircleLeft} />
			</BackButton>
			<Title>
				{step === 1 && `Create Account - Step ${displayStep} of ${totalSteps}`}
				{step === 2 && `Create Account - Step ${displayStep} of ${totalSteps}`}
				{step === 3 && `Create Account - Step ${displayStep} of ${totalSteps}`}
				{step === 4 && `Create Account - Step ${displayStep} of ${totalSteps}`}
			</Title>
			<TrialNotice>
				{inviteMode
					? 'Complete your invited account setup.'
					: `Start with a ${TRIAL_DURATION_DAYS}-day free trial on any paid plan.`}
			</TrialNotice>
			{error && <ErrorMessage>{error}</ErrorMessage>}

			{/* Step 1: Basic Information */}
			{step === 1 && (
				<>
					<SectionLabel>Let's start with your name</SectionLabel>
					<Input
						placeholder='First Name *'
						type='text'
						autoComplete='given-name'
						value={firstName}
						onChange={(event) => {
							setFirstName(event.target.value);
							setError('');
						}}
						required
					/>
					<Input
						placeholder='Last Name *'
						type='text'
						autoComplete='family-name'
						value={lastName}
						onChange={(event) => {
							setLastName(event.target.value);
							setError('');
						}}
						required
					/>
					{inviteMode ? (
						<>
							<QuestionLabel>You are joining via an invite.</QuestionLabel>
						</>
					) : (
						<>
							<QuestionLabel>
								What best describes your account?
							</QuestionLabel>
							<RadioGrid>
								<RadioOption>
									<input
										type='radio'
										name='accountType'
										value='homeowner'
										checked={accountType === 'homeowner'}
										onChange={() => {
											setAccountType('homeowner');
											setError('');
										}}
										required
									/>
									Homeowner
								</RadioOption>
								<RadioOption>
									<input
										type='radio'
										name='accountType'
										value='propertyManager'
										checked={accountType === 'propertyManager'}
										onChange={() => {
											setAccountType('propertyManager');
											setError('');
										}}
										required
									/>
									Property Manager
								</RadioOption>
								<RadioOption>
									<input
										type='radio'
										name='accountType'
										value='tenant'
										checked={accountType === 'tenant'}
										onChange={() => {
											setAccountType('tenant');
											setError('');
										}}
										required
									/>
									Tenant
								</RadioOption>
							</RadioGrid>
						</>
					)}
					{inviteMode ? (
						<InviteModePanel $active>
							<InviteModeTitle>Invite Registration Enabled</InviteModeTitle>
							<InviteModeDescription>
								Use this flow if you were invited to join a property or team.
							</InviteModeDescription>
							<InviteModeActionButton
								type='button'
								$secondary
								onClick={disableInviteMode}>
								Switch to Standard Registration
							</InviteModeActionButton>
						</InviteModePanel>
					) : (
						<InviteModePanel>
							<InviteModeTitle>Have an Invite Code?</InviteModeTitle>
							<InviteModeDescription>
								Use invite registration if you were invited as a tenant or team
								member.
							</InviteModeDescription>
							<InviteModeActionButton type='button' onClick={enableInviteMode}>
								Use Invite Registration
							</InviteModeActionButton>
						</InviteModePanel>
					)}
					<Submit type='button' onClick={handleNext}>
						Next
					</Submit>
				</>
			)}

			{/* Step 2: Account Credentials & Legal Agreement */}
			{step === 2 && (
				<>
					<SectionLabel>Create your login credentials</SectionLabel>
					{inviteMode ? (
						<InviteModePanel $active>
							<InviteModeTitle>Invite Registration Enabled</InviteModeTitle>
							<InviteModeDescription>
								Enter your invite code and complete account setup.
							</InviteModeDescription>
							<InviteModeActionButton
								type='button'
								$secondary
								onClick={disableInviteMode}>
								Switch to Standard Registration
							</InviteModeActionButton>
						</InviteModePanel>
					) : (
						<InviteModePanel>
							<InviteModeTitle>Have an Invite Code?</InviteModeTitle>
							<InviteModeDescription>
								Use your invite code to register through the invite flow.
							</InviteModeDescription>
							<InviteModeActionButton type='button' onClick={enableInviteMode}>
								Use Invite Registration
							</InviteModeActionButton>
						</InviteModePanel>
					)}
					{inviteMode && (
						<>
							<Input
								placeholder='Invitation Code *'
								type='text'
								value={inviteCodeInput}
								onChange={(event) => {
									setInviteCodeInput(event.target.value.toUpperCase());
									setInviteValidationState('idle');
									setInviteValidationMessage('');
									setError('');
								}}
								onBlur={() => {
									if (inviteCodeInput.trim() && email.trim()) {
										void validateInvite();
									}
								}}
								required
							/>
							{inviteValidationMessage && (
								<EmailStatusText error={inviteValidationState === 'invalid'}>
									{inviteValidationMessage}
								</EmailStatusText>
							)}
						</>
					)}
					<Input
						placeholder='Email Address *'
						type='email'
						autoComplete='email'
						value={email}
						disabled={inviteEmailLocked}
						onChange={(event) => {
							setEmail(event.target.value);
							setError('');
							setEmailExists(false);
							if (inviteMode) {
								setInviteValidationState('idle');
								setInviteValidationMessage('');
							}
						}}
						onBlur={handleEmailBlur}
						required
					/>
					{emailChecking && (
						<EmailStatusText>Checking email availability...</EmailStatusText>
					)}
					{!emailChecking && emailExists && email.trim() && (
						<EmailStatusText error>
							This email is already registered. Please use a different email or
							sign in instead.
						</EmailStatusText>
					)}
					<PasswordInputWrapper>
						<Input
							placeholder='Password (min 8 characters) *'
							type={showPassword ? 'text' : 'password'}
							autoComplete='new-password'
							value={password}
							onChange={(event) => {
								setPassword(event.target.value);
								setError('');
							}}
							required
						/>
						<PasswordToggleButton
							type='button'
							tabIndex={-1}
							onClick={(e) => {
								e.preventDefault();
								setShowPassword(!showPassword);
							}}
							title={showPassword ? 'Hide password' : 'Show password'}>
							<FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
						</PasswordToggleButton>
					</PasswordInputWrapper>
					<PasswordInputWrapper>
						<Input
							placeholder='Confirm Password *'
							type={showPasswordConfirm ? 'text' : 'password'}
							autoComplete='new-password'
							value={passwordConfirm}
							onChange={(event) => {
								setPasswordConfirm(event.target.value);
								setError('');
							}}
							required
						/>
						<PasswordToggleButton
							type='button'
							tabIndex={-1}
							onClick={(e) => {
								e.preventDefault();
								setShowPasswordConfirm(!showPasswordConfirm);
							}}
							title={showPasswordConfirm ? 'Hide password' : 'Show password'}>
							<FontAwesomeIcon
								icon={showPasswordConfirm ? faEyeSlash : faEye}
							/>
						</PasswordToggleButton>
					</PasswordInputWrapper>
					{password && passwordConfirm && (
						<PasswordMatchText matched={confirmed}>
							{confirmed ? '✓ Passwords match' : '✗ Passwords do not match'}
						</PasswordMatchText>
					)}
					<div style={{ marginTop: '16px', marginBottom: '16px' }}>
						<label
							style={{
								display: 'flex',
								alignItems: 'flex-start',
								gap: '8px',
								fontSize: '14px',
								lineHeight: '1.4',
							}}>
							<input
								type='checkbox'
								checked={agreedToTerms}
								onChange={(e) => {
									setAgreedToTerms(e.target.checked);
									setError('');
								}}
								style={{ marginTop: '2px', flexShrink: 0 }}
								required
							/>
							<span>
								I agree to the{' '}
								<button
									type='button'
									style={{
										color: '#10b981',
										textDecoration: 'none',
										cursor: 'pointer',
										background: 'none',
										border: 'none',
										padding: 0,
										font: 'inherit',
									}}
									onClick={() =>
										handleViewDocument('terms-of-service', 'Terms of Service')
									}>
									Terms of Service
								</button>
								,{' '}
								<button
									type='button'
									style={{
										color: '#10b981',
										textDecoration: 'none',
										cursor: 'pointer',
										background: 'none',
										border: 'none',
										padding: 0,
										font: 'inherit',
									}}
									onClick={() =>
										handleViewDocument('privacy-policy', 'Privacy Policy')
									}>
									Privacy Policy
								</button>
								, and{' '}
								<button
									type='button'
									style={{
										color: '#10b981',
										textDecoration: 'none',
										cursor: 'pointer',
										background: 'none',
										border: 'none',
										padding: 0,
										font: 'inherit',
									}}
									onClick={() =>
										handleViewDocument(
											'maintenance-disclaimer',
											'Maintenance Disclaimer',
										)
									}>
									Maintenance Disclaimer
								</button>
								,{' '}
								<button
									type='button'
									style={{
										color: '#10b981',
										textDecoration: 'none',
										cursor: 'pointer',
										background: 'none',
										border: 'none',
										padding: 0,
										font: 'inherit',
									}}
									onClick={() =>
										handleViewDocument(
											'subscription-terms',
											'Subscription Terms',
										)
									}>
									Subscription Terms
								</button>
								, and{' '}
								<button
									type='button'
									style={{
										color: '#10b981',
										textDecoration: 'none',
										cursor: 'pointer',
										background: 'none',
										border: 'none',
										padding: 0,
										font: 'inherit',
									}}
									onClick={() => handleViewDocument('eula', 'EULA')}>
									EULA
								</button>
								*
							</span>
						</label>
					</div>
					<ButtonGroup>
						<Submit type='button' onClick={handleBack}>
							Back
						</Submit>
						<Submit type='button' onClick={handleNext}>
							Next
						</Submit>
					</ButtonGroup>
				</>
			)}

			{/* Step 3: Plan Selection with Paywall */}
			{step === 3 && !skipsPlanSelection && (
				<>
					<PaywallPage
						subscription={{
							status: 'trial',
							plan: '',
							currentPeriodStart: Math.floor(Date.now() / 1000),
							currentPeriodEnd:
								Math.floor(Date.now() / 1000) +
								TRIAL_DURATION_DAYS * 24 * 60 * 60,
							trialEndsAt:
								Math.floor(Date.now() / 1000) +
								TRIAL_DURATION_DAYS * 24 * 60 * 60,
						}}
						currentPlan={selectedPlan}
						variant='embedded'
						selectionOnly={true}
						wide={true}
						onPlanSelect={(planId) => {
							setSelectedPlan(planId);
							setError('');
						}}
						onPromoCodeApplied={(appliedPromoCode) => {
							setPromoCode(appliedPromoCode);
							setError('');
						}}
					/>
					<ButtonGroup>
						<Submit type='button' onClick={handleBack}>
							Back
						</Submit>
						<Submit type='button' onClick={handleNext}>
							Continue
						</Submit>
					</ButtonGroup>
				</>
			)}

			{/* Step 4: Additional Information (Optional) */}
			{step === 4 && (
				<>
					<SectionLabel>
						{inviteMode || isTenantSignup
							? 'Optional profile information'
							: 'Additional information (optional)'}
					</SectionLabel>
					<Input
						placeholder='Phone Number (optional)'
						type='tel'
						autoComplete='tel'
						value={phoneNumber}
						onChange={(event) => setPhoneNumber(event.target.value)}
					/>
					<Input
						placeholder='Address (optional)'
						type='text'
						autoComplete='street-address'
						value={address}
						onChange={(event) => setAddress(event.target.value)}
					/>
					<ButtonGroup>
						<Submit type='button' onClick={handleBack} disabled={loading}>
							Back
						</Submit>
						<Submit
							type='button'
							onClick={signup}
							disabled={loading}
							style={{ backgroundColor: '#22c55e', color: 'white' }}>
							{loading && <LoadingSpinner />}
							{loading ? 'Creating account...' : 'Create Account'}
						</Submit>
					</ButtonGroup>
				</>
			)}

			<RegisterWrapper>
				<p>
					Already have an account? <a href='#/login'>Login here</a>
				</p>
			</RegisterWrapper>

			<DocumentViewer
				documentName={selectedDocument?.name || ''}
				title={selectedDocument?.title || ''}
				isOpen={!!selectedDocument}
				onClose={handleCloseDocumentViewer}
			/>
		</Wrapper>
	);
};
