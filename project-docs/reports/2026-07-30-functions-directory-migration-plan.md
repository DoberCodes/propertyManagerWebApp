# Cloud Functions Directory Migration Plan

Date: 2026-07-30

Status: Planned; implementation begins after the Firebase Hosting migration is
merged and verified in Beta

Related documentation:

* `project-docs/docs/Architecture/TECHNICAL_ARCHITECTURE.md`
* `project-docs/docs/Development/CODE_ORGANIZATION_GUIDE.md`
* `project-docs/docs/Operations/DEPLOYMENT.md`
* `project-docs/docs/Operations/TESTING.md`
* `project-docs/reports/2026-07-22-firebase-hosting-migration-plan.md`

## Purpose

This report defines the behavior-preserving migration of the Maintley Cloud
Functions package from a flat, mixed-responsibility directory into an explicit
domain-oriented source structure.

It is an implementation plan, not a description of the currently deployed
Functions package. Active architecture documentation continues to identify
`functions/index.ts` as the entry point until this migration is complete.

The migration is intended to improve:

* Source discoverability.
* Domain ownership.
* Build reproducibility.
* Test organization.
* Deployment-package reliability.
* Safe future decomposition of oversized modules.

The migration must not change product behavior, authorization, data, triggers,
or deployed Firebase function identities.

## Sequencing requirement

This migration starts only after:

1. The Firebase Hosting migration is merged.
2. The Beta Hosting and routing flow is verified.
3. The environment-contract and Node.js 22 Functions runtime changes are
   merged.
4. The repository has a clean working tree.
5. A fresh migration branch is created from the updated `beta` branch.

The directory migration must not be added to the Hosting or environment/runtime
pull request. Keeping these changes separate preserves review clarity and a
simple rollback boundary.

## Current inventory

At planning time:

* `functions/index.ts` exports 98 Firebase functions.
* More than 60 TypeScript source and test files share the Functions root.
* Runtime entry points, shared helpers, tests, migration tools, sandbox tools,
  templates, generated JavaScript, coverage output, and local artifacts are
  mixed in one package directory.
* `functions/adminPortal.ts` is approximately 5,374 lines.
* `functions/stripeFunctions.ts` is approximately 2,527 lines.
* `functions/propertyKnowledgeAcquisition.ts` is approximately 1,659 lines.
* `functions/accessLifecycleEmails.ts` is approximately 1,141 lines.
* `functions/maintenanceEvents.ts` is approximately 952 lines.
* `functions/submitFeedback.ts` is approximately 846 lines.
* `functions/lib/` is committed even though it is generated TypeScript output.
* `functions/coverage/` is committed even though it is generated test output.
* `functions/scripts/` contains TypeScript migration and operational sources,
  but `functions/.gitignore` currently ignores `/scripts/*`. The source files
  must be recovered, reviewed, and committed before generated script output is
  removed.
* Ignored local artifacts include `functions/firebase-debug.log`,
  `functions/package-lock.json`, and `functions/.env.local.bak`.
* Generated `lib/` contains files that do not have a current TypeScript source
  counterpart. These must be classified as stale, intentionally retained, or
  recoverable before the generated directory is untracked.

These findings show that the problem is not merely the number of files. The
current package does not clearly separate source, generated output, tests,
operations, and domain ownership.

## Governing principles

The migration follows these rules:

* Preserve every deployed Firebase export name.
* Move code before decomposing code.
* Do not mix behavioral refactoring with structural movement.
* Keep authorization and billing boundaries explicit.
* Keep the shared entitlement package inside the Firebase Functions source
  package so it remains available during deployment.
* Generate deployable JavaScript from tracked TypeScript source.
* Do not depend on previously committed build output.
* Keep operational scripts separate from deployed runtime entry points.
* Keep tests close enough to their domains to remain discoverable without
  including them in the deployment entry point.
* Prefer explicit imports and entry-point facades over automatic function
  discovery.

