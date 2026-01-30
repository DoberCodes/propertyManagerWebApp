import styled from 'styled-components';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
	min-height: 100%;

	@media (max-width: 768px) {
		padding: 15px;
		gap: 15px;
	}

	@media (max-width: 480px) {
		padding: 10px;
		gap: 10px;
	}
`;

export const TaskGridSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;
	flex: 1;
	min-height: 400px;

	@media (max-width: 768px) {
		min-height: 300px;
		gap: 12px;
	}

	@media (max-width: 480px) {
		min-height: 250px;
		gap: 10px;
	}
`;

export const TaskGridHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 10px;

	@media (max-width: 480px) {
		gap: 5px;
	}
`;

export const TaskGridTitle = styled.h2`
	font-size: 20px;
	font-weight: 700;
	color: #1f2937;
	margin: 0;

	@media (max-width: 768px) {
		font-size: 18px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;

export const ActionButton = styled.button`
	position: relative;
	background-color: transparent;
	color: #999999;
	border: none;
	border-radius: 50%;
	width: 40px;
	height: 40px;
	font-size: 24px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.2s ease;

	&:hover {
		color: #666666;
	}

	@media (max-width: 480px) {
		width: 36px;
		height: 36px;
		font-size: 20px;
	}
`;

export const ActionDropdown = styled.div`
	position: absolute;
	top: 100%;
	right: 0;
	background-color: white;
	border: 1px solid #ccc;
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	z-index: 1000;
	min-width: 150px;
	margin-top: 8px;
	overflow: hidden;

	@media (max-width: 480px) {
		min-width: 130px;
		margin-top: 4px;
	}
`;

export const DropdownItem = styled.button`
	display: block;
	width: 100%;
	padding: 12px 15px;
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
		background-color: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}

	@media (max-width: 480px) {
		padding: 10px 12px;
		font-size: 12px;
	}
`;

export const TableWrapper = styled.div`
	overflow-x: auto;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	flex: 1;

	@media (max-width: 480px) {
		border-radius: 2px;
	}
`;

export const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	background-color: white;

	thead {
		background-color: #f5f5f5;
		border-bottom: 2px solid #e0e0e0;
		position: sticky;
		top: 0;
	}

	th {
		padding: 12px 16px;
		text-align: left;
		font-weight: 600;
		color: black;
		font-size: 14px;

		@media (max-width: 768px) {
			padding: 10px 12px;
			font-size: 12px;
		}

		@media (max-width: 480px) {
			padding: 8px 10px;
			font-size: 11px;
		}
	}

	td {
		padding: 12px 16px;
		border-bottom: 1px solid #e0e0e0;
		color: black;
		font-size: 14px;

		@media (max-width: 768px) {
			padding: 10px 12px;
			font-size: 12px;
		}

		@media (max-width: 480px) {
			padding: 8px 10px;
			font-size: 11px;
		}
	}

	tr:hover {
		background-color: #fafafa;
	}
`;

export const BottomSectionsWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 20px;
	flex-shrink: 0;
	height: auto;
	min-height: 180px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
		height: 220px;
	}

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 14px;
		height: auto;
		min-height: 180px;
	}

	@media (max-width: 480px) {
		gap: 10px;
		min-height: 150px;
	}
`;

export const Section = styled.div`
	background-color: white;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

	@media (max-width: 768px) {
		border-radius: 6px;
	}

	@media (max-width: 480px) {
		border-radius: 4px;
	}
`;

export const SectionTitle = styled.h3`
	font-size: 16px;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	padding: 16px 20px;
	border-bottom: 1px solid #e0e0e0;
	background: #f9fafb;

	@media (max-width: 768px) {
		font-size: 14px;
		padding: 12px 16px;
	}

	@media (max-width: 480px) {
		font-size: 12px;
		padding: 10px 12px;
	}
`;

export const SectionContent = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: 16px 20px;
	color: #999999;
	font-size: 14px;

	@media (max-width: 768px) {
		font-size: 12px;
		padding: 12px 16px;
	}

	@media (max-width: 480px) {
		font-size: 11px;
		padding: 10px 12px;
	}
`;
