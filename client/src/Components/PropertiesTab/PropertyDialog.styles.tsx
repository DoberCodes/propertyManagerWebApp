import styled from 'styled-components';

// Dialog container styles
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
	z-index: 10000;
`;

export const DialogContainer = styled.div`
	background-color: white;
	border-radius: 8px;
	width: 90%;
	max-width: 900px;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	overflow: hidden;

	@media (max-width: 1024px) {
		max-width: 800px;
	}

	@media (max-width: 768px) {
		max-width: 95%;
		max-height: 85vh;
	}

	@media (max-width: 480px) {
		width: 100%;
		max-width: 100%;
		max-height: 95vh;
		border-radius: 0;
	}
`;

export const DialogHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px 24px;
	border-bottom: 1px solid #e0e0e0;
	background-color: #fafafa;

	@media (max-width: 768px) {
		padding: 16px 20px;
	}

	@media (max-width: 480px) {
		padding: 12px 16px;
	}
`;

export const DialogTitle = styled.h2`
	font-size: 20px;
	font-weight: 600;
	color: black;
	margin: 0;

	@media (max-width: 768px) {
		font-size: 18px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;

export const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 28px;
	color: #999999;
	cursor: pointer;
	padding: 4px 8px;
	transition: color 0.2s ease;

	&:hover {
		color: #333333;
	}

	@media (max-width: 480px) {
		font-size: 24px;
		padding: 2px 4px;
	}
`;

export const DialogContent = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 24px;

	/* Scrollbar styling */
	&::-webkit-scrollbar {
		width: 8px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 4px;

		&:hover {
			background: #b6b9c1;
		}
	}

	@media (max-width: 768px) {
		padding: 16px 20px;
		gap: 16px;
	}

	@media (max-width: 480px) {
		padding: 12px 16px;
		gap: 12px;
	}
`;

export const FormSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

export const SectionTitle = styled.h3`
	font-size: 14px;
	font-weight: 600;
	color: #333333;
	margin: 0;
	text-transform: uppercase;
	letter-spacing: 0.5px;

	@media (max-width: 480px) {
		font-size: 12px;
		letter-spacing: 0.3px;
	}
`;

export const FormRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 16px;

	@media (max-width: 768px) {
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
		gap: 10px;
	}
`;

export const FormField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

export const Label = styled.label`
	font-size: 13px;
	font-weight: 600;
	color: #333333;

	@media (max-width: 480px) {
		font-size: 12px;
	}
`;

export const Input = styled.input`
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 4px;
	font-size: 14px;
	font-family: inherit;
	transition:
		border-color 0.2s ease,
		box-shadow 0.2s ease;

	&:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}

	&::placeholder {
		color: #b6b9c1;
	}

	@media (max-width: 480px) {
		padding: 8px 10px;
		font-size: 13px;
	}
`;

export const TextArea = styled.textarea`
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 4px;
	font-size: 14px;
	font-family: inherit;
	resize: vertical;
	min-height: 120px;
	transition:
		border-color 0.2s ease,
		box-shadow 0.2s ease;

	&:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}

	&::placeholder {
		color: #b6b9c1;
	}

	@media (max-width: 480px) {
		padding: 8px 10px;
		font-size: 13px;
		min-height: 100px;
	}
`;

export const PhotoInput = styled.input`
	display: none;
`;

export const PhotoPreview = styled.div`
	position: relative;
	width: 100%;
	max-width: 300px;
	border-radius: 4px;
	overflow: hidden;
`;

export const PhotoPreviewImage = styled.img`
	width: 100%;
	height: 200px;
	object-fit: cover;
	display: block;

	@media (max-width: 768px) {
		height: 180px;
	}

	@media (max-width: 480px) {
		height: 150px;
	}
`;

export const RemovePhotoButton = styled.button`
	position: absolute;
	bottom: 8px;
	right: 8px;
	background-color: #ef4444;
	color: white;
	border: none;
	padding: 6px 12px;
	border-radius: 4px;
	font-size: 12px;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #dc2626;
	}

	@media (max-width: 480px) {
		padding: 4px 8px;
		font-size: 10px;
	}
`;

export const FileInput = styled.input`
	display: none;
`;

