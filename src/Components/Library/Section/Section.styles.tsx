import styled from 'styled-components';

export const Wrapper = styled.div<{ background?: string }>`
	height: 100%;
	width: 100%;
	max-width: 1440px;
	margin: 0 auto;
	min-height: 500px;
	scroll-margin-top: 100px;
	background-color: ${(props) => props.background};
	padding: 20px;

	@media (max-width: 768px) {
		min-height: 400px;
		padding: 15px;
		scroll-margin-top: 80px;
	}

	@media (max-width: 480px) {
		min-height: 300px;
		padding: 10px;
		scroll-margin-top: 70px;
	}
`;
