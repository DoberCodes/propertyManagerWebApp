import React, { useMemo, useState } from 'react';
import GenericModal from './GenericModal';
import {
	FormGroup,
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
	units?: any[];
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
		associatedUnit?: string;
		file?: File | null;
	};
	onFormChange: (
		event: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => void;
	onServiceItemsChange?: (items: DeviceServiceItem[]) => void;
}

export const DeviceModal = (props: DeviceModalProps) => {
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

		props.onServiceItemsChange?.([...serviceItems, nextItem]);
		setNewCategoryOption('Part');
		setNewCustomCategory('');
		setNewItemName('');
		setNewItemDetails('');
	};

	const handleRemoveServiceItem = (id: string) => {
		props.onServiceItemsChange?.(serviceItems.filter((item) => item.id !== id));
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
		props.onServiceItemsChange?.(
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

	return (
		<GenericModal
			isOpen={props.isOpen}
			onClose={props.onClose}
			title='Add New Household Device'
			onSubmit={props.onSubmit}
			showActions={true}
			primaryButtonLabel='Add Device'
			secondaryButtonLabel='Cancel'>
			<ModalTabContainer>
				<ModalTab
					type='button'
					$active={activeTab === 'details'}
					onClick={() => setActiveTab('details')}>
					Device Details
				</ModalTab>
				<ModalTab
					type='button'
					$active={activeTab === 'service-items'}
					onClick={() => setActiveTab('service-items')}>
					Parts & Supplies
				</ModalTab>
			</ModalTabContainer>

			<div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: '0.5rem' }}>
			<ModalTabContent $active={activeTab === 'details'}>
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
				</FormGroup>
				{props.property.propertyType === 'Multi-Family' && (
					<FormGroup>
						<FormLabel>Associated Unit (optional)</FormLabel>
						<FormInput
							type='text'
							name='associatedUnit'
							value={props.deviceFormData.associatedUnit || ''}
							onChange={props.onFormChange}
							placeholder='e.g., Unit A1'
						/>
					</FormGroup>
				)}

				<FileUploader setFile={(file) => console.info(file)} />
			</ModalTabContent>

			<ModalTabContent $active={activeTab === 'service-items'}>
				{/* ── Add new item form ── */}
				<div
					style={{
						background: COLORS.gray50,
						border: `1px solid ${COLORS.gray200}`,
						borderRadius: '8px',
						padding: '16px',
						marginBottom: '20px',
					}}>
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
				</div>

				{/* ── Saved items list ── */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: '8px',
					}}>
					<span style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.gray900 }}>
						Saved Items{' '}
						<span
							style={{
								background: COLORS.primaryLight,
								color: COLORS.primaryDark,
								borderRadius: '12px',
								padding: '1px 8px',
								fontSize: '0.8rem',
								fontWeight: 700,
								marginLeft: '4px',
							}}>
							{serviceItems.length}
						</span>
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
				</div>

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
			</div>
		</GenericModal>
	);
};
