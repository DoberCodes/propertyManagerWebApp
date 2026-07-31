# Firebase Hosting and Browser Routing Migration Plan

Date: 2026-07-22

Status: Planned

Governing decision:
`project-docs/ADR/0028-firebase-hosting-and-browser-routing-migration.md`

## Purpose

This report is the execution checklist for Maintley's accepted migration from
GitHub Pages and `HashRouter` to Firebase Hosting and `BrowserRouter`.

It is a migration plan, not a description of the currently deployed platform.
Until cutover is complete, active documentation correctly continues to describe
GitHub Pages and hash routing.

## Release architecture audit

Audit date: 2026-07-23

This section records the release architecture that exists before implementation.
It is intentionally factual so the migration can remove duplication instead of
adding another automation layer.

### Current pull-request and web flow

* `.github/workflows/build-check.yml` is named **Build Check** and runs unit, Firestore Rules,
  Storage Rules, frontend-build, asset-budget, and Functions-build validation,
  with different behavior on `release/next`.
* `.github/workflows/e2e-tests.yml` supplies the required pull-request smoke
  check and optional broader safe suites.
* `.github/workflows/release-notes.yml` generates customer notes, engineering
  notes, and release metadata using the repository's existing merge-base or
  latest-tag convention.
* `.github/workflows/release-prep.yml` prepares the shared semantic version,
  Android `versionName`, and Android `versionCode`, then updates
  `release/next`.
* `.github/workflows/deploy-web.yml` builds and deploys the public web
  application through `gh-pages`. Its path trigger currently includes broad
  package and Android version files.
* `.github/workflows/firebase-deploy-environments.yml` independently repeats
  installation, test, and frontend-build work before determining whether
  Functions or rules need deployment.
* `.github/workflows/publish-app-version.yml` writes the customer-facing
  application version record to Firestore. It does not upload to or verify a
  Google Play release.

### Current Android flow

* Android release work is initiated locally through `yarn build:signed`.
* `build-signed-apk.sh` currently combines repository checks, release-note
  retrieval, tests, web build, temporary homepage mutation, Capacitor sync,
  Gradle APK and AAB builds, signing, GitHub Release creation, artifact upload,
  URL verification, and the Firestore published-version dispatch.
* The current command requires both an APK and an AAB even though Google Play
  distribution uses the AAB.
* Android tests in the current shell flow are not a reliable blocking gate.
* The repository validates that the prepared `versionCode` is positive, but it
  does not compare it with the highest value already uploaded to Google Play.
* No Google Play Developer API client, track upload, Play service-account
  configuration, or internal-testing release validation currently exists.
* The legacy `build:apk` path is not part of the intended release architecture
  and must not be reused as the replacement for the signed flow.

### Gaps and risks to remove

* Frontend install, test, and build work is duplicated across multiple Actions.
* A package-script or dependency-only change can currently trigger a production
  web deployment because of the broad web workflow path filter.
* Web deployment can succeed without a matching tag and GitHub Release because
  final release creation is coupled to the local Android command.
* The monolithic Android shell script obscures which failures are validation,
  build, signing, GitHub archival, Play distribution, or publication failures.
* Temporary mutation of shared package metadata creates an avoidable dirty-tree
  and failed-restoration risk.
* Requiring an APK adds build time and another artifact without a documented
  distribution purpose.
* Publishing the Firestore application-version record before Play production
  would advertise a release that customers cannot yet receive.
* The current Android manifest has no verified App Link intent and the
  application has no complete Capacitor URL-open path for BrowserRouter links.
* Web service-worker and relative-asset assumptions are not yet separated from
  packaged Android build behavior.
* The current required-check set does not make every existing validation job a
  merge gate. Required checks must be reconciled when workflows are restructured.

## Target release architecture

The release pipeline will have two independent lanes that reuse one prepared
repository version and the existing generated release notes.

```text
Pull request validation
        |
Release preparation
        |
        +--> Web build --> web deploy --> tag and GitHub Release
        |
        +--> explicit local yarn build:signed
                    |
              validate and sync
                    |
              signed AAB
                    |
          Play internal testing
                    |
           test Play-installed app
                    |
        production review + managed publishing
                    |
        coordinated production publish
                    |
       publish customer-facing version
```

### Web lane

* GitHub Actions owns pull-request validation, release-note generation, version
  preparation, web deployment, tags, and GitHub Releases.
