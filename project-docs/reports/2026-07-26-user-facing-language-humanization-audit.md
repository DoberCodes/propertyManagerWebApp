# User-Facing Language Humanization Audit

Date: 2026-07-26

Status: Complete audit; remediation not started

## Executive summary

Maintley does not read as uniformly AI-generated. Most task labels, empty states,
support FAQs, reminders, and recent onboarding changes are direct and practical.
The product has a recognizable voice when it talks about a specific action.

The AI-written impression becomes much stronger when the copy shifts from a
specific action to a broad explanation of Maintley. Those passages repeatedly
use abstract product language, long lists, symmetrical feature descriptions,
and the same value formulas: `future you`, `one place`, `property memory`,
`worth your attention`, and `helps you`.

The most urgent findings are not subjective tone problems. Several active
customer surfaces contradict `UX_LANGUAGE_GUIDE.md`:

1. The dashboard displays `Home Health`, `Property Health`, percentages, and
   ten health signals even though the guide explicitly says to avoid health and
   score framing.
2. Property Insights email displays `Property Record Completeness` as a
   percentage even though the guide explicitly prohibits documentation scores.
3. Equipment screens expose `Lifecycle Status`, `Lifecycle timeline`, and
   `Last lifecycle update` instead of familiar equipment and service language.
4. Customer email and public pages expose `operational memory`, which the guide
   reserves for internal product philosophy.
5. The legacy Feature Docs page uses corporate, exhaustive, and potentially
   stale capability language. It is the surface most likely to be perceived as
   AI-generated.

Recommended order:

1. Remove scoring and health language.
2. Remove internal terminology from customer surfaces.
3. Rewrite or retire the legacy Feature Docs page.
4. Simplify access, billing, and lifecycle explanations.
5. De-duplicate marketing and SEO language using a small approved phrase bank.

## What “AI-generated” means in this audit

Authorship cannot be reliably determined from text alone. This audit does not
claim that a passage was or was not written by AI. It assesses whether a
customer is likely to perceive the writing as generated, templated, inflated,
or impersonal.

Signals used:

* Abstract nouns where a familiar action would be clearer.
* Exhaustive lists that read like a feature inventory.
* Repeated sentence structures across unrelated pages.
* Generic value claims that could belong to any software product.
* Excessive reassurance or legal qualification inside the main message.
* Internal implementation terms exposed to customers.
* Overuse of branded philosophy instead of concrete customer outcomes.
* Headings that sound polished but do not say what the user should do.

## Scope and method

The automated inventory covered the user-facing text candidates in `src/`,
`functions/`, and `public/`, including TS, TSX, JS, CJS, and HTML. The repository
contains roughly 710 files in those formats. Generated `functions/lib` files,
tests, styles, comments, internal logs, type names, and code identifiers were
excluded from tone findings unless they were rendered to a user.

Manual review focused on:

* Public marketing and SEO pages.
* Registration, login, onboarding, and empty states.
* Today, Property, Equipment, Tasks, and Maintley Intelligence.
* Settings, plans, billing, access codes, and downgrade explanations.
* Support Center and feature documentation.
* Admin customer-support surfaces.
* Welcome, task, summary, seasonal, insight, and access lifecycle emails.
* User-facing errors, confirmations, and notifications.

Legal documents were not rewritten or graded for conversational tone. Dynamic
user-entered content was outside scope.

## Surface assessment

| Surface | Assessment | Main issue |
| --- | --- | --- |
| Tasks, reminders, and zero states | Strong | Specific, calm, and action-oriented |
| Simplified onboarding | Good | Two remaining generic marketing phrases |
| Today page action language | Mixed | Strong task language undermined by health scoring |
| Property and equipment pages | Mixed | Internal lifecycle and maintenance-memory language |
| Maintley Intelligence | Mixed | Careful attribution, but too much branded memory language |
| Registration and access codes | Needs revision | Stripe and Checkout implementation language leaks through |
| Settings and billing | Needs revision | Transparent but dense and system-oriented |
| Support Center | Generally good | Some architecture language in customer guides |
| Automated emails | Mixed | Task reminders are natural; insight and access emails are stiff |
| Public marketing and SEO | Needs revision | Repetition makes the writing feel generated and keyword-shaped |
| Feature Docs page | Poor | Corporate inventory language and potentially stale claims |
| Admin portal | Acceptable for staff | Technical terms are valid, but confirmations are overly long |

