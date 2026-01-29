import styled from 'styled-components';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 30px;
	padding: 30px;
	background-color: #fafafa;
	min-height: 100%;

	@media (max-width: 768px) {
		gap: 20px;
		padding: 20px;
	}

	@media (max-width: 480px) {
		gap: 15px;
		padding: 15px;
	}
`;

export const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20px;
	padding-bottom: 20px;
	border-bottom: 2px solid #e5e7eb;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 10px;
		padding-bottom: 15px;
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

export const AddTeamGroupButton = styled.button`
	background-color: #22c55e;
	color: white;
	border: none;
	padding: 10px 16px; /* match Properties buttons */
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;
	white-space: nowrap;

	&:hover {
		background-color: #16a34a;
	}

	&:disabled {
		background-color: #d1d5db;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		padding: 10px 16px;
		font-size: 12px;
	}

	@media (max-width: 480px) {
		padding: 8px 12px;
		font-size: 11px;
		width: 100%;
	}
`;

export const TeamGroupSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;

	@media (max-width: 480px) {
		gap: 12px;
	}
`;

export const TeamGroupHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	padding: 16px 20px;
	background-color: white;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	flex-wrap: wrap;
	margin-bottom: 8px; /* breathing room before tiles, match Properties */

	@media (max-width: 768px) {
		padding: 12px 16px;
		gap: 12px;
	}

	@media (max-width: 480px) {
		padding: 10px;
	}
`;

export const TeamGroupTitle = styled.h2`
	font-size: 20px;
	font-weight: 700;
	color: #1f2937;
	margin: 0;
	flex: 1;
	letter-spacing: 0.3px;

	@media (max-width: 768px) {
		font-size: 18px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;

export const TeamGroupActions = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
`;

export const TeamGroupActionButton = styled.button`
	background: none;
	border: none;
	color: #6b7280;
	font-size: 18px;
	cursor: pointer;
	padding: 4px 8px; /* Keep flat style, but smaller padding aligns with Properties' compact feel */
	transition: color 0.2s ease;

	&:hover {
		color: #22c55e;
	}

	@media (max-width: 480px) {
		font-size: 16px;
		padding: 2px 4px;
	}
`;

export const TeamMembersGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	gap: 20px;
	padding: 0 0 10px 0;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		gap: 16px;
	}

	@media (max-width: 768px) {
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 12px;
	}

	@media (max-width: 480px) {
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 10px;
		padding: 0;
	}
`;

export const TeamMemberCard = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 16px;
	background-color: white;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	cursor: pointer;
	transition:
		box-shadow 0.2s ease,
		transform 0.2s ease;

	&:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
	}

	@media (max-width: 768px) {
		padding: 12px;
		gap: 8px;
	}

	@media (max-width: 480px) {
		padding: 10px;
		gap: 6px;
	}
`;

export const TeamMemberActions = styled.div`
	position: absolute;
	top: 8px;
	right: 8px;
	display: flex;
	gap: 4px;
	opacity: 0;
	transition: opacity 0.2s ease;

	${TeamMemberCard}:hover & {
		opacity: 1;
	}
`;

export const TeamMemberActionButton = styled.button`
	background-color: rgba(255, 255, 255, 0.95);
	border: 1px solid #e5e7eb;
	border-radius: 4px;
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: 14px;

	&:hover {
		background-color: #f3f4f6;
		transform: scale(1.1);
	}

	&.delete:hover {
		background-color: #fee2e2;
		color: #dc2626;
		border-color: #fecaca;
	}
`;

export const TeamMemberImage = styled.img`
	width: 100px;
	height: 100px;
	border-radius: 50%;
	object-fit: cover;
	background-color: #e5e7eb;

	@media (max-width: 768px) {
		width: 80px;
		height: 80px;
	}

	@media (max-width: 480px) {
		width: 70px;
		height: 70px;
	}
`;

export const TeamMemberImagePlaceholder = styled.div`
	width: 100px;
	height: 100px;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40px;
	color: white;
	font-weight: 600;
	line-height: 1;
	text-align: center;
	word-break: break-all;

	@media (max-width: 768px) {
		width: 80px;
		height: 80px;
		font-size: 32px;
	}

	@media (max-width: 480px) {
		width: 70px;
		height: 70px;
		font-size: 28px;
	}
`;

export const TeamMemberName = styled.h3`
	font-size: 14px;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	text-align: center;
	word-break: break-word;

	@media (max-width: 768px) {
		font-size: 12px;
	}

	@media (max-width: 480px) {
		font-size: 11px;
	}
`;

export const TeamMemberTitle = styled.p`
	font-size: 12px;
	color: #6b7280;
	margin: 0;
	text-align: center;
`;

export const AddTeamMemberCard = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 16px;
	background-color: #f3f4f6;
	border: 2px dashed #d1d5db;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: #e5e7eb;
		border-color: #22c55e;
		color: #22c55e;
	}
`;

export const AddIcon = styled.div`
	font-size: 32px;
	color: #6b7280;
`;

export const AddText = styled.p`
	font-size: 12px;
	font-weight: 600;
	color: #6b7280;
	margin: 0;
	text-align: center;
`;

