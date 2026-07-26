import styled from 'styled-components';

/**
 * Shared info card and grid components for displaying key-value pairs
 * Used across property, equipment, and other detail views
 */

/**
 * Responsive grid for displaying info cards
 */
export const InfoGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 16px;
	margin-bottom: 20px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 14px;
	}

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
		gap: 12px;
		margin-bottom: 16px;
	}
`;

/**
 * Individual info card for displaying a single piece of information
 */
export const InfoCard = styled.div`
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	padding: 16px;
	transition: all 0.2s ease;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

	&:hover {
		border-color: #cbd5e1;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
	}

	@media (max-width: 1024px) {
		padding: 15px;
	}

	@media (max-width: 480px) {
		padding: 15px;
	}
`;

/**
 * Label for info card
 */
export const InfoLabel = styled.label`
	display: block;
	font-size: 11px;
	font-weight: 700;
	color: #64748b;
	text-transform: uppercase;
	letter-spacing: 0.07em;
	margin-bottom: 6px;

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
	font-size: 15px;
	color: #0f172a;
	font-weight: 600;
	word-break: break-word;

	@media (max-width: 1024px) {
		font-size: 15px;
	}

	@media (max-width: 480px) {
		font-size: 15px;
		line-height: 1.4;
	}
`;

/**
 * Section container for grouping related content
 */
export const SectionContainer = styled.div`
	padding: 16px 0;
	width: 100%;
	height: auto;
	min-height: 100%;

	@media (max-width: 1024px) {
		padding: 14px 0;
	}

	@media (max-width: 480px) {
		padding: 14px 0;
	}
`;

/**
 * Section header/title
 */
export const SectionHeader = styled.h2`
	font-size: 16px;
	font-weight: 800;
	color: #0f172a;
	margin: 0 0 16px 0;
	letter-spacing: -0.01em;

	@media (max-width: 1024px) {
		font-size: 16px;
		margin: 0 0 15px 0;
	}

	@media (max-width: 480px) {
		font-size: 16px;
		margin: 0 0 14px 0;
	}
`;
