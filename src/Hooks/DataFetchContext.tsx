import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../Redux/Store/store';
import {
	useGetPropertyGroupsQuery,
	useGetPropertiesQuery,
	useGetTasksQuery,
	useGetTeamGroupsQuery,
	useGetTeamMembersQuery,
} from '../Redux/API/apiSlice';
import { setPropertyGroups, setTasks } from '../Redux/Slices/propertyDataSlice';
import { setTeamGroups } from '../Redux/Slices/teamSlice';

interface DataFetchContextType {
	isInitialLoadComplete: boolean;
	isLoading: boolean;
	error: string | null;
}

const DataFetchContext = createContext<DataFetchContextType>({
	isInitialLoadComplete: false,
	isLoading: true,
	error: null,
});

export const useDataFetch = () => {
	const context = useContext(DataFetchContext);
	if (!context) {
		throw new Error('useDataFetch must be used within DataFetchProvider');
	}
	return context;
};

interface DataFetchProviderProps {
	children: ReactNode;
}

export const DataFetchProvider: React.FC<DataFetchProviderProps> = ({
	children,
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch all data
	const { data: propertyGroups = [], isLoading: groupsLoading } =
		useGetPropertyGroupsQuery(undefined, { skip: !currentUser });
	const { isLoading: propertiesLoading } = useGetPropertiesQuery(undefined, {
		skip: !currentUser,
	});
	const { data: tasks = [], isLoading: tasksLoading } = useGetTasksQuery(
		undefined,
		{ skip: !currentUser },
	);
	const { data: teamGroups = [], isLoading: teamGroupsLoading } =
		useGetTeamGroupsQuery(undefined, { skip: !currentUser });
	const { isLoading: teamMembersLoading } = useGetTeamMembersQuery(undefined, {
		skip: !currentUser,
	});

	// Track initial load
	useEffect(() => {
		if (!currentUser) {
			setIsInitialLoadComplete(false);
			return;
		}

		const isLoading =
			groupsLoading ||
			propertiesLoading ||
			tasksLoading ||
			teamGroupsLoading ||
			teamMembersLoading;

		if (!isLoading && !isInitialLoadComplete) {
			// Dispatch data to Redux slices for caching
			dispatch(
				setPropertyGroups(
					propertyGroups.map((g) => ({
						...g,
						properties: g.properties || [],
					})),
				),
			);
			dispatch(setTasks(tasks));
			dispatch(
				setTeamGroups(
					teamGroups.map((g) => ({
						...g,
						members: g.members || [],
					})),
				),
			);
			setIsInitialLoadComplete(true);
			setError(null);
		}
	}, [
		currentUser,
		groupsLoading,
		propertiesLoading,
		tasksLoading,
		teamGroupsLoading,
		teamMembersLoading,
		propertyGroups,
		tasks,
		teamGroups,
		dispatch,
		isInitialLoadComplete,
	]);

	const isLoading =
		groupsLoading ||
		propertiesLoading ||
		tasksLoading ||
		teamGroupsLoading ||
		teamMembersLoading;

	return (
		<DataFetchContext.Provider
			value={{
				isInitialLoadComplete,
				isLoading,
				error,
			}}>
			{children}
		</DataFetchContext.Provider>
	);
};
