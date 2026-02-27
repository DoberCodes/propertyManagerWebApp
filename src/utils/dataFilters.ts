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
