import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PropertyDialog } from './PropertyDialog';
import { useRecentlyViewed } from '../../Hooks/useRecentlyViewed';
import { useFavorites } from '../../Hooks/useFavorites';
import { RootState, AppDispatch } from '../../Redux/Store/store';
import {
	addGroup,
	deleteGroup,
	updateGroupName,
	toggleGroupEditName,
	addPropertyToGroup,
	updateProperty,
	deleteProperty,
	Unit,
	Suite,
	Property as PropertyModel,
	PropertyGroup as PropertyGroupModel,
} from '../../Redux/Slices/propertyDataSlice';
import { canManageProperties } from '../../utils/permissions';
import { filterPropertyGroupsByRole } from '../../utils/dataFilters';
import {
	Wrapper,
	PageHeader,
	PageTitle,
	TopActions,
	GroupsContainer,
	GroupSection,
	GroupHeader,
	GroupName,
	GroupNameInput,
	HeaderRight,
	AddPropertyButton,
	AddGroupButton,
	PropertiesGrid,
	PropertyTile,
	PropertyImage,
	PropertyOverlay,
	PropertyTitle,
	DropdownMenu,
	DropdownItem,
	DropdownToggle,
	FavoriteStar,
	GroupActions,
	GroupActionButton,
} from './PropertiesTab.styles';

