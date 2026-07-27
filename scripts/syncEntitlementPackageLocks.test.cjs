const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseArgs,
  replaceLockVersion,
  replacePackageVersion,
} = require('./syncEntitlementPackageLocks.cjs');

test('parses check and version modes safely', () => {
  assert.deepEqual(parseArgs(['--check']), { check: true, version: '' });
  assert.deepEqual(parseArgs(['--version', '0.3.0']), {
    check: false,
    version: '0.3.0',
  });
  assert.throws(() => parseArgs(['--check', '--version', '0.3.0']));
  assert.throws(() => parseArgs(['--version', 'next']));
});

test('updates only the entitlement package version', () => {
  const source = '{\n\t"name": "@maintley/entitlements",\n\t"version": "0.2.0"\n}\n';
  assert.equal(
    replacePackageVersion(source, '0.3.0'),
    '{\n\t"name": "@maintley/entitlements",\n\t"version": "0.3.0"\n}\n',
  );
});

test('updates the exact local dependency lock entry without lockfile churn', () => {
  const source = [
    'other@^1.0.0:',
    '  version "1.0.0"',
    '',
    '"@maintley/entitlements@file:packages/entitlements":',
    '  version "0.2.0"',
    '  resolved "file:packages/entitlements"',
    '',
  ].join('\n');
  const expected = source.replace('version "0.2.0"', 'version "0.3.0"');
  assert.equal(
    replaceLockVersion(
      source,
      '@maintley/entitlements@file:packages/entitlements',
      '0.3.0',
    ),
    expected,
  );
});

test('rejects missing and duplicate lock selectors', () => {
  assert.throws(() => replaceLockVersion('', 'missing', '0.3.0'));
  const duplicate = '"duplicate":\n  version "1.0.0"\n\n"duplicate":\n  version "1.0.0"\n';
  assert.throws(() => replaceLockVersion(duplicate, 'duplicate', '0.3.0'));
});
