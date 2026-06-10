import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
	faEdit,
	faEnvelope,
	faTrash,
	faUserGroup,
	faClockRotateLeft,
	faCircleCheck,
	faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TenantsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { ReusableTable } from '../../../Components/Library/ReusableTable';
import { SectionLead } from './index.styles';
import {
	FilterBar,
	FilterConfig,
	FilterValues,
} from '../../../Components/Library/FilterBar';
import { applyFilters } from '../../../utils/tableFilters';
import {
	DesktopTableWrapper,
	EmptyState,
	GridContainer,
	MobileActionButton,
	MobileActionLinkButton,
	MobileActionLinkRow,
	MobileFeedLine,
	MobileFeedLineMuted,
	MobileFeedMeta,
	MobileTaskActions,
	MobileTaskCard,
	MobileTaskHeader,
	MobileTaskTitle,
	Toolbar,
	ToolbarButton,
} from './index.styles';
import { GenericModal } from '../../../Components/Library';
import { LockedFeatureCallout } from '../../../Components/Library/LockedFeatureCallout';
import { canManageTenants as canManageTenantsForPlan } from '../../../utils/subscriptionUtils';
import {
	useLazyGetTenantInvitationCodeQuery,
	useLazyGetTenantInvitationCodesByEmailQuery,
} from '../../../Redux/API/tenantSlice';

