import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from './Redux/Store/store';
import { logout } from './Redux/Slices/userSlice';
import { LoadingState } from './Components/LoadingState';
import type { UserRole } from './constants/roles';

interface ProtectedRoutesProps {
	children: React.ReactNode;
	requiredRoles?: readonly UserRole[];
}

export const ProtectedRoutes = ({
	children,
	requiredRoles = [],
}: ProtectedRoutesProps) => {
	const dispatch = useDispatch();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isLoading = useSelector((state: RootState) => state.user.authLoading);

	// Auto-logout if currentUser becomes undefined after initial load
	useEffect(() => {
		if (!isLoading && !currentUser) {
			// Clear any stored session data
			localStorage.removeItem('loggedUser');
			// Dispatch logout to ensure state is clean
			dispatch(logout());
		}
	}, [currentUser, isLoading, dispatch]);

	// Show loading state while auth is being initialized
	if (isLoading) {
		return <LoadingState />;
	}

	// Check authentication after loading completes
	if (!currentUser) {
		return <Navigate to='/login' replace />;
	}

	// Check role authorization if required roles specified
	if (
		requiredRoles.length > 0 &&
		!requiredRoles.includes(currentUser.role as UserRole)
	) {
		return <Navigate to='/unauthorized' replace />;
	}

	// Authenticated and authorized: render children
	return <>{children}</>;
};
