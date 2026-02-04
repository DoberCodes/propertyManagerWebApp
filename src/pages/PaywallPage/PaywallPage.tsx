import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	PaywallWrapper,
	PaywallContainer,
	PaywallTitle,
	PaywallSubtitle,
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
} from './PaywallPage.styles';
import { SUBSCRIPTION_PLANS } from '../../constants/subscriptions';
import { SubscriptionData } from '../../utils/subscriptionUtils';
import {
	getTrialDaysRemaining,
	isTrialActive,
} from '../../utils/subscriptionUtils';
import {
	createCheckoutSession,
	redirectToCheckout,
} from '../../services/stripeService';
import { STRIPE_PLANS } from '../../constants/stripe';

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
	const isOnTrial = isTrialActive(subscription);
	const daysRemaining = getTrialDaysRemaining(subscription);

	const getPriceIdForPlan = (planId: string): string => {
		const priceMap: Record<string, string> = {
			free: STRIPE_PLANS.FREE,
			homeowner: STRIPE_PLANS.HOMEOWNER,
			basic: STRIPE_PLANS.BASIC,
			professional: STRIPE_PLANS.PROFESSIONAL,
		};
		return priceMap[planId] || '';
	};

	const handlePlanSelect = async (planId: string) => {
		if (selectionOnly) {
			onPlanSelect?.(planId);
			return;
		}

		if (planId === currentPlan) {
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

			const checkoutUrl = await createCheckoutSession(
				priceId,
				userId,
				userEmail,
			);

			// Redirect to Stripe hosted checkout URL
			redirectToCheckout(checkoutUrl);
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

		try {
			// Validate promo code
			const trimmedPromoCode = promoCode.trim().toLowerCase();

			// Check for valid promo codes
			if (trimmedPromoCode === 'alpha1_free') {
				// Valid promo code - call the callback
				onPromoCodeApplied?.(trimmedPromoCode);
				setPromoCode('');
				setPromoError(null);
			} else {
				// Invalid promo code
				setPromoError('Invalid promo code. Please try again.');
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
			'mailto:sales@propertymanager.com?subject=Custom Pricing Inquiry';
	};

	return (
		<PaywallWrapper variant={variant} wide={wide}>
			<PaywallContainer variant={variant} wide={wide}>
				{!isOnTrial && (
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

				{variant === 'full' && (
					<>
						<PaywallTitle variant={variant}>Choose Your Plan</PaywallTitle>
						<PaywallSubtitle variant={variant}>
							Start your free 14-day trial today. No credit card required.
						</PaywallSubtitle>
					</>
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

				{variant === 'full' && isOnTrial && (
					<TrialBannerWrapper variant={variant}>
						<TrialBannerTitle variant={variant}>
							🎉 You're on a Free Trial!
						</TrialBannerTitle>
						<TrialCountdown variant={variant}>{daysRemaining}</TrialCountdown>
						<TrialBannerText variant={variant}>
							days remaining in your free trial
						</TrialBannerText>
						<TrialBannerText variant={variant}>
							Upgrade to a paid plan anytime to keep your data and enjoy all
							premium features.
						</TrialBannerText>
					</TrialBannerWrapper>
				)}

				<PricingCardsGrid layout={wide ? 'horizontal' : layout}>
					{/* Homeowner Plan */}
					<PricingCard
						isCurrentPlan={currentPlan === 'homeowner'}
						layout={layout}>
						<PlanName>{SUBSCRIPTION_PLANS.HOMEOWNER.name}</PlanName>
						<PlanPrice color={currentPlan === 'homeowner' ? 'white' : 'black'}>
							<div className='price'>
								${SUBSCRIPTION_PLANS.HOMEOWNER.priceMonthly}
							</div>
							<div className='period'>per month</div>
						</PlanPrice>
						<PlanFeatures>
							{SUBSCRIPTION_PLANS.HOMEOWNER.features.map((feature, idx) => (
								<PlanFeature
									key={idx}
									color={currentPlan === 'homeowner' ? 'white' : 'black'}>
									{feature}
								</PlanFeature>
							))}
						</PlanFeatures>
						{currentPlan === 'homeowner' && (
							<CurrentPlanLabel>Current Plan</CurrentPlanLabel>
						)}
						<SelectPlanButton
							isCurrentPlan={currentPlan === 'homeowner'}
							disabled={
								selectionOnly ? loading : currentPlan === 'homeowner' || loading
							}
							onClick={() => handlePlanSelect('homeowner')}>
							{currentPlan === 'homeowner'
								? selectionOnly
									? 'Selected'
									: 'Current Plan'
								: selectionOnly
									? 'Select Plan'
									: 'Upgrade'}
						</SelectPlanButton>
					</PricingCard>
					{/* Basic Plan */}
					<PricingCard
						isPopular
						isCurrentPlan={currentPlan === 'basic'}
						layout={layout}>
						<PopularBadge>Popular</PopularBadge>
						<PlanName>{SUBSCRIPTION_PLANS.BASIC.name}</PlanName>
						<PlanPrice color={currentPlan === 'basic' ? 'white' : 'black'}>
							<div className='price'>
								${SUBSCRIPTION_PLANS.BASIC.priceMonthly}
							</div>
							<div className='period'>per month</div>
						</PlanPrice>
						<PlanFeatures>
							{SUBSCRIPTION_PLANS.BASIC.features.map((feature, idx) => (
								<PlanFeature
									key={idx}
									color={currentPlan === 'basic' ? 'white' : 'black'}>
									{feature}
								</PlanFeature>
							))}
						</PlanFeatures>
						{currentPlan === 'basic' && (
							<CurrentPlanLabel>Current Plan</CurrentPlanLabel>
						)}
						<SelectPlanButton
							isCurrentPlan={currentPlan === 'basic'}
							disabled={
								selectionOnly ? loading : currentPlan === 'basic' || loading
							}
							onClick={() => handlePlanSelect('basic')}>
							{currentPlan === 'basic'
								? selectionOnly
									? 'Selected'
									: 'Current Plan'
								: selectionOnly
									? 'Select Plan'
									: 'Upgrade'}
						</SelectPlanButton>
					</PricingCard>

					{/* Professional Plan */}
					<PricingCard
						isCurrentPlan={currentPlan === 'professional'}
						layout={layout}>
						<PlanName>{SUBSCRIPTION_PLANS.PROFESSIONAL.name}</PlanName>
						<PlanPrice
							color={currentPlan === 'professional' ? 'white' : 'black'}>
							<div className='price'>
								${SUBSCRIPTION_PLANS.PROFESSIONAL.priceMonthly}
							</div>
							<div className='period'>per month</div>
						</PlanPrice>
						<PlanFeatures>
							{SUBSCRIPTION_PLANS.PROFESSIONAL.features.map((feature, idx) => (
								<PlanFeature
									key={idx}
									color={currentPlan === 'professional' ? 'white' : 'black'}>
									{feature}
								</PlanFeature>
							))}
						</PlanFeatures>
						{currentPlan === 'professional' && (
							<CurrentPlanLabel>Current Plan</CurrentPlanLabel>
						)}
						<SelectPlanButton
							isCurrentPlan={currentPlan === 'professional'}
							disabled={
								selectionOnly
									? loading
									: currentPlan === 'professional' || loading
							}
							onClick={() => handlePlanSelect('professional')}>
							{currentPlan === 'professional'
								? selectionOnly
									? 'Selected'
									: 'Current Plan'
								: selectionOnly
									? 'Select Plan'
									: 'Upgrade'}
						</SelectPlanButton>
					</PricingCard>

					{/* Enterprise Plan - Removed */}
				</PricingCardsGrid>

				<AdditionalOptionsContainer layout={layout}>
					<PromoSection layout={layout}>
						<PromoTitle layout={layout}>Have a Promo Code?</PromoTitle>
						<PromoText layout={layout}>
							Enter your promo code to unlock special pricing or access the free
							plan.
						</PromoText>
						<PromoInput
							layout={layout}
							type='text'
							placeholder='Enter promo code'
							value={promoCode}
							onChange={(e) => setPromoCode(e.target.value)}
							onKeyPress={(e) => e.key === 'Enter' && handlePromoCode()}
						/>
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
					</PromoSection>

					<ContactSalesSection layout={layout}>
						<ContactSalesTitle layout={layout}>
							Need More Properties?
						</ContactSalesTitle>
						<ContactSalesText layout={layout}>
							Managing more than 10 properties? Contact our sales team for
							custom pricing tailored to your needs.
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
