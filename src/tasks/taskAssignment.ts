import type { Task, TaskAssigneeSnapshot } from '../types/Task.types';

export type TaskAssigneeType =
	| 'user'
	| 'team_member'
	| 'family_member'
	| 'contractor'
	| 'unknown';

export interface TaskAssigneeOption {
	value: string;
	label: string;
	email?: string;
	type?: TaskAssigneeType;
	propertyIds?: string[];
}

type BuildTaskAssigneeOptionsInput = {
	currentUser?: any | null;
	teamMembers?: any[];
	familyMembers?: any[];
	contractors?: any[];
	propertyOwner?: any | null;
	propertyId?: string | null;
	additionalOptions?: Array<Partial<TaskAssigneeOption> | null | undefined>;
	includeCurrentUser?: boolean;
	includePropertyOwner?: boolean;
	includeTeamMembers?: boolean;
	includeFamilyMembers?: boolean;
	includeContractors?: boolean;
};

const normalize = (value?: unknown): string => String(value || '').trim();

const normalizeEmail = (value?: unknown): string => normalize(value).toLowerCase();

const getPersonName = (person?: any | null): string => {
	if (!person) return '';
	const fullName = [person.firstName, person.lastName]
		.map(normalize)
		.filter(Boolean)
		.join(' ');
	return normalize(
		person.displayName ||
			person.name ||
			fullName ||
			(person.email ? String(person.email).split('@')[0] : ''),
	);
};

const getPersonId = (person?: any | null): string =>
	normalize(
		person?.id ||
			person?.uid ||
			person?.userId ||
			person?.userAccountId ||
			person?.redeemedByUserId,
	);

const getContractorName = (contractor?: any | null): string =>
	normalize(
		contractor?.company ||
			contractor?.companyName ||
			contractor?.name ||
			contractor?.email,
	);

const getContractorLabel = (contractor?: any | null): string => {
	const name = getContractorName(contractor);
	if (!name) return '';
	const category = normalize(contractor?.category || 'Contractor');
	return category ? `${name} (${category})` : name;
};

const getLinkedPropertyIds = (record?: any | null): string[] => {
	const values = [
		...(Array.isArray(record?.linkedProperties) ? record.linkedProperties : []),
		...(Array.isArray(record?.assignedPropertyIds)
			? record.assignedPropertyIds
			: []),
		...(Array.isArray(record?.propertyIds) ? record.propertyIds : []),
		record?.propertyId,
	];

	return Array.from(
		new Set(values.map(normalize).filter(Boolean)),
	);
};

const isEligibleForProperty = (
	record: any,
	propertyId?: string | null,
): boolean => {
	const scopedPropertyId = normalize(propertyId);
	if (!scopedPropertyId) return true;
	const linkedPropertyIds = getLinkedPropertyIds(record);
	if (linkedPropertyIds.length === 0) return true;
	return linkedPropertyIds.includes(scopedPropertyId);
};

export const mergeTaskAssigneeOptions = (
	options: Array<Partial<TaskAssigneeOption> | null | undefined>,
): TaskAssigneeOption[] => {
	const merged: TaskAssigneeOption[] = [];
	const seen = new Set<string>();

	options.forEach((option) => {
		const value = normalize(option?.value);
		const label = normalize(option?.label || option?.email);
		if (!value || !label) return;
		if (seen.has(value)) return;
		seen.add(value);
		merged.push({
			value,
			label,
			email: normalize(option?.email) || undefined,
			type: option?.type || 'unknown',
			propertyIds: option?.propertyIds,
		});
	});

	return merged;
};

