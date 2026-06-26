import React, { useState } from 'react';
import styled from 'styled-components';
import { PropertyScanPanel } from '../../../Components/PropertyIntelligence/PropertyScanPanel';
import { PropertyScanHistoryPanel } from '../../../Components/PropertyIntelligence/PropertyScanHistoryPanel';
import { Device, Property } from '../../../types/Property.types';
import { Task } from '../../../types/Task.types';
import {
	PropertyScanActionType,
	PropertyScanRecommendation,
} from '../../../utils/propertyIntelligenceScan';
import { SubscriptionData } from '../../../utils/subscriptionUtils';

interface InsightsTabProps {
	property: Property;
	propertyDevices: Device[];
	tasks: Task[];
	maintenanceHistoryRecords: any[];
	canRunScan: boolean;
	accountId?: string;
	showSetupPrompt?: boolean;
	subscription?: SubscriptionData | null;
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
	accountId,
	showSetupPrompt,
	subscription,
	onRecommendationAction,
}) => {
	const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
		'overview' | 'history'
	>('overview');

	return (
		<InsightsWorkspace>
			<InsightsNav aria-label='Insights workspace sections' role='tablist'>
				<InsightsTabButton
					type='button'
					role='tab'
					aria-selected={activeWorkspaceTab === 'overview'}
					$active={activeWorkspaceTab === 'overview'}
					onClick={() => setActiveWorkspaceTab('overview')}>
					Overview
				</InsightsTabButton>
				<InsightsTabButton
					type='button'
					role='tab'
					aria-selected={activeWorkspaceTab === 'history'}
					$active={activeWorkspaceTab === 'history'}
					onClick={() => setActiveWorkspaceTab('history')}>
					History
				</InsightsTabButton>
			</InsightsNav>

			{activeWorkspaceTab === 'overview' ? (
				<PropertyScanPanel
					property={property}
					systems={propertyDevices}
					tasks={tasks}
					maintenanceHistory={maintenanceHistoryRecords}
					canRunScan={canRunScan}
					showSetupPrompt={showSetupPrompt}
					subscription={subscription}
					onRecommendationAction={onRecommendationAction}
				/>
			) : (
				<PropertyScanHistoryPanel
					propertyId={property.id}
					accountId={accountId || (property as any).accountId || property.userId}
					canRunScan={canRunScan}
				/>
			)}
		</InsightsWorkspace>
	);
};

const InsightsWorkspace = styled.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
`;

const InsightsNav = styled.div`
	align-self: flex-start;
	display: inline-flex;
	gap: 4px;
	border: 1px solid #d9e2ec;
	border-radius: 8px;
	background: #f8fafc;
	padding: 4px;

	@media (max-width: 520px) {
		width: 100%;
	}
`;

const InsightsTabButton = styled.button<{ $active: boolean }>`
	border: 0;
	border-radius: 6px;
	background: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
	color: ${({ $active }) => ($active ? '#172033' : '#475569')};
	box-shadow: ${({ $active }) =>
		$active ? '0 1px 3px rgba(15, 23, 42, 0.12)' : 'none'};
	cursor: pointer;
	font-size: 14px;
	font-weight: 800;
	min-height: 36px;
	padding: 8px 14px;

	&:hover {
		color: #172033;
		background: #ffffff;
	}

	&:focus-visible {
		outline: 2px solid #0f766e;
		outline-offset: 2px;
	}

	@media (max-width: 520px) {
		flex: 1;
	}
`;
