import React, { useState, useEffect } from 'react';
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
} from './LoginCard.styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowAltCircleLeft,
	faEye,
	faEyeSlash,
} from '@fortawesome/free-regular-svg-icons';
import { useNavigate } from 'react-router-dom';
import { setCurrentUser } from '../../Redux/Slices/userSlice';
import { signInWithEmail } from '../../services/authService';

export const LoginCard = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [error, setError] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [rememberEmail, setRememberEmail] = useState<boolean>(false);

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

			// Navigate to dashboard
			navigate('/dashboard');
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
			<Title>Login</Title>
			{error && <ErrorMessage>{error}</ErrorMessage>}
			<Input
				placeholder='Email Address'
				autoComplete='email'
				value={email}
				onChange={(event) => {
					handleEmailChange(event.target.value);
				}}
			/>
			<PasswordInputWrapper>
				<Input
					placeholder='Password'
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
			<Submit onClick={(event) => login(event)} disabled={loading}>
				{loading && <LoadingSpinner />}
				{loading ? 'Signing in...' : 'Login'}
			</Submit>

			<RegisterWrapper>
				<p>
					Don't have an account? <a href='#/registration'>Sign up here</a>
				</p>
			</RegisterWrapper>
		</Wrapper>
	);
};
