#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'project-docs', 'reports');
const adrDir = path.join(rootDir, 'project-docs', 'ADR');

function toPosix(input) {
  return input.split(path.sep).join('/');
}

function parseArgs(argv) {
  const args = { month: null, dir: null, dryRun: false, mode: 'promote' };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--month' && i + 1 < argv.length) {
      args.month = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith('--month=')) {
      args.month = arg.slice('--month='.length);
      continue;
    }
    if (arg === '--dir' && i + 1 < argv.length) {
      args.dir = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith('--dir=')) {
      args.dir = arg.slice('--dir='.length);
      continue;
    }
    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (arg === '--author') {
      args.mode = 'author';
      continue;
    }
    if (arg === '--promote') {
      args.mode = 'promote';
    }
  }

  return args;
}

function listCandidateDirectories() {
  if (!fs.existsSync(reportsDir)) {
    return [];
  }

  return fs
    .readdirSync(reportsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && (/^decision-audit-\d{4}-\d{2}$/.test(entry.name) || /^adr-candidates-\d{4}-\d{2}$/.test(entry.name)))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function resolveCandidateDirectory(args) {
  if (args.dir) {
    return path.isAbsolute(args.dir) ? args.dir : path.join(rootDir, args.dir);
  }

  if (args.month) {
    const preferred = path.join(reportsDir, `decision-audit-${args.month}`);
    if (fs.existsSync(preferred)) {
      return preferred;
    }
    return path.join(reportsDir, `adr-candidates-${args.month}`);
  }

  const dirs = listCandidateDirectories();
  if (dirs.length === 0) {
    throw new Error('No decision-audit-YYYY-MM directory found under project-docs/reports. Run yarn audit:decisions first.');
  }

  return path.join(reportsDir, dirs[dirs.length - 1]);
}

function canonicalToken(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeQueueToken(token) {
  return token.trim().replace(/\.md$/i, '').replace(/-(draft|review)$/i, '');
}

function finalAdrFileName(fileName) {
  return fileName
    .replace(/-(draft|review)\.md$/i, '.md')
    .replace(/\.md\.md$/i, '.md');
}

function readSectionedDraft(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const sections = new Map();
  let current = 'preamble';
  sections.set(current, []);

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)$/);
    if (headerMatch) {
      current = headerMatch[1].trim();
      if (!sections.has(current)) {
        sections.set(current, []);
      }
      continue;
    }

    if (!sections.has(current)) {
      sections.set(current, []);
    }
    sections.get(current).push(line);
  }

  return { text, lines, sections };
}

function findFirstMatch(text, patterns, fallback) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return fallback;
}

function readDraftTitle(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^Title:\s*(.+)$/i);
    if (match) {
      return match[1].trim();
    }
  }

  return path.basename(filePath)
    .replace(/^\d{4}-/, '')
    .replace(/-(draft|review)\.md$/i, '')
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

function readDraftStatus(content) {
  const statusMatch = content.match(/^Status:\s*(.+)$/im);
  if (!statusMatch) {
    return 'proposed';
  }

  return statusMatch[1].trim().toLowerCase();
}

function readMetadata(content) {
  const metadata = {};
  const created = content.match(/^Created:\s*(.+)$/im);
  const lastReviewed = content.match(/^Last Reviewed:\s*(.+)$/im);
  const reviewed = content.match(/^Reviewed:\s*(.+)$/im);
  const reason = content.match(/^Reason:\s*(.+)$/im);

  if (created) metadata.created = created[1].trim();
  if (lastReviewed) metadata.lastReviewed = lastReviewed[1].trim();
  if (reviewed) metadata.reviewed = reviewed[1].trim();
  if (reason) metadata.reason = reason[1].trim();

  return metadata;
}

function addMetadata(content, field, value) {
  if (!value) return content;
  const lines = content.split(/\r?\n/);
  const statusIndex = lines.findIndex((line) => /^Status:\s*/i.test(line));
  if (statusIndex < 0) return content;

  // Insert after status line
  lines.splice(statusIndex + 1, 0, `${field}: ${value}`);
  return lines.join('\n');
}