## Target structure

```text
functions/
├── src/
│   ├── index.ts
│   ├── domains/
│   │   ├── accounts/
│   │   ├── admin/
│   │   ├── assistant/
│   │   ├── billing/
│   │   ├── communications/
│   │   ├── documents/
│   │   ├── invitations/
│   │   ├── maintenance/
│   │   └── storage/
│   └── shared/
│       ├── auth/
│       ├── email/
│       └── entitlements/
├── test/
│   └── unit/
├── scripts/
│   ├── migrations/
│   ├── operations/
│   └── sandbox/
├── templates/
├── packages/
│   └── entitlements/
├── lib/                         # generated and ignored
├── package.json
├── tsconfig.json
└── yarn.lock
```

The initial migration may retain large modules as single files inside their new
domain directories. Internal decomposition belongs to the later phases in this
report.

## Domain ownership map

| Domain | Initial responsibilities |
|---|---|
| `accounts` | Family accounts, memberships, account deletion, account setup, entitlement activation. |
| `admin` | Admin Portal authentication, users, grants, billing administration, feedback administration, Maintley team administration. |
| `assistant` | Personal-assistant credentials, token verification, and the private read API. |
| `billing` | Stripe checkout, subscriptions, webhooks, pricing, grants, access codes, and billing disclosure. |
| `communications` | Email infrastructure, lifecycle communication, reminders, summaries, reports, events, and push delivery. |
| `documents` | Property Knowledge Acquisition, PDF extraction, DOCX interpretation, and acquisition eligibility. |
| `invitations` | Family, team-member, and tenant invitation workflows. |
| `maintenance` | Maintenance Events, recurrence, setup plans, manual occupancy, task status, and related notifications. |
| `storage` | Upload reservation, quota reporting, finalization, and release. |
| `shared/auth` | Account authorization and invitation authorization primitives. |
| `shared/email` | Email branding, links, and provider helpers shared across communication workflows. |
| `shared/entitlements` | Functions-facing entitlement adapters; the runtime-neutral package remains under `packages/entitlements`. |

## Authoritative implementation sequence

### Phase 0: Freeze and verify the baseline

Before moving files:

1. Build the Functions package from a clean checkout.
2. Capture the exact sorted export list from the compiled entry point.
3. Confirm the baseline contains exactly 98 functions.
4. Capture trigger type, region, generation, runtime, memory, timeout, and secret
   bindings for every deployed Beta function.
5. Run the full safe Functions test suite.
6. Run environment-contract and deployment-package validation.
7. Classify every generated JavaScript file without a TypeScript source.
8. Classify every file under the currently ignored `functions/scripts/`
   directory and compare it with its compiled counterpart.

Exit gate: the migration has a complete source, export, trigger, and generated
artifact inventory. No file is removed based only on its location or age.

### Phase 1: Establish a reproducible build boundary

1. Make `firebase.json` run the Functions build before deployment-package
   validation.
2. Make `functions/package.json` point to the new compiled entry point.
3. Configure `tsconfig.json` so tracked source under `src/` and operational
   TypeScript under `scripts/` compile into predictable paths under `lib/`.
4. Add a validation that the compiled entry point exists.
5. Add an export-inventory comparison that fails when an expected Firebase
   function is missing or renamed.
6. Confirm local and GitHub deployment paths use the same build process.

Exit gate: deleting local `lib/` followed by the documented build command
recreates a complete deployable package.

### Phase 2: Correct generated and ignored artifact ownership

1. Stop tracking `functions/lib/` after the reproducible-build gate passes.
2. Stop tracking `functions/coverage/`.
3. Add `lib/` and `coverage/` to `functions/.gitignore`.
4. Remove the `/scripts/*` ignore rule and commit the reviewed operational
   TypeScript sources.
5. Remove local ignored artifacts such as debug logs, the duplicate npm
   lockfile, and obsolete environment backups.
6. Keep Yarn as the Functions package lockfile authority.

