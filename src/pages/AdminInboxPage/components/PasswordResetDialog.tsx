/**
 * PasswordResetDialog Component
 * Modal dialog for resetting admin password
 */

import React from 'react';
import {
	DialogBackdrop,
	DialogCard,
	DialogHeader,
	SecurityTitle,
	DialogCloseButton,
	SubTitle,
	Label,
	PasswordRow,
	Input,
	InlineToggle,
	ErrorText,
	SuccessText,
	Button,
} from '../AdminInboxPage.styles';

interface PasswordResetDialogProps {
	open: boolean;
	isResetting: boolean;
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
	resetError: string;
	resetMessage: string;
	showCurrentPassword: boolean;
	showNewPassword: boolean;
	showConfirmPassword: boolean;
	onCurrentPasswordChange: (value: string) => void;
	onNewPasswordChange: (value: string) => void;
	onConfirmPasswordChange: (value: string) => void;
	onShowCurrentPasswordToggle: () => void;
	onShowNewPasswordToggle: () => void;
	onShowConfirmPasswordToggle: () => void;
	onSubmit: (e: React.FormEvent) => Promise<void>;
	onClose: () => void;
}

export const PasswordResetDialog: React.FC<PasswordResetDialogProps> = ({
	open,
	isResetting,
	currentPassword,
	newPassword,
	confirmPassword,
	resetError,
	resetMessage,
	showCurrentPassword,
	showNewPassword,
	showConfirmPassword,
	onCurrentPasswordChange,
	onNewPasswordChange,
	onConfirmPasswordChange,
	onShowCurrentPasswordToggle,
	onShowNewPasswordToggle,
	onShowConfirmPasswordToggle,
	onSubmit,
	onClose,
}) => {
	if (!open) return null;

	const handleBackdropClick = () => {
		onClose();
	};

	return (
		<DialogBackdrop onClick={handleBackdropClick}>
			<DialogCard onClick={(e) => e.stopPropagation()}>
				<DialogHeader>
					<SecurityTitle>Reset Admin Password</SecurityTitle>
					<DialogCloseButton type='button' onClick={onClose}>
						Close
					</DialogCloseButton>
				</DialogHeader>
				<SubTitle>Use your current password to set a new admin password.</SubTitle>
				<form onSubmit={onSubmit}>
					<Label htmlFor='admin-current-password'>Current Password</Label>
					<PasswordRow>
						<Input
							id='admin-current-password'
							type={showCurrentPassword ? 'text' : 'password'}
							value={currentPassword}
							onChange={(e) => onCurrentPasswordChange(e.target.value)}
							autoComplete='current-password'
							disabled={isResetting}
						/>
						<InlineToggle
							type='button'
							onClick={onShowCurrentPasswordToggle}
							disabled={isResetting}>
							{showCurrentPassword ? 'Hide' : 'Show'}
						</InlineToggle>
					</PasswordRow>

					<Label htmlFor='admin-new-password'>New Password</Label>
					<PasswordRow>
						<Input
							id='admin-new-password'
							type={showNewPassword ? 'text' : 'password'}
							value={newPassword}
							onChange={(e) => onNewPasswordChange(e.target.value)}
							autoComplete='new-password'
							disabled={isResetting}
						/>
						<InlineToggle type='button' onClick={onShowNewPasswordToggle} disabled={isResetting}>
							{showNewPassword ? 'Hide' : 'Show'}
						</InlineToggle>
					</PasswordRow>

					<Label htmlFor='admin-confirm-password'>Confirm New Password</Label>
					<PasswordRow>
						<Input
							id='admin-confirm-password'
							type={showConfirmPassword ? 'text' : 'password'}
							value={confirmPassword}
							onChange={(e) => onConfirmPasswordChange(e.target.value)}
							autoComplete='new-password'
							disabled={isResetting}
						/>
						<InlineToggle
							type='button'
							onClick={onShowConfirmPasswordToggle}
							disabled={isResetting}>
							{showConfirmPassword ? 'Hide' : 'Show'}
						</InlineToggle>
					</PasswordRow>

					{resetError ? <ErrorText>{resetError}</ErrorText> : null}
					{resetMessage ? <SuccessText>{resetMessage}</SuccessText> : null}
					<Button type='submit' disabled={isResetting}>
						{isResetting ? 'Resetting Password...' : 'Reset Password'}
					</Button>
				</form>
			</DialogCard>
		</DialogBackdrop>
	);
};
