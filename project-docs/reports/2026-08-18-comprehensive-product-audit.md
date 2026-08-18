# Maintley Comprehensive Product Audit

Date: 2026-08-18

Status: Point-in-time product, UX, market, and technical audit

## Executive summary

Maintley has a strong product idea and a credible foundation, but the current
production experience is not yet dependable enough to create a consistent
"wow" moment for a new homeowner.

The strongest part of the product is the underlying thesis: a home should have
an operational memory that connects equipment, documents, maintenance work,
costs, and explainable guidance. That thesis is clearer and more defensible
than positioning Maintley as another task list. Quick Scan is the best current
expression of it. It turns known property facts into understandable,
actionable gaps without silently changing user data.

The largest problem is execution at the first-value boundary. In a new
production account, creating a home with two bedrooms and 1.5 bathrooms
promised to create four Spaces. The home saved, but all Space creation failed
with Firestore `permission-denied`. The UI then displayed no active Spaces.
This is not a cosmetic issue: it breaks a headline v2.14 behavior during the
first important workflow and weakens every future relationship built on
Spaces. The current emulator coverage does not exercise the failing sequence:
read a deterministic generated Space ID that does not exist, then create it.

Entitlement presentation is also inconsistent. A new account received
temporary Homeowner+ access through September 17, 2026 and a 10 GB storage
quota, while the global Plan & Usage card continued to say `Plan: Free`, `1 of
1`, and `0 home slots available`. The same split appears in the demo account,
where a valid Portfolio grant is presented as a Free plan over its property
limit. The product has a thoughtful non-destructive grant model, but the UI
mixes billing plan and effective access. That makes legitimate access look
broken and undermines trust at the point where Maintley asks users to pay.

The public website is substantially better than a typical early-stage product.
The homepage explains Record, Remember, Understand, and Act; it includes real
product surfaces, clear pricing, security language, resources, and a useful
Property Memory story. SEO validation passes across 27 public pages. The
weakness is proof: most solution pages are shallow, the Property Manager story
is not differentiated enough, and the site lacks customer evidence, outcome
stories, and a concrete demonstration of the first ten minutes.

The authenticated application is capable but dense. It can manage a large demo
portfolio, reports, team access, tasks, equipment, documents, and
recommendations. However, several pages briefly show persuasive empty states
before their queries finish. A user with 57 tasks, 51 equipment records, and 9
properties can momentarily see "No tasks yet", "No properties yet", or a blank
equipment view. Large task and equipment lists are expanded into very long
pages, and many mobile controls are smaller than a dependable touch target.

Technically, Maintley is in a transitional but recoverable state. The
property-first knowledge model is the correct direction. The strongest
architectural risk is not Firestore itself; it is the amount of cross-entity
business behavior performed directly from the client while authorization,
entitlements, compatibility behavior, and derived state are spread across
rules, selectors, hooks, Functions, and large page modules. The repository has
1,301 lines of Firestore rules, roughly 203 direct Firestore read/query call
sites, no versioned `firestore.indexes.json`, several multi-thousand-line
frontend modules, a flat Functions package with 98 exported functions, and
generated Functions output and coverage files tracked in Git. Existing
migration plans identify most of this accurately; they should now be executed
rather than expanded with more features.

The blunt conclusion: Maintley is a promising product with real differentiation,
not yet a release-quality consumer system. The next milestone should not be
more breadth. It should be a reliable, instrumented, emotionally satisfying
path from signup to a useful first property memory.

## Scores

| Category | Score | Assessment |
|---|---:|---|
| Overall product | **6.4 / 10** | Strong thesis and meaningful breadth, held back by first-run reliability and inconsistent presentation. |
| Consumer value | **6.8 / 10** | Valuable for organized homeowners and multi-home users; average homeowners need a faster payoff and clearer recurring benefit. |
| First-time experience | **5.4 / 10** | Registration is understandable, but the legal/plan step is dense and the first property workflow currently breaks promised Space creation. |
| UX | **6.1 / 10** | Good homeowner language and progressive disclosure in places; loading, density, touch targets, and conflicting states reduce confidence. |
| Design | **7.0 / 10** | Branded, modern, and generally trustworthy; still visually busy and inconsistent at high data volumes. |
| Marketing | **6.6 / 10** | Clear Property Memory story and strong homepage; weak proof, shallow audience pages, and inconsistent plan copy. |
| Maintley Intelligence | **7.3 / 10** | Explainable and actionable Quick Scan is a genuine strength; readiness labels and freshness still need refinement. |
| Technical architecture | **5.9 / 10** | Correct strategic model, but client orchestration, compatibility layers, monoliths, and rule/UI drift create fragility. |
| Scalability | **5.6 / 10** | Viable for current volume; broad reads, missing index-as-code, large client lists, scheduled scans, and 98-function operations will become costly. |
| Consumer trust | **5.8 / 10** | Strong privacy language and review-first Intelligence are offset by entitlement contradictions, false empty states, and failed promised automation. |

