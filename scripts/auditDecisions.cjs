#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'project-docs', 'docs');
const adrDir = path.join(rootDir, 'project-docs', 'ADR');
const reportsDir = path.join(rootDir, 'project-docs', 'reports');

function toPosix(input) {
  return input.split(path.sep).join('/');
}

function canonicalToken(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function walkMarkdownFiles(dirPath, options = {}) {
  const { excludeDirs = new Set() } = options;
  const files = [];

  if (!fs.existsSync(dirPath)) {
    return files;
  }

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (excludeDirs.has(entry.name)) {
        continue;
      }
      files.push(...walkMarkdownFiles(fullPath, options));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return '';
  }
}

const curatedDecisions = [
  {
    title: 'Remove Units From Core Experience',
    priority: 'High',
    recommendationWhenMissing: 'Ready for ADR',
    evidencePatterns: [/remove\s+units?/i, /units?\s+from\s+core/i, /temporarily\s+hidden\s+but\s+still\s+supported/i],
    adrPatterns: [/remove[-\s]+units?/i, /units?[-\s]+from[-\s]+core/i],
    contextSummary: 'The platform intentionally simplified the core homeowner workflow by centering property-level maintenance history and reducing unit-level complexity in the default experience.',
    decisionLines: [
      'Units are removed from the core homeowner flow and are not part of the primary information architecture.',
      'Property-level organization remains the first-class structure for maintenance records and guidance.',
      'Any legacy or edge-case unit support must remain isolated and must not reintroduce unit-first UX complexity.',
    ],
    reasoningLines: [
      'Most homeowners think in terms of properties and systems, not nested unit administration.',
      'Reducing structural complexity improves discoverability and mobile usability.',
      'A property-first model keeps maintenance history and recommendations easier to understand and maintain.',
    ],
    alternativesConsidered: [
      'Keep full unit-level modeling in the default UX and workflows.',
      'Make units a configurable optional mode across all surfaces.',
      'Preserve units only as migration compatibility without exposing them as a primary experience.',
    ],
    consequencesLines: [
      'Positive: clearer property-centric UX and lower cognitive overhead.',
      'Positive: reduced complexity in data interpretation and recommendations.',
      'Cost: some multi-unit edge workflows need explicit compatibility handling.',
    ],
    nonGoals: [
      'Reintroducing unit-first navigation as a default product pattern.',
      'Duplicating ownership models between property and unit hierarchies.',
      'Expanding complexity beyond property maintenance recordkeeping needs.',
    ],
  },
  {
    title: 'Property Intelligence Architecture',
    priority: 'High',
    recommendationWhenMissing: 'Ready for ADR',
    evidencePatterns: [/property\s+intelligence/i, /derived\s+guidance\s+system/i, /recommendation\s+engine/i],
    adrPatterns: [/property\s+intelligence/i, /recommendation\s+engine/i],
    contextSummary: 'Property Intelligence is central to guidance and recommendations, but core records remain owned by the primary product data model.',
    decisionLines: [
      'Property Intelligence is implemented as a derived guidance layer rather than a canonical data source.',
      'It may analyze properties, maintenance events, appliances and systems, documents, and tasks to produce recommendations and insights.',
      'It must not become a competing source of truth for property or maintenance records.',
    ],
    reasoningLines: [
      'Users often have enough data for meaningful guidance but need help identifying gaps and next actions.',
      'Derived intelligence enables recommendation evolution without rewriting foundational records.',
      'Separation of ownership keeps recommendations explainable and auditable.',
    ],
    alternativesConsidered: [
      'Make Property Intelligence a first-class ownership model with independent canonical records.',
      'Limit guidance to static checklists without derived analysis.',
      'Delegate all intelligence to ad hoc, opaque outputs without traceable data boundaries.',
    ],
    consequencesLines: [
      'Positive: preserves clear ownership boundaries between records and guidance.',
      'Positive: enables iterative improvement of recommendations over time.',
      'Cost: requires deliberate synchronization discipline between data model and intelligence logic.',
    ],
    nonGoals: [
      'Replacing maintenance history as the historical record.',
      'Introducing a second canonical property data model.',
      'Turning Property Intelligence into an unconstrained chatbot-style interface.',
    ],
  },
  {
    title: 'Maintenance Events As Historical Source Of Truth',
    priority: 'High',
    recommendationWhenMissing: 'Ready for ADR',
    evidencePatterns: [/maintenance\s+events?/i, /historical\s+source\s+of\s+truth/i, /maintenance\s+history\s+migration/i],
    adrPatterns: [/maintenance\s+events?/i, /historical\s+source\s+of\s+truth/i],
    contextSummary: 'The data model evolved to preserve long-term maintenance history in event records, with downstream guidance derived from those events.',
    decisionLines: [
      'Maintenance Events are the historical source of truth for maintenance operations and timelines.',
      'Operational history must be recorded in events, not fragmented across derived summaries or transient UI fields.',
      'Any derived views must reference or aggregate events without taking ownership of the historical record.',
    ],
    reasoningLines: [
      'A stable event timeline supports auditability, troubleshooting, and recommendation quality.',
      'Centralized historical records reduce drift and contradictory interpretations.',
      'Derived systems can evolve safely when historical ownership boundaries are explicit.',
    ],
    alternativesConsidered: [
      'Keep maintenance history distributed across multiple collections and read models.',
      'Store only the latest maintenance state without event-level history.',
      'Let intelligence summaries become the practical history store.',
    ],
    consequencesLines: [
      'Positive: stronger traceability and consistency for maintenance records.',
      'Positive: clearer input data for recommendations and overdue logic.',
      'Cost: migrations and backfills are required when consolidating legacy history.',
    ],
    nonGoals: [
      'Replacing event history with snapshot-only records.',
      'Storing conflicting historical narratives in parallel collections.',
      'Treating derived recommendation data as canonical history.',
    ],
  },
  {
    title: 'Property Setup Assistant',
    priority: 'High',
    recommendationWhenMissing: 'Needs More Review',
    evidencePatterns: [/property\s+setup\s+assistant/i, /setup\s+assistant/i],
    adrPatterns: [/property\s+setup\s+assistant/i],
  },
  {
    title: 'Production-Only Deployment Strategy',
    priority: 'High',
    recommendationWhenMissing: 'Ready for ADR',
    evidencePatterns: [/production-only/i, /deploys?\s+directly\s+to\s+the\s+production/i, /separate\s+beta\s+environment/i],
    adrPatterns: [/deployment/i, /environment\s+strategy/i, /staging/i],
    contextSummary: 'Current operations deploy directly to production while maintaining explicit safeguards and testing discipline.',
    decisionLines: [
      'Maintley currently uses a production-only deployment path for primary releases.',
      'Release confidence is built through automated validation, targeted testing, and explicit rollout discipline rather than a permanent beta tier.',
      'Any future staging/beta reintroduction must be deliberate and documented as a separate decision update.',
    ],
    reasoningLines: [
      'A single deployment track reduces environment divergence and operational overhead.',
      'Current team and workflow constraints favor reliable production hardening over multi-environment complexity.',
      'Clear release safeguards can mitigate risk without maintaining parallel long-lived environments.',
    ],
    alternativesConsidered: [
      'Maintain a permanent beta/staging environment for all changes.',
      'Adopt branch-per-environment promotion pipelines regardless of operational cost.',
      'Use ad hoc environment cloning without a defined lifecycle strategy.',
    ],
    consequencesLines: [
      'Positive: reduced infrastructure and process overhead.',
      'Positive: fewer environment drift issues between staging and production.',
      'Cost: stricter quality gates are required before production releases.',
    ],
    nonGoals: [
      'Treating production-only as a license to skip pre-release validation.',
      'Maintaining hidden shadow environments without documented ownership.',
      'Locking out future staged rollout options when product risk changes.',
    ],
  },
  {
    title: 'Property-First Navigation',
    priority: 'Medium',
    recommendationWhenMissing: 'Needs More Review',
    evidencePatterns: [/property-first/i, /properties\s+are\s+the\s+primary/i, /primary\s+organizational\s+unit/i],
    adrPatterns: [/property-first\s+navigation/i, /property\s+first/i],
  },
  {
    title: 'Homeowner Plus Plan Structure',
    priority: 'Medium',
    recommendationWhenMissing: 'Needs More Review',
    evidencePatterns: [/homeowner\+/i, /plan\s+feature\s+matrix/i, /subscription\s+plan/i],
    adrPatterns: [/homeowner\+/i, /plan\s+structure/i, /billing\s+model/i],
  },
  {
    title: 'Documentation System Reorganization',
    priority: 'Medium',
    recommendationWhenMissing: 'Probably Not Needed',
    evidencePatterns: [/project-docs\//i, /documentation\s+is\s+organized/i, /ADR\//i, /reports\//i],
    adrPatterns: [/documentation\s+reorganization/i, /docs\s+structure/i],
  },
];

function getRecommendation(decision) {
  if (decision.recommendationWhenMissing) {
    return decision.recommendationWhenMissing;
  }

  if (decision.priority === 'High') {
    return 'Ready for ADR';
  }

  if (decision.priority === 'Medium') {
    return 'Needs More Review';
  }

  return 'Probably Not Needed';
}

function gatherEvidence(docsFiles, patterns) {
  const evidence = [];

  for (const filePath of docsFiles) {
    const text = readText(filePath);
    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (patterns.some((pattern) => pattern.test(line))) {
        evidence.push({
          file: toPosix(path.relative(rootDir, filePath)),
          line: i + 1,
          text: line.trim(),
        });
        if (evidence.length >= 6) {
          return evidence;
        }
      }
    }
  }

  return evidence;
}

