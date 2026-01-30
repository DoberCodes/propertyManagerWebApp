import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const Wrapper = styled.div`
	overflow-x: hidden;
	width: 100%;
	background-color: ${COLORS.bgWhite};
	margin-top: 80px;

	@media (max-width: 768px) {
		margin-top: 70px;
	}

	@media (max-width: 480px) {
		margin-top: 140px;
	}
`;

/* ============ HERO SECTION ============ */

export const Hero = styled.section`
	width: 100%;
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 60px;
	padding: 160px 40px 80px 40px;
	background: linear-gradient(
		135deg,
		${COLORS.bgLight} 0%,
		${COLORS.bgWhite} 100%
	);
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -10%;
		width: 600px;
		height: 600px;
		background: ${COLORS.gradientPrimary};
		border-radius: 50%;
		opacity: 0.1;
		z-index: 0;
	}

	@media (max-width: 1024px) {
		flex-direction: column;
		gap: 40px;
		padding: 140px 30px 60px 30px;
	}

	@media (max-width: 768px) {
		padding: 120px 20px 40px 20px;
		min-height: auto;
		gap: 30px;
	}

	@media (max-width: 480px) {
		padding: 180px 16px 30px 16px;
	}
`;

export const HeroContent = styled.div`
	flex: 1;
	max-width: 600px;
	z-index: 2;
	animation: slideInLeft 0.8s ease-out;

	@keyframes slideInLeft {
		from {
			opacity: 0;
			transform: translateX(-30px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@media (max-width: 768px) {
		max-width: 100%;
	}
`;

export const HeroTitle = styled.h1`
	font-size: 56px;
	font-weight: 800;
	line-height: 1.2;
	margin: 0 0 20px 0;
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	letter-spacing: -0.5px;

	@media (max-width: 768px) {
		font-size: 40px;
	}

	@media (max-width: 480px) {
		font-size: 28px;
	}
`;

export const HeroSubtitle = styled.p`
	font-size: 18px;
	line-height: 1.6;
	color: ${COLORS.textSecondary};
	margin: 0 0 30px 0;
	font-weight: 400;

	@media (max-width: 768px) {
		font-size: 16px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
	}
`;

export const HeroCTA = styled.button`
	padding: 16px 40px;
	font-size: 18px;
	font-weight: 600;
	border: none;
	border-radius: 8px;
	background: ${COLORS.gradientPrimary};
	color: white;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
	display: inline-block;

	&:hover {
		background: linear-gradient(
			135deg,
			${COLORS.primaryDark} 0%,
			${COLORS.primaryDarker} 100%
		);
		box-shadow: 0 15px 40px rgba(16, 185, 129, 0.4);
		transform: translateY(-3px);
	}

	&:active {
		transform: translateY(-1px);
	}

	@media (max-width: 768px) {
		padding: 14px 32px;
		font-size: 16px;
	}

	@media (max-width: 480px) {
		padding: 12px 24px;
		font-size: 14px;
		width: 100%;
	}
`;

export const HeroImage = styled.div`
	flex: 1;
	max-width: 500px;
	animation: slideInRight 0.8s ease-out;

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(30px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	img {
		width: 100%;
		height: auto;
		border-radius: 12px;
		box-shadow: ${COLORS.shadowXl};
		object-fit: cover;
	}

	@media (max-width: 1024px) {
		max-width: 400px;
	}

	@media (max-width: 768px) {
		max-width: 100%;
	}
`;

/* ============ OUR STORY SECTION ============ */

export const StorySection = styled.section`
	width: 100%;
	padding: 100px 40px;
	background-color: ${COLORS.bgWhite};
	position: relative;

	@media (max-width: 768px) {
		padding: 60px 20px;
	}

	@media (max-width: 480px) {
		padding: 40px 16px;
	}
`;

export const StoryContent = styled.div`
	max-width: 800px;
	margin: 0 auto;
`;

