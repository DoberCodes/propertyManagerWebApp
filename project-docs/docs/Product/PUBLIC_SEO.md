# Public SEO Pages

Last reviewed: 2026-07

# Purpose

Maintley's public search presence should explain the product clearly before a
visitor signs in.

For page-level keyword ownership, search intent, internal linking, metadata
briefs, and cannibalization decisions, see `PUBLIC_SEO_ARCHITECTURE.md`.

The first SEO wedge is:

```text
home maintenance memory + equipment/service history + recurring care
```

The goal is not to compete broadly for generic property management software
terms before Maintley has enough public content and authority.

---

# Current Public SEO Pages

The public app still uses `HashRouter` for the authenticated React experience.

To support clean crawlable URLs without changing app routing yet, Maintley ships
static public pages from `public/`:

* `/`
* `/features/`
* `/home-maintenance-app/`
* `/home-maintenance-tracker/`
* `/appliance-maintenance-tracker/`
* `/home-maintenance-log/`
* `/maintenance-reminders/`
* `/property-records/`
* `/warranty-tracker/`
* `/home-document-organizer/`
* `/home-health/`
* `/property-maintenance-software/`
* `/homeowners/`
* `/property-managers/`
* `/pricing/`
* `/legal/`
* `/resources/`
* `/resources/home-maintenance-checklist/`
* `/resources/appliance-maintenance-log/`
* `/resources/how-to-create-home-maintenance-log/`
* `/resources/what-maintenance-records-should-homeowners-keep/`
* `/resources/appliance-warranty-organizer/`
* `/resources/hvac-filter-replacement-schedule/`
* `/resources/new-home-maintenance-tracker/`
* `/resources/seasonal-home-maintenance-schedule/`
* `/resources/home-service-history/`

These pages are listed in:

```text
public/sitemap.xml
```

When adding or removing a static public page, update the sitemap in the same
change.

---

# Metadata Rules

Public pages should have:

* One clear H1
* Unique title
* Unique meta description
* Canonical URL
* `robots` set to `index, follow`
* Useful crawlable body copy

The homepage also includes:

* Organization JSON-LD
* WebSite JSON-LD
* SoftwareApplication JSON-LD

Resource articles include Article JSON-LD where appropriate. FAQ pages should
include FAQPage JSON-LD when the visible FAQ content is stable.

Resource guides should also include BreadcrumbList JSON-LD so search engines can
understand the `/resources/` hierarchy.

Pricing pages should include offer-oriented SoftwareApplication JSON-LD when the
public pricing page describes available plans.

Public pages should use real Maintley screenshots when they help explain the
product. Prefer screenshots that show the actual dashboard, timeline, equipment,
documents, reports, or Maintley Intelligence views over generic decorative imagery.

Public pages should include Open Graph and Twitter card metadata using absolute
URLs. Use a topic-relevant Maintley screenshot for `og:image` and
`twitter:image` when possible.

The React homepage and static public pages share the data-only navigation source:

```text
src/config/publicNavigation.json
```

The enabled primary navigation contains Features, Solutions, Resources, Pricing,
Login, and Start Free. Solutions contains Homeowners and Property Owners &
Managers. Resources contains three featured guides plus All Articles. The future
Service Businesses entry remains disabled and must not render, enter structured
data, or appear in the sitemap before its launch gates pass.

React controls dropdown state directly. Opening one group closes the other, and
Escape, outside interaction, navigation, or focus leaving the menu closes the
active dropdown. Static pages use `public/public-nav.js` for equivalent progressive
enhancement while keeping every link usable without JavaScript.

Run `npm run sync:seo-nav` after changing the shared navigation definition.

Public plan names, prices, limits, positioning, and card highlights use:

```text
src/config/publicPlanFacts.json
```

Core subscription permissions and features remain in
`src/constants/subscriptions.ts`, which imports the shared public facts. Run
`npm run sync:public-pricing` after changing public plan facts. SEO validation
checks the generated pricing page against all four current plans.

The public `robots.txt` should continue to reference:

```text
https://maintleyapp.com/sitemap.xml
```

---

# Post-Deploy Search Submission

After deploying public SEO changes:

1. Open Google Search Console for `maintleyapp.com`.
2. Submit or refresh `https://maintleyapp.com/sitemap.xml`.
3. Inspect the homepage URL and a few important landing pages:
   * `https://maintleyapp.com/home-maintenance-tracker/`
   * `https://maintleyapp.com/appliance-maintenance-tracker/`
   * `https://maintleyapp.com/resources/home-maintenance-checklist/`
4. Open Bing Webmaster Tools.
5. Submit or refresh the same sitemap URL.
6. Check for indexing errors, blocked resources, redirect issues, and missing
   canonical URLs after the crawlers process the sitemap.

The first query tracking set should include:

* home maintenance tracker
* appliance maintenance tracker
* home maintenance log
* property maintenance history
* home maintenance app
* property records
* warranty tracker
* landlord maintenance tracker
* property maintenance software
* appliance warranty organizer
* home document organizer
* recurring maintenance reminders

---

# Content Positioning

Preferred public positioning:

```text
Maintley helps homeowners and property owners build a living maintenance memory
for every home.
```

Use plain homeowner-friendly terms:

* home maintenance tracker
* equipment records
* maintenance history
* service history
* warranties
* manuals
* recurring reminders
* home documents
* add to Home Screen on iPhone and iPad

Avoid using `PWA` as the primary customer-facing label. Explain that iPhone and
iPad users can open Maintley in Safari and add it to their Home Screen.

Avoid leading with generic phrases such as:

* property management made simple
* asset configuration
* operational workflow

---

# Homepage Content Architecture

The React homepage is a concise public-site hub. Its current order is:

```text
Hero
Product proof
How Maintley Works
Who Maintley Is For
Core Features
Security and control
Compact pricing preview
Final call to action
```

Product proof uses current Maintley screenshots before extended explanation.
Screenshot images must include explicit dimensions, meaningful alternative text,
and lazy loading when they appear below the first proof view.

The Who Maintley Is For section reads enabled solution destinations from
`src/config/publicNavigation.json`. Disabled destinations, including Service
Businesses, must not render in the section or footer.

The homepage Core Features section is intentionally compact and links to
`/features/` for detailed evaluation. Homepage pricing reads the same
`src/config/publicPlanFacts.json` facts used by subscriptions and the static
`/pricing/` page, but presents only a short plan preview and links to the full
comparison.

Long-form founder narrative, full property timelines, full feature and pricing
matrices, contact forms without reliable server submission, and detailed install
instructions do not belong on the homepage.

---

# Future Work

Recommended next SEO phases:

1. Expand FAQPage JSON-LD only where the visible page has stable FAQ content.
2. Continue expanding `/resources/` with product-led guides based on Search Console
   impressions and user questions.
3. Replace screenshot-based social previews with custom branded OG images if
   Maintley needs more polished share cards.
4. Submit `https://maintleyapp.com/sitemap.xml` in Google Search Console and
   Bing Webmaster Tools after deploy.
5. Consider moving public marketing routes from static HTML to first-class clean
   React routes if Maintley moves away from `HashRouter`.

Run `npm run validate:seo` before deploying public page changes. The validator
checks page metadata, canonical URLs, JSON-LD parsing, and sitemap coverage.
