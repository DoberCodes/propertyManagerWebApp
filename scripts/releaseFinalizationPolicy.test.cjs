const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');

test('Main produces Beta backend readiness before release alignment', () => {
	const deployment = read('.github/workflows/firebase-deploy-environments.yml');
	assert.match(deployment, /beta-backend-readiness:\s+name: Beta backend readiness/);
	assert.match(
		deployment,
		/needs: \[beta-backend-readiness, build-check, deploy\]/,
	);
	assert.match(
		deployment,
		/needs\.beta-backend-readiness\.result == 'success'/,
	);
});

test('manual Main-to-Beta alignment establishes backend readiness first', () => {
	const alignment = read('.github/workflows/align-beta-with-main.yml');
	assert.match(alignment, /beta-backend-readiness:\s+name: Beta backend readiness/);
	assert.match(alignment, /needs: beta-backend-readiness/);
});

test('release publication uses the approved prepared-version notes', () => {
	const finalizer = read('.github/workflows/finalize-web-release.yml');
	assert.match(finalizer, /--version "\$VERSION"/);
	assert.match(finalizer, /--allow-empty/);
	assert.match(finalizer, /extractReleasePullRequestNotes\.cjs/);
	assert.match(finalizer, /Reconcile existing GitHub Release notes/);

	const releasePrep = read('.github/workflows/release-prep.yml');
	assert.match(releasePrep, /maintley-customer-release-notes:start/);
	assert.match(releasePrep, /maintley-customer-release-notes:end/);
});