function findMatchingAdr(adrFiles, patterns) {
  const matches = [];

  for (const filePath of adrFiles) {
    const rel = toPosix(path.relative(rootDir, filePath));
    const fileName = path.basename(filePath);
    const text = readText(filePath);
    const header = text.split(/\r?\n/).slice(0, 30).join('\n');

    const matched = patterns.some(
      (pattern) => pattern.test(fileName) || pattern.test(header) || pattern.test(text),
    );

    if (matched) {
      matches.push(rel);
    }
  }

  return matches;
}

function collectPotentialUndocumentedHeadings(docsFiles, adrFiles) {
  const keywords = /(architecture|strategy|source of truth|data model|deployment|navigation|plan|assistant|intelligence)/i;
  const adrText = adrFiles.map((f) => `${path.basename(f)}\n${readText(f)}`).join('\n').toLowerCase();
  const candidates = [];

  for (const filePath of docsFiles) {
    const rel = toPosix(path.relative(rootDir, filePath));
    const lines = readText(filePath).split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line.startsWith('#')) {
        continue;
      }
      const heading = line.replace(/^#+\s*/, '').trim();
      if (!keywords.test(heading)) {
        continue;
      }
      const normalized = heading.toLowerCase();
      if (!adrText.includes(normalized)) {
        candidates.push({ file: rel, line: i + 1, heading });
      }
    }
  }

  return candidates.slice(0, 20);
}

