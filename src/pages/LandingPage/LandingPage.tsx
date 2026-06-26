import React, { useState, useEffect, useRef } from 'react';
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
	faDownload,
	faBoxArchive,
	faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { LandingNavbar } from 'Components/Library/LandingNavbar';
import HeroSection from './components/Hero';
import MissionSectionComponent from './components/MissionSection';
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
	OwnershipSection,
	OwnershipShell,
	OwnershipHeader,
	OwnershipIntro,
	OwnershipGrid,
	OwnershipListCard,
	OwnershipList,
	OwnershipListItem,
	OwnershipVisualCard,
	OwnershipDeviceHeader,
	OwnershipDeviceTitle,
	OwnershipDeviceMeta,
	OwnershipDeviceBadge,
	OwnershipEventList,
	OwnershipEventItem,
	OwnershipEventTitle,
	OwnershipEventMeta,
	MemorySection,
	MemoryShell,
	MemoryHeader,
	MemoryIntro,
	MemoryGrid,
	MemoryStageCard,
	MemoryStageNumber,
	MemoryStageTitle,
	MemoryStageText,
	JourneySection,
	JourneyShell,
	JourneyHeader,
	JourneyIntro,
	JourneyGrid,
	JourneyCard,
	JourneyStep,
	JourneyImage,
	JourneyCardBody,
	JourneyCardTitle,
	JourneyCardText,
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

import packageJson from '../../../package.json';
import { getAPKFileSize, getAPKDownloadURL } from '../../utils/versionCheck';
import SEO from 'Components/SEO/SEO';
import { legalDocuments } from '../LegalPage/legalDocuments';

const formatBytes = (bytes: number) => {
	var marker = 1024;
	var decimal = 2;
	var kiloBytes = marker;
	var megaBytes = marker * marker;

	if (bytes < kiloBytes) return bytes + ' Bytes';
	else if (bytes < megaBytes)
		return (bytes / kiloBytes).toFixed(decimal) + ' KB';
	else return (bytes / megaBytes).toFixed(decimal) + ' MB';
};

