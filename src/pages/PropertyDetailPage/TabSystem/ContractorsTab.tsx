import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faArrowUpAZ } from '@fortawesome/free-solid-svg-icons';
import {
	useGetContractorsByPropertyQuery,
	useDeleteContractorMutation,
} from '../../../Redux/API/contractorSlice';
import { Contractor } from '../../../types/Contractor.types';
import { ContractorForm } from './ContractorForm';
import {
	FilterBar,
	FilterConfig,
	FilterValues,
} from '../../../Components/Library/FilterBar';
import { applyFilters } from '../../../utils/tableFilters';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	Action,
	Column,
	ReusableTable,
} from '../../../Components/Library/ReusableTable';
import {
	CategoryBadge,
	EmptyState,
	LoadingSpinner,
	Toolbar,
	ToolbarButton,
	TabSummaryBar,
	TabSummaryPill,
	MobileContractorCard,
	MobileContractorHeader,
	MobileContractorTitle,
	MobileContractorMeta,
	MobileContractorRow,
	MobileContractorLabel,
	MobileContractorValue,
	MobileContractorActions,
	MobileActionButton,
	DesktopTableWrapper,
	GridContainer,
} from './index.styles';
import { WarningDialog } from '../../../Components/Library/WarningDialog';
import {
	ActiveFilterChips,
	ActiveFilterChip,
	ActiveFilterChipClear,
	CardMoreDetails,
	CardMoreSummary,
	CardMoreMenu,
	CardMoreMenuItem,
} from './mobileUiShared';
import { useAppFeedback } from '../../../Components/Library/AppFeedback/AppFeedbackProvider';

interface ContractorsTabProps {
	propertyId: string;
}

