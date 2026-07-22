# Business Licensing Readiness and Implementation Plan

Date: 2026-07-21

Status: Planning report, revised after ADR 0026 and ADR 0027

Related decisions:

* `project-docs/ADR/0026-property-ownership-and-professional-contribution-model.md`
* `project-docs/ADR/0027-business-licensing-property-stewardship-and-record-attribution.md`

Organization architecture plan:

* `project-docs/reports/2026-07-21-organization-architecture-plan.md`

## Purpose

This report tracks the work required for licensed businesses to contribute to
homeowner Property Memory without making Maintley a maintenance-service partner
or treating the business as the property owner.

It is a point-in-time implementation plan. Active documentation must continue to
describe current behavior until each proposed capability is implemented.

## Confirmed product boundaries

* Maintley remains homeowner-first.
* The homeowner owns the property and Property Memory.
* Businesses are software customers and licensees, not Maintley partners.
* Businesses contribute attributed information and do not own Property Memory.
* Portfolio remains an offered subscription plan.
* Organization is the business-account container, not a replacement plan.
* Organization may reuse Portfolio capabilities, but must not duplicate
  authoritative records or create a permanently forked implementation.
* Organizations manage people; properties manage external relationships.
* Professional access requires both Organization authority and an active
  property relationship.
* Maintley records attributed submissions and does not certify the underlying
  work.
* Near-term property transitions use a reviewed Property Transition Report, not
  live account ownership transfer.
* Maintley is not expanding into CRM, dispatch, scheduling, estimating,
  invoicing, payroll, or general field-service management.

## Current readiness

Maintley already has reusable authentication, account permissions, property
access, Portfolio plan capabilities, teams, roles, property assignments,
invitations, billing, Maintenance Event provenance fields, and security-rule
tests.

Maintley does not yet have first-class Organization records, Managed and
Contributor property relationships, two-layer Organization/property
authorization, complete contributor revocation, authority assertions, sponsored
property claims, complete business attribution, Contributor Access History, or
a Property Transition Report.

On 2026-07-21, the Firestore and Storage Emulator permission tests and Cloud
Functions TypeScript build passed for the existing account model.

## Completed prerequisite: tenant-data reduction

The tenant-data reduction migration ran after confirmation that no real tenant
accounts existed. It deleted 16 legacy `tenantProfiles`. A verification dry run
found zero remaining profiles and zero retired sensitive-field occurrences
across the audited tenant sources. Logs contain aggregate counts and field names
only.

Further tenant UI hardening is intentionally deferred. Tenant scope remains
limited primarily to submitting maintenance requests, with minimal self and
lease-end information if retained.

## Phase 0: Decision and language alignment

* [x] Revise ADR 0026 around homeowner ownership and Property Transition Reports.
* [x] Revise ADR 0027 around licensing, Organizations, property relationships,
  and attribution.
* [x] Confirm that Portfolio remains an offered subscription plan.
* [ ] Accept ADR 0026 and ADR 0027 after stakeholder review.
* [ ] Define canonical terms for Organization, Managed, Contributor, sponsored
  property, Property Memory, claim, and Property Transition Report.
* [ ] Audit product language for partnership, certification, verification, and
  direct ownership-transfer claims.
* [ ] Replace legal placeholders after counsel review.

## Phase 1: Organization foundation and compatibility design

* [ ] Inventory existing Portfolio, account, team, role, assignment, invitation,
  filter, and billing records and services.
* [ ] Define the Organization schema and stable identifiers.
* [ ] Define the relationship between an Organization, its billing account, and
  its subscription plan.
* [ ] Specify which Portfolio capabilities become shared modules.
* [ ] Prevent duplicated Firestore sources of truth and permanent code forks.
* [ ] Define backward compatibility for current Portfolio subscribers.
* [ ] Define migration, rollback, and staged deployment sequencing.

## Phase 2: Organization membership and internal roles

* [ ] Implement Organization creation and settings.
* [ ] Implement Owner, Admin, and Technician membership roles.
* [ ] Add employee invitations, revocation, offboarding, and assignment controls.
* [ ] Associate subscription limits with the billing principal independently
  from property ownership.
* [ ] Record versioned business agreement acceptance.
* [ ] Add cross-Organization isolation tests.
* [ ] Define failed-payment and termination behavior.

## Phase 3: Property relationships and authorization

* [ ] Define Managed and Contributor relationship schemas and lifecycle states.
* [ ] Implement homeowner add, remove, and reinstate controls.
* [ ] Enforce immediate revocation with no archived or read-only access path.
* [ ] Resolve effective access from Organization role, active property
  relationship, and assignment when required.
* [ ] Enforce the same model in application services, Firestore rules, Storage
  rules, and trusted server operations.
* [ ] Classify every Firestore record and Storage path visible to Contributors.
* [ ] Add least-privilege and cross-Organization emulator tests.

## Phase 4: Maintenance attribution and corrections

* [ ] Audit every Maintenance Event creation and edit path against the existing
  `recordedBy` and `performedBy` schema.
* [ ] Finalize submitting Organization and event-source fields.
* [ ] Keep service date distinct from recorded and modified timestamps.
* [ ] Populate authenticated recorder identity server-side where trust requires.
* [ ] Preserve minimal immutable attribution snapshots.
* [ ] Display attribution consistently in history, timelines, reports, and
  exports.
