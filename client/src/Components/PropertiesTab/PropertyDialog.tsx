import React, { useState, useEffect } from 'react';
import {
	DialogOverlay,
	DialogContainer,
	DialogHeader,
	DialogTitle,
	CloseButton,
	DialogContent,
	FormSection,
	SectionTitle,
	FormRow,
	FormField,
	Label,
	Input,
	TextArea,
	PhotoInput,
	PhotoPreview,
	PhotoPreviewImage,
	RemovePhotoButton,
	DevicesSection,
	DeviceRow,
	RemoveDeviceButton,
	AddDeviceButton,
	MaintenanceHistoryBox,
	HistoryItem,
	FileUploadSection,
	FileInput,
	FileLabel,
	DialogFooter,
	SaveButton,
	CancelButton,
	TagsContainer,
	Tag,
	RemoveTagButton,
	TagInput,
	AddButton,
} from './PropertyDialog.styles';

interface Device {
	id: number;
	type: string;
	brand: string;
	model: string;
	installationDate: string;
	warrantyFile?: string;
	unit?: string; // For multi-family properties
}

interface MaintenanceRecord {
	date: string;
	description: string;
}

interface PropertyFormData {
	photo?: string;
	name: string;
	owner: string;
	administrators: string[];
	viewers: string[];
	address: string;
	propertyType: 'Single Family' | 'Multi-Family' | 'Commercial';
	units: string[]; // For multi-family properties
	hasSuites?: boolean; // For commercial properties
	suites: string[]; // For commercial properties with multiple suites
	bedrooms: number;
	bathrooms: number;
	devices: Device[];
	notes: string;
	files?: string[];
	maintenanceHistory?: MaintenanceRecord[];
	groupId?: number | null;
}

interface PropertyDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: PropertyFormData) => void;
	initialData?: PropertyFormData;
	groups: Array<{ id: number; name: string }>;
	selectedGroupId?: number | null;
	onCreateGroup?: (name: string) => number; // returns new group id
}

