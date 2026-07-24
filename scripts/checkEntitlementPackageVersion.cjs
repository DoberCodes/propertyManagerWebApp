#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = 'functions/packages/entitlements/package.json';
const packagePathPrefix = 'functions/packages/entitlements/';
const metadataFiles = new Set([
  packageJsonPath,
  'functions/packages/entitlements/README.md',
]);

function parseBaseRef(argv = process.argv.slice(2), env = process.env) {
  const baseIndex = argv.indexOf('--base');
  if (baseIndex >= 0) {
    return String(argv[baseIndex + 1] || '').trim();
  }

  return String(env.ENTITLEMENT_PACKAGE_BASE_REF || '').trim();
}

function isDeployablePackagePath(filePath) {
  const normalized = String(filePath || '').replace(/\\/g, '/');
  return normalized.startsWith(packagePathPrefix) && !metadataFiles.has(normalized);
}

function requiresVersionBump(changedFiles) {
  return changedFiles.some(isDeployablePackagePath);
}

function runGit(args) {
  return execFileSync(
    'git',
    ['-c', `safe.directory=${rootDir.replace(/\\/g, '/')}`, ...args],
    { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();
}

function readCurrentVersion() {
  const contents = fs.readFileSync(path.join(rootDir, packageJsonPath), 'utf8');
  return String(JSON.parse(contents).version || '').trim();
}

function readVersionAtRef(ref) {
  const contents = runGit(['show', `${ref}:${packageJsonPath}`]);
  return String(JSON.parse(contents).version || '').trim();
}

function main() {
  const baseRef = parseBaseRef();
  if (!baseRef) {
    console.error(
      'Entitlement package version check failed: provide --base <git-ref> or ENTITLEMENT_PACKAGE_BASE_REF.',
    );
    process.exit(1);
  }

  let changedFiles;
  let baseVersion;
  try {
    changedFiles = runGit(['diff', '--name-only', baseRef, 'HEAD'])
      .split(/\r?\n/)
      .filter(Boolean);
    baseVersion = readVersionAtRef(baseRef);
  } catch (error) {
    const detail = String(error.stderr || error.message || error).trim();
    console.error(
      `Entitlement package version check failed for base ${baseRef}: ${detail}`,
    );
    process.exit(1);
  }

  if (!requiresVersionBump(changedFiles)) {
    console.log('Entitlement package version check passed: no deployable package files changed.');
    return;
  }

  const currentVersion = readCurrentVersion();
  if (!currentVersion || currentVersion === baseVersion) {
    console.error(
      `Entitlement package version check failed: deployable package files changed, but the package version remains ${baseVersion || '(missing)'}.`,
    );
    console.error(
      'Bump functions/packages/entitlements/package.json and refresh both Yarn lockfiles.',
    );
    process.exit(1);
  }

  console.log(
    `Entitlement package version check passed: ${baseVersion} -> ${currentVersion}.`,
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  isDeployablePackagePath,
  parseBaseRef,
  requiresVersionBump,
};
