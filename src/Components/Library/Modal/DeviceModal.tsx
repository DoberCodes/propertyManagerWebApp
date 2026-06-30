import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import GenericModal from './GenericModal';
import {
	FormGroup,
	FormGroupFull,
	FormGrid,
	FormInput,
	FormLabel,
	FormSelect,
	FormTextarea,
	ModalTab,
	ModalTabContainer,
	ModalTabContent,
} from './ModalStyles';
import { COLORS } from '../../../constants/colors';
import {
	Property,
	DeviceServiceItem,
	PropertyDocumentCategory,
} from '../../../types/Property.types';
import { TaskSelect } from '../Select/TaskSelect';
import {
	DEVICE_SERVICE_ITEM_CATEGORY_OPTIONS,
	DEVICE_SERVICE_ITEM_FIELDS_BY_CATEGORY,
	buildDeviceServiceItemDetails,
} from '../../../constants/deviceServiceItems';
import {
	parseDeviceBarcodePayload,
	parsePartBarcodePayload,
} from '../../../utils/barcodeScanParser';
import { BarcodeScannerModal } from '../BarcodeScanner/BarcodeScannerModal';
import { useGetDevicesQuery } from '../../../Redux/API/deviceSlice';
import { ApplianceDocumentsPanel } from '../../ApplianceDocumentsPanel/ApplianceDocumentsPanel';
import {
	getAssetVariantOptions,
	getAssetTypeOptions,
	normalizeAssetType,
	UNKNOWN_ASSET_TYPE,
} from '../../../utils/systemTypes';

interface DeviceModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (event: React.FormEvent) => void;
	property: Property;
	availableProperties?: Property[];
	allowPropertySelection?: boolean;
	deviceId?: string;
	isEditing?: boolean;
	units?: any[];
	pendingFiles?: File[];
	onPendingFilesChange?: (files: File[]) => void;
	pendingPropertyDocumentFiles?: File[];
	onPendingPropertyDocumentFilesChange?: (files: File[]) => void;
	pendingPropertyDocumentCategory?: PropertyDocumentCategory;
	onPendingPropertyDocumentCategoryChange?: (
		category: PropertyDocumentCategory,
	) => void;
	removedExistingFileUrls?: string[];
	onRemoveExistingFile?: (url: string) => void;
	onRestoreExistingFile?: (url: string) => void;
	onRemovePendingFile?: (fileKey: string) => void;
	deviceFormData: {
		type: string;
		assetType?: string;
		assetVariant?: string;
		brand: string;
		model: string;
		serialNumber?: string;
		partNumber?: string;
		filterSize?: string;
		specNotes?: string;
		serviceItems?: DeviceServiceItem[];
		installationDate: string;
		decommissionDate?: string;
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
			usage?: 'appliance_photo' | 'document';
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

	@media (max-width: 480px) {
		gap: 0.35rem;
		white-space: nowrap;
	}
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
		props.$tone === 'success' ? COLORS.successLight : '#eef2f7'};
	color: ${(props) =>
		props.$tone === 'success' ? COLORS.successDark : COLORS.textSecondary};
`;

const SummaryBanner = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 1rem;
	margin-bottom: 1.25rem;
	border: 1px solid ${COLORS.successLight};
	border-radius: 10px;
	background: linear-gradient(
		135deg,
		rgba(0, 158, 113, 0.14) 0%,
		rgba(4, 120, 87, 0.08) 100%
	);
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
		props.$tone === 'success' ? COLORS.successLight : '#ffffff'};
	color: ${(props) =>
		props.$tone === 'success' ? COLORS.successDark : COLORS.textSecondary};
	border: 1px solid
		${(props) => (props.$tone === 'success' ? COLORS.primaryHover : COLORS.gray200)};
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

const StickyTabRail = styled.div`
	position: sticky;
	top: 0;
	z-index: 12;
	background: #ffffff;
	flex-shrink: 0;
	padding-top: 0.15rem;

	@media (max-width: 480px) {
		margin-left: -0.1rem;
		margin-right: -0.1rem;
	}
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

