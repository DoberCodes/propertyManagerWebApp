import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../../Components/Library';
import { SplashScreen } from '../../Components/Library/SplashScreen';
import { COLORS } from '../../constants/colors';
import { setCurrentUser } from '../../Redux/Slices/userSlice';
import type { AppDispatch, RootState } from '../../Redux/store/store';
import { handleCheckoutSuccess } from '../../services/stripeService';
import { getUserProfile } from '../../services/userProfileService';

const CompletionShell = styled.main`
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	padding: 24px;
	background: ${COLORS.gradientPrimary};
`;

const CompletionCard = styled.section`
	width: min(440px, 100%);
	padding: 32px 28px;
	border-radius: 22px;
	background: rgba(255, 255, 255, 0.96);
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

export const CheckoutCompletionPage = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const dispatch = useDispatch<AppDispatch>();
	const location = useLocation();
	const navigate = useNavigate();
	const startedRef = useRef(false);
	const [error, setError] = useState<string | null>(null);
	const [attempt, setAttempt] = useState(0);

	const finishCheckout = useCallback(async () => {
		const sessionId = new URLSearchParams(location.search).get('session_id');
		if (!sessionId || !currentUser?.id) {
			setError(
				sessionId
					? 'Your account session could not be loaded. Please sign in and try again.'
					: 'This checkout link is incomplete. Return to your account to choose a plan.',
			);
			return;
		}

		setError(null);
		try {
			await handleCheckoutSuccess(sessionId);
			const refreshedUser = await getUserProfile(currentUser.id);
			dispatch(setCurrentUser(refreshedUser));
			navigate('/dashboard', { replace: true });
		} catch (checkoutError) {
			console.error('Checkout completion failed:', checkoutError);
			setError(
				'We could not finish updating your account. Your account and checkout details are still available. Please try again.',
			);
		}
	}, [currentUser?.id, dispatch, location.search, navigate]);

	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;
		void finishCheckout();
	}, [attempt, finishCheckout]);

	const retry = () => {
		startedRef.current = false;
		setAttempt((current) => current + 1);
	};

	if (!error) {
		return (
			<SplashScreen
				title='Finishing your account'
				message='Confirming your plan before opening Maintley.'
				steps={[
					'Confirming your checkout...',
					'Updating your account...',
					'Preparing Maintley...',
				]}
			/>
		);
	}

	return (
		<CompletionShell>
			<CompletionCard aria-live='polite'>
				<Wordmark aria-label='Maintley'>Maintley</Wordmark>
				<Title>We need one more moment</Title>
				<Message>{error}</Message>
				<Actions>
					<PrimaryButton type='button' onClick={retry}>
						Try Again
					</PrimaryButton>
					<SecondaryButton
						type='button'
						onClick={() => navigate('/paywall', { replace: true })}>
						Return to Plans
					</SecondaryButton>
				</Actions>
			</CompletionCard>
		</CompletionShell>
	);
};
