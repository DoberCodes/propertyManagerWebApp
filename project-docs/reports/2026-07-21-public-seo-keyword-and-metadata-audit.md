# Public SEO Keyword and Metadata Audit

Date: 2026-07-21

Status: Implementation-ready planning baseline; Search Console performance review remains a release gate for redirects

## Purpose

This report completes the Phase 0.5 keyword-and-metadata audit required before
Maintley's public-site restructuring begins.

It inventories every current indexed static URL, resolves page-purpose overlap,
and provides an implementation brief for every retained, redirected, or proposed
public page.

The audit covers:

* the 26 current static pages in `public/`
* the 26 URLs in `public/sitemap.xml`
* the three approved proposed pages: About, Security & Privacy, and Contact

Authenticated hash routes such as `/#/login`, `/#/register`, and `/#/help` are
application destinations, not indexed public SEO pages, and are outside the
keyword map.

## Evidence and limitations

Evidence reviewed:

* current static HTML output
* sitemap coverage
* title, description, H1, canonical, robots, Open Graph, Twitter, and JSON-LD
* visible headings and approximate on-page word counts
* current public search-result intent for home-maintenance apps, trackers,
  rental-property maintenance products, logs, checklists, and schedules
* Maintley's current product, audience, ownership, and terminology documentation

No Google Search Console, Bing Webmaster Tools, backlink index, or paid keyword
volume dataset was available during this audit. Keyword assignments are approved
for implementation based on intent, but redirect release must first check current
impressions, clicks, ranking queries, and external links for the affected URLs.

Do not interpret this report as a claim of search volume or ranking difficulty.

## Current inventory result

The current technical baseline is sound but the page strategy needs refinement:

* 26 static HTML pages are present.
* The sitemap contains the same 26 canonical URLs.
* `npm run validate:seo` passes with 26 pages and 26 sitemap URLs.
* Every current page has a unique title, H1, canonical URL, and `index, follow`.
* Every current page includes Open Graph and Twitter metadata.
* `/home-health/` has an unusable one-word description: `Maintley`.
* Seven pages have no JSON-LD: Features, Home Health, Homeowners, Legal,
  Property Maintenance Software, Property Managers, and Resources.
* Several core audience and product pages contain only about 184-233 visible
  words, limiting their ability to demonstrate a distinct search purpose.
* Product schema is inconsistent, and retained product pages generally lack
  BreadcrumbList schema.

## Decisions

### Keep and differentiate

Retain the following product and solution pages with unique intent:

* `/` owns **home maintenance app**.
* `/home-maintenance-tracker/` owns **home maintenance tracker**.
* `/features/` owns feature-evaluation intent.
* `/homeowners/` owns the homeowner audience decision.
* `/property-managers/` owns rental-property maintenance tracking for property
  owners, landlords, and property-management teams.
* The appliance, records, log, reminder, warranty, and document pages each own a
  focused product use case.
* All nine resource guides remain informational and must answer their query
  before introducing Maintley.

### Consolidate

Preferred permanent redirects:

| Current URL | Destination | Reason |
| --- | --- | --- |
| `/home-maintenance-app/` | `/` | It targets the homepage's primary product query and adds no durable audience or task distinction. |
| `/property-maintenance-software/` | `/property-managers/` | The generic query commonly implies a full property-management operations suite; Maintley should instead own the narrower rental-property maintenance-record use case. |
| `/home-health/` | `/features/` | The name conflicts with Maintley Intelligence terminology and can imply physical assessment or diagnosis. The current page is too small to establish a separate search purpose. |

Before shipping these redirects:

1. Review Search Console landing-page queries, clicks, and impressions.
2. Check external links and preserve valuable destination context.
3. Use one-hop permanent redirects.
4. Remove redirected URLs from navigation, internal links, and the sitemap.
5. Keep the destinations self-canonical; do not use canonicals instead of
   redirects.

### Add

Create three focused pages already approved by the public-site plan:

* `/security-and-privacy/`
* `/about/`
* `/contact/`

Do not create or index a Service Businesses page yet. Its keyword cluster
remains research-only until the Organization licensing and launch gates pass.

## Current-page inventory

Schema abbreviations: `SW` SoftwareApplication, `FAQ` FAQPage, `ART` Article,
`BC` BreadcrumbList, `ORG` Organization, and `WS` WebSite.

