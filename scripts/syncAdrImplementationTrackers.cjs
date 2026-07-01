#!/usr/bin/env node

/**
 * Sync Maintley ADR implementation tracker issues.
 *
 * The script is intentionally conservative:
 * - It only creates trackers for ADR statuses that imply accepted work.
 * - It uses a hidden issue marker to avoid duplicates.
 * - It does not overwrite existing issue bodies after creation.
 * - When an existing tracked ADR changes status, it adds a comment.
 *
 * Usage:
 *   node scripts/syncAdrImplementationTrackers.cjs --changed-from <sha> --changed-to <sha>
 *   node scripts/syncAdrImplementationTrackers.cjs --all --dry-run
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ADR_DIR = 'project-docs/ADR';
const TRACKING_STATUSES = new Set([
	'accepted',
	'accepted - planned',
	'accepted - in progress',
	'accepted - initial implementation',
	'accepted - phased implementation',
]);
const SKIP_STATUSES = new Set([
	'proposed',
	'implemented',
	'superseded',
	'rejected',
]);

const BASE_LABELS = [
	{
		name: 'adr',
		color: '5319e7',
		description: 'Architecture Decision Record follow-up',
	},
	{
		name: 'implementation-tracker',
		color: '0e8a16',
		description: 'Tracks implementation work for an accepted decision',
	},
	{
		name: 'architecture',
		color: '1d76db',
		description: 'Architecture-related work',
	},
	{
		name: 'needs-planning',
		color: 'fbca04',
		description: 'Needs planning or breakdown before completion',
	},
];

const parseArgs = (argv) => {
	const options = {
		all: false,
		changedFrom: '',
		changedTo: 'HEAD',
		dryRun: false,
		json: false,
		repo: process.env.GITHUB_REPOSITORY || '',
		token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '',
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

		if (arg === '--all') options.all = true;
		else if (arg === '--changed-from') options.changedFrom = readValue();
		else if (arg === '--changed-to') options.changedTo = readValue();
		else if (arg === '--repo') options.repo = readValue();
		else if (arg === '--token') options.token = readValue();
		else if (arg === '--dry-run') options.dryRun = true;
		else if (arg === '--json') options.json = true;
		else if (arg === '--help' || arg === '-h') {
			printHelp();
			process.exit(0);
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}

	return options;
};

const printHelp = () => {
	process.stdout.write(`Sync ADR implementation tracker issues.

Options:
  --all                   Scan all ADR files.
  --changed-from <sha>    Start ref for changed ADR detection.
  --changed-to <sha>      End ref for changed ADR detection. Defaults to HEAD.
  --repo <owner/repo>     GitHub repository. Defaults to GITHUB_REPOSITORY.
  --token <token>         GitHub token. Defaults to GITHUB_TOKEN or GH_TOKEN.
  --dry-run               Report intended actions without writing to GitHub.
  --json                  Print JSON summary.
`);
};

const log = (message) => {
	process.stderr.write(`${message}\n`);
};

const runGit = (args, options = {}) => {
	const safeDirectory = process.cwd().replace(/\\/g, '/');
	return execFileSync('git', ['-c', `safe.directory=${safeDirectory}`, ...args], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', options.allowFailure ? 'pipe' : 'inherit'],
	}).trim();
};

const tryGit = (args) => {
	try {
		return runGit(args, { allowFailure: true });
	} catch (_error) {
		return '';
	}
};

const normalizePath = (filePath) => filePath.replace(/\\/g, '/');

const isZeroSha = (value) => /^0+$/.test(String(value || '').trim());

const getAdrFiles = (options) => {
	if (options.all || !options.changedFrom || isZeroSha(options.changedFrom)) {
		return tryGit(['ls-files', `${ADR_DIR}/*.md`])
			.split(/\r?\n/)
			.map(normalizePath)
			.filter(Boolean);
	}

	const diffOutput = tryGit([
		'diff',
		'--name-status',
		options.changedFrom,
		options.changedTo || 'HEAD',
		'--',
		ADR_DIR,
	]);

	const files = [];
	for (const line of diffOutput.split(/\r?\n/).filter(Boolean)) {
		const parts = line.split(/\s+/);
		const status = parts[0];
		if (status.startsWith('D')) continue;

		const filePath = normalizePath(parts[parts.length - 1] || '');
		if (filePath.startsWith(`${ADR_DIR}/`) && filePath.endsWith('.md')) {
			files.push(filePath);
		}
	}

	return Array.from(new Set(files));
};

const readFileAtRef = (ref, filePath) => {
	if (!ref || isZeroSha(ref)) return '';
	return tryGit(['show', `${ref}:${filePath}`]);
};

const getFirstNonEmptyAfter = (lines, index) => {
	for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
		const value = lines[nextIndex].trim();
		if (value) return value;
	}
	return '';
};

const parseAdr = (filePath, content) => {
	const normalizedPath = normalizePath(filePath);
	const filename = path.basename(normalizedPath);
	const numberMatch =
		filename.match(/^(\d{4})/) ||
		content.match(/^#\s*ADR\s+(\d{4})\b/im) ||
		content.match(/^ADR\s+(\d{4})\b/im);
	const number = numberMatch ? numberMatch[1] : '';
	const id = number ? `ADR-${number}` : `ADR-${filename.replace(/\.md$/i, '')}`;
	const marker = `maintley-adr-tracker: ${id}`;
	const title = parseTitle(filename, content, number);
	const status = parseStatus(content);

	return {
		id,
		number,
		marker,
		title,
		status,
		normalizedStatus: normalizeStatus(status),
		filePath: normalizedPath,
	};
};

const parseTitle = (filename, content, number) => {
	const heading = content
		.split(/\r?\n/)
		.map((line) => line.trim())
		.find((line) => line.startsWith('# '));

	if (heading) {
		return heading
			.replace(/^#\s*/, '')
			.replace(/^ADR\s+\d{4}\s*[:.-]?\s*/i, '')
			.replace(/^ADR\s*[:.-]?\s*/i, '')
			.trim();
	}

	const adrLine = content
		.split(/\r?\n/)
		.map((line) => line.trim())
		.find((line) => /^ADR\s*:/i.test(line));

	if (adrLine) {
		return adrLine.replace(/^ADR\s*:\s*/i, '').trim();
	}

	return filename
		.replace(/\.md$/i, '')
		.replace(number || '', '')
		.replace(/^[-_\s]+/, '')
		.replace(/[-_]+/g, ' ')
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const parseStatus = (content) => {
	const lines = content.split(/\r?\n/);
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index].trim();
		const inlineMatch = line.match(/^(?:#+\s*)?Status\s*:\s*(.+)$/i);
		if (inlineMatch) return inlineMatch[1].trim();

		if (/^(?:#+\s*)?Status\s*:?\s*$/i.test(line)) {
			return getFirstNonEmptyAfter(lines, index);
		}
	}
	return '';
};

const normalizeStatus = (status) =>
	String(status || '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ');

const shouldTrackAdr = (adr) => {
	if (!adr.normalizedStatus) return false;
	if (SKIP_STATUSES.has(adr.normalizedStatus)) return false;
	return TRACKING_STATUSES.has(adr.normalizedStatus);
};

const buildIssueTitle = (adr) =>
	adr.number ? `ADR ${adr.number} - ${adr.title}` : `${adr.id} - ${adr.title}`;

const buildIssueBody = (adr) => `<!-- ${adr.marker} -->

This issue tracks implementation of ${adr.id.replace('-', ' ')}.

ADR:
${adr.filePath}

Current ADR Status:
${adr.status || 'Unknown'}

Implementation Checklist
- [ ] Data model / Firestore shape
- [ ] Backend / Functions
- [ ] Rules / permissions
- [ ] UI / user workflow
- [ ] Documentation updates
- [ ] Tests / validation
- [ ] Deployment notes

Completion Criteria
- ADR behavior is implemented.
- Documentation reflects the implemented behavior.
- Tests or manual validation are recorded.
- ADR status is updated to Implemented or Accepted - initial implementation.
`;

const buildStatusChangeComment = ({ adr, previousStatus }) => `ADR tracker sync noticed a status change.

ADR:
${adr.filePath}

Previous status:
${previousStatus || 'Unknown'}

Current status:
${adr.status || 'Unknown'}
`;

const githubRequest = async ({ method = 'GET', path: requestPath, token, body }) => {
	const response = await fetch(`https://api.github.com${requestPath}`, {
		method,
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			'X-GitHub-Api-Version': '2022-11-28',
		},
		...(body ? { body: JSON.stringify(body) } : {}),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`${method} ${requestPath} failed: ${response.status} ${text}`);
	}

	if (response.status === 204) return null;
	return response.json();
};

