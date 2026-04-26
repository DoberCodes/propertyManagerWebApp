import styled from 'styled-components';
import { COLORS } from 'constants/colors';

export const AnimatedTip = styled.p`
	font-size: 1.1rem;
	color: #333;
	font-weight: bold;
	text-align: center;
	margin: 15px 0;
	animation: fadeIn 0.5s ease-in-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

export const Container = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	padding: 0;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	overflow: hidden;
	gap: 12px;
`;

export const ForecastGrid = styled.div`
	display: flex;
	gap: 12px;
	justify-content: center;
	flex-wrap: nowrap;
	overflow-x: auto;
	padding: 8px 0;
	width: 100%;
`;

export const ForecastDay = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 64px;
	font-size: 12px;
	color: #333;

	img {
		width: 48px;
		height: 48px;
	}
`;

export const HourlyGrid = styled(ForecastGrid)`
	/* reuse ForecastGrid but allow more compact items if needed */
	gap: 8px;
`;

export const AlertBanner = styled.div`
	width: 100%;
	background: #fef3c7; /* light yellow */
	color: #92400e;
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 13px;
	margin-bottom: 8px;
	text-align: center;
`;

export const ViewControls = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
	justify-content: center;
	width: 100%;
	margin-bottom: 8px;
`;

export const ViewButton = styled.button<{ $active?: boolean }>`
	padding: 6px 10px;
	border-radius: 6px;
	border: 1px solid #e5e7eb;
	background: ${({ $active }) => ($active ? '#10b981' : 'white')};
	color: ${({ $active }) => ($active ? 'white' : '#111827')};
	cursor: pointer;
	font-size: 13px;
`;

export const Header = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	margin-bottom: 15px;

	form {
		display: flex;
		flex-direction: column;
		align-items: center;

		label {
			font-size: 1rem;
			color: #555;
			margin-bottom: 8px;
		}

		input {
			padding: 10px;
			border: 1px solid #ddd;
			border-radius: 6px;
			margin-bottom: 10px;
			width: 100%;
			max-width: 320px;
		}

		button {
			padding: 10px 20px;
			background-color: #007bff;
			color: #fff;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			transition: background-color 0.3s;

			&:hover {
				background-color: #0056b3;
			}
		}
	}
`;

export const WeatherInfo = styled.div`
	text-align: center;
	margin-bottom: 10px;
	flex-grow: 1;

	h3 {
		margin: 0;
		font-size: 1.2rem;
		color: #333;
	}

	p {
		margin: 5px 0;
		font-size: 0.9rem;
		color: #555;
	}

	img {
		margin-top: 5px;
		max-height: 50px;
	}
`;

export const Recommendation = styled.p`
	font-size: 13px;
	color: #10b981;
	font-weight: 600;
	margin: 0;
`;

export const TipText = styled.p`
	font-size: 13px;
	color: #1f2937;
	font-weight: 500;
	margin: 0;
	text-align: center;
	line-height: 1.5;
	animation: fadeIn 0.5s ease-in-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

