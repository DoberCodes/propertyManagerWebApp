# Controlled Hotfix Release Lane Plan

Date: 2026-07-31

Status: Planned; not implemented

Related documentation:

* `project-docs/ADR/0028-firebase-hosting-and-browser-routing-migration.md`
* `project-docs/docs/Operations/DEPLOYMENT.md`
* `project-docs/reports/2026-07-22-firebase-hosting-migration-plan.md`

## Purpose

Maintley is moving toward a biweekly or monthly production release cadence.
Completed feature work may continue to merge into the isolated `beta` branch
throughout that cycle, deploy to the Maintley Beta Firebase project, and update
the rolling `release/next` candidate without affecting Production.

An urgent production correction must not require releasing every feature that
has accumulated in Beta. It must also not permit an ordinary feature branch to
bypass the validated production-release boundary.

This report defines the planned controlled hotfix lane. It does not describe a
currently available deployment path. Until this plan is implemented, only a
validated `release/next` PR merge into `main` may deploy Production.

## Goals

The hotfix lane must:

* begin from the exact currently deployed `main` state
* validate the patch in the isolated Beta environment
* release only the intended patch rather than all unreleased Beta work
* preserve required review, build, test, environment-approval, and version gates
* deploy only affected Firebase targets
* create immutable tag and GitHub Release metadata only after deployment succeeds
* reconcile the released patch back into Beta without discarding Beta work
* remain auditable and reversible

## Non-goals

The hotfix lane will not:

* permit arbitrary feature branches to deploy Production
* make direct commits to `main` a release mechanism
* bypass required checks or production environment approval
* provide an emergency console-only Firebase deployment procedure
* replace the normal `beta` to `release/next` to `main` flow
* automatically classify a change as safe merely because it is small

## Planned branch flow

```text
deployed main
    |
    +-- hotfix/<version-or-ticket>
            |\
            | +-- PR to beta --> Beta checks and Maintley Beta deployment
            |
            +---- PR to main --> dedicated hotfix release gate
                                      |
                                      +-- Production deploy
                                      +-- tag and GitHub Release
                                      +-- reconcile main back into beta
```

The same hotfix branch should be used for both pull requests. The branch must be
created from the current deployed `main` commit and must not absorb unrelated
Beta changes.

The Beta-targeted PR is merged and deployed first. The hotfix branch must remain
available until the Production PR completes. Repository settings or the release
procedure must prevent premature deletion of that branch.

## Planned execution sequence

1. Confirm the production issue and determine that waiting for the normal
   release would create unacceptable customer or operational risk.
2. Create `hotfix/<version-or-ticket>` from the exact deployed `main` commit.
3. Implement only the correction and its focused tests.
4. Open a PR from the hotfix branch into `beta`.
5. Pass normal review and required checks, merge into Beta, and validate the
   resulting stable Maintley Beta deployment.
6. Record the hotfix head SHA and the successful Beta deployment evidence.
7. Open or approve the second PR from the unchanged hotfix branch into `main`.
8. Require the dedicated hotfix gate to validate branch ancestry, PR metadata,
   patch version, checks, Beta evidence, and production environment approval.
9. Deploy Hosting on every accepted hotfix release and add Functions or Rules
   targets only when the hotfix changes those sources.
10. Create the patch tag and GitHub Release only after Production deploy and
    smoke validation succeed.
11. Reconcile the released `main` state back into `beta` using the guarded
    alignment path, preserving all Beta-only work.
12. Rebuild `release/next` from the new Beta head so the normal candidate no
    longer treats the hotfix as unreleased work.

## Required production gate

The implementation must reject a hotfix Production deployment unless all of
these conditions hold:

* The PR base is `main`.
* The PR head matches the approved `hotfix/` naming contract.
* The branch is based on the currently deployed Production release boundary.
* The merged diff contains no commits or files outside the reviewed hotfix.
* The repository-controlled version is a valid patch release above Production.
* Required unit, rules, Functions, frontend, and applicable E2E checks pass.
* The exact hotfix head SHA has successful Beta validation evidence.
* The merge SHA and PR metadata agree with the immutable build source.
* Production environment approval is granted.

The gate must fail closed. A non-release commit on `main` must continue to skip
Production deployment rather than receiving an implicit hotfix classification.

## Firebase target selection

Target selection should match the normal release behavior:

* Hosting deploys for every accepted web hotfix release.
* Functions deploy only when Functions or their deployment contract changed.
* Firestore Rules deploy only when `firestore.rules` changed.
* Storage Rules deploy only when `storage.rules` changed.

All Beta deployments continue to target `maintleybeta`. All Production targets
remain behind the validated `main` hotfix merge and the GitHub `production`
environment. Creating either PR must not change Production.

## Validation expectations

The first implementation must include tests proving that:

* a normal feature PR into `main` cannot deploy Production
* a hotfix branch not based on deployed `main` is rejected
* missing or stale Beta evidence is rejected
* unrelated Beta commits cannot enter the hotfix Production diff
* Functions and Rules deploy only when their authoritative sources changed
* tag and GitHub Release creation cannot precede successful deployment
* reconciliation preserves Beta-only commits

## Rollback

Rollback remains release-based rather than branch-based.

* Hosting recovery uses the last verified immutable Production Hosting artifact.
* A faulty backend hotfix is corrected through a new reviewed patch; Functions
  or Rules are not silently rolled back independently when that would break
  deployed clients or data contracts.
* Tags and GitHub Releases are not deleted to disguise a failed release.
* The incident record should identify the failed version, recovery version, and
  validation evidence.

## Open implementation decisions

Before implementation, confirm:

* the exact hotfix branch and PR-title naming contracts
* how successful Beta evidence is attached to the Production gate
* whether a minimum Beta observation period is required by severity
* who may approve bypassing the normal release cadence
* how the rolling `release/next` PR communicates that a patch already shipped

## Acceptance criteria

This plan is implemented when Maintley can release a patch from deployed
`main`, validate it through Beta, deploy it through an explicit reviewed hotfix
PR, and reconcile it into Beta without shipping unrelated Beta features or
weakening the normal production gate.
