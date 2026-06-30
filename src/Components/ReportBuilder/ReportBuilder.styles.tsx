import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const ReportBuilderContainer = styled.div`
	display: grid;
	grid-template-columns: 350px 1fr;
	gap: 24px;

	@media (max-width: 1200px) {
		grid-template-columns: 320px 1fr;
		gap: 20px;
	}

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
		gap: 16px;
	}

	@media (max-width: 480px) {
		gap: 12px;
	}
`;

export const MobileReportGrid = styled.div`
	display: none;

	@media (max-width: 1024px) {
		display: grid;
		grid-template-columns: 1fr;
		gap: 10px;
	}
`;

export const DesktopReportSelect = styled.div`
	display: block;

	@media (max-width: 1024px) {
		display: none;
	}
`;

export const ReportSetupPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

export const ReportOutputPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;

	@media (max-width: 1024px) {
		gap: 12px;
	}
`;

export const ReportStepHeader = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

export const ReportStepKicker = styled.div`
	font-size: 12px;
	font-weight: 700;
	color: ${COLORS.primary};
	text-transform: uppercase;
	letter-spacing: 0.04em;
`;

export const ReportStepText = styled.p`
	margin: 0;
	font-size: 13px;
	line-height: 1.45;
	color: ${COLORS.gray600};
`;

export const ReportCategoryGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 8px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

export const ReportCategoryButton = styled.button<{ $active?: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
	min-height: 76px;
	padding: 12px;
	border: 1px solid ${({ $active }) => ($active ? COLORS.primary : COLORS.gray300)};
	border-radius: 8px;
	background: ${({ $active }) => ($active ? COLORS.primaryLight : COLORS.bgWhite)};
	color: ${COLORS.gray900};
	text-align: left;
	cursor: pointer;
	transition: border-color 0.18s ease, background-color 0.18s ease;

	&:hover {
		border-color: ${COLORS.primaryHover};
	}

	&:focus-visible {
		outline: 3px solid ${COLORS.primaryLight};
		outline-offset: 2px;
	}
`;

export const ReportCategoryTitle = styled.span`
	font-size: 14px;
	font-weight: 700;
	color: ${COLORS.gray900};
`;

export const ReportCategoryDescription = styled.span`
	font-size: 12px;
	line-height: 1.35;
	color: ${COLORS.gray600};
`;

export const ReportTemplateGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 10px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

export const MobileReportCard = styled.button<{ $active?: boolean; $locked?: boolean }>`
	text-align: left;
	border: 1px solid ${({ $active }) => ($active ? COLORS.primaryHover : COLORS.gray300)};
	background: ${({ $active }) => ($active ? COLORS.primaryLight : COLORS.bgWhite)};
	border-radius: 8px;
	padding: 12px;
	box-shadow: ${({ $active }) =>
		$active ? '0 8px 20px rgba(4, 120, 87, 0.12)' : 'none'};
	cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
	opacity: ${({ $locked }) => ($locked ? 0.72 : 1)};
	transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;

	&:focus-visible {
		outline: 3px solid ${COLORS.primaryLight};
		outline-offset: 2px;
	}
`;

export const MobileReportCardTitle = styled.div`
	font-size: 14px;
	font-weight: 700;
	color: #111827;
	margin-bottom: 4px;
`;

export const MobileReportCardDescription = styled.div`
	font-size: 12px;
	line-height: 1.45;
	color: #4b5563;
`;

export const MobileReportCardMeta = styled.div`
	margin-top: 8px;
	font-size: 11px;
	font-weight: 700;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.03em;
`;

export const SelectedReportSummary = styled.div`
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 12px;
	align-items: center;
	padding: 12px;
	border: 1px solid ${COLORS.border};
	border-radius: 8px;
	background: ${COLORS.gray50};

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

export const SelectedReportTitle = styled.div`
	font-size: 15px;
	font-weight: 700;
	color: ${COLORS.gray900};
`;

export const SelectedReportMeta = styled.div`
	font-size: 12px;
	color: ${COLORS.gray600};
	margin-top: 3px;
`;

export const AdvancedColumnsToggle = styled.button`
	border: 1px solid ${COLORS.gray300};
	border-radius: 8px;
	background: ${COLORS.bgWhite};
	color: ${COLORS.gray800};
	font-size: 13px;
	font-weight: 700;
	padding: 10px 12px;
	cursor: pointer;
	text-align: left;

	&:hover {
		border-color: ${COLORS.primaryHover};
		color: ${COLORS.primary};
	}
