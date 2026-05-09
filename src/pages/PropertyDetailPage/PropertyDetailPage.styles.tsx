import styled from 'styled-components';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;
	height: 100%;
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
`;

export const Header = styled.div`
	position: relative;
	height: 200px;
	background-size: cover;
	background-position: center;
	background-color: #e2e8f0;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	padding: 60px 20px 30px;
	gap: 20px;
	flex-shrink: 0;
	border-radius: 0 0 24px 24px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			135deg,
			rgba(0, 0, 0, 0.3) 0%,
			rgba(0, 0, 0, 0.5) 50%,
			rgba(0, 0, 0, 0.7) 100%
		);
		border-radius: 0 0 24px 24px;
		pointer-events: none;
	}

	@media (max-width: 1024px) {
		height: 180px;
		padding: 40px 15px 20px;
		border-radius: 0 0 20px 20px;
	}

	@media (max-width: 480px) {
		height: 104px;
		padding: 10px 10px 10px;
		gap: 8px;
		border-radius: 0 0 16px 16px;
	}
`;

export const ContentWrapper = styled.div`
	flex: 1;
	padding: 20px;
	background-color: #ffffff;
	border-radius: 12px;
	height: calc(100% - 220px);

	@media (max-width: 480px) {
		padding: 10px;
		border-radius: 10px;
	}
`;

export const HeaderContent = styled.div`
	position: relative;
	z-index: 2;
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	gap: 24px;
	flex-wrap: wrap;

	@media (max-width: 1024px) {
		gap: 16px;
		align-items: center;
	}

	@media (max-width: 480px) {
		flex-direction: column;
		align-items: center;
		gap: 12px;
		text-align: center;
	}
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
	position: relative;

	&:hover {
		color: #22c55e;
		background-color: rgba(34, 197, 94, 0.05);
	}

	${(props) =>
		props.isActive &&
		`
		&::after {
			content: '';
			position: absolute;
			bottom: -2px;
			left: 50%;
			transform: translateX(-50%);
			width: 20px;
			height: 3px;
			background: linear-gradient(90deg, #22c55e, #16a34a);
			border-radius: 2px 2px 0 0;
		}
	`}

	@media (max-width: 1024px) {
		padding: 12px 16px;
		font-size: 12px;
	}

	@media (max-width: 480px) {
		padding: 14px 16px;
		font-size: 16px;
		min-height: 48px;
		display: flex;
		align-items: center;
	}
`;

export const TabContent = styled.div`
	flex: 1;
	padding: 16px;
	overflow: visible;

	@media (max-width: 1024px) {
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
		justify-content: center;
		margin-bottom: 16px;
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
		padding: 12px 16px;
		font-size: 14px;
		min-height: 44px;
		display: flex;
		align-items: center;
	}
`;

export const GridContainer = styled.div`
	width: 100%;
	overflow-x: auto;
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

export const PropertyTitle = styled.h1`
	color: white;
	font-size: 2.5rem;
	font-weight: 800;
	margin: 0;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
	letter-spacing: -0.025em;
	line-height: 1.1;

	@media (max-width: 1024px) {
		font-size: 2rem;
	}

	@media (max-width: 480px) {
		font-size: 1.45rem;
	}
`;

export const FavoriteButton = styled.button`
	background-color: transparent;
	color: white;
	border: 1px solid rgba(255, 255, 255, 0.5);
	padding: 12px 20px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease, border-color 0.2s ease,
		transform 0.1s ease;
	position: relative;
	z-index: 2;

	&:hover {
		background-color: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.8);
	}

	&:active {
		transform: scale(0.98);
	}

	@media (max-width: 480px) {
		padding: 12px 16px;
		font-size: 16px;
		min-height: 44px;
		width: 100%;
		text-align: center;
	}
`;

export const BackButton = styled.button`
	position: absolute;
	top: 20px;
	left: 20px;
	color: white;
	background-color: transparent;
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

	@media (max-width: 480px) {
		padding: 12px 16px;
		font-size: 16px;
		min-height: 44px;
	}
`;

export const DevicesGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 16px;
`;

export const DeviceCard = styled.div`
	background: linear-gradient(
		135deg,
		rgba(255, 255, 255, 0.95),
		rgba(248, 250, 252, 0.95)
	);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 12px;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 14px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
	backdrop-filter: blur(8px);
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 1024px) {
		padding: 16px;
		gap: 12px;
	}

	@media (max-width: 480px) {
		padding: 12px;
		gap: 10px;
	}
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
	background: linear-gradient(
		135deg,
		rgba(255, 255, 255, 0.95),
		rgba(248, 250, 252, 0.95)
	);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 12px;
	padding: 20px;
	display: flex;
	gap: 18px;
	align-items: flex-start;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
	backdrop-filter: blur(8px);
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 1024px) {
		padding: 16px;
		gap: 14px;
	}

	@media (max-width: 480px) {
		padding: 12px;
		gap: 12px;
		flex-direction: column;
	}
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
	background: linear-gradient(
		135deg,
		rgba(255, 255, 255, 0.98),
		rgba(248, 250, 252, 0.98)
	);
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 12px;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 14px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
	backdrop-filter: blur(6px);
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	}

	@media (max-width: 1024px) {
		padding: 16px;
		gap: 12px;
	}

	@media (max-width: 480px) {
		padding: 12px;
		gap: 10px;
	}
