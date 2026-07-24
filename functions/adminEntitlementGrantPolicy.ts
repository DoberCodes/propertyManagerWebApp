export const ENTITLEMENT_GRANT_MANAGE_PERMISSION = 'entitlement_grants.manage';

const MAINTLEY_OWNER_ROLE_TOKENS = new Set([
	'owner',
	'maintley_owner',
	'platform_owner',
]);

const normalizeToken = (value: unknown): string =>
	String(value || '')
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, '_');

export const isMaintleyOwnerGrantRole = (value: unknown): boolean =>
	MAINTLEY_OWNER_ROLE_TOKENS.has(normalizeToken(value));

export const canManageEntitlementGrants = (
	maintleyRole: unknown,
	permissions: unknown[],
): boolean => {
	if (isMaintleyOwnerGrantRole(maintleyRole)) return true;
	const permissionTokens = new Set(permissions.map(normalizeToken));
	return (
		permissionTokens.has(normalizeToken(ENTITLEMENT_GRANT_MANAGE_PERMISSION)) ||
		permissionTokens.has('entitlement_grant_manager')
	);
};

export const isProhibitedSelfGrantTarget = (params: {
	maintleyRole: unknown;
	actorUserId: string;
	actorAccountId: string;
	targetUserId: string;
	targetAccountId: string;
}): boolean => {
	if (isMaintleyOwnerGrantRole(params.maintleyRole)) return false;
	return (
		params.actorUserId === params.targetUserId ||
		params.actorAccountId === params.targetAccountId
	);
};