export const TenantsTab: React.FC<TenantsTabProps> = ({
	property,
	currentUser,
	setShowAddTenantModal,
	onEditTenant,
	onDeleteTenant,
	permissions,
}) => {
	const [filters, setFilters] = useState<FilterValues>({});
	const [showFilters, setShowFilters] = useState(false);
	const [copiedTenantId, setCopiedTenantId] = useState<string | null>(null);
	const [inviteModalTenant, setInviteModalTenant] = useState<any | null>(null);
	const [inviteCodeByTenantId, setInviteCodeByTenantId] = useState<
		Record<
			string,
			{
				code: string;
				status?: string;
				redeemedAt?: string;
				revokedAt?: string;
			}
		>
	>({});
	const { isMobile } = useSelector((state: any) => state.app);
	const isTeamMemberAccount = currentUser?.isTeamMemberAccount === true;
	const [getTenantInvitationCode] = useLazyGetTenantInvitationCodeQuery();
	const [getTenantInvitationCodesByEmail] =
		useLazyGetTenantInvitationCodesByEmailQuery();

	useEffect(() => {
		let cancelled = false;

		const loadInviteCodes = async () => {
			const tenants = property?.tenants || [];
			if (!tenants.length) {
				if (!cancelled) setInviteCodeByTenantId({});
				return;
			}

			const nextMap: Record<
				string,
				{
					code: string;
					status?: string;
					redeemedAt?: string;
					revokedAt?: string;
				}
			> = {};

			await Promise.all(
				tenants.map(async (tenant: any) => {
					let inviteCode: any = null;

					if (tenant?.tenantInvitationCodeId) {
						try {
							inviteCode = await getTenantInvitationCode(
								tenant.tenantInvitationCodeId,
							).unwrap();
						} catch {
							inviteCode = null;
						}
					}

					if (!inviteCode && tenant?.email) {
						try {
							const byEmail = await getTenantInvitationCodesByEmail(
								tenant.email,
							).unwrap();
							if (byEmail?.length) {
								inviteCode = byEmail[0];
							}
						} catch {
							inviteCode = null;
						}
					}

					if (inviteCode?.code && tenant?.id) {
						nextMap[tenant.id] = {
							code: inviteCode.code,
							status: inviteCode.status,
							redeemedAt: inviteCode.redeemedAt,
							revokedAt: inviteCode.revokedAt,
						};
					}
				}),
			);

			if (!cancelled) {
				setInviteCodeByTenantId(nextMap);
			}
		};

		loadInviteCodes();

		return () => {
			cancelled = true;
		};
	}, [property?.tenants, getTenantInvitationCode, getTenantInvitationCodesByEmail]);

	const handleCopyInviteCode = async (tenantId: string, code?: string) => {
		if (!code) return;
		try {
			await navigator.clipboard.writeText(code);
		} catch {
			const textArea = document.createElement('textarea');
			textArea.value = code;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
		}
		setCopiedTenantId(tenantId);
		setTimeout(() => setCopiedTenantId(null), 1500);
	};

	const formatInviteStatus = (status?: string) => {
		if (!status) return 'No Invite';
		if (status === 'active') return 'Active';
		if (status === 'redeemed') return 'Redeemed';
		if (status === 'revoked') return 'Revoked';
		return status;
	};

	const getInviteStatusDetails = useCallback((tenantId: string) => {
		const invite = inviteCodeByTenantId[tenantId];
		if (!invite) return 'No invitation code created';

		if (invite.status === 'redeemed' && invite.redeemedAt) {
			return `Redeemed on ${new Date(invite.redeemedAt).toLocaleDateString()}`;
		}

		if (invite.status === 'revoked' && invite.revokedAt) {
			return `Revoked on ${new Date(invite.revokedAt).toLocaleDateString()}`;
		}

		if (invite.status === 'active') {
			return 'Ready to share with tenant';
		}

		return 'Status unavailable';
	}, [inviteCodeByTenantId]);

	const handleEmailInviteCode = (tenant: any) => {
		const invite = inviteCodeByTenantId[tenant?.id];
		if (!tenant?.email || !invite?.code) return;
		const inviteLink = `${window.location.origin}/#/register?inviteType=tenant&invite=${encodeURIComponent(invite.code)}&email=${encodeURIComponent(tenant.email)}`;

		const subject = encodeURIComponent('Your Property Invitation Code');
		const body = encodeURIComponent(
			`Hi ${tenant.firstName || ''},\n\nUse this link to complete your invited tenant registration:\n${inviteLink}\n\nInvitation code: ${invite.code}\n\nIf the link doesn't open, you can register manually and enter the code above.\n\nThanks`,
		);
		window.location.href = `mailto:${tenant.email}?subject=${subject}&body=${body}`;
	};

	// Filter configuration for tenants
	const tenantFilters: FilterConfig[] = [
		{
			key: 'leaseStatus',
			label: 'Lease Status',
			type: 'select',
			options: [
				{ value: 'active', label: 'Active' },
				{ value: 'expired', label: 'Expired' },
				{ value: 'upcoming', label: 'Upcoming' },
			],
		},
		{
			key: 'leaseDate',
			label: 'Lease Period',
			type: 'daterange',
		},
	];

	// Apply filters to tenants
	const filteredTenants = useMemo(() => {
		if (!property.tenants) return [];
		let tenants = property.tenants;
		// Units are temporarily hidden from the app flow; do not apply unit scoping.
		return applyFilters(tenants, filters, {
			textFields: ['firstName', 'lastName', 'email', 'phone', 'unit'],
			dateRangeFields: [
				{ field: 'leaseStart', filterKey: 'leaseDate' },
				{ field: 'leaseEnd', filterKey: 'leaseDate' },
			],
		});
	}, [property.tenants, filters]);
	const planAllowsTenantManagement =
		!!currentUser?.subscription && canManageTenantsForPlan(currentUser.subscription as any);
	const canManageTenants =
		planAllowsTenantManagement && (permissions?.canManageTenants ?? true);

	const getLeaseContinuity = (tenant: any) => {
		const now = Date.now();
		const start = tenant.leaseStart ? new Date(tenant.leaseStart).getTime() : NaN;
		const end = tenant.leaseEnd ? new Date(tenant.leaseEnd).getTime() : NaN;

		if (!Number.isNaN(end) && end < now) {
			return { label: 'Expired', tone: '#991b1b', bg: '#fee2e2', icon: faTriangleExclamation };
		}
		if (!Number.isNaN(start) && start > now) {
			return { label: 'Upcoming', tone: '#1d4ed8', bg: '#dbeafe', icon: faClockRotateLeft };
		}
		if (!Number.isNaN(start) || !Number.isNaN(end)) {
			return { label: 'Active Lease', tone: '#166534', bg: '#dcfce7', icon: faCircleCheck };
		}
		return { label: 'No Lease Dates', tone: '#475569', bg: '#f1f5f9', icon: faClockRotateLeft };
	};

	// Table configuration
	const columns = [
		{
			header: 'Tenant Profile',
			key: 'fullName',
			render: (value: string, row: any) => (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: 24,
								height: 24,
								borderRadius: 8,
								background: '#ecfeff',
								color: '#0f766e',
							}}>
							<FontAwesomeIcon icon={faUserGroup} />
						</span>
						<strong>{value}</strong>
					</div>
					<div style={{ fontSize: 12, color: '#64748b' }}>
						{row.email || 'No email on file'}
					</div>
					{canManageTenants && (
						<button
							type='button'
							onClick={() => onEditTenant(row)}
							style={{
								border: 'none',
								background: 'transparent',
								color: '#1d4ed8',
								fontWeight: 700,
								cursor: 'pointer',
								padding: 0,
								textAlign: 'left',
								fontSize: 12,
							}}>
							View history
						</button>
					)}
				</div>
			),
		},
		{
			header: 'Lease Status',
			key: 'leaseEndDisplay',
			render: (_value: any, row: any) => {
				const continuity = getLeaseContinuity(row);
				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
						<span
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 6,
								padding: '4px 10px',
								borderRadius: 999,
								fontSize: 12,
								fontWeight: 700,
								color: continuity.tone,
								background: continuity.bg,
								width: 'fit-content',
							}}>
							<FontAwesomeIcon icon={continuity.icon} />
							{continuity.label}
						</span>
						<div style={{ fontSize: 12, color: '#64748b' }}>
							Start: {row.leaseStartDisplay || 'N/A'} • End: {row.leaseEndDisplay || 'N/A'}
						</div>
					</div>
				);
			},
		},
		{
			header: 'Contact',
			key: 'phone',
			render: (value: string, row: any) => (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
					<span style={{ color: '#0f172a', fontWeight: 700 }}>{row.email || 'No email'}</span>
					<span style={{ color: '#64748b' }}>{value || 'No phone on file'}</span>
				</div>
			),
		},
		{
			header: 'Invite Status',
			key: 'inviteStatusDisplay',
			render: (_value: any, row: any) => {
				if (!row.inviteStatusDisplay || row.inviteStatusDisplay === 'No Invite') {
					return <span style={{ color: '#6b7280' }}>—</span>;
				}

				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
						<span
							style={{
								fontSize: '12px',
								fontWeight: 600,
							}}>
							{row.inviteStatusDisplay}
						</span>
						<span
							style={{
								fontSize: '11px',
								color: '#6b7280',
							}}>
							{row.inviteStatusDetails}
						</span>
					</div>
				);
			},
		},
	];

	const actions = canManageTenants
		? [
				{
					label: 'Edit',
					icon: faEdit,
					onClick: (tenant: any) => onEditTenant(tenant),
				},
				{
					label: 'Invite Options',
					icon: faEnvelope,
					onClick: (tenant: any) => setInviteModalTenant(tenant),
				},
				{
					label: 'Delete',
					icon: faTrash,
					onClick: (tenant: any) => onDeleteTenant(tenant),
					className: 'delete',
				},
		  ]
		: [];

	// Transform tenant data for the table
	const tableData = useMemo(() => {
		return filteredTenants.map((tenant: any) => ({
			...tenant,
			fullName: `${tenant.firstName} ${tenant.lastName}`,
			unitDisplay: tenant.unit || 'N/A',
			leaseStartDisplay: tenant.leaseStart || 'N/A',
			leaseEndDisplay: tenant.leaseEnd || 'N/A',
			inviteCodeDisplay: inviteCodeByTenantId[tenant.id]?.code || '',
			inviteStatusDisplay: formatInviteStatus(
				inviteCodeByTenantId[tenant.id]?.status,
			),
			inviteStatusDetails: getInviteStatusDetails(tenant.id),
		}));
	}, [filteredTenants, inviteCodeByTenantId, getInviteStatusDetails]);

	const modalInviteCode = inviteModalTenant
		? inviteCodeByTenantId[inviteModalTenant.id]?.code || ''
		: '';
	const modalInviteStatus = inviteModalTenant
		? formatInviteStatus(inviteCodeByTenantId[inviteModalTenant.id]?.status)
		: 'No Invite';
	const modalInviteDetails = inviteModalTenant
		? getInviteStatusDetails(inviteModalTenant.id)
		: '';

	return (
		<SectionContainer>
			<SectionHeader>Property Tenants</SectionHeader>
			<SectionLead>
				Track occupancy, lease timing, and resident status across the property.
			</SectionLead>
			{!canManageTenants && (
				<LockedFeatureCallout
					title={
						planAllowsTenantManagement || isTeamMemberAccount
							? 'Tenant management is read-only for your role'
							: 'Tenant management is locked on your current plan'
					}
					description={
						planAllowsTenantManagement || isTeamMemberAccount
							? 'You can review tenant occupancy details, but adding, inviting, or editing tenants requires a leasing or manager role.'
							: 'View tenant occupancy details in read-only mode. Upgrade to Portfolio to add, invite, or edit tenants.'
					}
					upgradeLabel='Upgrade for Tenant Tools'
					showUpgradeAction={!planAllowsTenantManagement && !isTeamMemberAccount}
					compact
				/>
			)}
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: 12,
					padding: 16,
					marginBottom: 16,
					borderRadius: 16,
					border: '1px solid #e2e8f0',
					background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
					boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
				}}>
				{canManageTenants && (
					<Toolbar style={{ marginBottom: 0 }}>
						<ToolbarButton onClick={() => setShowAddTenantModal(true)}>
							+ Add Tenant
						</ToolbarButton>
					</Toolbar>
				)}

				{/* Units are temporarily hidden from the app flow.
				{unitOptions.length > 0 && (
					<FormSelect
						name='unitFilter'
						value={selectedUnitId || ''}
						onChange={(e) => onSelectUnit && onSelectUnit(e.target.value)}
						style={{ marginLeft: 0 }}>
						<option value=''>All units</option>
						{unitOptions.map((u, idx) => (
							<option key={u.value ?? `unit-${idx}`} value={u.value}>
								{u.label}
							</option>
						))}
					</FormSelect>
				)}
				*/}
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
						placeholder='Search tenants...'
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
							whiteSpace: 'nowrap',
						}}
						title={showFilters ? 'Hide filters' : 'Show filters'}>
						{showFilters ? '▲ Hide Filters' : '▼ Filters'}
					</button>
				</div>
				{showFilters && (
					<FilterBar filters={tenantFilters} onFiltersChange={setFilters} />
				)}
			</div>

			{filteredTenants && filteredTenants.length > 0 ? (
				<>
					<DesktopTableWrapper>
						<GridContainer>
							<ReusableTable
								columns={columns}
								rowData={tableData}
								getRowClassName={(row: any) =>
									getLeaseContinuity(row).label === 'Expired' ? 'attention-row' : undefined
								}
								actions={actions}
								showCheckbox={false}
								hideHeader={true}
								emptyMessage='No tenant records yet. Add tenants to establish occupancy history.'
							/>
						</GridContainer>
					</DesktopTableWrapper>

					<div>
						{tableData.map((tenant: any) => {
							const continuity = getLeaseContinuity(tenant);
							const inviteCode = inviteCodeByTenantId[tenant.id]?.code;
							const cardAccent =
								continuity.label === 'Expired'
									? '#ef4444'
									: continuity.label === 'Upcoming'
									? '#3b82f6'
									: continuity.label === 'Active Lease'
									? '#22c55e'
									: '#94a3b8';

							return (
								<MobileTaskCard
									key={tenant.id}
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
													color: continuity.tone,
													background: continuity.bg,
													flexShrink: 0,
												}}>
												<FontAwesomeIcon icon={continuity.icon} />
											</span>
											<MobileTaskTitle>
												{tenant.fullName.trim() || 'Unnamed Tenant'}
											</MobileTaskTitle>
										</div>
										<span
											style={{
												display: 'inline-flex',
												alignItems: 'center',
												gap: 6,
												padding: '4px 10px',
												borderRadius: 999,
												fontSize: 12,
												fontWeight: 700,
												color: continuity.tone,
												background: continuity.bg,
												width: 'fit-content',
											}}>
											<FontAwesomeIcon icon={continuity.icon} />
											{continuity.label}
										</span>
									</MobileTaskHeader>

									<MobileFeedMeta>
										<MobileFeedLine>{tenant.email || 'No email on file'}</MobileFeedLine>
										<MobileFeedLineMuted>{tenant.phone || 'No phone on file'}</MobileFeedLineMuted>
										<MobileFeedLineMuted>
											Lease: {tenant.leaseStartDisplay || 'N/A'} to {tenant.leaseEndDisplay || 'N/A'}
										</MobileFeedLineMuted>
										<MobileFeedLineMuted>
											Invite: {tenant.inviteStatusDisplay || 'No Invite'} - {tenant.inviteStatusDetails}
										</MobileFeedLineMuted>
									</MobileFeedMeta>

									{canManageTenants && (
										<MobileTaskActions>
											<MobileActionButton
												variant='primary'
												onClick={() => onEditTenant(tenant)}>
												Edit Tenant
											</MobileActionButton>
											<MobileActionLinkRow>
												<MobileActionLinkButton onClick={() => setInviteModalTenant(tenant)}>
													Invite Options
												</MobileActionLinkButton>
												{inviteCode && (
													<MobileActionLinkButton
														onClick={() => handleCopyInviteCode(tenant.id, inviteCode)}>
														{copiedTenantId === tenant.id ? 'Copied' : 'Copy Code'}
													</MobileActionLinkButton>
												)}
												<MobileActionLinkButton
													$danger
													onClick={() => onDeleteTenant(tenant)}>
													Delete
												</MobileActionLinkButton>
											</MobileActionLinkRow>
										</MobileTaskActions>
									)}
								</MobileTaskCard>
							);
						})}
					</div>
				</>
			) : (
				<EmptyState>
					<h3>{(property?.tenants || []).length === 0 ? 'No tenants yet' : 'No tenants match your filters'}</h3>
					<p>
						{(property?.tenants || []).length === 0
							? 'Add tenants here when this rental has an occupant or lease contact to track.'
							: 'Try clearing filters, or add a tenant if this is a new occupancy record.'}
					</p>
					{canManageTenants && (
						<ToolbarButton type='button' onClick={() => setShowAddTenantModal(true)}>
							Add Tenant
						</ToolbarButton>
					)}
				</EmptyState>
			)}

			<GenericModal
				isOpen={!!inviteModalTenant}
				title='Tenant Invite Options'
				onClose={() => setInviteModalTenant(null)}
				showActions={false}>
				<div style={{ display: 'grid', gap: '12px' }}>
					<p style={{ margin: 0, fontWeight: 600 }}>
						{inviteModalTenant
							? `${inviteModalTenant.firstName} ${inviteModalTenant.lastName}`
							: ''}
					</p>
					<p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
						Status: {modalInviteStatus}
					</p>
					<p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
						{modalInviteDetails}
					</p>

					{modalInviteCode ? (
						<>
							<div
								style={{
									padding: '10px 12px',
									border: '1px solid #e5e7eb',
									borderRadius: '6px',
									fontFamily: 'monospace',
									fontWeight: 700,
								}}>
								{modalInviteCode}
							</div>
							<div style={{ display: 'flex', gap: '8px' }}>
								<button
									type='button'
									onClick={() =>
										handleCopyInviteCode(inviteModalTenant.id, modalInviteCode)
									}
									style={{
										padding: '8px 12px',
										border: '1px solid #d1d5db',
										background: '#fff',
										borderRadius: '6px',
										cursor: 'pointer',
									}}>
									{copiedTenantId === inviteModalTenant.id ? 'Copied' : 'Copy Code'}
								</button>
								<button
									type='button'
									onClick={() => handleEmailInviteCode(inviteModalTenant)}
									disabled={!inviteModalTenant?.email}
									style={{
										padding: '8px 12px',
										border: '1px solid #d1d5db',
										background: '#fff',
										borderRadius: '6px',
										cursor: inviteModalTenant?.email ? 'pointer' : 'not-allowed',
									}}>
									Email Code
								</button>
							</div>
						</>
					) : (
						<p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
							No invitation code found for this tenant yet.
						</p>
					)}

					<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
						<button
							type='button'
							onClick={() => setInviteModalTenant(null)}
							style={{
								padding: '8px 14px',
								border: '1px solid #d1d5db',
								background: '#fff',
								borderRadius: '6px',
								cursor: 'pointer',
							}}>
							Close
						</button>
					</div>
				</div>
			</GenericModal>
		</SectionContainer>
	);
};
