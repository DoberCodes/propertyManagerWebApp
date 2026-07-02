const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const requiredVariables = [
	'REACT_APP_FIREBASE_API_KEY',
	'REACT_APP_FIREBASE_AUTH_DOMAIN',
	'REACT_APP_FIREBASE_PROJECT_ID',
	'REACT_APP_FIREBASE_STORAGE_BUCKET',
	'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
	'REACT_APP_FIREBASE_APP_ID',
	'REACT_APP_STRIPE_PUBLIC_KEY',
];

const placeholderPatterns = [
	/^YOUR_/i,
	/^REPLACE_/i,
	/^TODO$/i,
	/^changeme$/i,
	/^example$/i,
];

const envFiles = [
	'.env',
	'.env.local',
	'.env.production',
	'.env.production.local',
];

const parseEnvLine = (line) => {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith('#')) {
		return null;
	}

	const separatorIndex = trimmed.indexOf('=');
	if (separatorIndex === -1) {
		return null;
	}

	const key = trimmed.slice(0, separatorIndex).trim();
	let value = trimmed.slice(separatorIndex + 1).trim();

	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		value = value.slice(1, -1);
	}

	return { key, value };
};

const loadLocalEnvFiles = () => {
	for (const fileName of envFiles) {
		const filePath = path.join(rootDir, fileName);
		if (!fs.existsSync(filePath)) {
			continue;
		}

		const contents = fs.readFileSync(filePath, 'utf8');
		for (const line of contents.split(/\r?\n/)) {
			const parsed = parseEnvLine(line);
			if (!parsed || process.env[parsed.key] !== undefined) {
				continue;
			}

			process.env[parsed.key] = parsed.value;
		}
	}
};

const isPlaceholder = (value) =>
	placeholderPatterns.some((pattern) => pattern.test(value.trim()));

loadLocalEnvFiles();

const missing = [];
const placeholders = [];

for (const name of requiredVariables) {
	const value = process.env[name]?.trim();
	if (!value) {
		missing.push(name);
		continue;
	}

	if (isPlaceholder(value)) {
		placeholders.push(name);
	}
}

if (missing.length || placeholders.length) {
	console.error('Frontend environment validation failed.');

	if (missing.length) {
		console.error('\nMissing required variables:');
		for (const name of missing) {
			console.error(`- ${name}`);
		}
	}

	if (placeholders.length) {
		console.error('\nVariables still using placeholder values:');
		for (const name of placeholders) {
			console.error(`- ${name}`);
		}
	}

	console.error(
		'\nSet the production GitHub Actions secrets or local .env values before building.',
	);
	process.exit(1);
}

console.log('Frontend environment variables validated.');