* [ ] Use attributed language such as "Recorded by" or "Reported by."
* [ ] Adapt legacy records without inventing unknown performers.
* [ ] Define auditable correction behavior that preserves material prior values.
* [ ] Test attribution through employee, Organization, relationship,
  subscription, and claim changes.

## Phase 5: Contributor Access History

* [ ] Define append-oriented access-history events.
* [ ] Record Organization, authenticated actor, action, timestamp, and affected
  record or category.
* [ ] Cover relationship changes, record changes, document actions, claims, and
  permission-sensitive administration.
* [ ] Prevent contributors from altering their audit history.
* [ ] Add a homeowner-visible Contributor Access History view.
* [ ] Confirm audit visibility survives revocation while property access does not.
* [ ] Define retention and support access for audit events.

## Phase 6: Sponsored properties and homeowner claim

* [ ] Require a versioned authority assertion before an Organization creates a
  sponsored property.
* [ ] Record actor, Organization, property, assertion version, and server time.
* [ ] Minimize homeowner information before claim.
* [ ] Add claim invitation expiry, revocation, single-use, and recipient checks.
* [ ] Present claim consequences and continuing Organization access.
* [ ] Record versioned homeowner terms and privacy acceptance.
* [ ] Implement an atomic, idempotent, server-authoritative claim.
* [ ] Let the homeowner review and remove Organization access.
* [ ] Handle mistaken, competing, expired, and disputed claims.

## Phase 7: Privacy, retention, corrections, and disputes

* [ ] Define retention and deletion for every data class and Storage path.
* [ ] Replace legacy account deletion with an idempotent, resumable workflow.
* [ ] Implement complete privacy export separately from product reports.
* [ ] Define Organization termination data return and deletion.
* [ ] Define legal-hold and required-retention exceptions.
* [ ] Add homeowner dispute and business response workflows.
* [ ] Preserve original attribution and material values through corrections.
* [ ] Define display rules and support escalation for disputed records.

## Phase 8: Property Transition Report

* [ ] Classify transition-eligible operational fields and excluded personal data.
* [ ] Define a versioned report schema and provenance metadata.
* [ ] Exclude personal notes, costs, receipts, personal photos and documents,
  household members, and user names by default.
* [ ] Let the homeowner review the report before printing or sharing.
* [ ] Add tests proving excluded records and files never enter the report.
* [ ] Define secure sharing expiry and revocation if digital sharing is offered.
* [ ] Defer import until provenance, deduplication, conflicts, and recipient
  consent have a separately approved design.
* [ ] Do not implement live ownership transfer without a new or superseding ADR.

## Phase 9: Legal, security, and operational launch readiness

* [ ] Approve Business Subscription Terms, Homeowner Terms, Privacy Policy, Data
  Processing and Security documentation, and Property Transition policy.
* [ ] Maintain a subprocessor inventory and change process.
* [ ] Establish incident response, breach assessment, security contacts, and
  notification paths.
* [ ] Evaluate mandatory MFA and Firebase App Check.
* [ ] Define backup, restore, recovery, and restoration testing.
* [ ] Establish access reviews and production permission verification.
* [ ] Define vulnerability remediation and audit-log retention.

## Business licensing launch gates

Do not launch business-created homeowner properties until:

* [ ] ADR 0026 and ADR 0027 are accepted.
* [ ] Business Subscription Terms and required privacy/security documents are
  approved.
* [ ] Organization membership and property relationships are server-enforced.
* [ ] Contributor access is least-privilege and immediately revocable.
* [ ] Authority assertions and homeowner claims are auditable.
* [ ] Maintenance attribution and Contributor Access History are complete.
* [ ] Privacy operations match published policy.
* [ ] Permission tests cover Organizations, relationships, claims, and
  cross-Organization isolation.

## Property Transition Report launch gates

Do not launch the report until:

* [ ] Every included record type and Storage path has an approved transition
  classification.
* [ ] The homeowner can review the exact report before sharing.
* [ ] Excluded information remains absent in automated tests.
* [ ] Generated reports have explicit retention and secure-sharing behavior.
* [ ] The report is clearly described as a snapshot, not a transfer of the live
  account or a Maintley certification.

## Immediate next implementation task

Audit the current Portfolio, account, team, assignment, invitation, billing, and
permission implementation. Produce a field-and-service mapping that identifies:

1. capabilities that can be shared unchanged by Organizations
2. records that require an Organization identifier
3. authorization paths that need the property-relationship check
4. compatibility behavior required for current Portfolio subscribers
5. proposed migrations, tests, rollout sequence, and rollback points

The completed architecture mapping and proposed implementation sequence are in
`project-docs/reports/2026-07-21-organization-architecture-plan.md`.

The next action is stakeholder review of its open decisions and proposed
permission boundary. Do not create a copied production data model during this
review. A similar Organization experience is appropriate; duplicate
authoritative state is not.

## Documentation updates during implementation

As behavior changes, update Product Direction, Features, Plan Feature Matrix,
Data Model, Technical Architecture, Firebase Structure, Permissions, Files and
Storage, Maintenance Event Schema, Billing, Testing, and public legal documents.

Do not describe proposed behavior in active documentation before it becomes
current implementation.
