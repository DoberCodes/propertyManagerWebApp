import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faBoxArchive,
	faCloudSun,
	faHouse,
	faLocationDot,
	faScrewdriverWrench,
	faStar,
	faTree,
} from '@fortawesome/free-solid-svg-icons';
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
import { useGetPropertySuppliesQuery } from '../../Redux/API/supplySlice';
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
import { getTaskTimeBucketId } from '../../tasks/taskTimeBuckets';
import { usePropertyMemoryRecords } from '../../propertyKnowledge/usePropertyMemoryRecords';
import {
	buildPropertySpaceOverview,
	type PropertySpaceOverview,
} from '../../propertyKnowledge/propertySpaceOverview';
import {
	getNextPropertySpaceSortOrder,
	getPropertySpaceTypeLabel,
	PROPERTY_SPACE_TYPE_OPTIONS,
} from '../../utils/propertySpaces';
import { getPropertySupplyTypeLabel } from '../../utils/propertySupplies';
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
	SpaceCardOpenArea,
	SpaceCardIcon,
	SpaceCardIdentityRow,
	SpaceCardTypeRow,
	SpaceCardSummary,
	SpaceCardMetric,
	SpaceNextAction,
	SpaceDetailIntro,
	SpaceDetailMetrics,
	SpaceDetailMetric,
	SpaceDetailGrid,
	SpaceDetailSection,
	SpaceDetailSectionHeader,
	SpaceDetailActions,
	SpaceMaintenanceDate,
} from './SpacesSection.styles';

interface SpacesSectionProps {
	property: Property;
	maintenanceHistoryRecords?: Record<string, any>[];
	permissions?: RoleCapabilities;
}

const EMPTY_DRAFT: PropertySpaceDraft = {
	name: '',
	type: 'interior',
	notes: '',
};

const SPACE_TYPE_ICONS = {
	interior: faHouse,
	utility: faScrewdriverWrench,
	storage: faBoxArchive,
	exterior: faCloudSun,
	grounds: faTree,
	amenity: faStar,
	other: faLocationDot,
} as const;

const getMaintenanceTitle = (record: Record<string, any>) =>
	String(
		record.title ||
			record.taskTitle ||
			record.servicePerformed ||
			record.description ||
			'Maintenance recorded',
	).trim();

