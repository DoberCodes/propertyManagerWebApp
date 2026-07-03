#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'marketing', 'maintley', 'content');

const sourceRoots = {
	core: [
		'project-docs/docs/Product/PRODUCT_DIRECTION.md',
		'project-docs/docs/UX/UX_LANGUAGE_GUIDE.md',
		'project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md',
	],
	product: [
		'project-docs/docs/Product/PRODUCT_DIRECTION.md',
		'project-docs/docs/Product/FEATURES.md',
	],
	intelligence: [
		'project-docs/docs/Product/PRODUCT_DIRECTION.md',
		'project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md',
		'project-docs/docs/Intelligence/RECOMMENDATION_ENGINE.md',
	],
	adr: ['project-docs/ADR'],
	all: [
		'project-docs/docs/Product/PRODUCT_DIRECTION.md',
		'project-docs/docs/Product/FEATURES.md',
		'project-docs/docs/UX/UX_LANGUAGE_GUIDE.md',
		'project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md',
		'project-docs/docs/Intelligence/RECOMMENDATION_ENGINE.md',
		'project-docs/ADR',
	],
};

const supportedStatuses = ['idea', 'drafting', 'ready', 'published', 'archived'];
const supportedPillars = [
	'homeowner-moment',
	'property-memory',
	'education',
	'product-update',
	'founder-journey',
	'customer-story',
	'seasonal',
	'announcement',
];
const supportedCtas = ['website', 'google-play', 'founding-member', 'discussion', 'none'];
const supportedPlatforms = [
	'maintley-facebook',
	'nextdoor',
	'dfv',
	'personal-facebook',
	'linkedin',
	'blog',
];

const folderByStatus = {
	idea: 'ideas',
	drafting: 'drafts',
	ready: 'ready',
	published: 'published',
	archived: 'archived',
};

