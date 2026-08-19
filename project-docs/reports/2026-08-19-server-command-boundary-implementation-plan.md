# Server Command Boundary Implementation Plan

Date: 2026-08-19

Status: Recommended architectural follow-up; no broad command migration is
included in the audit-remediation pull request.

Related evidence:

* `project-docs/reports/2026-08-18-comprehensive-product-audit.md`
* `project-docs/docs/Architecture/DATA_MODEL.md`
* `project-docs/docs/Architecture/PERMISSIONS.md`
* `project-docs/reports/2026-07-30-functions-directory-migration-plan.md`

## Decision needed

Maintley should establish one reusable server-side command contract before
moving additional cross-entity workflows out of the client. This changes the
write architecture, failure recovery, audit model, and permissions boundary;
it should receive its own ADR and implementation branch rather than being
introduced as an incidental audit fix.

## Existing foundation

Maintley already has trusted, idempotent behavior for parts of the model:

* Setup maintenance-plan activation accepts a request ID.
* Recurring Task creation uses deterministic request-derived IDs.
* Maintenance Event commands centralize task/history writes.
* Space, Supply, Document, Equipment, and Task relationship writes use trusted
  Functions.
* Entitlement, complimentary-access, and administrative commands write
  replay-safe audit records.
* Document acquisition uses durable request records.

The missing piece is a shared command envelope and operation-state contract.
Without it, each Function chooses different replay, failure, and response
shapes, while Property creation and some accepted-review workflows still
coordinate multiple writes in the browser.

## Proposed command envelope

Every cross-entity command should accept:

```text
requestId
commandType
accountId
propertyId (when applicable)
expectedVersion (when correcting an existing aggregate)
payload
```

The server resolves actor, role, effective access, and permissions from trusted
state. Clients must not submit an actor role or entitlement decision.

Every response should include:

```text
operationId
status: completed | partial | failed | replayed
result references
completed steps
retryable steps
support code
```

Operation records are account-scoped, server-written, immutable for identity
fields, and bounded in retained payload. They store references and controlled
outcomes—not copied customer documents or raw errors.

## Migration order

1. Write and approve the command/operation ADR.
2. Add the shared command envelope, authorization helper, operation schema,
   emulator tests, and cleanup/retention policy.
3. Wrap existing Setup activation and recurring-Task Functions without changing
   their public export names.
4. Move Property creation plus reviewed Space generation behind one command.
5. Move Task completion plus Maintenance Event creation behind one command.
6. Move accepted document-review changes and their relationships behind one
   command.
7. Move account deletion to a resumable operation record.
8. Remove superseded client orchestration only after Beta replay and partial-
   failure tests pass.

## Required invariants

* Repeating one request ID cannot duplicate records.
* Authorization and effective access are evaluated once per execution.
* Existing downgrade visibility is preserved.
* Partial results state exactly what was committed and what can be retried.
* Operation records never become a duplicate source of Property knowledge.
* Existing Firebase export identities remain stable during migration.
* All five critical mobile journeys remain usable while commands are migrated.

## Release boundary

This work follows the Functions generated-artifact cleanup and should not share
a release with the domain-directory move. The first runtime slice should be
Property creation plus Spaces because it has the clearest production failure
history and an existing Beta activation journey for verification.
