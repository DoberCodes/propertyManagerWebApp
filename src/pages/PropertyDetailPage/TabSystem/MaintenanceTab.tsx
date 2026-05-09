import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	GenericModal,
	FormGroup,
	FormLabel,
	FormSelect,
} from 'Components/Library';
import { WarningDialog } from 'Components/Library/WarningDialog';
import {
	SectionContainer,
	SectionHeader,
} from 'Components/Library/InfoCards/InfoCardStyles';
import {
	Toolbar,
	ToolbarButton,
	ContentWrapper,
	TabSummaryBar,
	TabSummaryPill,
} from './index.styles';
import { getDeviceNameUtil } from '../PropertyDetailPage.utils';
import {
	FilterBar,
	FilterConfig,
	FilterValues,
} from 'Components/Library/FilterBar';
import { applyFilters } from 'utils/tableFilters';
import { AddMaintenanceHistoryModal } from 'Components/Library/Modal/AddMaintenanceHistoryModal';
import { useSelector } from 'react-redux';
import { ReusableTable, Column } from 'Components/Library/ReusableTable';
// bring in the shared action button style used throughout tables
import { ActionButton } from 'Components/Library/ReusableTable/ReusableTable.styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEye, faArrowUpAZ } from '@fortawesome/free-solid-svg-icons';
import { UnifiedMaintenanceHistory } from 'Components/UnifiedMaintenanceHistory';
import {
	formatCurrency,
	getFinancialDisplayTotal,
} from 'utils/financialUtils';
import {
	ActiveFilterChips,
	ActiveFilterChip,
	ActiveFilterChipClear,
} from './mobileUiShared';
import { TaskFinancials } from 'types/Task.types';

export interface MaintenanceTabProps {
	property: any;
	maintenanceHistoryRecords?: any[];
	units?: any[];
	teamMembers?: any[];
	contractors?: any[];
	familyMembers?: any[];
	sharedUsers?: any[];
	tasks?: any[];
	onAddMaintenanceHistory?: (data: {
		title: string;
		completionDate: string;
		completedBy?: string;
		completedByName?: string;
		completionNotes?: string;
		unitId?: string;
		completionFile?: File;
		recurringTaskId?: string;
		linkedTaskIds?: string[];
		financials?: TaskFinancials;
	}) => void;
	onUpdateMaintenanceHistory?: (id: string, updates: Partial<any>) => void;
	onDeleteMaintenanceHistory?: (historyId: string) => void;
}

