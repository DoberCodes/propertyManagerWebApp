import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	PaywallWrapper,
	PaywallContainer,
	BackButton,
	TrialBannerWrapper,
	TrialBannerTitle,
	TrialBannerText,
	TrialCountdown,
	PricingCardsGrid,
	PricingCard,
	PopularBadge,
	PlanName,
	PlanPrice,
	PlanFeatures,
	PlanFeature,
	SelectPlanButton,
	CurrentPlanLabel,
	AdditionalOptionsContainer,
	PromoSection,
	PromoTitle,
	PromoText,
	PromoInput,
	PromoButton,
	ContactSalesSection,
	ContactSalesTitle,
	ContactSalesText,
	ContactSalesButtonStyled,
	BillingToggle,
	BillingToggleButton,
	BillingToggleHint,
} from './PaywallPage.styles';
import { SUBSCRIPTION_PLANS } from '../../constants/subscriptions';
import { SubscriptionData } from '../../utils/subscriptionUtils';
import { ScheduledSubscriptionBanner } from '../../Components/ScheduledSubscriptionBanner/ScheduledSubscriptionBanner';
import {
	getTrialDaysRemaining,
	isTrialActive,
	isSubscriptionActive,
} from '../../utils/subscriptionUtils';
import {
	createCheckoutSession,
	redirectToCheckout,
	validatePromotionCode,
} from '../../services/stripeService';
import {
	BillingCycle,
	getStripePriceIdForPlan,
} from '../../constants/stripe';

interface PaywallPageProps {
	subscription: SubscriptionData;
	currentPlan: string;
	userId?: string;
	userEmail?: string;
	layout?: 'grid' | 'horizontal';
	variant?: 'full' | 'embedded';
	selectionOnly?: boolean;
	onPlanSelect?: (planId: string) => void;
	wide?: boolean;
	onPromoCodeApplied?: (promoCode: string) => void;
}

