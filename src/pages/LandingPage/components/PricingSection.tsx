import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faBuilding,
	faBuildingUser,
	faCheck,
	faHouse,
	faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { SUBSCRIPTION_PLANS } from '../../../constants/subscriptions';
import { isMultiHomeownerPlanEnabled } from '../../../entitlements/planAvailability';
import {
	PricingActionButton,
	PricingActionLink,
	PricingActionRow,
	PricingAudienceButton,
	PricingAudienceControls,
	PricingBadge,
	PricingCard,
	PricingCheck,
	PricingComparison,
	PricingComparisonTitle,
	PricingFeatureItem,
	PricingFeatureList,
	PricingGrid,
	PricingMeta,
	PricingPeriod,
	PricingPlan,
	PricingPrice,
	PricingSection,
	PricingSubtitle,
	PricingTable,
	PricingTableCell,
	PricingTableHead,
	PricingTableRow,
	PricingTitle,
	PricingX,
} from '../LandingPage.styles';

const paidPlans = [
	SUBSCRIPTION_PLANS.HOMEOWNER,
	SUBSCRIPTION_PLANS.HOMEOWNER_PLUS,
	SUBSCRIPTION_PLANS.MULTI_HOMEOWNER,
	SUBSCRIPTION_PLANS.PROPERTY,
	SUBSCRIPTION_PLANS.PORTFOLIO,
];

type PlanAudience = 'home' | 'business';

const planGroups: Record<PlanAudience, number[]> = {
	home: [0, 1, ...(isMultiHomeownerPlanEnabled() ? [2] : [])],
	business: [3, 4],
};

const formatLimit = (
	value: number,
	singular: string,
	plural = `${singular}s`,
	unlimited = false,
) => unlimited && value >= 999 ? 'Unlimited' : `${value} ${value === 1 ? singular : plural}`;

const comparisonValues = <T,>(
	free: T,
	homeownerPlus: T,
	property: T,
	portfolio: T,
	multiHomeowner: T = homeownerPlus,
): T[] => [free, homeownerPlus, multiHomeowner, property, portfolio];

const quickComparisonRows = [
	{
		label: 'Properties included',
		values: paidPlans.map((plan) => formatLimit(plan.maxProperties, 'property', 'properties')),
	},
	{
		label: 'Equipment records',
		values: paidPlans.map((plan) => formatLimit(plan.maxDevices, 'record', 'records', true)),
	},
	{
		label: 'File count',
		values: paidPlans.map(() => 'No file-count limit'),
	},
	{
		label: 'Storage limit',
		values: paidPlans.map((plan) => `${plan.maxStorageGb} GB`),
	},
	{ label: 'Storage usage display', values: comparisonValues(true, true, true, true) },
	{ label: 'Property setup assistant', values: comparisonValues(true, true, true, true) },
	{ label: 'Maintenance history tracking', values: comparisonValues(true, true, true, true) },
	{ label: 'Manual tasks', values: comparisonValues(true, true, true, true) },
	{ label: 'Task assignment', values: comparisonValues(true, true, true, true) },
	{ label: 'Basic record gap check', values: comparisonValues(true, true, true, true) },
	{ label: 'Maintley Intelligence guidance', values: comparisonValues('Lightweight record check', 'Home guidance', 'Lightweight record check', 'Portfolio guidance', 'Home guidance') },
	{ label: 'Property Insight observations', values: comparisonValues(false, true, false, true) },
	{ label: 'Suggested maintenance actions', values: comparisonValues('Generate tasks', 'Generate tasks', 'Generate tasks', 'Generate tasks') },
	{ label: 'Recurring maintenance scheduling', values: comparisonValues(true, true, true, true) },
	{ label: 'Task reminder emails', values: comparisonValues(true, true, true, true) },
	{ label: 'Push notifications', values: comparisonValues(true, true, true, true) },
	{ label: 'Document & photo storage', values: comparisonValues(true, true, true, true) },
	{ label: 'Advanced search & retrieval', values: comparisonValues(false, true, true, true) },
	{ label: 'Raw data export', values: comparisonValues(true, true, true, true) },
	{ label: 'Warranty information', values: comparisonValues(true, true, true, true) },
	{ label: 'Linked parts & supplies', values: comparisonValues(false, true, true, true) },
	{ label: 'Family members', values: comparisonValues('3', '3', '3', '3') },
	{ label: 'Contractor directory', values: comparisonValues(true, true, true, true) },
	{ label: 'Team collaboration', values: comparisonValues<boolean | string>(false, false, 'Simple', true) },
	{ label: 'Resident maintenance requests', values: comparisonValues(false, false, true, true) },
	{ label: 'Role-based access', values: comparisonValues(false, false, false, true) },
	{ label: 'Property groups', values: comparisonValues(false, false, true, true, true) },
	{ label: 'Portfolio reporting', values: comparisonValues(false, false, false, true) },
	{ label: 'Advanced analytics', values: comparisonValues(false, false, false, true) },
	{ label: 'Priority support', values: comparisonValues(false, false, false, true) },
];

