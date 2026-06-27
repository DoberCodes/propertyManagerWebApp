import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { PropertyScanPanel } from '../../../Components/PropertyIntelligence/PropertyScanPanel';
import { PropertyScanHistoryPanel } from '../../../Components/PropertyIntelligence/PropertyScanHistoryPanel';
import { PropertyKnowledgeReviewPanel } from './PropertyKnowledgeReviewPanel';
import { Device, Property } from '../../../types/Property.types';
import { Task } from '../../../types/Task.types';
import {
	PropertyScanActionType,
	PropertyScanRecommendation,
} from '../../../utils/propertyIntelligenceScan';
import { SubscriptionData } from '../../../utils/subscriptionUtils';
import type { RoleCapabilities } from '../../../utils/permissions';

type InsightsWorkspaceTab = 'overview' | 'suggested-details' | 'history';

const isInsightsWorkspaceTab = (
	value: string | null,
): value is InsightsWorkspaceTab =>
	value === 'overview' || value === 'suggested-details' || value === 'history';

interface InsightsTabProps {
	property: Property;
	propertyDevices: Device[];
	tasks: Task[];
	maintenanceHistoryRecords: any[];
	propertyContractors?: any[];
	canRunScan: boolean;
	accountId?: string;
	showSetupPrompt?: boolean;
	subscription?: SubscriptionData | null;
	permissions?: RoleCapabilities;
	onAddMaintenanceHistory?: (history: any) => Promise<void> | void;
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
	propertyContractors = [],
	canRunScan,
	accountId,
	showSetupPrompt,
	subscription,
	permissions,
	onAddMaintenanceHistory,
	onRecommendationAction,
}) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const requestedWorkspaceTab = searchParams.get('insightsTab');
	const requestedSuggestionId = searchParams.get('suggestionId');
	const [activeWorkspaceTab, setActiveWorkspaceTab] =
		useState<InsightsWorkspaceTab>(
			isInsightsWorkspaceTab(requestedWorkspaceTab)
				? requestedWorkspaceTab
				: 'overview',
		);

	useEffect(() => {
		if (
			isInsightsWorkspaceTab(requestedWorkspaceTab) &&
			requestedWorkspaceTab !== activeWorkspaceTab
		) {
			setActiveWorkspaceTab(requestedWorkspaceTab);
		}
	}, [activeWorkspaceTab, requestedWorkspaceTab]);

	const selectWorkspaceTab = (tab: InsightsWorkspaceTab) => {
		setActiveWorkspaceTab(tab);
		const nextParams = new URLSearchParams(searchParams);
		nextParams.set('tab', 'insights');
		nextParams.set('insightsTab', tab);
		if (tab !== 'suggested-details') {
			nextParams.delete('suggestionId');
		}
		setSearchParams(nextParams);
	};

	const selectSuggestion = (suggestionId: string) => {
		const nextParams = new URLSearchParams(searchParams);
		nextParams.set('tab', 'insights');
		nextParams.set('insightsTab', 'suggested-details');
		nextParams.set('suggestionId', suggestionId);
		setSearchParams(nextParams);
	};

	return (
		<InsightsWorkspace>
			<InsightsNav aria-label='Insights workspace sections' role='tablist'>
				<InsightsTabButton
					type='button'
					role='tab'
					aria-selected={activeWorkspaceTab === 'overview'}
					$active={activeWorkspaceTab === 'overview'}
					onClick={() => selectWorkspaceTab('overview')}>
					Overview
				</InsightsTabButton>
				<InsightsTabButton
					type='button'
					role='tab'
					aria-selected={activeWorkspaceTab === 'suggested-details'}
					$active={activeWorkspaceTab === 'suggested-details'}
					onClick={() => selectWorkspaceTab('suggested-details')}>
					Suggested Details
				</InsightsTabButton>
				<InsightsTabButton
					type='button'
					role='tab'
					aria-selected={activeWorkspaceTab === 'history'}
					$active={activeWorkspaceTab === 'history'}
					onClick={() => selectWorkspaceTab('history')}>
					History
				</InsightsTabButton>
			</InsightsNav>

			{activeWorkspaceTab === 'overview' && (
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
			)}
			{activeWorkspaceTab === 'suggested-details' && (
				<PropertyKnowledgeReviewPanel
					property={property}
					propertyDevices={propertyDevices}
					propertyContractors={propertyContractors}
					permissions={permissions}
					selectedSuggestionId={requestedSuggestionId}
					onSelectSuggestion={selectSuggestion}
					onAddMaintenanceHistory={onAddMaintenanceHistory}
				/>
			)}
			{activeWorkspaceTab === 'history' && (
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
