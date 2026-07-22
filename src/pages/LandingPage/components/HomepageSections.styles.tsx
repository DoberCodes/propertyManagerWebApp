import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';

export const PublicSection = styled.section<{ $tint?: boolean }>`
	width: 100%;
	padding: 84px 32px;
	background: ${({ $tint }) => ($tint ? COLORS.bgLight : COLORS.bgWhite)};

	@media (max-width: 768px) {
		padding: 56px 20px;
	}

	@media (max-width: 480px) {
		padding: 44px 16px;
	}
`;

export const SectionShell = styled.div`
	width: 100%;
	max-width: 1180px;
	margin: 0 auto;
`;

export const SectionEyebrow = styled.p`
	margin: 0 0 10px;
	color: ${COLORS.primary};
	font-size: 13px;
	font-weight: 800;
	letter-spacing: 0.1em;
	text-align: center;
	text-transform: uppercase;
`;

export const SectionHeading = styled.h2`
	max-width: 820px;
	margin: 0 auto 14px;
	color: ${COLORS.textPrimary};
	font-size: 40px;
	font-weight: 800;
	line-height: 1.16;
	text-align: center;

	@media (max-width: 768px) {
		font-size: 32px;
	}

	@media (max-width: 480px) {
		font-size: 27px;
	}
`;

export const SectionIntro = styled.p`
	max-width: 760px;
	margin: 0 auto 34px;
	color: ${COLORS.textSecondary};
	font-size: 16px;
	line-height: 1.65;
	text-align: center;

	@media (max-width: 480px) {
		margin-bottom: 26px;
		font-size: 14px;
	}
`;

export const ProofGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 22px;

	@media (max-width: 760px) {
		grid-template-columns: 1fr;
	}
`;

export const ProofCard = styled.article<{ $wide?: boolean }>`
	display: grid;
	grid-column: ${({ $wide }) => ($wide ? '1 / -1' : 'auto')};
	grid-template-columns: ${({ $wide }) => ($wide ? 'minmax(0, 1.25fr) minmax(260px, 0.75fr)' : '1fr')};
	align-items: center;
	overflow: hidden;
	background: ${COLORS.white};
	border: 1px solid ${COLORS.border};
	border-radius: 18px;
	box-shadow: ${COLORS.shadowLg};

	@media (max-width: 760px) {
		grid-column: auto;
		grid-template-columns: 1fr;
	}
`;

export const ScreenshotFrame = styled.div`
	padding: 12px;
	background: #eaf4ef;

	img {
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid rgba(15, 23, 42, 0.1);
		border-radius: 10px;
		box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
	}
`;

export const ProofCopy = styled.div`
	padding: 24px;
`;

export const CardKicker = styled.p`
	margin: 0 0 8px;
	color: ${COLORS.primary};
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.08em;
	text-transform: uppercase;
`;

export const CardTitle = styled.h3`
	margin: 0 0 10px;
	color: ${COLORS.textPrimary};
	font-size: 22px;
	font-weight: 800;
	line-height: 1.3;
`;

export const CardText = styled.p`
	margin: 0;
	color: ${COLORS.textSecondary};
	font-size: 15px;
	line-height: 1.65;
`;

export const SectionLink = styled.a`
	display: inline-flex;
	align-items: center;
	min-height: 44px;
	margin-top: 14px;
	color: ${COLORS.primary};
	font-weight: 800;
	text-decoration: none;

	&:hover,
	&:focus-visible {
		color: ${COLORS.primaryDark};
		text-decoration: underline;
	}
`;

export const AudienceGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20px;
	max-width: 900px;
	margin: 0 auto;

	@media (max-width: 680px) {
		grid-template-columns: 1fr;
	}
`;

export const AudienceCard = styled.article`
	display: flex;
	flex-direction: column;
	padding: 28px;
	background: ${COLORS.white};
	border: 1px solid ${COLORS.border};
	border-radius: 16px;
	box-shadow: ${COLORS.shadow};

	${SectionLink} {
		margin-top: auto;
		padding-top: 8px;
	}
`;

export const TrustGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 18px;

	@media (max-width: 760px) {
		grid-template-columns: 1fr;
	}
`;

export const TrustCard = styled.article`
	padding: 22px;
	background: ${COLORS.white};
	border: 1px solid ${COLORS.border};
	border-radius: 14px;
`;

export const PricingGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 14px;

	@media (max-width: 980px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 560px) {
		grid-template-columns: 1fr;
	}
`;

export const PriceCard = styled.article<{ $featured?: boolean }>`
	display: flex;
	flex-direction: column;
	padding: 22px;
	background: ${COLORS.white};
	border: ${({ $featured }) =>
		$featured ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`};
	border-radius: 14px;
	box-shadow: ${({ $featured }) => ($featured ? COLORS.shadowLg : COLORS.shadow)};
`;

export const PriceName = styled.h3`
	margin: 0;
	color: ${COLORS.textPrimary};
	font-size: 19px;
	font-weight: 800;
`;

export const PriceValue = styled.p`
	margin: 10px 0 8px;
	color: ${COLORS.primaryDark};
	font-size: 26px;
	font-weight: 800;
`;

export const PriceDescription = styled.p`
	margin: 0;
	color: ${COLORS.textSecondary};
	font-size: 14px;
	line-height: 1.55;
`;

export const CenteredAction = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 28px;
`;

export const PrimaryPageLink = styled.a`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 46px;
	padding: 0 24px;
	background: ${COLORS.gradientPrimary};
	border-radius: 8px;
	color: ${COLORS.white};
	font-weight: 800;
	text-decoration: none;

	&:hover,
	&:focus-visible {
		box-shadow: ${COLORS.shadowLg};
		transform: translateY(-1px);
	}
`;
