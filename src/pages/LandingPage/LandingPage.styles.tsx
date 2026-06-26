import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const Wrapper = styled.div`
	overflow-x: hidden;
	width: 100%;
	background-color: ${COLORS.bgWhite};
	margin-top: 80px;
	padding-top: max(env(safe-area-inset-top), 0px);

	@media (max-width: 1024px) {
		margin-top: 70px;
	}

	@media (max-width: 480px) {
		margin-top: 128px;
		padding-top: max(env(safe-area-inset-top), 8px);
	}
`;

/* ============ HERO SECTION ============ */

export const Hero = styled.section`
	width: 100%;
	min-height: 84vh;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 60px;
	padding: 128px 40px 64px 40px;
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
		padding: 108px 30px 46px 30px;
	}

	@media (max-width: 1024px) {
		padding: 94px 20px 34px 20px;
		min-height: auto;
		gap: 30px;
	}

	@media (max-width: 480px) {
		padding: 126px 16px 20px 16px;
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
		max-width: 100%;
	}
`;

/* ============ OUR STORY SECTION ============ */

export const StorySection = styled.section`
	width: 100%;
	padding: 100px 40px;
	background-color: ${COLORS.bgWhite};
	position: relative;

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
		font-size: 15px;
		margin-bottom: 20px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		margin-bottom: 16px;
	}
`;

export const WhySection = styled.section`
	width: 100%;
	padding: 92px 40px;
	background: linear-gradient(180deg, ${COLORS.bgLight} 0%, #f8fbff 100%);
	position: relative;

	@media (max-width: 1024px) {
		padding: 60px 20px;
	}

	@media (max-width: 480px) {
		padding: 44px 16px;
	}
`;

export const WhySectionInner = styled.div`
	max-width: 1200px;
	margin: 0 auto;
`;

export const WhyTitle = styled.h2`
	font-size: 46px;
	font-weight: 800;
	text-align: center;
	margin: 0 0 16px 0;
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;

	@media (max-width: 1024px) {
		font-size: 34px;
	}

	@media (max-width: 480px) {
		font-size: 28px;
	}
`;

export const WhyIntro = styled.p`
	max-width: 820px;
	margin: 0 auto 28px auto;
	text-align: center;
	font-size: 17px;
	line-height: 1.65;
	color: ${COLORS.textSecondary};

	@media (max-width: 1024px) {
		font-size: 15px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		margin-bottom: 20px;
	}
`;

export const WhyGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16px;
	margin-bottom: 18px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

export const WhyCard = styled.div`
	background: ${COLORS.bgWhite};
	border: 1px solid #e8edf3;
	border-radius: 14px;
	padding: 22px 20px;
	box-shadow: ${COLORS.shadow};

	@media (max-width: 480px) {
		padding: 18px 16px;
	}
`;

export const WhyCardTitle = styled.h3`
	font-size: 18px;
	font-weight: 800;
	margin: 0 0 10px 0;
	color: ${COLORS.textPrimary};
`;

export const WhyCardText = styled.p`
	font-size: 15px;
	line-height: 1.6;
	color: ${COLORS.textSecondary};
	margin: 0;
`;

export const WhyCallout = styled.div`
	max-width: 880px;
	margin: 0 auto;
	padding: 18px 20px;
	border-radius: 14px;
	border: 1px solid rgba(34, 197, 94, 0.2);
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
	box-shadow: 0 8px 22px rgba(16, 185, 129, 0.08);
	font-size: 15px;
	line-height: 1.7;
	color: #14532d;

	@media (max-width: 480px) {
		padding: 16px;
		font-size: 14px;
	}
`;

export const TimelineSection = styled.section`
	width: 100%;
	padding: 92px 40px;
	background: ${COLORS.bgWhite};

	@media (max-width: 1024px) {
		padding: 60px 20px;
	}

	@media (max-width: 480px) {
		padding: 44px 16px;
	}
`;

export const TimelineShell = styled.div`
	max-width: 1100px;
	margin: 0 auto;
`;

