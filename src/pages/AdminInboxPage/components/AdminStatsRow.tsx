/**
 * AdminStatsRow Component
 * Displays ticket count statistics
 */

import React from 'react';
import { StatsRow, StatCard } from '../AdminInboxPage.styles';
import type { StatusOption } from '../constants';

interface AdminStatsRowProps {
	ticketCounts: Record<StatusOption, number>;
}

export const AdminStatsRow: React.FC<AdminStatsRowProps> = ({ ticketCounts }) => {
	return (
		<StatsRow>
			<StatCard>Received: {ticketCounts.received}</StatCard>
			<StatCard>In Progress: {ticketCounts.in_progress}</StatCard>
			<StatCard>Resolved: {ticketCounts.resolved}</StatCard>
			<StatCard>Closed: {ticketCounts.closed}</StatCard>
		</StatsRow>
	);
};
