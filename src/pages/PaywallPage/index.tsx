import React from 'react';
import { useSelector } from 'react-redux';
import PaywallPage from './PaywallPage';
import { SubscriptionData } from '../../utils/subscriptionUtils';

/**
 * Paywall Page Wrapper - Connected to Redux for subscription data
 * Allows users to view pricing plans and select a subscription
 */
const PaywallPageIndex: React.FC = () => {
	const user = useSelector((state: any) => state.user.currentUser);
	const subscription: SubscriptionData = user?.subscription || {
		status: 'trial',
		plan: 'free',
		currentPeriodStart: Math.floor(Date.now() / 1000),
		currentPeriodEnd: Math.floor(Date.now() / 1000),
	};
	const currentPlan = subscription?.plan || 'free';

	return (
		<PaywallPage
			subscription={subscription}
			currentPlan={currentPlan}
			userId={user?.id}
			userEmail={user?.email}
		/>
	);
};

export default PaywallPageIndex;
