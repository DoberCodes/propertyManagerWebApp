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
	overflow-y: auto;
	max-height: 400px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background-color: #fff;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

	@media (max-width: 768px) {
		border-radius: 10px;
	}
`;

export const StyledTable = styled.table`
	width: 100%;
	border-collapse: collapse;

	thead {
		background-color: #f8fafc;
		border-bottom: 2px solid #e2e8f0;
		position: sticky;
		top: 0;
		z-index: 1;
	}

	th {
		text-align: left;
		font-weight: 700;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #64748b;
		padding: 12px 14px;
		white-space: nowrap;
	}

	td {
		padding: 13px 14px;
		text-align: left;
		border-bottom: 1px solid #f1f5f9;
		font-size: 14px;
		color: #1e293b;
		vertical-align: middle;
	}

	tbody tr {
		transition: background-color 0.12s ease;
	}

	tbody tr:hover {
		background-color: #f0fdf4;
	}

	tbody tr:hover td {
		background-color: #f0fdf4;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	tbody tr.clickable-row {
		cursor: pointer;
	}

	tbody tr.overdue-row {
		background-color: rgba(239, 68, 68, 0.04);
		box-shadow: inset 3px 0 0 #ef4444;
	}

	tbody tr.overdue-row td {
		background-color: rgba(239, 68, 68, 0.04);
	}

	tbody tr.overdue-row:hover,
	tbody tr.overdue-row:hover td {
		background-color: rgba(239, 68, 68, 0.09);
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
		min-height: 36px;

		&:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}

		@media (max-width: 480px) {
			font-size: 16px;
			min-height: 44px;
			padding: 8px 10px;
		}
	}

	@media (max-width: 768px) {
		th {
			padding: 10px 10px;
			font-size: 11px;
		}

		td {
			padding: 12px 10px;
			font-size: 14px;
		}
	}

	@media (max-width: 480px) {
		th {
			font-size: 11px;
			padding: 10px 10px;
		}

		td {
			padding: 13px 10px;
			font-size: 15px;
		}
	}
`;

export const EmptyState = styled.div`
	text-align: center;
	padding: 56px 24px;
	color: #94a3b8;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;

	h3 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 800;
		color: #0f172a;
	}

	p {
		margin: 0;
		font-size: 14px;
		color: #64748b;
		max-width: 300px;
		line-height: 1.5;
	}

	button {
		margin-top: 6px;
		border: none;
		border-radius: 8px;
		background: #16a34a;
		color: #ffffff;
		font-size: 13px;
		font-weight: 700;
		padding: 0.55rem 0.9rem;
		cursor: pointer;
		transition: background-color 0.15s ease, transform 0.15s ease;

		&:hover {
			background: #15803d;
			transform: translateY(-1px);
		}
	}

	@media (max-width: 480px) {
		padding: 60px 20px;

		p {
			font-size: 15px;
		}
	}
`;
