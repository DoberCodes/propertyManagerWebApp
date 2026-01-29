import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const UserProfileWrapper = styled.div<{ isOpen: boolean }>`
	position: relative;
	display: flex;
	align-items: center;
	gap: 8px;

	@media (max-width: 480px) {
		gap: 4px;
	}
`;

export const UserImage = styled.img`
	width: 40px;
	height: 40px;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid black;

	@media (max-width: 480px) {
		width: 32px;
		height: 32px;
		border: 1px solid black;
	}
`;

export const UserInfo = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	margin-left: 8px;

	@media (max-width: 768px) {
		margin-left: 6px;
	}

	@media (max-width: 480px) {
		margin-left: 4px;
		display: none;
	}
`;

export const UserName = styled.span`
	font-size: 14px;
	font-weight: 600;
	color: black;
	white-space: nowrap;
	margin: 0;
	line-height: 1.2;

	@media (max-width: 768px) {
		font-size: 12px;
	}
`;

export const UserTitle = styled.span`
	font-size: 12px;
	color: #999999;
	white-space: nowrap;
	margin: 0;
	line-height: 1.2;

	@media (max-width: 768px) {
		font-size: 10px;
	}
`;

export const DropdownMenu = styled.div`
	position: absolute;
	top: calc(100% + 5px);
	left: 0;
	background-color: white;
	border: 1px solid #ccc;
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	z-index: 10000;
	min-width: 150px;
	pointer-events: auto;

	@media (max-width: 480px) {
		min-width: 120px;
		top: calc(100% + 2px);
	}
`;

export const DropdownItem = styled(Link)`
	display: block;
	padding: 10px 15px;
	color: #22c55e;
	text-decoration: none;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.2s ease;

	&:first-child {
		border-radius: 4px 4px 0 0;
	}

	&:last-child {
		border-radius: 0 0 4px 4px;
	}

	&:hover {
		background-color: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}

	&.active {
		background-color: #22c55e;
		color: white;
	}

	@media (max-width: 480px) {
		padding: 8px 12px;
		font-size: 12px;
	}
`;

export const DropdownButton = styled.button`
	display: block;
	width: 100%;
	padding: 10px 15px;
	color: #ef4444;
	background: none;
	border: none;
	text-align: left;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.2s ease;
	border-radius: 0 0 4px 4px;

	&:hover {
		background-color: rgba(239, 68, 68, 0.1);
		color: #dc2626;
	}

	@media (max-width: 480px) {
		padding: 8px 12px;
		font-size: 12px;
	}
`;
