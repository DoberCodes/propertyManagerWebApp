# Organization Architecture Plan

Date: 2026-07-21

Status: Proposed implementation plan; no Organization feature is implemented by
this report

Related decisions:

* `project-docs/ADR/0026-property-ownership-and-professional-contribution-model.md`
* `project-docs/ADR/0027-business-licensing-property-stewardship-and-record-attribution.md`

Related plan:

* `project-docs/reports/2026-07-21-business-licensing-readiness-and-implementation-plan.md`

## Objective

Add a licensed-business Organization experience while preserving:

* homeowner ownership of properties and Property Memory
* Portfolio as an offered subscription plan
* existing Portfolio customer behavior
* one authoritative copy of each property and maintenance record
* least-privilege professional access

This plan intentionally stops before implementation. It defines the preferred
shape, phases, risks, and decisions required to begin safely.

## Terminology boundary

| Concept | Answers | Example |
| --- | --- | --- |
| Account | Who owns this homeowner workspace and its records? | Homeowner account |
| Plan | Which features and limits are available? | Portfolio plan |
| Organization | Which licensed business is acting? | ABC Home Services |
| Organization membership | What may this person do inside the business? | Technician |
| Property relationship | What may this business do at this property? | Contributor |
| Assignment | Which member is responsible for this related property? | Jeremy assigned to 123 Main St. |

Portfolio remains a plan. Organization is not a new plan and does not replace
Portfolio. An Organization may subscribe to Portfolio.

## Current implementation map

### Account and property ownership

* `properties.accountId` scopes a property to the owning account.
* `properties.userId` remains a legacy owner field used by multiple paths.
* `familyAccounts/{accountId}` holds account metadata and property/device
  counters.
* `accountMemberships/{accountId}_{uid}` is the preferred RBAC membership.
* Legacy fallbacks still infer access from `users.accountId`, owner identity,
  family membership, team-member records, and invitation data.

### Portfolio and teams

* Portfolio is a subscription entitlement, not a separate domain record.
* Team records use `teamMembers` and `teamGroups` scoped by `accountId`.
* Advanced Portfolio assignments use `teamMembers.linkedProperties` arrays.
* Client access resolution combines account memberships, user flags, team-member
  records, email matching, and legacy invite recovery.
* Existing UI roles are broader and older than the proposed Organization Owner,
  Admin, and Technician roles.

### Invitations

* Team invitations are function-managed and can create account memberships.
* Invitation state is split among team members, invitation-code records, user
  flags, and account memberships.
* Revocation already supplies useful server-side patterns, but Organization
  invitations need a single authoritative lifecycle.

### Billing and entitlements

* Subscription truth is primarily attached to the account owner's `users`
  record and synchronized to account data.
* Rules resolve plan limits through the account-owner user document.
* Team members do not own or manage the subscription.
* This works for owner-shaped accounts but does not provide a durable
  business-level billing principal independent of an employee.

### Authorization

* Firestore and Storage primarily authorize by `accountId` membership.
* `canReadAccount` grants broad visibility to records in that account.
* Portfolio property assignment filtering is substantially resolved in client
  code from `linkedProperties`.
* That model cannot safely implement Contributor access because Contributors
  must see only selected categories at explicitly related properties.

## Important findings

1. Existing Portfolio UI and entitlement logic are reusable.
2. Existing account scope cannot double as Organization scope without
   conflating homeowner ownership and business access.
3. Copying homeowner properties into an Organization would create competing
   Property Memory and synchronization problems.
4. `linkedProperties` arrays are suitable as legacy compatibility data, not as
   the long-term source of truth for relationship authorization.
5. Contributor privacy cannot rely on client filtering; record-level server and
   rule enforcement is required.
6. Current billing is tied to a person-shaped account owner and must gain an
   Organization billing principal before employee-owner changes are safe.
7. Existing account and team legacy fallbacks make a flag-day migration risky.

## Options considered

### Option A: Treat an Organization as another family account

This would reuse the most code initially. It is not recommended because account
membership currently implies broad record access and account ownership. It
would blur the distinction between homeowner ownership and professional
contribution.

### Option B: Copy properties into an Organization workspace

This would closely resemble the current Portfolio experience. It is rejected
because it duplicates properties, maintenance records, documents, and derived
intelligence and creates synchronization and ownership conflicts.

### Option C: Organization identity plus property relationships

This is the preferred model. Homeowner properties remain in their owning
account. Organizations have independent membership and billing identity. A
relationship record grants limited access to the one authoritative property.
Shared Portfolio components provide a familiar experience without copied data.

## Proposed domain model

### `organizations/{organizationId}`

Purpose: stable licensed-business identity.

Proposed fields:

