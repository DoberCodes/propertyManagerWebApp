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
	TabSummaryBar,
	TabSummaryPill,
	SectionLead,
	EmptyState,
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
import {
	faTrash,
	faEye,
	faPenToSquare,
	faArrowUpAZ,
	faScrewdriverWrench,
	faClipboardCheck,
	faFileInvoiceDollar,
	faFileLines,
	faCommentDots,
	faCircleCheck,
	faShieldHalved,
	faClockRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
import { UnifiedMaintenanceHistory } from 'Components/UnifiedMaintenanceHistory';
import {
	formatCurrency,
	getFinancialDisplayTotal,
} from 'utils/financialUtils';
import {
	getMaintenanceEventDate,
	getMaintenanceEventTitle,
	isContinuityEvent,
} from 'utils/maintenanceEventUtils';
import { useAppFeedback } from 'Components/Library/AppFeedback/AppFeedbackProvider';
import {
	ActiveFilterChips,
	ActiveFilterChip,
	ActiveFilterChipClear,
} from './mobileUiShared';
import { TaskFinancials } from 'types/Task.types';
import { PropertyDocument } from 'types/Property.types';
import { RoleCapabilities } from 'utils/permissions';

const maintenanceEventTypeLabels: Record<string, string> = {
	task_completed: 'Task Completed',
	task_approved: 'Task Approved',
	repair_logged: 'Repair Logged',
	inspection_completed: 'Inspection',
	invoice_uploaded: 'Invoice',
	document_uploaded: 'Document',
	service_note_added: 'Service Note',
	maintenance_recorded: 'Recorded',
	Completed: 'Completed',
	Approved: 'Approved',
};

const getMaintenanceEventType = (record: any) => {
	if (record.eventType) {
		return record.eventType;
	}
	if (record.approvedBy || record.approvedAt || record.status === 'Approved') {
		return 'task_approved';
	}
	if (record.completedBy || record.completionDate || record.status === 'Completed') {
		return 'task_completed';
	}
	return 'maintenance_recorded';
};

const formatRelativeTime = (value?: string): string => {
	if (!value) return 'No activity recorded yet';
	const target = new Date(value).getTime();
	if (Number.isNaN(target)) return 'No activity recorded yet';

	const now = Date.now();
	const diffMs = now - target;
	const absDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

	if (absDays === 0) return diffMs >= 0 ? 'Today' : 'Later today';
	if (absDays === 1) return diffMs >= 0 ? 'Yesterday' : 'Tomorrow';
	if (absDays < 7) return diffMs >= 0 ? `${absDays} days ago` : `In ${absDays} days`;
	if (absDays < 30) {
		const weeks = Math.floor(absDays / 7);
		return diffMs >= 0 ? `${weeks} week${weeks === 1 ? '' : 's'} ago` : `In ${weeks} week${weeks === 1 ? '' : 's'}`;
	}
	if (absDays < 365) {
		const months = Math.floor(absDays / 30);
		return diffMs >= 0 ? `${months} month${months === 1 ? '' : 's'} ago` : `In ${months} month${months === 1 ? '' : 's'}`;
	}

	const years = Math.floor(absDays / 365);
	return diffMs >= 0 ? `${years} year${years === 1 ? '' : 's'} ago` : `In ${years} year${years === 1 ? '' : 's'}`;
};

const getEventVisual = (eventType: string) => {
	switch (eventType) {
		case 'repair_logged':
			return {
				label: 'Repair Logged',
				icon: faScrewdriverWrench,
				color: '#b45309',
				background: '#fef3c7',
			};
		case 'inspection_completed':
			return {
				label: 'Inspection',
				icon: faClipboardCheck,
				color: '#1d4ed8',
				background: '#dbeafe',
			};
		case 'invoice_uploaded':
			return {
				label: 'Invoice',
				icon: faFileInvoiceDollar,
				color: '#0369a1',
				background: '#e0f2fe',
			};
		case 'document_uploaded':
			return {
				label: 'Document',
				icon: faFileLines,
				color: '#475569',
				background: '#f1f5f9',
			};
		case 'service_note_added':
			return {
				label: 'Service Note',
				icon: faCommentDots,
				color: '#047857',
				background: '#d1fae5',
			};
		case 'warranty_added':
			return {
				label: 'Warranty',
				icon: faShieldHalved,
				color: '#7c3aed',
				background: '#ede9fe',
			};
		case 'task_completed':
		case 'task_approved':
			return {
				label: 'Task Completed',
				icon: faCircleCheck,
				color: '#166534',
				background: '#dcfce7',
			};
		default:
			return {
				label: maintenanceEventTypeLabels[eventType] || 'Recorded',
				icon: faClockRotateLeft,
				color: '#475569',
				background: '#f1f5f9',
			};
	}
};

const getMaintenanceAttachments = (
	record: any,
	propertyDocuments: PropertyDocument[] = [],
): Array<{ name: string; url?: string }> => {
	const files: Array<{ name: string; url?: string }> = [];

	if (record?.completionFile?.name) {
		files.push({
			name: record.completionFile.name,
			url: record.completionFile.url,
		});
	}

	if (record?.completionFileData?.name) {
		files.push({
			name: record.completionFileData.name,
			url: record.completionFileData.url,
		});
	}

	if (Array.isArray(record?.attachments)) {
		record.attachments.forEach((attachment: any) => {
			const name = attachment?.fileName || attachment?.name;
			if (!name) return;
			files.push({ name, url: attachment?.url });
		});
	}

	if (Array.isArray(record?.files)) {
		record.files.forEach((file: any) => {
			if (!file?.name) return;
			files.push({ name: file.name, url: file.url });
		});
	}

	const taskIds = new Set<string>();
	[
		record?.taskId,
		record?.originalTaskId,
		record?.recurringTaskId,
		record?.data?.taskId,
		record?.data?.originalTaskId,
	].forEach((taskId) => {
		if (taskId) taskIds.add(String(taskId));
	});
	if (Array.isArray(record?.linkedTaskIds)) {
		record.linkedTaskIds.forEach((taskId: string) => {
			if (taskId) taskIds.add(String(taskId));
		});
	}
	if (taskIds.size > 0) {
		propertyDocuments.forEach((document) => {
			if (!document?.name || !document.assignedTaskId) return;
			if (!taskIds.has(String(document.assignedTaskId))) return;
			files.push({ name: document.name, url: document.url });
		});
	}

	const deduped = new Map<string, { name: string; url?: string }>();
	files.forEach((file) => {
		const key = `${file.name}::${file.url || ''}`;
		if (!deduped.has(key)) deduped.set(key, file);
	});

	return Array.from(deduped.values());
};

const getOperationalStatus = (record: any) => {
	const eventType = getMaintenanceEventType(record);
	const completionDate = record.completionDate;
	const date = completionDate ? new Date(completionDate).getTime() : NaN;
	const ageDays = Number.isNaN(date)
		? Number.POSITIVE_INFINITY
		: Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));

	if (!completionDate || Number.isNaN(date)) {
		return { label: 'No Activity', color: '#64748b', background: '#f8fafc', border: '#e2e8f0' };
	}

	if (eventType === 'repair_logged') {
		return {
			label: 'Needs Attention',
			color: '#b45309',
			background: '#fffbeb',
			border: '#fcd34d',
		};
	}

	if (ageDays <= 30) {
		return {
			label: 'Recently Serviced',
			color: '#166534',
			background: '#f0fdf4',
			border: '#86efac',
		};
	}

	if (ageDays > 180) {
		return {
			label: 'Attention',
			color: '#92400e',
			background: '#fffbeb',
			border: '#fcd34d',
		};
	}

	return {
		label: 'Healthy',
		color: '#065f46',
		background: '#ecfdf5',
		border: '#6ee7b7',
	};
};

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
		deviceIds?: string[];
		completionFile?: File;
		recurringTaskId?: string;
		linkedTaskIds?: string[];
		financials?: TaskFinancials;
	}) => void;
	onUpdateMaintenanceHistory?: (id: string, updates: Partial<any>) => void;
	onDeleteMaintenanceHistory?: (historyId: string) => void;
	permissions?: RoleCapabilities;
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
	permissions,
}: MaintenanceTabProps) => {
	const feedback = useAppFeedback();
	const navigate = useNavigate();
	const [filters, setFilters] = useState<FilterValues>({});
	const [showAddModal, setShowAddModal] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [sortBy, setSortBy] = useState<'dateDesc' | 'dateAsc' | 'title'>('dateDesc');
	const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(
		new Set(),
	);
	const [showBulkGroupModal, setShowBulkGroupModal] = useState(false);
	const [editingHistoryRecord, setEditingHistoryRecord] = useState<any | null>(null);
	// dialog for deletions
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteDialogMessage, setDeleteDialogMessage] = useState('');
	const [pendingDeleteAction, setPendingDeleteAction] = useState<
		() => Promise<void>
	>(() => async () => {});
	const canManageMaintenanceHistory =
		permissions?.canManageMaintenanceHistory ?? Boolean(onAddMaintenanceHistory);
	const canBulkEdit = canManageMaintenanceHistory && Boolean(onUpdateMaintenanceHistory);
	const canDeleteHistory =
		canManageMaintenanceHistory && Boolean(onDeleteMaintenanceHistory);
	const propertyDocuments = useMemo<PropertyDocument[]>(
		() => (Array.isArray(property?.documents) ? property.documents : []),
		[property?.documents],
	);

	const { isMobile } = useSelector((state: any) => state.app);

	const getMaintenanceGroupId = (record: any): string | undefined => {
		if (record?.maintenanceGroupId) {
			return record.maintenanceGroupId;
		}

		if (record?.recurringTaskId) {
			return record.recurringTaskId;
		}

		if (Array.isArray(record?.linkedTaskIds)) {
			const normalizedTaskIds = record.linkedTaskIds
				.map((taskId: string) => String(taskId || '').trim())
				.filter(Boolean)
				.sort();

			if (normalizedTaskIds.length > 0) {
				return `linked-${normalizedTaskIds.join(',')}`;
			}
		}

		return undefined;
	};

	const handleGroupID = (record: any) => {
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
				if (canManageMaintenanceHistory && onUpdateMaintenanceHistory) {
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
		if (!canDeleteHistory || !onDeleteMaintenanceHistory) return;

		const deletableRecords = records.filter(
			(record) => !record.isLegacy && record.id,
		);
		if (deletableRecords.length === 0) {
			feedback.notify(
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

	const openAddHistoryModal = () => {
		setEditingHistoryRecord(null);
		setShowAddModal(true);
	};

	const openEditHistoryModal = (record: any) => {
		if (!canManageMaintenanceHistory || !onUpdateMaintenanceHistory || !record?.id) return;
		setEditingHistoryRecord(record);
		setShowAddModal(true);
	};

	const handleHistoryModalSubmit = async (data: {
		title: string;
		completionDate: string;
		completedBy?: string;
		completedByName?: string;
		completionNotes?: string;
		unitId?: string;
		deviceIds?: string[];
		completionFile?: File;
		maintenanceGroupId?: string;
		financials?: TaskFinancials;
	}) => {
		if (editingHistoryRecord?.id && onUpdateMaintenanceHistory) {
			const updates: Record<string, any> = {
				title: data.title,
				completionDate: data.completionDate,
				completedBy: data.completedBy,
				completedByName: data.completedByName,
				completionNotes: data.completionNotes,
				unitId: data.unitId,
				deviceIds: data.deviceIds,
				maintenanceGroupId: data.maintenanceGroupId,
				financials: data.financials,
			};
			Object.keys(updates).forEach((key) => {
				if (updates[key] === undefined || updates[key] === '') {
					delete updates[key];
				}
			});
			await onUpdateMaintenanceHistory(editingHistoryRecord.id, updates);
			feedback.notify('Maintenance history updated');
			setEditingHistoryRecord(null);
			setShowAddModal(false);
			return;
		}

		if (!onAddMaintenanceHistory) return;
		await onAddMaintenanceHistory(data);
		setEditingHistoryRecord(null);
		setShowAddModal(false);
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

	const deviceNameById = useMemo(() => {
		const map = new Map<string, string>();
		const propertyDevices = Array.isArray((property as any)?.devices)
			? (property as any).devices
			: [];

		propertyDevices.forEach((device: any) => {
			const id = String(device?.id || '').trim();
			if (!id) return;
			const label =
				device?.name ||
				[device?.type, device?.brand, device?.model]
					.filter(Boolean)
					.join(' ') ||
				device?.serialNumber ||
				`Appliance ${id}`;
			map.set(id, label);
		});

		return map;
	}, [property]);

	const deviceFilterOptions = useMemo(
		() =>
			Array.from(deviceNameById.entries())
				.map(([value, label]) => ({ value, label }))
				.sort((a, b) => a.label.localeCompare(b.label)),
		[deviceNameById],
	);

	const getLinkedDeviceIds = useCallback((record: any): string[] => {
		const ids = Array.isArray(record?.deviceIds)
			? record.deviceIds
			: Array.isArray(record?.devices)
				? record.devices
				: record?.deviceId
					? [record.deviceId]
					: [];

		return ids.map((id: any) => String(id)).filter(Boolean);
	}, []);

	const getLinkedDeviceLabel = useCallback(
		(record: any) => {
			const ids = getLinkedDeviceIds(record);

			if (!ids.length) {
				return '-';
			}

			const labels = ids
				.map((id: any) => String(id))
				.filter(Boolean)
				.map((id: string) => deviceNameById.get(id) || `Appliance ${id}`);

			if (labels.length === 0) {
				return '-';
			}

			if (labels.length === 1) {
				return labels[0];
			}

			return `${labels[0]} +${labels.length - 1}`;
		},
		[deviceNameById, getLinkedDeviceIds],
	);

	// Filter configuration for maintenance history
	const maintenanceFilters: FilterConfig[] = [
		// Units are temporarily hidden from the app flow.
		// ...(property?.propertyType === 'Multi-Family'
		// 	? [
		// 			{
		// 				key: 'unit',
		// 				label: 'Unit',
		// 				type: 'select' as const,
		// 				options: [
		// 					{ value: 'all', label: 'All Units' },
		// 					...units.map((unit) => ({
		// 						value: unit.id,
		// 						label: unit.unitNumber || unit.address || `Unit ${unit.id}`,
		// 					})),
		// 				],
		// 			},
		// 	  ]
		// 	: []),
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
			key: 'eventType',
			label: 'Event Type',
			type: 'select' as const,
			options: [
				{ value: 'all', label: 'All Event Types' },
				...Object.entries(maintenanceEventTypeLabels).map(([value, label]) => ({
					value,
					label,
				})),
			],
		},
		...(deviceFilterOptions.length > 0
			? [
					{
						key: 'linkedDevice',
						label: 'Linked Appliance',
						type: 'select' as const,
						options: deviceFilterOptions,
					},
			  ]
			: []),
		{
			key: 'completionDate',
			label: 'Completion Date',
			type: 'daterange' as const,
		},
	];

	// Combine all maintenance records for filtering
	const allMaintenanceRecords = useMemo(
		() => [
			...maintenanceHistoryRecords.filter(isContinuityEvent).map((record) => ({
				...record,
				completionDate: getMaintenanceEventDate(record),
				title: getMaintenanceEventTitle(record),
				eventType: getMaintenanceEventType(record),
				linkedDevices: getLinkedDeviceLabel(record),
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
					linkedDevices:
						record.deviceId !== undefined && record.deviceId !== null
							? getDeviceNameUtil(record.deviceId, property)
							: '-',
					completedBy: getDeviceNameUtil(record.deviceId, property),
					completedByName: getDeviceNameUtil(record.deviceId, property),
					groupId: record.maintenanceGroupId || null, // Add groupId for legacy records
					notes: '-',
					isLegacy: true,
				}),
			),
		],
		[
			maintenanceHistoryRecords,
			property,
			resolveCompletedByName,
			getLinkedDeviceLabel,
		],
	);

	// Apply filters to maintenance records
	const filteredRecords = useMemo(() => {
		let records = applyFilters(allMaintenanceRecords, filters, {
			textFields: ['title', 'notes'],
			selectFields: [
				{ field: 'completedBy', filterKey: 'completedBy' },
				{
					field: 'eventType',
					filterKey: 'eventType',
					valueGetter: (item) => getMaintenanceEventType(item),
				},
			],
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

		if (filters.linkedDevice) {
			records = records.filter((record: any) =>
				getLinkedDeviceIds(record).includes(String(filters.linkedDevice)),
			);
		}

		return records.sort((a, b) => {
			if (sortBy === 'title') {
				return (a.title || '').localeCompare(b.title || '');
			}

			const timeA = a.completionDate ? new Date(a.completionDate).getTime() : 0;
			const timeB = b.completionDate ? new Date(b.completionDate).getTime() : 0;
			return sortBy === 'dateAsc' ? timeA - timeB : timeB - timeA;
		});
	}, [
		allMaintenanceRecords,
		filters,
		property?.propertyType,
		sortBy,
		getLinkedDeviceIds,
	]);

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

		if (filters.eventType) {
			chips.push({
				key: 'eventType',
				label: `Event Type: ${maintenanceEventTypeLabels[filters.eventType] || filters.eventType}`,
				onRemove: () =>
					setFilters((prev) => ({
						...prev,
						eventType: '',
					})),
			});
		}

		if (filters.linkedDevice) {
			chips.push({
				key: 'linkedDevice',
				label: `Linked Appliance: ${
					deviceNameById.get(String(filters.linkedDevice)) ||
					String(filters.linkedDevice)
				}`,
				onRemove: () =>
					setFilters((prev) => ({
						...prev,
						linkedDevice: '',
					})),
			});
		}

		// Units are temporarily hidden from the app flow.
		// if (filters.unit && filters.unit !== 'all') {
		// 	chips.push({
		// 		key: 'unit',
		// 		label: `Unit: ${filters.unit}`,
		// 		onRemove: () => setFilters((prev) => ({ ...prev, unit: 'all' })),
		// 	});
		// }

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
	}, [filters, deviceNameById]);

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
			header: 'Record',
			key: 'title',
			render: (_value, row) => {
				const eventType = getMaintenanceEventType(row);
				const eventVisual = getEventVisual(eventType);
				const eventDate = row.completionDate;
				const relative = formatRelativeTime(eventDate);
				const notesPreview = String(row.notes || '').trim();

				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 280 }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<span
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: 24,
									height: 24,
									borderRadius: 8,
									color: eventVisual.color,
									background: eventVisual.background,
									flexShrink: 0,
								}}>
								<FontAwesomeIcon icon={eventVisual.icon} />
							</span>
							<span style={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
								{row.title || 'Maintenance Record'}
							</span>
						</div>
						<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', color: '#475569', fontSize: 12, fontWeight: 700 }}>
							<span>{eventVisual.label}</span>
							<span>•</span>
							<span>{row.linkedDevices || 'No linked appliance'}</span>
							<span>•</span>
							<span>{relative}</span>
						</div>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
							{[
								row.completionDate ? `Recorded ${relative}` : 'Awaiting recorded history',
								row.financials
									? `Cost ${formatCurrency(getFinancialDisplayTotal(row.financials), row.financials?.currency || 'USD')}`
									: 'No cost recorded',
								row.groupId ? 'Grouped maintenance record' : 'Standalone maintenance record',
							].map((signal, signalIndex) => (
								<span
									key={`${row.id || row.groupId || row.title}-signal-${signalIndex}`}
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										padding: '4px 9px',
										borderRadius: 999,
										fontSize: 11,
										fontWeight: 700,
										color: '#475569',
										background: '#f8fafc',
										border: '1px solid #e2e8f0',
									}}>
									{signal}
								</span>
							))}
						</div>
						{notesPreview ? (
							<div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.45 }}>
								{notesPreview.length > 110 ? `${notesPreview.slice(0, 110)}...` : notesPreview}
							</div>
						) : (
							<div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.45 }}>
								No additional notes recorded.
							</div>
						)}
					</div>
				);
			},
		},
		{
			header: 'Maintenance Status',
			key: 'completionDate',
			render: (_value, row) => {
				const status = getOperationalStatus(row);
				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<span
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								padding: '6px 10px',
								borderRadius: 999,
								fontSize: 12,
								fontWeight: 800,
								letterSpacing: '0.02em',
								color: status.color,
								background: status.background,
								border: `1px solid ${status.border}`,
								whiteSpace: 'nowrap',
								width: 'fit-content',
							}}>
							{status.label}
						</span>
						<div style={{ fontSize: 12, color: '#64748b' }}>
							{row.completionDate
								? `Last recorded ${formatRelativeTime(row.completionDate)}`
								: 'Waiting for the first recorded maintenance event.'}
						</div>
						<div style={{ fontSize: 12, color: '#64748b' }}>
							{row.groupId ? 'Part of a grouped maintenance sequence.' : 'Single maintenance record.'}
						</div>
					</div>
				);
			},
		},
		{
			header: 'State',
			key: 'completionDate',
			render: (value, row) => {
				if (!value) {
					return (
						<div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
							<span style={{ fontWeight: 700, color: '#64748b' }}>No activity yet</span>
							<span style={{ fontSize: 12, color: '#94a3b8' }}>
								History will appear as maintenance is completed.
							</span>
						</div>
					);
				}

				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
						<span style={{ fontWeight: 700, color: '#0f172a' }}>{formatRelativeTime(value)}</span>
						<span style={{ fontSize: 12, color: '#64748b' }}>
							{new Date(value).toLocaleDateString()}
						</span>
						<span style={{ fontSize: 12, color: '#64748b' }}>
							{formatCurrency(
								getFinancialDisplayTotal(row.financials),
								row.financials?.currency || 'USD',
							)}
						</span>
					</div>
				);
			},
		},
		{
			header: 'Documents',
			key: 'attachments',
			render: (_value, row) => {
				const attachments = getMaintenanceAttachments(row, propertyDocuments);
				if (attachments.length === 0) {
					return <span style={{ color: '#94a3b8', fontSize: 13 }}>None</span>;
				}

				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						{attachments.map((file, index) =>
							file.url ? (
								<a
									key={`${file.name}-${file.url}-${index}`}
									href={file.url}
									target='_blank'
									rel='noreferrer'
									style={{
										color: '#0f766e',
										fontSize: 13,
										fontWeight: 700,
										textDecoration: 'underline',
									}}>
									{file.name}
								</a>
							) : (
								<span
									key={`${file.name}-${index}`}
									style={{ color: '#475569', fontSize: 13 }}>
									{file.name}
								</span>
							),
						)}
					</div>
				);
			},
		},
		{
			header: 'Next Step',
			key: 'actions',
			render: (_, row) => (
				<div style={{ display: 'flex', gap: '8px' }}>
						{canBulkEdit && onUpdateMaintenanceHistory && row?.id && (
							<ActionButton
								onClick={() => {
									openEditHistoryModal(row);
								}}>
								<FontAwesomeIcon icon={faPenToSquare} />
							</ActionButton>
						)}
					{canDeleteHistory && (
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
			<SectionLead>
				Review completed work and keep the property history easy to trace.
			</SectionLead>
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
			{canManageMaintenanceHistory && (
				<Toolbar
					style={{
						marginBottom: isMobile ? '12px' : undefined,
						justifyContent: isMobile ? 'stretch' : undefined,
					}}>
					<ToolbarButton
						onClick={openAddHistoryModal}
						style={{ width: isMobile ? '100%' : undefined }}>
						+ Add History
					</ToolbarButton>
				</Toolbar>
			)}

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
					{filteredRecords.length === 0 ? (
						<EmptyState>
							<h3>No maintenance activity yet</h3>
							<p>Add a completed service note when something happens, or create a task to plan the next maintenance step.</p>
							{canManageMaintenanceHistory && (
								<ToolbarButton type='button' onClick={openAddHistoryModal}>
									Add Maintenance Record
								</ToolbarButton>
							)}
						</EmptyState>
					) : (
						<>
							{Object.entries(groupedRecords.groups).map(([groupId, records]) => (
								<UnifiedMaintenanceHistory
									key={groupId}
									records={records}
									groupId={groupId}
									units={units}
									canSelect={canBulkEdit}
									selectedRecordIds={selectedRecordIds}
									onToggleSelect={(recordId) => {
										setSelectedRecordIds((prev) => {
											const next = new Set(prev);
											if (next.has(recordId)) {
												next.delete(recordId);
											} else {
												next.add(recordId);
											}
											return next;
										});
									}}
									onNavigate={handleNavigation}
									onEdit={canManageMaintenanceHistory ? openEditHistoryModal : undefined}
									onDelete={canDeleteHistory ? onDeleteMaintenanceHistory : undefined}
									onDeleteGroup={
										canDeleteHistory ? handleDeleteGroup : undefined
									}
								/>
							))}
							{groupedRecords.ungrouped.map((record) => (
								<UnifiedMaintenanceHistory
									key={record.id}
									records={[record]}
									units={units}
									canSelect={canBulkEdit}
									selectedRecordIds={selectedRecordIds}
									onToggleSelect={(recordId) => {
										setSelectedRecordIds((prev) => {
											const next = new Set(prev);
											if (next.has(recordId)) {
												next.delete(recordId);
											} else {
												next.add(recordId);
											}
											return next;
										});
									}}
									onNavigate={handleNavigation}
									onEdit={canManageMaintenanceHistory ? openEditHistoryModal : undefined}
									onDelete={canDeleteHistory ? onDeleteMaintenanceHistory : undefined}
									onDeleteGroup={
										canDeleteHistory ? handleDeleteGroup : undefined
									}
								/>
							))}
						</>
					)}
				</div>
			) : (
				<ReusableTable
					columns={columns}
					rowData={filteredRecords}
					emptyTitle='No maintenance activity yet'
					emptyMessage='No maintenance activity recorded yet. History will appear as maintenance is completed.'
					emptyActionLabel={canManageMaintenanceHistory ? 'Add Maintenance Record' : undefined}
					onEmptyAction={
						canManageMaintenanceHistory ? openAddHistoryModal : undefined
					}
					hideHeader={true}
					selectedRows={selectedRecordIds}
					onRowSelect={(nextSelection) => setSelectedRecordIds(new Set(nextSelection))}
					onSelectAll={(_checked, selectedRowIds) =>
						setSelectedRecordIds(new Set(selectedRowIds))
					}
					getRowClassName={(row) => {
						const status = getOperationalStatus(row);
						return status.label === 'Needs Attention' || status.label === 'Attention'
							? 'attention-row'
							: undefined;
					}}
					onRowDoubleClick={handleNavigation}
					showCheckbox={canBulkEdit}
				/>
			)}
			{/* Add Maintenance History Modal */}
			{canManageMaintenanceHistory && showAddModal && (
				<AddMaintenanceHistoryModal
					isOpen={showAddModal}
					onClose={() => {
						setShowAddModal(false);
						setEditingHistoryRecord(null);
					}}
					title={editingHistoryRecord ? 'Edit Maintenance History' : 'Add Maintenance History'}
					primaryButtonLabel={editingHistoryRecord ? 'Save Changes' : 'Add History'}
					hideAttachmentField={Boolean(editingHistoryRecord)}
					initialData={editingHistoryRecord || undefined}
					onSubmit={handleHistoryModalSubmit}
					property={property}
					devices={Array.isArray((property as any)?.devices)
						? (property as any).devices
						: Array.isArray((property as any)?.deviceIds)
							? (property as any).deviceIds.map((id: string) => ({ id }))
							: []}
					units={units}
					teamMembers={teamMembers}
					contractors={contractors}
					familyMembers={familyMembers}
					groupOptions={maintenanceGroupOptions}
					onCreateGroupId={createMaintenanceGroupId}
					relatedDocuments={
						editingHistoryRecord
							? getMaintenanceAttachments(editingHistoryRecord, propertyDocuments)
							: []
					}
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