function buildRejectedContent(originalContent, rejectedDate, reason) {
  const lines = originalContent.split(/\r?\n/);
  const output = [];
  
  let statusLine, rejectedLine, reasonLine;
  let statusIndex = -1, rejectedIndex = -1;
  let foundReason = false;

  // First pass: collect all metadata lines and find indices
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^Status:\s*/i.test(lines[i])) {
      statusLine = 'Status: Rejected';
      statusIndex = output.length;
      output.push(statusLine);
    } else if (/^Rejected:\s*/i.test(lines[i])) {
      rejectedLine = `Rejected: ${rejectedDate}`;
      rejectedIndex = output.length;
      output.push(rejectedLine);
    } else if (/^Reason:\s*/i.test(lines[i])) {
      // Only keep the first Reason line, skip subsequent ones
      if (!foundReason) {
        reasonLine = reason && reason.trim() ? `Reason: ${reason.trim()}` : lines[i];
        output.push(reasonLine);
        foundReason = true;
      }
      // Skip duplicate Reason lines
    } else {
      output.push(lines[i]);
    }
  }

  // If Status wasn't found, add it
  if (statusIndex === -1) {
    output.splice(1, 0, 'Status: Rejected');
    statusIndex = 1;
    rejectedIndex++;
  }

  // If Rejected wasn't found, add it after Status
  if (rejectedIndex === -1) {
    output.splice(statusIndex + 1, 0, `Rejected: ${rejectedDate}`);
    rejectedIndex = statusIndex + 1;
  }

  // If Reason wasn't found and we have a reason to add, add it after Rejected
  if (!foundReason && reason && reason.trim()) {
    output.splice(rejectedIndex + 1, 0, `Reason: ${reason.trim()}`);
  }

  return `${output.join('\n').trimEnd()}\n`;
}

function getDraftEntries(candidateDir) {
  const approvedDir = path.join(candidateDir, 'approved');
  const candidatesDir = path.join(candidateDir, 'candidates');
  const entries = [];

  if (fs.existsSync(approvedDir)) {
    for (const entry of fs.readdirSync(approvedDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        entries.push({
          fileName: entry.name,
          absolutePath: path.join(approvedDir, entry.name),
          source: 'approved',
        });
      }
    }
  }

  if (fs.existsSync(candidatesDir)) {
    for (const entry of fs.readdirSync(candidatesDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('-draft.md')) {
        entries.push({
          fileName: entry.name,
          absolutePath: path.join(candidatesDir, entry.name),
          source: 'candidates',
        });
      }
    }
  }

  for (const entry of entries) {
    const idMatch = entry.fileName.match(/^(\d{4})-(.+?)-(draft|review)\.md$/i);
    entry.adrId = idMatch ? idMatch[1] : null;
    entry.slug = idMatch ? idMatch[2] : entry.fileName.replace(/-(draft|review)\.md$/i, '');
    entry.title = readDraftTitle(entry.absolutePath);
    entry.relativePath = toPosix(path.relative(rootDir, entry.absolutePath));
  }

  return entries.sort((a, b) => a.fileName.localeCompare(b.fileName));
}

function ensurePromotionLedger(candidateDir, draftEntries) {
  const ledgerPath = path.join(candidateDir, 'promoted.md');
  if (fs.existsSync(ledgerPath)) {
    return ledgerPath;
  }

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const lines = [];
  lines.push('# ADR Promotion Decisions');
  lines.push('');
  lines.push(`Generated: ${yearMonth}`);
  lines.push('');
  lines.push('## Accepted');
  lines.push('');
  if (draftEntries.length === 0) {
    lines.push('None');
  } else {
    for (const entry of draftEntries) {
      lines.push(`- [ ] ${entry.adrId || 'TBD'} ${entry.title}`);
    }
  }
  lines.push('');
  lines.push('## Deferred');
  lines.push('');
  lines.push('None');
  lines.push('');
  lines.push('## Rejected');
  lines.push('');
  lines.push('None');

  fs.writeFileSync(ledgerPath, `${lines.join('\n')}\n`, 'utf8');
  return ledgerPath;
}

function parseLedger(text) {
  const lines = text.split(/\r?\n/);
  const acceptedChecked = [];
  let section = '';

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const trimmed = raw.trim();

    const headerMatch = trimmed.match(/^##\s+(.+)$/);
    if (headerMatch) {
      section = headerMatch[1].toLowerCase();
      continue;
    }

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (section !== 'accepted') {
      continue;
    }

    const checkboxMatch = raw.match(/^\s*[-*]?\s*\[([ xX])\]\s*(.+?)\s*$/);
    if (!checkboxMatch) {
      continue;
    }

    const checked = checkboxMatch[1].toLowerCase() === 'x';
    const token = checkboxMatch[2].trim();
    if (checked && token) {
      acceptedChecked.push({ token, lineIndex: i });
    }
  }

  return { lines, acceptedChecked };
}

