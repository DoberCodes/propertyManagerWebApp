import { FormGroup } from '../../Components/Library';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingNavbar } from '../../Components/Library/LandingNavbar';
import HeroSection from './components/Hero';
import MissionSectionComponent from './components/MissionSection';
import FeaturesSectionComponent from './components/FeaturesSection';
import {
	Wrapper,
	StorySection,
	StoryContent,
	StoryTitle,
	StoryText,
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

import packageJson from '../../../package.json';
import { getAPKFileSize, getAPKDownloadURL } from '../../utils/versionCheck';

const LandingPageComponent = () => {
	const navigate = useNavigate();
	const apkDownloadUrl = getAPKDownloadURL();
	const versionedApkDownloadUrl = `https://github.com/DoberCodes/propertyManagerWebApp/releases/latest/download/PropertyManager-${packageJson.version}.apk`;
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

	useEffect(() => {
		const fetchFileSize = async () => {
			const size = await getAPKFileSize();
			setApkFileSize(size);
		};
		fetchFileSize();
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
				<HeroSection />

				{/* Our Story Section */}
				<StorySection id='About'>
					<StoryContent>
						<StoryTitle>How It All Started</StoryTitle>
						<StoryText>
							We’re a small-town company built on a simple idea: the people who
							do the most don’t always have the biggest budgets—and they deserve
							better tools.
						</StoryText>
						<StoryText>
							Our founder saw firsthand how local homeowners, small landlords,
							and hands-on business owners were stretched thin, juggling
							repairs, maintenance, and responsibilities with little help. So we
							set out to create something different—solutions that feel like a
							helping hand, not another expense.
						</StoryText>
						<StoryText>
							We focus on keeping things simple, affordable, and genuinely
							useful. No fluff. No over complication. Just tools that bring
							peace of mind and help you stay on top of what matters.
						</StoryText>
						<StoryText>
							Today, homeowners, small landlords, DIYers, and even vehicle and
							equipment owners use our platform to manage what they own—without
							the stress. From tracking property tasks to remembering vehicle
							maintenance or keeping your lawn equipment in shape, everything
							lives in one easy place.
						</StoryText>
						<StoryText>
							Whether you’re managing a rental, taking care of your family car,
							or making sure your tools are ready for the next job, we’re here
							to make life a little easier—one task, one reminder, one win at a
							time.
						</StoryText>
						<StoryText>
							And we’re not done. We’re constantly improving, listening, and
							building alongside the people who use our platform—because this
							was made for you.
						</StoryText>
					</StoryContent>
				</StorySection>

				{/* Mission Section */}
				<MissionSectionComponent />

				{/* Features Section */}
				<FeaturesSectionComponent />

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
								src={require('../../Assets/images/privacy.jpg')}
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
								src={require('../../Assets/images/camper in the woods.jpg')}
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

					<BenefitRow>
						<BenefitImage>
							<img
								src={require('../../Assets/images/more than property.jpg')}
								alt='Equipment management'
							/>
						</BenefitImage>
						<BenefitContent>
							<BenefitTitle>Manage More Than Properties</BenefitTitle>
							<BenefitDescription>
								From vehicles to lawn equipment, our platform is evolving to
								help you keep track of all your assets. Maintenance reminders,
								service logs, and more are on the way.
							</BenefitDescription>
							<BenefitList>
								<BenefitItem>🚗 Vehicle maintenance tracking</BenefitItem>
								<BenefitItem>🛠️ Equipment servicing schedules</BenefitItem>
								<BenefitItem>📊 Comprehensive asset overview</BenefitItem>
							</BenefitList>
						</BenefitContent>
					</BenefitRow>
				</BenefitsSection>

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
				<CTASection>
					<CTATitle>Stop Juggling Maintenance in Your Head</CTATitle>
					<CTADescription>
						Join our growing community of homeowners, small landlords, DIYers,
						and vehicle or equipment owners who are keeping their assets in
						tip-top shape—without the hassle. Start tracking maintenance today
						and enjoy peace of mind.
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
						<DownloadHeading>Download the App</DownloadHeading>
						<DownloadSubtext>
							Get started with our app and make managing your property, vehicle,
							and equipment maintenance a breeze. Available for Android
							devices—download now and see the difference!
						</DownloadSubtext>
						<DownloadButton href={apkDownloadUrl} download>
							📱 Download APK (Latest)
						</DownloadButton>
						<DownloadButton href={versionedApkDownloadUrl} download>
							📦 Download APK v{packageJson.version}
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
								<span>{packageJson.version}</span>
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
								Simple, friendly maintenance tracking for homeowners, small
								landlords, and asset owners like you.
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
