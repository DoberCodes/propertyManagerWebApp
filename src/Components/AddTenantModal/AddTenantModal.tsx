import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAddTenantMutation } from '../../Redux/API/apiSlice';
import { GenericModal, FormGroup, FormLabel, FormInput } from '../Library';
import { COLORS } from '../../constants/colors';

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

	return (
		<GenericModal
			isOpen={open}
			title='Add Tenant'
			onClose={onClose}
			onSubmit={handleSubmit}
			primaryButtonLabel={isLoading ? 'Adding...' : 'Add Tenant'}
			secondaryButtonLabel='Cancel'
			primaryButtonDisabled={isLoading}
			isLoading={isLoading}>
			{error && <Alert type='error'>{error}</Alert>}
			{success && <Alert type='success'>{success}</Alert>}

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
		</GenericModal>
	);
};

const Alert = styled.div<{ type: 'error' | 'success' }>`
	margin-bottom: 16px;
	padding: 12px 16px;
	border-radius: 4px;
	background-color: ${(props) =>
		props.type === 'error' ? COLORS.alertErrorBg : COLORS.alertSuccessBg};
	color: ${(props) =>
		props.type === 'error' ? COLORS.alertError : COLORS.alertSuccess};
	border-left: 4px solid
		${(props) =>
			props.type === 'error' ? COLORS.alertError : COLORS.alertSuccess};
	font-size: 14px;
	margin: 0 0 16px 0;
`;
