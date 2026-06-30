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
		website: '',
		portalUrl: '',
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
				website: contractor.website || '',
				portalUrl: contractor.portalUrl || '',
				notes: contractor.notes || '',
			});
		}
	}, [contractor]);

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.company.trim())
			newErrors.company = 'Company name is required';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const missingRequiredFields = [
		!formData.company.trim() ? 'Company Name' : null,
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
					Add the company name first, then include contact details and online
					access links when you have them.
				</FormIntroText>
				<FormIntroPills>
					<FormIntroPill
						$tone={missingRequiredFields.length === 0 ? 'success' : 'neutral'}>
						{1 - missingRequiredFields.length}/1 required complete
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
					<Label htmlFor='company'>Company Name <span>*</span></Label>
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
					<Label htmlFor='name'>Contact Name</Label>
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
					<Label htmlFor='category'>Category</Label>
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
					<Label htmlFor='phone'>Phone Number</Label>
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
						<Label>Online Access</Label>
					</FormGroup>
				</FormFullWidth>

				<FormGroup>
					<Label htmlFor='website'>Website</Label>
					<Input
						type='text'
						id='website'
						name='website'
						value={formData.website}
						onChange={handleChange}
						placeholder='e.g., https://abcservice.com'
					/>
				</FormGroup>

				<FormGroup>
					<Label htmlFor='portalUrl'>Customer Portal</Label>
					<Input
						type='text'
						id='portalUrl'
						name='portalUrl'
						value={formData.portalUrl}
						onChange={handleChange}
						placeholder='e.g., https://portal.abcservice.com'
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
