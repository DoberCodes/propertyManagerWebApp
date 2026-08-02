const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { functionTests, rootScriptTests } = require('./testManifest.cjs');

const repositoryRoot = path.resolve(__dirname, '..');
const manifests = {
	functions: functionTests.map((file) => path.join('functions', file)),
	root: rootScriptTests.map((file) => path.join('scripts', file)),
};

const manifestName = process.argv[2];
const files = manifests[manifestName];

if (!files) {
	console.error(`Unknown test manifest "${manifestName || ''}". Use "root" or "functions".`);
	process.exit(1);
}

const result = spawnSync(
	process.execPath,
	['--test', '--test-concurrency=1', ...files],
	{
		cwd: repositoryRoot,
		stdio: 'inherit',
	},
);

if (result.error) {
	throw result.error;
}

process.exit(result.status ?? 1);