export const TimelineHeader = styled.h2`
	font-size: 42px;
	font-weight: 800;
	text-align: center;
	margin: 0 0 14px 0;
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;

	@media (max-width: 1024px) {
		font-size: 32px;
	}

	@media (max-width: 480px) {
		font-size: 26px;
	}
`;

export const TimelineIntro = styled.p`
	max-width: 760px;
	margin: 0 auto 28px auto;
	text-align: center;
	font-size: 16px;
	line-height: 1.65;
	color: ${COLORS.textSecondary};

	@media (max-width: 480px) {
		font-size: 14px;
		margin-bottom: 22px;
	}
`;

export const TimelineCard = styled.div`
	background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
	border: 1px solid #e8edf3;
	border-radius: 18px;
	padding: 18px;
	box-shadow: ${COLORS.shadow};
`;

export const TimelineList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

export const TimelineRow = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 14px;
	padding: 10px 2px;

	@media (max-width: 480px) {
		gap: 10px;
		padding: 8px 0;
	}
`;

export const TimelineRail = styled.div`
	position: relative;
	width: 18px;
	flex-shrink: 0;
	display: flex;
	justify-content: center;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: -18px;
		width: 2px;
		border-radius: 999px;
		background: linear-gradient(180deg, rgba(34, 197, 94, 0.9), rgba(59, 130, 246, 0.22));
	}

	&::after {
		content: '';
		position: relative;
		width: 10px;
		height: 10px;
		margin-top: 2px;
		border-radius: 999px;
		background: ${COLORS.gradientPrimary};
		box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
	}
`;

export const TimelineIcon = styled.span`
	width: 34px;
	height: 34px;
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 12px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	font-size: 18px;
	line-height: 1;
	box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);

	@media (max-width: 480px) {
		width: 32px;
		height: 32px;
		font-size: 17px;
		border-radius: 10px;
	}
`;

export const TimelineContent = styled.div`
	flex: 1;
	min-width: 0;
`;

export const TimelineTitle = styled.div`
	font-size: 0.96rem;
	font-weight: 800;
	color: ${COLORS.textPrimary};
	line-height: 1.45;
`;

export const TimelineMeta = styled.div`
	font-size: 0.8rem;
	font-weight: 500;
	color: ${COLORS.textSecondary};
	margin-top: 4px;
`;

export const OwnershipSection = styled.section`
	width: 100%;
	padding: 84px 40px;
	background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);

	@media (max-width: 1024px) {
		padding: 56px 20px;
	}

	@media (max-width: 480px) {
		padding: 40px 16px;
	}
`;

export const OwnershipShell = styled.div`
	max-width: 1120px;
	margin: 0 auto;
`;

export const OwnershipHeader = styled.h2`
	font-size: 42px;
	font-weight: 800;
	text-align: center;
	margin: 0 0 14px 0;
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;

	@media (max-width: 1024px) {
		font-size: 32px;
	}

	@media (max-width: 480px) {
		font-size: 26px;
	}
`;

export const OwnershipIntro = styled.p`
	max-width: 780px;
	margin: 0 auto 26px auto;
	text-align: center;
	font-size: 16px;
	line-height: 1.65;
	color: ${COLORS.textSecondary};

	@media (max-width: 480px) {
		font-size: 14px;
		margin-bottom: 20px;
	}
`;

export const OwnershipGrid = styled.div`
	display: grid;
	grid-template-columns: 1.1fr 1fr;
	gap: 18px;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`;

export const OwnershipListCard = styled.div`
	background: ${COLORS.bgWhite};
	border: 1px solid #e8edf3;
	border-radius: 16px;
	padding: 18px;
	box-shadow: ${COLORS.shadow};
`;

export const OwnershipList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const OwnershipListItem = styled.li`
	font-size: 0.92rem;
	line-height: 1.5;
	color: ${COLORS.textPrimary};
	padding: 10px 12px;
	border-radius: 10px;
	background: #f8fafc;
	border: 1px solid #edf2f7;