| URL | Current title | Current H1 | Approx. words | Schema | Decision |
| --- | --- | --- | ---: | --- | --- |
| `/` | Maintley \| Home Maintenance Tracker & Property Memory App | The home maintenance tracker that remembers every repair, appliance, and document | 292 | ORG, WS, SW | Retain; retarget to home maintenance app |
| `/home-maintenance-tracker/` | Home Maintenance Tracker \| Maintley | Track every repair, reminder, appliance, and document for your home | 400 | SW, FAQ | Retain and differentiate |
| `/home-maintenance-app/` | Home Maintenance App \| Maintley | A home maintenance app for the work, records, and reminders that keep a home running | 346 | SW, FAQ | Redirect to `/` |
| `/property-records/` | Property Records App \| Maintley | Keep the important records for every home in one connected place | 344 | SW, FAQ | Retain; narrow to maintenance records |
| `/appliance-maintenance-tracker/` | Appliance Maintenance Tracker \| Maintley | Keep appliance records, service history, warranties, and reminders together | 387 | FAQ | Retain |
| `/home-maintenance-log/` | Home Maintenance Log \| Maintley | Turn completed work into a useful home maintenance history | 370 | FAQ | Retain; product intent |
| `/home-health/` | Home Health Dashboard \| Maintley | See what your home needs, what changed recently, and what records are missing | 233 | None | Redirect to `/features/` |
| `/maintenance-reminders/` | Recurring Maintenance Reminders \| Maintley | Keep routine home care from slipping through the cracks | 285 | FAQ | Retain |
| `/warranty-tracker/` | Warranty Tracker for Home Equipment \| Maintley | Track home warranties with the equipment, receipts, manuals, and service records they belong to | 364 | SW, FAQ | Retain; clarify appliance/equipment intent |
| `/home-document-organizer/` | Home Document Organizer \| Maintley | Keep warranties, manuals, invoices, photos, and service documents with the home | 254 | FAQ | Retain |
| `/property-maintenance-software/` | Property Maintenance Software \| Maintley | Track property maintenance without losing the history behind the work | 222 | None | Redirect to `/property-managers/` |
| `/homeowners/` | Maintley for Homeowners \| Home Maintenance Tracker | Remember every repair, track every appliance, and know what needs attention next | 220 | None | Retain and expand |
| `/property-managers/` | Maintley for Property Owners and Managers | Keep maintenance history, equipment details, and documents organized across properties | 184 | None | Retain, rename consistently, and expand |
| `/features/` | Maintley Features \| Home Maintenance Tracker | Home maintenance tracking, equipment records, documents, and reminders in one app | 204 | None | Retain and expand |
| `/pricing/` | Maintley Pricing \| Home Maintenance Tracker Plans | Start with a simple home maintenance record and grow when you need more | 268 | SW, Offer | Retain; align plan facts |
| `/resources/` | Home Maintenance Resources \| Maintley | Practical guides for building a better home maintenance record | 267 | None | Retain; organize as a hub |
| `/resources/home-maintenance-checklist/` | Home Maintenance Checklist by Season \| Maintley | Home maintenance checklist by season | 322 | ART, BC | Retain; task-list intent |
| `/resources/appliance-maintenance-log/` | How to Keep an Appliance Maintenance Log \| Maintley | How to keep an appliance maintenance log | 304 | ART, BC | Retain |
| `/resources/how-to-create-home-maintenance-log/` | How to Create a Home Maintenance Log \| Maintley | How to create a home maintenance log | 289 | ART, BC | Retain; how-to intent |
| `/resources/what-maintenance-records-should-homeowners-keep/` | What Maintenance Records Should Homeowners Keep? \| Maintley | What maintenance records should homeowners keep? | 280 | ART, BC | Retain |
| `/resources/appliance-warranty-organizer/` | How to Organize Appliance Warranties and Manuals \| Maintley | How to organize appliance warranties and manuals | 389 | ART, BC | Retain |
| `/resources/hvac-filter-replacement-schedule/` | HVAC Filter Replacement Schedule for Homeowners \| Maintley | HVAC filter replacement schedule for homeowners | 422 | ART, BC | Retain |
| `/resources/new-home-maintenance-tracker/` | New Home Maintenance Tracker Checklist \| Maintley | New home maintenance tracker checklist | 397 | ART, BC | Retain; new-home setup intent |
| `/resources/seasonal-home-maintenance-schedule/` | Seasonal Home Maintenance Schedule \| Maintley | Seasonal home maintenance schedule | 342 | ART, BC, FAQ | Retain only with calendar/cadence differentiation |
| `/resources/home-service-history/` | How to Keep a Home Service History \| Maintley | How to keep a home service history | 381 | ART, BC, FAQ | Retain |
| `/legal/` | Maintley Legal Documents | Legal documents and policies | 90 | None | Retain as branded utility hub |

## Keyword ownership map