These scores evaluate the production experience observed on August 18, 2026,
not the quality of the product vision or the amount of work completed.

## Methodology and validation boundaries

The audit included:

* The production public website and principal solution, pricing, resource,
  security, registration, login, and authenticated routes.
* The shared Portfolio demo account without intentionally modifying its
  existing records.
* A temporary new Free account and temporary property used to exercise the
  real first-run property workflow.
* Desktop and 390-pixel mobile viewport checks.
* Current product, plan, acquisition, permissions, data-model, Intelligence,
  UX, testing, deployment, and migration documentation.
* Source inspection of the workflows implicated by live findings.
* Frontend unit/script tests, production build, bundle budget, and SEO
  validation.
* Current competitor and United States housing-market evidence.

Validation results:

* Root test suite: 86 suites; 557 tests passed; 1 todo; 141 script tests passed.
* Production frontend build: passed.
* SEO validation: passed for 27 pages and 27 sitemap URLs.
* Bundle budget: passed with warnings. Main JavaScript was approximately
  315 KB gzip against a 300 KB target; total JavaScript was approximately
  1.03 MB gzip against a 1 MB target.
* Root lint could not be reproduced locally because the current checkout's
  `eslint` executable was unavailable.
* The Functions TypeScript build could not be reproduced locally because the
  current checkout's `tsc` executable was unavailable. This is a local
  dependency/tooling boundary, not evidence that deployed Functions fail.
* No physical Android device or emulator was available. Android findings are
  based on the shared responsive UI, Capacitor/Gradle configuration, source,
  and test coverage—not a fresh APK acceptance run.
* Automated screenshots timed out repeatedly; visual conclusions use live DOM,
  computed layout, responsive behavior, and direct interaction evidence.

## What is exceptional

### 1. Property Memory is a real product thesis

Maintley is strongest when it says: this is where a property's operational
knowledge survives. The connected property model—Property, Spaces, Equipment,
Supplies, Documents, Tasks, and Intelligence—is more durable than a collection
of feature modules. It gives future decisions a consistent test: long-lived
knowledge belongs to the property; relationships explain how it is used.

### 2. Quick Scan is the current "wow" candidate

The demo property's Quick Scan found overdue work and missing equipment facts,
explained why each mattered, and offered a direct next action. It did not
pretend to have predictive certainty it lacked. This review-first,
deterministic posture should remain a core trust advantage.

### 3. The website communicates the system better than the application does

The homepage makes the Record → Remember → Understand → Act story tangible.
It explains the long-term benefit without relying only on an AI claim. The
security page is plainspoken, plan cards are understandable, and the resource
architecture is technically sound.

### 4. Downgrade preservation and provenance are unusually thoughtful

Maintley's non-destructive downgrade principle, accepted-suggestion history,
and distinction between recorded work and derived guidance are excellent
foundations for a product that may hold years of homeowner records.

## Critical issues

### C1. Automatic Space creation fails in production

**Evidence:** A new home was reviewed with `Bedroom 1`, `Bedroom 2`, `Bathroom
1`, and `Half Bathroom 1`. The property saved, but the production console
reported:

> Property created but reviewed Spaces were not all created: Missing or insufficient permissions.

The Details page then showed `No active Spaces` and a recovery message.

**Root cause:** The client generator uses a transaction to read a deterministic
`propertySpaces/{propertyId}__{generationKey}` document before creating it. The
deployed read rule authorizes an existing Space by inspecting
`resource.data.accountId`. The pre-create read targets a missing document, so
the read is denied before the allowed create can occur.

**Impact:** First-run trust failure; headline release behavior does not work;
equipment/task-to-Space relationships cannot be established; setup becomes
internally inconsistent.

**Required response:** Treat this as a production patch and release blocker.
Implement an idempotent write path that does not require an unauthorized read
of a missing document, then add a rules/emulator integration test for the exact
missing-ID → create → repeat sequence. Test both property-profile and Setup
Assistant sources.

### C2. Billing plan and effective access are presented as contradictory facts

**Evidence:** The new account had temporary Homeowner+ access, five-home plan
benefits, and 10 GB storage through September 17, 2026. The global card still
said `Plan: Free`, `1 of 1`, and `0 home slots available`. The demo account
similarly has Portfolio access but can be presented as a Free account over its
property limit.

