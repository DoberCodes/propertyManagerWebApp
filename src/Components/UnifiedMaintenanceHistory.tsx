import React, { useState } from 'react';
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

	const actionButtonBase: React.CSSProperties = {
		padding: '8px 12px',
		borderRadius: '6px',
		fontSize: '13px',
		fontWeight: 500,
		border: '1px solid transparent',
		cursor: 'pointer',
	};

	const secondaryActionStyle: React.CSSProperties = {
		...actionButtonBase,
		background: '#f3f4f6',
		color: '#374151',
		borderColor: '#d1d5db',
	};

	const dangerActionStyle: React.CSSProperties = {
		...actionButtonBase,
		background: '#ef4444',
		color: '#ffffff',
	};

	const moreSummaryStyle: React.CSSProperties = {
		...secondaryActionStyle,
		textAlign: 'center',
		listStyle: 'none',
	};

	const moreMenuStyle: React.CSSProperties = {
		position: 'absolute',
		right: 0,
		bottom: 'calc(100% + 6px)',
		minWidth: 136,
		padding: '6px',
		borderRadius: 8,
		border: '1px solid #e2e8f0',
		background: '#ffffff',
		boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
		zIndex: 15,
		display: 'flex',
		flexDirection: 'column',
		gap: 4,
	};

	const moreMenuItemStyle: React.CSSProperties = {
		border: '1px solid transparent',
		background: '#ffffff',
		color: '#1f2937',
		fontSize: '13px',
		fontWeight: 600,
		textAlign: 'left',
		padding: '8px 10px',
		borderRadius: 6,
		cursor: 'pointer',
	};

	const getUnitName = (unitId?: string) => {
		if (!unitId) return '';
		const unit = units.find((u) => u.id === unitId);
		return unit ? unit.unitName : '';
	};

	return (
		<div
			style={{
				background: 'white',
				borderRadius: '12px',
				padding: '14px',
				boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
				border: '1px solid #e5e7eb',
				marginBottom: '8px',
			}}>
			{/* Group Header */}
			{groupId && (
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						gap: '10px',
						flexDirection: 'column',
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
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
						<button
							onClick={(e) => {
								e.stopPropagation();
								onDeleteGroup?.(records);
							}}
							style={dangerActionStyle}>
							Delete group
						</button>
						<details
							onClick={(e) => {
								e.stopPropagation();
							}}
							style={{ position: 'relative' }}>
							<summary style={moreSummaryStyle}>More</summary>
							<div style={moreMenuStyle}>
								<button
									onClick={(e) => {
										e.stopPropagation();
										onNavigate?.(latestRecord);
									}}
									style={moreMenuItemStyle}>
									View details
								</button>
							</div>
						</details>
						<span style={{ fontSize: '18px', color: '#6b7280' }}>
							{isExpanded ? '▼' : '▶'}
						</span>
					</div>
				</div>
			)}

			{/* Records */}
			{!groupId || isExpanded
				? records.map((record) => (
						<div
							key={record.id}
							style={{
								marginBottom: '8px',
								paddingBottom: '8px',
								borderBottom: '1px solid #f3f4f6',
							}}>
							<p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>
								{record.title}
							</p>
							{/* Additional record details */}
							<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
								<button
									onClick={(e) => {
										e.stopPropagation();
										onDeleteGroup?.([record]);
									}}
									style={dangerActionStyle}>
									Delete record
								</button>
								<details
									onClick={(e) => {
										e.stopPropagation();
									}}
									style={{ position: 'relative' }}>
									<summary style={moreSummaryStyle}>More</summary>
									<div style={moreMenuStyle}>
										<button
											onClick={(e) => {
												e.stopPropagation();
												onNavigate?.(record);
											}}
											style={moreMenuItemStyle}>
											View details
										</button>
									</div>
								</details>
							</div>
						</div>
				  ))
				: null}
		</div>
	);
};