export const SnoozedEmptyState = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 24px 20px;
	text-align: center;
	align-items: center;
	p {
		margin: 0;
		font-size: 0.88rem;
		color: ${COLORS.textSecondary};
		line-height: 1.5;
	}
	button {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.82rem;
		font-weight: 700;
		color: ${COLORS.primary};
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
`;

export const ZeroStateContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	text-align: center;

	icon {
		font-size: 48px;
		opacity: 0.3;
	}

	p {
		margin: 0;
		font-size: 14px;
		color: #999999;
	}
`;

/* New card-based layout for seasonal tips */
export const TipsContainer = styled.div<{ $compact?: boolean }>`
	width: 100%;
	align-self: stretch;
	background: #ffffff;
	border: 1px solid rgba(16, 24, 40, 0.04);
	border-radius: 12px;
	padding: ${({ $compact }) => ($compact ? '16px' : '24px')};
	box-shadow: 0 10px 30px rgba(16, 24, 40, 0.06);
	/* wider layout on large screens */
	max-width: ${({ $compact }) => ($compact ? '100%' : '1400px')};
	margin: 0 auto;

	@media (min-width: 1600px) {
		max-width: ${({ $compact }) => ($compact ? '100%' : '1600px')};
		padding: ${({ $compact }) => ($compact ? '16px' : '32px')};
	}
`;

export const TipsHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	color: #0f172a;
	padding: 6px 4px 16px 4px;
	margin-bottom: 10px;
	font-size: 1.15rem;
	font-weight: 800;
	border-left: 4px solid ${COLORS.primary};
	padding-left: 14px;
`;

export const CardGrid = styled.div<{ $compact?: boolean }>`
	display: grid;
	grid-template-columns: ${({ $compact }) =>
		$compact ? 'minmax(0, 1fr)' : 'repeat(4, 1fr)'};
	gap: 18px;
	padding: 6px 0 0 0;

	@media (max-width: 2000px) {
		grid-template-columns: repeat(3, 1fr);
	}

	@media (max-width: 1200px) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: 900px) {
		grid-template-columns: repeat(1, 1fr);
	}
`;

export const Card = styled.div<{ $compact?: boolean }>`
	background: #ffffff;
	border: 1px solid rgba(16, 24, 40, 0.06);
	border-radius: 12px;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	min-height: ${({ $compact }) => ($compact ? 'auto' : '380px')};
	box-shadow: ${({ $compact }) => ($compact ? COLORS.shadow : COLORS.shadowLg)};
	position: relative;
	transition: transform 220ms ease, box-shadow 220ms ease;
	&:hover {
		transform: ${({ $compact }) => ($compact ? 'translateY(-2px)' : 'translateY(-8px)')};
		box-shadow: ${({ $compact }) =>
			$compact ? COLORS.shadowMd : '0 18px 40px rgba(16, 24, 40, 0.12)'};
	}
`;

export const CompactTopRow = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 10px;

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: stretch;
	}
`;

export const CompactSeasonTag = styled.span`
	font-size: 0.78rem;
	font-weight: 700;
	color: ${COLORS.textSecondary};
	text-transform: uppercase;
	letter-spacing: 0.04em;
`;

export const CompactCardBody = styled.div<{ $compact?: boolean }>`
	padding: ${({ $compact }) => ($compact ? '16px' : '18px 12px 12px 12px')};
	flex: 1 1 auto;
`;

export const CompactTeaser = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1.45fr) minmax(180px, 0.55fr);
	align-items: start;
	gap: 24px;
	padding: 16px 18px;
	border: 1px solid rgba(16, 24, 40, 0.08);
	border-radius: 14px;
	background: ${COLORS.gray50};

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
		gap: 16px;
	}
`;

export const CompactTeaserMain = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 0;
`;

export const CompactTeaserSide = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;
	padding-left: 20px;
	border-left: 1px solid rgba(16, 24, 40, 0.08);

	@media (max-width: 900px) {
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		flex-wrap: wrap;
		padding-left: 0;
		padding-top: 4px;
		border-left: 0;
		border-top: 1px solid rgba(16, 24, 40, 0.08);
	}
`;

export const CompactTeaserTitle = styled.h4`
	margin: 0;
	font-size: 1rem;
	font-weight: 800;
	color: ${COLORS.textPrimary};
`;

export const CompactTeaserSummary = styled.p`
	margin: 0;
	font-size: 0.88rem;
	font-weight: 600;
	line-height: 1.45;
	color: ${COLORS.textPrimary};
`;

export const CompactTeaserList = styled.ul`
	margin: 0;
	padding-left: 18px;
	font-size: 0.82rem;
	line-height: 1.5;
	color: ${COLORS.textSecondary};

	li + li {
		margin-top: 6px;
	}
