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
import {
	canSubmitMaintenanceRequests,
	canViewTenantInfo,
} from './subscriptionUtils';
import { User } from '../Redux/Slices/userSlice';
import { COLORS } from '../constants/colors';

export interface RoleCapabilities {
	canManageProperties: boolean;
	canManageTasks: boolean;
	canCreateTasks: boolean;
	canCompleteTasks: boolean;
	canManageMaintenanceHistory: boolean;
	canCreateMaintenanceRequests: boolean;
	canApproveMaintenanceRequests: boolean;
	canManageAppliances: boolean;
	canManageContractors: boolean;
	canManageTenants: boolean;
	canManageFinancials: boolean;
	canManageTeam: boolean;
	canManageDocuments: boolean;
}

const createCapabilities = (
	overrides: Partial<RoleCapabilities>,
): RoleCapabilities => ({
	canManageProperties: false,
	canManageTasks: false,
	canCreateTasks: false,
	canCompleteTasks: false,
	canManageMaintenanceHistory: false,
	canCreateMaintenanceRequests: false,
	canApproveMaintenanceRequests: false,
	canManageAppliances: false,
	canManageContractors: false,
	canManageTenants: false,
	canManageFinancials: false,
	canManageTeam: false,
	canManageDocuments: false,
	...overrides,
});

const FULL_MANAGER_CAPABILITIES = createCapabilities({
	canManageProperties: true,
	canManageTasks: true,
	canCreateTasks: true,
	canCompleteTasks: true,
	canManageMaintenanceHistory: true,
	canCreateMaintenanceRequests: true,
	canApproveMaintenanceRequests: true,
	canManageAppliances: true,
	canManageContractors: true,
	canManageTenants: true,
	canManageFinancials: true,
	canManageTeam: true,
	canManageDocuments: true,
});

export const getRoleCapabilities = (role?: string | null): RoleCapabilities => {
	switch (role) {
		case USER_ROLES.ADMIN:
		case USER_ROLES.PROPERTY_MANAGER:
		case USER_ROLES.ASSISTANT_MANAGER:
			return FULL_MANAGER_CAPABILITIES;
		case USER_ROLES.MAINTENANCE_LEAD:
		case USER_ROLES.MAINTENANCE:
			return createCapabilities({
				canManageTasks: true,
				canCreateTasks: true,
				canCompleteTasks: true,
				canManageMaintenanceHistory: true,
				canApproveMaintenanceRequests: true,
				canManageAppliances: true,
				canManageContractors: true,
			});
		case USER_ROLES.LEASING:
			return createCapabilities({
				canCreateMaintenanceRequests: true,
				canManageContractors: true,
				canManageTenants: true,
			});
		case USER_ROLES.ACCOUNTING:
			return createCapabilities({
				canManageFinancials: true,
			});
		case USER_ROLES.TENANT:
		case USER_ROLES.CONTRACTOR:
		case USER_ROLES.PROPERTY_GUEST:
			return createCapabilities({
				canCreateMaintenanceRequests: true,
			});
		default:
			return createCapabilities({});
	}
};

export const canRoleManageTasks = (role?: string | null): boolean =>
	getRoleCapabilities(role).canManageTasks;

export const canRoleCreateTasks = (role?: string | null): boolean =>
	getRoleCapabilities(role).canCreateTasks;

export const canRoleManageMaintenanceHistory = (
	role?: string | null,
): boolean => getRoleCapabilities(role).canManageMaintenanceHistory;

export const canRoleManageAppliances = (role?: string | null): boolean =>
	getRoleCapabilities(role).canManageAppliances;

export const canRoleManageContractors = (role?: string | null): boolean =>
	getRoleCapabilities(role).canManageContractors;

export const canRoleManageTenants = (role?: string | null): boolean =>
	getRoleCapabilities(role).canManageTenants;

export const canRoleCreateMaintenanceRequests = (
	role?: string | null,
): boolean => getRoleCapabilities(role).canCreateMaintenanceRequests;

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
		[USER_ROLES.ACCOUNTING]: 'Accounting',
		[USER_ROLES.LEASING]: 'Leasing Agent',
		[USER_ROLES.CONTRACTOR]: 'Contractor',
		[USER_ROLES.TENANT]: 'Tenant',
		[USER_ROLES.PROPERTY_GUEST]: 'Property Guest',
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
		[USER_ROLES.ACCOUNTING]: '#6366f1',
		[USER_ROLES.LEASING]: COLORS.primary,
		[USER_ROLES.CONTRACTOR]: '#95a5a6',
		[USER_ROLES.TENANT]: '#7f8c8d',
		[USER_ROLES.PROPERTY_GUEST]: '#bdc3c7',
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
	return (
		(TASK_EDIT_ROLES as readonly string[]).includes(role) ||
		getRoleCapabilities(role).canManageTasks
	);
};

/**
 * Check if a user can create maintenance requests
 * Limited access users can create requests, but they need approval from Maintenance Lead minimum
 */
export const canCreateMaintenanceRequest = (role: UserRole): boolean => {
	return getRoleCapabilities(role).canCreateMaintenanceRequests;
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
		USER_ROLES.MAINTENANCE,
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

/**
 * Check if a user can share properties
 * Only property owners can share their properties
 */
export const canShareProperty = (
	userId: string,
	property: { userId?: string } | any,
): boolean => {
	return property.userId === userId;
};

/**
 * Check if a user has admin access to a shared property
 * Users with 'admin' share permission can edit the property
 */
export const hasAdminShareAccess = (permission?: string): boolean => {
	return permission === 'admin';
};

/**
 * Check if a user has viewer access to a shared property
 * Users with 'viewer' share permission can only view
 */
export const hasViewerShareAccess = (permission?: string): boolean => {
	return permission === 'viewer';
};

/**
 * Check if a user can edit a property
 * Property owner or users with admin share access can edit
 */
export const canEditProperty = (
	userId: string,
	property: { userId?: string },
	sharePermission?: string,
): boolean => {
	return property.userId === userId || hasAdminShareAccess(sharePermission);
};

/**
 * Check if a user can delete a property
 * Only property owners can delete properties
 */
export const canDeleteProperty = (
	userId: string,
	property: { userId?: string },
): boolean => {
	return property.userId === userId;
};

/**
 * Check if a user can submit maintenance requests based on their subscription
 */
export const canSubmitMaintenanceRequest = (user: User): boolean => {
	if (!user.subscription) return false;
	return canSubmitMaintenanceRequests(user.subscription);
};

/**
 * Check if a user can view tenant information based on their subscription
 */
export const canViewTenantInformation = (user: User): boolean => {
	if (!user.subscription) return false;
	return canViewTenantInfo(user.subscription);
};

/**
 * Get display label for share permission
 */
export const getSharePermissionLabel = (permission: string): string => {
	const labels: Record<string, string> = {
		'co-owner': 'Co-Owner',
		admin: 'Administrator',
		viewer: 'Viewer',
	};
	return labels[permission] || permission;
};