* Web finalization must not wait for or invoke an Android build.
* A web version may never be selected for Google Play.
* The GitHub Release is the release-note and source-version record. The local
  Android flow may attach its AAB to an existing matching release for archival
  purposes, but it must not create, redefine, or block that web release.
* Existing note-generation and semantic-version conventions remain the source
  for web and Play release metadata.

### Local Android lane

* `yarn build:signed` remains the single operator-facing entry point.
* GitHub Actions will not build, sign, or submit Android releases.
* The command will be a thin orchestrator over focused validation, web-assets,
  Capacitor-sync, bundle, signing, verification, and Play-upload stages.
* The full release mode uploads to Google Play internal testing. A documented
  validation-only or build-only mode must remain available for local diagnosis.
* `bundleRelease` produces one signed AAB. `assembleRelease` and APK copying,
  naming, verification, and upload are removed from the normal path.
* The command uses the prepared repository version; it does not create an
  unrelated Android-only semantic version.
* Before building or uploading, the command verifies that the prepared
  `versionCode` is higher than every code already uploaded to Play.
* Version-code gaps are valid because Maintley deliberately selects which web
  releases become Android releases.
* An internal-testing upload consumes its `versionCode`, even if it is never
  promoted. Any changed replacement build requires a higher code.
* The Play-installed internal build is the release candidate. After validation,
  the operator promotes that exact AAB and version into production review with
  Managed Publishing enabled; no rebuild or new version number is introduced.
* The customer-facing Firestore version is updated only after coordinated
  production publication and rollout confirmation.

## Authoritative execution sequence

This sequence governs implementation order. The release and hosting checklists
later in this report define deliverables by workstream; their numbering does not
create a second chronology.

### Execution Phase A: Release foundation on the current platform

* Complete release checklists R0 through R3 while GitHub Pages and `HashRouter`
  remain the production architecture.
* Capture the URL, hosting, PWA, Android, version, signing, Play, and rollback
  inventories in hosting checklist H0.
* Decouple web deployment, tags, GitHub Releases, and release notes from Android.
* Refactor `yarn build:signed` into the local AAB-only orchestration path.
* Establish explicit web and Capacitor build profiles.
* Configure least-privilege local Play internal-track access.
* Prove that a current-routing AAB can be uploaded and installed from internal
  testing. Production promotion is not required for this pipeline proof.

Exit gate: a web release can finish without Android, and the local Android flow
can create and distribute a signed AAB to internal testing without publishing a
customer-facing version.

### Execution Phase B: Firebase foundation without a router change

* Deploy the existing `HashRouter` build to a Firebase preview host.
* Complete the preview portions of hosting checklists H2 and H7.
* Validate public pages, articles, assets, headers, caching, service-worker
  behavior, error responses, and the existing application shell.
* Keep GitHub Pages and its production domain unchanged.
* Document Firebase preview deployment and rollback before enabling production.

Exit gate: Firebase Hosting can serve the current application faithfully, so
later failures can be attributed to routing rather than hosting foundation.

### Execution Phase C: Routing, URL, PWA, and native-link migration

* Complete hosting checklists H3 through H5 against Firebase preview.
* Replace `HashRouter` with `BrowserRouter` and migrate every URL producer,
  callback, canonical link, test, and stored destination in the approved inventory.
* Add Capacitor URL-open handling and verified HTTPS Android App Links.
* Publish `/.well-known/assetlinks.json` on the current canonical host before
  Android validation, then preserve the identical file on Firebase Hosting.
* Separate hosted-PWA service-worker behavior from packaged Android behavior.
* Confirm static public resources take precedence over the SPA fallback.
* Retain no permanent legacy hash-route compatibility layer.

Exit gate: clean routes, callbacks, public content, PWA behavior, and native-link
handling pass on preview and in local packaged-app validation.

### Execution Phase D: Cross-platform migration candidate

* Deploy one source commit to the Firebase preview environment.
* Run `yarn build:signed` from that exact commit and upload its signed AAB to
  internal testing.
* Complete release checklist R4 and hosting checklist H6 using the Play-installed
  application, not a sideloaded artifact.
* Validate BrowserRouter navigation, packaged assets, App Links, authentication,
  Stripe returns, notifications, PWA updates, and representative protected routes.
