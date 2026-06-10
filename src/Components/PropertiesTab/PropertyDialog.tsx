import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
	SecondaryButton,
	SmallButton as AddButton,
} from '../Library';
import {
	FormSection,
	FormRow,
	FormField,
	Label,
	Input,
	TextArea,
	PhotoPreview,
	PhotoPreviewImage,
	TagsContainer,
	Tag,
	RemoveTagButton,
	TagInput,
	WizardShell,
	WizardSidebar,
	WizardStep,
	WizardStepDot,
	WizardStepText,
	WizardStepTitle,
	WizardStepHint,
	WizardContent,
	WizardPanel,
	WizardPanelHeader,
	WizardPanelTitle,
	WizardPanelHint,
	SelectField,
	UploadDropzone,
	SharingSection,
	SharingHeader,
	SharingTitleWrap,
	SharingTitle,
	SharingHint,
	ShareControls,
	MemberList,
	MemberCard,
	MemberCardInfo,
	MemberName,
	MemberMeta,
	EmptySharingState,
	ReviewGrid,
	ReviewLabel,
	ReviewValue,
} from './PropertyDialog.styles';
import { FileUploader } from '../Library/FileUploader';
import {
	uploadPropertyImage,
	isValidPropertyImageFile,
} from '../../utils/propertyImageUpload';
import { PROPERTY_IMAGE_PLACEHOLDER } from '../../utils/propertyImagePlaceholder';
import { DeleteConfirmationModal } from '../Library/Modal/DeleteConfirmationModal';
import { RootState } from '../../Redux/store/store';
import { TeamMember } from '../../types/Team.types';
import { User } from '../../Redux/Slices/userSlice';
import { getFamilyMembers } from '../../services/authService';
import { canManageMultiUnit } from '../../utils/subscriptionUtils';
import { LockedFeatureCallout } from '../Library/LockedFeatureCallout';

interface MaintenanceRecord {
	date: string;
	description: string;
}

export interface PropertyFormData {
	photo?: string;
	name: string;
	owner: string;
	address: string;
	propertyType: 'Single Family' | 'Multi-Family' | 'Commercial';
	isRental?: boolean;
	units: string[];
	hasSuites?: boolean;
	suites: string[];
	bedrooms?: number | null;
	bathrooms?: number | null;
	notes: string;
	maintenanceHistory?: MaintenanceRecord[];
	groupId?: string | null;
	coOwners?: string[];
	administrators?: string[];
	viewers?: string[];
}

interface PropertyDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: PropertyFormData) => Promise<void>;
	onDeleteProperty?: () => Promise<void> | void;
	forceSingleFamily?: boolean;
	initialData?: PropertyFormData;
	groups: Array<{ id: string; name: string }>;
	selectedGroupId?: string | null;
	onCreateGroup?: (name: string) => Promise<string>;
	propertyId?: string;
	isHiddenFromDashboard?: boolean;
	onToggleHideFromDashboard?: () => void;
	isSharedProperty?: boolean;
	onDetachFromProperty?: () => void;
}

interface ShareMemberOption {
	id: string;
	displayName: string;
	email: string;
	meta: string;
	source: 'team' | 'family';
}

const STEPS = [
	{
		title: 'Basic Details',
		hint: 'Address, group, and property information',
	},
	{
		title: 'Property Profile',
		hint: 'Additional details about your property',
	},
	{
		title: 'Access & Sharing',
		hint: 'Add people who can access this property',
	},
	{
		title: 'Review',
		hint: 'Confirm and save your property',
	},
] as const;

