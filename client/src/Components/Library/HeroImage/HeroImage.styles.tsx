import styled from 'styled-components';

export const HeroImageWrapper = styled.div`
	width: 100%;
	max-width: 1440px;
	height: 100%;
	min-height: 100vh;
	display: grid;
	margin: 0 auto;
	justify-items: center;
	align-content: center;
	padding: 20px;

	@media (max-width: 768px) {
		min-height: 80vh;
		padding: 15px;
	}

	@media (max-width: 480px) {
		min-height: 60vh;
		padding: 10px;
	}
`;

export const HeroImageTitle = styled.h3`
	font-size: 32px;
	font-weight: 600;
	padding: 25px;
	text-align: center;

	@media (max-width: 768px) {
		font-size: 24px;
		padding: 20px;
	}

	@media (max-width: 480px) {
		font-size: 18px;
		padding: 15px;
	}
`;

export const HeroImageSubtitle = styled.h4`
	font-size: 20px;
	font-weight: 400;
	padding: 25px;
	text-align: center;

	@media (max-width: 768px) {
		font-size: 16px;
		padding: 15px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		padding: 10px;
	}
`;