Exit gate: tracked source is sufficient to build and test the Functions
package, and no generated or local-only artifact is required from Git history.

### Phase 3: Move deployable source by domain

Move files in small, reviewable groups while preserving contents and exports:

1. Shared authorization, email, and entitlement helpers.
2. Accounts and invitation workflows.
3. Maintenance and storage workflows.
4. Communications, event, and push workflows.
5. Documents and Property Knowledge Acquisition.
6. Billing and access workflows.
7. Admin Portal and Maintley administration.
8. Personal-assistant API and credential workflows.
9. Move `functions/index.ts` to `functions/src/index.ts` and update imports.

After each group:

* Build the Functions package.
* Run the affected tests.
* Compare the compiled export list with the baseline.

Exit gate: every deployable TypeScript source is under `functions/src/`, all 98
exports remain present, and no domain move changes runtime behavior.

### Phase 4: Organize tests and operational tools

1. Move current CJS unit tests to `functions/test/unit/` without converting
   test frameworks or rewriting assertions.
2. Update test imports and package scripts.
3. Move migration tools to `functions/scripts/migrations/`.
4. Move administrative tools to `functions/scripts/operations/`.
5. Move credentialed Stripe test tools to `functions/scripts/sandbox/`.
6. Keep HTML templates under `functions/templates/` and verify they remain in
   the Firebase deployment package.
7. Preserve every existing operator-facing package command or provide an
   explicit documented replacement.

Exit gate: tests and tools are discoverable by responsibility, and documented
commands still perform the same operation.

### Phase 5: Documentation and automation alignment

Update:

* `project-docs/docs/Architecture/TECHNICAL_ARCHITECTURE.md`
* `project-docs/docs/Development/CODE_ORGANIZATION_GUIDE.md`
* `project-docs/docs/Development/SCRIPTS_AND_UTILITIES.md`
* `project-docs/docs/Operations/DEPLOYMENT.md`
* `project-docs/docs/Operations/TESTING.md`

Update workflow path filters and cache dependencies only where paths actually
change. Do not create a second deployment workflow or a parallel Functions
codebase.

Exit gate: active documentation describes the implemented structure and no
document refers to the retired flat source layout as current behavior.

### Phase 6: Full validation

Required automated gates:

* Frozen Functions dependency installation under Node.js 22.
* TypeScript build from an absent `lib/` directory.
* All safe Functions unit tests.
* Root frontend unit tests.
* Root lint.
* Production frontend build.
* Environment-contract validation.
* Functions deployment-package validation.
* Workflow YAML parsing.
* Exact compiled export comparison: 98 expected and 98 present.
* Repeated build with no tracked-file changes.

Required review gates:

* Import changes are attributable to file movement.
* Firebase export names are unchanged.
* Secret bindings are unchanged.
* Trigger definitions are unchanged.
* Firestore and Storage paths are unchanged.
* Authorization predicates are unchanged.
* Billing and entitlement decisions are unchanged.

### Phase 7: Beta deployment and runtime verification

1. Deploy the 98 functions to Maintley Beta in groups of ten or fewer.
2. Compare the live function inventory with the source export inventory.
3. Require 98 deployed, zero missing, and zero unexpected functions.
4. Confirm Firebase did not request deletion of an existing function due to an
   export rename.
5. Exercise representative boundaries:
   * Callable function.
   * HTTP endpoint.
   * Stripe webhook.
   * Scheduled email job.
   * Firestore trigger.
   * Storage trigger.
   * Document acquisition request.
   * Admin Portal callable.
   * Personal-assistant API endpoint.
6. Review Beta logs for module-loading, missing-template, missing-secret, and
   missing-package errors.

Firebase recommends deploying groups of ten or fewer when a project contains a
large number of functions:

* <https://firebase.google.com/docs/functions/manage-functions#deploy_functions>

Exit gate: the reorganized package is running in Beta with exact function
parity and representative runtime verification.

