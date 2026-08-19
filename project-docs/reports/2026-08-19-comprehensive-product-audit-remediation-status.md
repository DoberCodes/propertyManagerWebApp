# Comprehensive Product Audit Remediation Status

Date: 2026-08-19

Status: Implementation and validation record

Source audit: `2026-08-18-comprehensive-product-audit.md`

## Outcome

The release-blocking first-run failures identified by the audit were repaired
before this pass. This remediation pass then addressed the actionable
high-priority product, UX, analytics, mobile, demo-data, query-contract,
Functions-packaging, Android-hardening, and workflow-support findings that can
be completed safely without inventing customer evidence or starting a new
architectural migration.

The remaining work is explicit. It requires either a deployed Beta journey,
real performance measurements, a physical Android device, customer-owned proof
assets, or approval of a separate command-boundary/Functions-reorganization
phase.

## Critical Findings

| Finding | Status | Resolution |
| --- | --- | --- |
| C1 automatic Space creation failed | Completed before this pass | Space creation uses a repeat-safe write path, and rule coverage exercises create and retry behavior. |
| C2 billing plan contradicted effective access | Completed before this pass | Account presentation separates billing from current effective access and derives limits from effective access. |
| C3 loaded accounts showed false empty states | Completed before this pass | primary Properties, Tasks, and Equipment views now wait for settled query state and preserve explicit loading behavior. |
| C4 first-value release coverage | Partially complete | deterministic setup, access, Space, relationship, workflow, and deletion coverage exists. The complete deployed Beta activation journey remains an environment acceptance gate rather than a mock-only claim. |

## High-Priority Findings

### H1 and H2: first value and Setup Assistant

Completed in this pass:

* Added explicit `10-minute essentials`, `Continue room by room`, and `Upload
  an existing report` paths.
* Limited the essentials path to nine high-value checks.
* Kept report upload review-first and routed the user to property Documents.
* Removed implicit review credit from merely opening an item.
* Prevented an existing equipment record from silently marking an item as
  Present.
* Added per-area summaries for equipment, tasks, Spaces, and guidance created.
* Added selected, completed, and exited analytics for each setup path.
* Added regression tests and aligned ADR 0005 and current product guidance.

The broader photo-first extraction experience remains future product work. It
is not required to trust the new finite setup paths.

### H3: dense lists

Completed in this pass:

* Today limits the initial decision set to three items and links to all Tasks.
* Tasks expands overdue work by default while later groups remain summarized.
* Equipment puts needs-attention groups first and collapses healthy groups.
* Per-user list expansion preferences persist locally.
* Preference behavior has unit coverage.

Pagination or virtualization remains appropriate once measured Beta data shows
that collapsed rendering is insufficient at portfolio scale.

### H4: readiness language

Completed in this pass:

* Replaced ambiguous Ready language with Recorded, Scheduled, and Informed.
* Required three comparable dated maintenance events before an equipment record
  can count as Informed.
* Added per-property evidence, missing-evidence explanations, denominators, and
  property navigation in the dashboard detail experience.
* Updated Intelligence documentation and readiness tests.

### H5: representative demo data

Completed in this pass:

* Bumped the deterministic demo schema to version 2.
* The exemplary property now includes Spaces, property-owned Supplies,
  first-class Documents, Equipment, Tasks, Maintenance Events, Intelligence,
  and canonical links between them.
* The HVAC task links to the Mechanical Room and the correct filter Supply.
* Fixture validation enforces connected-property coverage.
* Added Portfolio fixture sizes of 1, 5, 15, and 100 properties. The 100-property
  fixture creates 5,151 records without Firebase access.

### H6: intentional-value analytics

Completed in this pass:

* Added setup path selection, completion, and exit-reason analytics.
* Documented first user-authored actions, first manual upload, first custom task,
  first maintenance completion, first Quick Scan, accepted recommendation, and
  1/7/30-day return cohorts.
* Defined `activated_homeowner` as property creation plus two intentional value
  signals within 14 days.
* Kept system-generated setup records out of intentional-value measurement.

Analytics dashboards and cohort observation require deployed traffic; this
pass establishes the durable event contract and metric definition.

### H7: mobile touch reliability

Completed in this pass:

* Added a shared 44-pixel coarse-pointer/mobile target floor for buttons,
  button roles, text controls, and selects.
* Kept legal inline links exempt from button sizing.
* Raised checkbox and radio controls to a practical 24-pixel input size while
  their labels provide the larger interactive row.
* Documented the rule in the mobile UX guide.

Physical Android onboarding, equipment, document, task, and notification flows
remain part of release acceptance.

### H8: server command boundary

Planned, not silently implemented:

* Added `2026-08-19-server-command-boundary-implementation-plan.md`.
* Defined command envelopes, idempotency, operation records, authorization,
  resumability, and migration order.
* Prioritized property creation, setup activation, task completion, document
  acceptance, entitlement changes, and account deletion.

