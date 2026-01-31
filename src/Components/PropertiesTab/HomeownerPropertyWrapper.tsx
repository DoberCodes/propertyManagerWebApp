import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/Store/store';
import { PropertyDetailPage } from '../../pages/PropertyDetailPage';

/**
 * Wrapper for homeowner property view. Restricts access and UI for homeowners.
 * - If no property, shows a prompt to add one.
 * - If property exists, renders the property page with homeowner restrictions.
 */
const HomeownerPropertyWrapper: React.FC = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);

	// Find all properties for this user
	const allProperties = propertyGroups.flatMap(
		(group) => group.properties || [],
	);

	// Only allow one property for homeowners
	const userType = (currentUser as any)?.userType || currentUser?.role;
	const isHomeowner = userType === 'homeowner';

	if (!isHomeowner) {
		// Fallback: not a homeowner, render nothing or redirect
		return <div>Access denied.</div>;
	}

	if (allProperties.length === 0) {
		// No property: show prompt to add
		return (
			<div style={{ padding: 32, textAlign: 'center' }}>
				<h2>You have not added a property yet.</h2>
				<p>Please add your property to get started.</p>
				{/* Optionally, add a button to open the add property dialog */}
			</div>
		);
	}

	// Homeowner with a property: render the property page with restrictions
	// Pass a prop to PropertyPage to hide tenant/request tabs, etc.
	return <PropertyDetailPage homeownerMode property={allProperties[0]} />;
};

export default HomeownerPropertyWrapper;
