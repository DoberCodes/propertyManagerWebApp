export type MaintleyRoleValue = Record<string, unknown> | string | boolean | null | undefined;

const MAINTLEY_ADMIN_ROLES = new Set([
	'admin',
	'owner',
	'maintley_owner',
	'platform_owner',
]);

const isAdminRole = (value: unknown): boolean =>
	typeof value === 'string' &&
	MAINTLEY_ADMIN_ROLES.has(value.trim().toLowerCase().replace(/[\s-]+/g, '_'));

export const hasMaintleyAdminAccess = (maintleyRole: MaintleyRoleValue): boolean => {
	if (!maintleyRole) return false;

	if (typeof maintleyRole === 'string') {
		return isAdminRole(maintleyRole);
	}

	if (typeof maintleyRole !== 'object') {
		return false;
	}

	const roleRecord = maintleyRole as Record<string, unknown>;
	return (
		isAdminRole(roleRecord.role) ||
		isAdminRole(roleRecord.maintley_role) ||
		isAdminRole(roleRecord.value)
	);
};
