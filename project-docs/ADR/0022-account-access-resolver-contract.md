# ADR 0022: Account Access Resolver Contract

Status: Accepted - phased implementation

Date: 2026-07-06

Related report: `project-docs/reports/2026-07-06-data-model-architecture-risk-audit.md`

## Context

Maintley now supports account owners, family members, team members, contractors,
role-based capabilities, and property-scoped assignments.

Access resolution currently appears in multiple places:

* Firestore rules
* Cloud Function authorization helpers
* RTK Query slices
* UI capability helpers
* task assignment and eligible-assignee logic

This duplication has already caused regressions where a user can see or act in
one surface but not another.

## Decision

Maintley will define a shared access resolver contract.

The client should normalize account, role, and property access once and expose a
stable shape to data slices and UI surfaces:

```ts
{
  accountIds: string[];
  activeAccountId: string;
  userRole: string;
  membershipRoles: string[];
  isScopedTeamMember: boolean;
  allowedPropertyIds: string[];
  canManageTasks: boolean;
  canManageProperties: boolean;
  canManageDocuments: boolean;
  canManageMaintenance: boolean;
  canManageTeam: boolean;
}
```

Cloud Functions should use a matching server authorization contract for
privileged operations.

Firestore and Storage rules remain the authoritative enforcement layer. The
client resolver improves consistency and prevents surfaces from independently
recreating role logic.

## Implementation Direction

The first implementation should:

* Add a shared client access adapter.
* Move property/team visibility filtering into that adapter where practical.
* Update high-risk slices first: properties, tasks, devices, maintenance events,
  and documents.
* Keep existing role helpers as thin capability helpers when useful.
* Add tests for scoped team member access and maintenance-lead capabilities.

Server-side work should continue consolidating function authorization around
`functions/accountAuthz.ts`.

## Implementation Tracking

* [x] Add a shared client account-access context and resolver.
* [x] Add property-scope filtering and accessible-account helpers.
* [x] Move high-risk task and equipment consumers behind the shared resolver.
* [x] Add a shared server account-authorization helper.
* [x] Test scoped team-member access and maintenance-related capabilities.
* [ ] Normalize `membershipRoles` in the shared context, or explicitly revise
  the contract if the single effective-role model remains preferred.
* [ ] Finish property-scope consolidation for remaining property, maintenance,
  contractor, document, and user consumers.
* [ ] Remove legacy account-link fallbacks only after migration inventory and
  parity validation prove they are no longer required.

Firestore and Storage Rules remain authoritative throughout this phased client
and Function consolidation.

## Consequences

Positive:

* Fewer regressions where eligible users or assignees disappear from one screen.
* More predictable behavior for family/team accounts.
* Easier future permission changes.
* Better alignment between UI capability checks and server enforcement.

Cost:

* Existing slices will need phased cleanup.
* The resolver must avoid becoming a second security boundary.
* Legacy account-link compatibility will need to remain visible during the
  transition.

## Non-Goals

* Replace Firestore or Storage rules.
* Remove legacy account compatibility in one step.
* Redesign the role model.
* Make subscription plan checks part of authorization.

