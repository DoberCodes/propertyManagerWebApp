import React, { useState, useEffect } from 'react';
import { FormSelect } from '../Modal/ModalStyles';

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
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkIsMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkIsMobile();
		window.addEventListener('resize', checkIsMobile);

		return () => window.removeEventListener('resize', checkIsMobile);
	}, []);

	const homeownerTabs: tab[] = [
		{ label: 'Details', value: 'details' },
		{ label: 'Devices', value: 'devices' },
		{ label: 'Tasks', value: 'tasks' },
		{ label: 'Maintenance History', value: 'maintenance' },
		{ label: 'Contractors', value: 'contractors' },
	];
	const comercialTabs: tab[] = [
		{ label: 'Details', value: 'details' },
		{ label: 'Devices', value: 'devices' },
		{ label: 'Tasks', value: 'tasks' },
		{ label: 'Maintenance History', value: 'maintenance' },
		{ label: 'Suites', value: 'suites' },
		{ label: 'Contractors', value: 'contractors' },
	];
	const landlordTabs: tab[] = [
		{ label: 'Details', value: 'details' },
		{ label: 'Devices', value: 'devices' },
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
		{ label: 'Contractors', value: 'contractors' },
	];

	console.info(currentUser);

	const tabOptions: tab[] = [];
	const settabsOptions = () => {
		if (currentUser?.subscription?.plan === 'homeowner') {
			tabOptions.push(...homeownerTabs);
		} else if (hasCommercialSuites) {
			tabOptions.push(...comercialTabs);
		} else {
			tabOptions.push(...landlordTabs);
		}
		return tabOptions;
	};

	const tabs = settabsOptions();

	if (isMobile) {
		return (
			<div
				style={{
					width: '100%',
					padding: '0 16px',
					marginBottom: '8px',
				}}>
				<FormSelect
					value={activeTab}
					onChange={(e) => setActiveTab(e.target.value)}
					style={{
						width: '100%',
						padding: '12px 16px',
						border: '2px solid #e5e7eb',
						borderRadius: '8px',
						fontSize: '16px',
						fontWeight: '500',
						backgroundColor: '#ffffff',
						color: '#374151',
						cursor: 'pointer',
						transition: 'all 0.2s ease',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						outline: 'none',
					}}
					onFocus={(e) => {
						e.target.style.borderColor = '#10b981';
						e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
					}}
					onBlur={(e) => {
						e.target.style.borderColor = '#e5e7eb';
						e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
					}}>
					{tabs.map((tab) => (
						<option key={tab.value} value={tab.value}>
							{tab.label}
							{tab.badgeCount && tab.badgeCount > 0
								? ` (${tab.badgeCount})`
								: ''}
						</option>
					))}
				</FormSelect>
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