function getNextAdrNumber(adrFiles) {
  let maxNumber = 0;

  for (const filePath of adrFiles) {
    const fileName = path.basename(filePath);
    const match = fileName.match(/^(\d{4})-/);
    if (!match) {
      continue;
    }
    const parsed = Number.parseInt(match[1], 10);
    if (!Number.isNaN(parsed) && parsed > maxNumber) {
      maxNumber = parsed;
    }
  }

  return maxNumber + 1;
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function collectRejectedDecisionTokens() {
  const tokens = new Set();
  if (!fs.existsSync(reportsDir)) {
    return tokens;
  }

  const reportDirs = fs
    .readdirSync(reportsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^decision-audit-\d{4}-\d{2}$/.test(entry.name));

  for (const entry of reportDirs) {
    const rejectedDir = path.join(reportsDir, entry.name, 'rejected');
    if (!fs.existsSync(rejectedDir)) {
      continue;
    }

    for (const fileEntry of fs.readdirSync(rejectedDir, { withFileTypes: true })) {
      if (!fileEntry.isFile() || !fileEntry.name.toLowerCase().endsWith('.md')) {
        continue;
      }

      const fullPath = path.join(rejectedDir, fileEntry.name);
      const text = readText(fullPath);
      const titleMatch = text.match(/^Title:\s*(.+)$/im);
      if (titleMatch) {
        tokens.add(canonicalToken(titleMatch[1]));
      }

      const slugTitle = fileEntry.name
        .replace(/^\d{4}-/, '')
        .replace(/\.md$/i, '')
        .replace(/-/g, ' ');
      tokens.add(canonicalToken(slugTitle));
    }
  }

  return tokens;
}

function getPendingCandidatesByAge() {
  const pending = [];

  if (!fs.existsSync(reportsDir)) {
    return pending;
  }

  const reportDirs = fs
    .readdirSync(reportsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^decision-audit-\d{4}-\d{2}$/.test(entry.name))
    .sort((a, b) => b.name.localeCompare(a.name)); // Latest first

  for (const entry of reportDirs) {
    const approvedDir = path.join(reportsDir, entry.name, 'approved');
    if (!fs.existsSync(approvedDir)) {
      continue;
    }

    for (const fileEntry of fs.readdirSync(approvedDir, { withFileTypes: true })) {
      if (!fileEntry.isFile() || !fileEntry.name.toLowerCase().endsWith('.md')) {
        continue;
      }

      const fullPath = path.join(approvedDir, fileEntry.name);
      const text = readText(fullPath);
      const titleMatch = text.match(/^Title:\s*(.+)$/im);
      const createdMatch = text.match(/^Created:\s*(.+)$/im);
      const lastReviewedMatch = text.match(/^Last Reviewed:\s*(.+)$/im);

      if (titleMatch) {
        pending.push({
          title: titleMatch[1].trim(),
          fileName: fileEntry.name,
          created: createdMatch ? createdMatch[1].trim() : 'unknown',
          lastReviewed: lastReviewedMatch ? lastReviewedMatch[1].trim() : 'not reviewed',
          audit: entry.name,
        });
      }
    }
  }

  return pending;
}

function formatDaysAgo(dateStr) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const daysAgo = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (daysAgo === 0) return 'today';
    if (daysAgo === 1) return '1 day ago';
    if (daysAgo < 30) return `${daysAgo} days ago`;
    const monthsAgo = Math.floor(daysAgo / 30);
    if (monthsAgo === 1) return '1 month ago';
    if (monthsAgo < 12) return `${monthsAgo} months ago`;
    const yearsAgo = Math.floor(daysAgo / 365);
    return yearsAgo === 1 ? '1 year ago' : `${yearsAgo} years ago`;
  } catch {
    return dateStr;
  }
}

function buildDraftContent(decision, adrId, dateOnly) {
  const evidence = decision.evidence || [];
  const decisionIdSuggestion = `${adrId}-${slugify(decision.title)}`;

  const contextBullets = evidence.length > 0
    ? evidence.map((item) => `- ${item.file}:${item.line} - ${item.text}`)
    : ['- Decision appears in current documentation but no direct ADR candidate was matched.'];

  const relatedDocs = evidence.length > 0
    ? evidence.map((item) => `- ${item.file}:${item.line}`)
    : ['- project-docs/docs/README.md'];

  const decisionLines = decision.decisionLines || [
    `${decision.title} is a maintained platform decision and should be implemented as a stable boundary in product and architecture work.`,
    'Implementations should preserve consistency with existing data ownership and user-facing simplicity goals.',
  ];

  const reasoningLines = decision.reasoningLines || [
    'This direction reduces long-term platform complexity and preserves explainable behavior.',
    'Explicit decision boundaries reduce regression risk during refactors and feature expansion.',
  ];

  const alternativesConsidered = decision.alternativesConsidered || [
    'Keep the existing behavior implicit in scattered documentation without an explicit ADR decision boundary.',
    'Adopt a broader or more complex variant of this capability without clear ownership limits.',
  ];

  const consequencesLines = decision.consequencesLines || [
    'Positive: clearer decision boundaries for future contributors.',
    'Cost: requires ongoing ADR maintenance when strategic direction changes.',
  ];

  const nonGoals = decision.nonGoals || [
    'Expanding this decision into unrelated product scope.',
    'Creating competing ownership models or duplicate sources of truth.',
  ];

  const assumptions = [];
  if (evidence.length < 3) {
    assumptions.push('Evidence coverage for this draft is limited in the current scan and should be validated during review.');
  }
  if (!decision.contextSummary) {
    assumptions.push('Context summary is inferred from evidence snippets and may require contributor refinement.');
  }

  const lines = [];
  lines.push('# ADR Candidate');
  lines.push('');
  lines.push('Status: Proposed');
  lines.push(`Created: ${dateOnly}`);
  lines.push('');
  lines.push('Generated By: ADR Gap Audit');
  lines.push(`Generated: ${dateOnly.slice(0, 7)}`);
  lines.push('');
  lines.push('Decision ID Suggestion:');
  lines.push(decisionIdSuggestion);
  lines.push('');
  lines.push(`Title: ${decision.title}`);
  lines.push('');
  lines.push(`Date: ${dateOnly}`);
  lines.push('Source: Automated ADR candidate from decision audit (report artifact only)');
  lines.push('');
  lines.push('## Context');
  lines.push('');
  lines.push(decision.contextSummary || `This proposed ADR was generated from current documentation evidence for "${decision.title}" where no corresponding ADR candidate was detected in project-docs/ADR.`);
  lines.push('');
  lines.push('Evidence:');
  lines.push(...contextBullets);
  lines.push('');
  lines.push('## Decision');
  lines.push('');
  lines.push(...decisionLines.map((line) => `- ${line}`));
  lines.push('');
  lines.push('## Reasoning');
  lines.push('');
  lines.push(...reasoningLines.map((line) => `- ${line}`));
  lines.push('');
  lines.push('## Alternatives Considered');
  lines.push('');
  lines.push(...alternativesConsidered.map((line) => `- ${line}`));
  lines.push('');
  lines.push('## Consequences');
  lines.push('');
  lines.push(...consequencesLines.map((line) => `- ${line}`));
  lines.push('');
  lines.push('## Non-Goals');
  lines.push('');
  lines.push(...nonGoals.map((line) => `- ${line}`));
  lines.push('');
  lines.push('## Related Documentation');
  lines.push('');
  lines.push(...relatedDocs);
  if (assumptions.length > 0) {
    lines.push('');
    lines.push('## Assumptions');
    lines.push('');
    lines.push(...assumptions.map((line) => `- ${line}`));
  }
  lines.push('');
  lines.push('## Open Questions');
  lines.push('');
  lines.push('- What exact scope boundaries should this ADR define?');
  lines.push('- What alternatives were considered and intentionally rejected?');
  lines.push('- What implementation constraints and non-goals should be explicit?');
  lines.push('- What follow-up documentation must remain synchronized with this ADR?');
  lines.push('');
  lines.push('## Promotion');
  lines.push('');
  lines.push('- When promoted into project-docs/ADR, change Status: Proposed to Status: Accepted.');

  return `${lines.join('\n')}\n`;
}