| Final URL | Primary keyword or purpose | Supporting terms | Intent |
| --- | --- | --- | --- |
| `/` | home maintenance app | home maintenance tracker; home maintenance records; appliance records | Product discovery |
| `/home-maintenance-tracker/` | home maintenance tracker | maintenance tracking app; recurring home maintenance; repair history | Product discovery |
| `/property-records/` | home maintenance records app | property maintenance records; home service records; home documentation | Product discovery |
| `/appliance-maintenance-tracker/` | appliance maintenance tracker | equipment maintenance log; appliance service history; equipment records | Product discovery |
| `/home-maintenance-log/` | home maintenance log app | repair log app; home service log; property maintenance history | Product discovery |
| `/maintenance-reminders/` | home maintenance reminder app | recurring maintenance reminders; home maintenance schedule app | Product discovery |
| `/warranty-tracker/` | appliance warranty tracker | equipment warranty organizer; warranty reminder app; manuals and receipts | Product discovery |
| `/home-document-organizer/` | home document organizer | home records organizer; warranty and manual storage; maintenance documents | Product discovery |
| `/homeowners/` | homeowner maintenance app | home organization app; home records; recurring home care | Audience solution |
| `/property-managers/` | rental property maintenance tracker | landlord maintenance tracker; multi-property maintenance records; property portfolio maintenance | Audience solution |
| `/features/` | home maintenance software features | equipment records; maintenance history; home documents; reminders | Product evaluation |
| `/pricing/` | home maintenance app pricing | Maintley pricing; home maintenance software cost; property portfolio plan | Commercial evaluation |
| `/resources/` | home maintenance guides | home maintenance tips; homeowner guides; maintenance checklists | Informational hub |
| `/resources/home-maintenance-checklist/` | home maintenance checklist | seasonal maintenance checklist; homeowner maintenance checklist | Informational guidance |
| `/resources/appliance-maintenance-log/` | appliance maintenance log | appliance service log; equipment maintenance records | Informational guidance |
| `/resources/how-to-create-home-maintenance-log/` | how to create a home maintenance log | maintenance log template; what to record after repairs | Informational guidance |
| `/resources/what-maintenance-records-should-homeowners-keep/` | maintenance records homeowners should keep | home records checklist; repair records; service documents | Informational guidance |
| `/resources/appliance-warranty-organizer/` | how to organize appliance warranties | appliance manual organizer; warranty records; receipts and serial numbers | Informational guidance |
| `/resources/hvac-filter-replacement-schedule/` | HVAC filter replacement schedule | how often to change HVAC filter; filter maintenance reminder | Informational guidance |
| `/resources/new-home-maintenance-tracker/` | new homeowner maintenance checklist | new home maintenance tracker; first-year home records | Informational guidance |
| `/resources/seasonal-home-maintenance-schedule/` | seasonal home maintenance schedule | annual maintenance calendar; home maintenance cadence | Informational guidance |
| `/resources/home-service-history/` | home service history | repair history; contractor service records; property maintenance history | Informational guidance |
| `/security-and-privacy/` | home maintenance data security | secure home records; home data privacy; homeowner data control | Trust evaluation |
| `/about/` | about Maintley | Maintley story; why Maintley exists | Branded navigation |
| `/contact/` | contact Maintley | Maintley support; product questions; privacy requests | Branded navigation |
| `/legal/` | Maintley legal documents | Maintley terms; Maintley privacy policy | Branded utility |

Redirected URLs own no keyword after migration.

## Page briefs: product, audience, and evaluation

### `/`

* **Status:** Existing; retain and restructure.
* **Audience:** Homeowners and property owners evaluating the product.
* **Primary keyword:** home maintenance app.
* **Visitor question:** Is there one app that can remember maintenance, equipment,
  documents, and recurring care for my home?
* **Unique value:** Broadest explanation of Maintley as a lasting property
  maintenance memory; routes visitors to focused pages instead of duplicating
  them.
* **Title:** `Home Maintenance App for Records & Reminders | Maintley`
* **Description:** `Maintley keeps home maintenance, equipment details, service history, warranties, documents, and recurring reminders together in one lasting home record.`
* **H1:** `A home maintenance app that remembers the work behind your home`
* **Canonical:** `https://maintleyapp.com/`
* **Required sections:** Hero, product proof, short how-it-works, audience fit,
  core features, security and control, featured resources, compact pricing, FAQ,
  final CTA.
* **Primary CTA:** Start free.
* **Required inbound links:** Brand link and footer across every public page.
* **Required outbound links:** Features, Homeowners, Property Owners & Managers,
  Security & Privacy, Pricing, Resources, and three featured guides.
* **Schema:** Organization, WebSite, and SoftwareApplication with only current
  offers and claims.
* **Indexing:** Index, follow; self-canonical.

### `/home-maintenance-tracker/`

* **Status:** Existing; retain and differentiate from the homepage.
* **Audience:** Visitors explicitly comparing maintenance-tracking products.
* **Primary keyword:** home maintenance tracker.
* **Unique value:** Detailed tracking workflow from planned work to completed
  Maintenance Events and long-term history.
* **Title:** `Home Maintenance Tracker for Complete Records | Maintley`
* **Description:** `Track repairs, recurring tasks, appliances, warranties, documents, and completed work in one connected home maintenance history with Maintley.`
* **H1:** `Track every task, repair, appliance, and home record in one place`
* **Canonical:** `https://maintleyapp.com/home-maintenance-tracker/`
* **Required content:** Real tracking UI, planned-versus-completed explanation,
  equipment and document context, history outcome, visible FAQ.
* **Primary CTA:** Start tracking your home.
* **Links:** Inbound from homepage, Features, Homeowners, checklist, and new-home
  guide; outbound to Reminders, Maintenance Log, Features, Pricing, and Security.
* **Schema:** SoftwareApplication, BreadcrumbList, and FAQPage only when visible.
* **Indexing:** Index, follow; self-canonical.

### `/home-maintenance-app/`

* **Status:** Existing; permanently redirect to `/` after performance review.
* **Reason:** Same audience, keyword, product promise, and conversion action as
  the homepage.
* **Implementation:** 301/308 to `/`; remove from sitemap and internal links; no
  canonical or page metadata retained after redirect.

### `/property-records/`

* **Status:** Existing; retain and narrow.
* **Primary keyword:** home maintenance records app.
* **Visitor question:** How can I keep maintenance, equipment, costs, and
  supporting documents connected to the home?
