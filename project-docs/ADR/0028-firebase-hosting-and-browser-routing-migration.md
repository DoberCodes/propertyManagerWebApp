# ADR 0028: Firebase Hosting and Browser Routing Migration

Status: Accepted - phased implementation

Date: 2026-07-22

Related ADR: `0016-maintley-progressive-web-app-support.md`

Companion report: `project-docs/reports/2026-07-22-firebase-hosting-migration-plan.md`

Amended: 2026-07-30 — development environment, beta branch, preview channels,
and release-gated production deployment

Amended: 2026-07-30 - staged web routing cutover and transitional Android build
profile

Amended: 2026-07-31 - guarded direct Beta reference alignment after release

Amended: 2026-07-31 - opt-in shared Beta backend previews for trusted pull requests

## Implementation Tracking

- [x] Establish separate development and production Firebase environments.
- [x] Deploy pull-request previews and the stable Beta frontend through Firebase Hosting.
- [x] Use clean browser-history routes and Firebase SPA rewrites for web builds.
- [x] Keep an explicit transitional hash-routing profile for packaged Android builds.
- [x] Deploy the production web build to the default Firebase Hosting domains.
- [x] Gate production deployment on an approved release merge and publish immutable release metadata only after deployment succeeds.
- [x] Add guarded, non-forced Beta alignment logic after production releases.
- [x] Allow guarded direct Beta reference updates and verify a successful post-release fast-forward.
- [x] Add an explicit, single-owner pull-request backend preview lifecycle for Maintley Beta.
- [x] Complete custom-domain DNS, TLS, and Firebase Hosting cutover.
- [x] Deploy clean-route URL generation for Functions, authentication, billing, invitations, and notifications.
- [ ] Validate authentication, Stripe returns, email links, deep links, PWA behavior, and rollback on the production custom domain.
- [ ] Complete Android clean-route validation and remove the transitional `HashRouter` build profile.
- [ ] Retire GitHub Pages after the observation period and complete the repository privacy decision.

The production custom domain now resolves to Firebase Hosting with TLS. Backend
link producers use canonical clean routes independent of the transitional
Android router profile. The remaining migration gates are production workflow
validation, native clean-route validation, and removal of the retired Pages
guard after the observation period.

## Context

Maintley's web application currently deploys through GitHub Actions to GitHub
Pages. The React application uses `HashRouter`, production URLs include
`/#/`, and the active hosting workflow is coupled to the repository's GitHub
Pages configuration.

GitHub Pages was an appropriate low-complexity starting point for a static
single-page application. Maintley has since consolidated most of its platform
services in Firebase:

* Firebase Authentication
* Cloud Firestore
* Firebase Storage
* Firebase Cloud Messaging
* Cloud Functions

The current hosting model now limits routing, deployment configuration, and
repository independence. Maintley also needs one deliberate hosting model for
clean public URLs, authenticated deep links, PWA navigation, billing returns,
and future infrastructure improvements.

The current production deployment remains GitHub Pages until this migration is
implemented and validated. That temporary implementation difference does not
make this ADR provisional: this decision is accepted and governs the next
hosting architecture.

## Decision

Maintley will migrate its production web application from GitHub Pages to
Firebase Hosting.

The migration will:

* establish separate development and production Firebase projects
* use `beta` as the integration branch for feature work
* deploy pull-request preview channels against the development Firebase project
* deploy the stable development environment after changes merge to `beta`
* configure Firebase Hosting for the production React build
* replace `HashRouter` with `BrowserRouter`
* remove hash-based application URLs
* configure Firebase Hosting routes and SPA fallback behavior
* deploy the web application to Firebase through GitHub Actions
* deploy production only from an approved release merge into `main`
* create the version tag and GitHub Release only after production deployment succeeds
* migrate the Maintley custom domain to Firebase Hosting
* remove the production dependency on GitHub Pages
* allow the GitHub repository to become private

