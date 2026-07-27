# User-Facing Language Humanization Implementation Plan

Date: 2026-07-26

Status: Approved; implementation started

Implementation progress:

* Release A implemented; automated validation passed.
* Manual responsive and signed-in runtime review remains pending.
* Releases B through D have not started.

Related sources:

* `project-docs/reports/2026-07-26-user-facing-language-humanization-audit.md`
* `project-docs/docs/UX/UX_LANGUAGE_GUIDE.md`
* `project-docs/docs/Product/PRODUCT_DIRECTION.md`
* `project-docs/docs/Product/PUBLIC_SEO.md`
* `project-docs/docs/Product/PUBLIC_SEO_ARCHITECTURE.md`
* `project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md`
* `project-docs/docs/Operations/EMAIL_NOTIFICATIONS.md`
* `project-docs/ADR/0017-personal-focus-dashboard.md`

## Objective

Make Maintley's customer-facing language feel practical, specific, and written
for the person using the product while preserving product accuracy, billing
transparency, search intent, accessibility, and legal meaning.

This is not a global copy replacement. The work includes several different
problems:

1. Runtime language that conflicts with accepted product direction.
2. Internal implementation terms exposed to customers.
3. Accurate but overly technical billing and access explanations.
4. Repetitive public marketing and SEO language.
5. Stale or unverified feature claims.

Each category needs its own review and validation path.

## Outcomes

When this plan is complete:

* Today and Maintley Intelligence guide users with specific next steps instead
  of scores or grades.
* Equipment, tasks, billing, and support use words customers already know.
* Account and billing messages remain transparent without explaining Stripe or
  Maintley's internal implementation unnecessarily.
* Public pages retain distinct search intent but no longer read as variations
  of the same generated template.
* Every customer-facing product claim maps to verified behavior.
* Automated checks catch the most important language regressions.

## Non-goals

This work does not:

* change entitlement resolution, plan limits, prices, or Stripe authority;
* change recommendation-generation rules unless needed to remove an unsupported
  customer-facing score;
* rewrite legal agreements into conversational language;
* remove precise technical terminology from staff-only admin tools where it is
  necessary;
* use an AI detector to approve or reject copy;
* perform a blind repository-wide find and replace;
* add new product capabilities to support a marketing claim.

## Implementation principles

### Write for the action in front of the user

Prefer the property, equipment, record, or task the person can act on. Avoid
explaining the entire Maintley philosophy in routine UI.

### Keep internal and customer vocabulary separate

Terms such as entitlement, lifecycle state, operational memory, resolver,
Stripe coupon, and workflow may remain valid in code, architecture documents,
logs, and staff tools. They should not appear in customer copy unless the term
is necessary to make a billing or support fact understandable.

### Preserve no-surprise billing facts

Humanizing billing language must not remove:

* whether payment information is present;
* whether a charge can occur automatically;
* the complimentary-access end date;
* the first possible charge and recurring price;
* what changes when access ends;
* the direct manage, cancel, or opt-out action.

Stripe remains authoritative for paid billing transitions. Copy changes must
not suggest otherwise.

### Do not humanize unsupported claims

If a claim cannot be mapped to a working product surface, it must be removed or
qualified. Friendlier wording is not a substitute for proof.

### Edit canonical sources

* React application copy is edited in `src/`.
* Function email copy is edited in TypeScript under `functions/`; generated
  `functions/lib/` output is never edited directly.
* Static SEO page body copy and metadata are edited in the relevant
  `public/**/index.html` files.
* Public navigation labels come from `src/config/publicNavigation.json` and are
  propagated with `npm run sync:seo-nav`.
* Public plan facts come from `src/config/publicPlanFacts.json` and are
  propagated with `npm run sync:public-pricing`.

Do not run a synchronization script unless its owning shared source changed.

## Decision gates before remediation

These decisions affect product presentation rather than simple word choice.
They should be approved before their implementation slice begins.

