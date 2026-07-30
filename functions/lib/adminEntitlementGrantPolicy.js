"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProhibitedSelfGrantTarget = exports.canManageEntitlementGrants = exports.isMaintleyOwnerGrantRole = exports.ENTITLEMENT_GRANT_MANAGE_PERMISSION = void 0;
exports.ENTITLEMENT_GRANT_MANAGE_PERMISSION = 'entitlement_grants.manage';
const MAINTLEY_OWNER_ROLE_TOKENS = new Set([
    'owner',
    'maintley_owner',
    'platform_owner',
]);
const normalizeToken = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
const isMaintleyOwnerGrantRole = (value) => MAINTLEY_OWNER_ROLE_TOKENS.has(normalizeToken(value));
exports.isMaintleyOwnerGrantRole = isMaintleyOwnerGrantRole;
const canManageEntitlementGrants = (maintleyRole, permissions) => {
    if ((0, exports.isMaintleyOwnerGrantRole)(maintleyRole))
        return true;
    const permissionTokens = new Set(permissions.map(normalizeToken));
    return (permissionTokens.has(normalizeToken(exports.ENTITLEMENT_GRANT_MANAGE_PERMISSION)) ||
        permissionTokens.has('entitlement_grant_manager'));
};
exports.canManageEntitlementGrants = canManageEntitlementGrants;
const isProhibitedSelfGrantTarget = (params) => {
    if ((0, exports.isMaintleyOwnerGrantRole)(params.maintleyRole))
        return false;
    return (params.actorUserId === params.targetUserId ||
        params.actorAccountId === params.targetAccountId);
};
exports.isProhibitedSelfGrantTarget = isProhibitedSelfGrantTarget;
