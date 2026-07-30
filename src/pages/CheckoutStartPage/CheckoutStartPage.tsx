import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../../Components/Library';
import { SplashScreen } from '../../Components/Library/SplashScreen';
import { COLORS } from '../../constants/colors';
import { getStripePriceIdForPlan } from '../../constants/stripe';
import { setCurrentUser } from '../../Redux/Slices/userSlice';
import type { AppDispatch, RootState } from '../../Redux/store/store';
import {
	createCheckoutSession,
	redirectToCheckout,
} from '../../services/stripeService';
import { getUserProfile } from '../../services/userProfileService';

const CheckoutShell = styled.main`
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	padding: 24px;
	background: ${COLORS.gradientPrimary};
`;

const CheckoutCard = styled.section`
	width: min(460px, 100%);
	padding: 32px 28px;
	border-radius: 22px;
	background: rgba(255, 255, 255, 0.97);
	box-shadow: 0 26px 80px rgba(3, 97, 81, 0.32);
	text-align: center;
`;

const Wordmark = styled.div`
	margin-bottom: 28px;
	color: ${COLORS.primary};
	font-size: 40px;
	font-weight: 700;
`;

const Title = styled.h1`
	margin: 0 0 12px;
	color: ${COLORS.textPrimary};
	font-size: 24px;
`;

const Message = styled.p`
	margin: 0 0 24px;
	color: ${COLORS.textSecondary};
	font-size: 15px;
	line-height: 1.6;
`;

const Actions = styled.div`
	display: grid;
	gap: 12px;
`;

export const CheckoutStartPage = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const startedRef = useRef(false);
	const [attempt, setAttempt] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const pendingPlan = currentUser?.subscription?.pendingCheckoutPlan;

	const openCheckout = useCallback(async () => {
		if (!currentUser?.id || !currentUser.email || !pendingPlan) {
			setError(
				'Your account is available, but the pending plan could not be loaded. Return to Plans to choose it again.',
			);
			return;
		}

		setError(null);
		try {
			const checkoutUrl = await createCheckoutSession(
				getStripePriceIdForPlan(pendingPlan, 'month'),
				currentUser.id,
				currentUser.email,
				undefined,
				currentUser.subscription?.promoCode,
				pendingPlan,
				'month',
			);

			if (checkoutUrl) {
				redirectToCheckout(checkoutUrl);
				return;
			}

			const refreshedUser = await getUserProfile(currentUser.id);
			dispatch(setCurrentUser(refreshedUser));
			navigate('/dashboard', { replace: true });
		} catch (checkoutError) {
			console.error('Checkout launch failed:', checkoutError);
			setError(
				checkoutError instanceof Error
					? checkoutError.message
					: 'Secure checkout could not be opened. Please try again.',
			);
		}
	}, [currentUser, dispatch, navigate, pendingPlan]);

	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;
		void openCheckout();
	}, [attempt, openCheckout]);

	const retry = () => {
		startedRef.current = false;
		setAttempt((current) => current + 1);
	};

	if (!currentUser) {
		return <Navigate to='/login' replace />;
	}

	if (!pendingPlan && !error) {
		return <Navigate to='/paywall' replace />;
	}

	if (!error) {
		return (
			<SplashScreen
				title='Opening secure checkout'
				message='Your account is ready. Connecting you to Stripe to review your plan.'
				steps={[
					'Confirming your plan...',
					'Opening secure checkout...',
					'Waiting for Stripe...',
				]}
			/>
		);
	}

	return (
		<CheckoutShell>
			<CheckoutCard aria-live='polite'>
				<Wordmark aria-label='Maintley'>Maintley</Wordmark>
				<Title>Checkout did not open</Title>
				<Message>
					{error} Your account is safe and remains on the Free plan unless
					Stripe confirms payment.
				</Message>
				<Actions>
					<PrimaryButton type='button' onClick={retry}>
						Try Secure Checkout Again
					</PrimaryButton>
					<SecondaryButton
						type='button'
						onClick={() =>
							navigate('/paywall?checkout=failed', { replace: true })
						}>
						Continue on Free
					</SecondaryButton>
				</Actions>
			</CheckoutCard>
		</CheckoutShell>
	);
};
