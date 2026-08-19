#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const pricingPath = path.join(projectRoot, 'public', 'pricing', 'index.html');
const planFactsPath = path.join(projectRoot, 'src', 'config', 'publicPlanFacts.json');
const { plans } = JSON.parse(fs.readFileSync(planFactsPath, 'utf8'));

const escapeHtml = (value) => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#039;');

const formatLimit = (value, singular, plural = `${singular}s`, unlimited = false) =>
	unlimited && value >= 999
		? `Unlimited ${plural}`
		: `${value} ${value === 1 ? singular : plural}`;

const getPlanBullets = (plan) => {
	const candidates = [
		formatLimit(plan.maxProperties, 'property', 'properties'),
		formatLimit(plan.maxDevices, 'equipment record', 'equipment records', true),
		'No file-count limit',
		`${plan.maxStorageGb} GB storage`,
		...plan.highlights,
	];
	const seen = new Set();
	return candidates.filter((candidate) => {
		const normalized = candidate.trim().toLowerCase();
		if (seen.has(normalized)) return false;
		seen.add(normalized);
		return true;
	});
};

const planCards = plans.map((plan) => `					<article class="card" data-plan-id="${escapeHtml(plan.id)}" data-price-monthly="${plan.priceMonthly}" data-price-yearly="${plan.priceYearly}" data-max-properties="${plan.maxProperties}" data-max-devices="${plan.maxDevices}" data-max-files="${plan.maxFiles}" data-storage-gb="${plan.maxStorageGb}">
						<h3>${escapeHtml(plan.name)}</h3>
						<p><strong>$${plan.priceMonthly} / month</strong> &middot; $${plan.priceYearly} / year</p>
						<p>${escapeHtml(plan.bestFor.replace(/^Best for:\s*/i, ''))}</p>
						<ul class="check-list">
${getPlanBullets(plan).map((bullet) => `\t\t\t\t\t\t\t<li>${escapeHtml(bullet)}</li>`).join('\n')}
						</ul>
					</article>`).join('\n');

const pricingLead = 'Homeowner plans support one or several personal homes. Property and Portfolio are for landlords and property-management teams that need business coordination.';

const pricingSection = `<section class="section" data-public-pricing>
				<h2>Choose the plan that fits your home or property portfolio</h2>
				<p class="lead">${pricingLead}</p>
				<div class="grid">
${planCards}
				</div>
			</section>`;

const offers = plans.flatMap((plan) => {
	const monthly = {
		'@type': 'Offer',
		name: plan.priceMonthly === 0 ? plan.name : `${plan.name} monthly`,
		price: String(plan.priceMonthly),
		priceCurrency: 'USD',
		url: 'https://maintleyapp.com/register',
	};
	if (plan.priceYearly === 0) return [monthly];
	return [monthly, {
		'@type': 'Offer',
		name: `${plan.name} yearly`,
		price: String(plan.priceYearly),
		priceCurrency: 'USD',
		url: 'https://maintleyapp.com/register',
	}];
});

let html = fs.readFileSync(pricingPath, 'utf8');
const pricingPattern = /<section class="section" data-public-pricing>[\s\S]*?<\/section>/;
if (!pricingPattern.test(html)) throw new Error('Could not find the generated public pricing section');
html = html.replace(pricingPattern, pricingSection);

const offersPattern = /"offers"\s*:\s*\[[\s\S]*?\]\s*\n\s*}/;
if (!offersPattern.test(html)) throw new Error('Could not find pricing offers JSON-LD');
const offersJson = JSON.stringify(offers, null, '\t\t\t\t').replace(/^/gm, '\t\t\t');
html = html.replace(offersPattern, `"offers": ${offersJson.trimStart()}\n\t\t\t}`);

fs.writeFileSync(pricingPath, html);
console.log(`Synchronized ${plans.length} public pricing plans.`);
