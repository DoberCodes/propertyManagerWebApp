const fs = require('node:fs');
const path = require('node:path');
const { parseDocument } = require('yaml');

const repositoryRoot = path.resolve(__dirname, '..');
const workflowDirectory = path.join(repositoryRoot, '.github', 'workflows');

const validateWorkflowPolicy = () => {
	const issues = [];
	const workflowFiles = fs
		.readdirSync(workflowDirectory)
		.filter((file) => /\.ya?ml$/i.test(file))
		.sort();

	for (const file of workflowFiles) {
		const relativePath = `.github/workflows/${file}`;
		const source = fs.readFileSync(path.join(workflowDirectory, file), 'utf8');
		const document = parseDocument(source);

		for (const error of document.errors) {
			issues.push(`${relativePath}: invalid YAML: ${error.message}`);
		}

		const workflow = document.toJS();
		if (!workflow || typeof workflow !== 'object') continue;

		if (!workflow.permissions) {
			issues.push(`${relativePath}: declare explicit top-level permissions.`);
		}

		for (const [jobName, job] of Object.entries(workflow.jobs || {})) {
			if (job?.['runs-on'] && !job?.['timeout-minutes']) {
				issues.push(`${relativePath}: job ${jobName} must declare timeout-minutes.`);
			}
		}

		if (/\bCI:\s*false\b/.test(source)) {
			issues.push(`${relativePath}: CI builds may not suppress warning failures with CI: false.`);
		}
	}

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
	validateWorkflowPolicy,
};
