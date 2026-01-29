import styled from 'styled-components';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 24px;
	padding: 20px;
	min-height: 100%;
	background-color: #fafafa;

	@media (max-width: 768px) {
		padding: 15px;
		gap: 16px;
	}

	@media (max-width: 480px) {
		padding: 10px;
		gap: 12px;
	}
`;

export const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 12px;
	}
`;

export const PageTitle = styled.h1`
	font-size: 32px;
	font-weight: 800;
	color: #1f2937;
	margin: 0;
	letter-spacing: 0.5px;

	@media (max-width: 768px) {
		font-size: 28px;
	}

	@media (max-width: 480px) {
		font-size: 24px;
	}
`;

export const PageDescription = styled.p`
	font-size: 14px;
	color: #6b7280;
	margin: 8px 0 0 0;

	@media (max-width: 480px) {
		font-size: 12px;
	}
`;

export const ReportBuilderContainer = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20px;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}

	@media (max-width: 768px) {
		gap: 16px;
	}

	@media (max-width: 480px) {
		gap: 12px;
	}
`;

export const Section = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 16px;

	@media (max-width: 768px) {
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

export const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const Label = styled.label`
	font-size: 15px;
	font-weight: 600;
	color: #374151;
	display: block;
	margin-bottom: 8px;

	@media (max-width: 480px) {
		font-size: 14px;
	}
`;

export const Select = styled.select`
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 14px;
	color: #1f2937;
	background-color: white;
	cursor: pointer;
	transition:
		border-color 0.2s ease,
		box-shadow 0.2s ease;

	&:hover {
		border-color: #9ca3af;
	}

	&:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}

	@media (max-width: 480px) {
		font-size: 13px;
		padding: 8px 10px;
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
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}

	@media (max-width: 480px) {
		font-size: 13px;
		padding: 8px 10px;
	}
`;

export const ColumnsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 12px;

	@media (max-width: 768px) {
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 10px;
	}

	@media (max-width: 480px) {
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 8px;
	}
`;

export const CheckboxWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #f9fafb;
	}

	@media (max-width: 480px) {
		padding: 6px;
		gap: 6px;
	}
`;

export const Checkbox = styled.input`
	cursor: pointer;
	width: 16px;
	height: 16px;
	accent-color: #22c55e;

	@media (max-width: 480px) {
		width: 14px;
		height: 14px;
	}
`;

export const CheckboxLabel = styled.label`
	font-size: 13px;
	color: #4b5563;
	cursor: pointer;
	margin: 0;
	flex: 1;

	@media (max-width: 480px) {
		font-size: 12px;
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
		props.variant === 'secondary' ? '#e5e7eb' : '#22c55e'};
	color: ${(props) => (props.variant === 'secondary' ? '#374151' : 'white')};

	&:hover:not(:disabled) {
		background-color: ${(props) =>
			props.variant === 'secondary' ? '#d1d5db' : '#16a34a'};
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
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	grid-column: 1 / -1;

	@media (max-width: 768px) {
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
	background-color: #d1fae5;
	color: #065f46;
	border-radius: 8px;
	border-left: 4px solid #065f46;
	font-size: 14px;
	text-align: center;
	grid-column: 1 / -1;
`;

export const PreviewTable = styled.div`
	overflow-x: auto;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
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

		@media (max-width: 768px) {
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

		@media (max-width: 768px) {
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

export const EmptyMessage = styled.div`
	text-align: center;
	padding: 40px 20px;
	color: #9ca3af;
	font-size: 14px;

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

	@media (max-width: 768px) {
		gap: 10px;
	}

	@media (max-width: 480px) {
		gap: 8px;
		flex-direction: column;
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

export const InfoMessage = styled.div`
	background: #ecfdf3;
	border: 1px solid #bbf7d0;
	border-radius: 6px;
	padding: 12px;
	font-size: 13px;
	color: #16a34a;

	@media (max-width: 480px) {
		padding: 10px;
		font-size: 12px;
	}
`;
