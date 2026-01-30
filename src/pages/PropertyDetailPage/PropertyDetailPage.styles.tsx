import styled from 'styled-components';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;
	min-height: 100%;
	background-color: #fafafa;
`;

export const Header = styled.div`
	position: relative;
	height: 150px;
	background-size: cover;
	background-position: center;
	background-color: #e0e0e0;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	padding: 50px 20px 20px;
	gap: 16px;
	flex-shrink: 0;

	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			to bottom,
			rgba(0, 0, 0, 0.2),
			rgba(0, 0, 0, 0.6)
		);
		pointer-events: none;
	}

	@media (max-width: 768px) {
		height: 198px;
		padding: 36px 15px 15px;
	}

	@media (max-width: 480px) {
		height: 120px;
		padding: 12px 12px 12px;
		gap: 8px;
	}
`;

export const HeaderContent = styled.div`
	position: relative;
	z-index: 2;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 16px;
	flex-wrap: wrap;

	@media (max-width: 768px) {
		gap: 10px;
	}

	@media (max-width: 480px) {
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}
`;

export const TabContainer = styled.div`
	display: flex;
	border-bottom: 2px solid #e0e0e0;
	background-color: #ffffff;
	flex-shrink: 0;
`;

export const TabButton = styled.button<{ isActive: boolean }>`
	background: none;
	border: none;
	padding: 16px 24px;
	font-size: 14px;
	font-weight: 600;
	color: ${(props) => (props.isActive ? '#22c55e' : '#666666')};
	cursor: pointer;
	border-bottom: 3px solid
		${(props) => (props.isActive ? '#22c55e' : 'transparent')};
	transition: all 0.2s ease;
	margin-bottom: -2px;
	white-space: nowrap;

	&:hover {
		color: #22c55e;
	}

	@media (max-width: 768px) {
		padding: 12px 16px;
		font-size: 12px;
	}

	@media (max-width: 480px) {
		padding: 10px 12px;
		font-size: 11px;
	}
`;

export const TabContent = styled.div`
	flex: 1;
	padding: 16px;
	overflow: visible;

	@media (max-width: 768px) {
		padding: 16px;
	}

	@media (max-width: 480px) {
		padding: 12px;
	}
`;

export const Toolbar = styled.div`
	display: flex;
	gap: 12px;
	margin-bottom: 20px;
	align-items: center;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 8px;
	}
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
		padding: 6px 10px;
		font-size: 11px;
	}