### Gate 1: Replace the Home Health score

Decision: Approved with Maintley Intelligence readiness replacing the score.

Preferred direction:

* Remove the customer-facing percentage and health-signal count.
* Replace the card with category-based Maintley Intelligence readiness.
* Use equipment context, maintenance coverage, and service history as the
  initial categories.
* Use `Starting`, `Building context`, and `Ready` instead of numeric scores.
* Explain what guidance each category currently supports and the next practical
  action when more context would help.
* Implement the calculation in the shared Intelligence layer rather than the
  Dashboard.
* Do not persist a replacement score or duplicate recommendation state.

Before removal, inventory every consumer of the current calculation and confirm
whether the value is derived at runtime or stored. Any behavior beyond
presentation requires a focused technical design review.

This direction is already established by ADR 0017 and the active UX guide. A
new ADR is not required unless implementation reveals a materially different
product model.

### Gate 2: Decide the indexed `/home-health/` destination

Preferred direction:

* Remove Home Health as a named product feature.
* Redirect `/home-health/` to the closest Maintley Intelligence or property
  records destination if its search intent can be satisfied there.
* If the URL has valuable search demand that requires preservation, rewrite it
  as an informational page and use a canonical strategy approved in the SEO
  page brief.

The URL must not continue advertising a product concept removed from the app.

### Gate 3: Retire or rebuild the legacy Feature Docs experience

Preferred direction:

* Remove the public `#/docs` route if it has no distinct customer purpose.
* Replace the signed-in `#/features` experience with a concise, verified plan
  and capability guide if the app still needs a `View all features`
  destination.
* Use the crawlable `/features/` page as the public feature overview.

Do not keep the current exhaustive card catalog. Every retained feature must be
confirmed in the product and plan matrix.

### Gate 4: Establish a small phrase policy

Preferred direction:

* Reserve `future you` for the homepage brand promise and, at most, one
  supporting public page.
* Use `property memory` only when briefly explaining the benefit of saved
  records, not as a routine label or CTA.
* Keep `operational memory` internal.
* Treat `one place` as occasional supporting copy rather than a repeated page
  formula.

This policy should be added to the UX language guide before the public rewrite.

## Phase 0: Establish the change ledger

Create a review ledger from the completed audit. Each entry should include:

| Field | Purpose |
| --- | --- |
| Surface | Where the customer sees the language |
| Canonical file | The source that must be changed |
| Current copy | Exact text being reviewed |
| Problem type | Contradiction, internal term, density, repetition, or claim |
| Required facts | Meaning that cannot be lost |
| Proposed copy | Approved replacement |
| Product proof | Route, control, or behavior supporting the claim |
| Reviewer | Product, billing, legal, SEO, or support owner |
| Validation | Test or manual check required |
| Status | Proposed, approved, implemented, or verified |

Group strings that describe the same state so registration, Settings, in-app
notices, and emails are reviewed together. Do not centralize unrelated prose
into a single runtime constant merely because it uses similar words.

### Documentation reconciliation

Before runtime edits:

1. Record that ADR 0017 supersedes older Home Health integration language in
   ADR 0005 without erasing the historical decision.
2. Remove `Property Health` from active derived-system examples where it is no
   longer a supported customer concept.
3. Align active Maintley Intelligence, roadmap, public SEO, and UX documents on
   non-scored guidance.
4. Keep internal product philosophy in Product and Architecture documents while
   clearly separating it from recommended customer wording.

### Phase 0 exit criteria

* All critical and high audit findings are represented in the ledger.
* Required billing and legal facts are marked before copy drafting begins.
* The four decision gates have an approved outcome.
* Documentation conflicts are resolved or explicitly recorded.

## Phase 1: Correct product-language conflicts

This phase removes language that contradicts accepted architecture and UX
standards. It should ship before broad stylistic cleanup.

### 1.1 Today and Maintley Intelligence

