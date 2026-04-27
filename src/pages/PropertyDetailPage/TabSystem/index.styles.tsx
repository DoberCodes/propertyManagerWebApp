import { styled } from 'styled-components';
import { ContractorCategory } from '../../../types/Contractor.types';

export const HeaderContainer = styled.div`
	display: block;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
	gap: 1rem;

	h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #333;
	}

	@media (max-width: 480px) {
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;

		h2 {
			font-size: 1.25rem;
			flex-basis: 100%;
			text-align: center;
		}
	}
`;

export const ContentWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
	height: 80%;
	background-color: #f8f9fa;
	overflow: scroll;
	@media (max-width: 480px) {
		padding: 15px;
	}
`;

export const CategoryBadge = styled.span<{ category: ContractorCategory }>`
	display: inline-block;
	padding: 0.25rem 0.75rem;
	border-radius: 12px;
	font-size: 0.85rem;
	font-weight: 500;
	background-color: ${(props) => {
		const colors: Record<ContractorCategory, string> = {
			Landscaper: '#E8F5E9',
			Contractor: '#E3F2FD',
			'Pest Control': '#FFF3E0',
			Plumber: '#FCE4EC',
			Electrician: '#F3E5F5',
			HVAC: '#E0F2F1',
			Roofer: '#EFEBE9',
			Painter: '#FBE9E7',
			'Cleaning Service': '#F1F8E9',
			Handyman: '#E8EAF6',
			Other: '#EEEEEE',
		};
		return colors[props.category] || '#EEEEEE';
	}};
	color: ${(props) => {
		const colors: Record<ContractorCategory, string> = {
			Landscaper: '#1B5E20',
			Contractor: '#0D47A1',
			'Pest Control': '#E65100',
			Plumber: '#880E4F',
			Electrician: '#4A148C',
			HVAC: '#004D40',
			Roofer: '#3E2723',
			Painter: '#BF360C',
			'Cleaning Service': '#33691E',
			Handyman: '#311B92',
			Other: '#424242',
		};
		return colors[props.category] || '#424242';
	}};
`;

export const Toolbar = styled.div`
	display: flex;
	gap: 12px;
	margin-bottom: 20px;
	align-items: center;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 8px;
		justify-content: center;
		margin-bottom: 16px;
	}
`;

export const TabSummaryBar = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 12px;
`;

export const TabSummaryPill = styled.div`
	height: 30px;
	display: inline-flex;
	align-items: center;
	padding: 0 10px;
	border-radius: 999px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	font-size: 0.75rem;
	font-weight: 700;
	color: #334155;
`;

export const ToolbarButton = styled.button`
	background-color: #22c55e;
	color: white;
	border: none;
	padding: 8px 12px;
	border-radius: 4px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;
	white-space: nowrap;

	&:hover:not(:disabled) {
		background-color: #16a34a;
	}

	&:disabled {
		background-color: #9ca3af !important;
		cursor: not-allowed;
		opacity: 0.6;
	}

	&.delete {
		background-color: #ef4444;
		&:hover:not(:disabled) {
			background-color: #dc2626;
		}
	}

	@media (max-width: 480px) {
		padding: 12px 16px;
		font-size: 16px;
		min-height: 44px;
	}
`;

export const StatusBadge = styled.span<{ status: string }>`
	display: inline-block;
	padding: 4px 10px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 600;
	width: fit-content;
	border: 1px solid transparent;
	${(props) =>
		props.status === 'Overdue' &&
		`
		border-color: rgba(239, 68, 68, 0.4);
		letter-spacing: 0.2px;
	`}
	background-color: ${(props) => {
		switch (props.status) {
			// Task statuses
			case 'Completed':
			case 'Low':
				return 'rgba(34, 197, 94, 0.1)';
			case 'In Progress':
				return 'rgba(59, 130, 246, 0.1)';
				case 'Initiated':
			case 'Pending':
			case 'Medium':
				return 'rgba(245, 158, 11, 0.1)';
			case 'Overdue':
			case 'Urgent':
			case 'High':
				return 'rgba(239, 68, 68, 0.1)';
			// Device statuses
			case 'Active':
				return 'rgba(34, 197, 94, 0.1)';
			case 'Maintenance':
				return 'rgba(245, 158, 11, 0.1)';
			case 'Broken':
				return 'rgba(239, 68, 68, 0.1)';
			case 'Decommissioned':
				return 'rgba(107, 114, 128, 0.1)';
			default:
				return 'rgba(0, 0, 0, 0.05)';
		}
	}};
	color: ${(props) => {
		switch (props.status) {
			// Task statuses
			case 'Completed':
			case 'Low':
				return '#22c55e';
			case 'In Progress':
				return '#3b82f6';
				case 'Initiated':
			case 'Pending':
			case 'Medium':
				return '#f59e0b';
			case 'Overdue':
			case 'Urgent':
			case 'High':
				return '#ef4444';
			// Device statuses
			case 'Active':
				return '#22c55e';
			case 'Maintenance':
				return '#f59e0b';
			case 'Broken':
				return '#ef4444';
			case 'Decommissioned':
				return '#6b7280';
			default:
				return '#666666';
		}
	}};
`;

