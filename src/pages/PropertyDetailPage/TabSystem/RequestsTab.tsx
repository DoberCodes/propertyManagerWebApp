import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RequestsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	ReusableTable,
	Column,
	Action,
} from '../../../Components/Library/ReusableTable';
import { StatusBadge, EmptyState } from './index.styles';
import {
	DesktopTableWrapper,
	MobileActionButton,
	MobileFeedLine,
	MobileFeedLineMuted,
	MobileFeedMeta,
	MobileTaskActions,
	MobileTaskCard,
	MobileTaskHeader,
	MobileTaskTitle,
	SectionLead,
	ToolbarButton,
} from './index.styles';
import {
	faExchangeAlt,
	faArrowUpAZ,
	faTriangleExclamation,
	faDroplet,
	faBolt,
	faHouse,
	faClockRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
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
import { LockedFeatureCallout } from '../../../Components/Library/LockedFeatureCallout';
import { canManageTenants as canManageTenantsForPlan } from '../../../utils/subscriptionUtils';

export const RequestsTab: React.FC<RequestsTabProps> = ({
	propertyMaintenanceRequests,
	currentUser,
	canApproveMaintenanceRequest,
	handleConvertRequestToTask,
	onCreateTask,
	permissions,
}) => {
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState<'dateDesc' | 'priority' | 'status'>('dateDesc');
	const { isMobile } = useSelector((state: any) => state.app);
	const isTeamMemberAccount = currentUser?.isTeamMemberAccount === true;

	const formatRelativePast = (value?: string) => {
		if (!value) return 'No activity yet';
		const target = new Date(value).getTime();
		if (Number.isNaN(target)) return 'No activity yet';
		const diffMs = Date.now() - target;
		const absDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
		if (absDays === 0) return 'Today';
		if (absDays === 1) return '1 day ago';
		if (absDays < 7) return `${absDays} days ago`;
		if (absDays < 30) {
			const weeks = Math.floor(absDays / 7);
			return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
		}
		const months = Math.floor(absDays / 30);
		return `${months} month${months === 1 ? '' : 's'} ago`;
	};

	const getRequestContinuitySignals = (request: any) => {
		const signals: string[] = [`Submitted ${formatRelativePast(request.submittedAt)}`];
		// Units are temporarily hidden from the app flow.
		if (request.priority) {
			signals.push(`${request.priority} priority`);
		}
		return signals.slice(0, 3);
	};

	const getRequestIcon = (request: any) => {
		const context = `${request.category || ''} ${request.title || ''}`.toLowerCase();
		if (context.includes('plumb') || context.includes('water') || context.includes('leak')) {
			return { icon: faDroplet, color: '#0369a1', background: '#e0f2fe' };
		}
		if (context.includes('electric') || context.includes('power') || context.includes('outlet')) {
			return { icon: faBolt, color: '#7c3aed', background: '#f3e8ff' };
		}
		if (context.includes('exterior') || context.includes('roof') || context.includes('door')) {
			return { icon: faHouse, color: '#9a3412', background: '#ffedd5' };
		}
		return { icon: faTriangleExclamation, color: '#b45309', background: '#fffbeb' };
	};

	const columns: Column[] = [
		{
			header: 'Request',
			key: 'title',
			render: (title: string, request: any) => (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 280 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: 24,
								height: 24,
								borderRadius: 8,
								color: getRequestIcon(request).color,
								background: getRequestIcon(request).background,
							}}>
							<FontAwesomeIcon icon={getRequestIcon(request).icon} />
						</span>
						<strong>{title}</strong>
					</div>
					<small style={{ color: '#475569', fontSize: '12px' }}>
						{request.description.substring(0, 90)}
						{request.description.length > 90 && '...'}
					</small>
					<div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
						<span>{request.category || 'General'}</span>
						<span>•</span>
						{/* Units are temporarily hidden from the app flow. */}
						<span>{request.submittedByName || 'Tenant request'}</span>
					</div>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
						{getRequestContinuitySignals(request).map((signal, index) => (
							<span
								key={`${request.id}-signal-${index}`}
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
				</div>
			),
		},
		{
			header: 'Request Status',
			key: 'submittedAt',
			render: (date: any, request: any) => (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0f172a' }}>
						<FontAwesomeIcon icon={faClockRotateLeft} color='#64748b' />
						{request.status === 'Pending'
							? 'Pending conversion into maintenance task'
							: 'Request has moved forward'}
					</div>
					<div style={{ fontSize: 12, color: '#64748b' }}>{formatDateUtil(date)}</div>
					<div style={{ fontSize: 12, color: '#64748b' }}>
						{request.status === 'Pending'
							? 'Waiting for approval and task conversion.'
							: 'Already moved forward in the maintenance process.'}
					</div>
				</div>
			),
		},
		{
			header: 'State',
			key: 'status',
			render: (status: string, request: any) => (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
					<StatusBadge status={getRequestStatusUtil(request.status)}>{status}</StatusBadge>
					<div
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							padding: '6px 10px',
							borderRadius: 999,
							fontSize: 12,
							fontWeight: 800,
							color: getPriorityColorUtil(request.priority),
							background: '#fff7ed',
							border: '1px solid #fed7aa',
							width: 'fit-content',
						}}>
						{request.priority || 'Low'} priority
					</div>
					<div style={{ fontSize: 12, color: '#64748b' }}>
						Submitted by {request.submittedByName || 'Unknown requester'}
					</div>
				</div>
			),
		},
	];

	const actions: Action[] = [
		{
			label: 'Convert to Task',
			icon: faExchangeAlt,
			onClick: (request: any) => handleConvertRequestToTask(request.id),
			disabled: (request: any) =>
				!(
					canManageRequestTasks &&
					request.status === 'Pending' &&
					currentUser &&
					canApproveMaintenanceRequest(currentUser.role as UserRole)
				),
		},
	];

	const planAllowsRequestTasks =
		!!currentUser?.subscription && canManageTenantsForPlan(currentUser.subscription as any);
	const canManageRequestTasks =
		planAllowsRequestTasks && (permissions?.canApproveMaintenanceRequests ?? true);

	const filteredRequests = useMemo(() => {
		// Units are temporarily hidden from the app flow; do not apply unit scoping.
		const byUnit = propertyMaintenanceRequests;

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
	}, [propertyMaintenanceRequests, search, sortBy]);

	const activeFilterChips = useMemo(() => {
		const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
		if (search) {
			chips.push({
				key: 'search',
				label: `Search: ${search}`,
				onRemove: () => setSearch(''),
			});
		}
		return chips;
	}, [search]);

	return (
		<SectionContainer>
			<SectionHeader>Maintenance Requests</SectionHeader>
			<SectionLead>
				Review incoming maintenance requests before they become active tasks.
			</SectionLead>
			{!canManageRequestTasks && (
				<LockedFeatureCallout
					title={
						planAllowsRequestTasks || isTeamMemberAccount
							? 'Task conversion is read-only for your role'
							: 'Request task conversion is locked on your current plan'
					}
					description={
						planAllowsRequestTasks || isTeamMemberAccount
							? 'You can review requests, but converting them into active maintenance tasks requires a maintenance or manager role.'
							: 'You can review requests, but converting them into managed tasks requires the Portfolio plan.'
					}
					upgradeLabel='Upgrade for Request Tasks'
					showUpgradeAction={!planAllowsRequestTasks && !isTeamMemberAccount}
					compact
				/>
			)}
			<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
				<input
					type='text'
					placeholder='Search requests...'
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					style={{
						flex: 1,
						minWidth: 180,
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
						setSortBy(event.target.value as 'dateDesc' | 'priority' | 'status')
					}
					style={{
						padding: '8px 10px',
						width: isMobile ? '100%' : undefined,
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

			{/* Units are temporarily hidden from the app flow.
			{unitOptions.length > 0 && (
				<FormSelect
					name='unitFilter'
					value={selectedUnitId || ''}
					onChange={(e) => onSelectUnit && onSelectUnit(e.target.value)}
					style={{ marginBottom: '0' }}>
					<option value=''>All units</option>
					{unitOptions.map((u) => (
						<option key={u.value} value={u.value}>
							{u.label}
						</option>
					))}
				</FormSelect>
			)}
			*/}

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
						}}>
						Clear all
					</ActiveFilterChipClear>
				</ActiveFilterChips>
			)}
			</div>

			{filteredRequests.length > 0 ? (
				<>
					<DesktopTableWrapper>
					<ReusableTable
						columns={columns}
						rowData={filteredRequests}
						getRowClassName={(request: any) =>
							(request.status === 'Pending' && request.priority === 'Urgent') ||
							(request.status === 'Pending' && request.priority === 'High')
								? 'attention-row'
								: undefined
						}
						actions={actions}
						hideHeader={true}
						emptyMessage='No maintenance requests right now. New requests will appear here for review.'
					/>
					</DesktopTableWrapper>

					<div>
						{filteredRequests.map((request: any) => {
							const icon = getRequestIcon(request);
							const canConvert =
								canManageRequestTasks &&
								request.status === 'Pending' &&
								currentUser &&
								canApproveMaintenanceRequest(currentUser.role as UserRole);
							const cardAccent =
								request.status === 'Pending' && ['Urgent', 'High'].includes(request.priority)
									? '#ef4444'
									: request.status === 'Pending'
									? '#f59e0b'
									: '#94a3b8';

							return (
								<MobileTaskCard
									key={request.id}
									$isSelected={false}
									style={{ borderLeft: `4px solid ${cardAccent}` }}>
									<MobileTaskHeader>
										<div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
											<span
												style={{
													display: 'inline-flex',
													alignItems: 'center',
													justifyContent: 'center',
													width: 28,
													height: 28,
													borderRadius: 8,
													color: icon.color,
													background: icon.background,
													flexShrink: 0,
												}}>
												<FontAwesomeIcon icon={icon.icon} />
											</span>
											<MobileTaskTitle>{request.title || 'Maintenance Request'}</MobileTaskTitle>
										</div>
										<StatusBadge status={getRequestStatusUtil(request.status)}>
											{request.status || 'Pending'}
										</StatusBadge>
									</MobileTaskHeader>

									<MobileFeedMeta>
										<MobileFeedLine>
											{request.description
												? `${request.description.slice(0, 110)}${request.description.length > 110 ? '...' : ''}`
												: 'No request description provided.'}
										</MobileFeedLine>
										<MobileFeedLineMuted>
											{request.category || 'General'} - {request.priority || 'Low'} priority
										</MobileFeedLineMuted>
										<MobileFeedLineMuted>
											Submitted by {request.submittedByName || 'Unknown requester'}
										</MobileFeedLineMuted>
										<MobileFeedLineMuted>
											{formatDateUtil(request.submittedAt)} - {formatRelativePast(request.submittedAt)}
										</MobileFeedLineMuted>
									</MobileFeedMeta>

									{canConvert && (
										<MobileTaskActions>
											<MobileActionButton
												variant='primary'
												onClick={() => handleConvertRequestToTask(request.id)}>
												Convert to Task
											</MobileActionButton>
										</MobileTaskActions>
									)}
								</MobileTaskCard>
							);
						})}
					</div>
				</>
			) : (
				<EmptyState>
					<h3>
						{propertyMaintenanceRequests.length === 0
							? 'No maintenance requests yet'
							: 'No requests match your filters'}
					</h3>
					<p>
						{propertyMaintenanceRequests.length === 0
							? 'Tenant requests will appear here. If you already know the work that needs attention, start it as a task.'
							: 'Adjust the search to bring requests back into view.'}
					</p>
					{propertyMaintenanceRequests.length === 0 ? (
						onCreateTask && (
							<ToolbarButton type='button' onClick={onCreateTask}>
								Add Task
							</ToolbarButton>
						)
					) : (
						<ToolbarButton
							type='button'
							className='secondary-action'
							onClick={() => setSearch('')}>
							Clear Search
						</ToolbarButton>
					)}
				</EmptyState>
			)}
		</SectionContainer>
	);
};
