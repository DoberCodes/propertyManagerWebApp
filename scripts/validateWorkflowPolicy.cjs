const fs = require('node:fs');
const path = require('node:path');
const { parseDocument } = require('yaml');

const repositoryRoot = path.resolve(__dirname, '..');
const workflowDirectory = path.join(repositoryRoot, '.github', 'workflows');
const actionDirectory = path.join(repositoryRoot, '.github', 'actions');
const dependabotPath = path.join(repositoryRoot, '.github', 'dependabot.yml');

const listYamlFiles = (directory) => {
	if (!fs.existsSync(directory)) return [];

	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) return listYamlFiles(entryPath);
		return /\.ya?ml$/i.test(entry.name) ? [entryPath] : [];
	});
};

const parseYamlFile = (filePath, relativePath, issues) => {
	const document = parseDocument(fs.readFileSync(filePath, 'utf8'));
	for (const error of document.errors) {
		issues.push(`${relativePath}: invalid YAML: ${error.message}`);
	}
	return document.toJS();
};

const validateActionReferences = (source, relativePath, issues) => {
	for (const [index, line] of source.split(/\r?\n/).entries()) {
		const match = line.match(/^\s*uses:\s*([^\s#]+)(?:\s+#\s*(.+))?\s*$/);
		if (!match || match[1].startsWith('./')) continue;

		const reference = match[1];
		const atIndex = reference.lastIndexOf('@');
		const revision = atIndex >= 0 ? reference.slice(atIndex + 1) : '';
		if (!/^[0-9a-f]{40}$/i.test(revision)) {
			issues.push(
				`${relativePath}:${index + 1}: external Action references must use an immutable 40-character commit SHA.`,
			);
		}
		if (!/^v\d+(?:\.\d+){1,2}(?:[-+][0-9A-Za-z.-]+)?$/.test(String(match[2] || '').trim())) {
			issues.push(
				`${relativePath}:${index + 1}: pinned external Actions must retain a release-version comment.`,
			);
		}
	}
};

const validateDependabotPolicy = (issues) => {
	const relativePath = '.github/dependabot.yml';
	if (!fs.existsSync(dependabotPath)) {
		issues.push(`${relativePath}: configure GitHub Actions dependency updates.`);
		return;
	}

	const config = parseYamlFile(dependabotPath, relativePath, issues);
	const actionsUpdate = (config?.updates || []).find(
		(update) => update?.['package-ecosystem'] === 'github-actions',
	);
	if (!actionsUpdate) {
		issues.push(`${relativePath}: configure the github-actions package ecosystem.`);
		return;
	}
	if (actionsUpdate.directory !== '/') {
		issues.push(`${relativePath}: GitHub Actions updates must cover the repository root.`);
	}
	if (actionsUpdate['target-branch'] !== 'beta') {
		issues.push(`${relativePath}: GitHub Actions updates must enter through Beta.`);
	}
	if (actionsUpdate.schedule?.interval !== 'weekly') {
		issues.push(`${relativePath}: GitHub Actions updates must run weekly.`);
	}
};

const validateWorkflowPolicy = () => {
	const issues = [];
	const workflowFiles = fs
		.readdirSync(workflowDirectory)
		.filter((file) => /\.ya?ml$/i.test(file))
		.sort();

	for (const file of workflowFiles) {
		const relativePath = `.github/workflows/${file}`;
		const source = fs.readFileSync(path.join(workflowDirectory, file), 'utf8');
		const workflow = parseYamlFile(
			path.join(workflowDirectory, file),
			relativePath,
			issues,
		);
		if (!workflow || typeof workflow !== 'object') continue;

		if (!workflow.permissions) {
			issues.push(`${relativePath}: declare explicit top-level permissions.`);
		} else {
			if (workflow.permissions.contents !== 'read') {
				issues.push(`${relativePath}: top-level contents permission must be read-only.`);
			}
			for (const [permission, access] of Object.entries(workflow.permissions)) {
				if (access === 'write') {
					issues.push(
						`${relativePath}: top-level ${permission} write access must move to the specific job that needs it.`,
					);
				}
			}
		}

		validateActionReferences(source, relativePath, issues);

		for (const [jobName, job] of Object.entries(workflow.jobs || {})) {
			if (job?.['runs-on'] && !job?.['timeout-minutes']) {
				issues.push(`${relativePath}: job ${jobName} must declare timeout-minutes.`);
			}
		}

		if (/\bCI:\s*false\b/.test(source)) {
			issues.push(`${relativePath}: CI builds may not suppress warning failures with CI: false.`);
		}
	}

	for (const actionPath of listYamlFiles(actionDirectory)) {
		const relativePath = path.relative(repositoryRoot, actionPath).replace(/\\/g, '/');
		const source = fs.readFileSync(actionPath, 'utf8');
		parseYamlFile(actionPath, relativePath, issues);
		validateActionReferences(source, relativePath, issues);
	}

	validateDependabotPolicy(issues);

	return issues;
};

if (require.main === module) {
	const issues = validateWorkflowPolicy();
	if (issues.length > 0) {
		for (const issue of issues) console.error(issue);
		process.exit(1);
	}
	console.log('GitHub Actions workflow policy validation passed.');
}

module.exports = {
	validateActionReferences,
	validateWorkflowPolicy,
};