export const EmptyState = styled.div`
	text-align: center;
	padding: 2rem;
	color: #666;

	p {
		margin: 0 0 1rem 0;
		font-size: 1rem;
	}
`;

export const LoadingSpinner = styled.div`
	text-align: center;
	padding: 2rem;
	color: #666;
`;

export const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(15, 23, 42, 0.42);
	backdrop-filter: blur(2px);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;

	@media (max-width: 480px) {
		padding: 0.5rem;
		align-items: flex-start;
		padding-top: 2rem;
	}
`;

export const FormContainer = styled.div`
	background: linear-gradient(180deg, #ffffff 0%, #fcfdfc 100%);
	border-radius: 12px;
	border: 1px solid #e5e7eb;
	padding: 2rem;
	max-width: 620px;
	width: 90%;
	box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
	max-height: 90vh;
	overflow-y: auto;

	@media (max-width: 1024px) {
		max-width: 90%;
		padding: 1.5rem;
	}

	@media (max-width: 480px) {
		max-width: 95%;
		padding: 1rem;
		border-radius: 10px;
		margin-top: 1rem;
		max-height: 85vh;
	}
`;

export const Title = styled.h2`
	margin: 0 0 1.5rem 0;
	font-size: 1.65rem;
	color: #0f172a;

	@media (max-width: 480px) {
		font-size: 1.25rem;
		margin-bottom: 1rem;
	}
`;

export const FormGroup = styled.div`
	margin-bottom: 0.35rem;
	display: flex;
	flex-direction: column;
`;

export const Label = styled.label`
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: #333;
	font-size: 0.95rem;

	span {
		color: #e74c3c;
	}
`;

export const BaseInput = `
	padding: 0.75rem;
	border: 1px solid #cbd5e1;
	border-radius: 8px;
	font-size: 1rem;
	font-family: inherit;

	&:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.14);
	}
`;

export const Input = styled.input`
	${BaseInput}
`;

export const Select = styled.select`
	${BaseInput}
	background-color: white;
`;

export const Textarea = styled.textarea`
	${BaseInput}
	resize: vertical;
	min-height: 80px;
`;

export const ButtonGroup = styled.div`
	display: flex;
	gap: 1rem;
	justify-content: flex-end;
	margin-top: 1.6rem;
	padding-top: 0.95rem;
	border-top: 1px solid #e5e7eb;

	@media (max-width: 480px) {
		flex-direction: column-reverse;
		gap: 0.5rem;
	}
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 4px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	background-color: ${(props) =>
		props.variant === 'secondary' ? '#95a5a6' : '#27ae60'};
	color: white;

	&:hover {
		background-color: ${(props) =>
			props.variant === 'secondary' ? '#7f8c8d' : '#229954'};
	}

	&:disabled {
		background-color: #bdc3c7;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		width: 100%;
		min-height: 44px;
	}
`;

export const ErrorMessage = styled.div`
	background-color: #f8d7da;
	color: #721c24;
	padding: 0.75rem;
	border-radius: 4px;
	margin-bottom: 1rem;
	font-size: 0.9rem;
`;

export const SuccessMessage = styled.div`
	background-color: #d4edda;
	color: #155724;
	padding: 0.75rem;
	border-radius: 4px;
	margin-bottom: 1rem;
	font-size: 0.9rem;
