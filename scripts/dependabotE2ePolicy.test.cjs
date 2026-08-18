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

test('runs isolated activation coverage for Beta and release pull requests', () => {
	assert.match(
		workflow,
		/github\.event\.pull_request\.base\.ref \}\}" == "beta"[\s\S]*github\.event\.pull_request\.head\.ref \}\}" == "release\/next"[\s\S]*SUITE="activation"/,
	);
	assert.match(workflow, /E2E_DEMO_EMAIL: \$\{\{ secrets\.E2E_DEMO_EMAIL \}\}/);
	assert.match(
		workflow,
		/command=yarn e2e:smoke:chrome && yarn e2e:activation:chrome/,
	);
	assert.match(
		workflow,
		/E2E_TEST_EMAIL="\$E2E_ACTIVATION_EMAIL" yarn cleanup:test-data/,
	);
	assert.match(workflow, /if: always\(\)[^\n]*suite == 'activation'/);
});
