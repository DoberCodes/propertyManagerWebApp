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
	ModalTab,
	ModalTabContainer,
	ModalTabContent,
} from './ModalStyles';
import { COLORS } from '../../../constants/colors';
import {
	Property,
	PropertyDocumentCategory,
} from '../../../types/Property.types';
import { parseDeviceBarcodePayload } from '../../../utils/barcodeScanParser';
import { BarcodeScannerModal } from '../BarcodeScanner/BarcodeScannerModal';
import { useGetDevicesQuery } from '../../../Redux/API/deviceSlice';
import { useGetPropertySpacesQuery } from '../../../Redux/API/spaceSlice';
import { ApplianceDocumentsPanel } from '../../ApplianceDocumentsPanel/ApplianceDocumentsPanel';
import {
	EquipmentSuppliesReview,
	type PendingEquipmentSupplyDraft,
} from '../../EquipmentSuppliesReview/EquipmentSuppliesReview';
import type { PropertySupply } from '../../../types/Supply.types';
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
	selectedSpaceIds?: string[];
	onSelectedSpaceIdsChange?: (spaceIds: string[]) => void;
	canManageSpaces?: boolean;
	propertySupplies?: PropertySupply[];
	selectedSupplyIds?: string[];
	onSelectedSupplyIdsChange?: (supplyIds: string[]) => void;
	pendingSupplies?: PendingEquipmentSupplyDraft[];
	onPendingSuppliesChange?: (supplies: PendingEquipmentSupplyDraft[]) => void;
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

const SpacePicker = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 0.5rem;
	margin-top: 0.5rem;