function buildFutureConsiderations(decisionTitle) {
  const normalizedTitle = decisionTitle.toLowerCase();

  if (normalizedTitle.includes('property intelligence')) {
    return [
      'Additional recommendation sources',
      'Portfolio-level intelligence',
      'Confidence scoring',
    ];
  }

  if (normalizedTitle.includes('maintenance events')) {
    return [
      'Additional derived timeline views',
      'Import and migration support for historical events',
      'Broader reporting and export needs',
    ];
  }

  if (normalizedTitle.includes('deployment strategy')) {
    return [
      'Additional release gating criteria',
      'Rollback and recovery playbooks',
      'Expanded environment validation checks',
    ];
  }

  return [];
}

function buildPropertyIntelligenceReviewDraft(candidateContent, decision) {
  const decisionIdMatch = candidateContent.match(/^Decision ID Suggestion:\s*(.+)$/im);
  const dateMatch = candidateContent.match(/^Date:\s*(.+)$/im);
  const relatedDocs = (candidateContent.match(/^\- project-docs\/docs\/Architecture\/DATA_MODEL\.md:[0-9]+$/gim) || []);
  const futureConsiderations = buildFutureConsiderations(decision.title);

  const lines = [];
  lines.push('# ADR Candidate');
  lines.push('');
  lines.push('Status: Proposed');
  lines.push('Review Status: Ready for Human Review');
  lines.push('');
  lines.push('Generated By: ADR Draft Enhancement');
  lines.push('Generated: 2026-06');
  lines.push('');
  lines.push('Decision ID Suggestion:');
  lines.push(decisionIdMatch ? decisionIdMatch[1].trim() : '0006-property-intelligence-architecture');
  lines.push('');
  lines.push(`Title: ${decision.title}`);
  lines.push('');
  lines.push(`Date: ${dateMatch ? dateMatch[1].trim() : '2026-06-17'}`);
  lines.push('Source: Draft enhanced from current documentation evidence for human review.');
  lines.push('');
  lines.push('## Context');
  lines.push('');
  lines.push('Maintley provides recommendations, insights, and setup guidance through a system called Property Intelligence.');
  lines.push('');
  lines.push('As the platform evolved, a distinction emerged between:');
  lines.push('');
  lines.push('- Records that describe a property');
  lines.push('- Guidance generated from those records');
  lines.push('');
  lines.push('The platform requires a clear ownership boundary between those responsibilities.');
  lines.push('');
  lines.push('## Decision');
  lines.push('');
  lines.push('Property Intelligence shall operate as a derived guidance layer.');
  lines.push('');
  lines.push('Property Intelligence may:');
  lines.push('');
  lines.push('- Analyze properties');
  lines.push('- Analyze maintenance events');
  lines.push('- Analyze appliances and systems');
  lines.push('- Analyze tasks');
  lines.push('- Analyze documents');
  lines.push('');
  lines.push('Property Intelligence may generate:');
  lines.push('');
  lines.push('- Recommendations');
  lines.push('- Insights');
  lines.push('- Setup guidance');
  lines.push('- Missing information notices');
  lines.push('');
  lines.push('Property Intelligence shall not own canonical property data.');
  lines.push('');
  lines.push('## Reasoning');
  lines.push('');
  lines.push('Users frequently possess enough information to identify maintenance risks, documentation gaps, and upcoming work, but often lack the expertise or time to interpret that information.');
  lines.push('');
  lines.push('Maintley should help users understand their properties without requiring them to become maintenance experts.');
  lines.push('');
  lines.push('Derived guidance lets the platform improve recommendations without rewriting foundational records.');
  lines.push('');
  lines.push('Clear ownership boundaries keep recommendations explainable and auditable.');
  lines.push('');
  lines.push('## Alternatives Considered');
  lines.push('');
  lines.push('- Make Property Intelligence a first-class ownership model with independent canonical records.');
  lines.push('- Limit guidance to static checklists without derived analysis.');
  lines.push('- Delegate all intelligence to ad hoc, opaque outputs without traceable data boundaries.');
  lines.push('');
  lines.push('## Consequences');
  lines.push('');
  lines.push('- Positive: preserves clear ownership boundaries between records and guidance.');
  lines.push('- Positive: enables iterative improvement of recommendations over time.');
  lines.push('- Cost: requires deliberate synchronization discipline between data model and intelligence logic.');
  lines.push('');
  lines.push('## Non-Goals');
  lines.push('');
  lines.push('- Replacing maintenance history as the historical record.');
  lines.push('- Introducing a second canonical property data model.');
  lines.push('- Turning Property Intelligence into an unconstrained chatbot-style interface.');
  lines.push('');
  lines.push('## Related Documentation');
  lines.push('');
  if (relatedDocs.length > 0) {
    lines.push(...relatedDocs);
  } else {
    lines.push('- project-docs/docs/Architecture/DATA_MODEL.md');
  }
  if (futureConsiderations.length > 0) {
    lines.push('');
    lines.push('## Future Considerations');
    lines.push('');
    for (const item of futureConsiderations) {
      lines.push(`- ${item}`);
    }
  }
  lines.push('');
  lines.push('## Promotion');
  lines.push('');
  lines.push('- When promoted into project-docs/ADR, change Status: Proposed to Status: Accepted.');

  return `${lines.join('\n')}\n`;
}

