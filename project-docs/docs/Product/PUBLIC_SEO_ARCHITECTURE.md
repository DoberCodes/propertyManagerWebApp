# Public SEO Architecture

Last reviewed: 2026-07-21

Status: Approved implementation planning source of truth; search-volume and
landing-page performance validation remain measurement gates

## Purpose

This document defines how Maintley's public pages divide search intent, keyword
ownership, metadata, internal links, and structured data.

It answers:

> Why does this public page exist, which search need does it satisfy, and how
> does it connect visitors to the next useful page?

This document works with `PUBLIC_SEO.md` and the completed audit:

* `PUBLIC_SEO.md` defines current public SEO implementation and operations.
* `PUBLIC_SEO_ARCHITECTURE.md` defines page purpose, keyword ownership, search
  intent, and future information architecture.
* `../../reports/2026-07-21-public-seo-keyword-and-metadata-audit.md` records the
  current inventory, consolidation decisions, and implementation-ready page
  briefs.

Do not change public page targeting from this map without updating the audit or
recording new search-performance evidence.

## Core principles

1. One primary search purpose per indexed page.
2. Supporting keywords reinforce the primary purpose; they do not make every
   page target every high-value phrase.
3. Search intent determines page format.
4. Informational pages answer the question before promoting Maintley.
5. Product pages demonstrate the product and lead to an appropriate evaluation
   or account action.
6. Metadata, H1, body content, internal links, and structured data must describe
   the same page purpose.
7. A new page requires a keyword and intent brief before implementation.
8. Business-licensing research does not authorize marketing an unavailable
   product.

## SEO architecture

```text
Public SEO
  -> Keyword Map
  -> Page Intent
  -> Page Brief
  -> Internal Linking
  -> Structured Data
  -> Metadata Standards
  -> Measurement and Review
```

## Search-intent classes

### Product discovery

The visitor is looking for an application or system. The page should quickly
show what Maintley does, who it is for, product UI, differentiation, and a clear
trial or evaluation action.

Examples:

* home maintenance app
* home maintenance software
* property maintenance software

### Audience solution

The visitor recognizes their own role or property-management need. The page
should explain the relevant outcome, use cases, boundaries, plan fit, and next
step.

Examples:

* homeowner maintenance app
* rental property maintenance software

### Informational guidance

The visitor wants an answer, checklist, schedule, or process. The page must
satisfy that need on-page. Maintley should be introduced naturally as a way to
preserve, schedule, or use the information.

Examples:

* home maintenance checklist
* HVAC filter replacement schedule
* what maintenance records should homeowners keep

### Commercial evaluation

The visitor is comparing cost, limits, security, or trust. The page should be
specific, current, and consistent with implemented behavior.

Examples:

* home maintenance software pricing
* secure home records

### Branded navigation

The visitor already knows Maintley and wants company, contact, legal, support,
or account access information. These pages should be direct and should not
compete for broad non-branded product keywords.

## Approved primary page map

Keyword language below defines implementation ownership. Validate demand,
difficulty, and actual query phrasing during measurement without allowing pages
to drift into competing purposes.

| Page | Primary purpose / keyword | Supporting themes | Intent | Page role |
| --- | --- | --- | --- | --- |
| `/` | home maintenance app | home maintenance tracker; property records; home maintenance software | Product discovery | Broad product entry and brand conversion |
| `/features/` | home maintenance software features | property maintenance records; property documentation; maintenance history | Product evaluation | Demonstrate product capabilities and UI |
| `/homeowners/` | homeowner maintenance app | home organization; appliance records; recurring home maintenance | Audience solution | Explain single-home value and plan fit |
| `/property-managers/` | rental property maintenance tracker | landlord maintenance tracker; multi-property maintenance records; portfolio maintenance | Audience solution | Explain Property and Portfolio maintenance-record use cases without implying a full property-management suite |
| `/pricing/` | home maintenance app pricing | Maintley pricing; home maintenance software cost; Portfolio plan | Commercial evaluation | Compare current plans and limits |
| `/resources/` | home maintenance guides | home maintenance tips; seasonal maintenance; homeowner guides | Informational hub | Organize informational content by need |
| `/security-and-privacy/` | home maintenance data security | secure home records; home data privacy; homeowner data control | Commercial evaluation | Explain trust, ownership, security, and control |
| `/about/` | about Maintley | Maintley story; Maintley company | Branded navigation | Company origin and product motivation |
| `/contact/` | contact Maintley | Maintley support; Maintley questions; service business early access | Branded navigation | Route public inquiries reliably |

## Existing product and SEO landing-page decisions

