import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../Redux/store/store';
import {
	useGetTenantProfileQuery,
	useCreateTenantProfileMutation,
	useUpdateTenantProfileMutation,
} from '../../Redux/API/apiSlice';
import {
	PageHeaderSection,
	PageTitle as StandardPageTitle,
} from '../../Components/Library/PageHeaders';
import {
	Wrapper,
	Container,
	FormContentWrapper,
	TabContainer,
	Tab,
	FormSection,
	SectionTitle,
	FormRow,
	FormGroup,
	FormLabel,
	FormInput,
	FormTextarea,
	FormSelect,
	CheckboxGroup,
	Checkbox,
	ButtonGroup,
	SaveButton,
	CancelButton,
	AddButton,
	RemoveButton,
	ItemCard,
	ItemHeader,
	ItemTitle,
	ErrorMessage,
	SuccessMessage,
	LoadingOverlay,
	ProgressBar,
	ProgressText,
	InfoBox,
} from './TenantProfilePage.styles';
import {
	TenantProfile,
	Employment,
	RentalHistory,
	Reference,
	EmergencyContact,
	Pet,
} from '../../types/TenantProfile.types';

type ActiveTab =
	| 'personal'
	| 'financial'
	| 'employment'
	| 'rental'
	| 'references'
	| 'pets'
	| 'emergency';

