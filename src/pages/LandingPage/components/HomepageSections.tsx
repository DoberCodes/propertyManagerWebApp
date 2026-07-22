import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faCircleCheck,
	faFileShield,
	faKey,
	faUserCheck,
} from '@fortawesome/free-solid-svg-icons';
import publicNavigation from '../../../config/publicNavigation.json';
import publicPlanFacts from '../../../config/publicPlanFacts.json';
import {
	MemoryGrid,
	MemoryHeader,
	MemoryIntro,
	MemorySection,
	MemoryShell,
	MemoryStageCard,
	MemoryStageExampleItem,
	MemoryStageExamples,
	MemoryStageKicker,
	MemoryStageNumber,
	MemoryStageText,
	MemoryStageTitle,
} from '../LandingPage.styles';
import {
	AudienceCard,
	AudienceGrid,
	CardKicker,
	CardText,
	CardTitle,
	CenteredAction,
	PriceCard,
	PriceDescription,
	PriceName,
	PriceValue,
	PricingGrid,
	PrimaryPageLink,
	ProofCard,
	ProofCopy,
	ProofGrid,
	PublicSection,
	ScreenshotFrame,
	SectionEyebrow,
	SectionHeading,
	SectionIntro,
	SectionLink,
	SectionShell,
	TrustCard,
	TrustGrid,
} from './HomepageSections.styles';

const proofItems = [
	{
		kicker: 'Property overview',
		title: 'See what needs attention without reconstructing the past',
		text: 'Your dashboard brings upcoming work, saved records, and useful property context into one practical view.',
		image: '/screenshots/maintleyDashboard.png',
		width: 2301,
		height: 1144,
		alt: 'Maintley dashboard showing property maintenance tasks and saved records',
		wide: true,
	},
	{
		kicker: 'Maintenance history',
		title: 'Keep a timeline future you can trust',
		text: 'Completed work, notes, and documents stay connected to the property instead of disappearing into separate folders.',
		image: '/screenshots/desktop_taskhistory.png',
		width: 1282,
		height: 835,
		alt: 'Maintley Maintenance History tab showing completed work and record details',
	},
	{
		kicker: 'Maintley Intelligence',
		title: 'Turn saved records into explainable next steps',
		text: 'Maintley reviews what has been recorded and points out a small number of gaps or opportunities worth your attention.',
		image: '/screenshots/desktop_quickscan2.png',
		width: 1203,
		height: 629,
		alt: 'Maintley Intelligence property scan results showing explainable maintenance findings',
	},
];

const maintleyLoop = [
	{
		kicker: 'Record',
		title: 'Save the details',
		text: 'Add maintenance, equipment, invoices, manuals, photos, and warranties.',
		examples: ['Tasks and maintenance', 'Documents and photos'],
	},
	{
		kicker: 'Remember',
		title: 'Build property history',
		text: 'Keep each detail connected to the right property, system, and service event.',
		examples: ['Equipment context', 'Service history'],
	},
	{
		kicker: 'Understand',
		title: 'Review what is known',
		text: 'Maintley Intelligence checks saved records for useful gaps and patterns.',
		examples: ['Explainable findings', 'Record-based context'],
	},
	{
		kicker: 'Act',
		title: 'Know what to do next',
		text: 'Use reminders and recommendations to keep maintenance moving forward.',
		examples: ['Upcoming reminders', 'Practical next steps'],
	},
];

const solutionCopy: Record<string, { title: string; text: string }> = {
	homeowners: {
		title: 'For Homeowners',
		text: 'Keep one home’s maintenance history, equipment, warranties, documents, and reminders organized for the long run.',
	},
	'property-owners-managers': {
		title: 'For Property Owners & Managers',
		text: 'Coordinate maintenance across several properties while keeping each property’s records and responsibilities clear.',
	},
};

const solutionsEntry = publicNavigation.items.find(
	(item) => item.id === 'solutions',
);
const enabledSolutions =
	solutionsEntry && 'children' in solutionsEntry
		? (solutionsEntry.children ?? []).filter((item) => item.enabled)
		: [];

const formatMonthlyPrice = (price: number) =>
	price === 0 ? 'Free' : `$${price.toFixed(2)}/month`;

export const ProductProofSection = () => (
	<PublicSection id='ProductProof' $tint>
		<SectionShell>
			<SectionEyebrow>Built around real property records</SectionEyebrow>
			<SectionHeading>See your home’s maintenance story in one place</SectionHeading>
			<SectionIntro>
				Maintley connects what happened, what was saved, and what may need your
				attention next. These are real views from the product.
			</SectionIntro>
			<ProofGrid>
				{proofItems.map((item) => (
					<ProofCard key={item.title} $wide={item.wide}>
						<ScreenshotFrame>
							<img
								src={item.image}
								width={item.width}
								height={item.height}
								alt={item.alt}
								loading={item.wide ? 'eager' : 'lazy'}
								decoding='async'
							/>
						</ScreenshotFrame>
						<ProofCopy>
							<CardKicker>{item.kicker}</CardKicker>
							<CardTitle>{item.title}</CardTitle>
							<CardText>{item.text}</CardText>
						</ProofCopy>
					</ProofCard>
				))}
			</ProofGrid>
			<CenteredAction>
				<SectionLink href='/features/'>Explore all features →</SectionLink>
			</CenteredAction>
		</SectionShell>
	</PublicSection>
);