`;

export const OwnershipVisualCard = styled.div`
	background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
	border: 1px solid #dbe7f6;
	border-radius: 16px;
	padding: 18px;
	box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
`;

export const OwnershipDeviceHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	padding-bottom: 12px;
	border-bottom: 1px solid #edf2f7;
`;

export const OwnershipDeviceTitle = styled.h3`
	margin: 0;
	font-size: 1.05rem;
	font-weight: 800;
	color: ${COLORS.textPrimary};
`;

export const OwnershipDeviceMeta = styled.div`
	font-size: 0.78rem;
	font-weight: 600;
	color: ${COLORS.textSecondary};
	margin-top: 4px;
`;

export const OwnershipDeviceBadge = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 0.72rem;
	font-weight: 700;
	color: #1d4ed8;
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	white-space: nowrap;
`;

export const OwnershipEventList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 12px;
`;

export const OwnershipEventItem = styled.div`
	padding: 10px 12px;
	border-radius: 10px;
	background: #f8fafc;
	border: 1px solid #edf2f7;
`;

export const OwnershipEventTitle = styled.div`
	font-size: 0.85rem;
	font-weight: 700;
	color: ${COLORS.textPrimary};
`;

export const OwnershipEventMeta = styled.div`
	font-size: 0.76rem;
	font-weight: 500;
	color: ${COLORS.textSecondary};
	margin-top: 3px;
`;

export const MemorySection = styled.section`
	width: 100%;
	padding: 84px 40px;
	background: ${COLORS.bgWhite};

	@media (max-width: 1024px) {
		padding: 56px 20px;
	}

	@media (max-width: 480px) {
		padding: 40px 16px;
	}
`;

export const MemoryShell = styled.div`
	max-width: 1120px;
	margin: 0 auto;
`;

export const MemoryHeader = styled.h2`
	max-width: 820px;
	margin: 0 auto 14px auto;
	text-align: center;
	font-size: 40px;
	font-weight: 800;
	line-height: 1.16;
	color: ${COLORS.textPrimary};

	@media (max-width: 1024px) {
		font-size: 32px;
	}

	@media (max-width: 480px) {
		font-size: 25px;
	}
`;

export const MemoryIntro = styled.p`
	max-width: 780px;
	margin: 0 auto 28px auto;
	text-align: center;
	font-size: 16px;
	line-height: 1.68;
	color: ${COLORS.textSecondary};

	@media (max-width: 480px) {
		font-size: 14px;
	}
`;

export const MemoryGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 14px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

export const MemoryStageCard = styled.article`
	position: relative;
	background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
	border: 1px solid #dbe7f6;
	border-radius: 14px;
	padding: 18px;
	box-shadow: ${COLORS.shadow};
	min-height: 190px;

	&:not(:last-child)::after {
		content: '→';
		position: absolute;
		top: 50%;
		right: -15px;
		transform: translateY(-50%);
		color: ${COLORS.primary};
		font-size: 18px;
		font-weight: 800;
		opacity: 0.45;
		z-index: 2;
	}

	@media (max-width: 1024px) {
		&::after {
			display: none;
		}
	}
`;

export const MemoryStageNumber = styled.div`
	width: 34px;
	height: 34px;
	border-radius: 999px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${COLORS.gradientPrimary};
	color: #ffffff;
	font-size: 14px;
	font-weight: 800;
	margin-bottom: 12px;
`;

export const MemoryStageTitle = styled.h3`
	margin: 0 0 8px 0;
	font-size: 18px;
	font-weight: 800;
	color: ${COLORS.textPrimary};
`;

export const MemoryStageText = styled.p`
	margin: 0;
	font-size: 14px;
	line-height: 1.55;
	color: ${COLORS.textSecondary};
`;

/* ============ OUR MISSION SECTION ============ */

export const MissionSection = styled.section`
	width: 100%;
	padding: 100px 40px;
	background-color: ${COLORS.bgLight};
	position: relative;

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
		padding: 24px 20px;
	}
`;