* If code or packaged assets change, reject the candidate and prepare a new,
  higher `versionCode`.

Exit gate: the exact web commit and Play-installed AAB are approved as the
coordinated production candidates.

### Execution Phase E: Prepare coordinated production publication

* Turn on Google Play Managed Publishing and confirm the existing application is
  eligible to use it.
* Promote the approved internal AAB into the production track and send it for
  review without making it publicly available.
* Wait until Play reports the update as ready to publish.
* Complete hosting checklists H7 and H8, including Firebase production deploy,
  DNS, TLS, custom-domain, and rollback preparation.
* Schedule the cutover only when both Firebase and the reviewed Android release
  are ready.

Exit gate: the web candidate is deployable, the unchanged Android candidate is
approved and held for publication, and both rollback procedures are ready.

### Execution Phase F: Coordinated production cutover

* Deploy the approved web commit to Firebase Hosting and move the custom domain.
* Run the critical public-page, authentication, billing, callback, PWA, and App
  Link smoke checks in hosting checklist H9.
* If the web smoke gate passes, publish the held Android update through Managed
  Publishing. If it fails, roll the web back and leave Android unpublished.
* Confirm Google Play serves the expected `versionCode` before updating the
  Firestore published-version record.
* Begin with a staged Android rollout when the account and release support it.

Exit gate: Firebase serves the clean-route web application, Play serves the
tested AAB, and customer-facing version data matches production reality.

### Execution Phase G: Observation and cleanup

* Complete the observation window with GitHub Pages retained as the web rollback
  target.
* Monitor routing failures, authentication and Stripe returns, service-worker
  updates, App Links, Android crashes, ANRs, and Play rollout health.
* Complete hosting checklist H10 only after the observation gate passes.
* Remove obsolete Pages, hash-routing, APK-release, and superseded documentation.
* Verify repository privacy no longer affects production availability.

Exit gate: Firebase Hosting and BrowserRouter are authoritative, the Android
release path is AAB-only and local, and all temporary rollback dependencies have
been retired.

## Release pipeline implementation workstream

The release checklists below define the release-pipeline deliverables used by
the authoritative sequence. R0 through R3 execute in Phase A, R4 executes in
Phase D, and R5 spans Phases E and F.

### Release checklist R0: Capture baselines

* [ ] Record the last web tag, deployed commit, GitHub Release, prepared version,
  Android `versionCode`, and highest Play-uploaded `versionCode`.
* [ ] Record all required branch-protection checks and their workflow/job owners.
* [ ] Record existing local keystore location, alias, certificate fingerprint,
  backup procedure, and Play App Signing status without recording passwords.
* [ ] Record the current internal tester list and Play production availability.
* [ ] Confirm the Firebase published-version document and when clients consume it.
* [ ] Verify the current release-note artifact names and metadata contract.

### Release checklist R1: Decouple web finalization

* [ ] Make tag and GitHub Release creation a web/repository responsibility.
* [x] Add a Firebase-only reusable workflow that owns immutable tag and GitHub
  Release creation after a successful hosting deployment.
* [ ] Ensure a web-only version can be prepared, deployed, tagged, and released
  without running `yarn build:signed`.
* [ ] Ensure an Android AAB can be attached later without changing release notes
  or replacing an already published artifact.
* [ ] Narrow the web deployment trigger to actual deploy inputs.
* [ ] Consolidate repeated install, test, and build work where artifacts can be
  passed safely between jobs.
* [ ] Reconcile required checks so renamed or consolidated jobs cannot bypass
  validation.
* [ ] Preserve current customer and engineering release-note generation.

### Release checklist R2: Refactor the local Android command

* [ ] Keep `yarn build:signed` as the public command while splitting its
  internals into focused, directly testable stages.
* [ ] Make repository cleanliness, tool availability, GitHub authentication when
  archival is used, signing configuration, and Play authentication explicit
  preflight checks.
* [ ] Make unit, rules, frontend, and Android validation blocking.
* [ ] Replace temporary `homepage` mutation with explicit web and Android build
  profiles.
* [ ] Build web assets with the Android profile and run Capacitor sync exactly
  once from the validated output.
* [ ] Run only Gradle `bundleRelease` for the normal release.
* [ ] Verify AAB package name, version, signature, and expected source commit.
* [ ] Remove APK production, copy, naming, GitHub upload, and required-file checks.
* [ ] Preserve a clearly named non-release debug-install path if local device
  diagnosis still needs an installable APK.
