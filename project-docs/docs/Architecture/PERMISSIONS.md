# Permissions

Last reviewed: 2026-06

## Purpose

This document describes how authorization is enforced throughout Maintley.

It answers:

> Can a user perform a specific action?

This document covers:

* Authorization philosophy
* Permission layers
* Role models
* Account-scoped access
* Property-scoped access
* Firestore rule behavior
* Cloud Function authorization
* Collection-level permissions

For related documentation:

* FIREBASE_STRUCTURE.md
* DATA_MODEL.md
* MAINTLEY_PLAN_FEATURE_MATRIX.md
* BILLING.md

---

# Authorization Philosophy

Maintley separates three related but independent concepts:

```text
Authentication
    ↓
Identity

Authorization
    ↓
Access

Subscription
    ↓
Feature Availability
```

Authentication answers:

> Who is this user?

Authorization answers:

> What may this user access?

Subscription answers:

> Which platform capabilities are available?

A user may:

* Be authenticated
* Have access to an account
* Lack access to specific resources

or

* Have access to resources
* Lack access to premium features

Permissions should determine resource access, not subscription value.

---

# Permission Layers

Permissions are enforced in three locations.

## UI Capability Checks

Purpose:

Improve usability.

Examples:

* Hide buttons
* Disable actions
* Hide restricted navigation

UI checks should never be considered authoritative security controls.

---

## Firestore Rules

Purpose:

Protect data access.

Examples:

* Read permissions
* Write permissions
* Resource ownership
* Account membership validation

Firestore Rules are an authoritative security boundary.

---

## Cloud Functions

Purpose:

Protect privileged operations.

Examples:

* Invitation workflows
* Account management
* Billing workflows
* Administrative actions

Cloud Function authorization is an authoritative security boundary.

---

# Permission Hierarchy

Maintley follows this enforcement model:

```text
UI
  ↓
Firestore Rules
  ↓
Cloud Functions
```

The UI may hide actions.

Firestore Rules enforce access.

Cloud Functions enforce privileged operations.

The source of truth is:

* Firestore Rules
* Cloud Function authorization

Never the UI.

---

# Admin Portal Boundary

The `/admin` route is an app-admin workflow and is separate from normal Maintley user authentication.

Rules:

* Standard user login should not grant access to admin inbox workflows.
* Admin credentials are validated via Cloud Functions against `admin_users`.
* Admin sessions are function-managed in `admin_sessions`.
* Firestore client access to `admin_users` and `admin_sessions` is denied in rules.
* Admin audit log viewing is restricted to top-level Maintley roles and enforced in Cloud Functions.

This keeps admin access isolated from customer account roles and prevents UI-only protection from becoming a security dependency.

---

# Authentication vs Authorization

Firebase Authentication provides:

```text
request.auth.uid
```

Authentication identifies users.

Authorization is determined through:

* Account membership
* Roles
* Property assignments
* Firestore Rules
* Cloud Function checks

Authentication alone does not grant access to Maintley resources.

---

# Account Scope

Maintley uses an account-centric authorization model.

Primary hierarchy:

```text
User
  ↓
Account Membership
  ↓
Account
  ↓
Properties
```

Preferred membership record:

```text
accountMemberships/{accountId}_{uid}
```

Important fields:

* accountId
* userId
* roles
* status

Active membership is required for account-scoped access unless a legacy compatibility path applies.

See FIREBASE_STRUCTURE.md for detailed account architecture.

---

# Property Assignment Philosophy

Portfolio and team workflows may further restrict access through property assignments.

Preferred model:

```text
Account Access
  ↓
Property Assignment
  ↓
Resource Visibility
```

Examples:

```text
Portfolio User
  ↓
Assigned Property
  ↓
Task Access
```

```text
Portfolio User
  ↓
Assigned Property
  ↓
Maintenance History Access
```

Property assignment should reduce visibility before restricting actions whenever possible.

