const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { functionTests, rootScriptTests } = require('./testManifest.cjs');

const repositoryRoot = path.resolve(__dirname, '..');

const listTests = (directory) => fs
	.readdirSync(path.join(repositoryRoot, directory))
	.filter((file) => file.endsWith('.test.cjs'))
	.sort();

test('root script test manifest includes every root script test', () => {
	assert.deepEqual([...rootScriptTests].sort(), listTests('scripts'));
});

test('Functions test manifest includes every top-level Functions test', () => {
	assert.deepEqual([...functionTests].sort(), listTests('functions'));
});