* [ ] Make failure leave the worktree clean and leave no partially published
  customer-facing version.

### Release checklist R3: Configure local Google Play submission

* [ ] Enable the Google Play Android Developer API for the owning Google Cloud
  project.
* [ ] Create or select a dedicated service account and grant only the app and
  release permissions required for internal-track management.
* [ ] Store the service-account JSON outside the repository and reference it by
  a local environment variable or protected configuration path.
* [ ] Configure the internal testing track and tester access in Play Console.
* [ ] Confirm the package name is `com.maintleyapp` and the upload certificate
  matches Play Console.
* [ ] Add a read-only Play preflight that obtains existing track/version data.
* [ ] Add an edit transaction that uploads the AAB, assigns it to the internal
  track, applies generated release notes, and commits only after validation.
* [ ] Verify a failed transaction does not update Firestore or claim production
  availability.
* [ ] Document initial Play Console/API authorization and credential-rotation
  procedures.

### Release checklist R4: Validate internal testing

* [ ] Install the candidate through Google Play rather than sideloading it.
* [ ] Confirm the delivered `versionCode`, `versionName`, package, and signing
  certificate.
* [ ] Run hosting checklist H6 against the Play-installed build.
* [ ] Validate Stripe, authentication, email, notification, and deep-link returns.
* [ ] Review Play pre-launch, crash, ANR, and device-compatibility results.
* [ ] Record approval or rejection of the candidate.
* [ ] If rejected, prepare a changed release with a new, higher `versionCode`;
  never overwrite or reuse the rejected code.

### Release checklist R5: Prepare, coordinate, and publish

* [ ] Turn on Managed Publishing and confirm the existing app is eligible.
* [ ] Promote the approved internal AAB into the production track and send it
  for review without publishing it to customers.
* [ ] Reuse the same AAB, `versionCode`, and `versionName`; do not rebuild.
* [ ] Wait until Play reports the update as ready to publish.
* [ ] Publish the held update only after the Firebase production smoke gate passes.
* [ ] Use a staged rollout when appropriate.
* [ ] Confirm the production track serves the expected version.
* [ ] Only then update the Firestore published-version record and customer-facing
  Play link.
* [ ] Preserve the internal validation evidence, review result, and rollout
  result with the matching GitHub Release or release record.

## Local secrets and protected material

None of the following belongs in Git, generated build artifacts, logs, release
notes, or GitHub Actions for this phase:

* Android upload keystore
* keystore and key passwords
* Google Play service-account JSON
* local Firebase administrative credentials used by publication tooling
* access tokens generated for local GitHub release archival

The implementation report must name the supported environment variables and
local paths once chosen. Preflight output may confirm that a credential exists,
but must never print its contents. The keystore and service account require
separate secure backups and documented rotation/revocation procedures.

## Interaction with Firebase Hosting and BrowserRouter

The release restructuring and hosting migration share these validation gates:

* Web and Android builds need explicit profiles rather than temporary package
  metadata changes. The Firebase web build may use root-relative browser assets;
  the Capacitor build must use packaged asset paths that work from the native
  application shell.
* Capacitor sync must consume the exact Android-profile web output that is later
  bundled and uploaded.
* BrowserRouter routes used from Android require a defined native URL-open
  handler and verified HTTPS App Links. Firebase Hosting must serve the required
  `/.well-known/assetlinks.json` without the SPA rewrite intercepting it.
* Android intent filters, Capacitor `appUrlOpen` handling, authentication links,
  Stripe success/cancel returns, and notification links must agree on the final
  canonical HTTPS routes.
* Service-worker registration and offline caching must be explicitly limited to
  the hosted PWA where packaged Android behavior differs.
* The final Android migration gate is the internal-testing AAB installed from
  Play, not only a local Gradle success.
* The exact tested commit and AAB must remain unchanged between internal testing
  and production promotion.

## Hosting checklist H0: Discovery and URL inventory