const ensureLabels = async ({ owner, repo, token, dryRun }) => {
	for (const label of BASE_LABELS) {
		if (dryRun) {
			log(`Dry run: would ensure label ${label.name}`);
			continue;
		}

		try {
			await githubRequest({
				path: `/repos/${owner}/${repo}/labels/${encodeURIComponent(label.name)}`,
				token,
			});
		} catch (error) {
			if (!String(error.message || '').includes('404')) {
				throw error;
			}
			await githubRequest({
				method: 'POST',
				path: `/repos/${owner}/${repo}/labels`,
				token,
				body: label,
			});
		}
	}
};

const findExistingIssue = async ({ owner, repo, token, marker }) => {
	const query = encodeURIComponent(`repo:${owner}/${repo} type:issue in:body "${marker}"`);
	const result = await githubRequest({
		path: `/search/issues?q=${query}`,
		token,
	});
	return result.items?.[0] || null;
};

const createIssue = async ({ owner, repo, token, adr, dryRun }) => {
	const title = buildIssueTitle(adr);
	const body = buildIssueBody(adr);
	const labels = BASE_LABELS.map((label) => label.name);

	if (dryRun) {
		log(`Dry run: would create issue "${title}"`);
		return { number: null, title, html_url: null, dryRun: true };
	}

	return githubRequest({
		method: 'POST',
		path: `/repos/${owner}/${repo}/issues`,
		token,
		body: { title, body, labels },
	});
};

