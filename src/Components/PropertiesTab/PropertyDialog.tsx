import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
	ModalOverlay as DialogOverlay,
	ModalContainer as DialogContainer,
	ModalHeader as DialogHeader,
	ModalTitle as DialogTitle,
	ModalCloseButton as CloseButton,
	ModalBody as DialogContent,
	PrimaryButton as SaveButton,
	SecondaryButton,
	SmallButton as AddButton,
} from '../Library';
import {
	FormSection,
	FormRow,
	FormField,
	Label,
	ValidationMessage,
	Input,
	TextArea,
	PhotoPreview,
	PhotoPreviewImage,
	CompactActionRow,
	InlineDisclosureButton,
	CompactCreateRow,
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
	DashboardVisibilityCard,
	DashboardVisibilityText,
	DashboardVisibilityTitle,
	DashboardVisibilityHint,
	DialogSavingCard,
	DialogSavingOverlay,
	DialogSavingSpinner,
	DialogSavingText,
	DialogSavingTitle,
	DialogFooter,
	FooterActionGroup,
	FooterTextAction,
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
	showOnDashboard?: boolean;
	openSetupAfterCreate?: boolean;
}

interface PropertyDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: PropertyFormData) => Promise<void>;
	onDeleteProperty?: () => Promise<void> | void;
	forceSingleFamily?: boolean;
	initialData?: PropertyFormData;
	isDuplicate?: boolean;
	duplicateSourceName?: string;
	duplicateTaskCount?: number;
	duplicateApplianceCount?: number;
	copyTasksOnDuplicate?: boolean;
	copyAppliancesOnDuplicate?: boolean;
	onCopyTasksOnDuplicateChange?: (value: boolean) => void;
	onCopyAppliancesOnDuplicateChange?: (value: boolean) => void;
	groups: Array<{ id: string; name: string }>;
	selectedGroupId?: string | null;
	onCreateGroup?: (name: string) => Promise<string>;
	propertyId?: string;
	isHiddenFromDashboard?: boolean;
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

const buildPropertySlug = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^\w-]/g, '');