`;

export const Section = styled.div`
	background: ${COLORS.bgWhite};
	border: 1px solid ${COLORS.border};
	border-radius: 8px;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 16px;

	@media (max-width: 1024px) {
		padding: 16px;
		gap: 12px;
	}

	@media (max-width: 480px) {
		padding: 12px;
		gap: 10px;
	}
`;

export const SectionTitle = styled.h2`
	font-size: 18px;
	font-weight: 700;
	color: #1f2937;
	margin: 0;
	letter-spacing: 0.3px;
	margin: 0;
	padding-bottom: 12px;
	border-bottom: 1px solid #e5e7eb;

	@media (max-width: 480px) {
		font-size: 14px;
		padding-bottom: 10px;
	}
`;

export const Input = styled.input`
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 14px;
	color: #1f2937;
	background-color: white;
	transition:
		border-color 0.2s ease,
		box-shadow 0.2s ease;

	&:hover {
		border-color: #9ca3af;
	}

	&:focus {
		outline: none;
		border-color: ${COLORS.primaryHover};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
	}

	@media (max-width: 480px) {
		font-size: 13px;
		padding: 8px 10px;
	}
`;

export const ColumnsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
	gap: 8px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 8px;
	}

	@media (max-width: 480px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
	}
`;

export const CheckboxWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 8px;
	border: 1px solid #e5e7eb;
	border-radius: 5px;
	cursor: pointer;
	transition: background-color 0.2s ease;
	background-color: white;

	&:hover {
		background-color: #f3f4f6;
	}

	@media (max-width: 480px) {
		padding: 5px 6px;
		gap: 4px;
	}
`;

export const Checkbox = styled.input`
	cursor: pointer;
	width: 14px;
	height: 14px;
	accent-color: ${COLORS.primaryHover};
	flex-shrink: 0;

	@media (max-width: 480px) {
		width: 12px;
		height: 12px;
	}
`;

export const CheckboxLabel = styled.label`
	font-size: 12px;
	color: #374151;
	cursor: pointer;
	margin: 0;
	line-height: 1.2;

	@media (max-width: 480px) {
		font-size: 11px;
	}
`;

export const FilterContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;

	@media (max-width: 480px) {
		gap: 10px;
	}
`;

export const FilterRow = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
		gap: 8px;
	}
`;

export const ButtonGroup = styled.div`
	display: flex;
	gap: 12px;
	margin-top: 8px;

	@media (max-width: 480px) {
		gap: 8px;
		margin-top: 6px;
	}
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
	padding: 10px 16px;
	border: none;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	white-space: nowrap;

	background-color: ${(props) =>
		props.variant === 'secondary' ? COLORS.gray200 : COLORS.primary};
	color: ${(props) => (props.variant === 'secondary' ? COLORS.gray700 : COLORS.white)};

	&:hover:not(:disabled) {
		background-color: ${(props) =>
		props.variant === 'secondary' ? COLORS.gray300 : COLORS.primaryHover};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		padding: 8px 12px;
		font-size: 12px;
		flex: 1;
	}
`;

export const PreviewSection = styled.div`
	background: ${COLORS.bgWhite};
	border: 1px solid ${COLORS.border};
	border-radius: 8px;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	grid-column: 1 / -1;

	@media (max-width: 1024px) {
		padding: 16px;
		gap: 12px;
	}

	@media (max-width: 480px) {
		padding: 12px;
		gap: 10px;
	}
`;

export const LoadingMessage = styled.div`
	padding: 16px;
	background-color: ${COLORS.successLight};
	color: ${COLORS.primaryDark};
	border-radius: 8px;
	border-left: 4px solid ${COLORS.primaryDark};
	font-size: 14px;
	text-align: center;
	grid-column: 1 / -1;
`;

export const PreviewTable = styled.div`
	overflow-x: auto;
	border: 1px solid #e5e7eb;
	border-radius: 6px;

	@media (max-width: 768px) {
		display: none;
	}

	@media (max-width: 480px) {
		margin: 0 -4px;
	}
`;

export const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	background: white;

	thead {
		background: #f9fafb;
		border-bottom: 2px solid #e5e7eb;
		position: sticky;
		top: 0;
	}

	th {
		padding: 12px;
		text-align: left;
		font-weight: 600;
		color: #374151;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;

		@media (max-width: 1024px) {
			padding: 10px;
			font-size: 11px;
		}

		@media (max-width: 480px) {
			padding: 8px;
			font-size: 10px;
		}
	}

	td {
		padding: 12px;
		border-bottom: 1px solid #e5e7eb;
		color: #4b5563;
		font-size: 13px;

		@media (max-width: 1024px) {
			padding: 10px;
			font-size: 12px;
		}

		@media (max-width: 480px) {
			padding: 8px;
			font-size: 11px;
		}
	}

	tbody tr:hover {
		background: #f9fafb;
	}
`;

