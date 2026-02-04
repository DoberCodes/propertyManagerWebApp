import React, { useState, useEffect } from 'react';
import {
	ModalOverlay as DialogOverlay,
	ModalContainer as DialogContainer,
	ModalHeader as DialogHeader,
	ModalTitle as DialogTitle,
	ModalCloseButton as CloseButton,
	ModalBody as DialogContent,
	ModalFooter as DialogFooter,
	PrimaryButton as SaveButton,
	SecondaryButton as CancelButton,
	SmallButton as AddButton,
} from '../Library';
import {
	FormSection,
	SectionTitle,
	FormRow,
	FormField,
	Label,
	Input,
	TextArea,
	PhotoPreview,
	PhotoPreviewImage,
	MaintenanceHistoryBox,
	HistoryItem,
	FileUploadSection,
	FileInput,
	FileLabel,
	TagsContainer,
	Tag,
	RemoveTagButton,
	TagInput,
} from './PropertyDialog.styles';
import {
	uploadPropertyImage,
	isValidPropertyImageFile,
} from '../../utils/propertyImageUpload';
import { useGetPropertySharesQuery } from '../../Redux/API/apiSlice';

interface MaintenanceRecord {
	date: string;
	description: string;
}

interface PropertyFormData {
	photo?: string;
	name: string;
	owner: string;
	address: string;
	propertyType: 'Single Family' | 'Multi-Family' | 'Commercial';
	units: string[]; // For multi-family properties
	hasSuites?: boolean; // For commercial properties
	suites: string[]; // For commercial properties with multiple suites
	bedrooms?: number | null;
	bathrooms?: number | null;
	notes: string;
	files?: string[];
	maintenanceHistory?: MaintenanceRecord[];
	groupId?: string | null;
}

interface PropertyDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: PropertyFormData) => void;
	initialData?: PropertyFormData;
	groups: Array<{ id: string; name: string }>;
	selectedGroupId?: string | null;
	onCreateGroup?: (name: string) => Promise<string>; // returns new group id
	propertyId?: string; // For editing existing properties
}

