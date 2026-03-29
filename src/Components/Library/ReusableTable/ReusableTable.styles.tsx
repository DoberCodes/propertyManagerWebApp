import { styled } from 'styled-components';

export const ActionButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	color: #374151;
	transition: background-color 0.2s ease;
	min-width: 44px; /* Better touch target */
	min-height: 44px; /* Better touch target */
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover:not(:disabled) {
		background-color: #f3f4f6;
	}

	&:disabled {
		color: #9ca3af;
		cursor: not-allowed;
	}

	&.delete {
		color: #dc2626;

		&:hover:not(:disabled) {
			background-color: #fef2f2;
		}
	}

	@media (max-width: 480px) {
		min-width: 48px; /* Larger touch target on mobile */
		min-height: 48px;
		padding: 8px 12px;
	}
`;

export const TableContainer = styled.div`
	overflow-x: auto;
	overflow-y: auto; /* Enable vertical scrolling */
	max-height: 400px; /* Set a maximum height for the table */
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	background-color: #fff;

	@media (max-width: 768px) {
		border-radius: 8px;
	}
`;

export const StyledTable = styled.table`
	width: 100%;
	border-collapse: collapse;

	thead {
		background-color: #f3f4f6;
	}

	th,
	td {
		padding: 12px;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		text-align: left;
		font-weight: 600;
		font-size: 14px;
	}

	tbody tr:hover {
		background-color: #f9fafb;
	}

	tbody tr.overdue-row {
		background-color: rgba(239, 68, 68, 0.04);
		box-shadow: inset 3px 0 0 #ef4444;
	}

	tbody tr.overdue-row td {
		background-color: rgba(239, 68, 68, 0.04);
	}

	tbody tr.overdue-row:hover td {
		background-color: rgba(239, 68, 68, 0.08);
	}

	select {
		width: auto;
		max-width: 100%;
		padding: 6px 8px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 14px;
		background-color: #fff;
		cursor: pointer;
		min-height: 36px; /* Better touch target */

		&:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}

		@media (max-width: 480px) {
			font-size: 16px; /* Prevent iOS zoom */
			min-height: 44px;
			padding: 8px 10px;
		}
	}

	@media (max-width: 768px) {
		th,
		td {
			padding: 10px 8px;
			font-size: 14px;
		}

		th {
			font-size: 13px;
		}
	}

	@media (max-width: 480px) {
		th,
		td {
			padding: 12px 10px;
			font-size: 15px;
		}

		th {
			font-size: 14px;
		}
	}
`;

export const EmptyState = styled.div`
	text-align: center;
	padding: 40px 20px;
	color: #6b7280;

	p {
		margin: 0;
		font-size: 14px;
	}

	@media (max-width: 480px) {
		padding: 50px 20px;

		p {
			font-size: 16px;
		}
	}
`;