* **Unique value:** Durable property-maintenance documentation, not public deeds,
  tax records, title searches, or certified records.
* **Title:** `Home Maintenance Records App | Maintley`
* **Description:** `Keep repairs, service history, equipment details, costs, warranties, photos, and documents connected in one useful home maintenance record.`
* **H1:** `Build a home maintenance record that preserves context over time`
* **Canonical:** `https://maintleyapp.com/property-records/`
* **Required content:** Record model, Maintenance Event attribution, documents,
  edit/correction behavior, ownership/control boundary, explicit non-certification.
* **Primary CTA:** Build your property record.
* **Links:** Inbound from Features, Homeowners, Property Owners & Managers, and
  records guide; outbound to Maintenance Log, Documents, Security, and Pricing.
* **Schema:** SoftwareApplication, BreadcrumbList, visible FAQPage.
* **Indexing:** Index, follow; self-canonical.

### `/appliance-maintenance-tracker/`

* **Status:** Existing; retain.
* **Primary keyword:** appliance maintenance tracker.
* **Unique value:** Equipment-specific records joining model/serial details,
  service history, warranties, documents, and recurring care.
* **Title:** `Appliance Maintenance Tracker & Service History | Maintley`
* **Description:** `Track appliance details, completed service, warranties, manuals, filter sizes, documents, and recurring maintenance in one equipment record.`
* **H1:** `Keep every appliance's details, service history, and next task together`
* **Canonical:** `https://maintleyapp.com/appliance-maintenance-tracker/`
* **Required content:** Equipment UI, common equipment examples, event attribution,
  warranty/manual connection, reminders, visible FAQ.
* **Primary CTA:** Add your equipment.
* **Links:** Inbound from Homeowners, Features, appliance-log and warranty guides;
  outbound to Warranty Tracker, Reminders, appliance-log guide, and Pricing.
* **Schema:** SoftwareApplication, BreadcrumbList, visible FAQPage.
* **Indexing:** Index, follow; self-canonical.

### `/home-maintenance-log/`

* **Status:** Existing; retain as a product page.
* **Primary keyword:** home maintenance log app.
* **Unique value:** Shows how Maintley records completed work; the related article
  teaches what to put in a log.
* **Title:** `Home Maintenance Log App for Repairs & Service | Maintley`
* **Description:** `Create a searchable home maintenance log with service dates, work performed, contributors, costs, photos, invoices, equipment, and follow-up tasks.`
* **H1:** `A home maintenance log that keeps the details behind completed work`
* **Canonical:** `https://maintleyapp.com/home-maintenance-log/`
* **Required content:** Maintenance Event UI, performed-by and recorded-by
  attribution, corrections, supporting records, history view, visible FAQ.
* **Primary CTA:** Start your maintenance log.
* **Links:** Inbound from Features, Tracker, records guide, and how-to article;
  outbound to Property Records, service-history guide, Pricing, and Security.
* **Schema:** SoftwareApplication, BreadcrumbList, visible FAQPage.
* **Indexing:** Index, follow; self-canonical.

### `/home-health/`

* **Status:** Existing; permanently redirect to `/features/` after performance
  review.
* **Reason:** Legacy terminology, insufficient unique intent, and risk of implying
  inspection, diagnosis, or a verified physical condition.
* **Implementation:** 301/308 to `/features/`; remove from sitemap and internal
  links; preserve any useful explanation as a Maintley Intelligence section on
  Features.

### `/maintenance-reminders/`

* **Status:** Existing; retain.
* **Primary keyword:** home maintenance reminder app.
* **Unique value:** Recurring tasks informed by the home and connected to completed
  maintenance history.
* **Title:** `Home Maintenance Reminder App | Maintley`
* **Description:** `Create recurring home maintenance reminders for filters, inspections, seasonal care, equipment service, and other routine work.`
* **H1:** `Set home maintenance reminders that stay connected to what was done`
* **Canonical:** `https://maintleyapp.com/maintenance-reminders/`
* **Required content:** Recurrence UI, completion/history flow, customization,
  reminder boundaries, common examples, visible FAQ.
* **Primary CTA:** Create your first reminder.
* **Links:** Inbound from Tracker, checklist, schedule, HVAC guide, and Features;
  outbound to Tracker, Log, seasonal schedule, and Pricing.
* **Schema:** SoftwareApplication, BreadcrumbList, visible FAQPage.
* **Indexing:** Index, follow; self-canonical.

### `/warranty-tracker/`

* **Status:** Existing; retain and clarify appliance/equipment scope.
* **Primary keyword:** appliance warranty tracker.
* **Unique value:** Warranties remain connected to equipment, receipts, manuals,
  install details, and service history.
* **Title:** `Appliance Warranty Tracker & Organizer | Maintley`
* **Description:** `Track appliance and equipment warranties with receipts, manuals, model details, install dates, documents, and related service history.`
* **H1:** `Keep appliance warranties with the records you need to use them`
* **Canonical:** `https://maintleyapp.com/warranty-tracker/`
* **Required content:** Warranty and equipment UI, fields to preserve, expiry
  behavior, documents, explicit distinction from home-warranty service contracts.
* **Primary CTA:** Organize your warranties.
* **Links:** Inbound from Appliance Tracker, Documents, and warranty guide;
  outbound to Appliance Tracker, Documents, warranty guide, and Pricing.
