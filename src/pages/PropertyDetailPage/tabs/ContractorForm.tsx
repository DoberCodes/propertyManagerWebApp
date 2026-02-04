import React, { useState, useEffect } from 'react';
import {
	useCreateContractorMutation,
	useUpdateContractorMutation,
} from '../../../Redux/API/apiSlice';
import {
	Contractor,
	ContractorCategory,
} from '../../../types/Contractor.types';
import styled from 'styled-components';

interface ContractorFormProps {
	propertyId: string;
	contractor?: Contractor | null;
	onClose: () => void;
}

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;

	@media (max-width: 480px) {
		padding: 0.5rem;
		align-items: flex-start;
		padding-top: 2rem;
	}
`;

const FormContainer = styled.div`
	background: white;
	border-radius: 8px;
	padding: 2rem;
	max-width: 500px;
	width: 90%;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	max-height: 90vh;
	overflow-y: auto;

	@media (max-width: 768px) {
		max-width: 90%;
		padding: 1.5rem;
	}

	@media (max-width: 480px) {
		max-width: 95%;
		padding: 1rem;
		border-radius: 6px;
		margin-top: 1rem;
		max-height: 85vh;
	}
`;

const Title = styled.h2`
	margin: 0 0 1.5rem 0;
	font-size: 1.5rem;
	color: #333;

	@media (max-width: 480px) {
		font-size: 1.25rem;
		margin-bottom: 1rem;
	}
`;

const FormGroup = styled.div`
	margin-bottom: 1.25rem;
	display: flex;
	flex-direction: column;
`;

const Label = styled.label`
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: #333;
	font-size: 0.95rem;

	span {
		color: #e74c3c;
	}
`;

const Input = styled.input`
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 1rem;
	font-family: inherit;

	&:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
	}
`;

const Select = styled.select`
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 1rem;
	font-family: inherit;
	background-color: white;

	&:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
	}
`;

const Textarea = styled.textarea`
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 1rem;
	font-family: inherit;
	resize: vertical;
	min-height: 80px;

	&:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 1rem;
	justify-content: flex-end;
	margin-top: 2rem;

	@media (max-width: 480px) {
		flex-direction: column-reverse;
		gap: 0.5rem;
	}
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 4px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	background-color: ${(props) =>
		props.variant === 'secondary' ? '#95a5a6' : '#27ae60'};
	color: white;

	&:hover {
		background-color: ${(props) =>
			props.variant === 'secondary' ? '#7f8c8d' : '#229954'};
	}

	&:disabled {
		background-color: #bdc3c7;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		width: 100%;
	}
`;

const ErrorMessage = styled.div`
	background-color: #f8d7da;
	color: #721c24;
	padding: 0.75rem;
	border-radius: 4px;
	margin-bottom: 1rem;
	font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
	background-color: #d4edda;
	color: #155724;
	padding: 0.75rem;
	border-radius: 4px;
	margin-bottom: 1rem;
	font-size: 0.9rem;