const LandingPageComponent = () => {
	const navigate = useNavigate();
	const apkDownloadUrl = getAPKDownloadURL();
	const handleFooterLink = (href: string) => {
		window.location.href = href;
	};

	// SEO — important for public landing page (site-wide defaults are in public/index.html)
	const seo = {
		title: 'Maintley - Home Maintenance History That Helps Future You',
		description:
			'Maintley preserves your property history so every maintenance record, warranty, document, and repair helps future you make better decisions.',
		url: 'https://maintleyapp.com/',
		image: `${window.location.origin}/Favicon.png`,
		keywords:
			'home maintenance history, property records, recurring maintenance, appliance service history, property memory',
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
	// Use previous version (1.7.3) for the versioned APK download
	const previousVersion = '1.7.3';
	const versionedApkDownloadUrl = `https://github.com/DoberCodes/propertyManagerWebApp/releases/download/v${previousVersion}/app-release.apk`;
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
			text: 'HVAC, appliances, filters, and recurring care should stay with the property itself, not someone’s inbox.',
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

	const ownershipMemoryItems = [
		'Future you knows exactly when the HVAC was last serviced.',
		'Never wonder which filter size you bought last time.',
		'Keep appliance warranties with the right system.',
		'See replacement history without digging through receipts.',
		'Find contractor notes and service photos years later.',
	];

	const deviceHistoryEvents = [
		{ title: 'Filter size logged', meta: '16x25x1 • changed every 3 months' },
		{ title: 'Seasonal service completed', meta: 'Logged with technician notes and invoice' },
		{ title: 'Capacitor replaced', meta: 'Part linked to the appliance history' },
		{ title: 'Next service scheduled', meta: 'Recurring reminder set for early spring' },
	];

	const memoryProgression = [
		{
			title: 'Record',
			text: 'Capture maintenance, documents, warranties, parts, and service history as work happens.',
		},
		{
			title: 'Remember',
			text: 'Your property history stays with the property, not scattered across emails, folders, calendars, or memory.',
		},
		{
			title: 'Understand',
			text: 'Your property history begins telling a story. Maintley recognizes recurring maintenance, missing information, and emerging patterns before they become problems.',
		},
		{
			title: 'Guide',
			text: 'Maintley Intelligence turns years of property history into recommendations that help you make better maintenance decisions.',
		},
	];

	const screenshotJourney = [
		{
			step: 'Step 1',
			title: 'Capture the Work as It Happens',
			text: 'Log the task, attach photos, and leave notes while details are still fresh.',
			image: '/screenshots/taskpage.png',
			alt: 'Task history screen showing maintenance records',
		},
		{
			step: 'Step 2',
			title: 'Link It to the Right System',
			text: 'Tie service events, parts, and reminders to appliances so context stays with the home.',
			image: '/screenshots/devicemanagement.png',
			alt: 'Appliance management screen with linked maintenance details',
		},
		{
			step: 'Step 3',
			title: 'Recover Answers in Seconds',
			text: 'Open property details later and see the full timeline without digging through old files.',
			image: '/screenshots/propertyDetails.png',
			alt: 'Property details screen with timeline and service history',
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

	const [apkFileSize, setApkFileSize] = useState('Unknown');
	const [versionedApkFileSize, setVersionedApkFileSize] = useState('Unknown');
	const [isJourneyVisible, setIsJourneyVisible] = useState(false);
	const journeySectionRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		const fetchFileSizesAndVersionInfo = async () => {
			try {
				// Fetch latest release info
				const releaseResponse = await fetch(
					'https://api.github.com/repos/DoberCodes/propertyManagerWebApp/releases/latest',
				);
				if (releaseResponse.ok) {
					const release = await releaseResponse.json();
					// Get file sizes for both APKs
					const assets = release.assets || [];
					const latestApk = assets.find(
						(asset) =>
							asset.label === 'PropertyManager.apk' ||
							asset.name === 'PropertyManager.apk',
					);

					// For versioned APK, fetch the previous version release
					const previousReleaseResponse = await fetch(
						`https://api.github.com/repos/DoberCodes/propertyManagerWebApp/releases/tags/v${previousVersion}`,
					);
					let versionedApkSize = null;
					if (previousReleaseResponse.ok) {
						const previousRelease = await previousReleaseResponse.json();
						const previousAssets = previousRelease.assets || [];
						const versionedApk = previousAssets.find(
							(asset) =>
								asset.label === `PropertyManager-${previousVersion}.apk` ||
								asset.name === `PropertyManager-${previousVersion}.apk` ||
								asset.name === 'app-release.apk',
						);
						if (versionedApk?.size) {
							versionedApkSize = versionedApk.size;
						}
					}

					if (latestApk?.size) {
						setApkFileSize(formatBytes(latestApk.size));
					}
					if (versionedApkSize) {
						setVersionedApkFileSize(formatBytes(versionedApkSize));
					}
				}
			} catch (error) {
				console.warn('Error fetching version info:', error);
				// Fallback to basic file size fetching
				const size = await getAPKFileSize();
				setApkFileSize(size);
				setVersionedApkFileSize(size);
			}
		};
		fetchFileSizesAndVersionInfo();
	}, []);

	useEffect(() => {
		const section = journeySectionRef.current;
		if (!section) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setIsJourneyVisible(true);
						observer.disconnect();
					}
				});
			},
			{ threshold: 0.2 },
		);

		observer.observe(section);

		return () => observer.disconnect();
	}, []);

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

				{/* Mission Section */}
				<MissionSectionComponent />

				{/* Timeline Section */}
				<TimelineSection id='Timeline'>
					<TimelineShell>
						<TimelineHeader>Your Home Has a Story</TimelineHeader>
						<TimelineIntro>
							Every completed task, uploaded document, and service record becomes
							part of your property's memory. That growing history helps future
							you know what happened, when it happened, and what needs attention
							next.
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

				{/* Memory Progression Section */}
				<MemorySection id='PropertyMemory'>
					<MemoryShell>
						<MemoryHeader>The More Your Property Remembers, The More Maintley Can Help</MemoryHeader>
						<MemoryIntro>
							On day one, Maintley helps you organize your records. As your
							property's history grows, Maintley begins recognizing patterns,
							identifying missing information, and surfacing useful
							recommendations.
						</MemoryIntro>
						<MemoryGrid>
							{memoryProgression.map((stage, index) => (
								<MemoryStageCard key={stage.title}>
									<MemoryStageNumber>{index + 1}</MemoryStageNumber>
									<MemoryStageTitle>{stage.title}</MemoryStageTitle>
									<MemoryStageText>{stage.text}</MemoryStageText>
								</MemoryStageCard>
							))}
						</MemoryGrid>
					</MemoryShell>
				</MemorySection>

				{/* Ownership Memory Section */}
				<OwnershipSection id='OwnershipMemory'>
					<OwnershipShell>
						<OwnershipHeader>
							Give Your Property a Memory
						</OwnershipHeader>
						<OwnershipIntro>
							Every maintenance record, warranty, document, and repair becomes
							part of a living history that helps future you make better
							decisions.
						</OwnershipIntro>
						<OwnershipGrid>
							<OwnershipListCard>
								<OwnershipList>
									{ownershipMemoryItems.map((item) => (
										<OwnershipListItem key={item}>{item}</OwnershipListItem>
									))}
								</OwnershipList>
							</OwnershipListCard>
							<OwnershipVisualCard>
								<OwnershipDeviceHeader>
									<div>
										<OwnershipDeviceTitle>HVAC System Memory</OwnershipDeviceTitle>
										<OwnershipDeviceMeta>
											Model linked • Documents attached • Recurring care active
										</OwnershipDeviceMeta>
									</div>
									<OwnershipDeviceBadge>System Record</OwnershipDeviceBadge>
								</OwnershipDeviceHeader>
								<OwnershipEventList>
									{deviceHistoryEvents.map((event) => (
										<OwnershipEventItem key={event.title}>
											<OwnershipEventTitle>{event.title}</OwnershipEventTitle>
											<OwnershipEventMeta>{event.meta}</OwnershipEventMeta>
										</OwnershipEventItem>
									))}
								</OwnershipEventList>
							</OwnershipVisualCard>
						</OwnershipGrid>
					</OwnershipShell>
				</OwnershipSection>

				{/* Features Section */}
				<FeaturesSectionComponent />

				{/* Screenshot Journey Section */}
				<JourneySection id='Journey' ref={journeySectionRef}>
					<JourneyShell>
						<JourneyHeader>Three Screens. One Long-Term Record.</JourneyHeader>
						<JourneyIntro>
							From first log to long-term history, this is how Maintley turns
							everyday maintenance into reliable knowledge you can trust later.
						</JourneyIntro>
						<JourneyGrid>
							{screenshotJourney.map((item) => (
								<JourneyCard key={item.title} $visible={isJourneyVisible}>
									<JourneyImage src={item.image} alt={item.alt} />
									<JourneyCardBody>
										<JourneyStep>{item.step}</JourneyStep>
										<JourneyCardTitle>{item.title}</JourneyCardTitle>
										<JourneyCardText>{item.text}</JourneyCardText>
									</JourneyCardBody>
								</JourneyCard>
							))}
						</JourneyGrid>
					</JourneyShell>
				</JourneySection>

				{/* Benefits Section */}
				<BenefitsSection id='Benefits'>
					<BenefitRow>
						<BenefitImage>
							<img
								src={require('../../Assets/images/cabin_woods.jpg')}
								alt='Time efficiency'
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
								src={require('../../Assets/images/privacy.jpg')}
								alt='Data security'
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
								src={require('../../Assets/images/camper in the woods.jpg')}
								alt='Mobile access'
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
								src={require('../../Assets/images/more than property.jpg')}
								alt='Equipment management'
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
						<DownloadHeading>Download the App</DownloadHeading>
						<DownloadSubtext>
							Install Maintley and start preserving your maintenance history today.
							Log work, attach records, and keep your home timeline organized.
							Available on Android.
						</DownloadSubtext>
						<DownloadButton href={apkDownloadUrl} download>
							<FontAwesomeIcon icon={faDownload} /> Download Latest APK (
							{apkFileSize})
						</DownloadButton>
						<DownloadButton href={versionedApkDownloadUrl} download>
							<FontAwesomeIcon icon={faBoxArchive} /> Download v
							{previousVersion} APK ({versionedApkFileSize})
						</DownloadButton>
						<DownloadInfo>
							<InfoItem>
								<strong>File Size</strong>
								<span>{apkFileSize}</span>
							</InfoItem>
							<InfoItem>
								<strong>Android Version</strong>
								<span>8.0 and above</span>
							</InfoItem>
							<InfoItem>
								<strong>Version</strong>
								<span>{`${packageJson.version} (latest)`}</span>
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
										.getElementById('Mission')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Mission
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
								href='#/features'
								onClick={(e) => {
									e.preventDefault();
									window.location.href = '#/features';
								}}>
								Feature Catalog
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