export const StoryTitle = styled.h2`
	font-size: 48px;
	font-weight: 800;
	text-align: center;
	margin: 0 0 50px 0;
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;

	@media (max-width: 768px) {
		font-size: 36px;
		margin-bottom: 40px;
	}

	@media (max-width: 480px) {
		font-size: 28px;
		margin-bottom: 30px;
	}
`;

export const StoryText = styled.p`
	font-size: 16px;
	line-height: 1.8;
	color: ${COLORS.textSecondary};
	margin: 0 0 24px 0;
	text-align: center;

	&:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 768px) {
		font-size: 15px;
		margin-bottom: 20px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		margin-bottom: 16px;
	}
`;

/* ============ OUR MISSION SECTION ============ */

export const MissionSection = styled.section`
	width: 100%;
	padding: 100px 40px;
	background-color: ${COLORS.bgLight};
	position: relative;

	@media (max-width: 768px) {
		padding: 60px 20px;
	}

	@media (max-width: 480px) {
		padding: 40px 16px;
	}
`;

export const MissionTitle = styled.h2`
	font-size: 48px;
	font-weight: 800;
	text-align: center;
	margin: 0 0 60px 0;
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;

	@media (max-width: 768px) {
		font-size: 36px;
		margin-bottom: 40px;
	}

	@media (max-width: 480px) {
		font-size: 28px;
		margin-bottom: 30px;
	}
`;

export const MissionContent = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 30px;
	max-width: 1200px;
	margin: 0 auto;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, 1fr);
		gap: 25px;
	}

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 20px;
	}
`;

export const MissionCard = styled.div`
	padding: 32px 24px;
	background: ${COLORS.bgWhite};
	border: 1.5px solid ${COLORS.gray100};
	border-radius: 12px;
	box-shadow: ${COLORS.shadow};
	text-align: center;
	transition: all 0.3s ease;

	&:hover {
		border-color: ${COLORS.primary};
		box-shadow: ${COLORS.shadowLg};
		transform: translateY(-5px);
	}

	@media (max-width: 768px) {
		padding: 24px 20px;
	}
`;

export const MissionCardIcon = styled.div`
	font-size: 48px;
	margin-bottom: 16px;
	display: block;
`;

export const MissionCardTitle = styled.h3`
	font-size: 20px;
	font-weight: 700;
	margin: 0 0 12px 0;
	color: ${COLORS.textPrimary};

	@media (max-width: 768px) {
		font-size: 18px;
	}
`;

export const MissionCardDescription = styled.p`
	font-size: 15px;
	line-height: 1.6;
	color: ${COLORS.textSecondary};
	margin: 0;

	@media (max-width: 768px) {
		font-size: 14px;
	}
`;

/* ============ FEATURES SECTION ============ */

export const FeaturesSection = styled.section`
	width: 100%;
	padding: 100px 40px;
	background-color: ${COLORS.bgWhite};
	position: relative;

	@media (max-width: 768px) {
		padding: 60px 20px;
	}

	@media (max-width: 480px) {
		padding: 40px 16px;
	}
`;

export const FeaturesTitle = styled.h2`
	font-size: 48px;
	font-weight: 800;
	text-align: center;
	margin: 0 0 60px 0;
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;

	@media (max-width: 768px) {
		font-size: 36px;
		margin-bottom: 40px;
	}

	@media (max-width: 480px) {
		font-size: 28px;
		margin-bottom: 30px;
	}
`;

export const FeaturesGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 30px;
	max-width: 1200px;
	margin: 0 auto;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, 1fr);
		gap: 25px;
	}

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 20px;
	}
`;

