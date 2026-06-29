import styled from 'styled-components';
import { TableContainer } from '../../Components/Library/ReusableTable/ReusableTable.styles';
import { COLORS } from '../../constants/colors';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
	width: 100%;
	background-color: #f8f9fa;

	@media (max-width: 1024px) {
		padding: 0;
	}

	@media (max-width: 480px) {
		padding: 0;
	}
`;

export const TaskGridSection = styled.div`
	display: flex;
	flex-direction: column;
	background: transparent;
	border-radius: 0;
	padding: 0;
	box-shadow: none;
	width: 100%;

	${TableContainer} {
		height: auto;
		max-height: none;
		overflow: visible;
	}
`;

export const TaskControlPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	border-radius: 16px;
	border: 1px solid #e2e8f0;
	background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
	box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);

	@media (max-width: 1024px) {
		display: none;
	}
`;

export const TaskFilterFields = styled.div`
	display: grid;
	grid-template-columns: minmax(240px, 1.5fr) minmax(220px, 1fr);
	gap: 12px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

export const TaskFilterField = styled.label`
	display: flex;
	flex-direction: column;
	gap: 6px;
	color: #475569;
	font-size: 12px;
	font-weight: 800;
`;

export const TaskPageMetaRow = styled.div`
	display: none;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	min-height: 28px;

	@media (max-width: 1024px) {
		display: flex;
		padding-right: 58px;
	}
`;

export const AddTaskButton = styled.button`
	min-height: 42px;
	padding: 9px 15px;
	border: none;
	border-radius: 10px;
	background: ${COLORS.primary};
	color: ${COLORS.textInverse};
	font-size: 0.85rem;
	font-weight: 800;
	box-shadow: 0 8px 18px rgba(4, 120, 87, 0.2);
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		background: ${COLORS.primaryHover};
	}

	@media (max-width: 1024px) {
		display: none;
	}
`;

export const TaskControlRow = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: stretch;
	}
`;

export const TaskSearchInput = styled.input`
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

export const TaskSortSelect = styled.select`
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

export const TaskResultCount = styled.div`
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
			border-color: ${COLORS.secondary};
			box-shadow: 0 0 0 3px ${COLORS.secondaryLight};
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
	border: 1px solid ${(props) => (props.$overdue ? 'rgba(239, 68, 68, 0.22)' : '#ececec')};
	box-shadow: ${(props) =>
		props.$overdue
			? '0 2px 10px rgba(239, 68, 68, 0.09)'
			: '0 2px 10px rgba(15, 23, 42, 0.07)'};
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

export const MobileTaskHeader = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
	margin-bottom: 0;
`;

export const MobileTaskTitle = styled.h3`
	margin: 0;
	font-size: 1.1rem;
	line-height: 1.35;
	color: #0f172a;
	font-weight: 800;
	width: 100%;
`;

export const MobileTaskMetaGrid = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;

	@media (max-width: 480px) {
		gap: 7px;
	}
`;

export const MobileMetaItem = styled.div`
	padding: 8px 0;
	border-top: 1px solid #eef2f7;
	text-align: center;

	&:first-child {
		border-top: none;
		padding-top: 0;
	}
`;

export const MobileMetaLabel = styled.div`
	font-size: 0.6rem;
	font-weight: 600;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: #b0bec8;
	opacity: 0.85;
	margin-bottom: 2px;
	text-align: center;
`;

export const MobileMetaValue = styled.div`
	font-size: 0.84rem;
	font-weight: 500;
	color: #334155;
	word-break: break-word;
	text-align: center;
`;

export const MobileTaskActions = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 0;
`;

export const MobileActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
	border: none;
	border-radius: 10px;
	padding: 10px 14px;
	font-size: 0.86rem;
	font-weight: 800;
	min-height: 42px;
	cursor: pointer;
	background: ${(props) => {
		if (props.$variant === 'success') return COLORS.successLight;
		if (props.$variant === 'secondary') return COLORS.secondaryLight;
		return COLORS.infoLight;
	}};
	color: ${(props) => {
		if (props.$variant === 'success') return COLORS.successDark;
		if (props.$variant === 'secondary') return COLORS.secondaryDark;
		return COLORS.infoDark;
	}};
	width: 100%;

	&:active {
		transform: translateY(0);
	}

	@media (max-width: 480px) {
		min-height: 44px;
	}
`;

export const MobileActionLinkRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 14px;
	align-items: center;
	justify-content: center;
	text-align: center;
`;

export const MobileActionLinkButton = styled.button<{ $danger?: boolean }>`
	border: none;
	background: transparent;
	padding: 0;
	font-size: 0.8rem;
	font-weight: 650;
	color: ${(props) => (props.$danger ? 'rgba(185, 28, 28, 0.72)' : '#526175')};
	cursor: pointer;
	text-decoration: none;
	line-height: 1.4;

	&:hover {
		text-decoration: underline;
		color: ${(props) => (props.$danger ? '#991b1b' : '#334155')};
	}
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
	border: 1px solid ${(props) => (props.$active ? COLORS.secondaryHover : COLORS.gray300)};
	background: ${(props) => (props.$active ? COLORS.secondaryLight : COLORS.bgWhite)};
	color: ${(props) => (props.$active ? COLORS.infoDark : COLORS.gray700)};
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
	background: ${COLORS.secondaryHover};
	color: ${COLORS.textInverse};
	border-radius: 8px;
	padding: 6px 10px;
	font-size: 0.78rem;
	font-weight: 700;
	cursor: pointer;
`;
