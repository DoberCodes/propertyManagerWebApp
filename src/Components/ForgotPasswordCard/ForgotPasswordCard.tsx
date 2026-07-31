import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
	Input,
	Wrapper,
	Submit,
	Title,
	BackButton,
	ErrorMessage,
	SuccessMessage,
	LoadingSpinner,
	RegisterWrapper,
} from './ForgotPasswordCard.styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowAltCircleLeft } from '@fortawesome/free-regular-svg-icons';
import { resetPassword } from '../../services/authService';

export const ForgotPasswordCard = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState<string>('');
	const [error, setError] = useState<string>('');
	const [success, setSuccess] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);

	const handleEmailChange = (value: string) => {
		setEmail(value);
		setError('');
		setSuccess('');
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError('');
		setSuccess('');
		setLoading(true);

		if (!email.trim()) {
			setError('Please enter your email address.');
			setLoading(false);
			return;
		}

		try {
			await resetPassword(email.trim());
			setSuccess(
				"Password reset email sent! Check your inbox (and spam folder) for instructions. If you don't receive the email, please check your Firebase Console email template configuration.",
			);
		} catch (error: any) {
			console.error('Password reset failed:', error);
			setError(
				error.message ||
					'Failed to send password reset email. Please try again.',
			);
		} finally {
			setLoading(false);
		}
	};

	const handleBackToLogin = () => {
		navigate('/login');
	};

	return (
		<Wrapper>
			<BackButton onClick={handleBackToLogin} style={{ cursor: 'pointer' }}>
				<FontAwesomeIcon icon={faArrowAltCircleLeft} />
			</BackButton>
			<Title>Reset Password</Title>

			{error && <ErrorMessage>{error}</ErrorMessage>}
			{success && <SuccessMessage>{success}</SuccessMessage>}

			<form onSubmit={handleSubmit}>
				<Input
					placeholder='Email Address'
					type='email'
					autoComplete='email'
					value={email}
					onChange={(event) => handleEmailChange(event.target.value)}
					required
				/>

				<Submit type='submit' disabled={loading}>
					{loading && <LoadingSpinner />}
					{loading ? 'Sending...' : 'Send Reset Email'}
				</Submit>
			</form>

			<RegisterWrapper>
				<p>
					Remember your password?{' '}
					<Link to='/login'>
						Back to Login
					</Link>
				</p>
			</RegisterWrapper>
		</Wrapper>
	);
};