export const FeatureCard = styled.div`
	padding: 32px 24px;
	background: ${COLORS.bgWhite};
	border: 1.5px solid ${COLORS.gray100};
	border-radius: 12px;
	box-shadow: ${COLORS.shadow};
	transition: all 0.3s ease;
	text-align: center;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: ${COLORS.gradientPrimary};
		border-radius: 12px 12px 0 0;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	&:hover {
		border-color: ${COLORS.primary};
		box-shadow: ${COLORS.shadowLg};
		transform: translateY(-5px);

		&::before {
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		padding: 24px 20px;
	}
`;

export const FeatureIcon = styled.div`
	font-size: 48px;
	margin-bottom: 16px;
	display: block;
`;

export const FeatureTitle = styled.h3`
	font-size: 20px;
	font-weight: 700;
	margin: 0 0 12px 0;
	color: ${COLORS.textPrimary};

	@media (max-width: 768px) {
		font-size: 18px;
	}
`;

export const FeatureDescription = styled.p`
	font-size: 15px;
	line-height: 1.6;
	color: ${COLORS.textSecondary};
	margin: 0;

	@media (max-width: 768px) {
		font-size: 14px;
	}
`;

/* ============ BENEFITS SECTION ============ */

export const BenefitsSection = styled.section`
	width: 100%;
	padding: 100px 40px;
	background-color: ${COLORS.bgLight};
	position: relative;

	@media (max-width: 768px) {
		padding: 60px 20px;
	}

	@media (max-width: 480px) {
		padding: 40px 16px;
	}
`;

export const BenefitsContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
`;

export const BenefitRow = styled.div<{ reverse?: boolean }>`
	display: flex;
	align-items: center;
	gap: 60px;
	margin-bottom: 80px;
	flex-direction: ${(props) => (props.reverse ? 'row-reverse' : 'row')};

	&:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 1024px) {
		gap: 40px;
		margin-bottom: 60px;
	}

	@media (max-width: 768px) {
		flex-direction: column !important;
		gap: 30px;
		margin-bottom: 40px;
	}
`;

export const BenefitImage = styled.div`
	flex: 1;
	min-width: 0;

	img {
		width: 100%;
		height: auto;
		border-radius: 12px;
		box-shadow: ${COLORS.shadowLg};
		object-fit: cover;
	}

	@media (max-width: 768px) {
		width: 100%;
	}
`;

export const BenefitContent = styled.div`
	flex: 1;
	min-width: 0;

	@media (max-width: 768px) {
		width: 100%;
	}
`;

export const BenefitTitle = styled.h2`
	font-size: 36px;
	font-weight: 800;
	margin: 0 0 16px 0;
	color: ${COLORS.textPrimary};
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;

	@media (max-width: 768px) {
		font-size: 28px;
	}

	@media (max-width: 480px) {
		font-size: 22px;
	}
`;

export const BenefitDescription = styled.p`
	font-size: 16px;
	line-height: 1.8;
	color: ${COLORS.textSecondary};
	margin: 0 0 24px 0;

	@media (max-width: 768px) {
		font-size: 15px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
	}
`;

export const BenefitList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
`;

export const BenefitItem = styled.li`
	font-size: 15px;
	color: ${COLORS.textPrimary};
	margin-bottom: 12px;
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: 10px;

	&:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 768px) {
		font-size: 14px;
	}
`;

/* ============ CONTACT SECTION ============ */

export const ContactSection = styled.section`
	width: 100%;
	padding: 100px 40px;
	background-color: ${COLORS.bgWhite};
	position: relative;

	@media (max-width: 768px) {
		padding: 60px 20px;
	}

	@media (max-width: 480px) {
		padding: 40px 16px;
	}
`;

export const ContactTitle = styled.h2`
	font-size: 48px;
	font-weight: 800;
	text-align: center;
	margin: 0 0 60px 0;
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;

	@media (max-width: 768px) {
		font-size: 36px;
		margin-bottom: 40px;
	}

	@media (max-width: 480px) {
		font-size: 28px;
		margin-bottom: 30px;
	}
`;

export const ContactContent = styled.div`
	max-width: 600px;
	margin: 0 auto;
`;

