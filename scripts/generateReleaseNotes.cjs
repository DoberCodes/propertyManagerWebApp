#!/usr/bin/env node

/**
 * Generate Maintley release notes from the git range since the latest version tag.
 *
 * Defaults:
 * - Previous release: latest semver-like tag matching v*
 * - Target ref: HEAD
 * - Source of truth: local git history
 * - PR enrichment: optional GitHub CLI lookup when PR numbers are found
 *
 * Usage:
 *   node scripts/generateReleaseNotes.cjs
 *   node scripts/generateReleaseNotes.cjs --json --output RELEASE_NOTES.txt --engineering-output tmp/release-notes.engineering.md --metadata-output tmp/release-notes.json
 *   node scripts/generateReleaseNotes.cjs --from v2.7.16 --to HEAD --bump patch
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ENGINEERING_CATEGORY_ORDER = [
	'breaking',
	'highlights',
	'fixes',
	'backend',
	'android',
	'docs',
	'maintenance',
];

const ENGINEERING_CATEGORY_TITLES = {
	breaking: 'Breaking Changes',
	highlights: 'Highlights',
	fixes: 'Fixes',
	backend: 'Backend, Rules, and Billing',
	android: 'Android',
	docs: 'Docs',
	maintenance: 'Maintenance',
};

const CUSTOMER_CATEGORY_ORDER = ['whatsNew', 'improvements', 'fixes'];

const CUSTOMER_CATEGORY_TITLES = {
	whatsNew: "What's New",
	improvements: 'Improvements',
	fixes: 'Fixes',
};

const BUMP_ORDER = {
	none: 0,
	patch: 1,
	minor: 2,
	major: 3,
};

const SEMVER_PATTERN = /^v?\d+\.\d+\.\d+$/;

const parseArgs = (argv) => {
	const options = {
		from: '',
		to: 'HEAD',
		output: '',
		customerOutput: '',
		engineeringOutput: '',
		metadataOutput: '',
		version: '',
		bump: '',
		json: false,
		dryRun: false,
		allowEmpty: false,
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

		if (arg === '--from') options.from = readValue();
		else if (arg === '--to') options.to = readValue();
		else if (arg === '--output') options.output = readValue();
		else if (arg === '--customer-output') options.customerOutput = readValue();
		else if (arg === '--engineering-output') options.engineeringOutput = readValue();
		else if (arg === '--metadata-output') options.metadataOutput = readValue();
		else if (arg === '--version') options.version = readValue();
		else if (arg === '--bump') options.bump = readValue();
		else if (arg === '--json') options.json = true;
		else if (arg === '--dry-run') options.dryRun = true;
		else if (arg === '--allow-empty') options.allowEmpty = true;
		else if (arg === '--help' || arg === '-h') {
			printHelp();
			process.exit(0);
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}

	if (options.bump && !Object.prototype.hasOwnProperty.call(BUMP_ORDER, options.bump)) {
		throw new Error('--bump must be one of: major, minor, patch, none');
	}

	return options;
};

const log = (message) => {
	process.stderr.write(`${message}\n`);
};

const printHelp = () => {
	process.stdout.write(`Generate Maintley release notes.

Options:
  --from <tag>              Start tag/ref. Defaults to latest v* tag.
  --to <ref>                End ref. Defaults to HEAD.
  --output <file>           Write customer-facing release notes markdown to a file.
  --customer-output <file>  Write customer-facing release notes markdown to a file.
  --engineering-output <file>
                            Write engineering release notes markdown to a file.
  --metadata-output <file>  Write release metadata JSON to a file.
  --version <version>       Force output version.
  --bump <type>             Force bump: major, minor, patch, none.
  --json                    Print metadata JSON to stdout.
  --dry-run                 Do not write output files.
  --allow-empty             Produce empty release notes instead of failing.
`);
};

const run = (command, args, options = {}) =>
	{
		const commandArgs =
			command === 'git'
				? ['-c', `safe.directory=${process.cwd().replace(/\\/g, '/')}`, ...args]
				: args;
		return execFileSync(command, commandArgs, {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', options.allowFailure ? 'pipe' : 'inherit'],
			...options,
		}).trim();
	};

const tryRun = (command, args) => {
	try {
		return run(command, args, { allowFailure: true });
	} catch (_error) {
		return '';
	}
};

const ensureGitRepo = () => {
	const insideRepo = tryRun('git', ['rev-parse', '--is-inside-work-tree']);
	if (insideRepo !== 'true') {
		throw new Error('Release notes must be generated from inside a git repository.');
	}
};

const readPackageVersion = () => {
	const packagePath = path.resolve(process.cwd(), 'package.json');
	const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
	return String(packageJson.version || '0.0.0');
};

const isSemverVersion = (version) => SEMVER_PATTERN.test(String(version || '').trim());

const getVersionFromRef = (ref) => {
	const normalized = String(ref || '').trim();
	return isSemverVersion(normalized) ? normalized.replace(/^v/, '') : '';
};

const parseVersion = (version) => {
	const match = String(version || '').trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
	if (!match) {
		throw new Error(`Invalid semver version: ${version}`);
	}
	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
	};
};

const formatVersion = ({ major, minor, patch }) => `${major}.${minor}.${patch}`;

const compareVersions = (leftVersion, rightVersion) => {
	const left = parseVersion(leftVersion);
	const right = parseVersion(rightVersion);

	for (const key of ['major', 'minor', 'patch']) {
		if (left[key] > right[key]) return 1;
		if (left[key] < right[key]) return -1;
	}

	return 0;
};

const bumpVersion = (currentVersion, bump) => {
	const parsed = parseVersion(currentVersion);
	if (bump === 'major') {
		return formatVersion({ major: parsed.major + 1, minor: 0, patch: 0 });
	}
	if (bump === 'minor') {
		return formatVersion({ major: parsed.major, minor: parsed.minor + 1, patch: 0 });
	}
	if (bump === 'patch') {
		return formatVersion({
			major: parsed.major,
			minor: parsed.minor,
			patch: parsed.patch + 1,
		});
	}
	return formatVersion(parsed);
};

const getLatestVersionTag = () => {
	const tags = tryRun('git', ['tag', '--list', 'v[0-9]*', '--sort=-v:refname'])
		.split(/\r?\n/)
		.map((tag) => tag.trim())
		.filter(Boolean);
	return tags[0] || '';
};

const getCommitRows = (fromRef, toRef) => {
	const range = fromRef ? `${fromRef}..${toRef}` : toRef;
	const filesByCommit = getCommitFilesByRange(range);
	const output = tryRun('git', [
		'log',
		range,
		'--first-parent',
		'--pretty=format:%H%x1f%P%x1f%an%x1f%ae%x1f%aI%x1f%s%x1e',
	]);

	if (!output) return [];

	return output
		.split('\x1e')
		.map((row) => row.trim())
		.filter(Boolean)
		.map((row) => {
			const [sha, parents, authorName, authorEmail, date, subject] = row.split('\x1f');
			return {
				sha,
				parents: parents ? parents.split(' ').filter(Boolean) : [],
				authorName,
				authorEmail,
				date,
				subject: subject || '',
				files: filesByCommit.get(sha) || [],
			};
		})
		.filter((commit) => !isReleaseCommit(commit.subject));
};

const getCommitFilesByRange = (range) => {
	const output = tryRun('git', [
		'log',
		range,
		'--first-parent',
		'--name-only',
		'--pretty=format:%x1e%H',
	]);
	const filesByCommit = new Map();
	let currentSha = '';

	for (const rawLine of output.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line) continue;

		if (line.startsWith('\x1e')) {
			currentSha = line.slice(1).trim();
			if (currentSha && !filesByCommit.has(currentSha)) {
				filesByCommit.set(currentSha, []);
			}
			continue;
		}

		if (currentSha) {
			filesByCommit.get(currentSha).push(line);
		}
	}

	return filesByCommit;
};

const isReleaseCommit = (subject) => {
	const normalized = String(subject || '').trim().toLowerCase();
	return (
		normalized.startsWith('release:') ||
		normalized.startsWith('chore(release):') ||
		normalized.startsWith('chore: release') ||
		isReleaseAutomationTitle(subject)
	);
};

const isReleaseAutomationTitle = (title) => {
	const normalized = String(title || '')
		.trim()
		.replace(/\s*\(#\d+\)\s*$/, '')
		.toLowerCase();

	return (
		/^release v\d+\.\d+\.\d+(?:[-+][0-9a-z.-]+)?$/.test(normalized) ||
		/^release: prepare v\d+\.\d+\.\d+(?:[-+][0-9a-z.-]+)?$/.test(normalized) ||
		/^chore: prepare release v\d+\.\d+\.\d+(?:[-+][0-9a-z.-]+)?$/.test(normalized)
	);
};

const isReleaseAutomationEntry = (entry) =>
	isReleaseAutomationTitle(entry.title) ||
	isReleaseAutomationTitle(entry.rawTitle) ||
	String(entry.headRefName || '').trim().toLowerCase() === 'release/next';

const getPrNumberFromSubject = (subject) => {
	const mergeMatch = subject.match(/merge pull request #(\d+)/i);
	if (mergeMatch) return mergeMatch[1];

	const squashMatch = subject.match(/\(#(\d+)\)\s*$/);
	if (squashMatch) return squashMatch[1];

	return '';
};

const getRepoFlag = () => {
	const envRepo = String(process.env.GITHUB_REPOSITORY || '').trim();
	if (envRepo) return ['--repo', envRepo];

	const ghRepo = tryRun('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']);
	return ghRepo ? ['--repo', ghRepo] : [];
};

const fetchPr = (number) => {
	const repoFlag = getRepoFlag();
	const output = tryRun('gh', [
		'pr',
		'view',
		String(number),
		'--json',
		'number,title,body,labels,author,mergedAt,url,baseRefName,headRefName',
		...repoFlag,
	]);
	if (!output) return null;

	try {
		return JSON.parse(output);
	} catch (_error) {
		return null;
	}
};

const buildEntries = (commits) => {
	const prEntries = new Map();
	const directEntries = [];
	const warnings = [];

	for (const commit of commits) {
		const prNumber = getPrNumberFromSubject(commit.subject);
		if (!prNumber) {
			directEntries.push(buildDirectEntry(commit));
			warnings.push(`Direct commit without PR detected: ${commit.sha.slice(0, 7)} ${commit.subject}`);
			continue;
		}

		if (prEntries.has(prNumber)) {
			prEntries.get(prNumber).commits.push(commit);
			continue;
		}

		const pr = fetchPr(prNumber);
		const entry = pr ? buildPrEntry(pr, commit) : buildPrFallbackEntry(prNumber, commit);
		if (isReleaseAutomationEntry(entry)) {
			continue;
		}
		entry.commits = [commit];
		prEntries.set(prNumber, entry);
	}

	return {
		entries: [...prEntries.values(), ...directEntries].sort(
			(a, b) => new Date(a.date) - new Date(b.date),
		),
		warnings,
	};
};

const buildPrEntry = (pr, commit) => {
	const labels = Array.isArray(pr.labels)
		? pr.labels.map((label) => String(label.name || '').trim().toLowerCase()).filter(Boolean)
		: [];
	const files = commit.files || [];
	const rawTitle = pr.title || commit.subject;
	const title = cleanTitle(rawTitle);
	const category = categorize({ title: rawTitle, labels, files, body: pr.body || '' });
	const customerCategory = inferCustomerCategory({
		title: rawTitle,
		labels,
		files,
		body: pr.body || '',
		engineeringCategory: category,
	});

	return {
		type: 'pr',
		number: pr.number,
		title,
		rawTitle,
		body: pr.body || '',
		labels,
		author: pr.author?.login || commit.authorName,
		date: pr.mergedAt || commit.date,
		url: pr.url || '',
		headRefName: pr.headRefName || '',
		files,
		category,
		customerCategory,
		customerSummary: toCustomerSummary({ title: rawTitle, body: pr.body || '' }),
		bump: inferBump({ title: rawTitle, labels, body: pr.body || '' }),
	};
};

const buildPrFallbackEntry = (number, commit) => {
	const rawTitle = commit.subject.replace(/\s*\(#\d+\)\s*$/, '');
	const title = cleanTitle(rawTitle);
	const category = categorize({ title: rawTitle, labels: [], files: commit.files || [], body: '' });
	const customerCategory = inferCustomerCategory({
		title: rawTitle,
		labels: [],
		files: commit.files || [],
		body: '',
		engineeringCategory: category,
	});
	return {
		type: 'pr',
		number,
		title,
		rawTitle,
		body: '',
		labels: [],
		author: commit.authorName,
		date: commit.date,
		url: '',
		files: commit.files || [],
		category,
		customerCategory,
		customerSummary: toCustomerSummary({ title: rawTitle, body: '' }),
		bump: inferBump({ title: rawTitle, labels: [], body: '' }),
	};
};

const buildDirectEntry = (commit) => {
	const rawTitle = commit.subject;
	const title = cleanTitle(rawTitle);
	const category = categorize({ title: rawTitle, labels: [], files: commit.files || [], body: '' });
	const customerCategory = inferCustomerCategory({
		title: rawTitle,
		labels: [],
		files: commit.files || [],
		body: '',
		engineeringCategory: category,
	});
	return {
		type: 'commit',
		sha: commit.sha,
		title,
		rawTitle,
		body: '',
		labels: [],
		author: commit.authorName,
		date: commit.date,
		url: '',
		files: commit.files || [],
		category,
		customerCategory,
		customerSummary: toCustomerSummary({ title: rawTitle, body: '' }),
		bump: inferBump({ title: rawTitle, labels: [], body: '' }),
	};
};

const cleanTitle = (title) =>
	String(title || '')
		.replace(/^feat(?:\(.+?\))?:\s*/i, '')
		.replace(/^feature(?:\(.+?\))?:\s*/i, '')
		.replace(/^fix(?:\(.+?\))?:\s*/i, '')
		.replace(/^docs(?:\(.+?\))?:\s*/i, '')
		.replace(/^chore(?:\(.+?\))?:\s*/i, '')
		.replace(/^refactor(?:\(.+?\))?:\s*/i, '')
		.replace(/^build(?:\(.+?\))?:\s*/i, '')
		.replace(/^ci(?:\(.+?\))?:\s*/i, '')
		.replace(/^test(?:\(.+?\))?:\s*/i, '')
		.trim();

