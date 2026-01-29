/**
 * Standardized Page Header Components
 * Used consistently across all page types
 */

import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';

/**
 * Main page wrapper - provides consistent structure
 */
const PageWrapper = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	background-color: ${COLORS.bgLight};
`;

/**
 * Primary page header - for main page title and top-level controls
 * Used on: TeamPage, PropertiesTab, UserProfile, ReportPage
 */
const PageHeaderSection = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 24px;
	padding: 24px;
	background-color: ${COLORS.bgWhite};
	border-bottom: 2px solid ${COLORS.border};
	flex-wrap: wrap;
	box-shadow: ${COLORS.shadow};

	@media (max-width: 768px) {
		gap: 16px;
		padding: 20px;
	}

	@media (max-width: 480px) {
		gap: 12px;
		padding: 16px;
		flex-direction: column;
		align-items: flex-start;
	}
`;

/**
 * Main page title - h1 level heading
 * Large, bold, primary color
 */
const PageTitle = styled.h1`
	font-size: 32px;
	font-weight: 800;
	color: ${COLORS.textPrimary};
	margin: 0;
	letter-spacing: 0.5px;
	flex-shrink: 0;

	@media (max-width: 768px) {
		font-size: 28px;
	}

	@media (max-width: 480px) {
		font-size: 24px;
	}
`;

/**
 * Hero header - for detail pages with background images
 * Used on: PropertyDetailPage
 */
const HeroHeader = styled.div`
	position: relative;
	height: 180px;
	background-size: cover;
	background-position: center;
	background-color: ${COLORS.gray300};
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	padding: 60px 24px 20px;
	gap: 16px;
	flex-shrink: 0;

	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			to bottom,
			${COLORS.overlayLight},
			${COLORS.overlay}
		);
		pointer-events: none;
	}

	@media (max-width: 768px) {
		height: 160px;
		padding: 40px 20px 15px;
	}

	@media (max-width: 480px) {
		height: 140px;
		padding: 25px 16px 10px;
		gap: 12px;
	}
`;

/**
 * Hero content container - holds title and controls within hero header
 */
const HeroContent = styled.div`
	position: relative;
	z-index: 2;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 12px;
	}
`;

/**
 * Hero page title - large white text for detail pages
 * Used on: PropertyDetailPage
 */
const HeroTitle = styled.h1`
	color: ${COLORS.bgWhite};
	font-size: 36px;
	font-weight: 800;
	margin: 0;
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	letter-spacing: 0.5px;

	@media (max-width: 768px) {
		font-size: 28px;
	}

	@media (max-width: 480px) {
		font-size: 22px;
	}
`;

/**
 * Section header - h2 level for subsections within a page
 */
const SectionHeader = styled.h2`
	font-size: 20px;
	font-weight: 700;
	color: ${COLORS.textPrimary};
	margin: 0 0 16px 0;
	letter-spacing: 0.25px;

	@media (max-width: 768px) {
		font-size: 18px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;

/**
 * Subsection header - h3 level for nested sections
 */
const SubsectionHeader = styled.h3`
	font-size: 16px;
	font-weight: 600;
	color: ${COLORS.textPrimary};
	margin: 0 0 12px 0;
	letter-spacing: 0.25px;

	@media (max-width: 480px) {
		font-size: 14px;
	}
`;

/**
 * Group/Card header - for sections like team groups, property groups
 */
const GroupHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	padding: 16px;
	background-color: ${COLORS.gray50};
	border-bottom: 2px solid ${COLORS.border};
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 8px;
		padding: 12px;
	}
`;

/**
 * Group/Card title - h3 level for group headers
 */
const GroupTitle = styled.h3`
	font-size: 18px;
	font-weight: 600;
	color: ${COLORS.textPrimary};
	margin: 0;
	flex-grow: 1;

	@media (max-width: 768px) {
		font-size: 16px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
	}
`;

export {
	PageWrapper,
	PageHeaderSection,
	PageTitle,
	HeroHeader,
	HeroContent,
	HeroTitle,
	SectionHeader,
	SubsectionHeader,
	GroupHeader,
	GroupTitle,
};
