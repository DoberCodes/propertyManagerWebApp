/**
 * AdminLoginForm Component
 * Login form for admin authentication
 */

import React from 'react';
import {
	LoginForm,
	Label,
	Input,
	PasswordRow,
	InlineToggle,
	Button,
	SubTitle,
	ErrorText,
} from '../AdminInboxPage.styles';

interface AdminLoginFormProps {
	username: string;
	password: string;
	showPassword: boolean;
	authError: string;
	isLoading?: boolean;
	onUsernameChange: (value: string) => void;
	onPasswordChange: (value: string) => void;
	onShowPasswordToggle: () => void;
	onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({
	username,
	password,
	showPassword,
	authError,
	isLoading,
	onUsernameChange,
	onPasswordChange,
	onShowPasswordToggle,
	onSubmit,
}) => {
	return (
		<LoginForm onSubmit={onSubmit}>
			<Label htmlFor='admin-username'>Username</Label>
			<Input
				id='admin-username'
				type='text'
				value={username}
				onChange={(e) => onUsernameChange(e.target.value)}
				autoComplete='username'
				disabled={isLoading}
			/>
			<Label htmlFor='admin-password'>Password</Label>
			<PasswordRow>
				<Input
					id='admin-password'
					type={showPassword ? 'text' : 'password'}
					value={password}
					onChange={(e) => onPasswordChange(e.target.value)}
					autoComplete='current-password'
					disabled={isLoading}
				/>
				<InlineToggle type='button' onClick={onShowPasswordToggle} disabled={isLoading}>
					{showPassword ? 'Hide' : 'Show'}
				</InlineToggle>
			</PasswordRow>
			<SubTitle>Password reset is available after sign-in under Account Security.</SubTitle>
			{authError ? <ErrorText>{authError}</ErrorText> : null}
			<Button type='submit' disabled={isLoading}>
				{isLoading ? 'Signing In...' : 'Sign In'}
			</Button>
		</LoginForm>
	);
};
