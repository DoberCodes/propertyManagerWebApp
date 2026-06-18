/**
 * useAdminPasswordReset Hook
 * Manages password reset state and validation
 */

import { useState } from 'react';
import { adminPortalResetPassword } from '../../../services/adminPortalService';
import { ERROR_MESSAGES } from '../constants';

export interface UseAdminPasswordResetReturn {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
	resetError: string;
	resetMessage: string;
	isResettingPassword: boolean;
	showCurrentPassword: boolean;
	showNewPassword: boolean;
	showConfirmPassword: boolean;
	setCurrentPassword: (value: string) => void;
	setNewPassword: (value: string) => void;
	setConfirmPassword: (value: string) => void;
	setResetError: (value: string) => void;
	setResetMessage: (value: string) => void;
	setShowCurrentPassword: (value: boolean) => void;
	setShowNewPassword: (value: boolean) => void;
	setShowConfirmPassword: (value: boolean) => void;
	handleResetPassword: (
		sessionToken: string,
		e: React.FormEvent,
	) => Promise<{ success: boolean; shouldLogout?: boolean }>;
	resetState: () => void;
}

export const useAdminPasswordReset = (): UseAdminPasswordResetReturn => {
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [resetError, setResetError] = useState('');
	const [resetMessage, setResetMessage] = useState('');
	const [isResettingPassword, setIsResettingPassword] = useState(false);
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const handleResetPassword = async (
		sessionToken: string,
		e: React.FormEvent,
	): Promise<{ success: boolean; shouldLogout?: boolean }> => {
		e.preventDefault();
		setResetError('');
		setResetMessage('');

		if (!sessionToken) {
			setResetError(ERROR_MESSAGES.SESSION_MISSING);
			return { success: false };
		}

		if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
			setResetError(ERROR_MESSAGES.PASSWORD_REQUIRED);
			return { success: false };
		}

		if (newPassword.length < 10) {
			setResetError(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
			return { success: false };
		}

		if (newPassword !== confirmPassword) {
			setResetError(ERROR_MESSAGES.PASSWORD_MISMATCH);
			return { success: false };
		}

		setIsResettingPassword(true);
		try {
			const result = await adminPortalResetPassword({
				sessionToken,
				currentPassword,
				newPassword,
			});

			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
			setResetMessage(result.message || 'Password updated. Please sign in again.');

			return { success: true, shouldLogout: true };
		} catch (error: any) {
			setResetError(error?.message || ERROR_MESSAGES.RESET_PASSWORD_FAILED);
			return { success: false };
		} finally {
			setIsResettingPassword(false);
		}
	};

	const resetState = () => {
		setCurrentPassword('');
		setNewPassword('');
		setConfirmPassword('');
		setResetError('');
		setResetMessage('');
		setShowCurrentPassword(false);
		setShowNewPassword(false);
		setShowConfirmPassword(false);
	};

	return {
		currentPassword,
		newPassword,
		confirmPassword,
		resetError,
		resetMessage,
		isResettingPassword,
		showCurrentPassword,
		showNewPassword,
		showConfirmPassword,
		setCurrentPassword,
		setNewPassword,
		setConfirmPassword,
		setResetError,
		setResetMessage,
		setShowCurrentPassword,
		setShowNewPassword,
		setShowConfirmPassword,
		handleResetPassword,
		resetState,
	};
};
