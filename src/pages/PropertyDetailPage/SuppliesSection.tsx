import React, { useMemo, useState } from 'react';
import { GenericModal } from '../../Components/Library/Modal';
import { MultiSelect } from '../../Components/Library';
import {
	FormGroup,
	FormInput,
	FormLabel,
	FormSelect,
	FormTextarea,
} from '../../Components/Library/Modal/ModalStyles';
import { useGetDevicesQuery } from '../../Redux/API/deviceSlice';
import {
	useGetPropertyKnowledgeLinksQuery,
	useRemovePropertySupplyMutation,
	useRestorePropertySupplyMutation,
	useSetSupplyLinksMutation,
} from '../../Redux/API/propertyKnowledgeLinkSlice';
import {
	useCreatePropertySupplyMutation,
	useGetPropertySuppliesQuery,
	useUpdatePropertySupplyMutation,
} from '../../Redux/API/supplySlice';
import { useGetPropertySpacesQuery } from '../../Redux/API/spaceSlice';
import { useGetTasksQuery } from '../../Redux/API/taskSlice';
import { Property } from '../../types/Property.types';
import { getSupplyEndpointIds } from '../../types/PropertyKnowledgeLink.types';
import {
	PropertySupply,
	PropertySupplyDraft,
	PropertySupplyType,
} from '../../types/Supply.types';
import { RoleCapabilities } from '../../utils/permissions';
import {
	getPropertySupplyTypeLabel,
	PROPERTY_SUPPLY_TYPE_OPTIONS,
} from '../../utils/propertySupplies';
import {
	AddSupplyButton,
	ArchivedSuppliesPanel,
	ArchivedSuppliesToggle,
	SupplyActions,
	SupplyCard,
	SupplyCardHeader,
	SupplyConnectionFields,
	SupplyConnectionSummary,
	SupplyDetailEmpty,
	SupplyDetailItem,
	SupplyDetailList,
	SupplyFormError,
	SupplyFormHint,
	SupplyLinkedCount,
	SupplyMetadata,
	SupplyNotes,
	SuppliesContainer,
	SuppliesEmptyState,
	SuppliesGrid,
	SuppliesHeader,
	SuppliesHeading,
	SuppliesStatus,
	SupplyTypeBadge,
} from './SuppliesSection.styles';

interface SuppliesSectionProps {
	property: Property;
	permissions?: RoleCapabilities;
}

interface SupplyConnections {
	equipmentIds: string[];
	spaceIds: string[];
	taskIds: string[];
}

const EMPTY_DRAFT: PropertySupplyDraft = {
	name: '',
	type: 'filter',
	manufacturer: '',
	modelOrSku: '',
	notes: '',
};

const EMPTY_CONNECTIONS: SupplyConnections = {
	equipmentIds: [],
	spaceIds: [],
	taskIds: [],
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
	return 'Maintley could not save this Supply. Please try again.';
};