export const FileLabel = styled.label`
	display: inline-block;
	padding: 10px 16px;
	background-color: #f5f5f5;
	border: 2px solid #d1d5db;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 500;
	color: #333333;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: #ebebeb;
		border-color: #22c55e;
	}

	@media (max-width: 480px) {
		padding: 8px 12px;
		font-size: 12px;
	}
`;

export const DevicesSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

export const DeviceRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)) auto auto;
	gap: 12px;
	align-items: flex-end;
	padding: 16px;
	background-color: #fafafa;
	border: 1px solid #e0e0e0;
	border-radius: 4px;

	@media (max-width: 768px) {
		grid-template-columns: 1fr auto auto;
		gap: 10px;
		padding: 12px;
	}

	@media (max-width: 480px) {
		grid-template-columns: 1fr auto;
		gap: 8px;
		padding: 10px;
		flex-wrap: wrap;
	}
`;

export const RemoveDeviceButton = styled.button`
	background-color: #ef4444;
	color: white;
	border: none;
	padding: 8px 12px;
	border-radius: 4px;
	font-size: 12px;
	cursor: pointer;
	white-space: nowrap;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #dc2626;
	}

	@media (max-width: 480px) {
		padding: 6px 8px;
		font-size: 10px;
	}
`;

export const AddDeviceButton = styled.button`
	background-color: #22c55e;
	color: white;
	border: none;
	padding: 10px 16px;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;
	align-self: flex-start;

	&:hover {
		background-color: #16a34a;
	}

	@media (max-width: 768px) {
		padding: 8px 12px;
		font-size: 12px;
	}

	@media (max-width: 480px) {
		padding: 8px 12px;
		font-size: 12px;
		width: 100%;
	}
`;

export const TagsContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	min-height: 30px;
	align-items: center;
	padding: 8px 0;
`;

export const Tag = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	background-color: #e0f2fe;
	color: #0369a1;
	padding: 6px 12px;
	border-radius: 20px;
	font-size: 13px;
	font-weight: 500;

	@media (max-width: 480px) {
		padding: 4px 10px;
		font-size: 11px;
	}
`;

export const RemoveTagButton = styled.button`
	background: none;
	border: none;
	color: inherit;
	cursor: pointer;
	font-size: 16px;
	padding: 0;
	line-height: 1;
	transition: opacity 0.2s ease;

	&:hover {
		opacity: 0.7;
	}

	@media (max-width: 480px) {
		font-size: 14px;
	}
`;

export const MaintenanceHistoryBox = styled.div`
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	max-height: 200px;
	overflow-y: auto;
	background-color: #fafafa;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 3px;
	}

	@media (max-width: 480px) {
		max-height: 180px;
	}
`;

export const HistoryItem = styled.div`
	padding: 12px 16px;
	border-bottom: 1px solid #e0e0e0;

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background-color: #f5f5f5;
	}

	@media (max-width: 480px) {
		padding: 10px 12px;
		font-size: 13px;
	}
`;

export const FileUploadSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;

	@media (max-width: 480px) {
		gap: 10px;
	}
`;

export const DialogFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 24px;
	border-top: 1px solid #e0e0e0;
	background-color: #fafafa;

	@media (max-width: 768px) {
		padding: 12px 20px;
		gap: 10px;
	}

	@media (max-width: 480px) {
		padding: 10px 16px;
		gap: 8px;
		flex-direction: column;
	}
`;

export const SaveButton = styled.button`
	background-color: #22c55e;
	color: white;
	border: none;
	padding: 10px 24px;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #16a34a;
	}

	&:active {
		background-color: #15803d;
	}

	@media (max-width: 768px) {
		padding: 8px 16px;
		font-size: 13px;
	}

	@media (max-width: 480px) {
		padding: 8px 16px;
		font-size: 13px;
		width: 100%;
	}
`;

export const CancelButton = styled.button`
	background-color: #e5e7eb;
	color: #333333;
	border: none;
	padding: 10px 24px;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #d1d5db;
	}

	@media (max-width: 768px) {
		padding: 8px 16px;
		font-size: 13px;
	}

	@media (max-width: 480px) {
		padding: 8px 16px;
		font-size: 13px;
		width: 100%;
	}
`;
