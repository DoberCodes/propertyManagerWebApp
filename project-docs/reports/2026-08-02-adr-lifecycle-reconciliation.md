# ADR Lifecycle Reconciliation

Date: 2026-08-02

## Purpose

This report records the evidence used to reconcile Maintley's Architecture
Decision Record lifecycle metadata and active roadmap after the connected
property knowledge and Firebase Hosting work.

ADRs preserve decisions and historical reasoning. Current behavior remains
owned by `project-docs/docs/` and the implementation.

## Method

The review compared:

* all 37 ADR files
* each ADR's stated status and implementation checklist
* current Product, Architecture, Intelligence, and Operations documentation
* implementation boundaries for account access, Property Documents,
  Maintenance Events, entitlements, Property Knowledge Acquisition, PWA
  support, Firebase Hosting, Spaces, Supplies, and Property Review
* the ADR implementation tracker dry-run

Statuses were not promoted merely because related code exists. Accepted ADRs
remain phased or initial where their stated boundaries, migration evidence, or
follow-through are incomplete.

## Reconciled Portfolio

| Lifecycle | Count | ADRs |
| --- | ---: | --- |
| Implemented | 16 | 0001, 0003-0005, 0010, 0013, 0016-0017, 0019, 0025, 0030-0031, 0033-0036 |
| Superseded | 2 | 0002, 0029 |
| Accepted - initial implementation | 10 | 0006-0009, 0011, 0014-0015, 0018, 0020-0021 |
| Accepted - phased implementation | 6 | 0012, 0022-0024, 0028, 0032 |
| Proposed | 3 | 0026-0027, 0037 |

## Metadata Corrections

ADRs 0009-0012, 0014-0016, and 0018 used inconsistent titles or multiline
status headings. Their titles and status lines now use the standard form:

```text
# ADR NNNN: Title

Status: Lifecycle
```

These formatting changes do not alter their decisions.

ADR 0012 now uses `Accepted - phased implementation`. Its part and supply
extraction taxonomy remains active, while ADR 0036 supersedes the earlier idea
that accepted supplies are owned beneath Equipment. Its implementation
checklist records the implemented HVAC catalog, review, provenance, and
Property-owned Supply path; expansion to other domains remains evidence-led.

## Status Findings

### Intelligence and acquisition foundations

ADRs 0006-0009, 0011, 0014-0015, and 0018 remain at initial implementation.
Their architectural foundations exist, but each decision intentionally leaves
additional consumers, knowledge sources, extraction coverage, processing
adapters, or event channels for later work.

ADR 0010 remains Implemented because Intelligence History has its own immutable
scan snapshots and separate Insights history experience.

ADR 0016 remains Implemented because install metadata, the service worker,
offline fallback, install guidance, and notification delivery foundation exist.
More advanced offline behavior remains a future consideration rather than an
unfinished requirement of the accepted decision.

### Active compatibility and migration work

ADR 0022 remains phased. Active consumers now cross the shared account-access
boundary, but the `membershipRoles` decision and legacy account-link fallback
retirement remain open.

ADR 0023 remains phased. First-class Property Documents and relationships are
implemented, but embedded records require inventory, backfill, parity evidence,
and eventual compatibility retirement.

ADR 0024 remains phased. Canonical Maintenance Event writes and shared readers
are established, but production inventory and a controlled legacy backfill have
not been approved or completed.

ADR 0032 remains phased. The shared entitlement resolver and operational grant
flows exist, but deployed-client parity, any approved synthetic Stripe access
migration, and compatibility retirement still require evidence.

### Firebase Hosting

ADR 0028 remains phased. Firebase development and production environments,
preview deployments, release-gated production hosting, custom-domain TLS, clean
web routes, and canonical backend links are complete.

Remaining evidence is intentionally narrower:

* production authentication, Stripe return, email-link, deep-link, PWA, and
  rollback validation
* signed Android clean-route validation and removal of its temporary
  `HashRouter` profile
* GitHub Pages guard retirement after the observation period and completion of
  the repository privacy decision

### Proposed architecture

ADRs 0026 and 0027 remain Proposed. Organization accounts, property transfer,
professional contribution, and complete actor-versus-recorder attribution must
not be described as shipped behavior.

ADR 0037 remains Proposed. Structured Work Sessions are intentionally deferred
and do not alter the current Task completion workflow.

## Roadmap Reconciliation

`project-docs/docs/Product/ROADMAP_STATUS.md` now reflects:

* current compatibility-boundary and migration-evidence work
* Firebase Hosting closure rather than initial migration
* centralized entitlement rollout validation
* completed Property Review, connected Spaces and Supplies, document
  relationships, Homeowner+ access, and Personal Assistant read API foundations
* deferred Work Sessions and professional contribution architecture

The stale June references to Property Audit as active implementation, deployed
rules as an unverified roadmap task, and Unit/Suite UI containment as ongoing
feature cleanup were removed or replaced with the current documented
boundaries.

## Result

The ADR portfolio now has one parseable title and status format for every
record. Accepted work remains visible to the implementation tracker, completed
decisions remain closed, proposed behavior is not represented as production,
and the roadmap reflects the current platform without introducing new product
behavior.