## Critical findings

### H1. Health and completeness scores contradict the language standard

Severity: Critical

Evidence:

* `src/pages/DashboardTab/DashboardTab.tsx:753-759` labels the surface `Home
  Health` or `Property Health` and describes `Maintenance readiness`.
* `src/pages/DashboardTab/DashboardTab.tsx:1790-1813` explains how Home Health
  is calculated, shows a percentage, and displays ten health signals.
* `src/pages/DashboardTab/DashboardTab.tsx:2104-2134` repeatedly explains home
  or property health and says that health improves as memory grows.
* `functions/propertyInsightEmails.ts:518-524` displays `Property Record
  Completeness` and a percentage.
* `public/home-health/index.html:53-65` markets Home Health as a named feature.
* `public/features/index.html:55-88` continues to advertise Home Health.

Why it feels generated:

The product calculates a branded score, then needs several paragraphs to
explain that the score does not mean what customers naturally think “home
health” means. The disclaimers make the experience feel designed around the
system rather than around the homeowner.

Why it matters beyond tone:

This conflicts directly with `UX_LANGUAGE_GUIDE.md`, which says to avoid Home
Health, Property Health, Property Score, and Documentation Score. It can also
sound judgmental and can be mistaken for a statement about physical condition.

Recommended direction:

Replace the score card with a small, non-scored `Maintley Intelligence` or
`Record Review` surface. Show a few specific next steps based on saved records.
Use counts or plain status statements only when they help the user act.

Example:

* Current: `Home Health — 70% — 7 of 10 home health signals`
* Prefer: `Records worth reviewing — Add an install date for the water heater`

The public `/home-health/` page should be redirected, retired, or comprehensively
rewritten so SEO content does not preserve a deprecated product concept.

### H2. Customer-facing equipment language exposes internal lifecycle concepts

Severity: High

Evidence:

* `src/pages/PropertyDetailPage/TabSystem/DevicesTab.tsx:362` uses `Lifecycle
  Status`.
* `DevicesTab.tsx:620` uses `Lifecycle timeline and service records`.
* `DevicesTab.tsx:673` uses `Last lifecycle update`.
* `DevicesTab.tsx:1053-1054` describes `maintenance memory`, `task context`, and
  `service lifecycle history` in one sentence.
* `DevicesTab.tsx:1096` repeats `Lifecycle status` in sorting.
* `src/Components/ConvertRequestToTaskModal/ConvertRequestToTaskModal.tsx:215`
  says to “route later in your maintenance workflow.”

Why it feels generated:

These phrases are grammatically valid but do not sound like words a homeowner
would use while looking at a furnace or water heater.

Recommended replacements:

| Current | Prefer |
| --- | --- |
| Lifecycle Status | Equipment status |
| Lifecycle timeline and service records | Service history |
| Last lifecycle update | Installed or retired |
| Maintenance workflow | Maintenance task |
| Task context and service lifecycle history | Related tasks and service history |

### H3. The Property Insights email uses a prohibited evaluation model

Severity: High

Evidence:

* `functions/propertyInsightEmails.ts:416-417` reports `No obvious record gaps
  found` after a calculated review.
* `propertyInsightEmails.ts:518-520` renders `Property Record Completeness` as a
  large percentage.
* `propertyInsightEmails.ts:524` ranks `Top Insights`.
* `propertyInsightEmails.ts:530` says `View all property insights` even though
  the link resolves to the app root rather than a clearly named insight view.

The calculation may remain useful internally, but the percentage should not be
the customer-facing conclusion. It is evaluative and implies a meaningful
precision that the underlying record heuristics may not support.

Recommended direction:

