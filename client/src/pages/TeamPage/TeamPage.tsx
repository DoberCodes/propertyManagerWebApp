import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../Redux/Store/store';
import { canManageTeamMembers } from '../../utils/permissions';
import { filterTeamMembersByRole } from '../../utils/dataFilters';
import {
	addTeamGroup,
	deleteTeamGroup,
	updateTeamGroupName,
	toggleTeamGroupEditName,
	addTeamMember,
	updateTeamMember,
	deleteTeamMember,
	TeamMember,
	TeamGroup,
} from '../../Redux/Slices/teamSlice';
import {
	Wrapper,
	PageHeader,
	PageTitle,
	AddTeamGroupButton,
	TeamGroupSection,
	TeamGroupHeader,
	TeamGroupTitle,
	TeamGroupActions,
	TeamGroupActionButton,
	TeamMembersGrid,
	TeamMemberCard,
	TeamMemberImage,
	TeamMemberImagePlaceholder,
	TeamMemberName,
	TeamMemberTitle,
	AddTeamMemberCard,
	AddIcon,
	AddText,
	DialogOverlay,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogCloseButton,
	DialogBody,
	LeftColumn,
	RightColumn,
	ImageUploadSection,
	ImagePreview,
	ImageUploadInput,
	ImageUploadButton,
	FormGroup,
	FormLabel,
	FormInput,
	FormSelect,
	FormTextarea,
	SectionTitle,
	PropertyMultiSelect,
	PropertyCheckbox,
	QuickTaskHistory,
	TaskHistoryItem,
	FileUploadSection,
	FileUploadButton,
	FileUploadInput,
	FileList,
	FileItem,
	DialogFooter,
	CancelButton,
	SaveButton,
} from './TeamPage.styles';

const MOCK_PROPERTIES = [
	{ id: 1, title: 'Downtown Apartments' },
	{ id: 2, title: 'Business Park' },
	{ id: 3, title: 'Sunset Heights' },
	{ id: 4, title: 'Oak Street Complex' },
];

const ROLE_OPTIONS = [
	{ value: 'property_manager', label: 'Property Manager' },
	{ value: 'assistant_manager', label: 'Assistant Manager' },
	{ value: 'maintenance', label: 'Maintenance' },
	{ value: 'accounting', label: 'Accounting' },
	{ value: 'leasing', label: 'Leasing Agent' },
	{ value: 'admin', label: 'Administrator' },
];

interface FormData {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	role: string;
	address: string;
	notes: string;
	linkedProperties: number[];
}

