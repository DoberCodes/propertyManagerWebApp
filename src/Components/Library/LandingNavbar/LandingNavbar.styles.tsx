import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import styled from 'styled-components';

export const NavWrapper = styled.div`
	display: flex;
	height: 110px;
	width: 100%;
	background: linear-gradient(135deg, #065f46 0%, #047857 100%);
	align-items: center;
	justify-content: space-between;
	padding: 0 max(20px, env(safe-area-inset-left)) max(20px, env(safe-area-inset-right)) 0;
	margin: 0 auto;
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	flex-wrap: wrap;
	gap: 10px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	z-index: 100;

	@media (max-width: 1024px) {
		height: 90px;
		padding: 10px max(12px, env(safe-area-inset-left)) 10px max(12px, env(safe-area-inset-right));
		gap: 8px;
		flex-direction: row;
		flex-wrap: nowrap;
	}

	@media (max-width: 480px) {
		height: 128px;
		min-height: 128px;
		flex-direction: column;
		justify-content: center;
		padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-left)) 24px max(8px, env(safe-area-inset-right));
		gap: 4px;
		flex-wrap: nowrap;
	}
`;

export const NavTitle = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24%;
	height: 100%;
	margin: 0;

	img {
		max-height: 72px;
		width: auto;
		max-width: none;
	}

	@media (max-width: 1024px) {
		width: auto;
		flex: 1;
		max-height: 60px;

		img {
			height: 100%;
			max-height: 60px;
			object-fit: contain;
		}
	}

	@media (max-width: 480px) {
		width: 100%;
		padding: 4px 0;
		max-height: 48px;

		img {
			height: 100%;
			max-height: 48px;
			max-width: 70%;
			object-fit: contain;
		}
	}
`;

export const ButtonWrapper = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	align-items: center;
	gap: 4px;
	flex: 1;

	@media (max-width: 1024px) {
		gap: 6px;
		justify-content: center;
	}

	@media (max-width: 480px) {
		width: 100%;
		flex-wrap: wrap;
		gap: 3px;
		justify-content: center;
		align-content: center;
	}
`;

export const NavAnchor = styled(HashLink)`
	font-size: 15px;
	font-weight: 600;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 0px 4px;
	padding: 8px 10px;
	text-decoration: none;
	color: white;
	white-space: nowrap;
	border-radius: 4px;
	transition: background-color 0.2s, transform 0.2s;

	&:hover {
		background-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	@media (max-width: 1024px) {
		font-size: 14px;
		margin: 0px 8px 0px 8px;
		padding: 6px 10px;
	}

	@media (max-width: 480px) {
		font-size: 11px;
		margin: 2px 3px;
		padding: 5px 7px;
		flex: 0 1 auto;
		min-width: fit-content;
		text-align: center;
	}
`;

export const NavRouteLink = styled(Link)`
	font-size: 15px;
	font-weight: 600;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 0px 4px;
	padding: 8px 10px;
	text-decoration: none;
	color: white;
	white-space: nowrap;
	border-radius: 4px;
	transition: background-color 0.2s, transform 0.2s;

	&:hover {
		background-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	@media (max-width: 1024px) {
		font-size: 14px;
		margin: 0px 8px 0px 8px;
		padding: 6px 10px;
	}

	@media (max-width: 480px) {
		font-size: 11px;
		margin: 2px 3px;
		padding: 5px 7px;
		flex: 0 1 auto;
		min-width: fit-content;
		text-align: center;
	}
`;

export const NavButton = styled(Link)`
	font-size: 17px;
	font-weight: 700;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 0px 8px;
	padding: 8px 10px;
	text-decoration: none;
	color: black;
	white-space: nowrap;

	&:hover {
		color: white;
	}

	@media (max-width: 1024px) {
		font-size: 14px;
		margin: 0px 8px;
		padding: 6px 12px;
		background-color: white;
		border-radius: 4px;
	}

	@media (max-width: 480px) {
		font-size: 13px;
		margin: 0;
		padding: 6px 12px;
		flex: 0 1 auto;
		min-width: 80px;
		background-color: white;
		border-radius: 4px;
	}
`;
