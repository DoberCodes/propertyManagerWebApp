#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_PATH = path.join(ROOT, 'package.json');
const CLIENT_PACKAGE_PATH = path.join(ROOT, 'client', 'package.json');
const ANDROID_BUILD_GRADLE_PATH = path.join(ROOT, 'android', 'app', 'build.gradle');

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
		} else if (arg === '--metadata') {
			options.metadata = argv[index + 1];
			index += 1;
		} else if (arg === '--version-code') {
			options.versionCode = Number(argv[index + 1]);
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

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const writeJson = (filePath, value, dryRun) => {
	if (dryRun) return;
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, '\t')}\n`, 'utf8');
};

const getMetadataVersion = (metadataPath) => {
	if (!metadataPath) return '';
	const resolved = path.resolve(ROOT, metadataPath);
	const metadata = readJson(resolved);
	return String(metadata.version || '').trim();
};

const readAndroidVersion = () => {
	const content = fs.readFileSync(ANDROID_BUILD_GRADLE_PATH, 'utf8');
	const codeMatch = content.match(/\bversionCode\s+(\d+)/);
	const nameMatch = content.match(/\bversionName\s+"([^"]+)"/);

	if (!codeMatch || !nameMatch) {
		throw new Error('Could not read Android versionCode/versionName from android/app/build.gradle.');
	}

	return {
		content,
		versionCode: Number(codeMatch[1]),
		versionName: nameMatch[1],
	};
};

const updateAndroidVersion = ({ content, versionCode, versionName }, nextVersion, requestedVersionCode) => {
	const nextVersionCode =
		Number.isInteger(requestedVersionCode) && requestedVersionCode > 0
			? requestedVersionCode
			: versionName === nextVersion
				? versionCode
				: versionCode + 1;

	const nextContent = content
		.replace(/\bversionCode\s+\d+/, `versionCode ${nextVersionCode}`)
		.replace(/\bversionName\s+"[^"]+"/, `versionName "${nextVersion}"`);

	return {
		content: nextContent,
		versionCode: nextVersionCode,
	};
};

const main = () => {
	const options = parseArgs(process.argv.slice(2));
	const nextVersion = String(options.version || getMetadataVersion(options.metadata) || '').trim();

	if (!SEMVER_PATTERN.test(nextVersion)) {
		throw new Error('A valid --version or --metadata version is required, such as 2.8.0.');
	}

	const packageJson = readJson(PACKAGE_PATH);
	const clientPackageJson = readJson(CLIENT_PACKAGE_PATH);
	const androidVersion = readAndroidVersion();
	const nextAndroid = updateAndroidVersion(
		androidVersion,
		nextVersion,
		options.versionCode,
	);

	const changes = [];

	if (packageJson.version !== nextVersion) {
		changes.push({
			file: 'package.json',
			from: packageJson.version,
			to: nextVersion,
		});
		packageJson.version = nextVersion;
	}

	if (clientPackageJson.version !== nextVersion) {
		changes.push({
			file: 'client/package.json',
			from: clientPackageJson.version,
			to: nextVersion,
		});
		clientPackageJson.version = nextVersion;
	}

	if (
		androidVersion.versionName !== nextVersion ||
		androidVersion.versionCode !== nextAndroid.versionCode
	) {
		changes.push({
			file: 'android/app/build.gradle',
			from: `${androidVersion.versionName} (${androidVersion.versionCode})`,
			to: `${nextVersion} (${nextAndroid.versionCode})`,
		});
	}

	writeJson(PACKAGE_PATH, packageJson, options.dryRun);
	writeJson(CLIENT_PACKAGE_PATH, clientPackageJson, options.dryRun);
	if (!options.dryRun) {
		fs.writeFileSync(ANDROID_BUILD_GRADLE_PATH, nextAndroid.content, 'utf8');
	}

	const result = {
		version: nextVersion,
		versionCode: nextAndroid.versionCode,
		changed: changes.length > 0,
		changes,
		dryRun: options.dryRun,
	};

	if (options.json) {
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		return;
	}

	if (changes.length === 0) {
		console.log(`Release version ${nextVersion} is already prepared.`);
		return;
	}

	const prefix = options.dryRun ? 'Would prepare' : 'Prepared';
	console.log(`${prefix} release version ${nextVersion}:`);
	for (const change of changes) {
		console.log(`- ${change.file}: ${change.from} -> ${change.to}`);
	}
};

try {
	main();
} catch (error) {
	process.stderr.write(`Release version preparation failed: ${error.message}\n`);
	process.exit(1);
}
