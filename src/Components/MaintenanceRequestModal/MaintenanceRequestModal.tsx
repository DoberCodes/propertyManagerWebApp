import React, { useState } from 'react';
import styled from 'styled-components';
import { MaintenanceRequest } from '../../types/MaintenanceRequest.types';
import {
	DialogOverlay as Overlay,
	DialogContent as Modal,
} from '../Library/Modal/ModalStyles';
import {
	FormGroup,
	FormLabel as Label,
	FormInput as Input,
	FormSelect as Select,
	FormTextarea as Textarea,
} from '../Library/Forms/FormStyles';

interface MaintenanceRequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (request: MaintenanceRequest) => void;
	propertyTitle: string;
}

export const MaintenanceRequestModal: React.FC<
	MaintenanceRequestModalProps
> = ({ isOpen, onClose, onSubmit, propertyTitle }) => {
	const [formData, setFormData] = useState<MaintenanceRequest>({
		title: '',
		description: '',
		priority: 'Medium',
		category: 'General',
	});
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit({
			...formData,
			files: selectedFiles,
		});
		// Reset form
		setFormData({
			title: '',
			description: '',
			priority: 'Medium',
			category: 'General',
		});
		setSelectedFiles([]);
		onClose();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setSelectedFiles(Array.from(e.target.files));
		}
	};

	if (!isOpen) return null;

	return (
		<Overlay onClick={onClose}>
			<Modal onClick={(e) => e.stopPropagation()}>
				<Header>
					<Title>Request Maintenance</Title>
					<Subtitle>{propertyTitle}</Subtitle>
					<CloseButton onClick={onClose}>&times;</CloseButton>
				</Header>

				<Form onSubmit={handleSubmit}>
					<FormGroup>
						<Label>Issue Title *</Label>
						<Input
							type='text'
							value={formData.title}
							onChange={(e) =>
								setFormData({ ...formData, title: e.target.value })
							}
							placeholder='Brief description of the issue'
							required
						/>
					</FormGroup>

					<FormGroup>
						<Label>Category *</Label>
						<Select
							value={formData.category}
							onChange={(e) =>
								setFormData({ ...formData, category: e.target.value })
							}
							required>
							<option value='General'>General Maintenance</option>
							<option value='Plumbing'>Plumbing</option>
							<option value='Electrical'>Electrical</option>
							<option value='HVAC'>HVAC</option>
							<option value='Appliance'>Appliance</option>
							<option value='Structural'>Structural</option>
							<option value='Pest Control'>Pest Control</option>
							<option value='Landscaping'>Landscaping</option>
							<option value='Other'>Other</option>
						</Select>
					</FormGroup>

					<FormGroup>
						<Label>Priority *</Label>
						<Select
							value={formData.priority}
							onChange={(e) =>
								setFormData({
									...formData,
									priority: e.target.value as MaintenanceRequest['priority'],
								})
							}
							required>
							<option value='Low'>Low - Can wait</option>
							<option value='Medium'>Medium - Normal priority</option>
							<option value='High'>High - Soon as possible</option>
							<option value='Urgent'>Urgent - Emergency</option>
						</Select>
					</FormGroup>

					<FormGroup>
						<Label>Description *</Label>
						<Textarea
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							placeholder='Please provide details about the maintenance issue...'
							rows={6}
							required
						/>
					</FormGroup>

					<FormGroup>
						<Label>Attach Photos/Files (Optional)</Label>
						<FileInput
							type='file'
							multiple
							accept='image/*,.pdf,.doc,.docx'
							onChange={handleFileChange}
						/>
						{selectedFiles.length > 0 && (
							<FileList>
								{selectedFiles.map((file, index) => (
									<FileItem key={index}>
										📎 {file.name} ({Math.round(file.size / 1024)}KB)
									</FileItem>
								))}
							</FileList>
						)}
					</FormGroup>

					<InfoBox>
						<InfoIcon>ℹ️</InfoIcon>
						<InfoText>
							Your request will be sent to the maintenance team and property
							management. You'll be notified once it's reviewed and assigned.
						</InfoText>
					</InfoBox>

					<ButtonGroup>
						<CancelButton type='button' onClick={onClose}>
							Cancel
						</CancelButton>
						<SubmitButton type='submit'>Submit Request</SubmitButton>
					</ButtonGroup>
				</Form>
			</Modal>
		</Overlay>
	);
};

// Styled Components
const Header = styled.div`
	padding: 24px;
	border-bottom: 1px solid #e0e0e0;
	position: relative;
`;

const Title = styled.h2`
	margin: 0 0 4px 0;
	font-size: 24px;
	color: #333;
`;

const Subtitle = styled.div`
	color: #666;
	font-size: 14px;
`;

const CloseButton = styled.button`
	position: absolute;
	top: 16px;
	right: 16px;
	background: none;
	border: none;
	font-size: 32px;
	color: #999;
	cursor: pointer;
	line-height: 1;
	padding: 0;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		color: #333;
	}
`;

const Form = styled.form`
	padding: 24px;
`;

const FileInput = styled.input`
	width: 100%;
	padding: 10px;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	cursor: pointer;

	&::-webkit-file-upload-button {
		padding: 6px 12px;
		border: none;
		background-color: #f5f5f5;
		border-radius: 4px;
		cursor: pointer;
		margin-right: 10px;

		&:hover {
			background-color: #e0e0e0;
		}
	}
`;

const FileList = styled.div`
	margin-top: 10px;
	padding: 10px;
	background-color: #f9f9f9;
	border-radius: 4px;
`;

const FileItem = styled.div`
	padding: 4px 0;
	font-size: 13px;
	color: #555;
`;

const InfoBox = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 12px;
	background-color: #e3f2fd;
	border-left: 4px solid #2196f3;
	border-radius: 4px;
	margin-bottom: 20px;
`;

const InfoIcon = styled.span`
	font-size: 20px;
	line-height: 1;
`;

const InfoText = styled.p`
	margin: 0;
	font-size: 13px;
	color: #1565c0;
	line-height: 1.5;
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
`;

const CancelButton = styled.button`
	padding: 10px 24px;
	border: 1px solid #ddd;
	background-color: white;
	color: #333;
	border-radius: 4px;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: #f5f5f5;
		border-color: #999;
	}
`;

const SubmitButton = styled.button`
	padding: 10px 24px;
	border: none;
	background-color: #4caf50;
	color: white;
	border-radius: 4px;
	font-size: 14px;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: #45a049;
	}

	&:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}
`;