const hasAny = (values, patterns) =>
	values.some((value) => patterns.some((pattern) => pattern.test(value)));

const hasLabel = (labels, patterns) => hasAny(labels, patterns);

const extractReleaseNote = (body) => {
	const lines = String(body || '').split(/\r?\n/);
	const inlinePatterns = [
		/^\s*(?:customer release note|release note|customer note|customer-facing summary|user-facing summary)\s*:\s*(.+)$/i,
	];
	for (const line of lines) {
		for (const pattern of inlinePatterns) {
			const match = line.match(pattern);
			if (match?.[1]) return cleanReleaseNote(match[1]);
		}
	}

	const headerPattern =
		/^\s*#{1,6}\s*(?:customer release note|release note|customer note|customer-facing summary|user-facing summary)s?\s*$/i;
	const nextHeaderPattern = /^\s*#{1,6}\s+\S+/;
	const startIndex = lines.findIndex((line) => headerPattern.test(line));
	if (startIndex === -1) return '';

	const sectionLines = [];
	for (let index = startIndex + 1; index < lines.length; index += 1) {
		const line = lines[index];
		if (nextHeaderPattern.test(line)) break;
		if (!line.trim() && sectionLines.length === 0) continue;
		sectionLines.push(line);
	}

	return cleanReleaseNote(sectionLines.join(' '));
};