The migration will also separate the web and Android release lifecycles. Web
releases must not require an Android build. Android releases will remain an
explicit local operation initiated through `yarn build:signed`; GitHub Actions
will not build, sign, or upload the Android application at this stage.

Feature branches will normally target `beta`, not `main`. The release branch
will collect the approved state of `beta`, prepare the version files and release
notes, and open the release PR into `main`. Merging ordinary feature work must
not deploy the production website.

Pull-request preview channels use the development Firebase configuration and
share the stable development backend by default. A trusted same-repository pull
request may explicitly request a shared backend preview after required checks
pass. Maintley serializes these deployments, marks exactly one pull request as
the current backend owner, and deploys that pull request's complete Functions,
Firestore-rules, and Storage-rules state to `maintleybeta`. Later pushes to the
active pull request redeploy automatically. Merging makes the backend stable;
closing without merging restores the complete backend from the current `beta`
branch. This is a temporary shared-environment override, not an isolated copy,
and it never rolls back test data automatically. Any other merge into `beta`
also reclaims the complete stable backend and clears preview ownership so a
shared override cannot silently survive a newer integration state.

`HashRouter` will be removed completely. Maintley will not maintain a
permanent compatibility layer for legacy `/#/` application URLs.

The web cutover may precede the native cutover. During that bounded migration
window, Firebase Hosting builds use `BrowserRouter` exclusively while packaged
Android builds retain an explicit `HashRouter` profile with relative assets.
That profile is not used by web builds and must be removed after the native URL
open, callback, back-navigation, and Play-installed release gates pass.

## Architectural principle

The migration will intentionally remove legacy routing rather than introduce
permanent compatibility layers.

Temporary compatibility code may be used during development and validation,
but it must not remain in production after the migration is complete.

## Rationale

Maintley has minimal production adoption, one paying customer, and limited
bookmarked application routes. This makes the current lifecycle stage the best
time to accept a clean routing cutover.

A compatibility layer for legacy hash routes would add routing branches,
testing obligations, and permanent maintenance for a short-lived concern.
Firebase Hosting provides the routing and deployment controls needed for a
normal browser-history SPA while aligning the web frontend with Maintley's
existing Firebase platform.

Firebase Hosting does not by itself improve search performance. The SEO benefit
comes from clean, stable public URLs combined with correct canonical metadata,
internal links, indexation rules, and preserved public content.

## Goals

### Clean URLs

Replace URLs such as:

```text
https://maintleyapp.com/#/dashboard
```

with:

```text
https://maintleyapp.com/dashboard
```

### Unified infrastructure

Operate the hosted frontend alongside Maintley's Firebase-backed
authentication, data, storage, messaging, and Functions architecture.

### Environment isolation

Keep development Auth, Firestore, Storage, Functions, Hosting, Analytics, and
operational data separate from production. Development uses synthetic data,
Stripe test mode, non-production provider credentials or quotas, and suppressed
or redirected customer communications.

### Release-gated production

Treat a release merge into `main` as the production boundary. Production
Hosting, Functions, Firestore rules, and Storage rules must pass their required
validation and deployment gates before the version tag and GitHub Release are
created. The local signed Android helper attaches artifacts to that existing
release and does not create or redefine it.

### Repository independence

Production hosting must not depend on public repository visibility. Maintley
must be able to make the repository private after the new deployment workflow
is proven.

### Native browser routing

Use `BrowserRouter` throughout the application and support direct navigation,
refreshes, authentication redirects, and protected deep links without hashes.

### Controlled cutover

Deploy and validate Firebase Hosting before moving the custom domain. Keep the
existing GitHub Pages deployment available as the rollback target until the
custom domain, TLS, routing, billing returns, authentication, PWA, and Android
validation are complete.

## Release constraints

The routing migration affects every deployed Maintley client and hosting
surface:

* Web
* Firebase Hosting
* Android through Capacitor
* Progressive Web App

The migration must not be considered complete until every supported client has
been validated. At minimum, release validation includes:

