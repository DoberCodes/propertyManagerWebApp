#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'config', 'github-environment-sync.json');

function parseDotenv(contents) {
	const values = new Map();
	for (const rawLine of String(contents || '').split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;
		const normalized = line.startsWith('export ') ? line.slice(7).trim() : line;
		const separator = normalized.indexOf('=');
		if (separator < 1) continue;
		const key = normalized.slice(0, separator).trim();
		if (!/^[A-Z][A-Z0-9_]*$/.test(key)) continue;
		let value = normalized.slice(separator + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		values.set(key, value);
	}
	return values;
}

function parseArgs(argv = process.argv.slice(2)) {
	const options = {
		environment: '',
		reactFile: '',
		functionsFile: '',
		apply: false,
		prune: false,
		confirmPrune: '',
		repository: '',
	};
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--apply') options.apply = true;
		else if (argument === '--prune') options.prune = true;
		else if (argument === '--environment') options.environment = String(argv[++index] || '').trim();
		else if (argument === '--file') options.reactFile = String(argv[++index] || '').trim();
		else if (argument === '--functions-file') options.functionsFile = String(argv[++index] || '').trim();
		else if (argument === '--confirm-prune') options.confirmPrune = String(argv[++index] || '').trim();
		else if (argument === '--repo') options.repository = String(argv[++index] || '').trim();
		else throw new Error(`Unknown argument: ${argument}`);
	}
	if (!options.environment) throw new Error('--environment is required.');
	if (options.prune && !options.apply) throw new Error('--prune requires --apply.');
	if (options.prune && options.confirmPrune !== options.environment) {
		throw new Error(`--prune requires --confirm-prune ${options.environment}.`);
	}
	return options;
}

function readEnvFile(fileName, label) {
	const absolutePath = path.resolve(rootDir, fileName);
	if (!fs.existsSync(absolutePath)) throw new Error(`${label} file does not exist: ${fileName}`);
	return parseDotenv(fs.readFileSync(absolutePath, 'utf8'));
}

function buildDesiredVariables({ reactValues, functionValues, manifest, environmentConfig }) {
	const missing = manifest.requiredReactKeys.filter((key) => !String(reactValues.get(key) || '').trim());
	if (missing.length) throw new Error(`React environment is incomplete. Missing: ${missing.join(', ')}`);

	const actualProject = String(reactValues.get('REACT_APP_FIREBASE_PROJECT_ID') || '').trim();
	if (actualProject !== environmentConfig.firebaseProjectId) {
		throw new Error(
			`Firebase project mismatch. Expected ${environmentConfig.firebaseProjectId}; found ${actualProject || 'empty'}.`,
		);
	}
	const stripeKey = String(reactValues.get('REACT_APP_STRIPE_PUBLIC_KEY') || '').trim();
	if (!stripeKey.startsWith(environmentConfig.stripePublishablePrefix)) {
		throw new Error(
			`Stripe mode mismatch. ${environmentConfig.githubEnvironment} requires ${environmentConfig.stripePublishablePrefix}.`,
		);
	}

	const desired = new Map();
	for (const [key, value] of reactValues) {
		if (!key.startsWith('REACT_APP_') || !String(value).trim()) continue;
		desired.set(`${environmentConfig.destinationPrefix}${key}`, value);
	}
	if (functionValues) {
		for (const key of manifest.functionVariableKeys) {
			const value = functionValues.get(key);
			if (value && String(value).trim()) desired.set(`${environmentConfig.destinationPrefix}${key}`, value);
		}
	}
	return desired;
}

function findFirebaseSecrets(values, manifest) {
	if (!values) return [];
	return manifest.firebaseSecretKeys.filter((key) => String(values.get(key) || '').trim());
}

function buildPlan({ desired, existingNames, destinationPrefix }) {
	const desiredNames = [...desired.keys()].sort();
	const managedExisting = [...existingNames]
		.filter((name) => name.startsWith(`${destinationPrefix}REACT_APP_`) || name.startsWith(`${destinationPrefix}STRIPE_`))
		.sort();
	const desiredSet = new Set(desiredNames);
	return {
		upsert: desiredNames,
		stale: managedExisting.filter((name) => !desiredSet.has(name)),
	};
}

function runGh(args, { input, allowFailure = false } = {}) {
	const result = spawnSync('gh', args, {
		cwd: rootDir,
		encoding: 'utf8',
		input,
		windowsHide: true,
	});
	if (result.status !== 0 && !allowFailure) {
		throw new Error(`GitHub CLI command failed: gh ${args.slice(0, 3).join(' ')}. ${String(result.stderr || '').trim()}`);
	}
	return result;
}