Primary work:

* Remove Home Health, Property Health, maintenance-readiness percentages, and
  health-signal explanations from customer UI.
* Present the approved category-based Maintley Intelligence readiness result and
  specific recommendations produced by the existing shared Intelligence layer.
* Prefer factual counts only when they help the user act.
* Preserve property visibility, role filtering, and Today scope behavior.

Primary files:

* `src/pages/DashboardTab/DashboardTab.tsx`
* related Dashboard components, selectors, and tests
* `project-docs/ADR/0017-personal-focus-dashboard.md`
* active Intelligence and roadmap documentation

### 1.2 Property Insights email

Primary work:

* Remove the record-completeness percentage and ranked `Top Insights` framing.
* Lead with two or three concrete details worth checking.
* Use factual context such as records reviewed only when it can be supported.
* Ensure the CTA names the actual destination.
* Keep attribution clear: Maintley is reviewing saved records, not inspecting
  the physical property.

Primary files:

* `functions/propertyInsightEmails.ts`
* `scripts/testEmailTemplates.cjs`
* `project-docs/docs/Operations/EMAIL_NOTIFICATIONS.md`

### 1.3 Internal terminology leakage

Replace customer-facing uses of:

| Current | Preferred direction |
| --- | --- |
| Lifecycle Status | Equipment status |
| Lifecycle timeline | Service history |
| Last lifecycle update | Installed or retired |
| Maintenance workflow | Maintenance task |
| Operational memory | Maintenance history and records |
| Maintenance memory | Property records or service history |

Primary files:

* `src/pages/PropertyDetailPage/TabSystem/DevicesTab.tsx`
* `src/Components/ConvertRequestToTaskModal/ConvertRequestToTaskModal.tsx`
* `functions/emailBrand.ts`
* affected support and public content

### Phase 1 validation

* Focused component tests verify preferred labels and the absence of displayed
  health scores.
* Recommendation content remains derived from existing source records.
* `npm run test:email-templates` passes.
* Functions and frontend builds pass.
* Manual desktop and mobile review confirms the replacement is useful without
  the removed score.

## Phase 2: Simplify account, access, and billing communication

Treat the same account state as one communication family across registration,
Settings, in-app notices, and lifecycle emails.

### Approved information order

Use progressive disclosure:

1. **What access do I have?**
2. **When does it change?**
3. **Will I be charged?**
4. **What will it cost?**
5. **What can I do about it?**
6. **How it works**, only when the customer asks for more detail.

Customer copy should say `Choose a paid plan` or `Continue with Homeowner+`
instead of `Checkout is required`. It should not compare internal access codes
with Stripe coupons during normal registration.

### Required state matrix

Approve copy for at least:

* Free with no grant.
* Complimentary access with no payment method and no automatic continuation.
* Complimentary access intentionally linked to future paid continuation.
* Paid subscription with and without a discount.
* Equal-level grant plus later paid continuation.
* Higher paid plan while a lower grant remains active.
* Cancelled at period end.
* Payment failed or action required.
* Expired grant with preserved over-limit records.
* Permanent or lifetime internal access.

### Primary files

* `src/Components/RegistrationCard/RegistrationCard.tsx`
* `src/pages/SettingsPage/AccountManagement.tsx`
* account and plan components in Profile and Settings
* `functions/accessLifecycleEmails.ts`
* related in-app event copy and support articles

### Phase 2 validation

* Each state shows the correct access, end date, charge behavior, price, and
  action.
* Copy does not claim an automatic charge without Stripe authority and explicit
  customer consent.
* Lifecycle email milestone, idempotency, suppression, and operational-message
  tests still pass.
* Mobile layouts reveal the primary fact and action before implementation
  detail.
* Billing or legal review approves every changed paid-transition message.

## Phase 3: Rebuild stale product education and support copy

### 3.1 Feature Docs