// Dialog Styles
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
	border-radius: 12px;
	box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
	width: 90%;
	max-width: 800px;
	max-height: 90vh;
	display: flex;
	flex-direction: column;

	@media (max-width: 768px) {
		width: 95%;
		max-width: 600px;
		max-height: 85vh;
	}

	@media (max-width: 480px) {
		width: 98%;
		max-width: 100%;
		max-height: 95vh;
		border-radius: 8px;
	}
`;

export const DialogHeader = styled.div`
	padding: 24px;
	border-bottom: 1px solid #e5e7eb;
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-shrink: 0;

	@media (max-width: 768px) {
		padding: 16px;
	}

	@media (max-width: 480px) {
		padding: 12px;
	}
`;

export const DialogTitle = styled.h2`
	font-size: 20px;
	font-weight: 700;
	color: #1f2937;
	margin: 0;

	@media (max-width: 768px) {
		font-size: 18px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;

export const DialogCloseButton = styled.button`
	background: none;
	border: none;
	font-size: 24px;
	cursor: pointer;
	color: #6b7280;
	padding: 0;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		color: #1f2937;
	}
`;

export const DialogBody = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 30px;
	padding: 24px;
	overflow-y: auto;
	flex: 1;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 20px;
		padding: 16px;
	}

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
		gap: 15px;
		padding: 12px;
	}
`;

export const LeftColumn = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;

	@media (max-width: 480px) {
		gap: 15px;
	}
`;

export const RightColumn = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	overflow-y: auto;
	max-height: calc(90vh - 200px);

	@media (max-width: 768px) {
		max-height: calc(85vh - 200px);
		gap: 15px;
	}

	@media (max-width: 480px) {
		max-height: calc(95vh - 200px);
		gap: 15px;
	}

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 3px;
	}

	&::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;

		&:hover {
			background: #94a3b8;
		}
	}
`;

export const ImageUploadSection = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
`;

export const ImagePreview = styled.img`
	width: 120px;
	height: 120px;
	border-radius: 50%;
	object-fit: cover;
	background-color: #e5e7eb;
`;

export const ImageUploadInput = styled.input`
	display: none;
`;

export const ImageUploadButton = styled.label`
	background-color: #10b981;
	color: white;
	border: none;
	padding: 10px 16px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #059669;
	}
`;

export const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const FormLabel = styled.label`
	font-size: 13px;
	font-weight: 600;
	color: #374151;
`;

export const FormInput = styled.input`
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 14px;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

export const FormSelect = styled.select`
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 14px;
	background-color: white;
	transition: border-color 0.2s ease;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	option {
		padding: 8px;
	}
`;

export const FormTextarea = styled.textarea`
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 14px;
	font-family: inherit;
	resize: vertical;
	min-height: 80px;
	max-height: 120px;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

export const SectionTitle = styled.h3`
	font-size: 13px;
	font-weight: 600;
	color: #374151;
	margin: 0;
	padding-top: 8px;
`;

export const PropertyMultiSelect = styled.div`
	border: 1px solid #d1d5db;
	border-radius: 6px;
	padding: 8px;
	max-height: 120px;
	overflow-y: auto;
	background-color: white;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 3px;
	}

	&::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;

		&:hover {
			background: #94a3b8;
		}
	}
`;

export const PropertyCheckbox = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 4px;

	input[type='checkbox'] {
		cursor: pointer;
		width: 16px;
		height: 16px;
	}

	label {
		cursor: pointer;
		font-size: 13px;
		color: #374151;
		margin: 0;
		flex: 1;
	}
`;

export const QuickTaskHistory = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-height: 150px;
	overflow-y: auto;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 3px;
	}

	&::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;

		&:hover {
			background: #94a3b8;
		}
	}
`;

export const TaskHistoryItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 8px;
	padding: 8px;
	background-color: #f9fafb;
	border-radius: 4px;
	font-size: 12px;

	span {
		color: #6b7280;
	}
`;

export const FileUploadSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const FileUploadInput = styled.input`
	display: none;
`;

export const FileUploadButton = styled.label`
	background-color: #6b7280;
	color: white;
	border: none;
	padding: 10px 16px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #4b5563;
	}
`;

export const FileList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	max-height: 100px;
	overflow-y: auto;
`;

export const FileItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px;
	background-color: #f9fafb;
	border-radius: 4px;
	font-size: 12px;
	color: #6b7280;

	button {
		background: none;
		border: none;
		color: #ef4444;
		cursor: pointer;
		font-size: 14px;

		&:hover {
			color: #dc2626;
		}
	}
`;

export const DialogFooter = styled.div`
	padding: 20px 24px;
	border-top: 1px solid #e5e7eb;
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	flex-shrink: 0;
`;

export const DialogButton = styled.button`
	padding: 10px 20px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	border: none;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

export const CancelButton = styled(DialogButton)`
	background-color: #e5e7eb;
	color: #374151;

	&:hover:not(:disabled) {
		background-color: #d1d5db;
	}
`;

export const SaveButton = styled(DialogButton)`
	background-color: #22c55e;
	color: white;

	&:hover:not(:disabled) {
		background-color: #16a34a;
	}
`;

export const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 40px 20px;
	background-color: white;
	border-radius: 8px;
	border: 1px solid #e5e7eb;
	color: #6b7280;
	text-align: center;

	p {
		margin: 0;
		font-size: 14px;
	}
`;