| Page | Approved primary purpose | Decision |
| --- | --- | --- |
| `/home-maintenance-tracker/` | home maintenance tracker | Retain as the detailed tracking-workflow product page |
| `/home-maintenance-app/` | Duplicate of homepage product discovery | Permanently redirect to `/` after Search Console and backlink review |
| `/property-records/` | home maintenance records app | Retain with explicit maintenance-record scope |
| `/appliance-maintenance-tracker/` | appliance maintenance tracker | Retain with equipment-specific intent |
| `/home-maintenance-log/` | home maintenance log app | Retain as a product page; the related article owns how-to intent |
| `/home-health/` | Legacy product terminology | Permanently redirect to `/features/` after performance review |
| `/maintenance-reminders/` | home maintenance reminder app | Retain with reminder-workflow intent |
| `/warranty-tracker/` | appliance warranty tracker | Retain with equipment/warranty scope |
| `/home-document-organizer/` | home document organizer | Retain with contextual-document scope |
| `/property-maintenance-software/` | Duplicates the property audience solution and implies a broader suite | Permanently redirect to `/property-managers/` after performance review |

### Cannibalization audit priorities

The audit resolved these groups as follows:

1. `/` owns **home maintenance app**; `/home-maintenance-app/` redirects to it;
   `/home-maintenance-tracker/` owns **home maintenance tracker**.
2. `/features/` owns product evaluation; `/property-maintenance-software/`
   redirects to the narrower property-owner/manager solution.
3. `/homeowners/` answers audience-fit intent; focused product pages own their
   individual use cases.
4. `/property-managers/` owns rental-property maintenance tracking without
   claiming leasing, accounting, CRM, or field-service operations.
5. `/home-maintenance-log/` owns app/product intent; the resource article owns
   the instructional process.

For each group, choose one of:

* distinct search intent and differentiated page brief
* consolidation into the stronger page
* permanent redirect
* canonicalization only when duplicate or near-duplicate content genuinely
  requires it
* noindex when a useful user page should not compete in search

Do not use canonical tags as a substitute for making an information-architecture
decision.

## Informational resource map

Resource articles own informational queries. They should not be rewritten into
thin product landing pages.

| Page | Primary informational intent | Natural Maintley connection |
| --- | --- | --- |
| `/resources/home-maintenance-checklist/` | home maintenance checklist | Save tasks and recurring maintenance |
| `/resources/seasonal-home-maintenance-schedule/` | seasonal home maintenance schedule | Turn seasonal guidance into reminders |
| `/resources/home-service-history/` | home service history | Preserve Maintenance Events and attribution |
| `/resources/appliance-maintenance-log/` | appliance maintenance log | Keep equipment-specific history |
| `/resources/how-to-create-home-maintenance-log/` | how to create a home maintenance log | Maintain a searchable long-term record |
| `/resources/what-maintenance-records-should-homeowners-keep/` | maintenance records homeowners should keep | Organize relevant property records |
| `/resources/appliance-warranty-organizer/` | appliance warranty organizer | Connect warranties and equipment records |
| `/resources/hvac-filter-replacement-schedule/` | HVAC filter replacement schedule | Record filter details and recurring changes |
| `/resources/new-home-maintenance-tracker/` | new home maintenance tracker checklist | Establish the first property record |

### Informational content rule

An article should:

1. answer the query directly
2. give practical, safe, non-certifying guidance
3. link to closely related articles
4. introduce Maintley only where it helps the reader retain or act on the answer
5. link to the most relevant product or audience page, not automatically to the
   homepage

## Future Service Business keyword cluster

Research and track this cluster without assigning public landing pages yet:

* contractor customer portal
* home maintenance software for contractors
* maintenance membership software
* preventive or preventative maintenance software
* home service customer records
* homeowner maintenance portal
* contractor documentation software
* home service maintenance history
* customer property records for contractors

### Research questions

* Is the searcher looking for CRM/field-service software Maintley intentionally
  does not provide?
* Does the query imply scheduling, dispatch, estimates, memberships, or billing?
* Can Maintley's limited Search property -> Record visit -> Update Property
  Memory workflow satisfy the intent honestly?
* Is the searcher a contractor, maintenance-plan operator, property manager, or
  homeowner?
* Which terms indicate a documentation portal rather than a complete service
  operations platform?

No keyword in this cluster may be assigned to the homepage or an indexed Service
Business page until Organization licensing, contributor permissions, agreements,
and launch gates are approved. A hidden configuration entry is not a search page
and must not appear in the sitemap or structured data.

## Page brief requirements

Before creating or materially restructuring a public page, record:

```text
Page:
Status: existing / proposed / redirect / retire
Audience:
Primary keyword or branded purpose:
Supporting keywords:
Search intent:
Visitor question:
Unique value provided by this page:
Title:
Meta description:
H1:
Canonical URL:
Required sections:
Primary CTA:
Required inbound links:
Required outbound links:
Structured data:
Indexing directive:
Measurement query group:
```

The page must provide unique value beyond rearranging copy from another page.

## Metadata standards

### Titles

* Unique to the page.
* Lead with the page's intent when natural.
* Include Maintley without making every title identical.
* Avoid lists of keyword variants.
* Match the visible page purpose.

### Meta descriptions

* Describe the specific benefit and content of the page.
* Use natural language rather than keyword repetition.
* Avoid unsupported superlatives and certification claims.
* Include a relevant next step when appropriate.

### H1

* One clear primary heading per page.
* Written for the visitor, not as an exact-match keyword container.
* Semantically aligned with title, description, and page intent.

### Canonicals and indexing

* Use self-referencing canonicals for distinct indexed pages.
* Use permanent redirects when consolidating retired URLs.
* Keep sitemap and internal links pointed at final canonical destinations.
* Do not index hidden, placeholder, early-access, or duplicate pages.

## Internal-linking architecture

### Homepage

Links to:

* Features
* Homeowners
* Property Owners & Managers
* Security & Privacy
* Pricing
* three featured resources

### Product and audience pages

Link to:

* the most relevant plan comparison
* relevant feature explanations
* related informational guides
* Security & Privacy where trust is material

### Resources hub

Links to all resource categories and articles. It should organize by visitor need
as the library grows rather than remaining a flat chronological list.

### Articles

Each article should link to:

* two or three genuinely related articles
* the Resources hub
* one relevant product or solution page
* one contextual account action only when it naturally follows the guidance

### Footer

The footer provides stable discovery of important product, solution, resource,
company, trust, and legal destinations. It should not contain every article or
every legal subdocument when a hub page can organize them.

## Structured-data map

| Page type | Structured data |
| --- | --- |
| Homepage | Organization, WebSite, SoftwareApplication when offers and claims are current |
| Features/product landing | SoftwareApplication or WebPage plus BreadcrumbList as appropriate |
| Audience solution | WebPage plus BreadcrumbList |
| Pricing | SoftwareApplication with current offers where supported; BreadcrumbList |
| Resources hub | CollectionPage, ItemList where useful, BreadcrumbList |
| Resource article | Article, BreadcrumbList, FAQPage only when matching visible stable FAQ content |
| About | AboutPage, Organization where appropriate |
| Contact | ContactPage |
| Security & Privacy | WebPage; do not use certification-oriented schema without qualification |

Structured data must describe visible content and current behavior. Do not add
FAQPage schema without visible questions and answers.

## Keyword and metadata audit workflow

### Phase A: Inventory

Export every public URL from the sitemap, navigation, footer, and build output.
Record status code, canonical, title, description, H1, schema, inbound links, and
indexing directive.

### Phase B: Evidence

Use Google Search Console, Bing Webmaster Tools, analytics, and responsible
keyword research to record impressions, clicks, current queries, landing pages,
intent, and potential overlap. Do not make final assignments from intuition
alone.

### Phase C: Assign

Give every indexed page one primary purpose. Assign supporting terms and note
pages that require consolidation, redirection, or stronger differentiation.

### Phase D: Brief

Approve the page brief, internal-link changes, and schema before implementation.

### Phase E: Validate

After implementation, run SEO validation, crawl internal links, inspect rendered
metadata, confirm structured data, resubmit the sitemap when appropriate, and
monitor query/landing-page behavior.

## Measurement and drift prevention

Track performance by query cluster and landing page rather than site-wide rank
alone. Review:

* whether the intended page receives the intended query
* accidental competition between Maintley pages
* click-through rate by title and intent
* movement from informational content to relevant product evaluation
* conversion by audience page
* broken links, redirect chains, and orphaned pages

Update this document whenever:

* a public page is added, retired, redirected, or substantially repurposed
* navigation changes
* a keyword cluster is reassigned
* structured-data strategy changes
* Organization licensing becomes eligible for public marketing

## Immediate implementation gates

1. Review Search Console and backlink evidence before releasing the three
   approved redirects.
2. Use the completed audit briefs for metadata, headings, content boundaries,
   internal links, and structured data.
3. Keep the Service Business cluster research-only until its launch gates pass.
4. Run SEO validation and a broken-link crawl with each implementation slice.
5. Measure query-to-landing-page alignment after deployment and update this map
   only when evidence supports reassignment.
