#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseDotenv } = require('./syncGitHubEnvironment.cjs');
const { defaultFor, entriesFor, loadEnvironmentContract } = require('./environmentContract.cjs');

const rootDir = path.resolve(__dirname, '..');

const targets = {
	beta: {
		prefix: 'BETA_',
		contractEnvironment: 'development',
		rootFile: '.env.beta',
		functionsFile: 'functions/.env.beta',
		legacyRootFiles: ['.env.beta', '.env.development.local', '.env.local'],
		legacyFunctionsFiles: ['functions/.env.beta', 'functions/.env.local'],
		projectId: 'maintleybeta',
		stripePrefix: 'pk_test_',
	},
	local: {
		prefix: 'LOCAL_',
		contractEnvironment: 'development',
		rootFile: '.env.local',
		functionsFile: 'functions/.env.local',
		legacyRootFiles: ['.env.local', '.env.development.local'],
		legacyFunctionsFiles: ['functions/.env.local', 'functions/.env.beta'],
		projectId: 'maintleybeta',
		stripePrefix: 'pk_test_',
	},
	production: {
		prefix: 'PROD_',
		contractEnvironment: 'production',
		rootFile: '.env.prod',
		functionsFile: 'functions/.env.prod',
		legacyRootFiles: ['.env.prod', '.env.production'],
		legacyFunctionsFiles: ['functions/.env.prod'],
		projectId: 'mypropertymanager-cda42',
		stripePrefix: 'pk_live_',
	},
};

function readFileValues(relativePath) {
	const absolutePath = path.join(rootDir, relativePath);
	return fs.existsSync(absolutePath)
		? parseDotenv(fs.readFileSync(absolutePath, 'utf8'))
		: new Map();
}

function valuesWithPrefix(values, prefix) {
	return new Map([...values]
		.filter(([name]) => name.startsWith(prefix))
		.map(([name, value]) => [name.slice(prefix.length), value]));
}

function resolveValue(entry, environment, sources) {
	for (const values of sources) {
		const direct = values.get(entry.name);
		if (String(direct || '').trim()) return direct;
		if (entry.source) {
			const source = values.get(entry.source);
			if (String(source || '').trim()) return source;
		}
	}
	return defaultFor(entry, environment) || entry.example || '';
}

function selectContractValues(entries, environment, predicate, sources) {
	return new Map(entriesFor(entries, environment, predicate)
		.map((entry) => [entry.name, resolveValue(entry, environment, sources)]));
}

function formatDotenv(title, values, entries = []) {
	const lines = [
		`# ${title}`,
		'# Generated from .env.example and the root .env control file. Do not edit directly.',
		'',
	];
	const sections = new Map(entries.map(({ name, section }) => [name, section]));
	let currentSection = '';
	for (const [key, value] of values) {
		const section = sections.get(key) || '';
		if (section && section !== currentSection) {
			if (currentSection) lines.push('');
			lines.push(`# ${section}`);
			currentSection = section;
		}
		lines.push(`${key}=${JSON.stringify(String(value || ''))}`);
	}
	return `${lines.join('\n')}\n`;
}

