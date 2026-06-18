/**
 * AdminFilterControls Component
 * Filter controls for tickets by status and type
 */

import React from 'react';
import { FilterRow, Label, Select } from '../AdminInboxPage.styles';
import { TYPE_OPTIONS } from '../constants';
import type { TypeOption } from '../constants';

interface AdminFilterControlsProps {
	statusFilter: string;
	typeFilter: TypeOption;
	isLoading?: boolean;
	onStatusChange: (value: string) => void;
	onTypeChange: (value: TypeOption) => void;
}

export const AdminFilterControls: React.FC<AdminFilterControlsProps> = ({
	statusFilter,
	typeFilter,
	isLoading,
	onStatusChange,
	onTypeChange,
}) => {
	

	return (
		<FilterRow>
			<div>
				<Label htmlFor='status-filter' style={{ marginRight: '8px' }}>Status</Label>
				<Select
					id='status-filter'
					value={statusFilter}
					onChange={(e) => onStatusChange(e.target.value)}
					disabled={isLoading}>
					<option value=''>All Open</option>
					<option value='closed_group'>All Closed</option>
				</Select>
			</div>
			<div>
				<Label htmlFor='type-filter' style={{ marginRight: '8px' }}>Type</Label>
				<Select
					id='type-filter'
					value={typeFilter}
					onChange={(e) => onTypeChange(e.target.value as TypeOption)}
					disabled={isLoading}>
					{TYPE_OPTIONS.map((type) => (
						<option key={type} value={type}>
							{type}
						</option>
					))}
				</Select>
			</div>
			{/* <div style={{ alignSelf: 'end' }}>
				<Button type='button' onClick={handleApplyClick} disabled={isLoading}>
					Apply Filters
				</Button>
			</div> */}
		</FilterRow>
	);
};