export const PropertyDialog: React.FC<PropertyDialogProps> = ({
	isOpen,
	onClose,
	onSave,
	initialData,
	groups,
	selectedGroupId,
	onCreateGroup,
	propertyId,
}) => {
	const [formData, setFormData] = useState<PropertyFormData>(
		initialData || {
			name: '',
			owner: '',
			address: '',
			propertyType: 'Single Family',
			units: [],
			hasSuites: false,
			suites: [],
			bedrooms: 0,
			bathrooms: 0,
			notes: '',
			maintenanceHistory: [],
			groupId: selectedGroupId ?? null,
		},
	);

	const [unitInput, setUnitInput] = useState('');
	const [suiteInput, setSuiteInput] = useState('');

	const [newGroupName, setNewGroupName] = useState('');
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [imageError, setImageError] = useState<string | null>(null);

	// Get co-owner shares for this property
	const { data: coOwnerShares = [] } = useGetPropertySharesQuery(
		propertyId || '',
		{
			skip: !propertyId,
		},
	);

	// Reset form when dialog opens or initialData changes
	useEffect(() => {
		if (isOpen) {
			if (initialData) {
				// Convert units from Unit[] objects back to string[] for editing
				const unitStrings =
					initialData.units && Array.isArray(initialData.units)
						? (initialData.units as any[]).map((u) =>
								typeof u === 'string' ? u : u.name,
							)
						: [];

				// Convert suites from Suite[] objects back to string[] for editing
				const suiteStrings =
					(initialData as any).suites &&
					Array.isArray((initialData as any).suites)
						? ((initialData as any).suites as any[]).map((s) =>
								typeof s === 'string' ? s : s.name,
							)
						: [];

				setFormData({
					...initialData,
					units: unitStrings,
					suites: suiteStrings,
					hasSuites: initialData.hasSuites ?? false,
					groupId: selectedGroupId ?? null,
				});
			} else {
				setFormData({
					name: '',
					owner: '',
					address: '',
					propertyType: 'Single Family',
					units: [],
					hasSuites: false,
					suites: [],
					bedrooms: 0,
					bathrooms: 0,
					notes: '',
					maintenanceHistory: [],
					groupId: selectedGroupId ?? null,
				});
			}
			setUnitInput('');
			setSuiteInput('');
			setNewGroupName('');
		}
	}, [isOpen, initialData, selectedGroupId]);

	if (!isOpen) return null;

	const handleInputChange = (field: keyof PropertyFormData, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleAddUnit = () => {
		if (unitInput.trim()) {
			setFormData((prev) => ({
				...prev,
				units: [...prev.units, unitInput.trim()],
			}));
			setUnitInput('');
		}
	};

	const handleRemoveUnit = (index: number) => {
		setFormData((prev) => ({
			...prev,
			units: prev.units.filter((_, i) => i !== index),
		}));
	};

	const handleAddSuite = () => {
		if (suiteInput.trim()) {
			setFormData((prev) => ({
				...prev,
				suites: [...(prev.suites || []), suiteInput.trim()],
			}));
			setSuiteInput('');
		}
	};

	const handleRemoveSuite = (index: number) => {
		setFormData((prev) => ({
			...prev,
			suites: (prev.suites || []).filter((_, i) => i !== index),
		}));
	};

	const handlePhotoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const url = e.target.value;
		handleInputChange('photo', url || undefined);
		setImageError(null);
	};

	const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!isValidPropertyImageFile(file)) {
				setImageError('Invalid file. Please upload an image under 8MB.');
				return;
			}

			setImageError(null);
			setIsUploadingImage(true);

			try {
				const imageUrl = await uploadPropertyImage(file);
				handleInputChange('photo', imageUrl);
				setIsUploadingImage(false);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Failed to upload image';
				setImageError(errorMessage);
				setIsUploadingImage(false);
			}
			// Clear the file input
			e.target.value = '';
		}
	};

	const handleSave = () => {
		onSave(formData);
	};

	return (
		<DialogOverlay onClick={onClose}>
			<DialogContainer onClick={(e) => e.stopPropagation()}>
				<DialogHeader>
					<DialogTitle>
						{initialData ? 'Edit Property' : 'Add New Property'}
					</DialogTitle>
					<CloseButton onClick={onClose}>×</CloseButton>
				</DialogHeader>

				<DialogContent>
					{/* Group Assignment */}
					<FormSection>
						<SectionTitle>Assign to Group</SectionTitle>
						<FormRow>
							<FormField>
								<Label>Group</Label>
								<select
									value={formData.groupId ?? ''}
									onChange={(e) => {
										const v = e.target.value;

										handleInputChange('groupId', v || null);
									}}
									style={{
										padding: '10px 12px',
										border: '1px solid #d1d5db',
										borderRadius: '4px',
										fontSize: '14px',
									}}>
									<option value=''>Select a group</option>
									{groups.map((g) => (
										<option key={g.id} value={g.id}>
											{g.name}
										</option>
									))}
								</select>
							</FormField>

							<FormField>
								<Label>Or create new group</Label>
								<div style={{ display: 'flex', gap: 8 }}>
									<Input
										value={newGroupName}
										onChange={(e) => setNewGroupName(e.target.value)}
										placeholder='New group name'
										style={{ flex: 1 }}
									/>
									<button
										onClick={async () => {
											if (onCreateGroup && newGroupName.trim()) {
												const id = await onCreateGroup(newGroupName.trim());
												setNewGroupName('');
												handleInputChange('groupId', id || null);
											}
										}}
										style={{
											padding: '8px 12px',
											backgroundColor: '#22c55e',
											color: 'white',
											border: 'none',
											borderRadius: '4px',
											cursor: 'pointer',
											fontSize: '14px',
										}}>
										Create
									</button>
								</div>
							</FormField>
						</FormRow>
					</FormSection>
					{/* Photo Section */}
					<FormSection>
						<SectionTitle>Photo</SectionTitle>
						{imageError && (
							<div
								style={{
									color: '#dc2626',
									fontSize: '14px',
									marginBottom: '12px',
									padding: '8px 12px',
									backgroundColor: '#fee2e2',
									borderRadius: '4px',
								}}>
								{imageError}
							</div>
						)}
						<FormRow>
							<FormField>
								<Input
									type='text'
									value={formData.photo || ''}
									onChange={handlePhotoUrlChange}
									placeholder='Enter image URL or upload a file below'
									disabled={isUploadingImage}
								/>
							</FormField>
						</FormRow>
						{isUploadingImage ? (
							<div
								style={{
									padding: '12px',
									textAlign: 'center',
									color: '#6b7280',
									fontSize: '14px',
								}}>
								Processing image...
							</div>
						) : (
							<FileLabel htmlFor='photo-upload-input'>
								<input
									id='photo-upload-input'
									type='file'
									accept='image/*'
									onChange={handlePhotoUpload}
									style={{ display: 'none' }}
								/>
								📤 Upload Image File
							</FileLabel>
						)}
						{formData.photo && (
							<PhotoPreview>
								<PhotoPreviewImage src={formData.photo} alt='Property' />
							</PhotoPreview>
						)}
					</FormSection>

					{/* Basic Info */}
					<FormSection>
						<SectionTitle>Basic Information</SectionTitle>
						<FormField>
							<Label>Property Name</Label>
							<Input
								type='text'
								value={formData.name}
								onChange={(e) => handleInputChange('name', e.target.value)}
								placeholder='Enter property name'
							/>
						</FormField>
						<FormField>
							<Label>Address</Label>
							<Input
								type='text'
								value={formData.address}
								onChange={(e) => handleInputChange('address', e.target.value)}
								placeholder='Enter address'
							/>
						</FormField>
						<FormRow>
							<FormField>
								<Label>Property Type</Label>
								<select
									value={formData.propertyType}
									onChange={(e) =>
										handleInputChange(
											'propertyType',
											e.target.value as PropertyFormData['propertyType'],
										)
									}
									style={{
										padding: '10px 12px',
										border: '1px solid #d1d5db',
										borderRadius: '4px',
										fontSize: '14px',
										width: '100%',
									}}>
									<option value='Single Family'>Single Family</option>
									<option value='Multi-Family'>Multi-Family</option>
									<option value='Commercial'>Commercial</option>
								</select>
							</FormField>
							{formData.propertyType === 'Commercial' && (
								<FormField>
									<Label>Has multiple suites?</Label>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
										}}>
										<input
											type='checkbox'
											checked={!!formData.hasSuites}
											onChange={(e) =>
												handleInputChange('hasSuites', e.target.checked)
											}
											style={{ width: '16px', height: '16px' }}
										/>
										<span style={{ color: '#4b5563', fontSize: '14px' }}>
											Enable suite-level management
										</span>
									</div>
								</FormField>
							)}
							<FormField>
								<Label>Owner</Label>
								<Input
									type='text'
									value={formData.owner}
									onChange={(e) => handleInputChange('owner', e.target.value)}
									placeholder='Owner name'
								/>
							</FormField>
						</FormRow>
						{formData.propertyType !== 'Commercial' && (
							<FormRow>
								<FormField>
									<Label>Bedrooms</Label>
									<Input
										type='number'
										value={
											formData.bedrooms !== null &&
											formData.bedrooms !== undefined
												? formData.bedrooms
												: ''
										}
										onChange={(e) =>
											handleInputChange(
												'bedrooms',
												e.target.value === ''
													? null
													: parseInt(e.target.value, 10),
											)
										}
										placeholder='0'
									/>
								</FormField>
								<FormField>
									<Label>Bathrooms</Label>
									<Input
										type='number'
										step='0.5'
										value={
											formData.bathrooms !== null &&
											formData.bathrooms !== undefined
												? formData.bathrooms
												: ''
										}
										onChange={(e) =>
											handleInputChange(
												'bathrooms',
												e.target.value === ''
													? null
													: parseFloat(e.target.value),
											)
										}
										placeholder='0'
									/>
								</FormField>
							</FormRow>
						)}
					</FormSection>

					{/* Units Section - Only for Multi-Family */}
					{formData.propertyType === 'Multi-Family' && (
						<FormSection>
							<SectionTitle>Units/Apartments</SectionTitle>
							<FormField>
								<TagsContainer>
									{formData.units.map((unit, index) => (
										<Tag key={index}>
											{unit}
											<RemoveTagButton onClick={() => handleRemoveUnit(index)}>
												×
											</RemoveTagButton>
										</Tag>
									))}
								</TagsContainer>
								<TagInput>
									<Input
										type='text'
										value={unitInput}
										onChange={(e) => setUnitInput(e.target.value)}
										onKeyPress={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												handleAddUnit();
											}
										}}
										placeholder='Add unit (e.g., "Unit 101", "Apt 2A")'
									/>
									<AddButton onClick={handleAddUnit}>Add Unit</AddButton>
								</TagInput>
							</FormField>
						</FormSection>
					)}

					{/* Suites Section - Only for Commercial with suites enabled */}
					{formData.propertyType === 'Commercial' && formData.hasSuites && (
						<FormSection>
							<SectionTitle>Suites</SectionTitle>
							<FormField>
								<TagsContainer>
									{(formData.suites || []).map((suite, index) => (
										<Tag key={index}>
											{suite}
											<RemoveTagButton onClick={() => handleRemoveSuite(index)}>
												×
											</RemoveTagButton>
										</Tag>
									))}
								</TagsContainer>
								<TagInput>
									<Input
										type='text'
										value={suiteInput}
										onChange={(e) => setSuiteInput(e.target.value)}
										onKeyPress={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												handleAddSuite();
											}
										}}
										placeholder='Add suite (e.g., "Suite 100", "Suite A")'
									/>
									<AddButton onClick={handleAddSuite}>Add Suite</AddButton>
								</TagInput>
							</FormField>
						</FormSection>
					)}

					{/* Co-Owners */}
					<FormSection>
						<SectionTitle>Co-Owners</SectionTitle>
						<FormField>
							<TagsContainer>
								{coOwnerShares
									.filter((share) => share.permission === 'co-owner')
									.map((share) => (
										<Tag key={share.id}>
											{share.sharedWithFirstName && share.sharedWithLastName
												? `${share.sharedWithFirstName} ${share.sharedWithLastName} (${share.sharedWithEmail})`
												: share.sharedWithEmail}
										</Tag>
									))}
							</TagsContainer>
							{coOwnerShares.filter((share) => share.permission === 'co-owner')
								.length === 0 && (
								<div
									style={{
										color: '#666',
										fontSize: '14px',
										fontStyle: 'italic',
									}}>
									No co-owners assigned. Use the Share Property button to add
									co-owners.
								</div>
							)}
						</FormField>
					</FormSection>

					{/* Administrators */}
					<FormSection>
						<SectionTitle>Administrators</SectionTitle>
						<FormField>
							<TagsContainer>
								{coOwnerShares
									.filter((share) => share.permission === 'admin')
									.map((share) => (
										<Tag key={share.id}>
											{share.sharedWithFirstName && share.sharedWithLastName
												? `${share.sharedWithFirstName} ${share.sharedWithLastName} (${share.sharedWithEmail})`
												: share.sharedWithEmail}
										</Tag>
									))}
							</TagsContainer>
							{coOwnerShares.filter((share) => share.permission === 'admin')
								.length === 0 && (
								<div
									style={{
										color: '#666',
										fontSize: '14px',
										fontStyle: 'italic',
									}}>
									No administrators assigned. Use the Share Property button to
									add administrators.
								</div>
							)}
						</FormField>
					</FormSection>

					{/* Viewers */}
					<FormSection>
						<SectionTitle>Viewers</SectionTitle>
						<FormField>
							<TagsContainer>
								{coOwnerShares
									.filter((share) => share.permission === 'viewer')
									.map((share) => (
										<Tag key={share.id}>
											{share.sharedWithFirstName && share.sharedWithLastName
												? `${share.sharedWithFirstName} ${share.sharedWithLastName} (${share.sharedWithEmail})`
												: share.sharedWithEmail}
										</Tag>
									))}
							</TagsContainer>
							{coOwnerShares.filter((share) => share.permission === 'viewer')
								.length === 0 && (
								<div
									style={{
										color: '#666',
										fontSize: '14px',
										fontStyle: 'italic',
									}}>
									No viewers assigned. Use the Share Property button to add
									viewers.
								</div>
							)}
						</FormField>
					</FormSection>

					{/* Notes */}
					<FormSection>
						<SectionTitle>Notes</SectionTitle>
						<TextArea
							value={formData.notes}
							onChange={(e) => handleInputChange('notes', e.target.value)}
							placeholder='Add any notes about this property...'
						/>
					</FormSection>

					{/* Maintenance History */}
					<FormSection>
						<SectionTitle>Recent Maintenance History</SectionTitle>
						<MaintenanceHistoryBox>
							{formData.maintenanceHistory &&
							formData.maintenanceHistory.length > 0 ? (
								formData.maintenanceHistory.map((record, index) => (
									<HistoryItem key={index}>
										<div
											style={{
												fontWeight: 600,
												fontSize: '12px',
												color: '#999999',
											}}>
											{record.date}
										</div>
										<div style={{ fontSize: '14px', color: 'black' }}>
											{record.description}
										</div>
									</HistoryItem>
								))
							) : (
								<div style={{ color: '#999999', padding: '16px' }}>
									No maintenance history
								</div>
							)}
						</MaintenanceHistoryBox>
					</FormSection>

					{/* General Files */}
					<FileUploadSection>
						<SectionTitle>Additional Files</SectionTitle>
						<FileLabel htmlFor='files-input'>
							<FileInput
								id='files-input'
								type='file'
								multiple
								onChange={(e) => {
									const files = e.target.files;
									if (files) {
										const fileNames: string[] = [];
										for (let i = 0; i < files.length; i++) {
											fileNames.push(files[i].name);
										}
										handleInputChange('files', fileNames);
									}
								}}
							/>
							Choose Files
						</FileLabel>
					</FileUploadSection>
				</DialogContent>

				<DialogFooter>
					<CancelButton onClick={onClose}>Cancel</CancelButton>
					<SaveButton onClick={handleSave}>Save Property</SaveButton>
				</DialogFooter>
			</DialogContainer>
		</DialogOverlay>
	);
};
