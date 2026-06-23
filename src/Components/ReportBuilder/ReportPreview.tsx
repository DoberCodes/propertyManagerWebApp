import React from 'react';
import {
	PreviewTable,
	Table,
	MobilePreviewCards,
	MobilePreviewCard,
	MobilePreviewCardHeader,
	MobilePreviewCardKicker,
	MobilePreviewCardTitle,
	MobilePreviewFieldList,
	MobilePreviewField,
	MobilePreviewLabel,
	MobilePreviewValue,
	MobilePreviewEmptyColumns,
} from './ReportBuilder.styles';
import { formatPreviewValue } from './reportPreviewUtils';

type ReportPreviewProps = {
	data: any[];
	selectedColumns: string[];
	columnOptions: Record<string, string>;
	emptyColumnsMessage?: string;
};

export const ReportPreview: React.FC<ReportPreviewProps> = ({
	data,
	selectedColumns,
	columnOptions,
	emptyColumnsMessage = 'Select at least one column to preview report details.',
}) => {
	const previewRows = data.slice(0, 10);

	if (selectedColumns.length === 0) {
		return (
			<MobilePreviewEmptyColumns>
				{emptyColumnsMessage}
			</MobilePreviewEmptyColumns>
		);
	}

	return (
		<>
			<PreviewTable>
				<Table>
					<thead>
						<tr>
							{selectedColumns.map((col) => (
								<th key={col}>{columnOptions[col]}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{previewRows.map((row, idx) => (
							<tr key={idx}>
								{selectedColumns.map((col) => (
									<td key={col}>{formatPreviewValue(row[col])}</td>
								))}
							</tr>
						))}
					</tbody>
				</Table>
			</PreviewTable>

			<MobilePreviewCards>
				{previewRows.map((row, idx) => {
					const primaryColumn = selectedColumns[0];
					const secondaryColumns = selectedColumns.slice(1);
					const primaryLabel = columnOptions[primaryColumn] || 'Record';
					const primaryValue = formatPreviewValue(row[primaryColumn]);

					return (
						<MobilePreviewCard key={idx}>
							<MobilePreviewCardHeader>
								<MobilePreviewCardKicker>
									Record {idx + 1} of {data.length}
								</MobilePreviewCardKicker>
								<MobilePreviewCardTitle>
									{primaryValue === '-' ? primaryLabel : primaryValue}
								</MobilePreviewCardTitle>
							</MobilePreviewCardHeader>

							<MobilePreviewFieldList>
								{secondaryColumns.map((col) => (
									<MobilePreviewField key={col}>
										<MobilePreviewLabel>
											{columnOptions[col] || col}
										</MobilePreviewLabel>
										<MobilePreviewValue>
											{formatPreviewValue(row[col])}
										</MobilePreviewValue>
									</MobilePreviewField>
								))}
							</MobilePreviewFieldList>
						</MobilePreviewCard>
					);
				})}
			</MobilePreviewCards>
		</>
	);
};
