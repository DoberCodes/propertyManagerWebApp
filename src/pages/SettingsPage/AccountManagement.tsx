import React from "react";
import { getActiveGrantedPlanAccess, getEffectiveAccessPlanId, getEffectiveSubscriptionPlanId, getSubscriptionPlanDetails } from "utils/subscriptionUtils";
import { BillingPlanSummary, BillingPortalButton, ButtonContainer, CancelButton, Container, GrantedAccessBadge, GrantedAccessCard, GrantedAccessHeader, GrantedAccessText, GrantedAccessTitle, PlanDetails, PlanFeature, PlanFeatures, PlanName, PlanPrice, PlanStatus, Section, SectionTitle, SubscriptionHeader, SubscriptionSection, Title, UpgradeButton } from "./SettingPage.styles";
import { RootState } from "Redux/store/store";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { isNativeApp } from "utils/platform";
import { openCustomerBillingPortal, openSubscriptionManagementInBrowser } from "utils/authLinks";
import { getStripeBillingPresentation } from "utils/billingDisclosure";

interface AccountManagementProps {
    setShowCancelSubscriptionModal: (show: boolean) => void;
}



export const AccountManagement: React.FC<AccountManagementProps> = ({ setShowCancelSubscriptionModal }) => {
    const navigate = useNavigate();
    const currentUser = useSelector((state: RootState) => state.user.currentUser);
    const nativeApp = isNativeApp();
    const subscription = currentUser?.subscription;
    const isTenant = currentUser?.role === 'tenant';
    const isPrimaryAccountHolder =
        !!currentUser &&
        (currentUser.isAccountOwner || currentUser.accountId === currentUser.id);

    const canViewPlanSection = !isTenant && isPrimaryAccountHolder;
    const grantedAccess = getActiveGrantedPlanAccess(subscription);
    const planStatusDisplay = grantedAccess
        ? 'Granted'
        : subscription?.status === 'active'
        ? 'Active'
        : subscription?.status === 'trial'
            ? 'Trial'
            : subscription?.status === 'expired'
                ? 'Expired'
                : 'Unknown';
    const billingPlanId = getEffectiveSubscriptionPlanId(subscription, 'homeowner');
    const effectivePlanId = getEffectiveAccessPlanId(subscription);

    const planDetails = getSubscriptionPlanDetails(effectivePlanId);
    const billingPlanDetails = getSubscriptionPlanDetails(billingPlanId);
    const grantedPlanDetails = grantedAccess
        ? getSubscriptionPlanDetails(grantedAccess.planId)
        : null;
    const isFreePlan = billingPlanId === 'homeowner';
    const hasStripeBillingRelationship = Boolean(subscription?.stripeCustomerId);
    const billingPresentation = getStripeBillingPresentation(
        subscription?.billingDisclosure,
    );
    const grantedAccessEndsLabel = grantedAccess?.endsAtMs
        ? new Date(grantedAccess.endsAtMs).toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        })
        : null;
    const accessTransition = grantedAccess?.transition;
    const firstChargeAt = accessTransition?.firstChargeAt;
    const firstChargeMs = typeof firstChargeAt === 'number'
        ? firstChargeAt
        : typeof (firstChargeAt as any)?.toMillis === 'function'
            ? (firstChargeAt as any).toMillis()
            : Number.NaN;
    const firstChargeLabel = Number.isFinite(firstChargeMs)
        ? new Date(firstChargeMs).toLocaleDateString(undefined, {
            month: 'long', day: 'numeric', year: 'numeric',
        })
        : null;
    const recurringPriceLabel = Number.isFinite(Number(accessTransition?.recurringAmountMinor))
        ? new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: String(accessTransition?.currency || 'USD'),
        }).format(Number(accessTransition?.recurringAmountMinor) / 100)
        : null;
    const paymentMethodLabel = accessTransition?.paymentMethodStatus === 'usable'
        ? 'On file in Stripe'
        : accessTransition?.paymentMethodStatus === 'requires_action'
            ? 'Needs verification'
            : accessTransition?.paymentMethodStatus === 'missing'
                ? 'Not connected'
                : hasStripeBillingRelationship
                    ? 'Managed securely in Stripe'
                    : 'Not connected';

    if (!subscription) {
        return (
            <Container>
                <Title>Settings</Title>
                <p>Loading subscription information...</p>
            </Container>
        );
    }

    return (
        <Section>
            <SectionTitle>Billing & Subscription</SectionTitle>
            {canViewPlanSection && (
                <>
                    <SubscriptionSection>
                        <SubscriptionHeader>
                            <PlanName>{planDetails?.name || 'Unknown Plan'} Access</PlanName>
                            <PlanStatus status={planStatusDisplay.toLowerCase()}>
                                {planStatusDisplay}
                            </PlanStatus>
                        </SubscriptionHeader>

                        <PlanDetails>
                            {grantedAccess ? (
                                <GrantedAccessCard>
                                    <GrantedAccessHeader>
                                        <GrantedAccessTitle>
                                            {grantedPlanDetails?.name || planDetails?.name || 'Plan'} access granted
                                        </GrantedAccessTitle>
                                        <GrantedAccessBadge>
                                            {grantedAccess.kind === 'permanent' ? 'No expiration' : 'Temporary access'}
                                        </GrantedAccessBadge>
                                    </GrantedAccessHeader>
                                    <GrantedAccessText>
                                        {grantedAccess.kind === 'permanent'
                                            ? 'Maintley has granted this account permanent access.'
                                            : `Maintley has granted this account access through ${grantedAccessEndsLabel || 'the scheduled end date'}.`}
                                    </GrantedAccessText>
                                </GrantedAccessCard>
                            ) : (
                                <PlanPrice>
                                    {billingPresentation.listPriceLabel || `$${planDetails?.priceMonthly || 0}/month`}
                                </PlanPrice>
                            )}
                            <BillingPlanSummary>
                                Billing plan: {billingPlanDetails?.name || 'Homeowner'} · {billingPresentation.listPriceLabel || `$${billingPlanDetails?.priceMonthly || 0}/month`}
                            </BillingPlanSummary>
                            {billingPresentation.discountLabel && (
                                <BillingPlanSummary>
                                    Stripe discount: {billingPresentation.discountLabel}
                                </BillingPlanSummary>
                            )}
                            {billingPresentation.nextInvoiceLabel && (
                                <BillingPlanSummary>
                                    Next invoice: {billingPresentation.nextInvoiceLabel}
                                </BillingPlanSummary>
                            )}
                            {billingPresentation.renewalLabel && (
                                <BillingPlanSummary>{billingPresentation.renewalLabel}</BillingPlanSummary>
                            )}
                            {grantedAccess && (
                                <>
                                    <BillingPlanSummary>
                                        Payment method: {paymentMethodLabel}
                                    </BillingPlanSummary>
                                    <BillingPlanSummary>
                                        After complimentary access: {accessTransition?.mode === 'automatic'
                                            ? 'Continues as a paid subscription unless cancelled'
                                            : accessTransition?.mode === 'checkout_required'
                                                ? 'Paid continuation requires Checkout'
                                                : 'No automatic billing'}
                                    </BillingPlanSummary>
                                    {accessTransition?.mode === 'automatic' && firstChargeLabel && (
                                        <BillingPlanSummary>
                                            First charge: {firstChargeLabel}{recurringPriceLabel
                                                ? ` at ${recurringPriceLabel} per ${accessTransition?.billingCycle || 'billing period'}`
                                                : ''}
                                        </BillingPlanSummary>
                                    )}
                                </>
                            )}
                            {subscription.billingSyncIssue?.code === 'multiple_current_subscriptions' && (
                                <BillingPlanSummary role="alert">
                                    Billing needs attention: more than one current Stripe subscription was found. Contact Maintley support before changing your plan.
                                </BillingPlanSummary>
                            )}
                            <PlanFeatures>
                                {planDetails?.features.map((feature, index) => (
                                    <PlanFeature key={index}>{feature}</PlanFeature>
                                ))}
                            </PlanFeatures>
                        </PlanDetails>

                        <ButtonContainer>
                            <UpgradeButton
                                onClick={() => {
                                    if (!nativeApp) {
                                        navigate('/paywall');
                                        return;
                                    }
                                    void openSubscriptionManagementInBrowser();
                                }}>
                                {nativeApp
                                    ? 'Manage Subscription'
                                    : isFreePlan
                                        ? 'Upgrade Plan'
                                        : 'Change Plan'}
                            </UpgradeButton>
                            {nativeApp && (
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                                    Opens Maintley plan management in your browser.
                                </div>
                            )}
                            {hasStripeBillingRelationship && (
                                <>
                                    <BillingPortalButton
                                        type="button"
                                        onClick={() => void openCustomerBillingPortal()}>
                                        Manage Billing & Payment Methods
                                    </BillingPortalButton>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                        Opens Stripe to update payment methods and billing details.
                                    </div>
                                </>
                            )}
                            {!nativeApp && ['active', 'trial'].includes(subscription.status) &&
                                !subscription.cancelAtPeriodEnd &&
                                !subscription.billingDisclosure?.cancelAtPeriodEnd &&
                                subscription.stripeSubscriptionId && (
                                    <CancelButton
                                        onClick={() => setShowCancelSubscriptionModal(true)}>
                                        Cancel Subscription
                                    </CancelButton>
                                )}
                        </ButtonContainer>
                    </SubscriptionSection>
                </>
            )
            }
        </Section>
    );
}