Lead with two or three concrete record suggestions. Replace the score block
with factual counts such as `4 equipment records reviewed` and `2 details worth
checking`. Keep the existing disclaimer, but shorten it.

### H4. The Feature Docs page is the strongest AI-written impression

Severity: High

Evidence:

* `src/pages/FeatureDocs/FeatureDocsPage.tsx:223` says `Comprehensive property
  management with detailed suite tracking`, despite the current direction to
  avoid Units and suite complexity.
* `FeatureDocsPage.tsx:287-299` promises dashboard analytics, an efficiency pie
  chart, and team overview.
* `FeatureDocsPage.tsx:305-319` lists comprehensive reporting, task completion
  analytics, property performance metrics, custom reports, and trend analysis.
* `FeatureDocsPage.tsx:345-389` uses generic corporate phrases such as
  `Comprehensive notification system`, `application settings customization`,
  `role-based access control`, and `feature access based on subscription level`.
* `FeatureDocsPage.tsx:416-425` promises real-time synchronization, instant
  delivery, and collaborative editing.

Why it feels generated:

Every card follows the same heading-description-bullet template, adjectives
substitute for proof, and the page tries to list everything. This resembles a
generated software capability matrix more than a Maintley product explanation.
Some claims also appear stale or broader than current verified behavior.

Recommended direction:

Retire the page if the newer public Features page replaces it. Otherwise rebuild
it around six verified customer jobs: remember work, track equipment, plan
maintenance, save documents, coordinate access, and export records. Every claim
should have a corresponding working product surface.

### H5. Internal product philosophy leaks into customer copy

Severity: High

Evidence:

* `functions/emailBrand.ts:27` uses `preserve the operational memory of your
  property` as the default customer email footer.
* `public/features/index.html:98` says Maintley preserves `operational memory`.
* `public/property-maintenance-software/index.html:59` uses `Operational memory
  for every property` as a heading.
* `public/resources/home-service-history/index.html:48` says records remain
  `within the property context, building a living maintenance memory`.
* `src/pages/PropertyDetailPage/TabSystem/DevicesTab.tsx:1053` asks customers to
  understand equipment as part of `maintenance memory`.

`Operational memory` is a useful architectural concept. It is not homeowner
language. `Property memory` can remain a secondary explanation in limited
places, but it should not replace the concrete outcome.

Example:

* Current: `Maintley helps you preserve the operational memory of your property.`
* Prefer: `Keep your property’s maintenance history and records easy to find.`

## Medium-priority findings

### M1. Marketing repeats a small set of polished formulas too often

Severity: Medium

The repository contains roughly:

* 11 customer-facing uses of `future you`.
* 18 uses of `one place`, including repeated metadata variants.
* More than 25 uses of property, home, living, maintenance, or operational
  `memory` language.

Representative examples:

* `src/pages/LandingPage/LandingPage.tsx:75` — `Give Future You the Answers You
  Wish You Had Today`.
* `src/pages/LandingPage/components/HomepageSections.tsx:70` — `Keep a timeline
  future you can trust`.
* `src/pages/LandingPage/components/FeaturesSection.tsx:56` — `timeline future
  you can rely on`.
* `public/index.html:304-314` combines `living maintenance memory`, `one place`,
  and `future you` in adjacent fallback copy.
* Multiple public resource pages reuse a closing variation of the same future-you
  promise.

None of these phrases is bad alone. Repetition across pages makes the brand
voice feel synthesized and makes SEO pages less distinctive.

Recommended direction:

Reserve `future you` for the homepage promise and at most one supporting page.
Use concrete outcomes elsewhere: find the model number, remember who repaired
the furnace, see when the roof was replaced, or know which warranty applies.

### M2. Complimentary-access and billing copy is accurate but system-oriented

Severity: Medium

Evidence:

* `src/Components/RegistrationCard/RegistrationCard.tsx:655` explains that a
  code is “separate from a Stripe coupon.”