export const ContractorsTab: React.FC<ContractorsTabProps> = ({
	propertyId,
}) => {
	const feedback = useAppFeedback();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingContractor, setEditingContractor] = useState<Contractor | null>(
		null,
	);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [contractorToDelete, setContractorToDelete] =
		useState<Contractor | null>(null);
	const [filters, setFilters] = useState<FilterValues>({});
	const [showFilters, setShowFilters] = useState(false);
	const [sortBy, setSortBy] = useState<'company' | 'category'>('company');
	const { isMobile } = useSelector((state: any) => state.app);

	const {
		data: contractors = [],
		isLoading,
		error,
	} = useGetContractorsByPropertyQuery(propertyId, {
		skip: !propertyId,
	});

	const [deleteContractor] = useDeleteContractorMutation();

	// Filter configuration for contractors
	const contractorFilters: FilterConfig[] = [
		{
			key: 'category',
			label: 'Category',
			type: 'select',
			options: [
				{ value: 'Landscaper', label: 'Landscaper' },
				{ value: 'Contractor', label: 'Contractor' },
				{ value: 'Pest Control', label: 'Pest Control' },
				{ value: 'Plumber', label: 'Plumber' },
				{ value: 'Electrician', label: 'Electrician' },
				{ value: 'HVAC', label: 'HVAC' },
				{ value: 'Roofer', label: 'Roofer' },
				{ value: 'Painter', label: 'Painter' },
				{ value: 'Cleaning Service', label: 'Cleaning Service' },
			],
		},
	];

	// Apply filters to contractors
	const filteredContractors = useMemo(() => {
		const base = applyFilters(contractors, filters, {
			textFields: ['company', 'name', 'email', 'phone', 'address'],
			selectFields: [{ field: 'category', filterKey: 'category' }],
		});

		return [...base].sort((a, b) => {
			if (sortBy === 'category') {
				return (a.category || '').localeCompare(b.category || '');
			}
			return (a.company || a.name || '').localeCompare(b.company || b.name || '');
		});
	}, [contractors, filters, sortBy]);

	const handleDeleteClick = (contractor: Contractor) => {
		setContractorToDelete(contractor);
		setIsDeleteModalOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!contractorToDelete) {
			return;
		}
		try {
			await deleteContractor(contractorToDelete.id).unwrap();
			setIsDeleteModalOpen(false);
			setContractorToDelete(null);
		} catch (error) {
			console.error('Failed to delete contractor:', error);
			feedback.notify('Failed to delete contractor. Please try again.');
		}
	};

	const handleDeleteCancel = () => {
		setIsDeleteModalOpen(false);
		setContractorToDelete(null);
	};

	const handleEdit = (contractor: Contractor) => {
		setEditingContractor(contractor);
		setIsFormOpen(true);
	};

	const handleAddNew = () => {
		setEditingContractor(null);
		setIsFormOpen(true);
	};

	const handleFormClose = () => {
		setIsFormOpen(false);
		setEditingContractor(null);
	};

	const activeFilterChips = useMemo(() => {
		const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
		if (filters.search) {
			chips.push({
				key: 'search',
				label: `Search: ${filters.search}`,
				onRemove: () => setFilters((prev) => ({ ...prev, search: '' })),
			});
		}

		if (filters.category) {
			chips.push({
				key: 'category',
				label: `Category: ${filters.category}`,
				onRemove: () => setFilters((prev) => ({ ...prev, category: '' })),
			});
		}

		return chips;
	}, [filters]);

	// Table configuration for contractors
	const contractorColumns: Column[] = [
		{
			key: 'company',
			header: 'Company',
			render: (value: string) => <strong>{value}</strong>,
		},
		{
			key: 'name',
			header: 'Contact Name',
		},
		{
			key: 'phone',
			header: 'Phone',
			render: (value: string) => <a href={`tel:${value}`}>{value}</a>,
		},
		{
			key: 'category',
			header: 'Category',
			render: (value: string, contractor: any) => (
				<CategoryBadge category={contractor.category}>{value}</CategoryBadge>
			),
		},
		{
			key: 'address',
			header: 'Address',
			render: (value: string) => value || '—',
		},
	];

	const contractorActions: Action[] = [
		{
			label: 'Edit',
			icon: faEdit,
			onClick: (contractor: any) => handleEdit(contractor),
		},
		{
			label: 'Delete',
			icon: faTrash,
			onClick: (contractor: any) => handleDeleteClick(contractor),
			className: 'delete',
		},
	];

	if (!propertyId) {
		return (
			<EmptyState>
				<p>Property not loaded yet.</p>
				<p>Please try again in a moment.</p>
			</EmptyState>
		);
	}

	if (isLoading) {
		return <LoadingSpinner>Loading contractors...</LoadingSpinner>;
	}

	if (error) {
		return (
			<EmptyState>
				<p>Unable to load contractors.</p>
				<p>Please try again in a moment.</p>
			</EmptyState>
		);
	}

	return (
		<SectionContainer>
			<SectionHeader>Contractors & Vendors</SectionHeader>
			<TabSummaryBar>
				<TabSummaryPill>Total: {filteredContractors.length}</TabSummaryPill>
				<TabSummaryPill>
					Categories: {new Set(filteredContractors.map((c) => c.category)).size}
				</TabSummaryPill>
			</TabSummaryBar>
			<Toolbar>
				<ToolbarButton
					onClick={handleAddNew}
					style={{ width: isMobile ? '100%' : undefined }}>
					+ Add Contractor
				</ToolbarButton>
			</Toolbar>

			{/* Collapsable Filter Section */}
			<div style={{ marginBottom: '16px' }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						flexDirection: isMobile ? 'column' : 'row',
						marginBottom: showFilters ? '12px' : '0',
					}}>
					<input
						type='text'
						placeholder='Search contractors...'
						value={(filters.search as string) || ''}
						onChange={(e) =>
							setFilters((prev) => ({
								...prev,
								search: e.target.value,
							}))
						}
						style={{
							flex: 1,
							width: isMobile ? '100%' : undefined,
							padding: '8px 12px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							fontSize: '14px',
						}}
					/>
					<select
						value={sortBy}
						onChange={(event) => setSortBy(event.target.value as 'company' | 'category')}
						style={{
							padding: isMobile ? '10px 12px' : '8px 10px',
							width: isMobile ? '100%' : '170px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							background: '#ffffff',
							fontWeight: 600,
						}}>
						<option value='company'>Sort: Company</option>
						<option value='category'>Sort: Category</option>
					</select>
					<button
						onClick={() => setShowFilters(!showFilters)}
						style={{
							padding: isMobile ? '10px 12px' : '8px 10px',
							width: isMobile ? '100%' : undefined,
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							background: '#f9fafb',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 6,
							whiteSpace: 'nowrap',
						}}
						title={showFilters ? 'Hide filters' : 'Show filters'}>
						<FontAwesomeIcon icon={faArrowUpAZ} />
						{showFilters ? 'Hide Filters' : 'Filters'}
					</button>
				</div>
				{activeFilterChips.length > 0 && (
					<ActiveFilterChips>
						{activeFilterChips.map((chip) => (
							<ActiveFilterChip key={chip.key} onClick={chip.onRemove}>
								{chip.label} ×
							</ActiveFilterChip>
						))}
						<ActiveFilterChipClear onClick={() => setFilters({})}>
							Clear all
						</ActiveFilterChipClear>
					</ActiveFilterChips>
				)}
				{showFilters && (
					<FilterBar
						filters={contractorFilters}
						onFiltersChange={setFilters}
						hideOnMobile={true}
					/>
				)}
			</div>

			{isFormOpen && (
				<ContractorForm
					propertyId={propertyId}
					contractor={editingContractor}
					onClose={handleFormClose}
				/>
			)}
			{filteredContractors.length === 0 ? (
				<EmptyState>
					<p>No contractors found matching your filters.</p>
					<p>Try adjusting your search criteria.</p>
				</EmptyState>
			) : (
				<>
					{/* delete confirmation dialog */}
					<WarningDialog
						open={isDeleteModalOpen}
						title='Delete Contractor'
						message={`Are you sure you want to delete ${
							contractorToDelete?.company || contractorToDelete?.name
						}?`}
						confirmText='Delete'
						cancelText='Cancel'
						onConfirm={handleDeleteConfirm}
						onCancel={handleDeleteCancel}
					/>
					<DesktopTableWrapper>
						<GridContainer>
							<ReusableTable
								rowData={filteredContractors}
								columns={contractorColumns}
								actions={contractorActions}
								emptyMessage='No contractors found'
							/>
						</GridContainer>
					</DesktopTableWrapper>

					{/* Mobile Contractor Cards */}
					<div>
						{filteredContractors.map((contractor) => (
							<MobileContractorCard
								key={contractor.id}
								onClick={() => handleEdit(contractor)}>
								<MobileContractorHeader>
									<MobileContractorTitle>
										{contractor.company || contractor.name}
									</MobileContractorTitle>
								</MobileContractorHeader>

								<MobileContractorMeta>
									{contractor.company &&
										contractor.name !== contractor.company && (
											<MobileContractorRow>
												<MobileContractorLabel>Contact</MobileContractorLabel>
												<MobileContractorValue>
													{contractor.name}
												</MobileContractorValue>
											</MobileContractorRow>
										)}

									<MobileContractorRow>
										<MobileContractorLabel>Phone</MobileContractorLabel>
										<MobileContractorValue>
											<a
												href={`tel:${contractor.phone}`}
												style={{ color: 'inherit', textDecoration: 'none' }}>
												{contractor.phone}
											</a>
										</MobileContractorValue>
									</MobileContractorRow>

									{contractor.email && (
										<MobileContractorRow>
											<MobileContractorLabel>Email</MobileContractorLabel>
											<MobileContractorValue>
												{contractor.email}
											</MobileContractorValue>
										</MobileContractorRow>
									)}

									{contractor.category && (
										<MobileContractorRow>
											<MobileContractorLabel>Category</MobileContractorLabel>
											<MobileContractorValue>
												<CategoryBadge category={contractor.category}>
													{contractor.category}
												</CategoryBadge>
											</MobileContractorValue>
										</MobileContractorRow>
									)}
								</MobileContractorMeta>

								<MobileContractorActions>
									<MobileActionButton
										variant='danger'
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteClick(contractor);
										}}
										style={{ flex: 1 }}>
										Delete
									</MobileActionButton>
									<CardMoreDetails
										onClick={(e) => {
											e.stopPropagation();
										}}>
										<CardMoreSummary>More</CardMoreSummary>
										<CardMoreMenu>
											<CardMoreMenuItem
												onClick={(e) => {
													e.stopPropagation();
													handleEdit(contractor);
												}}>
												Edit
											</CardMoreMenuItem>
										</CardMoreMenu>
									</CardMoreDetails>
								</MobileContractorActions>
							</MobileContractorCard>
						))}
					</div>
				</>
			)}
		</SectionContainer>
	);
};