function enhanceDraftContent(candidateContent, decision) {
  if (decision.title === 'Property Intelligence Architecture') {
    return buildPropertyIntelligenceReviewDraft(candidateContent, decision);
  }

  const lines = candidateContent.split(/\r?\n/);
  const output = [];
  let skippingEvidence = false;
  let removingOpenQuestions = false;

  for (const line of lines) {
    if (skippingEvidence) {
      if (line.startsWith('## ')) {
        skippingEvidence = false;
      } else {
        continue;
      }
    }

    if (removingOpenQuestions) {
      if (line.startsWith('## ')) {
        removingOpenQuestions = false;
      } else {
        continue;
      }
    }

    if (line === 'Generated By: ADR Gap Audit') {
      output.push('Generated By: ADR Draft Enhancement');
      continue;
    }

    if (line === 'Source: Automated ADR candidate from decision audit (report artifact only)') {
      output.push('Source: Draft enhanced from current documentation evidence for human review.');
      continue;
    }

    if (line.startsWith('This proposed ADR was generated from current documentation evidence for ')) {
      output.push(`This draft is synthesized from current documentation evidence for "${decision.title}" and is ready for human review.`);
      continue;
    }

    if (line === 'Evidence:') {
      skippingEvidence = true;
      continue;
    }

    if (line === '## Open Questions') {
      const futureConsiderations = buildFutureConsiderations(decision.title);
      if (futureConsiderations.length > 0) {
        output.push('## Future Considerations');
        output.push('');
        for (const item of futureConsiderations) {
          output.push(`- ${item}`);
        }
        removingOpenQuestions = true;
      }
      continue;
    }

    output.push(line);
  }

  const statusIndex = output.findIndex((line) => line.startsWith('Status: Proposed'));
  if (statusIndex >= 0 && !output.includes('Review Status: Ready for Human Review')) {
    output.splice(statusIndex + 1, 0, 'Review Status: Ready for Human Review');
  }

  return `${output.join('\n').trimEnd()}\n`;
}

function writeReviewDraftArtifacts(decisionAuditDir, candidateEntries) {
  const reviewsDir = path.join(decisionAuditDir, 'reviews');
  const approvedDir = path.join(decisionAuditDir, 'approved');
  fs.mkdirSync(reviewsDir, { recursive: true });
  fs.mkdirSync(approvedDir, { recursive: true });

  const reviewFiles = [];
  const approvedFiles = [];

  for (const candidate of candidateEntries) {
    const reviewName = candidate.fileName.replace(/-draft\.md$/i, '-review.md');
    const reviewPath = path.join(reviewsDir, reviewName);
    const approvedPath = path.join(approvedDir, reviewName);
    const sourceContent = readText(candidate.absolutePath);
    if (!sourceContent) {
      continue;
    }

    const titleMatch = sourceContent.match(/^Title:\s*(.+)$/im);
    const decision = {
      title: titleMatch ? titleMatch[1].trim() : candidate.fileName.replace(/-draft\.md$/i, ''),
    };

    const enhanced = enhanceDraftContent(sourceContent, decision);
    fs.writeFileSync(reviewPath, enhanced, 'utf8');
    fs.writeFileSync(approvedPath, enhanced, 'utf8');
    reviewFiles.push({
      fileName: reviewName,
      absolutePath: reviewPath,
      title: decision.title,
      relPath: toPosix(path.relative(rootDir, reviewPath)),
    });
    approvedFiles.push({
      fileName: reviewName,
      absolutePath: approvedPath,
      title: decision.title,
      relPath: toPosix(path.relative(rootDir, approvedPath)),
    });
  }

  return { reviewsDir, approvedDir, reviewFiles, approvedFiles };
}

function parseLegacyCheckedQueueTokens(text) {
  const tokens = new Set();
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*[-*]?\s*\[x\]\s*(.+?)\s*$/i);
    if (match) {
      tokens.add(match[1].trim().toLowerCase());
    }
  }

  return tokens;
}