---

# UI Roles

Defined in:

```text
src/constants/roles.ts
```

Current roles:

* admin
* property_manager
* assistant_manager
* maintenance_lead
* maintenance
* accounting
* leasing
* contractor
* tenant
* property_guest

Role display helpers and capability helpers live in:

```text
src/utils/permissions.ts
```

---

# Role Capability Model

## Administrative Roles

Roles:

* admin
* property_manager
* assistant_manager

Typical capabilities:

* Manage properties
* Manage tasks
* Manage maintenance history
* Manage appliances & systems
* Manage contractors
* Manage tenants
* Manage team members
* Manage financial information

---

## Maintenance Roles

Roles:

* maintenance_lead
* maintenance

Typical capabilities:

* Create tasks
* Complete tasks
* Manage maintenance history
* Manage appliances & systems
* Manage contractors

Typically restricted:

* Team management
* Account management
* Billing management

---

## Leasing Roles

Role:

* leasing

Typical capabilities:

* Manage tenants
* Submit maintenance requests
* Manage contractor relationships

Typically restricted:

* Maintenance operations
* Team administration

---

## Accounting Roles

Role:

* accounting

Typical capabilities:

* Financial visibility
* Financial management

Generally more view-oriented outside financial workflows.

---

## Restricted Roles

Roles:

* tenant
* contractor
* property_guest

Typical capabilities:

* Submit maintenance requests
* Limited property visibility
* Restricted access to account resources

---

# Full vs Limited Access

## Full Access Roles

* admin
* property_manager
* assistant_manager
* maintenance_lead

These roles generally operate across assigned account resources.

---

## Limited Access Roles

* maintenance
* accounting
* leasing
* contractor
* tenant
* property_guest

These roles should be restricted by:

* Property assignment
* Workflow responsibility
* Account context

---

# Subscription Integration

Permissions and subscriptions are related but independent.

Permissions determine:

* Access
* Visibility
* Resource ownership

Subscriptions determine:

* Limits
* Feature availability
* Plan capabilities

Plan definitions are maintained in:

* MAINTLEY_PLAN_FEATURE_MATRIX.md
* BILLING.md

Permissions should consume plan definitions rather than duplicate them.

---

# Firestore Rule Model

Live rules are maintained in:

```text
firestore.rules
```

Important helper concepts:

* isAuthenticated()
* isOwner(userId)
* callerMembershipId(accountId)
* hasMembership(accountId)
* membershipData(accountId)
* hasLegacyAccountLink(accountId)
* hasLegacyManageRole(accountId)
* isActiveMember(accountId)
* hasAnyRole(accountId, roles)
* canReadAccount(accountId)
* canManageAccount(accountId)

---

## Account Reading

```text
canReadAccount(accountId)
```

Allows:

* Active account members
* Legacy-linked users

Used to protect account-scoped resources.

---

## Account Management

```text
canManageAccount(accountId)
```

Allows:

* account_owner
* admin
* manager

Includes legacy compatibility paths where required.

Used to protect account-management operations.

---

# Collection-Level Permissions

## users

Read:

* Own user document

Update:

* Own user document
* Limited managed profile fields by authorized account managers

Delete:

* Own user document

---

## properties

Read:

* Account readers

Create:

* Account managers

Update:

* Account managers

Delete:

* Account managers

Subscription limits are enforced separately.

---

## devices

Read:

* Account readers

Create:

* Account managers

Update:

* Account managers

Delete:

* Account managers

Subscription limits are enforced separately.

---

## tasks

Read:

* Account readers

Create:

* Account managers
* Maintenance roles with task management access

Update:

* Account managers
* Maintenance roles with task management access

Delete:

* Account managers

Maintenance roles with task management access include `maintenance_lead` and
`maintenance`. Deletes remain limited to account managers.

Task authorization resolves the account scope from `accountId`. Legacy task
records that still only have `userId` may be updated when `userId` resolves to
the same account scope; updates should backfill `accountId` rather than preserve
the legacy-only shape.

