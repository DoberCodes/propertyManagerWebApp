import React, { useState, useEffect } from 'react';
import {
	useCreateContractorMutation,
	useUpdateContractorMutation,
} from '../../../Redux/API/contractorSlice';
import {
	Contractor,
	ContractorCategory,
} from '../../../types/Contractor.types';
import { GenericModal } from '../../../Components/Library';
import {
	SuccessMessage,
	ErrorMessage,
	InlineError,
	FormIntroCard,
	FormIntroPills,
	FormIntroPill,
	FormIntroText,
	FormGrid,
	FormFullWidth,
	FormGroup,
	Input,
	Label,
	Select,
	Textarea,
} from './index.styles';

interface ContractorFormProps {
	propertyId: string;
	contractor?: Contractor | null;
	onClose: () => void;
}

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
	const [submitAttempted, setSubmitAttempted] = useState(false);
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

	const missingRequiredFields = [
		!formData.company.trim() ? 'Company Name' : null,
		!formData.name.trim() ? 'Contact Name' : null,
		!formData.category ? 'Category' : null,
		!formData.phone.trim() ? 'Phone Number' : null,
	].filter(Boolean) as string[];

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitAttempted(true);

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
		<GenericModal
			isOpen
			title={contractor ? 'Edit Contractor' : 'Add Contractor'}
			onClose={onClose}
			onSubmit={handleSubmit}
			showActions
			secondaryButtonLabel='Cancel'
			secondaryButtonAction={onClose}
			primaryButtonLabel={
				isLoading
					? 'Saving...'
					: contractor
						? 'Update Contractor'
						: 'Add Contractor'
			}
			primaryButtonDisabled={missingRequiredFields.length > 0}
			isLoading={isLoading}>
			<FormIntroCard>
				<FormIntroText>
					Add the required basics first, then include optional contact context
					like notes and address.
				</FormIntroText>
				<FormIntroPills>
					<FormIntroPill
						$tone={missingRequiredFields.length === 0 ? 'success' : 'neutral'}>
						{4 - missingRequiredFields.length}/4 required complete
					</FormIntroPill>
					<FormIntroPill $tone='neutral'>
						{contractor
							? 'Editing existing contractor'
							: 'Creating new contractor'}
					</FormIntroPill>
				</FormIntroPills>
				{submitAttempted && missingRequiredFields.length > 0 && (
					<FormIntroText>
						Still needed: {missingRequiredFields.join(', ')}
					</FormIntroText>
				)}
			</FormIntroCard>

			{message &&
				(message.type === 'success' ? (
					<SuccessMessage>{message.text}</SuccessMessage>
				) : (
					<ErrorMessage>{message.text}</ErrorMessage>
				))}

			<FormGrid>
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
					{errors.company && <InlineError>{errors.company}</InlineError>}
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
					{errors.name && <InlineError>{errors.name}</InlineError>}
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
					{errors.category && <InlineError>{errors.category}</InlineError>}
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
					{errors.phone && <InlineError>{errors.phone}</InlineError>}
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

				<FormFullWidth>
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
				</FormFullWidth>
			</FormGrid>
		</GenericModal>
	);
};
