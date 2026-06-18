/**
 * useAdminAuth Hook
 * Manages admin authentication state and lifecycle
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signOutUser } from '../../../services/authService';
import { setCurrentUser } from '../../../Redux/Slices/userSlice';
import { hasMaintleyAdminAccess } from '../../../utils/maintleyRole';
import type { MaintleyRoleValue } from '../../../utils/maintleyRole';
import type { RootState } from '../../../Redux/store/store';
import type { AdminUser } from '../../../services/adminPortalService';
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
	const dispatch = useDispatch();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const authLoading = useSelector((state: RootState) => state.user.authLoading);

	const [sessionToken, setSessionToken] = useState<string | null>(null);
	const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
	const [checkingSession, setCheckingSession] = useState(true);
	const [authError, setAuthError] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [showLoginPassword, setShowLoginPassword] = useState(false);

	const initializeSession = async () => {
		if (authLoading) {
			setCheckingSession(true);
			return;
		}

		const maintleyRole = (currentUser?.maintley_role ?? null) as MaintleyRoleValue;
		const canAccessAdmin = hasMaintleyAdminAccess(maintleyRole);

		if (!currentUser || !canAccessAdmin) {
			setSessionToken(null);
			setAdminUser(null);
			setCheckingSession(false);
			return;
		}

		setSessionToken(currentUser.id);
		const firstName = String(currentUser.firstName || '').trim();
		const lastName = String(currentUser.lastName || '').trim();
		const displayName = `${firstName} ${lastName}`.trim() || String(currentUser.email || 'Maintley Admin');
		setAdminUser({
			id: currentUser.id,
			username: String(currentUser.email || currentUser.id),
			displayName,
			email: currentUser.email || null,
			roles: ['admin'],
		});
		setCheckingSession(false);
	};

	useEffect(() => {
		void initializeSession();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [authLoading, currentUser]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setAuthError(ERROR_MESSAGES.LOGIN_FAILED);
	};

	const handleLogout = async () => {
		await signOutUser();
		dispatch(setCurrentUser(null));
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
