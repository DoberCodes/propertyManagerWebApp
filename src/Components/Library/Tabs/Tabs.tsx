import React from 'react';

export interface TabsContextProps {
	property: any;
	hasCommercialSuites: boolean;
	currentUser: any;
	propertyMaintenanceRequests: any[];
	canApproveMaintenanceRequest: (role: any) => boolean;
}

interface TabsProps extends TabsContextProps {
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

interface tab {
	label: string;
	value: string;
	badgeCount?: number;
}

const Tabs: React.FC<TabsProps> = ({
	hasCommercialSuites,
	currentUser,
	propertyMaintenanceRequests,
	canApproveMaintenanceRequest,
	activeTab,
	setActiveTab,
}) => {
	const homeownerTabs: tab[] = [
		{ label: 'Details', value: 'details' },
		{ label: 'Tasks', value: 'tasks' },
		{ label: 'Maintenance History', value: 'maintenance' },
	];
	const comercialTabs: tab[] = [
		{ label: 'Details', value: 'details' },
		{ label: 'Tasks', value: 'tasks' },
		{ label: 'Maintenance History', value: 'maintenance' },
		{ label: 'Suites', value: 'suites' },
	];
	const landlordTabs: tab[] = [
		{ label: 'Details', value: 'details' },
		{ label: 'Tasks', value: 'tasks' },
		{ label: 'Maintenance History', value: 'maintenance' },
		{
			label: 'Tenants',
			value: 'tenants',
		},
		{ label: 'Suites', value: 'suites' },
		{
			label: 'Units',
			value: 'units',
		},
		{
			label: 'Requests',
			value: 'requests',
			badgeCount: propertyMaintenanceRequests.filter(
				(request) =>
					request.status === 'pending' &&
					canApproveMaintenanceRequest(currentUser.role),
			).length,
		},
	];

	console.info(currentUser);

	const tabOptions: tab[] = [];
	const settabsOptions = () => {
		if (currentUser.userType === 'homeowner') {
			tabOptions.push(...homeownerTabs);
		} else if (hasCommercialSuites) {
			tabOptions.push(...comercialTabs);
		} else {
			tabOptions.push(...landlordTabs);
		}
		return tabOptions;
	};

	return (
		<div style={{ display: 'flex', gap: 8 }}>
			{settabsOptions().map((tab) => (
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
					}}
					onClick={() => setActiveTab(tab.value)}>
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

export default Tabs;
