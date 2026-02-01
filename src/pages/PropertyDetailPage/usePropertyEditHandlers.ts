import { useState } from 'react';
import { PropertyEditHandlers } from '../../types/PropertyDetailPage.types';

export const usePropertyEditHandlers = (): PropertyEditHandlers => {
	const [isEditMode, setIsEditMode] = useState(false);
	const [editedProperty, setEditedProperty] = useState<any>({});
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [editedTitle, setEditedTitle] = useState('');
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [imageError, setImageError] = useState<string | null>(null);
	const [deviceFormData, setDeviceFormData] = useState({
		type: '',
		brand: '',
		model: '',
		installationDate: '',
	});
	const [showDeviceDialog, setShowDeviceDialog] = useState(false);

	const handlePropertyFieldChange = (field: string, value: string) => {
		setEditedProperty((prev: any) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleDeviceFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setDeviceFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleDeviceFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// In a real app, this would add to the property's devices via API
		setShowDeviceDialog(false);
	};

	const handleTitleEdit = () => {
		setIsEditingTitle(true);
		// Set initial value here
		setEditedTitle('');
	};

	const handleTitleSave = () => {
		// In a real app, this would update via API
		setIsEditingTitle(false);
	};

	return {
		isEditMode,
		setIsEditMode,
		editedProperty,
		setEditedProperty,
		isEditingTitle,
		setIsEditingTitle,
		editedTitle,
		setEditedTitle,
		isUploadingImage,
		setIsUploadingImage,
		imageError,
		setImageError,
		deviceFormData,
		setDeviceFormData,
		showDeviceDialog,
		setShowDeviceDialog,
		handlePropertyFieldChange,
		handleDeviceFormChange,
		handleDeviceFormSubmit,
		handleTitleEdit,
		handleTitleSave,
	};
};
