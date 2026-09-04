#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const SEMVER_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)$/;

function parseVersion(value) {
	const match = String(value || '').trim().match(SEMVER_PATTERN);
	if (!match) throw new Error(`Invalid release version: ${value || '(missing)'}`);
	return match.slice(1).map(Number);
}

function compareVersions(left, right) {
	const leftParts = parseVersion(left);
	const rightParts = parseVersion(right);
	for (let index = 0; index < leftParts.length; index += 1) {
		if (leftParts[index] !== rightParts[index]) {
			return leftParts[index] - rightParts[index];
		}
	}
	return 0;
}

function readMetadata(filePath) {
	if (!filePath) return null;
	const resolved = path.resolve(filePath);
	const metadata = JSON.parse(fs.readFileSync(resolved, 'utf8'));
	parseVersion(metadata.version);
	const pullRequests = Number(metadata.counts?.pullRequests);
	if (!Number.isInteger(pullRequests) || pullRequests < 0) {
		throw new Error(`Invalid pull request count in ${filePath}.`);
	}
	return { pullRequests, version: String(metadata.version).replace(/^v/, '') };
}

function resolveBetaVersion({ baseMetadata = null, candidateMetadata }) {
	if (!candidateMetadata) throw new Error('Candidate release metadata is required.');
	const version =
		baseMetadata && compareVersions(baseMetadata.version, candidateMetadata.version) > 0
			? baseMetadata.version
			: candidateMetadata.version;
	const sequence = baseMetadata
		? baseMetadata.pullRequests + 1
		: candidateMetadata.pullRequests;

	return {
		label: `v${version}-beta.${sequence}`,
		sequence,
		version,
	};
}

function parseArgs(argv) {
	const options = { baseMetadata: '', candidateMetadata: '', output: '' };
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--base-metadata') options.baseMetadata = argv[++index] || '';
		else if (argument === '--candidate-metadata') {
			options.candidateMetadata = argv[++index] || '';
		} else if (argument === '--output') options.output = argv[++index] || '';
		else throw new Error(`Unknown argument: ${argument}`);
	}
	if (!options.candidateMetadata) {
		throw new Error('Missing required --candidate-metadata argument.');
	}
	if (!options.output) throw new Error('Missing required --output argument.');
	return options;
}

function main() {
	try {
		const options = parseArgs(process.argv.slice(2));
		const result = resolveBetaVersion({
			baseMetadata: readMetadata(options.baseMetadata),
			candidateMetadata: readMetadata(options.candidateMetadata),
		});
		fs.mkdirSync(path.dirname(path.resolve(options.output)), { recursive: true });
		fs.writeFileSync(path.resolve(options.output), `${JSON.stringify(result, null, 2)}\n`);
		console.log(`Resolved Maintley ${result.label}.`);
	} catch (error) {
		console.error(`Beta version resolution failed: ${error.message}`);
		process.exit(1);
	}
}

if (require.main === module) main();

module.exports = {
	compareVersions,
	parseVersion,
	resolveBetaVersion,
};