function writePromotionLedger(candidateDir, yearMonth, highPriorityMissing, missingDecisions, drafts) {
  const ledgerPath = path.join(candidateDir, 'promoted.md');

  if (fs.existsSync(ledgerPath)) {
    const existing = readText(ledgerPath);
    if (existing.includes('# ADR Promotion Decisions')) {
      return toPosix(path.relative(rootDir, ledgerPath));
    }

    const checkedTokens = parseLegacyCheckedQueueTokens(existing);
    const acceptedLines = [];

    for (const draft of drafts) {
      const checked = checkedTokens.has(draft.decisionIdSuggestion.toLowerCase()) || checkedTokens.has(draft.adrId.toLowerCase());
      const marker = checked ? '[x]' : '[ ]';
      acceptedLines.push(`- ${marker} ${draft.adrId} ${draft.decision}`);
    }

    const deferred = missingDecisions
      .filter((item) => !highPriorityMissing.some((hp) => hp.title === item.title))
      .map((item) => {
        const reason = item.recommendation === 'Probably Not Needed'
          ? 'Likely process-oriented or already represented indirectly; confirm ADR value before promotion.'
          : 'Decision still evolving and requires additional architectural/product clarification.';
        return { title: item.title, reason };
      });

    const lines = [];
    lines.push('# ADR Promotion Decisions');
    lines.push('');
    lines.push(`Generated: ${yearMonth}`);
    lines.push('');
    lines.push('## Accepted');
    lines.push('');
    if (acceptedLines.length === 0) {
      lines.push('None');
    } else {
      lines.push(...acceptedLines);
    }
    lines.push('');
    lines.push('## Deferred');
    lines.push('');
    if (deferred.length === 0) {
      lines.push('None');
    } else {
      for (const item of deferred) {
        lines.push(`- [ ] ${item.title}`);
        lines.push(`  Reason: ${item.reason}`);
        lines.push('');
      }
      if (lines[lines.length - 1] === '') {
        lines.pop();
      }
    }
    lines.push('');
    lines.push('## Rejected');
    lines.push('');
    lines.push('None');

    fs.writeFileSync(ledgerPath, `${lines.join('\n')}\n`, 'utf8');
    return toPosix(path.relative(rootDir, ledgerPath));
  }

  const lines = [];
  lines.push('# ADR Promotion Decisions');
  lines.push('');
  lines.push(`Generated: ${yearMonth}`);
  lines.push('');
  lines.push('## Accepted');
  lines.push('');
  if (drafts.length === 0) {
    lines.push('None');
  } else {
    for (const draft of drafts) {
      lines.push(`- [ ] ${draft.adrId} ${draft.decision}`);
    }
  }
  lines.push('');
  lines.push('## Deferred');
  lines.push('');

  const deferred = missingDecisions
    .filter((item) => !highPriorityMissing.some((hp) => hp.title === item.title));
  if (deferred.length === 0) {
    lines.push('None');
  } else {
    for (const item of deferred) {
      const reason = item.recommendation === 'Probably Not Needed'
        ? 'Likely process-oriented or already represented indirectly; confirm ADR value before promotion.'
        : 'Decision still evolving and requires additional architectural/product clarification.';
      lines.push(`- [ ] ${item.title}`);
      lines.push(`  Reason: ${reason}`);
      lines.push('');
    }
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
  }

  lines.push('');
  lines.push('## Rejected');
  lines.push('');
  lines.push('None');

  fs.writeFileSync(ledgerPath, `${lines.join('\n')}\n`, 'utf8');
  return toPosix(path.relative(rootDir, ledgerPath));
}

