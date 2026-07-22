# Public Site Improvement Implementation Plan

Date: 2026-07-21

Status: Proposed implementation plan

Related direction:

* `project-docs/docs/Product/PUBLIC_SEO.md`
* `project-docs/docs/Product/PUBLIC_SEO_ARCHITECTURE.md`
* `project-docs/docs/Product/MAINTLEY_PLAN_FEATURE_MATRIX.md`
* `project-docs/docs/UX/UX_LANGUAGE_GUIDE.md`
* `project-docs/docs/UX/MOBILE_UX_GUIDE.md`
* `project-docs/ADR/0027-business-licensing-property-stewardship-and-record-attribution.md`
* `project-docs/reports/2026-07-21-business-licensing-readiness-and-implementation-plan.md`

## Objective

Make the public Maintley experience consistent, mobile-safe, easy to evaluate,
and aligned with the current homeowner-first product. The work should improve
navigation, pricing clarity, product proof, trust content, educational discovery,
and contact reliability without marketing unimplemented Organization licensing
as an available product.

## Confirmed findings from the local build

1. The React homepage navigation and static marketing-page navigation differ.
2. Both mobile dropdowns can remain open. On a 375 x 667 viewport, the menu
   extends below the viewport without an internal scroll area.
3. The pricing audience control requires automated behavioral coverage. The
   local browser review did not immediately show the expected Property and
   Portfolio content after selecting Business even though component state and
   plan groups exist in code.
4. The homepage contains strong explanatory content but delays product proof and
   repeats the Property Memory message across several sections.
5. The homepage does not have a visible FAQ or a customer-friendly security and
   privacy destination.
6. Resource articles are available through navigation but are not featured in
   the homepage content.
7. Service Businesses currently routes to a general contact section even though
   the licensed-business product is not ready to launch.
8. The contact form opens a `mailto:` URL instead of submitting reliably to
   Maintley.

## Implementation principles

* Use one public information architecture across React and static pages.
* Keep Portfolio as a plan and avoid implying Organization licensing is live.
* Use plain homeowner-friendly language.
* Show real Maintley product behavior before adding more narrative copy.
* Prefer shared configuration over duplicated navigation and pricing content.
* Preserve crawlable static pages, canonical URLs, and structured data.
* Treat mobile and keyboard navigation as release requirements.
* Do not make security claims that cannot be supported by current behavior.

## Target public information architecture

```text
Features

Solutions
  Homeowners
  Property Owners & Managers
  Service Businesses (early access only until launch-ready)

Resources
  Home Maintenance Checklist
  Seasonal Maintenance Schedule
  Home Service History
  All Articles

Pricing
Login
Start Free
```

About, Contact, Download, Help Center, and legal documents remain accessible in
the footer or page content. They do not need primary-navigation positions.

## Phase 0: Product decisions and baseline tests

### Decisions

1. Use **Property Owners & Managers** consistently across navigation, headings,
   metadata, and footer copy.
2. Use **Service Businesses** instead of the vague **Businesses** label.
3. Until licensing launch gates pass, either:
   * omit Service Businesses from primary navigation; or
   * label it as early access and route it to a purpose-specific inquiry form.
4. Clarify that the homepage Business pricing audience means the current
   Property and Portfolio plans, not the future Organization licensing product.
5. Approve the initial three featured resource articles.

### Baseline coverage

Before restructuring, add tests that capture current public routes, plan names,
navigation destinations, and mobile breakpoints. This prevents accidental SEO
or subscription-copy regressions during consolidation.

### Acceptance criteria

* Product terminology decisions are recorded in this plan or the appropriate
  active documentation.
* Tests fail if required public destinations disappear.
* No copy claims Service Business licensing is currently available.

## Phase 0.5: Keyword and metadata audit

Complete the public SEO architecture and page-level keyword map before changing
homepage hierarchy or creating new public pages. Use
`project-docs/docs/Product/PUBLIC_SEO_ARCHITECTURE.md` as the source of truth.

For every existing, proposed, redirected, or retired public page, define:

