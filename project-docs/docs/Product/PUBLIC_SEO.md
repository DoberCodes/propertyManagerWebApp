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
* `/property-maintenance-software/`
* `/legal/`

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

1. Add FAQPage JSON-LD to pages with FAQ sections.
2. Add resource articles under `/resources/`.
3. Add screenshots or branded OG images for social sharing.
4. Consider moving public marketing routes from static HTML to first-class clean
   React routes if Maintley moves away from `HashRouter`.
