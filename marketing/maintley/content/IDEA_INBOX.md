# Maintley Marketing Idea Inbox

This file intentionally contains unfinished thinking.

Ideas may contradict one another, evolve over time, or never become features.

The purpose of this file is to preserve founder perspective, observations, and future possibilities before they are forgotten.

Treat this as inspiration, not product truth.

## Guidance for AI

Use this file as inspiration.

Do not treat it as canonical product behavior.

When this file conflicts with ADRs or product documentation, ADRs always take precedence.

Prefer preserving the founder's voice over rewriting ideas into generic marketing language.

Ideas may be incomplete and should be expanded thoughtfully while remaining grounded in the documented product.


Use this as a low-pressure dumping ground for founder views, customer observations,
outside product ideas, rough hooks, and content angles that are not ready to become
a full post yet.

The content generator reads each `##` section as a possible topic.

Keep ideas messy if needed. A heading plus a few paragraphs is enough.

When a post is generated from an inbox idea, the script copies the original idea
into the generated post and removes the used `##` section from this file. Use
`--dry-run` to preview without cleanup, or `--keep-inbox` if the idea should stay
here after generation.

Optional fields:

```text
Pillar: founder-journey
Tags: founder view, property memory, home records
Problem: The homeowner problem this idea points at.
Evidence: A real-life situation, observation, or example.
Maintley Connection: How Maintley connects to the idea without becoming too salesy.
Hook: A strong first sentence.
Graphic: founder note
CTA: discussion
Evergreen: Medium
Follow-ups: Follow-up idea one, Follow-up idea two
Confidence: confidence in implementation or usage
Related ADR: connect the related ADR number for reference and auditing
Why it matters: Homeowners don't buy software because they want another task list. They buy confidence that they'll have the right information when they need it.
```

Supported pillars:

- homeowner-moment
- property-memory
- education
- product-update
- founder-journey
- customer-story
- seasonal
- announcement
- product-philosophy

Supported CTAs:

- website
- google-play
- founding-member
- discussion
- none

To keep an idea out of generation, prefix the heading with `[skip]`, `[used]`, or
`[archived]`.

Example:

```text
## The House Should Remember

Pillar: founder-journey
Tags: founder view, property memory
Problem: Homeowners carry too much property knowledge in memory.
Evidence: A repair detail can start in a text, move to an invoice, and disappear by the next service call.
Maintley Connection: Maintley keeps useful property details connected to the home so future decisions start with context.
Hook: A house should not depend on one person's memory.
```

Add real ideas below this line.

---

## Every property tells a story.

Pillar: property-memory
Tags: property history, philosophy, long-term ownership

Problem:
Most properties slowly lose their history as owners replace systems, throw away manuals, lose receipts, and forget maintenance details.

Why it matters:
The longer someone owns a property, the more valuable that accumulated knowledge becomes.

Maintley Connection:
Maintley preserves the operational history of a property so important information stays with the property instead of disappearing over time.

Evergreen: High

---

## Home maintenance should not depend on memory.

Pillar: homeowner-moment
Tags: maintenance, memory, organization

Problem:
Many homeowners remember to complete maintenance but struggle to remember when it was done, who completed it, or where supporting documentation was saved.

Evidence:
"Didn't I just replace that filter?"

Maintley Connection:
Maintley removes the need to rely on memory by keeping maintenance records connected to the property.

Evergreen: High

---

## The value of a property record compounds over time.

Pillar: education
Tags: long-term value, records

Problem:
Most people think documentation has value only when something breaks.

Why it matters:
Every maintenance event, document, and improvement makes future decisions easier.

Maintley Connection:
Maintley becomes more valuable every year because the property's record continues to grow.

Evergreen: High

---

## A property should become easier to manage every year.

Pillar: product-philosophy
Tags: homeowner experience

Problem:
Many homeowners feel like property ownership becomes more difficult as years pass because information becomes scattered.

Maintley Connection:
Maintley is designed so every maintenance event and document makes future ownership simpler rather than more complicated.

Evergreen: High

---

## AI should explain itself.

Pillar: product-philosophy
Tags: maintley intelligence, trust

Problem:
Many AI products provide recommendations without explaining why they were made.

Maintley Connection:
Maintley Intelligence should always explain why a recommendation exists, what information influenced it, and what action the homeowner can take.

Evergreen: High


---

## Homeowners don't need more reminders.

Pillar: product-philosophy
Tags: reminders, positioning

Problem:
Most maintenance apps compete on reminders.

Why it matters:
The real challenge is organizing property knowledge, not simply remembering dates.

Maintley Connection:
Reminders support Maintley, but preserving property knowledge is the primary value.

Evergreen: High


---

## Every property has two histories.

Pillar: education
Tags: maintenance history, intelligence history

Problem:
Maintenance events and property knowledge evolve independently.

Maintley Connection:
Maintenance History records what happened.
Maintley Intelligence History records what Maintley understood at that point in time.

These should never be treated as the same timeline.

Related ADR:
0010

Evergreen: Medium


---

## The property is the center of everything.

Pillar: product-philosophy
Tags: navigation, architecture

Problem:
Many property apps organize information around tasks or lists.

Maintley Connection:
Everything begins with the property.
Systems, documents, maintenance, contractors, inspections, and intelligence all connect back to the property's record.

Evergreen: High


---