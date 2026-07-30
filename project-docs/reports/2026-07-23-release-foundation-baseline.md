# Release Foundation Baseline

Date: 2026-07-23

Status: In progress

Governing decision:
`project-docs/ADR/0028-firebase-hosting-and-browser-routing-migration.md`

Execution plan:
`project-docs/reports/2026-07-22-firebase-hosting-migration-plan.md`

## Purpose

This report records the release and deployment state at the start of execution
Phase A. It contains operational evidence, not credentials. Unknown Google Play
values remain explicit gates rather than inferred values.

## Source and version baseline

* Canonical repository: `DoberFamilyVentures/propertyManagerWebApp`
* Default branch: `main`
* Baseline `origin/main` commit: `06860802bd31996a07a3bce0a40f091f45ccefb7`
* Root package version: `2.8.3`
* Client package version: `2.8.3`
* Android `versionName`: `2.8.3`
* Android `versionCode`: `152`
* Latest Git tag at audit time: `v2.8.2`
* Latest GitHub Release at audit time: `v2.8.2`
* Latest GitHub Release target: `bf6c6fedf61fef2a043ea10f408c64ae36d2b953`
* Latest GitHub Release assets: one AAB and one APK

The repository and deployed web version are ahead of the latest GitHub tag and
Release. This confirms that web deployment can complete while release
finalization remains coupled to the local Android command.

## GitHub Pages baseline and freeze

The final verified Pages deployment before the freeze was initiated from
`main` commit `06860802bd31996a07a3bce0a40f091f45ccefb7`:

* Deploy Web run: `29980693261`
* Pages build/deployment run: `29980762765`
* Resulting `gh-pages` commit: `879b08e91946c3860808798bbb612c2245da8a60`
* Run conclusion: successful

The release-foundation branch establishes these controls:

* The automatic `.github/workflows/deploy-web.yml` workflow is removed.
* `yarn validate:deployment-freeze` verifies the guarded lifecycle commands,
  removed workflow, and absence of Pages deployment steps in active workflows.
* `.github/workflows/finalize-web-release.yml` can be called only by a future
  hosting workflow and refuses any target other than Firebase Hosting.
* `yarn deploy` fails through `scripts/assertGitHubPagesFrozen.cjs`.
* `yarn deploy:gh-pages` fails through the same guard.
* No Firebase production-hosting deployment is introduced by the freeze.
* The existing Pages deployment remains online and unchanged as the current
  production site and migration rollback target.

The freeze is operational on `main` only after this branch is merged. Until
then, no version-file PR or manual Pages deployment should be merged or run.

## Pull-request validation baseline

The active repository ruleset is `DoberFamilyRuleSet` on the default branch.
It requires a pull request, code-owner review behavior, resolved review threads,
strict required checks, and prevents deletion and non-fast-forward updates.

Required status contexts:

* `build`
* `unit-test`
* `e2e`
* `generate-release-notes`

The Pages freeze does not remove or comment out these validations.

## Workflow ownership baseline

### Build Check

File: `.github/workflows/deploy-github-pages.yml`

Despite its historical filename, this workflow owns validation rather than
deployment. It supplies `unit-test` and `build`, plus Firestore, Storage,
release-version policy, and Functions-build validation.

### E2E Tests

File: `.github/workflows/e2e-tests.yml`

This workflow supplies the required `e2e` context for normal pull requests.
The `release/next` pull request was skipped in the most recent baseline run,
which must be reconciled with the required-check policy.

### Release Notes

File: `.github/workflows/release-notes.yml`

This workflow supplies `generate-release-notes` and generates customer,
engineering, and structured release metadata. The most recent `release/next`
run was skipped, so release-PR check behavior must remain explicit.

### Release Prep

File: `.github/workflows/release-prep.yml`

This workflow prepares the shared repository, client, and Android versions and
updates `release/next`.

### Firebase Environments

File: `.github/workflows/firebase-deploy-environments.yml`

This workflow runs on every push to `main`, repeats root installation, test,
and frontend build work, then determines whether Functions or rules require
deployment.

### Publish App Version

File: `.github/workflows/publish-app-version.yml`

This manual workflow writes the customer-facing Firestore application version.
It does not verify Google Play production availability.

## Local Android baseline

* Operator entry point: `yarn build:signed`
* Implementation: `build-signed-apk.sh`
* Expected root upload keystore: present at audit time
* `KEYSTORE_PASSWORD` environment variable: not set in the audit shell
* `GOOGLE_APPLICATION_CREDENTIALS` environment variable: not set
* `PLAY_SERVICE_ACCOUNT_JSON` environment variable: not set
* Package: `com.maintleyapp`
* Normal script output before migration: signed APK and signed AAB
* GitHub Release behavior before migration: create or edit a release and
  replace both artifacts
* Published-version behavior before migration: dispatch Firestore publication
  after GitHub artifact handling
* Google Play upload behavior before migration: none

No credential value was read or recorded.

## Google Play values requiring operator or API confirmation

The following values cannot be safely inferred from Git history:

* highest `versionCode` ever uploaded to any Play track
* current production `versionCode` and `versionName`
* Play App Signing and upload-certificate fingerprints
* Managed Publishing eligibility and current setting
* internal-testing track configuration and tester access
* service-account project, app access, and least-privilege permissions

These are blocking inputs for release checklist R3 and production preparation,
not for the GitHub Pages freeze.

## Phase A baseline exit checks

* [x] Record repository commit and synchronized version surfaces.
* [x] Record latest tag, GitHub Release, and release artifacts.
* [x] Record the last successful GitHub Pages deployment.
* [x] Record required status-check contexts.
* [x] Record current workflow ownership and duplication.
* [x] Record signing and Play credential presence without exposing values.
* [ ] Confirm Google Play version and signing values.
* [ ] Confirm internal-testing and Managed Publishing configuration.
* [ ] Merge the Pages freeze to `main`.