* [ ] Inventory every React Router navigation path and helper.
* [ ] Inventory Stripe success, cancellation, and Customer Portal return URLs.
* [ ] Inventory admin billing and promotion URLs.
* [ ] Inventory authentication, password-reset, and email-verification URLs.
* [ ] Inventory family, team, and tenant invitation URLs.
* [ ] Inventory email, notification, support, and deep-link URLs.
* [ ] Inventory analytics route handling.
* [ ] Inventory canonical URLs, sitemap entries, and robots directives.
* [ ] Inventory public calls to action, internal links, and marketing pages.
* [ ] Inventory Android intents and callback handling where applicable.
* [ ] Inventory all static public pages and SEO pages.
* [ ] Inventory static assets, manifest, service worker, and offline files.
* [ ] Inventory Firebase Hosting route, rewrite, header, cache, and deploy needs.
* [ ] Define and document separate web and Android build profiles.
* [ ] Inventory PWA scope, installation, navigation, caching, and updates.
* [ ] Review and approve the inventories before introducing `BrowserRouter`.
* [ ] Record baseline Lighthouse, PWA, asset, and critical-route checks.
* [ ] Inventory current branch protections, release-prep behavior, and deployment triggers.
* [ ] Inventory production GitHub secrets, variables, Firebase identities, and external providers by environment.

## Phase 0A: Development environment and promotion model

* [x] Create or confirm the dedicated development Firebase project.
* [x] Link a development billing account or budget only where required by deployed services.
* [x] Register the development web app and Hosting site.
* [ ] Configure separate development Auth, Firestore, Storage, Functions, Hosting, and Analytics resources.
* [ ] Create least-privilege development and production GitHub deployment environments.
* [ ] Create separate deployment identities and credentials for development and production.
* [ ] Configure development Stripe test credentials and webhook destinations.
* [ ] Configure development AI, OCR, email, and other provider credentials or explicit feature suppression.
* [ ] Disable or redirect customer lifecycle communications in development.
* [ ] Create synthetic development seed data; do not copy production customer data.
* [ ] Create and protect the `beta` integration branch.
* [ ] Require feature pull requests to target `beta` under the normal development flow.
* [ ] Define the release PR as promotion from `beta` into `main` with prepared version files and notes.
* [x] Define a non-destructive post-release synchronization procedure from `main` back to `beta`.
  * Use a protected `main` to `beta` pull request completed with **Create a
    merge commit**. Feature PRs may remain squash-merged, but long-lived branch
    synchronization must preserve ancestry and must never force-push `beta`.
* [ ] Record environment ownership, cost budgets, secret rotation, and emergency access procedures.

### Development Firebase inventory — 2026-07-30

* Project ID: `maintleybeta`
* Project number: `638085464341`
* Project owner account used for bootstrap: `doberfamilyventures@gmail.com`
* Existing active web app: confirmed
* Default Hosting site: `maintleybeta.web.app`
* Analytics measurement configuration: confirmed and separate from production
* Default Firestore database: created as Standard edition in `nam5`
* Firestore access: Maintley's reviewed rules deployed successfully on 2026-07-30 after emulator-backed Build Check validation
* Hosting preview channels: none beyond the live channel
* Blaze billing: confirmed active
* Functions platform APIs: enabled without deploying application code
* Functions deployment inventory: 98 expected callable, event, and scheduled Functions deployed and reconciled without unexpected exports
* Default Firebase Storage bucket: `maintleybeta.firebasestorage.app`, provisioned in `US-CENTRAL1`
* Cloud Storage for Firebase API: enabled; Firebase linkage verified
* Storage rules and files: Maintley's reviewed Storage rules deployed successfully on 2026-07-30; no production files were copied during bootstrap
* Authentication: initialized with email/password sign-in and improved email privacy enabled
* Authentication exclusions: anonymous sign-in and MFA disabled; no federated providers configured
* Authorized Auth domains: `localhost`, `maintleybeta.firebaseapp.com`, and `maintleybeta.web.app`
* Authentication user inventory: empty; no production users or credentials copied
* Authentication email templates and Functions integrations: left at the isolated development baseline pending the email and Functions phases
* GitHub environment: `development`, with no GitHub-stored application secrets or reviewer gate configured during the identity bootstrap
* Development deployment authentication: keyless Workload Identity Federation restricted to this repository and the `development` environment
* Development deployment service account: dedicated to `maintleybeta`; preview-stage access is limited to Firebase Hosting Admin, API Keys Viewer, Secret Manager Viewer, and Service Usage Viewer
* Development deployment variables: project ID, Workload Identity provider, and service-account identifiers stored as GitHub environment variables
* Development frontend variables: public Maintley Beta Firebase web configuration stored separately from production in the GitHub `development` environment
* Deployment identity verification: IAM bindings, provider conditions, Secret Manager metadata visibility, Service Usage visibility, and Hosting preview deployment verified in PR #132
* Development billing boundary: Stripe test-mode publishable and server credentials are configured separately; production Stripe credentials are not reused
* Development Stripe frontend: test-mode publishable key configured in the GitHub `development` environment; production publishable key remains excluded
* Hosting targets: explicit `beta` and `prod` target mappings added without deploying either live channel
* Hosting preview workflow: same-repository pull requests targeting `beta` build without deployment credentials, then deploy only the static artifact to a seven-day Maintley Beta preview channel
* Hosting preview verification: Beta-configured local production build and PR #132's isolated GitHub preview deployment passed; backend readiness confirmed required non-secret configuration, API availability, and secret metadata without reading secret values

