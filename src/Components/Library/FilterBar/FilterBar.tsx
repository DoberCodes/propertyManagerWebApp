import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TaskSelect } from '../Select/TaskSelect';

export interface FilterConfig {
	key: string;
	label: string;
	type: 'text' | 'select' | 'date' | 'daterange' | 'multiselect';
	options?: { value: string; label: string }[];
	placeholder?: string;
}

export interface FilterValues {
	[key: string]: any;
}

interface FilterBarProps {
	filters: FilterConfig[];
	onFiltersChange: (filters: FilterValues) => void;
	className?: string;
	hideOnMobile?: boolean;
	useCustomSelect?: boolean;
}

const FilterContainer = styled.div<{ hideOnMobile?: boolean }>`
	background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
	border: 1px solid #e2e8f0;
	width: 100%;
	border-radius: 14px;
	padding: 1rem;
	margin-bottom: 1rem;
	gap: 1rem;
	align-items: center;
	box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);

	@media (max-width: 1024px) {
		padding: 0.75rem;
		gap: 0.75rem;
		display: ${(props) => (props.hideOnMobile ? 'none' : 'flex')};
	}
`;

const FilterGroup = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;

	@media (max-width: 1024px) {
		min-width: 100%;
	}

	label {
		font-size: 0.8rem;
		font-weight: 700;
		color: #64748b;
		letter-spacing: 0.02em;
		margin-bottom: 0.25rem;
	}
`;

const FilterInput = styled.input`
	padding: 0.5rem 0.75rem;
	border: 1px solid #dbe3ee;
	border-radius: 10px;
	font-size: 0.875rem;
	background-color: white;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

const FilterSelect = styled.select`
	padding: 0.5rem 0.75rem;
	border: 1px solid #dbe3ee;
	border-radius: 10px;
	font-size: 0.875rem;
	background-color: white;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const DateRangeContainer = styled.div`
	display: flex;
	gap: 0.5rem;
	align-items: center;

	@media (max-width: 480px) {
		flex-direction: column;
		gap: 0.25rem;
	}

	span {
		font-size: 0.875rem;
		color: #6b7280;
		white-space: nowrap;
	}
`;

const ClearButton = styled.button`
	background: #eef2f7;
	color: #334155;
	border: 1px solid #cbd5e1;
	padding: 0.5rem 1rem;
	border-radius: 10px;
	font-size: 0.875rem;
	font-weight: 700;
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		background-color: #e2e8f0;
	}

	@media (max-width: 1024px) {
		flex: 1;
		padding: 0.75rem;
	}
`;

export const FilterBar: React.FC<FilterBarProps> = ({
	filters,
	onFiltersChange,
	className,
	hideOnMobile = false,
	useCustomSelect = false,
}) => {
	const [filterValues, setFilterValues] = useState<FilterValues>({});

	useEffect(() => {
		onFiltersChange(filterValues);
	}, [filterValues, onFiltersChange]);

	const handleFilterChange = (key: string, value: any) => {
		setFilterValues((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const clearFilters = () => {
		setFilterValues({});
	};

	const hasActiveFilters = Object.values(filterValues).some((value) =>
		Array.isArray(value)
			? value.length > 0
			: value !== '' && value !== undefined && value !== null,
	);

	return (
		<FilterContainer className={className} hideOnMobile={hideOnMobile}>
			<div
				style={{
					display: 'flex',
					gap: '1rem',
					flexWrap: 'wrap',
					alignItems: 'center',
				}}>
				{filters.map((filter) => (
					<FilterGroup key={filter.key}>
						<label htmlFor={`filter-${filter.key}`}>{filter.label}</label>
						{filter.type === 'text' && (
							<FilterInput
								id={`filter-${filter.key}`}
								type='text'
								placeholder={
									filter.placeholder ||
									`Search ${filter.label.toLowerCase()}...`
								}
								value={filterValues[filter.key] || ''}
								onChange={(e) => handleFilterChange(filter.key, e.target.value)}
							/>
						)}
						{filter.type === 'select' && (
							<>
								{useCustomSelect ? (
									<TaskSelect
										id={`filter-${filter.key}`}
										name={filter.key}
										value={filterValues[filter.key] || ''}
										onChange={(value) => handleFilterChange(filter.key, value)}
										placeholder={`All ${filter.label.toLowerCase()}`}
										options={[
											{
												value: '',
												label: `All ${filter.label.toLowerCase()}`,
											},
											...(filter.options || []),
										]}
									/>
								) : (
									<FilterSelect
										id={`filter-${filter.key}`}
										value={filterValues[filter.key] || ''}
										onChange={(e) =>
											handleFilterChange(filter.key, e.target.value)
										}>
										<option value=''>All {filter.label.toLowerCase()}</option>
										{filter.options?.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</FilterSelect>
								)}
							</>
						)}
						{filter.type === 'date' && (
							<FilterInput
								id={`filter-${filter.key}`}
								type='date'
								value={filterValues[filter.key] || ''}
								onChange={(e) => handleFilterChange(filter.key, e.target.value)}
							/>
						)}
						{filter.type === 'daterange' && (
							<DateRangeContainer>
								<FilterInput
									type='date'
									placeholder='Start date'
									value={filterValues[`${filter.key}_start`] || ''}
									onChange={(e) =>
										handleFilterChange(`${filter.key}_start`, e.target.value)
									}
								/>
								<span>to</span>
								<FilterInput
									type='date'
									placeholder='End date'
									value={filterValues[`${filter.key}_end`] || ''}
									onChange={(e) =>
										handleFilterChange(`${filter.key}_end`, e.target.value)
									}
								/>
							</DateRangeContainer>
						)}
						{filter.type === 'multiselect' && (
							<FilterSelect
								id={`filter-${filter.key}`}
								multiple
								value={filterValues[filter.key] || []}
								onChange={(e) => {
									const selectedOptions = Array.from(
										e.target.selectedOptions,
										(option) => option.value,
									);
									handleFilterChange(filter.key, selectedOptions);
								}}>
								{filter.options?.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</FilterSelect>
						)}
					</FilterGroup>
				))}
			</div>
			<div
				style={{
					display: 'block',
					gap: '0.5rem',
					alignItems: 'flex-end',
					marginTop: '0.5rem',
				}}>
				{hasActiveFilters && (
					<ClearButton onClick={clearFilters}>Clear Filters</ClearButton>
				)}
			</div>
		</FilterContainer>
	);
};