function writeAdrDraftArtifacts(decisionAuditDir, highPriorityMissing, missingDecisions, yearMonth, now, adrFiles) {
  const candidatesDir = path.join(decisionAuditDir, 'candidates');
  fs.mkdirSync(decisionAuditDir, { recursive: true });
  fs.mkdirSync(candidatesDir, { recursive: true });

  const dateOnly = now.toISOString().slice(0, 10);
  let nextNumber = getNextAdrNumber(adrFiles);
  const drafts = [];

  for (const decision of highPriorityMissing) {
    const adrId = String(nextNumber).padStart(4, '0');
    const slug = slugify(decision.title);
    const fileName = `${adrId}-${slug}-draft.md`;
    const fullPath = path.join(candidatesDir, fileName);
    const content = buildDraftContent(decision, adrId, dateOnly);
    fs.writeFileSync(fullPath, content, 'utf8');

    drafts.push({
      decision: decision.title,
      adrId,
      decisionIdSuggestion: `${adrId}-${slug}`,
      fileName,
      relPath: toPosix(path.relative(rootDir, fullPath)),
    });

    nextNumber += 1;
  }

  const summaryLines = [];
  summaryLines.push(`# ADR Candidate Drafts - ${yearMonth}`);
  summaryLines.push('');
  summaryLines.push(`Generated: ${now.toISOString()}`);
  summaryLines.push('Mode: report artifact generation only (no changes to project-docs/ADR)');
  summaryLines.push('');
  summaryLines.push('Workflow Phases:');
  summaryLines.push('Phase 1: Find missing ADRs');
  summaryLines.push('Phase 2: Generate substantive proposed ADR drafts');
  summaryLines.push('Phase 3: Human authoring');
  summaryLines.push('Phase 4: Final promotion');
  summaryLines.push('');
  summaryLines.push(`High-priority missing decisions considered: ${highPriorityMissing.length}`);
  summaryLines.push(`Draft files generated: ${drafts.length}`);
  summaryLines.push(`Candidates path: ${toPosix(path.relative(rootDir, candidatesDir))}`);
  summaryLines.push('Approved path: project-docs/reports/decision-audit-YYYY-MM/approved/');
  summaryLines.push('');
  summaryLines.push('## Generated Drafts');
  summaryLines.push('');

  if (drafts.length === 0) {
    summaryLines.push('- No high-priority missing ADR candidates were detected in this run.');
  } else {
    for (const draft of drafts) {
      summaryLines.push(`- ${draft.adrId}: ${draft.decision}`);
      summaryLines.push(`  - Decision ID Suggestion: ${draft.decisionIdSuggestion}`);
      summaryLines.push(`  - ${draft.relPath}`);
    }
  }

  const recommendationByTitle = new Map();
  for (const decision of missingDecisions) {
    recommendationByTitle.set(decision.title, decision.recommendation || getRecommendation(decision));
  }

  const ready = [];
  const needsReview = [];
  const probablyNotNeeded = [];
  for (const decision of missingDecisions) {
    const recommendation = recommendationByTitle.get(decision.title) || getRecommendation(decision);
    const draft = drafts.find((item) => item.decision === decision.title);
    const prefix = draft ? `${draft.adrId} ` : '';
    const entry = `${prefix}${decision.title}`;

    if (recommendation === 'Ready for ADR') {
      ready.push(entry);
    } else if (recommendation === 'Probably Not Needed') {
      probablyNotNeeded.push(entry);
    } else {
      needsReview.push(entry);
    }
  }

  summaryLines.push('');
  summaryLines.push('## Recommendation Summary');
  summaryLines.push('');
  summaryLines.push('Ready for ADR');
  summaryLines.push('-------------');
  if (ready.length === 0) {
    summaryLines.push('None');
  } else {
    for (const item of ready) {
      summaryLines.push(item);
    }
  }
  summaryLines.push('');
  summaryLines.push('Needs More Review');
  summaryLines.push('-----------------');
  if (needsReview.length === 0) {
    summaryLines.push('None');
  } else {
    for (const item of needsReview) {
      summaryLines.push(item);
    }
  }
  summaryLines.push('');
  summaryLines.push('Probably Not Needed');
  summaryLines.push('-------------------');
  if (probablyNotNeeded.length === 0) {
    summaryLines.push('None');
  } else {
    for (const item of probablyNotNeeded) {
      summaryLines.push(item);
    }
  }

  summaryLines.push('');
  summaryLines.push('## Review Instructions');
  summaryLines.push('');
  summaryLines.push('1. Run yarn adr:author to create the approved review draft.');
  summaryLines.push('2. Review and edit the approved draft directly.');
  summaryLines.push('3. Run yarn adr:promote to write the final ADR into project-docs/ADR.');

  const summaryPath = path.join(decisionAuditDir, 'SUMMARY.md');
  fs.writeFileSync(summaryPath, `${summaryLines.join('\n')}\n`, 'utf8');

  return {
    decisionAuditDir: toPosix(path.relative(rootDir, decisionAuditDir)),
    candidatesDir: toPosix(path.relative(rootDir, candidatesDir)),
    summaryPath: toPosix(path.relative(rootDir, summaryPath)),
    drafts,
  };
}