export const MaintenanceTab = ({
	property,
	maintenanceHistoryRecords = [],
	units = [],
	teamMembers = [],
	contractors = [],
	familyMembers = [],
	sharedUsers = [],
	onAddMaintenanceHistory,
	onUpdateMaintenanceHistory,
	onDeleteMaintenanceHistory,
}: MaintenanceTabProps) => {
	const navigate = useNavigate();
	const [filters, setFilters] = useState<FilterValues>({});
	const [showAddModal, setShowAddModal] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [sortBy, setSortBy] = useState<'dateDesc' | 'dateAsc' | 'title'>('dateDesc');
	const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(
		new Set(),
	);
	const [showBulkGroupModal, setShowBulkGroupModal] = useState(false);
	// dialog for deletions
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteDialogMessage, setDeleteDialogMessage] = useState('');
	const [pendingDeleteAction, setPendingDeleteAction] = useState<
		() => Promise<void>
	>(() => async () => {});
	const canBulkEdit = Boolean(onUpdateMaintenanceHistory);

	const { isMobile } = useSelector((state: any) => state.app);

	const handleGroupID = (record: any) => {
		const getMaintenanceGroupId = (record: any): string | undefined => {
			return record.maintenanceGroupId;
		};

		return getMaintenanceGroupId(record) || record.id;
	};
	const handleSelectionLink = (record) => {
		const recordGroupId = handleGroupID(record);

		return recordGroupId && !record.isLegacy
			? `/property/${property.slug}/maintenance-history/${encodeURIComponent(
					recordGroupId,
			  )}`
			: null;
	};

	const createMaintenanceGroupId = () => {
		if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
			return `mg-${crypto.randomUUID()}`;
		}
		return `mg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
	};

	const handleBulkGroupRecords = async (selectedGroupId: string) => {
		const groupId =
			selectedGroupId === '__new__'
				? createMaintenanceGroupId()
				: selectedGroupId;
		if (!groupId) return;

		try {
			// Collect all records for updating
			const allRecords = [
				...Object.values(groupedRecords.groups).flat(),
				...groupedRecords.ungrouped,
			];

			const selectedRecords = Array.from(selectedRecordIds)
				.map((id) => allRecords.find((r) => r.id === id))
				.filter((r) => r !== undefined);

			// Update all selected records with the maintenanceGroupId
			for (const record of selectedRecords) {
				if (onUpdateMaintenanceHistory) {
					await onUpdateMaintenanceHistory(record.id, {
						maintenanceGroupId: groupId,
					});
				}
			}

			setSelectedRecordIds(new Set());
			setShowBulkGroupModal(false);
		} catch (error) {
			console.error('Error grouping maintenance history:', error);
			// Handle error - could show toast notification
		}
	};

	const handleDeleteGroup = async (records: any[]) => {
		if (!onDeleteMaintenanceHistory) return;

		const deletableRecords = records.filter(
			(record) => !record.isLegacy && record.id,
		);
		if (deletableRecords.length === 0) {
			window.alert(
				'No deletable maintenance history records found in this group.',
			);
			return;
		}

		// ask via dialog instead of window.confirm
		setDeleteDialogMessage(
			`Delete ${deletableRecords.length} maintenance history record(s) in this group? This cannot be undone. Linked tasks will not be deleted.`,
		);
		setPendingDeleteAction(() => async () => {
			for (const record of deletableRecords) {
				await onDeleteMaintenanceHistory(record.id);
			}
			navigate(`/property/${property?.slug || ''}`);
		});
		setDeleteDialogOpen(true);
	};

	const completedByLookup = useMemo(() => {
		const lookup = new Map<string, string>();

		sharedUsers
			.filter((share: any) => share.sharedWithUserId)
			.forEach((share: any) => {
				const fullName =
					share.sharedWithFirstName && share.sharedWithLastName
						? `${share.sharedWithFirstName} ${share.sharedWithLastName}`
						: share.sharedWithEmail?.split('@')[0] || 'Shared User';
				lookup.set(share.sharedWithUserId, fullName);
			});

		teamMembers.forEach((member: any) => {
			const name = `${member.firstName || ''} ${member.lastName || ''}`.trim();
			if (name) {
				lookup.set(member.id, name);
			}
		});

		contractors.forEach((contractor: any) => {
			const name = contractor.companyName || contractor.name || 'Contractor';
			lookup.set(contractor.id, name);
		});

		familyMembers.forEach((member: any) => {
			const name = `${member.firstName || ''} ${member.lastName || ''}`.trim();
			if (name) {
				lookup.set(member.id, name);
			}
		});

		return lookup;
	}, [sharedUsers, teamMembers, contractors, familyMembers]);

	const resolveCompletedByName = useCallback(
		(record: any) => {
			const completedById =
				record.completedBy || record.approvedBy || record.assignee || '';
			return (
				record.completedByName ||
				completedByLookup.get(completedById) ||
				undefined
			);
		},
		[completedByLookup],
	);

	const handleNavigation = (record: any) => {
		const slugLink = handleSelectionLink(record);
		if (slugLink) {
			navigate(slugLink);
		}
	};

	// Filter configuration for maintenance history
	const maintenanceFilters: FilterConfig[] = [
		// Only show unit filter for Multi-Family properties
		...(property?.propertyType === 'Multi-Family'
			? [
					{
						key: 'unit',
						label: 'Unit',
						type: 'select' as const,
						options: [
							{ value: 'all', label: 'All Units' },
							...units.map((unit) => ({
								value: unit.id,
								label: unit.unitNumber || unit.address || `Unit ${unit.id}`,
							})),
						],
					},
			  ]
			: []),
		{
			key: 'completedBy',
			label: 'Completed By',
			type: 'select' as const,
			options: [
				{ value: 'unassigned', label: 'Unassigned' },
				// Dynamically populate with users from existing records
				...Array.from(
					new Set(
						maintenanceHistoryRecords
							.filter(
								(record) =>
									record.completedBy || record.approvedBy || record.assignee,
							)
							.map((record) => ({
								id: record.completedBy || record.approvedBy || record.assignee,
								name: record.completedByName || 'Unknown User',
							}))
							.filter(
								(user, index, self) =>
									index === self.findIndex((u) => u.name === user.name),
							),
					),
				).map((user) => ({
					value: user.id,
					label: user.name,
				})),
			],
		},
		{
			key: 'completionDate',
			label: 'Completion Date',
			type: 'daterange' as const,
		},
	];

	// Combine all maintenance records for filtering
	const allMaintenanceRecords = useMemo(
		() => [
			...maintenanceHistoryRecords.map((record) => ({
				...record,
				completionDate:
					record.completionDate || record.approvedAt || record.dueDate,
				title: record.title || record.taskTitle || 'Task',
				completedBy: record.completedBy || record.approvedBy || record.assignee,
				completedByName: resolveCompletedByName(record),
				notes: record.completionNotes || record.notes,
				isLegacy: false,
				groupId: record.maintenanceGroupId, // Ensure groupId is included
			})),
			...(property.maintenanceHistory || []).map(
				(record: any, index: number) => ({
					id: `legacy-${index}`,
					completionDate: record.date,
					title: record.description,
					completedBy: getDeviceNameUtil(record.deviceId, property),
					completedByName: getDeviceNameUtil(record.deviceId, property),
					groupId: record.maintenanceGroupId || null, // Add groupId for legacy records
					notes: '-',
					isLegacy: true,
				}),
			),
		],
		[maintenanceHistoryRecords, property, resolveCompletedByName],
	);

	// Apply filters to maintenance records
	const filteredRecords = useMemo(() => {
		let records = applyFilters(allMaintenanceRecords, filters, {
			textFields: ['title', 'notes'],
			selectFields: [{ field: 'completedBy', filterKey: 'completedBy' }],
			dateRangeFields: [
				{ field: 'completionDate', filterKey: 'completionDate' },
			],
		});

		// Apply unit filter separately (only for Multi-Family properties)
		if (
			property?.propertyType === 'Multi-Family' &&
			filters.unit &&
			filters.unit !== 'all'
		) {
			records = records.filter((record: any) => {
				// For unit-level maintenance, check if the record's unitId matches
				if (record.unitId) {
					return record.unitId === filters.unit;
				}
				// For property-level maintenance, only show if no unit filter is applied
				return false;
			});
		}

		return records.sort((a, b) => {
			if (sortBy === 'title') {
				return (a.title || '').localeCompare(b.title || '');
			}

			const timeA = a.completionDate ? new Date(a.completionDate).getTime() : 0;
			const timeB = b.completionDate ? new Date(b.completionDate).getTime() : 0;
			return sortBy === 'dateAsc' ? timeA - timeB : timeB - timeA;
		});
	}, [allMaintenanceRecords, filters, property?.propertyType, sortBy]);

	const activeFilterChips = useMemo(() => {
		const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
		if (filters.search) {
			chips.push({
				key: 'search',
				label: `Search: ${filters.search}`,
				onRemove: () => setFilters((prev) => ({ ...prev, search: '' })),
			});
		}

		if (filters.completedBy) {
			chips.push({
				key: 'completedBy',
				label: `Completed By: ${filters.completedBy}`,
				onRemove: () =>
					setFilters((prev) => ({
						...prev,
						completedBy: '',
					})),
			});
		}

		if (filters.unit && filters.unit !== 'all') {
			chips.push({
				key: 'unit',
				label: `Unit: ${filters.unit}`,
				onRemove: () => setFilters((prev) => ({ ...prev, unit: 'all' })),
			});
		}

		if (filters.completionDate_start || filters.completionDate_end) {
			chips.push({
				key: 'completionDate',
				label: `Date: ${filters.completionDate_start || '...'} to ${filters.completionDate_end || '...'}`,
				onRemove: () =>
					setFilters((prev) => ({
						...prev,
						completionDate_start: '',
						completionDate_end: '',
					})),
			});
		}

		return chips;
	}, [filters]);

	const getMaintenanceGroupId = (record: any): string | undefined => {
		return record.maintenanceGroupId;
	};

	// Group maintenance records by maintenance group ID
	const groupedRecords = useMemo(() => {
		const groups: { [key: string]: any[] } = {};
		const ungrouped: any[] = [];

		filteredRecords.forEach((record) => {
			const groupId = getMaintenanceGroupId(record);
			if (groupId) {
				if (!groups[groupId]) {
					groups[groupId] = [];
				}
				groups[groupId].push(record);
			} else {
				ungrouped.push(record);
			}
		});

		// Sort records within each group by completion date (newest first)
		Object.keys(groups).forEach((key) => {
			groups[key].sort(
				(a, b) =>
					new Date(b.completionDate).getTime() -
					new Date(a.completionDate).getTime(),
			);
		});

		// Sort ungrouped records by completion date (newest first)
		ungrouped.sort(
			(a, b) =>
				new Date(b.completionDate).getTime() -
				new Date(a.completionDate).getTime(),
		);

		return { groups, ungrouped };
	}, [filteredRecords]);

	const maintenanceGroupOptions = useMemo(
		() =>
			Object.entries(groupedRecords.groups).map(([groupId, records]) => ({
				value: groupId,
				label: `${records[0]?.title || 'Maintenance'} (${
					records.length
				} items)`,
			})),
		[groupedRecords.groups],
	);

	const columns: Column<any>[] = [
		{
			header: 'Date',
			key: 'completionDate',
			render: (value) => (value ? new Date(value).toLocaleDateString() : '-'),
		},
		{ header: 'Title', key: 'title' },
		{ header: 'Notes', key: 'notes' },
		{
			header: 'Cost',
			key: 'financials',
			render: (_unused, row) =>
				formatCurrency(
					getFinancialDisplayTotal(row.financials),
					row.financials?.currency || 'USD',
				),
		},
		{
			header: 'Actions',
			key: 'actions',
			render: (_, row) => (
				<div style={{ display: 'flex', gap: '8px' }}>
					{onDeleteMaintenanceHistory && (
						<ActionButton
							className='delete'
							onClick={() => {
								handleDeleteGroup(groupedRecords.groups[row.groupId] || [row]);
							}}>
							<FontAwesomeIcon icon={faTrash} />
						</ActionButton>
					)}
					<ActionButton
						onClick={() => {
							const slugLink = handleSelectionLink(row);
							navigate(slugLink || '/');
						}}>
						<FontAwesomeIcon icon={faEye} />
					</ActionButton>
				</div>
			),
		},
	];

	return (
		<SectionContainer>
			<WarningDialog
				open={deleteDialogOpen}
				title='Confirm Deletion'
				message={deleteDialogMessage}
				confirmText='Delete'
				cancelText='Cancel'
				onConfirm={async () => {
					setDeleteDialogOpen(false);
					await pendingDeleteAction();
				}}
				onCancel={() => setDeleteDialogOpen(false)}
			/>
			<SectionHeader>Maintenance History</SectionHeader>
			<TabSummaryBar>
				<TabSummaryPill>Total: {filteredRecords.length}</TabSummaryPill>
				<TabSummaryPill>
					This Month:{' '}
					{
						filteredRecords.filter((record) => {
							if (!record.completionDate) return false;
							const date = new Date(record.completionDate);
							const now = new Date();
							return (
								date.getMonth() === now.getMonth() &&
								date.getFullYear() === now.getFullYear()
							);
						}).length
					}
				</TabSummaryPill>
			</TabSummaryBar>

			{/* Toolbar with Add button */}
			<Toolbar
				style={{
					marginBottom: isMobile ? '12px' : undefined,
					justifyContent: isMobile ? 'stretch' : undefined,
				}}>
				<ToolbarButton
					onClick={() => setShowAddModal(true)}
					style={{ width: isMobile ? '100%' : undefined }}>
					+ Add History
				</ToolbarButton>
			</Toolbar>

			{/* Bulk Action Toolbar */}
			{canBulkEdit && selectedRecordIds.size > 0 && (
				<Toolbar
					style={{
						background: '#eff6ff',
						borderBottom: '2px solid #3b82f6',
					}}>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							flex: 1,
						}}>
						<span
							style={{
								fontSize: '14px',
								fontWeight: '600',
								color: '#1e40af',
							}}>
							{selectedRecordIds.size} record
							{selectedRecordIds.size !== 1 ? 's' : ''} selected
						</span>
					</div>
					<div style={{ display: 'flex', gap: '8px' }}>
						<button
							onClick={() => setShowBulkGroupModal(true)}
							style={{
								padding: '6px 12px',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '12px',
							}}>
							🧩 Group History
						</button>
						<button
							onClick={() => setSelectedRecordIds(new Set())}
							style={{
								padding: '6px 12px',
								background: '#e5e7eb',
								color: '#374151',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '12px',
							}}>
							Clear Selection
						</button>
					</div>
				</Toolbar>
			)}

			{/* Collapsable Filter Section */}
			<div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						flexDirection: isMobile ? 'column' : 'row',
						marginBottom: showFilters ? '12px' : '0',
					}}>
					<input
						type='text'
						placeholder='Search history, notes...'
						value={(filters.search as string) || ''}
						onChange={(e) =>
							setFilters((prev) => ({
								...prev,
								search: e.target.value,
							}))
						}
						style={{
							flex: 1,
							width: isMobile ? '100%' : undefined,
							padding: '8px 12px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							fontSize: '14px',
						}}
					/>
					<select
						value={sortBy}
						onChange={(event) =>
							setSortBy(event.target.value as 'dateDesc' | 'dateAsc' | 'title')
						}
						style={{
							padding: isMobile ? '10px 12px' : '8px 10px',
							width: isMobile ? '100%' : '170px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							background: '#ffffff',
							fontWeight: 600,
						}}>
						<option value='dateDesc'>Sort: Newest</option>
						<option value='dateAsc'>Sort: Oldest</option>
						<option value='title'>Sort: Title</option>
					</select>
					<button
						onClick={() => setShowFilters(!showFilters)}
						style={{
							padding: '8px 10px',
							width: isMobile ? '100%' : undefined,
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							background: '#f9fafb',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 6,
							whiteSpace: 'nowrap',
						}}
						title={showFilters ? 'Hide filters' : 'Show filters'}>
						<FontAwesomeIcon icon={faArrowUpAZ} />
						{showFilters ? 'Hide Filters' : 'Filters'}
					</button>
				</div>
				{activeFilterChips.length > 0 && (
					<ActiveFilterChips>
						{activeFilterChips.map((chip) => (
							<ActiveFilterChip key={chip.key} onClick={chip.onRemove}>
								{chip.label} ×
							</ActiveFilterChip>
						))}
						<ActiveFilterChipClear onClick={() => setFilters({})}>
							Clear all
						</ActiveFilterChipClear>
					</ActiveFilterChips>
				)}
				{showFilters && (
					<FilterBar
						filters={maintenanceFilters}
						onFiltersChange={setFilters}
					/>
				)}
			</div>
			{isMobile ? (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
					{Object.entries(groupedRecords.groups).map(([groupId, records]) => (
						<UnifiedMaintenanceHistory
							key={groupId}
							records={records}
							groupId={groupId}
							units={units}
							onNavigate={handleNavigation}
							onDelete={onDeleteMaintenanceHistory}
							onDeleteGroup={
								onDeleteMaintenanceHistory ? handleDeleteGroup : undefined
							}
						/>
					))}
					{groupedRecords.ungrouped.map((record) => (
						<UnifiedMaintenanceHistory
							key={record.id}
							records={[record]}
							units={units}
							onNavigate={handleNavigation}
							onDelete={onDeleteMaintenanceHistory}
							onDeleteGroup={
								onDeleteMaintenanceHistory ? handleDeleteGroup : undefined
							}
						/>
					))}
				</div>
			) : (
				<ContentWrapper>
					<ReusableTable
						columns={columns}
						rowData={maintenanceHistoryRecords}
						emptyMessage='No maintenance history available.'
						onRowDoubleClick={handleNavigation}
						showCheckbox={canBulkEdit}
					/>
				</ContentWrapper>
			)}
			{/* Add Maintenance History Modal */}
			{showAddModal && (
				<AddMaintenanceHistoryModal
					isOpen={showAddModal}
					onClose={() => setShowAddModal(false)}
					onSubmit={onAddMaintenanceHistory}
					property={property}
					units={units}
					teamMembers={teamMembers}
					contractors={contractors}
					familyMembers={familyMembers}
					groupOptions={maintenanceGroupOptions}
					onCreateGroupId={createMaintenanceGroupId}
				/>
			)}

			{showBulkGroupModal && (
				<GenericModal
					isOpen={showBulkGroupModal}
					onClose={() => setShowBulkGroupModal(false)}
					title='Group Maintenance History'
					showActions={true}
					primaryButtonLabel='Apply Group'
					secondaryButtonLabel='Cancel'
					onSubmit={(e) => {
						e.preventDefault();
						const form = e.target as HTMLFormElement;
						const selectedGroupId =
							(form.elements.namedItem('bulkGroupId') as HTMLSelectElement)
								.value || '';
						handleBulkGroupRecords(selectedGroupId);
					}}>
					<FormGroup>
						<FormLabel>Maintenance Group</FormLabel>
						<FormSelect name='bulkGroupId' defaultValue=''>
							<option value=''>Select a group...</option>
							<option value='__new__'>Create new group</option>
							{maintenanceGroupOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</FormSelect>
					</FormGroup>
				</GenericModal>
			)}
		</SectionContainer>
	);
};
