import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faBookOpen,
	faMagnifyingGlass,
	faShieldHalved,
	faLock,
	faUserShield,
	faMobileScreenButton,
	faDesktop,
	faGlobe,
	faCar,
	faScrewdriverWrench,
	faChartLine,
	faPaperPlane,
	faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { LandingNavbar } from 'Components/Library/LandingNavbar';
import HeroSection from './components/Hero';
import FeaturesSectionComponent from './components/FeaturesSection';
import PricingSectionComponent from './components/PricingSection';
import {
	Wrapper,
	StorySection,
	StoryContent,
	StoryTitle,
	StoryText,
	WhySection,
	WhySectionInner,
	WhyTitle,
	WhyIntro,
	WhyGrid,
	WhyCard,
	WhyCardTitle,
	WhyCardText,
	WhyCallout,
	TimelineSection,
	TimelineShell,
	TimelineHeader,
	TimelineIntro,
	TimelineCard,
	TimelineList,
	TimelineRow,
	TimelineRail,
	TimelineIcon,
	TimelineContent,
	TimelineTitle,
	TimelineMeta,
	MemorySection,
	MemoryShell,
	MemoryHeader,
	MemoryIntro,
	MemoryGrid,
	MemoryStageCard,
	MemoryStageNumber,
	MemoryStageKicker,
	MemoryStageTitle,
	MemoryStageText,
	MemoryStageExampleLabel,
	MemoryStageExamples,
	MemoryStageExampleItem,
	BenefitsSection,
	BenefitRow,
	BenefitImage,
	BenefitContent,
	BenefitTitle,
	BenefitDescription,
	BenefitList,
	BenefitItem,
	CTASection,
	CTATitle,
	CTADescription,
	CTAButtons,
	CTAButton,
	CTASecondary,
	ContactSection,
	ContactTitle,
	ContactContent,
	ContactForm,
	FormGroup,
	FormInput,
	FormTextarea,
	SubmitButton,
	FooterSection,
	FooterContent,
	FooterBrand,
	FooterLinks,
	FooterLegalLinks,
	FooterLink,
	FooterLegalLink,
	DownloadSection,
	DownloadContainer,
	DownloadHeading,
	DownloadSubtext,
	DownloadButton,
	DownloadInfo,
	InfoItem,
	FooterCopyright,
} from './LandingPage.styles';

import { getGooglePlayStoreURL } from '../../utils/versionCheck';
import { CURRENT_APP_VERSION } from '../../config/appVersion';
import SEO from 'Components/SEO/SEO';
import { legalDocuments } from '../LegalPage/legalDocuments';

