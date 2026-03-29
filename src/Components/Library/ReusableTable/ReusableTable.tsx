import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
	TableContainer,
	StyledTable,
	ActionButton,
	EmptyState,
} from './ReusableTable.styles';

export interface Column<T = any> {
	header: string;
	key: keyof T | string;
	type?: 'text' | 'dropdown' | 'date';
	options?: string[] | ((row: T) => string[]);
	render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface Action<T = any> {
	label: string;
	icon: IconDefinition;
	onClick: (row: T, index: number) => void;
	className?: string;
	disabled?: (row: T) => boolean;
}

export interface ReusableTableProps<T = any> {
	columns: Column<T>[];
	rowData: T[];
	onRowSelect?: (selectedRowIds: Set<string>) => void;
	onRowEdit?: (rowIndex: number, updatedRow: T) => void;
	handleRowDoubleClick?: boolean;
	onRowDoubleClick?: (rowId: string) => void;
	selectedRows?: Set<string>;
	onSelectAll?: (checked: boolean, selectedRowIds: string[]) => void;
	onRowUpdate?: (updatedRow: T) => void;
	showCheckbox?: boolean;
	actions?: Action<T>[];
	isEditable?: boolean;
	showActionsColumn?: boolean;
	emptyMessage?: string;
}

// Helper to get nested value
const getNestedValue = (obj: any, path: string) => {
	return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const ReusableTable = <T extends { id: string }>({
	columns,
	rowData,
	onRowSelect,
	onRowEdit,
	onRowDoubleClick,
	selectedRows = new Set(),
	onSelectAll,
	onRowUpdate,
	showCheckbox = true,
	handleRowDoubleClick = false,
	actions = [],
	showActionsColumn = true,
	emptyMessage = 'No data available',
	isEditable = false,
}: ReusableTableProps<T>) => {
	const handleRowSelect = (rowId: string) => {
		const updatedSelection = new Set(selectedRows);
		if (updatedSelection.has(rowId)) {
			updatedSelection.delete(rowId);
		} else {
			updatedSelection.add(rowId);
		}
		onRowSelect?.(updatedSelection);
	};

	const handleRowEdit = (index: number, updatedRow: any) => {
		const updatedRowData = [...rowData];
		updatedRowData[index] = updatedRow;
		onRowEdit?.(index, updatedRow);
		onRowUpdate?.(updatedRow);
	};

	return (
		<TableContainer>
			{rowData.length === 0 ? (
				<EmptyState>
					<p>{emptyMessage}</p>
				</EmptyState>
			) : (
				<StyledTable>
					<thead>
						<tr>
							{showCheckbox && (
								<th>
									<input
										type='checkbox'
										onChange={(e) => {
											const allSelected = e.target.checked;
											const updatedSelection = allSelected
												? rowData.map((row) => row.id)
												: [];
											onSelectAll?.(allSelected, updatedSelection);
										}}
										checked={
											selectedRows.size === rowData.length && rowData.length > 0
										}
									/>
								</th>
							)}
							{columns.map((col, index) => (
								<th key={index}>{col.header}</th>
							))}
							{showActionsColumn && actions.length > 0 && <th>Actions</th>}
						</tr>
					</thead>
					<tbody>
						{rowData.map((row, index) => (
							<tr
								key={index}
								className={(row as any).status === 'Overdue' ? 'overdue-row' : undefined}
								onDoubleClick={() =>
									handleRowDoubleClick && onRowDoubleClick?.(row.id)
								}>
								{showCheckbox && (
									<td>
										<input
											type='checkbox'
											checked={selectedRows.has(row.id)}
											onChange={() => handleRowSelect(row.id)}
										/>
									</td>
								)}
								{columns.map((col, colIndex) => {
									const columnOptions = col.options
										? typeof col.options === 'function'
											? col.options(row)
											: col.options
										: [];

									const value = getNestedValue(row, col.key as string);

									return (
										<td key={colIndex}>
											{col.render ? (
												col.render(value, row, index)
											) : col.type === 'dropdown' &&
											  columnOptions.length > 0 ? (
												<select
													value={value || ''}
													onChange={(e) =>
														handleRowEdit(index, {
															...row,
															[col.key]: e.target.value,
														})
													}>
													<option value=''>-- Select --</option>
													{columnOptions.map((option, optIndex) => (
														<option key={optIndex} value={option}>
															{option}
														</option>
													))}
												</select>
											) : isEditable ? (
												<div
													contentEditable
													suppressContentEditableWarning
													onBlur={(e) =>
														handleRowEdit(index, {
															...row,
															[col.key]: e.currentTarget.textContent,
														})
													}>
													{typeof value === 'object' && value !== null
														? JSON.stringify(value)
														: value}
												</div>
											) : (
												<span>
													{typeof value === 'object' && value !== null
														? JSON.stringify(value)
														: value}
												</span>
											)}
										</td>
									);
								})}
								{showActionsColumn && actions.length > 0 && (
									<td>
										<div style={{ display: 'flex', gap: '8px' }}>
											{actions.map((action, actionIndex) => {
												const isDisabled = action.disabled?.(row) || false;
												return (
													<ActionButton
														key={actionIndex}
														onClick={() => action.onClick(row, index)}
														className={action.className}
														disabled={isDisabled}
														title={action.label}>
														<FontAwesomeIcon icon={action.icon} />
													</ActionButton>
												);
											})}
										</div>
									</td>
								)}
							</tr>
						))}
					</tbody>
				</StyledTable>
			)}
		</TableContainer>
	);
};
