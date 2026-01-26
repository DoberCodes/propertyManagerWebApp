import styled from 'styled-components';
import { nav_height } from '../../../global.styles';

export const Wrapper = styled.div`
	width: 30%;
	border: 1px solid black;
	height: calc(500px - ${nav_height});
	padding: 10px;

	@media (max-width: 1024px) {
		width: 40%;
	}

	@media (max-width: 768px) {
		width: 60%;
		padding: 8px;
		height: calc(450px - ${nav_height});
	}

	@media (max-width: 480px) {
		width: 90%;
		padding: 8px;
		height: auto;
		min-height: 300px;
	}
`;

export const CardTitle = styled.h2`
	text-align: center;

	@media (max-width: 768px) {
		font-size: 18px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;

export const CardBody = styled.div``;