const cleanReleaseNote = (value) =>
	String(value || '')
		.replace(/\s+/g, ' ')
		.replace(/^[-*]\s+/, '')
		.trim();

const sentenceCase = (value) => {
	const text = String(value || '').trim();
	if (!text) return '';
	return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
};

const toCustomerSummary = ({ title, body }) => {
	const explicitNote = extractReleaseNote(body);
	if (explicitNote) return explicitNote;

	const cleaned = cleanTitle(title)
		.replace(/\bADR\b/g, 'architecture decision')
		.replace(/\bCI\b/g, 'release automation')
		.replace(/\bPWA\b/g, 'installable web app')
		.replace(/\bUI\b/g, 'screen')
		.replace(/\bUX\b/g, 'experience');

	return sentenceCase(cleaned);
};

const inferCustomerCategory = ({ title, labels, files, body, engineeringCategory }) => {
	const text = `${title}\n${body || ''}`.toLowerCase();
	const fileText = files.join('\n').toLowerCase();

	if (
		hasLabel(labels, [/no[- ]?release[- ]?note/, /internal/, /dependencies?/, /chore/]) ||
		(/^chore(?:\(.+?\))?:/i.test(title) && !extractReleaseNote(body))
	) {
		return '';
	}

	if (engineeringCategory === 'breaking' || engineeringCategory === 'highlights') {
		return 'whatsNew';
	}

	if (
		engineeringCategory === 'fixes' ||
		hasLabel(labels, [/bug/, /fix/]) ||
		/^fix(?:\(.+?\))?:/i.test(title)
	) {
		return 'fixes';
	}

	if (
		extractReleaseNote(body) ||
		hasLabel(labels, [
			/customer[- ]?facing/,
			/release[- ]?note/,
			/enhancement/,
			/feature/,
			/mobile/,
			/android/,
			/billing/,
			/dashboard/,
			/support/,
			/notification/,
		])
	) {
		return engineeringCategory === 'highlights' ? 'whatsNew' : 'improvements';
	}

	if (
		engineeringCategory === 'android' ||
		/\b(login|dashboard|task|property|document|profile|support|ticket|notification|billing|checkout|android|mobile|app)\b/.test(
			text,
		)
	) {
		return 'improvements';
	}

	if (
		engineeringCategory === 'docs' ||
		engineeringCategory === 'maintenance' ||
		/(^|\n|\/)(scripts|project-docs|\.github|README|package-lock|yarn\.lock)/i.test(fileText)
	) {
		return '';
	}

	return 'improvements';
};