const topicBank = [
	{
		slug: 'home-records-beat-home-memory',
		title: 'Home records beat home memory',
		pillar: 'property-memory',
		tags: ['property memory', 'home records', 'maintenance history'],
		problem:
			'Homeowners often rely on memory for details that become harder to recall as years pass.',
		evidence:
			'A repair date, contractor name, warranty, filter size, or receipt may feel easy to remember at first. Months later, that same detail can take real time to find.',
		connection:
			'Maintley keeps maintenance history, documents, warranties, photos, and service notes connected to the property so useful details are easier to find later.',
		hooks: [
			'Your home should not have to depend on your memory.',
			'The hardest home detail to find is usually the one you thought you would remember.',
			'A good home record makes future decisions easier.',
			'Homeownership gets simpler when the property keeps its own history.',
			'The small details you save now can prevent a future search later.',
		],
		caption:
			"Your home should not have to depend on your memory.\n\nA repair date, a contractor name, a warranty, a filter size, or a receipt may feel easy to remember when the work just happened.\n\nBut months later, those details usually live in different places: an email thread, a drawer, a photo roll, a calendar note, or someone's memory.\n\nThat is the problem Maintley is built around.\n\nHomes collect useful information over time. Maintenance history, documents, warranties, photos, and service notes all become more valuable when they stay connected to the property.\n\nA good home record is not extra paperwork.\n\nIt is a calmer way to make future repairs, replacements, and decisions easier.",
		short:
			'Your home should not have to depend on your memory.\n\nMaintley helps keep maintenance history, documents, warranties, photos, and service notes connected to the property, so future repairs and decisions are easier.',
		graphic: 'comparison',
		cta: 'discussion',
		evergreen: 'High',
		followUps: [
			'Five home details worth saving before you need them.',
			'Why receipts should stay with the property, not just in your inbox.',
			'The difference between remembering a repair and having a repair record.',
		],
	},
	{
		slug: 'maintenance-history-is-a-home-asset',
		title: 'Maintenance history is a home asset',
		pillar: 'education',
		tags: ['maintenance history', 'property records', 'homeownership'],
		problem:
			'Maintenance history is often treated like a temporary checklist instead of a long-term part of the property record.',
		evidence:
			'Completed repairs, inspections, service visits, warranties, and receipts can help explain what happened years later.',
		connection:
			'Maintley turns completed work into a lasting maintenance history that remains useful after the task is done.',
		hooks: [
			'Maintenance history is more than a list of things you finished.',
			'A completed repair can still be useful years later.',
			'The work matters. The record matters too.',
			'Every service visit adds to the story of the home.',
			'Maintenance tracking is only the beginning.',
		],
		caption:
			'Maintenance history is more than a list of things you finished.\n\nA completed repair can answer questions years later:\n\nWhen was this replaced?\nWho worked on it?\nWas there a warranty?\nDid this problem happen before?\nWhere is the receipt?\n\nThat history becomes part of the property.\n\nMaintley is built to help homeowners keep the work, documents, warranties, photos, and service notes together, so completed maintenance does not disappear after the task is checked off.\n\nThe work matters.\n\nThe record matters too.',
		short:
			'Maintenance history is more than a checklist.\n\nA completed repair can help answer future questions about dates, warranties, contractors, receipts, and repeat issues. Maintley keeps that history connected to the property.',
		graphic: 'checklist',
		cta: 'discussion',
		evergreen: 'High',
		followUps: [
			'What belongs in a useful maintenance history?',
			'Why completed tasks should become long-term records.',
			'How maintenance history helps during a future repair.',
		],
	},
	{
		slug: 'documents-belong-with-the-property',
		title: 'Documents belong with the property',
		pillar: 'property-memory',
		tags: ['documents', 'warranties', 'receipts', 'property records'],
		problem:
			'Home documents are often stored wherever they happened to arrive, making them difficult to connect to the system or repair they explain.',
		evidence:
			'Manuals, warranties, invoices, inspection reports, and receipts may be split across email, folders, photos, and paper files.',
		connection:
			'Maintley helps homeowners keep documents with the property records they support.',
		hooks: [
			'The right document is most useful when it is connected to the right part of the home.',
			'Home documents should not disappear into inboxes and drawers.',
			'A warranty is easier to use when it stays with the property record.',
			'Receipts, manuals, and warranties are part of the home story.',
			'Documents become more useful when they are not scattered.',
		],
		caption:
			'The right document is most useful when it is connected to the right part of the home.\n\nA warranty helps more when it is tied to the appliance.\n\nA receipt helps more when it is tied to the repair.\n\nA manual helps more when it is easy to find before a service visit.\n\nThe problem is that home documents usually end up wherever they first arrived: email, paper folders, text messages, photo rolls, or a drawer in the kitchen.\n\nMaintley helps homeowners keep documents, warranties, receipts, photos, and maintenance history connected to the property, so important records are easier to find when they matter.',
		short:
			'Home documents are more useful when they stay connected to the property.\n\nMaintley helps keep manuals, warranties, receipts, photos, and maintenance history organized around the home they belong to.',
		graphic: 'screenshot',
		cta: 'website',
		evergreen: 'High',
		followUps: [
			'Three documents every homeowner should be able to find quickly.',
			'Why warranty information should live with the appliance record.',
			'How scattered documents make maintenance harder.',
		],
	},
	{
		slug: 'photos-can-become-home-records',
		title: 'Photos can become home records',
		pillar: 'education',
		tags: ['photos', 'home records', 'maintenance history'],
		problem:
			'Homeowners often take useful photos during repairs but leave them buried in a camera roll.',
		evidence:
			'A photo of a model number, leak, repair, receipt, or finished work can explain what happened long after the project is over.',
		connection:
			'Maintley helps homeowners keep photos connected to the property record instead of leaving them separate from the maintenance history.',
		hooks: [
			'Some of the best home records start as quick photos.',
			'A photo is more useful when it is connected to the repair it explains.',
			'Your camera roll may already have part of your home history.',
			'The photo you take during a repair can help months later.',
			'Home photos become more valuable when they are organized with the property.',
		],
		caption:
			'Some of the best home records start as quick photos.\n\nA model number before a service call.\n\nA leak before it was repaired.\n\nA receipt before it gets misplaced.\n\nA finished repair before the details are forgotten.\n\nThe problem is that those photos usually stay in a camera roll, separate from the maintenance history they could help explain.\n\nMaintley helps homeowners keep photos, documents, warranties, and service notes connected to the property, so the visual record is easier to use later.',
		short:
			'A quick home photo can become a useful record later.\n\nMaintley helps keep photos connected to maintenance history, documents, and service notes so they are easier to find when they matter.',
		graphic: 'property photo',
		cta: 'discussion',
		evergreen: 'High',
		followUps: [
			'Five home photos worth saving before a repair.',
			'Why model number photos should stay with the equipment record.',
			'How repair photos help explain what happened later.',
		],
	},
	{
		slug: 'warranties-only-help-if-you-can-find-them',
		title: 'Warranties only help if you can find them',
		pillar: 'homeowner-moment',
		tags: ['warranties', 'documents', 'receipts', 'home records'],
		problem:
			'Warranty information is often saved somewhere, but not somewhere useful when a repair question comes up.',
		evidence:
			'A homeowner may have the warranty, receipt, install date, and model number, but each detail may live in a different place.',
		connection:
			'Maintley helps keep warranty details, receipts, equipment records, and maintenance history together.',
		hooks: [
			'A warranty only helps if you can find it when you need it.',
			'The hardest part of using a warranty is often finding the record.',
			'Warranty information should stay close to the thing it protects.',
			'A receipt in an inbox is not the same as a useful home record.',
			'The best time to organize warranty information is before something breaks.',
		],
		caption:
			'A warranty only helps if you can find it when you need it.\n\nThat usually means more than one document.\n\nYou may need the receipt, install date, model number, service history, and notes from the last repair.\n\nWhen those details are split across email, paper folders, text messages, and memory, the warranty becomes harder to use.\n\nMaintley helps keep warranty information, receipts, documents, and maintenance history connected to the property, so important records are easier to find before the next repair gets stressful.',
		short:
			'A warranty only helps if you can find it when you need it.\n\nMaintley keeps warranty information, receipts, documents, and maintenance history connected to the property.',
		graphic: 'checklist',
		cta: 'website',
		evergreen: 'High',
		followUps: [
			'What to save with a warranty record.',
			'Why install dates matter for warranty questions.',
			'How receipts become part of maintenance history.',
		],
	},
	{
		slug: 'future-you-should-not-have-to-start-over',
		title: 'Future you should not have to start over',
		pillar: 'property-memory',
		tags: ['future you', 'property records', 'maintenance history'],
		problem:
			'Homeowners often have to reconstruct old maintenance details from scratch because earlier records were never kept together.',
		evidence:
			'The next repair often starts with searching old emails, scrolling photos, checking calendars, and trying to remember who did the work last time.',
		connection:
			'Maintley helps each saved record make the next maintenance decision easier.',
		hooks: [
			'Future you should not have to start over every time something needs attention.',
			'The next repair is easier when the last repair left a record.',
			'Home maintenance gets harder when every problem starts from scratch.',
			'A good record gives future you a head start.',
			'Every saved detail can make the next decision easier.',
		],
		caption:
			'Future you should not have to start over every time something needs attention.\n\nWhen a repair comes up, the first questions are usually simple:\n\nWho fixed this last time?\nWhen was it serviced?\nIs there a warranty?\nWhere is the receipt?\nDid this happen before?\n\nThose questions get harder when every answer lives in a different place.\n\nMaintley helps homeowners keep maintenance history, documents, warranties, photos, and service notes connected to the property, so each saved record gives future you a better starting point.',
		short:
			'Future you should not have to start over with every repair.\n\nMaintley helps keep maintenance history, documents, warranties, photos, and notes connected to the property.',
		graphic: 'comparison',
		cta: 'discussion',
		evergreen: 'High',
		followUps: [
			'The five questions every repair record should answer.',
			'Why the next repair depends on the last repair record.',
			'How small records reduce future searching.',
		],
	},
	{
		slug: 'property-scan-is-not-a-grade',
		title: 'Property Scan is not a grade',
		pillar: 'product-update',
		tags: ['property scan', 'recommendations', 'maintley intelligence'],
		problem:
			'Homeowners do not need another score that makes their home feel incomplete. They need useful next steps.',
		evidence:
			'A long list of missing items can feel discouraging, even when the real opportunity is just to record a few practical details.',
		connection:
			'Maintley Intelligence reviews saved property records and suggests a few useful opportunities without silently changing user data.',
		hooks: [
			'Maintley Property Scan is not a grade for your home.',
			'Useful recommendations should feel practical, not judgmental.',
			'The goal is progress, not a perfect property record.',
			'Home records improve one useful detail at a time.',
			'A property scan should help you decide what is worth recording next.',
		],
		caption:
			'Maintley Property Scan is not a grade for your home.\n\nThe goal is not to tell homeowners their records are incomplete.\n\nThe goal is to review what Maintley already knows about the property and suggest a few useful next steps.\n\nMaybe that means adding a filter size, saving a warranty, recording a service date, or connecting a document to the right system.\n\nSmall improvements make the property record more useful over time.\n\nThat is the point: progress, not pressure.',
		short:
			'Maintley Property Scan is not a grade.\n\nIt reviews saved property records and suggests a few useful next steps, so the record becomes more helpful over time.',
		graphic: 'screenshot',
		cta: 'website',
		evergreen: 'Medium',
		followUps: [
			'Why Maintley recommends instead of judging.',
			'What a useful property recommendation should explain.',
			'How small record improvements add up over time.',
		],
	},
	{
		slug: 'contractor-names-are-home-records-too',
		title: 'Contractor names are home records too',
		pillar: 'homeowner-moment',
		tags: ['contractors', 'service history', 'home records'],
		problem:
			'Homeowners often remember that someone did good work but lose the name, company, or context later.',
		evidence:
			'A contractor name is most useful when it is tied to the job, date, system, invoice, and notes from the visit.',
		connection:
			'Maintley helps contractor information stay connected to the maintenance history it belongs to.',
		hooks: [
			'The name of a good contractor is part of your home record.',
			'Who did the work can matter just as much as what was done.',
			'The next service call is easier when the last one left a record.',
			'Contractor notes should not live only in old texts.',
			'A good service contact is easier to reuse when it stays with the property.',
		],
		caption:
			'The name of a good contractor is part of your home record.\n\nIt is useful to know what was fixed.\n\nIt is also useful to know who fixed it, when they came, what they recommended, and whether you would call them again.\n\nThose details are easy to lose when they live in old texts, invoices, or memory.\n\nMaintley helps keep contractor details connected to maintenance history, documents, photos, and service notes, so the next service call starts with better context.',
		short:
			'A good contractor name is part of your home record.\n\nMaintley helps keep contractor details connected to service history, documents, photos, and notes.',
		graphic: 'checklist',
		cta: 'discussion',
		evergreen: 'High',
		followUps: [
			'What to record after a contractor visit.',
			'Why contractor notes should stay with the maintenance event.',
			'How service history helps with repeat repairs.',
		],
	},
];

