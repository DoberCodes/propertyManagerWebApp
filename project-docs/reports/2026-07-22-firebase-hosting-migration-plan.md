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

## Phase 0: Discovery and URL inventory

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
* [ ] Inventory Android routing, asset loading, and packaged-app behavior.
* [ ] Inventory PWA scope, installation, navigation, caching, and updates.
* [ ] Decide whether web and Android require separate build profiles.
* [ ] Review and approve the inventories before introducing `BrowserRouter`.
* [ ] Record baseline Lighthouse, PWA, asset, and critical-route checks.
* [ ] Inventory current branch protections, release-prep behavior, and deployment triggers.
* [ ] Inventory production GitHub secrets, variables, Firebase identities, and external providers by environment.

## Phase 0A: Development environment and promotion model

* [ ] Create or confirm the dedicated development Firebase project.
* [ ] Link a development billing account or budget only where required by deployed services.
* [ ] Register the development web app and Hosting site.
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
* [ ] Define a non-destructive post-release synchronization procedure from `main` back to `beta`.
* [ ] Record environment ownership, cost budgets, secret rotation, and emergency access procedures.

## Phase 1: Final GitHub Pages release and migration freeze

* [ ] Merge the current bug fixes.
* [ ] Merge the paywall and checkout refactor.
* [ ] Deploy the final planned GitHub Pages release.
* [ ] Verify production stability.
* [ ] Record the current production build, workflow, DNS, and rollback state.
* [ ] Freeze hosting and routing changes outside the migration branch.

## Phase 2: Firebase Hosting foundation

* [ ] Confirm the production Firebase project and hosting site name.
* [ ] Confirm the development Firebase project and hosting site name.
* [ ] Initialize Firebase Hosting without changing the production domain.
* [ ] Add Hosting configuration with explicit development and production project targets.
* [ ] Configure public files and SPA fallback ordering.
* [ ] Configure appropriate security and cache headers.
* [ ] Confirm private Firebase or customer data is never cached as static content.
* [ ] Deploy the candidate build to the development Firebase `*.web.app` host.
* [ ] Verify assets, static pages, error responses, and the React application shell.
* [ ] Verify no preview build contains production Firebase or Analytics configuration.

## Phase 3: BrowserRouter and build behavior

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

## Phase 4: URL producer and callback migration

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

## Phase 5: Public site, SEO, and PWA

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

## Phase 6: Android and mobile release gate

* [ ] Build the Capacitor Android application with the new routing configuration.
* [ ] Verify cold start and warm resume.
* [ ] Verify login, logout, registration, and password reset.
* [ ] Verify internal navigation and hardware-back behavior.
* [ ] Verify property, equipment, task, report, and intelligence routes.
* [ ] Verify Stripe handoff and return behavior on Android.
* [ ] Verify email, notification, and supported deep-link behavior.
* [ ] Verify static assets and offline shell loading in the packaged app.
* [ ] Confirm no Android code or generated asset still depends on hash routing.

## Phase 7: GitHub Actions deployment

* [ ] Add Firebase Hosting preview deployment for feature pull requests targeting `beta`.
* [ ] Give each pull request an isolated, expiring Hosting preview channel and surface its URL on the PR.
* [ ] Keep PR previews on the stable development backend; do not deploy shared Functions or rules per PR.
* [ ] Add stable development Hosting, Functions, Firestore rules, and Storage rules deployment after merge to `beta`.
* [ ] Add production Hosting, Functions, Firestore rules, and Storage rules deployment after the release PR merges to `main`.
* [ ] Use separate, least-privilege development and production deployment identities.
* [ ] Configure environment-specific secrets without committing credentials.
* [ ] Retain build validation, tests, and asset-budget checks.
* [ ] Update Release Prep so the release branch promotes the approved `beta` state into `main` rather than acting as a version-only branch.
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

## Phase 8: Custom domain and DNS cutover

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

## Phase 9: Production validation

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

## Phase 10: Observation, cleanup, and documentation

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

## Completion criteria

The migration is complete only when all ADR 0028 success criteria pass, the
observation period is complete, GitHub Pages is removed from production, and
the authoritative current-state documentation describes Firebase Hosting and
BrowserRouter.
