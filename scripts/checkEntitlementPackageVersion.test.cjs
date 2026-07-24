const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isDeployablePackagePath,
  parseBaseRef,
  requiresVersionBump,
} = require('./checkEntitlementPackageVersion.cjs');

test('reads the comparison ref from an argument before the environment', () => {
  assert.equal(
    parseBaseRef(['--base', 'origin/main'], {
      ENTITLEMENT_PACKAGE_BASE_REF: 'fallback',
    }),
    'origin/main',
  );
});

test('treats runtime and declaration changes as deployable package changes', () => {
  assert.equal(
    isDeployablePackagePath('functions/packages/entitlements/index.js'),
    true,
  );
  assert.equal(
    isDeployablePackagePath('functions\\packages\\entitlements\\index.d.ts'),
    true,
  );
});

test('does not require another bump for package metadata or documentation alone', () => {
  assert.equal(
    requiresVersionBump([
      'functions/packages/entitlements/package.json',
      'functions/packages/entitlements/README.md',
      'functions/yarn.lock',
    ]),
    false,
  );
});

test('requires a bump when any deployable package file changes', () => {
  assert.equal(
    requiresVersionBump([
      'docs/architecture.md',
      'functions/packages/entitlements/index.js',
    ]),
    true,
  );
});
