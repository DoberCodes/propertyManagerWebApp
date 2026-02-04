import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const PaywallWrapper = styled.div<{ variant?: 'full' | 'embedded' }>`
	width: 100%;
	min-height: ${(props) => (props.variant === 'embedded' ? 'auto' : '100vh')};
	padding: ${(props) =>
		props.variant === 'embedded' ? '10px 0' : '80px 40px'};
	background: ${(props) =>
		props.variant === 'embedded'
			? 'transparent'
			: `linear-gradient(135deg, ${COLORS.bgLight} 0%, ${COLORS.bgWhite} 100%)`};
	margin-top: ${(props) => (props.variant === 'embedded' ? '0' : '80px')};
`;

export const PaywallContainer = styled.div<{ variant?: 'full' | 'embedded' }>`
	max-width: ${(props) => (props.variant === 'embedded' ? '100%' : '1200px')};
	margin: 0 auto;
	padding: ${(props) => (props.variant === 'embedded' ? '0 10px' : '0 40px')};

	@media (max-width: 768px) {
		padding: ${(props) => (props.variant === 'embedded' ? '0 8px' : '0 20px')};
	}
`;

export const PaywallTitle = styled.h1<{ variant?: 'full' | 'embedded' }>`
	font-size: ${(props) => (props.variant === 'embedded' ? '32px' : '48px')};
	font-weight: 800;
	text-align: center;
	margin-bottom: ${(props) => (props.variant === 'embedded' ? '10px' : '20px')};
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;

	@media (max-width: 768px) {
		font-size: ${(props) => (props.variant === 'embedded' ? '26px' : '36px')};
	}
`;

export const PaywallSubtitle = styled.p<{ variant?: 'full' | 'embedded' }>`
	font-size: ${(props) => (props.variant === 'embedded' ? '15px' : '18px')};
	text-align: center;
	color: ${COLORS.textSecondary};
	margin-bottom: ${(props) => (props.variant === 'embedded' ? '24px' : '60px')};
	max-width: ${(props) => (props.variant === 'embedded' ? '520px' : '600px')};
	margin-left: auto;
	margin-right: auto;

	@media (max-width: 768px) {
		font-size: ${(props) => (props.variant === 'embedded' ? '14px' : '16px')};
		margin-bottom: ${(props) =>
			props.variant === 'embedded' ? '20px' : '40px'};
	}
`;

export const TrialBannerWrapper = styled.div<{ variant?: 'full' | 'embedded' }>`
	background: linear-gradient(135deg, ${COLORS.primary} 0%, #00a86b 100%);
	color: white;
	padding: ${(props) => (props.variant === 'embedded' ? '12px 16px' : '40px')};
	border-radius: ${(props) => (props.variant === 'embedded' ? '8px' : '12px')};
	margin-bottom: ${(props) => (props.variant === 'embedded' ? '16px' : '60px')};
	text-align: center;
	box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2);
`;

export const TrialBannerTitle = styled.h2<{ variant?: 'full' | 'embedded' }>`
	font-size: ${(props) => (props.variant === 'embedded' ? '16px' : '32px')};
	font-weight: 800;
	margin: 0 0 ${(props) => (props.variant === 'embedded' ? '6px' : '15px')} 0;

	@media (max-width: 768px) {
		font-size: ${(props) => (props.variant === 'embedded' ? '15px' : '24px')};
	}
`;

export const TrialBannerText = styled.p<{ variant?: 'full' | 'embedded' }>`
	font-size: ${(props) => (props.variant === 'embedded' ? '12px' : '18px')};
	margin: 0 0 ${(props) => (props.variant === 'embedded' ? '0' : '20px')} 0;
	opacity: 0.95;

	@media (max-width: 768px) {
		font-size: ${(props) => (props.variant === 'embedded' ? '11px' : '16px')};
	}
`;

