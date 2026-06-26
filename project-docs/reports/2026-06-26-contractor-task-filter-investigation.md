# Contractor Task Filtering Investigation

Date: 2026-06-26

## Scope

Investigate the failing `filterTasksByRole` contractor test without changing
contractor access behavior.

## Finding

The failure was introduced by the account-scoping overhaul in commit
`e2649de` (2026-06-10). That change added an early team-member branch to
`filterTasksByRole`.

When a user matches a `teamMembers` record, the new branch filters only by
`task.propertyId`:

```ts
return tasks.filter((task) => linkedPropertyIds.has(task.propertyId));
```

The failing contractor fixture represents older tasks with only the legacy
`task.property` title, so every task has an undefined `propertyId` and is
excluded. The older fallback later in the function can match a property title,
but it is unreachable once the new scoped-member branch runs.

## Evidence

* `src/utils/dataFilters.test.ts` supplies a contractor linked to `prop1` and
  two tasks with `property: 'Main Street Property'`, but no `propertyId`.
* `src/utils/dataFilters.ts` identifies that user as a scoped team member by
  email and enters the early branch before reaching the legacy title-based
  limited-role branch.
* `project-docs/docs/Architecture/DATA_MODEL.md` defines `propertyId` as a
  standard task field. New tasks are created with it.
* `src/Redux/API/taskSlice.tsx` also scopes fetched tasks by `propertyId`, so
  legacy title-only task records are not consistently visible elsewhere.

## Assessment

This is not a contractor authorization regression for current task records:
current tasks are expected to have `propertyId`, and filtering by the immutable
property ID is the correct access boundary.

It is a compatibility gap for legacy tasks that only store a property title.
Changing the test fixture to include `propertyId` would make CI pass but would
hide that migration risk. The failure is useful because it exposes the
inconsistency between the modern task contract and older records.

## Recommended Follow-up

Preferred approach: migrate legacy task records to add the correct `propertyId`
using their existing property title plus account context, then keep runtime
authorization ID-only.

Before the migration:

1. Audit tasks with a missing `propertyId`, grouped by account and title.
2. Resolve only unambiguous title-to-property matches within the same account.
3. Report ambiguous or unmatched tasks for manual repair rather than guessing.
4. Add a migration test and a regression test proving scoped contractors see
   tasks only when the canonical `propertyId` is linked to them.
5. Update the existing unit fixture to model the canonical task schema after
   the audit confirms no legacy compatibility path is required.

Do not restore title-based authorization as the primary path: titles are
editable and may be duplicated, so they are not a safe long-term permission
boundary.

## Current Status

No contractor production behavior was changed in this CI repair. The
contractor test remains the only failing test until the data audit and migration
decision are approved.