This changes a major authorization and write boundary. It needs its own ADR and
implementation phase instead of being hidden inside an audit cleanup pull
request.

### H9: Functions and compatibility cleanup

Completed in this pass:

* Made the Functions TypeScript build reproducible through its local compiler.
* Stopped tracking generated `functions/lib` and `functions/coverage` output.
* Restored operational source scripts that had been hidden by a broad ignore
  rule.
* Added a versioned inventory of all 109 current Firebase Function exports.
* Added CI and predeploy validation that prevents accidental export removal or
  addition.
* Updated the existing Functions migration report with current status.

Still deferred to the planned structural phase:

* move deployable source into domain directories;
* split oversized modules such as `adminPortal.ts` and `stripeFunctions.ts`;
* complete compatibility backfills and remove retired paths.

### H10: Firestore query contracts

Completed in this pass:

* Added `firestore.indexes.json` to source control and Firebase configuration.
* Captured the two indexes currently present in production.
* Added the missing task-reminder deduplication index.
* Added source tests for required query/index contracts.
* Added Beta backend-preview and stable Beta/production index deployment.
* Added a query-contract document with view-specific measurements.
* Added deterministic 1-, 5-, 15-, and 100-property fixtures.

Still required after deployment:

* wait for Beta indexes to reach Ready;
* apply the large fixture to an intentional Beta test account;
* record document reads and route/render latency for Today, Tasks, Equipment,
  Reports, and Team;
* set release-blocking budgets from evidence rather than guessed thresholds.

## Medium-Priority Findings

Completed in this pass or the immediately preceding reliability patches:

* The top-bar Beta marker is restricted to the `maintleybeta` Firebase project.
* Home/Homeowner language is separated from Property architecture terminology.
* Registration uses one account-creation action and explains automatic
  temporary Homeowner+ access without requesting payment.
* Registration legal copy uses a concise acknowledgement with expandable
  disclosures.
* Free and Homeowner+ copy now reflects Free recurring tasks, reminders,
  history, and exports; Homeowner+ adds deeper guidance and more homes.
* Team summary says `Properties assigned` for advanced assignment management.
* Repeated Quick Scan education was removed from the results panel.
* Singular relative dates use `1 month ago`, not `1 months ago`.
* Reports can start from Tax records, Service history, or What is overdue.
* Duplicate Free pricing bullets are removed and rejected by static validation.
* Stable workflow support codes and a documented error taxonomy cover
  multi-record partial outcomes.
* Android backup is disabled, cleartext remains local-only, and exported
  activity behavior is contract-tested.
* An Android release acceptance checklist now covers physical-device workflows,
  security, artifact size, and rollback evidence.

## Items Requiring Non-Code Inputs or Separate Product Work

These findings were not papered over with fabricated evidence:

* A 60–90 second product demonstration requires an approved recording and
  current Beta data.
* Testimonials, named customer stories, retention figures, and measurable
  outcomes require real customer permission and evidence.
* Deeper audience pages should be built from those real stories rather than
  generic marketing filler.
* Android minification should be enabled only with a signed-artifact and
  physical-device regression pass because Firebase, Capacitor, and native
  plugins can require keep rules.
* Real query-count and render budgets require applied Beta fixtures and
  instrumentation evidence.
* Full command-boundary and Functions-domain migrations require an approved ADR
  and dedicated implementation phase.

Nice-to-have feature additions from the audit—calendar sync, property handoff,
email inbox, Work Sessions, weather-aware prompts, and assistant writes—remain
outside this reliability and cleanup pass.

## Validation Evidence

Completed locally on August 19, 2026:

* Frontend unit/integration suite: passed.
* Root script-contract suite: 147 passed.
* Functions suite: 57 passed.
* Frontend ESLint: passed.
* Production frontend build: passed; main JavaScript 315.72 kB gzip.
* Firestore rule emulator suite: passed.
* Storage rule emulator suite: passed.
* Public SEO: 27 pages and 27 sitemap URLs passed.
* Public navigation: 26 static pages passed.
* Public pricing: 4 plans passed.
* Functions deploy-package validation: passed.
* Firebase Function inventory: 109 exports passed.
* Demo fixtures: Homeowner+ and Portfolio 1/5/15/100 passed.
* Local public landing page rendered with clean routes, product proof,
  plan cards, security language, resources, and no production Beta badge.

Expected non-blocking output:

* React Router v7 future-flag warnings remain in existing component tests.
* Browserslist data is six months old.
* The main bundle remains above the 300 kB target warning but below the current
  failure threshold.

## Deployment Acceptance

After merge to Beta:

1. Confirm all three Firestore indexes reach Ready.
2. Run the deployed activation journey from registration through account
   deletion.
3. Validate Setup Assistant paths and no duplicate records after retry.
4. Apply the 100-property fixture only to an intentional Beta performance
   account and capture the documented query/render measurements.
5. Run the physical Android checklist before promoting the release.
