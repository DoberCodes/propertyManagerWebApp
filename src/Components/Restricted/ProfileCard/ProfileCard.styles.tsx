import styled from 'styled-components';
import { nav_height } from '../../../global.styles';

export const Wrapper = styled.div`
	width: 30%;
	border: 1px solid black;
	min-height: calc(500px - ${nav_height});
	height: 100%;
	padding: 10px;
`;

export const ProfilePicture = styled.div`
	height: 200px;
	display: grid;
	justify-content: center;
	align-items: center;
	background-color: #b0c4de;
	border-bottom: solid 1px;
`;

export const Image = styled.img`
	height: 150px;
	width: 150px;
	border-radius: 50%;
`;
export const StatsWrapper = styled.div`
	height: 60%;
`;
export const Stat = styled.div`
	height: 20%;
	padding: 10px;
	font-size: 18px;
	font-weight: 600;
	text-align: center;
`;
