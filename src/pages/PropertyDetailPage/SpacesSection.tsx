import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GenericModal } from '../../Components/Library/Modal';
import {
	FormGroup,
	FormInput,
	FormLabel,
	FormSelect,
	FormTextarea,
} from '../../Components/Library/Modal/ModalStyles';
import {
	useCreatePropertySpaceMutation,
	useGetPropertySpacesQuery,
	useUpdatePropertySpaceMutation,
} from '../../Redux/API/spaceSlice';
import { useGetDevicesQuery } from '../../Redux/API/deviceSlice';
import { useGetTasksQuery } from '../../Redux/API/taskSlice';
import {
	useGetPropertyKnowledgeLinksQuery,
	useRemovePropertySpaceMutation,
	useRestorePropertySpaceMutation,
} from '../../Redux/API/propertyKnowledgeLinkSlice';
import { Property } from '../../types/Property.types';
import {
	PropertySpace,
	PropertySpaceDraft,
	PropertySpaceType,
} from '../../types/Space.types';
import { RoleCapabilities } from '../../utils/permissions';
import { buildDeviceSlug } from '../../utils/deviceSlug';
import { getTaskTimingLabel } from '../../tasks/taskSchedule';
import {
	getNextPropertySpaceSortOrder,
	getPropertySpaceTypeLabel,
	PROPERTY_SPACE_TYPE_OPTIONS,
} from '../../utils/propertySpaces';
import {
	AddSpaceButton,
	ArchivedSpacesPanel,
	ArchivedSpacesToggle,
	SpaceActions,
	SpaceCard,
	SpaceCardHeader,
	SpaceFormError,
	SpaceFormHint,
	SpaceNotes,
	SpacesContainer,
	SpacesEmptyState,
	SpacesGrid,
	SpacesHeader,
	SpacesHeading,
	SpacesStatus,
	SpaceTypeBadge,
	SpaceLinkedCount,
	SpaceDetailList,
	SpaceDetailItem,
	SpaceDetailEmpty,
} from './SpacesSection.styles';

interface SpacesSectionProps {
	property: Property;
	permissions?: RoleCapabilities;
}

const EMPTY_DRAFT: PropertySpaceDraft = {
	name: '',
	type: 'interior',
	notes: '',
};

const getMutationError = (error: unknown): string => {
	if (typeof error === 'string') return error;
	if (error && typeof error === 'object') {
		if ('message' in error && (error as { message?: unknown }).message) {
			return String((error as { message: unknown }).message);
		}
		if ('error' in error && (error as { error?: unknown }).error) {
			return String((error as { error: unknown }).error);
		}
		if ('data' in error) {
			const data = (error as { data?: unknown }).data;
			if (typeof data === 'string') return data;
			if (data && typeof data === 'object' && 'message' in data) {
				return String((data as { message?: unknown }).message || '');
			}
		}
	}
	return 'Maintley could not save this Space. Please try again.';
};

