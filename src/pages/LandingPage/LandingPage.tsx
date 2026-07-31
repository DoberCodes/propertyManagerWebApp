import { useNavigate } from 'react-router-dom';
import { LandingNavbar } from 'Components/Library/LandingNavbar';
import SEO from 'Components/SEO/SEO';
import HeroSection from './components/Hero';
import {
	FAQSection,
	FeaturedResourcesSection,
	HowItWorksSection,
	PricingPreviewSection,
	ProductProofSection,
	SecuritySection,
	SolutionsSection,
	homepageFaqs,
} from './components/HomepageSections';
import {
	CTAButton,
	CTAButtons,
	CTADescription,
	CTASecondary,
	CTASection,
	CTATitle,
	FooterBrand,
	FooterContent,
	FooterCopyright,
	FooterGroup,
	FooterGroupTitle,
	FooterLegalLink,
	FooterLink,
	FooterLinks,
	FooterSection,
	Wrapper,
} from './LandingPage.styles';

const LandingPageComponent = () => {
	const navigate = useNavigate();

	const seo = {
		title: 'Maintley | Home Maintenance Tracker & Property Memory App',
		description:
			'Track home maintenance, appliances, service history, warranties, documents, and recurring tasks in one place.',
		url: 'https://maintleyapp.com/',
		image: 'https://maintleyapp.com/screenshots/maintleyDashboard.png',
		keywords:
			'home maintenance tracker, appliance maintenance tracker, home maintenance log, property maintenance history, recurring maintenance reminders',
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: homepageFaqs.map((item) => ({
				'@type': 'Question',
				name: item.question,
				acceptedAnswer: {
					'@type': 'Answer',
					text: item.answer,
				},
			})),
		},
	};

	return (
		<>
			<SEO {...seo} />
			<LandingNavbar />
			<Wrapper>
				<HeroSection />
				<ProductProofSection />
				<HowItWorksSection />
				<SolutionsSection />
				<SecuritySection />
				<FeaturedResourcesSection />
				<PricingPreviewSection />
				<FAQSection />

				<CTASection>
					<CTATitle>
						Give Future You the Answers You Wish You Had Today
					</CTATitle>
					<CTADescription>
						Maintley began with a simple problem: important home details
						disappear over time. Start building a property history you can use
						later.
					</CTADescription>
					<CTAButtons>
						<CTAButton onClick={() => navigate('/register')}>
							Start Free
						</CTAButton>
						<CTASecondary onClick={() => navigate('/login')}>
							Sign In
						</CTASecondary>
					</CTAButtons>
				</CTASection>

				<FooterSection>
					<FooterContent>
						<FooterBrand>
							<h3>Maintley</h3>
							<p>
								A simple way to keep your home, systems, and service history
								useful for the long run.
							</p>
						</FooterBrand>

						<FooterLinks aria-label="Footer navigation">
							<FooterGroup>
								<FooterGroupTitle>Product</FooterGroupTitle>
								<FooterLink as="a" href="/features/">
									Features
								</FooterLink>
								<FooterLink as="a" href="/pricing/">
									Pricing
								</FooterLink>
							</FooterGroup>
							<FooterGroup>
								<FooterGroupTitle>Solutions</FooterGroupTitle>
								<FooterLink as="a" href="/homeowners/">
									Homeowners
								</FooterLink>
								<FooterLink as="a" href="/property-managers/">
									Property Owners &amp; Managers
								</FooterLink>
							</FooterGroup>
							<FooterGroup>
								<FooterGroupTitle>Resources</FooterGroupTitle>
								<FooterLink
									as="a"
									href="/resources/home-maintenance-checklist/"
								>
									Home Maintenance Checklist
								</FooterLink>
								<FooterLink
									as="a"
									href="/resources/seasonal-home-maintenance-schedule/"
								>
									Seasonal Maintenance Schedule
								</FooterLink>
								<FooterLink as="a" href="/resources/">
									All Articles
								</FooterLink>
							</FooterGroup>
							<FooterGroup>
								<FooterGroupTitle>Legal</FooterGroupTitle>
								<FooterLegalLink as="a" href="/security-and-privacy/">
									Security &amp; Privacy
								</FooterLegalLink>
								<FooterLegalLink as="a" href="/legal/">
									Legal Hub
								</FooterLegalLink>
								<FooterLegalLink as="a" href="/legal/privacy-policy">
									Privacy
								</FooterLegalLink>
								<FooterLegalLink as="a" href="/legal/terms-of-service">
									Terms
								</FooterLegalLink>
								<FooterLegalLink as="a" href="/legal/user-content-policy">
									Policies
								</FooterLegalLink>
							</FooterGroup>
						</FooterLinks>
					</FooterContent>
					<FooterCopyright>
						&copy; 2026 Maintley. Built for homeowners and long-term owners.
					</FooterCopyright>
				</FooterSection>
			</Wrapper>
		</>
	);
};

export default LandingPageComponent;
