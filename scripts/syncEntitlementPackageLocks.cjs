#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packagePath = path.join(
  rootDir,
  'functions',
  'packages',
  'entitlements',
  'package.json',
);
const lockTargets = [
  {
    path: path.join(rootDir, 'yarn.lock'),
    selector: '@maintley/entitlements@file:functions/packages/entitlements',
  },
  {
    path: path.join(rootDir, 'functions', 'yarn.lock'),
    selector: '@maintley/entitlements@file:packages/entitlements',
  },
];

function parseArgs(argv = process.argv.slice(2)) {
  const check = argv.includes('--check');
  const versionIndex = argv.indexOf('--version');
  const version = versionIndex >= 0 ? String(argv[versionIndex + 1] || '').trim() : '';

  if (check && version) {
    throw new Error('--check and --version cannot be used together.');
  }
  if (versionIndex >= 0 && !version) {
    throw new Error('--version requires a semantic version value.');
  }
  if (version && !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Invalid semantic version: ${version}`);
  }

  return { check, version };
}

function replacePackageVersion(contents, version) {
  const pattern = /(\"name\"\s*:\s*\"@maintley\/entitlements\"[\s\S]*?\"version\"\s*:\s*\")[^\"]+(\")/;
  const matches = contents.match(pattern);
  if (!matches) {
    throw new Error('Could not find the entitlement package version field.');
  }
  return contents.replace(pattern, `$1${version}$2`);
}

function replaceLockVersion(contents, selector, version) {
  const header = `\"${selector}\":`;
  const firstIndex = contents.indexOf(header);
  if (firstIndex < 0 || contents.indexOf(header, firstIndex + header.length) >= 0) {
    throw new Error(`Expected exactly one lockfile entry for ${selector}.`);
  }

  const entryEnd = contents.indexOf('\n\n', firstIndex);
  const end = entryEnd < 0 ? contents.length : entryEnd;
  const entry = contents.slice(firstIndex, end);
  if (!/^  version \"[^\"]+\"$/m.test(entry)) {
    throw new Error(`Lockfile entry for ${selector} has no version field.`);
  }

  return `${contents.slice(0, firstIndex)}${entry.replace(
    /^  version \"[^\"]+\"$/m,
    `  version \"${version}\"`,
  )}${contents.slice(end)}`;
}

function main() {
  let options;
  try {
    options = parseArgs();
  } catch (error) {
    console.error(`Entitlement lock synchronization failed: ${error.message}`);
    process.exit(1);
  }

  let packageContents = fs.readFileSync(packagePath, 'utf8');
  if (options.version) {
    packageContents = replacePackageVersion(packageContents, options.version);
  }
  const packageVersion = String(JSON.parse(packageContents).version || '').trim();
  if (!packageVersion) {
    console.error('Entitlement lock synchronization failed: package version is missing.');
    process.exit(1);
  }

  const pendingWrites = [];
  if (options.version) {
    pendingWrites.push({ path: packagePath, contents: packageContents });
  }

  for (const target of lockTargets) {
    const current = fs.readFileSync(target.path, 'utf8');
    let synchronized;
    try {
      synchronized = replaceLockVersion(current, target.selector, packageVersion);
    } catch (error) {
      console.error(`Entitlement lock synchronization failed: ${error.message}`);
      process.exit(1);
    }

    if (current !== synchronized) {
      if (options.check) {
        console.error(
          `Entitlement lock check failed: ${path.relative(rootDir, target.path)} does not use version ${packageVersion}.`,
        );
        console.error('Run yarn sync:entitlement-locks and commit the result.');
        process.exit(1);
      }
      pendingWrites.push({ path: target.path, contents: synchronized });
    }
  }

  for (const write of pendingWrites) {
    fs.writeFileSync(write.path, write.contents, 'utf8');
  }

  if (options.check) {
    console.log(`Entitlement lock check passed for version ${packageVersion}.`);
  } else if (pendingWrites.length > 0) {
    console.log(
      `Synchronized entitlement package metadata to version ${packageVersion}: ${pendingWrites
        .map((write) => path.relative(rootDir, write.path))
        .join(', ')}.`,
    );
  } else {
    console.log(`Entitlement package metadata already uses version ${packageVersion}.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  replaceLockVersion,
  replacePackageVersion,
};
