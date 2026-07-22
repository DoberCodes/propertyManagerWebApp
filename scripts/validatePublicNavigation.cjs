#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(projectRoot, 'public');
const navigation = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src', 'config', 'publicNavigation.json'), 'utf8'));
const failures = [];

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
	const absolutePath = path.join(directory, entry.name);
	return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
});
const enabled = (item) => item.enabled !== false;
const destinationFor = (item) => item.publicHref || item.href;
const escapeHtml = (value) => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#039;');

const staticPages = walk(publicRoot).filter((filePath) =>
	path.basename(filePath) === 'index.html' && path.dirname(filePath) !== publicRoot,
);

for (const filePath of staticPages) {
	const html = fs.readFileSync(filePath, 'utf8');
	const nav = html.match(/<nav class="site-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[0] || '';
	const route = `/${path.relative(publicRoot, path.dirname(filePath)).replace(/\\/g, '/')}/`;
	if (!nav) {
		failures.push(`${route}: missing generated public navigation`);
		continue;
	}

	for (const item of navigation.items) {
		if (!enabled(item)) {
			if (nav.includes(escapeHtml(item.label))) failures.push(`${route}: disabled item ${item.label} is visible`);
			continue;
		}

		if (item.type === 'group') {
			if (!nav.includes(`<summary>${escapeHtml(item.label)}</summary>`)) failures.push(`${route}: missing group ${item.label}`);
			for (const child of item.children || []) {
				if (!enabled(child)) {
					if (nav.includes(escapeHtml(child.label))) failures.push(`${route}: disabled item ${child.label} is visible`);
					continue;
				}
				if (!nav.includes(`href="${destinationFor(child)}"`) || !nav.includes(`>${escapeHtml(child.label)}</a>`)) {
					failures.push(`${route}: missing ${child.label}`);
				}
			}
			continue;
		}

		if (!nav.includes(`href="${destinationFor(item)}"`) || !nav.includes(`>${escapeHtml(item.label)}</a>`)) {
			failures.push(`${route}: missing ${item.label}`);
		}
	}

	if (!html.includes('src="/public-nav.js"')) failures.push(`${route}: missing public navigation behavior script`);
}

if (failures.length) {
	for (const failure of failures) console.error(`Navigation error: ${failure}`);
	process.exitCode = 1;
} else {
	console.log(`Validated shared navigation across ${staticPages.length} static public SEO pages.`);
}
