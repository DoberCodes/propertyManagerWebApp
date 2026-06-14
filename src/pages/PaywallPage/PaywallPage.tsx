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
	PlanAudienceControls,
	PlanAudienceButton,
	PlanGroupIntro,
	CardHeaderRow,
	CardBillingToggle,
	CardBillingButton,
	FreePlanBadge,
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
	initialPlanAudience?: PlanAudience;
}

type PaidPlanId = 'homeowner' | 'homeowner_plus' | 'property' | 'portfolio';
type PlanAudience = 'personal' | 'business';

const PLAN_BY_ID = {
	homeowner: SUBSCRIPTION_PLANS.HOMEOWNER,
	homeowner_plus: SUBSCRIPTION_PLANS.HOMEOWNER_PLUS,
	property: SUBSCRIPTION_PLANS.PROPERTY,
	portfolio: SUBSCRIPTION_PLANS.PORTFOLIO,
} as const;

const PLAN_GROUPS: Record<PlanAudience, PaidPlanId[]> = {
	personal: ['homeowner', 'homeowner_plus'],
	business: ['property', 'portfolio'],
};

const PLAN_GROUP_COPY: Record<PlanAudience, string> = {
	personal:
		'For homeowners who want a better way to keep track of their home..',
	business:
		'For property owners and property managers responsible for maintaining multiple properties.',
};

const DEFAULT_PLAN_BILLING: Record<PaidPlanId, BillingCycle> = {
	homeowner: 'month',
	homeowner_plus: 'month',
	property: 'month',
	portfolio: 'month',
};

