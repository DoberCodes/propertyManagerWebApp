import styled from 'styled-components';
import { nav_height } from '../../../global.styles';

export const Wrapper = styled.div`
	width: 30%;
	border: 1px solid black;
	height: calc(500px - ${nav_height});
	padding: 10px;
`;

export const CardTitle = styled.h2`
	text-align: center;
`;

export const CardBody = styled.div``;
