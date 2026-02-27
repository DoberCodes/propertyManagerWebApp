import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { PropertyDialog } from './PropertyDialog';
import {
	PageHeaderSection,
	PageTitle as StandardPageTitle,
} from '../Library/PageHeaders';
import { DeleteConfirmationModal } from '../Library/Modal/DeleteConfirmationModal';
import { useRecentlyViewed } from '../../Hooks/useRecentlyViewed';
import { useFavorites } from '../../Hooks/useFavorites';
import { RootState } from '../../Redux/store/store';
import { setCurrentUser } from '../../Redux/Slices/userSlice';
import {
	selectCanAccessProperties,
	selectIsHomeowner,
} from '../../Redux/selectors/permissionSelectors';
import {
	useCreatePropertyMutation,
	useUpdatePropertyMutation,
	useDeletePropertyMutation,
	useCreatePropertyGroupMutation,
	useUpdatePropertyGroupMutation,
	useDeletePropertyGroupMutation,
	useCreateUnitMutation,
} from '../../Redux/API/propertySlice';
import { useGetAllPropertySharesForUserQuery } from '../../Redux/API/userSlice';
import { useDeletePropertyShareMutation } from '../../Redux/API/userSlice';
import { useUpdateUserMutation } from '../../Redux/API/userSlice';
import { useCreateNotificationMutation } from '../../Redux/API/notificationSlice';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
	canAddProperty,
	getRemainingPropertySlots,
	getSubscriptionPlanDetails,
	isTrialExpired,
} from '../../utils/subscriptionUtils';
import { filterPropertyGroupsByRole } from '../../utils/dataFilters';
import { canDeleteProperty } from '../../utils/permissions';
import { TeamMember } from '../../Redux/Slices/teamSlice';
import {
	Wrapper,
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
import { Property } from '../../types/Property.types';

export const Properties = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const canAccessProperties = useSelector(selectCanAccessProperties);
	const isHomeowner = useSelector(selectIsHomeowner);
	// Select team groups and derive members with memoization to avoid new references
	const teamGroups = useSelector((state: RootState) => state.team.groups);
	const teamMembers = useMemo(
		() => teamGroups.flatMap((group) => group.members || []),
		[teamGroups],
	);

	// Read property groups from Redux store (populated by DataLoader)
	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);

	const { addRecentlyViewed } = useRecentlyViewed(currentUser!.id);
	const { toggleFavorite, isFavorite } = useFavorites(currentUser!.id);

	// Firebase mutations
	const [createProperty] = useCreatePropertyMutation();
	const [updateProperty] = useUpdatePropertyMutation();
	const [deleteProperty] = useDeletePropertyMutation();
	const [createPropertyGroup] = useCreatePropertyGroupMutation();
	const [updatePropertyGroup] = useUpdatePropertyGroupMutation();
	const [deletePropertyGroup] = useDeletePropertyGroupMutation();
	const [createUnit] = useCreateUnitMutation();
	const [updateUser] = useUpdateUserMutation();
	const [deletePropertyShare] = useDeletePropertyShareMutation();
	const [createNotification] = useCreateNotificationMutation();

	const { data: propertyShares = [] } = useGetAllPropertySharesForUserQuery();

	// Check if user can manage properties based on subscription plan
	// All paid plans allow property management, free plan has limited access
	// Expired users cannot add new properties
	const canManage =
		canAccessProperties &&
		(currentUser?.subscription
			? !isTrialExpired(currentUser.subscription)
			: false);

	// Check if user can create/edit/delete groups (basic and above plans only, not homeowner)
	// Expired users cannot manage groups
	const canManageGroups = currentUser?.subscription
		? ['basic', 'professional', 'enterprise'].includes(
				currentUser.subscription.plan,
		  ) && !isTrialExpired(currentUser.subscription)
		: false;

	// Combine groups with their properties
	const groupsWithProperties = useMemo(() => {
		return propertyGroups.map((group) => ({
			...group,
			properties: group.properties || [],
		}));
	}, [propertyGroups]);

	// Count total properties for this user (for homeowners, only count owned properties, not shared)
	const totalProperties = groupsWithProperties.reduce((acc, group) => {
		// For homeowners, only count properties in groups they own (exclude "Shared Properties")
		if (isHomeowner) {
			if (group.name?.toLowerCase() === 'shared properties') {
				return acc; // Don't count shared properties for homeowner limits
			}
		}
		return acc + (group.properties?.length || 0);
	}, 0);

	// Filter groups based on user role and assignments
	// Note: Casting to any[] to handle type mismatch between Redux types (number IDs) and Firebase types (string IDs)
	const filteredGroups = useMemo(() => {
		const groups = filterPropertyGroupsByRole(
			groupsWithProperties as any[],
			currentUser,
			teamMembers?.filter((m): m is TeamMember => m !== undefined),
			propertyShares,
		);
		// Sort groups so "My Properties" appears first
		return groups.sort((a, b) => {
			const aName = a.name?.toLowerCase() || '';
			const bName = b.name?.toLowerCase() || '';
			if (aName === 'my properties') return -1;
			if (bName === 'my properties') return 1;
			return 0;
		});
	}, [groupsWithProperties, currentUser, teamMembers, propertyShares]);

	useEffect(() => {
		const currentTeamMember = teamMembers.find(
			(member) => member?.email === currentUser?.email,
		);

		console.log('DEBUG PropertiesTab render pipeline:', {
			user: currentUser
				? {
					id: currentUser.id,
					email: currentUser.email,
					role: currentUser.role,
					accountId: currentUser.accountId,
				}
				: null,
			teamMemberMatch: currentTeamMember
				? {
					id: currentTeamMember.id,
					email: currentTeamMember.email,
					linkedPropertiesCount:
						currentTeamMember.linkedProperties?.length || 0,
					linkedProperties: currentTeamMember.linkedProperties || [],
				}
				: null,
			propertyGroupsCount: propertyGroups.length,
			propertyGroups: propertyGroups.map((group) => ({
				id: group.id,
				name: group.name,
				propertyCount: group.properties?.length || 0,
				propertyIds: (group.properties || []).map((property) => property.id),
			})),
			groupsWithPropertiesCount: groupsWithProperties.length,
			filteredGroupsCount: filteredGroups.length,
			filteredGroups: filteredGroups.map((group) => ({
				id: group.id,
				name: group.name,
				propertyCount: group.properties?.length || 0,
				propertyIds: (group.properties || []).map((property) => property.id),
			})),
		});
	}, [
		currentUser,
		teamMembers,
		propertyGroups,
		groupsWithProperties,
		filteredGroups,
	]);

	const [openDropdown, setOpenDropdown] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedGroupForDialog, setSelectedGroupForDialog] = useState<
		string | null
	>(null);
	const [selectedPropertyForEdit, setSelectedPropertyForEdit] = useState<
		any | null
	>(null);
	const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
	const [editingGroupName, setEditingGroupName] = useState<string>('');
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [propertyToDelete, setPropertyToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [isDeletingProperty, setIsDeletingProperty] = useState(false);

	const handleAddGroup = async () => {
		if (!currentUser) {
			console.error('No user logged in');
			return;
		}

		try {
			const result = await createPropertyGroup({
				userId: currentUser.id,
				name: 'New Group',
				properties: [],
			}).unwrap();

			// Create notification for property group creation
			try {
				await createNotification({
					userId: currentUser.id,
					type: 'property_group_created',
					title: 'Property Group Created',
					message: 'New property group "New Group" has been created',
					data: {
						groupId: result.id,
						groupName: 'New Group',
					},
					status: 'unread',
					actionUrl: `/properties`,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}).unwrap();
			} catch (notifError) {
				console.error('Notification failed:', notifError);
			}
		} catch (error) {
			console.error('Failed to create property group:', error);
		}
	};

	const handleToggleEditName = (groupId: string) => {
		if (editingGroupId === groupId) {
			// Save the name change
			if (
				editingGroupName.trim() &&
				editingGroupName !== propertyGroups.find((g) => g.id === groupId)?.name
			) {
				try {
					updatePropertyGroup({
						id: groupId,
						updates: { name: editingGroupName },
					}).unwrap();

					// Create notification for property group update
					try {
						createNotification({
							userId: currentUser!.id,
							type: 'property_group_updated',
							title: 'Property Group Updated',
							message: `Property group "${editingGroupName}" has been updated`,
							data: {
								groupId: groupId,
								groupName: editingGroupName,
							},
							status: 'unread',
							actionUrl: `/properties`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						}).unwrap();
					} catch (notifError) {
						console.error('Notification failed:', notifError);
					}
				} catch (error) {
					console.error('Error updating property group:', error);
				}
			}
			setEditingGroupId(null);
			setEditingGroupName('');
		} else {
			// Start editing
			const group = propertyGroups.find((g) => g.id === groupId);
			if (group) {
				setEditingGroupId(groupId);
				setEditingGroupName(group.name);
			}
		}
	};

	const handleDisabled = useCallback(() => {
		if (!currentUser) return true;
		if (currentUser.subscription) {
			const remainingSlots = getRemainingPropertySlots(
				currentUser.subscription,
				totalProperties,
			);
			return remainingSlots <= 0;
		}
		return false;
	}, [currentUser, totalProperties]);

	const handleAddPropertyGlobalClick = async () => {
		// Check subscription limits
		if (currentUser?.subscription) {
			const canAdd = canAddProperty(
				currentUser.subscription,
				totalProperties,
				currentUser.role,
			);
			if (!canAdd) {
				const planDetails = getSubscriptionPlanDetails(
					currentUser.subscription.plan,
				);
				const maxProperties = planDetails?.maxProperties || 1;

				alert(
					`Your ${
						planDetails?.name || 'current'
					} plan allows up to ${maxProperties} properties. ` +
						`You currently have ${totalProperties} properties. ` +
						`Please upgrade your plan to add more properties.`,
				);
				// TODO: Redirect to paywall/upgrade page
				return;
			}
		} else {
			// No subscription data - should not happen, but fallback
			alert('Unable to verify subscription. Please contact support.');
			return;
		}

		setSelectedGroupForDialog(null);
		setSelectedPropertyForEdit(null);
		setDialogOpen(true);

		// For homeowners with no groups, automatically create "My Properties" group
		if (isHomeowner && filteredGroups.length === 0) {
			try {
				const result = await createPropertyGroup({
					name: 'My Properties',
					properties: [],
					userId: currentUser.id,
				});
				if ('data' in result && result.data) {
					setSelectedGroupForDialog((result.data as any).id);
				}
			} catch (error) {
				console.error('Error creating My Properties group:', error);
			}
		}
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
		const propertyToDelete = filteredGroups
			.flatMap((g) => g.properties || [])
			.find((p) => p.id === propertyId);

		if (propertyToDelete) {
			setPropertyToDelete({
				id: propertyId,
				name: propertyToDelete.title,
			});
			setDeleteModalOpen(true);
		}
	};

	const handleConfirmDeleteProperty = async () => {
		if (!propertyToDelete) return;

		try {
			setIsDeletingProperty(true);
			await deleteProperty(propertyToDelete.id).unwrap();

			// Create notification for property deletion
			try {
				await createNotification({
					userId: currentUser!.id,
					type: 'property_deleted',
					title: 'Property Deleted',
					message: `Property "${propertyToDelete.name}" has been deleted`,
					data: {
						propertyId: propertyToDelete.id,
						propertyTitle: propertyToDelete.name,
					},
					status: 'unread',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}).unwrap();
			} catch (notifError) {
				console.error('Notification failed:', notifError);
			}

			setDeleteModalOpen(false);
			setPropertyToDelete(null);
		} catch (error) {
			console.error('Error deleting property:', error);
		} finally {
			setIsDeletingProperty(false);
			setOpenDropdown(null);
		}
	};

	const handleDeleteGroup = async (groupId: string) => {
		if (
			!window.confirm('Are you sure you want to delete this property group?')
		) {
			return;
		}
		try {
			const groupToDelete = propertyGroups.find((g) => g.id === groupId);
			await deletePropertyGroup(groupId).unwrap();

			// Create notification for property group deletion
			try {
				if (groupToDelete) {
					await createNotification({
						userId: currentUser!.id,
						type: 'property_group_deleted',
						title: 'Property Group Deleted',
						message: `Property group "${groupToDelete.name}" has been deleted`,
						data: {
							groupId: groupId,
							groupName: groupToDelete.name,
						},
						status: 'unread',
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				}
			} catch (notifError) {
				console.error('Notification failed:', notifError);
			}
		} catch (error) {
			console.error('Failed to delete property group:', error);
			alert('Failed to delete property group. Please try again.');
		}
	};

	const handleToggleHideFromDashboard = async (propertyId: string) => {
		if (!currentUser) return;

		try {
			const hiddenIds = currentUser.hiddenPropertyIds || [];
			const isCurrentlyHidden = hiddenIds.includes(propertyId);

			const updatedHiddenIds = isCurrentlyHidden
				? hiddenIds.filter((id) => id !== propertyId)
				: [...hiddenIds, propertyId];

			await updateUser({
				id: currentUser.id,
				updates: { hiddenPropertyIds: updatedHiddenIds },
			}).unwrap();

			// Update the Redux store with the new user data
			dispatch(
				setCurrentUser({
					...currentUser,
					hiddenPropertyIds: updatedHiddenIds,
				}),
			);

			setOpenDropdown(null);
		} catch (error) {
			console.error('Failed to update dashboard visibility:', error);
			alert('Failed to update dashboard visibility. Please try again.');
		}
	};

	const handleDetachFromProperty = async (propertyId: string) => {
		if (!currentUser) return;

		if (
			!window.confirm(
				'Are you sure you want to detach from this shared property? You will lose access to it.',
			)
		) {
			return;
		}

		try {
			// Find the property share for this user and property
			const shareQuery = query(
				collection(db, 'propertyShares'),
				where('propertyId', '==', propertyId),
				where('sharedWithUserId', '==', currentUser.id),
			);

			const shareSnapshot = await getDocs(shareQuery);

			if (!shareSnapshot.empty) {
				const shareId = shareSnapshot.docs[0].id;
				await deletePropertyShare(shareId).unwrap();

				setOpenDropdown(null);
				alert('Successfully detached from property.');
			} else {
				alert('Could not find property share to remove.');
			}
		} catch (error) {
			console.error('Failed to detach from property:', error);
			alert('Failed to detach from property. Please try again.');
		}
	};

	const handleSaveProperty = async (formData: any) => {
		const effectivePropertyType = isHomeowner
			? 'Single Family'
			: formData.propertyType;

		// Prepare units data for Multi-Family properties
		const unitsData =
			effectivePropertyType === 'Multi-Family'
				? (formData.units || []).map((unitName: string) => ({
						name: unitName,
						occupants: [],
				  }))
				: undefined;

		// Prepare suites data for Commercial properties
		const suitesData =
			effectivePropertyType === 'Commercial' && formData.hasSuites
				? (formData.suites || []).map((suiteName: string) => ({
						name: suiteName,
						occupants: [],
				  }))
				: undefined;

		if (selectedPropertyForEdit) {
			// Edit existing property
			try {
				const updates = {
					title: formData.name,
					image: formData.photo || selectedPropertyForEdit.image,
					groupId: formData.groupId || selectedGroupForDialog || undefined,
					owner: formData.owner,
					address: formData.address,
					propertyType: effectivePropertyType,
					units:
						effectivePropertyType === 'Multi-Family' ? unitsData : undefined,
					hasSuites:
						effectivePropertyType === 'Commercial'
							? !!formData.hasSuites
							: undefined,
					suites:
						effectivePropertyType === 'Commercial' && formData.hasSuites
							? suitesData
							: undefined,
					bedrooms: formData.bedrooms,
					bathrooms: formData.bathrooms,
					notes: formData.notes,
					isRental: !!formData.isRental,
					taskHistory: formData.maintenanceHistory || [],
				};
				const sanitizedUpdates = Object.fromEntries(
					Object.entries(updates).filter(([, value]) => value !== undefined),
				);
				await updateProperty({
					id: selectedPropertyForEdit.id,
					updates: sanitizedUpdates,
				}).unwrap();

				// Create units for Multi-Family properties if units were added
				if (
					effectivePropertyType === 'Multi-Family' &&
					unitsData &&
					unitsData.length > 0
				) {
					try {
						for (const unit of unitsData) {
							await createUnit({
								userId: currentUser!.id,
								propertyId: selectedPropertyForEdit.id,
								name: unit.name,
								floor: 1, // Default floor
								area: 1000, // Default area
								isOccupied: false,
								deviceIds: [],
								occupants: unit.occupants || [],
							}).unwrap();
						}
					} catch (unitError) {
						console.error('Failed to create units:', unitError);
						// Don't fail property update if unit creation fails
					}
				}

				// Create notification for property update
				try {
					await createNotification({
						userId: currentUser!.id,
						type: 'property_updated',
						title: 'Property Updated',
						message: `Property "${formData.name}" has been updated`,
						data: {
							propertyId: selectedPropertyForEdit.id,
							propertyTitle: formData.name,
						},
						status: 'unread',
						actionUrl: `/properties/${selectedPropertyForEdit.id}`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				} catch (notifError) {
					console.error('Notification failed:', notifError);
				}
			} catch (error) {
				console.error('Error updating property:', error);
				alert('Failed to update property. Please try again.');
				throw error; // Re-throw to let PropertyDialog know save failed
			}
		} else {
			// Add new property
			const slug = formData.name
				.toLowerCase()
				.replace(/\s+/g, '-')
				.replace(/[^\w-]/g, '');

			// Use groupId from formData (selected in dialog) or fall back to state
			const groupId = formData.groupId || selectedGroupForDialog;

			// Validate that a group is selected
			if (!groupId || groupId === '') {
				alert('Please select a group for this property');
				throw new Error('No group selected');
			}

			// Firebase doesn't accept undefined values
			const newPropertyData: any = {
				userId: currentUser!.id,
				groupId: groupId,
				title: formData.name,
				slug,
				...(formData.photo && { image: formData.photo }),
				owner: formData.owner,
				address: formData.address,
				propertyType: effectivePropertyType,
				bedrooms: formData.bedrooms,
				bathrooms: formData.bathrooms,
				isRental: !!formData.isRental,

				taskHistory: formData.maintenanceHistory || [],
			};

			// Only add type-specific fields if they have values
			if (effectivePropertyType === 'Multi-Family' && unitsData) {
				newPropertyData.units = unitsData;
			}
			if (effectivePropertyType === 'Commercial') {
				newPropertyData.hasSuites = !!formData.hasSuites;
				if (formData.hasSuites && suitesData) {
					newPropertyData.suites = suitesData;
				}
			}

			try {
				const result = await createProperty(newPropertyData);

				if ('data' in result) {
					// Create units for Multi-Family properties
					if (
						effectivePropertyType === 'Multi-Family' &&
						unitsData &&
						unitsData.length > 0
					) {
						try {
							for (const unit of unitsData) {
								await createUnit({
									userId: currentUser!.id,
									propertyId: result.data.id,
									name: unit.name,
									floor: 1, // Default floor
									area: 1000, // Default area
									isOccupied: false,
									deviceIds: [],
									occupants: unit.occupants || [],
								}).unwrap();
							}
						} catch (unitError) {
							console.error('Failed to create units:', unitError);
							// Don't fail property creation if unit creation fails
						}
					}

					addRecentlyViewed({
						id: result.data.id as any, // Firebase uses string IDs
						title: result.data.title,
						slug: result.data.slug,
					});

					// Create notification for property added
					try {
						await createNotification({
							userId: currentUser!.id,
							type: 'property_added',
							title: 'Property Added',
							message: `${formData.name} has been added to your properties`,
							data: {
								propertyId: result.data.id,
								propertyTitle: result.data.title,
								propertyType: effectivePropertyType,
							},
							status: 'unread',
							actionUrl: `/property/${result.data.slug}`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						}).unwrap();
					} catch (notificationError) {
						console.error('Failed to create notification:', notificationError);
						// Don't fail the property creation if notification fails
					}
				} else if ('error' in result) {
					console.error('Failed to create property:', result.error);
					alert('Failed to create property. Please try again.');
					throw new Error('Failed to create property');
				}
			} catch (error) {
				console.error('Error creating property:', error);
				alert('An error occurred while creating the property.');
				throw error; // Re-throw to let PropertyDialog know save failed
			}
		}

		// Success - dialog will be closed by PropertyDialog after successful save
	};

	return (
		<Wrapper>
			{/* Page Header: Title on left, actions on right */}
			<PageHeaderSection>
				<StandardPageTitle>Properties</StandardPageTitle>
				{canManage && (
					<TopActions>
						{canManageGroups && (
							<AddGroupButton onClick={handleAddGroup}>
								+ Add Group
							</AddGroupButton>
						)}
						<AddPropertyButton
							disabled={handleDisabled()}
							onClick={handleAddPropertyGlobalClick}>
							+ Add Property
						</AddPropertyButton>
					</TopActions>
				)}
			</PageHeaderSection>
			<PropertyDialog
				isOpen={dialogOpen}
				onClose={() => {
					setDialogOpen(false);
					setSelectedGroupForDialog(null);
					setSelectedPropertyForEdit(null);
				}}
				onSave={handleSaveProperty}
				forceSingleFamily={isHomeowner}
				groups={filteredGroups.map((g) => ({ id: g.id, name: g.name }))}
				selectedGroupId={selectedGroupForDialog}
				propertyId={selectedPropertyForEdit?.id}
				onCreateGroup={async (name: string) => {
					// currentUser guaranteed to exist
					const result = await createPropertyGroup({
						name,
						properties: [],
						userId: currentUser!.id,
					});
					if ('data' in result && result.data) {
						return (result.data as any).id as string;
					}
					return '';
				}}
				initialData={
					selectedPropertyForEdit
						? {
								name: selectedPropertyForEdit.title,
								photo: selectedPropertyForEdit.image,
								owner: selectedPropertyForEdit.owner || '',
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
								notes: selectedPropertyForEdit.notes || '',
								isRental: selectedPropertyForEdit.isRental ?? false,
								maintenanceHistory:
									selectedPropertyForEdit.maintenanceHistory || [],
						  }
						: undefined
				}
				isHiddenFromDashboard={
					selectedPropertyForEdit
						? currentUser?.hiddenPropertyIds?.includes(
								selectedPropertyForEdit.id,
						  )
						: false
				}
				onToggleHideFromDashboard={
					selectedPropertyForEdit
						? () => handleToggleHideFromDashboard(selectedPropertyForEdit.id)
						: undefined
				}
				isSharedProperty={
					filteredGroups
						.find((g) =>
							g.properties?.some((p) => p.id === selectedPropertyForEdit?.id),
						)
						?.name?.toLowerCase() === 'shared properties'
				}
				onDetachFromProperty={
					selectedPropertyForEdit
						? () => handleDetachFromProperty(selectedPropertyForEdit.id)
						: undefined
				}
			/>
			<GroupsContainer>
				{filteredGroups.map((group) => (
					<GroupSection key={group.id}>
						<GroupHeader>
							<div>
								{editingGroupId === group.id ? (
									<GroupNameInput
										type='text'
										value={editingGroupName}
										onChange={(e) => setEditingGroupName(e.target.value)}
										onBlur={() => handleToggleEditName(group.id as any)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												handleToggleEditName(group.id as any);
											}
										}}
										autoFocus
									/>
								) : (
									<GroupName>{group.name}</GroupName>
								)}
							</div>
							<HeaderRight>
								{canManageGroups && (
									<GroupActions>
										<GroupActionButton
											title='Edit group'
											onClick={() => handleToggleEditName(group.id as any)}>
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
						<PropertiesGrid
							$isHomeowner={isHomeowner}
							$singleProperty={(group.properties || []).length === 1}>
							{(group.properties || []).map((property: Property) => (
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
													{canDeleteProperty(currentUser!.id, property) && (
														<DropdownItem
															onClick={() =>
																handleDeleteProperty(property.id as any)
															}
															style={{ color: '#ef4444' }}>
															Delete
														</DropdownItem>
													)}
												</DropdownMenu>
											)}
									</PropertyOverlay>
								</PropertyTile>
							))}
						</PropertiesGrid>
					</GroupSection>
				))}
			</GroupsContainer>

			{/* Delete Confirmation Modal */}
			<DeleteConfirmationModal
				isOpen={deleteModalOpen}
				itemName={propertyToDelete?.name || ''}
				itemType='property'
				onConfirm={handleConfirmDeleteProperty}
				onCancel={() => {
					setDeleteModalOpen(false);
					setPropertyToDelete(null);
				}}
				isLoading={isDeletingProperty}
			/>
		</Wrapper>
	);
};