* `name`
* `normalizedName`
* `status`: `active`, `suspended`, or `closed`
* `createdByUserId`
* `billingPrincipalId`
* `subscriptionPlanId`
* `agreementVersion`
* `agreementAcceptedAt`
* `createdAt`
* `updatedAt`

The final billing fields depend on the billing-principal design. Subscription
truth must have one authoritative location rather than mirrored writable copies.

### `organizationMemberships/{organizationId}_{userId}`

Purpose: a person's authority inside an Organization.

Proposed fields:

* `organizationId`
* `userId`
* `roles`: initially `owner`, `admin`, or `technician`
* `status`: `invited`, `active`, `disabled`, or `removed`
* `invitedByUserId`
* `joinedAt`
* `disabledAt`
* `createdAt`
* `updatedAt`

Membership does not grant property access by itself.

### `propertyOrganizationRelationships/{propertyId}_{organizationId}`

Purpose: homeowner-controlled authority for one Organization at one property.

Proposed fields:

* `propertyId`
* `propertyAccountId`
* `organizationId`
* `relationshipType`: `managed` or `contributor`
* `status`: `pending`, `active`, `revoked`, or `expired`
* `authoritySource`: homeowner grant, sponsored-property assertion, or claim
* `authorityAssertionId`, when applicable
* `grantedByUserId`
* `grantedAt`
* `revokedByUserId`
* `revokedAt`
* `capabilityPolicyVersion`
* `createdAt`
* `updatedAt`

Do not add arbitrary per-property permission toggles initially. Versioned
Managed and Contributor policies are easier to explain, test, and support.

### `organizationPropertyAssignments/{organizationId}_{propertyId}_{userId}`

Purpose: internal assignment of an active Organization member to a related
property.

Proposed fields:

* `organizationId`
* `propertyId`
* `userId`
* `status`: `active` or `removed`
* `assignedByUserId`
* `assignedAt`
* `removedAt`

Assignments may only reference an active Organization relationship and active
membership. They do not grant access when either parent authority is inactive.

### `organizationInvitations/{invitationId}`

Purpose: function-managed Organization membership invitation.

Required behavior:

* normalized recipient identity
* intended Organization and role
* versioned terms when required
* expiry, revocation, and single-use enforcement
* server-authoritative acceptance
* no property access until membership and assignment checks pass

### `contributorAccessEvents/{eventId}`

Purpose: append-oriented homeowner-visible audit history.

Proposed fields:

* `propertyId`
* `propertyAccountId`
* `organizationId`
* `actorUserId`
* `action`
* `targetType`
* `targetId`
* `occurredAt`
* minimal immutable actor and Organization display snapshots
* `metadataVersion`

Sensitive before/after record values belong in restricted correction or support
records, not in the homeowner-facing access event.

## Effective authorization model

An Organization user may perform a property action only when all required
conditions are true:

```text
authenticated user
  AND active Organization membership
  AND role permits the action
  AND active property-Organization relationship
  AND relationship type permits the action
  AND active assignment when required
  AND Organization subscription permits the feature
```

Property ownership remains a separate homeowner-account path. Organization
authorization must not be implemented by adding the business to the homeowner's
`accountMemberships`, because that would grant broader account visibility.

## Capability boundary

### Contributor baseline

Allow only the property identity, basic equipment context, authorized visit and
Maintenance Event creation, permitted service attachments, and correction of
the Organization's own submissions through an audited workflow.

Deny costs, financials, personal notes, private documents and photos, household
members, tenant profiles, unrelated records, account administration, billing,
and ownership controls.

### Managed baseline

Managed may reuse more existing Portfolio workflows, but it still requires an
explicit relationship and never conveys ownership. Its exact record matrix must
be approved before rules are implemented.

## Portfolio reuse plan

Reuse presentation and domain capabilities where they are genuinely shared:

* property list, search, filters, and responsive layout
* team list and invitation presentation
* role labels and assignment controls after domain adaptation
* subscription entitlement helpers
* reporting components that consume authorized data

Do not reuse assumptions that `activeAccountId` is the property owner, that an
account member can read all account records, or that `linkedProperties` client
filtering is authorization.

The application needs an explicit workspace context:

```text
Homeowner workspace: accountId
Organization workspace: organizationId
```

Switching workspace must clear account-scoped client state and reload through a
central access resolver. Queries should never infer Organization context from
the first accessible account.

## Phased plan of attack

### Phase 1: Approve model and permission matrix

1. Accept ADR 0026 and ADR 0027.
2. Approve the proposed collections and lifecycle states.
3. Define the Managed and Contributor record/action matrix.
4. Decide billing-principal ownership and Organization plan eligibility.
5. Define workspace switching and navigation behavior.