export const TrialCountdown = styled.div<{ variant?: 'full' | 'embedded' }>`
	font-size: ${(props) => (props.variant === 'embedded' ? '32px' : '48px')};
	font-weight: 800;
	margin-bottom: 20px;

	@media (max-width: 768px) {
		font-size: ${(props) => (props.variant === 'embedded' ? '26px' : '36px')};
	}
`;

export const PricingCardsGrid = styled.div<{ layout?: 'grid' | 'horizontal' }>`
	display: ${(props) => (props.layout === 'horizontal' ? 'flex' : 'grid')};
	grid-template-columns: ${(props) =>
		props.layout === 'horizontal'
			? 'none'
			: 'repeat(auto-fit, minmax(280px, 1fr))'};
	gap: ${(props) => (props.layout === 'horizontal' ? '16px' : '24px')};
	margin-bottom: ${(props) =>
		props.layout === 'horizontal' ? '20px' : '40px'};
	margin-top: ${(props) => (props.layout === 'horizontal' ? '10px' : '40px')};
	align-items: stretch;
	justify-content: center;
	flex-wrap: ${(props) => (props.layout === 'horizontal' ? 'nowrap' : 'wrap')};
	overflow-x: ${(props) =>
		props.layout === 'horizontal' ? 'auto' : 'visible'};
	overflow-y: visible;
	padding-bottom: ${(props) => (props.layout === 'horizontal' ? '12px' : '0')};

	@media (max-width: 768px) {
		display: grid;
		grid-template-columns: 1fr;
		gap: 12px;
		overflow-x: visible;
		flex-wrap: wrap;
		margin-top: ${(props) => (props.layout === 'horizontal' ? '10px' : '40px')};
		margin-bottom: 16px;
	}
`;

export const PricingCard = styled.div<{
	isPopular?: boolean;
	isCurrentPlan?: boolean;
	layout?: 'grid' | 'horizontal';
}>`
	background: ${(props) =>
		props.isCurrentPlan ? COLORS.primary : COLORS.bgWhite};
	border: ${(props) =>
		props.isPopular
			? `3px solid ${COLORS.primary}`
			: `1.5px solid ${COLORS.gray200}`};
	border-radius: ${(props) => (props.layout === 'horizontal' ? '8px' : '12px')};
	padding: ${(props) =>
		props.layout === 'horizontal' ? '20px 16px' : '40px 30px'};
	position: relative;
	transition: all 0.3s ease;
	display: flex;
	flex-direction: column;
	box-shadow: ${(props) => (props.isPopular ? COLORS.shadowLg : COLORS.shadow)};
	min-width: ${(props) => (props.layout === 'horizontal' ? '260px' : 'auto')};
	max-width: ${(props) => (props.layout === 'horizontal' ? '320px' : 'none')};
	flex: ${(props) =>
		props.layout === 'horizontal' ? '0 0 280px' : '1 1 auto'};
	overflow: visible;
	margin-top: 20px;

	&:hover {
		transform: translateY(-5px);
		box-shadow: ${COLORS.shadowXl};
		border-color: ${COLORS.primary};
	}

	@media (max-width: 768px) {
		padding: ${(props) =>
			props.layout === 'horizontal' ? '16px 12px' : '30px 20px'};
		margin-top: 0;
	}
`;

export const PopularBadge = styled.span<{ variant?: 'full' | 'embedded' }>`
	position: absolute;
	top: -15px;
	left: 50%;
	transform: translateX(-50%);
	background: ${COLORS.primary};
	color: white;
	padding: 6px 16px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	white-space: nowrap;
	overflow: visible;
`;

export const PlanName = styled.h3<{ color?: 'white' | 'black' }>`
	font-size: 24px;
	font-weight: 800;
	margin: 0 0 15px 0;
	color: ${(props) => (props.color === 'white' ? 'white' : 'inherit')};
`;