`;

export const FormIntroCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.65rem;
	margin-bottom: 1.1rem;
	padding: 0.9rem 1rem;
	border-radius: 10px;
	border: 1px solid #bbf7d0;
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
`;

export const FormIntroText = styled.p`
	margin: 0;
	font-size: 0.88rem;
	line-height: 1.45;
	color: #14532d;
`;

export const FormIntroPills = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`;

export const FormIntroPill = styled.span<{ $tone?: 'success' | 'neutral' }>`
	display: inline-flex;
	align-items: center;
	padding: 0.25rem 0.6rem;
	border-radius: 999px;
	font-size: 0.75rem;
	font-weight: 700;
	border: 1px solid
		${(props) => (props.$tone === 'success' ? '#86efac' : '#d1d5db')};
	background: ${(props) => (props.$tone === 'success' ? '#dcfce7' : '#ffffff')};
	color: ${(props) => (props.$tone === 'success' ? '#166534' : '#334155')};
`;

export const FormGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.95rem;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`;

export const FormFullWidth = styled.div`
	grid-column: 1 / -1;
`;

export const InlineError = styled.span`
	font-size: 0.78rem;
	font-weight: 600;
	color: #b91c1c;
	margin-top: 0.35rem;
`;

export const DesktopTableWrapper = styled.div`
	@media (max-width: 1024px) {
		display: none;
	}
`;

export const GridContainer = styled.div`
	width: 100%;
	border: 1px solid #e0e0e0;
	border-radius: 6px;

	@media (max-width: 1024px) {
		overflow-x: auto;
	}
`;

export const GridTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	background-color: white;

	thead {
		background-color: #f9fafb;
		border-bottom: 2px solid #e5e7eb;
	}

	th {
		padding: 12px 16px;
		text-align: left;
		font-size: 12px;
		font-weight: 600;
		color: #374151;
		text-transform: uppercase;
		letter-spacing: 0.5px;

		@media (max-width: 1024px) {
			padding: 8px 12px;
			font-size: 11px;
		}

		@media (max-width: 480px) {
			padding: 6px 8px;
			font-size: 10px;
		}
	}

	td {
		padding: 12px 16px;
		border-bottom: 1px solid #f0f0f0;
		font-size: 14px;
		color: #333;

		@media (max-width: 1024px) {
			padding: 8px 12px;
			font-size: 12px;
		}

		@media (max-width: 480px) {
			padding: 6px 8px;
			font-size: 11px;
		}
	}

	tbody tr:hover {
		background-color: #f9fafb;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}
`;

export const MobileCarouselContainer = styled.div`
	display: none;
	@media (max-width: 1024px) {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 8px 0;
	}
`;

export const MobileCarouselViewport = styled.div`
	width: 100%;
	overflow: hidden;
	border-radius: 8px;
`;

export const MobileCarouselTrack = styled.div<{ index: number }>`
	display: flex;
	transition: transform 0.32s ease-out;
	transform: translateX(calc(${(p) => p.index} * -100%));
	user-select: none;
`;

export const BaseMobileCard = styled.div<{ $isSelected?: boolean }>`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	transition: all 0.2s ease;
	cursor: pointer;

	${({ $isSelected }) =>
		$isSelected &&
		`
        background: #f0fdf4;
        border-color: #22c55e;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15);
    `}

	&:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
	}

	@media (max-width: 480px) {
		padding: 14px;
		margin-bottom: 10px;
	}
`;

export const DeviceCard = styled(BaseMobileCard)`
	min-width: 100%;
	flex: 0 0 100%;
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const DeviceRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 8px;
`;

export const MobileDots = styled.div`
	display: flex;
	justify-content: center;
	gap: 6px;
`;

export const MobileDot = styled.button<{ $active?: boolean }>`
	width: 8px;
	height: 8px;
	border-radius: 999px;
	border: none;
	background: ${(props) => (props.$active ? '#22c55e' : '#d1d5db')};
	cursor: pointer;
`;

export const TabContainer = styled.div`
	display: flex;
	border-bottom: 2px solid #e0e0e0;
	background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
	flex-shrink: 0;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	height: 100%;
