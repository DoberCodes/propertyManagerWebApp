#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_PATH = path.join(ROOT, 'package.json');
const DEFAULT_SERVICE_ACCOUNT_PATH = path.join(ROOT, 'serviceAccountKey.json');
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

const parseArgs = (argv) => {
	const options = {
		dryRun: false,
		json: false,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === '--version') {
			options.version = argv[index + 1];
			index += 1;
		} else if (arg === '--release-notes') {
			options.releaseNotes = argv[index + 1];
			index += 1;
		} else if (arg === '--release-notes-file') {
			options.releaseNotesFile = argv[index + 1];
			index += 1;
		} else if (arg === '--apk-url') {
			options.apkUrl = argv[index + 1];
			index += 1;
		} else if (arg === '--release-url') {
			options.releaseUrl = argv[index + 1];
			index += 1;
		} else if (arg === '--dry-run') {
			options.dryRun = true;
		} else if (arg === '--json') {
			options.json = true;
		} else {
			throw new Error(`Unknown option: ${arg}`);
		}
	}

	return options;
};

const readPackageVersion = () => {
	const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
	return String(packageJson.version || '').trim();
};

const readReleaseNotes = (options) => {
	if (options.releaseNotesFile) {
		return fs.readFileSync(path.resolve(ROOT, options.releaseNotesFile), 'utf8').trim();
	}
	return String(options.releaseNotes || 'Maintley has a new version available.').trim();
};

const loadCredential = () => {
	if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
		return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
	}

	const credentialPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
		? path.resolve(ROOT, process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
		: DEFAULT_SERVICE_ACCOUNT_PATH;

	if (!fs.existsSync(credentialPath)) {
		throw new Error(
			'Firebase service account credentials were not found. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH, or provide serviceAccountKey.json.',
		);
	}

	return JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
};

const initializeFirebase = () => {
	if (admin.apps.length > 0) return;
	const serviceAccount = loadCredential();

	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
	});
};

const main = async () => {
	const options = parseArgs(process.argv.slice(2));
	const version = String(options.version || readPackageVersion()).replace(/^v/, '').trim();
	const releaseNotes = readReleaseNotes(options);

	if (!SEMVER_PATTERN.test(version)) {
		throw new Error(`Invalid app version: ${version}`);
	}

	const update = {
		version,
		releaseDate: new Date().toISOString(),
		releaseNotes,
		updatedAt: new Date().toISOString(),
	};

	if (options.apkUrl) {
		update.apkUrl = options.apkUrl;
	}

	if (options.releaseUrl) {
		update.releaseUrl = options.releaseUrl;
	}

	if (options.dryRun) {
		const result = { dryRun: true, path: 'appConfig/version', update };
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		return;
	}

	initializeFirebase();
	const db = admin.firestore();
	const versionRef = db.collection('appConfig').doc('version');
	const currentDoc = await versionRef.get();
	const previousVersion = currentDoc.exists ? currentDoc.data().version : null;

	await versionRef.set(
		{
			...update,
			previousVersion,
		},
		{ merge: true },
	);

	const result = {
		published: true,
		path: 'appConfig/version',
		version,
		previousVersion,
	};

	if (options.json) {
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		return;
	}

	console.log(`Published appConfig/version for Maintley v${version}.`);
};

main().catch((error) => {
	process.stderr.write(`App version publish failed: ${error.message}\n`);
	process.exit(1);
});
