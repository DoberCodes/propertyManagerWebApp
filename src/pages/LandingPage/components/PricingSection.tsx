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
	TRIAL_DURATION_DAYS,
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
	SUBSCRIPTION_PLANS.BASIC,
	SUBSCRIPTION_PLANS.PROFESSIONAL,
];

const permissionComparisonRows = [
	{ id: 'exportReports', key: 'canExportData', label: 'Export reports' },
	{
		id: 'multiUnitSupport',
		key: 'canManageMultiUnit',
		label: 'Multi-unit property support',
	},
	{
		id: 'maintenanceRequestIntake',
		key: 'canManageTenants',
		label: 'Maintenance request intake',
	},
	{
		id: 'advancedAuditTrail',
		key: 'canAdvancedAuditTrail',
		label: 'Advanced audit trail depth',
	},
	{ id: 'tenantManagement', key: 'canManageTenants', label: 'Tenant management' },
	{ id: 'manageTeamMembers', key: 'canManageTeam', label: 'Manage team members' },
	{ id: 'advancedReports', key: 'canViewReports', label: 'Advanced reports' },
	{ id: 'prioritySupport', key: 'prioritySupport', label: 'Priority support' },
] as const;

const coreFeatureComparisonRows = [
	{ label: 'Maintenance history', values: [true, true, true] },
	{ label: 'Task management', values: [true, true, true] },
	{ label: 'Device management', values: [true, true, true] },
	{ label: 'Contractor tracking', values: [true, true, true] },
	{ label: 'Photo & document uploads', values: [true, true, true] },
] as const;

const PricingSectionComponent = () => {
	const navigate = useNavigate();

	return (
		<PricingSection id='Pricing'>
			<PricingTitle>Simple Pricing That Grows With You</PricingTitle>
			<PricingSubtitle>
				Start with a {TRIAL_DURATION_DAYS}-day free trial on any paid plan. No
				hidden fees.
			</PricingSubtitle>

			<PricingGrid>
				{paidPlans.map((plan, index) => (
					<PricingCard key={plan.id} className={index === 1 ? 'popular' : ''}>
						{index === 1 && <PricingBadge>Most Popular</PricingBadge>}
						<PricingPlan>
							{index === 0 && <FontAwesomeIcon icon={faHouse} />}
							{index === 1 && <FontAwesomeIcon icon={faBuilding} />}
							{index === 2 && <FontAwesomeIcon icon={faBuildingUser} />}
							<span>{plan.name}</span>
						</PricingPlan>
						<PricingPrice>${plan.priceMonthly}</PricingPrice>
						<PricingPeriod>per month</PricingPeriod>
						<PricingMeta>
							Up to {plan.maxProperties}{' '}
							{plan.maxProperties === 1 ? 'property' : 'properties'}
						</PricingMeta>
						<PricingFeatureList>
							{plan.features.slice(0, 4).map((feature) => (
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
						<PricingTableCell className='head-cell'>Homeowner</PricingTableCell>
						<PricingTableCell className='head-cell'>Basic</PricingTableCell>
						<PricingTableCell className='head-cell'>
							Professional
						</PricingTableCell>
					</PricingTableHead>
					<PricingTableRow>
						<PricingTableCell>Properties included</PricingTableCell>
						{paidPlans.map((plan) => (
							<PricingTableCell key={`${plan.id}-maxProperties`}>
								{plan.maxProperties}
							</PricingTableCell>
						))}
					</PricingTableRow>
					{coreFeatureComparisonRows.map(({ label, values }) => (
						<PricingTableRow key={label}>
							<PricingTableCell>{label}</PricingTableCell>
							{values.map((enabled, index) => (
								<PricingTableCell key={`${label}-${paidPlans[index].id}`}>
									{enabled ? (
										<PricingCheck>
											<FontAwesomeIcon icon={faCheck} />
										</PricingCheck>
									) : (
										<PricingX>
											<FontAwesomeIcon icon={faTimes} />
										</PricingX>
									)}
								</PricingTableCell>
							))}
						</PricingTableRow>
					))}
					{permissionComparisonRows.map(({ id, key, label }) => (
						<PricingTableRow key={id}>
							<PricingTableCell>{label}</PricingTableCell>
							{paidPlans.map((plan) => (
								<PricingTableCell key={`${plan.id}-${key}`}>
									{plan.permissions[key] ? (
										<PricingCheck>
											<FontAwesomeIcon icon={faCheck} />
										</PricingCheck>
									) : (
										<PricingX>
											<FontAwesomeIcon icon={faTimes} />
										</PricingX>
									)}
								</PricingTableCell>
							))}
						</PricingTableRow>
					))}
				</PricingTable>
			</PricingComparison>

			<PricingActionRow>
				<PricingActionButton onClick={() => navigate('/register')}>
					Start {TRIAL_DURATION_DAYS}-Day Free Trial
				</PricingActionButton>
				<PricingActionLink onClick={() => navigate('/login')}>
					Already have an account? Sign in
				</PricingActionLink>
			</PricingActionRow>
		</PricingSection>
	);
};

export default PricingSectionComponent;
