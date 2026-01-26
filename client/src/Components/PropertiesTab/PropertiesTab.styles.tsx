import styled from 'styled-components';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
	min-height: 100%;
	overflow-y: auto;
	background-color: #fafafa; /* match TeamPage off-white */

	@media (max-width: 768px) {
		padding: 15px;
		gap: 15px;
	}

	@media (max-width: 480px) {
		padding: 10px;
		gap: 10px;
	}
`;

export const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20px;
	padding-bottom: 20px;
	border-bottom: 2px solid #e5e7eb;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 10px;
		padding-bottom: 15px;
	}
`;

export const PageTitle = styled.h1`
	font-size: 28px;
	font-weight: 700;
	color: #1f2937;
	margin: 0;

	@media (max-width: 768px) {
		font-size: 24px;
	}

	@media (max-width: 480px) {
		font-size: 20px;
	}
`;

export const TopActions = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 6px;
		width: 100%;
	}
`;

export const GroupsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 40px;
	flex: 1;

	@media (max-width: 768px) {
		gap: 30px;
	}

	@media (max-width: 480px) {
		gap: 20px;
	}
`;

export const GroupSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;

	@media (max-width: 480px) {
		gap: 15px;
	}
`;

export const GroupHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20px;
	flex-wrap: wrap;
	padding: 16px 20px;
	background-color: white;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	margin-bottom: 8px; /* breathing room before tiles */

	@media (max-width: 768px) {
		padding: 12px 16px;
		gap: 12px;
	}

	@media (max-width: 480px) {
		padding: 10px;
		gap: 10px;
	}
`;

export const GroupName = styled.h2`
	font-size: 18px;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	flex: 1;
	cursor: pointer;
	padding: 8px 12px;
	border-radius: 4px;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}

	@media (max-width: 768px) {
		font-size: 16px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		padding: 6px 10px;
	}
`;

export const GroupNameInput = styled.input`
	font-size: 20px;
	font-weight: 600;
	color: black;
	border: 2px solid #22c55e;
	border-radius: 4px;
	padding: 8px 12px;
	font-family: inherit;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #16a34a;
	}

	@media (max-width: 768px) {
		font-size: 16px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		padding: 6px 10px;
	}
`;

export const HeaderRight = styled.div`
	display: flex;
	gap: 10px;
	align-items: center;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 5px;
		width: 100%;
	}
`;

export const GroupActions = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;

	@media (max-width: 480px) {
		gap: 6px;
	}
`;

export const GroupActionButton = styled.button`
	background: transparent;
	border: none;
	color: #6b7280;
	font-size: 18px;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: color 0.2s ease;

	&:hover {
		color: #22c55e;
	}

	@media (max-width: 768px) {
		font-size: 16px;
		width: 28px;
		height: 28px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
		width: auto;
		height: auto;
		padding: 2px 4px;
	}
`;

export const AddPropertyButton = styled.button`
	background-color: #22c55e;
	color: white;
	border: none;
	padding: 10px 16px;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;
	white-space: nowrap;

	&:hover {
		background-color: #16a34a;
	}

	&:active {
		background-color: #15803d;
	}

	@media (max-width: 480px) {
		padding: 8px 12px;
		font-size: 12px;
		flex: 1;
	}
`;

export const PropertiesGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: 20px;
	margin-top: 8px; /* space from header */

	@media (max-width: 1024px) {
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 16px;
	}

	@media (max-width: 768px) {
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 14px;
	}

	@media (max-width: 480px) {
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 12px;
	}
`;

export const PropertyTile = styled.div`
	position: relative;
	height: 200px;
	border-radius: 8px;
	overflow: hidden;
	cursor: pointer;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	transition:
		transform 0.2s ease,
		box-shadow 0.2s ease;

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	@media (max-width: 768px) {
		height: 170px;
	}

	@media (max-width: 480px) {
		height: 150px;
	}
`;

export const PropertyImage = styled.img`
	width: 100%;
	height: 100%;
	object-fit: cover;
`;

export const PropertyOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(
		to bottom,
		rgba(0, 0, 0, 0.3),
		rgba(0, 0, 0, 0.6)
	);
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding: 16px;
	color: white;
	z-index: 1;
`;

export const FavoriteStar = styled.button`
	position: absolute;
	top: 12px;
	right: 12px;
	background: none;
	border: none;
	font-size: 28px;
	cursor: pointer;
	transition:
		transform 0.2s ease,
		text-shadow 0.2s ease;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	padding: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2;

	&:hover {
		transform: scale(1.1);
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
	}

	&:active {
		transform: scale(0.95);
	}
`;

export const PropertyTitle = styled.a`
	font-size: 16px;
	font-weight: 600;
	color: white;
	text-decoration: none;
	cursor: pointer;
	transition: opacity 0.2s ease;

	&:hover {
		opacity: 0.9;
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		font-size: 14px;
	}

	@media (max-width: 480px) {
		font-size: 12px;
	}
`;

export const DropdownToggle = styled.button`
	background: none;
	border: none;
	color: white;
	font-size: 20px;
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	transition: background-color 0.2s ease;
	align-self: flex-end;

	&:hover {
		background-color: rgba(255, 255, 255, 0.2);
	}
`;

export const DropdownMenu = styled.div`
	position: absolute;
	top: 40px;
	right: 16px;
	background-color: white;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	z-index: 100;
	min-width: 120px;
	overflow: hidden;
`;

export const DropdownItem = styled.button`
	display: block;
	width: 100%;
	padding: 10px 12px;
	background: none;
	border: none;
	color: black;
	text-align: left;
	font-size: 14px;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:first-child {
		border-radius: 4px 4px 0 0;
	}

	&:last-child {
		border-radius: 0 0 4px 4px;
	}

	&:hover {
		background-color: #f5f5f5;
	}

	@media (max-width: 480px) {
		padding: 8px 10px;
		font-size: 12px;
	}
`;

export const AddGroupContainer = styled.div`
	display: none; /* replaced by PageHeader + TopActions */
`;

export const AddGroupButton = styled.button`
	background-color: #d1d5db;
	color: #666666;
	border: none;
	padding: 10px 16px;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition:
		background-color 0.2s ease,
		color 0.2s ease;

	&:hover {
		background-color: #b6b9c1;
		color: #4b5563;
	}

	&:active {
		background-color: #a0a5b3;
	}

	@media (max-width: 480px) {
		padding: 8px 12px;
		font-size: 12px;
		width: 100%;
	}
`;
