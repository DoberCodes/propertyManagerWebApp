import React from 'react';
import styled from 'styled-components';

const TableContainer = styled.div`
	overflow-x: auto;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	background-color: #fff;
`;

const StyledTable = styled.table`
	width: 100%;
	border-collapse: collapse;

	thead {
		background-color: #f3f4f6;
	}

	th,
	td {
		padding: 12px;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		text-align: left;
	}

	tbody tr:hover {
		background-color: #f9fafb;
	}

	select {
		width: auto;
		max-width: 100%;
		padding: 6px 8px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 14px;
		background-color: #fff;
		cursor: pointer;

		&:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}
	}
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 40px 20px;
	color: #6b7280;

	p {
		margin: 0;
		font-size: 14px;
	}
`;

interface Column {
	header: string;
	accessor: string;
	type?: 'text' | 'dropdown' | 'date';
	options?: string[] | ((row: any) => string[]);
}

interface ReusableTableProps {
	columns: Column[];
	rowData: any[];
	onRowSelect?: (selectedRowIds: Set<string>) => void;
	onRowEdit?: (rowIndex: number, updatedRow: any) => void;
	onRowDoubleClick?: (rowId: string) => void;
	selectedRows?: Set<string>;
	onSelectAll?: (checked: boolean, selectedRowIds: string[]) => void;
	onRowUpdate?: (updatedRow: any) => void;
	showCheckbox?: boolean;
}

export const ReusableTable: React.FC<ReusableTableProps> = ({
	columns,
	rowData,
	onRowSelect,
	onRowEdit,
	onRowDoubleClick,
	selectedRows = new Set(),
	onSelectAll,
	onRowUpdate,
	showCheckbox = true,
}) => {
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
					<p>No data available</p>
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
						</tr>
					</thead>
					<tbody>
						{rowData.map((row, index) => (
							<tr key={index} onDoubleClick={() => onRowDoubleClick?.(row.id)}>
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

									return (
										<td key={colIndex}>
											{col.type === 'dropdown' && columnOptions.length > 0 ? (
												<select
													value={row[col.accessor] || ''}
													onChange={(e) =>
														handleRowEdit(index, {
															...row,
															[col.accessor]: e.target.value,
														})
													}>
													<option value=''>-- Select --</option>
													{columnOptions.map((option, optIndex) => (
														<option key={optIndex} value={option}>
															{option}
														</option>
													))}
												</select>
											) : (
												<div
													contentEditable
													suppressContentEditableWarning
													onBlur={(e) =>
														handleRowEdit(index, {
															...row,
															[col.accessor]: e.currentTarget.textContent,
														})
													}>
													{row[col.accessor]}
												</div>
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</StyledTable>
			)}
		</TableContainer>
	);
};
