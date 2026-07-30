#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseDotenv } = require('./syncGitHubEnvironment.cjs');

const rootDir = path.resolve(__dirname, '..');

function formatDotenv(title, values) {
	const lines = [
		`# ${title}`,
		'# Local-only file. Never commit real values.',
		'',
	];
	for (const [key, value] of [...values.entries()].sort(([left], [right]) => left.localeCompare(right))) {
		lines.push(`${key}=${JSON.stringify(String(value))}`);
	}
	return `${lines.join('\n')}\n`;
}

function splitRootValues(rootValues) {
	const react = new Map();
	const operations = new Map();
	for (const [key, value] of rootValues) {
		if (key.startsWith('REACT_APP_')) react.set(key, value);
		else operations.set(key, value);
	}
	return { react, operations };
}

function validateEnvironment(values, { projectId, stripePrefix, label }) {
	const actualProject = String(values.get('REACT_APP_FIREBASE_PROJECT_ID') || '').trim();
	if (actualProject !== projectId) {
		throw new Error(`${label} Firebase project must be ${projectId}; found ${actualProject || 'empty'}.`);
	}
	const stripeKey = String(values.get('REACT_APP_STRIPE_PUBLIC_KEY') || '').trim();
	if (!stripeKey.startsWith(stripePrefix)) {
		throw new Error(`${label} Stripe publishable key must start with ${stripePrefix}.`);
	}
}

function readFileValues(relativePath) {
	const absolutePath = path.join(rootDir, relativePath);
	return fs.existsSync(absolutePath)
		? parseDotenv(fs.readFileSync(absolutePath, 'utf8'))
		: new Map();
}

function main() {
	try {
		const apply = process.argv.slice(2).includes('--apply');
		const rootValues = readFileValues('.env');
		if (!rootValues.size) throw new Error('Root .env is missing or empty.');
		const { react: productionReact, operations } = splitRootValues(rootValues);
		const existingProduction = readFileValues('.env.production');
		const production = new Map(existingProduction);
		for (const [key, value] of productionReact) production.set(key, value);
		for (const [key, value] of Object.entries(process.env)) {
			if (key.startsWith('PROD_REACT_APP_') && value) {
				production.set(key.slice(5), value);
			}
		}

		const development = new Map(readFileValues('.env.local'));
		for (const [key, value] of Object.entries(process.env)) {
			if (key.startsWith('DEV_REACT_APP_') && value) {
				development.set(key.slice(4), value);
			}
		}

		validateEnvironment(production, {
			projectId: 'mypropertymanager-cda42',
			stripePrefix: 'pk_live_',
			label: 'Production',
		});
		validateEnvironment(development, {
			projectId: 'maintleybeta',
			stripePrefix: 'pk_test_',
			label: 'Development',
		});

		const outputs = [
			{
				path: '.env.production',
				contents: formatDotenv('Maintley production browser configuration', production),
				count: production.size,
			},
			{
				path: '.env.development.local',
				contents: formatDotenv('Maintley development browser configuration', development),
				count: development.size,
			},
			{
				path: '.env.operations.local',
				contents: formatDotenv('Maintley local operations and legacy script configuration', operations),
				count: operations.size,
			},
		];

		console.log(`Local environment organization ${apply ? 'apply' : 'dry-run'}:`);
		for (const output of outputs) console.log(`- ${output.path}: ${output.count} values`);
		console.log('- .env and .env.local: preserved until direct loaders are migrated');
		console.log('Values were intentionally omitted.');
		if (!apply) return;

		for (const output of outputs) {
			fs.writeFileSync(path.join(rootDir, output.path), output.contents, 'utf8');
		}
		console.log('Local environment files organized successfully.');
	} catch (error) {
		console.error(`Local environment organization failed: ${error.message}`);
		process.exit(1);
	}
}

if (require.main === module) main();

module.exports = {
	formatDotenv,
	splitRootValues,
	validateEnvironment,
};
