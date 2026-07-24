#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const functionsDir = path.join(rootDir, 'functions');
const packageDir = path.join(functionsDir, 'packages', 'entitlements');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`Functions deploy package validation failed: ${message}`);
  process.exitCode = 1;
}

const rootPackage = readJson(path.join(rootDir, 'package.json'));
const functionsPackage = readJson(path.join(functionsDir, 'package.json'));
const entitlementPackage = readJson(path.join(packageDir, 'package.json'));

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