* `RegistrationCard.tsx:865-866` says `paid continuation requires Checkout`.
* `src/pages/SettingsPage/AccountManagement.tsx:177-203` shows `Billing plan`,
  `Stripe discount`, payment-method state, transition mode, and first-charge
  details as a dense stack.
* `AccountManagement.tsx:309` repeats `Continuing with a paid plan requires
  Checkout`.
* `functions/accessLifecycleEmails.ts:298-318` repeatedly uses `automation`,
  `intentional Checkout`, and `property memory`.
* `accessLifecycleEmails.ts:393-431` uses `paid continuation`, `resulting plan`,
  and `expansion beyond your resulting limits`.

The transparency is valuable and should be preserved. The problem is that the
customer must understand Maintley’s internal distinction between Stripe,
Checkout, grants, plans, access, and automation.

Example rewrites:

* `This is separate from a Stripe coupon.` -> `This code adds temporary access
  and will not start a paid subscription.`
* `Paid continuation requires Checkout.` -> `You can choose a paid plan after
  this access ends.`
* `Homeowner+ automation has stopped.` -> `Recurring task creation and other
  Homeowner+ features have stopped.`
* `Your resulting plan` -> `The plan your account returns to`.

### M3. Support articles sometimes sound like architecture documentation

Severity: Medium

Evidence:

* `src/pages/SupportPage/SupportContent.ts:156-165` calls the property record
  `the main home for everything Maintley knows`, then explains that properties
  are `the primary organizational unit`.
* `SupportContent.ts:158` says every record needs `clear property context`.
* `SupportContent.ts:316` uses `supporting records` and `broad property context`.
* `SupportContent.ts:572` asks users to look for `the property context` in an
  Intelligence recommendation.

The instructions themselves are good. Replace architecture terms with direct
relationships: `Make sure the task shows the right property` or `Attach the
document to the property or equipment it belongs to`.

### M4. Some automated email copy is overqualified

Severity: Medium

Task reminder emails are strong: they name the task, property, status, due date,
and action. Monthly and seasonal emails are understandable but sometimes sound
deliberately processed:

* `functions/monthlyPropertySummary.ts:373-377` says `A calm snapshot of what is
  currently recorded` and `already documented in Maintley`.
* `functions/seasonalGuidanceEmails.ts:156-165` says homeowners `often choose to
  review or document` areas and repeats that the items are `general record
  prompts`.
* `functions/accessLifecycleEmails.ts:286-289` says `Your property memory is
  taking shape` and `A factual summary of what you have recorded`.

The safeguards are appropriate, but one clear disclaimer is usually enough.
The main copy should sound like a useful email, not an evidence statement.

### M5. New onboarding is much better, with two generic phrases remaining

Severity: Medium-low

The simplified flow is a substantial improvement: it has one clear action,
does not force Setup Assistant completion, and gives existing-property users a
short path into the app.

Two phrases still sound generic:

* `src/Components/OnboardingFlow/OnboardingFlow.tsx:249` — `now have one place
  to build over time`.
* `OnboardingFlow.tsx:281` — `Built to grow with the property`.

Suggested direction:

* `Repairs, equipment, documents, and completed work will stay with this
  property.`
* `Start with the basics`.

## Low-priority and isolated findings

### L1. Password reset success leaks implementation details

`src/Components/ForgotPasswordCard/ForgotPasswordCard.tsx:46` tells the customer
to check a Firebase Console email template configuration. That instruction is
for Maintley developers, not customers.

Prefer:

`If the email does not arrive in a few minutes, check your spam folder or try
again.`

### L2. Admin confirmations are accurate but difficult to scan

The admin portal is allowed to use `grant`, `audit`, `Stripe`, `lifecycle`, and
other operational terms. Staff need those distinctions. However, several
messages combine the result, billing effect, access effect, and audit result in
one long sentence. Examples appear throughout
`src/pages/AdminInboxPage/components/AdminUserManagementPanel.tsx`, including
lines 248-249, 382-383, 421, 579, 1245, and 1340.

Prefer a compact result plus labeled detail:

```text
Access granted.
Billing: unchanged
Audit entry: saved
```

