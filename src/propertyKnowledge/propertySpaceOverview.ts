import { getTaskTimeBucketId } from '../tasks/taskTimeBuckets';
import type { Device, PropertyDocument } from '../types/Property.types';
import {
	getEndpointSupplyIds,
	type PropertyKnowledgeLink,
} from '../types/PropertyKnowledgeLink.types';
import type { PropertySupply } from '../types/Supply.types';
import type { Task } from '../types/Task.types';
import { documentIsLinkedToEndpoint } from '../utils/propertyDocumentRelationships';

export type PropertySpaceOverview = {
	equipment: Device[];
	tasks: Task[];
	activeTasks: Task[];
	supplies: PropertySupply[];
	documents: PropertyDocument[];
	recentMaintenance: Record<string, any>[];
	overdueTaskCount: number;
	nextTask?: Task;
};

type BuildPropertySpaceOverviewInput = {
	spaceId: string;
	links: PropertyKnowledgeLink[];
	equipment: Device[];
	tasks: Task[];
	supplies: PropertySupply[];
	documents: PropertyDocument[];
	maintenanceHistory: Record<string, any>[];
	now?: Date;
};

const ACTIVE_TASK_STATUSES = new Set([
	'initiated',
	'pending',
	'in progress',
	'awaiting approval',
	'overdue',
	'hold',
]);

const TASK_BUCKET_ORDER = new Map([
	['overdue', 0],
	['today', 1],
	['this-week', 2],
	['asap', 3],
	['upcoming', 4],
	['unscheduled', 5],
]);

const recordDateValue = (record: Record<string, any>) => {
	const raw =
		record.serviceDate ||
		record.completionDate ||
		record.date ||
		record.completedAt ||
		record.createdAt;
	const parsed = new Date(raw || 0).getTime();
	return Number.isFinite(parsed) ? parsed : 0;
};

const recordIds = (record: Record<string, any>, keys: string[]) =>
	Array.from(
		new Set(
			keys
				.flatMap((key) => {
					const value = record[key];
					return Array.isArray(value) ? value : [value];
				})
				.map((value) => String(value || '').trim())
				.filter(Boolean),
		),
	);

const linkedEndpointIds = (
	links: PropertyKnowledgeLink[],
	spaceId: string,
	fromType: 'equipment' | 'task',
	relationshipType: 'located_in' | 'occurs_in',
) =>
	new Set(
		links
			.filter(
				(link) =>
					link.fromType === fromType &&
					link.relationshipType === relationshipType &&
					link.toType === 'space' &&
					link.toId === spaceId,
			)
			.map((link) => link.fromId),
	);

const isActiveTask = (task: Task) =>
	ACTIVE_TASK_STATUSES.has(String(task.status || '').trim().toLowerCase());

const compareTasks = (left: Task, right: Task, now: Date) => {
	const leftBucket = getTaskTimeBucketId(left, now);
	const rightBucket = getTaskTimeBucketId(right, now);
	const bucketDifference =
		(TASK_BUCKET_ORDER.get(leftBucket) ?? 99) -
		(TASK_BUCKET_ORDER.get(rightBucket) ?? 99);
	if (bucketDifference !== 0) return bucketDifference;

	const leftDate = new Date(left.dueDate || 0).getTime();
	const rightDate = new Date(right.dueDate || 0).getTime();
	if (Number.isFinite(leftDate) && Number.isFinite(rightDate) && leftDate !== rightDate) {
		return leftDate - rightDate;
	}
	return left.title.localeCompare(right.title);
};

export const buildPropertySpaceOverview = ({
	spaceId,
	links,
	equipment,
	tasks,
	supplies,
	documents,
	maintenanceHistory,
	now = new Date(),
}: BuildPropertySpaceOverviewInput): PropertySpaceOverview => {
	const equipmentIds = linkedEndpointIds(
		links,
		spaceId,
		'equipment',
		'located_in',
	);
	const taskIds = linkedEndpointIds(links, spaceId, 'task', 'occurs_in');
	const supplyIds = new Set(getEndpointSupplyIds(links, 'space', spaceId));
	const directMaintenanceIds = new Set(
		links
			.filter(
				(link) =>
					link.fromType === 'maintenance_event' &&
					link.relationshipType === 'occurs_in' &&
					link.toType === 'space' &&
					link.toId === spaceId,
			)
			.map((link) => link.fromId),
	);

	const linkedEquipment = equipment.filter((item) =>
		equipmentIds.has(String(item.id)),
	);
	const linkedTasks = tasks.filter((task) => taskIds.has(String(task.id)));
	const activeTasks = linkedTasks
		.filter(isActiveTask)
		.sort((left, right) => compareTasks(left, right, now));
	const linkedSupplies = supplies.filter((supply) => supplyIds.has(supply.id));
	const linkedDocuments = documents.filter((document) =>
		documentIsLinkedToEndpoint(document, links, 'space', spaceId),
	);
	const recentMaintenance = maintenanceHistory
		.filter((record) => {
			if (directMaintenanceIds.has(String(record.id || ''))) return true;
			const recordEquipmentIds = recordIds(record, [
				'deviceIds',
				'deviceId',
				'assignedDeviceId',
			]);
			const recordTaskIds = recordIds(record, [
				'linkedTaskIds',
				'taskId',
				'linkedTaskId',
				'originalTaskId',
				'assignedTaskId',
			]);
			return (
				recordEquipmentIds.some((id) => equipmentIds.has(id)) ||
				recordTaskIds.some((id) => taskIds.has(id))
			);
		})
		.sort((left, right) => recordDateValue(right) - recordDateValue(left))
		.slice(0, 5);

	return {
		equipment: linkedEquipment,
		tasks: linkedTasks,
		activeTasks,
		supplies: linkedSupplies,
		documents: linkedDocuments,
		recentMaintenance,
		overdueTaskCount: activeTasks.filter(
			(task) => getTaskTimeBucketId(task, now) === 'overdue',
		).length,
		nextTask: activeTasks[0],
	};
};