export const MissionCardIcon = styled.div`
	font-size: 48px;
	margin-bottom: 16px;
	display: block;
	line-height: 1;

	svg {
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.12));
	}

	&.history {
		color: ${COLORS.primary};
	}

	&.unit {
		color: ${COLORS.secondary};
	}

	&.security {
		color: ${COLORS.infoDark};
	}

	&.mobile {
		color: ${COLORS.warningDark};
	}
`;

export const MissionCardTitle = styled.h3`
	font-size: 20px;
	font-weight: 700;
	margin: 0 0 12px 0;
	color: ${COLORS.textPrimary};

	@media (max-width: 1024px) {
		font-size: 18px;
	}
`;

export const MissionCardDescription = styled.p`
	font-size: 15px;
	line-height: 1.6;
	color: ${COLORS.textSecondary};
	margin: 0;

	@media (max-width: 1024px) {
		font-size: 14px;
	}
`;

/* ============ FEATURES SECTION ============ */

export const FeaturesSection = styled.section`
	width: 100%;
	padding: 100px 40px;
	background-color: ${COLORS.bgWhite};
	position: relative;

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
		font-size: 36px;
		margin-bottom: 40px;
	}

	@media (max-width: 480px) {
		font-size: 28px;
		margin-bottom: 30px;
	}
`;

export const FeaturesContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 40px;
	background-color: ${COLORS.bgWhite};
`;

export const FeatureGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 20px;
	padding: 0 40px 40px;
	background-color: ${COLORS.bgWhite};

	@media (max-width: 1200px) {
		grid-template-columns: repeat(2, 1fr);
		gap: 24px;
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		gap: 16px;
		padding: 0 0 20px;
	}
`;

export const FeatureCard = styled.div<{ $flagship?: boolean }>`
	padding: ${(p) => (p.$flagship ? '36px 28px' : '28px 22px')};
	background: ${(p) =>
		p.$flagship
			? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
			: COLORS.bgWhite};
	border: ${(p) =>
		p.$flagship ? '2px solid rgba(16, 185, 129, 0.35)' : `1.5px solid ${COLORS.gray100}`};
	border-radius: ${(p) => (p.$flagship ? '16px' : '12px')};
	box-shadow: ${(p) =>
		p.$flagship
			? '0 8px 24px rgba(16, 185, 129, 0.12), 0 2px 8px rgba(0,0,0,0.04)'
			: COLORS.shadow};
	transition: all 0.3s ease;
	text-align: ${(p) => (p.$flagship ? 'left' : 'center')};
	position: relative;
	overflow: hidden;

	${(p) =>
		p.$flagship &&
		`
		&::before {
			content: 'CORE FEATURE';
			position: absolute;
			top: 14px;
			right: 14px;
			font-size: 10px;
			font-weight: 800;
			letter-spacing: 0.1em;
			color: #059669;
			background: rgba(16, 185, 129, 0.12);
			padding: 3px 8px;
			border-radius: 999px;
			border: 1px solid rgba(16, 185, 129, 0.25);
		}
	`}

	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: ${(p) => (p.$flagship ? '4px' : '3px')};
		background: ${(p) =>
			p.$flagship
				? COLORS.gradientPrimary
				: COLORS.gradientPrimary};
		border-radius: ${(p) =>
			p.$flagship ? '16px 16px 0 0' : '12px 12px 0 0'};
		opacity: ${(p) => (p.$flagship ? '1' : '0')};
		transition: opacity 0.3s ease;
	}

	&:hover::after {
		opacity: 1;
	}

	&:hover {
		border-color: ${(p) => (p.$flagship ? 'rgba(16, 185, 129, 0.5)' : COLORS.primary)};
		box-shadow: ${(p) =>
			p.$flagship
				? '0 12px 32px rgba(16, 185, 129, 0.18), 0 4px 12px rgba(0,0,0,0.06)'
				: COLORS.shadowLg};
		transform: translateY(-4px);
	}

	@media (max-width: 1024px) {
		padding: ${(p) => (p.$flagship ? '28px 22px' : '22px 18px')};
	}
`;