* **Schema:** SoftwareApplication, BreadcrumbList, visible FAQPage.
* **Indexing:** Index, follow; self-canonical.

### `/home-document-organizer/`

* **Status:** Existing; retain.
* **Primary keyword:** home document organizer.
* **Unique value:** Documents retain property, equipment, and Maintenance Event
  context instead of becoming an unstructured file vault.
* **Title:** `Home Document Organizer for Maintenance Records | Maintley`
* **Description:** `Organize warranties, manuals, invoices, receipts, photos, and service documents with the property, equipment, and maintenance work they support.`
* **H1:** `Organize home documents around the equipment and work they belong to`
* **Canonical:** `https://maintleyapp.com/home-document-organizer/`
* **Required content:** Document UI, supported associations and limits, search or
  retrieval behavior, privacy/control, visible FAQ.
* **Primary CTA:** Organize your home records.
* **Links:** Inbound from Features, Property Records, Homeowners, and warranty
  guide; outbound to Property Records, Warranty Tracker, Security, and Pricing.
* **Schema:** SoftwareApplication, BreadcrumbList, visible FAQPage.
* **Indexing:** Index, follow; self-canonical.

### `/property-maintenance-software/`

* **Status:** Existing; permanently redirect to `/property-managers/` after
  performance review.
* **Reason:** It overlaps the audience solution and the generic term implies
  tenant, leasing, accounting, dispatch, or work-order capabilities Maintley
  should not promise.
* **Implementation:** 301/308; remove from sitemap and internal links; carry its
  maintenance-history positioning into the destination.

### `/homeowners/`

* **Status:** Existing; retain and expand.
* **Primary keyword:** homeowner maintenance app.
* **Unique value:** Audience page answering whether Maintley fits a homeowner's
  needs, not another generic feature list.
* **Title:** `Homeowner Maintenance App for Records & Reminders | Maintley`
* **Description:** `Maintley helps homeowners track recurring maintenance, completed repairs, appliance details, warranties, manuals, and important home documents.`
* **H1:** `Keep your home's maintenance, equipment, and documents easy to find`
* **Canonical:** `https://maintleyapp.com/homeowners/`
* **Required content:** Homeowner problems, one-home workflow, real UI, plan fit,
  data control, common first setup, boundaries around professional contributions.
* **Primary CTA:** Start your home record.
* **Links:** Inbound from homepage and Solutions navigation; outbound to Tracker,
  Appliance Tracker, Documents, Security, Resources, and Pricing.
* **Schema:** WebPage with SoftwareApplication subject, BreadcrumbList.
* **Indexing:** Index, follow; self-canonical.

### `/property-managers/`

* **Status:** Existing; retain, expand, and use the visible label **Property
  Owners & Managers**.
* **Primary keyword:** rental property maintenance tracker.
* **Unique value:** Maintenance memory across properties without claiming to be a
  full leasing, accounting, CRM, dispatch, or tenant-management suite.
* **Title:** `Rental Property Maintenance Tracker | Maintley`
* **Description:** `Keep maintenance history, equipment, documents, costs, and recurring work organized across rental properties without losing property-level context.`
* **H1:** `Preserve maintenance history across every property you manage`
* **Canonical:** `https://maintleyapp.com/property-managers/`
* **Required content:** Portfolio use case, property-level records, roles and
  permissions limited to current behavior, plan fit, maintenance-request boundary,
  unsupported operations clearly excluded.
* **Primary CTA:** Compare property plans.
* **Links:** Inbound from homepage, Solutions navigation, Pricing, and redirected
  property-software URL; outbound to Property Records, Maintenance Log, Security,
  Pricing, and Contact.
* **Schema:** WebPage with SoftwareApplication subject, BreadcrumbList.
* **Indexing:** Index, follow; self-canonical.

### `/features/`

* **Status:** Existing; retain and expand into the detailed product tour.
* **Primary keyword:** home maintenance software features.
* **Unique value:** Evidence-led explanation of implemented capabilities and how
  they connect from property to Maintenance Event to history to guidance.
* **Title:** `Home Maintenance Software Features | Maintley`
* **Description:** `Explore Maintley features for maintenance events, equipment records, recurring tasks, service history, documents, warranties, reports, and explainable guidance.`
* **H1:** `Explore the tools that build a lasting home maintenance record`
* **Canonical:** `https://maintleyapp.com/features/`
* **Required content:** Real screenshots, how-it-works flow, linked feature groups,
  Maintley Intelligence with qualified claims, mobile usage, plan links.
* **Primary CTA:** Start free; secondary Compare plans.
* **Links:** Inbound from homepage, primary navigation, and focused product pages;
  outbound to every retained focused feature page, audiences, Security, and
  Pricing.
* **Schema:** SoftwareApplication or WebPage plus BreadcrumbList.
* **Indexing:** Index, follow; self-canonical.

### `/pricing/`

