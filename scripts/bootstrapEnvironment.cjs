#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { defaultFor, entriesFor, loadEnvironmentContract } = require('./environmentContract.cjs');
const { parseDotenv, environmentConfigs } = require('./syncGitHubEnvironment.cjs');

const rootDir = path.resolve(__dirname, '..');

function parseArgs(argv = process.argv.slice(2)) {
	const options = { environment: 'all', apply: false, strict: false, checkSecrets: false };
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--environment') options.environment = String(argv[++index] || '').trim();
		else if (argument === '--apply') options.apply = true;
		else if (argument === '--strict') options.strict = true;
		else if (argument === '--check-secrets') options.checkSecrets = true;
		else throw new Error(`Unknown argument: ${argument}`);
	}
	if (!['all', 'development', 'production'].includes(options.environment)) {
		throw new Error('--environment must be development, production, or all.');
	}
	return options;
}

function readValues(relativePath) {
	const absolutePath = path.resolve(rootDir, relativePath);
	return fs.existsSync(absolutePath) ? parseDotenv(fs.readFileSync(absolutePath, 'utf8')) : new Map();
}

function readGitHubVariableOverrides(environment, serialized = process.env.MAINTLEY_GITHUB_VARIABLES_JSON) {
	if (!String(serialized || '').trim()) return new Map();
	const prefix = environment === 'production' ? 'PROD_' : 'DEV_';
	const parsed = JSON.parse(serialized);
	return new Map(Object.entries(parsed)
		.filter(([name, value]) => name.startsWith(prefix) && String(value || '').trim())
		.map(([name, value]) => [name.slice(prefix.length), String(value)]));
}

function resolveEntryValue(entry, environment, sources) {
	for (const values of sources) {
		const direct = values.get(entry.name);
		if (String(direct || '').trim()) return direct;
		if (entry.source) {
			const sourceValue = values.get(entry.source);
			if (String(sourceValue || '').trim()) return sourceValue;
		}
	}
	return defaultFor(entry, environment) || entry.example || '';
}

function buildFunctionValues(entries, environment, sources) {
	const values = new Map();
	const missing = [];
	for (const entry of entriesFor(
		entries,
		environment,
		(candidate) => candidate.scope === 'functions' && candidate.delivery === 'github-variable',
	)) {
		const value = resolveEntryValue(entry, environment, sources);
		values.set(entry.name, value);
		if (entry.required && !String(value || '').trim()) missing.push(entry.name);
	}
	return { values, missing };
}

function formatDotenv(environment, values, entries = []) {
	const lines = [
		`# Generated Maintley ${environment} Functions configuration.`,
		'# Source contract: ../.env.example',
		'# Non-secret values only. Generated file; regenerate with yarn env:bootstrap.',
		'',
	];
	const sections = new Map(entries.map(({ name, section }) => [name, section]));
	let currentSection = '';
	for (const [name, value] of values) {
		const section = sections.get(name) || '';
		if (section && section !== currentSection) {
			if (currentSection) lines.push('');
			lines.push(`# ${section}`);
			currentSection = section;
		}
		lines.push(`${name}=${JSON.stringify(String(value || ''))}`);
	}
	return `${lines.join('\n')}\n`;
}

function checkFirebaseSecrets(entries, environment) {
	const alias = environment === 'production' ? 'prod' : 'beta';
	const firebaseBin = path.join(rootDir, 'functions', 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
	if (!fs.existsSync(firebaseBin)) throw new Error('Firebase CLI is not installed under functions/node_modules.');
	const required = entriesFor(
		entries,
		environment,
		(entry) => entry.scope === 'functions' && entry.delivery === 'firebase-secret' && entry.required,
	);
	const missing = [];
	const verificationFailures = [];
	for (const entry of required) {
		const result = spawnSync(process.execPath, [firebaseBin, 'functions:secrets:get', entry.name, '--project', alias], {
			cwd: rootDir,
			encoding: 'utf8',
			windowsHide: true,
		});
		if (result.status === 0) continue;
		const detail = summarizeFirebaseCommandFailure(result);
		if (/\b404\b|not found|does not exist/i.test(detail)) missing.push(entry.name);
		else verificationFailures.push({ name: entry.name, detail });
	}
	return { missing, verificationFailures };
}

function summarizeFirebaseCommandFailure(result) {
	const lines = `${result.stderr || ''}\n${result.stdout || ''}`
		.replace(/\u001b\[[0-9;]*m/g, '')
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
	const useful = lines.find((line) => /error|permission|denied|forbidden|failed|unauthenticated/i.test(line));
	return String(useful || `Firebase CLI exited with status ${result.status ?? 'unknown'}`).slice(0, 500);
}

function environmentFiles(environment) {
	const config = environmentConfigs[environment];
	return {
		react: config.defaultReactFile,
		functions: config.defaultFunctionsFile,
	};
}

function runEnvironment(entries, environment, options) {
	const files = environmentFiles(environment);
	const existing = readValues(files.functions);
	const react = readValues(files.react);
	const legacyProduction = environment === 'production' ? readValues('functions/.env') : new Map();
	const overrides = readGitHubVariableOverrides(environment);
	const functionEntries = entriesFor(
		entries,
		environment,
		(entry) => entry.scope === 'functions' && entry.delivery === 'github-variable',
	);
	const { values, missing } = buildFunctionValues(entries, environment, [overrides, existing, react, legacyProduction]);
	if (options.apply) {
		fs.writeFileSync(path.resolve(rootDir, files.functions), formatDotenv(environment, values, functionEntries), 'utf8');
	}
	const secretCheck = options.checkSecrets
		? checkFirebaseSecrets(entries, environment)
		: { missing: [], verificationFailures: [] };
	const missingSecrets = secretCheck.missing;
	console.log(`${environment}: ${options.apply ? 'generated' : 'dry-run'} ${files.functions}`);
	console.log(`- configured non-secret Functions values: ${values.size - missing.length}`);
	console.log(`- missing required non-secret values: ${missing.length}`);
	for (const name of missing) console.log(`  - ${name}`);
	if (options.checkSecrets) {
		console.log(`- missing required Firebase secrets: ${missingSecrets.length}`);
		for (const name of missingSecrets) console.log(`  - ${name}`);
		console.log(`- Firebase secret verification failures: ${secretCheck.verificationFailures.length}`);
		for (const { name, detail } of secretCheck.verificationFailures) console.log(`  - ${name}: ${detail}`);
	} else {
		console.log('- Firebase secrets: not checked (use --check-secrets)');
	}
	return { missing, missingSecrets, secretVerificationFailures: secretCheck.verificationFailures };
}

function main() {
	try {
		const options = parseArgs();
		const entries = loadEnvironmentContract();
		const environments = options.environment === 'all' ? ['development', 'production'] : [options.environment];
		const results = environments.map((environment) => runEnvironment(entries, environment, options));
		console.log('Values and secret contents were intentionally omitted.');
		if (options.strict && results.some(({ missing, missingSecrets, secretVerificationFailures }) => (
			missing.length || missingSecrets.length || secretVerificationFailures.length
		))) {
			throw new Error('Environment readiness validation found missing required configuration.');
		}
	} catch (error) {
		console.error(`Environment bootstrap failed: ${error.message}`);
		process.exit(1);
	}
}

if (require.main === module) main();

module.exports = {
	buildFunctionValues,
	formatDotenv,
	parseArgs,
	readGitHubVariableOverrides,
	resolveEntryValue,
	summarizeFirebaseCommandFailure,
};