* `BrowserRouter` navigation
* direct navigation and page refresh behavior
* relative asset loading
* Capacitor startup and navigation
* supported deep links and external callbacks
* PWA installation and launch behavior
* service-worker installation, activation, and update behavior

### Independent web and Android releases

Web release preparation, deployment, tags, and GitHub Releases must be able to
complete without producing an Android artifact. A Maintley version may ship to
the web without being selected for Google Play.

Android releases remain intentionally opt-in and locally controlled:

* `yarn build:signed` remains the operator-facing Android release command.
* The command may be implemented as a wrapper around focused validation,
  Capacitor synchronization, bundle, signing, and upload stages.
* Android signing and Google Play credentials remain outside GitHub Actions.
* The signed Android App Bundle (`.aab`) is the only normal Play artifact.
* APK generation is removed from the normal release path.
* The first distribution target is Google Play internal testing.
* Production promotion is a deliberate operator action after testing.

The same tested AAB and `versionCode` will be promoted from internal testing to
production. A rebuild is not required for promotion. If testing results in any
application change, a new signed AAB with a new, higher `versionCode` must be
created and tested.

### Android version policy

Maintley may choose which web versions receive an Android release. Google Play
`versionCode` values therefore do not need to be consecutive. Every uploaded
value must still be unique and higher than all values previously uploaded for
the application, including uploads that remain only on a testing track.

The local Android release flow must check the prepared repository version
against Google Play before upload and fail clearly rather than silently
rewriting an already prepared release version.

### Published-version timing

Uploading an AAB to internal testing does not make it Maintley's public Android
release. Customer-facing published-version records and production Play links
must be updated only after the tested release is promoted to production and
its rollout is confirmed. Release notes and version metadata should reuse the
repository's existing release-generation conventions.

The release workflow must also enforce:

* feature pull requests target `beta`
* pull-request Hosting previews use the development Firebase project
* merges into `beta` update the stable development environment
* only the release PR may promote the approved `beta` state into `main`
* production deploys are triggered by the release merge, not ordinary feature merges
* a failed production deploy cannot create a tag or GitHub Release
* tags and GitHub Releases are idempotent and point to the exact release merge commit
* after publication, `beta` advances to that release only through a verified, non-forced fast-forward

## Required migration constraints

### Complete discovery before code changes

Before `BrowserRouter` is introduced, the migration must inventory:

* every location that generates or consumes an application URL
* every static public and SEO page
* Firebase Hosting route, header, cache, and deployment requirements
* Android routing, assets, intents, and callback behavior
* PWA manifest, scope, caching, offline, and update behavior

The inventories are migration deliverables and must be reviewed before routing
implementation begins.

### Hosting requirements

The Firebase Hosting configuration must serve Maintley's existing static public
pages, existing SEO pages, article pages, static assets, manifest, service
worker, offline page, `robots.txt`, and `sitemap.xml` before applying the React
SPA fallback. A broad rewrite must not silently replace valid public resources
with `index.html`.

Public metadata, canonical URLs, sitemap entries, robots directives, structured
data, and internal links must use the final clean URLs.

### URL inventory

The migration is not complete when the router alone changes. It must update and
test every generated or stored application URL. The discovery inventory must
include:

* React Router navigation
* Stripe Checkout success and cancellation returns
* Stripe Customer Portal redirects
* admin-created billing and promotion flows
* authentication email destinations
* password-reset email destinations
* email-verification destinations
* family, team, and tenant invitation links
* email and notification links
* analytics route handling
* canonical URLs
* sitemap entries
* public-site calls to action and internal links
* marketing pages
* Android intents when applicable
* tests, documentation, and deployment validation scripts

Every generated URL must be reviewed before `BrowserRouter` is introduced. No
new production URL may depend on `/#/`.

### Protect Android and PWA behavior

Maintley is also packaged for Android with Capacitor and supports PWA
installation. The hosted routing change must not break:

* the packaged Android application shell
* Android startup, authentication, and internal navigation
* Android deep-link or callback handling
* PWA launch URLs and scope
* service-worker navigation and offline behavior
* relative static asset loading

