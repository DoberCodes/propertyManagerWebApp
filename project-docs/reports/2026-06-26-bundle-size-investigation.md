# Bundle Size Investigation

Date: 2026-06-26

## Summary

The production build warning is real. The main JavaScript bundle is approximately:

| Artifact | Raw | Gzip |
| --- | ---: | ---: |
| `main.eacd4b85.js` | 3.14 MB | 806.9 KB |

CRA reports the main bundle as significantly larger than recommended.

The issue is caused by three overlapping problems:

1. Heavy libraries are loaded in the initial bundle.
2. Route-level code splitting is not currently used.
3. Large static media assets are bundled into the build output.

## Source Map Notes

Production source maps are disabled by `.env.production`:

```text
GENERATE_SOURCEMAP=false
```

For this investigation, a local analysis build was run with:

```powershell
$env:GENERATE_SOURCEMAP='true'; npm.cmd run build
```

This generated source maps for analysis only. This does not require enabling source maps in deployed production builds.

## Main JavaScript Contributors

Source-map source byte totals are not the same as minified gzip contribution, but they identify the largest bundle contributors.

| Contributor | Source bytes | Notes |
| --- | ---: | --- |
| `@zxing/library` | 1,476,682 | Pulled into main through `BarcodeScannerModal` |
| `@firebase/firestore` | 1,391,836 | Pulled into startup through broad Firebase/auth service imports |
| `@fortawesome/free-solid-svg-icons` | 1,036,484 | Full icon index appears in main |
| `@firebase/auth` | 503,978 | Needed for auth, but currently coupled with larger auth service |
| `@reduxjs/toolkit` | 385,863 | Expected app infrastructure cost |
| `@remix-run/router` | 256,449 | Expected route infrastructure cost |
| `@fortawesome/free-regular-svg-icons` | 137,684 | Full regular icon index appears in main |
| `@firebase/storage` | 125,337 | Needed, but should not always be initial |
| `styled-components` | 105,302 | Expected styling infrastructure cost |
| `@fortawesome/fontawesome-svg-core` | 102,425 | Icon infrastructure |

## Largest App Source Areas In Main

| App area | Source bytes | Notes |
| --- | ---: | --- |
| `Components/Library` | 445,377 | Shared components and modals, including large modal flows |
| `pages/PropertyDetailPage` | 395,349 | Large property workspace loaded up front |
| `Components/PropertiesTab` | 221,467 | Large property list/grouping experience loaded up front |
| `Redux/API` | 194,752 | RTK Query slices and data access |
| `pages/AdminInboxPage` | 164,352 | Admin-only page currently in main |
| `pages/DeviceDetailPage` | 127,900 | Includes barcode scanner path |
| `pages/TeamPage` | 102,572 | Team management currently in main |
| `pages/LandingPage` | 87,972 | Public landing content and styles |

## Current Code Splitting

Existing async chunks are very small:

| Chunk | Main contents |
| --- | --- |
| `257.*.chunk.js` | `tesseract.js` dynamic import |
| `312.*.chunk.js` | Capacitor geolocation web implementation |
| `453.*.chunk.js` | `web-vitals` |
| `842.*.chunk.js` | Capacitor browser web implementation |

This means most page-level application code still ships in `main`.

## Static Media Findings

Static media is also large, though CRA's warning focuses on JS.

| Metric | Value |
| --- | ---: |
| Total media assets | 51.64 MB |
| Media files | 34 |
| Files over 1 MB | 16 |
| Files over 500 KB | 23 |

Largest media assets:

| File | Size |
| --- | ---: |
| `camper in the woods...jpg` | 5.08 MB |
| `cabin_woods...jpg` | 4.77 MB |
| `Rooftop2...jpg` | 4.48 MB |
| `winter...jpg` | 3.49 MB |
| `Deck...jpg` | 3.06 MB |
| `Tree...jpg` | 2.88 MB |
| `Home...jpg` | 2.83 MB |
| `ChatGPT Image Feb 19...png` | 2.59 MB |
| `privacy...jpg` | 2.45 MB |

These assets should be optimized separately from the JS bundle.

## Root Causes

### 1. Router imports every major page eagerly

`src/router.tsx` statically imports public pages, authenticated app pages, admin pages, support pages, property pages, device pages, team pages, reports, settings, and profile pages.

Result:

* A public landing visitor downloads code for authenticated workflows.
* A normal homeowner downloads admin/team/report/property-manager code before needing it.

### 2. Auth startup imports too much Firebase

`src/App.tsx` imports `onAuthStateChange` from `services/authService`.

`services/authService.ts` imports:

* `firebase/auth`
* `firebase/firestore`
* `firebase/functions`
* Stripe/session creation helpers
* legal agreement creation
* notification defaults

Result:

* Firestore and Functions enter the initial bundle even for auth startup.
* Public routes pay for more Firebase than they need.

### 3. Barcode scanning loads ZXing up front

`BarcodeScannerModal` statically imports `@zxing/library`.

That modal is imported by:

* `DeviceModal`
* `DeviceDetailPage`

Result:

* `@zxing/library` becomes part of main.
* This is the single largest package contributor in the main bundle.

### 4. FontAwesome icon imports are not tree-shaking well enough

The source map includes:

* `@fortawesome/free-solid-svg-icons/index.mjs`
* `@fortawesome/free-regular-svg-icons/index.mjs`

Result:

* The full icon pack index appears in main.
* This is likely caused by package entrypoint behavior and many direct icon imports.

### 5. Static media is unoptimized

Large JPG/PNG assets are emitted into the build at original sizes.

