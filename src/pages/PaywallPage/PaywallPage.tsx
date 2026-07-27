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
	PlanBestFor,
	GrantTransitionNotice,
	PlanFeatureToggle,
	CheckoutConfidence,
	MobilePromoContainer,
	MobilePromoToggle,
	MobilePromoPanel,
} from './PaywallPage.styles';
import { SUBSCRIPTION_PLANS } from '../../constants/subscriptions';
import { COLORS } from '../../constants/colors';
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
import { isNativeApp } from '../../utils/platform';
import { openSubscriptionManagementInBrowser } from '../../utils/authLinks';
import { isMultiHomeownerPlanEnabled } from '../../entitlements/planAvailability';

interface PaywallPageProps {
	subscription: SubscriptionData;
	currentPlan: string;
	userId?: string;
	userEmail?: string;
	layout?: 'grid' | 'horizontal';
	variant?: 'full' | 'embedded';
	selectionOnly?: boolean;
	onPlanSelect?: (planId: string) => void;
	onPromoCodeApplied?: (promoCode: string) => void;
	onFreePlanContinue?: () => Promise<void>;
	initialPlanAudience?: PlanAudience;
}

type PaidPlanId =
	| 'homeowner'
	| 'homeowner_plus'
	| 'multi_homeowner'
	| 'property'
	| 'portfolio';
type PlanAudience = 'home' | 'business';

const PLAN_BY_ID = {
	homeowner: SUBSCRIPTION_PLANS.HOMEOWNER,
	homeowner_plus: SUBSCRIPTION_PLANS.HOMEOWNER_PLUS,
	multi_homeowner: SUBSCRIPTION_PLANS.MULTI_HOMEOWNER,
	property: SUBSCRIPTION_PLANS.PROPERTY,
	portfolio: SUBSCRIPTION_PLANS.PORTFOLIO,
} as const;

const PLAN_GROUPS: Record<PlanAudience, PaidPlanId[]> = {
	home: [
		'homeowner',
		'homeowner_plus',
		...(isMultiHomeownerPlanEnabled() ? (['multi_homeowner'] as const) : []),
	],
	business: ['property', 'portfolio'],
};

const PLAN_GROUP_COPY: Record<PlanAudience, string> = {
	home:
		'Free helps find record gaps. Homeowner+ turns those records into reminders, timelines, and Maintley Intelligence.',
	business:
		'For rentals and multi-property teams that need shared records, assignments, reporting, and service workflows.',
};

const PLAN_BEST_FOR: Record<PaidPlanId, string> = {
	homeowner: 'Ideal for finding gaps in one home record.',
	homeowner_plus: 'Ideal for deeper records, reminders, and proactive upkeep.',
	multi_homeowner: 'Ideal for several personal, vacation, or family homes.',
	property: 'Ideal for managing multiple properties with stronger controls.',
	portfolio: 'Ideal for teams operating larger property portfolios.',
};

const DEFAULT_PLAN_BILLING: Record<PaidPlanId, BillingCycle> = {
	homeowner: 'month',
	homeowner_plus: 'month',
	multi_homeowner: 'month',
	property: 'month',
	portfolio: 'month',
};

const FEATURE_PREVIEW_LIMIT = 4;
const PLAN_RANK: Record<PaidPlanId, number> = {
	homeowner: 0,
	homeowner_plus: 1,
	multi_homeowner: 2,
	property: 3,
	portfolio: 4,
};

const planCoversTarget = (grantPlanId: PaidPlanId, targetPlanId: PaidPlanId) =>
	grantPlanId === targetPlanId ||
	grantPlanId === 'portfolio' ||
	(grantPlanId === 'multi_homeowner' && targetPlanId === 'homeowner_plus');

const isWithinTrackUpgrade = (
	grantPlanId: PaidPlanId,
	targetPlanId: PaidPlanId,
) =>
	targetPlanId === 'portfolio' &&
	grantPlanId !== 'portfolio' &&
	grantPlanId !== 'multi_homeowner';