**Root cause:** The global account snapshot derives property limits and its
label from billing-plan resolution while storage and Settings use effective
access/grant resolution.

**Impact:** Users cannot tell what they can create, whether a grant worked, or
whether Maintley is about to block/delete data. It makes an intentional
complimentary-access system look unreliable.

**Required response:** Define one user-facing access projection with separate,
explicit fields for `Billing plan`, `Current access`, `Access source`, and
`Access end date`. All limits and capabilities must derive from Current access.
Billing plan should appear only where payment status is relevant.

### C3. Loaded accounts briefly render convincing empty states

**Evidence:** Direct navigation to Tasks, Properties, and Equipment initially
showed "No tasks yet", "No properties yet", or blank/empty views even though
the demo later loaded 57 tasks, 9 properties, and 51 equipment records.

**Impact:** Returning users can believe data was lost. That is one of the most
damaging possible impressions for a product selling memory and continuity.

**Required response:** Empty states must be impossible until the relevant
queries have reached a settled successful state. Use explicit loading,
refreshing, empty, populated, error, and stale-data states. Prefer showing
cached data with a refreshing indicator over replacing it with an empty CTA.

### C4. Release gates do not protect the first-value journey

The test suite is broad, but the production Space regression passed because
coverage tests components and normal rule operations without exercising the
full new-user transaction contract. Similar risk exists where one user action
creates or links multiple records from the browser.

**Required response:** Add a small release-blocking journey suite:

1. Register a Free account.
2. Verify temporary access projection.
3. Create a residential home with bedrooms and half bathrooms.
4. Verify exact Spaces and no duplicates after retry.
5. Run Setup Assistant with one present and one absent item.
6. Verify equipment, tasks, Spaces, and links.
7. Complete a task and verify Maintenance History.
8. Delete the test account and verify cleanup.

This should run against Beta with deployed rules and Functions, not only mocks.

## High-priority improvements

### H1. Move the first "wow" moment into the first ten minutes

The current path is signup → property form → 28-item setup workflow → enough
records to make Intelligence useful. That asks for investment before payoff.

Preferred experience:

1. Ask for basic home facts.
2. Let the user choose one fast input: inspection report, a few equipment
   photos, or guided room/area selection.
3. Produce a reviewable `We found...` summary.
4. Show one immediately useful care action and one piece of preserved memory.
5. Invite the user to continue, not complete the whole home.

The emotional moment should be: "Maintley already understands something about
my actual home," not "I finished entering a large checklist."

### H2. Make the Setup Assistant feel finite, optional, and rewarding

Seven areas and 28 items are organized well, but still feel like a survey. The
assistant should offer `10-minute essentials`, `Continue room by room`, and
`Upload an existing report`. Each completed area should show what value was
created: equipment added, tasks prepared, Spaces connected, and guidance now
available. Do not silently count an item as reviewed; one newly opened audit
session displayed Refrigerator as Not Present and 1 of 28 reviewed before an
intentional answer. This needs replication and a regression test.

### H3. Reduce list-page density and prioritize decisions

The demo Tasks page exposes 57 cards and the Equipment page exposes 51 records,
with large groups expanded. This proves breadth but makes the product feel like
work. Default to the smallest useful decision set:

* Today: top three actionable items.
* Tasks: overdue group expanded, later groups summarized.
* Equipment: needs-attention items first; healthy categories collapsed.
* Preserve filters and view preference per user.
* Virtualize or paginate large account lists before portfolio scale increases.

### H4. Correct the readiness model and its language

The dashboard showed Equipment Coverage `51/51 Ready` while the supporting
copy still told the user to add the first system. Coverage, scheduling, and
predictive confidence are different concepts and should not share a single
ambiguous "ready" label.

Use three explainable levels per property:

* **Recorded:** Maintley knows the system exists.
* **Scheduled:** at least one relevant task/interval is known.
* **Informed:** history and identity are sufficient for pattern-based guidance.

The portfolio card should summarize all properties; the detail dialog should
show each property's denominator, missing evidence, and direct navigation.

### H5. Make the demo prove the current release

The main demo has rich tasks and equipment but the inspected property had no
active Spaces or Supplies. Release updates promote both. A sales/demo account
should demonstrate the strongest intended relationships, not merely old data
volume. Seed one exemplary property end to end and keep a deterministic reset
script.

### H6. Instrument intentional value, not only system activity

The new analytics contract is a meaningful improvement. It distinguishes
`action_source`, tracks signup, property creation, setup, tasks, scans,
documents, and reports, and configures user/plan families. It is not yet a
complete decision system.

