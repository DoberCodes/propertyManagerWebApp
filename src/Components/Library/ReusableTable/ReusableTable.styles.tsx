import { styled } from 'styled-components';

export const ActionButton = styled.button`
	background: transparent;
	border: 1px solid transparent;
	cursor: pointer;
	padding: 5px 9px;
	border-radius: 999px;
	color: #475569;
	transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
	min-width: 44px; /* Better touch target */
	min-height: 44px; /* Better touch target */
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 5px;
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;

	.action-label {
		display: inline-block;
	}

	&:hover:not(:disabled) {
		background-color: #f8fafc;
		border-color: #d9e2ec;
	}

	&.primary-action {
		background: #f2fbf6;
		border-color: #cbe9d9;
		color: #0f766e;
	}

	&.primary-action:hover:not(:disabled) {
		background: #ebf8f1;
		border-color: #b9dfcd;
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

		.action-label {
			display: none;
		}
	}
`;

export const ActionGroup = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 3px;
	padding: 3px;
	border-radius: 999px;
	background: #f9fbfd;
	border: 1px solid #e8eef5;
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
`;

export const HeaderlessFeedSurface = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	width: 100%;
	padding: 20px;
	border-radius: 16px;
	background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);

	@media (max-width: 768px) {
		padding: 16px;
		border-radius: 14px;
	}

	@media (max-width: 480px) {
		padding: 14px;
		border-radius: 12px;
	}
`;

export const TableContainer = styled.div<{ $headerless?: boolean }>`
	overflow-x: auto;
	overflow-y: ${(props) => (props.$headerless ? 'visible' : 'auto')};
	max-height: ${(props) => (props.$headerless ? 'none' : '560px')};
	border: ${(props) => (props.$headerless ? 'none' : '1px solid #e9eef5')};
	border-radius: ${(props) => (props.$headerless ? '0' : '16px')};
	background: ${(props) =>
		props.$headerless
			? 'transparent'
			: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 36px)'};
	box-shadow: ${(props) =>
		props.$headerless ? 'none' : '0 16px 40px rgba(15, 23, 42, 0.07)'};
	padding: ${(props) => (props.$headerless ? '0' : '10px')};

	@media (max-width: 768px) {
		border-radius: 10px;
	}
`;

export const StyledTable = styled.table`
	width: 100%;
	max-width: 1280px;
	margin: 0 auto;
	border-collapse: separate;
	border-spacing: 0 8px;

	&.headerless-table {
		border-spacing: 0 10px;
		max-width: none;
		margin: 0;
	}

	&.headerless-table thead {
		display: none;
	}

	&.headerless-table tbody tr:first-child td {
		border-top-width: 1px;
	}

	thead {
		background: transparent;
		position: sticky;
		top: 0;
		z-index: 1;
	}

	th {
		text-align: left;
		font-weight: 500;
		font-size: 10px;
		text-transform: none;
		letter-spacing: 0.03em;
		color: rgba(100, 116, 139, 0.72);
		padding: 2px 15px 4px;
		white-space: nowrap;
	}

	th button {
		font: inherit;
		color: inherit;
	}

	td {
		padding: 16px 15px;
		text-align: left;
		border-top: 1px solid #e8edf4;
		border-bottom: 1px solid #e8edf4;
		font-size: 14px;
		color: #1e293b;
		vertical-align: top;
		line-height: 1.45;
		background: #ffffff;
	}

	tbody tr td:first-child {
		position: relative;
		overflow: hidden;
		border-left: 1px solid #e8edf4;
		border-top-left-radius: 12px;
		border-bottom-left-radius: 12px;
	}

	tbody tr td:last-child {
		border-right: 1px solid #e8edf4;
		border-top-right-radius: 12px;
		border-bottom-right-radius: 12px;
	}

	td > span {
		display: inline-block;
		line-height: 1.45;
	}

	tbody tr {
		transition: transform 0.16s ease, box-shadow 0.18s ease;
		box-shadow: none;
	}

	tbody tr:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(203, 213, 225, 0.35);
	}

	tbody tr:hover td {
		background: #f8fbff;
		border-top-color: #dbe7f7;
		border-bottom-color: #dbe7f7;
	}

	tbody tr.clickable-row {
		cursor: pointer;
	}

	tbody tr.overdue-row td:first-child::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6px;
		background: #e88d86;
	}

	tbody tr.overdue-row td {
		background-color: #ffffff;
		border-top-color: #e8edf4;
		border-bottom-color: #e8edf4;
	}

	tbody tr.overdue-row:hover,
	tbody tr.overdue-row:hover td {
		background-color: #f8fbff;
	}

	tbody tr.attention-row td:first-child::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6px;
		background: #f59e0b;
	}

	tbody tr.attention-row td {
		background-color: rgba(245, 158, 11, 0.05);
		border-top-color: #fcd34d;
		border-bottom-color: #fcd34d;
	}

	tbody tr.attention-row:hover,
	tbody tr.attention-row:hover td {
		background-color: rgba(245, 158, 11, 0.1);
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
			padding: 6px 11px 2px;
			font-size: 11px;
		}

		td {
			padding: 14px 11px;
			font-size: 14px;
		}

		tbody tr td:first-child {
			border-top-left-radius: 10px;
			border-bottom-left-radius: 10px;
		}

		tbody tr td:last-child {
			border-top-right-radius: 10px;
			border-bottom-right-radius: 10px;
		}
	}

	@media (max-width: 480px) {
		th {
			font-size: 11px;
			padding: 10px 10px;
		}

		td {
			padding: 14px 10px;
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
