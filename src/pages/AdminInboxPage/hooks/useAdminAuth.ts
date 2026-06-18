/**
 * useAdminAuth Hook
 * Manages admin authentication state and lifecycle
 */

import { useEffect, useState } from 'react';
import {
	AdminUser,
	adminPortalLogin,
	adminPortalLogout,
	clearAdminSessionToken,
	getAdminSessionToken,
	saveAdminSessionToken,
	validateAdminSession,
} from '../../../services/adminPortalService';
import { ERROR_MESSAGES } from '../constants';

export interface UseAdminAuthReturn {
	sessionToken: string | null;
	adminUser: AdminUser | null;
	checkingSession: boolean;
	authError: string;
	username: string;
	password: string;
	showLoginPassword: boolean;
	setUsername: (value: string) => void;
	setPassword: (value: string) => void;
	setShowLoginPassword: (value: boolean) => void;
	setAuthError: (value: string) => void;
	handleLogin: (e: React.FormEvent) => Promise<void>;
	handleLogout: () => Promise<void>;
	initializeSession: () => Promise<void>;
}

export const useAdminAuth = (): UseAdminAuthReturn => {
	const [sessionToken, setSessionToken] = useState<string | null>(null);
	const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
	const [checkingSession, setCheckingSession] = useState(true);
	const [authError, setAuthError] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [showLoginPassword, setShowLoginPassword] = useState(false);

	const initializeSession = async () => {
		setCheckingSession(true);
		const storedToken = getAdminSessionToken();
		if (!storedToken) {
			setCheckingSession(false);
			return;
		}

		try {
			const result = await validateAdminSession(storedToken);
			setSessionToken(storedToken);
			setAdminUser(result.adminUser);
		} catch {
			clearAdminSessionToken();
			setSessionToken(null);
			setAdminUser(null);
		}
		setCheckingSession(false);
	};

	useEffect(() => {
		void initializeSession();
	}, []);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setAuthError('');

		if (!username.trim() || !password.trim()) {
			setAuthError(ERROR_MESSAGES.MISSING_CREDENTIALS);
			return;
		}

		try {
			const result = await adminPortalLogin(username.trim(), password);
			saveAdminSessionToken(result.sessionToken);
			setSessionToken(result.sessionToken);
			setAdminUser(result.adminUser);
			setPassword('');
		} catch (error: any) {
			setAuthError(error?.message || ERROR_MESSAGES.LOGIN_FAILED);
		}
	};

	const handleLogout = async () => {
		if (sessionToken) {
			try {
				await adminPortalLogout(sessionToken);
			} catch {
				// local cleanup still applies even if network call fails
			}
		}
		clearAdminSessionToken();
		setSessionToken(null);
		setAdminUser(null);
		setPassword('');
	};

	return {
		sessionToken,
		adminUser,
		checkingSession,
		authError,
		username,
		password,
		showLoginPassword,
		setUsername,
		setPassword,
		setShowLoginPassword,
		setAuthError,
		handleLogin,
		handleLogout,
		initializeSession,
	};
};