The current `homepage` and relative-asset configuration must be reviewed. If
the web and packaged applications require different asset bases or build
settings, the migration must introduce explicit web and mobile build profiles
rather than retaining hash routing as an undocumented exception.

Android and PWA validation are release gates. The migration cannot ship merely
because the browser-hosted application works.

The Android release gate must validate the Play-distributed internal-testing
build, not only a locally assembled bundle. This ensures Play signing,
packaging, Capacitor assets, navigation, and callbacks are tested in the same
artifact later promoted to production.

### Use Firebase SPA fallback deliberately

Firebase Hosting must return `index.html` for valid client-side application
routes while preserving concrete public files and appropriate error behavior.
Direct navigation and refresh must work for public, authentication, and
authenticated routes.

Hosting headers must preserve Maintley's security and caching boundaries.
Private Firebase, Firestore, Storage, document, invoice, or property responses
must never be added to the PWA cache.

### Update trusted origins and return destinations

The migration must verify Firebase Authentication authorized domains, password
reset and invitation destinations, Stripe return URLs, CORS or origin checks,
and any environment-specific allowlists. Preview and production hosts must not
be confused in billing or authentication flows.

### Isolate environment configuration and side effects

Development and production must use separate GitHub environments, Firebase
project identifiers, web app configuration, deployment identities, secrets,
Analytics destinations, and provider configuration. Development must not send
customer lifecycle email, use production Stripe credentials, write production
customer data, or consume production-only API credentials by default.

Preview channels may use the shared development backend, but each preview must
receive an isolated Hosting channel and an explicit expiration or cleanup path.
Preview URLs required for authentication must be allowlisted deliberately; a
wildcard or unbounded trusted-origin policy is not acceptable.

Production customer data must not be copied into development. Seed and migration
validation must use synthetic or specifically approved test records.

### Protect the promotion path

Validated feature work normally enters `beta` through a pull request. The Beta
ruleset intentionally does not require every branch update to be associated
with a pull request because that rule also blocks the guarded post-release
reference fast-forward. Direct Beta updates are reserved by operational policy
for that verified alignment path; they are not the normal feature-delivery
workflow. Required checks remain enabled, and force updates and branch deletion
remain blocked.

The release PR promotes the accumulated, reviewed `beta` state to `main`; it is
not merely a version-only administrative change. After release, `beta` must
advance to the published Main release without rewriting shared branch history.
The finalizer performs a non-forced fast-forward only after verifying that the
released commit contains the current Beta tip. No Main-to-Beta synchronization
PR or reverse merge commit is created. If Beta advanced after release
preparation, production promotion fails and the release candidate must be
refreshed.

The production workflow must verify through GitHub pull-request metadata that
the target commit is the approved `Release vX.Y.Z` merge from `release/next`
into `main` and that repository-controlled version files agree before deploying
or publishing release metadata. Merge-subject text alone is not an identity
boundary because GitHub can emit either the PR title or its standard
`Merge pull request #N from ...` subject. A failed Hosting release may be
recovered only by rebuilding an explicitly supplied, metadata-validated release
merge SHA and deploying only `hosting:prod`.

The approved branch direction is `feature -> beta -> release/next -> main`.
Direct-to-Main operational repairs are exceptional and must use the same guarded
fast-forward alignment afterward; they do not establish a second promotion
direction.

### Preserve rollback until validation

GitHub Pages must not be disabled, its workflow removed, or the repository made
private until:

1. Firebase's preview host is validated.
2. The custom domain and TLS certificate are active.
3. Critical production workflows pass on the custom domain.
4. The rollback procedure has been tested or documented.
5. A suitable post-cutover observation period has completed.

## Consequences

### Positive

* Clean application URLs
* Native browser-history routing
* Better control over SPA rewrites, headers, and caching
* Frontend hosting aligned with the existing Firebase platform
* Production hosting independent of public repository visibility
* A clearer path for future deployment and domain improvements
* Development analytics, data, storage, and Functions usage separated from customers
* Reviewable web previews without publishing unfinished changes to production
* One explicit promotion path from feature work to beta to production