* **Status:** Existing; retain and align with authoritative plan data.
* **Primary keyword:** home maintenance app pricing.
* **Unique value:** Current costs, limits, audiences, and feature comparisons.
* **Title:** `Home Maintenance App Pricing & Plans | Maintley`
* **Description:** `Compare Maintley plans for homeowners, property owners, and portfolios, including current prices, property limits, equipment limits, storage, and features.`
* **H1:** `Choose the right plan for your home or property portfolio`
* **Canonical:** `https://maintleyapp.com/pricing/`
* **Required content:** Homeowner and Business audience switch, identical facts to
  the application source, full comparison, billing FAQ, cancellation/support,
  Organization licensing excluded until launch.
* **Primary CTA:** Start free or choose a current plan.
* **Links:** Inbound from all product/audience pages and navigation; outbound to
  Homeowners, Property Owners & Managers, Security, Legal, and Contact.
* **Schema:** SoftwareApplication with current Offer data, BreadcrumbList, FAQPage
  only for visible stable pricing questions.
* **Indexing:** Index, follow; self-canonical.

## Page briefs: resources

### `/resources/`

* **Status:** Existing; retain as the informational hub.
* **Primary keyword:** home maintenance guides.
* **Title:** `Home Maintenance Guides, Checklists & Schedules | Maintley`
* **Description:** `Explore practical home maintenance guides for seasonal care, appliance records, service history, warranties, HVAC filters, and new-home setup.`
* **H1:** `Practical home maintenance guides you can put to work`
* **Canonical:** `https://maintleyapp.com/resources/`
* **Unique content:** Organize guides by need rather than a flat list; add concise
  category introductions and featured starting points.
* **Primary CTA:** Choose a guide; product CTA remains secondary.
* **Links:** Inbound from homepage, navigation, footer, and every article breadcrumb;
  outbound to every article and contextually to Tracker/Homeowners.
* **Schema:** CollectionPage, BreadcrumbList, ItemList when it matches the visible
  article collection.
* **Indexing:** Index, follow; self-canonical.

### `/resources/home-maintenance-checklist/`

* **Status:** Existing; retain as the actionable task list.
* **Primary keyword:** home maintenance checklist.
* **Title:** `Seasonal Home Maintenance Checklist for Homeowners | Maintley`
* **Description:** `Use this seasonal home maintenance checklist to plan HVAC, gutter, safety, exterior, plumbing, and appliance care throughout the year.`
* **H1:** `Seasonal home maintenance checklist`
* **Unique content:** Comprehensive checkable tasks grouped by season, safety
  qualifiers, frequency notes, and a print-friendly or accessible checklist.
* **CTA:** Save relevant tasks as reminders.
* **Links:** Inbound from Resources, homepage featured guides, Homeowners, and
  schedule article; outbound to Seasonal Schedule, HVAC Schedule, Reminders, and
  Resources.
* **Schema:** Article, BreadcrumbList; FAQPage only if visible FAQ is added.

### `/resources/appliance-maintenance-log/`

* **Status:** Existing; retain.
* **Primary keyword:** appliance maintenance log.
* **Title:** `How to Keep an Appliance Maintenance Log | Maintley`
* **Description:** `Learn what to record in an appliance maintenance log, including equipment details, service dates, work performed, costs, warranties, manuals, and follow-up care.`
* **H1:** `How to keep an appliance maintenance log`
* **Unique content:** Field-by-field example and reusable log structure; informational
  answer before product mention.
* **CTA:** Create an equipment record.
* **Links:** Inbound from Resources, Appliance Tracker, and warranty guide; outbound
  to Appliance Tracker, Warranty guide, Home Service History, and Resources.
* **Schema:** Article, BreadcrumbList; FAQPage only if visible.

### `/resources/how-to-create-home-maintenance-log/`

* **Status:** Existing; retain as the process guide.
* **Primary keyword:** how to create a home maintenance log.
* **Title:** `How to Create a Home Maintenance Log | Maintley`
* **Description:** `Learn how to create a home maintenance log with service dates, work details, contributors, costs, equipment, photos, invoices, and follow-up tasks.`
* **H1:** `How to create a home maintenance log`
* **Unique content:** Step-by-step method plus a clear example; the product landing
  page remains focused on Maintley as the tool.
* **CTA:** Build your first log in Maintley.
* **Links:** Inbound from Resources and Home Maintenance Log; outbound to product
  Log, Home Service History, Records guide, and Resources.
* **Schema:** Article, BreadcrumbList; FAQPage only if visible.

### `/resources/what-maintenance-records-should-homeowners-keep/`

* **Status:** Existing; retain.
* **Primary keyword:** maintenance records homeowners should keep.
* **Title:** `What Maintenance Records Should Homeowners Keep? | Maintley`
* **Description:** `Learn which repair, service, appliance, warranty, receipt, photo, contractor, cost, and recurring-maintenance records are useful to keep for a home.`
* **H1:** `What maintenance records should homeowners keep?`
* **Unique content:** Prioritized record categories, retention considerations, and
  distinction between property-relevant and personal/sensitive information.
* **CTA:** Organize your home maintenance records.
* **Links:** Inbound from Resources, Property Records, and Homeowners; outbound to
  Property Records, Home Service History, Document Organizer, and Resources.
* **Schema:** Article, BreadcrumbList; FAQPage only if visible.

### `/resources/appliance-warranty-organizer/`

