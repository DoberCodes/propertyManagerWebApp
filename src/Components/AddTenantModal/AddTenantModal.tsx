import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAddTenantMutation } from '../../Redux/API/apiSlice';

interface AddTenantModalProps {
	open: boolean;
	onClose: () => void;
	propertyId: string;
}

export const AddTenantModal: React.FC<AddTenantModalProps> = ({
	open,
	onClose,
	propertyId,
}) => {
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		unit: '',
		leaseStart: '',
		leaseEnd: '',
	});

	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const [addTenant, { isLoading }] = useAddTenantMutation();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setSuccess('');

		// Validation
		if (!formData.firstName.trim() || !formData.lastName.trim()) {
			setError('First and last name are required');
			return;
		}

		if (!formData.email.trim() || !formData.email.includes('@')) {
			setError('Valid email is required');
			return;
		}

		try {
			await addTenant({
				propertyId,
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email.toLowerCase(),
				phone: formData.phone,
				unit: formData.unit,
				leaseStart: formData.leaseStart,
				leaseEnd: formData.leaseEnd,
			}).unwrap();

			setSuccess('Tenant added successfully!');
			setFormData({
				firstName: '',
				lastName: '',
				email: '',
				phone: '',
				unit: '',
				leaseStart: '',
				leaseEnd: '',
			});

			setTimeout(() => {
				onClose();
			}, 1000);
		} catch (err: any) {
			setError(err.message || 'Failed to add tenant');
		}
	};

	if (!open) return null;

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContent onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<h2>Add Tenant</h2>
					<CloseButton onClick={onClose}>
						<FontAwesomeIcon icon={faTimes} />
					</CloseButton>
				</ModalHeader>

				{error && <Alert type='error'>{error}</Alert>}
				{success && <Alert type='success'>{success}</Alert>}

				<Form onSubmit={handleSubmit}>
					<FormGroup>
						<FormLabel>First Name *</FormLabel>
						<FormInput
							type='text'
							name='firstName'
							value={formData.firstName}
							onChange={handleChange}
							placeholder='Enter first name'
							required
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Last Name *</FormLabel>
						<FormInput
							type='text'
							name='lastName'
							value={formData.lastName}
							onChange={handleChange}
							placeholder='Enter last name'
							required
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Email *</FormLabel>
						<FormInput
							type='email'
							name='email'
							value={formData.email}
							onChange={handleChange}
							placeholder='Enter email'
							required
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Phone</FormLabel>
						<FormInput
							type='tel'
							name='phone'
							value={formData.phone}
							onChange={handleChange}
							placeholder='Enter phone number'
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Unit</FormLabel>
						<FormInput
							type='text'
							name='unit'
							value={formData.unit}
							onChange={handleChange}
							placeholder='e.g., 101, Unit A'
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Lease Start Date</FormLabel>
						<FormInput
							type='date'
							name='leaseStart'
							value={formData.leaseStart}
							onChange={handleChange}
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Lease End Date</FormLabel>
						<FormInput
							type='date'
							name='leaseEnd'
							value={formData.leaseEnd}
							onChange={handleChange}
						/>
					</FormGroup>

					<ButtonGroup>
						<CancelButton type='button' onClick={onClose}>
							Cancel
						</CancelButton>
						<SubmitButton type='submit' disabled={isLoading}>
							{isLoading ? (
								<>
									<FontAwesomeIcon icon={faSpinner} spin /> Adding...
								</>
							) : (
								'Add Tenant'
							)}
						</SubmitButton>
					</ButtonGroup>
				</Form>
			</ModalContent>
		</ModalOverlay>
	);
};

const ModalOverlay = styled.div`
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
`;

const ModalContent = styled.div`
	background-color: white;
	border-radius: 8px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	max-width: 500px;
	width: 90%;
	max-height: 90vh;
	overflow-y: auto;
`;

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px 24px;
	border-bottom: 1px solid #e0e0e0;

	h2 {
		margin: 0;
		font-size: 20px;
		color: #333;
	}
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 24px;
	cursor: pointer;
	color: #666;

	&:hover {
		color: #333;
	}
`;

const Form = styled.form`
	padding: 24px;
`;

const FormGroup = styled.div`
	margin-bottom: 16px;
`;

const FormLabel = styled.label`
	display: block;
	margin-bottom: 8px;
	font-size: 14px;
	font-weight: 500;
	color: #333;
`;

const FormInput = styled.input`
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	box-sizing: border-box;

	&:focus {
		outline: none;
		border-color: #2196f3;
		box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
	}
`;

const Alert = styled.div<{ type: 'error' | 'success' }>`
	margin-bottom: 16px;
	padding: 12px 16px;
	border-radius: 4px;
	background-color: ${(props) =>
		props.type === 'error' ? '#ffebee' : '#e8f5e9'};
	color: ${(props) => (props.type === 'error' ? '#c62828' : '#2e7d32')};
	border-left: 4px solid
		${(props) => (props.type === 'error' ? '#c62828' : '#2e7d32')};
	font-size: 14px;
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	margin-top: 24px;
`;

const CancelButton = styled.button`
	padding: 10px 20px;
	background-color: #f0f0f0;
	color: #333;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: #e0e0e0;
	}
`;

const SubmitButton = styled.button`
	padding: 10px 20px;
	background-color: #22c55e;
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: #16a34a;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;
