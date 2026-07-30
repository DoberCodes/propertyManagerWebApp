const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const contractPath = path.join(rootDir, '.env.example');
const metadataPrefix = '# @maintley-env ';

function parseMetadata(text) {
	const metadata = {};
	for (const token of String(text || '').trim().split(/\s+/)) {
		const separator = token.indexOf('=');
		if (separator < 1) continue;
		metadata[token.slice(0, separator)] = token.slice(separator + 1);
	}
	return metadata;
}

function parseEnvironmentContract(contents) {
	const entries = [];
	let pendingMetadata = null;
	let currentSection = '';
	for (const rawLine of String(contents || '').split(/\r?\n/)) {
		const line = rawLine.trim();
		const sectionMatch = line.match(/^#\s+(.+?)\s+-{3,}$/);
		if (sectionMatch) {
			currentSection = sectionMatch[1].trim();
			continue;
		}
		if (line.startsWith(metadataPrefix)) {
			if (pendingMetadata) throw new Error('Environment metadata must be followed by exactly one variable.');
			pendingMetadata = parseMetadata(line.slice(metadataPrefix.length));
			continue;
		}
		if (!line || line.startsWith('#')) continue;
		const separator = line.indexOf('=');
		if (separator < 1) continue;
		const name = line.slice(0, separator).trim();
		if (!pendingMetadata) throw new Error(`${name} is missing a ${metadataPrefix.trim()} declaration.`);
		const environments = String(pendingMetadata.environments || '')
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean);
		const entry = {
			name,
			example: line.slice(separator + 1).trim(),
			scope: pendingMetadata.scope || '',
			delivery: pendingMetadata.delivery || '',
			environments,
			required: pendingMetadata.required === 'true',
			source: pendingMetadata.source || '',
			developmentDefault: pendingMetadata.developmentDefault || '',
			productionDefault: pendingMetadata.productionDefault || '',
			section: currentSection,
		};
		for (const field of ['scope', 'delivery']) {
			if (!entry[field]) throw new Error(`${name} is missing ${field} metadata.`);
		}
		if (!environments.length) throw new Error(`${name} is missing environments metadata.`);
		entries.push(entry);
		pendingMetadata = null;
	}
	if (pendingMetadata) throw new Error('Environment metadata at end of file has no variable.');
	const duplicates = entries.filter((entry, index) => entries.findIndex((candidate) => candidate.name === entry.name) !== index);
	if (duplicates.length) throw new Error(`Duplicate environment entries: ${[...new Set(duplicates.map(({ name }) => name))].join(', ')}`);
	return entries;
}

function loadEnvironmentContract(filePath = contractPath) {
	return parseEnvironmentContract(fs.readFileSync(filePath, 'utf8'));
}

function entriesFor(entries, environment, predicate = () => true) {
	return entries.filter((entry) => entry.environments.includes(environment) && predicate(entry));
}

function defaultFor(entry, environment) {
	return environment === 'production' ? entry.productionDefault : entry.developmentDefault;
}

module.exports = {
	contractPath,
	defaultFor,
	entriesFor,
	loadEnvironmentContract,
	parseEnvironmentContract,
};
