Good screenshot targets for the support articles: add to /assets/images/article_screenshots/file-name.png

Support Center overview: updates, FAQ, known issues, article list.
A full article page, especially “Review document suggestions before applying them”.
Properties page with property groups visible.
Property detail page showing tabs or linked records.
Appliance/system profile with details, files, tasks, or service history.
Tasks list showing property context on similar recurring tasks.
Task completion or Maintenance History entry with notes/files/cost.
Document review screen with Review Summary, warnings, and property mismatch confirmation.
Maintley Intelligence dashboard card with property context.
Contractor profile showing website/customer portal fields.
Team or dashboard focus view showing personal vs visible-property focus.

---

# Current-Model Core Remediation

These items affect Maintley's current homeowner, property manager, tenant,
team, and maintenance-history workflows. They do not depend on implementing
business organizations, homeowner claims, or ownership transfers.

## 1. Reduce Tenants to Maintenance Participation

Target tenant experience:

* View basic information about themselves and their property relationship.
* View a lease end date when the property manager chooses to provide it.
* Submit and review their own maintenance requests.

Maintley is not a rental application, tenant screening, lease-management,
payment, or accounting platform.

* [x] Remove rental-application and screening fields from the tenant UI and
  active types: date of birth, Social Security number, driver's-license data,
  income, credit score, bankruptcy and eviction details, employment history,
  rental history, references, screening status, vehicles, smoking status,
  service-animal details, and screening documents.
* [x] Remove the unsupported statement that Social Security numbers are
  encrypted in production.
* [x] Remove the current full Tenant Profile experience and replace it with a
  minimal tenant account/property view.
* [x] Define the minimal tenant relationship fields: identity link, property,
  display name, email, optional phone, optional lease end date, status, and
  timestamps.
* [x] Keep Maintenance Requests as separate property-scoped records rather than
  embedding request history in the tenant profile.
* [ ] Choose one canonical tenant relationship source and remove the current
  duplication between embedded `property.tenants`, `tenantProfiles`, and legacy
  unit occupants through a documented migration.
* [ ] Ensure a tenant can read only their own tenant relationship and requests.
* [x] Ensure property managers can view only the basic tenant information needed
  for maintenance communication.
* [x] Audit production for sensitive tenant fields before migration or deletion.
* [x] Add a dry-run migration that reports sensitive fields and duplicate tenant
  relationships without exposing their values in logs.
* [x] Add an apply migration that removes retired sensitive fields only after
  the audit is reviewed.
* [ ] Update Data Model, Firebase Structure, Permissions, Features, plan
  language, Privacy Policy, and testing documentation.
* [ ] Add tests for tenant isolation, property scoping, invitation redemption,
  request submission, and retired-field write rejection.

## 2. Maintenance Event Attribution and Audit Trail

* [x] Define server-authoritative `recordedBy` attribution using the
  authenticated user ID, a minimal display snapshot, and recorded timestamp.
* [x] Define optional `performedBy` attribution for a user, contractor, external
  provider, homeowner, or unknown performer.
* [x] Keep service date separate from the time the record was entered.
* [x] Preserve `eventSource` and source task/document relationships.
* [x] Apply attribution consistently to manual entry, task completion, document
  acquisition, contractor entry, imports, and corrections.
* [x] Add an append-only, server-written Maintenance Event revision trail for
  created, updated, corrected, and deleted events.
* [x] Record actor, changed fields, timestamp, and optional correction reason.
* [x] Define which sensitive previous values may be retained in revisions and
  which should be represented only as changed-field metadata.
* [x] Prevent clients from creating, changing, or deleting revision records.
* [x] Update Maintenance History, timeline, detail, and report surfaces to show
  clear attribution.
* [ ] Backfill only facts that can be established; do not guess unknown
  performers.
* [x] Update the Maintenance Event schema, Data Model, Permissions, and tests.

## 3. Legal and Product Accuracy

* [ ] Replace governing-law and venue placeholders after legal review.
* [ ] Reconcile legal language about recommendations with Maintley Intelligence.
* [ ] Reconcile permanent-deletion promises with implemented deletion, backup,
  audit, and Storage behavior.
* [ ] Clarify control of records in shared accounts.
* [ ] Explain document extraction and reviewable knowledge suggestions.
* [ ] Keep all maintenance records framed as user-submitted or system-derived,
  not Maintley-certified proof of real-world work.

## 4. Account and Property Deletion

* [ ] Replace the legacy single-batch account deletion function with an
  idempotent, resumable job.
* [ ] Resolve ownership through the current account model rather than legacy
  `property.userId` alone.
* [ ] Reuse the chunked property cascade where appropriate.
* [ ] Cover all current Firestore collections, Storage objects, memberships,
  invitations, derived records, and authentication state.
* [ ] Produce an internal deletion manifest and record explicit retention
  exceptions.
* [ ] Review whether subscription state should delay deletion or be handled as a
  separate billing cancellation step.
* [ ] Add partial-failure, retry, large-account, and Storage cleanup tests.

## 5. Retention and Privacy Export

* [ ] Create a retention matrix for invitations, notifications, push tokens,
  support records, tenant relationships, audit records, document-processing
  artifacts, admin sessions, and intelligence snapshots.
* [ ] Add cleanup jobs for approved retention periods.
* [ ] Distinguish property reports from a complete account privacy export.
* [ ] Implement an authenticated privacy export covering profile, memberships,
  invitations, property records, files, notifications, legal acceptances, and
  other applicable personal data.
* [ ] Document backup persistence, legal holds, and deletion exceptions.

## 6. Authorization and Security Operations

* [ ] Inventory and backfill remaining legacy `userId` ownership records to the
  current account model.
* [ ] Remove legacy authorization paths only after migration verification and
  emulator coverage.
* [ ] Keep UI capability checks aligned with Firestore, Storage, and Cloud
  Function enforcement.
* [ ] Document incident response, breach assessment, security contacts,
  subprocessors, backup restoration, access reviews, vulnerability handling,
  and audit-log retention.
* [ ] Review MFA expectations for Maintley administrators.
* [ ] Evaluate Firebase App Check and callable-function abuse controls.

## Completion Order

1. Tenant data reduction and production-data audit.
2. Maintenance Event attribution.
3. Maintenance Event revision trail.
4. Legal-document corrections.
5. Account deletion repair.
6. Retention and privacy export.
7. Authorization and security hardening.

## Completion Gate

* [ ] Current behavior and active documentation agree.
* [x] No retired sensitive tenant-profile fields can be written through the
  application or Firestore client rules.
* [ ] Maintenance Events identify who recorded them and preserve material
  changes.
* [ ] Account deletion completes across Firestore, Storage, and Authentication.
* [ ] Permission and Storage emulator tests pass.
* [ ] Cloud Functions and application builds pass.
