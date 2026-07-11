import React, { useMemo } from 'react';
import styled from 'styled-components';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { EmptyState, SectionLead, TabSummaryBar, TabSummaryPill } from './index.styles';
import type { Task } from '../../../types/Task.types';
import {
	formatCurrency,
	getFinancialDisplayTotal,
} from '../../../utils/financialUtils';
import { formatDisplayDate, getDisplayDateTime } from '../../../utils/dateDisplay';
import {
	getMaintenanceEventDate,
	getMaintenanceEventTitle,
} from '../../../utils/maintenanceEventUtils';

type CostsTabProps = {
	tasks?: Task[];
	maintenanceHistoryRecords?: any[];
};

type CostRecord = {
	id: string;
	source: 'maintenance' | 'task';
	sourceId?: string;
	linkedTaskId?: string;
	title: string;
	date?: string;
	total?: number;
	currency: string;
	contractor?: string;
	notes?: string;
	statusLabel: string;
};

const formatDate = (value?: string) => {
	if (!value) return 'No date recorded';
	return formatDisplayDate(value, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}) || value;
};

const sortByDateDesc = (a: CostRecord, b: CostRecord) => {
	const aTime = getDisplayDateTime(a.date);
	const bTime = getDisplayDateTime(b.date);
	return bTime - aTime;
};

export const CostsTab: React.FC<CostsTabProps> = ({
	tasks = [],
	maintenanceHistoryRecords = [],
}) => {
	const costRecords = useMemo<CostRecord[]>(() => {
		const taskIdsWithMaintenanceCosts = new Set<string>();
		const maintenanceCosts = maintenanceHistoryRecords
			.map((record: any): CostRecord | null => {
				const total = getFinancialDisplayTotal(record.financials);
				if (total === undefined) return null;
				const linkedTaskId =
					record.originalTaskId ||
					(Array.isArray(record.linkedTaskIds) ? record.linkedTaskIds[0] : '') ||
					record.taskId;
				if (linkedTaskId) {
					taskIdsWithMaintenanceCosts.add(String(linkedTaskId));
				}
				return {
					id: `maintenance-${record.id || record.createdAt || record.title}`,
					source: 'maintenance',
					sourceId: record.id,
					linkedTaskId: linkedTaskId ? String(linkedTaskId) : undefined,
					title: getMaintenanceEventTitle(record) || 'Maintenance record',
					date: getMaintenanceEventDate(record),
					total,
					currency: record.financials?.currency || 'USD',
					contractor: record.completedByName,
					notes: record.financials?.notes || record.completionNotes,
					statusLabel: 'Recorded cost',
				};
			})
			.filter(Boolean) as CostRecord[];

		const taskCosts = tasks
			.map((task): CostRecord | null => {
				if (
					task.id &&
					taskIdsWithMaintenanceCosts.has(String(task.id)) &&
					(task.status === 'Completed' || task.completionDate)
				) {
					return null;
				}
				const total = getFinancialDisplayTotal(task.financials);
				if (total === undefined) return null;
				return {
					id: `task-${task.id}`,
					source: 'task',
					sourceId: task.id,
					linkedTaskId: task.id,
					title: task.title || 'Maintenance task',
					date: task.completionDate || task.dueDate,
					total,
					currency: task.financials?.currency || 'USD',
					contractor:
						task.assignedTo?.name ||
						task.assigneeName ||
						[task.assigneeFirstName, task.assigneeLastName]
							.filter(Boolean)
							.join(' '),
					notes: task.financials?.notes || task.completionNotes || task.notes,
					statusLabel:
						task.status === 'Completed' ? 'Completed task cost' : 'Task estimate',
				};
			})
			.filter(Boolean) as CostRecord[];

		return [...maintenanceCosts, ...taskCosts].sort(sortByDateDesc);
	}, [maintenanceHistoryRecords, tasks]);

	const totalRecorded = costRecords.reduce(
		(sum, record) => sum + (record.total || 0),
		0,
	);
	const maintenanceCostCount = costRecords.filter(
		(record) => record.source === 'maintenance',
	).length;
	const taskCostCount = costRecords.filter((record) => record.source === 'task').length;

	return (
		<SectionContainer>
			<SectionHeader>Costs</SectionHeader>
			<SectionLead>
				Review costs from maintenance events, invoices, completed work, and
				task estimates in one place.
			</SectionLead>

			<TabSummaryBar>
				<TabSummaryPill>{formatCurrency(totalRecorded)} recorded</TabSummaryPill>
				<TabSummaryPill>{maintenanceCostCount} maintenance record{maintenanceCostCount === 1 ? '' : 's'}</TabSummaryPill>
				<TabSummaryPill>{taskCostCount} task cost{taskCostCount === 1 ? '' : 's'}</TabSummaryPill>
			</TabSummaryBar>

			{costRecords.length === 0 ? (
				<EmptyState>
					Recorded invoice totals, contractor costs, labor, parts, and other
					maintenance costs will appear here after they are saved.
				</EmptyState>
			) : (
				<CostList>
					{costRecords.map((record) => (
						<CostItem key={record.id}>
							<CostMain>
								<CostTitle>{record.title}</CostTitle>
								<CostMeta>
									<span>{record.statusLabel}</span>
									<span>{formatDate(record.date)}</span>
									{record.contractor && <span>{record.contractor}</span>}
								</CostMeta>
								{record.notes && <CostNotes>{record.notes}</CostNotes>}
							</CostMain>
							<CostAmount>{formatCurrency(record.total, record.currency)}</CostAmount>
						</CostItem>
					))}
				</CostList>
			)}
		</SectionContainer>
	);
};

const CostList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 16px;
`;

const CostItem = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 16px;
	align-items: start;
	padding: 14px 16px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #ffffff;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		gap: 10px;
	}
`;

const CostMain = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

const CostTitle = styled.div`
	font-size: 15px;
	font-weight: 800;
	color: #0f172a;
	line-height: 1.35;
`;

const CostMeta = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	font-size: 12px;
	font-weight: 700;
	color: #64748b;

	span {
		padding: 4px 8px;
		border-radius: 999px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
	}
`;

const CostNotes = styled.div`
	max-width: 760px;
	color: #64748b;
	font-size: 13px;
	line-height: 1.45;
	white-space: pre-line;
`;

const CostAmount = styled.div`
	font-size: 18px;
	font-weight: 900;
	color: #0f172a;
	white-space: nowrap;
	text-align: right;

	@media (max-width: 640px) {
		text-align: left;
	}
`;