export const PropertyDialog: React.FC<PropertyDialogProps> = ({
	isOpen,
	onClose,
	onSave,
	initialData,
	groups,
	selectedGroupId,
	onCreateGroup,
}) => {
	const [formData, setFormData] = useState<PropertyFormData>(
		initialData || {
			name: '',
			owner: '',
			administrators: [],
			viewers: [],
			address: '',
			propertyType: 'Single Family',
			units: [],
			hasSuites: false,
			suites: [],
			bedrooms: 0,
			bathrooms: 0,
			devices: [
				{
					id: Date.now(),
					type: '',
					brand: '',
					model: '',
					installationDate: '',
				},
			],
			notes: '',
			maintenanceHistory: [],
			groupId: selectedGroupId ?? null,
		},
	);

	const [adminInput, setAdminInput] = useState('');
	const [viewerInput, setViewerInput] = useState('');
	const [unitInput, setUnitInput] = useState('');
	const [suiteInput, setSuiteInput] = useState('');

	const [newGroupName, setNewGroupName] = useState('');

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
					administrators: [],
					viewers: [],
					address: '',
					propertyType: 'Single Family',
					units: [],
					hasSuites: false,
					suites: [],
					bedrooms: 0,
					bathrooms: 0,
					devices: [
						{
							id: Date.now(),
							type: '',
							brand: '',
							model: '',
							installationDate: '',
						},
					],
					notes: '',
					maintenanceHistory: [],
					groupId: selectedGroupId ?? null,
				});
			}
			setAdminInput('');
			setViewerInput('');
			setUnitInput('');
			setSuiteInput('');
			setNewGroupName('');
		}
	}, [isOpen, initialData, selectedGroupId]);

	if (!isOpen) return null;

	const handleInputChange = (field: keyof PropertyFormData, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleAddAdmin = () => {
		if (adminInput.trim()) {
			setFormData((prev) => ({
				...prev,
				administrators: [...prev.administrators, adminInput.trim()],
			}));
			setAdminInput('');
		}
	};

	const handleRemoveAdmin = (index: number) => {
		setFormData((prev) => ({
			...prev,
			administrators: prev.administrators.filter((_, i) => i !== index),
		}));
	};

	const handleAddViewer = () => {
		if (viewerInput.trim()) {
			setFormData((prev) => ({
				...prev,
				viewers: [...prev.viewers, viewerInput.trim()],
			}));
			setViewerInput('');
		}
	};

	const handleRemoveViewer = (index: number) => {
		setFormData((prev) => ({
			...prev,
			viewers: prev.viewers.filter((_, i) => i !== index),
		}));
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

	const handleDeviceChange = (
		deviceId: number,
		field: keyof Device,
		value: string,
	) => {
		setFormData((prev) => ({
			...prev,
			devices: prev.devices.map((device) =>
				device.id === deviceId ? { ...device, [field]: value } : device,
			),
		}));
	};

	const handleAddDevice = () => {
		setFormData((prev) => ({
			...prev,
			devices: [
				...prev.devices,
				{
					id: Date.now(),
					type: '',
					brand: '',
					model: '',
					installationDate: '',
				},
			],
		}));
	};

	const handleRemoveDevice = (deviceId: number) => {
		setFormData((prev) => ({
			...prev,
			devices: prev.devices.filter((device) => device.id !== deviceId),
		}));
	};

	const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				handleInputChange('photo', event.target?.result);
			};
			reader.readAsDataURL(file);
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
										handleInputChange('groupId', v ? Number(v) : null);
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
										onClick={() => {
											if (onCreateGroup && newGroupName.trim()) {
												const id = onCreateGroup(newGroupName.trim());
												setNewGroupName('');
												handleInputChange('groupId', id);
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
						{formData.photo ? (
							<PhotoPreview>
								<PhotoPreviewImage src={formData.photo} alt='Property' />
								<RemovePhotoButton
									onClick={() => handleInputChange('photo', undefined)}>
									Remove
								</RemovePhotoButton>
							</PhotoPreview>
						) : (
							<FileLabel htmlFor='photo-input'>
								<PhotoInput
									id='photo-input'
									type='file'
									accept='image/*'
									onChange={handlePhotoSelect}
								/>
								Choose Photo
							</FileLabel>
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
										value={formData.bedrooms}
										onChange={(e) =>
											handleInputChange(
												'bedrooms',
												parseInt(e.target.value) || 0,
											)
										}
										placeholder='0'
									/>
								</FormField>
								<FormField>
									<Label>Bathrooms</Label>
									<Input
										type='number'
										value={formData.bathrooms}
										onChange={(e) =>
											handleInputChange(
												'bathrooms',
												parseInt(e.target.value) || 0,
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

					{/* Administrators */}
					<FormSection>
						<SectionTitle>Administrators</SectionTitle>
						<FormField>
							<TagsContainer>
								{formData.administrators.map((admin, index) => (
									<Tag key={index}>
										{admin}
										<RemoveTagButton onClick={() => handleRemoveAdmin(index)}>
											×
										</RemoveTagButton>
									</Tag>
								))}
							</TagsContainer>
							<FormRow>
								<Input
									type='text'
									value={adminInput}
									onChange={(e) => setAdminInput(e.target.value)}
									onKeyPress={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handleAddAdmin();
										}
									}}
									placeholder='Add administrator'
									style={{ flex: 1 }}
								/>
								<button
									onClick={handleAddAdmin}
									style={{
										padding: '8px 12px',
										backgroundColor: '#22c55e',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
										fontSize: '14px',
									}}>
									Add
								</button>
							</FormRow>
						</FormField>
					</FormSection>

					{/* Viewers */}
					<FormSection>
						<SectionTitle>Viewers</SectionTitle>
						<FormField>
							<TagsContainer>
								{formData.viewers.map((viewer, index) => (
									<Tag key={index}>
										{viewer}
										<RemoveTagButton onClick={() => handleRemoveViewer(index)}>
											×
										</RemoveTagButton>
									</Tag>
								))}
							</TagsContainer>
							<FormRow>
								<Input
									type='text'
									value={viewerInput}
									onChange={(e) => setViewerInput(e.target.value)}
									onKeyPress={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handleAddViewer();
										}
									}}
									placeholder='Add viewer'
									style={{ flex: 1 }}
								/>
								<button
									onClick={handleAddViewer}
									style={{
										padding: '8px 12px',
										backgroundColor: '#22c55e',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
										fontSize: '14px',
									}}>
									Add
								</button>
							</FormRow>
						</FormField>
					</FormSection>

					{/* Household Devices */}
					<DevicesSection>
						<SectionTitle>Household Devices</SectionTitle>
						{formData.devices.map((device) => (
							<DeviceRow key={device.id}>
								{formData.propertyType === 'Multi-Family' && (
									<FormField>
										<Label>Unit</Label>
										<select
											value={device.unit || ''}
											onChange={(e) =>
												handleDeviceChange(device.id, 'unit', e.target.value)
											}
											style={{
												padding: '10px 12px',
												border: '1px solid #d1d5db',
												borderRadius: '4px',
												fontSize: '14px',
												width: '100%',
											}}>
											<option value=''>Select Unit</option>
											{formData.units.map((unit, idx) => (
												<option key={idx} value={unit}>
													{unit}
												</option>
											))}
										</select>
									</FormField>
								)}
								<FormField>
									<Label>Device Type</Label>
									<Input
										type='text'
										value={device.type}
										onChange={(e) =>
											handleDeviceChange(device.id, 'type', e.target.value)
										}
										placeholder='e.g., Water Heater, Refrigerator'
									/>
								</FormField>
								<FormField>
									<Label>Brand</Label>
									<Input
										type='text'
										value={device.brand}
										onChange={(e) =>
											handleDeviceChange(device.id, 'brand', e.target.value)
										}
										placeholder='Brand'
									/>
								</FormField>
								<FormField>
									<Label>Model</Label>
									<Input
										type='text'
										value={device.model}
										onChange={(e) =>
											handleDeviceChange(device.id, 'model', e.target.value)
										}
										placeholder='Model'
									/>
								</FormField>
								<FormField>
									<Label>Installation Date</Label>
									<Input
										type='date'
										value={device.installationDate}
										onChange={(e) =>
											handleDeviceChange(
												device.id,
												'installationDate',
												e.target.value,
											)
										}
									/>
								</FormField>
								<FormField>
									<Label>Warranty File</Label>
									<FileLabel htmlFor={`warranty-${device.id}`}>
										<FileInput
											id={`warranty-${device.id}`}
											type='file'
											onChange={(e) => {
												const file = e.target.files?.[0];
												if (file) {
													handleDeviceChange(
														device.id,
														'warrantyFile',
														file.name,
													);
												}
											}}
										/>
										{device.warrantyFile || 'Choose File'}
									</FileLabel>
								</FormField>
								{formData.devices.length > 1 && (
									<RemoveDeviceButton
										onClick={() => handleRemoveDevice(device.id)}>
										Remove
									</RemoveDeviceButton>
								)}
							</DeviceRow>
						))}
						<AddDeviceButton onClick={handleAddDevice}>
							+ Add Device
						</AddDeviceButton>
					</DevicesSection>

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