export const Properties = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const groups = useSelector((state: RootState) => state.propertyData.groups);
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const teamMembers = useSelector((state: RootState) =>
		state.team.groups.flatMap((group) => group.members),
	);
	const { addRecentlyViewed } = useRecentlyViewed();
	const { toggleFavorite, isFavorite } = useFavorites();

	// Check if user can manage properties (add/edit/delete)
	const canManage = currentUser ? canManageProperties(currentUser.role) : false;

	// Filter groups based on user role and assignments
	const filteredGroups = useMemo(
		() => filterPropertyGroupsByRole(groups, currentUser, teamMembers),
		[groups, currentUser, teamMembers],
	);

	// Helper function to generate slug from title
	const generateSlug = (title: string): string => {
		return title
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^\w-]/g, '');
	};

	const [openDropdown, setOpenDropdown] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedGroupForDialog, setSelectedGroupForDialog] = useState<
		number | null
	>(null);
	const [selectedPropertyForEdit, setSelectedPropertyForEdit] =
		useState<PropertyModel | null>(null);

	const handleAddGroup = () => {
		dispatch(
			addGroup({
				id: Date.now(),
				name: 'New Group',
				isEditingName: true,
				properties: [],
			}),
		);
	};

	const handleGroupNameChange = (groupId: number, newName: string) => {
		dispatch(updateGroupName({ groupId, name: newName }));
	};

	const handleToggleEditName = (groupId: number) => {
		dispatch(toggleGroupEditName(groupId));
	};

	const handleAddPropertyClick = (groupId: number) => {
		setSelectedGroupForDialog(groupId);
		setSelectedPropertyForEdit(null);
		setDialogOpen(true);
	};

	const handleAddPropertyGlobalClick = () => {
		setSelectedGroupForDialog(null);
		setSelectedPropertyForEdit(null);
		setDialogOpen(true);
	};

	const handleEditPropertyClick = (
		groupId: number,
		property: PropertyModel,
	) => {
		setSelectedGroupForDialog(groupId);
		setSelectedPropertyForEdit(property);
		addRecentlyViewed({
			id: property.id,
			title: property.title,
			slug: property.slug,
		});
		setDialogOpen(true);
	};

	const handleDeleteProperty = (groupId: number, propertyId: number) => {
		dispatch(deleteProperty({ propertyId, groupId }));
		setOpenDropdown(null);
	};

	const handleDeleteGroup = (groupId: number) => {
		dispatch(deleteGroup(groupId));
	};

	const handleSaveProperty = (formData: any) => {
		const unitsData: Unit[] | undefined =
			formData.propertyType === 'Multi-Family'
				? (formData.units || []).map((unitName: string) => ({
						name: unitName,
						tenants: [],
					}))
				: undefined;

		const suitesData: Suite[] | undefined =
			formData.propertyType === 'Commercial' && formData.hasSuites
				? (formData.suites || []).map((suiteName: string) => ({
						name: suiteName,
						tenants: [],
					}))
				: undefined;

		if (selectedGroupForDialog) {
			if (selectedPropertyForEdit) {
				// Edit existing property
				addRecentlyViewed({
					id: selectedPropertyForEdit.id,
					title: formData.name,
					slug: selectedPropertyForEdit.slug,
				});
				const updatedProperty: PropertyModel = {
					...selectedPropertyForEdit,
					title: formData.name,
					image: formData.photo || selectedPropertyForEdit.image,
					owner: formData.owner,
					address: formData.address,
					propertyType: formData.propertyType,
					units:
						formData.propertyType === 'Multi-Family'
							? (unitsData ?? [])
							: undefined,
					hasSuites:
						formData.propertyType === 'Commercial'
							? !!formData.hasSuites
							: undefined,
					suites:
						formData.propertyType === 'Commercial' && formData.hasSuites
							? (suitesData ?? [])
							: undefined,
					bedrooms: formData.bedrooms,
					bathrooms: formData.bathrooms,
					administrators: formData.administrators,
					viewers: formData.viewers,
					devices: formData.devices,
					notes: formData.notes,
					maintenanceHistory: formData.maintenanceHistory,
				};
				dispatch(
					updateProperty({
						groupId: selectedGroupForDialog,
						property: updatedProperty,
					}),
				);
			} else {
				// Add new property
				const newProperty: PropertyModel = {
					id: Date.now(),
					title: formData.name,
					slug: generateSlug(formData.name),
					image:
						formData.photo ||
						'https://via.placeholder.com/300x200?text=Property',
					isFavorite: false,
					owner: formData.owner,
					address: formData.address,
					propertyType: formData.propertyType,
					units:
						formData.propertyType === 'Multi-Family'
							? (unitsData ?? [])
							: undefined,
					hasSuites:
						formData.propertyType === 'Commercial'
							? !!formData.hasSuites
							: undefined,
					suites:
						formData.propertyType === 'Commercial' && formData.hasSuites
							? (suitesData ?? [])
							: undefined,
					bedrooms: formData.bedrooms,
					bathrooms: formData.bathrooms,
					administrators: formData.administrators,
					viewers: formData.viewers,
					devices: formData.devices,
					notes: formData.notes,
					maintenanceHistory: formData.maintenanceHistory,
				};
				addRecentlyViewed({
					id: newProperty.id,
					title: newProperty.title,
					slug: newProperty.slug,
				});
				dispatch(
					addPropertyToGroup({
						groupId: selectedGroupForDialog,
						property: newProperty,
					}),
				);
			}
		} else {
			// Global add: use selected form group or create at end if none
			const targetGroupId = formData.groupId;
			if (targetGroupId) {
				const newProperty: PropertyModel = {
					id: Date.now(),
					title: formData.name,
					slug: generateSlug(formData.name),
					image:
						formData.photo ||
						'https://via.placeholder.com/300x200?text=Property',
					isFavorite: false,
					owner: formData.owner,
					address: formData.address,
					propertyType: formData.propertyType,
					units:
						formData.propertyType === 'Multi-Family'
							? (unitsData ?? [])
							: undefined,
					hasSuites:
						formData.propertyType === 'Commercial'
							? !!formData.hasSuites
							: undefined,
					suites:
						formData.propertyType === 'Commercial' && formData.hasSuites
							? (suitesData ?? [])
							: undefined,
					bedrooms: formData.bedrooms,
					bathrooms: formData.bathrooms,
					administrators: formData.administrators,
					viewers: formData.viewers,
					devices: formData.devices,
					notes: formData.notes,
					maintenanceHistory: formData.maintenanceHistory,
				};
				addRecentlyViewed({
					id: newProperty.id,
					title: newProperty.title,
					slug: newProperty.slug,
				});
				dispatch(
					addPropertyToGroup({
						groupId: targetGroupId,
						property: newProperty,
					}),
				);
			}
		}
		setDialogOpen(false);
		setSelectedGroupForDialog(null);
		setSelectedPropertyForEdit(null);
	};

	return (
		<Wrapper>
			{/* Page Header: Title on left, actions on right */}
			<PageHeader>
				<PageTitle>Properties</PageTitle>
				{canManage && (
					<TopActions>
						<AddGroupButton onClick={handleAddGroup}>
							+ Add Group
						</AddGroupButton>
						<AddPropertyButton onClick={handleAddPropertyGlobalClick}>
							+ Add Property
						</AddPropertyButton>
					</TopActions>
				)}
			</PageHeader>
			<PropertyDialog
				isOpen={dialogOpen}
				onClose={() => {
					setDialogOpen(false);
					setSelectedGroupForDialog(null);
					setSelectedPropertyForEdit(null);
				}}
				onSave={handleSaveProperty}
				groups={filteredGroups.map((g) => ({ id: g.id, name: g.name }))}
				selectedGroupId={selectedGroupForDialog}
				onCreateGroup={(name: string) => {
					const newId = Date.now();
					dispatch(
						addGroup({
							id: newId,
							name,
							isEditingName: false,
							properties: [],
						}),
					);
					return newId;
				}}
				initialData={
					selectedPropertyForEdit
						? {
								name: selectedPropertyForEdit.title,
								photo: selectedPropertyForEdit.image,
								owner: selectedPropertyForEdit.owner || '',
								administrators: selectedPropertyForEdit.administrators || [],
								viewers: selectedPropertyForEdit.viewers || [],
								address: selectedPropertyForEdit.address || '',
								propertyType:
									selectedPropertyForEdit.propertyType || 'Single Family',
								units: (selectedPropertyForEdit.units || []).map((u: any) =>
									typeof u === 'string' ? u : u.name,
								),
								hasSuites: selectedPropertyForEdit.hasSuites ?? false,
								suites: (selectedPropertyForEdit.suites || []).map((s: any) =>
									typeof s === 'string' ? s : s.name,
								),
								bedrooms: selectedPropertyForEdit.bedrooms || 0,
								bathrooms: selectedPropertyForEdit.bathrooms || 0,
								devices: selectedPropertyForEdit.devices || [
									{
										id: Date.now(),
										type: '',
										brand: '',
										model: '',
										installationDate: '',
									},
								],
								notes: selectedPropertyForEdit.notes || '',
								maintenanceHistory:
									selectedPropertyForEdit.maintenanceHistory || [],
							}
						: undefined
				}
			/>
			<GroupsContainer>
				{filteredGroups.map((group) => (
					<GroupSection key={group.id}>
						<GroupHeader>
							<div>
								{group.isEditingName ? (
									<GroupNameInput
										type='text'
										value={group.name}
										onChange={(e) =>
											handleGroupNameChange(group.id, e.target.value)
										}
										onBlur={() => handleToggleEditName(group.id)}
										autoFocus
									/>
								) : (
									<GroupName onClick={() => handleToggleEditName(group.id)}>
										{group.name}
									</GroupName>
								)}
							</div>
							<HeaderRight>
								{canManage && (
									<GroupActions>
										<GroupActionButton
											title='Edit group'
											onClick={() => handleToggleEditName(group.id)}>
											✎
										</GroupActionButton>
										<GroupActionButton
											title='Delete group'
											onClick={() => handleDeleteGroup(group.id)}>
											🗑
										</GroupActionButton>
									</GroupActions>
								)}
							</HeaderRight>
						</GroupHeader>
						<PropertiesGrid>
							{group.properties.map((property) => (
								<PropertyTile
									key={property.id}
									onClick={() => {
										addRecentlyViewed({
											id: property.id,
											title: property.title,
											slug: property.slug,
										});
										navigate(`/property/${property.slug}`);
									}}>
									<PropertyImage src={property.image} alt={property.title} />
									<FavoriteStar
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											toggleFavorite({
												id: property.id,
												title: property.title,
												slug: property.slug,
											});
										}}
										title={
											isFavorite(property.id)
												? 'Remove from favorites'
												: 'Add to favorites'
										}>
										{isFavorite(property.id) ? '★' : '☆'}
									</FavoriteStar>
									<PropertyOverlay>
										<PropertyTitle
											onClick={(e) => {
												e.stopPropagation();
												addRecentlyViewed({
													id: property.id,
													title: property.title,
													slug: property.slug,
												});
											}}>
											{property.title}
										</PropertyTitle>
										<DropdownToggle
											onClick={(e) => {
												e.stopPropagation();
												setOpenDropdown(
													openDropdown === `${group.id}-${property.id}`
														? null
														: `${group.id}-${property.id}`,
												);
											}}>
											⋮
										</DropdownToggle>
										{openDropdown === `${group.id}-${property.id}` &&
											canManage && (
												<DropdownMenu onClick={(e) => e.stopPropagation()}>
													<DropdownItem
														onClick={() =>
															handleEditPropertyClick(group.id, property)
														}>
														Edit
													</DropdownItem>
													<DropdownItem
														onClick={() =>
															handleDeleteProperty(group.id, property.id)
														}
														style={{ color: '#ef4444' }}>
														Delete
													</DropdownItem>
												</DropdownMenu>
											)}
									</PropertyOverlay>
								</PropertyTile>
							))}
						</PropertiesGrid>
					</GroupSection>
				))}
			</GroupsContainer>
		</Wrapper>
	);
};
