import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../Redux/Store/store';
import { setCurrentUser } from '../../Redux/Slices/userSlice';
import { useUpdateUserMutation } from '../../Redux/API/apiSlice';
import { uploadToBase64, isValidImageFile } from '../../utils/base64Upload';
import {
	PageHeaderSection,
	PageTitle as StandardPageTitle,
} from '../../Components/Library/PageHeaders';
import {
	Wrapper,
	Container,
	FormContentWrapper,
	PageHeader,
	PageTitle,
	FormSection,
	FormGroup,
	FormLabel,
	FormInput,
	FormTextarea,
	ImageUploadSection,
	ImagePreview,
	ImageUploadButton,
	ImageUploadInput,
	ButtonGroup,
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

	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		title: '',
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
				image: currentUser.image || '',
			});
		} else {
			navigate('/login');
		}
	}, [currentUser, navigate]);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		setError(null);
	};

	const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setImageError(null);

		// Validate image
		if (!isValidImageFile(file)) {
			setImageError('Invalid image. Please use an image file under 700KB.');
			return;
		}

		setIsUploadingImage(true);
		try {
			const base64Url = await uploadToBase64(file);
			setFormData((prev) => ({
				...prev,
				image: base64Url,
			}));
		} catch (err) {
			setImageError('Failed to upload image. Please try again.');
			console.error('Image upload error:', err);
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleSave = async () => {
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
				<StandardPageTitle>Edit Profile</StandardPageTitle>
				<ButtonGroup>
					<CancelButton onClick={handleCancel} disabled={isLoading}>
						Cancel
					</CancelButton>
					<SaveButton onClick={handleSave} disabled={isLoading}>
						{isLoading ? 'Saving...' : 'Save Changes'}
					</SaveButton>
				</ButtonGroup>
			</PageHeaderSection>

			<Container>
				{isLoading && <LoadingOverlay />}
				<FormContentWrapper>
					{error && <ErrorMessage>{error}</ErrorMessage>}
					{success && <SuccessMessage>{success}</SuccessMessage>}

					<FormSection>
						{/* Profile Image */}
						<ImageUploadSection>
							<FormLabel>Profile Picture</FormLabel>
							{formData.image && (
								<ImagePreview src={formData.image} alt='Profile' />
							)}
							<label>
								<ImageUploadInput
									type='file'
									accept='image/*'
									onChange={handlePhotoUpload}
									disabled={isUploadingImage || isLoading}
								/>
								<ImageUploadButton as='span'>
									{isUploadingImage ? 'Uploading...' : 'Choose Photo'}
								</ImageUploadButton>
							</label>
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
								disabled={isLoading}
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
								disabled={isLoading}
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
								disabled={isLoading}
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