const getAudienceForPlan = (
	planId: string,
	fallback: PlanAudience = 'home',
): PlanAudience => {
	if (planId === 'property' || planId === 'portfolio') return 'business';
	if (
		planId === 'homeowner' ||
		planId === 'homeowner_plus' ||
		planId === 'multi_homeowner'
	) return 'home';
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
	onPromoCodeApplied,
	onFreePlanContinue,
	initialPlanAudience = 'home',
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
	const [isMobileView, setIsMobileView] = useState<boolean>(
		typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
	);
	const [isPromoOpenOnMobile, setIsPromoOpenOnMobile] = useState(false);
	const [expandedFeaturePlans, setExpandedFeaturePlans] = useState<
		Record<PaidPlanId, boolean>
	>({
		homeowner: false,
		homeowner_plus: false,
		multi_homeowner: false,
		property: false,
		portfolio: false,
	});
	const isOnTrial = isTrialActive(subscription);
	const daysRemaining = getTrialDaysRemaining(subscription);
	const cardLayout = layout;
	const nativeApp = isNativeApp();
	const activePlanGrants = (subscription.entitlementGrants || []).filter(
		(grant) => {
			const planId = String(grant.bundleId || '') as PaidPlanId;
			const startsAtMs = Number(grant.startsAtMs || 0);
			const endsAtMs = Number(grant.endsAtMs || 0);
			return (
				grant.state === 'active' &&
				Object.prototype.hasOwnProperty.call(PLAN_RANK, planId) &&
				startsAtMs <= Date.now() &&
				(grant.kind === 'permanent' || endsAtMs > Date.now())
			);
		},
	);
	const effectiveGrantPlanId = activePlanGrants.reduce<PaidPlanId | null>(
		(highestPlanId, grant) => {
			const candidate = grant.bundleId as PaidPlanId;
			return !highestPlanId || PLAN_RANK[candidate] > PLAN_RANK[highestPlanId]
				? candidate
				: highestPlanId;
		},
		null,
	);

	const getGrantCheckoutState = (planId: PaidPlanId) => {
		if (selectionOnly || planId === 'homeowner' || !effectiveGrantPlanId) {
			return null;
		}
		const permanentCoveringGrant = activePlanGrants
			.filter(
				(grant) =>
					grant.kind === 'permanent' &&
					planCoversTarget(grant.bundleId as PaidPlanId, planId),
			)
			.sort(
				(left, right) =>
					PLAN_RANK[right.bundleId as PaidPlanId] -
					PLAN_RANK[left.bundleId as PaidPlanId],
			)[0];
		if (permanentCoveringGrant) {
			return {
				kind: 'permanent' as const,
				grantPlanId: permanentCoveringGrant.bundleId as PaidPlanId,
			};
		}
		const convertibleGrants = activePlanGrants.filter(
			(grant) =>
				grant.kind === 'temporary' &&
				grant.transition?.mode === 'checkout_required',
		);
		if (convertibleGrants.length) {
			const controllingTemporaryGrants = activePlanGrants.filter(
				(grant) =>
					grant.kind === 'temporary' && grant.bundleId === effectiveGrantPlanId,
			);
			if (
				planCoversTarget(effectiveGrantPlanId, planId) &&
				controllingTemporaryGrants.some(
					(grant) => grant.transition?.mode === 'checkout_required',
				)
			) {
				return {
					kind: 'delayed' as const,
					grantPlanId: effectiveGrantPlanId,
					endsAtMs: Math.max(
						...controllingTemporaryGrants.map((grant) =>
							Number(grant.endsAtMs || 0),
						),
					),
				};
			}
			if (isWithinTrackUpgrade(effectiveGrantPlanId, planId)) {
				return {
					kind: 'immediate' as const,
					grantPlanId: effectiveGrantPlanId,
				};
			}
		}
		return null;
	};

	useEffect(() => {
		setPlanAudience(getAudienceForPlan(currentPlan, initialPlanAudience));
	}, [currentPlan, initialPlanAudience]);

	useEffect(() => {
		if (!nativeApp) return;

		void openSubscriptionManagementInBrowser().finally(() => {
			navigate('/settings', { replace: true });
		});
	}, [nativeApp, navigate]);

	useEffect(() => {
		const updateViewport = () => setIsMobileView(window.innerWidth <= 768);
		updateViewport();
		window.addEventListener('resize', updateViewport);
		return () => window.removeEventListener('resize', updateViewport);
	}, []);

	useEffect(() => {
		if (appliedPromoCode && isMobileView) {
			setIsPromoOpenOnMobile(true);
		}
	}, [appliedPromoCode, isMobileView]);

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

		if (planId === 'homeowner') {
			setLoading(true);
			setError(null);
			try {
				await onFreePlanContinue?.();
				navigate('/dashboard');
			} catch (err) {
				console.error('Failed to continue with the free plan:', err);
				setError('Unable to update your account. Please try again.');
				setLoading(false);
			}
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
		window.location.href =
			'mailto:maintleyapp@gmail.com?subject=Custom Pricing Inquiry';
	};

	const handleBackToSettings = () => {
		navigate('/settings');
	};

	const renderBillingControl = (planId: PaidPlanId) => {
		if (planId === 'homeowner') {
			return <FreePlanBadge>No card needed</FreePlanBadge>;
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
		const grantCheckoutState = getGrantCheckoutState(planId);
		if (grantCheckoutState?.kind === 'permanent') return 'Included permanently';
		if (grantCheckoutState?.kind === 'delayed') {
			return 'Continue after complimentary access';
		}
		const planIsCurrent =
			currentPlan === planId && isSubscriptionActive(subscription);
		const planIsScheduled = isOnTrial && subscription?.scheduledPlan === planId;

		if (planIsCurrent) {
			if (selectionOnly) return 'Selected';
			if (subscription.status !== 'trial') return 'Current Plan';
			return 'Upgrade Now';
		}
		if (planId === 'homeowner') return 'Start Free Plan';
		if (selectionOnly) return 'Select Plan';
		if (planIsScheduled) return 'Scheduled';
		return 'Upgrade';
	};

	const renderPromoContent = (layoutMode?: 'grid' | 'horizontal') =>
		appliedPromoCode ? (
			<PromoText
				layout={layoutMode}
				style={{ color: COLORS.successDark, fontWeight: 'bold' }}>
				Promo code "{appliedPromoCode.toUpperCase()}" has been applied!
			</PromoText>
		) : (
			<>
				<PromoText layout={layoutMode}>
					Enter your promo code to unlock special pricing.
				</PromoText>
				<PromoInput
					layout={layoutMode}
					type='text'
					placeholder='Enter promo code'
					value={promoCode}
					onChange={(e) => setPromoCode(e.target.value)}
					onKeyPress={(e) => e.key === 'Enter' && handlePromoCode()}
				/>
				{isCheckingPromo && (
					<PromoText layout={layoutMode} style={{ marginBottom: '12px' }}>
						Checking promo code...
					</PromoText>
				)}
				{promoHint && !promoError && (
					<PromoText
						layout={layoutMode}
						style={{
							color:
								promoHintType === 'success'
									? COLORS.successDark
									: COLORS.errorDark,
							marginBottom: '12px',
						}}>
						{promoHint}
					</PromoText>
				)}
				{promoError && (
					<PromoText layout={layoutMode} style={{ color: '#dc3545', marginBottom: '12px' }}>
						{promoError}
					</PromoText>
				)}
				<PromoButton onClick={handlePromoCode} disabled={promoLoading}>
					{promoLoading ? 'Applying...' : 'Apply Code'}
				</PromoButton>
			</>
		);

	const renderPlanCard = (planId: PaidPlanId) => {
		const plan = PLAN_BY_ID[planId];
		const cycle = getBillingCycleForPlan(planId);
		const isCurrentPlan =
			currentPlan === planId && isSubscriptionActive(subscription);
		const isScheduledPlan = isOnTrial && subscription?.scheduledPlan === planId;
		const useInvertedColors = isCurrentPlan;
		const buttonIsCurrent =
			(isCurrentPlan || isScheduledPlan) && !isOnTrial && !selectionOnly;
		const isFeaturesExpanded = expandedFeaturePlans[planId];
		const visibleFeatures = isFeaturesExpanded
			? plan.features
			: plan.features.slice(0, FEATURE_PREVIEW_LIMIT);
		const remainingFeatureCount = plan.features.length - FEATURE_PREVIEW_LIMIT;
		const featureListId = `${planId}-plan-features`;
		const grantCheckoutState = getGrantCheckoutState(planId);
		const grantPlanName = grantCheckoutState
			? PLAN_BY_ID[grantCheckoutState.grantPlanId]?.name ||
				grantCheckoutState.grantPlanId.replace(/_/g, ' ')
			: '';

		return (
			<PricingCard
				key={planId}
				$isPopular={planId === 'homeowner_plus' || planId === 'property'}
				$isCurrentPlan={isCurrentPlan}
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
				<PlanBestFor color={useInvertedColors ? 'white' : 'black'}>
					{PLAN_BEST_FOR[planId]}
				</PlanBestFor>
				{grantCheckoutState && (
					<GrantTransitionNotice color={useInvertedColors ? 'white' : 'black'}>
						{grantCheckoutState.kind === 'permanent'
							? `Your permanent ${grantPlanName} access already includes this plan.`
							: grantCheckoutState.kind === 'delayed'
								? `Your complimentary ${grantPlanName} access continues through ${new Date(
										grantCheckoutState.endsAtMs,
									).toLocaleDateString()}. Complete Checkout now and billing for this plan will begin afterward.`
								: `Choosing this higher plan starts paid access now. Eligible temporary ${grantPlanName} grants will be converted.`}
					</GrantTransitionNotice>
				)}
				<PlanFeatures id={featureListId}>
					{visibleFeatures.map((feature, idx) => (
						<PlanFeature
							key={idx}
							color={useInvertedColors ? 'white' : 'black'}>
							{feature}
						</PlanFeature>
					))}
				</PlanFeatures>
				{remainingFeatureCount > 0 && (
					<PlanFeatureToggle
						type='button'
						color={useInvertedColors ? 'white' : 'black'}
						onClick={() =>
							setExpandedFeaturePlans((current) => ({
								...current,
								[planId]: !current[planId],
							}))
						}
						aria-expanded={isFeaturesExpanded}
						aria-controls={featureListId}>
						{isFeaturesExpanded
							? 'Show fewer features'
							: `Show ${remainingFeatureCount} more features`}
					</PlanFeatureToggle>
				)}
				{isCurrentPlan || isScheduledPlan ? (
					<CurrentPlanLabel>
						{isScheduledPlan && subscription?.hasScheduledSubscription
							? 'Scheduled Plan'
							: 'Current Plan'}
					</CurrentPlanLabel>
				) : null}
				<SelectPlanButton
					$isCurrentPlan={buttonIsCurrent}
					disabled={
						selectionOnly
							? loading
							: (isCurrentPlan && subscription.status !== 'trial') ||
								grantCheckoutState?.kind === 'permanent' ||
								loading
					}
					onClick={() => handlePlanSelect(planId)}>
					{getPlanButtonLabel(planId)}
				</SelectPlanButton>
			</PricingCard>
		);
	};

	if (nativeApp) {
		return (
			<PaywallWrapper variant={variant}>
				<PaywallContainer variant={variant}>
					<TrialBannerWrapper variant={variant}>
						<TrialBannerTitle variant={variant}>
							Manage billing in your browser
						</TrialBannerTitle>
						<TrialBannerText variant={variant}>
							For account security and compliance, subscription changes are handled on the web.
						</TrialBannerText>
					</TrialBannerWrapper>
				</PaywallContainer>
			</PaywallWrapper>
		);
	}

	const paywallHeadline =
		planAudience === 'home'
			? 'Choose the plan that fits your home'
			: 'Choose the plan that fits your rentals';
	const paywallIntro =
		planAudience === 'home'
			? 'Free helps you find gaps in your home record. Homeowner+ turns maintenance insight into reminders, timelines, exports, and Maintley Intelligence.'
			: 'Start with core property records, then upgrade when you need assignments, reporting, resident workflows, and cross-property coordination.';

	return (
		<PaywallWrapper variant={variant}>
			<PaywallContainer variant={variant}>
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
							{paywallHeadline}
						</TrialBannerTitle>
						<TrialBannerText variant={variant}>
							{paywallIntro}
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
						$active={planAudience === 'home'}
						onClick={() => setPlanAudience('home')}>
						Home
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
				<CheckoutConfidence aria-label='Checkout information'>
					<span>Secure checkout through Stripe</span>
					<span>Maintley does not store card details</span>
					<span>Review your total before payment</span>
				</CheckoutConfidence>

				{isMobileView && (
					<MobilePromoContainer>
						<MobilePromoToggle
							type='button'
							onClick={() => setIsPromoOpenOnMobile((open) => !open)}
							aria-expanded={isPromoOpenOnMobile}>
							<span>
								{appliedPromoCode ? 'Promo code applied' : 'Have a promo code?'}
							</span>
							<span>{isPromoOpenOnMobile ? 'Hide' : 'Show'}</span>
						</MobilePromoToggle>
						<MobilePromoPanel $open={isPromoOpenOnMobile}>
							<PromoSection layout='grid'>
								<PromoTitle layout='grid'>
									{appliedPromoCode
										? 'Promo Code Applied ✅'
										: 'Have a Promo Code?'}
								</PromoTitle>
								{renderPromoContent('grid')}
							</PromoSection>
						</MobilePromoPanel>
					</MobilePromoContainer>
				)}

				<PricingCardsGrid layout={cardLayout}>
					{PLAN_GROUPS[planAudience].map((planId) => renderPlanCard(planId))}
				</PricingCardsGrid>

				<AdditionalOptionsContainer
					layout={cardLayout}
					$single={planAudience === 'home' && PLAN_GROUPS[planAudience].length === 1}>
					{!isMobileView && (
						<PromoSection layout={cardLayout}>
							<PromoTitle layout={cardLayout}>
								{appliedPromoCode
									? 'Promo Code Applied ✅'
									: 'Have a Promo Code?'}
							</PromoTitle>
							{renderPromoContent(cardLayout)}
						</PromoSection>
					)}

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