const addComment = async ({ owner, repo, token, issueNumber, body, dryRun }) => {
	if (dryRun) {
		log(`Dry run: would comment on issue #${issueNumber}`);
		return null;
	}

	return githubRequest({
		method: 'POST',
		path: `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
		token,
		body: { body },
	});
};

const parseRepo = (repoValue) => {
	const [owner, repo] = String(repoValue || '').split('/');
	if (!owner || !repo) {
		throw new Error('Repository must be provided as owner/repo.');
	}
	return { owner, repo };
};

const validateExecutionContext = (options) => {
	if (options.dryRun) return;

	if (!options.repo) {
		throw new Error('GITHUB_REPOSITORY or --repo is required unless --dry-run is used.');
	}

	if (!options.token) {
		throw new Error('GITHUB_TOKEN or GH_TOKEN is required unless --dry-run is used.');
	}
};

const syncAdr = async ({ adr, previousAdr, github, options }) => {
	const result = {
		adr: adr.id,
		filePath: adr.filePath,
		status: adr.status,
		action: 'skipped',
		issueNumber: null,
		message: '',
	};

	if (!shouldTrackAdr(adr)) {
		result.message = adr.status
			? `ADR status is not tracked: ${adr.status}`
			: 'ADR has no status';
		return result;
	}

	const existingIssue = options.dryRun
		? null
		: await findExistingIssue({
				...github,
				marker: adr.marker,
		  });

	if (!existingIssue) {
		const createdIssue = await createIssue({
			...github,
			adr,
			dryRun: options.dryRun,
		});
		result.action = options.dryRun ? 'would_create' : 'created';
		result.issueNumber = createdIssue.number;
		result.message = createdIssue.html_url || buildIssueTitle(adr);
		return result;
	}

	result.issueNumber = existingIssue.number;
	result.action = 'exists';
	result.message = existingIssue.html_url;

	const previousStatus = previousAdr?.status || '';
	if (
		previousStatus &&
		normalizeStatus(previousStatus) !== adr.normalizedStatus
	) {
		await addComment({
			...github,
			issueNumber: existingIssue.number,
			body: buildStatusChangeComment({ adr, previousStatus }),
			dryRun: options.dryRun,
		});
		result.action = options.dryRun ? 'would_comment' : 'commented';
	}

	return result;
};

const main = async () => {
	const options = parseArgs(process.argv.slice(2));
	const files = getAdrFiles(options);
	const summary = {
		filesScanned: files.length,
		results: [],
	};

	if (files.length === 0) {
		if (options.json) process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
		else log('No ADR changes found.');
		return;
	}

	validateExecutionContext(options);

	const repoParts = options.repo ? parseRepo(options.repo) : null;
	const github = repoParts
		? { ...repoParts, token: options.token }
		: null;

	if (github) {
		await ensureLabels({ ...github, dryRun: options.dryRun });
	}

	for (const filePath of files) {
		if (!fs.existsSync(filePath)) continue;

		const content = fs.readFileSync(filePath, 'utf8');
		const adr = parseAdr(filePath, content);
		const previousContent = readFileAtRef(options.changedFrom, filePath);
		const previousAdr = previousContent ? parseAdr(filePath, previousContent) : null;

		if (!github) {
			summary.results.push({
				adr: adr.id,
				filePath: adr.filePath,
				status: adr.status,
				action: shouldTrackAdr(adr) ? 'would_create' : 'skipped',
				message: shouldTrackAdr(adr)
					? 'No repository configured; explicit dry-run preview only.'
					: 'ADR status is not tracked.',
			});
			continue;
		}

		const result = await syncAdr({ adr, previousAdr, github, options });
		summary.results.push(result);
	}

	if (options.json) {
		process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
		return;
	}

	for (const result of summary.results) {
		log(`${result.action}: ${result.adr} ${result.filePath} ${result.message}`);
	}
};

main().catch((error) => {
	process.stderr.write(`ADR tracker sync failed: ${error.message}\n`);
	process.exit(1);
});
