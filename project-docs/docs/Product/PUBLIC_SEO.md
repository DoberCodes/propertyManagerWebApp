# Public SEO Pages

Last reviewed: 2026-07

# Purpose

Maintley's public search presence should explain the product clearly before a
visitor signs in.

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
* `/home-maintenance-tracker/`
* `/appliance-maintenance-tracker/`
* `/home-maintenance-log/`
* `/maintenance-reminders/`
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
documents, reports, or Home Health views over generic decorative imagery.

Public pages should include Open Graph and Twitter card metadata using absolute
URLs. Use a topic-relevant Maintley screenshot for `og:image` and
`twitter:image` when possible.

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

Avoid leading with generic phrases such as:

* property management made simple
* asset configuration
* operational workflow

---

# Future Work

Recommended next SEO phases:

1. Add more FAQPage JSON-LD to future pages with stable FAQ sections.
2. Expand `/resources/` with more product-led guides based on Search Console
   impressions and user questions.
3. Replace screenshot-based social previews with custom branded OG images if
   Maintley needs more polished share cards.
4. Submit `https://maintleyapp.com/sitemap.xml` in Google Search Console and
   Bing Webmaster Tools after deploy.
5. Consider moving public marketing routes from static HTML to first-class clean
   React routes if Maintley moves away from `HashRouter`.
