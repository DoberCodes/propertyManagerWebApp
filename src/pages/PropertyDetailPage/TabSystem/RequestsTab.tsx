import React, { useMemo, useState } from 'react';
import { RequestsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { FormSelect } from '../../../Components/Library/Modal/ModalStyles';
import {
	ReusableTable,
	Column,
	Action,
} from '../../../Components/Library/ReusableTable';
import { StatusBadge, EmptyState } from './index.styles';
import { faExchangeAlt, faArrowUpAZ } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	getRequestStatusUtil,
	getPriorityColorUtil,
	formatDateUtil,
} from '../PropertyDetailPage.utils';
import { UserRole } from '../../../constants/roles';
import {
	ActiveFilterChips,
	ActiveFilterChip,
	ActiveFilterChipClear,
} from './mobileUiShared';

export const RequestsTab: React.FC<RequestsTabProps> = ({
	propertyMaintenanceRequests,
	currentUser,
	unitOptions = [],
	selectedUnitId,
	onSelectUnit,
	canApproveMaintenanceRequest,
	handleConvertRequestToTask,
}) => {
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState<'dateDesc' | 'priority' | 'status'>('dateDesc');

	const columns: Column[] = [
		{
			header: 'Status',
			key: 'status',
			render: (status: string, request: any) => (
				<StatusBadge status={getRequestStatusUtil(request.status)}>{status}</StatusBadge>
			),
		},
		{
			header: 'Title',
			key: 'title',
			render: (title: string, request: any) => (
				<div>
					<strong>{title}</strong>
					<br />
					<small style={{ color: '#475569', fontSize: '12px' }}>
						{request.description.substring(0, 80)}
						{request.description.length > 80 && '...'}
					</small>
				</div>
			),
		},
		{ header: 'Category', key: 'category' },
		{
			header: 'Priority',
			key: 'priority',
			render: (priority: string) => (
				<span style={{ color: getPriorityColorUtil(priority), fontWeight: 700 }}>
					{priority}
				</span>
			),
		},
		{ header: 'Submitted By', key: 'submittedByName' },
		{
			header: 'Unit',
			key: 'unit',
			render: (unit: string) =>
				unit ? (
					<span
						style={{
							backgroundColor: '#e8f5e9',
							padding: '4px 8px',
							borderRadius: '4px',
							fontSize: '12px',
							fontWeight: '500',
							color: '#2e7d32',
						}}>
						{unit}
					</span>
				) : (
					<span style={{ color: '#999', fontSize: '12px' }}>N/A</span>
				),
		},
		{
			header: 'Date',
			key: 'submittedAt',
			render: (date: any) => formatDateUtil(date),
		},
	];

	const actions: Action[] = [
		{
			label: 'Convert to Task',
			icon: faExchangeAlt,
			onClick: (request: any) => handleConvertRequestToTask(request.id),
			disabled: (request: any) =>
				!(
					request.status === 'Pending' &&
					currentUser &&
					canApproveMaintenanceRequest(currentUser.role as UserRole)
				),
		},
	];

	const filteredRequests = useMemo(() => {
		const byUnit = !selectedUnitId
			? propertyMaintenanceRequests
			: propertyMaintenanceRequests.filter(
					(req) => req.unit === selectedUnitId || req.unitId === selectedUnitId,
			  );

		const bySearch = byUnit.filter((req) => {
			const haystack = `${req.title || ''} ${req.description || ''} ${req.category || ''}`.toLowerCase();
			return haystack.includes(search.toLowerCase());
		});

		const priorityRank: Record<string, number> = {
			Urgent: 0,
			High: 1,
			Medium: 2,
			Low: 3,
		};

		return [...bySearch].sort((a, b) => {
			if (sortBy === 'status') {
				return (a.status || '').localeCompare(b.status || '');
			}
			if (sortBy === 'priority') {
				return (priorityRank[a.priority] ?? 4) - (priorityRank[b.priority] ?? 4);
			}
			const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
			const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
			return timeB - timeA;
		});
	}, [propertyMaintenanceRequests, search, selectedUnitId, sortBy]);

	const activeFilterChips = useMemo(() => {
		const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
		if (search) {
			chips.push({
				key: 'search',
				label: `Search: ${search}`,
				onRemove: () => setSearch(''),
			});
		}
		if (selectedUnitId) {
			chips.push({
				key: 'unit',
				label: `Unit: ${selectedUnitId}`,
				onRemove: () => onSelectUnit && onSelectUnit(''),
			});
		}
		return chips;
	}, [search, selectedUnitId, onSelectUnit]);

	return (
		<SectionContainer>
			<SectionHeader>Maintenance Requests</SectionHeader>
			<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
				<input
					type='text'
					placeholder='Search requests...'
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					style={{
						flex: 1,
						minWidth: 180,
						padding: '8px 12px',
						border: '1px solid #e5e7eb',
						borderRadius: '4px',
						fontSize: '14px',
					}}
				/>
				<select
					value={sortBy}
					onChange={(event) =>
						setSortBy(event.target.value as 'dateDesc' | 'priority' | 'status')
					}
					style={{
						padding: '8px 10px',
						border: '1px solid #e5e7eb',
						borderRadius: '4px',
						background: '#ffffff',
						fontWeight: 600,
					}}>
					<option value='dateDesc'>Sort: Newest</option>
					<option value='priority'>Sort: Priority</option>
					<option value='status'>Sort: Status</option>
				</select>
				<div
					style={{
						padding: '8px 10px',
						border: '1px solid #e5e7eb',
						borderRadius: '4px',
						background: '#f9fafb',
						display: 'flex',
						alignItems: 'center',
						gap: 6,
						fontWeight: 600,
					}}>
					<FontAwesomeIcon icon={faArrowUpAZ} /> Filters
				</div>
			</div>

			{unitOptions.length > 0 && (
				<FormSelect
					name='unitFilter'
					value={selectedUnitId || ''}
					onChange={(e) => onSelectUnit && onSelectUnit(e.target.value)}
					style={{ marginBottom: '12px' }}>
					<option value=''>All units</option>
					{unitOptions.map((u) => (
						<option key={u.value} value={u.value}>
							{u.label}
						</option>
					))}
				</FormSelect>
			)}

			{activeFilterChips.length > 0 && (
				<ActiveFilterChips>
					{activeFilterChips.map((chip) => (
						<ActiveFilterChip key={chip.key} onClick={chip.onRemove}>
							{chip.label} ×
						</ActiveFilterChip>
					))}
					<ActiveFilterChipClear
						onClick={() => {
							setSearch('');
							onSelectUnit && onSelectUnit('');
						}}>
						Clear all
					</ActiveFilterChipClear>
				</ActiveFilterChips>
			)}

			{filteredRequests.length > 0 ? (
				<ReusableTable
					columns={columns}
					rowData={filteredRequests}
					actions={actions}
					emptyMessage='No maintenance requests'
				/>
			) : (
				<EmptyState>
					<p>No maintenance requests for this property</p>
				</EmptyState>
			)}
		</SectionContainer>
	);
};