`;

export const CompactTeaserMeta = styled.div<{ $urgency?: 'warning' | 'danger' }>`
	font-size: 0.82rem;
	font-weight: 600;
	line-height: 1.45;
	color: ${({ $urgency }) =>
		$urgency === 'danger'
			? COLORS.alertError
			: $urgency === 'warning'
			? COLORS.alertWarning
			: COLORS.textSecondary};
	${({ $urgency }) =>
		$urgency
			? `
				background: ${$urgency === 'danger' ? COLORS.alertErrorBg : COLORS.alertWarningBg};
				border-radius: 6px;
				padding: 4px 8px;
			`
			: ''}
`;

export const CompactTeaserFooter = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	margin-top: 6px;
	padding-top: 12px;
	border-top: 1px solid rgba(16, 24, 40, 0.08);

	@media (max-width: 900px) {
		flex-direction: column;
		align-items: flex-start;
	}
`;

export const CompactPager = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
	flex-wrap: wrap;

	@media (max-width: 900px) {
		justify-content: flex-start;
	}
`;

export const CompactActionButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 38px;
	padding: 0 14px;
	border-radius: 10px;
	border: 1px solid ${COLORS.primary};
	background: ${COLORS.primary};
	color: ${COLORS.bgWhite};
	font-size: 0.82rem;
	font-weight: 700;
	cursor: pointer;
	transition: background 180ms ease, border-color 180ms ease, opacity 180ms ease;

	&:hover:not(:disabled) {
		background: ${COLORS.primaryDark};
		border-color: ${COLORS.primaryDark};
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.55;
		background: ${COLORS.gray300};
		border-color: ${COLORS.gray300};
		color: ${COLORS.gray700};
	}
`;

export const CompactSideActions = styled.div`
	display: flex;
	flex-direction: row;
	gap: 8px;
	flex-wrap: wrap;
	align-items: center;
`;

export const SnoozeButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 32px;
	padding: 0 12px;
	border-radius: 10px;
	border: 1px solid ${COLORS.gray300};
	background: transparent;
	color: ${COLORS.textSecondary};
	font-size: 0.78rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 180ms ease, border-color 180ms ease, color 180ms ease;

	&:hover {
		background: ${COLORS.gray100};
		border-color: ${COLORS.gray400 ?? COLORS.gray300};
		color: ${COLORS.textPrimary};
	}
`;

export const CardImageWrapper = styled.div<{ $compact?: boolean }>`
	position: relative;
	width: 100%;
	height: ${({ $compact }) => ($compact ? '220px' : '300px')};
	overflow: visible;
	background: ${COLORS.gray100};
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	margin-bottom: 44px;
`;

export const OverlayBadge = styled.div<{ $season?: string }>`
	position: absolute;
	left: 0;
	right: 0;
	bottom: -24px;
	margin: 0 auto;
	height: 52px;
	display: flex;
	align-items: center;
	justify-content: space-around;
	padding: 0 18px;
	font-size: 13px;
	box-shadow: 0 8px 22px rgba(16, 24, 40, 0.06);
	z-index: 34;
	background: ${({ $season }) =>
		$season === 'spring'
			? `linear-gradient(90deg, ${COLORS.successLight})`
			: $season === 'summer'
			? `linear-gradient(90deg, ${COLORS.warningLight})`
			: $season === 'fall'
			? `linear-gradient(90deg, ${COLORS.warningLight})`
			: $season === 'winter'
			? `linear-gradient(90deg, ${COLORS.infoLight})`
			: `linear-gradient(90deg, ${COLORS.infoLight})`};
	color: ${({ $season }) =>
		$season === 'spring'
			? COLORS.successDark
			: $season === 'summer'
			? COLORS.warningDark
			: $season === 'fall'
			? COLORS.errorDark
			: $season === 'winter'
			? COLORS.infoDark
			: COLORS.gray900};
