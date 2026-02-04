import styled from 'styled-components';

export const Wrapper = styled.div`
	display: grid;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	width: 100vw;
	background: linear-gradient(112.6deg, #ffffff, #dddddd, #aaaaaa);
	padding: 20px 0;

	@media (max-width: 480px) {
		padding: 16px 0;
	}
`;
