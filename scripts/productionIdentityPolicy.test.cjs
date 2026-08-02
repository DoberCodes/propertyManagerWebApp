const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');
const readWorkflow = (name) =>
	fs.readFileSync(path.join(repositoryRoot, '.github', 'workflows', name), 'utf8');

test('production WIF remains a read-only Main canary before deploy cutover', () => {
	const canary = readWorkflow('verify-production-deployment-identity.yml');
	assert.match(canary, /environment:\s+production/);
	assert.match(canary, /id-token:\s+write/);
	assert.match(
		canary,
		/workload_identity_provider:\s+\$\{\{ vars\.PROD_GOOGLE_WORKLOAD_IDENTITY_PROVIDER \}\}/,
	);
	assert.match(
		canary,
		/service_account:\s+\$\{\{ vars\.PROD_GOOGLE_SERVICE_ACCOUNT \}\}/,
	);
	assert.match(canary, /GITHUB_REF.*refs\/heads\/main/);

	const deploy = readWorkflow('firebase-deploy-environments.yml');
	assert.match(
		deploy,
		/credentials_json:\s+\$\{\{ secrets\.FIREBASE_SERVICE_ACCOUNT_JSON \}\}/,
	);
	assert.doesNotMatch(deploy, /vars\.PROD_GOOGLE_WORKLOAD_IDENTITY_PROVIDER/);
});
