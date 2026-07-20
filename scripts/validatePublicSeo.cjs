#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(projectRoot, 'public');
const canonicalOrigin = 'https://maintleyapp.com';
const failures = [];
const warnings = [];

const walk = (directory) =>
	fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const absolutePath = path.join(directory, entry.name);
		return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
	});

const matches = (value, pattern) => [...value.matchAll(pattern)];
const attribute = (tag, name) =>
	String(Array.isArray(tag) ? tag[0] : tag).match(
		new RegExp(`${name}=(["'])(.*?)\\1`, 'i'),
	)?.[2] || '';

const sitemap = fs.readFileSync(path.join(publicRoot, 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set(
	matches(sitemap, /<loc>([^<]+)<\/loc>/g).map((match) => match[1]),
);
const htmlFiles = walk(publicRoot).filter(
	(filePath) => path.basename(filePath) === 'index.html',
);
const pageUrls = new Set();

for (const filePath of htmlFiles) {
	const relativePath = path.relative(publicRoot, filePath).replace(/\\/g, '/');
	const route = relativePath === 'index.html'
		? '/'
		: `/${relativePath.replace(/index\.html$/, '')}`;
	const canonicalUrl = `${canonicalOrigin}${route}`;
	const html = fs.readFileSync(filePath, 'utf8');
	pageUrls.add(canonicalUrl);

	const titleTags = matches(html, /<title>[^<]+<\/title>/gi);
	const h1Tags = matches(html, /<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/gi);
	const descriptionTags = matches(html, /<meta\s+[^>]*name=["']description["'][^>]*>/gi);
	const canonicalTags = matches(html, /<link\s+[^>]*rel=["']canonical["'][^>]*>/gi);
	const robotsTags = matches(html, /<meta\s+[^>]*name=["']robots["'][^>]*>/gi);

	if (titleTags.length !== 1) failures.push(`${route}: expected one title`);
	if (h1Tags.length !== 1) failures.push(`${route}: expected one h1`);
	if (descriptionTags.length !== 1) failures.push(`${route}: expected one meta description`);
	if (canonicalTags.length !== 1) failures.push(`${route}: expected one canonical link`);
	if (robotsTags.length !== 1) failures.push(`${route}: expected one robots tag`);

	const description = attribute(descriptionTags[0] || '', 'content');
	if (description.length < 70 || description.length > 170) {
		warnings.push(`${route}: description length is ${description.length}`);
	}
	if (attribute(canonicalTags[0] || '', 'href') !== canonicalUrl) {
		failures.push(`${route}: canonical must be ${canonicalUrl}`);
	}
	if (attribute(robotsTags[0] || '', 'content').toLowerCase() !== 'index, follow') {
		failures.push(`${route}: robots must be index, follow`);
	}

	for (const [name, pattern] of [
		['og:title', /<meta\s+[^>]*property=["']og:title["'][^>]*>/i],
		['og:description', /<meta\s+[^>]*property=["']og:description["'][^>]*>/i],
		['og:url', /<meta\s+[^>]*property=["']og:url["'][^>]*>/i],
		['og:image', /<meta\s+[^>]*property=["']og:image["'][^>]*>/i],
		['twitter:card', /<meta\s+[^>]*name=["']twitter:card["'][^>]*>/i],
		['twitter:image', /<meta\s+[^>]*name=["']twitter:image["'][^>]*>/i],
	]) {
		if (!pattern.test(html)) failures.push(`${route}: missing ${name}`);
	}

	if (!sitemapUrls.has(canonicalUrl)) failures.push(`${route}: missing from sitemap.xml`);

	for (const scriptMatch of matches(html, /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)) {
		try {
			JSON.parse(scriptMatch[1]);
		} catch (error) {
			failures.push(`${route}: invalid JSON-LD (${error.message})`);
		}
	}
}

for (const sitemapUrl of sitemapUrls) {
	if (!pageUrls.has(sitemapUrl)) failures.push(`sitemap: no page for ${sitemapUrl}`);
}
for (const warning of warnings) console.warn(`SEO warning: ${warning}`);

if (failures.length) {
	for (const failure of failures) console.error(`SEO error: ${failure}`);
	process.exitCode = 1;
} else {
	console.log(`Validated ${htmlFiles.length} public SEO pages and ${sitemapUrls.size} sitemap URLs.`);
}
