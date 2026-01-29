// User role constants
export const USER_ROLES = {
	ADMIN: 'admin',
	PROPERTY_MANAGER: 'property_manager',
	ASSISTANT_MANAGER: 'assistant_manager',
	MAINTENANCE_LEAD: 'maintenance_lead',
	MAINTENANCE: 'maintenance',
	CONTRACTOR: 'contractor',
	TENANT: 'tenant',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Role hierarchy for permissions
export const ROLE_HIERARCHY = {
	[USER_ROLES.ADMIN]: 100,
	[USER_ROLES.PROPERTY_MANAGER]: 80,
	[USER_ROLES.MAINTENANCE_LEAD]: 70,
	[USER_ROLES.ASSISTANT_MANAGER]: 60,
	[USER_ROLES.MAINTENANCE]: 40,
	[USER_ROLES.CONTRACTOR]: 30,
	[USER_ROLES.TENANT]: 10,
} as const;

// Roles that can approve task completions
export const TASK_APPROVAL_ROLES = [
	USER_ROLES.ADMIN,
	USER_ROLES.PROPERTY_MANAGER,
	USER_ROLES.MAINTENANCE_LEAD,
] as const;

// Roles that can manage properties
export const PROPERTY_MANAGEMENT_ROLES = [
	USER_ROLES.ADMIN,
	USER_ROLES.PROPERTY_MANAGER,
	USER_ROLES.ASSISTANT_MANAGER,
] as const;

// Roles that can manage team members (add/edit/delete)
export const TEAM_MANAGEMENT_ROLES = [
	USER_ROLES.ADMIN,
	USER_ROLES.PROPERTY_MANAGER,
] as const;

// Roles that can view team page (read-only, but can see all team members)
export const TEAM_VIEW_ROLES = [
	USER_ROLES.ADMIN,
	USER_ROLES.PROPERTY_MANAGER,
	USER_ROLES.ASSISTANT_MANAGER,
	USER_ROLES.MAINTENANCE_LEAD,
	USER_ROLES.MAINTENANCE,
] as const;

// Roles that can see all data (not restricted to assigned properties)
export const FULL_ACCESS_ROLES = [
	USER_ROLES.ADMIN,
	USER_ROLES.PROPERTY_MANAGER,
	USER_ROLES.ASSISTANT_MANAGER,
	USER_ROLES.MAINTENANCE_LEAD,
] as const;

// Roles that are restricted to only their assigned properties
export const LIMITED_ACCESS_ROLES = [
	USER_ROLES.MAINTENANCE,
	USER_ROLES.CONTRACTOR,
	USER_ROLES.TENANT,
] as const;

// Roles that can edit tasks
export const TASK_EDIT_ROLES = [
	USER_ROLES.ADMIN,
	USER_ROLES.PROPERTY_MANAGER,
	USER_ROLES.ASSISTANT_MANAGER,
	USER_ROLES.MAINTENANCE_LEAD,
	USER_ROLES.MAINTENANCE,
] as const;

// Roles that can view all pages (read-only, except for tasks which follow TASK_EDIT_ROLES)
export const PAGE_VIEW_ROLES = [
	USER_ROLES.ADMIN,
	USER_ROLES.PROPERTY_MANAGER,
	USER_ROLES.ASSISTANT_MANAGER,
	USER_ROLES.MAINTENANCE_LEAD,
	USER_ROLES.MAINTENANCE,
] as const;

// Property sharing permission levels
export const SHARE_PERMISSIONS = {
	ADMIN: 'admin', // Can edit property and invite others
	VIEWER: 'viewer', // Can only view property, cannot edit
} as const;

export type SharePermission =
	(typeof SHARE_PERMISSIONS)[keyof typeof SHARE_PERMISSIONS];
