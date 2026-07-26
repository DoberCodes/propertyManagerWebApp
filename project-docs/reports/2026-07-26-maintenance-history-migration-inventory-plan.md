# Maintenance History Migration Inventory and Implementation Plan

Date: 2026-07-26
Status: Phase 1 report-only tooling implemented and production inventory executed; no writes performed
Related decisions:

* `project-docs/ADR/0007-maintenance-events-as-historical-source-of-truth.md`
* `project-docs/ADR/0024-maintenance-event-migration-completion.md`

## Objective

Complete the transition to `maintenanceEvents` as the only active historical
record behind the user-facing Maintenance History experience without losing,
duplicating, reattributing, or misrepresenting existing records.

The migration must preserve genuine completed work while distinguishing it
from planned work, setup filler, and duplicated compatibility data.

## Current Production Model

Historical information may currently exist in four places:

```text
maintenanceEvents
maintenanceHistory
properties.taskHistory / properties.maintenanceHistory
devices.maintenanceHistory
```

New manual maintenance entries use the server-owned Maintenance Event path, but
legacy compatibility still affects reads, editing, deletion, equipment views,
reports, costs, profiles, and Property Intelligence.

Known active legacy behavior includes:

* Property and account history queries read both `maintenanceEvents` and
  `maintenanceHistory`.
* A legacy record can still be updated or physically deleted directly when no
  canonical event with the same ID exists.
* Equipment Quick Log creates a canonical Maintenance Event and then appends a
  second embedded `devices.maintenanceHistory` entry.
* Creating recurring maintenance appends an embedded history entry even though
  no maintenance work was completed.
* Property forms continue to carry embedded `taskHistory` or maintenance arrays.

## Existing Backfill Is Not Approved for Production

`scripts/migrateMaintenanceHistoryToEvents.cjs` predates the current schema and
governance requirements. Its apply mode must not be used until it is replaced.

The current implementation:

* Copies legacy documents almost verbatim.
* Treats matching document IDs as its only definitive idempotency boundary.
* Does not resolve missing or conflicting property/account relationships.
* Does not create `maintenanceEventRevisions` records.
* Does not preserve explicit migration provenance or a source hash.
* Does not normalize attribution, attachments, financials, dates, or links to
  the current Maintenance Event contract.
* Does not provide checkpointed pagination, per-record parity, or rollback.
* Allows apply without an explicit project confirmation or backup reference.

No production backfill should occur through that path.

## Phase 1: Report-Only Inventory

Implemented tooling:

```text
scripts/inventoryMaintenanceHistory.cjs
scripts/lib/maintenanceHistoryInventoryCore.cjs
scripts/maintenanceHistoryInventoryCore.test.cjs
```

Commands:

```bash
yarn test:maintenance-history-inventory
yarn audit:maintenance-history --confirm-project=mypropertymanager-cda42
```

The inventory has no apply mode. It requires the operator to confirm the exact
Firebase project found in the service account and only writes reports under the
gitignored `tmp/` directory.

It reads:

* `properties`
* `devices`
* `maintenanceHistory`
* `maintenanceEvents`

It records no free-form maintenance descriptions in its result details. Record
details contain identifiers, classifications, feature-presence flags, field
names, signatures, and duplicate-match reasons needed for migration planning.

### Inventory outcomes

Each candidate receives one outcome:

| Outcome | Meaning |
|---|---|
| `ready` | Required relationships and historical content are available. |
| `ready_with_inference` | A unique property-title relationship can be proposed, but the inference must be reviewed. |
| `already_represented` | Canonical ID or explicit migration provenance already represents the source. |
| `possible_duplicate` | Exact normalized content, shared task links, or duplicated legacy sources require review. |
| `manual_review` | Required date/content/account data is missing or conflicts. |
| `orphaned` | No current property can be resolved. |
| `excluded_non_history` | The record is empty, planned work, setup filler, or another non-historical entry. |

### Duplicate evidence

The inventory treats only canonical document identity or explicit migration
provenance as definitively represented. Other matches remain review candidates.

Signals include:

* Matching canonical document ID.
* Existing `data.migration.sourceCollection` and `sourceId` provenance.
* Exact normalized property/date/content/equipment/task/cost signature.
* Shared original or linked task identifiers.
* Matching signatures across multiple legacy sources.

The inventory does not automatically merge probable duplicates.

## Phase 1 Review Gate

Before code begins for write containment or backfill, review the production
report and answer:

1. How many records exist in each source?
2. Which legacy field shapes actually occur?
3. How many records lack `accountId`, `propertyId`, or a service date?
4. How many title-only relationships are unique versus ambiguous?
5. How many records appear already represented or duplicated?
6. How many records include attachments, financials, attribution, tasks, or
   equipment relationships?
7. How many embedded entries are planned-work filler rather than completed work?
8. Which accounts or properties require manual review before migration?

The report must be reviewed before finalizing canonical field mapping.

## Production Inventory Result

The report-only inventory ran against `mypropertymanager-cda42` on 2026-07-26.
The generated record-level JSON remains in the gitignored local `tmp/`
directory and is not committed because it contains internal document and
account identifiers.

Inventory totals:

| Measure | Count |
|---|---:|
| Properties scanned | 26 |
| Equipment records scanned | 145 |
| Canonical Maintenance Events scanned | 284 |
| Legacy `maintenanceHistory` documents | 4 |
| Embedded property history candidates | 0 |
| Embedded equipment history candidates | 1 |
| Total migration candidates | 5 |

Classification:

