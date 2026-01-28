import React, { useEffect, useState } from 'react';
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
} from './RegistrationCard.styles';
import { useNavigate } from 'react-router-dom';
import { faArrowCircleLeft } from '@fortawesome/free-solid-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { signUpWithEmail } from '../../services/authService';
import { USER_ROLES } from '../../constants/roles';
import { useDispatch } from 'react-redux';
import { setCurrentUser } from '../../Redux/Slices/userSlice';

export const RegistrationCard = () => {
	const [step, setStep] = useState<number>(1);
	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
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
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const validateStep1 = () => {
		if (!firstName.trim()) {
			setError('Please enter your first name');
			return false;
		}
		if (!lastName.trim()) {
			setError('Please enter your last name');
			return false;
		}
		return true;
	};

	const validateStep2 = () => {
		if (!email.trim()) {
			setError('Please enter your email address');
			return false;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError('Please enter a valid email address');
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
		return true;
	};

	const handleNext = () => {
		setError('');
		if (step === 1 && validateStep1()) {
			setStep(2);
		} else if (step === 2 && validateStep2()) {
			setStep(3);
		}
	};

	const handleBack = () => {
		setError('');
		if (step > 1) {
			setStep(step - 1);
		}
	};

	const handleSkip = () => {
		setError('');
		signup();
	};

	const signup = async () => {
		setError('');
		setLoading(true);

		try {
			console.log('RegistrationCard: Starting Firebase registration', {
				email,
				firstName,
				lastName,
			});

			// Register with Firebase - default role is admin
			const user = await signUpWithEmail(
				email,
				password,
				firstName,
				lastName,
				USER_ROLES.ADMIN,
			);

			console.log('RegistrationCard: Firebase registration successful', user);

			// Update Redux store
			dispatch(setCurrentUser(user));

			// Store session in localStorage
			localStorage.setItem(
				'loggedUser',
				JSON.stringify({
					token: `firebase-token-${user.id}`,
					user,
				}),
			);

			console.log('RegistrationCard: Navigating to dashboard');

			// Navigate to dashboard
			navigate('/dashboard');
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
		<Wrapper onSubmit={(e) => e.preventDefault()}>
			<BackButton href='#/login'>
				<FontAwesomeIcon icon={faArrowCircleLeft} />
			</BackButton>
			<Title>
				{step === 1 && 'Create Account - Step 1 of 3'}
				{step === 2 && 'Create Account - Step 2 of 3'}
				{step === 3 && 'Create Account - Step 3 of 3'}
			</Title>
			{error && <ErrorMessage>{error}</ErrorMessage>}

			{/* Step 1: Basic Information */}
			{step === 1 && (
				<>
					<p style={{ margin: '10px', fontSize: '14px', color: '#666' }}>
						Let's start with your name
					</p>
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
					<Submit type='button' onClick={handleNext}>
						Next
					</Submit>
				</>
			)}

			{/* Step 2: Account Credentials */}
			{step === 2 && (
				<>
					<p style={{ margin: '10px', fontSize: '14px', color: '#666' }}>
						Create your login credentials
					</p>
					<Input
						placeholder='Email Address *'
						type='email'
						autoComplete='email'
						value={email}
						onChange={(event) => {
							setEmail(event.target.value);
							setError('');
						}}
						required
					/>
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
						<p
							style={{
								margin: '5px 10px',
								fontSize: '12px',
								color: confirmed ? '#22c55e' : '#c33',
							}}>
							{confirmed ? '✓ Passwords match' : '✗ Passwords do not match'}
						</p>
					)}
					<div
						style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
						<Submit type='button' onClick={handleBack}>
							Back
						</Submit>
						<Submit type='button' onClick={handleNext}>
							Next
						</Submit>
					</div>
				</>
			)}

			{/* Step 3: Additional Information (Optional) */}
			{step === 3 && (
				<>
					<p style={{ margin: '10px', fontSize: '14px', color: '#666' }}>
						Additional information (optional)
					</p>
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
					<div
						style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
						<Submit type='button' onClick={handleBack} disabled={loading}>
							Back
						</Submit>
						<Submit type='button' onClick={handleSkip} disabled={loading}>
							{loading && <LoadingSpinner />}
							{loading ? 'Creating account...' : 'Skip & Complete'}
						</Submit>
						<Submit
							type='button'
							onClick={signup}
							disabled={loading}
							style={{ backgroundColor: '#22c55e', color: 'white' }}>
							{loading && <LoadingSpinner />}
							{loading ? 'Creating account...' : 'Complete'}
						</Submit>
					</div>
				</>
			)}

			<RegisterWrapper>
				<p>
					Already have an account? <a href='#/login'>Login here</a>
				</p>
			</RegisterWrapper>
		</Wrapper>
	);
};
