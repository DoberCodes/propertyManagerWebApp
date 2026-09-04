# Workflow Error Taxonomy

Last reviewed: 2026-08-19

## Purpose

Multi-record workflows must show a stable support code when a user-visible step
partially succeeds or fails. The code helps Support identify the workflow and
stage without exposing raw Firebase messages, customer content, or unstable
implementation details.

## Version 1 Codes

| Code | Workflow stage | User data state |
| --- | --- | --- |
| `MNT-PROP-001` | Property Space reconciliation | Property may be saved; generated Spaces can be retried idempotently |
| `MNT-PROP-002` | Dashboard visibility preference | Property is saved; display preference needs retry |
| `MNT-PROP-003` | Property duplication, Equipment copy | New Property is saved; Equipment copy is partial |
| `MNT-PROP-004` | Property duplication, Task copy | New Property is saved; Task copy is partial |
| `MNT-SETUP-001` | Setup Assistant save | Review choices remain retryable; accepted plan may be partial |

Codes are defined in `src/utils/workflowSupportCodes.ts`. Existing analytics
continues to use the lower-cardinality controlled `error_code`; support codes
are user-facing workflow references and must not include IDs or raw messages.

## Change Contract

Do not reuse a code for a different data-state outcome. Add a new code when the
workflow or recovery instruction changes materially. Every coded failure must
state what was saved, what did not finish, and the safe next action.
