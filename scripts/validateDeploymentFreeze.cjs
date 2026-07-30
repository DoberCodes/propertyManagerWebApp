#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packagePath = path.join(rootDir, 'package.json');
const workflowsDir = path.join(rootDir, '.github', 'workflows');
const removedWorkflowPath = path.join(workflowsDir, 'deploy-web.yml');
const expectedGuardCommand = 'node scripts/assertGitHubPagesFrozen.cjs';

const failures = [];

if (fs.existsSync(removedWorkflowPath)) {
  failures.push('.github/workflows/deploy-web.yml must remain removed during the migration freeze.');
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
for (const scriptName of ['predeploy', 'deploy', 'deploy:gh-pages']) {
  if (packageJson.scripts?.[scriptName] !== expectedGuardCommand) {
    failures.push(
      'package.json script "' + scriptName + '" must remain "' + expectedGuardCommand + '".',
    );
  }
}

for (const entry of fs.readdirSync(workflowsDir, { withFileTypes: true })) {
  if (!entry.isFile() || !/\.ya?ml$/i.test(entry.name)) continue;

  const workflowPath = path.join(workflowsDir, entry.name);
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  if (/\bgh-pages\b|Deploy to GitHub Pages/i.test(workflow)) {
    failures.push(
      '.github/workflows/' + entry.name + ' contains a GitHub Pages deployment reference.',
    );
  }
}

if (failures.length > 0) {
  process.stderr.write('GitHub Pages deployment freeze validation failed:\n\n');
  for (const failure of failures) {
    process.stderr.write('- ' + failure + '\n');
  }
  process.exit(1);
}

process.stdout.write('GitHub Pages deployment freeze is enforced.\n');
