const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const manifest = fs.readFileSync(
	path.join(projectRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
	'utf8',
);
const networkSecurity = fs.readFileSync(
	path.join(
		projectRoot,
		'android',
		'app',
		'src',
		'main',
		'res',
		'xml',
		'network_security_config.xml',
	),
	'utf8',
);

test('Android release does not expose app data to OS backup', () => {
	assert.match(manifest, /android:allowBackup="false"/);
});

test('Android cleartext exceptions are restricted to local development hosts', () => {
	const domains = [...networkSecurity.matchAll(/<domain[^>]*>([^<]+)<\/domain>/g)]
		.map((match) => match[1].trim())
		.sort();
	assert.deepEqual(domains, ['10.0.2.2', '127.0.0.1', 'localhost']);
	assert.doesNotMatch(networkSecurity, /<base-config[^>]*cleartextTrafficPermitted="true"/);
});

test('only the launcher activity is exported', () => {
	const exportedActivities = [
		...manifest.matchAll(/<activity[\s\S]*?android:exported="true"[\s\S]*?<\/activity>/g),
	];
	assert.equal(exportedActivities.length, 1);
	assert.match(exportedActivities[0][0], /android:name="\.MainActivity"/);
});
