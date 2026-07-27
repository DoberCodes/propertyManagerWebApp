import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '../../Redux/store/store';
import { AppZeroState } from '../Library/AppZeroState';
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
	const location = useLocation();
	const navigate = useNavigate();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [showOnboardingSetupTip, setShowOnboardingSetupTip] = useState(false);
	const [createProperty] = useCreatePropertyMutation();
	const [createPropertyGroup] = useCreatePropertyGroupMutation();

	// Find all properties for this user
	const allProperties = propertyGroups.flatMap(
		(group) => group.properties || [],
	);

	// Preserve the legacy direct-to-first-home route for this unused wrapper.
	const isHomeowner = useSelector(selectIsHomeowner);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const shouldOpenCreateDialog =
			params.get('openCreate') === '1' ||
			params.get('openCreate') === 'onboarding' ||
			params.get('action') === 'create';

		if (!shouldOpenCreateDialog) {
			return;
		}

		setShowOnboardingSetupTip(params.get('openCreate') === 'onboarding');
		setDialogOpen(true);

		params.delete('openCreate');
		params.delete('action');
		navigate(
			{
				pathname: location.pathname,
				search: params.toString() ? `?${params.toString()}` : '',
			},
			{ replace: true },
		);
	}, [location.pathname, location.search, navigate]);

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setShowOnboardingSetupTip(false);
	};

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
				coOwners: formData.coOwners || [],
				administrators: formData.administrators || [],
				viewers: formData.viewers || [],
				accessSnapshots: formData.accessSnapshots || {},
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
				<AppZeroState
					kind='noProperties'
					context='homeowner'
					actions={[
						{
							label: 'Add Home',
							onClick: () => setDialogOpen(true),
							variant: 'primary',
						},
					]}
					fullPage
				/>
				<PropertyDialog
					isOpen={dialogOpen}
					onClose={handleCloseDialog}
					onSave={handleSaveProperty}
					showOnboardingSetupTip={showOnboardingSetupTip}
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

