import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
	Input,
	Wrapper,
	Submit,
	RegisterWrapper,
	Title,
	BackButton,
	PasswordInputWrapper,
	PasswordToggleButton,
	CheckboxWrapper,
	CheckboxLabel,
	ErrorMessage,
	LoadingSpinner,
	TrialNotice,
} from './LoginCard.styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowAltCircleLeft,
	faEye,
	faEyeSlash,
} from '@fortawesome/free-regular-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { setCurrentUser } from '../../Redux/Slices/userSlice';
import { signInWithEmail } from '../../services/authService';
import { USER_ROLES } from '../../constants/roles';
import { isNativeApp } from '../../utils/platform';
import { getRegistrationUrl, openRegistrationInBrowser } from '../../utils/authLinks';
import { COLORS } from '../../constants/colors';
import type { AppDispatch } from '../../Redux/store/store';
import { clearAccountScopedClientState } from '../../Redux/utils/clearAccountScopedClientState';

export const LoginCard = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [error, setError] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [rememberEmail, setRememberEmail] = useState<boolean>(false);
	const nativeApp = isNativeApp();

	// Load saved email on component mount
	useEffect(() => {
		const savedEmail = localStorage.getItem('savedEmail');
		if (savedEmail) {
			setEmail(savedEmail);
			setRememberEmail(true);
		}
	}, []);

	const handleRememberEmailChange = (checked: boolean) => {
		setRememberEmail(checked);
		if (checked) {
			localStorage.setItem('savedEmail', email);
		} else {
			localStorage.removeItem('savedEmail');
		}
	};

	const handleEmailChange = (value: string) => {
		setEmail(value);
		setError('');
		// Update saved email if remember email is checked
		if (rememberEmail) {
			localStorage.setItem('savedEmail', value);
		}
	};

	const login = async (event: any) => {
		event.preventDefault();
		setError('');
		setLoading(true);

		try {
			// Sign in with Firebase - trim values to remove whitespace
			const user = await signInWithEmail(email.trim(), password.trim());

			clearAccountScopedClientState(dispatch);

			// Set user in Redux store
			dispatch(setCurrentUser(user));

			// Save session to localStorage
			localStorage.setItem(
				'loggedUser',
				JSON.stringify({
					token: `firebase-token-${user.id}`,
					user,
				}),
			);

			// Navigate based on role
			navigate(
				user.role === USER_ROLES.TENANT ? '/tenant-profile' : '/dashboard',
			);
		} catch (error: any) {
			setError(error.message || 'Login failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Wrapper>
			<BackButton href='/'>
				<FontAwesomeIcon icon={faArrowAltCircleLeft} />
			</BackButton>
			<Title>Welcome back</Title>
			<TrialNotice>Sign in to continue caring for your properties.</TrialNotice>
			{error && <ErrorMessage>{error}</ErrorMessage>}
			<Input
				placeholder='Email address'
				aria-label='Email address'
				autoComplete='email'
				value={email}
				onChange={(event) => {
					handleEmailChange(event.target.value);
				}}
			/>
			<PasswordInputWrapper>
				<Input
					placeholder='Password'
					aria-label='Password'
					type={showPassword ? 'text' : 'password'}
					autoComplete='current-password'
					value={password}
					onChange={(event) => {
						setPassword(event.target.value);
						setError('');
					}}
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
			<CheckboxWrapper>
				<input
					type='checkbox'
					id='rememberEmail'
					checked={rememberEmail}
					onChange={(event) => handleRememberEmailChange(event.target.checked)}
				/>
				<CheckboxLabel htmlFor='rememberEmail'>
					Save email address
				</CheckboxLabel>
			</CheckboxWrapper>
			<div style={{ textAlign: 'right', marginBottom: '16px' }}>
				<Link
					to='/forgot-password'
					style={{
						color: COLORS.primary,
						textDecoration: 'none',
						fontSize: '14px',
						fontWeight: '500',
					}}
				>
					Forgot password?
				</Link>
			</div>
			<Submit onClick={(event) => login(event)} disabled={loading}>
				{loading && <LoadingSpinner />}
				{loading ? 'Signing in...' : 'Sign in'}
			</Submit>

			<RegisterWrapper>
				<p>
					Don't have an account?{' '}
					{nativeApp ? (
						<a
							href={getRegistrationUrl()}
							onClick={(event) => {
								event.preventDefault();
								void openRegistrationInBrowser();
							}}>
							Create account in browser
						</a>
					) : (
						<Link to='/registration'>Sign up here</Link>
					)}
				</p>
				<div
					style={{
						marginTop: '16px',
						fontSize: '12px',
						color: '#6b7280',
						textAlign: 'center',
					}}>
					By signing in, you agree to our{' '}
					<Link
						to='/legal'
						style={{ color: COLORS.primary, textDecoration: 'none' }}>
						Terms of Service and Privacy Policy
					</Link>
				</div>
			</RegisterWrapper>
		</Wrapper>
	);
};
