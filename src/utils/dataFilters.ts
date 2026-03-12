import { Property, PropertyGroup } from '../Redux/Slices/propertyDataSlice';
import { TeamMember, TeamGroup } from '../Redux/Slices/teamSlice';
import { User } from '../Redux/Slices/userSlice';
import { hasFullAccess, hasLimitedAccess } from './permissions';
import { UserRole, USER_ROLES } from '../constants/roles';
import { PropertyShare } from '../types/Property.types';
import { Task } from '../types/Task.types';

const hasAccountSubscriptionAccess = (user: User | null): boolean => {
	return !!user?.accountId;
};

const normalizeEmail = (email?: string | null): string =>
	(email || '').trim().toLowerCase();

type TenantAssignment = {
	unit?: string;
	unitId?: string;
};

export const getTenantAssignmentForProperty = (
	property: Property,
	userEmail?: string | null,
): TenantAssignment | null => {
	const email = normalizeEmail(userEmail);
	if (!email) return null;

	const tenants = ((property as any).tenants || []) as Array<any>;
	const tenantRecord = tenants.find(
		(tenant) => normalizeEmail(tenant?.email) === email,
	);

	if (!tenantRecord) return null;

	return {
		unit: typeof tenantRecord.unit === 'string' ? tenantRecord.unit : undefined,
		unitId:
			typeof tenantRecord.unitId === 'string'
				? tenantRecord.unitId
				: undefined,
	};
};

const getTenantAssignedProperties = (
	properties: Property[],
	currentUser: User,
): Property[] => {
	const email = normalizeEmail(currentUser.email);
	if (!email) return [];

	return properties.filter(
		(property) => getTenantAssignmentForProperty(property, email) !== null,
	);
};

const resolveTenantAllowedUnitIds = (
	property: Property,
	assignment: TenantAssignment,
): string[] => {
	const unitIds = new Set<string>();
	const units = (((property as any).units as Array<any>) || []).filter(Boolean);

	if (assignment.unitId) {
		unitIds.add(assignment.unitId);
	}

	if (assignment.unit) {
		for (const unit of units) {
			if (
				typeof unit?.id === 'string' &&
				(unit.id === assignment.unit ||
					(typeof unit?.name === 'string' && unit.name === assignment.unit))
			) {
				unitIds.add(unit.id);
			}
		}

		if (unitIds.size === 0) {
			unitIds.add(assignment.unit);
		}
	}

	return Array.from(unitIds);
};

/**
 * Filter properties based on user role and assignments
 * Full access roles see all properties
 * Limited access roles only see properties they're assigned to
 * Property guests only see properties shared with them
 */
export const filterPropertiesByRole = (
	properties: Property[],
	currentUser: User | null,
	teamMembers?: TeamMember[],
	propertyShares?: PropertyShare[],
): Property[] => {
	if (!currentUser) return [];

	// Account members with an active subscription see everything
	if (hasAccountSubscriptionAccess(currentUser)) {
		return properties;
	}

	// Full access roles see everything
	if (hasFullAccess(currentUser.role as UserRole)) {
		return properties;
	}

	if (currentUser.role === USER_ROLES.TENANT) {
		return getTenantAssignedProperties(properties, currentUser);
	}

	// Property guests only see shared properties
	if (currentUser.role === USER_ROLES.PROPERTY_GUEST && propertyShares) {
		const sharedPropertyIds = propertyShares
			.filter((share) => share.sharedWithEmail === currentUser.email)
			.map((share) => share.propertyId);

		return properties.filter((property) =>
			sharedPropertyIds.includes(property.id),
		);
	}

	// Limited access roles only see assigned properties
	if (hasLimitedAccess(currentUser.role as UserRole) && teamMembers) {
		// Find the team member record for this user
		const teamMember = teamMembers.find(
			(member) => member.email === currentUser.email,
		);

		if (!teamMember || !teamMember.linkedProperties) {
			return properties;
		}

		if (teamMember.linkedProperties.length === 0) {
			return properties;
		}

		// Filter to only assigned properties
		return properties.filter((property) =>
			teamMember.linkedProperties.includes(property.id),
		);
	}

	return [];
};

/**
 * Filter property groups based on user role and assignments
 */
export const filterPropertyGroupsByRole = (
	groups: PropertyGroup[],
	currentUser: User | null,
	teamMembers?: TeamMember[],
	propertyShares?: PropertyShare[],
): PropertyGroup[] => {
	if (!currentUser) return [];

	// Account members with an active subscription see everything
	if (hasAccountSubscriptionAccess(currentUser)) {
		return groups;
	}

	// Full access roles see everything
	if (hasFullAccess(currentUser.role as UserRole)) {
		return groups;
	}

	if (currentUser.role === USER_ROLES.TENANT) {
		return groups
			.map((group) => ({
				...group,
				properties:
					group.properties?.filter(
						(property) => {
							const assignment = getTenantAssignmentForProperty(
								property,
								currentUser.email,
							);
							if (assignment) {
								return true;
							}

							const tenants = (((property as any).tenants as any[]) || []).filter(
								Boolean,
							);

							// If this property has no tenant roster embedded, preserve it.
							// Upstream data loading already scopes tenant-visible properties.
							return tenants.length === 0;
						},
					) || [],
			}))
			.filter((group) => group.properties && group.properties.length > 0);
	}

	// Property guests only see groups with shared properties
	if (currentUser.role === USER_ROLES.PROPERTY_GUEST && propertyShares) {
		const sharedPropertyIds = propertyShares
			.filter((share) => share.sharedWithEmail === currentUser.email)
			.map((share) => share.propertyId);

		return groups
			.map((group) => ({
				...group,
				properties:
					group.properties?.filter((property) =>
						sharedPropertyIds.includes(property.id),
					) || [],
			}))
			.filter((group) => group.properties && group.properties.length > 0);
	}

	// Limited access roles only see groups with assigned properties
	if (hasLimitedAccess(currentUser.role as UserRole) && teamMembers) {
		const teamMember = teamMembers.find(
			(member) => member.email === currentUser.email,
		);

		if (!teamMember || !teamMember.linkedProperties) {
			return groups;
		}

		if (teamMember.linkedProperties.length === 0) {
			return groups;
		}

		// Filter groups and their properties
		return groups
			.map((group) => ({
				...group,
				properties:
					group.properties?.filter((property) =>
						teamMember.linkedProperties.includes(property.id),
					) || [],
			}))
			.filter((group) => group.properties && group.properties.length > 0); // Only include groups with visible properties
	}

	return [];
};

