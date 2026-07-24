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
import { isPlanAvailable } from '../../../entitlements/planAvailability';
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
	FaqAnswer,
	FaqItem,
	FaqList,
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
	ResourceCard,
	ResourceGrid,
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

const resourcesEntry = publicNavigation.items.find(
	(item) => item.id === 'resources',
);
const featuredResources =
	resourcesEntry && 'children' in resourcesEntry
		? (resourcesEntry.children ?? [])
				.filter((item) => item.enabled && item.id !== 'all-articles')
				.slice(0, 3)
		: [];

const resourceCopy: Record<string, { topic: string; description: string }> = {
	'home-maintenance-checklist': {
		topic: 'Checklist',
		description:
			'Build a practical seasonal routine without trying to remember every task at once.',
	},
	'seasonal-maintenance-schedule': {
		topic: 'Seasonal planning',
		description:
			'Organize recurring home care by season and turn the schedule into useful history.',
	},
	'home-service-history': {
		topic: 'Property records',
		description:
			'Learn what to record after service visits so future repairs start with better context.',
	},
};

export const homepageFaqs = [
	{
		question: 'Is Maintley free?',
		answer:
			'Yes. The Free plan supports one home with essential maintenance tasks, up to 15 equipment records, and starter document storage. Paid plans add more capacity and guidance.',
	},
	{
		question: 'Can I manage multiple properties?',
		answer:
			'Yes. The Property plan supports up to seven properties, while Portfolio supports up to fifteen properties and broader team coordination.',
	},
	{
		question: 'Who owns the information I add?',
		answer:
			'You retain ownership of the information you enter. Maintley receives only the permission needed to store and process it to operate the service.',
	},
	{
		question: 'Can contractors or service businesses access my property?',
		answer:
			'Maintley does not automatically give outside companies access. Property information is available only to people with the appropriate account and property permissions.',
	},
	{
		question: 'Does Maintley verify maintenance work?',
		answer:
			'No. Maintley stores and displays submitted records and can show who recorded them, but it does not certify that work was performed or verify its quality.',
	},
	{
		question: 'Can I export my information?',
		answer:
			'Maintley supports property and maintenance reports in formats such as PDF or CSV. Exports are informational records and are not certified for legal, insurance, resale, or regulatory use.',
	},
	{
		question: 'Where can I use Maintley?',
		answer:
			'Maintley works on the web and through the Android app. On iPhone and iPad, you can open Maintley in Safari and add it to your Home Screen.',
	},
	{
		question: 'What happens if I cancel a paid subscription?',
		answer:
			'You can cancel at any time, and paid access continues through the end of the current billing period. Canceling a subscription does not automatically delete your account.',
	},
];

const formatMonthlyPrice = (price: number) =>
	price === 0 ? 'Free' : `$${price.toFixed(2)}/month`;

export const ProductProofSection = () => (
	<PublicSection id="ProductProof" $tint>
		<SectionShell>
			<SectionEyebrow>Built around real property records</SectionEyebrow>
			<SectionHeading>
				See your home’s maintenance story in one place
			</SectionHeading>
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
								decoding="async"
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
				<SectionLink href="/features/">Explore all features →</SectionLink>
			</CenteredAction>
		</SectionShell>
	</PublicSection>
);

export const HowItWorksSection = () => (
	<MemorySection id="HowItWorks">
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
	<PublicSection id="Solutions" $tint>
		<SectionShell>
			<SectionEyebrow>Who Maintley is for</SectionEyebrow>
			<SectionHeading>
				Property records that fit your responsibility
			</SectionHeading>
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
							<SectionLink href={solution.href}>
								See how Maintley helps →
							</SectionLink>
						</AudienceCard>
					);
				})}
			</AudienceGrid>
		</SectionShell>
	</PublicSection>
);