export const buildTaskAssigneeOptions = ({
	currentUser,
	teamMembers = [],
	familyMembers = [],
	contractors = [],
	propertyOwner,
	propertyId,
	additionalOptions = [],
	includeCurrentUser = true,
	includePropertyOwner = true,
	includeTeamMembers = true,
	includeFamilyMembers = true,
	includeContractors = true,
}: BuildTaskAssigneeOptionsInput): TaskAssigneeOption[] => {
	const options: Array<Partial<TaskAssigneeOption>> = [];

	if (includeCurrentUser) {
		const id = getPersonId(currentUser);
		const label = getPersonName(currentUser);
		if (id && label) {
			options.push({
				value: id,
				label,
				email: currentUser?.email,
				type: 'user',
			});
		}
	}

	if (includePropertyOwner) {
		const id = getPersonId(propertyOwner);
		const currentUserId = getPersonId(currentUser);
		const label = getPersonName(propertyOwner);
		if (id && label && id !== currentUserId) {
			options.push({
				value: id,
				label,
				email: propertyOwner?.email,
				type: 'user',
			});
		}
	}

	if (includeTeamMembers) {
		teamMembers
			.filter((member) => member && isEligibleForProperty(member, propertyId))
			.forEach((member) => {
				const id = normalize(member.id);
				const name = getPersonName(member);
				const title = normalize(member.title || member.role);
				if (!id || !name) return;
				options.push({
					value: id,
					label: title ? `${name} (${title})` : name,
					email: member.email,
					type: 'team_member',
					propertyIds: getLinkedPropertyIds(member),
				});
			});
	}

	if (includeFamilyMembers) {
		familyMembers.forEach((member) => {
			const id = getPersonId(member);
			const name = getPersonName(member);
			if (!id || !name) return;
			options.push({
				value: id,
				label: name,
				email: member.email,
				type: 'family_member',
			});
		});
	}

	if (includeContractors) {
		contractors
			.filter((contractor) => contractor && isEligibleForProperty(contractor, propertyId))
			.forEach((contractor) => {
				const id = normalize(contractor.id);
				const label = getContractorLabel(contractor);
				if (!id || !label) return;
				options.push({
					value: id,
					label,
					email: contractor.email,
					type: 'contractor',
					propertyIds: getLinkedPropertyIds(contractor),
				});
			});
	}

	return mergeTaskAssigneeOptions([...options, ...additionalOptions]);
};

export const getStoredTaskAssigneeOption = (
	taskOrAssignee?: (Partial<Task> & { assignedTo?: any }) | any | null,
): TaskAssigneeOption | null => {
	if (!taskOrAssignee) return null;

	const assignedTo =
		taskOrAssignee.assignedTo && typeof taskOrAssignee.assignedTo === 'object'
			? taskOrAssignee.assignedTo
			: taskOrAssignee.id || taskOrAssignee.name || taskOrAssignee.email
				? taskOrAssignee
				: null;
	const legacyName =
		taskOrAssignee.assigneeFirstName || taskOrAssignee.assigneeLastName
			? `${taskOrAssignee.assigneeFirstName || ''} ${taskOrAssignee.assigneeLastName || ''}`.trim()
			: '';
	const value = normalize(
		assignedTo?.id ||
			(typeof taskOrAssignee.assignedTo === 'string'
				? taskOrAssignee.assignedTo
				: '') ||
			taskOrAssignee.assignee,
	);
	const label = normalize(
		assignedTo?.name ||
			taskOrAssignee.assigneeName ||
			legacyName ||
			assignedTo?.email ||
			taskOrAssignee.assigneeEmail ||
			'Former assignee',
	);

	if (!value || !label) return null;

	return {
		value,
		label,
		email: normalize(assignedTo?.email || taskOrAssignee.assigneeEmail) || undefined,
		type: assignedTo?.type || 'unknown',
	};
};

export const createAssignedToSnapshot = (
	option: TaskAssigneeOption,
): TaskAssigneeSnapshot => {
	const snapshot: TaskAssigneeSnapshot = {
		id: option.value,
		name: option.label,
	};

	if (option.email) {
		snapshot.email = option.email;
	}

	if (option.type && option.type !== 'unknown') {
		snapshot.type = option.type;
	}

	return snapshot;
};

export const buildTaskAssignmentFields = (
	selectedAssigneeId: string | undefined | null,
	options: TaskAssigneeOption[],
): { assignee: string; assignedTo: TaskAssigneeSnapshot } | null => {
	const selectedId = normalize(selectedAssigneeId);
	if (!selectedId) return null;

	const selectedOption = options.find((option) => option.value === selectedId);
	if (!selectedOption) return null;

	return {
		assignee: selectedOption.value,
		assignedTo: createAssignedToSnapshot(selectedOption),
	};
};