export default function TeamPage() {
	const dispatch = useDispatch<AppDispatch>();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const teamGroups = useSelector((state: RootState) => state.team.groups);

	// Check if user can manage team members (add/edit/delete)
	// All authenticated users can view the team page, but only managers can edit
	const canManage = currentUser
		? canManageTeamMembers(currentUser.role)
		: false;
	const canView = !!currentUser;

	const [showTeamMemberDialog, setShowTeamMemberDialog] = useState(false);
	const [currentGroupId, setCurrentGroupId] = useState<number | null>(null);
	const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		role: 'property_manager',
		address: '',
		notes: '',
		linkedProperties: [] as number[],
	});
	const [uploadedFiles, setUploadedFiles] = useState<
		Array<{ name: string; id: string }>
	>([]);

	// Filter out tenants from team management - tenants belong to properties, not teams
	const filteredTeamGroups = teamGroups.map((group) => ({
		...group,
		members: group.members.filter((member) => member.role !== 'tenant'),
	}));

	const handleAddTeamMember = (groupId: number) => {
		setCurrentGroupId(groupId);
		setEditingMember(null);
		setFormData({
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			role: 'property_manager',
			address: '',
			notes: '',
			linkedProperties: [],
		});
		setImagePreview(null);
		setUploadedFiles([]);
		setShowTeamMemberDialog(true);
	};

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files) {
			Array.from(files).forEach((file) => {
				setUploadedFiles((prev) => [
					...prev,
					{ name: file.name, id: Math.random().toString() },
				]);
			});
		}
	};

	const handleRemoveFile = (fileId: string) => {
		setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
	};

	const handleFormChange = (field: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handlePropertyToggle = (propertyId: number) => {
		setFormData((prev) => ({
			...prev,
			linkedProperties: prev.linkedProperties.includes(propertyId)
				? prev.linkedProperties.filter((id) => id !== propertyId)
				: [...prev.linkedProperties, propertyId],
		}));
	};

	const handleSaveTeamMember = () => {
		if (!currentGroupId) return;

		const newMember: TeamMember = {
			id:
				editingMember?.id ||
				Math.max(...teamGroups.flatMap((g) => g.members.map((m) => m.id)), 0) +
					1,
			firstName: formData.firstName,
			lastName: formData.lastName,
			title: `${ROLE_OPTIONS.find((r) => r.value === formData.role)?.label || ''}`,
			email: formData.email,
			phone: formData.phone,
			role: formData.role,
			address: formData.address,
			image: imagePreview || editingMember?.image,
			notes: formData.notes,
			linkedProperties: formData.linkedProperties,
			taskHistory: editingMember?.taskHistory || [],
			files: uploadedFiles,
		};

		if (editingMember) {
			dispatch(
				updateTeamMember({
					groupId: currentGroupId,
					member: newMember,
				}),
			);
		} else {
			dispatch(
				addTeamMember({
					groupId: currentGroupId,
					member: newMember,
				}),
			);
		}

		setShowTeamMemberDialog(false);
	};

	const handleEditTeamMember = (member: TeamMember, groupId: number) => {
		setCurrentGroupId(groupId);
		setEditingMember(member);
		setFormData({
			firstName: member.firstName,
			lastName: member.lastName,
			email: member.email,
			phone: member.phone,
			role: member.role,
			address: member.address,
			notes: member.notes,
			linkedProperties: member.linkedProperties,
		});
		setImagePreview(member.image || null);
		setUploadedFiles(member.files);
		setShowTeamMemberDialog(true);
	};

	const handleDeleteTeamMember = (groupId: number, memberId: number) => {
		dispatch(deleteTeamMember({ groupId, memberId }));
	};

	const handleAddTeamGroup = () => {
		dispatch(
			addTeamGroup({
				id: Date.now(),
				name: 'New Team Group',
				linkedProperties: [],
				members: [],
			}),
		);
	};

	const handleEditTeamGroup = (groupId: number) => {
		dispatch(toggleTeamGroupEditName(groupId));
	};

	const handleDeleteTeamGroup = (groupId: number) => {
		dispatch(deleteTeamGroup(groupId));
	};

	const handleTeamGroupNameChange = (groupId: number, newName: string) => {
		dispatch(updateTeamGroupName({ groupId, name: newName }));
	};

	return (
		<Wrapper>
			<PageHeader>
				<PageTitle>Team Management</PageTitle>
				{canManage && (
					<AddTeamGroupButton onClick={handleAddTeamGroup}>
						+ Add Team Group
					</AddTeamGroupButton>
				)}
			</PageHeader>

			<TeamGroupSection>
				{filteredTeamGroups.map((group) => (
					<div key={group.id}>
						<TeamGroupHeader>
							<TeamGroupTitle>{group.name}</TeamGroupTitle>
							{canManage && (
								<TeamGroupActions>
									<TeamGroupActionButton
										title='Edit group'
										onClick={() => handleEditTeamGroup(group.id)}>
										✎
									</TeamGroupActionButton>
									<TeamGroupActionButton
										title='Delete group'
										onClick={() => handleDeleteTeamGroup(group.id)}>
										🗑
									</TeamGroupActionButton>
								</TeamGroupActions>
							)}
						</TeamGroupHeader>

						<TeamMembersGrid>
							{group.members.map((member) => (
								<TeamMemberCard
									key={member.id}
									onClick={() =>
										canManage && handleEditTeamMember(member, group.id)
									}
									style={{
										cursor: canManage ? 'pointer' : 'default',
										opacity: canManage ? 1 : 0.7,
									}}>
									{member.image ? (
										<TeamMemberImage
											src={member.image}
											alt={`${member.firstName} ${member.lastName}`}
										/>
									) : (
										<TeamMemberImagePlaceholder>
											{member.firstName.charAt(0)}
											{member.lastName.charAt(0)}
										</TeamMemberImagePlaceholder>
									)}
									<TeamMemberName>
										{member.firstName} {member.lastName}
									</TeamMemberName>
									<TeamMemberTitle>{member.title}</TeamMemberTitle>
								</TeamMemberCard>
							))}

							{canManage && (
								<AddTeamMemberCard
									onClick={() => handleAddTeamMember(group.id)}>
									<AddIcon>+</AddIcon>
									<AddText>Add Team Member</AddText>
								</AddTeamMemberCard>
							)}
						</TeamMembersGrid>
					</div>
				))}
			</TeamGroupSection>

			{/* Add/Edit Team Member Dialog */}
			{showTeamMemberDialog && (
				<DialogOverlay onClick={() => setShowTeamMemberDialog(false)}>
					<DialogContent onClick={(e) => e.stopPropagation()}>
						<DialogHeader>
							<DialogTitle>
								{editingMember ? 'Edit Team Member' : 'Add Team Member'}
							</DialogTitle>
							<DialogCloseButton onClick={() => setShowTeamMemberDialog(false)}>
								✕
							</DialogCloseButton>
						</DialogHeader>

						<DialogBody>
							<LeftColumn>
								{/* Image Upload */}
								<ImageUploadSection>
									{imagePreview ? (
										<ImagePreview src={imagePreview} alt='Preview' />
									) : (
										<TeamMemberImagePlaceholder>
											{formData.firstName.charAt(0)}
											{formData.lastName.charAt(0) || '?'}
										</TeamMemberImagePlaceholder>
									)}
									<ImageUploadButton htmlFor='image-upload'>
										Upload Photo
									</ImageUploadButton>
									<ImageUploadInput
										id='image-upload'
										type='file'
										accept='image/*'
										onChange={handleImageUpload}
									/>
								</ImageUploadSection>

								{/* Basic Info */}
								<FormGroup>
									<FormLabel>First Name *</FormLabel>
									<FormInput
										type='text'
										placeholder='First name'
										value={formData.firstName}
										onChange={(e) =>
											handleFormChange('firstName', e.target.value)
										}
									/>
								</FormGroup>

								<FormGroup>
									<FormLabel>Last Name *</FormLabel>
									<FormInput
										type='text'
										placeholder='Last name'
										value={formData.lastName}
										onChange={(e) =>
											handleFormChange('lastName', e.target.value)
										}
									/>
								</FormGroup>

								<FormGroup>
									<FormLabel>Email *</FormLabel>
									<FormInput
										type='email'
										placeholder='Email address'
										value={formData.email}
										onChange={(e) => handleFormChange('email', e.target.value)}
									/>
								</FormGroup>

								<FormGroup>
									<FormLabel>Phone Number</FormLabel>
									<FormInput
										type='tel'
										placeholder='Phone number'
										value={formData.phone}
										onChange={(e) => handleFormChange('phone', e.target.value)}
									/>
								</FormGroup>

								<FormGroup>
									<FormLabel>Role *</FormLabel>
									<FormSelect
										value={formData.role}
										onChange={(e) => handleFormChange('role', e.target.value)}>
										{ROLE_OPTIONS.map((role) => (
											<option key={role.value} value={role.value}>
												{role.label}
											</option>
										))}
									</FormSelect>
								</FormGroup>

								<FormGroup>
									<FormLabel>Address</FormLabel>
									<FormInput
										type='text'
										placeholder='Street address'
										value={formData.address}
										onChange={(e) =>
											handleFormChange('address', e.target.value)
										}
									/>
								</FormGroup>
							</LeftColumn>

							<RightColumn>
								{/* Notes */}
								<FormGroup>
									<FormLabel>Notes</FormLabel>
									<FormTextarea
										placeholder='Add any notes about this team member...'
										value={formData.notes}
										onChange={(e) => handleFormChange('notes', e.target.value)}
									/>
								</FormGroup>

								{/* Assigned Properties */}
								<FormGroup>
									<SectionTitle>Assigned Properties</SectionTitle>
									<PropertyMultiSelect>
										{MOCK_PROPERTIES.map((property) => (
											<PropertyCheckbox key={property.id}>
												<input
													type='checkbox'
													id={`property-${property.id}`}
													checked={formData.linkedProperties.includes(
														property.id,
													)}
													onChange={() => handlePropertyToggle(property.id)}
												/>
												<label htmlFor={`property-${property.id}`}>
													{property.title}
												</label>
											</PropertyCheckbox>
										))}
									</PropertyMultiSelect>
								</FormGroup>

								{/* File Upload */}
								<FileUploadSection>
									<SectionTitle>Documents & Files</SectionTitle>
									<FileUploadButton htmlFor='file-upload'>
										+ Upload File
									</FileUploadButton>
									<FileUploadInput
										id='file-upload'
										type='file'
										multiple
										onChange={handleFileUpload}
									/>
									{uploadedFiles.length > 0 && (
										<FileList>
											{uploadedFiles.map((file) => (
												<FileItem key={file.id}>
													<span>{file.name}</span>
													<button onClick={() => handleRemoveFile(file.id)}>
														✕
													</button>
												</FileItem>
											))}
										</FileList>
									)}
								</FileUploadSection>

								{/* Task History */}
								{editingMember && (
									<FormGroup>
										<SectionTitle>Recent Task History</SectionTitle>
										<QuickTaskHistory>
											{editingMember.taskHistory.map((task, idx) => (
												<TaskHistoryItem key={idx}>
													<div>
														<span>{task.task}</span>
													</div>
													<span>{task.date}</span>
												</TaskHistoryItem>
											))}
										</QuickTaskHistory>
									</FormGroup>
								)}
							</RightColumn>
						</DialogBody>

						<DialogFooter>
							<CancelButton onClick={() => setShowTeamMemberDialog(false)}>
								Cancel
							</CancelButton>
							<SaveButton onClick={handleSaveTeamMember}>
								{editingMember ? 'Update Member' : 'Add Member'}
							</SaveButton>
						</DialogFooter>
					</DialogContent>
				</DialogOverlay>
			)}
		</Wrapper>
	);
}