const PricingSectionComponent = () => {
	const navigate = useNavigate();
	const [planAudience, setPlanAudience] = useState<PlanAudience>('home');
	const visiblePlanIndexes = planGroups[planAudience];

	const renderComparisonValue = (value: boolean | string) => {
		if (typeof value !== 'boolean') return value;
		return value ? (
			<PricingCheck aria-label='Included'>
				<FontAwesomeIcon icon={faCheck} aria-hidden='true' />
			</PricingCheck>
		) : (
			<PricingX aria-label='Not included'>
				<FontAwesomeIcon icon={faTimes} aria-hidden='true' />
			</PricingX>
		);
	};

	return (
		<PricingSection id='Pricing'>
			<PricingTitle>Simple Pricing That Grows With You</PricingTitle>
			<PricingSubtitle>
				{planAudience === 'home'
					? 'Start free, then add reminders, deeper records, and Maintley Intelligence when your home needs them.'
					: 'For landlords, property owners, and property-management teams. Choose the capacity and coordination tools that fit your rentals or portfolio.'}
			</PricingSubtitle>
			<PricingAudienceControls aria-label='Pricing audience'>
				<PricingAudienceButton
					type='button'
					$active={planAudience === 'home'}
					aria-pressed={planAudience === 'home'}
					onClick={() => setPlanAudience('home')}>
					Homeowner
				</PricingAudienceButton>
				<PricingAudienceButton
					type='button'
					$active={planAudience === 'business'}
					aria-pressed={planAudience === 'business'}
					onClick={() => setPlanAudience('business')}>
					Business
				</PricingAudienceButton>
			</PricingAudienceControls>

			<PricingGrid aria-live='polite'>
				{visiblePlanIndexes.map((index) => {
					const plan = paidPlans[index];
					return (
						<PricingCard key={plan.id} className={plan.id === 'homeowner_plus' ? 'popular' : ''}>
							{plan.id === 'homeowner_plus' && <PricingBadge>Most Popular</PricingBadge>}
							<PricingPlan>
								{index <= 2 && <FontAwesomeIcon icon={faHouse} />}
								{index === 3 && <FontAwesomeIcon icon={faBuilding} />}
								{index === 4 && <FontAwesomeIcon icon={faBuildingUser} />}
								<span>{plan.name}</span>
							</PricingPlan>
							<PricingPrice>${plan.priceMonthly}</PricingPrice>
							<PricingPeriod>per month</PricingPeriod>
							<PricingMeta>
								{plan.maxProperties === 1
									? '1 property included'
									: `Up to ${plan.maxProperties} properties included`}
							</PricingMeta>
							<PricingMeta>{plan.bestFor}</PricingMeta>
							<PricingFeatureList>
								{plan.highlights.map((feature) => (
									<PricingFeatureItem key={feature}>{feature}</PricingFeatureItem>
								))}
							</PricingFeatureList>
						</PricingCard>
					);
				})}
			</PricingGrid>

			<PricingComparison aria-live='polite'>
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
