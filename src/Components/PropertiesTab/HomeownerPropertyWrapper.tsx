import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../../Redux/store/store';
import { ZeroState } from '../Library/ZeroState';
import { PropertyDialog } from './PropertyDialog';
import { selectIsHomeowner } from '../../Redux/selectors/permissionSelectors';
import {
	useCreatePropertyMutation,
	useCreatePropertyGroupMutation,
} from '../../Redux/API/propertySlice';

/**
 * Wrapper for homeowner property view.
 * - If no property, shows a zero-state with option to add one.
 * - If property exists, redirects directly to the property details page.
 */
const HomeownerPropertyWrapper: React.FC = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [createProperty] = useCreatePropertyMutation();
	const [createPropertyGroup] = useCreatePropertyGroupMutation();

	// Find all properties for this user
	const allProperties = propertyGroups.flatMap(
		(group) => group.properties || [],
	);

	// Only allow one property for homeowners
	const isHomeowner = useSelector(selectIsHomeowner);

	if (!isHomeowner) {
		// Fallback: not a homeowner, show error
		return <div>Access denied.</div>;
	}

	const handleSaveProperty = async (formData: any) => {
		try {
			const effectivePropertyType = 'Single Family';
			const normalizedGroupId =
				typeof formData.groupId === 'string' && formData.groupId.trim().length > 0
					? formData.groupId.trim()
					: undefined;

			// Create the property
			await createProperty({
				...formData,
				propertyType: effectivePropertyType,
				...(normalizedGroupId && { groupId: normalizedGroupId }),
				userId: currentUser!.id,
			});

			setDialogOpen(false);
		} catch (error) {
			console.error('Error saving property:', error);
		}
	};

	if (allProperties.length === 0) {
		// No property: show zero-state
		return (
			<>
				<ZeroState
					icon='🏠'
					title='No Property Yet'
					description="Welcome! Let's get started by adding your property. This will help you manage all your property details, units, and tasks in one place."
					actions={[
						{
							label: '+ Add Your Property',
							onClick: () => setDialogOpen(true),
							variant: 'primary',
						},
					]}
				/>

				<PropertyDialog
					isOpen={dialogOpen}
					onClose={() => setDialogOpen(false)}
					onSave={handleSaveProperty}
					forceSingleFamily={true}
					groups={propertyGroups.map((g) => ({ id: g.id, name: g.name }))}
					selectedGroupId={propertyGroups[0]?.id}
					onCreateGroup={async (name: string) => {
						const result = await createPropertyGroup({
							name,
							properties: [],
							userId: currentUser!.id,
						});
						if ('data' in result && result.data) {
							return (result.data as any).id as string;
						}
						return '';
					}}
				/>
			</>
		);
	}

	// Homeowner with a property: redirect directly to their property details page
	const propertySlug = allProperties[0].slug;

	return <Navigate to={`/property/${propertySlug}`} replace />;
};

export default HomeownerPropertyWrapper;
