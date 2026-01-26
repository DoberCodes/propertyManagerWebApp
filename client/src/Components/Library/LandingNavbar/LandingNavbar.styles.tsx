import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import styled from 'styled-components';

export const NavWrapper = styled.div`
	display: flex;
	height: 100px;
	width: 100%;
	background-color: blue;
	align-items: center;
	padding: '20px 0 20px 0';
	margin: 0 auto;
	position: fixed;
	top: 0;
	flex-wrap: wrap;
	gap: 10px;

	@media (max-width: 768px) {
		height: 80px;
		padding: 10px;
		gap: 5px;
	}

	@media (max-width: 480px) {
		height: 70px;
		flex-direction: column;
		justify-content: center;
	}
`;

export const IconWrapper = styled.div``;

export const NavTitle = styled.h2`
	font-size: 36px;
	font-weight: 700;
	width: 35%;
	text-align: center;

	@media (max-width: 768px) {
		font-size: 28px;
		width: 40%;
	}

	@media (max-width: 480px) {
		font-size: 20px;
		width: 100%;
	}
`;

export const ButtonWrapper = styled.div`
	width: 65%;
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	gap: 10px;

	@media (max-width: 768px) {
		width: 60%;
		gap: 5px;
	}

	@media (max-width: 480px) {
		width: 100%;
		flex-wrap: wrap;
		gap: 8px;
	}
`;

export const NavAnchor = styled(HashLink)`
	font-size: 20px;
	font-weight: 700;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 0px 20px 0px 20px;
	padding: 10px;
	text-decoration: none;
	color: black;
	white-space: nowrap;

	&:hover {
		color: white;
	}

	@media (max-width: 768px) {
		font-size: 16px;
		margin: 0px 10px 0px 10px;
		padding: 8px;
	}

	@media (max-width: 480px) {
		font-size: 12px;
		margin: 0;
		padding: 6px;
		flex: 1;
		min-width: 100px;
	}
`;

export const NavButton = styled(Link)`
	font-size: 20px;
	font-weight: 700;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 0px 20px 0px 20px;
	padding: 10px;
	text-decoration: none;
	color: black;
	white-space: nowrap;

	&:hover {
		color: white;
	}

	@media (max-width: 768px) {
		font-size: 16px;
		margin: 0px 10px 0px 10px;
		padding: 8px;
	}

	@media (max-width: 480px) {
		font-size: 12px;
		margin: 0;
		padding: 6px;
		flex: 1;
		min-width: 100px;
	}
`;
