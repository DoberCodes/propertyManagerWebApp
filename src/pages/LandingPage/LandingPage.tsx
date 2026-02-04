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
	VersionStatus,
	FooterCopyright,
} from './LandingPage.styles';

import packageJson from '../../../package.json';
import { getAPKFileSize, getAPKDownloadURL } from '../../utils/versionCheck';

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
	// Use previous version (1.7.3) for the versioned APK download
	const previousVersion = '1.7.3';
	const versionedApkDownloadUrl = `https://github.com/DoberCodes/propertyManagerWebApp/releases/download/v${previousVersion}/PropertyManager-${previousVersion}.apk`;
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
	const [isCurrentVersionLatest, setIsCurrentVersionLatest] = useState(true);

	useEffect(() => {
		const fetchFileSizesAndVersionInfo = async () => {
			try {
				// Fetch latest release info
				const releaseResponse = await fetch(
					'https://api.github.com/repos/DoberCodes/propertyManagerWebApp/releases/latest',
				);
				if (releaseResponse.ok) {
					const release = await releaseResponse.json();
					const latestVersion = release.tag_name.replace('v', '');
					setIsCurrentVersionLatest(latestVersion === packageJson.version);

					// Get file sizes for both APKs
					const assets = release.assets || [];
					const latestApk = assets.find(
						(asset) => asset.name === 'PropertyManager.apk',
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
								asset.name === `PropertyManager-${previousVersion}.apk`,
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
								Never miss a maintenance issue again. No more second-guessing
								whether you told the contractor about that leak. Everything’s
								organized, documented, and right where you need it — so you can
								relax knowing nothing slips through the cracks.
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
								Privacy you don’t have to think about. Your property data is
								never shared and always stays within your team. Built on secure,
								reliable infrastructure you can trust.
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
								Life doesn’t stop — and neither should updates. Check a repair,
								upload photos, and stay connected from anywhere. Your phone
								keeps everything close at hand.
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
								From the truck in the driveway to the mower in the shed, we help
								you keep track of the things you rely on. Maintenance reminders,
								service history, and asset details — all in one place.
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
					<CTATitle>Keep everything in one simple place.</CTATitle>
					<CTADescription>
						Take care of what you own — without the hassle. Join homeowners,
						landlords, and DIYers who track maintenance in one place and enjoy
						peace of mind every day.
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
							Get started with maintenance that feels manageable. Keep track of
							your property, vehicles, and equipment without the stress.
							Available on Android — download and get settled in.
						</DownloadSubtext>
						<DownloadButton href={apkDownloadUrl} download>
							📱 Download Latest APK ({apkFileSize})
						</DownloadButton>
						<DownloadButton href={versionedApkDownloadUrl} download>
							📦 Download v{previousVersion} APK ({versionedApkFileSize})
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
						<div>
							<h3>My Property Manager</h3>
							<p>
								Simple, friendly maintenance tracking for homeowners, small
								landlords, and folks who like to take care of their own.
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