export const FeatureIcon = styled.div<{ $flagship?: boolean }>`
	font-size: ${(p) => (p.$flagship ? '52px' : '44px')};
	margin-bottom: ${(p) => (p.$flagship ? '20px' : '14px')};
	display: ${(p) => (p.$flagship ? 'inline-flex' : 'block')};
	line-height: 1;

	${(p) =>
		p.$flagship &&
		`
		width: 80px;
		height: 80px;
		align-items: center;
		justify-content: center;
		background: rgba(16, 185, 129, 0.1);
		border-radius: 20px;
		border: 2px solid rgba(16, 185, 129, 0.2);
	`}

	svg {
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.12));
	}

	&.history {
		color: ${COLORS.primary};
	}

	&.unit {
		color: ${COLORS.secondary};
	}

	&.contractor {
		color: ${COLORS.warning};
	}

	&.analytics {
		color: ${COLORS.info};
	}

	&.documentation {
		color: ${COLORS.secondaryDark};
	}

	&.reminders {
		color: ${COLORS.warningDark};
	}

	&.search {
		color: ${COLORS.primaryDark};
	}

	&.mobile {
		color: ${COLORS.infoDark};
	}
`;

export const FeatureTitle = styled.h3<{ $flagship?: boolean }>`
	font-size: ${(p) => (p.$flagship ? '22px' : '18px')};
	font-weight: ${(p) => (p.$flagship ? '800' : '700')};
	margin: 0 0 12px 0;
	color: ${(p) => (p.$flagship ? '#0f172a' : COLORS.textPrimary)};
	letter-spacing: ${(p) => (p.$flagship ? '-0.01em' : '0')};

	@media (max-width: 1024px) {
		font-size: ${(p) => (p.$flagship ? '20px' : '17px')};
	}
`;

export const FeatureDescription = styled.p`
	font-size: 15px;
	line-height: 1.6;
	color: ${COLORS.textSecondary};
	margin: 0;

	@media (max-width: 1024px) {
		font-size: 14px;
	}
`;

export const FeatureList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const FeatureItem = styled.li`
	font-size: 16px;
	color: ${COLORS.textPrimary};
`;

/* ============ PRICING SECTION ============ */

export const PricingSection = styled.section`
	width: 100%;
	padding: 100px 40px;
	background: ${COLORS.bgLight};

	@media (max-width: 1024px) {
		padding: 60px 20px;
	}

	@media (max-width: 480px) {
		padding: 40px 16px;
	}
`;

export const PricingTitle = styled.h2`
	font-size: 48px;
	font-weight: 800;
	text-align: center;
	margin: 0 0 14px 0;
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;

	@media (max-width: 1024px) {
		font-size: 36px;
	}

	@media (max-width: 480px) {
		font-size: 28px;
	}
`;

export const PricingSubtitle = styled.p`
	text-align: center;
	font-size: 16px;
	color: ${COLORS.textSecondary};
	margin: 0 0 36px 0;
`;

export const PricingGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 20px;
	max-width: 1200px;
	margin: 0 auto 34px auto;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`;

export const PricingCard = styled.div`
	position: relative;
	background: ${COLORS.bgWhite};
	border: 1.5px solid ${COLORS.gray200};
	border-radius: 14px;
	padding: 26px 22px;
	box-shadow: ${COLORS.shadow};

	&.popular {
		border-color: ${COLORS.primary};
		box-shadow: ${COLORS.shadowLg};
		transform: translateY(-4px);
	}
`;

export const PricingBadge = styled.div`
	position: absolute;
	top: -10px;
	right: 14px;
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.textInverse};
	font-size: 12px;
	font-weight: 700;
	padding: 4px 10px;
	border-radius: 999px;
`;

export const PricingPlan = styled.h3`
	margin: 0 0 10px 0;
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 22px;
	color: ${COLORS.textPrimary};
