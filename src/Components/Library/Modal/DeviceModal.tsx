import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import GenericModal from './GenericModal';
import {
	FormGroup,
	FormGroupFull,
	FormGrid,
	FormInput,
	FormLabel,
	FormTextarea,
	ModalTab,
	ModalTabContainer,
	ModalTabContent,
} from './ModalStyles';
import { COLORS } from '../../../constants/colors';
import { Property, DeviceServiceItem } from '../../../types/Property.types';
import { FileUploader } from '../FileUploader';
import { TaskSelect } from '../Select/TaskSelect';

const SERVICE_ITEM_CATEGORY_OPTIONS = [
	{ value: 'Part', label: 'Part' },
	{ value: 'Fluid', label: 'Fluid' },
	{ value: 'Filter', label: 'Filter' },
	{ value: 'Other', label: 'Other' },
];

interface DeviceModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (event: React.FormEvent) => void;
	property: Property;
	isEditing?: boolean;
	units?: any[];
	pendingFiles?: File[];
	onPendingFilesChange?: (files: File[]) => void;
	removedExistingFileUrls?: string[];
	onRemoveExistingFile?: (url: string) => void;
	onRestoreExistingFile?: (url: string) => void;
	onRemovePendingFile?: (fileKey: string) => void;
	deviceFormData: {
		type: string;
		brand: string;
		model: string;
		serialNumber?: string;
		partNumber?: string;
		filterSize?: string;
		specNotes?: string;
		serviceItems?: DeviceServiceItem[];
		installationDate: string;
		status?: 'Active' | 'Maintenance' | 'Broken' | 'Decommissioned';
		location?: {
			propertyId: string;
			unitId?: string;
			suiteId?: string;
		};
		files?: Array<{
			name: string;
			url: string;
			size: number;
			type: string;
		}>;
	};
	onFormChange: (
		event: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => void;
	onServiceItemsChange?: (items: DeviceServiceItem[]) => void;
}

const TabLabel = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
`;

const TabBadge = styled.span<{ $tone?: 'neutral' | 'success' }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0.15rem 0.45rem;
	border-radius: 999px;
	font-size: 0.7rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	background: ${(props) =>
		props.$tone === 'success' ? '#dcfce7' : '#eef2f7'};
	color: ${(props) =>
		props.$tone === 'success' ? '#166534' : COLORS.textSecondary};
`;

const SummaryBanner = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 1rem;
	margin-bottom: 1.25rem;
	border: 1px solid #d1fae5;
	border-radius: 10px;
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
`;

const SummaryTitle = styled.div`
	font-size: 0.95rem;
	font-weight: 700;
	color: ${COLORS.textPrimary};
`;

const SummaryMeta = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`;

const SummaryPill = styled.span<{ $tone?: 'neutral' | 'success' }>`
	display: inline-flex;
	align-items: center;
	padding: 0.35rem 0.65rem;
	border-radius: 999px;
	font-size: 0.8rem;
	font-weight: 600;
	background: ${(props) =>
		props.$tone === 'success' ? '#dcfce7' : '#ffffff'};
	color: ${(props) =>
		props.$tone === 'success' ? '#166534' : COLORS.textSecondary};
	border: 1px solid
		${(props) => (props.$tone === 'success' ? '#86efac' : COLORS.gray200)};
`;

const RequiredList = styled.div`
	font-size: 0.85rem;
	color: ${COLORS.textSecondary};
	line-height: 1.5;
`;

const SectionHeader = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	margin-bottom: 0.25rem;
`;

const SectionTitle = styled.h4`
	margin: 0;
	font-size: 1rem;
	font-weight: 700;
	color: ${COLORS.textPrimary};
`;

const SectionDescription = styled.p`
	margin: 0;
	font-size: 0.87rem;
	color: ${COLORS.textSecondary};
	line-height: 1.5;
`;

const FieldHint = styled.div`
	margin-top: 0.45rem;
	font-size: 0.82rem;
	color: ${COLORS.textSecondary};
	line-height: 1.45;
`;

const FieldError = styled.div`
	margin-top: 0.45rem;
	font-size: 0.82rem;
	font-weight: 600;
	color: #b91c1c;
`;

const PartsCard = styled.div`
	background: ${COLORS.gray50};
	border: 1px solid ${COLORS.gray200};
	border-radius: 8px;
	padding: 16px;
	margin-bottom: 20px;
