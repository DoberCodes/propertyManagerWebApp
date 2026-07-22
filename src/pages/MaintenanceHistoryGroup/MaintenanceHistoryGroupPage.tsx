import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useDetailPageData } from 'Hooks/useDetailPageData';
import { useDeleteMaintenanceHistoryMutation } from 'Redux/API/maintenanceSlice';
import { useGetContractorsByPropertyQuery } from 'Redux/API/contractorSlice';
import { RootState } from 'Redux/store/store';
import { getFamilyMembers } from 'services/authService';
import {
	SectionContainer,
	SectionHeader,
} from 'Components/Library/InfoCards/InfoCardStyles';
import { WarningDialog } from 'Components/Library/WarningDialog';
import {
	GridContainer,
	GridTable,
	EmptyState,
} from 'Components/Library/DataGrid/DataGridStyles';
import { useGetTeamMembersQuery } from 'Redux/API/teamSlice';
import {
	formatCurrency,
	getFinancialDisplayTotal,
} from 'utils/financialUtils';
import { useAppFeedback } from 'Components/Library/AppFeedback/AppFeedbackProvider';
import { COLORS } from '../../constants/colors';

export const MaintenanceHistoryGroupPage: React.FC = () => {
	const feedback = useAppFeedback();
	const { slug, groupId } = useParams<{ slug: string; groupId: string }>();
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isTeamMemberAccount = currentUser?.isTeamMemberAccount === true;
	const { property, tasks, maintenanceHistory } = useDetailPageData({
		propertySlug: slug || '',
		entityType: 'property',
	});
	const [deleteMaintenanceHistory] = useDeleteMaintenanceHistoryMutation();
	const { data: teamMembers = [] } = useGetTeamMembersQuery();
	const { data: propertyContractors = [] } = useGetContractorsByPropertyQuery(
		property?.id || '',
		{ skip: !property?.id },
	);
	const [familyMembers, setFamilyMembers] = useState<any[]>([]);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteDialogMessage, setDeleteDialogMessage] = useState('');
	const [pendingDeleteAction, setPendingDeleteAction] = useState<
		() => Promise<void>
	>(() => async () => {});

	useEffect(() => {
		const loadFamilyMembers = async () => {
			if (isTeamMemberAccount) {
				setFamilyMembers([]);
				return;
			}

			if (!currentUser?.accountId) return;
			try {
				const members = await getFamilyMembers(currentUser.accountId);
				setFamilyMembers(members);
			} catch (error) {
				console.error('Failed to load family members:', error);
			}
		};
		loadFamilyMembers();
	}, [currentUser?.accountId, isTeamMemberAccount]);

	const groupRecords = useMemo(() => {
		if (!groupId) return [];

		const getMaintenanceGroupId = (record: any): string => {
			// Priority 1: Use existing group ID
			if (record.maintenanceGroupId) {
				return record.maintenanceGroupId;
			}

			// Priority 2: Use recurring task ID
			if (record.recurringTaskId) {
				return record.recurringTaskId;
			}

			// Priority 3: If linked to same tasks, group by linked task IDs
			if (record.linkedTaskIds && record.linkedTaskIds.length > 0) {
				const sortedLinkedIds = [...record.linkedTaskIds].sort();
				return `linked-${sortedLinkedIds.join(',')}`;
			}

			return record.id;
		};

		const records = maintenanceHistory.filter((record: any) => {
			const recordGroupId = getMaintenanceGroupId(record);
			return String(recordGroupId) === String(groupId);
		});

		return records.sort(
			(a: any, b: any) =>
				new Date(b.completionDate).getTime() -
				new Date(a.completionDate).getTime(),
		);
	}, [maintenanceHistory, groupId]);

	const linkedTaskIds = useMemo(() => {
		const ids = new Set<string>();
		groupRecords.forEach((record: any) => {
			(record.linkedTaskIds || []).forEach((id: string) => ids.add(id));
		});
		return Array.from(ids);
	}, [groupRecords]);

	const linkedTasks = useMemo(() => {
		if (!linkedTaskIds.length) return [];
		return tasks.filter((task: any) => linkedTaskIds.includes(task.id));
	}, [tasks, linkedTaskIds]);

	const missingLinkedTaskIds = useMemo(() => {
		const existing = new Set(linkedTasks.map((task: any) => task.id));
		return linkedTaskIds.filter((id) => !existing.has(id));
	}, [linkedTaskIds, linkedTasks]);

	const dateRange = useMemo(() => {
		if (!groupRecords.length) return 'N/A';
		const newest = groupRecords[0]?.completionDate;
		const oldest = groupRecords[groupRecords.length - 1]?.completionDate;
		if (!newest || !oldest) return 'N/A';
		return `${new Date(oldest).toLocaleDateString()} - ${new Date(
			newest,
		).toLocaleDateString()}`;
	}, [groupRecords]);

	const completedByLookup = useMemo(() => {
		const lookup = new Map<string, string>();

		teamMembers.forEach((member: any) => {
			const name = `${member.firstName || ''} ${member.lastName || ''}`.trim();
			if (name) {
				lookup.set(member.id, name);
			}
		});

		propertyContractors.forEach((contractor: any) => {
			const name = contractor.companyName || contractor.name || 'Contractor';
			lookup.set(contractor.id, name);
		});

		familyMembers.forEach((member: any) => {
			const name = `${member.firstName || ''} ${member.lastName || ''}`.trim();
			if (name) {
				lookup.set(member.id, name);
			}
		});

		return lookup;
	}, [teamMembers, propertyContractors, familyMembers]);

	const getCompletedByDisplay = (record: any) => {
		if (record.completedByName) return record.completedByName;
		if (!record.completedBy) return '-';
		return completedByLookup.get(record.completedBy) || record.completedBy;
	};

	const handleDeleteGroup = async () => {
		const deletableRecords = groupRecords.filter(
			(record: any) => !record.isLegacy && record.id,
		);
		if (!deletableRecords.length) {
			feedback.notify(
				'No deletable maintenance history records found in this group.',
			);
			return;
		}

		const recordNames = deletableRecords
			.slice(0, 3)
			.map((record: any) => record.title || record.description || record.completionNotes || 'Maintenance record')
			.join(', ');
		const moreCount = Math.max(0, deletableRecords.length - 3);
		setDeleteDialogMessage(
			`Remove ${deletableRecords.length} maintenance history record(s): ${recordNames}${moreCount ? `, and ${moreCount} more` : ''}? Corrections will remain in the audit trail. Linked tasks will not be deleted.`,
		);
		setPendingDeleteAction(() => async () => {
			for (const record of deletableRecords) {
				await deleteMaintenanceHistory({
					id: record.id,
					correctionReason: 'Removed as part of a maintenance history group correction.',
				}).unwrap();
			}
			navigate(`/property/${property?.slug || slug}`);
		});
		setDeleteDialogOpen(true);
	};

	if (!property) {
		return (
			<SectionContainer>
				<EmptyState>
					<p>Property not found</p>
				</EmptyState>
			</SectionContainer>
		);
	}

	return (
		<SectionContainer>
			<WarningDialog
				open={deleteDialogOpen}
				title='Confirm Deletion'
				message={deleteDialogMessage}
				confirmText='Delete'
				cancelText='Cancel'
				onConfirm={async () => {
					setDeleteDialogOpen(false);
					await pendingDeleteAction();
				}}
				onCancel={() => setDeleteDialogOpen(false)}
			/>
			<SectionHeader>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
					<div style={{ fontSize: '12px', color: '#6b7280' }}>
						<Link
							to={`/property/${property.slug}`}
							style={{
								color: '#3b82f6',
								textDecoration: 'none',
								fontWeight: 500,
							}}>
							{property.title}
						</Link>
						<span style={{ margin: '0 6px' }}>/</span>
						<span>Maintenance History</span>
					</div>
					<div>Maintenance History Group</div>
				</div>
			</SectionHeader>

			{groupRecords.length === 0 ? (
				<EmptyState>
					<p>
						No maintenance history found for this group. Return to the property to add tasks or maintenance records.
					</p>
					<button
						type='button'
						onClick={() => navigate(`/property/${property.slug || slug}`)}>
						Back to Property
					</button>
				</EmptyState>
			) : (
				<>
					<div
						style={{
							background: 'white',
							border: '1px solid #e5e7eb',
							borderRadius: '8px',
							padding: '16px',
							marginBottom: '16px',
						}}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								gap: '12px',
							}}>
							<div>
								<div style={{ fontWeight: '600', marginBottom: '4px' }}>
									{groupRecords[0].title || 'Maintenance'}
								</div>
								<div style={{ fontSize: '12px', color: '#6b7280' }}>
									Instances: {groupRecords.length} | Date Range: {dateRange}
								</div>
							</div>
							<button
								onClick={handleDeleteGroup}
								style={{
									padding: '6px 12px',
									background: '#ef4444',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor: 'pointer',
									fontSize: '12px',
								}}>
								Delete group
							</button>
						</div>
					</div>

					<div style={{ height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
						<GridContainer>
							<GridTable>
								<thead>
									<tr>
										<th>Date</th>
										<th>Completed By</th>
										<th>Notes</th>
										<th>Cost</th>
										<th>Attachments</th>
									</tr>
								</thead>
								<tbody>
									{groupRecords.map((record: any) => (
										<tr key={record.id}>
											<td>
												{record.completionDate
													? new Date(record.completionDate).toLocaleDateString()
													: '-'}
											</td>
											<td>{getCompletedByDisplay(record)}</td>
											<td>{record.completionNotes || record.notes || '-'}</td>
											<td>
												{formatCurrency(
													getFinancialDisplayTotal(record.financials),
													record.financials?.currency || 'USD',
												)}
											</td>
											<td>
												{record.completionFile?.url ? (
													<a
														href={record.completionFile.url}
														target='_blank'
														rel='noopener noreferrer'
														style={{ color: COLORS.primary }}>
														📎 {record.completionFile.name}
													</a>
												) : (
													'-'
												)}
											</td>
										</tr>
									))}
								</tbody>
							</GridTable>
						</GridContainer>
					</div>

					<div
						style={{
							marginTop: '20px',
							background: 'white',
							border: '1px solid #e5e7eb',
							borderRadius: '8px',
							padding: '16px',
						}}>
						<div style={{ fontWeight: '600', marginBottom: '8px' }}>
							Linked Tasks
						</div>
						{linkedTasks.length === 0 ? (
							<p style={{ margin: 0, color: '#6b7280' }}>
								No tasks linked to this group
							</p>
						) : (
							<ul style={{ margin: 0, paddingLeft: '18px' }}>
								{linkedTasks.map((task: any) => (
									<li key={task.id} style={{ marginBottom: '6px' }}>
										{task.title} ({task.status}) - Due:{' '}
										{task.dueDate
											? new Date(task.dueDate).toLocaleDateString()
											: 'N/A'}
									</li>
								))}
							</ul>
						)}
						{missingLinkedTaskIds.length > 0 && (
							<div style={{ marginTop: '8px', color: '#9ca3af' }}>
								Missing task records: {missingLinkedTaskIds.join(', ')}
							</div>
						)}
					</div>
				</>
			)}
		</SectionContainer>
	);
};