`;

export const PricingPrice = styled.div`
	font-size: 40px;
	font-weight: 800;
	color: ${COLORS.primaryDark};
	line-height: 1;
	margin-bottom: 6px;
`;

export const PricingPeriod = styled.div`
	font-size: 14px;
	color: ${COLORS.textSecondary};
	margin-bottom: 12px;
`;

export const PricingMeta = styled.div`
	font-size: 13px;
	font-weight: 600;
	color: ${COLORS.secondaryDark};
	margin-bottom: 14px;
`;

export const PricingFeatureList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const PricingFeatureItem = styled.li`
	font-size: 14px;
	line-height: 1.5;
	color: ${COLORS.textPrimary};
	padding-left: 18px;
	position: relative;

	&::before {
		content: '•';
		position: absolute;
		left: 4px;
		color: ${COLORS.primary};
	}
`;

export const PricingComparison = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 22px;
	border-radius: 14px;
	background: ${COLORS.bgWhite};
	border: 1.5px solid ${COLORS.gray200};
	box-shadow: ${COLORS.shadow};
`;

export const PricingComparisonTitle = styled.h4`
	margin: 0 0 14px 0;
	font-size: 20px;
	color: ${COLORS.textPrimary};
`;

export const PricingTable = styled.div`
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr;

	@media (max-width: 1024px) {
		grid-template-columns: 1.6fr 1fr 1fr 1fr;
		font-size: 13px;
	}
`;

export const PricingTableHead = styled.div`
	display: contents;
`;

export const PricingTableRow = styled.div`
	display: contents;
`;

export const PricingTableCell = styled.div`
	padding: 10px 8px;
	border-bottom: 1px solid ${COLORS.gray200};
	text-align: center;
	color: ${COLORS.textSecondary};

	&.head-cell {
		font-weight: 700;
		color: ${COLORS.textPrimary};
		background: ${COLORS.gray100};
	}

	&:nth-child(4n + 1) {
		text-align: left;
		color: ${COLORS.textPrimary};
		font-weight: 600;
	}
`;

export const PricingCheck = styled.span`
	color: ${COLORS.successDark};
	font-size: 15px;
`;

export const PricingX = styled.span`
	color: ${COLORS.errorDark};
	font-size: 15px;
`;

export const PricingActionRow = styled.div`
	max-width: 1200px;
	margin: 22px auto 0 auto;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 14px;
	flex-wrap: wrap;
`;

export const PricingActionButton = styled.button`
	padding: 12px 22px;
	border: none;
	border-radius: 8px;
	font-size: 15px;
	font-weight: 700;
	color: ${COLORS.textInverse};
	background: ${COLORS.gradientPrimary};
	cursor: pointer;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	box-shadow: ${COLORS.shadowMd};

	&:hover {
		transform: translateY(-2px);
		box-shadow: ${COLORS.shadowLg};
	}
`;

export const PricingActionLink = styled.button`
	padding: 10px 14px;
	border: none;
	background: transparent;
	font-size: 14px;
	font-weight: 600;
	color: ${COLORS.secondaryDark};
	cursor: pointer;
	text-decoration: underline;
`;

/* ============ SCREENSHOT FLOW SECTION ============ */

export const JourneySection = styled.section`
	width: 100%;
	padding: 92px 40px;
	background: ${COLORS.bgWhite};

	@media (max-width: 1024px) {
		padding: 60px 20px;
	}

	@media (max-width: 480px) {
		padding: 44px 16px;
	}
`;

export const JourneyShell = styled.div`
	max-width: 1200px;
	margin: 0 auto;
`;

export const JourneyHeader = styled.h2`
	font-size: 40px;
	font-weight: 800;
	text-align: center;
	margin: 0 0 12px 0;
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;

	@media (max-width: 1024px) {
		font-size: 32px;
	}

	@media (max-width: 480px) {
		font-size: 26px;
	}
`;