const categorize = ({ title, labels, files, body }) => {
	const text = `${title}\n${body || ''}`.toLowerCase();
	const labelText = labels.join(' ');
	const fileText = files.join('\n').toLowerCase();

	if (
		/breaking change|breaking:/i.test(text) ||
		/^[a-z]+(?:\(.+?\))?!:/i.test(title) ||
		/\bbreaking\b/.test(labelText)
	) {
		return 'breaking';
	}

	if (hasAny(labels, [/bug/, /fix/]) || /^fix(?:\(.+?\))?:/i.test(title)) {
		return 'fixes';
	}

	if (
		hasAny(labels, [/billing/, /backend/, /firebase/, /functions/, /rules/, /stripe/]) ||
		/(^|\n|\/)(functions|firestore\.rules|firebase\.json)/.test(fileText) ||
		/\b(stripe|billing|firestore|firebase|function|rules)\b/.test(text)
	) {
		return 'backend';
	}

	if (
		hasAny(labels, [/android/, /mobile/, /capacitor/]) ||
		/(^|\n|\/)(android|capacitor\.config)/.test(fileText) ||
		/\b(android|apk|capacitor|mobile)\b/.test(text)
	) {
		return 'android';
	}

	if (
		hasAny(labels, [/docs/, /documentation/]) ||
		/(^|\n|\/)(project-docs|docs|README|AGENTS\.md)/i.test(fileText) ||
		/^docs(?:\(.+?\))?:/i.test(title)
	) {
		return 'docs';
	}

	if (
		hasAny(labels, [/feature/, /enhancement/, /highlight/]) ||
		/^feat(?:\(.+?\))?:/i.test(title) ||
		/^feature(?:\(.+?\))?:/i.test(title)
	) {
		return 'highlights';
	}

	return 'maintenance';
};

