#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const pricingHtml = fs.readFileSync(path.join(projectRoot, 'public', 'pricing', 'index.html'), 'utf8');
const { plans } = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src', 'config', 'publicPlanFacts.json'), 'utf8'));
const failures = [];

const cardPattern = /<article class="card" data-plan-id="([^"]+)" data-price-monthly="([^"]+)" data-price-yearly="([^"]+)" data-max-properties="([^"]+)" data-max-devices="([^"]+)" data-max-files="([^"]+)" data-storage-gb="([^"]+)">([\s\S]*?)<\/article>/g;
const cards = new Map([...pricingHtml.matchAll(cardPattern)].map((match) => [match[1], match]));

for (const plan of plans) {
	const card = cards.get(plan.id);
	if (!card) {
		failures.push(`Missing public pricing card for ${plan.id}`);
		continue;
	}
	const expected = [plan.priceMonthly, plan.priceYearly, plan.maxProperties, plan.maxDevices, plan.maxFiles, plan.maxStorageGb].map(String);
	const actual = card.slice(2, 8);
	if (expected.some((value, index) => value !== actual[index])) {
		failures.push(`Public pricing facts do not match ${plan.id}`);
	}
	if (!card[8].includes(`<h3>${plan.name}</h3>`) || !card[8].includes(`$${plan.priceMonthly} / month`)) {
		failures.push(`Public pricing copy does not match ${plan.id}`);
	}
	const bullets = [...card[8].matchAll(/<li>([^<]+)<\/li>/g)].map((match) =>
		match[1].trim().toLowerCase(),
	);
	if (new Set(bullets).size !== bullets.length) {
		failures.push(`Public pricing card contains duplicate bullets for ${plan.id}`);
	}
}

if (cards.size !== plans.length) failures.push(`Expected ${plans.length} pricing cards, found ${cards.size}`);
if (pricingHtml.includes('Organization plan')) failures.push('Organization licensing must not appear in current public pricing');

if (failures.length) {
	for (const failure of failures) console.error(`Pricing error: ${failure}`);
	process.exitCode = 1;
} else {
	console.log(`Validated ${plans.length} public pricing plans.`);
}
