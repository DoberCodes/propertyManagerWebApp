#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

function parseArgs(argv = process.argv.slice(2)) {
	const options = { project: '', dryRun: false };
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--project') options.project = String(argv[++index] || '').trim();
		else if (argument === '--dry-run') options.dryRun = true;
		else throw new Error(`Unknown argument: ${argument}`);
	}
	if (options.project !== 'maintleybeta') {
		throw new Error('Automatic invoker repair is restricted to maintleybeta.');
	}
	return options;
}

function selectPublicHttpFunctions(functions) {
	return functions
		.filter(
			(entry) =>
				entry &&
				(entry.callableTrigger || entry.httpsTrigger) &&
				entry.id &&
				entry.region,
		)
		.map((entry) => ({
			id: entry.id,
			platform: entry.platform,
			region: entry.region,
			runServiceId: entry.runServiceId || entry.id,
		}))
		.sort((left, right) => left.id.localeCompare(right.id));
}

function commandForInvoker(entry, project) {
	if (entry.platform === 'gcfv2') {
		return [
			'run',
			'services',
			'add-iam-policy-binding',
			entry.runServiceId,
			`--region=${entry.region}`,
			`--project=${project}`,
			'--member=allUsers',
			'--role=roles/run.invoker',
			'--quiet',
		];
	}
	return [
		'functions',
		'add-iam-policy-binding',
		entry.id,
		`--region=${entry.region}`,
		`--project=${project}`,
		'--member=allUsers',
		'--role=roles/cloudfunctions.invoker',
		'--quiet',
	];
}

function runJsonCommand(command, args) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
		windowsHide: true,
		maxBuffer: 20 * 1024 * 1024,
	});
	if (result.status !== 0) {
		const detail = String(result.stderr || result.stdout || '').trim().slice(0, 800);
		throw new Error(`${command} failed: ${detail || `status ${result.status}`}`);
	}
	return JSON.parse(result.stdout);
}

function runCommand(command, args) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
		windowsHide: true,
		maxBuffer: 5 * 1024 * 1024,
	});
	if (result.status !== 0) {
		const detail = String(result.stderr || result.stdout || '').trim().slice(0, 800);
		throw new Error(`${command} failed: ${detail || `status ${result.status}`}`);
	}
}

function main() {
	try {
		const options = parseArgs();
		const firebaseScript = path.join(
			rootDir,
			'node_modules',
			'firebase-tools',
			'lib',
			'bin',
			'firebase.js',
		);
		const gcloudExecutable = process.platform === 'win32' ? 'gcloud.cmd' : 'gcloud';
		const inventory = runJsonCommand(process.execPath, [
			firebaseScript,
			'functions:list',
			'--project',
			options.project,
			'--json',
		]);
		const functions = selectPublicHttpFunctions(inventory.result || []);
		if (!functions.length) throw new Error('No HTTPS or callable Functions were found.');
		for (const entry of functions) {
			const args = commandForInvoker(entry, options.project);
			if (!options.dryRun) runCommand(gcloudExecutable, args);
		}
		console.log(
			`${options.dryRun ? 'Would ensure' : 'Ensured'} public infrastructure invocation for ${functions.length} Maintley Beta HTTPS/callable Functions.`,
		);
	} catch (error) {
		console.error(`Firebase Function invoker repair failed: ${error.message}`);
		process.exit(1);
	}
}

if (require.main === module) main();

module.exports = {
	commandForInvoker,
	parseArgs,
	selectPublicHttpFunctions,
};