Add durable funnel/cohort concepts:

* setup started and completed by step/area;
* first user-authored action after onboarding;
* first manual document upload;
* first custom task;
* first completed maintenance event;
* first Quick Scan;
* first accepted recommendation;
* returned after 1, 7, and 30 days;
* time from signup to first value;
* abandonment reason and last completed onboarding stage.

Define a composite `activated_homeowner` metric instead of a vague event. A
reasonable initial definition is: created a property and then intentionally
completed any two of manual document upload, custom task, maintenance event,
Quick Scan, or equipment correction within 14 days.

### H7. Increase mobile touch reliability

The application avoided major horizontal overflow at 390 pixels, which is a
good baseline. However, many visible action buttons, pills, filters, quick
create controls, and icon buttons measured below a dependable 44-pixel touch
target. Dense task/equipment pages become especially tiring on mobile.

Enforce a shared minimum interactive target, use larger hit areas around icon
buttons, and test the five critical mobile journeys on an actual Android
device: onboarding, add equipment, upload document, complete task, and respond
to a notification.

### H8. Establish a server-side boundary for cross-entity commands

Simple CRUD can remain client-driven, but workflows such as property creation
plus Spaces, setup activation, task completion plus history, document review
acceptance, entitlement changes, and account deletion should execute as
idempotent commands with one authorization decision and a resumable operation
record. This is more reliable than coordinating partial writes from page
components and relying on the UI to interpret failures.

### H9. Execute the existing Functions and compatibility cleanup plans

The repository's planned direction is correct. Complete it before expanding
backend surface:

* reproducible Functions build from source;
* untrack generated `functions/lib` and `functions/coverage`;
* move deployable source into domain directories;
* preserve the exact 98-function inventory;
* decompose `adminPortal.ts` (5,374 lines), `stripeFunctions.ts` (2,527), and
  other large modules after the structural move;
* finish current compatibility inventories and backfills.

### H10. Put Firestore indexes and query contracts in source control

The repository does not contain `firestore.indexes.json`, and `firebase.json`
deploys rules but no indexes. Index requirements and production query behavior
should not live only in a Firebase console. Add index-as-code, a query inventory,
and representative portfolio-size fixtures. Measure read count and render time
for Today, Tasks, Equipment, Reports, and Team.

## Medium-priority improvements

### Product and UX

* Remove or rename the permanent `Beta` label in the production top bar. If it
  means product maturity, explain it once; if it means environment, it must not
  appear on production.
* Reconcile Home/Homeowner and Property terminology by context. Public and
  homeowner UI can say Home; data/architecture can say Property. Avoid mixing
  both on the same empty state.
* Simplify registration Step 3. `Start Free Plan` followed by `Create Account`
  presents two submission-like actions. Use selectable cards plus one final CTA.
* Correct plan copy. Registration says Homeowner+ turns records into reminders,
  while active plan documentation says recurring tasks and reminders are part
  of the Free maintenance workflow.
* Explain complimentary Homeowner+ access during signup. The new account
  received it, but the first plan selection did not set an expectation.
* Split the registration legal agreement into a concise required acknowledgement
  with expandable details. Five linked legal documents in one checkbox is
  cognitively heavy.
* Fix internal contradictions such as Team showing `8 properties covered` while
  every person card says `No properties assigned`.
* Reduce repeated Quick Scan rationale. One clear explanation, supporting
  evidence, and next action is enough.
* Fix grammatical date output such as `1 months ago`.
* Let report users start from a goal (`Tax records`, `Service history`, `What is
  overdue`) before exposing the full report taxonomy.

### Marketing and conversion

* Add a 60–90 second first-home demo that ends with one real recommendation.
* Add proof: named customer stories, before/after record examples, retention or
  completion evidence, and screenshots with understandable data.
* Deepen Homeowners and Property Managers pages. The homepage currently carries
  most of the persuasive work.
* Remove the duplicate Unlimited Equipment Records bullet from Free pricing.
* Make the product boundary explicit: Maintley preserves the operational record
  and coordinates care; it is not a substitute for inspection, diagnosis, or
  professional advice.
* Market Property Memory as the category and Quick Scan as the first proof—not
  AI as an abstract premium noun.

### Engineering and operations

* Replace false empty-state transitions with reusable async view-state
  primitives.
* Add production-like fixtures with 1, 5, 15, and 100 properties to performance
  tests.
