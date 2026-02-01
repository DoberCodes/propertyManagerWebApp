import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../../Redux/Store/store';
import { ZeroState } from '../Library/ZeroState';
import { PropertyDialog } from './PropertyDialog';
import {
	useCreatePropertyMutation,
	useCreatePropertyGroupMutation,
} from '../../Redux/API/apiSlice';

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
	const isHomeowner = currentUser?.userType === 'homeowner';
	console.info('HomeownerPropertyWrapper: checking homeowner access', {
		isHomeowner,
		propertiesCount: allProperties.length,
	});

	if (!isHomeowner) {
		// Fallback: not a homeowner, show error
		return <div>Access denied.</div>;
	}

	const handleSaveProperty = async (formData: any) => {
		try {
			// If no groups exist, create a default one
			let groupId = propertyGroups[0]?.id;
			if (!groupId) {
				const groupResult = await createPropertyGroup({
					name: 'My Properties',
					properties: [],
					userId: currentUser!.id,
				});
				if ('data' in groupResult && groupResult.data) {
					groupId = (groupResult.data as any).id;
				}
			}

			// Create the property
			await createProperty({
				...formData,
				groupId,
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
					description='Welcome! Let's get started by adding your property. This will help you manage all your property details, units, and tasks in one place.'
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
	console.info(
		'HomeownerPropertyWrapper: redirecting to property',
		propertySlug,
	);
	return <Navigate to={`/property/${propertySlug}`} replace />;
};

export default HomeownerPropertyWrapper;
