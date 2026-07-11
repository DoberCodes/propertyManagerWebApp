import React, { useState } from 'react';
import styled from 'styled-components';
import { MaintenanceRequest } from '../../types/MaintenanceRequest.types';
import {
	GenericModal,
	FormGroup,
	FormLabel as Label,
	FormInput as Input,
	FormSelect as Select,
	FormTextarea as Textarea,
} from '../Library';
import { FileUploader } from '../Library/FileUploader';

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

	const handleFileChange = (files: File[]) => {
		setSelectedFiles(files);
	};

	return (
		<GenericModal
			isOpen={isOpen}
			title={`Request Maintenance - ${propertyTitle}`}
			onClose={onClose}
			onSubmit={handleSubmit}
			showActions={true}
			primaryButtonLabel='Submit Request'
			secondaryButtonLabel='Cancel'>
			<FormGroup>
				<Label>Issue Title *</Label>
				<Input
					type='text'
					value={formData.title}
					onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
					<option value='Equipment'>Equipment</option>
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
				<FileUploader
					label='Upload Attachments'
					helperText='Images, PDF, Word (max 10MB)'
					accept='image/*,.pdf,.doc,.docx'
					allowedTypes={[
						'image/jpeg',
						'image/png',
						'image/jpg',
						'image/gif',
						'image/webp',
						'application/pdf',
						'application/msword',
						'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
					]}
					maxSizeBytes={10 * 1024 * 1024}
					multiple={true}
					setFiles={handleFileChange}
				/>
			</FormGroup>

			<InfoBox>
				<InfoIcon>ℹ️</InfoIcon>
				<InfoText>
					Your request will be sent to the maintenance team and property
					management. You'll be notified once it's reviewed and assigned.
				</InfoText>
			</InfoBox>
		</GenericModal>
	);
};

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
