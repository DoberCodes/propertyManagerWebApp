import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingNavbar } from '../../Components/Library/LandingNavbar';
import {
	Wrapper,
	Hero,
	HeroContent,
	HeroTitle,
	HeroSubtitle,
	HeroCTA,
	HeroImage,
	StorySection,
	StoryContent,
	StoryTitle,
	StoryText,
	MissionSection,
	MissionTitle,
	MissionContent,
	MissionCard,
	MissionCardIcon,
	MissionCardTitle,
	MissionCardDescription,
	FeaturesSection,
	FeaturesTitle,
	FeaturesGrid,
	FeatureCard,
	FeatureIcon,
	FeatureTitle,
	FeatureDescription,
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
	FooterLinks,
	FooterLink,
	DownloadSection,
	DownloadContainer,
	DownloadHeading,
	DownloadSubtext,
	DownloadButton,
	DownloadInfo,
	InfoItem,
	FooterCopyright,
} from './LandingPage.styles';

const LandingPageComponent = () => {
	const navigate = useNavigate();
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
			const mailtoLink = `mailto:contact@mypropertymanager.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
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
			<LandingNavbar />
			<Wrapper>
				{/* Hero Section */}
				<Hero>
					<HeroContent>
						<HeroTitle>Your Maintenance, Simplified</HeroTitle>
						<HeroSubtitle>
							Whether you own one rental or manage a small portfolio, keeping
							track of maintenance shouldn't feel like a second job. We help
							homeowners and small landlords stay on top of it all—the simple
							way.
						</HeroSubtitle>
						<HeroCTA onClick={() => navigate('/register')}>
							Get Started Free
						</HeroCTA>
					</HeroContent>
					<HeroImage>
						<img
							src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop'
							alt='Property management dashboard'
						/>
					</HeroImage>
				</Hero>

				{/* Our Story Section */}
				<StorySection id='About'>
					<StoryContent>
						<StoryTitle>How It All Started</StoryTitle>
						<StoryText>
							One of our founders was managing their parents' rental property
							when a pipe burst. Between texts, emails, photos sent through
							different apps, and a spreadsheet that was never
							updated—everything fell apart. There had to be a better way.
						</StoryText>
						<StoryText>
							We built the tool we wished existed: a simple, straightforward
							place to track maintenance, keep everyone in the loop, and
							actually know what's happening with your property. No complicated
							workflows. No unnecessary features. Just what you need.
						</StoryText>
						<StoryText>
							Now, homeowners and small landlords like you are using it to
							manage their properties stress-free. We're just getting started,
							and we're building this with you in mind.
						</StoryText>
					</StoryContent>
				</StorySection>

				{/* Our Mission Section */}
				<MissionSection id='Mission'>
					<MissionTitle>Why We're Different</MissionTitle>
					<MissionContent>
						<MissionCard>
							<MissionCardIcon>🎯</MissionCardIcon>
							<MissionCardTitle>Built for You</MissionCardTitle>
							<MissionCardDescription>
								We get it. You're managing everything yourself or with a small
								team. No bloat, no overwhelming features.
							</MissionCardDescription>
						</MissionCard>
						<MissionCard>
							<MissionCardIcon>⚡</MissionCardIcon>
							<MissionCardTitle>Quick to Set Up</MissionCardTitle>
							<MissionCardDescription>
								Get started in minutes. Invite your tenants or contractors.
								Done. No training needed.
							</MissionCardDescription>
						</MissionCard>
						<MissionCard>
							<MissionCardIcon>💰</MissionCardIcon>
							<MissionCardTitle>Affordable</MissionCardTitle>
							<MissionCardDescription>
								No enterprise pricing schemes. Fair rates for individuals and
								small landlords.
							</MissionCardDescription>
						</MissionCard>
						<MissionCard>
							<MissionCardIcon>🛡️</MissionCardIcon>
							<MissionCardTitle>Secure & Private</MissionCardTitle>
							<MissionCardDescription>
								Your property details stay private. Built on secure, trusted
								infrastructure.
							</MissionCardDescription>
						</MissionCard>
					</MissionContent>
				</MissionSection>

				{/* Features Section */}
				<FeaturesSection id='Features'>
					<FeaturesTitle>Everything You Need</FeaturesTitle>
					<FeaturesGrid>
						<FeatureCard>
							<FeatureIcon>🔧</FeatureIcon>
							<FeatureTitle>Simple Maintenance Tracking</FeatureTitle>
							<FeatureDescription>
								Log repairs and maintenance issues in seconds. See what needs to
								be done at a glance.
							</FeatureDescription>
						</FeatureCard>

						<FeatureCard>
							<FeatureIcon>📸</FeatureIcon>
							<FeatureTitle>Photo Documentation</FeatureTitle>
							<FeatureDescription>
								Attach photos to maintenance requests. Keep a visual history of
								repairs and updates.
							</FeatureDescription>
						</FeatureCard>

						<FeatureCard>
							<FeatureIcon>👥</FeatureIcon>
							<FeatureTitle>Invite Tenants & Contractors</FeatureTitle>
							<FeatureDescription>
								Let tenants report issues. Contractors can update progress.
								Everyone stays in sync.
							</FeatureDescription>
						</FeatureCard>

						<FeatureCard>
							<FeatureIcon>📋</FeatureIcon>
							<FeatureTitle>Request Priority & Status</FeatureTitle>
							<FeatureDescription>
								Mark urgent vs. routine. Track what's pending, in progress, or
								complete.
							</FeatureDescription>
						</FeatureCard>

						<FeatureCard>
							<FeatureIcon>📱</FeatureIcon>
							<FeatureTitle>Works Everywhere</FeatureTitle>
							<FeatureDescription>
								Desktop, tablet, or phone. Manage your property from anywhere,
								anytime.
							</FeatureDescription>
						</FeatureCard>

						<FeatureCard>
							<FeatureIcon>💬</FeatureIcon>
							<FeatureTitle>Built-in Messaging</FeatureTitle>
							<FeatureDescription>
								No more scattered texts and emails. Communicate right where the
								work happens.
							</FeatureDescription>
						</FeatureCard>
					</FeaturesGrid>
				</FeaturesSection>

				{/* Benefits Section */}
				<BenefitsSection id='Benefits'>
					<BenefitRow>
						<BenefitImage>
							<img
								src='https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=400&fit=crop'
								alt='Time efficiency'
							/>
						</BenefitImage>
						<BenefitContent>
							<BenefitTitle>Finally, Peace of Mind</BenefitTitle>
							<BenefitDescription>
								Never miss a maintenance issue again. No more wondering if you
								told the contractor about that leak. Everything's in one place.
							</BenefitDescription>
							<BenefitList>
								<BenefitItem>⏰ Never forget a task</BenefitItem>
								<BenefitItem>📝 Keep detailed records</BenefitItem>
								<BenefitItem>✓ Know what's been done</BenefitItem>
							</BenefitList>
						</BenefitContent>
					</BenefitRow>

					<BenefitRow reverse>
						<BenefitImage>
							<img
								src='https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=400&fit=crop'
								alt='Data security'
							/>
						</BenefitImage>
						<BenefitContent>
							<BenefitTitle>Your Privacy Matters</BenefitTitle>
							<BenefitDescription>
								We don't share your info with anyone. Your property details stay
								between you and your team. Built on secure, trusted
								infrastructure.
							</BenefitDescription>
							<BenefitList>
								<BenefitItem>🔒 Encrypted data</BenefitItem>
								<BenefitItem>🛡️ Secure servers</BenefitItem>
								<BenefitItem>👤 Privacy-first design</BenefitItem>
							</BenefitList>
						</BenefitContent>
					</BenefitRow>

					<BenefitRow>
						<BenefitImage>
							<img
								src='https://images.unsplash.com/photo-1516321318423-f06f70504504?w=500&h=400&fit=crop'
								alt='Mobile access'
							/>
						</BenefitImage>
						<BenefitContent>
							<BenefitTitle>Check In Anytime, Anywhere</BenefitTitle>
							<BenefitDescription>
								On your way home? Check the status of a repair. At the office?
								Upload photos from the contractor. Your phone is your access
								key.
							</BenefitDescription>
							<BenefitList>
								<BenefitItem>📱 Works on any device</BenefitItem>
								<BenefitItem>💻 Desktop or mobile</BenefitItem>
								<BenefitItem>🌐 Always synced</BenefitItem>
							</BenefitList>
						</BenefitContent>
					</BenefitRow>
				</BenefitsSection>

				{/* Contact Us Section */}
				<ContactSection id='Contact'>
					<ContactTitle>Get In Touch</ContactTitle>
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
							<SubmitButton type='submit' disabled={formStatus === 'sending'}>
								{formStatus === 'sending' && 'Sending...'}
								{formStatus === 'success' && '✓ Message Sent!'}
								{formStatus === 'error' && 'Error - Try Again'}
								{formStatus === 'idle' && 'Send Message'}
							</SubmitButton>{' '}
						</ContactForm>
					</ContactContent>
				</ContactSection>
				{/* CTA Section */}
				<CTASection id='GetStarted'>
					<CTATitle>Stop Juggling Maintenance in Your Head</CTATitle>
					<CTADescription>
						Join homeowners and small landlords who are keeping their properties
						in great shape—without the stress. Start tracking maintenance today.
					</CTADescription>
					<CTAButtons>
						<CTAButton onClick={() => navigate('/register')}>
							Start Free Trial
						</CTAButton>
						<CTASecondary onClick={() => navigate('/login')}>
							Sign In
						</CTASecondary>
					</CTAButtons>
				</CTASection>
				{/* Download Section */}
				<DownloadSection id='Download'>
					<DownloadContainer>
						<DownloadHeading>Get Started Today</DownloadHeading>
						<DownloadSubtext>
							Download the app and start managing your property maintenance with
							ease. No credit card required. Free to use.
						</DownloadSubtext>
						<DownloadButton
							href='/propertyManagerWebApp/PropertyManager.apk'
							download>
							📱 Download APK
						</DownloadButton>
						<DownloadInfo>
							<InfoItem>
								<strong>File Size</strong>
								<span>6.4 MB</span>
							</InfoItem>
							<InfoItem>
								<strong>Android Version</strong>
								<span>8.0 and above</span>
							</InfoItem>
							<InfoItem>
								<strong>Version</strong>
								<span>1.0 (Beta)</span>
							</InfoItem>
						</DownloadInfo>
					</DownloadContainer>
				</DownloadSection>
				{/* Footer */}
				<FooterSection>
					<FooterContent>
						<div>
							<h3>My Property Manager</h3>
							<p>
								Maintenance tracking made simple for homeowners and small
								landlords.
							</p>
						</div>
						<FooterLinks>
							<FooterLink
								onClick={() => {
									document
										.getElementById('About')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Our Story
							</FooterLink>
							<FooterLink
								onClick={() => {
									document
										.getElementById('Mission')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Why Us
							</FooterLink>
							<FooterLink
								onClick={() => {
									document
										.getElementById('Features')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Features
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
								onClick={() => {
									document
										.getElementById('Contact')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Get in Touch
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
					</FooterContent>
					<FooterCopyright>
						&copy; 2026 My Property Manager. Built with ❤️ for property owners
						everywhere.
					</FooterCopyright>
				</FooterSection>
			</Wrapper>
		</>
	);
};

export default LandingPageComponent;