function resolveAcceptedDrafts(draftEntries, acceptedChecked) {
  const byKey = new Map();

  for (const entry of draftEntries) {
    const keys = new Set();
    keys.add(canonicalToken(entry.title));
    keys.add(entry.fileName.toLowerCase());
    keys.add(entry.fileName.replace(/\.md$/i, '').toLowerCase());
    keys.add(entry.fileName.replace(/-(draft|review)\.md$/i, '').toLowerCase());
    if (entry.adrId) {
      keys.add(entry.adrId.toLowerCase());
      keys.add(canonicalToken(`${entry.adrId} ${entry.title}`));
      keys.add(`${entry.adrId.toLowerCase()}-${entry.slug.toLowerCase()}`);
    }

    for (const key of keys) {
      if (!byKey.has(key)) {
        byKey.set(key, entry);
      }
    }
  }

  const resolved = [];
  const unresolved = [];
  const seen = new Set();

  for (const item of acceptedChecked) {
    const raw = normalizeQueueToken(item.token);
    const normalized = canonicalToken(raw);
    let matched = byKey.get(normalized) || null;

    if (!matched) {
      const idPrefix = raw.match(/^(\d{4})(?:\s|$|-)/);
      if (idPrefix) {
        matched = draftEntries.find((entry) => entry.fileName.toLowerCase().startsWith(`${idPrefix[1]}-`)) || null;
      }
    }

    if (!matched) {
      unresolved.push(item.token);
      continue;
    }

    const key = matched.fileName.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    resolved.push({ ...item, draft: matched });
  }

  return { resolved, unresolved };
}

function loadAdrSlugAndTitleIndex() {
  const bySlug = new Map();
  const byTitle = new Map();

  if (!fs.existsSync(adrDir)) {
    return { bySlug, byTitle };
  }

  const files = fs
    .readdirSync(adrDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^(\d{4})-.*\.md$/i.test(entry.name))
    .map((entry) => entry.name);

  for (const fileName of files) {
    const slug = fileName.replace(/^\d{4}-/, '').replace(/\.md$/i, '').toLowerCase();
    bySlug.set(slug, fileName);

    const text = fs.readFileSync(path.join(adrDir, fileName), 'utf8');
    const lines = text.split(/\r?\n/).slice(0, 40);
    for (const line of lines) {
      const titleMatch = line.match(/^#\s*ADR\s+\d{4}:\s*(.+)$/i) || line.match(/^Title:\s*(.+)$/i);
      if (titleMatch) {
        byTitle.set(canonicalToken(titleMatch[1]), fileName);
        break;
      }
    }
  }

  return { bySlug, byTitle };
}

function buildFinalAdrContent(originalContent, data) {
  const sectioned = readSectionedDraft(data.sourcePath);
  const title = findFirstMatch(sectioned.text, [/^Title:\s*(.+)$/im], data.title);
  const date = findFirstMatch(sectioned.text, [/^Date:\s*(.+)$/im], data.acceptedDate);
  const decisionSource = data.decisionSource || 'Manual';
  const adrId = data.adrId;
  const allowedSections = new Set([
    'Context',
    'Decision',
    'Reasoning',
    'Alternatives Considered',
    'Consequences',
    'Non-Goals',
    'Related Documentation',
    'Related ADRs',
    'Future Considerations',
  ]);
  const output = [];

  output.push(`# ADR ${adrId}: ${title}`);
  output.push('');
  output.push('Status: Accepted');
  output.push(`Accepted: ${data.acceptedDate}`);
  output.push(`Date: ${date}`);
  output.push(`Decision Source: ${decisionSource}`);

  let currentSection = null;
  for (const line of sectioned.lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      currentSection = headingMatch[1].trim();
      if (!allowedSections.has(currentSection)) {
        currentSection = null;
      } else {
        output.push('');
        output.push(`## ${currentSection}`);
      }
      continue;
    }

    if (!currentSection) {
      continue;
    }

    if (/^(Generated By:|Generated:|Decision ID Suggestion:|Source:|Review Status:|Promoted For Enhancement:|Promoted From:|Promotion:|Open Questions)/i.test(line)) {
      continue;
    }

    if (currentSection === 'Context' && line === 'Evidence:') {
      continue;
    }

    output.push(line);
  }

  return `${output.join('\n').trimEnd()}\n`;
}