const getMaintenanceDateLabel = (record: Record<string, any>) => {
	const raw =
		record.serviceDate ||
		record.completionDate ||
		record.date ||
		record.completedAt ||
		record.createdAt;
	if (!raw) return 'Date not recorded';
	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) return 'Date not recorded';
	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(parsed);
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
	maintenanceHistoryRecords = [],
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
	const { documents: propertyDocuments } = usePropertyMemoryRecords(property);
	const { data: supplies = [], isLoading: areSuppliesLoading } =
		useGetPropertySuppliesQuery(
			{ accountId, propertyId: property.id, includeArchived: true },
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
	const overviewBySpaceId = useMemo(
		() =>
			new Map<string, PropertySpaceOverview>(
				spaces.map((space) => [
					space.id,
					buildPropertySpaceOverview({
						spaceId: space.id,
						links: knowledgeLinks,
						equipment: devices,
						tasks: propertyTasks,
						supplies,
						documents: propertyDocuments,
						maintenanceHistory: maintenanceHistoryRecords,
					}),
				]),
			),
		[
			devices,
			knowledgeLinks,
			maintenanceHistoryRecords,
			propertyDocuments,
			propertyTasks,
			spaces,
			supplies,
		],
	);
	const getSpaceReferenceCount = (spaceId: string) =>
		knowledgeLinks.filter(
			(link) =>
				link.toType === 'space' &&
				link.toId === spaceId &&
				link.fromType !== 'document',
		).length + (overviewBySpaceId.get(spaceId)?.documents.length || 0);

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

	const selectedOverview = selectedSpace
		? overviewBySpaceId.get(selectedSpace.id)
		: undefined;
	const selectedEquipment = selectedOverview?.equipment || [];
	const selectedTasks = selectedOverview?.tasks || [];
	const selectedSupplies = selectedOverview?.supplies || [];
	const selectedDocuments = selectedOverview?.documents || [];
	const selectedMaintenance = selectedOverview?.recentMaintenance || [];

	const openPropertyTab = (
		tab: 'tasks' | 'supplies' | 'documents' | 'maintenance',
		params: Record<string, string> = {},
	) => {
		const search = new URLSearchParams({ tab, ...params });
		setSelectedSpace(null);
		navigate(`/property/${property.slug}?${search.toString()}`);
	};

	const openDocument = (document: (typeof selectedDocuments)[number]) => {
		const url = String(document.fileUrl || document.url || '').trim();
		if (!url) {
			openPropertyTab('documents');
			return;
		}
		window.open(url, '_blank', 'noopener,noreferrer');
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
					{activeSpaces.map((space) => {
						const overview = overviewBySpaceId.get(space.id);
						return (
						<SpaceCard key={space.id}>
							<SpaceCardOpenArea
								type="button"
								onClick={() => setSelectedSpace(space)}
								aria-label={`Open ${space.name} Space`}
							>
								<SpaceCardHeader>
									<SpaceCardTypeRow>
										<SpaceTypeBadge>
											{getPropertySpaceTypeLabel(space.type)}
										</SpaceTypeBadge>
									</SpaceCardTypeRow>
									<SpaceCardIdentityRow>
										<SpaceCardIcon aria-hidden="true">
											<FontAwesomeIcon icon={SPACE_TYPE_ICONS[space.type]} />
										</SpaceCardIcon>
										<strong>{space.name}</strong>
									</SpaceCardIdentityRow>
								</SpaceCardHeader>
								{space.notes && <SpaceNotes>{space.notes}</SpaceNotes>}
								<SpaceCardSummary>
									<SpaceCardMetric>
										<strong>{overview?.equipment.length || 0}</strong>
										<span>Equipment</span>
									</SpaceCardMetric>
									<SpaceCardMetric>
										<strong>{overview?.activeTasks.length || 0}</strong>
										<span>Open tasks</span>
									</SpaceCardMetric>
									<SpaceCardMetric>
										<strong>{overview?.supplies.length || 0}</strong>
										<span>Supplies</span>
									</SpaceCardMetric>
									<SpaceCardMetric>
										<strong>{overview?.documents.length || 0}</strong>
										<span>Documents</span>
									</SpaceCardMetric>
								</SpaceCardSummary>
								{overview?.overdueTaskCount ? (
									<SpaceNextAction data-tone="attention">
										{overview.overdueTaskCount} overdue task
										{overview.overdueTaskCount === 1 ? '' : 's'}
									</SpaceNextAction>
								) : overview?.nextTask ? (
									<SpaceNextAction>
										Next: {overview.nextTask.title} ·{' '}
										{getTaskTimingLabel(overview.nextTask)}
									</SpaceNextAction>
								) : (
									<SpaceNextAction>No open work connected</SpaceNextAction>
								)}
							</SpaceCardOpenArea>
							{canManageSpaces && (
							<SpaceActions>
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
							</SpaceActions>
							)}
						</SpaceCard>
						);
					})}
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
											<SpaceCardTypeRow>
												<SpaceTypeBadge>Archived</SpaceTypeBadge>
											</SpaceCardTypeRow>
											<strong>{space.name}</strong>
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
				<SpaceDetailIntro>
					<div>
						<SpaceCardIcon aria-hidden="true">
							{selectedSpace && (
								<FontAwesomeIcon icon={SPACE_TYPE_ICONS[selectedSpace.type]} />
							)}
						</SpaceCardIcon>
						<div>
							<strong>
								{selectedSpace
									? `${getPropertySpaceTypeLabel(selectedSpace.type)} Space`
									: ''}
							</strong>
							<span>
								Connected property records stay owned by the property and are
								shown here as one useful view.
							</span>
						</div>
					</div>
					{selectedSpace?.notes && <SpaceNotes>{selectedSpace.notes}</SpaceNotes>}
				</SpaceDetailIntro>

				<SpaceDetailMetrics>
					<SpaceDetailMetric>
						<strong>{selectedEquipment.length}</strong>
						<span>Equipment</span>
					</SpaceDetailMetric>
					<SpaceDetailMetric data-tone={selectedOverview?.overdueTaskCount ? 'attention' : undefined}>
						<strong>{selectedOverview?.activeTasks.length || 0}</strong>
						<span>
							{selectedOverview?.overdueTaskCount
								? `${selectedOverview.overdueTaskCount} overdue`
								: 'Open tasks'}
						</span>
					</SpaceDetailMetric>
					<SpaceDetailMetric>
						<strong>{selectedSupplies.length}</strong>
						<span>Supplies</span>
					</SpaceDetailMetric>
					<SpaceDetailMetric>
						<strong>{selectedDocuments.length}</strong>
						<span>Documents</span>
					</SpaceDetailMetric>
				</SpaceDetailMetrics>

				<SpaceDetailGrid>
					<SpaceDetailSection>
						<SpaceDetailSectionHeader>
							<div>
								<h4>Equipment</h4>
								<span>{selectedEquipment.length} connected</span>
							</div>
						</SpaceDetailSectionHeader>
						{selectedEquipment.length > 0 ? (
							<SpaceDetailList>
								{selectedEquipment.slice(0, 5).map((device) => (
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
								No equipment is connected yet. Edit an equipment record to add
								this Space.
							</SpaceDetailEmpty>
						)}
					</SpaceDetailSection>

					<SpaceDetailSection>
						<SpaceDetailSectionHeader>
							<div>
								<h4>Tasks</h4>
								<span>{selectedOverview?.activeTasks.length || 0} open</span>
							</div>
							<button type="button" onClick={() => openPropertyTab('tasks')}>
								View all
							</button>
						</SpaceDetailSectionHeader>
						{selectedTasks.length > 0 ? (
							<SpaceDetailList>
								{selectedTasks.slice(0, 5).map((task) => (
									<SpaceDetailItem key={task.id}>
										<div>
											<strong>{task.title}</strong>
											<span>
												{task.status || 'Open'} · {getTaskTimingLabel(task)}
												{selectedOverview?.activeTasks.some(
													(activeTask) => activeTask.id === task.id,
												) && getTaskTimeBucketId(task) === 'overdue'
													? ' · Overdue'
													: ''}
											</span>
										</div>
										<button type="button" onClick={() => navigate(`/tasks/${task.id}`)}>
											Open
										</button>
									</SpaceDetailItem>
								))}
							</SpaceDetailList>
						) : (
							<SpaceDetailEmpty>
								No tasks are connected yet. Add or edit a task to connect it here.
							</SpaceDetailEmpty>
						)}
					</SpaceDetailSection>

					<SpaceDetailSection>
						<SpaceDetailSectionHeader>
							<div>
								<h4>Supplies</h4>
								<span>{selectedSupplies.length} connected</span>
							</div>
							<button type="button" onClick={() => openPropertyTab('supplies')}>
								View all
							</button>
						</SpaceDetailSectionHeader>
						{areSuppliesLoading ? (
							<SpaceDetailEmpty>Loading connected Supplies…</SpaceDetailEmpty>
						) : selectedSupplies.length > 0 ? (
							<SpaceDetailList>
								{selectedSupplies.slice(0, 5).map((supply) => (
									<SpaceDetailItem key={supply.id}>
										<div>
											<strong>{supply.name}</strong>
											<span>
												{getPropertySupplyTypeLabel(supply.type)}
												{supply.isArchived ? ' · Archived' : ''}
											</span>
										</div>
										<button
											type="button"
											onClick={() => openPropertyTab('supplies', { supplyId: supply.id })}
										>
											Open
										</button>
									</SpaceDetailItem>
								))}
							</SpaceDetailList>
						) : (
							<SpaceDetailEmpty>
								No Supplies are connected yet. Edit a Supply to connect it here.
							</SpaceDetailEmpty>
						)}
					</SpaceDetailSection>

					<SpaceDetailSection>
						<SpaceDetailSectionHeader>
							<div>
								<h4>Documents</h4>
								<span>{selectedDocuments.length} connected</span>
							</div>
							<button type="button" onClick={() => openPropertyTab('documents')}>
								View all
							</button>
						</SpaceDetailSectionHeader>
						{selectedDocuments.length > 0 ? (
							<SpaceDetailList>
								{selectedDocuments.slice(0, 5).map((document) => (
									<SpaceDetailItem key={document.id}>
										<div>
											<strong>{document.fileName || document.name}</strong>
											<span>{document.category || 'Document'}</span>
										</div>
										<button type="button" onClick={() => openDocument(document)}>
											Open
										</button>
									</SpaceDetailItem>
								))}
							</SpaceDetailList>
						) : (
							<SpaceDetailEmpty>No documents are connected yet.</SpaceDetailEmpty>
						)}
					</SpaceDetailSection>
				</SpaceDetailGrid>

				<SpaceDetailSection>
					<SpaceDetailSectionHeader>
						<div>
							<h4>Recent maintenance</h4>
							<span>Derived from connected Equipment and Tasks</span>
						</div>
						<button type="button" onClick={() => openPropertyTab('maintenance')}>
							View history
						</button>
					</SpaceDetailSectionHeader>
					{selectedMaintenance.length > 0 ? (
						<SpaceDetailList>
							{selectedMaintenance.map((record, index) => (
								<SpaceDetailItem key={record.id || `maintenance-${index}`}>
									<div>
										<strong>{getMaintenanceTitle(record)}</strong>
										<SpaceMaintenanceDate>
											{getMaintenanceDateLabel(record)}
										</SpaceMaintenanceDate>
									</div>
								</SpaceDetailItem>
							))}
						</SpaceDetailList>
					) : (
						<SpaceDetailEmpty>
							No maintenance history is connected through this Space’s Equipment or
							Tasks yet.
						</SpaceDetailEmpty>
					)}
				</SpaceDetailSection>

				<SpaceDetailActions>
					{canManageSpaces && selectedSpace && (
						<button
							type="button"
							onClick={() => {
								const space = selectedSpace;
								setSelectedSpace(null);
								openEditForm(space);
							}}
						>
							Edit Space
						</button>
					)}
				</SpaceDetailActions>
			</GenericModal>
		</SpacesContainer>
	);
};
