import React from 'react';
import { Navigate } from 'react-router-dom';
import {
	SubscriptionData,
	isSubscriptionActive,
} from '../../utils/subscriptionUtils';

interface ProtectedByPaywallProps {
	subscription?: SubscriptionData;
	children: React.ReactNode;
}

/**
 * Route guard that checks subscription status
 * If user doesn't have active subscription, redirects to paywall
 */
export const ProtectedByPaywall: React.FC<ProtectedByPaywallProps> = ({
	subscription,
	children,
}) => {
	// If no subscription data, redirect to paywall
	if (!subscription) {
		return <Navigate to='/paywall' replace />;
	}

	// If subscription is not active, redirect to paywall
	if (!isSubscriptionActive(subscription)) {
		return <Navigate to='/paywall' replace />;
	}

	// Subscription is active, allow access
	return <>{children}</>;
};

export default ProtectedByPaywall;
