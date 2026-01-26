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
} from './LoginCard.styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowAltCircleLeft,
	faEye,
	faEyeSlash,
} from '@fortawesome/free-regular-svg-icons';
import { useNavigate } from 'react-router-dom';
import {
	setCurrentUser,
	authenticateMockUser,
} from '../../Redux/Slices/userSlice';
import { TestAccountsReference } from './TestAccountsReference';

export const LoginCard = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [error, setError] = useState<string>('');
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

		console.log('LoginCard: Attempting login with:', { email, password });

		// Use mock authentication
		const mockUser = authenticateMockUser(email, password);
		console.log('LoginCard: Mock user result:', mockUser);

		if (mockUser) {
			// Successfully authenticated with mock user
			console.log(
				'LoginCard: Mock authentication successful, setting user:',
				mockUser,
			);
			dispatch(setCurrentUser(mockUser));
			localStorage.setItem(
				'loggedUser',
				JSON.stringify({
					token: `mock-token-${mockUser.id}`,
					user: mockUser,
				}),
			);
			navigate('/dashboard');
			return;
		}

		// Authentication failed
		setError('Invalid email or password. Try: admin@test.com / admin');
	};

	return (
		<Wrapper>
			<BackButton href='/'>
				<FontAwesomeIcon icon={faArrowAltCircleLeft} />
			</BackButton>
			<Title>Login</Title>
			{error && (
				<div
					style={{
						color: '#e74c3c',
						background: '#fff5f5',
						padding: '10px',
						borderRadius: '4px',
						marginBottom: '10px',
						border: '1px solid #e74c3c',
					}}>
					{error}
				</div>
			)}
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
			<Submit onClick={(event) => login(event)}>Login</Submit>
			{process.env.NODE_ENV === 'development' && <TestAccountsReference />}
			<RegisterWrapper>
				<p>
					Don't have an account? <a href='/Registration'>Sign up here</a>
				</p>
			</RegisterWrapper>
		</Wrapper>
	);
};
