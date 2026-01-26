import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './Redux/Store/store';
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
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isLoading = false;

	// Check authentication
	if (!currentUser) {
		return <Navigate to='/login' />;
	}

	// Check role authorization if required roles specified
	if (requiredRoles.length > 0 && !requiredRoles.includes(currentUser.role)) {
		return <Navigate to='/unauthorized' />;
	}

	if (isLoading) {
		return <LoadingState />;
	}

	// Authenticated and authorized: render children
	return <>{children}</>;
};
