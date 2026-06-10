import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from 'Redux/store';
import { setCurrentUser } from 'Redux/Slices/userSlice';
import { useUpdateUserMutation } from 'Redux/API/userSlice';
import { FileUploader } from 'Components/Library/FileUploader';
import { uploadUserProfileImage } from 'utils/userProfileImageUpload';
import {
	PageHeaderSection,
	PageTitle as StandardPageTitle,
} from '../../Components/Library/PageHeaders';
import {
	FormGroup,
	FormLabel,
	FormInput,
	ButtonGroup,
} from '../../Components/Library';
import {
	Wrapper,
	Container,
	FormContentWrapper,
	FormSection,
	ImageUploadSection,
	ImagePreview,
	CancelButton,
	SaveButton,
	ErrorMessage,
	SuccessMessage,
	LoadingOverlay,
} from './UserProfile.styles';

export const UserProfile: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [updateUser] = useUpdateUserMutation();
	const isTeamMemberAccount = currentUser?.isTeamMemberAccount === true;

	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		title: '',
		phone: '',
		address: '',
		image: '',
	});

	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [imageError, setImageError] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Initialize form with current user data
	useEffect(() => {
		if (currentUser) {
			setFormData({
				firstName: currentUser.firstName || '',
				lastName: currentUser.lastName || '',
				title: currentUser.title || '',
				phone: currentUser.phone || '',
				address: currentUser.address || '',
				image: currentUser.image || '',
			});
		} else {
			navigate('/login');
		}
	}, [currentUser, navigate]);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		if (isTeamMemberAccount) return;
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		setError(null);
	};

	const handlePhotoUpload = async (file: File | null) => {
		if (!file || !currentUser) return;
		if (isTeamMemberAccount) {
			setImageError('Your profile is managed by the account owner.');
			return;
		}

		setImageError(null);
		setIsUploadingImage(true);
		try {
			const imageUrl = await uploadUserProfileImage(file, currentUser.id);
			setFormData((prev) => ({
				...prev,
				image: imageUrl,
			}));
		} catch (err) {
			setImageError('Failed to upload image. Please try again.');
			console.error('Image upload error:', err);
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleSave = async () => {
		if (isTeamMemberAccount) {
			setError('Your profile is managed by the account owner.');
			return;
		}
		// currentUser guaranteed to exist

		// Validation
		if (!formData.firstName.trim() || !formData.lastName.trim()) {
			setError('First name and last name are required.');
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccess(null);

		try {
			// Update user in Firebase
			const updatedUser = await updateUser({
				id: currentUser!.id,
				updates: {
					firstName: formData.firstName,
					lastName: formData.lastName,
					title: formData.title,
					phone: formData.phone,
					address: formData.address,
					image: formData.image,
				},
			}).unwrap();

			// Update local Redux state
			dispatch(
				setCurrentUser({
					...currentUser,
					...updatedUser,
				}),
			);

			setSuccess('Profile updated successfully!');
			setTimeout(() => setSuccess(null), 3000);
		} catch (err: any) {
			const errorMessage =
				err?.message || 'Failed to update profile. Please try again.';
			setError(errorMessage);
			console.error('Profile update error:', err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		navigate(-1);
	};

	// currentUser guaranteed to exist in protected routes

	return (
		<Wrapper>
			<PageHeaderSection>
				<StandardPageTitle>
					{isTeamMemberAccount ? 'Profile' : 'Edit Profile'}
				</StandardPageTitle>
				<ButtonGroup>
					<CancelButton onClick={handleCancel} disabled={isLoading}>
						{isTeamMemberAccount ? 'Back' : 'Cancel'}
					</CancelButton>
					{!isTeamMemberAccount && (
						<SaveButton onClick={handleSave} disabled={isLoading}>
							{isLoading ? 'Saving...' : 'Save Changes'}
						</SaveButton>
					)}
				</ButtonGroup>
			</PageHeaderSection>

			<Container>
				{isLoading && <LoadingOverlay />}
				<FormContentWrapper>
					{error && <ErrorMessage>{error}</ErrorMessage>}
					{success && <SuccessMessage>{success}</SuccessMessage>}
					{isTeamMemberAccount && (
						<SuccessMessage>
							This profile is managed by the account owner or administrator.
							Ask them to update your name, role, or access details.
						</SuccessMessage>
					)}

					<FormSection>
						{/* Profile Image */}
						<ImageUploadSection>
							<FormLabel>Profile Picture</FormLabel>
							{formData.image && (
								<ImagePreview src={formData.image} alt='Profile' />
							)}
							{!isTeamMemberAccount && (
								<FileUploader
									label='Choose Photo'
									helperText='JPG, PNG, GIF, WEBP (max 8MB)'
									accept='image/*'
									allowedTypes={['image/*']}
									maxSizeBytes={8 * 1024 * 1024}
									setFile={handlePhotoUpload}
									disabled={isUploadingImage || isLoading}
									showSelectedFiles={false}
								/>
							)}
							{imageError && <ErrorMessage>{imageError}</ErrorMessage>}
						</ImageUploadSection>

						{/* First Name */}
						<FormGroup>
							<FormLabel htmlFor='firstName'>First Name *</FormLabel>
							<FormInput
								id='firstName'
								name='firstName'
								type='text'
								value={formData.firstName}
								onChange={handleInputChange}
								placeholder='Enter first name'
								disabled={isLoading || isTeamMemberAccount}
							/>
						</FormGroup>

						{/* Last Name */}
						<FormGroup>
							<FormLabel htmlFor='lastName'>Last Name *</FormLabel>
							<FormInput
								id='lastName'
								name='lastName'
								type='text'
								value={formData.lastName}
								onChange={handleInputChange}
								placeholder='Enter last name'
								disabled={isLoading || isTeamMemberAccount}
							/>
						</FormGroup>

						{/* Title */}
						<FormGroup>
							<FormLabel htmlFor='title'>Job Title</FormLabel>
							<FormInput
								id='title'
								name='title'
								type='text'
								value={formData.title}
								onChange={handleInputChange}
								placeholder='e.g., Property Manager, Administrator'
								disabled={isLoading || isTeamMemberAccount}
							/>
						</FormGroup>

						{/* Phone */}
						<FormGroup>
							<FormLabel htmlFor='phone'>Phone Number</FormLabel>
							<FormInput
								id='phone'
								name='phone'
								type='tel'
								value={formData.phone}
								onChange={handleInputChange}
								placeholder='Enter phone number'
								disabled={isLoading || isTeamMemberAccount}
							/>
						</FormGroup>

						{/* Address */}
						<FormGroup>
							<FormLabel htmlFor='address'>Mailing Address</FormLabel>
							<FormInput
								id='address'
								name='address'
								type='text'
								value={formData.address}
								onChange={handleInputChange}
								placeholder='Enter mailing address'
								disabled={isLoading || isTeamMemberAccount}
							/>
						</FormGroup>

						{/* Email (Read-only) */}
						<FormGroup>
							<FormLabel htmlFor='email'>Email</FormLabel>
							<FormInput
								id='email'
								type='email'
								value={currentUser!.email}
								disabled
								placeholder='Your email address'
							/>
							<small style={{ color: '#666', marginTop: '0.25rem' }}>
								Email cannot be changed
							</small>
						</FormGroup>

						{/* Role (Read-only) */}
						<FormGroup>
							<FormLabel htmlFor='role'>Role</FormLabel>
							<FormInput
								id='role'
								type='text'
								value={currentUser!.role}
								disabled
								placeholder='Your role'
							/>
							<small style={{ color: '#666', marginTop: '0.25rem' }}>
								Role cannot be changed
							</small>
						</FormGroup>
					</FormSection>
				</FormContentWrapper>
			</Container>
		</Wrapper>
	);
};