export const PlanPrice = styled.div<{ color?: 'white' | 'black' }>`
	margin-bottom: 10px;

	.price {
		font-size: 42px;
		font-weight: 800;
		color: ${(props) => (props.color === 'white' ? 'white' : COLORS.primary)};

		@media (max-width: 768px) {
			font-size: 32px;
		}
	}

	.period {
		font-size: 16px;
		color: ${(props) =>
			props.color === 'white'
				? 'rgba(255, 255, 255, 0.8)'
				: COLORS.textSecondary};
		margin-top: 5px;
	}
`;

export const PlanFeatures = styled.ul`
	list-style: none;
	padding: 0;
	margin: 30px 0;
	flex-grow: 1;
`;

export const PlanFeature = styled.li<{ color?: 'white' | 'black' }>`
	font-size: 15px;
	padding: 12px 0;
	color: ${(props) =>
		props.color === 'white' ? 'rgba(255, 255, 255, 0.9)' : COLORS.textPrimary};
	display: flex;
	align-items: center;
	gap: 10px;

	&::before {
		content: '✓';
		font-weight: 800;
		color: ${(props) => (props.color === 'white' ? 'white' : COLORS.primary)};
		font-size: 18px;
	}
`;

export const SelectPlanButton = styled.button<{ isCurrentPlan?: boolean }>`
	width: 100%;
	padding: 14px 24px;
	font-size: 16px;
	font-weight: 700;
	border: none;
	border-radius: 8px;
	background: ${(props) =>
		props.isCurrentPlan ? 'rgba(255, 255, 255, 0.2)' : COLORS.primary};
	color: ${(props) => (props.isCurrentPlan ? 'white' : COLORS.bgWhite)};
	cursor: pointer;
	transition: all 0.3s ease;
	border: ${(props) => (props.isCurrentPlan ? '2px solid white' : 'none')};

	&:hover {
		opacity: 0.9;
		transform: translateY(-2px);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		padding: 12px 20px;
		font-size: 14px;
	}
`;

export const CurrentPlanLabel = styled.span`
	font-size: 12px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	opacity: 0.8;
`;

export const UpgradeMessage = styled.div`
	background: #fff3cd;
	border: 1px solid #ffc107;
	border-radius: 8px;
	padding: 20px;
	margin-bottom: 40px;
	color: #856404;
	text-align: center;
	font-weight: 500;

	@media (max-width: 768px) {
		padding: 15px;
		font-size: 14px;
	}
`;

export const ButtonGroup = styled.div`
	display: flex;
	gap: 15px;
	justify-content: center;
	flex-wrap: wrap;

	@media (max-width: 768px) {
		flex-direction: column;
		gap: 10px;
	}
`;

export const ContactSalesButton = styled.button`
	padding: 12px 32px;
	font-size: 16px;
	font-weight: 600;
	border: 2px solid ${COLORS.primary};
	border-radius: 8px;
	background: transparent;
	color: ${COLORS.primary};
	cursor: pointer;
	transition: all 0.3s ease;

	&:hover {
		background: ${COLORS.primary};
		color: white;
	}
`;

export const AdditionalOptionsContainer = styled.div<{
	layout?: 'grid' | 'horizontal';
}>`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: ${(props) => (props.layout === 'horizontal' ? '16px' : '24px')};
	margin-top: ${(props) => (props.layout === 'horizontal' ? '20px' : '40px')};

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 16px;
		margin-top: 16px;
	}
`;

export const PromoSection = styled.div<{ layout?: 'grid' | 'horizontal' }>`
	background: ${COLORS.bgWhite};
	border: 1.5px solid ${COLORS.gray200};
	border-radius: ${(props) => (props.layout === 'horizontal' ? '8px' : '12px')};
	padding: ${(props) => (props.layout === 'horizontal' ? '16px' : '30px')};
	text-align: center;
	box-shadow: ${COLORS.shadow};

	@media (max-width: 768px) {
		padding: ${(props) => (props.layout === 'horizontal' ? '14px' : '24px')};
	}
`;