function enhanceApprovedDraftContent(originalContent) {
  return originalContent
    .replace(/^Generated By:\s*ADR Gap Audit$/m, 'Generated By: ADR Draft Enhancement')
    .replace(/^Generated By:\s*ADR Draft Enhancement$/m, 'Generated By: ADR Draft Enhancement')
    .replace(/^Source:\s*Automated ADR candidate from decision audit \(report artifact only\)$/m, 'Source: Draft enhanced from current documentation evidence for human review.');
}

function listPromotedDrafts(candidateDir) {
  const promotedDir = path.join(candidateDir, 'promoted');
  if (!fs.existsSync(promotedDir)) {
    return [];
  }

  return fs
    .readdirSync(promotedDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && (entry.name.endsWith('-draft.md') || entry.name.endsWith('-review.md')))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function pendingPromotedNotInAdr(candidateDir) {
  const promoted = listPromotedDrafts(candidateDir);
  const { bySlug } = loadAdrSlugAndTitleIndex();

  return promoted.filter((fileName) => {
    const slug = fileName.replace(/^\d{4}-/, '').replace(/-(draft|review)\.md$/i, '').toLowerCase();
    return !bySlug.has(slug);
  });
}

function listApprovedDrafts(candidateDir) {
  const approvedDir = path.join(candidateDir, 'approved');
  if (!fs.existsSync(approvedDir)) {
    return [];
  }

  return fs
    .readdirSync(approvedDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function renumberADRs() {
  // Collect all ADR files from project-docs/ADR/
  if (!fs.existsSync(adrDir)) {
    return [];
  }

  const adrFiles = fs
    .readdirSync(adrDir)
    .filter((name) => /^\d{4}-.+\.md$/.test(name))
    .sort();

  if (adrFiles.length === 0) {
    return [];
  }

  const renumbered = [];

  for (let i = 0; i < adrFiles.length; i += 1) {
    const oldFileName = adrFiles[i];
    const newNumber = String(i + 1).padStart(4, '0');
    const oldMatch = oldFileName.match(/^\d{4}-(.*\.md)$/);
    if (!oldMatch) continue;

    const newFileName = `${newNumber}-${oldMatch[1]}`;

    if (oldFileName === newFileName) {
      renumbered.push({ old: oldFileName, new: newFileName, status: 'unchanged' });
      continue;
    }

    const oldPath = path.join(adrDir, oldFileName);
    const newPath = path.join(adrDir, newFileName);

    // Read file, update internal ID if needed
    let content = fs.readFileSync(oldPath, 'utf8');

    // Update decision ID in content: handles "ADR 0008:", "0008-", etc
    const oldNumberStr = oldFileName.match(/^(\d{4})/)[1];
    if (oldNumberStr !== newNumber) {
      // Replace "ADR NNNN:" pattern
      content = content.replace(new RegExp(`# ADR ${oldNumberStr}:`, 'g'), `# ADR ${newNumber}:`);
      content = content.replace(new RegExp(`^ADR ${oldNumberStr}:`, 'gm'), `ADR ${newNumber}:`);
      // Replace "NNNN-" pattern (for slug-like references)
      content = content.replace(new RegExp(`\\b${oldNumberStr}-`, 'g'), `${newNumber}-`);
    }

    // Rename file and write updated content
    fs.writeFileSync(newPath, content, 'utf8');
    if (oldPath !== newPath && fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }

    renumbered.push({ old: oldFileName, new: newFileName, status: 'renumbered' });
  }

  return renumbered;
}

function preflightValidatePromotions(sourceDraftEntries) {
  const errors = [];
  const allowedStatuses = new Set(['proposed', 'approved', 'rejected', 'denied']);

  for (const draft of sourceDraftEntries) {
    if (!fs.existsSync(draft.absolutePath)) {
      errors.push(`${draft.fileName}: Source draft not found.`);
      continue;
    }

    const content = fs.readFileSync(draft.absolutePath, 'utf8');
    const status = readDraftStatus(content);

    if (!allowedStatuses.has(status)) {
      errors.push(`${draft.fileName}: Unsupported status for promotion: ${status}`);
      continue;
    }

    if (status === 'rejected' || status === 'denied') {
      const metadata = readMetadata(content);
      if (!metadata.reason || !metadata.reason.trim()) {
        errors.push(`${draft.fileName}: Rejected/Denied drafts must include a non-empty Reason field.`);
      }
    }
  }

  return errors;
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const candidateDir = resolveCandidateDirectory(args);

    if (!fs.existsSync(candidateDir)) {
      throw new Error(`Candidate directory not found: ${toPosix(path.relative(rootDir, candidateDir))}`);
    }

    const candidatesDir = path.join(candidateDir, 'candidates');
    const approvedDir = path.join(candidateDir, 'approved');
    const rejectedDir = path.join(candidateDir, 'rejected');
    fs.mkdirSync(candidatesDir, { recursive: true });
    fs.mkdirSync(approvedDir, { recursive: true });
    fs.mkdirSync(rejectedDir, { recursive: true });

    if (args.mode === 'author') {
      const sourceEntries = getDraftEntries(candidateDir).filter((entry) => entry.source === 'candidates');
      const authored = [];

      for (const fileName of fs.readdirSync(approvedDir)) {
        if (fileName.endsWith('.md')) {
          fs.unlinkSync(path.join(approvedDir, fileName));
        }
      }

      const today = new Date().toISOString().slice(0, 10);

      for (const entry of sourceEntries) {
        const targetPath = path.join(approvedDir, entry.fileName.replace(/-draft\.md$/i, '.md'));
        const content = fs.readFileSync(entry.absolutePath, 'utf8');
        const decisionTitle = readDraftTitle(entry.absolutePath);
        const enhanced = enhanceApprovedDraftContent(content, { title: decisionTitle });

        // Replace Status: Proposed with Status: Approved and add Last Reviewed
        const withStatus = enhanced
          .replace(/^Status: Proposed$/m, 'Status: Approved')
          .replace(/^Status: Proposed$/im, 'Status: Approved');

        // Add Last Reviewed if not already present
        let withMetadata = withStatus;
        if (!withMetadata.match(/^Last Reviewed:/im)) {
          withMetadata = addMetadata(withMetadata, 'Last Reviewed', today);
        }

        if (!args.dryRun) {
          fs.writeFileSync(targetPath, withMetadata, 'utf8');
        }
        authored.push(toPosix(path.relative(rootDir, targetPath)));
      }

      console.log(`Approved review drafts written: ${authored.length}`);
      for (const item of authored) {
        console.log(`- ${item}`);
      }
      process.exit(0);
    }

    const allEntries = getDraftEntries(candidateDir);
    const approvedDraftEntries = allEntries.filter((entry) => entry.source === 'approved');
    const candidateDraftEntries = allEntries.filter((entry) => entry.source === 'candidates');
    const sourceDraftEntries = approvedDraftEntries.length > 0 ? approvedDraftEntries : candidateDraftEntries;

    if (sourceDraftEntries.length === 0) {
      console.log(`No drafts found in ${toPosix(path.join(path.relative(rootDir, candidateDir), 'approved'))} or ${toPosix(path.join(path.relative(rootDir, candidateDir), 'candidates'))}.`);
      console.log('Run yarn audit:decisions and yarn adr:author, then rerun yarn adr:promote.');
      process.exit(0);
    }

    // Validate all drafts up front to avoid partial moves/rejections.
    const preflightErrors = preflightValidatePromotions(sourceDraftEntries);
    if (preflightErrors.length > 0) {
      console.error('Preflight validation failed. No files were moved. Fix the following issues and rerun:');
      for (const item of preflightErrors) {
        console.error(`- ${item}`);
      }
      process.exit(1);
    }

    const adrIndex = loadAdrSlugAndTitleIndex();

    const moved = [];
    const rejected = [];
    const skipped = [];

    for (const draft of sourceDraftEntries) {
      const sourcePath = draft.absolutePath;
      const sourceRel = toPosix(path.relative(rootDir, sourcePath));
      const finalFileName = finalAdrFileName(draft.fileName);
      const targetPath = path.join(adrDir, finalFileName);
      const targetRel = toPosix(path.relative(rootDir, targetPath));

      if (!fs.existsSync(sourcePath)) {
        skipped.push({ fileName: draft.fileName, reason: 'Approved draft not found in approved/ (possibly already moved).' });
        continue;
      }

      const content = fs.readFileSync(sourcePath, 'utf8');
      const status = readDraftStatus(content);
      const rejectedDate = new Date().toISOString().slice(0, 10);

      if (status === 'rejected' || status === 'denied') {
        const rejectedPath = path.join(rejectedDir, finalFileName);
        const rejectedRel = toPosix(path.relative(rootDir, rejectedPath));

        if (fs.existsSync(rejectedPath)) {
          skipped.push({ fileName: draft.fileName, reason: `Already present in rejected/: ${rejectedRel}` });
          continue;
        }

        // Read rejection reason from draft metadata
        const metadata = readMetadata(content);
        const rejectedContent = buildRejectedContent(content, rejectedDate, metadata.reason);
        if (!args.dryRun) {
          fs.writeFileSync(rejectedPath, rejectedContent, 'utf8');
          // Preserve approved drafts as historical review copies.
          if (draft.source === 'candidates' && fs.existsSync(sourcePath)) {
            fs.unlinkSync(sourcePath);
          }
        }

        rejected.push({
          source: sourceRel,
          target: rejectedRel,
        });
        continue;
      }

      // Accept both 'proposed' and 'approved' for promotion
      if (status !== 'proposed' && status !== 'approved') {
        skipped.push({ fileName: draft.fileName, reason: `Unsupported status for promotion: ${status}` });
        continue;
      }

      if (fs.existsSync(targetPath)) {
        skipped.push({ fileName: draft.fileName, reason: `Already present in project-docs/ADR/: ${targetRel}` });
        continue;
      }

      const duplicateAdr = adrIndex.bySlug.get(draft.slug.toLowerCase()) || adrIndex.byTitle.get(canonicalToken(draft.title)) || null;
      if (duplicateAdr) {
        skipped.push({ fileName: draft.fileName, reason: `Duplicate ADR already exists: ${duplicateAdr}` });
        continue;
      }

      const acceptedDate = new Date().toISOString().slice(0, 10);
      const decisionSource = sourcePath.includes(`${path.sep}approved${path.sep}`) || sourcePath.includes(`${path.sep}candidates${path.sep}`)
        ? 'ADR Gap Audit'
        : 'Manual';
      const enhanced = buildFinalAdrContent(content, {
        adrId: draft.adrId || finalFileName.match(/^(\d{4})-/)?.[1] || 'TBD',
        title: draft.title,
        acceptedDate,
        decisionSource,
        sourcePath,
      });

      if (!args.dryRun) {
        fs.writeFileSync(targetPath, enhanced, 'utf8');
        // Preserve approved drafts as historical review copies.
        if (draft.source === 'candidates' && fs.existsSync(sourcePath)) {
          fs.unlinkSync(sourcePath);
        }
      }

      moved.push({
        source: sourceRel,
        target: targetRel,
      });
    }

    console.log(`Mode: ${args.dryRun ? 'dry-run' : 'apply'}`);
    console.log(`Candidates moved to project-docs/ADR/: ${moved.length}`);
    console.log(`Candidates moved to rejected/: ${rejected.length}`);

    // Renumber ADRs after promotion to ensure sequential numbering
    let renumbered = [];
    if (!args.dryRun && moved.length > 0) {
      renumbered = renumberADRs();
      if (renumbered.some((r) => r.status === 'renumbered')) {
        console.log(`ADRs renumbered for sequential consistency: ${renumbered.filter((r) => r.status === 'renumbered').length}`);
      }
    }

    if (moved.length > 0) {
      console.log('Moved candidates:');
      for (const item of moved) {
        console.log(`- ${item.target} (from ${item.source})`);
      }
    }

    if (renumbered.length > 0 && renumbered.some((r) => r.status === 'renumbered')) {
      console.log('Renumbered ADRs:');
      for (const item of renumbered) {
        if (item.status === 'renumbered') {
          console.log(`- ${item.old} → ${item.new}`);
        }
      }
    }

    if (rejected.length > 0) {
      console.log('Rejected candidates:');
      for (const item of rejected) {
        console.log(`- ${item.target} (from ${item.source})`);
      }
    }

    if (skipped.length > 0) {
      console.log('Skipped entries:');
      for (const item of skipped) {
        console.log(`- ${item.fileName}: ${item.reason}`);
      }
    }

    if (moved.length === 0 && rejected.length === 0) {
      console.log('No candidate drafts were moved in this run.');
    }
  } catch (error) {
    console.error(`promoteAdrCandidates failed: ${error.message}`);
    process.exit(1);
  }
}

main();
