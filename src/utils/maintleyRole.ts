export type MaintleyRoleValue = Record<string, unknown> | string | boolean | null | undefined;

const isAdminRole = (value: unknown): boolean =>
	typeof value === 'string' && value.trim().toLowerCase() === 'admin';

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
