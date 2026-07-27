#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_PATH = path.join(
	ROOT,
	'project-docs',
	'docs',
	'Product',
	'SUPPORT_FEATURE_UPDATES.json',
);
const TARGET_PATH = path.join(
	ROOT,
	'src',
	'pages',
	'SupportPage',
	'SupportContent.ts',
);

const REQUIRED_FIELDS = ['version', 'date', 'type', 'title', 'description'];

function quote(value) {
	return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function loadUpdates() {
	const raw = fs.readFileSync(SOURCE_PATH, 'utf8');
	const updates = JSON.parse(raw);

	if (!Array.isArray(updates) || updates.length === 0) {
		throw new Error('SUPPORT_FEATURE_UPDATES.json must contain at least one update.');
	}

	const seenVersions = new Set();
	updates.forEach((update, index) => {
		REQUIRED_FIELDS.forEach((field) => {
			if (!String(update[field] || '').trim()) {
				throw new Error(`Update ${index + 1} is missing "${field}".`);
			}
		});

		if (seenVersions.has(update.version)) {
			throw new Error(`Duplicate support update version: ${update.version}`);
		}
		seenVersions.add(update.version);
	});

	return updates;
}

function renderUpdates(updates) {
	const entries = updates
		.map(
			(update) => `\t{
\t\tversion: ${quote(update.version)},
\t\tdate: ${quote(update.date)},
\t\ttype: ${quote(update.type)},
\t\ttitle: ${quote(update.title)},
\t\tdescription:
\t\t\t${quote(update.description)},
\t}`,
		)
		.join(',\n');

	return `export const recentMaintleyUpdates = [\n${entries},\n];`;
}

function replaceUpdates(target, renderedUpdates, eol) {
	const pattern =
		/export const recentMaintleyUpdates = \[[\s\S]*?\];\r?\n\r?\ninterface ArticleSection/;

	if (!pattern.test(target)) {
		throw new Error('Could not find recentMaintleyUpdates in SupportContent.ts.');
	}

	return target.replace(
		pattern,
		`${renderedUpdates}${eol}${eol}interface ArticleSection`,
	);
}

function main() {
	const dryRun = process.argv.includes('--dry-run');
	const updates = loadUpdates();
	const currentTarget = fs.readFileSync(TARGET_PATH, 'utf8');
	const eol = currentTarget.includes('\r\n') ? '\r\n' : '\n';
	const renderedUpdates = renderUpdates(updates).replace(/\n/g, eol);
	const nextTarget = replaceUpdates(currentTarget, renderedUpdates, eol);

	if (currentTarget === nextTarget) {
		console.log('Support feature updates are already current.');
		return;
	}

	if (dryRun) {
		console.log(
			`Support feature updates would be synced from ${path.relative(
				ROOT,
				SOURCE_PATH,
			)} to ${path.relative(ROOT, TARGET_PATH)}.`,
		);
		return;
	}

	fs.writeFileSync(TARGET_PATH, nextTarget);
	console.log(
		`Synced ${updates.length} support feature updates to ${path.relative(
			ROOT,
			TARGET_PATH,
		)}.`,
	);
}

main();