const ScanButton = styled.button`
	padding: 7px 12px;
	border-radius: 8px;
	border: 1px solid ${COLORS.primary};
	background: #ffffff;
	color: ${COLORS.primaryDark};
	font-size: 0.82rem;
	font-weight: 700;
	cursor: pointer;

	&:hover {
		background: ${COLORS.primaryLight};
	}
`;

const formatBytes = (value: number) => {
	const kb = value / 1024;
	if (kb < 1024) return `${kb.toFixed(1)} KB`;
	return `${(kb / 1024).toFixed(1)} MB`;
};

export const DeviceModal = (props: DeviceModalProps) => {
	const [submitAttempted, setSubmitAttempted] = useState(false);
	const [isDeviceScanOpen, setIsDeviceScanOpen] = useState(false);
	const [isPartScanOpen, setIsPartScanOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<'details' | 'service-items'>(
		'details',
	);
	const scrollBodyRef = useRef<HTMLDivElement | null>(null);
	const [itemFilter, setItemFilter] = useState('');
	const { data: propertyDevices = [] } = useGetDevicesQuery(props.property.id || '', {
		skip: !props.property?.id,
	});

	const normalizeIdentifier = (value?: string) =>
		String(value || '')
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '');
	const [newCategoryOption, setNewCategoryOption] = useState('part');
	const [newCustomCategory, setNewCustomCategory] = useState('');
	const [newItemName, setNewItemName] = useState('');
	const [newItemDetails, setNewItemDetails] = useState('');
	const [newItemPartNumber, setNewItemPartNumber] = useState('');
	const [newItemSize, setNewItemSize] = useState('');
	const [newItemManufacturer, setNewItemManufacturer] = useState('');
	const [newItemMaterial, setNewItemMaterial] = useState('');
	const [newItemVoltage, setNewItemVoltage] = useState('');
	const [newItemMervRating, setNewItemMervRating] = useState('');
	const [newItemCompatibility, setNewItemCompatibility] = useState('');
	const [newItemReplacementInterval, setNewItemReplacementInterval] = useState('');
	const [newItemNotes, setNewItemNotes] = useState('');

	// Edit state
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [editCategoryOption, setEditCategoryOption] = useState('part');
	const [editCustomCategory, setEditCustomCategory] = useState('');
	const [editName, setEditName] = useState('');
	const [editDetails, setEditDetails] = useState('');
	const [editPartNumber, setEditPartNumber] = useState('');
	const [editSize, setEditSize] = useState('');
	const [editManufacturer, setEditManufacturer] = useState('');
	const [editMaterial, setEditMaterial] = useState('');
	const [editVoltage, setEditVoltage] = useState('');
	const [editMervRating, setEditMervRating] = useState('');
	const [editCompatibility, setEditCompatibility] = useState('');
	const [editReplacementInterval, setEditReplacementInterval] = useState('');
	const [editNotes, setEditNotes] = useState('');

	const serviceItems = useMemo(
		() => props.deviceFormData.serviceItems || [],
		[props.deviceFormData.serviceItems],
	);
	const newDynamicFields = useMemo(
		() =>
			DEVICE_SERVICE_ITEM_FIELDS_BY_CATEGORY[newCategoryOption] ||
			DEVICE_SERVICE_ITEM_FIELDS_BY_CATEGORY.other,
		[newCategoryOption],
	);
	const editDynamicFields = useMemo(
		() =>
			DEVICE_SERVICE_ITEM_FIELDS_BY_CATEGORY[editCategoryOption] ||
			DEVICE_SERVICE_ITEM_FIELDS_BY_CATEGORY.other,
		[editCategoryOption],
	);

	useEffect(() => {
		if (props.isOpen) {
			setActiveTab('details');
			setSubmitAttempted(false);
		}
	}, [props.isOpen]);

	useEffect(() => {
		if (!props.isOpen) return;
		scrollBodyRef.current?.scrollTo({
			top: 0,
			left: 0,
			behavior: 'auto',
		});
	}, [props.isOpen, activeTab]);

	// Units are temporarily hidden from the app flow.
	const selectedAssetType = normalizeAssetType(
		props.deviceFormData.assetType || props.deviceFormData.type,
	);
	const variantOptions = getAssetVariantOptions(selectedAssetType);

	const missingRequiredFields = useMemo(() => {
		const missing: string[] = [];
		if (!selectedAssetType.trim()) missing.push('Asset type');
		return missing;
	}, [selectedAssetType]);

	const completedBasics = missingRequiredFields.length === 0 ? 1 : 0;
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
			const haystack = `${item.category} ${item.name} ${item.details || ''} ${item.partNumber || ''} ${item.size || ''} ${item.notes || ''}`
				.trim()
				.toLowerCase();
			return haystack.includes(query);
		});
	}, [serviceItems, itemFilter]);

	const handleAddServiceItem = () => {
		const category =
			newCategoryOption === 'other'
				? newCustomCategory.trim()
				: newCategoryOption.trim();
		const name = newItemName.trim();
		const details = newItemDetails.trim();

		if (!category || !name) return;

		const nextItem: DeviceServiceItem = {
			id: `svc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			category,
			name,
			details:
				buildDeviceServiceItemDetails({
					category,
					name,
					details,
					partNumber: newItemPartNumber.trim(),
					size: newItemSize.trim(),
					manufacturer: newItemManufacturer.trim(),
					material: newItemMaterial.trim(),
					voltage: newItemVoltage.trim(),
					mervRating: newItemMervRating.trim(),
					compatibility: newItemCompatibility.trim(),
					replacementInterval: newItemReplacementInterval.trim(),
					notes: newItemNotes.trim(),
				}) || undefined,
			partNumber: newItemPartNumber.trim() || undefined,
			size: newItemSize.trim() || undefined,
			manufacturer: newItemManufacturer.trim() || undefined,
			material: newItemMaterial.trim() || undefined,
			voltage: newItemVoltage.trim() || undefined,
			mervRating: newItemMervRating.trim() || undefined,
			compatibility: newItemCompatibility.trim() || undefined,
			replacementInterval: newItemReplacementInterval.trim() || undefined,
			notes: newItemNotes.trim() || undefined,
		};

		updateServiceItems([...serviceItems, nextItem]);
		setNewCategoryOption('part');
		setNewCustomCategory('');
		setNewItemName('');
		setNewItemDetails('');
		setNewItemPartNumber('');
		setNewItemSize('');
		setNewItemManufacturer('');
		setNewItemMaterial('');
		setNewItemVoltage('');
		setNewItemMervRating('');
		setNewItemCompatibility('');
		setNewItemReplacementInterval('');
		setNewItemNotes('');
	};

	const handleRemoveServiceItem = (id: string) => {
		updateServiceItems(serviceItems.filter((item) => item.id !== id));
	};

	const handleStartEdit = (item: DeviceServiceItem) => {
		const matchedCategory = DEVICE_SERVICE_ITEM_CATEGORY_OPTIONS.find(
			(option) => option.value !== 'other' && option.value === item.category,
		);
		setEditingItemId(item.id);
		setEditCategoryOption(matchedCategory ? matchedCategory.value : 'other');
		setEditCustomCategory(matchedCategory ? '' : item.category);
		setEditName(item.name);
		setEditDetails(item.details || '');
		setEditPartNumber(item.partNumber || '');
		setEditSize(item.size || '');
		setEditManufacturer(item.manufacturer || '');
		setEditMaterial(item.material || '');
		setEditVoltage(item.voltage || '');
		setEditMervRating(item.mervRating || '');
		setEditCompatibility(item.compatibility || '');
		setEditReplacementInterval(item.replacementInterval || '');
		setEditNotes(item.notes || '');
	};

	const handleSaveEdit = () => {
		const category =
			editCategoryOption === 'other'
				? editCustomCategory.trim()
				: editCategoryOption.trim();
		const name = editName.trim();
		if (!editingItemId || !category || !name) return;
		updateServiceItems(
			serviceItems.map((item) =>
				item.id === editingItemId
					? {
						...item,
						category,
						name,
						details:
							buildDeviceServiceItemDetails({
								category,
								name,
								details: editDetails.trim(),
								partNumber: editPartNumber.trim(),
								size: editSize.trim(),
								manufacturer: editManufacturer.trim(),
								material: editMaterial.trim(),
								voltage: editVoltage.trim(),
								mervRating: editMervRating.trim(),
								compatibility: editCompatibility.trim(),
								replacementInterval: editReplacementInterval.trim(),
								notes: editNotes.trim(),
							}) || undefined,
						partNumber: editPartNumber.trim() || undefined,
						size: editSize.trim() || undefined,
						manufacturer: editManufacturer.trim() || undefined,
						material: editMaterial.trim() || undefined,
						voltage: editVoltage.trim() || undefined,
						mervRating: editMervRating.trim() || undefined,
						compatibility: editCompatibility.trim() || undefined,
						replacementInterval: editReplacementInterval.trim() || undefined,
						notes: editNotes.trim() || undefined,
					}
					: item,
			),
		);
		setEditingItemId(null);
		setEditCustomCategory('');
		setEditPartNumber('');
		setEditSize('');
		setEditManufacturer('');
		setEditMaterial('');
		setEditVoltage('');
		setEditMervRating('');
		setEditCompatibility('');
		setEditReplacementInterval('');
		setEditNotes('');
	};

	const handleCancelEdit = () => {
		setEditingItemId(null);
		setEditCustomCategory('');
		setEditPartNumber('');
		setEditSize('');
		setEditManufacturer('');
		setEditMaterial('');
		setEditVoltage('');
		setEditMervRating('');
		setEditCompatibility('');
		setEditReplacementInterval('');
		setEditNotes('');
	};

	const handleDeviceBarcodeDetected = (rawValue: string) => {
		const parsed = parseDeviceBarcodePayload(rawValue);
		const scannedSerial = normalizeIdentifier(parsed.serialNumber || rawValue);
		const scannedPart = normalizeIdentifier(parsed.partNumber || rawValue);
		const matchingDevice = propertyDevices.find((candidate: any) => {
			const candidateSerial = normalizeIdentifier(candidate?.serialNumber);
			const candidatePart = normalizeIdentifier(candidate?.partNumber);
			return (
				(!!scannedSerial && !!candidateSerial && scannedSerial === candidateSerial) ||
				(!!scannedPart && !!candidatePart && scannedPart === candidatePart)
			);
		});

		if (parsed.type || matchingDevice?.type) {
			emitChange('assetType', parsed.type || matchingDevice?.type || '');
		}
		if (parsed.brand || matchingDevice?.brand) {
			emitChange('brand', parsed.brand || matchingDevice?.brand || '');
		}
		if (parsed.model || matchingDevice?.model) {
			emitChange('model', parsed.model || matchingDevice?.model || '');
		}
		if (parsed.serialNumber) emitChange('serialNumber', parsed.serialNumber);
		if (parsed.partNumber) emitChange('partNumber', parsed.partNumber);
		if (parsed.filterSize || matchingDevice?.filterSize) {
			emitChange('filterSize', parsed.filterSize || matchingDevice?.filterSize || '');
		}
		if (parsed.specNotes) {
			const enrichedNotes = matchingDevice
				? `${parsed.specNotes} | Matched existing appliance: ${matchingDevice.type || 'Appliance'} ${matchingDevice.brand || ''} ${matchingDevice.model || ''}`.trim()
				: parsed.specNotes;
			emitChange('specNotes', enrichedNotes);
		}
	};

	const handlePartBarcodeDetected = (rawValue: string) => {
		const parsed = parsePartBarcodePayload(rawValue);
		if (parsed.category) {
			if (
				DEVICE_SERVICE_ITEM_CATEGORY_OPTIONS.some(
					(option) => option.value === parsed.category,
				)
			) {
				setNewCategoryOption(parsed.category);
				setNewCustomCategory('');
			} else {
				setNewCategoryOption('other');
				setNewCustomCategory(parsed.category);
			}
		}

		if (parsed.name) setNewItemName(parsed.name);
		if (parsed.details) setNewItemDetails(parsed.details);
		if (parsed.partNumber) setNewItemPartNumber(parsed.partNumber);
		if (parsed.size) setNewItemSize(parsed.size);
		if (parsed.manufacturer) setNewItemManufacturer(parsed.manufacturer);
		if (parsed.material) setNewItemMaterial(parsed.material);
		if (parsed.voltage) setNewItemVoltage(parsed.voltage);
		if (parsed.mervRating) setNewItemMervRating(parsed.mervRating);
		if (parsed.compatibility) setNewItemCompatibility(parsed.compatibility);
		if (parsed.replacementInterval) {
			setNewItemReplacementInterval(parsed.replacementInterval);
		}
		if (parsed.notes) setNewItemNotes(parsed.notes);
	};

	const removedSet = useMemo(
		() => new Set(props.removedExistingFileUrls || []),
		[props.removedExistingFileUrls],
	);

	const pendingFiles = props.pendingFiles || [];
	const canSelectProperty =
		props.allowPropertySelection === true &&
		!props.isEditing &&
		Array.isArray(props.availableProperties) &&
		props.availableProperties.length > 1;

	return (
		<>
			<GenericModal
				isOpen={props.isOpen}
				onClose={props.onClose}
				title={props.isEditing ? 'Edit Household Appliance' : 'Add New Household Appliance'}
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
				primaryButtonLabel={props.isEditing ? 'Save Appliance' : 'Add Appliance'}
				secondaryButtonLabel='Cancel'
				primaryButtonDisabled={missingRequiredFields.length > 0}>
				<StickyTabRail>
					<ModalTabContainer>
						<ModalTab
							type='button'
							$active={activeTab === 'details'}
							onClick={() => setActiveTab('details')}>
							<TabLabel>
								Appliance Details
								{missingRequiredFields.length > 0 && (
									<TabBadge $tone='neutral'>
										{`${missingRequiredFields.length} required`}
									</TabBadge>
								)}
							</TabLabel>
						</ModalTab>
						<ModalTab
							type='button'
							$active={activeTab === 'service-items'}
							onClick={() => setActiveTab('service-items')}>
							<TabLabel>
								Parts & Supplies
							</TabLabel>
						</ModalTab>
					</ModalTabContainer>
				</StickyTabRail>

				<ScrollBody ref={scrollBodyRef}>
					<ModalTabContent $active={activeTab === 'details'}>
						<SummaryBanner>
							<SummaryTitle>Capture the appliance basics first, then optionally document recurring parts and supplies.</SummaryTitle>
							<SummaryMeta>
								<SummaryPill $tone={missingRequiredFields.length === 0 ? 'success' : 'neutral'}>
									{completedBasics}/1 required item complete
								</SummaryPill>
								<SummaryPill $tone={partsConfigured ? 'success' : 'neutral'}>
									{serviceItems.length} part{serviceItems.length === 1 ? '' : 's'} tracked
								</SummaryPill>
							</SummaryMeta>
							<RequiredList>
								{missingRequiredFields.length > 0
									? `Still needed: ${missingRequiredFields.join(', ')}`
									: 'The required name is set. Add more details now, or save and come back later.'}
							</RequiredList>
						</SummaryBanner>

						<SectionHeader>
							<SectionTitle>Core Appliance Details</SectionTitle>
							<SectionDescription>
								Choose the asset type now. Variant, brand, model, lifecycle dates,
								and parts can be filled in whenever they are known.
							</SectionDescription>
						</SectionHeader>
						<div style={{ marginBottom: '12px' }}>
							<ScanButton type='button' onClick={() => setIsDeviceScanOpen(true)}>
								Capture Appliance Label
							</ScanButton>
						</div>

						<FormGrid>
							{canSelectProperty && (
								<FormGroup>
									<FormLabel>Property</FormLabel>
									<FormSelect
										name='location.propertyId'
										value={props.deviceFormData.location?.propertyId || props.property.id || ''}
										onChange={props.onFormChange}>
										{props.availableProperties?.map((propertyOption) => (
											<option key={propertyOption.id} value={propertyOption.id}>
												{propertyOption.title || 'Untitled Property'}
											</option>
										))}
									</FormSelect>
								</FormGroup>
							)}
							<FormGroup>
								<FormLabel>Asset Type *</FormLabel>
								<FormSelect
									name='assetType'
									value={selectedAssetType || UNKNOWN_ASSET_TYPE}
									onChange={props.onFormChange}
									required>
									{getAssetTypeOptions().map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
									{selectedAssetType &&
										!getAssetTypeOptions().some(
											(option) => option.value === selectedAssetType,
										) ? (
										<option value={selectedAssetType}>{selectedAssetType}</option>
									) : null}
								</FormSelect>
								<FieldHint>
									Choose the broad category Maintley should use for recommendations.
								</FieldHint>
								{detailsError && !selectedAssetType.trim() && (
									<FieldError>Asset type is required.</FieldError>
								)}
							</FormGroup>

							<FormGroup>
								<FormLabel>Variant</FormLabel>
								<FormSelect
									name='assetVariant'
									value={props.deviceFormData.assetVariant || ''}
									onChange={props.onFormChange}
									disabled={
										variantOptions.length === 0 &&
										!props.deviceFormData.assetVariant
									}>
									<option value=''>Unknown / not recorded</option>
									{variantOptions.map((variant) => (
										<option key={variant} value={variant}>
											{variant}
										</option>
									))}
									{props.deviceFormData.assetVariant &&
										!variantOptions.includes(props.deviceFormData.assetVariant) ? (
										<option value={props.deviceFormData.assetVariant}>
											{props.deviceFormData.assetVariant}
										</option>
									) : null}
								</FormSelect>
								<FieldHint>
									Add the specific equipment type when known. It can stay unknown.
								</FieldHint>
							</FormGroup>

							<FormGroup>
								<FormLabel>Brand</FormLabel>
								<FormInput
									type='text'
									name='brand'
									value={props.deviceFormData.brand}
									onChange={props.onFormChange}
									placeholder='e.g., Carrier, Rheem'
								/>
							</FormGroup>

							<FormGroup>
								<FormLabel>Model</FormLabel>
								<FormInput
									type='text'
									name='model'
									value={props.deviceFormData.model}
									onChange={props.onFormChange}
									placeholder='e.g., AquaEdge, Prestige'
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
								<FormLabel>Status</FormLabel>
								<FormSelect
									name='status'
									value={props.deviceFormData.status || 'Active'}
									onChange={props.onFormChange}>
									<option value='Active'>Active</option>
									<option value='Maintenance'>Maintenance</option>
									<option value='Broken'>Broken</option>
									<option value='Decommissioned'>Decommissioned</option>
								</FormSelect>
							</FormGroup>

							<FormGroup>
								<FormLabel>Installation Date</FormLabel>
								<FormInput
									type='date'
									name='installationDate'
									value={props.deviceFormData.installationDate}
									onChange={props.onFormChange}
								/>
							</FormGroup>

							<FormGroup>
								<FormLabel>Decommission Date</FormLabel>
								<FormInput
									type='date'
									name='decommissionDate'
									value={props.deviceFormData.decommissionDate || ''}
									onChange={props.onFormChange}
								/>
								<FieldHint>
									Setting this date marks the appliance as decommissioned.
								</FieldHint>
							</FormGroup>
							{/* Units are temporarily hidden from the app flow. */}
							{(props.deviceFormData.files || []).length > 0 && (
							<FormGroupFull>
								<AttachmentSection>
									<SectionTitle style={{ fontSize: '0.92rem' }}>
										Existing Files
									</SectionTitle>
									<SectionDescription>
										These older files are saved directly on this appliance. New uploads should use Appliance Documents below.
									</SectionDescription>
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
										{false && pendingFiles.map((file) => {
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
										{false && (props.deviceFormData.files || []).length === 0 &&
											pendingFiles.length === 0 && (
												<AttachmentSubtext>
													No attachments yet. Add files above to include manuals, invoices, or photos.
												</AttachmentSubtext>
											)}
									</AttachmentList>
								</AttachmentSection>
								<FieldHint>
									New uploads should use Appliance Documents below.
								</FieldHint>
							</FormGroupFull>
							)}
							<FormGroupFull>
								<ApplianceDocumentsPanel
									property={props.property}
									propertyId={props.property.id}
									deviceId={props.deviceId}
									canUpload={Boolean(props.property.id)}
									pendingFiles={props.pendingPropertyDocumentFiles}
									onPendingFilesChange={props.onPendingPropertyDocumentFilesChange}
									pendingCategory={props.pendingPropertyDocumentCategory}
									onPendingCategoryChange={props.onPendingPropertyDocumentCategoryChange}
								/>
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
						<div style={{ marginBottom: '12px' }}>
							<ScanButton type='button' onClick={() => setIsPartScanOpen(true)}>
								Capture Part Label or Barcode
							</ScanButton>
						</div>
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
											if (value !== 'other') {
												setNewCustomCategory('');
											}
										}}
										options={DEVICE_SERVICE_ITEM_CATEGORY_OPTIONS}
										placeholder='Select category'
									/>
									{newCategoryOption === 'other' && (
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
							<FormGrid>
								{newDynamicFields.map((field) => (
									<FormGroup key={String(field.key)}>
										<FormLabel>{field.label}</FormLabel>
										<FormInput
											type={field.type || 'text'}
											value={
												field.key === 'partNumber'
													? newItemPartNumber
													: field.key === 'size'
														? newItemSize
														: field.key === 'manufacturer'
															? newItemManufacturer
															: field.key === 'material'
																? newItemMaterial
																: field.key === 'voltage'
																	? newItemVoltage
																	: field.key === 'mervRating'
																		? newItemMervRating
																		: field.key === 'compatibility'
																			? newItemCompatibility
																			: newItemReplacementInterval
											}
											onChange={(e) => {
												const value = e.target.value;
												if (field.key === 'partNumber') setNewItemPartNumber(value);
												if (field.key === 'size') setNewItemSize(value);
												if (field.key === 'manufacturer') setNewItemManufacturer(value);
												if (field.key === 'material') setNewItemMaterial(value);
												if (field.key === 'voltage') setNewItemVoltage(value);
												if (field.key === 'mervRating') setNewItemMervRating(value);
												if (field.key === 'compatibility') setNewItemCompatibility(value);
												if (field.key === 'replacementInterval')
													setNewItemReplacementInterval(value);
											}}
											placeholder={field.placeholder}
										/>
									</FormGroup>
								))}
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
							<FormGroup>
								<FormLabel>Notes</FormLabel>
								<FormTextarea
									value={newItemNotes}
									onChange={(e) => setNewItemNotes(e.target.value)}
									placeholder='Any extra install/service notes for this item.'
								/>
							</FormGroup>
							<button
								type='button'
								onClick={handleAddServiceItem}
								disabled={
									newCategoryOption === 'other'
										? !newCustomCategory.trim() || !newItemName.trim()
										: !newCategoryOption.trim() || !newItemName.trim()
								}
								style={{
									padding: '8px 18px',
									border: 'none',
									borderRadius: '6px',
									background:
										(newCategoryOption === 'other'
											? !newCustomCategory.trim() || !newItemName.trim()
											: !newCategoryOption.trim() || !newItemName.trim())
											? COLORS.gray200
											: COLORS.gradientPrimary,
									color:
										(newCategoryOption === 'other'
											? !newCustomCategory.trim() || !newItemName.trim()
											: !newCategoryOption.trim() || !newItemName.trim())
											? COLORS.gray400
											: 'white',
									fontWeight: 600,
									cursor:
										(newCategoryOption === 'other'
											? !newCustomCategory.trim() || !newItemName.trim()
											: !newCategoryOption.trim() || !newItemName.trim())
											? 'not-allowed'
											: 'pointer',
									fontSize: '0.9rem',
									boxShadow:
										(newCategoryOption === 'other'
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
															if (value !== 'other') {
																setEditCustomCategory('');
															}
														}}
														options={DEVICE_SERVICE_ITEM_CATEGORY_OPTIONS}
														placeholder='Select category'
													/>
													{editCategoryOption === 'other' && (
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
											<FormGrid style={{ marginBottom: '8px' }}>
												{editDynamicFields.map((field) => (
													<FormGroup key={String(field.key)} style={{ marginBottom: 0 }}>
														<FormLabel>{field.label}</FormLabel>
														<FormInput
															type={field.type || 'text'}
															value={
																field.key === 'partNumber'
																	? editPartNumber
																	: field.key === 'size'
																		? editSize
																		: field.key === 'manufacturer'
																			? editManufacturer
																			: field.key === 'material'
																				? editMaterial
																				: field.key === 'voltage'
																					? editVoltage
																					: field.key === 'mervRating'
																						? editMervRating
																						: field.key === 'compatibility'
																							? editCompatibility
																							: editReplacementInterval
															}
															onChange={(e) => {
																const value = e.target.value;
																if (field.key === 'partNumber') setEditPartNumber(value);
																if (field.key === 'size') setEditSize(value);
																if (field.key === 'manufacturer') setEditManufacturer(value);
																if (field.key === 'material') setEditMaterial(value);
																if (field.key === 'voltage') setEditVoltage(value);
																if (field.key === 'mervRating') setEditMervRating(value);
																if (field.key === 'compatibility') setEditCompatibility(value);
																if (field.key === 'replacementInterval')
																	setEditReplacementInterval(value);
															}}
															placeholder={field.placeholder}
														/>
													</FormGroup>
												))}
											</FormGrid>
											<FormGroup style={{ marginBottom: '10px' }}>
												<FormLabel>Details</FormLabel>
												<FormTextarea
													value={editDetails}
													onChange={(e) => setEditDetails(e.target.value)}
													placeholder='Size, grade, part number, etc.'
												/>
											</FormGroup>
											<FormGroup style={{ marginBottom: '10px' }}>
												<FormLabel>Notes</FormLabel>
												<FormTextarea
													value={editNotes}
													onChange={(e) => setEditNotes(e.target.value)}
													placeholder='Any extra install/service notes for this item.'
												/>
											</FormGroup>
											<div style={{ display: 'flex', gap: '8px' }}>
												<button
													type='button'
													onClick={handleSaveEdit}
													disabled={
														editCategoryOption === 'other'
															? !editCustomCategory.trim() || !editName.trim()
															: !editCategoryOption.trim() || !editName.trim()
													}
													style={{
														padding: '6px 14px',
														border: 'none',
														borderRadius: '6px',
														background:
															(editCategoryOption === 'other'
																? !editCustomCategory.trim() || !editName.trim()
																: !editCategoryOption.trim() || !editName.trim())
																? COLORS.gray200
																: COLORS.gradientPrimary,
														color:
															(editCategoryOption === 'other'
																? !editCustomCategory.trim() || !editName.trim()
																: !editCategoryOption.trim() || !editName.trim())
																? COLORS.gray400
																: 'white',
														fontWeight: 600,
														cursor:
															(editCategoryOption === 'other'
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
			<BarcodeScannerModal
				isOpen={isDeviceScanOpen}
				title='Appliance Capture Assistant'
				defaultMethod='photo'
				captureIntent='appliance'
				onClose={() => setIsDeviceScanOpen(false)}
				onDetected={handleDeviceBarcodeDetected}
			/>
			<BarcodeScannerModal
				isOpen={isPartScanOpen}
				title='Part Capture Assistant'
				defaultMethod='barcode'
				captureIntent='part'
				onClose={() => setIsPartScanOpen(false)}
				onDetected={handlePartBarcodeDetected}
			/>
		</>
	);
};
