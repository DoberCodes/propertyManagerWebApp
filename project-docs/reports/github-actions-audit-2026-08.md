# GitHub Actions and Release Controls Audit

Date: 2026-08-02

Status: Point-in-time audit

## Scope

This audit reviewed Maintley's GitHub Actions workflows, branch rulesets,
deployment environments, release automation, automated test entry points, and
recent workflow execution history.

The desired promotion path is:

```text
feature branch -> beta -> release/next -> main
```

Beta may accumulate multiple approved changes before a release. Production is
affected only after the prepared `release/next` pull request is merged and the
production deployment succeeds.

## Findings

### Required checks were coupled to optional behavior

The Beta ruleset required `Deploy or restore Beta backend`, although that job is
intentionally created only for an activated backend preview. A normal pull
request could pass every applicable check and remain blocked because the
optional context was never reported.

Immediate remediation removed that optional deployment context from the Beta
ruleset. `Beta backend readiness` remains required.

### Required check names were implementation details

Beta and Main directly required several individual job names. Renaming,
splitting, conditionally skipping, or consolidating a job could leave a pull
request waiting for a status that would never appear.

Permanent aggregate checks named `Beta PR Gate` and `Release Gate` were added as
the migration targets. Existing required checks should remain in place while
the aggregate gates prove stable, then rulesets should move to the aggregate
contexts.

### Test entry points omitted existing tests

The root CI script selected only a subset of repository script tests. The
Functions job similarly selected individual suites and omitted access-lifecycle
billing, legacy promotion, personal-assistant credentials, and connected
property relationship tests.

Central test manifests now fail when a new top-level `.test.cjs` file is not
included. Functions compile once and then execute the complete manifest.

### CI suppressed compiler warnings

Frontend build jobs set `CI: false`. Create React App therefore did not apply
its normal CI warning policy. CI builds now use `CI: true`, and the Build Check
also runs ESLint and a standalone TypeScript check.

### Workflow permissions and timeouts were inconsistent

The repository default token permission was write-capable, while most
workflows did not declare a top-level permission boundary. Several jobs also had
no timeout.

Every workflow now declares explicit top-level read access, with job-level
write or identity permissions only where needed. Every runner job has a
timeout. A repository workflow-policy validator prevents regression.

### Release Prep masked unexpected failures

Release Prep treated every release-note generator error as if no releasable
changes existed. Configuration, Git, API, or parsing failures could therefore
finish successfully without updating the release.

Release Prep now asks the generator for an explicit empty result. Zero entries
skip release preparation; unexpected generator failures fail the workflow.

### Backend preview locking was inefficient

Activated backend previews could wait for other required checks while already
holding the shared Beta backend concurrency lock. Recent failures included both
check-wait failures and backend deployment failures, and one run occupied the
workflow for several hours including queue time.

The follow-up implementation should wait before taking the shared deployment
lock, revalidate the pull-request SHA after acquiring it, and discard stale
requests.

### E2E coverage was narrow

Automatic pull-request E2E currently covers authentication and Support only.
Some broader workflow assertions can pass without demonstrating that the
intended mutation occurred.

The follow-up implementation should retain a fast non-mutating smoke suite,
add path-aware domain suites, strengthen mutation assertions, and run the safe
cross-browser suite on a schedule.

### Production identity and action supply chain need hardening

Beta uses Workload Identity Federation. Production still relies on a stored
service-account JSON credential. Actions are referenced by mutable major tags,
and the repository does not require immutable action SHAs.

The final hardening phase should migrate Production to Workload Identity
Federation, pin third-party actions to reviewed SHAs, add Dependabot coverage
for Actions, and reduce the repository default token permission to read.

## Observed execution profile

The recent run sample showed stable frontend checks and preview Hosting, while
backend preview deployment was the slowest and least reliable path:

| Workflow | Recent observation |
| --- | --- |
| Build Check | 15 successful, no ordinary failures; median about 102 seconds |
| E2E | 15 successful, no ordinary failures; median about 148 seconds |
| Hosting Preview | 12 successful; median about 197 seconds |
| Release Notes | 15 successful, no ordinary failures; median about 29 seconds |
| Beta Backend Preview | 3 successful, 4 failed, 12 skipped; executed median about 739 seconds |
| Stable Beta deployment | 3 successful; median about 449 seconds |

`action_required` runs were separated from ordinary code failures because they
represent GitHub approval or event-policy behavior rather than a failed test.

## Recommended rules by stage

### Feature pull request into Beta

Target state:

* Pull request required for human-authored changes.
* Squash merge only.
* Conversation resolution required.
* Branch must be current before merge.
* Require `Beta PR Gate`.
* Require `Beta backend readiness` until backend readiness is incorporated into
  the permanent aggregate gate.
* Permit the release/alignment automation identity to fast-forward Beta without
  creating a synchronization pull request.
* Block force pushes and deletion.

### Beta

Beta is the stable shared test environment, not a production branch.

* Normal feature integration occurs through reviewed pull requests.
* A successful merge deploys the stable Beta app and applicable Firebase
  targets.
* Each successful stable deployment updates the one existing `release/next`
  branch and pull request.
* Multiple Beta changes may accumulate in the same unreleased version.
* Direct human pushes remain an emergency exception, even if the temporary
  automation model cannot yet distinguish them from the alignment bot.

### Release candidate

`release/next` should be bot-owned and force-with-lease updated from the exact
successfully deployed Beta SHA plus version files.

* Require `Release Gate` before merge to Main.
* Require conversation resolution.
* Permit merge commits only into Main so release identity remains auditable.
* Do not require a CODEOWNER review until a real `CODEOWNERS` file and an
  available reviewer are configured.
* Prevent unrelated branches from serving as production release candidates.

### Main and Production

* Pull request required.
* Accept only the prepared `release/next` promotion by operating policy and
  release identity validation.
* Require `Release Gate` after its canary period.
* Require the branch to be current.
* Block force pushes and deletion.
* Restrict the Production GitHub environment to Main.
* Complete a production route/smoke check before creating the immutable tag and
  GitHub Release.

## Implementation sequence

1. CI foundation and permanent gates.
2. E2E and preview efficiency.
3. Backend preview and release reliability.
4. Production identity and action supply-chain hardening.

Rulesets should be changed only after the corresponding new check has reported
successfully on the target branch. Keep the prior required contexts during each
canary period so a workflow naming change cannot silently reduce coverage.
