import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background-color: ${COLORS.bgLight};
`;

export const Container = styled.div`
	background: ${COLORS.bgWhite};
	margin: 0;
	padding: 2rem;
	width: 100%;
	max-width: 100%;
	position: relative;
	z-index: 1;
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;

	@media (max-width: 768px) {
		padding: 1.5rem;
	}

	@media (max-width: 480px) {
		padding: 1rem;
	}
`;

export const FormContentWrapper = styled.div`
	width: 100%;
	max-width: 1000px;
`;

export const TabContainer = styled.div`
	display: flex;
	gap: 1rem;
	border-bottom: 2px solid ${COLORS.gray100};
	margin-bottom: 2rem;
	overflow-x: auto;

	@media (max-width: 768px) {
		gap: 0.5rem;
	}
`;

export const Tab = styled.button<{ active: boolean }>`
	padding: 1rem 1.5rem;
	border: none;
	background: none;
	font-size: 1rem;
	font-weight: 600;
	color: ${(props) => (props.active ? COLORS.primary : COLORS.textSecondary)};
	border-bottom: 3px solid
		${(props) => (props.active ? COLORS.primary : 'transparent')};
	cursor: pointer;
	transition: all 0.2s ease;
	white-space: nowrap;

	&:hover {
		color: ${COLORS.primary};
	}

	@media (max-width: 768px) {
		padding: 0.75rem 1rem;
		font-size: 0.9rem;
	}
`;

export const FormSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	margin-bottom: 2rem;
	padding: 1.5rem;
	background: ${COLORS.bgWhite};
	border-radius: 8px;
	border: 1px solid ${COLORS.gray100};
`;

export const SectionTitle = styled.h3`
	font-size: 1.25rem;
	color: ${COLORS.textPrimary};
	margin: 0 0 1rem 0;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

export const FormRow = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 1.5rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 1rem;
	}
`;

export const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

export const FormLabel = styled.label`
	font-size: 0.9rem;
	font-weight: 600;
	color: ${COLORS.textPrimary};
`;

export const FormInput = styled.input`
	padding: 0.75rem;
	border: 1px solid ${COLORS.gray200};
	border-radius: 6px;
	font-size: 1rem;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
	}

	&:disabled {
		background-color: ${COLORS.gray100};
		cursor: not-allowed;
	}
`;

export const FormTextarea = styled.textarea`
	padding: 0.75rem;
	border: 1px solid ${COLORS.gray200};
	border-radius: 6px;
	font-size: 1rem;
	min-height: 100px;
	resize: vertical;
	font-family: inherit;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
	}
`;

export const FormSelect = styled.select`
	padding: 0.75rem;
	border: 1px solid ${COLORS.gray200};
	border-radius: 6px;
	font-size: 1rem;
	background-color: ${COLORS.bgWhite};
	cursor: pointer;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
	}

	&:disabled {
		background-color: ${COLORS.gray100};
		cursor: not-allowed;
	}
`;

export const CheckboxGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

export const Checkbox = styled.input.attrs({ type: 'checkbox' })`
	width: 1.25rem;
	height: 1.25rem;
	cursor: pointer;
`;

export const ButtonGroup = styled.div`
	display: flex;
	gap: 1rem;
	justify-content: flex-end;
	margin-top: 2rem;

	@media (max-width: 768px) {
		flex-direction: column;
		gap: 0.75rem;
	}
`;

export const SaveButton = styled.button`
	padding: 0.75rem 2rem;
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.bgWhite};
	border: none;
	border-radius: 6px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: opacity 0.2s ease;

	&:hover:not(:disabled) {
		opacity: 0.9;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

export const CancelButton = styled.button`
	padding: 0.75rem 2rem;
	background: ${COLORS.bgWhite};
	color: ${COLORS.textPrimary};
	border: 2px solid ${COLORS.gray200};
	border-radius: 6px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background: ${COLORS.gray100};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

export const AddButton = styled.button`
	padding: 0.5rem 1rem;
	background: ${COLORS.primary};
	color: ${COLORS.bgWhite};
	border: none;
	border-radius: 6px;
	font-size: 0.9rem;
	font-weight: 600;
	cursor: pointer;
	transition: opacity 0.2s ease;
	align-self: flex-start;

	&:hover {
		opacity: 0.9;
	}
`;

export const RemoveButton = styled.button`
	padding: 0.5rem 1rem;
	background: ${COLORS.error};
	color: ${COLORS.bgWhite};
	border: none;
	border-radius: 6px;
	font-size: 0.9rem;
	font-weight: 600;
	cursor: pointer;
	transition: opacity 0.2s ease;

	&:hover {
		opacity: 0.9;
	}
`;

export const ItemCard = styled.div`
	padding: 1rem;
	background: ${COLORS.bgLight};
	border-radius: 6px;
	border: 1px solid ${COLORS.gray200};
	margin-bottom: 1rem;
`;

export const ItemHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
`;

export const ItemTitle = styled.h4`
	font-size: 1rem;
	color: ${COLORS.textPrimary};
	margin: 0;
	font-weight: 600;
`;

export const ErrorMessage = styled.div`
	background-color: #fee;
	color: #c33;
	padding: 1rem;
	border-radius: 6px;
	margin-bottom: 1rem;
	border: 1px solid #fcc;
`;

export const SuccessMessage = styled.div`
	background-color: #efe;
	color: #3c3;
	padding: 1rem;
	border-radius: 6px;
	margin-bottom: 1rem;
	border: 1px solid #cfc;
`;

export const LoadingOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(255, 255, 255, 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;

	&::after {
		content: '';
		width: 50px;
		height: 50px;
		border: 4px solid ${COLORS.primaryLight};
		border-top-color: ${COLORS.primary};
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
`;

export const ProgressBar = styled.div<{ progress: number }>`
	width: 100%;
	height: 8px;
	background: ${COLORS.gray100};
	border-radius: 4px;
	overflow: hidden;
	margin-bottom: 2rem;

	&::after {
		content: '';
		display: block;
		height: 100%;
		width: ${(props) => props.progress}%;
		background: ${COLORS.gradientPrimary};
		transition: width 0.3s ease;
	}
`;

export const ProgressText = styled.div`
	text-align: center;
	font-size: 0.9rem;
	color: ${COLORS.textSecondary};
	margin-bottom: 1rem;
`;

export const InfoBox = styled.div`
	background: ${COLORS.primaryLight};
	border-left: 4px solid ${COLORS.primary};
	padding: 1rem;
	border-radius: 4px;
	margin-bottom: 1.5rem;
	font-size: 0.9rem;
	color: ${COLORS.textPrimary};
`;