Deliverable: approved schemas, permission matrix, query list, and lifecycle
diagrams. No production writes.

### Phase 2: Shared foundations behind flags

1. Add Organization types and server-side repositories.
2. Add Organization membership and invitation callables.
3. Add explicit workspace context without changing current Portfolio defaults.
4. Extract reusable Portfolio UI pieces where needed.
5. Add indexes, emulator fixtures, and disabled-by-default feature flags.

Deliverable: Organization/member administration in test environments with no
property access.

### Phase 3: Property relationships and authorization

1. Add relationship and assignment records.
2. Implement a central effective-permission resolver.
3. Add Firestore and Storage rules for the approved data matrix.
4. Add immediate, server-authoritative revocation.
5. Test cross-Organization isolation and stale-token behavior.

Deliverable: a test Organization can access only explicitly related properties
and approved record categories.

### Phase 4: Contributor workflow and attribution

1. Implement Search property -> Record visit -> Update Property Memory -> Done.
2. Complete submitting-Organization and source attribution.
3. Populate trusted recorder identity server-side.
4. Add audited corrections and Contributor Access History.
5. Verify homeowner attribution language and revocation controls.

Deliverable: one end-to-end Contributor workflow with complete provenance.

### Phase 5: Sponsored properties and claims

1. Add versioned authority assertions.
2. Add minimized pre-claim property creation.
3. Add server-authoritative homeowner claim.
4. Let homeowners review and remove Organization access.
5. Test disputes, expiry, retries, and competing claims.

Deliverable: auditable sponsored-property onboarding without business ownership.

### Phase 6: Compatibility rollout

1. Pilot with internal/test Organizations.
2. Attach Organization identities to selected existing business accounts without
   changing their Portfolio plan.
3. Translate legacy team assignments through a controlled compatibility adapter.
4. Compare legacy and new authorization results in shadow mode.
5. Migrate only after discrepancies are resolved and rollback is proven.

Deliverable: staged production adoption with existing Portfolio subscribers
unchanged unless explicitly enrolled.

## Test strategy

Required tests include:

* Organization A cannot discover Organization B or its members.
* Membership alone grants no property access.
* Relationship alone grants no access to a non-member.
* Unassigned technicians cannot access assignment-required properties.
* Contributor access excludes every private record and Storage category.
* Revocation blocks reads and writes immediately.
* Billing changes do not change property ownership.
* Plan downgrade behavior is deterministic and does not expose data.
* Attribution survives employee removal and Organization termination.
* Audit history remains visible to the homeowner after revocation.
* Current Portfolio accounts retain existing behavior outside the feature flag.

Use Firestore and Storage Emulator tests as release gates. UI tests supplement
but do not replace authorization tests.

## Migration and rollback rules

* Additive collections first; no destructive account migration in early phases.
* Dual-read only through one documented compatibility adapter.
* Avoid dual-write unless reconciliation and ownership are explicit.
* Preserve existing `accountId` on homeowner properties.
* Do not backfill Organization relationships from `linkedProperties` without an
  approved mapping and authority basis.
* Feature flags must disable new Organization paths independently.
* Rollback removes new access evaluation without deleting source records.

## Primary risks

| Risk | Mitigation |
| --- | --- |
| Account membership accidentally grants Contributor access | Keep Organization membership out of homeowner `accountMemberships` |
| Client filters expose private data | Enforce category access in rules and server operations |
| Portfolio and Organization implementations drift | Share components and services behind explicit domain interfaces |
| Subscription tied to a departed employee | Introduce stable business billing principal |
| Legacy fallbacks bypass revocation | Centralize authorization and test every fallback |
| Relationship arrays become inconsistent | Use first-class relationship and assignment records |
| Audit logs leak sensitive values | Store minimal event metadata and restrict correction details |

## Open decisions before implementation

1. Can Organizations subscribe only to Portfolio, or will another business
   license SKU exist while still using Portfolio capabilities?
2. Should the billing principal be a new `billingAccounts` record or a field on
   Organization with one designated billing owner?
3. What additional data may a Managed relationship access beyond Contributor?
4. Are technicians always assignment-scoped, while owners/admins may see every
   actively related property?
5. Who may initiate a relationship: homeowner only, or business request followed
   by homeowner approval?
6. What Organization information is homeowner-visible?
7. Which existing Portfolio customers should be eligible for optional migration
   into an Organization identity?

## Recommended first implementation slice

After the open decisions are approved, build only:

1. `organizations`
2. `organizationMemberships`
3. Organization Owner/Admin/Technician administration
4. explicit workspace context
5. cross-Organization isolation tests

Do not grant Organization property access in that first slice. Property
relationships should arrive as the next separately testable authorization
boundary.
