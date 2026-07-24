import React from "react";
import { getEffectiveSubscriptionPlanId, getSubscriptionPlanDetails } from "utils/subscriptionUtils";
import { BillingPortalButton, ButtonContainer, CancelButton, Container, PlanDetails, PlanFeature, PlanFeatures, PlanName, PlanPrice, PlanStatus, Section, SectionTitle, SubscriptionHeader, SubscriptionSection, Title, UpgradeButton } from "./SettingPage.styles";
import { RootState } from "Redux/store/store";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { isNativeApp } from "utils/platform";
import { openCustomerBillingPortal, openSubscriptionManagementInBrowser } from "utils/authLinks";

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
    const planStatusDisplay = subscription?.status === 'active'
        ? 'Active'
        : subscription?.status === 'trial'
            ? 'Trial'
            : subscription?.status === 'expired'
                ? 'Expired'
                : 'Unknown';
    const effectivePlanId = getEffectiveSubscriptionPlanId(subscription, 'homeowner');

    const planDetails = getSubscriptionPlanDetails(effectivePlanId);
    const isFreePlan = effectivePlanId === 'homeowner';
    const hasStripeBillingRelationship = Boolean(subscription?.stripeCustomerId);

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
                            <PlanName>{planDetails?.name || 'Unknown Plan'}</PlanName>
                            <PlanStatus status={planStatusDisplay}>
                                {planStatusDisplay}
                            </PlanStatus>
                        </SubscriptionHeader>

                        <PlanDetails>
                            <PlanPrice>${planDetails?.priceMonthly || 0}/month</PlanPrice>
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
                            {!nativeApp && subscription.status === 'active' &&
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
