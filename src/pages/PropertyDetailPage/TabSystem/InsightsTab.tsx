import React from 'react';
import { PropertyScanPanel } from '../../../Components/PropertyIntelligence/PropertyScanPanel';
import { Device, Property } from '../../../types/Property.types';
import { Task } from '../../../types/Task.types';
import {
	PropertyScanActionType,
	PropertyScanRecommendation,
} from '../../../utils/propertyIntelligenceScan';

interface InsightsTabProps {
	property: Property;
	propertyDevices: Device[];
	tasks: Task[];
	maintenanceHistoryRecords: any[];
	canRunScan: boolean;
	showSetupPrompt?: boolean;
	onRecommendationAction: (
		actionType: PropertyScanActionType,
		recommendation: PropertyScanRecommendation,
	) => void;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({
	property,
	propertyDevices,
	tasks,
	maintenanceHistoryRecords,
	canRunScan,
	showSetupPrompt,
	onRecommendationAction,
}) => (
	<PropertyScanPanel
		property={property}
		systems={propertyDevices}
		tasks={tasks}
		maintenanceHistory={maintenanceHistoryRecords}
		canRunScan={canRunScan}
		showSetupPrompt={showSetupPrompt}
		onRecommendationAction={onRecommendationAction}
	/>
);
