import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab } from '../../../Redux/Slices/appSlice';
import { RootState } from '../../../Redux/store/store';
import { USER_ROLES } from '../../../constants/roles';
import { RoleCapabilities } from '../../../utils/permissions';

export interface TabsContextProps {
	property: any;
	currentUser: any;
	propertyMaintenanceRequests: any[];
	canApproveMaintenanceRequest: (role: any) => boolean;
	unitOptions?: { label: string; value: string }[];
	selectedUnitId?: string;
	onSelectUnit?: (id: string) => void;
	permissions?: RoleCapabilities;
}

export interface tab {
	label: string;
	value: string;
	badgeCount?: number;
}

export const TabController: React.FC<TabsContextProps> = ({
	property,
	currentUser,
	permissions,
}) => {
	const dispatch = useDispatch();
	const isMobile = useSelector((state: RootState) => state.app.isMobile);
	const activeTab =
		useSelector((state: RootState) => state.app.activeTab) || 'details';

	const normalizedPlan = String(currentUser?.subscription?.plan || '').toLowerCase();
	const isHomeowner = normalizedPlan === 'home' || normalizedPlan === 'homeowner';
	const isPropertyManager = currentUser ? !isHomeowner : true;
	const isTenant = currentUser?.role === USER_ROLES.TENANT;
	const isContractor = currentUser?.role === USER_ROLES.CONTRACTOR;
	const canViewMaintenanceTabs =
		permissions?.canManageTasks ||
		permissions?.canManageMaintenanceHistory ||
		permissions?.canManageAppliances ||
		(!isTenant && !isContractor);
	const canViewTenantTabs =
		property?.isRental &&
		!isTenant &&
		(permissions?.canManageTenants ||
			permissions?.canManageProperties ||
			permissions?.canManageFinancials);
	const canViewRequestTab =
		property?.isRental &&
		(isTenant ||
			permissions?.canCreateMaintenanceRequests ||
			permissions?.canApproveMaintenanceRequests ||
			(isPropertyManager && !isContractor));
	const canViewContractors =
		!isTenant &&
		(permissions?.canManageContractors ||
			permissions?.canManageTasks ||
			permissions?.canManageTenants ||
			isPropertyManager);

	const baseTabs: tab[] = isTenant
		? [{ label: 'Details', value: 'details' }]
		: [
				{ label: 'Details', value: 'details' },
				...(canViewMaintenanceTabs
					? [
							{ label: 'Appliances', value: 'devices' },
							{ label: 'Tasks', value: 'tasks' },
							{ label: 'Maintenance History', value: 'maintenance' },
					  ]
					: []),
		  ];

	const tabsForProperty: tab[] = [...baseTabs];

	// Units are temporarily hidden from the app flow while the core loop is simplified.
	// if (!isTenant && property?.propertyType === 'Multi-Family') {
	// 	tabsForProperty.push({ label: 'Units', value: 'units' });
	// }

	if (canViewTenantTabs) {
		tabsForProperty.push({ label: 'Tenants', value: 'tenants' });
	}

	if (canViewRequestTab) {
		tabsForProperty.push({
			label: 'Requests',
			value: 'requests',
		});
	}

	if (canViewContractors) {
		tabsForProperty.push({ label: 'Contractors', value: 'contractors' });
	}

	const tabs = tabsForProperty;

	useEffect(() => {
		if (!tabs.some((tab) => tab.value === activeTab)) {
			dispatch(setActiveTab('details'));
		}
	}, [tabs, activeTab, dispatch]);

	const handleTabChange = (tabValue: string) => {
		dispatch(setActiveTab(tabValue));
	};

	if (isMobile) {
		return (
			<div style={{ width: '100%', marginBottom: '10px' }}>
				<div
					style={{
						width: '100%',
						padding: '2px 4px',
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))',
						gap: 8,
					}}
					aria-label='Property tabs'>
						{tabs.map((tab) => (
							<button
								key={tab.value}
								style={{
									height: '38px',
									padding: '0 12px',
									borderRadius: '10px',
									border:
										activeTab === tab.value
											? '1px solid #15803d'
											: '1px solid #d1d5db',
									background:
										activeTab === tab.value
											? '#dcfce7'
											: '#ffffff',
									color: activeTab === tab.value ? '#15803d' : '#334155',
									fontWeight: 700,
									fontSize: '0.82rem',
									cursor: 'pointer',
									whiteSpace: 'nowrap',
									position: 'relative',
									minWidth: 0,
								}}
								onClick={() => handleTabChange(tab.value)}>
								{tab.label === 'Maintenance History' ? 'History' : tab.label}
								{tab.badgeCount && tab.badgeCount > 0 && (
									<span
										style={{
											backgroundColor: '#f59e0b',
											color: 'white',
											borderRadius: '999px',
											padding: '1px 6px',
											marginLeft: 6,
											fontSize: 11,
											fontWeight: 700,
										}}>
										{tab.badgeCount}
									</span>
								)}
							</button>
						))}
				</div>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
			{tabs.map((tab) => (
				<button
					key={tab.value}
					style={{
						padding: '8px 16px',
						border: 'none',
						borderBottom:
							activeTab === tab.value
							? '2px solid #0f172a'
							: '2px solid transparent',
					background: 'none',
					color: activeTab === tab.value ? '#0f172a' : '#64748b',
					fontWeight: activeTab === tab.value ? 700 : 500,
					cursor: 'pointer',
					position: 'relative',
					whiteSpace: 'nowrap',
					fontSize: '14px',
					}}
					onClick={() => handleTabChange(tab.value)}>
					{tab.label}
					{tab.badgeCount && tab.badgeCount > 0 && (
						<span
							style={{
								backgroundColor: '#f39c12',
								color: 'white',
								borderRadius: '10px',
								padding: '2px 8px',
								marginLeft: 6,
								fontSize: 12,
								position: 'absolute',
								top: -8,
								right: -12,
							}}>
							{tab.badgeCount}
						</span>
					)}
				</button>
			))}
		</div>
	);
};