export const SuppliesSection: React.FC<SuppliesSectionProps> = ({
	property,
	permissions,
}) => {
	const canManageSupplies = permissions?.canManageProperties ?? false;
	const accountId = String(property.accountId || property.userId || '').trim();
	const {
		data: supplies = [],
		isLoading,
		error: loadError,
	} = useGetPropertySuppliesQuery(
		{ accountId, propertyId: property.id, includeArchived: true },
		{ skip: !accountId || !property.id },
	);
	const { data: spaces = [] } = useGetPropertySpacesQuery(
		{ accountId, propertyId: property.id, includeArchived: true },
		{ skip: !accountId || !property.id },
	);
	const { data: devices = [] } = useGetDevicesQuery(property.id, {
		skip: !property.id,
	});
	const { data: allTasks = [] } = useGetTasksQuery();
	const tasks = useMemo(
		() =>
			allTasks.filter((task) => String(task.propertyId || '') === property.id),
		[allTasks, property.id],
	);
	const { data: knowledgeLinks = [] } = useGetPropertyKnowledgeLinksQuery(
		{ accountId, propertyId: property.id },
		{ skip: !accountId || !property.id },
	);
	const [createSupply, { isLoading: isCreating }] =
		useCreatePropertySupplyMutation();
	const [updateSupply, { isLoading: isUpdating }] =
		useUpdatePropertySupplyMutation();
	const [setSupplyLinks, { isLoading: areLinksSaving }] =
		useSetSupplyLinksMutation();
	const [removeSupply, { isLoading: isRemoving }] =
		useRemovePropertySupplyMutation();
	const [restoreSupply, { isLoading: isRestoring }] =
		useRestorePropertySupplyMutation();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingSupply, setEditingSupply] = useState<PropertySupply | null>(
		null,
	);
	const [selectedSupply, setSelectedSupply] = useState<PropertySupply | null>(
		null,
	);
	const [supplyToDelete, setSupplyToDelete] = useState<PropertySupply | null>(
		null,
	);
	const [draft, setDraft] = useState<PropertySupplyDraft>(EMPTY_DRAFT);
	const [connections, setConnections] =
		useState<SupplyConnections>(EMPTY_CONNECTIONS);
	const [formError, setFormError] = useState('');
	const [actionError, setActionError] = useState('');
	const [showArchived, setShowArchived] = useState(false);

	const activeSupplies = useMemo(
		() => supplies.filter((supply) => !supply.isArchived),
		[supplies],
	);
	const archivedSupplies = useMemo(
		() => supplies.filter((supply) => supply.isArchived),
		[supplies],
	);
	const deviceById = useMemo(
		() => new Map(devices.map((device) => [String(device.id), device])),
		[devices],
	);
	const spaceById = useMemo(
		() => new Map(spaces.map((space) => [space.id, space])),
		[spaces],
	);
	const taskById = useMemo(
		() => new Map(tasks.map((task) => [String(task.id), task])),
		[tasks],
	);

	const connectionsForSupply = (supplyId: string): SupplyConnections => ({
		equipmentIds: getSupplyEndpointIds(knowledgeLinks, supplyId, 'equipment'),
		spaceIds: getSupplyEndpointIds(knowledgeLinks, supplyId, 'space'),
		taskIds: getSupplyEndpointIds(knowledgeLinks, supplyId, 'task'),
	});
	const referenceCount = (supplyId: string) => {
		const linked = connectionsForSupply(supplyId);
		return (
			linked.equipmentIds.length +
			linked.spaceIds.length +
			linked.taskIds.length
		);
	};

	const openCreateForm = () => {
		setActionError('');
		setEditingSupply(null);
		setDraft(EMPTY_DRAFT);
		setConnections(EMPTY_CONNECTIONS);
		setFormError('');
		setIsFormOpen(true);
	};

	const openEditForm = (supply: PropertySupply) => {
		setActionError('');
		setEditingSupply(supply);
		setDraft({
			name: supply.name,
			type: supply.type,
			manufacturer: supply.manufacturer || '',
			modelOrSku: supply.modelOrSku || '',
			notes: supply.notes || '',
		});
		setConnections(connectionsForSupply(supply.id));
		setFormError('');
		setIsFormOpen(true);
	};

	const closeForm = () => {
		if (isCreating || isUpdating || areLinksSaving) return;
		setIsFormOpen(false);
		setEditingSupply(null);
		setFormError('');
	};

	const handleSubmit = async () => {
		const name = draft.name.trim();
		if (!name) {
			setFormError('Enter a name for this Supply.');
			return;
		}
		if (name.length > 100) {
			setFormError('Supply names must be 100 characters or fewer.');
			return;
		}
		if ((draft.manufacturer || '').length > 100) {
			setFormError('Manufacturer names must be 100 characters or fewer.');
			return;
		}
		if ((draft.modelOrSku || '').length > 120) {
			setFormError('Model or SKU values must be 120 characters or fewer.');
			return;
		}
		if ((draft.notes || '').length > 1000) {
			setFormError('Supply notes must be 1,000 characters or fewer.');
			return;
		}

		try {
			setFormError('');
			const normalizedDraft = { ...draft, name };
			let supplyId = editingSupply?.id || '';
			if (editingSupply) {
				await updateSupply({
					id: editingSupply.id,
					updates: normalizedDraft,
				}).unwrap();
			} else {
				if (!accountId) {
					throw new Error('This property is missing its account connection.');
				}
				const created = await createSupply({
					...normalizedDraft,
					accountId,
					propertyId: property.id,
				}).unwrap();
				supplyId = created.id;
				// If connection saving fails, the next submit updates this record instead
				// of creating a duplicate Supply.
				setEditingSupply(created);
			}
			await setSupplyLinks({
				propertyId: property.id,
				supplyId,
				...connections,
			}).unwrap();
			setIsFormOpen(false);
			setEditingSupply(null);
		} catch (error) {
			setFormError(getMutationError(error));
		}
	};

	const handleRemove = async () => {
		if (!supplyToDelete) return;
		try {
			setActionError('');
			const result = await removeSupply({
				supplyId: supplyToDelete.id,
				propertyId: property.id,
			}).unwrap();
			if (result.archived && selectedSupply?.id === supplyToDelete.id) {
				setSelectedSupply(null);
			}
			setSupplyToDelete(null);
		} catch (error) {
			setActionError(getMutationError(error));
			setSupplyToDelete(null);
		}
	};

	const handleRestore = async (supply: PropertySupply) => {
		try {
			setActionError('');
			await restoreSupply({
				supplyId: supply.id,
				propertyId: property.id,
			}).unwrap();
		} catch (error) {
			setActionError(getMutationError(error));
		}
	};

	const selectedConnections = selectedSupply
		? connectionsForSupply(selectedSupply.id)
		: EMPTY_CONNECTIONS;
	const selectedEquipment = selectedConnections.equipmentIds
		.map((id) => deviceById.get(id))
		.filter(Boolean);
	const selectedSpaces = selectedConnections.spaceIds
		.map((id) => spaceById.get(id))
		.filter(Boolean);
	const selectedTasks = selectedConnections.taskIds
		.map((id) => taskById.get(id))
		.filter(Boolean);
	const selectableSpaceOptions = spaces
		.filter(
			(space) => !space.isArchived || connections.spaceIds.includes(space.id),
		)
		.map((space) => ({
			value: space.id,
			label: `${space.name}${space.isArchived ? ' (archived)' : ''}`,
		}));

	return (
		<SuppliesContainer aria-labelledby="property-supplies-heading">
			<SuppliesHeader>
				<SuppliesHeading>
					<h3 id="property-supplies-heading">Supplies</h3>
					<p>
						Save the filters, paint, parts, and products this property uses so
						the right details are easy to find later.
					</p>
				</SuppliesHeading>
				{canManageSupplies && (
					<AddSupplyButton type="button" onClick={openCreateForm}>
						Add Supply
					</AddSupplyButton>
				)}
			</SuppliesHeader>

			{isLoading && <SuppliesStatus>Loading Supplies…</SuppliesStatus>}
			{Boolean(loadError) && (
				<SuppliesStatus>
					Maintley could not load this property’s Supplies.
				</SuppliesStatus>
			)}
			{actionError && (
				<SupplyFormError role="alert">{actionError}</SupplyFormError>
			)}
			{!isLoading && !loadError && activeSupplies.length === 0 && (
				<SuppliesEmptyState>
					<strong>No active Supplies</strong>
					<p>
						{archivedSupplies.length > 0
							? 'Restore an archived Supply or add another product this property uses.'
							: 'Add an air filter size, paint color, replacement part, fertilizer, or another useful product detail.'}
					</p>
				</SuppliesEmptyState>
			)}
			{activeSupplies.length > 0 && (
				<SuppliesGrid>
					{activeSupplies.map((supply) => (
						<SupplyCard key={supply.id}>
							<SupplyCardHeader>
								<strong>{supply.name}</strong>
								<SupplyTypeBadge>
									{getPropertySupplyTypeLabel(supply.type)}
								</SupplyTypeBadge>
							</SupplyCardHeader>
							{(supply.manufacturer || supply.modelOrSku) && (
								<SupplyMetadata>
									{supply.manufacturer && <span>{supply.manufacturer}</span>}
									{supply.modelOrSku && <span>{supply.modelOrSku}</span>}
								</SupplyMetadata>
							)}
							{supply.notes && <SupplyNotes>{supply.notes}</SupplyNotes>}
							<SupplyLinkedCount>
								{referenceCount(supply.id)} connected record
								{referenceCount(supply.id) === 1 ? '' : 's'}
							</SupplyLinkedCount>
							<SupplyActions>
								<button type="button" onClick={() => setSelectedSupply(supply)}>
									View
								</button>
								{canManageSupplies && (
									<>
										<button type="button" onClick={() => openEditForm(supply)}>
											Edit
										</button>
										<button
											type="button"
											data-tone="danger"
											onClick={() => setSupplyToDelete(supply)}
										>
											{referenceCount(supply.id) > 0 ? 'Archive' : 'Remove'}
										</button>
									</>
								)}
							</SupplyActions>
						</SupplyCard>
					))}
				</SuppliesGrid>
			)}

			{archivedSupplies.length > 0 && (
				<>
					<ArchivedSuppliesToggle
						type="button"
						aria-expanded={showArchived}
						onClick={() => setShowArchived((current) => !current)}
					>
						{showArchived
							? 'Hide archived Supplies'
							: `View archived Supplies (${archivedSupplies.length})`}
					</ArchivedSuppliesToggle>
					{showArchived && (
						<ArchivedSuppliesPanel>
							<h4>Archived Supplies</h4>
							<SuppliesGrid>
								{archivedSupplies.map((supply) => (
									<SupplyCard key={supply.id}>
										<SupplyCardHeader>
											<strong>{supply.name}</strong>
											<SupplyTypeBadge>Archived</SupplyTypeBadge>
										</SupplyCardHeader>
										<SupplyLinkedCount>
											{referenceCount(supply.id)} connected record
											{referenceCount(supply.id) === 1 ? '' : 's'}
										</SupplyLinkedCount>
										<SupplyActions>
											<button
												type="button"
												onClick={() => setSelectedSupply(supply)}
											>
												View
											</button>
											{canManageSupplies && (
												<button
													type="button"
													disabled={isRestoring}
													onClick={() => handleRestore(supply)}
												>
													Restore
												</button>
											)}
										</SupplyActions>
									</SupplyCard>
								))}
							</SuppliesGrid>
						</ArchivedSuppliesPanel>
					)}
				</>
			)}

			<GenericModal
				isOpen={isFormOpen}
				title={editingSupply ? 'Edit Supply' : 'Add Supply'}
				onClose={closeForm}
				onSubmit={handleSubmit}
				showActions
				primaryButtonLabel={editingSupply ? 'Save Supply' : 'Add Supply'}
				primaryButtonDisabled={!draft.name.trim()}
				isLoading={isCreating || isUpdating || areLinksSaving}
			>
				<SupplyFormHint>
					Save the product details you would want the next time this item needs
					to be purchased or used.
				</SupplyFormHint>
				{formError && (
					<SupplyFormError role="alert">{formError}</SupplyFormError>
				)}
				<FormGroup>
					<FormLabel htmlFor="supply-name">Supply name</FormLabel>
					<FormInput
						id="supply-name"
						value={draft.name}
						maxLength={100}
						onChange={(event) =>
							setDraft((current) => ({ ...current, name: event.target.value }))
						}
						placeholder="16 x 25 x 1 air filter"
						autoFocus
					/>
				</FormGroup>
				<FormGroup>
					<FormLabel htmlFor="supply-type">Supply type</FormLabel>
					<FormSelect
						id="supply-type"
						value={draft.type}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								type: event.target.value as PropertySupplyType,
							}))
						}
					>
						{PROPERTY_SUPPLY_TYPE_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</FormSelect>
				</FormGroup>
				<FormGroup>
					<FormLabel htmlFor="supply-manufacturer">
						Manufacturer (optional)
					</FormLabel>
					<FormInput
						id="supply-manufacturer"
						value={draft.manufacturer || ''}
						maxLength={100}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								manufacturer: event.target.value,
							}))
						}
						placeholder="3M"
					/>
				</FormGroup>
				<FormGroup>
					<FormLabel htmlFor="supply-model">Model or SKU (optional)</FormLabel>
					<FormInput
						id="supply-model"
						value={draft.modelOrSku || ''}
						maxLength={120}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								modelOrSku: event.target.value,
							}))
						}
						placeholder="MPR 1000"
					/>
				</FormGroup>
				<FormGroup>
					<FormLabel htmlFor="supply-notes">Notes (optional)</FormLabel>
					<FormTextarea
						id="supply-notes"
						value={draft.notes || ''}
						maxLength={1000}
						onChange={(event) =>
							setDraft((current) => ({ ...current, notes: event.target.value }))
						}
						placeholder="Size, color, finish, rating, or another detail worth remembering"
					/>
				</FormGroup>
				<SupplyConnectionFields>
					<SupplyFormHint>
						Connect this Supply wherever it is used. You can select more than
						one record in each group.
					</SupplyFormHint>
					<FormGroup>
						<FormLabel>Equipment (optional)</FormLabel>
						<MultiSelect
							options={devices.map((device) => ({
								value: String(device.id),
								label: [device.type || 'Equipment', device.brand, device.model]
									.filter(Boolean)
									.join(' · '),
							}))}
							value={connections.equipmentIds}
							onChange={(equipmentIds) =>
								setConnections((current) => ({ ...current, equipmentIds }))
							}
							placeholder="Select equipment"
						/>
					</FormGroup>
					<FormGroup>
						<FormLabel>Spaces (optional)</FormLabel>
						<MultiSelect
							options={selectableSpaceOptions}
							value={connections.spaceIds}
							onChange={(spaceIds) =>
								setConnections((current) => ({ ...current, spaceIds }))
							}
							placeholder="Select Spaces"
						/>
					</FormGroup>
					<FormGroup>
						<FormLabel>Tasks (optional)</FormLabel>
						<MultiSelect
							options={tasks.map((task) => ({
								value: String(task.id),
								label: task.title,
							}))}
							value={connections.taskIds}
							onChange={(taskIds) =>
								setConnections((current) => ({ ...current, taskIds }))
							}
							placeholder="Select Tasks"
						/>
					</FormGroup>
				</SupplyConnectionFields>
			</GenericModal>

			<GenericModal
				isOpen={Boolean(supplyToDelete)}
				title={
					referenceCount(supplyToDelete?.id || '') > 0
						? 'Archive Supply'
						: 'Remove Supply'
				}
				onClose={() => !isRemoving && setSupplyToDelete(null)}
				onSubmit={handleRemove}
				showActions
				primaryButtonLabel={
					referenceCount(supplyToDelete?.id || '') > 0
						? 'Archive Supply'
						: 'Remove Supply'
				}
				isLoading={isRemoving}
			>
				{referenceCount(supplyToDelete?.id || '') > 0 ? (
					<p>
						{supplyToDelete?.name} is connected to property records. Archiving
						keeps those connections visible while removing it from new
						selections.
					</p>
				) : (
					<p>
						Remove {supplyToDelete?.name}? This Supply has no connected records
						and will be permanently removed.
					</p>
				)}
			</GenericModal>

			<GenericModal
				isOpen={Boolean(selectedSupply)}
				title={selectedSupply?.name || 'Supply'}
				onClose={() => setSelectedSupply(null)}
			>
				<SupplyFormHint>
					{selectedSupply
						? getPropertySupplyTypeLabel(selectedSupply.type)
						: ''}
				</SupplyFormHint>
				{selectedSupply &&
					(selectedSupply.manufacturer || selectedSupply.modelOrSku) && (
						<SupplyMetadata>
							{selectedSupply.manufacturer && (
								<span>{selectedSupply.manufacturer}</span>
							)}
							{selectedSupply.modelOrSku && (
								<span>{selectedSupply.modelOrSku}</span>
							)}
						</SupplyMetadata>
					)}
				{selectedSupply?.notes && (
					<SupplyNotes>{selectedSupply.notes}</SupplyNotes>
				)}
				<SupplyConnectionSummary>
					<span>{selectedEquipment.length} equipment</span>
					<span>
						{selectedSpaces.length} Space
						{selectedSpaces.length === 1 ? '' : 's'}
					</span>
					<span>
						{selectedTasks.length} task{selectedTasks.length === 1 ? '' : 's'}
					</span>
				</SupplyConnectionSummary>
				<h4>Equipment</h4>
				{selectedEquipment.length > 0 ? (
					<SupplyDetailList>
						{selectedEquipment.map(
							(device) =>
								device && (
									<SupplyDetailItem key={device.id}>
										<div>
											<strong>{device.type || 'Equipment'}</strong>
											<span>
												{[device.brand, device.model]
													.filter(Boolean)
													.join(' ') || 'No brand or model recorded'}
											</span>
										</div>
									</SupplyDetailItem>
								),
						)}
					</SupplyDetailList>
				) : (
					<SupplyDetailEmpty>
						No equipment is connected to this Supply yet.
					</SupplyDetailEmpty>
				)}
				<h4>Spaces</h4>
				{selectedSpaces.length > 0 ? (
					<SupplyDetailList>
						{selectedSpaces.map(
							(space) =>
								space && (
									<SupplyDetailItem key={space.id}>
										<div>
											<strong>{space.name}</strong>
								<span>{space.isArchived ? 'Archived Space' : space.type}</span>
										</div>
									</SupplyDetailItem>
								),
						)}
					</SupplyDetailList>
				) : (
					<SupplyDetailEmpty>
						No Spaces are connected to this Supply yet.
					</SupplyDetailEmpty>
				)}
				<h4>Tasks</h4>
				{selectedTasks.length > 0 ? (
					<SupplyDetailList>
						{selectedTasks.map(
							(task) =>
								task && (
									<SupplyDetailItem key={task.id}>
										<div>
											<strong>{task.title}</strong>
											<span>{task.status || 'Open'}</span>
										</div>
									</SupplyDetailItem>
								),
						)}
					</SupplyDetailList>
				) : (
					<SupplyDetailEmpty>
						No Tasks are connected to this Supply yet.
					</SupplyDetailEmpty>
				)}
			</GenericModal>
		</SuppliesContainer>
	);
};