export const ContactForm = styled.form`
	display: flex;
	flex-direction: column;
	gap: 20px;

	@media (max-width: 768px) {
		gap: 16px;
	}
`;

export const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const FormInput = styled.input`
	padding: 12px 16px;
	font-size: 16px;
	border: 1.5px solid ${COLORS.gray200};
	border-radius: 6px;
	background-color: ${COLORS.gray50};
	transition: all 0.2s ease;
	font-family: inherit;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		background-color: ${COLORS.bgWhite};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
	}

	&:hover {
		border-color: ${COLORS.gray300};
	}

	@media (max-width: 768px) {
		padding: 11px 14px;
		font-size: 15px;
	}
`;

export const FormTextarea = styled.textarea`
	padding: 12px 16px;
	font-size: 16px;
	border: 1.5px solid ${COLORS.gray200};
	border-radius: 6px;
	background-color: ${COLORS.gray50};
	transition: all 0.2s ease;
	font-family: inherit;
	resize: vertical;
	min-height: 120px;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		background-color: ${COLORS.bgWhite};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
	}

	&:hover {
		border-color: ${COLORS.gray300};
	}

	@media (max-width: 768px) {
		padding: 11px 14px;
		font-size: 15px;
	}
`;

export const SubmitButton = styled.button`
	padding: 12px 32px;
	font-size: 16px;
	font-weight: 600;
	border: none;
	border-radius: 6px;
	background: ${COLORS.gradientPrimary};
	color: white;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);

	&:hover {
		background: linear-gradient(
			135deg,
			${COLORS.primaryDark} 0%,
			${COLORS.primaryDarker} 100%
		);
		box-shadow: 0 6px 12px rgba(16, 185, 129, 0.35);
		transform: translateY(-2px);
	}

	&:active {
		transform: translateY(0);
	}

	@media (max-width: 768px) {
		padding: 11px 28px;
		font-size: 15px;
	}
`;

/* ============ CTA SECTION ============ */

export const CTASection = styled.section`
	width: 100%;
	padding: 100px 40px;
	background: ${COLORS.gradientPrimary};
	text-align: center;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -10%;
		width: 400px;
		height: 400px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		z-index: 0;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: -30%;
		right: -10%;
		width: 400px;
		height: 400px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		z-index: 0;
	}

	@media (max-width: 768px) {
		padding: 60px 20px;
	}

	@media (max-width: 480px) {
		padding: 40px 16px;
	}
`;

export const CTATitle = styled.h2`
	font-size: 48px;
	font-weight: 800;
	margin: 0 0 20px 0;
	color: white;
	position: relative;
	z-index: 1;
	letter-spacing: -0.5px;

	@media (max-width: 768px) {
		font-size: 36px;
	}

	@media (max-width: 480px) {
		font-size: 28px;
	}
`;

export const CTADescription = styled.p`
	font-size: 18px;
	line-height: 1.6;
	color: rgba(255, 255, 255, 0.9);
	margin: 0 0 40px 0;
	max-width: 500px;
	margin-left: auto;
	margin-right: auto;
	position: relative;
	z-index: 1;

	@media (max-width: 768px) {
		font-size: 16px;
		margin-bottom: 30px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
	}
`;

export const CTAButtons = styled.div`
	display: flex;
	gap: 20px;
	justify-content: center;
	position: relative;
	z-index: 1;
	flex-wrap: wrap;

	@media (max-width: 768px) {
		gap: 15px;
	}

	@media (max-width: 480px) {
		flex-direction: column;
		gap: 12px;
	}
`;

export const CTAButton = styled.button`
	padding: 16px 40px;
	font-size: 16px;
	font-weight: 600;
	border: none;
	border-radius: 8px;
	background: white;
	color: ${COLORS.primary};
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

	&:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
	}

	@media (max-width: 768px) {
		padding: 14px 32px;
		font-size: 15px;
	}

	@media (max-width: 480px) {
		padding: 12px 24px;
		font-size: 14px;
		width: 100%;
	}
`;

