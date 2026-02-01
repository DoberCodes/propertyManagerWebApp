import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { RootState } from '../../Redux/Store/store';
import { PropertyDialog } from './PropertyDialog';
import {
	useCreatePropertyMutation,
	useCreatePropertyGroupMutation,
} from '../../Redux/API/apiSlice';

const ZeroStateContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 70vh;
	padding: 40px 20px;
	background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	border-radius: 12px;
	margin: 20px;
`;

const ZeroStateIcon = styled.div`
	font-size: 80px;
	margin-bottom: 20px;
`;

const ZeroStateTitle = styled.h2`
	font-size: 28px;
	font-weight: 600;
	color: #2c3e50;
	margin-bottom: 10px;
	text-align: center;
`;

const ZeroStateDescription = styled.p`
	font-size: 16px;
	color: #555;
	margin-bottom: 30px;
	text-align: center;
	max-width: 400px;
	line-height: 1.6;
`;

const AddPropertyButton = styled.button`
	padding: 12px 32px;
	font-size: 16px;
	font-weight: 600;
	color: white;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border: none;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
	}

	&:active {
		transform: translateY(0);
	}
`;

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
				<ZeroStateContainer>
					<ZeroStateIcon>🏠</ZeroStateIcon>
					<ZeroStateTitle>No Property Yet</ZeroStateTitle>
					<ZeroStateDescription>
						Welcome! Let's get started by adding your property. This will help
						you manage all your property details, units, and tasks in one place.
					</ZeroStateDescription>
					<AddPropertyButton onClick={() => setDialogOpen(true)}>
						+ Add Your Property
					</AddPropertyButton>
				</ZeroStateContainer>

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
