/**
 * Custom hook for property-scoped detail data fetching and filtering.
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../Redux/store/store';
import { useGetMaintenanceHistoryByPropertyQuery } from '../Redux/API/maintenanceSlice';
import { useGetDevicesQuery } from '../Redux/API/deviceSlice';
import { Property } from '../types/Property.types';
import { Task } from '../types/Task.types';
import { MaintenanceRequestItem } from '../types/MaintenanceRequest.types';
import {
	filterTasksForEntity,
	filterMaintenanceRequests,
} from '../utils/detailPageUtils';
import { isContinuityEvent } from '../utils/maintenanceEventUtils';
import { mergeMaintenanceHistoryWithDeviceSources } from '../maintenanceHistory/maintenanceHistoryAdapter';

interface UseDetailPageDataParams {
	propertySlug: string;
}

interface DetailPageData {
	property: Property | null;
	entity: any | null;
	tasks: Task[];
	maintenanceHistory: any[];
	maintenanceRequests: MaintenanceRequestItem[];
}

export const useDetailPageData = ({
	propertySlug,
}: UseDetailPageDataParams): DetailPageData => {
	// Get data from Redux
	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);
	const allTasks = useSelector((state: RootState) => state.propertyData.tasks);
	const allRequests = useSelector(
		(state: RootState) => state.maintenanceRequests.requests,
	);

	// Find the property first
	const property = useMemo(() => {
		for (const group of propertyGroups) {
			for (const prop of group.properties || []) {
				if (prop.slug === propertySlug) {
					return prop;
				}
			}
		}
		return null;
	}, [propertyGroups, propertySlug]);

	// The active detail route is property-scoped. Unit and Suite management
	// surfaces were retired while legacy location readers remain elsewhere.
	const entity = property;

	const tasks = useMemo(() => {
		if (!property) return [];
		return filterTasksForEntity(allTasks, property);
	}, [allTasks, property]);

	const { data: sourceMaintenanceHistoryRecords = [] } =
		useGetMaintenanceHistoryByPropertyQuery(property?.id || '', {
			skip: !property?.id,
		});
	const { data: propertyDevices = [] } = useGetDevicesQuery(property?.id || '', {
		skip: !property?.id,
	});

	const maintenanceHistory = useMemo(() => {
		if (!property) return [];
		return mergeMaintenanceHistoryWithDeviceSources(
			sourceMaintenanceHistoryRecords,
			propertyDevices,
		).filter(isContinuityEvent);
	}, [property, sourceMaintenanceHistoryRecords, propertyDevices]);

	const maintenanceRequests = useMemo(() => {
		if (!property) return [];
		return filterMaintenanceRequests(allRequests, property);
	}, [allRequests, property]);

	return {
		property,
		entity,
		tasks,
		maintenanceHistory,
		maintenanceRequests,
	};
};