Result:

* Slower page loads.
* Large deployment artifact.
* Mobile users pay unnecessary image transfer costs.

## Recommended Plan

### Phase 1: Measurement Guardrails

Goal: prevent bundle size regressions.

Actions:

1. Add a local bundle analysis script that runs a source-map build and prints:
   * main raw size
   * main gzip size
   * top node modules
   * top app folders
   * static media totals
2. Add a documented bundle budget target.
3. Keep production source maps disabled unless intentionally needed.

Suggested targets:

| Metric | Target |
| --- | ---: |
| Initial main gzip | < 500 KB |
| Main raw JS | < 2 MB |
| Individual static media asset | < 500 KB unless justified |
| Landing-critical hero image | < 250 KB target |

### Phase 2: Route-Level Code Splitting

Goal: stop shipping the whole app to every route.

Actions:

1. Convert `router.tsx` page imports to `React.lazy`.
2. Wrap route elements in `Suspense`.
3. Group routes by likely user flow:
   * public marketing/auth
   * authenticated app shell
   * property workspace
   * admin/support/reporting
4. Keep lightweight error/loading states.

Expected impact:

* Medium to high.
* Reduces initial main bundle by moving large page code into route chunks.
* Improves public landing and login load time.

Risk:

* Medium.
* Needs route smoke tests and auth redirect validation.

### Phase 3: Split Auth Startup From Full Auth Service

Goal: load only Firebase Auth on startup.

Actions:

1. Create a small auth listener module, for example:
   * `services/authSession.ts`
2. Move only `onAuthStateChanged` and minimal user hydration there.
3. Keep registration, checkout, Firestore user creation, legal agreements, and invitation behavior in separate lazy-loaded service modules.
4. Avoid importing Firestore from the root app bootstrap path.

Expected impact:

* High, especially for public pages.
* Should reduce initial Firebase cost.

Risk:

* Medium-high.
* Auth is critical; requires careful tests and manual login/logout validation.

### Phase 4: Lazy-Load Barcode Scanner And ZXing

Goal: only load ZXing when a user opens barcode scanning.

Actions:

1. Remove static `@zxing/library` imports from `BarcodeScannerModal`.
2. Dynamically import ZXing only when:
   * the scanner modal opens, and
   * native `BarcodeDetector` is unavailable or image decode is requested.
3. Consider lazy-loading `BarcodeScannerModal` itself from `DeviceModal` and `DeviceDetailPage`.

Expected impact:

* Very high.
* `@zxing/library` is the largest package contributor.

Risk:

* Medium.
* Requires camera/scanner regression testing.

### Phase 5: Replace FontAwesome With Tree-Shakeable Icons

Goal: stop pulling full icon pack entrypoints into main.

Preferred direction:

1. Migrate frequently used UI icons to `lucide-react`, or another tree-shakeable icon package.
2. For any remaining FontAwesome usage, import from per-icon paths if supported and verified by source-map output.
3. Avoid importing package-level icon indexes.

Expected impact:

* High.
* FontAwesome solid + regular + core are over 1.27 MB of source-map source bytes.

Risk:

* Low-medium.
* Mostly visual regression risk.

### Phase 6: Optimize Static Media

Goal: reduce page and deployment weight.

Actions:

1. Convert large JPG/PNG assets to WebP or AVIF.
2. Generate responsive image sizes for landing and seasonal/media content.
3. Lazy-load below-the-fold images.
4. Move non-critical large media behind route or user-action boundaries.
5. Add an asset size check for files over 500 KB.

Expected impact:

* Very high for page load and mobile performance.
* Does not directly solve the JS warning, but improves real user performance.

Risk:

* Low-medium.
* Needs visual QA.

### Phase 7: Page-Level Refactors After Splitting

Goal: reduce chunk size and improve maintainability.

Candidate files:

* `Components/PropertiesTab/PropertiesTab.tsx`
* `pages/DeviceDetailPage/DeviceDetailPage.tsx`
* `Components/Library/Modal/TaskModal.tsx`
* `pages/TeamPage/TeamPage.tsx`
* `pages/PropertyDetailPage`

Actions:

1. Extract heavy subviews into lazy panels where user-triggered.
2. Keep business logic in hooks/utilities.
3. Do not refactor solely for file size; refactor where ownership boundaries improve.

Expected impact:

* Medium.
* Most helpful after route-level splitting.

Risk:

* Medium.

## Recommended Execution Order

1. Add bundle/media analysis script and budget.
2. Lazy-load routes in `router.tsx`.
3. Split auth startup from full `authService`.
4. Lazy-load barcode scanner / ZXing.
5. Replace or fix FontAwesome imports.
6. Optimize static media.
7. Refactor large pages where chunks remain heavy.

## Validation Plan

After each phase:

```powershell
npx.cmd tsc --noEmit --pretty false
npm.cmd run build
```

For route/auth phases:

```powershell
npm.cmd test -- --watchAll=false --passWithNoTests
```

Manual validation:

* Public landing page loads.
* Login/logout works.
* Refresh while authenticated works.
* Protected route redirect works.
* Property page opens.
* Device detail page opens.
* Barcode scanner opens and scans/falls back correctly.
* Admin route remains protected.

## Success Criteria

Short-term:

* Main gzip drops below 650 KB.
* Largest media assets reduced or moved out of critical paths.

Medium-term:

* Main gzip drops below 500 KB.
* Public landing route loads without authenticated app pages in the initial chunk.
* ZXing is not present in main.
* Full FontAwesome icon pack indexes are not present in main.