`;

export const PriorityPill = styled.span<{ level?: string; $season?: string }>`
	padding: 6px 10px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 700;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	/* base color by priority */
	color: ${({ level }) =>
		level === 'High'
			? COLORS.errorDark
			: level === 'Moderate'
			? COLORS.warningDark
			: COLORS.gray700};
	/* tint by season for subtle cohesion */
	background: ${({ level, $season }) => {
		const baseHigh = 'rgba(239,68,68,0.06)';
		const baseMed = 'rgba(245,158,11,0.06)';
		const baseLow = 'rgba(107,114,128,0.06)';
		// seasonal overlay tints
		if ($season === 'spring') {
			return level === 'High'
				? 'rgba(185,28,28,0.06)'
				: level === 'Moderate'
				? 'rgba(20,184,166,0.06)'
				: 'rgba(107,114,128,0.06)';
		}
		if ($season === 'summer') {
			return level === 'High'
				? baseHigh
				: level === 'Moderate'
				? 'rgba(245,158,11,0.08)'
				: baseLow;
		}
		if ($season === 'fall') {
			return level === 'High'
				? 'rgba(185,28,28,0.06)'
				: level === 'Moderate'
				? 'rgba(180,83,9,0.08)'
				: baseLow;
		}
		// winter
		if ($season === 'winter') {
			return level === 'High'
				? 'rgba(239,68,68,0.04)'
				: level === 'Moderate'
				? 'rgba(59,130,246,0.06)'
				: 'rgba(107,114,128,0.06)';
		}
		return level === 'High'
			? baseHigh
			: level === 'Moderate'
			? baseMed
			: baseLow;
	}};
	border: 1px solid
		${({ level }) =>
			level === 'High'
				? COLORS.error
				: level === 'Moderate'
				? COLORS.warning
				: 'rgba(99,102,106,0.12)'};
	box-shadow: none;
`;

export const CardTitle = styled.h4<{ $compact?: boolean }>`
	margin: 0 0 12px 0;
	font-size: ${({ $compact }) => ($compact ? '1.1rem' : '1.25rem')};
	color: #0f172a;
	text-align: center;
	font-weight: 800;
	position: relative;
	&:after {
		content: '';
		display: block;
		width: 48px;
		height: 3px;
		background: ${COLORS.gray900};
		margin: 8px auto 0 auto;
		border-radius: 2px;
	}
`;

export const CardList = styled.ul<{ $compact?: boolean }>`
	margin: 0;
	padding: ${({ $compact }) => ($compact ? '0 18px' : '0 24px')};
	font-size: ${({ $compact }) => ($compact ? '13px' : '14px')};
	color: #111827;
	line-height: 1.6;
	li {
		margin-bottom: 8px;
	}
`;

export const CardFooter = styled.div`
	font-size: 12px;
	color: #6b7280;
	text-align: right;
`;

export const FooterRow = styled.div<{ $season?: string; $compact?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: ${({ $compact }) => ($compact ? '10px 16px' : '0 18px')};
	height: ${({ $compact }) => ($compact ? 'auto' : '64px')};
	background: ${({ $season }) =>
		$season === 'spring'
			? `linear-gradient(90deg, ${COLORS.successLight})`
			: $season === 'summer'
			? `linear-gradient(90deg, ${COLORS.warningLight})`
			: $season === 'fall'
			? `linear-gradient(90deg, ${COLORS.warningLight})`
			: $season === 'winter'
			? `linear-gradient(90deg, ${COLORS.infoLight})`
			: `linear-gradient(90deg, ${COLORS.infoLight})`};
`;

export const FooterLeft = styled.div`
	font-size: 12px;
	color: #6b7280;
	text-transform: uppercase;
	font-weight: 600;
	letter-spacing: 0.6px;
`;

export const FooterRight = styled.div``;

export const SmallBadge = styled.span`
	display: inline-block;
	padding: 8px 16px;
	border-radius: 999px;
	background: ${COLORS.infoLight};
	color: ${COLORS.infoDark};
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 0.2px;
`;

export const Controls = styled.div<{ $compact?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: ${({ $compact }) => ($compact ? '12px' : '18px')};
	width: 100%;
	margin-top: ${({ $compact }) => ($compact ? '12px' : '18px')};
	flex-wrap: wrap;
`;

export const PageBadge = styled.div`
	background: white;
	color: ${COLORS.primary};
	padding: 6px 12px;
	border-radius: 16px;
	font-weight: 800;
	border: 1px solid rgba(14, 165, 168, 0.12);
`;
