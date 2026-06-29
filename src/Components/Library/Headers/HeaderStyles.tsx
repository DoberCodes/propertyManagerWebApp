import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';

/**
 * Shared header/gradient header styles used across detail pages
 * These components provide consistent green gradient headers with responsive behavior
 */

/**
 * Green gradient header used in UnitDetailPage, SuiteDetailPage, and other detail views
 */
export const GradientHeader = styled.div`
	position: relative;
	background: ${COLORS.gradientPrimary};
	padding: 30px 20px;
	color: ${COLORS.white};
	flex-shrink: 0;

	@media (max-width: 1024px) {
		padding: 22px 18px;
	}

	@media (max-width: 480px) {
		padding: 24px 16px;
	}
`;

export const HeaderContent = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 12px;

	@media (max-width: 1024px) {
		gap: 10px;
	}

	@media (max-width: 480px) {
		gap: 12px;
	}
`;

export const HeaderTopRow = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 8px;
	}
`;

/**
 * Badge for displaying status/type information in headers
 */
export const HeaderBadge = styled.span`
	display: inline-flex;
	max-width: 100%;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	border: 1px solid rgba(4, 120, 87, 0.22);
	padding: 6px 10px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	white-space: normal;
	overflow-wrap: anywhere;
	line-height: 1.2;

	@media (max-width: 480px) {
		max-width: 42vw;
		padding: 4px 8px;
		font-size: 10px;
	}
`;

/**
 * Back/navigation button styled for use on gradient backgrounds
 */
export const HeaderBackButton = styled.button`
	background: rgba(255, 255, 255, 0.15);
	color: ${COLORS.white};
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 999px;
	padding: 8px 12px;
	cursor: pointer;
	font-weight: 600;
	font-size: 13px;
	backdrop-filter: blur(4px);
	transition: all 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.25);
		border-color: rgba(255, 255, 255, 0.5);
	}

	&:active {
		background: rgba(255, 255, 255, 0.2);
	}

	@media (max-width: 480px) {
		padding: 10px 14px;
		font-size: 14px;
		min-height: 44px;
		display: flex;
		align-items: center;
	}
`;

/**
 * Primary heading for use on gradient backgrounds
 */
export const HeaderTitle = styled.h1`
	margin: 0;
	font-size: 28px;
	font-weight: 600;
	color: ${COLORS.white};

	@media (max-width: 1024px) {
		font-size: 22px;
	}

	@media (max-width: 480px) {
		font-size: 24px;
	}
`;

/**
 * Subtitle/secondary text for use on gradient backgrounds
 */
export const HeaderSubtitle = styled.p`
	margin: 0;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.9);

	@media (max-width: 480px) {
		font-size: 15px;
	}
`;

/**
 * Muted subtitle text for use on gradient backgrounds
 */
export const HeaderSubtitleMuted = styled.p`
	margin: 0;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.8);

	@media (max-width: 480px) {
		font-size: 15px;
	}
`;
