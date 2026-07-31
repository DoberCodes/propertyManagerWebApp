#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { loadEnvironmentContract } = require('./environmentContract.cjs');

const rootDir = path.resolve(__dirname, '..');
const sourceRoots = ['src', 'functions', 'scripts'];
const extensions = new Set(['.js', '.cjs', '.ts', '.tsx']);
const ignoredDirectories = new Set(['archive', 'lib', 'node_modules']);
const platformProvided = new Set([
	'FIRESTORE_EMULATOR_HOST',
	'GCLOUD_PROJECT',
	'GH_TOKEN',
	'GITHUB_EVENT_PATH',
	'GITHUB_REPOSITORY',
	'GITHUB_TOKEN',
	'GOOGLE_CLOUD_PROJECT',
	'NODE_ENV',
]);
const legacyCompatibility = new Set([
	'REACT_APP_STRIPE_BASIC_PLAN_ID',
	'REACT_APP_STRIPE_HOMEOWNER_PLAN_ID',
	'REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PLAN_ID',
	'REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID',
	'REACT_APP_STRIPE_HOMEOWNER_PLUS_PRICE_ID',
	'REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PLAN_ID',
	'REACT_APP_STRIPE_PORTFOLIO_MONTHLY_PLAN_ID',
	'REACT_APP_STRIPE_PORTFOLIO_PRICE_ID',
	'REACT_APP_STRIPE_PROFESSIONAL_PLAN_ID',
	'REACT_APP_STRIPE_PROPERTY_ANNUAL_PLAN_ID',
	'REACT_APP_STRIPE_PROPERTY_MONTHLY_PLAN_ID',
	'REACT_APP_STRIPE_PROPERTY_PRICE_ID',
]);

function listSourceFiles(directory) {
	if (!fs.existsSync(directory)) return [];
	const files = [];
	for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
		if (item.isDirectory() && ignoredDirectories.has(item.name)) continue;
		if (!item.isDirectory() && item.name.includes('.test.')) continue;
		const absolutePath = path.join(directory, item.name);
		if (item.isDirectory()) files.push(...listSourceFiles(absolutePath));
		else if (extensions.has(path.extname(item.name))) files.push(absolutePath);
	}
	return files;
}

function collectProcessEnvironmentNames(files) {
	const names = new Set();
	const expression = /process\.env\.([A-Z][A-Z0-9_]*)/g;
	for (const file of files) {
		const contents = fs.readFileSync(file, 'utf8');
		for (const match of contents.matchAll(expression)) names.add(match[1]);
	}
	return names;
}

function extractDefinedFirebaseSecretNames(contents) {
	const names = new Set();
	const expression = /\bdefine(?:Json)?Secret(?:<[^()]+>)?\s*\(\s*['"]([A-Z][A-Z0-9_]*)['"]/g;
	for (const match of String(contents || '').matchAll(expression)) names.add(match[1]);
	return names;
}

function collectDefinedFirebaseSecretNames(files) {
	const names = new Set();
	for (const file of files) {
		for (const name of extractDefinedFirebaseSecretNames(fs.readFileSync(file, 'utf8'))) names.add(name);
	}
	return names;
}

function validateContractCoverage(entries, referencedNames) {
	const declared = new Set(entries.map(({ name }) => name));
	return [...referencedNames]
		.filter((name) => !declared.has(name) && !platformProvided.has(name) && !legacyCompatibility.has(name))
		.sort();
}

function validateFirebaseSecretCoverage(entries, definedNames) {
	const declaredSecrets = new Set(entries
		.filter(({ scope, delivery }) => scope === 'functions' && delivery === 'firebase-secret')
		.map(({ name }) => name));
	return [...definedNames].filter((name) => !declaredSecrets.has(name)).sort();
}

function validateWorkflowMappings(entries) {
	const requirements = [
		{
			environment: 'production',
			prefix: 'PROD_',
			file: '.github/workflows/firebase-deploy-environments.yml',
			entries: entries.filter((entry) => entry.delivery === 'github-variable'),
		},
		{
			environment: 'development',
			prefix: 'DEV_',
			file: '.github/workflows/firebase-hosting-preview.yml',
			entries: entries.filter((entry) => entry.delivery === 'github-variable' && entry.scope === 'web'),
		},
	];
	const missing = [];
	for (const requirement of requirements) {
		const contents = fs.readFileSync(path.join(rootDir, requirement.file), 'utf8');
		for (const entry of requirement.entries.filter(({ environments }) => environments.includes(requirement.environment))) {
			const expected = `vars.${requirement.prefix}${entry.name}`;
			if (!contents.includes(expected)) missing.push(`${requirement.file}: ${expected}`);
		}
	}
	return missing;
}

function main() {
	try {
		const entries = loadEnvironmentContract();
		const files = sourceRoots.flatMap((directory) => listSourceFiles(path.join(rootDir, directory)));
		const missing = validateContractCoverage(entries, collectProcessEnvironmentNames(files));
		if (missing.length) throw new Error(`Referenced variables missing from .env.example: ${missing.join(', ')}`);
		const missingSecrets = validateFirebaseSecretCoverage(entries, collectDefinedFirebaseSecretNames(files));
		if (missingSecrets.length) {
			throw new Error(`Firebase secrets missing from .env.example: ${missingSecrets.join(', ')}`);
		}
		const missingMappings = validateWorkflowMappings(entries);
		if (missingMappings.length) throw new Error(`Workflow mappings missing from environment contract delivery: ${missingMappings.join(', ')}`);
		console.log(`Environment contract validated: ${entries.length} declared variables cover Maintley-owned runtime references.`);
	} catch (error) {
		console.error(`Environment contract validation failed: ${error.message}`);
		process.exit(1);
	}
}

if (require.main === module) main();

module.exports = {
	collectDefinedFirebaseSecretNames,
	collectProcessEnvironmentNames,
	extractDefinedFirebaseSecretNames,
	validateContractCoverage,
	validateFirebaseSecretCoverage,
	validateWorkflowMappings,
};