const LandingPageComponent = () => {
	const navigate = useNavigate();
	const androidAppUrl = getGooglePlayStoreURL();
	const handleFooterLink = (href: string) => {
		window.location.href = href;
	};

	// SEO — important for public landing page (site-wide defaults are in public/index.html)
	const seo = {
		title: 'Maintley | Home Maintenance Tracker & Property Memory App',
		description:
			'Track home maintenance, appliances, service history, warranties, documents, and recurring tasks in one place.',
		url: 'https://maintleyapp.com/',
		image: 'https://maintleyapp.com/icons/icon-512.png',
		keywords:
			'home maintenance tracker, appliance maintenance tracker, home maintenance log, property maintenance history, recurring maintenance reminders',
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'Maintley',
			url: 'https://maintleyapp.com/',
			potentialAction: {
				'@type': 'SearchAction',
				target: 'https://maintleyapp.com/?s={search_term_string}',
				'query-input': 'required name=search_term_string',
			},
		},
	};
	const continuityReasons = [
		{
			title: 'Repairs get forgotten',
			text: 'Small fixes are easy to lose in texts, notes, and calendars. Maintley keeps them in the property history where future you can find them.',
		},
		{
			title: 'Documents get buried',
			text: 'Receipts, warranties, photos, and service notes live together so you can find them when you need them.',
		},
		{
			title: 'Systems need memory',
			text: 'HVAC, equipment, filters, and recurring care should stay with the property itself, not someone’s inbox.',
		},
	];

	const continuityTimeline = [
		{ icon: '🏠', title: 'Home Purchased', meta: 'The beginning of the property story' },
		{ icon: '❄️', title: 'HVAC Installed', meta: 'A major system joins the home history' },
		{ icon: '🛠', title: 'Annual Service Completed', meta: 'Routine care becomes part of the record' },
		{ icon: '📷', title: 'Roof Inspection', meta: 'Photos and notes preserve what was checked' },
		{ icon: '📄', title: 'Warranty Added', meta: 'Coverage details stay easy to find later' },
		{ icon: '🔧', title: 'Capacitor Replaced', meta: 'A repair becomes useful future context' },
		{ icon: '💧', title: 'Water Heater Flushed', meta: 'Maintenance history supports the next reminder' },
		{ icon: '🌿', title: 'Spring Maintenance', meta: 'Seasonal upkeep stays tied to the property' },
	];

	const maintleyLoop = [
		{
			kicker: 'Record',
			title: 'Property Information',
			text: 'Tasks, maintenance, invoices, manuals, photos, and warranties give Maintley the raw details of your property.',
			exampleLabel: 'Sources',
			examples: ['Tasks', 'Maintenance', 'Invoices', 'Manuals', 'Photos', 'Warranties'],
		},
		{
			kicker: 'Remember',
			title: 'Property Memory',
			text: 'Maintley keeps those details connected to the right systems, service history, documents, contractors, parts, and costs.',
			exampleLabel: 'Preserved context',
			examples: ['HVAC', 'Brand', 'Model', 'Install date', 'Contractor', 'Parts', 'History'],
		},
		{
			kicker: 'Understand',
			title: 'Maintley Intelligence',
			text: 'As the memory grows, Maintley can review your records for gaps, patterns, and opportunities worth your attention.',
			exampleLabel: 'Maintley can notice',
			examples: ['Missing warranty', 'Filter size not recorded', 'No maintenance history'],
		},
		{
			kicker: 'Guide',
			title: 'Guidance',
			text: 'That understanding becomes recommendations that help you make better maintenance decisions over time.',
			exampleLabel: 'What improves',
			examples: ['Quick Scan', 'Dashboard recommendations', 'Seasonal reminders', 'Future recommendations'],
		},
	];

	const [formData, setFormData] = useState({
		name: '',
		email: '',
		subject: '',
		message: '',
	});
	const [formStatus, setFormStatus] = useState<
		'idle' | 'sending' | 'success' | 'error'
	>('idle');

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormStatus('sending');

		try {
			// Using a simple mailto approach for now
			const mailtoLink = `mailto:maintleyapp@gmail.com?subject=${encodeURIComponent(
				formData.subject,
			)}&body=${encodeURIComponent(
				`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`,
			)}`;

			window.location.href = mailtoLink;

			setFormStatus('success');
			setFormData({ name: '', email: '', subject: '', message: '' });

			// Reset status after 3 seconds
			setTimeout(() => setFormStatus('idle'), 3000);
		} catch (error) {
			console.error('Error sending message:', error);
			setFormStatus('error');
			setTimeout(() => setFormStatus('idle'), 3000);
		}
	};

	return (
		<>
			{/* Page-specific SEO */}
			<SEO
				title={seo.title}
				description={seo.description}
				url={seo.url}
				image={seo.image}
				keywords={seo.keywords}
				structuredData={seo.structuredData}
			/>
			<LandingNavbar />
			<Wrapper>
				{/* Hero Section */}
				<HeroSection />

				{/* Why Maintley Exists */}
				<WhySection id='Why'>
					<WhySectionInner>
						<WhyTitle>Why Maintley Exists</WhyTitle>
						<WhyIntro>
							Homes build history. Most people lose it. Repairs get forgotten,
							filter sizes disappear, warranties get buried, and contractor notes
							end up scattered across messages and folders.
						</WhyIntro>
						<WhyGrid>
							{continuityReasons.map((item) => (
								<WhyCard key={item.title}>
									<WhyCardTitle>{item.title}</WhyCardTitle>
									<WhyCardText>{item.text}</WhyCardText>
								</WhyCard>
							))}
						</WhyGrid>
						<WhyCallout>
							Every repair, replacement, warranty, and maintenance record tells
							part of your property's story. Maintley keeps that story together,
							so future decisions are backed by your property's history instead
							of guesswork.
						</WhyCallout>
					</WhySectionInner>
				</WhySection>

				{/* Our Story Section */}
				<StorySection id='About'>
					<StoryContent>
						<StoryTitle>How It All Started</StoryTitle>
						<StoryText>
							I bought my first home and learned quickly that maintenance is not
							hard because the work is complicated. It is hard because homes
							accumulate years of information that gradually disappears.
						</StoryText>
						<StoryText>
							Filter sizes are forgotten. Warranties get buried. Service history
							is lost. Every homeowner eventually starts over unless the
							property's knowledge is preserved.
						</StoryText>
						<StoryText>
							I built Maintley so a home's knowledge can stay with the property.
							Every record you save today helps future you make better decisions
							tomorrow.
						</StoryText>
						<StoryText>
							If you own one home, support family properties, or manage rentals,
							Maintley helps you preserve the answers you will wish you had later.
						</StoryText>
					</StoryContent>
				</StorySection>

				{/* Timeline Section */}
				<TimelineSection id='Timeline'>
					<TimelineShell>
						<TimelineHeader>Your Home Has a Story</TimelineHeader>
						<TimelineIntro>
							Every completed task, uploaded document, and service record becomes
							part of your property's history. As that history grows, Maintley
							builds a richer memory of your property, helping future you know
							what happened, when it happened, and what needs attention next.
						</TimelineIntro>
						<TimelineCard>
							<TimelineList>
								{continuityTimeline.map((entry) => (
									<TimelineRow key={entry.title}>
										<TimelineRail />
										<TimelineIcon aria-hidden='true'>{entry.icon}</TimelineIcon>
										<TimelineContent>
											<TimelineTitle>{entry.title}</TimelineTitle>
											<TimelineMeta>{entry.meta}</TimelineMeta>
										</TimelineContent>
									</TimelineRow>
								))}
							</TimelineList>
						</TimelineCard>
					</TimelineShell>
				</TimelineSection>

				{/* Maintley Loop Section */}
				<MemorySection id='MaintleyLoop'>
					<MemoryShell>
						<MemoryHeader>How Maintley Works</MemoryHeader>
						<MemoryIntro>
							Everything you save helps Maintley preserve your property's memory.
							As that memory grows, Maintley Intelligence can better understand
							your records and guide future maintenance decisions.
						</MemoryIntro>
						<MemoryGrid>
							{maintleyLoop.map((stage, index) => (
								<MemoryStageCard key={stage.title}>
									<MemoryStageNumber>{index + 1}</MemoryStageNumber>
									<MemoryStageKicker>{stage.kicker}</MemoryStageKicker>
									<MemoryStageTitle>{stage.title}</MemoryStageTitle>
									<MemoryStageText>{stage.text}</MemoryStageText>
									<MemoryStageExampleLabel>
										{stage.exampleLabel}
									</MemoryStageExampleLabel>
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

				{/* Features Section */}
				<FeaturesSectionComponent />

				{/* Benefits Section */}
				<BenefitsSection id='Benefits'>
					<BenefitRow>
						<BenefitImage>
							<img
								src='/screenshots/desktop_taskhistory.png'
								alt='Maintley maintenance history showing completed property work'
							/>
						</BenefitImage>
						<BenefitContent>
							<BenefitTitle>
								Better Decisions Start With Better Records
							</BenefitTitle>
							<BenefitDescription>
								When each service, replacement, and note is logged in one place,
								future you has answers fast. That clarity lowers stress and helps
								you make better maintenance decisions over time.
							</BenefitDescription>
							<BenefitList>
								<BenefitItem>
									<FontAwesomeIcon className='benefit-icon' icon={faBookOpen} />
									Preserve the property history
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faMagnifyingGlass}
									/>
									Find history instantly when you need it
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faShieldHalved}
									/>
									Confident decisions backed by records
								</BenefitItem>
							</BenefitList>
						</BenefitContent>
					</BenefitRow>

					<BenefitRow $reverse>
						<BenefitImage>
							<img
								src='/screenshots/desktop_documents.png'
								alt='Maintley property documents organized with the home record'
							/>
						</BenefitImage>
						<BenefitContent>
							<BenefitTitle>Your Privacy Matters</BenefitTitle>
							<BenefitDescription>
								Your maintenance history stays with your account and your people.
								Built on secure infrastructure, with privacy-first defaults you
								can trust for long-term records.
							</BenefitDescription>
							<BenefitList>
								<BenefitItem>
									<FontAwesomeIcon className='benefit-icon' icon={faLock} />
									Encrypted data
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faShieldHalved}
									/>
									Secure servers
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faUserShield}
									/>
									Privacy-first design
								</BenefitItem>
							</BenefitList>
						</BenefitContent>
					</BenefitRow>

					<BenefitRow>
						<BenefitImage>
							<img
								src='/screenshots/mobile_tasks.png'
								alt='Maintley maintenance tasks on a mobile phone'
							/>
						</BenefitImage>
						<BenefitContent>
							<BenefitTitle>Keep the Story Updated Anywhere</BenefitTitle>
							<BenefitDescription>
								When work gets done, log it right away from your phone. Add
								photos, close tasks, and keep your timeline current whether you
								are at home, at work, or on the road.
							</BenefitDescription>
							<BenefitList>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faMobileScreenButton}
									/>
									Works on any device
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon className='benefit-icon' icon={faDesktop} />
									Desktop or mobile
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon className='benefit-icon' icon={faGlobe} />
									Always synced
								</BenefitItem>
							</BenefitList>
						</BenefitContent>
					</BenefitRow>

					<BenefitRow>
						<BenefitImage>
							<img
								src='/screenshots/desktop_appliance.png'
								alt='Maintley equipment profile with appliance maintenance details'
							/>
						</BenefitImage>
						<BenefitContent>
							<BenefitTitle>Track the Things That Keep Life Running</BenefitTitle>
							<BenefitDescription>
								From vehicles to tools and equipment, keep service history,
								reminders, and replacement context in one organized system so
								nothing critical slips through.
							</BenefitDescription>
							<BenefitList>
								<BenefitItem>
									<FontAwesomeIcon className='benefit-icon' icon={faCar} />
									Vehicle maintenance tracking
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faScrewdriverWrench}
									/>
									Equipment servicing schedules
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faChartLine}
									/>
									Comprehensive asset overview
								</BenefitItem>
							</BenefitList>
						</BenefitContent>
					</BenefitRow>
				</BenefitsSection>

				{/* Pricing Section */}
				<PricingSectionComponent />

				{/* Contact Us Section */}
				<ContactSection id='Contact'>
					<ContactTitle>Get in Touch</ContactTitle>
					<ContactContent>
						<ContactForm onSubmit={handleSubmit}>
							<FormGroup>
								<FormInput
									type='text'
									name='name'
									placeholder='Your Name'
									value={formData.name}
									onChange={handleInputChange}
									required
								/>
							</FormGroup>
							<FormGroup>
								<FormInput
									type='email'
									name='email'
									placeholder='Your Email'
									value={formData.email}
									onChange={handleInputChange}
									required
								/>
							</FormGroup>
							<FormGroup>
								<FormInput
									type='text'
									name='subject'
									placeholder='Subject'
									value={formData.subject}
									onChange={handleInputChange}
									required
								/>
							</FormGroup>
							<FormGroup>
								<FormTextarea
									name='message'
									placeholder='Your Message'
									rows={5}
									value={formData.message}
									onChange={handleInputChange}
									required
								/>
							</FormGroup>
							<SubmitButton
								type='submit'
								disabled={formStatus === 'sending'}
								aria-label='Send message'>
								{formStatus === 'sending' && 'Sending...'}
								{formStatus === 'success' && '✓ Message Sent!'}
								{formStatus === 'error' && 'Error - Try Again'}
								{formStatus === 'idle' && <FontAwesomeIcon icon={faPaperPlane} />}
							</SubmitButton>{' '}
						</ContactForm>
					</ContactContent>
				</ContactSection>
				{/* CTA Section */}
				<CTASection>
					<CTATitle>Give Future You the Answers You Wish You Had Today</CTATitle>
					<CTADescription>
						Every record you save today helps future you make better decisions
						tomorrow. Start preserving your property's story now.
					</CTADescription>
					<CTAButtons>
						<CTAButton onClick={() => navigate('/register')}>
							Get Started
						</CTAButton>
						<CTASecondary onClick={() => navigate('/login')}>
							Sign In
						</CTASecondary>
					</CTAButtons>
				</CTASection>
				{/* Download Section */}
				<DownloadSection id='Download'>
					<DownloadContainer>
						<DownloadHeading>Use Maintley on Android, iPhone, and iPad</DownloadHeading>
						<DownloadSubtext>
							Get the Android app from Google Play. On iPhone or iPad, open
							Maintley in Safari and choose Add to Home Screen for app-like
							access. You can also use Maintley directly in any supported browser.
						</DownloadSubtext>
						<DownloadButton
							href={androidAppUrl}
							target='_blank'
							rel='noopener noreferrer'>
							<FontAwesomeIcon icon={faMobileScreenButton} /> Get Maintley on
							Google Play
						</DownloadButton>
						<DownloadInfo>
							<InfoItem>
								<strong>Android</strong>
								<span>Available on Google Play</span>
							</InfoItem>
							<InfoItem>
								<strong>iPhone and iPad</strong>
								<span>Add to Home Screen from Safari</span>
							</InfoItem>
							<InfoItem>
								<strong>Web browser</strong>
								<span>{`Use online, Android v${CURRENT_APP_VERSION}`}</span>
							</InfoItem>
						</DownloadInfo>
					</DownloadContainer>
				</DownloadSection>
				{/* Footer */}
				<FooterSection>
					<FooterContent>
						<FooterBrand>
							<h3>Maintley</h3>
							<p>
								A simple way to keep your home, systems, and service history
								useful for the long run.
							</p>
						</FooterBrand>

						<FooterLinks>
							<FooterLink
								onClick={() => {
									document
										.getElementById('About')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								About
							</FooterLink>
							<FooterLink
								onClick={() => {
									document
										.getElementById('MaintleyLoop')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								How It Works
							</FooterLink>
							<FooterLink
								onClick={() => {
									document
										.getElementById('Features')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Feature Highlights
							</FooterLink>
							<FooterLink
								as='a'
								href='/features/'
								onClick={(e) => {
									e.preventDefault();
									window.location.href = '/features/';
								}}>
								Feature Catalog
							</FooterLink>
							<FooterLink
								as='a'
								href='/homeowners/'
								onClick={(e) => {
									e.preventDefault();
									window.location.href = '/homeowners/';
								}}>
								Homeowners
							</FooterLink>
							<FooterLink
								as='a'
								href='/property-managers/'
								onClick={(e) => {
									e.preventDefault();
									window.location.href = '/property-managers/';
								}}>
								Property Owners
							</FooterLink>
							<FooterLink
								as='a'
								href='/pricing/'
								onClick={(e) => {
									e.preventDefault();
									window.location.href = '/pricing/';
								}}>
								Pricing
							</FooterLink>
							<FooterLink
								as='a'
								href='/resources/'
								onClick={(e) => {
									e.preventDefault();
									window.location.href = '/resources/';
								}}>
								Resources
							</FooterLink>
							<FooterLink
								as='a'
								href='/home-maintenance-tracker/'
								onClick={(e) => {
									e.preventDefault();
									window.location.href = '/home-maintenance-tracker/';
								}}>
								Home Maintenance Tracker
							</FooterLink>
							<FooterLink
								as='a'
								href='/appliance-maintenance-tracker/'
								onClick={(e) => {
									e.preventDefault();
									window.location.href = '/appliance-maintenance-tracker/';
								}}>
								Equipment Tracker
							</FooterLink>
							<FooterLink
								as='a'
								href='/home-maintenance-log/'
								onClick={(e) => {
									e.preventDefault();
									window.location.href = '/home-maintenance-log/';
								}}>
								Maintenance Log
							</FooterLink>
							<FooterLink
								onClick={() => {
									document
										.getElementById('Benefits')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Benefits
							</FooterLink>
							<FooterLink
								as='a'
								href='#/help'
								onClick={(e) => {
									e.preventDefault();
									window.location.href = '#/help';
								}}>
								Help Center
							</FooterLink>
							<FooterLink
								onClick={() => {
									document
										.getElementById('Contact')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Contact
							</FooterLink>
							<FooterLink
								onClick={() => {
									document
										.getElementById('Download')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Download
							</FooterLink>
						</FooterLinks>

						<FooterLegalLinks>
							<FooterLegalLink
								as='a'
								href='#/legal'
								onClick={(e) => {
									e.preventDefault();
									handleFooterLink('#/legal');
								}}>
								Legal Hub
							</FooterLegalLink>
							{legalDocuments.map((doc) => (
								<FooterLegalLink
									key={doc.filename}
									as='a'
									href={`#/legal/${doc.filename}`}
									onClick={(e) => {
										e.preventDefault();
										handleFooterLink(`#/legal/${doc.filename}`);
									}}>
									{doc.title}
								</FooterLegalLink>
							))}
						</FooterLegalLinks>
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
