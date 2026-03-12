import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { faEdit, faEnvelope, faTrash } from '@fortawesome/free-solid-svg-icons';
import { TenantsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { FormSelect } from '../../../Components/Library/Modal/ModalStyles';
import { ReusableTable } from '../../../Components/Library/ReusableTable';
import { useSelector } from 'react-redux';
import { selectCanManageTenants } from '../../../Redux/selectors/permissionSelectors';
import {
	FilterBar,
	FilterConfig,
	FilterValues,
} from '../../../Components/Library/FilterBar';
import { applyFilters } from '../../../utils/tableFilters';
import {
	EmptyState,
	GridContainer,
	Toolbar,
	ToolbarButton,
} from './index.styles';
import { GenericModal } from '../../../Components/Library';
import {
	useLazyGetTenantInvitationCodeQuery,
	useLazyGetTenantInvitationCodesByEmailQuery,
} from '../../../Redux/API/tenantSlice';

export const TenantsTab: React.FC<TenantsTabProps> = ({
	property,
	currentUser,
	unitOptions = [],
	selectedUnitId,
	onSelectUnit,
	setShowAddTenantModal,
	onEditTenant,
	onDeleteTenant,
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
		if (selectedUnitId) {
			tenants = tenants.filter(
				(t: any) => t.unit === selectedUnitId || t.unitId === selectedUnitId,
			);
		}
		return applyFilters(tenants, filters, {
			textFields: ['firstName', 'lastName', 'email', 'phone', 'unit'],
			dateRangeFields: [
				{ field: 'leaseStart', filterKey: 'leaseDate' },
				{ field: 'leaseEnd', filterKey: 'leaseDate' },
			],
		});
	}, [property.tenants, filters, selectedUnitId]);
	const canManageTenantsByPlan = useSelector(selectCanManageTenants);
	const canManageTenants = !!currentUser && canManageTenantsByPlan;

	// Table configuration
	const columns = [
		{
			header: 'Name',
			key: 'fullName',
		},
		{
			header: 'Unit',
			key: 'unitDisplay',
		},
		{
			header: 'Email',
			key: 'email',
		},
		{
			header: 'Phone',
			key: 'phone',
		},
		{
			header: 'Lease Start',
			key: 'leaseStartDisplay',
		},
		{
			header: 'Lease End',
			key: 'leaseEndDisplay',
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
			{canManageTenants && (
				<Toolbar>
					<ToolbarButton onClick={() => setShowAddTenantModal(true)}>
						+ Add Tenant
					</ToolbarButton>
				</Toolbar>
			)}

			{unitOptions.length > 0 && (
				<FormSelect
					name='unitFilter'
					value={selectedUnitId || ''}
					onChange={(e) => onSelectUnit && onSelectUnit(e.target.value)}
					style={{ marginLeft: '12px' }}>
					<option value=''>All units</option>
					{unitOptions.map((u) => (
						<option key={u.value} value={u.value}>
							{u.label}
						</option>
					))}
				</FormSelect>
			)}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
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

			{filteredTenants && filteredTenants.length > 0 ? (
				<GridContainer>
					<ReusableTable
						columns={columns}
						rowData={tableData}
						actions={actions}
						showCheckbox={false}
					/>
				</GridContainer>
			) : (
				<EmptyState>
					<p>No tenants assigned to this property</p>
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
