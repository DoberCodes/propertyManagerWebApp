import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../Redux/Store/store';
import {
	useGetPropertyGroupsQuery,
	useGetTeamGroupsQuery,
	useGetTeamMembersQuery,
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
	const { data: propertyGroups = [] } = useGetPropertyGroupsQuery();
	// Fetch team groups and team members
	const { data: teamGroups = [] } = useGetTeamGroupsQuery();
	const { data: teamMembers = [] } = useGetTeamMembersQuery();

	useEffect(() => {
		if (propertyGroups.length > 0) {
			const normalized = propertyGroups.map((group) => ({
				...group,
				properties: group.properties || [],
			}));
			dispatch(setPropertyGroups(normalized));
		}
	}, [propertyGroups, dispatch]);

	useEffect(() => {
		// Merge team members into their groups
		const normalized = teamGroups.map((group) => ({
			...group,
			members: teamMembers.filter((m) => m.groupId === group.id),
		}));

		// Find team members not associated with any group
		const orphanMembers = teamMembers.filter(
			(m) => !teamGroups.some((g) => g.id === m.groupId),
		);

		// If there are orphan members, add a fallback group
		let allGroups = [...normalized];
		if (orphanMembers.length > 0) {
			allGroups.push({
				id: 'orphan',
				userId: '',
				name: 'Other Team Members',
				linkedProperties: [],
				members: orphanMembers,
			});
		}
		dispatch(setTeamGroups(allGroups));
	}, [teamGroups, teamMembers, dispatch]);

	return null;
};