function printHelp() {
	process.stdout.write(`Generate a ready-to-post Maintley content draft.

Usage:
  yarn content:idea
  yarn content:idea -- --topic "documents belong with the property" --status ready
  node scripts/generateMaintleyContentIdea.cjs --pillar property-memory --source adr --dry-run

Options:
  --title <text>          Force the post title.
  --topic <text>          Guide the generated angle.
  --pillar <value>        One of: ${supportedPillars.join(', ')}
  --status <value>        One of: ${supportedStatuses.join(', ')}. Defaults to ready.
  --platforms <list>      Comma-separated platforms. Defaults to maintley-facebook,nextdoor,linkedin.
  --cta <value>           One of: ${supportedCtas.join(', ')}
  --source <value>        core, product, intelligence, adr, or all. Defaults to core.
  --count <number>        Number of separate drafts to create. Defaults to 1.
  --dry-run               Print the generated file path and content without writing.
  --help                  Show this help.
`);
}

function parseArgs(argv) {
	const options = {
		title: '',
		topic: '',
		pillar: '',
		status: 'ready',
		platforms: ['maintley-facebook', 'nextdoor', 'linkedin'],
		cta: '',
		source: 'core',
		count: 1,
		dryRun: false,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const readValue = () => {
			const value = argv[index + 1];
			if (!value || value.startsWith('--')) {
				throw new Error(`Missing value for ${arg}`);
			}
			index += 1;
			return value;
		};

		if (arg === '--title') options.title = readValue();
		else if (arg === '--topic') options.topic = readValue();
		else if (arg === '--pillar') options.pillar = readValue();
		else if (arg === '--status') options.status = readValue();
		else if (arg === '--platforms') {
			options.platforms = readValue()
				.split(',')
				.map((platform) => platform.trim())
				.filter(Boolean);
		} else if (arg === '--cta') options.cta = readValue();
		else if (arg === '--source') options.source = readValue();
		else if (arg === '--count') options.count = Number(readValue());
		else if (arg === '--dry-run') options.dryRun = true;
		else if (arg === '--help' || arg === '-h') {
			printHelp();
			process.exit(0);
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}

	validateOptions(options);
	return options;
}

function validateOptions(options) {
	if (!supportedStatuses.includes(options.status)) {
		throw new Error(`--status must be one of: ${supportedStatuses.join(', ')}`);
	}
	if (options.pillar && !supportedPillars.includes(options.pillar)) {
		throw new Error(`--pillar must be one of: ${supportedPillars.join(', ')}`);
	}
	if (!sourceRoots[options.source]) {
		throw new Error('--source must be one of: core, product, intelligence, adr, all');
	}
	if (options.cta && !supportedCtas.includes(options.cta)) {
		throw new Error(`--cta must be one of: ${supportedCtas.join(', ')}`);
	}
	if (!Number.isInteger(options.count) || options.count < 1 || options.count > 25) {
		throw new Error('--count must be a whole number between 1 and 25');
	}
	if (options.title && options.count > 1) {
		throw new Error('--title can only be used when --count is 1');
	}
	for (const platform of options.platforms) {
		if (!supportedPlatforms.includes(platform)) {
			throw new Error(`Unsupported platform "${platform}". Use one of: ${supportedPlatforms.join(', ')}`);
		}
	}
}

function normalizeToken(input) {
	return String(input || '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function slugify(input) {
	return normalizeToken(input).replace(/\s+/g, '-').replace(/^-|-$/g, '');
}

function toTitleCase(input) {
	return normalizeToken(input)
		.split(' ')
		.filter(Boolean)
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(' ');
}

function listMarkdownFiles(dir) {
	if (!fs.existsSync(dir)) return [];

	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...listMarkdownFiles(fullPath));
		} else if (entry.isFile() && entry.name.endsWith('.md')) {
			files.push(fullPath);
		}
	}
	return files;
}