const inferBump = ({ title, labels, body }) => {
	const text = `${title}\n${body || ''}`.toLowerCase();
	if (
		/breaking change|breaking:/.test(text) ||
		/^[a-z]+(?:\(.+?\))?!:/i.test(title) ||
		labels.some((label) => label === 'breaking' || label === 'breaking-change')
	) {
		return 'major';
	}
	if (
		labels.some((label) => /feature|enhancement|highlight/.test(label)) ||
		/^feat(?:\(.+?\))?:/i.test(title) ||
		/^feature(?:\(.+?\))?:/i.test(title)
	) {
		return 'minor';
	}
	return 'patch';
};

const inferOverallBump = (entries) => {
	let result = 'none';
	for (const entry of entries) {
		if (BUMP_ORDER[entry.bump] > BUMP_ORDER[result]) {
			result = entry.bump;
		}
	}
	return result;
};

const formatEntry = (entry) => {
	const suffix =
		entry.type === 'pr'
			? ` (#${entry.number})`
			: ` (${String(entry.sha || '').slice(0, 7)})`;
	return `- ${entry.title}${suffix}`;
};

const formatCustomerEntry = (entry) => `- ${entry.customerSummary || entry.title}`;

const formatCustomerReleaseNotes = ({ version, entries }) => {
	const customerEntries = entries.filter((entry) => entry.customerCategory);
	const lines = [`# Maintley v${version}`, '', 'Here is what improved in this release.', ''];

	if (customerEntries.length === 0) {
		lines.push(
			'This release includes behind-the-scenes improvements to keep Maintley faster, steadier, and easier to maintain.',
		);
		lines.push('');
		return `${lines.join('\n').trim()}\n`;
	}

	for (const category of CUSTOMER_CATEGORY_ORDER) {
		const categoryEntries = customerEntries.filter(
			(entry) => entry.customerCategory === category,
		);
		if (categoryEntries.length === 0) continue;
		lines.push(`## ${CUSTOMER_CATEGORY_TITLES[category]}`);
		lines.push(...categoryEntries.map(formatCustomerEntry));
		lines.push('');
	}

	return `${lines.join('\n').trim()}\n`;
};