### L3. “Dashboard” remains in older customer documentation

The recent navigation update correctly labels the main destination `Today`, but
older support updates, Feature Docs, image alt text, and property-filter copy
still use Dashboard. Internal component names and `/dashboard` should remain.
Customer-visible references should be reviewed as part of the copy cleanup.

### L4. Some claims should receive a proof audit while copy is edited

The humanization pass surfaced claims such as `offline-capable features`,
`instant notification delivery`, `collaborative editing`, `advanced analytics`,
and `custom report generation`. These should not be softened and retained by
default. Each should be verified against current behavior or removed.

## Copy that already works well

The cleanup should preserve these patterns:

* `src/Components/Library/AppZeroState/AppZeroState.tsx` explains what is empty
  and gives a useful next action without blaming the user.
* Task reminder email copy in `functions/taskReminderEmails.ts` is factual and
  easy to scan.
* Most Support Center FAQs start with the exact customer question and answer it
  directly.
* Today headings such as `Handle what matters first`, `Needs Attention`, `Your
  Tasks`, and `All Work` are clear and appropriately short.
* Maintley Intelligence generally attributes conclusions to saved records rather
  than claiming physical knowledge of a property.
* The simplified onboarding flow no longer teaches the whole product before the
  user can begin.
* Billing copy consistently tells customers whether they will be charged. That
  transparency should remain even when the wording becomes simpler.

## Recommended remediation plan

### Phase 1: Remove contradictions and user-facing implementation leaks

1. Replace Home Health and Property Health scoring with non-scored record-based
   guidance.
2. Remove Property Record Completeness percentages from emails.
3. Replace lifecycle, workflow, and operational-memory language.
4. Fix the Firebase Console password-reset message.
5. Decide whether Feature Docs should be removed or rebuilt.

Validation gate:

* No customer-facing matches for the language guide’s prohibited terms unless
  specifically approved in context.
* No customer error tells users to inspect Firebase, Stripe configuration, logs,
  environment variables, or developer tooling.

### Phase 2: Simplify billing, access, and lifecycle communication

1. Create one customer vocabulary: `current plan`, `complimentary access`,
   `ends on`, `first charge`, `renews`, and `manage billing`.
2. Keep Stripe named only where the customer is opening Stripe or where payment
   responsibility must be explicit.
3. Replace abstract feature loss with the actual features that stop.
4. Use a compact summary rather than a stack of implementation-state sentences.

Validation gate:

* A customer can answer: What access do I have? When does it end? Will I be
  charged? What will it cost? What can I do about it?

### Phase 3: Rewrite marketing and SEO pages by search intent

1. Keep one approved use of the core `future you` promise.
2. Give every page one concrete customer problem and one distinct outcome.
3. Replace generic lists with homeowner examples.
4. Rewrite canonical React copy and static SEO fallbacks together.
5. Retire deprecated Home Health and operational-memory pages or redirect them.

Validation gate:

* Adjacent pages do not reuse the same lead sentence or closing promise.
* Metadata is useful and keyword-aware without repeating the same feature list.
* Every product claim is currently verifiable.

### Phase 4: Establish copy regression checks

Add a lightweight repository check for customer-facing uses of:

* Home Health
* Property Health
* Operational memory
* Lifecycle status
* Maintenance workflow
* Documentation score
* Property record completeness
* Firebase Console

The check should allow documented internal-code and ADR exceptions. It should
flag customer copy rather than banning legitimate implementation terminology.

## Definition of done for the full cleanup

* Customer copy follows `UX_LANGUAGE_GUIDE.md`.
* Internal architecture terms do not leak into homeowner experiences.
* No generated-looking feature inventory remains on public or in-app pages.
* Repeated brand phrases are intentional and limited.
* Billing remains precise while using customer language.
* Intelligence describes saved records without grading the property or user.
* Errors explain what the customer can do next.
* Public pages, in-app text, emails, and support articles use the same approved
  vocabulary.
* Every marketing capability claim is tied to verified current behavior.