export const JourneyIntro = styled.p`
	max-width: 760px;
	margin: 0 auto 28px auto;
	text-align: center;
	font-size: 16px;
	line-height: 1.65;
	color: ${COLORS.textSecondary};

	@media (max-width: 480px) {
		font-size: 14px;
		margin-bottom: 22px;
	}
`;

export const JourneyGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 18px;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`;

export const JourneyCard = styled.article<{ $visible?: boolean }>`
	border-radius: 16px;
	border: 1px solid #e8edf3;
	background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
	overflow: hidden;
	box-shadow: ${COLORS.shadow};
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	transform: ${(p) => (p.$visible ? 'translateY(0)' : 'translateY(18px)')};
	transition: opacity 0.55s ease, transform 0.55s ease;

	&:nth-child(2) {
		transition-delay: 0.1s;
	}

	&:nth-child(3) {
		transition-delay: 0.18s;
	}

	@media (max-width: 480px) {
		transition: opacity 0.35s ease, transform 0.35s ease;

		&:nth-child(2) {
			transition-delay: 0.06s;
		}

		&:nth-child(3) {
			transition-delay: 0.11s;
		}
	}
`;

export const JourneyStep = styled.div`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	border: 1px solid #bfdbfe;
	background: #eff6ff;
	font-size: 0.72rem;
	font-weight: 700;
	color: #1d4ed8;
	margin-bottom: 10px;
`;

export const JourneyImage = styled.img`
	width: 100%;
	height: auto;
	display: block;
	border-bottom: 1px solid #e8edf3;
	object-fit: cover;
`;

export const JourneyCardBody = styled.div`
	padding: 14px 14px 16px 14px;
`;

export const JourneyCardTitle = styled.h3`
	margin: 0 0 6px 0;
	font-size: 1rem;
	font-weight: 800;
	color: ${COLORS.textPrimary};
`;

export const JourneyCardText = styled.p`
	margin: 0;
	font-size: 0.86rem;
	line-height: 1.55;
	color: ${COLORS.textSecondary};