* **Status:** Existing; retain.
* **Primary keyword:** how to organize appliance warranties.
* **Title:** `How to Organize Appliance Warranties & Manuals | Maintley`
* **Description:** `Organize appliance warranties, manuals, receipts, model and serial numbers, install dates, coverage details, and service history before a problem occurs.`
* **H1:** `How to organize appliance warranties and manuals`
* **Unique content:** Practical organization method, required fields, retrieval
  checklist, and distinction from buying home-warranty coverage.
* **CTA:** Create an appliance warranty record.
* **Links:** Inbound from Resources, Warranty Tracker, Appliance Tracker; outbound
  to Warranty Tracker, Appliance Log, Document Organizer, and Resources.
* **Schema:** Article, BreadcrumbList; FAQPage only if visible.

### `/resources/hvac-filter-replacement-schedule/`

* **Status:** Existing; retain.
* **Primary keyword:** HVAC filter replacement schedule.
* **Title:** `HVAC Filter Replacement Schedule for Homeowners | Maintley`
* **Description:** `Build an HVAC filter replacement schedule using filter type, household conditions, equipment guidance, inspection results, and actual maintenance history.`
* **H1:** `HVAC filter replacement schedule for homeowners`
* **Unique content:** Starting intervals with explicit manufacturer/condition
  qualifiers, adjustment signals, filter details to record, and scheduling example.
* **CTA:** Set a recurring filter reminder.
* **Links:** Inbound from Resources, Checklist, Schedule, Reminders, and Appliance
  Tracker; outbound to Reminders, Appliance Tracker, Seasonal Schedule, Resources.
* **Schema:** Article, BreadcrumbList; FAQPage only if visible.

### `/resources/new-home-maintenance-tracker/`

* **Status:** Existing; retain and focus on initial setup.
* **Primary keyword:** new homeowner maintenance checklist.
* **Title:** `New Homeowner Maintenance Checklist & Tracker | Maintley`
* **Description:** `Set up a new home's maintenance record with closing documents, equipment details, warranties, baseline photos, service history, and recurring tasks.`
* **H1:** `Set up a maintenance tracker for your new home`
* **Unique content:** First 30-day record setup sequence, not another year-round
  seasonal checklist.
* **CTA:** Start your new home record.
* **Links:** Inbound from Resources, Homeowners, and Checklist; outbound to Tracker,
  Records guide, Appliance Tracker, Checklist, and Resources.
* **Schema:** Article, BreadcrumbList; FAQPage only if visible.

### `/resources/seasonal-home-maintenance-schedule/`

* **Status:** Existing; retain only with stronger differentiation from the checklist.
* **Primary keyword:** seasonal home maintenance schedule.
* **Title:** `Seasonal Home Maintenance Schedule & Calendar | Maintley`
* **Description:** `Build a seasonal home maintenance schedule that spreads recurring work across the year and adapts to your climate, equipment, and completed service history.`
* **H1:** `Build a seasonal home maintenance schedule that fits your home`
* **Unique content:** Calendar/cadence framework, monthly and seasonal planning,
  climate and equipment customization, review points, and recurrence setup. It
  must not repeat the checklist's task list.
* **CTA:** Turn your schedule into recurring reminders.
* **Links:** Inbound from Resources, Checklist, Reminders; outbound to Checklist,
  HVAC Schedule, Reminders, Home Service History, and Resources.
* **Schema:** Article, BreadcrumbList, visible stable FAQPage.

### `/resources/home-service-history/`

* **Status:** Existing; retain.
* **Primary keyword:** home service history.
* **Title:** `How to Keep a Home Service History | Maintley`
* **Description:** `Learn how to record home service dates, work performed, equipment, contractors, recorded-by attribution, costs, documents, corrections, and follow-up work.`
* **H1:** `How to keep a home service history`
* **Unique content:** Emphasize performed by versus recorded by, source attribution,
  corrections, supporting records, and the difference between submitted records
  and verified work.
* **CTA:** Build your home's service history.
* **Links:** Inbound from Resources, Maintenance Log, Appliance Log, and Schedule;
  outbound to Maintenance Log, Records guide, Appliance Log, and Resources.
* **Schema:** Article, BreadcrumbList, visible stable FAQPage.

## Page briefs: trust, company, contact, and legal

### `/security-and-privacy/`

* **Status:** Proposed; create before the homepage trust section links to it.
* **Primary keyword:** home maintenance data security.
* **Title:** `Home Maintenance Data Security & Privacy | Maintley`
* **Description:** `Learn how Maintley handles account access, permissions, homeowner control, storage, exports, deletion, professional contributions, and privacy requests.`
* **H1:** `How Maintley protects your home maintenance records`
* **Unique value:** Customer-friendly explanation of substantiated product controls;
  not a legal-policy replacement and not a certification page.
* **Required sections:** Data control, authentication/access, permissions and
  revocation, professional contribution boundaries, storage/security claims that
  can be evidenced, export/deletion, incident/support contact, legal links.
* **Primary CTA:** Start free; secondary Read the Privacy Policy.
* **Links:** Inbound from homepage, footer, Pricing, audience pages, and pages where
  document trust matters; outbound to Legal, Contact, Features, and account action.
* **Schema:** WebPage, BreadcrumbList; FAQPage only if visible and stable.
* **Indexing:** Index, follow; self-canonical.

### `/about/`