* primary keyword or branded purpose
* supporting keywords
* search intent
* page role in the visitor journey
* unique title
* meta description
* H1
* canonical URL
* required inbound and outbound internal links
* structured-data type
* index, redirect, canonicalize, or retire decision

The audit must specifically resolve keyword overlap among the homepage,
`/home-maintenance-app/`, `/home-maintenance-tracker/`, `/features/`, and
`/property-maintenance-software/`. Do not allow multiple pages to target the same
primary query without a documented difference in search intent.

Business-licensing keywords should be researched and tracked as a future keyword
cluster, but must not receive public landing pages or homepage optimization until
the Service Business product and launch gates are approved.

### Acceptance criteria

* Every indexed public page has one documented primary purpose and search intent.
* No two pages unintentionally own the same primary keyword.
* Proposed About, Security & Privacy, and Contact pages have approved metadata
  briefs before implementation.
* Article keywords remain informational and satisfy the query before introducing
  Maintley.
* Internal-link destinations and schema types are defined before templates are
  changed.

## Phase 1: Shared navigation and mobile hardening

### 1.1 Create one navigation configuration

Add a data-only public navigation definition that both browser code and Node
scripts can consume. A JSON or similarly environment-neutral file is preferred
over importing React or CommonJS implementation code across runtimes.

Each entry should define:

* stable identifier
* label
* destination
* destination type: page, application route, or homepage section
* group
* display order
* whether the item is currently enabled
* optional early-access state

The Solutions definition should include a disabled Service Businesses entry
from the beginning. Disabled entries must not render in navigation, homepage
content, static HTML, structured data, or the sitemap. Enabling the destination
after its product and legal launch gates pass should be a configuration change,
not a navigation-architecture rewrite.

Primary consumers:

* `src/Components/Library/LandingNavbar/LandingNavbar.tsx`
* `scripts/syncPublicSeoNav.cjs`
* homepage footer groups where appropriate

The React navbar may keep interactive rendering components, but labels and
destinations should come from the shared definition.

### 1.2 Update the static navigation generator

Change `scripts/syncPublicSeoNav.cjs` to generate the same Features, Solutions,
Resources, Pricing, Login, and Start Free structure. Do not render all articles
inside the primary Resources dropdown.

Run `npm run sync:seo-nav` and review every changed public page. Update
`project-docs/docs/Product/PUBLIC_SEO.md`, which currently documents the older
Home / Features / Pricing / Browse Resources structure.

### 1.3 Make dropdowns mutually exclusive

Use controlled React state or an accessible accordion/menu pattern so opening
Solutions closes Resources and vice versa. Also close dropdowns when:

* a destination is selected
* Escape is pressed
* focus leaves the navigation where practical
* the mobile menu closes

Static pages should use an equivalent small progressive-enhancement script or a
supported exclusive-details pattern. Links must remain usable without script.

### 1.4 Add mobile scroll containment

The expanded mobile navigation must use a viewport-relative limit:

```css
max-height: calc(100dvh - var(--public-header-height));
overflow-y: auto;
overscroll-behavior: contain;
```

Include safe-area padding and keep every touch target at least 44px high.

### Files likely affected

* `src/Components/Library/LandingNavbar/LandingNavbar.tsx`
* `src/Components/Library/LandingNavbar/LandingNavbar.styles.tsx`
* `src/Components/Library/LandingNavbar/LandingNavbar.test.tsx`
* `scripts/syncPublicSeoNav.cjs`
* `public/seo-page.css`
* generated `public/**/index.html` navigation blocks
* `project-docs/docs/Product/PUBLIC_SEO.md`

### Acceptance criteria

* React and static pages expose the same primary destinations and labels.
* Only one dropdown can be expanded at a time.
* Every action remains reachable at 320 x 568, 375 x 667, 390 x 844, tablet,
  and desktop sizes.
* The mobile menu scrolls internally when its content exceeds the viewport.
* Keyboard users can open, traverse, and close the navigation.
* `npm run validate:seo` and navigation synchronization checks pass.

## Phase 2: Pricing behavior and source-of-truth alignment

### 2.1 Lock down audience-toggle behavior

Add focused tests around `PricingSection.tsx`:

* Homeowner shows Free and Homeowner+.
* Business shows Property and Portfolio.
* The comparison columns change with the cards.
* The subtitle changes with the selected audience.
* Selected state is exposed through `aria-pressed` or an equivalent accessible
  control state.

If the current browser behavior is a timing or test-observation issue, the test
will confirm the component is correct. If it is a rendering bug, fix the state
or styling path before other pricing work.

### 2.2 Clarify the Business label

Add supporting text such as:

> For landlords, property owners, and property-management teams.

Do not describe this audience as the future licensed Service Business product.

### 2.3 Align homepage and static pricing

The homepage uses current subscription constants while `public/pricing/` is
maintained separately. Introduce a build-time public pricing data source or
validation script so both surfaces agree on:

* plan names
* monthly prices
* property limits
* equipment limits
* storage and file limits
* major capability differences
* audience positioning

The active plan feature matrix remains authoritative.

### Files likely affected

* `src/pages/LandingPage/components/PricingSection.tsx`
* `src/pages/LandingPage/LandingPage.styles.tsx`
* new focused pricing test
* `public/pricing/index.html`
* pricing constants or a new build-time public pricing definition
* `scripts/validatePublicSeo.cjs` or a focused pricing consistency script

### Acceptance criteria

* Selecting either audience changes cards, comparison columns, and supporting
  copy deterministically.
* Pricing controls communicate selected state to assistive technology.
* Homepage and `/pricing/` show identical plan facts.
* Property, Portfolio, and future Organization licensing remain distinct.

## Phase 3: Homepage hierarchy and product proof

### 3.0 Adopt a hub-and-detail page strategy

Do not keep every public-site concern on the homepage. The homepage should be a
concise product overview that helps a visitor answer:

1. What is Maintley?
2. Is it meant for someone like me?
3. What does the product actually look like?
4. Why should I trust it with property records?
5. What should I do next?

Use focused pages for detailed evaluation. Do not create a separate page for
every small section; use the existing Features, Solutions, Pricing, and
Resources destinations wherever they already provide the correct home.

Recommended content boundaries:

| Homepage content | Detailed destination |
| --- | --- |
| Hero and primary value proposition | Homepage only |
| Two or three product screenshots | Full tour on Features or How Maintley Works |
| Short four-step explanation | Expanded product behavior on Features |
| Three audience cards | Homeowners and Property Owners & Managers pages |
| Short security and control summary | Security & Privacy page |
| Starting price or compact plan cards | Full comparison on Pricing |
| Three featured guides | Full Resources index |
| Four to six common questions | Expanded FAQ content where needed |
| Final Start Free action | Homepage and relevant detail pages |

Move or reduce the current long-form sections as follows:

* Move the full founder story to a new About page and retain only a short origin
  sentence or link on the homepage.
* Condense the long property timeline into one product-proof example or move it
  into the detailed Features/How Maintley Works experience.
* Keep a compact core-feature overview and rely on `/features/` for the full
  catalog.
* Replace the homepage's full pricing matrix with a compact audience-oriented
  preview and a link to `/pricing/`.
* Reduce the four large benefit rows into a smaller evidence-based product or
  trust section.
* Move installation instructions to Help content; keep only concise app/web
  availability and store links on the homepage or footer.
* Move the full contact form to a dedicated Contact page once reliable server
  submission exists; the homepage may retain a short contact callout.

Recommended new public pages are limited to:

* `/about/`
* `/security-and-privacy/`
* `/contact/`

A separate `/how-it-works/` page is optional. Prefer expanding `/features/`
unless the product tour becomes substantial enough to deserve its own search and
navigation destination.

Service Businesses is a prepared but disabled future solution destination. It
must not have a public page or visible card until the Organization licensing,
permission, agreement, and launch requirements defined by ADR 0026, ADR 0027,
and the business licensing readiness plan are satisfied.

### 3.1 Reorder the homepage

Target order:

```text
Hero
Product proof
How Maintley Works
Who Maintley Is For
Core features
Security and control
Featured resources
Pricing
FAQ
Final call to action
```

This order intentionally answers **Is Maintley for me?** before asking visitors
to evaluate the complete capability set. The audience section should remain
short and route visitors to the appropriate detailed solution page.