No production customer data, production service credentials, or synthetic seed
records were copied into the development project during bootstrap.

## Hosting checklist H1: Final GitHub Pages release and migration freeze

* [x] Merge the current bug fixes.
* [x] Merge the paywall and checkout refactor.
* [x] Deploy the final planned GitHub Pages release at version 2.12.4.
* [ ] Verify production stability.
* [x] Record the current production build, workflow, and rollback state.
* [x] Remove the automatic GitHub Pages deployment workflow.
* [x] Guard the local `deploy` and `deploy:gh-pages` commands.
* [x] Enforce the Pages freeze in normal and release-version PR validation.
* [ ] Merge the deployment freeze to `main`.
* [ ] Freeze hosting and routing changes outside the migration branch.

## Hosting checklist H2: Firebase Hosting foundation

* [x] Confirm the production Firebase project and hosting site name.
* [x] Confirm the development Firebase project and hosting site name.
* [x] Initialize Firebase Hosting without changing the production domain.
* [x] Add Hosting configuration with explicit development and production project targets.
* [x] Configure public files and SPA fallback ordering.
* [x] Configure appropriate security and cache headers.
* [x] Confirm private Firebase or customer data is never cached as static content.
* [ ] Deploy the candidate build to the development Firebase `*.web.app` host.
* [ ] Verify assets, static pages, error responses, and the React application shell.
* [ ] Verify no preview build contains production Firebase or Analytics configuration.

## Hosting checklist H3: BrowserRouter and build behavior

Implementation note (2026-07-30): Firebase web builds now select
`BrowserRouter` and root-relative assets. Packaged Android uses an explicit,
temporary hash-routing profile until H6 native validation is complete. This
does not preserve hash routes on either Firebase web host.

The Hosting-only stage intentionally leaves Function-generated checkout,
email, invitation, and support URLs unchanged. Those producers move with the
Functions routing and DNS phase so deployed backend links cannot lead users to
an uncut-over custom domain.

* [ ] Replace `HashRouter` with `BrowserRouter`.
* [ ] Remove hash-routing helpers and assumptions.
* [ ] Review `package.json` `homepage`, `PUBLIC_URL`, and generated asset paths.
* [ ] Introduce explicit web and Android build profiles if their asset bases differ.
* [ ] Verify public routes through direct navigation and refresh.
* [ ] Verify authentication routes through direct navigation and refresh.
* [ ] Verify protected routes through direct navigation and refresh.
* [ ] Verify parameterized property, equipment, and maintenance-history routes.
* [ ] Verify unknown-route and unauthorized-route behavior.
* [ ] Confirm no supported application route requires `/#/`.

## Hosting checklist H4: URL producer and callback migration

* [ ] Update Stripe Checkout success URLs.
* [ ] Update Stripe Checkout cancellation and failure URLs.
* [ ] Update Stripe Customer Portal return URLs.
* [ ] Update admin billing and promotion checkout URLs.
* [ ] Update registration and onboarding redirects.
* [ ] Update Firebase Authentication authorized domains.
* [ ] Update password-reset and email-verification destinations.
* [ ] Update family, team, and tenant invitation destinations.
* [ ] Update notification, email, support, and deep-link destinations.
* [ ] Update public calls to action and internal navigation links.
* [ ] Update analytics route normalization for BrowserRouter.
* [ ] Update automated tests and fixtures containing hash URLs.
* [ ] Search the repository for remaining production `/#/` URL generation.