`;

export const EmptyState = styled.div`
	background: linear-gradient(
		135deg,
		rgba(255, 255, 255, 0.95),
		rgba(248, 250, 252, 0.95)
	);
	border: 2px dashed rgba(148, 163, 184, 0.3);
	border-radius: 16px;
	padding: 48px 24px;
	text-align: center;
	color: #64748b;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
	backdrop-filter: blur(8px);

	p {
		margin: 0;
		font-size: 16px;
		font-weight: 400;
		line-height: 1.5;
	}

	h2 {
		margin: 0 0 16px 0;
		font-size: 24px;
		font-weight: 700;
		color: #1e293b;
		letter-spacing: 0.3px;
	}

	button {
		margin-top: 20px;
	}

	@media (max-width: 1024px) {
		padding: 32px 20px;

		h2 {
			font-size: 20px;
		}

		p {
			font-size: 14px;
		}
	}

	@media (max-width: 480px) {
		padding: 24px 16px;

		h2 {
			font-size: 18px;
		}

		p {
			font-size: 13px;
		}
	}
`;

// Title editing styles
export const TitleContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	flex: 1;

	@media (max-width: 480px) {
		flex-direction: column;
		gap: 8px;
	}
`;

export const EditableTitleInput = styled.input`
	background: rgba(255, 255, 255, 0.95);
	border: 2px solid #22c55e;
	border-radius: 8px;
	color: #1a1a1a;
	font-size: 2rem;
	font-weight: 700;
	padding: 8px 12px;
	width: 100%;
	max-width: 400px;
	text-shadow: none;
	letter-spacing: -0.025em;

	&:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
	}

	@media (max-width: 1024px) {
		font-size: 1.75rem;
		max-width: 300px;
	}

	@media (max-width: 480px) {
		font-size: 1.5rem;
		padding: 6px 10px;
		max-width: 250px;
	}
`;

export const PencilIcon = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.3);
	color: white;
	border-radius: 6px;
	padding: 6px 8px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s ease;
	backdrop-filter: blur(4px);

	&:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(1.05);
	}

	@media (max-width: 480px) {
		padding: 12px 16px;
		font-size: 16px;
		min-height: 44px;
	}
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

	@media (max-width: 480px) {
		padding: 12px 16px;
		font-size: 16px;
		min-height: 44px;
	}
`;

// Task table checkbox
export const TaskCheckbox = styled.input.attrs({ type: 'checkbox' })`
	width: 18px;
	height: 18px;
	cursor: pointer;
	accent-color: #22c55e;
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

	@media (max-width: 480px) {
		padding: 12px 16px;
		min-height: 44px;
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
	width: 100%;
	box-sizing: border-box;

	&:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}

	@media (max-width: 480px) {
		padding: 10px 12px;
		font-size: 16px;
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

	@media (max-width: 480px) {
		padding: 12px 16px;
		font-size: 16px;
		min-height: 44px;
		display: flex;
		align-items: center;
	}
`;

// Info Card and Grid Components for Property Detail Section
export const SectionContainer = styled.div`
	margin-bottom: 24px;
	width: 100%;

	@media (max-width: 1024px) {
		margin-bottom: 20px;
	}
	@media (max-width: 480px) {
		margin-bottom: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
`;

export const InfoGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 16px;
	margin-top: 12px;
	justify-items: center;
	width: 100%;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 14px;
		justify-items: center;
		width: 100%;
	}

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
		gap: 12px;
		justify-items: stretch;
		width: 100%;
		margin: 12px auto 0;
	}
`;

export const InfoCard = styled.div`
	background: linear-gradient(
		135deg,
		rgba(255, 255, 255, 0.95),
		rgba(248, 250, 252, 0.95)
	);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 12px;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	backdrop-filter: blur(8px);
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	min-height: 120px;
	width: 100%;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 1024px) {
		padding: 16px;
		gap: 8px;
		min-height: 100px;
		width: 100%;
	}

	@media (max-width: 480px) {
		padding: 16px;
		gap: 8px;
		width: 100%;
		min-height: 100px;
	}
`;

export const InfoLabel = styled.label`
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	color: #64748b;
	letter-spacing: 0.8px;
	margin-bottom: 4px;
	display: block;

	@media (max-width: 480px) {
		font-size: 12px;
		margin-bottom: 4px;
	}
`;

export const InfoValue = styled.span`
	font-size: 15px;
	font-weight: 500;
	color: #1e293b;
	word-break: break-word;
	line-height: 1.4;

	@media (max-width: 480px) {
		font-size: 15px;
		line-height: 1.4;
	}
`;