## Explicit exclusions

This migration does not:

* Split the internal implementation of large modules.
* Change Firebase function names.
* Change function generations.
* Change regions, memory, timeouts, schedules, or retry behavior.
* Change authorization rules or role semantics.
* Change Firestore or Storage schemas.
* Change billing, grants, subscriptions, or entitlement behavior.
* Change email eligibility or lifecycle-delivery behavior.
* Change Personal Assistant API scopes or response contracts.
* Introduce automatic function discovery.
* Introduce a second Functions codebase.
* Introduce new data migrations.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Export rename causes Firebase to create and delete functions. | Preserve explicit exports and compare all 98 names before deployment. |
| Generated output hides missing source. | Inventory unmatched `lib/` files and ignored script sources before untracking anything. |
| Runtime module or template is omitted from the deploy package. | Validate the built package, entitlement package, and templates from a clean build. |
| Authorization changes during file movement. | Move files without internal edits and rerun authorization-focused tests after each domain group. |
| Billing behavior changes during import rewrites. | Keep billing modules intact in Phase 1 and run Stripe, grant, subscription, and lifecycle tests. |
| Test commands silently stop covering moved code. | Preserve commands, validate test counts, and document every intentional replacement. |
| Large rename diff obscures logic changes. | Prohibit behavioral changes in the structural PR and review domain groups independently. |
| Rollback depends on deleted generated files. | Require the previous commit to rebuild from source before migration approval. |

## Rollback plan

The structural migration contains no data writes or schema migration.

If Beta verification fails:

1. Stop the migration rollout.
2. Revert the structural migration commit.
3. Build the previous Functions package from source.
4. Deploy the previous exports in groups of ten or fewer.
5. Confirm the live inventory returns to the 98-function baseline.
6. Preserve failure logs and update this report before attempting the migration
   again.

No Firestore, Storage, Stripe, or account-data rollback should be required.

## Phase 2 decomposition backlog

After the structural migration is merged and stable in Beta, decompose large
modules in separate behavior-focused changes, in this recommended order:

1. `adminPortal.ts`
   * Session and authentication.
   * User lookup and troubleshooting.
   * Entitlement grants.
   * Subscription administration.
   * Coupons and checkout links.
   * Feedback administration.
2. `stripeFunctions.ts`
   * Configuration and Stripe client creation.
   * Checkout.
   * Subscription synchronization.
   * Webhook dispatch.
   * Trial handling.
3. `propertyKnowledgeAcquisition.ts`
   * Request orchestration.
   * Source extraction.
   * Interpretation.
   * Suggestion construction.
   * Review persistence.
4. `accessLifecycleEmails.ts`
   * Eligibility policy.
   * Delivery orchestration.
   * Templates and content.
   * Scheduling and retries.
5. `maintenanceEvents.ts`
   * Authorization and validation.
   * Event creation and mutation.
   * Task completion integration.
   * Notification side effects.

Each decomposed domain retains a small export facade so deployed Firebase
function identities remain stable.

## ADR assessment

No ADR is required for the planned directory migration because it changes code
organization and build hygiene without changing the deployed platform model.

A new ADR is required if implementation expands into:

* Multiple Firebase Functions codebases.
* A Gen 1 to Gen 2 migration strategy.
* Automatic function discovery.
* A different deployment owner or release boundary.
* A changed authorization, data, or event architecture.

## Completion criteria

This migration is complete only when:

* Tracked TypeScript source can recreate the complete Functions package.
* Generated `lib/` and coverage output are not tracked.
* Operational TypeScript sources are tracked and organized.
* Deployable sources live under `functions/src/`.
* Tests and tools have explicit homes.
* All 98 Firebase exports retain their names and trigger contracts.
* Automated validation passes.
* Beta deployment and representative runtime checks pass.
* Active documentation describes the new structure.
* No behavior, permission, billing, or data change was introduced by the
  structural migration.
