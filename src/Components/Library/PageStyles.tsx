import styled from 'styled-components';

/**
 * Shared page layout styles used across various pages
 * Provides consistent page wrapper, header, and content container styles
 */

export const PageWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
	min-height: 100%;
	background-color: #fafafa;

	@media (max-width: 768px) {
		padding: 15px;
		gap: 15px;
	}

	@media (max-width: 480px) {
		padding: 10px;
		gap: 10px;
	}
`;

export const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20px;
	padding-bottom: 20px;
	border-bottom: 2px solid #e5e7eb;
	flex-wrap: wrap;

	@media (max-width: 768px) {
		gap: 15px;
		padding-bottom: 15px;
	}

	@media (max-width: 480px) {
		gap: 10px;
		padding-bottom: 15px;
		flex-direction: column;
	}
`;

export const PageTitle = styled.h1`
	font-size: 28px;
	font-weight: 700;
	color: #1f2937;
	margin: 0;

	@media (max-width: 768px) {
		font-size: 24px;
	}

	@media (max-width: 480px) {
		font-size: 20px;
	}
`;

export const PageContentWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

export const ContentContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	max-width: 1200px;
	width: 100%;
	margin: 0 auto;

	@media (max-width: 768px) {
		gap: 15px;
	}

	@media (max-width: 480px) {
		gap: 10px;
	}
`;

export const Section = styled.div`
	background: white;
	border-radius: 8px;
	padding: 20px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

	@media (max-width: 768px) {
		padding: 15px;
		border-radius: 6px;
	}

	@media (max-width: 480px) {
		padding: 12px;
	}
`;

export const SectionTitle = styled.h2`
	font-size: 18px;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 12px 0;

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;
