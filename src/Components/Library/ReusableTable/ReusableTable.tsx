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
	sortable?: boolean;
	type?: 'text' | 'dropdown' | 'date';
	options?: string[] | ((row: T) => string[]);
	render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface SortState {
	key: string;
	direction: 'asc' | 'desc';
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
	getRowClassName?: (row: T, index: number) => string | undefined;
	sortState?: SortState | null;
	onSort?: (key: string) => void;
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
	emptyTitle?: string;
	emptyMessage?: string;
	emptyActionLabel?: string;
	onEmptyAction?: () => void;
}

// Helper to get nested value
const getNestedValue = (obj: any, path: string) => {
	return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const ReusableTable = <T extends { id: string }>({
	columns,
	rowData,
	getRowClassName,
	sortState,
	onSort,
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
	emptyTitle = 'Nothing here yet',
	emptyMessage = 'No data available',
	emptyActionLabel,
	onEmptyAction,
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
					<h3>{emptyTitle}</h3>
					<p>{emptyMessage}</p>
					{emptyActionLabel && onEmptyAction && (
						<button type='button' onClick={onEmptyAction}>
							{emptyActionLabel}
						</button>
					)}
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
							{columns.map((col, index) => {
								const isActiveSort = sortState?.key === String(col.key);
								const directionSymbol = isActiveSort
									? sortState?.direction === 'asc'
										? '↑'
										: '↓'
									: '';

								return (
									<th key={index}>
										{col.sortable && onSort ? (
											<button
												type='button'
												onClick={() => onSort(String(col.key))}
												style={{
													border: 'none',
													background: 'transparent',
													padding: 0,
													cursor: 'pointer',
													fontWeight: 700,
													display: 'inline-flex',
													alignItems: 'center',
													gap: '4px',
												}}
												aria-label={`Sort by ${col.header}`}>
												<span>{col.header}</span>
												<span style={{ opacity: isActiveSort ? 1 : 0.35 }}>
													{directionSymbol || '↕'}
												</span>
											</button>
										) : (
											col.header
										)}
									</th>
								);
							})}
							{showActionsColumn && actions.length > 0 && <th>Actions</th>}
						</tr>
					</thead>
					<tbody>
						{rowData.map((row, index) => (
							/* Merge default and page-specific row classes with de-duplication. */
							<tr
								key={index}
								className={
									Array.from(
										new Set(
											[
												(row as any).status === 'Overdue' ? 'overdue-row' : '',
												getRowClassName?.(row, index) || '',
											].filter(Boolean),
										),
									).join(' ') || undefined
								}
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
														type='button'
														onClick={() => action.onClick(row, index)}
														className={action.className}
														disabled={isDisabled}
														aria-label={action.label}
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
