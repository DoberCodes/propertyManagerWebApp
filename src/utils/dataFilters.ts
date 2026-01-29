import { Property, PropertyGroup } from '../Redux/Slices/propertyDataSlice';
import { Task } from '../Redux/API/apiSlice';
import { TeamMember, TeamGroup } from '../Redux/Slices/teamSlice';
import { User } from '../Redux/Slices/userSlice';
import { hasFullAccess, hasLimitedAccess } from './permissions';
import { UserRole } from '../constants/roles';

/**
 * Filter properties based on user role and assignments
 * Full access roles see all properties
 * Limited access roles only see properties they're assigned to
 */
export const filterPropertiesByRole = (
	properties: Property[],
	currentUser: User | null,
	teamMembers?: TeamMember[],
): Property[] => {
	if (!currentUser) return [];

	// Full access roles see everything
	if (hasFullAccess(currentUser.role as UserRole)) {
		return properties;
	}

	// Limited access roles only see assigned properties
	if (hasLimitedAccess(currentUser.role as UserRole) && teamMembers) {
		// Find the team member record for this user
		const teamMember = teamMembers.find(
			(member) => member.email === currentUser.email,
		);

		if (!teamMember || !teamMember.linkedProperties) {
			return [];
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
): PropertyGroup[] => {
	if (!currentUser) return [];

	// Full access roles see everything
	if (hasFullAccess(currentUser.role as UserRole)) {
		return groups;
	}

	// Limited access roles only see groups with assigned properties
	if (hasLimitedAccess(currentUser.role as UserRole) && teamMembers) {
		const teamMember = teamMembers.find(
			(member) => member.email === currentUser.email,
		);

		if (!teamMember || !teamMember.linkedProperties) {
			return [];
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
 */
export const filterTasksByRole = (
	tasks: Task[],
	currentUser: User | null,
	teamMembers?: TeamMember[],
	allProperties?: Property[],
): Task[] => {
	if (!currentUser) return [];

	// Full access roles see everything
	if (hasFullAccess(currentUser.role as UserRole)) {
		return tasks;
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
			return [];
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
 * Full access roles see all team members
 * Limited access roles only see team members assigned to same properties
 */
export const filterTeamMembersByRole = (
	teamMembers: TeamMember[],
	currentUser: User | null,
): TeamMember[] => {
	if (!currentUser) return [];

	// Full access roles see everyone
	if (hasFullAccess(currentUser.role as UserRole)) {
		return teamMembers;
	}

	// Limited access roles see members with overlapping property assignments
	if (hasLimitedAccess(currentUser.role as UserRole)) {
		const currentMember = teamMembers.find(
			(member) => member.email === currentUser.email,
		);

		if (!currentMember || !currentMember.linkedProperties) {
			return [];
		}

		// Filter to members who share at least one property assignment
		return teamMembers.filter((member) =>
			member.linkedProperties.some((propId) =>
				currentMember.linkedProperties.includes(propId),
			),
		);
	}

	return [];
};

/**
 * Filter team groups based on user role and property assignments
 */
export const filterTeamGroupsByRole = (
	groups: TeamGroup[],
	currentUser: User | null,
	teamMembers?: TeamMember[],
): TeamGroup[] => {
	if (!currentUser) return [];

	// Full access roles see everything
	if (hasFullAccess(currentUser.role as UserRole)) {
		return groups;
	}

	// Limited access roles only see groups linked to their properties
	if (hasLimitedAccess(currentUser.role as UserRole) && teamMembers) {
		const teamMember = teamMembers.find(
			(member) => member.email === currentUser.email,
		);

		if (!teamMember || !teamMember.linkedProperties) {
			return [];
		}

		// Filter groups that have overlapping property assignments
		return groups
			.map((group) => ({
				...group,
				members:
					group.members?.filter((member) =>
						member.linkedProperties.some((propId) =>
							teamMember.linkedProperties.includes(propId),
						),
					) || [],
			}))
			.filter(
				(group) =>
					group.linkedProperties.some((propId) =>
						teamMember.linkedProperties.includes(propId),
					) && group.members.length > 0,
			);
	}

	return [];
};
