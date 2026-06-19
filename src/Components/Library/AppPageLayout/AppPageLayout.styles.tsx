import styled from 'styled-components';

export const AppPage = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;
	min-height: 0;
	width: 100%;

	&::after {
		content: '';
		display: block;
		width: 100%;
		height: max(16px, calc(var(--mobile-bottom-nav-offset, 0px) + 16px));
		flex: 0 0 auto;
	}

	@media (max-width: 1024px) {
		gap: 15px;

		&::after {
			height: calc(var(--mobile-bottom-nav-offset, 0px) + 18px);
		}
	}

	@media (max-width: 480px) {
		gap: 12px;

		&::after {
			height: calc(var(--mobile-bottom-nav-offset, 0px) + 16px);
		}
	}
`;

export const AppPageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 20px;
	flex-wrap: wrap;

	@media (max-width: 768px) {
		gap: 14px;
	}

	@media (max-width: 480px) {
		gap: 12px;
	}
`;

export const AppPageTitleBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
`;

export const AppPageTitle = styled.h1`
	margin: 0;
	font-size: 28px;
	font-weight: 700;
	color: #1f2937;

	@media (max-width: 1024px) {
		font-size: 24px;
	}

	@media (max-width: 480px) {
		font-size: 20px;
	}
`;

export const AppPageSubtitle = styled.p`
	margin: 0;
	font-size: 14px;
	line-height: 1.5;
	color: #6b7280;
	max-width: 720px;

	@media (max-width: 480px) {
		font-size: 13px;
	}
`;