export const MobilePreviewCards = styled.div`
	display: none;

	@media (max-width: 768px) {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
`;

export const MobilePreviewCard = styled.article`
	border: 1px solid #e2e8f0;
	border-radius: 14px;
	background: #ffffff;
	box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
	overflow: hidden;
`;

export const MobilePreviewCardHeader = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 14px 14px 12px;
	background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
	border-bottom: 1px solid #e2e8f0;
`;

export const MobilePreviewCardKicker = styled.div`
	font-size: 11px;
	font-weight: 800;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	color: #64748b;
`;

export const MobilePreviewCardTitle = styled.div`
	font-size: 15px;
	font-weight: 800;
	line-height: 1.35;
	color: #0f172a;
	overflow-wrap: anywhere;
`;

export const MobilePreviewFieldList = styled.dl`
	display: flex;
	flex-direction: column;
	margin: 0;
	padding: 4px 14px 12px;
`;

export const MobilePreviewField = styled.div`
	display: grid;
	grid-template-columns: minmax(92px, 0.42fr) minmax(0, 0.58fr);
	gap: 10px;
	padding: 10px 0;
	border-bottom: 1px solid #f1f5f9;

	&:last-child {
		border-bottom: none;
	}

	@media (max-width: 420px) {
		grid-template-columns: 1fr;
		gap: 4px;
	}
`;

export const MobilePreviewLabel = styled.dt`
	margin: 0;
	font-size: 12px;
	font-weight: 800;
	color: #475569;
`;

export const MobilePreviewValue = styled.dd`
	margin: 0;
	font-size: 13px;
	line-height: 1.45;
	color: #111827;
	overflow-wrap: anywhere;
`;

export const MobilePreviewEmptyColumns = styled.div`
	border: 1px dashed #cbd5e1;
	border-radius: 12px;
	background: #f8fafc;
	color: #475569;
	font-size: 13px;
	font-weight: 700;
	padding: 14px;
	text-align: center;
`;

export const EmptyMessage = styled.div`
	text-align: center;
	padding: 40px 20px;
	color: #9ca3af;
	font-size: 14px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;

	@media (max-width: 480px) {
		padding: 30px 15px;
		font-size: 12px;
	}
`;

export const ActionButtons = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	padding-top: 12px;
	border-top: 1px solid #e5e7eb;

	@media (max-width: 1024px) {
		gap: 10px;
	}

	@media (max-width: 480px) {
		gap: 8px;
		flex-direction: column;

		button {
			width: 100%;
		}
	}
`;

export const SelectAllWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	margin-bottom: 8px;
	background: #f3f4f6;
	border-radius: 6px;
	border: 1px solid #e5e7eb;

	@media (max-width: 480px) {
		padding: 6px;
		gap: 6px;
		margin-bottom: 6px;
	}
`;

export const ColumnOptionsStack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 8px;

	${SelectAllWrapper} {
		margin-bottom: 0;
	}
`;

export const ColumnOptionWrapper = styled.label`
	display: flex;
	align-items: flex-start;
	gap: 8px;
	padding: 10px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	cursor: pointer;

	&:hover {
		background: #f1f5f9;
	}

	@media (max-width: 480px) {
		padding: 9px;
		gap: 7px;
	}
`;

export const ColumnOptionText = styled.span`
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
`;

export const SelectAllLabel = styled.label`
	font-size: 13px;
	font-weight: 600;
	color: #374151;
	cursor: pointer;
	margin: 0;

	@media (max-width: 480px) {
		font-size: 12px;
	}
`;

export const ColumnOptionHelp = styled.span`
	font-size: 12px;
	line-height: 1.4;
	color: #64748b;

	@media (max-width: 480px) {
		font-size: 11px;
	}
`;

export const InfoMessage = styled.div`
	background: ${COLORS.primaryLight};
	border: 1px solid ${COLORS.primaryHover};
	border-radius: 6px;
	padding: 12px;
	font-size: 13px;
	color: ${COLORS.primary};

	@media (max-width: 480px) {
		padding: 10px;
		font-size: 12px;
	}
`;
