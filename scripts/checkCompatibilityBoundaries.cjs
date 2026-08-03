#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(repositoryRoot, 'src');
const sourceExtensions = new Set(['.ts', '.tsx']);

const ACCOUNT_CONTEXT_PATH = 'src/Redux/API/accountContext.ts';
const PROPERTY_MEMORY_ADAPTER_PATH =
	'src/propertyKnowledge/propertyMemoryRecordService.ts';
const LEGACY_HISTORY_READER_PATHS = new Set([
	'src/Redux/API/maintenanceSlice.tsx',
	'src/Redux/API/userSlice.tsx',
]);

const toPosix = (value) => value.split(path.sep).join('/');

const listSourceFiles = (directory) =>
	fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = path.join(directory, entry.name);
		if (entry.isDirectory()) return listSourceFiles(fullPath);
		if (!sourceExtensions.has(path.extname(entry.name))) return [];
		if (/\.test\.tsx?$/.test(entry.name)) return [];
		return [fullPath];
	});

const scanCompatibilityBoundaries = (source, relativePath) => {
	const failures = [];

	if (relativePath !== ACCOUNT_CONTEXT_PATH) {
		if (/\bresolveAccessibleAccountIds\b/.test(source)) {
			failures.push(
				`${relativePath}: account reads must use resolveAccountAccessContext`,
			);
		}
		if (/\bgetTeamMemberForAccountUser\b/.test(source)) {
			failures.push(
				`${relativePath}: team-member resolution belongs in accountContext`,
			);
		}
	}

	if (relativePath !== PROPERTY_MEMORY_ADAPTER_PATH) {
		if (/\bproperty\?*\.documents\b/.test(source)) {
			failures.push(
				`${relativePath}: embedded property documents must cross the property-memory adapter`,
			);
		}
		if (/\bproperty\?*\.knowledgeSuggestions\b/.test(source)) {
			failures.push(
				`${relativePath}: embedded knowledge suggestions must cross the property-memory adapter`,
			);
		}
	}

	if (
		!LEGACY_HISTORY_READER_PATHS.has(relativePath) &&
		/collection\s*\(\s*db\s*,\s*['"]maintenanceHistory['"]\s*\)/s.test(source)
	) {
		failures.push(
			`${relativePath}: legacy maintenance collection reads belong in the shared history adapters`,
		);
	}

	return failures;
};

const run = () => {
	const failures = listSourceFiles(sourceRoot).flatMap((filePath) => {
		const relativePath = toPosix(path.relative(repositoryRoot, filePath));
		return scanCompatibilityBoundaries(
			fs.readFileSync(filePath, 'utf8'),
			relativePath,
		);
	});

	if (failures.length > 0) {
		console.error(
			'Compatibility boundary validation failed. Use the shared access, property-memory, and maintenance-history adapters.',
		);
		for (const failure of failures) console.error(`- ${failure}`);
		process.exitCode = 1;
		return failures;
	}

	console.log('Compatibility boundaries validated.');
	return [];
};

if (require.main === module) run();

module.exports = {
	run,
	scanCompatibilityBoundaries,
};