`;

// Tab controls
export const TabControlsContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: #ffffff;
	border-bottom: 2px solid #e0e0e0;
	margin-top: 10px;
	padding: 0 24px;
	flex-shrink: 0;

	@media (max-width: 1024px) {
		min-height: 0;
		padding: 5px 12px;
	}
`;

export const TabContentContainer = styled.div`
	padding: 1.5rem;
	flex: 1;

	@media (max-width: 1024px) {
	}

	@media (max-width: 480px) {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
`;

export const TaskDetailRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 0.75rem 0;
	border-bottom: 1px solid #e5e7eb;
	flex-direction: column;
	gap: 0.25rem;

	&:last-child {
		border-bottom: none;
	}

	@media (min-width: 1025px) {
		flex-direction: row;
		align-items: center;
		gap: 1rem;
	}
`;

export const TaskDetailLabel = styled.span`
	font-weight: 600;
	color: #374151;
	font-size: 14px;

	@media (min-width: 1025px) {
		min-width: 100px;
		font-size: 14px;
	}
`;

export const TaskDetailValue = styled.span`
	color: #6b7280;
	font-size: 14px;
	word-break: break-word;

	@media (min-width: 1025px) {
		flex: 1;
		text-align: right;
	}
`;

export const ModalActions = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 1.5rem;
	flex-direction: column;

	@media (min-width: 1025px) {
		flex-direction: row;
		flex-wrap: wrap;
	}

	& > * {
		flex: 1;
		min-width: fit-content;

		@media (min-width: 1025px) {
			flex: none;
		}
	}
`;

export const MobileTaskCard = styled(BaseMobileCard)<{ $isSelected: boolean }>`
	display: none;

	@media (max-width: 1024px) {
		display: block;
		padding: 12px;
	}
`;

export const MobileTaskHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 12px;
`;

export const MobileTaskTitle = styled.h3`
	font-size: 16px;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	line-height: 1.3;
	flex: 1;
	margin-right: 12px;

	@media (max-width: 480px) {
		font-size: 15px;
	}
`;

export const MobileTaskCheckbox = styled.input.attrs({ type: 'checkbox' })`
	width: 20px;
	height: 20px;
	cursor: pointer;
	accent-color: #22c55e;
	flex-shrink: 0;
	margin-top: 2px;
`;

export const MobileTaskMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-bottom: 10px;
`;

export const MobileTaskRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
`;

export const MobileTaskLabel = styled.span`
	font-size: 12px;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`;

export const MobileTaskValue = styled.span`
	font-size: 14px;
	color: #374151;
	font-weight: 500;
	margin-left: auto;
	text-align: right;
	min-width: 110px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

export const MobileTaskActions = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	padding-top: 8px;
	border-top: 1px solid #f3f4f6;
`;

export const MobileActionButton = styled.button<{
	variant?: 'primary' | 'secondary' | 'danger';
}>`
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 1px solid transparent;
	min-width: fit-content;

	${({ variant }) => {
		switch (variant) {
			case 'primary':
				return `
                    background: #22c55e;
                    color: white;
                    &:hover {
                        background: #16a34a;
                    }
                `;
			case 'danger':
				return `
                    background: #ef4444;
                    color: white;
                    &:hover {
                        background: #dc2626;
                    }
                `;
			default:
				return `
                    background: #f3f4f6;
                    color: #374151;
                    border-color: #d1d5db;
                    &:hover {
                        background: #e5e7eb;
                    }
                `;
		}
	}}

	@media (max-width: 480px) {
		padding: 12px 16px;
		font-size: 16px;
		min-height: 44px;
	}
`;

export const MobileContractorCard = styled(BaseMobileCard)`
	display: none;

	@media (max-width: 1024px) {
		display: block;
	}
`;

export const MobileContractorHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 12px;
`;

export const MobileContractorTitle = styled.h3`
	margin: 0;
	font-size: 16px;
	font-weight: 600;
	color: #1f2937;
`;

export const MobileContractorMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const MobileContractorRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

export const MobileContractorLabel = styled.span`
	font-size: 14px;
	font-weight: 500;
	color: #6b7280;
`;

export const MobileContractorValue = styled.span`
	font-size: 14px;
	color: #1f2937;
`;

export const MobileContractorActions = styled.div`
	display: flex;
	gap: 8px;
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px solid #e5e7eb;
`;
