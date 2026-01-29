import styled from 'styled-components';
import { nav_height } from '../../../global.styles';

export const Wrapper = styled.div`
	width: 30%;
	border: 1px solid black;
	min-height: calc(500px - ${nav_height});
	height: 100%;
	padding: 10px;

	@media (max-width: 1024px) {
		width: 40%;
	}

	@media (max-width: 768px) {
		width: 60%;
		padding: 8px;
		min-height: calc(450px - ${nav_height});
	}

	@media (max-width: 480px) {
		width: 90%;
		padding: 8px;
		min-height: auto;
	}
`;

export const ProfilePicture = styled.div`
	height: 200px;
	display: grid;
	justify-content: center;
	align-items: center;
	background-color: #b0c4de;
	border-bottom: solid 1px;

	@media (max-width: 768px) {
		height: 180px;
	}

	@media (max-width: 480px) {
		height: 150px;
	}
`;

export const Image = styled.img`
	height: 150px;
	width: 150px;
	border-radius: 50%;

	@media (max-width: 768px) {
		height: 130px;
		width: 130px;
	}

	@media (max-width: 480px) {
		height: 110px;
		width: 110px;
	}
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

	@media (max-width: 768px) {
		font-size: 16px;
		padding: 8px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		padding: 6px;
	}
`;
