import React, { useState } from 'react';
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
	PricingAudienceControls,
	PricingAudienceButton,
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

type PlanAudience = 'home' | 'business';

const planGroups: Record<PlanAudience, number[]> = {
	home: [0, 1],
	business: [2, 3],
};

const cardFeatureHighlights: Record<string, string[]> = {
	home: [
		'1 home included',
		'Up to 15 equipment records',
		'Basic record gap check',
		'Starter document storage',
	],
	property: [
		'Up to 7 properties included',
		'Unlimited equipment records',
		'Property groups',
		'Resident maintenance requests',
	],
	homeowner_plus: [
		'1 home included',
		'Unlimited equipment records',
		'Maintley Intelligence',
		'Reminders and timelines',
	],
	portfolio: [
		'Up to 15 properties included',
		'Team collaboration',
		'Resident maintenance requests',
		'Role-based access',
	],
};

const bestForByPlanId: Record<string, string> = {
	homeowner: 'Best for: organizing one home’s essential records',
	homeowner_plus: 'Best for: turning records into maintenance guidance',
	property: 'Best for: managing several properties in one place',
	portfolio: 'Best for: coordinating a portfolio with your team',
};

const formatLimit = (value: number, unit: string) =>
	value >= 999 ? 'Unlimited' : `${value} ${unit}${value === 1 ? '' : 's'}`;

const quickComparisonRows = [
	{ label: 'Properties included', values: ['1', '1', 'Up to 7', 'Up to 15'] },
	{ label: 'Equipment records', values: ['Up to 15', 'Unlimited', 'Unlimited', 'Unlimited'] },
	{
		label: 'File limit',
		values: paidPlans.map((plan) => formatLimit(plan.maxFiles, 'file')),
	},
	{
		label: 'Storage limit',
		values: paidPlans.map((plan) => `${plan.maxStorageGb} GB`),
	},
	{ label: 'Storage usage display', values: [true, true, true, true] },
	{ label: 'Property setup assistant', values: [true, true, true, true] },
	{ label: 'Maintenance history tracking', values: [true, true, true, true] },
	{ label: 'Manual tasks', values: [true, true, true, true] },
	{ label: 'Task assignment', values: [true, true, true, true] },
	{ label: 'Basic record gap check', values: [true, true, true, true] },
	{ label: 'Maintley Intelligence guidance', values: ['Record gaps', 'Personalized guidance', 'Property guidance', 'Portfolio guidance'] },
	{ label: 'Property Insight observations', values: [false, true, true, true] },
	{ label: 'Suggested maintenance actions', values: ['Record gaps only', 'Generate tasks', 'Generate tasks', 'Generate tasks'] },
	{ label: 'Recurring maintenance scheduling', values: [false, true, true, true] },
	{ label: 'Task reminder emails', values: [false, true, true, true] },
	{ label: 'Push notifications', values: [false, true, true, true] },
	{ label: 'Document & photo storage', values: [true, true, true, true] },
	{ label: 'Advanced search & retrieval', values: [false, true, true, true] },
	{ label: 'Raw data export', values: [true, true, true, true] },
	{ label: 'Warranty information', values: [true, true, true, true] },
	{ label: 'Linked parts & supplies', values: [false, true, true, true] },
	{ label: 'Family members', values: ['3', '3', '3', '3'] },
	{ label: 'Contractor directory', values: [true, true, true, true] },
	{ label: 'Team collaboration', values: [false, false, 'Simple', true] },
	{ label: 'Resident maintenance requests', values: [false, false, true, true] },
	{ label: 'Resident profiles', values: [false, false, true, true] },
	{ label: 'Role-based access', values: [false, false, false, true] },
	{ label: 'Property groups', values: [false, false, true, true] },
	{ label: 'Portfolio reporting', values: [false, false, false, true] },
	{ label: 'Advanced analytics', values: [false, false, false, true] },
	{ label: 'Priority support', values: [false, false, false, true] },
] as const;

const PricingSectionComponent = () => {
	const navigate = useNavigate();
	const [planAudience, setPlanAudience] = useState<PlanAudience>('home');
	const visiblePlanIndexes = planGroups[planAudience];

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
				{planAudience === 'home'
					? 'Start free, then add reminders, deeper records, and Maintley Intelligence when your home needs them.'
					: 'Choose the property capacity and coordination tools that fit your rentals or portfolio.'}
			</PricingSubtitle>
			<PricingAudienceControls aria-label='Pricing audience'>
				<PricingAudienceButton
					type='button'
					$active={planAudience === 'home'}
					onClick={() => setPlanAudience('home')}>
					Homeowner
				</PricingAudienceButton>
				<PricingAudienceButton
					type='button'
					$active={planAudience === 'business'}
					onClick={() => setPlanAudience('business')}>
					Business
				</PricingAudienceButton>
			</PricingAudienceControls>

			<PricingGrid>
				{visiblePlanIndexes.map((index) => {
					const plan = paidPlans[index];
					return (
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
						<PricingMeta>{bestForByPlanId[plan.id]}</PricingMeta>
						<PricingFeatureList>
							{getCardHighlights(plan.id, plan.features).map((feature) => (
								<PricingFeatureItem key={feature}>{feature}</PricingFeatureItem>
							))}
						</PricingFeatureList>
					</PricingCard>
					);
				})}
			</PricingGrid>

			<PricingComparison>
				<PricingComparisonTitle>Quick Plan Comparison</PricingComparisonTitle>
				<PricingTable $planCount={visiblePlanIndexes.length}>
					<PricingTableHead>
						<PricingTableCell className='head-cell label-cell'>Feature</PricingTableCell>
						{visiblePlanIndexes.map((index) => (
							<PricingTableCell className='head-cell' key={paidPlans[index].id}>
								{paidPlans[index].name}
							</PricingTableCell>
						))}
					</PricingTableHead>
					{quickComparisonRows.map(({ label, values }) => (
						<PricingTableRow key={label}>
							<PricingTableCell className='label-cell'>{label}</PricingTableCell>
							{visiblePlanIndexes.map((index) => (
								<PricingTableCell key={`${label}-${paidPlans[index].id}`}>
									{renderComparisonValue(values[index])}
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
