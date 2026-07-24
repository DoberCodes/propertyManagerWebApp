#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const functionsDir = path.join(rootDir, 'functions');
const packageDir = path.join(functionsDir, 'packages', 'entitlements');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function lockEntryHasVersion(lockText, selector, version) {
  const entryStart = lockText.indexOf(`"${selector}":`);
  if (entryStart < 0) return false;
  const entryEnd = lockText.indexOf('\n\n', entryStart);
  const entry = lockText.slice(
    entryStart,
    entryEnd < 0 ? lockText.length : entryEnd,
  );
  return entry.includes(`version "${version}"`);
}

function fail(message) {
  console.error(`Functions deploy package validation failed: ${message}`);
  process.exitCode = 1;
}

const rootPackage = readJson(path.join(rootDir, 'package.json'));
const functionsPackage = readJson(path.join(functionsDir, 'package.json'));
const entitlementPackage = readJson(path.join(packageDir, 'package.json'));
const entitlementModule = require(path.join(packageDir, 'index.js'));

if (
  rootPackage.dependencies?.['@maintley/entitlements'] !==
  'file:functions/packages/entitlements'
) {
  fail('the root dependency must resolve to file:functions/packages/entitlements.');
}

if (
  functionsPackage.dependencies?.['@maintley/entitlements'] !==
  'file:packages/entitlements'
) {
  fail('the Functions dependency must resolve inside the Functions source directory.');
}

for (const fileName of ['package.json', 'index.js', 'index.d.ts', 'README.md']) {
  if (!fs.existsSync(path.join(packageDir, fileName))) {
    fail(`functions/packages/entitlements/${fileName} is missing.`);
  }
}

if (entitlementPackage.name !== '@maintley/entitlements') {
  fail('the bundled entitlement package has an unexpected package name.');
}

const functionsLock = readText(path.join(functionsDir, 'yarn.lock'));
const rootLock = readText(path.join(rootDir, 'yarn.lock'));

if (
  !lockEntryHasVersion(
    functionsLock,
    '@maintley/entitlements@file:packages/entitlements',
    entitlementPackage.version,
  )
) {
  fail('functions/yarn.lock does not match the bundled entitlement package version.');
}

if (
  !lockEntryHasVersion(
    rootLock,
    '@maintley/entitlements@file:functions/packages/entitlements',
    entitlementPackage.version,
  )
) {
  fail('the root yarn.lock does not match the bundled entitlement package version.');
}

const adminPortalSource = readText(path.join(functionsDir, 'adminPortal.ts'));
const literalAuditActions = Array.from(
  adminPortalSource.matchAll(/getAdminAuditEventId\(\s*['"]([^'"]+)['"]/g),
  (match) => match[1],
);

for (const action of literalAuditActions) {
  if (!entitlementModule.ADMIN_AUDIT_ACTIONS.includes(action)) {
    fail(`adminPortal.ts uses unknown administrative audit action ${action}.`);
  }
}

const functionsDependencyPath = path.resolve(
  functionsDir,
  functionsPackage.dependencies['@maintley/entitlements'].replace(/^file:/, '')
);
const relativeDependencyPath = path.relative(functionsDir, functionsDependencyPath);

if (
  relativeDependencyPath.startsWith('..') ||
  path.isAbsolute(relativeDependencyPath)
) {
  fail('the entitlement dependency escapes the Firebase Functions upload boundary.');
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log(
  'Functions deploy package validation passed: @maintley/entitlements is included in the Functions source.'
);
