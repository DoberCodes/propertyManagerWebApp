import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const Wrapper = styled.div`
	display: grid;
	justify-content: center;
	align-items: center;
	height: 100vh;
	width: 100vw;
	background: linear-gradient(
		135deg,
		${COLORS.bgLight} 0%,
		${COLORS.gray100} 50%,
		#e0f2fe 100%
	);
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -10%;
		width: 500px;
		height: 500px;
		background: radial-gradient(
			circle,
			${COLORS.primaryLight} 0%,
			transparent 70%
		);
		opacity: 0.3;
		pointer-events: none;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: -30%;
		left: -5%;
		width: 300px;
		height: 300px;
		background: radial-gradient(
			circle,
			${COLORS.secondaryLight} 0%,
			transparent 70%
		);
		opacity: 0.3;
		pointer-events: none;
	}
`;
