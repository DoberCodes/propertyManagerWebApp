const TYPE_DEFINITIONS = {
	feat: {
		label: 'Feature',
		bump: 'minor',
		customerCategory: 'whatsNew',
		customerCategoryLabel: 'New features',
	},
	fix: {
		label: 'Fix',
		bump: 'patch',
		customerCategory: 'fixes',
		customerCategoryLabel: 'Fixes',
	},
	perf: {
		label: 'Improvement',
		bump: 'patch',
		customerCategory: 'improvements',
		customerCategoryLabel: 'Improvements',
	},
	refactor: {
		label: 'Refactor',
		bump: 'none',
		customerCategory: '',
		customerCategoryLabel: 'Internal only',
	},
	docs: {
		label: 'Documentation',
		bump: 'none',
		customerCategory: '',
		customerCategoryLabel: 'Internal only',
	},
	chore: {
		label: 'Maintenance',
		bump: 'none',
		customerCategory: '',
		customerCategoryLabel: 'Internal only',
	},
	ci: {
		label: 'Release automation',
		bump: 'none',
		customerCategory: '',
		customerCategoryLabel: 'Internal only',
	},
	build: {
		label: 'Build',
		bump: 'none',
		customerCategory: '',
		customerCategoryLabel: 'Internal only',
	},
	test: {
		label: 'Test',
		bump: 'none',
		customerCategory: '',
		customerCategoryLabel: 'Internal only',
	},
};

const TYPE_ALIASES = {
	feature: 'feat',
	bugfix: 'fix',
	bug: 'fix',
	improvement: 'perf',
	enhancement: 'perf',
};

const BUMP_ORDER = { none: 0, patch: 1, minor: 2, major: 3 };
const CONVENTIONAL_TITLE_PATTERN =
	/^(feat|feature|fix|bugfix|bug|perf|improvement|enhancement|refactor|docs|chore|ci|build|test)(?:\(([^)]+)\))?(!)?:\s+(.+)$/i;

function normalizeType(type) {
	const normalized = String(type || '').trim().toLowerCase();
	return TYPE_ALIASES[normalized] || normalized;
}

function parseConventionalTitle(value) {
	const title = String(value || '').trim();
	const match = title.match(CONVENTIONAL_TITLE_PATTERN);
	if (!match) return null;
	const type = normalizeType(match[1]);
	if (!TYPE_DEFINITIONS[type]) return null;
	const breaking = Boolean(match[3]);
	const definition = TYPE_DEFINITIONS[type];
	return {
		type,
		scope: match[2] || '',
		breaking,
		description: match[4].trim(),
		prefix: `${type}${match[2] ? `(${match[2]})` : ''}${breaking ? '!' : ''}:`,
		label: breaking ? 'Breaking feature' : definition.label,
		bump: breaking ? 'major' : definition.bump,
		customerCategory: breaking ? 'whatsNew' : definition.customerCategory,
		customerCategoryLabel: breaking
			? 'New features and breaking changes'
			: definition.customerCategoryLabel,
	};
}

function extractDeclaredType(body) {
	const manualBody = String(body || '').split('<!-- maintley-pr-summary:start -->', 1)[0];
	const match = manualBody.match(
		/^\s*(?:release type|release classification)\s*:\s*`?([a-z]+!?|breaking)`?\s*$/im,
	);
	if (!match) return null;
	let value = match[1].toLowerCase();
	let breaking = value === 'breaking' || value.endsWith('!');
	value = value.replace(/!$/, '');
	if (value === 'breaking') value = 'feat';
	const type = normalizeType(value);
	if (!TYPE_DEFINITIONS[type]) return null;
	const definition = TYPE_DEFINITIONS[type];
	return {
		type,
		scope: '',
		breaking,
		description: '',
		prefix: `${type}${breaking ? '!' : ''}:`,
		label: breaking ? 'Breaking feature' : definition.label,
		bump: breaking ? 'major' : definition.bump,
		customerCategory: breaking ? 'whatsNew' : definition.customerCategory,
		customerCategoryLabel: breaking
			? 'New features and breaking changes'
			: definition.customerCategoryLabel,
	};
}

function commitSubject(commit) {
	const message = commit?.commit?.message || commit?.message || commit?.subject || '';
	return String(message).split(/\r?\n/, 1)[0].trim();
}

function selectHighestClassification(classifications) {
	return classifications.reduce((selected, candidate) => {
		if (!candidate) return selected;
		if (!selected || BUMP_ORDER[candidate.bump] > BUMP_ORDER[selected.bump]) {
			return candidate;
		}
		return selected;
	}, null);
}

function resolveReleaseClassification({ title, body, commits = [] }) {
	const fromBody = extractDeclaredType(body);
	if (fromBody) return { ...fromBody, source: 'pull request declaration' };
	const fromTitle = parseConventionalTitle(title);
	if (fromTitle) return { ...fromTitle, source: 'pull request title' };
	const fromCommits = selectHighestClassification(
		commits.map((commit) => parseConventionalTitle(commitSubject(commit))),
	);
	if (fromCommits) return { ...fromCommits, source: 'commit prefixes' };
	return null;
}

function stripKnownPrefix(title) {
	const parsed = parseConventionalTitle(title);
	return parsed ? parsed.description : String(title || '').trim();
}

function normalizePullRequestTitle(title, classification) {
	if (!classification) return String(title || '').trim();
	const description = stripKnownPrefix(title);
	return `${classification.prefix} ${description}`.trim();
}

module.exports = {
	BUMP_ORDER,
	TYPE_DEFINITIONS,
	commitSubject,
	extractDeclaredType,
	normalizePullRequestTitle,
	normalizeType,
	parseConventionalTitle,
	resolveReleaseClassification,
	selectHighestClassification,
};
