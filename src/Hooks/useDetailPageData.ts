/**
 * Custom hook for detail page data fetching and filtering
 * Works for Property, Unit, and Suite detail pages
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../Redux/store/store';
import { useGetMaintenanceHistoryByPropertyQuery } from '../Redux/API/maintenanceSlice';
import { useGetUnitsQuery } from '../Redux/API/propertySlice';
import { Property } from '../types/Property.types';
import { Task } from '../types/Task.types';
import { MaintenanceRequestItem } from '../types/MaintenanceRequest.types';
import {
	filterTasksForEntity,
	filterMaintenanceHistory,
	filterMaintenanceRequests,
} from '../utils/detailPageUtils';
import { isContinuityEvent } from '../utils/maintenanceEventUtils';

interface UseDetailPageDataParams {
	propertySlug: string;
	entityName?: string;
	entityType: 'property' | 'unit' | 'suite';
	propertyType?: 'Multi-Family' | 'Commercial' | 'Single-Family';
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
	entityName,
	entityType,
	propertyType,
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

	// Fetch units if needed
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { data: units = [] } = useGetUnitsQuery(property?.id || '', {
		skip: !property?.id || entityType !== 'unit',
	});

	// Find the entity (unit/suite)
	const entity = useMemo(() => {
		if (!property) return null;

		// For property detail page
		if (entityType === 'property') {
			return property;
		}

		// For unit detail page
		if (
			entityType === 'unit' &&
			entityName &&
			propertyType === 'Multi-Family'
		) {
			const foundUnit = units.find(
				(u) =>
					u.name.replace(/\s+/g, '-').toLowerCase() ===
					decodeURIComponent(entityName),
			);
			if (foundUnit) {
				return foundUnit;
			}
		}

		// For suite detail page
		if (entityType === 'suite' && entityName && propertyType === 'Commercial') {
			const foundSuite = (property.suites as any[])?.find(
				(s) => s.name === decodeURIComponent(entityName),
			);
			if (foundSuite) {
				return foundSuite;
			}
		}

		return null;
	}, [property, entityName, entityType, propertyType, units]);

	// Filter tasks for this entity
	const tasks = useMemo(() => {
		if (!property) return [];

		if (entityType === 'property') {
			return filterTasksForEntity(allTasks, property);
		}

		if (entityType === 'unit' && entity) {
			return filterTasksForEntity(allTasks, property, entity.id, 'unit');
		}

		if (entityType === 'suite' && entity) {
			return filterTasksForEntity(allTasks, property, entity.id, 'suite');
		}

		return [];
	}, [allTasks, property, entity, entityType]);

	const { data: maintenanceHistoryRecords = [] } =
		useGetMaintenanceHistoryByPropertyQuery(property?.id || '', {
			skip: !property?.id,
		});

	// Filter maintenance history for this entity
	const maintenanceHistory = useMemo(() => {
		if (!property) return [];
		const legacyHistory = filterMaintenanceHistory(
			property,
			entity?.name,
			entityType === 'property' ? undefined : (entityType as any),
		);
		const baseHistory = maintenanceHistoryRecords.filter(isContinuityEvent);
		if (!baseHistory.length) {
			return legacyHistory;
		}

		if (entityType === 'property') {
			return baseHistory;
		}

		if (entityType === 'unit' && entity) {
			return baseHistory.filter((record: any) => {
				return record.unitId === entity.id || record.unit === entity.name;
			});
		}

		if (entityType === 'suite' && entity) {
			return baseHistory.filter((record: any) => {
				return record.suiteId === entity.id || record.suite === entity.name;
			});
		}

		return baseHistory;
	}, [property, entity, entityType, maintenanceHistoryRecords]);

	// Filter maintenance requests for this entity
	const maintenanceRequests = useMemo(() => {
		if (!property) return [];

		if (entityType === 'property') {
			return filterMaintenanceRequests(allRequests, property);
		}

		if (entityType === 'unit' && entity) {
			return filterMaintenanceRequests(
				allRequests,
				property,
				entity.name,
				'unit',
			);
		}

		if (entityType === 'suite' && entity) {
			return filterMaintenanceRequests(
				allRequests,
				property,
				entity.name,
				'suite',
			);
		}

		return [];
	}, [allRequests, property, entity, entityType]);

	return {
		property,
		entity,
		tasks,
		maintenanceHistory,
		maintenanceRequests,
	};
};
