import React from "react";
import { getEffectiveSubscriptionPlanId, getSubscriptionPlanDetails } from "utils/subscriptionUtils";
import { AccountActions, AccountButton, ButtonContainer, CancelButton, Container, DeleteAccountButton, ErrorMessage, PlanDetails, PlanFeature, PlanFeatures, PlanName, PlanPrice, PlanStatus, Section, SectionTitle, SubscriptionHeader, SubscriptionSection, Title, UpgradeButton } from "./SettingPage.styles";
import { RootState } from "Redux/store/store";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { isNativeApp } from "utils/platform";
import { openSubscriptionManagementInBrowser } from "utils/authLinks";

interface AccountManagementProps {
    subscriptionError: boolean;
    setSubscriptionError: (error: boolean) => void;
    setShowPasswordModal: (show: boolean) => void;
    setShowDeleteAccountModal: (show: boolean) => void;
    setShowCancelSubscriptionModal: (show: boolean) => void;
}



export const AccountManagement: React.FC<AccountManagementProps> = ({ subscriptionError, setSubscriptionError, setShowPasswordModal, setShowDeleteAccountModal, setShowCancelSubscriptionModal }) => {
    const navigate = useNavigate();
    const currentUser = useSelector((state: RootState) => state.user.currentUser);
    const nativeApp = isNativeApp();
    const subscription = currentUser?.subscription;
    const isTeamMemberAccount = currentUser?.isTeamMemberAccount === true;
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
            <SectionTitle>Account Settings</SectionTitle>
            {subscriptionError && (
                <ErrorMessage style={{ marginBottom: '16px' }}>
                    You must cancel your active subscription before deleting your
                    account.
                </ErrorMessage>
            )}
            <AccountActions>
                <AccountButton onClick={() => navigate('/profile')}>
                    View Profile
                </AccountButton>
                <AccountButton onClick={() => setShowPasswordModal(true)}>
                    Change Password
                </AccountButton>
                <DeleteAccountButton
                    disabled={
                        subscription.status === 'active' ||
                        subscription.status === 'past_due'
                    }
                    onClick={() => {
                        if (
                            subscription.status === 'active' ||
                            subscription.status === 'past_due'
                        ) {
                            setSubscriptionError(true);
                        } else if (
                            subscription.status === 'trial' ||
                            subscription.status === 'expired'
                        ) {
                            setShowDeleteAccountModal(true);
                        } else {
                            setShowDeleteAccountModal(true);
                        }
                    }}>
                    Delete Account
                </DeleteAccountButton>
            </AccountActions>
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
                                    ? 'Manage Subscription in Browser'
                                    : isFreePlan
                                        ? 'Upgrade Plan'
                                        : 'Change Plan'}
                            </UpgradeButton>
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