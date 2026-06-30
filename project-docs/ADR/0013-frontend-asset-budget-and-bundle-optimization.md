# ADR 0013: Frontend Asset Budget and Bundle Optimization

Status: Accepted
Date: 2026-06-27
Accepted: 2026-06-27
Decision Source: Manual

## Context

Maintley's production build began producing bundle size warnings. Investigation showed that the initial JavaScript bundle and static media payload had grown beyond a reasonable size for a mobile-first property maintenance application.

The main causes were:

- Route-level pages were statically imported into the initial app bundle.
- Heavy optional capabilities, such as barcode scanning, were loaded before users needed them.
- App startup imported the full authentication service, including registration, billing, legal agreement, and account-management flows.
- Large image assets were bundled into the deployed app, including assets pulled in through dynamic image contexts.
- No automated asset budget existed to prevent regressions.

Maintley should remain fast enough for homeowners using mobile devices and should not require users to download administrative routes, scanning engines, or large image assets before those capabilities are needed.

Maintley Intelligence, document understanding, and future knowledge extraction will increase application complexity over time. Maintaining a lean frontend allows these capabilities to be added without degrading startup performance.

## Decision

Maintley will treat frontend bundle size and deployed media size as release-quality concerns.

Performance is considered a product feature, not solely an engineering concern.

The application will:

- Lazy-load major routes instead of statically importing every page into the initial router bundle.
- Keep heavyweight feature dependencies out of startup paths when they are only needed for specific workflows.
- Use a lightweight authentication startup path that avoids importing full registration, billing, legal, and account-management flows on app boot.
- Keep deployable image assets compressed and sized for their actual UI use.
- Avoid leaving unreferenced large media files in directories included by bundler dynamic contexts.
- Enforce frontend asset budgets during deployment and signed release builds.
- Treat budget misses up to 15% over target as release warnings rather than release blockers, so small performance regressions do not hold up important bug fixes.

Initial asset budgets are:

- Main JavaScript gzip size under 300 KB.
- Total JavaScript gzip size under 1 MB.
- Built media assets under 6 MB total.
- Individual built media assets under 750 KB.

The budget check scans the built application, including copied public assets outside `build/static`.
Assets over target but within 15% of the target pass with a warning and make frontend optimization a top priority for the next release. Assets more than 15% over target fail the check and block release.

## Consequences

- New large pages should be added as lazy-loaded routes unless they are required for app startup.
- Optional engines and heavy libraries should be dynamically imported when practical.
- Public and static media assets should be optimized before being committed.
- Assets in directories loaded by `require.context` or similar dynamic import patterns must be treated as deployable, even if no explicit source reference exists.
- `predeploy` and the signed release pipeline warn when asset budgets are exceeded by up to 15%.
- `predeploy` and the signed release pipeline must fail when any asset budget is exceeded by more than 15%.
- Budget thresholds may be adjusted intentionally, but increases should be treated as product and engineering decisions rather than incidental build drift.

## Measured Results

Following implementation:

- Main JavaScript bundle reduced from 803.67 KB to 256.68 KB gzip, an approximate 68% reduction.
- Built media assets reduced from 52 MB to 4.35 MB, an approximate 92% reduction.
- Source media assets reduced from 68 MB to 9.11 MB, an approximate 87% reduction.

These optimizations significantly reduced application startup size and deployment size while creating headroom for future capabilities such as Maintley Intelligence and document understanding.

## Implementation Notes

The accepted implementation added:

- Bundle and media reporting scripts.
- An asset budget check script.
- Route-level code splitting.
- Deferred barcode scanner dependency loading.
- A smaller app startup authentication module.
- Optimized landing and seasonal maintenance media assets.
- Asset budget enforcement in `predeploy` and `build:signed`.

Operational documentation is maintained in:

- `project-docs/docs/Development/SCRIPTS_AND_UTILITIES.md`
- `project-docs/docs/Operations/DEPLOYMENT.md`
