import React, { useState } from 'react';
import { ActionButton } from 'Components/Library/ReusableTable/ReusableTable.styles';
import {
	formatCurrency,
	getFinancialDisplayTotal,
} from '../utils/financialUtils';

interface UnifiedMaintenanceHistoryProps {
	records: Array<any>;
	units: Array<any>;
	onNavigate?: (record: any) => void;
	/*onDelete?: (record: any) => void;*/ // Commented out since individual delete is not currently used
	onDelete?: (record: any) => void;
	groupId?: string;
	onDeleteGroup?: (records: Array<any>) => void;
}

export const UnifiedMaintenanceHistory: React.FC<
	UnifiedMaintenanceHistoryProps
> = ({ records, units, onNavigate, /*onDelete,*/ groupId, onDeleteGroup }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const latestRecord = records[0]; // Records are sorted by date, newest first

	const getUnitName = (unitId?: string) => {
		if (!unitId) return '';
		const unit = units.find((u) => u.id === unitId);
		return unit ? unit.unitName : '';
	};

	return (
		<div
			style={{
				background: 'white',
				borderRadius: '8px',
				padding: '16px',
				boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
				border: '1px solid #e5e7eb',
				marginBottom: '16px',
			}}>
			{/* Group Header */}
			{groupId && (
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						cursor: 'pointer',
						marginBottom: isExpanded ? '16px' : '0',
					}}
					onClick={() => setIsExpanded(!isExpanded)}>
					<div>
						<h3
							style={{
								margin: '0 0 4px 0',
								fontSize: '16px',
								fontWeight: '600',
							}}>
							🔄 {latestRecord.title} ({records.length} instances)
						</h3>
						<p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
							Latest:{' '}
							{new Date(latestRecord.completionDate).toLocaleDateString()}
							<span style={{ marginLeft: '8px' }}>
								•
								{' '}
								{formatCurrency(
									getFinancialDisplayTotal(latestRecord.financials),
									latestRecord.financials?.currency || 'USD',
								)}
							</span>
							{latestRecord.unitId && (
								<span style={{ marginLeft: '8px', fontWeight: '500' }}>
									• {getUnitName(latestRecord.unitId)}
								</span>
							)}
						</p>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<ActionButton
							className='delete'
							onClick={(e) => {
								e.stopPropagation();
								onDeleteGroup?.(records);
							}}>
							Delete group
						</ActionButton>
						<ActionButton
							onClick={(e) => {
								e.stopPropagation();
								onNavigate?.(records);
							}}>
							View details
						</ActionButton>
						<span style={{ fontSize: '18px', color: '#6b7280' }}>
							{isExpanded ? '▼' : '▶'}
						</span>
					</div>
				</div>
			)}

			{/* Records */}
			{!groupId || isExpanded
				? records.map((record) => (
						<div key={record.id} style={{ marginBottom: '8px' }}>
							<p>{record.title}</p>
							{/* Additional record details */}
							<ActionButton
								className='delete'
								onClick={(e) => {
									e.stopPropagation();
									onDeleteGroup?.(records);
								}}>
								Delete record
							</ActionButton>
							<ActionButton
								onClick={(e) => {
									e.stopPropagation();
									onNavigate?.(record);
								}}>
								View details
							</ActionButton>
						</div>
				  ))
				: null}
		</div>
	);
};
