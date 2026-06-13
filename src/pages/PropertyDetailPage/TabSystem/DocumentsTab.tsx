import React, { useMemo } from 'react';
import {
	SectionContainer,
	SectionHeader,
} from 'Components/Library/InfoCards/InfoCardStyles';
import {
	TabSummaryBar,
	TabSummaryPill,
	SectionLead,
	EmptyState,
} from './index.styles';

type PropertyFileRecord = {
	name: string;
	url?: string;
	source: 'appliance' | 'maintenance';
	sourceLabel: string;
	date?: string;
};

interface DocumentsTabProps {
	property: any;
	propertyDevices?: any[];
	maintenanceHistoryRecords?: any[];
}

const getRecordDateValue = (record: any): string => {
	if (!record) return '';
	if (typeof record.completionDate === 'string') return record.completionDate;
	if (typeof record.date === 'string') return record.date;
	if (typeof record.completedAt === 'string') return record.completedAt;
	if (typeof record.createdAt === 'string') return record.createdAt;
	return '';
};

const getMaintenanceAttachments = (record: any): Array<{ name: string; url?: string }> => {
	const files: Array<{ name: string; url?: string }> = [];

	if (record?.completionFile?.name) {
		files.push({
			name: record.completionFile.name,
			url: record.completionFile.url,
		});
	}

	if (record?.completionFileData?.name) {
		files.push({
			name: record.completionFileData.name,
			url: record.completionFileData.url,
		});
	}

	if (Array.isArray(record?.attachments)) {
		record.attachments.forEach((attachment: any) => {
			const name = attachment?.fileName || attachment?.name;
			if (!name) return;
			files.push({ name, url: attachment?.url });
		});
	}

	if (Array.isArray(record?.files)) {
		record.files.forEach((file: any) => {
			if (!file?.name) return;
			files.push({ name: file.name, url: file.url });
		});
	}

	const deduped = new Map<string, { name: string; url?: string }>();
	files.forEach((file) => {
		const key = `${file.name}::${file.url || ''}`;
		if (!deduped.has(key)) deduped.set(key, file);
	});

	return Array.from(deduped.values());
};

const formatDate = (value?: string) => {
	if (!value) return 'Date unknown';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Date unknown';
	return date.toLocaleDateString();
};

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
	property,
	propertyDevices = [],
	maintenanceHistoryRecords = [],
}) => {
	const applianceDocuments = useMemo<PropertyFileRecord[]>(() => {
		const records: PropertyFileRecord[] = [];

		propertyDevices.forEach((device: any) => {
			const files = Array.isArray(device?.files) ? device.files : [];
			files.forEach((file: any) => {
				if (!file?.name) return;
				records.push({
					name: file.name,
					url: file.url,
					source: 'appliance',
					sourceLabel: device?.type || device?.name || 'Appliance/System',
					date: getRecordDateValue(file),
				});
			});
		});

		return records;
	}, [propertyDevices]);

	const maintenanceDocuments = useMemo<PropertyFileRecord[]>(() => {
		const records: PropertyFileRecord[] = [];

		maintenanceHistoryRecords.forEach((record: any) => {
			const title =
				record?.title || record?.taskTitle || record?.description || 'Maintenance record';
			const date = getRecordDateValue(record);
			getMaintenanceAttachments(record).forEach((file) => {
				records.push({
					name: file.name,
					url: file.url,
					source: 'maintenance',
					sourceLabel: title,
					date,
				});
			});
		});

		return records;
	}, [maintenanceHistoryRecords]);

	const allDocuments = useMemo(() => {
		const deduped = new Map<string, PropertyFileRecord>();
		[...applianceDocuments, ...maintenanceDocuments].forEach((record) => {
			const key = `${record.name}::${record.url || ''}`;
			if (!deduped.has(key)) {
				deduped.set(key, record);
			}
		});

		return Array.from(deduped.values()).sort((a, b) => {
			const aTime = new Date(a.date || 0).getTime() || 0;
			const bTime = new Date(b.date || 0).getTime() || 0;
			return bTime - aTime;
		});
	}, [applianceDocuments, maintenanceDocuments]);

	return (
		<SectionContainer>
			<SectionHeader>
				Files & Documents ({allDocuments.length})
			</SectionHeader>
			<SectionLead>
				Review every file attached across this property, including appliance/system records and maintenance documentation.
			</SectionLead>
			<TabSummaryBar>
				<TabSummaryPill>
					{applianceDocuments.length} appliance/system file{applianceDocuments.length === 1 ? '' : 's'}
				</TabSummaryPill>
				<TabSummaryPill>
					{maintenanceDocuments.length} maintenance file{maintenanceDocuments.length === 1 ? '' : 's'}
				</TabSummaryPill>
				<TabSummaryPill>
					Property: {property?.title || 'Current property'}
				</TabSummaryPill>
			</TabSummaryBar>

			{allDocuments.length === 0 ? (
				<EmptyState>
					<h3>No files or documents yet</h3>
					<p>
						Upload files from appliances, maintenance history, or task completion to build the property record.
					</p>
				</EmptyState>
			) : (
				<div style={{ display: 'grid', gap: 10 }}>
					{allDocuments.map((file, index) => {
						const key = `${file.name}-${file.url || 'no-url'}-${index}`;
						return (
							<div
								key={key}
								style={{
									background: '#ffffff',
									border: '1px solid #e2e8f0',
									borderRadius: 10,
									padding: '12px 14px',
									display: 'grid',
									gap: 6,
								}}>
								{file.url ? (
									<a
										href={file.url}
										target='_blank'
										rel='noopener noreferrer'
										style={{
											fontSize: 14,
											fontWeight: 700,
											color: '#0f766e',
											textDecoration: 'underline',
										}}>
										{file.name}
									</a>
								) : (
									<div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>
										{file.name}
									</div>
								)}
								<div style={{ fontSize: 12, color: '#475569' }}>
									Source: {file.sourceLabel}
								</div>
								<div style={{ fontSize: 12, color: '#64748b' }}>
									{file.source === 'appliance' ? 'Appliance/System file' : 'Maintenance attachment'} • {formatDate(file.date)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</SectionContainer>
	);
};