Implement the approved Gate 3 decision. If rebuilt, organize the experience
around verified customer jobs rather than system categories:

* Remember completed work.
* Track equipment and service details.
* Plan recurring maintenance.
* Keep documents with the property.
* Coordinate existing access where the user's plan allows it.
* Review and export property records.

Remove unsupported analytics, reporting, real-time, collaboration, unit/suite,
and corporate claims. Verify each remaining statement against the current plan
feature matrix and a working route.

### 3.2 Support Center

Rewrite customer procedures around the action the user takes. Move architecture
explanations into staff documentation when they are not necessary for support.
Keep support answers precise enough to resolve access, billing, and data-control
questions.

### 3.3 Onboarding and empty states

Keep the newly simplified onboarding structure. Replace its remaining generic
brand phrases only where a concrete first action is clearer. Preserve the
first-property grant waiting sequence and do not change onboarding business
logic as part of this copy phase.

### Phase 3 validation

* Every feature claim has a proof entry in the change ledger.
* Removed routes have intentional redirects or replacement destinations.
* `View all features`, Support, and browser-back behavior still work.
* Focused onboarding, navigation, and support tests pass.

## Phase 4: Rewrite public marketing and SEO by page intent

Do not rewrite all public pages from a shared prose template. Use the existing
keyword-and-metadata audit and give each page one distinct job.

### Page rewrite brief

For every changed public URL, approve:

* primary search intent;
* one concrete question the page answers;
* verified product claims;
* primary example or proof;
* title, meta description, H1, and canonical URL;
* unique internal links;
* schema implications;
* phrases reserved for other pages;
* keep, merge, redirect, or retire decision.

Resource articles must answer their informational query before introducing
Maintley. Product pages should demonstrate the product with real examples rather
than repeated value statements.

### Rewrite order

1. Homepage and `/features/` establish the approved brand vocabulary.
2. `/home-health/` implements its approved redirect or replacement brief.
3. Product-intent pages receive distinct examples and claims.
4. Homeowner and property-owner solution pages receive audience-specific copy.
5. Resource articles lose repeated closings and retain their informational
   usefulness.
6. Metadata, Open Graph text, schema descriptions, image alt text, and fallback
   HTML are reviewed with the visible page copy.

### Public-site validation

* `npm run validate:seo` passes.
* If navigation changed, run `npm run sync:seo-nav` twice and confirm the second
  run produces no diff.
* If plan facts changed, run `npm run sync:public-pricing`; copy cleanup alone
  must not alter plan facts.
* Sitemap, canonical, redirect, metadata, and structured-data decisions match
  the page brief.
* Internal links and primary CTA destinations work.
* Pages are reviewed at mobile, tablet, and desktop sizes.
* Search Console and Bing submission follow deployment when indexed URLs or
  sitemap entries change.

## Phase 5: Add language regression gates

Automation should identify likely regressions for human review. It should not
pretend to grade whether prose was written by AI.

### 5.1 Customer-copy audit script

Add a read-only script that scans customer-rendered source areas for a small set
of prohibited or review-required phrases.

Fail by default for established prohibited customer terms such as:

* `Home Health`
* `Property Health`
* `Documentation Score`
* `operational memory`
* customer-facing Firebase Console instructions

Warn, count, or require an allowlist review for contextual terms such as:

* lifecycle
* workflow
* Stripe
* Checkout
* future you
* one place
* property memory

The allowlist must identify the exact file and reason. Internal docs, code
identifiers, tests, logs, and staff-only admin copy should not fail simply for
using technically correct vocabulary.

Suggested command:

```text
npm run validate:language
```

### 5.2 Claim ledger validation

Maintain a small reviewed list for important public claims, especially:

* encryption and security statements;
* real-time or automated behavior;
* reporting and export capabilities;
* platform availability;
* plan-specific limits;
* Maintley Intelligence behavior.

This can begin as a documented review checklist. Automate only stable claims
that map cleanly to shared product facts.

