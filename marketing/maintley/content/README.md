# Maintley Content Backlog

This folder is the working backlog for Maintley marketing, social, and founder-led content.

Use it to capture ideas, draft posts, prepare ready-to-publish copy, record published posts, and archive content that is no longer active. The backlog should support Maintley's marketing direction: homeowner-first, problem-first, outcome-first, calm, practical, and focused on long-term property records.

Maintley content should help homeowners understand why property memory matters:

- Maintenance history becomes more useful over time.
- Documents, warranties, receipts, and service records belong with the property.
- A good home record reduces reliance on memory.
- Better records help future decisions.
- Maintley is practical help, not pressure or alarm.

## Folder Workflow

- `ideas/` - Early concepts, hooks, and unfinished thoughts.
- `drafts/` - Posts with a real angle and draft copy.
- `ready/` - Finalized posts ready to publish or schedule.
- `published/` - Posts that have gone live, with dates and performance notes.
- `archived/` - Retired, outdated, duplicate, or no-longer-useful content.
- `templates/` - Reusable content templates.

## Statuses

Supported `status` values:

- `idea`
- `drafting`
- `ready`
- `published`
- `archived`

Supported `pillar` values:

- `homeowner-moment`
- `property-memory`
- `education`
- `product-update`
- `founder-journey`
- `customer-story`
- `seasonal`
- `announcement`

Supported `platforms` values:

- `maintley-facebook`
- `nextdoor`
- `dfv`
- `personal-facebook`
- `linkedin`
- `blog`

Supported `cta` values:

- `website`
- `google-play`
- `founding-member`
- `discussion`
- `none`

## Add A New Post Idea

1. Copy `templates/post-template.md`.
2. Save it in `ideas/` with a short, readable slug, such as `filter-size-reminder.md`.
3. Fill in `title`, `status`, `pillar`, likely `platforms`, and a rough idea.
4. Keep the idea practical. Start with the homeowner problem before describing Maintley.

You can also generate a ready-to-edit post from Maintley's maintained docs:

```bash
yarn content:idea
yarn content:idea -- --topic "documents belong with the property" --status ready
yarn content:idea -- --pillar property-memory --source adr --status drafting
yarn content:idea -- --count 5 --status ready
```

The generator is local and deterministic. It does not publish content, call social platforms, or use an AI API. It reads Maintley source documents, creates the next numbered markdown file, and includes source notes for review.

Default output is `status: ready` so the generated file starts closer to publishable copy. Use `--status idea` or `--status drafting` when the angle still needs more thinking.

Use `--count` to generate multiple separate content files in one run. The generator scans existing content files in `ideas/`, `drafts/`, `ready/`, `published/`, and `archived/` and skips topics with matching or highly similar titles, slugs, summaries, or hooks. If there are not enough non-duplicate topics available, the script stops with a message listing the similar existing posts it avoided.

Supported generator options:

- `--title`
- `--topic`
- `--pillar`
- `--status`
- `--platforms`
- `--cta`
- `--source`
- `--count`
- `--dry-run`

## Move A Post Through The Workflow

Move files between folders as the post matures:

1. `ideas/` - Capture the concept.
2. `drafts/` - Write the post and shape the platform angle.
3. `ready/` - Final copy is approved and ready to publish.
4. `published/` - Add `published_date` after posting.
5. `archived/` - Move content here if it is outdated, duplicated, or intentionally retired.

Update the `status` frontmatter when moving a file so the folder and status match.

## Record Performance Notes

After a post is published, add plain-language notes under `performance.notes`.

Useful notes include:

- Platform where it performed best.
- Engagement quality, not just volume.
- Comments or questions worth turning into future posts.
- Whether the post led to clicks, demos, signups, or direct conversations.
- Any wording that should be reused or avoided.

Keep performance notes concise. The goal is to learn what helps homeowners understand Maintley.

## Platform Guidance

Facebook posts should be clear, friendly, and easy to scan. Use simple homeowner situations, a practical takeaway, and a soft call to action.

Nextdoor posts should feel local, useful, and neighborly. Lead with a relatable home-maintenance problem, avoid sounding promotional, and make the post useful even if someone does not click.

DFV posts can connect Maintley to the broader Dober Family Ventures work. They may be slightly more founder-led or business-oriented, but should still explain the homeowner outcome in plain language.

Personal posts should sound like a founder sharing what they are learning. Use real observations, practical examples, and a calm point of view. Avoid pitch-heavy language; make the idea useful on its own.

## Writing Checklist

Before moving a post to `ready/`, confirm:

- The problem is clear before the product is mentioned.
- The outcome is concrete for a homeowner.
- The language is calm and practical.
- The post supports property memory, home records, maintenance history, documents, or long-term organization.
- The call to action is soft, specific, and appropriate for the platform.