* **Status:** Proposed.
* **Primary purpose:** about Maintley.
* **Title:** `About Maintley | Built for Long-Term Home Records`
* **Description:** `Learn why Maintley was created to preserve the maintenance events, equipment details, documents, and service history that help people understand a home.`
* **H1:** `Maintley gives every home a maintenance memory`
* **Unique value:** Full founder/product-origin narrative removed from the homepage,
  connected to Maintley's property-first philosophy.
* **Required sections:** Origin, problem, product philosophy, homeowner-first model,
  responsibility boundaries, current company/contact information.
* **Primary CTA:** See how Maintley works.
* **Links:** Inbound from footer and homepage origin summary; outbound to Features,
  Security, Contact, and Resources.
* **Schema:** AboutPage, Organization where visible facts support it, BreadcrumbList.
* **Indexing:** Index, follow; self-canonical.

### `/contact/`

* **Status:** Proposed; do not launch until server-authoritative submission works.
* **Primary purpose:** contact Maintley.
* **Title:** `Contact Maintley | Product, Support & Privacy Questions`
* **Description:** `Contact Maintley about product questions, account support, property-owner needs, privacy requests, or future service-business early access.`
* **H1:** `How can we help?`
* **Unique value:** Reliable routing by inquiry type with clear response expectations.
* **Required sections:** Inquiry categories, accessible form, privacy acknowledgement
  where required, success/error states, alternate support paths, no public inbox data.
* **Primary CTA:** Send message.
* **Links:** Inbound from footer, About, Security, Pricing, and solution pages;
  outbound to Help, Legal, Security, Login, or Register as appropriate.
* **Schema:** ContactPage, BreadcrumbList; Organization contactPoint only when the
  published channel and response behavior are stable.
* **Indexing:** Index, follow only when functional; otherwise do not publish a
  placeholder.

### `/legal/`

* **Status:** Existing; retain as a branded document hub.
* **Primary purpose:** Maintley legal documents.
* **Title:** `Maintley Legal Documents & Policies`
* **Description:** `Review Maintley's Terms of Service, Privacy Policy, Maintenance Disclaimer, Subscription Terms, Cookie Policy, and End User License Agreement.`
* **H1:** `Legal documents and policies`
* **Unique value:** Stable index of current governing documents with version or
  effective-date information where available.
* **Primary CTA:** Choose a document; no forced conversion CTA.
* **Links:** Inbound from footer, Pricing, Security, Contact, and account consent
  surfaces; outbound to every current legal document, Security, and Contact.
* **Schema:** CollectionPage or WebPage plus BreadcrumbList.
* **Indexing:** Index, follow; self-canonical. Individual application/hash legal
  views should not create duplicate indexed versions.

## Internal-link implementation rules

1. Navigation links to durable hubs: Features, enabled Solutions, Pricing,
   Resources, Login, and Start Free.
2. The homepage links to the two audience pages, trust page, pricing, features,
   and three featured articles.
3. Features links to every retained focused product page.
4. Product pages link to one audience page, one plan/trust destination, and the
   most relevant informational guide.
5. The Resources hub links to every article; every article links back through a
   visible breadcrumb.
6. Every article links to two or three related guides and one relevant product
   page, without turning the answer into a product pitch.
7. No internal link points to a redirected URL after migration.
8. The footer provides stable Product, Solutions, Resources, Company, Trust, and
   Legal groups without listing every article.

## Structured-data implementation rules

* Add BreadcrumbList to retained top-level product, audience, trust, company,
  pricing, and legal pages where a visible breadcrumb is present.
* Keep FAQPage only when the same questions and answers are visible and stable.
* Add SoftwareApplication only where the page materially describes Maintley and
  all displayed features/offers are current.
* Add CollectionPage and optional visible-matching ItemList to Resources.
* Keep Article and BreadcrumbList on all resource guides.
* Do not add Review, AggregateRating, certification, LocalBusiness, or service-
  provider schema without real visible evidence.
* Redirect pages return no indexable HTML or structured data.

## Implementation order after this audit

1. Obtain the Search Console/backlink snapshot for the three proposed redirects.
2. Treat this report and `PUBLIC_SEO_ARCHITECTURE.md` as the metadata brief during
   implementation.
3. Implement the shared public navigation and mobile hardening.
4. Align Pricing with the authoritative plan data.
5. Restructure the homepage and retained core pages using their briefs.
6. Create Security & Privacy and About; create Contact only with working submission.
7. Differentiate the two seasonal resource pages and expand thin audience/product
   pages before changing their metadata.
8. Implement redirects, sitemap changes, structured data, and internal links in
   the same release.
9. Run `npm run validate:seo`, crawl internal links, render-check metadata, and
   inspect structured data.
10. Resubmit the sitemap and monitor query-to-landing-page alignment.

## Acceptance criteria

This audit is complete when used as the implementation gate because:

* all 26 current public URLs have a retain or redirect decision
* all 26 final indexed destinations, including three proposed pages and excluding
  three redirects, have one primary purpose
* every final page has a title, description, H1, canonical, link path, schema
  decision, and indexing instruction
* the five priority cannibalization groups have explicit outcomes
* informational and product intent are separated
* Service Business keywords remain research-only
* redirect release is explicitly gated on performance and backlink evidence

