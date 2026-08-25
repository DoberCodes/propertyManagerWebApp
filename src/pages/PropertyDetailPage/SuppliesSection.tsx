import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GenericModal } from '../../Components/Library/Modal';
import { BarcodeScannerModal } from '../../Components/Library/BarcodeScanner/BarcodeScannerModal';
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
import { usePropertyMemoryRecords } from '../../propertyKnowledge/usePropertyMemoryRecords';
import { documentIsLinkedToEndpoint } from '../../utils/propertyDocumentRelationships';
import {
	buildPropertySupplyDraftFromBarcode,
	findPropertySupplyByBarcode,
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
	SupplyHeaderActions,
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
	barcodeValue: '',
	partNumber: '',
	size: '',
	details: '',
	material: '',
	voltage: '',
	mervRating: '',
	compatibility: '',
	replacementInterval: '',
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
	const [searchParams, setSearchParams] = useSearchParams();
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
	const { documents: propertyDocuments } = usePropertyMemoryRecords(property);
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
	const [isScanOpen, setIsScanOpen] = useState(false);

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
	const equipmentContextId = String(searchParams.get('equipmentId') || '').trim();
	const requestedSupplyId = String(searchParams.get('supplyId') || '').trim();
	const requestedAction = String(searchParams.get('action') || '').trim();
	const equipmentContext = deviceById.get(equipmentContextId);
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
			linked.taskIds.length +
			propertyDocuments.filter((document) =>
				documentIsLinkedToEndpoint(
					document,
					knowledgeLinks,
					'supply',
					supplyId,
				),
			).length
		);
	};

	const openCreateForm = () => {
		setActionError('');
		setEditingSupply(null);
		setDraft(EMPTY_DRAFT);
		setConnections({
			...EMPTY_CONNECTIONS,
			equipmentIds: equipmentContextId ? [equipmentContextId] : [],
		});
		setFormError('');
		setIsFormOpen(true);
	};

	useEffect(() => {
		if (requestedAction !== 'add-supply' || !canManageSupplies) return;

		setActionError('');
		setEditingSupply(null);
		setDraft(EMPTY_DRAFT);
		setConnections({
			...EMPTY_CONNECTIONS,
			equipmentIds: equipmentContextId ? [equipmentContextId] : [],
		});
		setFormError('');
		setIsFormOpen(true);

		const nextParams = new URLSearchParams(searchParams);
		nextParams.delete('action');
		setSearchParams(nextParams, { replace: true });
	}, [
		canManageSupplies,
		equipmentContextId,
		requestedAction,
		searchParams,
		setSearchParams,
	]);

	useEffect(() => {
		if (!requestedSupplyId || selectedSupply?.id === requestedSupplyId) return;
		const requestedSupply = supplies.find(
			(supply) => supply.id === requestedSupplyId,
		);
		if (requestedSupply) setSelectedSupply(requestedSupply);
	}, [requestedSupplyId, selectedSupply?.id, supplies]);

	const openEditForm = (supply: PropertySupply) => {
		setActionError('');
		setEditingSupply(supply);
		setDraft({
			name: supply.name,
			type: supply.type,
			manufacturer: supply.manufacturer || '',
			modelOrSku: supply.modelOrSku || '',
			barcodeValue: supply.barcodeValue || '',
			partNumber: supply.partNumber || '',
			size: supply.size || '',
			details: supply.details || '',
			material: supply.material || '',
			voltage: supply.voltage || '',
			mervRating: supply.mervRating || '',
			compatibility: supply.compatibility || '',
			replacementInterval: supply.replacementInterval || '',
			notes: supply.notes || '',
		});
		setConnections(connectionsForSupply(supply.id));
		setFormError('');
		setIsFormOpen(true);
	};

	const handleBarcodeDetected = (rawValue: string) => {
		const existingSupply = findPropertySupplyByBarcode(supplies, rawValue);
		setIsScanOpen(false);
		if (existingSupply) {
			setSelectedSupply(existingSupply);
			setActionError(
				`${existingSupply.name} already uses this barcode. Maintley opened the existing Supply instead of creating a duplicate.`,
			);
			return;
		}
		setEditingSupply(null);
		setConnections({
			...EMPTY_CONNECTIONS,
			equipmentIds: equipmentContextId ? [equipmentContextId] : [],
		});
		setDraft(buildPropertySupplyDraftFromBarcode(rawValue));
		setFormError('');
		setActionError('');
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
	const selectedDocuments = selectedSupply
		? propertyDocuments.filter((document) =>
				documentIsLinkedToEndpoint(
					document,
					knowledgeLinks,
					'supply',
					selectedSupply.id,
				),
		  )
		: [];
	const selectableSpaceOptions = spaces
		.filter(
			(space) => !space.isArchived || connections.spaceIds.includes(space.id),
		)
		.map((space) => ({
			value: space.id,
			label: `${space.name}${space.isArchived ? ' (archived)' : ''}`,
		}));
	const visibleActiveSupplies = equipmentContextId
		? activeSupplies.filter((supply) =>
				connectionsForSupply(supply.id).equipmentIds.includes(equipmentContextId),
		  )
		: activeSupplies;
	const clearEquipmentContext = () => {
		const nextParams = new URLSearchParams(searchParams);
		nextParams.delete('equipmentId');
		setSearchParams(nextParams);
	};
	const closeSupplyDetails = () => {
		setSelectedSupply(null);
		if (!requestedSupplyId) return;
		const nextParams = new URLSearchParams(searchParams);
		nextParams.delete('supplyId');
		setSearchParams(nextParams, { replace: true });
	};

	return (
		<SuppliesContainer aria-labelledby="property-supplies-heading">
			<SuppliesHeader>
				<SuppliesHeading>
					<h3 id="property-supplies-heading">
						{equipmentContext
							? `Supplies for ${equipmentContext.type || 'Equipment'}`
							: 'Supplies'}
					</h3>
					<p>
						{equipmentContext
							? 'These property Supplies are connected to this equipment. New Supplies created here will be connected automatically.'
							: 'Save the filters, paint, parts, and products this property uses so the right details are easy to find later.'}
					</p>
				</SuppliesHeading>
				{canManageSupplies && (
					<SupplyHeaderActions>
						{equipmentContext && (
							<AddSupplyButton type="button" onClick={clearEquipmentContext}>
								View All
							</AddSupplyButton>
						)}
						<AddSupplyButton type="button" onClick={() => setIsScanOpen(true)}>
							Scan Barcode
						</AddSupplyButton>
						<AddSupplyButton type="button" onClick={openCreateForm}>
							Add Supply
						</AddSupplyButton>
					</SupplyHeaderActions>
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
			{!isLoading && !loadError && visibleActiveSupplies.length === 0 && (
				<SuppliesEmptyState>
					<strong>No active Supplies</strong>
					<p>
						{archivedSupplies.length > 0
							? 'Restore an archived Supply or add another product this property uses.'
							: 'Add an air filter size, paint color, replacement part, fertilizer, or another useful product detail.'}
					</p>
				</SuppliesEmptyState>
			)}
			{visibleActiveSupplies.length > 0 && (
				<SuppliesGrid>
					{visibleActiveSupplies.map((supply) => (
						<SupplyCard key={supply.id}>
							<SupplyCardHeader>
								<strong>{supply.name}</strong>
								<SupplyTypeBadge>
									{getPropertySupplyTypeLabel(supply.type)}
								</SupplyTypeBadge>
							</SupplyCardHeader>
							{(supply.manufacturer || supply.modelOrSku || supply.partNumber || supply.size) && (
								<SupplyMetadata>
									{supply.manufacturer && <span>{supply.manufacturer}</span>}
									{supply.modelOrSku && <span>{supply.modelOrSku}</span>}
									{supply.partNumber && <span>Part {supply.partNumber}</span>}
									{supply.size && <span>{supply.size}</span>}
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
					<FormLabel htmlFor="supply-barcode">Barcode or GTIN (optional)</FormLabel>
					<FormInput
						id="supply-barcode"
						value={draft.barcodeValue || ''}
						maxLength={512}
						onChange={(event) =>
							setDraft((current) => ({ ...current, barcodeValue: event.target.value }))
						}
						placeholder="Scan or enter the product code"
					/>
				</FormGroup>
				<FormGroup>
					<FormLabel htmlFor="supply-part-number">Part number (optional)</FormLabel>
					<FormInput
						id="supply-part-number"
						value={draft.partNumber || ''}
						maxLength={120}
						onChange={(event) =>
							setDraft((current) => ({ ...current, partNumber: event.target.value }))
						}
					/>
				</FormGroup>
				<FormGroup>
					<FormLabel htmlFor="supply-size">Size or specification (optional)</FormLabel>
					<FormInput
						id="supply-size"
						value={draft.size || ''}
						maxLength={120}
						onChange={(event) =>
							setDraft((current) => ({ ...current, size: event.target.value }))
						}
						placeholder="16 x 25 x 1, satin finish, 12 V"
					/>
				</FormGroup>
				<FormGroup>
					<FormLabel htmlFor="supply-replacement">Replacement interval (optional)</FormLabel>
					<FormInput
						id="supply-replacement"
						value={draft.replacementInterval || ''}
						maxLength={120}
						onChange={(event) =>
							setDraft((current) => ({ ...current, replacementInterval: event.target.value }))
						}
						placeholder="Every 3 months"
					/>
				</FormGroup>
				<details>
					<summary>More specifications</summary>
					<FormGroup>
						<FormLabel htmlFor="supply-merv">MERV rating (optional)</FormLabel>
						<FormInput
							id="supply-merv"
							value={draft.mervRating || ''}
							maxLength={40}
							onChange={(event) =>
								setDraft((current) => ({ ...current, mervRating: event.target.value }))
							}
							placeholder="MERV 11"
						/>
					</FormGroup>
					<FormGroup>
						<FormLabel htmlFor="supply-material">Material or finish (optional)</FormLabel>
						<FormInput
							id="supply-material"
							value={draft.material || ''}
							maxLength={120}
							onChange={(event) =>
								setDraft((current) => ({ ...current, material: event.target.value }))
							}
							placeholder="Satin white"
						/>
					</FormGroup>
					<FormGroup>
						<FormLabel htmlFor="supply-voltage">Voltage (optional)</FormLabel>
						<FormInput
							id="supply-voltage"
							value={draft.voltage || ''}
							maxLength={80}
							onChange={(event) =>
								setDraft((current) => ({ ...current, voltage: event.target.value }))
							}
							placeholder="12 V"
						/>
					</FormGroup>
					<FormGroup>
						<FormLabel htmlFor="supply-compatibility">Works with (optional)</FormLabel>
						<FormInput
							id="supply-compatibility"
							value={draft.compatibility || ''}
							maxLength={250}
							onChange={(event) =>
								setDraft((current) => ({ ...current, compatibility: event.target.value }))
							}
							placeholder="Compatible models or applications"
						/>
					</FormGroup>
					<FormGroup>
						<FormLabel htmlFor="supply-details">Product details (optional)</FormLabel>
						<FormTextarea
							id="supply-details"
							value={draft.details || ''}
							maxLength={500}
							onChange={(event) =>
								setDraft((current) => ({ ...current, details: event.target.value }))
							}
							placeholder="Other product specifications worth keeping"
						/>
					</FormGroup>
				</details>
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

			<BarcodeScannerModal
				isOpen={isScanOpen}
				title="Supply Barcode Scanner"
				defaultMethod="barcode"
				captureIntent="part"
				onClose={() => setIsScanOpen(false)}
				onDetected={handleBarcodeDetected}
			/>

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
				onClose={closeSupplyDetails}
			>
				<SupplyFormHint>
					{selectedSupply
						? getPropertySupplyTypeLabel(selectedSupply.type)
						: ''}
				</SupplyFormHint>
				{selectedSupply &&
					(selectedSupply.manufacturer ||
						selectedSupply.modelOrSku ||
						selectedSupply.partNumber ||
						selectedSupply.size ||
						selectedSupply.mervRating ||
						selectedSupply.material ||
						selectedSupply.voltage ||
						selectedSupply.compatibility ||
						selectedSupply.replacementInterval ||
						selectedSupply.barcodeValue) && (
						<SupplyMetadata>
							{selectedSupply.manufacturer && (
								<span>{selectedSupply.manufacturer}</span>
							)}
							{selectedSupply.modelOrSku && (
								<span>{selectedSupply.modelOrSku}</span>
							)}
							{selectedSupply.partNumber && (
								<span>Part {selectedSupply.partNumber}</span>
							)}
							{selectedSupply.size && <span>{selectedSupply.size}</span>}
							{selectedSupply.mervRating && (
								<span>{selectedSupply.mervRating}</span>
							)}
							{selectedSupply.material && <span>{selectedSupply.material}</span>}
							{selectedSupply.voltage && <span>{selectedSupply.voltage}</span>}
							{selectedSupply.compatibility && (
								<span>Works with {selectedSupply.compatibility}</span>
							)}
							{selectedSupply.replacementInterval && (
								<span>{selectedSupply.replacementInterval}</span>
							)}
							{selectedSupply.barcodeValue && (
								<span>Barcode {selectedSupply.barcodeValue}</span>
							)}
						</SupplyMetadata>
					)}
				{selectedSupply?.details && (
					<SupplyNotes>{selectedSupply.details}</SupplyNotes>
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
					<span>
						{selectedDocuments.length} document
						{selectedDocuments.length === 1 ? '' : 's'}
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
				<h4>Documents</h4>
				{selectedDocuments.length > 0 ? (
					<SupplyDetailList>
						{selectedDocuments.map((document) => (
							<SupplyDetailItem key={document.id}>
								<div>
									<strong>{document.fileName || document.name}</strong>
									<span>{document.category || 'Document'}</span>
								</div>
							</SupplyDetailItem>
						))}
					</SupplyDetailList>
				) : (
					<SupplyDetailEmpty>
						No documents are connected to this Supply yet.
					</SupplyDetailEmpty>
				)}
			</GenericModal>
		</SuppliesContainer>
	);
};