* Track query counts and latency, not only build size.
* Add a physical-device Android release checklist and at least one smoke suite.
* Review Android release hardening. The current release build is not minified;
  local cleartext is appropriately limited by the network security config, but
  the resulting APK should still receive automated security and size checks.
* Keep a documented process for the ignored local service-account credential;
  prefer short-lived local credentials where practical.
* Version an error taxonomy and surface stable support codes for failed
  multi-record workflows.

## Nice-to-have improvements

* Calendar export/sync for scheduled maintenance.
* A property handoff package containing selected records, documents, history,
  and a human-readable summary.
* Homeowner-configurable favorites and compact list views.
* Photo-first setup and barcode-assisted Supply identification.
* Email-to-property inbox for invoices and service documents, with review-first
  routing.
* Weather-aware seasonal prompts only after location, relevance, and confidence
  are transparent.
* Optional Work Sessions after the core task/history model is stable.
* Voice/assistant execution only after the read-only assistant API, audit trail,
  authorization, and reversible commands are mature.

## First 15 minutes audit

### What works

* The welcome statement is understandable and low pressure.
* The product says the record can grow gradually.
* A homeowner can begin with only name and address.
* The property review makes generated Spaces explicit before save.
* The Setup Assistant groups equipment into familiar home areas.

### What causes abandonment

* Registration Step 3 combines audience choice, pricing, promo code, feature
  expansion, billing reassurance, plan selection, and final account creation.
* Free-versus-Homeowner+ language does not match the actual maintenance
  entitlement model.
* The dashboard and welcome panel both offer an Add Home action.
* The first meaningful automation—Space generation—currently fails.
* The user is asked to review up to 28 setup items before seeing property-aware
  guidance.
* Effective access appears internally contradictory immediately after signup.

### Earliest credible wow moment

Today, the first credible wow moment is Quick Scan, but it occurs too late.
Move a smaller form of it directly after property creation: "Based on what you
added, here are the first three things Maintley can remember or help you verify."

## Consumer value and retention

Maintley has high annual and event-driven value but weak daily value. That is
not inherently bad; home care is episodic. The product should not manufacture
daily engagement. It should win on dependable return moments:

* when maintenance is due;
* after a contractor visit;
* when a warranty, invoice, or manual is needed;
* when equipment fails;
* when preparing taxes, insurance, sale, or handoff;
* when a homeowner asks, "When was this last done?"

An average homeowner will pay only if setup cost stays low and those return
moments are reliably better than a calendar plus cloud folder. At $3.99/month,
the price is defensible, but the product must demonstrate at least one avoided
search, avoided missed task, or confident service-history answer early.

Long-term retention will come from accumulated switching value: a trustworthy
timeline, connected documents, exact equipment identity, and accepted guidance
history. Lock-in should be earned through usefulness, not data captivity; full
export and handoff increase trust even if few users invoke them.

## Property Memory audit

### Correct foundation

The property-first collections and many-to-many relationships are the right
architecture. Spaces are generalized locations, Supplies can connect to
multiple entities, and Documents are not owned by Equipment. This supports a
home as a connected knowledge model.

### Remaining gaps

* Relationship creation is not yet transactionally reliable.
* Many current records still depend on compatibility fields and client-side
  linking behavior.
* Space and Supply value is not visible enough in the main demo.
* History remains more powerful when all task completion paths converge on one
  Maintenance Event contract.
* A homeowner-facing timeline should become the primary expression of memory,
  with sources and corrections visible.
* Data portability and property handoff are necessary trust features for a
  long-lived memory product.

## Intelligence audit

### Strengths

* Findings are explainable.
* Quick Scan uses known records rather than pretending to diagnose a home.
* Users review actions before records change.
* Missing dates, overdue work, and incomplete identity are actionable.
* Intelligence History supports provenance.

### Weaknesses

* Readiness currently mixes record completeness with scheduling and predictive
  capability.
* A readiness denominator can look authoritative without explaining whether it
  supports reminders, guidance, or pattern recognition.
* Findings can repeat rationale and make the panel feel longer than necessary.
* Full Review has not been run in the demo, weakening proof of premium value.
* Ongoing Intelligence is still a roadmap capability; marketing and plan copy
  must not imply continuous monitoring beyond implemented behavior.

### Preferred model

Every recommendation should expose:

1. Property.
2. Capability level: Recorded, Scheduled, or Informed.
3. Evidence used.
4. Evidence missing.
5. Confidence and limits.
6. Recommended action.
7. What changes after acceptance.

## Marketing and SEO audit

### Strong

* Homepage metadata, canonicalization, H1, pricing, security, FAQs, and product
  architecture are coherent.