### Trade-offs and risks

* Existing hash-based bookmarks and external links are intentionally unsupported.
* Every hard-coded or generated callback URL must be migrated.
* Android and PWA asset/routing behavior require dedicated validation.
* Incorrect rewrite ordering could hide public pages or serve the SPA for assets.
* DNS and TLS cutover can cause temporary availability issues.
* Deployment and rollback procedures must change.
* A shared development backend can represent only one active pull-request backend at a time.
* Pull-request backend previews temporarily place deployed development code ahead of the `beta` Git reference and require automatic restoration when abandoned.
* Long-lived `beta` and `main` branches require clear synchronization and protection rules.
* Development Firebase and third-party services add configuration and cost-management work.

These risks are accepted, but each is a release gate rather than optional
follow-up work.

## Deferred

This ADR does not introduce:

* server-side rendering
* Next.js
* Cloud Run frontend hosting
* edge rendering
* backend API architecture changes
* a legacy hash-route compatibility service
* Android builds, signing, or Google Play submission in GitHub Actions
* a combined Apple and Android store-delivery pipeline

Those require separate architectural decisions if pursued.

## Implementation strategy

The current production release will be completed through the existing GitHub
Pages process. The hosting migration will then proceed as a dedicated
infrastructure effort before additional feature development resumes.

The migration begins by creating the development Firebase project and GitHub
environment, then introducing the protected `beta` integration branch. Preview
Hosting and stable beta deployment are proven before production Hosting or DNS
changes. Production release automation is enabled only after the development
path has passed a harmless end-to-end test release.

The companion migration report defines the phased implementation, validation,
cutover, rollback, and cleanup checklist.

## Success criteria

The decision is implemented when:

* Maintley is served from Firebase Hosting on its production custom domain.
* `BrowserRouter` is the only application router.
* Direct navigation and refresh work on every supported route class.
* Public pages and SEO assets retain their intended URLs and responses.
* Stripe, authentication, invitations, notifications, and email links use clean URLs.
* PWA installation, launch, service-worker, and offline behavior are validated.
* The packaged Android application passes its routing and authentication checks.
* GitHub Actions deploys the web build directly to Firebase.
* Feature PRs receive expiring Firebase Hosting previews backed by development configuration.
* Trusted backend-changing PRs can explicitly deploy one serialized, reversible shared Beta backend preview after required checks pass.
* Merges into `beta` deploy the stable development Firebase environment.
* Development and production use separate Firebase projects, Analytics, secrets, and data.
* Only release merges into `main` can deploy production.
* Successful production releases automatically create the matching tag and GitHub Release.
* The Android helper attaches artifacts to the existing release without changing its notes.
* GitHub Pages is no longer part of production deployment or rollback.
* The signed AAB passes internal testing and can be promoted unchanged to production.
* Web releases complete without requiring an Android release.
* Android releases are explicitly initiated locally and use unique, increasing
  Google Play `versionCode` values.
* The repository can be private without affecting production availability.
* Current architecture, deployment, SEO, PWA, and development documentation is updated.

## Decision principles

* Firebase Hosting is Maintley's accepted production web-hosting direction.
* Browser history routes replace hash routes completely.
* Clean URLs must include every producer and consumer, not only React Router.
* Public content and PWA assets must survive the SPA rewrite.
* Android and PWA compatibility are release gates.
* Cutover must remain reversible until production validation is complete.
* Web and Android releases have independent lifecycles.
* AAB is the normal Android distribution artifact; APK is not part of the
  normal release path.
* Android releases are built and uploaded locally to internal testing, then the
  tested artifact is promoted deliberately to production.
* Google Play version codes may contain gaps but may never be reused or decrease.
* `beta` is the feature-integration branch; `main` is the production release branch.
* Pull-request previews never create production tags, releases, or production backend deployments.
* Production release metadata is published only after successful production deployment.