export const PromoTitle = styled.h3<{ layout?: 'grid' | 'horizontal' }>`
	font-size: ${(props) => (props.layout === 'horizontal' ? '16px' : '22px')};
	font-weight: 700;
	margin: 0 0 ${(props) => (props.layout === 'horizontal' ? '6px' : '10px')} 0;
	color: ${COLORS.textPrimary};
`;

export const PromoText = styled.p<{ layout?: 'grid' | 'horizontal' }>`
	font-size: ${(props) => (props.layout === 'horizontal' ? '12px' : '15px')};
	color: ${COLORS.textSecondary};
	margin: 0 0 ${(props) => (props.layout === 'horizontal' ? '12px' : '20px')} 0;
	line-height: 1.5;
`;

export const PromoInput = styled.input<{ layout?: 'grid' | 'horizontal' }>`
	width: 100%;
	padding: ${(props) =>
		props.layout === 'horizontal' ? '8px 12px' : '12px 16px'};
	font-size: ${(props) => (props.layout === 'horizontal' ? '13px' : '15px')};
	border: 1.5px solid ${COLORS.gray200};
	border-radius: 8px;
	margin-bottom: ${(props) => (props.layout === 'horizontal' ? '8px' : '12px')};
	transition: border-color 0.3s ease;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
	}
`;

export const PromoButton = styled.button<{ layout?: 'grid' | 'horizontal' }>`
	width: 100%;
	padding: ${(props) =>
		props.layout === 'horizontal' ? '8px 16px' : '12px 24px'};
	font-size: ${(props) => (props.layout === 'horizontal' ? '13px' : '15px')};
	font-weight: 600;
	background: ${COLORS.primary};
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.3s ease;

	&:hover {
		background: ${COLORS.primaryDark};
		transform: translateY(-2px);
		box-shadow: ${COLORS.shadowMd};
	}

	&:disabled {
		background: ${COLORS.gray200};
		cursor: not-allowed;
		transform: none;
	}
`;

export const ContactSalesSection = styled.div<{
	layout?: 'grid' | 'horizontal';
}>`
	background: linear-gradient(135deg, ${COLORS.primary} 0%, #00a86b 100%);
	border-radius: ${(props) => (props.layout === 'horizontal' ? '8px' : '12px')};
	padding: ${(props) => (props.layout === 'horizontal' ? '16px' : '30px')};
	text-align: center;
	color: white;
	box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2);

	@media (max-width: 768px) {
		padding: ${(props) => (props.layout === 'horizontal' ? '14px' : '24px')};
	}
`;

export const ContactSalesTitle = styled.h3<{ layout?: 'grid' | 'horizontal' }>`
	font-size: ${(props) => (props.layout === 'horizontal' ? '16px' : '22px')};
	font-weight: 700;
	margin: 0 0 ${(props) => (props.layout === 'horizontal' ? '6px' : '10px')} 0;
	color: white;
`;

export const ContactSalesText = styled.p<{ layout?: 'grid' | 'horizontal' }>`
	font-size: ${(props) => (props.layout === 'horizontal' ? '12px' : '15px')};
	color: rgba(255, 255, 255, 0.95);
	margin: 0 0 ${(props) => (props.layout === 'horizontal' ? '12px' : '20px')} 0;
	line-height: 1.5;
`;

export const ContactSalesButtonStyled = styled.button<{
	layout?: 'grid' | 'horizontal';
}>`
	padding: ${(props) =>
		props.layout === 'horizontal' ? '8px 20px' : '12px 32px'};
	font-size: ${(props) => (props.layout === 'horizontal' ? '13px' : '15px')};
	font-weight: 600;
	background: white;
	color: ${COLORS.primary};
	border: none;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.3s ease;

	&:hover {
		background: ${COLORS.bgLight};
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
`;