`;

const PartsHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
	gap: 12px;
	flex-wrap: wrap;
`;

const CountBadge = styled.span`
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	border-radius: 12px;
	padding: 1px 8px;
	font-size: 0.8rem;
	font-weight: 700;
	margin-left: 4px;
`;

const ScrollBody = styled.div`
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding-bottom: 0.5rem;
`;

const AttachmentList = styled.div`
	margin-top: 0.75rem;
	display: flex;
	flex-direction: column;
	gap: 0.55rem;
`;

const AttachmentItem = styled.div<{ $muted?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 0.65rem 0.75rem;
	border-radius: 8px;
	border: 1px solid ${(props) => (props.$muted ? '#f5c2c7' : COLORS.gray200)};
	background: ${(props) => (props.$muted ? '#fef2f2' : '#ffffff')};
`;

const AttachmentMeta = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 0.15rem;
`;

const AttachmentName = styled.span`
	font-size: 0.86rem;
	font-weight: 600;
	color: ${COLORS.textPrimary};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const AttachmentSubtext = styled.span`
	font-size: 0.76rem;
	color: ${COLORS.textSecondary};
`;

const AttachmentActions = styled.div`
	display: flex;
	align-items: center;
	gap: 0.45rem;
	flex-shrink: 0;
`;

const LinkAction = styled.a`
	display: inline-flex;
	align-items: center;
	padding: 0.35rem 0.6rem;
	border-radius: 6px;
	border: 1px solid ${COLORS.gray300};
	background: white;
	font-size: 0.76rem;
	font-weight: 600;
	color: ${COLORS.gray700};
	text-decoration: none;

	&:hover {
		background: ${COLORS.gray50};
	}
`;

const TertiaryAction = styled.button<{ $danger?: boolean }>`
	display: inline-flex;
	align-items: center;
	padding: 0.35rem 0.6rem;
	border-radius: 6px;
	font-size: 0.76rem;
	font-weight: 600;
	cursor: pointer;
	border: 1px solid
		${(props) => (props.$danger ? COLORS.errorLight : COLORS.gray300)};
	background: ${(props) => (props.$danger ? COLORS.errorLight : 'white')};
	color: ${(props) => (props.$danger ? COLORS.errorDark : COLORS.gray700)};

	&:hover {
		background: ${(props) => (props.$danger ? '#fecaca' : COLORS.gray50)};
	}
`;

const AttachmentSection = styled.div`
	margin-top: 1rem;
	padding-top: 0.75rem;
	border-top: 1px solid ${COLORS.gray200};
`;

const formatBytes = (value: number) => {
	const kb = value / 1024;
	if (kb < 1024) return `${kb.toFixed(1)} KB`;
	return `${(kb / 1024).toFixed(1)} MB`;
};

export const DeviceModal = (props: DeviceModalProps) => {
	const [submitAttempted, setSubmitAttempted] = useState(false);
	const [activeTab, setActiveTab] = useState<'details' | 'service-items'>(
		'details',
	);
	const [itemFilter, setItemFilter] = useState('');
	const [newCategoryOption, setNewCategoryOption] = useState('Part');
	const [newCustomCategory, setNewCustomCategory] = useState('');
	const [newItemName, setNewItemName] = useState('');
	const [newItemDetails, setNewItemDetails] = useState('');

	// Edit state
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [editCategoryOption, setEditCategoryOption] = useState('Part');
	const [editCustomCategory, setEditCustomCategory] = useState('');
	const [editName, setEditName] = useState('');
	const [editDetails, setEditDetails] = useState('');

	const serviceItems = props.deviceFormData.serviceItems || [];
	const selectedUnitId = props.deviceFormData.location?.unitId || '';

	useEffect(() => {
		if (props.isOpen) {
			setActiveTab('details');
			setSubmitAttempted(false);
		}
	}, [props.isOpen]);

	const unitOptions = useMemo(
		() =>
			(props.units || []).map((unit: any) => ({
				value: unit.id,
				label: unit.unitName || unit.name || unit.title || 'Unit',
			})),
		[props.units],
	);

	const missingRequiredFields = useMemo(() => {
		const missing: string[] = [];
		if (!props.deviceFormData.type.trim()) missing.push('Device Type');
		if (!props.deviceFormData.brand.trim()) missing.push('Brand');
		if (!props.deviceFormData.model.trim()) missing.push('Model');
		if (!props.deviceFormData.installationDate.trim()) {
			missing.push('Installation Date');
		}
		return missing;
	}, [
		props.deviceFormData.brand,
		props.deviceFormData.installationDate,
		props.deviceFormData.model,
		props.deviceFormData.type,
	]);

	const completedBasics = 4 - missingRequiredFields.length;
	const partsConfigured = serviceItems.length > 0;
	const detailsError = submitAttempted && missingRequiredFields.length > 0;

	const emitChange = (name: string, value: any) => {
		props.onFormChange({
			target: { name, value },
			currentTarget: { name, value },
		} as any);
	};

	const updateServiceItems = (items: DeviceServiceItem[]) => {
		if (props.onServiceItemsChange) {
			props.onServiceItemsChange(items);
			return;
		}
		emitChange('serviceItems', items);
	};

	const filteredServiceItems = useMemo(() => {
		const query = itemFilter.trim().toLowerCase();
		if (!query) return serviceItems;
		return serviceItems.filter((item) => {
			const haystack = `${item.category} ${item.name} ${item.details || ''}`
				.trim()
				.toLowerCase();
			return haystack.includes(query);
		});
	}, [serviceItems, itemFilter]);

	const handleAddServiceItem = () => {
		const category =
			newCategoryOption === 'Other'
				? newCustomCategory.trim()
				: newCategoryOption.trim();
		const name = newItemName.trim();
		const details = newItemDetails.trim();

		if (!category || !name) return;

		const nextItem: DeviceServiceItem = {
			id: `svc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			category,
			name,
			details: details || undefined,
		};

		updateServiceItems([...serviceItems, nextItem]);
		setNewCategoryOption('Part');
		setNewCustomCategory('');
		setNewItemName('');
		setNewItemDetails('');
	};

	const handleRemoveServiceItem = (id: string) => {
		updateServiceItems(serviceItems.filter((item) => item.id !== id));
	};

	const handleStartEdit = (item: DeviceServiceItem) => {
		const matchedCategory = SERVICE_ITEM_CATEGORY_OPTIONS.find(
			(option) => option.value !== 'Other' && option.value === item.category,
		);
		setEditingItemId(item.id);
		setEditCategoryOption(matchedCategory ? matchedCategory.value : 'Other');
		setEditCustomCategory(matchedCategory ? '' : item.category);
		setEditName(item.name);
		setEditDetails(item.details || '');
	};

	const handleSaveEdit = () => {
		const category =
			editCategoryOption === 'Other'
				? editCustomCategory.trim()
				: editCategoryOption.trim();
		const name = editName.trim();
		if (!editingItemId || !category || !name) return;
		updateServiceItems(
			serviceItems.map((item) =>
				item.id === editingItemId
					? { ...item, category, name, details: editDetails.trim() || undefined }
					: item,
			),
		);
		setEditingItemId(null);
		setEditCustomCategory('');
	};

	const handleCancelEdit = () => {
		setEditingItemId(null);
		setEditCustomCategory('');
	};

	const removedSet = useMemo(
		() => new Set(props.removedExistingFileUrls || []),
		[props.removedExistingFileUrls],
	);

	const pendingFiles = props.pendingFiles || [];

	return (
		<GenericModal
			isOpen={props.isOpen}
			onClose={props.onClose}
			title={props.isEditing ? 'Edit Household Device' : 'Add New Household Device'}
			onSubmit={(event) => {
				setSubmitAttempted(true);
				if (missingRequiredFields.length > 0) {
					event.preventDefault();
					setActiveTab('details');
					return;
				}
				props.onSubmit(event);
			}}
			showActions={true}
			primaryButtonLabel={props.isEditing ? 'Save Device' : 'Add Device'}
			secondaryButtonLabel='Cancel'
			primaryButtonDisabled={missingRequiredFields.length > 0}>
			<ModalTabContainer>
				<ModalTab
					type='button'
					$active={activeTab === 'details'}
					onClick={() => setActiveTab('details')}>
					<TabLabel>
						Device Details
						<TabBadge $tone={missingRequiredFields.length === 0 ? 'success' : 'neutral'}>
							{missingRequiredFields.length === 0 ? 'Ready' : `${missingRequiredFields.length} required`}
						</TabBadge>
					</TabLabel>
				</ModalTab>
				<ModalTab
					type='button'
					$active={activeTab === 'service-items'}
					onClick={() => setActiveTab('service-items')}>
					<TabLabel>
						Parts & Supplies
						<TabBadge $tone={partsConfigured ? 'success' : 'neutral'}>
							{partsConfigured ? 'Configured' : 'Optional'}
						</TabBadge>
					</TabLabel>
				</ModalTab>
			</ModalTabContainer>

			<ScrollBody>
			<ModalTabContent $active={activeTab === 'details'}>
				<SummaryBanner>
					<SummaryTitle>Capture the device basics first, then optionally document recurring parts and supplies.</SummaryTitle>
					<SummaryMeta>
						<SummaryPill $tone={missingRequiredFields.length === 0 ? 'success' : 'neutral'}>
							{completedBasics}/4 core items complete
						</SummaryPill>
						<SummaryPill $tone={partsConfigured ? 'success' : 'neutral'}>
							{serviceItems.length} part{serviceItems.length === 1 ? '' : 's'} tracked
						</SummaryPill>
					</SummaryMeta>
					<RequiredList>
						{missingRequiredFields.length > 0
							? `Still needed: ${missingRequiredFields.join(', ')}`
							: 'All required device details are complete. You can save now or continue adding parts and supplies.'}
					</RequiredList>
				</SummaryBanner>

				<SectionHeader>
					<SectionTitle>Core Device Details</SectionTitle>
					<SectionDescription>
						Define the device identity first so it can be linked cleanly to tasks and maintenance history.
					</SectionDescription>
				</SectionHeader>

				<FormGrid>
				<FormGroup>
					<FormLabel>Device Type *</FormLabel>
					<FormInput
						type='text'
						name='type'
						value={props.deviceFormData.type}
						onChange={props.onFormChange}
						placeholder='e.g., HVAC System, Water Heater'
						required
					/>
					{detailsError && !props.deviceFormData.type.trim() && (
						<FieldError>Device type is required.</FieldError>
					)}
				</FormGroup>

				<FormGroup>
					<FormLabel>Brand *</FormLabel>
					<FormInput
						type='text'
						name='brand'
						value={props.deviceFormData.brand}
						onChange={props.onFormChange}
						placeholder='e.g., Carrier, Rheem'
						required
					/>
					{detailsError && !props.deviceFormData.brand.trim() && (
						<FieldError>Brand is required.</FieldError>
					)}
				</FormGroup>

				<FormGroup>
					<FormLabel>Model *</FormLabel>
					<FormInput
						type='text'
						name='model'
						value={props.deviceFormData.model}
						onChange={props.onFormChange}
						placeholder='e.g., AquaEdge, Prestige'
						required
					/>
					{detailsError && !props.deviceFormData.model.trim() && (
						<FieldError>Model is required.</FieldError>
					)}
				</FormGroup>

				<FormGroup>
					<FormLabel>Serial Number</FormLabel>
					<FormInput
						type='text'
						name='serialNumber'
						value={props.deviceFormData.serialNumber || ''}
						onChange={props.onFormChange}
						placeholder='e.g., SN-123456789'
					/>
				</FormGroup>

				<FormGroup>
					<FormLabel>Installation Date *</FormLabel>
					<FormInput
						type='date'
						name='installationDate'
						value={props.deviceFormData.installationDate}
						onChange={props.onFormChange}
						required
					/>
					{detailsError && !props.deviceFormData.installationDate.trim() && (
						<FieldError>Installation date is required.</FieldError>
					)}
				</FormGroup>
				{props.property.propertyType === 'Multi-Family' && (
					<FormGroup>
						<FormLabel>Associated Unit</FormLabel>
						{unitOptions.length > 0 ? (
							<>
								<TaskSelect
									value={selectedUnitId}
									onChange={(value) => emitChange('location.unitId', value)}
									placeholder='(none)'
									options={[{ value: '', label: '(none)' }, ...unitOptions]}
								/>
								<FieldHint>
									Choose a unit if this device belongs to a specific residence.
								</FieldHint>
							</>
						) : (
							<FormInput
								type='text'
								name='location.unitId'
								value={selectedUnitId}
								onChange={props.onFormChange}
								placeholder='Unit ID'
							/>
						)}
					</FormGroup>
				)}
				<FormGroupFull>
					<SectionHeader>
						<SectionTitle>Attachments</SectionTitle>
						<SectionDescription>
							Upload a reference photo, manual, or invoice if you have one available.
						</SectionDescription>
					</SectionHeader>
					<FileUploader
						setFiles={(files) => props.onPendingFilesChange?.(files)}
						multiple
						helperText='PDF, docs, images, sheets. Max 10MB each.'
					/>
					<AttachmentSection>
						<SectionTitle style={{ fontSize: '0.92rem' }}>
							Current & Pending Files
						</SectionTitle>
						<AttachmentList>
							{(props.deviceFormData.files || []).map((file) => {
								const isRemoved = removedSet.has(file.url);
								return (
									<AttachmentItem key={file.url} $muted={isRemoved}>
										<AttachmentMeta>
											<AttachmentName>{file.name}</AttachmentName>
											<AttachmentSubtext>
												{formatBytes(file.size)}
												{isRemoved ? ' • Will be removed on save' : ''}
											</AttachmentSubtext>
										</AttachmentMeta>
										<AttachmentActions>
											{!isRemoved && (
												<LinkAction
													href={file.url}
													target='_blank'
													rel='noreferrer'>
													Download
												</LinkAction>
											)}
											{isRemoved ? (
												<TertiaryAction
													type='button'
													onClick={() => props.onRestoreExistingFile?.(file.url)}>
													Undo
												</TertiaryAction>
											) : (
												<TertiaryAction
													type='button'
													$danger
													onClick={() => props.onRemoveExistingFile?.(file.url)}>
													Remove
												</TertiaryAction>
											)}
										</AttachmentActions>
									</AttachmentItem>
								);
							})}
							{pendingFiles.map((file) => {
								const fileKey = `${file.name}-${file.size}`;
								return (
									<AttachmentItem key={fileKey}>
										<AttachmentMeta>
											<AttachmentName>{file.name}</AttachmentName>
											<AttachmentSubtext>
												{formatBytes(file.size)} • New file queued for upload
											</AttachmentSubtext>
										</AttachmentMeta>
										<AttachmentActions>
											<TertiaryAction
												type='button'
												$danger
												onClick={() => props.onRemovePendingFile?.(fileKey)}>
												Remove
											</TertiaryAction>
										</AttachmentActions>
									</AttachmentItem>
								);
							})}
							{(props.deviceFormData.files || []).length === 0 &&
								pendingFiles.length === 0 && (
									<AttachmentSubtext>
										No attachments yet. Add files above to include manuals, invoices, or photos.
									</AttachmentSubtext>
								)}
						</AttachmentList>
					</AttachmentSection>
					<FieldHint>
						{(props.pendingFiles || []).length > 0
							? `${props.pendingFiles?.length || 0} file${
								(props.pendingFiles?.length || 0) === 1 ? '' : 's'
							} selected and ready to upload when you save.`
							: `${props.deviceFormData.files?.length || 0} existing attachment${
								(props.deviceFormData.files?.length || 0) === 1 ? '' : 's'
							}. Add new files to upload on save.`}
					</FieldHint>
				</FormGroupFull>
				</FormGrid>
			</ModalTabContent>

			<ModalTabContent $active={activeTab === 'service-items'}>
				{/* ── Add new item form ── */}
				<SectionHeader>
					<SectionTitle>Parts & Supplies</SectionTitle>
					<SectionDescription>
						Track filters, fluids, and replacement parts so linked tasks can reuse the details later.
					</SectionDescription>
				</SectionHeader>
				<PartsCard>
					<p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.95rem', color: COLORS.gray900 }}>
						Add Service Item
					</p>
					<p style={{ margin: '0 0 14px', color: COLORS.gray500, fontSize: '0.85rem' }}>
						Track parts, filters, fluids, or any service spec. These are automatically
						appended to linked task notes.
					</p>
					<FormGrid>
						<FormGroup>
							<FormLabel>Category *</FormLabel>
							<TaskSelect
								value={newCategoryOption}
								onChange={(value) => {
									setNewCategoryOption(value);
									if (value !== 'Other') {
										setNewCustomCategory('');
									}
								}}
								options={SERVICE_ITEM_CATEGORY_OPTIONS}
								placeholder='Select category'
							/>
							{newCategoryOption === 'Other' && (
								<FormInput
									type='text'
									value={newCustomCategory}
									onChange={(e) => {
										setNewCustomCategory(e.target.value);
									}}
									placeholder='Enter custom category'
									style={{ marginTop: '8px' }}
								/>
							)}
						</FormGroup>
						<FormGroup>
							<FormLabel>Item Name *</FormLabel>
							<FormInput
								type='text'
								value={newItemName}
								onChange={(e) => setNewItemName(e.target.value)}
								placeholder='e.g., HVAC Return Filter'
							/>
						</FormGroup>
					</FormGrid>
					<FormGroup>
						<FormLabel>
							Details{' '}
							<span style={{ color: COLORS.gray400, fontWeight: 400 }}>(optional)</span>
						</FormLabel>
						<FormTextarea
							value={newItemDetails}
							onChange={(e) => setNewItemDetails(e.target.value)}
							placeholder='Size, grade, part number, vendor info, etc.'
						/>
					</FormGroup>
					<button
						type='button'
						onClick={handleAddServiceItem}
						disabled={
							newCategoryOption === 'Other'
								? !newCustomCategory.trim() || !newItemName.trim()
								: !newCategoryOption.trim() || !newItemName.trim()
						}
						style={{
							padding: '8px 18px',
							border: 'none',
							borderRadius: '6px',
							background:
								(newCategoryOption === 'Other'
									? !newCustomCategory.trim() || !newItemName.trim()
									: !newCategoryOption.trim() || !newItemName.trim())
									? COLORS.gray200
									: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
							color:
								(newCategoryOption === 'Other'
									? !newCustomCategory.trim() || !newItemName.trim()
									: !newCategoryOption.trim() || !newItemName.trim())
									? COLORS.gray400
									: 'white',
							fontWeight: 600,
							cursor:
								(newCategoryOption === 'Other'
									? !newCustomCategory.trim() || !newItemName.trim()
									: !newCategoryOption.trim() || !newItemName.trim())
									? 'not-allowed'
									: 'pointer',
							fontSize: '0.9rem',
							boxShadow:
								(newCategoryOption === 'Other'
									? !newCustomCategory.trim() || !newItemName.trim()
									: !newCategoryOption.trim() || !newItemName.trim())
									? 'none'
									: '0 2px 8px rgba(16,185,129,0.25)',
						}}>
						+ Add Item
					</button>
				</PartsCard>

				{/* ── Saved items list ── */}
				<PartsHeader>
					<span style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.gray900 }}>
						Saved Items{' '}
						<CountBadge>
							{serviceItems.length}
						</CountBadge>
					</span>
					{serviceItems.length > 3 && (
						<FormInput
							type='text'
							value={itemFilter}
							onChange={(e) => setItemFilter(e.target.value)}
							placeholder='Search items…'
							style={{ width: '180px', padding: '4px 8px', fontSize: '0.85rem' }}
						/>
					)}
				</PartsHeader>

				<div
					style={{
						border: `1px solid ${COLORS.gray200}`,
						borderRadius: '8px',
						overflow: 'hidden',
					}}>
					{serviceItems.length === 0 ? (
						<p
							style={{
								margin: 0,
								padding: '20px 16px',
								color: COLORS.gray400,
								fontSize: '0.9rem',
								textAlign: 'center',
							}}>
							No service items yet — add one above.
						</p>
					) : filteredServiceItems.length === 0 ? (
						<p
							style={{
								margin: 0,
								padding: '20px 16px',
								color: COLORS.gray400,
								fontSize: '0.9rem',
								textAlign: 'center',
							}}>
							No items match your search.
						</p>
					) : (
						filteredServiceItems.map((item, idx) =>
							editingItemId === item.id ? (
								/* ── Inline edit row ── */
								<div
									key={item.id}
									style={{
										padding: '12px 14px',
										background: COLORS.primaryLight,
										borderBottom:
											idx < filteredServiceItems.length - 1
												? `1px solid ${COLORS.gray200}`
												: 'none',
									}}>
									<FormGrid style={{ marginBottom: '8px' }}>
										<FormGroup style={{ marginBottom: 0 }}>
											<FormLabel>Category *</FormLabel>
											<TaskSelect
												value={editCategoryOption}
												onChange={(value) => {
													setEditCategoryOption(value);
													if (value !== 'Other') {
														setEditCustomCategory('');
													}
												}}
												options={SERVICE_ITEM_CATEGORY_OPTIONS}
												placeholder='Select category'
											/>
											{editCategoryOption === 'Other' && (
												<FormInput
													type='text'
													value={editCustomCategory}
													onChange={(e) => {
														setEditCustomCategory(e.target.value);
													}}
													placeholder='Enter custom category'
													style={{ marginTop: '8px' }}
												/>
											)}
										</FormGroup>
										<FormGroup style={{ marginBottom: 0 }}>
											<FormLabel>Item Name *</FormLabel>
											<FormInput
												type='text'
												value={editName}
												onChange={(e) => setEditName(e.target.value)}
											/>
										</FormGroup>
									</FormGrid>
									<FormGroup style={{ marginBottom: '10px' }}>
										<FormLabel>Details</FormLabel>
										<FormTextarea
											value={editDetails}
											onChange={(e) => setEditDetails(e.target.value)}
											placeholder='Size, grade, part number, etc.'
										/>
									</FormGroup>
									<div style={{ display: 'flex', gap: '8px' }}>
										<button
											type='button'
											onClick={handleSaveEdit}
											disabled={
												editCategoryOption === 'Other'
													? !editCustomCategory.trim() || !editName.trim()
													: !editCategoryOption.trim() || !editName.trim()
											}
											style={{
												padding: '6px 14px',
												border: 'none',
												borderRadius: '6px',
												background:
													(editCategoryOption === 'Other'
														? !editCustomCategory.trim() || !editName.trim()
														: !editCategoryOption.trim() || !editName.trim())
														? COLORS.gray200
														: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
												color:
													(editCategoryOption === 'Other'
														? !editCustomCategory.trim() || !editName.trim()
														: !editCategoryOption.trim() || !editName.trim())
														? COLORS.gray400
														: 'white',
												fontWeight: 600,
												cursor:
													(editCategoryOption === 'Other'
														? !editCustomCategory.trim() || !editName.trim()
														: !editCategoryOption.trim() || !editName.trim())
														? 'not-allowed'
														: 'pointer',
												fontSize: '0.85rem',
											}}>
											Save
										</button>
										<button
											type='button'
											onClick={handleCancelEdit}
											style={{
												padding: '6px 14px',
												border: `1.5px solid ${COLORS.gray300}`,
												borderRadius: '6px',
												background: 'white',
												color: COLORS.gray600,
												fontWeight: 600,
												cursor: 'pointer',
												fontSize: '0.85rem',
											}}>
											Cancel
										</button>
									</div>
								</div>
							) : (
								/* ── Read-only row ── */
								<div
									key={item.id}
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'flex-start',
										gap: '12px',
										padding: '10px 14px',
										background: idx % 2 === 0 ? 'white' : COLORS.gray50,
										borderBottom:
											idx < filteredServiceItems.length - 1
												? `1px solid ${COLORS.gray100}`
												: 'none',
									}}>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div
											style={{
												fontWeight: 600,
												fontSize: '0.9rem',
												color: COLORS.gray900,
											}}>
											{item.name}
										</div>
										<div
											style={{
												fontSize: '0.75rem',
												color: COLORS.primaryDark,
												textTransform: 'uppercase',
												letterSpacing: '0.05em',
												fontWeight: 600,
												marginTop: '2px',
											}}>
											{item.category}
										</div>
										{item.details && (
											<div
												style={{
													fontSize: '0.82rem',
													color: COLORS.gray500,
													marginTop: '3px',
												}}>
												{item.details}
											</div>
										)}
									</div>
									<div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
										<button
											type='button'
											onClick={() => handleStartEdit(item)}
											style={{
												border: `1.5px solid ${COLORS.gray300}`,
												background: 'white',
												color: COLORS.gray700,
												cursor: 'pointer',
												fontWeight: 600,
												borderRadius: '4px',
												padding: '3px 10px',
												fontSize: '0.8rem',
											}}>
											Edit
										</button>
										<button
											type='button'
											onClick={() => handleRemoveServiceItem(item.id)}
											style={{
												border: `1.5px solid ${COLORS.errorLight}`,
												background: COLORS.errorLight,
												color: COLORS.errorDark,
												cursor: 'pointer',
												fontWeight: 600,
												borderRadius: '4px',
												padding: '3px 10px',
												fontSize: '0.8rem',
											}}>
											Remove
										</button>
									</div>
								</div>
							),
						)
					)}
				</div>
			</ModalTabContent>
			</ScrollBody>
		</GenericModal>
	);
};