---

## maintenanceEvents

Read:

* Account readers

Create:

* Account managers
* Authorized server processes

Update:

* Account managers

Delete:

* Account managers

---

## maintenanceHistory

Legacy compatibility collection.

Read:

* Account readers

Write:

* Account managers

Migration efforts should favor maintenanceEvents.

---

## teamMembers

Read:

* Account readers

Create:

* Account managers

Update:

* Account managers

Delete:

* Account managers

---

## teamGroups

Read:

* Account readers

Create:

* Account managers

Update:

* Account managers

Delete:

* Account managers

---

## familyAccounts

Read:

* Account readers

Update:

* Account managers
* Restricted counter updates

Create/Delete:

* Managed by controlled workflows

---

## accountMemberships

Read:

* Membership owner
* Authorized account administrators

Create/Update/Delete:

* Cloud Functions
* Admin SDK

Direct client modification is not allowed.

---

## notifications

Read:

* Recipient

Create:

* Recipient
* Authorized server processes

Update:

* Recipient

Delete:

* Recipient

---

## tenantInvitationCodes

Read:

* Authorized account users

Write:

* Cloud Functions
* Admin SDK

---

## teamMemberInvitationCodes

Read:

* Authorized account users

Write:

* Cloud Functions
* Admin SDK

---

## tenantProfiles

Read:

* Account readers
* Associated tenant

Create:

* Account managers

Update:

* Account managers

Delete:

* Account managers

---

## contractors

Read:

* Account readers

Create:

* Account managers

Update:

* Account managers

Delete:

* Account managers

---

## favorites

Read:

* Owning user

Create:

* Owning user

Delete:

* Owning user

---

## appConfig

Read:

* Authenticated users

Write:

* Denied from client

---

# Cloud Function Authorization

Shared authorization helpers:

```text
functions/accountAuthz.ts
```

Important helpers:

* resolveAccountIdForUser(uid)
* getMembership(accountId, uid)
* hasAnyRole(membership, roles)
* assertAccountRole(uid, accountId, roles)

Cloud Functions should use shared authorization helpers whenever possible.

---

# Protected Workflows

Typical protected workflows include:

* Family account management
* Family invitations
* Team invitations
* Tenant invitations
* Maintenance event creation
* Account deletion
* Billing operations
* Subscription management

These workflows should never rely solely on client-side authorization.

---

# Team Member Rules

Team member accounts are invitation-based linked users.

Expected behavior:

* Access assigned properties
* Operate within assigned role
* Do not manage subscriptions
* Do not manage billing
* Do not own account resources

Account administrators manage:

* Roles
* Property assignments
* Profile information
* Access revocation

---

# Tenant Rules

Tenant accounts are invitation-based and property-scoped.

Expected behavior:

* View tenant-related experiences
* Submit maintenance requests
* Access assigned property information where permitted

Tenants should not manage:

* Account resources
* Billing
* Team structures
* Administrative settings

---

# Current Limitations

Known areas of technical debt include:

* UI role capabilities remain more granular than some Firestore rule implementations.
* Legacy sharing structures coexist with the account membership model.
* Some userId-based ownership paths remain for compatibility.
* Units and suites remain supported in portions of the backend while hidden from active user workflows.

These limitations should not be treated as desired architecture.

Future work should continue consolidating authorization around:

* accountMemberships
* account-scoped ownership
* property-scoped visibility
* shared authorization helpers

---

# Guiding Principles

Maintley permissions should remain:

* Account-centric
* Property-aware
* Role-driven
* Server-enforced

Authorization should always be enforced through Firestore Rules and Cloud Functions.

The UI should improve usability but should never be treated as a security boundary.

When permissions and subscriptions intersect:

* Permissions determine access.
* Subscriptions determine capabilities.

These responsibilities should remain separate.