Keep the founder story and property timeline, but shorten, combine, or move them
below the first product demonstration. The first screenfuls should answer what
Maintley does and show the product before repeating the long-term-memory story.

### Target homepage length

Use approximately seven to nine primary sections, excluding the header and
footer. Avoid setting a fixed pixel or word-count target; completeness and
mobile scanability matter more. A visitor should encounter product UI, audience
fit, trust, and a meaningful call to action without reading every detail page.

The target homepage is:

```text
Hero
Product proof
How Maintley Works (short)
Who Maintley Is For
Core features
Security and control
Featured resources
Compact pricing preview
FAQ
Final call to action
```

Long comparison tables, full article collections, detailed installation
instructions, and long-form company narrative should not remain on the homepage.

### 3.2 Add a real product tour

Use current Maintley screenshots and short explanations for:

* property overview
* equipment record
* Maintenance Event and service history
* recurring task or reminder
* document upload and review
* Maintley Intelligence recommendation
* mobile record entry

The section should not imply physical inspection, automatic diagnosis, or
certified maintenance records. Use responsive images, explicit dimensions, lazy
loading below the fold, and meaningful alternative text.

### 3.3 Add a Solutions section

Create cards for:

* Homeowners
* Property Owners & Managers
* Service Businesses as a prepared, disabled configuration entry

Only enabled cards render. Each rendered card should have one clear destination.
Do not repeat the full feature catalog. The Service Businesses card may be
enabled only in an approved early-access or launch-ready state and must use the
ownership, responsibility, and access boundaries established by ADR 0026 and
ADR 0027.

### Files likely affected

* `src/pages/LandingPage/LandingPage.tsx`
* `src/pages/LandingPage/LandingPage.styles.tsx`
* new focused section components under `src/pages/LandingPage/components/`
* approved assets under the established public or source asset paths

### Acceptance criteria

* Visitors see real product UI before the extended brand story.
* The page has no major repeated sections making the same claim without new
  evidence.
* Product screenshots remain legible and performant on mobile.
* Every Solutions card uses approved terminology and an available destination.

## Phase 4: Featured resources, FAQ, and trust content

### 4.1 Add featured resources to the homepage

Show three article cards plus **All Articles**. Each card should include title,
one-sentence benefit, topic label, and direct link. Source the labels and routes
from a small shared resource definition where practical so navigation and cards
do not drift.

### 4.2 Add a public FAQ

Initial questions:

* Is Maintley free?
* Can I manage multiple properties?
* Who owns my property records?
* Can contractors or service businesses access my property?
* Does Maintley verify maintenance work?
* Can I export my information?
* Does Maintley work on iPhone, iPad, Android, and the web?
* What happens if I cancel?

Answers must reflect implemented behavior and approved legal language. Add
FAQPage structured data only when the visible FAQ is stable and identical in
meaning.

### 4.3 Add a Security & Privacy page

Create a customer-friendly page explaining:

* homeowner ownership and control
* authentication and permission enforcement
* professional access and revocation boundaries, limited to implemented behavior
* encryption claims that Maintley can substantiate
* export and deletion behavior
* incident and support contact routes
* links to the Privacy Policy and relevant terms

This page is product education, not a replacement for legal documents. Avoid
claiming industry certifications Maintley does not hold.

Add the page to navigation or the privacy section, footer, sitemap, and SEO
validation.

### Acceptance criteria

* Resources are discoverable without opening navigation or reaching the footer.
* FAQ answers match current product and legal behavior.
* Security claims are specific, supportable, and linked to policies.
* New pages have titles, descriptions, canonicals, social metadata, and sitemap
  entries.

## Phase 5: Reliable contact and early-access intake

### 5.1 Replace the `mailto:` form

Implement a server-authoritative public contact endpoint. Prefer reusing the
existing support/admin-inbox architecture when it can safely accept unauthenticated
public submissions without exposing internal records.

Required fields:

* name
* email
* inquiry category
* subject
* message
* privacy acknowledgement when required

Initial categories:

* General question
* Account support
* Property owner or manager
* Service business early access
* Privacy request

### 5.2 Abuse and privacy controls

