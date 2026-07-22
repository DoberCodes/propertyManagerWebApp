#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(projectRoot, 'public');
const navigationPath = path.join(projectRoot, 'src', 'config', 'publicNavigation.json');
const navigation = JSON.parse(fs.readFileSync(navigationPath, 'utf8'));

const pages = [];
const walk = (directory) => {
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) walk(absolutePath);
		else if (entry.name === 'index.html' && directory !== publicRoot) pages.push(absolutePath);
	}
};

const escapeHtml = (value) => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#039;');

const enabled = (item) => item.enabled !== false;
const destinationFor = (item) => item.publicHref || item.href;
const currentAttribute = (route, destination) =>
	route === destination || (destination === '/resources/' && route === '/resources/')
		? ' aria-current="page"'
		: '';

const buildDestination = (item, route, indentation = '\t\t\t\t\t') => {
	const destination = destinationFor(item);
	if (!destination) throw new Error(`Navigation item ${item.id} has no destination`);
	const className = item.style === 'cta' ? ' class="nav-cta"' : '';
	return `${indentation}<a${className} href="${escapeHtml(destination)}"${currentAttribute(route, item.href)}>${escapeHtml(item.label)}</a>`;
};

const buildGroup = (item, route) => {
	const children = (item.children || []).filter(enabled);
	if (!children.length) return '';
	return `\t\t\t\t\t<details class="nav-menu nav-menu-${escapeHtml(item.id)}" data-public-nav-menu>
\t\t\t\t\t\t<summary>${escapeHtml(item.label)}</summary>
\t\t\t\t\t\t<div class="nav-menu-panel">
${children.map((child) => buildDestination(child, route, '\t\t\t\t\t\t\t')).join('\n')}
\t\t\t\t\t\t</div>
\t\t\t\t\t</details>`;
};

const buildNav = (route) => {
	const items = navigation.items.filter(enabled);
	const links = items.map((item) => item.type === 'group'
		? buildGroup(item, route)
		: buildDestination(item, route)).join('\n');

	return `<nav class="site-nav" aria-label="Primary navigation">
\t\t\t\t<a class="brand" href="/">Maintley</a>
\t\t\t\t<div class="nav-links">
${links}
\t\t\t\t</div>
\t\t\t</nav>`;
};

walk(publicRoot);

for (const filePath of pages) {
	const route = `/${path.relative(publicRoot, path.dirname(filePath)).replace(/\\/g, '/')}/`;
	const html = fs.readFileSync(filePath, 'utf8');
	const navPattern = /<nav class="site-nav"[^>]*>[\s\S]*?<\/nav>/;
	if (!navPattern.test(html)) throw new Error(`Could not find public navigation in ${filePath}`);

	let nextHtml = html.replace(navPattern, buildNav(route));
	if (!nextHtml.includes('src="/public-nav.js"')) {
		nextHtml = nextHtml.replace('</body>', '\t\t<script src="/public-nav.js" defer></script>\n\t</body>');
	}
	fs.writeFileSync(filePath, nextHtml);
}

console.log(`Synchronized navigation across ${pages.length} static public SEO pages.`);
