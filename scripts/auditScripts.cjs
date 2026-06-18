#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const scriptsDir = path.join(rootDir, 'scripts');
const archiveDir = path.join(scriptsDir, 'archive');
const reportsDir = path.join(rootDir, 'project-docs', 'reports');

const packageJsonPaths = [
  path.join(rootDir, 'package.json'),
  path.join(rootDir, 'functions', 'package.json'),
  path.join(rootDir, 'client', 'package.json'),
];

const scriptExtensions = new Set(['.cjs', '.js', '.mjs', '.ts']);
const riskyTerms = ['delete', 'prune', 'remove', 'apply'];
const dryRunPatterns = ['--dry-run', 'dry run', 'dryrun', 'isdryrun', 'dry_run'];

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fileExists(relPath) {
  return fs.existsSync(path.join(rootDir, relPath));
}

function listScriptFiles(dirPath, prefix) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter((entry) => {
      const full = path.join(dirPath, entry);
      return fs.statSync(full).isFile() && scriptExtensions.has(path.extname(entry));
    })
    .sort((a, b) => a.localeCompare(b))
    .map((entry) => ({
      name: entry,
      relPath: `${prefix}/${entry}`,
      fullPath: path.join(dirPath, entry),
    }));
}

function collectPackageScripts() {
  const packages = [];

  for (const pkgPath of packageJsonPaths) {
    if (!fs.existsSync(pkgPath)) {
      continue;
    }

    const pkg = readJson(pkgPath);
    const relPkgPath = toPosix(path.relative(rootDir, pkgPath));
    const scripts = pkg.scripts || {};

    packages.push({
      relPkgPath,
      scripts,
    });
  }

  return packages;
}

function findScriptTargets(command) {
  const targets = new Set();

  const explicitPathRegex = /(?:^|\s)(scripts\/[A-Za-z0-9._\/-]+)/g;
  let pathMatch = explicitPathRegex.exec(command);
  while (pathMatch) {
    targets.add(pathMatch[1]);
    pathMatch = explicitPathRegex.exec(command);
  }

  return Array.from(targets).sort((a, b) => a.localeCompare(b));
}

function isAliasCommand(command) {
  const trimmed = command.trim();
  const npmMatch = trimmed.match(/^npm\s+run\s+([A-Za-z0-9:_-]+)$/);
  if (npmMatch) {
    return { type: 'npm', target: npmMatch[1] };
  }

  const yarnMatch = trimmed.match(/^yarn\s+([A-Za-z0-9:_-]+)$/);
  if (yarnMatch) {
    return { type: 'yarn', target: yarnMatch[1] };
  }

  return null;
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return '';
  }
}

function hasDryRunSupport(content) {
  const normalized = content.toLowerCase();
  return dryRunPatterns.some((pattern) => normalized.includes(pattern));
}

function containsRiskyTerms(content, fileName) {
  const normalizedContent = content.toLowerCase();
  const normalizedName = fileName.toLowerCase();

  const hits = new Set();
  for (const term of riskyTerms) {
    if (normalizedName.includes(term) || normalizedContent.includes(term)) {
      hits.add(term);
    }
  }

  return Array.from(hits).sort((a, b) => a.localeCompare(b));
}

