import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PropertyDialog } from './PropertyDialog';
import { useRecentlyViewed } from '../../Hooks/useRecentlyViewed';
import { useFavorites } from '../../Hooks/useFavorites';
import { RootState } from '../../Redux/Store/store';
import {
	useGetPropertiesQuery,
	useGetPropertyGroupsQuery,
	useCreatePropertyMutation,
	useUpdatePropertyMutation,
	useDeletePropertyMutation,
	useCreatePropertyGroupMutation,
	useUpdatePropertyGroupMutation,
	useDeletePropertyGroupMutation,
} from '../../Redux/API/apiSlice';
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
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const teamMembers = useSelector((state: RootState) =>
		state.team.groups.flatMap((group) => group.members),
	);
	const { addRecentlyViewed } = useRecentlyViewed();
	const { toggleFavorite, isFavorite } = useFavorites();

	// Firebase queries - skip if no user
	const { data: properties = [], isLoading: propertiesLoading } =
		useGetPropertiesQuery(currentUser?.id || '', { skip: !currentUser });
	const { data: groups = [], isLoading: groupsLoading } =
		useGetPropertyGroupsQuery(currentUser?.id || '', { skip: !currentUser });

	// Firebase mutations
	const [createProperty] = useCreatePropertyMutation();
	const [updateProperty] = useUpdatePropertyMutation();
	const [deleteProperty] = useDeletePropertyMutation();
	const [createPropertyGroup] = useCreatePropertyGroupMutation();
	const [updatePropertyGroup] = useUpdatePropertyGroupMutation();
	const [deletePropertyGroup] = useDeletePropertyGroupMutation();

	// Check if user can manage properties (add/edit/delete)
	const canManage = currentUser ? canManageProperties(currentUser.role) : false;

	// Combine groups with their properties
	const groupsWithProperties = useMemo(() => {
		return groups.map((group) => ({
			...group,
			properties: properties.filter((prop) => prop.groupId === group.id),
		}));
	}, [groups, properties]);

	// Filter groups based on user role and assignments
	// Note: Casting to any[] to handle type mismatch between Redux types (number IDs) and Firebase types (string IDs)
	const filteredGroups = useMemo(
		() =>
			filterPropertyGroupsByRole(
				groupsWithProperties as any[],
				currentUser,
				teamMembers,
			),
		[groupsWithProperties, currentUser, teamMembers],
	);

	const [openDropdown, setOpenDropdown] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedGroupForDialog, setSelectedGroupForDialog] = useState<
		string | null
	>(null);
	const [selectedPropertyForEdit, setSelectedPropertyForEdit] = useState<
		any | null
	>(null);

	const handleAddGroup = async () => {
		await createPropertyGroup({
			userId: currentUser?.id || '',
			name: 'New Group',
			properties: [],
		});
	};

	const handleGroupNameChange = async (groupId: string, newName: string) => {
		const group = groups.find((g) => g.id === groupId);
		if (group) {
			await updatePropertyGroup({
				id: groupId,
				updates: { name: newName },
			});
		}
	};

	const handleToggleEditName = () => {
		// This is handled by local state in the group editing
		// No need for Redux action anymore
	};

	const handleAddPropertyClick = (groupId: string) => {
		setSelectedGroupForDialog(groupId);
		setSelectedPropertyForEdit(null);
		setDialogOpen(true);
	};

	const handleAddPropertyGlobalClick = () => {
		setSelectedGroupForDialog(null);
		setSelectedPropertyForEdit(null);
		setDialogOpen(true);
	};

	const handleEditPropertyClick = (groupId: string, property: any) => {
		setSelectedGroupForDialog(groupId);
		setSelectedPropertyForEdit(property);
		addRecentlyViewed({
			id: property.id,
			title: property.title,
			slug: property.slug,
		});
		setDialogOpen(true);
	};

	const handleDeleteProperty = async (propertyId: string) => {
		await deleteProperty(propertyId);
		setOpenDropdown(null);
	};

	const handleDeleteGroup = async (groupId: string) => {
		await deletePropertyGroup(groupId);
	};

	const handleSaveProperty = async (formData: any) => {
		// Prepare units data for Multi-Family properties
		const unitsData =
			formData.propertyType === 'Multi-Family'
				? (formData.units || []).map((unitName: string) => ({
						name: unitName,
						occupants: [],
						devices: [],
					}))
				: undefined;

		// Prepare suites data for Commercial properties
		const suitesData =
			formData.propertyType === 'Commercial' && formData.hasSuites
				? (formData.suites || []).map((suiteName: string) => ({
						name: suiteName,
						occupants: [],
						devices: [],
					}))
				: undefined;

		if (selectedPropertyForEdit) {
			// Edit existing property
			await updateProperty({
				id: selectedPropertyForEdit.id,
				updates: {
					title: formData.name,
					image: formData.photo || selectedPropertyForEdit.image,
					owner: formData.owner,
					address: formData.address,
					propertyType: formData.propertyType,
					units:
						formData.propertyType === 'Multi-Family' ? unitsData : undefined,
					hasSuites:
						formData.propertyType === 'Commercial'
							? !!formData.hasSuites
							: undefined,
					suites:
						formData.propertyType === 'Commercial' && formData.hasSuites
							? suitesData
							: undefined,
					bedrooms: formData.bedrooms,
					bathrooms: formData.bathrooms,
					administrators: formData.administrators,
					viewers: formData.viewers,
					deviceIds: formData.devices.map((d) => d.id),
					notes: formData.notes,
					taskHistory: formData.maintenanceHistory || [],
				},
			});
		} else {
			// Add new property
			const slug = formData.name
				.toLowerCase()
				.replace(/\s+/g, '-')
				.replace(/[^\w-]/g, '');

			const newPropertyData = {
				groupId: selectedGroupForDialog || '',
				title: formData.name,
				slug,
				image:
					formData.photo || 'https://via.placeholder.com/300x200?text=Property',
				owner: formData.owner,
				address: formData.address,
				propertyType: formData.propertyType,
				units: formData.propertyType === 'Multi-Family' ? unitsData : undefined,
				hasSuites:
					formData.propertyType === 'Commercial'
						? !!formData.hasSuites
						: undefined,
				suites:
					formData.propertyType === 'Commercial' && formData.hasSuites
						? suitesData
						: undefined,
				bedrooms: formData.bedrooms,
				bathrooms: formData.bathrooms,
				administrators: formData.administrators,
				viewers: formData.viewers,
				deviceIds: formData.devices.map((d) => d.id),
				notes: formData.notes,
				taskHistory: formData.maintenanceHistory || [],
			};

			const result = await createProperty(newPropertyData);

			if ('data' in result) {
				addRecentlyViewed({
					id: result.data.id as any, // Firebase uses string IDs
					title: result.data.title,
					slug: result.data.slug,
				});
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
					if (!currentUser) return '';
					const result = createPropertyGroup({
						name,
						properties: [],
						userId: currentUser.id,
					});
					if ('data' in result && result.data) {
						return (result.data as any).id;
					}
					return '';
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
											handleGroupNameChange(group.id as any, e.target.value)
										}
										onBlur={() => handleToggleEditName()}
										autoFocus
									/>
								) : (
									<GroupName onClick={() => handleToggleEditName()}>
										{group.name}
									</GroupName>
								)}
							</div>
							<HeaderRight>
								{canManage && (
									<GroupActions>
										<GroupActionButton
											title='Edit group'
											onClick={() => handleToggleEditName()}>
											✎
										</GroupActionButton>
										<GroupActionButton
											title='Delete group'
											onClick={() => handleDeleteGroup(group.id as any)}>
											🗑
										</GroupActionButton>
									</GroupActions>
								)}
							</HeaderRight>
						</GroupHeader>
						<PropertiesGrid>
							{(group.properties || []).map((property) => (
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
												id: property.id as any,
												title: property.title,
												slug: property.slug,
											});
										}}
										title={
											isFavorite(property.id as any)
												? 'Remove from favorites'
												: 'Add to favorites'
										}>
										{isFavorite(property.id as any) ? '★' : '☆'}
									</FavoriteStar>
									<PropertyOverlay>
										<PropertyTitle
											onClick={(e) => {
												e.stopPropagation();
												addRecentlyViewed({
													id: property.id as any,
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
															handleEditPropertyClick(group.id as any, property)
														}>
														Edit
													</DropdownItem>
													<DropdownItem
														onClick={() =>
															handleDeleteProperty(property.id as any)
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
