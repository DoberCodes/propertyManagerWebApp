import React, { useState } from 'react';
import styled from 'styled-components';
import {
	FloatingFilterPanel,
} from '../../../Components/Library';
import {
	FilterConfig,
	FilterValues,
} from '../../../Components/Library/FilterBar';
import { COLORS } from '../../../constants/colors';

const Fields = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(220px, 1fr));
	gap: 12px;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`;

const Field = styled.label`
	display: flex;
	flex-direction: column;
	gap: 6px;
	color: #475569;
	font-size: 12px;
	font-weight: 800;
`;

const Input = styled.input`
	width: 100%;
	min-height: 42px;
	padding: 8px 12px;
	border: 1px solid #cbd5e1;
	border-radius: 10px;
	background: #ffffff;
	color: #0f172a;
	font: inherit;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
	}
`;

const Select = styled.select`
	width: 100%;
	min-height: 42px;
	padding: 8px 12px;
	border: 1px solid #cbd5e1;
	border-radius: 10px;
	background: #ffffff;
	color: #0f172a;
	font: inherit;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
	}
`;

const DateRange = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
`;

interface SortOption {
	value: string;
	label: string;
}

interface PropertyTabFilterPanelProps {
	propertyName: string;
	resourceName: string;
	searchPlaceholder: string;
	filters: FilterValues;
	onFiltersChange: (filters: FilterValues) => void;
	filterConfigs?: FilterConfig[];
	sortValue?: string;
	defaultSortValue?: string;
	sortOptions?: SortOption[];
	onSortChange?: (value: string) => void;
	additionalActiveFilterCount?: number;
}

const hasValue = (value: unknown) =>
	Array.isArray(value)
		? value.length > 0
		: value !== '' && value !== undefined && value !== null;

export const PropertyTabFilterPanel: React.FC<
	PropertyTabFilterPanelProps
> = ({
	propertyName,
	resourceName,
	searchPlaceholder,
	filters,
	onFiltersChange,
	filterConfigs = [],
	sortValue,
	defaultSortValue,
	sortOptions = [],
	onSortChange,
	additionalActiveFilterCount = 0,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [draftFilters, setDraftFilters] = useState<FilterValues>({});
	const [draftSortValue, setDraftSortValue] = useState(
		sortValue || defaultSortValue || '',
	);

	const openPanel = () => {
		setDraftFilters({ ...filters });
		setDraftSortValue(sortValue || defaultSortValue || '');
		setIsOpen(true);
	};

	const dismissPanel = () => {
		setDraftFilters({ ...filters });
		setDraftSortValue(sortValue || defaultSortValue || '');
		setIsOpen(false);
	};

	const clearDraft = () => {
		setDraftFilters({});
		setDraftSortValue(defaultSortValue || '');
	};

	const applyDraft = () => {
		onFiltersChange(draftFilters);
		if (onSortChange && draftSortValue) {
			onSortChange(draftSortValue);
		}
		setIsOpen(false);
	};

	const activeFilterCount =
		Object.values(filters).filter(hasValue).length +
		(sortValue && defaultSortValue && sortValue !== defaultSortValue ? 1 : 0) +
		additionalActiveFilterCount;

	const updateDraft = (key: string, value: unknown) => {
		setDraftFilters((current) => ({ ...current, [key]: value }));
	};

	return (
		<FloatingFilterPanel
			isOpen={isOpen}
			onOpen={openPanel}
			onDismiss={dismissPanel}
			onApply={applyDraft}
			onClearDraft={clearDraft}
			activeFilterCount={activeFilterCount}
			title={`Search and filter ${resourceName}`}
			description={`Showing ${resourceName} for ${propertyName}. Choose your filters, then apply your changes.`}>
			<Fields>
				<Field>
					Search
					<Input
						type='search'
						placeholder={searchPlaceholder}
						value={(draftFilters.search as string) || ''}
						onChange={(event) => updateDraft('search', event.target.value)}
					/>
				</Field>
				{sortOptions.length > 0 && (
					<Field>
						Sort
						<Select
							value={draftSortValue}
							onChange={(event) => setDraftSortValue(event.target.value)}>
							{sortOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</Field>
				)}
				{filterConfigs.map((filter) => (
					<Field key={filter.key}>
						{filter.label}
						{filter.type === 'select' && (
							<Select
								value={(draftFilters[filter.key] as string) || ''}
								onChange={(event) =>
									updateDraft(filter.key, event.target.value)
								}>
								<option value=''>All {filter.label.toLowerCase()}</option>
								{filter.options?.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						)}
						{filter.type === 'text' && (
							<Input
								type='text'
								placeholder={filter.placeholder}
								value={(draftFilters[filter.key] as string) || ''}
								onChange={(event) =>
									updateDraft(filter.key, event.target.value)
								}
							/>
						)}
						{filter.type === 'date' && (
							<Input
								type='date'
								value={(draftFilters[filter.key] as string) || ''}
								onChange={(event) =>
									updateDraft(filter.key, event.target.value)
								}
							/>
						)}
						{filter.type === 'daterange' && (
							<DateRange>
								<Input
									type='date'
									aria-label={`${filter.label} start`}
									value={
										(draftFilters[`${filter.key}_start`] as string) || ''
									}
									onChange={(event) =>
										updateDraft(
											`${filter.key}_start`,
											event.target.value,
										)
									}
								/>
								<Input
									type='date'
									aria-label={`${filter.label} end`}
									value={
										(draftFilters[`${filter.key}_end`] as string) || ''
									}
									onChange={(event) =>
										updateDraft(`${filter.key}_end`, event.target.value)
									}
								/>
							</DateRange>
						)}
					</Field>
				))}
			</Fields>
		</FloatingFilterPanel>
	);
};