function getNextContentNumber() {
	const files = listMarkdownFiles(contentDir);
	const usedNumbers = files
		.map((file) => path.basename(file).match(/^(\d{4})-/))
		.filter(Boolean)
		.map((match) => Number(match[1]));

	const highest = usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0;
	return String(highest + 1).padStart(4, '0');
}

function readExistingContentIndex() {
	const files = listMarkdownFiles(contentDir).filter((file) => {
		const relativePath = path.relative(contentDir, file).split(path.sep).join('/');
		return !relativePath.startsWith('templates/');
	});
	const entries = files.map((file) => {
		const text = fs.readFileSync(file, 'utf8');
		const relativePath = path.relative(rootDir, file).split(path.sep).join('/');
		const titleMatch = text.match(/^title:\s*(.+)$/im);
		const h1Match = text.match(/^#\s+(.+)$/m);
		const title = titleMatch ? titleMatch[1].trim() : h1Match ? h1Match[1].trim() : '';
		const slug = path.basename(file, '.md').replace(/^\d{4}-/, '');
		const searchText = [
			title,
			slug,
			text.match(/^# Summary\s+([\s\S]*?)(?:\n---|\n# )/m)?.[1] || '',
			text.match(/^# Alternate Hooks\s+([\s\S]*?)(?:\n---|\n# )/m)?.[1] || '',
		].join(' ');

		return {
			path: relativePath,
			title,
			slug,
			tokens: significantTokens(searchText),
		};
	});

	return entries;
}

function significantTokens(input) {
	const stopWords = new Set([
		'the',
		'and',
		'for',
		'that',
		'this',
		'with',
		'your',
		'home',
		'homes',
		'maintley',
		'property',
		'record',
		'records',
	]);
	return new Set(
		normalizeToken(input)
			.split(' ')
			.filter((token) => token.length > 3 && !stopWords.has(token))
	);
}

function tokenSimilarity(leftTokens, rightTokens) {
	if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
	let overlap = 0;
	for (const token of leftTokens) {
		if (rightTokens.has(token)) overlap += 1;
	}
	return overlap / Math.min(leftTokens.size, rightTokens.size);
}

function findDuplicateTopic(topic, existingEntries) {
	const topicSlug = slugify(topic.slug || topic.title);
	const topicTitle = normalizeToken(topic.title);
	const topicTokens = significantTokens(
		`${topic.title} ${topic.slug} ${topic.problem} ${topic.hooks.join(' ')} ${topic.tags.join(' ')}`
	);

	for (const entry of existingEntries) {
		if (entry.slug === topicSlug || slugify(entry.title) === topicSlug) {
			return entry;
		}
		if (entry.title && normalizeToken(entry.title) === topicTitle) {
			return entry;
		}
		if (tokenSimilarity(topicTokens, entry.tokens) >= 0.75) {
			return entry;
		}
	}

	return null;
}

function collectSourceFiles(sourceKey) {
	const sourcePaths = sourceRoots[sourceKey];
	const files = [];

	for (const relativePath of sourcePaths) {
		const fullPath = path.join(rootDir, relativePath);
		if (!fs.existsSync(fullPath)) continue;

		const stat = fs.statSync(fullPath);
		if (stat.isDirectory()) {
			files.push(
				...fs
					.readdirSync(fullPath, { withFileTypes: true })
					.filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
					.map((entry) => path.join(fullPath, entry.name))
			);
		} else if (stat.isFile()) {
			files.push(fullPath);
		}
	}

	return files;
}

function extractSourceNotes(files, topic) {
	const topicTokens = new Set(normalizeToken(topic).split(' ').filter((token) => token.length > 3));
	const notes = [];

	for (const file of files) {
		const relativePath = path.relative(rootDir, file).split(path.sep).join('/');
		const text = fs.readFileSync(file, 'utf8');
		const lines = text.split(/\r?\n/);
		const titleLine = lines.find((line) => /^#\s+/.test(line));
		const title = titleLine ? titleLine.replace(/^#\s+/, '').trim() : path.basename(file);
		const scoredLines = lines
			.map((line) => line.trim())
			.filter((line) => line.length >= 40 && line.length <= 180 && !line.startsWith('```'))
			.map((line) => {
				const normalized = normalizeToken(line);
				let score = 0;
				for (const token of topicTokens) {
					if (normalized.includes(token)) score += 2;
				}
				if (/property|home|maintenance|record|history|document|warranty|intelligence/i.test(line)) {
					score += 1;
				}
				return { line, score };
			})
			.filter((item) => item.score > 0)
			.sort((left, right) => right.score - left.score);

		notes.push({
			path: relativePath,
			title,
			note: scoredLines[0] ? scoredLines[0].line.replace(/^[-*]\s+/, '') : '',
		});
	}

	return notes.slice(0, 6);
}

function chooseTopics(options, existingEntries) {
	const requested = normalizeToken(`${options.topic} ${options.pillar}`);
	const scoredTopics = topicBank
		.map((topic, index) => {
			const haystack = normalizeToken(`${topic.title} ${topic.slug} ${topic.pillar} ${topic.tags.join(' ')}`);
			const tokens = requested.split(' ').filter((token) => token.length > 3);
			const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
			return { topic, score, index };
		})
		.sort((left, right) => right.score - left.score || left.index - right.index);
	const candidates = options.topic || options.pillar ? scoredTopics : scoredTopics.sort((left, right) => left.index - right.index);
	const selectedTopics = [];
	const duplicateNotes = [];
	const selectedEntries = [...existingEntries];

	for (const candidate of candidates) {
		const topic = {
			...candidate.topic,
			title: selectedTopics.length === 0 && options.title
				? options.title
				: selectedTopics.length === 0 && options.topic && options.count === 1
					? toTitleCase(options.topic)
					: candidate.topic.title,
			pillar: options.pillar || candidate.topic.pillar,
			cta: options.cta || candidate.topic.cta,
		};
		topic.slug = slugify(topic.title) || candidate.topic.slug;

		const duplicate = findDuplicateTopic(topic, selectedEntries);
		if (duplicate) {
			duplicateNotes.push(`${topic.title} -> ${duplicate.path}`);
			continue;
		}

		selectedTopics.push(topic);
		selectedEntries.push({
			path: `(current batch) ${topic.slug}`,
			title: topic.title,
			slug: topic.slug,
			tokens: significantTokens(
				`${topic.title} ${topic.slug} ${topic.problem} ${topic.hooks.join(' ')} ${topic.tags.join(' ')}`
			),
		});

		if (selectedTopics.length === options.count) break;
	}

	if (selectedTopics.length < options.count) {
		const duplicateSummary = duplicateNotes.length
			? ` Skipped similar existing topics:\n- ${duplicateNotes.join('\n- ')}`
			: '';
		throw new Error(
			`Only ${selectedTopics.length} non-duplicate topic(s) available for --count ${options.count}.${duplicateSummary}`
		);
	}

	return { topics: selectedTopics, duplicateNotes };
}

function platformVariant(platform, topic) {
	if (platform === 'nextdoor') {
		return `${topic.hooks[0]}\n\nOne practical habit: keep service dates, receipts, warranties, photos, and contractor notes in a place you can find later.\n\nIt does not need to be complicated. The goal is simply to make the next repair or replacement easier.`;
	}
	if (platform === 'linkedin') {
		return `${topic.hooks[2]}\n\nMaintley is built around a simple product belief: homes accumulate useful knowledge over time, and that knowledge should stay connected to the property.\n\nMaintenance history, documents, warranties, photos, and service notes become more valuable when they are organized before someone urgently needs them.`;
	}
	if (platform === 'dfv') {
		return `${topic.hooks[3]}\n\nThis is the kind of problem Dober Family Ventures is building Maintley around: practical systems that preserve useful knowledge and make everyday decisions easier.`;
	}
	if (platform === 'personal-facebook') {
		return `${topic.hooks[4]}\n\nThis is one of the homeowner problems behind Maintley. Most people do not need a more complicated system. They need a calmer place for home details to land before those details become hard to find.`;
	}
	if (platform === 'blog') {
		return `${topic.caption}\n\nThe broader point: property information should become more useful over time, not harder to reconstruct.`;
	}
	return topic.caption;
}

function formatYamlList(values) {
	return values.map((value) => `  - ${value}`).join('\n');
}

function formatPerformance() {
	return ['  impressions:', '  clicks:', '  reactions:', '  comments:', '  shares:', '  notes:'].join('\n');
}

function buildMarkdown(options, topic, sourceNotes) {
	const sourceList = sourceNotes.length
		? sourceNotes.map((source) => `- ${source.path}${source.note ? `: ${source.note}` : ''}`).join('\n')
		: '- No source notes were available.';
	const platformVariants = options.platforms
		.map((platform) => `## ${platform}\n\n${platformVariant(platform, topic)}`)
		.join('\n\n');
	const followUps = topic.followUps.map((item) => `- ${item}`).join('\n');
	const hooks = topic.hooks.map((hook, index) => `${index + 1}. ${hook}`).join('\n');
	const graphicSuggestions = [
		`${topic.graphic}: Use a calm, practical visual tied to home records, documents, maintenance history, or a simple before-and-after comparison.`,
		'screenshot: Use Maintley only if the screenshot clearly shows records connected to a property.',
		'checklist: Keep labels short and homeowner-friendly.',
	]
		.filter((item, index, items) => {
			const key = item.split(':')[0];
			return items.findIndex((candidate) => candidate.split(':')[0] === key) === index;
		})
		.map((item) => `- ${item}`)
		.join('\n');

	return `---
title: ${topic.title}
status: ${options.status}
pillar: ${topic.pillar}
platforms:
${formatYamlList(options.platforms)}
graphic: ${topic.graphic}
cta: ${topic.cta}
published_date:
tags:
${formatYamlList(topic.tags)}
performance:
${formatPerformance()}
---

# Summary

Ready-to-post generation based on Maintley source documentation. This post explains a familiar homeowner problem first, then connects it to Maintley's property-memory value without turning the caption into a hard sell.

---

# Problem

${topic.problem}

---

# Story / Evidence

${topic.evidence}

---

# Maintley Connection

${topic.connection}

---

# Recommended Post

${topic.caption}

---

# Platform-Ready Variants

${platformVariants}

---

# Graphic Suggestions

${graphicSuggestions}

---

# Alternate Hooks

${hooks}

---

# Short Version

${topic.short}

---

# Evergreen Score

${topic.evergreen}

---

# Source Notes

${sourceList}

---

# Future Follow-ups

${followUps}
`;
}

function ensureContentDirectories() {
	for (const folder of Object.values(folderByStatus)) {
		fs.mkdirSync(path.join(contentDir, folder), { recursive: true });
	}
}

function main() {
	try {
		const options = parseArgs(process.argv.slice(2));
		ensureContentDirectories();

		const existingEntries = readExistingContentIndex();
		const { topics, duplicateNotes } = chooseTopics(options, existingEntries);
		const startingNumber = Number(getNextContentNumber());
		const sourceFiles = collectSourceFiles(options.source);
		const generated = topics.map((topic, index) => {
			const number = String(startingNumber + index).padStart(4, '0');
			const folder = folderByStatus[options.status];
			const filePath = path.join(contentDir, folder, `${number}-${topic.slug}.md`);
			const sourceNotes = extractSourceNotes(sourceFiles, `${topic.title} ${topic.problem}`);
			const markdown = buildMarkdown(options, topic, sourceNotes);
			return { filePath, markdown };
		});

		for (const item of generated) {
			if (fs.existsSync(item.filePath)) {
				throw new Error(`Refusing to overwrite existing file: ${path.relative(rootDir, item.filePath)}`);
			}
		}

		if (options.dryRun) {
			if (duplicateNotes.length > 0) {
				process.stderr.write(`Skipped similar existing topics:\n- ${duplicateNotes.join('\n- ')}\n`);
			}
			process.stdout.write(
				generated
					.map((item) => `Dry run: ${path.relative(rootDir, item.filePath)}\n\n${item.markdown}`)
					.join('\n\n')
			);
			return;
		}

		for (const item of generated) {
			fs.writeFileSync(item.filePath, item.markdown, 'utf8');
			process.stdout.write(`Created ${path.relative(rootDir, item.filePath)}\n`);
		}
		if (duplicateNotes.length > 0) {
			process.stdout.write(`Skipped similar existing topics:\n- ${duplicateNotes.join('\n- ')}\n`);
		}
	} catch (error) {
		process.stderr.write(`Error: ${error.message}\n`);
		process.exit(1);
	}
}

main();