export const SpacesSection: React.FC<SpacesSectionProps> = ({
	property,
	permissions,
}) => {
	const navigate = useNavigate();
	const canManageSpaces = permissions?.canManageProperties ?? false;
	const accountId = String(property.accountId || property.userId || '').trim();
	const {
		data: spaces = [],
		isLoading,
		error: loadError,
	} = useGetPropertySpacesQuery(
		{ accountId, propertyId: property.id, includeArchived: true },
		{ skip: !accountId || !property.id },
	);
	const [createSpace, { isLoading: isCreating }] =
		useCreatePropertySpaceMutation();
	const [updateSpace, { isLoading: isUpdating }] =
		useUpdatePropertySpaceMutation();
	const { data: devices = [] } = useGetDevicesQuery(property.id, {
		skip: !property.id,
	});
	const { data: allTasks = [] } = useGetTasksQuery();
	const propertyTasks = useMemo(
		() => allTasks.filter((task) => String(task.propertyId || '') === property.id),
		[allTasks, property.id],
	);
	const { data: knowledgeLinks = [] } = useGetPropertyKnowledgeLinksQuery(
		{ accountId, propertyId: property.id },
		{ skip: !accountId || !property.id },
	);
	const [removeSpace, { isLoading: isRemoving }] =
		useRemovePropertySpaceMutation();
	const [restoreSpace, { isLoading: isRestoring }] =
		useRestorePropertySpaceMutation();
	const [editingSpace, setEditingSpace] = useState<PropertySpace | null>(null);
	const [spaceToDelete, setSpaceToDelete] = useState<PropertySpace | null>(
		null,
	);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [selectedSpace, setSelectedSpace] = useState<PropertySpace | null>(null);
	const [draft, setDraft] = useState<PropertySpaceDraft>(EMPTY_DRAFT);
	const [formError, setFormError] = useState('');
	const [actionError, setActionError] = useState('');
	const [showArchived, setShowArchived] = useState(false);
	const activeSpaces = useMemo(
		() => spaces.filter((space) => !space.isArchived),
		[spaces],
	);
	const archivedSpaces = useMemo(
		() => spaces.filter((space) => space.isArchived),
		[spaces],
	);

	const defaultSortOrder = useMemo(
		() => getNextPropertySpaceSortOrder(activeSpaces),
		[activeSpaces],
	);
	const equipmentBySpaceId = useMemo(() => {
		const deviceById = new Map(devices.map((device) => [String(device.id), device]));
		const result = new Map<string, typeof devices>();
		knowledgeLinks.forEach((link) => {
			if (
				link.fromType !== 'equipment' ||
				link.relationshipType !== 'located_in' ||
				link.toType !== 'space'
			) {
				return;
			}
			const device = deviceById.get(link.fromId);
			if (!device) return;
			const current = result.get(link.toId) || [];
			result.set(link.toId, [...current, device]);
		});
		return result;
	}, [devices, knowledgeLinks]);
	const tasksBySpaceId = useMemo(() => {
		const taskById = new Map(propertyTasks.map((task) => [String(task.id), task]));
		const result = new Map<string, typeof propertyTasks>();
		knowledgeLinks.forEach((link) => {
			if (
				link.fromType !== 'task' ||
				link.relationshipType !== 'occurs_in' ||
				link.toType !== 'space'
			) {
				return;
			}
			const task = taskById.get(link.fromId);
			if (!task) return;
			const current = result.get(link.toId) || [];
			result.set(link.toId, [...current, task]);
		});
		return result;
	}, [knowledgeLinks, propertyTasks]);
	const getSpaceReferenceCount = (spaceId: string) =>
		knowledgeLinks.filter(
			(link) => link.toType === 'space' && link.toId === spaceId,
		).length;

	const openCreateForm = () => {
		setActionError('');
		setEditingSpace(null);
		setDraft({ ...EMPTY_DRAFT, sortOrder: defaultSortOrder });
		setFormError('');
		setIsFormOpen(true);
	};

	const openEditForm = (space: PropertySpace) => {
		setActionError('');
		setEditingSpace(space);
		setDraft({
			name: space.name,
			type: space.type,
			notes: space.notes || '',
			sortOrder: space.sortOrder,
		});
		setFormError('');
		setIsFormOpen(true);
	};

	const closeForm = () => {
		if (isCreating || isUpdating) return;
		setIsFormOpen(false);
		setEditingSpace(null);
		setFormError('');
	};

	const handleSubmit = async () => {
		const name = draft.name.trim();
		if (!name) {
			setFormError('Enter a name for this Space.');
			return;
		}
		if (name.length > 80) {
			setFormError('Space names must be 80 characters or fewer.');
			return;
		}
		if ((draft.notes || '').length > 500) {
			setFormError('Space notes must be 500 characters or fewer.');
			return;
		}

		try {
			setFormError('');
			const normalizedDraft = { ...draft, name };
			if (editingSpace) {
				await updateSpace({
					id: editingSpace.id,
					updates: normalizedDraft,
				}).unwrap();
			} else {
				if (!accountId) {
					throw new Error('This property is missing its account connection.');
				}
				await createSpace({
					...normalizedDraft,
					accountId,
					propertyId: property.id,
				}).unwrap();
			}
			setIsFormOpen(false);
			setEditingSpace(null);
			setFormError('');
		} catch (error) {
			setFormError(getMutationError(error));
		}
	};

	const handleRemove = async () => {
		if (!spaceToDelete) return;
		try {
			setActionError('');
			const result = await removeSpace({
				spaceId: spaceToDelete.id,
				propertyId: property.id,
			}).unwrap();
			if (result.archived && selectedSpace?.id === spaceToDelete.id) {
				setSelectedSpace(null);
			}
			setSpaceToDelete(null);
		} catch (error) {
			setActionError(getMutationError(error));
			setSpaceToDelete(null);
		}
	};

	const handleRestore = async (space: PropertySpace) => {
		try {
			setActionError('');
			await restoreSpace({
				spaceId: space.id,
				propertyId: property.id,
			}).unwrap();
		} catch (error) {
			setActionError(getMutationError(error));
		}
	};

	const selectedEquipment = selectedSpace
		? equipmentBySpaceId.get(selectedSpace.id) || []
		: [];
	const selectedTasks = selectedSpace
		? tasksBySpaceId.get(selectedSpace.id) || []
		: [];

	return (
		<SpacesContainer aria-labelledby="property-spaces-heading">
			<SpacesHeader>
				<SpacesHeading>
					<h3 id="property-spaces-heading">Spaces</h3>
					<p>
						Describe the places that make up this property, including indoor,
						exterior, and outdoor areas.
					</p>
				</SpacesHeading>
				{canManageSpaces && (
					<AddSpaceButton type="button" onClick={openCreateForm}>
						Add Space
					</AddSpaceButton>
				)}
			</SpacesHeader>

			{isLoading && <SpacesStatus>Loading Spaces…</SpacesStatus>}
			{Boolean(loadError) && (
				<SpacesStatus>
					Maintley could not load this property’s Spaces.
				</SpacesStatus>
			)}
			{actionError && (
				<SpaceFormError role="alert">{actionError}</SpaceFormError>
			)}
			{!isLoading && !loadError && activeSpaces.length === 0 && (
				<SpacesEmptyState>
					<strong>No active Spaces</strong>
					<p>
						{archivedSpaces.length > 0
							? 'Restore an archived Space or add a new place for this property.'
							: 'Add places such as a Kitchen, Garage, Roof, Lawn, or Pool when they help describe the property.'}
					</p>
				</SpacesEmptyState>
			)}
			{activeSpaces.length > 0 && (
				<SpacesGrid>
					{activeSpaces.map((space) => (
						<SpaceCard key={space.id}>
							<SpaceCardHeader>
								<strong>{space.name}</strong>
								<SpaceTypeBadge>
									{getPropertySpaceTypeLabel(space.type)}
								</SpaceTypeBadge>
							</SpaceCardHeader>
							{space.notes && <SpaceNotes>{space.notes}</SpaceNotes>}
							<SpaceLinkedCount>
								{equipmentBySpaceId.get(space.id)?.length || 0} equipment -{' '}
								{tasksBySpaceId.get(space.id)?.length || 0} task
								{(tasksBySpaceId.get(space.id)?.length || 0) === 1 ? '' : 's'}
							</SpaceLinkedCount>
							<SpaceActions>
								<button type="button" onClick={() => setSelectedSpace(space)}>
									View
								</button>
							{canManageSpaces && (
								<>
									<button type="button" onClick={() => openEditForm(space)}>
										Edit
									</button>
									<button
										type="button"
										data-tone="danger"
										onClick={() => {
											setActionError('');
											setSpaceToDelete(space);
										}}
									>
										{getSpaceReferenceCount(space.id) > 0
											? 'Archive'
											: 'Remove'}
									</button>
								</>
							)}
							</SpaceActions>
						</SpaceCard>
					))}
				</SpacesGrid>
			)}

			{archivedSpaces.length > 0 && (
				<>
					<ArchivedSpacesToggle
						type="button"
						aria-expanded={showArchived}
						onClick={() => setShowArchived((current) => !current)}
					>
						{showArchived
							? 'Hide archived Spaces'
							: `View archived Spaces (${archivedSpaces.length})`}
					</ArchivedSpacesToggle>
					{showArchived && (
						<ArchivedSpacesPanel>
							<h4>Archived Spaces</h4>
							<SpacesGrid>
								{archivedSpaces.map((space) => (
									<SpaceCard key={space.id}>
										<SpaceCardHeader>
											<strong>{space.name}</strong>
											<SpaceTypeBadge>Archived</SpaceTypeBadge>
										</SpaceCardHeader>
										{space.notes && <SpaceNotes>{space.notes}</SpaceNotes>}
										<SpaceLinkedCount>
											{getSpaceReferenceCount(space.id)} connected record
											{getSpaceReferenceCount(space.id) === 1 ? '' : 's'}
										</SpaceLinkedCount>
										<SpaceActions>
											<button
												type="button"
												onClick={() => setSelectedSpace(space)}
											>
												View
											</button>
											{canManageSpaces && (
												<button
													type="button"
													disabled={isRestoring}
													onClick={() => handleRestore(space)}
												>
													Restore
												</button>
											)}
										</SpaceActions>
									</SpaceCard>
								))}
							</SpacesGrid>
						</ArchivedSpacesPanel>
					)}
				</>
			)}

			<GenericModal
				isOpen={isFormOpen}
				title={editingSpace ? 'Edit Space' : 'Add Space'}
				onClose={closeForm}
				onSubmit={handleSubmit}
				showActions
				compact
				primaryButtonLabel={editingSpace ? 'Save Space' : 'Add Space'}
				primaryButtonDisabled={!draft.name.trim()}
				isLoading={isCreating || isUpdating}
			>
				<SpaceFormHint>
					Use a specific name such as Living Room, Mechanical Room, Roof, or
					Lawn.
				</SpaceFormHint>
				{formError && <SpaceFormError role="alert">{formError}</SpaceFormError>}
				<FormGroup>
					<FormLabel htmlFor="space-name">Space name</FormLabel>
					<FormInput
						id="space-name"
						value={draft.name}
						maxLength={80}
						onChange={(event) =>
							setDraft((current) => ({ ...current, name: event.target.value }))
						}
						placeholder="Living Room"
						autoFocus
					/>
				</FormGroup>
				<FormGroup>
					<FormLabel htmlFor="space-type">Space type</FormLabel>
					<FormSelect
						id="space-type"
						value={draft.type}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								type: event.target.value as PropertySpaceType,
							}))
						}
					>
						{PROPERTY_SPACE_TYPE_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</FormSelect>
				</FormGroup>
				<FormGroup>
					<FormLabel htmlFor="space-sort-order">
						Display order (optional)
					</FormLabel>
					<FormInput
						id="space-sort-order"
						type="number"
						min="0"
						step="1"
						value={draft.sortOrder ?? ''}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								sortOrder:
									event.target.value === ''
										? undefined
										: Number(event.target.value),
							}))
						}
					/>
				</FormGroup>
				<FormGroup>
					<FormLabel htmlFor="space-notes">Notes (optional)</FormLabel>
					<FormTextarea
						id="space-notes"
						value={draft.notes || ''}
						maxLength={500}
						onChange={(event) =>
							setDraft((current) => ({ ...current, notes: event.target.value }))
						}
						placeholder="Add details that help identify this Space."
					/>
				</FormGroup>
			</GenericModal>

			<GenericModal
				isOpen={Boolean(spaceToDelete)}
				title={
					getSpaceReferenceCount(spaceToDelete?.id || '') > 0
						? 'Archive Space'
						: 'Remove Space'
				}
				onClose={() => setSpaceToDelete(null)}
				showActions
				primaryButtonLabel={
					getSpaceReferenceCount(spaceToDelete?.id || '') > 0
						? 'Archive Space'
						: 'Remove Space'
				}
				primaryButtonAction={handleRemove}
				primaryButtonDisabled={isRemoving}
				isLoading={isRemoving}
			>
				{getSpaceReferenceCount(spaceToDelete?.id || '') > 0 ? (
					<p>
						{spaceToDelete?.name} is connected to property records. Archiving keeps
						that location visible in the property record while removing it from
						new selections.
					</p>
				) : (
					<p>
						Remove {spaceToDelete?.name}? This Space has no connected records and
						will be permanently removed.
					</p>
				)}
			</GenericModal>

			<GenericModal
				isOpen={Boolean(selectedSpace)}
				title={selectedSpace?.name || 'Space'}
				onClose={() => setSelectedSpace(null)}
			>
				<SpaceFormHint>
					{selectedSpace
						? `${getPropertySpaceTypeLabel(selectedSpace.type)} Space`
						: ''}
				</SpaceFormHint>
				{selectedSpace?.notes && <SpaceNotes>{selectedSpace.notes}</SpaceNotes>}
				<h4>Equipment</h4>
				{selectedEquipment.length > 0 ? (
					<SpaceDetailList>
						{selectedEquipment.map((device) => (
							<SpaceDetailItem key={device.id}>
								<div>
									<strong>{device.type || 'Equipment'}</strong>
									<span>
										{[device.brand, device.model].filter(Boolean).join(' ') ||
											'No brand or model recorded'}
									</span>
								</div>
								<button
									type="button"
									onClick={() =>
										navigate(
											`/property/${property.slug}/device/${buildDeviceSlug(device)}`,
										)
									}
								>
									Open
								</button>
							</SpaceDetailItem>
						))}
					</SpaceDetailList>
				) : (
					<SpaceDetailEmpty>
						No equipment is connected to this Space yet. Edit an equipment
						record to add it here.
					</SpaceDetailEmpty>
				)}
				<h4>Tasks</h4>
				{selectedTasks.length > 0 ? (
					<SpaceDetailList>
						{selectedTasks.map((task) => (
							<SpaceDetailItem key={task.id}>
								<div>
									<strong>{task.title}</strong>
									<span>
										{task.status || 'Open'}
										{' - '}
										{getTaskTimingLabel(task)}
									</span>
								</div>
							</SpaceDetailItem>
						))}
					</SpaceDetailList>
				) : (
					<SpaceDetailEmpty>
						No tasks are connected to this Space yet. Add or edit a task to
						connect it here.
					</SpaceDetailEmpty>
				)}
			</GenericModal>
		</SpacesContainer>
	);
};