export const CTASecondary = styled(CTAButton)`
	background: transparent;
	color: white;
	border: 2px solid white;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
	}
`;

/* ============ FOOTER ============ */

export const FooterSection = styled.footer`
	width: 100%;
	background: ${COLORS.gray800};
	color: white;
	padding: 60px 40px 20px 40px;

	@media (max-width: 768px) {
		padding: 40px 20px 20px 20px;
	}

	@media (max-width: 480px) {
		padding: 30px 16px 16px 16px;
	}
`;

export const FooterContent = styled.div`
	max-width: 1200px;
	margin: 0 auto 40px auto;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 60px;

	div h3 {
		font-size: 24px;
		font-weight: 800;
		margin: 0 0 10px 0;
		background: ${COLORS.gradientPrimary};
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	div p {
		font-size: 15px;
		color: rgba(255, 255, 255, 0.7);
		margin: 0;
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 30px;
		margin-bottom: 30px;
	}
`;

export const FooterLinks = styled.div`
	display: flex;
	gap: 30px;
	justify-content: flex-end;

	@media (max-width: 768px) {
		justify-content: flex-start;
		flex-wrap: wrap;
		gap: 20px;
	}
`;

export const FooterLink = styled.button`
	background: none;
	border: none;
	color: rgba(255, 255, 255, 0.8);
	text-decoration: none;
	font-weight: 500;
	transition: color 0.2s ease;
	font-size: 15px;
	cursor: pointer;
	padding: 0;
	font-family: inherit;

	&:hover {
		color: ${COLORS.primary};
	}

	@media (max-width: 768px) {
		font-size: 14px;
	}
`;

export const FooterCopyright = styled.div`
	text-align: center;
	padding-top: 20px;
	border-top: 1px solid rgba(255, 255, 255, 0.2);
	color: rgba(255, 255, 255, 0.6);
	font-size: 14px;

	@media (max-width: 768px) {
		font-size: 13px;
	}
`;

export const DownloadSection = styled.section`
	padding: 80px 20px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	text-align: center;
	color: white;

	@media (max-width: 768px) {
		padding: 60px 20px;
	}
`;

export const DownloadContainer = styled.div`
	max-width: 800px;
	margin: 0 auto;
`;

export const DownloadHeading = styled.h2`
	font-size: 42px;
	font-weight: 700;
	margin-bottom: 20px;
	line-height: 1.2;

	@media (max-width: 768px) {
		font-size: 32px;
	}
`;

export const DownloadSubtext = styled.p`
	font-size: 18px;
	color: rgba(255, 255, 255, 0.9);
	margin-bottom: 40px;
	line-height: 1.6;

	@media (max-width: 768px) {
		font-size: 16px;
	}
`;

export const DownloadButton = styled.a`
	display: inline-block;
	padding: 18px 48px;
	background: white;
	color: #667eea;
	font-size: 18px;
	font-weight: 600;
	border-radius: 8px;
	text-decoration: none;
	margin: 0 10px;
	transition: all 0.3s ease;
	border: 2px solid white;
	cursor: pointer;

	&:hover {
		background: transparent;
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
	}

	@media (max-width: 768px) {
		padding: 16px 32px;
		font-size: 16px;
		margin: 10px 0;
		display: block;
		width: 100%;
		box-sizing: border-box;
	}
`;

export const DownloadInfo = styled.div`
	margin-top: 40px;
	padding-top: 40px;
	border-top: 1px solid rgba(255, 255, 255, 0.3);
	display: flex;
	justify-content: center;
	gap: 40px;
	flex-wrap: wrap;

	@media (max-width: 768px) {
		gap: 20px;
	}
`;

export const InfoItem = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;

	strong {
		font-size: 16px;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 5px;
	}

	span {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.7);
	}
`;