`;

export const GridContainer = styled.div`
	width: 100%;
	overflow-x: auto;
	border: 1px solid #e0e0e0;
	border-radius: 6px;

	@media (max-width: 768px) {
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

		@media (max-width: 768px) {
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

		@media (max-width: 768px) {
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

export const PropertyTitle = styled.h1`
	color: white;
	font-size: 36px;
	font-weight: 800;
	margin: 0;
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	letter-spacing: 0.5px;

	@media (max-width: 768px) {
		font-size: 28px;
	}

	@media (max-width: 480px) {
		font-size: 22px;
	}
`;

export const FavoriteButton = styled.button`
	background-color: #22c55e;
	color: white;
	border: none;
	padding: 12px 20px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition:
		background-color 0.2s ease,
		transform 0.1s ease;
	position: relative;
	z-index: 2;

	&:hover {
		background-color: #16a34a;
	}

	&:active {
		transform: scale(0.98);
	}

	@media (max-width: 480px) {
		padding: 10px 14px;
		font-size: 12px;
		width: 100%;
		text-align: center;
	}
`;

export const BackButton = styled.button`
	position: absolute;
	top: 20px;
	left: 20px;
	background-color: rgba(0, 0, 0, 0.5);
	color: white;
	border: none;
	padding: 10px 16px;
	border-radius: 4px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;
	z-index: 3;

	&:hover {
		background-color: rgba(0, 0, 0, 0.7);
	}
`;

export const SectionContainer = styled.div`
	padding: 24px;
	border-bottom: 1px solid #e0e0e0;

	&:last-child {
		border-bottom: none;
	}
`;

export const SectionHeader = styled.h2`
	font-size: 20px;
	font-weight: 600;
	color: #333;
	margin: 0 0 20px 0;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

export const AddButton = styled.button`
	padding: 8px 16px;
	background-color: #22c55e;
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: #16a34a;
	}
`;

export const InfoGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 12px;
	}
`;

export const InfoCard = styled.div`
	background-color: white;
	border: 1px solid #e0e0e0;
	border-radius: 6px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;

	@media (max-width: 768px) {
		padding: 12px;
	}

	@media (max-width: 480px) {
		padding: 10px;
	}
`;

export const InfoLabel = styled.label`
	font-size: 12px;
	font-weight: 600;
	color: #999999;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`;

export const InfoValue = styled.span`
	font-size: 14px;
	color: #333;
	word-break: break-word;
`;

export const DevicesGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 16px;
`;

export const DeviceCard = styled.div`
	background-color: white;
	border: 1px solid #e0e0e0;
	border-radius: 6px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

export const DeviceField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

export const MaintenanceList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

export const MaintenanceItem = styled.div`
	background-color: white;
	border: 1px solid #e0e0e0;
	border-radius: 6px;
	padding: 16px;
	display: flex;
	gap: 16px;
	align-items: flex-start;
`;

export const MaintenanceDate = styled.div`
	min-width: 100px;
	font-size: 12px;
	font-weight: 600;
	color: #22c55e;
	background-color: rgba(34, 197, 94, 0.1);
	padding: 6px 10px;
	border-radius: 4px;
`;

export const MaintenanceDescription = styled.div`
	flex: 1;
	font-size: 14px;
	color: #333;
	line-height: 1.5;
`;

export const TasksGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: 16px;
`;

export const TaskCard = styled.div`
	background-color: white;
	border: 1px solid #e0e0e0;
	border-radius: 6px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
	transition: box-shadow 0.2s ease;

	&:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
`;

export const TaskStatus = styled.span<{ status: string }>`
	display: inline-block;
	padding: 4px 10px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 600;
	width: fit-content;
	background-color: ${(props) => {
		switch (props.status) {
			case 'Completed':
				return 'rgba(34, 197, 94, 0.1)';
			case 'In Progress':
				return 'rgba(59, 130, 246, 0.1)';
			case 'Pending':
				return 'rgba(245, 158, 11, 0.1)';
			default:
				return 'rgba(0, 0, 0, 0.05)';
		}
	}};
	color: ${(props) => {
		switch (props.status) {
			case 'Completed':
				return '#22c55e';
			case 'In Progress':
				return '#10b981';
			case 'Pending':
				return '#f59e0b';
			default:
				return '#666666';
		}
	}};
`;

export const EmptyState = styled.div`
	background-color: white;
	border: 1px dashed #e0e0e0;
	border-radius: 6px;
	padding: 40px 20px;
	text-align: center;
	color: #999999;

	p {
		margin: 0;
		font-size: 14px;
	}

	h2 {
		margin: 0 0 12px 0;
		font-size: 20px;
		font-weight: 700;
		color: #1f2937;
		letter-spacing: 0.3px;
	}

	button {
		margin-top: 16px;
	}
`;

// Title editing styles
export const TitleContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	flex: 1;
	text-align: center;
`;

export const EditableTitleInput = styled.input`
	background: transparent;
	border: none;
	color: white;
	padding: 8px 12px;
	border-radius: 4px;
	font-size: 32px;
	font-weight: 700;
	width: 500px;

	&:focus {
		outline: none;
	}

	&::placeholder {
		color: rgba(255, 255, 255, 0.7);
	}
`;

export const PencilIcon = styled.button`
	background: rgba(0, 0, 0, 0.3);
	border: none;
	color: white;
	width: 36px;
	height: 36px;
	border-radius: 4px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: rgba(0, 0, 0, 0.5);
	}
`;

// Tab controls
export const TabControlsContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: #ffffff;
	border-bottom: 2px solid #e0e0e0;
	padding: 0 24px;
	flex-shrink: 0;
`;

export const TabButtonsWrapper = styled.div`
	display: flex;
	gap: 0;
`;

export const EditModeButton = styled.button`
	background-color: #22c55e;
	color: white;
	border: none;
	padding: 12px 16px;
	border-radius: 4px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;
	height: 100%;
	align-self: center;
	margin-left: auto;

	&:hover {
		background-color: #16a34a;
	}

	&:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
	}
`;

// Task table checkbox
export const TaskCheckbox = styled.input.attrs({ type: 'checkbox' })`
	width: 18px;
	height: 18px;
	cursor: pointer;
	accent-color: #22c55e;
`;

// Dialog styles
export const DialogOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

export const DialogContent = styled.div`
	background-color: white;
	border-radius: 8px;
	padding: 32px;
	max-width: 500px;
	width: 90%;
	max-height: 80vh;
	overflow-y: auto;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

export const DialogHeader = styled.h2`
	margin: 0 0 24px 0;
	font-size: 24px;
	font-weight: 700;
	color: #333;
`;

export const DialogForm = styled.form`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

export const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const FormLabel = styled.label`
	font-size: 13px;
	font-weight: 600;
	color: #666;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`;

export const FormInput = styled.input`
	padding: 10px 12px;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	font-size: 14px;
	font-family: inherit;

	&:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}
`;

export const FormSelect = styled.select`
	padding: 10px 12px;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	font-size: 14px;
	font-family: inherit;

	&:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}
`;

export const FormTextarea = styled.textarea`
	padding: 10px 12px;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	font-size: 14px;
	font-family: inherit;
	resize: vertical;
	min-height: 100px;

	&:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}
`;

export const DialogButtonGroup = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	margin-top: 24px;
`;

export const DialogCancelButton = styled.button`
	background-color: #f3f4f6;
	color: #333;
	border: none;
	padding: 10px 16px;
	border-radius: 4px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #e5e7eb;
	}
`;

export const DialogSubmitButton = styled.button`
	background-color: #22c55e;
	color: white;
	border: none;
	padding: 10px 16px;
	border-radius: 4px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #16a34a;
	}

	&:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
	}
`;

// Minimal edit button (moved to Details tab)
export const MinimalEditButton = styled.button`
	background: none;
	border: none;
	color: #333333;
	font-size: 24px;
	font-weight: 600;
	cursor: pointer;
	padding: 8px 12px;
	transition: color 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		color: #22c55e;
	}

	&:disabled {
		color: #9ca3af;
		cursor: not-allowed;
	}
`;

// Editable field container
export const EditableFieldContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

export const EditableFieldValue = styled.div`
	font-size: 14px;
	color: #333;
	word-break: break-word;
	padding: 6px 0;
`;

export const EditableFieldInput = styled.input`
	padding: 8px 10px;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	font-size: 14px;
	font-family: inherit;
	background-color: #ffffff;

	&:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}
`;

export const DetailsEditHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
`;
// Device section header with add button
export const DevicesSectionHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
`;

export const AddDeviceButton = styled.button`
	background-color: #22c55e;
	color: white;
	border: none;
	padding: 8px 12px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #16a34a;
	}

	&:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
	}
`;