export const PropertyDialog: React.FC<PropertyDialogProps> = ({
	isOpen,
	onClose,
	onSave,
	onDeleteProperty,
	forceSingleFamily = false,
	initialData,
	groups,
	selectedGroupId,
	onCreateGroup,
	propertyId,
	isHiddenFromDashboard,
	onToggleHideFromDashboard,
	isSharedProperty,
	onDetachFromProperty,
}) => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const teamGroups = useSelector((state: RootState) => state.team.groups);
	const canUseMultiUnitManagement =
		!!currentUser?.subscription && canManageMultiUnit(currentUser.subscription as any);

	const teamMembers = useMemo(
		() => teamGroups.flatMap((group) => group.members || []),
		[teamGroups],
	);

	const [formData, setFormData] = useState<PropertyFormData>({
		name: '',
		owner: '',
		address: '',
		propertyType: 'Single Family',
		isRental: false,
		units: [],
		hasSuites: false,
		suites: [],
		bedrooms: 0,
		bathrooms: 0,
		notes: '',
		maintenanceHistory: [],
		groupId: selectedGroupId ?? null,
		coOwners: [],
		administrators: [],
		viewers: [],
	});
	const [stepIndex, setStepIndex] = useState(0);
	// Units are temporarily hidden from the app flow.
	// const [unitInput, setUnitInput] = useState('');
	const [suiteInput, setSuiteInput] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newGroupName, setNewGroupName] = useState('');
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [imageError, setImageError] = useState<string | null>(null);
	const [isDeletingProperty, setIsDeletingProperty] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [familyMembers, setFamilyMembers] = useState<User[]>([]);
	const [isLoadingFamilyMembers, setIsLoadingFamilyMembers] = useState(false);
	const [pendingShares, setPendingShares] = useState<{
		coOwners: string;
		administrators: string;
		viewers: string;
	}>({
		coOwners: '',
		administrators: '',
		viewers: '',
	});

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		if (initialData) {
			const unitStrings =
				initialData.units && Array.isArray(initialData.units)
					? (initialData.units as any[]).map((unit) =>
							typeof unit === 'string' ? unit : unit.name,
					  )
					: [];
			const suiteStrings =
				initialData.suites && Array.isArray(initialData.suites)
					? (initialData.suites as any[]).map((suite) =>
							typeof suite === 'string' ? suite : suite.name,
					  )
					: [];

			setFormData({
				...initialData,
				propertyType: forceSingleFamily ? 'Single Family' : initialData.propertyType,
				units: unitStrings,
				suites: suiteStrings,
				hasSuites: initialData.hasSuites ?? false,
				isRental: initialData.isRental ?? false,
				groupId: initialData.groupId ?? selectedGroupId ?? null,
				coOwners: initialData.coOwners || [],
				administrators: initialData.administrators || [],
				viewers: initialData.viewers || [],
			});
		} else {
			setFormData({
				name: '',
				owner: currentUser
					? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
					: '',
				address: '',
				propertyType: 'Single Family',
				isRental: false,
				units: [],
				hasSuites: false,
				suites: [],
				bedrooms: 0,
				bathrooms: 0,
				notes: '',
				maintenanceHistory: [],
				groupId: selectedGroupId ?? null,
				coOwners: [],
				administrators: [],
				viewers: [],
			});
		}

		setStepIndex(0);
		// Units are temporarily hidden from the app flow.
		// setUnitInput('');
		setSuiteInput('');
		setNewGroupName('');
		setPendingShares({ coOwners: '', administrators: '', viewers: '' });
		setImageError(null);
		setIsDeleteConfirmOpen(false);
	}, [isOpen, initialData, selectedGroupId, forceSingleFamily, currentUser]);

	useEffect(() => {
		let isCancelled = false;

		const loadFamilyMembers = async () => {
			if (!isOpen || !currentUser?.accountId) {
				if (!isCancelled) {
					setFamilyMembers([]);
					setIsLoadingFamilyMembers(false);
				}
				return;
			}

			setIsLoadingFamilyMembers(true);
			try {
				const members = await getFamilyMembers(currentUser.accountId);
				if (!isCancelled) {
					setFamilyMembers(members);
				}
			} catch (error) {
				console.error('Error loading family members:', error);
				if (!isCancelled) {
					setFamilyMembers([]);
				}
			} finally {
				if (!isCancelled) {
					setIsLoadingFamilyMembers(false);
				}
			}
		};

		loadFamilyMembers();

		return () => {
			isCancelled = true;
		};
	}, [isOpen, currentUser?.accountId]);

	const availableMembers = useMemo<ShareMemberOption[]>(() => {
		const allMembers: ShareMemberOption[] = [];
		const seen = new Set<string>();

		teamMembers.forEach((member: TeamMember) => {
			if (!member?.id || member.id === currentUser?.id) {
				return;
			}
			if (seen.has(member.id)) {
				return;
			}
			seen.add(member.id);
			allMembers.push({
				id: member.id,
				displayName: `${member.firstName} ${member.lastName}`.trim() || member.email,
				email: member.email,
				meta: member.title || member.role || 'Team member',
				source: 'team',
			});
		});

		familyMembers.forEach((member: User) => {
			if (!member?.id || member.id === currentUser?.id) {
				return;
			}
			if (seen.has(member.id)) {
				return;
			}
			seen.add(member.id);
			allMembers.push({
				id: member.id,
				displayName:
					`${member.firstName || ''} ${member.lastName || ''}`.trim() ||
					member.email,
				email: member.email,
				meta: member.role || 'Family member',
				source: 'family',
			});
		});

		return allMembers.sort((left, right) =>
			left.displayName.localeCompare(right.displayName),
		);
	}, [teamMembers, familyMembers, currentUser?.id]);

	const availableMemberMap = useMemo(
		() => new Map(availableMembers.map((member) => [member.id, member])),
		[availableMembers],
	);

	const handleInputChange = (field: keyof PropertyFormData, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	// Units are temporarily hidden from the app flow.
	// const handleAddUnit = () => {
	// 	if (!unitInput.trim()) return;
	// 	setFormData((prev) => ({
	// 		...prev,
	// 		units: [...prev.units, unitInput.trim()],
	// 	}));
	// 	setUnitInput('');
	// };

	// const handleRemoveUnit = (index: number) => {
	// 	setFormData((prev) => ({
	// 		...prev,
	// 		units: prev.units.filter((_, unitIndex) => unitIndex !== index),
	// 	}));
	// };

	const handleAddSuite = () => {
		if (!suiteInput.trim()) return;
		setFormData((prev) => ({
			...prev,
			suites: [...prev.suites, suiteInput.trim()],
		}));
		setSuiteInput('');
	};

	const handleRemoveSuite = (index: number) => {
		setFormData((prev) => ({
			...prev,
			suites: prev.suites.filter((_, suiteIndex) => suiteIndex !== index),
		}));
	};

	const handlePhotoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		handleInputChange('photo', e.target.value || undefined);
		setImageError(null);
	};

	const handleUseFallbackPhoto = () => {
		handleInputChange('photo', PROPERTY_IMAGE_PLACEHOLDER);
		setImageError(null);
	};

	const handlePhotoUpload = async (file: File | null) => {
		if (!file) return;
		if (!isValidPropertyImageFile(file)) {
			setImageError('Invalid file. Please upload an image under 8MB.');
			return;
		}

		setImageError(null);
		setIsUploadingImage(true);
		try {
			const imageUrl = await uploadPropertyImage(file);
			handleInputChange('photo', imageUrl);
		} catch (error) {
			setImageError(
				error instanceof Error ? error.message : 'Failed to upload image',
			);
		} finally {
			setIsUploadingImage(false);
		}
	};

	const addShareMember = (
		field: 'coOwners' | 'administrators' | 'viewers',
		memberId: string,
	) => {
		if (!memberId) return;

		setFormData((prev) => {
			const nextCoOwners = prev.coOwners?.filter((id) => id !== memberId) || [];
			const nextAdministrators =
				prev.administrators?.filter((id) => id !== memberId) || [];
			const nextViewers = prev.viewers?.filter((id) => id !== memberId) || [];

			return {
				...prev,
				coOwners:
					field === 'coOwners' ? [...nextCoOwners, memberId] : nextCoOwners,
				administrators:
					field === 'administrators'
						? [...nextAdministrators, memberId]
						: nextAdministrators,
				viewers: field === 'viewers' ? [...nextViewers, memberId] : nextViewers,
			};
		});

		setPendingShares((prev) => ({ ...prev, [field]: '' }));
	};

	const removeShareMember = (
		field: 'coOwners' | 'administrators' | 'viewers',
		memberId: string,
	) => {
		setFormData((prev) => ({
			...prev,
			[field]: (prev[field] || []).filter((id) => id !== memberId),
		}));
	};

	const canContinue = useMemo(() => {
		if (stepIndex === 0) {
			return true;
		}
		if (stepIndex === 1) {
			return Boolean(formData.name.trim() && formData.address.trim());
		}
		return true;
	}, [stepIndex, formData.name, formData.address]);

	const handleNext = () => {
		if (!canContinue) {
			return;
		}
		setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
	};

	const handleBack = () => {
		setStepIndex((prev) => Math.max(prev - 1, 0));
	};

	const handleSave = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		try {
			await onSave({
				...formData,
				propertyType: forceSingleFamily ? 'Single Family' : formData.propertyType,
			});
			onClose();
		} catch (error) {
			console.error('Error saving property:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeletePropertyClick = async () => {
		if (!onDeleteProperty || isDeletingProperty || isSubmitting) return;
		setIsDeleteConfirmOpen(true);
	};

	const handleConfirmDeleteProperty = async () => {
		if (!onDeleteProperty || isDeletingProperty || isSubmitting) return;
		setIsDeletingProperty(true);
		try {
			await onDeleteProperty();
			setIsDeleteConfirmOpen(false);
		} catch (error) {
			console.error('Error deleting property:', error);
		} finally {
			setIsDeletingProperty(false);
		}
	};

	const getShareMembers = (ids: string[] = []) =>
		ids
			.map((id) => availableMemberMap.get(id))
			.filter(Boolean) as ShareMemberOption[];

	const renderShareSection = (
		field: 'coOwners' | 'administrators' | 'viewers',
		title: string,
		hint: string,
		buttonLabel: string,
	) => {
		const selectedIds = formData[field] || [];
		const selectedMembers = getShareMembers(selectedIds);
		const availableOptions = availableMembers.filter(
			(member) => !selectedIds.includes(member.id),
		);

		return (
			<SharingSection>
				<SharingHeader>
					<SharingTitleWrap>
						<SharingTitle>{title}</SharingTitle>
						<SharingHint>{hint}</SharingHint>
					</SharingTitleWrap>
				</SharingHeader>
				<ShareControls>
					<SelectField
						value={pendingShares[field]}
						onChange={(e) =>
							setPendingShares((prev) => ({
								...prev,
								[field]: e.target.value,
							}))
						}>
						<option value=''>Select member</option>
						{availableOptions.map((member) => (
							<option key={`${field}-${member.id}`} value={member.id}>
								{member.displayName} ({member.email})
							</option>
						))}
					</SelectField>
					<AddButton
						onClick={() => addShareMember(field, pendingShares[field])}
						disabled={!pendingShares[field]}>
						{buttonLabel}
					</AddButton>
				</ShareControls>
				<MemberList>
					{selectedMembers.length > 0 ? (
						selectedMembers.map((member) => (
							<MemberCard key={`${field}-${member.id}`}>
								<MemberCardInfo>
									<MemberName>{member.displayName}</MemberName>
									<MemberMeta>
										{member.email} • {member.meta}
									</MemberMeta>
								</MemberCardInfo>
								<SecondaryButton onClick={() => removeShareMember(field, member.id)}>
									Remove
								</SecondaryButton>
							</MemberCard>
						))
					) : (
						<EmptySharingState>
							No one added yet. Only existing team or family members in the system can be assigned here.
						</EmptySharingState>
					)}
				</MemberList>
			</SharingSection>
		);
	};

	const renderStepContent = () => {
		if (stepIndex === 0) {
			return (
				<WizardPanel>
					<WizardPanelHeader>
						<WizardPanelTitle>Assign to Group</WizardPanelTitle>
						<WizardPanelHint>
							Organize your property by assigning it to an existing group or creating a new one.
						</WizardPanelHint>
					</WizardPanelHeader>
					<FormSection>
						<FormRow>
							<FormField>
								<Label>Select existing group</Label>
								<SelectField
									value={formData.groupId ?? ''}
									onChange={(e) => handleInputChange('groupId', e.target.value || null)}>
									<option value=''>No group</option>
									{groups.map((group) => (
										<option key={group.id} value={group.id}>
											{group.name}
										</option>
									))}
								</SelectField>
							</FormField>
							<FormField>
								<Label>Create new group</Label>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
									<Input
										value={newGroupName}
										onChange={(e) => setNewGroupName(e.target.value)}
										placeholder='New group name'
									/>
									<AddButton
										onClick={async () => {
											if (!onCreateGroup || !newGroupName.trim()) return;
											const id = await onCreateGroup(newGroupName.trim());
											setNewGroupName('');
											handleInputChange('groupId', id || null);
										}}
										disabled={!newGroupName.trim()}>
										Create
									</AddButton>
								</div>
							</FormField>
						</FormRow>
					</FormSection>

					<FormSection>
						<WizardPanelHeader>
							<WizardPanelTitle>Property Photo</WizardPanelTitle>
							<WizardPanelHint>
								Add a photo to easily identify your property.
							</WizardPanelHint>
						</WizardPanelHeader>
						{imageError && (
							<div style={{ color: '#dc2626', fontSize: 13 }}>{imageError}</div>
						)}
						<FormField>
							<Label>Photo URL</Label>
							<Input
								type='text'
								value={formData.photo || ''}
								onChange={handlePhotoUrlChange}
								placeholder='Enter image URL or upload a file below'
								disabled={isUploadingImage}
							/>
							<div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
								Default fallback image: {PROPERTY_IMAGE_PLACEHOLDER}
								<div style={{ marginTop: 6 }}>
									<SecondaryButton
										type='button'
										onClick={handleUseFallbackPhoto}
										disabled={isUploadingImage}>
										Use Default House Image
									</SecondaryButton>
								</div>
							</div>
						</FormField>
						<UploadDropzone>
							{isUploadingImage ? (
								<div style={{ padding: 12, textAlign: 'center', color: '#64748b' }}>
									Processing image...
								</div>
							) : (
								<FileUploader
									label='Upload Image File'
									helperText='JPG, PNG, GIF, WEBP (max 8MB)'
									accept='image/*'
									allowedTypes={['image/*']}
									maxSizeBytes={8 * 1024 * 1024}
									setFile={handlePhotoUpload}
									showSelectedFiles={false}
								/>
							)}
						</UploadDropzone>
						{formData.photo && (
							<PhotoPreview>
								<PhotoPreviewImage src={formData.photo} alt='Property' />
							</PhotoPreview>
						)}
					</FormSection>
				</WizardPanel>
			);
		}

		if (stepIndex === 1) {
			return (
				<WizardPanel>
					<WizardPanelHeader>
						<WizardPanelTitle>Property Details</WizardPanelTitle>
						<WizardPanelHint>
							The basic information about your property.
						</WizardPanelHint>
					</WizardPanelHeader>

					<FormSection>
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
								<SelectField
									value={formData.propertyType}
									disabled={forceSingleFamily}
									onChange={(e) =>
										handleInputChange(
											'propertyType',
											e.target.value as PropertyFormData['propertyType'],
										)
									}>
									<option value='Single Family'>Single Family</option>
									{/* Units are temporarily hidden from the app flow.
									{!forceSingleFamily && (
										<option value='Multi-Family' disabled={!canUseMultiUnitManagement}>
											Multi-Family{canUseMultiUnitManagement ? '' : ' (Portfolio)'}
										</option>
									)}
									*/}
									{!forceSingleFamily && (
										<option value='Commercial' disabled={!canUseMultiUnitManagement}>
											Commercial{canUseMultiUnitManagement ? '' : ' (Portfolio)'}
										</option>
									)}
								</SelectField>
							</FormField>
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
						{!forceSingleFamily && !canUseMultiUnitManagement && (
							<LockedFeatureCallout
								title='Portfolio property management is locked on your current plan'
								description='Create and manage Commercial properties by upgrading to the Portfolio plan.'
								upgradeLabel='Upgrade for Portfolio'
								compact
							/>
						)}
						{formData.propertyType !== 'Commercial' && (
							<FormRow>
								<FormField>
									<Label>Bedrooms</Label>
									<Input
										type='number'
										value={formData.bedrooms ?? ''}
										onChange={(e) =>
											handleInputChange(
												'bedrooms',
												e.target.value === '' ? null : parseInt(e.target.value, 10),
											)
										}
									/>
								</FormField>
								<FormField>
									<Label>Bathrooms</Label>
									<Input
										type='number'
										step='0.5'
										value={formData.bathrooms ?? ''}
										onChange={(e) =>
											handleInputChange(
												'bathrooms',
												e.target.value === '' ? null : parseFloat(e.target.value),
											)
										}
									/>
								</FormField>
							</FormRow>
						)}
						<FormField>
							<Label>Rental Settings</Label>
							<label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
								<input
									type='checkbox'
									checked={!!formData.isRental}
									onChange={(e) => handleInputChange('isRental', e.target.checked)}
								/>
								Yes, this property is a rental
							</label>
						</FormField>
					</FormSection>

						{/* Units are temporarily hidden from the app flow.
						{formData.propertyType === 'Multi-Family' && (
							<FormSection>
								<Label>Units</Label>
								<TagsContainer>
								{formData.units.map((unit, index) => (
									<Tag key={`${unit}-${index}`}>
										{unit}
										<RemoveTagButton onClick={() => handleRemoveUnit(index)}>×</RemoveTagButton>
									</Tag>
								))}
							</TagsContainer>
							<TagInput>
								<Input
									type='text'
									value={unitInput}
									disabled={!canUseMultiUnitManagement}
									onChange={(e) => setUnitInput(e.target.value)}
									placeholder='Add unit name'
								/>
								<AddButton onClick={handleAddUnit} disabled={!canUseMultiUnitManagement}>
									Add Unit
								</AddButton>
								</TagInput>
							</FormSection>
						)}
						*/}

					{formData.propertyType === 'Commercial' && (
						<FormSection>
							<Label>Suites</Label>
							<label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
								<input
									type='checkbox'
									checked={!!formData.hasSuites}
									disabled={!canUseMultiUnitManagement}
									onChange={(e) => handleInputChange('hasSuites', e.target.checked)}
								/>
								Enable suite-level management
							</label>
							{formData.hasSuites && (
								<>
									<TagsContainer>
										{formData.suites.map((suite, index) => (
											<Tag key={`${suite}-${index}`}>
												{suite}
												<RemoveTagButton onClick={() => handleRemoveSuite(index)}>×</RemoveTagButton>
											</Tag>
										))}
									</TagsContainer>
									<TagInput>
										<Input
											type='text'
											value={suiteInput}
											disabled={!canUseMultiUnitManagement}
											onChange={(e) => setSuiteInput(e.target.value)}
											placeholder='Add suite name'
										/>
										<AddButton onClick={handleAddSuite} disabled={!canUseMultiUnitManagement}>
											Add Suite
										</AddButton>
									</TagInput>
								</>
							)}
						</FormSection>
					)}

					<FormSection>
						<Label>Notes</Label>
						<TextArea
							value={formData.notes}
							onChange={(e) => handleInputChange('notes', e.target.value)}
							placeholder='Add any notes about this property...'
						/>
					</FormSection>
				</WizardPanel>
			);
		}

		if (stepIndex === 2) {
			return (
				<WizardPanel>
					<WizardPanelHeader>
						<WizardPanelTitle>Access & Sharing</WizardPanelTitle>
						<WizardPanelHint>
							Add people already in your system. Team members and family members are available here; arbitrary email entry is intentionally disabled.
						</WizardPanelHint>
					</WizardPanelHeader>
					{isLoadingFamilyMembers && (
						<div style={{ fontSize: 12, color: '#64748b' }}>Loading family members...</div>
					)}
					{availableMembers.length === 0 && !isLoadingFamilyMembers && (
						<EmptySharingState>
							No eligible members were found in your account yet. Add team or family members first if you want to share this property.
						</EmptySharingState>
					)}
					{renderShareSection(
						'coOwners',
						'Co-Owners',
						'Co-owners can view and manage the property details.',
						'Add Co-Owner',
					)}
					{renderShareSection(
						'administrators',
						'Administrators',
						'Administrators have full access to manage this property.',
						'Add Administrator',
					)}
					{renderShareSection(
						'viewers',
						'Viewers',
						'Viewers can see the property details but cannot make changes.',
						'Add Viewer',
					)}
				</WizardPanel>
			);
		}

		const reviewRows: Array<[string, React.ReactNode]> = [
			['Group', groups.find((group) => group.id === formData.groupId)?.name || 'No group'],
			['Property Photo', formData.photo ? <img src={formData.photo} alt='Property preview' /> : 'No photo'],
			['Property Name', formData.name || 'Not set'],
			['Address', formData.address || 'Not set'],
			['Property Type', formData.propertyType],
			['Owner', formData.owner || 'Not set'],
			['Bedrooms / Bathrooms', `${formData.bedrooms ?? 0} / ${formData.bathrooms ?? 0}`],
			['Rental Property', formData.isRental ? 'Yes' : 'No'],
			[
				'Co-Owners',
				getShareMembers(formData.coOwners).map((member) => member.displayName).join(', ') || 'None',
			],
			[
				'Administrators',
				getShareMembers(formData.administrators).map((member) => member.displayName).join(', ') || 'None',
			],
			[
				'Viewers',
				getShareMembers(formData.viewers).map((member) => member.displayName).join(', ') || 'None',
			],
		];

		return (
			<WizardPanel>
				<WizardPanelHeader>
					<WizardPanelTitle>Review Your Property</WizardPanelTitle>
					<WizardPanelHint>
						Please review the information below before saving.
					</WizardPanelHint>
				</WizardPanelHeader>
				<ReviewGrid>
					{reviewRows.map(([label, value]) => (
						<React.Fragment key={label}>
							<ReviewLabel>{label}</ReviewLabel>
							<ReviewValue>{value}</ReviewValue>
						</React.Fragment>
					))}
				</ReviewGrid>
			</WizardPanel>
		);
	};

	if (!isOpen) return null;

	return (
		<>
			<DialogOverlay onClick={onClose}>
				<DialogContainer onClick={(e) => e.stopPropagation()}>
					<DialogHeader>
						<div>
							<DialogTitle>{initialData ? 'Edit Property' : 'Add New Property'}</DialogTitle>
							<div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
								Add the details of your property to get started.
							</div>
						</div>
						<CloseButton onClick={onClose}>×</CloseButton>
					</DialogHeader>

					<DialogContent
						style={{
							padding: 0,
							display: 'flex',
							flex: 1,
							height: '100%',
							minHeight: 0,
							overflow: 'hidden',
						}}>
						<WizardShell>
							<WizardSidebar>
								{STEPS.map((step, index) => (
									<WizardStep
										key={step.title}
										type='button'
										$active={stepIndex === index}
										$complete={stepIndex > index}
										onClick={() => setStepIndex(index)}>
										<WizardStepDot $active={stepIndex === index} $complete={stepIndex > index}>
											{stepIndex > index ? '✓' : index + 1}
										</WizardStepDot>
										<WizardStepText>
											<WizardStepTitle>{step.title}</WizardStepTitle>
											<WizardStepHint>{step.hint}</WizardStepHint>
										</WizardStepText>
									</WizardStep>
								))}
							</WizardSidebar>
							<WizardContent>{renderStepContent()}</WizardContent>
						</WizardShell>
					</DialogContent>

					<DialogFooter
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							gap: '10px',
						}}>
						<div style={{ display: 'flex', gap: '10px' }}>
							{propertyId && onDeleteProperty && (
								<SecondaryButton
									onClick={handleDeletePropertyClick}
									disabled={isDeletingProperty || isSubmitting}
									style={{
										backgroundColor: '#ef4444',
										borderColor: '#ef4444',
										color: 'white',
									}}>
									{isDeletingProperty ? 'Deleting...' : 'Delete Property'}
								</SecondaryButton>
							)}
							{propertyId && onToggleHideFromDashboard && stepIndex === STEPS.length - 1 && (
								<SecondaryButton onClick={onToggleHideFromDashboard}>
									{isHiddenFromDashboard ? 'Show on Dashboard' : 'Hide from Dashboard'}
								</SecondaryButton>
							)}
							{propertyId && isSharedProperty && onDetachFromProperty && stepIndex === STEPS.length - 1 && (
								<SecondaryButton
									onClick={onDetachFromProperty}
									style={{
										backgroundColor: '#f59e0b',
										borderColor: '#f59e0b',
										color: 'white',
									}}>
									Detach from Property
								</SecondaryButton>
							)}
						</div>
						<div style={{ display: 'flex', gap: '10px' }}>
							<CancelButton onClick={onClose} disabled={isSubmitting || isDeletingProperty}>
								Cancel
							</CancelButton>
							{stepIndex > 0 && (
								<CancelButton onClick={handleBack} disabled={isSubmitting || isDeletingProperty}>
									Back
								</CancelButton>
							)}
							{stepIndex < STEPS.length - 1 ? (
								<SaveButton onClick={handleNext} disabled={!canContinue || isSubmitting || isDeletingProperty}>
									Next
								</SaveButton>
							) : (
								<SaveButton onClick={handleSave} disabled={isSubmitting || isDeletingProperty}>
									{isSubmitting ? 'Saving...' : 'Save Property'}
								</SaveButton>
							)}
						</div>
					</DialogFooter>
				</DialogContainer>
			</DialogOverlay>

			<DeleteConfirmationModal
				isOpen={isDeleteConfirmOpen}
				itemName={formData.name || initialData?.name || 'this property'}
				itemType='property'
				onConfirm={handleConfirmDeleteProperty}
				onCancel={() => setIsDeleteConfirmOpen(false)}
				isLoading={isDeletingProperty}
			/>
		</>
	);
};
