import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../Redux/store/store';
import { DropdownButton } from '../DropdownButton/DropdownButton';
import { useDispatch } from 'react-redux';
import { setActiveTab } from '../../../Redux/Slices/appSlice';
import { USER_ROLES } from '../../../constants/roles';

export interface TabsContextProps {
	property: any;
	currentUser: any;
	propertyMaintenanceRequests: any[];
	canApproveMaintenanceRequest: (role: any) => boolean;
	// optional unit filtering support
	unitOptions?: { label: string; value: string }[];
	selectedUnitId?: string;
	onSelectUnit?: (id: string) => void;
}

export interface tab {
	label: string;
	value: string;
	badgeCount?: number;
}

export const TabController: React.FC<TabsContextProps> = ({
	property,
	currentUser,
	propertyMaintenanceRequests,
	canApproveMaintenanceRequest,
}) => {
	const dispatch = useDispatch();
	const isMobile = useSelector((state: RootState) => state.app.isMobile);
	const activeTab =
		useSelector((state: RootState) => state.app.activeTab) || 'details'; // Default to 'details' if no active tab is set

	// derive homeowner status from the passed-in `currentUser` prop so the
	// component remains pure/testable (tests pass `currentUser` directly)
	const isHomeowner = currentUser?.subscription?.plan === 'homeowner';
	const isPropertyManager = currentUser ? !isHomeowner : true;
	const isTenant = currentUser?.role === USER_ROLES.TENANT;
	const isContractor = currentUser?.role === USER_ROLES.CONTRACTOR;
	// Build tabs dynamically based on property attributes and user type
	const baseTabs: tab[] = isTenant
		? [{ label: 'Details', value: 'details' }]
		: [
				{ label: 'Details', value: 'details' },
				{ label: 'Devices', value: 'devices' },
				{ label: 'Tasks', value: 'tasks' },
				{ label: 'Maintenance History', value: 'maintenance' },
		  ];

	const tabsForProperty: tab[] = [...baseTabs];

	// Suites for commercial properties with suites enabled - temporarily hidden for commercial
	// if (property?.propertyType === 'Commercial' && hasCommercialSuites) {
	//     tabsForProperty.push({ label: 'Suites', value: 'suites' });
	// }

	// Units for multi-family properties
	if (!isTenant && property?.propertyType === 'Multi-Family') {
		tabsForProperty.push({ label: 'Units', value: 'units' });
	}

	// Tenants and Requests only for rental properties and non-homeowner users
	if (property?.isRental && isPropertyManager && !isTenant) {
		tabsForProperty.push({ label: 'Tenants', value: 'tenants' });
	}

	if (property?.isRental && (isPropertyManager || isTenant)) {
		tabsForProperty.push({
			label: 'Requests',
			value: 'requests',
			badgeCount:
				isTenant || isContractor
					? 0
					: propertyMaintenanceRequests.filter(
							(request) =>
								request.status === 'pending' &&
								canApproveMaintenanceRequest(currentUser.role),
					  ).length,
		});
	}

	// Contractors tab always available
	if (!isTenant) {
		tabsForProperty.push({ label: 'Contractors', value: 'contractors' });
	}

	const tabs = tabsForProperty;

	useEffect(() => {
		if (!tabs.some((tab) => tab.value === activeTab)) {
			dispatch(setActiveTab('details'));
		}
	}, [tabs, activeTab, dispatch]);

	const handleTabChange = (tab: string) => {
		dispatch(setActiveTab(tab)); // Persist the active tab in Redux
	};

	if (isMobile) {
		return (
			<div
				style={{
					width: '100%',
					padding: '0 16px',
					marginBottom: '8px',
					overflowX: 'auto',
				}}>
				<DropdownButton
					activeTab={activeTab}
					SetActiveTab={handleTabChange}
					availableTabs={tabs}
				/>
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
								? '2px solid #22c55e'
								: '2px solid transparent',
						background: 'none',
						color: activeTab === tab.value ? '#22c55e' : '#333',
						fontWeight: activeTab === tab.value ? 600 : 400,
						cursor: 'pointer',
						position: 'relative',
						whiteSpace: 'nowrap',
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