| Outcome | Count |
|---|---:|
| Already represented | 4 |
| Ready for reviewed mapping | 1 |
| Possible duplicate | 0 |
| Manual review due to missing/conflicting fields | 0 |
| Orphaned | 0 |
| Excluded non-history | 0 |

All four legacy collection documents have same-ID canonical Maintenance Events,
exact normalized signatures, and shared original task relationships. They do
not require another backfill. Two contain attachment data; all four contain
attribution and task-link fields. None contains financial data.

The only unmatched candidate is one embedded equipment-history entry with a
date, description, resolved account/property relationship, and equipment link.
It has no attachment, financial, attribution, or task relationship. Its content
must be reviewed before deciding whether to create one canonical Maintenance
Event or classify it as non-historical filler.

No production write, migration, correction, or deletion occurred during the
inventory.

## Phase 2: Legacy Write Containment

Status: implemented and build/test validated on the Phase 2 write-containment branch.

Implementation:

1. Stop duplicating equipment Quick Logs into embedded history.
2. Stop recording recurring-task creation as completed history.
3. Stop property forms from rewriting hidden legacy arrays.
4. Keep canonical creation server-owned.
5. Replace direct legacy update/delete behavior with a server-controlled
   promote-then-correct workflow so attribution and revisions cannot be bypassed.
6. Preserve legacy reads until backfill parity is proven.

The correction boundary uses the existing record ID as the deterministic
canonical ID. A promoted record receives migration source metadata and a
source hash, a system-authored creation revision, and then the authenticated
user's correction or deletion revision. Historical recorder attribution is
preserved only when explicitly present in the source; an older ownership
`userId` is not inferred to be the recorder. Records without a reliable current
property, service date, or historical description are refused for manual
review. Legacy source documents remain unchanged.

Acceptance gate:

* New user actions create only canonical Maintenance Events.
* Existing legacy records remain visible and correctable.
* No historical record is silently cleared from a property or equipment record.

## Phase 3: Shared History Adapter

Status: adapter foundation implemented; equipment, reporting, profile, and
Intelligence consumer migration remains in the next Phase 3 slice.

All Maintenance History consumers should use one source-aware adapter for:

* Property timelines
* Equipment history
* Dashboard and profiles
* Costs and reports
* Documents and Property Knowledge matching
* Property Intelligence

The adapter initially performs dual reads and central deduplication. It later
becomes the cutover boundary for canonical-only reads.

Foundation implementation:

* `src/maintenanceHistory/maintenanceHistoryAdapter.ts`
* Property- and account-scoped RTK history queries normalize through the same
  adapter.
* Embedded property aliases are incorporated once at the query boundary.
* Property detail and Maintenance History tab code no longer performs its own
  embedded-property merge.
* Definitive ID and migration-provenance matches are deduplicated; merely
  similar independent records remain visible.

Acceptance gate:

* No screen independently queries or merges legacy history.
* Dates, costs, attachments, attribution, equipment, and task relationships
  render consistently across all consumers.

## Phase 4: Controlled Backfill Engine

The replacement backfill must support:

* Dry-run by default.
* Explicit Firebase project confirmation.
* Required Firestore export/backup reference.
* Explicit apply confirmation phrase.
* Account/property scoping.
* Cursor-based batches and resumable checkpoints.
* Deterministic target IDs and source hashes.
* Migration run ID and version.
* Per-record outcomes and an immutable run manifest.
* Canonical attachment, financial, date, task, equipment, and attribution mapping.
* Server-owned `maintenanceEventRevisions` creation.
* Idempotent reruns.
* A rollback manifest limited to records created by that migration run.

Unknown historical attribution must remain unknown. The migration operator must
not be represented as the person who originally recorded or performed the work.

## Phase 5: Staged Execution

1. Create a Firestore export and record its identifier.
2. Run the complete report-only production inventory.
3. Apply only to development and founder/demo accounts.
4. Validate every consumer and compare source/canonical parity.
5. Migrate one real account at a time.
6. Pause on any mismatch.

Validation includes counts, ordering, dates, costs, attachments, equipment,
tasks, attribution, revisions, reports, exports, and Intelligence results.

Legacy sources remain unchanged throughout staged application.

## Phase 6: Canonical Cutover

After parity is proven:

* Switch the shared adapter to Maintenance Events only through a reversible
  source-mode configuration.
* Freeze legacy collection creation, update, and deletion in Firestore rules.
* Retain legacy reads temporarily for rollback and support investigation.
* Remove direct application awareness of legacy collection records.

## Phase 7: Later Cleanup

Only after an approved observation period:

* Remove legacy reads.
* Stop legacy storage accounting.
* Remove obsolete legacy cascade behavior after records are archived or gone.
* Remove embedded history fields after parity is verified.
* Record ADR 0024 completion.

This cleanup is a later approval and is not part of the report-only inventory.

## Stop Conditions

Stop the migration if:

* A source record cannot be mapped without inventing historical facts.
* A duplicate cannot be distinguished safely.
* Costs, attachments, attribution, task links, or equipment links would be lost.
* A report or Intelligence result changes without an explained reason.
* The backup reference or project identity is uncertain.
* A migration rerun produces a different target set.
* Rollback cannot be limited to the active migration run.

## Current Authorization Boundary

Authorized now:

* Report-only inventory implementation and deterministic tests.
* A reviewed production inventory run that performs no writes.

Not authorized now:

* Legacy write containment changes.
* Backfill apply mode.
* Firestore rule changes.
* Canonical-only cutover.
* Legacy record deletion.