function formatControlDotenv(targetValues, targetEntries, secretEntries = new Map(), externalSecrets = {}) {
	const lines = [
		'# Maintley local environment control file',
		'# Generated structure: .env.example',
		'# Add non-secret values here, then run yarn env:organize --apply.',
		'# Firebase, GitHub, Android, and operational secrets stay in their secure delivery systems.',
		'',
	];
	for (const [targetName, definition] of Object.entries(targets)) {
		const targetLabel = targetName === 'production'
			? 'Production'
			: targetName === 'local' ? 'Local overrides' : 'Beta';
		lines.push(`# ${targetLabel} ---------------------------------------------------------------`);
		let currentSection = '';
		const entries = targetEntries.get(targetName);
		const values = targetValues.get(targetName);
		for (const entry of entries) {
			if (entry.section && entry.section !== currentSection) {
				if (currentSection) lines.push('');
				lines.push(`# ${entry.section}`);
				currentSection = entry.section;
			}
			lines.push(`${definition.prefix}${entry.name}=${JSON.stringify(String(values.get(entry.name) || ''))}`);
		}
		const secrets = secretEntries.get(targetName) || [];
		if (secrets.length) {
			lines.push('');
			lines.push('# Firebase-managed secrets (values are not stored in this file)');
			for (const entry of secrets) lines.push(`# ${entry.required ? 'Required' : 'Optional'}: ${entry.name}`);
		}
		lines.push('');
	}
	const localRequiredSecrets = externalSecrets.localRequired || [];
	if (localRequiredSecrets.length) {
		lines.push('# Local Android signing secrets (store values in .env.operations.local)');
		for (const entry of localRequiredSecrets) lines.push(`# ${entry.name}`);
		lines.push('');
	}
	const localOptionalSecrets = externalSecrets.localOptional || [];
	if (localOptionalSecrets.length) {
		lines.push('# Optional local tooling secrets (only needed when running the related script)');
		for (const entry of localOptionalSecrets) lines.push(`# ${entry.name}`);
		lines.push('');
	}
	const githubSecrets = externalSecrets.github || [];
	if (githubSecrets.length) {
		lines.push('# GitHub Actions secrets (store values in the matching GitHub environment)');
		for (const entry of githubSecrets) lines.push(`# ${entry.name}`);
		lines.push('');
	}
	return `${lines.join('\n').trimEnd()}\n`;
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

function selectLocalOverrideEntries(entries, localValues, betaValues) {
	return entries.filter((entry) => (
		entry.delivery === 'local-only' ||
		String(localValues.get(entry.name) || '') !== String(betaValues.get(entry.name) || '')
	));
}

function main() {
	try {
		const apply = process.argv.slice(2).includes('--apply');
		const contract = loadEnvironmentContract();
		const control = readFileValues('.env');
		const hasNamespacedControl = [...control.keys()].some((name) => /^(LOCAL|BETA|PROD)_/.test(name));
		const targetValues = new Map();
		const targetEntries = new Map();
		const resolvedTargets = new Map();
		const secretEntries = new Map();
		const outputs = [];

		for (const [targetName, definition] of Object.entries(targets)) {
			const environment = definition.contractEnvironment;
			const namespaced = valuesWithPrefix(control, definition.prefix);
			const legacyRoot = definition.legacyRootFiles.map(readFileValues);
			const legacyFunctions = definition.legacyFunctionsFiles.map(readFileValues);
			const legacyControl = !hasNamespacedControl && targetName === 'production' ? control : new Map();
			const inheritedBeta = targetName === 'local' ? resolvedTargets.get('beta') || new Map() : new Map();
			const sources = [namespaced, inheritedBeta, ...legacyRoot, ...legacyFunctions, legacyControl];
			const controlEntries = entriesFor(contract, environment, (entry) => (
				(entry.scope === 'web' && entry.delivery === 'github-variable') ||
				(targetName === 'local' && entry.scope === 'web' && entry.delivery === 'local-only') ||
				(entry.scope === 'functions' && entry.delivery === 'github-variable' && !entry.source) ||
				(targetName === 'local' && ['operations', 'sandbox'].includes(entry.scope) && entry.delivery === 'local-only')
			));
			const resolvedControl = new Map(controlEntries.map((entry) => [
				entry.name,
				resolveValue(entry, environment, sources),
			]));
			resolvedTargets.set(targetName, resolvedControl);
			const displayedControlEntries = targetName === 'local'
				? selectLocalOverrideEntries(controlEntries, resolvedControl, inheritedBeta)
				: controlEntries;
			targetEntries.set(targetName, displayedControlEntries);
			targetValues.set(targetName, new Map(displayedControlEntries.map((entry) => [entry.name, resolvedControl.get(entry.name)])));
			secretEntries.set(targetName, targetName === 'local' ? [] : entriesFor(
				contract,
				environment,
				(entry) => entry.scope === 'functions' && entry.delivery === 'firebase-secret',
			));

			const rootEntries = entriesFor(contract, environment, (entry) => (
				(entry.scope === 'web' && entry.delivery === 'github-variable') ||
				(targetName === 'local' && entry.scope === 'web' && entry.delivery === 'local-only') ||
				(targetName === 'local' && ['operations', 'sandbox'].includes(entry.scope) && entry.delivery === 'local-only')
			));
			const rootValues = new Map(rootEntries.map((entry) => [
				entry.name,
				resolveValue(entry, environment, [resolvedControl, ...sources]),
			]));
			validateEnvironment(rootValues, {
				projectId: definition.projectId,
				stripePrefix: definition.stripePrefix,
				label: targetName,
			});

			const functionEntries = entriesFor(contract, environment, (entry) => (
				entry.scope === 'functions' && entry.delivery === 'github-variable'
			));
			const functionValues = new Map(functionEntries.map((entry) => [
				entry.name,
				resolveValue(entry, environment, [resolvedControl, rootValues, ...sources]),
			]));
			outputs.push(
				{ path: definition.rootFile, contents: formatDotenv(`Maintley ${targetName} application configuration`, rootValues, rootEntries), count: rootValues.size },
				{ path: definition.functionsFile, contents: formatDotenv(`Maintley ${targetName} Functions configuration`, functionValues, functionEntries), count: functionValues.size },
			);
		}

		console.log(`Local environment organization ${apply ? 'apply' : 'dry-run'}:`);
		console.log(`- .env: ${[...targetEntries.values()].reduce((count, entries) => count + entries.length, 0)} namespaced non-secret entries`);
		for (const output of outputs) console.log(`- ${output.path}: ${output.count} values`);
		console.log('Values were intentionally omitted.');
		if (!apply) return;

		const uniqueByName = (entries) => [...new Map(entries.map((entry) => [entry.name, entry])).values()];
		const externalSecrets = {
			localRequired: uniqueByName(contract.filter((entry) => entry.delivery === 'local-secret' && entry.scope === 'android')),
			localOptional: uniqueByName(contract.filter((entry) => entry.delivery === 'local-secret' && entry.scope !== 'android')),
			github: uniqueByName(contract.filter((entry) => entry.delivery === 'github-secret')),
		};
		fs.writeFileSync(
			path.join(rootDir, '.env'),
			formatControlDotenv(targetValues, targetEntries, secretEntries, externalSecrets),
			'utf8',
		);
		for (const output of outputs) fs.writeFileSync(path.join(rootDir, output.path), output.contents, 'utf8');
		console.log('Local environment control and generated target files organized successfully.');
	} catch (error) {
		console.error(`Local environment organization failed: ${error.message}`);
		process.exit(1);
	}
}

if (require.main === module) main();

module.exports = {
	formatControlDotenv,
	formatDotenv,
	resolveValue,
	selectLocalOverrideEntries,
	selectContractValues,
	targets,
	validateEnvironment,
	valuesWithPrefix,
};
