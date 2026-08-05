# Production Compatibility Inventory

Date: 2026-08-03

Firebase project: `mypropertymanager-cda42`

Mode: Report only

## Purpose

This inventory measures the remaining compatibility boundaries before any
adapter retirement or production backfill. It does not contain record contents,
does not provide an apply mode, and performed no Firebase writes.

## Results

### Documents

* Properties scanned: 29
* Properties with embedded Documents: 9
* Embedded Documents: 21
* Collection-backed Documents: 3
* Collection Documents with an unknown Property: 0

### Maintenance History

* Legacy collection records: 4
* Canonical Maintenance Events: 284
* Embedded Property history records: 0
* Embedded Equipment history records: 1

### Account links

* Users with legacy account links: 18
* Account memberships: 19
* Legacy-linked users without a matching membership: 1
* Memberships without a user profile: 1

### Embedded Supplies

* Equipment records scanned: 145
* Equipment with embedded Supply data: 17
* Embedded Supply items: 19
* Canonical Property Supplies: 0
* Equipment with canonical Supply links: 0
* Embedded Equipment records without canonical Supply links: 17

## Decision

Compatibility readers must remain active. In particular, embedded Document and
Supply data cannot be retired because production does not yet have canonical
parity. The Maintenance History adapter must continue to merge its remaining
legacy sources. Legacy account-link fallback must remain until the two parity
gaps are reviewed and resolved.

No migration or cleanup was run from this evidence. Any future backfill must be
dry-run-first, repeat-safe, preserve provenance, and include unresolved-record
reporting and rollback evidence before compatibility adapters are removed.

## Reproduction

```bash
yarn inventory:compatibility \
  --confirm-project=mypropertymanager-cda42 \
  --report=tmp/compatibility-inventory-production.json
```
