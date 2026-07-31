#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

function parseArgs(argv = process.argv.slice(2)) {
	const options = { project: '', firebaseBin: '' };
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--project') options.project = String(argv[++index] || '').trim();
		else if (argument === '--firebase-bin') options.firebaseBin = String(argv[++index] || '').trim();
		else throw new Error(`Unknown argument: ${argument}`);
	}
	if (options.project !== 'maintleybeta') {
		throw new Error('Development secret validation is restricted to maintleybeta.');
	}
	return options;
}

function validateDevelopmentStripeSecret(secretValue) {
	const value = String(secretValue || '').trim();
	if (!value.startsWith('sk_test_')) {
		throw new Error(
			'Maintley Beta requires a Stripe test-mode secret (sk_test_...). A live Stripe key is not permitted.',
		);
	}
}

function summarizeFailure(result) {
	const text = `${result.stderr || ''}\n${result.stdout || ''}`
		.replace(/\u001b\[[0-9;]*m/g, '')
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.find((line) => /error|permission|denied|forbidden|failed|unauthenticated/i.test(line));
	return text || `Firebase CLI exited with status ${result.status ?? 'unknown'}`;
}

function readFirebaseSecret({ project, name, firebaseBin }) {
	const firebaseScript =
		firebaseBin ||
		path.join(
			rootDir,
			'node_modules',
			'firebase-tools',
			'lib',
			'bin',
			'firebase.js',
		);
	const result = spawnSync(
		process.execPath,
		[firebaseScript, 'functions:secrets:access', name, '--project', project],
		{ cwd: rootDir, encoding: 'utf8', windowsHide: true },
	);
	if (result.status !== 0) {
		throw new Error(`Unable to validate ${name}: ${summarizeFailure(result)}`);
	}
	return String(result.stdout || '').trim();
}

function main() {
	try {
		const options = parseArgs();
		const stripeSecret = readFirebaseSecret({
			project: options.project,
			name: 'STRIPE_SECRET_KEY',
			firebaseBin: options.firebaseBin,
		});
		validateDevelopmentStripeSecret(stripeSecret);
		console.log(
			'Maintley Beta Firebase secret validation passed: Stripe is in test mode. Secret contents were omitted.',
		);
	} catch (error) {
		console.error(`Development Firebase secret validation failed: ${error.message}`);
		process.exit(1);
	}
}

if (require.main === module) main();

module.exports = {
	parseArgs,
	readFirebaseSecret,
	summarizeFailure,
	validateDevelopmentStripeSecret,
};