function generateReport() {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const reportPath = path.join(reportsDir, `script-audit-${yearMonth}.md`);

  const activeScripts = listScriptFiles(scriptsDir, 'scripts');
  const archivedScripts = listScriptFiles(archiveDir, 'scripts/archive');
  const allScripts = [...activeScripts, ...archivedScripts];

  const packages = collectPackageScripts();

  const referencedScriptPaths = new Set();
  const missingTargets = [];
  const aliasRows = [];

  for (const pkg of packages) {
    const scriptNames = new Set(Object.keys(pkg.scripts));

    for (const [name, command] of Object.entries(pkg.scripts)) {
      const alias = isAliasCommand(command);
      if (alias) {
        aliasRows.push({
          packagePath: pkg.relPkgPath,
          script: name,
          command,
          target: alias.target,
          targetExists: scriptNames.has(alias.target),
        });
      }

      const targets = findScriptTargets(command);
      for (const relTarget of targets) {
        referencedScriptPaths.add(relTarget);
        if (!fileExists(relTarget)) {
          missingTargets.push({
            packagePath: pkg.relPkgPath,
            script: name,
            target: relTarget,
            command,
          });
        }
      }
    }
  }

  const unreferencedActive = activeScripts
    .filter((item) => !referencedScriptPaths.has(item.relPath))
    .map((item) => item.relPath)
    .sort((a, b) => a.localeCompare(b));

  const unreferencedArchive = archivedScripts
    .filter((item) => !referencedScriptPaths.has(item.relPath))
    .map((item) => item.relPath)
    .sort((a, b) => a.localeCompare(b));

  const fileNameToPaths = new Map();
  for (const scriptFile of allScripts) {
    const list = fileNameToPaths.get(scriptFile.name) || [];
    list.push(scriptFile.relPath);
    fileNameToPaths.set(scriptFile.name, list);
  }

  const duplicateFileNames = Array.from(fileNameToPaths.entries())
    .filter(([, paths]) => paths.length > 1)
    .map(([fileName, paths]) => ({ fileName, paths: paths.sort((a, b) => a.localeCompare(b)) }))
    .sort((a, b) => a.fileName.localeCompare(b.fileName));

  const riskyScriptRows = [];
  for (const scriptFile of allScripts) {
    const content = safeRead(scriptFile.fullPath);
    const riskyHits = containsRiskyTerms(content, scriptFile.name);
    if (riskyHits.length === 0) {
      continue;
    }

    const dryRun = hasDryRunSupport(content);
    riskyScriptRows.push({
      relPath: scriptFile.relPath,
      terms: riskyHits,
      dryRun,
    });
  }

  riskyScriptRows.sort((a, b) => a.relPath.localeCompare(b.relPath));

  const riskyNoDryRun = riskyScriptRows.filter((row) => !row.dryRun);

  const lines = [];
  lines.push(`# Script Audit - ${yearMonth}`);
  lines.push('');
  lines.push(`Generated: ${now.toISOString()}`);
  lines.push('Mode: report-only (no cleanup or migration actions performed)');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Package manifests scanned: ${packages.length}`);
  lines.push(`- Active scripts scanned (scripts/): ${activeScripts.length}`);
  lines.push(`- Archived scripts scanned (scripts/archive/): ${archivedScripts.length}`);
  lines.push(`- Alias scripts detected: ${aliasRows.length}`);
  lines.push(`- Missing script targets: ${missingTargets.length}`);
  lines.push(`- Unreferenced active scripts: ${unreferencedActive.length}`);
  lines.push(`- Duplicate filenames: ${duplicateFileNames.length}`);
  lines.push(`- Risky scripts detected: ${riskyScriptRows.length}`);
  lines.push(`- Risky scripts without dry-run signal: ${riskyNoDryRun.length}`);
  lines.push('');

  lines.push('## Package Script Aliases');
  lines.push('');
  lines.push('| Package | Script | Alias Target | Target Exists |');
  lines.push('|---|---|---|---|');
  for (const row of aliasRows.sort((a, b) => `${a.packagePath}:${a.script}`.localeCompare(`${b.packagePath}:${b.script}`))) {
    lines.push(`| ${row.packagePath} | ${row.script} | ${row.target} | ${row.targetExists ? 'yes' : 'no'} |`);
  }
  if (aliasRows.length === 0) {
    lines.push('| (none) | - | - | - |');
  }
  lines.push('');

  lines.push('## Missing Script Targets');
  lines.push('');
  if (missingTargets.length === 0) {
    lines.push('- None found.');
  } else {
    for (const item of missingTargets) {
      lines.push(`- ${item.packagePath} -> ${item.script}: missing target ${item.target}`);
    }
  }
  lines.push('');

  lines.push('## Unreferenced Active Scripts (scripts/)');
  lines.push('');
  if (unreferencedActive.length === 0) {
    lines.push('- None found.');
  } else {
    for (const relPath of unreferencedActive) {
      lines.push(`- ${relPath}`);
    }
  }
  lines.push('');

  lines.push('## Unreferenced Archived Scripts (scripts/archive/)');
  lines.push('');
  if (unreferencedArchive.length === 0) {
    lines.push('- None found.');
  } else {
    for (const relPath of unreferencedArchive) {
      lines.push(`- ${relPath}`);
    }
  }
  lines.push('');

  lines.push('## Duplicate Filenames Across scripts/ and scripts/archive/');
  lines.push('');
  if (duplicateFileNames.length === 0) {
    lines.push('- None found.');
  } else {
    for (const entry of duplicateFileNames) {
      lines.push(`- ${entry.fileName}`);
      for (const relPath of entry.paths) {
        lines.push(`  - ${relPath}`);
      }
    }
  }
  lines.push('');

  lines.push('## Risky Script Signals');
  lines.push('');
  lines.push('| Script | Risky Terms | Dry-Run Signal |');
  lines.push('|---|---|---|');
  if (riskyScriptRows.length === 0) {
    lines.push('| (none) | - | - |');
  } else {
    for (const row of riskyScriptRows) {
      lines.push(`| ${row.relPath} | ${row.terms.join(', ')} | ${row.dryRun ? 'yes' : 'no'} |`);
    }
  }
  lines.push('');

  lines.push('## Scripts With Risky Terms But No Dry-Run Signal');
  lines.push('');
  if (riskyNoDryRun.length === 0) {
    lines.push('- None found.');
  } else {
    for (const row of riskyNoDryRun) {
      lines.push(`- ${row.relPath}`);
    }
  }
  lines.push('');

  lines.push('## Notes');
  lines.push('');
  lines.push('- This report does not move, delete, or modify scripts.');
  lines.push('- Use report findings as input to manual cleanup planning.');

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(`Script audit report generated: ${toPosix(path.relative(rootDir, reportPath))}`);
}

generateReport();
