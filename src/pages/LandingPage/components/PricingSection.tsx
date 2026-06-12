import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faCheck,
	faTimes,
	faHouse,
	faBuilding,
	faBuildingUser,
} from '@fortawesome/free-solid-svg-icons';
import {
	SUBSCRIPTION_PLANS,
} from '../../../constants/subscriptions';
import {
	PricingSection,
	PricingTitle,
	PricingSubtitle,
	PricingGrid,
	PricingCard,
	PricingBadge,
	PricingPlan,
	PricingPrice,
	PricingPeriod,
	PricingMeta,
	PricingFeatureList,
	PricingFeatureItem,
	PricingComparison,
	PricingComparisonTitle,
	PricingTable,
	PricingTableHead,
	PricingTableRow,
	PricingTableCell,
	PricingCheck,
	PricingX,
	PricingActionRow,
	PricingActionButton,
	PricingActionLink,
} from '../LandingPage.styles';

const paidPlans = [
	SUBSCRIPTION_PLANS.HOMEOWNER,
	SUBSCRIPTION_PLANS.HOMEOWNER_PLUS,
	SUBSCRIPTION_PLANS.PROPERTY,
	SUBSCRIPTION_PLANS.PORTFOLIO,
];

const cardFeatureHighlights: Record<string, string[]> = {
	home: [
		'1 property included',
		'Up to 15 appliances & systems',
		'1 starter maintenance package',
		'Maintenance history tracking',
	],
	property: [
		'Up to 3 properties included',
		'Unlimited appliances & systems',
		'Advanced search & retrieval',
		'Property reports & exports',
	],
	homeowner_plus: [
		'1 property included',
		'Unlimited appliances & systems',
		'All suggested maintenance packages',
		'Notifications & recurring tasks',
	],
	portfolio: [
		'Up to 15 properties included',
		'Team collaboration',
		'Tenant maintenance requests',
		'Role-based access',
	],
};

const quickComparisonRows = [
	{ label: 'Properties included', values: ['1', '1', 'Up to 3', 'Up to 15'] },
	{ label: 'Appliances & systems', values: ['Up to 15', 'Unlimited', 'Unlimited', 'Unlimited'] },
	{ label: 'Maintenance history tracking', values: [true, true, true, true] },
	{ label: 'Suggested maintenance packages', values: ['1 starter', 'Unlimited', 'Unlimited', 'Unlimited'] },
	{ label: 'Recurring maintenance scheduling', values: [false, true, true, true] },
	{ label: 'Document & photo storage', values: [false, true, true, true] },
	{ label: 'Advanced search & retrieval', values: [false, false, true, true] },
	{ label: 'Property reports & exports', values: [false, true, true, true] },
	{ label: 'Warranty tracking', values: [false, true, true, true] },
	{ label: 'Linked parts & supplies', values: [false, true, true, true] },
	{ label: 'Team collaboration', values: [false, false, false, true] },
	{ label: 'Tenant maintenance requests', values: [false, false, false, true] },
	{ label: 'Role-based access', values: [false, false, false, true] },
	{ label: 'Property groups', values: [false, false, false, true] },
	{ label: 'Advanced analytics', values: [false, false, false, true] },
	{ label: 'Priority support', values: [false, false, false, true] },
] as const;

const PricingSectionComponent = () => {
	const navigate = useNavigate();

	const renderComparisonValue = (value: boolean | string) => {
		if (typeof value === 'boolean') {
			return value ? (
				<PricingCheck>
					<FontAwesomeIcon icon={faCheck} />
				</PricingCheck>
			) : (
				<PricingX>
					<FontAwesomeIcon icon={faTimes} />
				</PricingX>
			);
		}

		return value;
	};

	const getCardHighlights = (planId: string, fallbackFeatures: string[]) => {
		return cardFeatureHighlights[planId] || fallbackFeatures.slice(0, 4);
	};

	return (
		<PricingSection id='Pricing'>
			<PricingTitle>Simple Pricing That Grows With You</PricingTitle>
			<PricingSubtitle>
				Start with the free tier, then upgrade when you need more capacity or
				advanced tools. No hidden fees.
			</PricingSubtitle>

			<PricingGrid>
				{paidPlans.map((plan, index) => (
					<PricingCard key={plan.id} className={plan.id === 'homeowner_plus' ? 'popular' : ''}>
						{plan.id === 'homeowner_plus' && <PricingBadge>Most Popular</PricingBadge>}
						<PricingPlan>
							{index === 0 && <FontAwesomeIcon icon={faHouse} />}
							{index === 1 && <FontAwesomeIcon icon={faHouse} />}
							{index === 2 && <FontAwesomeIcon icon={faBuilding} />}
							{index === 3 && <FontAwesomeIcon icon={faBuildingUser} />}
							<span>{plan.name}</span>
						</PricingPlan>
						<PricingPrice>${plan.priceMonthly}</PricingPrice>
						<PricingPeriod>per month</PricingPeriod>
						<PricingMeta>
							Up to {plan.maxProperties}{' '}
							{plan.maxProperties === 1 ? 'property' : 'properties'}
						</PricingMeta>
						<PricingFeatureList>
							{getCardHighlights(plan.id, plan.features).map((feature) => (
								<PricingFeatureItem key={feature}>{feature}</PricingFeatureItem>
							))}
						</PricingFeatureList>
					</PricingCard>
				))}
			</PricingGrid>

			<PricingComparison>
				<PricingComparisonTitle>Quick Plan Comparison</PricingComparisonTitle>
				<PricingTable>
					<PricingTableHead>
						<PricingTableCell className='head-cell'>Feature</PricingTableCell>
						<PricingTableCell className='head-cell'>Home</PricingTableCell>
						<PricingTableCell className='head-cell'>Homeowner+</PricingTableCell>
						<PricingTableCell className='head-cell'>Property</PricingTableCell>
						<PricingTableCell className='head-cell'>Portfolio</PricingTableCell>
					</PricingTableHead>
					{quickComparisonRows.map(({ label, values }) => (
						<PricingTableRow key={label}>
							<PricingTableCell>{label}</PricingTableCell>
							{values.map((value, index) => (
								<PricingTableCell key={`${label}-${paidPlans[index].id}`}>
									{renderComparisonValue(value)}
								</PricingTableCell>
							))}
						</PricingTableRow>
					))}
				</PricingTable>
			</PricingComparison>

			<PricingActionRow>
				<PricingActionButton onClick={() => navigate('/register')}>
					Get Started
				</PricingActionButton>
				<PricingActionLink onClick={() => navigate('/login')}>
					Already have an account? Sign in
				</PricingActionLink>
			</PricingActionRow>
		</PricingSection>
	);
};

export default PricingSectionComponent;
