# Firestore orphan cleanup

`migrateRemoveOrphanedData.cjs` is the guarded maintenance command for data
that can be proven to have no remaining Firebase Auth user, active account,
property, or task relationship. It also removes empty property and team groups.

Firebase Auth is authoritative for user existence. An account is preserved
when an Auth-backed owner, member, user profile, or active account membership
still reaches it. This prevents deletion of a shared account merely because one
former user was removed.

The cleanup covers:

- `users/{uid}` profiles whose UID is absent from Firebase Auth, including any
  nested Firestore documents;
- inactive `familyAccounts` and nested grants/deliveries;
- root records with an inactive `accountId`;
- supported legacy records owned only by a deleted user;
- property- and task-related records whose parent no longer survives;
- stale user IDs in property sharing arrays and family member arrays;
- invalid property-group memberships and invalid team-member group links;
- property groups with no current membership, legacy property link, or embedded
  property;
- team groups with no member, embedded member, or surviving linked property.

Admin audit records are intentionally not deleted by this script. An active
shared account whose owner is missing from Auth is also preserved and reported
for manual ownership review.

## Always preview first

```powershell
npm.cmd run migrate:orphaned-data -- --report=cleanup-report.json
```

The dry-run reads Firestore and Firebase Auth but performs no mutations. Review
every listed path and the category totals in the report.

## Apply an approved report

Apply mode requires four independent safeguards: a recoverable Firestore
backup/export reference, the exact Firebase project ID, a fixed confirmation
phrase, and a maximum permitted deletion count.

```powershell
npm.cmd run migrate:orphaned-data:apply -- --confirm-project=<firebase-project-id> --confirm-delete=DELETE_ORPHANED_DATA --backup-reference=<firestore-export-or-backup-id> --max-delete=<reviewed-delete-count-or-safe-upper-bound> --report=cleanup-applied.json
```

If the planned delete count exceeds `--max-delete`, the command stops before
writing. Without an explicit `--max-delete`, the ceiling is 100 deletes.
`--backup-reference` is recorded in the report for operator traceability; the
script cannot independently verify that an external backup completed.

Credentials may come from `FIREBASE_SERVICE_ACCOUNT_JSON`,
`FIREBASE_SERVICE_ACCOUNT_PATH`, or the ignored root `serviceAccountKey.json`.
Any scan or write error fails the command; it does not silently continue.
Runs larger than 400 mutations use multiple Firestore batches, so a later batch
failure can leave an earlier batch applied. Re-run the idempotent dry-run after
any interrupted apply before taking further action.

The older `migratePruneInactiveUserData.cjs` command is retained only as a
compatibility entrypoint and now invokes this same guarded cleanup.