export const PaywallPage: React.FC<PaywallPageProps> = ({
	subscription,
	currentPlan,
	userId = '',
	userEmail = '',
	layout = 'grid',
	variant = 'full',
	selectionOnly = false,
	onPlanSelect,
	wide = false,
	onPromoCodeApplied,
}) => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [promoCode, setPromoCode] = useState('');
	const [promoLoading, setPromoLoading] = useState(false);
	const [promoError, setPromoError] = useState<string | null>(null);
	const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
	const [isCheckingPromo, setIsCheckingPromo] = useState(false);
	const [promoHint, setPromoHint] = useState<string | null>(null);
	const [promoHintType, setPromoHintType] = useState<'success' | 'error' | null>(
		null,
	);
	const [billingCycle, setBillingCycle] = useState<BillingCycle>('month');
	const isOnTrial = isTrialActive(subscription);
	const daysRemaining = getTrialDaysRemaining(subscription);

	useEffect(() => {
		if (appliedPromoCode) {
			setPromoHint(null);
			setPromoHintType(null);
			setIsCheckingPromo(false);
			return;
		}

		const trimmedPromoCode = promoCode.trim().toLowerCase();
		if (!trimmedPromoCode) {
			setPromoHint(null);
			setPromoHintType(null);
			setIsCheckingPromo(false);
			return;
		}

		const validPromoCodes = [
			process.env.REACT_APP_UNLIMITED_TRIAL_PROMO_CODE?.toLowerCase(),
			process.env.REACT_APP_EXPIRED_TRIAL_PROMO_CODE?.toLowerCase(),
		].filter(Boolean);

		if (validPromoCodes.includes(trimmedPromoCode)) {
			setPromoHint('Valid promo code found. Click Apply Code to use it.');
			setPromoHintType('success');
			setIsCheckingPromo(false);
			return;
		}

		setIsCheckingPromo(true);
		setPromoHint(null);
		setPromoHintType(null);

		const timeoutId = window.setTimeout(async () => {
			try {
				const result = await validatePromotionCode(trimmedPromoCode);
				if (result.valid) {
					setPromoHint('Valid promo code found. Click Apply Code to use it.');
					setPromoHintType('success');
				} else {
					setPromoHint(result.message || 'Invalid or expired promo code.');
					setPromoHintType('error');
				}
			} catch (err) {
				setPromoHint('Unable to validate promo code right now.');
				setPromoHintType('error');
			} finally {
				setIsCheckingPromo(false);
			}
		}, 450);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [promoCode, appliedPromoCode]);

	const getPriceIdForPlan = (planId: string): string => {
		return getStripePriceIdForPlan(planId, billingCycle);
	};

	const getPlanDisplayPrice = (planId: 'home' | 'property' | 'portfolio') => {
		if (planId === 'home') return SUBSCRIPTION_PLANS.HOME.priceMonthly;
		if (planId === 'property') {
			return billingCycle === 'year'
				? SUBSCRIPTION_PLANS.PROPERTY.priceYearly
				: SUBSCRIPTION_PLANS.PROPERTY.priceMonthly;
		}
		return billingCycle === 'year'
			? SUBSCRIPTION_PLANS.PORTFOLIO.priceYearly
			: SUBSCRIPTION_PLANS.PORTFOLIO.priceMonthly;
	};

	const handlePlanSelect = async (planId: string) => {
		if (selectionOnly) {
			onPlanSelect?.(planId);
			return;
		}

		// Only prevent selecting the current plan if user has an active PAID subscription
		// Trial users should be able to keep their trial or upgrade anytime
		if (
			planId === currentPlan &&
			isSubscriptionActive(subscription) &&
			subscription.status !== 'trial'
		) {
			navigate('/dashboard');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// For free plan, just navigate to dashboard
			if (planId === 'free') {
				navigate('/dashboard');
				return;
			}

			// Create checkout session for paid plans
			const priceId = getPriceIdForPlan(planId);
			if (!priceId || !userId || !userEmail) {
				setError('Unable to process payment. Please ensure you are logged in.');
				setLoading(false);
				return;
			}

			// If user is in trial, pass trial end date for pre-scheduling
			// This allows seamless transition from trial to paid without interruption
			const trialEnd =
				isOnTrial && subscription.trialEndsAt
					? subscription.trialEndsAt
					: undefined;

			const checkoutUrl = await createCheckoutSession(
				priceId,
				userId,
				userEmail,
				trialEnd,
				appliedPromoCode || undefined,
				planId,
				billingCycle,
			);

			if (checkoutUrl) {
				// Redirect to Stripe hosted checkout URL for first-time subscription setup.
				redirectToCheckout(checkoutUrl);
				return;
			}

			navigate('/dashboard');
		} catch (err) {
			console.error('Failed to process payment:', err);
			setError(
				err instanceof Error
					? err.message
					: 'An error occurred. Please try again.',
			);
			setLoading(false);
		}
	};

	const handlePromoCode = async () => {
		if (!promoCode.trim()) {
			setPromoError('Please enter a promo code');
			return;
		}

		setPromoLoading(true);
		setPromoError(null);
		setPromoHint(null);
		setPromoHintType(null);

		try {
			// Validate promo code
			const trimmedPromoCode = promoCode.trim().toLowerCase();

			// Keep local env promo codes for trial-testing behavior
			const validPromoCodes = [
				process.env.REACT_APP_UNLIMITED_TRIAL_PROMO_CODE?.toLowerCase(),
				process.env.REACT_APP_EXPIRED_TRIAL_PROMO_CODE?.toLowerCase(),
			].filter(Boolean);

			if (validPromoCodes.includes(trimmedPromoCode)) {
				// Valid promo code - call the callback and track applied promo
				setAppliedPromoCode(trimmedPromoCode);
				onPromoCodeApplied?.(trimmedPromoCode);
				setPromoCode(''); // Clear input but keep applied state
				setPromoError(null);
				setPromoHint(null);
				setPromoHintType(null);
			} else {
				const result = await validatePromotionCode(trimmedPromoCode);
				if (result.valid) {
					setAppliedPromoCode(result.code || trimmedPromoCode);
					onPromoCodeApplied?.(result.code || trimmedPromoCode);
					setPromoCode('');
					setPromoError(null);
					setPromoHint(null);
					setPromoHintType(null);
				} else {
					setPromoError(result.message || 'Invalid promo code. Please try again.');
				}
			}
		} catch (err) {
			console.error('Failed to apply promo code:', err);
			setPromoError(
				err instanceof Error
					? err.message
					: 'Failed to apply promo code. Please try again.',
			);
		} finally {
			setPromoLoading(false);
		}
	};

	const handleContactSales = () => {
		// TODO: Implement contact sales form or mailto link
		window.location.href =
			'mailto:maintleyapp@gmail.com?subject=Custom Pricing Inquiry';
	};

	const handleBackToSettings = () => {
		navigate('/settings');
	};

	return (
		<PaywallWrapper variant={variant} wide={wide}>
			<PaywallContainer variant={variant} wide={wide}>
				{variant === 'full' && (
					<BackButton variant={variant} onClick={handleBackToSettings}>
						← Back to Settings
					</BackButton>
				)}

				{/* Scheduled Subscription Banner */}
				{subscription?.hasScheduledSubscription &&
					subscription?.scheduledPlan &&
					subscription?.trialEndsAt && (
						<ScheduledSubscriptionBanner
							scheduledPlan={subscription.scheduledPlan}
							trialEndsAt={subscription.trialEndsAt}
							onManageClick={() => navigate('/settings')}
						/>
					)}

				{!isOnTrial && !subscription?.hasScheduledSubscription && (
					<TrialBannerWrapper variant={variant}>
						<TrialBannerTitle variant={variant}>
							✨ Free 14-Day Trial Available on All Plans
						</TrialBannerTitle>
						<TrialBannerText variant={variant}>
							No credit card required. Start your free trial and explore all
							features.
						</TrialBannerText>
					</TrialBannerWrapper>
				)}

				{variant === 'full' && error && (
					<TrialBannerWrapper
						variant={variant}
						style={{ backgroundColor: '#dc3545' }}>
						<TrialBannerTitle variant={variant} style={{ color: 'white' }}>
							⚠️ {error}
						</TrialBannerTitle>
					</TrialBannerWrapper>
				)}

				{variant === 'full' &&
					isOnTrial &&
					!subscription?.hasScheduledSubscription && (
						<TrialBannerWrapper variant={variant}>
							<TrialBannerTitle variant={variant}>
								🎉 You're on a Free Trial!
							</TrialBannerTitle>
							{daysRemaining === -1 ? (
								<>
									<TrialCountdown variant={variant}>∞</TrialCountdown>
									<TrialBannerText variant={variant}>
										unlimited access
									</TrialBannerText>
								</>
							) : (
								<>
									<TrialCountdown variant={variant}>
										{daysRemaining}
									</TrialCountdown>
									<TrialBannerText variant={variant}>
										days remaining in your free trial
									</TrialBannerText>
								</>
							)}
							<TrialBannerText variant={variant}>
								Upgrade to a paid plan anytime to keep your data and enjoy all
								premium features.
							</TrialBannerText>
						</TrialBannerWrapper>
					)}

					<BillingToggle>
						<BillingToggleButton
							type='button'
							$active={billingCycle === 'month'}
							onClick={() => setBillingCycle('month')}>
							Monthly
						</BillingToggleButton>
						<BillingToggleButton
							type='button'
							$active={billingCycle === 'year'}
							onClick={() => setBillingCycle('year')}>
							Annual
						</BillingToggleButton>
					</BillingToggle>
					{billingCycle === 'year' && (
						<BillingToggleHint>Annual billing selected</BillingToggleHint>
					)}

				<PricingCardsGrid layout={wide ? 'horizontal' : layout}>
					{/* Home Plan */}
					<PricingCard
						isCurrentPlan={
							currentPlan === 'home' && isSubscriptionActive(subscription)
						}
						layout={layout}>
						<PlanName>{SUBSCRIPTION_PLANS.HOME.name}</PlanName>
						<PlanPrice
							color={
								currentPlan === 'home' &&
								isSubscriptionActive(subscription)
									? 'white'
									: 'black'
							}>
							<div className='price'>
								${getPlanDisplayPrice('home')}
							</div>
							<div className='period'>
								{billingCycle === 'year' ? 'per year' : 'per month'}
							</div>
						</PlanPrice>
						<PlanFeatures>
							{SUBSCRIPTION_PLANS.HOME.features.map((feature, idx) => (
								<PlanFeature
									key={idx}
									color={
										currentPlan === 'home' &&
										isSubscriptionActive(subscription)
											? 'white'
											: 'black'
									}>
									{feature}
								</PlanFeature>
							))}
						</PlanFeatures>
						{currentPlan === 'home' &&
							isSubscriptionActive(subscription) && (
								<CurrentPlanLabel>Current Plan</CurrentPlanLabel>
							)}
						<SelectPlanButton
							isCurrentPlan={
								currentPlan === 'home' &&
								isSubscriptionActive(subscription) &&
								subscription.status !== 'trial'
							}
							disabled={
								selectionOnly
									? loading
									: (currentPlan === 'home' &&
											isSubscriptionActive(subscription) &&
											subscription.status !== 'trial') ||
									  loading
							}
							onClick={() => handlePlanSelect('home')}>
							{currentPlan === 'home' && isSubscriptionActive(subscription)
								? selectionOnly
									? 'Selected'
									: subscription.status !== 'trial'
									? 'Current Plan'
									: 'Upgrade Now'
								: selectionOnly
								? 'Select Plan'
								: 'Upgrade'}
						</SelectPlanButton>
					</PricingCard>
					{/* Property Plan */}
					<PricingCard
						isPopular
						isCurrentPlan={
							currentPlan === 'property' && isSubscriptionActive(subscription)
						}
						layout={layout}>
						<PopularBadge>Popular</PopularBadge>
						<PlanName>{SUBSCRIPTION_PLANS.PROPERTY.name}</PlanName>
						<PlanPrice
							color={
								currentPlan === 'property' && isSubscriptionActive(subscription)
									? 'white'
									: 'black'
							}>
							<div className='price'>
								${getPlanDisplayPrice('property')}
							</div>
							<div className='period'>
								{billingCycle === 'year' ? 'per year' : 'per month'}
							</div>
						</PlanPrice>
						<PlanFeatures>
							{SUBSCRIPTION_PLANS.PROPERTY.features.map((feature, idx) => (
								<PlanFeature
									key={idx}
									color={
										(currentPlan === 'property' &&
											isSubscriptionActive(subscription)) ||
										(isOnTrial && subscription?.scheduledPlan === 'property')
											? 'white'
											: 'black'
									}>
									{feature}
								</PlanFeature>
							))}
						</PlanFeatures>
					{(currentPlan === 'property' && isSubscriptionActive(subscription)) ||
					(isOnTrial && subscription?.scheduledPlan === 'property') ? (
						<CurrentPlanLabel>
							{isOnTrial && subscription?.hasScheduledSubscription
								? 'Scheduled Plan'
								: 'Current Plan'}
						</CurrentPlanLabel>
					) : null}
					<SelectPlanButton
						isCurrentPlan={
							((currentPlan === 'property' &&
								isSubscriptionActive(subscription)) ||
								(isOnTrial && subscription?.scheduledPlan === 'property')) &&
							!isOnTrial
						}
						disabled={
							selectionOnly
								? loading
								: (currentPlan === 'property' &&
										isSubscriptionActive(subscription) &&
										subscription.status !== 'trial') ||
								  loading
						}
						onClick={() => handlePlanSelect('property')}>
						{currentPlan === 'property' && isSubscriptionActive(subscription)
							? selectionOnly
								? 'Selected'
								: subscription.status !== 'trial'
								? 'Current Plan'
								: 'Upgrade Now'
							: selectionOnly
							? 'Select Plan'
							: isOnTrial && subscription?.scheduledPlan === 'property'
							? 'Scheduled'
							: 'Upgrade'}
						</SelectPlanButton>
					</PricingCard>

					{/* Portfolio Plan */}
					<PricingCard
						isCurrentPlan={
							currentPlan === 'portfolio' &&
							isSubscriptionActive(subscription)
						}
						layout={layout}>
						<PlanName>{SUBSCRIPTION_PLANS.PORTFOLIO.name}</PlanName>
						<PlanPrice
							color={
								currentPlan === 'portfolio' &&
								isSubscriptionActive(subscription)
									? 'white'
									: 'black'
							}>
							<div className='price'>
								${getPlanDisplayPrice('portfolio')}
							</div>
							<div className='period'>
								{billingCycle === 'year' ? 'per year' : 'per month'}
							</div>
						</PlanPrice>
						<PlanFeatures>
							{SUBSCRIPTION_PLANS.PORTFOLIO.features.map((feature, idx) => (
								<PlanFeature
									key={idx}
									color={
									(currentPlan === 'portfolio' &&
										isSubscriptionActive(subscription)) ||
										(isOnTrial &&
											subscription?.scheduledPlan === 'portfolio')
											? 'white'
											: 'black'
									}>
									{feature}
								</PlanFeature>
							))}
						</PlanFeatures>
					{(currentPlan === 'portfolio' &&
						isSubscriptionActive(subscription)) ||
					(isOnTrial && subscription?.scheduledPlan === 'portfolio') ? (
							<CurrentPlanLabel>
								{isOnTrial && subscription?.hasScheduledSubscription
									? 'Scheduled Plan'
									: 'Current Plan'}
							</CurrentPlanLabel>
						) : null}
						<SelectPlanButton
							isCurrentPlan={
								((currentPlan === 'portfolio' &&
									isSubscriptionActive(subscription)) ||
									(isOnTrial &&
										subscription?.scheduledPlan === 'portfolio')) &&
								!isOnTrial
							}
							disabled={
								selectionOnly
									? loading
									: (currentPlan === 'portfolio' &&
											isSubscriptionActive(subscription) &&
											subscription.status !== 'trial') ||
									  loading
							}
							onClick={() => handlePlanSelect('portfolio')}>
							{currentPlan === 'portfolio' &&
							isSubscriptionActive(subscription)
								? selectionOnly
									? 'Selected'
									: subscription.status !== 'trial'
									? 'Current Plan'
									: 'Upgrade Now'
								: selectionOnly
								? 'Select Plan'
								: isOnTrial && subscription?.scheduledPlan === 'portfolio'
								? 'Scheduled'
								: 'Upgrade'}
						</SelectPlanButton>
					</PricingCard>

					{/* Enterprise Plan - Removed */}
				</PricingCardsGrid>

				<AdditionalOptionsContainer layout={layout}>
					<PromoSection layout={layout}>
						<PromoTitle layout={layout}>
							{appliedPromoCode
								? 'Promo Code Applied ✅'
								: 'Have a Promo Code?'}
						</PromoTitle>
						{appliedPromoCode ? (
							<PromoText
								layout={layout}
								style={{ color: '#22c55e', fontWeight: 'bold' }}>
								Promo code "{appliedPromoCode.toUpperCase()}" has been applied!
							</PromoText>
						) : (
							<>
								<PromoText layout={layout}>
									Enter your promo code to unlock special pricing.
								</PromoText>
								<PromoInput
									layout={layout}
									type='text'
									placeholder='Enter promo code'
									value={promoCode}
									onChange={(e) => setPromoCode(e.target.value)}
									onKeyPress={(e) => e.key === 'Enter' && handlePromoCode()}
								/>
								{isCheckingPromo && (
									<PromoText layout={layout} style={{ marginBottom: '12px' }}>
										Checking promo code...
									</PromoText>
								)}
								{promoHint && !promoError && (
									<PromoText
										layout={layout}
										style={{
											color:
												promoHintType === 'success' ? '#22c55e' : '#dc3545',
											marginBottom: '12px',
										}}>
										{promoHint}
									</PromoText>
								)}
								{promoError && (
									<PromoText
										layout={layout}
										style={{ color: '#dc3545', marginBottom: '12px' }}>
										{promoError}
									</PromoText>
								)}
								<PromoButton onClick={handlePromoCode} disabled={promoLoading}>
									{promoLoading ? 'Applying...' : 'Apply Code'}
								</PromoButton>
							</>
						)}
					</PromoSection>

					<ContactSalesSection layout={layout}>
						<ContactSalesTitle layout={layout}>
							Need More Properties?
						</ContactSalesTitle>
						<ContactSalesText layout={layout}>
							Managing more than 10 properties? Get a customized plan with
							portfolio pricing, advanced reporting and priority support.
						</ContactSalesText>
						<ContactSalesButtonStyled
							layout={layout}
							onClick={handleContactSales}>
							Contact Sales
						</ContactSalesButtonStyled>
					</ContactSalesSection>
				</AdditionalOptionsContainer>
			</PaywallContainer>
		</PaywallWrapper>
	);
};

export default PaywallPage;
