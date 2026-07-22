# ADR 0027: Organization Licensing, Property Relationships, and Attributed Contribution

Status: Proposed (Revised)

Date: 2026-07-21

Related ADR: `0026-property-ownership-and-professional-contribution-model.md`

Related report: `project-docs/reports/2026-07-21-business-licensing-readiness-and-implementation-plan.md`

## Context

Maintley may license software to maintenance companies and other property
professionals. They are business customers and licensees, not Maintley partners.
Maintley supplies the software; each company remains responsible for its
services, customer relationship, legal authority, and submitted information.

The existing Portfolio plan and its team, role, invitation, assignment, and
billing capabilities provide much of the foundation. Portfolio remains an
offered subscription plan. Organization is a separate business-account concept,
while a property relationship defines what that Organization may do at a
specific property.

Role-only authorization is insufficient. Organization authority does not imply
access to all homeowner data. Maintenance history also needs to distinguish the
user and Organization that recorded information from the reported performer.

## Decision

### 1. Organization is the business account; Portfolio remains a plan

Portfolio remains an offered subscription plan for coordinating maintenance
across properties, teams, and stakeholders. It is not renamed, removed, or
converted into Organization.

Organization is the business-account container used by licensed companies. Its
initial experience may intentionally resemble or reuse Portfolio capabilities,
including teams, roles, assignments, invitations, filters, and billing limits.
That reuse must occur through shared services and components rather than copied
Firestore records or permanently forked implementations.

An Organization may subscribe to the Portfolio plan when that plan supplies the
appropriate capabilities. The plan answers which features and limits are
available; the Organization answers which business, people, and property
relationships are acting. A Portfolio subscription does not automatically
create a professional relationship with any homeowner property.

An Organization manages its people, roles, assignments, subscription,
licensed-property limits, and settings. Membership alone does not authorize
access to a homeowner's property.

### 2. The relationship is software licensing

Maintley is responsible for its software: reasonable security, permission
enforcement, service operation, protection of customer information, and
homeowner control of Property Memory.

The business customer is solely responsible for:

* its maintenance services
* the accuracy and legality of submitted information
* customer permission to create or manage property records
* applicable laws and its customer relationship
* its employees, subcontractors, and account usage

Maintley displays attributed submissions. It does not warrant that submitted
work occurred, was correct, or is accurate.

### 3. Organization roles govern internal authority

Initial roles are:

* **Owner** - organization control, billing, settings, membership, and assignments
* **Admin** - routine membership and assignment administration, excluding
  protected owner and billing operations
* **Technician** - assigned-property contribution workflows only

These roles govern internal Organization authority, not property ownership.

### 4. Properties define organization relationships

A property may have these initial Organization relationships:

* **Managed** - broad operational management comparable to the current
  Portfolio/property-management model
* **Contributor** - limited service-business access to record visits and update
  Property Memory

The homeowner can add, remove, or reinstate a relationship. Removal revokes
access immediately and leaves no archived or read-only access route. Historical
relationship facts may remain for audit, but never authorize access.

The guiding rule is:

> Organizations manage people. Properties manage relationships.

### 5. Effective permission requires both layers

Every Organization-originated property action must satisfy:

```text
effective permission
  = organization role capability
  AND active property relationship capability
  AND assignment when required
```

The checks must be enforced in application services, Firestore rules, Storage
rules, and trusted server operations. Client visibility is not authorization.

### 6. Contributor access is narrow

A Contributor may access the basic property and equipment information needed to
find the property, record a visit, update an authorized maintenance record, and
attach permitted service documentation.

A Contributor cannot by default access homeowner costs, financial records,
receipts, personal notes, personal documents or photos, household members,
tenant profiles, unrelated records, billing, ownership, or homeowner account
controls. Managed access may be broader but remains explicitly authorized and
does not imply ownership.

### 7. Sponsored properties require asserted authority

An Organization may create a sponsored or pre-claim property only after an
authorized user affirms that the homeowner permitted digital recordkeeping. The
assertion must be auditable and does not give the Organization ownership.

Claiming must give the homeowner direct control and a clear way to review and
remove Organization access.

### 8. Keep the professional workflow small

```text
Search property -> Record visit -> Update Property Memory -> Done
```

Maintley is not a CRM, dispatch, scheduling, estimating, payroll, invoicing, or
general field-service-management system. Expansion outside property maintenance
and documentation requires separate review.

### 9. Maintenance contributions require attribution

Every professional maintenance contribution must preserve:

* submitting Organization, when applicable
* authenticated user who recorded it
* reported performer or service provider, when known
* service date
* created and last-modified timestamps
* source such as homeowner, Organization, import, or system
* an audit trail for material corrections

`recordedBy` and `performedBy` are distinct. The interface should say, for
example:

```text
Performed by: ABC Home Services
Recorded by: Jeremy Smith for ABC Home Services
Service date: March 8, 2027
```

Records are attributed, not certified by Maintley.

### 10. Contributor Access History is homeowner-visible

Maintley will retain an append-oriented audit history of material Organization
actions. The homeowner view identifies the Organization, acting user, action,
timestamp, and affected record or category when appropriate.

At minimum, history covers relationship changes, record creation and material
edits, document actions, claims, and permission-sensitive administration. A
contributor cannot alter its audit trail. History supports accountability but
does not preserve access after revocation.

### 11. Billing is independent

Paying for licensed properties, users, or sponsored access does not confer
ownership. Cancellation, failed payment, and relationship termination need
explicit access and retention behavior and cannot silently transfer ownership.

### 12. Property transitions follow ADR 0026

Near-term ownership changes use the homeowner-controlled Property Transition
Report. An Organization cannot transfer a live homeowner account or complete
Property Memory to another owner.

## Contract and policy requirements

The model requires separate Business Subscription Terms, Homeowner Terms,
Privacy Policy, Data Processing and Security documentation, and Property
Transition and dispute policies. Business terms must cover licensing limits,
acceptable use, consent representations, submitted-content responsibility,
payment, termination, and liability allocation. Legal counsel must review final
documents before launch.

## Required implementation behavior

Implementation must:

1. Preserve Portfolio as a subscription plan and add Organization as the
   business-account container.
2. Reuse Portfolio capabilities without duplicating authoritative records or
   maintaining permanently forked implementations.
3. Separate Organization roles from property relationships.
4. Enforce role, relationship, and assignment at every authorization layer.
5. Make contributor revocation immediate.
6. Minimize Contributor data access.
7. Audit authority assertions for sponsored properties.
8. Add maintenance attribution and correction history.
9. Provide homeowner-visible Contributor Access History.
10. Keep billing independent from ownership and permission.
11. Use attributed, non-certifying product language.

## Consequences

This preserves a clear homeowner-first licensing model, reuses existing
foundations, makes permissions explainable, and improves maintenance provenance.
It also introduces a permission matrix, requires a careful Organization
introduction that shares Portfolio capabilities without conflating the two, and
needs legacy attribution and lifecycle handling.

## Decision principles

* Organizations manage people. Properties manage relationships.
* Businesses are licensees and contributors, not owners or Maintley partners.
* Property access requires both organizational and property authority.
* Contributors see only what the authorized workflow requires.
* Submitted records are attributed, not certified.
* Auditability survives revocation; access does not.
* Maintley preserves operational property memory, not a parallel CRM.
