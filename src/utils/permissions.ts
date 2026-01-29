import {
	USER_ROLES,
	UserRole,
	TASK_APPROVAL_ROLES,
	PROPERTY_MANAGEMENT_ROLES,
	TEAM_MANAGEMENT_ROLES,
	ROLE_HIERARCHY,
	FULL_ACCESS_ROLES,
	LIMITED_ACCESS_ROLES,
	TASK_EDIT_ROLES,
	PAGE_VIEW_ROLES,
} from '../constants/roles';

/**
 * Check if a user role can approve task completions
 */
export const canApproveTaskCompletions = (role: UserRole): boolean => {
	return (TASK_APPROVAL_ROLES as readonly string[]).includes(role);
};

/**
 * Check if a user role can manage properties
 */
export const canManageProperties = (role: UserRole): boolean => {
	return (PROPERTY_MANAGEMENT_ROLES as readonly string[]).includes(role);
};

/**
 * Check if a user role can manage team members
 */
export const canManageTeamMembers = (role: UserRole): boolean => {
	return (TEAM_MANAGEMENT_ROLES as readonly string[]).includes(role);
};

/**
 * Check if a user is an admin
 */
export const isAdmin = (role: UserRole): boolean => {
	return role === USER_ROLES.ADMIN;
};

/**
 * Check if a user has a higher role level than another
 */
export const hasHigherRoleThan = (
	userRole: UserRole,
	compareRole: UserRole,
): boolean => {
	return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[compareRole];
};

/**
 * Get a user-friendly display name for a role
 */
export const getRoleDisplayName = (role: UserRole): string => {
	const displayNames: Record<UserRole, string> = {
		[USER_ROLES.ADMIN]: 'Administrator',
		[USER_ROLES.PROPERTY_MANAGER]: 'Property Manager',
		[USER_ROLES.ASSISTANT_MANAGER]: 'Assistant Manager',
		[USER_ROLES.MAINTENANCE_LEAD]: 'Maintenance Lead',
		[USER_ROLES.MAINTENANCE]: 'Maintenance Technician',
		[USER_ROLES.CONTRACTOR]: 'Contractor',
		[USER_ROLES.TENANT]: 'Tenant',
	};
	return displayNames[role] || role;
};

/**
 * Get role color for UI badges
 */
export const getRoleColor = (role: UserRole): string => {
	const colors: Record<UserRole, string> = {
		[USER_ROLES.ADMIN]: '#e74c3c',
		[USER_ROLES.PROPERTY_MANAGER]: '#3498db',
		[USER_ROLES.ASSISTANT_MANAGER]: '#5dade2',
		[USER_ROLES.MAINTENANCE_LEAD]: '#f39c12',
		[USER_ROLES.MAINTENANCE]: '#f8c471',
		[USER_ROLES.CONTRACTOR]: '#95a5a6',
		[USER_ROLES.TENANT]: '#7f8c8d',
	};
	return colors[role] || '#95a5a6';
};

/**
 * Check if a user has full access (can see all data)
 * Admin, Property Manager, Assistant Manager, and Maintenance Lead can see everything
 */
export const hasFullAccess = (role: UserRole): boolean => {
	return (FULL_ACCESS_ROLES as readonly string[]).includes(role);
};

/**
 * Check if a user has limited access (only sees assigned properties)
 * Maintenance Tech, Contractor, and Tenant are restricted to their assignments
 */
export const hasLimitedAccess = (role: UserRole): boolean => {
	return (LIMITED_ACCESS_ROLES as readonly string[]).includes(role);
};

/**
 * Check if a user can edit tasks
 * Admin, Property Manager, Assistant Manager, and Maintenance Lead can edit tasks
 */
export const canEditTasks = (role: UserRole): boolean => {
	return (TASK_EDIT_ROLES as readonly string[]).includes(role);
};

/**
 * Check if a user can create maintenance requests
 * Limited access users can create requests, but they need approval from Maintenance Lead minimum
 */
export const canCreateMaintenanceRequest = (role: UserRole): boolean => {
	return hasLimitedAccess(role);
};

/**
 * Check if a user can approve maintenance requests
 * Only Maintenance Lead and above can approve
 */
export const canApproveMaintenanceRequest = (role: UserRole): boolean => {
	const approvalRoles = [
		USER_ROLES.ADMIN,
		USER_ROLES.PROPERTY_MANAGER,
		USER_ROLES.ASSISTANT_MANAGER,
		USER_ROLES.MAINTENANCE_LEAD,
	] as const;
	return (approvalRoles as readonly string[]).includes(role);
};

/**
 * Check if a user can view all pages
 * Maintenance Lead and Maintenance can view pages (read-only except tasks)
 * Admin and managers have full edit access
 */
export const canViewAllPages = (role: UserRole): boolean => {
	return (PAGE_VIEW_ROLES as readonly string[]).includes(role);
};

/**
 * Check if a user is a tenant
 * Tenants have restricted access to only their assigned property
 */
export const isTenant = (role: UserRole): boolean => {
	return role === USER_ROLES.TENANT;
};

/**
 * Get the property slug for a tenant's assigned property
 * Returns null for non-tenants
 */
export const getTenantPropertySlug = (
	assignedPropertyId?: number,
): string | null => {
	// Map property IDs to slugs - in a real app, this would come from an API
	const propertySlugMap: Record<number, string> = {
		1: 'downtown-apartments',
		2: 'business-park',
		3: 'sunset-heights',
		4: 'oak-street-complex',
	};
	return assignedPropertyId
		? propertySlugMap[assignedPropertyId] || null
		: null;
};
