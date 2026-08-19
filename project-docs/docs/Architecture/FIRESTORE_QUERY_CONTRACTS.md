# Firestore Query Contracts

Last reviewed: 2026-08-19

## Purpose

Firestore query behavior must be reproducible from source control. Composite
indexes are defined in `firestore.indexes.json` and deployed through the same
Beta-to-production path as Firestore rules. Console-only indexes are drift and
must be exported into the repository before a release depends on them.

## Current Composite Indexes

| Collection | Query contract | Consumer |
| --- | --- | --- |
| `familyInvites` | `accountId ==`, ordered by `createdAt desc` | `functions/listFamilyInvites.ts` |
| `notifications` | `userId ==`, ordered by `createdAt desc` | `src/Redux/API/notificationSlice.tsx` |
| `notifications` | reminder `type in`, `data.taskId ==`, `data.notificationId ==`, bounded `createdAt` range | `src/utils/taskNotificationScheduler.ts` |

The first two indexes were exported from production on August 19, 2026. The
third makes the existing task-reminder deduplication query explicit instead of
allowing a missing-index error to be caught and treated as "not found."

## Change Contract

When adding a query that combines ordering, array membership, `in`, or range
filters:

1. Add or update the representative fixture and query test.
2. Add the required index to `firestore.indexes.json`.
3. Merge to Beta and wait for the index to reach Ready before exercising the
   workflow.
4. Validate the query with production-like record volume.
5. Promote the same index file through the release branch.

Never replace this file with an empty export. Firebase treats the repository
file as the intended index set and may remove indexes absent from a deployment.

## Portfolio Query Budgets

The primary account views currently assemble data client-side. Until dedicated
summary/read models are introduced, acceptance fixtures should cover 1, 5, 15,
and 100 Properties and record these measurements:

| View | Required measurements |
| --- | --- |
| Today | documents read, route-ready time, actionable cards rendered |
| Tasks | tasks read, first-decision render, expanded cards rendered |
| Equipment | equipment and relationship records read, first-decision render |
| Reports | source records read, preview generation time, export duration |
| Team | member, assignment, and Property records read; interactive render time |

Budgets become release-blocking only after Beta baselines are recorded. This
document defines the inventory and measurement contract; it does not invent
thresholds without production-like evidence.
