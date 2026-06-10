import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faEdit,
	faTrash,
	faArrowUpAZ,
	faWrench,
	faFan,
	faBolt,
	faTree,
	faDroplet,
	faClockRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
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
	SectionLead,
	MobileContractorCard,
	MobileContractorHeader,
	MobileContractorTitle,
	MobileContractorMeta,
	MobileContractorActions,
	MobileActionButton,
	MobileActionLinkRow,
	MobileActionLinkButton,
	MobileFeedLine,
	MobileFeedLineMuted,
	DesktopTableWrapper,
} from './index.styles';
import { WarningDialog } from '../../../Components/Library/WarningDialog';
import {
	ActiveFilterChips,
	ActiveFilterChip,
	ActiveFilterChipClear,
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

	const getContractorIcon = (contractor: any) => {
		const category = String(contractor.category || '').toLowerCase();
		if (category.includes('hvac')) {
			return { icon: faFan, color: '#0f766e', background: '#ecfeff' };
		}
		if (category.includes('elect')) {
			return { icon: faBolt, color: '#7c3aed', background: '#f3e8ff' };
		}
		if (category.includes('land')) {
			return { icon: faTree, color: '#166534', background: '#dcfce7' };
		}
		if (category.includes('plumb')) {
			return { icon: faDroplet, color: '#0369a1', background: '#e0f2fe' };
		}
		return { icon: faWrench, color: '#475569', background: '#f1f5f9' };
	};

	// Table configuration for contractors
	const contractorColumns: Column[] = [
		{
			key: 'company',
			header: 'Service Partner',
			render: (value: string, contractor: any) => {
				const iconStyle = getContractorIcon(contractor);
				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<span
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: 24,
									height: 24,
									borderRadius: 8,
									color: iconStyle.color,
									background: iconStyle.background,
								}}>
								<FontAwesomeIcon icon={iconStyle.icon} />
							</span>
							<strong>{value || contractor.name}</strong>
						</div>
						<div style={{ fontSize: 12, color: '#64748b' }}>
							{contractor.category || 'General'} maintenance support
						</div>
					</div>
				);
			},
		},
		{
			key: 'name',
			header: 'Maintenance Lead',
			render: (value: string) => value || 'No primary contact',
		},
		{
			key: 'category',
			header: 'Maintenance Role',
			render: (value: string, contractor: any) => (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
					<CategoryBadge category={contractor.category}>{value}</CategoryBadge>
					<div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
						<FontAwesomeIcon icon={faClockRotateLeft} />
						Service contact: {contractor.phone || 'No phone yet'}
					</div>
				</div>
			),
		},
		{
			key: 'phone',
			header: 'Contact',
			render: (value: string, contractor: any) => (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
					{value ? <a href={`tel:${value}`}>{value}</a> : <span style={{ color: '#94a3b8' }}>No phone</span>}
					<span style={{ color: '#64748b' }}>{contractor.email || 'No email on file'}</span>
				</div>
			),
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
			<SectionLead>
				Keep service partners, contact details, and coverage ready when issues arise.
			</SectionLead>
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

			<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
						flexDirection: isMobile ? 'column' : 'row',
						marginBottom: showFilters ? '12px' : '0',
						flexWrap: 'wrap',
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
							minWidth: isMobile ? '100%' : '240px',
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
							minWidth: isMobile ? '100%' : '120px',
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
					<h3>{contractors.length === 0 ? 'No contractors yet' : 'No contractors match your filters'}</h3>
					<p>
						{contractors.length === 0
							? 'Add a trusted service partner when you want contractor details close to the maintenance record.'
							: 'Try clearing filters, or add a contractor if this is a new service relationship.'}
					</p>
					<ToolbarButton type='button' onClick={handleAddNew}>
						Add Contractor
					</ToolbarButton>
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
						<ReusableTable
							rowData={filteredContractors}
							columns={contractorColumns}
							getRowClassName={(row: any) =>
								!row.phone && !row.email ? 'attention-row' : undefined
							}
							actions={contractorActions}
							showCheckbox={false}
							hideHeader={true}
							emptyMessage='No service partners found. Add one to strengthen maintenance coverage.'
						/>
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
									{contractor.company && contractor.name !== contractor.company && (
										<MobileFeedLine>Primary contact: {contractor.name}</MobileFeedLine>
									)}
									<MobileFeedLine>
										{contractor.phone}
										{contractor.email ? ` • ${contractor.email}` : ''}
									</MobileFeedLine>
									{contractor.category && (
										<MobileFeedLineMuted>
											Service category: {contractor.category}
										</MobileFeedLineMuted>
									)}
								</MobileContractorMeta>

								<MobileContractorActions>
									<MobileActionButton
										variant='primary'
										onClick={(e) => {
											e.stopPropagation();
											handleEdit(contractor);
										}}
										style={{ flex: 1 }}>
										Edit profile
									</MobileActionButton>
									<MobileActionLinkRow>
										<MobileActionLinkButton
											onClick={(e) => {
												e.stopPropagation();
												window.location.href = `tel:${contractor.phone}`;
											}}>
											Call
										</MobileActionLinkButton>
										<MobileActionLinkButton
											$danger
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteClick(contractor);
										}}>
											Delete
										</MobileActionLinkButton>
									</MobileActionLinkRow>
								</MobileContractorActions>
							</MobileContractorCard>
						))}
					</div>
				</>
			)}
		</SectionContainer>
	);
};
