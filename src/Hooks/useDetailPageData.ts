/**
 * Custom hook for detail page data fetching and filtering
 * Works for Property, Unit, and Suite detail pages
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../Redux/Store/store';
import { Property } from '../types/Property.types';
import { Task } from '../types/Task.types';
import { MaintenanceRequestItem } from '../types/MaintenanceRequest.types';
import {
	filterTasksForEntity,
	filterMaintenanceHistory,
	filterMaintenanceRequests,
} from '../utils/detailPageUtils';

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

	// Find the property and entity (unit/suite)
	const { property, entity } = useMemo(() => {
		for (const group of propertyGroups) {
			for (const prop of group.properties || []) {
				if (prop.slug === propertySlug) {
					// For property detail page
					if (entityType === 'property') {
						return { property: prop, entity: prop };
					}

					// For unit detail page
					if (
						entityType === 'unit' &&
						entityName &&
						propertyType === 'Multi-Family'
					) {
						const foundUnit = (prop.units as any[])?.find(
							(u) => u.name === decodeURIComponent(entityName),
						);
						if (foundUnit) {
							return { property: prop, entity: foundUnit };
						}
					}

					// For suite detail page
					if (
						entityType === 'suite' &&
						entityName &&
						propertyType === 'Commercial'
					) {
						const foundSuite = (prop.suites as any[])?.find(
							(s) => s.name === decodeURIComponent(entityName),
						);
						if (foundSuite) {
							return { property: prop, entity: foundSuite };
						}
					}
				}
			}
		}
		return { property: null, entity: null };
	}, [propertyGroups, propertySlug, entityName, entityType, propertyType]);

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

	// Filter maintenance history for this entity
	const maintenanceHistory = useMemo(() => {
		if (!property) return [];

		if (entityType === 'property') {
			return filterMaintenanceHistory(property);
		}

		if (entityType === 'unit' && entity) {
			return filterMaintenanceHistory(property, entity.name, 'unit');
		}

		if (entityType === 'suite' && entity) {
			return filterMaintenanceHistory(property, entity.name, 'suite');
		}

		return [];
	}, [property, entity, entityType]);

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