The endpoint requires:

* server-side validation and normalization
* rate limiting
* honeypot or equivalent low-friction bot defense
* App Check where appropriate and usable for the public web flow
* no sensitive values in logs
* documented retention
* delivery or inbox failure handling

The UI needs sending, success, retryable error, and non-retryable validation
states. Do not show success before the server accepts the message.

### 5.3 Service Business routing

If Service Businesses remains visible before licensing launch, route it to a
prefilled early-access category with clear language that Maintley is gathering
interest. Do not present organization accounts, contributor access, or licensing
terms as already available.

### Files likely affected

* `src/pages/LandingPage/LandingPage.tsx`
* contact form component and tests
* Cloud Function exports and a new public submission handler
* Firestore rules only if a server-owned collection requires explicit denial
* Admin inbox/support presentation if reused
* privacy and retention documentation

### Acceptance criteria

* A visitor can submit without a configured local email client.
* The server confirms acceptance before the UI reports success.
* Invalid and abusive submissions are rejected safely.
* Service Business inquiries are distinguishable from support requests.
* Public users cannot read contact submissions.

## Phase 6: Terminology and indexed-page cleanup

Audit public content for:

* `Property Managers` versus `Property Owners & Managers`
* `Businesses` versus `Service Businesses`
* language implying businesses are Maintley partners
* tenant functionality presented as a major product pillar
* `Home Health` terminology that conflicts with Maintley Intelligence guidance
* claims that Maintley verifies, certifies, or physically assesses work

Decide whether `/home-health/` should be reframed, redirected, or retained only
as an SEO landing page with approved language. Preserve redirects and canonical
signals when changing indexed URLs.

### Acceptance criteria

* Navigation, footer, metadata, and page headings use consistent audience names.
* Service businesses are described as customers or licensees, not partners.
* Tenant language reflects the reduced maintenance-request-focused scope.
* Maintley Intelligence language does not imply physical inspection.

## Test and validation matrix

### Component tests

* navbar destinations and dropdown exclusivity
* Escape, selection, and mobile-menu close behavior
* pricing audience state and comparison columns
* FAQ expansion and accessible naming
* contact validation and submission states

### Static-site tests

* navigation synchronization is idempotent
* required routes and canonical URLs remain present
* no duplicate primary navigation models remain
* pricing facts match the authoritative plan data
* sitemap contains every approved public destination
* FAQ structured data matches visible questions

### Browser tests

Test at minimum:

* 320 x 568
* 375 x 667
* 390 x 844
* tablet portrait
* 1024px desktop boundary
* 1440px desktop

Verify keyboard navigation, dropdown visibility, internal menu scrolling,
pricing switching, CTA destinations, article links, and contact submission
states.

### Build and release gates

* focused unit tests pass
* full relevant test suite passes
* production build passes
* public SEO validation passes
* asset budgets pass after screenshots are added
* no broken internal public links
* manual mobile and desktop browser review passes

## Recommended delivery slices

### Slice A: Navigation and pricing correctness

* shared navigation definition
* React/static navigation alignment
* exclusive and scrollable mobile dropdowns
* pricing audience tests and fix
* pricing accessibility state

This is the first recommended implementation slice because it corrects active
interaction and consistency problems without requiring new product claims.

### Slice B: Homepage clarity

* product tour
* reordered content
* Solutions cards
* featured resources

### Slice C: Trust and conversion

* FAQ
* Security & Privacy page
* reliable contact endpoint
* Service Business early-access intake if approved

### Slice D: Public-content cleanup

* terminology sweep
* indexed-page decisions and redirects
* final structured-data and sitemap updates

## Explicit non-goals

This public-site work does not implement:

* Organizations
* Contributor property access
* sponsored-property claims
* licensed-business billing
* CRM, scheduling, dispatch, invoicing, or field-service workflows
* certifications or security attestations Maintley does not currently possess

## First implementation recommendation

Begin with Slice A. Within Slice A, implement mobile dropdown exclusivity and
scroll containment first, then create the shared navigation definition and
synchronize static pages, and finally lock down pricing behavior with tests.
This order removes the confirmed interaction risks before restructuring content.
