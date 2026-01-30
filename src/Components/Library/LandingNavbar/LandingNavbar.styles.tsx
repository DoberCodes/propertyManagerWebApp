import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import styled from 'styled-components';

export const NavWrapper = styled.div`
	display: flex;
	height: 80px;
	width: 100%;
	background: linear-gradient(135deg, #065f46 0%, #047857 100%);
	align-items: center;
	justify-content: space-between;
	padding: 0 20px;
	margin: 0 auto;
	position: fixed;
	top: 0;
	flex-wrap: wrap;
	gap: 10px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	z-index: 100;

	@media (max-width: 768px) {
		height: 70px;
		padding: 10px 12px;
		gap: 8px;
		flex-direction: row;
		flex-wrap: nowrap;
	}

	@media (max-width: 480px) {
		height: auto;
		min-height: 140px;
		flex-direction: column;
		justify-content: center;
		padding: 12px 8px;
		gap: 8px;
	}
`;

export const IconWrapper = styled.div``;

export const NavTitle = styled.h2`
	font-size: 28px;
	font-weight: 800;
	width: 35%;
	text-align: center;
	color: white;
	letter-spacing: 0.5px;
	margin: 0;
	text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);

	@media (max-width: 768px) {
		font-size: 18px;
		width: auto;
		flex: 1;
		text-align: left;
	}

	@media (max-width: 480px) {
		font-size: 20px;
		width: 100%;
		padding: 4px 0;
		text-align: center;
	}
`;

export const ButtonWrapper = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	align-items: center;
	gap: 8px;
	flex: 1;

	@media (max-width: 768px) {
		gap: 6px;
		justify-content: center;
	}

	@media (max-width: 480px) {
		width: 100%;
		flex-wrap: wrap;
		gap: 6px;
		justify-content: center;
	}
`;

export const NavAnchor = styled(HashLink)`
	font-size: 16px;
	font-weight: 600;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 0px 12px 0px 12px;
	padding: 8px 12px;
	text-decoration: none;
	color: white;
	white-space: nowrap;
	border-radius: 4px;
	transition:
		background-color 0.2s,
		transform 0.2s;

	&:hover {
		background-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	@media (max-width: 768px) {
		font-size: 14px;
		margin: 0px 8px 0px 8px;
		padding: 6px 10px;
	}

	@media (max-width: 480px) {
		font-size: 12px;
		margin: 4px 4px;
		padding: 6px 8px;
		flex: 1;
		min-width: auto;
		text-align: center;
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
		font-size: 14px;
		margin: 0px 8px;
		padding: 6px 12px;
		background-color: white;
		border-radius: 4px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		margin: 0;
		padding: 8px 16px;
		flex: 0 1 auto;
		min-width: 80px;
		background-color: white;
		border-radius: 4px;
	}
`;
