import React from 'react';
import { DetailsTab } from './DetailsTab';
import { DevicesTab } from './DevicesTab';
import { SuitesTab } from './SuitesTab';
import { TasksTab } from './TasksTab';
import { MaintenanceTab } from './MaintenanceTab';
import { ContractorsTab } from './ContractorsTab';
import { RequestsTab } from './RequestsTab';
import { TenantsTab } from './TenantsTab';
import { UnitsTab } from './UnitsTab';
import { TabContentContainer, TabControlsContainer } from './index.styles';
import { TabController } from 'Components/Library';
import { Task } from 'types/Task.types';
import { RootState } from 'Redux/store/store';
import { useSelector } from 'react-redux';

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
	openCreateWorkflowToken?: number;
	handleAddMaintenanceHistory: (history: any) => void;
	handleDeleteMaintenanceHistory: (historyId: string) => void;
	setShowAddTenantModal: (show: boolean) => void;
	handleEditTenant: (tenant: any) => void;
	handleDeleteTenant: (tenantId: string) => void;
	handleViewTenantPromo: (tenantId: string) => void;
	handleCreateUnit: () => void;
	handleDeleteUnit: (unitId: string) => void;
	handleConvertRequestToTask: (requestId: string) => void;
	handleCreateTask: (task: any) => void;
	handleEditTask: (task: any) => void;
	handleCreateDevice?: () => void;
	handleCreateRequest?: () => void;
	hasCommercialSuites?: boolean;
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
	openCreateWorkflowToken = 0,
	// assigneeOptions intentionally not used here
	handleAddMaintenanceHistory,
	handleDeleteMaintenanceHistory,
	setShowAddTenantModal,
	handleEditTenant,
	handleDeleteTenant,
	handleViewTenantPromo,
	handleCreateUnit,
	handleDeleteUnit,
	handleConvertRequestToTask,
	handleCreateTask,
	handleCreateDevice,
	handleCreateRequest,
	hasCommercialSuites,
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
					/>
				);
			case 'devices':
				return <DevicesTab property={property} />;
			case 'suites':
				return (
					property?.propertyType !== 'Commercial' &&
					property?.hasSuites && <SuitesTab property={property} />
				);
			case 'tasks':
				return (
					<TasksTab
						property={property}
						propertyTasks={propertyTasks}
						currentUser={currentUser}
						unitOptions={unitOptions}
						selectedUnitId={selectedUnitId}
						onSelectUnit={onSelectUnit}
						openCreateWorkflowToken={openCreateWorkflowToken}
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
					/>
				);
			case 'tenants':
				return (
					property?.isRental &&
					!hasCommercialSuites && (
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
						/>
					)
				);
			case 'units':
				return (
					property?.propertyType === 'Multi-Family' && (
						<UnitsTab
							property={property}
							units={propertyUnits}
							handleCreateUnit={handleCreateUnit}
							handleDeleteUnit={handleDeleteUnit}
						/>
					)
				);
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
						/>
					)
				);
			case 'contractors':
				return <ContractorsTab propertyId={property?.id || ''} />;
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
				/>
			</TabControlsContainer>

			<TabContentContainer>{renderTabContent()}</TabContentContainer>
		</>
	);
};