`;

const SpaceOption = styled.label<{ $selected: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.55rem;
	min-height: 42px;
	padding: 0.65rem 0.75rem;
	border: 1px solid
		${(props) => (props.$selected ? COLORS.primary : COLORS.gray200)};
	border-radius: 8px;
	background: ${(props) => (props.$selected ? COLORS.primaryLight : COLORS.white)};
	color: ${COLORS.textPrimary};
	font-size: 0.86rem;
	font-weight: 600;
	cursor: pointer;

	input {
		accent-color: ${COLORS.primary};
	}
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
	const [activeTab, setActiveTab] = useState<'details' | 'supplies'>(
		'details',
	);
	const scrollBodyRef = useRef<HTMLDivElement | null>(null);
	const { data: propertyDevices = [] } = useGetDevicesQuery(props.property.id || '', {
		skip: !props.property?.id,
	});

	const normalizeIdentifier = (value?: string) =>
		String(value || '')
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '');

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
	const detailsError = submitAttempted && missingRequiredFields.length > 0;

	const emitChange = (name: string, value: any) => {
		props.onFormChange({
			target: { name, value },
			currentTarget: { name, value },
		} as any);
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
				? `${parsed.specNotes} | Matched existing equipment: ${matchingDevice.type || 'Equipment'} ${matchingDevice.brand || ''} ${matchingDevice.model || ''}`.trim()
				: parsed.specNotes;
			emitChange('specNotes', enrichedNotes);
		}
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
	const selectedPropertyId =
		props.deviceFormData.location?.propertyId || props.property.id || '';
	const selectedProperty =
		props.availableProperties?.find(
			(candidate) => String(candidate.id) === String(selectedPropertyId),
		) || props.property;
	const selectedAccountId = String(
		selectedProperty.accountId || selectedProperty.userId || '',
	).trim();
	const { data: availableSpaces = [] } = useGetPropertySpacesQuery(
		{
			accountId: selectedAccountId,
			propertyId: String(selectedPropertyId),
			includeArchived: true,
		},
		{
			skip:
				!props.isOpen ||
				!props.canManageSpaces ||
				!selectedAccountId ||
				!selectedPropertyId,
		},
	);
	const selectedSpaceIds = props.selectedSpaceIds || [];
	const toggleSpace = (spaceId: string) => {
		if (!props.onSelectedSpaceIdsChange) return;
		props.onSelectedSpaceIdsChange(
			selectedSpaceIds.includes(spaceId)
				? selectedSpaceIds.filter((candidate) => candidate !== spaceId)
				: [...selectedSpaceIds, spaceId],
		);
	};

	return (
		<>
			<GenericModal
				isOpen={props.isOpen}
				onClose={props.onClose}
				title={props.isEditing ? 'Edit Equipment' : 'Add Equipment'}
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
				primaryButtonLabel={props.isEditing ? 'Save Equipment' : 'Add Equipment'}
				secondaryButtonLabel='Cancel'
				primaryButtonDisabled={missingRequiredFields.length > 0}>
				<StickyTabRail>
					<ModalTabContainer>
						<ModalTab
							type='button'
							$active={activeTab === 'details'}
							onClick={() => setActiveTab('details')}>
							<TabLabel>Equipment Details</TabLabel>
						</ModalTab>
						<ModalTab
							type='button'
							$active={activeTab === 'supplies'}
							onClick={() => setActiveTab('supplies')}>
							<TabLabel>Supplies</TabLabel>
						</ModalTab>
					</ModalTabContainer>
				</StickyTabRail>
				<ScrollBody ref={scrollBodyRef}>
					<ModalTabContent $active={activeTab === 'details'}>
						<SummaryBanner>
							<SummaryTitle>Capture the equipment basics, review its Spaces, Documents, and property Supplies, then save everything together.</SummaryTitle>
							<SummaryMeta>
								<SummaryPill $tone={missingRequiredFields.length === 0 ? 'success' : 'neutral'}>
									{completedBasics}/1 required item complete
								</SummaryPill>
							</SummaryMeta>
							<RequiredList>
								{missingRequiredFields.length > 0
									? `Still needed: ${missingRequiredFields.join(', ')}`
									: 'The required name is set. Add more details now, or save and come back later.'}
							</RequiredList>
						</SummaryBanner>

						<SectionHeader>
							<SectionTitle>Core Equipment Details</SectionTitle>
							<SectionDescription>
								Choose the asset type now. Variant, brand, model, lifecycle dates,
								and parts can be filled in whenever they are known.
							</SectionDescription>
						</SectionHeader>
						<div style={{ marginBottom: '12px' }}>
							<ScanButton type='button' onClick={() => setIsDeviceScanOpen(true)}>
								Capture Equipment Label
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
									Setting this date marks the equipment as decommissioned.
								</FieldHint>
							</FormGroup>
							{(props.deviceFormData.files || []).length > 0 && (
							<FormGroupFull>
								<AttachmentSection>
									<SectionTitle style={{ fontSize: '0.92rem' }}>
										Existing Files
									</SectionTitle>
									<SectionDescription>
										These older files are saved directly on this equipment. New uploads should use Equipment Documents below.
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
									New uploads should use Equipment Documents below.
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

						{props.canManageSpaces && (
							<FormGroupFull>
								<FormLabel>Spaces</FormLabel>
								{availableSpaces.length > 0 ? (
									<>
										<FieldHint>
											Choose every place where this equipment is located.
										</FieldHint>
										<SpacePicker>
											{availableSpaces
												.filter(
													(space) =>
														!space.isArchived || selectedSpaceIds.includes(space.id),
												)
												.map((space) => {
												const selected = selectedSpaceIds.includes(space.id);
												return (
													<SpaceOption key={space.id} $selected={selected}>
														<input
															type='checkbox'
															checked={selected}
															onChange={() => toggleSpace(space.id)}
														/>
														<span>
															{space.name}
															{space.isArchived ? ' (Archived)' : ''}
														</span>
													</SpaceOption>
												);
											})}
										</SpacePicker>
									</>
								) : (
									<FieldHint>
										Add Spaces in Property Details when a location would make this
										equipment easier to find.
									</FieldHint>
								)}
							</FormGroupFull>
						)}
					</ModalTabContent>
					<ModalTabContent $active={activeTab === 'supplies'}>
						<EquipmentSuppliesReview
							key={`${props.deviceId || 'new'}-${props.isOpen ? 'open' : 'closed'}`}
							supplies={props.propertySupplies || []}
							selectedSupplyIds={props.selectedSupplyIds || []}
							onSelectedSupplyIdsChange={
								props.onSelectedSupplyIdsChange || (() => undefined)
							}
							pendingSupplies={props.pendingSupplies || []}
							onPendingSuppliesChange={
								props.onPendingSuppliesChange || (() => undefined)
							}
						/>
					</ModalTabContent>


				</ScrollBody>
			</GenericModal>
			<BarcodeScannerModal
				isOpen={isDeviceScanOpen}
				title='Equipment Capture Assistant'
				defaultMethod='photo'
				captureIntent='appliance'
				onClose={() => setIsDeviceScanOpen(false)}
				onDetected={handleDeviceBarcodeDetected}
			/>
		</>
	);
};