export const SecuritySection = () => (
	<PublicSection id="Security">
		<SectionShell>
			<SectionEyebrow>Security and control</SectionEyebrow>
			<SectionHeading>
				Your records stay under clear account control
			</SectionHeading>
			<SectionIntro>
				Maintley is responsible for protecting the software and enforcing
				access. You control the property information you choose to keep in it.
			</SectionIntro>
			<TrustGrid>
				<TrustCard>
					<CardKicker>
						<FontAwesomeIcon icon={faKey} /> Access
					</CardKicker>
					<CardTitle>Permission-based access</CardTitle>
					<CardText>
						Only people with the appropriate property access can view or change
						its records.
					</CardText>
				</TrustCard>
				<TrustCard>
					<CardKicker>
						<FontAwesomeIcon icon={faUserCheck} /> Accountability
					</CardKicker>
					<CardTitle>Clear record attribution</CardTitle>
					<CardText>
						Maintenance information can show who recorded it without implying
						Maintley certified the work.
					</CardText>
				</TrustCard>
				<TrustCard>
					<CardKicker>
						<FontAwesomeIcon icon={faFileShield} /> Privacy
					</CardKicker>
					<CardTitle>Purposeful property data</CardTitle>
					<CardText>
						Maintley is designed for useful property records, not unnecessary
						personal profiles.
					</CardText>
				</TrustCard>
			</TrustGrid>
			<CenteredAction>
				<SectionLink href="/security-and-privacy/">
					Review security and privacy
				</SectionLink>
			</CenteredAction>
		</SectionShell>
	</PublicSection>
);

export const FeaturedResourcesSection = () => (
	<PublicSection id="Resources" $tint>
		<SectionShell>
			<SectionEyebrow>Practical home maintenance guides</SectionEyebrow>
			<SectionHeading>Start with the information you need today</SectionHeading>
			<SectionIntro>
				Use a checklist, build a seasonal routine, or decide what to save after
				a service visit. Each guide answers the question first, then helps you
				keep the result useful.
			</SectionIntro>
			<ResourceGrid>
				{featuredResources.map((resource) => {
					const copy = resourceCopy[resource.id];
					if (!copy || !('href' in resource)) return null;

					return (
						<ResourceCard key={resource.id}>
							<CardKicker>{copy.topic}</CardKicker>
							<CardTitle>{resource.label}</CardTitle>
							<CardText>{copy.description}</CardText>
							<SectionLink href={resource.href}>Read the guide</SectionLink>
						</ResourceCard>
					);
				})}
			</ResourceGrid>
			<CenteredAction>
				<PrimaryPageLink href="/resources/">
					Browse all articles
				</PrimaryPageLink>
			</CenteredAction>
		</SectionShell>
	</PublicSection>
);

export const PricingPreviewSection = () => (
	<PublicSection id="Pricing">
		<SectionShell>
			<SectionEyebrow>Simple plans</SectionEyebrow>
			<SectionHeading>
				Start free, then grow with your properties
			</SectionHeading>
			<SectionIntro>
				Choose a homeowner plan for one home or a property plan for managing
				several. Portfolio remains available for larger property collections.
			</SectionIntro>
			<PricingGrid>
				{publicPlanFacts.plans.filter(({ id }) => isPlanAvailable(id)).map((plan) => (
					<PriceCard key={plan.id} $featured={plan.id === 'homeowner_plus'}>
						<PriceName>{plan.name}</PriceName>
						<PriceValue>{formatMonthlyPrice(plan.priceMonthly)}</PriceValue>
						<PriceDescription>{plan.bestFor}</PriceDescription>
					</PriceCard>
				))}
			</PricingGrid>
			<CenteredAction>
				<PrimaryPageLink href="/pricing/">Compare every plan</PrimaryPageLink>
			</CenteredAction>
		</SectionShell>
	</PublicSection>
);

export const FAQSection = () => (
	<PublicSection id="FAQ" $tint>
		<SectionShell>
			<SectionEyebrow>Common questions</SectionEyebrow>
			<SectionHeading>Know what to expect before you start</SectionHeading>
			<SectionIntro>
				Clear answers about plans, property records, access, exports, and what
				Maintley does not verify.
			</SectionIntro>
			<FaqList>
				{homepageFaqs.map((item) => (
					<FaqItem key={item.question}>
						<summary>{item.question}</summary>
						<FaqAnswer>{item.answer}</FaqAnswer>
					</FaqItem>
				))}
			</FaqList>
		</SectionShell>
	</PublicSection>
);
