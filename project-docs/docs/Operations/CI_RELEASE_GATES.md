# CI and Release Gates

Last reviewed: 2026-08-02

## Purpose

Maintley uses stable aggregate checks to separate branch-protection policy from
individual workflow job names.

The promotion path is:

```text
feature branch -> beta -> release/next -> main
```

Multiple approved feature branches may merge into Beta before a release. The
single `release/next` pull request is refreshed from the latest successfully
deployed Beta commit and represents the complete pending release.

## Beta PR Gate

`Beta PR Gate` is the permanent aggregate status for a feature pull request
targeting `beta`.

During its canary period it verifies the results of:

* Change classification.
* Entitlement package version policy.
* Root unit and integration tests.
* Firestore and Storage emulator tests.
* ESLint and TypeScript validation.
* Frontend production compilation and asset budgets.
* Functions compilation and the complete Functions test manifest.

E2E, release-note preview, Hosting preview, and Beta backend readiness remain
separate visible checks during the first migration stage. The Beta ruleset
should continue requiring its existing checks until `Beta PR Gate` has reported
successfully and consistently.

## Release Gate

`Release Gate` is the stable validation status for the bot-owned
`release/next` candidate.

The release candidate continues to receive full Build Check coverage. It is not
assumed safe merely because its visible diff contains version files: the branch
promotes the entire accumulated Beta release.

After a successful canary period, Main branch protection should require
`Release Gate` instead of individual Build Check job names. Release notes and
E2E must remain required until they are incorporated into or explicitly
verified by the aggregate gate.

## Change classification

`scripts/workflowChangeClassification.cjs` classifies changed files as:

* Frontend.
* Backend.
* E2E.
* CI.
* Documentation-only.
* Release-only.

Classification initially provides evidence without reducing required coverage.
Conditional heavy-job execution should be introduced only when the permanent
gate treats an intentional skip as a successful policy decision.

Version impact follows Conventional Commit semantics. `feat` selects a minor
release, `fix` and `perf` select a patch release, and a breaking declaration
selects a major release. Internal-only `refactor`, `docs`, `chore`, `ci`,
`build`, and `test` changes have no product-version impact unless an explicit
release-impact label overrides the inference. They remain visible in engineering
notes without creating an otherwise empty customer release.

## Test manifests

Root Node tests are declared in `scripts/testManifest.cjs` and run through:

```bash
yarn test:scripts:ci
```

Functions tests use the same manifest and run through:

```bash
yarn --cwd functions build
yarn --cwd functions test:ci
```

The manifest test compares each declared list to every top-level
`.test.cjs` file. Adding a test without adding it to CI therefore fails the
suite instead of silently reducing coverage.

## Workflow policy

Run:

```bash
yarn validate:workflows
```

The workflow policy validator requires:

* Parseable YAML.
* Read-only top-level token permissions.
* Job-scoped write and OpenID Connect permissions.
* A timeout for every runner job.
* CI builds that do not suppress warning failures with `CI: false`.
* Immutable 40-character commit SHAs for every external Action.
* A visible release-version comment beside every pinned Action.
* Weekly GitHub Actions Dependabot updates targeting `beta`.

Workflow-specific write access, pull-request access, or OpenID Connect identity
access belongs on the exact job that requires it.

Production release finalization begins only after Firebase deploy succeeds and
the default production Hosting origin serves the Maintley app shell on its
public BrowserRouter routes. Tags and GitHub Releases therefore represent a
verified deployed commit rather than only a successful upload command.

Production identity verification is intentionally separate from deployment.
`.github/workflows/verify-production-deployment-identity.yml` may read project
metadata and enumerate the expected Hosting site, but it must not receive
deployment roles or replace the active production credential until its Main
canary passes and the role expansion is explicitly approved. Both the GitHub
environment policy and Google provider claim condition restrict production
identity issuance to Main.

## Ruleset rollout safety

Do not add a required status check until it has reported at least once on the
target branch. Do not remove the prior required contexts until the replacement
aggregate gate has passed its canary period.

Optional jobs must never be configured as required checks. A required context
must report for every pull request within the ruleset's scope, including when
heavy work is intentionally skipped.

Activated backend previews wait for required checks before acquiring the shared
Beta deployment lock. The deploy job revalidates the exact source SHA after it
obtains the lock, preventing an older queued request from replacing a newer PR
backend.

## Release Prep empty state

No releasable changes is a normal, structured outcome. Release Prep asks the
release-note generator to emit metadata even for an empty range and skips only
when the entry count is zero.

Git, parsing, API, or configuration errors remain failures and must not be
converted into a successful no-op.