const formatEngineeringReleaseNotes = ({ version, previousTag, targetRef, entries }) => {
	const lines = [`# Engineering Release Notes for v${version}`, ''];
	if (previousTag) {
		lines.push(`Changes since ${previousTag}.`, '');
	} else {
		lines.push(`Changes through ${targetRef}.`, '');
	}

	for (const category of ENGINEERING_CATEGORY_ORDER) {
		const categoryEntries = entries.filter((entry) => entry.category === category);
		if (categoryEntries.length === 0) continue;
		lines.push(`## ${ENGINEERING_CATEGORY_TITLES[category]}`);
		lines.push(...categoryEntries.map(formatEntry));
		lines.push('');
	}

	return `${lines.join('\n').trim()}\n`;
};

const ensureParentDir = (filePath) => {
	const dir = path.dirname(path.resolve(filePath));
	fs.mkdirSync(dir, { recursive: true });
};

const main = () => {
	const options = parseArgs(process.argv.slice(2));
	ensureGitRepo();

	const packageVersion = readPackageVersion();
	const latestVersionTag = getLatestVersionTag();
	const rangeStartRef = options.from || latestVersionTag;
	const previousVersionTag = getVersionFromRef(rangeStartRef)
		? rangeStartRef
		: latestVersionTag;
	const targetRef = options.to || 'HEAD';
	const commits = getCommitRows(rangeStartRef, targetRef);
	const range = rangeStartRef ? `${rangeStartRef}..${targetRef}` : targetRef;

	if (commits.length === 0 && !options.allowEmpty) {
		throw new Error(`No releaseable commits found for range ${range}.`);
	}

	const { entries, warnings } = buildEntries(commits);
	const inferredBump = inferOverallBump(entries);
	const selectedBump = options.bump || inferredBump || 'patch';
	const previousVersion = getVersionFromRef(previousVersionTag);
	const packageVersionIsAheadOfPreviousTag =
		previousVersion && compareVersions(packageVersion, previousVersion) > 0;
	const expectedVersionFromPreviousTag = previousVersion
		? bumpVersion(previousVersion, selectedBump)
		: bumpVersion(packageVersion, selectedBump);
	const selectedAutomaticVersion =
		packageVersionIsAheadOfPreviousTag &&
		compareVersions(packageVersion, expectedVersionFromPreviousTag) > 0
			? packageVersion
			: expectedVersionFromPreviousTag;
	const version =
		options.version || selectedAutomaticVersion;
	if (!isSemverVersion(version)) {
		throw new Error(`Release version must be semver, received: ${version}`);
	}
	const packageVersionIsPrepared =
		packageVersionIsAheadOfPreviousTag &&
		compareVersions(version, packageVersion) === 0;
	const customerNotes = formatCustomerReleaseNotes({
		version,
		entries,
	});
	const engineeringNotes = formatEngineeringReleaseNotes({
		version,
		previousTag: rangeStartRef,
		targetRef,
		entries,
	});

	const metadata = {
		version,
		notes: customerNotes,
		customerNotes,
		engineeringNotes,
		previousTag: previousVersionTag || null,
		rangeStartRef: rangeStartRef || null,
		targetRef,
		range,
		packageVersion,
		packageVersionIsPrepared,
		expectedVersionFromPreviousTag,
		bump: selectedBump,
		inferredBump,
		counts: {
			commits: commits.length,
			entries: entries.length,
			customerEntries: entries.filter((entry) => entry.customerCategory).length,
			pullRequests: entries.filter((entry) => entry.type === 'pr').length,
			directCommits: entries.filter((entry) => entry.type === 'commit').length,
		},
		warnings,
	};

	if (warnings.length > 0) {
		for (const warning of warnings) {
			log(`Warning: ${warning}`);
		}
	}

	if (options.output && !options.dryRun) {
		ensureParentDir(options.output);
		fs.writeFileSync(options.output, customerNotes, 'utf8');
		log(`Wrote customer release notes to ${options.output}`);
	}

	if (options.customerOutput && !options.dryRun) {
		ensureParentDir(options.customerOutput);
		fs.writeFileSync(options.customerOutput, customerNotes, 'utf8');
		log(`Wrote customer release notes to ${options.customerOutput}`);
	}

	if (options.engineeringOutput && !options.dryRun) {
		ensureParentDir(options.engineeringOutput);
		fs.writeFileSync(options.engineeringOutput, engineeringNotes, 'utf8');
		log(`Wrote engineering release notes to ${options.engineeringOutput}`);
	}

	if (options.metadataOutput && !options.dryRun) {
		ensureParentDir(options.metadataOutput);
		fs.writeFileSync(options.metadataOutput, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
		log(`Wrote release metadata to ${options.metadataOutput}`);
	}

	if (options.json) {
		process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`);
	} else {
		process.stdout.write(customerNotes);
	}
};

try {
	main();
} catch (error) {
	process.stderr.write(`Release notes generation failed: ${error.message}\n`);
	process.exit(1);
}