`;

/* ============ BENEFITS SECTION ============ */

export const BenefitsSection = styled.section`
	width: 100%;
	padding: 100px 40px;
	background-color: ${COLORS.bgLight};
	position: relative;

	@media (max-width: 1024px) {
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

export const BenefitRow = styled.div<{ $reverse?: boolean }>`
	display: flex;
	align-items: center;
	gap: 60px;
	margin-bottom: 80px;
	flex-direction: ${(props) => (props.$reverse ? 'row-reverse' : 'row')};

	&:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 1024px) {
		gap: 40px;
		margin-bottom: 60px;
	}

	@media (max-width: 1024px) {
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
		aspect-ratio: 5425 / 3557;
		border-radius: 12px;
		box-shadow: ${COLORS.shadowLg};
		object-fit: cover;
	}

	@media (max-width: 1024px) {
		width: 100%;
	}
`;

export const BenefitContent = styled.div`
	flex: 1;
	min-width: 0;

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	.benefit-icon {
		color: ${COLORS.primaryDark};
		width: 18px;
		font-size: 16px;
		flex-shrink: 0;
		transition: color 0.25s ease;
	}

	${BenefitRow}:nth-child(1) & .benefit-icon {
		color: ${COLORS.primaryDark};
	}

	${BenefitRow}:nth-child(2) & .benefit-icon {
		color: ${COLORS.secondaryDark};
	}

	${BenefitRow}:nth-child(3) & .benefit-icon {
		color: ${COLORS.infoDark};
	}

	${BenefitRow}:nth-child(4) & .benefit-icon {
		color: ${COLORS.warningDark};
	}

	@media (max-width: 1024px) {
		font-size: 14px;
	}
`;

/* ============ CONTACT SECTION ============ */

export const ContactSection = styled.section`
	width: 100%;
	padding: 100px 40px;
	background-color: ${COLORS.bgWhite};
	position: relative;

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
		gap: 16px;
	}
`;

export const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const FormInput = styled.input`
	width: 100%;
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

	@media (max-width: 1024px) {
		padding: 11px 14px;
		font-size: 15px;
	}
`;

export const FormTextarea = styled.textarea`
	width: 100%;
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
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
	grid-template-columns: 1fr minmax(420px, 560px);
	column-gap: 40px;
	row-gap: 10px;
	align-items: start;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
		margin-bottom: 30px;
	}
`;

export const FooterBrand = styled.div`
	width: 80%;
	max-width: 400px;
	padding: 0 10px;

	@media (max-width: 480px) {
		width: 100%;
		max-width: none;
		padding: 0;
	}

	h3 {
		font-size: 24px;
		font-weight: 800;
		margin: 0 0 10px 0;
		background: ${COLORS.gradientPrimary};
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	p {
		font-size: 15px;
		color: rgba(255, 255, 255, 0.7);
		margin: 0 0 18px 0;
		line-height: 1.6;
	}
`;

export const FooterLinks = styled.div`
	display: flex;
	width: 80%;
	max-width: 500px;
	padding-top: 30px;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px 18px;
	justify-content: center;
	margin-left: auto;

	@media (max-width: 1024px) {
		max-width: none;
		margin-left: 0;
		justify-content: flex-start;
		align-items: center;
		gap: 10px 14px;
	}

	@media (max-width: 480px) {
		width: 100%;
		max-width: none;
		padding-top: 20px;
	}
`;

export const FooterLegalLinks = styled(FooterLinks)`
	grid-column: 1 / -1;
	width: 100%;
	max-width: none;
	margin-left: 0;
	margin-top: 26px;
	padding-top: 0;
	gap: 10px 20px;
	justify-content: center;

	@media (max-width: 480px) {
		width: 100%;
		max-width: none;
		padding-top: 6px;
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

	@media (max-width: 1024px) {
		font-size: 14px;
	}
`;

export const FooterLegalLink = styled(FooterLink)`
	font-size: 14px;
	color: rgba(255, 255, 255, 0.68);

	&:hover {
		color: rgba(255, 255, 255, 0.85);
	}

	@media (max-width: 1024px) {
		font-size: 13px;
	}
`;

export const FooterCopyright = styled.div`
	text-align: center;
	padding-top: 20px;
	border-top: 1px solid rgba(255, 255, 255, 0.2);
	color: rgba(255, 255, 255, 0.6);
	font-size: 14px;

	@media (max-width: 1024px) {
		font-size: 13px;
	}
`;

export const DownloadSection = styled.section`
	padding: 80px 20px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	text-align: center;
	color: white;

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
		font-size: 32px;
	}
`;

export const DownloadSubtext = styled.p`
	font-size: 18px;
	color: rgba(255, 255, 255, 0.9);
	margin-bottom: 40px;
	line-height: 1.6;

	@media (max-width: 1024px) {
		font-size: 16px;
	}
`;

export const DownloadButton = styled.a`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 18px 48px;
	background: white;
	color: #667eea;
	font-size: 18px;
	font-weight: 600;
	border-radius: 8px;
	text-decoration: none;
	margin: 10px 10px;
	transition: all 0.3s ease;
	border: 2px solid white;
	cursor: pointer;

	svg {
		font-size: 16px;
	}

	&:hover {
		background: transparent;
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
	}

	@media (max-width: 1024px) {
		padding: 16px 32px;
		font-size: 16px;
		margin: 10px 0;
		display: inline-flex;
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

	@media (max-width: 1024px) {
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

export const VersionStatus = styled.div`
	margin-top: 20px;
	padding: 12px 20px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.9);
	text-align: center;
	border: 1px solid rgba(255, 255, 255, 0.2);

	@media (max-width: 1024px) {
		font-size: 13px;
		padding: 10px 16px;
		margin-top: 16px;
	}
`;

export const Section = styled.section`
	width: 100%;
	height: 600px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40px;
	background: ${COLORS.bgLight};
	box-sizing: border-box;

	@media (max-width: 1024px) {
		height: 500px;
		padding: 30px;
	}

	@media (max-width: 480px) {
		height: 400px;
		padding: 20px;
	}
`;
