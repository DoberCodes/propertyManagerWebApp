const fs = require('fs');
const path = require('path');
const { loadEnvironmentContract } = require('./environmentContract.cjs');

function parseDotenvAssignments(contents) {
	const values = new Map();
	for (const rawLine of String(contents || '').split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;
		const separator = line.indexOf('=');
		if (separator < 1) continue;
		const name = line.slice(0, separator).trim();
		let value = line.slice(separator + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		values.set(name, value.trim());
	}
	return values;
}

function findPlaintextSecretAssignments({ functionsDir, secretNames }) {
	if (!fs.existsSync(functionsDir)) return [];
	const dotenvFiles = fs
		.readdirSync(functionsDir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.startsWith('.env'))
		.map((entry) => path.join(functionsDir, entry.name));
	const findings = [];
	for (const filePath of dotenvFiles) {
		const values = parseDotenvAssignments(fs.readFileSync(filePath, 'utf8'));
		for (const secretName of secretNames) {
			if (String(values.get(secretName) || '').trim()) {
				findings.push({ filePath, secretName });
			}
		}
	}
	return findings;
}

function removeSecretAssignments(contents, secretNames) {
	const secretSet = new Set(secretNames);
	return String(contents || '')
		.split(/\r?\n/)
		.filter((rawLine) => {
			const line = rawLine.trim();
			if (!line || line.startsWith('#')) return true;
			const separator = line.indexOf('=');
			if (separator < 1) return true;
			return !secretSet.has(line.slice(0, separator).trim());
		})
		.join('\n');
}

function sanitizeFunctionsDotenvSecrets({ functionsDir, entries = loadEnvironmentContract() }) {
	const secretNames = entries
		.filter(
			(entry) =>
				entry.scope === 'functions' && entry.delivery === 'firebase-secret',
		)
		.map((entry) => entry.name);
	const findings = findPlaintextSecretAssignments({ functionsDir, secretNames });
	const affectedFiles = [...new Set(findings.map(({ filePath }) => filePath))];
	for (const filePath of affectedFiles) {
		const existing = fs.readFileSync(filePath, 'utf8');
		fs.writeFileSync(
			filePath,
			removeSecretAssignments(existing, secretNames),
			'utf8',
		);
	}
	return findings;
}

function validateNoPlaintextFirebaseSecrets({
	functionsDir,
	entries = loadEnvironmentContract(),
} = {}) {
	const secretNames = entries
		.filter(
			(entry) =>
				entry.scope === 'functions' && entry.delivery === 'firebase-secret',
		)
		.map((entry) => entry.name);
	const findings = findPlaintextSecretAssignments({ functionsDir, secretNames });
	if (!findings.length) return;
	const details = findings
		.map(
			({ filePath, secretName }) =>
				`${path.relative(path.resolve(functionsDir, '..'), filePath)}:${secretName}`,
		)
		.join(', ');
	throw new Error(
		`Firebase Secret Manager values must not be present in Functions dotenv files (${details}). ` +
			'Use project-specific Firebase secrets; use functions/.secret.local only for emulator overrides.',
	);
}

module.exports = {
	findPlaintextSecretAssignments,
	parseDotenvAssignments,
	removeSecretAssignments,
	sanitizeFunctionsDotenvSecrets,
	validateNoPlaintextFirebaseSecrets,
};

if (require.main === module) {
	const functionsDir = path.resolve(__dirname, '..', 'functions');
	if (!process.argv.includes('--sanitize')) {
		console.error('Use --sanitize to remove Firebase Secret Manager values from Functions dotenv files.');
		process.exit(1);
	}
	const findings = sanitizeFunctionsDotenvSecrets({ functionsDir });
	console.log(
		`Removed ${findings.length} plaintext secret assignments from Functions dotenv files. Secret contents were omitted.`,
	);
}