export const HowItWorksSection = () => (
	<MemorySection id='HowItWorks'>
		<MemoryShell>
			<MemoryHeader>How Maintley Works</MemoryHeader>
			<MemoryIntro>
				Every detail you save becomes useful property history—and better context
				for the maintenance decisions that follow.
			</MemoryIntro>
			<MemoryGrid>
				{maintleyLoop.map((stage, index) => (
					<MemoryStageCard key={stage.title}>
						<MemoryStageNumber>{index + 1}</MemoryStageNumber>
						<MemoryStageKicker>{stage.kicker}</MemoryStageKicker>
						<MemoryStageTitle>{stage.title}</MemoryStageTitle>
						<MemoryStageText>{stage.text}</MemoryStageText>
						<MemoryStageExamples>
							{stage.examples.map((example) => (
								<MemoryStageExampleItem key={example}>
									<FontAwesomeIcon icon={faCircleCheck} />
									<span>{example}</span>
								</MemoryStageExampleItem>
							))}
						</MemoryStageExamples>
					</MemoryStageCard>
				))}
			</MemoryGrid>
		</MemoryShell>
	</MemorySection>
);

export const SolutionsSection = () => (
	<PublicSection id='Solutions' $tint>
		<SectionShell>
			<SectionEyebrow>Who Maintley is for</SectionEyebrow>
			<SectionHeading>Property records that fit your responsibility</SectionHeading>
			<SectionIntro>
				Start with the way you care for property today. Maintley keeps the
				property—not a company or tenant profile—at the center.
			</SectionIntro>
			<AudienceGrid>
				{enabledSolutions.map((solution) => {
					const copy = solutionCopy[solution.id];
					if (!copy) return null;

					return (
						<AudienceCard key={solution.id}>
							<CardKicker>{solution.label}</CardKicker>
							<CardTitle>{copy.title}</CardTitle>
							<CardText>{copy.text}</CardText>
							<SectionLink href={solution.href}>See how Maintley helps →</SectionLink>
						</AudienceCard>
					);
				})}
			</AudienceGrid>
		</SectionShell>
	</PublicSection>
);

export const SecuritySection = () => (
	<PublicSection id='Security'>
		<SectionShell>
			<SectionEyebrow>Security and control</SectionEyebrow>
			<SectionHeading>Your records stay under clear account control</SectionHeading>
			<SectionIntro>
				Maintley is responsible for protecting the software and enforcing access.
				You control the property information you choose to keep in it.
			</SectionIntro>
			<TrustGrid>
				<TrustCard>
					<CardKicker><FontAwesomeIcon icon={faKey} /> Access</CardKicker>
					<CardTitle>Permission-based access</CardTitle>
					<CardText>Only people with the appropriate property access can view or change its records.</CardText>
				</TrustCard>
				<TrustCard>
					<CardKicker><FontAwesomeIcon icon={faUserCheck} /> Accountability</CardKicker>
					<CardTitle>Clear record attribution</CardTitle>
					<CardText>Maintenance information can show who recorded it without implying Maintley certified the work.</CardText>
				</TrustCard>
				<TrustCard>
					<CardKicker><FontAwesomeIcon icon={faFileShield} /> Privacy</CardKicker>
					<CardTitle>Purposeful property data</CardTitle>
					<CardText>Maintley is designed for useful property records, not unnecessary personal profiles.</CardText>
				</TrustCard>
			</TrustGrid>
			<CenteredAction>
				<SectionLink href='/legal/'>Review privacy and legal information →</SectionLink>
			</CenteredAction>
		</SectionShell>
	</PublicSection>
);

export const PricingPreviewSection = () => (
	<PublicSection id='Pricing' $tint>
		<SectionShell>
			<SectionEyebrow>Simple plans</SectionEyebrow>
			<SectionHeading>Start free, then grow with your properties</SectionHeading>
			<SectionIntro>
				Choose a homeowner plan for one home or a property plan for managing
				several. Portfolio remains available for larger property collections.
			</SectionIntro>
			<PricingGrid>
				{publicPlanFacts.plans.map((plan) => (
					<PriceCard key={plan.id} $featured={plan.id === 'homeowner_plus'}>
						<PriceName>{plan.name}</PriceName>
						<PriceValue>{formatMonthlyPrice(plan.priceMonthly)}</PriceValue>
						<PriceDescription>{plan.bestFor}</PriceDescription>
					</PriceCard>
				))}
			</PricingGrid>
			<CenteredAction>
				<PrimaryPageLink href='/pricing/'>Compare every plan</PrimaryPageLink>
			</CenteredAction>
		</SectionShell>
	</PublicSection>
);
