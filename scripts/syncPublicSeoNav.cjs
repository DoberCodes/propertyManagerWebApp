#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const publicRoot = path.resolve(__dirname, '..', 'public');
const resourceGuides = [
	['/resources/home-maintenance-checklist/', 'Seasonal checklist'],
	['/resources/seasonal-home-maintenance-schedule/', 'Seasonal schedule'],
	['/resources/home-service-history/', 'Home service history'],
	['/resources/appliance-maintenance-log/', 'Appliance maintenance log'],
	['/resources/how-to-create-home-maintenance-log/', 'Create a maintenance log'],
	['/resources/what-maintenance-records-should-homeowners-keep/', 'Records to keep'],
	['/resources/appliance-warranty-organizer/', 'Warranty organizer'],
	['/resources/hvac-filter-replacement-schedule/', 'HVAC filter schedule'],
	['/resources/new-home-maintenance-tracker/', 'New home tracker'],
];

const pages = [];
const walk = (directory) => {
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) walk(absolutePath);
		else if (entry.name === 'index.html' && directory !== publicRoot) pages.push(absolutePath);
	}
};

const currentAttribute = (route, destination) =>
	route === destination || (destination === '/resources/' && route.startsWith('/resources/'))
		? ' aria-current="page"'
		: '';

const buildNav = (route) => {
	const resourceMenu = route.startsWith('/resources/')
		? `
					<details class="resource-menu">
						<summary>Browse guides</summary>
						<div class="resource-menu-panel">
							<a href="/resources/">All resources</a>
${resourceGuides.map(([href, label]) => `\t\t\t\t\t\t\t<a href="${href}"${currentAttribute(route, href)}>${label}</a>`).join('\n')}
						</div>
					</details>`
		: '';

	return `<nav class="site-nav" aria-label="Primary navigation">
				<a class="brand" href="/">Maintley</a>
				<div class="nav-links">
					<a href="/"${currentAttribute(route, '/')}>Home</a>
					<a href="/features/"${currentAttribute(route, '/features/')}>Features</a>
					<a href="/pricing/"${currentAttribute(route, '/pricing/')}>Pricing</a>
					<a href="/resources/"${currentAttribute(route, '/resources/')}>Resources</a>${resourceMenu}
					<a href="/#/login">Login</a>
					<a class="nav-cta" href="/#/register">Start free</a>
				</div>
			</nav>`;
};

walk(publicRoot);

for (const filePath of pages) {
	const route = `/${path.relative(publicRoot, path.dirname(filePath)).replace(/\\/g, '/')}/`;
	const html = fs.readFileSync(filePath, 'utf8');
	const nextHtml = html.replace(/<nav class="site-nav">[\s\S]*?<\/nav>/, buildNav(route));
	if (nextHtml === html) throw new Error(`Could not find public navigation in ${filePath}`);
	fs.writeFileSync(filePath, nextHtml);
}

console.log(`Synchronized navigation across ${pages.length} public SEO pages.`);
