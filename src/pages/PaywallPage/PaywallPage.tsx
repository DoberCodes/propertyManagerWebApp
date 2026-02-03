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
	UpgradeMessage,
	ButtonGroup,
	ContactSalesButton,
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
}) => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const isOnTrial = isTrialActive(subscription);
	const daysRemaining = getTrialDaysRemaining(subscription);

	const getPriceIdForPlan = (planId: string): string => {
		const priceMap: Record<string, string> = {
			free: STRIPE_PLANS.FREE,
			basic: STRIPE_PLANS.BASIC,
			professional: STRIPE_PLANS.PROFESSIONAL,
			enterprise: STRIPE_PLANS.ENTERPRISE,
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

	const handleContactSales = () => {
		window.location.href =
			'mailto:sales@mypropertymanager.com?subject=Enterprise Plan Inquiry';
	};

	return (
		<PaywallWrapper variant={variant}>
			<PaywallContainer variant={variant}>
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

				{!isOnTrial && currentPlan !== 'free' && (
					<UpgradeMessage>
						You're currently on the {currentPlan} plan. Upgrade to access more
						features.
					</UpgradeMessage>
				)}

				<PricingCardsGrid layout={layout}>
					{/* Free Plan */}
					<PricingCard isCurrentPlan={currentPlan === 'free'} layout={layout}>
						<PlanName>{SUBSCRIPTION_PLANS.FREE.name}</PlanName>
						<PlanPrice color={currentPlan === 'free' ? 'white' : 'black'}>
							<div className='price'>
								${SUBSCRIPTION_PLANS.FREE.priceMonthly}
							</div>
							<div className='period'>per month after 14-day trial</div>
						</PlanPrice>
						<PlanFeatures>
							{SUBSCRIPTION_PLANS.FREE.features.map((feature, idx) => (
								<PlanFeature
									key={idx}
									color={currentPlan === 'free' ? 'white' : 'black'}>
									{feature}
								</PlanFeature>
							))}
						</PlanFeatures>
						{currentPlan === 'free' && (
							<CurrentPlanLabel>Current Plan</CurrentPlanLabel>
						)}
						<SelectPlanButton
							isCurrentPlan={currentPlan === 'free'}
							disabled={
								selectionOnly ? loading : currentPlan === 'free' || loading
							}
							onClick={() => handlePlanSelect('free')}>
							{currentPlan === 'free'
								? selectionOnly
									? 'Selected'
									: 'Current Plan'
								: 'Select Plan'}
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

					{/* Enterprise Plan */}
					<PricingCard
						isCurrentPlan={currentPlan === 'enterprise'}
						layout={layout}>
						<PlanName>{SUBSCRIPTION_PLANS.ENTERPRISE.name}</PlanName>
						<PlanPrice color={currentPlan === 'enterprise' ? 'white' : 'black'}>
							<div className='price' style={{ fontSize: '32px' }}>
								Custom
							</div>
							<div className='period'>Contact us for pricing</div>
						</PlanPrice>
						<PlanFeatures>
							{SUBSCRIPTION_PLANS.ENTERPRISE.features.map((feature, idx) => (
								<PlanFeature
									key={idx}
									color={currentPlan === 'enterprise' ? 'white' : 'black'}>
									{feature}
								</PlanFeature>
							))}
						</PlanFeatures>
						{currentPlan === 'enterprise' && (
							<CurrentPlanLabel>Current Plan</CurrentPlanLabel>
						)}
						<ButtonGroup>
							<ContactSalesButton onClick={handleContactSales}>
								Contact Sales
							</ContactSalesButton>
						</ButtonGroup>
					</PricingCard>
				</PricingCardsGrid>
			</PaywallContainer>
		</PaywallWrapper>
	);
};

export default PaywallPage;
