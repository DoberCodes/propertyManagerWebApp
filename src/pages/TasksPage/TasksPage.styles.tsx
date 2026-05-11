import styled from 'styled-components';
import { TableContainer } from '../../Components/Library/ReusableTable/ReusableTable.styles';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
	width: 100%;
	background-color: #f8f9fa;
`;

export const TaskGridSection = styled.div`
	display: flex;
	flex-direction: column;
	background: white;
	border-radius: 16px;
	padding: 20px 20px 12px;
	box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
	width: 100%;

	${TableContainer} {
		height: auto;
		max-height: none;
		overflow: visible;
	}
`;

export const WorkflowControlPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	border-radius: 16px;
	border: 1px solid #e2e8f0;
	background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
	box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
`;

export const WorkflowControlRow = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: stretch;
	}
`;

export const WorkflowSearchInput = styled.input`
	flex: 1;
	min-width: 240px;
	padding: 11px 14px;
	border: 1px solid #dbe3ee;
	border-radius: 12px;
	font-size: 14px;
	background: #ffffff;
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);

	&:focus {
		outline: none;
		border-color: #93c5fd;
		box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
	}

	@media (max-width: 640px) {
		min-width: 100%;
	}
`;

export const WorkflowSortSelect = styled.select`
	padding: 11px 14px;
	border: 1px solid #dbe3ee;
	border-radius: 12px;
	font-size: 14px;
	font-weight: 700;
	background: #ffffff;
	color: #334155;
	min-width: 220px;

	&:focus {
		outline: none;
		border-color: #93c5fd;
		box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
	}

	@media (max-width: 640px) {
		min-width: 100%;
	}
`;

export const WorkflowResultCount = styled.div`
	font-size: 12px;
	font-weight: 700;
	color: #64748b;
`;

export const FilterSection = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	background: white;
	padding: 15px 20px;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

	label {
		font-weight: 500;
		color: #374151;
	}

	select {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		font-size: 14px;
		min-width: 120px;

		&:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}
	}
`;

export const MobileListSection = styled.div`
	width: 100%;
	display: none;

	@media (max-width: 1024px) {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
`;

export const MobileTaskCard = styled.article<{ $overdue?: boolean }>`
	background: #ffffff;
	border-radius: 12px;
	padding: 14px;
	border: 1px solid ${(props) => (props.$overdue ? 'rgba(239, 68, 68, 0.35)' : '#e5e7eb')};
	box-shadow: ${(props) =>
		props.$overdue
			? '0 2px 6px rgba(239, 68, 68, 0.12)'
			: '0 2px 6px rgba(15, 23, 42, 0.05)'};
`;

export const MobileTaskHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 10px;
	margin-bottom: 10px;
`;

export const MobileTaskTitle = styled.h3`
	margin: 0;
	font-size: 1rem;
	line-height: 1.35;
	color: #1f2937;
`;

export const MobileTaskMetaGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
	}
`;

export const MobileMetaItem = styled.div`
	padding: 8px 10px;
	border-radius: 8px;
	background: #f9fafb;
`;

export const MobileMetaLabel = styled.div`
	font-size: 0.68rem;
	font-weight: 700;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: #6b7280;
	margin-bottom: 4px;
`;

export const MobileMetaValue = styled.div`
	font-size: 0.86rem;
	font-weight: 600;
	color: #111827;
	word-break: break-word;
`;

export const MobileTaskActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 12px;
`;

export const MobileActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
	border: none;
	border-radius: 8px;
	padding: 8px 10px;
	font-size: 0.82rem;
	font-weight: 700;
	min-height: 38px;
	cursor: pointer;
	background: ${(props) => {
		if (props.$variant === 'success') return '#dcfce7';
		if (props.$variant === 'secondary') return '#e0e7ff';
		return '#eff6ff';
	}};
	color: ${(props) => {
		if (props.$variant === 'success') return '#166534';
		if (props.$variant === 'secondary') return '#4338ca';
		return '#1d4ed8';
	}};
`;

export const QuickFilterChips = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 12px;
`;

export const QuickFilterChip = styled.button<{ $active?: boolean }>`
	height: 32px;
	padding: 0 10px;
	border-radius: 999px;
	border: 1px solid ${(props) => (props.$active ? '#2563eb' : '#d1d5db')};
	background: ${(props) => (props.$active ? '#dbeafe' : '#ffffff')};
	color: ${(props) => (props.$active ? '#1d4ed8' : '#374151')};
	font-size: 0.78rem;
	font-weight: 700;
	cursor: pointer;
`;

export const UndoToast = styled.div`
	position: fixed;
	left: 50%;
	bottom: 24px;
	transform: translateX(-50%);
	background: #111827;
	color: #f9fafb;
	border-radius: 10px;
	padding: 10px 12px;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
	z-index: 2000;
`;

export const UndoButton = styled.button`
	border: none;
	background: #2563eb;
	color: #ffffff;
	border-radius: 8px;
	padding: 6px 10px;
	font-size: 0.78rem;
	font-weight: 700;
	cursor: pointer;
`;