export const TenantProfilePage: React.FC = () => {
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	const { data: existingProfile, isLoading: isLoadingProfile } =
		useGetTenantProfileQuery(currentUser?.id || '', {
			skip: !currentUser?.id,
		});
	const [createTenantProfile] = useCreateTenantProfileMutation();
	const [updateTenantProfile] = useUpdateTenantProfileMutation();

	const [activeTab, setActiveTab] = useState<ActiveTab>('personal');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const [formData, setFormData] = useState<Partial<TenantProfile>>({
		userId: currentUser?.id || '',
		currentAddress: '',
		dateOfBirth: '',
		driversLicenseNumber: '',
		driversLicenseState: '',
		moveInDatePreference: '',
		desiredLeaseLength: '',
		monthlyIncome: 0,
		additionalIncome: 0,
		additionalIncomeSource: '',
		hasBankruptcy: false,
		bankruptcyDetails: '',
		hasEviction: false,
		evictionDetails: '',
		smokingStatus: 'non-smoker',
		numberOfOccupants: 1,
		vehicleInformation: '',
		specialRequests: '',
		reasonForMoving: '',
		hasPets: false,
		isPublic: true,
		employmentHistory: [],
		rentalHistory: [],
		references: [],
		emergencyContacts: [],
		pets: [],
	});

	// Load existing profile data when available
	useEffect(() => {
		if (existingProfile) {
			setFormData(existingProfile);
		}
	}, [existingProfile]);

	// Calculate profile completeness
	const calculateCompleteness = (): number => {
		const requiredFields = [
			'currentAddress',
			'dateOfBirth',
			'monthlyIncome',
			'smokingStatus',
			'numberOfOccupants',
		];
		const optionalSections = [
			formData.employmentHistory?.length,
			formData.rentalHistory?.length,
			formData.references?.length,
			formData.emergencyContacts?.length,
		];

		const requiredComplete = requiredFields.filter(
			(field) => formData[field as keyof TenantProfile],
		).length;
		const requiredPercent = (requiredComplete / requiredFields.length) * 60;

		const optionalComplete = optionalSections.filter(
			(section) => section && section > 0,
		).length;
		const optionalPercent = (optionalComplete / optionalSections.length) * 40;

		return Math.round(requiredPercent + optionalPercent);
	};

	const handleInputChange = (
		field: keyof TenantProfile,
		value: string | number | boolean,
	) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		setError(null);
	};

	// Employment History Handlers
	const handleAddEmployment = () => {
		const newEmployment: Employment = {
			employerName: '',
			position: '',
			startDate: '',
			monthlyIncome: 0,
			supervisorName: '',
			supervisorPhone: '',
			isCurrent: false,
		};
		setFormData((prev) => ({
			...prev,
			employmentHistory: [...(prev.employmentHistory || []), newEmployment],
		}));
	};

	const handleUpdateEmployment = (
		index: number,
		field: keyof Employment,
		value: any,
	) => {
		const updated = [...(formData.employmentHistory || [])];
		updated[index] = { ...updated[index], [field]: value };
		setFormData((prev) => ({ ...prev, employmentHistory: updated }));
	};

	const handleRemoveEmployment = (index: number) => {
		setFormData((prev) => ({
			...prev,
			employmentHistory: prev.employmentHistory?.filter((_, i) => i !== index),
		}));
	};

	// Rental History Handlers
	const handleAddRentalHistory = () => {
		const newRental: RentalHistory = {
			propertyAddress: '',
			landlordName: '',
			landlordPhone: '',
			landlordEmail: '',
			moveInDate: '',
			moveOutDate: '',
			monthlyRent: 0,
			reasonForLeaving: '',
		};
		setFormData((prev) => ({
			...prev,
			rentalHistory: [...(prev.rentalHistory || []), newRental],
		}));
	};

	const handleUpdateRentalHistory = (
		index: number,
		field: keyof RentalHistory,
		value: any,
	) => {
		const updated = [...(formData.rentalHistory || [])];
		updated[index] = { ...updated[index], [field]: value };
		setFormData((prev) => ({ ...prev, rentalHistory: updated }));
	};

	const handleRemoveRentalHistory = (index: number) => {
		setFormData((prev) => ({
			...prev,
			rentalHistory: prev.rentalHistory?.filter((_, i) => i !== index),
		}));
	};

	// Reference Handlers
	const handleAddReference = () => {
		const newReference: Reference = {
			name: '',
			relationship: '',
			phone: '',
			email: '',
			yearsKnown: 0,
		};
		setFormData((prev) => ({
			...prev,
			references: [...(prev.references || []), newReference],
		}));
	};

	const handleUpdateReference = (
		index: number,
		field: keyof Reference,
		value: any,
	) => {
		const updated = [...(formData.references || [])];
		updated[index] = { ...updated[index], [field]: value };
		setFormData((prev) => ({ ...prev, references: updated }));
	};

	const handleRemoveReference = (index: number) => {
		setFormData((prev) => ({
			...prev,
			references: prev.references?.filter((_, i) => i !== index),
		}));
	};

	// Emergency Contact Handlers
	const handleAddEmergencyContact = () => {
		const newContact: EmergencyContact = {
			name: '',
			relationship: '',
			phone: '',
			email: '',
			address: '',
		};
		setFormData((prev) => ({
			...prev,
			emergencyContacts: [...(prev.emergencyContacts || []), newContact],
		}));
	};

	const handleUpdateEmergencyContact = (
		index: number,
		field: keyof EmergencyContact,
		value: any,
	) => {
		const updated = [...(formData.emergencyContacts || [])];
		updated[index] = { ...updated[index], [field]: value };
		setFormData((prev) => ({ ...prev, emergencyContacts: updated }));
	};

	const handleRemoveEmergencyContact = (index: number) => {
		setFormData((prev) => ({
			...prev,
			emergencyContacts: prev.emergencyContacts?.filter((_, i) => i !== index),
		}));
	};

	// Pet Handlers
	const handleAddPet = () => {
		const newPet: Pet = {
			type: '',
			breed: '',
			name: '',
			age: 0,
			weight: 0,
			isServiceAnimal: false,
		};
		setFormData((prev) => ({
			...prev,
			pets: [...(prev.pets || []), newPet],
			hasPets: true,
		}));
	};

	const handleUpdatePet = (index: number, field: keyof Pet, value: any) => {
		const updated = [...(formData.pets || [])];
		updated[index] = { ...updated[index], [field]: value };
		setFormData((prev) => ({ ...prev, pets: updated }));
	};

	const handleRemovePet = (index: number) => {
		const updatedPets = formData.pets?.filter((_, i) => i !== index) || [];
		setFormData((prev) => ({
			...prev,
			pets: updatedPets,
			hasPets: updatedPets.length > 0,
		}));
	};

	const handleSave = async () => {
		setIsLoading(true);
		setError(null);
		setSuccess(null);

		try {
			if (existingProfile) {
				// Update existing profile
				await updateTenantProfile({
					userId: currentUser!.id,
					updates: formData,
				}).unwrap();
			} else {
				// Create new profile
				await createTenantProfile(formData).unwrap();
			}

			setSuccess('Tenant profile saved successfully!');
			setTimeout(() => setSuccess(null), 3000);
		} catch (err: any) {
			setError(
				err?.message || 'Failed to save tenant profile. Please try again.',
			);
			console.error('Save error:', err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		navigate(-1);
	};

	if (!currentUser) {
		navigate('/login');
		return null;
	}

	const completeness = calculateCompleteness();

	return (
		<Wrapper>
			<PageHeaderSection>
				<StandardPageTitle>Tenant Profile</StandardPageTitle>
				<ButtonGroup>
					<CancelButton onClick={handleCancel} disabled={isLoading}>
						Cancel
					</CancelButton>
					<SaveButton onClick={handleSave} disabled={isLoading}>
						{isLoading ? 'Saving...' : 'Save Profile'}
					</SaveButton>
				</ButtonGroup>
			</PageHeaderSection>

			<Container>
				{isLoading && <LoadingOverlay />}
				<FormContentWrapper>
					{error && <ErrorMessage>{error}</ErrorMessage>}
					{success && <SuccessMessage>{success}</SuccessMessage>}

					<InfoBox>
						Complete your tenant profile to help landlords understand your
						qualifications as a renter. The more information you provide, the
						better your chances of securing your desired property.
					</InfoBox>

					<ProgressText>Profile Completeness: {completeness}%</ProgressText>
					<ProgressBar progress={completeness} />

					<TabContainer>
						<Tab
							active={activeTab === 'personal'}
							onClick={() => setActiveTab('personal')}>
							Personal Info
						</Tab>
						<Tab
							active={activeTab === 'financial'}
							onClick={() => setActiveTab('financial')}>
							Financial
						</Tab>
						<Tab
							active={activeTab === 'employment'}
							onClick={() => setActiveTab('employment')}>
							Employment
						</Tab>
						<Tab
							active={activeTab === 'rental'}
							onClick={() => setActiveTab('rental')}>
							Rental History
						</Tab>
						<Tab
							active={activeTab === 'references'}
							onClick={() => setActiveTab('references')}>
							References
						</Tab>
						<Tab
							active={activeTab === 'pets'}
							onClick={() => setActiveTab('pets')}>
							Pets
						</Tab>
						<Tab
							active={activeTab === 'emergency'}
							onClick={() => setActiveTab('emergency')}>
							Emergency Contacts
						</Tab>
					</TabContainer>

					{/* Personal Information Tab */}
					{activeTab === 'personal' && (
						<FormSection>
							<SectionTitle>Personal Information</SectionTitle>
							<FormRow>
								<FormGroup>
									<FormLabel htmlFor='currentAddress'>
										Current Address *
									</FormLabel>
									<FormInput
										id='currentAddress'
										type='text'
										value={formData.currentAddress || ''}
										onChange={(e) =>
											handleInputChange('currentAddress', e.target.value)
										}
										placeholder='123 Main St, City, State, ZIP'
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='dateOfBirth'>Date of Birth *</FormLabel>
									<FormInput
										id='dateOfBirth'
										type='date'
										value={formData.dateOfBirth || ''}
										onChange={(e) =>
											handleInputChange('dateOfBirth', e.target.value)
										}
									/>
								</FormGroup>
							</FormRow>
							<FormRow>
								<FormGroup>
									<FormLabel htmlFor='driversLicenseNumber'>
										Driver's License Number
									</FormLabel>
									<FormInput
										id='driversLicenseNumber'
										type='text'
										value={formData.driversLicenseNumber || ''}
										onChange={(e) =>
											handleInputChange('driversLicenseNumber', e.target.value)
										}
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='driversLicenseState'>
										Driver's License State
									</FormLabel>
									<FormInput
										id='driversLicenseState'
										type='text'
										value={formData.driversLicenseState || ''}
										onChange={(e) =>
											handleInputChange('driversLicenseState', e.target.value)
										}
										placeholder='CA'
									/>
								</FormGroup>
							</FormRow>
							<FormRow>
								<FormGroup>
									<FormLabel htmlFor='moveInDatePreference'>
										Preferred Move-in Date
									</FormLabel>
									<FormInput
										id='moveInDatePreference'
										type='date'
										value={formData.moveInDatePreference || ''}
										onChange={(e) =>
											handleInputChange('moveInDatePreference', e.target.value)
										}
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='desiredLeaseLength'>
										Desired Lease Length
									</FormLabel>
									<FormSelect
										id='desiredLeaseLength'
										value={formData.desiredLeaseLength || ''}
										onChange={(e) =>
											handleInputChange('desiredLeaseLength', e.target.value)
										}>
										<option value=''>Select...</option>
										<option value='6 months'>6 Months</option>
										<option value='1 year'>1 Year</option>
										<option value='2 years'>2 Years</option>
										<option value='Flexible'>Flexible</option>
									</FormSelect>
								</FormGroup>
							</FormRow>
							<FormRow>
								<FormGroup>
									<FormLabel htmlFor='smokingStatus'>
										Smoking Status *
									</FormLabel>
									<FormSelect
										id='smokingStatus'
										value={formData.smokingStatus || 'non-smoker'}
										onChange={(e) =>
											handleInputChange(
												'smokingStatus',
												e.target.value as
													| 'non-smoker'
													| 'smoker'
													| 'occasional',
											)
										}>
										<option value='non-smoker'>Non-Smoker</option>
										<option value='occasional'>Occasional Smoker</option>
										<option value='smoker'>Smoker</option>
									</FormSelect>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='numberOfOccupants'>
										Number of Occupants *
									</FormLabel>
									<FormInput
										id='numberOfOccupants'
										type='number'
										min='1'
										value={formData.numberOfOccupants || 1}
										onChange={(e) =>
											handleInputChange(
												'numberOfOccupants',
												parseInt(e.target.value),
											)
										}
									/>
								</FormGroup>
							</FormRow>
							<FormGroup>
								<FormLabel htmlFor='vehicleInformation'>
									Vehicle Information
								</FormLabel>
								<FormInput
									id='vehicleInformation'
									type='text'
									value={formData.vehicleInformation || ''}
									onChange={(e) =>
										handleInputChange('vehicleInformation', e.target.value)
									}
									placeholder='Make, Model, Year, License Plate'
								/>
							</FormGroup>
							<FormGroup>
								<FormLabel htmlFor='reasonForMoving'>
									Reason for Moving
								</FormLabel>
								<FormTextarea
									id='reasonForMoving'
									value={formData.reasonForMoving || ''}
									onChange={(e) =>
										handleInputChange('reasonForMoving', e.target.value)
									}
									placeholder='Tell us why you are looking for a new place...'
								/>
							</FormGroup>
							<FormGroup>
								<FormLabel htmlFor='specialRequests'>
									Special Requests or Requirements
								</FormLabel>
								<FormTextarea
									id='specialRequests'
									value={formData.specialRequests || ''}
									onChange={(e) =>
										handleInputChange('specialRequests', e.target.value)
									}
									placeholder='Any accessibility needs, preferences, or special circumstances...'
								/>
							</FormGroup>
							<CheckboxGroup>
								<Checkbox
									id='isPublic'
									checked={formData.isPublic || false}
									onChange={(e) =>
										handleInputChange('isPublic', e.target.checked)
									}
								/>
								<FormLabel htmlFor='isPublic'>
									Make this profile visible to landlords
								</FormLabel>
							</CheckboxGroup>
						</FormSection>
					)}

					{/* Financial Information Tab */}
					{activeTab === 'financial' && (
						<FormSection>
							<SectionTitle>Financial Information</SectionTitle>
							<FormRow>
								<FormGroup>
									<FormLabel htmlFor='monthlyIncome'>
										Monthly Income *
									</FormLabel>
									<FormInput
										id='monthlyIncome'
										type='number'
										min='0'
										step='0.01'
										value={formData.monthlyIncome || 0}
										onChange={(e) =>
											handleInputChange(
												'monthlyIncome',
												parseFloat(e.target.value),
											)
										}
										placeholder='0.00'
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='creditScore'>
										Credit Score (optional)
									</FormLabel>
									<FormInput
										id='creditScore'
										type='number'
										min='300'
										max='850'
										value={formData.creditScore || ''}
										onChange={(e) =>
											handleInputChange('creditScore', parseInt(e.target.value))
										}
										placeholder='300-850'
									/>
								</FormGroup>
							</FormRow>
							<FormRow>
								<FormGroup>
									<FormLabel htmlFor='additionalIncome'>
										Additional Monthly Income
									</FormLabel>
									<FormInput
										id='additionalIncome'
										type='number'
										min='0'
										step='0.01'
										value={formData.additionalIncome || 0}
										onChange={(e) =>
											handleInputChange(
												'additionalIncome',
												parseFloat(e.target.value),
											)
										}
										placeholder='0.00'
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='additionalIncomeSource'>
										Additional Income Source
									</FormLabel>
									<FormInput
										id='additionalIncomeSource'
										type='text'
										value={formData.additionalIncomeSource || ''}
										onChange={(e) =>
											handleInputChange(
												'additionalIncomeSource',
												e.target.value,
											)
										}
										placeholder='e.g., Investment income, Child support'
									/>
								</FormGroup>
							</FormRow>
							<FormGroup>
								<CheckboxGroup>
									<Checkbox
										id='hasBankruptcy'
										checked={formData.hasBankruptcy || false}
										onChange={(e) =>
											handleInputChange('hasBankruptcy', e.target.checked)
										}
									/>
									<FormLabel htmlFor='hasBankruptcy'>
										I have filed for bankruptcy
									</FormLabel>
								</CheckboxGroup>
								{formData.hasBankruptcy && (
									<FormTextarea
										id='bankruptcyDetails'
										value={formData.bankruptcyDetails || ''}
										onChange={(e) =>
											handleInputChange('bankruptcyDetails', e.target.value)
										}
										placeholder='Please provide details (date, type, discharge status)...'
									/>
								)}
							</FormGroup>
							<FormGroup>
								<CheckboxGroup>
									<Checkbox
										id='hasEviction'
										checked={formData.hasEviction || false}
										onChange={(e) =>
											handleInputChange('hasEviction', e.target.checked)
										}
									/>
									<FormLabel htmlFor='hasEviction'>
										I have been evicted
									</FormLabel>
								</CheckboxGroup>
								{formData.hasEviction && (
									<FormTextarea
										id='evictionDetails'
										value={formData.evictionDetails || ''}
										onChange={(e) =>
											handleInputChange('evictionDetails', e.target.value)
										}
										placeholder='Please provide details (date, property, circumstances)...'
									/>
								)}
							</FormGroup>
						</FormSection>
					)}

					{/* Employment History Tab */}
					{activeTab === 'employment' && (
						<FormSection>
							<SectionTitle>Employment History</SectionTitle>
							{formData.employmentHistory?.map((employment, index) => (
								<ItemCard key={index}>
									<ItemHeader>
										<ItemTitle>Employment #{index + 1}</ItemTitle>
										<RemoveButton onClick={() => handleRemoveEmployment(index)}>
											Remove
										</RemoveButton>
									</ItemHeader>
									<FormRow>
										<FormGroup>
											<FormLabel>Employer Name *</FormLabel>
											<FormInput
												type='text'
												value={employment.employerName}
												onChange={(e) =>
													handleUpdateEmployment(
														index,
														'employerName',
														e.target.value,
													)
												}
											/>
										</FormGroup>
										<FormGroup>
											<FormLabel>Position *</FormLabel>
											<FormInput
												type='text'
												value={employment.position}
												onChange={(e) =>
													handleUpdateEmployment(
														index,
														'position',
														e.target.value,
													)
												}
											/>
										</FormGroup>
									</FormRow>
									<FormRow>
										<FormGroup>
											<FormLabel>Start Date *</FormLabel>
											<FormInput
												type='date'
												value={employment.startDate}
												onChange={(e) =>
													handleUpdateEmployment(
														index,
														'startDate',
														e.target.value,
													)
												}
											/>
										</FormGroup>
										<FormGroup>
											<FormLabel>End Date</FormLabel>
											<FormInput
												type='date'
												value={employment.endDate || ''}
												onChange={(e) =>
													handleUpdateEmployment(
														index,
														'endDate',
														e.target.value,
													)
												}
												disabled={employment.isCurrent}
											/>
										</FormGroup>
									</FormRow>
									<FormRow>
										<FormGroup>
											<FormLabel>Monthly Income *</FormLabel>
											<FormInput
												type='number'
												min='0'
												step='0.01'
												value={employment.monthlyIncome}
												onChange={(e) =>
													handleUpdateEmployment(
														index,
														'monthlyIncome',
														parseFloat(e.target.value),
													)
												}
											/>
										</FormGroup>
										<FormGroup>
											<CheckboxGroup>
												<Checkbox
													checked={employment.isCurrent}
													onChange={(e) =>
														handleUpdateEmployment(
															index,
															'isCurrent',
															e.target.checked,
														)
													}
												/>
												<FormLabel>Currently employed here</FormLabel>
											</CheckboxGroup>
										</FormGroup>
									</FormRow>
									<FormRow>
										<FormGroup>
											<FormLabel>Supervisor Name</FormLabel>
											<FormInput
												type='text'
												value={employment.supervisorName}
												onChange={(e) =>
													handleUpdateEmployment(
														index,
														'supervisorName',
														e.target.value,
													)
												}
											/>
										</FormGroup>
										<FormGroup>
											<FormLabel>Supervisor Phone</FormLabel>
											<FormInput
												type='tel'
												value={employment.supervisorPhone}
												onChange={(e) =>
													handleUpdateEmployment(
														index,
														'supervisorPhone',
														e.target.value,
													)
												}
											/>
										</FormGroup>
									</FormRow>
								</ItemCard>
							))}
							<AddButton onClick={handleAddEmployment}>
								+ Add Employment
							</AddButton>
						</FormSection>
					)}

					{/* Rental History Tab */}
					{activeTab === 'rental' && (
						<FormSection>
							<SectionTitle>Rental History</SectionTitle>
							{formData.rentalHistory?.map((rental, index) => (
								<ItemCard key={index}>
									<ItemHeader>
										<ItemTitle>Rental #{index + 1}</ItemTitle>
										<RemoveButton
											onClick={() => handleRemoveRentalHistory(index)}>
											Remove
										</RemoveButton>
									</ItemHeader>
									<FormGroup>
										<FormLabel>Property Address *</FormLabel>
										<FormInput
											type='text'
											value={rental.propertyAddress}
											onChange={(e) =>
												handleUpdateRentalHistory(
													index,
													'propertyAddress',
													e.target.value,
												)
											}
										/>
									</FormGroup>
									<FormRow>
										<FormGroup>
											<FormLabel>Landlord Name *</FormLabel>
											<FormInput
												type='text'
												value={rental.landlordName}
												onChange={(e) =>
													handleUpdateRentalHistory(
														index,
														'landlordName',
														e.target.value,
													)
												}
											/>
										</FormGroup>
										<FormGroup>
											<FormLabel>Landlord Phone *</FormLabel>
											<FormInput
												type='tel'
												value={rental.landlordPhone}
												onChange={(e) =>
													handleUpdateRentalHistory(
														index,
														'landlordPhone',
														e.target.value,
													)
												}
											/>
										</FormGroup>
									</FormRow>
									<FormGroup>
										<FormLabel>Landlord Email</FormLabel>
										<FormInput
											type='email'
											value={rental.landlordEmail}
											onChange={(e) =>
												handleUpdateRentalHistory(
													index,
													'landlordEmail',
													e.target.value,
												)
											}
										/>
									</FormGroup>
									<FormRow>
										<FormGroup>
											<FormLabel>Move-in Date *</FormLabel>
											<FormInput
												type='date'
												value={rental.moveInDate}
												onChange={(e) =>
													handleUpdateRentalHistory(
														index,
														'moveInDate',
														e.target.value,
													)
												}
											/>
										</FormGroup>
										<FormGroup>
											<FormLabel>Move-out Date *</FormLabel>
											<FormInput
												type='date'
												value={rental.moveOutDate}
												onChange={(e) =>
													handleUpdateRentalHistory(
														index,
														'moveOutDate',
														e.target.value,
													)
												}
											/>
										</FormGroup>
									</FormRow>
									<FormGroup>
										<FormLabel>Monthly Rent *</FormLabel>
										<FormInput
											type='number'
											min='0'
											step='0.01'
											value={rental.monthlyRent}
											onChange={(e) =>
												handleUpdateRentalHistory(
													index,
													'monthlyRent',
													parseFloat(e.target.value),
												)
											}
										/>
									</FormGroup>
									<FormGroup>
										<FormLabel>Reason for Leaving</FormLabel>
										<FormTextarea
											value={rental.reasonForLeaving}
											onChange={(e) =>
												handleUpdateRentalHistory(
													index,
													'reasonForLeaving',
													e.target.value,
												)
											}
										/>
									</FormGroup>
								</ItemCard>
							))}
							<AddButton onClick={handleAddRentalHistory}>
								+ Add Rental History
							</AddButton>
						</FormSection>
					)}

					{/* References Tab */}
					{activeTab === 'references' && (
						<FormSection>
							<SectionTitle>References</SectionTitle>
							{formData.references?.map((reference, index) => (
								<ItemCard key={index}>
									<ItemHeader>
										<ItemTitle>Reference #{index + 1}</ItemTitle>
										<RemoveButton onClick={() => handleRemoveReference(index)}>
											Remove
										</RemoveButton>
									</ItemHeader>
									<FormRow>
										<FormGroup>
											<FormLabel>Name *</FormLabel>
											<FormInput
												type='text'
												value={reference.name}
												onChange={(e) =>
													handleUpdateReference(index, 'name', e.target.value)
												}
											/>
										</FormGroup>
										<FormGroup>
											<FormLabel>Relationship *</FormLabel>
											<FormInput
												type='text'
												value={reference.relationship}
												onChange={(e) =>
													handleUpdateReference(
														index,
														'relationship',
														e.target.value,
													)
												}
												placeholder='e.g., Former employer, Friend'
											/>
										</FormGroup>
									</FormRow>
									<FormRow>
										<FormGroup>
											<FormLabel>Phone *</FormLabel>
											<FormInput
												type='tel'
												value={reference.phone}
												onChange={(e) =>
													handleUpdateReference(index, 'phone', e.target.value)
												}
											/>
										</FormGroup>
										<FormGroup>
											<FormLabel>Email</FormLabel>
											<FormInput
												type='email'
												value={reference.email}
												onChange={(e) =>
													handleUpdateReference(index, 'email', e.target.value)
												}
											/>
										</FormGroup>
									</FormRow>
									<FormGroup>
										<FormLabel>Years Known *</FormLabel>
										<FormInput
											type='number'
											min='0'
											value={reference.yearsKnown}
											onChange={(e) =>
												handleUpdateReference(
													index,
													'yearsKnown',
													parseInt(e.target.value),
												)
											}
										/>
									</FormGroup>
								</ItemCard>
							))}
							<AddButton onClick={handleAddReference}>
								+ Add Reference
							</AddButton>
						</FormSection>
					)}

					{/* Pets Tab */}
					{activeTab === 'pets' && (
						<FormSection>
							<SectionTitle>Pets</SectionTitle>
							{formData.pets?.map((pet, index) => (
								<ItemCard key={index}>
									<ItemHeader>
										<ItemTitle>Pet #{index + 1}</ItemTitle>
										<RemoveButton onClick={() => handleRemovePet(index)}>
											Remove
										</RemoveButton>
									</ItemHeader>
									<FormRow>
										<FormGroup>
											<FormLabel>Type *</FormLabel>
											<FormSelect
												value={pet.type}
												onChange={(e) =>
													handleUpdatePet(index, 'type', e.target.value)
												}>
												<option value=''>Select...</option>
												<option value='Dog'>Dog</option>
												<option value='Cat'>Cat</option>
												<option value='Bird'>Bird</option>
												<option value='Fish'>Fish</option>
												<option value='Other'>Other</option>
											</FormSelect>
										</FormGroup>
										<FormGroup>
											<FormLabel>Name *</FormLabel>
											<FormInput
												type='text'
												value={pet.name}
												onChange={(e) =>
													handleUpdatePet(index, 'name', e.target.value)
												}
											/>
										</FormGroup>
									</FormRow>
									<FormRow>
										<FormGroup>
											<FormLabel>Breed</FormLabel>
											<FormInput
												type='text'
												value={pet.breed}
												onChange={(e) =>
													handleUpdatePet(index, 'breed', e.target.value)
												}
											/>
										</FormGroup>
										<FormGroup>
											<FormLabel>Age (years) *</FormLabel>
											<FormInput
												type='number'
												min='0'
												value={pet.age}
												onChange={(e) =>
													handleUpdatePet(
														index,
														'age',
														parseInt(e.target.value),
													)
												}
											/>
										</FormGroup>
									</FormRow>
									<FormRow>
										<FormGroup>
											<FormLabel>Weight (lbs)</FormLabel>
											<FormInput
												type='number'
												min='0'
												value={pet.weight}
												onChange={(e) =>
													handleUpdatePet(
														index,
														'weight',
														parseFloat(e.target.value),
													)
												}
											/>
										</FormGroup>
										<FormGroup>
											<CheckboxGroup>
												<Checkbox
													checked={pet.isServiceAnimal}
													onChange={(e) =>
														handleUpdatePet(
															index,
															'isServiceAnimal',
															e.target.checked,
														)
													}
												/>
												<FormLabel>Service Animal</FormLabel>
											</CheckboxGroup>
										</FormGroup>
									</FormRow>
								</ItemCard>
							))}
							<AddButton onClick={handleAddPet}>+ Add Pet</AddButton>
						</FormSection>
					)}

					{/* Emergency Contacts Tab */}
					{activeTab === 'emergency' && (
						<FormSection>
							<SectionTitle>Emergency Contacts</SectionTitle>
							{formData.emergencyContacts?.map((contact, index) => (
								<ItemCard key={index}>
									<ItemHeader>
										<ItemTitle>Contact #{index + 1}</ItemTitle>
										<RemoveButton
											onClick={() => handleRemoveEmergencyContact(index)}>
											Remove
										</RemoveButton>
									</ItemHeader>
									<FormRow>
										<FormGroup>
											<FormLabel>Name *</FormLabel>
											<FormInput
												type='text'
												value={contact.name}
												onChange={(e) =>
													handleUpdateEmergencyContact(
														index,
														'name',
														e.target.value,
													)
												}
											/>
										</FormGroup>
										<FormGroup>
											<FormLabel>Relationship *</FormLabel>
											<FormInput
												type='text'
												value={contact.relationship}
												onChange={(e) =>
													handleUpdateEmergencyContact(
														index,
														'relationship',
														e.target.value,
													)
												}
												placeholder='e.g., Mother, Spouse, Friend'
											/>
										</FormGroup>
									</FormRow>
									<FormRow>
										<FormGroup>
											<FormLabel>Phone *</FormLabel>
											<FormInput
												type='tel'
												value={contact.phone}
												onChange={(e) =>
													handleUpdateEmergencyContact(
														index,
														'phone',
														e.target.value,
													)
												}
											/>
										</FormGroup>
										<FormGroup>
											<FormLabel>Email</FormLabel>
											<FormInput
												type='email'
												value={contact.email}
												onChange={(e) =>
													handleUpdateEmergencyContact(
														index,
														'email',
														e.target.value,
													)
												}
											/>
										</FormGroup>
									</FormRow>
									<FormGroup>
										<FormLabel>Address</FormLabel>
										<FormInput
											type='text'
											value={contact.address}
											onChange={(e) =>
												handleUpdateEmergencyContact(
													index,
													'address',
													e.target.value,
												)
											}
										/>
									</FormGroup>
								</ItemCard>
							))}
							<AddButton onClick={handleAddEmergencyContact}>
								+ Add Emergency Contact
							</AddButton>
						</FormSection>
					)}
				</FormContentWrapper>
			</Container>
		</Wrapper>
	);
};
