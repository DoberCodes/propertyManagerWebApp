import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const Wrapper = styled.div`
	display: grid;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	width: 100vw;
	background:
		radial-gradient(circle at 12% 12%, rgba(187, 247, 208, 0.55), transparent 34%),
		radial-gradient(circle at 88% 18%, rgba(110, 231, 183, 0.34), transparent 30%),
		${COLORS.gradientPrimary};
	padding: 20px 0;

	@supports (min-height: 100dvh) {
		min-height: 100dvh;
	}

	@media (max-width: 768px) {
		padding: 16px;
	}

	/* @media (max-width: 480px) {
		padding: 6px;
	} */
`;