function generateReport() {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const decisionAuditDir = path.join(reportsDir, `decision-audit-${yearMonth}`);
  const reportPath = path.join(decisionAuditDir, 'audit.md');

  const docsFiles = walkMarkdownFiles(docsDir, { excludeDirs: new Set(['Archive']) });
  const adrFiles = walkMarkdownFiles(adrDir);

  const evaluated = curatedDecisions.map((decision) => {
    const evidence = gatherEvidence(docsFiles, decision.evidencePatterns);
    const adrMatches = findMatchingAdr(adrFiles, decision.adrPatterns);

    return {
      ...decision,
      evidence,
      adrMatches,
      status: adrMatches.length > 0 ? 'ADR Candidate Found' : 'Likely Missing ADR',
      recommendation: getRecommendation(decision),
    };
  });

  const rejectedTokens = collectRejectedDecisionTokens();
  const isRejectedDecision = (decision) => rejectedTokens.has(canonicalToken(decision.title));

  const missing = evaluated.filter((d) => d.status === 'Likely Missing ADR' && !isRejectedDecision(d));
  const rejectedSuppressed = evaluated.filter((d) => d.status === 'Likely Missing ADR' && isRejectedDecision(d));
  const highPriorityMissing = missing.filter((d) => d.priority === 'High');
  const mediumPriorityMissing = missing.filter((d) => d.priority === 'Medium');
  const covered = evaluated.filter((d) => d.status === 'ADR Candidate Found');

  const potentialUndocumentedHeadings = collectPotentialUndocumentedHeadings(docsFiles, adrFiles);
  const draftArtifacts = writeAdrDraftArtifacts(decisionAuditDir, highPriorityMissing, missing, yearMonth, now, adrFiles);

  const lines = [];
  lines.push(`# Decision ADR Gap Audit - ${yearMonth}`);
  lines.push('');
  lines.push(`Generated: ${now.toISOString()}`);
  lines.push('Mode: report-only (no ADR creation or file changes)');
  lines.push('');
  lines.push('Audit prompt:');
  lines.push('Review project-docs/docs and project-docs/ADR.');
  lines.push('Identify significant architectural, product, deployment, data model, or UX decisions that are documented but do not appear to have corresponding ADRs.');
  lines.push('Generate a report only. Do not modify files.');
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`- Docs files scanned (excluding Archive): ${docsFiles.length}`);
  lines.push(`- ADR files scanned: ${adrFiles.length}`);
  lines.push(`- Curated decisions evaluated: ${evaluated.length}`);
  lines.push(`- High priority likely missing ADR: ${highPriorityMissing.length}`);
  lines.push(`- Medium priority likely missing ADR: ${mediumPriorityMissing.length}`);
  lines.push(`- Decisions with ADR candidate found: ${covered.length}`);
  lines.push(`- ADR candidate drafts generated: ${draftArtifacts.drafts.length}`);
  lines.push(`- Previously rejected decisions suppressed: ${rejectedSuppressed.length}`);
  lines.push(`- Decision audit artifacts path: ${draftArtifacts.decisionAuditDir}`);
  lines.push('');

  lines.push('## High Priority');
  lines.push('');
  if (highPriorityMissing.length === 0) {
    lines.push('- None flagged as likely missing ADRs by this audit run.');
  } else {
    for (const item of highPriorityMissing) {
      lines.push(`- ${item.title}`);
    }
  }
  lines.push('');

  lines.push('## Previously Rejected (Suppressed)');
  lines.push('');
  if (rejectedSuppressed.length === 0) {
    lines.push('- None.');
  } else {
    for (const item of rejectedSuppressed) {
      lines.push(`- ${item.title}`);
    }
  }
  lines.push('');

  const pendingCandidates = getPendingCandidatesByAge();
  lines.push('## Pending Candidates Under Review');
  lines.push('');
  if (pendingCandidates.length === 0) {
    lines.push('- None. All candidates have been reviewed and promoted or rejected.');
  } else {
    lines.push(`Total pending: ${pendingCandidates.length}`);
    lines.push('');
    const over90days = pendingCandidates.filter((c) => {
      try {
        const days = Math.floor((new Date() - new Date(c.lastReviewed === 'not reviewed' ? c.created : c.lastReviewed)) / (1000 * 60 * 60 * 24));
        return days > 90;
      } catch {
        return false;
      }
    });
    const over30days = pendingCandidates.filter((c) => {
      try {
        const days = Math.floor((new Date() - new Date(c.lastReviewed === 'not reviewed' ? c.created : c.lastReviewed)) / (1000 * 60 * 60 * 24));
        return days > 30 && days <= 90;
      } catch {
        return false;
      }
    });

    if (over90days.length > 0) {
      lines.push('**Pending > 90 days:**');
      for (const item of over90days) {
        const lastDate = item.lastReviewed === 'not reviewed' ? item.created : item.lastReviewed;
        lines.push(`- ${item.title} (${formatDaysAgo(lastDate)})`);
      }
      lines.push('');
    }

    if (over30days.length > 0) {
      lines.push('**Pending > 30 days:**');
      for (const item of over30days) {
        const lastDate = item.lastReviewed === 'not reviewed' ? item.created : item.lastReviewed;
        lines.push(`- ${item.title} (${formatDaysAgo(lastDate)})`);
      }
      lines.push('');
    }

    const recent = pendingCandidates.filter((c) => {
      try {
        const days = Math.floor((new Date() - new Date(c.lastReviewed === 'not reviewed' ? c.created : c.lastReviewed)) / (1000 * 60 * 60 * 24));
        return days <= 30;
      } catch {
        return true;
      }
    });

    if (recent.length > 0) {
      lines.push('**Recently created/reviewed:**');
      for (const item of recent) {
        const lastDate = item.lastReviewed === 'not reviewed' ? item.created : item.lastReviewed;
        lines.push(`- ${item.title} (${formatDaysAgo(lastDate)})`);
      }
      lines.push('');
    }
  }
  lines.push('');
  lines.push('');
  if (mediumPriorityMissing.length === 0) {
    lines.push('- None flagged as likely missing ADRs by this audit run.');
  } else {
    for (const item of mediumPriorityMissing) {
      lines.push(`- ${item.title}`);
    }
  }
  lines.push('');

  lines.push('## Decisions With ADR Candidate Found');
  lines.push('');
  if (covered.length === 0) {
    lines.push('- None.');
  } else {
    for (const item of covered) {
      lines.push(`- ${item.title}`);
      for (const adr of item.adrMatches.slice(0, 3)) {
        lines.push(`  - ${adr}`);
      }
    }
  }
  lines.push('');

  lines.push('## Decision Evidence Table');
  lines.push('');
  lines.push('| Decision | Priority | Status | ADR Matches |');
  lines.push('|---|---|---|---|');
  for (const item of evaluated) {
    const adrText = item.adrMatches.length > 0 ? item.adrMatches.join('<br>') : 'None';
    lines.push(`| ${item.title} | ${item.priority} | ${item.status} | ${adrText} |`);
  }
  lines.push('');

  lines.push('## Evidence Snippets');
  lines.push('');
  for (const item of evaluated) {
    lines.push(`### ${item.title}`);
    if (item.evidence.length === 0) {
      lines.push('- No direct evidence line matched in this run.');
    } else {
      for (const evidence of item.evidence) {
        lines.push(`- ${evidence.file}:${evidence.line} - ${evidence.text}`);
      }
    }
    lines.push('');
  }

  lines.push('## Additional Potential Decision Headings Without ADR Text Match');
  lines.push('');
  if (potentialUndocumentedHeadings.length === 0) {
    lines.push('- None detected by heading heuristic.');
  } else {
    for (const item of potentialUndocumentedHeadings) {
      lines.push(`- ${item.file}:${item.line} - ${item.heading}`);
    }
  }
  lines.push('');

  lines.push('## Notes');
  lines.push('');
  lines.push('- This audit is heuristic and intentionally conservative.');
  lines.push('- "ADR Candidate Found" indicates a likely ADR match, not formal traceability validation.');
  lines.push(`- High-priority missing ADRs were drafted as report artifacts in ${draftArtifacts.candidatesDir}.`);
  lines.push(`- Candidate drafts were enhanced into review drafts in ${draftArtifacts.reviewsDir}.`);
  lines.push('- Draft artifacts are not official ADRs until manually reviewed and promoted.');
  lines.push('- This script does not modify project-docs/ADR.');
  lines.push('- Use this report to decide whether to add new ADRs or tighten decision-to-ADR mapping.');

  fs.mkdirSync(decisionAuditDir, { recursive: true });
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(`Decision ADR audit report generated: ${toPosix(path.relative(rootDir, reportPath))}`);
  console.log(`ADR candidate summary generated: ${draftArtifacts.summaryPath}`);
}

generateReport();
