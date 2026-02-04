import React, { useState } from 'react';
import {
	useGetContractorsByPropertyQuery,
	useDeleteContractorMutation,
} from '../../../Redux/API/apiSlice';
import {
	Contractor,
	ContractorCategory,
} from '../../../types/Contractor.types';
import { ContractorForm } from './ContractorForm';
import { DeleteConfirmationModal } from '../../../Components/Library/Modal/DeleteConfirmationModal';
import styled from 'styled-components';

interface ContractorsTabProps {
	propertyId: string;
}

const ContainerStyled = styled.div`
	padding: 1.5rem;
`;

const HeaderContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;

	h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #333;
	}
`;

const AddButton = styled.button`
	background-color: #27ae60;
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 4px;
	cursor: pointer;
	font-weight: 500;
	font-size: 1rem;

	&:hover {
		background-color: #229954;
	}
`;

const TableContainer = styled.div`
	overflow-x: auto;
	border: 1px solid #ddd;
	border-radius: 4px;
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;

	thead {
		background-color: #f5f5f5;
		font-weight: 600;
	}

	th,
	td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #ddd;

		&:last-child {
			text-align: center;
		}
	}

	tbody tr:hover {
		background-color: #f9f9f9;
	}
`;

const CategoryBadge = styled.span<{ category: ContractorCategory }>`
	display: inline-block;
	padding: 0.25rem 0.75rem;
	border-radius: 12px;
	font-size: 0.85rem;
	font-weight: 500;
	background-color: ${(props) => {
		const colors: Record<ContractorCategory, string> = {
			Landscaper: '#E8F5E9',
			Contractor: '#E3F2FD',
			'Pest Control': '#FFF3E0',
			Plumber: '#FCE4EC',
			Electrician: '#F3E5F5',
			HVAC: '#E0F2F1',
			Roofer: '#EFEBE9',
			Painter: '#FBE9E7',
			'Cleaning Service': '#F1F8E9',
			Handyman: '#E8EAF6',
			Other: '#EEEEEE',
		};
		return colors[props.category] || '#EEEEEE';
	}};
	color: ${(props) => {
		const colors: Record<ContractorCategory, string> = {
			Landscaper: '#1B5E20',
			Contractor: '#0D47A1',
			'Pest Control': '#E65100',
			Plumber: '#880E4F',
			Electrician: '#4A148C',
			HVAC: '#004D40',
			Roofer: '#3E2723',
			Painter: '#BF360C',
			'Cleaning Service': '#33691E',
			Handyman: '#311B92',
			Other: '#424242',
		};
		return colors[props.category] || '#424242';
	}};
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
	justify-content: center;

	button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;

		&.edit {
			background-color: #3498db;
			color: white;

			&:hover {
				background-color: #2980b9;
			}
		}

		&.delete {
			background-color: #e74c3c;
			color: white;

			&:hover {
				background-color: #c0392b;
			}
		}
	}
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 2rem;
	color: #666;

	p {
		margin: 0 0 1rem 0;
		font-size: 1rem;
	}
`;

const LoadingSpinner = styled.div`
	text-align: center;
	padding: 2rem;
	color: #666;
`;

export const ContractorsTab: React.FC<ContractorsTabProps> = ({
	propertyId,
}) => {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingContractor, setEditingContractor] = useState<Contractor | null>(
		null,
	);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [contractorToDelete, setContractorToDelete] =
		useState<Contractor | null>(null);

	const {
		data: contractors = [],
		isLoading,
		error,
	} = useGetContractorsByPropertyQuery(propertyId, {
		skip: !propertyId,
	});
	const [deleteContractor, { isLoading: isDeleting }] =
		useDeleteContractorMutation();

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
		<ContainerStyled>
			<DeleteConfirmationModal
				isOpen={isDeleteModalOpen}
				itemName={
					contractorToDelete
						? `${contractorToDelete.company} - ${contractorToDelete.name}`
						: 'this contractor'
				}
				itemType='contractor'
				onConfirm={handleDeleteConfirm}
				onCancel={handleDeleteCancel}
				isLoading={isDeleting}
			/>
			<HeaderContainer>
				<h2>Contractors & Vendors</h2>
				<AddButton onClick={handleAddNew}>+ Add Contractor</AddButton>
			</HeaderContainer>

			{isFormOpen && (
				<ContractorForm
					propertyId={propertyId}
					contractor={editingContractor}
					onClose={handleFormClose}
				/>
			)}

			{contractors.length === 0 ? (
				<EmptyState>
					<p>No contractors added yet.</p>
					<p>Click "Add Contractor" to get started.</p>
				</EmptyState>
			) : (
				<TableContainer>
					<Table>
						<thead>
							<tr>
								<th>Company</th>
								<th>Contact Name</th>
								<th>Phone</th>
								<th>Category</th>
								<th>Address</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{contractors.map((contractor: Contractor) => (
								<tr key={contractor.id}>
									<td>
										<strong>{contractor.company}</strong>
									</td>
									<td>{contractor.name}</td>
									<td>
										<a href={`tel:${contractor.phone}`}>{contractor.phone}</a>
									</td>
									<td>
										<CategoryBadge category={contractor.category}>
											{contractor.category}
										</CategoryBadge>
									</td>
									<td>{contractor.address || '—'}</td>
									<td>
										<ActionButtons>
											<button
												className='edit'
												onClick={() => handleEdit(contractor)}>
												Edit
											</button>
											<button
												className='delete'
												onClick={() => handleDeleteClick(contractor)}>
												Delete
											</button>
										</ActionButtons>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</TableContainer>
			)}
		</ContainerStyled>
	);
};
