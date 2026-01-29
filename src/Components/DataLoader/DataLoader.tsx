import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../Redux/Store/store';
import {
	useGetPropertyGroupsQuery,
	useGetTeamGroupsQuery,
} from '../../Redux/API/apiSlice';
import { setPropertyGroups } from '../../Redux/Slices/propertyDataSlice';
import { setTeamGroups } from '../../Redux/Slices/teamSlice';

/**
 * DataLoader component - Fetches data via RTK Query and syncs to Redux store
 * This ensures all data is loaded on app initialization and kept in sync
 */
export const DataLoader: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();

	// Fetch property groups and sync to Redux
	// Uses Firebase Auth internally to get current user
	const { data: propertyGroups = [] } = useGetPropertyGroupsQuery();

	// Fetch team data and sync to Redux
	const { data: teamGroups = [] } = useGetTeamGroupsQuery();
	useEffect(() => {
		if (propertyGroups.length > 0) {
			// Normalize data to ensure properties array is always present
			const normalized = propertyGroups.map((group) => ({
				...group,
				properties: group.properties || [],
			}));
			dispatch(setPropertyGroups(normalized));
		}
	}, [propertyGroups, dispatch]);

	// Sync team groups to Redux when data changes
	useEffect(() => {
		if (teamGroups.length > 0) {
			// Normalize data to ensure members array is always present
			const normalized = teamGroups.map((group) => ({
				...group,
				members: group.members || [],
			}));
			dispatch(setTeamGroups(normalized));
		}
	}, [teamGroups, dispatch]);

	// This component doesn't render anything
	return null;
};
