# ADR 0028: Firebase Hosting and Browser Routing Migration

Status: Accepted

Date: 2026-07-22

Related ADR: `0016-maintley-progressive-web-app-support.md`

Companion report: `project-docs/reports/2026-07-22-firebase-hosting-migration-plan.md`

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

* configure Firebase Hosting for the production React build
* replace `HashRouter` with `BrowserRouter`
* remove hash-based application URLs
* configure Firebase Hosting routes and SPA fallback behavior
* deploy the web application to Firebase through GitHub Actions
* migrate the Maintley custom domain to Firebase Hosting
* remove the production dependency on GitHub Pages
* allow the GitHub repository to become private

`HashRouter` will be removed completely. Maintley will not maintain a
permanent compatibility layer for legacy `/#/` application URLs.

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

### Trade-offs and risks

* Existing hash-based bookmarks and external links are intentionally unsupported.
* Every hard-coded or generated callback URL must be migrated.
* Android and PWA asset/routing behavior require dedicated validation.
* Incorrect rewrite ordering could hide public pages or serve the SPA for assets.
* DNS and TLS cutover can cause temporary availability issues.
* Deployment and rollback procedures must change.

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

Those require separate architectural decisions if pursued.

## Implementation strategy

The current production release will be completed through the existing GitHub
Pages process. The hosting migration will then proceed as a dedicated
infrastructure effort before additional feature development resumes.

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
* GitHub Pages is no longer part of production deployment or rollback.
* The repository can be private without affecting production availability.
* Current architecture, deployment, SEO, PWA, and development documentation is updated.

## Decision principles

* Firebase Hosting is Maintley's accepted production web-hosting direction.
* Browser history routes replace hash routes completely.
* Clean URLs must include every producer and consumer, not only React Router.
* Public content and PWA assets must survive the SPA rewrite.
* Android and PWA compatibility are release gates.
* Cutover must remain reversible until production validation is complete.