function ensureEnvironment(repository, environmentName) {
	const check = runGh(['api', `repos/${repository}/environments/${environmentName}`], { allowFailure: true });
	if (check.status === 0) return;
	runGh([
		'api',
		'--method',
		'PUT',
		`repos/${repository}/environments/${environmentName}`,
		'--input',
		'-',
	], { input: '{}' });
}

function environmentExists(repository, environmentName) {
	return runGh(['api', `repos/${repository}/environments/${environmentName}`], {
		allowFailure: true,
	}).status === 0;
}

function listEnvironmentVariableNames(repository, environmentName) {
	const result = runGh([
		'api',
		`repos/${repository}/environments/${environmentName}/variables?per_page=100`,
	]);
	const payload = JSON.parse(result.stdout || '{}');
	return new Set((payload.variables || []).map((variable) => variable.name));
}

function printPlan({ environmentName, reactFile, functionsFile, plan, secretNames, apply, prune }) {
	console.log(`GitHub environment sync ${apply ? 'apply' : 'dry-run'}: ${environmentName}`);
	console.log(`React source: ${reactFile}`);
	if (functionsFile) console.log(`Functions source: ${functionsFile}`);
	console.log(`Variables to upsert: ${plan.upsert.length}`);
	for (const name of plan.upsert) console.log(`- variable ${name}`);
	console.log(`Managed stale variables: ${plan.stale.length}`);
	for (const name of plan.stale) console.log(`- stale ${name}${prune ? ' (remove)' : ' (preserve)'}`);
	console.log(`Firebase-managed secrets detected: ${secretNames.length}`);
	for (const name of secretNames) console.log(`- Firebase Secret Manager: ${name}`);
	console.log('Values were intentionally omitted.');
}

function main() {
	try {
		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		const options = parseArgs();
		const environmentConfig = manifest.environments[options.environment];
		if (!environmentConfig) throw new Error(`Unsupported environment: ${options.environment}`);
		const repository = options.repository || manifest.repository;
		const reactFile = options.reactFile || environmentConfig.defaultReactFile;
		const reactValues = readEnvFile(reactFile, 'React environment');
		const functionValues = options.functionsFile
			? readEnvFile(options.functionsFile, 'Functions environment')
			: null;
		const desired = buildDesiredVariables({ reactValues, functionValues, manifest, environmentConfig });
		const firebaseSecretNames = findFirebaseSecrets(functionValues, manifest);

		let existingNames = new Set();
		if (options.apply) {
			ensureEnvironment(repository, environmentConfig.githubEnvironment);
			existingNames = listEnvironmentVariableNames(repository, environmentConfig.githubEnvironment);
		} else if (environmentExists(repository, environmentConfig.githubEnvironment)) {
			existingNames = listEnvironmentVariableNames(repository, environmentConfig.githubEnvironment);
		}
		const plan = buildPlan({
			desired,
			existingNames,
			destinationPrefix: environmentConfig.destinationPrefix,
		});
		printPlan({
			environmentName: environmentConfig.githubEnvironment,
			reactFile,
			functionsFile: options.functionsFile,
			plan,
			secretNames: firebaseSecretNames,
			apply: options.apply,
			prune: options.prune,
		});
		if (!options.apply) return;

		for (const name of plan.upsert) {
			runGh([
				'variable',
				'set',
				name,
				'--env',
				environmentConfig.githubEnvironment,
				'--repo',
				repository,
			], { input: desired.get(name) });
		}
		if (options.prune) {
			for (const name of plan.stale) {
				runGh([
					'variable',
					'delete',
					name,
					'--env',
					environmentConfig.githubEnvironment,
					'--repo',
					repository,
				]);
			}
		}
		const verifiedNames = listEnvironmentVariableNames(repository, environmentConfig.githubEnvironment);
		const missingAfterApply = plan.upsert.filter((name) => !verifiedNames.has(name));
		if (missingAfterApply.length) throw new Error(`GitHub verification failed for: ${missingAfterApply.join(', ')}`);
		console.log(`GitHub environment sync completed for ${environmentConfig.githubEnvironment}.`);
	} catch (error) {
		console.error(`GitHub environment sync failed: ${error.message}`);
		process.exit(1);
	}
}

if (require.main === module) main();

module.exports = {
	buildDesiredVariables,
	buildPlan,
	findFirebaseSecrets,
	parseArgs,
	parseDotenv,
};