/**
 * Filter tasks based on user role and property assignments
 * Full access roles see all tasks
 * Limited access roles only see tasks for their assigned properties
 * Property guests only see tasks for shared properties
 */
export const filterTasksByRole = (
	tasks: Task[],
	currentUser: User | null,
	teamMembers?: TeamMember[],
	allProperties?: Property[],
	propertyShares?: PropertyShare[],
): Task[] => {
	if (!currentUser) return [];

	// Account members with an active subscription see everything (except hidden)
	if (hasAccountSubscriptionAccess(currentUser)) {
		const hiddenIds = currentUser.hiddenPropertyIds || [];
		return tasks.filter((task) => !hiddenIds.includes(task.propertyId));
	}

	// Full access roles see everything (but filter out hidden properties)
	if (hasFullAccess(currentUser.role as UserRole)) {
		// Filter out tasks for properties that are hidden from dashboard
		const hiddenIds = currentUser.hiddenPropertyIds || [];
		return tasks.filter((task) => !hiddenIds.includes(task.propertyId));
	}

	if (currentUser.role === USER_ROLES.TENANT && allProperties) {
		const assignedProperties = getTenantAssignedProperties(allProperties, currentUser);
		const assignedPropertyIds = new Set(assignedProperties.map((property) => property.id));
		const assignedPropertyNames = new Set(
			assignedProperties.map((property) => property.title),
		);

		if (assignedProperties.length === 0) {
			return [];
		}

		const unitScopedByProperty = new Map<string, string[]>();
		for (const property of assignedProperties) {
			const assignment = getTenantAssignmentForProperty(property, currentUser.email);
			if (!assignment) continue;

			const allowedUnitIds = resolveTenantAllowedUnitIds(property, assignment);
			if (allowedUnitIds.length > 0) {
				unitScopedByProperty.set(property.id, allowedUnitIds);
			}
		}

		return tasks.filter((task) => {
			const matchesPropertyId = task.propertyId
				? assignedPropertyIds.has(task.propertyId)
				: false;
			const matchesPropertyName = task.property
				? assignedPropertyNames.has(task.property)
				: false;

			if (!matchesPropertyId && !matchesPropertyName) {
				return false;
			}

			if (!matchesPropertyId || !task.propertyId) {
				return true;
			}

			const allowedUnitIds = unitScopedByProperty.get(task.propertyId);
			if (!allowedUnitIds || allowedUnitIds.length === 0) {
				return true;
			}

			if (!task.unitId) {
				return false;
			}

			return allowedUnitIds.includes(task.unitId);
		});
	}

	// Property guests only see tasks for shared properties
	if (
		currentUser.role === USER_ROLES.PROPERTY_GUEST &&
		propertyShares &&
		allProperties
	) {
		const sharedPropertyIds = propertyShares
			.filter((share) => share.sharedWithEmail === currentUser.email)
			.map((share) => share.propertyId);

		const sharedPropertyNames = allProperties
			.filter((property) => sharedPropertyIds.includes(property.id))
			.map((property) => property.title);

		return tasks.filter((task) => sharedPropertyNames.includes(task.property));
	}

	// Limited access roles only see tasks for assigned properties
	if (
		hasLimitedAccess(currentUser.role as UserRole) &&
		teamMembers &&
		allProperties
	) {
		const teamMember = teamMembers.find(
			(member) => member.email === currentUser.email,
		);

		if (!teamMember || !teamMember.linkedProperties) {
			const hiddenIds = currentUser.hiddenPropertyIds || [];
			return tasks.filter((task) => !hiddenIds.includes(task.propertyId));
		}

		if (teamMember.linkedProperties.length === 0) {
			const hiddenIds = currentUser.hiddenPropertyIds || [];
			return tasks.filter((task) => !hiddenIds.includes(task.propertyId));
		}

		// Get property titles/slugs for assigned properties
		const assignedPropertyNames = allProperties
			.filter((property) => teamMember.linkedProperties.includes(property.id))
			.map((property) => property.title);

		// Filter tasks by property name
		return tasks.filter((task) =>
			assignedPropertyNames.includes(task.property),
		);
	}

	return [];
};

/**
 * Filter team members based on user role
 * All roles now see all team members (no property assignment filtering)
 */
export const filterTeamMembersByRole = (
	teamMembers: TeamMember[],
	currentUser: User | null,
): TeamMember[] => {
	if (!currentUser) return [];
	return teamMembers;
};

/**
 * Filter team groups based on user role
 * All roles now see all team groups (no property assignment filtering)
 */
export const filterTeamGroupsByRole = (
	groups: TeamGroup[],
	currentUser: User | null,
): TeamGroup[] => {
	if (!currentUser) return [];
	return groups;
};