* Public resources remain separate from in-app Support.
* Twenty-seven validated public URLs provide a solid technical SEO base.
* The homepage explains a differentiated category rather than listing features.

### Weak

* Many solution pages are thinner than the homepage and do not carry enough
  independent proof or intent-specific detail.
* Property Managers is strategically ambiguous. Maintley lacks the accounting,
  leasing, payments, and operational depth of property-management suites, so it
  should sell property knowledge and maintenance coordination—not compete as a
  full PMIS.
* The site lacks strong external trust evidence: testimonials with context,
  case studies, measurable outcomes, review-platform evidence, and transparent
  product demonstrations.
* Conversion analytics still need intentional funnel and cohort metrics.

### SEO priorities

1. Improve existing page depth and proof before adding many more URLs.
2. Build content clusters around service history, warranty retrieval, new-home
   setup, inspection-report organization, and home maintenance records.
3. Add comparison pages only when they are factual and genuinely useful.
4. Add structured proof and internal links from resources to the exact product
   workflow that solves the reader's problem.
5. Monitor Search Console outcomes; passing static validation is not the same as
   earning search visibility.

## Competitive audit

The closest strategic competitor is HomeZada, not a generic task app. HomeZada
currently markets inventory, maintenance, documents, projects, finances, AI,
weather guidance, forecasts, calendar integration, exports, multiple
properties, and professional handoff. It also says it automatically creates a
maintenance plan at signup. This is substantially broader than Maintley's
current homeowner offer. See [HomeZada home maintenance](https://www.homezada.com/homeowners/home-maintenance),
[HomeZada connected home intelligence](https://www.homezada.com/home-intelligence),
and [HomeZada FAQ and export capabilities](https://www.homezada.com/faq).

Dwellin presents a simpler, mobile-first home profile with maintenance prompts
and rewards. Its message is easier to grasp but less focused on durable
operational memory. See [Dwellin app overview](https://www.dwellin.com/app/overview/).

Buildium and similar property-management platforms are stronger in business
operations, residents, vendors, payments, accounting, and portfolio workflow.
Maintley should not chase that surface area. Its business wedge is preserving
the physical property's knowledge and coordinating its care. See
[Buildium maintenance software](https://www.buildium.com/features/property-management-maintenance-software/).

### Where Maintley can win

* Clearer, calmer homeowner experience than broad home-finance suites.
* Better explainability and provenance than AI-first assistants.
* Stronger maintenance-history continuity than task/reminder apps.
* Connected records rather than folders or isolated equipment pages.
* Very accessible homeowner pricing.

### Where competitors are stronger

* Faster automatic setup and richer templates.
* Native mobile maturity and demonstrated mobile workflows.
* Calendar integration, exports, and property handoff.
* Financial/project planning breadth.
* Customer proof, professional distribution, and established trust.
* Some competitors already use nearly identical "connected home intelligence"
  language, so Maintley cannot rely on terminology alone.

### What makes Maintley hard to replace

Not the number of features. The defensible asset is a corrected, source-aware,
connected history of the actual property that improves future decisions. The
product becomes hard to replace when it can answer:

* What is this?
* Where is it?
* What does it use?
* What documents prove it?
* What work has been done?
* What should happen next, and why?
* What changed ownership or responsibility?

## Market opportunity

The United States alone had approximately 85.7 million owner-occupied homes in
2023, and the first-quarter 2026 homeownership rate was 65.3 percent. See the
[U.S. Census housing report](https://www2.census.gov/library/publications/2025/demo/acs-61.pdf)
and [current Housing Vacancies and Homeownership release](https://www.census.gov/housing/hvs/current/).

This supports a large consumer category, but market size is not the same as
obtainable demand. At the current $39.99 annual Homeowner+ price, illustrative
U.S. penetration scenarios are:

| Paid households | Approximate households | Illustrative annual recurring revenue |
|---:|---:|---:|
| 0.01% | 8,570 | $0.34M |
| 0.10% | 85,700 | $3.43M |
| 0.50% | 428,500 | $17.14M |
| 1.00% | 857,000 | $34.27M |

These are simple price-times-household scenarios, not a forecast. They exclude
monthly/annual mix, churn, taxes, discounts, payment fees, business plans, and
international demand.

### Best-aligned adjacent markets

| Segment | Fit | Missing capabilities | Strategic judgment |
|---|---|---|---|
| Multi-home and vacation-home owners | Very high | Faster cross-property views, caretaker access, seasonal occupancy workflows | Direct extension of current homeowner model. |
| Home builders and remodelers handing over a property | Very high | Template-to-property transfer, branded handoff, contributor workflow | Strong B2B2C acquisition channel; preserves Property Memory. |
| Home inspectors | Very high | Structured inspection import, review queue, client handoff | Excellent source of the initial property record. |
| Service businesses | High | Contributor identity, scoped work submission, approval, customer handoff | Valuable distribution without turning Maintley into field-service software. |
| Real-estate agents and brokerages | Medium-high | Gift accounts, transfer, branded onboarding, privacy-safe handoff | Acquisition channel, not core operating persona. |
| Small landlords / vacation rentals | Medium-high | Resident/caretaker requests, occupancy periods, vendor coordination | Fits Property/Portfolio if kept maintenance-focused. |
| HOAs | Medium | Common-area ownership, approvals, recurring inspections | Possible later; avoid dues/accounting scope. |
| Farms, churches, nonprofits, clubs | Medium-low | Asset hierarchy, work orders, compliance, roles, procurement | Technically possible but begins diluting homeowner language and model. |
| Schools, municipalities, facilities management | Low near-term | Compliance, SLAs, inspections, procurement, inventory, audit controls | Large markets but effectively a different enterprise product. |

The preferred expansion strategy is B2B2C contribution and handoff. Builders,
inspectors, and service providers can create or enrich the homeowner's Property
Memory, while the homeowner remains the long-term owner. This strengthens the
core rather than creating another business platform.

## Scalability and database audit

### Strengths

* Property is the root organizational context.
* Spaces, Supplies, Documents, Tasks, and Equipment can be independent
  property-level records.
* Relationships can represent many-to-many usage without duplicating ownership.
* Rules and typed models exist for newer knowledge collections.
* The product has begun separating billing plan from effective access, even
  though presentation is not yet consistent.

### Risks

1. **Authorization is distributed.** Rules, UI selectors, account memberships,
   legacy sharing, grants, and Functions can disagree.
2. **Client-side orchestration creates partial success.** The live property was
   saved even though its reviewed Spaces failed.
3. **Broad account reads will grow with the property.** Lists and reports can
   fetch many records before filtering/deriving client-side.
4. **No index-as-code boundary exists.** Production query requirements are not
   fully reproducible from the repository.
5. **Compatibility fields remain.** Legacy user ownership, location text,
   unit/suite remnants, and multiple maintenance representations increase the
   number of states every feature must understand.
6. **Large modules obscure contracts.** `PropertiesTab.tsx` is about 4,160
   lines, `PropertyKnowledgeReviewPanel.tsx` about 3,960, and several core pages
   exceed 2,000 lines.
7. **Functions operations are heavy.** Ninety-eight exported functions, a flat
   source directory, scheduled jobs, and tracked generated output increase
   deployment and review risk.
8. **Portfolio rendering is eager.** Dozens of expanded cards are manageable
   today but will not remain efficient at hundreds of assets/tasks.

### Recommended architecture sequence

1. Repair and test the current first-value workflow.
2. Establish one effective-access projection.
3. Add async view-state primitives.
4. Put Firestore indexes and query budgets in source control.
5. Move cross-entity writes behind idempotent commands.
6. Finish compatibility migrations and remove retired paths.
7. Execute the existing Functions directory migration.
8. Add portfolio-size performance fixtures and observability.
9. Only then add Work Sessions, contributor writes, or broader automation.

## Performance audit

### Current evidence

* The production application eventually loaded substantial demo data, but
  direct routes required enough time to expose false empty states.
* The main and total JavaScript bundles are slightly above target but below
  current fail thresholds.
* Route chunks and lazy loading exist, yet large feature modules and component
  trees remain.
* Task and Equipment pages render long, expanded result sets.
* Browserslist data was approximately six months old during build.

### Performance priorities

* Measure user-centric route readiness, not only build completion.
* Preserve cached records during refetch.
* Paginate or virtualize high-volume lists.
* Collapse non-actionable groups by default.
* Add query-count, document-read, and render-duration budgets to representative
  Beta journeys.
* Separate dashboard summaries from full-record downloads.
* Continue bundle reduction, but prioritize data-loading correctness over a
  small gzip win.

## Consumer trust audit

Trust is earned when the product is explicit about evidence, permissions,
access, failure, and reversibility.

Maintley does well with review-first document suggestions, recommendation
explanations, security language, downgrade visibility, and Intelligence
History. It loses trust when an action promises four records and creates none,
when a paid/granted account looks over limit, or when loading looks like data
loss.

Trust priorities:

* Never use an empty state as a loading state.
* Show partial workflow outcomes with a retry that is demonstrably idempotent.
* Display current access separately from billing.
* Expose source, last update, and correction history for long-lived records.
* Provide full export and transfer controls.
* Keep AI claims within implemented evidence and confidence.
* Add a visible service-status/support path for failed document or workflow
  processing.

## Feature gaps

### Critical to the promise

* Reliable, idempotent connected-record creation.
* Full property export/handoff and account-level data portability.
* Consistent effective entitlement and permission explanation.
* A tested, observable new-user activation journey.

### High value

* Inspection-report-first setup that reliably extracts reviewable property,
  equipment, service, and task suggestions.
* Calendar export/sync.
* Contractor/builder/inspector contribution with homeowner approval.
* A homeowner-facing property timeline.
* Email/document inbox with source-aware review.
* Better first-value and return/retention analytics.

### Nice to have

* Work Sessions and guided walkthroughs.
* Supply inventory counts and shopping lists.
* Voice-guided maintenance.
* Weather-aware planning.
* Transfer marketplace/vendor catalog concepts.

## Quick wins

1. Patch the generated Space permission/write sequence and add the missing
   integration test.
2. Change Plan & Usage to effective access and label grants/trials explicitly.
3. Gate all empty states on settled successful queries.
4. Remove the production Beta label or explain it.
5. Correct Free/Homeowner+ reminder copy across registration, pricing, and
   Support.
6. Fix Team coverage wording and date pluralization.
7. Collapse healthy/non-urgent groups on dense list pages.
8. Enlarge mobile hit targets.
9. Seed/reset a demo property that showcases Spaces, Supplies, Documents,
   History, and Quick Scan together.
10. Add first-value and retention events to the analytics contract.

## Strategic opportunities

### 1. Ten-minute Property Memory

Make Maintley useful from an inspection report, a handful of photos, or a short
guided home profile. The output is a review—not silent automation—and ends with
one actionable care plan.

### 2. Property handoff network

Let builders, inspectors, and service providers contribute verified records
that transfer to the homeowner. This can reduce consumer acquisition cost and
make Maintley present at high-intent moments.

### 3. The explainable home timeline

Unify accepted documents, equipment identity, work performed, costs,
corrections, and guidance into a single trustworthy chronology. This is the
clearest expression of "the home remembers."

### 4. Guidance readiness as a product loop

Show exactly how one missing fact unlocks a better reminder or recommendation.
Users should see the return on record completeness, not a generic progress bar.

## Long-term vision opportunities

* A portable digital operational record that survives owner, resident, and
  service-provider transitions.
* Permissioned contributors who enrich a homeowner-owned record.
* Explainable, property-specific maintenance forecasting built on real history,
  not generic schedules.
* A read/write assistant layer with scoped commands, approvals, provenance, and
  rollback.
* Aggregate benchmarking only with explicit privacy controls and sufficient
  anonymization.

## Recommended order of work

### Phase 0: Immediate release confidence

* Fix Space generation.
* Fix effective-access presentation.
* Fix false empty states.
* Add the Beta end-to-end activation test.
* Run physical Android smoke tests.

### Phase 1: Activation and proof

* Redesign the first ten minutes around a fast useful result.
* Instrument activation and abandonment.
* Seed the demonstration account.
* Add public product proof and a short demo.

### Phase 2: Reliability and architecture

* Add idempotent command boundaries.
* Version indexes and establish query budgets.
* Complete compatibility/backfill work.
* Execute Functions organization and generated-artifact cleanup.

### Phase 3: Durable differentiation

* Property timeline and export/handoff.
* Inspection/report-first setup.
* Contributor approval and provenance.
* Calendar integration.

### Phase 4: Expansion

* Builder/inspector/service-provider distribution.
* Work Sessions.
* Scoped assistant writes.
* Evidence-based predictive guidance.

## If responsible for making Maintley market-leading within five years

I would first stop adding broad features and make one path exceptional:

> A homeowner creates a property, gives Maintley one easy source of truth, and
> within ten minutes receives a trustworthy, connected home record plus one
> useful next action.

I would make that journey production-reliable, measurable, mobile-friendly,
and demonstrable. Then I would build the property timeline and handoff model so
the record becomes more valuable every year and can be enriched by trusted
professionals without ceasing to belong to the homeowner.

That creates a defensible loop:

1. Easy acquisition of real property knowledge.
2. Reviewable connected records.
3. Timely explainable action.
4. Preserved maintenance history.
5. Better future guidance.
6. Increasing switching value and referral value.

Maintley will not become market-leading by matching every competitor's feature
list. It can become market-leading by being the most trustworthy place to
understand what a home contains, what has happened to it, and what should
happen next.
