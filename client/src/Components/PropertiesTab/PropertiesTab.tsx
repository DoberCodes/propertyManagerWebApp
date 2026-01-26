import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PropertyDialog } from './PropertyDialog';
import { useRecentlyViewed } from '../../Hooks/useRecentlyViewed';
import { useFavorites } from '../../Hooks/useFavorites';
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

interface Property {
	id: number;
	title: string;
	slug: string;
	image?: string;
	owner?: string;
	administrators?: string[];
	viewers?: string[];
	address?: string;
	bedrooms?: number;
	bathrooms?: number;
	devices?: any[];
	notes?: string;
	maintenanceHistory?: Array<{ date: string; description: string }>;
	isFavorite?: boolean;
}

interface PropertyGroup {
	id: number;
	name: string;
	isEditingName?: boolean;
	properties: Property[];
}

export const Properties = () => {
	const navigate = useNavigate();
	const { addRecentlyViewed } = useRecentlyViewed();
	const { toggleFavorite, isFavorite } = useFavorites();

	// Helper function to generate slug from title
	const generateSlug = (title: string): string => {
		return title
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^\w-]/g, '');
	};
	const [groups, setGroups] = useState<PropertyGroup[]>([
		{
			id: 1,
			name: 'Downtown Properties',
			properties: [
				{
					id: 1,
					title: 'Downtown Apartments',
					slug: 'downtown-apartments',
					image: 'https://via.placeholder.com/300x200?text=Downtown+Apartments',
					isFavorite: false,
					maintenanceHistory: [
						{ date: '2026-01-15', description: 'HVAC filter replacement' },
						{ date: '2025-12-20', description: 'Plumbing inspection' },
					],
				},
				{
					id: 2,
					title: 'Business Park',
					slug: 'business-park',
					image: 'https://via.placeholder.com/300x200?text=Business+Park',
					isFavorite: false,
					maintenanceHistory: [
						{ date: '2026-01-10', description: 'Roof maintenance' },
						{ date: '2025-11-05', description: 'HVAC service' },
					],
				},
			],
		},
		{
			id: 2,
			name: 'Residential Homes',
			properties: [
				{
					id: 3,
					title: 'Sunset Heights',
					slug: 'sunset-heights',
					image: 'https://via.placeholder.com/300x200?text=Sunset+Heights',
					isFavorite: false,
					maintenanceHistory: [
						{ date: '2026-01-20', description: 'Gutter cleaning' },
						{ date: '2025-12-15', description: 'Exterior paint touch-up' },
						{ date: '2025-11-10', description: 'Roof repair' },
					],
				},
				{
					id: 4,
					title: 'Oak Street Complex',
					slug: 'oak-street-complex',
					image: 'https://via.placeholder.com/300x200?text=Oak+Street',
					isFavorite: false,
					maintenanceHistory: [
						{ date: '2026-01-08', description: 'Foundation inspection' },
						{ date: '2025-12-01', description: 'Electrical system upgrade' },
					],
				},
			],
		},
	]);

	const [openDropdown, setOpenDropdown] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedGroupForDialog, setSelectedGroupForDialog] = useState<
		number | null
	>(null);
	const [selectedPropertyForEdit, setSelectedPropertyForEdit] =
		useState<Property | null>(null);

	const handleAddGroup = () => {
		const newGroup: PropertyGroup = {
			id: Date.now(),
			name: 'New Group',
			isEditingName: true,
			properties: [],
		};
		setGroups([...groups, newGroup]);
	};

	const handleGroupNameChange = (groupId: number, newName: string) => {
		setGroups(
			groups.map((group) =>
				group.id === groupId ? { ...group, name: newName } : group,
			),
		);
	};

	const handleToggleEditName = (groupId: number) => {
		setGroups(
			groups.map((group) =>
				group.id === groupId
					? { ...group, isEditingName: !group.isEditingName }
					: group,
			),
		);
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

	const handleEditPropertyClick = (groupId: number, property: Property) => {
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
		setGroups(
			groups.map((group) => {
				if (group.id === groupId) {
					return {
						...group,
						properties: group.properties.filter((p) => p.id !== propertyId),
					};
				}
				return group;
			}),
		);
		setOpenDropdown(null);
	};

	const handleDeleteGroup = (groupId: number) => {
		setGroups(groups.filter((g) => g.id !== groupId));
	};

	const handleSaveProperty = (formData: any) => {
		if (selectedGroupForDialog) {
			setGroups(
				groups.map((group) => {
					if (group.id === selectedGroupForDialog) {
						if (selectedPropertyForEdit) {
							// Edit existing property
							addRecentlyViewed({
								id: selectedPropertyForEdit.id,
								title: formData.name,
								slug: selectedPropertyForEdit.slug,
							});
							return {
								...group,
								properties: group.properties.map((p) =>
									p.id === selectedPropertyForEdit.id
										? {
												...p,
												title: formData.name,
												image: formData.photo || p.image,
											}
										: p,
								),
							};
						} else {
							// Add new property
							const newProperty: Property = {
								id: Date.now(),
								title: formData.name,
								slug: generateSlug(formData.name),
								image:
									formData.photo ||
									'https://via.placeholder.com/300x200?text=Property',
								isFavorite: false,
							};
							addRecentlyViewed({
								id: newProperty.id,
								title: newProperty.title,
								slug: newProperty.slug,
							});
							return {
								...group,
								properties: [...group.properties, newProperty],
							};
						}
					}
					return group;
				}),
			);
		} else {
			// Global add: use selected form group or create at end if none
			const targetGroupId = formData.groupId;
			if (targetGroupId) {
				setGroups(
					groups.map((group) => {
						if (group.id === targetGroupId) {
							const newProperty: Property = {
								id: Date.now(),
								title: formData.name,
								slug: generateSlug(formData.name),
								image:
									formData.photo ||
									'https://via.placeholder.com/300x200?text=Property',
								isFavorite: false,
							};
							addRecentlyViewed({
								id: newProperty.id,
								title: newProperty.title,
								slug: newProperty.slug,
							});
							return {
								...group,
								properties: [...group.properties, newProperty],
							};
						}
						return group;
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
				<TopActions>
					<AddGroupButton onClick={handleAddGroup}>+ Add Group</AddGroupButton>
					<AddPropertyButton onClick={handleAddPropertyGlobalClick}>
						+ Add Property
					</AddPropertyButton>
				</TopActions>
			</PageHeader>
			<PropertyDialog
				isOpen={dialogOpen}
				onClose={() => {
					setDialogOpen(false);
					setSelectedGroupForDialog(null);
					setSelectedPropertyForEdit(null);
				}}
				onSave={handleSaveProperty}
				groups={groups.map((g) => ({ id: g.id, name: g.name }))}
				selectedGroupId={selectedGroupForDialog}
				onCreateGroup={(name: string) => {
					const newId = Date.now();
					setGroups((prev) => [
						...prev,
						{ id: newId, name, isEditingName: false, properties: [] },
					]);
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
				{groups.map((group) => (
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
										{openDropdown === `${group.id}-${property.id}` && (
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
