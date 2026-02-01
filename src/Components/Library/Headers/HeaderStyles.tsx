import styled from 'styled-components';

/**
 * Shared header/gradient header styles used across detail pages
 * These components provide consistent green gradient headers with responsive behavior
 */

/**
 * Green gradient header used in UnitDetailPage, SuiteDetailPage, and other detail views
 */
export const GradientHeader = styled.div`
	position: relative;
	background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
	padding: 30px 20px;
	color: white;
	flex-shrink: 0;

	@media (max-width: 768px) {
		padding: 22px 18px;
	}

	@media (max-width: 480px) {
		padding: 18px 16px;
	}
`;

export const HeaderContent = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 12px;

	@media (max-width: 768px) {
		gap: 10px;
	}

	@media (max-width: 480px) {
		gap: 8px;
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
	background: #ecfdf3;
	color: #16a34a;
	border: 1px solid #bbf7d0;
	padding: 6px 10px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: uppercase;

	@media (max-width: 480px) {
		padding: 4px 8px;
		font-size: 10px;
	}
`;

/**
 * Back/navigation button styled for use on gradient backgrounds
 */
export const HeaderBackButton = styled.button`
	background: rgba(255, 255, 255, 0.15);
	color: white;
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
		padding: 6px 10px;
		font-size: 12px;
	}
`;

/**
 * Primary heading for use on gradient backgrounds
 */
export const HeaderTitle = styled.h1`
	margin: 0;
	font-size: 28px;
	font-weight: 600;
	color: white;

	@media (max-width: 768px) {
		font-size: 22px;
	}

	@media (max-width: 480px) {
		font-size: 20px;
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
		font-size: 13px;
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
		font-size: 13px;
	}
`;
