import React from 'react';
import { DetailsTab } from './DetailsTab';
import { DevicesTab } from './DevicesTab';
import { TasksTab } from './TasksTab';
import { MaintenanceTab } from './MaintenanceTab';
import { ContractorsTab } from './ContractorsTab';
import { RequestsTab } from './RequestsTab';
import { TenantsTab } from './TenantsTab';
import { TabContentContainer, TabControlsContainer } from './index.styles';
import { TabController } from 'Components/Library';
import { Task } from 'types/Task.types';
import { RootState } from 'Redux/store/store';
import { useSelector } from 'react-redux';
import { RoleCapabilities } from 'utils/permissions';

interface TabsProps {
	property: any;
	propertyTasks: Task[];
	currentUser: any;
	propertyMaintenanceRequests: any[];
	canApproveMaintenanceRequest: (role: any) => boolean;
	maintenanceHistoryRecords: any[];
	propertyUnits: any[];
	teamMembers: any[];
	propertyContractors: any[];
	familyMembers: any[];
	allTasks: Task[];
	// unit filtering support for multifamily properties
	unitOptions?: { label: string; value: string }[];
	selectedUnitId?: string;
	onSelectUnit?: (id: string) => void;
	assigneeOptions?: { label: string; value: string; email?: string }[];
	openCreateTaskToken?: number;
	handleAddMaintenanceHistory: (history: any) => void;
	handleDeleteMaintenanceHistory: (historyId: string) => void;
	setShowAddTenantModal: (show: boolean) => void;
	handleEditTenant: (tenant: any) => void;
	handleDeleteTenant: (tenantId: string) => void;
	handleViewTenantPromo: (tenantId: string) => void;
	handleConvertRequestToTask: (requestId: string) => void;
	handleCreateTask: (task: any) => void;
	handleEditTask: (task: any) => void;
	handleCreateDevice?: () => void;
	handleCreateRequest?: () => void;
	permissions?: RoleCapabilities;
}

export const TabSystem = ({
	property,
	currentUser,
	propertyMaintenanceRequests,
	canApproveMaintenanceRequest,
	propertyTasks,
	maintenanceHistoryRecords,
	propertyUnits,
	teamMembers,
	propertyContractors,
	familyMembers,
	allTasks,
	unitOptions = [],
	selectedUnitId,
	onSelectUnit,
	openCreateTaskToken = 0,
	// assigneeOptions intentionally not used here
	handleAddMaintenanceHistory,
	handleDeleteMaintenanceHistory,
	setShowAddTenantModal,
	handleEditTenant,
	handleDeleteTenant,
	handleViewTenantPromo,
	handleConvertRequestToTask,
	handleCreateTask,
	handleCreateDevice,
	handleCreateRequest,
	permissions,
}: TabsProps) => {
	const activeTab = useSelector((state: RootState) => state.app.activeTab); // Default to 'details' if no active tab is set

	console.info('Rendering TabSystem with activeTab:', activeTab); // Debug log for activeTab

	const renderTabContent = () => {
		switch (activeTab) {
			case 'details':
				return (
					<DetailsTab
						property={property}
						teamMembers={[]}
						propertyTasks={propertyTasks}
						maintenanceHistoryRecords={maintenanceHistoryRecords}
						onCreateTask={() => handleCreateTask(property)}
						onCreateDevice={handleCreateDevice}
						onCreateRequest={handleCreateRequest}
						permissions={permissions}
					/>
				);
			case 'devices':
				return <DevicesTab property={property} permissions={permissions} />;
			case 'suites':
				return null;
			case 'tasks':
				return (
					<TasksTab
						property={property}
						propertyTasks={propertyTasks}
						currentUser={currentUser}
						unitOptions={unitOptions}
						selectedUnitId={selectedUnitId}
						onSelectUnit={onSelectUnit}
						openCreateTaskToken={openCreateTaskToken}
						permissions={permissions}
					/>
				);
			case 'maintenance':
				return (
					<MaintenanceTab
						property={property}
						maintenanceHistoryRecords={maintenanceHistoryRecords}
						units={propertyUnits}
						teamMembers={teamMembers}
						contractors={propertyContractors}
						familyMembers={familyMembers}
						tasks={allTasks}
						onAddMaintenanceHistory={handleAddMaintenanceHistory}
						onDeleteMaintenanceHistory={handleDeleteMaintenanceHistory}
						permissions={permissions}
					/>
				);
			case 'tenants':
				return (
					property?.isRental && (
						<TenantsTab
							property={property}
							currentUser={currentUser}
							unitOptions={unitOptions}
							selectedUnitId={selectedUnitId}
							onSelectUnit={onSelectUnit}
							setShowAddTenantModal={setShowAddTenantModal}
							onEditTenant={handleEditTenant}
							onDeleteTenant={handleDeleteTenant}
							onViewTenantPromo={handleViewTenantPromo}
							permissions={permissions}
						/>
					)
				);
			case 'units':
				return null;
			case 'requests':
				return (
					property?.isRental && (
						<RequestsTab
							propertyMaintenanceRequests={propertyMaintenanceRequests}
							currentUser={currentUser}
							unitOptions={unitOptions}
							selectedUnitId={selectedUnitId}
							onSelectUnit={onSelectUnit}
							canApproveMaintenanceRequest={canApproveMaintenanceRequest}
							handleConvertRequestToTask={handleConvertRequestToTask}
							onCreateTask={() => handleCreateTask(property)}
							permissions={permissions}
						/>
					)
				);
			case 'contractors':
				return <ContractorsTab propertyId={property?.id || ''} permissions={permissions} />;
			default:
				return null;
		}
	};

	return (
		<>
			<TabControlsContainer>
				<TabController
					property={property}
					currentUser={currentUser}
					unitOptions={unitOptions}
					selectedUnitId={selectedUnitId}
					onSelectUnit={onSelectUnit}
					propertyMaintenanceRequests={propertyMaintenanceRequests}
					canApproveMaintenanceRequest={canApproveMaintenanceRequest}
					permissions={permissions}
				/>
			</TabControlsContainer>

			<TabContentContainer>{renderTabContent()}</TabContentContainer>
		</>
	);
};
