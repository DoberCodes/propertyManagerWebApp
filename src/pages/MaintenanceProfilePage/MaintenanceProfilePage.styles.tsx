import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const ProfileHero = styled.section`
	display: grid;
	grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr);
	gap: 16px;
	padding: 22px;
	border: 1px solid rgba(4, 120, 87, 0.18);
	border-radius: 18px;
	background: linear-gradient(135deg, #f4fbf7 0%, #ffffff 100%);
	box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
		padding: 18px;
	}
`;

export const HeroEyebrow = styled.div`
	color: ${COLORS.primaryDark};
	font-size: 0.76rem;
	font-weight: 850;
	letter-spacing: 0.08em;
	text-transform: uppercase;
`;

export const HeroTitle = styled.h1`
	margin: 8px 0 8px;
	color: ${COLORS.textPrimary};
	font-size: clamp(1.75rem, 4vw, 2.55rem);
	font-weight: 850;
	line-height: 1.08;
`;

export const HeroSubtitle = styled.p`
	margin: 0;
	max-width: 780px;
	color: ${COLORS.textSecondary};
	font-size: 0.98rem;
	line-height: 1.55;
`;

export const HeroActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-top: 18px;
`;

export const PrimaryAction = styled.button`
	min-height: 42px;
	padding: 0 16px;
	border: none;
	border-radius: 10px;
	background: ${COLORS.primary};
	color: ${COLORS.textInverse};
	font-size: 0.88rem;
	font-weight: 850;
	cursor: pointer;
	box-shadow: 0 10px 20px rgba(4, 120, 87, 0.18);

	&:hover {
		background: ${COLORS.primaryHover};
	}
`;

export const SecondaryAction = styled.button`
	min-height: 42px;
	padding: 0 14px;
	border: 1px solid rgba(4, 120, 87, 0.28);
	border-radius: 10px;
	background: ${COLORS.white};
	color: ${COLORS.primaryDark};
	font-size: 0.86rem;
	font-weight: 800;
	cursor: pointer;

	&:hover {
		background: ${COLORS.successLight};
	}
`;

export const HeroStats = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 10px;
`;

export const StatCard = styled.div`
	padding: 14px;
	border: 1px solid ${COLORS.border};
	border-radius: 14px;
	background: rgba(255, 255, 255, 0.86);
`;

export const StatLabel = styled.div`
	color: ${COLORS.textSecondary};
	font-size: 0.68rem;
	font-weight: 850;
	letter-spacing: 0.06em;
	text-transform: uppercase;
`;

export const StatValue = styled.div<{ $tone?: 'danger' | 'warning' | 'success' }>`
	margin-top: 4px;
	color: ${(props) =>
		props.$tone === 'danger'
			? COLORS.errorDark
			: props.$tone === 'warning'
				? COLORS.warningDark
				: props.$tone === 'success'
					? COLORS.primaryDark
					: COLORS.textPrimary};
	font-size: 1.05rem;
	font-weight: 850;
	line-height: 1.25;
`;

export const ProfileGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(300px, 0.42fr);
	gap: 16px;
	align-items: start;

	@media (max-width: 960px) {
		grid-template-columns: 1fr;
	}
`;

export const SectionStack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

export const ProfileSection = styled.section`
	padding: 18px;
	border: 1px solid ${COLORS.border};
	border-radius: 16px;
	background: ${COLORS.white};
	box-shadow: ${COLORS.shadow};
`;

export const SectionTitle = styled.h2`
	margin: 0 0 10px;
	color: ${COLORS.textPrimary};
	font-size: 1.08rem;
	font-weight: 850;
`;

export const SectionText = styled.p`
	margin: 0;
	color: ${COLORS.textSecondary};
	font-size: 0.92rem;
	line-height: 1.55;
`;

export const RelationshipGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;

	@media (max-width: 520px) {
		grid-template-columns: 1fr;
	}
`;

export const RelationshipCard = styled.button`
	text-align: left;
	padding: 13px;
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	background: ${COLORS.bgLight};
	color: inherit;
	cursor: pointer;

	&:disabled {
		cursor: default;
		opacity: 0.72;
	}

	&:not(:disabled):hover {
		border-color: ${COLORS.primary};
		background: ${COLORS.successLight};
	}
`;

export const RelationshipLabel = styled.div`
	color: ${COLORS.textSecondary};
	font-size: 0.68rem;
	font-weight: 850;
	letter-spacing: 0.05em;
	text-transform: uppercase;
`;

export const RelationshipValue = styled.div`
	margin-top: 4px;
	color: ${COLORS.textPrimary};
	font-size: 0.92rem;
	font-weight: 850;
	line-height: 1.3;
`;

export const DetailList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const DetailRow = styled.div`
	display: flex;
	justify-content: space-between;
	gap: 14px;
	padding-bottom: 10px;
	border-bottom: 1px solid ${COLORS.borderLight};

	&:last-child {
		padding-bottom: 0;
		border-bottom: 0;
	}
`;

export const DetailLabel = styled.div`
	color: ${COLORS.textSecondary};
	font-size: 0.78rem;
	font-weight: 800;
`;

export const DetailValue = styled.div`
	color: ${COLORS.textPrimary};
	font-size: 0.86rem;
	font-weight: 800;
	text-align: right;
`;

export const InsightList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const InsightItem = styled.div`
	padding: 12px;
	border-left: 4px solid ${COLORS.primary};
	border-radius: 12px;
	background: ${COLORS.successLight};
	color: ${COLORS.primaryDark};
	font-size: 0.9rem;
	font-weight: 750;
	line-height: 1.45;
`;

export const RecordList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const RecordCard = styled.article`
	padding: 13px;
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	background: ${COLORS.bgLight};
`;

export const RecordTitle = styled.div`
	color: ${COLORS.textPrimary};
	font-size: 0.92rem;
	font-weight: 850;
`;

export const RecordMeta = styled.div`
	margin-top: 4px;
	color: ${COLORS.textSecondary};
	font-size: 0.8rem;
	font-weight: 650;
`;
