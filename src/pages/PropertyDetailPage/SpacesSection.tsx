import React, { useMemo, useState } from 'react';
import {
	GenericModal,
	DeleteConfirmationModal,
} from '../../Components/Library/Modal';
import {
	FormGroup,
	FormInput,
	FormLabel,
	FormSelect,
	FormTextarea,
} from '../../Components/Library/Modal/ModalStyles';
import {
	useCreatePropertySpaceMutation,
	useDeletePropertySpaceMutation,
	useGetPropertySpacesQuery,
	useUpdatePropertySpaceMutation,
} from '../../Redux/API/spaceSlice';
import { Property } from '../../types/Property.types';
import {
	PropertySpace,
	PropertySpaceDraft,
	PropertySpaceType,
} from '../../types/Space.types';
import { RoleCapabilities } from '../../utils/permissions';
import {
	getNextPropertySpaceSortOrder,
	getPropertySpaceTypeLabel,
	PROPERTY_SPACE_TYPE_OPTIONS,
} from '../../utils/propertySpaces';
import {
	AddSpaceButton,
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
	const canManageSpaces = permissions?.canManageProperties ?? false;
	const accountId = String(property.accountId || property.userId || '').trim();
	const {
		data: spaces = [],
		isLoading,
		error: loadError,
	} = useGetPropertySpacesQuery(
		{ accountId, propertyId: property.id },
		{ skip: !accountId || !property.id },
	);
	const [createSpace, { isLoading: isCreating }] =
		useCreatePropertySpaceMutation();
	const [updateSpace, { isLoading: isUpdating }] =
		useUpdatePropertySpaceMutation();
	const [deleteSpace, { isLoading: isDeleting }] =
		useDeletePropertySpaceMutation();
	const [editingSpace, setEditingSpace] = useState<PropertySpace | null>(null);
	const [spaceToDelete, setSpaceToDelete] = useState<PropertySpace | null>(
		null,
	);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [draft, setDraft] = useState<PropertySpaceDraft>(EMPTY_DRAFT);
	const [formError, setFormError] = useState('');
	const [actionError, setActionError] = useState('');

	const defaultSortOrder = useMemo(
		() => getNextPropertySpaceSortOrder(spaces),
		[spaces],
	);

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

	const handleDelete = async () => {
		if (!spaceToDelete) return;
		try {
			setActionError('');
			await deleteSpace(spaceToDelete.id).unwrap();
			setSpaceToDelete(null);
		} catch (error) {
			setActionError(getMutationError(error));
			setSpaceToDelete(null);
		}
	};

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
			{!isLoading && !loadError && spaces.length === 0 && (
				<SpacesEmptyState>
					<strong>No Spaces added yet</strong>
					<p>
						Add places such as a Kitchen, Garage, Roof, Lawn, or Pool when they
						help describe the property.
					</p>
				</SpacesEmptyState>
			)}
			{spaces.length > 0 && (
				<SpacesGrid>
					{spaces.map((space) => (
						<SpaceCard key={space.id}>
							<SpaceCardHeader>
								<strong>{space.name}</strong>
								<SpaceTypeBadge>
									{getPropertySpaceTypeLabel(space.type)}
								</SpaceTypeBadge>
							</SpaceCardHeader>
							{space.notes && <SpaceNotes>{space.notes}</SpaceNotes>}
							{canManageSpaces && (
								<SpaceActions>
									<button type="button" onClick={() => openEditForm(space)}>
										Edit
									</button>
									<button
										type="button"
										onClick={() => {
											setActionError('');
											setSpaceToDelete(space);
										}}
									>
										Remove
									</button>
								</SpaceActions>
							)}
						</SpaceCard>
					))}
				</SpacesGrid>
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

			<DeleteConfirmationModal
				isOpen={Boolean(spaceToDelete)}
				itemName={spaceToDelete?.name || ''}
				itemType="Space"
				onConfirm={handleDelete}
				onCancel={() => setSpaceToDelete(null)}
				isLoading={isDeleting}
			/>
		</SpacesContainer>
	);
};