const getAudienceForPlan = (
	planId: string,
	fallback: PlanAudience = 'personal',
): PlanAudience => {
	if (planId === 'property' || planId === 'portfolio') return 'business';
	if (planId === 'homeowner' || planId === 'homeowner_plus') return 'personal';
	return fallback;
};

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
	initialPlanAudience = 'personal',
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
	const [planAudience, setPlanAudience] = useState<PlanAudience>(() =>
		getAudienceForPlan(currentPlan, initialPlanAudience),
	);
	const [planBillingCycles, setPlanBillingCycles] =
		useState<Record<PaidPlanId, BillingCycle>>(DEFAULT_PLAN_BILLING);
	const isOnTrial = isTrialActive(subscription);
	const daysRemaining = getTrialDaysRemaining(subscription);
	const cardLayout = wide ? 'horizontal' : layout;

	useEffect(() => {
		setPlanAudience(getAudienceForPlan(currentPlan, initialPlanAudience));
	}, [currentPlan, initialPlanAudience]);

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

	const getBillingCycleForPlan = (planId: string): BillingCycle => {
		return planBillingCycles[planId as PaidPlanId] || 'month';
	};

	const setBillingCycleForPlan = (
		planId: PaidPlanId,
		cycle: BillingCycle,
	) => {
		setPlanBillingCycles((current) => ({
			...current,
			[planId]: cycle,
		}));
	};

	const getPriceIdForPlan = (planId: string): string => {
		return getStripePriceIdForPlan(planId, getBillingCycleForPlan(planId));
	};

	const getPlanDisplayPrice = (planId: PaidPlanId) => {
		const plan = PLAN_BY_ID[planId];
		return getBillingCycleForPlan(planId) === 'year'
			? plan.priceYearly
			: plan.priceMonthly;
	};

	const handlePlanSelect = async (planId: string) => {
		if (selectionOnly) {
			onPlanSelect?.(planId);
			return;
		}

		// Only prevent selecting the current plan if user has an active PAID subscription
		// Legacy access-period users should be able to upgrade anytime
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
			// Homeowner is the free local plan and does not go through Stripe.
			if (planId === 'homeowner') {
				navigate('/dashboard');
				return;
			}

			// Create checkout session for paid plans
			const priceId = getPriceIdForPlan(planId);
			if (!userId || !userEmail) {
				setError('Unable to process payment. Please ensure you are logged in.');
				setLoading(false);
				return;
			}

			// If user is in a legacy access period, pass the end date for pre-scheduling
			// This allows seamless transition to paid access without interruption
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
				getBillingCycleForPlan(planId),
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

			// Keep local env promo codes for legacy access-period testing behavior
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

	const renderBillingControl = (planId: PaidPlanId) => {
		if (planId === 'homeowner') {
			return <FreePlanBadge>Free</FreePlanBadge>;
		}

		const selectedCycle = getBillingCycleForPlan(planId);

		return (
			<CardBillingToggle aria-label={`Billing cycle for ${PLAN_BY_ID[planId].name}`}>
				<CardBillingButton
					type='button'
					$active={selectedCycle === 'month'}
					onClick={() => setBillingCycleForPlan(planId, 'month')}>
					Monthly
				</CardBillingButton>
				<CardBillingButton
					type='button'
					$active={selectedCycle === 'year'}
					onClick={() => setBillingCycleForPlan(planId, 'year')}>
					Annual
				</CardBillingButton>
			</CardBillingToggle>
		);
	};

	const getPlanButtonLabel = (planId: PaidPlanId) => {
		const planIsCurrent =
			currentPlan === planId && isSubscriptionActive(subscription);
		const planIsScheduled = isOnTrial && subscription?.scheduledPlan === planId;

		if (planIsCurrent) {
			if (selectionOnly) return 'Selected';
			if (subscription.status !== 'trial') return 'Current Plan';
			return 'Upgrade Now';
		}

		if (selectionOnly) return 'Select Plan';
		if (planIsScheduled) return 'Scheduled';
		return 'Upgrade';
	};

	const renderPlanCard = (planId: PaidPlanId) => {
		const plan = PLAN_BY_ID[planId];
		const cycle = getBillingCycleForPlan(planId);
		const isCurrentPlan =
			currentPlan === planId && isSubscriptionActive(subscription);
		const isScheduledPlan = isOnTrial && subscription?.scheduledPlan === planId;
		const useInvertedColors = isCurrentPlan;
		const buttonIsCurrent =
			(isCurrentPlan || isScheduledPlan) && !isOnTrial && !selectionOnly;

		return (
			<PricingCard
				key={planId}
				isPopular={planId === 'homeowner_plus' || planId === 'property'}
				isCurrentPlan={isCurrentPlan}
				layout={cardLayout}>
				{(planId === 'homeowner_plus' || planId === 'property') && <PopularBadge>Most Popular</PopularBadge>}
				<CardHeaderRow>
					<PlanName color={useInvertedColors ? 'white' : 'black'}>
						{plan.name}
					</PlanName>
					{renderBillingControl(planId)}
				</CardHeaderRow>
				<PlanPrice color={useInvertedColors ? 'white' : 'black'}>
					<div className='price'>${getPlanDisplayPrice(planId)}</div>
					<div className='period'>
						{cycle === 'year' ? 'per year' : 'per month'}
					</div>
				</PlanPrice>
				<PlanFeatures>
					{plan.features.map((feature, idx) => (
						<PlanFeature
							key={idx}
							color={useInvertedColors ? 'white' : 'black'}>
							{feature}
						</PlanFeature>
					))}
				</PlanFeatures>
				{isCurrentPlan || isScheduledPlan ? (
					<CurrentPlanLabel>
						{isScheduledPlan && subscription?.hasScheduledSubscription
							? 'Scheduled Plan'
							: 'Current Plan'}
					</CurrentPlanLabel>
				) : null}
				<SelectPlanButton
					isCurrentPlan={buttonIsCurrent}
					disabled={
						selectionOnly
							? loading
							: (isCurrentPlan && subscription.status !== 'trial') || loading
					}
					onClick={() => handlePlanSelect(planId)}>
					{getPlanButtonLabel(planId)}
				</SelectPlanButton>
			</PricingCard>
		);
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
							Choose the plan that fits your property
						</TrialBannerTitle>
						<TrialBannerText variant={variant}>
							Start with the free tier, then upgrade when you need more
							appliances, suggested maintenance, documents, or team tools.
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
								Your account access is active
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
										days remaining in your current access period
									</TrialBannerText>
								</>
							)}
							<TrialBannerText variant={variant}>
								You can choose a paid plan anytime to unlock more capacity and
								premium features.
							</TrialBannerText>
						</TrialBannerWrapper>
					)}

				<PlanAudienceControls variant={variant}>
					<PlanAudienceButton
						type='button'
						$active={planAudience === 'personal'}
						onClick={() => setPlanAudience('personal')}>
						Personal
					</PlanAudienceButton>
					<PlanAudienceButton
						type='button'
						$active={planAudience === 'business'}
						onClick={() => setPlanAudience('business')}>
						Business
					</PlanAudienceButton>
				</PlanAudienceControls>
				<PlanGroupIntro variant={variant}>
					{PLAN_GROUP_COPY[planAudience]}
				</PlanGroupIntro>

				<PricingCardsGrid layout={cardLayout}>
					{PLAN_GROUPS[planAudience].map((planId) => renderPlanCard(planId))}
				</PricingCardsGrid>

				<AdditionalOptionsContainer
					layout={cardLayout}
					$single={planAudience === 'personal'}>
					<PromoSection layout={cardLayout}>
						<PromoTitle layout={cardLayout}>
							{appliedPromoCode
								? 'Promo Code Applied ✅'
								: 'Have a Promo Code?'}
						</PromoTitle>
						{appliedPromoCode ? (
							<PromoText
								layout={cardLayout}
								style={{ color: '#22c55e', fontWeight: 'bold' }}>
								Promo code "{appliedPromoCode.toUpperCase()}" has been applied!
							</PromoText>
						) : (
							<>
								<PromoText layout={cardLayout}>
									Enter your promo code to unlock special pricing.
								</PromoText>
								<PromoInput
									layout={cardLayout}
									type='text'
									placeholder='Enter promo code'
									value={promoCode}
									onChange={(e) => setPromoCode(e.target.value)}
									onKeyPress={(e) => e.key === 'Enter' && handlePromoCode()}
								/>
								{isCheckingPromo && (
									<PromoText layout={cardLayout} style={{ marginBottom: '12px' }}>
										Checking promo code...
									</PromoText>
								)}
								{promoHint && !promoError && (
									<PromoText
										layout={cardLayout}
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
										layout={cardLayout}
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

					{planAudience === 'business' && (
						<ContactSalesSection layout={cardLayout}>
							<ContactSalesTitle layout={cardLayout}>
								Need More Properties?
							</ContactSalesTitle>
							<ContactSalesText layout={cardLayout}>
								Managing more than 15 properties? Get a customized plan with
								portfolio pricing, advanced reporting, and priority support.
							</ContactSalesText>
							<ContactSalesButtonStyled
								layout={cardLayout}
								onClick={handleContactSales}>
								Contact Sales
							</ContactSalesButtonStyled>
						</ContactSalesSection>
					)}
				</AdditionalOptionsContainer>
			</PaywallContainer>
		</PaywallWrapper>
	);
};

export default PaywallPage;