const STEPS = [
	{
		key: 'group',
		title: 'Basic Details',
		navTitle: 'Basics',
		hint: 'Name, address, group, and photo',
	},
	{
		key: 'details',
		title: 'Property Profile',
		navTitle: 'Profile',
		hint: 'Type, owner, and notes',
	},
	{
		key: 'sharing',
		title: 'Access & Sharing',
		navTitle: 'Access',
		hint: 'Add people who can access this property',
	},
	{
		key: 'review',
		title: 'Review',
		navTitle: 'Review',
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
	isDuplicate = false,
	duplicateSourceName,
	duplicateTaskCount = 0,
	duplicateApplianceCount = 0,
	copyTasksOnDuplicate = false,
	copyAppliancesOnDuplicate = false,
	onCopyTasksOnDuplicateChange,
	onCopyAppliancesOnDuplicateChange,
	groups,
	selectedGroupId,
	onCreateGroup,
	propertyId,
	isHiddenFromDashboard,
	isSharedProperty,
	onDetachFromProperty,
}) => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isTeamMemberAccount = currentUser?.isTeamMemberAccount === true;
	const teamGroups = useSelector((state: RootState) => state.team.groups);

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
		showOnDashboard: true,
		openSetupAfterCreate: true,
	});
	const [stepIndex, setStepIndex] = useState(0);
	const wizardContentRef = useRef<HTMLDivElement | null>(null);
	// Units are temporarily hidden from the app flow.
	// const [unitInput, setUnitInput] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newGroupName, setNewGroupName] = useState('');
	const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
	const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
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

	const duplicateNameUnchanged =
		isDuplicate &&
		Boolean(duplicateSourceName?.trim()) &&
		formData.name.trim().toLowerCase() ===
		duplicateSourceName!.trim().toLowerCase();
	const propertyNameCreatesSlug = buildPropertySlug(formData.name).length > 0;
	const requiredPropertyBasicsComplete = Boolean(
		formData.name.trim() &&
		propertyNameCreatesSlug &&
		formData.address.trim() &&
		!duplicateNameUnchanged,
	);
	const steps = STEPS;

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		if (initialData) {
			setFormData({
				...initialData,
				propertyType: forceSingleFamily ? 'Single Family' : initialData.propertyType,
				units: [],
				suites: [],
				hasSuites: false,
				isRental: initialData.isRental ?? false,
				groupId: initialData.groupId ?? selectedGroupId ?? null,
				coOwners: initialData.coOwners || [],
				administrators: initialData.administrators || [],
				viewers: initialData.viewers || [],
				showOnDashboard: !isHiddenFromDashboard,
				openSetupAfterCreate: false,
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
				showOnDashboard: true,
				openSetupAfterCreate: true,
			});
		}

		setStepIndex(0);
		// Units are temporarily hidden from the app flow.
		// setUnitInput('');
		setNewGroupName('');
		setIsCreateGroupOpen(false);
		setIsPhotoUploadOpen(false);
		setPendingShares({ coOwners: '', administrators: '', viewers: '' });
		setImageError(null);
		setIsDeleteConfirmOpen(false);
	}, [isOpen, initialData, selectedGroupId, forceSingleFamily, currentUser, isHiddenFromDashboard]);

	useEffect(() => {
		if (!isOpen) return;
		wizardContentRef.current?.scrollTo({
			top: 0,
			left: 0,
			behavior: 'auto',
		});
	}, [isOpen, stepIndex]);

	useEffect(() => {
		let isCancelled = false;

		const loadFamilyMembers = async () => {
			if (
				!isOpen ||
				!currentUser?.accountId ||
				isTeamMemberAccount
			) {
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
	}, [isOpen, currentUser?.accountId, isTeamMemberAccount]);

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
			setIsPhotoUploadOpen(false);
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
		const stepKey = steps[stepIndex]?.key;
		if (stepKey === 'group') {
			return requiredPropertyBasicsComplete;
		}
		if (stepKey === 'details') {
			return true;
		}
		return true;
	}, [
		steps,
		stepIndex,
		requiredPropertyBasicsComplete,
	]);

	const handleNext = () => {
		if (!canContinue) {
			return;
		}
		setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
	};

	const canVisitStep = (index: number) => {
		const basicsStepIndex = steps.findIndex((step) => step.key === 'group');
		return (
			index <= stepIndex ||
			basicsStepIndex === -1 ||
			index <= basicsStepIndex ||
			requiredPropertyBasicsComplete
		);
	};

	const handleBack = () => {
		setStepIndex((prev) => Math.max(prev - 1, 0));
	};

	const handleSave = async () => {
		if (isSubmitting) return;
		if (!requiredPropertyBasicsComplete) {
			const basicsStepIndex = steps.findIndex((step) => step.key === 'group');
			setStepIndex(basicsStepIndex >= 0 ? basicsStepIndex : 0);
			return;
		}
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
		const stepKey = steps[stepIndex]?.key || 'review';

		if (stepKey === 'group') {
			return (
				<WizardPanel>
					<WizardPanelHeader>
						<WizardPanelTitle>Property Basics</WizardPanelTitle>
						<WizardPanelHint>
							Start with the essentials. You can add more details after this.
						</WizardPanelHint>
					</WizardPanelHeader>
					<FormSection>
						<FormRow>
							<FormField>
								<Label>Property Name</Label>
								<Input
									type='text'
									value={formData.name}
									onChange={(e) => handleInputChange('name', e.target.value)}
									placeholder='Enter property name'
									required
								/>
								{!formData.name.trim() && (
									<ValidationMessage>
										Property name is required so Maintley can create a property page.
									</ValidationMessage>
								)}
								{formData.name.trim() && !propertyNameCreatesSlug && (
									<ValidationMessage>
										Use at least one letter or number so Maintley can create a valid property link.
									</ValidationMessage>
								)}
								{duplicateNameUnchanged && (
									<ValidationMessage>
										Choose a new name before creating the duplicate property.
									</ValidationMessage>
								)}
							</FormField>
							<FormField>
								<Label>Address</Label>
								<Input
									type='text'
									value={formData.address}
									onChange={(e) => handleInputChange('address', e.target.value)}
									placeholder='Enter address'
									required
								/>
								{!formData.address.trim() && (
									<ValidationMessage>
										Address is required so the property has enough context across the app.
									</ValidationMessage>
								)}
							</FormField>
						</FormRow>
					</FormSection>

					<FormSection>
						<FormField>
							<Label>Group</Label>
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
						{onCreateGroup && (
							<>
								<InlineDisclosureButton
									type='button'
									onClick={() => setIsCreateGroupOpen((current) => !current)}>
									{isCreateGroupOpen ? 'Cancel new group' : '+ Create New Group'}
								</InlineDisclosureButton>
								{isCreateGroupOpen && (
									<CompactCreateRow>
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
												setIsCreateGroupOpen(false);
												handleInputChange('groupId', id || null);
											}}
											disabled={!newGroupName.trim()}>
											Create
										</AddButton>
									</CompactCreateRow>
								)}
							</>
						)}
					</FormSection>

					<FormSection>
						<FormField>
							<Label>Property Photo (Optional)</Label>
							<CompactActionRow>
								<SecondaryButton
									type='button'
									onClick={() => setIsPhotoUploadOpen((current) => !current)}
									disabled={isUploadingImage}>
									{isPhotoUploadOpen || formData.photo ? 'Change Photo' : 'Upload Photo'}
								</SecondaryButton>
								<SecondaryButton
									type='button'
									onClick={handleUseFallbackPhoto}
									disabled={isUploadingImage}>
									Use Default
								</SecondaryButton>
							</CompactActionRow>
						</FormField>
						{imageError && (
							<ValidationMessage>{imageError}</ValidationMessage>
						)}
						{isPhotoUploadOpen && (
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
						)}
						{formData.photo && (
							<PhotoPreview>
								<PhotoPreviewImage src={formData.photo} alt='Property' />
							</PhotoPreview>
						)}
					</FormSection>
				</WizardPanel>
			);
		}

		if (stepKey === 'details') {
			return (
				<WizardPanel>
					<WizardPanelHeader>
						<WizardPanelTitle>Property Details</WizardPanelTitle>
						<WizardPanelHint>
							The basic information about your property.
						</WizardPanelHint>
					</WizardPanelHeader>

					<FormSection>
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
									{!forceSingleFamily && (
										<option value='Multi-Family'>
											Multi-Family
										</option>
									)}
									{!forceSingleFamily && (
										<option value='Commercial'>
											Commercial
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
						{isDuplicate && (
							<FormField>
								<Label>Duplicate Options</Label>
								<label
									style={{
										display: 'flex',
										alignItems: 'flex-start',
										gap: 8,
										color: duplicateApplianceCount > 0 ? '#475569' : '#94a3b8',
										lineHeight: 1.4,
									}}>
									<input
										type='checkbox'
										checked={
											duplicateApplianceCount > 0 &&
											!!copyAppliancesOnDuplicate
										}
										disabled={duplicateApplianceCount === 0}
										onChange={(e) =>
											onCopyAppliancesOnDuplicateChange?.(e.target.checked)
										}
									/>
									<span>
										Copy appliance records
										{duplicateApplianceCount > 0
											? ` (${duplicateApplianceCount} ${duplicateApplianceCount === 1
												? 'appliance'
												: 'appliances'
											})`
											: ' (no appliances found)'}
									</span>
								</label>
								<label
									style={{
										display: 'flex',
										alignItems: 'flex-start',
										gap: 8,
										color: duplicateTaskCount > 0 ? '#475569' : '#94a3b8',
										lineHeight: 1.4,
									}}>
									<input
										type='checkbox'
										checked={!!copyTasksOnDuplicate}
										disabled={duplicateTaskCount === 0}
										onChange={(e) =>
											onCopyTasksOnDuplicateChange?.(e.target.checked)
										}
									/>
									<span>
										Copy current tasks
										{duplicateTaskCount > 0
											? ` (${duplicateTaskCount} active ${duplicateTaskCount === 1 ? 'task' : 'tasks'
											})`
											: ' (no active tasks found)'}
									</span>
								</label>
								<div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
									Appliances are created as new records on the duplicate property.
									Task schedules and assignments can be copied too; unit links stay
									with the original property.
								</div>
							</FormField>
						)}
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

					{/* Suites are temporarily hidden from the app flow.
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
					*/}

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

		if (stepKey === 'sharing') {
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
				<DashboardVisibilityCard>
					<input
						type='checkbox'
						checked={formData.showOnDashboard ?? true}
						onChange={(event) =>
							handleInputChange('showOnDashboard', event.target.checked)
						}
					/>
					<DashboardVisibilityText>
						<DashboardVisibilityTitle>
							Show this property on the dashboard
						</DashboardVisibilityTitle>
						<DashboardVisibilityHint>
							Keep this on for active properties you want included in dashboard summaries. Turn it off for archived or less-used properties.
						</DashboardVisibilityHint>
					</DashboardVisibilityText>
				</DashboardVisibilityCard>
				{!initialData && !isDuplicate && (
					<DashboardVisibilityCard>
						<input
							type='checkbox'
							checked={formData.openSetupAfterCreate ?? true}
							onChange={(event) =>
								handleInputChange('openSetupAfterCreate', event.target.checked)
							}
						/>
						<DashboardVisibilityText>
							<DashboardVisibilityTitle>
								Open Property Setup Assistant after creating
							</DashboardVisibilityTitle>
							<DashboardVisibilityHint>
								Jump into the property-level assistant next so you can review appliances and maintenance tasks there.
							</DashboardVisibilityHint>
						</DashboardVisibilityText>
					</DashboardVisibilityCard>
				)}
			</WizardPanel>
		);
	};

	if (!isOpen) return null;

	const savingTitle = isDuplicate
		? 'Creating duplicate property...'
		: initialData
			? 'Saving property changes...'
			: 'Creating your property...';
	const savingText =
		!initialData && !isDuplicate && formData.openSetupAfterCreate !== false
			? 'Please wait while we create the property page. Next, we will open the Property Setup Assistant.'
			: 'Please wait while we save this property.';

	return (
		<>
			<DialogOverlay onClick={isSubmitting ? undefined : onClose}>
				<DialogContainer
					onClick={(e) => e.stopPropagation()}
					style={{
						position: 'relative',
						height: 'min(90vh, calc(100dvh - 1.5rem))',
					}}>
					<DialogHeader>
						<div>
							<DialogTitle>
								{isDuplicate
									? 'Duplicate Property'
									: initialData
										? 'Edit Property'
										: 'Add New Property'}
							</DialogTitle>
							<div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
								{isDuplicate
									? 'Start with the existing details, then rename the new property.'
									: 'Add the details of your property to get started.'}
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
								{steps.map((step, index) => (
									<WizardStep
										key={step.title}
										type='button'
										$active={stepIndex === index}
										$complete={stepIndex > index}
										disabled={!canVisitStep(index)}
										onClick={() => {
											if (canVisitStep(index)) {
												setStepIndex(index);
											}
										}}>
										<WizardStepDot $active={stepIndex === index} $complete={stepIndex > index}>
											{stepIndex > index ? '✓' : index + 1}
										</WizardStepDot>
										<WizardStepText $active={stepIndex === index}>
											<WizardStepTitle>{step.navTitle}</WizardStepTitle>
											<WizardStepHint>{step.hint}</WizardStepHint>
										</WizardStepText>
									</WizardStep>
								))}
							</WizardSidebar>
							<WizardContent ref={wizardContentRef}>{renderStepContent()}</WizardContent>
						</WizardShell>
					</DialogContent>

					<DialogFooter>
						<FooterActionGroup>
							{propertyId && onDeleteProperty && (
								<FooterTextAction
									type='button'
									$tone='danger'
									onClick={handleDeletePropertyClick}
									disabled={isDeletingProperty || isSubmitting}>
									{isDeletingProperty ? 'Deleting...' : 'Delete Property'}
								</FooterTextAction>
							)}

							{propertyId && isSharedProperty && onDetachFromProperty && stepIndex === steps.length - 1 && (
								<FooterTextAction
									type='button'
									$tone='warning'
									onClick={onDetachFromProperty}
									disabled={isSubmitting || isDeletingProperty}>
									Detach from Property
								</FooterTextAction>
							)}
						</FooterActionGroup>
						<FooterActionGroup>
							{stepIndex > 0 && (
								<FooterTextAction
									type='button'
									onClick={handleBack}
									disabled={isSubmitting || isDeletingProperty}>
									Back
								</FooterTextAction>
							)}
							{stepIndex < steps.length - 1 ? (
								<SaveButton onClick={handleNext} disabled={!canContinue || isSubmitting || isDeletingProperty}>
									Next
								</SaveButton>
							) : (
								<SaveButton onClick={handleSave} disabled={isSubmitting || isDeletingProperty}>
									{isSubmitting
										? 'Saving...'
										: isDuplicate
											? 'Create Duplicate'
											: 'Save Property'}
								</SaveButton>
							)}
						</FooterActionGroup>
					</DialogFooter>
					{isSubmitting && (
						<DialogSavingOverlay aria-live='polite' aria-busy='true'>
							<DialogSavingCard>
								<DialogSavingSpinner />
								<DialogSavingTitle>{savingTitle}</DialogSavingTitle>
								<DialogSavingText>{savingText}</DialogSavingText>
							</DialogSavingCard>
						</DialogSavingOverlay>
					)}
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
