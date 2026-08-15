const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const workflow = fs.readFileSync(
	path.resolve(__dirname, '..', '.github', 'workflows', 'e2e-tests.yml'),
	'utf8',
);

test('limits credential-free E2E handling to GitHub Actions Dependabot pull requests', () => {
	assert.match(
		workflow,
		/github\.event\.pull_request\.user\.login == 'dependabot\[bot\]'/,
	);
	assert.match(
		workflow,
		/startsWith\(github\.head_ref, 'dependabot\/github_actions\/'\)/,
	);
	assert.match(workflow, /Validate e2e environment\s+if: env\.DEPENDABOT_ACTIONS_PR != 'true'/);
});

test('validates workflow policy without installing browsers for Actions updates', () => {
	assert.match(
		workflow,
		/actions\)\s+echo "command=yarn validate:workflows"[\s\S]*echo "browsers=none"/,
	);
	assert.match(workflow, /Install Playwright browsers\s+if: steps\.suite\.outputs\.browsers != 'none'/);
});

test('retains authenticated Chromium smoke coverage for ordinary pull requests', () => {
	assert.match(
		workflow,
		/elif \[\[ "\$\{\{ github\.event_name \}\}" == "pull_request" \]\]; then\s+SUITE="smoke"/,
	);
	assert.match(workflow, /E2E_DEMO_EMAIL: \$\{\{ secrets\.E2E_DEMO_EMAIL \}\}/);
	assert.match(workflow, /command=yarn e2e:smoke:chrome/);
});
