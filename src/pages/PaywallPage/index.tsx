import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import PaywallPage from './PaywallPage';
import {
	getEffectiveSubscriptionPlanId,
	SubscriptionData,
} from '../../utils/subscriptionUtils';
import { useUpdateUserMutation } from '../../Redux/API/userSlice';
import { setCurrentUser } from '../../Redux/Slices/userSlice';
import type { AppDispatch } from '../../Redux/store/store';
import { callFirebaseFunction } from '../../config/firebaseFunctions';

/**
 * Paywall Page Wrapper - Connected to Redux for subscription data
 * Allows users to view pricing plans and select a subscription
 */
const PaywallPageIndex: React.FC = () => {
	const user = useSelector((state: any) => state.user.currentUser);
	const dispatch = useDispatch<AppDispatch>();
	const location = useLocation();
	const [updateUser] = useUpdateUserMutation();
	const subscription: SubscriptionData = useMemo(
		() =>
			user?.subscription || {
				status: 'trial',
				plan: 'homeowner',
				currentPeriodStart: Math.floor(Date.now() / 1000),
				currentPeriodEnd: Math.floor(Date.now() / 1000),
			},
		[user?.subscription],
	);
	const currentPlan = getEffectiveSubscriptionPlanId(subscription, 'homeowner');
	const continueWithFreePlan = useCallback(async () => {
		if (!user?.id) return;

		const {
			pendingCheckoutPlan: _pendingCheckoutPlan,
			pendingCheckoutStartedAt: _pendingCheckoutStartedAt,
			...confirmedSubscription
		} = user.subscription || subscription;

		await updateUser({
			id: user.id,
			updates: { subscription: confirmedSubscription },
		}).unwrap();
		await callFirebaseFunction<
			{
				accountId?: string;
				syncSubscription: boolean;
				subscription: Record<string, unknown>;
			},
			unknown
		>('ensureFamilyAccount', {
			accountId: String(user.accountId || user.id),
			syncSubscription: true,
			subscription: confirmedSubscription as Record<string, unknown>,
		});
		dispatch(
			setCurrentUser({
				...user,
				subscription: confirmedSubscription,
			}),
		);
	}, [dispatch, subscription, updateUser, user]);

	useEffect(() => {
		const checkoutResult = new URLSearchParams(location.search).get('checkout');
		if (
			!['cancelled', 'failed'].includes(checkoutResult || '') ||
			!user?.subscription?.pendingCheckoutPlan
		) {
			return;
		}

		void continueWithFreePlan().catch((error) => {
			console.error('Failed to clear pending checkout state:', error);
		});
	}, [
		continueWithFreePlan,
		location.search,
		user?.subscription?.pendingCheckoutPlan,
	]);

	return (
		<PaywallPage
			subscription={subscription}
			currentPlan={currentPlan}
			userId={user?.id}
			userEmail={user?.email}
			onFreePlanContinue={continueWithFreePlan}
		/>
	);
};

export default PaywallPageIndex;
