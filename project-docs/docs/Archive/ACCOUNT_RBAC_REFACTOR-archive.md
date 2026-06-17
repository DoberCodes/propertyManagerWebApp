# Account RBAC Refactor (Hard Cutover)

## Goal

Move all account-scoped access from `userId` ownership semantics to `accountId` ownership semantics, with role-based action control via `accountMemberships`.

## Canonical Access Model

- Visibility scope: `accountId`
- Action scope: role(s) in `accountMemberships`
- Resource scope (future): account/property/unit-level role assignments

## New Collection

- `accountMemberships/{accountId_userId}`
  - `accountId: string`
  - `userId: string`
  - `roles: string[]` (e.g. `account_owner`, `admin`, `manager`, `member`, `tenant`)
  - `status: 'active' | 'disabled'`
  - `source: string`
  - `createdAt`, `updatedAt`

## Migration Script

Script path:

- `functions/scripts/migrate-account-rbac.ts`

What it does:

1. Normalizes every user with `accountId` + `isAccountOwner`
2. Creates/merges account membership docs
3. Migrates account-scoped collections to include `accountId`
4. Migrates family account relationships to membership roles
5. Migrates tenant profiles into tenant memberships (when `tenantProfiles.accountId` is present)

## Runbook

1. Backup Firestore before migration
2. Stop write traffic (maintenance window)
3. Run migration:
   - `cd functions`
   - `npm run migrate:account-rbac`
4. Deploy app + rules that require `accountId`
5. Validate sample users (owner/admin/member/tenant)
6. Remove any remaining `userId` read paths

## Validation Queries (Manual)

- Ensure no account-scoped docs missing `accountId`
- Ensure every active user has one membership for their account
- Ensure family members are on owner account

## Notes

This document assumes hard cutover (no legacy dual-read). Keep old logic removed after migration to avoid drift.