### 5.3 Pull request checklist

Any change to customer copy should answer:

1. Is this a familiar word for the customer?
2. Does it name a concrete action or outcome?
3. Is it accurate for the current plan and product state?
4. Does it preserve required billing or legal facts?
5. Does another page already use the same brand formula?
6. Does mobile reveal the most important sentence first?
7. Were metadata, email text, and fallback content checked when applicable?

### Phase 5 validation

* The language script detects seeded prohibited examples.
* Current intentional internal uses are narrowly allowlisted.
* New checks run in the normal validation workflow without scanning generated
  dependencies or build output.
* Documentation explains how to add and review an exception.

## Recommended delivery sequence

Use coherent, reviewable releases rather than one repository-wide rewrite or a
large number of tiny copy pull requests.

### Release A: Product-language alignment

* Documentation reconciliation.
* Today score and health removal.
* Property Insights email correction.
* Equipment, task, email-footer, and error terminology cleanup.

This is first because it resolves conflicts with accepted product direction.

### Release B: Account and billing clarity

* State matrix.
* Registration and access-code wording.
* Settings/Profile billing hierarchy.
* Access lifecycle email and in-app wording.
* Support articles directly related to these flows.

Keep this isolated enough for billing-state regression testing.

### Release C: Product education and public content

* Feature Docs retirement or rebuild.
* Remaining support and onboarding polish.
* Phrase policy.
* Public and SEO page rewrites.
* Indexed URL and redirect work.

### Release D: Regression automation

* Language validator and allowlist.
* Claim review ledger.
* Pull request and testing documentation.

The validator may be prototyped earlier, but it should become blocking only
after the approved copy baseline is clean.

## Full validation matrix

### Automated

* Focused component tests for every changed stateful surface.
* Focused absence assertions for prohibited displayed labels.
* `npm run test:email-templates`.
* `npm run validate:seo` for public content.
* `npm run lint` or focused lint during each slice.
* `npm run build`.
* Functions build when email sources change.
* Relevant safe browser tests for authentication, support, properties, and
  billing navigation.

### Manual

* Homeowner, multi-homeowner, property, portfolio, granted, paid, cancelled,
  and expired-access views as applicable.
* Mobile, tablet, and desktop copy hierarchy.
* Screen-reader naming for revised controls and disclosures.
* Plain-text and HTML email rendering.
* Links from emails, support, Settings, public pages, and feature guides.
* Browser back navigation after leaving the app for public content.

### Release observation

For each release:

* Monitor customer support questions for misunderstood labels or billing state.
* Verify email delivery and CTA destinations without adding operational logs to
  the admin decision audit trail.
* Review public-page indexing and redirects when URLs change.
* Record follow-up findings in the change ledger instead of making ad hoc phrase
  changes across unrelated surfaces.

## Definition of done

The remediation is complete when:

* No customer surface displays a Home Health, Property Health, or record
  completeness score, and Dashboard readiness comes from the shared Maintley
  Intelligence layer.
* Customer equipment and task surfaces use familiar status, service-history,
  and task language.
* `operational memory` remains internal.
* Billing and complimentary-access states are understandable without requiring
  knowledge of Stripe or Maintley's entitlement architecture.
* The Feature Docs experience contains only verified capabilities or has been
  intentionally retired.
* Every indexed public page has distinct intent and non-repetitive body copy.
* Email, metadata, fallback HTML, errors, onboarding, support, and admin-facing
  customer messages have been reviewed—not only visible React page headings.
* Automated language checks, focused tests, SEO validation, and production
  builds pass.
* Active documentation describes the implemented vocabulary and product
  behavior.

## Recommended first action

Approve the four decision gates, then implement Release A. Begin with the
documentation reconciliation and current Home Health consumer inventory before
changing Dashboard presentation. That prevents a cosmetic rename from leaving
the old evaluation model active under a different label.