## Hosting checklist H5: Public site, SEO, and PWA

* [ ] Preserve every intended static public and article URL.
* [ ] Ensure valid static files take precedence over the SPA fallback.
* [ ] Update canonical URLs, sitemap entries, robots directives, and structured data.
* [ ] Update internal links to the final clean routes.
* [ ] Review duplicate and historical public URL redirects.
* [ ] Verify manifest start URL, scope, icons, and install metadata.
* [ ] Verify service-worker registration and update behavior.
* [ ] Verify offline fallback behavior.
* [ ] Verify service-worker navigation does not mask new deployments.
* [ ] Reconfirm that private property data and Firebase responses are not cached.
* [ ] Run the public metadata and SEO validation scripts.
* [ ] Run asset-budget and Lighthouse checks.

## Hosting checklist H6: Android and mobile release gate

* [ ] Build the Capacitor Android application with the new routing configuration.
* [ ] Verify cold start and warm resume.
* [ ] Verify login, logout, registration, and password reset.
* [ ] Verify internal navigation and hardware-back behavior.
* [ ] Verify property, equipment, task, report, and intelligence routes.
* [ ] Verify Stripe handoff and return behavior on Android.
* [ ] Verify email, notification, and supported deep-link behavior.
* [ ] Verify static assets and offline shell loading in the packaged app.
* [ ] Confirm no Android code or generated asset still depends on hash routing.
* [ ] Upload the signed AAB to the Google Play internal testing track.
* [ ] Install and validate the release through Google Play.
* [ ] Confirm the tested AAB can be promoted unchanged to production.
* [ ] Confirm APK generation is not required by the normal release path.

## Hosting checklist H7: Firebase web deployment

Implementation note (2026-07-30): the production release workflow uploads the
validated web artifact, requires an exact release merge, deploys
`hosting:prod`, conditionally adds changed backend targets, and invokes the
idempotent finalizer only after deployment succeeds. The first production
execution remains a validation gate before the items below are marked complete.

* [x] Add Firebase Hosting preview deployment for feature pull requests targeting `beta`.
* [x] Give each pull request an isolated, expiring Hosting preview channel and surface its URL on the PR.
* [x] Keep PR previews on the stable development backend; do not deploy shared Functions or rules per PR.
* [x] Retain required build, unit, rules, entitlement-package, Functions, E2E, asset-budget, and release-note validation for pull requests targeting `beta`.
* [ ] Add stable development Hosting, Functions, Firestore rules, and Storage rules deployment after merge to `beta`.
  * The deployment workflow is implemented; keep this item open until the first
    merged Beta commit has deployed stable Hosting successfully and each
    conditional backend target has been exercised with its least-privilege IAM
    grants.
* [ ] Add production Hosting, Functions, Firestore rules, and Storage rules deployment after the release PR merges to `main`.
* [ ] Use separate, least-privilege development and production deployment identities.
* [x] Configure environment-specific secrets without committing credentials.
* [ ] Update Release Prep so the release branch promotes the approved `beta` state into `main` rather than acting as a version-only branch.
  * The reusable promotion workflow is implemented; keep this item open until
    the first successful stable Beta deployment updates the existing
    `release/next` PR and its full release validation passes.
* [ ] Gate production deployment on an exact `Release vX.Y.Z` merge and synchronized version files.
* [ ] Generate final customer release notes from the preceding merged release boundary.
* [ ] Create the matching Git tag and GitHub Release only after every required production deployment succeeds.
* [ ] Make release publication idempotent and fail if an existing tag points to a different commit.
* [ ] Keep the local Android script limited to attaching or replacing APK and AAB assets on the existing release.
* [ ] Verify ordinary merges into `beta` cannot deploy production or create tags/releases.
* [ ] Verify failed builds cannot replace the active production release.
* [ ] Verify failed Functions, rules, Storage, or Hosting deployment cannot publish the release tag.
* [ ] Verify preview channel cleanup and expiration.
* [ ] Document deployment and rollback commands.

## Hosting checklist H8: Custom domain and DNS cutover