`;

const CONTRACTOR_CATEGORIES: ContractorCategory[] = [
	'Landscaper',
	'Contractor',
	'Pest Control',
	'Plumber',
	'Electrician',
	'HVAC',
	'Roofer',
	'Painter',
	'Cleaning Service',
	'Handyman',
	'Other',
];

export const ContractorForm: React.FC<ContractorFormProps> = ({
	propertyId,
	contractor,
	onClose,
}) => {
	const [formData, setFormData] = useState({
		name: '',
		company: '',
		category: 'Contractor' as ContractorCategory,
		phone: '',
		address: '',
		email: '',
		notes: '',
	});

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [message, setMessage] = useState<{
		type: 'success' | 'error';
		text: string;
	} | null>(null);

	const [createContractor, { isLoading: isCreating }] =
		useCreateContractorMutation();
	const [updateContractor, { isLoading: isUpdating }] =
		useUpdateContractorMutation();

	const isLoading = isCreating || isUpdating;

	useEffect(() => {
		if (contractor) {
			setFormData({
				name: contractor.name,
				company: contractor.company,
				category: contractor.category,
				phone: contractor.phone,
				address: contractor.address || '',
				email: contractor.email || '',
				notes: contractor.notes || '',
			});
		}
	}, [contractor]);

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) newErrors.name = 'Contact name is required';
		if (!formData.company.trim())
			newErrors.company = 'Company name is required';
		if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
		if (!formData.category) newErrors.category = 'Category is required';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		try {
			if (contractor) {
				// Update existing
				await updateContractor({
					contractorId: contractor.id,
					...formData,
				}).unwrap();
				setMessage({
					type: 'success',
					text: 'Contractor updated successfully!',
				});
			} else {
				// Create new
				await createContractor({
					propertyId,
					...formData,
				}).unwrap();
				setMessage({ type: 'success', text: 'Contractor added successfully!' });
			}

			setTimeout(() => {
				onClose();
			}, 1000);
		} catch (error: any) {
			setMessage({
				type: 'error',
				text: error.message || 'An error occurred. Please try again.',
			});
		}
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// Clear error for this field
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: '',
			}));
		}
	};

	return (
		<Overlay onClick={onClose}>
			<FormContainer onClick={(e) => e.stopPropagation()}>
				<Title>{contractor ? 'Edit Contractor' : 'Add New Contractor'}</Title>

				{message && (
					<>
						{message.type === 'success' ? (
							<SuccessMessage>{message.text}</SuccessMessage>
						) : (
							<ErrorMessage>{message.text}</ErrorMessage>
						)}
					</>
				)}

				<form onSubmit={handleSubmit}>
					<FormGroup>
						<Label htmlFor='company'>
							Company Name <span>*</span>
						</Label>
						<Input
							type='text'
							id='company'
							name='company'
							value={formData.company}
							onChange={handleChange}
							placeholder='e.g., ABC Landscaping'
						/>
						{errors.company && (
							<ErrorMessage style={{ marginTop: '0.25rem' }}>
								{errors.company}
							</ErrorMessage>
						)}
					</FormGroup>

					<FormGroup>
						<Label htmlFor='name'>
							Contact Name <span>*</span>
						</Label>
						<Input
							type='text'
							id='name'
							name='name'
							value={formData.name}
							onChange={handleChange}
							placeholder='e.g., John Smith'
						/>
						{errors.name && (
							<ErrorMessage style={{ marginTop: '0.25rem' }}>
								{errors.name}
							</ErrorMessage>
						)}
					</FormGroup>

					<FormGroup>
						<Label htmlFor='category'>
							Category <span>*</span>
						</Label>
						<Select
							id='category'
							name='category'
							value={formData.category}
							onChange={handleChange}>
							{CONTRACTOR_CATEGORIES.map((cat) => (
								<option key={cat} value={cat}>
									{cat}
								</option>
							))}
						</Select>
						{errors.category && (
							<ErrorMessage style={{ marginTop: '0.25rem' }}>
								{errors.category}
							</ErrorMessage>
						)}
					</FormGroup>

					<FormGroup>
						<Label htmlFor='phone'>
							Phone Number <span>*</span>
						</Label>
						<Input
							type='tel'
							id='phone'
							name='phone'
							value={formData.phone}
							onChange={handleChange}
							placeholder='e.g., (555) 123-4567'
						/>
						{errors.phone && (
							<ErrorMessage style={{ marginTop: '0.25rem' }}>
								{errors.phone}
							</ErrorMessage>
						)}
					</FormGroup>

					<FormGroup>
						<Label htmlFor='email'>Email Address</Label>
						<Input
							type='email'
							id='email'
							name='email'
							value={formData.email}
							onChange={handleChange}
							placeholder='e.g., john@abc.com'
						/>
					</FormGroup>

					<FormGroup>
						<Label htmlFor='address'>Address</Label>
						<Input
							type='text'
							id='address'
							name='address'
							value={formData.address}
							onChange={handleChange}
							placeholder='e.g., 123 Main St, City, State'
						/>
					</FormGroup>

					<FormGroup>
						<Label htmlFor='notes'>Notes</Label>
						<Textarea
							id='notes'
							name='notes'
							value={formData.notes}
							onChange={handleChange}
							placeholder='Add any special notes or contract details...'
						/>
					</FormGroup>

					<ButtonGroup>
						<Button
							type='button'
							variant='secondary'
							onClick={onClose}
							disabled={isLoading}>
							Cancel
						</Button>
						<Button type='submit' disabled={isLoading}>
							{isLoading
								? 'Saving...'
								: contractor
									? 'Update Contractor'
									: 'Add Contractor'}
						</Button>
					</ButtonGroup>
				</form>
			</FormContainer>
		</Overlay>
	);
};
