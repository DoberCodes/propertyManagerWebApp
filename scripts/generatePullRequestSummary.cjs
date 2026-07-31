#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SUMMARY_START = '<!-- maintley-pr-summary:start -->';
const SUMMARY_END = '<!-- maintley-pr-summary:end -->';

const areaDefinitions = [
	{ label: 'Application experience', matches: (file) => file.startsWith('src/') },
	{ label: 'Firebase Functions', matches: (file) => file.startsWith('functions/') },
	{
		label: 'Firebase configuration and rules',
		matches: (file) =>
			file === 'firebase.json' ||
			file === 'firestore.rules' ||
			file === 'firestore.indexes.json' ||
			file === 'storage.rules',
	},
	{ label: 'CI/CD and release automation', matches: (file) => file.startsWith('.github/') },
	{ label: 'Developer tooling', matches: (file) => file.startsWith('scripts/') },
	{ label: 'Documentation and ADRs', matches: (file) => file.startsWith('project-docs/') },
	{ label: 'Android application', matches: (file) => file.startsWith('android/') },
	{ label: 'Public assets', matches: (file) => file.startsWith('public/') },
];

function normalizeFile(file) {
	return String(file || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function redactSensitiveText(value) {
	return String(value || '')
		.replace(/\bsk_(?:live|test)_[A-Za-z0-9_-]+/g, '[redacted Stripe key]')
		.replace(/\bwhsec_[A-Za-z0-9_-]+/g, '[redacted webhook secret]')
		.replace(/\bre_[A-Za-z0-9_-]{12,}/g, '[redacted email key]')
		.replace(
			/\b([A-Z][A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY)[A-Z0-9_]*)\s*=\s*([^\s,;]+)/g,
			'$1=[redacted]',
		)
		.replace(/<!--/g, '&lt;!--')
		.replace(/-->/g, '--&gt;')
		.slice(0, 240);
}

function commitSubject(commit) {
	const message = commit?.commit?.message || commit?.message || '';
	return redactSensitiveText(String(message).split(/\r?\n/, 1)[0].trim());
}

function summarizeAreas(files) {
	const normalized = files.map((file) => normalizeFile(file.filename || file));
	const areas = areaDefinitions
		.map((area) => ({
			label: area.label,
			count: normalized.filter(area.matches).length,
		}))
		.filter((area) => area.count > 0);
	const matched = new Set();
	for (const file of normalized) {
		if (areaDefinitions.some((area) => area.matches(file))) matched.add(file);
	}
	const otherCount = normalized.length - matched.size;
	if (otherCount > 0) areas.push({ label: 'Repository configuration and other files', count: otherCount });
	return areas;
}

function isTestFile(file) {
	const normalized = normalizeFile(file);
	return (
		/(^|\/)(__tests__|e2e)(\/|$)/.test(normalized) ||
		/\.(?:test|spec)\.[^.]+$/.test(normalized)
	);
}

function deploymentNotes(files) {
	const normalized = files.map((file) => normalizeFile(file.filename || file));
	const notes = [];
	if (normalized.some((file) => file.startsWith('functions/'))) {
		notes.push('Firebase Functions are affected; use the environment-specific deployment workflow.');
	}
	if (
		normalized.some((file) =>
			['firestore.rules', 'firestore.indexes.json', 'storage.rules'].includes(file),
		)
	) {
		notes.push('Firebase rules or indexes are affected and require their corresponding deployment target.');
	}
	if (normalized.some((file) => file.startsWith('.github/workflows/'))) {
		notes.push('GitHub Actions behavior changes after this PR reaches its base branch.');
	}
	if (normalized.some((file) => file.startsWith('android/'))) {
		notes.push('Android artifacts should be rebuilt before mobile distribution.');
	}
	if (notes.length === 0) notes.push('No special deployment target was detected from the changed paths.');
	return notes;
}

function buildSummary(metadata) {
	const files = Array.isArray(metadata.files) ? metadata.files : [];
	const commits = Array.isArray(metadata.commits) ? metadata.commits : [];
	const areas = summarizeAreas(files);
	const subjects = [...new Set(commits.map(commitSubject).filter(Boolean))].slice(0, 8);
	const additions = files.reduce((sum, file) => sum + Number(file.additions || 0), 0);
	const deletions = files.reduce((sum, file) => sum + Number(file.deletions || 0), 0);
	const testFiles = files
		.map((file) => normalizeFile(file.filename || file))
		.filter(isTestFile);
	const lines = [
		'### Automated PR Summary',
		'',
		`_${files.length} changed file${files.length === 1 ? '' : 's'} · +${additions} / -${deletions}. Generated from file metadata and commit subjects; no file contents or environment values are read._`,
		'',
		'#### Areas changed',
		'',
	];
	if (areas.length === 0) lines.push('- No changed files were reported.');
	else for (const area of areas) lines.push(`- ${area.label}: ${area.count} file${area.count === 1 ? '' : 's'}`);
	lines.push('', '#### Change summary', '');
	if (subjects.length === 0) lines.push('- No commit subjects were available.');
	else for (const subject of subjects) lines.push(`- ${subject}`);
	lines.push('', '#### Deployment considerations', '');
	for (const note of deploymentNotes(files)) lines.push(`- ${note}`);
	lines.push('', '#### Validation', '');
	lines.push('- Live validation results are reported by the required PR checks.');
	if (testFiles.length > 0) {
		lines.push(`- ${testFiles.length} automated test file${testFiles.length === 1 ? '' : 's'} changed in this PR.`);
	} else {
		lines.push('- No automated test files were changed; confirm existing checks cover the affected behavior.');
	}
	return lines.join('\n');
}

function summaryBlock(summary) {
	return `${SUMMARY_START}\n${summary.trim()}\n${SUMMARY_END}`;
}

function updatePullRequestBody(body, summary) {
	const existing = String(body || '').trimEnd();
	const startIndex = existing.indexOf(SUMMARY_START);
	const endIndex = existing.indexOf(SUMMARY_END);
	if ((startIndex === -1) !== (endIndex === -1) || (startIndex !== -1 && endIndex < startIndex)) {
		throw new Error('PR body contains an incomplete or malformed Maintley summary marker block.');
	}
	const block = summaryBlock(summary);
	if (startIndex === -1) return existing ? `${existing}\n\n${block}\n` : `${block}\n`;
	const afterEnd = endIndex + SUMMARY_END.length;
	return `${existing.slice(0, startIndex)}${block}${existing.slice(afterEnd)}`.trimEnd() + '\n';
}

function parseArgs(argv = process.argv.slice(2)) {
	const options = { metadata: '', body: '', output: '' };
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--metadata') options.metadata = argv[++index] || '';
		else if (argument === '--body') options.body = argv[++index] || '';
		else if (argument === '--output') options.output = argv[++index] || '';
		else throw new Error(`Unknown argument: ${argument}`);
	}
	for (const [name, value] of Object.entries(options)) {
		if (!value) throw new Error(`Missing required --${name} argument.`);
	}
	return options;
}

function main() {
	try {
		const options = parseArgs();
		const metadata = JSON.parse(fs.readFileSync(path.resolve(options.metadata), 'utf8'));
		const body = fs.readFileSync(path.resolve(options.body), 'utf8');
		const updated = updatePullRequestBody(body, buildSummary(metadata));
		fs.writeFileSync(path.resolve(options.output), updated, 'utf8');
		console.log('Maintley PR summary generated without reading changed-file contents.');
	} catch (error) {
		console.error(`Maintley PR summary generation failed: ${error.message}`);
		process.exit(1);
	}
}

if (require.main === module) main();

module.exports = {
	SUMMARY_END,
	SUMMARY_START,
	buildSummary,
	commitSubject,
	deploymentNotes,
	isTestFile,
	normalizeFile,
	redactSensitiveText,
	summarizeAreas,
	updatePullRequestBody,
};
