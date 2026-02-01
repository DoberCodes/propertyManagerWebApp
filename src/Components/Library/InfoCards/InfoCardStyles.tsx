import styled from 'styled-components';

/**
 * Shared info card and grid components for displaying key-value pairs
 * Used across PropertyDetailPage, UnitDetailPage, SuiteDetailPage, and other detail views
 */

/**
 * Responsive grid for displaying info cards
 */
export const InfoGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 16px;
	margin-bottom: 20px;

	@media (max-width: 768px) {
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	}

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
		gap: 10px;
	}
`;

/**
 * Individual info card for displaying a single piece of information
 */
export const InfoCard = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 16px;
	transition: all 0.2s ease;

	&:hover {
		background: #f3f4f6;
		border-color: #d1d5db;
	}

	@media (max-width: 768px) {
		padding: 14px;
	}

	@media (max-width: 480px) {
		padding: 12px;
	}
`;

/**
 * Label for info card
 */
export const InfoLabel = styled.label`
	display: block;
	font-size: 12px;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-bottom: 8px;

	@media (max-width: 480px) {
		font-size: 11px;
		margin-bottom: 6px;
	}
`;

/**
 * Value display for info card
 */
export const InfoValue = styled.p`
	margin: 0;
	font-size: 16px;
	color: #1f2937;
	font-weight: 500;
	word-break: break-word;

	@media (max-width: 768px) {
		font-size: 15px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
	}
`;

/**
 * Section container for grouping related content
 */
export const SectionContainer = styled.div`
	padding: 16px 0;

	@media (max-width: 480px) {
		padding: 12px 0;
	}
`;

/**
 * Section header/title
 */
export const SectionHeader = styled.h2`
	font-size: 18px;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 16px 0;

	@media (max-width: 768px) {
		font-size: 17px;
		margin: 0 0 14px 0;
	}

	@media (max-width: 480px) {
		font-size: 16px;
		margin: 0 0 12px 0;
	}
`;
