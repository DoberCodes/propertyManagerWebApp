import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../Redux/store/store';
import {
	getSubscriptionPlanDetails,
	isTrialActive,
	getTrialDaysRemaining,
} from '../utils/subscriptionUtils';

const Container = styled.div`
	max-width: 600px;
	margin: 40px auto;
	padding: 32px;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
`;

const Title = styled.h2`
	font-size: 2rem;
	margin-bottom: 24px;
`;

const SubscriptionSection = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 24px;
	margin-bottom: 24px;
	background: #f9fafb;
`;

const SubscriptionHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
`;

const PlanName = styled.h3`
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0;
	color: #1f2937;
`;

const PlanStatus = styled.span<{ status: string }>`
	padding: 4px 12px;
	border-radius: 20px;
	font-size: 0.875rem;
	font-weight: 500;
	text-transform: uppercase;
	${({ status }) => {
		switch (status) {
			case 'trial':
				return `
					background: #fef3c7;
					color: #d97706;
				`;
			case 'active':
				return `
					background: #d1fae5;
					color: #065f46;
				`;
			case 'cancelled':
				return `
					background: #fee2e2;
					color: #dc2626;
				`;
			default:
				return `
					background: #e5e7eb;
					color: #6b7280;
				`;
		}
	}}
`;

const PlanDetails = styled.div`
	margin-bottom: 16px;
`;

const PlanPrice = styled.p`
	font-size: 1.125rem;
	font-weight: 600;
	color: #059669;
	margin: 8px 0;
`;

const PlanFeatures = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
`;

const PlanFeature = styled.li`
	font-size: 0.875rem;
	color: #6b7280;
	margin-bottom: 4px;
	&::before {
		content: '✓';
		color: #059669;
		margin-right: 8px;
	}
`;

const TrialInfo = styled.div`
	background: #fef3c7;
	border: 1px solid #f59e0b;
	border-radius: 6px;
	padding: 12px;
	margin-bottom: 16px;
`;

const TrialText = styled.p`
	margin: 0;
	color: #92400e;
	font-size: 0.875rem;
`;

const LinkButton = styled.button`
	display: inline-block;
	margin: 16px 0;
	padding: 12px 24px;
	background: #6366f1;
	color: #fff;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	transition: background 0.2s;
	border: none;
	cursor: pointer;
	&:hover {
		background: #4f46e5;
	}
`;

const UpgradeButton = styled(LinkButton)`
	background: #059669;
	&:hover {
		background: #047857;
	}
`;

const SettingsPage: React.FC = () => {
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	if (!currentUser?.subscription) {
		return (
			<Container>
				<Title>Settings</Title>
				<p>Loading subscription information...</p>
			</Container>
		);
	}

	const subscription = currentUser.subscription;
	const planDetails = getSubscriptionPlanDetails(subscription.plan);
	const isOnTrial = isTrialActive(subscription);
	const trialDaysRemaining = getTrialDaysRemaining(subscription);

	return (
		<Container>
			<Title>Settings</Title>

			<SubscriptionSection>
				<SubscriptionHeader>
					<PlanName>{planDetails?.name || 'Unknown Plan'}</PlanName>
					<PlanStatus status={subscription.status}>
						{subscription.status}
					</PlanStatus>
				</SubscriptionHeader>

				{isOnTrial && (
					<TrialInfo>
						<TrialText>
							🎉 You have {trialDaysRemaining} days left in your free trial
						</TrialText>
					</TrialInfo>
				)}

				<PlanDetails>
					<PlanPrice>${planDetails?.priceMonthly || 0}/month</PlanPrice>
					<PlanFeatures>
						{planDetails?.features.map((feature, index) => (
							<PlanFeature key={index}>{feature}</PlanFeature>
						))}
					</PlanFeatures>
				</PlanDetails>

				<UpgradeButton onClick={() => navigate('/paywall')}>
					{subscription.plan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
				</UpgradeButton>
			</SubscriptionSection>

			<LinkButton onClick={() => navigate('/docs')}>
				View Full Feature Guide
			</LinkButton>
			{/* Add more settings here as needed */}
		</Container>
	);
};

export default SettingsPage;
