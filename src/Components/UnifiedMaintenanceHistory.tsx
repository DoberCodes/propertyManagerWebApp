import React, { useState } from 'react';
import {
	formatCurrency,
	getFinancialDisplayTotal,
} from '../utils/financialUtils';
import { COLORS } from '../constants/colors';

interface UnifiedMaintenanceHistoryProps {
	records: Array<any>;
	units: Array<any>;
	onNavigate?: (record: any) => void;
	onEdit?: (record: any) => void;
	/*onDelete?: (record: any) => void;*/ // Commented out since individual delete is not currently used
	onDelete?: (record: any) => void;
	groupId?: string;
	onDeleteGroup?: (records: Array<any>) => void;
	canSelect?: boolean;
	selectedRecordIds?: Set<string>;
	onToggleSelect?: (recordId: string) => void;
}

export const UnifiedMaintenanceHistory: React.FC<
	UnifiedMaintenanceHistoryProps
> = ({
	records,
	units,
	onNavigate,
	onEdit,
	onDelete,
	groupId,
	onDeleteGroup,
	canSelect = false,
	selectedRecordIds = new Set(),
	onToggleSelect,
}) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const latestRecord = records[0]; // Records are sorted by date, newest first

	const actionButtonBase: React.CSSProperties = {
		padding: '8px 12px',
		borderRadius: '6px',
		fontSize: '13px',
		fontWeight: 700,
		border: '1px solid transparent',
		cursor: 'pointer',
	};

	const secondaryActionStyle: React.CSSProperties = {
		...actionButtonBase,
		background: '#f3f4f6',
		color: '#374151',
		borderColor: '#d1d5db',
	};

	const primaryActionStyle: React.CSSProperties = {
		...actionButtonBase,
		background: COLORS.primaryLight,
		color: COLORS.primary,
		borderColor: COLORS.primary,
	};

	const cardMetaRowStyle: React.CSSProperties = {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '6px',
	};

	const cardMetaPillStyle: React.CSSProperties = {
		padding: '4px 8px',
		borderRadius: '999px',
		fontSize: '11px',
		fontWeight: 700,
		background: '#f8fafc',
		color: '#475569',
		border: '1px solid #e2e8f0',
	};

	const recordCardStyle: React.CSSProperties = {
		display: 'grid',
		gap: '8px',
		padding: '12px',
		border: '1px solid #e5e7eb',
		borderRadius: '10px',
		background: '#f8fafc',
	};

	const notesPreviewStyle: React.CSSProperties = {
		margin: 0,
		fontSize: '13px',
		lineHeight: 1.45,
		color: '#475569',
	};

	const actionRowStyle: React.CSSProperties = {
		display: 'flex',
		gap: '8px',
		flexWrap: 'wrap',
	};

	const actionMenuSummaryStyle: React.CSSProperties = {
		...secondaryActionStyle,
		listStyle: 'none',
		textAlign: 'center',
	};

	const actionMenuStyle: React.CSSProperties = {
		position: 'absolute',
		right: 0,
		top: 'calc(100% + 6px)',
		minWidth: 156,
		padding: '6px',
		borderRadius: 8,
		border: '1px solid #e2e8f0',
		background: '#ffffff',
		boxShadow: '0 10px 24px rgba(15, 23, 42, 0.14)',
		zIndex: 12,
		display: 'flex',
		flexDirection: 'column',
		gap: 4,
	};

	const actionMenuItemStyle: React.CSSProperties = {
		border: '1px solid transparent',
		background: '#ffffff',
		color: '#334155',
		fontSize: '13px',
		fontWeight: 700,
		textAlign: 'left',
		padding: '8px 10px',
		borderRadius: 6,
		cursor: 'pointer',
	};

	const formatRecordDate = (value?: string) => {
		if (!value) return 'No date';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'No date';
		return date.toLocaleDateString();
	};

	const getCostLabel = (record: any) => {
		const total = getFinancialDisplayTotal(record?.financials);
		if (!total) return 'No cost logged';
		return formatCurrency(total, record?.financials?.currency || 'USD');
	};

	const getNotesPreview = (record: any) => {
		const raw = String(record?.completionNotes || record?.notes || '').trim();
		if (!raw) return 'No service notes added yet.';
		if (raw.length <= 140) return raw;
		return `${raw.slice(0, 140).trim()}...`;
	};

	const getAttachmentCount = (record: any) => {
		const count = [record?.completionFile, ...(Array.isArray(record?.attachments) ? record.attachments : [])].filter(Boolean).length;
		return count;
	};

	const areAllRecordsSelected =
		records.length > 0 && records.every((record) => selectedRecordIds.has(record.id));

	const hasGroupSecondaryActions = Boolean(canSelect || onEdit || onDeleteGroup);
	const hasRecordSecondaryActions = Boolean(canSelect || onEdit || onDelete);

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
						<div style={cardMetaRowStyle}>
							<span style={cardMetaPillStyle}>Latest {formatRecordDate(latestRecord.completionDate)}</span>
							<span style={cardMetaPillStyle}>{getCostLabel(latestRecord)}</span>
							{latestRecord.unitId && getUnitName(latestRecord.unitId) && (
								<span style={cardMetaPillStyle}>{getUnitName(latestRecord.unitId)}</span>
							)}
							{getAttachmentCount(latestRecord) > 0 && (
								<span style={cardMetaPillStyle}>{getAttachmentCount(latestRecord)} attachment{getAttachmentCount(latestRecord) === 1 ? '' : 's'}</span>
							)}
						</div>
						<p style={{ ...notesPreviewStyle, marginTop: '8px' }}>{getNotesPreview(latestRecord)}</p>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
						<button
							onClick={(e) => {
								e.stopPropagation();
								onNavigate?.(latestRecord);
							}}
							style={primaryActionStyle}>
							View
						</button>
						{hasGroupSecondaryActions && (
							<details
								onClick={(e) => e.stopPropagation()}
								style={{ position: 'relative' }}>
								<summary style={actionMenuSummaryStyle}>Manage</summary>
								<div style={actionMenuStyle}>
									{canSelect && onToggleSelect && (
										<button
											onClick={(e) => {
												e.stopPropagation();
												records.forEach((record) => {
													const isSelected = selectedRecordIds.has(record.id);
													if (areAllRecordsSelected ? isSelected : !isSelected) {
														onToggleSelect(record.id);
													}
												});
											}}
											style={actionMenuItemStyle}>
											{areAllRecordsSelected ? 'Deselect group' : 'Select group'}
										</button>
									)}
									{onEdit && (
										<button
											onClick={(e) => {
												e.stopPropagation();
												onEdit(latestRecord);
											}}
											style={actionMenuItemStyle}>
											Edit group
										</button>
									)}
									{onDeleteGroup && (
										<button
											onClick={(e) => {
												e.stopPropagation();
												onDeleteGroup(records);
											}}
											style={{ ...actionMenuItemStyle, color: '#b91c1c' }}>
											Delete group
										</button>
									)}
								</div>
							</details>
						)}
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
							}}>
							<div style={recordCardStyle}>
							<p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
								{record.title}
							</p>
							<div style={cardMetaRowStyle}>
								<span style={cardMetaPillStyle}>{formatRecordDate(record.completionDate)}</span>
								<span style={cardMetaPillStyle}>{getCostLabel(record)}</span>
								{record.unitId && getUnitName(record.unitId) && (
									<span style={cardMetaPillStyle}>{getUnitName(record.unitId)}</span>
								)}
								{getAttachmentCount(record) > 0 && (
									<span style={cardMetaPillStyle}>{getAttachmentCount(record)} attachment{getAttachmentCount(record) === 1 ? '' : 's'}</span>
								)}
							</div>
							<p style={notesPreviewStyle}>{getNotesPreview(record)}</p>
							<div style={actionRowStyle}>
								<button
									onClick={(e) => {
										e.stopPropagation();
										onNavigate?.(record);
									}}
									style={primaryActionStyle}>
									View
								</button>
								{hasRecordSecondaryActions && (
									<details
										onClick={(e) => e.stopPropagation()}
										style={{ position: 'relative' }}>
										<summary style={actionMenuSummaryStyle}>Manage</summary>
										<div style={actionMenuStyle}>
											{canSelect && onToggleSelect && record?.id && (
												<button
													onClick={(e) => {
														e.stopPropagation();
														onToggleSelect(record.id);
													}}
													style={actionMenuItemStyle}>
													{selectedRecordIds.has(record.id) ? 'Deselect' : 'Select'}
												</button>
											)}
											{onEdit && (
												<button
													onClick={(e) => {
														e.stopPropagation();
														onEdit(record);
													}}
													style={actionMenuItemStyle}>
													Edit record
												</button>
											)}
											{onDelete && (
												<button
													onClick={(e) => {
														e.stopPropagation();
														onDelete(record);
													}}
													style={{ ...actionMenuItemStyle, color: '#b91c1c' }}>
													Delete
												</button>
											)}
										</div>
									</details>
								)}
							</div>
							</div>
						</div>
				  ))
				: null}
		</div>
	);
};
