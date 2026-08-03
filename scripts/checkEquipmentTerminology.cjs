#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(repositoryRoot, 'src');
const sourceExtensions = new Set(['.ts', '.tsx']);

// These patterns identify the legacy entity name, not normal descriptions such
// as "security system" or the real-world Appliances equipment category.
const prohibitedPatterns = [
	{ label: 'system record', pattern: /\bsystem records?\b/i },
	{ label: 'review systems', pattern: /\breview systems\b/i },
	{ label: 'mixed equipment label', pattern: /\bappliances\s*(?:&|and)\s*systems\b/i },
	{ label: 'standalone Systems label', pattern: /(['"`])systems\1/i },
	{ label: 'standalone Systems JSX label', pattern: />\s*systems\s*</i },
];

// Persisted report category IDs remain `systems` for backwards compatibility.
// These shapes classify the identifier without exempting visible `label` copy.
const permittedTechnicalPatterns = [
	/^\s*\|\s*'systems'\s*$/,
	/^\s*id:\s*'systems',\s*$/,
	/^\s*(?!label:)(?:[\w]+|'[^']+'):\s*'systems',\s*$/,
];

const listSourceFiles = (directory) =>
	fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = path.join(directory, entry.name);
		if (entry.isDirectory()) return listSourceFiles(fullPath);
		return sourceExtensions.has(path.extname(entry.name)) ? [fullPath] : [];
	});

const scanSource = (source, relativePath = 'source') => {
	const failures = [];
	source.split(/\r?\n/).forEach((line, index) => {
		if (permittedTechnicalPatterns.some((pattern) => pattern.test(line))) return;
		for (const { label, pattern } of prohibitedPatterns) {
			if (pattern.test(line)) {
				failures.push(`${relativePath}:${index + 1}: ${label}: ${line.trim()}`);
			}
		}
	});
	return failures;
};

const run = () => {
	const failures = listSourceFiles(sourceRoot).flatMap((filePath) =>
		scanSource(
			fs.readFileSync(filePath, 'utf8'),
			path.relative(repositoryRoot, filePath).split(path.sep).join('/'),
		),
	);

	if (failures.length > 0) {
		console.error(
			'Equipment terminology validation failed. Use Equipment for the user-facing record while preserving legacy technical identifiers.',
		);
		for (const failure of failures) console.error(`- ${failure}`);
		process.exitCode = 1;
		return failures;
	}

	console.log('Equipment terminology validation passed.');
	return [];
};

if (require.main === module) run();

module.exports = {
	prohibitedPatterns,
	permittedTechnicalPatterns,
	run,
	scanSource,
};