* [ ] Confirm the authoritative DNS provider and current records.
* [ ] Lower DNS TTL with sufficient lead time.
* [ ] Add the Maintley production custom domain to Firebase Hosting.
* [ ] Complete domain ownership verification.
* [ ] Add the Firebase-required DNS records.
* [ ] Verify DNS propagation.
* [ ] Verify the Firebase-managed TLS certificate.
* [ ] Confirm the apex and intended `www` behavior.
* [ ] Confirm redirects preserve HTTPS and the canonical host.
* [ ] Keep GitHub Pages available as the rollback target during validation.

## Hosting checklist H9: Production validation

* [ ] Homepage and primary public pages
* [ ] Resource articles and SEO metadata
* [ ] Login and logout
* [ ] Registration
* [ ] Free-plan onboarding
* [ ] Paid-plan checkout and confirmation
* [ ] Checkout cancellation and failure
* [ ] Promotion-code checkout
* [ ] Password reset and email verification
* [ ] Dashboard
* [ ] Properties and property deep links
* [ ] Equipment
* [ ] Tasks
* [ ] Maintenance history
* [ ] Maintley Intelligence
* [ ] Reports
* [ ] PWA install, launch, update, and offline fallback
* [ ] Android routing, authentication, and checkout return
* [ ] Browser refresh on representative nested routes
* [ ] Unknown-route and authorization behavior
* [ ] Production analytics without customer-sensitive URL data
* [ ] Development events remain absent from production Analytics
* [ ] Development Auth, Firestore, Storage, and Functions activity remains isolated from production
* [ ] Release tag and GitHub Release point to the exact deployed release merge
* [ ] Android artifacts can be attached without rewriting the release notes

## Hosting checklist H10: Observation, cleanup, and documentation

* [ ] Complete the agreed post-cutover observation period.
* [ ] Confirm Firebase Hosting logs and monitoring show no critical routing failures.
* [ ] Confirm no active production link still generates `/#/`.
* [ ] Disable GitHub Pages.
* [ ] Remove the GitHub Pages deployment workflow and obsolete configuration.
* [ ] Remove the `gh-pages` deployment dependency and scripts.
* [ ] Make the repository private.
* [ ] Verify production remains available after the visibility change.
* [ ] Update active deployment and technical-architecture documentation.
* [ ] Update PWA, SEO, testing, scripts, and contributor documentation.
* [ ] Archive superseded GitHub Pages instructions.
* [ ] Record the completed migration date in ADR 0028.
* [ ] Confirm branch protections enforce the `feature → beta → main release` promotion path.
* [ ] Confirm stale preview channels are expired or removed.

## Rollback criteria

Rollback to the last verified GitHub Pages release during the cutover window if
any of these cannot be corrected safely in place:

* production authentication or protected routing fails
* Stripe success or cancellation returns fail
* public pages or critical assets are shadowed by rewrites
* the PWA enters an unrecoverable cached state
* Android authentication or primary navigation is broken
* the custom domain or TLS certificate is materially unavailable

The exact DNS and deployment rollback steps must be documented and verified
before the production DNS switch.

### Android release rollback and recovery

* If the Play candidate is not ready to publish, postpone the coordinated
  cutover.
* If the Firebase smoke gate fails while Android is held, roll the web back and
  leave the Android update unpublished.
* Before production publication, reject or deactivate an internal candidate and
  leave the current production release unchanged.
* A Play-uploaded `versionCode` remains consumed. A corrected build must use a
  new, higher value.
* During a production staged rollout, halt the rollout when Play permits and
  assess whether resumption or a new corrective release is safer.
* After full production rollout, recovery requires a new signed AAB with a
  higher `versionCode`; an older bundle cannot be restored under its old code.
* Web rollback remains independent and must not rebuild or silently change the
  Android release.
* Compromised local Play or signing credentials must be revoked or rotated
  before any further upload.

## Completion criteria

The migration is complete only when all ADR 0028 success criteria pass, the
observation period is complete, GitHub Pages is removed from production, and
the authoritative current-state documentation describes Firebase Hosting and
BrowserRouter.

The release-pipeline portion is complete when:

* web releases deploy, tag, and publish notes without an Android build
* `yarn build:signed` produces one verified signed AAB and no release APK
* the local command performs a Play version preflight and uploads explicitly to
  internal testing
* the Play-installed candidate passes the Android and routing gates
* the same tested AAB passes production review and is published deliberately
  through Managed Publishing
* Firestore publication occurs only after production confirmation
* local credentials, failure recovery, and operator steps are documented
