#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_PATH = path.join(ROOT, 'package.json');
const CLIENT_PACKAGE_PATH = path.join(ROOT, 'client', 'package.json');
const ANDROID_BUILD_GRADLE_PATH = path.join(ROOT, 'android', 'app', 'build.gradle');
const VERSION_CHECK_PATH = path.join(ROOT, 'src', 'utils', 'versionCheck.ts');

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const readAndroidVersion = () => {
	const content = fs.readFileSync(ANDROID_BUILD_GRADLE_PATH, 'utf8');
	const codeMatch = content.match(/\bversionCode\s+(\d+)/);
	const nameMatch = content.match(/\bversionName\s+"([^"]+)"/);

	return {
		versionCode: codeMatch ? Number(codeMatch[1]) : null,
		versionName: nameMatch ? nameMatch[1] : null,
	};
};

const main = () => {
	const options = new Set(process.argv.slice(2));
	const packageVersion = String(readJson(PACKAGE_PATH).version || '');
	const clientPackageVersion = String(readJson(CLIENT_PACKAGE_PATH).version || '');
	const androidVersion = readAndroidVersion();
	const versionCheckContent = fs.readFileSync(VERSION_CHECK_PATH, 'utf8');
	const errors = [];

	if (!SEMVER_PATTERN.test(packageVersion)) {
		errors.push(`package.json version is not valid semver: ${packageVersion}`);
	}

	if (clientPackageVersion !== packageVersion) {
		errors.push(
			`client/package.json version ${clientPackageVersion} does not match package.json ${packageVersion}`,
		);
	}

	if (androidVersion.versionName !== packageVersion) {
		errors.push(
			`android versionName ${androidVersion.versionName || '(missing)'} does not match package.json ${packageVersion}`,
		);
	}

	if (!Number.isInteger(androidVersion.versionCode) || androidVersion.versionCode <= 0) {
		errors.push('android versionCode must be a positive integer.');
	}

	if (/const\s+CURRENT_APP_VERSION\s*=\s*['"`]/.test(versionCheckContent)) {
		errors.push('src/utils/versionCheck.ts still contains a hardcoded CURRENT_APP_VERSION.');
	}

	if (errors.length > 0) {
		if (options.has('--json')) {
			process.stdout.write(
				`${JSON.stringify({ valid: false, errors }, null, 2)}\n`,
			);
		} else {
			process.stderr.write(`Release version validation failed:\n`);
			for (const error of errors) {
				process.stderr.write(`- ${error}\n`);
			}
		}
		process.exit(1);
	}

	const result = {
		valid: true,
		version: packageVersion,
		versionCode: androidVersion.versionCode,
	};

	if (options.has('--json')) {
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		return;
	}

	console.log(
		`Release version ${packageVersion} is synchronized with Android versionCode ${androidVersion.versionCode}.`,
	);
};

main();
